'use client';

import React from 'react';
import { Bike, Store, MapPin, Shield, FileText, CheckCircle2, IndianRupee } from 'lucide-react';

interface BikeRentalRegistrationFormProps {
  shopName: string;
  setShopName: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  stateRegion: string;
  setStateRegion: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  fleetSize: string;
  setFleetSize: (v: string) => void;
  primaryCategory: string;
  setPrimaryCategory: (v: string) => void;
  securityDeposit: string;
  setSecurityDeposit: (v: string) => void;
  helmetsIncluded: string;
  setHelmetsIncluded: (v: string) => void;
  gstNumber: string;
  setGstNumber: (v: string) => void;
}

export function BikeRentalRegistrationForm({
  shopName, setShopName,
  city, setCity,
  stateRegion, setStateRegion,
  address, setAddress,
  fleetSize, setFleetSize,
  primaryCategory, setPrimaryCategory,
  securityDeposit, setSecurityDeposit,
  helmetsIncluded, setHelmetsIncluded,
  gstNumber, setGstNumber,
}: BikeRentalRegistrationFormProps) {
  return (
    <div className="space-y-4 text-left pt-2">
      {/* ── Section 1: Shop & Agency Profile ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-rose-400 border-b border-white/10 pb-2">
          <Store size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">1. Bike Rental Agency / Shop</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Shop / Brand Name <span className="text-rose-400">*</span>
            </label>
            <input
              required
              type="text"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none transition-colors"
              placeholder="e.g. Royal Riders & Bike Rentals"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              GST / Business Reg. No. (Optional)
            </label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none uppercase transition-colors"
              placeholder="e.g. 02ABCDE1234F1Z5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              City / Destination <span className="text-rose-400">*</span>
            </label>
            <input
              required
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none transition-colors"
              placeholder="e.g. Manali, Shimla, Goa, Rishikesh"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              State / Region
            </label>
            <input
              type="text"
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none transition-colors"
              placeholder="e.g. Himachal Pradesh / Goa"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Shop Pickup Address <span className="text-rose-400">*</span>
          </label>
          <input
            required
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none transition-colors"
            placeholder="e.g. Near Mall Road Tourism Lift, Shop #12"
          />
        </div>
      </div>

      {/* ── Section 2: Fleet & Policies ── */}
      <div className="bg-slate-950/80 border border-white/10 p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-rose-400 border-b border-white/10 pb-2">
          <Bike size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">2. Fleet Details & Rental Policy</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Primary Fleet Category
            </label>
            <select
              value={primaryCategory}
              onChange={(e) => setPrimaryCategory(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white focus:border-rose-500 outline-none transition-colors"
            >
              <option value="SCOOTER">Scooters & Activa</option>
              <option value="CRUISER">Royal Enfield & Cruisers</option>
              <option value="SPORTS">Sports & Mountain Bikes</option>
              <option value="ELECTRIC">Electric Scooters & EV Bikes</option>
              <option value="MIXED">Mixed Multi-Category Fleet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Estimated 2-Wheeler Fleet Size
            </label>
            <select
              value={fleetSize}
              onChange={(e) => setFleetSize(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white focus:border-rose-500 outline-none transition-colors"
            >
              <option value="1-5">1 – 5 Bikes / Scooters</option>
              <option value="5-15">5 – 15 Bikes</option>
              <option value="15-30">15 – 30 Bikes</option>
              <option value="30+">30+ Large Fleet</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Default Security Deposit (₹)
            </label>
            <input
              type="number"
              value={securityDeposit}
              onChange={(e) => setSecurityDeposit(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white placeholder-slate-500 focus:border-rose-500 outline-none transition-colors"
              placeholder="e.g. 1000"
            />
            <p className="text-[10px] text-slate-500 mt-1">Refundable upon vehicle return</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
              Helmets Included per Bike
            </label>
            <select
              value={helmetsIncluded}
              onChange={(e) => setHelmetsIncluded(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-white/15 rounded-2xl text-sm font-medium text-white focus:border-rose-500 outline-none transition-colors"
            >
              <option value="1">1 Helmet (Rider)</option>
              <option value="2">2 Helmets (Rider + Pillion)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Mandatory traffic compliance</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <Shield size={14} className="shrink-0 text-rose-400" />
          <span>Vendors can add and update individual bikes with rates, plate numbers, and photos inside the portal.</span>
        </div>
      </div>
    </div>
  );
}
