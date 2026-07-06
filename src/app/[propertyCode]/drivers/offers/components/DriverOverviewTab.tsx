'use client';

import React, { useState } from 'react';
import { Search, Users, Trophy, CheckCircle2, Gift } from 'lucide-react';
import { DriverProgress, OfferRule, getLevelStyle } from '../types';

interface DriverOverviewTabProps {
  drivers: DriverProgress[];
  offersList: OfferRule[];
  loading: boolean;
  search: string;
  propertyId: string | null;
  onSearchChange: (value: string) => void;
  onRewardGiven: () => void;
}

export default function DriverOverviewTab({
  drivers,
  offersList,
  loading,
  search,
  propertyId,
  onSearchChange,
  onRewardGiven,
}: DriverOverviewTabProps) {
  const [givingRewardFor, setGivingRewardFor] = useState<string | null>(null);

  const handleMarkAsGiven = async (driverId: string, count: number) => {
    if (!confirm(`Mark ${count > 1 ? `all ${count} pending rewards` : 'this reward'} as given to this driver?`)) return;
    setGivingRewardFor(driverId);
    try {
      await fetch('/api/drivers/offers/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId, action: 'MARK_GIVEN', propertyId }),
      });
      onRewardGiven();
    } catch (e) {
      console.error(e);
    } finally {
      setGivingRewardFor(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search driver by name or phone..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-16 text-center">
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No drivers found</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try a different search or add drivers first.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drivers.map(driver => {
            const hasNoLevel = driver.activeOffer === 'No Level Assigned';
            const isDone     = driver.progressPercent >= 100;
            const isNear     = driver.progressPercent >= 75 && driver.progressPercent < 100;
            const activeOfferObj = offersList.find(o => o.title === driver.activeOffer);
            const style = activeOfferObj ? getLevelStyle(activeOfferObj.priority) : getLevelStyle(0);
            const isGiving = givingRewardFor === driver.id;
            const showRewardBanner = driver.rewardPending && !hasNoLevel;

            return (
              <div
                key={driver.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 hover:shadow-md transition-all ${
                  showRewardBanner
                    ? 'border-2 border-amber-400 dark:border-amber-600 shadow-amber-50 dark:shadow-amber-950/30 shadow-md'
                    : 'border border-slate-200 dark:border-slate-700'
                }`}
              >
                {/* Reward Pending Banner — shown even after auto-level-up */}
                {showRewardBanner && (
                  <div className="flex items-center justify-between mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                      </span>
                      <Gift size={13} className="text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        {driver.pendingRewardsCount > 1
                          ? `${driver.pendingRewardsCount} Rewards Not Yet Given`
                          : 'Reward Not Yet Given'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleMarkAsGiven(driver.id, driver.pendingRewardsCount)}
                      disabled={isGiving}
                      className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 size={12} />
                      {isGiving ? 'Saving...' : 'Mark as Given'}
                    </button>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 uppercase shadow-sm">
                    {driver.name.substring(0, 2)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + Level Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">{driver.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{driver.phone || 'No phone'}</p>
                      </div>

                      {/* Level badge */}
                      <div className="flex-shrink-0">
                        {hasNoLevel ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
                            ⏳ Starting L1...
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border ${style.bg} ${style.text} ${style.border}`}>
                            {style.icon} {driver.activeOffer}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {!hasNoLevel && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">
                            <strong className="text-slate-700 dark:text-slate-200">{driver.completedRides}</strong> / {driver.targetRides} customers
                          </span>
                          <span className={`font-bold ${isDone ? 'text-emerald-600' : isNear ? 'text-orange-500' : 'text-slate-500 dark:text-slate-400'}`}>
                            {isDone ? '✓ Gift Ready!' : isNear ? '🔥 Almost There!' : `${driver.progressPercent.toFixed(0)}%`}
                          </span>
                        </div>
                        <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isDone
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                : isNear
                                ? 'bg-gradient-to-r from-orange-400 to-amber-500'
                                : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                            }`}
                            style={{ width: `${Math.min(driver.progressPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <Trophy size={12} className={driver.completedOffersCount > 0 ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'} />
                        <span><strong className="text-slate-700 dark:text-slate-200">{driver.completedOffersCount}</strong> gifts earned</span>
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${
                        driver.status === 'Active'
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${driver.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {driver.status}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
