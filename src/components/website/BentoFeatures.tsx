'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  BarChart3, 
  Smartphone, 
  Globe, 
  LayoutGrid,
  Database,
  Users,
  ShieldCheck,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { BackgroundStickers } from './BackgroundStickers';

export const BentoFeatures = () => {
  return (
    <section id="bento-features" className="py-32 bg-white relative overflow-hidden">
      <BackgroundStickers />
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-24">
          <h2 className="text-5xl lg:text-8xl font-black text-slate-950 tracking-tighter mb-6">Designed for Depth.</h2>
          <p className="text-xl lg:text-3xl text-slate-500 font-bold max-w-2xl mx-auto">One system. Infinite control. Explore the bento-suite of our core operational modules.</p>
        </div>

        <div className="bento-grid">
          {/* Main Hero Card - Smart Billing (Span 8x2) */}
          <div className="col-span-12 lg:col-span-8 row-span-2 bento-card p-12 bg-gradient-to-br from-[#fdf8f8] to-white border-pos-primary/20">
            <div className="flex flex-col h-full">
              <div className="w-16 h-16 rounded-2xl bg-pos-primary text-white flex items-center justify-center mb-8 shadow-xl shadow-pos-primary/20">
                <LayoutGrid size={32} />
              </div>
              <h3 className="text-4xl font-black text-slate-950 mb-6 tracking-tight">Enterprise Billing Engine</h3>
              <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-md mb-12">
                Speed through checkout with GST-ready invoicing, support for multiple payment modes, and complex split-bill logic built for crowds.
              </p>
              
              <div className="mt-auto grid grid-cols-2 lg:grid-cols-4 gap-4 grayscale opacity-40">
                <CreditCard size={40} />
                <Smartphone size={40} />
                <Globe size={40} />
                <Zap size={40} />
              </div>
            </div>
            
            {/* Visual Abstract Overlay */}
            <div className="absolute top-0 right-0 w-1/2 h-full pattern-hospitality opacity-[0.05] [mask-image:radial-gradient(circle_at_center,black,transparent)]" />
          </div>

          {/* Analytics Pulse (Span 4x2) */}
          <div className="col-span-12 lg:col-span-4 row-span-2 bento-card p-10 bg-slate-950 text-white">
            <div className="flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-pos-primary mb-8 border border-white/10">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Live Pulse Analytics</h3>
              <p className="text-slate-400 font-medium text-sm leading-relaxed mb-10">
                Real-time visibility into sales, peak hours, and staff performance. Data turned into decisions.
              </p>
              
              <div className="mt-auto p-6 bg-white/5 rounded-3xl border border-white/10">
                 <div className="flex items-end gap-2 h-20">
                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        className="flex-1 bg-pos-primary rounded-t-lg"
                      />
                    ))}
                 </div>
              </div>
            </div>
          </div>

          {/* Inventory Card (Span 4x2) */}
          <div className="col-span-12 lg:col-span-4 row-span-2 bento-card p-10 bg-[#fdf8f8]">
             <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6">
                <Database size={28} />
             </div>
             <h3 className="text-2xl font-black text-slate-950 mb-3 tracking-tight">Inventory Mastery</h3>
             <p className="text-slate-500 font-medium text-sm leading-relaxed">
               Track recipes, manage wastage, and set auto-low stock alerts. Real precision for your back-of-house.
             </p>
             <div className="mt-10 pt-10 border-t border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-black uppercase text-slate-400">Stock Status: Healthy</span>
                </div>
             </div>
          </div>

          {/* KOT Widget (Span 4x1) */}
          <div className="col-span-12 lg:col-span-4 row-span-1 bento-card p-8 bg-pos-accent-soft/30 border-pos-primary/10">
             <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-pos-primary shadow-sm">
                   <Zap size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-950 tracking-tight">Tablet KOTs</h4>
                  <p className="text-xs text-slate-500 font-bold">Zero-latency orders.</p>
                </div>
             </div>
          </div>

          {/* GST Widget (Span 4x1) */}
          <div className="col-span-12 lg:col-span-4 row-span-1 bento-card p-8 bg-indigo-50 border-indigo-100">
             <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-sm">
                   <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 className="font-black text-slate-950 tracking-tight">GST Ready</h4>
                  <p className="text-xs text-slate-500 font-bold">Govt. compliant filing.</p>
                </div>
             </div>
          </div>

          {/* Logistics Stage (Span 12x2) */}
          <div className="col-span-12 row-span-2 bento-card p-12 flex flex-col lg:flex-row items-center gap-16 bg-white border-2 border-slate-100 shadow-2xl">
             <div className="flex-1">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-8">
                  <Globe size={32} />
                </div>
                <h3 className="text-4xl font-black text-slate-950 mb-6 tracking-tight">Logistics & Driver Engine</h3>
                <p className="text-lg text-slate-600 font-bold leading-relaxed max-w-md">
                   Dedicated driver tracking, incentive management, and full-stack delivery logistics dashboard built for modern speed.
                </p>
             </div>
             
             <div className="flex-1 w-full bg-[#fdf8f8] rounded-[2.5rem] p-8 border border-slate-200">
                <div className="space-y-4">
                   {[1, 2, 3].map((i) => (
                     <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-slate-100" />
                           <span className="font-bold text-slate-800 text-sm">Driver #{i*42}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase">On Delivery</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
