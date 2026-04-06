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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { CardContainer, CardBody, CardItem } from '@/components/ui/three-d-card';

export const PosFeatures = () => {
  const features = [
    {
      title: "Smart Billing",
      description: "GST-ready invoicing with support for multiple payment modes and split-billing.",
      icon: <LayoutGrid size={24} />,
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Kitchen Display (KDS)",
      description: "Digitize your kitchen workflow and eliminate paper KOTs for faster service.",
      icon: <Zap size={24} />,
      color: "from-orange-400 to-rose-500"
    },
    {
      title: "Inventory Mastery",
      description: "Track stock levels, manage wastage, and receive low-stock alerts automatically.",
      icon: <Layers size={24} />,
      color: "from-emerald-400 to-teal-600"
    },
    {
      title: "Driver Logistics",
      description: "Manage delivery orders, track drivers, and automate incentive calculations.",
      icon: <Globe size={24} />,
      color: "from-sky-400 to-blue-600"
    },
    {
      title: "GST Compliance",
      description: "Auto-generate GSTR-1 JSON files and GST reports in a single click.",
      icon: <BarChart3 size={24} />,
      color: "from-pink-500 to-rose-600"
    },
    {
      title: "Smart Analytics",
      description: "Gain deep insights into sales, peak hours, and staff performance with visual reports.",
      icon: <Smartphone size={24} />,
      color: "from-cyan-400 to-blue-500"
    }
  ];

  return (
    <section id="features" className="py-32 bg-pos-accent-soft/30 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(122,46,46,0.04)_0,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism border border-pos-primary/10 text-pos-primary text-xs font-bold uppercase tracking-[0.2em] mb-6">
            <Sparkles size={14} /> Powering Innovation
          </div>
          <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-6 tracking-tight">
            Features that Empower <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c47878] to-pos-primary">Your Business</span>
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl leading-relaxed font-medium">
            A comprehensive suite of tools designed to streamline every facet of your operations.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <CardContainer className="inter-var w-full">
                <CardBody className="bg-white relative group/card hover:shadow-2xl hover:shadow-pos-primary/[0.1] border border-slate-200/[0.6] w-full h-auto rounded-[2.5rem] p-8 transition-all">
                  <CardItem
                    translateZ="50"
                    className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-50 text-slate-900 mb-6 shadow-sm border border-slate-100 group-hover/card:bg-pos-primary group-hover/card:text-white transition-colors duration-500"
                  >
                    {feature.icon}
                  </CardItem>
                  <CardItem
                    translateZ="60"
                    className="text-2xl font-black text-slate-900 mb-4 tracking-tight"
                  >
                    {feature.title}
                  </CardItem>
                  <CardItem
                    as="p"
                    translateZ="40"
                    className="text-slate-500 text-base leading-relaxed font-medium"
                  >
                    {feature.description}
                  </CardItem>
                  
                  <CardItem
                    translateZ="20"
                    className="mt-10"
                  >
                    <div className="w-12 h-1.5 rounded-full bg-slate-100 group-hover/card:bg-pos-primary/20 transition-colors" />
                  </CardItem>
                </CardBody>
              </CardContainer>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-24 flex justify-center"
        >
          <Link 
            href="/features" 
            className="group relative px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-bold text-sm uppercase tracking-widest overflow-hidden transition-all hover:bg-pos-primary shadow-2xl shadow-slate-900/20"
          >
            <span className="relative z-10 flex items-center gap-3">
              Explore All Features <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform duration-300" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
