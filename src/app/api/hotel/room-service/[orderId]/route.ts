import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

// Handler for status update & staff acknowledgment
async function handleUpdate(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    const wtUser = await getWTUserFromRequest(request);
    if (!session && !wtUser) return apiError(new Error('Unauthorized'), 401);

    const { orderId } = await params;
    const body = await request.json();
    const { status, servedById, staffMemberId, notes } = body;

    const VALID_STATUSES = [
      'CONFIRMED',
      'PREPARING',
      'IN_PROGRESS',
      'READY',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED',
      'ACKNOWLEDGED'
    ];

    const targetStatus = status === 'ACKNOWLEDGED' ? 'IN_PROGRESS' : status;

    if (targetStatus && !VALID_STATUSES.includes(targetStatus)) {
      return apiError(new Error(`Invalid status: ${targetStatus}`), 400);
    }

    const updateData: any = {};
    if (targetStatus) updateData.status = targetStatus;
    if (servedById || wtUser?.id) updateData.servedById = servedById || wtUser?.id;
    const resolvedStaffMemberId = staffMemberId || (wtUser as any)?.staffMember?.id || (wtUser as any)?.staffMemberId || null;
    if (resolvedStaffMemberId) updateData.staffMemberId = resolvedStaffMemberId;
    if (notes) updateData.specialNote = notes;

    const updated = await prisma.posOrder.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: { include: { product: { select: { name: true } } } },
        staffMember: { select: { name: true, designation: true } },
      },
    });

    // ── Stop 3-minute escalation: mark pending notifications for this order as read ──
    try {
      const pendingNotifs = await prisma.notification.findMany({
        where: {
          type: 'ROOM_SERVICE_ORDER',
          status: 'UNREAD',
        },
      });

      const matchingNotifIds = pendingNotifs
        .filter((n) => {
          if (!n.metadata) return false;
          try {
            const meta = typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata;
            return meta.orderId === orderId || meta.orderNo === updated.orderNo;
          } catch {
            return false;
          }
        })
        .map((n) => n.id);

      if (matchingNotifIds.length > 0) {
        await prisma.notification.updateMany({
          where: { id: { in: matchingNotifIds } },
          data: { status: 'READ' },
        });
      }
    } catch (notifErr) {
      console.error('[ROOM_SERVICE_UPDATE] Error clearing notification escalation:', notifErr);
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Order ${updated.orderNo} updated to ${updated.status}`,
    });
  } catch (error) {
    return apiError(error);
  }
}

// PATCH — Update order status
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  return handleUpdate(request, context);
}

// PUT — Also accept PUT for flexibility with staff app
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  return handleUpdate(request, context);
}

// GET — Single order detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getSession();
    const wtUser = await getWTUserFromRequest(request);
    if (!session && !wtUser) return apiError(new Error('Unauthorized'), 401);

    const { orderId } = await params;
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true, isVeg: true } } } },
        guest: { select: { firstName: true, lastName: true } },
        staffMember: { select: { name: true, designation: true } },
      },
    });

    if (!order) return apiError(new Error('Order not found'), 404);
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return apiError(error);
  }
}
