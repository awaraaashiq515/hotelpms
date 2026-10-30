'use client';

import React from 'react';
import { Bike, Key, Clock, IndianRupee, MessageSquareQuote, CheckCircle2 } from 'lucide-react';
import { BikeItem, BookingItem, EnquiryItem } from './types';

interface KpiMetricsCardsProps {
  bikes: BikeItem[];
  bookings: BookingItem[];
  enquiries: EnquiryItem[];
}

export const KpiMetricsCards: React.FC<KpiMetricsCardsProps> = ({
  bikes,
  bookings,
  enquiries,
}) => {
  const totalFleet = bikes.length;
  const availableBikes = bikes.filter((b) => b.status === 'AVAILABLE').length;
  const onRentBikes = bikes.filter((b) => b.status === 'ON_RENT').length;
  const maintenanceBikes = bikes.filter((b) => b.status === 'MAINTENANCE').length;

  const pendingEnquiries = enquiries.filter(
    (e) => e.status === 'NEW' || e.status === 'PENDING'
  ).length;

  // Total earnings from confirmed/returned rentals
  const totalRevenue = bookings
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* 1. Total Fleet */}
      <div className="p-4 rounded-2xl bg-[#0b1120] border border-slate-800/80 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Fleet</span>
          <Bike size={16} className="text-slate-400 group-hover:text-white transition-colors" />
        </div>
        <p className="text-2xl font-black text-white mt-1.5">{totalFleet}</p>
        <p className="text-[10px] text-slate-500 mt-1">
          {maintenanceBikes > 0 ? `${maintenanceBikes} in maintenance` : 'All road-ready'}
        </p>
      </div>

      {/* 2. Available Bikes */}
      <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="flex items-center justify-between text-emerald-400">
          <span className="text-[10px] font-black uppercase tracking-wider">Available</span>
          <CheckCircle2 size={16} className="text-emerald-400" />
        </div>
        <p className="text-2xl font-black text-emerald-400 mt-1.5">{availableBikes}</p>
        <p className="text-[10px] text-emerald-500/80 mt-1">Ready for instant dispatch</p>
      </div>

      {/* 3. On Rent */}
      <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/25 shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition-all">
        <div className="flex items-center justify-between text-rose-400">
          <span className="text-[10px] font-black uppercase tracking-wider">On Rent</span>
          <Key size={16} className="text-rose-400" />
        </div>
        <p className="text-2xl font-black text-rose-400 mt-1.5">{onRentBikes}</p>
        <p className="text-[10px] text-rose-500/80 mt-1">Currently on the road</p>
      </div>

      {/* 4. Enquiries & Requests */}
      <div className="p-4 rounded-2xl bg-sky-950/20 border border-sky-500/25 shadow-sm relative overflow-hidden group hover:border-sky-500/40 transition-all">
        <div className="flex items-center justify-between text-sky-400">
          <span className="text-[10px] font-black uppercase tracking-wider">New Enquiries</span>
          <MessageSquareQuote size={16} className="text-sky-400" />
        </div>
        <p className="text-2xl font-black text-sky-400 mt-1.5">{pendingEnquiries}</p>
        <p className="text-[10px] text-sky-500/80 mt-1">From agents & guests</p>
      </div>

      {/* 5. Revenue */}
      <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/25 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-amber-400">
          <span className="text-[10px] font-black uppercase tracking-wider">Rental Revenue</span>
          <IndianRupee size={16} className="text-amber-400" />
        </div>
        <p className="text-2xl font-black text-white mt-1.5">
          ₹{totalRevenue.toLocaleString('en-IN')}
        </p>
        <p className="text-[10px] text-amber-500/80 mt-1">Total booking value</p>
      </div>
    </div>
  );
};
