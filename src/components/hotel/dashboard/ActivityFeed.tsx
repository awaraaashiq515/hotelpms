import React from 'react';
import { Activity, UserCheck, DoorOpen, BrushIcon, Wrench, CreditCard } from 'lucide-react';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface ActivityFeedProps { data: DashboardData; }

function fmtTime(d: string) {
  try { return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
}

function buildFeed(data: DashboardData) {
  const items: { icon: React.ElementType; color: string; text: string; time: string }[] = [];

  data.checkinsToday.slice(0, 2).forEach(b => items.push({
    icon: UserCheck, color: 'text-sky-400',
    text: `${b.guest?.firstName || 'Guest'} expected · ${b.bookingNo}`,
    time: fmtTime(b.arrivalDate),
  }));
  data.checkoutsToday.slice(0, 2).forEach(b => items.push({
    icon: DoorOpen, color: 'text-orange-400',
    text: `${b.guest?.firstName || 'Guest'} departing · ${b.bookingNo}`,
    time: fmtTime(b.departureDate),
  }));
  data.maintenanceAlerts.slice(0, 2).forEach(m => items.push({
    icon: Wrench, color: 'text-red-400',
    text: `${m.issueType || 'Maintenance'} ${m.room ? '— Rm ' + m.room.roomNumber : ''}`,
    time: fmtTime(m.openedAt || new Date().toISOString()),
  }));
  data.housekeepingTasks.slice(0, 2).forEach(t => items.push({
    icon: BrushIcon, color: 'text-teal-400',
    text: `${t.taskType || 'Housekeeping'} ${t.room ? '— Rm ' + t.room.roomNumber : ''} · ${t.status}`,
    time: '',
  }));

  return items.slice(0, 8);
}

export function ActivityFeed({ data }: ActivityFeedProps) {
  const feed = buildFeed(data);
  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <Activity size={13} className="text-indigo-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-wider">Live Activity Feed</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto" />
      </div>
      <div className="px-4 divide-y divide-white/5">
        {feed.length === 0 ? (
          <div className="py-5 text-center">
            <p className="text-[10px] text-slate-600">No recent activity</p>
          </div>
        ) : feed.map((item, i) => (
          <div key={i} className="py-2.5 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
              <item.icon size={10} className={item.color} />
            </div>
            <p className="text-[10px] text-slate-400 flex-1 truncate">{item.text}</p>
            {item.time && <span className="text-[9px] font-mono text-slate-600 shrink-0">{item.time}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
