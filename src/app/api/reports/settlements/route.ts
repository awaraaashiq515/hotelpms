import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return apiError(new Error('Start and End dates are required (YYYY-MM-DD)'), 400);
    }

    const settlements = await prisma.settlement.findMany({
      where: {
        propertyId: session.propertyId!,
        settlementDate: {
          gte: new Date(startDate + 'T00:00:00'),
          lte: new Date(endDate + 'T23:59:59.999'),
        },
      },
      orderBy: { settlementDate: 'desc' },
    });

    // Aggregate by payment method
    const paymentModes = await prisma.paymentMode.findMany({
      where: { propertyId: session.propertyId! }
    });

    const modeSummary: Record<string, { name: string, count: number, total: number }> = {};
    paymentModes.forEach((m: any) => {
      modeSummary[m.id] = { name: m.name, count: 0, total: 0 };
    });

    let totalGross = 0;
    let totalPaid = 0;
    let totalBalance = 0;

    settlements.forEach((s: any) => {
      totalGross += s.grossAmount;
      totalPaid += s.paidAmount;
      totalBalance += s.balanceAmount;

      if (s.paymentModeId && modeSummary[s.paymentModeId]) {
        modeSummary[s.paymentModeId].count += 1;
        modeSummary[s.paymentModeId].total += s.paidAmount;
      }
    });

    return apiResponse({
      summary: {
        totalGross,
        totalPaid,
        totalBalance,
        count: settlements.length
      },
      byMode: Object.values(modeSummary).filter(m => m.count > 0),
      settlements
    });
  } catch (error) {
    return apiError(error);
  }
}
