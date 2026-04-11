'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Layers, 
  BarChart3, 
  Smartphone, 
  Globe, 
  LayoutGrid,
  ArrowRight,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export const PosFeatures = () => {
  const features = [
    {
      title: "Smart Billing",
      desc: "GST-ready invoicing with support for multiple payment modes and split-billing.",
      icon: LayoutGrid,
      color: "text-indigo-500 bg-indigo-50"
    },
    {
      title: "Kitchen Display (KDS)",
      desc: "Digitize your kitchen workflow and eliminate paper KOTs for faster service.",
      icon: Zap,
      color: "text-orange-500 bg-orange-50"
    },
    {
      title: "Inventory Mastery",
      desc: "Track stock levels, manage wastage, and receive low-stock alerts automatically.",
      icon: Layers,
      color: "text-blue-500 bg-blue-50"
    },
    {
      title: "Driver Logistics",
      desc: "Manage delivery orders, track drivers, and automate incentive calculations.",
      icon: Globe,
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      title: "GST Compliance",
      desc: "Auto-generate GSTR-1 JSON files and GST reports in a single click.",
      icon: FileText,
      color: "text-pos-primary bg-pos-accent-soft"
    },
    {
      title: "Smart Analytics",
      desc: "Gain deep insights into sales, peak hours, and staff performance with visual reports.",
      icon: BarChart3,
      color: "text-cyan-500 bg-cyan-50"
    }
  ];

  return (
    <section id="features" className="py-32 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
            Powering Innovation
          </div>
          <h2 className="text-5xl lg:text-6xl font-black text-slate-900 mb-6 tracking-tight">
            Features that Empower <br />
            <span className="text-pos-primary-dark opacity-60">Your Business</span>
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl font-bold leading-relaxed">
            A comprehensive suite of tools designed to streamline every facet of your operations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group"
            >
              <div className="p-10 bg-white rounded-[2.5rem] border border-slate-100 hover:border-pos-primary/20 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] transition-all duration-500 h-full flex flex-col items-start text-left relative overflow-hidden">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 ${feature.color} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon size={24} />
                </div>
                
                <h4 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-pos-primary transition-colors">{feature.title}</h4>
                <p className="text-slate-500 font-bold leading-relaxed text-sm">{feature.desc}</p>
                
                <div className="mt-10 h-1 w-10 bg-slate-100 group-hover:bg-pos-primary transition-colors rounded-full" />
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 flex justify-center"
        >
          <Link 
            href="/features" 
            className="group inline-flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-pos-primary shadow-xl"
          >
            Explore All Features <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
