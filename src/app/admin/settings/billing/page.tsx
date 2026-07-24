'use client';

import React, { useState, useEffect } from 'react';
import { Save, ShieldCheck, ArrowLeft, Landmark, QrCode, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminBillingSettings() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    upiId: '',
    upiName: '',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    bankSwift: '',
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/super-admin/billing-settings').then((r) => r.json());
        if (res.success && res.data) {
          setForm({
            upiId: res.data.upiId || '',
            upiName: res.data.upiName || '',
            bankName: res.data.bankName || '',
            bankAccount: res.data.bankAccount || '',
            bankIfsc: res.data.bankIfsc || '',
            bankSwift: res.data.bankSwift || '',
          });
        } else {
          setError(res.error || 'Failed to load billing settings.');
        }
      } catch (err) {
        setError('An unexpected error occurred while loading settings.');
      } finally {
        setFetching(false);
      }
    }

    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/super-admin/billing-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then((r) => r.json());

      if (res.success) {
        setSuccess('Payment settings updated successfully!');
        // Clear success message after 4 seconds
        setTimeout(() => setSuccess(null), 4000);
      } else {
        setError(res.error || 'Failed to update billing settings.');
      }
    } catch (err) {
      setError('An unexpected error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen pb-24 space-y-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background glowing gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-900/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-500/10 dark:bg-rose-900/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href="/admin/settings" 
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft size={12} />
              Back to Settings
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Payment & Billing Configurations
            <span className="text-[10px] font-black tracking-widest uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/50">
              System Wide
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 max-w-2xl">
            Configure target UPI and bank account credentials. These settings directly power the automatic subscription payment checkout screen shown to restaurant signups.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || fetching}
          className="flex items-center gap-2 px-8 py-3.5 rounded-full text-white text-sm font-bold shadow-lg transition-all disabled:opacity-50"
          style={{
            backgroundColor: '#e8a0a0',
            boxShadow: '0 8px 20px rgba(232, 160, 160, 0.3)',
          }}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {fetching ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-12 rounded-[32px] shadow-sm flex flex-col justify-center items-center gap-4">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Loading current gateway settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* UPI Payments Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[32px] shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <QrCode size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">UPI Gateway Details</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Used for direct scan-to-pay via BHIM, GPay, PhonePe, Paytm</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  UPI ID (VPA) *
                </label>
                <input
                  required
                  type="text"
                  value={form.upiId}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  placeholder="e.g. pay@guestflow"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all dark:text-white font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                  Make sure this address is fully active to accept direct merchant transfers.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Merchant Name *
                </label>
                <input
                  required
                  type="text"
                  value={form.upiName}
                  onChange={(e) => setForm({ ...form, upiName: e.target.value })}
                  placeholder="e.g. GuestFlow Ltd"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all dark:text-white font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                  The display name that will show on the customer's phone during checkout.
                </p>
              </div>
            </div>
          </div>

          {/* Bank Transfer Box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-[32px] shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Landmark size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Bank Wire / IMPS Details</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Used for international or standard RTGS/NEFT transfers</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Bank Name *
                </label>
                <input
                  required
                  type="text"
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Account Number *
                </label>
                <input
                  required
                  type="text"
                  value={form.bankAccount}
                  onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                  placeholder="e.g. 501002341928"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all dark:text-white font-mono font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  IFSC Code (India) *
                </label>
                <input
                  required
                  type="text"
                  value={form.bankIfsc}
                  onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })}
                  placeholder="e.g. HDFC0000109"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all dark:text-white font-mono font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  SWIFT / BIC Code (Global) *
                </label>
                <input
                  required
                  type="text"
                  value={form.bankSwift}
                  onChange={(e) => setForm({ ...form, bankSwift: e.target.value })}
                  placeholder="e.g. HDFCINBB"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all dark:text-white font-mono font-medium"
                />
              </div>
            </div>
          </div>

          {/* Quick Info & Guidelines */}
          <div className="bg-indigo-900/5 dark:bg-indigo-950/20 border border-indigo-500/10 p-8 rounded-[32px] lg:col-span-2 flex flex-col sm:flex-row gap-6 items-start">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-wide">
                Security & Real-Time Synchronization Notes
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Changing these payment parameters immediately redirects new and pending subscriptions to use the new accounts. The dynamic QR scan generators will adapt transaction routes instantly. Rest assured, all active subscriptions remain untouched.
              </p>
            </div>
          </div>

        </form>
      )}

    </div>
  );
}
