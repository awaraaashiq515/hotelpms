'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  ArrowLeft, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Timer,
  UserCheck
} from 'lucide-react';

interface AttendanceRecord { clockIn: string; clockOut: string | null; }
interface StaffMember {
  id: string; 
  fullName: string;
  role?: { name: string }; 
  shiftHours?: number | null;
  attendanceRecords?: AttendanceRecord[];
}

function fmtHM(h: number) {
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  if (hrs === 0 && mins === 0) return '0m';
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

const MEDAL_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function LeaderboardPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'total' | 'overtime' | 'days'>('total');

  useEffect(() => {
    fetch('/api/staff/attendance/hub-data')
      .then(r => r.json())
      .then(d => { if (d.success) setStaff(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const downloadCSV = () => {
    const headers = ["Rank", "Name", "Role", "Days Worked", "Shift Target (Hours)", "Total Hours Worked", "Total Overtime Hours", "Avg Daily Hours"];
    const rows = filteredAndSorted.map(s => [
      s.rank,
      s.fullName,
      s.role?.name ?? 'Staff',
      s.days,
      s.target.toFixed(1),
      s.totalHrs.toFixed(2),
      s.overtimeHrs.toFixed(2),
      s.avgPerDay.toFixed(2)
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `Staff_Leaderboard_${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '_')}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processedStaff = useMemo(() => {
    return staff
      .map(s => {
        const target = s.shiftHours ?? 8;
        let totalHrs = 0;
        let overtimeHrs = 0;
        let days = 0;

        (s.attendanceRecords ?? []).forEach(r => {
          const diff = (new Date(r.clockOut ?? new Date()).getTime() - new Date(r.clockIn).getTime()) / 3_600_000;
          totalHrs += diff;
          days++;
          if (diff > target) {
            overtimeHrs += (diff - target);
          }
        });

        const avgPerDay = days > 0 ? totalHrs / days : 0;
        return { ...s, target, totalHrs, overtimeHrs, avgPerDay, days };
      });
  }, [staff]);

  // Global aggregate stats
  const stats = useMemo(() => {
    let totalHours = 0;
    let totalOvertime = 0;
    let staffWithOvertime = 0;

    processedStaff.forEach(s => {
      totalHours += s.totalHrs;
      totalOvertime += s.overtimeHrs;
      if (s.overtimeHrs > 0.05) {
        staffWithOvertime++;
      }
    });

    return {
      totalHours,
      totalOvertime,
      staffWithOvertime,
      totalStaff: processedStaff.length
    };
  }, [processedStaff]);

  // Sort and filter logic
  const filteredAndSorted = useMemo(() => {
    return processedStaff
      .filter(s => s.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'overtime') return b.overtimeHrs - a.overtimeHrs;
        if (sortBy === 'days') return b.days - a.days;
        return b.totalHrs - a.totalHrs;
      })
      .map((s, idx) => ({ ...s, rank: idx + 1 }));
  }, [processedStaff, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 min-h-[60vh]">
        <div className="relative">
          <Trophy className="animate-pulse text-amber-500" size={48} />
          <Sparkles className="absolute -top-1 -right-1 text-amber-400 animate-spin duration-1000" size={16} />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Analyzing Workforce Metrics...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 pb-20 space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white font-black uppercase tracking-wider transition-colors w-fit"
        >
          <ArrowLeft size={12} /> Back to Attendance
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
              <Trophy size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                Staff Performance Leaderboard
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · Attendance &amp; Overtime Records
              </p>
            </div>
          </div>

          <button
            onClick={downloadCSV}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-600/15"
          >
            📥 Export to Excel
          </button>
        </div>
      </div>

      {/* ── METRICS SUMMARY BOARD ── */}
      <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100/50 dark:border-white/5 flex flex-col justify-between">
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 leading-none">
            <Timer size={10} className="text-blue-500" /> Total Hours
          </span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2 block leading-none">
            {fmtHM(stats.totalHours)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100/50 dark:border-white/5 flex flex-col justify-between">
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 leading-none">
            <Flame size={10} className="text-rose-500 animate-pulse" /> Extra Time
          </span>
          <span className="text-xs font-black text-rose-600 dark:text-rose-400 mt-2 block leading-none">
            +{fmtHM(stats.totalOvertime)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100/50 dark:border-white/5 flex flex-col justify-between">
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1 leading-none">
            <UserCheck size={10} className="text-emerald-500" /> Overtime Alert
          </span>
          <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2 block leading-none">
            {stats.staffWithOvertime} <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Staff</span>
          </span>
        </div>
      </div>

      {/* ── FILTER & SORT CONTROLS ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-slate-50 dark:bg-slate-900/20 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input
            type="text"
            placeholder="Search personnel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 text-[9px] font-bold uppercase tracking-wider text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400/50 transition-all"
          />
        </div>

        {/* Sorting Toggles */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">Sort By</span>
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-0.5 border border-slate-100 dark:border-white/5 w-full sm:w-auto">
            <button
              onClick={() => setSortBy('total')}
              className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                sortBy === 'total'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Hours
            </button>
            <button
              onClick={() => setSortBy('overtime')}
              className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                sortBy === 'overtime'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Overtime
            </button>
            <button
              onClick={() => setSortBy('days')}
              className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                sortBy === 'days'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Days
            </button>
          </div>
        </div>
      </div>

      {/* ── STAFF RANKINGS LIST ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAndSorted.map(s => {
          const hasOT = s.overtimeHrs > 0.05;
          const barMax = s.target * 1.6;
          const barNormal = Math.min(100, (s.target / barMax) * 100);
          const barActual = Math.min(100, (s.avgPerDay / barMax) * 100);

          return (
            <div 
              key={s.id}
              className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                hasOT
                  ? 'border-rose-100 dark:border-rose-500/10 bg-gradient-to-r from-white to-rose-50/20 dark:from-slate-900 dark:to-rose-950/5'
                  : 'border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900'
              }`}
            >
              {/* Vertical Color Indicator */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${hasOT ? 'bg-rose-500' : 'bg-emerald-500'}`} />

              <div className="p-4 pl-5 space-y-3.5">
                {/* Row 1: Rank, Profile Info, Total Hours worked */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div className="w-7 h-7 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5">
                      {MEDAL_EMOJI[s.rank] ? (
                        <span className="text-base select-none">{MEDAL_EMOJI[s.rank]}</span>
                      ) : (
                        <span className="text-[9px] font-black text-slate-400">#{s.rank}</span>
                      )}
                    </div>

                    {/* Personnel Details */}
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 dark:text-white text-xs leading-none truncate">
                        {s.fullName}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1.5 leading-none">
                        <span>{s.role?.name ?? 'Staff'}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span>{s.days} day{s.days !== 1 ? 's' : ''} worked</span>
                      </p>
                    </div>
                  </div>

                  {/* Total Performance Display */}
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-none">
                      {fmtHM(s.totalHrs)}
                    </p>
                    <p className="text-[7.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 leading-none">
                      total hours
                    </p>
                  </div>
                </div>

                {/* Row 2: Shift vs Actual worked comparative bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[8px] font-bold">
                    <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Shift length: <span className="font-black text-slate-700 dark:text-slate-300">{fmtHM(s.target)}</span>
                    </span>
                    <span className={`uppercase tracking-widest ${hasOT ? 'text-rose-500' : 'text-emerald-500'}`}>
                      Avg worked: <span className="font-black">{fmtHM(s.avgPerDay)}/day</span>
                    </span>
                  </div>

                  {/* High Quality Custom Visual Progress Bar */}
                  <div className="relative h-3 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    {/* Background Actual Average worked */}
                    <div
                      className={`absolute inset-y-0 left-0 rounded-l-lg transition-all duration-750 ${
                        hasOT ? 'bg-rose-100/50 dark:bg-rose-500/10' : 'bg-emerald-100/50 dark:bg-emerald-500/10'
                      }`}
                      style={{ width: `${barActual}%` }}
                    />
                    
                    {/* Normal Target Portion */}
                    <div
                      className="absolute inset-y-0 left-0 bg-blue-500 dark:bg-blue-600 rounded-l-lg transition-all duration-750"
                      style={{ width: `${Math.min(barNormal, barActual)}%` }}
                    />
                    
                    {/* Overtime Extra Portion */}
                    {hasOT && (
                      <div
                        className="absolute inset-y-0 bg-rose-500 rounded-r-lg transition-all duration-750"
                        style={{ left: `${barNormal}%`, width: `${Math.max(0, barActual - barNormal)}%` }}
                      />
                    )}

                    {/* Delineating target threshold marker line */}
                    <div
                      className="absolute inset-y-0 w-[1.5px] bg-white dark:bg-slate-900 opacity-90"
                      style={{ left: `${barNormal}%` }}
                    />
                  </div>

                  {/* Compact Legend & Progress Details */}
                  <div className="flex items-center justify-between gap-4 text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-sm bg-blue-500" /> Normal ({fmtHM(s.target)})
                      </span>
                      {hasOT && (
                        <span className="flex items-center gap-1 text-rose-500">
                          <span className="w-1.5 h-1.5 rounded-sm bg-rose-500" /> Overtime
                        </span>
                      )}
                    </div>
                    {hasOT && (
                      <span className="text-rose-600 dark:text-rose-400 font-black">
                        +{fmtHM(s.overtimeHrs)} extra this month
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 3: Live interactive description tooltip chip */}
                {hasOT ? (
                  <div className="flex items-center gap-2 bg-rose-500/[0.04] dark:bg-rose-500/[0.02] border border-rose-500/10 rounded-xl px-3 py-1.5">
                    <Flame size={12} className="text-rose-500 shrink-0" />
                    <p className="text-[8px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wide">
                      Shift was {fmtHM(s.target)} · worked <span className="font-black text-rose-600 dark:text-rose-300">{fmtHM(s.avgPerDay)}</span> avg · exceeded target by <span className="font-black text-rose-600 dark:text-rose-300">{fmtHM(s.overtimeHrs)}</span> total.
                    </p>
                  </div>
                ) : s.days > 0 ? (
                  <div className="flex items-center gap-2 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] border border-emerald-500/10 rounded-xl px-3 py-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                    <p className="text-[8px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
                      Maintained strict target bounds · No overtime recorded this cycle.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-white/5 rounded-xl px-3 py-1.5">
                    <AlertCircle size={12} className="text-slate-400 shrink-0" />
                    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                      No active attendance sessions recorded in current month.
                    </p>
                  </div>
                )}

              </div>
            </div>
          );
        })}

        {filteredAndSorted.length === 0 && (
          <div className="col-span-full text-center py-20 bg-slate-50 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-100 dark:border-white/5">
            <AlertCircle className="text-slate-300 dark:text-slate-700 mx-auto mb-2.5" size={24} />
            <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              No matching records found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
