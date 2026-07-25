'use client';

import React from 'react';
import {
  User,
  Phone,
  Bookmark,
  CalendarDays,
  BedDouble,
  IndianRupee,
  X,
  LogIn,
  LogOut,
  FileText,
  Tag,
  Users,
} from 'lucide-react';
import Link from 'next/link';

interface BookingDrawerProps {
  booking: any;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  },
  CHECKED_IN: {
    label: 'Checked In',
    className: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  },
  CHECKED_OUT: {
    label: 'Checked Out',
    className: 'bg-slate-700 text-slate-400 border border-slate-600',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  },
};

export default function BookingDrawer({ booking, onClose }: BookingDrawerProps) {
  const statusCfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG['PENDING'];

  const arrival = new Date(booking.arrivalDate);
  const departure = new Date(booking.departureDate);
  const nights = Math.max(
    1,
    Math.round((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24))
  );

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="rounded-3xl bg-[#0b1120] border border-slate-700/60 shadow-2xl shadow-black/40 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <Bookmark size={14} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Booking Details
            </p>
            <p className="text-sm font-black text-white">{booking.bookingNo}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Status Badge */}
        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusCfg.className}`}>
          {statusCfg.label}
        </span>

        {/* Guest Info */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Guest</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <User size={16} className="text-indigo-400" />
            </div>
            <div>
              <p className="font-black text-white">
                {booking.guest?.firstName} {booking.guest?.lastName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Phone size={10} className="text-slate-500" />
                <p className="text-xs text-slate-400">{booking.guest?.mobile || '—'}</p>
              </div>
            </div>
          </div>
          {(booking.adults || booking.children) && (
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 border-t border-slate-800">
              <Users size={12} />
              <span>
                {booking.adults || 0} Adults{booking.children ? `, ${booking.children} Children` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Stay Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <LogIn size={12} className="text-emerald-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Check-In</p>
            </div>
            <p className="font-black text-white text-sm">{fmtDate(arrival)}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <LogOut size={12} className="text-rose-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Check-Out</p>
            </div>
            <p className="font-black text-white text-sm">{fmtDate(departure)}</p>
          </div>
        </div>

        {/* Room & nights */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <BedDouble size={12} className="text-sky-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Room Type</p>
            </div>
            <p className="font-black text-white text-sm">{booking.roomType?.name || '—'}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarDays size={12} className="text-purple-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nights</p>
            </div>
            <p className="font-black text-white text-sm">{nights} Night{nights !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Assigned Room */}
        {booking.rooms && booking.rooms.length > 0 && (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={12} className="text-indigo-400" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Assigned Room(s)</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {booking.rooms.map((br: any) => (
                <span
                  key={br.id}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-black"
                >
                  Room {br.room?.roomNumber || br.roomId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Financial Summary */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <IndianRupee size={12} className="text-amber-400" />
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Financials</p>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Total Amount</span>
            <span className="font-black text-white">₹{(booking.totalAmount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Advance Paid</span>
            <span className="font-black text-emerald-400">₹{(booking.advanceAmount || 0).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2">
            <span className="text-slate-400">Balance Due</span>
            <span className={`font-black ${(booking.dueAmount || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{(booking.dueAmount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          {booking.status === 'CONFIRMED' && (
            <Link
              href={`/hotel/checkin?resId=${booking.id}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-colors"
            >
              <LogIn size={13} /> Check In
            </Link>
          )}
          {booking.status === 'CHECKED_IN' && (
            <Link
              href={`/hotel/checkout?resId=${booking.id}`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-colors"
            >
              <LogOut size={13} /> Check Out
            </Link>
          )}
          <Link
            href={`/hotel/billing?resId=${booking.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-black text-xs transition-colors"
          >
            <FileText size={13} /> View Folio
          </Link>
        </div>
      </div>
    </div>
  );
}
