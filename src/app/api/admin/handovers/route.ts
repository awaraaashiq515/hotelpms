import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// GET all handovers for a property or organization
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') || session.propertyId;

    const handovers = await prisma.riderCashHandover.findMany({
      where: propertyId ? { propertyId } : { property: { organizationId: session.organizationId } },
      include: {
        rider: { select: { fullName: true, phone: true, vehicleNumber: true } },
        orders: { select: { id: true, orderNo: true, grandTotal: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Format for easy listing
    const formatted = handovers.map((h: any) => ({
      id: h.id,
      riderName: h.rider?.fullName || 'Unknown Rider',
      riderPhone: h.rider?.phone || 'No phone',
      vehicleNumber: h.rider?.vehicleNumber || '—',
      totalCodAmount: h.totalCodAmount,
      totalTipAmount: h.totalTipAmount,
      reportedCash: h.reportedCash,
      status: h.status,
      submittedAt: h.submittedAt.toISOString(),
      resolvedAt: h.resolvedAt ? h.resolvedAt.toISOString() : null,
      resolvedBy: h.resolvedBy,
      notes: h.notes,
      orderCount: h.orders.length
    }));

    return apiResponse(formatted, 'Handovers fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}

// PUT approve or reject handover request
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { handoverId, status, notes } = body;

    if (!handoverId || !status) {
      return apiError(new Error('handoverId and status are required'), 400);
    }

    if (status !== 'APPROVED' && status !== 'REJECTED') {
      return apiError(new Error('Status must be APPROVED or REJECTED'), 400);
    }

    const handover = await prisma.riderCashHandover.findUnique({
      where: { id: handoverId }
    });

    if (!handover) return apiError(new Error('Handover record not found'), 404);
    if (handover.status !== 'PENDING') return apiError(new Error('Handover request already resolved'), 400);

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { fullName: true }
    });
    const resolverName = user?.fullName || session.email;

    const updated = await prisma.$transaction(async (tx: any) => {
      const h = await tx.riderCashHandover.update({
        where: { id: handoverId },
        data: {
          status,
          notes,
          resolvedAt: new Date(),
          resolvedBy: resolverName
        }
      });

      if (status === 'REJECTED') {
        // Revert linked orders handover association
        await tx.posOrder.updateMany({
          where: { riderHandoverId: handoverId },
          data: { riderHandoverId: null }
        });
      }
      return h;
    });

    return apiResponse(updated, `Handover request ${status.toLowerCase()} successfully`);
  } catch (error) {
    return apiError(error);
  }
}
