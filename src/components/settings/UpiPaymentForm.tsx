'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { QrCode, CheckCircle, Loader2, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const UpiPaymentForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState('');
  const [upiLimit, setUpiLimit] = useState(100000);
  const [upiReceivedToday, setUpiReceivedToday] = useState(0);
  
  const [upiId2, setUpiId2] = useState('');
  const [upiName2, setUpiName2] = useState('');
  const [upiLimit2, setUpiLimit2] = useState(100000);
  const [upiReceivedToday2, setUpiReceivedToday2] = useState(0);

  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const prop = data.data;
          setProperty(prop);
          setUpiId(prop.upiId || '');
          setUpiName(prop.upiName || prop.name || '');
          setUpiLimit(prop.upiLimit || 100000);
          setUpiReceivedToday(prop.upiReceivedToday || 0);
          
          setUpiId2(prop.upiId2 || '');
          setUpiName2(prop.upiName2 || '');
          setUpiLimit2(prop.upiLimit2 || 100000);
          setUpiReceivedToday2(prop.upiReceivedToday2 || 0);

          if (prop.upiId2) setShowFallback(true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!property) return;
    if (!upiId.trim()) return alert('Please enter a valid UPI ID');
    setSaving(true);
    try {
      const res = await fetch(`/api/setup/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          upiId: upiId.trim(), 
          upiName: upiName.trim(),
          upiLimit: Number(upiLimit),
          upiId2: upiId2.trim(),
          upiName2: upiName2.trim(),
          upiLimit2: Number(upiLimit2)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(data.message || 'Save failed');
      }
    } catch (error) {
      alert('Failed to save UPI settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest">Loading Payment Engine...</div>;

  const primaryFull = upiReceivedToday >= upiLimit && upiLimit > 0;
  const secondaryFull = upiReceivedToday2 >= upiLimit2 && upiLimit2 > 0;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Hero Card */}
      <Card className="p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-900">
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl">
                <QrCode size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Smart UPI Gateway</h2>
                <p className="text-indigo-200 text-[11px] font-bold uppercase tracking-[0.2em]">With Auto-Rotation & Account Limits</p>
              </div>
            </div>
            <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl font-medium">
              Maximize your daily transactions. Set up multiple UPI accounts and we'll automatically switch to the next one when your daily limit is reached.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 -mt-8 rounded-t-[3rem] relative z-10 border-t border-white/10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Form Fields */}
            <div className="lg:col-span-7 space-y-8">
              {/* Primary Account Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 font-black text-xs">01</div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Primary UPI Account</h3>
                    {primaryFull && <span className="bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black animate-pulse">LIMIT REACHED</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Primary UPI ID *</label>
                        <input
                            type="text"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="restaurant@oksbi"
                            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 bg-gray-50/50 dark:bg-slate-800/50 font-bold text-sm dark:text-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                        <input
                            type="text"
                            value={upiName}
                            onChange={(e) => setUpiName(e.target.value)}
                            placeholder="Ashoka Dhaba"
                            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 bg-gray-50/50 dark:bg-slate-800/50 font-bold text-sm dark:text-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Daily Limit (₹)</label>
                        <input
                            type="number"
                            value={upiLimit}
                            onChange={(e) => setUpiLimit(Number(e.target.value))}
                            className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/20 focus:border-indigo-500 bg-gray-50/50 dark:bg-slate-800/50 font-bold text-sm dark:text-white transition-all"
                        />
                    </div>
                </div>

                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl p-4 flex items-center justify-between border border-indigo-100/50 dark:border-indigo-900/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Today's Collection</p>
                            <p className="text-lg font-black text-slate-900 dark:text-white leading-none">₹{upiReceivedToday.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilization</p>
                        <div className="w-32 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${primaryFull ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${Math.min(100, (upiReceivedToday / upiLimit) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
              </div>

              {/* Fallback Section */}
              <div className="pt-4">
                {!showFallback ? (
                    <button 
                        onClick={() => setShowFallback(true)}
                        className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:border-indigo-300 hover:text-indigo-500 transition-all group"
                    >
                        + Add Fallback UPI ID <span className="text-[8px] opacity-60 font-medium block mt-1">(Switches when primary limit is reached)</span>
                    </button>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex items-center justify-center text-amber-600 font-black text-xs">02</div>
                                <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Fallback UPI Account</h3>
                                {secondaryFull && <span className="bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black animate-pulse">LIMIT REACHED</span>}
                            </div>
                            <button onClick={() => { setShowFallback(false); setUpiId2(''); }} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Remove</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Fallback UPI ID *</label>
                                <input
                                    type="text"
                                    value={upiId2}
                                    onChange={(e) => setUpiId2(e.target.value)}
                                    placeholder="secondary@oksbi"
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-white dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/20 focus:border-amber-500 bg-white dark:bg-slate-800 font-bold text-sm dark:text-white transition-all shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                                <input
                                    type="text"
                                    value={upiName2}
                                    onChange={(e) => setUpiName2(e.target.value)}
                                    placeholder="Ashoka Dhaba (Secondary)"
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-white dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/20 focus:border-amber-500 bg-white dark:bg-slate-800 font-bold text-sm dark:text-white transition-all shadow-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Daily Limit (₹)</label>
                                <input
                                    type="number"
                                    value={upiLimit2}
                                    onChange={(e) => setUpiLimit2(Number(e.target.value))}
                                    className="w-full px-5 py-4 rounded-2xl border-2 border-white dark:border-slate-800 focus:outline-none focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-900/20 focus:border-amber-500 bg-white dark:bg-slate-800 font-bold text-sm dark:text-white transition-all shadow-sm"
                                />
                            </div>
                            
                            <div className="md:col-span-2 flex items-center gap-3 pt-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Today's Fallback Collection: <span className="text-slate-900 dark:text-white font-black">₹{upiReceivedToday2.toLocaleString()}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !upiId.trim()}
                className={`w-full h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl ${
                  saved
                    ? 'bg-emerald-500 text-white shadow-emerald-200/50'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200/50 dark:shadow-none disabled:opacity-50'
                }`}
              >
                {saving ? (
                  <><Loader2 size={20} className="animate-spin" /> Syncing Configurations...</>
                ) : saved ? (
                  <><CheckCircle size={20} /> Settings Optimized & Saved!</>
                ) : (
                  <><QrCode size={20} /> Update Payment Infrastructure</>
                )}
              </button>
            </div>

            {/* Preview Column */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20 rounded-[2.5rem] p-8 text-center space-y-6 border-2 border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Smart QR Preview</p>
                
                {upiId ? (
                  <>
                    <div className="bg-white p-6 rounded-[2rem] inline-block shadow-2xl border-[6px] border-indigo-500/10">
                      <QRCodeSVG
                        value={`upi://pay?pa=${primaryFull && upiId2 ? upiId2 : upiId}&pn=${encodeURIComponent((primaryFull && upiName2 ? upiName2 : upiName) || 'Restaurant')}&cu=INR&am=100`}
                        size={200}
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                            <div className={`w-2 h-2 rounded-full ${primaryFull ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                                {primaryFull && upiId2 ? 'FALLBACK ACTIVE' : 'PRIMARY ACTIVE'}
                            </p>
                        </div>
                        <p className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {primaryFull && upiId2 ? upiId2 : upiId}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                            {primaryFull && upiName2 ? upiName2 : upiName || 'Restaurant'}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center gap-3 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Dynamic Amount Injection Enabled
                    </div>
                  </>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 animate-pulse">
                      <QrCode size={40} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Waiting for UPI ID</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-900 dark:bg-white rounded-[2rem] p-6 text-white dark:text-slate-900">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-60">System Insights</h4>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold opacity-60">Daily Reset Time</p>
                        <p className="text-[10px] font-black">12:00 AM Midnight</p>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold opacity-60">Auto-Switch Buffer</p>
                        <p className="text-[10px] font-black text-emerald-400 dark:text-emerald-600">± ₹0.01 Real-time</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* How it works */}
      <Card className="p-8 border-none shadow-lg bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <h3 className="text-[11px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.3em] mb-6">How Customer's UPI payments Work</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Smartphone, title: 'Customer Scans', desc: 'Customer opens their phone menu and goes to Track Orders', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
            { icon: QrCode, title: 'QR with Bill Amount', desc: 'A real UPI QR code is shown with exact bill amount pre-filled', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30' },
            { icon: CheckCircle, title: 'Instant Settlement', desc: 'Order auto-marks as Settled & POS plays notification sound', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${step.bg}`}>
                <step.icon size={20} className={step.color} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1">Step {i + 1}: {step.title}</p>
                <p className="text-[10px] text-gray-500 dark:text-slate-400 font-medium leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
