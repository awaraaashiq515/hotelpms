import { prisma } from '@/lib/prisma';
import { getCurrentFinancialYear } from '@/lib/hotel/gst-service';

/**
 * Generates a unified, gapless, sequential GST tax invoice number per Financial Year.
 * Example: INV/2026-27/0001
 * Created strictly upon checkout / settlement.
 */
export async function getNextInvoiceNumber(propertyId: string, tx: any = prisma): Promise<string> {
  const fy = getCurrentFinancialYear();
  const prefix = `INV/${fy}/`;

  const latestInvoice = await tx.invoice.findFirst({
    where: {
      propertyId,
      invoiceNo: { startsWith: prefix },
    },
    orderBy: { invoiceNo: 'desc' },
    select: { invoiceNo: true },
  });

  let nextSeq = 1;
  if (latestInvoice && latestInvoice.invoiceNo) {
    const parts = latestInvoice.invoiceNo.split('/');
    const seqPart = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(seqPart)) {
      nextSeq = seqPart + 1;
    }
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}
