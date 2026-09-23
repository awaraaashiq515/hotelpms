'use client';

import React, { useState, useEffect } from 'react';
import { HotelSidebar } from '@/components/hotel/sidebar';
import { SidebarProvider, useSidebar } from '@/components/hotel/SidebarContext';
import { useRouter, usePathname } from 'next/navigation';
import { Building2, User, ChevronDown, PanelLeftOpen, PanelLeftClose, ArrowLeft } from 'lucide-react';
import { NotificationBell } from '@/components/hotel/NotificationBell';
import { RoomStatusTicker } from '@/components/hotel/navigation/RoomStatusTicker';
import { HotelBackButton } from '@/components/hotel/navigation/HotelBackButton';
import { HotelHeader } from '@/components/hotel/HotelHeader';

// Inner layout that can access sidebar context
function HotelLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, toggle, setIsOpen } = useSidebar();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  // Auto-collapse sidebar to the side across all hotel pages for a clean, full-width layout
  useEffect(() => {
    setIsOpen(false);
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
            // Non-admin staff (Waiter, Cook, etc.) → staff-portal, not /operations
            const propCode = (data.user.propertyCode as string | null)?.toLowerCase();
            router.push(propCode ? `/staff-portal/${propCode}` : '/staff-portal');
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
  const isPosTerminal = 
    pathname.startsWith('/hotel/pos/billing') ||
    pathname.startsWith('/hotel/pos/bar-pos') ||
    pathname.startsWith('/hotel/pos/cafe-pos') ||
    pathname.startsWith('/hotel/pos/kitchen-display') ||
    pathname.startsWith('/hotel/pos/bar-display') ||
    pathname.startsWith('/hotel/pos/tables');
  const isPosModule = pathname.startsWith('/hotel/pos');

  return (
    <div className="dark min-h-screen flex bg-[#090d16] text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* Collapsible Hotel Navigation Sidebar */}
      <HotelSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Portal Header */}
        <HotelHeader session={session} property={selectedProperty} />

        {/* Scrollable View Area */}
        <main
          className={`flex-1 ${
            isPosTerminal
              ? 'p-0 overflow-hidden flex flex-col min-h-0 h-full w-full'
              : 'overflow-y-auto no-scrollbar bg-[#090d16] p-4 md:p-6 lg:p-8'
          }`}
        >
          {isPosTerminal ? (
            <div className="flex-1 h-full w-full overflow-hidden flex flex-col min-h-0">
              {children}
            </div>
          ) : pathname === '/hotel' || pathname === '/hotel/' ? (
            children
          ) : pathname === '/hotel/calendar' ? (
            <div className="space-y-4">
              <HotelBackButton />
              {children}
            </div>
          ) : isPosModule ? (
            <div className="space-y-4 min-h-full">
              <HotelBackButton />
              {children}
            </div>
          ) : (
            <div className="bg-[#0f172a]/45 border border-slate-800/80 rounded-[24px] p-6 md:p-8 shadow-xl min-h-full">
              <HotelBackButton />
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
