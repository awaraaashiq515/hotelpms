'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { downloadStaffSinglePDF } from '@/lib/staff-report-pdf';

/* ─── Types ─── */
export interface StaffHRPanelProps {
  userId: string;
  propertyId?: string | null;
  wtToken?: string;
  accentColor?: string;
  showClockButton?: boolean;
  staffName?: string;
  designation?: string;
  propertyName?: string;
  propertyCode?: string;
}

export interface AttendanceRecord {
  id: string;
  date?: string;
  clockIn?: string;
  clockOut?: string;
  status: string;
  durationHours?: number;
  overtimeHours?: number;
  shiftHours?: number;
  locationIn?: string;
  locationOut?: string;
  note?: string;
}

export interface LeaveRecord {
  id: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason?: string;
  status: string;
  appliedOn: string;
}

export interface MonthlyStats {
  daysPresent: number;
  totalWorkedHours: number;
  totalOvertimeHours: number;
  approvedLeaves: number;
  monthName: string;
}

export type HRTab = 'attendance' | 'report' | 'leave';
export type PeriodFilter = '1month' | 'prevMonth' | '2months' | 'all';

const LEAVE_TYPES = ['CASUAL', 'SICK', 'EARNED', 'EMERGENCY'] as const;

function statusBadgeStyle(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    APPROVED: { bg: 'rgba(16,185,129,0.15)', color: '#34d399' },
    REJECTED: { bg: 'rgba(239,68,68,0.15)', color: '#f87171' },
    PENDING:  { bg: 'rgba(251,191,36,0.15)', color: '#fbbf24' },
    PRESENT:  { bg: 'rgba(16,185,129,0.1)',  color: '#34d399' },
    LATE:     { bg: 'rgba(251,191,36,0.1)',  color: '#fbbf24' },
    ABSENT:   { bg: 'rgba(239,68,68,0.1)',   color: '#f87171' },
    LEAVE:    { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8' },
  };
  const s = map[status] || { bg: 'rgba(100,116,139,0.1)', color: '#94a3b8' };
  return {
    fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999,
    background: s.bg, color: s.color, textTransform: 'uppercase' as const,
    letterSpacing: '0.04em', flexShrink: 0,
  };
}

export default function StaffHRPanel({
  userId,
  propertyId,
  wtToken,
  accentColor = '#6366f1',
  showClockButton = true,
  staffName,
  designation,
  propertyName,
  propertyCode,
}: StaffHRPanelProps) {
  const [hrTab, setHrTab] = useState<HRTab>('report'); // Default to full report so staff sees their monthly report immediately
  const [period, setPeriod] = useState<PeriodFilter>('1month');

  // Attendance & Clock states
  const [clockedIn, setClockedIn] = useState(false);
  const [clockLoading, setClockLoading] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [attLoading, setAttLoading] = useState(true);
  const [staffShiftHours, setStaffShiftHours] = useState(8);
  const [elapsedDisplay, setElapsedDisplay] = useState('00:00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  // Info fallbacks from attendance API if not provided in props
  const [resolvedStaffName, setResolvedStaffName] = useState(staffName || '');
  const [resolvedDesignation, setResolvedDesignation] = useState(designation || '');

  // Leave states
  const [leaveType, setLeaveType] = useState<typeof LEAVE_TYPES[number]>('CASUAL');
  const [leaveFrom, setLeaveFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [leaveTo, setLeaveTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  const authHeaders = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (wtToken) h['Authorization'] = `Bearer ${wtToken}`;
    return h;
  }, [wtToken]);

  // Live Clock updater
  useEffect(() => {
    const update = () => setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Live Timer for active clock-in
  const startElapsed = useCallback((startMs: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const tick = () => {
      const diff = Math.max(0, Date.now() - startMs);
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsedDisplay(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  }, []);

  useEffect(() => {
    if (!clockedIn && timerRef.current) {
      clearInterval(timerRef.current);
      setElapsedDisplay('00:00:00');
    }
  }, [clockedIn]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Fetch Attendance Records
  const fetchAttendance = useCallback(async () => {
    setAttLoading(true);
    try {
      const res = await fetch(`/api/staff-attendance?userId=${userId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        const records: AttendanceRecord[] = Array.isArray(data.data) ? data.data : (data.data?.records || data.data?.present || []);
        setAttendance(records);
        if (data.data?.shiftHours) setStaffShiftHours(Number(data.data.shiftHours));
        if (data.data?.staffMember) {
          if (!resolvedStaffName && data.data.staffMember.name) {
            setResolvedStaffName(data.data.staffMember.name);
          }
          if (!resolvedDesignation && data.data.staffMember.designation) {
            setResolvedDesignation(data.data.staffMember.designation);
          }
        }
        
        const today = new Date().toISOString().split('T')[0];
        const todayRec = records.find(r => (r.date || r.clockIn || '').startsWith(today));
        const isIn = !!todayRec?.clockIn && !todayRec?.clockOut;
        setClockedIn(isIn);
        if (isIn && todayRec?.clockIn) startElapsed(new Date(todayRec.clockIn).getTime());
      }
    } catch (e) {
      console.error('[StaffHRPanel]', e);
    } finally {
      setAttLoading(false);
    }
  }, [userId, authHeaders, startElapsed, resolvedStaffName, resolvedDesignation]);

  // Fetch Leave Requests
  const fetchLeaves = useCallback(async () => {
    setLeavesLoading(true);
    try {
      const res = await fetch('/api/leave-requests', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setLeaves(data.data || []);
    } catch (e) {
      console.error('[StaffHRPanel]', e);
    } finally {
      setLeavesLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (userId) {
      fetchAttendance();
      fetchLeaves();
    }
  }, [userId, fetchAttendance, fetchLeaves]);

  // Handle Clock In / Out action
  const handleClockAction = async () => {
    setClockLoading(true);
    try {
      let locationCoord: string | undefined;
      if ('geolocation' in navigator) {
        locationCoord = await new Promise<string | undefined>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`),
            () => resolve(undefined),
            { timeout: 5000, enableHighAccuracy: true }
          );
        });
      }
      const endpoint = clockedIn ? '/api/staff-attendance/clock-out' : '/api/staff-attendance/clock-in';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(locationCoord ? { location: locationCoord } : {}),
      });
      if (res.ok) {
        if (!clockedIn) startElapsed(Date.now());
        setClockedIn(prev => !prev);
        await fetchAttendance();
      }
    } catch (e) {
      console.error('[StaffHRPanel]', e);
    } finally {
      setClockLoading(false);
    }
  };

  // Handle Leave Submission
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveFrom || !leaveTo) return;
    const from = new Date(leaveFrom);
    const to = new Date(leaveTo);
    if (to < from) return;
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1);
    setLeaveSubmitting(true);
    try {
      const res = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          leaveType,
          fromDate: leaveFrom,
          toDate: leaveTo,
          days,
          reason: leaveReason || undefined,
          propertyId: propertyId || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLeaveSuccess(true);
        setLeaveReason('');
        setLeaveFrom(new Date().toISOString().split('T')[0]);
        setLeaveTo(new Date().toISOString().split('T')[0]);
        setTimeout(() => setLeaveSuccess(false), 4000);
        await fetchLeaves();
      }
    } catch (e) {
      console.error('[StaffHRPanel]', e);
    } finally {
      setLeaveSubmitting(false);
    }
  };

  // Filter Attendance Records by Period (1 Month, Previous Month, 2 Months, All)
  const { filteredRecords, dateRangeLabel, startDateStr, endDateStr } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let start = new Date(currentYear, currentMonth, 1);
    let end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    let label = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    if (period === 'prevMonth') {
      start = new Date(currentYear, currentMonth - 1, 1);
      end = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else if (period === '2months') {
      start = new Date(currentYear, currentMonth - 1, 1);
      end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      const prevName = start.toLocaleDateString('en-US', { month: 'short' });
      const currName = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      label = `${prevName} & ${currName} (2 Months)`;
    } else if (period === 'all') {
      start = new Date(2020, 0, 1);
      end = new Date(2030, 11, 31);
      label = 'All Historical Records';
    }

    const filtered = attendance.filter((r) => {
      const d = new Date(r.clockIn || r.date || '');
      return d >= start && d <= end;
    });

    const fDate = (d: Date) => d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    return {
      filteredRecords: filtered,
      dateRangeLabel: label,
      startDateStr: fDate(start),
      endDateStr: fDate(end),
    };
  }, [attendance, period]);

  // Overtime & summary calculations on filtered records
  const calculatedRows = useMemo(() => {
    return filteredRecords.map((r) => {
      const cin = r.clockIn ? new Date(r.clockIn) : null;
      const cout = r.clockOut ? new Date(r.clockOut) : null;
      let dur = Number(r.durationHours) || 0;
      if (!dur && cin && cout) {
        dur = Math.max(0, (cout.getTime() - cin.getTime()) / 3600000);
      }
      const shift = Number(r.shiftHours) || staffShiftHours;
      const ot = Math.max(0, dur - shift);
      return {
        ...r,
        dur: Math.round(dur * 10) / 10,
        shift: Math.round(shift * 10) / 10,
        ot: Math.round(ot * 10) / 10,
        hasOt: ot > 0.05,
      };
    });
  }, [filteredRecords, staffShiftHours]);

  const uniqueDaysAttended = useMemo(() => {
    const dates = new Set(
      calculatedRows
        .filter((r) => r.status === 'PRESENT' || r.status === 'LATE' || r.dur > 0)
        .map((r) => (r.clockIn || r.date || '').split('T')[0])
    );
    return dates.size;
  }, [calculatedRows]);

  const totalWorkedHours = useMemo(() => {
    return Math.round(calculatedRows.reduce((sum, r) => sum + r.dur, 0) * 10) / 10;
  }, [calculatedRows]);

  const totalOvertimeHours = useMemo(() => {
    return Math.round(calculatedRows.reduce((sum, r) => sum + r.ot, 0) * 10) / 10;
  }, [calculatedRows]);

  const approvedLeavesCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'APPROVED').reduce((sum, l) => sum + (l.days || 1), 0);
  }, [leaves]);

  const standardWorkingDays = period === '2months' ? 52 : 26;
  const attendanceRate = Math.min(100, Math.round((uniqueDaysAttended / standardWorkingDays) * 100));

  // Direct PDF Download Handler
  const handleDownloadPDF = () => {
    downloadStaffSinglePDF({
      hotelName: propertyName || 'GuestFlow Hotel',
      propertyCode: propertyCode || undefined,
      staffName: displayName,
      designation: displayRole,
      periodLabel: dateRangeLabel,
      startDateStr,
      endDateStr,
      standardShiftHours: staffShiftHours,
      kpis: {
        daysAttended: uniqueDaysAttended,
        standardWorkingDays,
        attendanceRate,
        totalOvertimeHours,
        totalWorkedHours,
        leavesCount: approvedLeavesCount,
      },
      rows: calculatedRows.map((r) => {
        const dateObj = new Date(r.clockIn || r.date || '');
        const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
        const inTime = r.clockIn ? new Date(r.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
        const outTime = r.clockOut ? new Date(r.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '(Active)';
        return {
          date: dateStr,
          clockIn: inTime,
          clockOut: outTime,
          duration: r.dur > 0 ? `${r.dur.toFixed(1)}h` : '—',
          shift: `${r.shift.toFixed(1)}h`,
          overtime: r.hasOt ? `+${r.ot.toFixed(1)}h OT` : '—',
          status: r.status,
        };
      }),
    });
  };

  const accent = accentColor;
  const accentFaded = `${accent}18`;
  const accentBorder = `${accent}38`;

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '16px',
    marginBottom: 14,
  };

  const subTabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 6px',
    border: 'none',
    background: active ? accentFaded : 'transparent',
    borderBottom: `2px solid ${active ? accent : 'transparent'}`,
    color: active ? '#f8fafc' : '#64748b',
    fontSize: 10.5,
    fontWeight: 800,
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'all 0.2s',
    fontFamily: 'inherit',
    textAlign: 'center',
  });

  const periodBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: 10,
    border: `1px solid ${active ? accent : 'rgba(255,255,255,0.08)'}`,
    background: active ? accent : 'rgba(255,255,255,0.03)',
    color: active ? '#ffffff' : '#94a3b8',
    fontSize: 10,
    fontWeight: active ? 800 : 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  });

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '10px 12px',
    color: '#f1f5f9',
    fontSize: 12,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9.5,
    fontWeight: 800,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: 4,
    display: 'block',
  };

  const displayName = resolvedStaffName || staffName || 'Staff Member';
  const displayRole = resolvedDesignation || designation || 'Personnel';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ─── Printable Styles ─── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #staff-printable-report, #staff-printable-report * {
            visibility: visible;
          }
          #staff-printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: #ffffff !important;
            color: #0f172a !important;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          }
          .no-print {
            display: none !important;
          }
          .print-black-text {
            color: #0f172a !important;
          }
          .print-border {
            border-color: #cbd5e1 !important;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
          }
          .print-table th, .print-table td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px 8px;
            font-size: 10px;
            color: #0f172a !important;
          }
          .print-table th {
            background: #f1f5f9 !important;
            font-weight: 800;
          }
        }
      `}</style>

      {/* ─── Navigation Subtabs (Hidden on Print) ─── */}
      <div className="no-print" style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', borderRadius: 14, marginBottom: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <button style={subTabStyle(hrTab === 'report')} onClick={() => setHrTab('report')}>
          📊 Monthly & Overtime Report
        </button>
        <button style={subTabStyle(hrTab === 'attendance')} onClick={() => setHrTab('attendance')}>
          ⏱️ Clock In & Duty
        </button>
        <button style={subTabStyle(hrTab === 'leave')} onClick={() => setHrTab('leave')}>
          🏖️ Apply Leave ({leaves.filter(l => l.status === 'PENDING').length} Pending)
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          TAB 1: MONTHLY SHIFT & OVERTIME REPORT (With 1/2 Month & PDF)
          ══════════════════════════════════════════════════════════════ */}
      {hrTab === 'report' && (
        <div id="staff-printable-report" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* Printable Letterhead (Visible when printing or at top) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: 14, marginBottom: 16 }} className="print-border">
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: accent, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 2 }}>
                {propertyName ? `${propertyName} · ` : ''}{propertyCode ? `[${propertyCode}] · ` : ''}Staff HR Portal
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#f8fafc' }} className="print-black-text">
                Monthly Attendance & Overtime Statement
              </h2>
              <div style={{ fontSize: 10.5, color: '#94a3b8', marginTop: 3 }} className="print-black-text">
                <strong>{displayName}</strong> · <span style={{ opacity: 0.85 }}>{displayRole}</span> · Period: <span style={{ color: accent, fontWeight: 700 }}>{dateRangeLabel}</span> ({startDateStr} to {endDateStr})
              </div>
            </div>

            {/* Direct Download PDF Button (Staff portal has only Download PDF) */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleDownloadPDF}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 18px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 11,
                  fontWeight: 900,
                  cursor: 'pointer',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                <span>📥</span>
                <span>Download PDF Statement</span>
              </button>
            </div>
          </div>

          {/* Period Filter Buttons (No-print) */}
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
              Select Period:
            </span>
            <button style={periodBtnStyle(period === '1month')} onClick={() => setPeriod('1month')}>
              1 Month (Current)
            </button>
            <button style={periodBtnStyle(period === 'prevMonth')} onClick={() => setPeriod('prevMonth')}>
              Previous Month
            </button>
            <button style={periodBtnStyle(period === '2months')} onClick={() => setPeriod('2months')}>
              2 Months Report
            </button>
            <button style={periodBtnStyle(period === 'all')} onClick={() => setPeriod('all')}>
              All Records
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 16 }}>
            {/* Days Attended */}
            <div style={{ background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                🗓️ Days Attended
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc' }} className="print-black-text">
                {attLoading ? '…' : uniqueDaysAttended}
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginLeft: 4 }}>/ {standardWorkingDays}d</span>
              </div>
              <div style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 2 }}>
                Attendance: {attendanceRate}%
              </div>
            </div>

            {/* Daily Shift */}
            <div style={{ background: accentFaded, border: `1px solid ${accentBorder}`, borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                ⏱️ Standard Shift
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc' }} className="print-black-text">
                {staffShiftHours}
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginLeft: 4 }}>h / day</span>
              </div>
              <div style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 2 }}>
                Daily working quota
              </div>
            </div>

            {/* Overtime */}
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                ⚡ Total Overtime
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24' }}>
                +{attLoading ? '…' : totalOvertimeHours}
                <span style={{ fontSize: 11, fontWeight: 600, color: '#d97706', marginLeft: 4 }}>Hrs</span>
              </div>
              <div style={{ fontSize: 8.5, color: '#d97706', marginTop: 2 }}>
                Extra hours in {dateRangeLabel}
              </div>
            </div>

            {/* Total Worked */}
            <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 14, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                💼 Total Worked
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#f8fafc' }} className="print-black-text">
                {attLoading ? '…' : totalWorkedHours}
                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginLeft: 4 }}>Hrs</span>
              </div>
              <div style={{ fontSize: 8.5, color: '#94a3b8', marginTop: 2 }}>
                {approvedLeavesCount} approved leave{approvedLeavesCount === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          {/* Daily Shift & Overtime Breakdown Table */}
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#f8fafc' }} className="print-black-text">
                  Daily Punches & Overtime Log
                </span>
                <span style={{ fontSize: 9.5, color: '#64748b', marginLeft: 8 }}>
                  ({calculatedRows.length} punch records)
                </span>
              </div>
              <span style={{ fontSize: 9, color: '#94a3b8' }}>
                Standard Shift: <strong style={{ color: '#fff' }} className="print-black-text">{staffShiftHours}.0h</strong>
              </span>
            </div>

            {attLoading ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 11 }}>
                Loading report records…
              </div>
            ) : calculatedRows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#64748b', fontSize: 11 }}>
                No attendance punches found for {dateRangeLabel}.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="print-table">
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '8px 12px', fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '8px 12px', fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Clock In</th>
                      <th style={{ padding: '8px 12px', fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Clock Out</th>
                      <th style={{ padding: '8px 12px', fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Duration</th>
                      <th style={{ padding: '8px 12px', fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Shift</th>
                      <th style={{ padding: '8px 12px', fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Overtime</th>
                      <th style={{ padding: '8px 12px', fontSize: 9, fontWeight: 900, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculatedRows.map((r) => {
                      const dateObj = new Date(r.clockIn || r.date || '');
                      const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
                      const inTime = r.clockIn ? new Date(r.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
                      const outTime = r.clockOut ? new Date(r.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '(Active)';

                      return (
                        <tr
                          key={r.id}
                          style={{
                            borderBottom: '1px solid rgba(255,255,255,0.04)',
                            background: r.hasOt ? 'rgba(245,158,11,0.04)' : 'transparent',
                          }}
                        >
                          <td style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 700, color: '#f1f5f9' }} className="print-black-text">
                            {dateStr}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 10, color: '#38bdf8', fontFamily: 'monospace' }}>
                            {inTime}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 10, color: r.clockOut ? '#94a3b8' : '#34d399', fontFamily: 'monospace' }}>
                            {outTime}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 10.5, fontWeight: 800, color: '#f8fafc' }} className="print-black-text">
                            {r.dur > 0 ? `${r.dur.toFixed(1)}h` : '—'}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: 10, color: '#64748b' }}>
                            {r.shift.toFixed(1)}h
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {r.hasOt ? (
                              <span style={{ fontSize: 9.5, fontWeight: 900, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' }}>
                                ⚡ +{r.ot.toFixed(1)}h OT
                              </span>
                            ) : (
                              <span style={{ fontSize: 10, color: '#475569' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={statusBadgeStyle(r.status)}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Official Signatures Section for Printable PDF */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="print-border">
            <div style={{ textAlign: 'center', padding: '16px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.1)' }} className="print-border">
              <div style={{ height: 36 }} />
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="print-black-text">
                Employee Signature ({displayName})
              </div>
              <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>
                Verified by staff member
              </div>
            </div>

            <div style={{ textAlign: 'center', padding: '16px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.1)' }} className="print-border">
              <div style={{ height: 36 }} />
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }} className="print-black-text">
                Authorized Hotel / HR Manager
              </div>
              <div style={{ fontSize: 8.5, color: '#64748b', marginTop: 2 }}>
                Approved & Certified for Payroll
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 2: CLOCK IN / OUT & TODAY'S ACTIVE DUTY
          ══════════════════════════════════════════════════════════════ */}
      {hrTab === 'attendance' && (
        <>
          <div
            style={{
              ...cardStyle,
              textAlign: 'center',
              background: clockedIn
                ? 'linear-gradient(135deg,rgba(16,185,129,0.08),rgba(6,78,59,0.15))'
                : 'rgba(255,255,255,0.02)',
              border: `1.5px solid ${clockedIn ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)'}`,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 900,
                color: clockedIn ? '#34d399' : '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 6,
              }}
            >
              {clockedIn ? '🟢 ON DUTY · ACTIVE SHIFT' : '⭕ OFF DUTY · NOT CLOCKED IN'}
            </div>

            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', fontFamily: 'monospace', letterSpacing: 2 }}>
              {currentTime}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2, marginBottom: 14 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            {clockedIn && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(99,102,241,0.1)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 20,
                  padding: '6px 16px',
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 9.5, color: '#a5b4fc', fontWeight: 700 }}>Active Shift Timer</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>
                  {elapsedDisplay}
                </span>
              </div>
            )}

            {showClockButton && (
              <div>
                <button
                  onClick={handleClockAction}
                  disabled={clockLoading}
                  style={{
                    padding: '12px 40px',
                    borderRadius: 14,
                    background: clockedIn
                      ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                      : `linear-gradient(135deg,${accent},${accent}dd)`,
                    border: 'none',
                    color: '#fff',
                    fontSize: 11.5,
                    fontWeight: 900,
                    cursor: clockLoading ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.05em',
                    boxShadow: clockedIn ? '0 4px 16px rgba(239,68,68,0.35)' : `0 4px 16px ${accent}44`,
                    fontFamily: 'inherit',
                    opacity: clockLoading ? 0.7 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {clockLoading ? '⏳ Capturing GPS…' : clockedIn ? '⏸ CLOCK OUT SHIFT' : '▶ CLOCK IN FOR DUTY'}
                </button>
                <div style={{ fontSize: 9, color: '#475569', marginTop: 8 }}>
                  📍 Verified with GPS location & hotel coordinates
                </div>
              </div>
            )}
          </div>

          {/* Quick link to view Full Monthly Report */}
          <div
            onClick={() => setHrTab('report')}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              marginBottom: 14,
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#93c5fd' }}>
                📊 Need 1-Month or 2-Months PDF Report?
              </div>
              <div style={{ fontSize: 9.5, color: '#60a5fa', opacity: 0.8, marginTop: 2 }}>
                Click here to view your complete shift hours, overtime calculations, and print statements.
              </div>
            </div>
            <span style={{ fontSize: 13, color: '#93c5fd' }}>→</span>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TAB 3: APPLY FOR LEAVE & LEAVE STATUS
          ══════════════════════════════════════════════════════════════ */}
      {hrTab === 'leave' && (
        <>
          <div style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#f8fafc', marginBottom: 2 }}>
              Apply for Leave
            </div>
            <div style={{ fontSize: 9.5, color: '#64748b', marginBottom: 14 }}>
              Submit a leave application for approval by your hotel receptionist or manager.
            </div>

            {leaveSuccess && (
              <div
                style={{
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginBottom: 14,
                  color: '#34d399',
                  fontSize: 10.5,
                  fontWeight: 700,
                }}
              >
                ✅ Leave request submitted successfully! Your manager has been notified.
              </div>
            )}

            <form onSubmit={handleLeaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Leave Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                  {LEAVE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLeaveType(type)}
                      style={{
                        padding: '9px',
                        borderRadius: 8,
                        border: `1.5px solid ${leaveType === type ? accent : 'rgba(255,255,255,0.1)'}`,
                        background: leaveType === type ? accentFaded : 'transparent',
                        color: leaveType === type ? '#f8fafc' : '#64748b',
                        fontSize: 10.5,
                        fontWeight: 800,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >
                      {type === 'CASUAL' ? '🌴' : type === 'SICK' ? '🤒' : type === 'EARNED' ? '⭐' : '🚨'} {type}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>From Date</label>
                  <input
                    type="date"
                    value={leaveFrom}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setLeaveFrom(e.target.value);
                      if (leaveTo < e.target.value) setLeaveTo(e.target.value);
                    }}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>To Date</label>
                  <input
                    type="date"
                    value={leaveTo}
                    min={leaveFrom}
                    onChange={(e) => setLeaveTo(e.target.value)}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              {leaveFrom && leaveTo && (
                <div style={{ fontSize: 10, color: '#94a3b8', textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: '6px', borderRadius: 8 }}>
                  Total Duration: <strong style={{ color: '#f8fafc' }}>{Math.max(1, Math.round((new Date(leaveTo).getTime() - new Date(leaveFrom).getTime()) / 86400000) + 1)} Day(s)</strong>
                </div>
              )}

              <div>
                <label style={labelStyle}>Reason for Leave (Optional)</label>
                <textarea
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Provide reason for leave request…"
                  rows={2}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={leaveSubmitting}
                style={{
                  padding: '12px',
                  borderRadius: 12,
                  background: `linear-gradient(135deg,${accent},${accent}dd)`,
                  border: 'none',
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 900,
                  cursor: leaveSubmitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: leaveSubmitting ? 0.7 : 1,
                  letterSpacing: '0.04em',
                  boxShadow: `0 4px 14px ${accent}44`,
                }}
              >
                {leaveSubmitting ? '⏳ Submitting…' : '🏖️ Submit Leave Request'}
              </button>
            </form>
          </div>

          <div style={{ fontSize: 9.5, fontWeight: 900, color: '#64748b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
            My Leave Requests History
          </div>

          {leavesLoading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 11 }}>
              Loading leaves…
            </div>
          ) : leaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#64748b', fontSize: 11 }}>
              No leave requests submitted yet. Use the form above to apply.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {leaves.map((l) => {
                const fromStr = new Date(l.fromDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                const toStr = new Date(l.toDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                return (
                  <div
                    key={l.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 12,
                      padding: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 900, color: '#f1f5f9' }}>
                          {l.leaveType} LEAVE
                        </span>
                        <span style={{ fontSize: 9, color: '#94a3b8' }}>
                          · {l.days} {l.days === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 3 }}>
                        {fromStr}{fromStr !== toStr ? ` → ${toStr}` : ''}
                        {l.reason ? ` · "${l.reason}"` : ''}
                      </div>
                    </div>
                    <span style={statusBadgeStyle(l.status)}>
                      {l.status === 'PENDING' ? '⏳ Pending' : l.status === 'APPROVED' ? '✅ Approved' : '❌ Rejected'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
