import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { SupplierShell } from '@/components/layout/supplier-shell';

export default async function B2BLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <SupplierShell>{children}</SupplierShell>;
}
