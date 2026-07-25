import React from 'react';
import { MapPin, Ticket } from 'lucide-react';
import { SectionCard } from '@/components/hotel/ui/SectionCard';
import type { LocalEvent } from '@/types/hotel/dashboard.types';

function getMockEvents(): LocalEvent[] {
  return [
    { name: 'Tech Summit 2026',      date: 'Today',    category: 'Conference',    distance: '2 km' },
    { name: 'Monsoon Food Festival', date: 'Tomorrow', category: 'Festival',      distance: '0.5 km' },
    { name: 'Bollywood Concert',     date: 'Sat',      category: 'Entertainment', distance: '3 km' },
    { name: 'IPL: MI vs CSK',        date: 'Sun',      category: 'Sports',        distance: '5 km' },
  ];
}

export function LocalEvents() {
  const events = getMockEvents();
  return (
    <SectionCard title="Local Events" icon={MapPin} iconColor="text-pink-400">
      <div className="px-4 divide-y divide-white/5">
        {events.map((e, i) => (
          <div key={i} className="py-2.5 flex items-start gap-2">
            <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
              <Ticket size={10} className="text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-black text-white truncate">{e.name}</p>
              <p className="text-[9px] text-slate-500">{e.date}{e.distance ? ` · ${e.distance}` : ''}</p>
            </div>
            <span className="shrink-0 text-[8px] font-black text-pink-300 bg-pink-500/10 px-1.5 py-0.5 rounded-full border border-pink-500/20">
              {e.category}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
