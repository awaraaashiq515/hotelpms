'use client';

import React, { useState, useEffect } from 'react';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  Building2,
  Calendar,
  User,
  Clock,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

interface PublicInvoiceViewProps {
  invoiceId: string;
}

export function PublicInvoiceView({ invoiceId }: PublicInvoiceViewProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;

    fetch(`/api/public/invoice/${encodeURIComponent(invoiceId)}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData.data);
        } else {
          setError(resData.message || 'Invoice not found');
        }
      })
      .catch((err) => {
        console.error('Invoice fetch error:', err);
        setError('Failed to load bill details. Please check connection.');
      })
      .finally(() => setLoading(false));
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tax Invoice - ${data?.invoiceNo || 'OrderMint'}`,
          text: `Invoice #${data?.invoiceNo} from ${data?.hotel?.name || 'Hotel'}. Total: ₹${data?.summary?.grandTotal?.toLocaleString('en-IN')}`,
          url: window.location.href,
        });
      } catch {
        // Fallback to copy
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">
          Loading Official Invoice...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 p-8 rounded-3xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-bold text-white">Invoice Not Available</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {error || 'We could not locate this invoice record. Please confirm the bill number or reach out to the hotel desk.'}
          </p>
          <a
            href="https://wa.me/918219007878"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
          >
            <MessageCircle size={16} /> Contact Reception
          </a>
        </div>
      </div>
    );
  }

  const { hotel, guest, stay, items, summary } = data;
  const isPaid = summary?.dueBalance <= 0 || data.paymentStatus === 'PAID';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans py-8 px-4 sm:px-6 lg:px-8">
      {/* ── Top Floating Action Bar (Hidden on Print) ── */}
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Verified Tax Invoice
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 active:scale-95"
          >
            <Share2 size={14} />
            <span>{copied ? 'Copied Link!' : 'Share'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
          >
            <Download size={15} />
            <span>Download PDF / Print</span>
          </button>
        </div>
      </div>

      {/* ── Main Printable Bill Card ── */}
      <div
        id="printable-bill"
        className="max-w-3xl mx-auto bg-white text-slate-900 rounded-3xl shadow-2xl p-6 sm:p-10 border border-slate-200 print:border-none print:shadow-none print:p-0 print:rounded-none"
      >
        {/* Header: Hotel Info & GSTIN */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200 pb-8">
          <div className="space-y-1.5">
            <span className="inline-block px-3 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-[10px] font-black uppercase tracking-widest">
              Original For Recipient · Tax Invoice
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {hotel.name}
            </h1>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
              {hotel.address}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 pt-1 font-mono">
              <span><strong>GSTIN:</strong> {hotel.gstin}</span>
              {hotel.fssai && <span><strong>FSSAI:</strong> {hotel.fssai}</span>}
              <span><strong>Ph:</strong> {hotel.phone}</span>
            </div>
          </div>

          <div className="sm:text-right space-y-1 sm:self-start bg-slate-50 sm:bg-transparent p-4 sm:p-0 rounded-2xl w-full sm:w-auto">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Invoice Reference
            </div>
            <div className="text-lg font-black text-slate-900 font-mono tracking-tight">
              #{data.invoiceNo}
            </div>
            <div className="text-xs text-slate-600">
              <strong>Date:</strong> {data.invoiceDate} {data.invoiceTime && `at ${data.invoiceTime}`}
            </div>
            <div className="pt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                <CheckCircle2 size={13} />
                {isPaid ? 'PAID & SETTLED' : 'PAYMENT DUE'}
              </span>
            </div>
          </div>
        </div>

        {/* Guest & Reservation / Stay Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
          {/* Guest Info */}
          <div className="space-y-2">
            <div className="font-black uppercase tracking-wider text-slate-400 text-[10px]">
              Guest / Billed To
            </div>
            <div className="font-extrabold text-slate-900 text-sm">
              {guest.name}
            </div>
            <div className="text-slate-600 space-y-0.5">
              <div><strong>Mobile:</strong> {guest.mobile}</div>
              {guest.email && guest.email !== '—' && <div><strong>Email:</strong> {guest.email}</div>}
              {guest.gstin && <div><strong>Guest GSTIN:</strong> <span className="font-mono">{guest.gstin}</span></div>}
              {guest.companyName && <div><strong>Company:</strong> {guest.companyName}</div>}
              {guest.address && <div><strong>Address:</strong> {guest.address}</div>}
            </div>
          </div>

          {/* Stay / Room Info */}
          {stay ? (
            <div className="space-y-2 sm:text-right">
              <div className="font-black uppercase tracking-wider text-slate-400 text-[10px]">
                Accommodation Details
              </div>
              <div className="font-extrabold text-slate-900 text-sm">
                Room {stay.roomNumber} · {stay.roomType}
              </div>
              <div className="text-slate-600 space-y-0.5 sm:self-end">
                <div><strong>Check-In:</strong> {stay.checkIn}</div>
                <div><strong>Check-Out:</strong> {stay.checkOut} ({stay.nights} Night{stay.nights > 1 ? 's' : ''})</div>
                <div><strong>Booking No:</strong> <span className="font-mono">{stay.bookingNo}</span></div>
                {stay.adults > 0 && <div><strong>Guests:</strong> {stay.adults} Adult{stay.adults > 1 ? 's' : ''} {stay.children > 0 ? `, ${stay.children} Child` : ''}</div>}
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:text-right">
              <div className="font-black uppercase tracking-wider text-slate-400 text-[10px]">
                Service Outlet
              </div>
              <div className="font-extrabold text-slate-900 text-sm">
                {hotel.outlet || 'Restaurant & In-Room Dining'}
              </div>
              {guest.tableNo && <div className="text-slate-600">Table: {guest.tableNo}</div>}
            </div>
          )}
        </div>

        {/* Itemized Table */}
        <div className="py-6 border-b border-slate-200">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-300 text-[10px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-2.5">#</th>
                <th className="py-2.5">Description</th>
                <th className="py-2.5 text-center">HSN/SAC</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Rate</th>
                <th className="py-2.5 text-right">Tax</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-3 text-slate-400 font-mono">{idx + 1}</td>
                  <td className="py-3 font-bold text-slate-800">
                    {it.description}
                  </td>
                  <td className="py-3 text-center font-mono text-slate-500 text-[11px]">
                    {it.hsnCode || '996311'}
                  </td>
                  <td className="py-3 text-center text-slate-700">{it.qty}</td>
                  <td className="py-3 text-right font-mono text-slate-700">
                    ₹{Number(it.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-500">
                    ₹{Number(it.taxAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right font-black font-mono text-slate-900">
                    ₹{Number(it.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & GST Breakdown */}
        <div className="py-6 flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-200">
          <div className="text-xs text-slate-500 space-y-1.5 max-w-sm">
            <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              Statutory Tax Notice
            </div>
            <p className="leading-relaxed text-[11px]">
              Taxes calculated in accordance with GST Rule 46 for Hospitality &amp; Lodging Services. 
              {summary.taxAmount > 0 && ` Applicable GST: CGST ₹${summary.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })} + SGST ₹${summary.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`}
            </p>
            <p className="text-[10px] text-slate-400">
              This is a computer-generated tax invoice and requires no physical signature.
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between py-1 text-slate-600">
              <span>Taxable Value (Subtotal):</span>
              <span className="font-mono font-bold text-slate-800">
                ₹{Number(summary.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {summary.cgst > 0 && (
              <div className="flex justify-between py-0.5 text-slate-500 text-[11px]">
                <span>CGST:</span>
                <span className="font-mono">
                  ₹{Number(summary.cgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {summary.sgst > 0 && (
              <div className="flex justify-between py-0.5 text-slate-500 text-[11px]">
                <span>SGST:</span>
                <span className="font-mono">
                  ₹{Number(summary.sgst || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {summary.discountAmount > 0 && (
              <div className="flex justify-between py-1 text-emerald-600 font-bold">
                <span>Discount / Concession:</span>
                <span className="font-mono">
                  -₹{Number(summary.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline">
              <span className="font-black text-sm text-slate-900 uppercase">
                Grand Total:
              </span>
              <span className="text-xl font-black text-slate-900 font-mono">
                ₹{Number(summary.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between py-1 text-emerald-700 font-bold border-t border-slate-200">
              <span>Amount Paid:</span>
              <span className="font-mono">
                ₹{Number(summary.totalPaid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between py-1 text-slate-700 font-bold">
              <span>Balance Due:</span>
              <span className={`font-mono ${summary.dueBalance > 0 ? 'text-red-600 font-black' : 'text-slate-500'}`}>
                ₹{Number(summary.dueBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 text-center space-y-1">
          <p className="text-xs font-bold text-slate-800">
            Thank you for choosing {hotel.name}! We hope you had a comfortable stay.
          </p>
          <p className="text-[10px] text-slate-400">
            Powered by OrderMint PMS · For questions or billing support, contact {hotel.phone}
          </p>
        </div>
      </div>

      {/* ── Print Stylesheet ── */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #printable-bill {
            box-shadow: none !important;
            border: none !important;
            padding: 10mm !important;
            margin: 0 auto !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
}
