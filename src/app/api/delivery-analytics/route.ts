import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

type OrderRow = {
  id: string;
  status: string;
  grandTotal: number;
  createdAt: Date;
  updatedAt: Date;
  orderType: string;
  items: any[];
  deliveryRider?: { id: string; fullName: string; phone: string | null } | null;
  deliveryPhone?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  [key: string]: any;
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const propertyId = session.propertyId!;

    const now = new Date();
    const startDate = new Date();
    if (range === '1d') startDate.setDate(now.getDate() - 1);
    else if (range === '30d') startDate.setDate(now.getDate() - 30);
    else startDate.setDate(now.getDate() - 7);

    const orders = (await prisma.posOrder.findMany({
      where: { propertyId, orderType: 'DELIVERY', createdAt: { gte: startDate } },
      include: {
        items: { include: { product: true } },
        deliveryRider: { select: { id: true, fullName: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    })) as unknown as OrderRow[];

    const settled = orders.filter((o: OrderRow) => o.status === 'SETTLED');
    const cancelled = orders.filter((o: OrderRow) => o.status === 'CANCELLED');
    const totalRevenue = settled.reduce((sum: number, o: OrderRow) => sum + (o.grandTotal || 0), 0);

    // Avg delivery time
    const deliveryTimes = settled
      .map((o: OrderRow) => (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000)
      .filter((m: number) => m > 0 && m < 300);
    const avgDeliveryTime = deliveryTimes.length > 0
      ? Math.round(deliveryTimes.reduce((a: number, b: number) => a + b, 0) / deliveryTimes.length)
      : 0;

    // Per-rider performance
    const riderMap: Record<string, { name: string; trips: number; revenue: number; avgTime: number; times: number[] }> = {};
    settled.forEach((o: OrderRow) => {
      const rider = o.deliveryRider;
      if (!rider) return;
      if (!riderMap[rider.id]) {
        riderMap[rider.id] = { name: rider.fullName || rider.phone || 'Rider', trips: 0, revenue: 0, avgTime: 0, times: [] };
      }
      riderMap[rider.id].trips++;
      riderMap[rider.id].revenue += o.grandTotal || 0;
      const mins = (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000;
      if (mins > 0 && mins < 300) riderMap[rider.id].times.push(mins);
    });
    Object.values(riderMap).forEach((r: { name: string; trips: number; revenue: number; avgTime: number; times: number[] }) => {
      r.avgTime = r.times.length > 0
        ? Math.round(r.times.reduce((a: number, b: number) => a + b, 0) / r.times.length)
        : 0;
    });
    const riderStats = Object.values(riderMap).sort((a, b) => b.trips - a.trips);

    // Top items
    const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
    settled.forEach((o: OrderRow) => {
      (o.items as any[]).forEach((item: any) => {
        const name = item.product?.name || 'Unknown';
        if (!itemMap[name]) itemMap[name] = { name, qty: 0, revenue: 0 };
        itemMap[name].qty += item.quantity;
        itemMap[name].revenue += item.totalAmount || 0;
      });
    });
    const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 10);

    // Heatmap points
    const heatmapPoints = settled
      .filter((o: OrderRow) => o.deliveryLat && o.deliveryLng)
      .map((o: OrderRow) => ({ lat: o.deliveryLat, lng: o.deliveryLng, count: 1 }));

    // Customer retention
    const phoneMap: Record<string, number> = {};
    orders.forEach((o: OrderRow) => {
      const phone = o.deliveryPhone;
      if (phone) phoneMap[phone] = (phoneMap[phone] || 0) + 1;
    });
    const repeatCustomers = Object.values(phoneMap).filter((c: number) => c > 1).length;
    const totalCustomers = Object.keys(phoneMap).length;
    const repeatRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

    // Daily breakdown
    const dailyMap: Record<string, { orders: number; revenue: number; delivered: number }> = {};
    orders.forEach((o: OrderRow) => {
      const day = new Date(o.createdAt).toISOString().split('T')[0];
      if (!dailyMap[day]) dailyMap[day] = { orders: 0, revenue: 0, delivered: 0 };
      dailyMap[day].orders++;
      if (o.status === 'SETTLED') {
        dailyMap[day].revenue += o.grandTotal || 0;
        dailyMap[day].delivered++;
      }
    });
    const dailyStats = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    return apiResponse({
      summary: {
        totalOrders: orders.length,
        delivered: settled.length,
        cancelled: cancelled.length,
        cancellationRate: orders.length > 0 ? Math.round((cancelled.length / orders.length) * 100) : 0,
        totalRevenue,
        avgDeliveryTime,
        repeatCustomers,
        totalCustomers,
        repeatRate,
        dateRange: range,
        from: startDate.toISOString().split('T')[0],
        to: now.toISOString().split('T')[0],
      },
      riderStats,
      topItems,
      heatmapPoints,
      dailyStats,
    }, 'Analytics fetched');
  } catch (error) {
    return apiError(error);
  }
}
