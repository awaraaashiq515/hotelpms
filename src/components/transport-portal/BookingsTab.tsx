'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, MapPin, Phone, User, Calendar, Loader2, ChevronDown, Filter, Navigation, Map } from 'lucide-react';
import { toast } from 'sonner';
import { RideMapView } from './RideMapView';

type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; dot: string }> = {
  PENDING:     { label: 'Pending',     color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',  dot: 'bg-yellow-400' },
  CONFIRMED:   { label: 'Confirmed',   color: 'bg-blue-500/10 border-blue-500/30 text-blue-400',        dot: 'bg-blue-400' },
  IN_PROGRESS: { label: 'On The Way',  color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',  dot: 'bg-indigo-400 animate-pulse' },
  COMPLETED:   { label: 'Completed',   color: 'bg-green-500/10 border-green-500/30 text-green-400',     dot: 'bg-green-400' },
  CANCELLED:   { label: 'Cancelled',   color: 'bg-red-500/10 border-red-500/30 text-red-400',           dot: 'bg-red-400' },
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Bookings' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'IN_PROGRESS', label: 'On The Way' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function BookingsTab({ token }: { token: string }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedMapId, setExpandedMapId] = useState<string | null>(null);

  const fetchBookings = async (status = '') => {
    setLoading(true);
    try {
      const url = `/api/transport/bookings${status ? `?status=${status}` : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(filter); }, [filter]);

  const updateStatus = async (bookingId: string, status: BookingStatus) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch('/api/transport/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId, status })
      });
      const data = await res.json();
      if (data.success) {
        setBookings(bs => bs.map(b => b.id === bookingId ? { ...b, status } : b));
        const msg: Record<string, string> = {
          CONFIRMED: 'Booking accepted! ✅',
          CANCELLED: 'Booking declined',
          IN_PROGRESS: 'Trip started! 🚗',
          COMPLETED: 'Trip completed! 🎉',
        };
        toast.success(msg[status] || 'Updated');
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const inProgressCount = bookings.filter(b => b.status === 'IN_PROGRESS').length;
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            Bookings & Ride Requests
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-yellow-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingCount} new
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage guest ride requests, pickup locations, and trip status</p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-3 text-center">
          <span className="text-[10px] font-black text-yellow-400 uppercase tracking-wider block">New</span>
          <span className="text-xl font-black text-white">{pendingCount}</span>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3 text-center">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">Active</span>
          <span className="text-xl font-black text-white">{inProgressCount}</span>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-3 text-center">
          <span className="text-[10px] font-black text-green-400 uppercase tracking-wider block">Completed</span>
          <span className="text-xl font-black text-white">{completedCount}</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
              filter === opt.value
                ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-blue-400" size={32} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <Calendar size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-bold">No Bookings Found</p>
          <p className="text-slate-600 text-xs mt-1">No booking requests received yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(booking => {
            const cfg = STATUS_CONFIG[booking.status as BookingStatus] || STATUS_CONFIG.PENDING;
            return (
              <div key={booking.id} className={`bg-[#0c1525]/70 border rounded-2xl p-4 backdrop-blur-sm transition-all ${
                booking.status === 'PENDING' ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/5' : 'border-slate-800/60'
              }`}>
                {/* Top: Guest + Status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                        <User size={12} className="text-white" />
                      </div>
                      <span className="text-sm font-black text-white">{booking.guestName}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 ml-9">
                      {booking.guestPhone && (
                        <a href={`tel:${booking.guestPhone}`} className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors">
                          <Phone size={10} /> {booking.guestPhone}
                        </a>
                      )}
                      {booking.guestRoom && (
                        <span className="text-[10px] text-slate-500">Room {booking.guestRoom}</span>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-black ${cfg.color}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></div>
                    {cfg.label}
                  </div>
                </div>

                {/* Route */}
                <div className="bg-slate-900/40 rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-center gap-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        <div className="w-px h-4 bg-slate-600"></div>
                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                      </div>
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="text-xs text-slate-200">{booking.fromLocation}</span>
                        <span className="text-xs text-slate-200">{booking.toLocation}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setExpandedMapId(expandedMapId === booking.id ? null : booking.id)}
                      className="px-2.5 py-1 rounded-xl bg-blue-600/10 border border-blue-500/30 text-blue-400 text-[10px] font-black flex items-center gap-1 hover:bg-blue-600/20 transition-all shrink-0"
                    >
                      <Map size={11} />
                      {expandedMapId === booking.id ? 'Hide Map' : 'Route Map'}
                    </button>
                  </div>

                  <div className="flex gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <Calendar size={9} className="text-blue-400" /> {booking.travelDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={9} className="text-blue-400" /> {booking.travelTime}
                    </span>
                    <span>{booking.seats} seat{booking.seats > 1 ? 's' : ''}</span>
                    {booking.totalAmount > 0 && (
                      <span className="text-green-400 font-bold">₹{booking.totalAmount}</span>
                    )}
                  </div>
                </div>

                {/* Expandable Ride Map View */}
                {expandedMapId === booking.id && (
                  <div className="mb-3">
                    <RideMapView
                      fromLocation={booking.fromLocation}
                      toLocation={booking.toLocation}
                      perKmRate={booking.schedule?.vehicle?.perKmRate || 15}
                      baseFare={booking.schedule?.vehicle?.baseFare || 50}
                      status={booking.status}
                    />
                  </div>
                )}

                {/* Notes */}
                {booking.notes && (
                  <p className="text-[10px] text-slate-500 mb-3 italic">"{booking.notes}"</p>
                )}

                {/* Actions */}
                {booking.status === 'PENDING' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(booking.id, 'CONFIRMED')}
                      disabled={updatingId === booking.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600/80 hover:bg-green-600 border border-green-500/40 text-white text-xs font-black py-2.5 rounded-xl transition-all"
                    >
                      {updatingId === booking.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                      Accept
                    </button>
                    <button
                      onClick={() => updateStatus(booking.id, 'CANCELLED')}
                      disabled={updatingId === booking.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-xs font-black py-2.5 rounded-xl transition-all"
                    >
                      <XCircle size={12} /> Decline
                    </button>
                  </div>
                )}

                {booking.status === 'CONFIRMED' && (
                  <button
                    onClick={() => updateStatus(booking.id, 'IN_PROGRESS')}
                    disabled={updatingId === booking.id}
                    className="w-full flex items-center justify-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-500/40 text-white text-xs font-black py-2.5 rounded-xl transition-all"
                  >
                    {updatingId === booking.id ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                    Start Trip
                  </button>
                )}

                {booking.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateStatus(booking.id, 'COMPLETED')}
                    disabled={updatingId === booking.id}
                    className="w-full flex items-center justify-center gap-1.5 bg-green-600/80 hover:bg-green-600 border border-green-500/40 text-white text-xs font-black py-2.5 rounded-xl transition-all"
                  >
                    {updatingId === booking.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    Complete Trip
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
