import React from 'react';
import Link from 'next/link';

export function PremiumFooter() {
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
    <footer className="bg-white pt-16 pb-12 border-t border-slate-100">
      <div className="container mx-auto px-6 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8 mb-16">
          
          {/* Brand Col */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block text-2xl font-medium tracking-tight text-slate-900 mb-4 hover:opacity-80 transition-opacity">
              Order<span className="text-pos-primary">Mint</span>
            </Link>
            <p className="text-slate-500 max-w-sm mb-6 font-light">
              The premier restaurant management platform built to streamline operations and increase revenue.
            </p>
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center hover:bg-slate-100 transition-colors cursor-pointer">
                  <div className="w-4 h-4 bg-slate-300 rounded-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Link Cols */}
          <div>
            <h4 className="font-medium text-slate-900 mb-6">Product</h4>
            <ul className="space-y-4">
              {footerLinks.Product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-500 font-light hover:text-pos-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-6">Company</h4>
            <ul className="space-y-4">
              {footerLinks.Company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-500 font-light hover:text-pos-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-6">Legal</h4>
            <ul className="space-y-4">
              {footerLinks.Legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-500 font-light hover:text-pos-primary transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm font-light text-slate-400">
            © {new Date().getFullYear()} OrderMint Inc. All rights reserved.
          </p>
          <div className="flex gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-slate-500 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
