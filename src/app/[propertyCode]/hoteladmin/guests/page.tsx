'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Search, RefreshCw, Star, ArrowLeft, Phone, Mail,
  CreditCard, Calendar, ShieldCheck, MapPin, BedDouble
} from 'lucide-react';

interface GuestItem {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  isVip?: boolean;
  segment?: string;
  notes?: string;
  createdAt?: string;
  reservations?: any[];
  _count?: {
    reservations?: number;
  };
}

function HotelAdminGuestsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyCode = (params?.propertyCode as string) || '';
  const filterVip = searchParams?.get('filter') === 'vip';

  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [vipOnly, setVipOnly] = useState(filterVip);

  const fetchGuests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotel/guests`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setGuests(data.data);
      } else if (Array.isArray(data)) {
        setGuests(data);
      }
    } catch (e) {
      console.error('Failed to load guests', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const getGuestFullName = (g: GuestItem) => {
    if (g.name && g.name.trim()) return g.name.trim();
    const parts = [g.firstName, g.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Walk-in Guest';
  };

  const getGuestPhone = (g: GuestItem) => {
    return g.mobile || g.phone || '';
  };

  const isGuestVip = (g: GuestItem) => {
    return !!(g.isVip || (g.segment && g.segment.toUpperCase() === 'VIP'));
  };

  const filteredGuests = guests.filter((g) => {
    const fullName = getGuestFullName(g);
    const phone = getGuestPhone(g);
    const email = g.email || '';
    const city = g.city || g.address || '';
    const q = (searchQuery || '').toLowerCase();

    const matchesSearch =
      !q ||
      fullName.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      city.toLowerCase().includes(q);

    const matchesVip = !vipOnly || isGuestVip(g);

    return matchesSearch && matchesVip;
  });

  const totalGuests = guests.length;
  const vipCount = guests.filter((g) => isGuestVip(g)).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${propertyCode}/hoteladmin`}
              className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="text-amber-500" size={26} />
            Guest Directory & History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hotel guest profiles, visit history, loyalty, and contact information
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchGuests}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Registered Guests</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalGuests}</p>
          <p className="text-[10px] text-slate-400 mt-1">In guest database</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">VIP Guests</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{vipCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Special status guests</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-purple-500">Repeat Guest Rate</p>
          <p className="text-2xl font-black text-purple-500 mt-1">
            {totalGuests > 0
              ? `${Math.round(
                  (guests.filter(
                    (g) =>
                      (g.reservations && g.reservations.length > 1) ||
                      (g._count?.reservations && g._count.reservations > 1)
                  ).length /
                    totalGuests) *
                    100
                )}%`
              : '0%'}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Guests with multiple stays</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by name, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-amber-500 outline-none transition-all dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setVipOnly(!vipOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              vipOnly
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Star size={14} className={vipOnly ? 'fill-white' : 'text-amber-500'} />
            VIP Guests Only
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Guest Directory...</p>
        </div>
      ) : filteredGuests.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Users className="mx-auto text-slate-400 mb-3" size={40} />
          <p className="font-bold text-slate-700 dark:text-slate-300">No guests found</p>
          <p className="text-xs text-slate-400 mt-1">Try clearing your search query</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Guest Name</th>
                  <th className="py-3 px-4">Phone / Mobile</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">City / Location</th>
                  <th className="py-3 px-4 text-center">Stays</th>
                  <th className="py-3 px-4 text-right">Segment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredGuests.map((g) => {
                  const fullName = getGuestFullName(g);
                  const phone = getGuestPhone(g);
                  const isVip = isGuestVip(g);
                  const stayCount =
                    g.reservations?.length ||
                    g._count?.reservations ||
                    1;

                  return (
                    <tr key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{fullName}</span>
                          {isVip && (
                            <span className="p-0.5 rounded bg-amber-500/10 text-amber-500">
                              <Star size={12} className="fill-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {phone || '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {g.email || '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-500">
                        {g.city || g.address || '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                          {stayCount} stay(s)
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {isVip ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[10px] font-black uppercase tracking-wider">
                            ⭐ VIP
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">{g.segment || 'REGULAR'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HotelAdminGuestsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Guest Directory...</p>
        </div>
      }
    >
      <HotelAdminGuestsContent />
    </Suspense>
  );
}
