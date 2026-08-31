'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock, Mail, Eye, EyeOff, ArrowRight, ArrowLeft, Shield, RefreshCcw,
  User, Store, Truck, Package, Mic, Utensils, Phone, ChevronDown,
  Building2, MapPin, Hash, Check, Sparkles, Beer, Coffee, Bike,
  Star, Zap, Crown, CreditCard, Info, X, Wrench, Layers,
  Hotel, ChefHat, UtensilsCrossed,
} from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { APIError } from '@/lib/api/client';
import { DriverRegistrationForm } from '@/components/auth/DriverRegistrationForm';
import { SupplierRegistrationForm } from '@/components/auth/SupplierRegistrationForm';
import { SingerRegistrationForm } from '@/components/auth/SingerRegistrationForm';

// ─── Business Types ───────────────────────────────────────────────────────────
type BusinessType = 'RESTAURANT' | 'HOTEL' | 'BOTH';

// ─── Hotel/Restaurant Wizard: 5 Steps ────────────────────────────────────────
const HOTEL_STEPS = [
  { id: 1, label: 'Business',  icon: Store,     color: '#10b981', desc: 'Select your business type' },
  { id: 2, label: 'Account',   icon: User,      color: '#8b5cf6', desc: 'Login credentials' },
  { id: 3, label: 'Plan',      icon: Sparkles,  color: '#f59e0b', desc: 'Choose subscription plan' },
  { id: 4, label: 'Property',  icon: Building2, color: '#06b6d4', desc: 'Property details' },
  { id: 5, label: 'Services',  icon: Utensils,  color: '#f43f5e', desc: 'Enable services & create users' },
];

// ─── Non-Hotel Roles ──────────────────────────────────────────────────────────
const OTHER_ROLES = [
  { id: 'DELIVERY_RIDER', label: 'Driver / Cab / Delivery Rider', icon: Truck,   color: '#22c55e', desc: 'For delivery and cab services' },
  { id: 'B2B_SUPPLIER',   label: 'B2B Vendor / Supplier',         icon: Package, color: '#f59e0b', desc: 'Supply products and raw materials' },
  { id: 'SINGER',         label: 'Singer & Live Artist',           icon: Mic,     color: '#ec4899', desc: 'Live performances and events' },
];

// ─── Feature Labels for Plan Cards ───────────────────────────────────────────
const FEATURE_LABELS: Record<string, string> = {
  POS: '🛒 Point of Sale', INVENTORY: '📦 Inventory', ACCOUNTING: '💰 Accounting',
  HMS: '🏨 Hotel Management', TABLES: '🪑 Tables', TABLETS: '📱 Waiter App',
  REPORTS: '📊 Reports', GST: '📋 GST Filing', STAFF: '👥 Staff', CRM: '👤 CRM',
  B2B: '🚛 B2B Marketplace', WHATSAPP: '💬 WhatsApp', DRIVERS: '🚗 Drivers',
};

const PLAN_ICONS: Record<string, React.ReactNode> = {
  'Free Trial': <Zap size={18} />, 'Starter': <Star size={18} />, 'Starter Plan': <Star size={18} />,
  'Professional': <Sparkles size={18} />, 'Professional Suite': <Sparkles size={18} />,
  'Enterprise': <Crown size={18} />,
};
const PLAN_COLORS: Record<string, string> = {
  'Free Trial': '#10b981', 'Starter': '#06b6d4', 'Starter Plan': '#06b6d4',
  'Professional': '#f43f5e', 'Professional Suite': '#f43f5e', 'Enterprise': '#8b5cf6',
};

interface PkgType {
  id: string; name: string; description: string;
  priceINR: number; priceUSD: number; color?: string;
  features: { feature: string }[];
}

interface FeaturePriceItem {
  id?: string; feature: string; label: string;
  priceINR: number; priceUSD: number; isActive: boolean;
}

// All 22 features with groups for the custom builder UI
const FEATURE_META: { key: string; label: string; icon: string; group: string }[] = [
  { key: 'POS',          label: 'Point of Sale',          icon: '🛒', group: 'Core' },
  { key: 'INVENTORY',    label: 'Inventory',              icon: '📦', group: 'Core' },
  { key: 'ACCOUNTING',   label: 'Accounting',             icon: '💰', group: 'Core' },
  { key: 'HMS',          label: 'Hotel Management',       icon: '🏨', group: 'Hospitality' },
  { key: 'TABLES',       label: 'Table Management',       icon: '🪑', group: 'Hospitality' },
  { key: 'TABLETS',      label: 'Tablet / Waiter App',    icon: '📱', group: 'Hospitality' },
  { key: 'BARPOS',       label: 'Bar POS',                icon: '🍺', group: 'Hospitality' },
  { key: 'CAFEPOS',      label: 'Cafe POS',               icon: '☕', group: 'Hospitality' },
  { key: 'REPORTS',      label: 'Reports & Analytics',    icon: '📊', group: 'Analytics' },
  { key: 'GST',          label: 'GST Filing',             icon: '📋', group: 'Analytics' },
  { key: 'STAFF',        label: 'Staff Management',       icon: '👥', group: 'People' },
  { key: 'DRIVERS',      label: 'Driver Management',      icon: '🚗', group: 'People' },
  { key: 'CRM',          label: 'CRM & Memberships',      icon: '👤', group: 'People' },
  { key: 'OFFERS',       label: 'Offers & Rewards',       icon: '🎁', group: 'Marketing' },
  { key: 'WEBSITE',      label: 'Website CMS',            icon: '🌐', group: 'Marketing' },
  { key: 'B2B',          label: 'B2B Marketplace',        icon: '🚛', group: 'Advanced' },
  { key: 'PARKING',      label: 'Parking',                icon: '🅿️', group: 'Advanced' },
  { key: 'WASTE',        label: 'Waste Management',       icon: '🗑️', group: 'Advanced' },
  { key: 'WHATSAPP',     label: 'WhatsApp Bot',           icon: '💬', group: 'Integrations' },
  { key: 'WALKIETALKIE', label: 'Staff Walkie-Talkie',    icon: '📡', group: 'Integrations' },
  { key: 'GEOFENCING',   label: 'Geo Attendance',         icon: '📍', group: 'Integrations' },
  { key: 'TIPS',         label: 'Tips & Gratuity',        icon: '💵', group: 'Integrations' },
];

// ─── Shared style helpers ─────────────────────────────────────────────────────
const inputCls = 'w-full px-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none transition-colors';
const labelCls = 'block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5';

// ─── ServiceToggle Component ──────────────────────────────────────────────────
function ServiceToggle({ label, desc, icon: Icon, color, value, onChange }: {
  label: string; desc: string; icon: any; color: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left w-full ${value ? 'bg-white/5' : 'border-white/10 hover:border-white/20'}`}
      style={value ? { borderColor: color, boxShadow: `0 0 16px ${color}18` } : {}}
    >
      <span style={{ color: value ? color : '#64748b' }}><Icon size={18} /></span>
      <div className="flex-1">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="text-[11px] text-slate-400">{desc}</p>
      </div>
      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
        style={value ? { backgroundColor: color, borderColor: color } : { borderColor: '#334155' }}>
        {value && <Check size={11} className="text-white" strokeWidth={3} />}
      </div>
    </button>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-7">
      {HOTEL_STEPS.map((s, idx) => {
        const done   = current > s.id;
        const active = current === s.id;
        const Icon   = s.icon;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${done ? 'border-emerald-500 bg-emerald-500/20' : active ? 'bg-white/5' : 'border-white/15 bg-transparent'}`}
                style={active ? { borderColor: s.color, boxShadow: `0 0 14px ${s.color}40` } : {}}
              >
                {done
                  ? <Check size={14} className="text-emerald-400" strokeWidth={3} />
                  : <Icon size={14} className={active ? 'text-white' : 'text-slate-600'} />}
              </div>
              <span className="text-[9px] font-bold mt-1 tracking-wide hidden sm:block"
                style={{ color: active ? s.color : done ? '#10b981' : '#475569' }}>
                {s.label}
              </span>
            </div>
            {idx < HOTEL_STEPS.length - 1 && (
              <div className="h-[2px] w-6 sm:w-10 mb-3 mx-0.5 rounded-full transition-all duration-500"
                style={{ backgroundColor: current > s.id ? '#10b981' : '#1e293b' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Signup Page
// ═══════════════════════════════════════════════════════════════════════════════
export default function SignupPage() {
  const router = useRouter();

  // ── Top-level role selection ───────────────────────────────────────────────
  // 'hotel' = Hotel/Restaurant Owner multi-step wizard
  // 'DELIVERY_RIDER' | 'B2B_SUPPLIER' | 'SINGER' = single-page forms
  const [topRole, setTopRole] = useState<string | null>(null);

  // ── Hotel/Restaurant Wizard ────────────────────────────────────────────────
  const [hotelStep, setHotelStep]       = useState(1);
  const [businessType, setBusinessType] = useState<BusinessType>('RESTAURANT');

  // ── Account fields ─────────────────────────────────────────────────────────
  const [fullName,     setFullName]     = useState('');
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone,        setPhone]        = useState('');

  // ── Property / Branch ──────────────────────────────────────────────────────
  const [businessName,   setBusinessName]   = useState('');
  const [branchName,     setBranchName]     = useState('');
  const [branchCode,     setBranchCode]     = useState('');
  const [branchCity,     setBranchCity]     = useState('');
  const [branchAddress,  setBranchAddress]  = useState('');

  // ── Plan / Package ─────────────────────────────────────────────────────────
  const [packages,          setPackages]          = useState<PkgType[]>([]);
  const [loadingPkgs,       setLoadingPkgs]       = useState(false);
  const [packageId,         setPackageId]         = useState<string | null>(null);
  const [selectedPkg,       setSelectedPkg]       = useState<PkgType | null>(null);
  const [paymentReference,  setPaymentReference]  = useState('');
  const [paymentAmount,     setPaymentAmount]     = useState<number | null>(null);

  // ── Custom Plan Builder ────────────────────────────────────────────────────
  const [isCustomPlan,    setIsCustomPlan]    = useState(false);
  const [featurePrices,   setFeaturePrices]   = useState<FeaturePriceItem[]>([]);
  const [customSelected,  setCustomSelected]  = useState<Set<string>>(new Set(['POS', 'TABLES', 'INVENTORY', 'REPORTS']));
  const customTotal = featurePrices
    .filter(fp => customSelected.has(fp.feature))
    .reduce((s, fp) => s + fp.priceINR, 0);
  const toggleCustomFeature = (key: string) => {
    setCustomSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  // ── BOTH type: Restaurant (2nd) Property ────────────────────────────────────
  const [restaurantName,        setRestaurantName]        = useState('');
  const [restaurantBranchCode,  setRestaurantBranchCode]  = useState('');
  const [restaurantBranchCity,  setRestaurantBranchCity]  = useState('');
  const [restaurantBranchAddr,  setRestaurantBranchAddr]  = useState('');

  // ── Hotel Receptionist (Hotel / BOTH) ─────────────────────────────────────
  const [showHotelRecepForm, setShowHotelRecepForm] = useState(false);
  const [hotelRecepName,     setHotelRecepName]     = useState('');
  const [hotelRecepEmail,    setHotelRecepEmail]    = useState('');
  const [hotelRecepPassword, setHotelRecepPassword] = useState('');
  const [showHotelRecepPass, setShowHotelRecepPass] = useState(false);

  // ── Restaurant POS User (Restaurant / BOTH) ───────────────────────────────
  const [showPosUserForm, setShowPosUserForm] = useState(false);
  const [posFullName,     setPosFullName]     = useState('');
  const [posEmail,        setPosEmail]        = useState('');
  const [posPassword,     setPosPassword]     = useState('');
  const [showPosPass,     setShowPosPass]     = useState(false);

  // ── Services ───────────────────────────────────────────────────────────────
  const [restaurantPosEnabled, setRestaurantPosEnabled] = useState(true);
  const [barPosEnabled,        setBarPosEnabled]        = useState(false);
  const [cafePosEnabled,       setCafePosEnabled]       = useState(false);
  const [deliveryEnabled,      setDeliveryEnabled]      = useState(false);

  // ── Non-hotel role fields ──────────────────────────────────────────────────
  const [category,         setCategory]         = useState('Vegetables');
  const [gstNumber,        setGstNumber]        = useState('');
  const [address,          setAddress]          = useState('');
  const [vehicleType,      setVehicleType]      = useState('CAR');
  const [vehicleNumber,    setVehicleNumber]    = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [genre,            setGenre]            = useState('Bollywood');
  const [bio,              setBio]              = useState('');
  const [city,             setCity]             = useState('Mandi');
  const [stateRegion,      setStateRegion]      = useState('Himachal Pradesh');
  const [licenceNumber,    setLicenceNumber]    = useState('DL-1420230012345');
  const [idNumber,         setIdNumber]         = useState('1234 5678 9012');
  const [vehicleModel,     setVehicleModel]     = useState('Innova Crysta / Volvo');
  const [seatsCapacity,    setSeatsCapacity]    = useState(4);
  const [perKmRate,        setPerKmRate]        = useState(15);
  const [baseFee,          setBaseFee]          = useState(50);
  const [profilePhoto,     setProfilePhoto]     = useState('');
  const [licencePhoto,     setLicencePhoto]     = useState('');
  const [idPhoto,          setIdPhoto]          = useState('');
  const [rcPhoto,          setRcPhoto]          = useState('');

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [captchaText,  setCaptchaText]  = useState('');
  const [captchaSvg,   setCaptchaSvg]   = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [logoUrl,      setLogoUrl]      = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/website/settings').then(r => r.json())
      .then(j => { if (j.success && j.data?.logoUrl) setLogoUrl(j.data.logoUrl); }).catch(() => {});
    refreshCaptcha();
  }, []);

  // Fetch packages when reaching step 3
  useEffect(() => {
    if (topRole === 'hotel' && hotelStep === 3) {
      if (packages.length === 0) {
        setLoadingPkgs(true);
        fetch('/api/website/packages').then(r => r.json()).then(j => {
          if (j.success && j.data?.length > 0) {
            setPackages(j.data);
            if (!packageId && !isCustomPlan) {
              const free = j.data.find((p: PkgType) => p.priceINR === 0 || p.name.toLowerCase().includes('free'));
              if (free) { setPackageId(free.id); setSelectedPkg(free); }
            }
          }
        }).catch(() => {}).finally(() => setLoadingPkgs(false));
      }
      if (featurePrices.length === 0) {
        fetch('/api/website/feature-pricing').then(r => r.json()).then(j => {
          if (j.success && j.data?.length > 0) setFeaturePrices(j.data);
        }).catch(() => {});
      }
    }
  }, [hotelStep, topRole]);

  const refreshCaptcha = async () => {
    setCaptchaText(''); setCaptchaSvg(null); setCaptchaToken(null);
    try {
      const res = await fetch(`/api/auth/captcha?json=true&t=${Date.now()}`);
      if (res.ok) { const j = await res.json(); if (j.success) { setCaptchaSvg(j.svg); setCaptchaToken(j.token); } }
    } catch {}
  };

  const completeLogin = async () => {
    const res = await fetch('/api/auth/session');
    const data = await res.json();
    if (data.authenticated) {
      const role = data.user.role;
      const isHotelProperty = data.user.propertyType === 'HOTEL';
      if (role === 'SUPER_ADMIN') router.push('/admin/dashboard');
      else if (role === 'HOTEL_ADMIN' || isHotelProperty) router.push('/hotel');
      else if (role === 'RESTAURANTS_ADMIN') {
        const slug = data.user.organizationSlug;
        router.push(slug ? `/restaurantadmin/${slug}` : '/hotel');
      }
      else if (role === 'B2B_SUPPLIER') { const c = data.user.propertyCode; router.push(c ? `/${c}/b2b/supplier` : '/b2b/supplier'); }
      else if (role === 'DELIVERY_RIDER') router.push('/transport-portal/dashboard');
      else if (role === 'SINGER') router.push('/singer-portal');
      else { const c = data.user.propertyCode; router.push(c ? `/${c}/operations` : '/staff-portal'); }
    } else router.push('/login');
    router.refresh();
  };

  // ─── Step Validation ────────────────────────────────────────────────────────
  const stepValid = () => {
    if (hotelStep === 1) return !!businessType;
    if (hotelStep === 2) return fullName.trim().length >= 2 && email.includes('@') && password.length >= 6 && phone.trim().length >= 6;
    if (hotelStep === 3) return true;
    if (hotelStep === 4) {
      if (businessType === 'BOTH') return businessName.trim().length >= 2 && restaurantName.trim().length >= 2;
      return businessName.trim().length >= 2;
    }
    return true;
  };

  // ─── Submit Hotel/Restaurant Registration ────────────────────────────────────
  const handleHotelRegister = async () => {
    if (!captchaText) { setError('Please enter the captcha code.'); return; }
    setLoading(true); setError(null);
    try {
      // Role assignment:
      // HOTEL → HOTEL_ADMIN → /hotel
      // RESTAURANT → RESTAURANTS_ADMIN → /restaurantadmin/slug
      // BOTH → HOTEL_ADMIN → /hotel (hotel portal manages both)
      const roleName = businessType === 'RESTAURANT' ? 'RESTAURANTS_ADMIN' : 'HOTEL_ADMIN';

      await authApi.register({
        fullName, email, password,
        businessName: businessName || null,
        phone: phone || null,
        captchaText, captchaToken,
        roleName,
        businessType,
        // Hotel / main property
        branchName: branchName || null,
        branchCode: branchCode || null,
        branchCity: branchCity || null,
        branchAddress: branchAddress || null,
        // BOTH: second restaurant property
        restaurantPropertyName: businessType === 'BOTH' ? (restaurantName || null) : null,
        restaurantBranchCode:   businessType === 'BOTH' ? (restaurantBranchCode || null) : null,
        restaurantBranchCity:   businessType === 'BOTH' ? (restaurantBranchCity || null) : null,
        restaurantBranchAddress: businessType === 'BOTH' ? (restaurantBranchAddr || null) : null,
        // Plan
        packageId: isCustomPlan ? null : (packageId || null),
        paymentReference: paymentReference || null,
        paymentAmount: isCustomPlan ? (customTotal > 0 ? customTotal : null) : (paymentAmount || null),
        customFeatures: isCustomPlan ? Array.from(customSelected) : null,
        customPlanTotal: isCustomPlan ? (customTotal > 0 ? customTotal : null) : null,
        // Hotel Receptionist (HOTEL / BOTH)
        hotelRecepFullName: (businessType !== 'RESTAURANT' && showHotelRecepForm) ? (hotelRecepName || null) : null,
        hotelRecepEmail:    (businessType !== 'RESTAURANT' && showHotelRecepForm) ? (hotelRecepEmail || null) : null,
        hotelRecepPassword: (businessType !== 'RESTAURANT' && showHotelRecepForm) ? (hotelRecepPassword || null) : null,
        // Restaurant POS User (RESTAURANT / BOTH)
        posFullName: (businessType !== 'HOTEL' && showPosUserForm) ? (posFullName || null) : null,
        posEmail:    (businessType !== 'HOTEL' && showPosUserForm) ? (posEmail || null) : null,
        posPassword: (businessType !== 'HOTEL' && showPosUserForm) ? (posPassword || null) : null,
        // Services — POS only for RESTAURANT / BOTH
        restaurantPosEnabled: businessType === 'HOTEL' ? false : restaurantPosEnabled,
        barPosEnabled:        businessType === 'HOTEL' ? false : barPosEnabled,
        cafePosEnabled:       businessType === 'HOTEL' ? false : cafePosEnabled,
        deliveryEnabled:      businessType === 'HOTEL' ? false : deliveryEnabled,
      } as any);

      const loginRes = await authApi.login({ email, password, captchaText, captchaToken });
      if (loginRes.twoFactorRequired) router.push('/login');
      else await completeLogin();
    } catch (err: any) {
      setError(err instanceof APIError ? err.message : err?.message || 'Registration failed.');
      refreshCaptcha();
    } finally { setLoading(false); }
  };

  // ─── Submit non-hotel role registration ──────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(null);
    try {
      if (topRole === 'SINGER') {
        const res = await fetch('/api/singer/register', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fullName, email, password, phone, genre, bio }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Singer registration failed.');
        if (data.token && data.singer) { localStorage.setItem('singer_token', data.token); localStorage.setItem('singer_info', JSON.stringify(data.singer)); }
        router.push('/singer-portal/dashboard'); router.refresh();
        return;
      }
      await authApi.register({
        fullName, email, password, captchaText, captchaToken, roleName: topRole!,
        phone: phone || null, vehicleType: vehicleType || null,
        vehicleNumber: vehicleNumber || null, deliveryLocation: deliveryLocation || null,
        gstNumber: gstNumber || null, category: category || null, address: address || null,
      });
      const loginRes = await authApi.login({ email, password, captchaText, captchaToken });
      if (loginRes.twoFactorRequired) router.push('/login');
      else await completeLogin();
    } catch (err: any) {
      setError(err instanceof APIError ? err.message : err?.message || 'Registration failed.');
      refreshCaptcha();
    } finally { setLoading(false); }
  };

  const isPaidPlan = selectedPkg && selectedPkg.priceINR > 0;
  const curStep = HOTEL_STEPS[Math.min(hotelStep, HOTEL_STEPS.length) - 1];

  // ─── Business type options ────────────────────────────────────────────────
  const BUSINESS_OPTS: { type: BusinessType; emoji: string; title: string; desc: string; color: string; features: string }[] = [
    {
      type: 'RESTAURANT',
      emoji: '🍽️',
      title: 'Restaurant / Dhaba / Food Court',
      desc: 'POS billing, KOT, tables, delivery, inventory and staff management',
      color: '#f97316',
      features: 'POS • Tables • Delivery • Inventory • Staff',
    },
    {
      type: 'HOTEL',
      emoji: '🏨',
      title: 'Hotel Only',
      desc: 'Room management, check-in/out, folios, housekeeping and HMS',
      color: '#06b6d4',
      features: 'HMS • Rooms • Check-in • Housekeeping • Billing',
    },
    {
      type: 'BOTH',
      emoji: '🏨🍽️',
      title: 'Hotel + Restaurant (Both)',
      desc: 'Manage Hotel and Restaurant together — all features in one portal',
      color: '#8b5cf6',
      features: 'All Features • Hotel + Restaurant + POS',
    },
  ];

  // ─── Property placeholder based on businessType ───────────────────────────
  const bizPlaceholder = businessType === 'HOTEL'
    ? 'e.g. Royal Crown Hotel & Resort'
    : businessType === 'BOTH'
    ? 'e.g. Grand Palace Hotel & Restaurant'
    : 'e.g. Spice Garden Restaurant';

  // ─── Page title / subtitle ────────────────────────────────────────────────
  const pageTitle = () => {
    if (!topRole) return 'Get Started';
    if (topRole === 'hotel') {
      if (hotelStep === 1) return 'Select Your Business';
      if (hotelStep === 2) return 'Account Setup';
      if (hotelStep === 3) return 'Choose a Plan';
      if (hotelStep === 4) return 'Property Details';
      return 'Enable Services';
    }
    return 'Create Account';
  };

  const pageSubtitle = () => {
    if (!topRole) return 'Select your role and get started';
    if (topRole === 'hotel') return `Step ${hotelStep} of ${HOTEL_STEPS.length} — ${curStep.desc}`;
    const r = OTHER_ROLES.find(r => r.id === topRole);
    return r ? r.label : 'Enter your details to get started';
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-rose-600/10 blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-[580px] my-6">

        {/* Logo + Title */}
        <div className="flex flex-col items-center text-center mb-6">
          {logoUrl
            ? <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-3 drop-shadow" />
            : <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20 mb-3">
                <span className="text-white font-black text-xl italic">GF</span>
              </div>
          }
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{pageTitle()}</h1>
          <p className="text-slate-400 text-sm mt-1">{pageSubtitle()}</p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            LANDING: Role Selection (no role chosen yet)
        ══════════════════════════════════════════════════════════════════ */}
        {!topRole && (
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-4">

            {/* Hotel / Restaurant Owner */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Business Owner</p>
              <div className="grid grid-cols-1 gap-3">
                {BUSINESS_OPTS.map(opt => (
                  <button key={opt.type} type="button"
                    onClick={() => {
                      setTopRole('hotel');
                      setBusinessType(opt.type);
                      // Skip Step 1 (Business Type) since user already selected from landing page
                      setHotelStep(2);
                      if (opt.type === 'HOTEL') setCustomSelected(new Set(['HMS', 'INVENTORY', 'REPORTS', 'STAFF']));
                      else if (opt.type === 'RESTAURANT') setCustomSelected(new Set(['POS', 'TABLES', 'INVENTORY', 'REPORTS']));
                      else setCustomSelected(new Set(['POS', 'HMS', 'TABLES', 'INVENTORY', 'REPORTS']));
                    }}
                    className="relative text-left p-4 rounded-2xl border-2 border-white/10 hover:border-white/25 bg-slate-900/50 hover:bg-white/3 transition-all group"
                    style={{ ['--hover-border' as any]: opt.color }}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <p className="text-sm font-extrabold text-white group-hover:text-white">{opt.title}</p>
                        <p className="text-[10px] font-bold tracking-wider mt-0.5" style={{ color: opt.color }}>{opt.features}</p>
                      </div>
                      <ArrowRight size={15} className="text-slate-600 group-hover:text-slate-300 ml-auto transition-all group-hover:translate-x-0.5" />
                    </div>
                    <p className="text-[11px] text-slate-400">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Other Roles</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Other roles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {OTHER_ROLES.map(r => {
                const Icon = r.icon;
                return (
                  <button key={r.id} type="button"
                    onClick={() => { setTopRole(r.id); setError(null); }}
                    className="flex flex-col items-center text-center p-4 rounded-2xl border border-white/10 hover:border-white/25 bg-slate-900/40 hover:bg-white/3 transition-all group gap-2"
                  >
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${r.color}18`, border: `1px solid ${r.color}30` }}>
                      <Icon size={18} style={{ color: r.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{r.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <button type="button" onClick={() => router.push('/login')} className="font-bold text-violet-400 hover:text-violet-300 transition-colors">Sign in</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            HOTEL / RESTAURANT WIZARD (5 steps)
        ══════════════════════════════════════════════════════════════════ */}
        {topRole === 'hotel' && (
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">

            <StepIndicator current={hotelStep} />

            {/* Step Header */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
              <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${curStep.color}20`, border: `1px solid ${curStep.color}40` }}>
                <curStep.icon size={18} style={{ color: curStep.color }} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: curStep.color }}>
                  Step {hotelStep} / {HOTEL_STEPS.length}
                </p>
                <h2 className="text-base font-extrabold text-white">{curStep.label}</h2>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
                <Shield size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
                <button onClick={() => setError(null)} className="text-rose-400 hover:text-white"><X size={13} /></button>
              </div>
            )}

            {/* ── STEP 1: Business Type ──────────────────────────────────── */}
            {hotelStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-slate-400">Select your business type. Features and dashboard will be tailored accordingly.</p>
                {BUSINESS_OPTS.map(opt => (
                  <button key={opt.type} type="button"
                    onClick={() => {
                      setBusinessType(opt.type);
                      if (opt.type === 'HOTEL') setCustomSelected(new Set(['HMS', 'INVENTORY', 'REPORTS', 'STAFF']));
                      else if (opt.type === 'RESTAURANT') setCustomSelected(new Set(['POS', 'TABLES', 'INVENTORY', 'REPORTS']));
                      else setCustomSelected(new Set(['POS', 'HMS', 'TABLES', 'INVENTORY', 'REPORTS']));
                    }}
                    className={`relative text-left p-4 rounded-2xl border-2 transition-all w-full ${businessType === opt.type ? 'bg-white/5' : 'border-white/10 hover:border-white/25 bg-slate-900/50'}`}
                    style={businessType === opt.type ? { borderColor: opt.color, boxShadow: `0 0 20px ${opt.color}20` } : {}}
                  >
                    {businessType === opt.type && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: opt.color }}>
                        <Check size={10} className="text-white" strokeWidth={3} />
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="text-2xl">{opt.emoji}</span>
                      <p className="text-sm font-extrabold text-white">{opt.title}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-1.5">{opt.desc}</p>
                    <p className="text-[10px] font-bold tracking-wider" style={{ color: businessType === opt.type ? opt.color : '#475569' }}>{opt.features}</p>
                  </button>
                ))}
              </div>
            )}

            {/* ── STEP 2: Account Details ────────────────────────────────── */}
            {hotelStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Full Name <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input id="signup-fullname" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                        placeholder="John Doe" />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Phone Number <span className="text-rose-400">*</span></label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input id="signup-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                        placeholder="+91 98765 43210" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email Address <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                      placeholder="owner@hotel.com" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Password <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input id="signup-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                      placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Plan ───────────────────────────────────────────── */}
            {hotelStep === 3 && (
              <div className="space-y-4">
                {loadingPkgs ? (
                  <div className="flex items-center justify-center py-8 gap-3">
                    <div className="w-5 h-5 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                    <span className="text-sm text-slate-400">Loading plans...</span>
                  </div>
                ) : (
                  <>
                    {!isCustomPlan && (
                      <>
                        {packages.length === 0 ? (
                          <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-sm text-emerald-300">
                            <Info size={16} /> <span>Free Trial will be activated on registration.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {packages.map(pkg => {
                              const isSelected = !isCustomPlan && packageId === pkg.id;
                              const color = pkg.color || PLAN_COLORS[pkg.name] || '#8b5cf6';
                              const isFree = pkg.priceINR === 0;
                              return (
                                <button key={pkg.id} type="button"
                                  onClick={() => { setIsCustomPlan(false); setPackageId(pkg.id); setSelectedPkg(pkg); setPaymentAmount(pkg.priceINR > 0 ? pkg.priceINR : null); setPaymentReference(''); }}
                                  className={`relative text-left p-4 rounded-2xl border-2 transition-all ${isSelected ? 'bg-white/5' : 'border-white/10 hover:border-white/25 bg-slate-900/50'}`}
                                  style={isSelected ? { borderColor: color, boxShadow: `0 0 20px ${color}20` } : {}}>
                                  {isSelected && (
                                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                                      <Check size={10} className="text-white" strokeWidth={3} />
                                    </span>
                                  )}
                                  <div className="flex items-center gap-2 mb-1.5" style={{ color: isSelected ? color : '#94a3b8' }}>
                                    {PLAN_ICONS[pkg.name] || <Zap size={16} />}
                                    <span className="text-sm font-extrabold text-white">{pkg.name}</span>
                                  </div>
                                  <div className="text-base font-black mb-1.5">
                                    {isFree ? <span style={{ color }}>Free</span>
                                      : <><span style={{ color }}>₹{pkg.priceINR.toLocaleString('en-IN')}</span><span className="text-xs font-normal text-slate-400 ml-1">/year</span></>}
                                  </div>
                                  {pkg.description && <p className="text-[11px] text-slate-400 mb-1.5 line-clamp-2">{pkg.description}</p>}
                                  {pkg.features?.slice(0, 4).map(f => (
                                    <div key={f.feature} className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                      <Check size={9} style={{ color }} strokeWidth={3} />
                                      {FEATURE_LABELS[f.feature] || f.feature}
                                    </div>
                                  ))}
                                  {pkg.features?.length > 4 && <p className="text-[10px] text-slate-500 mt-0.5 pl-3.5">+{pkg.features.length - 4} more</p>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                        <button type="button" onClick={() => { setIsCustomPlan(true); setPackageId(null); setSelectedPkg(null); setPaymentAmount(null); }}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed border-violet-500/40 hover:border-violet-500 bg-violet-500/5 hover:bg-violet-500/10 transition-all group">
                          <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center shrink-0 group-hover:bg-violet-500/30 transition-all">
                            <Wrench size={18} className="text-violet-400" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-extrabold text-white">🛠️ Build Your Own Plan</p>
                            <p className="text-[11px] text-slate-400">Pick only the features you need — pay per feature/year</p>
                          </div>
                          <ArrowRight size={16} className="text-violet-400 ml-auto group-hover:translate-x-1 transition-transform" />
                        </button>
                      </>
                    )}
                    {isCustomPlan && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wrench size={16} className="text-violet-400" />
                            <span className="text-sm font-extrabold text-white">Build Your Own Plan</span>
                          </div>
                          <button type="button" onClick={() => setIsCustomPlan(false)}
                            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
                            <X size={12} /> Back to plans
                          </button>
                        </div>
                        {['Core', 'Hospitality', 'Analytics', 'People', 'Marketing', 'Advanced', 'Integrations'].map(group => {
                          const groupFeatures = FEATURE_META.filter(f => f.group === group);
                          return (
                            <div key={group}>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">{group}</p>
                              <div className="grid grid-cols-1 gap-1.5">
                                {groupFeatures.map(f => {
                                  const fp = featurePrices.find(p => p.feature === f.key);
                                  const price = fp?.priceINR ?? 0;
                                  const checked = customSelected.has(f.key);
                                  return (
                                    <button key={f.key} type="button" onClick={() => toggleCustomFeature(f.key)}
                                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${checked ? 'bg-violet-500/15 border-violet-500/50' : 'border-white/8 bg-slate-900/40 hover:border-white/20'}`}>
                                      <span className="text-base w-6 text-center shrink-0">{f.icon}</span>
                                      <span className={`text-sm font-semibold flex-1 ${checked ? 'text-white' : 'text-slate-400'}`}>{f.label}</span>
                                      <span className={`text-xs font-bold shrink-0 ${checked ? 'text-violet-300' : 'text-slate-500'}`}>
                                        {price > 0 ? `₹${price.toLocaleString('en-IN')}/yr` : 'Free'}
                                      </span>
                                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${checked ? 'bg-violet-500 border-violet-500' : 'border-slate-600'}`}>
                                        {checked && <Check size={9} className="text-white" strokeWidth={3} />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur border border-violet-500/30 rounded-2xl p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{customSelected.size} features selected</p>
                            <p className="text-xl font-extrabold text-white">
                              {customTotal > 0
                                ? <><span className="text-violet-400">₹{customTotal.toLocaleString('en-IN')}</span><span className="text-sm font-normal text-slate-400 ml-1">/year</span></>
                                : <span className="text-emerald-400">Free</span>}
                            </p>
                          </div>
                        </div>
                        {customTotal > 0 && (
                          <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-2">
                            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold"><CreditCard size={13} /> PAYMENT REFERENCE</div>
                            <input type="text" value={paymentReference} onChange={e => setPaymentReference(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-900 border border-amber-500/30 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:border-amber-500 outline-none"
                              placeholder="UPI Ref ID" />
                          </div>
                        )}
                      </div>
                    )}
                    {!isCustomPlan && isPaidPlan && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-2">
                        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                          <CreditCard size={13} /> PAYMENT REFERENCE REQUIRED
                        </div>
                        <input type="text" value={paymentReference} onChange={e => setPaymentReference(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-900 border border-amber-500/30 rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:border-amber-500 outline-none"
                          placeholder="UPI Ref ID" />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── STEP 4: Property Details ───────────────────────────────── */}
            {hotelStep === 4 && (
              <div className="space-y-4">

                {/* Business type reminder pill */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-lg">{businessType === 'HOTEL' ? '🏨' : businessType === 'BOTH' ? '🏨🍽️' : '🍽️'}</span>
                  <div>
                    <p className="text-xs font-bold text-white">
                      {businessType === 'HOTEL' ? 'Hotel Only' : businessType === 'BOTH' ? 'Hotel + Restaurant (2 Properties)' : 'Restaurant / Dhaba'}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {businessType === 'HOTEL' ? 'Rooms, HMS, Housekeeping' : businessType === 'BOTH' ? 'Separate Hotel + Restaurant properties will be created' : 'POS, Tables, Delivery'}
                    </p>
                  </div>
                  <button type="button" onClick={() => setHotelStep(1)} className="ml-auto text-[10px] text-violet-400 hover:text-violet-300 font-bold">Change</button>
                </div>

                {/* ── Hotel / Single Property Form ─────────────── */}
                <div className={businessType === 'BOTH' ? 'p-4 border border-cyan-500/30 rounded-2xl bg-cyan-500/5 space-y-3' : 'space-y-4'}>
                  {businessType === 'BOTH' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🏨</span>
                      <p className="text-sm font-extrabold text-cyan-300">Hotel Property</p>
                    </div>
                  )}
                  <div>
                    <label className={labelCls}>
                      {businessType === 'HOTEL' ? 'Hotel Name' : businessType === 'BOTH' ? 'Hotel Name' : 'Restaurant Name'}{' '}
                      <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input id="signup-business-name" type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                        placeholder={businessType === 'HOTEL' || businessType === 'BOTH' ? 'e.g. Royal Crown Hotel' : 'e.g. Spice Garden Restaurant'} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Branch / Wing Name</label>
                      <input type="text" value={branchName} onChange={e => setBranchName(e.target.value)}
                        className={inputCls} placeholder={businessType === 'HOTEL' || businessType === 'BOTH' ? 'Main Hotel' : 'Main Branch'} />
                    </div>
                    <div>
                      <label className={labelCls}>Branch Code</label>
                      <div className="relative">
                        <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" value={branchCode} onChange={e => setBranchCode(e.target.value.toUpperCase())}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-mono font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                          placeholder={businessType === 'BOTH' ? 'HTL01' : 'e.g. B01'} />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>City</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" value={branchCity} onChange={e => setBranchCity(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                          placeholder="e.g. Manali" />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Address</label>
                      <input type="text" value={branchAddress} onChange={e => setBranchAddress(e.target.value)}
                        className={inputCls} placeholder="Mall Road, Manali" />
                    </div>
                  </div>
                </div>

                {/* ── BOTH: Restaurant (2nd) Property Form ─────── */}
                {businessType === 'BOTH' && (
                  <div className="p-4 border border-orange-500/30 rounded-2xl bg-orange-500/5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">🍽️</span>
                      <p className="text-sm font-extrabold text-orange-300">Restaurant Property</p>
                    </div>
                    <div>
                      <label className={labelCls}>Restaurant Name <span className="text-rose-400">*</span></label>
                      <div className="relative">
                        <Building2 size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" value={restaurantName} onChange={e => setRestaurantName(e.target.value)} required
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                          placeholder="e.g. Royal Crown Restaurant" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>Branch Name</label>
                        <input type="text" value={restaurantBranchCode} onChange={e => setRestaurantBranchCode(e.target.value.toUpperCase())}
                          className={inputCls} placeholder="RST01" />
                      </div>
                      <div>
                        <label className={labelCls}>City</label>
                        <div className="relative">
                          <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input type="text" value={restaurantBranchCity} onChange={e => setRestaurantBranchCity(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                            placeholder="e.g. Manali" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Restaurant Address</label>
                      <input type="text" value={restaurantBranchAddr} onChange={e => setRestaurantBranchAddr(e.target.value)}
                        className={inputCls} placeholder="Ground Floor, Mall Road, Manali" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 5: Services + Sub Users + Captcha + Submit ─── */}
            {hotelStep === 5 && (
              <div className="space-y-4">

                {/* ── HOTEL ONLY ── */}
                {businessType === 'HOTEL' && (
                  <>
                    <div className="p-4 bg-cyan-500/10 border border-cyan-500/25 rounded-2xl">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1">🏨 Hotel Management System</div>
                      <p className="text-[11px] text-slate-400">Rooms, bookings, check-in/out, housekeeping, reports — all included. No POS will be added.</p>
                    </div>

                    {/* Hotel Receptionist toggle */}
                    <div className="border border-white/10 rounded-2xl overflow-hidden">
                      <button type="button" onClick={() => setShowHotelRecepForm(v => !v)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition-all">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
                          <User size={15} className="text-cyan-400" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-bold text-white">Add Hotel Receptionist / Front Desk</p>
                          <p className="text-[10px] text-slate-400">Will manage check-in/out and reservations</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${showHotelRecepForm ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showHotelRecepForm ? 'left-5' : 'left-0.5'}`} />
                        </div>
                      </button>
                      {showHotelRecepForm && (
                        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Receptionist Login Details</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Full Name</label>
                              <input type="text" value={hotelRecepName} onChange={e => setHotelRecepName(e.target.value)}
                                className={inputCls} placeholder="Receptionist Name" />
                            </div>
                            <div>
                              <label className={labelCls}>Email</label>
                              <input type="email" value={hotelRecepEmail} onChange={e => setHotelRecepEmail(e.target.value)}
                                className={inputCls} placeholder="reception@hotel.com" />
                            </div>
                          </div>
                          <div className="relative">
                            <label className={labelCls}>Password</label>
                            <input type={showHotelRecepPass ? 'text' : 'password'} value={hotelRecepPassword} onChange={e => setHotelRecepPassword(e.target.value)}
                              className="w-full pl-4 pr-10 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                              placeholder="Min. 6 characters" />
                            <button type="button" onClick={() => setShowHotelRecepPass(v => !v)} className="absolute right-3.5 top-[34px] text-slate-400 hover:text-white">
                              {showHotelRecepPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── RESTAURANT ONLY ── */}
                {businessType === 'RESTAURANT' && (
                  <>
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400">Select your restaurant services. You can change these later from Settings.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <ServiceToggle label="Restaurant POS" desc="Billing, KOT, tables" icon={Utensils} color="#f97316" value={restaurantPosEnabled} onChange={setRestaurantPosEnabled} />
                        <ServiceToggle label="Bar POS" desc="Drinks, bar billing" icon={Beer} color="#a855f7" value={barPosEnabled} onChange={setBarPosEnabled} />
                        <ServiceToggle label="Cafe POS" desc="Coffee, snacks billing" icon={Coffee} color="#f59e0b" value={cafePosEnabled} onChange={setCafePosEnabled} />
                        <ServiceToggle label="Delivery" desc="Online delivery orders" icon={Bike} color="#22c55e" value={deliveryEnabled} onChange={setDeliveryEnabled} />
                      </div>
                    </div>

                    {/* Restaurant POS User toggle */}
                    <div className="border border-white/10 rounded-2xl overflow-hidden">
                      <button type="button" onClick={() => setShowPosUserForm(v => !v)}
                        className="w-full flex items-center gap-3 p-4 hover:bg-white/3 transition-all">
                        <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                          <User size={15} className="text-orange-400" />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-bold text-white">Add POS User / Cashier</p>
                          <p className="text-[10px] text-slate-400">Will handle billing, KOT and table management</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${showPosUserForm ? 'bg-orange-500' : 'bg-slate-700'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showPosUserForm ? 'left-5' : 'left-0.5'}`} />
                        </div>
                      </button>
                      {showPosUserForm && (
                        <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">POS / Cashier Login Details</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelCls}>Full Name</label>
                              <input type="text" value={posFullName} onChange={e => setPosFullName(e.target.value)}
                                className={inputCls} placeholder="Cashier Name" />
                            </div>
                            <div>
                              <label className={labelCls}>Email</label>
                              <input type="email" value={posEmail} onChange={e => setPosEmail(e.target.value)}
                                className={inputCls} placeholder="pos@restaurant.com" />
                            </div>
                          </div>
                          <div className="relative">
                            <label className={labelCls}>Password</label>
                            <input type={showPosPass ? 'text' : 'password'} value={posPassword} onChange={e => setPosPassword(e.target.value)}
                              className="w-full pl-4 pr-10 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                              placeholder="Min. 6 characters" />
                            <button type="button" onClick={() => setShowPosPass(v => !v)} className="absolute right-3.5 top-[34px] text-slate-400 hover:text-white">
                              {showPosPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* ── BOTH: Hotel + Restaurant ── */}
                {businessType === 'BOTH' && (
                  <div className="space-y-3">

                    {/* Hotel Section */}
                    <div className="p-4 border border-cyan-500/25 rounded-2xl bg-cyan-500/5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏨</span>
                        <p className="text-sm font-extrabold text-cyan-300">Hotel Services</p>
                      </div>
                      <div className="p-3 bg-cyan-500/10 rounded-xl">
                        <p className="text-[11px] text-cyan-300">HMS, rooms, check-in/out, housekeeping — automatically enabled.</p>
                      </div>
                      {/* Hotel Receptionist toggle */}
                      <div className="border border-cyan-500/20 rounded-xl overflow-hidden">
                        <button type="button" onClick={() => setShowHotelRecepForm(v => !v)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/3 transition-all">
                          <User size={14} className="text-cyan-400 shrink-0" />
                          <div className="text-left flex-1">
                            <p className="text-xs font-bold text-white">Add Hotel Receptionist / Front Desk</p>
                            <p className="text-[10px] text-slate-400">Will manage check-in/out and reservations</p>
                          </div>
                          <div className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${showHotelRecepForm ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showHotelRecepForm ? 'left-5' : 'left-0.5'}`} />
                          </div>
                        </button>
                        {showHotelRecepForm && (
                          <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Receptionist Login Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelCls}>Full Name</label>
                                <input type="text" value={hotelRecepName} onChange={e => setHotelRecepName(e.target.value)}
                                  className={inputCls} placeholder="Receptionist Name" />
                              </div>
                              <div>
                                <label className={labelCls}>Email</label>
                                <input type="email" value={hotelRecepEmail} onChange={e => setHotelRecepEmail(e.target.value)}
                                  className={inputCls} placeholder="reception@hotel.com" />
                              </div>
                            </div>
                            <div className="relative">
                              <label className={labelCls}>Password</label>
                              <input type={showHotelRecepPass ? 'text' : 'password'} value={hotelRecepPassword} onChange={e => setHotelRecepPassword(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm text-white placeholder-slate-500 focus:border-cyan-500 outline-none"
                                placeholder="Min. 6 characters" />
                              <button type="button" onClick={() => setShowHotelRecepPass(v => !v)} className="absolute right-3.5 top-[34px] text-slate-400 hover:text-white">
                                {showHotelRecepPass ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Restaurant Section */}
                    <div className="p-4 border border-orange-500/25 rounded-2xl bg-orange-500/5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🍽️</span>
                        <p className="text-sm font-extrabold text-orange-300">Restaurant Services</p>
                      </div>
                      <p className="text-[11px] text-slate-400">Select the restaurant services to enable. You can change these later from Settings.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <ServiceToggle label="Restaurant POS" desc="Billing, KOT, tables" icon={Utensils} color="#f97316" value={restaurantPosEnabled} onChange={setRestaurantPosEnabled} />
                        <ServiceToggle label="Bar POS" desc="Drinks, bar billing" icon={Beer} color="#a855f7" value={barPosEnabled} onChange={setBarPosEnabled} />
                        <ServiceToggle label="Cafe POS" desc="Coffee, snacks billing" icon={Coffee} color="#f59e0b" value={cafePosEnabled} onChange={setCafePosEnabled} />
                        <ServiceToggle label="Delivery" desc="Online delivery orders" icon={Bike} color="#22c55e" value={deliveryEnabled} onChange={setDeliveryEnabled} />
                      </div>
                      {/* Restaurant POS User toggle */}
                      <div className="border border-orange-500/20 rounded-xl overflow-hidden">
                        <button type="button" onClick={() => setShowPosUserForm(v => !v)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/3 transition-all">
                          <User size={14} className="text-orange-400 shrink-0" />
                          <div className="text-left flex-1">
                            <p className="text-xs font-bold text-white">Add Restaurant POS User / Cashier</p>
                            <p className="text-[10px] text-slate-400">Will handle billing, KOT and table management</p>
                          </div>
                          <div className={`w-10 h-5 rounded-full transition-all relative shrink-0 ${showPosUserForm ? 'bg-orange-500' : 'bg-slate-700'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${showPosUserForm ? 'left-5' : 'left-0.5'}`} />
                          </div>
                        </button>
                        {showPosUserForm && (
                          <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">POS / Cashier Login Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className={labelCls}>Full Name</label>
                                <input type="text" value={posFullName} onChange={e => setPosFullName(e.target.value)}
                                  className={inputCls} placeholder="POS User Name" />
                              </div>
                              <div>
                                <label className={labelCls}>Email</label>
                                <input type="email" value={posEmail} onChange={e => setPosEmail(e.target.value)}
                                  className={inputCls} placeholder="pos@restaurant.com" />
                              </div>
                            </div>
                            <div className="relative">
                              <label className={labelCls}>Password</label>
                              <input type={showPosPass ? 'text' : 'password'} value={posPassword} onChange={e => setPosPassword(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm text-white placeholder-slate-500 focus:border-orange-500 outline-none"
                                placeholder="Min. 6 characters" />
                              <button type="button" onClick={() => setShowPosPass(v => !v)} className="absolute right-3.5 top-[34px] text-slate-400 hover:text-white">
                                {showPosPass ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Captcha */}
                <div className="p-3 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center gap-3">
                  <div className="h-11 w-32 bg-white rounded-xl overflow-hidden shrink-0">
                    {captchaSvg
                      ? <div dangerouslySetInnerHTML={{ __html: captchaSvg }} className="w-full h-full flex items-center justify-center" />
                      : <div className="w-full h-full bg-slate-200" />}
                  </div>
                  <button type="button" onClick={refreshCaptcha} className="p-2 text-slate-400 hover:text-white shrink-0"><RefreshCcw size={15} /></button>
                  <input id="signup-captcha" type="text" required placeholder="Captcha Code" value={captchaText} onChange={e => setCaptchaText(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-sm text-white outline-none" />
                </div>

                {/* Submit */}
                <button id="signup-submit-btn" type="button" disabled={loading || !captchaText} onClick={handleHotelRegister}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50 flex items-center justify-center gap-2 group">
                  {loading
                    ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Crown size={16} />
                        {businessType === 'HOTEL' ? 'Create Hotel Account & Open Portal'
                          : businessType === 'BOTH' ? 'Create Hotel + Restaurant Account'
                          : 'Create Restaurant Account & Open Portal'}
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>}
                </button>
              </div>
            )}

            {/* ── Back / Next ────────────────────────────────────────────── */}
            {hotelStep < 5 && (
              <div className="flex mt-6 pt-4 border-t border-white/10 justify-between">
                <button type="button"
                  onClick={() => {
                    setError(null);
                    if (hotelStep <= 2) {
                      // Go back to role selection (step 2 is the first step when coming from landing)
                      setTopRole(null);
                      setHotelStep(1);
                    } else if (hotelStep === 3) {
                      setHotelStep(2);
                    } else {
                      setHotelStep(s => s - 1);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-white/15 text-slate-300 hover:bg-white/5 text-sm font-bold transition-all">
                  <ArrowLeft size={15} /> {hotelStep <= 2 ? 'Change Role' : 'Back'}
                </button>
                <button type="button" disabled={!stepValid()} onClick={() => { setError(null); setHotelStep(s => s + 1); }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-white text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: `linear-gradient(135deg, ${curStep.color}, ${curStep.color}90)`, boxShadow: stepValid() ? `0 4px 16px ${curStep.color}30` : 'none' }}>
                  Next Step <ArrowRight size={15} />
                </button>
              </div>
            )}

            {/* Sign-in link */}
            <div className="mt-6 pt-5 border-t border-white/10 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <button type="button" onClick={() => router.push('/login')} className="font-bold text-violet-400 hover:text-violet-300 transition-colors">Sign in now</button>
            </div>

            {/* Selected business type badge shown in wizard (Step 2+) */}
            {hotelStep >= 2 && (
              <div className="mt-3 flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border"
                  style={{
                    borderColor: businessType === 'HOTEL' ? '#06b6d440' : businessType === 'BOTH' ? '#8b5cf640' : '#f9731640',
                    color: businessType === 'HOTEL' ? '#06b6d4' : businessType === 'BOTH' ? '#8b5cf6' : '#f97316',
                    background: businessType === 'HOTEL' ? '#06b6d410' : businessType === 'BOTH' ? '#8b5cf610' : '#f9731610',
                  }}>
                  {businessType === 'HOTEL' ? '🏨 Hotel Only' : businessType === 'BOTH' ? '🏨🍽️ Hotel + Restaurant' : '🍽️ Restaurant'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            NON-HOTEL ROLES (Driver / B2B Supplier / Singer)
        ══════════════════════════════════════════════════════════════════ */}
        {topRole && topRole !== 'hotel' && (
          <div className="bg-slate-900/90 border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">

            {/* Role header */}
            {(() => {
              const r = OTHER_ROLES.find(r => r.id === topRole);
              if (!r) return null;
              const RIcon = r.icon;
              return (
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${r.color}18`, border: `1px solid ${r.color}30` }}>
                    <RIcon size={20} style={{ color: r.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registering as</p>
                    <p className="text-base font-extrabold text-white">{r.label}</p>
                  </div>
                  <button type="button" onClick={() => { setTopRole(null); setError(null); }}
                    className="ml-auto text-xs text-slate-400 hover:text-white font-bold flex items-center gap-1 border border-white/10 hover:border-white/25 rounded-xl px-3 py-1.5 transition-all">
                    <X size={11} /> Change
                  </button>
                </div>
              );
            })()}

            {error && (
              <div className="mb-5 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm">
                <Shield size={17} className="text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{topRole === 'SINGER' ? 'Stage / Artist Name' : 'Full Name'} <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                      placeholder={topRole === 'SINGER' ? 'e.g. DJ Rahul' : 'John Doe'} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Email Address <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                      placeholder="name@example.com" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Password <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} minLength={6}
                      className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                      placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Phone Number <span className="text-rose-400">*</span></label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                      placeholder="+91 98765 43210" />
                  </div>
                </div>
              </div>

              {topRole === 'DELIVERY_RIDER' && (
                <DriverRegistrationForm city={city} setCity={setCity} stateRegion={stateRegion} setStateRegion={setStateRegion}
                  licenceNumber={licenceNumber} setLicenceNumber={setLicenceNumber} idNumber={idNumber} setIdNumber={setIdNumber}
                  vehicleType={vehicleType} setVehicleType={setVehicleType} vehicleNumber={vehicleNumber} setVehicleNumber={setVehicleNumber}
                  vehicleModel={vehicleModel} setVehicleModel={setVehicleModel} seatsCapacity={seatsCapacity} setSeatsCapacity={setSeatsCapacity}
                  perKmRate={perKmRate} setPerKmRate={setPerKmRate} baseFee={baseFee} setBaseFee={setBaseFee}
                  profilePhoto={profilePhoto} setProfilePhoto={setProfilePhoto} licencePhoto={licencePhoto} setLicencePhoto={setLicencePhoto}
                  idPhoto={idPhoto} setIdPhoto={setIdPhoto} rcPhoto={rcPhoto} setRcPhoto={setRcPhoto} />
              )}
              {topRole === 'B2B_SUPPLIER' && (
                <SupplierRegistrationForm category={category} setCategory={setCategory} gstNumber={gstNumber} setGstNumber={setGstNumber} address={address} setAddress={setAddress} />
              )}
              {topRole === 'SINGER' && (
                <SingerRegistrationForm genre={genre} setGenre={setGenre} bio={bio} setBio={setBio} />
              )}

              {/* Captcha */}
              <div className="p-3 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center gap-3">
                <div className="h-11 w-32 bg-white rounded-xl overflow-hidden shrink-0">
                  {captchaSvg
                    ? <div dangerouslySetInnerHTML={{ __html: captchaSvg }} className="w-full h-full flex items-center justify-center" />
                    : <div className="w-full h-full bg-slate-200" />}
                </div>
                <button type="button" onClick={refreshCaptcha} className="p-2 text-slate-400 hover:text-white shrink-0"><RefreshCcw size={15} /></button>
                <input type="text" required placeholder="Captcha Code" value={captchaText} onChange={e => setCaptchaText(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-sm text-white outline-none" />
              </div>

              <button type="submit" disabled={loading || !captchaText}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50 flex items-center justify-center gap-2 group mt-2">
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <>{topRole === 'DELIVERY_RIDER' ? 'Submit & Create Driver Account' : 'Create Account & Open Portal'}<ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>

            <div className="mt-7 pt-5 border-t border-white/10 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <button type="button" onClick={() => router.push('/login')} className="font-bold text-violet-400 hover:text-violet-300 transition-colors">Sign in now</button>
            </div>
          </div>
        )}
      </div>

      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
    </div>
  );
}
