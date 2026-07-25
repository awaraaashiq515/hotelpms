'use client';

import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { MenuItem, formatCurrency } from './types';

interface MenuItemCardProps {
  item: MenuItem;
  qty: number;
  onAdd: () => void;
  onDecrement: () => void;
}

export function MenuItemCard({ item, qty, onAdd, onDecrement }: MenuItemCardProps) {
  const hasItem = qty > 0;

  return (
    <div className={`relative group flex flex-col p-3.5 rounded-2xl border transition-all duration-200 ${
      hasItem
        ? 'bg-amber-500/5 border-amber-500/25'
        : 'bg-white/[0.02] border-white/8 hover:border-white/15 hover:bg-white/[0.04]'
    }`}>
      {/* Veg / Non-veg dot */}
      <div className="flex items-start justify-between mb-2">
        <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 mt-0.5 ${
          item.isVeg
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-red-500 bg-red-500/10'
        }`}>
          <div className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-emerald-400' : 'bg-red-400'}`} />
        </div>
        {/* Qty badge when item is in cart */}
        {hasItem && (
          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-900">
            ×{qty}
          </span>
        )}
      </div>

      {/* Item Name */}
      <p className="text-xs font-bold text-white leading-snug mb-1 flex-1">{item.name}</p>

      {/* Category */}
      {item.category && (
        <p className="text-[9px] text-slate-700 font-bold mb-2">{item.category.name}</p>
      )}

      {/* Price + Add button */}
      <div className="flex items-center justify-between mt-auto">
        <div>
          <p className="text-sm font-black text-white">{formatCurrency(item.sellingPrice)}</p>
          {item.halfPrice && (
            <p className="text-[9px] text-slate-700">½ {formatCurrency(item.halfPrice)}</p>
          )}
        </div>

        {/* Add / Qty controls */}
        {!hasItem ? (
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 transition-all text-[10px] font-black"
          >
            <Plus size={11} /> Add
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onDecrement}
              className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <Minus size={10} />
            </button>
            <span className="text-xs font-black text-amber-400 w-5 text-center">{qty}</span>
            <button
              onClick={onAdd}
              className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 hover:bg-amber-500/30 transition-all"
            >
              <Plus size={10} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
