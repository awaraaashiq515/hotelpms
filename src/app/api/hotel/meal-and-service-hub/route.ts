import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

function getMealPlanDetails(code: string) {
  const norm = (code || 'EP').toUpperCase();
  switch (norm) {
    case 'CP':
      return {
        code: 'CP',
        name: 'CP — Continental Plan',
        badge: 'Breakfast Included',
        includedMeals: { breakfast: true, lunch: false, dinner: false },
        color: 'amber',
      };
    case 'MAP':
      return {
        code: 'MAP',
        name: 'MAP — Modified American Plan',
        badge: 'Breakfast + Dinner Included',
        includedMeals: { breakfast: true, lunch: false, dinner: true },
        color: 'sky',
      };
    case 'AP':
      return {
        code: 'AP',
        name: 'AP — American Plan (Full Board)',
        badge: 'All Meals: Bfast, Lunch & Dinner',
        includedMeals: { breakfast: true, lunch: true, dinner: true },
        color: 'emerald',
      };
    case 'RO':
    case 'EP':
    default:
      return {
        code: 'EP',
        name: 'EP — European Plan (Room Only)',
        badge: 'No Meals Included (Room Only)',
        includedMeals: { breakfast: false, lunch: false, dinner: false },
        color: 'slate',
      };
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const propertyWhere = getMultiTenantWhere(session, propertyIdParam);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Fetch active check-ins and confirmed reservations for current stay
    const reservations = await prisma.reservation.findMany({
      where: {
        ...propertyWhere,
        status: { in: ['CHECKED_IN', 'CONFIRMED'] },
        arrivalDate: { lte: todayEnd },
        departureDate: { gte: todayStart },
      },
      include: {
        guest: true,
        roomType: true,
        rooms: {
          include: {
            room: true,
          },
        },
      },
      orderBy: { arrivalDate: 'asc' },
    });

    // 2. Fetch pending / recent housekeeping tasks
    const housekeepingTasks = await prisma.housekeepingTask.findMany({
      where: {
        ...propertyWhere,
        status: { in: ['PENDING', 'IN_PROGRESS', 'QUEUED'] },
      },
      include: {
        room: true,
      },
      orderBy: { requestedAt: 'desc' },
      take: 30,
    });

    // 3. Fetch active Room Service food orders / waiter calls
    const activeRoomServiceOrders = await prisma.posOrder.findMany({
      where: {
        ...propertyWhere,
        orderType: 'ROOM_SERVICE',
        status: { in: ['PENDING', 'PREPARING', 'READY'] },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        guest: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // 4. Fetch recent unread service call notifications from room portal
    const notifications = await prisma.notification.findMany({
      where: {
        ...propertyWhere,
        status: { in: ['UNREAD', 'PENDING'] },
        type: { in: ['ROOM_SERVICE_ORDER', 'SERVICE_REQUEST', 'HOUSEKEEPING', 'WAITER_CALL'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Aggregate summary statistics
    const planCounts = {
      EP: { count: 0, pax: 0 },
      CP: { count: 0, pax: 0 },
      MAP: { count: 0, pax: 0 },
      AP: { count: 0, pax: 0 },
    };

    let totalPax = 0;
    let totalAdults = 0;
    let totalChildren = 0;

    const formattedRooms = reservations.map((res) => {
      const assignedRoom = res.rooms?.[0]?.room || null;
      const roomNumber = assignedRoom?.roomNumber || 'Auto-Assign';
      const floor = assignedRoom?.floor || '1';
      const roomTypeName = res.roomType?.name || 'Standard Room';

      const adults = res.adults || 1;
      const extraAdults = res.extraAdults || 0;
      const children = res.children || 0;
      const totalRoomPax = adults + extraAdults + children;

      totalPax += totalRoomPax;
      totalAdults += adults + extraAdults;
      totalChildren += children;

      const planInfo = getMealPlanDetails(res.mealPlan);

      if (planCounts[planInfo.code as keyof typeof planCounts]) {
        planCounts[planInfo.code as keyof typeof planCounts].count += 1;
        planCounts[planInfo.code as keyof typeof planCounts].pax += totalRoomPax;
      }

      // Check for active calls related to this room
      const roomTasks = housekeepingTasks.filter((t) => t.roomId === assignedRoom?.id || t.room?.roomNumber === roomNumber);

      return {
        id: res.id,
        bookingNo: res.bookingNo,
        status: res.status,
        roomId: assignedRoom?.id || null,
        roomNumber,
        floor,
        roomTypeName,
        guestId: res.guestId,
        guestName: `${res.guest?.firstName || ''} ${res.guest?.lastName || ''}`.trim() || 'Guest',
        guestMobile: res.guest?.mobile || '—',
        adults,
        extraAdults,
        children,
        totalPax: totalRoomPax,
        mealPlan: planInfo.code,
        mealPlanName: planInfo.name,
        mealPlanBadge: planInfo.badge,
        mealPlanColor: planInfo.color,
        includedMeals: planInfo.includedMeals,
        extraBed: res.extraBed,
        extraBedCharge: res.extraBedCharge,
        specialRequests: res.addOnNotes || '',
        arrivalDate: res.arrivalDate,
        departureDate: res.departureDate,
        activeTasksCount: roomTasks.length,
      };
    });

    // Format unified live service calls feed
    const formattedLiveCalls: any[] = [];

    // Housekeeping tasks
    housekeepingTasks.forEach((t) => {
      formattedLiveCalls.push({
        id: t.id,
        kind: 'HOUSEKEEPING',
        title: `Room ${t.room?.roomNumber || '—'} · Housekeeping Request`,
        roomNumber: t.room?.roomNumber || '—',
        taskType: t.taskType || 'CLEANING',
        notes: t.notes || t.remarks || 'Room service/cleaning requested',
        priority: t.priority || 'NORMAL',
        status: t.status,
        createdAt: t.requestedAt || new Date(),
        source: t.source || 'ROOM_PORTAL',
      });
    });

    // Room Service dining & waiter orders
    activeRoomServiceOrders.forEach((order) => {
      // Extract room number from instructions if available
      let roomNo = 'Room Service';
      if (order.deliveryInstructions?.includes('ROOM:')) {
        const match = order.deliveryInstructions.match(/ROOM:([^|]+)/);
        if (match) roomNo = match[1].trim();
      }

      const itemsSummary = order.items?.map((it) => `${it.product?.name || 'Item'} (x${it.quantity})`).join(', ') || 'Room Service Dining';

      formattedLiveCalls.push({
        id: order.id,
        kind: 'ROOM_SERVICE',
        title: `Room ${roomNo} · Waiter / Food Service Order #${order.orderNo}`,
        roomNumber: roomNo,
        taskType: 'ROOM_SERVICE_DINING',
        notes: itemsSummary,
        priority: 'HIGH',
        status: order.status,
        totalAmount: order.grandTotal,
        createdAt: order.createdAt,
        source: 'ROOM_PORTAL',
      });
    });

    // Unread Notifications for direct waiter calls
    notifications.forEach((n) => {
      let meta: any = {};
      try {
        meta = n.metadata ? JSON.parse(n.metadata) : {};
      } catch {}

      const exists = formattedLiveCalls.some((c) => c.id === meta.taskId || c.id === meta.orderId);
      if (!exists) {
        formattedLiveCalls.push({
          id: n.id,
          kind: 'WAITER_CALL',
          title: n.title,
          roomNumber: meta.roomNumber || '—',
          taskType: n.type || 'CALL_WAITER',
          notes: n.message,
          priority: n.priority || 'HIGH',
          status: 'PENDING',
          createdAt: n.createdAt,
          source: 'ROOM_PORTAL',
        });
      }
    });

    // Sort live calls by newest first
    formattedLiveCalls.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return apiResponse({
      summary: {
        totalRoomsOccupied: formattedRooms.length,
        totalPax,
        totalAdults,
        totalChildren,
        plans: planCounts,
        pendingCallsCount: formattedLiveCalls.filter((c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length,
      },
      rooms: formattedRooms,
      liveCalls: formattedLiveCalls,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { id, kind, status } = body;

    if (!id) {
      return apiError(new Error('ID is required'), 400);
    }

    const newStatus = status || 'COMPLETED';

    if (kind === 'HOUSEKEEPING') {
      const updated = await prisma.housekeepingTask.update({
        where: { id },
        data: {
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date() : undefined,
        },
      });
      return apiResponse(updated, 'Housekeeping task updated successfully');
    } else if (kind === 'ROOM_SERVICE') {
      const updated = await prisma.posOrder.update({
        where: { id },
        data: {
          status: newStatus === 'COMPLETED' ? 'DELIVERED' : newStatus,
        },
      });
      return apiResponse(updated, 'Room service order updated successfully');
    } else {
      const updated = await prisma.notification.update({
        where: { id },
        data: {
          status: 'READ',
        },
      });
      return apiResponse(updated, 'Service call attended successfully');
    }
  } catch (error) {
    return apiError(error);
  }
}
