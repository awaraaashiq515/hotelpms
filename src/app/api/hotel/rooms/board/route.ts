import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getCanonicalHotelStatus } from '@/lib/hotel/room-status-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const propertyCodeParam = searchParams.get('propertyCode');

    let propertyId = propertyIdParam || session.propertyId;

    if (propertyCodeParam) {
      const codeProp = await prisma.property.findFirst({
        where: {
          OR: [
            { code: propertyCodeParam },
            { code: propertyCodeParam.toUpperCase() },
            { code: propertyCodeParam.toLowerCase() },
          ],
        },
        select: { id: true },
      });
      if (codeProp) propertyId = codeProp.id;
    }
    if (!propertyId && session.role === 'RESTAURANTS_ADMIN') {
      propertyId = await resolveAdminProperty(session, prisma);
    }
    if (!propertyId && session.organizationId) {
      const firstProp = await prisma.property.findFirst({
        where: { organizationId: session.organizationId },
        select: { id: true },
      });
      propertyId = firstProp?.id || null;
    }

    if (!propertyId) {
      return apiError(new Error('No property context found.'), 400);
    }

    const property = await prisma.property.findUnique({ where: { id: propertyId } }).catch(() => null);
    const hotelName = property?.name || 'Grand Luxury Hotel & Resort';
    const hotelAddress = [property?.address, property?.city, property?.state].filter(Boolean).join(', ') || 'Hotel PMS Property & Suites';

    // Canonical single source of truth
    const canonical = await getCanonicalHotelStatus(propertyId);

    const roomTypes = await prisma.roomType.findMany({ where: { propertyId } });
    const floorSet = new Set<number>();
    canonical.rooms.forEach((r) => floorSet.add(r.floor));

    const floors = Array.from(floorSet).sort((a, b) => a - b);
    if (floors.length === 0) floors.push(1);

    const mappedRoomTypes = roomTypes.map((rt) => ({
      id: rt.id,
      name: rt.name,
      code: rt.code,
    }));

    const enrichedSummary = {
      ...canonical.summary,
      hotelName,
      hotelAddress,
    };

    return apiResponse({
      summary: enrichedSummary,
      rooms: canonical.rooms,
      floors,
      roomTypes: mappedRoomTypes,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const {
      roomId,
      status,
      housekeepingStatus,
      maintenanceStatus,
      isVIP,
      isDND,
      bulkAction,
      roomIds,
    } = body;

    // Handle Bulk Action
    if (bulkAction && Array.isArray(roomIds) && roomIds.length > 0) {
      if (bulkAction === 'MARK_ALL_CLEAN') {
        await prisma.room.updateMany({
          where: { id: { in: roomIds } },
          data: { housekeepingStatus: 'CLEAN', status: 'AVAILABLE' },
        });
      } else if (bulkAction === 'MARK_ALL_DIRTY') {
        await prisma.room.updateMany({
          where: { id: { in: roomIds } },
          data: { housekeepingStatus: 'DIRTY' },
        });
      } else if (bulkAction === 'MARK_ALL_IN_PROGRESS') {
        await prisma.room.updateMany({
          where: { id: { in: roomIds } },
          data: { housekeepingStatus: 'IN_PROGRESS' },
        });
      }
      return apiResponse({ success: true, message: `Bulk action ${bulkAction} applied to ${roomIds.length} rooms` });
    }

    if (!roomId) {
      return apiError(new Error('Room ID is required'), 400);
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        status: status || undefined,
        housekeepingStatus: housekeepingStatus || undefined,
        maintenanceStatus: maintenanceStatus || undefined,
        isVIP: isVIP !== undefined ? Boolean(isVIP) : undefined,
        isDND: isDND !== undefined ? Boolean(isDND) : undefined,
      },
    });

    return apiResponse({ success: true, data: updated });
  } catch (error) {
    return apiError(error);
  }
}
