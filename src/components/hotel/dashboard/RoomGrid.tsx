import React from 'react';
import Link from 'next/link';
import { Bed } from 'lucide-react';
import { RoomDot } from '@/components/hotel/ui/RoomDot';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface RoomGridProps { data: DashboardData; }

const LEGEND = [
  { color: 'bg-emerald-400', key: 'vacantRooms',  label: 'Available' },
  { color: 'bg-rose-400',    key: 'occupiedRooms', label: 'Occupied' },
  { color: 'bg-amber-400',   key: 'dirtyRooms',    label: 'Dirty' },
  { color: 'bg-slate-600',   key: 'outOfOrder',    label: 'OOO' },
  { color: 'bg-purple-400',  key: null,             label: 'Maintenance' },
] as const;

export function RoomGrid({ data }: RoomGridProps) {
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bed size={13} className="text-indigo-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">
            Room Status · {data.totalRooms} Total
          </span>
        </div>
        <Link href="/hotel/rooms" className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">
          Manage →
        </Link>
      </div>
      <div className="p-3">
        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-3">
          {LEGEND.map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${s.color}`} />
              <span className="text-[9px] text-slate-500 font-semibold">
                {s.key ? `${(data as any)[s.key]} ` : ''}{s.label}
              </span>
            </div>
          ))}
        </div>
        {/* Dot grid */}
        {data.rooms.length === 0
          ? <p className="text-[10px] text-slate-600 py-4 text-center">No rooms configured yet</p>
          : <div className="flex flex-wrap gap-0">{data.rooms.map(r => <RoomDot key={r.id} room={r} />)}</div>
        }
      </div>
    </div>
  );
}
