'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Sparkles, Shield, Zap, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth';
import { APIError } from '@/lib/api/client';
import { RefreshCcw } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState('/api/auth/captcha');

  const refreshCaptcha = () => {
    setCaptchaUrl(`/api/auth/captcha?t=${Date.now()}`);
    setCaptchaText('');
  };
  const [otpToken, setOtpToken] = useState('');
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [verifying2FA, setVerifying2FA] = useState(false);

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
      const response = await authApi.login({ email, password, captchaText });

      if (response.twoFactorRequired) {
        setTempUserId(response.userId || null);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      await completeLogin();
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please check your connection.');
      }
      setLoading(false);
      refreshCaptcha();
    }
  };

  const completeLogin = async () => {
    const res = await fetch('/api/auth/session');
    const data = await res.json();

    if (data.authenticated) {
      const role = data.user.role;
      if (role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'RESTAURANTS_ADMIN') {
        router.push('/dashboard');
      } else if (role === 'B2B_SUPPLIER') {
        router.push('/b2b/supplier');
      } else {
        router.push('/operations');
      }
    } else {
      router.push('/operations');
    }

    router.refresh();
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying2FA(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/2fa/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId, token: otpToken }),
      });
      const data = await res.json();

      if (data.success) {
        await completeLogin();
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (err) {
      setError('An unexpected error occurred during verification.');
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setResetSent(true);
      } else {
        setError(data.error || 'Failed to request password reset');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
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
        <div className="lg:hidden mb-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xl italic">O</span>
            </div>
            <span className="text-red-700 font-black text-2xl tracking-tighter uppercase">OrderMint</span>
          </div>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Header text */}
          <div className="mb-8">
            <p className="text-[11px] font-bold text-red-700 uppercase tracking-[0.25em] mb-2">
              {show2FA ? 'Identity Verification' : isForgotPassword ? 'Secure Access' : 'Welcome back'}
            </p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              {show2FA ? 'Enter 2FA Code' : isForgotPassword ? (resetSent ? 'Check your email' : 'Reset your password') : 'Sign in to your account'}
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium">
              {show2FA 
                ? 'A 6-digit code has been requested from your Authenticator app'
                : isForgotPassword 
                ? (resetSent ? `We've sent a recovery link to ${email}` : 'Enter your email to receive a password reset link')
                : 'Enter your credentials to access the dashboard'}
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
          {show2FA ? (
            <form onSubmit={handle2FAVerify} className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-3 text-center">
                  6-Digit Verification Code
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    autoFocus
                    className="w-full max-w-[280px] text-center text-3xl font-black tracking-[0.25em] px-4 py-6 rounded-2xl border-2 border-slate-200 focus:border-red-700 bg-white text-slate-900 placeholder-slate-400 outline-none transition-all shadow-inner dark:bg-slate-800 dark:text-white dark:border-slate-700"
                    style={{
                      boxShadow: focusedField === 'otp' ? '0 0 0 4px rgba(185,28,28,0.08)' : 'none',
                    }}
                    onFocus={() => setFocusedField('otp')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight text-center mt-4">
                  Open your Google Authenticator app to get the code
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={verifying2FA || otpToken.length < 6}
                  className="w-full relative flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all duration-300 overflow-hidden group"
                  style={{
                    background: verifying2FA
                      ? '#9f1239'
                      : 'linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #c2410c 100%)',
                    boxShadow: verifying2FA
                      ? 'none'
                      : '0 8px 24px rgba(185,28,28,0.35), 0 2px 8px rgba(185,28,28,0.2)',
                    opacity: otpToken.length < 6 ? 0.6 : 1
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {verifying2FA ? (
                      <>
                        <div
                          className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                          style={{ animation: 'spin 0.8s linear infinite' }}
                        />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify Code
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShow2FA(false);
                    setOtpToken('');
                    setError(null);
                  }}
                  className="w-full py-4 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase tracking-widest transition-colors"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          ) : !resetSent ? (
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-4">
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

              {/* Password Field - Only for Login */}
              {!isForgotPassword && (
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
                      required={!isForgotPassword}
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
              )}

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between px-1 py-2">
                {!isForgotPassword ? (
                  <>
                    <div 
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => document.getElementById('remember-device')?.click()}
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          id="remember-device"
                        />
                        <div className="w-4 h-4 border-2 border-gray-300 rounded peer-checked:bg-red-700 peer-checked:border-red-700 transition-all" />
                      </div>
                      <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-600 uppercase tracking-tight">
                        Remember me
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsForgotPassword(true);
                        setError(null);
                      }}
                      className="text-xs font-bold text-gray-500 hover:text-red-700 transition-colors uppercase tracking-tight cursor-pointer py-1"
                    >
                      Forgot password?
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsForgotPassword(false);
                      setError(null);
                      setResetSent(false);
                    }}
                    className="text-xs font-bold text-gray-500 hover:text-red-700 transition-colors uppercase tracking-tight flex items-center gap-1 cursor-pointer py-1"
                  >
                    ← Back to Sign In
                  </button>
                )}
              </div>

              {/* Submit Button */}
              {/* Premium Security Widget */}
              {!isForgotPassword && (
                <div className="pt-6 mt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                      <Shield size={60} className="text-slate-900 dark:text-white" />
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-red-600 border border-slate-100 dark:border-slate-700">
                          <Lock size={14} />
                        </div>
                        <div>
                          <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Human Verification</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Please solve to continue</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/50 uppercase tracking-widest">
                        High Trust
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-14 bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center relative group/img shadow-inner overflow-hidden">
                        <img 
                          src={captchaUrl} 
                          alt="Math Challenge" 
                          className="h-full w-full object-contain" 
                        />
                        <button 
                          type="button"
                          onClick={refreshCaptcha}
                          className="absolute right-2 top-2 p-1.5 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-700 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm border border-slate-100 dark:border-slate-700"
                        >
                          <RefreshCcw size={14} className="active:rotate-180 transition-transform" />
                        </button>
                      </div>

                      <div className="w-32 h-14 relative">
                        <input
                          type="text"
                          placeholder="ANS"
                          value={captchaText}
                          onChange={(e) => setCaptchaText(e.target.value)}
                          className="w-full h-full bg-white dark:bg-slate-950 rounded-2xl border-2 border-slate-100 dark:border-slate-800 focus:border-red-600 outline-none text-center font-black text-sm text-slate-900 dark:text-white transition-all placeholder:text-slate-200 placeholder:text-[10px] shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || (!isForgotPassword && !captchaText)}
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
                        {isForgotPassword ? 'Sending...' : 'Signing in...'}
                      </>
                    ) : (
                      <>
                        {isForgotPassword ? 'Send Reset Link' : 'Sign In'}
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                  <Mail size={24} className="text-green-600" />
                </div>
              </div>
              <button
                onClick={() => {
                  setResetSent(false);
                  setIsForgotPassword(false);
                  setError(null);
                }}
                className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest border-2 border-gray-100 text-gray-500 hover:bg-gray-50 transition-all"
              >
                Return to Sign In
              </button>
            </div>
          )}

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
