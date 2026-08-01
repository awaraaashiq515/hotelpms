import React from 'react';
import { TrendingUp, Award, Clock, Star } from 'lucide-react';

export interface StaffKPI {
  id: string;
  name: string;
  designation: string;
  dept: string;
  attendancePct: number;
  tasksCompleted: number;
  avgRating: number;
  punctuality: number;
  performanceScore: number;
}

interface StaffKPIsProps { staff: StaffKPI[] }

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-[9px] font-black text-slate-400 w-7">{score}%</span>
    </div>
  );
}

function PerformanceBadge({ score }: { score: number }) {
  if (score >= 90) return <span className="text-[8px] font-black text-yellow-300 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/20">⭐ Excellent</span>;
  if (score >= 75) return <span className="text-[8px] font-black text-emerald-300 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">Good</span>;
  if (score >= 60) return <span className="text-[8px] font-black text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">Average</span>;
  return <span className="text-[8px] font-black text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded-full border border-rose-500/20">Needs Improvement</span>;
}

export function StaffKPIs({ staff }: StaffKPIsProps) {
  const sorted = [...staff].sort((a, b) => b.performanceScore - a.performanceScore);

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <Award size={13} className="text-yellow-400" />
        <span className="text-[11px] font-black text-white uppercase tracking-wider">Staff Performance KPIs</span>
      </div>
      <div className="divide-y divide-white/5">
        {sorted.map((s, i) => (
          <div key={s.id} className="px-4 py-4 hover:bg-white/2 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-black text-slate-600 w-5">#{i + 1}</span>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-[10px] font-black text-white">
                  {s.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-[11px] font-black text-white">{s.name}</p>
                  <p className="text-[9px] text-slate-500">{s.dept} · {s.designation}</p>
                </div>
              </div>
              <PerformanceBadge score={s.performanceScore} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[8px] text-slate-600 mb-1">Attendance</p>
                <ScoreBar score={s.attendancePct} color="bg-sky-500" />
              </div>
              <div>
                <p className="text-[8px] text-slate-600 mb-1">Punctuality</p>
                <ScoreBar score={s.punctuality} color="bg-indigo-500" />
              </div>
              <div>
                <p className="text-[8px] text-slate-600 mb-1">Task Completion</p>
                <ScoreBar score={Math.min(100, s.tasksCompleted * 5)} color="bg-emerald-500" />
              </div>
              <div>
                <p className="text-[8px] text-slate-600 mb-1">Guest Rating</p>
                <ScoreBar score={s.avgRating * 20} color="bg-yellow-500" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
