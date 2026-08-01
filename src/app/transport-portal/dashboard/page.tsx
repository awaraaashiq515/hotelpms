'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bus, Car, Clock, Calendar, IndianRupee, Settings,
  LogOut, Wifi, WifiOff, Loader2, Menu, X, ChevronRight
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { MyVehiclesTab } from '../../../components/transport-portal/MyVehiclesTab';
import { ScheduleTab } from '../../../components/transport-portal/ScheduleTab';
import { BookingsTab } from '../../../components/transport-portal/BookingsTab';
import { EarningsTab } from '../../../components/transport-portal/EarningsTab';
import { SettingsTab } from '../../../components/transport-portal/SettingsTab';

type Tab = 'bookings' | 'schedule' | 'vehicles' | 'earnings' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: 'bookings',  label: 'Bookings',     icon: Calendar,      color: 'from-violet-500 to-purple-600' },
  { id: 'schedule',  label: 'Schedule',     icon: Clock,         color: 'from-blue-500 to-indigo-600' },
  { id: 'vehicles',  label: 'My Vehicles',  icon: Car,           color: 'from-orange-500 to-red-500' },
  { id: 'earnings',  label: 'Earnings',     icon: IndianRupee,   color: 'from-green-500 to-emerald-600' },
  { id: 'settings',  label: 'Settings',     icon: Settings,      color: 'from-slate-500 to-slate-600' },
];

export default function TransportDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('bookings');
  const [driver, setDriver] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('transport_token');
    const storedDriver = localStorage.getItem('transport_driver');

    // ── Case 1: Transport Portal's own token ──
    if (storedToken && storedDriver) {
      try {
        const d = JSON.parse(storedDriver);
        setDriver(d);
        setToken(storedToken);
        setIsOnline(d.isOnline ?? false);
        setLoading(false);
        return;
      } catch {
        // fall through to session check
      }
    }

    // ── Case 2: Standard session login from /login page ──
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated && data.user?.role === 'DELIVERY_RIDER') {
          const sessionDriver = {
            id: data.user.id,
            name: data.user.name || data.user.fullName || data.user.email || 'Driver',
            email: data.user.email,
            phone: data.user.phone,
            isOnline: false,
          };
          setDriver(sessionDriver);
          setToken('session');
          setIsOnline(false);
          setLoading(false);
        } else {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem('transport_token');
    localStorage.removeItem('transport_driver');
    // Also logout standard session if used
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
    toast.success('Logged out successfully! 👋');
    setTimeout(() => router.replace('/login'), 800);
  }, [router]);

  const handleToggleOnline = useCallback((val: boolean) => {
    setIsOnline(val);
    setDriver((d: any) => ({ ...d, isOnline: val }));
    const updated = JSON.parse(localStorage.getItem('transport_driver') || '{}');
    localStorage.setItem('transport_driver', JSON.stringify({ ...updated, isOnline: val }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080f] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-400" size={36} />
      </div>
    );
  }

  const activeTabConfig = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#06080f] text-white flex flex-col">
      <Toaster richColors position="top-center" />

      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-700/5 blur-[140px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-indigo-700/4 blur-[120px]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 bg-[#08101f]/90 backdrop-blur-xl border-b border-slate-800/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md shadow-blue-600/20">
              <Bus size={14} className="text-white" />
            </div>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md shadow-orange-500/20">
              <Car size={14} className="text-white" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-none">Transport Portal</p>
            <p className="text-sm font-black text-white leading-tight mt-0.5">{driver?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Online indicator */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-black transition-all ${
            isOnline
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-500'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>

          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto px-4 py-5 pb-28">
        {activeTab === 'vehicles'  && <MyVehiclesTab token={token} />}
        {activeTab === 'schedule'  && <ScheduleTab token={token} />}
        {activeTab === 'bookings'  && <BookingsTab token={token} />}
        {activeTab === 'earnings'  && <EarningsTab token={token} />}
        {activeTab === 'settings'  && (
          <SettingsTab
            driver={driver}
            token={token}
            onLogout={handleLogout}
            isOnline={isOnline}
            onToggleOnline={handleToggleOnline}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-20 bg-[#08101f]/95 backdrop-blur-xl border-t border-slate-800/60 px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive ? 'scale-105' : 'opacity-50 hover:opacity-75'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isActive
                    ? `bg-gradient-to-br ${tab.color} shadow-lg`
                    : 'bg-transparent'
                }`}>
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                </div>
                <span className={`text-[9px] font-black leading-none ${
                  isActive ? 'text-white' : 'text-slate-500'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
