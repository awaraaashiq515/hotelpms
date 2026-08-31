'use client';

import React from 'react';
import Link from 'next/link';

const CYAN = '#00c8ff';
const CYAN2 = '#0099e6';

export function PremiumFooter() {
  const [settings, setSettings] = React.useState<any>(null);

  React.useEffect(() => {
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success) setSettings(json.data);
      })
      .catch(() => {});
  }, []);

  const hotelName = settings?.hotelName || 'GuestFlow';

  const footerLinks = {
    Product: [
      { name: 'Features', href: '/features' },
      { name: 'Pricing', href: '/pricing' },
      { name: 'Contact', href: '/contact' },
    ],
    Company: [
      { name: 'About Us', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Support', href: '/contact' },
    ],
    Legal: [
      { name: 'Privacy Policy', href: '/contact' },
      { name: 'Terms of Service', href: '/contact' },
      { name: 'Cookie Policy', href: '/contact' },
    ],
  };

  return (
    <footer className="bg-[#03060c] pt-12 pb-8 border-t border-white/[0.06] text-slate-400">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10 items-start">
          
          {/* Brand Col */}
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
              {settings?.logoUrl ? (
                <img 
                  src={settings.logoUrl} 
                  alt={hotelName} 
                  className="h-7 w-auto object-contain brightness-0 invert opacity-90 transition-transform group-hover:scale-105" 
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-black text-xs"
                    style={{ background: `linear-gradient(135deg, ${CYAN2}, ${CYAN})` }}
                  >
                    G
                  </div>
                  <span className="text-base font-extrabold text-white tracking-tight group-hover:text-[#00c8ff] transition-colors">
                    {hotelName}
                  </span>
                </div>
              )}
            </Link>

            <p className="text-xs text-slate-500 max-w-xs mb-4 leading-relaxed">
              {settings?.tagline || 'All-in-one hotel management platform designed to scale operations and maximize revenue.'}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>📍 {settings?.address || 'Mumbai, India'}</span>
            </div>
          </div>

          {/* Links: Product */}
          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Product</h4>
            <ul className="space-y-2 text-xs">
              {footerLinks.Product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-[#00c8ff] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Company */}
          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Company</h4>
            <ul className="space-y-2 text-xs">
              {footerLinks.Company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-[#00c8ff] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links: Legal */}
          <div>
            <h4 className="font-bold text-white mb-3 uppercase tracking-wider text-[11px]">Legal</h4>
            <ul className="space-y-2 text-xs">
              {footerLinks.Legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-[#00c8ff] transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-white/[0.05] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} {hotelName}. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-slate-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
