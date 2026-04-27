'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Monitor, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  if (isInstalled) {
    return (
      <div className="flex items-center gap-3 px-8 py-4 bg-green-50 text-green-700 border-2 border-green-100 rounded-2xl font-semibold shadow-sm">
        <CheckCircle2 className="w-6 h-6" />
        <div className="text-left">
          <div className="text-xs opacity-70">Status</div>
          <div>App Installed</div>
        </div>
      </div>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
      whileTap={{ scale: 0.95 }}
      onClick={handleInstallClick}
      className="flex items-center gap-3 px-8 py-4 bg-pos-primary text-white rounded-2xl font-semibold shadow-xl transition-all"
    >
      <Monitor className="w-6 h-6" />
      <div className="text-left">
        <div className="text-xs opacity-70">Install Web App</div>
        <div>Proper Windows App</div>
      </div>
    </motion.button>
  );
};
