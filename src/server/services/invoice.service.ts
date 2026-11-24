/**
 * src/server/services/invoice.service.ts
 * WP-0.4: GST Invoices, FY Sequence, Immutability & Credit Notes.
 */

import { prisma } from '@/lib/prisma';
import { financialYear } from '@/lib/time';

export async function getNextInvoiceNumber(propertyId: string, prefix: string = 'INV'): Promise<string> {
  const fy = financialYear();

  const series = await prisma.invoiceSeries.upsert({
    where: {
      propertyId_fy_prefix: {
        propertyId,
        fy,
        prefix,
      },
    },
    update: {
      nextNumber: { increment: 1 },
    },
    create: {
      propertyId,
      fy,
      prefix,
      nextNumber: 2, // 1 is assigned now
    },
  });

  const num = series.nextNumber === 2 ? 1 : series.nextNumber - 1;
  return `${prefix}/${fy}/${String(num).padStart(5, '0')}`;
}

/**
 * Asserts that an invoice is not yet ISSUED.
 * Invoices in ISSUED status are immutable under GST law; any modification requires a Credit Note.
 */
export async function assertInvoiceMutable(invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { invoiceStatus: true, invoiceNo: true },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.invoiceStatus === 'ISSUED') {
    throw new Error(
      `GST Compliance Error: Invoice ${invoice.invoiceNo} is already ISSUED and cannot be modified. Issue a Credit Note instead.`
    );
  }
}

/**
 * Issues a Credit Note against an existing invoice.
 */
export async function issueCreditNote({
  propertyId,
  invoiceId,
  amount,
  taxAmount = 0,
  reason,
}: {
  propertyId: string;
  invoiceId: string;
  amount: number;
  taxAmount?: number;
  reason: string;
}) {
  const count = await prisma.creditNote.count({ where: { propertyId } });
  const creditNoteNo = `CN/${financialYear()}/${String(count + 1).padStart(5, '0')}`;

  return await prisma.creditNote.create({
    data: {
      propertyId,
      creditNoteNo,
      invoiceId,
      amount,
      taxAmount,
      reason,
      status: 'ISSUED',
    },
  });
}
