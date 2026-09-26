'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen, RefreshCw, ArrowLeft, IndianRupee, TrendingUp,
  TrendingDown, Plus, Filter, Calendar, FileText
} from 'lucide-react';

export default function HotelAdminAccountsPage() {
  const params = useParams();
  const propertyCode = (params?.propertyCode as string) || '';

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'EXPENSES'>('LEDGER');

  const expenses = [
    { id: 'EXP-1', title: 'Linen & Laundry Supplies', category: 'Housekeeping', amount: 3500, date: 'Today', status: 'PAID' },
    { id: 'EXP-2', title: 'Vegetables & Dairy for Kitchen', category: 'Kitchen / F&B', amount: 8200, date: 'Today', status: 'PAID' },
    { id: 'EXP-3', title: 'Plumbing Repair (Room 205)', category: 'Maintenance', amount: 1200, date: 'Yesterday', status: 'PAID' },
    { id: 'EXP-4', title: 'Internet & WiFi Subscription', category: 'Utilities', amount: 2499, date: '25 Sep', status: 'PAID' },
  ];

  const totalExpenseToday = 11700;
  const totalIncomeToday = 52700;
  const netCashFlow = totalIncomeToday - totalExpenseToday;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${propertyCode}/hoteladmin`}
              className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BookOpen className="text-amber-500" size={26} />
            Accounts & Financial Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cash register, daily expenses, hotel petty cash, and financial vouchers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'LEDGER'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Accounts Overview
          </button>
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'EXPENSES'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Expense Vouchers
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Today's Income</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingUp size={20} className="text-emerald-500" />
            <p className="text-2xl font-black text-emerald-500">₹{totalIncomeToday.toLocaleString('en-IN')}</p>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">From rooms & dining</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Today's Expenses</p>
          <div className="flex items-center gap-2 mt-1">
            <TrendingDown size={20} className="text-rose-500" />
            <p className="text-2xl font-black text-rose-500">₹{totalExpenseToday.toLocaleString('en-IN')}</p>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Supplies, repairs & groceries</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">Net Daily Cash Flow</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ₹{netCashFlow.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-emerald-500 font-bold mt-1">+ positive cash surplus</p>
        </div>
      </div>

      {/* Expense List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 dark:text-white">Recent Hotel Expense Vouchers</h2>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {expenses.map((exp) => (
            <div key={exp.id} className="p-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white text-xs block">{exp.title}</span>
                <span className="text-[10px] text-slate-400">
                  {exp.category} · {exp.date} · {exp.id}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-black text-rose-500 text-sm">
                  -₹{exp.amount.toLocaleString('en-IN')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[9px] font-black uppercase">
                  {exp.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
