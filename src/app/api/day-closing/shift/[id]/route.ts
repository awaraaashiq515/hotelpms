import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// POST: Close a shift and generate day closing report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId)
      return apiError(new Error('Unauthorized'), 401);

    const { id: shiftId } = await params;
    const body = await request.json();
    const { actualCash, notes } = body;

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        withdrawals: true,
        topUps: true,
      },
    });
    if (!shift || shift.status !== 'OPEN') {
      return apiError(new Error('Shift not found or already closed'), 400);
    }

    const now = new Date();
    const startOfShift = shift.openedAt;

    // --- Compute sales totals from invoices in this shift period ---
    const invoices = await prisma.invoice.findMany({
      where: {
        propertyId: session.propertyId,
        invoiceDate: { gte: startOfShift, lte: now },
        invoiceStatus: { not: 'CANCELLED' },
      },
    });

    const invoiceCount = invoices.length;
    const totalSales = invoices.reduce((sum: any, inv: any) => sum + inv.totalAmount, 0);

    // Payment mode breakdown from Payment table
    const payments = await prisma.payment.findMany({
      where: {
        propertyId: session.propertyId,
        paymentDate: { gte: startOfShift, lte: now },
      },
      include: { paymentMode: { select: { name: true, type: true } } },
    });

    let cashSales = 0, cardSales = 0, upiSales = 0, otherSales = 0;
    for (const p of payments) {
      const type = p.paymentMode?.type?.toUpperCase() || '';
      const name = p.paymentMode?.name?.toUpperCase() || '';
      if (type === 'CASH' || name.includes('CASH')) cashSales += p.amount;
      else if (type === 'CARD' || name.includes('CARD')) cardSales += p.amount;
      else if (type === 'UPI' || name.includes('UPI') || name.includes('PAYTM') || name.includes('GPAY') || name.includes('PHONEPE')) upiSales += p.amount;
      else otherSales += p.amount;
    }

    // Withdrawals & top-ups during shift
    const totalWithdrawals = shift.withdrawals.reduce((s: any, w: any) => s + w.amount, 0);
    const totalTopUps = shift.topUps.reduce((s: any, t: any) => s + t.amount, 0);

    // Expected cash = opening + cash sales + top-ups - withdrawals
    const expectedCash = shift.openingCash + cashSales + totalTopUps - totalWithdrawals;
    const variance = Number(actualCash || 0) - expectedCash;

    const result = await prisma.$transaction(async (tx: any) => {
      // Close the shift
      const closedShift = await tx.shift.update({
        where: { id: shiftId },
        data: { status: 'CLOSED', closedAt: now },
      });

      // Create day closing record
      const dayClosing = await tx.dayClosing.create({
        data: {
          propertyId: session.propertyId!,
          shiftId,
          closingDate: now,
          openingCash: shift.openingCash,
          cashSales,
          cardSales,
          upiSales,
          otherSales,
          totalSales,
          cashReceived: cashSales,
          cashPaid: totalWithdrawals,
          withdrawalAmount: totalWithdrawals,
          topUpAmount: totalTopUps,
          expectedCash,
          actualCash: Number(actualCash || 0),
          varianceAmount: variance,
          invoiceCount,
          notes: notes || null,
          closedBy: session.email,
          status: 'CLOSED',
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          propertyId: session.propertyId!,
          userId: session.id,
          moduleName: 'SHIFT',
          actionType: 'CLOSE',
          recordId: shiftId,
          newData: JSON.stringify({
            shiftNo: shift.shiftNo,
            totalSales,
            expectedCash,
            actualCash,
            variance,
            invoiceCount,
          }),
        },
      });

      return { closedShift, dayClosing };
    });

    return apiResponse(result, 'Shift closed and day closing report generated');
  } catch (error) {
    return apiError(error);
  }
}
