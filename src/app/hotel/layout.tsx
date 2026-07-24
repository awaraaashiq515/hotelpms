'use client';

import React, { useState, useEffect } from 'react';
import { HotelSidebar } from '@/components/hotel/sidebar';
import { SidebarProvider, useSidebar } from '@/components/hotel/SidebarContext';
import { useRouter, usePathname } from 'next/navigation';
import { Building2, User, ChevronDown, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { NotificationBell } from '@/components/hotel/NotificationBell';

// Inner layout that can access sidebar context
function HotelLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, toggle, setIsOpen } = useSidebar();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Auto-collapse sidebar on calendar page for full-width view
  useEffect(() => {
    if (pathname === '/hotel/calendar') {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [pathname, setIsOpen]);

  // Force dark mode on html tag for hotel dashboard
  useEffect(() => {
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.add('dark');
    
    return () => {
      if (!hadDark) {
        html.classList.remove('dark');
      }
    };
  }, []);

  useEffect(() => {
    // 1. Fetch Session
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          const role = data.user.role;
          // Allow RESTAURANTS_ADMIN and SUPER_ADMIN to also access hotel (for management)
          const allowedRoles = ['HOTEL_ADMIN', 'HOTEL_RECEPTIONIST', 'HOTEL_MANAGER', 'SUPER_ADMIN', 'RESTAURANTS_ADMIN'];
          
          if (!allowedRoles.includes(role)) {
            router.push('/operations');
          } else {
            setSession(data.user);
            // 2. Fetch Properties
            fetch('/api/setup/properties')
              .then((res) => res.json())
              .then((propData) => {
                if (propData.success && Array.isArray(propData.data)) {
                  const current = propData.data.find((p: any) => p.id === data.user.propertyId) || propData.data[0];
                  setSelectedProperty(current);

                  // ── HMS Feature Gate ──────────────────────────────────────
                  // Allow access if the property type is HOTEL, OR if super/admin role
                  const isHotelProperty = current?.type === 'HOTEL' || current?.hmsEnabled;
                  if (current && !isHotelProperty && role !== 'SUPER_ADMIN' && role !== 'RESTAURANTS_ADMIN') {
                    router.push('/feature-locked?feature=HMS');
                    return;
                  }
                  // ─────────────────────────────────────────────────────────
                }
              })
              .catch(() => {});
          }
        } else {
          router.push('/login');
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-xs font-bold text-indigo-400 uppercase tracking-widest animate-pulse">
          Loading Hotel Portal...
        </p>
      </div>
    );
  }

  if (!session) return null;

  const isCalendar = pathname === '/hotel/calendar';

  return (
    <div className="dark min-h-screen flex bg-[#090d16] text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* Collapsible Hotel Navigation Sidebar */}
      <HotelSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Portal Header */}
        <header className="h-16 border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0 relative z-30">
          {/* Left: Sidebar Toggle + Property */}
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle Button */}
            <button
              onClick={toggle}
              title={isOpen ? 'Collapse sidebar' : 'Open sidebar'}
              className="w-9 h-9 rounded-xl bg-slate-800/60 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              {isOpen
                ? <PanelLeftClose size={16} />
                : <PanelLeftOpen size={16} />
              }
            </button>

            <Building2 className="text-indigo-400" size={18} />
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-400">Current Property</span>
              <span className="text-sm font-black text-slate-100 leading-none mt-0.5">
                {selectedProperty?.name || 'Hotel Property'}
              </span>
            </div>
          </div>

          {/* Right Action Tray */}
          <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-800/40 transition-colors cursor-pointer border border-transparent hover:border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <User size={14} className="text-indigo-400" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-200 leading-none">{session.fullName}</p>
                <p className="text-[9px] font-medium text-slate-500 mt-0.5 uppercase tracking-wider">{session.role}</p>
              </div>
              <ChevronDown size={12} className="text-slate-500" />
            </div>
          </div>
        </header>

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-[#090d16] p-6 md:p-8">
          {pathname === '/hotel' || pathname === '/hotel/calendar' ? (
            children
          ) : (
            <div className="bg-[#0f172a]/45 border border-slate-800/80 rounded-[24px] p-6 md:p-8 shadow-xl min-h-full">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Outer layout wraps with SidebarProvider
export default function HotelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <HotelLayoutInner>{children}</HotelLayoutInner>
    </SidebarProvider>
  );
}
