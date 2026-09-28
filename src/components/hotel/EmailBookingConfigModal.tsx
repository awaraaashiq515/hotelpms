'use client';

import React, { useState, useEffect } from 'react';
import {
  X, Mail, Key, Eye, EyeOff, CheckCircle2, AlertCircle,
  ExternalLink, Sparkles, ShieldCheck, Copy, Check, RefreshCw
} from 'lucide-react';

interface EmailBookingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyCode: string;
  initialEmail?: string;
  isConfigured?: boolean;
  onSaved: (email: string) => void;
}

export function EmailBookingConfigModal({
  isOpen,
  onClose,
  propertyId,
  propertyCode,
  initialEmail = '',
  isConfigured = false,
  onSaved,
}: EmailBookingConfigModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [activeTab, setActiveTab] = useState<'gmail' | 'guide' | 'webhook'>('gmail');

  useEffect(() => {
    setEmail(initialEmail || '');
    setAppPassword('');
    setError(null);
    setSuccess(null);
  }, [isOpen, initialEmail]);

  if (!isOpen) return null;

  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/webhooks/email-bookings?propertyCode=${propertyCode}`
    : `https://gustflow.com/api/webhooks/email-bookings?propertyCode=${propertyCode}`;

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanEmail = email.trim();
    const cleanPass = appPassword.replace(/\s+/g, '');

    if (!cleanEmail) {
      setError('Please enter a valid Gmail address.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/hotel/email-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_EMAIL_CONFIG',
          propertyId,
          bookingEmail: cleanEmail,
          gmailAppPassword: cleanPass ? cleanPass : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      onSaved(cleanEmail);

      // Auto trigger sync if password was also provided
      if (cleanPass) {
        fetch('/api/hotel/email-bookings/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId }),
        }).catch(() => {});
      }

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save email settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0c0e1a] border border-amber-500/25 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-gradient-to-r from-amber-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Mail size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Email & OTA Bookings Setup</h3>
                {isConfigured ? (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Setup Required
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">Receive bookings from Booking.com, Agoda, MMT & direct emails</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/[0.06] bg-[#080a12] px-5 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('gmail')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'gmail'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Gmail Connection
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={12} />
            How to Get App Password
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'webhook'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Webhook / Forwarding
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-2.5 text-rose-400 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-emerald-400 text-xs font-bold">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {activeTab === 'gmail' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5">
                  Hotel Booking Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. hotelbooking@gmail.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  The Gmail address where OTAs (Booking.com, Agoda, MakeMyTrip) send confirmation emails.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                    Google App Password (16 Letters)
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('guide')}
                    className="text-[10px] text-amber-400 font-bold hover:underline"
                  >
                    Generate App Password →
                  </button>
                </div>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={appPassword}
                    onChange={(e) => setAppPassword(e.target.value)}
                    placeholder={isConfigured ? '•••• •••• •••• •••• (Saved - Leave empty to keep)' : '16-character Google App Password'}
                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-400 font-mono transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Do NOT use your personal Gmail login password. Generate a 16-character <b>App Password</b> from Google Account settings.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-slate-300 leading-relaxed">
                  <strong className="text-amber-300">Safe & Encrypted:</strong> App Passwords can only read emails and do not allow anyone to access your Google account, password, or profile.
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-xs font-bold hover:text-white hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {saving && <RefreshCw size={14} className="animate-spin" />}
                  {saving ? 'Saving & Syncing...' : 'Save & Connect'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px]">
                Follow these 4 simple steps to connect your hotel booking Gmail account:
              </div>

              <div className="space-y-2.5">
                <div className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-black font-black flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <p className="font-bold text-white">Go to Google Security</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Open{' '}
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 underline inline-flex items-center gap-0.5"
                      >
                        myaccount.google.com/security <ExternalLink size={10} />
                      </a>{' '}
                      and ensure <b>2-Step Verification</b> is turned ON.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-black font-black flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <p className="font-bold text-white">Search "App Passwords"</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      In the search bar at the top of your Google Account, search for <b>App Passwords</b> (or visit{' '}
                      <a
                        href="https://myaccount.google.com/apppasswords"
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 underline inline-flex items-center gap-0.5"
                      >
                        myaccount.google.com/apppasswords <ExternalLink size={10} />
                      </a>
                      ).
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-black font-black flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <p className="font-bold text-white">Create App Name</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Enter app name as <b>Hotel PMS</b> and click <b>Create / Generate</b>.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="w-6 h-6 rounded-lg bg-amber-500 text-black font-black flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div>
                    <p className="font-bold text-white">Copy & Paste 16-Letter Code</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Copy the yellow-highlighted 16-character code and paste it into the <b>Gmail Connection</b> tab!
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="button"
                  onClick={() => setActiveTab('gmail')}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-black font-black text-xs hover:bg-amber-400 transition-all"
                >
                  Back to Connection Form →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'webhook' && (
            <div className="space-y-3.5 text-xs text-slate-300">
              <p className="text-[11px] text-slate-400">
                If you prefer not to connect via IMAP, you can setup an automatic email forwarding rule in your Gmail or mail server to post incoming bookings directly to this Webhook URL:
              </p>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                  Inbound Booking Webhook URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 p-2.5 bg-black/40 border border-white/10 rounded-xl text-slate-300 text-xs font-mono select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center gap-1.5 transition-all"
                  >
                    {copiedWebhook ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copiedWebhook ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-1 text-[11px] text-slate-400">
                <p className="font-bold text-slate-200">Supported OTA Channels:</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['Booking.com', 'Agoda', 'MakeMyTrip', 'Goibibo', 'Airbnb', 'Expedia', 'Direct Email'].map((ch) => (
                    <span key={ch} className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-300 text-[10px]">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
