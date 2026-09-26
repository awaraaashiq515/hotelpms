'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2, ArrowRight, MapPin, Users, RefreshCw,
  CircleAlert, Hotel, Plus, Sparkles, Bed,
} from 'lucide-react';

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

export default function HotelAdminRootPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [selecting, setSelecting] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) {
          router.replace('/login');
          return;
        }
        const role = d.user?.role;
        const isAllowed = role === 'HOTEL_ADMIN' || role === 'SUPER_ADMIN' || role === 'RESTAURANTS_ADMIN';
        if (!isAllowed) {
          router.replace('/login');
          return;
        }

        setUserName(d.user?.fullName || d.user?.name || 'Hotel Admin');

        return fetch('/api/admin/properties')
          .then(r => r.json())
          .then(pData => {
            if (pData.success && pData.data?.length > 0) {
              setProperties(pData.data);
              // Auto-redirect to first property or user's assigned property if not in ?hub=1 mode
              if (typeof window !== 'undefined') {
                const sp = new URLSearchParams(window.location.search);
                if (!sp.get('hub')) {
                  const target = d.user?.propertyCode || pData.data.find((p: any) => p.type === 'HOTEL')?.code || pData.data[0]?.code;
                  if (target) {
                    router.replace(`/${target}/hoteladmin`);
                    return;
                  }
                }
              }
            } else {
              setProperties([]);
            }
          });
      })
      .catch(() => setError('Failed to load. Please refresh.'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        router.push(`/${property.code}/hoteladmin`);
      } else {
        alert(data.error || 'Failed to select property.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090e] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
          <p className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Opening Hotel Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090e] text-white px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Hotel Admin Portal</span>
            </div>
            <h1 className="text-2xl font-black text-white">Select Hotel Property</h1>
            <p className="text-xs text-slate-400 mt-1">Welcome back, {userName}. Choose a property to open its Live Command Center.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold flex items-center gap-2">
            <CircleAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {properties.map(property => {
            const isHotel = property.type === 'HOTEL';
            return (
              <button
                key={property.id}
                onClick={() => handleSelect(property)}
                disabled={!!selecting}
                className="text-left p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-transparent hover:border-amber-500/40 transition-all group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-xl">
                    {isHotel ? '🏨' : '🍽️'}
                  </div>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {property.code}
                  </span>
                </div>
                <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">{property.name}</h3>
                {property.city && (
                  <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                    <MapPin size={11} /> {property.city}
                  </p>
                )}
                <div className="mt-5 flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs font-bold text-slate-400">Open Hotel Dashboard</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    {selecting === property.id ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
