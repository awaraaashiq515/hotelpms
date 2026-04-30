'use client';

import React from 'react';
import { WebsiteHeader } from '@/components/website/Header';
import { PremiumHero } from '@/components/website/PremiumHero';
import { PremiumFeatures } from '@/components/website/PremiumFeatures';
import { PremiumStats } from '@/components/website/PremiumStats';
import { PremiumFooter } from '@/components/website/PremiumFooter';

import { ModuleMap } from '@/components/website/ModuleMap';
import { BentoFeatures } from '@/components/website/BentoFeatures';
import { StorySection } from '@/components/website/StorySection';
import { BlogSection } from '@/components/website/BlogSection';
import { AppDownloadSection } from '@/components/website/AppDownloadSection';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirection to dashboard disabled as per user request
    /*
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          const role = data.user.role;
          if (role === 'SUPER_ADMIN') {
            router.replace('/admin/dashboard');
          } else if (role === 'RESTAURANTS_ADMIN') {
            router.replace('/dashboard');
          } else {
            router.replace('/operations');
          }
        }
      })
      .catch(() => {});
    */
  }, [router]);
  return (
    <main className="min-h-screen bg-white selection:bg-pos-primary/30 selection:text-pos-primary">
      {/* 1. Header */}
      <WebsiteHeader />

      {/* 2. Premium Hero Section */}
      <PremiumHero />

      {/* 3. Premium Features Section (3 columns) */}
      <PremiumFeatures />

      {/* 4. Ecosystem & Module Map */}
      <ModuleMap />

      {/* 5. Deep Dive Features (Bento Grid) */}
      <BentoFeatures />

      {/* 6. Mission & Story */}
      <StorySection />

      {/* 7. Premium Stats Section */}
      <PremiumStats />
      
      {/* 8. Latest News / Blog */}
      <BlogSection />

      {/* 9. App Download Section */}
      <AppDownloadSection />
      
      {/* 10. Premium Footer */}
      <PremiumFooter />
    </main>
  );
}
