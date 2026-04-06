'use client';

import React from 'react';
import { 
  Zap, 
  Shield, 
  Globe, 
  BarChart3, 
  Users, 
  LayoutGrid, 
  Layers, 
  Database, 
  Smartphone,
  CheckCircle2
} from 'lucide-react';

// Features are now managed directly in the components below for better categorization

export default function FeaturesPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="relative pt-48 pb-24 bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pos-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10 text-center">
          <span className="text-pos-primary font-bold tracking-[0.4em] uppercase text-xs mb-6 block">
            Powerful Features
          </span>
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-8">
            Engineered for <br />
            <span className="text-pos-primary">Business Efficiency</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            OrderMint provides high-end operational tools designed to eliminate friction and maximize profitability for modern restaurants.
          </p>
        </div>
      </section>

      {/* Categorized Features */}
      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        
        {/* Front-of-House */}
        <div className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-[2px] flex-1 bg-slate-100" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Front-of-House Experience</h2>
            <div className="h-[2px] flex-1 bg-slate-100" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                title: 'Professional Billing', 
                desc: 'Speed through checkout with GST-ready invoicing, split-bill support, and integrated payment modes.', 
                icon: LayoutGrid, 
                color: 'bg-indigo-500/10 text-indigo-500' 
              },
              { 
                title: 'Tablet-First Ordering', 
                desc: 'Empower waitstaff to send KOTs directly from tables via mobile tablets, eliminating distance delays.', 
                icon: Smartphone, 
                color: 'bg-blue-500/10 text-blue-500' 
              },
              { 
                title: 'Table Management', 
                desc: 'Live tracking of table status, reservations, and occupancy to optimize your floor rotation.', 
                icon: Layers, 
                color: 'bg-amber-500/10 text-amber-500' 
              }
            ].map((f, i) => (
              <div key={i} className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-pos-primary transition-all group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${f.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{f.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back-of-House Operations */}
        <div className="mb-32">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-[2px] flex-1 bg-slate-100" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Back-of-House Precision</h2>
            <div className="h-[2px] flex-1 bg-slate-100" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                title: 'Kitchen Display (KDS)', 
                desc: 'Digitize your kitchen workflow. Monitor real-time cooking times and eliminate paper KOT mess.', 
                icon: Zap, 
                color: 'bg-orange-500/10 text-orange-500' 
              },
              { 
                title: 'Inventory Mastery', 
                desc: 'Sophisticated stock tracking with wastage monitoring, low-stock alerts, and recipe management.', 
                icon: Database, 
                color: 'bg-emerald-500/10 text-emerald-500' 
              },
              { 
                title: 'Menu Intelligence', 
                desc: 'Manage departments, infinite categories, and item variants with a single cloud update.', 
                icon: Shield, 
                color: 'bg-slate-500/10 text-slate-500' 
              }
            ].map((f, i) => (
              <div key={i} className="p-10 bg-white rounded-[2.5rem] border border-slate-100 hover:border-pos-primary transition-all group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${f.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{f.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Business Control */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="h-[2px] flex-1 bg-slate-100" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Business Control Center</h2>
            <div className="h-[2px] flex-1 bg-slate-100" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                title: 'GST Compliance', 
                desc: 'Auto-generate GSTR-1 JSON files ready for the government portal. GST reports in one click.', 
                icon: BarChart3, 
                color: 'bg-rose-500/10 text-rose-500' 
              },
              { 
                title: 'Staff & Roles', 
                desc: 'Manage POS staff attendance, performance, and highly granular role permissions.', 
                icon: Users, 
                color: 'bg-cyan-500/10 text-cyan-500' 
              },
              { 
                title: 'Logistics Engine', 
                desc: 'Dedicated driver tracking, incentive management, and delivery logistics dashboard.', 
                icon: Globe, 
                color: 'bg-purple-500/10 text-purple-500' 
              }
            ].map((f, i) => (
              <div key={i} className="p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-pos-primary transition-all group">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${f.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{f.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* Dashboard Preview Section (Retained & Integrated) */}
      <section className="py-24 bg-slate-900 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <span className="text-pos-primary font-bold tracking-[0.4em] uppercase text-xs">
                Insights At Your Fingertips
              </span>
              <h2 className="text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                Enterprise-Grade <br />
                <span className="text-pos-primary text-6xl">Analytics</span> <br />
                As Standard.
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">
                Every OrderMint license comes with our top-tier analytics module. No hidden costs for your business data.
              </p>
              <ul className="space-y-4">
                {['Real-time Revenue Tracking', 'Department Sales Reports', 'GST Summary Exports', 'Daily Expense History'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300 font-bold">
                    <div className="w-6 h-6 rounded-full bg-pos-primary/20 flex items-center justify-center text-pos-primary">
                      <CheckCircle2 size={14} />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-pos-primary/20 blur-[120px] rounded-full" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 transform lg:rotate-2 hover:rotate-0 transition-transform duration-700">
                <img 
                  src="/images/website/dashboard.png" 
                  alt="Analytics Dashboard" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Complete System Module Map */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400 mb-4">Complete System Module Map</h2>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">Everything a Modern Enterprise Needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'Omnichannel Order Sync', 'Offline Mode Support', 'Digital Invoicing (WhatsApp)', 'GST Filing Ready',
              'Multiple Outlets Control', 'Day-Closing Verification', 'Expense Tracking', 'Advanced Department Mapping',
              'Driver Incentives Engine', 'Tablet KOT Workflow', 'Kitchen Display Map', 'Customer Dues Ledger',
              'Loyalty Points Engine', 'Role-Based Permissions', 'GST Settings Support', 'Sales Margin Analytics'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-5 bg-white rounded-2xl shadow-sm border border-slate-100 font-medium text-slate-700 text-xs shadow-pos-primary/5">
                <CheckCircle2 className="text-pos-primary shrink-0" size={16} />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 max-w-5xl mx-auto px-6 text-center">
        <div className="p-16 bg-slate-900 rounded-[4rem] text-white space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-pos-primary/10 blur-[100px]" />
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight relative z-10">
            Ready to bring OrderMint <br /> to your business?
          </h2>
          <div className="flex flex-wrap justify-center gap-4 relative z-10 pt-4">
            <a href="/contact" className="px-10 py-5 bg-white text-slate-900 rounded-3xl font-bold text-sm uppercase tracking-widest hover:bg-pos-primary hover:text-white transition-all shadow-xl">
              Get Started Now
            </a>
            <a href="/contact" className="px-10 py-5 bg-slate-800 text-white rounded-3xl font-bold text-sm uppercase tracking-widest hover:bg-slate-700 transition-all border border-slate-700">
              Schedule A Demo
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
