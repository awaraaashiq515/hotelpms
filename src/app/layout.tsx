import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { PWAInstallBanner } from "@/components/website/PWAInstallBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  variable: "--font-bebas-neue",
  subsets: ["latin"],
});

import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  let settings = null;
  
  try {
    // Only attempt to fetch if we are not in a strict build environment that might lack a DB
    // We also use a very defensive fetch to avoid "missing column" crashes
    if (process.env.DATABASE_URL) {
      settings = await prisma.websiteSettings.findFirst({
        select: {
          hotelName: true,
          tagline: true,
          heroSubtitle: true,
          logoUrl: true
        }
      }).catch(() => null);
    }
  } catch (error) {
    // Completely silent to avoid polluting build logs
  }

  const title = settings?.hotelName || "OrderMint";
  const tagline = settings?.tagline || "Advanced POS & Management System";
  
  return {
    title: `${title} - ${tagline}`,
    description: settings?.heroSubtitle || "Next-generation cloud-based POS and restaurant management solution.",
    manifest: "/manifest.json",
    icons: {
      icon: settings?.logoUrl || "/favicon.ico",
      apple: settings?.logoUrl || "/favicon.ico",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: title,
    },
  };
}

export const viewport = {
  themeColor: "#0a0a0a",
};

import { getProjectStatus } from "@/lib/project-status";
import { redirect } from "next/navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Project Status Check (Kill Switch)
  const projectStatus = getProjectStatus();
  
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bebasNeue.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            {(projectStatus.status === 'LOCKED' || projectStatus.status === 'TERMINATED') ? (
              // If you want to force redirect even if they try to bypass CSS
              redirect('/expired')
            ) : (
              <>
                {children}
                <PWAInstallBanner />
              </>
            )}
          </ToastProvider>
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
