"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CreditCard, 
  HandCoins, 
  AlertCircle, 
  CheckCircle2, 
  Trash2,
  Table as TableIcon,
  Layers,
  ShoppingBag,
  BellRing,
  FileText,
  ReceiptIndianRupee,
  Utensils,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  priority: string;
  metadata: string | null;
  createdAt: string;
}

export function NotificationOverlay() {
  const [mounted, setMounted] = useState(false);
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({}); // type -> soundEnabled
  const pathname = usePathname();
  const seenIds = React.useRef<Set<string>>(new Set());
  const isFirstFetch = React.useRef(true);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch('/api/settings/notifications');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const soundMap: Record<string, boolean> = {};
        json.data.forEach((p: any) => {
          // Handle SQLite 0/1 or standard boolean
          soundMap[p.type] = p.soundEnabled === 1 || p.soundEnabled === true || p.soundEnabled === 'true';
        });
        setPreferences(soundMap);
      }
    } catch (err) {
      console.error('Failed to fetch notification preferences', err);
    }
  }, []);

  const playSound = useCallback((type: string) => {
    if (!isAudioEnabled) return;
    
    // Check specific type preference
    const soundEnabled = preferences[type] ?? false; // Default to false if not found
    if (!soundEnabled) return;

    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log('Audio play failed', e));
  }, [isAudioEnabled, preferences]);

  const dismissNotification = useCallback(async (id: string) => {
    // Instantly remove from activeToasts for better responsiveness
    setActiveToasts(prev => prev.filter(n => n.id !== id));
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'READ' })
      });
    } catch (err) {
      console.error('Failed to dismiss notification', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (pathname?.includes('kitchen-display') || pathname?.includes('bar-display')) return;
    
    try {
      const res = await fetch('/api/notifications?status=UNREAD');
      const json = await res.json();
      if (json.success) {
        const unread = json.data || [];
        const currentUnreadIds = new Set(unread.map((u: Notification) => u.id));
        
        // Remove toast from activeToasts if it is no longer UNREAD in database (e.g. read elsewhere)
        setActiveToasts(prev => prev.filter(item => currentUnreadIds.has(item.id)));
        
        // Find newly arriving notifications
        const newNotifications = unread.filter((n: Notification) => !seenIds.current.has(n.id));
        
        if (newNotifications.length > 0) {
          // Play sound for the newest notification's type
          const newest = newNotifications[0];
          if (newest && !isFirstFetch.current) {
            playSound(newest.type);
          }
          
          // Add all new notifications to seenIds so we don't display them again
          newNotifications.forEach((n: Notification) => seenIds.current.add(n.id));
          
          // If this is NOT the first fetch, display toasts for the new notifications
          if (!isFirstFetch.current) {
            setActiveToasts(prev => [...prev, ...newNotifications]);
            
            // Set a timeout of 6 seconds to remove each new notification from activeToasts
            newNotifications.forEach((n: Notification) => {
              setTimeout(() => {
                setActiveToasts(prev => prev.filter(item => item.id !== n.id));
              }, 6000);
            });
          }
        }
        
        isFirstFetch.current = false;
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  }, [playSound, pathname]);

  useEffect(() => {
    setMounted(true);
    if (pathname?.includes('kitchen-display') || pathname?.includes('bar-display')) return;

    fetchPrefs();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // Poll every 5s for faster response
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchPrefs, pathname]);

  const getIcon = (notification: Notification) => {
    const { type, priority } = notification;
    if (type === 'PAYMENT') {
      return priority === 'URGENT' ? <HandCoins className="text-amber-500" /> : <CreditCard className="text-indigo-500" />;
    }
    if (type === 'ORDER') {
      return <ShoppingBag className="text-emerald-500" />;
    }
    if (type === 'ASSISTANCE') {
      const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
      return metadata.requestType === 'BILL' ? <FileText className="text-blue-500" /> : <BellRing className="text-amber-500 animate-ring" />;
    }
    if (priority === 'URGENT') return <AlertCircle className="text-red-500" />;
    return <Bell className="text-pos-primary" />;
  };

  if (!mounted) return null;
  if (pathname?.includes('kitchen-display') || pathname?.includes('bar-display')) return null;

  return (
    <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-2 w-72 pointer-events-none">
      <AnimatePresence>
        {activeToasts.map((notification) => {
          let metadata = {};
          try {
            metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
          } catch (e) {
            console.error('Failed to parse metadata', e);
          }
          
          return (
            <motion.div
              key={notification.id}
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="pointer-events-auto"
            >
              <div className={`
                relative bg-white dark:bg-slate-900 
                rounded-2xl shadow-xl border-l-4 p-3 flex gap-3
                ${notification.type === 'ORDER' ? 'border-emerald-50' : 
                  notification.type === 'ASSISTANCE' ? 'border-amber-500' :
                  notification.priority === 'URGENT' ? 'border-amber-500' : 'border-indigo-500'}
              `}>
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                  ${notification.type === 'ORDER' ? 'bg-emerald-50 dark:bg-emerald-950/30' :
                    notification.type === 'ASSISTANCE' ? 'bg-amber-50 dark:bg-amber-950/30' :
                    notification.priority === 'URGENT' ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-indigo-50 dark:bg-indigo-950/30'}
                `}>
                  {React.cloneElement(getIcon(notification) as any, { size: 16 })}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate pr-4">
                      {(metadata as any).tableName ? `Table ${(metadata as any).tableName}` : notification.title}
                    </h3>
                    <button onClick={() => dismissNotification(notification.id)} className="text-slate-300 hover:text-slate-500">
                      <X size={14} />
                    </button>
                  </div>

                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 leading-tight">
                    {notification.message.split(': ')[0]}
                  </p>

                  {/* Payment / Bill Amount */}
                  {(metadata as any).amount && (
                    <div className={`flex items-center justify-between p-2 rounded-lg mb-2 ${notification.type === 'PAYMENT' ? 'bg-emerald-500/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                      <span className={`text-[9px] font-black uppercase ${notification.type === 'PAYMENT' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {notification.type === 'PAYMENT' ? 'Amount Received' : 'Total Bill'}
                      </span>
                      <span className={`text-base font-black ${notification.type === 'PAYMENT' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                        ₹{(metadata as any).amount}
                      </span>
                    </div>
                  )}

                  {/* Items List */}
                  {(metadata as any).items && (metadata as any).items.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 mb-2 border border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        {(metadata as any).items.slice(0, expandedOrders[notification.id] ? undefined : 3).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-[9px]">
                            <span className="font-bold text-slate-700 dark:text-slate-300 truncate pr-2">{item.name}</span>
                            <span className="text-slate-500 shrink-0 font-black">x{item.qty}</span>
                          </div>
                        ))}
                      </div>
                      {(metadata as any).items.length > 3 && (
                        <button 
                          onClick={() => setExpandedOrders(prev => ({ ...prev, [notification.id]: !prev[notification.id] }))}
                          className="w-full mt-1 pt-1 border-t border-slate-200 dark:border-slate-700 text-[8px] font-black text-pos-primary uppercase"
                        >
                          {expandedOrders[notification.id] ? 'Less' : `+${(metadata as any).items.length - 3} More`}
                        </button>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={() => dismissNotification(notification.id)}
                    className="w-full py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[9px] font-black uppercase text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      <style jsx global>{`
        @keyframes ring {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-15deg); }
          30% { transform: rotate(15deg); }
          40% { transform: rotate(-15deg); }
          50% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        .animate-ring {
          animation: ring 2s ease infinite;
        }
      `}</style>
    </div>
  );
}
