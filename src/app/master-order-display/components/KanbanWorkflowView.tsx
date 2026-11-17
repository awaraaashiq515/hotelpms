'use client';

import React from 'react';
import { Flame, ChefHat, Bell, CheckCircle2 } from 'lucide-react';
import { MasterTicket } from './types';
import { MasterOrderCard } from './MasterOrderCard';

interface KanbanWorkflowViewProps {
  tickets: MasterTicket[];
  checkedItems: Record<string, boolean>;
  updatingKotId: string | null;
  onToggleCheckItem: (itemId: string) => void;
  onUpdateStatus: (kotId: string, status: 'PREPARING' | 'READY' | 'SERVED') => void;
  onPrintTicket?: (ticket: MasterTicket) => void;
}

export const KanbanWorkflowView: React.FC<KanbanWorkflowViewProps> = ({
  tickets,
  checkedItems,
  updatingKotId,
  onToggleCheckItem,
  onUpdateStatus,
  onPrintTicket,
}) => {
  const newOrders = tickets.filter((t) => t.status === 'NEW');
  const preparingOrders = tickets.filter((t) => t.status === 'PREPARING');
  const readyOrders = tickets.filter((t) => t.status === 'READY');
  const servedOrders = tickets.filter((t) => ['SERVED', 'COMPLETED'].includes(t.status));

  const columns = [
    {
      id: 'NEW',
      title: 'New Orders',
      subtitle: 'Needs Acceptance',
      icon: Flame,
      tickets: newOrders,
      borderCls: 'border-red-500/30',
      badgeCls: 'bg-red-600 text-white animate-pulse',
      headerBg: 'from-red-950 via-[#1c0f14] to-[#080d1a]',
      accentCls: 'text-red-400',
    },
    {
      id: 'PREPARING',
      title: 'In Preparation',
      subtitle: 'Cooking / Pouring',
      icon: ChefHat,
      tickets: preparingOrders,
      borderCls: 'border-amber-500/30',
      badgeCls: 'bg-amber-600 text-white',
      headerBg: 'from-amber-950 via-[#1c160f] to-[#080d1a]',
      accentCls: 'text-amber-400',
    },
    {
      id: 'READY',
      title: 'Ready to Serve',
      subtitle: 'Pickup / Dispatch',
      icon: Bell,
      tickets: readyOrders,
      borderCls: 'border-emerald-500/30',
      badgeCls: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30',
      headerBg: 'from-emerald-950 via-[#0e1d16] to-[#080d1a]',
      accentCls: 'text-emerald-400',
    },
    {
      id: 'SERVED',
      title: 'Served / Dispatched',
      subtitle: 'Recent Completed',
      icon: CheckCircle2,
      tickets: servedOrders,
      borderCls: 'border-slate-800',
      badgeCls: 'bg-slate-800 text-slate-300',
      headerBg: 'from-slate-900 via-[#0d121c] to-[#080d1a]',
      accentCls: 'text-slate-400',
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
            {/* Header */}
            <div className={`p-4 bg-gradient-to-b ${col.headerBg} border-b border-white/5 flex items-center justify-between`}>
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

              <span className={`px-3 py-1 rounded-full text-xs font-black shadow-md ${col.badgeCls}`}>
                {col.tickets.length}
              </span>
            </div>

            {/* List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              {col.tickets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center opacity-40 select-none">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3 text-slate-500">
                    <ColIcon size={28} />
                  </div>
                  <p className="text-sm font-bold text-slate-300">No {col.title}</p>
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

