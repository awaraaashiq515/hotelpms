'use client';

import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

type FilterType = 'all' | 'today' | 'overdue';

interface Props {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
  search: string;
  onSearchChange: (s: string) => void;
  counts: { all: number; today: number; overdue: number };
  onRefresh: () => void;
  loading: boolean;
}

export function CheckoutFilters({
  filter,
  onFilterChange,
  search,
  onSearchChange,
  counts,
  onRefresh,
  loading,
}: Props) {
  const tabs: { key: FilterType; label: string; alert?: boolean }[] = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'today', label: `Due Today (${counts.today})`, alert: counts.today > 0 },
    { key: 'overdue', label: `Overdue (${counts.overdue})`, alert: counts.overdue > 0 },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab.key
                ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                : 'bg-slate-800/40 border border-slate-700/30 text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.label}
            {tab.alert && (
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Search + Refresh */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search guest, room, booking#…"
            className="pl-8 pr-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition-all w-52"
          />
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-xs font-bold text-slate-400 hover:text-white transition-all"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
    </div>
  );
}
