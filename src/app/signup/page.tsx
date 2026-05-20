'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles, Shield, Zap, Users, User, Building2, RefreshCcw } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { APIError } from '@/lib/api/client';

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState('/api/auth/captcha');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const refreshCaptcha = () => {
    setCaptchaUrl(`/api/auth/captcha?t=${Date.now()}`);
    setCaptchaText('');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authApi.register({
        fullName,
        email,
        password,
        businessName: businessName || null,
        captchaText,
      });

      setSuccess('Your account has been created successfully! Redirecting to login...');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2500);

    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please check your network connection.');
      }
      setLoading(false);
      refreshCaptcha();
    }
  };

  const features = [
    { icon: Zap, text: 'Instant Billing & Digital KOT' },
    { icon: Users, text: 'Custom Permissions & Role Controls' },
    { icon: Shield, text: 'Secure Transactions & Audit Logs' },
    { icon: Sparkles, text: 'Real-Time Dynamic Menu Settings' },
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
            <div className="p-6 bg-white/80 backdrop-blur-sm rounded-[2rem] border border-white/60 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#b91c1c] rounded-3xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-3xl italic">O</span>
                </div>
                <div className="text-left">
                  <div className="text-[#7f1d1d] font-black text-4xl tracking-tighter leading-none">OrderMint</div>
                  <div className="text-[#b91c1c] text-[12px] tracking-[0.4em] font-bold uppercase mt-1">POS Solutions</div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-[#7f1d1d] text-4xl font-black leading-tight mb-4 tracking-tight">
            Empower your venue,<br />
            <span className="text-[#991b1b]">delight guests.</span>
          </h2>
          <p className="text-[#7f1d1d]/70 text-sm leading-relaxed mb-10">
            Join thousands of restaurants, cafes, and hotels scaling their operations 
            with our ultra-responsive multi-tenant POS terminal ecosystem.
          </p>

          {/* Feature pills */}
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2.5 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/80 shadow-sm hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="w-7 h-7 bg-[#b91c1c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-[#b91c1c]" />
                </div>
                <span className="text-[#7f1d1d] text-[11px] font-semibold leading-tight text-left">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-8 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
            <span className="text-[#7f1d1d] font-black text-[11px] tracking-[0.15em] uppercase">OrderMint POS</span>
            <span className="w-1 h-1 rounded-full bg-[#7f1d1d]/50" />
            <span className="text-[#7f1d1d]/70 text-[10px] font-semibold tracking-widest uppercase">by Ritchie</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (Form Panel) ── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col items-center justify-center min-h-screen bg-[#fafafa] p-6 sm:p-10 relative">
        {/* Mobile logo at top */}
        <div className="lg:hidden mb-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl italic">O</span>
            </div>
            <span className="text-red-700 font-black text-2xl tracking-tighter uppercase">OrderMint</span>
          </div>
        </div>

        <div className="w-full max-w-[420px]">
          {/* Header text */}
          <div className="mb-6">
            <p className="text-[11px] font-bold text-red-700 uppercase tracking-[0.25em] mb-2">
              Free 30-Day Trial Included
            </p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Create your account
            </h1>
            <p className="text-gray-400 text-sm mt-1.5 font-medium">
              Start managing your restaurant portfolio in seconds.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div
              className="mb-5 flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3"
              style={{ animation: 'slideDown 0.3s ease' }}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-emerald-800 text-[10px] font-bold">✓</span>
              </div>
              <p className="text-emerald-700 text-[12px] font-semibold leading-snug">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div
              className="mb-5 flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3"
              style={{ animation: 'slideDown 0.3s ease' }}
            >
              <Shield size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-red-600 text-[12px] font-semibold leading-snug">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Full Name Field */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Full Name
              </label>
              <div className="relative group">
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: focusedField === 'fullName' ? '#b91c1c' : '#9ca3af' }}
                >
                  <User size={17} />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-300 outline-none transition-all duration-200"
                  style={{
                    borderColor: focusedField === 'fullName' ? '#b91c1c' : '#e5e7eb',
                    boxShadow: focusedField === 'fullName' ? '0 0 0 4px rgba(185,28,28,0.08)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: focusedField === 'email' ? '#b91c1c' : '#9ca3af' }}
                >
                  <Mail size={17} />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-300 outline-none transition-all duration-200"
                  style={{
                    borderColor: focusedField === 'email' ? '#b91c1c' : '#e5e7eb',
                    boxShadow: focusedField === 'email' ? '0 0 0 4px rgba(185,28,28,0.08)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Business / Restaurant Name (Optional) */}
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
                Business Name <span className="text-[9px] font-medium text-gray-400 font-mono">(Optional)</span>
              </label>
              <div className="relative group">
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                  style={{ color: focusedField === 'businessName' ? '#b91c1c' : '#9ca3af' }}
                >
                  <Building2 size={17} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Spice Garden Cafe"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onFocus={() => setFocusedField('businessName')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border-2 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-300 outline-none transition-all duration-200"
                  style={{
                    borderColor: focusedField === 'businessName' ? '#b91c1c' : '#e5e7eb',
                    boxShadow: focusedField === 'businessName' ? '0 0 0 4px rgba(185,28,28,0.08)' : 'none',
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
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-12 py-3.5 bg-white border-2 rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-300 outline-none transition-all duration-200"
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

            {/* Premium Security Widget */}
            <div className="pt-4 border-t border-slate-100">
              <div className="bg-slate-50/50 rounded-3xl p-5 border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Shield size={60} className="text-slate-900" />
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-red-600 border border-slate-100">
                      <Lock size={14} />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Human Verification</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Please solve to continue</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">
                    High Trust
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-14 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center relative group/img shadow-inner overflow-hidden">
                    <img 
                      src={captchaUrl} 
                      alt="Math Challenge" 
                      className="h-full w-full object-contain" 
                    />
                    <button 
                      type="button"
                      onClick={refreshCaptcha}
                      className="absolute right-2 top-2 p-1.5 bg-slate-50 text-slate-400 hover:text-red-700 hover:bg-white rounded-xl transition-all shadow-sm border border-slate-100"
                    >
                      <RefreshCcw size={14} className="active:rotate-180 transition-transform" />
                    </button>
                  </div>

                  <div className="w-32 h-14 relative">
                    <input
                      type="text"
                      placeholder="ANS"
                      required
                      value={captchaText}
                      onChange={(e) => setCaptchaText(e.target.value)}
                      className="w-full h-full bg-white rounded-2xl border-2 border-slate-100 focus:border-red-600 outline-none text-center font-black text-sm text-slate-900 transition-all placeholder:text-slate-200 placeholder:text-[10px] shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || !captchaText || !!success}
                className="w-full relative flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all duration-300 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500 font-medium">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-red-700 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </p>
          </div>

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2">
            <div className="w-5 h-5 bg-red-50 rounded-lg flex items-center justify-center">
              <Shield size={11} className="text-red-700" />
            </div>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.25em]">
              Secured &amp; Encrypted Setup
            </p>
          </div>
        </div>

        {/* Mobile footer */}
        <div className="lg:hidden mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-100">
            <span className="text-red-700 font-black text-[11px] tracking-widest uppercase">OrderMint POS</span>
            <span className="w-1 h-1 rounded-full bg-red-300" />
            <span className="text-red-400 text-[10px] font-bold tracking-widest uppercase">by Ritchie</span>
          </div>
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
