'use client';

import React, { useState } from 'react';
import {
  Key, Clock, CheckCircle2, Phone, User, Calendar, IndianRupee,
  ShieldCheck, AlertTriangle, ArrowRight, ShieldAlert, Sparkles, RefreshCw
} from 'lucide-react';
import { BookingItem } from './types';

interface ActiveRentalsTabProps {
  bookings: BookingItem[];
  loading: boolean;
  onStartReturn: (booking: BookingItem) => void;
}

export const ActiveRentalsTab: React.FC<ActiveRentalsTabProps> = ({
  bookings,
  loading,
  onStartReturn,
}) => {
  const [filter, setFilter] = useState<'ACTIVE' | 'RETURNED' | 'ALL'>('ACTIVE');

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'ACTIVE') return b.status === 'CONFIRMED' || b.status === 'ACTIVE' || b.status === 'PENDING';
    if (filter === 'RETURNED') return b.status === 'RETURNED';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white flex items-center gap-2">
            <Key size={18} className="text-rose-400" />
            <span>Active Rentals & Returns ({bookings.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor on-road two-wheelers, check return dates & settle deposits
          </p>
        </div>

        <div className="flex bg-[#0b1120] border border-slate-800 rounded-2xl p-1 text-xs">
          {(['ACTIVE', 'RETURNED', 'ALL'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                filter === mode
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {mode === 'ACTIVE' ? 'Active Rentals' : mode === 'RETURNED' ? 'Completed Returns' : 'All History'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-[#0b1120]/40 space-y-2">
          <Key size={40} className="mx-auto text-slate-700" />
          <p className="text-sm font-black text-slate-300">No Rental Bookings Found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {filter === 'ACTIVE'
              ? 'No bikes are currently out on rent. Use "Rent Out Bike" to issue a vehicle.'
              : 'No past booking records available.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((b) => {
            const isConfirmed = b.status === 'CONFIRMED' || b.status === 'ACTIVE';
            const isReturned = b.status === 'RETURNED';

            const today = new Date().toISOString().split('T')[0];
            const isOverdue = isConfirmed && b.endDate < today;

            return (
              <div
                key={b.id}
                className={`p-5 rounded-3xl bg-[#0b1120] border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                  isOverdue
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : 'border-slate-800/90 hover:border-slate-700'
                }`}
              >
                {/* Customer & Bike Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-white">{b.guestName}</span>
                    <a
                      href={`tel:${b.guestPhone}`}
                      className="text-xs text-slate-400 hover:text-white font-mono flex items-center gap-1"
                    >
                      <Phone size={11} className="text-slate-500" />
                      {b.guestPhone}
                    </a>

                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        isConfirmed
                          ? isOverdue
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isReturned
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {isOverdue ? 'OVERDUE' : b.status}
                    </span>

                    {b.licenseNumber && (
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                        DL: {b.licenseNumber}
                      </span>
                    )}
                  </div>

                  {/* Bike Model & Registration Plate */}
                  <div className="flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span className="text-rose-400 font-mono tracking-wider bg-rose-950/40 border border-rose-500/20 px-2 py-0.5 rounded-lg text-[11px]">
                        {b.bike?.plateNumber || 'No Plate'}
                      </span>
                      <span>{b.bike?.model || 'Rental Bike'}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Calendar size={13} className="text-slate-500" />
                      <span>{b.startDate} to {b.endDate}</span>
                    </div>
                  </div>

                  {/* Security Deposit Badge */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500">Security Deposit:</span>
                    <span className="font-bold text-amber-400">₹{b.securityDeposit.toLocaleString('en-IN')}</span>
                    <span className="text-slate-600">•</span>
                    <span className={`text-[10px] font-semibold ${b.depositRefunded ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {b.depositRefunded ? '✓ Deposit Refunded' : 'Deposit Retained'}
                    </span>
                  </div>
                </div>

                {/* Amount & Return Action */}
                <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <div className="text-left md:text-right">
                    <p className="text-base font-black text-white">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Total Rental</p>
                  </div>

                  {isConfirmed && (
                    <button
                      onClick={() => onStartReturn(b)}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 size={13} />
                      <span>Return & Inspect</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
