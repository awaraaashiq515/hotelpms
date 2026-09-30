'use client';

import React from 'react';
import {
  X,
  Printer,
  Calendar,
  Clock,
  User,
  Bed,
  Phone,
  Mail,
  Building2,
  Shield,
  CreditCard,
  UtensilsCrossed,
  FileText,
  MapPin,
  CheckCircle2,
  Hash,
} from 'lucide-react';
import { FolioDetail } from '@/components/hotel/checkout/ReceiptModal';

interface BookingDetailModalProps {
  isOpen: boolean;
  folio: FolioDetail | null;
  nights: number;
  onClose: () => void;
  onPrintGrc: () => void;
  onPrintBill: () => void;
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function BookingDetailModal({
  isOpen,
  folio,
  nights,
  onClose,
  onPrintGrc,
  onPrintBill,
}: BookingDetailModalProps) {
  if (!isOpen || !folio) return null;

  const res = folio.reservation;
  const guest = folio.guest;
  const room = res.rooms?.[0]?.room;
  const property = res.property;
  const activeCheckIn = res.checkIns?.[0];

  const handlePrintBookingVoucher = () => {
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Booking Confirmation Voucher - ${res.bookingNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 25px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: 800; color: #0f172a; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .section { margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
            .section-title { font-size: 13px; font-weight: 800; color: #334155; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 12px; }
            .label { color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            .value { font-weight: 700; color: #0f172a; margin-top: 2px; }
            .total-box { background: #f8fafc; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; font-weight: 800; font-size: 14px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${property?.name || 'HOTEL RESERVATION'}</div>
              <div class="subtitle">${property?.address || ''} ${property?.phone ? '· ' + property.phone : ''}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 800; font-size: 16px; color: #6366f1;">STAY VOUCHER</div>
              <div style="font-size: 12px; font-weight: 700;">#${res.bookingNo}</div>
              <div style="font-size: 11px; color: #64748b;">Folio: ${folio.folioNo}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Guest Details</div>
            <div class="grid">
              <div><div class="label">Guest Name</div><div class="value">${guest.firstName} ${guest.lastName || ''}</div></div>
              <div><div class="label">Mobile Number</div><div class="value">${guest.mobile || '—'}</div></div>
              <div><div class="label">Email Address</div><div class="value">${guest.email || '—'}</div></div>
              <div><div class="label">Company / GSTIN</div><div class="value">${res.companyName || guest.companyName || '—'} ${res.gstNumber || guest.gstNumber ? `(${res.gstNumber || guest.gstNumber})` : ''}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Room & Stay Details</div>
            <div class="grid">
              <div><div class="label">Assigned Room</div><div class="value">Room ${room?.roomNumber || '—'} (${res.roomType?.name || 'Standard'})</div></div>
              <div><div class="label">Stay Duration</div><div class="value">${nights} Night(s)</div></div>
              <div><div class="label">Check-in Date</div><div class="value">${new Date(res.arrivalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
              <div><div class="label">Check-out Date</div><div class="value">${new Date(res.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div></div>
              <div><div class="label">Occupancy</div><div class="value">${res.adults} Adults, ${res.children} Children</div></div>
              <div><div class="label">Booking Status</div><div class="value">${activeCheckIn?.status || 'CHECKED_IN'}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Billing Breakdown</div>
            <div class="grid" style="margin-bottom: 12px;">
              <div><div class="label">Room Charges</div><div class="value">${fmt(folio.totalCharges)}</div></div>
              <div><div class="label">Advance / Total Payments</div><div class="value" style="color: #16a34a;">${fmt(folio.totalPayments)}</div></div>
            </div>
            <div class="total-box">
              <span>Closing Balance Due:</span>
              <span style="color: ${folio.closingBalance > 0 ? '#dc2626' : '#16a34a'};">${fmt(folio.closingBalance)}</span>
            </div>
          </div>

          <div style="margin-top: 40px; display: flex; justify-content: space-between; font-size: 11px;">
            <div>Guest Signature: _________________________</div>
            <div>Authorized Front Desk: _________________________</div>
          </div>

          <script>
            window.onload = function() {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#090f1e] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <FileText size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Booking #{res.bookingNo}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  {activeCheckIn?.status || 'CHECKED_IN'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Folio: {folio.folioNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintBookingVoucher}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all"
            >
              <Printer size={13} /> Print Voucher
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Guest Profile Details */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <User size={14} className="text-orange-400" /> Guest Profile
              </span>
              {guest.nationality && (
                <span className="text-[10px] text-slate-500 font-semibold">{guest.nationality}</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Full Name</span>
                <span className="text-sm font-black text-white">{guest.firstName} {guest.lastName || ''}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Phone Number</span>
                <span className="font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                  <Phone size={11} className="text-slate-500" /> {guest.mobile || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Email</span>
                <span className="font-bold text-slate-200 flex items-center gap-1 mt-0.5 truncate">
                  <Mail size={11} className="text-slate-500" /> {guest.email || '—'}
                </span>
              </div>
            </div>

            {(guest.idType || guest.idNumber || guest.address) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-900">
                {guest.idType && (
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Govt ID Proof</span>
                    <span className="font-mono font-bold text-amber-300">
                      {guest.idType}: {guest.idNumber || '—'}
                    </span>
                  </div>
                )}
                {guest.address && (
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Address</span>
                    <span className="text-slate-300 truncate block">{guest.address}</span>
                  </div>
                )}
              </div>
            )}

            {(res.gstNumber || guest.gstNumber || res.companyName || guest.companyName) && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-400">
                  Corporate / GST Details
                </span>
                <span className="font-black text-white">{res.companyName || guest.companyName || 'Corporate Guest'}</span>
                {(res.gstNumber || guest.gstNumber) && (
                  <span className="font-mono text-xs block text-amber-300 mt-0.5">
                    GSTIN: {res.gstNumber || guest.gstNumber}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Stay & Room Details */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
              <Bed size={14} className="text-indigo-400" /> Stay & Room Allocation
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Room No</span>
                <span className="text-lg font-black text-white">{room?.roomNumber || '—'}</span>
                <span className="text-[9px] text-slate-500 block">{res.roomType?.name || 'Standard'}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Duration</span>
                <span className="text-lg font-black text-white">{nights}</span>
                <span className="text-[9px] text-slate-500 block">Night{nights !== 1 ? 's' : ''} Stay</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Check-in</span>
                <span className="text-xs font-black text-white">{fmtDate(res.arrivalDate)}</span>
                <span className="text-[9px] text-slate-500 block">Arrival</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Check-out</span>
                <span className="text-xs font-black text-white">{fmtDate(res.departureDate)}</span>
                <span className="text-[9px] text-slate-500 block">Departure</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-slate-400 pt-1 text-xs">
              <span>Occupancy: <strong className="text-white">{res.adults} Adults, {res.children} Children</strong></span>
              <span>Meal Plan: <strong className="text-indigo-300">European / Continental (As per booking)</strong></span>
            </div>
          </div>

          {/* Billing & Financial Ledger Summary */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
              <CreditCard size={14} className="text-emerald-400" /> Financial Summary
            </span>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Charges</span>
                <span className="text-base font-black text-red-400">{fmt(folio.totalCharges)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Paid / Advance</span>
                <span className="text-base font-black text-emerald-400">{fmt(folio.totalPayments)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Balance Due</span>
                <span className={`text-base font-black ${folio.closingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {fmt(folio.closingBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              onClick={onPrintGrc}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 transition-all flex items-center justify-center gap-1.5"
            >
              <Printer size={13} className="text-indigo-400" /> Guest Registration Card (GRC)
            </button>
            <button
              onClick={onPrintBill}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs font-black text-white shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Printer size={13} /> View / Print Folio Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
