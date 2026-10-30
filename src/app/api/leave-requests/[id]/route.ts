import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// PATCH — approve or reject a leave request
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.organizationId) return apiError(new Error('Unauthorized'), 401);

    const { id } = await context.params;
    const { status } = await request.json();
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return apiError(new Error('Status must be APPROVED or REJECTED'), 400);
    }

    // Verify it belongs to this property or organization
    const existing = await (prisma as any).leaveRequest.findUnique({
      where: { id },
      select: { propertyId: true, property: { select: { organizationId: true } } },
    });
    if (!existing) return apiError(new Error('Leave request not found'), 404);
    if (session.organizationId && existing.property?.organizationId !== session.organizationId) {
      return apiError(new Error('Forbidden'), 403);
    }

    const updated = await (prisma as any).leaveRequest.update({
      where: { id },
      data: {
        status,
        approvedBy: session.email || 'Manager',
      },
      include: {
        staff: { select: { id: true, name: true, designation: true } },
      },
    });

    // Mark related leave notification as read
    try {
      const notifs = await prisma.notification.findMany({
        where: {
          propertyId: existing.propertyId,
          type: 'STAFF_LEAVE',
          status: 'UNREAD',
        },
      });
      for (const n of notifs) {
        if (n.metadata && n.metadata.includes(id)) {
          await prisma.notification.update({
            where: { id: n.id },
            data: { status: 'READ' },
          });
        }
      }
    } catch (_) {}

    return apiResponse(updated, `Leave request ${status.toLowerCase()}`);
  } catch (err) {
    return apiError(err);
  }
}

// DELETE — remove a leave request (optional admin action)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session?.organizationId) return apiError(new Error('Unauthorized'), 401);

    const { id } = await context.params;
    await (prisma as any).leaveRequest.delete({ where: { id } });
    return apiResponse(null, 'Leave request deleted');
  } catch (err) {
    return apiError(err);
  }
}
