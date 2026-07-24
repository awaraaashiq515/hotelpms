'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface MaintenanceViewProps {
  hotelName?: string;
  logoUrl?: string;
}

export function MaintenanceView({ hotelName = "GuestFlow", logoUrl }: MaintenanceViewProps) {
  const brandPink = '#e8a0a0';
  const brandBg = '#120a08';
  const pinkLight = '#f5c8c8';

  return (
    <div 
      className="min-h-screen w-full flex flex-col justify-between items-center text-white relative px-6 overflow-hidden"
      style={{ background: brandBg, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Ambient glows */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[160px] animate-pulse"
          style={{ background: 'rgba(232,160,160,0.06)', animationDuration: '6s' }} 
        />
        <div 
          className="absolute bottom-10 right-10 w-[350px] h-[350px] rounded-full blur-[140px]"
          style={{ background: 'rgba(61,24,24,0.3)' }} 
        />
      </div>

      {/* Top Section: Branding / Logo */}
      <div className="pt-12 z-10 w-full max-w-5xl flex justify-center">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={hotelName} 
            className="h-10 w-auto object-contain transition-transform duration-300 hover:scale-105" 
          />
        ) : (
          <div className="flex items-center gap-2">
            <span 
              className="text-xl font-black italic tracking-tighter"
              style={{
                background: `linear-gradient(135deg, ${brandPink} 0%, ${pinkLight} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {hotelName}
            </span>
          </div>
        )}
      </div>

      {/* Main Center Card: Glassmorphic Maintenance Status */}
      <div className="my-auto z-10 flex flex-col items-center max-w-xl text-center">
        {/* Animated Construction / Sparkle Ring */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative w-28 h-28 rounded-full flex items-center justify-center mb-8"
          style={{ 
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.37)'
          }}
        >
          {/* Pulsing ring inside */}
          <div 
            className="absolute inset-2 rounded-full border border-dashed animate-spin"
            style={{ borderColor: `${brandPink}55`, animationDuration: '20s' }}
          />
          {/* Animated gear or icon inside */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          >
            <Sparkles className="w-10 h-10" style={{ color: brandPink }} />
          </motion.div>
        </motion.div>

        {/* Text Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4 px-6"
        >
          <div 
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full"
            style={{ 
              background: 'rgba(232,160,160,0.08)', 
              border: '1px solid rgba(232,160,160,0.18)' 
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ background: brandPink }} />
            <span className="font-bold text-[9px] uppercase tracking-[0.25em]" style={{ color: brandPink }}>
              Scheduled System Upgrade
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-[-0.03em] leading-[1.1] text-white">
            We are <br />
            <span 
              style={{
                background: `linear-gradient(135deg, ${brandPink} 0%, ${pinkLight} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Upgrading.
            </span>
          </h1>

          <p className="text-sm md:text-base leading-relaxed max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.48)' }}>
            We're performing a quick scheduled update to bring you new features, improved stability, and a faster experience. We'll be back online in a few minutes!
          </p>
        </motion.div>

        {/* Live Support Help Info */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-5 rounded-2xl w-full"
          style={{ 
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.04)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-1">Need Urgent Help?</span>
          <p className="text-xs font-semibold text-slate-350">
            For urgent POS support, reach us at <span style={{ color: pinkLight }}>support@guestflow.com</span>
          </p>
        </motion.div>
      </div>

      {/* Bottom Footer & Discreet Staff Bypass Link */}
      <div className="pb-12 z-10 w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 pt-8 text-[11px] font-bold uppercase tracking-widest text-slate-500">
        <div>
          &copy; {new Date().getFullYear()} {hotelName}. All Rights Reserved.
        </div>
        
        {/* Discreet link for staff to log in and access internal dashboard */}
        <Link 
          href="/login" 
          className="group flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-300 hover:text-white bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10"
        >
          <ShieldAlert className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: brandPink }} />
          <span>Staff Portal</span>
          <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
