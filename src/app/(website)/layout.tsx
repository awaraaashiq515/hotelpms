import React from 'react';
import { WebsiteHeader } from '@/components/website/Header';
import { WebsiteFooter } from '@/components/website/Footer';

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <WebsiteHeader isSimple={true} />
      <div className="flex-grow">
        {children}
      </div>
      <WebsiteFooter />
    </div>
  );
}
