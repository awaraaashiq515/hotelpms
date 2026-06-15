import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) return apiError(new Error('orderId is required'), 400);

    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNo: true,
        status: true,
        orderType: true,
        grandTotal: true,
        deliveryCustomerName: true,
        deliveryAddress: true,
        deliveryLat: true,
        deliveryLng: true,
        deliveryInstructions: true,
        scheduledFor: true,
        isContactless: true,
        createdAt: true,
        updatedAt: true,
        deliveryZoneId: true,
        deliveryRider: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            vehicleNumber: true,
            deliveryLat: true,
            deliveryLng: true,
          }
        },
        deliveryZone: {
          select: {
            name: true,
            etaMinutes: true,
            deliveryFee: true,
          }
        },
        items: {
          select: {
            quantity: true,
            totalAmount: true,
            product: { select: { name: true } }
          }
        }
      }
    });

    if (!order) return apiError(new Error('Order not found'), 404);

    // Determine estimated delivery time
    const statusTimes: Record<string, number> = {
      PLACED: 0,
      ACCEPTED: 2,
      IN_KITCHEN: 5,
      READY: 20,
      OUT_FOR_DELIVERY: 30,
      SETTLED: 0,
    };

    const etaBase = (order as any).deliveryZone?.etaMinutes || 30;
    const statusOffset = statusTimes[order.status] || 10;
    const orderAge = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    const estimatedMinutesRemaining = Math.max(0, etaBase - orderAge + statusOffset);

    return apiResponse({
      ...order,
      estimatedMinutesRemaining,
    }, 'Order status fetched');
  } catch (error) {
    return apiError(error);
  }
}
