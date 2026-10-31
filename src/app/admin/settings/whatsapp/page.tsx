'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Key,
  Save,
  Send,
  Eye,
  EyeOff,
  Loader2,
  Info,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  Zap,
  ToggleLeft,
  ToggleRight,
  Phone,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function AdminWhatsAppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testMobile, setTestMobile] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Settings state
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(true);
  const [provider, setProvider] = useState('META');

  // Meta Cloud API Fields
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [metaWabaId, setMetaWabaId] = useState('');

  // Alternate Providers
  const [apiKey, setApiKey] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [templateBill, setTemplateBill] = useState('');

  useEffect(() => {
    fetch('/api/super-admin/whatsapp')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setWhatsAppEnabled(d.data.WHATSAPP_ENABLED === 'true' || d.data.WHATSAPP_ENABLED === true);
          setProvider(d.data.WHATSAPP_PROVIDER || 'META');
          setMetaAccessToken(d.data.META_ACCESS_TOKEN || '');
          setMetaPhoneId(d.data.META_PHONE_ID || '');
          setMetaWabaId(d.data.META_WABA_ID || '');
          setApiKey(d.data.WHATSAPP_API_KEY || '');
          setInstanceId(d.data.WHATSAPP_INSTANCE_ID || '');
          setTemplateBill(d.data.WHATSAPP_TEMPLATE_BILL || '');
        }
      })
      .catch(() => toast.error('Failed to load Super Admin WhatsApp settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/super-admin/whatsapp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          WHATSAPP_ENABLED: whatsAppEnabled,
          WHATSAPP_PROVIDER: provider,
          META_ACCESS_TOKEN: metaAccessToken,
          META_PHONE_ID: metaPhoneId,
          META_WABA_ID: metaWabaId,
          WHATSAPP_API_KEY: apiKey,
          WHATSAPP_INSTANCE_ID: instanceId,
          WHATSAPP_TEMPLATE_BILL: templateBill,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Master WhatsApp configurations saved successfully!');
      } else {
        toast.error(data.message || 'Failed to save settings.');
      }
    } catch {
      toast.error('Connection error while saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testMobile || testMobile.replace(/[^0-9]/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (provider === 'META' && (!metaAccessToken || !metaPhoneId)) {
      toast.error('Please enter your Meta Phone Number ID and Access Token before testing.');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/super-admin/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile: testMobile,
          metaAccessToken,
          metaPhoneId,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setTestResult({ success: true, message: data.message });
        toast.success(`✅ ${data.message}`);
      } else {
        setTestResult({ success: false, message: data.message || 'Failed to send test message' });
        toast.error(data.message || 'Error sending test message.', { duration: 6000 });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection error' });
      toast.error('Error sending test message.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 px-4 pt-6">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              Super Admin · Central Multi-Hotel Gateway
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            WhatsApp Master Gateway
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-xl leading-relaxed">
            Configure the central Meta WhatsApp API. All hotels across the entire PMS will use this master number for automated bookings, invoices, and receipts.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Master Config'}
        </button>
      </div>

      {/* Status & Master Switch */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap size={16} className={whatsAppEnabled ? 'text-emerald-500' : 'text-slate-400'} />
            Master WhatsApp Dispatcher
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            When active, guests across any registered property will automatically receive confirmation & billing alerts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWhatsAppEnabled((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs tracking-wider transition-all shadow-sm ${
            whatsAppEnabled
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
          }`}
        >
          {whatsAppEnabled ? <ToggleRight size={20} className="text-emerald-600" /> : <ToggleLeft size={20} />}
          {whatsAppEnabled ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
        </button>
      </div>

      {/* Provider Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Layers size={18} className="text-emerald-600" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            WhatsApp Gateway Provider
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => setProvider('META')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              provider === 'META'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">Meta Cloud API</span>
              <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                RECOMMENDED
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Official WhatsApp API directly by Meta. 100% Ban-Proof, lowest per-message cost, zero monthly fee.
            </p>
          </div>

          <div
            onClick={() => setProvider('AUTHKEY')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              provider === 'AUTHKEY'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">AuthKey.io</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Indian gateway provider for instant SMS and template WhatsApp messages.
            </p>
          </div>

          <div
            onClick={() => setProvider('ULTRAMSG')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              provider === 'ULTRAMSG'
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-slate-900 dark:text-white">UltraMsg</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              QR code based session. Fast setup but carries WhatsApp number ban risk.
            </p>
          </div>
        </div>
      </div>

      {/* Meta Official Cloud API Config Form */}
      {provider === 'META' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Meta Developer Credentials</h3>
                <p className="text-xs text-slate-400">Values obtained from developers.facebook.com</p>
              </div>
            </div>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-500 flex items-center gap-1.5"
            >
              Open Meta Portal <ExternalLink size={13} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Phone Number ID */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={14} className="text-emerald-600" />
                Meta Phone Number ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={metaPhoneId}
                onChange={(e) => setMetaPhoneId(e.target.value.trim())}
                placeholder="e.g. 1441720925684212"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400">Found under Step 1 / API Setup in Meta App Dashboard.</p>
            </div>

            {/* WABA ID */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-emerald-600" />
                WhatsApp Business Account ID (WABA ID)
              </label>
              <input
                type="text"
                value={metaWabaId}
                onChange={(e) => setMetaWabaId(e.target.value.trim())}
                placeholder="e.g. 1693484855467128"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400">Found next to Phone Number ID in Meta Console.</p>
            </div>

            {/* Permanent Access Token */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={14} className="text-emerald-600" />
                  Meta Access Token (Permanent / System User Token) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowToken((v) => !v)}
                  className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium"
                >
                  {showToken ? <EyeOff size={13} /> : <Eye size={13} />}
                  {showToken ? 'Hide Token' : 'Show Token'}
                </button>
              </div>
              <textarea
                rows={3}
                value={metaAccessToken}
                onChange={(e) => setMetaAccessToken(e.target.value.trim())}
                placeholder="Paste your EA... Meta Access Token here"
                className={`w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white ${
                  !showToken ? 'filter blur-[3px] hover:blur-none transition-all' : ''
                }`}
              />
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Use the System User token from Meta Business Manager (Never expires). Testing tokens work for 24 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AuthKey.io Config Form */}
      {provider === 'AUTHKEY' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                AuthKey API Key
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste AuthKey API Key"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-sm font-mono outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Template WID
              </label>
              <input
                type="text"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                placeholder="e.g. 10245"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-sm font-mono outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* UltraMsg Config Form */}
      {provider === 'ULTRAMSG' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                UltraMsg Token
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="UltraMsg Token"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-sm font-mono outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Instance ID
              </label>
              <input
                type="text"
                value={instanceId}
                onChange={(e) => setInstanceId(e.target.value)}
                placeholder="e.g. instance12345"
                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-sm font-mono outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Test Sender Tool */}
      <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-3xl p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-emerald-600" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Live WhatsApp Test Dispatcher</h3>
        </div>
        <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
          Test your connection right now. Enter any verified WhatsApp mobile number to dispatch a live test notification.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch gap-3 pt-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">+91</span>
            <input
              type="tel"
              value={testMobile}
              onChange={(e) => setTestMobile(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center justify-center gap-2 px-6 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 whitespace-nowrap"
          >
            {testing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {testing ? 'Sending...' : 'Send Test WhatsApp'}
          </button>
        </div>

        {testResult && (
          <div
            className={`p-4 rounded-2xl text-xs font-medium flex items-start gap-2.5 transition-all ${
              testResult.success
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
            )}
            <div className="flex-1 leading-relaxed break-words">{testResult.message}</div>
          </div>
        )}
      </div>
    </div>
  );
}
