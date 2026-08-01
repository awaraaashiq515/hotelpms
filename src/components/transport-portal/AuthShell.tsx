'use client';

import React, { useState } from 'react';
import { Bus, Car, Phone, Lock, User, Eye, EyeOff, Loader2, FileText, MapPin, Shield, CheckCircle, Upload, Camera, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

interface AuthShellProps {
  onAuthenticated: (driver: any, token: string) => void;
}

// Interactive Image Upload Box with Thumbnail Preview
function ImageUploadBox({
  label,
  value,
  onChange,
  icon: Icon
}: {
  label: string;
  value: string;
  onChange: (base64: string) => void;
  icon: any;
}) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string);
        toast.success(`${label} image selected! ✓`);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">{label}</label>
      <div className="relative border border-dashed border-slate-700/80 rounded-xl p-2.5 bg-slate-900/40 hover:border-blue-500/60 transition-all flex items-center gap-3">
        {value ? (
          <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-700">
            <img src={value} alt="Upload preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Icon size={15} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-white truncate">{value ? 'Image Uploaded ✓' : `Upload ${label}`}</p>
          <p className="text-[9px] text-slate-500">{value ? 'Click to replace image' : 'PNG, JPG up to 5MB'}</p>
        </div>

        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
      </div>
    </div>
  );
}

export function AuthShell({ onAuthenticated }: AuthShellProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    email: '',
    licenseNumber: '',
    idProofNumber: '',
    address: '',
    city: 'Mandi',
    state: 'Himachal Pradesh',
    photoUrl: '',
    licenseUrl: '',
    idProofUrl: '',
    rcUrl: '',
    // Vehicle details
    vehicleType: 'CAR',
    plateNumber: '',
    model: '',
    color: '',
    capacity: 4,
    perKmRate: 15,
    baseFare: 50,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone || !form.password) {
      toast.error('Phone and password are required');
      return;
    }
    if (mode === 'register') {
      if (!form.name || !form.licenseNumber || !form.plateNumber) {
        toast.error('Please fill in your name, license number, and vehicle plate number');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/transport/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          phone: form.phone,
          password: form.password,
          name: form.name,
          email: form.email,
          licenseNumber: form.licenseNumber,
          idProofNumber: form.idProofNumber,
          address: form.address,
          city: form.city,
          state: form.state,
          photoUrl: form.photoUrl,
          licenseUrl: form.licenseUrl,
          idProofUrl: form.idProofUrl,
          rcUrl: form.rcUrl,
          // Vehicle
          vehicleType: form.vehicleType,
          plateNumber: form.plateNumber,
          model: form.model,
          color: form.color,
          capacity: form.capacity,
          perKmRate: form.perKmRate,
          baseFare: form.baseFare,
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('transport_token', data.token);
        localStorage.setItem('transport_driver', JSON.stringify(data.driver));
        toast.success(`Welcome, ${data.driver.name}! Account registered successfully 🚗`);
        onAuthenticated(data.driver, data.token);
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch {
      toast.error('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[15%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute bottom-[5%] right-[10%] w-[400px] h-[400px] rounded-full bg-orange-500/8 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-xl my-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Bus className="text-white" size={22} />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Car className="text-white" size={22} />
            </div>
          </div>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">GuestFlow Transport</span>
          <h1 className="text-2xl font-black text-white mt-1 text-center">Driver Portal</h1>
          <p className="text-xs text-slate-400 mt-1 text-center">Professional Registration for Bus & Car Drivers</p>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0c1220]/90 border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Toggle */}
          <div className="flex bg-slate-900/80 rounded-2xl p-1 mb-6 border border-slate-800/40">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all duration-200 ${
                  mode === m
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Log In' : 'Driver Registration'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'login' ? (
              <>
                {/* Mobile Number */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="98XXXXXXXX"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* REGISTER FORM */
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-3 flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-blue-400 shrink-0" />
                  <p className="text-[10px] text-blue-300">Complete driver verification details & initial vehicle setup for Guest Portal listing.</p>
                </div>

                {/* 1. Driver Personal Info */}
                <div className="space-y-3">
                  <span className="text-xs font-black text-white block uppercase tracking-wider border-b border-slate-800 pb-1">
                    1. Driver Personal Details
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="John Doe"
                        value={form.name}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="98XXXXXXXX"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        placeholder="driver@example.com"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Password *</label>
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">City / Region *</label>
                      <input
                        type="text"
                        name="city"
                        required
                        placeholder="Mandi / Kullu / Manali"
                        value={form.city}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">State *</label>
                      <input
                        type="text"
                        name="state"
                        required
                        placeholder="Himachal Pradesh"
                        value={form.state}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <ImageUploadBox
                    label="Driver Profile Photo"
                    value={form.photoUrl}
                    onChange={(base64) => setForm(f => ({ ...f, photoUrl: base64 }))}
                    icon={Camera}
                  />
                </div>

                {/* 2. Documents */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-black text-white block uppercase tracking-wider border-b border-slate-800 pb-1">
                    2. Legal Documents Verification
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Driving License Number *</label>
                      <input
                        type="text"
                        name="licenseNumber"
                        required
                        placeholder="DL-1420230012345"
                        value={form.licenseNumber}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Aadhaar / ID Number</label>
                      <input
                        type="text"
                        name="idProofNumber"
                        placeholder="1234 5678 9012"
                        value={form.idProofNumber}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Document Image Uploads */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ImageUploadBox
                      label="Driving License Front Photo"
                      value={form.licenseUrl}
                      onChange={(base64) => setForm(f => ({ ...f, licenseUrl: base64 }))}
                      icon={FileCheck}
                    />

                    <ImageUploadBox
                      label="Aadhaar / ID Card Photo"
                      value={form.idProofUrl}
                      onChange={(base64) => setForm(f => ({ ...f, idProofUrl: base64 }))}
                      icon={FileText}
                    />
                  </div>
                </div>

                {/* 3. Vehicle Details & Pricing */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-black text-white block uppercase tracking-wider border-b border-slate-800 pb-1">
                    3. Vehicle & Per-KM Fare Pricing Details
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Vehicle Type *</label>
                      <select
                        name="vehicleType"
                        value={form.vehicleType}
                        onChange={handleChange}
                        className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="CAR">Car / Taxi</option>
                        <option value="BUS">Bus</option>
                        <option value="MINIBUS">Mini Bus</option>
                        <option value="VAN">Van</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Plate Number *</label>
                      <input
                        type="text"
                        name="plateNumber"
                        required
                        placeholder="HP 33 A 1234"
                        value={form.plateNumber}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Vehicle Model</label>
                      <input
                        type="text"
                        name="model"
                        placeholder="Innova Crysta / Volvo"
                        value={form.model}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Seats Capacity</label>
                      <input
                        type="number"
                        name="capacity"
                        min={1}
                        max={60}
                        value={form.capacity}
                        onChange={handleChange}
                        className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Per KM Rate Presets & Custom Input */}
                  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-black uppercase text-blue-400">
                        💰 Set Your Per-KM Rate (₹ / km) *
                      </label>
                      <span className="text-[10px] font-black text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">
                        ₹{form.perKmRate} / KM
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { rate: 12, label: '₹12 (Hatchback)' },
                        { rate: 15, label: '₹15 (Sedan/Cab)' },
                        { rate: 22, label: '₹22 (SUV/Innova)' },
                        { rate: 45, label: '₹45 (Bus/Coach)' },
                      ].map(p => (
                        <button
                          key={p.rate}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, perKmRate: p.rate }))}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            form.perKmRate === p.rate
                              ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Custom Rate (₹/km)</label>
                        <input
                          type="number"
                          name="perKmRate"
                          required
                          min={1}
                          value={form.perKmRate}
                          onChange={handleChange}
                          className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase text-slate-400 mb-1">Base Minimum Fee (₹)</label>
                        <input
                          type="number"
                          name="baseFare"
                          min={0}
                          value={form.baseFare}
                          onChange={handleChange}
                          className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-bold"
                        />
                      </div>
                    </div>

                    {/* Live Sample Ride Preview Card */}
                    <div className="bg-slate-950/80 rounded-xl p-2.5 text-[10px] text-slate-400 border border-slate-800 flex items-center justify-between">
                      <span>Sample 10 KM Trip Price:</span>
                      <span className="font-black text-green-400 text-xs">
                        ₹{form.baseFare + 10 * form.perKmRate} <span className="text-[9px] text-slate-500 font-normal">(Base ₹{form.baseFare} + ₹{form.perKmRate * 10})</span>
                      </span>
                    </div>
                  </div>

                  <ImageUploadBox
                    label="Vehicle Photo / RC Document"
                    value={form.rcUrl}
                    onChange={(base64) => setForm(f => ({ ...f, rcUrl: base64 }))}
                    icon={Car}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-xs py-3.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : mode === 'login' ? (
                'Sign In to Dashboard'
              ) : (
                'Submit & Create Professional Driver Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
