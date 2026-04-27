'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Image as ImageIcon, Upload, Tablet, ChevronRight, Printer, ShieldCheck, CreditCard, LayoutDashboard, Globe, MonitorPlay, MapPin, Facebook, Instagram, Twitter, Save, RefreshCcw, Loader2, X } from 'lucide-react';
import Link from 'next/link';

// --- Shared Components ---

const BusinessProfileForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingSimple, setTestingSimple] = useState(false);
  const [property, setProperty] = useState<any>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [thermalPrinterName, setThermalPrinterName] = useState('MPT-II');
  const [enableDirectPrinting, setEnableDirectPrinting] = useState(true);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const prop = data.data;
          setProperty(prop);
          setDisplayName(prop.name || '');
          setAddress(prop.address || '');
          setPhone(prop.phone || '');
          setGstNumber(prop.taxDetails || '');
          setThermalPrinterName(prop.thermalPrinterName || 'MPT-II');
          setEnableDirectPrinting(prop.enableDirectPrinting ?? true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/setup/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName,
          address,
          phone,
          taxDetails: gstNumber,
          thermalPrinterName,
          enableDirectPrinting,
          logoUrl: property.logoUrl // Keep existing logo
        })
      });
      if (res.ok) alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTest: true, property })
      });
      const data = await res.json();
      if (data.success) {
        alert('Test print sent!');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      alert(`Test print failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleTestPrintSimple = async () => {
    setTestingSimple(true);
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTest: true, property })
      });
      const data = await res.json();
      if (data.success) {
        alert('Simple test print sent!');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      alert(`Simple test print failed: ${err.message}`);
    } finally {
      setTestingSimple(false);
    }
  };

  const handleFetchPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const { printerService } = await import('@/lib/printer-service');
      const list = await printerService.findPrinters();
      const printerArray = Array.isArray(list) ? list : [list];
      setAvailablePrinters(printerArray);
      if (printerArray.length > 0 && !printerArray.includes(thermalPrinterName)) {
        // Optional: don't auto-set if already set to something valid
      }
    } catch (err) {
      console.error('Failed to fetch printers', err);
    } finally {
      setLoadingPrinters(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest">Loading Profile...</div>;

  return (
    <Card className="p-5 lg:p-8 border-t-4 border-t-pos-primary shadow-2xl shadow-gray-100">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="w-12 h-12 bg-pos-primary/10 text-pos-primary rounded-2xl flex items-center justify-center">
          <Printer size={24} />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Bill Header Details</h2>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">This info appears on your printed bills & invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Restaurant / Display Name</label>
          <input 
            type="text" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-black text-sm dark:text-white uppercase tracking-tight transition-all"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Physical Address</label>
          <textarea 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-bold text-sm dark:text-white tracking-tight transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Contact Number</label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-bold text-sm dark:text-white transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">GSTIN / TAX No</label>
          <input 
            type="text" 
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-black text-sm dark:text-white transition-all"
          />
        </div>

        <div className="sm:col-span-2 border-t border-gray-100 pt-6 mt-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Thermal Printer (QZ Tray)</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Direct ESC/POS Printing Settings</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Printer Name (e.g. MPT-II)</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      value={thermalPrinterName}
                      onChange={(e) => setThermalPrinterName(e.target.value)}
                      placeholder="MPT-II"
                      className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white dark:bg-slate-800 font-black text-sm dark:text-white transition-all"
                    />
                    {availablePrinters.length > 0 && (
                      <select
                        onChange={(e) => setThermalPrinterName(e.target.value)}
                        value={thermalPrinterName}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-100 border-none rounded-lg text-[10px] font-bold py-1 px-2 outline-none"
                      >
                        <option value="">Select Printer</option>
                        {availablePrinters.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    )}
                  </div>
                  <button 
                    onClick={handleFetchPrinters}
                    disabled={loadingPrinters}
                    className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 text-indigo-600 transition-all"
                    title="Refresh Printer List"
                  >
                    <RefreshCcw size={20} className={loadingPrinters ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  <button 
                    onClick={handleTestPrint}
                    disabled={testing}
                    className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 px-3 py-1.5 rounded-lg tracking-widest flex items-center gap-1 active:scale-95 transition-all"
                  >
                    {testing ? 'Sending...' : '➜ Test ESC/POS (Normal)'}
                  </button>
                  <button 
                    onClick={handleTestPrintSimple}
                    disabled={testingSimple}
                    className="text-[9px] font-black uppercase text-teal-600 hover:text-teal-800 bg-teal-50/50 px-3 py-1.5 rounded-lg tracking-widest flex items-center gap-1 active:scale-95 transition-all"
                  >
                    {testingSimple ? 'Sending...' : '➜ Test Plain Text'}
                  </button>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setEnableDirectPrinting(!enableDirectPrinting)}
                  className={`w-14 h-8 rounded-full transition-all relative ${enableDirectPrinting ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${enableDirectPrinting ? 'left-7' : 'left-1 shadow-sm'}`} />
                </button>
                <div>
                   <p className="text-[10px] font-black text-gray-700 dark:text-slate-200 uppercase tracking-widest">Enable Direct Print</p>
                   <p className="text-[8px] text-gray-400 font-bold uppercase">Skip browser dialog</p>
                </div>
             </div>
          </div>
        </div>

        <div className="sm:col-span-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-pos-primary hover:bg-red-700 text-white font-black tracking-widest py-5 rounded-2xl shadow-xl shadow-red-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {saving ? 'UPDATING PRINT SETTINGS...' : 'SAVE PRINT CONFIGURATION'}
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </Card>
  );
};



const AiConfigForm = () => {
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

const PosSecurityForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [editingProp, setEditingProp] = useState<any>(null);
  
  // Modal State
  const [timeout, setTimeoutValue] = useState(0);
  const [message, setMessage] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  const [terminalPin, setTerminalPin] = useState('');
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
          posTerminalPin: terminalPin
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
                     <span className="text-pos-primary font-mono tracking-widest">{prop.posTerminalPin ? '••••••' : 'NONE'}</span>
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
                      maxLength={6}
                      value={terminalPin}
                      onChange={(e) => setTerminalPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="------"
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

const TabletSetupCard = () => {
  return (
    <Card className="p-8 border-l-[6px] border-l-pos-primary group hover:shadow-2xl transition-all duration-500">
      <div className="flex items-start gap-6">
        <div className="bg-pos-primary/10 p-5 rounded-[1.5rem] text-pos-primary group-hover:scale-110 transition-transform">
          <Tablet size={32} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-1">Tablet Ordering System</h3>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-tight leading-relaxed mb-6">
            Configure Waiter and Table modes for your Android/iOS devices. Manage device assignments and real-time tracking.
          </p>
          <Link href="/settings/tablets">
            <Button className="w-full bg-pos-primary hover:bg-pos-primary-dark text-white font-black tracking-widest py-4 rounded-xl shadow-xl shadow-pos-primary/10 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              MANAGE DEVICES <ChevronRight size={16} />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

const WebsiteBrandingForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>({
    hotelName: '',
    logoUrl: '',
    storyTitle: '',
    storyContent: '',
    storyImage1: '',
    storyImage2: '',
    galleryHeroImageUrl: '',
    address: '',
    email: '',
    phone: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: ''
  });

  useEffect(() => {
    fetch('/api/website/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSettings(data.data);
        }
        setLoading(false);
      });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) setSettings((prev: any) => ({ ...prev, [field]: data.url }));
    } catch (err) {
      alert('Upload failed');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/website/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) alert('Website settings updated successfully!');
    } catch (error) {
      alert('Failed to save website settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-pos-primary font-extrabold uppercase tracking-widest">Loading Website Data...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Brand Identity Section */}
      <Card className="p-5 lg:p-8 border-t-4 border-t-pos-primary shadow-2xl shadow-pos-primary/10">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 bg-pos-primary/10 text-pos-primary rounded-2xl flex items-center justify-center shadow-inner">
            <Globe size={24} className="animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Platform Identity</h2>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">Your global website name and primary logo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-3">Platform Name (e.g. OrderMint Solutions)</label>
              <input 
                type="text" 
                value={settings.hotelName}
                onChange={(e) => setSettings({ ...settings, hotelName: e.target.value })}
                placeholder="OrderMint Solutions"
                className="w-full px-6 py-5 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/50 dark:bg-slate-800/50 font-black text-sm dark:text-white uppercase tracking-tight transition-all shadow-sm"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2 text-pos-primary">Support Email</label>
                  <input 
                    type="email" 
                    value={settings.email || ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white shadow-sm font-bold text-xs"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2 text-pos-primary">Contact Number</label>
                  <input 
                    type="text" 
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-5 py-3.5 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white shadow-sm font-bold text-xs"
                  />
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Website Logo</h3>
            <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-pos-primary/40 transition-colors">
              {/* Logo Preview */}
              <div className="w-28 h-28 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0 relative">
                {settings.logoUrl ? (
                  <>
                    <img 
                      src={settings.logoUrl} 
                      alt=""
                      className="w-full h-full object-contain p-2"
                      onLoad={(e) => { (e.target as HTMLImageElement).style.opacity = '1'; }}
                      onError={(e) => { 
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const fallback = img.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                      style={{ opacity: 1 }}
                    />
                    <div className="w-14 h-14 bg-pos-primary rounded-2xl items-center justify-center shadow-lg" style={{ display: 'none' }}>
                      <span className="text-white font-black text-2xl italic">O</span>
                    </div>
                  </>
                ) : (
                  <div className="w-14 h-14 bg-pos-primary rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-black text-2xl italic">O</span>
                  </div>
                )}
              </div>
              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <p className="text-sm font-bold text-gray-700 dark:text-slate-200">
                  {settings.logoUrl ? 'Change your logo' : 'Upload a high-quality logo for your website.'}
                </p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Recommended format is transparent PNG/SVG.</p>
                <div className="flex items-center gap-3 mt-3">
                  <label className="cursor-pointer px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pos-primary transition-all shadow-md">
                    Upload New Logo
                    <input type="file" className="hidden" accept="image/*,image/svg+xml" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                  </label>
                  {settings.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setSettings({ ...settings, logoUrl: '' })}
                      className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 tracking-widest transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Website Story & Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Story Section */}
        <Card className="p-8 border-l-4 border-l-pos-primary shadow-xl overflow-hidden relative">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pos-primary/10 rounded-xl text-pos-primary">
                 <MapPin size={20} />
              </div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Our Story Section</h3>
           </div>
           
           <div className="space-y-4">
              <div>
                 <label className="block text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-2">Section Heading</label>
                 <input 
                    type="text" 
                    value={settings.storyTitle || ''}
                    onChange={(e) => setSettings({ ...settings, storyTitle: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 transition-all text-xs font-bold dark:text-white"
                 />
              </div>
              <div>
                 <label className="block text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-2">Description / Content</label>
                 <textarea 
                    rows={6}
                    value={settings.storyContent || ''}
                    onChange={(e) => setSettings({ ...settings, storyContent: e.target.value })}
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700 transition-all text-xs font-medium leading-relaxed dark:text-slate-300"
                 />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div className="space-y-3">
                    <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                       {settings.storyImage1 && <img src={settings.storyImage1} className="w-full h-full object-cover" />}
                    </div>
                    <input type="file" id="story1-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'storyImage1')} />
                    <label htmlFor="story1-upload" className="block text-center py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-pos-primary transition-all">Story Image 1</label>
                 </div>
                 <div className="space-y-3">
                    <div className="aspect-[4/3] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                       {settings.storyImage2 && <img src={settings.storyImage2} className="w-full h-full object-cover" />}
                    </div>
                    <input type="file" id="story2-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'storyImage2')} />
                    <label htmlFor="story2-upload" className="block text-center py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-pos-primary transition-all">Story Image 2</label>
                 </div>
              </div>
           </div>
        </Card>

        {/* Hero & Socials */}
        <div className="space-y-8">
           {/* Hero Image Section */}
           <Card className="p-8 border-l-4 border-l-orange-500 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-orange-50 dark:bg-orange-950/30 rounded-xl text-orange-600 dark:text-orange-400">
                    <MonitorPlay size={20} />
                 </div>
                 <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Main Hero Banner</h3>
              </div>
              
              <div className="space-y-4 text-center">
                 <div className="aspect-video bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative group">
                    {settings.galleryHeroImageUrl ? (
                       <img src={settings.galleryHeroImageUrl} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 italic text-[10px]">No Hero Background Set</div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <input type="file" id="hero-upload" className="hidden" onChange={(e) => handleFileUpload(e, 'galleryHeroImageUrl')} />
                        <label htmlFor="hero-upload" className="bg-white text-black px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-xl transform scale-90 group-hover:scale-100 transition-transform">Update Banner</label>
                    </div>
                 </div>
                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Dimensions: 1920x1080px (Optimal for High Res)</p>
              </div>
           </Card>

           {/* Social Media Links */}
           <Card className="p-8 border-l-4 border-l-emerald-500 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                    <Facebook size={20} />
                 </div>
                 <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Social Footprint</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div>
                    <label className="flex items-center gap-2 text-[9px] font-black text-pos-primary uppercase mb-2"><Facebook size={12}/> Facebook</label>
                    <input 
                       type="text" 
                       value={settings.facebookUrl || ''}
                       onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white"
                       placeholder="https://facebook.com/..."
                    />
                 </div>
                 <div>
                    <label className="flex items-center gap-2 text-[9px] font-black text-pink-500 uppercase mb-2"><Instagram size={12}/> Instagram</label>
                    <input 
                       type="text" 
                       value={settings.instagramUrl || ''}
                       onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white"
                       placeholder="https://instagram.com/..."
                    />
                 </div>
                 <div>
                    <label className="flex items-center gap-2 text-[9px] font-black text-blue-400 uppercase mb-2"><Twitter size={12}/> Twitter (X)</label>
                    <input 
                       type="text" 
                       value={settings.twitterUrl || ''}
                       onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                       className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-bold dark:text-white"
                       placeholder="https://twitter.com/..."
                    />
                 </div>
              </div>
           </Card>
        </div>
      </div>

      {/* Global Save Button */}
      <div className="sticky bottom-6 z-10 animate-in slide-in-from-bottom-2 duration-500">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="w-full bg-pos-primary hover:bg-black text-white font-black tracking-[0.3em] py-6 rounded-[2.5rem] shadow-2xl shadow-pos-primary/20 border-2 border-white flex items-center justify-center gap-4 transition-all active:scale-[0.98]"
        >
          {saving ? (
             <>
                <RefreshCcw className="animate-spin" size={24} />
                <span>UPDATING PLATFORM...</span>
             </>
          ) : (
             <>
                <Save size={24} />
                <span>SAVE WEBSITE CONFIGURATION</span>
             </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'admin' | 'website'>('profile');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSession(data.user);
        }
      })
      .catch(err => console.error('Failed to fetch session', err));
  }, []);

  const tabs = [
    { id: 'profile', label: 'Print Settings', icon: Printer, color: 'text-pos-primary', bg: 'bg-pos-primary/10' },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, color: 'text-slate-900', bg: 'bg-slate-100' },
    ...(session?.role === 'SUPER_ADMIN' ? [{ id: 'website', label: 'Website (OrderMint)', icon: Globe, color: 'text-pos-primary', bg: 'bg-pos-primary/10' }] : []),
  ];

  const isSuperAdmin = session?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="Settings" 
        description="Configure your restaurant profile, logo, and system parameters."
      />

      {/* Modern Tab Navigation - Scrollable on Mobile */}
      <div className="overflow-x-auto no-scrollbar pb-2 lg:pb-0">
        <div className="flex items-center gap-2 lg:gap-3 bg-gray-100/50 dark:bg-slate-800/50 p-1 lg:p-1.5 rounded-2xl lg:rounded-[2rem] w-max border border-gray-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center gap-2 lg:gap-3 px-4 lg:px-6 py-2.5 lg:py-3.5 rounded-xl lg:rounded-[1.5rem] text-[9px] lg:text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 whitespace-nowrap
                  ${isActive 
                    ? `${tab.bg} ${tab.color} shadow-lg shadow-white/50 ring-1 ring-white/10` 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-white/50'
                  }
                `}
              >
                <Icon size={14} className={isActive ? 'animate-pulse' : ''} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full pb-20">
        {activeTab === 'profile' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl">
            <BusinessProfileForm />
          </div>
        )}
        


        {activeTab === 'admin' && (
          <div className="flex flex-col gap-8 items-stretch animate-in slide-in-from-bottom-4 duration-500 w-full max-w-6xl">
            {isSuperAdmin && (
               <div className="max-w-4xl">
                  <AiConfigForm />
               </div>
            )}
            <PosSecurityForm />
            <div className="max-w-4xl">
              <TabletSetupCard />
            </div>
          </div>
        )}

        {activeTab === 'website' && isSuperAdmin && (
           <div className="animate-in slide-in-from-bottom-4 duration-500 max-w-4xl">
             <WebsiteBrandingForm />
           </div>
        )}
      </div>
    </div>
  );
}
