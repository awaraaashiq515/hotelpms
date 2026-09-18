'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import {
  MapPin,
  Search,
  Filter,
  Loader2,
  Compass,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  X,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
} from 'lucide-react';
import { format } from 'date-fns';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AttendanceReportPage() {
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const basePrefix = propertyCode ? `/${propertyCode}` : '/hotel';

  const [present, setPresent] = useState<any[]>([]);
  const [absent, setAbsent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'present' | 'absent'>('present');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const today = new Date();
  const [filterMonth, setFilterMonth] = useState(format(today, 'yyyy-MM'));

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/attendance/report?month=${filterMonth}`);
      const data = await res.json();
      if (data.success) {
        setPresent(data.data?.present ?? []);
        setAbsent(data.data?.absent ?? []);
      } else {
        setError(data.message || 'Failed to fetch attendance data.');
        setPresent([]);
        setAbsent([]);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setPresent([]);
      setAbsent([]);
    } finally {
      setLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // ── Filtered lists ──────────────────────────────────────────────────
  const filteredPresent = present.filter((r) =>
    r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredAbsent = absent.filter((r) =>
    r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const activeNow = present.filter((r) => r.isActive).length;

  // ── Helpers ─────────────────────────────────────────────────────────
  const fmtMs = (ms: number | null) => {
    if (!ms || ms <= 0) return '—';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const extraLabel = (record: any) => {
    if (record.extraMinutes === null || record.extraMinutes === undefined) return null;
    if (record.isActive) return null;
    if (record.extraMinutes > 0) {
      const h = Math.floor(record.extraMinutes / 60), m = record.extraMinutes % 60;
      return { text: `+${h}h ${m}m OT`, color: 'text-indigo-400' };
    }
    if (record.extraMinutes < 0) {
      const h = Math.floor(Math.abs(record.extraMinutes) / 60), m = Math.abs(record.extraMinutes) % 60;
      return { text: `-${h}h ${m}m Short`, color: 'text-amber-500' };
    }
    return null;
  };

  // ── Present Table ───────────────────────────────────────────────────
  const PresentTable = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Staff Member</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clock In</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clock Out</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Hours</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inside Time</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {filteredPresent.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <UserCheck className="mx-auto mb-2 text-slate-300" size={32} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {searchTerm ? `No staff matching "${searchTerm}"` : 'No attendance records'}
                  </p>
                </td>
              </tr>
            ) : filteredPresent.map((record) => {
              const extra = extraLabel(record);
              return (
                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  {/* Staff */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0">
                        {(record.employeeName || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-white block">{record.employeeName}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{record.employeeRole}</span>
                      </div>
                    </div>
                  </td>

                  {/* Clock In */}
                  <td className="px-5 py-3">
                    <span className="text-xs font-black text-emerald-600">
                      {record.clockIn ? format(new Date(record.clockIn), 'hh:mm a') : '—'}
                    </span>
                    {record.clockIn && (
                      <span className="block text-[9px] text-slate-400 mt-0.5">
                        {format(new Date(record.clockIn), 'MMM dd')}
                      </span>
                    )}
                  </td>

                  {/* Clock Out */}
                  <td className="px-5 py-3">
                    {record.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Ongoing
                      </span>
                    ) : record.clockOut ? (
                      <span className="text-xs font-black text-red-500">
                        {format(new Date(record.clockOut), 'hh:mm a')}
                      </span>
                    ) : <span className="text-slate-300 text-xs">—</span>}
                  </td>

                  {/* Total Hours */}
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {fmtMs(record.totalDurationMs)}
                    </span>
                    {extra && (
                      <span className={`block text-[9px] font-black mt-0.5 uppercase tracking-wide ${extra.color}`}>
                        {extra.text}
                      </span>
                    )}
                    {record.sessionCount > 1 && (
                      <span className="block text-[9px] text-slate-400 mt-0.5">{record.sessionCount} sessions</span>
                    )}
                  </td>

                  {/* Inside Time */}
                  <td className="px-5 py-3">
                    {record.locationEnabled ? (
                      // GPS configured — show verified inside time
                      <div>
                        <span className="text-xs font-bold text-emerald-600">
                          {fmtMs(record.timeInsideMs)}
                        </span>
                        {record.totalDurationMs > 0 && record.timeInsideMs != null && (
                          <div className="mt-1 w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-400 rounded-full"
                              style={{ width: `${Math.min(100, (record.timeInsideMs / record.totalDurationMs) * 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      // GPS base not configured — show total worked time
                      <div>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {fmtMs(record.totalDurationMs)}
                        </span>
                        <span className="block text-[9px] text-slate-400 mt-0.5">Total worked</span>
                      </div>
                    )}
                  </td>

                  {/* Location Punches */}
                  <td className="px-5 py-3">
                    {record.totalPunches > 0 ? (
                      <div className="flex flex-col gap-1">
                        {record.locationEnabled ? (
                          // GPS configured — show range validation
                          <>
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
                              <span className="text-[10px] font-bold text-emerald-600">
                                {record.punchesInsideRange} in-range
                              </span>
                            </div>
                            {record.punchesOutsideRange > 0 && (
                              <div className="flex items-center gap-1.5">
                                <ShieldAlert size={11} className="text-red-500 shrink-0" />
                                <span className="text-[10px] font-bold text-red-500">
                                  {record.punchesOutsideRange} violations
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          // GPS base not configured — just show punch count
                          <div className="flex items-center gap-1.5">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span className="text-[10px] font-bold text-slate-500">
                              {record.totalPunches} punches
                            </span>
                          </div>
                        )}
                        {record.locationIn && (
                          <a
                            href={`https://www.google.com/maps?q=${record.locationIn}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors w-fit"
                          >
                            <MapPin size={10} />
                            <span className="text-[9px] font-bold">View Map</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3">
                    {record.isActive ? (
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-widest bg-amber-50 dark:bg-amber-950/30 text-amber-600 border border-amber-100 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <span className="text-[9px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-800">
                        Present
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredPresent.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 font-bold">
          {filteredPresent.length} staff present in {filterMonth}
        </div>
      )}
    </div>
  );

  // ── Absent Table ────────────────────────────────────────────────────
  const AbsentTable = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-red-50/30 dark:bg-red-950/10">
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Staff Member</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
              <th className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {filteredAbsent.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center">
                  <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={32} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {searchTerm ? `No staff matching "${searchTerm}"` : 'All staff have attendance records! 🎉'}
                  </p>
                </td>
              </tr>
            ) : filteredAbsent.map((record) => (
              <tr key={record.id} className="hover:bg-red-50/20 dark:hover:bg-red-950/10 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-400 font-black text-xs shrink-0">
                      {(record.employeeName || '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{record.employeeName}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{record.employeeRole}</span>
                </td>
                <td className="px-5 py-3">
                  <span className="text-[9px] font-black px-2.5 py-1.5 rounded-full uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
                    No Record
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredAbsent.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-red-400 font-bold">
          {filteredAbsent.length} staff with no attendance in {filterMonth}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pb-10">

      {/* ━━━ Header + Action Buttons ━━━ */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader title="Staff Attendance Report" subtitle="Track employee work hours, shifts, and punch locations." />
        <div className="flex gap-3 flex-wrap shrink-0">
          <Link href={`${basePrefix}/staff/attendance-location`} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-100 rounded-xl text-xs font-black uppercase tracking-widest transition-all hover:-translate-y-0.5">
            <MapPin size={13} className="text-emerald-500" />
            Verify Punch Locations Map
          </Link>
          <Link href={`${basePrefix}/staff/location`} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-all hover:-translate-y-0.5">
            <Compass size={14} />
            View Live Proximity Radar
          </Link>
        </div>
      </div>

      {/* ━━━ Summary Stats ━━━ */}
      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: <Users size={16} />, label: 'Total Staff', value: present.length + absent.length, color: 'text-indigo-400' },
            { icon: <UserCheck size={16} />, label: 'Present', value: present.length, color: 'text-emerald-400' },
            { icon: <Clock size={16} />, label: 'Active Now', value: activeNow, color: 'text-amber-400' },
            { icon: <UserX size={16} />, label: 'No Record', value: absent.length, color: 'text-red-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
              <div className={stat.color}>{stat.icon}</div>
              <div>
                <p className="text-xl font-black text-white">{stat.value}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ━━━ Search + Filter ━━━ */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search staff name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              <Filter size={16} />
              {filterMonth}
              <ChevronDown size={14} />
            </button>
            {showDateFilter && (
              <div className="absolute right-0 top-full mt-2 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-4 min-w-[220px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Month</p>
                <input
                  type="month"
                  value={filterMonth}
                  onChange={(e) => { setFilterMonth(e.target.value); setShowDateFilter(false); }}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 border border-slate-200 dark:border-slate-700"
                />
                <button
                  onClick={() => { setFilterMonth(format(today, 'yyyy-MM')); setShowDateFilter(false); }}
                  className="mt-3 w-full text-center text-[10px] font-black text-indigo-500 hover:text-indigo-600 uppercase tracking-widest"
                >
                  Reset to Current Month
                </button>
              </div>
            )}
          </div>
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              <X size={16} className="text-slate-500" />
            </button>
          )}
        </div>
      </div>

      {/* ━━━ Error ━━━ */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-center">
          <XCircle className="mx-auto mb-2 text-red-400" size={28} />
          <p className="text-sm font-bold text-red-600 dark:text-red-400">{error}</p>
          <button onClick={fetchAttendance} className="mt-3 text-xs font-black text-red-500 hover:text-red-700 uppercase tracking-widest">Try Again</button>
        </div>
      )}

      {/* ━━━ Tabs ━━━ */}
      {!error && !loading && (
        <>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('present')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'present'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserCheck size={14} />
              Present ({present.length})
            </button>
            <button
              onClick={() => setActiveTab('absent')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'absent'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <UserX size={14} />
              No Record ({absent.length})
            </button>
          </div>

          {activeTab === 'present' ? <PresentTable /> : <AbsentTable />}
        </>
      )}

      {/* ━━━ Loading ━━━ */}
      {loading && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-800 py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-indigo-500 mb-4" size={32} />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Attendance...</p>
        </div>
      )}
    </div>
  );
}
