'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export const WebsiteHeader = ({ isSimple = false, dark = false }: { isSimple?: boolean, dark?: boolean }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoScrolledUrl, setLogoScrolledUrl] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState<string>('GuestFlow');
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
          if (json.data.logoScrolledUrl) setLogoScrolledUrl(json.data.logoScrolledUrl);
          if (json.data.hotelName) setHotelName(json.data.hotelName);
          if (json.data.tagline) setTagline(json.data.tagline);
        }
      })
      .catch(err => console.error('Failed to fetch website settings:', err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Live Music', href: '/live-music' },
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
          <div className="flex items-center justify-between h-14 md:h-16 lg:h-16">

            {/* ── LOGO ── */}
            <Link href="/" className="flex-shrink-0 group relative z-[60]">
              <div className="flex items-center gap-4">
                {(isSticky && logoScrolledUrl) ? (
                  <img
                    src={logoScrolledUrl}
                    alt="Website Scrolled Logo"
                    className="h-10 md:h-12 lg:h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                    style={{ mixBlendMode: 'normal', maxWidth: '250px' }}
                  />
                ) : logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Website Logo"
                    className="h-10 md:h-12 lg:h-12 w-auto object-contain transition-all duration-300 group-hover:scale-105 drop-shadow-xl"
                    style={{ mixBlendMode: 'normal', maxWidth: '250px' }}
                  />
                ) : (
                  <>
                    <div className="w-16 h-16 bg-pos-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-pos-primary/40">
                      <span className="text-white font-black text-3xl italic">O</span>
                    </div>
                    <div className="flex flex-col leading-none">
                      <span className="text-4xl font-black tracking-tight text-pos-primary">
                        {hotelName}
                      </span>
                      <span className="text-[12px] tracking-[0.3em] font-semibold uppercase text-slate-400 mt-1">
                        {tagline}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Link>

            <nav className="hidden lg:flex items-center gap-10">
              {navLinks.map((link) => {
                const isAnchor = link.href.startsWith('/#');
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      if (isAnchor && window.location.pathname === '/') {
                        e.preventDefault();
                        const id = link.href.split('#')[1];
                        const element = document.getElementById(id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className={`text-sm font-semibold transition-colors duration-200 ${!isSticky && dark ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-pos-primary'
                      }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
              <Link
                href="/login"
                className={`px-8 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-lg ${isSticky || isSimple
                    ? 'bg-pos-primary text-white hover:bg-slate-900 shadow-pos-primary/20'
                    : dark
                      ? 'bg-pos-primary text-white hover:scale-105 shadow-[0_0_25px_rgba(232,160,160,0.4)]'
                      : 'bg-slate-900 text-white hover:bg-pos-primary shadow-slate-900/20'
                  }`}
              >
                Sign In
              </Link>
            </nav>

            {/* ── MOBILE TOGGLE ── */}
            <button
              className={`lg:hidden p-1 transition-colors ${!isSticky && dark ? 'text-white' : 'text-slate-900'}`}
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
                {logoScrolledUrl ? (
                  <img
                    src={logoScrolledUrl}
                    alt="Website Logo"
                    className="h-10 md:h-12 w-auto max-w-[200px] object-contain drop-shadow-sm"
                  />
                ) : logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Website Logo"
                    className="h-10 md:h-12 w-auto max-w-[200px] object-contain drop-shadow-sm"
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
              {navLinks.map((link) => {
                const isAnchor = link.href.startsWith('/#');
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      if (isAnchor && window.location.pathname === '/') {
                        e.preventDefault();
                        const id = link.href.split('#')[1];
                        const element = document.getElementById(id);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' });
                        }
                      }
                    }}
                    className="text-xl font-semibold text-slate-900 tracking-tight hover:text-pos-primary"
                  >
                    {link.name}
                  </Link>
                );
              })}
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
