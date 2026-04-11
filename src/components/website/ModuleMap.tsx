'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';

export const ModuleMap = () => {
  const modules = [
    'Omnichannel Order Sync', 'Offline Mode Support', 'Digital Invoicing (WhatsApp)', 'GST Filing Ready',
    'Multiple Outlets Control', 'Day-Closing Verification', 'Expense Tracking', 'Advanced Department Mapping',
    'Driver Incentives Engine', 'Tablet KOT Workflow', 'Kitchen Display Map', 'Customer Dues Ledger',
    'Loyalty Points Engine', 'Role-Based Permissions', 'GST Settings Support', 'Sales Margin Analytics'
  ];

  return (
    <section className="py-32 bg-slate-950 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full pattern-hospitality opacity-[0.05] contrast-150 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-pos-primary/10 blur-[140px] rounded-full" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-20">
        <h2 className="text-4xl lg:text-5xl font-black text-white tracking-tighter mb-6">Complete OS Ecosystem</h2>
        <p className="text-lg font-bold text-slate-400">Everything a high-performance hospitality enterprise needs.</p>
      </div>

      <div className="flex flex-col gap-6 w-full group">
        {/* Row 1 - Right to Left */}
        <div className="flex gap-4 animate-marquee whitespace-nowrap overflow-hidden py-2 hover:[animation-play-state:paused]">
          {[...modules, ...modules].map((item, idx) => (
            <div key={idx} className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full text-white font-black text-xs shadow-2xl transition-all hover:bg-pos-primary group-hover:opacity-40 hover:!opacity-100">
              <CheckCircle2 size={16} className="text-pos-primary" />
              {item}
            </div>
          ))}
        </div>

        {/* Row 2 - Left to Right */}
        <div className="flex gap-4 animate-marquee-reverse whitespace-nowrap overflow-hidden py-2 hover:[animation-play-state:paused]">
          {[...modules, ...modules].map((item, idx) => (
            <div key={idx} className="inline-flex items-center gap-3 px-8 py-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full text-white font-black text-xs shadow-2xl transition-all hover:bg-pos-primary group-hover:opacity-40 hover:!opacity-100">
              <CheckCircle2 size={16} className="text-pos-primary" />
              {item}
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 40s linear infinite;
        }
      `}</style>
    </section>
  );
};
