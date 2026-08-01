import React, { useState } from 'react';
import { ReceiptText, UtensilsCrossed, Waves, Sparkles, BedDouble } from 'lucide-react';
import { GuestData, Reservation } from './types';

interface BillingTabProps {
  guest: GuestData;
  token: string;
}

export default function BillingTab({ guest, token }: BillingTabProps) {
  const [selectedResId, setSelectedResId] = useState<string>(
    guest.reservations.find(r => r.status === 'CHECKED_IN')?.id || guest.reservations[0]?.id || ''
  );

  const reservation = guest.reservations.find(r => r.id === selectedResId);

  if (!reservation) {
    return (
      <div className="text-center py-20 text-slate-500 bg-[#0a0f1e]/40 border border-slate-800/60 rounded-3xl">
        <ReceiptText size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-bold">No active bill found.</p>
      </div>
    );
  }

  const room = reservation.rooms?.[0]?.room;
  const folio = reservation.folios?.[0];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Stay Selector */}
      {guest.reservations.length > 1 && (
        <div className="flex items-center justify-between bg-[#0a0f1e]/40 border border-slate-800/60 p-4 rounded-2xl">
          <span className="text-xs font-bold text-slate-400">Select Stay:</span>
          <select
            value={selectedResId}
            onChange={(e) => setSelectedResId(e.target.value)}
            className="bg-[#0f172a] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none"
          >
            {guest.reservations.map(r => (
              <option key={r.id} value={r.id}>
                {r.bookingNo} ({r.status === 'CHECKED_IN' ? 'Active' : 'Past'})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Main Folio Invoice Card */}
      <div className="bg-[#0a0f1e]/40 border border-slate-850 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 bg-gradient-to-r from-indigo-950/20 to-slate-900/10 border-b border-slate-850 flex flex-col md:flex-row justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Guest Folio</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase">{reservation.status}</span>
            </div>
            <h3 className="text-lg font-black text-white">{reservation.bookingNo}</h3>
            <p className="text-xs text-slate-400">Room: <span className="font-bold text-white">{room?.roomNumber || 'TBA'}</span> ({reservation.roomType.name})</p>
          </div>
          <div className="md:text-right text-xs text-slate-400 space-y-1">
            <p>Guest: <span className="font-bold text-white">{guest.firstName} {guest.lastName || ''}</span></p>
            <p>Check-In: <span className="font-bold text-slate-300">{new Date(reservation.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></p>
            <p>Check-Out: <span className="font-bold text-slate-300">{new Date(reservation.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-3 border-b border-slate-850 bg-[#0a0f1e]/20 text-center">
          <div className="py-4 border-r border-slate-850 space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total Charges</p>
            <p className="text-base font-black text-white">₹{folio?.totalCharges?.toLocaleString('en-IN') || reservation.totalAmount?.toLocaleString('en-IN') || 0}</p>
          </div>
          <div className="py-4 border-r border-slate-850 space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total Payments</p>
            <p className="text-base font-black text-emerald-400">₹{folio?.totalPayments?.toLocaleString('en-IN') || reservation.advanceAmount?.toLocaleString('en-IN') || 0}</p>
          </div>
          <div className="py-4 space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Balance Due</p>
            <p className={`text-base font-black ${(folio?.closingBalance ?? reservation.dueAmount) > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              ₹{(folio?.closingBalance ?? reservation.dueAmount)?.toLocaleString('en-IN') || 0}
            </p>
          </div>
        </div>

        {/* Included Add-on Charges & Breakdown Ledger */}
        {((reservation.poolPassCost || 0) > 0 || (reservation.spaPackageCost || 0) > 0 || reservation.mealPlan) && (
          <div className="mx-6 my-4 p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 space-y-3">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Included Services & Add-on Ledger</h5>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5"><BedDouble size={12} className="text-slate-400" /> Room Rent ({reservation.roomType.name})</span>
                <span className="font-bold">₹{(reservation.totalAmount - (reservation.poolPassCost || 0) - (reservation.spaPackageCost || 0)).toLocaleString()}</span>
              </div>
              {(reservation.poolPassCost || 0) > 0 && (
                <div className="flex justify-between items-center text-cyan-300">
                  <span className="flex items-center gap-1.5"><Waves size={12} className="text-cyan-400" /> {reservation.poolPackage || 'Swimming Pool Pass'}</span>
                  <span className="font-bold">+ ₹{reservation.poolPassCost?.toLocaleString()}</span>
                </div>
              )}
              {(reservation.spaPackageCost || 0) > 0 && (
                <div className="flex justify-between items-center text-pink-300">
                  <span className="flex items-center gap-1.5"><Sparkles size={12} className="text-pink-400" /> {reservation.spaPackage}</span>
                  <span className="font-bold">+ ₹{reservation.spaPackageCost?.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-6 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <ReceiptText size={14} className="text-indigo-400" /> Account Statement
          </h4>

          {!folio || folio.transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs italic bg-slate-950/30 rounded-2xl border border-slate-850">
              No transactions posted yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/50 text-slate-400 border-b border-slate-800/80 font-bold">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Debit (Charges)</th>
                    <th className="px-4 py-3 text-right">Credit (Payments)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {folio.transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-900/20 text-slate-300">
                      <td className="px-4 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                        {new Date(txn.txnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="px-4 py-3.5 font-bold">
                        <div className="flex items-center gap-2">
                          <span>{txn.description}</span>
                          {txn.sourceModule === 'POS' && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 font-bold uppercase border border-amber-500/20">F&B</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-200">
                        {txn.debitAmount > 0 ? `₹${txn.debitAmount.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-emerald-400">
                        {txn.creditAmount > 0 ? `₹${txn.creditAmount.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Itemized Restaurant/Cafe Orders Section */}
      {folio && folio.posOrders && folio.posOrders.length > 0 && (
        <div className="bg-[#0a0f1e]/40 border border-slate-850 rounded-3xl p-6 space-y-4 shadow-2xl">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <UtensilsCrossed size={14} className="text-amber-400" /> Restaurant & Cafe Orders (Itemized)
          </h4>
          <div className="space-y-4">
            {folio.posOrders.map((order) => (
              <div key={order.id} className="p-4 rounded-2xl bg-slate-900/20 border border-slate-800/80 space-y-3 animate-in fade-in duration-300">
                <div className="flex items-start justify-between border-b border-slate-800/50 pb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-amber-400">{order.outlet?.name || 'Restaurant'}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-850 text-slate-400 font-bold uppercase">Order #{order.orderNo}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <p className="text-sm font-black text-amber-400">₹{order.grandTotal.toFixed(2)}</p>
                </div>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-black">{item.quantity} ×</span>
                        <span className="font-bold">
                          {item.product?.name}
                          {item.variantName ? ` (${item.variantName})` : ''}
                        </span>
                      </div>
                      <span className="font-semibold text-slate-400">₹{item.totalAmount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
