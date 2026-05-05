'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Users, Sparkles, Target, Rocket } from 'lucide-react';
import Image from 'next/image';

const PINK = '#e8a0a0';
const BG = '#120a08';

const stats = [
  { label: 'Orders Processed', value: '1.2M+' },
  { label: 'Active Outlets', value: '500+' },
  { label: 'Support Uptime', value: '24/7' },
  { label: 'Happy Staff', value: '5000+' },
];

export default function AboutPage() {
  return (
    <main
      className="text-white overflow-x-hidden relative min-h-screen pt-24"
      style={{ background: BG, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Background elements */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full blur-[250px]"
          style={{ background: 'rgba(232,160,160,0.03)' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full blur-[200px]"
          style={{ background: 'rgba(61,24,24,0.15)' }} />
      </div>

      <div className="relative z-10">
        {/* ══ HERO SECTION ═══════════════════════════════════════ */}
        <section className="py-20 lg:py-32 relative">
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
                  Our Mission
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8">
                Revolutionizing <br />
                <span style={{
                  background: `linear-gradient(135deg, ${PINK}, #f5c8c8)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Hospitality Ops.</span>
              </h1>
              <p className="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed">
                OrderMint was born from a simple obsession: to eliminate the friction 
                between the kitchen and the counter. We build software that works 
                at the speed of a high-pressure dinner rush.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ══ STATS SECTION ══════════════════════════════════════ */}
        <section className="py-12 border-y border-white/5">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl md:text-4xl font-black mb-1" style={{ color: PINK }}>{s.value}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ STORY SECTION ══════════════════════════════════════ */}
        <section className="py-32">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="flex-1 space-y-8">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight">The OrderMint <br />Story</h2>
                <div className="space-y-6 text-lg text-white/40 leading-relaxed">
                  <p>
                    It started in a busy kitchen. We saw staff struggling with slow, bulky systems that 
                    added more stress than value. Traditional POS software was outdated, ugly, and disconnected.
                  </p>
                  <p>
                    We decided to fix it. We engineered a cloud-first platform that prioritizes zero-latency 
                    interactions and beautiful, intuitive design. We wanted to build something that 
                    staff actually enjoy using.
                  </p>
                  <p>
                    Today, OrderMint is the backbone of elite restaurants, bars, and hotels worldwide, 
                    providing the precision of enterprise software with the simplicity of a mobile app.
                  </p>
                </div>
              </div>
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-rose-500/10 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/10 p-2 bg-white/5">
                   <Image src="/images/ordermint-hero.png" alt="Our Story" fill className="object-cover rounded-[2.5rem]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ VALUES SECTION ═════════════════════════════════════ */}
        <section className="py-32 relative">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Our Core Values</h2>
              <p className="text-white/40">The principles that drive every line of code we write.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { 
                  icon: <Zap />, 
                  title: "Absolute Speed", 
                  desc: "In a busy restaurant, every millisecond counts. Our system is built for instant responses, zero lag, and total operational flow." 
                },
                { 
                  icon: <Target />, 
                  title: "Cloud Precision", 
                  desc: "Real-time sync ensures your data is always accurate across all devices. Manage your entire business from anywhere in the world." 
                },
                { 
                  icon: <Users />, 
                  title: "User Empowerment", 
                  desc: "We design for the people on the front lines. Our interfaces are intuitive, requiring zero training to achieve mastery." 
                }
              ].map((v, i) => (
                <div key={i} className="p-10 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-8"
                    style={{ background: 'rgba(232,160,160,0.1)', color: PINK }}>
                    <div className="[&>svg]:w-7 [&>svg]:h-7">
                      {v.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{v.title}</h3>
                  <p className="text-white/40 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ VISION SECTION ═════════════════════════════════════ */}
        <section className="py-40 relative text-center overflow-hidden">
          <div className="absolute inset-0 z-0">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[400px] bg-rose-500/5 blur-[120px] rounded-full" />
          </div>
          <div className="container mx-auto px-6 max-w-3xl relative z-10">
            <Rocket className="w-12 h-12 mx-auto mb-8 opacity-20" />
            <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">The Future of <br />Dining is Here.</h2>
            <p className="text-xl text-white/50 leading-relaxed mb-12">
              We're not just building a POS system. We're building the operating 
              system for the next generation of hospitality leaders. Join us on 
              the journey to perfection.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button className="px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-white text-black hover:scale-105 transition-all">
                Join the Team
              </button>
              <button className="px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border border-white/10 hover:bg-white/5 transition-all">
                Our Blog
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
