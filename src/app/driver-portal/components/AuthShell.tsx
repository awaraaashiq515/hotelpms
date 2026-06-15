'use client';

import React, { useState } from 'react';
import { Phone, Lock, Upload, ArrowRight, MessageSquare, Mail, User, Shield, Camera, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AuthShellProps {
  t: any;
  phone: string;
  setPhone: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (val: string) => void;
  fullNameInput: string;
  setFullNameInput: (val: string) => void;
  vehicleTypeInput: string;
  setVehicleTypeInput: (val: string) => void;
  propertyIdInput: string;
  setPropertyIdInput: (val: string) => void;
  shiftSlotInput: string;
  setShiftSlotInput: (val: string) => void;
  preferredZoneInput: string;
  setPreferredZoneInput: (val: string) => void;
  uploadedDocs: { licence: string; rc: string; idProof: string };
  setUploadedDocs: React.Dispatch<React.SetStateAction<{ licence: string; rc: string; idProof: string }>>;
  licenceNumberInput: string;
  setLicenceNumberInput: (val: string) => void;
  profilePhotoInput: string;
  setProfilePhotoInput: (val: string) => void;
  properties: { id: string; name: string; code: string }[];
  isSigningUp: boolean;
  setIsSigningUp: (val: boolean) => void;
  otpMode: 'LOGIN' | 'SIGNUP' | null;
  setOtpMode: (val: 'LOGIN' | 'SIGNUP' | null) => void;
  otpInput: string;
  setOtpInput: (val: string) => void;
  simulatedOtp: string;
  otpError: string | null;
  otpLoading: boolean;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  handleDirectLogin: (e: React.FormEvent, customPhone?: string, customEmail?: string) => void;
  handleRequestSignupOtp: (e: React.FormEvent, customPhone?: string, customEmail?: string) => void;
  handleVerifyOtp: (e: React.FormEvent) => void;
}

export function AuthShell({
  t,
  phone,
  setPhone,
  email,
  setEmail,
  vehicleNumber,
  setVehicleNumber,
  fullNameInput,
  setFullNameInput,
  vehicleTypeInput,
  setVehicleTypeInput,
  propertyIdInput,
  setPropertyIdInput,
  shiftSlotInput,
  setShiftSlotInput,
  preferredZoneInput,
  setPreferredZoneInput,
  uploadedDocs,
  setUploadedDocs,
  licenceNumberInput,
  setLicenceNumberInput,
  profilePhotoInput,
  setProfilePhotoInput,
  properties,
  isSigningUp,
  setIsSigningUp,
  otpMode,
  setOtpMode,
  otpInput,
  setOtpInput,
  simulatedOtp,
  otpError,
  otpLoading,
  passwordInput,
  setPasswordInput,
  handleDirectLogin,
  handleRequestSignupOtp,
  handleVerifyOtp
}: AuthShellProps) {
  // Login method selector: Phone vs Email
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [phoneOrEmailInput, setPhoneOrEmailInput] = useState('');

  // Sign up method selector: Phone vs Email
  const [signUpMethod, setSignUpMethod] = useState<'phone' | 'email'>('phone');

  const submitLoginRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const val = phoneOrEmailInput.trim();
    if (loginMethod === 'phone') {
      setPhone(val);
      setEmail('');
      handleDirectLogin(e, val, '');
    } else {
      setEmail(val);
      setPhone('');
      handleDirectLogin(e, '', val);
    }
  };

  const submitSignupRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const pVal = phone.trim();
    const eVal = email.trim();

    if (signUpMethod === 'phone') {
      if (!pVal) {
        alert("Mobile number is required for verification");
        return;
      }
    } else {
      if (!eVal) {
        alert("Email address is required for verification");
        return;
      }
    }

    handleRequestSignupOtp(e, pVal, eVal);
  };

  return (
    <div className="space-y-6 pt-2">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">
          {isSigningUp ? "Rider Onboarding" : "Rider Access"}
        </h2>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
          {isSigningUp 
            ? "Register your rider account, upload documents, and choose your shift."
            : "Authenticate with your phone number or email address instantly."}
        </p>
      </div>

      {/* Main Tab: Sign In vs Sign Up */}
      <div className="flex bg-[#0f172a] p-1 rounded-xl border border-[#1e293b] max-w-[260px] mx-auto">
        <button
          onClick={() => { setIsSigningUp(false); setOtpMode(null); }}
          className={`flex-1 py-1.5 text-center text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
            !isSigningUp ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.signIn}
        </button>
        <button
          onClick={() => { setIsSigningUp(true); setOtpMode(null); }}
          className={`flex-1 py-1.5 text-center text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
            isSigningUp ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t.signUp}
        </button>
      </div>

      {/* EMAIL GATEWAY DISPATCH STATUS */}
      {otpMode && signUpMethod === 'email' && (
        <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-4 text-center space-y-2 animate-in fade-in duration-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
            <Mail size={14} />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-450">Verification Email Sent</h4>
          <p className="text-[9px] text-slate-400 font-bold uppercase leading-relaxed max-w-[240px] mx-auto">
            A 4-digit code was sent to <span className="text-white font-mono">{email}</span>. Please check your inbox or spam folder.
          </p>
        </div>
      )}

      {/* DEMO SMS GATEWAY SIMULATOR */}
      {otpMode && signUpMethod === 'phone' && (
        <div className="bg-indigo-955/40 border border-indigo-500/25 rounded-2xl p-4 text-center space-y-2 animate-in fade-in duration-200">
          <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-bounce">
            <MessageSquare size={14} />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">SMS Gateway Simulator</h4>
          <p className="text-[9px] text-indigo-400 font-medium">
            OTP code dispatched to <span className="font-mono text-white font-extrabold">{phone}</span>.
          </p>
          <div className="bg-[#090b10] border border-[#1e293b] py-1.5 px-3 rounded-lg inline-block">
            <span className="text-[11px] font-bold text-slate-400 mr-1.5 uppercase">Verification OTP:</span>
            <span className="font-mono text-emerald-400 font-black text-sm tracking-widest">{simulatedOtp}</span>
          </div>
        </div>
      )}

      {/* STEP 1: LOGIN/SIGNUP FORMS */}
      {!otpMode && (
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-[2rem] p-5 shadow-xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-12 -mt-12 blur-xl" />
          
          {!isSigningUp ? (
            /* SIGN IN COMPONENT */
            <form onSubmit={submitLoginRequest} className="space-y-4">
              {/* Phone or Email selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Access Method</label>
                <div className="grid grid-cols-2 gap-2 bg-[#070b12] p-1 rounded-xl border border-[#1e293b]/70">
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('phone'); setPhoneOrEmailInput(''); }}
                    className={`py-1.5 text-center text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      loginMethod === 'phone' ? 'bg-[#1e293b] text-white' : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    Mobile Number
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginMethod('email'); setPhoneOrEmailInput(''); }}
                    className={`py-1.5 text-center text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      loginMethod === 'email' ? 'bg-[#1e293b] text-white' : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    Email Address
                  </button>
                </div>
              </div>

              {/* Dynamic Input Box */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                  {loginMethod === 'phone' ? 'Mobile Number' : 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    {loginMethod === 'phone' ? <Phone size={13} /> : <Mail size={13} />}
                  </div>
                  <input
                    type={loginMethod === 'phone' ? 'tel' : 'email'}
                    required
                    placeholder={loginMethod === 'phone' ? 'e.g. 9876543210' : 'e.g. rider@delivery.com'}
                    value={phoneOrEmailInput}
                    onChange={e => setPhoneOrEmailInput(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-650 focus:border-rose-500 outline-none text-xs font-bold"
                  />
                </div>
              </div>

              {/* Password Input Box */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={13} />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-650 focus:border-rose-500 outline-none text-xs font-bold"
                  />
                </div>
              </div>

              {/* Shift slots selection on login */}
              <div className="space-y-1.5 border-t border-[#1e293b]/60 pt-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Select Shift for Today</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'MORNING', label: 'Morning Shift', time: '7AM - 3PM' },
                    { key: 'AFTERNOON', label: 'Afternoon Shift', time: '3PM - 11PM' },
                    { key: 'EVENING', label: 'Evening Shift', time: '6PM - 2AM' },
                    { key: 'FULL_DAY', label: 'Full Day Shift', time: '9AM - 9PM' },
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setShiftSlotInput(item.key)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                        shiftSlotInput === item.key 
                          ? 'bg-rose-500/10 border-rose-500 text-rose-400' 
                          : 'bg-[#070b12] border-[#1e293b] hover:border-slate-700 text-slate-450'
                      }`}
                    >
                      <span className="text-[9.5px] font-black uppercase">{item.label}</span>
                      <span className="text-[7.5px] text-slate-500 font-bold">{item.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                loading={otpLoading}
                className="w-full h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/25"
              >
                Sign In & Access Portal <ArrowRight size={10} />
              </Button>
            </form>
          ) : (
            /* SIGN UP COMPONENT (Rider Profile Setup + Shift + Docs) */
            <form onSubmit={submitSignupRequest} className="space-y-4">
              
              {/* Profile Photo visual uploader */}
              <div className="flex flex-col items-center py-2 bg-[#070b12]/50 border border-dashed border-[#1e293b] rounded-2xl">
                {profilePhotoInput ? (
                  <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-rose-500 shadow-md">
                    <img src={profilePhotoInput} alt="Rider Profile" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setProfilePhotoInput('')}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[8px] font-black uppercase tracking-wider opacity-0 hover:opacity-100 transition-opacity"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center justify-center p-3 text-center space-y-1">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      <Camera size={16} />
                    </div>
                    <span className="text-[8.5px] font-black text-slate-350 uppercase">Rider Photo</span>
                    <span className="text-[7.5px] text-slate-500 font-bold uppercase">Click to Mock Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setProfilePhotoInput(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Profile Setup: Name */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">{t.fullName}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User size={13} />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={fullNameInput}
                    onChange={e => setFullNameInput(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-650 focus:border-rose-500 outline-none text-xs font-bold uppercase"
                  />
                </div>
              </div>

              {/* Registration Channel Selection */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">OTP Verification Channel</label>
                <div className="grid grid-cols-2 gap-2 bg-[#070b12] p-1 rounded-xl border border-[#1e293b]/70">
                  <button
                    type="button"
                    onClick={() => setSignUpMethod('phone')}
                    className={`py-1.5 text-center text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      signUpMethod === 'phone' ? 'bg-[#1e293b] text-white' : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    Send to Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignUpMethod('email')}
                    className={`py-1.5 text-center text-[8.5px] font-black uppercase tracking-wider rounded-lg transition-all ${
                      signUpMethod === 'email' ? 'bg-[#1e293b] text-white' : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    Send to Email
                  </button>
                </div>
                <p className="text-[7.5px] text-slate-500 font-bold uppercase ml-1">
                  * Select whether the 4-digit onboarding OTP code goes to your email or mobile.
                </p>
              </div>

              {/* Contact Credentials */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                    Mobile No. {signUpMethod === 'phone' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="tel"
                    required={signUpMethod === 'phone'}
                    placeholder={signUpMethod === 'phone' ? "e.g. 9876543210 (Required)" : "Optional"}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-650 focus:border-rose-500 outline-none text-xs font-bold font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">
                    Email Address {signUpMethod === 'email' && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="email"
                    required={signUpMethod === 'email'}
                    placeholder={signUpMethod === 'email' ? "e.g. ramesh@gmail.com (Required)" : "Optional"}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-650 focus:border-rose-500 outline-none text-xs font-bold"
                  />
                </div>
              </div>

              {/* Create Password */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Create Account Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock size={13} />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Create a strong password for login"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-650 focus:border-rose-500 outline-none text-xs font-bold"
                  />
                </div>
              </div>

              {/* Vehicle & Licence Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Vehicle Plate No.</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL-3C-5566"
                    value={vehicleNumber}
                    onChange={e => setVehicleNumber(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-650 focus:border-rose-500 outline-none text-xs font-bold uppercase"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Licence Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DL142023005"
                    value={licenceNumberInput}
                    onChange={e => setLicenceNumberInput(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-650 focus:border-rose-500 outline-none text-xs font-bold uppercase"
                  />
                </div>
              </div>

              {/* Vehicle Type & Outlet */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Vehicle Type</label>
                  <select
                    value={vehicleTypeInput}
                    onChange={e => setVehicleTypeInput(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white focus:border-rose-500 outline-none text-xs font-bold"
                  >
                    <option value="BIKE">🏍️ Motorbike</option>
                    <option value="SCOOTER">🛵 Scooter</option>
                    <option value="CAR">🚗 Car</option>
                    <option value="BICYCLE">🚲 Bicycle</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Select Outlet</label>
                  <select
                    value={propertyIdInput}
                    onChange={e => setPropertyIdInput(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white focus:border-rose-500 outline-none text-xs font-bold"
                  >
                    <option value="">🌍 All Outlets (Multi-Restaurant)</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Shift slots selection on login/signup */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">{t.shift}</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'MORNING', label: 'Morning Shift', time: '7AM - 3PM' },
                    { key: 'AFTERNOON', label: 'Afternoon Shift', time: '3PM - 11PM' },
                    { key: 'EVENING', label: 'Evening Shift', time: '6PM - 2AM' },
                    { key: 'FULL_DAY', label: 'Full Day Shift', time: '9AM - 9PM' },
                  ].map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setShiftSlotInput(item.key)}
                      className={`p-2.5 rounded-xl border text-left flex flex-col transition-all ${
                        shiftSlotInput === item.key 
                          ? 'bg-rose-500/10 border-rose-500 text-rose-400' 
                          : 'bg-[#070b12] border-[#1e293b] hover:border-slate-700 text-slate-450'
                      }`}
                    >
                      <span className="text-[9.5px] font-black uppercase">{item.label}</span>
                      <span className="text-[7.5px] text-slate-500 font-bold">{item.time}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Documents upload slots */}
              <div className="space-y-2 border-t border-[#1e293b]/60 pt-3">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">{t.documents}</label>
                
                <div className="space-y-2">
                  {[
                    { key: 'licence' as const, label: t.drivingLicense },
                    { key: 'rc' as const, label: t.vehicleRc },
                    { key: 'idProof' as const, label: t.idProof }
                  ].map(doc => (
                    <div key={doc.key} className="flex items-center justify-between bg-[#070b12] border border-[#1e293b]/70 p-2.5 rounded-xl">
                      <div>
                        <p className="text-[9.5px] font-bold text-slate-350">{doc.label}</p>
                        <p className="text-[8px] text-slate-500 truncate max-w-[190px]">
                          {uploadedDocs[doc.key] ? uploadedDocs[doc.key] : "No document selected"}
                        </p>
                      </div>
                      
                      <label className={`cursor-pointer px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-all ${
                        uploadedDocs[doc.key] 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-[#1e293b] hover:bg-[#28354c] text-slate-300 border border-[#334155]/60'
                      }`}>
                        <Upload size={8} />
                        {uploadedDocs[doc.key] ? 'Replace' : 'Upload'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0] || null;
                            if (file) {
                              setUploadedDocs(prev => ({ ...prev, [doc.key]: file.name }));
                            }
                          }}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                loading={otpLoading}
                className="w-full h-11 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
              >
                Sign Up & Verify OTP <ArrowRight size={10} />
              </Button>
            </form>
          )}
        </div>
      )}

      {/* STEP 2: VERIFY CODE INPUT */}
      {otpMode && (
        <form onSubmit={handleVerifyOtp} className="bg-[#0f172a] border border-[#1e293b] rounded-[2rem] p-5 shadow-xl space-y-4">
          <div className="text-center bg-[#070b12] p-3 rounded-xl border border-[#1e293b]/60">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Verify Account</span>
            <p className="text-xs font-black text-white font-mono">{phoneOrEmailInput || (signUpMethod === 'phone' ? phone : email)}</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center">Enter 4-Digit Verification Code</label>
            <div className="flex justify-center">
              <input
                type="text"
                maxLength={4}
                placeholder="••••"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-40 text-center text-2xl font-black font-mono py-2 rounded-xl bg-[#070b12] border border-[#1e293b] focus:border-rose-500 text-white tracking-[0.25em] outline-none transition-all"
                required
                disabled={otpLoading}
              />
            </div>
          </div>

          {otpError && (
            <p className="text-[9px] text-red-500 font-extrabold uppercase text-center bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-xl">
              ❌ {otpError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOtpMode(null)}
              className="flex-1 h-10 bg-[#1e293b] hover:bg-[#28354c] text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest border border-[#334155]/60"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={otpInput.length !== 4 || otpLoading}
              className="flex-1 h-10 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg"
            >
              Verify OTP
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
