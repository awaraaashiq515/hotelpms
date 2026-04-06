import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

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

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.update({
        where: { id: id as string, propertyId: session.propertyId as string },
        data: { 
          invoiceStatus: 'CANCELLED',
          cancelReason: reason || 'No reason provided'
        }
      });

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          propertyId: session.propertyId as string,
          userId: session.id,
          moduleName: 'INVOICE',
          actionType: 'CANCEL',
          recordId: id as string,
          newData: JSON.stringify({ status: 'CANCELLED', reason }),
        }
      });

      return invoice;
    });

    return apiResponse(updatedInvoice, 'Invoice cancelled successfully');
  } catch (error) {
    return apiError(error);
  }
}
