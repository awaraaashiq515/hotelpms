'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save,
  CheckCircle2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Clock,
  FileText,
  AlertCircle,
  RefreshCw,
  Sliders,
  Award
} from 'lucide-react';

interface PayrollSettingsData {
  id?: string;
  salaryDisbursementDay: number;
  standardWorkingDays: number;
  defaultPaidLeaves: number;
  defaultStructure: 'FLAT' | 'STATUTORY';
  enableHra: boolean;
  hraPercentage: number;
  enablePf: boolean;
  pfPercentage: number;
  enableEsi: boolean;
  esiPercentage: number;
  enableTds: boolean;
  enableOvertime: boolean;
  overtimeHourlyRate: number;
  authorizedSignatory: string;
  currency: string;
}

export default function PayrollSettingsPage() {
  const [settings, setSettings] = useState<PayrollSettingsData>({
    salaryDisbursementDay: 7,
    standardWorkingDays: 26,
    defaultPaidLeaves: 2,
    defaultStructure: 'FLAT',
    enableHra: false,
    hraPercentage: 20.0,
    enablePf: false,
    pfPercentage: 12.0,
    enableEsi: false,
    esiPercentage: 0.75,
    enableTds: false,
    enableOvertime: false,
    overtimeHourlyRate: 100.0,
    authorizedSignatory: 'Hotel General Manager',
    currency: 'INR',
  });

  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch('/api/payroll-settings');
        if (!res.ok) throw new Error('Failed to load payroll settings');
        const json = await res.json();
        if (json.data) {
          setSettings(json.data);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error fetching settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/payroll-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to save settings');
      }

      setSuccessMsg('Payroll settings and policies saved successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-emerald-400" />
          <p className="text-sm text-slate-400">Loading payroll settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-[1000px] mx-auto text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-5">
        <div>

          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Sliders size={22} className="text-emerald-400" />
            Payroll Settings & Policy Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure salary disbursement schedule, paid leave quota, working days, and salary calculation rules.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20"
        >
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs shadow-sm">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs shadow-sm">
          <AlertCircle size={16} className="shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Salary Schedule & Disbursement Date */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Calendar size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                1. Salary Cycle & Disbursement Schedule
              </h2>
              <p className="text-[11px] text-slate-400">
                Define the recurring monthly salary date and standard monthly working days.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Monthly Salary Disbursement Day
              </label>
              <select
                value={settings.salaryDisbursementDay}
                onChange={e => setSettings({ ...settings, salaryDisbursementDay: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 28, 30].map(day => (
                  <option key={day} value={day}>
                    {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of every month
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Day of the month on which salaries are processed and paid to staff.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Standard Monthly Working Days
              </label>
              <select
                value={settings.standardWorkingDays}
                onChange={e => setSettings({ ...settings, standardWorkingDays: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value={26}>26 Days (Standard 6-day work week with 4 weekly offs)</option>
                <option value={24}>24 Days (6-day work week with 2 alternate Saturdays)</option>
                <option value={30}>30 Days (Continuous operations / 30-day calendar)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Used to compute the per-day salary rate for absence deductions.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Leave Quotas & Absence Policies */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Award size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                2. Paid Leave Quota & Absence Policies
              </h2>
              <p className="text-[11px] text-slate-400">
                Specify allowed paid leaves and unpaid absence deduction rules.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Default Monthly Paid Leaves Allowed
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={settings.defaultPaidLeaves}
                  onChange={e => setSettings({ ...settings, defaultPaidLeaves: Math.max(0, Number(e.target.value)) })}
                  className="w-28 h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-medium">Days per month per staff</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Number of casual / medical leaves allowed per month without salary deduction.
              </p>
            </div>

            <div className="rounded-xl bg-slate-800/40 p-3.5 border border-white/5">
              <p className="text-xs font-bold text-slate-200">Unpaid Absence Rule</p>
              <p className="text-[11px] text-slate-400 mt-1">
                When an employee takes unapproved leave or exceeds their monthly paid leave quota, the system automatically deducts pro-rata daily salary:
              </p>
              <div className="mt-2 p-2 rounded-lg bg-slate-900/70 border border-white/5 text-[11px] font-mono text-emerald-300">
                Daily Deduction = Basic Monthly Salary ÷ {settings.standardWorkingDays}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Salary Structure Mode (Flat vs Statutory) */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <DollarSign size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                3. Default Salary Calculation Structure
              </h2>
              <p className="text-[11px] text-slate-400">
                Select how salaries are calculated by default across all hotel and restaurant staff.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Flat Option */}
            <div
              onClick={() => setSettings({ ...settings, defaultStructure: 'FLAT' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.defaultStructure === 'FLAT'
                  ? 'bg-emerald-950/30 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                  : 'bg-slate-800/30 border-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-emerald-400">Flat Fixed Salary (Recommended)</span>
                <input
                  type="radio"
                  name="structure"
                  checked={settings.defaultStructure === 'FLAT'}
                  onChange={() => setSettings({ ...settings, defaultStructure: 'FLAT' })}
                  className="accent-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Standard flat monthly salary. No automatic PF, ESI, or HRA deductions. What you configure on the staff member is what they are paid.
              </p>
            </div>

            {/* Statutory Option */}
            <div
              onClick={() => setSettings({ ...settings, defaultStructure: 'STATUTORY' })}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                settings.defaultStructure === 'STATUTORY'
                  ? 'bg-emerald-950/30 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                  : 'bg-slate-800/30 border-white/5 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-blue-400">Statutory Compliance (PF / ESI)</span>
                <input
                  type="radio"
                  name="structure"
                  checked={settings.defaultStructure === 'STATUTORY'}
                  onChange={() => setSettings({ ...settings, defaultStructure: 'STATUTORY' })}
                  className="accent-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Corporate payroll structure with automatic HRA allowance and statutory deductions (PF, ESI, TDS) applied to eligible employees.
              </p>
            </div>
          </div>

          {/* Statutory Sub-options */}
          <div className="pt-3 border-t border-white/5 space-y-3">
            <p className="text-xs font-bold text-slate-300">Statutory Deductions & Allowances Configuration:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* HRA */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5">
                <label className="flex items-center justify-between cursor-pointer mb-2">
                  <span className="font-bold text-slate-300">House Rent Allowance (HRA)</span>
                  <input
                    type="checkbox"
                    checked={settings.enableHra}
                    onChange={e => setSettings({ ...settings, enableHra: e.target.checked })}
                    className="accent-emerald-500 rounded"
                  />
                </label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    value={settings.hraPercentage}
                    onChange={e => setSettings({ ...settings, hraPercentage: Number(e.target.value) })}
                    disabled={!settings.enableHra}
                    className="w-16 h-8 px-2 rounded-lg bg-slate-800 border border-white/10 text-white text-xs disabled:opacity-40"
                  />
                  <span className="text-slate-400">% of Basic</span>
                </div>
              </div>

              {/* PF */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5">
                <label className="flex items-center justify-between cursor-pointer mb-2">
                  <span className="font-bold text-slate-300">Provident Fund (PF)</span>
                  <input
                    type="checkbox"
                    checked={settings.enablePf}
                    onChange={e => setSettings({ ...settings, enablePf: e.target.checked })}
                    className="accent-emerald-500 rounded"
                  />
                </label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    value={settings.pfPercentage}
                    onChange={e => setSettings({ ...settings, pfPercentage: Number(e.target.value) })}
                    disabled={!settings.enablePf}
                    className="w-16 h-8 px-2 rounded-lg bg-slate-800 border border-white/10 text-white text-xs disabled:opacity-40"
                  />
                  <span className="text-slate-400">% of Basic</span>
                </div>
              </div>

              {/* ESI */}
              <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5">
                <label className="flex items-center justify-between cursor-pointer mb-2">
                  <span className="font-bold text-slate-300">State Insurance (ESI)</span>
                  <input
                    type="checkbox"
                    checked={settings.enableEsi}
                    onChange={e => setSettings({ ...settings, enableEsi: e.target.checked })}
                    className="accent-emerald-500 rounded"
                  />
                </label>
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="number"
                    step="0.05"
                    value={settings.esiPercentage}
                    onChange={e => setSettings({ ...settings, esiPercentage: Number(e.target.value) })}
                    disabled={!settings.enableEsi}
                    className="w-16 h-8 px-2 rounded-lg bg-slate-800 border border-white/10 text-white text-xs disabled:opacity-40"
                  />
                  <span className="text-slate-400">% of Gross</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Salary Slip Customization */}
        <div className="rounded-2xl bg-slate-900/60 border border-white/5 p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <FileText size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                4. Salary Slip Customization & Signatory
              </h2>
              <p className="text-[11px] text-slate-400">
                Printed details that appear on staff salary slips.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Authorized Signatory Title / Name
              </label>
              <input
                type="text"
                value={settings.authorizedSignatory}
                onChange={e => setSettings({ ...settings, authorizedSignatory: e.target.value })}
                placeholder="e.g. Hotel General Manager"
                className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Appears on the official printed salary slip at the bottom.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={e => setSettings({ ...settings, currency: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-slate-800 border border-white/10 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
              >
                <option value="INR">Indian Rupee (₹ INR)</option>
                <option value="USD">US Dollar ($ USD)</option>
                <option value="EUR">Euro (€ EUR)</option>
                <option value="GBP">British Pound (£ GBP)</option>
                <option value="AED">UAE Dirham (AED)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1">
                Currency symbol used on payroll tables and salary slips.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Save Action */}
        <div className="flex items-center justify-between pt-2">
          <Link
            href="/hotel/payroll"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Cancel and return to payroll
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20"
          >
            {saving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
            {saving ? 'Saving Changes…' : 'Save Payroll Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
