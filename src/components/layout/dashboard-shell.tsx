'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNavbar } from '@/components/layout/top-navbar';
import { DashboardAdminSidebar } from '@/components/layout/dashboard-admin-sidebar';
import { DashboardAdminTopNavbar } from '@/components/layout/dashboard-admin-top-navbar';
import { SupplierShell } from '@/components/layout/supplier-shell';
import { HotelAdminSidebar } from '@/components/layout/hotel-admin-sidebar';
import { HotelAdminMobileNav } from '@/components/layout/hotel-admin-mobile-nav';

interface DashboardShellProps {
  children: React.ReactNode;
  session: any;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children, session }) => {
  const pathname = usePathname();
  
  // Extract relative path without property code prefix (if present)
  // e.g., /ashoka-dhaba/kitchen-display -> /kitchen-display
  const segments = pathname.split('/').filter(Boolean);
  const relativePath = segments.length > 1 ? '/' + segments.slice(1).join('/') : '/';

  // Hotel Admin: any /hoteladmin page gets a dedicated sidebar
  const isHotelAdminRoute = pathname.includes('/hoteladmin');

  // Normal logic: Admins get Admin Hub, others get POS
  const isAdminRole = session.role === 'RESTAURANTS_ADMIN' || session.role === 'SUPER_ADMIN' || session.role === 'HOTEL_ADMIN';
  
  // SPECIAL OVERRIDE: Kitchen Display / Bar Display always uses POS Layout
  const isKitchenDisplay = relativePath.startsWith('/kitchen-display') || pathname.includes('/kitchen-display') ||
    relativePath.startsWith('/bar-display') || pathname.includes('/bar-display') ||
    relativePath.startsWith('/delivery-display') || pathname.includes('/delivery-display');

  // Music page: show TopNavbar but hide sidebar for full DJ console view
  const isMusicPage = relativePath.startsWith('/music') || pathname.includes('/music');

  // Show admin layout only for strict property & user management configuration pages
  const isManagementAdminPage = 
    relativePath === '/manage-properties' || relativePath.startsWith('/manage-properties/') ||
    relativePath === '/manage-roles' || relativePath.startsWith('/manage-roles/') ||
    relativePath === '/manage-users' || relativePath.startsWith('/manage-users/');

  const showAdminLayout = !isKitchenDisplay && isManagementAdminPage;
  const isPos = !showAdminLayout;

  if (session.role === 'B2B_SUPPLIER') {
    return <SupplierShell>{children}</SupplierShell>;
  }

  // Full screen display monitor for kitchen/bar
  if (isKitchenDisplay) {
    return (
      <div className="h-screen flex flex-col bg-[#080d1a] selection:bg-pos-primary selection:text-white overflow-hidden relative">
        <main className="flex-1 relative overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  // Music page: TopNavbar visible, sidebar completely hidden, content fills remaining height
  if (isMusicPage) {
    return (
      <div className="h-screen flex flex-col bg-slate-950 selection:bg-pos-primary selection:text-white overflow-hidden relative">
        <TopNavbar />
        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          <div className="h-full w-full p-4 md:p-5">
            {children}
          </div>
        </main>
      </div>
    );
  }

  const navBar = isHotelAdminRoute || (!isPos) ? <DashboardAdminTopNavbar /> : <TopNavbar />;
  const sideBar = isHotelAdminRoute
    ? <HotelAdminSidebar />
    : isPos
      ? <Sidebar />
      : <DashboardAdminSidebar />;

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 selection:bg-indigo-600 selection:text-white overflow-hidden relative">
      {navBar}
      
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)]">
        {sideBar}
        
        <main className={`flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-[#090d16] no-scrollbar relative ${isHotelAdminRoute ? 'pb-20 lg:pb-0' : ''}`}>
          <div className={`h-full w-full ${relativePath === '/billing' || relativePath === '/bar-pos' || relativePath === '/cafe-pos' || relativePath === '/operations/delivery' ? 'p-0' : 'p-3 sm:p-4 md:p-6 lg:p-8'}`}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile App Bottom Bar for Hotel Admin */}
      {isHotelAdminRoute && <HotelAdminMobileNav />}
    </div>
  );
};
