'use client';
import React, { useState, useEffect } from 'react';
import { Wifi, Zap, Lock, Power, BarChart3, SlidersHorizontal, Settings2, RefreshCw } from 'lucide-react';
import { RoomControls } from './components/RoomControls';
import { SmartLocks, type SmartLock } from './components/SmartLocks';
import { GatewaySetup } from './components/GatewaySetup';

const DEFAULT_MOCK_LOCKS: SmartLock[] = [
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
  const [activeRoom, setActiveRoom] = useState('101');
  const [tab, setTab] = useState<'controls'|'locks'|'energy'|'hardware'>('controls');
  const [loading, setLoading] = useState(true);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [gatewayConfig, setGatewayConfig] = useState<any>(null);
  const [displayLocks, setDisplayLocks] = useState<SmartLock[]>(DEFAULT_MOCK_LOCKS);

  const fetchGatewayData = async () => {
    try {
      const res = await fetch('/api/hotel/smart-hotel');
      const d = await res.json();
      if (d.success) {
        setHotelRooms(d.data.rooms || []);
        setGatewayConfig(d.data.config);

        if (d.data.rooms?.length > 0 && activeRoom === '101') {
          setActiveRoom(d.data.rooms[0].roomNumber);
        }

        // If user has paired actual devices, merge them into smart locks list!
        if (d.data.config?.devices?.length > 0) {
          const pairedLocks = d.data.config.devices
            .filter((dev: any) => dev.deviceType === 'DOOR_LOCK')
            .map((dev: any) => ({
              id: dev.id,
              roomNumber: dev.roomNumber,
              floor: '1',
              status: dev.status === 'ONLINE' ? 'LOCKED' : 'OFFLINE',
              battery: dev.battery || 95,
              lastAccess: 'Just now',
              accessMethod: 'NFC',
              guestName: 'Active Room',
            }));

          if (pairedLocks.length > 0) {
            setDisplayLocks(pairedLocks);
          }
        }
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatewayData();
  }, []);

  const handleSaveConfig = async (newConfig: any) => {
    const res = await fetch('/api/hotel/smart-hotel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig),
    });
    const d = await res.json();
    if (!d.success) throw new Error(d.message);
    setGatewayConfig(d.data);
    fetchGatewayData();
  };

  const roomsList = hotelRooms.length > 0 ? hotelRooms.map(r => r.roomNumber) : displayLocks.map(l => l.roomNumber);

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wifi size={14} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">IoT · Smart Hotel Hub</span>
          </div>
          <h1 className="text-2xl font-black text-white">Smart Hotel &amp; IoT Control</h1>
          <p className="text-xs text-slate-500 mt-0.5">Hardware Gateway pairing · IoT room controls · Smart locks</p>
        </div>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-cyan-500/20 bg-cyan-900/10">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-black text-cyan-300">
            {gatewayConfig?.status === 'CONNECTED' ? 'Gateway Online & Synced' : `${displayLocks.filter(l=>l.status!=='OFFLINE').length} devices online`}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'Gateway Protocol', value: gatewayConfig?.gatewayType || 'TTLOCK / TUYA', color:'text-cyan-300 border-cyan-500/20 bg-cyan-900/20' },
          { label:'Paired Devices',   value: `${gatewayConfig?.devices?.length || displayLocks.length} Units`, color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
          { label:'Locks Secured',    value: displayLocks.filter(l=>l.status==='LOCKED').length, color:'text-indigo-300 border-indigo-500/20 bg-indigo-900/20' },
          { label:'Energy Today',     value:'584 kWh', color:'text-violet-300 border-violet-500/20 bg-violet-900/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-xl font-black text-white truncate">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['controls', 'Room Controls'],
          ['locks', 'Smart Locks'],
          ['hardware', '⚙️ Hardware Gateway & Pairing'],
          ['energy', 'Energy Monitor'],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v as any)}
            className={`px-4 h-10 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
              tab === v
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/30'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'controls' && (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            {roomsList.map(num => (
              <button
                key={num}
                onClick={() => setActiveRoom(num)}
                className={`px-3.5 h-8 rounded-xl text-[11px] font-black transition-colors ${
                  activeRoom === num
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-900/30'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                Rm {num}
              </button>
            ))}
          </div>
          <RoomControls roomNumber={activeRoom} />
        </div>
      )}

      {tab === 'locks' && <SmartLocks locks={displayLocks} />}

      {tab === 'hardware' && (
        <GatewaySetup
          initialConfig={
            gatewayConfig || {
              gatewayType: 'TTLOCK',
              status: 'DISCONNECTED',
              lastSync: null,
              ttlock: { clientId: '', clientSecret: '', gatewayId: '', gatewayName: 'Hotel G2 Gateway' },
              tuya: { accessId: '', accessSecret: '', endpoint: 'https://openapi.tuyaeu.com' },
              mqtt: { brokerUrl: 'mqtt://192.168.1.100:1883', username: '', password: '', topicPrefix: 'hotel/smart' },
              devices: [],
            }
          }
          rooms={hotelRooms.length > 0 ? hotelRooms : [{ id: '1', roomNumber: '101', floor: '1' }, { id: '2', roomNumber: '102', floor: '1' }]}
          onSave={handleSaveConfig}
        />
      )}

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

