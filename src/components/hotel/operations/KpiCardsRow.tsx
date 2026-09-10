'use client';

import React from 'react';

export interface KpiStats {
  arrivals: number;
  departures: number;
  unitsBooked: number;
  occupancyPercent: number;
  averageDailyRate: number;
  currency: string;
}

interface KpiCardsRowProps {
  stats: KpiStats;
}

export function KpiCardsRow({ stats }: KpiCardsRowProps) {
  const currencySymbol = stats.currency || '₹';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Number of Arrivals */}
      <div className="bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-cyan-500/20 shadow-xl flex items-center gap-4 transition-all hover:border-cyan-500/40 hover:shadow-cyan-500/5">
        <div className="w-13 h-13 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </div>
        <div>
          <span className="text-[13px] font-medium text-slate-400 block leading-tight">
            Number of Arrivals
          </span>
          <span className="text-2xl sm:text-[28px] font-bold text-white block mt-1 tracking-tight leading-none">
            {stats.arrivals}
          </span>
        </div>
      </div>

      {/* 2. Number of Departures */}
      <div className="bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-rose-500/20 shadow-xl flex items-center gap-4 transition-all hover:border-rose-500/40 hover:shadow-rose-500/5">
        <div className="w-13 h-13 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>
        <div>
          <span className="text-[13px] font-medium text-slate-400 block leading-tight">
            Number of Departures
          </span>
          <span className="text-2xl sm:text-[28px] font-bold text-white block mt-1 tracking-tight leading-none">
            {stats.departures}
          </span>
        </div>
      </div>

      {/* 3. Unit Booked */}
      <div className="bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-violet-500/20 shadow-xl flex items-center gap-4 transition-all hover:border-violet-500/40 hover:shadow-violet-500/5">
        <div className="w-13 h-13 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
            <path d="M2 20h20" />
            <circle cx="14" cy="12" r="1" fill="currentColor" />
          </svg>
        </div>
        <div className="w-full">
          <span className="text-[13px] font-medium text-slate-400 block leading-tight">
            Unit Booked
          </span>
          <div className="flex items-center gap-2.5 mt-1">
            <span className="text-2xl sm:text-[28px] font-bold text-white tracking-tight leading-none">
              {stats.unitsBooked}
            </span>
            <span className="text-[11px] font-semibold bg-violet-500/15 text-violet-300 px-2.5 py-0.5 rounded-md border border-violet-500/30">
              {stats.occupancyPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 4. Average Daily Rate */}
      <div className="bg-[#0f172a] rounded-2xl p-4 sm:p-5 border border-amber-500/20 shadow-xl flex items-center gap-4 transition-all hover:border-amber-500/40 hover:shadow-amber-500/5">
        <div className="w-13 h-13 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
          <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v10" />
            <path d="M14.5 9.5a2.5 2.5 0 0 0-5 0c0 2.5 5 1.5 5 4a2.5 2.5 0 0 1-5 0" />
          </svg>
        </div>
        <div>
          <span className="text-[13px] font-medium text-slate-400 block leading-tight">
            Average Daily Rate
          </span>
          <span className="text-2xl sm:text-[26px] font-bold text-white block mt-1 tracking-tight leading-none">
            {currencySymbol} {stats.averageDailyRate.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}
