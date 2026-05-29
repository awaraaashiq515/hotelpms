'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MessageSquare, ShieldCheck, Key, Copy, Check, Info, Settings, Eye, EyeOff } from 'lucide-react';

export const WhatsAppConfigForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [whatsAppEnabled, setWhatsAppEnabled] = useState(false);
  const [whatsAppProvider, setWhatsAppProvider] = useState<'META' | 'TWILIO' | 'ULTRAMSG'>('META');
  const [whatsAppTemplate, setWhatsAppTemplate] = useState('');
  const [whatsAppWelcomeMessage, setWhatsAppWelcomeMessage] = useState('');

  // Meta States (Visible to Super Admin only)
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaPhoneId, setMetaPhoneId] = useState('');
  const [metaVerifyToken, setMetaVerifyToken] = useState('ordermint-default-token');

  // Twilio States (Visible to Super Admin only)
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioFromNumber, setTwilioFromNumber] = useState('');

  // Tenant / Custom Gateway States (Visible to normal Restaurant Admins)
  const [whatsAppApiKey, setWhatsAppApiKey] = useState('');
  const [whatsAppInstanceId, setWhatsAppInstanceId] = useState('');

  const [webhookUrl, setWebhookUrl] = useState('');

  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhooks/whatsapp`);
    }

    // Fetch user session first to check role
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setSession(data.user);
        }
        
        // Fetch property configs
        return fetch('/api/setup/properties/current');
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const prop = data.data;
          setProperty(prop);
          setWhatsAppEnabled(prop.whatsAppEnabled ?? false);
          setWhatsAppProvider(prop.whatsAppProvider || 'META');
          setWhatsAppTemplate(prop.whatsAppTemplate || '');
          // Using state field or a default fallback welcome message
          setWhatsAppWelcomeMessage(prop.whatsAppWelcomeMessage || '*Welcome to OrderMint!* 🍽️\nYou can place your order directly through WhatsApp.');
          
          setMetaAccessToken(prop.metaAccessToken || '');
          setMetaPhoneId(prop.metaPhoneId || '');
          setMetaVerifyToken(prop.metaVerifyToken || 'ordermint-default-token');
          
          setTwilioAccountSid(prop.twilioAccountSid || '');
          setTwilioAuthToken(prop.twilioAuthToken || '');
          setTwilioFromNumber(prop.twilioFromNumber || '');
          
          setWhatsAppApiKey(prop.whatsAppApiKey || '');
          setWhatsAppInstanceId(prop.whatsAppInstanceId || '');
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load settings', err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    
    // Build payload. Tenants can only update custom instance credentials, template, welcome, and toggle.
    // Super Admins can update all global API credentials.
    const payload: any = {
      whatsAppEnabled,
      whatsAppProvider: isSuperAdmin ? whatsAppProvider : (whatsAppProvider === 'ULTRAMSG' ? 'ULTRAMSG' : 'META'), // Standard tenant defaults to META (shared bot) or ULTRAMSG (their own)
      whatsAppTemplate,
      whatsAppWelcomeMessage,
      whatsAppApiKey,
      whatsAppInstanceId,
    };

    if (isSuperAdmin) {
      payload.metaAccessToken = metaAccessToken;
      payload.metaPhoneId = metaPhoneId;
      payload.metaVerifyToken = metaVerifyToken;
      payload.twilioAccountSid = twilioAccountSid;
      payload.twilioAuthToken = twilioAuthToken;
      payload.twilioFromNumber = twilioFromNumber;
    }

    try {
      const res = await fetch(`/api/setup/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('WhatsApp settings updated successfully!');
      } else {
        throw new Error('Failed to update');
      }
    } catch (error) {
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest">Loading WhatsApp configurations...</div>;

  return (
    <Card className="p-5 lg:p-8 border-t-4 border-t-emerald-500 shadow-2xl shadow-gray-100">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-slate-800">
        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center">
          <MessageSquare size={24} />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">
            {isSuperAdmin ? 'Global WhatsApp Provider Settings' : 'WhatsApp Bot Settings'}
          </h2>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">
            {isSuperAdmin 
              ? 'Configure platform-wide developer gateways (Meta, Twilio).' 
              : 'Connect your WhatsApp number, welcome greetings, and bill receipt templates.'}
          </p>
        </div>
      </div>
 
      {/* Premium WhatsApp Features Showcase */}
      {!isSuperAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 p-6 bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-100/50 dark:border-slate-800">
          <div className="col-span-full mb-2">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-1 rounded-full">Active AI Bot Suite</span>
          </div>
          
          <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="text-sm">🗣️</div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white mt-2">Hinglish AI waitering</p>
              <p className="text-[8px] text-gray-400 uppercase mt-0.5 leading-normal">Smart NLP parses English, Hindi, and Hinglish orders dynamically.</p>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="text-sm">📖</div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white mt-2">Menu browsing</p>
              <p className="text-[8px] text-gray-400 uppercase mt-0.5 leading-normal">Customers can type "menu" to view categorized dishes & pricing.</p>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="text-sm">💡</div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white mt-2">AI upselling</p>
              <p className="text-[8px] text-gray-400 uppercase mt-0.5 leading-normal">Bot recommends soft drinks or food pairings dynamically.</p>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="text-sm">🎁</div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white mt-2">Loyalty points</p>
              <p className="text-[8px] text-gray-400 uppercase mt-0.5 leading-normal">Integrated CRM credits +10 points on checkout success.</p>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="text-sm">📦</div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white mt-2">Live order tracking</p>
              <p className="text-[8px] text-gray-400 uppercase mt-0.5 leading-normal">Customers check cooking/ready status directly in chat.</p>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="text-sm">📞</div>
            <div>
              <p className="text-[10px] font-black uppercase text-gray-900 dark:text-white mt-2">Support Hand-off</p>
              <p className="text-[8px] text-gray-400 uppercase mt-0.5 leading-normal">Type "support" to pause bot and alert human staff members.</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Toggle WhatsApp chatbot */}
        <div className="flex items-center justify-between p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100/30">
          <div>
             <p className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Enable WhatsApp Chatbot</p>
             <p className="text-[9px] text-emerald-600/70 dark:text-emerald-500/50 font-bold uppercase mt-0.5">Let guests order dishes dynamically via WhatsApp</p>
          </div>
          <button 
            onClick={() => setWhatsAppEnabled(!whatsAppEnabled)}
            className={`w-14 h-8 rounded-full transition-all relative ${whatsAppEnabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${whatsAppEnabled ? 'left-7' : 'left-1 shadow-sm'}`} />
          </button>
        </div>

        {whatsAppEnabled && (
          <>
            {/* Connection Mode Selection */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Connection Mode</label>
              <select
                value={isSuperAdmin ? whatsAppProvider : (whatsAppInstanceId ? 'ULTRAMSG' : 'META')}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isSuperAdmin) {
                    setWhatsAppProvider(val as any);
                  } else {
                    setWhatsAppProvider(val === 'ULTRAMSG' ? 'ULTRAMSG' : 'META');
                  }
                }}
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white dark:bg-slate-800 font-black text-sm dark:text-white transition-all appearance-none"
              >
                {isSuperAdmin ? (
                  <>
                    <option value="META">Meta Cloud API (Global Platform Gateway)</option>
                    <option value="TWILIO">Twilio API (Global Platform Gateway)</option>
                    <option value="ULTRAMSG">UltraMsg Instance (Direct Sandbox Link)</option>
                  </>
                ) : (
                  <>
                    <option value="META">OrderMint Shared WhatsApp Number (Zero Setup)</option>
                    <option value="ULTRAMSG">Connect My Own WhatsApp Number (via UltraMsg)</option>
                  </>
                )}
              </select>
            </div>

            {/* Standard Tenant Settings: Custom Instance Keys */}
            {(!isSuperAdmin && whatsAppProvider === 'ULTRAMSG') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50/50 dark:bg-slate-800/10 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="sm:col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-2 mb-2">
                  <Key size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Connect Your Custom WhatsApp API Keys</span>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">UltraMsg Instance ID</label>
                  <input
                    type="text"
                    value={whatsAppInstanceId}
                    onChange={(e) => setWhatsAppInstanceId(e.target.value)}
                    placeholder="e.g. instance8942"
                    className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 bg-white dark:bg-slate-800 font-bold text-sm dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">WhatsApp API Key / Token</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={whatsAppApiKey}
                      onChange={(e) => setWhatsAppApiKey(e.target.value)}
                      placeholder="e.g. your-private-token"
                      className="w-full px-5 py-4 pr-12 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 bg-white dark:bg-slate-800 font-mono text-xs dark:text-white transition-all"
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
              </div>
            )}

            {/* Platform Integration Settings (Super Admin Only) */}
            {isSuperAdmin && (
              <>
                {/* Meta Cloud API Form */}
                {whatsAppProvider === 'META' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-indigo-50/20 dark:bg-slate-800/10 rounded-3xl border border-indigo-100/40 dark:border-slate-800">
                    <div className="sm:col-span-2 flex items-center gap-2 text-indigo-700 dark:text-indigo-400 border-b border-indigo-100/30 pb-2 mb-2">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Meta Cloud Platform Gateway (Global Developer Keys)</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Meta Phone Number ID</label>
                      <input
                        type="text"
                        value={metaPhoneId}
                        onChange={(e) => setMetaPhoneId(e.target.value)}
                        placeholder="e.g. 10484729103984"
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 bg-white dark:bg-slate-800 font-bold text-sm dark:text-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Webhook Verify Token</label>
                      <input
                        type="text"
                        value={metaVerifyToken}
                        onChange={(e) => setMetaVerifyToken(e.target.value)}
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 bg-white dark:bg-slate-800 font-bold text-sm dark:text-white transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Permanent Graph Access Token</label>
                      <input
                        type="password"
                        value={metaAccessToken}
                        onChange={(e) => setMetaAccessToken(e.target.value)}
                        placeholder="EAAW..."
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 bg-white dark:bg-slate-800 font-mono text-xs dark:text-white transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Twilio Platform Form */}
                {whatsAppProvider === 'TWILIO' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-indigo-50/20 dark:bg-slate-800/10 rounded-3xl border border-indigo-100/40 dark:border-slate-800">
                    <div className="sm:col-span-2 flex items-center gap-2 text-indigo-700 dark:text-indigo-400 border-b border-indigo-100/30 pb-2 mb-2">
                      <ShieldCheck size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Twilio Platform Gateway (Global Developer Keys)</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Twilio Account SID</label>
                      <input
                        type="text"
                        value={twilioAccountSid}
                        onChange={(e) => setTwilioAccountSid(e.target.value)}
                        placeholder="AC..."
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 bg-white dark:bg-slate-800 font-bold text-sm dark:text-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Twilio Sender Number (WhatsApp format)</label>
                      <input
                        type="text"
                        value={twilioFromNumber}
                        onChange={(e) => setTwilioFromNumber(e.target.value)}
                        placeholder="e.g. 14155238886"
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 bg-white dark:bg-slate-800 font-bold text-sm dark:text-white transition-all"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Twilio Auth Token</label>
                      <input
                        type="password"
                        value={twilioAuthToken}
                        onChange={(e) => setTwilioAuthToken(e.target.value)}
                        placeholder="Auth token key"
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 bg-white dark:bg-slate-800 font-mono text-xs dark:text-white transition-all"
                      />
                    </div>
                  </div>
                )}
                
                {/* UltraMsg Form (for Super Admin test) */}
                {whatsAppProvider === 'ULTRAMSG' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-50/50 dark:bg-slate-800/10 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <div className="sm:col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-850 pb-2 mb-2">
                      <Key size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Global UltraMsg API Test config</span>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Instance ID</label>
                      <input
                        type="text"
                        value={whatsAppInstanceId}
                        onChange={(e) => setWhatsAppInstanceId(e.target.value)}
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 bg-white dark:bg-slate-800 font-bold text-sm dark:text-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">API Token</label>
                      <input
                        type="password"
                        value={whatsAppApiKey}
                        onChange={(e) => setWhatsAppApiKey(e.target.value)}
                        className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 bg-white dark:bg-slate-800 font-mono text-xs dark:text-white transition-all"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Custom Welcome Message */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Custom Chatbot Welcome Greeting</label>
              <textarea
                value={whatsAppWelcomeMessage}
                onChange={(e) => setWhatsAppWelcomeMessage(e.target.value)}
                rows={3}
                placeholder="Hi! Welcome to our restaurant. How can we serve you today?"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white dark:bg-slate-800 font-bold text-sm dark:text-white transition-all"
              />
            </div>

            {/* Custom Receipt Template */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Custom Invoice Template</label>
              <textarea
                value={whatsAppTemplate}
                onChange={(e) => setWhatsAppTemplate(e.target.value)}
                rows={4}
                placeholder="*Receipt from {HOTEL}*\nOrder No: {ORDER_NO}\nTotal: ₹{TOTAL}"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 bg-white dark:bg-slate-800 font-mono text-xs dark:text-white transition-all"
              />
              <p className="text-[8px] text-gray-400 font-bold uppercase mt-1 px-1">
                Placeholders: {"{HOTEL}"}, {"{ORDER_NO}"}, {"{TOTAL}"}, {"{ITEMS}"}
              </p>
            </div>

            {/* Webhook copying block */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                <Info size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Public Webhook URL</span>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase mb-4 leading-normal">
                Copy and configure this webhook link in your developer portal:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-500 select-all outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all flex items-center justify-center shrink-0"
                  title="Copy Webhook Link"
                >
                  {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
          </>
        )}

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black tracking-widest py-4 rounded-2xl shadow-xl shadow-emerald-100 dark:shadow-none flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
        >
          {saving ? 'SAVING CONFIGURATION...' : 'SAVE WHATSAPP CONFIG'}
        </Button>
      </div>
    </Card>
  );
};
