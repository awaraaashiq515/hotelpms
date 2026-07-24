'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowRight, Shield, CheckCircle2 } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border-4 border-green-100">
            <CheckCircle2 size={40} className="text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Password Reset Successful!</h1>
        <p className="text-gray-500 font-medium">Your password has been updated. Redirecting you to login...</p>
        <button
          onClick={() => router.push('/login')}
          className="text-red-700 font-black uppercase text-xs tracking-widest hover:underline"
        >
          Click here if not redirected
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8">
        <p className="text-[11px] font-bold text-red-700 uppercase tracking-[0.25em] mb-2">
          Secure Reset
        </p>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Create New Password
        </h1>
        <p className="text-gray-400 text-sm mt-2 font-medium">
          Enter a strong password to secure your account
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <Shield size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-600 text-[12px] font-semibold leading-snug">{error}</p>
        </div>
      )}

      {!token ? (
        <button
          onClick={() => router.push('/login')}
          className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
        >
          Return to Login
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
              New Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={17} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 outline-none focus:border-red-700 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5 ml-1">
              Confirm Password
            </label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={17} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-white border-2 border-gray-100 rounded-2xl text-sm font-semibold text-gray-800 outline-none focus:border-red-700 transition-all duration-200"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full relative flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white transition-all duration-300 overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #c2410c 100%)',
                boxShadow: '0 8px 24px rgba(185,28,28,0.35)',
              }}
            >
              <span className="relative z-10 flex items-center gap-2">
                {loading ? 'Updating...' : 'Update Password'}
                {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafafa] p-6 sm:p-10 relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-900 via-red-600 to-orange-500" />
      
      <div className="w-full max-w-[400px] flex flex-col items-center">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-2">
          <div className="w-10 h-10 bg-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-700/20">
            <span className="text-white font-black text-lg">O</span>
          </div>
          <span className="text-red-700 font-black text-2xl tracking-tight">GuestFlow</span>
        </div>

        <Suspense fallback={<div className="animate-pulse text-gray-400 font-black uppercase text-[10px] tracking-widest">Validating Session...</div>}>
          <ResetPasswordForm />
        </Suspense>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 w-full">
          <Shield size={12} className="text-gray-300" />
          <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
            Enterprise Security Core
          </p>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
