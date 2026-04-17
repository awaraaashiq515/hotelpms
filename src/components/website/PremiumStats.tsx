'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function PremiumStats() {
  // We repurposed the Stats component into the minimal CTA section for the Light theme
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2.5rem] bg-gradient-to-b from-white to-[#fcf0f2] border border-[#fce4e8] px-8 py-20 text-center overflow-hidden shadow-sm"
        >
          {/* Subtle glow inside the CTA */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-pos-primary/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-6 md:mb-8 leading-tight">
              Experience the future of dining.<br />
              Request a Demo.
            </h2>
            
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-pos-primary text-white rounded-full font-semibold hover:bg-pos-primary/90 transition-colors shadow-xl shadow-pos-primary/20 text-sm md:text-base"
            >
              Book Your Free Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
