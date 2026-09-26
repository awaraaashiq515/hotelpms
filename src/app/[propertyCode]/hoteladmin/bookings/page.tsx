'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays, Search, RefreshCw, CheckCircle2, Clock,
  ArrowLeft, User, Phone, IndianRupee, BedDouble, AlertCircle,
  LogIn, LogOut, ShieldCheck, Tag
} from 'lucide-react';

interface Reservation {
  id: string;
  reservationNumber?: string;
  bookingCode?: string;
  guestName?: string;
  guestPhone?: string;
  roomNumber?: string;
  roomTypeName?: string;
  checkInDate: string;
  checkOutDate: string;
  status: string; // 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED'
  totalAmount?: number;
  paidAmount?: number;
  paymentStatus?: string; // 'PAID' | 'PARTIAL' | 'PENDING'
  source?: string;
  guest?: {
    name?: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
    phone?: string;
    email?: string;
  };
  room?: {
    roomNumber: string;
  };
  rooms?: Array<{
    room?: {
      roomNumber: string;
    };
  }>;
  checkIns?: Array<{
    room?: {
      roomNumber: string;
    };
  }>;
}

function HotelAdminBookingsContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyCode = (params?.propertyCode as string) || '';
  const urlStatus = searchParams?.get('status') || 'ALL';

  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotel/bookings`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setBookings(data.data);
      } else if (Array.isArray(data)) {
        setBookings(data);
      }
    } catch (e) {
      console.error('Failed to load bookings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (urlStatus) setStatusFilter(urlStatus);
  }, [urlStatus]);

  const getGuestName = (b: Reservation) => {
    if (b.guest?.name && b.guest.name.trim()) return b.guest.name.trim();
    if (b.guestName && b.guestName.trim()) return b.guestName.trim();
    const parts = [b.guest?.firstName, b.guest?.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Walk-in Guest';
  };

  const getGuestPhone = (b: Reservation) => {
    return b.guest?.mobile || b.guest?.phone || b.guestPhone || '';
  };

  const getRoomNumber = (b: Reservation) => {
    if (b.room?.roomNumber) return b.room.roomNumber;
    if (b.roomNumber) return b.roomNumber;
    if (b.rooms && b.rooms.length > 0 && b.rooms[0].room?.roomNumber) {
      return b.rooms[0].room.roomNumber;
    }
    if (b.checkIns && b.checkIns.length > 0 && b.checkIns[0].room?.roomNumber) {
      return b.checkIns[0].room.roomNumber;
    }
    return '—';
  };

  // Filter
  const filteredBookings = bookings.filter((b) => {
    const guest = getGuestName(b);
    const phone = getGuestPhone(b);
    const room = getRoomNumber(b);
    const code = b.bookingCode || b.reservationNumber || b.id || '';
    const q = (searchQuery || '').toLowerCase();

    const matchesSearch =
      !q ||
      guest.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q) ||
      room.toLowerCase().includes(q) ||
      code.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' || (b.status && b.status.toUpperCase() === statusFilter);

    return matchesSearch && matchesStatus;
  });

  // Today dates for metrics
  const todayStr = new Date().toISOString().split('T')[0];

  const inHouseCount = bookings.filter((b) => b.status === 'CHECKED_IN').length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const todayCheckIns = bookings.filter(
    (b) => b.checkInDate && b.checkInDate.startsWith(todayStr)
  ).length;
  const todayCheckOuts = bookings.filter(
    (b) => b.checkOutDate && b.checkOutDate.startsWith(todayStr)
  ).length;

  const totalRevenue = bookings
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

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
            <CalendarDays className="text-amber-500" size={26} />
            Reservations & Bookings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor all guest bookings, arrivals, departures, and folio balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">In-House Guests</p>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{inHouseCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Currently checked in</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Today Check-Ins</p>
          <p className="text-2xl font-black text-emerald-500 mt-1">{todayCheckIns}</p>
          <p className="text-[10px] text-slate-400 mt-1">Expected today</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Today Check-Outs</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{todayCheckOuts}</p>
          <p className="text-[10px] text-slate-400 mt-1">Departing today</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">Total Booking Value</p>
          <p className="text-2xl font-black text-blue-500 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400 mt-1">{bookings.length} total records</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Bookings' },
            { id: 'CHECKED_IN', label: '🟣 In-House' },
            { id: 'CONFIRMED', label: '🟢 Confirmed' },
            { id: 'CHECKED_OUT', label: '⚪ Checked Out' },
            { id: 'CANCELLED', label: '🔴 Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search guest, phone, room, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-amber-500 outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Reservations...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <CalendarDays className="mx-auto text-slate-400 mb-3" size={40} />
          <p className="font-bold text-slate-700 dark:text-slate-300">No reservations found</p>
          <p className="text-xs text-slate-400 mt-1">Try changing status filter or search query</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Booking Info</th>
                  <th className="py-3 px-4">Guest Details</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Stay Dates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredBookings.map((b) => {
                  const guestName = getGuestName(b);
                  const guestPhone = getGuestPhone(b);
                  const roomNum = getRoomNumber(b);
                  const isCheckedIn = b.status === 'CHECKED_IN';
                  const isConfirmed = b.status === 'CONFIRMED';
                  const isCheckedOut = b.status === 'CHECKED_OUT';
                  const isCancelled = b.status === 'CANCELLED';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Booking Code */}
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-900 dark:text-white block font-mono text-[11px]">
                          {b.bookingCode || b.reservationNumber || `#${b.id.slice(-6).toUpperCase()}`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {b.source || 'Direct Walk-in'}
                        </span>
                      </td>

                      {/* Guest Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <User size={12} className="text-amber-500" />
                          <span>{guestName}</span>
                        </div>
                        {guestPhone && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {guestPhone}
                          </span>
                        )}
                      </td>

                      {/* Room */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-slate-900 dark:text-white text-xs">
                          <BedDouble size={12} className="text-amber-500" />
                          Room {roomNum}
                        </span>
                      </td>

                      {/* Stay Dates */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                          {b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : '—'} →{' '}
                          {b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString() : '—'}
                        </div>
                        {b.checkInDate && b.checkOutDate && (
                          <span className="text-[9px] text-slate-400">
                            {Math.max(
                              1,
                              Math.round(
                                (new Date(b.checkOutDate).getTime() - new Date(b.checkInDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )}{' '}
                            night(s)
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isCheckedIn
                              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                              : isConfirmed
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : isCheckedOut
                              ? 'bg-slate-500/15 text-slate-500 border border-slate-500/30'
                              : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-slate-900 dark:text-white text-xs">
                          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            b.paymentStatus === 'PAID'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : b.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-500/15 text-amber-500'
                              : 'bg-rose-500/15 text-rose-500'
                          }`}
                        >
                          {b.paymentStatus || 'PENDING'}
                        </span>
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

export default function HotelAdminBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Reservations...</p>
        </div>
      }
    >
      <HotelAdminBookingsContent />
    </Suspense>
  );
}
