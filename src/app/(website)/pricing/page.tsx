'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Star, HelpCircle, Shield, Zap, Sparkles } from 'lucide-react';
import { WebsiteHeader } from '@/components/website/Header';
import { PremiumFooter } from '@/components/website/PremiumFooter';

const BG      = '#060a12';
const CARD    = '#0a1020';
const CARD2   = '#0d1525';
const CYAN    = '#00c8ff';
const CYAN2   = '#0099e6';
const CYAN_BD = 'rgba(0,200,255,0.2)';

const FEATURE_MAP: Record<string, string> = {
  HMS: 'Hotel Management System (HMS)',
  POS: 'Restaurant & Outlet POS',
  TABLES: 'Table & KOT Management',
  INVENTORY: 'Inventory & Stock Control',
  REPORTS: 'Revenue & Occupancy Reports',
  STAFF: 'Staff & Role Management',
  CRM: 'Guest CRM & Profile History',
  GST: 'GST Compliant Invoicing',
  ACCOUNTING: 'Accounting & Expense Tracking',
  WHATSAPP: 'WhatsApp Guest Notifications',
  BARPOS: 'Bar & Lounge POS',
  CAFEPOS: 'Cafe & Quick Service POS',
  B2B: 'B2B & Corporate Travel Portal',
  DRIVERS: 'Driver & Cab Dispatch',
  GEOFENCING: 'Geofencing Staff Attendance',
  PARKING: 'Valet & Parking Management',
  TABLETS: 'In-Room Guest Tablets',
  WALKIETALKIE: 'Digital Staff Walkie-Talkie',
  WASTE: 'Food Waste & Cost Control',
  WEBSITE: 'Custom Direct Booking Website',
};

const DEFAULT_PLANS = [
  {
    id: 'starter',
    name: 'Starter', priceINR: 0, discountPercent: 0, color: '#34d399',
    allowedPropertyCount: 1, allowedPosCount: 2,
    description: 'Perfect for small boutique hotels, homestays and single properties.',
    features: [{ feature: 'HMS' }, { feature: 'POS' }, { feature: 'GST' }, { feature: 'INVENTORY' }, { feature: 'REPORTS' }],
  },
  {
    id: 'pro',
    name: 'Professional', priceINR: 29999, discountPercent: 10, color: CYAN,
    allowedPropertyCount: 2, allowedPosCount: 5,
    description: 'Full-featured suite for growing hotels, resorts and restaurants.',
    features: [{ feature: 'HMS' }, { feature: 'POS' }, { feature: 'GST' }, { feature: 'ACCOUNTING' }, { feature: 'WHATSAPP' }, { feature: 'CRM' }, { feature: 'STAFF' }],
  },
  {
    id: 'enterprise',
    name: 'Enterprise', priceINR: 59999, discountPercent: 20, color: '#a78bfa',
    allowedPropertyCount: 10, allowedPosCount: 20,
    description: 'For large hotel chains, resorts and multi-property hospitality groups.',
    features: [{ feature: 'HMS' }, { feature: 'POS' }, { feature: 'GST' }, { feature: 'B2B' }, { feature: 'WALKIETALKIE' }, { feature: 'TABLETS' }, { feature: 'DRIVERS' }],
  },
];

const FAQS = [
  { q: 'Can I change or upgrade my plan later?', a: 'Yes, you can upgrade or downgrade your plan at any time from your billing dashboard. Upgrades take effect immediately.' },
  { q: 'Is there a free trial or free tier?', a: 'Yes! We offer a free Starter tier for single properties and a 14-day free trial on all paid plans. No credit card required.' },
  { q: 'Is GuestFlow GST compliant?', a: 'Absolutely. GuestFlow auto-calculates CGST/SGST/IGST, supports HSN/SAC codes, and generates government-compliant tax invoices.' },
  { q: 'How many staff users can I add?', a: 'All plans include unlimited staff accounts with customizable role-based permissions (Manager, Front Desk, Housekeeping, etc.).' },
  { q: 'What kind of support do you provide?', a: 'We provide email, chat and WhatsApp support across all plans, with dedicated priority account managers for Enterprise customers.' },
];

export default function PricingPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/website/packages')
      .then(r => r.json())
      .then(j => {
        if (j.success && Array.isArray(j.data) && j.data.length > 0) {
          const std = j.data.filter((p: any) => !p.name?.toLowerCase().startsWith('custom —'));
          setPackages(std.length > 0 ? std : j.data);
        }
      })
      .catch(() => {});
  }, []);

  const displayPlans = packages.length > 0 ? packages : DEFAULT_PLANS;

  return (
    <main style={{ background: BG, color: '#fff', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <WebsiteHeader dark />

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-10 overflow-hidden text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] rounded-full blur-[120px]"
            style={{ background: 'rgba(0,200,255,0.1)' }} />
          <div className="absolute inset-0 opacity-[0.025]" style={{
            backgroundImage: 'linear-gradient(rgba(0,200,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.5) 1px,transparent 1px)',
            backgroundSize: '64px 64px',
          }} />
        </div>
        <div className="container mx-auto px-6 max-w-3xl relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4 border"
            style={{ background: 'rgba(0,200,255,0.08)', borderColor: CYAN_BD, color: CYAN }}>
            Flexible & Transparent
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4">
            Simple, Transparent{' '}
            <span style={{ background: `linear-gradient(135deg,${CYAN},#a78bfa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Pricing
            </span>
          </h1>
          <p className="text-sm md:text-base max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
            Choose the right plan for your property. Start free and scale as your hospitality business grows.
          </p>
        </div>
      </section>

      {/* ══ PRICING CARDS ═════════════════════════════════════════ */}
      <section className="pb-14">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(displayPlans.length, 3)} gap-6 items-stretch`}>
            {displayPlans.map((pkg, i) => {
              const isPopular = pkg.discountPercent > 0 || i === 1;
              const priceText = pkg.priceINR === 0 ? 'Free' : `₹${Number(pkg.priceINR).toLocaleString('en-IN')}`;
              const tagText = pkg.discountPercent > 0
                ? `${pkg.discountPercent}% OFF`
                : (i === 1 ? 'Most Popular' : (pkg.allowedPropertyCount > 1 ? 'Multi-Property' : ''));
              const planColor = pkg.color || (i === 0 ? '#34d399' : (i === 1 ? CYAN : '#a78bfa'));

              const featureList = [
                pkg.allowedPropertyCount ? `${pkg.allowedPropertyCount} ${pkg.allowedPropertyCount > 1 ? 'Properties' : 'Property'}` : null,
                pkg.allowedPosCount ? `${pkg.allowedPosCount} POS ${pkg.allowedPosCount > 1 ? 'Terminals' : 'Terminal'}` : null,
                ...(pkg.features?.map((f: any) => FEATURE_MAP[f.feature] || f.feature) || []),
              ].filter(Boolean);

              return (
                <div key={pkg.id || i} className="relative flex flex-col">
                  {tagText && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-black whitespace-nowrap shadow-lg"
                        style={{ background: `linear-gradient(135deg,${CYAN2},${CYAN})` }}>
                        {tagText}
                      </span>
                    </div>
                  )}

                  <div className={`rounded-2xl border p-7 relative flex-1 flex flex-col transition-all duration-300 hover:-translate-y-1.5`}
                    style={{
                      background: isPopular ? `linear-gradient(160deg, rgba(0,200,255,0.08) 0%, ${CARD2} 100%)` : CARD2,
                      borderColor: isPopular ? CYAN : 'rgba(255,255,255,0.07)',
                      boxShadow: isPopular ? '0 0 35px rgba(0,200,255,0.12)' : 'none',
                    }}>
                    <div className="mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: planColor }}>
                        {pkg.name}
                      </span>
                    </div>

                    <div className="mb-2">
                      <span className="text-3xl md:text-4xl font-black text-white">{priceText}</span>
                      {pkg.priceINR > 0 && <span className="text-xs text-slate-500 ml-1.5">/ month</span>}
                    </div>

                    {pkg.description && (
                      <p className="text-xs text-slate-400 mb-5 leading-relaxed min-h-[36px]">
                        {pkg.description}
                      </p>
                    )}

                    <div className="h-px bg-white/[0.06] mb-5" />

                    <div className="space-y-3 mb-8 flex-1">
                      {featureList.map((f: any, j: number) => (
                        <div key={j} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: planColor }} />
                          <span className="text-xs text-slate-300 leading-snug">{f}</span>
                        </div>
                      ))}
                    </div>

                    <Link href={`/signup?packageId=${pkg.id || ''}`}
                      className="block text-center py-3 rounded-xl font-bold text-xs tracking-wider transition-all"
                      style={isPopular
                        ? { background: `linear-gradient(135deg,${CYAN2},${CYAN})`, color: '#000', boxShadow: '0 0 24px rgba(0,200,255,0.3)' }
                        : { border: `1px solid ${CYAN_BD}`, color: CYAN, background: 'rgba(0,200,255,0.06)' }
                      }>
                      {pkg.priceINR === 0 ? 'GET STARTED FREE' : 'START FREE TRIAL'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs mt-10" style={{ color: 'rgba(255,255,255,0.3)' }}>
            All plans include GST invoice generator, 99.9% uptime SLA, and free onboarding support.
          </p>
        </div>
      </section>

      {/* ══ FAQ SECTION ═══════════════════════════════════════════ */}
      <section className="py-20 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: CARD }}>
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#00c8ff] block mb-2">Got Questions?</span>
            <h2 className="text-2xl md:text-3xl font-black text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i}
                className="rounded-xl border transition-all cursor-pointer overflow-hidden"
                style={{ background: CARD2, borderColor: openFaq === i ? CYAN_BD : 'rgba(255,255,255,0.05)' }}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{faq.q}</span>
                  <span className="text-lg text-slate-400 ml-4">{openFaq === i ? '−' : '+'}</span>
                </div>
                {openFaq === i && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-400 leading-relaxed border-t border-white/[0.04]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-xs text-slate-500 mb-4">Have custom requirements for multi-chain hotel groups?</p>
            <Link href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-black text-xs font-bold transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg,${CYAN2},${CYAN})`, boxShadow: '0 0 25px rgba(0,200,255,0.3)' }}>
              Talk to Our Enterprise Team <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <PremiumFooter />
    </main>
  );
}
