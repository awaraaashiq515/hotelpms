'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  KeyRound, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';

interface ChangePasswordFormProps {
  email?: string;
}

export const ChangePasswordForm = ({ email }: ChangePasswordFormProps) => {
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');

  // Countdown timer for resending OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Email address is missing or invalid.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp' }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(data.message || 'OTP verification code sent!');
        setStep('verify');
        setResendCooldown(60); // 1 minute cooldown
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp.length < 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and password confirmation do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify-and-change',
          otp,
          newPassword
        }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Your password has been changed successfully!');
        // Reset component state
        setStep('request');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
      } else {
        setError(data.message || 'Invalid verification OTP or failed request.');
      }
    } catch (err) {
      setError('A network error occurred while updating the password.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setStep('request');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  return (
    <Card className="p-8 border-l-4 border-l-indigo-500 overflow-hidden relative">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl flex items-center justify-center">
            <KeyRound size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Change Account Password</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-tight mt-0.5 animate-pulse">
              Security protection using email verification code
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
          <ShieldAlert size={16} className="flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Request OTP */}
      {step === 'request' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            To update your account password, we require email validation. Clicking the button below will send a secure <strong>6-digit verification code</strong> to your registered email address:
          </p>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registered Email</p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{email || 'Retrieving session...'}</p>
            </div>
            <Button 
              onClick={handleSendOtp} 
              disabled={loading || !email}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest px-6 py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send OTP Code
                  <ArrowRight size={14} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Enter OTP & Set Password */}
      {step === 'verify' && (
        <form onSubmit={handleVerifyAndChange} className="space-y-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A verification code was sent to <strong className="text-slate-700 dark:text-slate-300">{email}</strong>. Enter the OTP code below along with your new password to verify and save.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* OTP Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                6-Digit Verification OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                required
                className="w-full text-center text-xl font-bold tracking-[0.4em] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
              />
            </div>

            {/* Empty space for grid alignment */}
            <div className="hidden md:block" />

            {/* New Password Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading || otp.length < 6 || newPassword.length < 6}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 text-xs"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  Update Password
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading || resendCooldown > 0}
              className="text-xs font-black uppercase tracking-wider text-indigo-500 hover:text-indigo-600 px-4 py-2 border border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-500 px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </Card>
  );
};
