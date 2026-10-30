import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const propertyParam = searchParams.get('propertyId') || searchParams.get('propertyCode') || session?.propertyId;

    if (!propertyParam) {
      return apiError(new Error('Property identifier is required'), 400);
    }

    const prop = await resolvePropertyIdentifier(propertyParam, session);
    if (!prop) {
      return apiError(new Error('Property not found'), 404);
    }

    // Include sibling properties in the same organization (e.g. Hotel + Restaurant)
    let targetPropertyIds = [prop.id];
    const fullProp = await prisma.property.findUnique({
      where: { id: prop.id },
      select: { id: true, name: true, code: true, type: true, organizationId: true },
    });

    if (fullProp?.organizationId) {
      const siblings = await prisma.property.findMany({
        where: { organizationId: fullProp.organizationId },
        select: { id: true },
      });
      targetPropertyIds = siblings.map((s) => s.id);
    }

    const statusParam = searchParams.get('status');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const where: any = {
      propertyId: { in: targetPropertyIds },
    };

    if (statusParam && statusParam !== 'ALL') {
      where.status = statusParam;
      if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(statusParam)) {
        where.createdAt = { gte: today };
      } else {
        where.createdAt = { gte: twoDaysAgo };
      }
    } else {
      where.status = { in: ['NEW', 'PREPARING', 'READY'] };
      where.createdAt = { gte: twoDaysAgo };
    }

    const kots = await prisma.kotTicket.findMany({
      where,
      include: {
        order: {
          select: {
            orderNo: true,
            orderType: true,
            tableNo: true,
            roomId: true,
            createdAt: true,
            guest: {
              select: {
                firstName: true,
                lastName: true,
                mobile: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            floor: {
              select: {
                name: true,
              },
            },
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });

    // Lookup room numbers for any orders with roomId
    const roomIds = Array.from(
      new Set(
        kots
          .map((k) => k.roomId || k.order?.roomId)
          .filter(Boolean) as string[]
      )
    );

    let roomMap = new Map<string, { roomNumber: string; floor?: string | null }>();
    if (roomIds.length > 0) {
      const rooms = await prisma.room.findMany({
        where: { id: { in: roomIds } },
        select: { id: true, roomNumber: true, floor: true },
      });
      rooms.forEach((r) => roomMap.set(r.id, { roomNumber: r.roomNumber, floor: r.floor }));
    }

    const enrichedKots = kots.map((k) => {
      const rId = k.roomId || k.order?.roomId;
      const roomInfo = rId ? roomMap.get(rId) : null;
      return {
        ...k,
        room: roomInfo || null,
      };
    });

    return apiResponse(enrichedKots);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { kotId, status, changedBy = 'Kitchen Staff', remarks } = body;

    if (!kotId || !status) {
      return apiError(new Error('kotId and status are required'), 400);
    }

    const existingKot = await prisma.kotTicket.findUnique({
      where: { id: kotId },
    });

    if (!existingKot) {
      return apiError(new Error('KOT ticket not found'), 404);
    }

    const oldStatus = existingKot.status;

    // Update status of KOT ticket
    const updatedKot = await prisma.kotTicket.update({
      where: { id: kotId },
      data: {
        status,
        updatedAt: new Date(),
      },
      include: {
        items: true,
      },
    });

    // Record status log
    try {
      await prisma.kotStatusLog.create({
        data: {
          kotId,
          oldStatus,
          newStatus: status,
          changedBy: changedBy || (session as any)?.user?.name || (session as any)?.fullName || session?.email || 'Kitchen Staff',
          remarks: remarks || `Status changed from ${oldStatus} to ${status}`,
        },
      });
    } catch (logErr) {
      console.warn('Failed to record KOT status log:', logErr);
    }

    // Also update individual kot items if the whole ticket is moved to PREPARING or READY
    if (status === 'PREPARING' || status === 'READY' || status === 'SERVED') {
      try {
        await prisma.kotItem.updateMany({
          where: { kotId },
          data: { status },
        });
      } catch (itemErr) {
        console.warn('Failed to update individual KOT items:', itemErr);
      }
    }

    return apiResponse(updatedKot, `KOT status updated to ${status}`);
  } catch (error) {
    return apiError(error);
  }
}

