'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Apple, Download, ShieldCheck, Zap, Laptop, Loader2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useState, useEffect } from 'react';

export const AppDownloadSection = () => {
  const [fileStatus, setFileStatus] = useState({ 
    windows: false, 
    mac: false, 
    android: false,
    windowsComingSoon: false, 
    macComingSoon: false,
    androidComingSoon: false 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/check-downloads')
      .then(res => res.json())
      .then(data => {
        setFileStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-24 bg-white relative overflow-hidden" id="download">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-pos-primary/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-container px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
          
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-pos-primary/10 text-pos-primary text-sm font-semibold mb-6 border border-pos-primary/20"
            >
              <Zap className="w-4 h-4 mr-2 fill-pos-primary" />
              Next-Gen POS Technology
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight"
            >
              Install <span className="text-pos-primary">OrderMint POS</span> <br /> 
              on your <span className="relative">
                Windows & Android
                <svg className="absolute -bottom-2 left-0 w-full h-2 text-pos-primary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-600 mb-10 max-w-xl leading-relaxed"
            >
              Get a proper experience with lightning-fast billing, hardware integration, and a dedicated app. No browser tabs, no distractions.
            </motion.p>
            
            <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4 mb-8">
              {/* PWA Install Button (The "Proper" Way) */}
              <div className="flex-1 min-w-[280px]">
                <PWAInstallButton />
                <p className="mt-2 text-xs text-gray-400 font-medium ml-2">
                  Recommended for Windows & Android • Instant Setup
                </p>
              </div>

              {/* Alternative Downloads Section */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="h-10 w-px bg-gray-200 hidden sm:block mx-2" />
                
                {/* Mac Download */}
                {fileStatus.macComingSoon ? (
                  <div className="flex items-center gap-2 px-6 py-3 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl text-sm font-bold animate-pulse">
                    <Apple className="w-4 h-4" />
                    Mac (Coming Soon)
                  </div>
                ) : fileStatus.mac ? (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/downloads/ordermint-pos-mac.dmg"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold shadow-sm hover:border-pos-primary/40 transition-all"
                  >
                    <Apple className="w-4 h-4" />
                    macOS
                  </motion.a>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl text-sm font-medium">
                    <Apple className="w-4 h-4" />
                    Mac
                  </div>
                )}

                {/* Android APK */}
                {fileStatus.androidComingSoon ? (
                  <div className="flex items-center gap-2 px-6 py-3 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl text-sm font-bold animate-pulse">
                    <Monitor className="w-4 h-4" />
                    Android (Coming Soon)
                  </div>
                ) : fileStatus.android ? (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/downloads/ordermint-pos.apk"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold shadow-sm hover:border-pos-primary/40 transition-all"
                  >
                    <Monitor className="w-4 h-4" />
                    Android APK
                  </motion.a>
                ) : (
                  <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl text-sm font-medium">
                    <Monitor className="w-4 h-4" />
                    Android
                  </div>
                )}

                {/* Windows EXE */}
                {fileStatus.windowsComingSoon ? (
                  <div className="flex items-center gap-2 px-6 py-3 bg-orange-50 text-orange-600 border border-orange-100 rounded-xl text-sm font-bold animate-pulse">
                    <Download className="w-4 h-4" />
                    Win EXE (Coming Soon)
                  </div>
                ) : fileStatus.windows ? (
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="/downloads/ordermint-pos-windows.exe"
                    className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl text-sm font-bold shadow-sm hover:border-pos-primary/40 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    EXE Installer
                  </motion.a>
                ) : (
                  <div className="group relative">
                    <div className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl text-sm font-medium cursor-help">
                      <Download className="w-4 h-4" />
                      Windows EXE
                    </div>
                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50">
                      Use "Install Web App" button above (Recommended)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6 text-sm text-gray-500 font-medium"
            >
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Secure Installation
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Instant Updates
              </div>
            </motion.div>
          </div>
          
          {/* Visual Content / App Preview */}
          <div className="flex-1 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              {/* Modern Mockup Frame */}
              <div className="bg-gray-900 p-1.5 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-white/10">
                <div className="bg-white rounded-[2.2rem] overflow-hidden border border-gray-800/20">
                  {/* Title bar mockup */}
                  <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <div className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">OrderMint POS v2.0</div>
                    <div className="w-12" />
                  </div>
                  
                  <img 
                    src="/images/website/dashboard.png" 
                    alt="OrderMint POS Dashboard" 
                    className="w-full aspect-video object-cover"
                  />
                </div>
              </div>

              {/* Floating elements for premium look */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -left-10 bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-pos-primary/10 rounded-xl flex items-center justify-center">
                  <Laptop className="text-pos-primary w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Installed On</div>
                  <div className="text-sm font-extrabold text-gray-900">Windows 11</div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-pos-primary/10 rounded-full blur-[100px] -z-10" />
          </div>

        </div>
      </div>
    </section>
  );
};
