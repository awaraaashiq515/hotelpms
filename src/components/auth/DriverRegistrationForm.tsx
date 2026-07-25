'use client';

import React, { useState } from 'react';
import { User, FileText, Truck, Upload } from 'lucide-react';

interface DriverRegistrationFormProps {
  city: string;
  setCity: (v: string) => void;
  stateRegion: string;
  setStateRegion: (v: string) => void;
  licenceNumber: string;
  setLicenceNumber: (v: string) => void;
  idNumber: string;
  setIdNumber: (v: string) => void;
  vehicleType: string;
  setVehicleType: (v: string) => void;
  vehicleNumber: string;
  setVehicleNumber: (v: string) => void;
  vehicleModel: string;
  setVehicleModel: (v: string) => void;
  seatsCapacity: number;
  setSeatsCapacity: (v: number) => void;
  perKmRate: number;
  setPerKmRate: (v: number) => void;
  baseFee: number;
  setBaseFee: (v: number) => void;
  profilePhoto: string;
  setProfilePhoto: (v: string) => void;
  licencePhoto: string;
  setLicencePhoto: (v: string) => void;
  idPhoto: string;
  setIdPhoto: (v: string) => void;
  rcPhoto: string;
  setRcPhoto: (v: string) => void;
}

export function DriverRegistrationForm({
  city, setCity,
  stateRegion, setStateRegion,
  licenceNumber, setLicenceNumber,
  idNumber, setIdNumber,
  vehicleType, setVehicleType,
  vehicleNumber, setVehicleNumber,
  vehicleModel, setVehicleModel,
  seatsCapacity, setSeatsCapacity,
  perKmRate, setPerKmRate,
  baseFee, setBaseFee,
  profilePhoto, setProfilePhoto,
  licencePhoto, setLicencePhoto,
  idPhoto, setIdPhoto,
  rcPhoto, setRcPhoto,
}: DriverRegistrationFormProps) {
  return (
    <div className="space-y-5 text-left pt-2">
      {/* ── Section 1: Driver Personal Details ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-rose-400 border-b border-white/10 pb-2">
          <User size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">1. Driver Personal Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              City / Region <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none"
              placeholder="e.g. Mandi"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              State <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none"
              placeholder="e.g. Himachal Pradesh"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Driver Profile Photo
          </label>
          <div className="flex items-center gap-3 bg-slate-900/90 border border-dashed border-white/20 p-3 rounded-xl">
            <Upload size={18} className="text-rose-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">Upload Driver Profile Photo</p>
              <p className="text-[10px] text-slate-400">PNG, JPG up to 5MB</p>
            </div>
            <label className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0">
              {profilePhoto ? 'Change Photo' : 'Choose File'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setProfilePhoto(file.name);
                }}
              />
            </label>
          </div>
          {profilePhoto && <p className="text-xs text-emerald-400 mt-1 font-mono">✓ Selected: {profilePhoto}</p>}
        </div>
      </div>

      {/* ── Section 2: Legal Documents Verification ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-violet-400 border-b border-white/10 pb-2">
          <FileText size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">2. Legal Documents Verification</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Driving License Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={licenceNumber}
              onChange={(e) => setLicenceNumber(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none uppercase font-mono"
              placeholder="DL-1420230012345"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Aadhaar / ID Number
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none font-mono"
              placeholder="1234 5678 9012"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Driving License Front Photo
            </label>
            <div className="flex items-center gap-2 bg-slate-900/90 border border-dashed border-white/20 p-3 rounded-xl">
              <Upload size={16} className="text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-white">License Front Photo</p>
                <p className="text-[9px] text-slate-400">PNG, JPG up to 5MB</p>
              </div>
              <label className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold cursor-pointer shrink-0">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setLicencePhoto(file.name);
                  }}
                />
              </label>
            </div>
            {licencePhoto && <p className="text-[11px] text-emerald-400 mt-1 font-mono">✓ {licencePhoto}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Aadhaar / ID Card Photo
            </label>
            <div className="flex items-center gap-2 bg-slate-900/90 border border-dashed border-white/20 p-3 rounded-xl">
              <Upload size={16} className="text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-white">Aadhaar / ID Photo</p>
                <p className="text-[9px] text-slate-400">PNG, JPG up to 5MB</p>
              </div>
              <label className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold cursor-pointer shrink-0">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setIdPhoto(file.name);
                  }}
                />
              </label>
            </div>
            {idPhoto && <p className="text-[11px] text-emerald-400 mt-1 font-mono">✓ {idPhoto}</p>}
          </div>
        </div>
      </div>

      {/* ── Section 3: Vehicle & Per-KM Fare Pricing Details ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 border-b border-white/10 pb-2">
          <Truck size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">3. Vehicle & Per-KM Fare Pricing Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Vehicle Type <span className="text-rose-400">*</span>
            </label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white focus:border-rose-500 outline-none"
            >
              <option value="CAR">Car / Taxi</option>
              <option value="SUV">SUV / Innova</option>
              <option value="BIKE">Motorcycle / Bike</option>
              <option value="SCOOTER">Scooter / E-Bike</option>
              <option value="AUTO">Auto Rickshaw</option>
              <option value="BUS">Bus / Coach</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Plate Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none uppercase font-mono"
              placeholder="HP 33 A 1234"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Vehicle Model
            </label>
            <input
              type="text"
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none"
              placeholder="Innova Crysta / Volvo"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Seats Capacity
            </label>
            <input
              type="number"
              value={seatsCapacity}
              onChange={(e) => setSeatsCapacity(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none"
              placeholder="4"
            />
          </div>
        </div>

        {/* Per-KM Fare Rate Selector */}
        <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-xl space-y-3">
          <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            💰 Set Your Per-KM Rate (₹ / km) <span className="text-rose-400">*</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { rate: 12, label: '₹12 (Hatchback)' },
              { rate: 15, label: '₹15 (Sedan/Cab)' },
              { rate: 22, label: '₹22 (SUV/Innova)' },
              { rate: 45, label: '₹45 (Bus/Coach)' },
            ].map((preset) => (
              <button
                key={preset.rate}
                type="button"
                onClick={() => setPerKmRate(preset.rate)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  perKmRate === preset.rate
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-extrabold'
                    : 'bg-slate-950 text-slate-300 border-white/10 hover:border-emerald-500/50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Custom Rate (₹/km)</label>
              <input
                type="number"
                value={perKmRate}
                onChange={(e) => setPerKmRate(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-sm font-bold text-emerald-400 outline-none"
                placeholder="15"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Base Minimum Fee (₹)</label>
              <input
                type="number"
                value={baseFee}
                onChange={(e) => setBaseFee(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-white/15 rounded-xl text-sm font-bold text-white outline-none"
                placeholder="50"
              />
            </div>
          </div>

          {/* Sample 10 KM Trip Price Live Calculator */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-between">
            <span>Sample 10 KM Trip Price:</span>
            <span className="text-sm font-extrabold text-emerald-400">
              ₹{baseFee + (10 * perKmRate)} <span className="text-[10px] font-normal text-slate-400">(Base ₹{baseFee} + ₹{10 * perKmRate})</span>
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Vehicle Photo / RC Document
          </label>
          <div className="flex items-center gap-3 bg-slate-900/90 border border-dashed border-white/20 p-3 rounded-xl">
            <Upload size={18} className="text-emerald-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white">Upload Vehicle Photo / RC Document</p>
              <p className="text-[10px] text-slate-400">PNG, JPG up to 5MB</p>
            </div>
            <label className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0">
              {rcPhoto ? 'Change Document' : 'Choose File'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setRcPhoto(file.name);
                }}
              />
            </label>
          </div>
          {rcPhoto && <p className="text-xs text-emerald-400 mt-1 font-mono">✓ Selected: {rcPhoto}</p>}
        </div>
      </div>
    </div>
  );
}
