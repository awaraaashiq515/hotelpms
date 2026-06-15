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
  
  // Extract relative path without property code prefix (if present)
  // e.g., /ashoka-dhaba/kitchen-display -> /kitchen-display
  const segments = pathname.split('/').filter(Boolean);
  const relativePath = segments.length > 1 ? '/' + segments.slice(1).join('/') : '/';
  
  // Normal logic: Admins get Admin Hub, others get POS
  const isAdminRole = session.role === 'RESTAURANTS_ADMIN' || session.role === 'SUPER_ADMIN';
  
  // SPECIAL OVERRIDE: Kitchen Display / Bar Display always uses POS Layout
  const isKitchenDisplay = relativePath.startsWith('/kitchen-display') || pathname.includes('/kitchen-display') ||
    relativePath.startsWith('/bar-display') || pathname.includes('/bar-display');
  
  // Switch to POS layout for operational pages even for admins
  const isPosPage = 
    relativePath === '/operations' || relativePath.startsWith('/operations/') ||
    relativePath === '/billing' || relativePath.startsWith('/billing/') ||
    relativePath === '/counter-payments' || relativePath.startsWith('/counter-payments/') ||
    relativePath === '/bar-pos' || relativePath.startsWith('/bar-pos/') ||
    relativePath === '/cafe-pos' || relativePath.startsWith('/cafe-pos/') ||
    relativePath === '/kots' || relativePath.startsWith('/kots/') ||
    relativePath === '/day-closing' || relativePath.startsWith('/day-closing/') ||
    relativePath === '/inventory' || relativePath.startsWith('/inventory/') ||
    relativePath === '/products' || relativePath.startsWith('/products/') ||
    relativePath === '/categories' || relativePath.startsWith('/categories/');

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
          <div className={`h-full w-full ${relativePath === '/billing' || relativePath === '/bar-pos' || relativePath === '/cafe-pos' || relativePath === '/operations/delivery' ? 'p-0' : 'p-4 md:p-6 lg:p-8'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
