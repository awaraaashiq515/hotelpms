'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, Shield,
  User, Building2, RefreshCcw, Store, Truck, Package,
  CheckCircle2, Sparkles, Zap, Star, Crown, Copy, Smartphone,
  Landmark, Clock, BadgeCheck, Hotel
} from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { APIError } from '@/lib/api/client';
import { MapPicker } from '@/components/menu/MapPicker';

// ─── Constants ────────────────────────────────────────────────────────────────
const ROLES = [
  { id: 'RESTAURANTS_ADMIN', label: 'Restaurant / Hotel Owner', icon: Store,  desc: 'Manage your restaurant or hotel' },
  { id: 'B2B_SUPPLIER',      label: 'B2B Supplier',     icon: Package, desc: 'Supply to businesses' },
];

const PLAN_ICONS: Record<string, React.ElementType> = {
  free: Sparkles, starter: Zap, pro: Star, enterprise: Crown, default: Package,
};
function getPlanIcon(name = '') {
  const lower = name.toLowerCase();
  for (const key of Object.keys(PLAN_ICONS)) {
    if (lower.includes(key)) return PLAN_ICONS[key];
  }
  return PLAN_ICONS.default;
}

// ─── Step indicator ────────────────────────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Account' },
  { n: 2, label: 'Plan' },
  { n: 3, label: 'Payment' },
  { n: 4, label: 'Branch & POS' },
  { n: 5, label: 'Done' },
];

function getStepsList(roleName: string, isPaidPlan: boolean) {
  if (roleName === 'DELIVERY_RIDER') {
    return [
      { n: 1, label: 'Account' },
      { n: 2, label: 'Vehicle & Zone' },
      { n: 3, label: 'Done' },
    ];
  }
  if (roleName === 'B2B_SUPPLIER') {
    return [
      { n: 1, label: 'Account' },
      { n: 2, label: 'Business Details' },
      { n: 3, label: 'Done' },
    ];
  }
  // RESTAURANTS_ADMIN and HOTEL_ADMIN share the same multi-step flow
  if (isPaidPlan) {
    return [
      { n: 1, label: 'Account' },
      { n: 2, label: 'Plan' },
      { n: 3, label: 'Payment' },
      { n: 4, label: 'Branch & POS' },
      { n: 5, label: 'Done' },
    ];
  } else {
    return [
      { n: 1, label: 'Account' },
      { n: 2, label: 'Plan' },
      { n: 3, label: 'Branch & POS' },
      { n: 4, label: 'Done' },
    ];
  }
}

function StepBar({ current, roleName, isPaidPlan }: { current: number; roleName: string; isPaidPlan: boolean }) {
  const steps = getStepsList(roleName, isPaidPlan);
  return (
    <div className="flex items-center gap-2 mt-6 justify-center">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-1.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
              current > s.n ? 'bg-emerald-500 text-white' :
              current === s.n ? 'bg-rose-600 text-white ring-4 ring-rose-600/20' :
              'bg-white/10 text-white/40'
            }`}>
              {current > s.n ? '✓' : s.n}
            </div>
            <span className={`text-xs font-semibold hidden sm:block transition-colors ${current === s.n ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-px max-w-[40px] ${current > s.n ? 'bg-emerald-500/40' : 'bg-white/10'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const doCopy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" onClick={doCopy}
      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all shrink-0"
      title="Copy">
      {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
    </button>
  );
}

// ─── Shared UI components (outside SignupForm to prevent re-renders losing focus) ──
function Logo({ logoUrl }: { logoUrl: string | null }) {
  return logoUrl ? (
    <img src={logoUrl} alt="Logo" className="max-h-12 w-auto object-contain drop-shadow-2xl" />
  ) : (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-600/30">
        <span className="text-white font-black text-xl italic">O</span>
      </div>
      <span className="text-white font-black text-2xl tracking-tighter uppercase">OrderMint</span>
    </div>
  );
}

function BgShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-8" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="absolute inset-0 overflow-hidden z-0 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-rose-900/30 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-violet-900/30 via-transparent to-transparent" />
      </div>
      <div className="relative z-10 w-full">{children}</div>
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>
    </div>
  );
}

// ─── Main Form ─────────────────────────────────────────────────────────────────
function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPackageId = searchParams.get('packageId');

  // totalSteps depends on role & plan choice (computed later)
  const [step, setStep] = useState(1);

  // ── Account state
  const [fullName, setFullName]         = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [businessName, setBusinessName] = useState('');
  const [captchaText, setCaptchaText]   = useState('');
  const [roleName, setRoleName]         = useState('RESTAURANTS_ADMIN');
  const [captchaSvg, setCaptchaSvg]     = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [logoUrl, setLogoUrl]           = useState<string | null>(null);
  const [hotelEnabled, setHotelEnabled] = useState(false);

  // ── Delivery Rider / B2B Supplier state
  const [phone, setPhone]                       = useState('');
  const [vehicleType, setVehicleType]           = useState('BIKE');
  const [vehicleNumber, setVehicleNumber]       = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryLat, setDeliveryLat]           = useState<number | null>(null);
  const [deliveryLng, setDeliveryLng]           = useState<number | null>(null);
  const [deliveryRadius, setDeliveryRadius]     = useState<number>(5.0);
  const [gstNumber, setGstNumber]               = useState('');
  const [category, setCategory]                 = useState('Vegetables');
  const [address, setAddress]                   = useState('');

  // ── Package state
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(preselectedPackageId);
  const [selectedPackage, setSelectedPackage]     = useState<any | null>(null);
  const [packages, setPackages]                   = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading]     = useState(false);

  // ── POS selection toggles
  const [restaurantPosEnabled, setRestaurantPosEnabled] = useState(true);
  const [barPosEnabled, setBarPosEnabled]               = useState(false);
  const [cafePosEnabled, setCafePosEnabled]             = useState(false);
  const [deliveryEnabled, setDeliveryEnabled]           = useState(false);

  useEffect(() => {
    if (selectedPackage) {
      const featureKeys = selectedPackage.features.map((f: any) => f.feature);
      setRestaurantPosEnabled(featureKeys.includes('POS'));
      setBarPosEnabled(featureKeys.includes('BARPOS'));
      setCafePosEnabled(featureKeys.includes('CAFEPOS'));
      setDeliveryEnabled(featureKeys.includes('DRIVERS'));
    } else {
      setRestaurantPosEnabled(true);
      setBarPosEnabled(false);
      setCafePosEnabled(false);
      setDeliveryEnabled(false);
    }
  }, [selectedPackage]);

  // ── Payment state
  const [billingSettings, setBillingSettings]     = useState<any | null>(null);
  const [paymentRef, setPaymentRef]               = useState('');
  const [paymentAmount, setPaymentAmount]         = useState('');

  // ── Branch & POS Operator state
  const [branchName, setBranchName]       = useState('');
  const [branchCode, setBranchCode]       = useState('');
  const [branchCity, setBranchCity]       = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  const [branchPhone, setBranchPhone]     = useState('');
  const [posFullName, setPosFullName]     = useState('');
  const [posEmail, setPosEmail]           = useState('');
  const [posPassword, setPosPassword]     = useState('');

  // ── Business Type (selected on Branch & POS step)
  const [businessType, setBusinessType]   = useState<'RESTAURANT' | 'HOTEL'>('RESTAURANT');

  // ── Global UI state
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Whether selected plan requires payment
  const isPaidPlan = !!selectedPackage && (selectedPackage.priceINR > 0 || selectedPackage.priceUSD > 0);

  // Dynamic steps calculation
  const stepsList = getStepsList(roleName, isPaidPlan);
  const currentStep = stepsList[step - 1];
  const currentStepLabel = currentStep?.label || 'Account';

  // Branch Code Generator
  const generateBranchCode = (name: string) => {
    const base = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6);
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${base || 'BR'}-${rand}`;
  };

  useEffect(() => {
    fetch('/api/website/settings')
      .then(r => r.json())
      .then(j => { 
        if (j.success) {
          if (j.data.logoUrl) setLogoUrl(j.data.logoUrl);
          if (typeof j.data.hotelEnabled === 'boolean') setHotelEnabled(j.data.hotelEnabled);
        }
      })
      .catch(() => {});
    refreshCaptcha();
  }, []);

  // ── Pre-select package from URL ──────────────────────────────────────────────
  useEffect(() => {
    if (preselectedPackageId && packages.length > 0) {
      const pkg = packages.find(p => p.id === preselectedPackageId);
      if (pkg) { setSelectedPackageId(pkg.id); setSelectedPackage(pkg); }
    }
  }, [packages, preselectedPackageId]);

  // ── Fetch packages when reaching step 2 ─────────────────────────────────────
  const fetchPackages = async () => {
    if (packages.length > 0) return;
    setPackagesLoading(true);
    try {
      const res = await fetch('/api/website/packages');
      const data = await res.json();
      if (data.success) setPackages(data.data || []);
    } catch { /* silent */ } finally { setPackagesLoading(false); }
  };

  // ── Fetch billing settings when reaching payment step ───────────────────────
  const fetchBillingSettings = async () => {
    if (billingSettings) return;
    try {
      const res = await fetch('/api/public/billing-settings');
      const data = await res.json();
      if (data.success) setBillingSettings(data.data);
    } catch { /* silent */ }
  };

  const refreshCaptcha = async () => {
    setCaptchaText('');
    setCaptchaSvg(null);
    setCaptchaToken(null);
    try {
      const res = await fetch(`/api/auth/captcha?json=true&t=${Date.now()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setCaptchaSvg(json.svg);
          setCaptchaToken(json.token);
        }
      }
    } catch (e) {
      console.error('Failed to load captcha', e);
    }
  };

  // ── Step 1 submit ─────────────────────────────────────────────────────────────
  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (roleName === 'RESTAURANTS_ADMIN' || roleName === 'HOTEL_ADMIN') {
      fetchPackages();
      setStep(2);
    } else if (roleName === 'DELIVERY_RIDER' || roleName === 'B2B_SUPPLIER') {
      setStep(2);
    }
  };

  // ── Step 2 (plan) submit ──────────────────────────────────────────────────────
  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    // Prefill branch details if not already done
    if (!branchName) {
      setBranchName(businessName ? `${businessName.trim()} Main` : `${fullName.trim()}'s Main Branch`);
    }
    if (!branchCode) {
      setBranchCode(generateBranchCode(businessName || fullName));
    }
    if (!posFullName) {
      setPosFullName(`${fullName.trim()}'s Operator`);
    }
    // NOTE: posEmail is intentionally NOT auto-filled to avoid unique constraint conflicts
    
    if (isPaidPlan) {
      fetchBillingSettings();
      setStep(3);
    } else {
      setStep(3); // Free plan step 3 is Branch & POS Setup!
    }
  };

  // ── Step 3 (payment) submit ───────────────────────────────────────────────────
  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!paymentRef.trim()) {
      setError('Please enter your transaction / UPI reference number.');
      return;
    }
    // Prefill branch details if not already done
    if (!branchName) {
      setBranchName(businessName ? `${businessName.trim()} Main` : `${fullName.trim()}'s Main Branch`);
    }
    if (!branchCode) {
      setBranchCode(generateBranchCode(businessName || fullName));
    }
    if (!posFullName) {
      setPosFullName(`${fullName.trim()}'s Operator`);
    }
    // NOTE: posEmail is intentionally NOT auto-filled to avoid unique constraint conflicts
    setStep(4); // Paid plan goes to Branch & POS
  };

  // ── Core registration call ────────────────────────────────────────────────────
  const doRegister = async (branchDetails?: {
    branchName?: string | null;
    branchCode?: string | null;
    branchCity?: string | null;
    branchAddress?: string | null;
    branchPhone?: string | null;
    posFullName?: string | null;
    posEmail?: string | null;
    posPassword?: string | null;
  }) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register({
        fullName,
        email,
        password,
        businessName: businessName || null,
        captchaText,
        captchaToken,
        roleName,
        packageId: selectedPackageId,
        paymentReference: paymentRef.trim() || null,
        paymentAmount: paymentAmount ? parseFloat(paymentAmount) : (selectedPackage?.priceINR ?? null),
        phone: phone || null,
        vehicleType: vehicleType || null,
        vehicleNumber: vehicleNumber || null,
        deliveryLocation: deliveryLocation || null,
        deliveryLat: deliveryLat || null,
        deliveryLng: deliveryLng || null,
        deliveryRadius: deliveryRadius || null,
        gstNumber: gstNumber || null,
        category: category || null,
        address: address || null,
        restaurantPosEnabled,
        barPosEnabled,
        cafePosEnabled,
        deliveryEnabled,
        ...branchDetails,
      });
      const steps = getStepsList(roleName, isPaidPlan);
      setStep(steps.length); // The Done step
    } catch (err) {
      const msg = err instanceof APIError ? err.message
        : err instanceof Error ? err.message
        : 'An unexpected error occurred.';
      setError(msg);
      setLoading(false);
      refreshCaptcha();
      setStep(1); // Send back to step 1 on error so they can fix captcha/input details
    }
  };

  // Logo and BgShell have been moved outside the component definition to prevent
  // recreation on keystrokes, which was causing the inputs to lose focus.

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — Account Details
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 1) return (
    <BgShell>
      <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(225,29,72,0.15)] border border-white/20 backdrop-blur-xl bg-white/10">
        {/* Brand side */}
        <div className="w-full md:w-[42%] p-10 flex flex-col justify-between bg-gradient-to-br from-white/10 to-black/20 border-r border-white/10">
          <div>
            <div className="mb-10"><Logo logoUrl={logoUrl} /></div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4 tracking-tight">
              Start your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-violet-400">journey here.</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-xs">
              Join the ecosystem that empowers restaurants, hotels, suppliers, and riders with cutting-edge tools.
            </p>
          </div>
          <div className="mt-10 space-y-3">
            {stepsList.map(s => (
              <div key={s.n} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                  step > s.n ? 'bg-emerald-500 text-white' :
                  step === s.n ? 'bg-rose-600 text-white ring-4 ring-rose-600/20' :
                  'bg-white/10 text-white/40'
                }`}>{step > s.n ? '✓' : s.n}</div>
                <span className={`text-sm font-semibold ${step === s.n ? 'text-white' : 'text-white/40'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="w-full md:w-[58%] bg-white p-8 sm:p-12 overflow-y-auto max-h-[90vh]">
          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Create Account</h2>
            <p className="text-slate-400 text-sm">Step 1 — Tell us about yourself.</p>
          </div>

          {error && (
            <div className="mb-5 p-4 rounded-xl bg-rose-50 border border-rose-100 flex gap-3 text-rose-700 text-sm font-medium">
              <Shield size={17} className="text-rose-500 shrink-0 mt-0.5" />{error}
            </div>
          )}

          <form onSubmit={handleStep1} className="space-y-5">
            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">I am signing up as a:</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => (
                  <div key={r.id} onClick={() => setRoleName(r.id)}
                    className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center text-center transition-all ${
                      roleName === r.id ? 'border-rose-600 bg-rose-50' : 'border-slate-100 hover:border-rose-200 hover:bg-slate-50'
                    }`}>
                    <r.icon size={20} className={`mb-1.5 ${roleName === r.id ? 'text-rose-600' : 'text-slate-400'}`} />
                    <span className={`text-[11px] font-bold leading-tight ${roleName === r.id ? 'text-rose-700' : 'text-slate-600'}`}>{r.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id:'fullName', label:'Full Name', type:'text', val:fullName, set:setFullName, icon:User, placeholder:'John Doe' },
                { id:'email', label:'Email Address', type:'email', val:email, set:setEmail, icon:Mail, placeholder:'name@example.com' },
              ].map(f => (
                <div key={f.id}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">{f.label}</label>
                  <div className="relative">
                    <f.icon size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField===f.id?'text-rose-600':'text-slate-400'}`} />
                    <input type={f.type} required value={f.val} onChange={e=>f.set(e.target.value)}
                      onFocus={()=>setFocusedField(f.id)} onBlur={()=>setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all"
                      placeholder={f.placeholder} />
                  </div>
                </div>
              ))}
            </div>

            {(roleName === 'RESTAURANTS_ADMIN' || roleName === 'B2B_SUPPLIER') && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Business Name <span className="text-slate-300 normal-case font-normal">(Optional)</span></label>
                <div className="relative">
                  <Building2 size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField==='business'?'text-rose-600':'text-slate-400'}`} />
                  <input type="text" value={businessName} onChange={e=>setBusinessName(e.target.value)}
                    onFocus={()=>setFocusedField('business')} onBlur={()=>setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all"
                    placeholder="e.g. Spice Garden" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <div className="relative">
                <Lock size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField==='password'?'text-rose-600':'text-slate-400'}`} />
                <input type={showPassword?'text':'password'} required value={password} onChange={e=>setPassword(e.target.value)}
                  onFocus={()=>setFocusedField('password')} onBlur={()=>setFocusedField(null)} minLength={6}
                  className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all"
                  placeholder="Min. 6 characters" />
                <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>

            {/* Captcha */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
              <div className="h-11 w-28 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm shrink-0">
                {captchaSvg ? (
                  <div dangerouslySetInnerHTML={{ __html: captchaSvg }} className="w-full h-full flex items-center justify-center" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button type="button" onClick={refreshCaptcha} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0">
                <RefreshCcw size={15} />
              </button>
              <input type="text" required placeholder="Enter code" value={captchaText} onChange={e=>setCaptchaText(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none" />
            </div>

            <button type="submit" disabled={!captchaText || loading}
              className="w-full py-4 bg-slate-900 hover:bg-rose-600 text-white rounded-xl font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 group">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <>{roleName === 'RESTAURANTS_ADMIN' ? 'Continue to Plan Selection' : roleName === 'HOTEL_ADMIN' ? 'Continue to Plan Selection' : 'Create Account'} <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/></>
              }
            </button>
            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <button type="button" onClick={()=>router.push('/login')} className="font-bold text-slate-900 hover:text-rose-600 transition-colors">Sign in</button>
            </p>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">Riders / Drivers</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              type="button"
              onClick={() => router.push('/driver-portal?signup=true')}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              Register as a Delivery Rider
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-slate-400 group-hover:text-slate-600" />
            </button>
          </form>
        </div>
      </div>
    </BgShell>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — Plan Selection
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStepLabel === 'Plan') return (
    <BgShell>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5"><Logo logoUrl={logoUrl} /></div>
          <h2 className="text-4xl font-black text-white mb-2">Choose Your Plan</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">Pick a subscription that fits your business. You can upgrade anytime.</p>
          <StepBar current={step} roleName={roleName} isPaidPlan={isPaidPlan} />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3 text-rose-300 text-sm font-medium max-w-xl mx-auto">
            <Shield size={15} className="shrink-0 mt-0.5" />{error}
          </div>
        )}

        <form onSubmit={handleStep2}>
          {packagesLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-rose-600/30 border-t-rose-600 rounded-full animate-spin"/>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {packages.map(pkg => {
                const isSelected = selectedPackageId === pkg.id;
                const isFree = pkg.priceINR === 0 && pkg.priceUSD === 0;
                const PlanIcon = getPlanIcon(pkg.name);
                return (
                  <div key={pkg.id} onClick={() => { setSelectedPackageId(isSelected?null:pkg.id); setSelectedPackage(isSelected?null:pkg); }}
                    className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 ${
                      isSelected
                        ? 'border-rose-500 bg-white/[0.08] shadow-[0_0_30px_rgba(244,63,94,0.2)]'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.07]'
                    }`}>
                    {pkg.name?.toLowerCase().includes('pro') && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Most Popular</div>
                    )}
                    {isSelected && <div className="absolute top-4 right-4"><CheckCircle2 size={18} className="text-rose-400"/></div>}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${isSelected?'bg-rose-500/20':'bg-white/10'}`}>
                      <PlanIcon size={20} className={isSelected?'text-rose-400':'text-white/50'}/>
                    </div>
                    <h3 className="text-base font-black text-white mb-1">{pkg.name}</h3>
                    <div className="mb-3">
                      {isFree
                        ? <span className="text-2xl font-black text-emerald-400">Free Trial</span>
                        : <><span className="text-2xl font-black text-white">₹{pkg.priceINR?.toLocaleString()}</span><span className="text-slate-400 text-xs ml-1">/ year</span></>
                      }
                    </div>
                    {pkg.description && <p className="text-slate-400 text-xs leading-relaxed mb-3">{pkg.description}</p>}
                    
                    <div className="space-y-1.5 mb-4 border-t border-b border-white/5 py-3 text-[11px] font-bold tracking-wide">
                      <div className="flex items-center gap-2 text-rose-400">
                        <Smartphone size={13} className="shrink-0" />
                        <span>POS Limit: {pkg.allowedPosCount ?? 1} Terminal{(pkg.allowedPosCount ?? 1) !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-violet-400">
                        <Building2 size={13} className="shrink-0" />
                        <span>Property Limit: {pkg.allowedPropertyCount ?? 1} Venue{(pkg.allowedPropertyCount ?? 1) !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {pkg.features?.length > 0 && (
                      <ul className="space-y-1">
                        {pkg.features.slice(0,5).map((f:any) => (
                          <li key={f.id||f.feature} className="flex items-center gap-2 text-xs text-slate-300">
                            <CheckCircle2 size={11} className="text-emerald-400 shrink-0"/>{f.feature}
                          </li>
                        ))}
                        {pkg.features.length > 5 && <li className="text-[10px] text-slate-500 pl-4">+{pkg.features.length-5} more features</li>}
                      </ul>
                    )}
                  </div>
                );
              })}
              {/* Continue free card */}
              <div onClick={() => { setSelectedPackageId(null); setSelectedPackage(null); }}
                className={`cursor-pointer rounded-2xl border-2 p-6 transition-all duration-300 flex flex-col items-center justify-center text-center ${
                  !selectedPackageId ? 'border-slate-500 bg-white/[0.06]' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                }`}>
                <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <Sparkles size={20} className="text-white/40"/>
                </div>
                <h3 className="text-sm font-black text-white/70 mb-1">Continue Free</h3>
                <p className="text-slate-500 text-xs">Start with a default trial. Upgrade later.</p>
                {!selectedPackageId && <div className="mt-2 text-[11px] text-slate-400 font-semibold flex items-center gap-1"><CheckCircle2 size={11}/> Selected</div>}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 max-w-md mx-auto">
            <button type="button" onClick={()=>setStep(1)} className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 text-sm font-bold transition-all">
              <ArrowLeft size={15}/> Back
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg shadow-rose-600/20">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : isPaidPlan
                  ? <>Continue to Payment <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/></>
                  : <>Continue to Branch Setup <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/></>
              }
            </button>
          </div>
        </form>
      </div>
    </BgShell>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 3 — Payment Portal (paid plans only)
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStepLabel === 'Payment') {
    const upiLink = billingSettings
      ? `upi://pay?pa=${billingSettings.upiId}&pn=${encodeURIComponent(billingSettings.upiName)}&am=${selectedPackage?.priceINR || ''}&cu=INR`
      : null;
    const qrUrl = upiLink ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiLink)}` : null;

    return (
      <BgShell>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4"><Logo logoUrl={logoUrl} /></div>
            <h2 className="text-4xl font-black text-white mb-2">Complete Payment</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Pay via UPI or Bank Transfer, then paste your transaction reference below to submit for approval.
            </p>
            <StepBar current={step} roleName={roleName} isPaidPlan={isPaidPlan} />
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3 text-rose-300 text-sm font-medium max-w-2xl mx-auto">
              <Shield size={15} className="shrink-0 mt-0.5"/>{error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Left — UPI */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
                  <Smartphone size={16} className="text-rose-400"/>
                </div>
                <h3 className="text-white font-bold text-sm">Pay via UPI</h3>
              </div>

              {qrUrl && (
                <div className="flex flex-col items-center mb-5">
                  <div className="p-3 bg-white rounded-2xl shadow-lg mb-3">
                    <img src={qrUrl} alt="UPI QR" width={160} height={160} className="block"/>
                  </div>
                  <p className="text-slate-400 text-xs">Scan with any UPI app</p>
                </div>
              )}

              <div className="space-y-3">
                {billingSettings?.upiId && (
                  <div className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">UPI ID</p>
                      <p className="text-white font-bold text-sm">{billingSettings.upiId}</p>
                    </div>
                    <CopyBtn value={billingSettings.upiId}/>
                  </div>
                )}
                {selectedPackage?.priceINR > 0 && (
                  <div className="flex items-center justify-between bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">Amount to Pay</p>
                      <p className="text-white font-black text-lg">₹{selectedPackage.priceINR?.toLocaleString()}</p>
                    </div>
                    <CopyBtn value={String(selectedPackage.priceINR)}/>
                  </div>
                )}
              </div>
            </div>

            {/* Right — Bank Transfer */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                  <Landmark size={16} className="text-violet-400"/>
                </div>
                <h3 className="text-white font-bold text-sm">Bank Transfer</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Bank Name',     value: billingSettings?.bankName },
                  { label: 'Account No.',   value: billingSettings?.bankAccount },
                  { label: 'IFSC Code',     value: billingSettings?.bankIfsc },
                  { label: 'SWIFT / BIC',   value: billingSettings?.bankSwift },
                ].map(row => row.value && (
                  <div key={row.label} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{row.label}</p>
                      <p className="text-white font-bold text-sm">{row.value}</p>
                    </div>
                    <CopyBtn value={row.value}/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plan summary */}
          <div className="max-w-2xl mx-auto mb-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Selected Plan</p>
              <p className="text-white font-black">{selectedPackage?.name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Annual Price</p>
              <p className="text-white font-black text-lg">₹{selectedPackage?.priceINR?.toLocaleString()}</p>
            </div>
          </div>

          {/* Payment reference form */}
          <form onSubmit={handleStep3} className="max-w-2xl mx-auto space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Transaction / UPI Reference Number <span className="text-rose-400">*</span>
              </label>
              <input type="text" required value={paymentRef} onChange={e=>setPaymentRef(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-medium placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                placeholder="e.g. 123456789012 or UPI ref ID from your payment app"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Amount Paid (₹) <span className="text-slate-500 normal-case font-normal">(optional — auto-filled)</span>
              </label>
              <input type="number" value={paymentAmount} onChange={e=>setPaymentAmount(e.target.value)}
                className="w-full px-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm font-medium placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                placeholder={selectedPackage?.priceINR?.toString() || 'Amount you paid'}/>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button type="button" onClick={()=>setStep(2)} className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 text-sm font-bold transition-all">
                <ArrowLeft size={15}/> Back
              </button>
              <button type="submit" disabled={loading || !paymentRef.trim()}
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg shadow-rose-600/20">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <>Continue to Branch Setup <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/></>
                }
              </button>
            </div>
          </form>
        </div>
      </BgShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 4 — Branch & POS Operator Setup
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStepLabel === 'Branch & POS') {
    const hasPOSFeature = !selectedPackage || selectedPackage.features?.some((f: any) => f.feature === 'POS');
    const hasBarFeature = !selectedPackage || selectedPackage.features?.some((f: any) => f.feature === 'BARPOS');
    const hasCafeFeature = !selectedPackage || selectedPackage.features?.some((f: any) => f.feature === 'CAFEPOS');
    const hasDeliveryFeature = !selectedPackage || selectedPackage.features?.some((f: any) => f.feature === 'DRIVERS');

    const maxPosCount = selectedPackage ? (selectedPackage.allowedPosCount ?? 1) : 3;
    const maxPropertyLimit = selectedPackage ? (selectedPackage.allowedPropertyCount ?? 1) : 1;
    const currentSelectedCount = (restaurantPosEnabled ? 1 : 0) + (barPosEnabled ? 1 : 0) + (cafePosEnabled ? 1 : 0);
    const isPosSelectionFull = currentSelectedCount >= maxPosCount;

    const handleBranchAndPOSSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      
      if (!branchName.trim()) {
        setError('Branch Name is required.');
        return;
      }
      if (!branchCode.trim()) {
        setError('Branch Code is required.');
        return;
      }
      
      const isHotel = businessType === 'HOTEL';
      const subUserLabel = isHotel ? 'Receptionist' : 'Operator';
      const hasPOSDetails = posFullName.trim() || posEmail.trim() || posPassword.trim();
      if (hasPOSDetails) {
        if (!posFullName.trim()) {
          setError(`Please provide the ${subUserLabel}'s full name.`);
          return;
        }
        if (!posEmail.trim()) {
          setError(`Please provide the ${subUserLabel}'s email.`);
          return;
        }
        if (!posPassword.trim()) {
          setError(`Please provide a password for the ${subUserLabel}.`);
          return;
        }
        if (posPassword.length < 6) {
          setError(`${subUserLabel} password must be at least 6 characters.`);
          return;
        }
      }

      // roleName state is already set correctly by the business type toggle buttons
      await doRegister({
        branchName: branchName.trim(),
        branchCode: branchCode.trim(),
        branchCity: branchCity.trim() || null,
        branchAddress: branchAddress.trim() || null,
        branchPhone: branchPhone.trim() || null,
        posFullName: hasPOSDetails ? posFullName.trim() : null,
        posEmail: hasPOSDetails ? posEmail.trim() : null,
        posPassword: hasPOSDetails ? posPassword : null,
      });
    };

    return (
      <BgShell>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4"><Logo logoUrl={logoUrl} /></div>
            <h2 className="text-4xl font-black text-white mb-2">Configure Your Business</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Set up your property details and create an optional operator profile.
            </p>
            <StepBar current={step} roleName={roleName} isPaidPlan={isPaidPlan} />
          </div>

          {/* ── Business Type Selector ── */}
          <div className="max-w-2xl mx-auto mb-8">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
              What type of business are you setting up?
            </p>
            <div className={`grid gap-4 ${hotelEnabled ? 'grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}>
              {/* Restaurant Option */}
              <button
                type="button"
                onClick={() => { setBusinessType('RESTAURANT'); setRoleName('RESTAURANTS_ADMIN'); }}
                className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
                  businessType === 'RESTAURANT'
                    ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  businessType === 'RESTAURANT' ? 'bg-rose-500/20' : 'bg-white/10'
                }`}>
                  <Store size={22} className={businessType === 'RESTAURANT' ? 'text-rose-400' : 'text-slate-400'} />
                </div>
                <div className="text-center">
                  <p className={`font-black text-sm ${
                    businessType === 'RESTAURANT' ? 'text-white' : 'text-slate-300'
                  }`}>Restaurant / Cafe</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">POS billing & orders</p>
                </div>
                {businessType === 'RESTAURANT' && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-rose-400 uppercase tracking-wider">
                    <CheckCircle2 size={12} /> Selected
                  </div>
                )}
              </button>

              {/* Hotel Option */}
              {hotelEnabled && (
                <button
                  type="button"
                  onClick={() => { setBusinessType('HOTEL'); setRoleName('HOTEL_ADMIN'); }}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 ${
                    businessType === 'HOTEL'
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    businessType === 'HOTEL' ? 'bg-indigo-500/20' : 'bg-white/10'
                  }`}>
                    <Hotel size={22} className={businessType === 'HOTEL' ? 'text-indigo-400' : 'text-slate-400'} />
                  </div>
                  <div className="text-center">
                    <p className={`font-black text-sm ${
                      businessType === 'HOTEL' ? 'text-white' : 'text-slate-300'
                    }`}>Hotel / Guest House</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Bookings, rooms & billing</p>
                  </div>
                  {businessType === 'HOTEL' && (
                    <div className="flex items-center gap-1 text-[10px] font-black text-indigo-400 uppercase tracking-wider">
                      <CheckCircle2 size={12} /> Selected
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3 text-rose-300 text-sm font-medium max-w-2xl mx-auto">
              <Shield size={17} className="text-rose-400 shrink-0 mt-0.5" />{error}
            </div>
          )}

          <form onSubmit={handleBranchAndPOSSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column — Branch/Hotel Details */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    businessType === 'HOTEL' ? 'bg-indigo-500/20' : 'bg-rose-500/20'
                  }`}>
                    {businessType === 'HOTEL'
                      ? <Hotel size={16} className="text-indigo-400" />
                      : <Store size={16} className="text-rose-400" />}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">
                      {businessType === 'HOTEL' ? 'Hotel Configuration' : 'Branch Configuration'}
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      {businessType === 'HOTEL'
                        ? 'Primary hotel property details'
                        : 'Primary property details of your business location'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
                    {businessType === 'HOTEL' ? 'Hotel Name' : 'Branch Name'} <span className="text-rose-400">*</span>
                  </label>
                  <input type="text" required value={branchName} onChange={e => setBranchName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                    placeholder={businessType === 'HOTEL' ? 'e.g. Sunrise Hotel, Grand Palace' : 'e.g. Main Outlet, Connaught Place'} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1 flex justify-between">
                    <span>{businessType === 'HOTEL' ? 'Hotel Code' : 'Branch Code'} <span className="text-rose-400">*</span></span>
                    <button type="button" onClick={() => setBranchCode(generateBranchCode(branchName || businessName || fullName))}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider flex items-center gap-1 transition-all">
                      <RefreshCcw size={10} /> Regenerate
                    </button>
                  </label>
                  <input type="text" required value={branchCode} onChange={e => setBranchCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white text-sm font-mono placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                    placeholder={businessType === 'HOTEL' ? 'e.g. HT-CP01' : 'e.g. BR-CP01'} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">City</label>
                    <input type="text" value={branchCity} onChange={e => setBranchCity(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                      placeholder="e.g. New Delhi" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Phone</label>
                    <input type="text" value={branchPhone} onChange={e => setBranchPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                      placeholder="e.g. +91 9876543210" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Address</label>
                  <textarea rows={2} value={branchAddress} onChange={e => setBranchAddress(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all resize-none"
                    placeholder="e.g. Plot No 12, Outer Circle, CP" />
                </div>
              </div>

              {/* Right Column — POS Panel or Hotel Receptionist */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-sm p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      businessType === 'HOTEL' ? 'bg-indigo-500/20' : 'bg-violet-500/20'
                    }`}>
                      <User size={16} className={businessType === 'HOTEL' ? 'text-indigo-400' : 'text-violet-400'} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">
                        {businessType === 'HOTEL' ? 'Hotel Receptionist' : 'POS Panel'}{' '}
                        <span className="text-slate-500 font-normal text-[11px]">(Optional)</span>
                      </h3>
                      <p className="text-slate-400 text-[11px]">
                        {businessType === 'HOTEL'
                          ? 'Front desk receptionist login credentials'
                          : 'Primary billing desk operator credentials'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.03] rounded-xl border border-white/5 text-[11px] text-slate-300 leading-relaxed">
                    {businessType === 'HOTEL'
                      ? <>💡 <strong>Tip:</strong> Create a receptionist account so your front desk staff can check-in guests, manage bookings, and process hotel payments. Skip if you prefer to add staff later.</>
                      : <>💡 <strong>Tip:</strong> Fill these fields to create an instant POS Operator terminal profile linked to this branch. Your operator can use this to process orders immediately. Keep it blank if you want to set this up later from your admin panel.</>
                    }
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
                      {businessType === 'HOTEL' ? 'Receptionist Full Name' : 'Operator Full Name'}
                    </label>
                    <input type="text" value={posFullName} onChange={e => setPosFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                      placeholder={businessType === 'HOTEL' ? 'e.g. Priya Receptionist' : 'e.g. Jack Operator'} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
                      {businessType === 'HOTEL' ? 'Receptionist Email' : 'Operator Email'}
                    </label>
                    <input type="email" value={posEmail} onChange={e => setPosEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                      placeholder={businessType === 'HOTEL' ? 'e.g. reception@hotel.com' : 'e.g. operator@business.com'} />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">
                      {businessType === 'HOTEL' ? 'Receptionist Password' : 'Operator Password'}
                    </label>
                    <input type="password" value={posPassword} onChange={e => setPosPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-xl text-white text-sm placeholder:text-slate-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                      placeholder="Min 6 characters" />
                  </div>
                </div>
              </div>
            </div>

            {/* POS Modules & Access Control Section */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/20">
                  <Store size={16} className="text-rose-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">POS Modules & Access Control</h3>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                    Configure POS features for this branch. Your selected package allows a maximum of <span className="text-rose-400 font-bold">{maxPosCount}</span> active POS terminal(s) and <span className="text-violet-400 font-bold">{maxPropertyLimit}</span> property(ies) (POS Selected: {currentSelectedCount} / {maxPosCount}).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Restaurant POS */}
                <div className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                  restaurantPosEnabled ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.02] border-white/5 opacity-50'
                }`}>
                  <div className="mb-3">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      Restaurant POS 🍽️
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Dine In tables, bills, KOT & orders</p>
                    {!hasPOSFeature && (
                      <span className="text-[9px] font-black text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded tracking-wider uppercase mt-1 inline-block">Locked</span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <input
                      type="checkbox"
                      disabled={!hasPOSFeature || (!restaurantPosEnabled && isPosSelectionFull)}
                      checked={restaurantPosEnabled}
                      onChange={(e) => setRestaurantPosEnabled(e.target.checked)}
                      className="w-5 h-5 accent-rose-600 rounded border-white/10 bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Bar POS */}
                <div className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                  barPosEnabled ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.02] border-white/5 opacity-50'
                }`}>
                  <div className="mb-3">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      Bar POS 🍺
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Peg sizing, bar display & liquor items</p>
                    {!hasBarFeature && (
                      <span className="text-[9px] font-black text-rose-450 bg-rose-500/15 px-1.5 py-0.5 rounded tracking-wider uppercase mt-1 inline-block">Locked</span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <input
                      type="checkbox"
                      disabled={!hasBarFeature || (!barPosEnabled && isPosSelectionFull)}
                      checked={barPosEnabled}
                      onChange={(e) => setBarPosEnabled(e.target.checked)}
                      className="w-5 h-5 accent-rose-600 rounded border-white/10 bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Cafe POS */}
                <div className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                  cafePosEnabled ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.02] border-white/5 opacity-50'
                }`}>
                  <div className="mb-3">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      Cafe POS ☕
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Quick billing flow & cafe display</p>
                    {!hasCafeFeature && (
                      <span className="text-[9px] font-black text-rose-400 bg-rose-500/15 px-1.5 py-0.5 rounded tracking-wider uppercase mt-1 inline-block">Locked</span>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <input
                      type="checkbox"
                      disabled={!hasCafeFeature || (!cafePosEnabled && isPosSelectionFull)}
                      checked={cafePosEnabled}
                      onChange={(e) => setCafePosEnabled(e.target.checked)}
                      className="w-5 h-5 accent-rose-600 rounded border-white/10 bg-transparent cursor-pointer disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Services & Integrations Section */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 space-y-4 max-w-2xl mx-auto">
              <div className="flex items-center gap-2.5 pb-2 border-b border-white/10">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-500/20">
                  <Truck size={16} className="text-violet-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm">Additional Services & Integrations</h3>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                    Enable delivery logistics and rider portal settings for this property.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Home Delivery */}
                <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                  deliveryEnabled ? 'bg-white/[0.08] border-white/20' : 'bg-white/[0.02] border-white/5 opacity-50'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      Home Delivery 🚚
                      {!hasDeliveryFeature && (
                        <span className="text-[9px] font-black text-rose-450 bg-rose-500/15 px-1.5 py-0.5 rounded tracking-wider uppercase">Locked</span>
                      )}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Logistics settings & Rider portal access</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!hasDeliveryFeature}
                    checked={deliveryEnabled}
                    onChange={(e) => setDeliveryEnabled(e.target.checked)}
                    className="w-5 h-5 accent-rose-600 rounded border-white/10 bg-transparent cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 max-w-md mx-auto pt-4">
              <button type="button" onClick={() => setStep(isPaidPlan ? 3 : 2)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/10 text-sm font-bold transition-all">
                <ArrowLeft size={15}/> Back
              </button>
              <button type="submit" disabled={loading}
                className={`flex-1 py-3.5 text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg ${
                  businessType === 'HOTEL'
                    ? 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}>
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <><BadgeCheck size={16}/> Complete Account Setup</>
                }
              </button>
            </div>
          </form>
        </div>
      </BgShell>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: Success / Pending Approval
  // ═══════════════════════════════════════════════════════════════════════════
  // DELIVERY RIDER — Vehicle & Zone Selection
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStepLabel === 'Vehicle & Zone') return (
    <BgShell>
      <div className="max-w-[600px] mx-auto rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(225,29,72,0.15)] border border-white/20 backdrop-blur-xl bg-white/10 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo logoUrl={logoUrl} /></div>
          <h2 className="text-3xl font-black text-white mb-2">Vehicle & Zone</h2>
          <p className="text-slate-400 text-sm">Tell us about your vehicle and where you want to work.</p>
          <StepBar current={step} roleName={roleName} isPaidPlan={isPaidPlan} />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3 text-rose-300 text-sm font-medium">
            <Shield size={15} className="shrink-0 mt-0.5" />{error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); doRegister(); }} className="space-y-5">
          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Phone Number</label>
            <div className="relative">
              <Smartphone size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField==='phone'?'text-rose-600':'text-slate-400'}`} />
              <input type="tel" required value={phone} onChange={e=>setPhone(e.target.value)}
                onFocus={()=>setFocusedField('phone')} onBlur={()=>setFocusedField(null)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all"
                placeholder="e.g. +91 9876543210" />
            </div>
          </div>

          {/* Vehicle Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Vehicle Type</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'BIKE', label: 'Bike', icon: Truck },
                { id: 'CYCLE', label: 'Bicycle', icon: Truck },
                { id: 'CAR', label: 'Car', icon: Truck }
              ].map(v => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVehicleType(v.id)}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                    vehicleType === v.id
                      ? 'border-rose-600 bg-rose-600/10 text-white shadow-lg'
                      : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <v.icon size={16} />
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle Plate Number */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Vehicle Plate Number</label>
            <div className="relative">
              <Truck size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField==='vehicleNo'?'text-rose-600':'text-slate-400'}`} />
              <input type="text" required value={vehicleNumber} onChange={e=>setVehicleNumber(e.target.value)}
                onFocus={()=>setFocusedField('vehicleNo')} onBlur={()=>setFocusedField(null)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all"
                placeholder="e.g. DL-3C-AB-1234" />
            </div>
          </div>

          {/* Operating Area / Zone / Map GPS Location Picker */}
          <div>
            <MapPicker 
              onAddressSelect={(address, lat, lng) => { 
                setDeliveryLocation(address); 
                setDeliveryLat(lat); 
                setDeliveryLng(lng); 
              }} 
              initialAddress={deliveryLocation} 
              deliveryRadius={deliveryRadius}
            />
          </div>

          {/* Operating Delivery Radius */}
          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Delivery Radius / Coverage Zone</label>
              <span className="text-xs font-black text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-lg">{deliveryRadius} km</span>
            </div>
            <div className="px-1">
              <input 
                type="range" 
                min="1" 
                max="25" 
                step="1"
                value={deliveryRadius} 
                onChange={e => setDeliveryRadius(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-600 outline-none transition-all" 
              />
              <div className="flex justify-between text-[10px] text-slate-450 mt-2 font-bold px-0.5">
                <span>1 km</span>
                <span>5 km</span>
                <span>10 km</span>
                <span>15 km</span>
                <span>20 km</span>
                <span>25 km</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 py-4 border border-white/20 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
              <ArrowLeft size={15} /> Back
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-4 bg-slate-900 hover:bg-rose-600 text-white rounded-xl font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <>Finish Registration <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/></>
              }
            </button>
          </div>
        </form>
      </div>
    </BgShell>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // B2B SUPPLIER — Business & Catalog Details
  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStepLabel === 'Business Details') return (
    <BgShell>
      <div className="max-w-[600px] mx-auto rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(225,29,72,0.15)] border border-white/20 backdrop-blur-xl bg-white/10 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4"><Logo logoUrl={logoUrl} /></div>
          <h2 className="text-3xl font-black text-white mb-2">Business Details</h2>
          <p className="text-slate-400 text-sm">Tell us about your company and product lines.</p>
          <StepBar current={step} roleName={roleName} isPaidPlan={isPaidPlan} />
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex gap-3 text-rose-300 text-sm font-medium">
            <Shield size={15} className="shrink-0 mt-0.5" />{error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); doRegister(); }} className="space-y-5">
          {/* Business Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Business / Company Name</label>
            <div className="relative">
              <Building2 size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField==='busName'?'text-rose-600':'text-slate-400'}`} />
              <input type="text" required value={businessName} onChange={e=>setBusinessName(e.target.value)}
                onFocus={()=>setFocusedField('busName')} onBlur={()=>setFocusedField(null)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all"
                placeholder="e.g. Supreme Veg Wholesale" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Business Phone</label>
              <div className="relative">
                <Smartphone size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField==='phone'?'text-rose-600':'text-slate-400'}`} />
                <input type="tel" required value={phone} onChange={e=>setPhone(e.target.value)}
                  onFocus={()=>setFocusedField('phone')} onBlur={()=>setFocusedField(null)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all"
                  placeholder="e.g. +91 9876543210" />
              </div>
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">GSTIN Number <span className="text-slate-300 normal-case font-normal">(Optional)</span></label>
              <div className="relative">
                <Landmark size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${focusedField==='gst'?'text-rose-600':'text-slate-400'}`} />
                <input type="text" value={gstNumber} onChange={e=>setGstNumber(e.target.value)}
                  onFocus={()=>setFocusedField('gst')} onBlur={()=>setFocusedField(null)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all"
                  placeholder="e.g. 07AAAAA1111A1Z1" />
              </div>
            </div>
          </div>

          {/* Supplier Category */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Supplier Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em' }}
            >
              <option value="Vegetables">Vegetables & Fruits</option>
              <option value="Dairy">Dairy & Eggs</option>
              <option value="Meat">Meat, Seafood & Poultry</option>
              <option value="Groceries">Dry Groceries & Spices</option>
              <option value="Beverages">Beverages & Coffee</option>
              <option value="Packaging">Packaging & Disposables</option>
              <option value="Equipment">Kitchen Equipment & Tools</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 ml-1">Warehouse / Office Address</label>
            <div className="relative">
              <Building2 size={15} className={`absolute left-3.5 top-10 transition-colors ${focusedField==='address'?'text-rose-600':'text-slate-400'}`} />
              <textarea required value={address} onChange={e=>setAddress(e.target.value)}
                onFocus={()=>setFocusedField('address')} onBlur={()=>setFocusedField(null)} rows={3}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:border-rose-600 focus:ring-1 focus:ring-rose-600 outline-none transition-all resize-none"
                placeholder="Full physical location of warehouse or operations center" />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={() => setStep(1)}
              className="flex-1 py-4 border border-white/20 hover:bg-white/10 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
              <ArrowLeft size={15} /> Back
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-4 bg-slate-900 hover:bg-rose-600 text-white rounded-xl font-bold text-sm tracking-wide transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <>Finish Registration <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/></>
              }
            </button>
          </div>
        </form>
      </div>
    </BgShell>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  if (currentStepLabel === 'Done') return (
    <BgShell>
      <div className="max-w-lg mx-auto text-center">
        <div className="rounded-3xl bg-white/[0.07] backdrop-blur-xl border border-white/15 p-10 shadow-[0_0_60px_rgba(225,29,72,0.12)]">
          <div className="flex justify-center mb-6"><Logo logoUrl={logoUrl} /></div>

          {isPaidPlan ? (
            <>
              {/* Paid — pending admin approval */}
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-amber-500/10">
                <Clock size={38} className="text-amber-400"/>
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Payment Submitted!</h2>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                Your account has been created and your payment reference has been sent for verification.
                <br/><br/>
                <span className="text-amber-300 font-semibold">An admin will review and approve your subscription.</span>{' '}
                You'll get full access as soon as it's confirmed.
              </p>
              <div className="rounded-xl bg-white/[0.06] border border-white/10 p-4 mb-6 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Plan</span>
                  <span className="text-white font-bold">{selectedPackage?.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Ref. No.</span>
                  <span className="text-white font-mono font-bold">{paymentRef}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Status</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1"><Clock size={11}/> Pending Admin Review</span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Free / trial — ready immediately */}
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/10">
                <CheckCircle2 size={38} className="text-emerald-400"/>
              </div>
              <h2 className="text-3xl font-black text-white mb-3">Account Created!</h2>
              <p className="text-slate-300 text-sm mb-6">Your account is ready. Log in to get started with your free trial.</p>
            </>
          )}

          <button onClick={()=>router.push('/login')}
            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 group">
            Go to Login <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </div>
      </div>
    </BgShell>
  );

  return null;
}


// ─── Page export ───────────────────────────────────────────────────────────────
export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse text-white/50 font-bold tracking-widest text-sm uppercase">Loading...</div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
