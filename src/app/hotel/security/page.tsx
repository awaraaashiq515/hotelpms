'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, QrCode, Search, CheckCircle2, AlertTriangle, Users,
  ArrowRight, Phone, Bed, Sparkles, ExternalLink, RefreshCw,
  FileText, ShieldCheck, Eye, BadgeCheck
} from 'lucide-react';

export default function HotelReceptionSecurityPage() {
  const router = useRouter();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inHouseGuests, setInHouseGuests] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch current property
    fetch('/api/setup/properties')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          const prop = data.data.find((p: any) => p.type === 'HOTEL') || data.data[0];
          setProperty(prop);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // 2. Fetch active in-house reservations/guests
    fetch('/api/hotel/bookings?status=CHECKED_IN')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setInHouseGuests(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const propCode = property?.code || property?.propertyCode;
  const securityPortalUrl = propCode ? `/security-portal/${propCode.toLowerCase()}` : '/security-portal';

  const filteredGuests = inHouseGuests.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = `${g.guest?.firstName || ''} ${g.guest?.lastName || ''}`.toLowerCase();
    const phone = (g.guest?.mobile || '').toLowerCase();
    const room = (g.rooms?.[0]?.room?.roomNumber || '').toLowerCase();
    const booking = (g.bookingNo || '').toLowerCase();
    return name.includes(q) || phone.includes(q) || room.includes(q) || booking.includes(q);
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-[#0d1527] to-[#090e1a] border border-cyan-500/20 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield size={22} />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
                Front Desk · Reception
              </span>
              <h1 className="text-2xl font-black text-white">Security & Verification Desk</h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Verify guest government IDs (Aadhaar, PAN, Passport), scan visitor entry QR passes, and monitor in-house resident security status in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(securityPortalUrl)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/25 cursor-pointer"
          >
            <ShieldCheck size={18} />
            <span>Open Full Security Portal</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Launch Scanner */}
        <Link
          href={securityPortalUrl}
          className="group p-5 rounded-3xl bg-[#090f1e] border border-slate-800 hover:border-cyan-500/40 transition-all space-y-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
            <QrCode size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-cyan-300">Live QR & ID Scanner</h3>
            <p className="text-xs text-slate-400 mt-1">
              Scan guest QR codes, passcodes, and verify digital check-in passes instantly.
            </p>
          </div>
          <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
            Launch Scanner <ArrowRight size={12} />
          </span>
        </Link>

        {/* 2. Check-in & KYC */}
        <Link
          href="/hotel/checkin"
          className="group p-5 rounded-3xl bg-[#090f1e] border border-slate-800 hover:border-indigo-500/40 transition-all space-y-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
            <BadgeCheck size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-indigo-300">Front Desk Guest Check-In</h3>
            <p className="text-xs text-slate-400 mt-1">
              Capture guest Aadhaar Card, PAN Card, or Passport with physical room assignment.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
            New Check-In <ArrowRight size={12} />
          </span>
        </Link>

        {/* 3. Agent KYC Bookings */}
        <Link
          href="/hotel/agent-bookings"
          className="group p-5 rounded-3xl bg-[#090f1e] border border-slate-800 hover:border-violet-500/40 transition-all space-y-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
            <Users size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white group-hover:text-violet-300">Agent Bookings & KYC</h3>
            <p className="text-xs text-slate-400 mt-1">
              Review agent bookings submitted with verified Aadhaar / PAN card documents.
            </p>
          </div>
          <span className="text-xs font-bold text-violet-400 flex items-center gap-1">
            View Bookings <ArrowRight size={12} />
          </span>
        </Link>
      </div>

      {/* In-House Guests Verification List */}
      <div className="p-6 rounded-3xl bg-[#090f1e] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              <Users size={18} className="text-cyan-400" />
              <span>In-House Guests Verification Monitor</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Active residents currently checked in at the property.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search guest, phone, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#060a14] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {filteredGuests.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <ShieldCheck size={36} className="mx-auto text-slate-700 mb-2" />
            <p className="text-sm font-bold text-slate-400">No checked-in guests matching search</p>
            <p className="text-xs text-slate-600 mt-0.5">
              Guests checked in at reception or through security gate will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredGuests.map((g) => {
              const guestName = `${g.guest?.firstName || 'Guest'} ${g.guest?.lastName || ''}`.trim();
              const roomNo = g.rooms?.[0]?.room?.roomNumber || 'Assigned';
              return (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-[#060a14] border border-slate-800/80 hover:border-cyan-500/30 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-black">
                        Room {roomNo}
                      </span>
                      <p className="text-xs font-black text-white">{guestName}</p>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      {g.guest?.mobile && (
                        <span className="flex items-center gap-1">
                          <Phone size={10} /> {g.guest.mobile}
                        </span>
                      )}
                      <span>Booking: #{g.bookingNo || g.id.slice(-6)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                      <CheckCircle2 size={10} /> In-House
                    </span>
                    <button
                      onClick={() => router.push(securityPortalUrl)}
                      title="Verify in Security Portal"
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                    >
                      <Eye size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
