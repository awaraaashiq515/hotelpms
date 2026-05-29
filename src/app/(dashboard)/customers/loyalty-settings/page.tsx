'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Coins, TrendingUp, Gift, Save, Sparkles, HelpCircle, 
  ArrowRight, Calculator, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export default function LoyaltySettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Loyalty Settings States
  const [earnRate, setEarnRate] = useState(0.1);
  const [redeemValue, setRedeemValue] = useState(1.0);
  const [referralBonus, setReferralBonus] = useState(50);

  // Simulator States
  const [simSpend, setSimSpend] = useState(1000);
  const [simRedeem, setSimRedeem] = useState(100);

  // Fetch current loyalty settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customers/loyalty-settings');
      const data = await res.json();
      if (data.success && data.data) {
        setEarnRate(data.data.loyalty_earn_rate);
        setRedeemValue(data.data.loyalty_redeem_value);
        setReferralBonus(data.data.referral_bonus_points);
      } else {
        showToast(data.message || 'Failed to fetch settings', 'error');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      showToast('Error loading settings from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/customers/loyalty-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loyalty_earn_rate: Number(earnRate),
          loyalty_redeem_value: Number(redeemValue),
          referral_bonus_points: Math.round(Number(referralBonus))
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Loyalty settings updated successfully!', 'success');
      } else {
        showToast(data.message || 'Failed to save settings', 'error');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Connection error occurred while saving', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Derived simulator values
  const simulatedEarnedPoints = Math.floor(simSpend * earnRate);
  const simulatedRedeemDiscount = simRedeem * redeemValue;

  if (loading) {
    return (
      <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest">
        Loading Loyalty Rules & Configs...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Loyalty & Referral Rules" 
        subtitle="Configure points accrual, redemption rates, and referral bonuses"
        showBack
        backUrl="/customers"
      />

      {/* CRM Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
        <Link
          href="/customers"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Guests List
        </Link>
        <Link
          href="/customers/campaigns"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Marketing Campaigns
        </Link>
        <Link
          href="/customers/coupons"
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
        >
          Smart Coupons
        </Link>
        <Link
          href="/customers/loyalty-settings"
          className="px-4 py-2 bg-pos-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-md"
        >
          Loyalty Rules
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 lg:p-8 border-t-4 border-t-red-600 shadow-xl bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-3xl">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-white/5">
              <div className="w-12 h-12 bg-red-500/10 text-pos-primary rounded-2xl flex items-center justify-center">
                <Coins size={24} />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">
                  Loyalty Points Engine Settings
                </h2>
                <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">
                  Determine how loyalty points are generated and spent by customers
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              
              {/* Point Accrual Rate */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  <TrendingUp size={12} className="text-emerald-500" />
                  Point Earn Rate (Multiplier)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={earnRate}
                    onChange={(e) => setEarnRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 bg-white dark:bg-slate-900 font-bold text-sm dark:text-white transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                    pts / ₹1 spent
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                  How many points a guest earns per Rupee spent. E.g., <strong className="text-slate-800 dark:text-slate-200">0.10</strong> awards 10% of the total amount in points (1 point per ₹10 spent).
                </p>
              </div>

              {/* Point Redemption Value */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  <Sparkles size={12} className="text-amber-500" />
                  Redemption Rate (₹ Value per Point)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1000"
                    value={redeemValue}
                    onChange={(e) => setRedeemValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 bg-white dark:bg-slate-900 font-bold text-sm dark:text-white transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                    ₹ / 1 point
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                  The discount amount (in Rupees) given for each point redeemed. E.g., <strong className="text-slate-800 dark:text-slate-200">1.00</strong> translates 1 point to a ₹1 discount.
                </p>
              </div>

              {/* Referral Bonus points */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  <Gift size={12} className="text-indigo-500" />
                  Referral Reward Bonus
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={referralBonus}
                    onChange={(e) => setReferralBonus(parseInt(e.target.value) || 0)}
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500 bg-white dark:bg-slate-900 font-bold text-sm dark:text-white transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                    PTS / Invite
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                  Bonus points credited to a referrer's account when their referred friend completes their first order. Default is <strong className="text-slate-800 dark:text-slate-200">50</strong> points.
                </p>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-pos-primary hover:bg-red-700 text-white font-black tracking-widest py-4 rounded-2xl shadow-xl shadow-red-200 dark:shadow-none flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  <Save size={16} />
                  {saving ? 'SAVING CONFIGURATIONS...' : 'SAVE LOYALTY RULES'}
                </Button>
              </div>

            </form>
          </Card>
        </div>

        {/* Live Simulator Widget */}
        <div className="space-y-6">
          
          {/* Rules Simulator Card */}
          <Card className="p-6 bg-[#0f172a] text-white border border-slate-800 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-850">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <Calculator size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
                    Interactive Rule Simulator
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-tight">
                    Simulate how configuration parameters apply to a test bill
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Simulated Spend */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Simulated Bill Total: ₹{simSpend}
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="50"
                    value={simSpend}
                    onChange={(e) => setSimSpend(Number(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                {/* Simulated Redeem */}
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Redeem Points: {simRedeem} PTS
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={simRedeem}
                    onChange={(e) => setSimRedeem(Number(e.target.value))}
                    className="w-full h-1 bg-slate-850 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>

              {/* Simulation Result Receipt */}
              <div className="mt-8 p-5 bg-slate-900/60 rounded-2xl border border-slate-850 font-mono text-xs text-slate-300 space-y-3">
                <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest pb-1 border-b border-slate-850">
                  MOCK CHECKOUT CALCULATIONS
                </div>
                
                <div className="flex justify-between">
                  <span>Subtotal Amount:</span>
                  <span className="font-bold text-white">₹{simSpend.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-emerald-400">
                  <span>Points Earned:</span>
                  <span className="font-black">+{simulatedEarnedPoints} PTS</span>
                </div>

                <div className="flex justify-between text-amber-400">
                  <span>Points Redeemed ({simRedeem} pts):</span>
                  <span className="font-bold">-₹{simulatedRedeemDiscount.toFixed(2)}</span>
                </div>

                <div className="border-t border-dashed border-slate-800 my-2 pt-2 flex justify-between text-sm text-white font-black">
                  <span>Final Bill Total:</span>
                  <span className="text-emerald-400">
                    ₹{Math.max(0, simSpend - simulatedRedeemDiscount).toFixed(2)}
                  </span>
                </div>

                <div className="border-t border-slate-850 pt-2 flex items-start gap-2 text-[9px] text-slate-400 font-bold uppercase leading-normal">
                  <Gift size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    Referrer credits +{referralBonus} PTS if this is the guest's 1st order.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-900/40 p-3 rounded-xl border border-slate-850">
              <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              <span>Real POS uses these active rates dynamically during checkout.</span>
            </div>
          </Card>

          {/* Quick Guide Card */}
          <Card className="p-6 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/5 rounded-3xl shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-white/5">
              <HelpCircle size={16} className="text-pos-primary" />
              <span className="text-[10px] font-black uppercase tracking-wider">Configuration Guide</span>
            </div>
            
            <ul className="space-y-3 text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <span>To credit 1 Point per ₹100 spent, set Point Earn Rate to <strong className="text-slate-700 dark:text-slate-200">0.01</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span>To credit 1 Point per ₹10 spent, set Point Earn Rate to <strong className="text-slate-700 dark:text-slate-200">0.10</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>If 1 Point redeemed gives a discount of ₹1, set Point Redeem Value to <strong className="text-slate-700 dark:text-slate-200">1.00</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>To disable loyalty points earning, set Point Earn Rate to <strong className="text-slate-700 dark:text-slate-200">0</strong>.</span>
              </li>
            </ul>
          </Card>
        </div>

      </div>
    </div>
  );
}
