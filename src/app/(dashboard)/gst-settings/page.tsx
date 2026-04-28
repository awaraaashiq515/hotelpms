'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Save, Building2, Hash, MapPin, FileText,
  CheckCircle, AlertCircle, Loader2, Info
} from 'lucide-react';

const STATE_CODES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
];

const HSN_PRESETS = [
  { label: 'Restaurant (AC) — 5% GST', hsn: '996331', rate: 5 },
  { label: 'Restaurant (Non-AC) — 5% GST', hsn: '996331', rate: 5 },
  { label: 'Bakery / Sweets — 5% GST', hsn: '1905', rate: 5 },
  { label: 'Packaged Food — 12% GST', hsn: '2106', rate: 12 },
  { label: 'Soft Drinks / Juice — 12% GST', hsn: '2202', rate: 12 },
  { label: 'Alcohol (Beer/Wine) — 18% GST', hsn: '2203', rate: 18 },
  { label: 'Catering Services — 18% GST', hsn: '996334', rate: 18 },
];

export default function GstSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [gstin, setGstin] = useState('');
  const [legalName, setLegalName] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [defaultHsn, setDefaultHsn] = useState('996331');
  const [defaultRate, setDefaultRate] = useState('5');

  useEffect(() => {
    fetch('/api/gst/settings')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setGstin(d.data.gstin || '');
          setLegalName(d.data.legalName || '');
          setStateCode(d.data.stateCode || '');
          const hsn = d.data.hsnDefaults || {};
          setDefaultHsn(hsn.code || '996331');
          setDefaultRate(hsn.rate?.toString() || '5');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const validateGstin = (g: string) => {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(g);
  };

  const handleSave = async () => {
    if (gstin && !validateGstin(gstin)) {
      showToast('error', 'Invalid GSTIN format. Example: 27AAACR5055K1Z5');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/gst/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gstin,
          legalName,
          stateCode,
          hsnDefaults: { code: defaultHsn, rate: parseFloat(defaultRate) }
        })
      });
      const d = await res.json();
      if (d.success) {
        showToast('success', 'GST settings saved successfully!');
      } else {
        showToast('error', 'Failed to save settings. Please try again.');
      }
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: { hsn: string; rate: number }) => {
    setDefaultHsn(preset.hsn);
    setDefaultRate(preset.rate.toString());
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="animate-spin text-pos-primary" size={32} />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm animate-in slide-in-from-top-3 ${
          toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <PageHeader
        title="GST Configuration"
        description="Configure your GSTIN, state code and HSN defaults for GST filing."
      />

      {/* ── Business Info ─────────────────────────────────────────────── */}
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-orange-50 p-3 rounded-xl">
            <Building2 className="text-orange-500" size={22} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Business GST Details</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">Information registered on the GSTN portal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* GSTIN */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              GSTIN Number *
            </label>
            <div className="relative">
              <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="gstin-input"
                type="text"
                maxLength={15}
                placeholder="27AAACR5055K1Z5"
                value={gstin}
                onChange={e => setGstin(e.target.value.toUpperCase())}
                className={`w-full pl-8 pr-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary transition-all ${
                  gstin && !validateGstin(gstin)
                    ? 'border-red-300 bg-red-50 dark:bg-red-950/20'
                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 dark:text-slate-100'
                }`}
              />
            </div>
            {gstin && !validateGstin(gstin) && (
              <p className="mt-1 text-[10px] text-red-500 font-bold uppercase tracking-tight">
                ⚠ Invalid format — must be 15 characters
              </p>
            )}
            {gstin && validateGstin(gstin) && (
              <p className="mt-1 text-[10px] text-emerald-500 font-bold uppercase tracking-tight">
                ✓ Valid GSTIN format
              </p>
            )}
          </div>

          {/* Legal Name */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Legal Business Name
            </label>
            <input
              id="legal-name-input"
              type="text"
              placeholder="Registered business name"
              value={legalName}
              onChange={e => setLegalName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100"
            />
          </div>

          {/* State Code */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              State / UT Code *
            </label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
              <select
                id="state-code-select"
                value={stateCode}
                onChange={e => setStateCode(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary appearance-none dark:text-slate-100"
              >
                <option value="">-- Select State --</option>
                {STATE_CODES.map((s: any) => (
                  <option key={s.code} value={s.code}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-5 flex items-start gap-3 bg-pos-primary/10 rounded-xl p-4">
          <Info size={16} className="text-pos-primary shrink-0 mt-0.5" />
          <p className="text-[11px] text-pos-primary/80 font-bold uppercase tracking-tight leading-relaxed">
            Your GSTIN is printed on your GST registration certificate. The state code is the first 2 digits of your GSTIN.
            Maharashtra = 27, Delhi = 07, Karnataka = 29.
          </p>
        </div>
      </Card>

      {/* ── HSN Defaults ─────────────────────────────────────────────── */}
      <Card className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-purple-50 p-3 rounded-xl">
            <FileText className="text-purple-500" size={22} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Default HSN / SAC Code</h2>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tight">
              This default HSN code will be used when a product has no HSN assigned
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Quick Presets</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6">
          {HSN_PRESETS.map((p, i) => (
            <button
              key={i}
              id={`hsn-preset-${i}`}
              onClick={() => applyPreset(p)}
              className={`text-left px-4 py-3 rounded-xl border text-[11px] font-bold uppercase tracking-tight transition-all ${
                defaultHsn === p.hsn && defaultRate === p.rate.toString()
                  ? 'border-pos-primary bg-pos-primary/5 text-pos-primary'
                  : 'border-gray-200 dark:border-slate-800 hover:border-pos-primary/40 text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="font-mono text-xs mr-2">{p.hsn}</span>
              {p.label}
            </button>
          ))}
        </div>

        {/* Manual Input */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Default HSN/SAC Code
            </label>
            <input
              id="default-hsn-input"
              type="text"
              value={defaultHsn}
              onChange={e => setDefaultHsn(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100"
              placeholder="996331"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
              Default Tax Rate (%)
            </label>
            <select
              id="default-rate-select"
              value={defaultRate}
              onChange={e => setDefaultRate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary dark:text-slate-100"
            >
              <option value="0">0% (Exempt)</option>
              <option value="5">5% (Restaurant)</option>
              <option value="12">12%</option>
              <option value="18">18%</option>
              <option value="28">28%</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <Button
        id="save-gst-settings-btn"
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-pos-primary hover:bg-red-700 text-white font-black tracking-widest py-4 rounded-xl shadow-lg shadow-red-100 flex items-center justify-center gap-2"
      >
        {saving ? (
          <><Loader2 size={18} className="animate-spin" /> SAVING...</>
        ) : (
          <><Save size={18} /> SAVE GST CONFIGURATION</>
        )}
      </Button>
    </div>
  );
}
