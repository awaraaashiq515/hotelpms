'use client';
import React, { useState } from 'react';
import { Lightbulb, Thermometer, Lock, Unlock, Wifi, BatteryMedium, Power } from 'lucide-react';

interface RoomState {
  roomNumber: string;
  lights: number;      // 0-100
  temperature: number; // Celsius
  acOn: boolean;
  tvOn: boolean;
  curtains: 'OPEN' | 'CLOSED' | 'HALF';
  locked: boolean;
  doNotDisturb: boolean;
}

const INITIAL_STATE: RoomState = {
  roomNumber: '204',
  lights: 70, temperature: 22, acOn: true,
  tvOn: false, curtains: 'HALF',
  locked: true, doNotDisturb: false,
};

interface RoomControlsProps { roomNumber?: string }

export function RoomControls({ roomNumber = '204' }: RoomControlsProps) {
  const [state, setState] = useState<RoomState>({ ...INITIAL_STATE, roomNumber });

  function update<K extends keyof RoomState>(key: K, val: RoomState[K]) {
    setState(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Power size={13} className="text-cyan-400" />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">Room {state.roomNumber} Controls</span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Live IoT" />
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">

        {/* Lights */}
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <Lightbulb size={14} className={state.lights > 0 ? 'text-yellow-400' : 'text-slate-600'} />
            <span className="text-[9px] font-black text-slate-400">{state.lights}%</span>
          </div>
          <p className="text-[10px] font-black text-white mb-2">Lights</p>
          <input type="range" min={0} max={100} value={state.lights}
            onChange={e => update('lights', +e.target.value)}
            className="w-full accent-yellow-400 cursor-pointer" />
        </div>

        {/* Temperature */}
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-3">
          <div className="flex items-center justify-between mb-2">
            <Thermometer size={14} className="text-blue-400" />
            <span className="text-[9px] font-black text-blue-300">{state.temperature}°C</span>
          </div>
          <p className="text-[10px] font-black text-white mb-2">Temperature</p>
          <input type="range" min={16} max={30} value={state.temperature}
            onChange={e => update('temperature', +e.target.value)}
            className="w-full accent-blue-400 cursor-pointer" />
        </div>

        {/* AC */}
        <div className={`rounded-xl border p-3 cursor-pointer transition-all ${state.acOn ? 'bg-blue-900/20 border-blue-500/20' : 'bg-slate-800/50 border-white/5'}`}
          onClick={() => update('acOn', !state.acOn)}>
          <div className="flex items-center justify-between mb-2">
            <BatteryMedium size={14} className={state.acOn ? 'text-blue-400' : 'text-slate-600'} />
            <span className={`text-[8px] font-black ${state.acOn ? 'text-blue-300' : 'text-slate-500'}`}>{state.acOn ? 'ON' : 'OFF'}</span>
          </div>
          <p className="text-[10px] font-black text-white">Air Conditioner</p>
        </div>

        {/* TV */}
        <div className={`rounded-xl border p-3 cursor-pointer transition-all ${state.tvOn ? 'bg-purple-900/20 border-purple-500/20' : 'bg-slate-800/50 border-white/5'}`}
          onClick={() => update('tvOn', !state.tvOn)}>
          <div className="flex items-center justify-between mb-2">
            <Wifi size={14} className={state.tvOn ? 'text-purple-400' : 'text-slate-600'} />
            <span className={`text-[8px] font-black ${state.tvOn ? 'text-purple-300' : 'text-slate-500'}`}>{state.tvOn ? 'ON' : 'OFF'}</span>
          </div>
          <p className="text-[10px] font-black text-white">Smart TV</p>
        </div>

        {/* Door Lock */}
        <div className={`rounded-xl border p-3 cursor-pointer transition-all ${state.locked ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-rose-900/20 border-rose-500/20'}`}
          onClick={() => update('locked', !state.locked)}>
          <div className="flex items-center justify-between mb-2">
            {state.locked ? <Lock size={14} className="text-emerald-400" /> : <Unlock size={14} className="text-rose-400" />}
            <span className={`text-[8px] font-black ${state.locked ? 'text-emerald-300' : 'text-rose-300'}`}>{state.locked ? 'LOCKED' : 'OPEN'}</span>
          </div>
          <p className="text-[10px] font-black text-white">Door Lock</p>
        </div>

        {/* Curtains */}
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-3">
          <p className="text-[10px] font-black text-white mb-2">Curtains</p>
          <div className="flex gap-1">
            {(['OPEN','HALF','CLOSED'] as const).map(c => (
              <button key={c} onClick={() => update('curtains', c)}
                className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase transition-colors ${
                  state.curtains === c ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}>{c}</button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
