'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldCheck } from 'lucide-react';

export const AiConfigForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings/ai')
      .then(res => res.json())
      .then(data => {
        if (data.success) setGeminiApiKey(data.data.geminiApiKey || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!geminiApiKey.trim()) return alert('Please enter a valid API Key');
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: geminiApiKey.trim() })
      });
      if (res.ok) alert('AI Configuration updated!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Card className="p-8 border-l-[6px] border-l-slate-900 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <ShieldCheck size={120} />
      </div>
      <div className="space-y-6 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Mint AI API Key</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-tight">Technical sync & prompt intelligence</p>
          </div>
        </div>
        
        <div className="space-y-2">
           <input 
             type="password" 
             placeholder="AIzaSy..."
             value={geminiApiKey}
             onChange={(e) => setGeminiApiKey(e.target.value)}
             className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 focus:border-slate-900 bg-white dark:bg-slate-800 dark:text-white text-sm font-mono tracking-widest"
           />
           <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight px-1"> This key is used for secure extraction of scanned menu photos.</p>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full bg-slate-900 hover:bg-black text-white font-black tracking-widest py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
        >
          {saving ? 'SAVING KEY...' : 'SYNC AI CONFIG'}
        </Button>
      </div>
    </Card>
  );
};
