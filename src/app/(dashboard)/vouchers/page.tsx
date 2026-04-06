'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

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

const TYPES = ['', 'PAYMENT', 'RECEIPT', 'JOURNAL', 'CONTRA'];

const typeColor = (t: string) => {
  switch (t) {
    case 'PAYMENT': return 'bg-red-50 text-red-700';
    case 'RECEIPT': return 'bg-green-50 text-green-700';
    case 'JOURNAL': return 'bg-blue-50 text-blue-700';
    case 'CONTRA': return 'bg-amber-50 text-amber-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;

      // vouchers API uses propertyId from session
      const url = '/api/vouchers' + (Object.keys(params).length ? '?' + new URLSearchParams(params) : '');
      // We need propertyId — get it from session via a simpler call
      const data = await apiClient.get<Voucher[]>(url, {
        params: typeFilter ? { type: typeFilter } : {},
      });
      setVouchers(Array.isArray(data) ? data : []);
    } catch {
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchVouchers(); }, [fetchVouchers]);

  const toggleExpand = (id: string) => setExpanded(prev => prev === id ? null : id);

  const totalDebit = vouchers.reduce((s, v) => s + v.totalDebit, 0);
  const totalCredit = vouchers.reduce((s, v) => s + v.totalCredit, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Vouchers</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            All accounting vouchers · Double-entry ledger
          </p>
        </div>
        <Link
          href="/vouchers/new"
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-100 transition-all"
        >
          <Plus size={16} /> New Voucher
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Vouchers', value: vouchers.length, text: 'text-gray-900' },
          { label: 'Total Debit', value: `₹${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, text: 'text-green-700' },
          { label: 'Total Credit', value: `₹${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, text: 'text-red-600' },
          { label: 'Balanced', value: Math.abs(totalDebit - totalCredit) < 0.01 ? '✓ Yes' : '✗ No', text: Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-600' : 'text-red-500' },
        ].map(({ label, value, text }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
            <p className={`text-xl font-black mt-1 ${text}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {TYPES.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
              typeFilter === t ? 'bg-violet-600 text-white border-violet-600 shadow' : 'bg-white border-gray-200 text-gray-500 hover:border-violet-300'
            }`}
          >
            {t || 'All Types'}
          </button>
        ))}
        <button onClick={fetchVouchers} className="ml-auto p-2 text-gray-400 hover:text-violet-500 hover:bg-violet-50 rounded-xl transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Voucher List */}
      <div className="space-y-2">
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center text-xs font-bold text-gray-300 uppercase">Loading...</div>
        ) : vouchers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center">
            <BookOpen size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-xs font-black text-gray-400 uppercase">No vouchers posted yet</p>
            <p className="text-[11px] text-gray-300 mt-1">Save an expense or create a new voucher</p>
          </div>
        ) : vouchers.map(v => (
          <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Voucher Header Row */}
            <div
              className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/40 transition-colors"
              onClick={() => toggleExpand(v.id)}
            >
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${typeColor(v.voucherType)}`}>
                  {v.voucherType}
                </span>
                <div>
                  <span className="text-sm font-black text-gray-900 font-mono">{v.voucherNo}</span>
                  {v.narration && <p className="text-xs text-gray-400 font-bold mt-0.5">{v.narration}</p>}
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] text-gray-400 font-black uppercase">Date</p>
                  <p className="text-xs font-bold text-gray-700">
                    {new Date(v.voucherDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-green-500 font-black uppercase">DR</p>
                  <p className="text-sm font-black text-gray-900">₹{v.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-red-400 font-black uppercase">CR</p>
                  <p className="text-sm font-black text-gray-900">₹{v.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-black uppercase">{v.status}</span>
                {expanded === v.id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </div>
            </div>

            {/* Expanded Entries */}
            {expanded === v.id && (
              <div className="border-t border-gray-50">
                {v.referenceNo && (
                  <div className="px-5 py-2 bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase">
                    Ref: {v.referenceNo}
                  </div>
                )}
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80">
                      <th className="px-6 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Account</th>
                      <th className="px-4 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Particulars</th>
                      <th className="px-4 py-2 text-right text-[9px] font-black text-green-600 uppercase tracking-widest">Debit</th>
                      <th className="px-4 py-2 text-right text-[9px] font-black text-red-500 uppercase tracking-widest">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {v.entries.map(e => (
                      <tr key={e.id} className="border-t border-gray-50">
                        <td className="px-6 py-2.5 text-xs font-bold text-gray-800">{e.account.name}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">{e.description || '—'}</td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-green-700">
                          {e.debitAmount > 0 ? `₹${e.debitAmount.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs font-bold text-red-600">
                          {e.creditAmount > 0 ? `₹${e.creditAmount.toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
