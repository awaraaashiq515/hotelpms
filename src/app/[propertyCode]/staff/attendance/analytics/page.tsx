'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Clock, 
  Award, 
  Download,
  AlertCircle,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isToday 
} from 'date-fns';

interface AttendanceRecord { clockIn: string; clockOut: string | null; }
interface StaffMember {
  id: string; 
  fullName: string;
  role?: { name: string };
  attendanceRecords?: AttendanceRecord[];
  activeSession?: any | null;
}

export default function AttendanceAnalyticsPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Date context
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Generate all calendar days for this month
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthStart, monthEnd]);

  useEffect(() => {
    setLoading(true);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    fetch(`/api/staff/attendance/hub-data?date=${dateStr}`)
      .then(r => r.json())
      .then(d => { if (d.success) setStaff(d.data); })
      .finally(() => setLoading(false));
  }, [currentDate]);

  // Compute detailed analytics metrics per staff
  const staffMetrics = useMemo(() => {
    return staff.map(s => {
      const records = s.attendanceRecords ?? [];
      
      // Count unique days they checked in
      const presentDaysSet = new Set<string>();
      records.forEach(r => {
        presentDaysSet.add(new Date(r.clockIn).toDateString());
      });
      const daysPresent = presentDaysSet.size;

      // For active/total days, count how many calendar days passed up to today
      const totalPassedDays = calendarDays.filter(d => d <= new Date()).length;
      const daysAbsent = Math.max(0, totalPassedDays - daysPresent);

      const attendanceRate = totalPassedDays > 0 ? (daysPresent / totalPassedDays) * 100 : 0;

      return {
        ...s,
        daysPresent,
        daysAbsent,
        attendanceRate,
        presentDaysSet
      };
    });
  }, [staff, calendarDays]);

  // Aggregate monthly stats
  const aggregateStats = useMemo(() => {
    if (staffMetrics.length === 0) return { avgRate: 0, perfectAttendance: 0, mostPresent: null };

    const totalRate = staffMetrics.reduce((acc, curr) => acc + curr.attendanceRate, 0);
    const avgRate = totalRate / staffMetrics.length;

    const perfectAttendance = staffMetrics.filter(s => s.attendanceRate >= 99).length;

    // Find personnel with the highest days present
    let mostPresent = staffMetrics[0];
    staffMetrics.forEach(s => {
      if (s.daysPresent > (mostPresent?.daysPresent ?? 0)) {
        mostPresent = s;
      }
    });

    return {
      avgRate,
      perfectAttendance,
      mostPresent: mostPresent || null
    };
  }, [staffMetrics]);

  // Search filter
  const filteredStaff = useMemo(() => {
    return staffMetrics.filter(s => 
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staffMetrics, searchTerm]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  // Export CSV Excel function
  const downloadCSVReport = () => {
    const dayHeaders = calendarDays.map(d => format(d, 'dd-MMM'));
    const headers = ["Personnel Name", "Role", "Days Present", "Days Absent", "Attendance Rate (%)", ...dayHeaders];

    const rows = filteredStaff.map(s => {
      const dayStatus = calendarDays.map(d => {
        const isPresent = s.presentDaysSet.has(d.toDateString());
        return isPresent ? "Present" : "Absent";
      });

      return [
        s.fullName,
        s.role?.name ?? 'Staff',
        s.daysPresent,
        s.daysAbsent,
        s.attendanceRate.toFixed(1) + "%",
        ...dayStatus
      ];
    });

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `Attendance_Report_${format(currentDate, 'MMM_yyyy')}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 min-h-[60vh]">
        <Clock className="animate-spin text-blue-500" size={40} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Generating Monthly Analytics Report...</p>
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
          <ArrowLeft size={12} /> Back to Terminal
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-inner">
              <Calendar size={18} />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">
                Comprehensive Attendance Report
              </h1>
              <div className="flex items-center gap-2 mt-1.5">
                <button 
                  onClick={handlePrevMonth}
                  className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white rounded-md transition-all border border-slate-250 dark:border-white/10 active:scale-90"
                >
                  <ChevronLeft size={12} />
                </button>
                <span className="text-[10px] font-black text-slate-850 dark:text-slate-200 uppercase tracking-wider min-w-[90px] text-center">
                  {format(currentDate, 'MMMM yyyy')}
                </span>
                <button 
                  onClick={handleNextMonth}
                  className="p-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white rounded-md transition-all border border-slate-250 dark:border-white/10 active:scale-90"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={downloadCSVReport}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-emerald-600/15"
          >
            <FileSpreadsheet size={13} />
            Export Monthly Excel
          </button>
        </div>
      </div>

      {/* ── KEY PERFORMANCE TILES ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-white/5">
        
        {/* Average Attendance Rate */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100/50 dark:border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block">
              Avg Present Rate
            </span>
            <span className="text-base font-black text-slate-800 dark:text-slate-200 mt-2 block leading-none">
              {aggregateStats.avgRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
        </div>

        {/* Perfect Attendees */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100/50 dark:border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block">
              100% Attendance
            </span>
            <span className="text-base font-black text-slate-800 dark:text-slate-200 mt-2 block leading-none">
              {aggregateStats.perfectAttendance} <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Staff</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 size={16} />
          </div>
        </div>

        {/* Most Dedicated Staff member */}
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100/50 dark:border-white/5 flex items-center justify-between">
          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none block">
              Most Active Personnel
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2.5 block leading-none truncate max-w-[150px]">
              {aggregateStats.mostPresent ? aggregateStats.mostPresent.fullName : 'None'}
            </span>
            {aggregateStats.mostPresent && (
              <span className="text-[7.5px] font-bold text-slate-400 block mt-1 uppercase">
                {aggregateStats.mostPresent.daysPresent} Days Present
              </span>
            )}
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award size={16} />
          </div>
        </div>

      </div>

      {/* ── SEARCH & TOOLS ── */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/20 p-2.5 rounded-2xl border border-slate-100 dark:border-white/5">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
          <input
            type="text"
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-white/5 text-[9px] font-bold uppercase tracking-wider text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500/20 focus:border-blue-400/50 transition-all"
          />
        </div>
        <div className="text-[7.5px] font-black text-slate-400 uppercase tracking-wider">
          Total: {filteredStaff.length} personnel found
        </div>
      </div>

      {/* ── DUAL VISUALIZATION SECTIONS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* SECTION 1: DETAILED ATTENDANCE GRID SHEET (2/3 width on wide) */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
              Attendance Calendar Grid
            </h3>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
              🟢 Present · 🔴 Absent
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40">
                  <th className="py-2.5 px-4 text-[9px] font-black text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-100 dark:border-white/5 w-[140px]">
                    Personnel Name
                  </th>
                  {calendarDays.map(d => (
                    <th 
                      key={d.toISOString()}
                      className={`py-2 px-1 text-center text-[7.5px] font-black uppercase tracking-tighter min-w-[24px] border-b border-slate-100 dark:border-white/5 ${
                        isToday(d) ? 'text-blue-500 bg-blue-50/30 dark:bg-blue-500/5' : 'text-slate-400'
                      }`}
                    >
                      {format(d, 'd')}
                      <span className="block text-[5px] opacity-75 mt-0.5">{format(d, 'eee').charAt(0)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredStaff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] group">
                    {/* Sticky Name column */}
                    <td className="py-2.5 px-4 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-white/[0.01] z-10 border-r border-slate-100 dark:border-white/5 font-black text-slate-800 dark:text-slate-200 text-[10px] w-[140px] truncate">
                      {s.fullName}
                      <span className="block text-[6.5px] font-bold text-slate-400 uppercase mt-0.5 truncate max-w-[120px]">
                        {s.role?.name ?? 'Staff'}
                      </span>
                    </td>

                    {/* Day columns */}
                    {calendarDays.map(d => {
                      const present = s.presentDaysSet.has(d.toDateString());
                      const future = d > new Date();

                      return (
                        <td 
                          key={d.toISOString()}
                          className={`py-2 px-0.5 text-center border-b border-slate-100 dark:border-white/5 ${
                            isToday(d) ? 'bg-blue-500/[0.02]' : ''
                          }`}
                        >
                          {future ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 inline-block opacity-40" />
                          ) : present ? (
                            <span className="w-2.5 h-2.5 rounded-md bg-emerald-500 flex items-center justify-center mx-auto text-[6px] text-white shadow shadow-emerald-500/20 font-black">
                              ✓
                            </span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-200 dark:bg-rose-500/20 inline-block" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 2: ATTENDANCE RATIO BAR CHART (1/3 width on wide) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-4 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider leading-none">
              Personnel Performance Chart
            </h3>
            <p className="text-[7.5px] font-bold text-slate-400 uppercase mt-1">
              Total Days Present relative to elapsed month days
            </p>
          </div>

          <div className="space-y-3.5">
            {filteredStaff.map(s => (
              <div key={s.id} className="space-y-1">
                <div className="flex items-center justify-between text-[8px] font-bold">
                  <span className="text-slate-700 dark:text-slate-300 font-black truncate max-w-[120px]">
                    {s.fullName}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    <span className="text-slate-700 dark:text-slate-200 font-black">{s.daysPresent}</span> / {calendarDays.filter(d => d <= new Date()).length} days
                  </span>
                </div>
                
                {/* Visual Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full transition-all duration-1000 shadow shadow-indigo-500/10"
                    style={{ width: `${s.attendanceRate}%` }}
                  />
                </div>
                <div className="text-right">
                  <span className="text-[6.5px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">
                    {s.attendanceRate.toFixed(0)}% Rate
                  </span>
                </div>
              </div>
            ))}

            {filteredStaff.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-[9px] font-bold uppercase">
                No matching records.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
