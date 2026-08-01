'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Singer login is now handled by the unified /login page.
 * This page redirects automatically so old bookmarks still work.
 */
export default function SingerLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // If already has singer token, go straight to dashboard
    if (localStorage.getItem('singer_token')) {
      router.replace('/singer-portal/dashboard');
    } else {
      // Otherwise go to the unified login page
      router.replace('/login');
    }
  }, [router]);

  return null;
}
