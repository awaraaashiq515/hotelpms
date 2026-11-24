import { prisma } from '@/lib/prisma';
import { HOTEL_TIMEZONE as DEFAULT_HOTEL_TZ, businessDate as getBizDate, startOfBusinessDay, endOfBusinessDay } from '@/lib/time';
import type {
  RoomBoardItem,
  RoomBoardGuestInfo,
  RoomOperationalStatus,
  HousekeepingStatus,
  MaintenanceStatus,
  RoomBoardSummary,
} from '@/types/hotel/room-board.types';

export const HOTEL_TIMEZONE = DEFAULT_HOTEL_TZ;

/**
 * Returns today's business date range normalized to Asia/Kolkata (Hotel Property Timezone).
 */
export function getHotelBusinessDate(baseDate: Date = new Date(), tz: string = HOTEL_TIMEZONE) {
  const dateString = getBizDate(tz, baseDate); // YYYY-MM-DD
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);

  const todayStart = startOfBusinessDay(tz, baseDate);
  const todayEnd = endOfBusinessDay(tz, baseDate);

  return {
    dateString,
    todayStart,
    todayEnd,
    year,
    month,
    day,
  };
}

export interface CanonicalRoomData {
  rooms: RoomBoardItem[];
  summary: RoomBoardSummary & {
    vacantCount: number;
    vacantDirtyCount: number;
    inProgressCount: number;
    maintenanceCount: number;
    stayoversCount: number;
    overdueDeparturesCount: number;
    businessDate: string;
  };
  activeReservations: any[];
  arrivalsToday: any[];
  departuresToday: any[];
  overdueDepartures: any[];
}

/**
 * Single source of truth for Room Status, Occupancy, Arrivals, and Departures.
 * Reconciles DB status with active reservations and folios so every screen agrees.
 */
export async function getCanonicalHotelStatus(propertyId: string): Promise<CanonicalRoomData> {
  const { dateString, todayStart, todayEnd } = getHotelBusinessDate();

  const [rooms, roomTypes, reservations, housekeepingTasks, property] = await Promise.all([
    prisma.room.findMany({
      where: { propertyId },
      include: { roomType: true },
      orderBy: [{ floor: 'asc' }, { roomNumber: 'asc' }],
    }),
    prisma.roomType.findMany({ where: { propertyId } }),
    prisma.reservation.findMany({
      where: {
        propertyId,
        status: { in: ['CHECKED_IN', 'CONFIRMED', 'PENDING'] },
      },
      include: {
        guest: true,
        rooms: { include: { room: true } },
        checkIns: {
          where: { status: 'ACTIVE' },
          include: { room: true },
          take: 1,
        },
        folios: {
          where: { status: 'OPEN' },
          take: 1,
        },
      },
    }),
    prisma.housekeepingTask.findMany({
      where: { propertyId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    }).catch(() => []),
    prisma.property.findUnique({
      where: { id: propertyId },
      select: { name: true, address: true },
    }).catch(() => null),
  ]);

  // Map task assignments
  const roomToTaskMap = new Map<string, { staffName: string }>();
  housekeepingTasks.forEach((task) => {
    if (task.roomId && task.assignedTo) {
      roomToTaskMap.set(task.roomId, { staffName: task.assignedTo });
    }
  });

  // Track room occupancy mapping: roomId -> active Reservation
  const roomOccupantMap = new Map<string, any>();
  const arrivalsToday: any[] = [];
  const departuresToday: any[] = [];
  const overdueDepartures: any[] = [];
  let stayoversCount = 0;

  reservations.forEach((res) => {
    const arr = new Date(res.arrivalDate);
    const dep = new Date(res.departureDate);

    // Is arrival today?
    const isArrToday = arr <= todayEnd && arr >= todayStart;
    // Is departure today?
    const isDepToday = dep <= todayEnd && dep >= todayStart;
    // Overdue: past departure date and still CHECKED_IN
    const isOverdue = dep < todayStart && res.status === 'CHECKED_IN';

    if (res.status === 'CONFIRMED' || res.status === 'PENDING') {
      if (isArrToday || arr < todayStart) {
        arrivalsToday.push(res);
      }
    }

    if (res.status === 'CHECKED_IN') {
      // Find assigned room ID from checkIn or assignedRoomId or rooms relation
      const assignedRoomId =
        res.checkIns?.[0]?.roomId ||
        res.assignedRoomId ||
        res.rooms?.[0]?.roomId ||
        null;

      if (assignedRoomId) {
        roomOccupantMap.set(assignedRoomId, res);
      }

      if (isDepToday) {
        departuresToday.push(res);
      } else if (isOverdue) {
        overdueDepartures.push(res);
      } else if (dep > todayEnd) {
        stayoversCount++;
      }
    }
  });

  const roomsToHeal: { id: string; status: string }[] = [];

  const mappedRooms: RoomBoardItem[] = rooms.map((r) => {
    const fl = parseInt(String(r.floor || '1'), 10) || 1;
    const activeRes = roomOccupantMap.get(r.id);
    const taskInfo = roomToTaskMap.get(r.id);

    let activeGuest: RoomBoardGuestInfo | null = null;
    let computedStatus: RoomOperationalStatus = 'AVAILABLE';

    if (activeRes) {
      computedStatus = 'OCCUPIED';
      const guestName = activeRes.guest
        ? `${activeRes.guest.firstName} ${activeRes.guest.lastName || ''}`.trim()
        : 'Guest Customer';

      const openFolio = activeRes.folios?.[0];
      const dueBal = openFolio?.closingBalance !== undefined
        ? openFolio.closingBalance
        : (activeRes.dueAmount || 0);

      activeGuest = {
        reservationId: activeRes.id,
        bookingNo: activeRes.bookingNo,
        guestId: activeRes.guestId,
        guestName,
        phone: activeRes.guest?.mobile || undefined,
        email: activeRes.guest?.email || undefined,
        arrivalDate: activeRes.arrivalDate.toISOString().split('T')[0],
        departureDate: activeRes.departureDate.toISOString().split('T')[0],
        totalAmount: openFolio?.totalCharges || activeRes.totalAmount || 0,
        dueAmount: dueBal,
        adults: activeRes.adults || 1,
        children: activeRes.children || 0,
        specialRequests: activeRes.addOnNotes || undefined,
        status: activeRes.status,
      };

      if (r.status !== 'OCCUPIED') {
        roomsToHeal.push({ id: r.id, status: 'OCCUPIED' });
      }
    } else {
      if (r.maintenanceStatus === 'UNDER_MAINTENANCE' || r.status === 'OUT_OF_ORDER' || r.status === 'MAINTENANCE') {
        computedStatus = 'OUT_OF_ORDER';
      } else {
        computedStatus = 'AVAILABLE';
        if (r.status === 'OCCUPIED') {
          roomsToHeal.push({ id: r.id, status: 'AVAILABLE' });
        }
      }
    }

    const housekeepingStatus: HousekeepingStatus =
      (r.housekeepingStatus as HousekeepingStatus) || 'CLEAN';
    const maintenanceStatus: MaintenanceStatus =
      (r.maintenanceStatus as MaintenanceStatus) || 'OK';

    return {
      id: r.id,
      roomNumber: r.roomNumber,
      floor: fl,
      status: computedStatus,
      housekeepingStatus,
      maintenanceStatus,
      isVIP: r.isVIP || false,
      isDND: r.isDND || false,
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

  // Self-heal DB room statuses in background if needed
  if (roomsToHeal.length > 0) {
    Promise.all(
      roomsToHeal.map((heal) =>
        prisma.room.update({
          where: { id: heal.id },
          data: { status: heal.status },
        }).catch(() => null)
      )
    ).catch(() => null);
  }

  const totalRooms = mappedRooms.length;
  const occupiedCount = mappedRooms.filter((r) => r.status === 'OCCUPIED').length;
  const vacantCleanCount = mappedRooms.filter(
    (r) => r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN'
  ).length;
  const vacantDirtyCount = mappedRooms.filter(
    (r) => r.status === 'AVAILABLE' && r.housekeepingStatus === 'DIRTY'
  ).length;
  const inProgressCount = mappedRooms.filter(
    (r) => r.status === 'AVAILABLE' && (r.housekeepingStatus === 'IN_PROGRESS' || r.housekeepingStatus === 'INSPECTION_PENDING')
  ).length;
  const maintenanceCount = mappedRooms.filter((r) => r.status === 'OUT_OF_ORDER').length;
  const vacantCount = Math.max(0, totalRooms - occupiedCount - maintenanceCount);

  const occupancyPct = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  const summary: RoomBoardSummary & {
    vacantCount: number;
    vacantDirtyCount: number;
    inProgressCount: number;
    maintenanceCount: number;
    stayoversCount: number;
    overdueDeparturesCount: number;
    businessDate: string;
    vipGuestsCount?: number;
  } = {
    totalRooms,
    occupiedCount,
    vacantCleanCount,
    vacantDirtyCount,
    inProgressCount,
    maintenanceCount,
    vacantCount,
    occupancyPct,
    inspectionPendingCount: inProgressCount,
    outOfOrderCount: maintenanceCount,
    hotelName: property?.name || 'Aatmayog',
    hotelAddress: property?.address || 'Hotel Premises',
    vipGuestsCount: mappedRooms.filter((r) => r.isVIP || (r.activeGuest as any)?.isVIP).length,
    arrivalsTodayCount: arrivalsToday.length,
    departuresTodayCount: departuresToday.length,
    stayoversCount,
    overdueDeparturesCount: overdueDepartures.length,
    businessDate: dateString,
  };

  return {
    rooms: mappedRooms,
    summary,
    activeReservations: reservations.filter((r) => r.status === 'CHECKED_IN'),
    arrivalsToday,
    departuresToday,
    overdueDepartures,
  };
}
