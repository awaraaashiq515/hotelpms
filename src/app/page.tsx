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
  Bed,
  Calendar,
  Radio,
  Receipt,
  Headphones,
  Check,
  Plus,
  Minus,
  Laptop,
  Play,
  Star,
  Clock,
  Users,
  Compass,
  KeyRound,
  RefreshCw,
  Sliders,
  DollarSign,
  Coffee,
  CheckCheck,
  Shield,
  Award,
  Globe,
  Hotel
} from 'lucide-react';

const liveHotelEvents = [
  {
    icon: '⚡',
    tag: '2-Way Channel Manager',
    tagColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    text: 'Booking.com: Deluxe Ocean King booked • 50+ OTAs inventory deducted automatically in 0.1s',
  },
  {
    icon: '🛎️',
    tag: 'Front Desk Express',
    tagColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    text: '45-second guest check-in completed via digital Passport scan & RFID keycard encoded',
  },
  {
    icon: '🧹',
    tag: 'Housekeeping Mobile',
    tagColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    text: 'Floor 2 Supervisor marked Suite 402 as "Inspected & Clean" • Front desk notified live',
  },
  {
    icon: '🍽️',
    tag: 'In-Room Dining Folio',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    text: 'Chef specialty room service order (₹2,850) charged directly to Room Folio 301',
  },
  {
    icon: '🌙',
    tag: 'Automated Night Audit',
    tagColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    text: 'Daily midnight financial audit completed • 100% GST reconciled with zero folio leakage',
  },
];

export default function WebsiteHomePage() {
  const [activeTab, setActiveTab] = useState<'frontdesk' | 'channel' | 'housekeeping' | 'folio' | 'audit'>('frontdesk');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetch('/api/website/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setSettings(json.data);
      })
      .catch(() => {});

    const tickerInterval = setInterval(() => {
      setCurrentEventIndex((prev) => (prev + 1) % liveHotelEvents.length);
    }, 3800);

    return () => clearInterval(tickerInterval);
  }, []);

  if (mounted && settings?.maintenanceMode) {
    return (
      <MaintenanceView
        hotelName={settings.hotelName}
        logoUrl={settings.logoUrl}
      />
    );
  }

  // Hotel Operational Modules Showcase
  const hotelModules = [
    {
      id: 'frontdesk',
      label: 'Front Desk & Room Grid',
      icon: <Bed className="w-4 h-4" />,
      badge: 'Interactive Tape Chart',
      tag: 'Front Office Master Console',
      title: 'Visual Room Calendar, Digital ID Scanner & 60-Sec Check-in',
      desc: 'Eliminate front-desk queues. Assign rooms visually, drag-and-drop booking extensions, scan guest identity cards instantly, encode room keys, and manage multi-folio settlements in seconds.',
      image: '/images/website/hotel-frontdesk-reception.jpg',
      statVal: '< 60s',
      statLabel: 'Average Guest Check-in Time',
      highlights: [
        'Color-coded tape chart with real-time room availability & clean status',
        'Instant digital Aadhaar / Passport scanner with automated C-Form generation',
        'Multi-room group reservations with 1-click master folio creation',
        'Seamless integration with RFID room keycard encoders & thermal slip printers',
      ],
    },
    {
      id: 'channel',
      label: 'Channel Manager & OTAs',
      icon: <Globe className="w-4 h-4" />,
      badge: '2-Way Live Sync',
      tag: 'Zero Overbooking Engine',
      title: 'Instant 2-Way Sync Across Booking.com, Agoda, MakeMyTrip & MMT',
      desc: 'Sync rates, minimum night restrictions, and room availability live across all major OTA channels and your direct hotel website. When a room sells, availability updates across all platforms in under 3 seconds.',
      image: '/images/website/hotel-suite-luxury.jpg',
      statVal: '100%',
      statLabel: 'Inventory Sync Accuracy',
      highlights: [
        'Instant bidirectional sync with Booking.com, Agoda, Expedia, MakeMyTrip & Airbnb',
        'Automated rate parity manager with dynamic surge pricing rules',
        'Zero commission direct booking engine for your hotel official website',
        'Automated OTA cancellation processing and instant room re-listing',
      ],
    },
    {
      id: 'housekeeping',
      label: 'Housekeeping & Maintenance',
      icon: <Radio className="w-4 h-4" />,
      badge: 'Live Operations & Walkie-Talkie',
      tag: 'Turnover & Inspection Ops',
      title: 'Mobile Housekeeper Status, Room Turnover & Built-in Walkie-Talkie',
      desc: 'Empower floor supervisors and attendants with instant mobile room updates. Rooms automatically flag as Dirty upon checkout, update to In-Progress when staff enter, and notify front-desk immediately once Inspected.',
      image: '/images/website/hotel-pms-suite.jpg',
      statVal: '-40%',
      statLabel: 'Room Turnover Turnaround Time',
      highlights: [
        'Live room states: Dirty, Cleaning, Inspected, Out-of-Order, and Do-Not-Disturb',
        'Floor-wise digital walkie-talkie audio channels for instant staff coordination',
        'Linen & guest amenity replenishment tracking with minibar stock audits',
        'Maintenance ticketing with photo proof and priority escalation alerts',
      ],
    },
    {
      id: 'folio',
      label: 'Guest Folios & In-Room Dining',
      icon: <Coffee className="w-4 h-4" />,
      badge: 'Unified Guest Ledger',
      tag: 'Complete Guest Billing',
      title: 'Transfer Room Service, Spa & Restaurant Bills to Room Folio',
      desc: 'Give guests a 5-star seamless experience. In-room dining orders, banquet charges, bar beverages, and spa therapies post directly to the guest room folio with digital signature verification.',
      image: '/images/website/hotel-hero-luxury.jpg',
      statVal: '+35%',
      statLabel: 'Higher Guest In-Room Spending',
      highlights: [
        'In-room QR code digital menus for seamless in-room dining without phone calls',
        'Split folio billing by room, guest, company corporate account, or payment type',
        'Full GST invoice generation with dynamic UPI QR code on checkout bills',
        'Automated WhatsApp & Email invoice dispatch directly to the guest phone',
      ],
    },
    {
      id: 'audit',
      label: 'Night Audit & Revenue BI',
      icon: <BarChart3 className="w-4 h-4" />,
      badge: 'Automated Financials',
      tag: 'Executive Financial Control',
      title: 'Automated 1-Click Midnight Audit, RevPAR, ADR & Tax Compliance',
      desc: 'Sleep easy while GuestFlow reconciles daily guest folios, posts automated room room tariffs with taxes, audits cash & card balances, and delivers an executive revenue report to your WhatsApp every morning.',
      image: '/images/website/guestflow-hero-dash.jpg',
      statVal: '0 min',
      statLabel: 'Manual Night Audit Effort',
      highlights: [
        'Automated rollover with zero front-desk downtime during midnight audits',
        'Live tracking of RevPAR (Revenue Per Available Room), ADR, and Occupancy %',
        'Comprehensive GSTR-1, GSTR-3B tax exports and tally accounting sync',
        'HQ multi-property revenue dashboard for hotel owners and chain directors',
      ],
    },
  ];

  const currentTab = hotelModules.find((m) => m.id === activeTab) || hotelModules[0];

  const appPlatforms = [
    {
      id: 'windows',
      name: 'Front-Desk Windows Terminal',
      icon: <Monitor className="w-6 h-6 text-cyan-400" />,
      desc: 'Ultra-fast front office desktop app with RFID keycard encoders, passport scanners & thermal printing.',
      badge: 'Reception & Cashier',
      btnLabel: 'Download EXE',
      link: '/downloads/ordermint.exe',
      version: 'v4.5.0 • Windows 10/11 x64',
    },
    {
      id: 'android',
      name: 'OrderMint PMS Android App',
      icon: <Smartphone className="w-6 h-6 text-emerald-400" />,
      desc: 'Mobile & Tablet PMS app for staff attendance, housekeeping, room inspections, walkie-talkie & thermal printing.',
      badge: 'OrderMint PMS Official',
      btnLabel: 'Download OrderMint PMS APK',
      link: '/downloads/OrderMintPMS.apk',
      version: 'v1.0 • Android 8.0+',
    },
    {
      id: 'mac',
      name: 'macOS General Manager App',
      icon: <Apple className="w-6 h-6 text-slate-200" />,
      desc: 'Native executive dashboard for Apple Silicon M1/M2/M3 and Intel Macs with live property analytics.',
      badge: 'General Managers',
      btnLabel: 'Download DMG',
      link: '/downloads/ordermint.dmg',
      version: 'v4.5.0 • macOS 12+',
    },
    {
      id: 'web',
      name: 'Cloud Browser Console',
      icon: <Laptop className="w-6 h-6 text-indigo-400" />,
      desc: 'Instant browser access from any device, anywhere in the world with zero setup or installation.',
      badge: 'Zero Install Required',
      btnLabel: 'Launch Web PMS',
      link: '/login',
      version: 'Cloud Version • Always Auto-Updated',
    },
  ];

  const testimonials = [
    {
      name: 'Rajesh Malhotra',
      role: 'General Manager',
      property: 'Grand Vista Heritage Palace',
      location: 'Udaipur, Rajasthan',
      avatar: '🏨',
      rating: 5,
      quote:
        'Switching to GuestFlow transformed our 85-room heritage resort. Check-in time dropped from 8 minutes to under 60 seconds with digital ID scanning. The 2-way OTA sync completely eliminated double bookings during our high season.',
    },
    {
      name: 'Sunil Nair',
      role: 'Managing Director',
      property: 'Ocean Palm Luxury Resort & Spa',
      location: 'North Goa, Goa',
      avatar: '🌴',
      rating: 5,
      quote:
        'The live housekeeping room grid and walkie-talkie feature save our floor supervisors over 2 hours every single day. Rooms are turned around 40% faster, and front desk knows the moment a suite is inspected and ready.',
    },
    {
      name: 'Ananya Deshmukh',
      role: 'Operations Director',
      property: 'The Zenith Business Hotel & Suites',
      location: 'Bengaluru, Karnataka',
      avatar: '🏢',
      rating: 5,
      quote:
        'The automated night audit is magical. Every morning at 6 AM, I receive our full RevPAR, ADR, and GST revenue breakdown on my phone. Guest folios never miss an in-room dining or laundry charge now.',
    },
  ];

  const faqs = [
    {
      q: 'Can GuestFlow connect directly with OTAs like Booking.com, Agoda, MakeMyTrip, and Expedia?',
      a: 'Yes! GuestFlow features a built-in 2-Way Channel Manager. When a room is booked at your front desk or on your website, availability is automatically deducted across all connected OTAs within seconds, eliminating double bookings forever.',
    },
    {
      q: 'Does GuestFlow work with our existing keycard encoders and thermal receipt printers?',
      a: 'Absolutely. GuestFlow is fully hardware-agnostic. It seamlessly integrates with standard RFID/Mifare keycard encoders, high-speed thermal slip printers (Epson, TVS, Posiflex), passport/document flatbed scanners, and barcode scanners.',
    },
    {
      q: 'How does the Housekeeping and Floor Walkie-Talkie system work?',
      a: 'Housekeeping staff log into their mobile portal on any Android tablet or smartphone. They see assigned rooms in order of priority (Check-out vs Stayover). With 1 tap, they mark rooms In-Progress or Cleaned. The built-in push-to-talk Walkie-Talkie lets front desk and floor attendants coordinate instantly without expensive radio sets.',
    },
    {
      q: 'Can restaurant, bar, and room service orders be charged directly to the guest room folio?',
      a: 'Yes! When guests dine in your hotel restaurant or order room service, staff can transfer the entire bill to their Room Folio with 1-click. The guest signs digitally or enters their room key PIN, and the bill settles automatically upon checkout.',
    },
    {
      q: 'What happens if our hotel internet goes down during peak check-in time?',
      a: 'GuestFlow features advanced Offline Resilience. Front desk staff can continue checking in guests, generating keycards, printing folios, and taking payments uninterrupted. Everything synchronizes automatically to the cloud the moment connectivity resumes.',
    },
    {
      q: 'How quickly can our hotel be migrated and staff trained?',
      a: 'Most boutique hotels and resorts are fully live within 24 to 48 hours. Our dedicated hospitality onboarding engineers assist with room category mapping, rate plan digitisation, OTA connection, and live 1-on-1 staff training sessions.',
    },
  ];

  return (
    <div className="relative overflow-hidden text-slate-100 selection:bg-cyan-500 selection:text-black bg-[#040711]">
      {/* ── AMBIENT LUXURY ANIMATED LIGHTING ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.18, 0.3, 0.18] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          className="absolute -top-40 left-1/4 w-[750px] h-[750px] rounded-full blur-[200px]"
          style={{ background: 'radial-gradient(circle, #00c8ff, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.12, 0.22, 0.12] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut', delay: 1 }}
          className="absolute top-1/3 -right-40 w-[650px] h-[650px] rounded-full blur-[220px]"
          style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.24, 0.12] }}
          transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-10 left-10 w-[550px] h-[550px] rounded-full blur-[180px]"
          style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }}
        />
      </div>

      <div className="relative z-10">
        <WebsiteHeader dark />

        {/* ════════════════════════════════════════════════════════════════════
            1. HERO SECTION: LUXURY 5-STAR HOTEL LOBBY + LIVE INTERACTIVE PMS
        ════════════════════════════════════════════════════════════════════ */}
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* ── CINEMATIC AESTHETIC LUXURY RESORT HERO BACKGROUND ── */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Image
              src="/images/website/hero-resort-twilight.jpg"
              alt="Breathtaking Luxury Resort & Hotel Architecture at Twilight"
              fill
              priority
              className="object-cover object-center scale-105"
              style={{ opacity: 0.52, filter: 'contrast(1.12) brightness(0.96) saturate(1.15)' }}
            />
            {/* Top-to-bottom luxury vignette gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(4, 7, 17, 0.45) 0%, rgba(4, 7, 17, 0.6) 35%, rgba(4, 7, 17, 0.92) 80%, #040711 100%)',
              }}
            />
            {/* Side edge vignettes */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to right, rgba(4, 7, 17, 0.75) 0%, transparent 20%, transparent 80%, rgba(4, 7, 17, 0.75) 100%)',
              }}
            />
            {/* Central Soft Cyan Spotlight */}
            <div
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] rounded-full blur-[160px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0, 212, 255, 0.14), transparent 70%)' }}
            />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto">
            {/* Top Luxury Pill Badge */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-6"
            >
              <div
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full backdrop-blur-xl transition-all hover:scale-105"
                style={{
                  background: 'rgba(10, 16, 32, 0.75)',
                  border: '1px solid rgba(0, 200, 255, 0.4)',
                  boxShadow: '0 0 30px rgba(0, 200, 255, 0.25)',
                }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300 drop-shadow">
                  Next-Gen Cloud Hotel PMS & Guest OS
                </span>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              </div>
            </motion.div>

            {/* Main Headline & Value Proposition */}
            <div className="text-center max-w-4xl mx-auto mb-8">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.12] text-white drop-shadow-2xl"
              >
                The Intelligent Operating System for{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00d4ff] via-[#38bdf8] to-[#34d399]">
                  Luxury Hotels & Boutique Resorts.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 text-sm sm:text-base md:text-lg text-slate-200 max-w-3xl mx-auto leading-relaxed font-normal drop-shadow"
              >
                Unify visual room reservations, 60-second digital guest check-ins, 2-way OTA channel sync, live housekeeping dispatch, in-room dining folios, and automated night audits into one intuitive master console.
              </motion.p>
            </div>

            {/* Hero CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            >
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-slate-950 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl group"
                style={{
                  background: 'linear-gradient(135deg, #00d4ff, #00f2fe)',
                  boxShadow: '0 0 35px rgba(0, 212, 255, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                }}
              >
                <span>Start Free 14-Day Hotel Trial</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/contact"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 backdrop-blur-md transition-all duration-200 hover:bg-white/10 hover:border-cyan-500/40 active:scale-95"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <Play className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
                <span>Book Live 1-on-1 Hotel Demo</span>
              </Link>

              <Link
                href="#download"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-emerald-300 flex items-center justify-center gap-2 backdrop-blur-md transition-all duration-200 hover:bg-emerald-500/20 hover:border-emerald-400/50 active:scale-95 group"
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.2)',
                }}
              >
                <Smartphone className="w-4 h-4 text-emerald-400 transition-transform group-hover:scale-110" />
                <span>Download OrderMint PMS App</span>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300 font-medium mb-12"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>24-Hour Express Hotel Setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Zero OTA Double-Bookings</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Works Offline & Online</span>
              </div>
            </motion.div>

            {/* ── SAAS MULTI-PROPERTY CLOUD PLATFORM CONSOLE PREVIEW ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="rounded-3xl p-4 sm:p-7 backdrop-blur-2xl relative overflow-hidden"
              style={{
                background: 'rgba(10, 16, 32, 0.85)',
                border: '1px solid rgba(0, 200, 255, 0.3)',
                boxShadow:
                  '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 200, 255, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              }}
            >
              {/* SaaS Browser Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  {/* Window dots */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                </div>

                {/* SaaS Property Switcher (Highlighting Multi-Hotel Capability) */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-300">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Multi-Property Mode: All Hotel Branches</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  </div>

                  <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/[0.08] text-right">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Live System Status</div>
                    <div className="text-xs font-bold text-emerald-400">● 50+ OTAs 2-Way Synced</div>
                  </div>
                </div>
              </div>

              {/* ── LIVE HOTEL SAAS ACTIVITY TICKER ANIMATION ── */}
              <div className="mt-5 mb-2 p-2 sm:p-2.5 rounded-2xl bg-black/60 border border-white/[0.08] backdrop-blur-xl flex items-center justify-between gap-3 overflow-hidden">
                <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                    Live System Feed
                  </span>
                </div>

                <div className="flex-1 min-w-0 overflow-hidden h-7 flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentEventIndex}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.35 }}
                      className="flex items-center gap-2 text-xs truncate"
                    >
                      <span className="text-sm">{liveHotelEvents[currentEventIndex].icon}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${liveHotelEvents[currentEventIndex].tagColor} hidden sm:inline-block`}
                      >
                        {liveHotelEvents[currentEventIndex].tag}
                      </span>
                      <span className="text-slate-200 font-medium truncate text-[11px] sm:text-xs">
                        {liveHotelEvents[currentEventIndex].text}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <span className="text-[10px] text-slate-500 font-mono hidden md:inline-block pr-2">
                  Sync Latency: 0.12s
                </span>
              </div>

              {/* SaaS Dashboard Showcase Screen with Floating Capability Highlights */}
              <div className="mt-4 relative rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl group">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src="/images/website/guestflow-hero-dash.jpg"
                    alt="GuestFlow Multi-Property Hotel PMS Cloud Console"
                    fill
                    priority
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040711]/90 via-[#040711]/30 to-transparent pointer-events-none" />

                  {/* Top Floating Glass Badge: Multi-Hotel Central Management (Floating Animation) */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                    className="absolute top-4 left-4 sm:top-6 sm:left-6 p-3 sm:p-4 rounded-2xl backdrop-blur-xl bg-black/75 border border-cyan-500/40 shadow-[0_10px_35px_rgba(0,212,255,0.2)] max-w-xs z-20"
                  >
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-1">
                      <Building2 className="w-4 h-4" />
                      <span>Multi-Hotel Portfolio Console</span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      Manage 1 boutique property or 50+ resort chains from a single master administrative cloud login.
                    </p>
                  </motion.div>

                  {/* Top Right Floating Badge: 2-Way OTA Channel Manager (Floating Animation) */}
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 5.2, ease: 'easeInOut', delay: 0.5 }}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 p-3 sm:p-4 rounded-2xl backdrop-blur-xl bg-black/75 border border-emerald-500/40 shadow-[0_10px_35px_rgba(16,185,129,0.2)] max-w-xs text-right hidden sm:block z-20"
                  >
                    <div className="flex items-center justify-end gap-2 text-emerald-400 text-xs font-bold mb-1">
                      <Globe className="w-4 h-4" />
                      <span>Instant 2-Way OTA Sync</span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-snug">
                      Booking.com • Agoda • MakeMyTrip • Expedia • Airbnb — 0% overbookings with sub-second rate updates.
                    </p>
                  </motion.div>

                  {/* Bottom Strip: Key SaaS Platform Capabilities */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 p-4 rounded-2xl backdrop-blur-xl bg-black/80 border border-white/[0.12] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-6 text-xs text-slate-300">
                      <div className="flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 text-cyan-400" />
                        <span>Visual Room Grid & Tape Chart</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 text-cyan-400" />
                        <span>Mobile Housekeeping & Walkie-Talkie</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 text-cyan-400" />
                        <span>In-Room Dining to Room Folio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCheck className="w-4 h-4 text-cyan-400" />
                        <span>Automated Daily Night Audit</span>
                      </div>
                    </div>

                    <Link
                      href="/features"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all flex items-center gap-1.5 shadow-lg"
                    >
                      <span>Explore Platform Modules</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* 4 Multi-Tenant SaaS Pillars for Hotel Clients */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                  {
                    icon: <Hotel className="w-4 h-4 text-cyan-400" />,
                    title: 'Boutique & Luxury Hotels',
                    desc: 'Speed up front desk check-in to under 60 seconds with digital passport & Aadhaar scan.',
                  },
                  {
                    icon: <Globe className="w-4 h-4 text-emerald-400" />,
                    title: '2-Way OTA Channel Manager',
                    desc: 'Real-time bidirectional inventory & rate distribution across 50+ global travel portals.',
                  },
                  {
                    icon: <Radio className="w-4 h-4 text-amber-400" />,
                    title: 'Mobile Housekeeper Apps',
                    desc: 'Live floor-wise room status tracking, turnover checklists, and push-to-talk walkie-talkie.',
                  },
                  {
                    icon: <Receipt className="w-4 h-4 text-indigo-400" />,
                    title: 'Automated Night Audit & GST',
                    desc: 'Zero-downtime daily financial rollovers, multi-folio settlements, and WhatsApp reports.',
                  },
                ].map((pillar, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-white/[0.05]">{pillar.icon}</div>
                      <span className="text-xs font-bold text-white">{pillar.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            2. HOTEL KEY PERFORMANCE & LIVE TRUST METRICS
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-12 border-y border-white/[0.06] bg-black/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              {[
                {
                  val: '500+',
                  label: 'Luxury Hotels & Boutique Resorts',
                  icon: <Building2 className="w-5 h-5 text-cyan-400" />,
                },
                {
                  val: '< 60s',
                  label: 'Digital Check-in with ID Scanner',
                  icon: <Zap className="w-5 h-5 text-amber-400" />,
                },
                {
                  val: '0%',
                  label: 'OTA Overbooking Guarantee',
                  icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
                },
                {
                  val: '₹65M+',
                  label: 'Monthly Room Tariffs & Folios Processed',
                  icon: <TrendingUp className="w-5 h-5 text-indigo-400" />,
                },
              ].map((stat, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl transition-all duration-300 hover:scale-105"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
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
            3. CORE HOTEL OPERATIONAL MODULES (INTERACTIVE TABS + HIGH-RES HOTEL VISUALS)
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              Comprehensive Hotel PMS Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Purpose-Built for <span className="text-cyan-400">5-Star Hospitality Operations.</span>
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Whether you manage an 80-room heritage palace, an oceanfront beach resort, or a boutique city hotel — GuestFlow empowers your team with seamless automation from check-in to night audit.
            </p>
          </div>

          {/* Module Tabs Selector */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {hotelModules.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 ${
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

          {/* Active Hotel Module Card */}
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
              {/* Left: Description & Specs */}
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

                {/* Stat block & Action link */}
                <div className="pt-4 flex flex-wrap items-center gap-6">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08]">
                    <div className="text-2xl font-black text-cyan-400">{currentTab.statVal}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                      {currentTab.statLabel}
                    </div>
                  </div>

                  <Link
                    href="/features"
                    className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-400 hover:text-cyan-300 transition-colors group"
                  >
                    <span>Explore Hotel Specifications</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Right: High-Res Hotel Photo Preview */}
              <div className="lg:col-span-6 relative">
                <div className="relative aspect-[16/11] rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl group">
                  <Image
                    src={currentTab.image}
                    alt={currentTab.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040711]/90 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between p-3.5 rounded-xl backdrop-blur-md bg-black/60 border border-white/[0.1]">
                    <span className="text-xs font-bold text-white">{currentTab.tag}</span>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      Hotel Production Ready
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            4. HOTELIER BENTO MATRIX: SOLVING REAL HOTEL HEADACHES
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              Deep Operational Engineering
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Designed to Solve Every Hotelier's Pain Point.
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Say goodbye to lost revenue, double-booked rooms, paper registers, and delayed housekeeping room turns.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            {/* Bento Card 1: 5-Star Front Desk Experience (Span 7) */}
            <div
              className="lg:col-span-7 rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-cyan-500/40"
              style={{
                background: 'rgba(10, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="mb-6 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-4">
                  <KeyRound className="w-3.5 h-3.5" /> Front-Office Operations
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Instant Digital ID & 60-Second Check-in</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                  Front-desk staff scan passport, Aadhaar, or driver's license with auto-filled guest registration cards. Encode RFID room keycards with 1-click and delight arriving guests instantly.
                </p>
              </div>

              <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl z-10">
                <Image
                  src="/images/website/hotel-frontdesk-reception.jpg"
                  alt="Hotel Front Desk Reception Check-In"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Bento Card 2: Executive Revenue BI (Span 5) */}
            <div
              className="lg:col-span-5 rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group transition-all duration-300 hover:border-cyan-500/40"
              style={{
                background: 'rgba(10, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="mb-6 z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                  <BarChart3 className="w-3.5 h-3.5" /> Executive BI & ADR
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Real-Time RevPAR & Occupancy Analytics</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Monitor live property occupancy, average daily rate (ADR), room category yield, and OTA commission costs from anywhere in the world on your smartphone.
                </p>
              </div>

              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl z-10">
                <Image
                  src="/images/website/guestflow-hero-dash.jpg"
                  alt="Hotel Revenue Analytics Dashboard"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Bento Card 3: Luxury Suite Experience & In-Room Dining (Span 4) */}
            <div
              className="lg:col-span-4 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/40"
              style={{
                background: 'rgba(10, 16, 32, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4 border border-amber-500/20">
                  <Coffee className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">In-Room Dining to Room Folio</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Guests scan an in-room QR code to view high-resolution food menus, order breakfast in bed, and post charges directly to their room folio.
                </p>
              </div>
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-white/[0.08]">
                <Image
                  src="/images/website/hotel-suite-luxury.jpg"
                  alt="Luxury Hotel Master Suite"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Bento Card 4: Housekeeping & Floor Walkie-Talkie (Span 4) */}
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
                <h4 className="text-lg font-bold text-white mb-2">Staff Walkie-Talkie & Turns</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  Coordinate housekeeping staff across hotel floors with built-in push-to-talk voice channels, priority room clean flags, and instant inspection notifications.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Floor 1 Housekeeping Channel</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Active (6 Staff)
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-violet-400 h-full w-4/5 rounded-full" />
                </div>
                <div className="text-[10px] text-slate-400">12 Rooms Turnaround • 4 Ready for Inspection</div>
              </div>
            </div>

            {/* Bento Card 5: GST Billing & Multi-Tender Invoicing (Span 4) */}
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
                <h4 className="text-lg font-bold text-white mb-2">GST Compliance & Night Audit</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  100% compliant hotel GST invoices with SAC 9963 codes, dynamic UPI QR on check-out bills, corporate B2B tax billing, and WhatsApp auto-receipts.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-black/40 border border-white/[0.05] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Night Audit Mode</div>
                  <div className="text-sm font-bold text-white">Automated Daily Reconciled</div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            5. COMPARISON: LEGACY HOTEL SOFTWARE VS GUESTFLOW CLOUD OS
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              The Modern Advantage
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Why Premier Hotels Are Replacing <span className="text-slate-400">Legacy PMS Systems.</span>
            </h2>
          </div>

          <div
            className="rounded-3xl overflow-hidden border border-white/[0.08] backdrop-blur-xl"
            style={{ background: 'rgba(10, 16, 32, 0.8)' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/[0.08]">
              {/* Old Legacy Column */}
              <div className="p-8 space-y-5 bg-red-950/10">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <h3 className="text-lg font-bold text-slate-300">Legacy Desktop PMS (Opera/IDS/Old Systems)</h3>
                </div>
                <div className="space-y-4 text-xs sm:text-sm text-slate-400">
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>Costly on-premise local servers that crash during power cuts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>Manual rate updates leading to high-frequency OTA overbooking</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>Clunky 1990s Windows interface requiring weeks of staff training</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>Paper housekeeping logs and lost room service charge slips</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-red-400 font-bold">✕</span>
                    <span>45-minute manual night audit that freezes reception systems</span>
                  </div>
                </div>
              </div>

              {/* GuestFlow Cloud OS Column */}
              <div className="p-8 space-y-5 bg-cyan-950/20">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-cyan-400" />
                  <h3 className="text-lg font-bold text-white">GuestFlow Hospitality Cloud OS</h3>
                </div>
                <div className="space-y-4 text-xs sm:text-sm text-slate-200 font-medium">
                  <div className="flex items-start gap-3">
                    <CheckCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>100% Cloud + Offline Resilience: Runs anywhere with zero server costs</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>Instant 2-way live sync with 50+ OTAs (Zero double-bookings)</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>Intuitive modern UI: New front-desk staff master check-ins in under 1 hour</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>Mobile housekeeper app + staff walkie-talkie + automatic folio posting</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <span>Automated 1-click midnight audit with revenue reports sent to WhatsApp</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            6. MULTI-PLATFORM DOWNLOAD SHOWCASE
        ════════════════════════════════════════════════════════════════════ */}
        <section id="download" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              Deploy Across Your Property
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              One Cloud Account. <span className="text-cyan-400">Every Hotel Device.</span>
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Download native high-performance apps customized for front desk PCs, housekeeping tablets, and manager smartphones.
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
                      background: 'linear-gradient(135deg, #00d4ff, #38bdf8)',
                      boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
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
            7. HOTELIER TESTIMONIALS & SOCIAL PROOF
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              Trusted by 500+ Properties
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Loved by General Managers & Owners.
            </h2>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Discover why heritage palaces, beachfront resorts, and boutique luxury hotels rely on GuestFlow every day.
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
                    <div className="text-[11px] text-cyan-300 font-medium">
                      {t.role} • {t.property}
                    </div>
                    <div className="text-[10px] text-slate-400">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            8. WHITE-GLOVE HOTEL ONBOARDING & SETUP GUARANTEE
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 rounded-3xl overflow-hidden relative"
            style={{
              background: 'radial-gradient(ellipse at top left, rgba(0, 200, 255, 0.12), rgba(10, 16, 32, 0.95))',
              border: '1px solid rgba(0, 200, 255, 0.25)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Headphones className="w-3.5 h-3.5" /> White-Glove Hotel Onboarding
              </div>

              <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                We Setup Your Entire Property. <br />
                <span className="text-cyan-400">Zero Technical Effort Required.</span>
              </h3>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Our hospitality engineers digitize your full room inventory, link your OTA channels, configure keycard encoders and printers, and conduct live interactive training with your front-desk and housekeeping teams.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {[
                  'Free Room Inventory & Rate Plan Setup',
                  'Live 1-on-1 Front Desk Staff Training',
                  '2-Way OTA Channel Manager Activation',
                  'Keycard Encoders & Thermal Printers Setup',
                  'Dedicated WhatsApp GM Support Group',
                  'Full Historical Guest Data Migration',
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
                  <span>Talk to a Hospitality Onboarding Specialist</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl">
                <Image
                  src="/images/website/contact-team.png"
                  alt="GuestFlow Dedicated Hospitality Support Team"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            9. HOTEL FAQ ACCORDION
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-cyan-400 block mb-3">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions by Hoteliers.
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
            10. GRAND HOTEL FINALE CALL TO ACTION
        ════════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center relative overflow-hidden">
          <div
            className="p-10 sm:p-16 rounded-3xl relative overflow-hidden backdrop-blur-2xl"
            style={{
              background:
                'linear-gradient(135deg, rgba(0, 200, 255, 0.15), rgba(10, 16, 32, 0.95), rgba(99, 102, 241, 0.15))',
              border: '1px solid rgba(0, 200, 255, 0.35)',
              boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(0, 200, 255, 0.15)',
            }}
          >
            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-cyan-400 block mb-4">
                Join 500+ Top Hotels & Luxury Resorts
              </span>

              <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-6">
                Ready to Upgrade Your Hotel to the{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                  Ultimate Hospitality OS?
                </span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
                Start your free 14-day trial today. No credit card required. Experience faster check-ins, automated OTA sync, live housekeeping dispatch, and zero inventory leakage.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-sm text-slate-950 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95 shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, #00d4ff, #00f2fe)',
                    boxShadow: '0 0 35px rgba(0, 212, 255, 0.45)',
                  }}
                >
                  <span>Start Free 14-Day Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/contact"
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 backdrop-blur-md transition-all duration-200 hover:bg-white/10"
                  style={{
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                  }}
                >
                  <span>Schedule Private Hotel Walkthrough</span>
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
