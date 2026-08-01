import React, { useState } from 'react';
import { Package, Edit2, TrendingUp, TrendingDown } from 'lucide-react';
import type { StockItem } from './LowStockAlert';

interface StockTableProps {
  items: StockItem[];
  onEdit?: (item: StockItem) => void;
}

function StockBar({ current, max, reorder }: { current: number; max: number; reorder: number }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  const color = current <= reorder ? 'bg-rose-500' : current <= reorder * 2 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StockTable({ items, onEdit }: StockTableProps) {
  const [sort, setSort] = useState<'name' | 'stock' | 'value'>('name');

  const sorted = [...items].sort((a, b) => {
    if (sort === 'stock')   return a.currentStock - b.currentStock;
    if (sort === 'value')   return (b.currentStock * b.unitCost) - (a.currentStock * a.unitCost);
    return a.name.localeCompare(b.name);
  });

  const headers = [
    { key: 'name',  label: 'Item' },
    { key: 'stock', label: 'Stock' },
    { key: 'value', label: 'Value' },
  ] as const;

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Item & Category', 'Unit', ...headers.slice(1).map(h=>h.label), 'Level', 'Supplier', 'Action'].map((h, i) => (
                <th key={i} className="text-left px-4 py-3 text-[9px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(item => {
              const isLow = item.currentStock <= item.reorderLevel;
              const value = item.currentStock * item.unitCost;
              return (
                <tr key={item.id} className={`border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors ${isLow ? 'bg-rose-900/5' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isLow ? 'bg-rose-500/15' : 'bg-slate-800'}`}>
                        <Package size={12} className={isLow ? 'text-rose-400' : 'text-slate-500'} />
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-white">{item.name}</p>
                        <p className="text-[9px] text-slate-500">{item.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-400">{item.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[12px] font-black ${isLow ? 'text-rose-300' : 'text-white'}`}>
                      {item.currentStock}
                    </span>
                    <span className="text-[9px] text-slate-600 ml-1">/ {item.maxStock}</span>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-300">
                    ₹{value.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <StockBar current={item.currentStock} max={item.maxStock} reorder={item.reorderLevel} />
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-500">{item.supplier || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => onEdit?.(item)}
                      className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                      <Edit2 size={10} /> Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
