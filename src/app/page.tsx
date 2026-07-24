'use client';

import React, { useRef, useEffect, useState } from 'react';
import { WebsiteHeader } from '@/components/website/Header';
import { PremiumFooter } from '@/components/website/PremiumFooter';
import { MaintenanceView } from '@/components/website/MaintenanceView';
import { VectorBackground } from '@/components/website/VectorBackground';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import {
  Utensils, Beer, Hotel, TrendingUp, Smartphone,
  ArrowRight, Sparkles, ChevronRight, Download,
  Monitor, QrCode, Apple, Globe, CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// ─── Brand palette (from logo) ─────────────────────────────────
const PINK = '#e8a0a0';
const PINK_LIGHT = '#f5c8c8';
const BG = '#120a08';
const BROWN_MID = '#3d1818';
const BROWN_SOFT = '#6b2f2f';
// ───────────────────────────────────────────────────────────────

const solutions = [
  {
    title: "Fine Dining",
    desc: "Table management, high-speed KOT, and guest tracking.",
    icon: <Utensils className="w-5 h-5" />,
    features: ["Visual Table Map", "Split Bill Support", "Ingredient Tracking"],
  },
  {
    title: "Bars & Pubs",
    desc: "Industry-leading peg-wise inventory and bottle management.",
    icon: <Beer className="w-5 h-5" />,
    features: ["Peg Tracking (30/60ml)", "Happy Hour Engine", "Bottle Weights"],
  },
];

const featuresList = [
  {
    tag: "Intelligence",
    title: "Real-time Analytics",
    desc: "Gain a competitive edge with deep insights into your revenue trends, peak hours, and staff performance. Our AI-driven engine forecasts inventory needs to eliminate wastage and maximize your margins.",
    img: "/images/guestflow-analytics.png",
  },
  {
    tag: "Efficiency",
    title: "Enterprise-Grade KDS",
    desc: "Eliminate kitchen chaos with our intelligent Kitchen Display System. Route orders instantly to specific stations, track preparation times, and ensure every dish is served at its peak quality.",
    img: "/images/guestflow-kds.png",
  },
];

const stats = [
  { value: "0.5s", label: "Order Sync" },
  { value: "Instant", label: "Cloud Hosted" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
];

// Shared style helpers
const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(12px)',
};
const primaryBtn: React.CSSProperties = {
  background: `linear-gradient(135deg, ${BROWN_SOFT}, ${BROWN_MID})`,
  boxShadow: `0 0 28px rgba(107,47,47,0.45), inset 0 1px 0 rgba(232,160,160,0.15)`,
  border: `1px solid rgba(232,160,160,0.18)`,
};

export default function HomePage() {
  const containerRef = useRef(null);
  const [settings, setSettings] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/website/settings');
        const json = await res.json();
        if (json.success) setSettings(json.data);
      } catch (err) {
        console.error("Failed to fetch settings", err);
      }
    };
    fetchSettings();
  }, []);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const springScroll = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroScale = useTransform(springScroll, [0, 0.2], [1, 0.98]);

  const appPlatforms = [
    {
      id: 'android',
      name: 'Android App',
      icon: <Smartphone className="w-5 h-5" style={{ color: PINK }} />,
      desc: 'Optimized for POS tablets & Handheld devices.',
      comingSoon: settings?.androidComingSoon ?? false,
      btnLabel: 'Download APK',
      link: '/downloads/guestflow.apk',
    },
    {
      id: 'windows',
      name: 'Windows App',
      icon: <Monitor className="w-5 h-5" style={{ color: '#93c5fd' }} />,
      desc: 'High-speed desktop administration & local KOT.',
      comingSoon: settings?.windowsComingSoon ?? true,
      btnLabel: 'Download EXE',
      link: '/downloads/guestflow.exe',
    },
    {
      id: 'mac',
      name: 'macOS App',
      icon: <Apple className="w-5 h-5" style={{ color: '#d1d5db' }} />,
      desc: 'Seamless desktop experience for Apple Silicon.',
      comingSoon: settings?.macComingSoon ?? true,
      btnLabel: 'Download DMG',
      link: '/downloads/guestflow.dmg',
    },
  ];

  if (mounted && settings?.maintenanceMode) {
    return (
      <MaintenanceView 
        hotelName={settings.hotelName} 
        logoUrl={settings.logoUrl} 
      />
    );
  }

  return (
    <main
      ref={containerRef}
      className="text-white overflow-x-hidden relative"
      style={{ background: BG, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Ambient glows */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full blur-[200px]"
          style={{ background: 'rgba(232,160,160,0.055)' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-[180px]"
          style={{ background: 'rgba(61,24,24,0.28)' }} />
      </div>

      <div className="relative z-10">
        <WebsiteHeader dark />

        {/* ══ HERO ══════════════════════════════════════════════ */}
        <motion.section
          style={{ scale: heroScale }}
          className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-14"
        >
          <div className="absolute inset-0 z-0">
            <Image src="/images/guestflow-hero.png" alt="Hero" fill className="object-cover" style={{ opacity: 0.14 }} priority />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${BG}99, ${BG}55, ${BG})` }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to right, ${BG}dd, transparent, ${BG}dd)` }} />
          </div>
          <VectorBackground />

          <div className="container mx-auto px-6 relative z-10 max-w-5xl">
            <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">

              {/* Left: copy */}
              <div className="flex-1 text-center lg:text-left">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>

                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                    style={{ background: 'rgba(232,160,160,0.09)', border: '1px solid rgba(232,160,160,0.18)' }}>
                    <Sparkles className="w-3 h-3" style={{ color: PINK }} />
                    <span className="font-semibold text-[10px] uppercase tracking-[0.25em]" style={{ color: PINK }}>
                      GuestFlow Ecosystem
                    </span>
                  </div>

                  <h1 className="font-black tracking-[-0.03em] leading-[1.05] mb-5"
                    style={{ fontSize: 'clamp(2.6rem, 6vw, 4.2rem)' }}>
                    <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>Elevate Your</motion.span>
                    <br />
                    <motion.span 
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: 0.5 }}
                      style={{
                        background: `linear-gradient(135deg, ${PINK} 0%, ${PINK_LIGHT} 50%, ${PINK} 100%)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}>
                      Business.
                    </motion.span>
                  </h1>

                  <p className="text-base leading-relaxed mb-8 max-w-md mx-auto lg:mx-0"
                    style={{ color: 'rgba(255,255,255,0.48)' }}>
                    Automate your{' '}
                    <span style={{ color: PINK_LIGHT, fontWeight: 600 }}>Restaurant, Bar, or Hotel</span>{' '}
                    with absolute precision and world-class intelligence.
                  </p>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-7">
                    <Link href="/contact" className="group px-8 py-3.5 rounded-2xl font-bold text-sm text-white flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                      style={primaryBtn}>
                      Get Started Free
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <button className="px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.75)' }}>
                      Watch Demo <ChevronRight className="w-4 h-4 opacity-40" />
                    </button>
                  </div>

                  <div className="flex items-center gap-5 justify-center lg:justify-start flex-wrap">
                    {["No credit card required", "14-day free trial", "Cancel anytime"].map(item => (
                      <div key={item} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#6ee7b7' }} />
                        <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right: phone */}
              <div className="relative flex-shrink-0">
                <motion.div
                  initial={{ opacity: 0, y: 24, rotate: 3 }}
                  animate={{ opacity: 1, y: 0, rotate: -2 }}
                  transition={{ duration: 1, delay: 0.2 }}>
                  <div className="absolute inset-0 scale-125 rounded-full blur-[60px]"
                    style={{ background: 'rgba(232,160,160,0.12)' }} />
                  <div className="relative w-[196px] h-[392px] rounded-[2.4rem] overflow-hidden z-10"
                    style={{ border: '1px solid rgba(255,255,255,0.1)', background: '#0f0606', boxShadow: '0 48px 96px rgba(0,0,0,0.6)' }}>
                    <Image src="/images/pos-mobile-1.png" alt="GuestFlow POS" fill className="object-cover" style={{ opacity: 0.8 }} />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 50%, rgba(0,0,0,0.18))' }} />
                    <div className="absolute bottom-6 left-0 right-0 text-center">
                      <div className="font-black text-sm italic tracking-tight text-white">GuestFlow POS</div>
                      <div className="text-[8px] font-bold uppercase tracking-[0.28em] mt-0.5" style={{ color: PINK }}>Live Terminal</div>
                    </div>
                    <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-16 h-3.5 bg-black rounded-full" />
                  </div>

                  {/* Floating revenue card */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                    className="absolute -right-16 top-14 px-4 py-3 rounded-2xl z-20"
                    style={{ background: 'rgba(18,10,8,0.92)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 32px rgba(0,0,0,0.4)' }}>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Today's Revenue</div>
                    <div className="font-black text-lg tracking-tight text-white">₹48,290</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <TrendingUp className="w-3 h-3" style={{ color: '#6ee7b7' }} />
                      <span className="text-[10px] font-bold" style={{ color: '#6ee7b7' }}>+12.4%</span>
                    </div>
                  </motion.div>

                  {/* Floating sync card */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
                    className="absolute -left-14 bottom-20 px-4 py-3 rounded-2xl z-20"
                    style={{ background: 'rgba(18,10,8,0.92)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 32px rgba(0,0,0,0.4)' }}>
                    <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Order Sync</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6ee7b7' }} />
                      <span className="font-bold text-sm text-white">0.5s</span>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ══ STATS BAR ══════════════════════════════════════════ */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.055)', borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="text-center py-4 px-4"
                  style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.055)' : 'none' }}>
                  <div className="text-xl font-black tracking-tight text-white mb-0.5">{s.value}</div>
                  <div className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.28)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ SOLUTIONS ══════════════════════════════════════════ */}
        <section className="py-16">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-10">
              <span className="font-bold text-[10px] uppercase tracking-[0.3em] block mb-2" style={{ color: PINK }}>Built for Every Venue</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
                One Platform, <span style={{ color: 'rgba(255,255,255,0.28)' }}>Any Format.</span>
              </h2>
              <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Fine dining, busy bars, or full hotels — GuestFlow adapts perfectly to your venue.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {solutions.map((sol, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -4, borderColor: 'rgba(232,160,160,0.18)' } as any}
                  className="group p-7 rounded-3xl transition-all duration-300"
                  style={card}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300"
                    style={{ background: 'rgba(232,160,160,0.12)', color: PINK }}>
                    {sol.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5 tracking-tight">{sol.title}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.38)' }}>{sol.desc}</p>
                  <ul className="space-y-2">
                    {sol.features.map(f => (
                      <li key={f} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: PINK }} />
                        <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: PINK }}>
                    Learn More <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ DOWNLOAD CENTER ════════════════════════════════════ */}
        <section id="download" className="py-16 relative">
          <div className="absolute inset-0" style={{ background: 'rgba(232,160,160,0.012)' }} />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(232,160,160,0.12), transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(to right, transparent, rgba(232,160,160,0.12), transparent)' }} />

          <div className="container mx-auto px-6 max-w-6xl relative z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5"
                style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <Globe className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
                <span className="font-bold text-[10px] uppercase tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.35)' }}>Universal Ecosystem</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
                Deploy GuestFlow <span style={{ color: 'rgba(255,255,255,0.28)' }}>Anywhere.</span>
              </h2>
              <p className="text-sm max-w-sm mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
                High-performance apps for every platform. One login, every device.
              </p>
            </div>

            {/* Showcase */}
            <div className="relative p-9 lg:p-12 rounded-[2rem] mb-8 overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.065)' }}>
              <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[90px] pointer-events-none"
                style={{ background: 'rgba(61,24,24,0.25)' }} />

              <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14 relative z-10">
                <div className="flex-1 text-center lg:text-left">
                  <span className="font-bold text-[9px] uppercase tracking-[0.35em] block mb-3" style={{ color: PINK }}>Mobile Terminal</span>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-4 leading-tight">
                    Instant <br /><span style={{ color: PINK }}>Deployment.</span>
                  </h3>
                  <p className="text-sm leading-relaxed mb-7 max-w-md" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    Empower your staff with the GuestFlow mobile ecosystem. Scan, install, and start serving in minutes. Zero configuration required.
                  </p>
                  <div className="flex flex-wrap gap-8 mb-10 justify-center lg:justify-start">
                    {[{ val: "0.5s", lbl: "Order Sync Speed" }, { val: "Instant", lbl: "Real-time Sync" }].map(s => (
                      <div key={s.lbl}>
                        <div className="text-2xl font-black text-white tracking-tight mb-0.5">{s.val}</div>
                        <div className="text-[10px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.lbl}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <button className="px-6 py-3 rounded-2xl font-bold text-xs transition-all hover:scale-105 active:scale-95 text-white"
                      style={primaryBtn}>
                      Download APK
                    </button>
                    <button className="px-6 py-3 rounded-2xl font-bold text-xs transition-all hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                      View Docs
                    </button>
                  </div>
                </div>

                {/* Phone Showcase - Layered Stack */}
                <div className="flex-shrink-0 relative mt-10 lg:mt-0">
                  <div className="absolute inset-0 scale-150 rounded-full blur-[100px] pointer-events-none" 
                    style={{ background: 'rgba(232,160,160,0.08)' }} />
                  
                  <div className="relative w-[280px] h-[400px] md:w-[320px] md:h-[480px]">
                    {/* Background Card 1 */}
                    <motion.div
                      initial={{ opacity: 0, x: 40, y: 20, rotate: 12 }}
                      whileInView={{ opacity: 1, x: 60, y: 30, rotate: 15 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 }}
                      className="absolute top-0 right-0 w-[180px] h-[360px] rounded-[2rem] overflow-hidden z-0 blur-[1px]"
                      style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0a0202', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                      <Image src="/images/pos-mobile-2.png" alt="POS App Mockup 2" fill className="object-cover opacity-60" />
                    </motion.div>

                    {/* Background Card 2 */}
                    <motion.div
                      initial={{ opacity: 0, x: -40, y: 10, rotate: -12 }}
                      whileInView={{ opacity: 1, x: -60, y: 20, rotate: -15 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.4 }}
                      className="absolute top-0 left-0 w-[180px] h-[360px] rounded-[2rem] overflow-hidden z-0 blur-[1px]"
                      style={{ border: '1px solid rgba(255,255,255,0.08)', background: '#0a0202', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
                      <Image src="/images/pos-mobile-3.png" alt="POS App Mockup 3" fill className="object-cover opacity-60" />
                    </motion.div>

                    {/* Main Card */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
                      className="relative w-full h-full rounded-[2.5rem] overflow-hidden z-10"
                      style={{ border: '1px solid rgba(255,255,255,0.12)', background: '#0a0202', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>
                      <Image src="/images/pos-mobile-1.png" alt="POS App Mockup 1" fill className="object-cover" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 40%)' }} />
                      <div className="absolute bottom-6 left-0 right-0 text-center">
                        <div className="font-black text-lg italic tracking-tight text-white">GuestFlow POS</div>
                        <div className="text-[9px] font-bold uppercase tracking-[0.3em] mt-1" style={{ color: PINK }}>Enterprise Terminal</div>
                      </div>
                      {/* Notch */}
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {appPlatforms.map((platform, i) => (
                <motion.div
                  key={platform.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={!platform.comingSoon ? { y: -3 } as any : {}}
                  className="p-6 rounded-3xl flex flex-col transition-all duration-300"
                  style={{ ...card, opacity: platform.comingSoon ? 0.55 : 1 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {platform.icon}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={!platform.comingSoon
                        ? { background: 'rgba(110,231,183,0.1)', color: '#6ee7b7', border: '1px solid rgba(110,231,183,0.18)' }
                        : { background: 'rgba(255,255,255,0.035)', color: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.065)' }}>
                      {!platform.comingSoon ? 'Available' : 'Coming Soon'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5 tracking-tight">{platform.name}</h3>
                  <p className="text-[11px] leading-relaxed mb-5 flex-1" style={{ color: 'rgba(255,255,255,0.32)' }}>{platform.desc}</p>

                  {platform.comingSoon ? (
                    <div className="w-full py-2.5 rounded-xl text-center font-bold text-[10px] uppercase tracking-widest cursor-not-allowed"
                      style={{ border: '1px solid rgba(255,255,255,0.055)', color: 'rgba(255,255,255,0.18)' }}>
                      Coming Soon
                    </div>
                  ) : (
                    <a href={platform.link} download
                      className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 text-white hover:opacity-90"
                      style={{ ...primaryBtn }}>
                      <Download className="w-3.5 h-3.5" />
                      {platform.btnLabel}
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES ═══════════════════════════════════════════ */}
        <section id="features" className="py-16">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-12">
              <span className="font-bold text-[10px] uppercase tracking-[0.3em] block mb-2" style={{ color: PINK }}>Powerful Features</span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                Everything You Need, <span style={{ color: 'rgba(255,255,255,0.28)' }}>Nothing You Don't.</span>
              </h2>
            </div>

            {featuresList.map((feat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col lg:flex-row items-center gap-12 mb-14 last:mb-0 ${index % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
              >
                <div className="flex-1">
                  <span className="font-bold tracking-[0.3em] uppercase text-[10px] block mb-3" style={{ color: PINK }}>{feat.tag}</span>
                  <h2 className="text-2xl md:text-3xl font-black mb-4 tracking-tight leading-tight text-white">{feat.title}</h2>
                  <p className="text-sm leading-relaxed mb-7 max-w-lg" style={{ color: 'rgba(255,255,255,0.38)' }}>{feat.desc}</p>
                  <div className="grid grid-cols-2 gap-4 mb-7">
                    {[{ val: "99.9%", lbl: "Accuracy" }, { val: "Instant", lbl: "Sync" }].map(m => (
                      <div key={m.lbl} className="p-4 rounded-2xl"
                        style={{ background: 'rgba(255,255,255,0.022)', border: `1px solid rgba(232,160,160,0.1)` }}>
                        <div className="text-xl font-black mb-1 tracking-tight" style={{ color: PINK }}>{m.val}</div>
                        <div className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: 'rgba(255,255,255,0.28)' }}>{m.lbl}</div>
                      </div>
                    ))}
                  </div>
                  <button className="group flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: PINK }}>
                    Explore Features
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </button>
                </div>

                <div className="flex-1 relative group">
                  <div className="absolute inset-0 rounded-3xl blur-[50px] opacity-0 group-hover:opacity-100 transition-all duration-700"
                    style={{ background: 'rgba(61,24,24,0.28)' }} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative rounded-3xl overflow-hidden z-10 p-1.5"
                    style={{ border: '1px solid rgba(255,255,255,0.065)', background: 'rgba(255,255,255,0.016)', boxShadow: '0 28px 56px rgba(0,0,0,0.38)' }}>
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
                      <Image src={feat.img} alt={feat.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ FINAL CTA ══════════════════════════════════════════ */}
        <section className="py-24 relative text-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <Image src="/images/guestflow-hero.png" alt="CTA" fill className="object-cover" style={{ opacity: 0.09 }} />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${BG}, ${BG}88, ${BG})` }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[440px] h-[260px] rounded-full blur-[90px]" style={{ background: 'rgba(61,24,24,0.38)' }} />
          </div>

          <div className="container mx-auto px-6 max-w-xl relative z-10">
            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <span className="font-bold text-[10px] uppercase tracking-[0.3em] block mb-5" style={{ color: PINK }}>Get Started Today</span>
              <h2 className="text-4xl md:text-5xl font-black leading-tight mb-5 tracking-tight">
                Ready to{' '}
                <span className="italic" style={{
                  background: `linear-gradient(135deg, ${PINK}, ${PINK_LIGHT})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Dominate?</span>
              </h2>
              <p className="text-base max-w-sm mx-auto mb-9 leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Join elite hospitality leaders using GuestFlow to drive exponential growth.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/contact" className="px-10 py-3.5 text-white rounded-2xl font-bold text-sm transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                  style={primaryBtn}>
                  Start Free Trial
                </Link>
                <button className="px-10 py-3.5 rounded-2xl font-bold text-sm transition-all hover:bg-white/8"
                  style={{ border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.62)' }}>
                  Talk to Sales
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <PremiumFooter />
      </div>
    </main>
  );
}