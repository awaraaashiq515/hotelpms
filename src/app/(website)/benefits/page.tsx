'use client';

import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  Smile, 
  Target, 
  BarChart2, 
  ShieldCheck, 
  Zap,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const benefits = [
  {
    title: 'Drastically Reduce Wait Times',
    description: 'Our lightning-fast interface allows your staff to take orders and process payments 40% faster than traditional systems.',
    icon: Clock,
    metric: '40% Faster'
  },
  {
    title: 'Maximize Your Profitability',
    description: 'Identify high-margin items and reduce wastage with automated stock tracking and analytics.',
    icon: TrendingUp,
    metric: '25% ROI Increase'
  },
  {
    title: 'Elevate Guest Experience',
    description: 'Provide seamless contactless payments and personalized loyalty rewards that keep customers coming back.',
    icon: Smile,
    metric: '95% Satisfaction'
  },
  {
    title: 'Bulletproof Reliability',
    description: 'Offline mode ensures you never lose an order, even if the internet goes down. Your business stays online, always.',
    icon: ShieldCheck,
    metric: '99.9% Uptime'
  }
];

export default function BenefitsPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative pt-48 pb-24 bg-slate-50 overflow-hidden text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.05),transparent)]" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <span className="text-pos-primary font-bold tracking-[0.4em] uppercase text-xs mb-6 block">
            Why GuestFlow?
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-8">
            The Advantage Your <br />
            <span className="text-pos-primary">Business Deserves</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We don't just provide a POS; we provide a partner for your growth. Explore the measurable benefits of switching to GuestFlow.
          </p>
        </div>
      </section>

      {/* Image Showcase */}
      <section className="pb-24 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="relative rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white group">
          <img 
            src="/images/website/happy-customers.png" 
            alt="Happy Customers" 
            className="w-full h-[600px] object-cover transition-transform duration-[10000ms] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-12 lg:p-20">
            <div className="max-w-2xl space-y-6 text-left">
              <h2 className="text-3xl lg:text-5xl font-bold text-white leading-tight uppercase tracking-tight">
                Built for the <br />
                <span className="text-pos-primary font-black">People Who Power</span> Your Business.
              </h2>
              <p className="text-slate-200 text-lg font-medium leading-relaxed">
                GuestFlow isn't just software. It's a tool that empowers your staff and delights your guests, every single day.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-2 gap-12">
          {benefits.map((b, idx) => (
            <div key={idx} className="p-12 bg-white rounded-[3rem] border border-slate-100 hover:border-slate-300 transition-all shadow-sm flex flex-col gap-8 group">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-pos-primary flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                <b.icon size={32} />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{b.title}</h3>
                  <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-black uppercase rounded-full shadow-sm">
                    {b.metric}
                  </span>
                </div>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl font-bold mb-12 tracking-tight">Trusted by 5,000+ Enterprises Worldwide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 opacity-50">
            <div className="flex items-center justify-center font-black text-2xl uppercase tracking-tighter">ChainBites</div>
            <div className="flex items-center justify-center font-black text-2xl uppercase tracking-tighter">UrbanDine</div>
            <div className="flex items-center justify-center font-black text-2xl uppercase tracking-tighter">ZestoPOS</div>
            <div className="flex items-center justify-center font-black text-2xl uppercase tracking-tighter">CloudKitchen</div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Experience it for yourself.</h2>
          <p className="text-slate-500 font-medium">Join thousands of successful businesses that have transformed their operations with GuestFlow.</p>
          <div className="flex justify-center gap-4 pt-4">
            <Link 
              href="/contact" 
              className="px-10 py-5 bg-pos-primary text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-pos-primary/20 flex items-center gap-3"
            >
              Get Started <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
