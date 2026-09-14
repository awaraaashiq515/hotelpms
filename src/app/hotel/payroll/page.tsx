'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { IndianRupee, RefreshCw, Play, CheckCircle2, Users, Calendar, SlidersHorizontal, AlertCircle, X, Clock, Edit2, Settings } from 'lucide-react';
import { PayrollTable, type PayrollEntry } from './components/PayrollTable';
import { SalarySlip, type SalarySlipData } from './components/SalarySlip';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PayrollPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [viewMode, setViewMode]           = useState<'simple' | 'detailed'>('simple');

  const [runData, setRunData]             = useState<any | null>(null);
  const [entries, setEntries]             = useState<PayrollEntry[]>([]);
  const [propertyName, setPropertyName]   = useState('Your Hotel');
  const [disbursementDay, setDisbursementDay] = useState(7);
  const [slipFor, setSlipFor]             = useState<PayrollEntry | null>(null);
  const [adjustingEntry, setAdjustingEntry] = useState<PayrollEntry | null>(null);
  const [adjPresent, setAdjPresent]       = useState(26);
  const [adjLeave, setAdjLeave]           = useState(0);
  const [savingAdj, setSavingAdj]         = useState(false);

  const [processing, setProcessing]       = useState(false);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const monthName = MONTH_NAMES[selectedMonth - 1] || 'Current Month';

  // Fetch or create payroll run for selected month/year
  const fetchPayrollRun = useCallback(async (forcedStructure?: 'FLAT' | 'STATUTORY', forceRecalc?: boolean) => {
    try {
      setLoading(true);
      setError(null);

      // Fetch property name and payroll settings
      try {
        const [propRes, settingsRes] = await Promise.all([
          fetch('/api/setup/properties'),
          fetch('/api/payroll-settings').catch(() => null),
        ]);

        if (propRes.ok) {
          const propJson = await propRes.json();
          const list = Array.isArray(propJson.data) ? propJson.data : (Array.isArray(propJson) ? propJson : []);
          if (list.length > 0 && list[0].name) {
            setPropertyName(list[0].name);
          }
        }

        if (settingsRes && settingsRes.ok) {
          const sJson = await settingsRes.json();
          if (sJson.data?.salaryDisbursementDay) {
            setDisbursementDay(sJson.data.salaryDisbursementDay);
          }
        }
      } catch {
        /* optional */
      }

      // Determine structure
      const struct = forcedStructure || (viewMode === 'detailed' ? 'STATUTORY' : 'FLAT');
      const recalcParam = forceRecalc ? '&recalc=true' : '';

      // Fetch payroll run
      const res = await fetch(`/api/payroll-runs?month=${selectedMonth}&year=${selectedYear}&structure=${struct}${recalcParam}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to fetch payroll data');
      }

      const run = json.data;
      setRunData(run);

      if (run && Array.isArray(run.entries)) {
        const mappedEntries: PayrollEntry[] = run.entries.map((e: any) => ({
          id: e.id,
          staffId: e.staffId,
          name: e.staffName,
          designation: e.designation || 'Staff',
          dept: 'General',
          basicSalary: Math.round(e.basicSalary || 0),
          grossSalary: Math.round(e.grossSalary || 0),
          deductions: Math.round(e.deductions || 0),
          netSalary: Math.round(e.netSalary || 0),
          paidDays: e.paidDays !== undefined ? e.paidDays : 26,
          workingDays: e.workingDays !== undefined ? e.workingDays : 26,
          presentDays: e.presentDays !== undefined ? e.presentDays : (e.paidDays || 26),
          leaveDays: e.leaveDays !== undefined ? e.leaveDays : 0,
          absentDays: e.absentDays !== undefined ? e.absentDays : 0,
          status: e.status || 'PENDING',
        }));
        setEntries(mappedEntries);
      } else {
        setEntries([]);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading payroll');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, viewMode]);

  useEffect(() => {
    fetchPayrollRun();
  }, [fetchPayrollRun]);

  function handleModeChange(newMode: 'simple' | 'detailed') {
    setViewMode(newMode);
    const struct = newMode === 'detailed' ? 'STATUTORY' : 'FLAT';
    fetchPayrollRun(struct, true);
  }

  // Open attendance adjustment modal
  function openAdjustDaysModal(entry: PayrollEntry) {
    setAdjustingEntry(entry);
    setAdjPresent(entry.presentDays !== undefined ? entry.presentDays : entry.paidDays);
    setAdjLeave(entry.leaveDays !== undefined ? entry.leaveDays : 0);
  }

  // Save attendance days adjustment
  async function handleSaveAdjustment(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustingEntry || !runData?.id) return;

    try {
      setSavingAdj(true);
      const working = adjustingEntry.workingDays || 26;
      const absent = Math.max(0, working - adjPresent - adjLeave);

      const res = await fetch(`/api/payroll-runs/${runData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryId: adjustingEntry.id,
          presentDays: adjPresent,
          leaveDays:   adjLeave,
          absentDays:  absent,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to update attendance days');
      }

      // Re-fetch to get recalculated totals
      await fetchPayrollRun();
      setAdjustingEntry(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save adjustment');
    } finally {
      setSavingAdj(false);
    }
  }

  // Bulk process all pending salaries
  async function processAll() {
    if (!runData?.id) return;
    try {
      setProcessing(true);
      const res = await fetch(`/api/payroll-runs/${runData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processAll: true }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to process salaries');
      }

      // Update state
      setEntries(prev => prev.map(e => e.status === 'PENDING' ? { ...e, status: 'PROCESSED' } : e));
    } catch (err: any) {
      alert(err.message || 'Failed to process salaries');
    } finally {
      setProcessing(false);
    }
  }

  // Mark single employee entry as PAID
  async function handleMarkPaid(entryId: string) {
    if (!runData?.id) return;
    try {
      const res = await fetch(`/api/payroll-runs/${runData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId, status: 'PAID' }),
      });

      if (res.ok) {
        setEntries(prev => prev.map(e => e.id === entryId ? { ...e, status: 'PAID' } : e));
      } else {
        const errJson = await res.json();
        alert(errJson.message || 'Failed to update entry');
      }
    } catch (err: any) {
      alert(err.message || 'Network error');
    }
  }

  // Build slip data for modal
  function buildSlipData(e: PayrollEntry): SalarySlipData {
    const isStatutory = viewMode === 'detailed';
    const HRA_RATE    = 0.20;
    const CONVEYANCE  = 1600;
    const PF_RATE     = 0.12;
    const ESI_RATE    = 0.0075;

    const hra        = isStatutory ? Math.round(e.basicSalary * HRA_RATE) : 0;
    const conveyance = isStatutory ? CONVEYANCE : 0;
    const otherAllow = isStatutory ? Math.max(0, e.grossSalary - e.basicSalary - hra - conveyance) : 0;
    const pf         = isStatutory ? Math.round(e.basicSalary * PF_RATE) : 0;
    const esi        = isStatutory ? Math.round(e.grossSalary * ESI_RATE) : 0;
    const tds        = isStatutory ? Math.max(0, e.deductions - pf - esi) : 0;

    return {
      staffName: e.name,
      designation: e.designation,
      department: e.dept,
      employeeId: `EMP-${e.id.slice(-5).toUpperCase()}`,
      month: monthName,
      year: selectedYear,
      basicSalary: e.basicSalary,
      hra,
      conveyance,
      otherAllowances: otherAllow,
      pf,
      esi,
      tds,
      otherDeductions: 0,
      workingDays: e.workingDays,
      paidDays: e.paidDays,
      presentDays: e.presentDays,
      leaveDays: e.leaveDays,
      absentDays: e.absentDays,
      propertyName,
      structure: isStatutory ? 'STATUTORY' : 'FLAT',
    };
  }

  const totalNet   = entries.reduce((s, e) => s + e.netSalary, 0);
  const pending    = entries.filter(e => e.status === 'PENDING').length;
  const processed  = entries.filter(e => e.status === 'PROCESSED').length;
  const paidCount  = entries.filter(e => e.status === 'PAID').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-emerald-400" />
          <p className="text-sm text-slate-400">Loading payroll data…</p>
        </div>
      </div>
    );
  }

  // Salary slip view
  if (slipFor) {
    return (
      <div className="max-w-[1400px] mx-auto pb-10">
        <SalarySlip data={buildSlipData(slipFor)} onClose={() => setSlipFor(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Finance & Accounts · Payroll</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            Payroll — {monthName} {selectedYear}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {entries.length} employees · ₹{totalNet.toLocaleString('en-IN')} total net payout · Disbursement cycle on the {disbursementDay}{disbursementDay === 1 ? 'st' : disbursementDay === 2 ? 'nd' : disbursementDay === 3 ? 'rd' : 'th'} of the month
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Month / Year picker */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-white/10 rounded-xl p-1">
            <Calendar size={13} className="text-slate-400 ml-2" />
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              aria-label="Select month"
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer py-1 px-1.5"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-slate-900 text-white">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              aria-label="Select year"
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer py-1 px-1.5 border-l border-white/10"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Simple vs Detailed toggle */}
          <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => handleModeChange('simple')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'simple'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Flat Salary (Fixed)
            </button>
            <button
              onClick={() => handleModeChange('detailed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                viewMode === 'detailed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Statutory (PF/ESI)
            </button>
          </div>

          {/* Settings Button */}
          <Link
            href="/hotel/payroll/settings"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors border border-white/10"
            title="Configure payroll settings, leave quotas, and salary dates"
          >
            <Settings size={13} />
            <span>Payroll Settings</span>
          </Link>

          {/* Process Salaries Action */}
          {pending > 0 ? (
            <button
              onClick={processAll}
              disabled={processing}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider disabled:opacity-60 transition-colors shadow-lg shadow-emerald-600/20"
            >
              {processing ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              {processing ? 'Processing…' : `Process ${pending} Salaries`}
            </button>
          ) : entries.length > 0 ? (
            <div className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-900/30 border border-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <CheckCircle2 size={12} />
              All Processed
            </div>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-900/20 border border-rose-500/30 text-rose-300 text-xs">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Employees', value: entries.length, color: 'text-blue-300 border-blue-500/20 bg-blue-900/20' },
          { label: 'Pending Processing', value: pending,     color: 'text-amber-300 border-amber-500/20 bg-amber-900/20' },
          { label: 'Processed',       value: processed,      color: 'text-sky-300 border-sky-500/20 bg-sky-900/20' },
          { label: 'Disbursed / Paid', value: paidCount,     color: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {entries.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
            <Users size={24} className="text-slate-500" />
          </div>
          <div>
            <p className="text-white font-black text-sm">No active staff with salary configured</p>
            <p className="text-slate-400 text-xs mt-1 max-w-sm">
              To generate payroll for {monthName} {selectedYear}, ensure staff members have a valid monthly salary configured in your staff management.
            </p>
          </div>
          <a
            href="/hotel/staff-members"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-emerald-600/20"
          >
            Manage Staff Members
          </a>
        </div>
      ) : (
        /* Real Payroll Table */
        <PayrollTable
          entries={entries}
          viewMode={viewMode}
          onView={e => setSlipFor(e)}
          onProcess={handleMarkPaid}
          onAdjustDays={openAdjustDaysModal}
        />
      )}

      {/* Adjust Attendance Days Modal */}
      {adjustingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Adjust Attendance & Days
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {adjustingEntry.name} ({adjustingEntry.designation})
                </p>
              </div>
              <button
                onClick={() => setAdjustingEntry(null)}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Monthly Base Salary</p>
                  <p className="text-sm font-black text-white mt-0.5">₹{adjustingEntry.basicSalary.toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Daily Rate</p>
                  <p className="text-sm font-black text-emerald-400 mt-0.5">
                    ₹{Math.round(adjustingEntry.basicSalary / (adjustingEntry.workingDays || 26)).toLocaleString('en-IN')} / day
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Days Present
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={adjustingEntry.workingDays || 26}
                    value={adjPresent}
                    onChange={e => setAdjPresent(Math.max(0, Math.min(adjustingEntry.workingDays || 26, Number(e.target.value))))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500 font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Paid Leaves
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={adjustingEntry.workingDays || 26}
                    value={adjLeave}
                    onChange={e => setAdjLeave(Math.max(0, Math.min(adjustingEntry.workingDays || 26, Number(e.target.value))))}
                    className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs focus:outline-none focus:border-blue-500 font-bold"
                    required
                  />
                </div>
              </div>

              {/* Calculated Summary Preview */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-white/10 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Standard Working Days:</span>
                  <span className="font-bold text-white">{adjustingEntry.workingDays || 26} Days</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Unpaid Absences:</span>
                  <span className={`font-bold ${Math.max(0, (adjustingEntry.workingDays || 26) - adjPresent - adjLeave) > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                    {Math.max(0, (adjustingEntry.workingDays || 26) - adjPresent - adjLeave)} Days
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Paid Days:</span>
                  <span className="font-bold text-emerald-400">
                    {Math.min(adjustingEntry.workingDays || 26, adjPresent + adjLeave)} of {adjustingEntry.workingDays || 26} Days
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-300">Recalculated Net Salary:</span>
                  <span className="text-base font-black text-emerald-400">
                    ₹{Math.max(
                      0,
                      Math.round(
                        (adjustingEntry.basicSalary / (adjustingEntry.workingDays || 26)) *
                        Math.min(adjustingEntry.workingDays || 26, adjPresent + adjLeave)
                      )
                    ).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAdjustingEntry(null)}
                  className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdj}
                  className="h-9 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-lg shadow-emerald-600/20"
                >
                  {savingAdj ? 'Saving…' : 'Save Attendance Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
