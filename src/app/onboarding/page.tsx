'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Building2, BedDouble, Settings2, ArrowRight, ArrowLeft,
  Check, Plus, Trash2, Phone, MapPin, Hash, FileText,
  Globe, Loader2, ChevronRight, Utensils, Beer, Coffee,
  Bike, Crown, Sparkles, Shield, Info, X
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface RoomType {
  name: string;
  code: string;
  baseRate: number;
  maxOccupancy: number;
}

// ── Wizard steps config ────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'About You',    icon: User,       color: '#8b5cf6', desc: 'Your personal details' },
  { id: 2, label: 'Your Property', icon: Building2,  color: '#06b6d4', desc: 'Hotel / property info' },
  { id: 3, label: 'Room Types',   icon: BedDouble,  color: '#f43f5e', desc: 'Setup initial rooms' },
  { id: 4, label: 'Services',     icon: Settings2,  color: '#f59e0b', desc: 'Confirm your services' },
];

const inputCls =
  'w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 focus:ring-0 outline-none transition-colors';
const labelCls = 'block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5';

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((step, idx) => {
        const done = current > step.id;
        const active = current === step.id;
        const Icon = step.icon;
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  done
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : active
                    ? 'border-2 bg-white/5'
                    : 'border-white/15 bg-transparent'
                }`}
                style={active ? { borderColor: step.color, boxShadow: `0 0 16px ${step.color}40` } : {}}
              >
                {done ? (
                  <Check size={16} className="text-emerald-400" strokeWidth={3} />
                ) : (
                  <Icon size={16} className={active ? 'text-white' : 'text-slate-600'} />
                )}
              </div>
              <span
                className="text-[10px] font-bold mt-1.5 tracking-wide"
                style={{ color: active ? step.color : done ? '#10b981' : '#475569' }}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className="h-[2px] w-12 sm:w-16 mb-4 mx-1 rounded-full transition-all duration-500"
                style={{ backgroundColor: current > step.id ? '#10b981' : '#1e293b' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ServiceToggle({
  label, desc, icon: Icon, color, value, onChange,
}: {
  label: string; desc: string; icon: any; color: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left w-full ${
        value ? 'bg-white/5' : 'border-white/10 bg-transparent hover:border-white/20'
      }`}
      style={value ? { borderColor: color, boxShadow: `0 0 18px ${color}18` } : {}}
    >
      <span style={{ color: value ? color : '#64748b' }}><Icon size={20} /></span>
      <div className="flex-1">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-[11px] text-slate-400">{desc}</p>
      </div>
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
        style={value ? { backgroundColor: color, borderColor: color } : { borderColor: '#334155' }}
      >
        {value && <Check size={11} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Step 1 — Personal
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Owner');

  // Step 2 — Property
  const [propertyName, setPropertyName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [taxDetails, setTaxDetails] = useState('');

  // Step 3 — Room Types
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([
    { name: 'Deluxe Room', code: 'DELUXE', baseRate: 3500, maxOccupancy: 2 },
    { name: 'Suite Room',  code: 'SUITE',  baseRate: 8000, maxOccupancy: 4 },
  ]);

  // Step 4 — Services
  const [restaurantEnabled, setRestaurantEnabled] = useState(true);
  const [barEnabled, setBarEnabled] = useState(false);
  const [cafeEnabled, setCafeEnabled] = useState(false);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);

  useEffect(() => {
    // Pre-fill name from session
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setFullName(d.user?.fullName || '');
          setPhone(d.user?.phone || '');
        }
      })
      .catch(() => {});

    // Load logo
    fetch('/api/website/settings')
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.logoUrl) setLogoUrl(d.data.logoUrl); })
      .catch(() => {});
  }, []);

  // ── Step Validation ───────────────────────────────────────────────────────────
  const canNext = () => {
    if (step === 1) return fullName.trim().length >= 2 && phone.trim().length >= 6;
    if (step === 2) return propertyName.trim().length >= 1 && city.trim().length >= 1 && address.trim().length >= 1;
    if (step === 3) return true; // Skip allowed
    return true;
  };

  // ── Room Type Helpers ─────────────────────────────────────────────────────────
  const addRoomType = () => setRoomTypes(prev => [
    ...prev,
    { name: '', code: '', baseRate: 3000, maxOccupancy: 2 }
  ]);

  const updateRoomType = (idx: number, field: keyof RoomType, value: string | number) => {
    setRoomTypes(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  };

  const removeRoomType = (idx: number) => {
    setRoomTypes(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        personal: { fullName: fullName.trim(), phone: phone.trim(), designation },
        organization: {
          name: propertyName.trim(),
          businessType: 'HOTEL',
          businessPreferences: [
            restaurantEnabled ? 'RESTAURANT' : null,
            barEnabled ? 'BAR' : null,
            cafeEnabled ? 'CAFE' : null,
            deliveryEnabled ? 'DELIVERY' : null,
          ].filter(Boolean).join(','),
        },
        property: {
          name: propertyName.trim(),
          type: 'HOTEL',
          address: address.trim(),
          city: city.trim(),
          state: state.trim() || city.trim(),
          country: country.trim() || 'India',
          pinCode: pinCode.trim() || '000000',
          taxDetails: taxDetails.trim() || undefined,
        },
        // Send valid room types as "categories" placeholder
        // Room types will be created separately after property creation
        categories: [],
        products: [],
        tables: [],
      };

      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Setup failed. Please try again.');

      router.push('/hotel');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setSubmitting(false);
    }
  };

  const currentStepConfig = STEPS[step - 1];

  return (
    <div
      className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Background Glow */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-violet-600/8 blur-[160px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-cyan-600/8 blur-[160px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl my-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-11 w-auto object-contain mb-4 drop-shadow" />
          ) : (
            <div className="w-11 h-11 bg-gradient-to-tr from-violet-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20 mb-4">
              <span className="text-white font-black text-lg italic">GF</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome! Let's Set Up Your Hotel
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 max-w-md">
            Quick 4-step setup to get your property ready. Takes less than 2 minutes.
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator current={step} />

        {/* Card */}
        <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">

          {/* Step Header */}
          <div
            className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10"
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${currentStepConfig.color}20`, border: `1px solid ${currentStepConfig.color}40` }}
            >
              <currentStepConfig.icon size={20} style={{ color: currentStepConfig.color }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: currentStepConfig.color }}>
                Step {step} of {STEPS.length}
              </p>
              <h2 className="text-lg font-extrabold text-white leading-tight">{currentStepConfig.label}</h2>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
              <Shield size={16} className="text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto shrink-0 text-rose-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
          )}

          {/* ── Step 1: Personal ──────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full Name <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Phone Number <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Your Designation</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Owner', 'General Manager', 'Manager'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDesignation(d)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        designation === d
                          ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                          : 'border-white/10 text-slate-400 hover:border-white/25'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-start gap-3">
                <Info size={16} className="text-violet-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300">
                  This information will be shown on your hotel profile and receipts.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 2: Property ─────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Hotel / Property Name <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={propertyName}
                    onChange={e => setPropertyName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                    placeholder="e.g. Royal Crown Hotel & Resort"
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Full Address <span className="text-rose-400">*</span></label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
                  <textarea
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={2}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none resize-none"
                    placeholder="Street, Area, Landmark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>City <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Manali"
                  />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Himachal Pradesh"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>PIN / Postal Code</label>
                  <div className="relative">
                    <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={pinCode}
                      onChange={e => setPinCode(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-sm font-mono font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                      placeholder="175131"
                      maxLength={10}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Country</label>
                  <div className="relative">
                    <Globe size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                      placeholder="India"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>GST / Tax Number <span className="text-slate-500 font-normal normal-case tracking-normal">(Optional)</span></label>
                <div className="relative">
                  <FileText size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={taxDetails}
                    onChange={e => setTaxDetails(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-sm font-mono font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none uppercase"
                    placeholder="03AAAAA0000A1Z5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Room Types ────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info size={13} className="text-rose-400 shrink-0" />
                Add your initial room types. You can always add/edit more from the dashboard.
              </p>

              <div className="space-y-3">
                {roomTypes.map((rt, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                        <BedDouble size={13} /> Room Type {idx + 1}
                      </span>
                      {roomTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRoomType(idx)}
                          className="text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Room Type Name</label>
                        <input
                          type="text"
                          value={rt.name}
                          onChange={e => updateRoomType(idx, 'name', e.target.value)}
                          className={inputCls}
                          placeholder="e.g. Deluxe Room"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Short Code</label>
                        <input
                          type="text"
                          value={rt.code}
                          onChange={e => updateRoomType(idx, 'code', e.target.value.toUpperCase())}
                          className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-sm font-mono font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none uppercase"
                          placeholder="DELUXE"
                          maxLength={10}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Base Rate (₹/night)</label>
                        <input
                          type="number"
                          value={rt.baseRate}
                          onChange={e => updateRoomType(idx, 'baseRate', Number(e.target.value))}
                          className={inputCls}
                          placeholder="3500"
                          min={0}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Max Occupancy</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => updateRoomType(idx, 'maxOccupancy', n)}
                              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                rt.maxOccupancy === n
                                  ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                                  : 'border-white/10 text-slate-500 hover:border-white/25'
                              }`}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addRoomType}
                className="w-full py-3 border-2 border-dashed border-white/15 hover:border-rose-500/40 rounded-2xl text-sm text-slate-400 hover:text-white flex items-center justify-center gap-2 transition-all"
              >
                <Plus size={16} /> Add Another Room Type
              </button>

              <div className="p-3 bg-slate-800/50 border border-white/8 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
                <Info size={12} className="shrink-0" />
                Room types define pricing tiers. Actual rooms are added from the HMS dashboard.
              </div>
            </div>
          )}

          {/* ── Step 4: Services ─────────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-4">
                Confirm which services you want to enable for your property. These can be changed anytime.
              </p>

              <ServiceToggle label="Restaurant POS" desc="Table billing, KOT, dine-in orders" icon={Utensils} color="#f97316" value={restaurantEnabled} onChange={setRestaurantEnabled} />
              <ServiceToggle label="Bar POS" desc="Drinks, cocktails, bar billing" icon={Beer} color="#a855f7" value={barEnabled} onChange={setBarEnabled} />
              <ServiceToggle label="Café POS" desc="Coffee, snacks, café orders" icon={Coffee} color="#f59e0b" value={cafeEnabled} onChange={setCafeEnabled} />
              <ServiceToggle label="Delivery" desc="Online food / room delivery orders" icon={Bike} color="#22c55e" value={deliveryEnabled} onChange={setDeliveryEnabled} />

              <div className="mt-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
                <div className="flex items-center gap-2 text-violet-300 text-xs font-bold mb-1">
                  <Sparkles size={14} /> Everything is ready!
                </div>
                <p className="text-[11px] text-slate-400">
                  Clicking <strong className="text-white">Complete Setup</strong> will finalize your hotel configuration and take you to the dashboard.
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ────────────────────────────────────────── */}
          <div className={`flex mt-8 pt-5 border-t border-white/10 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setStep(s => s - 1); setError(null); }}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-white/15 text-slate-300 hover:bg-white/5 text-sm font-bold transition-all"
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}

            {step < 4 ? (
              <button
                type="button"
                disabled={!canNext()}
                onClick={() => { setStep(s => s + 1); setError(null); }}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${currentStepConfig.color}, ${currentStepConfig.color}99)`,
                  boxShadow: canNext() ? `0 4px 20px ${currentStepConfig.color}35` : 'none',
                }}
              >
                {step === 3 ? 'Continue' : 'Next Step'} <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 text-white text-sm font-bold transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Setting up...</>
                ) : (
                  <><Crown size={16} /> Complete Setup</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-600 mt-5">
          You can update all of this later from your hotel settings dashboard.
        </p>
      </div>

      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    </div>
  );
}
