'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Search, Star, Phone, Mail, Crown, Filter, Plus, TrendingUp, Calendar, Heart } from 'lucide-react';
import { useGuests } from '@/hooks/hotel/useGuests';
import { EmptyState } from '@/components/hotel/ui/EmptyState';
import { StatusBadge } from '@/components/hotel/ui/StatusBadge';
import type { GuestSegment } from '@/types/hotel/guest.types';

const SEGMENTS: { label: string; value: GuestSegment | 'ALL' }[] = [
  { label: 'All Guests',  value: 'ALL' },
  { label: 'VIP',         value: 'VIP' },
  { label: 'Corporate',   value: 'CORPORATE' },
  { label: 'Loyalty',     value: 'LOYALTY' },
  { label: 'Regular',     value: 'REGULAR' },
];

const SEGMENT_VARIANT: Record<string, any> = {
  VIP: 'warning', CORPORATE: 'info', LOYALTY: 'success', REGULAR: 'slate', BLACKLIST: 'danger',
};

export default function CRMPage() {
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<GuestSegment | 'ALL'>('ALL');
  const { guests, loading, total, setFilter } = useGuests();

  function handleSearch(s: string) {
    setSearch(s);
    setFilter({ search: s, segment: segment === 'ALL' ? undefined : segment });
  }

  function handleSegment(seg: GuestSegment | 'ALL') {
    setSegment(seg);
    setFilter({ search, segment: seg === 'ALL' ? undefined : seg });
  }

  const safeGuests = Array.isArray(guests) ? guests : [];

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-purple-400" />
            <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Guest Intelligence · CRM</span>
          </div>
          <h1 className="text-2xl font-black text-white">360° Guest Profiles</h1>
          <p className="text-xs text-slate-500 mt-0.5">{total} guests in database</p>
        </div>
        <Link href="/hotel/bookings"
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-wider transition-colors">
          <Plus size={13} /> New Guest
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Guests',   value: total,              icon: Users,     color: 'text-purple-300 border-purple-500/20 bg-purple-900/20' },
          { label: 'VIP Members',    value: safeGuests.filter(g => g && g.segment === 'VIP').length,       icon: Crown,     color: 'text-yellow-300 border-yellow-500/20 bg-yellow-900/20' },
          { label: 'Loyalty Points', value: safeGuests.reduce((s, g) => s + (g?.loyaltyPoints || 0), 0).toLocaleString('en-IN'), icon: Star, color: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
          { label: 'Corporate',      value: safeGuests.filter(g => g && g.segment === 'CORPORATE').length, icon: TrendingUp, color: 'text-sky-300 border-sky-500/20 bg-sky-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <s.icon size={16} className="mb-2 opacity-80" />
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, phone, email…"
            className="w-full h-9 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {SEGMENTS.map(s => (
            <button key={s.value} onClick={() => handleSegment(s.value)}
              className={`px-3 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${segment === s.value ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guest Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-600 text-xs">Loading guests…</div>
      ) : safeGuests.length === 0 ? (
        <EmptyState message="No guests found" sub="Start by adding a guest via New Booking" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {safeGuests.map(g => (
            <div key={g.id} className="rounded-2xl bg-slate-900/50 border border-white/5 p-4 hover:border-purple-500/30 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-sm font-black text-white shrink-0">
                  {g.firstName[0]}{g.lastName?.[0] || ''}
                </div>
                <StatusBadge label={g.segment} variant={SEGMENT_VARIANT[g.segment] ?? 'slate'} />
              </div>
              <p className="text-sm font-black text-white">{g.firstName} {g.lastName}</p>
              <div className="mt-2 space-y-1">
                {g.mobile && (
                  <div className="flex items-center gap-1.5">
                    <Phone size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-400">{g.mobile}</span>
                  </div>
                )}
                {g.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-400 truncate">{g.email}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star size={10} className="text-yellow-400" fill="currentColor" />
                  <span className="text-[9px] text-slate-400">{g.loyaltyPoints.toLocaleString()} pts</span>
                </div>
                {g.nationality && (
                  <span className="text-[9px] text-slate-600">{g.nationality}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
