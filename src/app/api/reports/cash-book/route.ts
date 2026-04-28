import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

/**
 * Cash Book: Shows all transactions passing through the Cash Account
 * GET /api/reports/cash-book?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Find Cash Account for this property
    const cashAccount = await prisma.account.findFirst({
      where: {
        propertyId: session.propertyId,
        name: { in: ['Cash Account', 'Cash', 'Petty Cash'] },
      },
    });

    if (!cashAccount) {
      return apiResponse(
        { entries: [], openingBalance: 0, closingBalance: 0 },
        'No cash account found. Please set up a "Cash Account" in accounts.'
      );
    }

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.voucher = { voucherDate: {} };
      if (startDate) dateFilter.voucher.voucherDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.voucher.voucherDate.lte = end;
      }
    }

    const entries = await prisma.voucherEntry.findMany({
      where: {
        accountId: cashAccount.id,
        ...dateFilter,
      },
      include: {
        voucher: {
          select: {
            voucherNo: true,
            voucherType: true,
            voucherDate: true,
            narration: true,
          },
        },
      },
      orderBy: { voucher: { voucherDate: 'asc' } },
    });

    // Calculate running balance starting from opening balance
    let runningBalance = cashAccount.openingBalance;
    const isDebitNature = cashAccount.openingBalanceType === 'DR';
    if (!isDebitNature) runningBalance = -runningBalance;

    const rows = entries.map((entry: any) => {
      runningBalance += entry.debitAmount - entry.creditAmount;
      return {
        id: entry.id,
        date: entry.voucher.voucherDate,
        voucherNo: entry.voucher.voucherNo,
        voucherType: entry.voucher.voucherType,
        particulars: entry.description || entry.voucher.narration || '',
        debit: entry.debitAmount,
        credit: entry.creditAmount,
        balance: runningBalance,
      };
    });

    return apiResponse(
      {
        account: cashAccount,
        entries: rows,
        totals: {
          totalDebit: rows.reduce((s: any, r: any) => s + r.debit, 0),
          totalCredit: rows.reduce((s: any, r: any) => s + r.credit, 0),
          closingBalance: runningBalance,
        },
      },
      'Cash Book fetched successfully'
    );
  } catch (error) {
    return apiError(error);
  }
}
