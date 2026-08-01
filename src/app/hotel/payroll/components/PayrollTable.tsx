import React from 'react';
import { IndianRupee, Eye, Download } from 'lucide-react';

export interface PayrollEntry {
  id: string;
  name: string;
  designation: string;
  dept: string;
  basicSalary: number;
  grossSalary: number;
  deductions: number;
  netSalary: number;
  paidDays: number;
  workingDays: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
}

interface PayrollTableProps {
  entries: PayrollEntry[];
  onView?: (e: PayrollEntry) => void;
  onProcess?: (id: string) => void;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING:   'text-amber-300 bg-amber-500/10 border-amber-500/20',
  PROCESSED: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  PAID:      'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
};

export function PayrollTable({ entries, onView, onProcess }: PayrollTableProps) {
  const totalNet = entries.reduce((s, e) => s + e.netSalary, 0);

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['Employee','Department','Basic','Gross','Deductions','Net Pay','Paid Days','Status','Action'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-slate-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-[11px] font-black text-white">{e.name}</p>
                  <p className="text-[9px] text-slate-500">{e.designation}</p>
                </td>
                <td className="px-4 py-3 text-[10px] text-slate-400">{e.dept}</td>
                <td className="px-4 py-3 text-[10px] text-slate-300">₹{e.basicSalary.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-[10px] text-slate-300">₹{e.grossSalary.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-[10px] text-rose-300">-₹{e.deductions.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-[11px] font-black text-white">₹{e.netSalary.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-[10px] text-slate-400">{e.paidDays}/{e.workingDays}</td>
                <td className="px-4 py-3">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onView?.(e)} className="text-[9px] text-slate-400 hover:text-white">
                      <Eye size={12} />
                    </button>
                    {e.status === 'PENDING' && (
                      <button onClick={() => onProcess?.(e.id)}
                        className="text-[9px] font-black text-indigo-400 hover:text-indigo-300">Pay</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 bg-slate-800/20">
              <td colSpan={5} className="px-4 py-3 text-[10px] font-black text-slate-400">
                Total ({entries.length} employees)
              </td>
              <td className="px-4 py-3 text-sm font-black text-white">₹{totalNet.toLocaleString('en-IN')}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
