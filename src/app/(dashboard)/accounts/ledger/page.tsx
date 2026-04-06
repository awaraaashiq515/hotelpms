'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookMarked, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

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
      <div>
        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Ledger Statement</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
          Account-level transactions with running balance
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account *</label>
            <select value={accountId} onChange={e => setAccountId(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-violet-400">
              <option value="">— Select Account —</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-violet-400" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-violet-400" />
          </div>
          <button onClick={fetchData} disabled={!accountId || loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50 transition-all shadow-lg shadow-pos-primary/10">
            {loading ? <span className="animate-spin"><RefreshCw size={14} /></span> : <BookMarked size={14} />}
            Load Ledger
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Account Info + Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-pos-primary/20 shadow-sm p-5 col-span-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account</p>
              <p className="text-base font-black text-gray-900 mt-1">{data.account.name}</p>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5">{data.account.accountType}</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 font-black uppercase">Opening Balance</p>
                <p className="text-sm font-black text-gray-700 mt-0.5">
                  ₹{data.openingBalance.toFixed(2)} {data.openingBalanceType}
                </p>
              </div>
            </div>
            {[
              { label: 'Total Debit', value: `₹${data.totals.totalDebit.toFixed(2)}`, color: 'text-green-700', icon: <TrendingUp size={16} className="text-green-500" /> },
              { label: 'Total Credit', value: `₹${data.totals.totalCredit.toFixed(2)}`, color: 'text-red-600', icon: <TrendingDown size={16} className="text-red-500" /> },
              {
                label: 'Closing Balance',
                value: `₹${data.totals.closingBalance.toFixed(2)} ${data.totals.closingBalanceType}`,
                color: data.totals.closingBalanceType === 'DR' ? 'text-gray-900' : 'text-red-600',
                icon: null
              },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">{icon}<p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p></div>
                <p className={`text-xl font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-50">
              <h3 className="font-black text-sm text-gray-900">Transaction History</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{entries.length} records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100">
                    {['Date', 'Voucher #', 'Type', 'Particulars', 'Debit (DR)', 'Credit (CR)', 'Balance'].map(h => (
                      <th key={h} className={`px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap ${['Debit (DR)', 'Credit (CR)', 'Balance'].includes(h) ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr><td colSpan={7} className="py-16 text-center text-xs font-bold text-gray-300 uppercase">No entries in this period</td></tr>
                  ) : entries.map(row => (
                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50/30">
                      <td className="px-4 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-xs font-mono font-bold text-pos-primary">{row.voucherNo}</td>
                      <td className="px-4 py-3 text-[10px] font-black uppercase">
                        <span className={typeColor(row.voucherType)}>{row.voucherType}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{row.particulars || '—'}</td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-green-700">
                        {row.debit > 0 ? `₹${row.debit.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-red-600">
                        {row.credit > 0 ? `₹${row.credit.toFixed(2)}` : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right text-xs font-black ${row.balance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                        ₹{Math.abs(row.balance).toFixed(2)} {row.balanceType}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200 font-black">
                    <td colSpan={4} className="px-4 py-4 text-xs text-gray-600 uppercase">Grand Total</td>
                    <td className="px-4 py-4 text-right text-sm text-green-700">₹{data.totals.totalDebit.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-sm text-red-600">₹{data.totals.totalCredit.toFixed(2)}</td>
                    <td className={`px-4 py-4 text-right text-sm ${data.totals.closingBalanceType === 'DR' ? 'text-gray-900' : 'text-red-600'}`}>
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
