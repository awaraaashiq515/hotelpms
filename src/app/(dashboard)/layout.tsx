import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { SidebarProvider } from '@/context/sidebar-context';
import { POSSecurityProvider } from '@/components/providers/POSSecurityProvider';
import { OfflineBadge } from '@/components/shared/offline-badge';
import { NotificationOverlay } from '@/components/shared/NotificationOverlay';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getSession();

  // Dashboard requires a valid session
  if (!session) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <POSSecurityProvider>
        <DashboardShell session={session}>
          {children}
        </DashboardShell>
        {/* Global offline indicator — auto-syncs queued orders when connection returns */}
        <OfflineBadge />
        <NotificationOverlay />
      </POSSecurityProvider>
    </SidebarProvider>
  );
}

