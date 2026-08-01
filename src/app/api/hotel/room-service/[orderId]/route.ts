import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// PATCH — Update order status (PREPARING, READY, DELIVERED, CANCELLED)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { orderId } = await params;
    const { status } = await request.json();

    const VALID_STATUSES = ['CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'];
    if (!VALID_STATUSES.includes(status)) {
      return apiError(new Error(`Invalid status: ${status}`), 400);
    }

    const updated = await prisma.posOrder.update({
      where: { id: orderId },
      data: { status },
      select: { id: true, status: true, orderNo: true },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Order ${updated.orderNo} marked as ${status}`,
    });
  } catch (error) {
    return apiError(error);
  }
}

// GET — Single order detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { orderId } = await params;
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true, isVeg: true } } } },
        guest: { select: { firstName: true, lastName: true } },
      },
    });

    if (!order) return apiError(new Error('Order not found'), 404);
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return apiError(error);
  }
}
