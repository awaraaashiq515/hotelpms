'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

interface Settings {
  hotelName: string;
  address: string;
  email: string;
  phone: string;
}

export const WebsiteFooter = () => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/website/settings');
        const json = await res.json();
        if (json.success) setSettings(json.data);
      } catch (err) {
        console.error('Failed to fetch footer settings', err);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer id="contact" className="bg-pos-sidebar text-white pt-24 pb-12 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
        {/* Brand */}
        <div className="flex flex-col gap-8">
          <Link href="/" className="flex flex-col">
            <span className="text-3xl font-bold tracking-tighter uppercase text-white">
              OrderMint
            </span>
            <span className="text-[10px] tracking-[0.3em] font-medium uppercase text-pos-primary">
              Next-Gen POS Solutions
            </span>
          </Link>
          <p className="text-slate-400 font-medium leading-relaxed">
            Revolutionizing restaurant and retail management with our cutting-edge cloud POS solution. Built for growth and efficiency.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-pos-primary hover:border-pos-primary hover:text-white transition-all">
              <Facebook size={20} />
            </a>
            <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-pos-primary hover:border-pos-primary hover:text-white transition-all">
              <Instagram size={20} />
            </a>
            <a href="#" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-pos-primary hover:border-pos-primary hover:text-white transition-all">
              <Twitter size={20} />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-bold uppercase tracking-widest mb-8 text-pos-primary">Product</h4>
          <ul className="space-y-4 text-slate-400 font-bold text-sm uppercase tracking-wide">
            <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
            <li><Link href="/benefits" className="hover:text-white transition-colors">Benefits</Link></li>
            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Customer Portal</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div className="lg:col-span-2">
          <h4 className="text-lg font-bold uppercase tracking-widest mb-8 text-pos-primary">Get In Touch</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start gap-4 text-slate-400">
              <MapPin className="text-pos-primary shrink-0" />
              <p className="text-sm font-medium leading-relaxed uppercase tracking-tight">
                {settings?.address || 'Mandi, Himachal Pradesh 175001, India'}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-slate-400">
                <Phone className="text-pos-primary shrink-0" size={20} />
                <p className="text-sm font-bold">{settings?.phone || '+91 86798 00074'}</p>
              </div>
              <div className="flex items-center gap-4 text-slate-400">
                <Mail className="text-pos-primary shrink-0" size={20} />
                <p className="text-sm font-bold">{settings?.email || 'support@ordermint.com'}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-xl">
            <h5 className="text-sm font-bold uppercase tracking-widest mb-4 text-white">Subscribe to our Newsletter</h5>
            <div className="flex gap-4">
              <input type="email" placeholder="Enter your email" className="bg-slate-800/50 border border-white/10 rounded-xl flex-1 px-4 py-3 text-sm focus:border-pos-primary outline-none transition-colors text-white" />
              <button className="px-6 py-3 bg-pos-primary text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-pos-primary transition-all">Join</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-500">
        <p>© 2024 OrderMint Solutions Inc. All Rights Reserved.</p>

        <div className="flex gap-8">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>

  );
};
