import React from 'react';
import { Package, AlertTriangle, IndianRupee, TrendingDown } from 'lucide-react';
import type { StockItem } from './LowStockAlert';

interface StockStatsProps { items: StockItem[] }

export function StockStats({ items }: StockStatsProps) {
  const totalValue    = items.reduce((s, i) => s + i.currentStock * i.unitCost, 0);
  const lowStock      = items.filter(i => i.currentStock <= i.reorderLevel).length;
  const outOfStock    = items.filter(i => i.currentStock === 0).length;
  const totalItems    = items.length;

  const stats = [
    { label: 'Total Items',   value: totalItems,                                          icon: Package,      color: 'text-indigo-300 border-indigo-500/20 bg-indigo-900/20' },
    { label: 'Low Stock',     value: lowStock,                                            icon: AlertTriangle,color: 'text-amber-300 border-amber-500/20 bg-amber-900/20' },
    { label: 'Out of Stock',  value: outOfStock,                                          icon: TrendingDown, color: 'text-rose-300 border-rose-500/20 bg-rose-900/20' },
    { label: 'Total Value',   value: `₹${Math.round(totalValue/1000)}K`,                 icon: IndianRupee,  color: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
          <s.icon size={15} className="mb-2 opacity-70" />
          <p className="text-2xl font-black text-white">{s.value}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
