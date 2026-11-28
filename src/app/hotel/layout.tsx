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
import { HotelSubscriptionWarningBanner } from '@/components/hotel/HotelSubscriptionWarningBanner';
import { setupAudioUnlock } from '@/lib/notification-sound';

// Inner layout that can access sidebar context
function HotelLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, toggle, setIsOpen } = useSidebar();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  const isPublicInvoice = pathname?.startsWith('/hotel/invoices/') && pathname !== '/hotel/invoices';

  // Auto-collapse sidebar to the side across all hotel pages for a clean, full-width layout
  useEffect(() => {
    if (isPublicInvoice) return;
    setupAudioUnlock();
    setIsOpen(false);
  }, [pathname, setIsOpen, isPublicInvoice]);

  // Force dark mode on html tag for hotel dashboard
  useEffect(() => {
    if (isPublicInvoice) return;
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    html.classList.add('dark');
    
    return () => {
      if (!hadDark) {
        html.classList.remove('dark');
      }
    };
  }, [isPublicInvoice]);

  useEffect(() => {
    if (isPublicInvoice) {
      setLoading(false);
      return;
    }
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

  if (isPublicInvoice) {
    return <>{children}</>;
  }

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
  
  // Full-screen display pages — no sidebar, no header
  const isFullScreenDisplay =
    pathname.startsWith('/hotel/pos/kitchen-display') ||
    pathname.startsWith('/hotel/pos/bar-display') ||
    pathname.startsWith('/hotel/pos/meal-display');

  const isPosTerminal = 
    pathname.startsWith('/hotel/pos/billing') ||
    pathname.startsWith('/hotel/pos/bar-pos') ||
    pathname.startsWith('/hotel/pos/cafe-pos') ||
    pathname.startsWith('/hotel/pos/tables');
  const isPosModule = pathname.startsWith('/hotel/pos');

  // Full-screen display: render ONLY children, no sidebar / header
  if (isFullScreenDisplay) {
    return (
      <div className="dark min-h-screen bg-[#080d1a] text-slate-100">
        {children}
      </div>
    );
  }

  return (
    <div className="dark min-h-screen flex bg-[#090d16] text-slate-100 selection:bg-indigo-600 selection:text-white print:bg-white print:text-black print:min-h-0 print:block">
      {/* Collapsible Hotel Navigation Sidebar */}
      <div className="print:hidden">
        <HotelSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden print:h-auto print:overflow-visible print:block">
        {/* Portal Header */}
        <div className="print:hidden">
          <HotelSubscriptionWarningBanner session={session} />
          <HotelHeader session={session} property={selectedProperty} />
        </div>

        {/* Scrollable View Area */}
        <main
          className={`flex-1 ${
            isPosTerminal
              ? 'p-0 overflow-hidden flex flex-col min-h-0 h-full w-full print:overflow-visible print:h-auto'
              : 'overflow-y-auto no-scrollbar bg-[#090d16] p-4 md:p-6 lg:p-8 print:p-0 print:m-0 print:bg-white print:overflow-visible print:h-auto'
          }`}
        >
          {isPosTerminal ? (
            <div className="flex-1 h-full w-full overflow-hidden flex flex-col min-h-0 print:overflow-visible print:h-auto">
              {children}
            </div>
          ) : pathname === '/hotel' || pathname === '/hotel/' ? (
            children
          ) : pathname === '/hotel/calendar' || pathname.startsWith('/hotel/bookings') ? (
            <div className="space-y-4 min-w-0 w-full print:space-y-0">
              <div className="print:hidden">
                <HotelBackButton />
              </div>
              {children}
            </div>
          ) : isPosModule ? (
            <div className="space-y-4 min-h-full print:space-y-0">
              <div className="print:hidden">
                <HotelBackButton />
              </div>
              {children}
            </div>
          ) : (
            <div className="bg-[#0f172a]/45 border border-slate-800/80 rounded-[24px] p-6 md:p-8 shadow-xl min-h-full print:bg-white print:border-none print:shadow-none print:p-0 print:m-0 print:rounded-none">
              <div className="print:hidden">
                <HotelBackButton />
              </div>
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
