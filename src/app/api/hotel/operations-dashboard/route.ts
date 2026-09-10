import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

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

    // Determine currency symbol based on property
    const currency = property?.country === 'SA' ? 'SAR' : '₹';

    // 2. Fetch All Rooms for Property
    const rooms = await prisma.room.findMany({
      where: { propertyId },
      include: {
        roomType: true,
      },
      orderBy: { roomNumber: 'asc' }
    });
    const totalRooms = rooms.length;

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
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Helpers
    const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    };

    // 4. Categorize Reservations
    const arrivals: any[] = [];
    const departures: any[] = [];
    const stayovers: any[] = [];
    const inHouse: any[] = [];
    const balanceDue: any[] = [];
    const cancelled: any[] = [];

    let totalActiveRevenue = 0;
    let totalActiveNights = 0;

    allReservations.forEach((res) => {
      const arr = new Date(res.arrivalDate);
      const dep = new Date(res.departureDate);
      const isArrToday = isSameDay(arr, now);
      const isDepToday = isSameDay(dep, now);

      const assignedRoomNo = res.rooms?.[0]?.room?.roomNumber || res.roomType?.name || 'Unassigned';
      const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
      const ratePerNight = res.rooms?.[0]?.ratePerNight || Math.round(res.totalAmount / nights);

      const formatted = {
        id: res.id,
        guestId: res.guestId,
        guestName: res.guest ? `${((res.guest as any).name || (res.guest.firstName || '') + ' ' + (res.guest.lastName || '')).trim()}` || 'Guest' : 'Guest',
        guestFirstName: res.guest?.firstName || '',
        guestLastName: res.guest?.lastName || '',
        guestMobile: res.guest?.mobile || '',
        guestEmail: res.guest?.email || '',
        guestAddress: res.guest?.address || res.guest?.billingAddress || res.billingAddress || '',
        guestIdType: res.guest?.idType || 'Aadhaar Card',
        guestIdNumber: res.guest?.idNumber || 'Verified ID',
        guestNationality: res.guest?.nationality || 'Indian',
        companyName: res.companyName || res.guest?.companyName || '',
        gstNumber: res.gstNumber || res.guest?.gstNumber || '',
        reservationNumber: res.bookingNo,
        unitNumber: assignedRoomNo,
        assignedRoomId: res.assignedRoomId || res.rooms?.[0]?.roomId,
        roomTypeName: res.roomType?.name || 'Standard Room',
        status: res.status,
        arrivalDate: res.arrivalDate,
        departureDate: res.departureDate,
        nights,
        ratePerNight,
        adults: res.adults || 1,
        children: res.children || 0,
        mealPlan: res.mealPlan || 'RO',
        totalAmount: res.totalAmount,
        advanceAmount: res.advanceAmount,
        dueAmount: res.dueAmount,
        notes: res.addOnNotes || '',
        source: res.companyName || 'Direct Walk-in',
        createdAt: res.createdAt,
      };

      if (res.status === 'CANCELLED') {
        cancelled.push(formatted);
        return;
      }

      // Check-in status
      if (res.status === 'CHECKED_IN') {
        inHouse.push(formatted);
        totalActiveRevenue += res.totalAmount || 0;
        const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
        totalActiveNights += nights;

        if (isDepToday || dep <= now) {
          departures.push(formatted);
        } else {
          stayovers.push(formatted);
        }
      } else if (res.status === 'CONFIRMED' || res.status === 'PENDING') {
        // Pending arrivals
        if (isArrToday || arr <= now) {
          arrivals.push(formatted);
        } else {
          arrivals.push(formatted);
        }
      }

      if ((res.dueAmount && res.dueAmount > 0) && res.status !== 'CHECKED_OUT') {
        balanceDue.push(formatted);
      }
    });

    // Units currently occupied
    const occupiedCount = inHouse.length;
    const occupancyPercent = totalRooms > 0 ? Math.min(100, Math.round((occupiedCount / totalRooms) * 100)) : 0;
    const averageDailyRate = totalActiveNights > 0 ? Math.round(totalActiveRevenue / totalActiveNights) : (totalRooms > 0 ? 3500 : 0);

    // 5. Today's Activity Data
    // Sales: Reservations created or active today
    const sales = allReservations
      .filter(r => r.status !== 'CANCELLED')
      .slice(0, 10)
      .map(r => {
        const arr = new Date(r.arrivalDate);
        const dep = new Date(r.departureDate);
        const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
        return {
          id: r.id,
          guestName: r.guest ? `${((r.guest as any).name || (r.guest.firstName || '') + ' ' + (r.guest.lastName || '')).trim()}` || 'Guest' : 'Guest',
          revenue: r.totalAmount,
          currency,
          checkInDate: arr.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          nights,
          source: r.companyName || 'Direct',
          type: 'Sales'
        };
      });

    const cancellationItems = cancelled.map(c => {
      const arr = new Date(c.arrivalDate);
      const dep = new Date(c.departureDate);
      const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
      return {
        id: c.id,
        guestName: c.guestName,
        revenue: c.totalAmount,
        currency,
        checkInDate: arr.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        nights,
        source: c.source,
        type: 'Cancellation'
      };
    });

    // 6. Dynamic 14 Days Outlook
    const outlookDays: any[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 14; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const targetDayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
      const targetDayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59);

      // Count bookings active on targetDate
      let bookedUnits = 0;
      let projectedRev = 0;

      allReservations.forEach(r => {
        if (r.status === 'CANCELLED') return;
        const arr = new Date(r.arrivalDate);
        const dep = new Date(r.departureDate);
        // Active if arrival <= targetDayEnd and departure >= targetDayStart
        if (arr <= targetDayEnd && dep >= targetDayStart) {
          bookedUnits++;
          const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
          projectedRev += Math.round(r.totalAmount / nights);
        }
      });

      // Avoid exceeding total rooms
      const effectiveTotal = Math.max(totalRooms, 1);
      const effectiveBooked = Math.min(bookedUnits, effectiveTotal);
      const occRate = Math.round((effectiveBooked / effectiveTotal) * 100);

      outlookDays.push({
        date: `${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`,
        dayName: dayNames[targetDate.getDay()],
        fullDate: targetDate.toISOString().split('T')[0],
        bookedUnits: effectiveBooked,
        totalUnits: effectiveTotal,
        occupancyRate: occRate,
        projectedRevenue: projectedRev > 0 ? projectedRev : (effectiveBooked * averageDailyRate),
        currency
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
        arrivals: arrivals.length,
        departures: departures.length,
        unitsBooked: occupiedCount,
        occupancyPercent,
        averageDailyRate,
        currency,
      },
      reservations: {
        arrivals,
        departures,
        stayovers,
        inHouse,
        balanceDue,
      },
      activity: {
        sales,
        cancellations: cancellationItems,
        bookedTodayCount: allReservations.filter(r => isSameDay(new Date(r.createdAt), now)).length,
        unitNights: totalActiveNights,
        todayRevenue: totalActiveRevenue,
      },
      outlook: outlookDays,
      roomsList: rooms.map(r => ({
        id: r.id,
        roomNumber: r.roomNumber,
        status: r.status,
        roomTypeName: r.roomType?.name || 'Standard',
        roomTypeId: r.roomTypeId,
        baseRate: r.roomType?.baseRate || 3000,
      }))
    });
  } catch (error) {
    console.error('Error in operations-dashboard API:', error);
    return apiError(error);
  }
}
