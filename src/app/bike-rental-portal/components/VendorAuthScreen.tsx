'use client';

import React, { useState } from 'react';
import { Bike, ShieldCheck, MapPin, Store, User, Phone, Lock, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { VendorProfile } from './types';

interface VendorAuthScreenProps {
  onAuthSuccess: (vendor: VendorProfile) => void;
}

export const VendorAuthScreen: React.FC<VendorAuthScreenProps> = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    phone: '',
    password: '',
    shopName: '',
    city: '',
    state: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authForm.phone || !authForm.password) {
      toast.error('Please enter mobile number and password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bike-rentals/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          phone: authForm.phone,
          password: authForm.password,
          name: authForm.name,
          shopName: authForm.shopName,
          city: authForm.city,
          state: authForm.state,
          address: authForm.address,
        }),
      });

      const json = await res.json();
      if (json.success && json.vendor) {
        toast.success(json.message || 'Logged in successfully!');
        localStorage.setItem('bike_vendor', JSON.stringify(json.vendor));
        onAuthSuccess(json.vendor);
      } else {
        toast.error(json.message || 'Authentication failed');
      }
    } catch {
      toast.error('Network error during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      <Toaster position="top-right" richColors />

      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Banner */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center mx-auto shadow-2xl shadow-rose-500/25">
            <Bike size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Bike & Scooter Rental Portal</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Manage your two-wheeler fleet, receive tourist booking requests & issue walk-in rentals
          </p>
        </div>

        {/* Card Box */}
        <div className="p-6 rounded-3xl bg-[#0b1120] border border-slate-800 space-y-5 shadow-2xl">
          {/* Switcher */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vendor Sign In
            </button>
            <button
              onClick={() => setAuthMode('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register Shop / Fleet
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authMode === 'register' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Owner / Vendor Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={authForm.name}
                      onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                      className="w-full bg-[#060a14] border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Shop / Agency Brand Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Store size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      required
                      type="text"
                      placeholder="e.g. Manali Himalayan Wheels"
                      value={authForm.shopName}
                      onChange={(e) => setAuthForm({ ...authForm, shopName: e.target.value })}
                      className="w-full bg-[#060a14] border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">City / Town *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Manali"
                      value={authForm.city}
                      onChange={(e) => setAuthForm({ ...authForm, city: e.target.value })}
                      className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">State *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Himachal Pradesh"
                      value={authForm.state}
                      onChange={(e) => setAuthForm({ ...authForm, state: e.target.value })}
                      className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Mobile Number (Username) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  required
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={authForm.phone}
                  onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })}
                  className="w-full bg-[#060a14] border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-1">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  required
                  type="password"
                  placeholder="Enter secure password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full bg-[#060a14] border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:opacity-90 font-black text-xs text-white transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              <span>{authMode === 'register' ? 'Register Bike Fleet' : 'Sign In to Dashboard'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
