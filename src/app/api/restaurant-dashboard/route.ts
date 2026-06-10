import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(_request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.propertyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    if (session?.role === 'SUPER_ADMIN') {
      return NextResponse.json({ message: 'Forbidden: SUPER_ADMIN access restricted' }, { status: 403 });
    }

    const propertyId = session.propertyId;

    // ── Date helpers ────────────────────────────────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // ── Run all queries in parallel for speed ───────────────────────────────
    const [
      allTables,
      activeKotCount,
      inProgressOrderCount,
      paymentPendingCount,
      todayInvoices,
      todayOrders,
      todayOrdersByType,
      todayTopItems,
      recentSettled,
      allTimeCustomers,
      allTimeRevenue,
      // Staff attendance today
      todayAttendanceRaw,
      // All active staff (users + staffMembers) for the property
      activeUsers,
      activeStaffMembers,
      // Staff location pings
      staffLocationData,
    ] = await Promise.all([
      // 1. Tables (all, with active order if any)
      prisma.table.findMany({
        where: { propertyId },
        select: {
          id: true,
          name: true,
          status: true,
          capacity: true,
          posOrders: {
            where: { status: { notIn: ['SETTLED', 'CANCELLED', 'COMPLETED'] } },
            select: {
              id: true,
              orderNo: true,
              grandTotal: true,
              guestCount: true,
              status: true,
              createdAt: true,
              kotTickets: {
                select: { createdAt: true },
                orderBy: { createdAt: 'asc' },
                take: 1,
              },
            },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
      }),

      // 2. Active KOTs in kitchen (NEW or IN_PROGRESS)
      prisma.kotTicket.count({
        where: {
          propertyId,
          status: { in: ['NEW', 'IN_PROGRESS'] },
        },
      }),

      // 3. Orders currently in progress
      prisma.posOrder.count({
        where: {
          propertyId,
          status: { in: ['KOT_RUNNING', 'IN_KITCHEN', 'SERVED', 'BILL_PRINTED', 'HOLD'] },
        },
      }),

      // 4. Orders awaiting payment
      prisma.posOrder.count({
        where: {
          propertyId,
          status: 'PAYMENT_AWAITING_APPROVAL',
        },
      }),

      // 5. Today's settled invoices — revenue
      prisma.invoice.aggregate({
        where: {
          propertyId,
          invoiceDate: { gte: todayStart, lte: todayEnd },
          invoiceStatus: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // 6. Today's orders — count + guest count
      prisma.posOrder.aggregate({
        where: {
          propertyId,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { notIn: ['CANCELLED'] },
        },
        _count: { id: true },
        _sum: { guestCount: true, grandTotal: true },
      }),

      // 7. Today's orders grouped by type
      prisma.posOrder.groupBy({
        by: ['orderType'],
        where: {
          propertyId,
          createdAt: { gte: todayStart, lte: todayEnd },
          status: { notIn: ['CANCELLED'] },
        },
        _count: { id: true },
        _sum: { grandTotal: true },
      }),

      // 8. Today's top selling items
      prisma.posOrderItem.groupBy({
        by: ['productId'],
        where: {
          posOrder: {
            propertyId,
            createdAt: { gte: todayStart, lte: todayEnd },
            status: { notIn: ['CANCELLED'] },
          },
        },
        _sum: { quantity: true, totalAmount: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),

      // 9. Recent settled orders (last 5)
      prisma.posOrder.findMany({
        where: {
          propertyId,
          status: { in: ['SETTLED', 'COMPLETED'] },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          orderNo: true,
          grandTotal: true,
          orderType: true,
          tableNo: true,
          updatedAt: true,
        },
      }),

      // 10. All-time customers (sum of guestCount for property)
      prisma.posOrder.aggregate({
        where: {
          propertyId,
          status: { notIn: ['CANCELLED'] },
        },
        _sum: { guestCount: true },
      }),

      // 11. All-time revenue
      prisma.invoice.aggregate({
        where: {
          propertyId,
          invoiceStatus: { not: 'CANCELLED' },
        },
        _sum: { totalAmount: true },
      }),

      // 12. Today's attendance records (both users & staff members)
      prisma.attendance.findMany({
        where: {
          propertyId,
          clockIn: { gte: todayStart, lte: todayEnd },
        },
        include: {
          user: { select: { id: true, fullName: true, designation: true } },
          staffMember: { select: { id: true, name: true, designation: true } },
        },
        orderBy: { clockIn: 'asc' },
      }),

      // 13. All active users for this property
      prisma.user.findMany({
        where: { propertyId, isActive: true },
        select: { id: true, fullName: true, designation: true, wtStatus: true },
      }),

      // 14. All active staff members
      prisma.staffMember.findMany({
        where: { propertyId, isActive: true },
        select: { id: true, name: true, designation: true, userId: true },
      }),

      // 15. Latest staff location pings (most recent per user)
      prisma.user.findMany({
        where: { propertyId, isActive: true },
        select: {
          id: true,
          fullName: true,
          designation: true,
          wtStatus: true,
          staffLocationPings: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              lat: true,
              lng: true,
              distanceFromBase: true,
              isOutOfRange: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    // ── Enrich top items with product names ─────────────────────────────────
    const topItemsEnriched = await Promise.all(
      todayTopItems.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true },
        });
        return {
          productId: item.productId,
          name: product?.name || 'Unknown',
          qty: item._sum.quantity || 0,
          revenue: item._sum.totalAmount || 0,
        };
      })
    );

    // ── Table summary ────────────────────────────────────────────────────────
    const now = new Date();
    const totalTables = allTables.length;
    const occupiedTables = allTables.filter(
      (t: any) => t.status !== 'VACANT'
    ).length;
    const vacantTables = totalTables - occupiedTables;

    // Enrich tables with elapsed time
    const tablesEnriched = (allTables as any[]).map((t: any) => {
      const activeOrder = t.posOrders[0] || null;
      let elapsedMinutes = 0;
      if (activeOrder) {
        const startTime = activeOrder.kotTickets[0]
          ? new Date(activeOrder.kotTickets[0].createdAt)
          : new Date(activeOrder.createdAt);
        elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);
      }
      return {
        id: t.id,
        name: t.name,
        status: t.status,
        capacity: t.capacity,
        activeOrder: activeOrder
          ? {
              orderNo: activeOrder.orderNo,
              grandTotal: activeOrder.grandTotal,
              guestCount: activeOrder.guestCount,
              status: activeOrder.status,
              elapsedMinutes,
            }
          : null,
      };
    });

    // ── Staff attendance processing ──────────────────────────────────────────

    const attendanceToday = (todayAttendanceRaw as any[]).map((rec: any) => {
      const name = rec.user?.fullName || rec.staffMember?.name || 'Unknown';
      const designation = rec.user?.designation || rec.staffMember?.designation || '';
      const clockIn = new Date(rec.clockIn);
      const clockOut = rec.clockOut ? new Date(rec.clockOut) : null;
      const hoursWorked = clockOut
        ? Math.round(((clockOut.getTime() - clockIn.getTime()) / 3600000) * 10) / 10
        : Math.round(((now.getTime() - clockIn.getTime()) / 3600000) * 10) / 10;

      return {
        id: rec.id,
        name,
        designation,
        clockIn: rec.clockIn,
        clockOut: rec.clockOut,
        hoursWorked,
        stillPresent: !rec.clockOut,
        type: rec.userId ? 'USER' : 'STAFF',
      };
    });

    // IDs of staff who clocked in today
    const clockedInUserIds = new Set(
      (todayAttendanceRaw as any[])
        .filter((r: any) => r.userId)
        .map((r: any) => r.userId)
    );
    const clockedInStaffIds = new Set(
      (todayAttendanceRaw as any[])
        .filter((r: any) => r.staffMemberId)
        .map((r: any) => r.staffMemberId)
    );

    // Staff who haven't arrived yet
    const notArrivedUsers = (activeUsers as any[])
      .filter((u: any) => !clockedInUserIds.has(u.id))
      .map((u: any) => ({ id: u.id, name: u.fullName, designation: u.designation, type: 'USER' }));
    const notArrivedStaff = (activeStaffMembers as any[])
      .filter((s: any) => !clockedInStaffIds.has(s.id))
      .map((s: any) => ({ id: s.id, name: s.name, designation: s.designation, type: 'STAFF' }));
    const notArrivedToday = [...notArrivedUsers, ...notArrivedStaff];

    const presentNow = attendanceToday.filter((r) => r.stillPresent).length;
    const totalActiveStaff = activeUsers.length + activeStaffMembers.length;

    // ── Staff location ───────────────────────────────────────────────────────
    const staffLocations = (staffLocationData as any[]).map((u: any) => {
      const ping = u.staffLocationPings[0] || null;
      return {
        userId: u.id,
        fullName: u.fullName,
        designation: u.designation,
        wtStatus: u.wtStatus,
        lastSeen: ping?.createdAt || null,
        isTracking: !!ping,
        isOutOfRange: ping?.isOutOfRange ?? false,
        distanceFromBase: ping?.distanceFromBase ?? null,
        lat: ping?.lat ?? null,
        lng: ping?.lng ?? null,
      };
    });

    // ── Order type breakdown ─────────────────────────────────────────────────
    const orderTypeMap: Record<string, { count: number; revenue: number }> = {
      DINE_IN: { count: 0, revenue: 0 },
      TAKEAWAY: { count: 0, revenue: 0 },
      DELIVERY: { count: 0, revenue: 0 },
      PARKING: { count: 0, revenue: 0 },
    };
    (todayOrdersByType as any[]).forEach((row: any) => {
      const key = row.orderType as string;
      orderTypeMap[key] = {
        count: row._count.id || 0,
        revenue: row._sum.grandTotal || 0,
      };
    });

    // ── Avg order value ──────────────────────────────────────────────────────
    const todayTotalSales = todayInvoices._sum.totalAmount || 0;
    const todayOrderCount = todayOrders._count.id || 0;
    const avgOrderValue = todayOrderCount > 0 ? todayTotalSales / todayOrderCount : 0;

    return NextResponse.json({
      success: true,
      data: {
        // Live ops
        live: {
          totalTables,
          occupiedTables,
          vacantTables,
          activeKotCount,
          inProgressOrderCount,
          paymentPendingCount,
          tables: tablesEnriched,
        },
        // Today's business
        today: {
          totalSales: todayTotalSales,
          invoiceCount: todayInvoices._count.id || 0,
          orderCount: todayOrderCount,
          totalCustomers: todayOrders._sum.guestCount || 0,
          avgOrderValue: Math.round(avgOrderValue),
          orderTypes: orderTypeMap,
          topItems: topItemsEnriched,
          recentSettled,
        },
        // All-time
        allTime: {
          totalCustomers: allTimeCustomers._sum.guestCount || 0,
          totalRevenue: allTimeRevenue._sum.totalAmount || 0,
        },
        // Staff
        staff: {
          totalActive: totalActiveStaff,
          presentNow,
          notArrivedCount: notArrivedToday.length,
          attendanceToday,
          notArrivedToday,
          locations: staffLocations,
        },
      },
    });
  } catch (error: any) {
    console.error('[Restaurant Dashboard]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Server error' },
      { status: 500 }
    );
  }
}
