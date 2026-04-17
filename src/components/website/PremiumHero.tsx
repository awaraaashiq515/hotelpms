'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function PremiumHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-[#fcf0f2] to-white pt-20 pb-20 lg:pt-32 lg:pb-32">
      
      {/* Soft radial glow in the center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#fae5e8]/50 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
        
        {/* Left: Text Content */}
        <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
          <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-semibold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Simply Smarter<br className="hidden lg:block" /> Dining.<br />
            Effortless<br className="hidden lg:block" /> Hospitality.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 font-medium mb-8 max-w-xl leading-relaxed">
            The beautifully intuitive POS for modern restaurants. Speed up your service, manage orders, and grow your business.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button className="px-8 py-4 bg-pos-primary text-white rounded-full font-semibold hover:bg-pos-primary/90 transition-all shadow-lg shadow-pos-primary/25">
              Start Free Trial
            </button>
            <button className="px-8 py-4 bg-white text-slate-700 rounded-full font-semibold hover:bg-slate-50 transition-all border border-slate-200 shadow-sm">
              Book a Demo
            </button>
          </div>
        </div>

        {/* Right: Clear, Crisp Image Presentation */}
        <div className="flex-1 w-full max-w-xl lg:max-w-none relative mt-8 lg:mt-0">
          <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/80 bg-white/50 backdrop-blur-sm p-2">
            <div className="rounded-xl md:rounded-[1.5rem] overflow-hidden bg-slate-100">
               <img 
                 src="/images/website/hero.png" 
                 alt="OrderMint POS" 
                 className="w-full h-auto object-cover"
                 onError={(e) => {
                   (e.target as HTMLImageElement).src = '/images/website/dashboard.png';
                 }}
               />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
