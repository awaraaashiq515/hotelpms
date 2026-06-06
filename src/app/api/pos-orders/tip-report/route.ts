import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere, resolveAdminProperty } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date'); // optional: YYYY-MM-DD
    const propertyIdParam = searchParams.get('propertyId');

    // Determine date range (default: today)
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const where = getMultiTenantWhere(session, propertyIdParam);

    // Fetch today's SETTLED POS orders with settlement + staff info
    const settledOrders = await prisma.posOrder.findMany({
      where: {
        ...where,
        status: 'SETTLED',
        updatedAt: { gte: dayStart, lte: dayEnd },
      },
      include: {
        servedBy: { select: { id: true, fullName: true } },
        staffMember: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Fetch settlements for these orders
    const orderIds = settledOrders.map((o: any) => o.id);
    const settlements = orderIds.length > 0
      ? await prisma.settlement.findMany({
          where: {
            sourceId: { in: orderIds },
            sourceType: 'POS_ORDER',
          },
          select: { sourceId: true, grossAmount: true, paidAmount: true },
        })
      : [];

    // Build a map: orderId -> tip
    const tipByOrder: Record<string, number> = {};
    for (const s of settlements) {
      const tip = (s.paidAmount || 0) - (s.grossAmount || 0);
      if (tip > 0) tipByOrder[s.sourceId] = tip;
    }

    // Also parse staff-portal tip from onlinePaymentReference (fallback/override)
    // For staff-portal orders, onlinePaymentReference is JSON { tip, staffName }
    function parseTipRef(ref?: string | null): { tip: number; staffName: string } {
      if (!ref) return { tip: 0, staffName: '' };
      try {
        const parsed = JSON.parse(ref);
        if (typeof parsed === 'object' && parsed !== null) {
          return { tip: parseFloat(parsed.tip) || 0, staffName: parsed.staffName || '' };
        }
      } catch {}
      return { tip: 0, staffName: '' };
    }

    // Group tips by staff
    const staffTipMap: Record<string, { name: string; tip: number; orders: number }> = {};

    let totalTip = 0;

    for (const order of settledOrders) {
      // Resolve tip amount
      const settlementTip = tipByOrder[order.id] || 0;
      const refData = parseTipRef((order as any).onlinePaymentReference);
      const tip = settlementTip > 0 ? settlementTip : refData.tip;

      if (tip <= 0) continue;
      totalTip += tip;

      // Resolve staff name
      let staffName =
        refData.staffName ||
        (order as any).servedBy?.fullName ||
        (order as any).staffMember?.name ||
        'Counter';

      // Normalise key
      const key = staffName.trim().toLowerCase();
      if (!staffTipMap[key]) {
        staffTipMap[key] = { name: staffName, tip: 0, orders: 0 };
      }
      staffTipMap[key].tip += tip;
      staffTipMap[key].orders += 1;
    }

    const report = Object.values(staffTipMap).sort((a, b) => b.tip - a.tip);

    return apiResponse({ report, totalTip, date: targetDate.toISOString().split('T')[0] }, 'Tip report fetched');
  } catch (error) {
    return apiError(error);
  }
}
