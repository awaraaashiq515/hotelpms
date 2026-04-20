import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { SidebarProvider } from '@/context/sidebar-context';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || session.role !== 'SUPER_ADMIN') {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth p-4 md:p-8 lg:p-12">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


