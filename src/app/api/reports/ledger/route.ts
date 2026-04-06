import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

/**
 * Ledger Statement: All transactions for a specific account with running balance
 * GET /api/reports/ledger?accountId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!accountId) {
      return apiError(new Error('accountId is required'), 400);
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { accountGroup: true },
    });
    if (!account) return apiError(new Error('Account not found'), 404);

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
        accountId,
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

    // Calculate running balance
    let runningBalance = account.openingBalance * (account.openingBalanceType === 'DR' ? 1 : -1);

    const rows = entries.map((entry) => {
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
        balanceType: runningBalance >= 0 ? 'DR' : 'CR',
      };
    });

    return apiResponse(
      {
        account,
        openingBalance: account.openingBalance,
        openingBalanceType: account.openingBalanceType,
        entries: rows,
        totals: {
          totalDebit: rows.reduce((s, r) => s + r.debit, 0),
          totalCredit: rows.reduce((s, r) => s + r.credit, 0),
          closingBalance: Math.abs(runningBalance),
          closingBalanceType: runningBalance >= 0 ? 'DR' : 'CR',
        },
      },
      'Ledger statement fetched successfully'
    );
  } catch (error) {
    return apiError(error);
  }
}
