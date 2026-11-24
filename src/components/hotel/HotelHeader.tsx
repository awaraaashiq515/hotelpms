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
  Hotel,
  ShieldCheck,
  Shield,
  Tv,
  UtensilsCrossed,
  BedDouble,
  Wine,
  ChefHat,
  Sparkles,
  ChevronRight,
  ShoppingCart
} from 'lucide-react';
import { useSidebar } from '@/components/hotel/SidebarContext';
import { NotificationBell } from '@/components/hotel/NotificationBell';
import { RoomStatusTicker } from '@/components/hotel/navigation/RoomStatusTicker';
import { AdminDiscountApprovalFloatingAlert } from '@/components/discounts/AdminDiscountApprovalFloatingAlert';
import { AdminLeaveApprovalFloatingAlert } from '@/components/hotel/staff/AdminLeaveApprovalFloatingAlert';
import { AdminAgentBookingFloatingAlert } from '@/components/hotel/agent/AdminAgentBookingFloatingAlert';

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

  // Close profile menu on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowProfileMenu(false);
    };
    if (showProfileMenu) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [showProfileMenu]);

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
            onClick={() => {
              if (session?.role === 'RESTAURANTS_ADMIN') {
                router.push('/restaurantadmin');
              } else {
                const pCode = session?.propertyCode || selectedProperty?.code || selectedProperty?.propertyCode;
                router.push(pCode ? `/${pCode}/hoteladmin` : '/hoteladmin');
              }
            }}
            title="Switch property or open Hotel Owner Hub"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all shadow-sm"
          >
            <Hotel size={13} className="text-amber-400" />
            <span>Hotel Admin</span>
          </button>
        )}

        {/* Purchasing & Stock Inward shortcut button */}
        <button
          onClick={() => router.push('/hotel/purchasing')}
          title="Open Purchase Orders, Vendor Inward & Stock"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <ShoppingCart size={13} className="text-cyan-400" />
          <span>Purchasing 📦</span>
        </button>

        {/* Daily Menus & Customer Meal Plans shortcut button */}
        <button
          onClick={() => router.push('/hotel/daily-menus')}
          title="Open Today's Meal Menus & Customer Meal Plans (CP, MAP, AP, EP)"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 hover:text-orange-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <ChefHat size={13} className="text-orange-400" />
          <span>Daily Menus 🍽️</span>
        </button>

        {/* Backup & Restore shortcut button */}
        {session?.role !== 'HOTEL_RECEPTIONIST' && (
          <button
            onClick={() => router.push('/hotel/backup')}
            title="Open Data Backup & Restore"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Backup</span>
          </button>
        )}

        {/* Calendar indicator pill */}
        {isCalendar && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black uppercase tracking-widest text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Full View
          </div>
        )}

        {/* Live Desk Button (Direct access to Master Order Display) */}
        <button
          onClick={() => {
            const pCode = session?.propertyCode || selectedProperty?.code || selectedProperty?.propertyCode;
            router.push(pCode ? `/master-order-display/${pCode.toLowerCase()}` : '/master-order-display');
          }}
          title="Open Live Master Order Display (Rooms • Restaurant • Bar)"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-all shadow-sm cursor-pointer select-none active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span>Live Desk</span>
        </button>

        {/* Discount Approval Realtime Floating Alert - ONLY for Hotel Admin and Managers */}
        {['HOTEL_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'HOTEL_MANAGER'].includes(session?.role) && (
          <AdminDiscountApprovalFloatingAlert />
        )}

        {/* Staff Leave Approval Realtime Floating Alert */}
        <AdminLeaveApprovalFloatingAlert />

        {/* Realtime Agent Booking Floating Alert with Sound */}
        <AdminAgentBookingFloatingAlert />

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
              <p className="text-[9px] font-medium text-slate-400 mt-0.5 uppercase tracking-wider">
                {session?.role === 'HOTEL_RECEPTIONIST' ? 'Receptionist' : (session?.role || 'Staff')}
              </p>
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
                    if (session?.role === 'RESTAURANTS_ADMIN') {
                      router.push('/restaurantadmin');
                    } else {
                      const pCode = session?.propertyCode || selectedProperty?.code || selectedProperty?.propertyCode;
                      router.push(pCode ? `/${pCode}/hoteladmin` : '/hoteladmin');
                    }
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition-colors"
                >
                  <Hotel size={14} className="text-amber-400" />
                  Hotel Admin Hub
                </button>
              )}

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/hotel/backup');
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 transition-colors"
              >
                <ShieldCheck size={14} className="text-emerald-400" />
                Backup & Restore
              </button>

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
