import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, Clock, ShoppingBag, Layers } from 'lucide-react';

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
}

export const TableCard: React.FC<TableCardProps> = ({ table, onClick, onPrintKOT, onPrintBill, onSwitchTable }) => {
  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'VACANT': return 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-100';
      case 'OCCUPIED': return 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-100';
      case 'KOT_RUNNING': return 'bg-orange-500 text-white border-orange-600 shadow-lg shadow-orange-100';
      case 'BILL_PRINTED': return 'bg-blue-500 text-white border-blue-600 shadow-lg shadow-blue-100';
      case 'BILLING_PENDING': return 'bg-purple-600 text-white border-purple-700 shadow-lg shadow-purple-100';
      case 'CLEANING': return 'bg-gray-400 text-white border-gray-500 shadow-lg shadow-gray-100';
      default: return 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200';
    }
  };

  const getBadgeVariant = (status: TableStatus): 'info' | 'warning' | 'error' | 'neutral' | 'indigo' | 'success' => {
    switch (status) {
      case 'VACANT': return 'success';
      case 'OCCUPIED': return 'error';
      case 'KOT_RUNNING': return 'warning';
      case 'BILL_PRINTED': return 'info';
      case 'BILLING_PENDING': return 'error';
      case 'CLEANING': return 'neutral';
      default: return 'neutral';
    }
  };

  const isActive = !!table.activeOrder || (table.status !== 'VACANT' && table.status !== 'CLEANING');

  return (
    <div 
      onClick={() => onClick(table)}
      className={`relative group cursor-pointer w-full h-full transition-all duration-300 active:scale-95 ${
        isActive ? 'hover:-translate-y-1' : 'hover:scale-[1.02]'
      }`}
    >
      <div 
        className={`w-full h-full p-0 overflow-hidden border-2 rounded-2xl flex flex-col transition-all duration-300 shadow-xl ${getStatusColor(table.status)}`}
      >
        {/* Table Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/20 bg-black/5">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-white">
              {table.name}
            </h3>
            <div className="flex items-center gap-1 opacity-60">
              <Users size={12} />
              <span className="text-[10px] font-bold">{table.capacity} Chairs</span>
            </div>
          </div>
          <Badge 
            variant={getBadgeVariant(table.status)} 
            className="uppercase text-[9px] font-black tracking-widest px-2 py-1 bg-white/20 text-white border-white/30"
          >
            {table.status.replace('_', ' ')}
          </Badge>
        </div>

        {/* Table Content */}
        <div className="flex-1 p-4 flex flex-col justify-center gap-2">
          {table.activeOrder && table.status !== 'VACANT' && table.status !== 'CLEANING' ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <ShoppingBag size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/70 uppercase">Amount</p>
                    <p className="text-sm font-black text-white">₹{table.activeOrder.amount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-white/70 uppercase">Items</p>
                  <p className="text-sm font-black text-white">{table.activeOrder.itemCount}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/10 mt-1">
                <div className="flex items-center gap-1.5 text-white/80">
                  <Clock size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{table.activeOrder.elapsedTime}m elapsed</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/80">
                  <Layers size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">{table.activeOrder.kotCount} KOT</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center opacity-40 py-2">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-current mb-2 flex items-center justify-center">
                <Plus size={20} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">Available</p>
            </div>
          )}
        </div>

        {/* Action Overlay */}
        {!isActive ? (
          <div className="absolute inset-0 bg-indigo-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none">
            <span className="text-white font-black text-xs uppercase tracking-widest">Open New Order</span>
          </div>
        ) : (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl gap-2 backdrop-blur-sm z-20">
            {table.activeOrder?.kotCount ? (
              <button 
                className="bg-white/20 hover:bg-white/40 text-white w-3/4 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-colors border border-white/20"
                onClick={(e) => { e.stopPropagation(); onPrintKOT?.(table); }}
              >
                Print KOT
              </button>
            ) : null}
            <button 
              className="bg-pos-primary hover:bg-red-600 text-white w-3/4 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-colors shadow-lg"
              onClick={(e) => { e.stopPropagation(); onPrintBill?.(table); }}
            >
              Print Bill
            </button>
            <button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-3/4 py-2 rounded font-black text-[10px] uppercase tracking-widest transition-colors shadow-lg"
              onClick={(e) => { e.stopPropagation(); onSwitchTable?.(table); }}
            >
              Switch Table
            </button>
            <button 
              className="mt-2 text-white/70 hover:text-white text-[9px] uppercase tracking-widest font-black"
              onClick={(e) => { e.stopPropagation(); onClick(table); }}
            >
              View Order ➔
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const Plus = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
