import { prisma } from './prisma';

export async function renumberInvoices(propertyId: string, tx: any) {
  // 1. Fetch all invoices for this property ordered by creation date
  const invoices = await tx.invoice.findMany({
    where: { propertyId },
    orderBy: { invoiceDate: 'asc' }
  });

  if (invoices.length === 0) return;

  // Store original suffixes before we start renaming
  const invoiceData = invoices.map((inv: any) => {
    const parts = inv.invoiceNo.split('/');
    const fy = parts[1] || '2024-25';
    const suffixParts = inv.invoiceNo.split('-');
    const suffix = suffixParts.length > 1 ? suffixParts.pop() : Math.random().toString(36).substring(2, 5).toUpperCase();
    return { id: inv.id, fy, suffix };
  });

  // 2. To avoid unique constraint conflicts, first rename all to a temporary format
  for (const inv of invoices as any[]) {
    await tx.invoice.update({
      where: { id: inv.id },
      data: { invoiceNo: `TEMP-${inv.id}-${Date.now()}` }
    });
  }

  // 3. Assign new sequential numbers
  for (let i = 0; i < invoiceData.length; i++) {
    const data = invoiceData[i];
    const seq = (i + 1).toString().padStart(4, '0');
    const newInvoiceNo = `PJ/${data.fy}/${seq}-${data.suffix}`;

    await tx.invoice.update({
      where: { id: data.id },
      data: { invoiceNo: newInvoiceNo }
    });
  }
}
