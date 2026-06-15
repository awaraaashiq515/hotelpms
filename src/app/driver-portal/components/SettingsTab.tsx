'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Driver } from '../types';
import { User, Shield, Bike, Landmark, MapPin } from 'lucide-react';

interface SettingsTabProps {
  t: any;
  selectedDriver: Driver;
  onUpdateDriverField: (field: keyof Driver, value: any) => void;
  properties: { id: string; name: string; code: string }[];
  handleToggleDuty: () => void;
  preferredZoneInput: string;
  setPreferredZoneInput: (val: string) => void;
  lang: 'en' | 'hi' | 'hinglish';
  handleUpdateLanguage: (newLang: 'en' | 'hi' | 'hinglish') => void;
  fontSize: 'sm' | 'md' | 'lg';
  handleUpdateFontSize: (size: 'sm' | 'md' | 'lg') => void;
  leaveDateInput: string;
  setLeaveDateInput: (val: string) => void;
  leaveReasonInput: string;
  setLeaveReasonInput: (val: string) => void;
  handleApplyLeave: (e: React.FormEvent) => void;
  leaveRequests: { id: string; date: string; reason: string; status: string }[];
  profileSuccessMsg: string | null;
  savingProfile: boolean;
  handleSaveProfileSettings: (e: React.FormEvent) => void;
}

export function SettingsTab({
  t,
  selectedDriver,
  onUpdateDriverField,
  properties,
  handleToggleDuty,
  preferredZoneInput,
  setPreferredZoneInput,
  lang,
  handleUpdateLanguage,
  fontSize,
  handleUpdateFontSize,
  leaveDateInput,
  setLeaveDateInput,
  leaveReasonInput,
  setLeaveReasonInput,
  handleApplyLeave,
  leaveRequests,
  profileSuccessMsg,
  savingProfile,
  handleSaveProfileSettings
}: SettingsTabProps) {
  return (
    <div className="space-y-4 pb-4">
      {/* Duty status panel */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 shadow-md flex items-center justify-between">
        <div>
          <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest leading-none">Duty Switch</p>
          <h4 className="text-xs font-black text-white uppercase mt-1">
            {selectedDriver.dutyStatus === 'online' ? '🟢 Online & Ready' : '🔴 Offline / Off Duty'}
          </h4>
          <p className="text-[9px] text-slate-500 font-bold mt-1 max-w-[200px] leading-relaxed uppercase">
            {selectedDriver.dutyStatus === 'online' 
              ? 'You are active and receiving nearby dispatch notifications.' 
              : 'You are hidden from maps and won\'t get assignments.'}
          </p>
        </div>

        <button
          onClick={handleToggleDuty}
          className={`w-12 h-7 rounded-full p-0.5 transition-all duration-200 flex items-center ${
            selectedDriver.dutyStatus === 'online' ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {/* Profile & Document uploaded status list */}
      <form onSubmit={handleSaveProfileSettings} className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-4 shadow-md">
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-tight">Rider Account Settings</h4>
          <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-0.5">Edit credentials & select active outlets</p>
        </div>

        <div className="space-y-3">
          {/* Driver Full Name */}
          <div className="space-y-1">
            <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block ml-0.5">Rider Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <User size={12} />
              </span>
              <input
                type="text"
                required
                value={selectedDriver.name || ''}
                onChange={e => onUpdateDriverField('name', e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white text-xs font-bold focus:border-rose-500 outline-none uppercase"
              />
            </div>
          </div>

          {/* Vehicle Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block ml-0.5">Plate Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Landmark size={12} />
                </span>
                <input
                  type="text"
                  required
                  value={selectedDriver.vehicleNumber || ''}
                  onChange={e => onUpdateDriverField('vehicleNumber', e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white text-xs font-bold focus:border-rose-500 outline-none uppercase"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block ml-0.5">Vehicle Type</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Bike size={12} />
                </span>
                <select
                  value={selectedDriver.vehicleType || 'BIKE'}
                  onChange={e => onUpdateDriverField('vehicleType', e.target.value)}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white text-xs font-bold focus:border-rose-500 outline-none"
                >
                  <option value="BIKE">🏍️ Motorbike</option>
                  <option value="SCOOTER">🛵 Scooter</option>
                  <option value="CAR">🚗 Car</option>
                  <option value="BICYCLE">🚲 Bicycle</option>
                </select>
              </div>
            </div>
          </div>

          {/* Restaurant Outlet Selection */}
          <div className="space-y-1">
            <label className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block ml-0.5">Active Outlet Assignments</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <MapPin size={12} />
              </span>
              <select
                value={selectedDriver.propertyId || ''}
                onChange={e => onUpdateDriverField('propertyId', e.target.value || null)}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white text-xs font-bold focus:border-rose-500 outline-none"
              >
                <option value="">🌍 All Outlets (Multi-Restaurant / Free Agent)</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id}>🍔 {p.name}</option>
                ))}
              </select>
            </div>
            <p className="text-[7.5px] text-slate-500 font-bold uppercase mt-1 ml-0.5 leading-relaxed">
              * Choosing "All Outlets" allows you to receive order dispatch alerts from all restaurant branches simultaneously.
            </p>
          </div>

          {/* Delivery Radius Selection */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[8.5px] font-black text-slate-400 uppercase tracking-wider px-0.5">
              <span>Delivery Radius</span>
              <span className="text-rose-400">{(selectedDriver.deliveryRadius || 5.0).toFixed(1)} KM</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="15.0"
              step="0.5"
              value={selectedDriver.deliveryRadius || 5.0}
              onChange={e => onUpdateDriverField('deliveryRadius', parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-lg bg-[#070b12] border border-[#1e293b] appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>

        {/* Verification Status Read-Only list */}
        <div className="bg-[#070b12] p-2.5 rounded-xl border border-[#1e293b]/60 space-y-2 text-[10px] font-bold uppercase">
          <div className="flex items-center gap-1.5 border-b border-[#1e293b]/40 pb-1.5 text-[8px] font-black text-slate-400 tracking-wider">
            <Shield size={10} className="text-slate-500" /> Uploaded Credentials Verified
          </div>
          <div className="flex justify-between border-b border-[#1e293b]/40 pb-1.5 text-[9px]">
            <span className="text-slate-550">Driving Licence:</span>
            <span className="text-emerald-400 font-extrabold font-mono">✓ Verified</span>
          </div>
          <div className="flex justify-between border-b border-[#1e293b]/40 pb-1.5 text-[9px]">
            <span className="text-slate-550">Vehicle RC Book:</span>
            <span className="text-emerald-400 font-extrabold font-mono">✓ Verified</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-550">Aadhaar/ID Proof:</span>
            <span className="text-emerald-400 font-extrabold font-mono">✓ Verified</span>
          </div>
        </div>

        {profileSuccessMsg && (
          <p className="text-[8.5px] text-emerald-400 font-black uppercase text-center bg-emerald-500/10 border border-emerald-500/20 py-2 rounded-xl">
            🎉 {profileSuccessMsg}
          </p>
        )}

        <Button
          type="submit"
          loading={savingProfile}
          className="w-full h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20"
        >
          Save & Sync Profile Details
        </Button>
      </form>

      {/* Preferred Zones preferences */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-3 shadow-md">
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-tight">{t.zone}</h4>
          <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-0.5">Select your active zones</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {[
            { key: 'CENTRAL', label: 'Central Zone' },
            { key: 'SOUTH', label: 'South District' },
            { key: 'WEST', label: 'West Extension' },
            { key: 'EAST', label: 'Noida Outskirts' },
          ].map(zone => (
            <button
              key={zone.key}
              type="button"
              onClick={() => {
                setPreferredZoneInput(zone.key);
                localStorage.setItem(`driver_zones_${selectedDriver.id}`, zone.key);
              }}
              className={`p-2 rounded-xl border font-bold text-left transition-all ${
                preferredZoneInput === zone.key 
                  ? 'bg-rose-500/10 border-rose-500 text-rose-400' 
                  : 'bg-[#070b12] border-[#1e293b] text-slate-400'
              }`}
            >
              {zone.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility Options */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-3 shadow-md">
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-tight">Accessibility Preferences</h4>
          <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-0.5">Font scale and dictionary controls</p>
        </div>

        <div className="space-y-3">
          {/* Language Selection */}
          <div className="flex justify-between items-center bg-[#070b12] p-2.5 rounded-xl border border-[#1e293b]/70">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.language}</span>
            <div className="flex gap-1">
              {[
                { key: 'en', label: 'EN' },
                { key: 'hi', label: 'हिन्दी' },
                { key: 'hinglish', label: 'Hinglish' }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => handleUpdateLanguage(item.key as any)}
                  className={`px-2.5 py-1 text-[8.5px] font-black rounded-lg transition-all ${
                    lang === item.key 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-[#1e293b] hover:bg-[#28354c] text-slate-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Selection */}
          <div className="flex justify-between items-center bg-[#070b12] p-2.5 rounded-xl border border-[#1e293b]/70">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.fontSize}</span>
            <div className="flex gap-1">
              {[
                { key: 'sm', label: 'Small' },
                { key: 'md', label: 'Normal' },
                { key: 'lg', label: 'Large' }
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => handleUpdateFontSize(item.key as any)}
                  className={`px-2.5 py-1 text-[8.5px] font-black rounded-lg transition-all ${
                    fontSize === item.key 
                      ? 'bg-rose-500 text-white' 
                      : 'bg-[#1e293b] hover:bg-[#28354c] text-slate-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Apply for Leave application form */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-4 space-y-3 shadow-md">
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-tight">{t.leave}</h4>
          <p className="text-[8.5px] text-slate-500 font-bold uppercase mt-0.5">Apply for offline leaves</p>
        </div>

        <form onSubmit={handleApplyLeave} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              required
              value={leaveDateInput}
              onChange={e => setLeaveDateInput(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-[#070b12] border border-[#1e293b] text-white text-[10px] focus:outline-none"
            />
            <select
              value={leaveReasonInput}
              onChange={e => setLeaveReasonInput(e.target.value)}
              className="h-9 px-2 rounded-lg bg-[#070b12] border border-[#1e293b] text-white text-[10px] focus:outline-none font-bold"
            >
              <option value="SICK">SICK Case</option>
              <option value="PERSONAL">PERSONAL Case</option>
              <option value="FESTIVAL">FESTIVAL Case</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full h-9 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
          >
            Submit Leave Application
          </button>
        </form>

        {/* Leave requests list history */}
        {leaveRequests.length > 0 && (
          <div className="space-y-2 border-t border-[#1e293b]/60 pt-3">
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">Leave Applications History</p>
            
            <div className="space-y-1.5 font-bold uppercase">
              {leaveRequests.map(leave => (
                <div key={leave.id} className="bg-[#070b12] border border-[#1e293b]/60 px-3 py-2 rounded-xl flex items-center justify-between text-[10px]">
                  <div>
                    <p className="font-bold text-slate-350">{leave.date}</p>
                    <p className="text-[8.0px] text-slate-500 font-bold uppercase mt-0.5">{leave.reason} Case</p>
                  </div>
                  <span className="text-[7.5px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
