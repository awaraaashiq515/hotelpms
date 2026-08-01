'use client';
import React, { useState } from 'react';
import { IndianRupee, Calendar, RefreshCw, Play, CheckCircle2 } from 'lucide-react';
import { PayrollTable, type PayrollEntry } from './components/PayrollTable';
import { SalarySlip, type SalarySlipData } from './components/SalarySlip';

const MONTH = 'July';
const YEAR  = 2026;

const MOCK_PAYROLL: PayrollEntry[] = [
  { id:'1', name:'Anita Sharma',  designation:'Head Housekeeper', dept:'Housekeeping', basicSalary:22000, grossSalary:28000, deductions:3360,  netSalary:24640, paidDays:26, workingDays:26, status:'PENDING' },
  { id:'2', name:'Rahul Gupta',   designation:'Receptionist',     dept:'Front Office',  basicSalary:18000, grossSalary:22000, deductions:2640,  netSalary:19360, paidDays:23, workingDays:26, status:'PENDING' },
  { id:'3', name:'Preethi Kumar', designation:'Manager',          dept:'Front Office',  basicSalary:45000, grossSalary:58000, deductions:6960,  netSalary:51040, paidDays:24, workingDays:26, status:'PROCESSED' },
  { id:'4', name:'Arjun Singh',   designation:'Head Chef',        dept:'Kitchen',       basicSalary:35000, grossSalary:44000, deductions:5280,  netSalary:38720, paidDays:26, workingDays:26, status:'PAID' },
  { id:'5', name:'Deepak Verma',  designation:'Security Guard',   dept:'Security',      basicSalary:15000, grossSalary:18000, deductions:2160,  netSalary:15840, paidDays:26, workingDays:26, status:'PENDING' },
];

function buildSlipData(e: PayrollEntry): SalarySlipData {
  return {
    staffName: e.name, designation: e.designation, department: e.dept,
    employeeId: `EMP-${e.id.padStart(3,'0')}`, month: MONTH, year: YEAR,
    basicSalary: e.basicSalary, hra: Math.round(e.basicSalary*0.2),
    conveyance: 1600, otherAllowances: e.grossSalary - e.basicSalary - Math.round(e.basicSalary*0.2) - 1600,
    pf: Math.round(e.basicSalary*0.12), esi: Math.round(e.grossSalary*0.0075),
    tds: Math.round(e.deductions*0.3), otherDeductions: 0,
    workingDays: e.workingDays, paidDays: e.paidDays, propertyName: 'GuestFlow AI Hotel',
  };
}

export default function PayrollPage() {
  const [entries, setEntries] = useState(MOCK_PAYROLL);
  const [slipFor, setSlipFor] = useState<PayrollEntry|null>(null);
  const [processing, setProcessing] = useState(false);

  async function processAll() {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    setEntries(prev => prev.map(e => e.status === 'PENDING' ? { ...e, status: 'PROCESSED' } : e));
    setProcessing(false);
  }

  const totalNet = entries.reduce((s,e) => s + e.netSalary, 0);
  const pending  = entries.filter(e => e.status === 'PENDING').length;

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      {slipFor ? (
        <SalarySlip data={buildSlipData(slipFor)} onClose={() => setSlipFor(null)} />
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee size={14} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Finance · Payroll</span>
              </div>
              <h1 className="text-2xl font-black text-white">Payroll — {MONTH} {YEAR}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {entries.length} employees · ₹{totalNet.toLocaleString('en-IN')} net payable
              </p>
            </div>
            {pending > 0 && (
              <button onClick={processAll} disabled={processing}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider disabled:opacity-60">
                {processing ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
                {processing ? 'Processing…' : `Process ${pending} Salaries`}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'Employees',  value:entries.length,                                    color:'text-blue-300 border-blue-500/20 bg-blue-900/20' },
              { label:'Pending',    value:pending,                                            color:'text-amber-300 border-amber-500/20 bg-amber-900/20' },
              { label:'Processed',  value:entries.filter(e=>e.status==='PROCESSED').length,  color:'text-sky-300 border-sky-500/20 bg-sky-900/20' },
              { label:'Total Net',  value:`₹${(totalNet/1000).toFixed(0)}K`,                color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <PayrollTable
            entries={entries}
            onView={e => setSlipFor(e)}
            onProcess={id => setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'PAID' } : e))}
          />
        </>
      )}
    </div>
  );
}
