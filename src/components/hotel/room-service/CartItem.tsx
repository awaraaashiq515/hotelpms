'use client';

import React, { useState } from 'react';
import { Minus, Plus, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { CartLineItem, formatCurrency } from './types';

interface CartItemProps {
  item: CartLineItem;
  onAdd: () => void;
  onDecrement: () => void;
  onRemove: () => void;
  onNoteChange: (note: string) => void;
}

export function CartItem({ item, onAdd, onDecrement, onRemove, onNoteChange }: CartItemProps) {
  const [showNote, setShowNote] = useState(!!item.note);

  return (
    <div className="border-b border-white/[0.05] pb-3 last:border-0 last:pb-0">
      <div className="flex items-start gap-2">
        {/* Veg dot */}
        <div className={`w-3 h-3 rounded-sm border-2 mt-1 shrink-0 ${
          item.menuItem.isVeg ? 'border-emerald-500 bg-emerald-500/15' : 'border-red-500 bg-red-500/15'
        }`}>
          <div className={`w-full h-full scale-[0.5] rounded-full ${item.menuItem.isVeg ? 'bg-emerald-400' : 'bg-red-400'}`} />
        </div>

        {/* Name + price */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white leading-tight truncate">{item.menuItem.name}</p>
          <p className="text-[10px] text-slate-600 font-bold">{formatCurrency(item.unitPrice)} each</p>
        </div>

        {/* Qty controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onDecrement}
            className="w-5 h-5 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <Minus size={9} />
          </button>
          <span className="text-xs font-black text-white w-5 text-center">{item.qty}</span>
          <button
            onClick={onAdd}
            className="w-5 h-5 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400 hover:bg-amber-500/25 transition-all"
          >
            <Plus size={9} />
          </button>
        </div>

        {/* Line total */}
        <p className="text-xs font-black text-amber-400 w-14 text-right shrink-0">
          {formatCurrency(item.lineTotal)}
        </p>

        {/* Delete */}
        <button
          onClick={onRemove}
          className="text-slate-700 hover:text-red-400 transition-colors ml-1 shrink-0"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Note toggle */}
      <div className="mt-2 ml-5">
        <button
          onClick={() => setShowNote(p => !p)}
          className="flex items-center gap-1 text-[9px] font-bold text-slate-700 hover:text-slate-400 transition-colors"
        >
          <MessageSquare size={9} />
          {item.note ? 'Edit note' : 'Add note'}
          {showNote ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
        </button>
        {showNote && (
          <input
            type="text"
            value={item.note}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="e.g. no onion, extra spicy…"
            className="mt-1.5 w-full px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/8 text-[10px] font-semibold text-white placeholder-slate-700 focus:outline-none focus:border-amber-500/30 transition-all"
          />
        )}
      </div>
    </div>
  );
}
