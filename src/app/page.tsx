'use client';

import React from 'react';
import { motion, Variants } from 'framer-motion';
import { WebsiteHeader } from '@/components/website/Header';
import { PosHero } from '@/components/website/PosHero';
import { PosFeatures } from '@/components/website/PosFeatures';
import { PosBenefits } from '@/components/website/PosBenefits';
import { MapSection } from '@/components/website/MapSection';
import { WebsiteFooter } from '@/components/website/Footer';

export default function RootPage() {
  const sectionReveal: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    },
  };

  return (
    <main className="min-h-screen bg-white selection:bg-pos-primary/30 selection:text-pos-primary">
      {/* 1. Header (Sticky & Transparent logic inside) */}
      <WebsiteHeader />

      {/* 2. Hero Section - Primary 3D Experience */}
      <section>
        <PosHero />
      </section>

      {/* 3. Features Section - Grid of 3D Interactive Cards */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionReveal}
      >
        <PosFeatures />
      </motion.section>

      {/* 4. Benefits Section - Dark Mode Value Prop */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionReveal}
      >
        <PosBenefits />
      </motion.section>

      {/* 5. Location Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionReveal}
      >
        <MapSection />
      </motion.section>
      
      {/* 6. Footer - Professional SaaS Footer */}
      <WebsiteFooter />
    </main>
  );
}
