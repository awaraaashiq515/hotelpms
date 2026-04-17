'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, CreditCard, User } from 'lucide-react';

export function PremiumFeatures() {
  const features = [
    {
      title: "Elevate\nService",
      description: "Elevate service with innovation. Fast menus, custom modifiers, and a sophisticatedly simple ordering flow.",
      icon: <FileText className="w-5 h-5 text-slate-800" strokeWidth={1.5} />,
      delay: 0.1
    },
    {
      title: "Streamline\nPayments",
      description: "More options, better presentation, and faster reconciliation. Streamline every payment with refined efficiency.",
      icon: <CreditCard className="w-5 h-5 text-slate-800" strokeWidth={1.5} />,
      delay: 0.2
    },
    {
      title: "Master\nHospitality",
      description: "Master hospitality by knowing your guests. Track preferences and build loyalty with minimal UI clutter.",
      icon: <User className="w-5 h-5 text-slate-800" strokeWidth={1.5} />,
      delay: 0.3
    }
  ];

  return (
    <section id="features" className="py-20 bg-white border-t border-slate-100">
      <div className="container mx-auto px-8 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: feature.delay, ease: "easeOut" }}
              className="flex flex-col group"
            >
              {/* Icon - same small square with icon as in mockup */}
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6 shadow-sm">
                {feature.icon}
              </div>

              {/* Title - Large, bold, black with brackets like the mockup */}
              <h3 className="text-3xl md:text-[34px] font-medium text-slate-900 mb-4 leading-[1.1] tracking-tight">
                [{feature.title.split('\n')[0]}<br />{feature.title.split('\n')[1]}]
              </h3>

              {/* Description - small, light */}
              <p className="text-sm text-slate-500 leading-relaxed font-light">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
