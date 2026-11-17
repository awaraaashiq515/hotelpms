'use client';

import React from 'react';
import { BedDouble, Utensils, Wine, ShoppingBag, Clock, Sparkles } from 'lucide-react';
import { MasterTicket } from './types';
import { MasterOrderCard } from './MasterOrderCard';

interface SplitDepartmentViewProps {
  tickets: MasterTicket[];
  checkedItems: Record<string, boolean>;
  updatingKotId: string | null;
  onToggleCheckItem: (itemId: string) => void;
  onUpdateStatus: (kotId: string, status: 'PREPARING' | 'READY' | 'SERVED') => void;
  onPrintTicket?: (ticket: MasterTicket) => void;
}

export const SplitDepartmentView: React.FC<SplitDepartmentViewProps> = ({
  tickets,
  checkedItems,
  updatingKotId,
  onToggleCheckItem,
  onUpdateStatus,
  onPrintTicket,
}) => {
  // Separate into Department buckets
  const roomServiceTickets = tickets.filter((t) => t.sourceCategory === 'ROOM_SERVICE');
  const restaurantTickets = tickets.filter((t) => t.sourceCategory === 'RESTAURANT');
  const barTickets = tickets.filter((t) => t.sourceCategory === 'BAR' || t.hasBarItems);
  const takeawayTickets = tickets.filter((t) => t.sourceCategory === 'TAKEAWAY');

  const columns = [
    {
      id: 'room-service',
      title: 'Room Service',
      subtitle: 'Hotel Guest Rooms',
      icon: BedDouble,
      tickets: roomServiceTickets,
      badgeCls: 'bg-indigo-600 text-white',
      borderCls: 'border-indigo-500/30',
      headerGradient: 'from-indigo-950 via-[#0d1426] to-[#080d1a]',
      accentCls: 'text-indigo-400',
    },
    {
      id: 'restaurant',
      title: 'Restaurant Dining',
      subtitle: 'Dine-In Tables & Floors',
      icon: Utensils,
      tickets: restaurantTickets,
      badgeCls: 'bg-emerald-600 text-white',
      borderCls: 'border-emerald-500/30',
      headerGradient: 'from-emerald-950 via-[#0d1f1e] to-[#080d1a]',
      accentCls: 'text-emerald-400',
    },
    {
      id: 'bar',
      title: 'Bar & Lounge',
      subtitle: 'Cocktails, Liquor & Drinks',
      icon: Wine,
      tickets: barTickets,
      badgeCls: 'bg-gradient-to-r from-amber-600 to-rose-600 text-white',
      borderCls: 'border-amber-500/30',
      headerGradient: 'from-amber-950 via-[#1f121d] to-[#080d1a]',
      accentCls: 'text-amber-400',
    },
    {
      id: 'takeaway',
      title: 'Takeaway & Del.',
      subtitle: 'Pickups & Online Orders',
      icon: ShoppingBag,
      tickets: takeawayTickets,
      badgeCls: 'bg-cyan-600 text-white',
      borderCls: 'border-cyan-500/30',
      headerGradient: 'from-cyan-950 via-[#0d1c24] to-[#080d1a]',
      accentCls: 'text-cyan-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-190px)] min-h-[500px]">
      {columns.map((col) => {
        const ColIcon = col.icon;
        return (
          <div
            key={col.id}
            className={`flex flex-col bg-[#080c16] rounded-3xl border ${col.borderCls} overflow-hidden shadow-2xl`}
          >
            {/* Column Header */}
            <div className={`p-4 bg-gradient-to-b ${col.headerGradient} border-b border-white/5 flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-black/40 border border-white/10 ${col.accentCls}`}>
                  <ColIcon size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                    {col.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {col.subtitle}
                  </p>
                </div>
              </div>

              {/* Order Count Badge */}
              <div className="flex flex-col items-end">
                <span className={`px-3 py-1 rounded-full text-xs font-black shadow-md ${col.badgeCls}`}>
                  {col.tickets.length} {col.tickets.length === 1 ? 'Order' : 'Orders'}
                </span>
              </div>
            </div>

            {/* Scrollable Column Content */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {col.tickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40 select-none">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
                    <ColIcon size={28} />
                  </div>
                  <p className="text-sm font-bold text-slate-300">No Active {col.title} Orders</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                    New orders placed will show up here automatically.
                  </p>
                </div>
              ) : (
                col.tickets.map((ticket) => (
                  <MasterOrderCard
                    key={ticket.id}
                    ticket={ticket}
                    checkedItems={checkedItems}
                    isUpdating={updatingKotId === ticket.id}
                    onToggleCheckItem={onToggleCheckItem}
                    onUpdateStatus={onUpdateStatus}
                    onPrintTicket={onPrintTicket}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

