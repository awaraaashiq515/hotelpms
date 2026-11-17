import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, resolvePropertyIdentifier } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const propertyParam =
      searchParams.get('propertyId') ||
      searchParams.get('propertyCode') ||
      session?.propertyCode ||
      session?.propertyId;

    let targetPropertyIds: string[] = [];
    let currentProperty: { id: string; name: string; code: string } | null = null;

    if (propertyParam) {
      currentProperty = await resolvePropertyIdentifier(propertyParam, session);
    }

    if (!currentProperty) {
      const first = await prisma.property.findFirst({
        select: { id: true, name: true, code: true, organizationId: true },
        orderBy: { createdAt: 'desc' },
      });
      if (first) {
        currentProperty = { id: first.id, name: first.name, code: first.code };
        targetPropertyIds = [first.id];
        if (first.organizationId) {
          const siblings = await prisma.property.findMany({
            where: { organizationId: first.organizationId },
            select: { id: true },
          });
          targetPropertyIds = siblings.map((s) => s.id);
        }
      }
    } else {
      targetPropertyIds = [currentProperty.id];
      const fullProp = await prisma.property.findUnique({
        where: { id: currentProperty.id },
        select: { organizationId: true },
      });
      if (fullProp?.organizationId) {
        const siblings = await prisma.property.findMany({
          where: { organizationId: fullProp.organizationId },
          select: { id: true },
        });
        targetPropertyIds = siblings.map((s) => s.id);
      }
    }

    if (targetPropertyIds.length === 0) {
      return apiResponse({
        tickets: [],
        staffMembers: [],
        dispatchLogs: [],
        stats: {
          totalActive: 0,
          roomServiceCount: 0,
          restaurantCount: 0,
          barCount: 0,
          takeawayCount: 0,
          newCount: 0,
          preparingCount: 0,
          readyCount: 0,
          servedCount: 0,
          avgWaitMinutes: 0,
          totalStaffOnDuty: 0,
          staffDeliveringCount: 0,
        },
        property: currentProperty,
      });
    }

    const statusParam = searchParams.get('status') || 'ACTIVE';
    const categoryParam = searchParams.get('category') || 'ALL';
    const search = searchParams.get('search')?.trim().toLowerCase() || '';

    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      propertyId: { in: targetPropertyIds },
    };

    if (statusParam === 'ACTIVE') {
      where.status = { in: ['NEW', 'PREPARING', 'READY', 'DISPATCHED'] };
      where.createdAt = { gte: twoDaysAgo };
    } else if (statusParam === 'ALL') {
      where.status = { in: ['NEW', 'PREPARING', 'READY', 'DISPATCHED', 'SERVED', 'COMPLETED'] };
      where.createdAt = { gte: today };
    } else if (statusParam) {
      where.status = statusParam;
      if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(statusParam)) {
        where.createdAt = { gte: today };
      } else {
        where.createdAt = { gte: twoDaysAgo };
      }
    }

    // Fetch KOT tickets
    const kots = await (prisma as any).kotTicket.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNo: true,
            orderType: true,
            tableNo: true,
            roomId: true,
            status: true,
            createdAt: true,
            preparationTime: true,
            staffMemberId: true,
            servedById: true,
            staffMember: {
              select: {
                id: true,
                name: true,
                designation: true,
                phone: true,
              },
            },
            guest: {
              select: {
                firstName: true,
                lastName: true,
                mobile: true,
              },
            },
            servedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
        table: {
          select: {
            id: true,
            name: true,
            floor: {
              select: {
                id: true,
                name: true,
                menuType: true,
              },
            },
          },
        },
        outlet: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                menuType: true,
                kitchenMapping: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    // Fetch All Staff Members for this property & siblings
    const rawStaff = await prisma.staffMember.findMany({
      where: {
        propertyId: { in: targetPropertyIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        designation: true,
        phone: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });

    // Lookup room details
    const roomIds = Array.from(
      new Set(
        kots
          .map((k: any) => k.roomId || k.order?.roomId)
          .filter(Boolean) as string[]
      )
    );

    const roomMap = new Map<string, { roomNumber: string; floor?: string | null }>();
    if (roomIds.length > 0) {
      const rooms = await prisma.room.findMany({
        where: { id: { in: roomIds } },
        select: { id: true, roomNumber: true, floor: true },
      });
      rooms.forEach((r) => roomMap.set(r.id, { roomNumber: r.roomNumber, floor: r.floor }));
    }

    const now = Date.now();
    let totalWaitMinutes = 0;
    let activeTicketsCount = 0;

    let roomServiceCount = 0;
    let restaurantCount = 0;
    let barCount = 0;
    let takeawayCount = 0;
    let newCount = 0;
    let preparingCount = 0;
    let readyCount = 0;
    let servedCount = 0;

    const staffOrdersMap = new Map<string, any[]>();
    rawStaff.forEach((s) => staffOrdersMap.set(s.id, []));

    const transformedTickets = kots.map((kot: any) => {
      const createdTime = new Date(kot.createdAt).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((now - createdTime) / 1000));
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);

      const rId = kot.roomId || kot.order?.roomId;
      const room = rId ? roomMap.get(rId) : null;
      const roomNumber = room?.roomNumber || kot.order?.tableNo || kot.roomId || null;

      // Determine category (Room Service, Restaurant, Bar, Takeaway)
      const orderType = (kot.order?.orderType || '').toUpperCase();
      const hasBarItems = (kot.items || []).some(
        (i: any) =>
          (i.product?.menuType || '').toUpperCase() === 'BAR' ||
          (i.product?.kitchenMapping || '').toUpperCase() === 'BAR'
      );
      const allBarItems =
        (kot.items || []).length > 0 &&
        (kot.items || []).every(
          (i: any) =>
            (i.product?.menuType || '').toUpperCase() === 'BAR' ||
            (i.product?.kitchenMapping || '').toUpperCase() === 'BAR'
        );

      const isRoom =
        Boolean(room) ||
        Boolean(rId) ||
        orderType === 'ROOM_SERVICE' ||
        (kot.order?.tableNo || '').toUpperCase().startsWith('ROOM');

      const isTakeaway =
        orderType === 'TAKEAWAY' ||
        orderType === 'DELIVERY' ||
        orderType === 'PICKUP';

      let sourceCategory: 'ROOM_SERVICE' | 'RESTAURANT' | 'BAR' | 'TAKEAWAY' = 'RESTAURANT';
      let sourceBadge = '';
      let sourceLocation = '';

      if (isRoom) {
        sourceCategory = 'ROOM_SERVICE';
        sourceBadge = `Room ${roomNumber || 'RS'}`;
        sourceLocation = room?.floor ? `${room.floor} Floor` : 'Guest Room Service';
        roomServiceCount++;
      } else if (
        allBarItems ||
        kot.kitchenStation?.toUpperCase() === 'BAR' ||
        (kot.outlet?.name || '').toLowerCase().includes('bar') ||
        (kot.table?.floor?.menuType || '').toUpperCase() === 'BAR'
      ) {
        sourceCategory = 'BAR';
        sourceBadge = kot.table?.name
          ? `Table ${kot.table.name} (Bar)`
          : kot.tableNo
          ? `Bar Table ${kot.tableNo}`
          : 'Bar Lounge Counter';
        sourceLocation = kot.table?.floor?.name || 'Bar & Lounge';
        barCount++;
      } else if (isTakeaway) {
        sourceCategory = 'TAKEAWAY';
        sourceBadge = orderType === 'DELIVERY' ? 'Home Delivery' : 'Takeaway / Pickup';
        sourceLocation =
          kot.order?.guest?.firstName
            ? `${kot.order.guest.firstName} ${kot.order.guest.lastName || ''}`.trim()
            : 'Counter Pickup';
        takeawayCount++;
      } else {
        sourceCategory = 'RESTAURANT';
        sourceBadge = kot.table?.name
          ? `Table ${kot.table.name}`
          : kot.tableNo
          ? `Table ${kot.tableNo}`
          : 'Dining Table';
        sourceLocation = kot.table?.floor?.name || 'Restaurant Floor';
        restaurantCount++;
      }

      // Track status stats
      if (kot.status === 'NEW') newCount++;
      else if (kot.status === 'PREPARING') preparingCount++;
      else if (kot.status === 'READY') readyCount++;
      else if (['SERVED', 'COMPLETED'].includes(kot.status)) servedCount++;

      if (['NEW', 'PREPARING', 'READY'].includes(kot.status)) {
        totalWaitMinutes += elapsedMinutes;
        activeTicketsCount++;
      }

      // Determine urgency
      let urgency: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
      if (elapsedMinutes >= 20) urgency = 'CRITICAL';
      else if (elapsedMinutes >= 10) urgency = 'WARNING';

      const guestName = kot.order?.guest
        ? `${kot.order.guest.firstName} ${kot.order.guest.lastName || ''}`.trim()
        : null;

      const assignedStaffId =
        kot.order?.staffMemberId || kot.order?.servedById || null;

      const assignedStaffName =
        kot.order?.staffMember?.name ||
        kot.order?.servedBy?.fullName ||
        kot.order?.servedBy?.email ||
        kot.createdBy ||
        null;

      const assignedStaffDesignation =
        kot.order?.staffMember?.designation || (isRoom ? 'Room Attendant' : 'Server');

      const items = (kot.items || []).map((i: any) => ({
        id: i.id,
        itemName: i.itemName || i.product?.name || 'Item',
        quantity: i.quantity || 1,
        notes: i.notes || null,
        status: i.status || 'NEW',
        unit: i.product?.unit || null,
        menuType: (i.product?.menuType || 'RESTAURANT').toUpperCase(),
        isBarItem:
          (i.product?.menuType || '').toUpperCase() === 'BAR' ||
          (i.product?.kitchenMapping || '').toUpperCase() === 'BAR',
      }));

      const ticketObj = {
        id: kot.id,
        kotNo: kot.kotNo,
        orderId: kot.orderId,
        orderNo: kot.order?.orderNo || kot.kotNo,
        orderType: kot.order?.orderType || 'DINE_IN',
        status: kot.status,
        createdAt: kot.createdAt,
        updatedAt: kot.updatedAt,
        sourceCategory,
        hasBarItems,
        sourceBadge,
        sourceLocation,
        roomNumber,
        guestName,
        guestPhone: kot.order?.guest?.mobile || null,
        serverName: assignedStaffName,
        assignedStaffId,
        assignedStaffName,
        assignedStaffDesignation,
        kitchenStation: kot.kitchenStation || null,
        outletName: kot.outlet?.name || null,
        elapsedSeconds,
        elapsedMinutes,
        urgency,
        items,
        totalItemsCount: items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0),
      };

      // Add to staff active orders list if assigned and active
      if (
        assignedStaffId &&
        staffOrdersMap.has(assignedStaffId) &&
        ['NEW', 'PREPARING', 'READY', 'DISPATCHED'].includes(kot.status)
      ) {
        staffOrdersMap.get(assignedStaffId)!.push({
          kotId: kot.id,
          orderNo: ticketObj.orderNo,
          kotNo: ticketObj.kotNo,
          roomNumber: roomNumber || sourceBadge,
          sourceBadge,
          status: kot.status,
          elapsedMinutes,
          assignedAt: kot.updatedAt,
        });
      }

      return ticketObj;
    });

    // Build Staff Summaries
    const staffSummaries = rawStaff.map((staff) => {
      const activeOrders = staffOrdersMap.get(staff.id) || [];
      let status: 'AVAILABLE' | 'DELIVERING' | 'BUSY' = 'AVAILABLE';
      if (activeOrders.length >= 2) {
        status = 'BUSY';
      } else if (activeOrders.length === 1) {
        status = 'DELIVERING';
      }

      return {
        id: staff.id,
        name: staff.name,
        designation: staff.designation || 'Staff',
        phone: staff.phone || null,
        isActive: staff.isActive,
        activeOrders,
        completedTodayCount: 0,
        status,
      };
    });

    // Fetch recent dispatch activity logs
    let dispatchLogs: any[] = [];
    try {
      const rawLogs = await (prisma as any).kotStatusLog.findMany({
        where: {
          changedAt: { gte: today },
        },
        include: {
          kot: {
            select: {
              kotNo: true,
              tableNo: true,
              roomId: true,
            },
          },
        },
        orderBy: { changedAt: 'desc' },
        take: 20,
      });

      dispatchLogs = rawLogs.map((log: any) => {
        const time = new Date(log.changedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        return {
          id: log.id,
          time,
          staffName: log.changedBy || 'Staff Member',
          roomOrTable: log.kot?.roomId ? `Room ${log.kot.roomId}` : (log.kot?.tableNo ? `Table ${log.kot.tableNo}` : 'Order'),
          action: log.remarks || `Status changed: ${log.oldStatus} -> ${log.newStatus}`,
          status: log.newStatus,
        };
      });
    } catch (logErr) {
      console.warn('Failed to load dispatch logs:', logErr);
    }

    // Apply Client filters
    let filtered = transformedTickets;
    if (categoryParam !== 'ALL') {
      if (categoryParam === 'BAR') {
        filtered = filtered.filter(
          (t: any) => t.sourceCategory === 'BAR' || t.hasBarItems
        );
      } else {
        filtered = filtered.filter((t: any) => t.sourceCategory === categoryParam);
      }
    }

    if (search) {
      filtered = filtered.filter((t: any) => {
        const matchKot = t.kotNo.toLowerCase().includes(search);
        const matchOrder = t.orderNo.toLowerCase().includes(search);
        const matchBadge = t.sourceBadge.toLowerCase().includes(search);
        const matchGuest = (t.guestName || '').toLowerCase().includes(search);
        const matchStaff = (t.assignedStaffName || '').toLowerCase().includes(search);
        const matchItem = t.items.some((i: any) =>
          i.itemName.toLowerCase().includes(search)
        );
        return matchKot || matchOrder || matchBadge || matchGuest || matchStaff || matchItem;
      });
    }

    const avgWaitMinutes =
      activeTicketsCount > 0 ? Math.round(totalWaitMinutes / activeTicketsCount) : 0;

    const staffDeliveringCount = staffSummaries.filter((s) => s.status !== 'AVAILABLE').length;

    return apiResponse({
      tickets: filtered,
      allTicketsCount: transformedTickets.length,
      staffMembers: staffSummaries,
      dispatchLogs,
      stats: {
        totalActive: newCount + preparingCount + readyCount,
        roomServiceCount,
        restaurantCount,
        barCount,
        takeawayCount,
        newCount,
        preparingCount,
        readyCount,
        servedCount,
        avgWaitMinutes,
        totalStaffOnDuty: staffSummaries.length,
        staffDeliveringCount,
      },
      property: currentProperty,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { kotId, itemId, status, remarks, changedBy, staffMemberId, staffName } = body;

    if (!kotId && !itemId) {
      return apiError(new Error('kotId or itemId is required'), 400);
    }

    const staffActor =
      changedBy ||
      staffName ||
      (session as any)?.user?.name ||
      (session as any)?.fullName ||
      session?.email ||
      'Master Display Staff';

    // 1. Update individual item
    if (itemId) {
      const updatedItem = await (prisma as any).kotItem.update({
        where: { id: itemId },
        data: { status: status || 'READY' },
      });
      return apiResponse(updatedItem, `Item status updated to ${status}`);
    }

    // 2. Update whole KOT ticket
    const existing = await (prisma as any).kotTicket.findUnique({
      where: { id: kotId },
      include: { items: true, order: true },
    });

    if (!existing) {
      return apiError(new Error('KOT Ticket not found'), 404);
    }

    const oldStatus = existing.status;
    const targetStatus = status || oldStatus;

    const updateData: any = {
      updatedAt: new Date(),
    };
    if (status) {
      updateData.status = targetStatus;
    }

    const updated = await (prisma as any).kotTicket.update({
      where: { id: kotId },
      data: updateData,
      include: { items: true },
    });

    // If staff member assigned, update order
    if (staffMemberId && existing.orderId) {
      try {
        await prisma.posOrder.update({
          where: { id: existing.orderId },
          data: { staffMemberId },
        });
      } catch (staffErr) {
        console.warn('Failed to assign staff to order:', staffErr);
      }
    }

    // Update child items status
    if (['PREPARING', 'READY', 'SERVED', 'CANCELLED'].includes(targetStatus)) {
      try {
        await (prisma as any).kotItem.updateMany({
          where: { kotId },
          data: { status: targetStatus },
        });
      } catch (err) {
        console.warn('Item status sync error:', err);
      }
    }

    // Log status change
    try {
      const remarkText =
        remarks ||
        (staffMemberId
          ? `Order assigned to ${staffActor} for Room Delivery`
          : `Master Display status transition: ${oldStatus} -> ${targetStatus}`);

      await (prisma as any).kotStatusLog.create({
        data: {
          kotId,
          oldStatus,
          newStatus: targetStatus,
          changedBy: staffActor,
          remarks: remarkText,
        },
      });
    } catch (logErr) {
      console.warn('Status log failed:', logErr);
    }

    return apiResponse(updated, `Ticket #${existing.kotNo} updated successfully`);
  } catch (error) {
    return apiError(error);
  }
}
