'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { WebsiteHeader } from '@/components/website/Header';
import { PremiumFooter } from '@/components/website/PremiumFooter';
import { MaintenanceView } from '@/components/website/MaintenanceView';
import {
  Sparkles,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  TrendingUp,
  BarChart3,
  Smartphone,
  Monitor,
  Apple,
  Download,
  Building2,
  Utensils,
  Wine,
  ChefHat,
  Bell,
  Star,
  Clock,
  Layers,
  Users,
  CreditCard,
  Bed,
  Calendar,
  Radio,
  Receipt,
  FileSpreadsheet,
  Headphones,
  Check,
  Plus,
  Minus,
  Laptop,
  Play
} from 'lucide-react';

const CYAN = '#00c8ff';
const CYAN2 = '#0099e6';
const CYAN_GLOW = 'rgba(0, 200, 255, 0.15)';
const BG_DARK = '#060a12';
const CARD_BG = '#0a1020';
const CARD_BORDER = 'rgba(255, 255, 255, 0.08)';

export default function WebsiteHomePage() {
  const [activeTab, setActiveTab] = useState<'hotel' | 'restaurant' | 'bar' | 'cloud'>('hotel');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/website/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setSettings(json.data);
      })
      .catch(() => {});
  }, []);

  if (mounted && settings?.maintenanceMode) {
    return (
      <MaintenanceView
        hotelName={settings.hotelName}
        logoUrl={settings.logoUrl}
      />
    );
  }

  const hotelName = settings?.hotelName || 'GuestFlow';
  const tagline = settings?.tagline || 'Next-Generation Hotel & Restaurant Management OS';

  const industryTabs = [
    {
      id: 'hotel',
      label: 'Hotel & Resort PMS',
      icon: <Bed className="w-4 h-4" />,
      tag: 'Complete Front-Desk & Room Operations',
      title: 'Smart Hotel PMS with Visual Room Grid & Instant Folio Billing',
      desc: 'Seamlessly coordinate bookings across OTAs, front desk check-ins, guest folios, housekeeping assignments, and automated night audits from one intuitive master console.',
      image: '/images/website/hotel-pms-suite.jpg',
      badge: 'Boutique & Luxury Resorts',
      highlights: [
        'Drag-and-drop live room calendar & quick room shifts',
        'Instant guest check-in with digital ID verification',
        'Housekeeping live status (Dirty, Clean, In-Progress, Inspected)',
        'Multi-folio billing & automated daily night audit reconciliation',
      ],
      statVal: '99.8%',
      statLabel: 'Occupancy Accuracy',
    },
    {
      id: 'restaurant',
      label: 'Fine Dining & POS',
      icon: <Utensils className="w-4 h-4" />,
      tag: 'High-Speed Restaurant Billing & Steward App',
      title: 'Lightning-Fast Table POS with Smart KOT & Split Billing',
      desc: 'Supercharge your dining room operations. Captains take orders table-side on tablets, orders instantly beam to kitchen stations, and bills split effortlessly with multi-mode payments.',
      image: '/images/website/restaurant-pos-live.jpg',
      badge: 'Dine-In & Casual Restaurants',
      highlights: [
        'Visual floor plan with real-time occupied/vacant table timers',
        'Direct steward ordering app with instant kitchen printer & KDS sync',
        'Split bills by item, percentage, or covers with 1-click discount presets',
        'Full GST compliance, QR code UPI invoices, and WhatsApp receipts',
      ],
      statVal: '0.2s',
      statLabel: 'KOT Transmission Speed',
    },
    {
      id: 'bar',
      label: 'Bar & Lounge',
      icon: <Wine className="w-4 h-4" />,
      tag: 'Liquor Precision & Peg-Wise Inventory',
      title: 'Industry-Leading Peg-Wise Liquor Control & Bottle Tracking',
      desc: 'Eliminate bar inventory shrinkage. Track 30ml, 60ml, 90ml pours automatically against master bottle weights with scheduled happy hours and bartender quick-punching.',
      image: '/images/website/bar-liquor-pos.jpg',
      badge: 'Pubs, Nightclubs & Lounges',
      highlights: [
        'Automated peg-to-bottle stock depletion & recipe cocktail costing',
        'Real-time happy hour pricing scheduler and VIP discount manager',
        'Fast bartender touch layout optimized for low-light environments',
        'Loss prevention alerts for bottle transfers and wastage tracking',
      ],
      statVal: '100%',
      statLabel: 'Liquor Stock Reconciliation',
    },
    {
      id: 'cloud',
      label: 'Room Service & Cloud Dining',
      icon: <ChefHat className="w-4 h-4" />,
      tag: 'Contactless Dining & Fast In-Room Service',
      title: 'QR Code Digital Menus & Rapid Room Delivery Dispatch',
      desc: 'Guests scan an in-room QR code to browse high-definition food menus, place orders directly to the hotel kitchen, and charge bills automatically to their room folio.',
      image: '/images/website/kds-kitchen-screen.jpg',
      badge: 'In-Room Dining & Cloud Kitchens',
      highlights: [
        'Branded digital guest portal requiring zero app installation',
        'Direct charge to guest room folio or instant online UPI payment',
        'Delivery rider dispatch with live GPS and status notifications',
        'Combo upselling engine to increase average room guest spend',
      ],
      statVal: '+34%',
      statLabel: 'Higher Guest In-Room Spend',
    },
  ];

  const currentTab = industryTabs.find((t) => t.id === activeTab) || industryTabs[0];

  const appPlatforms = [
    {
      id: 'android',
      name: 'Android POS & Tablet',
      icon: <Smartphone className="w-6 h-6 text-sky-400" />,
      desc: 'Optimized for Handheld POS, Sunmi terminals, and Waiter Tablets.',
      badge: 'Recommended for Staff',
      btnLabel: 'Download APK',
      link: '/downloads/ordermint.apk',
      version: 'v4.2.0 • Android 8+',
    },
    {
      id: 'windows',
      name: 'Windows Desktop Admin',
      icon: <Monitor className="w-6 h-6 text-emerald-400" />,
      desc: 'High-speed desktop administration, thermal printer spooling & local KOT.',
      badge: 'Front Desk & Cashier',
      btnLabel: 'Download EXE',
      link: '/downloads/ordermint.exe',
      version: 'v4.2.0 • Win 10/11 x64',
    },
    {
      id: 'mac',
      name: 'macOS Desktop',
      icon: <Apple className="w-6 h-6 text-slate-300" />,
      desc: 'Native desktop application for Apple Silicon M1/M2/M3 and Intel Macs.',
      badge: 'Management & HQ',
      btnLabel: 'Download DMG',
      link: '/downloads/ordermint.dmg',
      version: 'v4.2.0 • macOS 12+',
    },
    {
      id: 'web',
      name: 'Cloud Web Terminal',
      icon: <Laptop className="w-6 h-6 text-indigo-400" />,
      desc: 'Instant browser access from any device with zero installation.',
      badge: 'Instant Access',
      btnLabel: 'Launch Web App',
      link: '/login',
      version: 'Cloud Version • Always Updated',
    },
  ];

  const testimonials = [
    {
      name: 'Rajesh Malhotra',
      role: 'General Manager',
      property: 'Grand Vista Palace & Resort',
      location: 'Udaipur, Rajasthan',
      avatar: '🏨',
      rating: 5,
      quote:
        'Switching to GuestFlow streamlined our entire 80-room resort and 2 multi-cuisine restaurants. Check-in time dropped from 8 minutes to under 60 seconds, and night audits are completely automated.',
    },
    {
      name: 'Vikramaditya Sen',
      role: 'Director of F&B',
      property: 'Skyline Gastro Pub & Brewery',
      location: 'Bengaluru, Karnataka',
      avatar: '🍸',
      rating: 5,
      quote:
        'The peg-wise liquor inventory system is nothing short of revolutionary. We eliminated over 14% of monthly beverage leakage within our first 30 days of deploying GuestFlow.',
    },
    {
      name: 'Ananya Deshmukh',
      role: 'Managing Partner',
      property: 'The Olive Branch Cafe & Patisserie',
      location: 'Pune, Maharashtra',
      avatar: '☕',
      rating: 5,
      quote:
        'Our waitstaff love the tablet ordering app. Kitchen orders print in real-time, customers get instant WhatsApp bills, and our peak hour table turnover increased by 28%.',
    },
  ];

  const faqs = [
    {
      q: 'Can GuestFlow run on our existing thermal printers, POS touchscreens, and tablets?',
      a: 'Yes! GuestFlow is 100% hardware-agnostic. It works seamlessly with all standard USB, Ethernet, Bluetooth, and Wi-Fi thermal printers (Epson, TVS, Citizen, Posiflex), barcode scanners, cash drawers, Sunmi devices, Android tablets, and Windows/Mac computers.',
    },
    {
      q: 'What happens if our internet connection drops during peak business hours?',
      a: 'GuestFlow features advanced Offline Resilience. Your staff can continue punching KOTs, adding items, printing customer bills, and taking cash/card payments uninterrupted. Everything automatically syncs to the cloud the instant internet reconnects.',
    },
    {
      q: 'Does GuestFlow handle both Hotel Room Bookings and Restaurant / Bar POS together?',
      a: 'Absolutely! GuestFlow is built specifically as a unified platform. A guest dining at your restaurant or ordering room service can choose to pay immediately or transfer their food bill directly to their Room Folio with 1-click.',
    },
    {
      q: 'How fast can we set up our hotel rooms and restaurant menu?',
      a: 'Most properties are up and running within 24 to 48 hours. Our dedicated onboarding team provides free menu digitisation, table layout configuration, and live staff training sessions.',
    },
    {
      q: 'Is there a free trial available?',
      a: 'Yes! You can explore GuestFlow with a full-featured 14-day free trial. No credit card is required to get started.',
    },
  ];

  return (
    <div className="relative overflow-hidden text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* ── AMBIENT BACKGROUND GLOWS ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 w-[700px] h-[700px] rounded-full blur-[180px] opacity-25"
          style={{ background: 'radial-gradient(circle, #00c8ff, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full blur-[200px] opacity-15"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
        />
        <div
          className="absolute bottom-10 left-10 w-[500px] h-[500px] rounded-full blur-[180px] opacity-15"
          style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10">
        <WebsiteHeader dark />
        {/* ════════════════════════════════════════════════════════════════════
            1. HERO SECTION (WITH IMMERSIVE LUXURY BACKGROUND)
        ════════════════════════════════════════════════════════════════════ */}
        <section className="relative pt-36 pb-24 md:pt-44 md:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* ── LUXURY HOTEL & RESTAURANT HERO BACKGROUND (HIGH VISIBILITY) ── */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Image
              src="/images/website/hero-luxury-bg.jpg"
              alt="Luxury Hotel & Restaurant Atmosphere"
              fill
              priority
              className="object-cover object-center"
              style={{ opacity: 0.68, filter: 'contrast(1.08) brightness(1.02)' }}
            />
            {/* Top-to-Bottom Smooth Gradient Overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(6, 10, 18, 0.45) 0%, rgba(6, 10, 18, 0.5) 45%, rgba(6, 10, 18, 0.85) 80%, #060a12 100%)',
              }}
            />
            {/* Soft Edge Vignette */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to right, rgba(6, 10, 18, 0.55) 0%, transparent 20%, transparent 80%, rgba(6, 10, 18, 0.55) 100%)',
              }}
            />
            {/* Central Radial Cyan Spotlight */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] rounded-full blur-[150px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0, 200, 255, 0.16), transparent 70%)' }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-6"
            >
            <div
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full backdrop-blur-md transition-all hover:scale-105"
              style={{
                background: 'rgba(6, 10, 18, 0.65)',
                border: '1px solid rgba(0, 200, 255, 0.4)',
                boxShadow: '0 0 25px rgba(0, 200, 255, 0.25)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300 drop-shadow">
                Next-Gen Hospitality & POS Cloud Platform
              </span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
            </div>
          </motion.div>

          {/* Main Headline */}
          <div className="text-center max-w-4xl mx-auto mb-5">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-black tracking-tight leading-[1.12] text-white drop-shadow-2xl"
              style={{
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 200, 255, 0.25)',
              }}
            >
              One Cloud OS to Run Your{' '}
              <span
                className="bg-clip-text text-transparent bg-gradient-to-r from-[#00c8ff] via-[#38bdf8] to-[#34d399]"
                style={{ textShadow: '0 0 40px rgba(0, 200, 255, 0.4)' }}
              >
                Hotel, Restaurant & Bar.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-sm sm:text-base md:text-lg text-slate-100 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-lg"
              style={{
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.9)',
              }}
            >
              Unify front-desk room reservations, lightning-fast POS billing, table management, peg-wise liquor control, housekeeping, and smart guest folios into one intelligent operating system.
            </motion.p>
          </div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-6"
          >
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs sm:text-sm text-slate-950 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl group"
              style={{
                background: 'linear-gradient(135deg, #00c8ff, #00e5ff)',
                boxShadow: '0 0 35px rgba(0, 200, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              }}
            >
              <span>Start Free 14-Day Trial</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/contact"
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 backdrop-blur-md transition-all duration-200 hover:bg-white/10 hover:border-cyan-500/40 active:scale-95"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Play className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
              <span>Book Live 1-on-1 Demo</span>
            </Link>
          </motion.div>

          {/* Trust points */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium mb-8"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Setup in 24 Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Works Offline & Online</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>24/7 Priority Support</span>
            </div>
          </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            2. STATS & LIVE TRUST COUNTERS
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-12 border-y border-white/[0.06] bg-black/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {[
                { val: '500+', label: 'Active Hotels & Restaurants', icon: <Building2 className="w-5 h-5 text-cyan-400" /> },
                { val: '< 0.2s', label: 'Real-time KOT & Folio Sync', icon: <Zap className="w-5 h-5 text-amber-400" /> },
                { val: '99.99%', label: 'Guaranteed Cloud Uptime', icon: <ShieldCheck className="w-5 h-5 text-emerald-400" /> },
                { val: '₹45M+', label: 'Monthly Bills & Folios Processed', icon: <TrendingUp className="w-5 h-5 text-indigo-400" /> },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="flex items-center justify-center mb-2">{stat.icon}</div>
                  <div
                    className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-1"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 40%, #00c8ff 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.val}
                  </div>
                  <div className="text-xs text-slate-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            3. INTERACTIVE INDUSTRY SOLUTIONS SHOWCASE (TABS + IMAGES)
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              Specialized Modules
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Tailored Power for <span className="text-cyan-400">Every Hospitality Format.</span>
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Whether you run a 150-room luxury resort, a high-octane craft brewery, or a boutique dining room — GuestFlow adapts to your precise operational flow.
            </p>
          </div>

          {/* Solution Tabs Selector */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {industryTabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-lg scale-105'
                      : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white border border-white/[0.08]'
                  }`}
                  style={
                    isSelected
                      ? {
                          boxShadow: '0 0 25px rgba(0, 200, 255, 0.4)',
                        }
                      : {}
                  }
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Solution Content Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 rounded-3xl backdrop-blur-xl"
              style={{
                background: 'rgba(10, 16, 32, 0.75)',
                border: '1px solid rgba(0, 200, 255, 0.2)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* Left Column: Description & Highlights */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {currentTab.badge}
                </div>

                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
                  {currentTab.title}
                </h3>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {currentTab.desc}
                </p>

                {/* Key feature checklist */}
                <div className="space-y-3 pt-2">
                  {currentTab.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5 border border-cyan-500/20">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-200 font-medium">{h}</span>
                    </div>
                  ))}
                </div>

                {/* Stat block & CTA */}
                <div className="pt-4 flex flex-wrap items-center gap-6">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08]">
                    <div className="text-2xl font-black text-cyan-400">{currentTab.statVal}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{currentTab.statLabel}</div>
                  </div>

                  <Link
                    href="/features"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors group"
                  >
                    <span>Explore Full Specs</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Right Column: High-Res Image Preview */}
              <div className="lg:col-span-6 relative">
                <div className="relative aspect-[16/11] rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl group">
                  <Image
                    src={currentTab.image}
                    alt={currentTab.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060a12]/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3 rounded-xl backdrop-blur-md bg-black/60 border border-white/[0.1]">
                    <span className="text-xs font-bold text-white">{currentTab.tag}</span>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Live System View</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            4. BENTO FEATURE MATRIX (KDS, ANALYTICS, INVENTORY, MOBILE APPS)
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              Deep Architectural Power
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Engineered for Speed, Precision & Zero Wastage.
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Explore the core modules built to eliminate kitchen errors, maximize table turnover, and automate compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            {/* Bento Card 1: KDS (Span 7) */}
            <div
              className="lg:col-span-7 rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-cyan-500/40"
              style={{
                background: 'rgba(10, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="mb-6 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4">
                  <ChefHat className="w-3.5 h-3.5" /> Kitchen Intelligence
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Paperless Kitchen Display System (KDS)</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Route orders instantaneously to specific stations (Curry, Tandoor, Chinese, Bar). Prep timers color-code delayed items automatically to ensure 100% table harmony.
                </p>
              </div>

              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl z-10">
                <Image
                  src="/images/website/kds-kitchen-screen.jpg"
                  alt="Kitchen Display System KDS Interface"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Bento Card 2: AI Analytics (Span 5) */}
            <div
              className="lg:col-span-5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-cyan-500/40"
              style={{
                background: 'rgba(10, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="mb-6 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                  <BarChart3 className="w-3.5 h-3.5" /> Executive BI
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Real-Time Revenue Analytics</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Monitor live sales, RevPAR, item profitability margins, peak hour surges, and staff sales performance from your phone anywhere in the world.
                </p>
              </div>

              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl z-10">
                <Image
                  src="/images/website/guestflow-hero-dash.jpg"
                  alt="Real-time Revenue Analytics Dashboard"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Bento Card 3: Mobile Waiter Station (Span 4) */}
            <div
              className="lg:col-span-4 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/40"
              style={{
                background: 'rgba(10, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 border border-cyan-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Tablet & Handheld POS</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Turn any Android tablet or smartphone into a mobile waiter station. Punch KOTs, modify spice levels, and print invoices right at the customer's table.
                </p>
              </div>
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/[0.08]">
                <Image src="/images/website/restaurant-pos-live.jpg" alt="Handheld POS Mobile" fill className="object-cover" />
              </div>
            </div>

            {/* Bento Card 4: Housekeeping & Walkie-Talkie (Span 4) */}
            <div
              className="lg:col-span-4 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/40"
              style={{
                background: 'rgba(10, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mb-4 border border-violet-500/20">
                  <Radio className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Staff Walkie-Talkie & Tasks</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Coordinate housekeeping teams across multiple floors with built-in push-to-talk digital walkie-talkie audio channels and real-time cleaning checklists.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Channel: Housekeeping Floor 2</span>
                  <span className="text-emerald-400 font-bold">● Active (4 Staff)</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-violet-400 h-full w-3/4 rounded-full" />
                </div>
              </div>
            </div>

            {/* Bento Card 5: GST Billing & Multi-Payment (Span 4) */}
            <div
              className="lg:col-span-4 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/40"
              style={{
                background: 'rgba(10, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 border border-emerald-500/20">
                  <Receipt className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">GST Invoicing & Payments</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  100% GST compliant invoicing with HSN code mapping, dynamic UPI QR on bill slips, multi-tender splits (Cash + Card + UPI), and WhatsApp auto-receipts.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Supported Gateways</div>
                  <div className="text-sm font-bold text-white">Razorpay • PineLabs • Paytm</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            5. MULTI-PLATFORM DOWNLOAD SHOWCASE
        ════════════════════════════════════════════════════════════════════ */}
        <section id="download" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              Deploy Instantly Everywhere
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              One Login. <span className="text-cyan-400">Every Device.</span>
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Download native high-performance applications designed specifically for your hardware setup.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {appPlatforms.map((app) => (
              <div
                key={app.id}
                className="p-6 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:border-cyan-500/40"
                style={{
                  background: 'rgba(10, 16, 32, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
                      {app.icon}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {app.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1.5">{app.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">{app.desc}</p>
                </div>

                <div>
                  <div className="text-[10px] font-mono text-slate-400 mb-3">{app.version}</div>
                  <a
                    href={app.link}
                    download={app.id !== 'web'}
                    className="w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 text-slate-950 hover:opacity-90"
                    style={{
                      background: 'linear-gradient(135deg, #00c8ff, #38bdf8)',
                      boxShadow: '0 0 20px rgba(0, 200, 255, 0.25)',
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{app.btnLabel}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            6. SOCIAL PROOF & CUSTOMER REVIEWS
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              Trusted by Leaders
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Loved by 500+ Hoteliers & Restaurateurs.
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Discover why premier boutique resorts and high-volume outlets choose GuestFlow to power their day-to-day operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-8 rounded-3xl flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/30"
                style={{
                  background: 'rgba(10, 16, 32, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic mb-6">
                    "{t.quote}"
                  </p>
                </div>

                <div className="flex items-center gap-3.5 pt-4 border-t border-white/[0.06]">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-lg border border-cyan-500/20">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-[11px] text-cyan-300 font-medium">{t.role} • {t.property}</div>
                    <div className="text-[10px] text-slate-400">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            7. 24/7 DEDICATED SUPPORT & ONBOARDING PROMISE
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 rounded-3xl overflow-hidden relative"
            style={{
              background: 'radial-gradient(ellipse at top left, rgba(0, 200, 255, 0.1), rgba(10, 16, 32, 0.95))',
              border: '1px solid rgba(0, 200, 255, 0.25)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Headphones className="w-3.5 h-3.5" /> White-Glove Onboarding
              </div>

              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                We Setup Everything For You. <br />
                <span className="text-cyan-400">Zero Technical Stress.</span>
              </h3>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Our hospitality engineers digitize your full room inventory, configure printer dispatch routes, upload your food & beverage menus with item photos, and train your staff live.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  'Free Menu & Room Digitization',
                  '1-on-1 Staff Training Sessions',
                  'Dedicated WhatsApp Support Group',
                  'Hardware & Thermal Printer Setup',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg"
                >
                  <span>Talk to an Onboarding Specialist</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl">
                <Image
                  src="/images/website/contact-team.png"
                  alt="GuestFlow Dedicated Support Team"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            8. INTERACTIVE FAQ ACCORDION
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl overflow-hidden transition-all duration-200"
                  style={{
                    background: 'rgba(10, 16, 32, 0.75)',
                    border: isOpen ? '1px solid rgba(0, 200, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left text-sm sm:text-base font-bold text-white hover:text-cyan-300 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <span className="ml-4 flex-shrink-0 text-cyan-400">
                      {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-6 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.04] pt-3"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            9. GRAND FINALE HIGH-CONVERTING CTA
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center relative overflow-hidden">
          <div
            className="p-10 sm:p-16 rounded-3xl relative overflow-hidden backdrop-blur-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 200, 255, 0.12), rgba(10, 16, 32, 0.95), rgba(99, 102, 241, 0.12))',
              border: '1px solid rgba(0, 200, 255, 0.3)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(0, 200, 255, 0.15)',
            }}
          >
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-400 block mb-4">
                Join 500+ Top Hospitality Brands
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-6">
                Ready to Upgrade to the{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                  Ultimate Hospitality OS?
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
                Start your free 14-day trial today. No credit card required. Experience faster check-ins, automated KOTs, and zero inventory leakage.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-sm text-slate-950 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, #00c8ff, #00e5ff)',
                    boxShadow: '0 0 35px rgba(0, 200, 255, 0.4)',
                  }}
                >
                  <span>Start Free Trial Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/contact"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 backdrop-blur-md transition-all duration-200 hover:bg-white/10"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <span>Schedule Personal Demo</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <PremiumFooter />
      </div>
    </div>
  );
}
