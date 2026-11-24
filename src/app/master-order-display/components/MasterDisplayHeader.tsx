'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tv, Maximize2, Minimize2, Volume2, VolumeX, Mic, MicOff,
  RefreshCw, Columns, Kanban, LayoutGrid, Clock, ArrowLeft,
  Settings, Sparkles, Building2, Split, Users
} from 'lucide-react';
import { ViewMode } from './types';

interface MasterDisplayHeaderProps {
  propertyName?: string;
  propertyCode?: string;
  viewMode: ViewMode;
  onChangeViewMode: (mode: ViewMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  countdown: number;
}

export const MasterDisplayHeader: React.FC<MasterDisplayHeaderProps> = ({
  propertyName,
  propertyCode,
  viewMode,
  onChangeViewMode,
  soundEnabled,
  onToggleSound,
  voiceEnabled,
  onToggleVoice,
  isFullscreen,
  onToggleFullscreen,
  onRefresh,
  isRefreshing,
  countdown,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="px-4 py-2.5 bg-[#090d16] border-b border-slate-800/80 flex items-center justify-between gap-3 shadow-xl">
      {/* Left: Branding & Back Button */}
      <div className="flex items-center gap-3">
        <Link
          href="/hotel"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-xs font-bold shadow-sm"
          title="Back to Hotel Dashboard"
        >
          <ArrowLeft size={16} className="text-indigo-400" />
          <span className="hidden sm:inline">Hotel Dashboard</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Tv size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white tracking-tight uppercase">
                Master Order Display
              </h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
              <Building2 size={11} className="text-indigo-400" />
              <span>{propertyName || 'Hotel & Restaurant'}</span>
              {propertyCode && (
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300 font-bold uppercase">
                  {propertyCode}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Middle: View Mode Switcher */}
      <div className="hidden md:flex items-center bg-[#0e1422] p-1 rounded-2xl border border-slate-800">
        <button
          onClick={() => onChangeViewMode('DUAL_SPLIT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
            viewMode === 'DUAL_SPLIT'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
          title="50/50 Dual Screen: Live Room Orders (Left) + Staff Dispatch Tracker (Right)"
        >
          <Split size={13} />
          <span>50/50 Rooms & Staff Dispatch</span>
        </button>

        <button
          onClick={() => onChangeViewMode('SPLIT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
            viewMode === 'SPLIT'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Split by Departments: Rooms | Restaurant | Bar | Takeaway"
        >
          <Columns size={13} />
          <span>Department Split</span>
        </button>

        <button
          onClick={() => onChangeViewMode('KANBAN')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${viewMode === 'KANBAN'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
            }`}
          title="Pipeline: New -> Preparing -> Ready"
        >
          <Kanban size={13} />
          <span>Workflow Pipeline</span>
        </button>

        <button
          onClick={() => onChangeViewMode('GRID')}
          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${viewMode === 'GRID'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white'
            }`}
          title="Unified Responsive Grid"
        >
          <LayoutGrid size={13} />
          <span>All Cards</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black text-slate-200 tabular-nums">
          <Clock size={13} className="text-indigo-400" />
          <span>{timeStr}</span>
        </div>

        {/* Audio notification toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl border transition ${soundEnabled
              ? 'bg-emerald-950/80 border-emerald-600/40 text-emerald-400'
              : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          title={soundEnabled ? 'Chime sound is active' : 'Sound is muted'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Voice Announcement toggle */}
        <button
          onClick={onToggleVoice}
          className={`p-2 rounded-xl border transition ${voiceEnabled
              ? 'bg-indigo-950/80 border-indigo-600/40 text-indigo-400'
              : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          title={voiceEnabled ? 'Voice callout is active' : 'Voice callout is off'}
        >
          {voiceEnabled ? <Mic size={16} /> : <MicOff size={16} />}
        </button>

        {/* Refresh button with countdown */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-black text-slate-300 flex items-center gap-1.5 transition"
          title="Click to refresh orders immediately"
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin text-indigo-400' : ''} />
          <span className="tabular-nums text-[11px] text-slate-400">{countdown}s</span>
        </button>

        {/* Fullscreen TV Mode */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition active:scale-95"
          title={isFullscreen ? 'Exit Fullscreen' : 'Open Fullscreen TV Mode (F11)'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </header>
  );
};

