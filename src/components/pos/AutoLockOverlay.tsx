'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Key, ArrowLeft, Delete, Loader2, X } from 'lucide-react';

interface AutoLockOverlayProps {
  timeoutMinutes: number; // 0 means disabled
  message?: string;
  bgUrl?: string;
  forceLock?: boolean;
  onUnlock?: () => void;
  pinLength?: number; // actual PIN length from DB
}

export const AutoLockOverlay: React.FC<AutoLockOverlayProps> = ({ 
  timeoutMinutes, 
  message = 'Station Locked', 
  bgUrl,
  forceLock = false,
  onUnlock,
  pinLength = 4
}) => {
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pos_is_locked');
      return saved === 'true';
    }
    return false;
  });
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());

  useEffect(() => {
    if (isLocked) {
      localStorage.setItem('pos_is_locked', 'true');
    } else {
      localStorage.removeItem('pos_is_locked');
    }
  }, [isLocked]);

  useEffect(() => {
    // If timeout is explicitly disabled (0), force unlock
    // We ignore -1 because that means settings are still loading
    if (timeoutMinutes === 0 && isLocked) {
      setIsLocked(false);
    }
  }, [timeoutMinutes, isLocked]);

  useEffect(() => {
    if (forceLock) {
      setIsLocked(true);
      setPin('');
    }
  }, [forceLock]);

  const resetTimer = useCallback(() => {
    if (!isLocked) {
      setLastActivity(Date.now());
    }
  }, [isLocked]);

  useEffect(() => {
    if (timeoutMinutes <= 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMinutes = (now - lastActivity) / 1000 / 60;

      if (diffMinutes >= timeoutMinutes && !isLocked) {
        setIsLocked(true);
        setPin('');
      }
    }, 10000); // Check every 10 seconds

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('touchstart', resetTimer);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [timeoutMinutes, lastActivity, isLocked, resetTimer]);

  const handleKeyPress = useCallback((num: string) => {
    setPin(prev => {
      if (prev.length < pinLength) {
        setError(false);
        return prev + num;
      }
      return prev;
    });
  }, [pinLength]);

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  }, []);

  const handleVerify = useCallback(async () => {
    if (pin.length < 4) return;
    setVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      const data = await res.json();
      if (data.success) {
        setIsLocked(false);
        setPin('');
        setLastActivity(Date.now());
        onUnlock?.();
      } else {
        setError(true);
        setPin('');
      }
    } catch (err) {
      setError(true);
    } finally {
      setVerifying(false);
    }
  }, [pin, onUnlock]);

  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers 0-9
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } 
      // Backspace to delete
      else if (e.key === 'Backspace') {
        handleDelete();
      } 
      // Enter to submit
      else if (e.key === 'Enter') {
        handleVerify();
      } 
      // Escape or 'C' to clear
      else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        setPin('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, handleKeyPress, handleDelete, handleVerify]);

  if (!isLocked) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col items-center justify-center p-6 select-none overflow-hidden"
      >
        {/* Background Wallpaper */}
        {bgUrl && (
          <div className="absolute inset-0">
            <img src={bgUrl} alt="Background" className="w-full h-full object-cover opacity-40 scale-105 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/80 to-slate-900" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" />

        <div className="w-full max-w-md space-y-12 text-center relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <div className="w-20 h-20 bg-pos-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-pos-primary/20 backdrop-blur-md border border-pos-primary/20">
              <Lock className="text-pos-primary animate-pulse" size={32} />
            </div>
            <h1 className="text-3xl font-black text-white uppercase tracking-[0.2em]">{message}</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Inactivity timeout reached. Enter PIN to resume.</p>
          </motion.div>

          <div className="flex justify-center gap-4 mb-8">
            {Array.from({ length: pinLength }, (_, idx) => idx + 1).map((i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  pin.length >= i 
                    ? 'bg-pos-primary border-pos-primary scale-125 shadow-[0_0_15px_rgba(239,68,68,0.5)]' 
                    : error 
                      ? 'border-rose-500 bg-rose-500/20' 
                      : 'border-slate-700 bg-slate-800'
                }`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num.toString())}
                className="w-20 h-20 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-2xl font-black text-white border border-slate-700/50 transition-all active:scale-90 flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPin('')}
              className="w-20 h-20 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-sm font-black uppercase transition-all active:scale-90 flex items-center justify-center"
            >
              Clear
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className="w-20 h-20 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-2xl font-black text-white border border-slate-700/50 transition-all active:scale-90 flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="w-20 h-20 rounded-2xl bg-slate-800/50 hover:bg-slate-700 text-white transition-all active:scale-90 flex items-center justify-center"
            >
              <Delete size={24} />
            </button>
          </div>

          <div className="pt-8">
            <button
              onClick={handleVerify}
              disabled={pin.length < pinLength || verifying}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] transition-all duration-300 shadow-2xl flex items-center justify-center gap-3 ${
                pin.length >= pinLength 
                  ? 'bg-pos-primary text-white scale-105 shadow-pos-primary/40' 
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              {verifying ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Unlock size={24} />
                  <span>Unlock Station</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-rose-500 font-bold uppercase text-[10px] tracking-[0.2em]"
            >
              Incorrect PIN. Access Denied.
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
