import React from 'react';
import { WebsiteHeader } from '@/components/website/Header';
import { PremiumFooter } from '@/components/website/PremiumFooter';

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <WebsiteHeader />
      <div className="flex-grow">
        {children}
      </div>
      <PremiumFooter />
    </div>
  );
}
