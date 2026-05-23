'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bed, 
  CalendarDays, 
  UserCheck, 
  UserMinus, 
  Loader2, 
  Sparkles,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';

export default function HotelDashboard() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/hotel/rooms').then((res) => res.json()),
      fetch('/api/hotel/bookings').then((res) => res.json()),
    ])
      .then(([roomsRes, bookingsRes]) => {
        if (roomsRes.success) setRooms(roomsRes.data);
        if (bookingsRes.success) setBookings(bookingsRes.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading dashboard data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  // Calculate Metrics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r) => r.status === 'OCCUPIED').length;
  const maintenanceRooms = rooms.filter((r) => r.status === 'MAINTENANCE' || r.maintenanceStatus).length;
  const dirtyRooms = rooms.filter((r) => r.housekeepingStatus === 'DIRTY').length;
  const availableRooms = totalRooms - occupiedRooms - maintenanceRooms;

  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Filter Bookings for Today
  const todayStr = new Date().toISOString().split('T')[0];
  const arrivalsToday = bookings.filter((b) => {
    const arrDate = new Date(b.arrivalDate).toISOString().split('T')[0];
    return arrDate === todayStr && b.status === 'CONFIRMED';
  });

  const departuresToday = bookings.filter((b) => {
    const depDate = new Date(b.departureDate).toISOString().split('T')[0];
    return depDate === todayStr && b.status === 'CHECKED_IN';
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-500/20 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Sparkles size={12} /> Command Center
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">
            Hotel Front Desk Console
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            Real-time control panel for checking in guests, reviewing occupancy, managing room status, and processing folio settlements.
          </p>
        </div>

        <div className="shrink-0 flex gap-3">
          <Link
            href="/hotel/checkin"
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <UserCheck size={16} /> Quick Check-In
          </Link>
          <Link
            href="/hotel/calendar"
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-bold text-sm transition-all flex items-center gap-2"
          >
            <CalendarDays size={16} /> View Timeline
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Occupancy Card */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <Bed size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{occupancyRate}%</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Occupancy Rate</p>
            <p className="text-[10px] text-slate-400 mt-1">{occupiedRooms} of {totalRooms} Rooms Occupied</p>
          </div>
        </div>

        {/* Available Rooms Card */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <Bed size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{availableRooms}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Vacant Clean</p>
            <p className="text-[10px] text-slate-400 mt-1">Ready for check-in immediately</p>
          </div>
        </div>

        {/* Dirty Rooms Card */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{dirtyRooms}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Needs Cleaning</p>
            <p className="text-[10px] text-slate-400 mt-1">Marked for housekeeping attention</p>
          </div>
        </div>

        {/* Maintenance Rooms Card */}
        <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-2xl font-black text-white">{maintenanceRooms}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">Maintenance</p>
            <p className="text-[10px] text-slate-400 mt-1">Out of service or blocked</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Arrivals / Departures & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Arrivals & Departures Feeds */}
        <div className="xl:col-span-2 space-y-6">
          {/* Arrivals List */}
          <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Expected Arrivals Today ({arrivalsToday.length})
              </h3>
              <Link href="/hotel/bookings" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
                All Bookings <ArrowRight size={12} />
              </Link>
            </div>

            {arrivalsToday.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic">
                No arrivals scheduled for today.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {arrivalsToday.map((booking) => (
                  <div key={booking.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {booking.guest.firstName} {booking.guest.lastName}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">
                        {booking.bookingNo} • {booking.roomType.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">
                        {booking.adults} Adults
                      </span>
                      <Link
                        href={`/hotel/checkin?resId=${booking.id}`}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider transition-colors"
                      >
                        Check-in
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Departures List */}
          <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Expected Departures Today ({departuresToday.length})
              </h3>
              <Link href="/hotel/billing" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1">
                Active Guest Ledger <ArrowRight size={12} />
              </Link>
            </div>

            {departuresToday.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic">
                No departures scheduled for today.
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {departuresToday.map((booking) => (
                  <div key={booking.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">
                        {booking.guest.firstName} {booking.guest.lastName}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide">
                        Room {booking.rooms?.[0]?.room?.roomNumber || 'N/A'} • Booking {booking.bookingNo}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-rose-400 font-bold">
                        Bal: ₹{booking.dueAmount}
                      </span>
                      <Link
                        href={`/hotel/billing?resId=${booking.id}`}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-[11px] font-black uppercase tracking-wider transition-colors"
                      >
                        Checkout
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Booking Stream */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0f172a] border border-slate-800 p-6 space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Recent Reservations
            </h3>

            {bookings.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs italic">
                No recent bookings found.
              </div>
            ) : (
              <div className="space-y-3.5">
                {bookings.slice(0, 5).map((booking) => {
                  const arrDateStr = new Date(booking.arrivalDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  });
                  return (
                    <div key={booking.id} className="p-3.5 rounded-2xl bg-slate-900/50 border border-slate-800/50 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          {booking.guest.firstName} {booking.guest.lastName}
                        </p>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                          {booking.bookingNo} • {booking.roomType.code}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400">
                          {arrDateStr}
                        </span>
                        <p className="text-[9px] text-slate-400 mt-1">₹{booking.totalAmount}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
