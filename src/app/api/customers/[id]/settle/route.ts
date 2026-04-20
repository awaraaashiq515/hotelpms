import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { id: guestId } = await params;
    const body = await request.json();
    const { paymentModeId, amount } = body;

    if (!paymentModeId) throw new Error('Payment mode is required');

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Find target account (Cash Account for simplicity, or we could pass accountId)
      const cashAccount = await tx.account.findFirst({
        where: { 
          propertyId: session.propertyId!,
          accountType: 'CASH'
        }
      });

      if (!cashAccount) throw new Error('Cash account not found');

      // 2. Find all pending settlements for this guest in this property
      const settlements = await tx.settlement.findMany({
        where: {
          guestId,
          propertyId: session.propertyId!,
          status: 'PENDING'
        }
      });

      if (settlements.length === 0) throw new Error('No pending settlements found for this guest');

      let totalSettled = 0;

      for (const settlement of settlements) {
        const settleAmount = settlement.balanceAmount;
        
        // Update Settlement
        await tx.settlement.update({
          where: { id: settlement.id },
          data: {
            paidAmount: { increment: settleAmount },
            balanceAmount: 0,
            status: 'COMPLETED'
          }
        });

        // Create Payment record
        await tx.payment.create({
          data: {
            paymentNo: `PAY-SET-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            propertyId: session.propertyId!,
            amount: settleAmount,
            paymentModeId: paymentModeId,
            paidToAccountId: cashAccount.id,
            sourceModule: 'INVOICE',
            sourceRefId: settlement.sourceId
          }
        });

        // Update Invoice status if source is INVOICE
        if (settlement.sourceType === 'INVOICE') {
          await tx.invoice.update({
            where: { id: settlement.sourceId },
            data: {
              paymentStatus: 'PAID',
              invoiceStatus: 'SETTLED'
            }
          });
        }

        totalSettled += settleAmount;
      }

      return { totalSettled };
    });

    return apiResponse(result, 'Balance settled successfully');
  } catch (error) {
    console.error('Settle Error:', error);
    return apiError(error);
  }
}
