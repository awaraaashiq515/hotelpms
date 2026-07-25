'use client';

import React from 'react';
import { OrderType, ORDER_TYPE_CONFIG } from './types';

interface OrderTypeSelectorProps {
  selected: OrderType;
  onChange: (type: OrderType) => void;
  postToRoom: boolean;
  setPostToRoom: (v: boolean) => void;
  roomFound: boolean;
}

export function OrderTypeSelector({
  selected, onChange, postToRoom, setPostToRoom, roomFound,
}: OrderTypeSelectorProps) {
  const cfg = ORDER_TYPE_CONFIG[selected];

  return (
    <div className="space-y-2">
      {/* Label */}
      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Order Type</p>

      {/* Type pills */}
      <div className="grid grid-cols-2 gap-1.5">
        {(Object.keys(ORDER_TYPE_CONFIG) as OrderType[]).map(type => {
          const c = ORDER_TYPE_CONFIG[type];
          const active = selected === type;
          return (
            <button
              key={type}
              onClick={() => {
                onChange(type);
                // Room Service always posts to room
                if (type === 'ROOM_SERVICE') setPostToRoom(true);
                // Takeaway never posts to room
                if (type === 'TAKEAWAY') setPostToRoom(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-left transition-all ${
                active ? `${c.bg} ${c.color}` : 'bg-white/[0.02] border-white/8 text-slate-600 hover:text-slate-400 hover:border-white/15'
              }`}
            >
              <span className="text-sm">{c.emoji}</span>
              <span className="text-[10px] font-bold leading-tight">{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Post-to-Room toggle — shown for Restaurant & Bar */}
      {(selected === 'RESTAURANT' || selected === 'BAR') && (
        <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
          postToRoom ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/[0.02] border-white/8'
        }`}>
          <div>
            <p className="text-[10px] font-bold text-white">Post charges to room?</p>
            <p className="text-[9px] text-slate-700">
              {roomFound ? 'Add to guest folio' : 'Find a room first'}
            </p>
          </div>
          <button
            type="button"
            disabled={!roomFound}
            onClick={() => setPostToRoom(!postToRoom)}
            className={`relative w-9 h-5 rounded-full transition-colors duration-300 disabled:opacity-30 ${postToRoom ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${postToRoom ? 'left-4' : 'left-0.5'}`} />
          </button>
        </div>
      )}

      {/* Active type description */}
      <p className="text-[9px] text-slate-700 font-bold pl-0.5">{cfg.desc}</p>
    </div>
  );
}
