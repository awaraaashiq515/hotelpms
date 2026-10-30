'use client';

import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Printer, 
  Download,
  User, 
  ChevronDown, 
  ChevronUp, 
  Filter
} from 'lucide-react';
import { downloadStaffSinglePDF, downloadStaffAllSummaryPDF } from '@/lib/staff-report-pdf';

export interface AttendanceRecord {
  id: string;
  userId?: string | null;
  staffMemberId?: string | null;
  propertyId: string;
  clockIn: string;
  clockOut?: string | null;
  status: string;
  note?: string | null;
  staffMember?: {
    id: string;
    name: string;
    designation?: string | null;
    shiftHours?: number | null;
  } | null;
  property?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface StaffItem {
  id: string;
  name: string;
  designation?: string | null;
  shiftHours?: number | null;
  department?: string | null;
  salary?: number | null;
}

export interface LeaveItem {
  id: string;
  staffId: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  days: number;
  status: string;
  reason?: string | null;
}

interface StaffMonthlyReportProps {
  staffList: StaffItem[];
  attendance: AttendanceRecord[];
  leaves: LeaveItem[];
  hotelName?: string;
  propertyCode?: string;
  onApplyLeave?: () => void;
}

type PeriodType = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_2_MONTHS' | 'ALL';

export function StaffMonthlyReport({
  staffList,
  attendance,
  leaves,
  hotelName = 'Hotel & Restaurant PMS',
  propertyCode = 'HTL12345',
  onApplyLeave
}: StaffMonthlyReportProps) {
  const [period, setPeriod] = useState<PeriodType>('THIS_MONTH');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null);

  // Date range calculation based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (period === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { start, end, label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
    }

    if (period === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end: prevEnd, label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) };
    }

    if (period === 'LAST_2_MONTHS') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      const startLabel = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const endLabel = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return { start, end, label: `${startLabel} - ${endLabel} (2 Months)` };
    }

    // ALL (Last 90 days)
    const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return { start, end, label: 'Last 90 Days' };
  }, [period]);

  // Filter attendance within date range
  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const d = new Date(a.clockIn);
      if (d < dateRange.start || d > dateRange.end) return false;
      if (selectedStaffId !== 'ALL' && a.staffMemberId !== selectedStaffId && a.staffMember?.id !== selectedStaffId) {
        return false;
      }
      return true;
    });
  }, [attendance, dateRange, selectedStaffId]);

  // Filter leaves within date range
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      const d = new Date(l.fromDate);
      if (d < dateRange.start || d > dateRange.end) return false;
      if (selectedStaffId !== 'ALL' && l.staffId !== selectedStaffId) return false;
      return true;
    });
  }, [leaves, dateRange, selectedStaffId]);

  // Aggregate stats per staff member
  const staffReports = useMemo(() => {
    const list = selectedStaffId === 'ALL' 
      ? staffList 
      : staffList.filter((s) => s.id === selectedStaffId);

    return list.map((staff) => {
      const staffAtt = filteredAttendance.filter(
        (a) => a.staffMemberId === staff.id || a.staffMember?.id === staff.id
      );

      // Unique days attended (Kitne din monthly aaya)
      const daySet = new Set<string>();
      let totalWorkedHours = 0;
      let totalOvertimeHours = 0;

      const defaultShift = staff.shiftHours || 8.0;

      const dailyRecords = staffAtt.map((rec) => {
        const inDate = new Date(rec.clockIn);
        const dateKey = inDate.toISOString().split('T')[0];
        daySet.add(dateKey);

        let durHours = 0;
        if (rec.clockOut) {
          const outDate = new Date(rec.clockOut);
          durHours = Math.max(0, (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60));
        } else {
          // If still clocked in or no clock out, treat as current shift duration up to standard
          durHours = defaultShift;
        }

        const shift = rec.staffMember?.shiftHours || defaultShift;
        const overtime = Math.max(0, durHours - shift);

        totalWorkedHours += durHours;
        totalOvertimeHours += overtime;

        return {
          id: rec.id,
          dateKey,
          clockIn: inDate,
          clockOut: rec.clockOut ? new Date(rec.clockOut) : null,
          durHours: Math.round(durHours * 10) / 10,
          shift,
          overtime: Math.round(overtime * 10) / 10,
          status: rec.status,
          property: rec.property?.name,
        };
      });

      const staffLeaves = filteredLeaves.filter((l) => l.staffId === staff.id);
      const approvedLeaveDays = staffLeaves
        .filter((l) => l.status === 'APPROVED')
        .reduce((sum, l) => sum + (l.days || 1), 0);
      const pendingLeaveDays = staffLeaves
        .filter((l) => l.status === 'PENDING')
        .reduce((sum, l) => sum + (l.days || 1), 0);

      // Standard working days in month (approx 26 days/month)
      const monthsCount = period === 'LAST_2_MONTHS' ? 2 : 1;
      const expectedWorkingDays = 26 * monthsCount;
      const daysAttended = daySet.size;
      const attendancePct = Math.min(100, Math.round((daysAttended / Math.max(1, expectedWorkingDays)) * 100));

      return {
        staff,
        shiftHours: defaultShift,
        daysAttended,
        expectedWorkingDays,
        attendancePct,
        totalWorkedHours: Math.round(totalWorkedHours * 10) / 10,
        totalOvertimeHours: Math.round(totalOvertimeHours * 10) / 10,
        approvedLeaveDays,
        pendingLeaveDays,
        dailyRecords: dailyRecords.sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime()),
      };
    });
  }, [staffList, filteredAttendance, filteredLeaves, selectedStaffId, period]);

  // Overall totals across all staff
  const overallStats = useMemo(() => {
    let totalShifts = 0;
    let totalWorked = 0;
    let totalOT = 0;
    let totalLeaves = 0;

    staffReports.forEach((sr) => {
      totalShifts += sr.daysAttended;
      totalWorked += sr.totalWorkedHours;
      totalOT += sr.totalOvertimeHours;
      totalLeaves += sr.approvedLeaveDays;
    });

    return {
      totalStaff: staffReports.length,
      totalShifts,
      totalWorked: Math.round(totalWorked * 10) / 10,
      totalOT: Math.round(totalOT * 10) / 10,
      totalLeaves,
    };
  }, [staffReports]);

  // Handle direct PDF Download Action
  const handleDownloadPdf = () => {
    const periodLabel = dateRange.label;
    const startStr = dateRange.start.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    const endStr = dateRange.end.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

    if (selectedStaffId === 'ALL') {
      downloadStaffAllSummaryPDF({
        hotelName: 'GuestFlow Hotel & PMS',
        periodLabel,
        startDateStr: startStr,
        endDateStr: endStr,
        totalStaffCount: staffReports.length,
        kpis: {
          totalPunches: overallStats.totalShifts,
          totalWorkedHours: overallStats.totalWorked,
          totalOvertimeHours: overallStats.totalOT,
          totalLeavesApproved: overallStats.totalLeaves,
        },
        staffSummaries: staffReports.map((sr) => ({
          name: sr.staff.name,
          designation: sr.staff.designation || 'Staff',
          daysAttended: `${sr.daysAttended} / ${sr.expectedWorkingDays}d`,
          shiftHours: `${sr.shiftHours}.0h`,
          totalOvertime: sr.totalOvertimeHours > 0 ? `+${sr.totalOvertimeHours.toFixed(1)}h` : '0h',
          totalWorked: `${sr.totalWorkedHours.toFixed(1)}h`,
          leaves: `${sr.approvedLeaveDays}d`,
          rate: `${sr.attendancePct}%`,
        })),
      });
    } else {
      const target = staffReports[0];
      if (!target) return;
      downloadStaffSinglePDF({
        hotelName: 'GuestFlow Hotel & PMS',
        staffName: target.staff.name,
        designation: target.staff.designation || 'Staff',
        periodLabel,
        startDateStr: startStr,
        endDateStr: endStr,
        standardShiftHours: target.shiftHours,
        kpis: {
          daysAttended: target.daysAttended,
          standardWorkingDays: target.expectedWorkingDays,
          attendanceRate: target.attendancePct,
          totalOvertimeHours: target.totalOvertimeHours,
          totalWorkedHours: target.totalWorkedHours,
          leavesCount: target.approvedLeaveDays,
        },
        rows: target.dailyRecords.map((r) => {
          const inTime = r.clockIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
          const outTime = r.clockOut ? r.clockOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '(Active)';
          const dateStr = r.clockIn.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short' });
          return {
            date: dateStr,
            clockIn: inTime,
            clockOut: outTime,
            duration: r.durHours > 0 ? `${r.durHours.toFixed(1)}h` : '—',
            shift: `${(r.shift || 0).toFixed(1)}h`,
            overtime: (r.overtime || 0) > 0 ? `+${r.overtime.toFixed(1)}h OT` : '—',
            status: r.status,
          };
        }),
      });
    }
  };

  // Handle Print Action (Browser print dialog)
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* ── PRINT-ONLY STYLES ── */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
          }
          header, nav, aside, .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .printable-report {
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .print-card {
            background: #f8fafc !important;
            border: 1px solid #cbd5e1 !important;
            color: #000000 !important;
            break-inside: avoid;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            color: #0f172a !important;
            padding: 6px 8px !important;
          }
          th {
            background: #f1f5f9 !important;
            font-weight: bold !important;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>

      {/* ── REPORT CONTROLS (Screen Only) ── */}
      <div className="no-print rounded-2xl bg-slate-900/80 border border-white/10 p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Period selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Calendar size={12} className="text-blue-400" /> Period:
            </span>
            {[
              { id: 'THIS_MONTH', label: '1 Month (Current)' },
              { id: 'LAST_MONTH', label: 'Previous Month' },
              { id: 'LAST_2_MONTHS', label: '2 Months Report' },
              { id: 'ALL', label: 'All Records' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as PeriodType)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  period === p.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 ring-1 ring-blue-400/50'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Staff Filter & Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter by staff */}
            <div className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1">
              <Filter size={11} className="text-slate-400" />
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="bg-transparent text-[10.5px] font-bold text-white focus:outline-none cursor-pointer pr-1"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Staff Members</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name} ({s.designation || 'Staff'})
                  </option>
                ))}
              </select>
            </div>

            {/* Direct Download PDF Button */}
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-900/30 active:scale-95 cursor-pointer"
              title="Download official PDF report file"
            >
              <Download size={13} strokeWidth={2.5} />
              <span>Download PDF</span>
            </button>

            {/* Print Report Button */}
            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 text-[11px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              title="Open browser print dialog for physical printing"
            >
              <Printer size={13} strokeWidth={2.5} />
              <span>Print Report</span>
            </button>

            {/* Apply Leave Shortcut */}
            {onApplyLeave && (
              <button
                onClick={onApplyLeave}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold transition-all cursor-pointer"
              >
                <span>🏖️ Apply Leave</span>
              </button>
            )}
          </div>
        </div>

        {/* Current Active Report Title Strip */}
        <div className="mt-3 pt-3 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">Active Period:</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-extrabold text-[10.5px]">
              {dateRange.label}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            Records calculate daily shift hours &amp; overtime beyond regular daily shift
          </span>
        </div>
      </div>

      {/* ── PRINT-ONLY HEADER (Appears on PDF Export) ── */}
      <div className="print-only mb-6 border-b-2 border-slate-900 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">{hotelName}</h1>
            <p className="text-xs text-slate-600 font-medium">Hotel PMS · Human Resources &amp; Payroll Attendance Department</p>
            <p className="text-xs text-slate-600">Property Code: <strong>{propertyCode}</strong></p>
          </div>
          <div className="text-right">
            <div className="text-sm font-black uppercase tracking-wider text-slate-800">
              Staff Monthly Attendance &amp; Overtime Report
            </div>
            <p className="text-xs text-slate-600">Period: <strong>{dateRange.label}</strong></p>
            <p className="text-[10px] text-slate-500">Generated: {new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* ── SUMMARY STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* 1. Days Attended / Shifts */}
        <div className="print-card rounded-2xl border border-blue-500/20 bg-blue-950/20 p-3.5">
          <div className="flex items-center justify-between text-blue-400 mb-1">
            <span className="text-[9.5px] font-black uppercase tracking-wider">Days Attended</span>
            <span className="text-sm">🗓️</span>
          </div>
          <p className="text-2xl font-black text-white">{overallStats.totalShifts}</p>
          <p className="text-[9.5px] text-slate-400 mt-0.5">Total present shifts in period</p>
        </div>

        {/* 2. Standard Shift */}
        <div className="print-card rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-3.5">
          <div className="flex items-center justify-between text-indigo-400 mb-1">
            <span className="text-[9.5px] font-black uppercase tracking-wider">Daily Shift</span>
            <span className="text-sm">⏱️</span>
          </div>
          <p className="text-2xl font-black text-white">8.0 <span className="text-xs font-semibold text-slate-400">h/day</span></p>
          <p className="text-[9.5px] text-slate-400 mt-0.5">Standard daily duty</p>
        </div>

        {/* 3. Overtime Logged */}
        <div className="print-card rounded-2xl border border-amber-500/20 bg-amber-950/20 p-3.5">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-[9.5px] font-black uppercase tracking-wider">Total Overtime</span>
            <span className="text-sm">⚡</span>
          </div>
          <p className="text-2xl font-black text-amber-300">+{overallStats.totalOT} <span className="text-xs font-semibold text-amber-500">hrs</span></p>
          <p className="text-[9.5px] text-amber-400/80 mt-0.5">Extra hours beyond shift</p>
        </div>

        {/* 4. Total Worked Hours */}
        <div className="print-card rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-3.5">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-[9.5px] font-black uppercase tracking-wider">Hours Worked</span>
            <span className="text-sm">💼</span>
          </div>
          <p className="text-2xl font-black text-white">{overallStats.totalWorked} <span className="text-xs font-semibold text-slate-400">hrs</span></p>
          <p className="text-[9.5px] text-slate-400 mt-0.5">Regular + Overtime total</p>
        </div>

        {/* 5. Approved Leaves */}
        <div className="print-card rounded-2xl border border-purple-500/20 bg-purple-950/20 p-3.5 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-purple-400 mb-1">
            <span className="text-[9.5px] font-black uppercase tracking-wider">Leaves Taken</span>
            <span className="text-sm">🏖️</span>
          </div>
          <p className="text-2xl font-black text-white">{overallStats.totalLeaves} <span className="text-xs font-semibold text-slate-400">days</span></p>
          <p className="text-[9.5px] text-slate-400 mt-0.5">Approved staff leaves</p>
        </div>
      </div>

      {/* ── STAFF MONTHLY BREAKDOWN TABLE ── */}
      <div className="printable-report rounded-2xl bg-slate-900/60 border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-4 py-3 bg-slate-800/60 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={14} className="text-blue-400" />
            <span className="text-xs font-black text-white uppercase tracking-wider">
              Staff Shift, Attendance &amp; Overtime Summary ({staffReports.length} Staff)
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">
            Report for: <span className="text-blue-300 font-black">{dateRange.label}</span>
          </span>
        </div>

        {staffReports.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-xs">
            No staff records found for this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 text-[9.5px] font-black uppercase tracking-wider border-b border-white/10">
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3 text-center">Daily Shift</th>
                  <th className="py-3 px-3 text-center">Days Attended</th>
                  <th className="py-3 px-3 text-center">Total Worked</th>
                  <th className="py-3 px-3 text-center">Overtime (OT)</th>
                  <th className="py-3 px-3 text-center">Leaves</th>
                  <th className="py-3 px-3 text-center">Attendance %</th>
                  <th className="py-3 px-4 text-right no-print">Punch Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {staffReports.map((sr) => {
                  const isExpanded = expandedStaffId === sr.staff.id;
                  const hasOvertime = sr.totalOvertimeHours > 0;

                  return (
                    <React.Fragment key={sr.staff.id}>
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        
                        {/* 1. Name & Designation */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center font-black text-white text-[11px] shadow-sm shrink-0">
                              {sr.staff.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-black text-white text-[12px] leading-tight">{sr.staff.name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{sr.staff.designation || 'Staff'}</p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Kitne Hour Ki Shift Hai */}
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-extrabold text-[11px]">
                            <Clock size={11} /> {sr.shiftHours} hrs/day
                          </span>
                        </td>

                        {/* 3. Kitne Din Monthly Aaya */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="font-black text-white text-[13px]">
                              {sr.daysAttended} <span className="text-[10px] text-slate-400 font-bold">Days</span>
                            </span>
                            <span className="text-[9px] text-slate-500">
                              of {sr.expectedWorkingDays} working days
                            </span>
                          </div>
                        </td>

                        {/* 4. Total Worked Hours */}
                        <td className="py-3.5 px-3 text-center font-bold text-slate-200">
                          {sr.totalWorkedHours} <span className="text-[10px] text-slate-500">hrs</span>
                        </td>

                        {/* 5. Overtime Kitna Kiya */}
                        <td className="py-3.5 px-3 text-center">
                          {hasOvertime ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/35 text-amber-300 font-black text-[11px] shadow-sm">
                              ⚡ +{sr.totalOvertimeHours} hrs
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium text-[11px]">0.0 hrs</span>
                          )}
                        </td>

                        {/* 6. Leaves */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="text-[10.5px]">
                            <span className="font-bold text-purple-300">{sr.approvedLeaveDays} approved</span>
                            {sr.pendingLeaveDays > 0 && (
                              <div className="text-[9px] text-amber-400 font-semibold mt-0.5">
                                ({sr.pendingLeaveDays} pending)
                              </div>
                            )}
                          </div>
                        </td>

                        {/* 7. Attendance Rate % */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex flex-col items-center gap-1 w-20 mx-auto">
                            <span className={`text-[10.5px] font-black ${sr.attendancePct >= 80 ? 'text-emerald-400' : sr.attendancePct >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>
                              {sr.attendancePct}%
                            </span>
                            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${sr.attendancePct >= 80 ? 'bg-emerald-500' : sr.attendancePct >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${sr.attendancePct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* 8. Action - View Daily Punch Breakdown */}
                        <td className="py-3.5 px-4 text-right no-print">
                          <button
                            onClick={() => setExpandedStaffId(isExpanded ? null : sr.staff.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold transition-all border border-slate-700/60"
                          >
                            <span>{isExpanded ? 'Hide' : 'Daily Logs'}</span>
                            {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Daily Logs for this staff */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b border-white/5">
                          <td colSpan={8} className="p-4">
                            <div className="rounded-xl border border-slate-800 bg-[#080d1a] p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                                <span className="font-black text-slate-300 flex items-center gap-1.5">
                                  <Clock size={12} className="text-amber-400" />
                                  Daily Attendance &amp; Overtime Log — {sr.staff.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold">
                                  Standard Daily Shift: <strong className="text-indigo-300">{sr.shiftHours} hrs</strong>
                                </span>
                              </div>

                              {sr.dailyRecords.length === 0 ? (
                                <p className="text-[10.5px] text-slate-500 py-3 text-center">
                                  No punch records logged for {sr.staff.name} in this period.
                                </p>
                              ) : (
                                <div className="max-h-60 overflow-y-auto no-scrollbar">
                                  <table className="w-full text-left text-[11px]">
                                    <thead>
                                      <tr className="text-[9px] font-bold text-slate-500 uppercase border-b border-slate-800">
                                        <th className="py-1.5 px-2">Date</th>
                                        <th className="py-1.5 px-2">Clock In</th>
                                        <th className="py-1.5 px-2">Clock Out</th>
                                        <th className="py-1.5 px-2 text-center">Worked Hours</th>
                                        <th className="py-1.5 px-2 text-center">Shift Standard</th>
                                        <th className="py-1.5 px-2 text-center">Overtime</th>
                                        <th className="py-1.5 px-2 text-right">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                      {sr.dailyRecords.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-800/20">
                                          <td className="py-2 px-2 font-bold text-slate-300">
                                            {d.clockIn.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                          </td>
                                          <td className="py-2 px-2 text-emerald-400 font-mono">
                                            {d.clockIn.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                          </td>
                                          <td className="py-2 px-2 text-slate-400 font-mono">
                                            {d.clockOut ? (
                                              d.clockOut.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                                            ) : (
                                              <span className="text-amber-400 font-bold animate-pulse">Active On Duty</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-2 text-center font-bold text-white">
                                            {d.durHours}h
                                          </td>
                                          <td className="py-2 px-2 text-center text-slate-400">
                                            {d.shift}h
                                          </td>
                                          <td className="py-2 px-2 text-center">
                                            {d.overtime > 0 ? (
                                              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                                                +{d.overtime}h OT
                                              </span>
                                            ) : (
                                              <span className="text-slate-600">—</span>
                                            )}
                                          </td>
                                          <td className="py-2 px-2 text-right">
                                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                              {d.status}
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PRINT-ONLY FOOTER SIGNATURE BLOCK ── */}
      <div className="print-only mt-12 pt-6 border-t border-slate-300">
        <div className="grid grid-cols-3 gap-6 text-center text-xs text-slate-800">
          <div>
            <div className="h-10 border-b border-dashed border-slate-400 mb-2"></div>
            <p className="font-bold">Prepared By</p>
            <p className="text-[10px] text-slate-500">HR / Front Desk Receptionist</p>
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-400 mb-2"></div>
            <p className="font-bold">Verified By</p>
            <p className="text-[10px] text-slate-500">Operations Manager</p>
          </div>
          <div>
            <div className="h-10 border-b border-dashed border-slate-400 mb-2"></div>
            <p className="font-bold">Approved By</p>
            <p className="text-[10px] text-slate-500">General Manager / Owner</p>
          </div>
        </div>
      </div>
    </div>
  );
}
