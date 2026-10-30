'use client';

import React from 'react';
import { Hotel, MapPin, Building2, Phone, ShieldCheck, Percent, FileText, Bus, Car, Users } from 'lucide-react';

interface TravelAgentRegistrationFormProps {
  companyName: string;
  setCompanyName: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  stateRegion: string;
  setStateRegion: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  panNumber: string;
  setPanNumber: (v: string) => void;
  whatsappNumber: string;
  setWhatsappNumber: (v: string) => void;
  specialization: string;
  setSpecialization: (v: string) => void;
}

export function TravelAgentRegistrationForm({
  companyName, setCompanyName,
  city, setCity,
  stateRegion, setStateRegion,
  address, setAddress,
  panNumber, setPanNumber,
  whatsappNumber, setWhatsappNumber,
  specialization, setSpecialization,
}: TravelAgentRegistrationFormProps) {
  return (
    <div className="space-y-4 text-left pt-2">
      {/* ── Section 1: Agency Information ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-violet-400 border-b border-white/10 pb-2">
          <Building2 size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">1. Travel Agency & Business Details</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Agency / Company Name <span className="text-violet-400">*</span>
            </label>
            <input
              required
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none transition-colors"
              placeholder="e.g. Royal Himalayan Travels"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Business PAN / GST No.
            </label>
            <input
              type="text"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none uppercase transition-colors"
              placeholder="e.g. ABCDE1234F"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Operating City / Headquarters <span className="text-violet-400">*</span>
            </label>
            <input
              required
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none transition-colors"
              placeholder="e.g. Delhi, Chandigarh, Mumbai, Jaipur"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              WhatsApp Support Number
            </label>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none transition-colors"
              placeholder="+91 98765 00000"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Office / Business Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-violet-500 outline-none transition-colors"
            placeholder="Office #402, Tourism Complex, City Center"
          />
        </div>
      </div>

      {/* ── Section 2: Booking Focus ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-violet-400 border-b border-white/10 pb-2">
          <Hotel size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">2. Booking Specialization & Commissions</h3>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Primary Booking Type
          </label>
          <select
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white focus:border-violet-500 outline-none transition-colors"
          >
            <option value="ALL">All Services (Hotel Rooms + Buses + Cabs + Tours)</option>
            <option value="HOTELS">Hotel Rooms & Luxury Resorts</option>
            <option value="GROUP_TOURS">Corporate & Group Tours (Buses & Tempos)</option>
            <option value="SIGHTSEEING">Local Sightseeing & Holiday Packages</option>
          </select>
        </div>

        <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-violet-400">
            <Percent size={14} />
            <span>Standard Commission: 10% - 20% on Confirmed Bookings</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Your unique Agent Code (`AGT-XXXX`) will be assigned automatically upon submission. You will get instant access to live room inventory, group enquiries, and earnings tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
