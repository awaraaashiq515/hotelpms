'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  ArrowLeft,
  Send,
  CheckCircle2,
  Zap,
  Phone,
  Mail,
  MessageSquare,
  Star,
  ShoppingCart,
  Package,
  BarChart,
  Users,
  Globe,
  Wifi,
  MapPin,
  Heart,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';

const FEATURE_META: Record<string, {
  label: string;
  icon: string;
  description: string;
  benefits: string[];
  color: string;
}> = {
  BARPOS: {
    label: 'Bar POS',
    icon: '🍺',
    description: 'A dedicated bar-mode billing terminal with liquor menus, bar-specific KOTs, and a live bar display for bartenders.',
    benefits: [
      'Bar-specific billing terminal',
      'Liquor item categories & menus',
      'Bar KOT & bar display screen',
      'Quick liquor order workflow',
      'Bar revenue reporting',
    ],
    color: 'from-amber-500 to-orange-600',
  },
  CAFEPOS: {
    label: 'Cafe POS',
    icon: '☕',
    description: 'A streamlined cafe billing terminal with quick-order workflows, cafe display settings and cafe-specific order categories.',
    benefits: [
      'Cafe-mode quick billing terminal',
      'Cafe order flow display',
      'Cafe-specific item categories',
      'Counter & takeaway quick bills',
      'Cafe performance analytics',
    ],
    color: 'from-brown-500 to-amber-700',
  },
  PARKING: {
    label: 'Parking Management',
    icon: '🅿️',
    description: 'Configure multi-zone parking areas, manage valet tokens, track vehicle entry/exit and generate daily parking revenue reports.',
    benefits: [
      'Multi-zone parking floor plans',
      'Digital valet token system',
      'Vehicle entry/exit tracking',
      'Parking revenue analytics',
      'QR-based customer notifications',
    ],
    color: 'from-blue-500 to-indigo-600',
  },
  WASTE: {
    label: 'Waste Management',
    icon: '🗑️',
    description: 'Log and audit kitchen waste, set item-level waste budgets, track waste reasons and generate food cost analysis reports.',
    benefits: [
      'Item-wise waste logging',
      'Waste reason categorization',
      'Daily waste budget limits',
      'Food cost impact analysis',
      'Chef & manager accountability',
    ],
    color: 'from-emerald-500 to-teal-600',
  },
  WHATSAPP: {
    label: 'WhatsApp Bot & Alerts',
    icon: '💬',
    description: 'Send automated bills and order confirmations on WhatsApp, enable conversational chatbot ordering for your customers.',
    benefits: [
      'Auto bill sharing on WhatsApp',
      'Conversational chatbot ordering',
      'Reservation confirmations',
      'Staff alert broadcasts',
      'Marketing campaign support',
    ],
    color: 'from-green-500 to-emerald-600',
  },
  WALKIETALKIE: {
    label: 'Staff Walkie-Talkie',
    icon: '📡',
    description: 'Real-time push-to-talk voice channels for your staff, custom team groups and integration with the mobile staff portal.',
    benefits: [
      'Instant push-to-talk voice',
      'Custom channel groups',
      'Manager broadcast mode',
      'Mobile staff portal login',
      'Message history & logs',
    ],
    color: 'from-violet-500 to-purple-600',
  },
  GEOFENCING: {
    label: 'Geofenced Attendance',
    icon: '📍',
    description: 'Enforce GPS-verified clock-ins and clock-outs. Audits staff attendance against pre-configured location boundaries.',
    benefits: [
      'GPS-verified clock-in/out',
      'Custom geofence zones',
      'Late & absent auto-marking',
      'Location audit trail',
      'Shift reports & payroll export',
    ],
    color: 'from-rose-500 to-red-600',
  },
  TIPS: {
    label: 'Counter Tips & Gratuity',
    icon: '💵',
    description: 'Accept and track customer tips at checkout, allocate tips to staff and generate end-of-day gratuity summaries.',
    benefits: [
      'Tip input at billing screen',
      'Waiter-wise tip allocation',
      'Daily tip summary reports',
      'Custom tip percentage options',
      'Payroll integration support',
    ],
    color: 'from-amber-500 to-orange-600',
  },
  HMS: {
    label: 'Hotel Management',
    icon: '🏨',
    description: 'Full hotel operations — room folios, guest check-ins, occupancy maps and housekeeping management.',
    benefits: [
      'Room folio management',
      'Guest check-in / check-out',
      'Interactive occupancy map',
      'Housekeeping task boards',
      'Room service order linking',
    ],
    color: 'from-sky-500 to-blue-600',
  },
  INVENTORY: {
    label: 'Inventory Control',
    icon: '📦',
    description: 'Real-time stock tracking, recipe mapping, supplier management and low-stock alert automation.',
    benefits: [
      'Real-time stock tracking',
      'Recipe ingredient mapping',
      'Supplier & PO management',
      'Low-stock alerts',
      'Consumption vs purchase reports',
    ],
    color: 'from-orange-500 to-amber-600',
  },
  ACCOUNTING: {
    label: 'Financial Accounting',
    icon: '💰',
    description: 'Full-featured accounting with vouchers, ledger books, expense tracking and automated day books.',
    benefits: [
      'Voucher entry system',
      'Ledger & cash books',
      'Automated day book',
      'Expense categorization',
      'Bank reconciliation',
    ],
    color: 'from-yellow-500 to-orange-500',
  },
  B2B: {
    label: 'B2B Marketplace',
    icon: '🚛',
    description: 'Browse bulk suppliers, raise purchase orders and manage vendor relationships in a single marketplace.',
    benefits: [
      'Supplier marketplace browsing',
      'Digital purchase orders',
      'Vendor relationship tracking',
      'Order status notifications',
      'Pricing & quotation tools',
    ],
    color: 'from-indigo-500 to-violet-600',
  },
  REPORTS: {
    label: 'Reports & Analytics',
    icon: '📊',
    description: 'Comprehensive sales reports, tax registers, settlement summaries and business performance analytics.',
    benefits: [
      'Daily sales summaries',
      'Tax register & GSTR support',
      'Settlement & shift reports',
      'Multi-outlet comparisons',
      'Export to PDF & Excel',
    ],
    color: 'from-cyan-500 to-blue-600',
  },
};

const DEFAULT_META = {
  label: 'Premium Feature',
  icon: '⚡',
  description: 'This is a premium feature that is not included in your current subscription plan.',
  benefits: [
    'Advanced functionality',
    'Priority support',
    'Regular updates',
    'Dedicated onboarding',
    'Custom configurations',
  ],
  color: 'from-slate-500 to-slate-700',
};

function FeatureLockedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || '';
  const fromPath = searchParams.get('from') || '';

  const meta = FEATURE_META[feature] || DEFAULT_META;

  const [session, setSession] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', preferredContact: 'WHATSAPP' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setSession(d.user);
          setForm(f => ({
            ...f,
            name: d.user.fullName || '',
            email: d.user.email || '',
            phone: d.user.phone || '',
            message: `I would like to upgrade my plan to include the ${meta.label} feature. Please contact me to discuss upgrade options.`,
          }));
        }
      })
      .catch(() => {});
  }, [meta.label]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.phone) {
      setError('Please fill in your name and phone number.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          featureKey: feature,
          featureLabel: meta.label,
          organizationName: session?.organizationName || '',
          currentPlan: session?.packageName || 'Unknown',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 size={48} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">Request Sent! 🎉</h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              Our team has received your upgrade request for <strong className="text-emerald-400">{meta.label}</strong>. We will contact you within <strong className="text-white">24 hours</strong> to discuss your upgrade.
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">What happens next?</p>
            <div className="space-y-2">
              {['Our support team reviews your request', 'We call/WhatsApp you with upgrade pricing', 'Plan is activated instantly after payment'].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-[11px] text-slate-400 font-medium">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => router.back()}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/8 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-[11px] font-black uppercase tracking-widest transition-colors mb-8 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Go Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* LEFT: Feature Info */}
          <div className="space-y-6">
            {/* Feature Icon + Lock */}
            <div className="relative inline-flex">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-4xl shadow-2xl`}>
                {meta.icon}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-800 border-2 border-slate-700 rounded-full flex items-center justify-center">
                <Lock size={14} className="text-slate-400" />
              </div>
            </div>

            {/* Heading */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em] bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                  Not in your plan
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-tight">
                {meta.label}
                <br />
                <span className="text-slate-500 font-light text-2xl normal-case">is locked</span>
              </h1>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-md">
                {meta.description}
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Star size={12} className="text-amber-400" />
                What you unlock with this feature
              </p>
              <div className="space-y-2.5">
                {meta.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${meta.color} shrink-0`} />
                    <span className="text-[12px] text-slate-300 font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Plan Info */}
            {session?.packageName && (
              <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                <Package size={18} className="text-slate-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your Current Plan</p>
                  <p className="text-sm font-black text-white uppercase mt-0.5">{session.packageName}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-[9px] font-black px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full uppercase tracking-widest">
                    Active
                  </span>
                </div>
              </div>
            )}

            {/* Contact Alternatives */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Or contact us directly</p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="tel:+918679800074"
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-[11px] font-bold text-slate-300 transition-all border border-slate-700 hover:border-slate-600"
                >
                  <Phone size={13} className="text-emerald-400" /> +91 86798 00074
                </a>
                <a
                  href="https://wa.me/918679800074"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 rounded-xl text-[11px] font-bold text-[#25D366] transition-all border border-[#25D366]/20"
                >
                  <MessageSquare size={13} /> WhatsApp Us
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT: Upgrade Request Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap size={16} className="text-amber-400" />
                <h2 className="text-lg font-black uppercase tracking-tight">Request an Upgrade</h2>
              </div>
              <p className="text-slate-400 text-[12px]">
                Fill the form below and our team will contact you within 24 hours to activate <strong className="text-white">{meta.label}</strong> on your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Phone / WhatsApp *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all"
                />
              </div>

              {/* Preferred Contact */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Preferred Contact Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'WHATSAPP', label: 'WhatsApp', icon: <MessageSquare size={12} /> },
                    { value: 'CALL', label: 'Phone Call', icon: <Phone size={12} /> },
                    { value: 'EMAIL', label: 'Email', icon: <Mail size={12} /> },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, preferredContact: opt.value }))}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        form.preferredContact === opt.value
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-[11px] font-bold">
                  <AlertTriangle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {submitting ? (
                  <><Loader2 size={14} className="animate-spin" /> Sending Request...</>
                ) : (
                  <><Send size={14} /> Send Upgrade Request</>
                )}
              </button>

              <p className="text-center text-[10px] text-slate-600 font-medium">
                🔒 Your information is 100% confidential and never shared.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeatureLockedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <FeatureLockedContent />
    </Suspense>
  );
}
