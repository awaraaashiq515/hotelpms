import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError, apiResponse } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { actualCash, notes } = body;

    // 1. Find active shift for this user/property
    const activeShift = await prisma.shift.findFirst({
      where: {
        propertyId: session.propertyId as string,
        cashierId: session.id,
        status: 'OPEN'
      },
      include: {
        topUps: true,
        withdrawals: true
      }
    });

    if (!activeShift) {
      return apiError(new Error('No active shift found to close.'), 400);
    }

    // 2. Calculate Expected Cash
    // Expected = Opening Cash + Cash Sales + Top-ups - Withdrawals
    
    // Find all cash sales during this shift
    const cashSalesResult = await prisma.posOrder.aggregate({
      where: {
        propertyId: session.propertyId as string,
        servedById: session.id,
        createdAt: { gte: activeShift.openedAt },
        status: 'COMPLETED'
      },
      _sum: {
        grandTotal: true
      }
    });

    const cashSales = cashSalesResult._sum.grandTotal || 0;
    const totalTopUps = activeShift.topUps.reduce((acc: number, t: any) => acc + t.amount, 0);
    const totalWithdrawals = activeShift.withdrawals.reduce((acc: number, w: any) => acc + w.amount, 0);

    const expectedCash = activeShift.openingCash + cashSales + totalTopUps - totalWithdrawals;
    const discrepancy = actualCash - expectedCash;

    // 3. Close the shift
    const closedShift = await prisma.shift.update({
      where: { id: activeShift.id },
      data: {
        closedAt: new Date(),
        actualCash,
        expectedCash,
        discrepancy,
        status: 'CLOSED',
        notes: notes || activeShift.notes
      }
    });

    return apiResponse({
      shift: closedShift,
      expectedCash,
      actualCash,
      discrepancy
    }, 'Shift handed over successfully');

  } catch (error) {
    return apiError(error);
  }
}
