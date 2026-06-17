'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  ReceiptIndianRupee,
  Clock,
  User,
  Plus,
  Printer,
  ArrowLeftRight
} from 'lucide-react';

interface Table {
  id: string;
  name: string;
  status?: string;
  floor?: {
    name: string;
    menuType?: string;
  };
}

interface Order {
  id: string;
  orderNo: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  updatedAt?: string;
  guestCount?: number;
  guest?: {
    firstName: string;
  };
  restaurantTableId?: string;
  tableNo?: string;
  preparationTime?: number;
}

interface TabletTableGridProps {
  filteredTables: Table[];
  activeOrders: Order[];
  tablesByFloor: Record<string, Table[]>;
  activeFloorFilter: string;
  setActiveFloorFilter: (val: string) => void;
  waiterCalls: any[];
  handleDismissWaiterCall: (id: string) => Promise<void>;
  tableStatusAlerts: Record<string, { message: string; type: 'ready' | 'kitchen' | 'settle' }>;
  activeTableActionId: string | null;
  setActiveTableActionId: (val: string | null) => void;
  setSelectedTableId: (val: string) => void;
  setSessionStage: (val: 'TABLE' | 'PAX' | 'MENU') => void;
  targetOrderPrepTime: number;
  setTargetOrderPrepTime: (val: number) => void;
  handleSettleFromTable: (table: Table, order: Order | null) => void;
  handlePrintKOT: (tableId: string) => void;
  setSourceTableForSwitch: (val: Table) => void;
  setIsSwitchModalOpen: (val: boolean) => void;
}

// Floor accent matching mapping
const FLOOR_COLORS: Record<string, { accent: string; emoji: string; bg: string; border: string; glow: string; text: string }> = {
  bar: { accent: '#E8A838', emoji: '🍺', bg: 'from-amber-600/10 to-orange-600/15', border: 'border-amber-500/20', glow: 'rgba(232,168,56,0.15)', text: 'text-amber-400' },
  cafe: { accent: '#5ED4A0', emoji: '☕', bg: 'from-emerald-600/10 to-teal-600/15', border: 'border-emerald-500/20', glow: 'rgba(94,212,160,0.15)', text: 'text-emerald-400' },
  default: { accent: '#7C6DFA', emoji: '🏢', bg: 'from-indigo-600/10 to-violet-600/15', border: 'border-indigo-500/20', glow: 'rgba(124,109,250,0.15)', text: 'text-indigo-400' }
};

export function TabletTableGrid({
  filteredTables,
  activeOrders,
  tablesByFloor,
  activeFloorFilter,
  setActiveFloorFilter,
  waiterCalls,
  handleDismissWaiterCall,
  tableStatusAlerts,
  activeTableActionId,
  setActiveTableActionId,
  setSelectedTableId,
  setSessionStage,
  targetOrderPrepTime,
  setTargetOrderPrepTime,
  handleSettleFromTable,
  handlePrintKOT,
  setSourceTableForSwitch,
  setIsSwitchModalOpen,
}: TabletTableGridProps) {
  const occupiedCount = filteredTables.filter(t => activeOrders.some(o => o.restaurantTableId === t.id)).length;
  const vacantCount = filteredTables.length - occupiedCount;
  const readyCount = activeOrders.filter(o => o.status === 'READY').length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative z-10">
      
      {/* ── Compact Top Bar ── */}
      <div className="shrink-0 px-6 pt-4 pb-3 flex flex-col gap-3.5 bg-gradient-to-b from-[#0b0f1a]/80 to-transparent">
        {/* Row 1: Floor tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-950/40 border border-white/[0.06] p-1.5 rounded-2xl shrink-0 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => setActiveFloorFilter('all')}
            className={`h-9 px-4 rounded-xl flex items-center gap-2 transition-all duration-300 shrink-0 text-[10px] font-black uppercase tracking-wider select-none ${
              activeFloorFilter === 'all'
                ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white shadow-[0_4px_20px_rgba(99,102,241,0.45)] border border-indigo-400/20 scale-[1.02]'
                : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All Floors <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${activeFloorFilter === 'all' ? 'bg-black/25 text-white/95' : 'bg-white/5 text-slate-500'}`}>{filteredTables.length}</span>
          </button>
          
          {Object.entries(tablesByFloor).map(([floorName, floorTables], i) => {
            const colors = [
              { active: 'bg-gradient-to-r from-indigo-600 to-indigo-500 shadow-indigo-500/25', dot: 'bg-indigo-400' },
              { active: 'bg-gradient-to-r from-violet-600 to-violet-500 shadow-violet-500/25', dot: 'bg-violet-400' },
              { active: 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-rose-500/25', dot: 'bg-rose-400' },
              { active: 'bg-gradient-to-r from-amber-600 to-amber-500 shadow-amber-500/25', dot: 'bg-amber-400' },
              { active: 'bg-gradient-to-r from-teal-600 to-teal-500 shadow-teal-500/25', dot: 'bg-teal-400' },
            ];
            const c = colors[i % colors.length];
            return (
              <button
                key={floorName}
                onClick={() => setActiveFloorFilter(floorName)}
                className={`h-9 px-4 rounded-xl flex items-center gap-2 transition-all duration-300 shrink-0 text-[10px] font-black uppercase tracking-wider select-none ${
                  activeFloorFilter === floorName
                    ? `${c.active} text-white shadow-lg border border-white/10 scale-[1.02]`
                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeFloorFilter === floorName ? 'bg-white shadow-[0_0_8px_white]' : c.dot}`} />
                {floorName}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-md ${activeFloorFilter === floorName ? 'bg-black/20 text-white/95' : 'bg-white/5 text-slate-500'}`}>{floorTables.length}</span>
              </button>
            );
          })}

          <div className="flex-1 min-w-4" />

          {/* Waiter Calls */}
          {waiterCalls.map(call => {
            let tn = call.title;
            try {
              const m = call.metadata ? JSON.parse(call.metadata) : {};
              if (m.tableName) tn = m.tableName;
            } catch {}
            return (
              <button
                key={call.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismissWaiterCall(call.id);
                }}
                className="h-9 px-3.5 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-[0_4px_16px_rgba(225,29,72,0.35)] animate-pulse shrink-0 flex items-center gap-1.5 border border-rose-500/30 hover:brightness-110 active:scale-95 duration-200"
              >
                <Bell size={11} className="animate-bounce" /> {tn}{' '}
                <X size={9} className="opacity-60 hover:opacity-100" />
              </button>
            );
          })}
        </div>

        {/* Row 2: Summary chips */}
        <div className="flex items-center gap-3 select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 px-3 py-1.5 rounded-xl text-[9px] font-extrabold text-emerald-400 shadow-[inset_0_1px_0_0_rgba(16,185,129,0.05)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
              {vacantCount} Vacant
            </div>
            <div className="flex items-center gap-2 bg-orange-500/5 border border-orange-500/15 px-3 py-1.5 rounded-xl text-[9px] font-extrabold text-orange-400 shadow-[inset_0_1px_0_0_rgba(249,115,22,0.05)]">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse" />
              {occupiedCount} Occupied
            </div>
            {readyCount > 0 && (
              <div className="flex items-center gap-2 bg-cyan-500/5 border border-cyan-500/20 px-3 py-1.5 rounded-xl text-[9px] font-extrabold text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)] animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-ping" />
                {readyCount} Ready
              </div>
            )}
          </div>
          
          <div className="flex-1" />
          
          {activeOrders.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-500/5 border border-indigo-500/15 px-3.5 py-1.5 rounded-xl shadow-inner">
              <ReceiptIndianRupee size={12} className="text-indigo-400" />
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Live Revenue:</span>
              <span className="text-[11px] font-black text-indigo-300">₹{activeOrders.reduce((s, o) => s + (o.grandTotal || 0), 0).toFixed(0)}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3.5 py-1.5 shadow-inner">
            <Clock size={12} className="text-slate-400" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Prep Time Dial:</span>
            <input
              type="number"
              min="1"
              max="120"
              value={targetOrderPrepTime}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setTargetOrderPrepTime(isNaN(v) ? 15 : v);
              }}
              className="w-7 h-4 bg-transparent border-b border-white/20 text-center text-[10px] font-black text-indigo-400 outline-none focus:border-indigo-400 transition-colors"
            />
            <span className="text-[9px] font-bold text-slate-400">min</span>
          </div>
        </div>
      </div>

      {/* ── Table Grid Area ── */}
      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pb-6 pt-2">
        <div className="space-y-8">
          {Object.entries(tablesByFloor)
            .filter(([fn]) => activeFloorFilter === 'all' || activeFloorFilter === fn)
            .map(([floorName, floorTables]) => {
              const fnLower = floorName.toLowerCase();
              const fTheme = FLOOR_COLORS[fnLower] || FLOOR_COLORS.default;
              const displayLabel = `${fTheme.emoji} ${floorName}`;

              return (
                <div key={floorName} className="space-y-4">
                  {/* Floor divider */}
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${fTheme.text} bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-xl shadow-sm`}>
                      {displayLabel}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-white/[0.06] to-transparent" />
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                    {floorTables.map(table => {
                      const tOrder = activeOrders.find(o => o.restaurantTableId === table.id);
                      const elapsed = tOrder?.createdAt ? Math.floor((Date.now() - new Date(tOrder.createdAt).getTime()) / 60000) : 0;

                      let tStatus = table.status || 'VACANT';
                      if (tOrder) {
                        tStatus = tOrder.status === 'READY' ? 'READY'
                          : (tOrder.status === 'PAYMENT_AWAITING_APPROVAL' || tOrder.status === 'BILL_PRINTED') ? 'BILL_PRINTED'
                            : tOrder.status === 'SERVED' ? 'SERVED'
                              : tOrder.status === 'ON_HOLD' ? 'ON_HOLD'
                                : tOrder.status === 'SAVED' ? 'SAVED' : 'KOT_RUNNING';
                      }

                      const isOcc = tStatus !== 'VACANT';
                      const tAlert = tableStatusAlerts[table.id];
                      const isLate = isOcc && tOrder && tStatus === 'KOT_RUNNING' && elapsed >= ((tOrder as any).preparationTime || targetOrderPrepTime);
                      const rpLimit = typeof window !== 'undefined' ? parseInt(localStorage.getItem('kds_ready_pickup_time') || '5', 10) : 5;
                      const rWait = tOrder?.updatedAt ? Math.floor((Date.now() - new Date(tOrder.updatedAt).getTime()) / 60000) : 0;
                      const isPLate = isOcc && tOrder && tStatus === 'READY' && rpLimit > 0 && rWait >= rpLimit;

                      // ── Visual Theme Redesign (Luxury Glass Glass plaques) ──
                      type CardTheme = { topBar: string; bg: string; border: string; glow: string; label: string; labelColor: string; nameClr: string; amtClr: string; pulseRing?: string; iconColor?: string; indicatorBg?: string; };
                      
                      let theme: CardTheme = {
                        topBar: 'bg-slate-700/10',
                        bg: 'bg-gradient-to-b from-slate-900/30 to-slate-950/50 hover:from-slate-900/40 hover:to-slate-950/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]',
                        border: 'border-white/[0.05] hover:border-white/[0.12]',
                        glow: 'shadow-md shadow-black/20',
                        label: 'VACANT',
                        labelColor: 'text-slate-500',
                        nameClr: 'text-slate-450',
                        amtClr: 'text-white/60',
                      };

                      if (tStatus === 'READY') {
                        theme = {
                          topBar: 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500',
                          bg: 'bg-gradient-to-b from-emerald-950/30 to-teal-950/40 shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]',
                          border: 'border-emerald-500/40 hover:border-emerald-400/60',
                          glow: 'shadow-[0_8px_32px_-6px_rgba(16,185,129,0.4)]',
                          label: 'READY TO SERVE',
                          labelColor: 'text-emerald-400 font-extrabold',
                          nameClr: 'text-white font-black',
                          amtClr: 'text-emerald-300 font-black',
                          pulseRing: 'animate-pulse bg-emerald-400 shadow-[0_0_8px_#10b981]',
                          iconColor: 'text-emerald-400',
                          indicatorBg: 'bg-emerald-500/10 border-emerald-500/15'
                        };
                      } else if (tStatus === 'BILL_PRINTED') {
                        theme = {
                          topBar: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500',
                          bg: 'bg-gradient-to-b from-blue-950/30 to-indigo-950/40 shadow-[inset_0_1px_1px_rgba(59,130,246,0.1)]',
                          border: 'border-blue-500/40 hover:border-blue-400/60',
                          glow: 'shadow-[0_8px_32px_-6px_rgba(59,130,246,0.4)]',
                          label: 'BILL PRINTED',
                          labelColor: 'text-blue-400 font-extrabold',
                          nameClr: 'text-white font-black',
                          amtClr: 'text-blue-300 font-black',
                          pulseRing: 'animate-pulse bg-blue-400 shadow-[0_0_8px_#3b82f6]',
                          iconColor: 'text-blue-400',
                          indicatorBg: 'bg-blue-500/10 border-blue-500/15'
                        };
                      } else if (tStatus === 'KOT_RUNNING') {
                        theme = {
                          topBar: 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-550',
                          bg: 'bg-gradient-to-b from-orange-950/20 to-amber-950/30 shadow-[inset_0_1px_1px_rgba(249,115,22,0.1)]',
                          border: 'border-orange-500/40 hover:border-orange-400/60',
                          glow: 'shadow-[0_8px_32px_-6px_rgba(249,115,22,0.35)]',
                          label: 'IN KITCHEN',
                          labelColor: 'text-orange-400 font-extrabold',
                          nameClr: 'text-white font-black',
                          amtClr: 'text-orange-300 font-black',
                          pulseRing: 'animate-pulse bg-orange-400 shadow-[0_0_8px_#f97316]',
                          iconColor: 'text-orange-400',
                          indicatorBg: 'bg-orange-500/10 border-orange-500/15'
                        };
                      } else if (tStatus === 'ON_HOLD') {
                        theme = {
                          topBar: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-yellow-400',
                          bg: 'bg-gradient-to-b from-amber-950/25 to-yellow-950/35 shadow-[inset_0_1px_1px_rgba(245,158,11,0.1)]',
                          border: 'border-amber-500/40 hover:border-amber-400/60',
                          glow: 'shadow-[0_8px_32px_-6px_rgba(245,158,11,0.3)]',
                          label: 'ON HOLD',
                          labelColor: 'text-amber-400 font-extrabold',
                          nameClr: 'text-white font-black',
                          amtClr: 'text-amber-300 font-black',
                          pulseRing: 'animate-pulse bg-amber-400 shadow-[0_0_8px_#f59e0b]',
                          iconColor: 'text-amber-400',
                          indicatorBg: 'bg-amber-500/10 border-amber-500/15'
                        };
                      } else if (tStatus === 'SAVED') {
                        theme = {
                          topBar: 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600',
                          bg: 'bg-gradient-to-b from-rose-950/20 to-pink-950/30 shadow-[inset_0_1px_1px_rgba(244,63,94,0.1)]',
                          border: 'border-rose-500/40 hover:border-rose-400/60',
                          glow: 'shadow-[0_8px_32px_-6px_rgba(244,63,94,0.3)]',
                          label: 'ORDER SAVED',
                          labelColor: 'text-rose-400 font-extrabold',
                          nameClr: 'text-white font-black',
                          amtClr: 'text-rose-300 font-black',
                          pulseRing: 'animate-pulse bg-rose-400 shadow-[0_0_8px_#f43f5e]',
                          iconColor: 'text-rose-400',
                          indicatorBg: 'bg-rose-500/10 border-rose-500/15'
                        };
                      } else if (tStatus === 'SERVED') {
                        theme = {
                          topBar: 'bg-gradient-to-r from-slate-500 via-slate-600 to-slate-700',
                          bg: 'bg-gradient-to-b from-slate-900/40 to-slate-950/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]',
                          border: 'border-slate-500/30 hover:border-slate-400/50',
                          glow: 'shadow-md shadow-black/30',
                          label: 'SERVED & ACTIVE',
                          labelColor: 'text-slate-400 font-extrabold',
                          nameClr: 'text-white/90 font-black',
                          amtClr: 'text-slate-350 font-extrabold',
                          pulseRing: 'bg-slate-400',
                          iconColor: 'text-slate-400',
                          indicatorBg: 'bg-slate-500/10 border-slate-500/15'
                        };
                      } else if (tStatus === 'OCCUPIED') {
                        theme = {
                          topBar: 'bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500',
                          bg: 'bg-gradient-to-b from-purple-950/25 to-indigo-950/35 shadow-[inset_0_1px_1px_rgba(168,85,247,0.1)]',
                          border: 'border-purple-500/40 hover:border-purple-400/60',
                          glow: 'shadow-[0_8px_32px_-6px_rgba(168,85,247,0.3)]',
                          label: 'OCCUPIED',
                          labelColor: 'text-purple-400 font-extrabold',
                          nameClr: 'text-white font-black',
                          amtClr: 'text-purple-300 font-black',
                          pulseRing: 'animate-pulse bg-purple-400 shadow-[0_0_8px_#a855f7]',
                          iconColor: 'text-purple-400',
                          indicatorBg: 'bg-purple-500/10 border-purple-500/15'
                        };
                      }

                      if (isLate) {
                        theme = {
                          topBar: 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse',
                          bg: 'bg-gradient-to-b from-rose-950/40 to-red-950/50 shadow-[inset_0_1px_1px_rgba(244,63,94,0.2)]',
                          border: 'border-rose-500/60 animate-blink-late',
                          glow: 'shadow-[0_8px_32px_-4px_rgba(225,29,72,0.55)]',
                          label: 'LATE PREPARATION!',
                          labelColor: 'text-rose-300 font-black tracking-wider animate-pulse',
                          nameClr: 'text-rose-100 font-black',
                          amtClr: 'text-rose-200 font-black',
                          pulseRing: 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-ping',
                          iconColor: 'text-rose-450',
                          indicatorBg: 'bg-rose-500/20 border-rose-500/30'
                        };
                      } else if (isPLate) {
                        theme = {
                          topBar: 'bg-gradient-to-r from-blue-500 to-cyan-500 animate-pulse',
                          bg: 'bg-gradient-to-b from-blue-950/40 to-cyan-950/50 shadow-[inset_0_1px_1px_rgba(59,130,246,0.2)]',
                          border: 'border-blue-500/60 animate-blink-ready',
                          glow: 'shadow-[0_8px_32px_-4px_rgba(59,130,246,0.55)]',
                          label: 'LATE PICKUP!',
                          labelColor: 'text-blue-300 font-black tracking-wider animate-pulse',
                          nameClr: 'text-blue-100 font-black',
                          amtClr: 'text-blue-200 font-black',
                          pulseRing: 'bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-ping',
                          iconColor: 'text-blue-450',
                          indicatorBg: 'bg-blue-500/20 border-blue-500/30'
                        };
                      }

                      return (
                        <div className="relative group/card" key={table.id}>
                          {/* Alert notification bubble */}
                          {tAlert && (
                            <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 z-[200] px-3.5 py-1 rounded-2xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap shadow-[0_8px_24px_rgba(0,0,0,0.6)] border animate-bounce ${
                              tAlert.type === 'ready' 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400/30 text-white' 
                                : tAlert.type === 'kitchen' 
                                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-400/30 text-white' 
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-400/30 text-white'
                            }`}>
                              {tAlert.message}
                            </div>
                          )}

                          <button
                            onClick={() => {
                              if (isOcc) {
                                setActiveTableActionId(activeTableActionId === table.id ? null : table.id);
                              } else {
                                setSelectedTableId(table.id);
                                setSessionStage('PAX');
                              }
                            }}
                            onDoubleClick={() => {
                              setSelectedTableId(table.id);
                              setSessionStage(isOcc ? 'MENU' : 'PAX');
                            }}
                            className={`w-full aspect-square rounded-2xl border ${theme.border} ${theme.bg} ${theme.glow} flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:brightness-110 active:scale-[0.96] relative`}
                          >
                            {/* Accent top ribbon */}
                            <div className={`h-1.5 w-full ${theme.topBar} shrink-0`} />

                            {/* Inner highlights/reflections */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.025] to-transparent pointer-events-none rounded-b-2xl" />

                            {/* Card grid inner elements */}
                            <div className="flex-1 flex flex-col items-center justify-between p-4 relative z-10 w-full">
                              {/* Header details */}
                              <div className="w-full flex items-center justify-between">
                                <span className={`text-sm font-black uppercase tracking-wide leading-none ${theme.nameClr}`}>{table.name}</span>
                                
                                {isOcc && (
                                  <span className="relative flex h-2.5 w-2.5">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${theme.pulseRing || 'bg-slate-400'}`} />
                                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${theme.pulseRing ? theme.pulseRing.split(' ')[1] || theme.pulseRing.split(' ')[0] : 'bg-slate-500'}`} />
                                  </span>
                                )}
                              </div>
                              
                              {/* Occupancy states summary */}
                              {isOcc ? (
                                <div className="flex flex-col items-center justify-center gap-2 w-full my-auto">
                                  {tOrder?.grandTotal && (
                                    <span className={`text-base font-black tracking-tight leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] ${theme.amtClr}`}>
                                      ₹{tOrder.grandTotal.toFixed(0)}
                                    </span>
                                  )}
                                  
                                  {/* Badges details layout */}
                                  <div className="flex items-center gap-1.5 mt-1 select-none">
                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border border-white/[0.04] text-[8px] font-bold text-white/60 ${theme.indicatorBg || 'bg-white/5'}`}>
                                      <User size={8} className={theme.iconColor || 'text-slate-400'} />
                                      <span className="truncate max-w-[50px]">
                                        {tOrder?.guest ? tOrder.guest.firstName : tOrder?.guestCount ? `${tOrder.guestCount}P` : '1P'}
                                      </span>
                                    </div>
                                    {tOrder && (
                                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border border-white/[0.04] text-[8px] font-bold text-white/60 ${isLate ? 'bg-rose-500/20 border-rose-500/20' : theme.indicatorBg || 'bg-white/5'}`}>
                                        <Clock size={8} className={isLate ? 'text-rose-450 animate-pulse' : theme.iconColor || 'text-slate-400'} />
                                        <span className={isLate ? 'text-rose-300 font-extrabold' : ''}>{elapsed}m</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1 flex items-center justify-center w-full">
                                  <div className="flex items-center justify-center w-9 h-9 rounded-full bg-white/[0.03] group-hover/card:bg-indigo-500/10 group-hover/card:border-indigo-500/30 border border-white/[0.06] transition-all duration-300 shadow-inner group-hover/card:scale-110">
                                    <Plus size={15} className="text-white/25 group-hover/card:text-indigo-400 transition-colors" />
                                  </div>
                                </div>
                              )}

                              {/* Status footer banner */}
                              <div className="w-full text-center border-t border-white/[0.04] pt-2 mt-auto select-none">
                                <span className={`text-[7px] font-extrabold uppercase tracking-[0.25em] leading-none ${theme.labelColor}`}>{theme.label}</span>
                              </div>
                            </div>

                            {/* Preparation/Alert glow bars at bottom */}
                            {tStatus === 'KOT_RUNNING' && (
                              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-orange-500/20 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_#f97316] animate-pulse w-full" />
                              </div>
                            )}
                            {isLate && (
                              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-rose-500/20 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_0_8px_#f43f5e] animate-ping w-full" />
                              </div>
                            )}
                          </button>

                          {/* Action Backdrop */}
                          {activeTableActionId === table.id && (
                            <div className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setActiveTableActionId(null); }} />
                          )}

                          {/* Redesigned interactive action popover */}
                          <AnimatePresence>
                            {activeTableActionId === table.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 12, scale: 0.92 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 12, scale: 0.92 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                                className="absolute top-[104%] left-1/2 -translate-x-1/2 z-[100] w-[220px] bg-slate-900/95 border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl rounded-2xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-center px-4 py-3 bg-white/[0.02] border-b border-white/[0.05]">
                                  <p className="text-xs font-black text-white uppercase tracking-wider">{table.name}</p>
                                  {tOrder?.grandTotal && <p className="text-[10px] font-black text-indigo-400 mt-1 uppercase tracking-widest">₹{tOrder.grandTotal.toFixed(0)} ACTIVE</p>}
                                </div>
                                <div className="p-3 flex flex-col gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedTableId(table.id);
                                      setSessionStage('MENU');
                                      setActiveTableActionId(null);
                                    }}
                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-white shadow-[0_4px_12px_rgba(99,102,241,0.3)] hover:scale-[1.02] duration-200"
                                  >
                                    <Plus size={12} /> Add Items
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const o = activeOrders.find(o => o.restaurantTableId === table.id);
                                      handleSettleFromTable(table, o || null);
                                      setActiveTableActionId(null);
                                    }}
                                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] hover:scale-[1.02] duration-200"
                                  >
                                    <ReceiptIndianRupee size={12} /> Pay Bill
                                  </button>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrintKOT(table.id);
                                        setActiveTableActionId(null);
                                      }}
                                      className="py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 active:scale-95 duration-200"
                                    >
                                      <Printer size={10} /> KOT
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSourceTableForSwitch(table);
                                        setIsSwitchModalOpen(true);
                                        setActiveTableActionId(null);
                                      }}
                                      className="py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-white/80 rounded-xl font-black text-[8px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 active:scale-95 duration-200"
                                    >
                                      <ArrowLeftRight size={10} /> Move
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </main>
    </div>
  );
}
