import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { renumberInvoices } from '@/lib/invoice-utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return apiError(new Error('Invalid or empty IDs array'), 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify ownership of all invoices
      const count = await tx.invoice.count({
        where: {
          id: { in: ids },
          propertyId: session.propertyId as string
        }
      });

      if (count !== ids.length) {
        throw new Error('One or more invoices not found or access denied');
      }

      // 2. Delete dependent records
      await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: ids } } });
      await tx.settlement.deleteMany({ where: { sourceId: { in: ids }, sourceType: 'INVOICE' } });
      
      // 3. Delete the invoices
      const deletedInvoices = await tx.invoice.deleteMany({
        where: { id: { in: ids } }
      });

      // 4. Create Audit Log
      await tx.auditLog.create({
        data: {
          propertyId: session.propertyId as string,
          userId: session.id,
          moduleName: 'INVOICE',
          actionType: 'BULK_DELETE',
          recordId: 'MULTIPLE',
          newData: JSON.stringify({ count: deletedInvoices.count, ids }),
        }
      });

      // 5. AUTOMATICALLY RENUMBER remaining invoices
      await renumberInvoices(session.propertyId as string, tx);

      return deletedInvoices;
    }, { timeout: 120000 }); // Longer timeout for bulk operations

    return apiResponse(result, `${ids.length} invoices deleted and sequence updated successfully`);
  } catch (error) {
    return apiError(error);
  }
}
