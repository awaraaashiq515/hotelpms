'use client';

import React from 'react';
import { SupplierSidebar } from './supplier-sidebar';
import { SupplierTopNavbar } from './supplier-top-navbar';

interface SupplierShellProps {
  children: React.ReactNode;
}

export function SupplierShell({ children }: SupplierShellProps) {
  return (
    <div className="h-screen flex overflow-hidden bg-[#f8fafc] dark:bg-slate-950">
      <SupplierSidebar />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SupplierTopNavbar />
        
        <main className="flex-1 overflow-y-auto no-scrollbar">
          <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
