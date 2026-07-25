'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  DoorOpen, 
  Brush, 
  Wrench, 
  ChefHat, 
  Package, 
  HelpCircle, 
  AlertCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Inbox
} from 'lucide-react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  priority: string;
  metadata: string | null;
  createdAt: string;
}

function sanitizeLink(link: string): string {
  if (!link) return '/hotel';
  
  // If it's a relative URL pointing to /operations
  if (link.startsWith('/operations')) {
    if (link.startsWith('/operations/notifications')) {
      return '/hotel/notifications';
    }
    if (link.startsWith('/operations/orders')) {
      return '/hotel/room-service';
    }
    if (link.startsWith('/operations/tables')) {
      return '/hotel/room-service';
    }
    if (link.startsWith('/operations/checkout')) {
      return '/hotel/checkout';
    }
    if (link.startsWith('/operations/checkin')) {
      return '/hotel/bookings';
    }
    return '/hotel';
  }
  
  // If it's an absolute URL containing /operations
  if (link.includes('/operations')) {
    try {
      const urlObj = new URL(link);
      const pathname = urlObj.pathname;
      if (pathname.startsWith('/operations')) {
        return sanitizeLink(pathname);
      }
    } catch (e) {
      if (link.includes('/operations/notifications')) return '/hotel/notifications';
      if (link.includes('/operations/orders')) return '/hotel/room-service';
      if (link.includes('/operations/tables')) return '/hotel/room-service';
      if (link.includes('/operations/checkout')) return '/hotel/checkout';
      if (link.includes('/operations/checkin')) return '/hotel/bookings';
      return '/hotel';
    }
  }

  return link;
}

export function getNotificationRoute(type: string, title: string, message: string, metadataStr: string | null): string {
  if (metadataStr) {
    try {
      const meta = JSON.parse(metadataStr);
      const rawLink = meta.link || meta.url || meta.route;
      if (rawLink) {
        return sanitizeLink(rawLink);
      }
    } catch (e) {
      // Ignore JSON error
    }
  }

  const text = `${title} ${message} ${type}`.toLowerCase();

  if (text.includes('check-out') || text.includes('checkout') || text.includes('checking out')) {
    return '/hotel/checkout';
  }
  if (text.includes('check-in') || text.includes('checkin') || text.includes('checking in')) {
    return '/hotel/bookings';
  }
  if (text.includes('housekeeping') || text.includes('clean') || text.includes('dirty') || text.includes('broom')) {
    return '/hotel/housekeeping';
  }
  if (text.includes('maintenance') || text.includes('repair') || text.includes('wrench') || text.includes('broken')) {
    return '/hotel/maintenance';
  }
  if (text.includes('order') || text.includes('room service') || text.includes('food') || text.includes('kitchen')) {
    return '/hotel/room-service';
  }
  if (text.includes('assistance') || text.includes('help') || text.includes('call') || text.includes('waiter')) {
    return '/hotel/room-service'; // or frontdesk dashboard
  }
  if (text.includes('inventory') || text.includes('purchase') || text.includes('stock') || text.includes('vendor')) {
    return '/hotel/inventory';
  }

  return '/hotel';
}

export function getNotificationIcon(type: string, title: string, message: string) {
  const text = `${title} ${message} ${type}`.toLowerCase();

  if (text.includes('check-out') || text.includes('checkout')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
        <DoorOpen className="text-rose-400 w-4 h-4" />
      </div>
    );
  }
  if (text.includes('check-in') || text.includes('checkin')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
        <Sparkles className="text-emerald-400 w-4 h-4" />
      </div>
    );
  }
  if (text.includes('housekeeping') || text.includes('clean') || text.includes('dirty')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
        <Brush className="text-amber-400 w-4 h-4" />
      </div>
    );
  }
  if (text.includes('maintenance') || text.includes('repair') || text.includes('broken')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
        <Wrench className="text-sky-400 w-4 h-4" />
      </div>
    );
  }
  if (text.includes('order') || text.includes('room service') || text.includes('food') || text.includes('kitchen')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
        <ChefHat className="text-violet-400 w-4 h-4" />
      </div>
    );
  }
  if (text.includes('assistance') || text.includes('help') || text.includes('call')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
        <HelpCircle className="text-orange-400 w-4 h-4" />
      </div>
    );
  }
  if (text.includes('inventory') || text.includes('purchase') || text.includes('stock')) {
    return (
      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
        <Package className="text-indigo-400 w-4 h-4" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
      <AlertCircle className="text-slate-400 w-4 h-4" />
    </div>
  );
}

export function formatTimeAgo(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDays}d ago`;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?status=UNREAD');
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.data ? data.data.length : 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications in PMS header:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    setIsOpen(false);
    
    // Optimistically update badge count/list
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notif.id, status: 'READ' })
      });
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

    // Determine path and route
    const path = getNotificationRoute(notif.type, notif.title, notif.message, notif.metadata);
    router.push(path);
  };

  const markAllAsRead = async () => {
    try {
      const promises = notifications.map(n => 
        fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: n.id, status: 'READ' })
        })
      );
      await Promise.all(promises);
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Notifications"
        className="relative w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-all focus:outline-none"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-black text-white items-center justify-center shadow-md">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[#0f172a]/95 border border-slate-800/90 rounded-[20px] shadow-2xl backdrop-blur-md z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-800/60 bg-[#0f172a]/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-100">Live Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[360px] overflow-y-auto no-scrollbar divide-y divide-slate-800/50">
            {notifications.length > 0 ? (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className="px-4 py-3 hover:bg-slate-800/40 transition-colors cursor-pointer flex gap-3 group text-left"
                >
                  {getNotificationIcon(notif.type, notif.title, notif.message)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5">
                      <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                        {notif.title}
                      </p>
                      <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-1 shrink-0 mt-0.5">
                        <Clock size={10} />
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-medium leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  <div className="flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={14} className="text-indigo-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-full bg-slate-800/40 border border-slate-700/50 flex items-center justify-center mb-3">
                  <Inbox className="text-slate-500 w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-[200px]">
                  No unread notifications right now.
                </p>
              </div>
            )}
          </div>

          {/* Footer View All */}
          <Link
            href="/hotel/notifications"
            onClick={() => setIsOpen(false)}
            className="block py-3 text-center border-t border-slate-800/60 bg-slate-900/40 text-[11px] font-bold text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all uppercase tracking-wider"
          >
            Open Notifications Center
          </Link>
        </div>
      )}
    </div>
  );
}
