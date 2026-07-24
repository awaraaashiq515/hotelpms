'use client';

import React from 'react';
import { Utensils, Search, Table as TableIcon, Bell } from 'lucide-react';

interface TabletHeaderProps {
  property: any;
  websiteSettings: any;
  tablet: any;
  tables: any[];
  selectedTableId: string;
  waiter: any;
  activeOrder: any;
  setIsStatusVisible: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  setSessionStage: (val: 'TABLE' | 'PAX' | 'MENU') => void;
  setIsNotificationOpen: (val: boolean) => void;
  notificationHistory: any[];
}

export function TabletHeader({
  property,
  websiteSettings,
  tablet,
  tables,
  selectedTableId,
  waiter,
  activeOrder,
  setIsStatusVisible,
  searchQuery,
  setSearchQuery,
  setSessionStage,
  setIsNotificationOpen,
  notificationHistory,
}: TabletHeaderProps) {
  const displayLogo = property?.logoUrl || websiteSettings?.logoUrl;
  const activeTableName = tables.find(t => t.id === selectedTableId)?.name || 'STATION';

  return (
    <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-slate-950/40 backdrop-blur-xl border-b border-white/[0.06] z-50 relative">
      <div className="flex items-center gap-4">
        {displayLogo ? (
          <img src={displayLogo} alt="Logo" className="h-8 w-auto object-contain rounded-lg" />
        ) : (
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Utensils size={18} className="text-white" />
          </div>
        )}
        <div>
          {!displayLogo && (
            <h1 className="font-black uppercase tracking-tight text-sm text-white">
              {property?.brandName || property?.name || 'GuestFlow'}{' '}
              <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md text-[10px] border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] ml-1">
                POS
              </span>
            </h1>
          )}
          <p className="text-[8px] font-extrabold text-slate-450 uppercase tracking-widest mt-1">
            {tablet?.name} • {activeTableName} {waiter ? `• Waiter: ${waiter.name}` : ''}
          </p>
        </div>
      </div>

      {activeOrder && (
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 animate-in fade-in zoom-in duration-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase text-indigo-400 tracking-widest leading-none">Active Order</span>
            <span className="text-[9px] font-black leading-tight text-white/90">#{activeOrder.orderNo}</span>
          </div>
          <button
            onClick={() => setIsStatusVisible(true)}
            className="text-[7px] font-black uppercase bg-white/5 px-2 py-1 rounded-md hover:bg-white/10 ml-2 border border-white/5 transition-all"
          >
            Track Status
          </button>
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="relative w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
          <input
            type="text"
            placeholder="Search Menu..."
            className="w-full h-10 bg-slate-950/40 border border-white/10 rounded-xl pl-10 pr-4 text-[10px] font-bold outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder:text-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {tablet?.mode === 'WAITER' && (
          <button
            onClick={() => setSessionStage('TABLE')}
            className="h-10 px-4 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] active:scale-95 rounded-xl flex items-center gap-2 transition-all text-[9px] font-black uppercase tracking-wider"
          >
            <TableIcon size={14} className="text-indigo-400 animate-pulse" />
            Switch Table
          </button>
        )}

        <button
          onClick={() => setIsNotificationOpen(true)}
          className="relative w-10 h-10 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] active:scale-95 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <Bell size={18} />
          {notificationHistory.filter(n => n.type === 'success').length > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-[#090D1A] rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse">
              {notificationHistory.filter(n => n.type === 'success').length}
            </div>
          )}
        </button>
      </div>
    </header>
  );
}
