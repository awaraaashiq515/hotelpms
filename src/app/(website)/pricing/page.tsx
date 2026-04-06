'use client';

import React from 'react';
import { Check, ArrowRight, Zap, Shield, Globe } from 'lucide-react';
import Link from 'next/link';

const tiers = [
  {
    name: 'Free Forever',
    price: '$0',
    description: 'Join the revolution. OrderMint is completely free to use while we grow together.',
    features: [
      'Unlimited Outlets',
      'Advanced Inventory Management',
      'Real-time Analytics Dashboard',
      '24/7 Priority Support',
      'Customer Loyalty Program',
      'Full API Access',
      'On-site Training (Mandi Region)',
    ],
    cta: 'Start Using For Free',
    popular: true,
  },
];

export default function PricingPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative pt-48 pb-24 bg-slate-50 overflow-hidden text-center">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-pos-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-500/5 blur-[100px] rounded-full" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <span className="text-pos-primary font-black tracking-[0.3em] uppercase text-xs mb-6 block">
            Special Launch Offer
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-8">
            Growth Shouldn't <br />
            <span className="text-pos-primary">Have a Price Tag</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            OrderMint is currently free for all businesses. We're on a mission to empower local businesses in Mandi and beyond.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-24 max-w-4xl mx-auto px-6 lg:px-12 flex justify-center">
        {tiers.map((tier, idx) => (
          <div 
            key={idx} 
            className="relative flex flex-col p-12 rounded-[3.5rem] border bg-slate-900 border-slate-900 text-white shadow-2xl shadow-pos-primary/20 max-w-lg w-full transition-all duration-500 hover:scale-105"
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-3 bg-pos-primary text-white text-xs font-black uppercase tracking-widest rounded-full shadow-xl">
              Limited Time: Free
            </div>
            
            <div className="mb-10 text-center">
              <h3 className="text-2xl font-bold tracking-tight mb-4 text-pos-primary uppercase">
                {tier.name}
              </h3>
              <div className="flex items-baseline justify-center gap-1 mb-6">
                <span className="text-7xl font-bold tracking-tighter">FREE</span>
              </div>
              <p className="text-lg leading-relaxed font-medium text-slate-400">
                {tier.description}
              </p>
            </div>

            <div className="flex-1 space-y-5 mb-12 text-base">
              {tier.features.map((feature, fIdx) => (
                <div key={fIdx} className="flex items-center gap-4">
                  <div className="p-1.5 rounded-full bg-pos-primary/20 text-pos-primary">
                    <Check size={18} />
                  </div>
                  <span className="text-slate-300 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <Link 
              href="/contact"
              className="w-full py-6 rounded-[2rem] text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 bg-pos-primary text-white hover:bg-white hover:text-slate-900 transition-all shadow-xl shadow-pos-primary/30"
            >
              Get Started Now <ArrowRight size={20} />
            </Link>
          </div>
        ))}
      </section>

      {/* FAQ Sneak Peek */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-8 text-left">
            <div className="p-8 bg-white rounded-3xl border border-slate-200">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Can I switch plans later?</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Yes, you can upgrade or downgrade your plan at any time from your dashboard. Changes will be reflected in your next billing cycle.</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-200">
              <h4 className="text-lg font-bold text-slate-900 mb-2">Is there a free trial?</h4>
              <p className="text-slate-500 text-sm leading-relaxed">Yes, we offer a 14-day free trial for our Professional plan so you can experience the full power of OrderMint risk-free.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
