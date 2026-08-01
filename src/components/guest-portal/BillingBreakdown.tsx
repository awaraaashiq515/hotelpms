import React from 'react';
import { Reservation } from './types';

interface BillingBreakdownProps {
  reservation: Reservation;
}

export default function BillingBreakdown({ reservation }: BillingBreakdownProps) {
  const nights = Math.max(1, Math.round(
    (new Date(reservation.departureDate).getTime() - new Date(reservation.arrivalDate).getTime()) / 86400000
  ));
  const room = reservation.rooms?.[0]?.room;
  const baseRate = room?.customRate || reservation.roomType.baseRate;
  const discPct = room?.discount || 0;
  const gstPct = room?.gstRate || 0;
  const rawRent = baseRate * nights;
  const discAmt = Math.round(rawRent * discPct / 100);
  const afterDisc = rawRent - discAmt;
  const gstAmt = Math.round(afterDisc * gstPct / 100);
  const total = afterDisc + gstAmt;

  return (
    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 space-y-2 text-xs">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Billing Breakdown</p>
      <div className="flex justify-between text-slate-400"><span>Room Rent ({nights}N × ₹{baseRate})</span><span className="font-bold text-slate-300">₹{rawRent.toLocaleString()}</span></div>
      {discAmt > 0 && <div className="flex justify-between text-rose-400"><span>Discount ({discPct}%)</span><span className="font-bold">-₹{discAmt.toLocaleString()}</span></div>}
      <div className="flex justify-between text-indigo-400"><span>GST ({gstPct}%)</span><span className="font-bold">+₹{gstAmt.toLocaleString()}</span></div>
      <div className="h-px bg-slate-800/60" />
      <div className="flex justify-between font-bold text-slate-300"><span>Estimated Total</span><span>₹{total.toLocaleString()}</span></div>
      <div className="h-px bg-slate-800/60" />
      <div className="flex justify-between text-emerald-400"><span>Advance Paid</span><span className="font-bold">₹{reservation.advanceAmount.toLocaleString()}</span></div>
      <div className="flex justify-between font-extrabold text-sm">
        <span className="text-white">Balance Due</span>
        <span className={reservation.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}>₹{reservation.dueAmount.toLocaleString()}</span>
      </div>
    </div>
  );
}
