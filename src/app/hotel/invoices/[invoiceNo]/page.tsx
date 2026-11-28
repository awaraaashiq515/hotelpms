import React from 'react';
import { PublicInvoiceView } from '@/components/public/PublicInvoiceView';

export const metadata = {
  title: 'Official Tax Invoice | OrderMint PMS',
  description: 'View and download your official hotel and restaurant tax invoice.',
};

export default async function PublicHotelInvoicePage({
  params,
}: {
  params: Promise<{ invoiceNo: string }>;
}) {
  const resolvedParams = await params;
  return <PublicInvoiceView invoiceId={resolvedParams.invoiceNo} />;
}
