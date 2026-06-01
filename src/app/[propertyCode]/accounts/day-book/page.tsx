'use client';

import React, { useState, useCallback } from 'react';
import { CalendarDays, RefreshCw, BookOpen } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';

interface VoucherEntry {
  id: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  account: { id: string; name: string };
}

interface Voucher {
  id: string;
  voucherNo: string;
  voucherType: string;
  voucherDate: string;
  narration?: string;
  referenceNo?: string;
  totalDebit: number;
  totalCredit: number;
  status: string;
  entries: VoucherEntry[];
}

interface DayBookData {
  date: string;
  vouchers: Voucher[];
  totals: { totalDebit: number; totalCredit: number; count: number };
}

const typeColor = (t: string) => {
  switch (t) {
    case 'PAYMENT': return 'bg-red-50 text-red-700';
    case 'RECEIPT': return 'bg-green-50 text-green-700';
    case 'JOURNAL': return 'bg-blue-50 text-blue-700';
    case 'CONTRA': return 'bg-amber-50 text-amber-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function DayBookPage() {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [data, setData] = useState<DayBookData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<DayBookData>('/api/reports/day-book', { params: { date } });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  const vouchers = data?.vouchers ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Day Book"
        subtitle="All transactions for a selected date"
        showBack
        backUrl="/accounts"
      />

      {/* Date Picker */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Select Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-violet-400" />
          </div>
          <div className="mt-5">
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-violet-100 dark:shadow-none">
              {loading ? <span className="animate-spin"><RefreshCw size={14} /></span> : <CalendarDays size={14} />}
              Load Day Book
            </button>
          </div>
        </div>
      </div>

      {data && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Vouchers Posted', value: data.totals.count, color: 'text-gray-900 dark:text-white' },
              { label: 'Total Debit', value: `₹${data.totals.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: 'text-green-700 dark:text-green-400' },
              { label: 'Total Credit', value: `₹${data.totals.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: 'text-red-600 dark:text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
                <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
                <p className={`text-lg font-bold mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Vouchers */}
          {vouchers.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-16 text-center">
              <CalendarDays size={40} className="mx-auto text-gray-200 dark:text-slate-700 mb-4" />
              <p className="text-xs font-black text-gray-400 dark:text-slate-600 uppercase">No transactions on this date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vouchers.map(v => (
                <div key={v.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        v.voucherType === 'PAYMENT' ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' :
                        v.voucherType === 'RECEIPT' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                        v.voucherType === 'JOURNAL' ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' :
                        v.voucherType === 'CONTRA' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' :
                        'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                      }`}>
                        {v.voucherType}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">{v.voucherNo}</span>
                        {v.narration && <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-0.5">{v.narration}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div><p className="text-[10px] text-green-500 font-bold uppercase">Total DR</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">₹{v.totalDebit.toFixed(2)}</p></div>
                      <div><p className="text-[10px] text-red-400 font-bold uppercase">Total CR</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">₹{v.totalCredit.toFixed(2)}</p></div>
                    </div>
                  </div>
                  {/* Entries */}
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/60 dark:bg-slate-800/50">
                        <th className="px-6 py-2 text-left text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Account</th>
                        <th className="px-4 py-2 text-left text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Particulars</th>
                        <th className="px-4 py-2 text-right text-[9px] font-bold text-green-600 uppercase tracking-widest">Debit</th>
                        <th className="px-4 py-2 text-right text-[9px] font-bold text-red-500 uppercase tracking-widest">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {v.entries.map(e => (
                        <tr key={e.id} className="border-t border-gray-50 dark:border-slate-800 hover:bg-gray-50/20 dark:hover:bg-slate-800/20">
                          <td className="px-6 py-2.5 text-xs font-bold text-gray-800 dark:text-slate-200">{e.account.name}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-500 dark:text-slate-400">{e.description || '—'}</td>
                          <td className="px-4 py-2.5 text-right text-xs font-bold text-green-700 dark:text-green-400">
                            {e.debitAmount > 0 ? `₹${e.debitAmount.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-bold text-red-600 dark:text-red-400">
                            {e.creditAmount > 0 ? `₹${e.creditAmount.toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
