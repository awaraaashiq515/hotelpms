import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

/**
 * Day Book: All vouchers posted for a given date
 * GET /api/reports/day-book?date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const vouchers = await prisma.voucher.findMany({
      where: {
        propertyId: session.propertyId,
        voucherDate: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        entries: {
          include: {
            account: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { voucherDate: 'asc' },
    });

    const totalDebit = vouchers.reduce((s, v) => s + v.totalDebit, 0);
    const totalCredit = vouchers.reduce((s, v) => s + v.totalCredit, 0);

    return apiResponse(
      { date: dateStr, vouchers, totals: { totalDebit, totalCredit, count: vouchers.length } },
      'Day Book fetched successfully'
    );
  } catch (error) {
    return apiError(error);
  }
}
