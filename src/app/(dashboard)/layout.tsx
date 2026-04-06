import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Sidebar } from '@/components/layout/sidebar';
import { TopNavbar } from '@/components/layout/top-navbar';
import { DashboardAdminSidebar } from '@/components/layout/dashboard-admin-sidebar';
import { DashboardAdminTopNavbar } from '@/components/layout/dashboard-admin-top-navbar';
import { SidebarProvider } from '@/context/sidebar-context';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getSession();

  // Dashboard requires a valid session
  if (!session) {
    redirect('/login');
  }

  // Admins and Super Admins get the Admin Hub interface
  const isAdmin = session.role === 'RESTAURANTS_ADMIN' || session.role === 'SUPER_ADMIN';
  const isPos = !isAdmin;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex flex-col bg-background dark:bg-slate-950 selection:bg-pos-primary selection:text-white overflow-hidden">
        {isPos ? <TopNavbar /> : <DashboardAdminTopNavbar />}
        
        <div className="flex flex-1 overflow-hidden h-[calc(100vh-64px)]">
          {isPos ? <Sidebar /> : <DashboardAdminSidebar />}
          
          <main className="flex-1 overflow-y-auto bg-[#f8fafc] dark:bg-slate-900/50 no-scrollbar">
            <div className="h-full w-full p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

