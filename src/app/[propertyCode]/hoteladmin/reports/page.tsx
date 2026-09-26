'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart2, RefreshCw, ArrowLeft, Calendar, FileSpreadsheet,
  Download, BedDouble, UtensilsCrossed, Users, IndianRupee
} from 'lucide-react';

export default function HotelAdminReportsPage() {
  const params = useParams();
  const propertyCode = (params?.propertyCode as string) || '';

  const [dateRange, setDateRange] = useState('TODAY');
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${propertyCode}/hoteladmin`}
              className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart2 className="text-amber-500" size={26} />
            Daily Business & Audit Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Managerial operational audit, occupancy tracking, and daily night audit reports
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          {['TODAY', 'YESTERDAY', '7DAYS', 'MONTH'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                dateRange === range
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {range === 'TODAY'
                ? 'Today'
                : range === 'YESTERDAY'
                ? 'Yesterday'
                : range === '7DAYS'
                ? 'Last 7 Days'
                : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Audit Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="text-amber-500" size={18} />
          Executive Business Summary ({dateRange})
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Room Revenue</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">₹38,500</p>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">14 rooms booked</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-[10px] font-bold text-slate-500 uppercase">F&B / Restaurant</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">₹14,200</p>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">28 orders served</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Average Occupancy</p>
            <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1">72%</p>
            <p className="text-[10px] text-slate-400 mt-1">20 of 28 rooms</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Total Settled</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹52,700</p>
            <p className="text-[10px] text-slate-400 mt-1">100% collected</p>
          </div>
        </div>
      </div>
    </div>
  );
}
