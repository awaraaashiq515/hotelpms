'use client';

import React from 'react';
import { VectorBackground } from '@/components/website/VectorBackground';
import { motion } from 'framer-motion';
import {
  Utensils, Beer, Hotel, TrendingUp, Smartphone,
  ArrowRight, Sparkles, CheckCircle2, Shield,
  Zap, BarChart3, Database, Globe, Layers,
  Users, ShoppingCart, Clock, PieChart, QrCode,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// ─── Brand palette ─────────────────────────────────────────────
const PINK = '#e8a0a0';
const PINK_LIGHT = '#f5c8c8';
const BG = '#120a08';
const BROWN_MID = '#3d1818';
const BROWN_SOFT = '#6b2f2f';

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.07)',
  backdropFilter: 'blur(12px)',
};

const primaryBtn: React.CSSProperties = {
  background: `linear-gradient(135deg, ${BROWN_SOFT}, ${BROWN_MID})`,
  boxShadow: `0 0 28px rgba(107,47,47,0.45), inset 0 1px 0 rgba(232,160,160,0.15)`,
  border: `1px solid rgba(232,160,160,0.18)`,
};

const allFeatures = [
  {
    category: "Operations",
    title: "Table & Floor Management",
    desc: "A visual bird's-eye view of your entire venue. Track table status, guest count, and duration in real-time.",
    icon: <Utensils className="w-6 h-6" />,
    points: ["Drag-and-drop floor plans", "Table reservation sync", "VIP guest tagging"],
    img: "/images/pos-mobile-2.png"
  },
  {
    category: "Efficiency",
    title: "Kitchen Display System (KDS)",
    desc: "Eliminate paper KOTs. Route orders to specific kitchen stations and monitor preparation times automatically.",
    icon: <Zap className="w-6 h-6" />,
    points: ["Instant order routing", "Cook-time analytics", "Bump-bar support"],
    img: "/images/ordermint-kds.png"
  },
  {
    category: "Intelligence",
    title: "AI-Powered Analytics",
    desc: "Go beyond sales reports. Get predictive insights on peak hours, menu engineering, and revenue forecasting.",
    icon: <BarChart3 className="w-6 h-6" />,
    points: ["Profitability heatmaps", "Staff performance tracking", "Automated EOD reports"],
    img: "/images/ordermint-analytics.png"
  },
  {
    category: "Inventory",
    title: "Peg-Wise Bar Tracking",
    desc: "The world's most precise inventory system for bars. Track every drop with peg-level accuracy (30/60ml).",
    icon: <Beer className="w-6 h-6" />,
    points: ["Real-time stock alerts", "Recipe-based consumption", "Bottle weight integration"],
    img: "/images/feature-bar.png"
  },
  {
    category: "Core",
    title: "Hybrid Cloud Architecture",
    desc: "Experience the power of a cloud-first system. Your data is always synced, secure, and accessible from any device, anywhere in the world.",
    icon: <Database className="w-6 h-6" />,
    points: ["Real-time Cloud Sync", "Secure Data Encryption", "Global Remote Access"],
    img: "/images/pos-mobile-3.png"
  }
];

const bentoFeatures = [
  { icon: <Shield />, title: "Role-Based Access", desc: "Granular permissions for staff, managers, and owners to ensure maximum security." },
  { icon: <Globe />, title: "Multi-Outlet Sync", desc: "Manage 100+ locations from a single master dashboard with real-time consolidated reports." },
  { icon: <Layers />, title: "Menu Engineering", desc: "Categorize, sub-categorize, and add complex modifiers or add-ons with absolute ease." },
  { icon: <Users />, title: "CRM & Loyalty", desc: "Build deep guest profiles, track visit frequency, and run automated loyalty campaigns." },
  { icon: <ShoppingCart />, title: "Purchase Orders", desc: "Automate raw material requests and vendor payments based on low-stock AI alerts." },
  { icon: <Clock />, title: "Attendance Tracking", desc: "PIN-based or Biometric staff clock-in/out with automated payroll generation." },
  { icon: <Database />, title: "Tax & GST Ready", desc: "Fully compliant with local tax laws, including HSN codes and automated GST reports." },
  { icon: <QrCode />, title: "QR Scan & Order", desc: "Empower guests to order from their own devices, reducing staff load and increasing speed." },
  { icon: <Smartphone />, title: "Digital Receipts", desc: "Send professional bills via WhatsApp or Email, reducing paper waste and costs." },
];

export default function FeaturesPage() {
  return (
    <main
      className="text-white overflow-x-hidden relative min-h-screen pt-20"
      style={{ background: BG, fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full blur-[250px]"
          style={{ background: 'rgba(232,160,160,0.04)' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[200px]"
          style={{ background: 'rgba(61,24,24,0.2)' }} />
      </div>

      <div className="relative z-10">
        {/* ══ HERO SECTION ═══════════════════════════════════════ */}
        <section className="pt-20 pb-20 relative">
          <VectorBackground />
          <div className="container mx-auto px-6 text-center max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
                style={{ background: 'rgba(232,160,160,0.09)', border: '1px solid rgba(232,160,160,0.18)' }}>
                <Sparkles className="w-3 h-3" style={{ color: PINK }} />
                <span className="font-semibold text-[10px] uppercase tracking-[0.25em]" style={{ color: PINK }}>
                  Powering Elite Venues
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                The Most Advanced <br />
                <span style={{
                  background: `linear-gradient(135deg, ${PINK}, ${PINK_LIGHT})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>POS Ecosystem.</span>
              </h1>
              <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
                Explore every tool we've built to help you automate operations, 
                increase transparency, and drive exponential growth.
              </p>
              <div className="flex justify-center gap-4">
                <Link href="/contact" style={primaryBtn} className="px-10 py-4 rounded-2xl font-bold text-sm hover:scale-105 transition-all">
                  Get Started Free
                </Link>
                <button className="px-10 py-4 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  Watch Demo
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ══ MAIN FEATURES GRID ═════════════════════════════════ */}
        <section className="py-20">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="space-y-32">
              {allFeatures.map((feat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className={`flex flex-col lg:flex-row items-center gap-16 ${i % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}
                >
                  <div className="flex-1">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
                      style={{ background: 'rgba(232,160,160,0.1)', color: PINK }}>
                      {feat.icon}
                    </div>
                    <span className="font-bold text-xs uppercase tracking-[0.3em] mb-3 block" style={{ color: PINK }}>
                      {feat.category}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black mb-6 tracking-tight">{feat.title}</h2>
                    <p className="text-lg text-white/40 leading-relaxed mb-8">
                      {feat.desc}
                    </p>
                    <ul className="space-y-4">
                      {feat.points.map((p, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5" style={{ color: '#6ee7b7' }} />
                          <span className="text-white/70 font-medium">{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex-1 relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/10 to-transparent rounded-[3rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <div className="relative rounded-[3rem] overflow-hidden p-1.5"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden">
                        <Image src={feat.img} alt={feat.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ BENTO SECONDARY FEATURES ═══════════════════════════ */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'rgba(232,160,160,0.015)' }} />
          <div className="container mx-auto px-6 max-w-7xl relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">But That's Not All.</h2>
              <p className="text-white/40 max-w-xl mx-auto">
                A complete ecosystem designed to handle every single micro-operation of your business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bentoFeatures.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -5, borderColor: 'rgba(232,160,160,0.2)' } as any}
                  className="p-8 rounded-[2rem] transition-all duration-300"
                  style={cardStyle}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                    style={{ background: 'rgba(255,255,255,0.05)', color: PINK }}>
                    <div className="[&>svg]:w-5 [&>svg]:h-5">
                      {b.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{b.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {b.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA ══════════════════════════════════════════ */}
        <section className="py-40 relative text-center">
          <div className="absolute inset-0 z-0">
            <Image src="/images/ordermint-hero.png" alt="CTA" fill className="object-cover opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#120a08] via-transparent to-[#120a08]" />
          </div>
          <div className="container mx-auto px-6 max-w-3xl relative z-10">
            <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to Transform?</h2>
            <p className="text-xl text-white/50 mb-12">
              Join hundreds of high-performing venues using OrderMint to scale their operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/contact" style={primaryBtn} className="px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">
                Start Your Free Trial
              </Link>
              <Link href="/contact" className="px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all">
                Talk to Sales
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
