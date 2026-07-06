'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CalendarDays, Loader2, FileJson } from 'lucide-react';

const MONTHS = [
  { val: '01', label: 'January — Jan' },
  { val: '02', label: 'February — Feb' },
  { val: '03', label: 'March — Mar' },
  { val: '04', label: 'April — Apr' },
  { val: '05', label: 'May — May' },
  { val: '06', label: 'June — Jun' },
  { val: '07', label: 'July — Jul' },
  { val: '08', label: 'August — Aug' },
  { val: '09', label: 'September — Sep' },
  { val: '10', label: 'October — Oct' },
  { val: '11', label: 'November — Nov' },
  { val: '12', label: 'December — Dec' },
];

interface PeriodSelectCardProps {
  month: string;
  setMonth: (m: string) => void;
  year: string;
  setYear: (y: string) => void;
  periodType: 'monthly' | 'daily';
  setPeriodType: (t: 'monthly' | 'daily') => void;
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  generating: boolean;
  handleGenerate: () => Promise<void>;
  years: string[];
}

export function PeriodSelectCard({
  month,
  setMonth,
  year,
  setYear,
  periodType,
  setPeriodType,
  selectedDate,
  setSelectedDate,
  generating,
  handleGenerate,
  years,
}: PeriodSelectCardProps) {
  return (
    <Card className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-pos-primary/10 p-3 rounded-xl">
          <CalendarDays className="text-pos-primary" size={22} />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Filing Period</h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Sales data for the selected period will be compiled for filing</p>
        </div>
      </div>

      {/* Period Type Selector */}
      <div className="flex gap-4 mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">
        <button
          type="button"
          onClick={() => setPeriodType('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            periodType === 'monthly'
              ? 'bg-pos-primary text-white shadow-md'
              : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'
          }`}
        >
          Monthly Period
        </button>
        <button
          type="button"
          onClick={() => setPeriodType('daily')}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            periodType === 'daily'
              ? 'bg-pos-primary text-white shadow-md'
              : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'
          }`}
        >
          Daily / Single Day
        </button>
      </div>

      {periodType === 'monthly' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Month</label>
            <select
              id="gst-month-select"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100 dark:placeholder:text-slate-600 shadow-sm"
            >
              {MONTHS.map(m => (
                <option key={m.val} value={m.val}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Year</label>
            <select
              id="gst-year-select"
              value={year}
              onChange={e => setYear(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100 dark:placeholder:text-slate-600 shadow-sm"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Return Type</label>
            <div className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-sm font-bold text-gray-600 dark:text-slate-300 uppercase tracking-tight shadow-sm">
              GSTR-1 (Outward Supplies)
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100 shadow-sm"
            />
          </div>
          <div className="hidden md:block"></div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Return Type</label>
            <div className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 text-sm font-bold text-gray-600 dark:text-slate-300 uppercase tracking-tight shadow-sm">
              GSTR-1 (Outward Supplies)
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Button
          id="generate-gst-btn"
          onClick={handleGenerate}
          disabled={generating}
          className="bg-pos-primary hover:bg-red-700 text-white font-black tracking-widest px-8 py-4 rounded-xl shadow-lg shadow-red-100 flex items-center gap-2"
        >
          {generating
            ? <><Loader2 size={18} className="animate-spin" /> Generating JSON...</>
            : <><FileJson size={18} /> Generate GSTR-1 JSON</>
          }
        </Button>
      </div>
    </Card>
  );
}
