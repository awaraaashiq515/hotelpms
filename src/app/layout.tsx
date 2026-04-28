import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await prisma.websiteSettings.findFirst();
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            {children}
            <PWAInstallBanner />
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
