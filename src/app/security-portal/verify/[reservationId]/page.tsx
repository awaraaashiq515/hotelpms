'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  ShieldCheck, AlertCircle, Clock, CheckCircle2, BedDouble,
  Calendar, Users, Waves, Sparkles, MapPin, Phone, ShieldAlert,
  Loader2, ArrowLeft, RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface VerifyData {
  verificationStatus: 'VALID' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED' | 'INVALID';
  reservation?: {
    id: string;
    bookingNo: string;
    status: string;
    arrivalDate: string;
    departureDate: string;
    adults: number;
    children: number;
    totalAmount: number;
    advanceAmount: number;
    dueAmount: number;
    mealPlan?: string;
    poolAccess?: boolean;
    poolPackage?: string;
    spaPackage?: string;
    addOnNotes?: string;
    roomNumber?: string;
    floor?: string;
    roomType?: string;
    checkInTime?: string;
    expectedCheckout?: string;
  };
  guest?: {
    firstName: string;
    lastName: string;
    mobile: string;
    email?: string;
    idType?: string;
    idNumber?: string;
  };
  property?: {
    name: string;
    brandName?: string;
    phone?: string;
    address?: string;
  };
}

export default function SecurityVerifyPage() {
  const params = useParams();
  const reservationId = params?.reservationId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerifyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchVerification = async () => {
    if (!reservationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/security/verify/${reservationId}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
      } else {
        setError(json.message || 'Verification failed. Invalid or expired QR code.');
      }
    } catch {
      setError('Network error while checking verification.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerification();
  }, [reservationId]);

  const status = data?.verificationStatus || 'INVALID';

  const statusConfig = {
    VALID: {
      title: 'VERIFIED IN-HOUSE GUEST',
      subtitle: 'Guest is currently checked-in and cleared for hotel entry & facilities',
      bannerBg: 'from-emerald-900/60 to-emerald-950/90 border-emerald-500/40 text-emerald-300',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon: <ShieldCheck size={36} className="text-emerald-400" />,
    },
    CONFIRMED: {
      title: 'RESERVATION CONFIRMED (AWAITING CHECK-IN)',
      subtitle: 'Guest has a valid booking for today/upcoming stay. Proceed to front desk.',
      bannerBg: 'from-indigo-900/60 to-indigo-950/90 border-indigo-500/40 text-indigo-300',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      icon: <CheckCircle2 size={36} className="text-indigo-400" />,
    },
    EXPIRED: {
      title: 'CHECKED OUT (PASS EXPIRED)',
      subtitle: 'Stay completed. Room access and guest privileges are no longer active.',
      bannerBg: 'from-slate-900/80 to-slate-950 border-slate-700 text-slate-400',
      badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
      icon: <Clock size={36} className="text-slate-400" />,
    },
    CANCELLED: {
      title: 'RESERVATION CANCELLED',
      subtitle: 'This booking has been cancelled. Entry denied.',
      bannerBg: 'from-rose-900/60 to-rose-950/90 border-rose-500/40 text-rose-300',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: <AlertCircle size={36} className="text-rose-400" />,
    },
    INVALID: {
      title: 'INVALID PASS',
      subtitle: 'No reservation record found for this QR code.',
      bannerBg: 'from-rose-900/60 to-rose-950/90 border-rose-500/40 text-rose-300',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: <ShieldAlert size={36} className="text-rose-400" />,
    },
  }[status];

  const res = data?.reservation;
  const guest = data?.guest;
  const prop = data?.property;

  const arrStr = res?.arrivalDate
    ? new Date(res.arrivalDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';
  const depStr = res?.departureDate
    ? new Date(res.departureDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="min-h-screen bg-[#050a14] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-indigo-700/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-[10%] w-[400px] h-[400px] bg-violet-700/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-lg relative z-10 space-y-4">
        {/* Hotel branding header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
            <ShieldCheck size={12} /> Hotel Security Verification
          </div>
          <h1 className="text-2xl font-black text-white">{prop?.name || 'Hotel Security Gate Pass'}</h1>
          {prop?.address && (
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
              <MapPin size={12} /> {prop.address}
            </p>
          )}
        </div>

        {loading ? (
          <div className="p-12 rounded-3xl bg-[#090d1a] border border-slate-800 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="animate-spin text-indigo-500" size={36} />
            <p className="text-xs font-bold text-slate-400">Verifying security pass...</p>
          </div>
        ) : error || !data ? (
          <div className="p-8 rounded-3xl bg-rose-950/20 border border-rose-500/30 text-center space-y-3">
            <ShieldAlert size={40} className="text-rose-400 mx-auto" />
            <h2 className="text-lg font-black text-rose-300">Verification Failed</h2>
            <p className="text-xs text-slate-400">{error || 'Invalid or unverified pass'}</p>
            <button
              onClick={fetchVerification}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-all mt-2"
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        ) : (
          <div className="rounded-3xl bg-[#090d1a] border border-slate-800 shadow-2xl overflow-hidden space-y-4 p-5 sm:p-6">
            {/* Status verification banner */}
            <div
              className={`p-4 sm:p-5 rounded-2xl bg-gradient-to-br border flex items-center gap-4 ${statusConfig.bannerBg}`}
            >
              <div className="shrink-0">{statusConfig.icon}</div>
              <div className="min-w-0">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border mb-1 ${statusConfig.badgeBg}`}
                >
                  {statusConfig.title}
                </span>
                <p className="text-xs font-medium text-slate-300 leading-snug">
                  {statusConfig.subtitle}
                </p>
              </div>
            </div>

            {/* Main Reservation Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Booking Reference
                  </p>
                  <p className="text-base font-black text-white">{res?.bookingNo}</p>
                </div>
                {res?.roomNumber && (
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Assigned Room
                    </p>
                    <p className="text-base font-black text-emerald-400">
                      Room {res.roomNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Guest Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Guest Name
                  </p>
                  <p className="font-bold text-white mt-0.5">
                    {guest ? `${guest.firstName} ${guest.lastName || ''}`.trim() : 'Guest'}
                  </p>
                  {guest?.mobile && (
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone size={10} /> {guest.mobile}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Room Category
                  </p>
                  <p className="font-bold text-white mt-0.5">{res?.roomType || 'Standard Room'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {res?.adults || 1} Adults{res?.children ? `, ${res.children} Children` : ''}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Stay Dates
                  </p>
                  <p className="font-bold text-slate-200 mt-0.5 text-[11px]">
                    {arrStr} → {depStr}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                    Payment Status
                  </p>
                  <p
                    className={`font-bold mt-0.5 text-xs ${
                      (res?.dueAmount ?? 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {(res?.dueAmount ?? 0) > 0 ? `₹${res?.dueAmount} Due` : 'Fully Paid / Clear'}
                  </p>
                </div>
              </div>

              {/* Special Permissions / Amenities Badges */}
              <div className="flex flex-wrap gap-2 pt-1">
                {res?.mealPlan && (
                  <span className="px-3 py-1 rounded-xl text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    🍽️ Meal Plan: {res.mealPlan}
                  </span>
                )}
                {(res?.poolAccess || (res?.poolPackage && res?.poolPackage !== 'NONE')) && (
                  <span className="px-3 py-1 rounded-xl text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                    <Waves size={12} className="text-cyan-400" /> Swimming Pool Access Active
                  </span>
                )}
                {res?.spaPackage && res?.spaPackage !== 'NONE' && (
                  <span className="px-3 py-1 rounded-xl text-[10px] font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20 flex items-center gap-1">
                    <Sparkles size={12} className="text-pink-400" /> Spa Package Active
                  </span>
                )}
              </div>
            </div>

            {/* Security Timestamp Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
              <span>Security System Validated</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )}

        {/* Back navigation */}
        <div className="text-center pt-2">
          <Link
            href="/guest-portal/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} /> Back to Guest Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
