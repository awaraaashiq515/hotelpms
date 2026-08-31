'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, ArrowRight, MapPin, Users, RefreshCw,
  UtensilsCrossed, CircleAlert, LogOut, ChevronRight,
  LayoutGrid, Activity, Star, Utensils, Hotel, Plus,
  X, Check, ChevronDown, Bed, Coffee, ShoppingCart,
} from 'lucide-react';
import StaffManagement from '@/components/admin/StaffManagement';

interface Property {
  id: string;
  name: string;
  code: string;
  type: string;
  city?: string;
  state?: string;
  hmsEnabled?: boolean;
  totalRooms?: number;
  starRating?: number;
  hotelCategory?: string;
  _count?: { users: number };
}

interface AddPropertyForm {
  name: string;
  code: string;
  type: 'RESTAURANT' | 'HOTEL' | 'CAFE';
  city: string;
  state: string;
  phone: string;
  hmsEnabled: boolean;
  totalRooms: string;
  starRating: string;
  hotelCategory: string;
  checkInTime: string;
  checkOutTime: string;
}

const emptyAddForm = (): AddPropertyForm => ({
  name: '',
  code: '',
  type: 'RESTAURANT',
  city: '',
  state: '',
  phone: '',
  hmsEnabled: false,
  totalRooms: '',
  starRating: '',
  hotelCategory: 'MIDSCALE',
  checkInTime: '14:00',
  checkOutTime: '11:00',
});

export default function RestaurantAdminPortal() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [selecting, setSelecting] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddPropertyForm>(emptyAddForm());
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'restaurant' | 'hotel'>('all');
  const [viewMode, setViewMode] = useState<'properties' | 'staff'>('properties');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'staff') {
        setViewMode('staff');
      }
    }
  }, []);

  const loadProperties = useCallback(() => {
    setLoading(true);
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        const role = d.user?.role;
        // Allow both RESTAURANTS_ADMIN and HOTEL_ADMIN (BOTH type) to use this hub
        const isAllowed = role === 'RESTAURANTS_ADMIN' || role === 'SUPER_ADMIN' || role === 'HOTEL_ADMIN';
        if (!isAllowed) {
          if (d.user?.propertyCode) {
            router.push(`/${d.user.propertyCode}/operations`);
          } else {
            router.push('/login');
          }
          return;
        }
        setUserName(d.user?.fullName || d.user?.name || 'Admin');
        return fetch('/api/admin/properties')
          .then(r => r.json())
          .then(pData => {
            if (pData.success && pData.data?.length > 0) {
              setProperties(pData.data);
            } else {
              setProperties([]);
            }
          });
      })
      .catch(() => setError('Failed to load. Please refresh.'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  const handleSelect = async (property: Property) => {
    setSelecting(property.id);
    try {
      const res = await fetch('/api/setup/properties/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      });
      const data = await res.json();
      if (data.success) {
        if (property.type === 'HOTEL') {
          // Hotel property → hotel PMS portal
          router.push('/hotel');
        } else {
          // Restaurant/Cafe → POS Billing Terminal
          router.push(`/${property.code}/billing`);
        }
        router.refresh();
      } else {
        alert(data.error || 'Failed to select property.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSelecting(null);
    }
  };

  const handleAddProperty = async () => {
    setAddError('');
    if (!addForm.name.trim() || !addForm.code.trim()) {
      setAddError('Property name and code are required.');
      return;
    }
    if (!/^[a-z0-9-]+$/.test(addForm.code)) {
      setAddError('Code must only contain lowercase letters, numbers and hyphens (-).');
      return;
    }
    setAddLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: addForm.name.trim(),
        code: addForm.code.trim().toLowerCase(),
        type: addForm.type,
        city: addForm.city,
        state: addForm.state,
        phone: addForm.phone,
      };
      if (addForm.type === 'HOTEL') {
        payload.hmsEnabled = addForm.hmsEnabled;
        payload.checkInTime = addForm.checkInTime;
        payload.checkOutTime = addForm.checkOutTime;
        if (addForm.totalRooms) payload.totalRooms = Number(addForm.totalRooms);
        if (addForm.starRating) payload.starRating = Number(addForm.starRating);
        payload.hotelCategory = addForm.hotelCategory;
      }
      const res = await fetch('/api/admin/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json());

      if (res.success) {
        setShowAddModal(false);
        setAddForm(emptyAddForm());
        loadProperties();
      } else {
        setAddError(res.error || 'Failed to create property.');
      }
    } catch {
      setAddError('Network error. Please try again.');
    } finally {
      setAddLoading(false);
    }
  };

  // Filter properties by tab
  const filteredProperties = properties.filter(p => {
    if (activeTab === 'restaurant') return !p.type || p.type === 'RESTAURANT' || p.type === 'CAFE' || p.type === 'POS';
    if (activeTab === 'hotel') return p.type === 'HOTEL';
    return true;
  });

  const hotelCount = properties.filter(p => p.type === 'HOTEL').length;
  const restaurantCount = properties.filter(p => !p.type || p.type !== 'HOTEL').length;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Utensils size={24} className="text-emerald-400" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-black text-white">Loading your properties…</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Property Hub</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto px-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
            <CircleAlert size={28} className="text-rose-400" />
          </div>
          <p className="text-white font-bold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/10 transition-all mx-auto"
          >
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#07070d] text-white">

      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[700px] h-[700px] bg-violet-700/6 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-700/4 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-indigo-600/4 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── TOP BAR ── */}
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <Building2 size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white leading-tight">Property Hub</p>
                <p className="text-[10px] text-slate-500 font-bold">Welcome back, {userName}</p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/[0.03] border border-white/8 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('properties')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'properties'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Building2 size={13} /> Properties
              </button>
              <button
                onClick={() => setViewMode('staff')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'staff'
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Users size={13} /> Staff Members
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => { setAddForm(emptyAddForm()); setAddError(''); setShowAddModal(true); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition-all"
              >
                <Plus size={13} /> Add Property
              </button>
              <button
                onClick={() => {
                  fetch('/api/auth/logout', { method: 'POST' })
                    .finally(() => router.push('/login'));
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/8 bg-white/4 text-[11px] font-bold text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/5 transition-all"
              >
                <LogOut size={12} /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col items-center px-4 py-12">
          <div className="w-full max-w-5xl">

            {viewMode === 'properties' ? (
              <>
                {/* Heading */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.25em] mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Property & Outlet Directory
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                    Select a Property<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400">
                      to Open Dashboard or POS
                    </span>
                  </h1>
                  <p className="text-sm text-slate-500 font-bold">
                    {properties.length} {properties.length === 1 ? 'property' : 'properties'} available
                    {hotelCount > 0 && <span className="ml-2 text-amber-500/70">• {hotelCount} Hotel{hotelCount !== 1 ? 's' : ''}</span>}
                    {restaurantCount > 0 && <span className="ml-2 text-emerald-500/70">• {restaurantCount} Restaurant / POS{restaurantCount !== 1 ? 's' : ''}</span>}
                  </p>
                </div>

                {/* Tab Filter */}
                {properties.length > 0 && hotelCount > 0 && restaurantCount > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-7">
                    {[
                      { key: 'all', label: 'All', count: properties.length },
                      { key: 'restaurant', label: '🍽️ Restaurants & POS', count: restaurantCount },
                      { key: 'hotel', label: '🏨 Hotels', count: hotelCount },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as typeof activeTab)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          activeTab === tab.key
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-white/[0.03] border border-white/8 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {tab.label} <span className="ml-1 opacity-60">({tab.count})</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Property Cards Grid */}
                {filteredProperties.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-center mx-auto mb-4">
                      <Building2 size={28} className="text-slate-600" />
                    </div>
                    <p className="text-slate-500 font-bold mb-2">No properties found</p>
                    <button
                      onClick={() => { setAddForm(emptyAddForm()); setAddError(''); setShowAddModal(true); }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-sm font-bold text-emerald-400 hover:bg-emerald-500/25 transition-all"
                    >
                      <Plus size={14} /> Add your first property
                    </button>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${
                    filteredProperties.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
                    filteredProperties.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {filteredProperties.map((property, index) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        index={index}
                        selecting={selecting === property.id}
                        onSelect={() => handleSelect(property)}
                      />
                    ))}
                  </div>
                )}

                {/* Footer note */}
                <p className="text-center text-[10px] text-slate-700 font-bold mt-10">
                  Select an F&B outlet for Live POS dashboard or a Hotel for PMS portal.
                </p>
              </>
            ) : (
              <>
                {/* Staff Management Heading */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.25em] mb-5">
                    <Users size={12} className="inline mr-1" /> Staff Directory & Access Control
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                    Staff Accounts<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-400">
                      Manage POS & F&B Access
                    </span>
                  </h1>
                  <p className="text-sm text-slate-500 font-bold">
                    Manage waiters, cashiers, riders, receptionists, and managers across all properties.
                  </p>
                </div>

                <StaffManagement properties={properties} />
              </>
            )}

          </div>
        </div>

      </div>

      {/* ── ADD PROPERTY MODAL ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0d0d1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div>
                <p className="text-base font-black text-white">Add New Property</p>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">Supports Restaurants, Hotels, and Cafes</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4 max-h-[75vh] overflow-y-auto">

              {/* Property Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Property Type *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'RESTAURANT', emoji: '🍽️', label: 'Restaurant' },
                    { value: 'HOTEL', emoji: '🏨', label: 'Hotel' },
                    { value: 'CAFE', emoji: '☕', label: 'Cafe' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, type: opt.value as AddPropertyForm['type'], hmsEnabled: opt.value === 'HOTEL' }))}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 text-xs font-bold transition-all ${
                        addForm.type === opt.value
                          ? 'border-violet-500/60 bg-violet-500/15 text-violet-300'
                          : 'border-white/8 bg-white/[0.02] text-slate-500 hover:border-white/15 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">Property Name *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Hotel Paradise"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">
                    Property Code * <span className="text-[9px] text-slate-600 font-medium">(URL slug)</span>
                  </label>
                  <input
                    type="text"
                    value={addForm.code}
                    onChange={e => setAddForm(f => ({ ...f, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    placeholder="e.g. hotel-paradise"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                  />
                </div>
              </div>

              {/* City + State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">City</label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5">State</label>
                  <input
                    type="text"
                    value={addForm.state}
                    onChange={e => setAddForm(f => ({ ...f, state: e.target.value }))}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 9876543210"
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>

              {/* Hotel-specific fields */}
              {addForm.type === 'HOTEL' && (
                <div className="space-y-4 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🏨</span>
                    <div>
                      <p className="text-sm font-black text-amber-400">Hotel Management (HMS) Settings</p>
                      <p className="text-[10px] text-slate-600">Hotel-specific configuration</p>
                    </div>
                  </div>

                  {/* HMS Enable Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/8">
                    <div>
                      <p className="text-xs font-bold text-white">Enable HMS Module</p>
                      <p className="text-[9px] text-slate-600">Rooms, bookings, check-in/out management</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, hmsEnabled: !f.hmsEnabled }))}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${addForm.hmsEnabled ? 'bg-amber-500' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${addForm.hmsEnabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>

                  {/* Total Rooms + Star Rating */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">Total Rooms</label>
                      <input
                        type="number" min={1}
                        value={addForm.totalRooms}
                        onChange={e => setAddForm(f => ({ ...f, totalRooms: e.target.value }))}
                        placeholder="e.g. 50"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">Star Rating</label>
                      <select
                        value={addForm.starRating}
                        onChange={e => setAddForm(f => ({ ...f, starRating: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-amber-500/50 transition-all"
                      >
                        <option value="">Select</option>
                        <option value="1">⭐ 1 Star</option>
                        <option value="2">⭐⭐ 2 Star</option>
                        <option value="3">⭐⭐⭐ 3 Star</option>
                        <option value="4">⭐⭐⭐⭐ 4 Star</option>
                        <option value="5">⭐⭐⭐⭐⭐ 5 Star</option>
                      </select>
                    </div>
                  </div>

                  {/* Hotel Category */}
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5">Hotel Category</label>
                    <select
                      value={addForm.hotelCategory}
                      onChange={e => setAddForm(f => ({ ...f, hotelCategory: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-amber-500/50 transition-all"
                    >
                      <option value="BUDGET">🏠 Budget</option>
                      <option value="MIDSCALE">🏨 Midscale</option>
                      <option value="LUXURY">🌟 Luxury</option>
                      <option value="BOUTIQUE">💎 Boutique</option>
                    </select>
                  </div>

                  {/* Check-in / Check-out */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">Check-in Time</label>
                      <input
                        type="time"
                        value={addForm.checkInTime}
                        onChange={e => setAddForm(f => ({ ...f, checkInTime: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-amber-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">Check-out Time</label>
                      <input
                        type="time"
                        value={addForm.checkOutTime}
                        onChange={e => setAddForm(f => ({ ...f, checkOutTime: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-amber-500/50 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {addError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                  {addError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center gap-3 px-6 py-4 border-t border-white/8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProperty}
                disabled={addLoading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-black transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/40"
              >
                {addLoading ? (
                  <><RefreshCw size={14} className="animate-spin" /> Creating…</>
                ) : (
                  <><Check size={14} /> Add Property</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Property Card Component ───────────────────────────────────────────────────
function PropertyCard({
  property, index, selecting, onSelect,
}: {
  property: Property;
  index: number;
  selecting: boolean;
  onSelect: () => void;
}) {
  const isHotel = property.type === 'HOTEL';

  const restaurantColors = [
    { border: 'border-violet-500/25', glow: 'from-violet-500/12', dot: 'bg-violet-400', badge: 'bg-violet-500/15 text-violet-400', icon: 'bg-violet-500/15 text-violet-400', btn: 'bg-violet-500 hover:bg-violet-400 shadow-violet-900/50' },
    { border: 'border-indigo-500/25', glow: 'from-indigo-500/12', dot: 'bg-indigo-400', badge: 'bg-indigo-500/15 text-indigo-400', icon: 'bg-indigo-500/15 text-indigo-400', btn: 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-900/50' },
    { border: 'border-sky-500/25',    glow: 'from-sky-500/12',    dot: 'bg-sky-400',    badge: 'bg-sky-500/15 text-sky-400',    icon: 'bg-sky-500/15 text-sky-400',    btn: 'bg-sky-500 hover:bg-sky-400 shadow-sky-900/50'       },
    { border: 'border-emerald-500/25',glow: 'from-emerald-500/12',dot: 'bg-emerald-400',badge: 'bg-emerald-500/15 text-emerald-400',icon:'bg-emerald-500/15 text-emerald-400',btn:'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-900/50'},
  ];

  const hotelColors = [
    { border: 'border-amber-500/30', glow: 'from-amber-500/10', dot: 'bg-amber-400', badge: 'bg-amber-500/15 text-amber-400', icon: 'bg-amber-500/15 text-amber-400', btn: 'bg-amber-500 hover:bg-amber-400 shadow-amber-900/50' },
    { border: 'border-orange-500/30', glow: 'from-orange-500/10', dot: 'bg-orange-400', badge: 'bg-orange-500/15 text-orange-400', icon: 'bg-orange-500/15 text-orange-400', btn: 'bg-orange-500 hover:bg-orange-400 shadow-orange-900/50' },
    { border: 'border-yellow-500/30', glow: 'from-yellow-500/10', dot: 'bg-yellow-400', badge: 'bg-yellow-500/15 text-yellow-400', icon: 'bg-yellow-500/15 text-yellow-400', btn: 'bg-yellow-500 hover:bg-yellow-400 shadow-yellow-900/50' },
  ];

  const colors = isHotel ? hotelColors : restaurantColors;
  const c = colors[index % colors.length];

  const hotelCategoryLabel: Record<string, string> = {
    BUDGET: '🏠 Budget', MIDSCALE: '🏨 Midscale', LUXURY: '🌟 Luxury', BOUTIQUE: '💎 Boutique',
  };

  return (
    <button
      onClick={onSelect}
      disabled={selecting}
      className={`group relative w-full text-left rounded-3xl border ${c.border} bg-gradient-to-br ${c.glow} to-transparent p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl disabled:opacity-60 disabled:scale-100 overflow-hidden`}
    >
      {/* Subtle shine on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl" />

      {/* Live indicator + type badge */}
      <div className="absolute top-5 right-5 flex items-center gap-1.5">
        {isHotel && (
          <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            HMS
          </span>
        )}
        <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Live</span>
      </div>

      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center mb-4 text-xl`}>
        {isHotel ? '🏨' : (property.type === 'CAFE' ? '☕' : '🍽️')}
      </div>

      {/* Property Info */}
      <div className="mb-5 space-y-1.5">
        <h2 className="text-xl font-black text-white leading-tight pr-8">{property.name}</h2>
        {(property.city || property.state) && (
          <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
            <MapPin size={9} />
            {[property.city, property.state].filter(Boolean).join(', ')}
          </p>
        )}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${c.badge}`}>
            {property.code}
          </span>
          {property._count?.users && (
            <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1">
              <Users size={8} /> {property._count.users} users
            </span>
          )}
          <span className="text-[9px] font-bold text-slate-700">
            {property.type || 'RESTAURANT'}
          </span>
        </div>
        {/* Hotel-specific info */}
        {isHotel && (
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {property.totalRooms && (
              <span className="text-[9px] font-bold text-amber-600/80 flex items-center gap-1">
                🛏️ {property.totalRooms} Rooms
              </span>
            )}
            {property.starRating && (
              <span className="text-[9px] font-bold text-amber-500/80">
                {'⭐'.repeat(property.starRating)}
              </span>
            )}
            {property.hotelCategory && (
              <span className="text-[9px] font-bold text-slate-600">
                {hotelCategoryLabel[property.hotelCategory] || property.hotelCategory}
              </span>
            )}
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${property.hmsEnabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
              HMS: {property.hmsEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        )}
      </div>

      {/* Quick stats badges */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {(isHotel ? [
          { icon: '🛏️', label: 'Rooms' },
          { icon: '📋', label: 'Bookings' },
          { icon: '🔑', label: 'Check-in' },
          { icon: '🧹', label: 'Housekeeping' },
        ] : [
          { icon: '🪑', label: 'Tables' },
          { icon: '📦', label: 'Live Orders' },
          { icon: '👥', label: 'Staff' },
          { icon: '💰', label: 'Revenue' },
        ]).map(badge => (
          <span key={badge.label} className="flex items-center gap-1 text-[8px] font-bold text-slate-600 px-2 py-1 rounded-lg bg-white/[0.03] border border-white/5">
            {badge.icon} {badge.label}
          </span>
        ))}
      </div>

      {/* CTA Button */}
      <div className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm text-white shadow-lg ${c.btn} transition-all duration-200`}>
        {selecting ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Opening...
          </>
        ) : (
          <>
            {isHotel ? 'Open Hotel PMS' : 'Open POS System'}
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
          </>
        )}
      </div>
    </button>
  );
}
