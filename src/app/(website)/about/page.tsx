'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { WebsiteHeader } from '@/components/website/Header';
import { PremiumFooter } from '@/components/website/PremiumFooter';
import { Zap, Shield, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-white via-[#fcf0f2] to-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#fae5e8]/50 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-semibold tracking-tight text-slate-900 mb-6"
          >
            Empowering Modern <br className="hidden md:block" />Hospitality.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 font-medium max-w-2xl mx-auto"
          >
            We built OrderMint because we believe restaurant owners deserve software that works as fast as they do. No lag, no clutter, just pure operational speed.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6">
           <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-8">Our Story</h2>
           <div className="space-y-6 text-lg text-slate-600 font-medium leading-relaxed">
             <p>
               OrderMint started with a simple observation: restaurants operate in real-time, but their software doesn't. Traditional POS systems were bulky, slow, and disconnected from the kitchen and delivery logistics.
             </p>
             <p>
               We set out to engineer a platform from the ground up that prioritizes zero-latency interactions and beautiful, intuitive interfaces. We wanted to build a system that staff actually enjoy using, allowing them to focus on what matters most: the guest experience.
             </p>
             <p>
               Today, OrderMint powers high-volume kitchens, scaling franchises, and fine-dining establishments, providing them with the enterprise-grade tools they need without the enterprise-grade complexity.
             </p>
           </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold tracking-tight text-slate-900 mb-4">Our Core Values</h2>
            <p className="text-slate-600 font-medium">The principles that drive every feature we ship.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
             <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-pos-primary/10 text-pos-primary rounded-2xl flex items-center justify-center mb-6">
                  <Zap size={28} />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight mb-4">Zero Latency</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Speed is a feature. In a busy restaurant, every millisecond counts. Our architecture is built to ensure instant responses, from order taking to kitchen display.
                </p>
             </div>
             
             <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                  <Shield size={28} />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight mb-4">Bulletproof Reliability</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Your business can't afford downtime. We employ offline-first architectures and robust syncing to ensure you never miss a sale, even if the internet goes down.
                </p>
             </div>
             
             <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                  <Users size={28} />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 tracking-tight mb-4">User-Centric Design</h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Enterprise software doesn't have to be ugly. We design intuitive, consumer-grade interfaces that require zero training for your staff to master.
                </p>
             </div>
          </div>
        </div>
      </section>
    </main>
  );
}
