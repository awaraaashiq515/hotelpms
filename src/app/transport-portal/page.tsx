'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'sonner';
import { AuthShell } from '../../components/transport-portal/AuthShell';

export default function TransportPortalPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('transport_token');
    if (token) {
      router.replace('/transport-portal/dashboard');
    }
  }, [router]);

  const handleAuthenticated = (driver: any, token: string) => {
    router.replace('/transport-portal/dashboard');
  };

  return (
    <>
      <Toaster richColors position="top-center" />
      <AuthShell onAuthenticated={handleAuthenticated} />
    </>
  );
}
