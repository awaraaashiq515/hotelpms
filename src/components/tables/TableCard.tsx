import React from 'react';
import { Users, Clock, ShoppingBag, Layers, Utensils, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export type TableStatus = 'VACANT' | 'OCCUPIED' | 'KOT_RUNNING' | 'BILL_PRINTED' | 'BILLING_PENDING' | 'CLEANING';

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
  capacity: number;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  qrToken?: string | null;
  activeOrder?: {
    id: string;
    amount: number;
    itemCount: number;
    kotCount: number;
    elapsedTime: number; // minutes
  } | null;
}

interface TableCardProps {
  table: Table;
  onClick: (table: Table) => void;
  onPrintKOT?: (table: Table) => void;
  onPrintBill?: (table: Table) => void;
  onSwitchTable?: (table: Table) => void;
  onResetTable?: (table: Table) => void;
  isSelected?: boolean;
}

const STATUS_CONFIG: Record<TableStatus, {
  gradient: string;
  glow: string;
  badge: string;
  badgeText: string;
  label: string;
  dot: string;
  icon: React.ReactNode;
}> = {
  VACANT: {
    gradient: 'from-slate-800 via-slate-900 to-slate-950',
    glow: 'shadow-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    badgeText: 'Vacant',
    label: 'Available',
    dot: 'bg-emerald-400 shadow-emerald-400/60',
    icon: <CheckCircle size={13} className="text-emerald-400" />,
  },
  OCCUPIED: {
    gradient: 'from-rose-900 via-red-950 to-slate-950',
    glow: 'shadow-red-500/20',
    badge: 'bg-red-500/20 text-red-300 border-red-500/30',
    badgeText: 'Occupied',
    label: 'In Progress',
    dot: 'bg-red-400 shadow-red-400/60 animate-pulse',
    icon: <AlertCircle size={13} className="text-red-400" />,
  },
  KOT_RUNNING: {
    gradient: 'from-amber-900 via-orange-950 to-slate-950',
    glow: 'shadow-orange-500/20',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    badgeText: 'KOT Running',
    label: 'Cooking',
    dot: 'bg-orange-400 shadow-orange-400/60 animate-pulse',
    icon: <Utensils size={13} className="text-orange-400" />,
  },
  BILL_PRINTED: {
    gradient: 'from-blue-900 via-indigo-950 to-slate-950',
    glow: 'shadow-blue-500/20',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    badgeText: 'Bill Printed',
    label: 'Awaiting Payment',
    dot: 'bg-blue-400 shadow-blue-400/60',
    icon: <Layers size={13} className="text-blue-400" />,
  },
  BILLING_PENDING: {
    gradient: 'from-violet-900 via-purple-950 to-slate-950',
    glow: 'shadow-violet-500/20',
    badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    badgeText: 'Billing',
    label: 'Pending Payment',
    dot: 'bg-violet-400 shadow-violet-400/60 animate-pulse',
    icon: <Loader2 size={13} className="text-violet-400 animate-spin" />,
  },
  CLEANING: {
    gradient: 'from-slate-700 via-slate-800 to-slate-950',
    glow: 'shadow-slate-400/10',
    badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    badgeText: 'Cleaning',
    label: 'Being Cleaned',
    dot: 'bg-slate-400 shadow-slate-400/60',
    icon: <Loader2 size={13} className="text-slate-400 animate-spin" />,
  },
};

export const TableCard: React.FC<TableCardProps> = ({ 
  table, 
  onClick, 
  onPrintKOT, 
  onPrintBill, 
  onSwitchTable, 
  onResetTable,
  isSelected 
}) => {
  const config = STATUS_CONFIG[table.status] || STATUS_CONFIG.VACANT;
  const isActive = !!table.activeOrder && table.status !== 'VACANT' && table.status !== 'CLEANING';

  const formatTime = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div
      onClick={() => onClick(table)}
      className={`relative group cursor-pointer w-full h-full transition-all duration-300 ${
        isSelected 
          ? 'scale-[1.04] z-30' 
          : 'hover:-translate-y-1 hover:scale-[1.02]'
      }`}
    >
      {/* Card Shell */}
      <div
        className={`
          w-full h-full rounded-2xl flex flex-col overflow-hidden
          bg-gradient-to-br ${config.gradient}
          border transition-all duration-300
          ${isSelected 
            ? 'border-indigo-400 ring-4 ring-indigo-500/30 shadow-2xl shadow-indigo-500/20' 
            : `border-white/8 shadow-xl ${config.glow}`
          }
        `}
        style={{
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        {/* Top accent bar */}
        <div className={`h-[3px] w-full ${
          table.status === 'VACANT' ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500' :
          table.status === 'OCCUPIED' ? 'bg-gradient-to-r from-red-400 via-rose-400 to-red-500' :
          table.status === 'KOT_RUNNING' ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500' :
          table.status === 'BILL_PRINTED' ? 'bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500' :
          table.status === 'BILLING_PENDING' ? 'bg-gradient-to-r from-violet-400 via-purple-400 to-violet-500' :
          'bg-gradient-to-r from-slate-400 via-gray-400 to-slate-500'
        }`} />

        {/* Header */}
        <div className="px-4 pt-3 pb-2 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            {/* Table Number */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${config.dot} shadow-lg`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Table
              </span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight leading-none">
              {table.name}
            </h3>
          </div>

          {/* Status Pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${config.badge}`}>
            {config.icon}
            {config.badgeText}
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-white/5" />

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-center">
          {isActive ? (
            <div className="flex flex-col gap-3">
              {/* Amount Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                    <ShoppingBag size={15} className="text-white/70" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Total</p>
                    <p className="text-base font-black text-white leading-none">
                      ₹{table.activeOrder!.amount.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Items</p>
                  <p className="text-base font-black text-white leading-none">{table.activeOrder!.itemCount}</p>
                </div>
              </div>

              {/* Footer Row */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <Clock size={11} className="text-white/30" />
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    {formatTime(table.activeOrder!.elapsedTime)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers size={11} className="text-white/30" />
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">
                    {table.activeOrder!.kotCount} KOT
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Vacant / Cleaning
            <div className="flex flex-col items-center justify-center gap-2 py-2 opacity-30">
              <div className="w-10 h-10 rounded-xl border border-dashed border-current flex items-center justify-center">
                <PlusIcon size={18} />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-center">
                {config.label}
              </p>
            </div>
          )}
        </div>

        {/* Seats Footer */}
        <div className="px-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/30">
            <Users size={11} />
            <span className="text-[10px] font-bold">{table.capacity} seats</span>
          </div>
          {isSelected && (
            <div className="flex items-center gap-1 text-indigo-300 text-[9px] font-black uppercase tracking-wider">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
              Selected
            </div>
          )}
        </div>

        {/* Hover shimmer overlay for vacant */}
        {!isActive && !isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/5 group-hover:via-transparent group-hover:to-transparent rounded-2xl transition-all duration-500 pointer-events-none" />
        )}
      </div>
    </div>
  );
};

const PlusIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
