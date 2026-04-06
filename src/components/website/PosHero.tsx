'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, CheckCircle, BarChart3, ShieldCheck, Zap, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { CardContainer, CardBody, CardItem } from '@/components/ui/three-d-card';
import { cn } from '@/lib/utils';

export const PosHero = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 20 },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden bg-[#fefefe] selection:bg-pos-primary/30">
      {/* Premium 3D Background Elements */}
      <div className="absolute top-0 inset-0 overflow-hidden pointer-events-none">
        {/* Animated Mesh Gradient */}
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[70%] bg-gradient-to-br from-pos-primary/15 via-pos-accent/20 to-transparent rounded-full blur-[120px] animate-pulse duration-[8s]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[60%] bg-gradient-to-tr from-pos-accent/20 via-pos-primary/10 to-transparent rounded-full blur-[100px] animate-pulse duration-[10s]" />
        
        {/* Subtle Grid Pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150" />
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" 
          style={{ maskImage: 'radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center z-10">
        {/* Left Content - Animated with Framer Motion */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-8"
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism border border-pos-primary/20 text-pos-primary text-xs font-bold uppercase tracking-widest">
              <Sparkles size={14} className="text-pos-primary animate-pulse" />
              The Future of Restaurant Management
            </div>
          </motion.div>
          
          <motion.h1 
            variants={itemVariants}
            className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]"
          >
            A Smart POS <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c47878] via-pos-primary to-pos-primary-light">
              Built for Growth.
            </span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-xl text-slate-600 leading-relaxed max-w-lg font-medium"
          >
            Elevate your hospitality business with a cloud-based solution that combines powerful analytics with effortless simplicity.
          </motion.p>
          
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap gap-5"
          >
            <Link 
              href="/contact" 
              className="group relative px-8 py-5 bg-pos-primary text-white rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_20px_40px_-15px_rgba(99,102,241,0.5)] hover:shadow-[0_25px_50px_-12px_rgba(99,102,241,0.6)] hover:-translate-y-1 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-[-20deg]" />
              <span className="flex items-center gap-3 relative z-10">
                Start Your Free Trial <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link 
              href="/contact" 
              className="px-8 py-5 bg-white/80 backdrop-blur-md text-slate-800 border-2 border-slate-200 rounded-2xl font-bold text-lg hover:border-pos-primary/40 hover:bg-white hover:text-pos-primary transition-all duration-300 flex items-center gap-3 active:scale-95"
            >
              Watch Demo
            </Link>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            className="flex items-center gap-8 pt-4"
          >
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                <CheckCircle size={14} />
              </div> 
              No Credit Card
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-bold">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
                <CheckCircle size={14} />
              </div> 
              14-Day Free Trial
            </div>
          </motion.div>
        </motion.div>

        {/* Right Content - 3D Card Implementation */}
        <div className="relative">
          <CardContainer className="inter-var">
            <CardBody className="bg-transparent relative group/card w-auto sm:w-[32rem] h-auto rounded-3xl p-0">
              <CardItem
                translateZ="70"
                className="w-full mt-4"
              >
                <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.4)] border-[12px] border-white/60 backdrop-blur-xl">
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent pointer-events-none" />
                  <img 
                    src="/images/website/hero.png" 
                    alt="POS System" 
                    className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </CardItem>

              {/* Floating 3D Stat Card 1 */}
              <CardItem
                translateZ="100"
                translateX={40}
                translateY={-30}
                className="absolute -top-10 -right-6 lg:-right-12 z-20 group-hover/card:shadow-pos-primary/10 transition-all"
              >
                <div className="bg-white/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/50 flex items-center gap-4 min-w-[220px]">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <BarChart3 size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Daily Revenue</p>
                    <p className="text-2xl font-black text-slate-800">$12,450.00</p>
                  </div>
                </div>
              </CardItem>

              {/* Floating 3D Stat Card 2 */}
              <CardItem
                translateZ="120"
                translateX={-50}
                translateY={60}
                className="absolute -bottom-10 -left-6 lg:-left-12 z-20"
              >
                <div className="bg-slate-900/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-slate-800 flex items-center gap-4 min-w-[240px]">
                  <div className="w-14 h-14 bg-pos-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pos-primary/30">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">System Security</p>
                    <p className="text-xl font-bold text-white">Cloud Shield Active</p>
                  </div>
                </div>
              </CardItem>
            </CardBody>
          </CardContainer>
          
          {/* Background Blobs for extra depth behind 3D container */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-pos-primary/10 rounded-full blur-[120px] -z-10" />
        </div>
      </div>
    </section>
  );
};
