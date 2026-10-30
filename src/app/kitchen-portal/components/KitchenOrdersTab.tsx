'use client';

import React from 'react';
import { Utensils, BedDouble, ShoppingBag } from 'lucide-react';
import { KotTicket, OrderSourceType } from './types';
import { KotOrderCard } from './KotOrderCard';

interface KitchenOrdersTabProps {
  orders: KotTicket[];
  orderCounts: {
    all: number;
    new: number;
    preparing: number;
    ready: number;
    rooms: number;
    restaurant: number;
    takeaway: number;
  };
  ordersFilter: 'ALL' | 'NEW' | 'PREPARING' | 'READY';
  orderSourceFilter: OrderSourceType;
  checkedItems: Record<string, boolean>;
  updatingKotId: string | null;
  onSetOrdersFilter: (filter: 'ALL' | 'NEW' | 'PREPARING' | 'READY') => void;
  onSetOrderSourceFilter: (source: OrderSourceType) => void;
  onToggleItemChecked: (itemId: string) => void;
  onUpdateStatus: (kotId: string, status: 'PREPARING' | 'READY' | 'SERVED') => void;
  getOrderSource: (kot: KotTicket) => 'ROOMS' | 'RESTAURANT' | 'TAKEAWAY';
}

export const KitchenOrdersTab: React.FC<KitchenOrdersTabProps> = ({
  orders,
  orderCounts,
  ordersFilter,
  orderSourceFilter,
  checkedItems,
  updatingKotId,
  onSetOrdersFilter,
  onSetOrderSourceFilter,
  onToggleItemChecked,
  onUpdateStatus,
  getOrderSource,
}) => {
  return (
    <div className="space-y-4">
      {/* Unified Order Source Tabs: All / Room Service / Restaurant Tables / Takeaway */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0d1322] p-2 rounded-2xl border border-slate-800 shadow-sm">
        <button
          onClick={() => onSetOrderSourceFilter('ALL')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between transition ${orderSourceFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
        >
          <span className="flex items-center gap-1.5">
            <Utensils size={13} /> All Orders
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-[10px] font-black">
            {orderCounts.all}
          </span>
        </button>

        <button
          onClick={() => onSetOrderSourceFilter('ROOMS')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between transition ${orderSourceFilter === 'ROOMS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-indigo-300/80 hover:text-white hover:bg-indigo-950/40 border border-indigo-500/20'
            }`}
        >
          <span className="flex items-center gap-1.5">
            <BedDouble size={14} className="text-indigo-300" /> Room Service
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-indigo-900/60 text-[10px] font-black">
            {orderCounts.rooms}
          </span>
        </button>

        <button
          onClick={() => onSetOrderSourceFilter('RESTAURANT')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between transition ${orderSourceFilter === 'RESTAURANT'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800'
            }`}
        >
          <span className="flex items-center gap-1.5">
            <Utensils size={13} className="text-indigo-400" /> Restaurant Tables
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-black">
            {orderCounts.restaurant}
          </span>
        </button>

        <button
          onClick={() => onSetOrderSourceFilter('TAKEAWAY')}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between transition ${orderSourceFilter === 'TAKEAWAY'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800'
            }`}
        >
          <span className="flex items-center gap-1.5">
            <ShoppingBag size={13} className="text-indigo-400" /> Takeaway &amp; Del.
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-black">
            {orderCounts.takeaway}
          </span>
        </button>
      </div>

      {/* Status Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0d1322] p-2.5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'NEW', 'PREPARING', 'READY'] as const).map((st) => {
            const count =
              st === 'ALL'
                ? orderCounts.all
                : st === 'NEW'
                  ? orderCounts.new
                  : st === 'PREPARING'
                    ? orderCounts.preparing
                    : orderCounts.ready;
            return (
              <button
                key={st}
                onClick={() => onSetOrdersFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${ordersFilter === st
                    ? 'bg-indigo-600 text-white border border-indigo-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
              >
                <span>{st === 'ALL' ? 'All Status' : st}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-950/60 text-[10px] font-black">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Live polling active (7s)</span>
        </div>
      </div>

      {/* Orders Cards Grid */}
      {orders.length === 0 ? (
        <div className="py-20 text-center bg-[#0d1322] rounded-3xl border border-slate-800/80">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-slate-500 mx-auto mb-3">
            <Utensils size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-200">No active kitchen orders found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Orders placed from Hotel Guest Rooms, Restaurant Tables, or Takeaway POS will arrive here in real-time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((kot) => (
            <KotOrderCard
              key={kot.id}
              kot={kot}
              source={getOrderSource(kot)}
              checkedItems={checkedItems}
              isUpdating={updatingKotId === kot.id}
              onToggleItemChecked={onToggleItemChecked}
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

