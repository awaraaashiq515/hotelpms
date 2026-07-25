'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, Bed, Phone, Clock, Receipt, ArrowRight, CreditCard, CheckCircle2,
} from 'lucide-react';

interface CheckInRecord {
  id: string;
  folioId?: string;
  checkedInAt: string;
  expectedCheckoutAt: string;
  status: string;
  guest?: { id: string; firstName: string; lastName?: string; mobile?: string };
  room?: { roomNumber: string; floor?: string; roomType?: { name: string } };
  reservation?: {
    id: string;
    bookingNo: string;
    totalAmount: number;
    advanceAmount: number;
    dueAmount: number;
    arrivalDate: string;
    departureDate: string;
  };
}

function isOverdue(expectedDate: string) {
  return new Date(expectedDate) < new Date();
}

function nightsCount(arrival: string, departure: string) {
  const a = new Date(arrival);
  const d = new Date(departure);
  return Math.max(1, Math.round((d.getTime() - a.getTime()) / 86400000));
}

interface Props {
  checkIn: CheckInRecord;
}

export function CheckoutGuestCard({ checkIn: ci }: Props) {
  const router = useRouter();
  const overdue = isOverdue(ci.expectedCheckoutAt);
  const nights = ci.reservation
    ? nightsCount(ci.reservation.arrivalDate, ci.reservation.departureDate)
    : 0;
  const dueAmount = ci.reservation?.dueAmount ?? 0;
  const initials = (ci.guest?.firstName || 'G')[0].toUpperCase();
  // Navigate with folioId as query param — detail page fetches directly by folioId
  const href = ci.folioId
    ? `/hotel/checkout/${ci.id}?folioId=${ci.folioId}`
    : `/hotel/checkout/${ci.id}`;

  return (
    <div
      className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 ${
        overdue
          ? 'bg-red-950/20 border-red-500/25 hover:border-red-500/50 hover:shadow-red-900/20'
          : 'bg-slate-900/60 border-slate-800/60 hover:border-orange-500/40 hover:shadow-orange-900/10'
      }`}
      onClick={() => router.push(href)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${
              overdue ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/15 text-orange-400'
            }`}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-black text-white">
              {ci.guest?.firstName} {ci.guest?.lastName}
            </p>
            {ci.guest?.mobile && (
              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Phone size={8} /> {ci.guest.mobile}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          {overdue && (
            <span className="flex items-center gap-1 text-[9px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20 mb-1">
              <AlertTriangle size={8} /> OVERDUE
            </span>
          )}
          <span className="text-[10px] text-slate-500 font-bold">
            #{ci.reservation?.bookingNo}
          </span>
        </div>
      </div>

      {/* Room + Nights + Due */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30 text-center">
          <p className="text-base font-black text-white">{ci.room?.roomNumber}</p>
          <p className="text-[9px] text-slate-600 font-bold">
            {ci.room?.floor ? `Floor ${ci.room.floor}` : 'Room'}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30 text-center">
          <p className="text-base font-black text-white">{nights}</p>
          <p className="text-[9px] text-slate-600 font-bold">Nights</p>
        </div>
        <div
          className={`p-2.5 rounded-xl text-center border ${
            dueAmount > 0
              ? 'bg-red-950/30 border-red-500/20'
              : 'bg-emerald-950/20 border-emerald-500/15'
          }`}
        >
          <p
            className={`text-base font-black ${
              dueAmount > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            ₹{dueAmount.toLocaleString()}
          </p>
          <p className="text-[9px] text-slate-600 font-bold">Due</p>
        </div>
      </div>

      {/* Room type + expected checkout time */}
      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold mb-4">
        <Bed size={10} /> {ci.room?.roomType?.name || 'Room'}
        <span className="mx-1">·</span>
        <Clock size={10} />
        Expected:{' '}
        {new Date(ci.expectedCheckoutAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </div>

      {/* CTA */}
      <div
        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg ${
          dueAmount > 0
            ? 'bg-red-600/80 hover:bg-red-600 shadow-red-900/30'
            : 'bg-orange-600/80 hover:bg-orange-600 shadow-orange-900/30'
        }`}
      >
        {dueAmount > 0 ? <CreditCard size={12} /> : <CheckCircle2 size={12} />}
        {dueAmount > 0 ? 'Settle & Checkout' : 'Express Checkout'}
        <ArrowRight size={12} className="ml-auto opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}
