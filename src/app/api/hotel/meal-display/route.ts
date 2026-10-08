import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/hotel/meal-display
 * Returns all active check-ins with room, guest, meal plan, and today's room-service orders.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId');
    const where = getMultiTenantWhere(session, propertyIdParam);
    const propertyId = where.propertyId as string;

    if (!propertyId) return apiError(new Error('Property ID not found'), 400);

    // 1. Get all active check-ins with room, guest and reservation (for meal plan)
    const activeCheckIns = await (prisma as any).checkIn.findMany({
      where: {
        status: 'ACTIVE',
        room: { propertyId },
      },
      include: {
        room: {
          include: { roomType: { select: { name: true } } },
        },
        guest: {
          select: { id: true, firstName: true, lastName: true, mobile: true },
        },
        reservation: {
          select: {
            id: true,
            mealPlan: true,
            adults: true,
            children: true,
            arrivalDate: true,
            departureDate: true,
          },
        },
      },
      orderBy: { room: { roomNumber: 'asc' } },
    });

    // 2. Today's room-service POS orders for this property
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const roomIds: string[] = activeCheckIns.map((ci: any) => ci.roomId);

    const todayRoomOrders: any[] = roomIds.length
      ? await (prisma as any).posOrder.findMany({
          where: {
            propertyId,
            roomId: { in: roomIds },
            createdAt: { gte: todayStart, lte: todayEnd },
            status: { notIn: ['CANCELLED'] },
          },
          include: {
            items: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    category: { select: { name: true } },
                  },
                },
              },
            },
            outlet: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    // 3. Map roomId → orders
    const ordersByRoom: Record<string, any[]> = {};
    for (const order of todayRoomOrders) {
      if (!order.roomId) continue;
      if (!ordersByRoom[order.roomId]) ordersByRoom[order.roomId] = [];
      ordersByRoom[order.roomId].push(order);
    }

    const mealPlanLabels: Record<string, string> = {
      RO: 'Room Only',
      CP: 'Bed & Breakfast',
      MAP: 'Half Board',
      AP: 'Full Board',
      EP: 'European Plan',
    };

    const mealsForPlan: Record<string, string[]> = {
      RO: [],
      EP: [],
      CP: ['Breakfast'],
      MAP: ['Breakfast', 'Dinner'],
      AP: ['Breakfast', 'Lunch', 'Dinner'],
    };

    const data = activeCheckIns.map((ci: any) => {
      const orders: any[] = ordersByRoom[ci.roomId] || [];
      const mealPlanCode: string = ci.reservation?.mealPlan || 'RO';
      const orderedItems = orders.flatMap((o: any) =>
        o.items.map((item: any) => ({
          name: item.product?.name || 'Unknown',
          category: item.product?.category?.name || '',
          qty: item.quantity,
          unitPrice: item.unitPrice,
          totalAmount: item.totalAmount,
          orderNo: o.orderNo,
          orderStatus: o.status,
          orderedAt: o.createdAt,
          outlet: o.outlet?.name || 'Restaurant',
        }))
      );

      return {
        checkInId: ci.id,
        roomId: ci.roomId,
        roomNumber: ci.room?.roomNumber || '',
        roomType: ci.room?.roomType?.name || '',
        floor: ci.room?.floor || '',
        guestName: [ci.guest?.firstName, ci.guest?.lastName].filter(Boolean).join(' '),
        guestMobile: ci.guest?.mobile || '',
        mealPlanCode,
        mealPlanLabel: mealPlanLabels[mealPlanCode] || mealPlanCode,
        mealsIncluded: mealsForPlan[mealPlanCode] || [],
        adults: ci.reservation?.adults || 1,
        children: ci.reservation?.children || 0,
        pax: (ci.reservation?.adults || 1) + (ci.reservation?.children || 0),
        checkedInAt: ci.checkedInAt,
        expectedCheckoutAt: ci.expectedCheckoutAt,
        orders: orders.map((o: any) => ({
          orderId: o.id,
          orderNo: o.orderNo,
          status: o.status,
          grandTotal: o.grandTotal,
          createdAt: o.createdAt,
          itemCount: o.items?.length || 0,
        })),
        orderedItems,
        totalOrderValue: orders.reduce((s: number, o: any) => s + o.grandTotal, 0),
        orderCount: orders.length,
      };
    });

    const summary = {
      totalCheckIns: data.length,
      byMealPlan: data.reduce(
        (acc: Record<string, { count: number; label: string }>, ci: any) => {
          const code = ci.mealPlanCode;
          if (!acc[code]) acc[code] = { count: 0, label: ci.mealPlanLabel };
          acc[code].count++;
          return acc;
        },
        {} as Record<string, { count: number; label: string }>
      ),
      totalRoomServiceOrders: todayRoomOrders.length,
      totalRoomServiceRevenue: todayRoomOrders.reduce((s: number, o: any) => s + o.grandTotal, 0),
      totalPax: data.reduce((s: number, ci: any) => s + ci.pax, 0),
    };

    return apiResponse({ rooms: data, summary }, 'Meal display data fetched successfully');
  } catch (error) {
    return apiError(error);
  }
}
