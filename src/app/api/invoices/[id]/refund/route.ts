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

    const { id } = await params;
    const body = await request.json();
    const { reason } = body;

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id, propertyId: session.propertyId! }
      });

      if (!invoice) throw new Error('Invoice not found');
      if (invoice.invoiceStatus === 'REFUNDED') throw new Error('Invoice already refunded');

      // 1. Update Invoice Status
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          invoiceStatus: 'REFUNDED',
          paymentStatus: 'REFUNDED',
          cancelReason: reason || 'Refund requested by customer'
        }
      });

      // 2. Handle Financials (Reverse Payments)
      // For simplicity, we create a negative settlement or just mark existing as refunded
      await tx.settlement.updateMany({
        where: { sourceId: id, sourceType: 'INVOICE' },
        data: { status: 'REFUNDED' }
      });

      // 3. Create a reversal payment record if it was paid
      const totalPaid = invoice.totalAmount;
      
      const settlements = await tx.settlement.findMany({
        where: { sourceId: id, sourceType: 'INVOICE' }
      });

      const cashAccount = await tx.account.findFirst({
        where: { propertyId: session.propertyId!, accountType: 'CASH' }
      });

      const cashMode = await tx.paymentMode.findFirst({
        where: { propertyId: session.propertyId!, name: { contains: 'Cash' } }
      });

      if (cashAccount && (settlements.length > 0 || cashMode)) {
         await tx.payment.create({
           data: {
             paymentNo: `REF-${Date.now()}`,
             propertyId: session.propertyId!,
             amount: -totalPaid,
             paymentModeId: (settlements[0]?.paymentModeId || cashMode?.id) as string,
             paidToAccountId: cashAccount.id,
             sourceModule: 'INVOICE_REFUND',
             sourceRefId: id
           }
         });
      }

      return updatedInvoice;
    });

    return apiResponse(result, 'Invoice refunded successfully');
  } catch (error: any) {
    console.error('Refund Error:', error);
    return apiError(error, 400);
  }
}
