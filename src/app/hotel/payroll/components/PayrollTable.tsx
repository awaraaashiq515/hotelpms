import React from 'react';
import { IndianRupee, Eye, CheckCircle2, Calendar, AlertCircle } from 'lucide-react';

export interface PayrollEntry {
  id: string;
  staffId?: string;
  name: string;
  designation: string;
  dept: string;
  basicSalary: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  paidDays: number;
  workingDays: number;
  presentDays?: number;
  leaveDays?: number;
  absentDays?: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
}

interface PayrollTableProps {
  entries: PayrollEntry[];
  viewMode?: 'simple' | 'detailed';
  onView?: (e: PayrollEntry) => void;
  onProcess?: (id: string) => void;
  onAdjustDays?: (entry: PayrollEntry) => void;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'text-amber-300 bg-amber-500/10 border-amber-500/20',
  PROCESSED: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  PAID:      'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
};

export function PayrollTable({ entries, viewMode = 'simple', onView, onProcess, onAdjustDays }: PayrollTableProps) {
  const totalNet = entries.reduce((s, e) => s + e.netSalary, 0);
  const totalBasic = entries.reduce((s, e) => s + e.basicSalary, 0);

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {viewMode === 'detailed' ? (
                ['Employee', 'Department', 'Basic Salary', 'Attendance Breakdown', 'Gross Earnings', 'Deductions', 'Net Payable', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))
              ) : (
                ['Employee', 'Department', 'Monthly Salary', 'Present Days', 'Paid Leaves', 'Unpaid Absences', 'Paid Days', 'Net Payable', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => {
              const present = e.presentDays !== undefined ? e.presentDays : e.paidDays;
              const leave = e.leaveDays || 0;
              const absent = e.absentDays !== undefined ? e.absentDays : Math.max(0, e.workingDays - e.paidDays);

              return (
                <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-[11px] font-black text-white">{e.name}</p>
                    <p className="text-[9px] text-slate-500">{e.designation}</p>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-400">{e.dept || 'General'}</td>

                  {viewMode === 'detailed' ? (
                    <>
                      <td className="px-4 py-3 text-[10px] text-slate-300">₹{e.basicSalary.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[9px]">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold" title={`Present: ${present} days`}>
                            {present}P
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold" title={`Paid Leaves: ${leave} days`}>
                            {leave}L
                          </span>
                          {absent > 0 ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold" title={`Unpaid Absences: ${absent} days`}>
                              {absent}A
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold" title="0 Absences">0A</span>
                          )}
                          <span className="text-slate-500 ml-1 font-semibold">({e.paidDays}/{e.workingDays}d)</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate-300">₹{e.grossSalary.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-[10px] text-rose-300">
                        {e.deductions > 0 ? `-₹${e.deductions.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="px-4 py-3 text-[11px] font-black text-white">₹{e.netSalary.toLocaleString('en-IN')}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-[11px] font-semibold text-slate-200">
                        ₹{e.basicSalary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {present} Days
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {leave > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {leave} Day{leave > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {absent > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            {absent} Day{absent > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 font-medium">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onAdjustDays?.(e)}
                          className="text-[10px] font-bold text-slate-300 hover:text-white underline decoration-dotted decoration-slate-600"
                          title="Click to adjust attendance days"
                        >
                          {e.paidDays} / {e.workingDays}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-black text-emerald-400">
                        ₹{e.netSalary.toLocaleString('en-IN')}
                      </td>
                    </>
                  )}

                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[e.status] || STATUS_STYLE.PENDING}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onView?.(e)}
                        title="View Salary Slip"
                        className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      >
                        <Eye size={13} />
                      </button>
                      {e.status !== 'PAID' && (
                        <button
                          onClick={() => onProcess?.(e.id)}
                          className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 bg-slate-800/30">
              <td colSpan={2} className="px-4 py-3 text-[10px] font-black text-slate-400">
                Total ({entries.length} Employees)
              </td>
              {viewMode === 'detailed' ? (
                <>
                  <td className="px-4 py-3 text-[10px] font-bold text-slate-300">₹{totalBasic.toLocaleString('en-IN')}</td>
                  <td colSpan={3} />
                  <td className="px-4 py-3 text-sm font-black text-white">₹{totalNet.toLocaleString('en-IN')}</td>
                  <td colSpan={2} />
                </>
              ) : (
                <>
                  <td className="px-4 py-3 text-[10px] font-bold text-slate-300">₹{totalBasic.toLocaleString('en-IN')}</td>
                  <td colSpan={4} />
                  <td className="px-4 py-3 text-sm font-black text-emerald-400">₹{totalNet.toLocaleString('en-IN')}</td>
                  <td colSpan={2} />
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
