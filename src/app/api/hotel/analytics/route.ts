import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getCanonicalHotelStatus, getHotelBusinessDate } from '@/lib/hotel/room-status-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const timeRange = searchParams.get('timeRange') || '30d';
    const customStartParam = searchParams.get('startDate');
    const customEndParam = searchParams.get('endDate');

    const where = getMultiTenantWhere(session, propertyIdParam);

    let propertyId = propertyIdParam || session.propertyId;
    if (!propertyId && session.role === 'RESTAURANTS_ADMIN') {
      propertyId = await resolveAdminProperty(session, prisma);
    }
    if (!propertyId && where.propertyId) {
      propertyId = where.propertyId;
    }

    if (!propertyId) {
      return apiError(new Error('No active property found.'), 400);
    }

    const { todayStart, todayEnd } = getHotelBusinessDate();
    const now = new Date();

    let periodStart: Date;
    let periodEnd: Date = todayEnd;
    let daysInPeriod = 30;

    if (timeRange === 'today') {
      periodStart = todayStart;
      daysInPeriod = 1;
    } else if (timeRange === '7d') {
      periodStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
      daysInPeriod = 7;
    } else if (timeRange === '30d') {
      periodStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);
      daysInPeriod = 30;
    } else if (timeRange === 'month') {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      daysInPeriod = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
    } else if (timeRange === 'year') {
      periodStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      daysInPeriod = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
    } else if (timeRange === 'custom' && customStartParam) {
      periodStart = new Date(customStartParam);
      periodStart.setHours(0, 0, 0, 0);
      if (customEndParam) {
        periodEnd = new Date(customEndParam);
        periodEnd.setHours(23, 59, 59, 999);
      }
      daysInPeriod = Math.max(1, Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)));
    } else {
      periodStart = new Date(todayStart.getTime() - 29 * 24 * 60 * 60 * 1000);
      daysInPeriod = 30;
    }

    const periodDurationMs = periodEnd.getTime() - periodStart.getTime();
    const prevPeriodEnd = new Date(periodStart.getTime() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd.getTime() - periodDurationMs);

    // Parallel DB queries
    const [
      canonical,
      reservations,
      folioTransactions,
      posOrders,
      housekeepingTasks,
      maintenanceTickets,
      guests,
      feedbacks,
    ] = await Promise.all([
      getCanonicalHotelStatus(propertyId),
      prisma.reservation.findMany({
        where: { propertyId },
        include: {
          guest: true,
          roomType: true,
          rooms: { include: { room: true } },
          folios: { include: { transactions: true } },
        },
        orderBy: { arrivalDate: 'desc' },
      }).catch(() => []),
      prisma.folioTransaction.findMany({
        where: {
          folio: { reservation: { propertyId } },
        },
      }).catch(() => []),
      prisma.posOrder.findMany({
        where: { propertyId, status: { notIn: ['CANCELLED', 'VOID'] } },
        select: { id: true, grandTotal: true, createdAt: true, orderType: true },
      }).catch(() => []),
      prisma.housekeepingTask.findMany({
        where: { propertyId },
        orderBy: { scheduledAt: 'desc' },
      }).catch(() => []),
      prisma.maintenanceTicket.findMany({
        where: { propertyId },
        orderBy: { openedAt: 'desc' },
      }).catch(() => []),
      prisma.guest.findMany({
        where: { reservations: { some: { propertyId } } },
      }).catch(() => []),
      prisma.tableFeedback.findMany({
        where: { propertyId },
      }).catch(() => []),
    ]);

    const totalRooms = canonical.summary.totalRooms || 1;
    const occupiedRooms = canonical.summary.occupiedCount;
    const vacantCleanRooms = canonical.summary.vacantCleanCount;
    const vacantDirtyRooms = canonical.summary.vacantDirtyCount;
    const outOfOrderRooms = canonical.summary.maintenanceCount;
    const inspectionPendingRooms = canonical.summary.inProgressCount;
    const occupancyPct = canonical.summary.occupancyPct;

    // Filter paid reservations (excluding complimentary stays) (C5)
    const paidReservations = reservations.filter(
      (r) => !r.waiveBill && !r.isOwnerGuest && r.ownerBillingType !== 'COMPLIMENTARY' && r.status !== 'CANCELLED'
    );

    const periodReservations = paidReservations.filter((r) => {
      const rd = new Date(r.arrivalDate || r.createdAt);
      return rd >= periodStart && rd <= periodEnd;
    });

    const prevReservations = paidReservations.filter((r) => {
      const rd = new Date(r.arrivalDate || r.createdAt);
      return rd >= prevPeriodStart && rd <= prevPeriodEnd;
    });

    // Compute period revenue from folio transactions & paid reservations
    const periodPayments = folioTransactions.filter((t) => {
      const td = new Date(t.txnDate);
      return td >= periodStart && td <= periodEnd && t.txnType === 'CREDIT';
    });

    const periodDebitCharges = folioTransactions.filter((t) => {
      const td = new Date(t.txnDate);
      return td >= periodStart && td <= periodEnd && t.txnType === 'DEBIT';
    });

    let periodRevenue = periodPayments.reduce((s, p) => s + (p.creditAmount || 0), 0);
    if (periodRevenue === 0 && periodReservations.length > 0) {
      periodRevenue = periodReservations.reduce((s, r) => s + (r.advanceAmount || r.totalAmount || 0), 0);
    }

    const prevPayments = folioTransactions.filter((t) => {
      const td = new Date(t.txnDate);
      return td >= prevPeriodStart && td <= prevPeriodEnd && t.txnType === 'CREDIT';
    });
    let prevRevenue = prevPayments.reduce((s, p) => s + (p.creditAmount || 0), 0);
    if (prevRevenue === 0 && prevReservations.length > 0) {
      prevRevenue = prevReservations.reduce((s, r) => s + (r.advanceAmount || r.totalAmount || 0), 0);
    }

    const growthVsPrevPeriod = prevRevenue > 0
      ? Math.round(((periodRevenue - prevRevenue) / prevRevenue) * 100)
      : (periodRevenue > 0 ? 100 : 0);

    // F&B Pos revenue
    const periodPos = posOrders.filter((o) => {
      const od = new Date(o.createdAt);
      return od >= periodStart && od <= periodEnd;
    });
    const ancillaryRevenue = periodPos.reduce((s, o) => s + (o.grandTotal || 0), 0);
    const roomRevenue = Math.max(0, periodRevenue - ancillaryRevenue);

    // Stay Nights & ADR
    const totalBookings = periodReservations.length;
    let totalStayNights = 0;
    periodReservations.forEach((r) => {
      const arr = new Date(r.arrivalDate);
      const dep = new Date(r.departureDate);
      const nights = Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24)));
      totalStayNights += nights;
    });

    const avgLengthOfStay = totalBookings > 0 ? Number((totalStayNights / totalBookings).toFixed(1)) : 0;
    const avgBookingValue = totalBookings > 0 ? Math.round(periodRevenue / totalBookings) : 0;

    const totalAvailableRoomNights = totalRooms * daysInPeriod;
    const roomNightsSold = totalStayNights;

    const adr = roomNightsSold > 0 ? Math.round(roomRevenue / roomNightsSold) : 0;
    const revpar = totalAvailableRoomNights > 0 ? Math.round(roomRevenue / totalAvailableRoomNights) : 0;
    const trevpar = totalAvailableRoomNights > 0 ? Math.round(periodRevenue / totalAvailableRoomNights) : 0;
    const goppar = Math.round(trevpar * 0.65);

    // Repeat Guests Rate (Real calculation)
    const guestBookingCounts: Record<string, number> = {};
    reservations.forEach((r) => {
      if (r.guestId) {
        guestBookingCounts[r.guestId] = (guestBookingCounts[r.guestId] || 0) + 1;
      }
    });
    const repeatGuestCount = Object.values(guestBookingCounts).filter((c) => c > 1).length;
    const totalUniqueGuests = Object.keys(guestBookingCounts).length;
    const repeatGuestRate = totalUniqueGuests > 0 ? Math.round((repeatGuestCount / totalUniqueGuests) * 100) : 0;

    // Real Satisfaction score
    const validRatings = feedbacks
      .map((f: any) => f.rating || f.overallRating)
      .filter((r) => typeof r === 'number' && r > 0);
    const avgRating = validRatings.length > 0
      ? Number((validRatings.reduce((s: number, r: number) => s + r, 0) / validRatings.length).toFixed(1))
      : null;

    // Real Housekeeping Efficiency
    const completedTasks = housekeepingTasks.filter((t) => t.status === 'COMPLETED').length;
    const totalTasks = housekeepingTasks.length;
    const housekeepingEfficiencyPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null;

    // Real Maintenance Resolved
    const resolvedMaintenance = maintenanceTickets.filter((m) => m.status === 'RESOLVED' || m.status === 'CLOSED').length;
    const totalMaintenance = maintenanceTickets.length;
    const maintenanceResolvedPct = totalMaintenance > 0 ? Math.round((resolvedMaintenance / totalMaintenance) * 100) : null;

    // Real Channel Distribution
    const channelCounts: Record<string, { bookings: number; revenue: number }> = {};
    periodReservations.forEach((r) => {
      const src = r.companyName || 'Direct / Walk-In';
      if (!channelCounts[src]) channelCounts[src] = { bookings: 0, revenue: 0 };
      channelCounts[src].bookings++;
      channelCounts[src].revenue += r.totalAmount || 0;
    });

    const channelColors = ['#10B981', '#3B82F6', '#EC4899', '#6366F1', '#8B5CF6'];
    const channelDistribution = Object.entries(channelCounts).map(([channel, val], idx) => ({
      channel,
      bookings: val.bookings,
      revenue: val.revenue,
      sharePct: periodRevenue > 0 ? Math.round((val.revenue / periodRevenue) * 100) : 0,
      avgAdr: val.bookings > 0 ? Math.round(val.revenue / val.bookings) : 0,
      color: channelColors[idx % channelColors.length],
    }));

    // Real Nationality Distribution
    const natCounts: Record<string, number> = {};
    periodReservations.forEach((r) => {
      const nat = r.guest?.nationality || 'Indian';
      natCounts[nat] = (natCounts[nat] || 0) + 1;
    });
    const nationalities = Object.entries(natCounts).map(([country, count]) => ({
      country,
      code: country === 'Indian' || country === 'India' ? 'IN' : 'INT',
      count,
      percentage: totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 100,
    }));

    // Honest AI Business Insights (C8)
    const aiInsights: any[] = [];
    if (totalBookings >= 3) {
      aiInsights.push({
        id: '1',
        category: 'REVENUE',
        title: 'Current Revenue & Channel Overview',
        description: `Recorded ${totalBookings} stays generating ₹${periodRevenue.toLocaleString('en-IN')} in total revenue with an ADR of ₹${adr.toLocaleString('en-IN')}.`,
        impact: 'POSITIVE',
        actionPrompt: 'Maintain optimal room rates across high-demand dates.',
      });
      if (repeatGuestRate > 0) {
        aiInsights.push({
          id: '2',
          category: 'GUEST',
          title: 'Guest Retention',
          description: `Repeat guest rate is currently at ${repeatGuestRate}% with an average stay length of ${avgLengthOfStay} nights.`,
          impact: 'POSITIVE',
          actionPrompt: 'Continue guest recognition for repeat clients.',
        });
      }
    } else {
      aiInsights.push({
        id: '1',
        category: 'REVENUE',
        title: 'Awaiting Live Property Data',
        description: 'Not enough data yet. Automated AI yield trends and performance insights will appear as more reservations and check-outs are recorded.',
        impact: 'NEUTRAL',
        actionPrompt: 'Record check-ins and room service orders to populate analytics.',
      });
    }

    const operations = {
      totalRooms,
      occupiedRooms,
      vacantCleanRooms,
      vacantDirtyRooms,
      outOfOrderRooms,
      inspectionPendingRooms,
      housekeepingTasksTotal: totalTasks,
      housekeepingTasksCompleted: completedTasks,
      housekeepingAvgMinutes: null,
      maintenanceTicketsTotal: totalMaintenance,
      maintenanceTicketsOpen: totalMaintenance - resolvedMaintenance,
      maintenanceTicketsResolved: resolvedMaintenance,
    };

    const kpis = {
      occupancyPct,
      adr,
      revpar,
      trevpar,
      goppar,
      totalRevenue: Math.round(periodRevenue),
      roomRevenue: Math.round(roomRevenue),
      ancillaryRevenue: Math.round(ancillaryRevenue),
      totalBookings,
      avgLengthOfStay,
      avgBookingValue,
      repeatGuestRate,
      guestSatisfactionScore: avgRating,
      totalReviews: validRatings.length,
      housekeepingEfficiencyPct,
      maintenanceResolvedPct,
      growthVsPrevPeriod,
    };

    return apiResponse({
      kpis,
      trends: [],
      guestSegments: [],
      nationalities,
      channelDistribution,
      operations,
      aiInsights,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return apiError(error);
  }
}
