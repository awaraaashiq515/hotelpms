'use client';

import React, { useState, useEffect } from 'react';
import { Save, MessageSquare, Key, Phone, Settings2 } from 'lucide-react';

interface NotificationSettings {
  SMS_PROVIDER: string;
  SMS_API_KEY: string;
  SMS_SENDER_ID: string;
  TEMPLATE_BILL_PAID: string;
  TEMPLATE_KOT: string;
  TEMPLATE_WELCOME: string;
  GEMINI_API_KEY: string;
  WHATSAPP_ENABLED: boolean;
  WHATSAPP_PROVIDER: string;
  WHATSAPP_API_KEY: string;
  WHATSAPP_INSTANCE_ID: string;
  WHATSAPP_TEMPLATE_BILL: string;
}

export default function NotificationSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    SMS_PROVIDER: 'FAST2SMS',
    SMS_API_KEY: '',
    SMS_SENDER_ID: '',
    TEMPLATE_BILL_PAID: '',
    TEMPLATE_KOT: '',
    TEMPLATE_WELCOME: '',
    GEMINI_API_KEY: '',
    WHATSAPP_ENABLED: false,
    WHATSAPP_PROVIDER: 'ULTRAMSG',
    WHATSAPP_API_KEY: '',
    WHATSAPP_INSTANCE_ID: '',
    WHATSAPP_TEMPLATE_BILL: '',
  });

  useEffect(() => {
    fetch('/api/super-admin/notifications')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const fetchedData = json.data;
          setSettings({
            SMS_PROVIDER: fetchedData.SMS_PROVIDER || 'FAST2SMS',
            SMS_API_KEY: fetchedData.SMS_API_KEY || '',
            SMS_SENDER_ID: fetchedData.SMS_SENDER_ID || '',
            TEMPLATE_BILL_PAID: fetchedData.TEMPLATE_BILL_PAID || '',
            TEMPLATE_KOT: fetchedData.TEMPLATE_KOT || '',
            TEMPLATE_WELCOME: fetchedData.TEMPLATE_WELCOME || '',
            GEMINI_API_KEY: fetchedData.GEMINI_API_KEY || '',
            WHATSAPP_ENABLED: fetchedData.WHATSAPP_ENABLED === 'true',
            WHATSAPP_PROVIDER: fetchedData.WHATSAPP_PROVIDER || 'ULTRAMSG',
            WHATSAPP_API_KEY: fetchedData.WHATSAPP_API_KEY || '',
            WHATSAPP_INSTANCE_ID: fetchedData.WHATSAPP_INSTANCE_ID || '',
            WHATSAPP_TEMPLATE_BILL: fetchedData.WHATSAPP_TEMPLATE_BILL || '',
          });
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/super-admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const json = await res.json();
      if (json.success) {
        alert('Notification settings updated successfully!');
      } else {
        alert(json.message || 'Failed to update settings');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Global Service Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-1">Global SMS, WhatsApp and AI API Settings</p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-pos-primary text-white px-8 py-3 rounded-full font-bold text-sm hover:bg-black transition-all flex items-center gap-2"
        >
          <Save size={18} />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Provider Config */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Settings2 size={24} className="text-pos-primary" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">API Provider Configuration</h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">SMS Provider</label>
              <select
                value={settings.SMS_PROVIDER}
                onChange={e => setSettings({ ...settings, SMS_PROVIDER: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all dark:text-white"
              >
                <option value="FAST2SMS">Fast2SMS (Recommended for India)</option>
                <option value="TWILIO">Twilio (Global SMS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex flex-row items-center gap-2">
                <Key size={14} /> API Key / Authorization Token
              </label>
              <input
                type="text"
                value={settings.SMS_API_KEY}
                onChange={e => setSettings({ ...settings, SMS_API_KEY: e.target.value })}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-mono text-sm"
                placeholder="Paste your API key here..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex flex-row items-center gap-2">
                <Phone size={14} /> Sender ID (Approved by DLT if applicable)
              </label>
              <input
                type="text"
                value={settings.SMS_SENDER_ID}
                onChange={e => setSettings({ ...settings, SMS_SENDER_ID: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-mono text-sm uppercase dark:text-white"
                placeholder="e.g. TXTIND or OrderMint"
                maxLength={6}
              />
            </div>
          </div>
        </div>

        {/* Message Templates */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <MessageSquare size={24} className="text-pos-primary" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">SMS Templates</h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl leading-relaxed">
            Use variables like <strong>{'{NAME}'}</strong>, <strong>{'{AMOUNT}'}</strong>, <strong>{'{HOTEL}'}</strong>, <strong>{'{ORDER_NO}'}</strong> inside your templates. They will be auto-replaced when sending.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                Kitchen Order (KOT) Template
              </label>
              <textarea
                value={settings.TEMPLATE_KOT}
                onChange={e => setSettings({ ...settings, TEMPLATE_KOT: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all h-24 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                placeholder="ORDER {ORDER_NO} | TABLE {TABLE_NO} | ITEMS: {ITEMS}"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                POS Bill generated / Paid Template
              </label>
              <textarea
                value={settings.TEMPLATE_BILL_PAID}
                onChange={e => setSettings({ ...settings, TEMPLATE_BILL_PAID: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all h-24 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                placeholder="Dear {NAME}, your bill for Rs.{AMOUNT} is paid. Order Ref: {ORDER_NO}. Thank you for visiting {HOTEL}."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
                Welcome / Check-In Template
              </label>
              <textarea
                value={settings.TEMPLATE_WELCOME}
                onChange={e => setSettings({ ...settings, TEMPLATE_WELCOME: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all h-24 text-sm text-slate-700 dark:text-slate-300 leading-relaxed"
                placeholder="Welcome to {HOTEL}, {NAME}! We are pleased to host you. Have a great stay!"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Business API Config */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl flex items-center justify-center">
                <MessageSquare size={20} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">WhatsApp Business API Settings</h2>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Automated Receipt Delivery</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setSettings({ ...settings, WHATSAPP_ENABLED: !settings.WHATSAPP_ENABLED })}
              className={`relative w-14 h-7 rounded-full transition-all duration-300 ${settings.WHATSAPP_ENABLED ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${settings.WHATSAPP_ENABLED ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all ${settings.WHATSAPP_ENABLED ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 tracking-widest uppercase">WhatsApp Provider</label>
                <select
                  value={settings.WHATSAPP_PROVIDER}
                  onChange={e => setSettings({ ...settings, WHATSAPP_PROVIDER: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                >
                  <option value="ULTRAMSG">UltraMsg (Recommended)</option>
                  <option value="WATI">Wati.io</option>
                  <option value="CUSTOM">Custom API</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex flex-row items-center gap-2 tracking-widest uppercase">
                  <Key size={14} /> WhatsApp API Key
                </label>
                <input
                  type="password"
                  value={settings.WHATSAPP_API_KEY}
                  onChange={e => setSettings({ ...settings, WHATSAPP_API_KEY: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm dark:text-white"
                  placeholder="Paste Token/Key..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex flex-row items-center gap-2 tracking-widest uppercase">
                  <Settings2 size={14} /> Instance ID / Channel ID
                </label>
                <input
                  type="text"
                  value={settings.WHATSAPP_INSTANCE_ID}
                  onChange={e => setSettings({ ...settings, WHATSAPP_INSTANCE_ID: e.target.value })}
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm dark:text-white"
                  placeholder="e.g. instance12345"
                />
              </div>
            </div>

            <div className="md:col-span-1 lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 tracking-widest uppercase">
                WhatsApp Receipt Template
              </label>
              <textarea
                value={settings.WHATSAPP_TEMPLATE_BILL}
                onChange={e => setSettings({ ...settings, WHATSAPP_TEMPLATE_BILL: e.target.value })}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-[190px] text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium"
                placeholder={`*Receipt from {HOTEL}*
Order No: {ORDER_NO}
Table: {TABLE_NO}
---
{ITEMS}
---
Subtotal: ₹{SUBTOTAL}
Tax: ₹{TAX}
*Total: ₹{AMOUNT}*
---
Thank you! Visit again.`}
              />
              <p className="mt-3 text-[10px] text-slate-400 font-bold tracking-tight bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-lg border border-emerald-100/50">
                Variables: {'{NAME}, {AMOUNT}, {HOTEL}, {ORDER_NO}, {TABLE_NO}, {SUBTOTAL}, {TAX}, {ITEMS}'}
              </p>
            </div>
          </div>
        </div>

        {/* AI Configurations */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <svg className="w-6 h-6 text-pos-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">AI & Machine Learning Configurations</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Configure your Mint AI credentials here. This enables the <strong>AI Menu Scan</strong> feature in the Products dashboard.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-2xl">
                <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
                  <strong>Tip:</strong> You can get a free API key from the <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-bold">Google AI Studio</a>.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex flex-row items-center gap-2">
                <Key size={14} /> Mint AI API Key
              </label>
              <input
                type="password"
                value={settings.GEMINI_API_KEY}
                onChange={e => setSettings({ ...settings, GEMINI_API_KEY: e.target.value })}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-pos-primary outline-none transition-all font-mono text-sm dark:text-white"
                placeholder="Paste your Mint AI API key here..."
              />
              <p className="mt-2 text-[10px] text-slate-400 italic">This key is used globally for all property menu scanning tasks.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
