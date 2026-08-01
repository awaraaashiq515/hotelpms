'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Send,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Info,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

const PROVIDERS = [
  {
    id: 'AUTHKEY',
    label: 'Authkey.io',
    desc: 'Official WhatsApp Business API via authkey.io. Supports approved templates.',
    color: 'text-green-400',
    border: 'border-green-500/30',
    bg: 'bg-green-900/10',
    icon: '🔑',
    link: 'https://console.authkey.io',
  },
  {
    id: 'META',
    label: 'Meta (Facebook) API',
    desc: 'Direct Meta Graph API integration using your own WhatsApp Business Account.',
    color: 'text-blue-400',
    border: 'border-blue-500/30',
    bg: 'bg-blue-900/10',
    icon: '📘',
    link: 'https://developers.facebook.com/apps',
  },
  {
    id: 'ULTRAMSG',
    label: 'UltraMsg',
    desc: 'Third-party gateway. Easy setup via instance ID and token.',
    color: 'text-violet-400',
    border: 'border-violet-500/30',
    bg: 'bg-violet-900/10',
    icon: '⚡',
    link: 'https://ultramsg.com',
  },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-600 leading-relaxed">{hint}</p>}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${value ? 'bg-green-500' : 'bg-slate-700'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${value ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

export default function WhatsAppSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [testMobile, setTestMobile] = useState('');

  // Settings state
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(false);
  const [provider, setProvider] = useState('AUTHKEY');
  const [apiKey, setApiKey] = useState('');
  const [instanceId, setInstanceId] = useState('');
  const [templateName, setTemplateName] = useState('guest_booking_confirmation');
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
          setInstanceId(d.data.whatsAppInstanceId || '');
          setTemplateName(d.data.whatsAppTemplate || 'guest_booking_confirmation');
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
          whatsAppInstanceId: instanceId,
          whatsAppTemplate: templateName,
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
      toast.error('Connection error while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testMobile || testMobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    setTesting(true);
    try {
      // Build the test message
      const message = [
        `🏨 *GuestFlow AI* — Test Message ✅`,
        ``,
        `Dear Test Guest,`,
        ``,
        `Your reservation has been successfully confirmed. Here are your stay details:`,
        ``,
        `📋 *Booking No:* RES-TEST-001`,
        `📅 *Check-In:* 22 Jul 2026`,
        `📅 *Check-Out:* 25 Jul 2026`,
        `🌙 *Duration:* 3 Nights`,
        `🛏️ *Room No:* 201`,
        `🏢 *Floor:* 2nd Floor`,
        `💰 *Room Rate:* ₹2,500/night`,
        `💳 *Total Bill:* ₹7,500`,
        ``,
        `🌐 *Guest Portal Access*`,
        `Link: https://yourhotel.guestflow.ai/guest-portal`,
        `👤 Username: Test Guest`,
        `🔑 Password: 9876543210`,
        ``,
        `You can view your booking, request services, and manage your stay anytime through the Guest Portal.`,
        ``,
        `We look forward to welcoming you!`,
        ``,
        `— Hotel Team 🙏`,
      ].join('\n');

      let success = false;
      if (provider === 'AUTHKEY' && apiKey) {
        const cleanMobile = testMobile.replace(/[^0-9]/g, '').slice(-10);
        const params = new URLSearchParams({
          authkey: apiKey,
          mobile: cleanMobile,
          country_code: '91',
          wid: templateName,   // numeric wid as per authkey docs
          '1': 'Test Guest',
          '2': 'GuestFlow AI Hotel',
          '3': 'https://yourhotel.guestflow.ai/guest-portal',
          '4': 'Test Guest',
          '5': '9876543210',
          '6': '201',
          '7': '2nd Floor',
          '8': '2500/night',
        });
        const res = await fetch(`https://api.authkey.io/request?${params.toString()}`);
        const data = await res.json();
        success = data.status === 'success' || data.code === 200;
        if (!success) toast.error(`Authkey response: ${data.message || JSON.stringify(data)}`);
      } else if (provider === 'ULTRAMSG' && apiKey && instanceId) {
        const res = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: apiKey,
            to: testMobile.startsWith('+') ? testMobile : `+91${testMobile}`,
            body: message,
          }),
        });
        const data = await res.json();
        success = !!data.sent || data.success;
      } else {
        toast.error('Please configure and save your settings before testing.');
        return;
      }

      if (success) {
        toast.success(`✅ Test message sent to +91${testMobile}!`);
      } else {
        toast.error('Test message failed. Check your API key and template name.');
      }
    } catch (err) {
      toast.error('Error sending test message.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin text-green-400" />
          <span className="text-sm font-semibold">Loading WhatsApp Settings...</span>
        </div>
      </div>
    );
  }

  const selectedProvider = PROVIDERS.find(p => p.id === provider);

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageCircle size={14} className="text-green-400" />
            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">
              Super Admin · Integrations
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">WhatsApp Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure WhatsApp notifications for new bookings. Guests will receive booking details automatically.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 h-10 px-5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Enable / Disable Toggle */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${whatsAppEnabled ? 'bg-green-900/30' : 'bg-slate-800'}`}>
            💬
          </div>
          <div>
            <p className="text-sm font-black text-white">WhatsApp Notifications</p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              When enabled, guests receive an automatic WhatsApp message on every new booking.
            </p>
          </div>
        </div>
        <Toggle value={whatsAppEnabled} onChange={setWhatsAppEnabled} />
      </div>

      {/* Provider Selection */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-yellow-400" />
          <p className="text-xs font-black text-white uppercase tracking-widest">Select Provider</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={`rounded-xl border p-4 text-left transition-all ${
                provider === p.id
                  ? `${p.border} ${p.bg} ring-1 ring-inset ${p.border}`
                  : 'border-slate-800/60 hover:border-slate-700/60 bg-slate-900/40'
              }`}
            >
              <div className="text-2xl mb-2">{p.icon}</div>
              <p className={`text-xs font-black ${provider === p.id ? p.color : 'text-slate-300'}`}>{p.label}</p>
              <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">{p.desc}</p>
              {provider === p.id && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className={`inline-flex items-center gap-1 mt-2 text-[9px] font-bold ${p.color} hover:underline`}
                >
                  Open Console <ExternalLink size={9} />
                </a>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Authkey.io Settings */}
      {provider === 'AUTHKEY' && (
        <div className="rounded-2xl bg-slate-900/60 border border-green-500/20 p-5 space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-base">🔑</span>
            <p className="text-xs font-black text-green-400 uppercase tracking-widest">Authkey.io Configuration</p>
            <a href="https://console.authkey.io" target="_blank" rel="noopener noreferrer"
              className="ml-auto text-[9px] text-green-400 hover:underline flex items-center gap-1">
              Console <ExternalLink size={9} />
            </a>
          </div>

          {/* Info Box */}
          <div className="rounded-xl bg-green-900/10 border border-green-500/20 p-4 flex gap-3">
            <Info size={14} className="text-green-400 shrink-0 mt-0.5" />
            <div className="text-[10px] text-slate-400 leading-relaxed space-y-1">
              <p>1. Go to <strong className="text-green-400">console.authkey.io</strong> → API Keys → Copy your API Key</p>
              <p>2. Create/use an approved WhatsApp template named <strong className="text-green-400">guest_booking_confirmation</strong></p>
          <p>3. Template variables: <strong className="text-slate-300">{'{{'+'1}}'}= Guest Name, {'{{'+'2}}'}= Hotel, {'{{'+'3}}'}= Portal Link, {'{{'+'4}}'}= Username, {'{{'+'5}}'}= Password, {'{{'+'6}}'}= Room No, {'{{'+'7}}'}= Floor, {'{{'+'8}}'}= Price</strong></p>
              <p>4. After approval, copy the <strong className="text-green-400">Template ID (wid)</strong> number and paste it below</p>
            </div>
          </div>

          <Field label="API Key" hint="Your authkey.io API key. Keep this secret!">
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Enter your authkey.io API key..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-green-500/50 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
              >
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>

          <Field label="Template ID (wid)" hint="Numeric ID of your approved WhatsApp template from authkey.io → WhatsApp → WhatsApp Template list.">
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 12345  (numeric ID from authkey.io)"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-green-500/50"
            />
          </Field>
        </div>
      )}

      {/* Meta Settings */}
      {provider === 'META' && (
        <div className="rounded-2xl bg-slate-900/60 border border-blue-500/20 p-5 space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-base">📘</span>
            <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Meta Graph API Configuration</p>
          </div>
          <Field label="Access Token" hint="Permanent access token from your Meta Business App.">
            <div className="relative">
              <input
                type={showMeta ? 'text' : 'password'}
                value={metaAccessToken}
                onChange={e => setMetaAccessToken(e.target.value)}
                placeholder="EAAxxxxxxxxxxxxxxx..."
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500/50 pr-12"
              />
              <button type="button" onClick={() => setShowMeta(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                {showMeta ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Phone Number ID" hint="Your WhatsApp Business phone number ID from the Meta Dashboard.">
            <input
              type="text"
              value={metaPhoneId}
              onChange={e => setMetaPhoneId(e.target.value)}
              placeholder="123456789012345"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-blue-500/50"
            />
          </Field>
        </div>
      )}

      {/* UltraMsg Settings */}
      {provider === 'ULTRAMSG' && (
        <div className="rounded-2xl bg-slate-900/60 border border-violet-500/20 p-5 space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-base">⚡</span>
            <p className="text-xs font-black text-violet-400 uppercase tracking-widest">UltraMsg Configuration</p>
          </div>
          <Field label="Instance ID" hint="Your UltraMsg instance ID from the dashboard.">
            <input
              type="text"
              value={instanceId}
              onChange={e => setInstanceId(e.target.value)}
              placeholder="instance12345"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500/50"
            />
          </Field>
          <Field label="Token (API Key)" hint="Your UltraMsg token from the instance settings.">
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="xxxxxxxxxxxxxxxxxxx"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-violet-500/50 pr-12"
              />
              <button type="button" onClick={() => setShowApiKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
        </div>
      )}

      {/* Message Preview */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={13} className="text-green-400" />
          <p className="text-xs font-black text-white uppercase tracking-widest">Message Preview</p>
          <span className="ml-auto text-[9px] font-bold text-slate-600 uppercase bg-slate-800 px-2 py-0.5 rounded-full">English</span>
        </div>

        {/* Phone mockup */}
        <div className="bg-[#0a1929] rounded-2xl border border-slate-800 p-4 font-mono text-[11px] leading-relaxed text-slate-300 space-y-1 max-h-80 overflow-y-auto no-scrollbar">
          <p className="text-green-400 font-bold">🏨 <em>Hotel Name</em> — Booking Confirmed! ✅</p>
          <p className="text-slate-500">‌</p>
          <p>Dear <strong>Guest Name</strong>,</p>
          <p className="text-slate-500">‌</p>
          <p>Your reservation has been successfully confirmed. Here are your stay details:</p>
          <p className="text-slate-500">‌</p>
          <p>📋 <strong>Booking No:</strong> RES-XXXXXX</p>
          <p>📅 <strong>Check-In:</strong> 22 Jul 2026</p>
          <p>📅 <strong>Check-Out:</strong> 25 Jul 2026</p>
          <p>🌙 <strong>Duration:</strong> 3 Nights</p>
          <p className="text-yellow-300">🛏️ <strong>Room No:</strong> 201</p>
          <p className="text-yellow-300">🏢 <strong>Floor:</strong> 2nd Floor</p>
          <p className="text-yellow-300">💰 <strong>Room Rate:</strong> ₹2,500/night</p>
          <p>💳 <strong>Total Bill:</strong> ₹7,500</p>
          <p className="text-slate-500">‌</p>
          <p className="text-sky-400">🌐 <strong>Guest Portal Access</strong></p>
          <p className="text-sky-400">Link: https://yourhotel.com/guest-portal</p>
          <p>👤 Username: Guest Name</p>
          <p>🔑 Password: 9876543210</p>
          <p className="text-slate-500">‌</p>
          <p className="text-slate-400 text-[10px]">You can view your booking, request services, and manage your stay anytime through the Guest Portal.</p>
          <p className="text-slate-500">‌</p>
          <p>We look forward to welcoming you!</p>
          <p className="text-slate-500">‌</p>
          <p className="text-slate-400">— Hotel Name Team 🙏</p>
        </div>
      </div>

      {/* Test Section */}
      <div className="rounded-2xl bg-slate-900/60 border border-amber-500/20 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Send size={13} className="text-amber-400" />
          <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Send Test Message</p>
        </div>
        <p className="text-[10px] text-slate-500">
          Save your settings first, then send a test WhatsApp message to verify everything is working correctly.
        </p>
        <div className="flex gap-3">
          <input
            type="tel"
            value={testMobile}
            onChange={e => setTestMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Enter 10-digit mobile number"
            className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-amber-500/50"
          />
          <button
            onClick={handleTest}
            disabled={testing || !apiKey}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40"
          >
            {testing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {testing ? 'Sending...' : 'Test'}
          </button>
        </div>
        {!apiKey && (
          <div className="flex items-center gap-2 text-[10px] text-amber-400">
            <AlertCircle size={11} />
            Enter and save your API key before testing.
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="rounded-xl bg-slate-900/40 border border-slate-800/40 p-4 flex gap-3">
        <Shield size={14} className="text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-600 leading-relaxed">
          Your API keys are stored securely in the database and are never exposed to the browser. All WhatsApp messages are sent server-side only.
        </p>
      </div>
    </div>
  );
}
