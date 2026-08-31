import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import type { RoomBoardItem, RoomBoardGuestInfo, RoomOperationalStatus, HousekeepingStatus, MaintenanceStatus } from '@/types/hotel/room-board.types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    let propertyId = propertyIdParam || session.propertyId;
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

    const where = propertyId ? { propertyId } : {};

    const property = propertyId
      ? await prisma.property.findUnique({ where: { id: propertyId } }).catch(() => null)
      : null;
    const hotelName = property?.name || 'Grand Luxury Hotel & Resort';
    const hotelAddress = [property?.address, property?.city, property?.state].filter(Boolean).join(', ') || 'Hotel PMS Property & Suites';

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Parallel fetch
    const [rooms, roomTypes, activeReservations, housekeepingTasks] = await Promise.all([
      prisma.room.findMany({
        where,
        include: { roomType: true },
        orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
      }),
      prisma.roomType.findMany({ where }),
      prisma.reservation.findMany({
        where: {
          ...where,
          status: { in: ['CHECKED_IN', 'CONFIRMED'] },
        },
        include: {
          guest: true,
          rooms: { include: { room: true } },
        },
      }).catch(() => []),
      prisma.housekeepingTask.findMany({
        where: { ...where, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }).catch(() => []),
    ]);

    // Map active reservations to room IDs
    const roomToReservationMap = new Map<string, RoomBoardGuestInfo>();
    let arrivalsTodayCount = 0;
    let departuresTodayCount = 0;

    activeReservations.forEach((res) => {
      const arr = new Date(res.arrivalDate);
      const dep = new Date(res.departureDate);

      if (arr >= todayStart && arr <= todayEnd) arrivalsTodayCount++;
      if (dep >= todayStart && dep <= todayEnd) departuresTodayCount++;

      const guestName = res.guest
        ? `${res.guest.firstName} ${res.guest.lastName || ''}`.trim()
        : 'Guest Customer';

      const guestInfo: RoomBoardGuestInfo = {
        reservationId: res.id,
        bookingNo: res.bookingNo,
        guestId: res.guestId,
        guestName,
        phone: res.guest?.mobile || undefined,
        email: res.guest?.email || undefined,
        arrivalDate: res.arrivalDate.toISOString().split('T')[0],
        departureDate: res.departureDate.toISOString().split('T')[0],
        totalAmount: res.totalAmount || 0,
        dueAmount: res.dueAmount || 0,
        adults: res.adults || 1,
        children: res.children || 0,
        specialRequests: (res as any).addOnNotes || undefined,
        status: res.status,
      };

      if (res.rooms && res.rooms.length > 0) {
        res.rooms.forEach((rr) => {
          if (rr.roomId) {
            roomToReservationMap.set(rr.roomId, guestInfo);
          }
        });
      }
    });

    // Map tasks to room IDs
    const roomToTaskMap = new Map<string, { staffName: string }>();
    housekeepingTasks.forEach((task) => {
      if (task.roomId && task.assignedTo) {
        roomToTaskMap.set(task.roomId, { staffName: task.assignedTo });
      }
    });

    const floorSet = new Set<number>();

    const mappedRooms: RoomBoardItem[] = rooms.map((r) => {
      const fl = parseInt(String(r.floor || '1')) || 1;
      floorSet.add(fl);

      const activeGuest = roomToReservationMap.get(r.id) || null;
      const taskInfo = roomToTaskMap.get(r.id);

      return {
        id: r.id,
        roomNumber: r.roomNumber,
        floor: fl,
        status: (r.status as RoomOperationalStatus) || (activeGuest ? 'OCCUPIED' : 'AVAILABLE'),
        housekeepingStatus: (r.housekeepingStatus as HousekeepingStatus) || 'CLEAN',
        maintenanceStatus: (r.maintenanceStatus as MaintenanceStatus) || 'OK',
        isVIP: r.isVIP || false,
        isDND: false,
        keycardIssued: Boolean(activeGuest),
        customRate: r.customRate ? Number(r.customRate) : null,
        roomTypeId: r.roomTypeId,
        roomTypeName: r.roomType?.name || 'Standard Room',
        roomTypeCode: r.roomType?.code || 'STD',
        baseRate: r.roomType?.baseRate || 3500,
        maxOccupancy: r.roomType?.maxOccupancy || 2,
        activeGuest,
        assignedStaffName: taskInfo?.staffName || null,
        lastCleanedAt: (r as any).updatedAt ? (r as any).updatedAt.toISOString() : null,
      };
    });

    const totalRooms = mappedRooms.length || 1;
    const occupiedCount = mappedRooms.filter((r) => r.status === 'OCCUPIED' || r.activeGuest !== null).length;
    const vacantCleanCount = mappedRooms.filter((r) => r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN' && !r.activeGuest).length;
    const vacantDirtyCount = mappedRooms.filter((r) => r.housekeepingStatus === 'DIRTY').length;
    const inProgressCount = mappedRooms.filter((r) => r.housekeepingStatus === 'IN_PROGRESS').length;
    const inspectionPendingCount = mappedRooms.filter((r) => r.housekeepingStatus === 'INSPECTION_PENDING').length;
    const outOfOrderCount = mappedRooms.filter((r) => r.status === 'OUT_OF_ORDER' || r.maintenanceStatus === 'UNDER_MAINTENANCE').length;
    const occupancyPct = Math.round((occupiedCount / totalRooms) * 100);

    const summary = {
      totalRooms,
      occupiedCount,
      occupancyPct,
      vacantCleanCount,
      vacantDirtyCount,
      inProgressCount,
      inspectionPendingCount,
      outOfOrderCount,
      arrivalsTodayCount,
      departuresTodayCount,
      hotelName,
      hotelAddress,
    };

    const floors = Array.from(floorSet).sort((a, b) => a - b);
    if (floors.length === 0) floors.push(1);

    const mappedRoomTypes = roomTypes.map((rt) => ({
      id: rt.id,
      name: rt.name,
      code: rt.code,
    }));

    return apiResponse({
      summary,
      rooms: mappedRooms,
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
      },
    });

    return apiResponse({ success: true, data: updated });
  } catch (error) {
    return apiError(error);
  }
}
