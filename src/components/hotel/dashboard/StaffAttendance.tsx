import React from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface StaffAttendanceProps { data: DashboardData; }

export function StaffAttendance({ data }: StaffAttendanceProps) {
  const pct = data.totalStaff > 0 ? Math.round((data.presentToday / data.totalStaff) * 100) : 0;
  const absent = data.totalStaff - data.presentToday;

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Users size={12} className="text-blue-400" />
          <span className="text-[10px] font-black text-white uppercase tracking-wider">Staff Today</span>
        </div>
        <Link href="/hotel/staff" className="text-[9px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider">
          View →
        </Link>
      </div>
      <div className="flex items-end gap-2 mb-2">
        <p className="text-4xl font-black text-white leading-none">{data.presentToday}</p>
        <p className="text-sm text-slate-500 mb-0.5">/ {data.totalStaff}</p>
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-slate-500">{pct}% attendance</span>
        {absent > 0 && (
          <span className="text-[9px] text-amber-400 font-bold">{absent} absent</span>
        )}
      </div>
    </div>
  );
}
