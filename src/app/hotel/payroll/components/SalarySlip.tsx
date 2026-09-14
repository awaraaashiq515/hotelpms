'use client';
import React, { useState, useRef } from 'react';
import { Printer, X, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface SalarySlipData {
  staffName: string;
  designation: string;
  department: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  otherAllowances: number;
  pf: number;
  esi: number;
  tds: number;
  otherDeductions: number;
  workingDays: number;
  paidDays: number;
  presentDays?: number;
  leaveDays?: number;
  absentDays?: number;
  propertyName: string;
  structure?: 'FLAT' | 'STATUTORY';
}

interface SalarySlipProps {
  data: SalarySlipData;
  onClose?: () => void;
}

export function SalarySlip({ data, onClose }: SalarySlipProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [structure, setStructure] = useState<'FLAT' | 'STATUTORY'>(data.structure || 'FLAT');

  const isStatutory = structure === 'STATUTORY';

  const workingDays = data.workingDays || 26;
  const presentDays = data.presentDays !== undefined ? data.presentDays : data.paidDays;
  const leaveDays   = data.leaveDays || 0;
  const absentDays  = data.absentDays !== undefined ? data.absentDays : Math.max(0, workingDays - data.paidDays);
  const paidDays    = data.paidDays;

  // Daily rate for absence deduction
  const dailyRate = workingDays > 0 ? Math.round(data.basicSalary / workingDays) : 0;
  const absenceDeduction = absentDays > 0 ? Math.round(absentDays * dailyRate) : 0;

  const grossEarnings = isStatutory
    ? data.basicSalary + data.hra + data.conveyance + data.otherAllowances
    : data.basicSalary;

  const statutoryDeductions = isStatutory
    ? data.pf + data.esi + data.tds + data.otherDeductions
    : data.otherDeductions;

  const totalDeductions = statutoryDeductions + absenceDeduction;
  const netPay = Math.max(0, grossEarnings - totalDeductions);

  const earnings = isStatutory
    ? [
        { label: 'Basic Salary', amount: data.basicSalary },
        { label: 'House Rent Allowance (HRA)', amount: data.hra },
        { label: 'Conveyance Allowance', amount: data.conveyance },
        { label: 'Special / Other Allowances', amount: data.otherAllowances },
      ]
    : [{ label: 'Monthly Base Salary', amount: data.basicSalary }];

  const deductions = [
    ...(absentDays > 0
      ? [
          {
            label: `Unpaid Absence Deduction (${absentDays} day${absentDays > 1 ? 's' : ''} @ ₹${dailyRate}/day)`,
            amount: absenceDeduction,
          },
        ]
      : []),
    ...(isStatutory
      ? [
          { label: 'Provident Fund (PF - 12%)', amount: data.pf },
          { label: 'Employee State Insurance (ESI - 0.75%)', amount: data.esi },
          { label: 'Tax Deducted at Source (TDS)', amount: data.tds },
          { label: 'Other Deductions', amount: data.otherDeductions },
        ]
      : absentDays === 0
      ? [{ label: 'Standard Deductions', amount: 0 }]
      : []),
  ];

  return (
    <div className="rounded-2xl bg-slate-900/95 border border-white/10 overflow-hidden max-w-2xl mx-auto shadow-2xl backdrop-blur-md">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-slate-900/60">
        <div>
          <p className="text-xs font-black text-white uppercase tracking-wider">Salary Payslip</p>
          <p className="text-[10px] text-slate-400">
            {structure === 'FLAT' ? 'Flat Fixed Salary Mode' : 'Statutory Compliance Breakdown'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Structure Selector */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-white/5">
            <button
              onClick={() => setStructure('FLAT')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                structure === 'FLAT'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Flat Salary
            </button>
            <button
              onClick={() => setStructure('STATUTORY')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                structure === 'STATUTORY'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              PF / ESI
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold uppercase transition-colors"
          >
            <Printer size={12} /> Print
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Slip Content */}
      <div ref={printRef} className="p-6">
        {/* Hotel / Restaurant Header */}
        <div className="text-center mb-5 pb-4 border-b border-white/10">
          <h2 className="text-lg font-black text-white tracking-wide uppercase">{data.propertyName}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Salary Payslip for <span className="text-slate-200 font-semibold">{data.month} {data.year}</span>
          </p>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 rounded-xl bg-slate-800/40 border border-white/5 text-xs">
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Employee Name</p>
            <p className="text-xs font-black text-white mt-0.5">{data.staffName}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Employee ID</p>
            <p className="text-xs font-black text-white mt-0.5">{data.employeeId}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Designation</p>
            <p className="text-xs font-black text-white mt-0.5">{data.designation}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Department</p>
            <p className="text-xs font-black text-white mt-0.5">{data.department || 'General'}</p>
          </div>
        </div>

        {/* Detailed Attendance Breakdown Banner */}
        <div className="mb-5 p-4 rounded-xl bg-slate-800/60 border border-white/10">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={12} className="text-blue-400" /> Monthly Attendance Summary
            </span>
            <span className="text-[10px] text-slate-400 font-bold">
              Standard Days: {workingDays} Days
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Days Present */}
            <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/20 p-2.5 text-center">
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Days Present</p>
              <p className="text-base font-black text-emerald-300 mt-0.5">{presentDays} <span className="text-[10px] font-semibold">Days</span></p>
            </div>

            {/* Paid Leaves */}
            <div className="rounded-lg bg-blue-950/40 border border-blue-500/20 p-2.5 text-center">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Paid Leaves</p>
              <p className="text-base font-black text-blue-300 mt-0.5">{leaveDays} <span className="text-[10px] font-semibold">Day{leaveDays !== 1 ? 's' : ''}</span></p>
            </div>

            {/* Unpaid Absences */}
            <div className={`rounded-lg p-2.5 text-center border ${
              absentDays > 0
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-slate-800/40 border-white/5 text-slate-400'
            }`}>
              <p className={`text-[9px] font-bold uppercase tracking-wider ${absentDays > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                Unpaid Absences
              </p>
              <p className="text-base font-black mt-0.5">{absentDays} <span className="text-[10px] font-semibold">Day{absentDays !== 1 ? 's' : ''}</span></p>
            </div>

            {/* Total Paid Days */}
            <div className="rounded-lg bg-indigo-950/40 border border-indigo-500/20 p-2.5 text-center">
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Total Paid Days</p>
              <p className="text-base font-black text-indigo-300 mt-0.5">{paidDays} <span className="text-[10px] font-semibold">/ {workingDays}</span></p>
            </div>
          </div>
        </div>

        {/* Earnings & Deductions Tables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Earnings */}
          <div className="rounded-xl bg-slate-800/20 border border-white/5 p-4">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-2.5">Earnings</p>
            <div className="space-y-2">
              {earnings.map(e => (
                <div key={e.label} className="flex justify-between items-center py-1 border-b border-white/5 text-xs">
                  <span className="text-slate-400">{e.label}</span>
                  <span className="font-bold text-white">₹{e.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-emerald-500/20 text-xs">
              <span className="font-bold text-slate-300">Gross Earnings</span>
              <span className="font-black text-emerald-400 text-sm">₹{grossEarnings.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="rounded-xl bg-slate-800/20 border border-white/5 p-4">
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-wider mb-2.5">Deductions</p>
            <div className="space-y-2">
              {deductions.map(d => (
                <div key={d.label} className="flex justify-between items-center py-1 border-b border-white/5 text-xs">
                  <span className="text-slate-400 truncate max-w-[200px]" title={d.label}>{d.label}</span>
                  <span className={`font-bold ${d.amount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {d.amount > 0 ? `-₹${d.amount.toLocaleString('en-IN')}` : '₹0'}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-rose-500/20 text-xs">
              <span className="font-bold text-slate-300">Total Deductions</span>
              <span className={`font-black text-sm ${totalDeductions > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {totalDeductions > 0 ? `-₹${totalDeductions.toLocaleString('en-IN')}` : '₹0'}
              </span>
            </div>
          </div>
        </div>

        {/* Net Pay Callout */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">Net Payable Amount</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {absentDays > 0
                ? `${absentDays} day(s) unpaid absence deducted pro-rata (@ ₹${dailyRate}/day)`
                : 'Full monthly salary payable with zero unpaid absences'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-white">₹{netPay.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
