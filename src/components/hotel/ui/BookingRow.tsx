import React from 'react';
import Link from 'next/link';
import { BedDouble } from 'lucide-react';
import type { Booking } from '@/types/hotel/dashboard.types';

interface BookingRowProps {
  booking: Booking;
  type: 'checkin' | 'checkout' | 'pending' | 'inhouse';
}

function fmtCurrency(n?: number) {
  if (n == null) return null;
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

const CONFIG = {
  checkin:  { href: (id: string) => `/hotel/checkin?resId=${id}`,  label: 'Check In',  color: 'bg-sky-500/20 text-sky-300 hover:bg-sky-500/30' },
  checkout: { href: (id: string) => `/hotel/checkout?resId=${id}`, label: 'Check Out', color: 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' },
  pending:  { href: (id: string) => `/hotel/billing?resId=${id}`,  label: 'Pay Now',   color: 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30' },
  inhouse:  { href: (id: string) => `/hotel/billing?resId=${id}`,  label: 'Folio',     color: 'bg-slate-700 text-slate-300 hover:bg-slate-600' },
};

export function BookingRow({ booking, type }: BookingRowProps) {
  const roomNo  = booking.rooms?.[0]?.room?.roomNumber;
  const cfg     = CONFIG[type];
  const dueAmt  = booking.dueAmount;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
        <BedDouble size={11} className="text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-black text-white truncate">
          {booking.guest?.firstName} {booking.guest?.lastName}
        </p>
        <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
          {booking.bookingNo}
          {roomNo ? ` · Rm ${roomNo}` : ''}
          {dueAmt && dueAmt > 0 ? ` · Due: ${fmtCurrency(dueAmt)}` : ''}
        </p>
      </div>
      <Link href={cfg.href(booking.id)}
        className={`shrink-0 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg transition-colors ${cfg.color}`}>
        {cfg.label}
      </Link>
    </div>
  );
}
