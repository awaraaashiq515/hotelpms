import React from 'react';
import { Award, TrendingUp } from 'lucide-react';

export interface StaffKPI {
  id: string;
  name: string;
  designation: string;
  dept: string;
  attendancePct: number;  // 0–100, calculated from real attendance
  presentDays: number;
  totalDays: number;
  performanceScore: number; // derived from attendance
}

interface StaffKPIsProps {
  staff: StaffKPI[];
  monthName?: string;
  year?: number;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${Math.min(100, score)}%` }} />
      </div>
      <span className="text-[9px] font-black text-slate-400 w-7">{Math.round(score)}%</span>
    </div>
  );
}

function PerformanceBadge({ score }: { score: number }) {
  if (score >= 90) return <span className="text-[8px] font-black text-yellow-300 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20">⭐ Excellent</span>;
  if (score >= 75) return <span className="text-[8px] font-black text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">Good</span>;
  if (score >= 60) return <span className="text-[8px] font-black text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">Average</span>;
  return <span className="text-[8px] font-black text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded-full border border-rose-500/20">Low</span>;
}

export function StaffKPIs({ staff, monthName, year }: StaffKPIsProps) {
  const sorted = [...staff].sort((a, b) => b.performanceScore - a.performanceScore);

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-10 text-center">
        <TrendingUp size={24} className="text-slate-700 mx-auto mb-2" />
        <p className="text-[10px] text-slate-600">No attendance records found for this period</p>
        <p className="text-[9px] text-slate-700 mt-1">Staff need to clock in/out to generate KPI data</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={13} className="text-yellow-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">
            Staff Performance — Attendance Based
          </span>
        </div>
        {monthName && (
          <span className="text-[9px] text-slate-500 font-black">{monthName} {year}</span>
        )}
      </div>
      <div className="divide-y divide-white/5">
        {sorted.map((s, i) => (
          <div key={s.id} className="px-4 py-4 hover:bg-white/2 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black text-slate-600 w-5">#{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-[10px] font-black text-white">
                  {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-[11px] font-black text-white">{s.name}</p>
                  <p className="text-[9px] text-slate-500">{s.dept} · {s.designation}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-500">{s.presentDays}/{s.totalDays} days</span>
                <PerformanceBadge score={s.performanceScore} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-[8px] text-slate-600 mb-1">Attendance Rate</p>
                <ScoreBar score={s.attendancePct} color="bg-sky-500" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
