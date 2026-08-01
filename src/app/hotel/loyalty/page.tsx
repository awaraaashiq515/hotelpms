'use client';

import React, { useState, useEffect } from 'react';
import { Star, Crown, Gift, TrendingUp, Plus, UserCheck, CheckCircle2, Loader2, X, Sparkles } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { TierCard, type LoyaltyTier } from './components/TierCard';
import { RewardsList, type Reward } from './components/RewardsList';
import { PointsHistory, type PointsEntry } from './components/PointsHistory';

const TIER_MEMBERS: Record<LoyaltyTier, number> = {
  BRONZE: 320, SILVER: 185, GOLD: 92, PLATINUM: 34, DIAMOND: 8,
};

const INITIAL_REWARDS: Reward[] = [
  { id: '1', name: '10% Room Discount', description: 'Valid on next stay, any room type', pointsCost: 500, category: 'DISCOUNT', minTier: 'BRONZE', stock: 999, imageEmoji: '🏷️' },
  { id: '2', name: 'Free Breakfast Voucher', description: 'Complimentary buffet breakfast for 2 guests', pointsCost: 800, category: 'FOOD', minTier: 'SILVER', stock: 50, imageEmoji: '🍳' },
  { id: '3', name: 'Room Upgrade Voucher', description: 'Upgrade to next room category upon check-in', pointsCost: 1500, category: 'UPGRADE', minTier: 'SILVER', stock: 10, imageEmoji: '⬆️' },
  { id: '4', name: 'Spa Relaxation Session (60 min)', description: 'Full body Swedish relaxation massage', pointsCost: 2000, category: 'SPA', minTier: 'GOLD', stock: 20, imageEmoji: '🧖' },
  { id: '5', name: 'Airport Shuttle Transfer', description: 'Complimentary sedan airport pickup/drop', pointsCost: 2500, category: 'EXPERIENCE', minTier: 'GOLD', stock: 30, imageEmoji: '🚗' },
  { id: '6', name: 'Free Night Suite Upgrade', description: 'One complimentary night in Premium Executive Suite', pointsCost: 8000, category: 'UPGRADE', minTier: 'PLATINUM', stock: 5, imageEmoji: '🏨' },
];

const INITIAL_HISTORY: PointsEntry[] = [
  { id: '1', date: new Date().toISOString().split('T')[0], description: 'Stay Reward - Executive Room 204', points: 350, type: 'EARN', balance: 3250, reservationNo: 'RES-2026-089' },
  { id: '2', date: '2026-07-20', description: 'Spa Wellness Treatment', points: 150, type: 'EARN', balance: 2900 },
  { id: '3', date: '2026-07-15', description: 'Redeemed: Free Breakfast Voucher', points: -800, type: 'REDEEM', balance: 2750 },
  { id: '4', date: '2026-07-10', description: 'Welcome Loyalty Bonus', points: 500, type: 'ADJUST', balance: 3550 },
];

export default function LoyaltyPage() {
  const [tab, setTab] = useState<'rewards' | 'history' | 'tiers'>('rewards');
  const [rewards, setRewards] = useState<Reward[]>(INITIAL_REWARDS);
  const [history, setHistory] = useState<PointsEntry[]>(INITIAL_HISTORY);
  const [guests, setGuests] = useState<any[]>([]);

  // Modals state
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    pointsCost: '500',
    category: 'DISCOUNT' as any,
    minTier: 'BRONZE',
    stock: '50',
    imageEmoji: '🎁'
  });

  const [showIssuePointsModal, setShowIssuePointsModal] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [issueForm, setIssueForm] = useState({
    guestId: '',
    points: '250',
    type: 'EARN' as 'EARN' | 'REDEEM' | 'ADJUST',
    description: 'Bonus Loyalty Points'
  });

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const res = await fetch('/api/hotel/guests?limit=100');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setGuests(json.data);
        if (json.data.length > 0) {
          setIssueForm(prev => ({ ...prev, guestId: json.data[0].id }));
        }
      }
    } catch {
      // silent
    }
  };

  const handleCreateReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardForm.name) {
      toast.error('Reward name is required.');
      return;
    }

    const newReward: Reward = {
      id: Date.now().toString(),
      name: rewardForm.name,
      description: rewardForm.description || 'Exclusive loyalty reward',
      pointsCost: parseInt(rewardForm.pointsCost) || 500,
      category: rewardForm.category,
      minTier: rewardForm.minTier,
      stock: parseInt(rewardForm.stock) || 50,
      imageEmoji: rewardForm.imageEmoji || '🎁'
    };

    setRewards([newReward, ...rewards]);
    toast.success(`New Reward "${newReward.name}" added successfully!`);
    setShowAddRewardModal(false);
    setRewardForm({
      name: '',
      description: '',
      pointsCost: '500',
      category: 'DISCOUNT',
      minTier: 'BRONZE',
      stock: '50',
      imageEmoji: '🎁'
    });
  };

  const handleIssuePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.guestId || !issueForm.points) {
      toast.error('Please select a guest and enter points amount.');
      return;
    }

    const pointsVal = parseInt(issueForm.points);
    if (isNaN(pointsVal) || pointsVal === 0) {
      toast.error('Please enter a valid points amount.');
      return;
    }

    const delta = issueForm.type === 'REDEEM' ? -Math.abs(pointsVal) : Math.abs(pointsVal);
    const selGuest = guests.find(g => g.id === issueForm.guestId);

    setIssuing(true);
    try {
      const res = await fetch('/api/hotel/guests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: issueForm.guestId,
          deltaPoints: delta
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Successfully ${issueForm.type === 'REDEEM' ? 'redeemed' : 'issued'} ${Math.abs(delta)} points for ${selGuest ? selGuest.firstName : 'guest'}!`);

        // Add to Points History
        const newEntry: PointsEntry = {
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          description: `${selGuest ? selGuest.firstName + ' ' + (selGuest.lastName || '') : 'Guest'} — ${issueForm.description}`,
          points: delta,
          type: issueForm.type === 'REDEEM' ? 'REDEEM' : issueForm.type === 'ADJUST' ? 'ADJUST' : 'EARN',
          balance: json.data.loyaltyPoints
        };

        setHistory([newEntry, ...history]);
        setShowIssuePointsModal(false);
        fetchGuests();
      } else {
        toast.error(json.message || 'Failed to issue points.');
      }
    } catch {
      toast.error('Network error. Failed to issue points.');
    } finally {
      setIssuing(false);
    }
  };

  const totalPointsPool = guests.reduce((sum, g) => sum + (g.loyaltyPoints || 0), 0);

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto p-6 text-white">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown size={16} className="text-amber-400" />
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Guests · Loyalty & Rewards Console</span>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Loyalty Program & Gift Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage reward packages, track point redemptions, and issue loyalty points to hotel guests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddRewardModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-xs font-black text-white shadow-lg shadow-amber-600/20 active:scale-95 transition-all"
          >
            <Gift size={14} /> + Add Reward Package
          </button>
          <button
            onClick={() => setShowIssuePointsModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white shadow-lg active:scale-95 transition-all"
          >
            <Star size={14} fill="currentColor" /> ⭐ Issue / Adjust Points
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Loyalty Members', value: guests.length || Object.values(TIER_MEMBERS).reduce((s, v) => s + v, 0), color: 'border-amber-500/20 bg-amber-950/20 text-amber-400', sub: 'Registered Hotel Guests' },
          { label: 'Active Rewards Catalog', value: rewards.length, color: 'border-emerald-500/20 bg-emerald-950/20 text-emerald-400', sub: 'Vouchers & Experiences' },
          { label: 'Total Points Pool', value: `${totalPointsPool.toLocaleString('en-IN')} PTS`, color: 'border-indigo-500/20 bg-indigo-950/20 text-indigo-400', sub: 'Available in System' },
          { label: 'Points History Logs', value: history.length, color: 'border-rose-500/20 bg-rose-950/20 text-rose-400', sub: 'Earn & Redeem Transactions' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 backdrop-blur-sm ${s.color}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-90">{s.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {(['rewards', 'history', 'tiers'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              tab === t ? 'bg-amber-600 text-white shadow-md' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t === 'rewards' ? '🎁 Reward Catalog' : t === 'history' ? '📜 Points History Logs' : '👑 Tier Overview'}
          </button>
        ))}
      </div>

      {/* Tab 1: Reward Catalog */}
      {tab === 'rewards' && (
        <RewardsList 
          rewards={rewards} 
          guestPoints={3250}
          onRedeem={id => {
            const item = rewards.find(r => r.id === id);
            toast.success(`Voucher code generated for "${item?.name}"! Redeem request logged.`);
          }} 
        />
      )}

      {/* Tab 2: Points History */}
      {tab === 'history' && <PointsHistory entries={history} />}

      {/* Tab 3: Tier Overview */}
      {tab === 'tiers' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as LoyaltyTier[]).map(tier => (
            <TierCard
              key={tier}
              tier={tier}
              memberCount={TIER_MEMBERS[tier]}
              currentPoints={tier === 'GOLD' ? 3250 : undefined}
              isCurrentTier={tier === 'GOLD'}
            />
          ))}
        </div>
      )}

      {/* MODAL 1: CREATE NEW REWARD PACKAGE */}
      {showAddRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4 my-8 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Gift size={18} className="text-amber-400" /> Create Reward / Gift Voucher
              </h2>
              <button onClick={() => setShowAddRewardModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReward} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Reward Name *</label>
                <input
                  type="text" required placeholder="e.g. 15% Dining Voucher"
                  className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  value={rewardForm.name}
                  onChange={e => setRewardForm({ ...rewardForm, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Category</label>
                  <select
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    value={rewardForm.category}
                    onChange={e => setRewardForm({ ...rewardForm, category: e.target.value as any })}
                  >
                    <option value="DISCOUNT" className="bg-[#090f1e] text-white">DISCOUNT</option>
                    <option value="FOOD" className="bg-[#090f1e] text-white">FOOD & BEVERAGE</option>
                    <option value="UPGRADE" className="bg-[#090f1e] text-white">ROOM UPGRADE</option>
                    <option value="SPA" className="bg-[#090f1e] text-white">SPA & WELLNESS</option>
                    <option value="EXPERIENCE" className="bg-[#090f1e] text-white">EXPERIENCE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Points Cost *</label>
                  <input
                    type="number" required min="1"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    value={rewardForm.pointsCost}
                    onChange={e => setRewardForm({ ...rewardForm, pointsCost: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Min Tier</label>
                  <select
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    value={rewardForm.minTier}
                    onChange={e => setRewardForm({ ...rewardForm, minTier: e.target.value })}
                  >
                    <option value="BRONZE" className="bg-[#090f1e] text-white">BRONZE</option>
                    <option value="SILVER" className="bg-[#090f1e] text-white">SILVER</option>
                    <option value="GOLD" className="bg-[#090f1e] text-white">GOLD</option>
                    <option value="PLATINUM" className="bg-[#090f1e] text-white">PLATINUM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Available Stock</label>
                  <input
                    type="number" required min="1"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    value={rewardForm.stock}
                    onChange={e => setRewardForm({ ...rewardForm, stock: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Emoji Icon</label>
                  <input
                    type="text" placeholder="🎁"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    value={rewardForm.imageEmoji}
                    onChange={e => setRewardForm({ ...rewardForm, imageEmoji: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Description / Terms</label>
                <textarea
                  rows={2} placeholder="Valid on next stay, terms apply..."
                  className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  value={rewardForm.description}
                  onChange={e => setRewardForm({ ...rewardForm, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowAddRewardModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-black text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-xs font-black text-white shadow-md active:scale-95 transition-all"
                >
                  Create Reward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ISSUE / ADJUST POINTS TO GUEST */}
      {showIssuePointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Star size={18} className="text-amber-400" fill="currentColor" /> Issue / Adjust Guest Points
              </h2>
              <button onClick={() => setShowIssuePointsModal(false)} className="text-slate-400 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleIssuePoints} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Select Hotel Guest *</label>
                <select
                  required
                  className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  value={issueForm.guestId}
                  onChange={e => setIssueForm({ ...issueForm, guestId: e.target.value })}
                >
                  {guests.length === 0 ? (
                    <option value="" disabled className="bg-[#090f1e] font-medium text-slate-400">Loading guests...</option>
                  ) : (
                    guests.map(g => (
                      <option key={g.id} value={g.id} className="bg-[#090f1e] text-white font-medium">
                        {g.firstName} {g.lastName || ''} ({g.mobile || g.email || 'Guest'}) — {g.loyaltyPoints || 0} Pts
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Transaction Type</label>
                  <select
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    value={issueForm.type}
                    onChange={e => setIssueForm({ ...issueForm, type: e.target.value as any })}
                  >
                    <option value="EARN" className="bg-[#090f1e] text-white">EARN (+ Points)</option>
                    <option value="REDEEM" className="bg-[#090f1e] text-white">REDEEM (- Points)</option>
                    <option value="ADJUST" className="bg-[#090f1e] text-white">ADJUSTMENT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Points Amount *</label>
                  <input
                    type="number" required min="1" placeholder="e.g. 250"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    value={issueForm.points}
                    onChange={e => setIssueForm({ ...issueForm, points: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Description / Reason</label>
                <input
                  type="text" required placeholder="e.g. Room Stay Bonus / Anniversary Reward"
                  className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  value={issueForm.description}
                  onChange={e => setIssueForm({ ...issueForm, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowIssuePointsModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-black text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  {issuing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {issuing ? 'Updating Points...' : 'Save & Issue Points'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
