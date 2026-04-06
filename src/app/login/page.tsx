'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles, Shield, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth';
import { APIError } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.logoUrl) {
          setLogoUrl(json.data.logoUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authApi.login({ email, password });

      const res = await fetch('/api/auth/session');
      const data = await res.json();

      if (data.authenticated) {
        const role = data.user.role;
        if (role === 'SUPER_ADMIN') {
          router.push('/admin/dashboard');
        } else if (role === 'RESTAURANTS_ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/operations');
        }
      } else {
        router.push('/operations');
      }

      router.refresh();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, text: 'Lightning-fast billing & KOT' },
    { icon: Users, text: 'Multi-role staff management' },
    { icon: Shield, text: 'Enterprise-grade security' },
    { icon: Sparkles, text: 'AI-powered menu scanning' },
  ];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── LEFT PANEL (Brand Panel) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col items-center justify-center p-12 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #e8a0a0 0%, #e8a0a0 40%, #d98080 100%)',
        }}
      >
        {/* Animated background circles */}
        <div
          className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-80px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #fff 0%, transparent 60%)' }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(127,29,29,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(127,29,29,0.15) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          {/* Logo area */}
          <div className="mb-10 flex items-center justify-center">
            {logoUrl ? (
              <div className="p-5 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-2xl">
                <img
                  src={logoUrl}
                  alt="Brand Logo"
                  className="h-16 md:h-20 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="p-5 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#b91c1c] rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-xl">O</span>
                  </div>
                  <div className="text-left">
                    <div className="text-[#7f1d1d] font-black text-2xl tracking-tight">OrderMint</div>
                    <div className="text-[#b91c1c] text-[10px] tracking-[0.3em] font-semibold uppercase">POS Solutions</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <h2 className="text-[#7f1d1d] text-4xl font-black leading-tight mb-4 tracking-tight">
            Manage smarter,<br />
            <span className="text-[#991b1b]">serve faster.</span>
          </h2>
          <p className="text-[#7f1d1d]/70 text-sm leading-relaxed mb-10">
            Your all-in-one restaurant management platform — from billing
            to kitchen orders, all in one powerful dashboard.
          </p>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2.5 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/80 shadow-sm"
              >
                <div className="w-7 h-7 bg-[#b91c1c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-[#b91c1c]" />
                </div>
                <span className="text-[#7f1d1d] text-[11px] font-semibold leading-tight">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-8 text-[#7f1d1d]/50 text-[10px] tracking-[0.25em] font-bold uppercase">
          Precision Engineering by Ritchie POS
        </div>
      </div>

      {/* ── RIGHT PANEL (Form Panel) ── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col items-center justify-center min-h-screen bg-[#fafafa] p-6 sm:p-10 relative">
        {/* Mobile logo at top */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Brand Logo" className="h-14 w-auto object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-red-700 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-base">O</span>
              </div>
              <span className="text-red-700 font-black text-xl tracking-tight">OrderMint</span>
            </div>
          )}
        </div>

        <div className="w-full max-w-[400px]">
          {/* Header text */}
          <div className="mb-8">
            <p className="text-[11px] font-bold text-red-700 uppercase tracking-[0.25em] mb-2">
              Welcome back
            </p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Sign in to your account
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium">
              Enter your credentials to access the dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-5 flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3"
              style={{
                animation: 'slideDown 0.3s ease',
              }}
            >
              <Shield size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-600 text-[12px] font-semibold leading-snug">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Email Address
              </label>
              <div
                className="relative group"
                style={{ transition: 'all 0.2s' }}
              >
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: focusedField === 'email' ? '#b91c1c' : '#9ca3af' }}
                >
                  <Mail size={17} />
                </div>
                <input
                  id="login-email"
                  type="email"
                  placeholder="admin@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-4 bg-white border-2 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-300 outline-none transition-all duration-200"
                  style={{
                    borderColor: focusedField === 'email' ? '#b91c1c' : '#e5e7eb',
                    boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(185,28,28,0.08)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Password
              </label>
              <div className="relative group">
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: focusedField === 'password' ? '#b91c1c' : '#9ca3af' }}
                >
                  <Lock size={17} />
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-12 py-4 bg-white border-2 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-300 outline-none transition-all duration-200"
                  style={{
                    borderColor: focusedField === 'password' ? '#b91c1c' : '#e5e7eb',
                    boxShadow: focusedField === 'password' ? '0 0 0 4px rgba(185,28,28,0.08)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    id="remember-device"
                  />
                  <div className="w-4 h-4 border-2 border-gray-300 rounded peer-checked:bg-red-700 peer-checked:border-red-700 transition-all" />
                </div>
                <span className="text-[11px] font-semibold text-gray-400 group-hover:text-gray-600 uppercase tracking-tight">
                  Remember me
                </span>
              </label>
              <button
                type="button"
                className="text-[11px] font-bold text-gray-400 hover:text-red-700 transition-colors uppercase tracking-tight"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full relative flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all duration-300 overflow-hidden group"
                style={{
                  background: loading
                    ? '#9f1239'
                    : 'linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #c2410c 100%)',
                  boxShadow: loading
                    ? 'none'
                    : '0 8px 24px rgba(185,28,28,0.35), 0 2px 8px rgba(185,28,28,0.2)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #9a3412 100%)',
                  }}
                />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <div
                        className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                        style={{ animation: 'spin 0.8s linear infinite' }}
                      />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2">
            <div className="w-5 h-5 bg-red-50 rounded-lg flex items-center justify-center">
              <Shield size={11} className="text-red-700" />
            </div>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
              Secured &amp; Encrypted Connection
            </p>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden mt-10 text-center">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">
            Precision Engineering by{' '}
            <span className="text-red-700">Ritchie POS</span>
          </p>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
