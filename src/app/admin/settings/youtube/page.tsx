'use client';

import React, { useState, useEffect } from 'react';
import { Save, Key, Youtube, ExternalLink, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function YouTubeSettingsPage() {
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [loadingKey, setLoadingKey] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState('');
  const [saved, setSaved] = useState(false);

  // Fetch global API key on mount
  useEffect(() => {
    fetch('/api/admin/properties/youtube')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setYoutubeApiKey(json.youtubeApiKey || '');
        }
        setLoadingKey(false);
      })
      .catch(() => setLoadingKey(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/properties/youtube', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeApiKey }),
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
    if (!youtubeApiKey.trim()) return;
    setTestStatus('testing');
    setTestMsg('');
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&type=video&maxResults=1&key=${youtubeApiKey}`
      );
      const data = await res.json();
      if (data.error) {
        setTestStatus('fail');
        setTestMsg(data.error.message || 'API key is invalid');
      } else {
        setTestStatus('ok');
        setTestMsg('API key is valid and working!');
      }
    } catch {
      setTestStatus('fail');
      setTestMsg('Failed to connect to YouTube API');
    }
    setTimeout(() => setTestStatus('idle'), 5000);
  };

  if (loadingKey) {
    return (
      <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest text-xs">
        Loading YouTube Configurations...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-full transition-all"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              YouTube Setup Control
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-0.5">
              Super Admin Settings • Global Platform YouTube API Key
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-pos-primary hover:bg-pos-primary-dark text-white px-8 py-3.5 rounded-full font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-pos-primary/25 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Key'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <ShieldCheck size={24} className="text-pos-primary" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Global API Configuration</h2>
            </div>

            <div className="space-y-5">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Here you can set the global YouTube Data API Key. Once saved, this key will be active for **all properties (both old and new)** in the system. This key enables music and video search capabilities inside the POS Music Player.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 dark:text-red-400">
                    <Youtube size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                      YouTube API Credentials
                    </h3>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    YouTube Data API v3 Key
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={youtubeApiKey}
                      onChange={e => setYoutubeApiKey(e.target.value)}
                      placeholder="Configure YouTube key..."
                      className="w-full pr-12 pl-4 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-pos-primary outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showKey ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
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
                      <Loader2 size={16} className="animate-spin text-pos-primary" />
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
                    disabled={!youtubeApiKey.trim() || testStatus === 'testing'}
                    className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    Test Key
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <Key size={24} className="text-pos-primary" />
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Help & Integration</h2>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            YouTube Data API v3 allows the Music Player embedded inside POS terminals to search YouTube's video catalog directly.
          </p>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Setup Instructions:
            </h4>
            <ol className="space-y-3">
              {[
                'Go to Google Cloud Console Credentials',
                'Generate a new API Key',
                'Search & Enable "YouTube Data API v3" in API Library',
                'Optional: Restrict key for increased security',
                'Configure key on the left, paste Key & save',
              ].map((step, idx) => (
                <li key={idx} className="flex gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-normal">
                  <span className="w-5 h-5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex-shrink-0 flex items-center justify-center font-black text-[9px] border border-purple-100 dark:border-purple-900/30">
                    {idx + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="pt-4 border-t border-slate-150 dark:border-slate-800">
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-[10px] font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 uppercase tracking-widest transition-all"
            >
              Google Cloud Console <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
