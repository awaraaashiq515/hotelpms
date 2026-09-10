'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  ClipboardCheck,
  Moon,
  Wallet,
  ArrowUpDown
} from 'lucide-react';

export interface ActivityItem {
  id: string;
  guestName: string;
  revenue: number;
  currency: string;
  checkInDate: string;
  nights: number;
  source: string;
  type: 'Sales' | 'Cancellation' | 'Overbookings';
}

interface ActivityData {
  sales: ActivityItem[];
  cancellations: ActivityItem[];
  bookedTodayCount: number;
  unitNights: number;
  todayRevenue: number;
}

interface TodayActivityWidgetProps {
  activityData: ActivityData;
  currency?: string;
  onRefresh?: () => void;
  onRowClick?: (item: ActivityItem) => void;
}

export function TodayActivityWidget({
  activityData,
  currency = '₹',
  onRefresh,
  onRowClick,
}: TodayActivityWidgetProps) {
  const [activeTab, setActiveTab] = useState<'Sales' | 'Cancellation' | 'Overbookings'>('Sales');
  const [sortField, setSortField] = useState<keyof ActivityItem>('guestName');
  const [sortAsc, setSortAsc] = useState(true);

  const rawItems = activeTab === 'Sales' ? activityData.sales : activeTab === 'Cancellation' ? activityData.cancellations : [];

  const filteredItems = [...rawItems].sort((a, b) => {
    const valA = a[sortField] ?? '';
    const valB = b[sortField] ?? '';
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof ActivityItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getSourceBadgeStyle = (source: string) => {
    const s = source?.toLowerCase() || '';
    if (s.includes('traveloka')) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    if (s.includes('hotels.com')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (s.includes('expedia')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (s.includes('booking.com')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (s.includes('agoda')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    return 'text-slate-300 bg-slate-800 border-slate-700';
  };

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-xl p-5 w-full flex flex-col justify-between">
      {/* ── Top Header Row ── */}
      <div>
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Today&apos;s Activity
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Refresh
            </button>
            <button
              onClick={onRefresh}
              title="Refresh"
              className="w-8 h-8 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/60 flex items-center justify-center text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex items-center gap-1.5 py-2 border-b border-slate-800/80">
          {(['Sales', 'Cancellation', 'Overbookings'] as const).map((tab) => {
            const isActive = activeTab === tab;
            let count = 0;
            if (tab === 'Sales') count = activityData.sales?.length || 0;
            if (tab === 'Cancellation') count = activityData.cancellations?.length || 0;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-xs border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>{tab}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 3 Mini Metric Cards ── */}
        <div className="grid grid-cols-3 gap-3 py-3.5">
          {/* 1. Booked Today */}
          <div className="bg-[#1e293b]/40 rounded-xl p-3 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                Booked Today
              </span>
              <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white mt-1">
              {activityData.bookedTodayCount}
            </span>
          </div>

          {/* 2. Unit Night */}
          <div className="bg-[#1e293b]/40 rounded-xl p-3 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                Unit Night
              </span>
              <Moon className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white mt-1">
              {activityData.unitNights}
            </span>
          </div>

          {/* 3. Revenue */}
          <div className="bg-[#1e293b]/40 rounded-xl p-3 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400">
                Revenue
              </span>
              <Wallet className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <span className="text-base sm:text-lg font-bold text-emerald-400 mt-1 whitespace-nowrap">
              {currency} {activityData.todayRevenue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* ── Data Table ── */}
        <div className="overflow-x-auto mt-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[12px] font-medium text-slate-400">
                <th className="py-2.5 px-2 font-semibold">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-white"
                    onClick={() => handleSort('guestName')}
                  >
                    Guest Name <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-2 font-semibold">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-white"
                    onClick={() => handleSort('revenue')}
                  >
                    Revenue <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-2 font-semibold">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-white"
                    onClick={() => handleSort('checkInDate')}
                  >
                    Check-In <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-2 font-semibold">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-white"
                    onClick={() => handleSort('nights')}
                  >
                    Night <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-2.5 px-2 font-semibold">
                  <div
                    className="flex items-center gap-1 cursor-pointer hover:text-white"
                    onClick={() => handleSort('source')}
                  >
                    Reserva... Source <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-[13px]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                    No activity logs found for {activeTab}.
                  </td>
                </tr>
              ) : (
                filteredItems.map((act) => (
                  <tr
                    key={act.id}
                    onClick={() => onRowClick?.(act)}
                    className="group hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    {/* Guest Name & icon */}
                    <td className="py-3 px-2 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-500 group-hover:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        <span className="truncate max-w-[130px] sm:max-w-none text-slate-200">
                          {act.guestName}
                        </span>
                      </div>
                    </td>

                    {/* Revenue */}
                    <td className="py-3 px-2 font-semibold text-emerald-400 whitespace-nowrap">
                      {currency} {act.revenue.toLocaleString('en-IN')}
                    </td>

                    {/* Check-In */}
                    <td className="py-3 px-2 text-slate-400 whitespace-nowrap text-[12px]">
                      {act.checkInDate}
                    </td>

                    {/* Night */}
                    <td className="py-3 px-2 font-medium text-slate-300">
                      {act.nights}
                    </td>

                    {/* Source */}
                    <td className="py-3 px-2 whitespace-nowrap">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getSourceBadgeStyle(act.source)}`}>
                        {act.source}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
