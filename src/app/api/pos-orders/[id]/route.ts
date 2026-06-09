import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { recordDriverActivity } from '@/lib/incentive-utils';
import { createNotification } from '@/lib/notificationService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // No session required — tablets need to poll order status without auth

    const order = await prisma.posOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) return apiError(new Error('Order not found'), 404);

    return apiResponse(order);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { status, driverId, preparationTime, onlinePaymentReference } = body;

    const existingOrder = await prisma.posOrder.findUnique({
      where: { id }
    });
    const isDelivery = existingOrder?.orderType === 'DELIVERY';

    const dataToUpdate: any = {};
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === 'PAYMENT_AWAITING_APPROVAL' && session?.id) {
        dataToUpdate.servedById = session.id;
      }
    }
    if (onlinePaymentReference !== undefined) {
      dataToUpdate.onlinePaymentReference = onlinePaymentReference;
    }
    if (preparationTime !== undefined) {
      dataToUpdate.preparationTime = parseInt(preparationTime, 10) || 15;
    }
    
    if (driverId !== undefined) {
      if (isDelivery) {
        dataToUpdate.deliveryRiderId = driverId || null;
        dataToUpdate.driverId = null;
      } else {
        dataToUpdate.driverId = driverId || null;
        dataToUpdate.deliveryRiderId = null;
      }
    }

    const order = await prisma.posOrder.update({
      where: { id },
      data: dataToUpdate,
      include: { driver: true, deliveryRider: true }
    });

    // --- Sync KOT Ticket Status ---
    if (status === 'SERVED' || status === 'COMPLETED' || status === 'PAID') {
      await prisma.kotTicket.updateMany({
        where: { orderId: id, status: { notIn: ['SERVED', 'CANCELLED'] } },
        data: { status: 'SERVED' }
      });
      await prisma.kotItem.updateMany({
        where: { kot: { orderId: id }, status: { notIn: ['SERVED', 'CANCELLED'] } },
        data: { status: 'SERVED' }
      });
    }

    // --- Incentive Engine Integration ---
    if ((status === 'COMPLETED' || status === 'PAID') && order.driverId) {
       await recordDriverActivity(order.driverId, 'RIDE');
    }

    // --- Notification Integration ---
    try {
      if (status === 'BILL_PRINTED' || status === 'PENDING') {
        await createNotification({
          propertyId: order.propertyId,
          title: status === 'BILL_PRINTED' ? 'Payment Requested' : 'Order Pending',
          message: `Action required for Order ${order.orderNo} at ${order.tableNo ? 'Table ' + order.tableNo : 'POS'}`,
          type: 'PAYMENT',
          priority: 'HIGH',
          metadata: {
            orderId: order.id,
            status,
            link: `/billing?orderId=${order.id}`
          }
        });
      }
    } catch (notifError) {
      console.error('[Order Notification] error:', notifError);
    }

    return apiResponse(order, 'Order status updated');
  } catch (error) {
    return apiError(error);
  }
}
