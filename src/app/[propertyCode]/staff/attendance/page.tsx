'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Clock,
  LogIn,
  LogOut,
  Loader2,
  Search,
  Sparkles,
  Zap,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  Monitor,
  BarChart2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
} from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Role {
  name: string;
}

interface AttendanceRecord {
  clockIn: string;
}

interface ActiveSession {
  clockIn: string;
}

interface StaffMember {
  id: string;
  fullName: string;
  type: 'USER' | 'OTHER';
  role?: Role;
  activeSession?: ActiveSession | null;
  attendanceRecords?: AttendanceRecord[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-4 bg-slate-900 rounded-2xl px-6 py-4 shadow-xl min-w-[220px]">
      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-400">
        <Clock size={20} className="animate-pulse" />
      </div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40 mb-0.5">
          Live Server Time
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-white tracking-tight font-mono">
            {format(now, 'HH:mm:ss')}
          </span>
          <span className="text-[10px] font-bold text-blue-400 uppercase">
            {format(now, 'aaa')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  badge: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
}

function StatCard({
  label,
  value,
  icon: Icon,
  badge,
  iconBg,
  iconColor,
  badgeBg,
  badgeColor,
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-lg transition-shadow">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg} ${iconColor}`}
      >
        <Icon size={20} />
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.18em] mb-1">
        {label}
      </p>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
          {value}
        </span>
        <span
          className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${badgeBg} ${badgeColor}`}
        >
          {badge}
        </span>
      </div>
    </div>
  );
}

// ─── Staff Card ───────────────────────────────────────────────────────────────

interface StaffCardProps {
  member: StaffMember;
  isPunching: boolean;
  onAction: (id: string, action: 'clock-in' | 'clock-out') => void;
}

function StaffCard({ member: s, isPunching, onAction }: StaffCardProps) {
  const isActive = !!s.activeSession;

  return (
    <div
      className={`relative group flex flex-col items-center gap-5 rounded-3xl p-6 border transition-all duration-300 overflow-hidden ${isActive
          ? 'bg-white dark:bg-slate-900 border-emerald-400/30 shadow-[0_8px_32px_-8px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/20'
          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1'
        }`}
    >
      {/* Active top bar */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-500" />
      )}

      {/* Live badge */}
      {isActive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md shadow-emerald-500/30">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
          Live
        </div>
      )}

      {/* Avatar */}
      <div className="relative">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black transition-all duration-300 group-hover:rounded-xl ${isActive
              ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
            }`}
        >
          {s.fullName.charAt(0)}
        </div>
        {isActive && (
          <div className="absolute -inset-2 bg-emerald-500/15 blur-xl rounded-full -z-10 animate-pulse" />
        )}
      </div>

      {/* Info */}
      <div className="text-center space-y-0.5">
        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
          {s.fullName}
        </h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Monitor size={9} className={s.type === 'USER' ? 'text-indigo-400' : 'text-amber-400'} />
          {s.role?.name ?? 'Personnel'}
        </p>
      </div>

      {/* Action Zone */}
      <div className="w-full space-y-2.5">
        {isActive ? (
          <>
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl py-2.5 text-center">
              <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                In Since
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                {format(new Date(s.activeSession!.clockIn), 'hh:mm a')}
              </p>
            </div>
            <button
              onClick={() => onAction(s.id, 'clock-out')}
              disabled={isPunching}
              className="w-full py-3.5 bg-slate-900 hover:bg-red-600 dark:bg-slate-800 dark:hover:bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.18em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
            >
              {isPunching ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              Terminate Shift
            </button>
          </>
        ) : (
          <button
            onClick={() => onAction(s.id, 'clock-in')}
            disabled={isPunching}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.18em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            {isPunching ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <LogIn size={14} />
            )}
            Initialize Shift
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

interface HeatmapProps {
  staff: StaffMember[];
}

function AttendanceHeatmap({ staff }: HeatmapProps) {
  const today = new Date();
  const days = eachDayOfInterval({
    start: startOfMonth(today),
    end: endOfMonth(today),
  });

  return (
    <section className="bg-white dark:bg-slate-900/60 rounded-3xl p-8 border border-slate-100 dark:border-white/5 shadow-sm space-y-8 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none p-8">
        <Sparkles size={160} />
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-500/10 rounded-full text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.18em]">
            <TrendingUp size={11} />
            Efficiency Analytics
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Personnel Heatmap
          </h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {format(today, 'MMMM yyyy')}
          </p>
        </div>

        <div className="flex items-center gap-5 text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-white/5 px-4 py-3 rounded-2xl">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
            Present
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800 inline-block" />
            Absent
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <table className="w-full border-separate border-spacing-y-2" style={{ minWidth: '700px' }}>
          <thead>
            <tr>
              <th className="text-left px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">
                Employee
              </th>
              {days.map((d) => (
                <th
                  key={d.toISOString()}
                  className="text-center py-2 px-0.5 text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase w-8"
                >
                  {format(d, 'dd')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="group/row">
                {/* Name cell */}
                <td className="px-4 py-3 bg-slate-50 dark:bg-white/5 rounded-l-2xl border-l border-y border-slate-100 dark:border-white/5 group-hover/row:bg-slate-100 dark:group-hover/row:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-400 shadow-sm shrink-0">
                      {s.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                        {s.fullName}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {s.role?.name ?? 'Staff'}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Day cells */}
                {days.map((day, idx) => {
                  const present = s.attendanceRecords?.some((r) =>
                    isSameDay(new Date(r.clockIn), day)
                  );
                  const isLast = idx === days.length - 1;
                  return (
                    <td
                      key={day.toISOString()}
                      className={`py-3 px-0.5 bg-slate-50 dark:bg-white/5 border-y border-slate-100 dark:border-white/5 text-center group-hover/row:bg-slate-100 dark:group-hover/row:bg-white/10 transition-colors ${isLast ? 'rounded-r-2xl border-r' : ''
                        }`}
                    >
                      <div
                        className={`w-4 h-4 mx-auto rounded transition-all duration-300 ${present
                            ? 'bg-blue-600 shadow shadow-blue-500/30 scale-100'
                            : 'bg-white dark:bg-slate-800 scale-75'
                          }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CTA */}
      <div className="flex justify-center pt-2">
        <button className="inline-flex items-center gap-2.5 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-[11px] font-black uppercase tracking-[0.18em] hover:scale-105 active:scale-95 transition-all shadow-xl">
          <BarChart2 size={16} />
          View Comprehensive Analytics
          <ChevronRight size={16} />
        </button>
      </div>
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AttendanceHubPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [punchingId, setPunchingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStaffStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/staff/attendance/hub-data');
      const data = await res.json();
      if (data.success) setStaff(data.data);
    } catch {
      toast.error('Could not load staff status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffStatus();
  }, [fetchStaffStatus]);

  const handleAttendance = async (
    userId: string,
    action: 'clock-in' | 'clock-out'
  ) => {
    setPunchingId(userId);
    try {
      let location = 'Unknown';
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
        );
        location = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      } catch {
        /* geolocation unavailable — continue anyway */
      }

      const res = await fetch('/api/staff/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, location, userId }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message, {
          style: {
            background: action === 'clock-in' ? '#10b981' : '#ef4444',
            color: 'white',
          },
        });
        fetchStaffStatus();
      } else {
        toast.error(data.error ?? 'Operation failed');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setPunchingId(null);
    }
  };

  const activeCount = staff.filter((s) => s.activeSession).length;

  const filteredStaff = staff.filter((s) =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const STATS: StatCardProps[] = [
    {
      label: 'Active on duty',
      value: activeCount,
      icon: Zap,
      badge: 'Live',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-50 dark:bg-blue-500/10',
      badgeColor: 'text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Total personnel',
      value: staff.length,
      icon: Users,
      badge: '+2 this month',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      badgeColor: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Efficiency rate',
      value: '94%',
      icon: TrendingUp,
      badge: 'Optimum',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 dark:bg-amber-500/10',
      badgeColor: 'text-amber-700 dark:text-amber-300',
    },
    {
      label: 'System health',
      value: 'Active',
      icon: ShieldCheck,
      badge: 'Verified',
      iconBg: 'bg-sky-50 dark:bg-sky-500/10',
      iconColor: 'text-sky-600 dark:text-sky-400',
      badgeBg: 'bg-sky-50 dark:bg-sky-500/10',
      badgeColor: 'text-sky-700 dark:text-sky-300',
    },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* ── Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Workforce Attendance Hub
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Real-time shift management &amp; performance tracking for your establishment.
          </p>
        </div>
        <LiveClock />
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-blue-600 rounded-full" />
          <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Staff Terminal Selection
          </h2>
        </div>
        <div className="relative w-full max-w-xs">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* ── Staff Grid ── */}
      {loading ? (
        <div className="py-32 text-center space-y-4">
          <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.25em]">
            Initializing Terminal Matrix…
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredStaff.map((s) => (
            <StaffCard
              key={s.id}
              member={s}
              isPunching={punchingId === s.id}
              onAction={handleAttendance}
            />
          ))}
          {filteredStaff.length === 0 && (
            <div className="col-span-full py-20 text-center text-sm text-slate-400 font-semibold">
              No staff members found.
            </div>
          )}
        </div>
      )}

      {/* ── Heatmap ── */}
      {!loading && staff.length > 0 && <AttendanceHeatmap staff={staff} />}
    </div>
  );
}