'use client';

import React from 'react';
import { Search, Loader2, CheckCircle2, AlertTriangle, X, Hotel, User, Receipt } from 'lucide-react';
import type { RoomInfo } from './types';

export type LookupState = 'idle' | 'loading' | 'found' | 'error';

interface RoomSearchPanelProps {
  roomNumber: string;
  setRoomNumber: (v: string) => void;
  roomInfo: RoomInfo | null;
  state: LookupState;
  errorMsg: string;
  onLookup: () => void;
  onClear: () => void;
  specialNote: string;
  setSpecialNote: (v: string) => void;
}

export function RoomSearchPanel({
  roomNumber, setRoomNumber,
  roomInfo, state, errorMsg,
  onLookup, onClear,
  specialNote, setSpecialNote,
}: RoomSearchPanelProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onLookup();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Panel Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Hotel size={13} className="text-amber-400" />
        </div>
        <p className="text-xs font-black text-white uppercase tracking-wider">Room Lookup</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={roomNumber}
          onChange={e => setRoomNumber(e.target.value.replace(/\D/, ''))}
          onKeyDown={handleKeyDown}
          placeholder="Room Number…"
          className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-lg font-black placeholder-slate-700 focus:outline-none focus:border-amber-500/50 transition-all tracking-widest"
          maxLength={4}
        />
        {roomNumber && (
          <button
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={onLookup}
        disabled={!roomNumber || state === 'loading'}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-black transition-all shadow-lg shadow-amber-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {state === 'loading' ? (
          <><Loader2 size={14} className="animate-spin" /> Searching…</>
        ) : (
          <><Search size={14} /> Find Guest</>
        )}
      </button>

      {/* Error */}
      {state === 'error' && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle size={13} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] font-bold text-red-400">{errorMsg}</p>
        </div>
      )}

      {/* Room Info Card */}
      {state === 'found' && roomInfo && (
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
          {/* Success header */}
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <p className="text-xs font-black text-emerald-400">Room Found!</p>
          </div>

          {/* Room + Guest */}
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                <span className="text-base font-black text-amber-400">{roomInfo.roomNumber}</span>
              </div>
              <div>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Room</p>
                <p className="text-sm font-black text-white">{roomInfo.roomNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center">
                <User size={13} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Guest</p>
                <p className="text-sm font-black text-white">{roomInfo.guestName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/8 flex items-center justify-center">
                <Receipt size={13} className="text-slate-400" />
              </div>
              <div>
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Folio</p>
                <p className="text-[10px] font-bold text-emerald-400">OPEN — charges will be posted</p>
              </div>
            </div>
          </div>

          {/* Change room button */}
          <button
            onClick={onClear}
            className="w-full py-2 rounded-xl border border-white/8 text-[10px] font-bold text-slate-500 hover:text-white hover:bg-white/5 transition-all"
          >
            Change Room
          </button>
        </div>
      )}

      {/* Idle hint */}
      {state === 'idle' && (
        <div className="flex flex-col items-center gap-2 py-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center">
            <span className="text-2xl">🏨</span>
          </div>
          <p className="text-[10px] text-slate-700 font-bold">Enter room number to find guest</p>
        </div>
      )}

      {/* Special Note (shown once room is found) */}
      {state === 'found' && (
        <div>
          <label className="block text-[9px] font-black text-slate-600 uppercase tracking-wider mb-1.5">
            Special Instructions
          </label>
          <textarea
            value={specialNote}
            onChange={e => setSpecialNote(e.target.value)}
            rows={3}
            placeholder="e.g. No spicy, extra sauce, deliver by 8pm…"
            className="w-full px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/8 text-white text-xs font-semibold placeholder-slate-700 focus:outline-none focus:border-amber-500/40 transition-all resize-none"
          />
        </div>
      )}
    </div>
  );
}
