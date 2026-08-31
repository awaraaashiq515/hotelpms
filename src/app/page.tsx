'use client';

import React, { useRef, useEffect, useState } from 'react';
import { WebsiteHeader } from '@/components/website/Header';
import { PremiumFooter } from '@/components/website/PremiumFooter';
import { MaintenanceView } from '@/components/website/MaintenanceView';
import Link from 'next/link';
import {
  ArrowRight, Star, CheckCircle2, ChevronRight,
  BarChart3, BedDouble, Receipt, Users, Bell,
  Calendar, Smartphone, ShieldCheck, Zap, Globe,
  TrendingUp, Clock, CreditCard, MessageSquare,
  Settings, FileText, LayoutDashboard, Utensils,
} from 'lucide-react';

/* ─── COLORS ─────────────────────────────────────────── */
const BG    = '#060a12';
const CARD  = '#0a1020';
const CARD2 = '#0d1525';
const CYAN  = '#00c8ff';
const CYAN2 = '#0099e6';
const CYAN_DIM = 'rgba(0,200,255,0.10)';
const CYAN_BD  = 'rgba(0,200,255,0.2)';
const GOLD  = '#f0c040';

/* ─── Counter ─────────────────────────────────────────── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let v = 0; const step = target / 60;
        const t = setInterval(() => {
          v += step;
          if (v >= target) { setCount(target); clearInterval(t); }
          else setCount(Math.floor(v));
        }, 16);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return <div ref={ref}>{count}{suffix}</div>;
}

/* ─── DATA ────────────────────────────────────────────── */
const FEATURES = [
  { icon: LayoutDashboard, label: 'Unified Dashboard',      desc: 'Manage all your properties from one powerful dashboard — bookings, staff, billing at a glance.',   col: '#00c8ff', bg: 'rgba(0,200,255,0.08)',   bd: 'rgba(0,200,255,0.2)' },
  { icon: BedDouble,        label: 'Room Management',        desc: 'Real-time room availability, housekeeping status, maintenance requests and occupancy tracking.',      col: '#a78bfa', bg: 'rgba(167,139,250,0.08)', bd: 'rgba(167,139,250,0.2)' },
  { icon: Calendar,         label: 'Smart Booking Engine',   desc: 'Manage reservations with drag-and-drop calendar, auto-confirmation and online booking integration.',  col: '#34d399', bg: 'rgba(52,211,153,0.08)',  bd: 'rgba(52,211,153,0.2)' },
  { icon: Receipt,          label: 'GST Billing & Invoices', desc: 'Auto-generate GST-compliant invoices, folios and receipts. Multiple payment modes supported.',      col: '#f472b6', bg: 'rgba(244,114,182,0.08)', bd: 'rgba(244,114,182,0.2)' },
  { icon: Users,            label: 'Staff & Role Management',desc: 'Assign roles to front desk, housekeeping, manager & more. Track attendance and performance.',        col: '#fb923c', bg: 'rgba(251,146,60,0.08)',  bd: 'rgba(251,146,60,0.2)' },
  { icon: BarChart3,        label: 'Revenue Analytics',      desc: 'Real-time revenue reports, occupancy rates, ADR & RevPAR metrics with beautiful charts.',           col: '#fbbf24', bg: 'rgba(251,191,36,0.08)',  bd: 'rgba(251,191,36,0.2)' },
  { icon: Utensils,         label: 'Restaurant POS',         desc: 'Integrated restaurant billing, table management, KOT printing and menu management.',                col: '#f43f5e', bg: 'rgba(244,63,94,0.08)',   bd: 'rgba(244,63,94,0.2)' },
  { icon: Smartphone,       label: 'Mobile App Access',      desc: 'Full access on mobile for managers. Housekeepers get their own app for room status updates.',       col: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  bd: 'rgba(56,189,248,0.2)' },
  { icon: ShieldCheck,      label: 'Secure & Reliable',      desc: '99.9% uptime SLA, data encryption, daily backups and role-based access control.',                   col: '#818cf8', bg: 'rgba(129,140,248,0.08)', bd: 'rgba(129,140,248,0.2)' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: Settings, title: 'Set Up Your Property', desc: 'Add your hotel details, room types, rates and configure your team in minutes. No technical skills needed.' },
  { step: '02', icon: Users,    title: 'Invite Your Team',     desc: 'Add staff with specific roles — front desk, housekeeping, manager. Each gets a tailored dashboard.' },
  { step: '03', icon: Zap,      title: 'Go Live Instantly',    desc: 'Start accepting bookings, manage check-ins and generate bills from day one. It\'s that simple.' },
];

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
    name: 'Starter', price: 'Free', priceINR: 0, tag: '', color: '#34d399',
    description: 'Perfect for small hotels & homestays.',
    features: ['1 Property', '2 POS Terminals', 'Hotel Management (HMS)', 'Restaurant POS', 'GST Invoicing', 'Inventory Management', 'Basic Reports'],
    cta: 'Get Started Free', link: '/signup',
  },
  {
    id: 'pro',
    name: 'Professional', price: '₹29,999', priceINR: 29999, tag: 'Most Popular', color: CYAN,
    description: 'Full-featured suite for growing hotels.',
    features: ['2 Properties', '5 POS Terminals', 'All Starter Features', 'GST & Accounting', 'WhatsApp Alerts', 'Guest CRM', 'Staff Management'],
    cta: 'Start Free Trial', link: '/signup',
  },
  {
    id: 'enterprise',
    name: 'Enterprise', price: '₹59,999', priceINR: 59999, tag: 'Multi-Property', color: '#a78bfa',
    description: 'For hotel chains & resort groups.',
    features: ['10 Properties', '20 POS Terminals', 'All Pro Features', 'B2B Portal', 'Walkie-Talkie', 'Tablets & Valet', 'Dedicated Manager'],
    cta: 'Contact Sales', link: '/contact',
  },
];

const TESTIMONIALS = [
  { name: 'Vikram Malhotra',  role: 'Owner, Malhotra Palace Hotel · 45 rooms · Delhi',     text: 'GuestFlow transformed our operations. Check-in time went from 10 mins to under 2 mins. Our staff loves it!',           stars: 5 },
  { name: 'Sunita Agarwal',   role: 'GM, Agarwal Grand Resort · 120 rooms · Jaipur',        text: 'The GST billing feature alone saved us 3 hours a day. Revenue analytics helped us increase RevPAR by 22% in 3 months.', stars: 5 },
  { name: 'Ravi Krishnaswamy',role: 'Director, KR Hospitality Group · 4 properties · Goa', text: 'Managing 4 hotels from one dashboard is a game changer. The multi-property support is exactly what we needed.',          stars: 5 },
];

const INTEGRATIONS = ['WhatsApp', 'OYO', 'MakeMyTrip', 'Goibibo', 'Booking.com', 'Paytm', 'Razorpay', 'Google Hotel'];

export default function HomePage() {
  const [settings, setSettings] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [maintenance, setMaint] = useState(false);
  const [ready, setReady]       = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetch('/api/website/settings').then(r => r.json()).then(j => {
      if (j.success) { setSettings(j.data); if (j.data?.maintenanceMode) setMaint(true); }
      setReady(true);
    }).catch(() => setReady(true));

    fetch('/api/website/packages').then(r => r.json()).then(j => {
      if (j.success && Array.isArray(j.data) && j.data.length > 0) {
        // filter out internal custom plans
        const std = j.data.filter((p: any) => !p.name?.toLowerCase().startsWith('custom —'));
        setPackages(std.length > 0 ? std : j.data);
      }
    }).catch(() => {});
  }, []);

  /* Star canvas */
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener('resize', resize);
    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.1 + 0.2, spd: Math.random() * 0.4 + 0.05,
      op: Math.random(), dir: Math.random() > 0.5 ? 1 : -1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.op += s.spd * 0.02 * s.dir;
        if (s.op > 1 || s.op < 0) s.dir *= -1;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,200,255,${s.op * 0.45})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  if (!ready) return null;
  if (maintenance) return <MaintenanceView hotelName={settings?.hotelName} logoUrl={settings?.logoUrl} />;

  const brandName = settings?.hotelName || 'GuestFlow';

  const glowBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '11px 26px', borderRadius: 12,
    background: `linear-gradient(135deg, ${CYAN2}, ${CYAN})`,
    color: '#000', fontWeight: 700, fontSize: 13, textDecoration: 'none',
    boxShadow: `0 0 28px rgba(0,200,255,0.35)`, transition: 'transform 0.2s',
  };
  const outlineBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '11px 22px', borderRadius: 12,
    border: '1px solid rgba(0,200,255,0.28)', color: CYAN,
    fontWeight: 700, fontSize: 13, textDecoration: 'none',
    background: 'rgba(0,200,255,0.06)', transition: 'all 0.2s',
  };

  return (
    <main style={{ background: BG, color: '#fff', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>
      <WebsiteHeader dark />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-24 pb-8">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
          <div style={{ position: 'absolute', top: '15%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,255,0.14) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', bottom: '20%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        </div>
        <div className="absolute inset-0" style={{ zIndex: 1, backgroundImage: 'linear-gradient(rgba(0,200,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,255,0.025) 1px,transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)' }} />

        <div className="relative z-10 container mx-auto px-6 max-w-5xl text-center pt-8 pb-4">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(0,200,255,0.08)', border: '1px solid rgba(0,200,255,0.2)', marginBottom: 18 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, boxShadow: `0 0 8px ${CYAN}`, display: 'inline-block' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: CYAN }}>Trusted by 500+ Hotels Across India</span>
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.7rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 14 }}>
            <span style={{ display: 'block', color: '#fff' }}>The All-in-One Hotel</span>
            <span style={{ display: 'block', marginTop: 4, background: `linear-gradient(135deg, ${CYAN} 0%, #60e0ff 40%, #a78bfa 80%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Management Platform
            </span>
          </h1>

          <p style={{ fontSize: 13, maxWidth: 500, margin: '0 auto 22px', lineHeight: 1.7, color: 'rgba(255,255,255,0.45)' }}>
            From front desk to back office — manage bookings, billing, housekeeping, restaurant POS and staff from one powerful dashboard. Built for Indian hotels of all sizes.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            <Link href="/signup" style={glowBtn}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              Start Free — No Credit Card <ArrowRight size={15} />
            </Link>
            <Link href="/features" style={outlineBtn}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,200,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,200,255,0.06)'; }}>
              See All Features
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ marginTop: 22, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {['✓ Free Forever Plan', '✓ GST Compliant', '✓ Easy Setup in 10 min', '✓ No Lock-in Contract'].map((t, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', padding: '3px 10px', borderRadius: 999 }}>{t}</span>
            ))}
          </div>

          {/* Star rating */}
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={13} style={{ fill: GOLD, color: GOLD }} />)}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.36)', marginLeft: 6 }}>4.8/5 rating · 500+ hotels · 10,000+ daily bookings managed</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section style={{ background: CARD, borderTop: '1px solid rgba(0,200,255,0.07)', borderBottom: '1px solid rgba(0,200,255,0.07)', padding: '24px 0' }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { target: 500,  suffix: '+',  label: 'Hotels Using GuestFlow' },
              { target: 10,   suffix: 'K+', label: 'Bookings Managed Daily' },
              { target: 98,   suffix: '%',  label: 'Customer Satisfaction' },
              { target: 99,   suffix: '.9%', label: 'Uptime Guarantee' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px 8px' }}>
                <div style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, color: CYAN, lineHeight: 1 }}>
                  <Counter target={s.target} suffix={s.suffix} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════ */}
      <section style={{ padding: '48px 0' }}>
        <div className="container mx-auto px-6 max-w-6xl">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: CYAN, display: 'block', marginBottom: 8 }}>Everything You Need</span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 10 }}>
              Powerful Features for{' '}
              <span style={{ background: `linear-gradient(135deg,${CYAN},#a78bfa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Modern Hotels</span>
            </h2>
            <p style={{ maxWidth: 440, margin: '0 auto', color: 'rgba(255,255,255,0.38)', fontSize: 13, lineHeight: 1.6 }}>
              One platform to manage your entire hotel operation — from booking to billing, housekeeping to analytics.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {FEATURES.map((feat, i) => (
              <div key={i}
                style={{ background: CARD2, border: `1px solid ${feat.bd}`, borderRadius: 16, padding: 18, transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 32px ${feat.bg}`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                <div style={{ position: 'absolute', top: 0, right: 0, width: 50, height: 50, borderRadius: '50%', background: feat.bg, filter: 'blur(16px)', pointerEvents: 'none' }} />
                <div style={{ width: 34, height: 34, borderRadius: 10, background: feat.bg, border: `1px solid ${feat.bd}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  <feat.icon size={16} style={{ color: feat.col }} strokeWidth={1.8} />
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{feat.label}</h3>
                <p style={{ fontSize: 11.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.38)' }}>{feat.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/features" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: CYAN, textDecoration: 'none' }}>
              View all features <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '48px 0', background: `linear-gradient(180deg, ${BG} 0%, ${CARD} 100%)` }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: CYAN, display: 'block', marginBottom: 8 }}>Simple Setup</span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>Get Up and Running in 3 Steps</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 36, left: '17%', right: '17%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,200,255,0.25), transparent)', pointerEvents: 'none' }} />
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '22px 18px', background: CARD2, border: `1px solid ${CYAN_BD}`, borderRadius: 16, position: 'relative', transition: 'all 0.3s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = CYAN_DIM; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = CARD2; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg,${CYAN2},${CYAN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: `0 0 16px rgba(0,200,255,0.3)` }}>
                  <step.icon size={18} style={{ color: '#000' }} strokeWidth={2.2} />
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 800, color: CYAN, letterSpacing: '0.15em', marginBottom: 6 }}>STEP {step.step}</div>
                <h3 style={{ fontSize: 13.5, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{step.title}</h3>
                <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PRICING PLANS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '48px 0' }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: CYAN, display: 'block', marginBottom: 8 }}>Pricing</span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Simple, Transparent Pricing</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 13 }}>Start free — upgrade as you grow. No hidden fees.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(packages.length > 0 ? packages.length : DEFAULT_PLANS.length, 3)}, 1fr)`, gap: 14 }}>
            {(packages.length > 0 ? packages.map((pkg, i) => {
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
                <div key={pkg.id || i} style={{ background: isPopular ? `linear-gradient(160deg, rgba(0,200,255,0.1) 0%, ${CARD2} 100%)` : CARD2, border: isPopular ? `1px solid ${CYAN}` : '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '24px 20px', position: 'relative', transition: 'all 0.3s', boxShadow: isPopular ? `0 0 35px rgba(0,200,255,0.12)` : 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                  {tagText && (
                    <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${CYAN2},${CYAN})`, color: '#000', fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', padding: '3px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                      {tagText}
                    </div>
                  )}
                  <div style={{ marginBottom: 3 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: planColor }}>{pkg.name}</span>
                  </div>
                  <div style={{ fontSize: 'clamp(1.3rem, 1.8vw, 1.6rem)', fontWeight: 900, color: '#fff', marginBottom: 2 }}>{priceText}</div>
                  {pkg.priceINR > 0 && <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>per month</div>}
                  {pkg.description && (
                    <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, marginBottom: 8 }}>{pkg.description}</p>
                  )}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
                    {featureList.slice(0, 7).map((f: any, j: number) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <CheckCircle2 size={12} style={{ color: planColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                      </div>
                    ))}
                    {featureList.length > 7 && (
                      <div style={{ fontSize: 10.5, color: CYAN, marginTop: 1, fontWeight: 600 }}>
                        + {featureList.length - 7} more features
                      </div>
                    )}
                  </div>
                  <Link href={`/signup?packageId=${pkg.id || ''}`} style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 10, background: isPopular ? `linear-gradient(135deg,${CYAN2},${CYAN})` : 'rgba(255,255,255,0.06)', border: isPopular ? 'none' : '1px solid rgba(255,255,255,0.1)', color: isPopular ? '#000' : 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 11.5, textDecoration: 'none', transition: 'all 0.2s', letterSpacing: '0.04em' }}
                    onMouseEnter={e => { if (!isPopular) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={e => { if (!isPopular) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'; }}>
                    {pkg.priceINR === 0 ? 'Get Started Free' : 'Start Free Trial'}
                  </Link>
                </div>
              );
            }) : DEFAULT_PLANS.map((plan, i) => {
              const isPopular = i === 1;
              return (
                <div key={i} style={{ background: isPopular ? `linear-gradient(160deg, rgba(0,200,255,0.1) 0%, ${CARD2} 100%)` : CARD2, border: isPopular ? `1px solid ${CYAN}` : '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '24px 20px', position: 'relative', transition: 'all 0.3s', boxShadow: isPopular ? `0 0 35px rgba(0,200,255,0.12)` : 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}>
                  {plan.tag && (
                    <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${CYAN2},${CYAN})`, color: '#000', fontSize: 8.5, fontWeight: 800, letterSpacing: '0.1em', padding: '3px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                      {plan.tag}
                    </div>
                  )}
                  <div style={{ marginBottom: 3 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: plan.color }}>{plan.name}</span>
                  </div>
                  <div style={{ fontSize: 'clamp(1.3rem, 1.8vw, 1.6rem)', fontWeight: 900, color: '#fff', marginBottom: 2 }}>{plan.price}</div>
                  {plan.price !== 'Free' && plan.price !== 'Custom' && <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>per month</div>}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
                    {plan.features.map((f, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <CheckCircle2 size={12} style={{ color: plan.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.58)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <Link href={plan.link} style={{ display: 'block', textAlign: 'center', padding: '9px 0', borderRadius: 10, background: isPopular ? `linear-gradient(135deg,${CYAN2},${CYAN})` : 'rgba(255,255,255,0.06)', border: isPopular ? 'none' : '1px solid rgba(255,255,255,0.1)', color: isPopular ? '#000' : 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 11.5, textDecoration: 'none', transition: 'all 0.2s', letterSpacing: '0.04em' }}
                    onMouseEnter={e => { if (!isPopular) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.1)'; }}
                    onMouseLeave={e => { if (!isPopular) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'; }}>
                    {plan.cta}
                  </Link>
                </div>
              );
            }))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 11.5, color: 'rgba(255,255,255,0.28)' }}>All plans include free setup support · Cancel anytime</p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '48px 0', background: `linear-gradient(180deg, ${BG} 0%, ${CARD} 100%)` }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: CYAN, display: 'block', marginBottom: 8 }}>Customer Stories</span>
            <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 8 }}>Loved by Hotel Owners Across India</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={13} style={{ fill: GOLD, color: GOLD }} />)}
              <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.36)', marginLeft: 6 }}>4.8 average from 500+ hotels</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: CARD2, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, padding: '18px 16px', transition: 'all 0.3s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = CYAN_BD; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 30px rgba(0,200,255,0.06)`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                  {[...Array(t.stars)].map((_, j) => <Star key={j} size={11} style={{ fill: GOLD, color: GOLD }} />)}
                </div>
                <p style={{ fontSize: 11.5, lineHeight: 1.7, color: 'rgba(255,255,255,0.52)', marginBottom: 12, fontStyle: 'italic' }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(0,200,255,0.6)', marginTop: 2 }}>{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY CHOOSE US
      ══════════════════════════════════════════ */}
      <section style={{ padding: '48px 0' }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: CYAN, display: 'block', marginBottom: 8 }}>Why GuestFlow</span>
              <h2 style={{ fontSize: 'clamp(1.3rem, 2.2vw, 1.8rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12, lineHeight: 1.2 }}>
                Built for{' '}
                <span style={{ background: `linear-gradient(135deg,${CYAN},#a78bfa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Indian Hotels</span>
              </h2>
              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, marginBottom: 18 }}>
                Most hotel software is expensive, complex or built for international markets. GuestFlow is designed from the ground up for Indian hospitality — affordable, GST-ready and easy to use.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/signup" style={glowBtn}>Start Free Trial <ArrowRight size={14} /></Link>
                <Link href="/contact" style={outlineBtn}>Talk to Sales</Link>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'GST-compliant billing — auto-fill GSTIN, HSN codes',
                'Multi-property management from one account',
                'Works on any device — desktop, tablet, mobile',
                'OTA channel manager integration (MakeMyTrip, OYO)',
                'Housekeeping & maintenance workflow automation',
                'WhatsApp notifications for guests & staff',
                'Offline mode — works even without internet',
                'Free onboarding and 24/7 customer support',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: CARD2, border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,200,255,0.18)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,200,255,0.04)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLDivElement).style.background = CARD2; }}>
                  <CheckCircle2 size={13} style={{ color: CYAN, flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.58)', fontWeight: 500 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          INTEGRATIONS
      ══════════════════════════════════════════ */}
      <section style={{ padding: '32px 0', background: CARD, borderTop: '1px solid rgba(0,200,255,0.06)', borderBottom: '1px solid rgba(0,200,255,0.06)' }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <p style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: 16 }}>Integrates With Your Favourite Platforms</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
            {INTEGRATIONS.map((name, i) => (
              <div key={i} style={{ padding: '6px 14px', background: CARD2, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', transition: 'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = CYAN_BD; (e.currentTarget as HTMLDivElement).style.color = CYAN; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.color = 'rgba(255,255,255,0.45)'; }}>
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MOBILE APP — COMING SOON
      ══════════════════════════════════════════ */}
      <section style={{ padding: '48px 0', position: 'relative', overflow: 'hidden' }}>
        {/* BG glow */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '50%', left: '30%', transform: 'translate(-50%,-50%)', width: 400, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,255,0.07) 0%, transparent 70%)', filter: 'blur(50px)' }} />
          <div style={{ position: 'absolute', top: '40%', right: '15%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', filter: 'blur(35px)' }} />
        </div>

        <div className="container mx-auto px-6 max-w-5xl" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>

            {/* Left — Text */}
            <div>
              {/* Coming Soon badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.25)', marginBottom: 14 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px #a78bfa', display: 'inline-block' }} />
                <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a78bfa' }}>Coming Soon</span>
              </div>

              <h2 style={{ fontSize: 'clamp(1.3rem, 2.2vw, 1.8rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10 }}>
                GuestFlow{' '}
                <span style={{ background: 'linear-gradient(135deg,#a78bfa,#00c8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Mobile App</span>
              </h2>

              <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, marginBottom: 18, maxWidth: 360 }}>
                Manage your hotel from anywhere — check-in guests, assign housekeeping tasks, view live revenue and handle requests right from your phone.
              </p>

              {/* Feature list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 20 }}>
                {[
                  '📊 Live dashboard & revenue at a glance',
                  '🛎 Instant guest check-in & check-out',
                  '🧹 Assign & track housekeeping tasks',
                  '📦 Inventory & room status in real time',
                  '🔔 Push notifications for new bookings',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)' }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Store buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { store: 'App Store', icon: '🍎', sub: 'iOS App — Coming Soon' },
                  { store: 'Play Store', icon: '▶', sub: 'Android App — Coming Soon' },
                ].map((btn, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: CARD2, border: '1px solid rgba(255,255,255,0.08)', opacity: 0.7, cursor: 'default' }}>
                    <span style={{ fontSize: 18 }}>{btn.icon}</span>
                    <div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Download on</div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff' }}>{btn.store}</div>
                      <div style={{ fontSize: 8.5, color: '#a78bfa', fontWeight: 600 }}>{btn.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.28)', marginTop: 12 }}>
                🔔 Sign up now to get notified when the app launches
              </p>
            </div>

            {/* Right — Phone mockup */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,255,0.15) 0%, transparent 70%)', filter: 'blur(25px)', pointerEvents: 'none' }} />

                {/* Phone frame */}
                <div style={{ width: 195, height: 380, borderRadius: 30, background: '#0a1020', border: '2px solid rgba(0,200,255,0.25)', position: 'relative', overflow: 'hidden', boxShadow: '0 0 40px rgba(0,200,255,0.12), 0 30px 60px rgba(0,0,0,0.5)' }}>
                  <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 65, height: 16, background: '#060a12', borderRadius: 8, zIndex: 2 }} />

                  <div style={{ padding: '36px 14px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div>
                        <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.35)' }}>Good morning 👋</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>Dashboard</div>
                      </div>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: CYAN_DIM, border: `1px solid ${CYAN_BD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>🔔</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {[
                        { label: 'Occupied', val: '24/30', col: CYAN },
                        { label: 'Revenue', val: '₹48K', col: '#a78bfa' },
                        { label: 'Check-ins', val: '6', col: '#34d399' },
                        { label: 'Pending', val: '3', col: '#fbbf24' },
                      ].map((s, i) => (
                        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 8px' }}>
                          <div style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.35)', marginBottom: 2, textTransform: 'uppercase' }}>{s.label}</div>
                          <div style={{ fontSize: 11.5, fontWeight: 800, color: s.col }}>{s.val}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 8px' }}>
                      <div style={{ fontSize: 7, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Today&apos;s Check-ins</div>
                      {['Room 101 — Sharma', 'Room 203 — Patel', 'Room 310 — Kumar'].map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: CYAN, flexShrink: 0 }} />
                          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>{r}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to top, #0a1020 60%, transparent)`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 10 }}>
                      <div style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 999, padding: '4px 12px', fontSize: 8.5, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.12em' }}>
                        COMING SOON
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════ */}
      <section style={{ padding: '52px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,255,0.1) 0%, transparent 70%)', filter: 'blur(45px)' }} />
        </div>
        <div className="container mx-auto px-6 max-w-lg" style={{ position: 'relative', zIndex: 1 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: CYAN, display: 'block', marginBottom: 8 }}>Ready to Get Started?</span>
          <h2 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 10 }}>
            Start Managing Your Hotel{' '}
            <span style={{ background: `linear-gradient(135deg,${CYAN},#a78bfa)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Smarter Today</span>
          </h2>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.38)', maxWidth: 360, margin: '0 auto 20px', lineHeight: 1.6 }}>
            Join 500+ hotels already using GuestFlow. Setup in 10 minutes. No credit card required.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
            <Link href="/signup" style={glowBtn}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
              Create Free Account <ArrowRight size={15} />
            </Link>
            <Link href="/contact" style={outlineBtn}>Book a Demo</Link>
          </div>
        </div>
      </section>

      <PremiumFooter />
    </main>
  );
}
