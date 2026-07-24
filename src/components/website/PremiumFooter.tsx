'use client';

import React from 'react';
import Link from 'next/link';

export function PremiumFooter() {
  const [settings, setSettings] = React.useState<any>(null);

  React.useEffect(() => {
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success) setSettings(json.data);
      });
  }, []);

  const footerLinks = {
    Product: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Hardware", href: "#hardware" },
      { name: "Integrations", href: "#integrations" }
    ],
    Company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "#" },
      { name: "Blog", href: "/blog" },
      { name: "Contact", href: "/contact" }
    ],
    Legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" }
    ]
  };

  return (
    <footer className="bg-[#050505] pt-24 pb-12 border-t border-white/5">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-16 mb-24">
          
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex flex-col items-start gap-3 mb-8 group">
               <div className="h-16 md:h-24 lg:h-28 max-w-[280px] md:max-w-[350px]">
                 {settings?.logoUrl ? (
                   <img 
                     src={settings.logoUrl} 
                     alt={settings.hotelName || "GuestFlow"} 
                     className="h-full w-auto object-contain brightness-0 invert opacity-80 transition-transform duration-300 group-hover:scale-105" 
                   />
                 ) : (
                   <div id="footer-fallback-logo" className="text-3xl font-black tracking-tighter text-white hover:opacity-80 transition-opacity">
                     {settings?.hotelName ? (
                       settings.hotelName
                     ) : (
                       <>Order<span className="text-pos-primary">Mint</span></>
                     )}
                   </div>
                 )}
               </div>
            </Link>
            <p className="text-slate-500 max-w-sm mb-8 font-light leading-relaxed">
              {settings?.tagline || "The premier hospitality management ecosystem built to scale operations and maximize revenue through intelligent automation."}
            </p>
            <div className="flex gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-pos-primary hover:text-white transition-all cursor-pointer text-slate-400">
                  <div className="w-5 h-5 bg-current rounded-sm opacity-50" />
                </div>
              ))}
            </div>
          </div>

          {/* Link Cols */}
          <div>
            <h4 className="font-bold text-white mb-8 uppercase tracking-widest text-xs">Product</h4>
            <ul className="space-y-4">
              {footerLinks.Product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-500 font-medium hover:text-pos-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-8 uppercase tracking-widest text-xs">Company</h4>
            <ul className="space-y-4">
              {footerLinks.Company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-500 font-medium hover:text-pos-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-8 uppercase tracking-widest text-xs">Legal</h4>
            <ul className="space-y-4">
              {footerLinks.Legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-500 font-medium hover:text-pos-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm font-medium text-slate-600">
            © {new Date().getFullYear()} {settings?.hotelName || "GuestFlow"} Inc. Crafted with passion for hospitality.
          </p>
          <div className="flex gap-3">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              Global Systems Live
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
