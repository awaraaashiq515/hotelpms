import React from 'react';
import { WebsiteHeader } from '@/components/website/Header';
import { PremiumFooter } from '@/components/website/PremiumFooter';
import { prisma } from '@/lib/prisma';
import { MaintenanceView } from '@/components/website/MaintenanceView';

export default async function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings = null;
  try {
    if (process.env.DATABASE_URL) {
      settings = await prisma.websiteSettings.findFirst({
        select: {
          maintenanceMode: true,
          hotelName: true,
          logoUrl: true,
        }
      });
    }
  } catch (error) {
    console.error('Failed to fetch website settings for layout check:', error);
  }

  if (settings?.maintenanceMode) {
    return (
      <MaintenanceView 
        hotelName={settings.hotelName || undefined} 
        logoUrl={settings.logoUrl || undefined} 
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <WebsiteHeader dark />
      <div className="flex-grow">
        {children}
      </div>
      <PremiumFooter />
    </div>
  );
}
