import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

function getDeliveryOtp(orderId: string): string {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const otp = Math.abs(hash % 9000 + 1000);
  return otp.toString();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list-drivers') {
      const activeRiders = await prisma.driver.findMany({
        where: {
          vehicleType: 'BIKE',
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      });
      return apiResponse(activeRiders, 'Riders fetched successfully');
    }

    if (action === 'active-orders') {
      const driverId = searchParams.get('driverId');
      if (!driverId) {
        return apiError(new Error('driverId is required for active orders'), 400);
      }

      const activeOrders = await prisma.posOrder.findMany({
        where: {
          driverId,
          status: {
            in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'PAYMENT_AWAITING_APPROVAL']
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return apiResponse(activeOrders, 'Assigned orders fetched successfully');
    }

    return apiError(new Error('Invalid action parameter'), 400);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, driverId, otp } = body;

    if (!orderId || !driverId || !otp) {
      return apiError(new Error('Missing orderId, driverId or otp parameters'), 400);
    }

    // 1. Fetch order details
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return apiError(new Error('Order not found'), 404);
    }

    if (order.driverId !== driverId) {
      return apiError(new Error('This order is not assigned to this rider'), 400);
    }

    // 2. Validate deterministic OTP
    const expectedOtp = getDeliveryOtp(order.id);
    if (otp.trim() !== expectedOtp) {
      return apiError(new Error('Invalid customer OTP. Please check and try again.'), 400);
    }

    // 3. Complete and settle order
    const updatedOrder = await prisma.posOrder.update({
      where: { id: orderId },
      data: {
        status: 'SETTLED',
        updatedAt: new Date()
      }
    });

    return apiResponse(updatedOrder, 'Delivery verified and order completed successfully!');
  } catch (error) {
    return apiError(error);
  }
}
