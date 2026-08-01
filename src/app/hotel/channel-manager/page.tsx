'use client';
import React, { useState } from 'react';
import { Globe, Plus, RefreshCw, Link2, Wifi, WifiOff, Settings } from 'lucide-react';

const CHANNELS = [
  { name: 'Booking.com',    logo: '🏨', status: 'CONNECTED', rooms: 45, rate: 6500, lastSync: '2 min ago',  bookings: 128 },
  { name: 'Expedia',        logo: '✈️', status: 'CONNECTED', rooms: 45, rate: 6800, lastSync: '5 min ago',  bookings: 84  },
  { name: 'Agoda',          logo: '🌏', status: 'CONNECTED', rooms: 30, rate: 6200, lastSync: '8 min ago',  bookings: 62  },
  { name: 'Airbnb',         logo: '🏠', status: 'CONNECTED', rooms: 12, rate: 7500, lastSync: '1 min ago',  bookings: 38  },
  { name: 'MakeMyTrip',     logo: '🇮🇳', status: 'CONNECTED', rooms: 45, rate: 5900, lastSync: '3 min ago', bookings: 97  },
  { name: 'Goibibo',        logo: '🎯', status: 'SYNCING',   rooms: 45, rate: 5900, lastSync: 'Syncing…',   bookings: 54  },
  { name: 'Google Hotel Ads',logo: '🔍', status: 'CONNECTED', rooms: 45, rate: 6500, lastSync: '10 min ago',bookings: 211 },
  { name: 'Trip.com',       logo: '🌐', status: 'DISCONNECTED', rooms: 0, rate: 0, lastSync: 'Never',       bookings: 0   },
  { name: 'Hostelworld',    logo: '🛏️', status: 'DISCONNECTED', rooms: 0, rate: 0, lastSync: 'Never',       bookings: 0   },
];

export default function ChannelManagerPage() {
  const [syncing, setSyncing] = useState(false);

  async function syncAll() {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    setSyncing(false);
  }

  const connected    = CHANNELS.filter(c => c.status !== 'DISCONNECTED').length;
  const totalBookings = CHANNELS.reduce((s, c) => s + c.bookings, 0);

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe size={14} className="text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Distribution · Channel Manager</span>
          </div>
          <h1 className="text-2xl font-black text-white">Channel Manager</h1>
          <p className="text-xs text-slate-500 mt-0.5">{connected} channels connected · {totalBookings} total OTA bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={syncAll}
            className={`flex items-center gap-1.5 h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-wider transition-colors ${syncing ? 'opacity-70' : ''}`}>
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync All'}
          </button>
          <button className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider">
            <Plus size={12} /> Add Channel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Connected',    value: connected,      color: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
          { label: 'Total Bookings', value: totalBookings, color: 'text-blue-300 border-blue-500/20 bg-blue-900/20' },
          { label: 'Revenue OTA',  value: `₹${(totalBookings * 6200).toLocaleString('en-IN')}`, color: 'text-indigo-300 border-indigo-500/20 bg-indigo-900/20' },
          { label: 'Avg Rate',     value: `₹6,400`, color: 'text-amber-300 border-amber-500/20 bg-amber-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Channel Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {CHANNELS.map(c => (
          <div key={c.name} className={`rounded-2xl border p-5 transition-all hover:border-blue-500/30 ${
            c.status === 'CONNECTED' ? 'bg-slate-900/50 border-white/5'
            : c.status === 'SYNCING' ? 'bg-blue-900/10 border-blue-500/20'
            : 'bg-slate-900/30 border-white/3 opacity-60'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{c.logo}</span>
                <div>
                  <p className="text-sm font-black text-white">{c.name}</p>
                  <p className="text-[9px] text-slate-500">Last sync: {c.lastSync}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {c.status === 'CONNECTED'    && <Wifi size={14} className="text-emerald-400" />}
                {c.status === 'SYNCING'      && <RefreshCw size={14} className="text-blue-400 animate-spin" />}
                {c.status === 'DISCONNECTED' && <WifiOff size={14} className="text-slate-600" />}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <p className="text-base font-black text-white">{c.rooms}</p>
                <p className="text-[8px] text-slate-500">Rooms</p>
              </div>
              <div>
                <p className="text-base font-black text-white">{c.rate ? `₹${c.rate.toLocaleString()}` : '—'}</p>
                <p className="text-[8px] text-slate-500">Rate</p>
              </div>
              <div>
                <p className="text-base font-black text-white">{c.bookings}</p>
                <p className="text-[8px] text-slate-500">Bookings</p>
              </div>
            </div>
            <button className={`w-full h-8 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
              c.status === 'DISCONNECTED'
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}>
              <Settings size={11} />
              {c.status === 'DISCONNECTED' ? 'Connect' : 'Configure'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
