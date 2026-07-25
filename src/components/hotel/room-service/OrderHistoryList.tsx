'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, RefreshCw, Search, CheckCircle2, Clock, ChefHat, Bike, X, RotateCcw } from 'lucide-react';
import { RoomServiceOrder, ORDER_STATUS_CONFIG, ORDER_TYPE_CONFIG, formatCurrency } from './types';

interface OrderHistoryListProps {
  onReorder?: (order: RoomServiceOrder) => void;
}

const STATUS_PROGRESSION: Array<RoomServiceOrder['status']> = [
  'PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED',
];

function StatusStepper({ status }: { status: RoomServiceOrder['status'] }) {
  const idx = STATUS_PROGRESSION.indexOf(status);
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-1">
        <X size={10} className="text-slate-500" />
        <span className="text-[9px] font-bold text-slate-600">Cancelled</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      {STATUS_PROGRESSION.map((s, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <React.Fragment key={s}>
            <div className={`w-2 h-2 rounded-full transition-all ${
              done
                ? active
                  ? `${ORDER_STATUS_CONFIG[s].dot} ring-2 ring-offset-1 ring-offset-transparent ring-current`
                  : ORDER_STATUS_CONFIG[s].dot
                : 'bg-slate-800 border border-slate-700'
            }`} />
            {i < STATUS_PROGRESSION.length - 1 && (
              <div className={`h-px w-3 ${i < idx ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
            )}
          </React.Fragment>
        );
      })}
      <span className={`text-[9px] font-black ml-1 ${ORDER_STATUS_CONFIG[status]?.color || 'text-slate-400'}`}>
        {ORDER_STATUS_CONFIG[status]?.label}
      </span>
    </div>
  );
}

export function OrderHistoryList({ onReorder }: OrderHistoryListProps) {
  const [orders, setOrders] = useState<RoomServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/room-service').then(r => r.json());
      if (res.success) setOrders(res.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: RoomServiceOrder['status']) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/hotel/room-service/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      }).then(r => r.json());
      if (res.success) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      }
    } catch { /* silent */ }
    finally { setUpdatingId(null); }
  };

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    return !q ||
      o.roomNumber.includes(q) ||
      o.orderNo.toLowerCase().includes(q) ||
      (o.guestName || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Room#, order#, guest…"
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/8 text-white text-xs font-semibold placeholder-slate-700 focus:outline-none focus:border-amber-500/40 transition-all"
          />
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl bg-white/[0.03] border border-white/8 text-slate-600 hover:text-slate-400 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Orders */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin" />
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-10">
          <History size={32} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-600 text-xs font-bold">
            {search ? 'No matching orders' : 'No room service orders today'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => {
            const typeCfg = ORDER_TYPE_CONFIG[order.orderType] || { emoji: '🛎️', label: 'Order' };
            const nextStatus = STATUS_PROGRESSION[STATUS_PROGRESSION.indexOf(order.status) + 1];
            const isUpdating = updatingId === order.id;

            const instructions = (order as any).deliveryInstructions || (order as any).notes || '';
            const isDineIn = instructions.includes('TYPE:DINE_IN') || (order.orderType as string) === 'DINE_IN';
            const serveTimeMatch = instructions.match(/SERVE_TIME:([^|]+)/);
            const serveTime = serveTimeMatch ? serveTimeMatch[1] : null;
            const tableMatch = instructions.match(/TABLE:([^|]+)/);
            const tableName = tableMatch ? tableMatch[1] : ((order as any).tableNo || '');
            const isGuestPreorder = instructions.includes('SERVE_TIME') || !!order.guestName;

            return (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/60 transition-all space-y-2.5"
              >
                {/* Pre-order Location & Scheduled Serving Time Badges */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                  {isDineIn ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wide">
                      🍽️ DINE-IN AT RESTAURANT TABLE ({tableName || 'Table'})
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase tracking-wide">
                      🛎️ ROOM SERVICE DELIVERY ({order.roomNumber ? `Room ${order.roomNumber}` : 'Room'})
                    </span>
                  )}

                  {serveTime && (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-violet-500/20 text-violet-300 border border-violet-500/40 uppercase tracking-wide flex items-center gap-1">
                      ⏰ SERVING TIME: {serveTime}
                    </span>
                  )}

                  {isGuestPreorder && (
                    <span className="px-2 py-1 rounded-lg text-[9px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 uppercase tracking-wider ml-auto">
                      📱 ADVANCE GUEST PRE-ORDER
                    </span>
                  )}
                </div>

                {/* Top row */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{isDineIn ? '🍽️' : typeCfg.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-white">{isDineIn ? (tableName || 'Restaurant Table') : `Room ${order.roomNumber || '—'}`}</p>
                        <span className="text-[9px] font-bold text-slate-700">#{order.orderNo}</span>
                      </div>
                      {order.guestName && (
                        <p className="text-[9px] text-indigo-400 font-bold">{order.guestName}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-amber-400">{formatCurrency(order.totalAmount)}</p>
                    <p className="text-[8px] text-slate-700 font-bold">
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Status Stepper */}
                <StatusStepper status={order.status} />

                {/* Items summary */}
                <p className="text-[9px] text-slate-700 font-bold mt-2">
                  {order.items.map(i => `${i.name} ×${i.qty}`).join(' · ')}
                </p>

                {/* Folio posted badge */}
                {order.postedToFolio && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle2 size={9} className="text-emerald-400" />
                    <span className="text-[9px] font-bold text-emerald-400">Posted to folio</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  {nextStatus && order.status !== 'CANCELLED' && (
                    <button
                      onClick={() => updateStatus(order.id, nextStatus)}
                      disabled={isUpdating}
                      className="flex-1 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                    >
                      {isUpdating ? '…' : `Mark ${ORDER_STATUS_CONFIG[nextStatus]?.label}`}
                    </button>
                  )}
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => updateStatus(order.id, 'CANCELLED')}
                      disabled={isUpdating}
                      className="py-2 px-3 rounded-xl bg-red-500/5 border border-red-500/15 text-red-500 text-[10px] font-bold hover:bg-red-500/15 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                  {onReorder && (
                    <button
                      onClick={() => onReorder(order)}
                      className="flex items-center gap-1 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/8 text-slate-500 text-[10px] font-bold hover:text-slate-300 transition-all"
                    >
                      <RotateCcw size={9} /> Reorder
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
}
