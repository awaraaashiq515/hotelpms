import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      ...getMultiTenantWhere(session),
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // 1. Total Waste Cost & Quantity
    const totals = await prisma.waste.aggregate({
      where,
      _sum: {
        totalCost: true,
        quantity: true,
      },
      _count: {
        id: true,
      }
    });

    // 2. Waste by Reason
    const byReason = await prisma.waste.groupBy({
      by: ['reason'],
      where,
      _sum: {
        totalCost: true,
        quantity: true,
      },
      _count: {
        id: true,
      }
    });

    // 3. Most Wasted Products (Top 5)
    const topWasted = await prisma.waste.groupBy({
      by: ['productName'],
      where,
      _sum: {
        totalCost: true,
        quantity: true,
      },
      orderBy: {
        _sum: {
          totalCost: 'desc',
        }
      },
      take: 5
    });

    // 4. Waste by Staff
    const byStaff = await prisma.waste.groupBy({
      by: ['staffName'],
      where,
      _sum: {
        totalCost: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalCost: 'desc',
        }
      },
      take: 5
    });

    // 5. Daily Trend
    const wastes = await prisma.waste.findMany({
      where,
      select: {
        createdAt: true,
        totalCost: true,
      },
      orderBy: {
        createdAt: 'asc',
      }
    });

    const dailyTrend: Record<string, number> = {};
    wastes.forEach((w: any) => {
      const date = w.createdAt.toISOString().split('T')[0];
      dailyTrend[date] = (dailyTrend[date] || 0) + w.totalCost;
    });

    const trendArray = Object.entries(dailyTrend).map(([date, cost]) => ({
      date,
      cost,
    }));

    return apiResponse({
      summary: {
        totalCost: totals._sum.totalCost || 0,
        totalQuantity: totals._sum.quantity || 0,
        totalEntries: totals._count.id,
      },
      byReason,
      topWasted,
      byStaff,
      dailyTrend: trendArray,
    });
  } catch (error) {
    return apiError(error);
  }
}
