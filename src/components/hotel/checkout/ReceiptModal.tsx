'use client';

import React, { useRef } from 'react';
import { CheckCircle2, Printer, X } from 'lucide-react';

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
    roomType?: { name: string } | null;
    rooms?: { room: { roomNumber: string; floor?: string | null } }[] | null;
    checkIns: { id: string; status: string; checkedInAt: string; expectedCheckoutAt: string }[];
    property?: {
      id: string;
      name: string;
      brandName?: string | null;
      logoUrl?: string | null;
      address?: string | null;
      phone?: string | null;
      taxDetails?: string | null;
      city?: string | null;
      state?: string | null;
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
      product: { name: string };
    }[];
  }[] | null;
}

interface ReceiptModalProps {
  folio: FolioDetail;
  nights: number;
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
`;

export default function ReceiptModal({ folio, nights, onClose }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const room = folio.reservation?.rooms?.[0]?.room;
  const property = folio.reservation?.property;

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const w = window.open('', '_blank');
    if (!w) return;

    w.document.write(`
      <html>
      <head>
        <title>Invoice - ${folio.folioNo}</title>
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
  };

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
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 active:scale-[0.98] transition-all"
            >
              <Printer size={13} /> Print Bill
            </button>
            <button
              onClick={onClose}
              className="w-8.5 h-8.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white transition-all"
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
                            {[property?.city, property?.state, property?.country, property?.pinCode]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                          {property?.phone && <p>Tel: {property.phone}</p>}
                          {property?.taxDetails && (
                            <p style={{ marginTop: '4px', fontWeight: 700 }}>
                              GSTIN: {property.taxDetails}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="invoice-title-sec">
                        <div className="invoice-title">TAX INVOICE</div>
                        <div className="invoice-meta">
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
                      {/* Left: Guest Details */}
                      <td>
                        <div className="section-title">Bill To (Guest Details)</div>
                        <div className="guest-name">
                          {folio.guest.firstName} {folio.guest.lastName || ''}
                        </div>
                        <div className="guest-details">
                          {folio.guest.mobile && <p><strong>Mobile:</strong> {folio.guest.mobile}</p>}
                          {folio.guest.email && <p><strong>Email:</strong> {folio.guest.email}</p>}
                          {folio.guest.address && <p><strong>Address:</strong> {folio.guest.address}</p>}
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
                          <span className="info-value">{room?.roomNumber || '—'}</span>
                        </div>
                        <div className="info-block">
                          <span className="info-label">Room Type:</span>
                          <span className="info-value">{folio.reservation?.roomType?.name || 'Standard'}</span>
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
                      <th style={{ width: '15%' }}>Date</th>
                      <th style={{ width: '15%' }}>Category</th>
                      <th style={{ width: '40%' }}>Description</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Debit (Charges)</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>Credit (Payments)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folio.transactions.map((txn) => (
                      <tr key={txn.id}>
                        <td>{fmtDate(txn.txnDate)}</td>
                        <td style={{ textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold' }}>
                          {txn.sourceModule}
                        </td>
                        <td>{txn.description || 'Transaction Charge'}</td>
                        <td className="amount debit">
                          {txn.debitAmount > 0 ? fmt(txn.debitAmount) : '—'}
                        </td>
                        <td className="amount credit">
                          {txn.creditAmount > 0 ? fmt(txn.creditAmount) : '—'}
                        </td>
                      </tr>
                    ))}
                    {folio.transactions.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                          No transactions posted to this ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Linked POS/Food & Beverage Orders */}
                {folio.posOrders && folio.posOrders.length > 0 && (
                  <div className="pos-orders-container">
                    <div className="section-title">Food & Beverage / Restaurant Bills Details</div>
                    {folio.posOrders.map((order) => (
                      <div key={order.id} className="pos-order-card">
                        <div className="pos-order-header">
                          <span className="pos-order-title">
                            🍽️ {order.outlet?.name || 'Outlet Order'} — Order #{order.orderNo}
                          </span>
                          <span className="pos-order-meta">
                            {fmtDateTime(order.createdAt)}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="pos-item-row">
                              <span className="pos-item-name">
                                {item.quantity} × {item.product?.name || 'F&B Item'}
                              </span>
                              <span className="pos-item-price">
                                {fmt(item.totalAmount)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="pos-order-total-row">
                          <span>Order Total (Incl. Taxes & Service Charges)</span>
                          <span>{fmt(order.grandTotal)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Invoice Summary */}
                <div className="divider"></div>
                <div className="summary-table-container">
                  <table className="summary-table">
                    <tbody>
                      <tr>
                        <td>Total Charges</td>
                        <td className="amount">{fmt(folio.totalCharges)}</td>
                      </tr>
                      <tr>
                        <td>Total Payments & Advances</td>
                        <td className="amount" style={{ color: '#15803d' }}>
                          {fmt(folio.totalPayments)}
                        </td>
                      </tr>
                      <tr className="grand-total">
                        <td>Net Total</td>
                        <td className="amount">{fmt(folio.totalCharges)}</td>
                      </tr>
                      <tr className={folio.closingBalance <= 0 ? 'settled-row' : 'due-row'}>
                        <td>
                          {folio.closingBalance <= 0 ? 'STATUS: PAID' : 'BALANCE DUE'}
                        </td>
                        <td className="amount">
                          {folio.closingBalance <= 0 ? '₹0.00 (Fully Settled)' : fmt(folio.closingBalance)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

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
