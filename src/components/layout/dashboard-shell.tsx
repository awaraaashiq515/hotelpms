'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNavbar } from '@/components/layout/top-navbar';
import { DashboardAdminSidebar } from '@/components/layout/dashboard-admin-sidebar';
import { DashboardAdminTopNavbar } from '@/components/layout/dashboard-admin-top-navbar';
import { SupplierShell } from '@/components/layout/supplier-shell';

interface DashboardShellProps {
  children: React.ReactNode;
  session: any;
}

export const DashboardShell: React.FC<DashboardShellProps> = ({ children, session }) => {
  const pathname = usePathname();
  
  // Normal logic: Admins get Admin Hub, others get POS
  const isAdminRole = session.role === 'RESTAURANTS_ADMIN' || session.role === 'SUPER_ADMIN';
  
  // SPECIAL OVERRIDE: Kitchen Display always uses POS Layout
  const isKitchenDisplay = pathname.startsWith('/kitchen-display');
  
  // Switch to POS layout for operational pages even for admins
  const isPosPage = 
    pathname === '/operations' || pathname.startsWith('/operations/') ||
    pathname === '/billing' || pathname.startsWith('/billing/') ||
    pathname === '/counter-payments' || pathname.startsWith('/counter-payments/') ||
    pathname === '/bar-pos' || pathname.startsWith('/bar-pos/') ||
    pathname === '/cafe-pos' || pathname.startsWith('/cafe-pos/') ||
    pathname === '/kots' || pathname.startsWith('/kots/') ||
    pathname === '/day-closing' || pathname.startsWith('/day-closing/') ||
    pathname === '/inventory' || pathname.startsWith('/inventory/') ||
    pathname === '/products' || pathname.startsWith('/products/') ||
    pathname === '/categories' || pathname.startsWith('/categories/');

  const showAdminLayout = isAdminRole && !isKitchenDisplay && !isPosPage;
  const isPos = !showAdminLayout;

  if (session.role === 'B2B_SUPPLIER') {
    return <SupplierShell>{children}</SupplierShell>;
  }

  if (isKitchenDisplay) {
    return (
      <div className="h-screen flex flex-col bg-[#080d1a] selection:bg-pos-primary selection:text-white overflow-hidden relative">
        <main className="flex-1 relative overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background dark:bg-slate-950 selection:bg-pos-primary selection:text-white overflow-hidden relative">
      {isPos ? <TopNavbar /> : <DashboardAdminTopNavbar />}
      
      <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)]">
        {isPos ? <Sidebar /> : <DashboardAdminSidebar />}
        
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-slate-900/50 no-scrollbar relative">
          <div className={`h-full w-full ${pathname === '/billing' || pathname === '/bar-pos' || pathname === '/cafe-pos' ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
