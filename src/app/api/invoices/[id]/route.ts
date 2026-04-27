import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { renumberInvoices } from '@/lib/invoice-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { name: true } }
          }
        },
        guest: true,
        property: { select: { name: true } },
      },
    });

    if (!invoice) {
      return apiError(new Error('Invoice not found'), 404);
    }

    // Check ownership
    if (invoice.propertyId !== session.propertyId) {
      return apiError(new Error('Forbidden'), 403);
    }

    // Fetch Settlements (Payment History)
    const settlements = await prisma.settlement.findMany({
      where: {
        sourceId: id,
        sourceType: 'INVOICE'
      },
      orderBy: { settlementDate: 'desc' }
    });

    const paidAmount = settlements.reduce((sum, s) => sum + s.paidAmount, 0);
    const dueAmount = invoice.totalAmount - paidAmount;

    return apiResponse({ 
      ...invoice, 
      settlements,
      paidAmount,
      dueAmount
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: id as string, propertyId: session.propertyId as string }
      });

      if (!invoice) throw new Error('Invoice not found');

      // 1. Delete dependent records
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      await tx.settlement.deleteMany({ where: { sourceId: id, sourceType: 'INVOICE' } });
      
      // 2. Delete the invoice itself
      const deletedInvoice = await tx.invoice.delete({
        where: { id: id as string }
      });

      // 3. Create Audit Log
      await tx.auditLog.create({
        data: {
          propertyId: session.propertyId as string,
          userId: session.id,
          moduleName: 'INVOICE',
          actionType: 'DELETE',
          recordId: id as string,
          newData: JSON.stringify({ invoiceNo: deletedInvoice.invoiceNo, reason }),
        }
      });

      // 4. AUTOMATICALLY RENUMBER remaining invoices
      await renumberInvoices(session.propertyId as string, tx);

      return deletedInvoice;
    }, { timeout: 60000 });

    return apiResponse(result, 'Invoice deleted and sequence updated successfully');
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || !session.propertyId) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { paymentStatus, invoiceStatus } = body;

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id, propertyId: session.propertyId! }
      });
      if (!invoice) throw new Error('Invoice not found');

      // 1. Update Invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          ...(paymentStatus && { paymentStatus }),
          ...(invoiceStatus && { invoiceStatus }),
        }
      });

      // 2. If paymentStatus changed, sync settlements
      if (paymentStatus === 'PAID') {
          // Mark all settlements as PAID and ensure total matches
          await tx.settlement.deleteMany({ where: { sourceId: id, sourceType: 'INVOICE' } });
          
          const cashMode = await tx.paymentMode.findFirst({
            where: { propertyId: session.propertyId!, name: { contains: 'Cash' } }
          });

          await tx.settlement.create({
            data: {
              settlementNo: `SET-${Date.now()}`,
              propertyId: session.propertyId!,
              sourceId: id,
              sourceType: 'INVOICE',
              paymentModeId: cashMode?.id,
              grossAmount: invoice.totalAmount,
              paidAmount: invoice.totalAmount,
              balanceAmount: 0,
              status: 'PAID'
            }
          });
      } else if (paymentStatus === 'UNPAID') {
          // Remove all payment records
          await tx.settlement.deleteMany({ where: { sourceId: id, sourceType: 'INVOICE' } });
          await tx.payment.deleteMany({ where: { sourceRefId: id, sourceModule: 'INVOICE_REFUND' } });
      } else if (paymentStatus === 'REFUNDED') {
          await tx.settlement.updateMany({
            where: { sourceId: id, sourceType: 'INVOICE' },
            data: { status: 'REFUNDED' }
          });
      }

      return updatedInvoice;
    });

    return apiResponse(result, 'Invoice updated successfully');
  } catch (error) {
    return apiError(error);
  }
}
