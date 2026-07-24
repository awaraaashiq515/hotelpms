'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Image as ImageIcon, Loader2, X } from 'lucide-react';

export const PosSecurityForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [editingProp, setEditingProp] = useState<any>(null);
  
  // Modal State
  const [timeout, setTimeoutValue] = useState(0);
  const [message, setMessage] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [terminalPin, setTerminalPin] = useState('');
  const [showBarInQrMenu, setShowBarInQrMenu] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/properties?global=true');
      const data = await res.json();
      if (data.success) setProperties(data.data);
    } finally {
      setLoading(false);
    }
  };

  const openConfig = (prop: any) => {
    setEditingProp(prop);
    setTimeoutValue(prop.posAutoLockTimeout || 0);
    setMessage(prop.posLockScreenMessage || 'Station Locked');
    setBgUrl(prop.posLockScreenBgUrl || '');
    setTerminalPin(prop.posTerminalPin || '');
    setShowBarInQrMenu(prop.showBarInQrMenu ?? true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) setBgUrl(data.url);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editingProp) return;
    setSaving(true);
    try {
      await fetch(`/api/setup/properties/${editingProp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          posAutoLockTimeout: timeout,
          posLockScreenMessage: message,
          posLockScreenBgUrl: bgUrl,
          posTerminalPin: terminalPin,
          showBarInQrMenu: showBarInQrMenu
        })
      });
      await fetchProperties();
      setEditingProp(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading && properties.length === 0) {
    return (
      <div className="py-20 text-center">
        <Loader2 className="animate-spin mx-auto text-pos-primary mb-4" size={32} />
        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Loading Security Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Property Security Fleet</h2>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-tight mt-1">Manage station security across all your terminals</p>
        </div>
        <div className="flex items-center gap-3 p-3 bg-pos-primary/5 rounded-2xl border border-pos-primary/10">
          <ShieldCheck className="text-pos-primary" size={20} />
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{properties.length} Properties Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {properties.map(prop => (
          <Card key={prop.id} className="p-0 overflow-hidden group hover:shadow-2xl transition-all duration-500 border-none bg-white dark:bg-slate-900/50">
            <div className="relative h-24 bg-slate-100 dark:bg-slate-800">
               {prop.posLockScreenBgUrl ? (
                 <img src={prop.posLockScreenBgUrl} className="w-full h-full object-cover opacity-60" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center opacity-10">
                    <ImageIcon size={40} />
                 </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 to-transparent" />
               <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${prop.posAutoLockTimeout > 0 ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">{prop.posAutoLockTimeout > 0 ? 'Security Active' : 'Lock Disabled'}</span>
               </div>
            </div>
            
            <div className="p-6 pt-0 relative -mt-6">
               <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-lg mb-4 border border-slate-100 dark:border-slate-700">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm truncate">{prop.name}</h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{prop.code}</p>
               </div>

               <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                     <span>Lock Timeout</span>
                     <span className="text-slate-800 dark:text-white">{prop.posAutoLockTimeout ? `${prop.posAutoLockTimeout}m` : 'OFF'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                     <span>Terminal PIN</span>
                     <span className="text-pos-primary font-mono tracking-widest">{prop.posTerminalPin ? '•'.repeat(prop.posTerminalPin.length) : 'NONE'}</span>
                  </div>
               </div>

               <Button 
                onClick={() => openConfig(prop)}
                className="w-full bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-black text-[10px] uppercase tracking-widest py-3 rounded-xl transition-all"
               >
                 Configure Security
               </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      {editingProp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setEditingProp(null)} />
          <Card className="w-full max-w-lg relative z-[101] p-8 shadow-2xl border-l-[6px] border-l-pos-primary bg-white dark:bg-slate-900 overflow-hidden">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-pos-primary/10 text-pos-primary rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Configure {editingProp.name}</h2>
                  <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-tight mt-0.5">Terminal Security Profile</p>
                </div>
              </div>
              <button onClick={() => setEditingProp(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                   <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Terminal PIN</label>
                   <input 
                      type="text" 
                      maxLength={8}
                      value={terminalPin}
                      onChange={(e) => setTerminalPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter PIN"
                      className="w-full bg-transparent text-2xl font-black text-pos-primary tracking-[0.5em] text-center outline-none"
                   />
                </div>
                <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                   <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Auto-Lock Delay</label>
                   <select 
                    value={timeout}
                    onChange={(e) => setTimeoutValue(Number(e.target.value))}
                    className="w-full bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none"
                   >
                      <option value={0}>Disabled</option>
                      {[1, 2, 5, 10, 15, 30, 45, 60].map(m => <option key={m} value={m}>{m} Minutes</option>)}
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Lock Screen Message</label>
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-bold dark:text-white outline-none focus:border-pos-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Station Wallpaper</label>
                <div className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                  <div className="w-20 h-20 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-inner flex items-center justify-center relative shrink-0">
                    {bgUrl ? <img src={bgUrl} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-200" size={24} />}
                    {uploading && <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center"><Loader2 className="animate-spin text-pos-primary" size={16} /></div>}
                  </div>
                  <div className="flex-1">
                    <input type="file" id="modal-bg-upload" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    <label htmlFor="modal-bg-upload" className="inline-flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-black transition-all">
                      Change Image
                    </label>
                  </div>
                </div>
              </div>

              {/* QR Menu Control */}
              <div className="p-6 bg-pos-primary/5 rounded-2xl border border-pos-primary/10 flex items-center justify-between">
                <div>
                   <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Show Bar in QR Menu</h4>
                   <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Toggle visibility of BAR items for customers</p>
                </div>
                <button 
                  onClick={() => setShowBarInQrMenu(!showBarInQrMenu)}
                  className={`w-12 h-7 rounded-full transition-all relative ${showBarInQrMenu ? 'bg-pos-primary' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${showBarInQrMenu ? 'left-6' : 'left-1 shadow-sm'}`} />
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <Button onClick={() => setEditingProp(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest py-4 rounded-xl transition-all">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={saving || uploading}
                  className="flex-[2] bg-pos-primary hover:bg-pos-primary-dark text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                >
                  {saving ? 'UPDATING...' : 'SAVE CONFIGURATION'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
