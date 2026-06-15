'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, ArrowRight, MapPin, Users, RefreshCw,
  UtensilsCrossed, CircleAlert, LogOut, ChevronRight,
  LayoutGrid, Activity, Star, Utensils,
} from 'lucide-react';

interface Property {
  id: string;
  name: string;
  code: string;
  type: string;
  city?: string;
  state?: string;
  _count?: { users: number };
}

export default function RestaurantAdminPortal() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [selecting, setSelecting] = useState<string | null>(null);

  useEffect(() => {
    // Auth check + load properties
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.push('/login'); return; }
        const role = d.user?.role;
        // Only RESTAURANTS_ADMIN and SUPER_ADMIN can use this portal
        if (role !== 'RESTAURANTS_ADMIN' && role !== 'SUPER_ADMIN') {
          // Redirect others to their own dashboard
          if (d.user?.propertyCode) {
            router.push(`/${d.user.propertyCode}/operations`);
          } else {
            router.push('/login');
          }
          return;
        }
        setUserName(d.user?.fullName || d.user?.name || 'Admin');
        // Load all properties
        return fetch('/api/admin/properties')
          .then(r => r.json())
          .then(pData => {
            if (pData.success && pData.data?.length > 0) {
              // Only show RESTAURANT type properties (not hotels)
              const restaurants = pData.data.filter(
                (p: Property) => !p.type || p.type === 'RESTAURANT' || p.type === 'POS'
              );
              setProperties(restaurants.length > 0 ? restaurants : pData.data);
            } else {
              setError('No properties found for your account.');
            }
          });
      })
      .catch(() => setError('Failed to load. Please refresh.'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSelect = (property: Property) => {
    setSelecting(property.id);
    // Navigate to the property's restaurantadmin page
    router.push(`/${property.code}/restaurantadmin`);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070d] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Utensils size={24} className="text-violet-400" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-black text-white">Loading your properties…</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Restaurant Admin Portal</p>
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
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-700/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-violet-600/4 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── TOP BAR ── */}
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <UtensilsCrossed size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white leading-tight">Restaurant Admin Portal</p>
                <p className="text-[10px] text-slate-500 font-bold">Welcome back, {userName}</p>
              </div>
            </div>
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

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-4xl">

            {/* Heading */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-[0.25em] mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Select Property to View Live Data
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
                Kaun si property<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">
                  ka dashboard dekhna hai?
                </span>
              </h1>
              <p className="text-sm text-slate-500 font-bold">
                {properties.length} {properties.length === 1 ? 'property' : 'properties'} available in your account
              </p>
            </div>

            {/* Property Cards Grid */}
            <div className={`grid gap-4 ${
              properties.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
              properties.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
              'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            }`}>
              {properties.map((property, index) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  index={index}
                  selecting={selecting === property.id}
                  onSelect={() => handleSelect(property)}
                />
              ))}
            </div>

            {/* Footer note */}
            <p className="text-center text-[10px] text-slate-700 font-bold mt-10">
              Property select karein → Live dashboard khulega • Auto-refreshes every 30s
            </p>
          </div>
        </div>

      </div>
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
  const colors = [
    { border: 'border-violet-500/25', glow: 'from-violet-500/12', dot: 'bg-violet-400', badge: 'bg-violet-500/15 text-violet-400', icon: 'bg-violet-500/15 text-violet-400', btn: 'bg-violet-500 hover:bg-violet-400 shadow-violet-900/50' },
    { border: 'border-indigo-500/25', glow: 'from-indigo-500/12', dot: 'bg-indigo-400', badge: 'bg-indigo-500/15 text-indigo-400', icon: 'bg-indigo-500/15 text-indigo-400', btn: 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-900/50' },
    { border: 'border-sky-500/25',    glow: 'from-sky-500/12',    dot: 'bg-sky-400',    badge: 'bg-sky-500/15 text-sky-400',    icon: 'bg-sky-500/15 text-sky-400',    btn: 'bg-sky-500 hover:bg-sky-400 shadow-sky-900/50'       },
    { border: 'border-emerald-500/25',glow: 'from-emerald-500/12',dot: 'bg-emerald-400',badge: 'bg-emerald-500/15 text-emerald-400',icon:'bg-emerald-500/15 text-emerald-400',btn:'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-900/50'},
    { border: 'border-amber-500/25',  glow: 'from-amber-500/12',  dot: 'bg-amber-400',  badge: 'bg-amber-500/15 text-amber-400',  icon: 'bg-amber-500/15 text-amber-400',  btn: 'bg-amber-500 hover:bg-amber-400 shadow-amber-900/50'   },
    { border: 'border-rose-500/25',   glow: 'from-rose-500/12',   dot: 'bg-rose-400',   badge: 'bg-rose-500/15 text-rose-400',   icon: 'bg-rose-500/15 text-rose-400',   btn: 'bg-rose-500 hover:bg-rose-400 shadow-rose-900/50'     },
  ];
  const c = colors[index % colors.length];

  return (
    <button
      onClick={onSelect}
      disabled={selecting}
      className={`group relative w-full text-left rounded-3xl border ${c.border} bg-gradient-to-br ${c.glow} to-transparent p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-900/20 disabled:opacity-60 disabled:scale-100 overflow-hidden`}
    >
      {/* Subtle shine on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl" />

      {/* Live indicator */}
      <div className="absolute top-5 right-5 flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Live</span>
      </div>

      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center mb-4`}>
        <Building2 size={22} />
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
      </div>

      {/* Quick stats badges */}
      <div className="flex flex-wrap gap-1.5 mb-5">
        {[
          { icon: <LayoutGrid size={9} />, label: 'Tables' },
          { icon: <Activity size={9} />,   label: 'Live Orders' },
          { icon: <Users size={9} />,       label: 'Staff' },
          { icon: <Star size={9} />,        label: 'Revenue' },
        ].map(badge => (
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
            Opening dashboard…
          </>
        ) : (
          <>
            Dashboard Kholein
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform duration-200" />
          </>
        )}
      </div>
    </button>
  );
}
