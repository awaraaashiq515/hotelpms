import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const agentId = searchParams.get('agentId');
    const requestedDays = parseInt(searchParams.get('days') || '30', 10);

    if (!propertyId) {
      return NextResponse.json(
        { success: false, message: 'propertyId is required.' },
        { status: 400 }
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        state: true,
        address: true,
        starRating: true,
        hotelCategory: true,
        logoUrl: true,
        agentVisibilityDays: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, message: 'Hotel property not found.' },
        { status: 404 }
      );
    }

    // Determine how many days ahead the hotel permits the agent to see
    let allowedDays = property.agentVisibilityDays || 30;
    let agentRelationCommission = 10.0;

    if (agentId) {
      const rel = await prisma.agentHotelRelation.findUnique({
        where: {
          agentId_propertyId: {
            agentId,
            propertyId,
          },
        },
        select: {
          allowedDaysAhead: true,
          commissionRate: true,
          isBlocked: true,
          blockedReason: true,
        },
      });

      if (rel?.isBlocked) {
        return NextResponse.json(
          { success: false, message: rel.blockedReason || 'You are blocked from viewing this property.' },
          { status: 403 }
        );
      }

      if (rel?.allowedDaysAhead) {
        allowedDays = rel.allowedDaysAhead;
      }
      if (rel?.commissionRate) {
        agentRelationCommission = rel.commissionRate;
      }
    }

    // Limit by hotel permission
    const daysToShow = Math.min(requestedDays || allowedDays, allowedDays);

    // Fetch all active rooms and room types
    const [rooms, roomTypes] = await Promise.all([
      prisma.room.findMany({
        where: { propertyId },
        select: {
          id: true,
          roomNumber: true,
          floor: true,
          status: true,
          roomTypeId: true,
        },
      }),
      prisma.roomType.findMany({
        where: { propertyId },
        select: {
          id: true,
          name: true,
          code: true,
          baseRate: true,
          maxOccupancy: true,
        },
      }),
    ]);

    const totalRooms = rooms.length;
    const roomTypeMap = new Map(roomTypes.map((rt) => [rt.id, rt]));

    // Start range: today at 00:00:00
    const startRange = new Date();
    startRange.setHours(0, 0, 0, 0);

    const endRange = new Date(startRange);
    endRange.setDate(endRange.getDate() + daysToShow);
    endRange.setHours(23, 59, 59, 999);

    // Fetch all reservations spanning this date range
    const [reservations, checkIns, agentBookings] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          propertyId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          arrivalDate: { lte: endRange },
          departureDate: { gte: startRange },
        },
        select: {
          id: true,
          arrivalDate: true,
          departureDate: true,
          roomTypeId: true,
          assignedRoomId: true,
          rooms: {
            select: {
              roomId: true,
              room: { select: { roomTypeId: true } },
            },
          },
        },
      }),
      prisma.checkIn.findMany({
        where: {
          room: { propertyId },
          status: 'CHECKED_IN',
          checkedInAt: { lte: endRange },
          expectedCheckoutAt: { gte: startRange },
        },
        select: {
          id: true,
          roomId: true,
          checkedInAt: true,
          expectedCheckoutAt: true,
        },
      }),
      prisma.agentBooking.findMany({
        where: {
          propertyId,
          status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
          checkIn: { lte: endRange },
          checkOut: { gte: startRange },
        },
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          roomType: true,
          status: true,
        },
      }),
    ]);

    // Build day-by-day availability calendar
    const calendarDays = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(startRange);
      d.setDate(d.getDate() + i);

      const dStart = new Date(d);
      dStart.setHours(0, 0, 0, 0);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);

      // Track occupied rooms on this day
      const occupiedRoomIds = new Set<string>();
      let extraOccupiedCount = 0;
      const occupiedByRoomType: Record<string, number> = {};

      // 1. Current room status (if day is today and room is occupied/maintenance)
      if (i === 0) {
        rooms.forEach((r) => {
          if (r.status === 'OCCUPIED' || r.status === 'MAINTENANCE') {
            occupiedRoomIds.add(r.id);
            occupiedByRoomType[r.roomTypeId] = (occupiedByRoomType[r.roomTypeId] || 0) + 1;
          }
        });
      }

      // 2. Active Check-ins
      checkIns.forEach((ci) => {
        const inDate = new Date(ci.checkedInAt);
        const outDate = new Date(ci.expectedCheckoutAt);
        if (inDate <= dEnd && outDate > dStart) {
          occupiedRoomIds.add(ci.roomId);
        }
      });

      // 3. Reservations
      reservations.forEach((res) => {
        const arr = new Date(res.arrivalDate);
        const dep = new Date(res.departureDate);
        if (arr <= dEnd && dep > dStart) {
          if (res.assignedRoomId) {
            occupiedRoomIds.add(res.assignedRoomId);
          } else if (res.rooms && res.rooms.length > 0) {
            res.rooms.forEach((rm) => {
              if (rm.roomId) {
                occupiedRoomIds.add(rm.roomId);
              } else {
                extraOccupiedCount++;
                const rtId = rm.room?.roomTypeId || res.roomTypeId;
                if (rtId) {
                  occupiedByRoomType[rtId] = (occupiedByRoomType[rtId] || 0) + 1;
                }
              }
            });
          } else {
            extraOccupiedCount++;
            if (res.roomTypeId) {
              occupiedByRoomType[res.roomTypeId] = (occupiedByRoomType[res.roomTypeId] || 0) + 1;
            }
          }
        }
      });

      // 4. Agent Bookings
      agentBookings.forEach((ab) => {
        const ci = new Date(ab.checkIn);
        const co = new Date(ab.checkOut);
        if (ci <= dEnd && co > dStart) {
          extraOccupiedCount++;
        }
      });

      const totalBooked = Math.min(totalRooms, occupiedRoomIds.size + extraOccupiedCount);
      const totalAvailable = Math.max(0, totalRooms - totalBooked);

      // Status
      let status: 'AVAILABLE' | 'FEW_LEFT' | 'SOLD_OUT' = 'AVAILABLE';
      if (totalAvailable === 0) {
        status = 'SOLD_OUT';
      } else if (totalAvailable <= 3) {
        status = 'FEW_LEFT';
      }

      // Per room type availability breakdown
      const typeBreakdown = roomTypes.map((rt) => {
        const totalOfType = rooms.filter((r) => r.roomTypeId === rt.id).length;
        const occupiedOfType = rooms.filter((r) => r.roomTypeId === rt.id && occupiedRoomIds.has(r.id)).length + (occupiedByRoomType[rt.id] || 0);
        const availOfType = Math.max(0, totalOfType - occupiedOfType);

        return {
          id: rt.id,
          name: rt.name,
          code: rt.code,
          baseRate: rt.baseRate,
          total: totalOfType,
          available: availOfType,
          status: availOfType === 0 ? 'SOLD_OUT' : availOfType <= 2 ? 'FEW_LEFT' : 'AVAILABLE',
        };
      });

      const availableRates = typeBreakdown
        .filter((tb) => tb.available > 0)
        .map((tb) => tb.baseRate);
      const lowestRate = availableRates.length > 0 ? Math.min(...availableRates) : (roomTypes[0]?.baseRate || 0);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      // Next day string for checkOut pre-fill
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const nextYyyy = nextD.getFullYear();
      const nextMm = String(nextD.getMonth() + 1).padStart(2, '0');
      const nextDd = String(nextD.getDate()).padStart(2, '0');
      const nextDateString = `${nextYyyy}-${nextMm}-${nextDd}`;

      calendarDays.push({
        date: dateString,
        nextDate: nextDateString,
        day: d.getDate(),
        month: monthNames[d.getMonth()],
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        dayOfWeek: dayNames[d.getDay()],
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: i === 0,
        totalRooms,
        bookedRooms: totalBooked,
        availableRooms: totalAvailable,
        status,
        lowestRate,
        roomTypes: typeBreakdown,
      });
    }

    return NextResponse.json({
      success: true,
      property,
      allowedDaysAhead: allowedDays,
      daysToShow,
      commissionRate: agentRelationCommission,
      days: calendarDays,
    });
  } catch (error) {
    return apiError(error);
  }
}
