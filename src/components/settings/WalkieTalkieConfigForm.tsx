'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Radio, Folder } from 'lucide-react';

export const WalkieTalkieConfigForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storagePath, setStoragePath] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    fetch('/api/walkie-talkie/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.storagePath) {
          setStoragePath(data.storagePath);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/walkie-talkie/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath })
      });
      if (res.ok) {
        setStatusMsg('Storage path updated successfully!');
      } else {
        setStatusMsg('Failed to update storage path.');
      }
    } catch (error) {
      setStatusMsg('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest">Loading Settings...</div>;

  return (
    <Card className="p-5 lg:p-8 border-t-4 border-t-indigo-600 shadow-2xl shadow-gray-100">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
          <Radio size={24} />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest font-mono">Walkie-Talkie Settings</h2>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">Configure system parameters for voice notes storage.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <Folder size={12} /> Local Voice Storage Directory Path
          </label>
          <input 
            type="text" 
            value={storagePath}
            onChange={(e) => setStoragePath(e.target.value)}
            placeholder="e.g., ./public/uploads/voice-messages"
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-gray-50/30 dark:bg-slate-800/50 font-bold text-sm dark:text-white tracking-tight transition-all font-mono"
          />
          <p className="text-[9px] text-gray-400 font-bold uppercase mt-2 tracking-tighter">
            Specify where the server should save recorded walkie-talkie voice notes locally on this computer.
          </p>
        </div>

        {statusMsg && (
          <div className={`p-4 rounded-2xl font-bold text-xs ${statusMsg.includes('successfully') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
            {statusMsg}
          </div>
        )}

        <div className="pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black tracking-widest py-5 rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {saving ? 'UPDATING STORAGE PATH...' : 'SAVE WALKIE-TALKIE SETTINGS'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
