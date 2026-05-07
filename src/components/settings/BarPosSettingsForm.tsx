'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Wine, QrCode } from 'lucide-react';

export const BarPosSettingsForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [barPosEnabled, setBarPosEnabled] = useState(false);
  const [showBarInQrMenu, setShowBarInQrMenu] = useState(true);

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(r => r.json())
      .then(data => {
        if (data.success) { 
          setProperty(data.data); 
          setBarPosEnabled(!!data.data.barPosEnabled); 
          setShowBarInQrMenu(data.data.showBarInQrMenu ?? true);
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
        body: JSON.stringify({ barPosEnabled, showBarInQrMenu }),
      });
      if (res.ok) alert(barPosEnabled ? '🍺 Bar POS Enabled! Staff can now access /bar-pos' : '🔴 Bar POS Disabled.');
    } catch { alert('Failed to save.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-amber-500 font-black uppercase tracking-widest">Loading Bar Settings...</div>;

  return (
    <div style={{ borderLeft: '6px solid #f97316', borderRadius: '1rem' }}>
      <Card className="p-8 overflow-hidden border-l-0">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-slate-700">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#3d1a00' }}>
            <Wine size={24} className="text-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Bar POS Module</h2>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">Enable or disable the Bar billing system for this property</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-6 rounded-2xl border-2 transition-all duration-300" style={{ background: barPosEnabled ? '#1a0f00' : '#f9fafb', borderColor: barPosEnabled ? '#f97316' : '#e5e7eb' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all" style={{ background: barPosEnabled ? '#f97316' : '#e5e7eb' }}>
                <Wine size={22} style={{ color: barPosEnabled ? 'white' : '#9ca3af' }} />
              </div>
              <div>
                <p className="font-black text-sm dark:text-white uppercase tracking-wider">Bar POS Access</p>
                <p className="text-[10px] font-bold tracking-widest mt-0.5" style={{ color: barPosEnabled ? '#f97316' : '#9ca3af' }}>
                  {barPosEnabled ? '🟢 ENABLED — Staff can access Bar POS' : '🔴 DISABLED — Bar POS is locked'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setBarPosEnabled(!barPosEnabled)}
              className="relative w-16 h-9 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none"
              style={{ background: barPosEnabled ? '#f97316' : '#d1d5db' }}
            >
              <div
                className="absolute top-1.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300"
                style={{ left: barPosEnabled ? '34px' : '6px' }}
              />
            </button>
          </div>

          {/* QR Menu Control */}
          <div className="flex items-center justify-between p-6 rounded-2xl border transition-all duration-300" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-200">
                <QrCode size={22} className="text-slate-500" />
              </div>
              <div>
                <p className="font-black text-sm text-slate-900 uppercase tracking-wider">Show Bar in QR Menu</p>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest mt-0.5">
                  {showBarInQrMenu ? '🟢 CUSTOMERS CAN SEE BAR ITEMS' : '🔴 BAR ITEMS ARE HIDDEN FROM CUSTOMERS'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBarInQrMenu(!showBarInQrMenu)}
              className={`relative w-16 h-9 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none ${showBarInQrMenu ? 'bg-indigo-600' : 'bg-slate-300'}`}
            >
              <div
                className={`absolute top-1.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${showBarInQrMenu ? 'left-[34px]' : 'left-[6px]'}`}
              />
            </button>
          </div>

          {/* Info Box */}
          <div className="p-5 rounded-2xl space-y-3" style={{ background: barPosEnabled ? '#1a0f00' : '#f9fafb', border: `1px solid ${barPosEnabled ? '#3d1f00' : '#e5e7eb'}` }}>
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: barPosEnabled ? '#f97316' : '#6b7280' }}>What this setting controls:</p>
            <div className="space-y-2 text-[11px] font-bold" style={{ color: barPosEnabled ? '#fed7aa' : '#9ca3af' }}>
              <p>✅ <span className="font-black">When ON:</span> Staff can access <code className="px-1 py-0.5 rounded text-[10px]" style={{ background: '#2a1500', color: '#f97316' }}>/bar-pos</code>, sidebar link is visible, Bar categories & inventory tracked separately</p>
              <p>🔴 <span className="font-black">When OFF:</span> Bar POS shows a locked screen, sidebar link hidden, restaurant POS unaffected</p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            style={{ background: barPosEnabled ? '#f97316' : '#1f2937', color: 'white' }}
          >
            <Wine size={20} />
            {saving ? 'SAVING...' : barPosEnabled ? 'SAVE — ENABLE BAR POS' : 'SAVE — KEEP BAR POS DISABLED'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
