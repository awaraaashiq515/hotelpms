import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyCode = searchParams.get('propertyCode');

    // Resolve property
    let propertyId: string | null = null;
    if (propertyCode) {
      const prop = await prisma.property.findUnique({
        where: { code: propertyCode.toUpperCase() },
        select: { id: true },
      });
      propertyId = prop?.id || null;
    }
    if (!propertyId && session.propertyId) {
      propertyId = session.propertyId;
    }
    if (!propertyId) {
      const prop = await prisma.property.findFirst({
        where: { organizationId: session.organizationId },
        select: { id: true },
      });
      propertyId = prop?.id || null;
    }

    if (!propertyId) {
      return apiError(new Error('Property not found'), 404);
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const today = now.toISOString().split('T')[0];

    const [rooms, reservations, maintenanceTickets, checkIns] = await Promise.all([
      prisma.room.findMany({
        where: { propertyId },
        select: { id: true, roomNumber: true, status: true, housekeepingStatus: true, floor: true },
        orderBy: { roomNumber: 'asc' },
      }),

      prisma.reservation.findMany({
        where: { propertyId },
        include: {
          guest: { select: { firstName: true, lastName: true, mobile: true } },
          roomType: { select: { name: true } },
          rooms: { include: { room: { select: { roomNumber: true } } } },
        },
        orderBy: { arrivalDate: 'asc' },
      }),

      prisma.maintenanceTicket.findMany({
        where: { propertyId, status: { notIn: ['RESOLVED', 'CLOSED'] } },
        include: { room: { select: { roomNumber: true } } },
        orderBy: { openedAt: 'desc' },
        take: 10,
      }).catch(() => []),

      prisma.checkIn.findMany({
        where: { reservation: { propertyId }, status: 'ACTIVE' },
        include: {
          guest: { select: { firstName: true, lastName: true, mobile: true } },
          room: { select: { roomNumber: true, floor: true } },
        },
        orderBy: { checkedInAt: 'desc' },
      }).catch(() => []),
    ]);

    // Stats
    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.status === 'OCCUPIED').length;
    const availableRooms = rooms.filter((r) => r.status === 'AVAILABLE').length;
    const maintenanceRooms = rooms.filter((r) => r.status === 'MAINTENANCE').length;

    const todayArrivals = reservations.filter(
      (r) =>
        new Date(r.arrivalDate).toISOString().split('T')[0] === today &&
        (r.status === 'CONFIRMED' || r.status === 'PENDING')
    );

    const todayDepartures = reservations.filter(
      (r) =>
        new Date(r.departureDate).toISOString().split('T')[0] === today &&
        r.status === 'CHECKED_IN'
    );

    const inHouseGuests = reservations.filter((r) => r.status === 'CHECKED_IN');

    const overdueCheckouts = reservations.filter(
      (r) => r.status === 'CHECKED_IN' && new Date(r.departureDate) < todayStart
    );

    const pendingPayments = reservations.filter(
      (r) => (r.dueAmount ?? 0) > 0 && r.status !== 'CANCELLED' && r.status !== 'CHECKED_OUT'
    );

    return apiResponse({
      // Room stats
      totalRooms,
      occupiedRooms,
      availableRooms,
      maintenanceRooms,

      // Guest stats
      inHouseCount: inHouseGuests.length,
      todayArrivalsCount: todayArrivals.length,
      todayDeparturesCount: todayDepartures.length,
      overdueCount: overdueCheckouts.length,
      pendingPaymentsCount: pendingPayments.length,

      // Lists
      todayArrivals: todayArrivals.slice(0, 10),
      todayDepartures: todayDepartures.slice(0, 10),
      overdueCheckouts: overdueCheckouts.slice(0, 10),
      inHouseGuests: checkIns,
      maintenanceAlerts: maintenanceTickets,

      // Rooms grid
      rooms,
    });
  } catch (error) {
    return apiError(error);
  }
}
