'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, Plus, Calendar, Tag, CreditCard, User, FileText, AlertTriangle, CheckCircle, ChevronLeft } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  isActive: boolean;
}

const inputCls = 'w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:border-violet-400 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600';
const labelCls = 'block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5';

const PAYMENT_MODES = ['CASH', 'CARD', 'UPI', 'BANK', 'ONLINE'];

export default function NewExpensePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paidTo, setPaidTo] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [description, setDescription] = useState('');

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiClient.get<Category[]>('/api/expense-categories');
      setCategories(Array.isArray(data) ? data.filter(c => c.isActive) : []);
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
    if (!paymentMode) { setError('Select a payment mode'); return; }
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/api/expenses', {
        expenseDate,
        categoryId: categoryId || undefined,
        amount: parseFloat(amount),
        paymentMode,
        paidTo: paidTo || undefined,
        createdBy: createdBy || undefined,
        description: description || undefined,
      });
      setSuccess(true);
      // Reset
      setAmount('');
      setPaidTo('');
      setDescription('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (e: any) {
      setError(e.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/expenses')}
          className="p-2.5 text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">New Expense</h1>
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 tracking-widest mt-0.5">
            Record an expense · Auto-posts accounting voucher
          </p>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-6 py-4">
          <CheckCircle size={20} className="text-green-600" />
          <div>
            <p className="text-sm font-black text-green-800">Expense Saved Successfully!</p>
            <p className="text-xs text-green-600 font-bold mt-0.5">Accounting voucher auto-posted · Ledger updated</p>
          </div>
          <button onClick={() => router.push('/expenses')} className="ml-auto text-xs font-black text-green-700 underline">View All →</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-red-600 text-xs font-black">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-t-2xl" />

        <div className="p-8 space-y-6">
          {/* Row 1: Date + Amount */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>
                <Calendar size={10} className="inline mr-1.5" />
                Expense Date *
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={e => setExpenseDate(e.target.value)}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Amount (₹) *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className={inputCls}
                required
              />
            </div>
          </div>

          {/* Row 2: Category + Payment Mode */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>
                <Tag size={10} className="inline mr-1.5" />
                Expense Category
              </label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputCls}>
                <option value="">— Select Category —</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {categories.length === 0 && (
                <p className="text-[10px] text-violet-500 dark:text-violet-400 font-bold mt-1.5">
                  <a href="/expenses/categories" className="underline">Add categories</a> to classify expenses
                </p>
              )}
            </div>
            <div>
              <label className={labelCls}>
                <CreditCard size={10} className="inline mr-1.5" />
                Payment Mode *
              </label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className={inputCls} required>
                {PAYMENT_MODES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Paid To + Created By */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>
                <User size={10} className="inline mr-1.5" />
                Paid To
              </label>
              <input
                type="text"
                placeholder="Vendor / Person name"
                value={paidTo}
                onChange={e => setPaidTo(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <User size={10} className="inline mr-1.5" />
                Created By
              </label>
              <input
                type="text"
                placeholder="Your name / staff name"
                value={createdBy}
                onChange={e => setCreatedBy(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>
              <FileText size={10} className="inline mr-1.5" />
              Description / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Brief description of the expense..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Payment Mode Info Box */}
          <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl px-5 py-3">
            <p className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-widest">Auto Accounting Rule</p>
            <p className="text-xs text-violet-700 dark:text-violet-300 font-bold mt-1">
              {['CARD', 'UPI', 'BANK', 'ONLINE'].includes(paymentMode)
                ? '📊 DR: Expense Account  →  CR: Bank Account'
                : '📊 DR: Expense Account  →  CR: Cash Account'}
            </p>
            <p className="text-[10px] text-violet-500 dark:text-violet-400/60 mt-0.5">A balanced Payment Voucher will be auto-posted to the ledger</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-violet-100 dark:shadow-none disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {saving ? (
              <span className="animate-pulse">Saving & Posting Voucher...</span>
            ) : (
              <><Receipt size={18} /> Save Expense</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
