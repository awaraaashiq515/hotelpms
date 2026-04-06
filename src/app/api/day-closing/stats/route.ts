import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyId = session.propertyId!;
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const dayStart = new Date(dateStr + 'T00:00:00');
    const dayEnd = new Date(dateStr + 'T23:59:59.999');

    // 1. Cash Sales from Bills/Invoices
    // We look for Payments recorded today with CASH mode
    const cashPayments = await prisma.payment.aggregate({
      where: {
        propertyId,
        paymentDate: { gte: dayStart, lte: dayEnd },
        paymentMode: { name: { contains: 'CASH' } } 
      },
      _sum: { amount: true }
    });

    // 2. Total Sales (all modes)
    const allPayments = await prisma.payment.aggregate({
      where: {
        propertyId,
        paymentDate: { gte: dayStart, lte: dayEnd }
      },
      _sum: { amount: true }
    });

    // 3. Cash Received (e.g. from Folios/Credit settlements)
    const settlements = await prisma.settlement.aggregate({
      where: {
        propertyId,
        settlementDate: { gte: dayStart, lte: dayEnd },
      },
      _sum: { paidAmount: true }
    });

    // 4. Expenses (Cash only)
    const expenses = await prisma.expense.aggregate({
      where: {
        propertyId,
        expenseDate: { gte: dayStart, lte: dayEnd },
        paymentMode: { contains: 'CASH' }
      },
      _sum: { amount: true }
    });

    // 5. Get Last Closing Balance
    const lastClosing = await prisma.dayClosing.findFirst({
      where: { propertyId, closingDate: { lt: dayStart } },
      orderBy: { closingDate: 'desc' }
    });

    const cashSales = cashPayments._sum?.amount || 0;
    const cashReceived = settlements._sum?.paidAmount || 0;
    const cashPaid = expenses._sum?.amount || 0;
    const totalSales = allPayments._sum?.amount || 0;
    const openingCash = lastClosing?.actualCash || 0;

    return apiResponse({
      summary: {
        date: dateStr,
        openingCash,
        cashSales,
        cashReceived,
        cashPaid,
        totalSales,
        expectedCash: openingCash + cashSales + cashReceived - cashPaid
      }
    }, 'Day stats fetched successfully');
  } catch (error) {
    console.error('Day Stats Error:', error);
    return apiError(error);
  }
}
