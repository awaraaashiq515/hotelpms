'use client';

import React from 'react';
import { BedDouble, LogIn, LogOut, TrendingUp, Home, Clock } from 'lucide-react';

interface StatsBarProps {
  rooms: any[];
  bookings: any[];
}

export default function StatsBar({ rooms, bookings }: StatsBarProps) {
  const today = new Date();
  const todayStr = today.toDateString();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const totalRooms = rooms.length;

  // Bookings currently checked in (occupied tonight)
  const occupiedTonight = bookings.filter((b) => {
    if (b.status !== 'CHECKED_IN') return false;
    const arr = new Date(b.arrivalDate);
    const dep = new Date(b.departureDate);
    const arrTime = new Date(arr.getFullYear(), arr.getMonth(), arr.getDate()).getTime();
    const depTime = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate()).getTime();
    return todayTime >= arrTime && todayTime < depTime;
  }).length;

  const availableRooms = Math.max(0, totalRooms - occupiedTonight);

  const arrivalsToday = bookings.filter((b) => {
    const arr = new Date(b.arrivalDate);
    return arr.toDateString() === todayStr && (b.status === 'CONFIRMED' || b.status === 'CHECKED_IN');
  }).length;

  const departuresToday = bookings.filter((b) => {
    const dep = new Date(b.departureDate);
    return dep.toDateString() === todayStr && (b.status === 'CHECKED_IN' || b.status === 'CHECKED_OUT');
  }).length;

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length;

  const occupancyPct = totalRooms > 0 ? Math.round((occupiedTonight / totalRooms) * 100) : 0;

  const stats = [
    {
      icon: BedDouble,
      label: 'Total Rooms',
      value: totalRooms,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      icon: Home,
      label: 'Occupied Tonight',
      value: occupiedTonight,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      icon: TrendingUp,
      label: 'Available',
      value: availableRooms,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: LogIn,
      label: 'Arrivals Today',
      value: arrivalsToday,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      icon: LogOut,
      label: 'Departures Today',
      value: departuresToday,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: Clock,
      label: 'Pending',
      value: pendingBookings,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-2xl border p-4 flex flex-col gap-2 ${stat.bg}`}
        >
          <stat.icon size={16} className={stat.color} />
          <p className="text-2xl font-black text-white">{stat.value}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-tight">
            {stat.label}
          </p>
        </div>
      ))}

      {/* Occupancy bar spanning full width */}
      <div className="col-span-3 md:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-3 flex items-center gap-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 shrink-0">
          Occupancy Rate
        </span>
        <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              occupancyPct >= 80
                ? 'bg-rose-500'
                : occupancyPct >= 50
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${occupancyPct}%` }}
          />
        </div>
        <span
          className={`text-sm font-black shrink-0 ${
            occupancyPct >= 80
              ? 'text-rose-400'
              : occupancyPct >= 50
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}
        >
          {occupancyPct}%
        </span>
      </div>
    </div>
  );
}
