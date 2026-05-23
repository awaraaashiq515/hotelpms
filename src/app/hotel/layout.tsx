'use client';

import React, { useState, useEffect } from 'react';
import { HotelSidebar } from '@/components/hotel/sidebar';
import { useRouter } from 'next/navigation';
import { Building2, User, ChevronDown } from 'lucide-react';

export default function HotelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch Session
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          const role = data.user.role;
          const allowedRoles = ['HOTEL_ADMIN', 'HOTEL_RECEPTIONIST', 'HOTEL_MANAGER', 'SUPER_ADMIN'];
          
          if (!allowedRoles.includes(role)) {
            // Redirect to main operations if unauthorized
            router.push('/operations');
          } else {
            setSession(data.user);
            // 2. Fetch Properties
            fetch('/api/setup/properties')
              .then((res) => res.json())
              .then((propData) => {
                if (propData.success && Array.isArray(propData.data)) {
                  setProperties(propData.data);
                  // Find current property context
                  const current = propData.data.find((p: any) => p.id === data.user.propertyId) || propData.data[0];
                  setSelectedProperty(current);
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

  return (
    <div className="min-h-screen flex bg-[#090d16] text-slate-100 selection:bg-indigo-600 selection:text-white">
      {/* Collapsible Hotel Navigation Sidebar */}
      <HotelSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Portal Header */}
        <header className="h-16 border-b border-slate-800 bg-[#0f172a]/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
          {/* Active Property Status */}
          <div className="flex items-center gap-2.5">
            <Building2 className="text-indigo-400" size={18} />
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-400">Current Property</span>
              <span className="text-sm font-black text-slate-100 leading-none mt-0.5">
                {selectedProperty?.name || 'Hotel Property'}
              </span>
            </div>
          </div>

          {/* Right Action Tray (User profile context) */}
          <div className="flex items-center gap-4">
            {/* Quick Stats Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-[10px] font-black uppercase tracking-widest text-indigo-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Desk
            </div>

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
          {children}
        </main>
      </div>
    </div>
  );
}
