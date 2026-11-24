import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getCanonicalHotelStatus } from '@/lib/hotel/room-status-service';

function maskPhone(phone?: string | null) {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length >= 4) {
    return '••••••' + clean.slice(-4);
  }
  return '••••••';
}

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

    // Single source of truth for hotel status and security gate counts
    const canonical = await getCanonicalHotelStatus(propertyId);

    const [rooms, maintenanceTickets, checkIns] = await Promise.all([
      prisma.room.findMany({
        where: { propertyId },
        select: { id: true, roomNumber: true, status: true, housekeepingStatus: true, floor: true },
        orderBy: { roomNumber: 'asc' },
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

    // Sanitize guest records (mask phone numbers and hide folio financials from gate security)
    const sanitizeRes = (resList: any[]) =>
      resList.map((r) => ({
        id: r.id,
        bookingNo: r.bookingNo,
        status: r.status,
        arrivalDate: r.arrivalDate,
        departureDate: r.departureDate,
        adults: r.adults,
        children: r.children,
        totalAmount: 0,
        advanceAmount: 0,
        dueAmount: 0,
        guest: {
          firstName: r.guest?.firstName || 'Guest',
          lastName: r.guest?.lastName || '',
          mobile: maskPhone(r.guest?.mobile),
        },
        roomType: { name: r.roomType?.name || 'Standard' },
        rooms: r.rooms,
      }));

    const sanitizedCheckIns = checkIns.map((ci) => ({
      id: ci.id,
      checkedInAt: ci.checkedInAt,
      expectedCheckoutAt: ci.expectedCheckoutAt,
      guest: {
        firstName: ci.guest?.firstName || 'Guest',
        lastName: ci.guest?.lastName || '',
        mobile: maskPhone(ci.guest?.mobile),
      },
      room: ci.room,
    }));

    return apiResponse({
      // Room stats - matched across all PMS screens
      totalRooms: canonical.summary.totalRooms,
      occupiedRooms: canonical.summary.occupiedCount,
      availableRooms: canonical.summary.vacantCount,
      maintenanceRooms: canonical.summary.maintenanceCount,

      // Guest stats
      inHouseCount: canonical.summary.occupiedCount,
      todayArrivalsCount: canonical.arrivalsToday.length,
      todayDeparturesCount: canonical.departuresToday.length,
      overdueCount: canonical.overdueDepartures.length,
      pendingPaymentsCount: 0,

      // Lists
      todayArrivals: sanitizeRes(canonical.arrivalsToday.slice(0, 15)),
      todayDepartures: sanitizeRes(canonical.departuresToday.slice(0, 15)),
      overdueCheckouts: sanitizeRes(canonical.overdueDepartures.slice(0, 15)),
      inHouseGuests: sanitizedCheckIns,
      maintenanceAlerts: maintenanceTickets,

      // Rooms grid
      rooms,
    });
  } catch (error) {
    return apiError(error);
  }
}
