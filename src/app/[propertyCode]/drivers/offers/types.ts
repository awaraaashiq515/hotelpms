// ─────────────────────────────────────────────
// Shared types for Driver Rewards module
// ─────────────────────────────────────────────

export interface DriverProgress {
  id: string;
  name: string;
  phone: string;
  status: string;
  activeOffer: string;
  activeOfferId?: string;
  offerLevel?: string;
  completedRides: number;
  referredCustomers: number;
  targetRides: number;
  targetReferrals: number;
  progressPercent: number;
  completedOffersCount: number;
  pendingRewardsCount: number;
  rewardPending: boolean;
}

export interface OfferRule {
  id: string;
  title: string;
  priority: number;
  offerType: string;
  targetRides: number;
  targetReferrals: number;
  rewardType: string;
  rewardValue: number;
  rewardItem?: string;
  resetType: string;
  nextOfferId?: string;
  nextOffer?: { id: string; title: string; priority: number } | null;
  isActive: boolean;
}

export interface HistoryEntry {
  id: string;
  driverId: string;
  offerId: string;
  ridesAtCompletion: number;
  rewardEarned: number;
  rewardItemEarned?: string;
  completedAt: string;
  driver: { name: string; phone: string };
  offer: { title: string; priority: number; rewardType: string };
}

export interface HistorySummary {
  totalRewardsPaid: number;
  uniqueDriversRewarded: number;
  totalEntries: number;
  topPerformer: { name: string; total: number } | null;
}

export type ActiveTab = 'rules' | 'drivers' | 'history';

export type OfferForm = {
  title: string;
  offerType: string;
  targetRides: number;
  targetReferrals: number;
  rewardValue: number;
  rewardType: string;
  rewardItem: string;
  resetType: string;
  priority: number;
  nextOfferId: string;
  isActive: boolean;
};

// ─────────────────────────────────────────────
// Level badge color palette (priority-based)
// ─────────────────────────────────────────────

export const levelColors = [
  { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-300 dark:border-amber-700', icon: '🥉' },
  { bg: 'bg-slate-100 dark:bg-slate-700/50',  text: 'text-slate-600 dark:text-slate-300',  border: 'border-slate-300 dark:border-slate-600',  icon: '🥈' },
  { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700', icon: '🥇' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/30',   text: 'text-cyan-700 dark:text-cyan-400',   border: 'border-cyan-300 dark:border-cyan-700',   icon: '💎' },
];

export function getLevelStyle(priority: number) {
  const idx = Math.max(0, Math.min(priority - 1, levelColors.length - 1));
  return levelColors[idx];
}
