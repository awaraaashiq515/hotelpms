'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bed, Calendar, DoorOpen, MapPin, BrushIcon, Wrench, Shirt,
  ChefHat, Sparkles, Users, Crown, TrendingUp, Globe, BarChart3,
  Receipt, Moon, Banknote, Package, ShoppingCart, Building2,
  Brain, Wifi, Shield, Settings, CheckCircle2, ArrowRight,
} from 'lucide-react';

const BG      = '#080d18';
const CARD_BG = '#0f172a';
const ROSE    = '#e8a0a0';
const INDIGO  = '#6366f1';

const FEATURE_SECTIONS = [
  {
    title: 'Front Office & Reservations',
    emoji: '🏨',
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    dot: 'bg-sky-400',
    features: [
      { icon: Bed,      name: 'Smart Booking Manager',   desc: 'Effortlessly manage all reservations with real-time availability and automated confirmations.' },
      { icon: Calendar, name: 'Live Room Calendar',      desc: 'Visual drag-and-drop calendar to view, update and shift bookings instantly.' },
      { icon: DoorOpen, name: 'Express Check-Out',       desc: 'Streamlined checkout terminal with folio review, payment capture and digital receipts.' },
      { icon: MapPin,   name: 'Room Status Board',       desc: 'Real-time room status dashboard — clean, occupied, maintenance, and more.' },
    ],
  },
  {
    title: 'Housekeeping & Maintenance',
    emoji: '🛏️',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    dot: 'bg-violet-400',
    features: [
      { icon: BrushIcon, name: 'Housekeeping Console',   desc: 'Assign, track and verify room cleaning tasks in real time across all floors.' },
      { icon: Wrench,    name: 'Maintenance Control',    desc: 'Log, prioritise and resolve maintenance requests with staff assignment workflows.' },
      { icon: Shirt,     name: 'Laundry Management',     desc: 'Track guest laundry requests, timelines and delivery status.' },
      { icon: Package,   name: 'Lost & Found Registry',  desc: 'Digital log for lost items with guest notification and claim tracking.' },
    ],
  },
  {
    title: 'Dining & Guest Services',
    emoji: '🍽️',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    dot: 'bg-rose-400',
    features: [
      { icon: ChefHat,  name: 'Room Service Dining',     desc: 'Digital in-room dining with order tracking, KOT routing and real-time updates.' },
      { icon: Sparkles, name: 'Spa & Wellness',          desc: 'Appointment booking, treatment tracking and therapist management.' },
      { icon: Users,    name: 'Guest CRM Profiles',      desc: 'Comprehensive guest profiles with stay history, preferences, and loyalty points.' },
      { icon: Crown,    name: 'Loyalty & Rewards',       desc: 'Points-based loyalty system with tiers, perks and redemption management.' },
    ],
  },
  {
    title: 'Revenue & Analytics',
    emoji: '📈',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
    features: [
      { icon: TrendingUp, name: 'AI Revenue Advisor',    desc: 'AI-powered pricing recommendations based on demand forecasting and market trends.' },
      { icon: Globe,      name: 'Channel Manager',       desc: 'Sync rates and availability across OTAs — Booking.com, Expedia, Airbnb and more.' },
      { icon: BarChart3,  name: 'Analytics & BI',        desc: 'Deep business intelligence dashboards with occupancy, RevPAR and revenue metrics.' },
      { icon: Receipt,    name: 'Night Audit Console',   desc: 'Automated night audit with financial reconciliation and end-of-day reporting.' },
    ],
  },
  {
    title: 'Finance & Procurement',
    emoji: '💰',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
    features: [
      { icon: Receipt,      name: 'Folios & Billing',     desc: 'Master folios with room charges, dining, spa and all ancillary revenue consolidated.' },
      { icon: Banknote,     name: 'Expenses Controller',  desc: 'Track operational expenses by department with budget vs actual comparisons.' },
      { icon: ShoppingCart, name: 'Purchase Orders',      desc: 'Digital PO management with supplier tracking and delivery confirmations.' },
      { icon: Building2,    name: 'Vendor Directory',     desc: 'Centralised vendor database with contacts, contracts and payment terms.' },
    ],
  },
  {
    title: 'AI & Smart Technology',
    emoji: '🤖',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    dot: 'bg-indigo-400',
    features: [
      { icon: Brain,   name: 'AI Concierge Desk',        desc: 'Intelligent virtual concierge that handles guest queries, bookings and recommendations 24/7.' },
      { icon: Wifi,    name: 'Smart Hotel IoT',          desc: 'Integrate and control in-room IoT devices — lights, AC, curtains and more.' },
      { icon: Shield,  name: 'Security Center',          desc: 'Centralised security management with access control, CCTV integration and incident logs.' },
      { icon: Settings,name: 'Hotel Settings',           desc: 'Full property configuration — room types, rates, policies and system preferences.' },
    ],
  },
];

const BENEFITS = [
  'Real-time sync across all departments',
  'Cloud-hosted with 99.9% uptime guarantee',
  'Mobile-first staff and guest apps',
  'Automated GST billing and compliance',
  'OTA channel management built-in',
  'AI-driven pricing and revenue optimization',
  '24/7 dedicated support team',
  'Seamless payment gateway integration',
];

export default function FeaturesPage() {
  return (
    <main style={{ background: BG, color: '#fff', minHeight: '100vh' }}>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px]"
            style={{ background: 'rgba(99,102,241,0.12)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
        </div>
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-6 border"
            style={{ background: 'rgba(232,160,160,0.1)', borderColor: `${ROSE}30`, color: ROSE }}>
            Full Feature Suite
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-5">
            Everything Your Hotel{' '}
            <span style={{ background: `linear-gradient(135deg,${ROSE},#f0c8c8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Needs to Thrive
            </span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>
            From front desk to back office — a complete Hotel Management System built for modern hospitality operations.
          </p>
        </div>
      </section>

      {/* ══ FEATURE SECTIONS ══════════════════════════════════════ */}
      <section className="pb-24">
        <div className="container mx-auto px-6 max-w-6xl space-y-20">
          {FEATURE_SECTIONS.map((section) => (
            <div key={section.title}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-8">
                <span className={`w-2.5 h-2.5 rounded-full ${section.dot}`} />
                <span className="text-2xl">{section.emoji}</span>
                <h2 className={`text-sm font-bold uppercase tracking-widest ${section.color}`}>{section.title}</h2>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              {/* Feature cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {section.features.map((feat) => (
                  <div key={feat.name}
                    className={`group p-5 rounded-2xl border ${section.border} transition-all duration-300 hover:scale-[1.02]`}
                    style={{ background: CARD_BG }}>
                    <div className={`w-10 h-10 rounded-xl ${section.bg} ${section.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <feat.icon className="w-4.5 h-4.5" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2 leading-tight">{feat.name}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{feat.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ BENEFITS ══════════════════════════════════════════════ */}
      <section className="py-20 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.6)' }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] block mb-3" style={{ color: ROSE }}>Why GuestFlow</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Built for Serious Hoteliers</h2>
              <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Every feature is designed around real hotel workflows, not just checkboxes. We understand hospitality.
              </p>
              <Link href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-bold transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg,${INDIGO},#818cf8)`, boxShadow: '0 0 24px rgba(99,102,241,0.3)' }}>
                Get a Free Demo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {BENEFITS.map((b, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-800" style={{ background: CARD_BG }}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#34d399' }} />
                  <span className="text-sm text-slate-300">{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
