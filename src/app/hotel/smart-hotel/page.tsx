'use client';
import React, { useState } from 'react';
import { Wifi, Zap, Lock, Power, BarChart3 } from 'lucide-react';
import { RoomControls } from './components/RoomControls';
import { SmartLocks, type SmartLock } from './components/SmartLocks';

const MOCK_LOCKS: SmartLock[] = [
  { id:'1', roomNumber:'101', floor:'1', status:'LOCKED',      battery:85,  lastAccess:'10:32 AM', accessMethod:'NFC',   guestName:'Priya Mehta' },
  { id:'2', roomNumber:'102', floor:'1', status:'UNLOCKED',    battery:72,  lastAccess:'11:05 AM', accessMethod:'APP',   guestName:'John Smith' },
  { id:'3', roomNumber:'103', floor:'1', status:'LOCKED',      battery:12,  lastAccess:'09:15 AM', accessMethod:'PIN' },
  { id:'4', roomNumber:'201', floor:'2', status:'OFFLINE',     battery:0,   lastAccess:'Yesterday' },
  { id:'5', roomNumber:'202', floor:'2', status:'LOCKED',      battery:90,  lastAccess:'08:00 AM', accessMethod:'STAFF' },
  { id:'6', roomNumber:'203', floor:'2', status:'LOW_BATTERY', battery:8,   lastAccess:'10:55 AM', accessMethod:'NFC',   guestName:'Ananya Roy' },
  { id:'7', roomNumber:'204', floor:'2', status:'LOCKED',      battery:65,  lastAccess:'10:12 AM', accessMethod:'NFC',   guestName:'Ramesh Sharma' },
  { id:'8', roomNumber:'301', floor:'3', status:'LOCKED',      battery:91,  lastAccess:'07:30 AM', accessMethod:'APP' },
];

const ENERGY_DATA = [
  { area:'Guest Rooms',  kwh:245, pct:42, color:'bg-indigo-500' },
  { area:'Kitchen',      kwh:128, pct:22, color:'bg-amber-500' },
  { area:'Common Areas', kwh:98,  pct:17, color:'bg-sky-500' },
  { area:'Pool & Spa',   kwh:72,  pct:12, color:'bg-pink-500' },
  { area:'Admin Offices',kwh:41,  pct:7,  color:'bg-slate-500' },
];

export default function SmartHotelPage() {
  const [activeRoom, setActiveRoom] = useState('204');
  const [tab, setTab] = useState<'controls'|'locks'|'energy'>('controls');

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wifi size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">IoT · Smart Hotel</span>
          </div>
          <h1 className="text-2xl font-black text-white">Smart Hotel Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">IoT room controls · Smart locks · Energy management</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-cyan-500/20 bg-cyan-900/10">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-black text-cyan-300">{MOCK_LOCKS.filter(l=>l.status!=='OFFLINE').length} devices online</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Devices Online',  value:`${MOCK_LOCKS.filter(l=>l.status!=='OFFLINE').length}/${MOCK_LOCKS.length}`, color:'text-cyan-300 border-cyan-500/20 bg-cyan-900/20' },
          { label:'Locks Secured',   value:MOCK_LOCKS.filter(l=>l.status==='LOCKED').length,                            color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
          { label:'Low Battery',     value:MOCK_LOCKS.filter(l=>l.battery<20).length,                                  color:'text-amber-300 border-amber-500/20 bg-amber-900/20' },
          { label:'Energy Today',    value:'584 kWh',                                                                   color:'text-violet-300 border-violet-500/20 bg-violet-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([['controls','Room Controls'],['locks','Smart Locks'],['energy','Energy Monitor']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${tab===v ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'controls' && (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {MOCK_LOCKS.filter(l=>l.status!=='OFFLINE').map(l => (
              <button key={l.id} onClick={() => setActiveRoom(l.roomNumber)}
                className={`px-3 h-8 rounded-xl text-[10px] font-black transition-colors ${activeRoom===l.roomNumber ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                Rm {l.roomNumber}
              </button>
            ))}
          </div>
          <RoomControls roomNumber={activeRoom} />
        </div>
      )}
      {tab === 'locks' && <SmartLocks locks={MOCK_LOCKS} />}
      {tab === 'energy' && (
        <div className="rounded-2xl bg-slate-900/50 border border-white/5 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={13} className="text-yellow-400" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">Energy Usage — Today</span>
            <span className="ml-auto text-sm font-black text-white">584 kWh total</span>
          </div>
          <div className="space-y-4">
            {ENERGY_DATA.map(e => (
              <div key={e.area}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black text-slate-300">{e.area}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400">{e.kwh} kWh</span>
                    <span className="text-[9px] font-black text-slate-500">{e.pct}%</span>
                  </div>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full ${e.color} rounded-full transition-all`} style={{ width: `${e.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-3 gap-3">
            {[
              { label:'Carbon Saved', value:'48 kg CO₂', icon:'🌿' },
              { label:'Solar Input',  value:'122 kWh',   icon:'☀️' },
              { label:'Grid Draw',    value:'462 kWh',   icon:'⚡' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl mb-1">{s.icon}</p>
                <p className="text-sm font-black text-white">{s.value}</p>
                <p className="text-[8px] text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
