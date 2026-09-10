'use client';

import React, { useState } from 'react';
import { X, LogIn, LogOut, Printer, FileText, Check, Loader2, User, Calendar, Bed, CreditCard, Shield } from 'lucide-react';

interface ReservationDetailDrawerProps {
  booking: any | null;
  currency?: string;
  onClose: () => void;
  onCheckIn?: (b: any) => void;
  onCheckOut?: (b: any) => void;
  onPrint?: (b: any) => void;
  onUpdated?: () => void;
}

export function ReservationDetailDrawer({
  booking,
  currency = '₹',
  onClose,
  onCheckIn,
  onCheckOut,
  onPrint,
  onUpdated,
}: ReservationDetailDrawerProps) {
  const [notes, setNotes] = useState(booking?.addOnNotes || booking?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  React.useEffect(() => {
    if (booking) {
      setNotes(booking?.addOnNotes || booking?.notes || '');
    }
  }, [booking]);

  if (!booking) return null;

  const guestName = booking.guest
    ? `${booking.guest.firstName || ''} ${booking.guest.lastName || ''}`.trim() || booking.guest.name || 'Guest'
    : booking.guestName || 'Guest';

  const roomNo = booking.rooms?.[0]?.room?.roomNumber || booking.unitNumber || booking.assignedRoomId || 'Unassigned';
  const roomTypeName = booking.roomType?.name || booking.roomTypeName || 'Standard';

  const arrDateStr = booking.arrivalDate
    ? new Date(booking.arrivalDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';
  const depDateStr = booking.departureDate
    ? new Date(booking.departureDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: booking.id,
          addOnNotes: notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdated?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CHECKED_IN':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'CONFIRMED':
        return 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      case 'PENDING':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'CHECKED_OUT':
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-[#0f172a] sm:h-full max-w-md w-full p-6 shadow-2xl border-l border-slate-800 text-white relative flex flex-col justify-between overflow-y-auto">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-md border ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
              <span className="text-xs font-mono font-bold text-slate-400">
                {booking.bookingNo || booking.reservationNumber}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Guest Card */}
          <div className="p-4 rounded-xl bg-[#1e293b]/50 border border-slate-800 my-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-base">
                {guestName.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{guestName}</h3>
                <span className="text-xs text-slate-400">
                  {booking.guest?.mobile || booking.guestMobile || 'No contact provided'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-500 block font-semibold text-[10px] uppercase">Assigned Room</span>
                <span className="font-bold text-white">Room {roomNo}</span>
                <span className="text-[10px] text-slate-400 block">{roomTypeName}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold text-[10px] uppercase">Booking Source</span>
                <span className="font-bold text-slate-200">{booking.companyName || 'Direct Front Desk'}</span>
              </div>
            </div>
          </div>

          {/* Stay Timeline Details */}
          <div className="p-4 rounded-xl bg-[#1e293b]/40 border border-slate-800 space-y-2.5 text-xs mb-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Check-In:</span>
              <strong className="text-white">{arrDateStr}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Check-Out:</span>
              <strong className="text-white">{depDateStr}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Total Charges:</span>
              <strong className="text-white">{currency} {(booking.totalAmount || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Advance Paid:</span>
              <strong className="text-emerald-400">{currency} {(booking.advanceAmount || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-800">
              <span className="text-slate-300 font-semibold">Balance Due:</span>
              <strong className="text-rose-400 text-sm">{currency} {(booking.dueAmount || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Notes Input */}
          <div className="space-y-1.5 mb-4">
            <label className="block text-[11px] font-semibold text-slate-300">
              Guest Notes & Special Requests
            </label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add special notes, late checkout, dietary preferences..."
                className="w-full bg-[#1e293b]/60 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00b894] placeholder:text-slate-500"
              ></textarea>
            </div>
            <button
              onClick={handleSaveNotes}
              disabled={savingNotes}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
            >
              {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-[#00b894]" />}
              Update Note
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          {booking.status !== 'CHECKED_IN' && booking.status !== 'CHECKED_OUT' && booking.status !== 'CANCELLED' && (
            <button
              onClick={() => onCheckIn?.(booking)}
              className="w-full py-2.5 bg-[#00b894] hover:bg-[#00a884] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#00b894]/20 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Check In Guest
            </button>
          )}

          {booking.status === 'CHECKED_IN' && (
            <button
              onClick={() => onCheckOut?.(booking)}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Check Out Guest
            </button>
          )}

          <button
            onClick={() => onPrint?.(booking)}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            Print Registration Card (GRC)
          </button>
        </div>
      </div>
    </div>
  );
}
