import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const propertyId = session.propertyId;

    // Today's date boundary
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Fetch property info (for logo, name, etc.)
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        brandName: true,
        logoUrl: true,
        phone: true,
        address: true,
      },
    });

    // Fetch today's delivery orders (from QR delivery page — they have deliveryCustomerName set)
    const orders = await prisma.posOrder.findMany({
      where: {
        propertyId,
        orderType: { in: ['DELIVERY', 'TAKEAWAY'] },
        // Only QR-origin orders have deliveryCustomerName populated
        deliveryCustomerName: { not: null },
        createdAt: { gte: todayStart },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                sellingPrice: true,
              },
            },
          },
        },
        deliveryRider: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            vehicleNumber: true,
            vehicleType: true,
          },
        },
        deliveryZone: {
          select: {
            id: true,
            name: true,
            deliveryFee: true,
          },
        },
        outlet: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute today's stats
    const activeStatuses = ['OPEN', 'PENDING', 'PLACED', 'ACCEPTED', 'KOT_RUNNING', 'IN_KITCHEN', 'READY', 'OUT_FOR_DELIVERY'];
    const deliveredStatuses = ['SETTLED', 'COMPLETED'];
    const ordersArr = orders as any[];

    const stats = {
      totalOrders: ordersArr.length,
      newOrders: ordersArr.filter((o: any) => ['OPEN', 'PENDING', 'PLACED'].includes(o.status)).length,
      acceptedOrders: ordersArr.filter((o: any) => ['ACCEPTED', 'KOT_RUNNING'].includes(o.status)).length,
      preparingOrders: ordersArr.filter((o: any) => ['IN_KITCHEN', 'READY'].includes(o.status)).length,
      outForDelivery: ordersArr.filter((o: any) => o.status === 'OUT_FOR_DELIVERY').length,
      deliveredOrders: ordersArr.filter((o: any) => deliveredStatuses.includes(o.status)).length,
      cancelledOrders: ordersArr.filter((o: any) => o.status === 'CANCELLED').length,
      activeOrders: ordersArr.filter((o: any) => activeStatuses.includes(o.status)).length,
      todaySales: ordersArr
        .filter((o: any) => deliveredStatuses.includes(o.status))
        .reduce((sum: number, o: any) => sum + (o.grandTotal || 0), 0),
      codPending: ordersArr.filter(
        (o: any) =>
          activeStatuses.includes(o.status) &&
          !o.isPrepaid &&
          o.deliveryPaymentMethod === 'CASH'
      ).length,
    };

    return apiResponse({ property, orders: ordersArr, stats }, 'Delivery display data fetched');
  } catch (error) {
    return apiError(error);
  }
}

// PATCH — update order status from the delivery display
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return apiError(new Error('orderId and status are required'), 400);
    }

    const allowedStatuses = [
      'ACCEPTED',
      'IN_KITCHEN',
      'OUT_FOR_DELIVERY',
      'SETTLED',
      'CANCELLED',
    ];

    if (!allowedStatuses.includes(status)) {
      return apiError(new Error('Invalid status'), 400);
    }

    // Ensure the order belongs to this property
    const order = await prisma.posOrder.findFirst({
      where: { id: orderId, propertyId: session.propertyId },
    });

    if (!order) {
      return apiError(new Error('Order not found'), 404);
    }

    const updated = await prisma.posOrder.update({
      where: { id: orderId },
      data: { status },
    });

    return apiResponse(updated, 'Order status updated');
  } catch (error) {
    return apiError(error);
  }
}
