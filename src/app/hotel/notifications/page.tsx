'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  getNotificationRoute, 
  getNotificationIcon, 
  formatTimeAgo, 
  Notification 
} from '@/components/hotel/NotificationBell';
import { 
  Search, 
  Trash2, 
  CheckCheck, 
  RefreshCw, 
  Clock, 
  Inbox, 
  Filter,
  AlertCircle
} from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchNotifications = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      // If filter is UNREAD or READ, pass status. Note that the endpoint handles status correctly
      let url = '/api/notifications';
      if (filter !== 'ALL') {
        url += `?status=${filter}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const handleNotificationClick = async (notif: Notification) => {
    if (notif.status === 'UNREAD') {
      // Optimistically update status
      setNotifications(prev => 
        prev.map(n => n.id === notif.id ? { ...n, status: 'READ' } : n)
      );

      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: notif.id, status: 'READ' })
        });
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }

    // Determine path and route
    const path = getNotificationRoute(notif.type, notif.title, notif.message, notif.metadata);
    router.push(path);
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => n.status === 'UNREAD');
    if (unread.length === 0) return;

    // Optimistically update UI
    setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));

    try {
      const promises = unread.map(n => 
        fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: n.id, status: 'READ' })
        })
      );
      await Promise.all(promises);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/notifications?all=true', {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to delete notifications:', err);
    }
  };

  // Filter notifications locally by search query
  const filteredNotifications = notifications.filter(notif => {
    const query = searchQuery.toLowerCase();
    return (
      notif.title.toLowerCase().includes(query) ||
      notif.message.toLowerCase().includes(query) ||
      notif.type.toLowerCase().includes(query)
    );
  });

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            Notifications Center
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold uppercase tracking-wider">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Manage your alerts, requests, and notifications across the hotel portal.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            onClick={() => fetchNotifications(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center"
            title="Refresh"
          >
            <RefreshCw size={16} className={`${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="px-4 py-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40"
          >
            <CheckCheck size={14} />
            Mark all read
          </button>

          <button
            onClick={clearAllNotifications}
            disabled={notifications.length === 0}
            className="px-4 py-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 text-rose-400 hover:text-rose-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all disabled:opacity-40"
          >
            <Trash2 size={14} />
            Clear all
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#0f172a]/30 border border-slate-800/50 p-4 rounded-[20px]">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
              filter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
              filter === 'UNREAD'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('READ')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
              filter === 'READ'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            Read
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications by keyword, room, customer..."
            className="w-full bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:border-slate-700/80 rounded-xl py-2 pl-10 pr-4 text-xs font-medium text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/80 transition-all"
          />
        </div>
      </div>

      {/* Main Inbox List */}
      <div className="bg-[#0f172a]/20 border border-slate-800/40 rounded-[24px] overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
              Loading inbox...
            </p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="divide-y divide-slate-800/45">
            {filteredNotifications.map((notif) => {
              const isUnread = notif.status === 'UNREAD';
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-6 py-4 hover:bg-slate-800/25 transition-all cursor-pointer flex gap-4 items-start relative group ${
                    isUnread ? 'bg-indigo-950/10' : ''
                  }`}
                >
                  {/* Unread indicator vertical bar */}
                  {isUnread && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r" />
                  )}

                  {getNotificationIcon(notif.type, notif.title, notif.message)}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black transition-colors ${
                          isUnread ? 'text-white font-extrabold' : 'text-slate-300 font-bold group-hover:text-white'
                        }`}>
                          {notif.title}
                        </span>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        )}
                        {notif.priority === 'HIGH' || notif.priority === 'URGENT' ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold uppercase tracking-wider">
                            {notif.priority}
                          </span>
                        ) : null}
                      </div>
                      
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1 shrink-0 mt-0.5 sm:mt-0">
                        <Clock size={11} className="text-slate-600" />
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p className={`text-xs mt-1.5 font-medium leading-relaxed max-w-3xl ${
                      isUnread ? 'text-slate-200' : 'text-slate-400'
                    }`}>
                      {notif.message}
                    </p>

                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800/40 px-2 py-0.5 rounded border border-slate-800">
                        Type: {notif.type}
                      </span>
                      {notif.metadata && (
                        <span className="text-[10px] font-bold text-indigo-400/80">
                          Interactive Link Attached
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="h-full flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <CheckCheck size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 rounded-full bg-slate-800/30 border border-slate-800/60 flex items-center justify-center mb-4">
              <Inbox className="text-slate-500 w-7 h-7" />
            </div>
            <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">Inbox is Empty</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-[280px] font-medium leading-relaxed">
              {searchQuery 
                ? 'No notifications matched your search query. Try typing something else.' 
                : filter === 'UNREAD' 
                ? 'Great job! You have read all notifications.'
                : 'There are no notifications in this view.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
