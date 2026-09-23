'use client';

import React, { useState } from 'react';
import { Zap, Sparkles, Check } from 'lucide-react';

const QUICK_REQUESTS = [
  { emoji: '🛎️', label: 'Room Service',   category: 'Dining',       msg: 'I would like to order room service from the chef special menu' },
  { emoji: '🧖', label: 'Spa Booking',    category: 'Wellness',     msg: 'Please book a spa appointment for today afternoon' },
  { emoji: '🚖', label: 'Airport Taxi',   category: 'Transit',      msg: 'I need to book an airport taxi sedan for departure' },
  { emoji: '🛁', label: 'Extra Towels',   category: 'Housekeeping', msg: 'Please send 2 extra fresh bath towels and toiletries to my room' },
  { emoji: '❄️', label: 'AC Issue',       category: 'Maintenance',  msg: 'My room air conditioning is not cooling properly' },
  { emoji: '🔇', label: 'Do Not Disturb', category: 'Privacy',      msg: 'Please activate Do Not Disturb (DND) for my room' },
  { emoji: '🍽️', label: 'Table Booking',  category: 'Dining',       msg: 'Book a table for 2 at The Spice Garden for dinner' },
  { emoji: '🧹', label: 'Room Cleaning',  category: 'Housekeeping', msg: 'Please send housekeeping to clean and make my room' },
  { emoji: '🔑', label: 'Key Card Help',  category: 'Reception',    msg: 'My key card stopped working on the door' },
  { emoji: '🕒', label: 'Late Checkout',  category: 'Reception',    msg: 'Can I request a complimentary late checkout until 1:00 PM?' },
  { emoji: '💊', label: 'Medical Help',   category: 'Emergency',    msg: 'I need immediate medical assistance or doctor on call' },
  { emoji: '📶', label: 'WiFi Password',  category: 'Amenities',    msg: 'What is the high-speed Wi-Fi network and password?' },
];

interface QuickRequestsProps {
  onSelect: (msg: string) => void;
  activeRoom?: string;
}

export function QuickRequests({ onSelect, activeRoom }: QuickRequestsProps) {
  const [clickedItem, setClickedItem] = useState<string | null>(null);

  const handleClick = (req: typeof QUICK_REQUESTS[0]) => {
    setClickedItem(req.label);
    onSelect(req.msg);
    setTimeout(() => setClickedItem(null), 800);
  };

  return (
    <div className="rounded-2xl bg-slate-900/60 border border-white/10 p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap size={13} />
          </div>
          <span className="text-[11px] font-black text-white uppercase tracking-wider">
            Quick Guest Request Dispatcher
          </span>
        </div>
        {activeRoom && (
          <span className="text-[9px] font-bold text-violet-300 bg-violet-950/60 border border-violet-500/20 px-2 py-0.5 rounded-full">
            Targeting Room {activeRoom}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2">
        {QUICK_REQUESTS.map(req => {
          const isClicked = clickedItem === req.label;
          return (
            <button
              key={req.label}
              onClick={() => handleClick(req)}
              className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl border transition-all text-center group relative overflow-hidden ${
                isClicked
                  ? 'bg-emerald-950/60 border-emerald-500/50 scale-95 shadow-lg shadow-emerald-900/30'
                  : 'bg-slate-800/60 hover:bg-slate-700/80 border-white/5 hover:border-violet-500/40 hover:-translate-y-0.5'
              }`}
            >
              <span className="text-lg group-hover:scale-110 transition-transform">
                {isClicked ? '✅' : req.emoji}
              </span>
              <span className="text-[9px] font-black text-slate-300 group-hover:text-white uppercase tracking-tight leading-tight">
                {req.label}
              </span>
              <span className="text-[7px] text-slate-500 font-bold uppercase tracking-widest">
                {req.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
