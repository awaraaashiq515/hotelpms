'use client';

import React, { useState, useEffect } from 'react';
import {
  Car, Bus, MapPin, Clock, Calendar, User, Phone, Star,
  CheckCircle, Loader2, Plus, Sparkles, Navigation, X, Shield, Users, Map, Crosshair
} from 'lucide-react';
import { toast } from 'sonner';
import { RideMapView } from '../transport-portal/RideMapView';

interface TransportTabProps {
  token: string;
  guestName?: string;
  guestPhone?: string;
  guestRoom?: string;
}

// GPS Location Auto-Detection & Autocomplete Input Component
function LocationInputWithGPS({
  label,
  value,
  onChange,
  placeholder = 'Type location...'
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [detecting, setDetecting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Auto-detect live location via browser Geolocation API or IP Location Fallback
  const handleDetectGPS = () => {
    setDetecting(true);

    const tryIPLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.city) {
          const loc = `${data.city}, ${data.region || data.country_name || ''}`.trim();
          onChange(loc);
          toast.success(`Location detected: ${loc} 🎯`);
        } else {
          onChange('Hotel Main Gate');
          toast.info('Using default location: Hotel Main Gate');
        }
      } catch {
        onChange('Hotel Main Gate');
        toast.info('Using default location: Hotel Main Gate');
      } finally {
        setDetecting(false);
      }
    };

    if (!navigator.geolocation) {
      tryIPLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          const placeName = data.address?.city || data.address?.town || data.address?.village || data.address?.suburb || data.display_name?.split(',')[0];
          const fullLoc = placeName ? `${placeName}, ${data.address?.state || ''}`.trim() : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
          onChange(fullLoc);
          toast.success(`Live GPS detected: ${fullLoc} 🎯`);
        } catch {
          onChange(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        console.log('[GPS Browser Error, trying IP location fallback]:', err);
        tryIPLocation();
      },
      { timeout: 5000 }
    );
  };

  // Search suggestions autocomplete via OpenStreetMap Nominatim
  useEffect(() => {
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=4&q=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const names = data.map((item: any) => {
            const parts = item.display_name.split(',');
            return parts.slice(0, 3).join(',').trim();
          });
          setSuggestions(Array.from(new Set(names)));
        }
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-black uppercase text-slate-400">{label} *</label>
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={detecting}
          className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
        >
          {detecting ? <Loader2 size={10} className="animate-spin text-blue-400" /> : <Crosshair size={10} />}
          {detecting ? 'Detecting GPS...' : '🎯 Use My Live Location'}
        </button>
      </div>

      <input
        type="text"
        required
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
      />

      {/* Autocomplete Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-[#0c1525] border border-slate-700 rounded-xl overflow-hidden shadow-2xl space-y-0.5 max-h-40 overflow-y-auto">
          {suggestions.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                onChange(sug);
                setShowDropdown(false);
              }}
              className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-blue-600/20 hover:text-white flex items-center gap-2 transition-colors border-b border-slate-800/50 last:border-0"
            >
              <MapPin size={12} className="text-blue-400 shrink-0" />
              <span className="truncate">{sug}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface TransportTabProps {
  token: string;
  guestName?: string;
  guestPhone?: string;
  guestRoom?: string;
}

const VEHICLE_BADGES: Record<string, { label: string; color: string; icon: any }> = {
  CAR:     { label: 'Car / Cab', icon: Car, color: 'from-orange-500 to-red-500' },
  BUS:     { label: 'Bus',       icon: Bus, color: 'from-blue-500 to-indigo-600' },
  MINIBUS: { label: 'Mini Bus',  icon: Bus, color: 'from-teal-500 to-cyan-600' },
  VAN:     { label: 'Van',       icon: Car, color: 'from-purple-500 to-violet-600' },
};

export default function TransportTab({ token, guestName = '', guestPhone = '', guestRoom = '' }: TransportTabProps) {
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [bookingModal, setBookingModal] = useState<any>(null); // target vehicle or schedule
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: guestName,
    phone: guestPhone,
    room: guestRoom,
    fromLocation: 'Hotel Main Gate',
    toLocation: 'City Airport',
    travelDate: new Date().toISOString().split('T')[0],
    travelTime: '09:00',
    seats: 1,
    notes: '',
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/guest-portal/transport', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDrivers(data.drivers || []);
        setSchedules(data.schedules || []);
        setMyBookings(data.guestBookings || []);
      }
    } catch {
      toast.error('Failed to load transport services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  useEffect(() => {
    if (guestName || guestPhone || guestRoom) {
      setForm(f => ({
        ...f,
        name: guestName || f.name,
        phone: guestPhone || f.phone,
        room: guestRoom || f.room,
      }));
    }
  }, [guestName, guestPhone, guestRoom]);

  const handleOpenBooking = (item: any, type: 'schedule' | 'vehicle') => {
    if (type === 'schedule') {
      setForm(f => ({
        ...f,
        fromLocation: item.fromLocation,
        toLocation: item.toLocation,
        travelTime: item.departureTime,
      }));
    }
    setBookingModal({ ...item, itemType: type });
  };

  const handleBookRide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.fromLocation || !form.toLocation) {
      toast.error('Please fill in all required fields');
      return;
    }

    const driverId = bookingModal.itemType === 'schedule'
      ? bookingModal.vehicle?.driver?.id || bookingModal.vehicle?.driverId
      : bookingModal.driverId || bookingModal.driver?.id;

    if (!driverId) {
      toast.error('Invalid driver selection');
      return;
    }

    const pricePerSeat = bookingModal.pricePerSeat || 0;
    const totalAmount = pricePerSeat * form.seats;

    setSubmitting(true);
    try {
      const res = await fetch('/api/guest-portal/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          driverId,
          scheduleId: bookingModal.itemType === 'schedule' ? bookingModal.id : null,
          guestName: form.name,
          guestPhone: form.phone,
          guestRoom: form.room,
          fromLocation: form.fromLocation,
          toLocation: form.toLocation,
          travelDate: form.travelDate,
          travelTime: form.travelTime,
          seats: form.seats,
          totalAmount,
          notes: form.notes,
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Ride requested successfully! Driver will accept shortly 🚗');
        setBookingModal(null);
        fetchData();
      } else {
        toast.error(data.message || 'Booking failed');
      }
    } catch {
      toast.error('Error sending request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Hero Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-violet-600/10 border border-blue-500/20 relative overflow-hidden">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles size={12} className="text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Hotel Ride & Travel Service</span>
        </div>
        <h2 className="text-2xl font-black text-white mb-1">Cab & Shuttle Service 🚌🚗</h2>
        <p className="text-xs text-slate-400">Book airport pickups, city tours, or private luxury cars directly with hotel drivers.</p>
      </div>

      {/* Active Guest Bookings Section */}
      {myBookings.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Navigation size={16} className="text-blue-400" />
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-200">My Requested Rides</h3>
          </div>
          <div className="space-y-3">
            {myBookings.map(b => (
              <div key={b.id} className="bg-[#0c1525]/80 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400">
                      <Car size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">{b.driver?.name || 'Hotel Driver'}</p>
                      <a href={`tel:${b.driver?.phone}`} className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                        <Phone size={10} /> {b.driver?.phone || 'Call Driver'}
                      </a>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${
                    b.status === 'PENDING' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
                    b.status === 'CONFIRMED' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                    b.status === 'IN_PROGRESS' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 animate-pulse' :
                    b.status === 'COMPLETED' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                    'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {b.status === 'PENDING' ? '● Waiting for Driver' :
                     b.status === 'CONFIRMED' ? '✓ Driver Confirmed' :
                     b.status === 'IN_PROGRESS' ? '🚗 On The Way' :
                     b.status === 'COMPLETED' ? '✓ Completed' : 'Cancelled'}
                  </span>
                </div>

                <div className="bg-slate-900/50 rounded-xl p-3 text-xs text-slate-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
                    <span className="truncate">{b.fromLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                    <span className="truncate">{b.toLocation}</span>
                  </div>
                  <div className="flex gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 mt-1">
                    <span>📅 {b.travelDate} at {b.travelTime}</span>
                    <span>👤 {b.seats} seat{b.seats > 1 ? 's' : ''}</span>
                    {b.totalAmount > 0 && <span className="text-green-400 font-bold">₹{b.totalAmount}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Hotel Fixed Schedules */}
      {schedules.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-blue-400" />
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-200">Scheduled Shuttles & Routes</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {schedules.map(sched => (
              <div key={sched.id} className="bg-[#0c1525]/70 border border-slate-800/60 rounded-2xl p-4 flex flex-col justify-between backdrop-blur-sm hover:border-blue-500/40 transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-black text-white truncate">{sched.routeName}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
                      {sched.departureTime}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 mb-3">
                    <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> {sched.fromLocation}</div>
                    <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> {sched.toLocation}</div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-3">
                    <span className="bg-slate-800/60 px-2 py-0.5 rounded-lg">{sched.days}</span>
                    {sched.vehicle?.driver && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <User size={10} /> {sched.vehicle.driver.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                  <div>
                    {sched.pricePerSeat > 0 ? (
                      <p className="text-sm font-black text-green-400">₹{sched.pricePerSeat} <span className="text-[9px] text-slate-500 font-normal">/seat</span></p>
                    ) : (
                      <p className="text-xs font-bold text-slate-400">Free Shuttle</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenBooking(sched, 'schedule')}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-blue-600/20 transition-all active:scale-95"
                  >
                    Book Seat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Fleet & Drivers */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Car size={16} className="text-orange-400" />
          <h3 className="font-black text-sm uppercase tracking-wider text-slate-200">Available Drivers & Fleet</h3>
        </div>

        {drivers.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-slate-800">
            <Car size={32} className="mx-auto mb-2 text-slate-600" />
            <p className="text-xs text-slate-400 font-bold">No drivers available right now</p>
            <p className="text-[10px] text-slate-600 mt-0.5">Please check back later or contact front desk.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drivers.map(driver => (
              <div key={driver.id} className="bg-[#0c1525]/70 border border-slate-800/60 rounded-2xl p-4 backdrop-blur-sm">
                {/* Driver Top */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                      {driver.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-white">{driver.name}</p>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${
                          driver.isOnline ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}>
                          {driver.isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        {driver.licenseNumber && (
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1">
                            <Shield size={9} /> DL Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold">
                          <Star size={10} className="fill-yellow-400" /> {driver.rating?.toFixed(1) || '5.0'}
                        </span>
                        {(driver.city || driver.state) && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <MapPin size={10} className="text-red-400" /> {[driver.city, driver.state].filter(Boolean).join(', ')}
                          </span>
                        )}
                        {driver.phone && (
                          <a href={`tel:${driver.phone}`} className="text-[10px] text-blue-400 hover:underline flex items-center gap-1">
                            <Phone size={10} /> {driver.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Driver Vehicles */}
                {driver.vehicles && driver.vehicles.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    {driver.vehicles.map((v: any) => {
                      const badge = VEHICLE_BADGES[v.type] || VEHICLE_BADGES.CAR;
                      const Icon = badge.icon;
                      return (
                        <div key={v.id} className="flex items-center justify-between bg-slate-900/50 rounded-xl p-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${badge.color} flex items-center justify-center text-white shrink-0 shadow-sm`}>
                              <Icon size={16} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-white">{v.plateNumber} <span className="text-[10px] text-slate-400 font-normal">({v.model || v.type})</span></p>
                              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Users size={10} /> {v.capacity} Seats capacity
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleOpenBooking({ ...v, driver }, 'vehicle')}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white text-xs font-black shadow-md shadow-orange-500/20 transition-all active:scale-95"
                          >
                            Book Ride
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">No active vehicles linked.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Booking Modal */}
      {bookingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#0c1525] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setBookingModal(null)}
              className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                <Car size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Book Ride Request</h3>
                <p className="text-[10px] text-slate-400">Request ride with {bookingModal.driver?.name || bookingModal.vehicle?.driver?.name || 'Driver'}</p>
              </div>
            </div>

            <form onSubmit={handleBookRide} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Room Number</label>
                  <input
                    type="text"
                    placeholder="101"
                    value={form.room}
                    onChange={e => setForm(f => ({ ...f, room: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <LocationInputWithGPS
                label="Pickup Location"
                value={form.fromLocation}
                onChange={(val) => setForm((f) => ({ ...f, fromLocation: val }))}
                placeholder="Type pickup location (e.g. Hotel Main Gate, Kullu)..."
              />

              <LocationInputWithGPS
                label="Drop Location"
                value={form.toLocation}
                onChange={(val) => setForm((f) => ({ ...f, toLocation: val }))}
                placeholder="Type drop location (e.g. Mandi, Himachal Pradesh)..."
              />

              {/* Interactive Map & Per-KM Rate Fare Preview */}
              <div className="my-3">
                <RideMapView
                  fromLocation={form.fromLocation}
                  toLocation={form.toLocation}
                  perKmRate={bookingModal.perKmRate || bookingModal.vehicle?.perKmRate || 15}
                  baseFare={bookingModal.baseFare || bookingModal.vehicle?.baseFare || 50}
                  vehicleType={bookingModal.type || bookingModal.vehicle?.type || 'CAR'}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.travelDate}
                    onChange={e => setForm(f => ({ ...f, travelDate: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Time *</label>
                  <input
                    type="time"
                    required
                    value={form.travelTime}
                    onChange={e => setForm(f => ({ ...f, travelTime: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Seats</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={form.seats}
                    onChange={e => setForm(f => ({ ...f, seats: Number(e.target.value) }))}
                    className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Special Instructions</label>
                <input
                  type="text"
                  placeholder="Need AC, heavy luggage..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="animate-spin" size={14} /> : <><Car size={14} /> Confirm Ride Request</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
