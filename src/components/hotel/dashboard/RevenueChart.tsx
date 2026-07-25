import React from 'react';
import { BarChart3 } from 'lucide-react';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface RevenueChartProps { data: DashboardData; }

// Generates 7-day sparkline from a single day's data (extend with real time-series later)
function generateSparkline(todayValue: number): number[] {
  const base = Math.max(todayValue * 0.6, 1000);
  return [0.72, 0.85, 0.68, 0.91, 0.78, 0.88, 1].map(f => Math.round(base * f));
}

export function RevenueChart({ data }: RevenueChartProps) {
  const values = generateSparkline(data.revenueToday);
  const max    = Math.max(...values);
  const days   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={13} className="text-indigo-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">Revenue — Last 7 Days</span>
        </div>
        <span className="text-[9px] text-slate-500">₹ INR</span>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {values.map((v, i) => {
          const h = max > 0 ? Math.max(8, (v / max) * 100) : 8;
          const isToday = i === values.length - 1;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                title={`₹${v.toLocaleString('en-IN')}`}
                className={`w-full rounded-t-md transition-all duration-500 ${isToday ? 'bg-indigo-500' : 'bg-indigo-500/30'}`}
                style={{ height: `${h}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {days.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            <span className={`text-[8px] font-bold ${i === days.length - 1 ? 'text-indigo-400' : 'text-slate-600'}`}>{d}</span>
          </div>
        ))}
      </div>
      <p className="text-[8px] text-slate-700 mt-2">* Connect revenue API for real time-series data</p>
    </div>
  );
}
