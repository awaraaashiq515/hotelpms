'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Smile, 
  TrendingUp, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { CardContainer, CardBody, CardItem } from '@/components/ui/three-d-card';

export const PosBenefits = () => {
  const benefits = [
    {
      title: "Save Time & Money",
      description: "Automate your billing, inventory, and staff management to reduce operational costs and save up to 10 hours a week.",
      icon: <Clock size={28} />,
      color: "from-blue-400 to-indigo-500"
    },
    {
      title: "Increase Revenue",
      description: "Boost your sales by ₹24,000+ per month with our intelligent upselling tools and automated marketing features.",
      icon: <TrendingUp size={28} />,
      color: "from-emerald-400 to-teal-500"
    },
    {
      title: "Happy Customers",
      description: "Delight your customers with faster service, easy contactless payments, and seamless loyalty programs.",
      icon: <Smile size={28} />,
      color: "from-orange-400 to-amber-500"
    }
  ];

  return (
    <section id="benefits" className="py-32 bg-pos-sidebar text-white relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[70%] bg-pos-accent/15 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-pos-primary/20 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] contrast-150" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-12 mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-pos-primary text-xs font-bold uppercase tracking-[0.2em] mb-6">
              <Sparkles size={14} /> Unmatched Value
            </div>
            <h2 className="text-4xl lg:text-6xl font-black mb-6 leading-tight tracking-tight">
              Why Businesses <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pos-primary to-pos-primary-light">Choose OrderMint</span>
            </h2>
            <p className="text-xl text-slate-400 leading-relaxed max-w-lg font-medium">
              We're your dedicated partner in growth, providing high-performance tools for modern scale.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link 
              href="/contact" 
              className="hidden lg:flex px-8 py-4 bg-white text-slate-950 rounded-2xl font-bold text-lg hover:shadow-[0_20px_50px_rgba(255,255,255,0.15)] transition-all duration-300 items-center gap-3 active:scale-95"
            >
              Get Started <ChevronRight size={20} />
            </Link>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
            >
              <CardContainer className="inter-var w-full">
                <CardBody className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-10 group/card transition-all hover:bg-slate-900/80 hover:border-white/10 w-full h-full">
                  <CardItem
                    translateZ="60"
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white mb-8 shadow-2xl group-hover/card:shadow-pos-primary/20 transition-all border border-white/5"
                  >
                    <div className={benefit.color + " text-transparent bg-clip-text"}>
                      {benefit.icon}
                    </div>
                  </CardItem>
                  <CardItem
                    translateZ="80"
                    className="text-2xl font-black mb-4 tracking-tight group-hover/card:text-pos-primary transition-colors"
                  >
                    {benefit.title}
                  </CardItem>
                  <CardItem
                    as="p"
                    translateZ="40"
                    className="text-base text-slate-400 leading-relaxed font-medium group-hover/card:text-slate-300 transition-colors"
                  >
                    {benefit.description}
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
          className="mt-20 lg:hidden flex justify-center"
        >
          <Link 
            href="/contact" 
            className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-bold text-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3"
          >
            Get Started Today <ChevronRight size={24} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
