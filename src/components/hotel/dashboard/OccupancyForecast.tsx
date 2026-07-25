import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { DashboardData } from '@/types/hotel/dashboard.types';

interface OccupancyForecastProps { data: DashboardData; }

// Generate a 7-day occupancy forecast (mock — replace with AI model output)
function getForecast(baseOcc: number): { day: string; pct: number }[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date().getDay();
  return days.map((day, i) => {
    const delta = [0, 5, -3, 8, 12, 18, 15][i] ?? 0;
    return { day, pct: Math.min(100, Math.max(10, baseOcc + delta)) };
  });
}

export function OccupancyForecast({ data }: OccupancyForecastProps) {
  const forecast = getForecast(data.occupancyPct);

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={13} className="text-emerald-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-wider">7-Day Occupancy Forecast</span>
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {forecast.map((f, i) => {
          const color = f.pct >= 80 ? 'bg-emerald-500' : f.pct >= 60 ? 'bg-indigo-500' : f.pct >= 40 ? 'bg-amber-500' : 'bg-slate-600';
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${f.day}: ${f.pct}%`}>
              <span className="text-[7px] text-slate-500 font-bold">{f.pct}%</span>
              <div className={`w-full rounded-t-sm ${color} transition-all duration-700`} style={{ height: `${f.pct}%` }} />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-1">
        {forecast.map((f, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[8px] text-slate-600 font-bold">{f.day}</span>
          </div>
        ))}
      </div>
      <p className="text-[8px] text-slate-700 mt-2">* AI forecast — connect Revenue Management for live predictions</p>
    </div>
  );
}
