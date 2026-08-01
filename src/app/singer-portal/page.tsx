'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SingerPortalIndex() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('singer_token');
    if (token) {
      router.replace('/singer-portal/dashboard');
    } else {
      // Always go to unified login page
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-500 text-xs">
      Redirecting...
    </div>
  );
}
