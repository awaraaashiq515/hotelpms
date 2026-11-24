'use client';

import React from 'react';
import {
  BedDouble, Utensils, Wine, ShoppingBag, Clock, Check,
  AlertTriangle, Flame, Bell, CheckCircle2, RotateCcw,
  Printer, User, Phone, ChevronRight
} from 'lucide-react';
import { MasterTicket, DisplayItem } from './types';

interface MasterOrderCardProps {
  ticket: MasterTicket;
  checkedItems: Record<string, boolean>;
  isUpdating: boolean;
  onToggleCheckItem: (itemId: string) => void;
  onUpdateStatus: (kotId: string, status: 'PREPARING' | 'READY' | 'SERVED') => void;
  onPrintTicket?: (ticket: MasterTicket) => void;
}

export const MasterOrderCard: React.FC<MasterOrderCardProps> = ({
  ticket,
  checkedItems,
  isUpdating,
  onToggleCheckItem,
  onUpdateStatus,
  onPrintTicket,
}) => {
  // Theme configuration based on Category
  const getCategoryTheme = () => {
    switch (ticket.sourceCategory) {
      case 'ROOM_SERVICE':
        return {
          icon: BedDouble,
          label: 'Room Service',
          headerBg: 'from-indigo-900/90 via-indigo-950 to-slate-900',
          borderColor: 'border-indigo-500/40 hover:border-indigo-400',
          badgeBg: 'bg-indigo-600 text-white',
          accentText: 'text-indigo-400',
          accentBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
        };
      case 'BAR':
        return {
          icon: Wine,
          label: 'Bar & Lounge',
          headerBg: 'from-amber-900/90 via-rose-950 to-slate-900',
          borderColor: 'border-amber-500/40 hover:border-amber-400',
          badgeBg: 'bg-gradient-to-r from-amber-600 to-rose-600 text-white',
          accentText: 'text-amber-400',
          accentBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
        };
      case 'TAKEAWAY':
        return {
          icon: ShoppingBag,
          label: 'Takeaway / Del.',
          headerBg: 'from-cyan-900/90 via-sky-950 to-slate-900',
          borderColor: 'border-cyan-500/40 hover:border-cyan-400',
          badgeBg: 'bg-cyan-600 text-white',
          accentText: 'text-cyan-400',
          accentBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
        };
      case 'RESTAURANT':
      default:
        return {
          icon: Utensils,
          label: 'Restaurant Dining',
          headerBg: 'from-emerald-900/90 via-teal-950 to-slate-900',
          borderColor: 'border-emerald-500/40 hover:border-emerald-400',
          badgeBg: 'bg-emerald-600 text-white',
          accentText: 'text-emerald-400',
          accentBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
        };
    }
  };

  const theme = getCategoryTheme();
  const CategoryIcon = theme.icon;

  // Status Styling
  const getStatusBadge = () => {
    switch (ticket.status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 border border-red-500/50 text-red-300 text-xs font-black animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            NEW ORDER
          </span>
        );
      case 'PREPARING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-black">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-spin" />
            PREPARING
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-black">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            READY
          </span>
        );
      case 'SERVED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
            <CheckCircle2 size={12} className="text-slate-500" />
            SERVED
          </span>
        );
    }
  };

  // Urgency Timer
  const getTimerStyle = () => {
    if (ticket.urgency === 'CRITICAL') {
      return 'bg-red-500 text-white font-black animate-bounce shadow-lg shadow-red-500/40';
    }
    if (ticket.urgency === 'WARNING') {
      return 'bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold';
    }
    return 'bg-emerald-950/60 border border-emerald-600/30 text-emerald-400 font-bold';
  };

  return (
    <div
      className={`flex flex-col bg-[#0b0f19] rounded-2xl border ${theme.borderColor} shadow-xl shadow-black/40 overflow-hidden transition-all duration-200 hover:-translate-y-0.5`}
    >
      {/* Header Bar */}
      <div className={`p-3.5 bg-gradient-to-r ${theme.headerBg} border-b border-white/10 flex items-start justify-between gap-2`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 ${theme.badgeBg}`}>
              <CategoryIcon size={12} />
              {theme.label}
            </span>
            <span className="text-xs font-bold text-slate-300 bg-black/40 px-2 py-0.5 rounded-md">
              KOT #{ticket.kotNo}
            </span>
            {ticket.hasBarItems && ticket.sourceCategory !== 'BAR' && (
              <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-600/40">
                🍸 Has Bar Drinks
              </span>
            )}
          </div>

          {/* Primary Destination (Big & Clear for TV Display) */}
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5 truncate">
            {ticket.sourceBadge?.replace(/^Room\s+Room\s+/i, 'Room ').replace(/^Table\s+Table\s+/i, 'Table ')}
          </h2>
          <p className="text-xs text-slate-400 font-medium truncate">
            {ticket.sourceLocation}
          </p>
        </div>

        {/* Right side: Timer & Status */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 ${getTimerStyle()}`}>
            <Clock size={12} />
            <span>{ticket.elapsedMinutes}m ago</span>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Guest / Server Info Strip */}
      {(ticket.guestName || ticket.serverName || ticket.guestPhone) && (
        <div className="px-3.5 py-1.5 bg-[#070b13] border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3 truncate">
            {ticket.guestName && (
              <span className="flex items-center gap-1 text-slate-300 font-bold truncate">
                <User size={11} className={theme.accentText} />
                {ticket.guestName}
              </span>
            )}
            {ticket.guestPhone && (
              <span className="flex items-center gap-1 text-slate-400">
                <Phone size={10} />
                {ticket.guestPhone}
              </span>
            )}
          </div>
          {ticket.serverName && (
            <span className="text-slate-500 font-medium shrink-0">
              By: {ticket.serverName}
            </span>
          )}
        </div>
      )}

      {/* Items Section */}
      <div className="p-3.5 flex-1 space-y-2 bg-[#090d16]">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
          <span>Items ({ticket.totalItemsCount})</span>
          <span className="text-[10px] text-slate-500 lowercase">tap item to mark prepared</span>
        </div>

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {ticket.items.map((item) => {
            const isDone = checkedItems[item.id] || item.status === 'READY' || item.status === 'SERVED';
            return (
              <div
                key={item.id}
                onClick={() => onToggleCheckItem(item.id)}
                className={`p-2 rounded-xl flex items-start gap-2.5 cursor-pointer transition select-none ${isDone
                    ? 'bg-slate-900/60 opacity-60 border border-transparent'
                    : 'bg-[#101726] hover:bg-[#151f33] border border-slate-800'
                  }`}
              >
                {/* Checkbox indicator */}
                <div
                  className={`w-5 h-5 mt-0.5 rounded-lg flex items-center justify-center shrink-0 border transition ${isDone
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-slate-700 bg-slate-900/60 text-transparent'
                    }`}
                >
                  <Check size={12} strokeWidth={3} />
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span
                      className={`text-sm font-black truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                    >
                      {item.itemName}
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-md shrink-0 ${isDone ? 'bg-slate-800 text-slate-400' : 'bg-indigo-950 text-indigo-300 border border-indigo-700/40'
                        }`}
                    >
                      x{item.quantity} {item.unit || ''}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-amber-400 font-bold mt-0.5 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      <span>⚠️ Note:</span> {item.notes}
                    </p>
                  )}

                  {item.isBarItem && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 mt-0.5 inline-block">
                      🍸 Bar Item
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-3 bg-[#0a0e18] border-t border-slate-800 flex items-center gap-2">
        {onPrintTicket && (
          <button
            onClick={() => onPrintTicket(ticket)}
            title="Print Ticket"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <Printer size={16} />
          </button>
        )}

        {ticket.status === 'NEW' && (
          <button
            disabled={isUpdating}
            onClick={() => onUpdateStatus(ticket.id, 'PREPARING')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <Flame size={16} />
            Accept &amp; Start Preparing
          </button>
        )}

        {ticket.status === 'PREPARING' && (
          <button
            disabled={isUpdating}
            onClick={() => onUpdateStatus(ticket.id, 'READY')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <Bell size={16} />
            Mark Ready to Serve
          </button>
        )}

        {ticket.status === 'READY' && (
          <button
            disabled={isUpdating}
            onClick={() => onUpdateStatus(ticket.id, 'SERVED')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <CheckCircle2 size={16} />
            {ticket.sourceCategory === 'ROOM_SERVICE'
              ? 'Mark Delivered to Room'
              : ticket.sourceCategory === 'TAKEAWAY'
                ? 'Hand Over to Guest / Rider'
                : 'Mark Served to Table'}
          </button>
        )}

        {ticket.status === 'SERVED' && (
          <button
            disabled={isUpdating}
            onClick={() => onUpdateStatus(ticket.id, 'PREPARING')}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <RotateCcw size={14} />
            Reopen Ticket
          </button>
        )}
      </div>
    </div>
  );
};

