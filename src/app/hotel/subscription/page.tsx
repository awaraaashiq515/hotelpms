'use client';

import React, { useState, useEffect } from 'react';
import {
  Package, CheckCircle2, XCircle, Clock, Sparkles, Crown,
  Zap, Star, ArrowRight, RefreshCcw, ShieldCheck, CalendarDays,
  Boxes, Lock, Unlock
} from 'lucide-react';

interface SubscriptionData {
  packageName: string | null;
  packageFeatures: string[];
  packageEndDate: string | null;
  subscriptionStatus: string | null;
  discountPercent: number;
  organizationName: string | null;
}

const FEATURE_META: Record<string, { label: string; icon: string; group: string }> = {
  POS:          { label: 'Point of Sale',        icon: '🛒', group: 'Core' },
  INVENTORY:    { label: 'Inventory',             icon: '📦', group: 'Core' },
  ACCOUNTING:   { label: 'Accounting',            icon: '💰', group: 'Core' },
  HMS:          { label: 'Hotel Management',      icon: '🏨', group: 'Hospitality' },
  TABLES:       { label: 'Table Management',      icon: '🪑', group: 'Hospitality' },
  TABLETS:      { label: 'Tablet / Waiter App',   icon: '📱', group: 'Hospitality' },
  BARPOS:       { label: 'Bar POS',               icon: '🍺', group: 'Hospitality' },
  CAFEPOS:      { label: 'Cafe POS',              icon: '☕', group: 'Hospitality' },
  REPORTS:      { label: 'Reports & Analytics',   icon: '📊', group: 'Analytics' },
  GST:          { label: 'GST Filing',            icon: '📋', group: 'Analytics' },
  STAFF:        { label: 'Staff Management',      icon: '👥', group: 'People' },
  DRIVERS:      { label: 'Driver Management',     icon: '🚗', group: 'People' },
  CRM:          { label: 'CRM & Memberships',     icon: '👤', group: 'People' },
  OFFERS:       { label: 'Offers & Rewards',      icon: '🎁', group: 'Marketing' },
  WEBSITE:      { label: 'Website CMS',           icon: '🌐', group: 'Marketing' },
  B2B:          { label: 'B2B Marketplace',       icon: '🚛', group: 'Advanced' },
  PARKING:      { label: 'Parking',               icon: '🅿️', group: 'Advanced' },
  WASTE:        { label: 'Waste Management',      icon: '🗑️', group: 'Advanced' },
  WHATSAPP:     { label: 'WhatsApp Bot',          icon: '💬', group: 'Integrations' },
  WALKIETALKIE: { label: 'Staff Walkie-Talkie',   icon: '📡', group: 'Integrations' },
  GEOFENCING:   { label: 'Geo Attendance',        icon: '📍', group: 'Integrations' },
  TIPS:         { label: 'Tips & Gratuity',       icon: '💵', group: 'Integrations' },
};

const ALL_FEATURE_KEYS = Object.keys(FEATURE_META);
const GROUPS = ['Core', 'Hospitality', 'Analytics', 'People', 'Marketing', 'Advanced', 'Integrations'];

const PLAN_COLORS: Record<string, string> = {
  'Free Trial': '#10b981',
  'Starter': '#06b6d4',
  'Professional': '#f43f5e',
  'Enterprise': '#8b5cf6',
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  'Free Trial':    <Sparkles size={20} />,
  'Starter':       <Zap size={20} />,
  'Professional':  <Star size={20} />,
  'Enterprise':    <Crown size={20} />,
};

function getDaysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function MySubscriptionPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/session');
      const json = await res.json();
      if (json.authenticated) {
        setData({
          packageName: json.user?.packageName ?? null,
          packageFeatures: json.user?.packageFeatures ?? [],
          packageEndDate: json.user?.packageEndDate ?? null,
          subscriptionStatus: json.user?.subscriptionStatus ?? null,
          discountPercent: json.user?.discountPercent ?? 0,
          organizationName: json.user?.organizationName ?? null,
        });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadSubscription(); }, []);

  const daysLeft = data ? getDaysLeft(data.packageEndDate) : null;
  const planColor = data?.packageName ? (PLAN_COLORS[data.packageName] || '#8b5cf6') : '#64748b';
  const hasPackage = !!data?.packageName;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1">My Subscription</p>
          <h1 className="text-2xl font-extrabold text-white">My Plan</h1>
          {data?.organizationName && (
            <p className="text-sm text-slate-400 mt-0.5">{data.organizationName}</p>
          )}
        </div>
        <button onClick={loadSubscription} disabled={loading}
          className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-400 rounded-full animate-spin" />
        </div>
      ) : !hasPackage ? (
        /* ── NO PLAN STATE ── */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 rounded-3xl bg-slate-800 border border-white/10 flex items-center justify-center mb-6 shadow-xl">
            <Package size={40} className="text-slate-500" />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-2">Aapke Paas Koi Plan Nahi Hai</h2>
          <p className="text-slate-400 text-sm max-w-xs mb-8">
            Abhi tak aapke account ko koi subscription plan assign nahi hua hai.<br />
            Super Admin se contact karein ya neeche plan ke liye request karein.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-sm transition-all">
              <Sparkles size={15} /> Plan Choose Karein
            </a>
            <a href="mailto:support@gustflow.com" className="inline-flex items-center gap-2 px-6 py-3 border border-white/15 hover:bg-white/5 text-slate-300 rounded-2xl font-bold text-sm transition-all">
              Support Se Contact Karein
            </a>
          </div>
        </div>
      ) : (
        /* ── PLAN FOUND ── */
        <div className="space-y-5">
          {/* Plan Card */}
          <div className="relative rounded-3xl overflow-hidden border-2 p-6"
            style={{ borderColor: planColor, boxShadow: `0 0 40px ${planColor}20`, background: `linear-gradient(135deg, ${planColor}10, transparent)` }}>

            {/* Plan badge */}
            <div className="absolute top-4 right-4">
              {data.subscriptionStatus === 'ACTIVE' || !data.subscriptionStatus ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                  <CheckCircle2 size={11} /> Active
                </span>
              ) : data.subscriptionStatus === 'PENDING' ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-wider">
                  <Clock size={11} /> Pending
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[11px] font-black uppercase tracking-wider">
                  <XCircle size={11} /> Expired
                </span>
              )}
            </div>

            {/* Plan name */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${planColor}25`, color: planColor }}>
                {PLAN_ICONS[data.packageName!] || <Boxes size={22} />}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Plan</p>
                <h2 className="text-2xl font-extrabold text-white">{data.packageName}</h2>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-2xl p-3 text-center">
                <p className="text-lg font-extrabold" style={{ color: planColor }}>{data.packageFeatures.length}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Features</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 text-center">
                <p className="text-lg font-extrabold" style={{ color: planColor }}>
                  {data.discountPercent > 0 ? `${data.discountPercent}%` : '—'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Discount</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 text-center">
                {daysLeft !== null ? (
                  <>
                    <p className={`text-lg font-extrabold ${daysLeft <= 7 ? 'text-red-400' : daysLeft <= 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {daysLeft > 0 ? daysLeft : 0}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Days Left</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-extrabold text-emerald-400">∞</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lifetime</p>
                  </>
                )}
              </div>
            </div>

            {/* Expiry */}
            {data.packageEndDate && (
              <div className="flex items-center gap-2 mt-4 text-[11px] text-slate-400">
                <CalendarDays size={12} style={{ color: planColor }} />
                <span>Valid until: <strong className="text-white">{new Date(data.packageEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
              </div>
            )}
          </div>

          {/* Features by group */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-violet-400" />
                <p className="font-extrabold text-white text-sm">Feature Access</p>
              </div>
              <span className="text-[11px] font-bold text-violet-300 bg-violet-500/15 px-3 py-1 rounded-full">
                {data.packageFeatures.length} / {ALL_FEATURE_KEYS.length} features
              </span>
            </div>

            <div className="p-5 space-y-5">
              {GROUPS.map(group => {
                const groupFeatures = ALL_FEATURE_KEYS.filter(k => FEATURE_META[k]?.group === group);
                if (groupFeatures.length === 0) return null;
                const activeInGroup = groupFeatures.filter(k => data.packageFeatures.includes(k));

                return (
                  <div key={group}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{group}</p>
                      <span className="text-[10px] text-slate-500">{activeInGroup.length}/{groupFeatures.length}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {groupFeatures.map(key => {
                        const meta = FEATURE_META[key];
                        const hasAccess = data.packageFeatures.includes(key);
                        return (
                          <div key={key} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${hasAccess ? 'bg-white/5' : 'opacity-40'}`}>
                            <span className="text-base w-6 text-center shrink-0">{meta.icon}</span>
                            <span className={`text-sm font-medium flex-1 ${hasAccess ? 'text-white' : 'text-slate-500'}`}>{meta.label}</span>
                            {hasAccess ? (
                              <Unlock size={13} className="text-emerald-400 shrink-0" />
                            ) : (
                              <Lock size={13} className="text-slate-600 shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-violet-600/20 to-rose-600/20 border border-violet-500/30 rounded-3xl p-5 flex items-center justify-between gap-4">
            <div>
              <p className="font-extrabold text-white text-sm mb-0.5">Plan Upgrade Karna Chahte Hain?</p>
              <p className="text-[11px] text-slate-400">Super Admin se contact karein ya naye features ke liye request karein.</p>
            </div>
            <a href="mailto:support@gustflow.com"
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-xs transition-all">
              Upgrade <ArrowRight size={13} />
            </a>
          </div>
        </div>
      )}

      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    </div>
  );
}
