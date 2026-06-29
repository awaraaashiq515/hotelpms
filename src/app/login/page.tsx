'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, ArrowRight, Shield, RefreshCcw, Bluetooth } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { APIError } from '@/lib/api/client';

// ── Android Permission Request Helper ──
// Requests Bluetooth permissions automatically when running inside the Android app.
// Uses cordova-plugin-android-permissions (already installed).
function requestAndroidPermissions() {
  const win = window as any;

  // Only run inside Capacitor Android app
  const isCapacitor =
    typeof win.Capacitor !== 'undefined' || (navigator.userAgent || '').includes('Capacitor');
  if (!isCapacitor) return;

  const PERMISSIONS = [
    'android.permission.BLUETOOTH_CONNECT',
    'android.permission.BLUETOOTH_SCAN',
    'android.permission.ACCESS_FINE_LOCATION',
  ];

  const tryRequest = () => {
    const permissions = win.cordova?.plugins?.permissions;
    if (!permissions) return; // plugin not ready yet, will retry

    PERMISSIONS.forEach((perm) => {
      permissions.checkPermission(
        perm,
        (status: any) => {
          if (!status.hasPermission) {
            permissions.requestPermission(perm, () => {}, () => {});
          }
        },
        () => {}
      );
    });
  };

  // Try immediately, and also after deviceready fires (whichever comes first)
  tryRequest();
  document.addEventListener('deviceready', tryRequest, { once: true });
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState('/api/auth/captcha');
  const [otpToken, setOtpToken] = useState('');
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [permissionsMissing, setPermissionsMissing] = useState(false);
  const [androidVersion, setAndroidVersion] = useState(12);

  const openSettings = async () => {
    try {
      const { NativeSettings, AndroidSettings } = require('capacitor-native-settings');
      await NativeSettings.openAndroid({
        option: AndroidSettings.ApplicationDetails,
      });
    } catch (err) {
      console.error('Error opening native settings', err);
    }
  };

  useEffect(() => {
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.logoUrl) {
          setLogoUrl(json.data.logoUrl);
        }
      })
      .catch(() => {});
    refreshCaptcha();

    // ── Check Android permissions on app load ──
    const win = window as any;
    const isCapacitor =
      typeof win.Capacitor !== 'undefined' || (navigator.userAgent || '').includes('Capacitor');

    if (isCapacitor) {
      const checkPermissionsOnly = () => {
        const permissions = win.cordova?.plugins?.permissions;
        if (!permissions) return;

        // Parse Android version from User Agent
        const ua = navigator.userAgent;
        const androidMatch = ua.match(/Android\s+([0-9\.]+)/i);
        let version = 12; // default to 12
        if (androidMatch) {
          version = parseFloat(androidMatch[1]);
          setAndroidVersion(version);
        }

        // Determine which permissions to check based on Android version
        let PERMISSIONS: string[] = [];
        if (version >= 12) {
          // Android 12+ requires Bluetooth Connect, Scan, and Fine Location
          PERMISSIONS = [
            'android.permission.BLUETOOTH_CONNECT',
            'android.permission.BLUETOOTH_SCAN',
            'android.permission.ACCESS_FINE_LOCATION',
          ];
        } else {
          // Android 11 and lower only requires Location runtime permission
          PERMISSIONS = [
            'android.permission.ACCESS_FINE_LOCATION',
          ];
        }

        let missing = false;
        let checked = 0;

        PERMISSIONS.forEach((perm) => {
          permissions.checkPermission(
            perm,
            (status: any) => {
              checked++;
              if (!status.hasPermission) {
                missing = true;
              }
              if (checked === PERMISSIONS.length) {
                setPermissionsMissing(missing);
              }
            },
            () => {
              checked++;
              if (checked === PERMISSIONS.length) {
                setPermissionsMissing(true); // default to warning on error
              }
            }
          );
        });
      };

      // Try immediately + on deviceready
      checkPermissionsOnly();
      document.addEventListener('deviceready', checkPermissionsOnly, { once: true });
    }
  }, []);

  const refreshCaptcha = () => {
    setCaptchaUrl(`/api/auth/captcha?t=${Date.now()}`);
    setCaptchaText('');
  };

  const completeLogin = async () => {
    const res = await fetch('/api/auth/session');
    const data = await res.json();

    if (data.authenticated) {
      const role = data.user.role;
      if (role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'RESTAURANTS_ADMIN') {
        // Use branded slug URL if available, fallback to /dashboard
        const slug = data.user.organizationSlug;
        router.push(slug ? `/restaurantadmin/${slug}` : '/dashboard');
      } else if (role === 'HOTEL_ADMIN' || role === 'HOTEL_MANAGER') {
        router.push('/hotel');
      } else if (role === 'B2B_SUPPLIER') {
        router.push('/b2b/supplier');
      } else if (role === 'DELIVERY_RIDER') {
        router.push('/driver-portal');
      } else {
        const propCode = data.user.propertyCode;
        router.push(propCode ? `/${propCode}/operations` : '/operations');
      }
    } else {
      router.push('/login');
    }

    router.refresh();
  };

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
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* High-performance Premium Background */}
      <div className="absolute inset-0 overflow-hidden z-0 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-rose-900/30 via-slate-950 to-slate-950"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-violet-900/30 via-transparent to-transparent"></div>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[900px] flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(225,29,72,0.15)] border border-white/20 backdrop-blur-xl bg-white/10 transition-all duration-500 hover:shadow-[0_0_60px_rgba(225,29,72,0.2)]">
        
        {/* Brand Side */}
        <div className="w-full md:w-[45%] p-10 flex flex-col justify-between bg-gradient-to-br from-white/10 to-black/20 border-r border-white/10">
          <div>
            <div className="mb-12">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-h-16 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-600/30">
                    <span className="text-white font-black text-xl italic">O</span>
                  </div>
                  <span className="text-white font-black text-2xl tracking-tighter uppercase">OrderMint</span>
                </div>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4 tracking-tight">
              Welcome <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-violet-400">back.</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-sm">
              Log in to manage your ecosystem and access your personalized dashboard.
            </p>
          </div>

          <div className="mt-12">
            <div className="flex items-center gap-4 text-sm font-medium text-slate-300">
              <Shield className="text-emerald-400" size={20} />
              Secure encrypted connection
            </div>
          </div>
        </div>

        {/* Form Side */}
        <div className="w-full md:w-[55%] bg-white p-8 sm:p-12 relative overflow-y-auto max-h-[90vh]">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              {show2FA ? 'Identity Verification' : isForgotPassword ? 'Secure Access' : 'Sign In'}
            </h2>
            <p className="text-slate-500 text-sm">
              {show2FA 
                ? 'Enter the 6-digit code from your Authenticator app.'
                : isForgotPassword 
                ? (resetSent ? 'Check your email for reset instructions.' : 'Enter your email to receive a password reset link.')
                : 'Enter your credentials to access your account.'}
            </p>
          </div>

          {permissionsMissing && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-slate-850 text-sm font-medium animate-in slide-in-from-top-2">
              <Bluetooth size={20} className="text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <span className="font-bold text-amber-900 block mb-1">App Permissions Required</span>
                <span className="text-xs text-slate-650 block leading-relaxed">
                  {androidVersion >= 12
                    ? 'Nearby Devices (Bluetooth) & Location permissions are turned off. Please go to Settings and enable both permissions to connect and print bills.'
                    : 'Location permission is turned off. Please go to Settings and enable Location permission to connect and print bills.'}
                </span>
                <button
                  type="button"
                  onClick={openSettings}
                  className="mt-3 px-4 py-2 bg-amber-650 hover:bg-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm"
                >
                  Open App Settings
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3 text-rose-800 text-sm font-medium animate-in slide-in-from-top-2">
              <Shield size={18} className="text-rose-500 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {show2FA ? (
            <form onSubmit={handle2FAVerify} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
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
                    className="w-full max-w-[280px] text-center text-3xl font-black tracking-[0.25em] px-4 py-6 rounded-2xl border-2 border-slate-200 focus:border-rose-600 bg-white text-slate-900 placeholder-slate-400 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={verifying2FA || otpToken.length < 6}
                className="w-full py-4 bg-slate-900 hover:bg-rose-600 text-white rounded-xl font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 group"
              >
                {verifying2FA ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>Verify Code <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShow2FA(false);
                  setOtpToken('');
                  setError(null);
                }}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                ← Back to Login
              </button>
            </form>
          ) : !resetSent ? (
            <form onSubmit={isForgotPassword ? handleForgotPassword : handleLogin} className="space-y-5">
              {/* Email */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${focusedField === 'email' ? 'text-rose-600' : 'text-slate-400'} transition-colors`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              {!isForgotPassword && (
                <div className="relative">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
                  <div className="relative">
                    <Lock size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${focusedField === 'password' ? 'text-rose-600' : 'text-slate-400'} transition-colors`} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Forgot password link */}
              <div className="flex justify-end px-1">
                {!isForgotPassword ? (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(null); }}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Forgot password?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setError(null); }}
                    className="text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    ← Back to Sign In
                  </button>
                )}
              </div>

              {/* Captcha */}
              {!isForgotPassword && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                  <div className="h-12 w-32 bg-white rounded-lg border border-slate-200 overflow-hidden relative shadow-sm">
                    <img src={captchaUrl} alt="Captcha" className="w-full h-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <RefreshCcw size={16} />
                  </button>
                  <input
                    type="text"
                    required
                    placeholder="Code"
                    value={captchaText}
                    onChange={(e) => setCaptchaText(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none"
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || (!isForgotPassword && !captchaText)}
                className="w-full py-4 bg-slate-900 hover:bg-rose-600 text-white rounded-xl font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 group mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isForgotPassword ? 'Send Reset Link' : 'Sign In'}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don't have an account?{' '}
                <button type="button" onClick={() => router.push('/signup')} className="font-bold text-slate-900 hover:text-rose-600 transition-colors">
                  Create one now
                </button>
              </p>

              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Portal Access</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/staff-portal')}
                  className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  Staff Portal
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-600" />
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/driver-portal')}
                  className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  Driver Portal
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-600" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                  <Mail size={24} className="text-emerald-600" />
                </div>
              </div>
              <p className="text-slate-600 text-sm">We've sent a password reset link to your email.</p>
              <button
                onClick={() => {
                  setResetSent(false);
                  setIsForgotPassword(false);
                  setError(null);
                }}
                className="w-full py-4 rounded-xl font-bold text-sm uppercase tracking-widest border-2 border-slate-100 text-slate-500 hover:bg-slate-50 transition-all"
              >
                Return to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
