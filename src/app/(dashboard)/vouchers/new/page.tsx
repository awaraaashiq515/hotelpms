'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Minus, Send, AlertTriangle, CheckCircle, ChevronLeft } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

interface Account {
  id: string;
  name: string;
  accountType: string;
}

interface EntryLine {
  id: string;
  accountId: string;
  debitAmount: string;
  creditAmount: string;
  description: string;
}

type VoucherType = 'PAYMENT' | 'RECEIPT' | 'JOURNAL' | 'CONTRA';

const VOUCHER_TYPES: { type: VoucherType; label: string; desc: string; color: string }[] = [
  { type: 'PAYMENT', label: 'Payment', desc: 'Money going out (DR Expense, CR Cash/Bank)', color: 'bg-red-50 border-red-200 text-red-700' },
  { type: 'RECEIPT', label: 'Receipt', desc: 'Money coming in (DR Cash/Bank, CR Income)', color: 'bg-green-50 border-green-200 text-green-700' },
  { type: 'JOURNAL', label: 'Journal', desc: 'Adjusting entries (non-cash)', color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { type: 'CONTRA', label: 'Contra', desc: 'Cash to Bank or Bank to Cash transfer', color: 'bg-amber-50 border-amber-200 text-amber-700' },
];

const inputCls = 'w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:border-violet-400 focus:bg-white dark:focus:bg-slate-700 outline-none transition-all';
const labelCls = 'block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5';

const makeEntry = (): EntryLine => ({
  id: Math.random().toString(36).slice(2),
  accountId: '',
  debitAmount: '',
  creditAmount: '',
  description: '',
});

export default function NewVoucherPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [voucherType, setVoucherType] = useState<VoucherType>('PAYMENT');
  const [voucherDate, setVoucherDate] = useState(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [narration, setNarration] = useState('');
  const [entries, setEntries] = useState<EntryLine[]>([makeEntry(), makeEntry()]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get<Account[]>('/api/accounts')
      .then(d => setAccounts(Array.isArray(d) ? d : []))
      .catch(() => setAccounts([]));
  }, []);

  const totalDebit = entries.reduce((s, e) => s + (parseFloat(e.debitAmount) || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (parseFloat(e.creditAmount) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const updateEntry = (id: string, field: keyof EntryLine, value: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const addRow = () => setEntries(prev => [...prev, makeEntry()]);
  const removeRow = (id: string) => {
    if (entries.length <= 2) return;
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleSubmit = async () => {
    if (!isBalanced) { setError('Total Debit must equal Total Credit.'); return; }
    const validEntries = entries.filter(e => e.accountId && (parseFloat(e.debitAmount) || 0) + (parseFloat(e.creditAmount) || 0) > 0);
    if (validEntries.length < 2) { setError('At least 2 account entries required.'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await apiClient.post<{ voucherNo: string }>('/api/vouchers', {
        voucherType,
        voucherDate,
        referenceNo: referenceNo || undefined,
        narration: narration || undefined,
        entries: validEntries.map(e => ({
          accountId: e.accountId,
          debitAmount: parseFloat(e.debitAmount) || 0,
          creditAmount: parseFloat(e.creditAmount) || 0,
          description: e.description || undefined,
        })),
      });
      setSuccess(`Voucher posted successfully!`);
      setEntries([makeEntry(), makeEntry()]);
      setNarration('');
      setReferenceNo('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e: any) {
      setError(e.message || 'Failed to post voucher');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/vouchers')} className="p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">New Voucher</h1>
          <p className="text-xs font-bold text-gray-400 tracking-widest mt-0.5">
            Double-entry · Debit must = Credit
          </p>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm font-black text-green-800">{success}</p>
          <button onClick={() => router.push('/vouchers')} className="ml-auto text-xs font-black text-green-700 underline">View All →</button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-red-600 text-xs font-black">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Voucher Type Selector */}
      <div className="grid grid-cols-4 gap-3">
        {VOUCHER_TYPES.map(({ type, label, desc, color }) => (
          <button
            key={type}
            onClick={() => setVoucherType(type)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              voucherType === type ? color + ' shadow-md dark:shadow-none bg-opacity-100' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 text-slate-900 dark:text-slate-100'
            }`}
          >
            <p className="text-[11px] font-bold uppercase tracking-widest">{label}</p>
            <p className="text-[10px] font-bold mt-1 opacity-70">{desc}</p>
          </button>
        ))}
      </div>

      {/* Meta Fields */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-6">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full mb-5" />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Voucher Date *</label>
            <input type="date" value={voucherDate} onChange={e => setVoucherDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Reference No.</label>
            <input type="text" placeholder="Invoice / Cheque / Ref #" value={referenceNo} onChange={e => setReferenceNo(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Narration</label>
            <input type="text" placeholder="Brief description of this voucher" value={narration} onChange={e => setNarration(e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-50 dark:bg-violet-900/30 rounded-xl"><BookOpen size={18} className="text-violet-500" /></div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 dark:text-white">Debit / Credit Entries</h3>
              <p className="text-[10px] text-gray-400 font-bold tracking-widest">Every rupee out = every rupee in</p>
            </div>
          </div>
          <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-xl text-xs font-bold tracking-widest transition-colors">
            <Plus size={14} /> Add Row
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                <th className="px-4 py-3 text-left text-[9px] font-bold text-gray-400 uppercase tracking-widest w-[35%]">Account</th>
                <th className="px-4 py-3 text-left text-[9px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                <th className="px-4 py-3 text-right text-[9px] font-bold text-green-600 uppercase tracking-widest w-28">Debit (DR)</th>
                <th className="px-4 py-3 text-right text-[9px] font-bold text-red-500 uppercase tracking-widest w-28">Credit (CR)</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.id} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/30 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-2.5">
                    <select value={entry.accountId} onChange={e => updateEntry(entry.id, 'accountId', e.target.value)} className={inputCls}>
                      <option value="">— Select Account —</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input type="text" placeholder="Particulars..." value={entry.description} onChange={e => updateEntry(entry.id, 'description', e.target.value)} className={inputCls} />
                  </td>
                  <td className="px-4 py-2.5">
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={entry.debitAmount}
                      onChange={e => updateEntry(entry.id, 'debitAmount', e.target.value)}
                      className={`${inputCls} text-right border-green-100 focus:border-green-400`}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={entry.creditAmount}
                      onChange={e => updateEntry(entry.id, 'creditAmount', e.target.value)}
                      className={`${inputCls} text-right border-red-100 focus:border-red-400`}
                    />
                  </td>
                  <td className="px-2">
                    <button onClick={() => removeRow(entry.id)} disabled={entries.length <= 2}
                      className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg disabled:cursor-not-allowed transition-colors">
                      <Minus size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 dark:bg-slate-900/50 border-t-2 border-gray-100 dark:border-slate-700">
                <td colSpan={2} className="px-5 py-4 text-xs font-bold text-gray-600 dark:text-slate-400 uppercase">Total</td>
                <td className="px-4 py-4 text-right font-bold text-xs text-green-700">
                  ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-4 text-right font-bold text-xs text-red-600">
                  ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Balance Indicator */}
        <div className={`mx-5 mb-5 mt-3 px-5 py-3 rounded-xl border ${isBalanced ? 'bg-green-50 dark:bg-emerald-900/20 border-green-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isBalanced ? 'text-green-600' : 'text-amber-600'}`}>
              {isBalanced ? '✓ Voucher is Balanced' : '⚠ Difference:'}
            </span>
            {!isBalanced && (
              <span className="text-xs font-bold text-amber-700">
                ₹{Math.abs(totalDebit - totalCredit).toFixed(2)}
              </span>
            )}
          </div>
          {!isBalanced && <p className="text-[10px] text-amber-500 mt-0.5">Total Debit must equal Total Credit to post this voucher.</p>}
        </div>

        {/* Submit */}
        <div className="px-5 pb-5">
          <button
            onClick={handleSubmit}
            disabled={saving || !isBalanced}
            className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-violet-100 dark:shadow-none flex items-center justify-center gap-2 transition-all"
          >
            {saving ? <span className="animate-pulse">Posting...</span> : <><Send size={16} /> Post Voucher ({voucherType})</>}
          </button>
        </div>
      </div>
    </div>
  );
}
