'use client';

import React from 'react';
import {
  BedDouble, Utensils, Wine, ShoppingBag, Layers,
  Search, X, Flame, ChefHat, Bell, CheckCircle2, Clock
} from 'lucide-react';
import { SourceCategory, MasterDisplayStats, ViewMode } from './types';

interface MasterDisplayFilterBarProps {
  categoryFilter: 'ALL' | SourceCategory;
  onSelectCategory: (cat: 'ALL' | SourceCategory) => void;
  statusFilter: 'ACTIVE' | 'ALL' | 'NEW' | 'PREPARING' | 'READY' | 'SERVED';
  onSelectStatus: (st: 'ACTIVE' | 'ALL' | 'NEW' | 'PREPARING' | 'READY' | 'SERVED') => void;
  stats: MasterDisplayStats;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
}

export const MasterDisplayFilterBar: React.FC<MasterDisplayFilterBarProps> = ({
  categoryFilter,
  onSelectCategory,
  statusFilter,
  onSelectStatus,
  stats,
  searchTerm,
  onSearchChange,
  viewMode,
  onChangeViewMode,
}) => {
  return (
    <div className="px-4 py-2 bg-[#060911] border-b border-slate-800/80 space-y-2">
      {/* Top row: Category Pills + Search */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Category Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {/* ALL ORDERS */}
          <button
            onClick={() => onSelectCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0 ${categoryFilter === 'ALL'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
              }`}
          >
            <Layers size={13} />
            <span>All Departments</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/40 text-[10px] font-black">
              {stats.totalActive}
            </span>
          </button>

          {/* ROOM SERVICE */}
          <button
            onClick={() => onSelectCategory('ROOM_SERVICE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0 ${categoryFilter === 'ROOM_SERVICE'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                : 'bg-slate-900/80 hover:bg-slate-800 text-indigo-300/80 hover:text-white border border-indigo-500/20'
              }`}
          >
            <BedDouble size={14} className="text-indigo-400" />
            <span>Room Service</span>
            <span className="px-1.5 py-0.2 rounded-md bg-indigo-950 text-indigo-300 text-[10px] font-black border border-indigo-700/40">
              {stats.roomServiceCount}
            </span>
          </button>

          {/* RESTAURANT DINING */}
          <button
            onClick={() => onSelectCategory('RESTAURANT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0 ${categoryFilter === 'RESTAURANT'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/40'
                : 'bg-slate-900/80 hover:bg-slate-800 text-emerald-300/80 hover:text-white border border-emerald-500/20'
              }`}
          >
            <Utensils size={13} className="text-emerald-400" />
            <span>Restaurant Tables</span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-300 text-[10px] font-black border border-emerald-700/40">
              {stats.restaurantCount}
            </span>
          </button>

          {/* BAR & LOUNGE */}
          <button
            onClick={() => onSelectCategory('BAR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0 ${categoryFilter === 'BAR'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md shadow-rose-600/30 border border-amber-400/40'
                : 'bg-slate-900/80 hover:bg-slate-800 text-amber-300/80 hover:text-white border border-amber-500/20'
              }`}
          >
            <Wine size={13} className="text-amber-400" />
            <span>Bar &amp; Drinks</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-950 text-amber-300 text-[10px] font-black border border-amber-700/40">
              {stats.barCount}
            </span>
          </button>

          {/* TAKEAWAY */}
          <button
            onClick={() => onSelectCategory('TAKEAWAY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shrink-0 ${categoryFilter === 'TAKEAWAY'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 border border-cyan-400/40'
                : 'bg-slate-900/80 hover:bg-slate-800 text-cyan-300/80 hover:text-white border border-cyan-500/20'
              }`}
          >
            <ShoppingBag size={13} className="text-cyan-400" />
            <span>Takeaway &amp; Del.</span>
            <span className="px-1.5 py-0.2 rounded-md bg-cyan-950 text-cyan-300 text-[10px] font-black border border-cyan-700/40">
              {stats.takeawayCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search room, table, item, KOT..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Status Filter Tabs (Active, New, Preparing, Ready, Served) */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => onSelectStatus('ACTIVE')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'ACTIVE'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
          >
            <span>All Active</span>
            <span className="px-1.5 py-0.1 rounded bg-black/40 text-[10px] font-black">
              {stats.totalActive}
            </span>
          </button>

          <button
            onClick={() => onSelectStatus('NEW')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'NEW'
                ? 'bg-red-600 text-white'
                : 'text-red-400/80 hover:text-red-200 hover:bg-slate-900'
              }`}
          >
            <Flame size={12} />
            <span>New</span>
            <span className="px-1.5 py-0.1 rounded bg-black/40 text-[10px] font-black">
              {stats.newCount}
            </span>
          </button>

          <button
            onClick={() => onSelectStatus('PREPARING')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'PREPARING'
                ? 'bg-amber-600 text-white'
                : 'text-amber-400/80 hover:text-amber-200 hover:bg-slate-900'
              }`}
          >
            <ChefHat size={12} />
            <span>Preparing</span>
            <span className="px-1.5 py-0.1 rounded bg-black/40 text-[10px] font-black">
              {stats.preparingCount}
            </span>
          </button>

          <button
            onClick={() => onSelectStatus('READY')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'READY'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-400/80 hover:text-emerald-200 hover:bg-slate-900'
              }`}
          >
            <Bell size={12} />
            <span>Ready</span>
            <span className="px-1.5 py-0.1 rounded bg-black/40 text-[10px] font-black">
              {stats.readyCount}
            </span>
          </button>

          <button
            onClick={() => onSelectStatus('SERVED')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${statusFilter === 'SERVED'
                ? 'bg-slate-700 text-white'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
              }`}
          >
            <CheckCircle2 size={12} />
            <span>Served History</span>
            <span className="px-1.5 py-0.1 rounded bg-black/40 text-[10px] font-black">
              {stats.servedCount}
            </span>
          </button>
        </div>

        {/* Average Preparation Time KPI */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-amber-400" />
            <span>Avg Wait:</span>
            <span className="font-black text-slate-200">{stats.avgWaitMinutes} mins</span>
          </div>

          {/* Mobile view mode switcher */}
          <div className="flex md:hidden items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => onChangeViewMode('DUAL_SPLIT')}
              className={`px-2 py-0.5 rounded ${viewMode === 'DUAL_SPLIT' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
            >
              50/50
            </button>
            <button
              onClick={() => onChangeViewMode('SPLIT')}
              className={`px-2 py-0.5 rounded ${viewMode === 'SPLIT' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
            >
              Split
            </button>
            <button
              onClick={() => onChangeViewMode('KANBAN')}
              className={`px-2 py-0.5 rounded ${viewMode === 'KANBAN' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
            >
              Pipeline
            </button>
            <button
              onClick={() => onChangeViewMode('GRID')}
              className={`px-2 py-0.5 rounded ${viewMode === 'GRID' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

