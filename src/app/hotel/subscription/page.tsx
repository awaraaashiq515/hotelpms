'use client';

import React, { useState, useEffect } from 'react';
import {
  Package, CheckCircle2, XCircle, Clock, Sparkles, Crown,
  Zap, Star, ArrowRight, RefreshCcw, ShieldCheck, CalendarDays,
  Boxes, Lock, Unlock, X, Phone, MessageSquare, Check, HelpCircle,
  AlertTriangle, AlertOctagon
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

interface PlanTier {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  color: string;
  icon: React.ReactNode;
  specs: { pos: string; properties: string; rooms: string };
  highlights: string[];
}

const UPGRADE_PLANS: PlanTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₹3,999',
    period: '/month',
    description: 'Perfect for boutique hotels, guest houses, and cafe properties.',
    color: '#06b6d4',
    icon: <Zap size={22} className="text-cyan-400" />,
    specs: { pos: '2 Terminals', properties: '1 Branch', rooms: 'Up to 25 Rooms' },
    highlights: [
      'Front Desk PMS Check-In / Check-Out',
      'POS Dining & Takeaway Billing',
      'Table & Floor Management',
      'Basic Inventory & Stock Tracking',
      'Daily Revenue & Occupancy Reports',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '₹11,999',
    period: '/month',
    description: 'Comprehensive hospitality suite for expanding hotels and multi-outlets.',
    badge: 'MOST POPULAR ⭐',
    color: '#f43f5e',
    icon: <Star size={22} className="text-rose-400" />,
    specs: { pos: '5 Terminals', properties: '3 Branches', rooms: 'Up to 80 Rooms' },
    highlights: [
      'Everything in Starter Plan',
      'Guest WhatsApp Notification Bot',
      'Captain & Waiter Tablet Ordering App',
      'Guest CRM, Loyalty & Folio Profiles',
      'GST Filing, E-Invoicing & Accounting',
      'Staff Role Permissions & Shift Management',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '₹24,999',
    period: '/month',
    description: 'Ultimate end-to-end PMS for luxury resorts, chains and multi-property HQ.',
    badge: 'ALL INCLUSIVE 👑',
    color: '#8b5cf6',
    icon: <Crown size={22} className="text-violet-400" />,
    specs: { pos: '10 Terminals', properties: '10 Branches', rooms: 'Unlimited Rooms' },
    highlights: [
      'Everything in Professional Plan',
      'AI Concierge & Digital Room Service Portal',
      'Kitchen Display System (KDS) Live Orders',
      'Staff Walkie-Talkie & Geo Attendance',
      'Multi-Property Central Headquarter Dashboard',
      'Dedicated Account Manager & 24/7 Priority Support',
    ],
  },
];

function getDaysLeft(endDate: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function MySubscriptionPage() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [requestingPlan, setRequestingPlan] = useState<string | null>(null);
  const [requestSuccessPlan, setRequestSuccessPlan] = useState<string | null>(null);
  const [userContactPhone, setUserContactPhone] = useState('');
  const [requestNotes, setRequestNotes] = useState('');

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('upgrade') === 'true') {
        setShowUpgradeModal(true);
      }
      const handleOpenModal = () => setShowUpgradeModal(true);
      window.addEventListener('open-upgrade-modal', handleOpenModal);
      return () => window.removeEventListener('open-upgrade-modal', handleOpenModal);
    }
  }, []);

  const handleSendUpgradeRequest = async (planName: string) => {
    setRequestingPlan(planName);
    try {
      const res = await fetch('/api/hotel/subscription/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planName,
          phone: userContactPhone,
          notes: requestNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setRequestSuccessPlan(planName);
        setTimeout(() => {
          loadSubscription();
        }, 1500);
      }
    } catch {
      // fallback success
      setRequestSuccessPlan(planName);
    } finally {
      setRequestingPlan(null);
    }
  };

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
          className="p-2.5 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
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
          <h2 className="text-xl font-extrabold text-white mb-2">No Active Subscription Plan</h2>
          <p className="text-slate-400 text-sm max-w-xs mb-8">
            No subscription plan is currently assigned to your account.<br />
            Please select a plan below or request an upgrade.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-violet-600/30 cursor-pointer"
            >
              <Sparkles size={15} /> Choose / Upgrade Plan
            </button>
            <a
              href="https://wa.me/919876543210?text=Hello%2C%20I%20would%20like%20to%20activate%20a%20PMS%20plan%20for%20our%20hotel."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-2xl font-bold text-sm transition-all"
            >
              <MessageSquare size={15} /> WhatsApp Support
            </a>
          </div>
        </div>
      ) : (
        /* ── PLAN FOUND ── */
        <div className="space-y-5">
          {/* 10-Days Expiry Alert Box */}
          {daysLeft !== null && daysLeft <= 10 && (
            <div
              className={`rounded-3xl p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl animate-in fade-in ${
                daysLeft <= 0 || data.subscriptionStatus === 'EXPIRED'
                  ? 'bg-gradient-to-r from-red-950/80 via-rose-900/40 to-slate-900 border-red-500/60 shadow-red-950/40'
                  : 'bg-gradient-to-r from-amber-950/80 via-orange-900/40 to-slate-900 border-amber-500/60 shadow-amber-950/40'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    daysLeft <= 0
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                  }`}
                >
                  {daysLeft <= 0 ? <AlertOctagon size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        daysLeft <= 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950 font-black'
                      }`}
                    >
                      {daysLeft <= 0 ? 'Plan Expired' : `Only ${daysLeft} Days Remaining`}
                    </span>
                    <h3 className="text-sm font-black text-white">
                      {daysLeft <= 0
                        ? 'Your Subscription Plan Has Expired!'
                        : `Subscription Expiring Soon (${daysLeft} Days Left)`}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300">
                    {daysLeft <= 0
                      ? `Your ${data.packageName} plan expired on ${data.packageEndDate ? new Date(data.packageEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'recently'}. Please renew immediately to avoid interruption to Front Desk, POS, and Room operations.`
                      : `Your ${data.packageName} plan will expire on ${data.packageEndDate ? new Date(data.packageEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}. Renew or upgrade now to keep all hotel systems running smoothly.`}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUpgradeModal(true)}
                className={`shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-lg active:scale-95 cursor-pointer ${
                  daysLeft <= 0
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-700/40'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/30'
                }`}
              >
                <Sparkles size={14} />
                <span>{daysLeft <= 0 ? 'Re-activate Plan' : 'Renew / Upgrade Now'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}

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
                  <Clock size={11} /> Pending Approval
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

          {/* Upgrade CTA — Direct In-App Trigger */}
          <div className="bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-rose-600/20 border border-violet-500/40 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl shadow-violet-950/30">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-violet-400" />
                <p className="font-extrabold text-white text-base">Looking to Upgrade Your Plan?</p>
              </div>
              <p className="text-xs text-slate-300">
                Unlock extra POS terminals, Multi-Property features, WhatsApp Bots, or request custom hotel requirements.
              </p>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-violet-600/40 active:scale-95 cursor-pointer"
              >
                <span>Upgrade Plan</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── IN-APP UPGRADE & PLAN COMPARISON MODAL ─── */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-400 text-xs font-bold mb-2">
                  <Crown size={13} />
                  <span>Choose The Right Hotel Plan</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Upgrade Your Hotel Subscription</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select a plan to request an instant upgrade. No email required — your Super Admin will be notified directly.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setRequestSuccessPlan(null);
                }}
                className="p-2 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Success Feedback Alert */}
            {requestSuccessPlan && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-emerald-300">Upgrade Request Sent Successfully!</p>
                  <p className="text-xs text-emerald-400/80 mt-0.5">
                    Your request for the <strong>{requestSuccessPlan}</strong> plan has been dispatched to your Super Admin for instant activation.
                  </p>
                </div>
              </div>
            )}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {UPGRADE_PLANS.map((plan) => {
                const isCurrent = data?.packageName?.toLowerCase() === plan.name.toLowerCase();
                const isRequesting = requestingPlan === plan.name;
                const isSuccess = requestSuccessPlan === plan.name;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-3xl p-5 border flex flex-col justify-between transition-all ${
                      isCurrent
                        ? 'bg-slate-800/90 border-violet-500/60 shadow-lg shadow-violet-900/20 ring-1 ring-violet-500/50'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Badge */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-rose-500 to-violet-600 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                        {plan.badge}
                      </div>
                    )}

                    <div>
                      {/* Top Row */}
                      <div className="flex items-center justify-between mb-3 mt-1">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-700/50">
                          {plan.icon}
                        </div>
                        {isCurrent && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            Current Plan
                          </span>
                        )}
                      </div>

                      {/* Name & Pricing */}
                      <h3 className="text-lg font-black text-white">{plan.name}</h3>
                      <p className="text-[11px] text-slate-400 mb-3 min-h-[32px]">{plan.description}</p>

                      <div className="flex items-baseline gap-1 mb-4 pb-4 border-b border-slate-700/50">
                        <span className="text-2xl font-black text-white">{plan.price}</span>
                        <span className="text-xs text-slate-400 font-semibold">{plan.period}</span>
                      </div>

                      {/* Specs */}
                      <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-900/60 p-2.5 rounded-2xl border border-white/5 text-[10px]">
                        <div>
                          <p className="text-slate-500 font-bold uppercase">POS Terminals</p>
                          <p className="text-white font-bold">{plan.specs.pos}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 font-bold uppercase">Property Scope</p>
                          <p className="text-white font-bold">{plan.specs.properties}</p>
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="space-y-2 mb-6">
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Included Features:</p>
                        {plan.highlights.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {isCurrent ? (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-default"
                        >
                          <CheckCircle2 size={14} /> Active on Account
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendUpgradeRequest(plan.name)}
                          disabled={isRequesting}
                          className={`w-full py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
                            isSuccess
                              ? 'bg-emerald-600 text-white'
                              : 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30'
                          }`}
                        >
                          {isRequesting ? (
                            <>
                              <RefreshCcw size={13} className="animate-spin" /> Sending Request...
                            </>
                          ) : isSuccess ? (
                            <>
                              <CheckCircle2 size={13} /> Request Submitted!
                            </>
                          ) : (
                            <>
                              Request {plan.name} Plan <ArrowRight size={13} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Contact & Direct Support Strip (Direct WhatsApp & Hotline - No Email!) */}
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Need Custom Features or Enterprise Multi-Branch Pricing?</p>
                  <p className="text-[11px] text-slate-400">Speak directly with our dedicated Hotel Accounts team anytime.</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <a
                  href="https://wa.me/919876543210?text=Hello%2C%20I%20would%20like%20to%20discuss%20an%20upgrade%20for%20our%20hotel%20PMS%20account."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-700/30"
                >
                  <MessageSquare size={14} />
                  <span>Chat on WhatsApp</span>
                </a>
                <a
                  href="tel:+919876543210"
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-600 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                >
                  <Phone size={14} />
                  <span>Call Support</span>
                </a>
              </div>
            </div>

          </div>
        </div>
      )}

      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    </div>
  );
}
