'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, Search, Plus, RefreshCw, Star, Phone, Mail,
  MapPin, Calendar, CreditCard, Shield, User, ArrowRight,
  Filter, Crown, CheckCircle2, XCircle, ChevronRight, Bed,
  Building, UserPlus, FileText, Loader2, Sparkles, X
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface Guest {
  id: string;
  firstName: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  gender?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  loyaltyPoints: number;
  segment: string;
  createdAt: string;
  reservations?: any[];
  _count?: { checkIns: number; reservations: number };
}

const SEGMENT_CONFIG: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  VIP:         { label: 'VIP', color: 'text-amber-400', icon: '👑', bg: 'bg-amber-500/15 border-amber-500/30' },
  CORPORATE:   { label: 'Corporate', color: 'text-blue-400', icon: '🏢', bg: 'bg-blue-500/15 border-blue-500/30' },
  REGULAR:     { label: 'Regular', color: 'text-slate-400', icon: '👤', bg: 'bg-slate-700/40 border-slate-600/30' },
  BLACKLISTED: { label: 'Blacklisted', color: 'text-red-400', icon: '🚫', bg: 'bg-red-500/15 border-red-500/30' },
  LOYALTY:     { label: 'Loyalty Member', color: 'text-violet-400', icon: '⭐', bg: 'bg-violet-500/15 border-violet-500/30' },
};

function GuestCard({ guest, onSelect }: { guest: Guest; onSelect: () => void }) {
  const seg = SEGMENT_CONFIG[guest.segment] || SEGMENT_CONFIG.REGULAR;
  const initials = `${(guest.firstName || 'G')[0]}${(guest.lastName || '')[0] || ''}`;
  const totalStays = guest.reservations?.length || guest._count?.checkIns || 0;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-5 rounded-3xl bg-[#090f1e]/80 border border-slate-800 hover:border-rose-500/40 hover:shadow-xl transition-all duration-200 group flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600/30 to-indigo-600/30 border border-rose-500/20 flex items-center justify-center">
                <span className="text-sm font-black text-rose-300">{initials}</span>
              </div>
              {guest.segment === 'VIP' && (
                <span className="absolute -top-1 -right-1 text-sm">👑</span>
              )}
            </div>
            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white truncate">
                {guest.firstName} {guest.lastName || ''}
              </p>
              {guest.mobile && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium truncate">
                  <Phone size={10} className="text-slate-500 shrink-0" /> {guest.mobile}
                </p>
              )}
              {guest.email && (
                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 truncate font-medium">
                  <Mail size={10} className="text-slate-500 shrink-0" /> {guest.email}
                </p>
              )}
            </div>
          </div>
          {/* Segment badge */}
          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${seg.bg} ${seg.color} shrink-0 self-start`}>
            {seg.icon} {seg.label}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded-xl bg-slate-950/60 border border-slate-850">
            <p className="text-sm font-black text-white">{totalStays}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">Stays</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <p className="text-sm font-black text-amber-400">{guest.loyaltyPoints || 0}</p>
            <p className="text-[9px] text-slate-500 font-bold uppercase">Points</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-slate-950/60 border border-slate-850 overflow-hidden">
            <p className="text-[10px] font-black text-slate-300 truncate">
              {guest.nationality || 'Indian'}
            </p>
            <p className="text-[9px] text-slate-500 font-bold uppercase truncate">Country</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
        <p className="text-[9px] text-slate-500 font-semibold">
          Joined {new Date(guest.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </p>
        <span className="text-[9px] text-rose-400 font-bold flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          View Profile <ArrowRight size={9} />
        </span>
      </div>
    </button>
  );
}

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<string>('all');
  const [selected, setSelected] = useState<Guest | null>(null);

  // Add Guest Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    gender: 'Male',
    nationality: 'Indian',
    idType: 'Aadhaar Card',
    idNumber: '',
    address: '',
    segment: 'REGULAR',
    loyaltyPoints: '100',
  });

  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/guests?limit=200');
      const json = await res.json();
      if (json.success) {
        setGuests(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      toast.error('Failed to load guest directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName) {
      toast.error('First name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Guest added successfully!');
        setShowAddModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          mobile: '',
          email: '',
          gender: 'Male',
          nationality: 'Indian',
          idType: 'Aadhaar Card',
          idNumber: '',
          address: '',
          segment: 'REGULAR',
          loyaltyPoints: '100',
        });
        loadGuests();
      } else {
        toast.error(json.message || 'Failed to add guest.');
      }
    } catch {
      toast.error('Network error. Failed to add guest.');
    } finally {
      setSubmitting(false);
    }
  };

  // Loyalty Points Adjustment state
  const [showAdjustPoints, setShowAdjustPoints] = useState(false);
  const [adjustMode, setAdjustMode] = useState<'DELTA' | 'SET'>('DELTA');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const handleAdjustPoints = async (guestId: string) => {
    const val = parseInt(adjustAmount);
    if (isNaN(val)) {
      toast.error('Please enter a valid number of points.');
      return;
    }

    setAdjusting(true);
    try {
      const payload: any = { id: guestId };
      if (adjustMode === 'SET') {
        payload.loyaltyPoints = Math.max(0, val);
      } else {
        payload.deltaPoints = val;
      }

      const res = await fetch('/api/hotel/guests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Loyalty points updated! New balance: ${json.data.loyaltyPoints} Pts`);
        setShowAdjustPoints(false);
        setAdjustAmount('');
        if (selected && selected.id === guestId) {
          setSelected({ ...selected, loyaltyPoints: json.data.loyaltyPoints });
        }
        loadGuests();
      } else {
        toast.error(json.message || 'Failed to update loyalty points.');
      }
    } catch {
      toast.error('Network error. Failed to update points.');
    } finally {
      setAdjusting(false);
    }
  };

  const filtered = guests.filter(g => {
    const q = search.toLowerCase();
    const nameMatch = !q || 
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(q) || 
      g.mobile?.includes(q) || 
      g.email?.toLowerCase().includes(q) ||
      g.nationality?.toLowerCase().includes(q) ||
      g.idNumber?.toLowerCase().includes(q);
    
    const segMatch = segment === 'all' || g.segment === segment;
    return nameMatch && segMatch;
  });

  const vipCount = guests.filter(g => g.segment === 'VIP').length;
  const corpCount = guests.filter(g => g.segment === 'CORPORATE').length;
  const loyaltyCount = guests.filter(g => (g.loyaltyPoints || 0) > 0).length;
  const totalLoyaltyPoints = guests.reduce((sum, g) => sum + (g.loyaltyPoints || 0), 0);

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto p-6 text-white">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-rose-400" />
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Guest Intelligence & CRM</span>
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Guest Profiles Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage guest database, VIP membership segments, loyalty points, and stay histories.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadGuests} 
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-all"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-xs font-black text-white shadow-lg shadow-rose-600/20 active:scale-95 transition-all"
          >
            <UserPlus size={14} /> Add New Guest
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Database Guests', value: guests.length, icon: Users, color: 'border-rose-500/20 bg-rose-950/20 text-rose-400', sub: 'All Registered Guests' },
          { label: 'VIP Guests', value: vipCount, icon: Crown, color: 'border-amber-500/20 bg-amber-950/20 text-amber-400', sub: 'Exclusive Privileges' },
          { label: 'Corporate Accounts', value: corpCount, icon: Building, color: 'border-sky-500/20 bg-sky-950/20 text-sky-400', sub: 'Direct Company Billing' },
          { label: 'Total Loyalty Points', value: totalLoyaltyPoints.toLocaleString('en-IN'), icon: Star, color: 'border-amber-500/20 bg-amber-950/20 text-amber-400', sub: `${loyaltyCount} Active Members` },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 backdrop-blur-sm ${s.color}`}>
            <s.icon size={16} className="mb-2 opacity-80" />
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-90">{s.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#090f1e]/80 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'VIP', 'CORPORATE', 'LOYALTY', 'REGULAR', 'BLACKLISTED'].map(s => {
            const cfg = s === 'all' ? null : SEGMENT_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setSegment(s)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  segment === s
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cfg ? `${cfg.icon} ${cfg.label}` : 'All Segments'}
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, phone, email, nationality..."
            className="w-full bg-[#050a14] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-rose-500 placeholder-slate-600"
          />
        </div>
      </div>

      {/* Guest Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-rose-500" size={32} />
          <p className="text-xs text-slate-500 font-bold">Loading guest directory...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 space-y-2">
          <Users size={40} className="mx-auto text-slate-700" />
          <p className="font-bold text-sm text-slate-400">
            {search ? 'No guests found matching search query.' : 'No Guest Records Found'}
          </p>
          <p className="text-xs text-slate-600">Click "Add New Guest" to create a guest profile in your database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(g => (
            <GuestCard key={g.id} guest={g} onSelect={() => setSelected(g)} />
          ))}
        </div>
      )}

      {/* MODAL 1: ADD NEW GUEST */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative space-y-4 my-8 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus size={18} className="text-rose-400" /> Register New Guest Profile
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text" required placeholder="e.g. Ramesh"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.firstName}
                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text" placeholder="e.g. Sharma"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.lastName}
                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Mobile Number</label>
                  <input
                    type="text" placeholder="+91 9876543210"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.mobile}
                    onChange={e => setFormData({...formData, mobile: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email" placeholder="ramesh@example.com"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Gender</label>
                  <select
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="Male" className="bg-[#090f1e] text-white">Male</option>
                    <option value="Female" className="bg-[#090f1e] text-white">Female</option>
                    <option value="Other" className="bg-[#090f1e] text-white">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nationality</label>
                  <input
                    type="text" placeholder="Indian"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.nationality}
                    onChange={e => setFormData({...formData, nationality: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Guest Segment</label>
                  <select
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.segment}
                    onChange={e => setFormData({...formData, segment: e.target.value})}
                  >
                    <option value="REGULAR" className="bg-[#090f1e] text-white">Regular</option>
                    <option value="VIP" className="bg-[#090f1e] text-white">VIP Guest</option>
                    <option value="CORPORATE" className="bg-[#090f1e] text-white">Corporate Client</option>
                    <option value="LOYALTY" className="bg-[#090f1e] text-white">Loyalty Member</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Identity Proof Type</label>
                  <select
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.idType}
                    onChange={e => setFormData({...formData, idType: e.target.value})}
                  >
                    <option value="Aadhaar Card" className="bg-[#090f1e] text-white">Aadhaar Card</option>
                    <option value="Passport" className="bg-[#090f1e] text-white">Passport</option>
                    <option value="Driving License" className="bg-[#090f1e] text-white">Driving License</option>
                    <option value="Voter ID" className="bg-[#090f1e] text-white">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Identity Document No.</label>
                  <input
                    type="text" placeholder="e.g. 9876-5432-1098"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.idNumber}
                    onChange={e => setFormData({...formData, idNumber: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Initial Welcome Loyalty Points</label>
                <input
                  type="number" min="0"
                  className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  value={formData.loyaltyPoints}
                  onChange={e => setFormData({...formData, loyaltyPoints: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">City / Address</label>
                <textarea
                  rows={2} placeholder="Full home or business address..."
                  className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-black text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-xs font-black text-white shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {submitting ? 'Saving Guest...' : 'Save Guest Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GUEST DETAIL PROFILE & LOYALTY POINTS ADJUSTMENT */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => { setSelected(null); setShowAdjustPoints(false); }}>
          <div
            className="relative w-full max-w-lg bg-[#090f1e] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-600/30 to-indigo-600/30 border border-rose-500/20 flex items-center justify-center">
                  <span className="text-2xl font-black text-rose-300">
                    {(selected.firstName || 'G')[0]}{(selected.lastName || '')[0] || ''}
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">{selected.firstName} {selected.lastName}</h2>
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border ${(SEGMENT_CONFIG[selected.segment] || SEGMENT_CONFIG.REGULAR).bg} ${(SEGMENT_CONFIG[selected.segment] || SEGMENT_CONFIG.REGULAR).color}`}>
                    {(SEGMENT_CONFIG[selected.segment] || SEGMENT_CONFIG.REGULAR).icon} {(SEGMENT_CONFIG[selected.segment] || SEGMENT_CONFIG.REGULAR).label}
                  </span>
                </div>
              </div>
              <button onClick={() => { setSelected(null); setShowAdjustPoints(false); }} className="p-1 text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Mobile Number</span>
                  <span className="text-white font-bold flex items-center gap-1">
                    <Phone size={11} className="text-rose-400" /> {selected.mobile || 'Not Provided'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Email Address</span>
                  <span className="text-white font-bold flex items-center gap-1 truncate">
                    <Mail size={11} className="text-rose-400" /> {selected.email || 'Not Provided'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Nationality</span>
                  <span className="text-white font-bold flex items-center gap-1">
                    <MapPin size={11} className="text-sky-400" /> {selected.nationality || 'Indian'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-850">
                  <span className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Identity Document</span>
                  <span className="text-white font-bold flex items-center gap-1">
                    <Shield size={11} className="text-emerald-400" /> {selected.idType && selected.idNumber ? `${selected.idType}: ${selected.idNumber}` : 'Pending Verification'}
                  </span>
                </div>
              </div>

              {/* Loyalty Points Box with interactive controls */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" /> Loyalty Rewards Balance
                    </span>
                    <p className="text-2xl font-black text-amber-400 mt-0.5">
                      {(selected.loyaltyPoints || 0).toLocaleString('en-IN')} <span className="text-xs font-bold text-slate-400">PTS</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdjustPoints(!showAdjustPoints)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-[10px] font-black text-amber-300 hover:bg-amber-500 hover:text-black transition-all"
                  >
                    {showAdjustPoints ? 'Cancel Adjustment' : '⭐ Adjust Points'}
                  </button>
                </div>

                {/* Point adjustment input box */}
                {showAdjustPoints && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 pt-2 animate-in fade-in">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-850 pb-2">
                      <span className="text-[10px] font-bold text-slate-400">Adjustment Mode:</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setAdjustMode('DELTA')}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${adjustMode === 'DELTA' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}
                        >
                          +/- Delta
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustMode('SET')}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${adjustMode === 'SET' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'}`}
                        >
                          Set Exact Total
                        </button>
                      </div>
                    </div>

                    <label className="block text-[10px] font-bold text-slate-400">
                      {adjustMode === 'SET' 
                        ? 'Enter exact points balance to set for this guest:' 
                        : 'Enter points delta (e.g. +50 for bonus, -10 for redemption):'
                      }
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={adjustMode === 'SET' ? 'e.g. 50' : 'e.g. +50 or -10'}
                        className="flex-1 bg-[#050a14] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        value={adjustAmount}
                        onChange={e => setAdjustAmount(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAdjustPoints(selected.id)}
                        disabled={adjusting}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-all flex items-center gap-1"
                      >
                        {adjusting ? <Loader2 size={12} className="animate-spin" /> : 'Save Points'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button 
                onClick={() => { setSelected(null); setShowAdjustPoints(false); }} 
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:text-white transition-all"
              >
                Close Profile
              </button>
              <Link 
                href={`/hotel/bookings`}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black text-center transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Bed size={13} /> Book Room For Guest
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
