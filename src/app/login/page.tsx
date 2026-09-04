'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock, Mail, Eye, EyeOff, ArrowRight, Shield, RefreshCcw, Bluetooth, Sparkles, Handshake
} from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { APIError } from '@/lib/api/client';

export default function LoginPage() {
  const router = useRouter();

  // ── Form State ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ── Password Reset & 2FA State ──
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [verifying2FA, setVerifying2FA] = useState(false);

  // ── Captcha & Settings ──
  const [captchaText, setCaptchaText] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [permissionsMissing, setPermissionsMissing] = useState(false);
  const [androidVersion, setAndroidVersion] = useState(12);

  // Load Settings & Check Permissions
  useEffect(() => {
    fetch('/api/website/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.logoUrl) {
          setLogoUrl(json.data.logoUrl);
        }
      })
      .catch(() => {});
    refreshCaptcha();

    const win = window as any;
    const isCapacitor =
      typeof win.Capacitor !== 'undefined' || (navigator.userAgent || '').includes('Capacitor');

    if (isCapacitor) {
      const checkPermissionsOnly = () => {
        const permissions = win.cordova?.plugins?.permissions;
        if (!permissions) return;

        const ua = navigator.userAgent;
        const androidMatch = ua.match(/Android\s+([0-9\.]+)/i);
        let version = 12;
        if (androidMatch) {
          version = parseFloat(androidMatch[1]);
          setAndroidVersion(version);
        }

        let PERMISSIONS: string[] = [];
        if (version >= 12) {
          PERMISSIONS = [
            'android.permission.BLUETOOTH_CONNECT',
            'android.permission.BLUETOOTH_SCAN',
            'android.permission.ACCESS_FINE_LOCATION',
          ];
        } else {
          PERMISSIONS = ['android.permission.ACCESS_FINE_LOCATION'];
        }

        let missing = false;
        let checked = 0;

        PERMISSIONS.forEach((perm) => {
          permissions.checkPermission(
            perm,
            (status: any) => {
              checked++;
              if (!status.hasPermission) missing = true;
              if (checked === PERMISSIONS.length) setPermissionsMissing(missing);
            },
            () => {
              checked++;
              if (checked === PERMISSIONS.length) setPermissionsMissing(true);
            }
          );
        });
      };

      checkPermissionsOnly();
      document.addEventListener('deviceready', checkPermissionsOnly, { once: true });
    }
  }, []);

  const openSettings = async () => {
    try {
      const { NativeSettings, AndroidSettings } = require('capacitor-native-settings');
      await NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
    } catch (err) {
      console.error('Error opening native settings', err);
    }
  };

  const refreshCaptcha = async () => {
    setCaptchaText('');
    setCaptchaSvg(null);
    setCaptchaToken(null);
    try {
      const res = await fetch(`/api/auth/captcha?json=true&t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCaptchaSvg(json.svg);
          setCaptchaToken(json.token);
        }
      }
    } catch (e) {
      console.error('Failed to load captcha', e);
    }
  };

  // ── Auto-Route Based on Authenticated Role ──
  const completeLogin = async () => {
    const res = await fetch('/api/auth/session');
    const data = await res.json();

    if (data.authenticated) {
      const role = data.user.role;
      const isHotelProperty = data.user.propertyType === 'HOTEL';
      const isHotelRole = role.startsWith('HOTEL_');

      if (role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'RESTAURANTS_ADMIN') {
        if (isHotelProperty) {
          router.push('/hotel');
        } else {
          const slug = data.user.organizationSlug;
          router.push(slug ? `/restaurantadmin/${slug}` : '/hotel');
        }
      } else if (role === 'HOTEL_ADMIN' || role === 'HOTEL_MANAGER' || isHotelRole) {
        // ↑ IMPORTANT: Only route to /hotel for actual HOTEL admin/manager roles
        // Do NOT include isHotelProperty here — Waiter/Staff also have HOTEL property type
        router.push('/hotel');
      } else if (role === 'B2B_SUPPLIER') {
        const propCode = data.user.propertyCode;
        router.push(propCode ? `/${propCode}/b2b/supplier` : '/b2b/supplier');
      } else if (role === 'DELIVERY_RIDER') {
        router.push('/transport-portal/dashboard');
      } else if (role === 'SINGER') {
        router.push('/singer-portal/dashboard');
      } else if (
        role.toLowerCase().includes('housekeeper') || 
        role.toLowerCase().includes('housekeeping') || 
        (data.user.designation && (
          data.user.designation.toLowerCase().includes('housekeeper') || 
          data.user.designation.toLowerCase().includes('housekeeping')
        ))
      ) {
        const propCode = data.user.propertyCode?.toLowerCase();
        router.push(propCode ? `/housekeeper-portal/${propCode}` : '/housekeeper-portal');
      } else if (role === 'POSSYSTEM') {
        const propCode = data.user.propertyCode;
        router.push(propCode ? `/${propCode}/operations` : '/operations');
      } else {
        // All other roles (Waiter, Cook, Staff, etc.) → staff-portal
        const propCode = data.user.propertyCode?.toLowerCase();
        router.push(propCode ? `/staff-portal/${propCode}` : '/staff-portal');
      }
    } else {
      const singerToken = localStorage.getItem('singer_token');
      if (singerToken) {
        router.push('/singer-portal/dashboard');
      } else {
        router.push('/login');
      }
    }

    router.refresh();
  };

  // ── Single Form Login Handler ──
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ── STEP 1: Try Singer login first (Singer is in a separate table) ──
      try {
        const singerRes = await fetch('/api/singer/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const singerData = await singerRes.json();

        if (singerData.success && singerData.token) {
          localStorage.setItem('singer_token', singerData.token);
          localStorage.setItem('singer_info', JSON.stringify(singerData.singer));
          router.push('/singer-portal/dashboard');
          router.refresh();
          return;
        }
      } catch (_) {
        // Singer auth failed — continue to next
      }

      // ── STEP 1.5: Try Travel Agent login (TravelAgent is in a separate table) ──
      try {
        const agentRes = await fetch('/api/agent-portal/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const agentData = await agentRes.json();

        if (agentData.success && agentData.data) {
          localStorage.setItem('agent_info', JSON.stringify(agentData.data));
          if (agentData.stats) {
            localStorage.setItem('agent_stats', JSON.stringify(agentData.stats));
          }
          router.push('/agent-portal');
          router.refresh();
          return;
        }
      } catch (_) {
        // Agent auth failed — continue to next
      }

      // ── STEP 1.8: Try Hotel Guest / Customer login (Guest table) ──
      try {
        const guestRes = await fetch('/api/guest-portal/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: email, password }),
        });
        const guestData = await guestRes.json();

        if (guestData.success && guestData.token) {
          localStorage.setItem('guest_token', guestData.token);
          if (guestData.guest) {
            localStorage.setItem('guest_info', JSON.stringify(guestData.guest));
          }
          router.push('/guest-portal/dashboard');
          router.refresh();
          return;
        }
      } catch (_) {
        // Guest auth failed — continue to standard login
      }


      // ── STEP 2: Standard Login (Hotel Owner, Driver, Supplier, Staff etc.) ──
      const response = await authApi.login({ email, password, captchaText, captchaToken });

      if (response.twoFactorRequired) {
        setTempUserId(response.userId || null);
        setShow2FA(true);
        setLoading(false);
        return;
      }

      await completeLogin();
    } catch (err: any) {
      if (err instanceof APIError) {
        setError(err.message);
      } else {
        setError(err?.message || 'Invalid email or password. Please try again.');
      }
      setLoading(false);
      refreshCaptcha();
    }
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

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-rose-600/10 blur-[150px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px]" />
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-[460px] bg-slate-900/90 border border-white/15 rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-4 drop-shadow" />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-tr from-rose-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-600/20 mb-4">
              <span className="text-white font-black text-xl italic">GF</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {show2FA ? 'Identity Verification' : isForgotPassword ? 'Password Recovery' : 'Sign In'}
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 leading-relaxed">
            {show2FA
              ? 'Enter the 6-digit code from your authenticator app.'
              : isForgotPassword
              ? 'Enter your email address to reset your password.'
              : 'Enter your email address and password to sign in.'}
          </p>
        </div>

        {/* Android Bluetooth Printer Notice (if permissions missing) */}
        {permissionsMissing && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200 text-xs font-medium">
            <Bluetooth size={18} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="font-bold text-amber-300 block mb-0.5">Android POS Printer Permission</span>
              <span className="text-amber-200/80 block leading-relaxed mb-2">
                {androidVersion >= 12
                  ? 'Nearby Devices (Bluetooth) & Fine Location permissions are off.'
                  : 'Location permission is off.'}
              </span>
              <button
                type="button"
                onClick={openSettings}
                className="px-3 py-1 bg-amber-600 text-white rounded-lg font-bold text-[10px] uppercase"
              >
                Open Settings
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm font-medium">
            <Shield size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              {typeof error === 'string' ? error : JSON.stringify(error)}
            </div>
          </div>
        )}

        {/* 2FA Verification Form */}
        {show2FA ? (
          <form onSubmit={handle2FAVerify} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
                6-Digit Security Code
              </label>
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  className="w-full max-w-[280px] text-center text-3xl font-black tracking-[0.25em] px-4 py-5 rounded-2xl border-2 border-rose-500/50 bg-slate-950 text-white outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={verifying2FA || otpToken.length < 6}
              className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30"
            >
              {verifying2FA ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Verify Security Code <ArrowRight size={16} /></>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setShow2FA(false); setOtpToken(''); setError(null); }}
              className="w-full text-center text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider"
            >
              ← Back to Sign In
            </button>
          </form>
        ) : !resetSent ? (
          <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-5">
            {/* Email Address Field */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    focusedField === 'email' ? 'text-rose-400' : 'text-slate-500'
                  }`}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            {!isForgotPassword && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(null); }}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={17}
                    className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                      focusedField === 'password' ? 'text-rose-400' : 'text-slate-500'
                    }`}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Captcha Field */}
            {!isForgotPassword && (
              <div className="p-3 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center gap-3">
                <div className="h-11 w-32 bg-white rounded-xl overflow-hidden relative shadow shrink-0">
                  {captchaSvg ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: captchaSvg }}
                      className="w-full h-full flex items-center justify-center"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                      <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={refreshCaptcha}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl shrink-0"
                  title="Refresh Captcha"
                >
                  <RefreshCcw size={16} />
                </button>
                <input
                  type="text"
                  required
                  placeholder="Captcha Code"
                  value={captchaText}
                  onChange={(e) => setCaptchaText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!isForgotPassword && !captchaText)}
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 group mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isForgotPassword ? 'Send Reset Link' : 'Sign In'}
                  <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center py-4">
            <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
              <Mail size={24} className="text-emerald-400" />
            </div>
            <p className="text-slate-300 text-sm">We've sent a password reset link to your email.</p>
            <button
              onClick={() => { setResetSent(false); setIsForgotPassword(false); setError(null); }}
              className="w-full py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-white/20 text-slate-300 hover:bg-white/10"
            >
              Return to Sign In
            </button>
          </div>
        )}

        {/* Standard "Create Account" Link below Sign In */}
        <div className="mt-6 pt-5 border-t border-white/10 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="font-bold text-rose-400 hover:text-rose-300 transition-colors"
          >
            Create one now
          </button>
        </div>

        {/* Agent Portal Link */}
        <div className="mt-3">
          <button
            type="button"
            id="agent-portal-login-btn"
            onClick={() => router.push('/agent-portal')}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10 hover:border-violet-500/50 text-violet-300 text-sm font-bold transition-all duration-200 group"
          >
            <Handshake size={16} className="text-violet-400 group-hover:scale-110 transition-transform" />
            Travel Agent? Login here
            <ArrowRight size={14} className="text-violet-500 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
