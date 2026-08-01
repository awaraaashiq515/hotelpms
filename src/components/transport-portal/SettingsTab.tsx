'use client';

import React, { useState } from 'react';
import { User, Phone, Mail, Star, LogOut, Globe, ChevronRight, Shield, Info } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsTabProps {
  driver: any;
  token: string;
  onLogout: () => void;
  isOnline: boolean;
  onToggleOnline: (val: boolean) => void;
}

export function SettingsTab({ driver, token, onLogout, isOnline, onToggleOnline }: SettingsTabProps) {
  const [toggling, setToggling] = useState(false);

  const handleToggleOnline = async () => {
    setToggling(true);
    try {
      const res = await fetch('/api/transport/earnings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isOnline: !isOnline })
      });
      const data = await res.json();
      if (data.success) {
        onToggleOnline(!isOnline);
        toast.success(!isOnline ? 'You are now Online! 🟢' : 'You are now Offline 🔴');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-black text-white">Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your profile and preferences</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-br from-blue-600/10 to-indigo-600/5 border border-blue-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0 text-xl font-black text-white">
            {driver?.name?.[0]?.toUpperCase() || 'D'}
          </div>
          <div>
            <p className="text-base font-black text-white">{driver?.name || 'Driver'}</p>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Phone size={10} className="text-blue-400" />
              {driver?.phone || '—'}
            </p>
            {driver?.email && (
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Mail size={10} className="text-blue-400" />
                {driver.email}
              </p>
            )}
          </div>
          <div className="ml-auto flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-2 py-1">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-black text-yellow-400">{driver?.rating?.toFixed(1) || '5.0'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Online / Offline Toggle */}
      <div className="bg-[#0c1525]/70 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOnline ? 'bg-green-500/20' : 'bg-slate-800/60'}`}>
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 shadow-lg shadow-green-400/40 animate-pulse' : 'bg-slate-600'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-black text-white">{isOnline ? 'Online — Accepting Bookings' : 'Offline — Not Accepting'}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isOnline ? 'Guests can view and book your service' : 'Your vehicle is hidden from booking requests'}
          </p>
        </div>
        <button
          onClick={handleToggleOnline}
          disabled={toggling}
          className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0 ${
            isOnline ? 'bg-green-500' : 'bg-slate-700'
          }`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
            isOnline ? 'left-6' : 'left-0.5'
          }`} />
        </button>
      </div>

      {/* Info Items */}
      <div className="space-y-2">
        <div className="bg-[#0c1525]/70 border border-slate-800/60 rounded-xl p-3.5 flex items-center gap-3">
          <Shield size={14} className="text-blue-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-black text-white">Transport Driver Portal</p>
            <p className="text-[10px] text-slate-500">GuestFlow v1.0</p>
          </div>
          <ChevronRight size={14} className="text-slate-600" />
        </div>

        <div className="bg-[#0c1525]/70 border border-slate-800/60 rounded-xl p-3.5 flex items-center gap-3">
          <Info size={14} className="text-slate-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-black text-white">Help & Support</p>
            <p className="text-[10px] text-slate-500">Contact hotel reception for assistance</p>
          </div>
          <ChevronRight size={14} className="text-slate-600" />
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/30 text-red-400 text-xs font-black py-3.5 rounded-2xl transition-all"
      >
        <LogOut size={14} />
        Log Out
      </button>
    </div>
  );
}
