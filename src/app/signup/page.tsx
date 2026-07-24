'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock, Mail, Eye, EyeOff, ArrowRight, Shield, RefreshCcw,
  User, Store, Truck, Package, Mic, Utensils, Phone, ChevronDown
} from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import { APIError } from '@/lib/api/client';

// ── Modular Portal Registration Forms ──
import { HotelOwnerRegistrationForm } from '@/components/auth/HotelOwnerRegistrationForm';
import { DriverRegistrationForm } from '@/components/auth/DriverRegistrationForm';
import { SupplierRegistrationForm } from '@/components/auth/SupplierRegistrationForm';
import { SingerRegistrationForm } from '@/components/auth/SingerRegistrationForm';

const SIGNUP_ROLES = [
  { id: 'RESTAURANTS_ADMIN', label: 'Hotel & Restaurant Owner', icon: Store },
  { id: 'DELIVERY_RIDER', label: 'Driver Portal (Cab / Taxi / Delivery)', icon: Truck },
  { id: 'B2B_SUPPLIER', label: 'B2B Vendor / Supplier', icon: Package },
  { id: 'SINGER', label: 'Singer & Live Artist', icon: Mic },
];

export default function SignupPage() {
  const router = useRouter();

  // ── Registration Form State ──
  const [signupRole, setSignupRole] = useState('RESTAURANTS_ADMIN');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Vegetables');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [genre, setGenre] = useState('Bollywood');
  const [bio, setBio] = useState('');
  const [branchCode, setBranchCode] = useState('');

  // ── Driver Specific Registration State ──
  const [city, setCity] = useState('Mandi');
  const [stateRegion, setStateRegion] = useState('Himachal Pradesh');
  const [licenceNumber, setLicenceNumber] = useState('DL-1420230012345');
  const [idNumber, setIdNumber] = useState('1234 5678 9012');
  const [vehicleModel, setVehicleModel] = useState('Innova Crysta / Volvo');
  const [seatsCapacity, setSeatsCapacity] = useState(4);
  const [perKmRate, setPerKmRate] = useState(15);
  const [baseFee, setBaseFee] = useState(50);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [licencePhoto, setLicencePhoto] = useState('');
  const [idPhoto, setIdPhoto] = useState('');
  const [rcPhoto, setRcPhoto] = useState('');

  // ── Global UI & Captcha State ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/website/settings')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data.logoUrl) {
          setLogoUrl(json.data.logoUrl);
        }
      })
      .catch(() => {});
    refreshCaptcha();
  }, []);

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

  const completeLogin = async () => {
    const res = await fetch('/api/auth/session');
    const data = await res.json();

    if (data.authenticated) {
      const role = data.user.role;
      const isHotelProperty = data.user.propertyType === 'HOTEL';
      const isHotelRole = role.startsWith('HOTEL_');

      if (role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard');
      } else if (role === 'RESTAURANTS_ADMIN') {
        if (isHotelProperty) {
          router.push('/hotel');
        } else {
          const slug = data.user.organizationSlug;
          router.push(slug ? `/restaurantadmin/${slug}` : '/hotel');
        }
      } else if (role === 'HOTEL_ADMIN' || role === 'HOTEL_MANAGER' || isHotelRole || isHotelProperty) {
        router.push('/hotel');
      } else if (role === 'B2B_SUPPLIER') {
        const propCode = data.user.propertyCode;
        router.push(propCode ? `/${propCode}/b2b/supplier` : '/b2b/supplier');
      } else if (role === 'DELIVERY_RIDER') {
        router.push('/transport-portal/dashboard');
      } else if (role === 'SINGER') {
        router.push('/singer-portal');
      } else {
        const propCode = data.user.propertyCode;
        router.push(propCode ? `/${propCode}/operations` : '/staff-portal');
      }
    } else {
      router.push('/login');
    }

    router.refresh();
  };

  // ── Unified Registration Handler ──
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (signupRole === 'SINGER') {
        // Singer Registration
        const res = await fetch('/api/singer/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fullName,
            email,
            password,
            phone,
            genre,
            bio,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Singer registration failed.');
        }
        // Auto-login after registration — store token and go to dashboard
        if (data.token && data.singer) {
          localStorage.setItem('singer_token', data.token);
          localStorage.setItem('singer_info', JSON.stringify(data.singer));
        }
        router.push('/singer-portal/dashboard');
        router.refresh();
        return;
      } else {
        // Multi-Role Registration
        await authApi.register({
          fullName,
          email,
          password,
          businessName: businessName || null,
          captchaText,
          captchaToken,
          roleName: signupRole,
          phone: phone || null,
          vehicleType: vehicleType || null,
          vehicleNumber: vehicleNumber || null,
          deliveryLocation: deliveryLocation || null,
          gstNumber: gstNumber || null,
          category: category || null,
          address: address || null,
          branchCode: branchCode || null,
        });

        // Auto login after registration
        const loginRes = await authApi.login({
          email,
          password,
          captchaText,
          captchaToken,
        });

        if (loginRes.twoFactorRequired) {
          router.push('/login');
        } else {
          await completeLogin();
        }
      }
    } catch (err: any) {
      const msg = err instanceof APIError ? err.message : err?.message || 'Registration failed.';
      setError(msg);
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px]" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-rose-600/10 blur-[150px]" />
      </div>

      {/* Main Registration Card */}
      <div className="relative z-10 w-full max-w-[560px] bg-slate-900/90 border border-white/15 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl my-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain mb-3 drop-shadow" />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-600/20 mb-3">
              <span className="text-white font-black text-xl italic">GF</span>
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Create Account
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Choose your role and enter your details to get started.
          </p>
        </div>

        {/* Sleek Role Selection Dropdown */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Select Account Type / Role <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-400 pointer-events-none">
              {signupRole === 'RESTAURANTS_ADMIN' && <Store size={18} />}
              {signupRole === 'DELIVERY_RIDER' && <Truck size={18} />}
              {signupRole === 'B2B_SUPPLIER' && <Package size={18} />}
              {signupRole === 'SINGER' && <Mic size={18} />}
            </div>
            <select
              value={signupRole}
              onChange={(e) => setSignupRole(e.target.value)}
              className="w-full pl-11 pr-10 py-3.5 bg-slate-950/90 border border-violet-500/50 rounded-2xl text-sm font-bold text-white focus:border-violet-400 outline-none appearance-none shadow-lg cursor-pointer transition-all"
            >
              {SIGNUP_ROLES.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white font-semibold py-2">
                  {r.label}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-sm font-medium">
            <Shield size={18} className="text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Name & Email Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                {signupRole === 'SINGER' ? 'Stage / Artist Name' : 'Full Name'} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                  placeholder={signupRole === 'SINGER' ? 'e.g. DJ Rahul' : 'John Doe'}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email Address <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          </div>

          {/* Password & Phone Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full pl-10 pr-10 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {(signupRole === 'DELIVERY_RIDER' || signupRole === 'B2B_SUPPLIER' || signupRole === 'SINGER') && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── MODULAR PORTAL FORM RENDERING ── */}
          {signupRole === 'RESTAURANTS_ADMIN' && (
            <HotelOwnerRegistrationForm
              businessName={businessName}
              setBusinessName={setBusinessName}
            />
          )}

          {signupRole === 'DELIVERY_RIDER' && (
            <DriverRegistrationForm
              city={city}
              setCity={setCity}
              stateRegion={stateRegion}
              setStateRegion={setStateRegion}
              licenceNumber={licenceNumber}
              setLicenceNumber={setLicenceNumber}
              idNumber={idNumber}
              setIdNumber={setIdNumber}
              vehicleType={vehicleType}
              setVehicleType={setVehicleType}
              vehicleNumber={vehicleNumber}
              setVehicleNumber={setVehicleNumber}
              vehicleModel={vehicleModel}
              setVehicleModel={setVehicleModel}
              seatsCapacity={seatsCapacity}
              setSeatsCapacity={setSeatsCapacity}
              perKmRate={perKmRate}
              setPerKmRate={setPerKmRate}
              baseFee={baseFee}
              setBaseFee={setBaseFee}
              profilePhoto={profilePhoto}
              setProfilePhoto={setProfilePhoto}
              licencePhoto={licencePhoto}
              setLicencePhoto={setLicencePhoto}
              idPhoto={idPhoto}
              setIdPhoto={setIdPhoto}
              rcPhoto={rcPhoto}
              setRcPhoto={setRcPhoto}
            />
          )}

          {signupRole === 'B2B_SUPPLIER' && (
            <SupplierRegistrationForm
              category={category}
              setCategory={setCategory}
              gstNumber={gstNumber}
              setGstNumber={setGstNumber}
              address={address}
              setAddress={setAddress}
            />
          )}

          {signupRole === 'SINGER' && (
            <SingerRegistrationForm
              genre={genre}
              setGenre={setGenre}
              bio={bio}
              setBio={setBio}
            />
          )}

          {/* Captcha */}
          <div className="p-3 bg-slate-950/60 border border-white/10 rounded-2xl flex items-center gap-3">
            <div className="h-11 w-32 bg-white rounded-xl overflow-hidden relative shadow shrink-0">
              {captchaSvg ? (
                <div dangerouslySetInnerHTML={{ __html: captchaSvg }} className="w-full h-full flex items-center justify-center" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200" />
              )}
            </div>
            <button type="button" onClick={refreshCaptcha} className="p-2 text-slate-400 hover:text-white shrink-0">
              <RefreshCcw size={16} />
            </button>
            <input
              type="text"
              required
              placeholder="Captcha Code"
              value={captchaText}
              onChange={(e) => setCaptchaText(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-white/15 rounded-xl text-sm text-white outline-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !captchaText}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 text-white rounded-2xl font-bold text-sm tracking-wide transition-all shadow-lg shadow-violet-600/30 disabled:opacity-50 flex items-center justify-center gap-2 group mt-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {signupRole === 'DELIVERY_RIDER' ? 'Submit & Create Professional Driver Account' : 'Create Account & Open Portal'}
                <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Link back to Sign In */}
        <div className="mt-8 pt-6 border-t border-white/10 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="font-bold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Sign in now
          </button>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
