'use client';

import React from 'react';
import { Clock, Check, Flame, CheckCircle2, CheckCheck, BedDouble, Utensils, ShoppingBag } from 'lucide-react';
import { KotTicket } from './types';

interface KotOrderCardProps {
  kot: KotTicket;
  source: 'ROOMS' | 'RESTAURANT' | 'TAKEAWAY';
  checkedItems: Record<string, boolean>;
  isUpdating: boolean;
  onToggleItemChecked: (itemId: string) => void;
  onUpdateStatus: (kotId: string, status: 'PREPARING' | 'READY' | 'SERVED') => void;
}

export const KotOrderCard: React.FC<KotOrderCardProps> = ({
  kot,
  source,
  checkedItems,
  isUpdating,
  onToggleItemChecked,
  onUpdateStatus,
}) => {
  const isNew = kot.status === 'NEW';
  const isPrep = kot.status === 'PREPARING';
  const isReady = kot.status === 'READY';

  // Destination Resolution
  let destinationText = 'Takeaway';
  let destinationIcon = <ShoppingBag size={13} />;
  let destinationBadgeClass = 'bg-slate-800 text-slate-300 border-slate-700';

  if (source === 'ROOMS') {
    const roomNo =
      kot.room?.roomNumber ||
      kot.order?.tableNo?.replace(/room/i, '').trim() ||
      kot.order?.roomId ||
      'Room Service';
    const floor = kot.room?.floor ? ` (Fl. ${kot.room.floor})` : '';
    destinationText = `Room ${roomNo}${floor}`;
    destinationIcon = <BedDouble size={14} className="text-indigo-400" />;
    destinationBadgeClass = 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40 shadow-sm shadow-indigo-900/20';
  } else if (source === 'RESTAURANT') {
    const tbl = kot.table?.name || kot.order?.tableNo || 'Table';
    const floor = kot.table?.floor?.name ? ` • ${kot.table.floor.name}` : '';
    destinationText = `${tbl}${floor}`;
    destinationIcon = <Utensils size={13} className="text-emerald-400" />;
    destinationBadgeClass = 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
  }

  // Minutes elapsed calculation
  const minsElapsed = Math.floor(
    (Date.now() - new Date(kot.createdAt).getTime()) / 60000
  );

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border transition shadow-xl overflow-hidden ${isNew
          ? 'bg-[#0e1629] border-rose-500/70 ring-1 ring-rose-500/30'
          : isPrep
            ? 'bg-[#0e1629] border-indigo-500/60 ring-1 ring-indigo-500/20'
            : 'bg-[#0e1629] border-emerald-500/60'
        }`}
    >
      {/* Card Header */}
      <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white tracking-wider">
              KOT #{kot.kotNo}
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${isNew
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : isPrep
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
            >
              {kot.status}
            </span>
          </div>

          {/* Destination Badge (Room or Table) */}
          <div
            className={`text-xs font-black px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${destinationBadgeClass}`}
          >
            {destinationIcon}
            <span className="truncate max-w-[150px]">{destinationText}</span>
          </div>
        </div>

        {/* Order Subtext */}
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-slate-500" />
            <span>
              {new Date(kot.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span
              className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded ${minsElapsed > 25
                  ? 'bg-rose-500/20 text-rose-300'
                  : minsElapsed > 15
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
            >
              {minsElapsed}m ago
            </span>
          </div>
          {kot.order?.guest && (
            <span className="font-semibold text-slate-300 truncate max-w-[140px]">
              👤 {kot.order.guest.firstName} {kot.order.guest.lastName || ''}
            </span>
          )}
        </div>

        {kot.order?.orderNo && (
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            Order Ref: #{kot.order.orderNo}
          </div>
        )}

        {(kot.order as any)?.notes && (
          <div className="mt-2 text-[11px] p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 font-medium">
            <span className="font-bold">Note: </span>
            {(kot.order as any).notes}
          </div>
        )}
      </div>

      {/* Items List with Interactive Checkboxes */}
      <div className="p-3.5 sm:p-4 divide-y divide-slate-800/80 flex-1">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
          <span>Items to Prepare</span>
          <span>Tap dish when done</span>
        </div>
        {kot.items.map((item) => {
          const isItemDone = !!checkedItems[item.id];
          return (
            <div
              key={item.id}
              onClick={() => onToggleItemChecked(item.id)}
              className={`py-2.5 flex items-start justify-between gap-3 cursor-pointer select-none transition ${isItemDone ? 'opacity-40 line-through' : 'hover:bg-slate-800/40'
                }`}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition shrink-0 ${isItemDone
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'border-slate-700 bg-slate-800'
                    }`}
                >
                  {isItemDone && <Check size={13} className="stroke-[3]" />}
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-100">
                    {item.itemName}
                  </span>
                  {item.notes && (
                    <p className="text-[11px] text-amber-300 font-medium mt-0.5">
                      ⚠️ {item.notes}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-sm font-black px-2.5 py-1 rounded-lg bg-slate-800/90 border border-slate-700 text-indigo-300 shrink-0">
                ×{item.quantity}
              </div>
            </div>
          );
        })}
      </div>

      {/* Speed Action Buttons */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-900/70">
        {isNew && (
          <button
            onClick={() => onUpdateStatus(kot.id, 'PREPARING')}
            disabled={isUpdating}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-[0.98] transition disabled:opacity-50"
          >
            <Flame size={15} />
            <span>{isUpdating ? 'Updating...' : 'Start Cooking / Preparing'}</span>
          </button>
        )}

        {isPrep && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdateStatus(kot.id, 'READY')}
              disabled={isUpdating}
              className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition disabled:opacity-50"
            >
              <CheckCircle2 size={15} />
              <span>{isUpdating ? 'Saving...' : 'Mark Food Ready'}</span>
            </button>
            <button
              onClick={() => onUpdateStatus(kot.id, 'SERVED')}
              disabled={isUpdating}
              className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 active:scale-[0.98] transition disabled:opacity-50"
            >
              <CheckCheck size={15} />
              <span>Direct Served</span>
            </button>
          </div>
        )}

        {isReady && (
          <button
            onClick={() => onUpdateStatus(kot.id, 'SERVED')}
            disabled={isUpdating}
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/25 active:scale-[0.98] transition disabled:opacity-50"
          >
            <CheckCheck size={16} />
            <span>{isUpdating ? 'Closing...' : 'Complete & Mark Served'}</span>
          </button>
        )}
      </div>
    </div>
  );
};

