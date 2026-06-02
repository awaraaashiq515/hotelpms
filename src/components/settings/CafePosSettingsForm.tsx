'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Coffee, QrCode } from 'lucide-react';

export const CafePosSettingsForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [cafePosEnabled, setCafePosEnabled] = useState(false);
  const [showCafeInQrMenu, setShowCafeInQrMenu] = useState(true);

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(r => r.json())
      .then(data => {
        if (data.success) { 
          setProperty(data.data); 
          setCafePosEnabled(!!data.data.cafePosEnabled); 
          setShowCafeInQrMenu(data.data.showCafeInQrMenu ?? true);
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
        body: JSON.stringify({ cafePosEnabled, showCafeInQrMenu }),
      });
      if (res.ok) alert(cafePosEnabled ? '☕ Cafe POS Enabled! Staff can now access /cafe-pos' : '🔴 Cafe POS Disabled.');
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <Card className="p-12 border-l-[6px] border-l-[#D2691E] flex flex-col items-center justify-center min-h-[300px]">
        <Coffee className="text-[#D2691E] animate-bounce mb-4" size={32} />
        <div className="text-[10px] text-gray-400 dark:text-slate-400 font-black uppercase tracking-widest animate-pulse">
          Loading Cafe Settings...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 lg:p-6 border-l-[6px] border-l-[#D2691E] dark:bg-slate-900 dark:border-slate-800 relative overflow-hidden transition-all duration-300">
      {/* Absolute Decorative Glow */}
      <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-[#D2691E]/5 blur-3xl pointer-events-none" />
      
      <div className="relative space-y-5">
         {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#D2691E]/10 dark:bg-[#D2691E]/20 text-[#D2691E] dark:text-amber-400 flex-shrink-0">
            <Coffee size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
              Cafe POS Module
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase mt-1 tracking-tight leading-normal">
              Enable or disable the Cafe billing system for this property
            </p>
          </div>
        </div>

        {/* Toggles Container */}
        <div className="grid grid-cols-1 gap-4">
          {/* Main Toggle Card */}
          <div 
            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              cafePosEnabled 
                ? 'border-amber-500/20 bg-amber-500/[0.02] dark:border-[#D2691E]/20 dark:bg-[#D2691E]/5' 
                : 'border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-800/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  cafePosEnabled 
                    ? 'bg-[#D2691E]/10 text-[#D2691E] dark:bg-[#D2691E]/20 dark:text-amber-400' 
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                }`}
              >
                <Coffee size={18} />
              </div>
              <div>
                <p className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wide">
                  Cafe POS Access
                </p>
                <p 
                  className={`text-[9px] font-bold tracking-wider mt-0.5 uppercase ${
                    cafePosEnabled ? 'text-[#D2691E] dark:text-amber-400' : 'text-gray-400 dark:text-slate-500'
                  }`}
                >
                  {cafePosEnabled ? '🟢 ENABLED — Staff can access Cafe POS' : '🔴 DISABLED — Cafe POS is locked'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setCafePosEnabled(!cafePosEnabled)}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none ${
                cafePosEnabled ? 'bg-[#D2691E]' : 'bg-gray-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
                  cafePosEnabled ? 'left-[23px]' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* QR Menu Control Card */}
          <div 
            className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
              showCafeInQrMenu 
                ? 'border-indigo-500/10 bg-indigo-500/[0.01] dark:border-indigo-500/20 dark:bg-indigo-950/5' 
                : 'border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-800/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  showCafeInQrMenu 
                    ? 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400' 
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                }`}
              >
                <QrCode size={18} />
              </div>
              <div>
                <p className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wide">
                  Show Cafe in QR Menu
                </p>
                <p 
                  className={`text-[9px] font-bold tracking-wider mt-0.5 uppercase ${
                    showCafeInQrMenu ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'
                  }`}
                >
                  {showCafeInQrMenu ? '🟢 CUSTOMERS CAN SEE CAFE ITEMS' : '🔴 CAFE ITEMS ARE HIDDEN FROM CUSTOMERS'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCafeInQrMenu(!showCafeInQrMenu)}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none ${
                showCafeInQrMenu ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
                  showCafeInQrMenu ? 'left-[23px]' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div 
          className={`p-4 rounded-xl border transition-colors duration-300 ${
            cafePosEnabled 
              ? 'border-amber-500/10 bg-amber-500/[0.01] dark:border-[#D2691E]/10 dark:bg-[#D2691E]/5' 
              : 'border-gray-100 dark:border-slate-800 bg-gray-50/20 dark:bg-slate-900/40'
          }`}
        >
          <p 
            className={`text-[9px] font-black uppercase tracking-widest ${
              cafePosEnabled ? 'text-[#D2691E] dark:text-amber-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            What this setting controls:
          </p>
          <div 
            className={`mt-2 space-y-1.5 text-[9px] font-bold uppercase tracking-tight ${
              cafePosEnabled ? 'text-gray-600 dark:text-slate-300' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <div className="flex items-start gap-1.5">
              <span className="text-emerald-500 flex-shrink-0">✓</span>
              <span>
                When ON: Staff can access{' '}
                <code 
                  className={`px-1 py-0.5 rounded text-[8px] font-mono lowercase ${
                    cafePosEnabled 
                      ? 'bg-amber-100 dark:bg-amber-950/40 text-[#D2691E] dark:text-amber-300' 
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                  }`}
                >
                  /cafe-pos
                </code>
                , sidebar link is active, Cafe inventory and billing are tracked separately.
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-rose-500 flex-shrink-0">✕</span>
              <span>
                When OFF: Cafe POS is locked, sidebar link is hidden, and main restaurant POS is unaffected.
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md ${
            cafePosEnabled 
              ? 'bg-[#D2691E] hover:bg-[#B25916] text-white shadow-[#D2691E]/10' 
              : 'bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
          }`}
        >
          <Coffee size={16} />
          {saving ? 'SAVING...' : cafePosEnabled ? 'SAVE — ENABLE CAFE POS' : 'SAVE — KEEP CAFE POS DISABLED'}
        </Button>
      </div>
    </Card>
  );
};
