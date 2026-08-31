'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const CYAN = '#00c8ff';
const CYAN2 = '#0099e6';

export const WebsiteHeader = ({ isSimple = false, dark = true }: { isSimple?: boolean, dark?: boolean }) => {
  const [isSticky, setIsSticky] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoScrolledUrl, setLogoScrolledUrl] = useState<string | null>(null);
  const [hotelName, setHotelName] = useState<string>('GuestFlow');
  const [tagline, setTagline] = useState<string>('Hotel Management');

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);

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
      .catch(() => {});

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <>
      <header
        className={`w-full z-50 transition-all duration-300 ${
          isSticky
            ? 'fixed top-0 left-0 right-0 bg-[#060a12]/90 backdrop-blur-md shadow-lg border-b border-white/[0.08]'
            : 'absolute top-0 left-0 right-0 bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* ── LOGO ── */}
            <Link href="/" className="flex-shrink-0 group relative z-[60] flex items-center gap-3">
              {isSticky && logoScrolledUrl ? (
                <img
                  src={logoScrolledUrl}
                  alt={hotelName}
                  className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
              ) : logoUrl ? (
                <img
                  src={logoUrl}
                  alt={hotelName}
                  className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-sm shadow-md"
                    style={{ background: `linear-gradient(135deg, ${CYAN2}, ${CYAN})` }}
                  >
                    G
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="text-base font-extrabold tracking-tight text-white group-hover:text-[#00c8ff] transition-colors">
                      {hotelName}
                    </span>
                    <span className="text-[9px] tracking-[0.18em] font-semibold uppercase text-slate-400 mt-0.5">
                      {tagline}
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {/* ── NAV LINKS ── */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-xs font-semibold text-slate-300 hover:text-[#00c8ff] transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}

              <Link
                href="/login"
                className="px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 text-black shadow-md hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${CYAN2}, ${CYAN})`,
                  boxShadow: '0 0 20px rgba(0,200,255,0.3)',
                }}
              >
                Sign In
              </Link>
            </nav>

            {/* ── MOBILE TOGGLE ── */}
            <button
              className="lg:hidden p-2 text-slate-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 bg-[#060a12] z-[60] flex flex-col p-6 border-b border-white/10">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-black text-sm"
                  style={{ background: `linear-gradient(135deg, ${CYAN2}, ${CYAN})` }}
                >
                  G
                </div>
                <span className="text-lg font-bold text-white">{hotelName}</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Close menu"
              >
                <X size={26} />
              </button>
            </div>

            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-semibold text-slate-300 hover:text-[#00c8ff] py-2 border-b border-white/5"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-4 text-center py-2.5 rounded-xl font-bold text-xs text-black"
                style={{ background: `linear-gradient(135deg, ${CYAN2}, ${CYAN})` }}
              >
                Sign In
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};
