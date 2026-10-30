'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bike, Plus, LogOut, MapPin, Store, ShieldCheck, Sparkles,
  RefreshCw, Menu, X, MessageSquareQuote, Key, ExternalLink,
  Phone, User, Volume2, VolumeX, Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { VendorProfile } from './types';
import { playNotificationSound, isSoundEnabled, setSoundEnabled } from '@/lib/notification-sound';

interface PortalHeaderProps {
  vendor: VendorProfile;
  onAddBike: () => void;
  onNewRental: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  isRefreshing?: boolean;
  activeTab?: 'fleet' | 'enquiries' | 'rentals';
  onTabChange?: (tab: 'fleet' | 'enquiries' | 'rentals') => void;
  fleetCount?: number;
  pendingEnquiriesCount?: number;
  activeBookingsCount?: number;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({
  vendor,
  onAddBike,
  onNewRental,
  onRefresh,
  onLogout,
  isRefreshing,
  activeTab,
  onTabChange,
  fleetCount = 0,
  pendingEnquiriesCount = 0,
  activeBookingsCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      playNotificationSound('lead');
      toast.success('🔊 Sound notifications enabled! (Bell tested)');
    } else {
      toast.info('🔇 Sound notifications muted.');
    }
  };

  const handleMobileNav = (tab: 'fleet' | 'enquiries' | 'rentals') => {
    if (onTabChange) onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const handleAction = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#070b14]/95 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5 md:py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Left: Brand & Shop Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/25 shrink-0">
              <Bike size={20} className="md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2">
                <h1 className="text-sm md:text-base font-black text-white tracking-wide truncate max-w-[150px] sm:max-w-[240px] md:max-w-none">
                  {vendor.shopName || vendor.name}
                </h1>
                <span className="text-[9px] md:text-[10px] font-black uppercase px-1.5 md:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Desk
                </span>
              </div>
              <p className="text-[10px] md:text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                <MapPin size={10} className="text-rose-400 shrink-0" />
                <span className="truncate">{vendor.city || 'Tourist Hub'}, {vendor.state || 'India'}</span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="font-mono text-slate-300 hidden sm:inline">{vendor.phone}</span>
              </p>
            </div>
          </div>

          {/* Right Desktop Actions (md and up) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Sound Notification Alert Toggle & Test */}
            <button
              onClick={toggleSound}
              className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                soundOn
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title={soundOn ? 'Sound Notifications Active (Click to mute/test)' : 'Sound Muted (Click to enable)'}
            >
              {soundOn ? <Volume2 size={14} className="text-emerald-400 animate-pulse" /> : <VolumeX size={14} />}
              <span className="text-[11px] font-black tracking-wide hidden lg:inline">
                {soundOn ? 'Sound ON' : 'Muted'}
              </span>
            </button>

            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Fleet & Bookings"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-rose-400' : ''} />
            </button>

            <button
              onClick={onAddBike}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-rose-500/50 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-sm hover:shadow-rose-500/10 cursor-pointer"
            >
              <Plus size={14} className="text-rose-400" />
              <span>Add Vehicle</span>
            </button>

            <button
              onClick={onNewRental}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-rose-600/25 cursor-pointer active:scale-95"
            >
              <Sparkles size={13} />
              <span>Rent Out Bike</span>
            </button>

            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 transition-all cursor-pointer"
            >
              <LogOut size={15} />
            </button>
          </div>

          {/* Right Mobile Icons (Refresh + Hamburger) */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all"
              title="Refresh"
            >
              <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-rose-400' : ''} />
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-rose-600/15 border border-rose-500/30 text-rose-400 hover:bg-rose-600 hover:text-white transition-all"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE SLIDE-OUT DRAWER / MENU ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-[#0a0f1d] border-l border-slate-800 p-5 flex flex-col justify-between shadow-2xl z-10 overflow-y-auto">
            <div className="space-y-5">
              {/* Top Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-rose-500/25">
                    <Bike size={20} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white leading-tight">
                      {vendor.shopName || vendor.name}
                    </h2>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-rose-400" />
                      <span>{vendor.city || 'Tourist Hub'}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Vendor Info Card */}
              <div className="p-3.5 rounded-2xl bg-[#060a14] border border-slate-800/80 space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Vendor ID / Phone</span>
                  <span className="font-mono text-white font-bold">{vendor.phone}</span>
                </div>
                {vendor.address && (
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800/50">
                    {vendor.address}
                  </p>
                )}
              </div>

              {/* Quick Action Buttons */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-1">
                  Quick Actions
                </p>

                <button
                  onClick={() => handleAction(onNewRental)}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 active:scale-95"
                >
                  <Sparkles size={15} />
                  <span>Rent Out Bike</span>
                </button>

                <button
                  onClick={() => handleAction(onAddBike)}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-900 border border-slate-700/80 text-white text-xs font-black transition-all flex items-center justify-center gap-2 hover:border-rose-500/50"
                >
                  <Plus size={15} className="text-rose-400" />
                  <span>Add Vehicle to Fleet</span>
                </button>
              </div>

              {/* Navigation Menu Links */}
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-1 mb-2">
                  Portal Navigation
                </p>

                <button
                  onClick={() => handleMobileNav('fleet')}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-between ${
                    activeTab === 'fleet'
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Bike size={16} className={activeTab === 'fleet' ? 'text-rose-400' : 'text-slate-400'} />
                    <span>My Fleet</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                    {fleetCount}
                  </span>
                </button>

                <button
                  onClick={() => handleMobileNav('enquiries')}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-between ${
                    activeTab === 'enquiries'
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MessageSquareQuote size={16} className={activeTab === 'enquiries' ? 'text-rose-400' : 'text-slate-400'} />
                    <span>Requests & Leads</span>
                  </span>
                  {pendingEnquiriesCount > 0 ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500 text-white font-black">
                      {pendingEnquiriesCount} new
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500">0</span>
                  )}
                </button>

                <button
                  onClick={() => handleMobileNav('rentals')}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-between ${
                    activeTab === 'rentals'
                      ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Key size={16} className={activeTab === 'rentals' ? 'text-rose-400' : 'text-slate-400'} />
                    <span>Active Rentals</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                    {activeBookingsCount}
                  </span>
                </button>
              </div>

              {/* Sound Notification Switch */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={toggleSound}
                  className={`w-full py-2.5 px-3.5 rounded-xl text-xs font-black transition-all flex items-center justify-between border ${
                    soundOn
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-900 text-slate-400 border-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {soundOn ? <Volume2 size={16} className="text-emerald-400" /> : <VolumeX size={16} />}
                    <span>Sound Alerts: {soundOn ? 'ACTIVE (Loud)' : 'MUTED'}</span>
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-slate-800/90 text-slate-300">
                    {soundOn ? '🔔 Test' : 'Off'}
                  </span>
                </button>
              </div>

              {/* Portal Links */}
              <div className="pt-2 border-t border-slate-800">
                <Link
                  href="/agent-portal"
                  className="w-full py-2.5 px-3.5 rounded-xl text-xs font-bold text-sky-400 hover:bg-sky-500/10 transition-all flex items-center justify-between border border-sky-500/20"
                >
                  <span className="flex items-center gap-2">
                    <Store size={15} />
                    <span>Open Agent Portal</span>
                  </span>
                  <ExternalLink size={13} />
                </Link>
              </div>
            </div>

            {/* Bottom Logout */}
            <div className="pt-4 border-t border-slate-800 mt-6">
              <button
                onClick={() => handleAction(onLogout)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 hover:bg-rose-950/20 text-xs font-black transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={15} />
                <span>Sign Out of Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
