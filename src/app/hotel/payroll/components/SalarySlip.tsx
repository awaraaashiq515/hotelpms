'use client';
import React, { useRef } from 'react';
import { Printer, Download } from 'lucide-react';

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
  propertyName: string;
}

interface SalarySlipProps { data: SalarySlipData; onClose?: () => void }

export function SalarySlip({ data, onClose }: SalarySlipProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const grossEarnings   = data.basicSalary + data.hra + data.conveyance + data.otherAllowances;
  const totalDeductions = data.pf + data.esi + data.tds + data.otherDeductions;
  const netPay          = grossEarnings - totalDeductions;

  const earnings = [
    { label: 'Basic Salary',      amount: data.basicSalary },
    { label: 'HRA',               amount: data.hra },
    { label: 'Conveyance',        amount: data.conveyance },
    { label: 'Other Allowances',  amount: data.otherAllowances },
  ];
  const deductions = [
    { label: 'PF (12%)',          amount: data.pf },
    { label: 'ESI (0.75%)',       amount: data.esi },
    { label: 'TDS',               amount: data.tds },
    { label: 'Other Deductions',  amount: data.otherDeductions },
  ];

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden max-w-2xl">
      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <p className="text-[11px] font-black text-white uppercase tracking-wider">Salary Slip</p>
        <div className="flex gap-2">
          <button onClick={() => window.print()}
            className="flex items-center gap-1 h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase">
            <Printer size={11} /> Print
          </button>
          {onClose && (
            <button onClick={onClose}
              className="h-8 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase">
              Close
            </button>
          )}
        </div>
      </div>

      <div ref={printRef} className="p-6">
        {/* Header */}
        <div className="text-center mb-5 pb-4 border-b border-white/10">
          <h2 className="text-base font-black text-white">{data.propertyName}</h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Pay Slip for {data.month} {data.year}</p>
        </div>

        {/* Employee Info */}
        <div className="grid grid-cols-2 gap-3 mb-5 p-4 rounded-xl bg-slate-800/40">
          {[
            ['Employee Name', data.staffName],
            ['Employee ID',   data.employeeId],
            ['Designation',   data.designation],
            ['Department',    data.department],
            ['Working Days',  String(data.workingDays)],
            ['Paid Days',     String(data.paidDays)],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-[8px] text-slate-500 uppercase tracking-wider">{label}</p>
              <p className="text-[11px] font-black text-white mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* Earnings & Deductions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mb-2">Earnings</p>
            {earnings.map(e => (
              <div key={e.label} className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[10px] text-slate-400">{e.label}</span>
                <span className="text-[10px] font-black text-white">₹{e.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-1">
              <span className="text-[10px] font-black text-emerald-300">Gross</span>
              <span className="text-[10px] font-black text-emerald-300">₹{grossEarnings.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black text-rose-400 uppercase tracking-wider mb-2">Deductions</p>
            {deductions.map(d => (
              <div key={d.label} className="flex justify-between py-1.5 border-b border-white/5">
                <span className="text-[10px] text-slate-400">{d.label}</span>
                <span className="text-[10px] font-black text-white">₹{d.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-1">
              <span className="text-[10px] font-black text-rose-300">Total Deductions</span>
              <span className="text-[10px] font-black text-rose-300">₹{totalDeductions.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Net Pay */}
        <div className="mt-4 p-4 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex justify-between items-center">
          <span className="text-sm font-black text-indigo-200">NET PAY</span>
          <span className="text-xl font-black text-white">₹{netPay.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}
