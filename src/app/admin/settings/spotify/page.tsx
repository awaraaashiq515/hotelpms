'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Key, Music2, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/* ── Spotify Green colour ── */
const SP = '#1DB954';

function SpotifyLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 168 168" fill="none">
      <circle cx="84" cy="84" r="84" fill={SP} />
      <path d="M120.7 116.8c-1.6 2.6-4.9 3.4-7.5 1.8-20.5-12.5-46.3-15.3-76.7-8.4-3 .7-6-1.2-6.7-4.2-.7-3 1.2-6 4.2-6.7 33.2-7.6 61.9-4.3 85 9.6 2.6 1.6 3.4 4.9 1.7 7.9zm9.4-23.2c-2 3.2-6.3 4.2-9.5 2.2-23.5-14.4-59.4-18.6-87.2-10.2-3.5 1-7.2-1-8.2-4.5-1-3.5 1-7.2 4.5-8.2 31.8-9.7 71.2-4.9 98.2 11.6 3.2 2 4.2 6.2 2.2 9.1zm.8-24.2c-28.2-16.7-74.7-18.2-101.5-10.1-4.3 1.3-8.8-1.1-10.1-5.4-1.3-4.3 1.1-8.8 5.4-10.1 30.8-9.4 82-7.5 114.3 11.7 3.8 2.3 5.1 7.2 2.8 11-.3.4-.5.8-.9 1-2.3 2-5.3 2.1-7.6.6-.9-.4-1.7-.8-2.4-1.2z" fill="white"/>
    </svg>
  );
}

const SETUP_STEPS = [
  'Go to developer.spotify.com/dashboard and log in',
  'Click "Create App" — enter any name & description',
  'Add the Redirect URI shown below to your app settings',
  'Copy the Client ID and Client Secret from the app dashboard',
  'Configure them in the form on the left and save',
  'Your DJ Music Player is now ready to authorize with Spotify!',
];

export default function SpotifySettingsPage() {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [redirectUri, setRedirectUri] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState('');
  const [copied, setCopied] = useState<'uri' | null>(null);

  // Compute default redirect URI fallback
  const defaultRedirectUri = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/music/spotify/callback`;

  // Fetch Spotify configuration on mount
  useEffect(() => {
    fetch('/api/admin/properties/spotify')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setClientId(json.clientId || '');
          setClientSecret(json.clientSecret || '');
          setRedirectUri(json.redirectUri || '');
        }
        setLoadingConfig(false);
      })
      .catch(() => setLoadingConfig(false));
  }, []);

  const handleSave = async () => {
    const cleanClientId = clientId.trim();
    const cleanClientSecret = clientSecret.trim();
    const cleanRedirectUri = redirectUri.trim();

    setClientId(cleanClientId);
    setClientSecret(cleanClientSecret);
    setRedirectUri(cleanRedirectUri);

    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/properties/spotify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: cleanClientId,
          clientSecret: cleanClientSecret,
          redirectUri: cleanRedirectUri
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(data.message || 'Failed to save');
      }
    } catch {
      alert('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    const cleanClientId = clientId.trim();
    const cleanClientSecret = clientSecret.trim();

    if (!cleanClientId || !cleanClientSecret) return;
    setTestStatus('testing');
    setTestMsg('');
    try {
      const res = await fetch('/api/admin/properties/spotify/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: cleanClientId, clientSecret: cleanClientSecret }),
      });
      const data = await res.json();
      if (data.success) {
        setTestStatus('ok');
        setTestMsg(data.message || 'Connection successful!');
      } else {
        setTestStatus('fail');
        setTestMsg(data.message || 'Client credentials are invalid');
      }
    } catch {
      setTestStatus('fail');
      setTestMsg('Failed to connect to Spotify accounts service');
    }
    setTimeout(() => setTestStatus('idle'), 5000);
  };

  const copyText = (text: string, key: 'uri') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  if (loadingConfig) {
    return (
      <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest text-xs">
        Loading Spotify Configurations...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/settings" className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-all">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <SpotifyLogo size={26} /> Spotify Integration
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-0.5">
              Super Admin Settings • Enable Spotify for the DJ Music Player
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://developer.spotify.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-widest transition-all hover:opacity-90"
            style={{ background: SP, color: '#000' }}
          >
            <ExternalLink size={14} /> Developer Dashboard
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-950 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-100 px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Key size={24} style={{ color: SP }} />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Global Spotify Application settings</h2>
            </div>

            <div className="space-y-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Here you can set the global Spotify application credentials. Once saved, this allows users to authenticate with their personal Spotify accounts and fetch their custom playlists and search results in the music player.
              </p>

              <div className="space-y-4 pt-2">
                {/* Client ID */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Spotify Client ID
                  </label>
                  <input
                    type="text"
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    placeholder="Enter Spotify Client ID..."
                    className="w-full px-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* Client Secret */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Spotify Client Secret
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={clientSecret}
                      onChange={e => setClientSecret(e.target.value)}
                      placeholder="Enter Spotify Client Secret..."
                      className="w-full pr-12 pl-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showSecret ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Redirect URI */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Custom Redirect URI (Optional)
                  </label>
                  <input
                    type="text"
                    value={redirectUri}
                    onChange={e => setRedirectUri(e.target.value)}
                    placeholder={`Fallback: ${defaultRedirectUri}`}
                    className="w-full px-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                    Leave blank to automatically detect host URL e.g. <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{defaultRedirectUri}</code>
                  </p>
                </div>

                {testStatus !== 'idle' && (
                  <div
                    className={`flex items-center gap-2.5 p-4 rounded-2xl text-xs font-bold transition-all border ${
                      testStatus === 'ok'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                        : testStatus === 'fail'
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/30'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent'
                    }`}
                  >
                    {testStatus === 'testing' ? (
                      <Loader2 size={16} className="animate-spin text-emerald-600" />
                    ) : testStatus === 'ok' ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    {testStatus === 'testing' ? 'Testing credentials...' : testMsg}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleTest}
                    disabled={!clientId.trim() || !clientSecret.trim() || testStatus === 'testing'}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Redirect URI Card */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 mb-4">
              <Music2 size={20} className="text-slate-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Redirect URI</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 leading-relaxed">
              Copy this URI and paste it into your Spotify App settings under <strong>"Redirect URIs"</strong>.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 rounded-2xl text-xs font-mono text-emerald-400 overflow-x-auto" style={{ background: '#0d1117' }}>
                {redirectUri || defaultRedirectUri}
              </code>
              <button
                onClick={() => copyText(redirectUri || defaultRedirectUri, 'uri')}
                className="px-4 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex-shrink-0"
                style={{ background: copied === 'uri' ? SP : 'rgba(29,185,84,0.12)', color: copied === 'uri' ? '#000' : SP, border: `1px solid ${SP}40` }}
              >
                {copied === 'uri' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Right — Step-by-step guide */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <SpotifyLogo size={22} />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Setup Guide</h2>
          </div>

          <ol className="space-y-4">
            {SETUP_STEPS.map((step, i) => (
              <li key={i} className="flex gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal">
                <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center font-black text-[9px] text-white" style={{ background: SP }}>
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <a
              href="https://developer.spotify.com/documentation/web-api/tutorials/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              style={{ background: 'rgba(29,185,84,0.08)', color: SP, border: `1px solid ${SP}30` }}
            >
              Official Docs <ExternalLink size={11} />
            </a>
          </div>

          <div className="p-4 rounded-2xl" style={{ background: 'rgba(29,185,84,0.06)', border: `1px solid ${SP}25` }}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1.5" style={{ color: SP }}>💡 Note</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
              Staff use their own personal Spotify account to log in. The app credentials (Client ID / Secret) are shared, but each person&apos;s library and playlists are their own.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
