'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music2, Search, Plus, Trash2, Play, Pause, SkipForward, SkipBack,
  Volume2, ListMusic, Radio, RefreshCw, Loader2, AlertCircle, Check, Zap,
  Layers, X, ChevronDown, ChevronRight, Zap as SmartIcon,
} from 'lucide-react';
import { useMusic } from '@/context/music-context';
import { Song } from '@/context/music-context';

/* ─── Playlist types ─────────────────────────────────────────────────────── */
interface PlaylistItem {
  id: string;
  playlistId: string;
  youtubeId: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  duration?: string;
}
interface Playlist {
  id: string;
  name: string;
  emoji?: string;
  items: PlaylistItem[];
}

/* ─── Spotify types ──────────────────────────────────────────────────────── */
interface SpotifyTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  thumbnail: string | null;
  duration: string;
}
interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  image: string | null;
  total: number;
  owner: string;
}
interface SpotifyUser {
  id: string;
  displayName: string;
  email: string;
  image: string | null;
}

/* ─── Spotify Logo SVG ───────────────────────────────────────────────────── */
const SpotifyLogoSvg = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 168 168" fill="none">
    <circle cx="84" cy="84" r="84" fill="#1DB954" />
    <path d="M120.7 116.8c-1.6 2.6-4.9 3.4-7.5 1.8-20.5-12.5-46.3-15.3-76.7-8.4-3 .7-6-1.2-6.7-4.2-.7-3 1.2-6 4.2-6.7 33.2-7.6 61.9-4.3 85 9.6 2.6 1.6 3.4 4.9 1.7 7.9zm9.4-23.2c-2 3.2-6.3 4.2-9.5 2.2-23.5-14.4-59.4-18.6-87.2-10.2-3.5 1-7.2-1-8.2-4.5-1-3.5 1-7.2 4.5-8.2 31.8-9.7 71.2-4.9 98.2 11.6 3.2 2 4.2 6.2 2.2 9.1zm.8-24.2c-28.2-16.7-74.7-18.2-101.5-10.1-4.3 1.3-8.8-1.1-10.1-5.4-1.3-4.3 1.1-8.8 5.4-10.1 30.8-9.4 82-7.5 114.3 11.7 3.8 2.3 5.1 7.2 2.8 11-.3.4-.5.8-.9 1-2.3 2-5.3 2.1-7.6.6-.9-.4-1.7-.8-2.4-1.2z" fill="white"/>
  </svg>
);

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

/* ─── helpers ────────────────────────────────────────────────────────────── */
const fmt = (s: number) => {
  if (!s || isNaN(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
};

const EMOJI_OPTIONS = ['🎵', '🎉', '😢', '💃', '🔥', '🌙', '❤️', '💪', '🌊', '⚡', '🎸', '🥳'];

/* ─── Spectrum Bars ──────────────────────────────────────────────────────── */
const Spectrum = React.memo(function Spectrum({ active, color }: { active: boolean; color: string }) {
  const bars = 14;
  return (
    <div className="flex items-end gap-[3px] h-10 w-full">
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{
          background: color, height: '100%',
          animation: active ? `specBar ${0.38 + (i % 5) * 0.08}s ease-in-out ${i * 0.04}s infinite alternate` : 'none',
          opacity: active ? (0.5 + (i % 3) * 0.17) : 0.12,
          willChange: 'transform',
          transform: active ? 'scaleY(1)' : 'scaleY(0.12)',
          transformOrigin: 'bottom',
        }} />
      ))}
    </div>
  );
});

/* ─── Vinyl ──────────────────────────────────────────────────────────────── */
function Vinyl({ song, playing, deck }: { song: Song | null; playing: boolean; deck: 'A' | 'B' }) {
  const isA = deck === 'A';
  const glowCol = isA ? 'rgba(6,182,212,0.7)' : 'rgba(232,121,249,0.7)';
  const trackCol = isA ? '#06b6d4' : '#e879f9';
  const gradA = 'conic-gradient(from 0deg, #0e7490, #164e63, #083344, #164e63, #0e7490)';
  const gradB = 'conic-gradient(from 0deg, #a21caf, #701a75, #3b0764, #701a75, #a21caf)';
  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: 210, height: 210 }}>
      {playing && <div className="absolute inset-0 rounded-full animate-pulse" style={{ boxShadow: `0 0 70px 20px ${glowCol}`, borderRadius: '50%' }} />}
      <div className="absolute inset-0 rounded-full" style={{
        background: isA ? gradA : gradB,
        animation: playing ? 'vinylSpin 2.8s linear infinite' : 'none',
        boxShadow: playing ? `0 0 40px 8px ${glowCol}, 0 0 10px 2px ${glowCol} inset` : '0 8px 32px rgba(0,0,0,0.8)',
      }}>
        {[40, 58, 76, 94, 112, 130, 148, 165, 180].map(d => (
          <div key={d} className="absolute rounded-full border" style={{ width: d, height: d, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', borderColor: 'rgba(255,255,255,0.06)' }} />
        ))}
        <div className="absolute inset-0 rounded-full" style={{ background: 'radial-gradient(ellipse 60% 30% at 35% 30%, rgba(255,255,255,0.12), transparent)' }} />
      </div>
      <div className="relative z-10 w-[76px] h-[76px] rounded-full overflow-hidden border-2" style={{ borderColor: trackCol, boxShadow: `0 0 16px ${glowCol}` }}>
        {song?.thumbnail ? <img src={song.thumbnail} alt="" className="w-full h-full object-cover" /> : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: isA ? '#083344' : '#3b0764' }}><Music2 size={26} style={{ color: trackCol }} /></div>
        )}
      </div>
      <div className="absolute" style={{ top: 4, right: -10, zIndex: 20, transformOrigin: '100% 8px', transform: playing ? 'rotate(26deg)' : 'rotate(8deg)', transition: 'transform 1s ease' }}>
        <svg width="70" height="60" viewBox="0 0 70 60">
          <line x1="65" y1="8" x2="8" y2="52" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="65" cy="8" r="5" fill="#64748b" />
          <circle cx="8" cy="52" r="3" fill={trackCol} style={{ filter: `drop-shadow(0 0 4px ${trackCol})` }} />
        </svg>
      </div>
    </div>
  );
}

/* ─── EQ Knob ────────────────────────────────────────────────────────────── */
function EqKnob({ label, value, color }: { label: string; value: number; color: string }) {
  const angle = -135 + (value / 100) * 270;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-9 h-9">
        <svg viewBox="0 0 40 40" className="w-full h-full -rotate-[135deg]">
          <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" strokeDasharray="67.2 33.6" />
          <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${(value / 100) * 67.2} 100`} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        </svg>
        <div className="absolute inset-0 rounded-full flex items-center justify-center" style={{ background: 'radial-gradient(circle, #1e293b, #0f172a)' }}>
          <div className="w-1 h-3 rounded-full origin-bottom" style={{ background: color, transform: `rotate(${angle}deg)`, transformOrigin: '50% 100%' }} />
        </div>
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}

/* ─── Beat Pulse Lights ──────────────────────────────────────────────────── */
function BeatLights({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex gap-1.5">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="w-2 h-2 rounded-full transition-all" style={{
          background: active ? color : 'rgba(255,255,255,0.08)',
          boxShadow: active ? `0 0 8px 2px ${color}` : 'none',
          animation: active ? `beatPulse 0.5s ease ${i * 0.125}s infinite` : 'none',
        }} />
      ))}
    </div>
  );
}

/* ─── Deck Card ──────────────────────────────────────────────────────────── */
interface DeckProps {
  deck: 'A' | 'B'; song: Song | null; playing: boolean; volume: number;
  setVolume: (v: number) => void; pitch: number; setPitch: (v: number) => void;
  ready: boolean; onPlay: () => void; onSeek: (t: number) => void;
  onPrev: () => void; onNext: () => void;
  seekRef: React.RefObject<HTMLInputElement | null>; fillRef: React.RefObject<HTMLDivElement | null>;
  timeRef: React.RefObject<HTMLSpanElement | null>; durRef: React.RefObject<HTMLSpanElement | null>;
}
function DeckCard({ deck, song, playing, volume, setVolume, pitch, setPitch, ready, onPlay, onSeek, onPrev, onNext, seekRef, fillRef, timeRef, durRef }: DeckProps) {
  const isA = deck === 'A';
  const neon = isA ? '#06b6d4' : '#e879f9';
  const neonDim = isA ? 'rgba(6,182,212,0.15)' : 'rgba(232,121,249,0.15)';
  const neonBorder = isA ? 'rgba(6,182,212,0.3)' : 'rgba(232,121,249,0.3)';
  const glow = isA ? '0 0 40px rgba(6,182,212,0.3)' : '0 0 40px rgba(232,121,249,0.3)';
  return (
    <div className="flex flex-col gap-3 flex-1 min-w-0 rounded-3xl p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(8,14,28,0.99) 100%)', border: `1px solid ${neonBorder}`, boxShadow: playing ? glow : '0 4px 32px rgba(0,0,0,0.6)', transition: 'box-shadow 0.5s' }}>
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm" style={{ background: neon, color: '#000', boxShadow: `0 0 16px ${neon}` }}>{deck}</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: neon }}>DECK {deck}</p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{playing ? '▶ PLAYING' : song ? '⏸ PAUSED' : 'NO TRACK'}</p>
          </div>
        </div>
        <BeatLights active={playing} color={neon} />
      </div>
      <div className="flex justify-center z-10"><Vinyl song={song} playing={playing} deck={deck} /></div>
      <div className="text-center z-10 min-h-[48px]">
        <p className="text-white font-black text-sm leading-tight line-clamp-2 mb-1" style={{ textShadow: playing ? `0 0 20px ${neon}` : 'none' }}>
          {song?.title || <span className="text-slate-600 italic text-xs">No track loaded</span>}
        </p>
        <p className="text-[10px] font-bold uppercase tracking-widest line-clamp-1" style={{ color: neon, opacity: 0.8 }}>
          {song?.artist || (song ? 'YouTube' : '— load a track from sidebar —')}
        </p>
      </div>
      <div className="z-10"><Spectrum active={playing} color={neon} /></div>
      <div className="z-10 space-y-1">
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div ref={fillRef} className="absolute inset-y-0 left-0 rounded-full" style={{ width: '0%', background: `linear-gradient(90deg,${neon},${isA ? '#0891b2' : '#c026d3'})`, boxShadow: `0 0 8px ${neon}` }} />
          <input ref={seekRef} type="range" min={0} max={100} defaultValue={0} onChange={e => onSeek(Number(e.target.value))} disabled={!song} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
        </div>
        <div className="flex justify-between text-[9px] font-black" style={{ color: neon, opacity: 0.6 }}>
          <span ref={timeRef}>0:00</span><span ref={durRef}>0:00</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 z-10">
        <button onClick={onPrev} className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90" style={{ background: neonDim, border: `1px solid ${neonBorder}`, color: neon }}><SkipBack size={14} fill="currentColor" /></button>
        <button onClick={onPlay} disabled={!ready || !song} className="w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-30" style={{ background: playing ? neon : neonDim, border: `2px solid ${neon}`, boxShadow: playing ? `0 0 32px ${neon}, 0 0 64px ${neon}40` : 'none', color: playing ? '#000' : neon }}>
          {playing ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="ml-1" />}
        </button>
        <button onClick={onNext} className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90" style={{ background: neonDim, border: `1px solid ${neonBorder}`, color: neon }}><SkipForward size={14} fill="currentColor" /></button>
      </div>
      <div className="flex justify-center gap-4 z-10">
        <EqKnob label="BASS" value={72} color={neon} /><EqKnob label="MID" value={58} color={neon} />
        <EqKnob label="HIGH" value={80} color={neon} /><EqKnob label="FX" value={30} color={neon} />
      </div>
      <div className="flex items-center gap-3 z-10">
        <Volume2 size={11} style={{ color: neon, opacity: 0.6, flexShrink: 0 }} />
        <div className="flex-1 relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="absolute inset-y-0 left-0" style={{ width: `${volume}%`, background: neon }} />
          <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
        </div>
        <Zap size={11} style={{ color: neon, opacity: 0.6, flexShrink: 0 }} />
        <div className="flex-1 relative h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="absolute inset-y-0 left-0" style={{ width: `${(pitch - 50) * 2}%`, background: neon }} />
          <input type="range" min={50} max={150} value={pitch} onChange={e => setPitch(Number(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer" />
        </div>
        <span className="text-[9px] font-black" style={{ color: neon, opacity: 0.7 }}>{(pitch / 100).toFixed(1)}x</span>
      </div>
    </div>
  );
}

/* ─── Mixer Center ───────────────────────────────────────────────────────── */
function MixerCenter({ crossfader, setCrossfader, volA, setVolA, volB, setVolB, pitchA, resetA, pitchB, resetB, playing }: {
  crossfader: number; setCrossfader: (v: number) => void; volA: number; setVolA: (v: number) => void;
  volB: number; setVolB: (v: number) => void; pitchA: number; resetA: () => void; pitchB: number; resetB: () => void; playing: boolean;
}) {
  return (
    <div className="w-40 flex-shrink-0 flex flex-col items-center gap-3 rounded-3xl p-3" style={{ background: 'linear-gradient(180deg, rgba(15,23,42,0.99) 0%, rgba(8,10,20,1) 100%)', border: '1px solid rgba(148,163,184,0.1)', boxShadow: '0 4px 32px rgba(0,0,0,0.8)' }}>
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex gap-1">{[1,2,3,4].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: playing ? `hsl(${260+i*20},80%,65%)` : 'rgba(255,255,255,0.1)', boxShadow: playing ? `0 0 6px hsl(${260+i*20},80%,65%)` : 'none', animation: playing ? `beatPulse 0.4s ${i*0.1}s ease infinite` : 'none' }} />)}</div>
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">MIXER</p>
      </div>
      <div className="flex gap-6 items-center h-36">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] font-black text-cyan-400 uppercase">A</span>
          <div className="relative flex items-center justify-center" style={{ width: 16, height: 96 }}>
            <div className="absolute rounded-full pointer-events-none" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 6, height: `${volA}%`, background: 'linear-gradient(to top,#06b6d4,#0e7490)', boxShadow: '0 0 8px #06b6d4', borderRadius: 9999 }} />
            <div className="absolute rounded-full pointer-events-none" style={{ width: 6, height: '100%', background: 'rgba(255,255,255,0.06)', left: '50%', transform: 'translateX(-50%)' }} />
            <input type="range" min={0} max={100} value={volA} onChange={e => setVolA(Number(e.target.value))} className="absolute cursor-pointer" style={{ width: 96, height: 16, transform: 'rotate(-90deg)', transformOrigin: 'center center', opacity: 0.01, zIndex: 10 }} />
          </div>
          <span className="text-[7px] font-black text-slate-500">{volA}%</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] font-black text-fuchsia-400 uppercase">B</span>
          <div className="relative flex items-center justify-center" style={{ width: 16, height: 96 }}>
            <div className="absolute rounded-full pointer-events-none" style={{ bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 6, height: `${volB}%`, background: 'linear-gradient(to top,#e879f9,#a21caf)', boxShadow: '0 0 8px #e879f9', borderRadius: 9999 }} />
            <div className="absolute rounded-full pointer-events-none" style={{ width: 6, height: '100%', background: 'rgba(255,255,255,0.06)', left: '50%', transform: 'translateX(-50%)' }} />
            <input type="range" min={0} max={100} value={volB} onChange={e => setVolB(Number(e.target.value))} className="absolute cursor-pointer" style={{ width: 96, height: 16, transform: 'rotate(-90deg)', transformOrigin: 'center center', opacity: 0.01, zIndex: 10 }} />
          </div>
          <span className="text-[7px] font-black text-slate-500">{volB}%</span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 w-full">
        <button onClick={resetA} className="w-full py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4' }}>↺ RESET A</button>
        <button onClick={resetB} className="w-full py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95" style={{ background: 'rgba(232,121,249,0.1)', border: '1px solid rgba(232,121,249,0.3)', color: '#e879f9' }}>↺ RESET B</button>
      </div>
      <div className="w-full">
        <div className="flex justify-between text-[8px] font-black mb-1.5">
          <span style={{ color: '#06b6d4' }}>A {Math.round(100-crossfader)}%</span>
          <span className="text-slate-600 uppercase tracking-widest">X-FADER</span>
          <span style={{ color: '#e879f9' }}>{Math.round(crossfader)}% B</span>
        </div>
        <div className="relative h-5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="absolute inset-y-0 left-0 rounded-l-full pointer-events-none" style={{ width: `${100 - crossfader}%`, background: 'linear-gradient(90deg,rgba(6,182,212,0.55),transparent)' }} />
          <div className="absolute inset-y-0 right-0 rounded-r-full pointer-events-none" style={{ width: `${crossfader}%`, background: 'linear-gradient(270deg,rgba(232,121,249,0.55),transparent)' }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-7 rounded-full pointer-events-none" style={{ left: `calc(${crossfader}% - 6px)`, background: 'linear-gradient(135deg,#06b6d4,#e879f9)', boxShadow: '0 0 14px rgba(139,92,246,0.9), 0 2px 8px rgba(0,0,0,0.6)', zIndex: 5 }} />
          <input type="range" min={0} max={100} value={crossfader} onChange={e => setCrossfader(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" style={{ zIndex: 20 }} />
        </div>
        <button onClick={() => setCrossfader(50)} className="mt-1.5 w-full py-1 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all active:scale-95" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>⊙ CENTER</button>
      </div>
    </div>
  );
}
const MixerCenterMemo = React.memo(MixerCenter);

/* ─── Add-to-Playlist Dropdown ───────────────────────────────────────────── */
function AddToPlaylistMenu({ song, playlists, onAdd, onClose }: {
  song: Song; playlists: Playlist[]; onAdd: (playlistId: string) => void; onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-8 z-50 w-48 rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg,#0f172a,#080d1a)', border: '1px solid rgba(139,92,246,0.3)' }}>
      <p className="text-[8px] font-black uppercase tracking-widest px-3 py-2" style={{ color: '#a78bfa', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Add to Playlist</p>
      {playlists.length === 0 && <p className="text-[9px] text-slate-600 px-3 py-2 italic">No playlists yet</p>}
      {playlists.map(pl => {
        const inList = pl.items.some(it => it.youtubeId === song.youtubeId);
        return (
          <button key={pl.id} onClick={() => { if (!inList) onAdd(pl.id); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[9px] font-bold text-left transition-all hover:bg-white/5 disabled:opacity-50"
            style={{ color: inList ? '#34d399' : '#e2e8f0' }} disabled={inList}>
            <span>{pl.emoji || '🎵'}</span>
            <span className="flex-1 truncate">{pl.name}</span>
            {inList && <Check size={10} className="text-emerald-400 flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Song Row ───────────────────────────────────────────────────────────── */
function SongRow({ song, onA, onB, onSmart, onAdd, onRemove, onDeckA, onDeckB, inPlaylist, isAdded, isSaving, playlists, onAddToPlaylist }: {
  song: Song; onA: () => void; onB: () => void; onSmart: () => void;
  onAdd: () => void; onRemove: () => void; onDeckA: boolean; onDeckB: boolean;
  inPlaylist: boolean; isAdded: boolean; isSaving: boolean;
  playlists: Playlist[]; onAddToPlaylist: (playlistId: string) => void;
}) {
  const [showPlMenu, setShowPlMenu] = useState(false);
  const activeA = onDeckA, activeB = onDeckB;
  return (
    <div className={`flex items-center gap-2 p-2 rounded-2xl group transition-all cursor-default relative ${
      activeA ? 'border border-cyan-500/30 bg-cyan-950/20' : activeB ? 'border border-fuchsia-500/30 bg-fuchsia-950/20' : 'border border-transparent hover:border-slate-700/60 hover:bg-slate-800/30'
    }`}>
      {/* Thumb */}
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative" style={{ background: '#0f172a', boxShadow: activeA ? '0 0 10px rgba(6,182,212,0.4)' : activeB ? '0 0 10px rgba(232,121,249,0.4)' : 'none' }}>
        {song.thumbnail ? <img src={song.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music2 size={14} className="text-slate-600" /></div>}
        {(activeA || activeB) && <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: activeA ? 'rgba(6,182,212,0.55)' : 'rgba(232,121,249,0.55)' }}><span className="text-white font-black text-xs">{activeA ? 'A' : 'B'}</span></div>}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black leading-tight line-clamp-1" style={{ color: activeA ? '#67e8f9' : activeB ? '#f0abfc' : '#e2e8f0' }}>{song.title}</p>
        <p className="text-[8px] text-slate-500 font-bold mt-0.5 line-clamp-1">{song.artist || 'YouTube'}</p>
      </div>
      {/* Controls */}
      <div className="flex items-center gap-0.5">
        {/* Smart play button */}
        <button onClick={e => { e.stopPropagation(); onSmart(); }}
          className="w-6 h-6 rounded-lg flex items-center justify-center transition-all active:scale-90"
          title="Auto-load to free deck"
          style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.25)' }}>
          <Play size={9} fill="currentColor" />
        </button>
        {/* Manual A/B */}
        <div className="flex flex-col gap-0.5">
          <button onClick={e => { e.stopPropagation(); onA(); }} className="px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase transition-all active:scale-90" style={activeA ? { background: '#06b6d4', color: '#000' } : { background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.25)' }}>A</button>
          <button onClick={e => { e.stopPropagation(); onB(); }} className="px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase transition-all active:scale-90" style={activeB ? { background: '#e879f9', color: '#000' } : { background: 'rgba(232,121,249,0.1)', color: '#e879f9', border: '1px solid rgba(232,121,249,0.25)' }}>B</button>
        </div>
        {/* Add to main playlist / remove */}
        {inPlaylist
          ? <button onClick={e => { e.stopPropagation(); onRemove(); }} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg flex items-center justify-center transition-all" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}><Trash2 size={9} /></button>
          : <button onClick={e => { e.stopPropagation(); onAdd(); }} disabled={isAdded || isSaving} className="w-6 h-6 rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-50" style={isAdded ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' } : { background: 'rgba(6,182,212,0.1)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.25)' }}>
            {isSaving ? <Loader2 size={9} className="animate-spin" /> : isAdded ? <Check size={9} /> : <Plus size={9} />}
          </button>
        }
        {/* Add to custom playlist */}
        <div className="relative">
          <button onClick={e => { e.stopPropagation(); setShowPlMenu(p => !p); }}
            className="w-6 h-6 rounded-lg flex items-center justify-center transition-all active:scale-90 opacity-0 group-hover:opacity-100"
            style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.2)' }} title="Add to custom playlist">
            <Layers size={9} />
          </button>
          {showPlMenu && <AddToPlaylistMenu song={song} playlists={playlists} onAdd={onAddToPlaylist} onClose={() => setShowPlMenu(false)} />}
        </div>
      </div>
    </div>
  );
}
const SongRowMemo = React.memo(SongRow);

/* ─── Playlist Song Row (in My Lists) ───────────────────────────────────── */
function PlaylistSongRow({ item, onSmart, onA, onB, onRemove, onDeckA, onDeckB }: {
  item: PlaylistItem; onSmart: () => void; onA: () => void; onB: () => void; onRemove: () => void; onDeckA: boolean; onDeckB: boolean;
}) {
  const song: Song = { youtubeId: item.youtubeId, title: item.title, artist: item.artist, thumbnail: item.thumbnail, duration: item.duration };
  return (
    <div className={`flex items-center gap-2 p-2 rounded-xl group transition-all cursor-default relative ${
      onDeckA ? 'border border-cyan-500/30 bg-cyan-950/20' : onDeckB ? 'border border-fuchsia-500/30 bg-fuchsia-950/20' : 'border border-transparent hover:border-slate-700/40 hover:bg-slate-800/20'
    }`}>
      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: '#0f172a' }}>
        {item.thumbnail ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music2 size={12} className="text-slate-600" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold line-clamp-1" style={{ color: onDeckA ? '#67e8f9' : onDeckB ? '#f0abfc' : '#cbd5e1' }}>{item.title}</p>
        <p className="text-[7px] text-slate-600">{item.artist || 'YouTube'}</p>
      </div>
      <div className="flex items-center gap-0.5">
        <button onClick={onSmart} className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}><Play size={8} fill="currentColor" /></button>
        <div className="flex flex-col gap-0.5">
          <button onClick={onA} className="px-1 py-0.5 rounded text-[6px] font-black" style={onDeckA ? { background: '#06b6d4', color: '#000' } : { background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>A</button>
          <button onClick={onB} className="px-1 py-0.5 rounded text-[6px] font-black" style={onDeckB ? { background: '#e879f9', color: '#000' } : { background: 'rgba(232,121,249,0.1)', color: '#e879f9' }}>B</button>
        </div>
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center transition-all" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}><Trash2 size={8} /></button>
      </div>
    </div>
  );
}

/* ─── Spotify Track Row ──────────────────────────────────────────────────── */
function SpotifyTrackRow({ track, onPlay, loading, isOnA, isOnB }: {
  track: SpotifyTrack; onPlay: () => void;
  onDeckA: () => void; onDeckB: () => void;
  loading: boolean; isOnA: boolean; isOnB: boolean;
}) {
  const active = isOnA || isOnB;
  return (
    <div className={`flex items-center gap-2 p-1.5 rounded-xl group transition-all cursor-default ${active ? 'border border-emerald-500/30 bg-emerald-950/20' : 'border border-transparent hover:border-slate-700/30 hover:bg-slate-800/20'}`}>
      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ background: '#0f172a' }}>
        {track.thumbnail
          ? <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><SpotifyLogoSvg size={16} /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold line-clamp-1" style={{ color: active ? '#1DB954' : '#cbd5e1' }}>{track.title}</p>
        <p className="text-[7px] text-slate-600 line-clamp-1">{track.artist}</p>
      </div>
      <button onClick={onPlay} disabled={loading}
        className="w-6 h-6 rounded-lg flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 flex-shrink-0"
        style={{ background: 'rgba(29,185,84,0.2)', color: '#1DB954', border: '1px solid rgba(29,185,84,0.3)' }}>
        {loading ? <Loader2 size={9} className="animate-spin" /> : <Play size={9} fill="currentColor" />}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function MusicPage() {
  const {
    playlist, songA, playA, volA, pitchA, readyA,
    songB, playB, volB, pitchB, readyB,
    crossfader, pA, pB, isLoading, savingId, addedIds, toast: globalToast,
    setVolA, setVolB, setPitchA, setPitchB, setCrossfader,
    loadDeck, loadSmartDeck, toggleA, toggleB, skipDeck, addSong, removeSong,
  } = useMusic();

  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'playlist' | 'search' | 'mylists' | 'spotify'>('search');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [nextPageToken, setNextPageToken] = useState('');
  const [localToast, setLocalToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const toast = globalToast || localToast;

  // Custom playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [expandedPl, setExpandedPl] = useState<string | null>(null);
  const [showCreatePl, setShowCreatePl] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlEmoji, setNewPlEmoji] = useState('🎵');
  const [savingPl, setSavingPl] = useState(false);

  // Spotify state
  const [spConfigured, setSpConfigured] = useState(false);
  const [spLoggedIn, setSpLoggedIn] = useState(false);
  const [spUser, setSpUser] = useState<SpotifyUser | null>(null);
  const [spPlaylists, setSpPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [spExpandedPl, setSpExpandedPl] = useState<string | null>(null);
  const [spTracks, setSpTracks] = useState<Record<string, SpotifyTrack[]>>({});
  const [spLoadingPl, setSpLoadingPl] = useState<string | null>(null);
  const [spSearchQ, setSpSearchQ] = useState('');
  const [spResults, setSpResults] = useState<SpotifyTrack[]>([]);
  const [spSearching, setSpSearching] = useState(false);
  const [spBridging, setSpBridging] = useState<string | null>(null); // trackId being bridged via YT search
  const [spActiveTab, setSpActiveTab] = useState<'search' | 'playlists'>('playlists');
  // Check for ?sp=1 in URL (redirect back after Spotify OAuth)
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const [propertyCode, setPropertyCode] = useState('');

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setLocalToast({ msg, type });
    setTimeout(() => setLocalToast(null), 3000);
  }, []);

  // DOM refs for time/progress bars
  const timeARef = useRef<HTMLSpanElement>(null);
  const durARef  = useRef<HTMLSpanElement>(null);
  const seekARef = useRef<HTMLInputElement>(null);
  const fillARef = useRef<HTMLDivElement>(null);
  const timeBRef = useRef<HTMLSpanElement>(null);
  const durBRef  = useRef<HTMLSpanElement>(null);
  const seekBRef = useRef<HTMLInputElement>(null);
  const fillBRef = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number>(0);

  // rAF loop — updates DOM directly
  useEffect(() => {
    const tick = () => {
      try {
        if (pA.current) {
          const ct = pA.current.getCurrentTime?.() || 0, dur = pA.current.getDuration?.() || 0;
          if (timeARef.current) timeARef.current.textContent = fmt(ct);
          if (durARef.current)  durARef.current.textContent  = fmt(dur);
          const pct = dur > 0 ? (ct / dur) * 100 : 0;
          if (seekARef.current) { seekARef.current.max = String(dur); seekARef.current.value = String(ct); }
          if (fillARef.current) fillARef.current.style.width = `${pct}%`;
        }
      } catch {}
      try {
        if (pB.current) {
          const ct = pB.current.getCurrentTime?.() || 0, dur = pB.current.getDuration?.() || 0;
          if (timeBRef.current) timeBRef.current.textContent = fmt(ct);
          if (durBRef.current)  durBRef.current.textContent  = fmt(dur);
          const pct = dur > 0 ? (ct / dur) * 100 : 0;
          if (seekBRef.current) { seekBRef.current.max = String(dur); seekBRef.current.value = String(ct); }
          if (fillBRef.current) fillBRef.current.style.width = `${pct}%`;
        }
      } catch {}
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [pA, pB]);

  // Reset seek bars on song change
  useEffect(() => {
    if (timeARef.current) timeARef.current.textContent = '0:00';
    if (durARef.current)  durARef.current.textContent  = '0:00';
    if (fillARef.current) fillARef.current.style.width = '0%';
    if (seekARef.current) seekARef.current.value = '0';
  }, [songA]);
  useEffect(() => {
    if (timeBRef.current) timeBRef.current.textContent = '0:00';
    if (durBRef.current)  durBRef.current.textContent  = '0:00';
    if (fillBRef.current) fillBRef.current.style.width = '0%';
    if (seekBRef.current) seekBRef.current.value = '0';
  }, [songB]);

  // Load trending on mount
  const loadTrending = useCallback(async () => {
    setIsSearching(true); setSearchError('');
    try {
      const r = await fetch('/api/music/search'), d = await r.json();
      if (d.success) { setSearchResults(d.data); setNextPageToken(d.nextPageToken || ''); }
      else setSearchError(d.message || 'Failed');
    } catch { setSearchError('Failed to load trending.'); }
    finally { setIsSearching(false); }
  }, []);

  // Load custom playlists
  const loadPlaylists = useCallback(async () => {
    try {
      const r = await fetch('/api/music/playlists'), d = await r.json();
      if (d.success) setPlaylists(d.data);
    } catch {}
  }, []);

  // Spotify — check auth status
  const checkSpotify = useCallback(async () => {
    try {
      const r = await fetch('/api/music/spotify/me'), d = await r.json();
      setSpConfigured(d.configured ?? false);
      setSpLoggedIn(d.loggedIn ?? false);
      if (d.loggedIn) setSpUser(d.user);
    } catch {}
  }, []);

  // Spotify — load user playlists
  const loadSpPlaylists = useCallback(async () => {
    try {
      const r = await fetch('/api/music/spotify/playlists'), d = await r.json();
      if (d.success) setSpPlaylists(d.data);
    } catch {}
  }, []);

  // Spotify — load tracks in a playlist
  const loadSpTracks = useCallback(async (plId: string) => {
    if (spTracks[plId]) return; // already cached
    setSpLoadingPl(plId);
    try {
      const r = await fetch(`/api/music/spotify/playlists/${plId}/tracks`), d = await r.json();
      if (d.success) setSpTracks(prev => ({ ...prev, [plId]: d.data }));
    } catch {}
    finally { setSpLoadingPl(null); }
  }, [spTracks]);

  // Spotify — search
  const searchSpotify = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSpSearching(true);
    try {
      const r = await fetch(`/api/music/spotify/search?q=${encodeURIComponent(q)}`), d = await r.json();
      if (d.success) setSpResults(d.data);
    } catch {}
    finally { setSpSearching(false); }
  }, []);

  // Spotify → YouTube bridge: search YT for the song and load on smart deck
  const bridgeToYouTube = useCallback(async (track: SpotifyTrack) => {
    setSpBridging(track.id);
    try {
      const q = `${track.title} ${track.artist}`;
      const r = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`), d = await r.json();
      if (d.success && d.data.length > 0) {
        loadSmartDeck({ youtubeId: d.data[0].youtubeId, title: track.title, artist: track.artist, thumbnail: track.thumbnail || d.data[0].thumbnail });
        showToast(`Playing: ${track.title}`);
      } else {
        showToast('Could not find on YouTube', 'error');
      }
    } catch { showToast('Bridge failed', 'error'); }
    finally { setSpBridging(null); }
  }, [loadSmartDeck, showToast]);

  // Spotify logout
  const spotifyLogout = async () => {
    await fetch('/api/music/spotify/logout');
    setSpLoggedIn(false); setSpUser(null); setSpPlaylists([]); setSpTracks({});
    showToast('Spotify disconnected');
  };

  // Extract propertyCode from the URL path
  useEffect(() => {
    const parts = window.location.pathname.split('/');
    setPropertyCode(parts[1] || '');
  }, []);

  useEffect(() => { loadTrending(); loadPlaylists(); checkSpotify(); }, [loadTrending, loadPlaylists, checkSpotify]);

  // When switching to Spotify tab and logged in, load playlists automatically
  useEffect(() => {
    if (activeTab === 'spotify' && spLoggedIn && spPlaylists.length === 0) loadSpPlaylists();
  }, [activeTab, spLoggedIn, spPlaylists.length, loadSpPlaylists]);

  // When a Spotify playlist is expanded, load its tracks
  useEffect(() => {
    if (spExpandedPl) loadSpTracks(spExpandedPl);
  }, [spExpandedPl, loadSpTracks]);

  // After OAuth redirect (?sp=1), switch to spotify tab
  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('sp') === '1') {
      setActiveTab('spotify');
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true); setSearchError(''); setNextPageToken('');
    try {
      const r = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}`), d = await r.json();
      if (d.success) { setSearchResults(d.data); setNextPageToken(d.nextPageToken || ''); setActiveTab('search'); }
      else setSearchError(d.message || 'Search failed');
    } catch { setSearchError('Search failed. Check API key in settings.'); }
    finally { setIsSearching(false); }
  };

  const loadMore = async () => {
    if (!nextPageToken || isSearching) return;
    setIsSearching(true);
    try {
      const r = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}&pageToken=${nextPageToken}`), d = await r.json();
      if (d.success) { setSearchResults(p => [...p, ...d.data]); setNextPageToken(d.nextPageToken || ''); }
    } catch {} finally { setIsSearching(false); }
  };

  // Create playlist
  const createPlaylist = async () => {
    if (!newPlName.trim()) return;
    setSavingPl(true);
    try {
      const r = await fetch('/api/music/playlists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newPlName.trim(), emoji: newPlEmoji }) });
      const d = await r.json();
      if (d.success) {
        setPlaylists(p => [...p, d.data]);
        setNewPlName(''); setNewPlEmoji('🎵'); setShowCreatePl(false);
        setActiveTab('mylists'); setExpandedPl(d.data.id);
        showToast(`Created "${d.data.name}"`);
      }
    } catch { showToast('Failed to create playlist', 'error'); }
    finally { setSavingPl(false); }
  };

  // Delete playlist
  const deletePlaylist = async (plId: string) => {
    try {
      await fetch(`/api/music/playlists/${plId}`, { method: 'DELETE' });
      setPlaylists(p => p.filter(pl => pl.id !== plId));
      showToast('Playlist deleted');
    } catch { showToast('Failed', 'error'); }
  };

  // Add song to custom playlist
  const addToPlaylist = async (song: Song, playlistId: string) => {
    try {
      const r = await fetch(`/api/music/playlists/${playlistId}/songs`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtubeId: song.youtubeId, title: song.title, artist: song.artist, thumbnail: song.thumbnail, duration: song.duration }),
      });
      const d = await r.json();
      if (d.success) {
        setPlaylists(prev => prev.map(pl => pl.id === playlistId ? { ...pl, items: d.duplicate ? pl.items : [...pl.items, d.data] } : pl));
        if (!d.duplicate) showToast('Added to playlist ✓');
      }
    } catch { showToast('Failed to add to playlist', 'error'); }
  };

  // Remove song from custom playlist
  const removeFromPlaylist = async (playlistId: string, songId: string) => {
    try {
      await fetch(`/api/music/playlists/${playlistId}/songs/${songId}`, { method: 'DELETE' });
      setPlaylists(prev => prev.map(pl => pl.id === playlistId ? { ...pl, items: pl.items.filter(it => it.id !== songId) } : pl));
      showToast('Removed from playlist');
    } catch { showToast('Failed', 'error'); }
  };

  const anyPlaying = playA || playB;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col gap-3 overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Global styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        @keyframes vinylSpin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
        @keyframes specBar  { from { transform:scaleY(0.3) } to { transform:scaleY(1) } }
        @keyframes beatPulse { 0%,100% { opacity:.4; transform:scale(.85) } 50% { opacity:1; transform:scale(1) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl text-xs font-black shadow-2xl" style={{ background: toast.type === 'success' ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#dc2626,#b91c1c)', boxShadow: toast.type === 'success' ? '0 0 20px rgba(16,185,129,0.4)' : '0 0 20px rgba(220,38,38,0.4)', color: '#fff', animation: 'fadeUp 0.3s ease' }}>
          {toast.type === 'success' ? <Check size={13} /> : <AlertCircle size={13} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow: '0 0 24px rgba(124,58,237,0.5)' }}><Music2 size={22} className="text-white" /></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tighter uppercase">Virtual DJ</h1>
              <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>Mixer Console</span>
              {anyPlaying && (
                <div className="flex items-end gap-0.5 h-4">
                  {[4,7,5,8,6].map((h,i) => <div key={i} className="w-0.5 rounded-full" style={{ height: h, background: i % 2 === 0 ? '#06b6d4' : '#e879f9', animation: `beatPulse ${0.3+i*0.07}s ease ${i*0.05}s infinite`, boxShadow: i % 2 === 0 ? '0 0 4px #06b6d4' : '0 0 4px #e879f9' }} />)}
                </div>
              )}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(148,163,184,0.6)' }}>Dual Deck · Crossfader · Smart Routing · Playlists · Spotify</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="flex flex-col items-center px-4 py-2 rounded-2xl" style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <span className="text-2xl font-black" style={{ color: '#06b6d4', lineHeight: 1 }}>128</span>
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">BPM A</span>
          </div>
          <div className="flex flex-col items-center px-4 py-2 rounded-2xl" style={{ background: 'rgba(232,121,249,0.08)', border: '1px solid rgba(232,121,249,0.2)' }}>
            <span className="text-2xl font-black" style={{ color: '#e879f9', lineHeight: 1 }}>128</span>
            <span className="text-[7px] font-black uppercase tracking-widest text-slate-500">BPM B</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
        <div className="w-64 xl:w-72 flex-shrink-0 flex flex-col gap-2 min-h-0">

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-shrink-0">
            <div className="flex-1 relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tracks..."
                className="w-full pl-8 pr-3 py-2.5 rounded-2xl text-[11px] font-bold text-white placeholder-slate-600 focus:outline-none transition-all"
                style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(148,163,184,0.12)', caretColor: '#06b6d4' }} />
            </div>
            <button type="submit" disabled={isSearching || !searchQuery.trim()}
              className="px-3 py-2 rounded-2xl transition-all active:scale-90 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow: '0 0 14px rgba(124,58,237,0.4)', color: '#fff' }}>
              {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />}
            </button>
          </form>

          {/* Tabs: 2x2 grid — Library, Search, My Lists, Spotify */}
          <div className="grid grid-cols-2 gap-1 flex-shrink-0 p-1 rounded-2xl" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {/* Row 1 */}
            <button onClick={() => setActiveTab('playlist')}
              className="flex items-center justify-center gap-1 px-1 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all"
              style={activeTab === 'playlist'
                ? { background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }
                : { color: 'rgba(148,163,184,0.5)', border: '1px solid transparent' }}>
              <ListMusic size={9} />Library
            </button>
            <button onClick={() => setActiveTab('search')}
              className="flex items-center justify-center gap-1 px-1 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all"
              style={activeTab === 'search'
                ? { background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }
                : { color: 'rgba(148,163,184,0.5)', border: '1px solid transparent' }}>
              <Radio size={9} />YouTube
            </button>
            {/* Row 2 */}
            <button onClick={() => setActiveTab('mylists')}
              className="flex items-center justify-center gap-1 px-1 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all"
              style={activeTab === 'mylists'
                ? { background: 'rgba(124,58,237,0.25)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }
                : { color: 'rgba(148,163,184,0.5)', border: '1px solid transparent' }}>
              <Layers size={9} />My Lists
            </button>
            <button onClick={() => setActiveTab('spotify')}
              className="flex items-center justify-center gap-1 px-1 py-1.5 rounded-xl text-[7px] font-black uppercase tracking-widest transition-all"
              style={activeTab === 'spotify'
                ? { background: 'rgba(29,185,84,0.2)', color: '#1DB954', border: '1px solid rgba(29,185,84,0.4)' }
                : { color: 'rgba(148,163,184,0.5)', border: '1px solid transparent' }}>
              <SpotifyLogoSvg size={9} />Spotify
            </button>
          </div>

          {/* ── LIBRARY TAB ── */}
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 space-y-1">
            {activeTab === 'playlist' && (
              isLoading
                ? <div className="flex justify-center items-center h-24 gap-2" style={{ color: '#7c3aed' }}><Loader2 size={18} className="animate-spin" /><span className="text-[9px] font-black uppercase">Loading…</span></div>
                : playlist.length === 0
                  ? <div className="flex flex-col items-center justify-center h-24 gap-2"><Music2 size={22} className="text-slate-700" /><button onClick={() => setActiveTab('search')} className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#7c3aed' }}>Browse Trending →</button></div>
                  : playlist.map(s => (
                    <SongRowMemo key={s.id} song={s}
                      onA={() => loadDeck('A', s)} onB={() => loadDeck('B', s)} onSmart={() => loadSmartDeck(s)}
                      onAdd={() => {}} onRemove={() => removeSong(s)}
                      onDeckA={songA?.youtubeId === s.youtubeId} onDeckB={songB?.youtubeId === s.youtubeId}
                      inPlaylist isAdded isSaving={false}
                      playlists={playlists} onAddToPlaylist={plId => addToPlaylist(s, plId)} />
                  ))
            )}

            {/* ── SEARCH TAB ── */}
            {activeTab === 'search' && (
              <>
                {searchError && <div className="flex items-center gap-2 p-3 rounded-2xl text-[10px] font-bold" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171' }}><AlertCircle size={13} />{searchError}</div>}
                {!searchError && searchResults.length === 0 && !isSearching && <div className="flex flex-col items-center justify-center h-24 gap-2"><Radio size={22} className="text-slate-700" /><p className="text-[9px] font-black uppercase tracking-widest text-slate-600">Search for tracks</p></div>}
                {isSearching && searchResults.length === 0 && <div className="flex justify-center items-center h-24 gap-2" style={{ color: '#7c3aed' }}><Loader2 size={18} className="animate-spin" /><span className="text-[9px] font-black uppercase">Searching…</span></div>}
                {searchResults.map((s, i) => (
                  <SongRowMemo key={`${s.youtubeId}-${i}`} song={s}
                    onA={() => loadDeck('A', s)} onB={() => loadDeck('B', s)} onSmart={() => loadSmartDeck(s)}
                    onAdd={() => addSong(s)} onRemove={() => {}}
                    onDeckA={songA?.youtubeId === s.youtubeId} onDeckB={songB?.youtubeId === s.youtubeId}
                    inPlaylist={false} isAdded={addedIds.has(s.youtubeId)} isSaving={savingId === s.youtubeId}
                    playlists={playlists} onAddToPlaylist={plId => addToPlaylist(s, plId)} />
                ))}
                {nextPageToken && (
                  <button onClick={loadMore} disabled={isSearching}
                    className="w-full py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                    style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', color: '#7c3aed' }}>
                    {isSearching ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}Load More
                  </button>
                )}
              </>
            )}

            {/* ── MY LISTS TAB ── */}
            {activeTab === 'mylists' && (
              <div className="space-y-2">
                {/* Create playlist button */}
                <button onClick={() => setShowCreatePl(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(6,182,212,0.1))', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                  <Plus size={11} />New Playlist
                </button>

                {/* Create playlist form */}
                {showCreatePl && (
                  <div className="rounded-2xl p-3 space-y-2" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(124,58,237,0.3)' }}>
                    <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#a78bfa' }}>New Playlist</p>
                    {/* Emoji picker */}
                    <div className="flex flex-wrap gap-1">
                      {EMOJI_OPTIONS.map(em => (
                        <button key={em} onClick={() => setNewPlEmoji(em)}
                          className="w-7 h-7 rounded-lg text-sm transition-all"
                          style={{ background: newPlEmoji === em ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.05)', border: newPlEmoji === em ? '1px solid rgba(124,58,237,0.6)' : '1px solid transparent' }}>
                          {em}
                        </button>
                      ))}
                    </div>
                    <input value={newPlName} onChange={e => setNewPlName(e.target.value)}
                      placeholder="Playlist name…"
                      onKeyDown={e => e.key === 'Enter' && createPlaylist()}
                      className="w-full px-3 py-2 rounded-xl text-[11px] font-bold text-white placeholder-slate-600 focus:outline-none"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', caretColor: '#a78bfa' }} />
                    <div className="flex gap-2">
                      <button onClick={createPlaylist} disabled={savingPl || !newPlName.trim()}
                        className="flex-1 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest disabled:opacity-40 transition-all"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', color: '#fff' }}>
                        {savingPl ? <Loader2 size={10} className="animate-spin mx-auto" /> : 'Create'}
                      </button>
                      <button onClick={() => setShowCreatePl(false)} className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b' }}><X size={10} /></button>
                    </div>
                  </div>
                )}

                {playlists.length === 0 && !showCreatePl && (
                  <div className="flex flex-col items-center justify-center h-24 gap-2">
                    <Layers size={20} className="text-slate-700" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600">No playlists yet</p>
                    <p className="text-[8px] text-slate-700">Create one above ↑</p>
                  </div>
                )}

                {/* Playlist cards */}
                {playlists.map(pl => (
                  <div key={pl.id} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Playlist header */}
                    <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={() => setExpandedPl(expandedPl === pl.id ? null : pl.id)}>
                      <span className="text-base">{pl.emoji || '🎵'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white truncate">{pl.name}</p>
                        <p className="text-[7px] text-slate-600">{pl.items.length} song{pl.items.length !== 1 ? 's' : ''}</p>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deletePlaylist(pl.id); }}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center transition-all"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}>
                        <Trash2 size={8} />
                      </button>
                      {expandedPl === pl.id ? <ChevronDown size={12} className="text-slate-500" /> : <ChevronRight size={12} className="text-slate-500" />}
                    </div>
                    {/* Expanded items */}
                    {expandedPl === pl.id && (
                      <div className="px-2 pb-2 space-y-1 border-t border-white/5">
                        {pl.items.length === 0 && <p className="text-[8px] text-slate-700 py-2 text-center">No songs — hover a track and click 🎚</p>}
                        {pl.items.map(item => (
                          <PlaylistSongRow key={item.id} item={item}
                            onSmart={() => loadSmartDeck({ youtubeId: item.youtubeId, title: item.title, artist: item.artist, thumbnail: item.thumbnail })}
                            onA={() => loadDeck('A', { youtubeId: item.youtubeId, title: item.title, artist: item.artist, thumbnail: item.thumbnail })}
                            onB={() => loadDeck('B', { youtubeId: item.youtubeId, title: item.title, artist: item.artist, thumbnail: item.thumbnail })}
                            onRemove={() => removeFromPlaylist(pl.id, item.id)}
                            onDeckA={songA?.youtubeId === item.youtubeId}
                            onDeckB={songB?.youtubeId === item.youtubeId} />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── SPOTIFY TAB ── */}
            {activeTab === 'spotify' && (
              <div className="space-y-2">
                {/* Not configured */}
                {!spConfigured && (
                  <div className="flex flex-col items-center justify-center gap-3 py-8 px-3 text-center">
                    <SpotifyLogoSvg size={40} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Spotify Not Configured</p>
                    <p className="text-[9px] text-slate-600 leading-relaxed">An admin needs to add Spotify credentials to the <code className="text-slate-500">.env</code> file.</p>
                    <a href="/admin/settings/spotify" target="_blank"
                      className="flex items-center gap-1 px-3 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all"
                      style={{ background: 'rgba(29,185,84,0.1)', color: '#1DB954', border: '1px solid rgba(29,185,84,0.3)' }}>
                      Open Admin Settings
                    </a>
                  </div>
                )}

                {/* Configured but not logged in */}
                {spConfigured && !spLoggedIn && (
                  <div className="flex flex-col items-center justify-center gap-4 py-8 px-3 text-center">
                    <SpotifyLogoSvg size={48} />
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest text-white mb-1">Connect Spotify</p>
                      <p className="text-[9px] text-slate-500 leading-relaxed">Login to see your playlists and search songs</p>
                    </div>
                    <a href={`/api/music/spotify/auth?propertyCode=${propertyCode}`}
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                      style={{ background: '#1DB954', color: '#000', boxShadow: '0 0 20px rgba(29,185,84,0.4)' }}>
                      <SpotifyLogoSvg size={14} /> Login with Spotify
                    </a>
                  </div>
                )}

                {/* Logged in */}
                {spConfigured && spLoggedIn && (
                  <div className="space-y-2">
                    {/* User card */}
                    <div className="flex items-center gap-2 p-2 rounded-2xl" style={{ background: 'rgba(29,185,84,0.08)', border: '1px solid rgba(29,185,84,0.2)' }}>
                      {spUser?.image
                        ? <img src={spUser.image} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" style={{ border: '1px solid #1DB954' }} />
                        : <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: '#1DB954' }}><span className="text-black font-black text-xs">{spUser?.displayName?.[0]}</span></div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black truncate" style={{ color: '#1DB954' }}>{spUser?.displayName}</p>
                        <p className="text-[7px] text-slate-600 truncate">{spUser?.email}</p>
                      </div>
                      <button onClick={spotifyLogout} className="text-[7px] font-black uppercase tracking-widest text-slate-600 hover:text-red-400 transition-all">✕</button>
                    </div>

                    {/* Sub-tabs */}
                    <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {(['search', 'playlists'] as const).map(t => (
                        <button key={t} onClick={() => setSpActiveTab(t)}
                          className="flex-1 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest transition-all"
                          style={spActiveTab === t
                            ? { background: 'rgba(29,185,84,0.25)', color: '#1DB954', border: '1px solid rgba(29,185,84,0.3)' }
                            : { color: 'rgba(148,163,184,0.4)', border: '1px solid transparent' }}>
                          {t === 'search' ? '🔍 Search' : '📚 Playlists'}
                        </button>
                      ))}
                    </div>

                    {/* Spotify Search */}
                    {spActiveTab === 'search' && (
                      <div className="space-y-1">
                        <form onSubmit={e => { e.preventDefault(); searchSpotify(spSearchQ); }} className="flex gap-1">
                          <input value={spSearchQ} onChange={e => setSpSearchQ(e.target.value)} placeholder="Search Spotify…"
                            className="flex-1 px-3 py-2 rounded-xl text-[10px] font-bold text-white placeholder-slate-600 focus:outline-none"
                            style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(29,185,84,0.2)', caretColor: '#1DB954' }} />
                          <button type="submit" disabled={spSearching || !spSearchQ.trim()}
                            className="px-2 py-2 rounded-xl disabled:opacity-40 transition-all"
                            style={{ background: '#1DB954', color: '#000' }}>
                            {spSearching ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} />}
                          </button>
                        </form>
                        {spResults.length === 0 && !spSearching && (
                          <p className="text-[8px] text-slate-600 text-center py-4">Search tracks on Spotify</p>
                        )}
                        {spResults.map(t => (
                          <SpotifyTrackRow key={t.id} track={t}
                            onPlay={() => bridgeToYouTube(t)}
                            onDeckA={() => { bridgeToYouTube(t); }}
                            onDeckB={() => { bridgeToYouTube(t); }}
                            loading={spBridging === t.id}
                            isOnA={songA?.title === t.title}
                            isOnB={songB?.title === t.title} />
                        ))}
                      </div>
                    )}

                    {/* Spotify Playlists */}
                    {spActiveTab === 'playlists' && (
                      <div className="space-y-1.5">
                        {spPlaylists.length === 0 && (
                          <div className="flex flex-col items-center gap-2 py-6">
                            <Loader2 size={16} className="animate-spin" style={{ color: '#1DB954' }} />
                            <p className="text-[8px] text-slate-600">Loading playlists…</p>
                          </div>
                        )}
                        {spPlaylists.map(pl => (
                          <div key={pl.id} className="rounded-xl overflow-hidden" style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(29,185,84,0.12)' }}>
                            <div className="flex items-center gap-2 p-2 cursor-pointer" onClick={() => setSpExpandedPl(spExpandedPl === pl.id ? null : pl.id)}>
                              {pl.image
                                ? <img src={pl.image} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                                : <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: 'rgba(29,185,84,0.15)' }}><SpotifyLogoSvg size={16} /></div>}
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-black text-white truncate">{pl.name}</p>
                                <p className="text-[7px] text-slate-600">{pl.total} tracks</p>
                              </div>
                              {spExpandedPl === pl.id ? <ChevronDown size={10} className="text-slate-500" /> : <ChevronRight size={10} className="text-slate-500" />}
                            </div>
                            {spExpandedPl === pl.id && (
                              <div className="px-1.5 pb-1.5 space-y-1 border-t border-white/5">
                                {spLoadingPl === pl.id && <div className="flex justify-center py-3"><Loader2 size={13} className="animate-spin" style={{ color: '#1DB954' }} /></div>}
                                {(spTracks[pl.id] || []).map(t => (
                                  <SpotifyTrackRow key={t.id} track={t}
                                    onPlay={() => bridgeToYouTube(t)}
                                    onDeckA={() => bridgeToYouTube(t)}
                                    onDeckB={() => bridgeToYouTube(t)}
                                    loading={spBridging === t.id}
                                    isOnA={songA?.title === t.title}
                                    isOnB={songB?.title === t.title} />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── DJ CONSOLE ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">
          <DeckCard deck="A" song={songA} playing={playA}
            volume={volA} setVolume={setVolA} pitch={pitchA} setPitch={setPitchA}
            ready={readyA} onPlay={toggleA}
            onSeek={t => { try { pA.current?.seekTo(t, true); } catch {} }}
            onPrev={() => skipDeck('A', -1)} onNext={() => skipDeck('A', 1)}
            seekRef={seekARef} fillRef={fillARef} timeRef={timeARef} durRef={durARef} />
          <MixerCenterMemo
            crossfader={crossfader} setCrossfader={setCrossfader}
            volA={volA} setVolA={setVolA} volB={volB} setVolB={setVolB}
            pitchA={pitchA} resetA={() => setPitchA(100)}
            pitchB={pitchB} resetB={() => setPitchB(100)}
            playing={anyPlaying} />
          <DeckCard deck="B" song={songB} playing={playB}
            volume={volB} setVolume={setVolB} pitch={pitchB} setPitch={setPitchB}
            ready={readyB} onPlay={toggleB}
            onSeek={t => { try { pB.current?.seekTo(t, true); } catch {} }}
            onPrev={() => skipDeck('B', -1)} onNext={() => skipDeck('B', 1)}
            seekRef={seekBRef} fillRef={fillBRef} timeRef={timeBRef} durRef={durBRef} />
        </div>
      </div>
    </div>
  );
}
