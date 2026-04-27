'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Monitor, Zap, ArrowRight } from 'lucide-react';

export const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after a short delay for premium feel
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-lg"
        >
          <div className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pos-primary rounded-xl flex items-center justify-center shadow-lg shadow-pos-primary/20">
                <Monitor className="text-white w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm">Install OrderMint POS</h4>
                <p className="text-gray-400 text-xs">Get the proper desktop experience</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-pos-primary hover:bg-pos-primary/90 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              >
                Install Now
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="p-2 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
