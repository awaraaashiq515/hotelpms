import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const where = getMultiTenantWhere(session, propertyIdParam);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    // ── Parallel DB queries ───────────────────────────────────────────────
    const [
      rooms,
      reservations,
      housekeepingTasks,
      maintenanceTickets,
      payments,
      attendance,
      staffMembers,
      tableFeedbacks,
    ] = await Promise.all([
      // All rooms
      prisma.room.findMany({
        where,
        include: { roomType: { select: { name: true, baseRate: true } } },
        orderBy: { roomNumber: 'asc' },
      }),

      // All reservations with guests
      prisma.reservation.findMany({
        where,
        include: {
          guest: { select: { firstName: true, lastName: true, mobile: true } },
          roomType: { select: { name: true } },
          rooms: { include: { room: { select: { roomNumber: true } } } },
        },
        orderBy: { arrivalDate: 'asc' },
      }),

      // Housekeeping tasks
      prisma.housekeepingTask.findMany({
        where,
        include: { room: { select: { roomNumber: true } } },
        orderBy: { scheduledAt: 'desc' },
        take: 20,
      }).catch(() => []),

      // Maintenance tickets
      prisma.maintenanceTicket.findMany({
        where: { ...where, status: { notIn: ['RESOLVED', 'CLOSED'] } },
        include: { room: { select: { roomNumber: true } } },
        orderBy: { openedAt: 'desc' },
        take: 10,
      }).catch(() => []),

      // Payments
      prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        take: 500,
      }).catch(() => []),

      // Staff attendance today
      prisma.attendance.findMany({
        where: { ...where, clockIn: { gte: todayStart, lte: todayEnd } },
        include: { staffMember: { select: { name: true } } },
      }).catch(() => []),

      // Staff members
      prisma.staffMember.findMany({
        where,
        select: { id: true, name: true },
      }).catch(() => []),

      // Table feedbacks (guest satisfaction)
      prisma.tableFeedback.findMany({
        where: { ...where, createdAt: { gte: monthStart } },
        select: { rating: true, createdAt: true },
      }).catch(() => []),
    ]);

    const today = now.toISOString().split('T')[0];

    // ── Room Stats ───────────────────────────────────────────────────────
    const totalRooms    = rooms.length;
    const occupiedRooms = rooms.filter((r: any) => r.status === 'OCCUPIED').length;
    const vacantRooms   = rooms.filter((r: any) => r.status === 'AVAILABLE').length;
    const outOfOrder    = rooms.filter((r: any) => r.status === 'OUT_OF_ORDER').length;
    const dirtyRooms    = rooms.filter((r: any) => r.housekeepingStatus === 'DIRTY').length;
    const cleanRooms    = rooms.filter((r: any) => r.housekeepingStatus === 'CLEAN').length;
    const occupancyPct  = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // ── Booking Stats ────────────────────────────────────────────────────
    const checkinsToday   = reservations.filter((b: any) =>
      new Date(b.arrivalDate).toISOString().split('T')[0] === today &&
      (b.status === 'CONFIRMED' || b.status === 'PENDING')
    );
    const checkoutsToday  = reservations.filter((b: any) =>
      new Date(b.departureDate).toISOString().split('T')[0] === today &&
      b.status === 'CHECKED_IN'
    );
    const inHouse         = reservations.filter((b: any) => b.status === 'CHECKED_IN');
    const pendingPayments = reservations.filter((b: any) => (b.dueAmount ?? 0) > 0 && b.status !== 'CANCELLED');

    // ── OTA vs Direct ────────────────────────────────────────────────────
    // source field is on EmailBooking; we approximate from reservations booked this month
    const thisMonthBookings = reservations.filter((b: any) =>
      new Date(b.createdAt ?? b.arrivalDate) >= monthStart
    );

    // ── Revenue ─────────────────────────────────────────────────────────
    const revenueToday = payments
      .filter((p: any) => new Date(p.paymentDate) >= todayStart && new Date(p.paymentDate) <= todayEnd)
      .reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

    const revenueMonth = payments
      .filter((p: any) => new Date(p.paymentDate) >= monthStart)
      .reduce((s: number, p: any) => s + (p.amount ?? 0), 0);

    // ADR = total room revenue / occupied room nights sold
    const checkedInRevenue = inHouse.reduce((s: number, b: any) => s + (b.totalAmount ?? 0), 0);
    const adr  = occupiedRooms > 0 ? Math.round(checkedInRevenue / occupiedRooms) : 0;
    const revpar = totalRooms > 0 ? Math.round((adr * occupiedRooms) / totalRooms) : 0;

    // ── Guest Satisfaction ───────────────────────────────────────────────
    const ratings = (tableFeedbacks as any[]).map((f: any) => f.rating).filter((r: any) => typeof r === 'number');
    const avgRating = ratings.length > 0 ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1) : null;

    // ── Staff Attendance ─────────────────────────────────────────────────
    const presentToday = (attendance as any[]).filter((a: any) => a.status === 'PRESENT' || a.checkIn).length;
    const totalStaff   = (staffMembers as any[]).length;

    // ── Housekeeping Summary ─────────────────────────────────────────────
    const hkPending  = (housekeepingTasks as any[]).filter((t: any) => t.status === 'PENDING').length;
    const hkInProgress = (housekeepingTasks as any[]).filter((t: any) => t.status === 'IN_PROGRESS').length;
    const hkDone     = (housekeepingTasks as any[]).filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED').length;

    return apiResponse({
      // Room stats
      totalRooms,
      occupiedRooms,
      vacantRooms,
      outOfOrder,
      dirtyRooms,
      cleanRooms,
      occupancyPct,

      // Bookings
      checkinsToday: checkinsToday.slice(0, 8),
      checkoutsToday: checkoutsToday.slice(0, 8),
      inHouse,
      pendingPayments: pendingPayments.slice(0, 8),

      // Revenue
      revenueToday,
      revenueMonth,
      adr,
      revpar,

      // Bookings count
      totalBookingsMonth: thisMonthBookings.length,
      otaBookings: 0,      // placeholder (requires email_bookings join)
      directBookings: thisMonthBookings.length,

      // Housekeeping
      housekeepingTasks: (housekeepingTasks as any[]).slice(0, 8),
      hkPending,
      hkInProgress,
      hkDone,

      // Maintenance
      maintenanceAlerts: (maintenanceTickets as any[]).slice(0, 6),

      // Guest satisfaction
      avgRating: avgRating ? parseFloat(avgRating) : null,
      totalRatings: ratings.length,

      // Staff
      presentToday,
      totalStaff,

      // Rooms list
      rooms: rooms.slice(0, 50),
    });
  } catch (error) {
    return apiError(error);
  }
}
