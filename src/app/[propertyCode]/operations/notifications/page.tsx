"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  RefreshCcw, 
  Search, 
  Trash2, 
  ChevronRight, 
  ExternalLink,
  ChefHat,
  ShoppingBag,
  AlertCircle,
  Filter,
  CheckCircle,
  XCircle,
  Timer,
  FileText,
  Check,
  MoreVertical,
  X,
  Volume2,
  VolumeX,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('ALL'); // ALL, UNREAD, READ
  const [typeFilter, setTypeFilter] = useState<string>('ALL'); // ALL, ORDER, KITCHEN, PAYMENT
  const [autoClear, setAutoClear] = useState<string>('off');
  const router = useRouter();

  const fetchNotifications = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      // Get saved cleanup policy from localStorage
      const savedPolicy = localStorage.getItem('notification_cleanup_policy') || 'off';
      if (savedPolicy !== autoClear) setAutoClear(savedPolicy);

      const res = await fetch(`/api/notifications?status=${filter === 'ALL' ? '' : filter}&autoCleanup=${savedPolicy}`);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [filter, autoClear]);

  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), 5000); 
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const setAutoClearSchedule = (policy: string) => {
    setAutoClear(policy);
    localStorage.setItem('notification_cleanup_policy', policy);
    fetchNotifications(true);
  };

  const markAsRead = async (id: string, link?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'READ' })
      });
      
      // Update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n));
      
      if (link) {
        router.push(link);
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Don't trigger markAsRead/navigation
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete all notifications? This cannot be undone.')) return;
    try {
      await fetch('/api/notifications?all=true', { method: 'DELETE' });
      setNotifications([]);
    } catch (err) {
      console.error("Failed to clear all", err);
    }
  };

  const handleCleanup = async (time: string) => {
    if (time === 'off') {
       setAutoClear('off');
       return;
    }
    
    if (!confirm(`Clear all notifications older than ${time}?`)) return;
    
    try {
      await fetch(`/api/notifications?olderThan=${time}`, { method: 'DELETE' });
      fetchNotifications(true);
      setAutoClear('off');
    } catch (err) {
      console.error("Failed cleanup", err);
    }
  };

  const getIcon = (type: string, priority: string) => {
    switch (type) {
      case 'ORDER':
        return <ShoppingBag className="text-blue-500" size={20} />;
      case 'KITCHEN':
        return <ChefHat className="text-orange-500" size={20} />;
      case 'PAYMENT':
        return <CreditCard className="text-emerald-500" size={20} />;
      case 'RESERVATION':
        return <Clock className="text-indigo-500" size={20} />;
      case 'STAFF':
        return <Timer className="text-purple-500" size={20} />;
      case 'EXPENSE':
        return <AlertCircle className="text-red-500" size={20} />;
      case 'DAY_CLOSING':
        return <CheckCircle2 className="text-rose-500" size={20} />;
      case 'INVENTORY':
        return <ExternalLink className="text-cyan-500" size={20} />;
      case 'FEEDBACK':
        return <Search className="text-amber-500" size={20} />;
      case 'CANCELLATION':
        return <XCircle className="text-red-600" size={20} />;
      case 'REFUND':
        return <RefreshCcw className="text-rose-600" size={20} />;
      case 'MEMBERSHIP':
        return <Users className="text-blue-600" size={20} />;
      case 'ACCOUNTING':
        return <FileText className="text-slate-600" size={20} />;
      default:
        return <Bell className="text-slate-400" size={20} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-blue-500';
      default: return 'bg-slate-400';
    }
  };

  const filtered = notifications.filter(n => {
    const matchesSearch = n.message.toLowerCase().includes(search.toLowerCase()) ||
                          n.title.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === 'ALL' || n.type === typeFilter;
    
    if (autoClear === 'off') return matchesSearch && matchesType;
    
    const hours = parseInt(autoClear);
    const limit = new Date(Date.now() - hours * 60 * 60 * 1000);
    return matchesSearch && matchesType && new Date(n.createdAt) > limit;
  });

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800">
                <Bell size={24} className="text-pos-primary animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Notification Center</h1>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time Operations Monitoring</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search alerts..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-pos-primary transition-all w-full md:w-64"
              />
            </div>
            
            <button 
              onClick={() => fetchNotifications(true)}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 transition-all text-slate-600 dark:text-slate-400"
            >
              <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats & Filters */}
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center min-w-[140px]">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unread Alerts</p>
             <h3 className="text-2xl font-black text-slate-900 dark:text-white">{unreadCount}</h3>
          </div>
          
          <div className="flex-grow bg-white dark:bg-slate-900 p-2 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center overflow-x-auto no-scrollbar gap-3">
            {/* Status Filters */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800/50 rounded-xl p-1 shrink-0">
               {['ALL', 'UNREAD', 'READ'].map(opt => (
                 <button
                   key={opt}
                   onClick={() => setFilter(opt)}
                   className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filter === opt ? 'bg-white dark:bg-slate-700 text-pos-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {opt}
                 </button>
               ))}
            </div>
            
            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />
            
            {/* Type Filters */}
            <div className="flex items-center gap-1 shrink-0 px-1 overflow-x-auto no-scrollbar max-w-[300px]">
               {['ALL', 'ORDER', 'KITCHEN', 'PAYMENT', 'RESERVATION', 'STAFF', 'EXPENSE', 'DAY_CLOSING', 'INVENTORY', 'FEEDBACK', 'CANCELLATION', 'REFUND', 'MEMBERSHIP', 'ACCOUNTING'].map(type => (
                 <button
                   key={type}
                   onClick={() => setTypeFilter(type)}
                   className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap ${typeFilter === type ? 'bg-pos-primary/10 text-pos-primary' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {type.replace('_', ' ')}
                 </button>
               ))}
            </div>

            <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0" />

            {/* Auto Delete & Clear */}
            <div className="flex items-center gap-3 px-2 ml-auto shrink-0">
               <div className="flex flex-col">
                  <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 ml-1">Auto-Delete</p>
                  <select 
                    value={autoClear}
                    onChange={(e) => setAutoClearSchedule(e.target.value)}
                    className={`bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-[9px] font-black uppercase py-1 px-2 focus:ring-1 focus:ring-pos-primary ${autoClear !== 'off' ? 'text-pos-primary bg-pos-primary/5' : 'text-slate-500'}`}
                  >
                    <option value="off">Off</option>
                    <option value="24h">24h</option>
                    <option value="7d">7d</option>
                    <option value="30d">30d</option>
                  </select>
               </div>

               <button 
                 onClick={handleClearAll}
                 className="px-3 py-2 rounded-xl text-[10px] font-black uppercase bg-red-50 text-red-500 hover:bg-red-100 transition-all whitespace-nowrap flex items-center gap-1.5"
               >
                 <Trash2 size={14} /> Clear All
               </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          <AnimatePresence mode='popLayout'>
            {filtered.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-20 bg-white dark:bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-200 dark:border-slate-800"
              >
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell size={32} className="text-slate-300 dark:text-slate-700" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">All caught up!</h3>
                <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto mt-2">No notifications found for the current filters. We'll alert you when something happens.</p>
              </motion.div>
            ) : (
              filtered.map((n) => {
                const meta = n.metadata ? JSON.parse(n.metadata) : {};
                const isUnread = n.status === 'UNREAD';
                
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => markAsRead(n.id, meta.link)}
                    className={`group relative flex flex-col md:flex-row md:items-center gap-4 p-5 rounded-[24px] border transition-all duration-300 cursor-pointer overflow-hidden ${
                      isUnread 
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none ring-1 ring-pos-primary/10 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-0.5' 
                      : 'bg-slate-50/40 dark:bg-slate-900/10 border-slate-100/50 dark:border-slate-800/30 opacity-80 grayscale-[0.3]'
                    }`}
                  >
                    {/* Background Accent */}
                    {isUnread && (
                      <div className={`absolute top-0 left-0 w-1 h-full ${getPriorityColor(n.priority)} opacity-80`} />
                    )}

                    {/* Status Indicator */}
                    {isUnread && (
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <span className="text-[8px] font-black uppercase text-pos-primary tracking-widest">New</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-pos-primary animate-ping"></div>
                      </div>
                    )}

                    {/* Icon Section */}
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center relative transition-transform duration-500 group-hover:scale-110 ${
                        isUnread ? 'bg-slate-50 dark:bg-slate-800/50 shadow-inner' : 'bg-transparent'
                      }`}>
                        {getIcon(n.type, n.priority)}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-[3px] border-white dark:border-slate-900 shadow-sm ${getPriorityColor(n.priority)}`}></div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-grow space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm font-black uppercase tracking-tight ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                          {n.title}
                        </h4>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 uppercase">
                          {n.type}
                        </span>
                        {meta.orderNo && (
                           <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-pos-primary/10 text-pos-primary uppercase">
                            #{meta.orderNo}
                          </span>
                        )}
                      </div>
                      <p className={`text-sm font-semibold leading-relaxed tracking-tight ${isUnread ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500/80'}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-4 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-slate-400" />
                          <p className="text-[10px] text-slate-400 font-bold uppercase">
                            {format(new Date(n.createdAt), 'MMM dd, hh:mm:ss a')}
                          </p>
                        </div>
                        {meta.tableNo && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                             <Timer size={12} />
                             <p className="text-[10px] font-bold uppercase tracking-widest">Table: {meta.tableNo}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <button 
                        onClick={(e) => handleDelete(e, n.id)}
                        className="p-2.5 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                      
                      <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                        isUnread 
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 group-hover:bg-pos-primary' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {isUnread ? (
                          <>
                            Open <ChevronRight size={14} />
                          </>
                        ) : (
                          <Check size={14} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* CSS Overrides for smooth scrolling and primary color */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
