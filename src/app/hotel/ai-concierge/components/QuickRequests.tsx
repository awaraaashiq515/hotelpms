import React from 'react';
import { Zap } from 'lucide-react';

const QUICK_REQUESTS = [
  { emoji: '🛎️', label: 'Room Service',      msg: 'I would like to order room service' },
  { emoji: '🧖', label: 'Spa Booking',       msg: 'Book a spa appointment' },
  { emoji: '🚖', label: 'Airport Taxi',      msg: 'Book airport taxi' },
  { emoji: '🛁', label: 'Extra Towels',      msg: 'Request extra towels' },
  { emoji: '❄️', label: 'AC Issue',          msg: 'My AC is not working properly' },
  { emoji: '🔇', label: 'Do Not Disturb',    msg: 'Please put DND on my room' },
  { emoji: '🍽️', label: 'Table Booking',     msg: 'Book a restaurant table for dinner' },
  { emoji: '🧹', label: 'Housekeeping',      msg: 'Please clean my room' },
  { emoji: '🔑', label: 'Lost Key Card',     msg: 'I lost my key card' },
  { emoji: '👶', label: 'Extra Bed/Crib',    msg: 'Need an extra bed or baby crib' },
  { emoji: '💊', label: 'Medical Help',      msg: 'I need medical assistance' },
  { emoji: '🌐', label: 'WiFi Problem',      msg: 'My WiFi connection is not working' },
];

interface QuickRequestsProps { onSelect: (msg: string) => void }

export function QuickRequests({ onSelect }: QuickRequestsProps) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={13} className="text-amber-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-wider">Quick Requests</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-2">
        {QUICK_REQUESTS.map(req => (
          <button key={req.label} onClick={() => onSelect(req.msg)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-white/5 hover:border-indigo-500/30 transition-all text-center group">
            <span className="text-xl group-hover:scale-110 transition-transform">{req.emoji}</span>
            <span className="text-[8px] font-black text-slate-400 group-hover:text-white uppercase tracking-wide leading-tight">{req.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
