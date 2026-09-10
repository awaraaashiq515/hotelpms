'use client';

import React, { useRef } from 'react';
import { X, Printer, FileText, CheckCircle2, ShieldCheck, Building2, User, Calendar, CreditCard } from 'lucide-react';
import { ReservationItem } from './ReservationWidget';

interface PropertyDetails {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pinCode?: string;
  phone?: string;
  taxDetails?: string;
  currency?: string;
}

interface GuestRegistrationCardModalProps {
  isOpen: boolean;
  reservation: ReservationItem | null;
  property: PropertyDetails | null;
  onClose: () => void;
}

export function GuestRegistrationCardModal({
  isOpen,
  reservation,
  property,
  onClose,
}: GuestRegistrationCardModalProps) {
  if (!isOpen || !reservation) return null;

  const hotelName = property?.name || 'Hotel Grand Palace';
  const hotelAddress = [
    property?.address,
    property?.city,
    property?.state ? `${property?.state} ${property?.pinCode || ''}` : '',
    property?.country,
  ].filter(Boolean).join(', ') || 'Main Street, City Center';
  const hotelPhone = property?.phone || '+91 98765 43210';
  const hotelGst = property?.taxDetails || '07AAAAA0000A1Z5';
  const currency = property?.currency || '₹';

  const arrDateStr = reservation.arrivalDate
    ? new Date(reservation.arrivalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Today';
  const depDateStr = reservation.departureDate
    ? new Date(reservation.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Tomorrow';

  const triggerDirectPrint = (docType: 'GRC' | 'FOLIO') => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Please allow popups to print the guest registration document.');
      return;
    }

    const docTitle = docType === 'GRC' ? 'GUEST REGISTRATION CARD' : 'GUEST FOLIO & STAY VOUCHER';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} - ${reservation.reservationNumber}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              font-size: 12px;
              line-height: 1.4;
              padding: 20px 25px;
            }
            .container {
              max-width: 780px;
              margin: 0 auto;
              border: 1.5px solid #0f172a;
              padding: 24px 28px;
            }
            .hotel-header {
              text-align: center;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 16px;
              margin-bottom: 16px;
            }
            .hotel-title {
              font-size: 24px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #0f172a;
            }
            .hotel-subtitle {
              font-size: 11px;
              color: #475569;
              margin-top: 4px;
            }
            .doc-badge-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #f1f5f9;
              padding: 8px 14px;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              margin-bottom: 16px;
            }
            .doc-badge-title {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              color: #0f172a;
              letter-spacing: 0.5px;
            }
            .doc-badge-meta {
              font-size: 11px;
              font-weight: 600;
              color: #334155;
            }
            .section {
              margin-bottom: 16px;
            }
            .section-header {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #475569;
              border-bottom: 1.5px solid #cbd5e1;
              padding-bottom: 4px;
              margin-bottom: 8px;
            }
            .grid-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px 24px;
            }
            .grid-3 {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10px 18px;
            }
            .grid-4 {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr;
              gap: 8px 14px;
            }
            .field-row {
              margin-bottom: 4px;
            }
            .field-label {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
            }
            .field-val {
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 1px;
            }
            .tariff-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 6px;
              margin-bottom: 12px;
            }
            .tariff-table th, .tariff-table td {
              border: 1px solid #cbd5e1;
              padding: 7px 10px;
              text-align: left;
            }
            .tariff-table th {
              background: #f8fafc;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              color: #475569;
            }
            .tariff-table td.amount, .tariff-table th.amount {
              text-align: right;
            }
            .total-row td {
              font-weight: 800;
              font-size: 12px;
              background: #f1f5f9;
            }
            .rules-box {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 10px 12px;
              font-size: 10px;
              color: #475569;
              line-height: 1.5;
              margin-bottom: 20px;
            }
            .rules-box ul {
              padding-left: 16px;
              margin-top: 4px;
            }
            .signatures-box {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
              margin-top: 30px;
              padding-top: 10px;
            }
            .sign-line {
              border-top: 1.5px dashed #0f172a;
              padding-top: 6px;
              text-align: center;
              font-size: 11px;
              font-weight: 700;
              color: #0f172a;
            }
            .sign-sub {
              font-size: 9px;
              color: #64748b;
              margin-top: 2px;
            }
            @media print {
              body {
                padding: 0;
              }
              .container {
                border: none;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="hotel-header">
              <div class="hotel-title">${hotelName}</div>
              <div class="hotel-subtitle">${hotelAddress}</div>
              <div class="hotel-subtitle">Phone: ${hotelPhone} &nbsp;|&nbsp; GSTIN: ${hotelGst}</div>
            </div>

            <!-- Doc Badge -->
            <div class="doc-badge-container">
              <div class="doc-badge-title">${docTitle}</div>
              <div class="doc-badge-meta">
                Booking ID: <strong>${reservation.reservationNumber}</strong> &nbsp;|&nbsp; Date: <strong>${new Date().toLocaleDateString('en-GB')}</strong>
              </div>
            </div>

            <!-- Guest Profile -->
            <div class="section">
              <div class="section-header">1. Guest Identification Details</div>
              <div class="grid-3">
                <div class="field-row">
                  <div class="field-label">Guest Full Name</div>
                  <div class="field-val">${reservation.guestName || 'N/A'}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Mobile Number</div>
                  <div class="field-val">${reservation.guestMobile || '+91 - Not provided'}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Email Address</div>
                  <div class="field-val">${reservation.guestEmail || 'N/A'}</div>
                </div>
              </div>
              <div class="grid-3" style="margin-top: 6px;">
                <div class="field-row">
                  <div class="field-label">Identity Type</div>
                  <div class="field-val">${reservation.guestIdType || 'Govt Photo ID / Aadhaar'}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">ID / Document Number</div>
                  <div class="field-val">${reservation.guestIdNumber || 'Verified at Desk'}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Nationality</div>
                  <div class="field-val">${reservation.guestNationality || 'Indian'}</div>
                </div>
              </div>
              ${reservation.companyName || reservation.gstNumber ? `
                <div class="grid-2" style="margin-top: 6px;">
                  <div class="field-row">
                    <div class="field-label">Company / Corporate Name</div>
                    <div class="field-val">${reservation.companyName || 'Individual'}</div>
                  </div>
                  <div class="field-row">
                    <div class="field-label">Company GSTIN</div>
                    <div class="field-val">${reservation.gstNumber || 'N/A'}</div>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Stay Details -->
            <div class="section">
              <div class="section-header">2. Stay & Room Allocation</div>
              <div class="grid-4">
                <div class="field-row">
                  <div class="field-label">Assigned Room</div>
                  <div class="field-val" style="font-size: 14px; color: #0f172a;">Room ${reservation.unitNumber}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Room Category</div>
                  <div class="field-val">${reservation.roomTypeName || 'Standard Room'}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Check-In Date</div>
                  <div class="field-val">${arrDateStr} (12:00 PM)</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Check-Out Date</div>
                  <div class="field-val">${depDateStr} (11:00 AM)</div>
                </div>
              </div>
              <div class="grid-4" style="margin-top: 6px;">
                <div class="field-row">
                  <div class="field-label">Duration</div>
                  <div class="field-val">${reservation.nights || 1} Night(s)</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Occupants</div>
                  <div class="field-val">${reservation.adults || 1} Adult(s), ${reservation.children || 0} Child</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Meal Plan</div>
                  <div class="field-val">${reservation.mealPlan || 'RO (Room Only)'}</div>
                </div>
                <div class="field-row">
                  <div class="field-label">Booking Status</div>
                  <div class="field-val" style="color: #059669; font-weight: 800;">${reservation.status}</div>
                </div>
              </div>
            </div>

            <!-- Tariff & Payment -->
            <div class="section">
              <div class="section-header">3. Tariff, Inclusions & Billing Breakdown</div>
              <table class="tariff-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Rate / Plan</th>
                    <th>Units / Duration</th>
                    <th class="amount">Total Charges</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Room Accommodation Tariff (Room ${reservation.unitNumber})</td>
                    <td>${currency} ${(reservation.ratePerNight || Math.round((reservation.totalAmount || 0) / Math.max(1, reservation.nights || 1))).toLocaleString('en-IN')}/night</td>
                    <td>${reservation.nights || 1} Night(s)</td>
                    <td class="amount">${currency} ${(reservation.totalAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td>Advance Payment Received</td>
                    <td>Direct / Gateway</td>
                    <td>Settled</td>
                    <td class="amount" style="color: #059669;">- ${currency} ${(reservation.advanceAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                  <tr class="total-row">
                    <td colspan="3" style="text-align: right; text-transform: uppercase;">Balance Payable at Checkout:</td>
                    <td class="amount" style="color: #dc2626; font-size: 13px;">${currency} ${(reservation.dueAmount || 0).toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            ${reservation.notes ? `
              <!-- Special Notes -->
              <div class="section">
                <div class="section-header">4. Guest Requests & Preferences</div>
                <div style="font-size: 11px; font-weight: 600; color: #334155; background: #f8fafc; padding: 6px 10px; border-radius: 4px; border: 1px solid #e2e8f0;">
                  ${reservation.notes}
                </div>
              </div>
            ` : ''}

            <!-- Terms & House Rules -->
            <div class="rules-box">
              <strong>Guest Declaration & Hotel Check-in Policy:</strong>
              <ul>
                <li>Standard checkout time is 11:00 AM. Late checkouts are subject to room availability and extra charges.</li>
                <li>Smoking, weapons, and hazardous items are strictly prohibited in guest rooms and indoor corridors.</li>
                <li>The management assumes no liability for money, jewelry, or valuables left unattended in the room.</li>
                <li>I agree that my liability for this bill is not waived and agree to be held personally liable in the event that the indicated person, company, or association fails to pay.</li>
              </ul>
            </div>

            <!-- Signatures -->
            <div class="signatures-box">
              <div class="sign-line">
                Guest Signature
                <div class="sign-sub">I acknowledge & agree to the hotel rules and charges.</div>
              </div>
              <div class="sign-line">
                Duty Manager / Front Desk Executive
                <div class="sign-sub">${hotelName} Reception Desk</div>
              </div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => {
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0f172a] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-800 text-white relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Guest Registration & Document Print
              </h3>
              <p className="text-xs text-slate-400">
                Official check-in card and billing voucher for {reservation.guestName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document Preview Card */}
        <div className="my-5 overflow-y-auto p-4 rounded-xl bg-[#1e293b]/50 border border-slate-800 text-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div>
              <div className="text-base font-bold text-white uppercase">{hotelName}</div>
              <div className="text-[11px] text-slate-400">{hotelAddress}</div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                {reservation.status}
              </span>
              <div className="text-xs font-mono font-bold text-slate-300 mt-1">
                {reservation.reservationNumber}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Guest Name</span>
              <span className="text-sm font-bold text-white">{reservation.guestName}</span>
              <span className="text-xs text-slate-400 block">{reservation.guestMobile || 'Phone not recorded'}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Assigned Room</span>
              <span className="text-sm font-bold text-emerald-400">Room {reservation.unitNumber}</span>
              <span className="text-xs text-slate-400 block">{reservation.roomTypeName || 'Standard'}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px]">
            <div>
              <span className="text-slate-500 block font-semibold">Check-In:</span>
              <span className="font-bold text-slate-200">{arrDateStr}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold">Check-Out:</span>
              <span className="font-bold text-slate-200">{depDateStr}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold">Balance Due:</span>
              <span className="font-bold text-rose-400">{currency} {(reservation.dueAmount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => triggerDirectPrint('FOLIO')}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-sky-400 border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Print Stay Voucher
          </button>
          <button
            type="button"
            onClick={() => triggerDirectPrint('GRC')}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-[#00b894] hover:bg-[#00a884] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#00b894]/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print Registration Card (GRC)
          </button>
        </div>
      </div>
    </div>
  );
}
