import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getCanonicalHotelStatus, getHotelBusinessDate } from '@/lib/hotel/room-status-service';
import { maskAadhaar } from '@/lib/hotel/security-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');

    let propertyId = propertyIdParam || session.propertyId || await resolveAdminProperty(session, prisma);

    if (propertyId) {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { hmsEnabled: true, type: true, organizationId: true, name: true }
      });
      if (prop && !prop.hmsEnabled && prop.type !== 'HOTEL') {
        const hotelProp = await prisma.property.findFirst({
          where: {
            organizationId: prop.organizationId || session.organizationId,
            OR: [
              { hmsEnabled: true },
              { type: 'HOTEL' }
            ]
          },
          select: { id: true, name: true }
        });
        if (hotelProp) {
          propertyId = hotelProp.id;
        }
      }
    }

    if (!propertyId) {
      return apiError(new Error('No active hotel property found.'), 400);
    }

    // 1. Fetch Property Details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        code: true,
        country: true,
        city: true,
        state: true,
        address: true,
        phone: true,
        pinCode: true,
        taxDetails: true,
      }
    });

    const currency = property?.country === 'SA' ? 'SAR' : '₹';

    // 2. Fetch canonical status (single source of truth for occupancy, room statuses, counts)
    const canonical = await getCanonicalHotelStatus(propertyId);
    const { todayStart, todayEnd, dateString } = getHotelBusinessDate();
    const now = new Date();

    // 3. Fetch All Relevant Reservations
    const allReservations = await prisma.reservation.findMany({
      where: { propertyId },
      include: {
        guest: true,
        roomType: true,
        rooms: {
          include: {
            room: true
          }
        },
        checkIns: {
          where: { status: 'ACTIVE' },
          take: 1
        },
        folios: {
          where: { status: 'OPEN' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Fetch Guest & Front Desk Enquiries/Queries
    const rawEnquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }).catch(() => []);

    const queries = rawEnquiries.map((enq) => ({
      id: enq.id,
      guestName: enq.name || 'Guest Enquiry',
      phone: enq.phone || '',
      email: enq.email || '',
      subject: enq.subject || 'Room / Hotel Query',
      message: enq.message || '',
      status: enq.status || 'NEW',
      createdAt: enq.createdAt,
      type: 'Queries',
    }));

    // Helpers
    const formatReservationItem = (res: any) => {
      const arr = new Date(res.arrivalDate);
      const dep = new Date(res.departureDate);
      const assignedRoomNo =
        res.rooms?.[0]?.room?.roomNumber ||
        res.checkIns?.[0]?.room?.roomNumber ||
        res.roomType?.name ||
        'Unassigned';
      const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
      const ratePerNight = res.rooms?.[0]?.ratePerNight || Math.round(res.totalAmount / nights);

      const openFolio = res.folios?.[0];
      const dueAmount = openFolio?.closingBalance !== undefined ? openFolio.closingBalance : (res.dueAmount || 0);

      return {
        id: res.id,
        guestId: res.guestId,
        guestName: res.guest ? `${((res.guest as any).name || (res.guest.firstName || '') + ' ' + (res.guest.lastName || '')).trim()}` || 'Guest' : 'Guest',
        guestFirstName: res.guest?.firstName || '',
        guestLastName: res.guest?.lastName || '',
        guestMobile: res.guest?.mobile || '',
        guestEmail: res.guest?.email || '',
        guestAddress: res.guest?.address || (res.guest as any)?.billingAddress || res.billingAddress || '',
        guestIdType: res.guest?.idType || 'Aadhaar Card',
        guestIdNumber: maskAadhaar(res.guest?.idNumber),
        guestNationality: res.guest?.nationality || 'Indian',
        companyName: res.companyName || res.guest?.companyName || '',
        gstNumber: res.gstNumber || res.guest?.gstNumber || '',
        reservationNumber: res.bookingNo,
        bookingNo: res.bookingNo,
        unitNumber: assignedRoomNo,
        assignedRoomId: res.checkIns?.[0]?.roomId || res.assignedRoomId || res.rooms?.[0]?.roomId,
        roomTypeName: res.roomType?.name || 'Standard Room',
        status: res.status,
        arrivalDate: res.arrivalDate,
        departureDate: res.departureDate,
        nights,
        ratePerNight,
        adults: res.adults || 1,
        children: res.children || 0,
        mealPlan: res.mealPlan || 'RO',
        spaPackage: res.spaPackage || 'NONE',
        spaPackageCost: res.spaPackageCost || 0,
        poolAccess: res.poolAccess || false,
        poolPackage: res.poolPackage || 'NONE',
        totalAmount: openFolio?.totalCharges || res.totalAmount || 0,
        advanceAmount: res.advanceAmount || 0,
        dueAmount,
        notes: res.addOnNotes || '',
        source: res.companyName || 'Direct Walk-in',
        createdAt: res.createdAt,
      };
    };

    const arrivals = canonical.arrivalsToday.map(formatReservationItem);
    const departures = canonical.departuresToday.map(formatReservationItem);
    const inHouse = canonical.activeReservations.map(formatReservationItem);
    const overdue = canonical.overdueDepartures.map(formatReservationItem);

    // Stayovers
    const stayovers = allReservations
      .filter((r) => {
        if (r.status !== 'CHECKED_IN') return false;
        const dep = new Date(r.departureDate);
        return dep > todayEnd;
      })
      .map(formatReservationItem);

    // Balance Due list
    const balanceDue = allReservations
      .filter((r) => r.status !== 'CHECKED_OUT' && r.status !== 'CANCELLED' && (r.dueAmount > 0 || (r.folios?.[0]?.closingBalance && r.folios[0].closingBalance > 0)))
      .map(formatReservationItem);

    // Active revenue & ADR
    let totalActiveRevenue = 0;
    let totalActiveNights = 0;
    canonical.activeReservations.forEach((r) => {
      const arr = new Date(r.arrivalDate);
      const dep = new Date(r.departureDate);
      const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
      totalActiveRevenue += r.totalAmount || 0;
      totalActiveNights += nights;
    });

    const averageDailyRate = totalActiveNights > 0
      ? Math.round(totalActiveRevenue / totalActiveNights)
      : (canonical.summary.totalRooms > 0 ? 3500 : 0);

    // Sales: Recent created or confirmed bookings
    const sales = allReservations
      .filter((r) => r.status !== 'CANCELLED')
      .slice(0, 10)
      .map((r) => {
        const arr = new Date(r.arrivalDate);
        const dep = new Date(r.departureDate);
        const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
        const guestName = r.guest
          ? `${r.guest.firstName || ''} ${r.guest.lastName || ''}`.trim() || 'Guest'
          : 'Guest';
        return {
          id: r.id,
          guestName,
          revenue: r.totalAmount,
          currency,
          checkInDate: arr.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          nights,
          source: r.companyName || 'Direct',
          type: 'Sales' as const,
          booking: formatReservationItem(r),
        };
      });

    const cancellationItems = allReservations
      .filter((r) => r.status === 'CANCELLED')
      .map((c) => {
        const arr = new Date(c.arrivalDate);
        const dep = new Date(c.departureDate);
        const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
        const guestName = c.guest
          ? `${c.guest.firstName || ''} ${c.guest.lastName || ''}`.trim() || 'Guest'
          : 'Guest';
        return {
          id: c.id,
          guestName,
          revenue: c.totalAmount,
          currency,
          checkInDate: arr.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          nights,
          source: c.companyName || 'Direct',
          type: 'Cancellation' as const,
          booking: formatReservationItem(c),
        };
      });

    // 14 Days Outlook
    const outlookDays: any[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const totalRooms = canonical.summary.totalRooms || 1;

    for (let i = 0; i < 14; i++) {
      const targetDate = new Date(todayStart.getTime() + i * 24 * 60 * 60 * 1000);
      const targetDayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
      const targetDayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      let bookedUnits = 0;
      let projectedRev = 0;
      const dayBookings: any[] = [];

      if (i === 0) {
        // Today strictly matches canonical occupied count!
        bookedUnits = canonical.summary.occupiedCount;
        projectedRev = totalActiveRevenue;
        canonical.activeReservations.forEach((r) => dayBookings.push(formatReservationItem(r)));
      } else {
        allReservations.forEach((r) => {
          if (r.status === 'CANCELLED') return;
          const arr = new Date(r.arrivalDate);
          const dep = new Date(r.departureDate);
          if (arr <= targetDayEnd && dep > targetDayStart) {
            bookedUnits++;
            const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
            projectedRev += Math.round(r.totalAmount / nights);
            dayBookings.push(formatReservationItem(r));
          }
        });
      }

      const effectiveBooked = Math.min(bookedUnits, totalRooms);
      const occRate = Math.round((effectiveBooked / totalRooms) * 100);

      outlookDays.push({
        date: `${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`,
        dayName: dayNames[targetDate.getDay()],
        fullDate: targetDate.toISOString().split('T')[0],
        bookedUnits: effectiveBooked,
        totalUnits: totalRooms,
        occupancyRate: occRate,
        projectedRevenue: projectedRev > 0 ? projectedRev : (effectiveBooked * averageDailyRate),
        currency,
        bookings: dayBookings,
      });
    }

    return apiResponse({
      property: {
        id: property?.id,
        name: property?.name || 'Main Hotel',
        code: property?.code || '',
        address: property?.address || '',
        city: property?.city || '',
        state: property?.state || '',
        country: property?.country || '',
        pinCode: property?.pinCode || '',
        phone: property?.phone || '',
        taxDetails: property?.taxDetails || '',
        currency,
      },
      stats: {
        arrivals: canonical.summary.arrivalsTodayCount,
        departures: canonical.summary.departuresTodayCount,
        overdue: canonical.summary.overdueDeparturesCount,
        stayovers: canonical.summary.stayoversCount,
        unitsBooked: canonical.summary.occupiedCount,
        occupancyPercent: canonical.summary.occupancyPct,
        vacantUnits: canonical.summary.vacantCount,
        cleanUnits: canonical.summary.vacantCleanCount,
        dirtyUnits: canonical.summary.vacantDirtyCount,
        maintenanceUnits: canonical.summary.maintenanceCount,
        averageDailyRate,
        currency,
        businessDate: dateString,
      },
      reservations: {
        arrivals,
        departures,
        overdue,
        stayovers,
        inHouse,
        balanceDue,
        queries,
      },
      activity: {
        sales,
        cancellations: cancellationItems,
        queries,
        bookedTodayCount: allReservations.filter((r) => {
          const c = new Date(r.createdAt);
          return c >= todayStart && c <= todayEnd;
        }).length,
        unitNights: totalActiveNights,
        todayRevenue: totalActiveRevenue,
      },
      outlook: outlookDays,
      roomsList: canonical.rooms.map((r) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        status: r.status,
        housekeepingStatus: r.housekeepingStatus,
        roomTypeName: r.roomTypeName,
        roomTypeId: r.roomTypeId,
        baseRate: r.baseRate,
      })),
    });
  } catch (error) {
    console.error('Error in operations-dashboard API:', error);
    return apiError(error);
  }
}
