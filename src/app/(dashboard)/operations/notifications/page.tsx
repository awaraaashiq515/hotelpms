"use client";

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Clock, CreditCard, RefreshCcw, Search, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [autoClear, setAutoClear] = useState<string>('off'); // off, 1h, 4h, 12h

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/pos-orders/notifications');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = notifications.filter(n => {
    const matchesSearch = n.message.toLowerCase().includes(search.toLowerCase()) ||
                         n.orderNo.toLowerCase().includes(search.toLowerCase());
    
    if (autoClear === 'off') return matchesSearch;
    
    const hours = parseInt(autoClear);
    const limit = new Date(Date.now() - hours * 60 * 60 * 1000);
    return matchesSearch && new Date(n.timestamp) > limit;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 px-6 py-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">Notifications</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Real-time alerts</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 mr-2">
            <span className="text-[9px] font-black text-slate-400 uppercase px-2">Auto-Clear:</span>
            {['off', '1h', '4h', '12h'].map(opt => (
              <button 
                key={opt}
                onClick={() => setAutoClear(opt)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${autoClear === opt ? 'bg-white dark:bg-slate-700 text-pos-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {opt}
              </button>
            ))}
          </div>

          <button 
            onClick={() => {
              const audio = new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_78383a7589.mp3');
              audio.play().catch(() => alert("Please click anywhere first!"));
              if ('speechSynthesis' in window) { window.speechSynthesis.speak(new SpeechSynthesisUtterance("Sound Test")); }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-100 dark:border-slate-700 whitespace-nowrap"
          >
            <Bell size={14} />
            Test Sound
          </button>
          <button 
            onClick={() => { setLoading(true); fetchNotifications(); }}
            className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-lg hover:text-pos-primary transition-all border border-slate-100 dark:border-slate-700"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        <AnimatePresence mode='popLayout'>
          {filtered.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800"
            >
              <Bell size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-xs text-slate-400 font-bold">No notifications yet</p>
            </motion.div>
          ) : (
            filtered.map((n) => (
              <motion.div
                key={n.id + n.type}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  n.type === 'PAYMENT_RECEIVED' 
                  ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20' 
                  : 'bg-orange-50/30 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/20'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                    n.type === 'PAYMENT_RECEIVED' ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {n.type === 'PAYMENT_RECEIVED' ? <CheckCircle size={18} /> : <CreditCard size={18} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-[11px] font-bold uppercase tracking-wider ${
                        n.type === 'PAYMENT_RECEIVED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'
                      }`}>{n.title}</h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400">
                        {n.orderNo}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
                    <div className="flex items-center gap-1.5 mt-1 opacity-60">
                      <Clock size={10} className="text-slate-400" />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                        {format(new Date(n.timestamp), 'hh:mm:ss a')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-lg font-bold ${n.type === 'PAYMENT_RECEIVED' ? 'text-emerald-600' : 'text-orange-600'}`}>₹{n.amount}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{n.tableName}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
