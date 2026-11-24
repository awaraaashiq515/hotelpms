'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Printer, X, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface FolioTransaction {
  id: string;
  txnType: 'DEBIT' | 'CREDIT';
  sourceModule: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  taxAmount: number;
  netAmount: number;
  txnDate: string;
}

export interface FolioDetail {
  id: string;
  folioNo: string;
  status: 'OPEN' | 'CLOSED';
  openingBalance: number;
  totalCharges: number;
  totalPayments: number;
  closingBalance: number;
  guestId: string;
  guest: {
    firstName: string;
    lastName?: string | null;
    mobile?: string | null;
    email?: string | null;
    nationality?: string | null;
    idType?: string | null;
    idNumber?: string | null;
    address?: string | null;
    gstNumber?: string | null;
    companyName?: string | null;
    billingAddress?: string | null;
  };
  reservation: {
    id: string;
    bookingNo: string;
    arrivalDate: string;
    departureDate: string;
    totalAmount: number;
    advanceAmount: number;
    dueAmount: number;
    adults: number;
    children: number;
    gstNumber?: string | null;
    companyName?: string | null;
    billingAddress?: string | null;
    roomType?: { name: string } | null;
    rooms?: { room: { roomNumber: string; floor?: string | null } }[] | null;
    checkIns: { id: string; status: string; checkedInAt: string; expectedCheckoutAt: string }[];
    property?: {
      id: string;
      code?: string | null;
      name: string;
      brandName?: string | null;
      logoUrl?: string | null;
      address?: string | null;
      phone?: string | null;
      taxDetails?: string | null;
      city?: string | null;
      state?: string | null;
      stateCode?: string | null;
      country?: string | null;
      pinCode?: string | null;
    } | null;
  };
  transactions: FolioTransaction[];
  posOrders?: {
    id: string;
    orderNo: string;
    grandTotal: number;
    taxAmount: number;
    createdAt: string;
    outlet?: { name: string; type: string } | null;
    items: {
      quantity: number;
      unitPrice: number;
      totalAmount: number;
      product: { name: string; isVeg?: boolean };
    }[];
  }[] | null;
  spaBookings?: {
    id: string;
    bookingNo: string;
    scheduledAt: string;
    duration: number;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    notes?: string | null;
    service: { name: string; category?: string; price: number };
    spa?: { name: string } | null;
    therapist?: { name: string } | null;
  }[] | null;
  laundryRequests?: {
    id: string;
    roomNumber: string;
    guestName?: string | null;
    itemsCount: number;
    itemsDetail?: string | null;
    amount: number;
    status: string;
    collectedAt: string;
    deliveredAt?: string | null;
    notes?: string | null;
  }[] | null;
}

interface ReceiptModalProps {
  folio: FolioDetail;
  nights: number;
  invoiceNo?: string;
  autoPrint?: boolean;
  onClose: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function numberToWordsINR(amount: number): string {
  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  }

  function convertThreeDigits(n: number): string {
    let str = '';
    if (Math.floor(n / 100) > 0) {
      str += a[Math.floor(n / 100)] + ' Hundred';
      if (n % 100 !== 0) str += ' and ';
    }
    if (n % 100 !== 0) {
      str += convertTwoDigits(n % 100);
    }
    return str;
  }

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  let result = '';
  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundred = rem;

  if (crore > 0) result += convertThreeDigits(crore) + ' Crore ';
  if (lakh > 0) result += convertThreeDigits(lakh) + ' Lakh ';
  if (thousand > 0) result += convertThreeDigits(thousand) + ' Thousand ';
  if (hundred > 0) result += convertThreeDigits(hundred);

  result = result.trim() + ' Rupees';

  if (paise > 0) {
    result += ' and ' + convertTwoDigits(paise) + ' Paise';
  }

  return result + ' Only';
}

// ─── Invoice Printing Styling CSS ───────────────────────────────────────────

const INVOICE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  .invoice-container {
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff !important;
    color: #1e293b !important;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    line-height: 1.5;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 25px;
  }
  .header-table td {
    vertical-align: top;
    border: none;
    padding: 0;
  }
  .hotel-logo {
    font-size: 24px;
    font-weight: 900;
    color: #1e1b4b !important;
    text-transform: uppercase;
    letter-spacing: -0.5px;
  }
  .hotel-subtitle {
    font-size: 11px;
    color: #64748b !important;
    font-weight: 600;
    margin-top: 2px;
  }
  .hotel-details {
    font-size: 11px;
    color: #475569 !important;
    margin-top: 6px;
    line-height: 1.4;
  }
  .invoice-title-sec {
    text-align: right;
  }
  .invoice-title {
    font-size: 26px;
    font-weight: 900;
    color: #0f172a !important;
    letter-spacing: -0.5px;
    margin-bottom: 5px;
  }
  .invoice-meta {
    font-size: 11px;
    color: #334155 !important;
    font-weight: 600;
    line-height: 1.4;
  }
  .divider {
    height: 1px;
    background: #e2e8f0 !important;
    margin: 15px 0;
    width: 100%;
  }
  .section-title {
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b !important;
    margin-bottom: 8px;
    border-bottom: 1px solid #f1f5f9 !important;
    padding-bottom: 4px;
  }
  .info-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  .info-table td {
    width: 50%;
    vertical-align: top;
    border: none;
    padding: 0 15px 0 0;
  }
  .info-block {
    margin-bottom: 6px;
    font-size: 11px;
    display: flex;
  }
  .info-label {
    font-weight: 600;
    color: #64748b !important;
    width: 110px;
    flex-shrink: 0;
  }
  .info-value {
    font-weight: 700;
    color: #0f172a !important;
  }
  .guest-name {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a !important;
    margin-bottom: 4px;
  }
  .guest-details {
    font-size: 11px;
    color: #475569 !important;
    line-height: 1.4;
  }
  .guest-details p {
    margin-bottom: 3px;
  }
  table.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  table.items-table th {
    background: #f8fafc !important;
    color: #475569 !important;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 8px 10px;
    border-top: 1px solid #e2e8f0 !important;
    border-bottom: 2px solid #e2e8f0 !important;
    text-align: left;
  }
  table.items-table td {
    padding: 10px;
    border-bottom: 1px solid #e2e8f0 !important;
    font-size: 11px;
    color: #334155 !important;
    vertical-align: middle;
  }
  table.items-table td.amount {
    text-align: right;
    font-weight: 700;
  }
  table.items-table td.debit {
    color: #b91c1c !important;
  }
  table.items-table td.credit {
    color: #15803d !important;
  }
  .pos-orders-container {
    margin-top: 20px;
    margin-bottom: 20px;
  }
  .pos-order-card {
    border: 1px solid #e2e8f0 !important;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 10px;
    background: #fafaf9 !important;
  }
  .pos-order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    border-bottom: 1px dashed #e2e8f0 !important;
    padding-bottom: 6px;
  }
  .pos-order-title {
    font-size: 11px;
    font-weight: 800;
    color: #1e293b !important;
  }
  .pos-order-meta {
    font-size: 9px;
    color: #64748b !important;
    font-weight: 600;
  }
  .pos-item-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #475569 !important;
    margin-bottom: 3px;
  }
  .pos-item-name {
    font-weight: 600;
  }
  .pos-item-price {
    font-weight: 700;
    color: #1e293b !important;
  }
  .pos-order-total-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 800;
    border-top: 1px dashed #e2e8f0 !important;
    padding-top: 6px;
    margin-top: 6px;
    color: #0f172a !important;
  }
  .summary-table-container {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 15px;
  }
  .summary-table {
    width: 320px;
    border-collapse: collapse;
  }
  .summary-table td {
    padding: 6px 10px;
    font-size: 11px;
    color: #475569 !important;
  }
  .summary-table td.amount {
    text-align: right;
    font-weight: 700;
    color: #1e293b !important;
  }
  .summary-table tr.grand-total {
    border-top: 2px solid #e2e8f0 !important;
    font-size: 13px;
    font-weight: 900;
  }
  .summary-table tr.grand-total td {
    color: #0f172a !important;
    padding-top: 10px;
  }
  .summary-table tr.grand-total td.amount {
    font-size: 14px;
  }
  .summary-table tr.settled-row {
    background: #f0fdf4 !important;
    color: #166534 !important;
    font-weight: 700;
  }
  .summary-table tr.settled-row td.amount {
    color: #166534 !important;
  }
  .summary-table tr.due-row {
    background: #fef2f2 !important;
    color: #991b1b !important;
    font-weight: 700;
  }
  .summary-table tr.due-row td.amount {
    color: #991b1b !important;
  }
  .invoice-footer-section {
    margin-top: 40px;
    font-size: 10px;
    color: #475569 !important;
    line-height: 1.5;
    background: #f8fafc !important;
    padding: 15px !important;
    border-radius: 8px;
    border: 1px solid #e2e8f0 !important;
  }
  .invoice-signatures-container {
    width: 100%;
    margin-top: 45px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
  }
  .invoice-signature-box {
    width: 220px;
  }
  .invoice-signature-line {
    border-top: 2px solid #475569 !important;
    margin-top: 40px;
    padding-top: 6px;
    font-size: 11px;
    font-weight: 700;
    color: #1e293b !important;
    text-align: center;
  }
  .invoice-terms-title {
    font-weight: 800;
    color: #0f172a !important;
    margin-bottom: 6px;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.05em;
  }
  .invoice-thank-you {
    text-align: center;
    font-size: 13px;
    font-weight: 800;
    color: #0f172a !important;
    margin-top: 25px;
  }
  table.gst-table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0 16px 0;
  }
  table.gst-table th {
    background: #f8fafc !important;
    color: #334155 !important;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 7px 8px;
    border-top: 1px solid #cbd5e1 !important;
    border-bottom: 2px solid #cbd5e1 !important;
    text-align: left;
  }
  table.gst-table td {
    padding: 7px 8px;
    border-bottom: 1px solid #e2e8f0 !important;
    font-size: 10px;
    color: #334155 !important;
    vertical-align: middle;
  }
  table.gst-table td.amount {
    text-align: right;
    font-weight: 700;
  }
  table.gst-table tr.total-row {
    background: #f8fafc !important;
    border-top: 2px solid #cbd5e1 !important;
    border-bottom: 2px solid #cbd5e1 !important;
    font-weight: 800;
  }
  table.gst-table tr.total-row td {
    color: #0f172a !important;
    font-size: 11px;
    padding: 8px;
  }
`;

export interface GstBreakdownRow {
  sac: string;
  category: string;
  taxableAmount: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  totalTax: number;
  totalAmount: number;
}

export function computeGstBreakdown(folio: FolioDetail, nights: number) {
  const stayTxns = folio.transactions?.filter(
    (t) => t.debitAmount > 0 && t.sourceModule !== 'POS' && t.sourceModule !== 'ROOM_SERVICE' && t.sourceModule !== 'GST'
  ) || [];
  const roomStayTotal = stayTxns.reduce((sum, t) => sum + t.debitAmount, 0) || Number(folio.reservation?.totalAmount || 0);

  const posTxns = folio.transactions?.filter(
    (t) => t.debitAmount > 0 && (t.sourceModule === 'POS' || t.sourceModule === 'ROOM_SERVICE')
  ) || [];
  const fnbTotal = folio.posOrders?.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0) ||
    posTxns.reduce((sum, t) => sum + t.debitAmount, 0);

  const gstTxns = folio.transactions?.filter((t) => t.sourceModule === 'GST') || [];
  const totalRoomGst = gstTxns.reduce((sum, t) => sum + t.debitAmount, 0);

  const propertyStateCode = folio.reservation?.property?.stateCode || '02';
  const guestGstin = folio.reservation?.gstNumber || folio.guest?.gstNumber || '';
  const guestStateCode = guestGstin && guestGstin.length >= 2 ? guestGstin.substring(0, 2) : propertyStateCode;
  const isInterState = Boolean(guestStateCode && propertyStateCode && guestStateCode !== propertyStateCode);

  const rows: GstBreakdownRow[] = [];

  // 1. Room Stay & Accommodation (SAC 996311)
  if (roomStayTotal > 0 || totalRoomGst > 0) {
    let roomGstRate = 0;
    const match = gstTxns[0]?.description?.match(/GST\s*@\s*(\d+(\.\d+)?)%/i);
    if (match) {
      roomGstRate = parseFloat(match[1]);
    } else if (roomStayTotal > 0 && totalRoomGst > 0) {
      roomGstRate = Math.round((totalRoomGst / roomStayTotal) * 100);
    }

    const cgstRate = isInterState ? 0 : roomGstRate / 2;
    const sgstRate = isInterState ? 0 : roomGstRate / 2;
    const igstRate = isInterState ? roomGstRate : 0;

    const cgstAmt = isInterState ? 0 : totalRoomGst / 2;
    const sgstAmt = isInterState ? 0 : totalRoomGst / 2;
    const igstAmt = isInterState ? totalRoomGst : 0;

    rows.push({
      sac: '996311',
      category: `Room Stay & Accommodation (${nights} Night${nights !== 1 ? 's' : ''})`,
      taxableAmount: roomStayTotal,
      gstRate: roomGstRate,
      cgstRate,
      cgstAmount: cgstAmt,
      sgstRate,
      sgstAmount: sgstAmt,
      igstRate,
      igstAmount: igstAmt,
      totalTax: totalRoomGst,
      totalAmount: roomStayTotal + totalRoomGst,
    });
  }

  // 2. Restaurant & Food Service / Room Service (SAC 996331)
  if (fnbTotal > 0) {
    const posTax = folio.posOrders?.reduce((sum, o) => sum + Number(o.taxAmount || 0), 0) || 0;
    const fnbTaxable = posTax > 0 ? (fnbTotal - posTax) : fnbTotal;
    const fnbGstRate = posTax > 0 && fnbTaxable > 0 ? Math.round((posTax / fnbTaxable) * 100) : (posTax > 0 ? 5 : 0);

    const cgstRate = isInterState ? 0 : fnbGstRate / 2;
    const sgstRate = isInterState ? 0 : fnbGstRate / 2;
    const igstRate = isInterState ? fnbGstRate : 0;

    const cgstAmt = isInterState ? 0 : posTax / 2;
    const sgstAmt = isInterState ? 0 : posTax / 2;
    const igstAmt = isInterState ? posTax : 0;

    rows.push({
      sac: '996331',
      category: 'Restaurant & Room Service Food Orders',
      taxableAmount: fnbTaxable,
      gstRate: fnbGstRate,
      cgstRate,
      cgstAmount: cgstAmt,
      sgstRate,
      sgstAmount: sgstAmt,
      igstRate,
      igstAmount: igstAmt,
      totalTax: posTax,
      totalAmount: fnbTotal,
    });
  }

  // 3. Spa Services (SAC 996332)
  if (folio.spaBookings && folio.spaBookings.length > 0) {
    const spaTotal = folio.spaBookings.reduce((sum, s) => sum + Number(s.totalAmount || s.amount || 0), 0);
    const spaTax = folio.spaBookings.reduce((sum, s) => sum + Number(s.taxAmount || 0), 0);
    const spaTaxable = spaTax > 0 ? spaTotal - spaTax : spaTotal;
    const spaRate = spaTax > 0 && spaTaxable > 0 ? Math.round((spaTax / spaTaxable) * 100) : 18;

    rows.push({
      sac: '996332',
      category: 'Spa & Wellness Treatments',
      taxableAmount: spaTaxable,
      gstRate: spaRate,
      cgstRate: isInterState ? 0 : spaRate / 2,
      cgstAmount: isInterState ? 0 : spaTax / 2,
      sgstRate: isInterState ? 0 : spaRate / 2,
      sgstAmount: isInterState ? 0 : spaTax / 2,
      igstRate: isInterState ? spaRate : 0,
      igstAmount: isInterState ? spaTax : 0,
      totalTax: spaTax,
      totalAmount: spaTotal,
    });
  }

  // 4. Laundry Services (SAC 996333)
  if (folio.laundryRequests && folio.laundryRequests.length > 0) {
    const laundryTotal = folio.laundryRequests.reduce((sum, l) => sum + Number(l.amount || 0), 0);
    rows.push({
      sac: '996333',
      category: 'Guest Laundry Services',
      taxableAmount: laundryTotal,
      gstRate: 0,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0,
      igstAmount: 0,
      totalTax: 0,
      totalAmount: laundryTotal,
    });
  }

  const totalTaxable = rows.reduce((sum, r) => sum + r.taxableAmount, 0);
  const totalCgst = rows.reduce((sum, r) => sum + r.cgstAmount, 0);
  const totalSgst = rows.reduce((sum, r) => sum + r.sgstAmount, 0);
  const totalIgst = rows.reduce((sum, r) => sum + r.igstAmount, 0);
  const grandTax = rows.reduce((sum, r) => sum + r.totalTax, 0);

  return {
    rows,
    isInterState,
    totalTaxable,
    totalCgst,
    totalSgst,
    totalIgst,
    grandTax,
    taxInWords: numberToWordsINR(grandTax),
    placeOfSupply: `${propertyStateCode} - ${folio.reservation?.property?.state || 'Himachal Pradesh'}`,
  };
}

export default function ReceiptModal({ folio, nights, invoiceNo, autoPrint = true, onClose }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const property = folio.reservation?.property;
  const displayInvoiceNo = invoiceNo || `INV-${folio.folioNo.replace(/\D/g, '') || '1'}`;
  const [printing, setPrinting] = useState(false);
  const autoPrintedRef = useRef(false);

  // Compute full GST breakdown and tax values
  const gstDetails = computeGstBreakdown(folio, nights);
  const hotelGstin = property?.taxDetails || (folio.reservation?.property as any)?.taxDetails || 'Not Registered / Pending in Settings';
  const guestGstin = folio.reservation?.gstNumber || folio.guest?.gstNumber || '';
  const isB2B = Boolean(guestGstin || folio.reservation?.companyName || folio.guest?.companyName);

  // Safe resolution of Room Number and details
  const roomNumber =
    folio.reservation?.rooms?.[0]?.room?.roomNumber ||
    (folio.reservation as any)?.checkIns?.[0]?.room?.roomNumber ||
    (folio as any)?.room?.roomNumber ||
    (folio.reservation as any)?.assignedRoom?.roomNumber ||
    '101';

  const roomTypeName =
    folio.reservation?.roomType?.name ||
    (folio.reservation as any)?.checkIns?.[0]?.room?.roomType?.name ||
    'Standard Room';

  const mealPlan = (folio.reservation as any)?.mealPlan || 'EP';

  const triggerBrowserPrint = useCallback(() => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(`
      <html>
      <head>
        <title>Invoice - ${displayInvoiceNo}</title>
        <style>
          @media print {
            body { margin: 0; padding: 15mm; font-size: 11px; }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
          }
          body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            color: #1e293b;
            background: #ffffff;
            padding: 30px;
            line-height: 1.5;
          }
          ${INVOICE_CSS}
        </style>
      </head>
      <body>
        <div class="invoice-container">
          ${printContent}
        </div>
      </body>
      </html>
    `);
    w.document.close();
    setTimeout(() => {
      w.print();
    }, 500);
  }, [displayInvoiceNo]);

  const handlePrint = useCallback(async () => {
    setPrinting(true);
    toast.loading('🖨️ Printing bill on connected printer...', { id: 'hotel-receipt-print' });
    try {
      // Build comprehensive itemized list for thermal receipt printer
      const itemsForPrinter: any[] = [];

      // 1. Room Stay & Accommodation charges
      const stayTxns = folio.transactions?.filter(
        (t) => t.debitAmount > 0 && t.sourceModule !== 'POS' && t.sourceModule !== 'ROOM_SERVICE' && t.sourceModule !== 'GST'
      ) || [];
      if (stayTxns.length > 0) {
        stayTxns.forEach((t) => {
          itemsForPrinter.push({
            description: t.description || `Room ${roomNumber} Stay`,
            quantity: 1,
            amount: t.debitAmount,
          });
        });
      } else {
        itemsForPrinter.push({
          description: `Room ${roomNumber} Stay`,
          quantity: nights || 1,
          amount: Number(folio.reservation?.totalAmount || 0),
        });
      }

      // 2. Individual Food & Beverage items from all orders
      if (folio.posOrders && folio.posOrders.length > 0) {
        folio.posOrders.forEach((order) => {
          if (order.items && order.items.length > 0) {
            order.items.forEach((it) => {
              const itName = it.product?.name || (it as any).name || 'Food Item';
              itemsForPrinter.push({
                description: itName,
                quantity: it.quantity || 1,
                amount: Number(it.totalAmount || (it.unitPrice * it.quantity) || 0),
              });
            });
          } else {
            itemsForPrinter.push({
              description: `F&B Order #${order.orderNo}`,
              quantity: 1,
              amount: order.grandTotal,
            });
          }
        });
      } else {
        const posTxns = folio.transactions?.filter(
          (t) => t.debitAmount > 0 && (t.sourceModule === 'POS' || t.sourceModule === 'ROOM_SERVICE')
        ) || [];
        posTxns.forEach((t) => {
          itemsForPrinter.push({
            description: t.description || 'Food & Beverage',
            quantity: 1,
            amount: t.debitAmount,
          });
        });
      }

      // 3. Spa bookings (if any)
      if (folio.spaBookings && folio.spaBookings.length > 0) {
        folio.spaBookings.forEach((sb) => {
          itemsForPrinter.push({
            description: sb.service?.name ? `Spa: ${sb.service.name}` : 'Spa Wellness Service',
            quantity: 1,
            amount: Number(sb.totalAmount || sb.amount || 0),
          });
        });
      }

      // 4. Laundry services (if any)
      if (folio.laundryRequests && folio.laundryRequests.length > 0) {
        folio.laundryRequests.forEach((lr) => {
          itemsForPrinter.push({
            description: lr.itemsDetail ? `Laundry: ${lr.itemsDetail}` : `Laundry (${lr.itemsCount || 1} pcs)`,
            quantity: lr.itemsCount || 1,
            amount: Number(lr.amount || 0),
          });
        });
      }

      // Compute full GST breakdown
      const gstDetails = computeGstBreakdown(folio, nights);
      const propertyGstin = property?.taxDetails || (folio.reservation?.property as any)?.taxDetails || 'Not Registered / Pending in Settings';
      const guestGstin = folio.reservation?.gstNumber || folio.guest?.gstNumber || '';

      const hotelBillPayload = {
        invoiceNo: displayInvoiceNo,
        folioNo: folio.folioNo,
        guestName: `${folio.guest.firstName} ${folio.guest.lastName || ''}`.trim(),
        guestGstin: guestGstin || undefined,
        guestCompany: folio.reservation?.companyName || folio.guest?.companyName || undefined,
        hotelGstin: propertyGstin,
        placeOfSupply: gstDetails.placeOfSupply,
        roomNumber: `Room ${roomNumber}`,
        checkIn: folio.reservation?.arrivalDate ? new Date(folio.reservation.arrivalDate).toLocaleDateString('en-GB') : '',
        checkOut: folio.reservation?.departureDate ? new Date(folio.reservation.departureDate).toLocaleDateString('en-GB') : '',
        subtotal: gstDetails.totalTaxable || (folio.totalCharges - gstDetails.grandTax),
        taxAmount: gstDetails.grandTax,
        grandTotal: folio.totalCharges,
        totalPayments: folio.totalPayments,
        closingBalance: folio.closingBalance,
        taxInWords: gstDetails.taxInWords,
        gstRows: gstDetails.rows.map((r) => ({
          sac: r.sac,
          category: r.category,
          taxable: r.taxableAmount,
          cgstRate: r.cgstRate,
          cgstAmt: r.cgstAmount,
          sgstRate: r.sgstRate,
          sgstAmt: r.sgstAmount,
          igstRate: r.igstRate,
          igstAmt: r.igstAmount,
          totalTax: r.totalTax,
        })),
        items: itemsForPrinter.length > 0 ? itemsForPrinter : [
          { description: 'Room Stay & Charges', quantity: 1, amount: folio.totalCharges }
        ],
      };

      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelBill: hotelBillPayload,
          property: {
            id: property?.id,
            name: property?.name || property?.brandName || 'HOTEL',
            address: property?.address,
            phone: property?.phone,
            taxDetails: property?.taxDetails || (folio.reservation?.property as any)?.taxDetails,
          },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        toast.success('✅ Bill printed on connected printer!', { id: 'hotel-receipt-print' });
        return;
      }

      toast.info('Direct printer not responding, opening print window...', { id: 'hotel-receipt-print' });
      triggerBrowserPrint();
    } catch (err: any) {
      console.warn('Direct print error:', err);
      toast.info('Opening browser print...', { id: 'hotel-receipt-print' });
      triggerBrowserPrint();
    } finally {
      setPrinting(false);
    }
  }, [folio, displayInvoiceNo, roomNumber, property, nights, triggerBrowserPrint]);

  useEffect(() => {
    if (autoPrint && !autoPrintedRef.current) {
      autoPrintedRef.current = true;
      const t = setTimeout(() => {
        handlePrint();
      }, 700);
      return () => clearTimeout(t);
    }
  }, [autoPrint, handlePrint]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      {/* Inject invoice styling for proper preview rendering on screen */}
      <style dangerouslySetInnerHTML={{ __html: INVOICE_CSS }} />

      <div className="bg-[#0f172a] border border-slate-700/60 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="font-black text-white text-sm tracking-wide">Checkout Bill / Tax Invoice</span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-bold uppercase">
              {folio.folioNo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerBrowserPrint}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700/60 transition-all"
              title="Open Browser / A4 Print Dialog"
            >
              <Printer size={13} /> Browser Print
            </button>
            <button
              onClick={handlePrint}
              disabled={printing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 active:scale-[0.98] transition-all"
              title="Print directly to connected Hotel Bill printer"
            >
              {printing ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
              {printing ? 'Printing…' : 'Print to Printer'}
            </button>
            <button
              onClick={onClose}
              className="w-8.5 h-8.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-all ml-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Modal Content / Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/40" style={{ maxHeight: 'calc(92vh - 80px)' }}>
          {/* Print Preview Canvas: styled to resemble a clean white sheet of paper */}
          <div className="bg-white text-slate-800 rounded-2xl p-8 md:p-10 max-w-3xl mx-auto shadow-2xl border border-slate-200 mb-8">
            <div ref={printRef}>
              <div className="invoice-container">
                {/* Header Section */}
                <table className="header-table">
                  <tbody>
                    <tr>
                      <td>
                        <div className="hotel-logo">
                          🏨 {property?.name || 'Hotel Property'}
                        </div>
                        {property?.brandName && (
                          <div className="hotel-subtitle">{property.brandName}</div>
                        )}
                        <div className="hotel-details">
                          {property?.address && <p>{property.address}</p>}
                          <p>
                            {[property?.city, property?.state || 'Himachal Pradesh', property?.country, property?.pinCode]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                          {property?.phone && <p>Tel: {property.phone}</p>}
                          <p style={{ marginTop: '4px', fontWeight: 800, color: '#0f172a' }}>
                            Hotel GSTIN: {hotelGstin}
                          </p>
                          <p style={{ fontSize: '10px', color: '#64748b' }}>
                            State: {property?.state || 'Himachal Pradesh'} (Code: {property?.stateCode || '02'}) | Place of Supply: {gstDetails.placeOfSupply}
                          </p>
                        </div>
                      </td>
                      <td className="invoice-title-sec">
                        <div className="invoice-title">
                          {isB2B ? 'TAX INVOICE (B2B)' : 'TAX INVOICE (B2C)'}
                        </div>
                        <div className="invoice-meta">
                          <p style={{ fontWeight: 800, color: '#0f172a' }}>
                            Invoice No: {displayInvoiceNo}
                          </p>
                          <p>Folio No: {folio.folioNo}</p>
                          <p>Booking No: #{folio.reservation.bookingNo}</p>
                          <p>Date: {fmtDate(new Date().toISOString())}</p>
                          <p>Status: <span style={{ color: folio.closingBalance <= 0 ? '#166534' : '#b91c1c' }}>{folio.status}</span></p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="divider"></div>

                {/* Info Block Section */}
                <table className="info-table">
                  <tbody>
                    <tr>
                      {/* Left: Guest / Corporate Details */}
                      <td>
                        <div className="section-title">
                          {isB2B ? 'Bill To (Recipient / B2B GST Details)' : 'Bill To (Guest Details)'}
                        </div>
                        {(folio.reservation?.companyName || folio.guest?.companyName) && (
                          <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginBottom: '2px' }}>
                            🏢 {folio.reservation?.companyName || folio.guest?.companyName}
                          </div>
                        )}
                        <div className="guest-name" style={{ fontSize: isB2B ? '12px' : '14px', color: isB2B ? '#475569' : '#0f172a' }}>
                          {isB2B ? 'Guest / Rep: ' : ''}{folio.guest.firstName} {folio.guest.lastName || ''}
                        </div>

                        {guestGstin && (
                          <div style={{ margin: '4px 0 6px 0', padding: '4px 8px', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '4px', display: 'inline-block' }}>
                            <strong style={{ color: '#92400e', fontSize: '11px' }}>
                              Recipient GSTIN: {guestGstin}
                            </strong>
                            <span style={{ fontSize: '10px', color: '#b45309', marginLeft: '6px' }}>
                              (B2B Tax Invoice)
                            </span>
                          </div>
                        )}

                        <div className="guest-details">
                          {folio.guest.mobile && <p><strong>Mobile:</strong> {folio.guest.mobile}</p>}
                          {folio.guest.email && <p><strong>Email:</strong> {folio.guest.email}</p>}
                          {(folio.reservation?.billingAddress || folio.guest?.billingAddress || folio.guest.address) && (
                            <p><strong>Billing Address:</strong> {folio.reservation?.billingAddress || folio.guest?.billingAddress || folio.guest.address}</p>
                          )}
                          {folio.guest.nationality && <p><strong>Nationality:</strong> {folio.guest.nationality}</p>}
                          {folio.guest.idType && (
                            <p style={{ marginTop: '3px' }}>
                              <strong>ID Proof:</strong> {folio.guest.idType} ({folio.guest.idNumber || '—'})
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Right: Stay Details */}
                      <td>
                        <div className="section-title">Stay & Booking Details</div>
                        <div className="info-block">
                          <span className="info-label">Room Number:</span>
                          <span className="info-value">Room {roomNumber}</span>
                        </div>
                        <div className="info-block">
                          <span className="info-label">Room Type:</span>
                          <span className="info-value">{roomTypeName}</span>
                        </div>
                        <div className="info-block">
                          <span className="info-label">Meal Plan:</span>
                          <span className="info-value">
                            {mealPlan === 'CP'
                              ? 'CP (Breakfast Included)'
                              : mealPlan === 'MAP'
                                ? 'MAP (Bfast + Dinner Included)'
                                : mealPlan === 'AP'
                                  ? 'AP (All Meals Included)'
                                  : 'EP (Room Only)'}
                          </span>
                        </div>
                        <div className="info-block">
                          <span className="info-label">Stay Period:</span>
                          <span className="info-value">
                            {fmtDate(folio.reservation.arrivalDate)} to {fmtDate(folio.reservation.departureDate)}
                          </span>
                        </div>
                        <div className="info-block">
                          <span className="info-label">Nights:</span>
                          <span className="info-value">
                            {nights} Night{nights !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="info-block">
                          <span className="info-label">Guests:</span>
                          <span className="info-value">
                            {folio.reservation.adults || 1} Adults / {folio.reservation.children || 0} Children
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Folio Ledger / Room Charges */}
                <div className="section-title">Room Charges & Services Ledger</div>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '13%' }}>Date</th>
                      <th style={{ width: '12%' }}>SAC / HSN</th>
                      <th style={{ width: '13%' }}>Category</th>
                      <th style={{ width: '38%' }}>Description</th>
                      <th style={{ width: '12%', textAlign: 'right' }}>Charges</th>
                      <th style={{ width: '12%', textAlign: 'right' }}>Payments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folio.transactions.map((txn) => {
                      const isRoom = txn.sourceModule === 'HMS' || txn.sourceModule === 'ROOM_RENT' || txn.description?.toLowerCase().includes('room');
                      const isPos = txn.sourceModule === 'POS' || txn.sourceModule === 'ROOM_SERVICE';
                      const isGst = txn.sourceModule === 'GST';
                      const sacCode = isRoom ? '996311' : isPos ? '996331' : isGst ? 'TAX' : '9963';
                      const mealPlanText = isRoom && (folio.reservation as any)?.mealPlan ? ` [Plan: ${(folio.reservation as any).mealPlan}]` : '';

                      return (
                        <React.Fragment key={txn.id}>
                          <tr>
                            <td>{fmtDate(txn.txnDate)}</td>
                            <td style={{ fontWeight: 700, fontSize: '10px', color: '#475569' }}>{sacCode}</td>
                            <td style={{ textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold' }}>
                              {txn.sourceModule}
                            </td>
                            <td>{txn.description}{mealPlanText}</td>
                            <td className="amount debit">
                              {txn.debitAmount > 0 ? fmt(txn.debitAmount) : '—'}
                            </td>
                            <td className="amount credit">
                              {txn.creditAmount > 0 ? fmt(txn.creditAmount) : '—'}
                            </td>
                          </tr>
                          {txn.taxAmount > 0 && !isGst && (
                            <tr style={{ background: '#f8fafc', fontSize: '11px', color: '#64748b' }}>
                              <td>{fmtDate(txn.txnDate)}</td>
                              <td style={{ fontWeight: 700, fontSize: '10px', color: '#94a3b8' }}>9963</td>
                              <td style={{ textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold', color: '#d97706' }}>
                                GST TAX
                              </td>
                              <td style={{ fontStyle: 'italic' }}>
                                Applicable CGST + SGST on {txn.description}
                              </td>
                              <td className="amount debit" style={{ color: '#d97706' }}>
                                {fmt(txn.taxAmount)}
                              </td>
                              <td className="amount credit">—</td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {folio.transactions.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                          No transactions posted to this ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Linked POS/Food & Beverage Orders */}
                {folio.posOrders && folio.posOrders.length > 0 && (
                  <div className="pos-orders-container">
                    <div className="section-title">Itemized Room Service & Restaurant Food Orders</div>
                    {folio.posOrders.map((order) => (
                      <div key={order.id} className="pos-order-card" style={{ marginBottom: '14px', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                        <div className="pos-order-header" style={{ background: '#f1f5f9', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #cbd5e1' }}>
                          <span className="pos-order-title" style={{ fontWeight: 800, fontSize: '11px', color: '#0f172a' }}>
                            🍽️ {order.outlet?.name || 'Room Service'} — Order #{order.orderNo}
                          </span>
                          <span className="pos-order-meta" style={{ fontSize: '10px', color: '#64748b' }}>
                            {fmtDateTime(order.createdAt)}
                          </span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: '9px', textTransform: 'uppercase' }}>
                              <th style={{ padding: '6px 12px', textAlign: 'left', width: '50%' }}>Item Description</th>
                              <th style={{ padding: '6px 12px', textAlign: 'center', width: '15%' }}>Qty</th>
                              <th style={{ padding: '6px 12px', textAlign: 'right', width: '15%' }}>Rate</th>
                              <th style={{ padding: '6px 12px', textAlign: 'right', width: '20%' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px 12px', color: '#1e293b', fontWeight: 600 }}>
                                  {item.product?.name || (item as any).name || 'Food Item'}
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center', color: '#475569' }}>
                                  {item.quantity}
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'right', color: '#475569' }}>
                                  {fmt(item.unitPrice || 0)}
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                  {fmt(Number(item.totalAmount || (item.unitPrice * item.quantity) || 0))}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ padding: '8px 12px', background: '#fafaf9', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 800 }}>
                          <span style={{ color: '#475569' }}>Order #{order.orderNo} Total (Incl. Taxes):</span>
                          <span style={{ color: '#0f172a' }}>{fmt(order.grandTotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Official GST Tax Breakdown Table (SAC / HSN Wise) ── */}
                <div style={{ marginTop: '22px', marginBottom: '18px' }}>
                  <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>GST Tax Breakdown Summary (GST Compliant)</span>
                    <span style={{ fontSize: '9px', fontWeight: 600, color: '#64748b' }}>
                      Reverse Charge: No | Place of Supply: {gstDetails.placeOfSupply}
                    </span>
                  </div>
                  <table className="gst-table">
                    <thead>
                      <tr>
                        <th style={{ width: '10%' }}>SAC/HSN</th>
                        <th style={{ width: '32%' }}>Service Description</th>
                        <th style={{ width: '14%', textAlign: 'right' }}>Taxable Value</th>
                        {gstDetails.isInterState ? (
                          <>
                            <th style={{ width: '14%', textAlign: 'right' }}>IGST Rate</th>
                            <th style={{ width: '14%', textAlign: 'right' }}>IGST Amount</th>
                          </>
                        ) : (
                          <>
                            <th style={{ width: '10%', textAlign: 'right' }}>CGST %</th>
                            <th style={{ width: '11%', textAlign: 'right' }}>CGST Amt</th>
                            <th style={{ width: '10%', textAlign: 'right' }}>SGST %</th>
                            <th style={{ width: '11%', textAlign: 'right' }}>SGST Amt</th>
                          </>
                        )}
                        <th style={{ width: '14%', textAlign: 'right' }}>Total Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstDetails.rows.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 800, color: '#1e293b' }}>{row.sac}</td>
                          <td style={{ fontWeight: 600 }}>{row.category}</td>
                          <td className="amount">{fmt(row.taxableAmount)}</td>
                          {gstDetails.isInterState ? (
                            <>
                              <td style={{ textAlign: 'right' }}>{row.igstRate}%</td>
                              <td className="amount">{fmt(row.igstAmount)}</td>
                            </>
                          ) : (
                            <>
                              <td style={{ textAlign: 'right' }}>{row.cgstRate}%</td>
                              <td className="amount">{fmt(row.cgstAmount)}</td>
                              <td style={{ textAlign: 'right' }}>{row.sgstRate}%</td>
                              <td className="amount">{fmt(row.sgstAmount)}</td>
                            </>
                          )}
                          <td className="amount" style={{ color: '#b45309', fontWeight: 800 }}>
                            {fmt(row.totalTax)}
                          </td>
                        </tr>
                      ))}
                      <tr className="total-row">
                        <td colSpan={2} style={{ fontWeight: 900, textTransform: 'uppercase' }}>
                          Total Taxable & Taxes
                        </td>
                        <td className="amount" style={{ fontWeight: 900 }}>
                          {fmt(gstDetails.totalTaxable)}
                        </td>
                        {gstDetails.isInterState ? (
                          <>
                            <td></td>
                            <td className="amount" style={{ fontWeight: 900 }}>
                              {fmt(gstDetails.totalIgst)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td></td>
                            <td className="amount" style={{ fontWeight: 900 }}>
                              {fmt(gstDetails.totalCgst)}
                            </td>
                            <td></td>
                            <td className="amount" style={{ fontWeight: 900 }}>
                              {fmt(gstDetails.totalSgst)}
                            </td>
                          </>
                        )}
                        <td className="amount" style={{ color: '#b45309', fontWeight: 900, fontSize: '11px' }}>
                          {fmt(gstDetails.grandTax)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: '#475569', background: '#fffbeb', border: '1px dashed #fcd34d', padding: '6px 10px', borderRadius: '6px', marginTop: '4px' }}>
                    <span><strong>Total GST Tax (in Words):</strong> {gstDetails.taxInWords}</span>
                    <span style={{ fontWeight: 700, color: '#92400e' }}>
                      {gstDetails.isInterState ? 'IGST Applicable' : 'CGST + SGST (Intra-State)'}
                    </span>
                  </div>
                </div>

                {/* Invoice Summary */}
                <div className="divider"></div>
                {(() => {
                  const stayTxns = folio.transactions.filter(
                    (t) => t.debitAmount > 0 && t.sourceModule !== 'POS' && t.sourceModule !== 'ROOM_SERVICE' && t.sourceModule !== 'GST'
                  );
                  const roomStayAmount = stayTxns.reduce((sum, t) => sum + t.debitAmount, 0) || Number(folio.reservation?.totalAmount || 0);

                  const fnbAmount = folio.posOrders?.reduce((sum, o) => sum + Number(o.grandTotal || 0), 0) ||
                    folio.transactions.filter(t => t.debitAmount > 0 && (t.sourceModule === 'POS' || t.sourceModule === 'ROOM_SERVICE')).reduce((sum, t) => sum + t.debitAmount, 0);

                  const paymentTxns = folio.transactions.filter((t) => t.creditAmount > 0);

                  return (
                    <div className="summary-table-container">
                      <table className="summary-table" style={{ width: '400px' }}>
                        <tbody>
                          <tr>
                            <td>Room Stay Charges ({nights} Night{nights !== 1 ? 's' : ''}) [SAC 996311]</td>
                            <td className="amount">{fmt(roomStayAmount)}</td>
                          </tr>
                          {fnbAmount > 0 && (
                            <tr>
                              <td>Food & Beverage Orders [SAC 996331]</td>
                              <td className="amount">{fmt(fnbAmount)}</td>
                            </tr>
                          )}
                          {gstDetails.grandTax > 0 && (
                            <>
                              <tr>
                                <td>Taxable Net Amount</td>
                                <td className="amount">{fmt(gstDetails.totalTaxable)}</td>
                              </tr>
                              {gstDetails.isInterState ? (
                                <tr>
                                  <td style={{ color: '#92400e' }}>IGST (Inter-State Tax)</td>
                                  <td className="amount" style={{ color: '#92400e' }}>{fmt(gstDetails.totalIgst)}</td>
                                </tr>
                              ) : (
                                <>
                                  <tr>
                                    <td style={{ color: '#92400e' }}>Central GST (CGST)</td>
                                    <td className="amount" style={{ color: '#92400e' }}>{fmt(gstDetails.totalCgst)}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ color: '#92400e' }}>State GST (SGST)</td>
                                    <td className="amount" style={{ color: '#92400e' }}>{fmt(gstDetails.totalSgst)}</td>
                                  </tr>
                                </>
                              )}
                              <tr style={{ background: '#fffbeb', borderTop: '1px dashed #fcd34d' }}>
                                <td style={{ color: '#b45309', fontWeight: 800 }}>Total GST Tax Amount</td>
                                <td className="amount" style={{ color: '#b45309', fontWeight: 800 }}>{fmt(gstDetails.grandTax)}</td>
                              </tr>
                            </>
                          )}
                          <tr className="grand-total" style={{ borderTop: '2px solid #cbd5e1' }}>
                            <td style={{ fontWeight: 900 }}>Total Bill Amount</td>
                            <td className="amount" style={{ fontWeight: 900 }}>{fmt(folio.totalCharges)}</td>
                          </tr>
                          {paymentTxns.map((p) => (
                            <tr key={p.id} style={{ background: '#f0fdf4' }}>
                              <td style={{ color: '#166534', fontSize: '10px' }}>
                                Paid: {p.description || 'Payment Settlement'}
                              </td>
                              <td className="amount" style={{ color: '#166534' }}>
                                {fmt(p.creditAmount)}
                              </td>
                            </tr>
                          ))}
                          {paymentTxns.length === 0 && folio.totalPayments > 0 && (
                            <tr style={{ background: '#f0fdf4' }}>
                              <td style={{ color: '#166534' }}>Total Payments / Settled</td>
                              <td className="amount" style={{ color: '#166534' }}>{fmt(folio.totalPayments)}</td>
                            </tr>
                          )}
                          <tr className={folio.closingBalance <= 0 ? 'settled-row' : 'due-row'}>
                            <td style={{ fontWeight: 800 }}>
                              {folio.closingBalance <= 0 ? 'PAYMENT STATUS' : 'BALANCE DUE'}
                            </td>
                            <td className="amount" style={{ fontWeight: 800 }}>
                              {folio.closingBalance <= 0 ? '₹0.00 (PAID / FULLY SETTLED)' : fmt(folio.closingBalance)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}

                {/* Signatures */}
                <div className="invoice-signatures-container">
                  <div className="invoice-signature-box">
                    <div className="invoice-signature-line">Guest Signature</div>
                  </div>
                  <div className="invoice-signature-box">
                    <div className="invoice-signature-line">Authorized Signatory</div>
                  </div>
                </div>

                {/* Terms and Footer */}
                <div className="invoice-footer-section">
                  <p className="invoice-terms-title">Terms & Conditions</p>
                  <p>1. All guest charges are subject to applicable state and central taxes.</p>
                  <p>2. Payments can be settled via UPI, credit/debit card, bank transfer, or cash.</p>
                  <p>3. Any disputes regarding these charges must be reported to the manager before departure.</p>
                  <div className="invoice-thank-you">
                    Thank you for staying with us. Have a safe journey!
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Spacer to prevent clipping at the bottom of the scroll container */}
          <div className="h-10 block shrink-0" />
        </div>
      </div>
    </div>
  );
}
