'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export const WebsiteHeader = ({ isSimple = false }: { isSimple?: boolean }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);

    // Fetch settings for logo
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.logoUrl) {
          setLogoUrl(json.data.logoUrl);
        }
      })
      .catch(err => console.error('Failed to fetch website settings:', err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Benefits', href: '/benefits' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      {/* Main Header */}
      <header
        className={`w-full z-50 transition-all duration-400 ${
          isSimple
            ? 'relative bg-white border-b border-slate-100'
            : isSticky
            ? 'fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-100'
            : 'absolute top-0 left-0 right-0 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20 md:h-24">

            {/* ── LOGO ── */}
            <Link href="/" className="flex-shrink-0 group">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="OrderMint Logo"
                  className="h-14 md:h-16 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
                  style={{ mixBlendMode: 'multiply', maxWidth: '260px' }}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pos-primary rounded-xl flex items-center justify-center shadow-lg shadow-pos-primary/30">
                    <span className="text-white font-black text-lg">O</span>
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-2xl font-black tracking-tight text-pos-primary">
                      OrderMint
                    </span>
                    <span className="text-[10px] tracking-[0.3em] font-semibold uppercase text-slate-400 mt-0.5">
                      POS Solutions
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {/* ── DESKTOP NAV ── */}
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-pos-primary transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/login"
                className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md ${
                  isSticky || isSimple
                    ? 'bg-pos-primary text-white hover:bg-slate-900'
                    : 'bg-slate-900 text-white hover:bg-pos-primary'
                }`}
              >
                Sign In
              </Link>
            </nav>

            {/* ── MOBILE TOGGLE ── */}
            <button
              className="lg:hidden text-slate-900 p-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-white z-[60] flex flex-col p-8">
            <div className="flex justify-between items-center mb-12">
              {logoUrl ? (
                <div
                  className="w-14 h-14 rounded-full overflow-hidden"
                  style={{
                    backgroundImage: `url(${logoUrl})`,
                    backgroundSize: '300%',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
              ) : (
                <span className="text-2xl font-black text-pos-primary">OrderMint</span>
              )}
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X size={32} className="text-gray-900" />
              </button>
            </div>
            <nav className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xl font-bold text-gray-900 uppercase tracking-tighter hover:text-pos-primary"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/login"
                className="mt-4 bg-pos-primary text-white py-4 rounded-xl text-center font-bold uppercase tracking-widest"
              >
                Log In
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};
