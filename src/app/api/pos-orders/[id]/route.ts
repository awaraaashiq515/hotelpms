import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { recordDriverActivity } from '@/lib/incentive-utils';

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
    const { status } = body;

    const order = await prisma.posOrder.update({
      where: { id },
      data: { status },
    });

    // --- Incentive Engine Integration ---
    if ((status === 'COMPLETED' || status === 'PAID') && order.driverId) {
       await recordDriverActivity(order.driverId, 'RIDE');
    }

    return apiResponse(order, 'Order status updated');
  } catch (error) {
    return apiError(error);
  }
}
