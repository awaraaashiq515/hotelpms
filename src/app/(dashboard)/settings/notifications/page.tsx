'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  ShoppingBag, 
  CreditCard, 
  HandCoins, 
  Package, 
  Utensils, 
  TrendingDown, 
  Layers, 
  CalendarDays, 
  Star, 
  Undo2, 
  XCircle, 
  FileText,
  ShieldCheck,
  Save,
  BellRing
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Preference {
  type: string;
  isEnabled: boolean;
  soundEnabled: boolean;
}

const NOTIFICATION_TYPES = [
  { 
    type: 'ORDER', 
    label: 'New Order Alerts', 
    description: 'Notifications when a new order is placed from a table or counter.',
    icon: ShoppingBag,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30'
  },
  { 
    type: 'PAYMENT', 
    label: 'Payment Received', 
    description: 'Alerts when a bill is successfully settled by a customer.',
    icon: CreditCard,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30'
  },
  { 
    type: 'ASSISTANCE', 
    label: 'Table Assistance', 
    description: 'Urgent alerts when a customer calls for a waiter or requests a bill.',
    icon: BellRing,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-950/30'
  },
  { 
    type: 'KOT', 
    label: 'Kitchen Updates', 
    description: 'Notifications for KOT generation, modifications, and status changes.',
    icon: Utensils,
    color: 'text-orange-500',
    bg: 'bg-orange-50 dark:bg-orange-950/30'
  },
  { 
    type: 'INVENTORY', 
    label: 'Inventory Alerts', 
    description: 'Low stock warnings and inventory adjustment notifications.',
    icon: Package,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30'
  },
  { 
    type: 'EXPENSE', 
    label: 'Expense Logs', 
    description: 'Notifications when a new business expense is recorded.',
    icon: TrendingDown,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-950/30'
  },
  { 
    type: 'DAY_CLOSING', 
    label: 'Day/Shift Closing', 
    description: 'Alerts when a shift or business day is officially closed.',
    icon: Layers,
    color: 'text-purple-500',
    bg: 'bg-purple-50 dark:bg-purple-950/30'
  },
  { 
    type: 'TABLE_RESERVATION', 
    label: 'New Bookings', 
    description: 'Notifications for new table reservations and advance bookings.',
    icon: CalendarDays,
    color: 'text-cyan-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30'
  },
  { 
    type: 'RATING', 
    label: 'Customer Feedback', 
    description: 'Alerts when a customer leaves a rating or review for their order.',
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30'
  },
  { 
    type: 'REFUND', 
    label: 'Refund Alerts', 
    description: 'Notifications when a transaction is refunded or reversed.',
    icon: Undo2,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30'
  },
  { 
    type: 'CANCEL_ITEM', 
    label: 'Item Cancellations', 
    description: 'Alerts when an item is cancelled from an active order.',
    icon: XCircle,
    color: 'text-slate-500',
    bg: 'bg-slate-100 dark:bg-slate-800/50'
  },
  { 
    type: 'VOUCHER', 
    label: 'Voucher Alerts', 
    description: 'Notifications for manual journal vouchers and accounting entries.',
    icon: FileText,
    color: 'text-teal-500',
    bg: 'bg-teal-50 dark:bg-teal-950/30'
  },
];

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<Record<string, Preference>>({});
  const [loading, setLoading] = useState(true);
  const [savingType, setSavingType] = useState<string | null>(null);

  useEffect(() => {
    fetchPrefs();
  }, []);

  const fetchPrefs = async () => {
    try {
      const res = await fetch('/api/settings/notifications');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const prefsMap: Record<string, Preference> = {};
        json.data.forEach((p: any) => {
          prefsMap[p.type] = p;
        });
        setPreferences(prefsMap);
      } else {
        console.error('API Error:', json.message);
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const togglePref = async (type: string, field: 'isEnabled' | 'soundEnabled') => {
    const current = preferences[type] || { type, isEnabled: true, soundEnabled: true };
    const updated = { ...current, [field]: !current[field] };
    
    // Optimistic update
    setPreferences(prev => ({ ...prev, [type]: updated }));
    setSavingType(type + field);

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        console.error('Failed to update preference:', json.message);
        // Rollback if failed
        setPreferences(prev => ({ ...prev, [type]: current }));
        alert(`Failed to save: ${json.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Network error during preference update:', err);
      setPreferences(prev => ({ ...prev, [type]: current }));
      alert('Network error. Please try again.');
    } finally {
      setSavingType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pos-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">App Notification Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage which alerts you want to see and hear across the system.</p>
        </div>
        <div className="bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-full flex items-center gap-2 text-xs font-black uppercase">
          <ShieldCheck size={16} />
          Property Level Configuration
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {NOTIFICATION_TYPES.map((notif, index) => {
          const pref = preferences[notif.type] || { type: notif.type, isEnabled: true, soundEnabled: true };
          const isSavingNotif = savingType === notif.type + 'isEnabled';
          const isSavingSound = savingType === notif.type + 'soundEnabled';

          return (
            <motion.div
              key={notif.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${notif.bg} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                    <notif.icon className={`${notif.color}`} size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-base">{notif.label}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-[200px]">{notif.description}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Notification Toggle */}
                <div className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${pref.isEnabled ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-950/10 dark:border-indigo-900/30' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${pref.isEnabled ? 'text-indigo-600' : 'text-slate-400'}`}>
                      Alerts
                    </span>
                    <button 
                      onClick={() => togglePref(notif.type, 'isEnabled')}
                      disabled={isSavingNotif}
                      className={`relative w-10 h-5 rounded-full transition-all duration-300 ${pref.isEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'} ${isSavingNotif ? 'opacity-50' : ''}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${pref.isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {pref.isEnabled ? <Bell size={14} className="text-indigo-500" /> : <Bell size={14} className="text-slate-400" />}
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{pref.isEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>

                {/* Sound Toggle */}
                <div className={`p-4 rounded-2xl border transition-all flex flex-col gap-3 ${pref.isEnabled && pref.soundEnabled ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-950/10 dark:border-emerald-900/30' : 'bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800'} ${!pref.isEnabled ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${pref.isEnabled && pref.soundEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                      Sound
                    </span>
                    <button 
                      onClick={() => togglePref(notif.type, 'soundEnabled')}
                      disabled={isSavingSound || !pref.isEnabled}
                      className={`relative w-10 h-5 rounded-full transition-all duration-300 ${pref.soundEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'} ${isSavingSound ? 'opacity-50' : ''}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${pref.soundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {pref.soundEnabled ? <Volume2 size={14} className="text-emerald-500" /> : <VolumeX size={14} className="text-slate-400" />}
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{pref.soundEnabled ? 'Sound ON' : 'Muted'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
