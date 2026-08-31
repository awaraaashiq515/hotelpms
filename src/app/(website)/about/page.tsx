'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Award, Heart, Leaf, Star, Users, Clock } from 'lucide-react';

const BG      = '#080d18';
const CARD_BG = '#0f172a';
const ROSE    = '#e8a0a0';
const INDIGO  = '#6366f1';

const STATS = [
  { value: '2008', label: 'Founded', icon: Clock },
  { value: '200+', label: 'Luxury Rooms', icon: Star },
  { value: '50K+', label: 'Happy Guests', icon: Users },
  { value: '12',   label: 'Industry Awards', icon: Award },
];

const VALUES = [
  {
    icon: Heart,
    title: 'Genuine Hospitality',
    desc: 'We believe true luxury starts with heartfelt service. Every interaction is crafted with care, warmth and a smile.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  {
    icon: Star,
    title: 'Excellence in Everything',
    desc: 'From the thread count of our linens to the precision of our kitchen — we hold ourselves to the highest standards.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    icon: Leaf,
    title: 'Sustainable Luxury',
    desc: 'We are committed to eco-conscious practices without compromising on the premium experience you deserve.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
];

const TEAM = [
  { name: 'Rajesh Sharma',   role: 'General Manager',        initial: 'R', color: 'bg-sky-500/20 text-sky-400' },
  { name: 'Priya Mehta',     role: 'Director of Operations',  initial: 'P', color: 'bg-violet-500/20 text-violet-400' },
  { name: 'Arjun Kapoor',    role: 'Executive Chef',          initial: 'A', color: 'bg-rose-500/20 text-rose-400' },
  { name: 'Sunita Verma',    role: 'Head of Guest Relations', initial: 'S', color: 'bg-emerald-500/20 text-emerald-400' },
];

const TIMELINE = [
  { year: '2008', title: 'Founded with Vision', desc: 'Opened our doors with a commitment to redefine Indian hospitality.' },
  { year: '2012', title: 'First National Award',  desc: 'Recognised as the Best Boutique Hotel in the region.' },
  { year: '2017', title: 'Major Expansion',        desc: 'Added Spa, Banquet Hall and rooftop dining to our property.' },
  { year: '2021', title: 'Technology Leap',         desc: 'Launched AI-powered smart hotel features and digital concierge.' },
  { year: '2024', title: 'Today & Beyond',           desc: 'Serving 50,000+ guests annually, rated 4.9 stars across platforms.' },
];

export default function AboutPage() {
  return (
    <main style={{ background: BG, color: '#fff', minHeight: '100vh' }}>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full blur-[140px]"
            style={{ background: 'rgba(232,160,160,0.09)' }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
            backgroundSize: '80px 80px',
          }} />
        </div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] mb-6 border"
            style={{ background: 'rgba(232,160,160,0.1)', borderColor: `${ROSE}30`, color: ROSE }}>
            Our Story
          </span>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-6">
            A Legacy of{' '}
            <span style={{ background: `linear-gradient(135deg,${ROSE},#f0c8c8)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Extraordinary
            </span>{' '}
            Hospitality
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: 'rgba(255,255,255,0.45)' }}>
            For over 15 years, we have welcomed guests from around the world, crafting memories that last a lifetime. Our story is one of passion, dedication and an unwavering commitment to excellence.
          </p>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════ */}
      <section className="border-y py-14" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.7)' }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {STATS.map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-black mb-1" style={{ color: ROSE }}>{s.value}</div>
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STORY / MISSION ═══════════════════════════════════════ */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.3em] block mb-3" style={{ color: ROSE }}>Our Mission</span>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                Creating Moments Worth Remembering
              </h2>
              <p className="text-base leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Our mission is simple — to be the hotel that guests never want to leave. We achieve this by combining
                world-class infrastructure with deeply personal, intuitive service.
              </p>
              <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Every decision we make — from hiring our staff to curating our menu — is driven by one question:
                <strong className="text-white"> &quot;Will this delight our guests?&quot;</strong>
              </p>
              <Link href="/contact"
                className="inline-flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all"
                style={{ color: ROSE }}>
                Get in Touch <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              {TIMELINE.map((item, i) => (
                <div key={i} className="flex gap-5 p-4 rounded-2xl border border-slate-800 transition-all hover:border-slate-700"
                  style={{ background: CARD_BG }}>
                  <div className="flex-shrink-0 w-14 text-right">
                    <span className="text-xs font-black" style={{ color: ROSE }}>{item.year}</span>
                  </div>
                  <div className="flex-shrink-0 w-px bg-slate-700 mt-1" />
                  <div>
                    <div className="text-sm font-bold text-white mb-0.5">{item.title}</div>
                    <div className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ VALUES ════════════════════════════════════════════════ */}
      <section className="py-20 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.5)' }}>
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.3em] block mb-3" style={{ color: ROSE }}>What We Stand For</span>
            <h2 className="text-3xl md:text-4xl font-black text-white">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((v, i) => (
              <div key={i} className={`p-7 rounded-2xl border ${v.border} transition-all hover:scale-[1.02]`}
                style={{ background: CARD_BG }}>
                <div className={`w-11 h-11 rounded-xl ${v.bg} ${v.color} flex items-center justify-center mb-5`}>
                  <v.icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-bold text-white mb-3">{v.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TEAM ══════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.3em] block mb-3" style={{ color: ROSE }}>The People Behind the Magic</span>
            <h2 className="text-3xl md:text-4xl font-black text-white">Meet Our Leadership</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {TEAM.map((member, i) => (
              <div key={i} className="text-center p-6 rounded-2xl border border-slate-800 transition-all hover:border-slate-700 hover:scale-[1.03]"
                style={{ background: CARD_BG }}>
                <div className={`w-16 h-16 rounded-2xl ${member.color} flex items-center justify-center mx-auto mb-4 text-2xl font-black`}>
                  {member.initial}
                </div>
                <div className="text-sm font-bold text-white mb-1">{member.name}</div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{member.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════════ */}
      <section className="py-20 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(15,23,42,0.6)' }}>
        <div className="container mx-auto px-6 max-w-xl">
          <h2 className="text-3xl font-black text-white mb-4">Come Be Our Guest</h2>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Experience the hospitality that has delighted thousands of guests. Your story with us starts here.
          </p>
          <Link href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white text-sm font-bold transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg,${INDIGO},#818cf8)`, boxShadow: '0 0 28px rgba(99,102,241,0.3)' }}>
            Book Your Stay <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </main>
  );
}
