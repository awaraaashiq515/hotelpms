'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Building2, 
  User, 
  ChevronDown, 
  PanelLeftOpen, 
  PanelLeftClose, 
  ArrowLeft,
  LogOut,
  Settings,
  LayoutDashboard,
  Hotel
} from 'lucide-react';
import { useSidebar } from '@/components/hotel/SidebarContext';
import { NotificationBell } from '@/components/hotel/NotificationBell';
import { RoomStatusTicker } from '@/components/hotel/navigation/RoomStatusTicker';

interface HotelHeaderProps {
  session?: any;
  property?: any;
}

export const HotelHeader: React.FC<HotelHeaderProps> = ({ session: propSession, property: propProperty }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebar();
  const [session, setSession] = useState<any>(propSession || null);
  const [selectedProperty, setSelectedProperty] = useState<any>(propProperty || null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    if (!propSession) {
      fetch('/api/auth/session')
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated) {
            setSession(data.user);
            if (!propProperty) {
              fetch('/api/setup/properties')
                .then((res) => res.json())
                .then((propData) => {
                  if (propData.success && Array.isArray(propData.data)) {
                    // Prefer hotel property
                    const hotelProp = propData.data.find((p: any) => p.type === 'HOTEL') || propData.data[0];
                    setSelectedProperty(hotelProp);
                  }
                })
                .catch(() => {});
            }
          }
        })
        .catch(() => {});
    } else {
      setSession(propSession);
    }
  }, [propSession, propProperty]);

  useEffect(() => {
    if (propProperty) {
      setSelectedProperty(propProperty);
    }
  }, [propProperty]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout failed', e);
    }
    router.push('/login');
    router.refresh();
  };

  const isCalendar = pathname === '/hotel/calendar';

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0 relative z-30">
      {/* Left: Sidebar Toggle + Property */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Sidebar Toggle Button */}
        <button
          onClick={toggle}
          title={isOpen ? 'Collapse sidebar' : 'Open sidebar'}
          className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-all shrink-0"
        >
          {isOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>

        {/* Header Back Button (when not on hotel root dashboard) */}
        {pathname && pathname !== '/hotel' && pathname !== '/hotel/' && (
          <button
            onClick={() => {
              if (pathname.startsWith('/hotel/pos')) {
                router.push('/hotel');
              } else {
                const segs = pathname.split('/').filter(Boolean);
                if (segs.length > 2) {
                  const parentPath = '/' + segs.slice(0, -1).join('/');
                  if (parentPath === '/hotel/pos') {
                    router.push('/hotel');
                  } else {
                    router.push(parentPath);
                  }
                } else {
                  router.push('/hotel');
                }
              }
            }}
            title="Back to Hotel Dashboard"
            className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-all group shrink-0 cursor-pointer"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform text-indigo-400" />
          </button>
        )}

        <Building2 className="text-indigo-400 shrink-0" size={18} />
        <div className="flex flex-col text-left">
          <span className="text-[10px] font-semibold text-slate-400 leading-none">Current Property</span>
          <span className="text-sm font-black text-slate-100 leading-none mt-1 truncate max-w-[160px] sm:max-w-[240px]">
            {selectedProperty?.name || 'Hotel Property'}
          </span>
        </div>
      </div>

      {/* Center: Live Room Status Ticker */}
      <RoomStatusTicker />

      {/* Right Action Tray */}
      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        {/* Owner Hub shortcut button for Hotel Admins & Owners */}
        {(session?.role === 'HOTEL_ADMIN' || session?.role === 'SUPER_ADMIN' || session?.role === 'RESTAURANTS_ADMIN') && (
          <button
            onClick={() => router.push('/restaurantadmin')}
            title="Switch property or open Hotel Owner Hub"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all shadow-sm"
          >
            <Hotel size={13} className="text-amber-400" />
            <span>Owner Hub</span>
          </button>
        )}

        {/* Calendar indicator pill */}
        {isCalendar && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Full View
          </div>
        )}

        {/* Live Desk Pill */}
        {!isCalendar && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-[10px] font-black uppercase tracking-widest text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live Desk
          </div>
        )}

        {/* Notification Bell Dropdown */}
        <NotificationBell />

        {/* Profile Dropdown */}
        <div className="relative">
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800/40 transition-colors cursor-pointer border border-transparent hover:border-slate-800"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <User size={14} className="text-indigo-400" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-200 leading-none">{session?.fullName || session?.email || 'User'}</p>
              <p className="text-[9px] font-medium text-slate-500 mt-0.5 uppercase tracking-wider">{session?.role || 'Admin'}</p>
            </div>
            <ChevronDown size={12} className="text-slate-500" />
          </div>

          {showProfileMenu && (
            <div 
              className="absolute right-0 top-full mt-2 w-52 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-xs font-black text-white truncate">{session?.fullName || session?.email}</p>
                <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mt-0.5">{session?.role}</p>
              </div>

              {(session?.role === 'HOTEL_ADMIN' || session?.role === 'SUPER_ADMIN' || session?.role === 'RESTAURANTS_ADMIN') && (
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    router.push('/restaurantadmin');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  <Hotel size={14} className="text-amber-400" />
                  Hotel Owner Hub
                </button>
              )}

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/hotel');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <LayoutDashboard size={14} className="text-indigo-400" />
                Hotel Overview
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/hotel/settings');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Settings size={14} className="text-slate-400" />
                Settings
              </button>

              <div className="border-t border-slate-800/80 my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <LogOut size={14} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
