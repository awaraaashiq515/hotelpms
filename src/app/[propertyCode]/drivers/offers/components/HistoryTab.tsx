'use client';

import React from 'react';
import { IndianRupee, Users, Crown, Gift, BarChart3, ClipboardList } from 'lucide-react';
import { HistoryEntry, HistorySummary, DriverProgress, OfferRule, getLevelStyle } from '../types';

interface HistoryTabProps {
  historyData: HistoryEntry[];
  historySummary: HistorySummary | null;
  historyLoading: boolean;
  historyPeriod: 'day' | 'month' | 'year' | 'custom';
  historyDateFrom: string;
  historyDateTo: string;
  historyDriverFilter: string;
  historyOfferFilter: string;
  driversData: DriverProgress[];
  offersList: OfferRule[];
  onPeriodChange: (p: 'day' | 'month' | 'year' | 'custom') => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  onDriverFilterChange: (v: string) => void;
  onOfferFilterChange: (v: string) => void;
  onApplyCustomRange: () => void;
}

export default function HistoryTab({
  historyData,
  historySummary,
  historyLoading,
  historyPeriod,
  historyDateFrom,
  historyDateTo,
  historyDriverFilter,
  historyOfferFilter,
  driversData,
  offersList,
  onPeriodChange,
  onDateFromChange,
  onDateToChange,
  onDriverFilterChange,
  onOfferFilterChange,
  onApplyCustomRange,
}: HistoryTabProps) {
  return (
    <div className="space-y-5">

      {/* ── Period + Filters Row ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {(['day', 'month', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                historyPeriod === p
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              {p === 'day' ? 'Today' : p === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
          <button
            onClick={() => onPeriodChange('custom')}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              historyPeriod === 'custom'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom date range */}
        {historyPeriod === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={historyDateFrom}
              onChange={e => onDateFromChange(e.target.value)}
              className="h-9 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-pos-primary/20"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={historyDateTo}
              onChange={e => onDateToChange(e.target.value)}
              className="h-9 px-3 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-pos-primary/20"
            />
            <button
              onClick={onApplyCustomRange}
              className="h-9 px-4 text-sm font-semibold bg-pos-primary text-white rounded-xl hover:opacity-90"
            >
              Apply
            </button>
          </div>
        )}

        {/* Driver & Level filters */}
        <div className="flex items-center gap-2 ml-auto">
          <select
            value={historyDriverFilter}
            onChange={e => onDriverFilterChange(e.target.value)}
            className="h-9 pl-3 pr-8 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-pos-primary/20"
          >
            <option value="">All Drivers</option>
            {driversData.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select
            value={historyOfferFilter}
            onChange={e => onOfferFilterChange(e.target.value)}
            className="h-9 pl-3 pr-8 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-pos-primary/20"
          >
            <option value="">All Levels</option>
            {offersList.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
          </select>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      {historySummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <IndianRupee size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Total Rewards Paid</span>
            </div>
            <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">₹{historySummary.totalRewardsPaid.toLocaleString()}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{historySummary.totalEntries} reward events</p>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/40 border border-violet-100 dark:border-violet-900/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wider">Drivers Rewarded</span>
            </div>
            <p className="text-2xl font-bold text-violet-800 dark:text-violet-200">{historySummary.uniqueDriversRewarded}</p>
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-1">unique drivers</p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <Crown size={14} className="text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Top Performer</span>
            </div>
            {historySummary.topPerformer ? (
              <>
                <p className="text-lg font-bold text-amber-800 dark:text-amber-200 truncate">{historySummary.topPerformer.name}</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">₹{historySummary.topPerformer.total.toLocaleString()} earned</p>
              </>
            ) : (
              <p className="text-sm text-amber-600 dark:text-amber-400">No data yet</p>
            )}
          </div>
        </div>
      )}

      {/* ── History Table ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ClipboardList size={15} className="text-slate-400" />
            Reward History
          </h3>
          <span className="text-xs text-slate-400">{historyData.length} records</span>
        </div>

        {historyLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-3">Loading history...</p>
          </div>
        ) : historyData.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No history found</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No rewards have been earned in this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-5 py-3">Driver</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Reward Level</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Customers</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Reward Earned</th>
                  <th className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {historyData.map((entry, idx) => {
                  const style = getLevelStyle(entry.offer.priority);
                  const date = new Date(entry.completedAt);
                  return (
                    <tr key={entry.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 uppercase">
                            {entry.driver.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">{entry.driver.name}</p>
                            <p className="text-xs text-slate-400">{entry.driver.phone || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border ${style.bg} ${style.text} ${style.border}`}>
                          {style.icon} {entry.offer.title}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{entry.ridesAtCompletion}</span>
                        <span className="text-xs text-slate-400 ml-1">customers</span>
                      </td>
                      <td className="px-4 py-3.5">
                        {entry.offer.rewardType === 'CASH' ? (
                          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{entry.rewardEarned}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                            <Gift size={12} /> {entry.rewardItemEarned || '—'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-slate-400">
                            {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
