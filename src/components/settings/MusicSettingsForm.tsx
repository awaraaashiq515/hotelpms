'use client';

import React, { useState, useEffect } from 'react';
import { Music2, Key, Save, Eye, EyeOff, ExternalLink, CheckCircle2, AlertCircle, Loader2, Youtube } from 'lucide-react';

export const MusicSettingsForm = () => {
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState('');
  const [saved, setSaved] = useState(false);
  const [isGlobalFallback, setIsGlobalFallback] = useState(false);

  useEffect(() => {
    fetch('/api/music/settings')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setYoutubeApiKey(data.data.youtubeApiKey || '');
          setIsGlobalFallback(!!data.data.isGlobalFallback);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/music/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeApiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    finally { setSaving(false); }
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-purple-500" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Music Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-pink-500/10 blur-xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Music2 size={24} className="text-purple-300" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-white">Music Player Module</h2>
            <p className="text-[10px] text-purple-300/80 font-bold uppercase tracking-tight mt-0.5">
              YouTube API powered • Embedded inside POS • No redirect
            </p>
          </div>
        </div>
        <div className="relative z-10 mt-4 grid grid-cols-3 gap-3">
          {[
            ['🎵', 'Search Songs', 'Find any song on YouTube'],
            ['📋', 'Playlist', 'Save custom playlists per property'],
            ['🔒', 'Embedded', 'Plays inside POS, never leaves'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="bg-white/10 rounded-2xl p-3">
              <p className="text-lg mb-1">{icon}</p>
              <p className="text-[10px] font-black text-white uppercase tracking-wide">{title}</p>
              <p className="text-[9px] text-purple-300/70 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* API Key Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-600 dark:text-red-400">
            <Youtube size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">YouTube Data API v3</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight">Required to search and load songs</p>
          </div>
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-700 dark:text-blue-400 uppercase tracking-widest"
          >
            Get API Key <ExternalLink size={11} />
          </a>
        </div>

        {/* API Key Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 flex-wrap">
            <Key size={11} /> YouTube API Key
            {isGlobalFallback && (
              <span className="ml-2 px-2 py-0.5 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-[8px] animate-pulse">
                Platform Default Key Active
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={youtubeApiKey}
              onChange={e => setYoutubeApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full pr-10 pl-4 py-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
            >
              {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Test Status */}
        {testStatus !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${
            testStatus === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
              : testStatus === 'fail'
              ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30'
              : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
          }`}>
            {testStatus === 'testing' ? <Loader2 size={14} className="animate-spin" /> : testStatus === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {testStatus === 'testing' ? 'Testing API key...' : testMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={!youtubeApiKey.trim() || testStatus === 'testing'}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {testStatus === 'testing' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Test Key
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-[0.98] shadow-md ${
              saved
                ? 'bg-emerald-600 shadow-emerald-500/20'
                : 'bg-gradient-to-r from-purple-600 to-pink-500 shadow-purple-500/20 hover:opacity-90'
            }`}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <CheckCircle2 size={12} /> : <Save size={12} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save API Key'}
          </button>
        </div>

        {/* How to get key */}
        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-800">
          <p className="text-[10px] font-black text-gray-700 dark:text-slate-300 uppercase tracking-widest mb-2">How to get YouTube API Key:</p>
          <ol className="space-y-1.5">
            {[
              'Go to Google Cloud Console → APIs & Services → Credentials',
              'Create a new API Key',
              'Enable "YouTube Data API v3" in Library',
              'Restrict the key to "YouTube Data API v3" for security',
              'Paste the key above and click Save',
            ].map((step, i) => (
              <li key={i} className="flex gap-2 text-[10px] text-gray-500 dark:text-slate-400 font-bold">
                <span className="w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex-shrink-0 flex items-center justify-center font-black text-[8px]">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Go to Player */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/10 rounded-3xl p-5 border border-purple-100 dark:border-purple-900/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music2 size={20} className="text-purple-600 dark:text-purple-400" />
          <div>
            <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wide">Open Music Player</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500">Search songs, manage playlist and play music</p>
          </div>
        </div>
        <a
          href="../music"
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-purple-500/20"
        >
          Open Player <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
};
