'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export const WebsiteHeader = ({ isSimple = false }: { isSimple?: boolean }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState<string>('OrderMint');
  const [tagline, setTagline] = useState<string>('POS Solutions');

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);

    // Fetch settings for logo
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          if (json.data.logoUrl) setLogoUrl(json.data.logoUrl);
          if (json.data.hotelName) setHotelName(json.data.hotelName);
          if (json.data.tagline) setTagline(json.data.tagline);
        }
      })
      .catch(err => console.error('Failed to fetch website settings:', err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '/#features' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      {/* Main Header */}
      <header
        className={`w-full z-50 transition-all duration-400 ${isSimple
          ? 'relative bg-white border-b border-slate-100'
          : isSticky
            ? 'fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-lg shadow-lg border-b border-slate-100'
            : 'absolute top-0 left-0 right-0 bg-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20 md:h-28 lg:h-32">

            {/* ── LOGO ── */}
            <Link href="/" className="flex-shrink-0 group">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Website Logo"
                    className="h-30 md:h-48 w-auto object-contain transition-opacity duration-300 group-hover:opacity-80"
                    style={{ mixBlendMode: 'normal', maxWidth: '350px' }}
                  />
                ) : (
                  <>
                    <div className="w-10 h-10 bg-pos-primary rounded-xl flex items-center justify-center shadow-lg shadow-pos-primary/30">
                      <span className="text-white font-black text-lg italic">O</span>
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-2xl font-black tracking-tight text-pos-primary">
                        {hotelName}
                      </span>
                      <span className="text-[10px] tracking-[0.3em] font-semibold uppercase text-slate-400 mt-0.5">
                        {tagline}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Link>

            {/* ── DESKTOP NAV ── */}
            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-semibold text-slate-600 hover:text-pos-primary transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/login"
                className={`px-6 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md ${isSticky || isSimple
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
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Website Logo"
                    className="h-16 md:h-20 w-auto max-w-[250px] object-contain drop-shadow-sm"
                  />
                ) : (
                  <>
                    <div className="w-10 h-10 bg-pos-primary rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-black text-lg italic">{hotelName.charAt(0)}</span>
                    </div>
                    <span className="text-2xl font-black text-pos-primary">{hotelName}</span>
                  </>
                )}
              </div>
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
                  className="text-xl font-semibold text-slate-900 tracking-tight hover:text-pos-primary"
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
