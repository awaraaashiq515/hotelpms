'use client';

import React, { useState, useCallback } from 'react';
import { Banknote, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';

interface CashEntry {
  id: string;
  date: string;
  voucherNo: string;
  voucherType: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

interface CashBookData {
  account: { name: string; openingBalance: number; openingBalanceType: string };
  entries: CashEntry[];
  totals: { totalDebit: number; totalCredit: number; closingBalance: number };
}

const today = new Date().toISOString().split('T')[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const typeColor = (t: string) => {
  switch (t) {
    case 'PAYMENT': return 'text-red-600';
    case 'RECEIPT': return 'text-green-600';
    case 'JOURNAL': return 'text-blue-600';
    case 'CONTRA': return 'text-amber-600';
    default: return 'text-gray-500';
  }
};

export default function CashBookPage() {
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<CashBookData | null>(null);
  const [loading, setLoading] = useState(false);
  const [noAccount, setNoAccount] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setNoAccount(false);
    try {
      const res = await apiClient.get<CashBookData>('/api/reports/cash-book', {
        params: { startDate, endDate },
      });
      if (!res.account) { setNoAccount(true); setData(null); }
      else setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const entries = data?.entries ?? [];
  const { totalDebit, totalCredit, closingBalance } = data?.totals ?? { totalDebit: 0, totalCredit: 0, closingBalance: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Book"
        subtitle="All cash receipts and payments with running balance"
        showBack
        backUrl="/accounts"
      />

      {/* Date + Fetch */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest mb-1">From Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-pos-primary" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest mb-1">To Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-pos-primary" />
          </div>
          <div className="mt-5">
            <button onClick={fetchData} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl text-xs font-bold tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-pos-primary/10">
              {loading ? <span className="animate-spin"><RefreshCw size={14} /></span> : <RefreshCw size={14} />}
              Load Cash Book
            </button>
          </div>
        </div>
      </div>

      {noAccount && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-700 text-sm font-bold">
          ⚠ No "Cash Account" found. Please set up an account named "Cash Account" in your accounts master.
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Account', value: data.account.name, color: 'text-gray-900 dark:text-white', icon: <Banknote size={18} className="text-emerald-500" /> },
              { label: 'Total Receipts (DR)', value: `₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: 'text-green-700 dark:text-green-400', icon: <TrendingUp size={18} className="text-green-500" /> },
              { label: 'Total Payments (CR)', value: `₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: 'text-red-600 dark:text-red-400', icon: <TrendingDown size={18} className="text-red-500" /> },
              { label: 'Closing Balance', value: `₹${Math.abs(closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: closingBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400', icon: null },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">{icon}<p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest">{label}</p></div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50 dark:border-slate-800">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Cash Account Transactions</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold tracking-widest mt-0.5">{entries.length} entries</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                    {['Date', 'Voucher #', 'Type', 'Particulars', 'Debit (DR)', 'Credit (CR)', 'Balance'].map(h => (
                      <th key={h} className={`px-4 py-3 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap ${h.includes('Debit') || h.includes('Credit') || h.includes('Balance') ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr><td colSpan={7} className="py-16 text-center text-xs font-bold text-gray-300 dark:text-slate-700 uppercase">No transactions in this date range</td></tr>
                  ) : entries.map((row) => (
                    <tr key={row.id} className="border-b border-gray-50 dark:border-slate-800 hover:bg-gray-50/30 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-bold text-pos-primary">{row.voucherNo}</td>
                      <td className="px-4 py-3 text-[10px] font-bold uppercase">
                        <span className={typeColor(row.voucherType)}>{row.voucherType}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-400 max-w-xs truncate">{row.particulars || '—'}</td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-green-700 dark:text-green-400">
                        {row.debit > 0 ? `₹${row.debit.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-red-600 dark:text-red-400">
                        {row.credit > 0 ? `₹${row.credit.toFixed(2)}` : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs font-bold ${row.balance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                        ₹{Math.abs(row.balance).toFixed(2)} {row.balance < 0 ? 'CR' : 'DR'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-slate-900/50 border-t-2 border-gray-200 dark:border-slate-800 font-bold">
                    <td colSpan={4} className="px-4 py-4 text-xs text-gray-600 dark:text-slate-400 uppercase">Total</td>
                    <td className="px-4 py-4 text-right text-xs text-green-700 dark:text-green-400">₹{totalDebit.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-xs text-red-600 dark:text-red-400">₹{totalCredit.toFixed(2)}</td>
                    <td className={`px-4 py-4 text-right text-xs ${closingBalance >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                      ₹{Math.abs(closingBalance).toFixed(2)} {closingBalance < 0 ? 'CR' : 'DR'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
