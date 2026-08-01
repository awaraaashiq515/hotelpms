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
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed">{hint}</p>}
    </div>
  );
}

export default function AdminWhatsAppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testMobile, setTestMobile] = useState('');

  // Settings state
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(false);
  const [provider, setProvider] = useState('AUTHKEY');
  const [apiKey, setApiKey] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaPhoneId, setMetaPhoneId] = useState('');

  useEffect(() => {
    fetch('/api/hotel/whatsapp-settings')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setWhatsAppEnabled(d.data.whatsAppEnabled ?? false);
          setProvider(d.data.whatsAppProvider || 'AUTHKEY');
          setApiKey(d.data.whatsAppApiKey || '');
          setTemplateId(d.data.whatsAppTemplate || '');
          setInstanceId(d.data.whatsAppInstanceId || '');
          setMetaAccessToken(d.data.metaAccessToken || '');
          setMetaPhoneId(d.data.metaPhoneId || '');
        }
      })
      .catch(() => toast.error('Failed to load WhatsApp settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/hotel/whatsapp-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsAppEnabled,
          whatsAppProvider: provider,
          whatsAppApiKey: apiKey,
          whatsAppTemplate: templateId,
          whatsAppInstanceId: instanceId,
          metaAccessToken,
          metaPhoneId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('WhatsApp settings saved successfully!');
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
    if (!testMobile || testMobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!apiKey) {
      toast.error('Please save your API Key first.');
      return;
    }
    setTesting(true);
    try {
      const cleanMobile = testMobile.replace(/[^0-9]/g, '').slice(-10);
      const params = new URLSearchParams({
        authkey: apiKey,
        mobile: cleanMobile,
        country_code: '91',
        wid: templateId,
        '1': 'John',
        '2': '9876543210',
      });
      const res = await fetch(`https://api.authkey.io/request?${params.toString()}`);
      const data = await res.json();

      const isSuccess = data.status === 'success' || data.code === 200 || data.Message === 'Submitted Successfully' || !!data.LogID;
      
      if (isSuccess) {
        toast.success(`✅ Test message sent successfully to +91${cleanMobile}!`);
      } else {
        toast.error(`Error: ${data.message || data.errorMessage || JSON.stringify(data)}`);
      }
    } catch {
      toast.error('Error sending test message.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle size={16} className="text-green-500" />
            <span className="text-xs font-black text-green-500 uppercase tracking-widest">
              Super Admin · WhatsApp Integration
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">WhatsApp Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Automatically send WhatsApp confirmation messages to guests upon new booking creation.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 h-10 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Enable Toggle */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Enable WhatsApp Notifications</p>
          <p className="text-xs text-slate-500 mt-0.5">
            When enabled, guests will receive automatic WhatsApp messages for new bookings.
          </p>
        </div>
        <button
          onClick={() => setWhatsAppEnabled(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
            whatsAppEnabled
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:border-slate-700'
          }`}
        >
          {whatsAppEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          {whatsAppEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Authkey.io Configuration */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔑</span>
            <p className="text-sm font-black text-slate-800 dark:text-white">Authkey.io API Configuration</p>
          </div>
          <a
            href="https://console.authkey.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-bold text-green-600 hover:underline"
          >
            Open Console <ExternalLink size={11} />
          </a>
        </div>

        {/* Instructions Box */}
        <div className="rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-500/20 p-4 space-y-1">
          <div className="flex gap-2">
            <Info size={14} className="text-green-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5">
              <p>1. Go to <strong>console.authkey.io</strong> → API Keys → Copy your API Key</p>
              <p>2. Create a WhatsApp Template and submit it for approval</p>
              <p>3. Copy the <strong className="text-green-600">Template ID (wid)</strong> from Authkey console and paste it below</p>
              <p>4. Fill in both fields → Click <strong>Save Settings</strong> → Done! ✅</p>
            </div>
          </div>
        </div>

        {/* API Key */}
        <Field label="Authkey.io API Key" hint="Copy from console.authkey.io → My Account → Profile / API Key">
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Paste your Authkey.io API Key here..."
              className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        {/* Template ID (wid) */}
        <Field
          label="Template ID (wid)"
          hint="Found in Authkey Console → WhatsApp → WhatsApp Template → Numeric ID (e.g., 12345)"
        >
          <input
            type="text"
            value={templateId}
            onChange={e => setTemplateId(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 12345"
            className="w-full border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30"
          />
        </Field>

        {/* Status Indicators */}
        <div className="flex gap-3 flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${apiKey ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            {apiKey ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            API Key {apiKey ? 'Configured ✓' : 'Not Set'}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${templateId ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            {templateId ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            Template ID {templateId ? `= ${templateId} ✓` : 'Not Set'}
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${whatsAppEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
            {whatsAppEnabled ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            Status {whatsAppEnabled ? 'Active ✓' : 'Disabled'}
          </div>
        </div>
      </div>

      {/* Message Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle size={14} className="text-green-500" />
          <p className="text-sm font-black text-slate-800 dark:text-white">Message Preview</p>
        </div>
        <div className="bg-[#e5ddd5] rounded-xl p-4 font-sans text-[11px] leading-relaxed text-slate-800 space-y-1">
          <div className="bg-white rounded-lg p-3 shadow-sm max-w-xs space-y-1">
            <p>Hi <strong>John</strong>,</p>
            <p>Your hotel booking has been confirmed successfully!</p>
            <p>Please use your mobile number <strong>John</strong> as username and <strong>9876543210</strong> as password to log in.</p>
            <p>Thank you!</p>
            <p className="text-slate-400 text-[10px] text-right pt-1">✓✓ 11:30 AM</p>
          </div>
        </div>
      </div>

      {/* Test Message */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-500/20 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Send size={14} className="text-amber-500" />
          <p className="text-sm font-black text-slate-800 dark:text-white">Send Test Message</p>
        </div>
        <p className="text-xs text-slate-500">
          Save your settings first, then enter a 10-digit mobile number to send a live test message.
        </p>
        <div className="flex gap-3">
          <input
            type="tel"
            value={testMobile}
            onChange={e => setTestMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Enter 10-digit mobile number"
            className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
          <button
            onClick={handleTest}
            disabled={testing || !apiKey || !templateId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-bold transition-all disabled:opacity-40"
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {testing ? 'Sending...' : 'Send Test'}
          </button>
        </div>
        {(!apiKey || !templateId) && (
          <p className="text-xs text-amber-600 flex items-center gap-1">
            <AlertCircle size={11} />
            Please save your API Key and Template ID before testing.
          </p>
        )}
      </div>

      {/* Security Note */}
      <div className="flex gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
        <Shield size={14} className="text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          Your API Key is stored securely in the database and is never exposed to the client browser. All WhatsApp outbound requests are executed server-side.
        </p>
      </div>
    </div>
  );
}
