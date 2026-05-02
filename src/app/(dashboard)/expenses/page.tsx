'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt, Plus, Filter, RefreshCw, Search, Trash2, ExternalLink,
  Banknote, CreditCard, Smartphone, Globe, TrendingDown, Tags
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';

interface Expense {
  id: string;
  expenseNo: string;
  expenseDate: string;
  amount: number;
  paymentMode: string;
  paidTo?: string;
  createdBy?: string;
  description?: string;
  status: string;
  voucherId?: string;
  category?: { name: string };
}

interface ExpensePage {
  expenses: Expense[];
  total: number;
  page: number;
  pages: number;
}

interface Category { id: string; name: string; }

const PAYMENT_MODES = ['', 'CASH', 'CARD', 'UPI', 'BANK', 'ONLINE'];

const paymentIcon = (mode: string) => {
  switch (mode.toUpperCase()) {
    case 'CASH': return <Banknote size={12} className="text-emerald-500" />;
    case 'CARD': return <CreditCard size={12} className="text-blue-500" />;
    case 'UPI': return <Smartphone size={12} className="text-purple-500" />;
    default: return <Globe size={12} className="text-gray-400" />;
  }
};

export default function ExpensesPage() {
  const [data, setData] = useState<ExpensePage | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const fetchCategories = useCallback(async () => {
    try {
      const cats = await apiClient.get<Category[]>('/api/expense-categories');
      setCategories(Array.isArray(cats) ? cats : []);
    } catch { setCategories([]); }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (filterCategory) params.categoryId = filterCategory;
      if (filterMode) params.paymentMode = filterMode;
      if (filterStatus) params.status = filterStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await apiClient.get<ExpensePage>('/api/expenses', { params });
      setData(data);
    } catch { setData(null); } finally { setLoading(false); }
  }, [page, filterCategory, filterMode, filterStatus, startDate, endDate]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleVoid = async (id: string, expenseNo: string) => {
    if (!confirm(`Void expense ${expenseNo}? A reversal voucher will be posted.`)) return;
    try {
      await apiClient.delete(`/api/expenses/${id}`);
      fetchExpenses();
    } catch (e: any) { alert(e.message || 'Failed to void expense'); }
  };

  const expenses = data?.expenses ?? [];
  const totalAmount = expenses.reduce((s, e) => s + (e.status !== 'VOID' ? e.amount : 0), 0);
  const activeCount = expenses.filter(e => e.status !== 'VOID').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Expenses"
        subtitle="All recorded expenses · Auto-linked to accounting"
        showBack
        backUrl="/operations"
        actions={
          <div className="flex items-center gap-3">
            <Link
              href="/expenses/new"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest shadow-lg shadow-violet-100 dark:shadow-none transition-all"
            >
              <Plus size={16} /> Add Expense
            </Link>
            <Link
              href="/expenses/categories"
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-violet-300 hover:text-violet-600 px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest transition-all shadow-sm"
            >
              <Tags size={16} /> Categories
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total This View', value: `₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: 'text-violet-700 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-950' },
          { label: 'Records', value: data?.total ?? 0, color: 'section-heading', bg: 'bg-white dark:bg-slate-900' },
          { label: 'Active', value: activeCount, color: 'text-green-600', bg: 'bg-white dark:bg-slate-900' },
          { label: 'Pages', value: data?.pages ?? 1, color: 'text-gray-500 dark:text-slate-400', bg: 'bg-white dark:bg-slate-900' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5`}>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-gray-400 dark:text-slate-500" />
          <span className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest">Filters</span>
        </div>
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
          <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-violet-400"
            placeholder="Start Date"
          />
          <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-violet-400"
            placeholder="End Date"
          />
          <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-violet-400"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterMode} onChange={e => { setFilterMode(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-violet-400"
          >
            {PAYMENT_MODES.map(m => <option key={m} value={m}>{m || 'All Modes'}</option>)}
          </select>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold dark:text-white outline-none focus:border-violet-400"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="VOID">Void</option>
          </select>
          <button onClick={fetchExpenses} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 dark:border-slate-700 flex items-center gap-3">
          <div className="p-2 bg-violet-50 dark:bg-violet-950 rounded-xl"><TrendingDown size={18} className="text-violet-500" /></div>
          <div>
            <h3 className="font-bold text-sm section-heading text-gray-900 dark:text-white">Expense Records</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold tracking-widest">{data?.total ?? 0} total · Page {data?.page ?? 1} of {data?.pages ?? 1}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                {['Date', 'Exp #', 'Category', 'Paid To', 'Mode', 'Amount', 'Created By', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[9px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-[0.12em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-20 text-center text-xs font-bold text-gray-300 dark:text-slate-500 uppercase">Loading...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={9} className="py-20 text-center">
                  <Receipt size={40} className="mx-auto text-gray-200 dark:text-slate-600 mb-4" />
                  <p className="text-xs font-black text-gray-400 dark:text-slate-500 uppercase">No expenses found</p>
                  <p className="text-[11px] text-gray-300 dark:text-slate-600 mt-1">Adjust filters or add a new expense</p>
                </td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} className={`border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors group ${exp.status === 'VOID' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3.5 text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    {new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3.5 text-xs font-mono font-bold text-violet-600 dark:text-violet-400">{exp.expenseNo}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-600 dark:text-slate-400 font-bold">{exp.category?.name || '—'}</td>
                  <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-slate-300">{exp.paidTo || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-slate-300">
                      {paymentIcon(exp.paymentMode)} {exp.paymentMode}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm font-bold text-gray-900 dark:text-white">
                    ₹{exp.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-500 dark:text-slate-400">{exp.createdBy || '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      exp.status === 'VOID' ? 'bg-red-50 dark:bg-red-950 text-red-500' : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400'
                    }`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {exp.voucherId && (
                        <Link href={`/vouchers`} className="p-1.5 text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950 rounded-lg" title="View Voucher">
                          <ExternalLink size={12} />
                        </Link>
                      )}
                      {exp.status !== 'VOID' && (
                        <button
                          onClick={() => handleVoid(exp.id, exp.expenseNo)}
                          className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                          title="Void Expense"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(data?.pages ?? 0) > 1 && (
          <div className="p-4 border-t border-gray-50 dark:border-slate-700 flex items-center justify-between">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 text-xs font-bold uppercase disabled:opacity-30 hover:text-violet-600 dark:text-slate-300 transition-colors">
              ← Previous
            </button>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">Page {page} of {data?.pages}</span>
            <button disabled={page >= (data?.pages ?? 1)} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 text-xs font-bold uppercase disabled:opacity-30 hover:text-violet-600 dark:text-slate-300 transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="flex gap-3">
        <Link href="/vouchers" className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:border-violet-300 hover:text-violet-600 rounded-xl text-xs font-bold tracking-widest transition-all">
          View Vouchers →
        </Link>
      </div>
    </div>
  );
}
