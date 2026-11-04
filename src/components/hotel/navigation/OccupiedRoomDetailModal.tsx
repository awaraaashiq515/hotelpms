'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  DoorOpen,
  UtensilsCrossed,
  Printer,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  BedDouble,
  ShieldCheck,
  Clock,
  Sparkles,
  Info,
  DollarSign,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { RoomBoardItem } from '@/types/hotel/room-board.types';

interface OccupiedRoomDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomBoardItem | null;
  onOpenBooking?: (roomId: string) => void;
}

export function OccupiedRoomDetailModal({
  isOpen,
  onClose,
  room,
  onOpenBooking,
}: OccupiedRoomDetailModalProps) {
  const [copiedBooking, setCopiedBooking] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !room) return null;
  if (!mounted || typeof document === 'undefined') return null;

  const guest = room.activeGuest;

  const handleCopyBooking = () => {
    if (guest?.bookingNo) {
      navigator.clipboard.writeText(guest.bookingNo);
      setCopiedBooking(true);
      setTimeout(() => setCopiedBooking(false), 2000);
    }
  };

  // Calculate stay duration (nights)
  const calculateNights = () => {
    if (!guest?.arrivalDate || !guest?.departureDate) return 1;
    const arr = new Date(guest.arrivalDate).getTime();
    const dep = new Date(guest.departureDate).getTime();
    const diffDays = Math.ceil((dep - arr) / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const cleanPhone = guest?.phone?.replace(/\D/g, '') || '';
  const nights = calculateNights();

  const handlePrintVoucher = () => {
    if (!guest) return;
    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (!printWin) return;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Stay Confirmation Voucher - Room ${room.roomNumber} - ${guest.bookingNo}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; color: #0f172a; margin: 0; background: #fff; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: 800; color: #1e1b4b; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 10px; background: #e0e7ff; color: #4338ca; border-radius: 9999px; font-weight: 700; font-size: 11px; }
            .section { margin-bottom: 18px; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
            .section-title { font-size: 12px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; letter-spacing: 0.05em; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 13px; }
            .label { color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            .value { font-weight: 700; color: #0f172a; margin-top: 3px; }
            .total-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 10px; display: flex; justify-content: space-between; font-weight: 800; font-size: 15px; margin-top: 15px; }
            .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">HOTEL STAY CONFIRMATION</div>
              <div class="subtitle">Room ${room.roomNumber} · ${room.roomTypeName || 'Standard Room'} (Floor ${room.floor})</div>
            </div>
            <div style="text-align: right;">
              <div class="badge">IN-HOUSE OCCUPIED</div>
              <div style="font-size: 13px; font-weight: 800; margin-top: 6px;">Booking #${guest.bookingNo}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Guest Profile</div>
            <div class="grid">
              <div><div class="label">Guest Full Name</div><div class="value">${guest.guestName}</div></div>
              <div><div class="label">Mobile Number</div><div class="value">${guest.phone || '—'}</div></div>
              <div><div class="label">Email Address</div><div class="value">${guest.email || '—'}</div></div>
              <div><div class="label">Total Guests</div><div class="value">${guest.adults || 1} Adult(s), ${guest.children || 0} Child(ren)</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Stay Duration & Room</div>
            <div class="grid">
              <div><div class="label">Room Allocated</div><div class="value">Room ${room.roomNumber} (${room.roomTypeName || 'Standard'})</div></div>
              <div><div class="label">Duration</div><div class="value">${nights} Night${nights > 1 ? 's' : ''}</div></div>
              <div><div class="label">Check-in Date (Arrival)</div><div class="value">${formatDate(guest.arrivalDate)}</div></div>
              <div><div class="label">Check-out Date (Departure)</div><div class="value">${formatDate(guest.departureDate)}</div></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Folio & Financial Details</div>
            <div class="grid">
              <div><div class="label">Total Room Charges</div><div class="value">₹${guest.totalAmount.toLocaleString('en-IN')}</div></div>
              <div><div class="label">Amount Paid / Advance</div><div class="value">₹${(guest.totalAmount - guest.dueAmount).toLocaleString('en-IN')}</div></div>
            </div>
            <div class="total-box">
              <span>Folio Balance / Amount Due:</span>
              <span style="color: ${guest.dueAmount > 0 ? '#dc2626' : '#16a34a'};">
                ₹${guest.dueAmount.toLocaleString('en-IN')} ${guest.dueAmount > 0 ? '(Due)' : '(Paid in Full)'}
              </span>
            </div>
          </div>

          ${guest.specialRequests ? `
          <div class="section">
            <div class="section-title">Special Requests / Preferences</div>
            <div style="font-size: 13px; font-weight: 600; color: #334155;">${guest.specialRequests}</div>
          </div>` : ''}

          <div class="footer">
            Printed on ${new Date().toLocaleString('en-IN')} · Front Desk Room Status System
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white my-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 border border-sky-400/30 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-sky-600/20">
              {room.roomNumber}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Room {room.roomNumber} Details
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                  Occupied (In-House)
                </span>
                {room.isVIP && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    VIP
                  </span>
                )}
                {room.isDND && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    DND Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {room.roomTypeName || 'Standard Room'} · Floor {room.floor} · Base ₹{room.baseRate?.toLocaleString('en-IN') || 3500}/night
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintVoucher}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Print Stay Voucher"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {guest ? (
            <>
              {/* Guest Profile Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/80 via-slate-900 to-slate-900 border border-slate-700/70 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-md">
                      {guest.guestName
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'G'}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Registered In-House Guest
                      </span>
                      <h4 className="text-base font-bold text-white">
                        {guest.guestName}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-indigo-300">
                          #{guest.bookingNo}
                        </span>
                        <button
                          onClick={handleCopyBooking}
                          className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="Copy Booking Number"
                        >
                          {copiedBooking ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Phone & WhatsApp Quick Actions */}
                  <div className="flex items-center gap-2">
                    {guest.phone && (
                      <>
                        <a
                          href={`tel:${guest.phone}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{guest.phone}</span>
                        </a>

                        <a
                          href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(guest.guestName)},%20greetings%20from%20Front%20Desk.`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        </a>
                      </>
                    )}
                    {guest.email && (
                      <a
                        href={`mailto:${guest.email}`}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        title={guest.email}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Stay & Duration Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Check-in Date
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-white">
                      {formatDate(guest.arrivalDate)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Check-out Date
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-white">
                      {formatDate(guest.departureDate)}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Duration
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold text-white">
                      {nights} Night{nights > 1 ? 's' : ''} Stay
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Guests Occupancy
                  </span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-xs font-bold text-white">
                      {guest.adults || 1} Adult{guest.adults > 1 ? 's' : ''}
                      {guest.children ? `, ${guest.children} Child` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Folio & Billing Card */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Folio Billing Summary
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      guest.dueAmount > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {guest.dueAmount > 0 ? 'Payment Due' : 'Fully Settled'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700/50 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-900/60">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Total Bill
                    </span>
                    <span className="text-sm font-black text-white">
                      ₹{guest.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Amount Paid
                    </span>
                    <span className="text-sm font-black text-emerald-400">
                      ₹{(guest.totalAmount - guest.dueAmount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900/60">
                    <span className="text-[10px] text-slate-400 block font-medium">
                      Folio Balance
                    </span>
                    <span
                      className={`text-sm font-black ${
                        guest.dueAmount > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      ₹{guest.dueAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {guest.dueAmount > 0 && (
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
                    <span>Outstanding ₹{guest.dueAmount.toLocaleString('en-IN')} due at check-out</span>
                    <Link
                      href={`/hotel/checkout?bookingId=${guest.reservationId}`}
                      onClick={onClose}
                      className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white font-bold text-[10px] transition-colors"
                    >
                      Collect & Settle
                    </Link>
                  </div>
                )}
              </div>

              {/* Special Requests if any */}
              {guest.specialRequests && (
                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-start gap-2.5 text-xs">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">
                      Special Requests / Add-on Notes:
                    </span>
                    <p className="text-slate-300 mt-0.5">{guest.specialRequests}</p>
                  </div>
                </div>
              )}

              {/* Housekeeping & Room Info */}
              <div className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">Housekeeping:</span>
                  <span className="font-semibold text-white capitalize">
                    {room.housekeepingStatus?.toLowerCase() || 'Clean'}
                  </span>
                  {room.assignedStaffName && (
                    <span className="text-slate-400">
                      (Staff: {room.assignedStaffName})
                    </span>
                  )}
                </div>
                <div className="text-slate-400 text-[11px]">
                  Room ID: <span className="font-mono text-slate-300">{room.id.slice(0, 8)}...</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-slate-400">
              <p className="text-sm font-semibold">No active guest data found for this room.</p>
              <p className="text-xs text-slate-500 mt-1">This room may be marked occupied without a linked reservation.</p>
            </div>
          )}
        </div>

        {/* Modal Footer with Direct Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {guest?.reservationId && (
              <>
                <Link
                  href={`/hotel/checkout?bookingId=${guest.reservationId}`}
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-rose-600/20"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Check-Out / Settle Folio</span>
                </Link>

                <Link
                  href={`/hotel/bookings?search=${guest.bookingNo}`}
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                  <span>Manage Booking</span>
                </Link>

                <Link
                  href={`/hotel/pos?room=${room.roomNumber}`}
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" />
                  <span>Room Service / POS</span>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Back to Rooms
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

