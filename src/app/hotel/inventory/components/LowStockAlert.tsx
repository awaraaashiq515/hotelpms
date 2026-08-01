import React from 'react';
import { AlertTriangle, Package } from 'lucide-react';

export interface StockItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  maxStock: number;
  unitCost: number;
  supplier?: string;
  lastRestocked?: string;
}

interface LowStockAlertProps { items: StockItem[] }

export function LowStockAlert({ items }: LowStockAlertProps) {
  const low = items.filter(i => i.currentStock <= i.reorderLevel);
  if (low.length === 0) return null;

  return (
    <div className="rounded-2xl border border-rose-500/20 bg-rose-900/10 p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-rose-400 animate-pulse" />
          <span className="text-sm font-black text-rose-300">
            {low.length} Item{low.length > 1 ? 's' : ''} Need Restock
          </span>
        </div>
        <a
          href="/hotel/vendor?tab=restock"
          className="text-[10px] font-black text-rose-300 bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1 rounded-xl border border-rose-500/30 transition-all flex items-center gap-1 uppercase tracking-wider"
        >
          View Restock List & Order →
        </a>
      </div>
      <div className="space-y-2">
        {low.slice(0, 5).map(item => (
          <div key={item.id} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-2">
              <Package size={10} className="text-slate-500" />
              <span className="text-[11px] font-semibold text-white">{item.name}</span>
              <span className="text-[9px] text-slate-500">{item.category}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-rose-300 font-black">
                {item.currentStock} {item.unit}
              </span>
              <span className="text-[9px] text-slate-600">
                min: {item.reorderLevel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
