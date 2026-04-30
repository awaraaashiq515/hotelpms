'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookMarked, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { PageHeader } from '@/components/shared/page-header';

interface Account {
  id: string;
  name: string;
  accountType: string;
  accountGroup?: { name: string; nature: string };
}

interface LedgerEntry {
  id: string;
  date: string;
  voucherNo: string;
  voucherType: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
  balanceType: 'DR' | 'CR';
}

interface LedgerData {
  account: Account;
  openingBalance: number;
  openingBalanceType: string;
  entries: LedgerEntry[];
  totals: {
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    closingBalanceType: 'DR' | 'CR';
  };
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

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState('');
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get<Account[]>('/api/accounts')
      .then(d => setAccounts(Array.isArray(d) ? d : []))
      .catch(() => setAccounts([]));
  }, []);

  const fetchData = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    try {
      const res = await apiClient.get<LedgerData>('/api/reports/ledger', {
        params: { accountId, startDate, endDate },
      });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, startDate, endDate]);

  const entries = data?.entries ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ledger Statement"
        subtitle="Account-level transactions with running balance"
        showBack
        backUrl="/accounts"
      />

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest mb-1">Account *</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-violet-400">
              <option value="">— Select Account —</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest mb-1">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest mb-1">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-violet-400" />
          </div>
          <button onClick={fetchData} disabled={!accountId || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl text-xs font-bold tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-pos-primary/10 dark:shadow-none">
            {loading ? <span className="animate-spin"><RefreshCw size={14} /></span> : <BookMarked size={14} />}
            Load Ledger
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Account Info + Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-pos-primary/20 dark:border-pos-primary/40 shadow-sm p-5 col-span-1 transition-colors">
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest">Account</p>
              <p className="text-base font-bold text-gray-900 dark:text-white mt-1">{data.account.name}</p>
              <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 mt-0.5">{data.account.accountType}</p>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold tracking-widest">Opening Balance</p>
                <p className="text-sm font-bold text-gray-700 dark:text-slate-300 mt-0.5">
                  ₹{data.openingBalance.toFixed(2)} {data.openingBalanceType}
                </p>
              </div>
            </div>
            {[
              { label: 'Total Debit', value: `₹${data.totals.totalDebit.toFixed(2)}`, color: 'text-green-700 dark:text-green-400', icon: <TrendingUp size={16} className="text-green-500" /> },
              { label: 'Total Credit', value: `₹${data.totals.totalCredit.toFixed(2)}`, color: 'text-red-600 dark:text-red-400', icon: <TrendingDown size={16} className="text-red-500" /> },
              {
                label: 'Closing Balance',
                value: `₹${data.totals.closingBalance.toFixed(2)} ${data.totals.closingBalanceType}`,
                color: data.totals.closingBalanceType === 'DR' ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400',
                icon: null
              },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 transition-colors">
                <div className="flex items-center gap-2 mb-2">{icon}<p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 tracking-widest">{label}</p></div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-5 border-b border-gray-50 dark:border-slate-800">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Transaction History</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold tracking-widest mt-0.5">{entries.length} records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                    {['Date', 'Voucher #', 'Type', 'Particulars', 'Debit (DR)', 'Credit (CR)', 'Balance'].map(h => (
                      <th key={h} className={`px-4 py-3 text-[9px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap ${['Debit (DR)', 'Credit (CR)', 'Balance'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr><td colSpan={7} className="py-16 text-center text-xs font-bold text-gray-300 dark:text-slate-700 uppercase">No entries in this period</td></tr>
                  ) : entries.map(row => (
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
                        ₹{Math.abs(row.balance).toFixed(2)} {row.balanceType}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                 <tr className="bg-gray-50 dark:bg-slate-900/50 border-t-2 border-gray-200 dark:border-slate-800 font-bold">
                    <td colSpan={4} className="px-4 py-4 text-xs text-gray-600 dark:text-slate-400 uppercase">Grand Total</td>
                    <td className="px-4 py-4 text-right text-xs text-green-700 dark:text-green-400">₹{data.totals.totalDebit.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-xs text-red-600 dark:text-red-400">₹{data.totals.totalCredit.toFixed(2)}</td>
                    <td className={`px-4 py-4 text-right text-xs ${data.totals.closingBalanceType === 'DR' ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'}`}>
                      ₹{data.totals.closingBalance.toFixed(2)} {data.totals.closingBalanceType}
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
