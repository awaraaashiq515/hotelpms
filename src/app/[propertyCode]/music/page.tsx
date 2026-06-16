'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music2, Search, Plus, Trash2, Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, ListMusic, Radio, RefreshCw,
  Loader2, AlertCircle, Check, ChevronDown, Zap,
} from 'lucide-react';

interface Song {
  id?: string;
  youtubeId: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  duration?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// ─── DJ Vinyl Disc Component ────────────────────────────────────────────────
function VinylDisc({ song, isPlaying, deck }: { song: Song | null; isPlaying: boolean; deck: 'A' | 'B' }) {
  const colorA = 'from-violet-600 via-purple-800 to-slate-900';
  const colorB = 'from-pink-600 via-rose-800 to-slate-900';
  const glowA = 'shadow-[0_0_40px_8px_rgba(139,92,246,0.5)]';
  const glowB = 'shadow-[0_0_40px_8px_rgba(244,63,94,0.5)]';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* Outer glow ring */}
      <div className={`absolute inset-0 rounded-full opacity-30 ${isPlaying ? (deck === 'A' ? glowA : glowB) : ''} transition-all duration-500`} />
      {/* Spinning vinyl */}
      <div
        className={`w-full h-full rounded-full bg-gradient-to-br ${deck === 'A' ? colorA : colorB} flex items-center justify-center`}
        style={{
          animation: isPlaying ? 'spin 3s linear infinite' : 'none',
          boxShadow: isPlaying
            ? deck === 'A'
              ? '0 0 50px rgba(139,92,246,0.6), 0 0 15px rgba(139,92,246,0.3) inset'
              : '0 0 50px rgba(244,63,94,0.6), 0 0 15px rgba(244,63,94,0.3) inset'
            : '0 4px 24px rgba(0,0,0,0.5)',
          transition: 'box-shadow 0.5s ease',
        }}
      >
        {/* Grooves */}
        {[40, 56, 72, 88].map(size => (
          <div key={size} className="absolute rounded-full border border-white/5" style={{ width: size, height: size }} />
        ))}
        {/* Center hole / album art */}
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 flex items-center justify-center bg-slate-900 shadow-lg z-10">
          {song?.thumbnail ? (
            <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <Music2 size={28} className={deck === 'A' ? 'text-violet-400' : 'text-pink-400'} />
          )}
        </div>
      </div>
      {/* Tonearm */}
      <div
        className="absolute top-1 right-0 origin-top-right"
        style={{
          width: 80,
          height: 4,
          background: 'linear-gradient(to right, #475569, #94a3b8)',
          borderRadius: 2,
          transform: isPlaying ? 'rotate(28deg)' : 'rotate(10deg)',
          transition: 'transform 0.8s ease',
          transformOrigin: '100% 50%',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}
      />
      <div
        className="absolute right-0 top-1 w-3 h-3 rounded-full bg-slate-300 shadow"
        style={{ transform: 'translateX(50%)' }}
      />
    </div>
  );
}

// ─── Vertical Fader Component ───────────────────────────────────────────────
function VerticalFader({ value, onChange, color, label }: { value: number; onChange: (v: number) => void; color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <div className="relative h-28 flex items-center justify-center">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="h-24 cursor-pointer"
          style={{
            writingMode: 'vertical-lr' as any,
            direction: 'rtl',
            appearance: 'slider-vertical' as any,
            accentColor: color,
          }}
        />
      </div>
      <span className="text-[9px] font-black text-slate-500">{value}%</span>
    </div>
  );
}

// ─── Waveform Bars ──────────────────────────────────────────────────────────
function WaveformBars({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  return (
    <div className="flex items-end gap-0.5 h-8">
      {Array.from({ length: 16 }).map((_, i) => (
        <div
          key={i}
          className="rounded-full flex-1"
          style={{
            backgroundColor: color,
            height: isPlaying ? `${20 + Math.random() * 80}%` : '20%',
            animation: isPlaying ? `bounce ${0.4 + (i % 4) * 0.1}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.05}s`,
            opacity: isPlaying ? 0.8 : 0.3,
            transition: 'height 0.1s ease',
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function MusicPage() {
  // Playlist & Search
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'playlist' | 'search'>('search');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [searchError, setSearchError] = useState('');
  const [nextPageToken, setNextPageToken] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Deck A state
  const [songA, setSongA] = useState<Song | null>(null);
  const [isPlayingA, setIsPlayingA] = useState(false);
  const [volumeA, setVolumeA] = useState(80);
  const [currentTimeA, setCurrentTimeA] = useState(0);
  const [durationA, setDurationA] = useState(0);
  const [pitchA, setPitchA] = useState(100); // 50-150 maps to 0.5-1.5 speed
  const [playerReadyA, setPlayerReadyA] = useState(false);

  // Deck B state
  const [songB, setSongB] = useState<Song | null>(null);
  const [isPlayingB, setIsPlayingB] = useState(false);
  const [volumeB, setVolumeB] = useState(80);
  const [currentTimeB, setCurrentTimeB] = useState(0);
  const [durationB, setDurationB] = useState(0);
  const [pitchB, setPitchB] = useState(100);
  const [playerReadyB, setPlayerReadyB] = useState(false);

  // Mixer
  const [crossfader, setCrossfader] = useState(50);

  // Refs
  const playerARef = useRef<any>(null);
  const playerBRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const playlistRef = useRef<Song[]>([]);

  useEffect(() => { playlistRef.current = playlist; }, [playlist]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // ── Compute effective volumes based on crossfader ──────────────────────────
  const effectiveVolumeA = Math.round(volumeA * (1 - crossfader / 100));
  const effectiveVolumeB = Math.round(volumeB * (crossfader / 100));

  useEffect(() => {
    try { playerARef.current?.setVolume(effectiveVolumeA); } catch {}
  }, [effectiveVolumeA]);

  useEffect(() => {
    try { playerBRef.current?.setVolume(effectiveVolumeB); } catch {}
  }, [effectiveVolumeB]);

  // ── Playback rate ──────────────────────────────────────────────────────────
  useEffect(() => {
    try { playerARef.current?.setPlaybackRate(pitchA / 100); } catch {}
  }, [pitchA]);

  useEffect(() => {
    try { playerBRef.current?.setPlaybackRate(pitchB / 100); } catch {}
  }, [pitchB]);

  // ── Time poll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      try {
        if (playerARef.current && isPlayingA) {
          const ct = playerARef.current.getCurrentTime();
          const dur = playerARef.current.getDuration();
          if (typeof ct === 'number') setCurrentTimeA(ct);
          if (typeof dur === 'number') setDurationA(dur);
        }
      } catch {}
    }, 500);
    return () => clearInterval(t);
  }, [isPlayingA]);

  useEffect(() => {
    const t = setInterval(() => {
      try {
        if (playerBRef.current && isPlayingB) {
          const ct = playerBRef.current.getCurrentTime();
          const dur = playerBRef.current.getDuration();
          if (typeof ct === 'number') setCurrentTimeB(ct);
          if (typeof dur === 'number') setDurationB(dur);
        }
      } catch {}
    }, 500);
    return () => clearInterval(t);
  }, [isPlayingB]);

  // ── Load playlist & trending ───────────────────────────────────────────────
  const loadPlaylist = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/music/songs');
      const data = await res.json();
      if (data.success) {
        setPlaylist(data.data);
        setAddedIds(new Set(data.data.map((s: Song) => s.youtubeId)));
      }
    } catch { showToast('Failed to load playlist', 'error'); }
    finally { setIsLoading(false); }
  }, []);

  const loadTrending = useCallback(async () => {
    setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch('/api/music/search');
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
        setNextPageToken(data.nextPageToken || '');
      } else {
        setSearchError(data.message || 'Failed to load trending songs');
      }
    } catch { setSearchError('Failed to load trending songs.'); }
    finally { setIsSearching(false); }
  }, []);

  useEffect(() => { loadPlaylist(); loadTrending(); }, [loadPlaylist, loadTrending]);

  // ── YouTube IFrame API init ────────────────────────────────────────────────
  useEffect(() => {
    const initPlayers = () => {
      if (!playerARef.current) {
        try {
          playerARef.current = new window.YT.Player('yt-player-a', {
            height: '1', width: '1', videoId: '',
            playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0 },
            events: {
              onReady: (e: any) => { setPlayerReadyA(true); e.target.setVolume(effectiveVolumeA); },
              onStateChange: (e: any) => {
                if (e.data === window.YT.PlayerState.PLAYING) setIsPlayingA(true);
                if (e.data === window.YT.PlayerState.PAUSED) setIsPlayingA(false);
                if (e.data === window.YT.PlayerState.ENDED) {
                  setIsPlayingA(false);
                }
              },
            },
          });
        } catch (err) { console.error('Deck A init failed', err); }
      }

      if (!playerBRef.current) {
        try {
          playerBRef.current = new window.YT.Player('yt-player-b', {
            height: '1', width: '1', videoId: '',
            playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0 },
            events: {
              onReady: (e: any) => { setPlayerReadyB(true); e.target.setVolume(effectiveVolumeB); },
              onStateChange: (e: any) => {
                if (e.data === window.YT.PlayerState.PLAYING) setIsPlayingB(true);
                if (e.data === window.YT.PlayerState.PAUSED) setIsPlayingB(false);
                if (e.data === window.YT.PlayerState.ENDED) {
                  setIsPlayingB(false);
                }
              },
            },
          });
        } catch (err) { console.error('Deck B init failed', err); }
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayers();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }
      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          initPlayers();
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Deck controls ─────────────────────────────────────────────────────────
  const loadDeck = (deck: 'A' | 'B', song: Song) => {
    if (deck === 'A') {
      setSongA(song);
      setCurrentTimeA(0);
      setDurationA(0);
      try {
        playerARef.current?.loadVideoById(song.youtubeId);
        playerARef.current?.setVolume(effectiveVolumeA);
        setIsPlayingA(true);
      } catch {}
    } else {
      setSongB(song);
      setCurrentTimeB(0);
      setDurationB(0);
      try {
        playerBRef.current?.loadVideoById(song.youtubeId);
        playerBRef.current?.setVolume(effectiveVolumeB);
        setIsPlayingB(true);
      } catch {}
    }
    showToast(`Loaded on Deck ${deck}: ${song.title.slice(0, 30)}...`);
  };

  const togglePlayA = () => {
    if (!playerARef.current) return;
    try {
      if (isPlayingA) { playerARef.current.pauseVideo(); setIsPlayingA(false); }
      else { playerARef.current.playVideo(); setIsPlayingA(true); }
    } catch {}
  };

  const togglePlayB = () => {
    if (!playerBRef.current) return;
    try {
      if (isPlayingB) { playerBRef.current.pauseVideo(); setIsPlayingB(false); }
      else { playerBRef.current.playVideo(); setIsPlayingB(true); }
    } catch {}
  };

  const seekA = (t: number) => {
    setCurrentTimeA(t);
    try { playerARef.current?.seekTo(t, true); } catch {}
  };

  const seekB = (t: number) => {
    setCurrentTimeB(t);
    try { playerBRef.current?.seekTo(t, true); } catch {}
  };

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setNextPageToken('');
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
        setNextPageToken(data.nextPageToken || '');
        setActiveTab('search');
      } else {
        setSearchError(data.message || 'Search failed');
      }
    } catch {
      setSearchError('Failed to search. Check YouTube API key in settings.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    if (!nextPageToken || isSearching) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}&pageToken=${nextPageToken}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(prev => [...prev, ...data.data]);
        setNextPageToken(data.nextPageToken || '');
      }
    } catch {} finally { setIsSearching(false); }
  };

  const addToPlaylist = async (song: Song) => {
    if (addedIds.has(song.youtubeId)) return;
    setSavingId(song.youtubeId);
    try {
      const res = await fetch('/api/music/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(song),
      });
      const data = await res.json();
      if (data.success) {
        setAddedIds(prev => new Set([...prev, song.youtubeId]));
        setPlaylist(prev => [...prev, data.data]);
        showToast(`Added: ${song.title.slice(0, 30)}...`);
      } else {
        showToast(data.message || 'Failed to add', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setSavingId(null); }
  };

  const removeFromPlaylist = async (song: Song) => {
    if (!song.id) return;
    try {
      await fetch(`/api/music/songs/${song.id}`, { method: 'DELETE' });
      setPlaylist(prev => prev.filter(s => s.id !== song.id));
      setAddedIds(prev => { const n = new Set(prev); n.delete(song.youtubeId); return n; });
      showToast('Removed from playlist');
    } catch { showToast('Failed to remove', 'error'); }
  };

  // ── Deck Panel ─────────────────────────────────────────────────────────────
  const DeckPanel = ({
    deck, song, isPlaying, volume, setVolume, currentTime, duration,
    pitch, setPitch, playerReady, onPlayPause, onSeek, onSkip,
  }: {
    deck: 'A' | 'B';
    song: Song | null;
    isPlaying: boolean;
    volume: number;
    setVolume: (v: number) => void;
    currentTime: number;
    duration: number;
    pitch: number;
    setPitch: (v: number) => void;
    playerReady: boolean;
    onPlayPause: () => void;
    onSeek: (t: number) => void;
    onSkip: () => void;
  }) => {
    const isA = deck === 'A';
    const accentColor = isA ? '#8b5cf6' : '#f43f5e';
    const accentBg = isA ? 'bg-violet-600 hover:bg-violet-500' : 'bg-rose-600 hover:bg-rose-500';
    const accentText = isA ? 'text-violet-400' : 'text-pink-400';
    const accentBorder = isA ? 'border-violet-500/40' : 'border-rose-500/40';
    const accentGlow = isA ? 'shadow-violet-500/30' : 'shadow-rose-500/30';

    return (
      <div className={`flex flex-col gap-3 bg-slate-900 border ${accentBorder} rounded-3xl p-4 shadow-2xl ${isPlaying ? `shadow-lg ${accentGlow}` : ''} transition-all duration-500`}>
        {/* Deck Label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-xl ${isA ? 'bg-violet-600' : 'bg-rose-600'} flex items-center justify-center shadow-lg`}>
              <span className="text-white font-black text-xs">{deck}</span>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${accentText}`}>Deck {deck}</span>
          </div>
          <div className={`flex gap-0.5 items-end h-4 ${isPlaying ? 'opacity-100' : 'opacity-20'}`}>
            {[1, 2, 3, 4, 5].map(i => (
              <span key={i} className="w-0.5 rounded-full" style={{
                backgroundColor: accentColor,
                height: `${8 + i * 3}px`,
                animation: isPlaying ? `bounce ${0.3 + i * 0.08}s ease-in-out infinite alternate` : 'none',
              }} />
            ))}
          </div>
        </div>

        {/* Vinyl */}
        <div className="flex justify-center">
          <VinylDisc song={song} isPlaying={isPlaying} deck={deck} />
        </div>

        {/* Song Info */}
        <div className="text-center min-h-[44px]">
          <p className="text-white font-black text-xs leading-tight line-clamp-2 mb-0.5">
            {song?.title || <span className="text-slate-600 italic">No track loaded</span>}
          </p>
          <p className={`text-[10px] font-bold ${accentText} uppercase tracking-wider line-clamp-1`}>
            {song?.artist || (song ? 'YouTube' : 'Load a track →')}
          </p>
        </div>

        {/* Seek Bar */}
        <div className="space-y-1">
          <input
            type="range" min={0} max={duration || 100} value={currentTime}
            onChange={e => onSeek(Number(e.target.value))}
            disabled={!song}
            className="w-full h-1 cursor-pointer"
            style={{ accentColor }}
          />
          <div className="flex justify-between text-[9px] text-slate-500 font-bold">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Waveform */}
        <WaveformBars isPlaying={isPlaying} color={accentColor} />

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              const pl = playlistRef.current;
              if (!song || pl.length === 0) return;
              const idx = pl.findIndex(s => s.youtubeId === song?.youtubeId);
              const prev = pl[(idx - 1 + pl.length) % pl.length];
              if (prev) loadDeck(deck, prev);
            }}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-all active:scale-90"
          >
            <SkipBack size={16} fill="currentColor" />
          </button>
          <button
            onClick={onPlayPause}
            disabled={!playerReady || !song}
            className={`w-14 h-14 rounded-full ${accentBg} flex items-center justify-center text-white shadow-lg transition-all active:scale-90 disabled:opacity-30`}
            style={{ boxShadow: isPlaying ? `0 0 20px ${accentColor}60` : undefined }}
          >
            {isPlaying ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" className="ml-0.5" />}
          </button>
          <button
            onClick={onSkip}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-all active:scale-90"
          >
            <SkipForward size={16} fill="currentColor" />
          </button>
        </div>

        {/* Volume & Pitch */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex items-center gap-1.5 flex-1">
            <Volume2 size={12} className="text-slate-500 flex-shrink-0" />
            <input
              type="range" min={0} max={100} value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="flex-1 h-1 cursor-pointer"
              style={{ accentColor }}
            />
          </div>
          <div className="flex items-center gap-1.5 flex-1">
            <Zap size={12} className="text-slate-500 flex-shrink-0" />
            <input
              type="range" min={50} max={150} value={pitch}
              onChange={e => setPitch(Number(e.target.value))}
              className="flex-1 h-1 cursor-pointer"
              style={{ accentColor }}
            />
            <span className="text-[9px] text-slate-500 font-bold w-7 text-right">{(pitch / 100).toFixed(1)}x</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-96px)] lg:h-[calc(100vh-140px)] flex flex-col gap-3 overflow-hidden">

      {/* Hidden YT players */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '2px', height: '2px', overflow: 'hidden' }}>
        <div id="yt-player-a" />
        <div id="yt-player-b" />
      </div>

      {/* CSS for spin and bounce */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes bounce { from { transform: scaleY(0.6); } to { transform: scaleY(1); } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white text-xs font-bold animate-in slide-in-from-top-3 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 via-purple-700 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Music2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
              <span>Virtual DJ</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-black uppercase tracking-widest">Mixer Console</span>
              {(isPlayingA || isPlayingB) && (
                <span className="flex gap-0.5 items-end h-4">
                  {[1, 2, 3].map(i => (
                    <span key={i} className="w-1 bg-violet-500 rounded-full animate-bounce" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
                  ))}
                </span>
              )}
            </h1>
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Dual Deck · Crossfader · Pitch Control</p>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex gap-3 min-h-0 overflow-hidden">

        {/* ─── LEFT SIDEBAR ────────────────────────────────────────────── */}
        <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col gap-2 min-h-0">

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-shrink-0">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search YouTube for tracks..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-3 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-all active:scale-[0.98] shadow-md"
            >
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            </button>
          </form>

          {/* Tabs */}
          <div className="flex gap-1 flex-shrink-0 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-2xl">
            {([['playlist', ListMusic, `Playlist (${playlist.length})`], ['search', Radio, searchQuery.trim() ? 'Results' : 'Trending']] as const).map(([tab, Icon, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>

          {/* Song List */}
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 space-y-1.5">

            {/* Playlist Tab */}
            {activeTab === 'playlist' && (
              <>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32 gap-2 text-purple-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Loading...</span>
                  </div>
                ) : playlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-500">
                    <Music2 size={24} className="text-slate-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Empty playlist</p>
                    <button onClick={() => setActiveTab('search')} className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Browse Trending →</button>
                  </div>
                ) : playlist.map(song => (
                  <DJSongRow
                    key={song.id}
                    song={song}
                    isOnDeckA={songA?.youtubeId === song.youtubeId}
                    isOnDeckB={songB?.youtubeId === song.youtubeId}
                    isPlayingA={isPlayingA && songA?.youtubeId === song.youtubeId}
                    isPlayingB={isPlayingB && songB?.youtubeId === song.youtubeId}
                    inPlaylist
                    onLoadA={() => loadDeck('A', song)}
                    onLoadB={() => loadDeck('B', song)}
                    onRemove={() => removeFromPlaylist(song)}
                    onAdd={async () => {}}
                    isAdded
                    isSaving={false}
                  />
                ))}
              </>
            )}

            {/* Search/Trending Tab */}
            {activeTab === 'search' && (
              <>
                {searchError && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">
                    <AlertCircle size={14} />
                    {searchError}
                  </div>
                )}
                {!searchError && searchResults.length === 0 && !isSearching && (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-500">
                    <Radio size={24} className="text-slate-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Search for tracks</p>
                  </div>
                )}
                {isSearching && searchResults.length === 0 && (
                  <div className="flex items-center justify-center h-32 gap-2 text-purple-400">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Searching...</span>
                  </div>
                )}
                {searchResults.map((song, idx) => (
                  <DJSongRow
                    key={`${song.youtubeId}-${idx}`}
                    song={song}
                    isOnDeckA={songA?.youtubeId === song.youtubeId}
                    isOnDeckB={songB?.youtubeId === song.youtubeId}
                    isPlayingA={isPlayingA && songA?.youtubeId === song.youtubeId}
                    isPlayingB={isPlayingB && songB?.youtubeId === song.youtubeId}
                    inPlaylist={false}
                    onLoadA={() => loadDeck('A', song)}
                    onLoadB={() => loadDeck('B', song)}
                    onAdd={() => addToPlaylist(song)}
                    onRemove={() => {}}
                    isAdded={addedIds.has(song.youtubeId)}
                    isSaving={savingId === song.youtubeId}
                  />
                ))}
                {nextPageToken && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isSearching}
                    className="w-full py-2.5 rounded-2xl border border-gray-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    {isSearching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Load More
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ─── DJ CONSOLE ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto no-scrollbar">
          {/* Decks Row */}
          <div className="flex gap-3 flex-1">
            {/* Deck A */}
            <div className="flex-1">
              <DeckPanel
                deck="A"
                song={songA}
                isPlaying={isPlayingA}
                volume={volumeA}
                setVolume={setVolumeA}
                currentTime={currentTimeA}
                duration={durationA}
                pitch={pitchA}
                setPitch={setPitchA}
                playerReady={playerReadyA}
                onPlayPause={togglePlayA}
                onSeek={seekA}
                onSkip={() => {
                  const pl = playlistRef.current;
                  if (!songA || pl.length === 0) return;
                  const idx = pl.findIndex(s => s.youtubeId === songA.youtubeId);
                  const next = pl[(idx + 1) % pl.length];
                  if (next) loadDeck('A', next);
                }}
              />
            </div>

            {/* CENTER MIXER */}
            <div className="w-36 flex-shrink-0 flex flex-col items-center justify-between bg-slate-900 border border-slate-700/60 rounded-3xl p-3 shadow-2xl gap-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Mixer</p>

              {/* EQ-style channel faders */}
              <div className="flex items-end gap-4 h-28 w-full justify-center">
                <VerticalFader value={volumeA} onChange={setVolumeA} color="#8b5cf6" label="A" />
                <VerticalFader value={volumeB} onChange={setVolumeB} color="#f43f5e" label="B" />
              </div>

              {/* BPM / Sync buttons */}
              <div className="flex gap-1 w-full">
                <button
                  onClick={() => { setPitchA(100); }}
                  className="flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg bg-violet-900/40 text-violet-400 hover:bg-violet-800/40 transition-all border border-violet-700/30"
                >
                  Reset A
                </button>
                <button
                  onClick={() => { setPitchB(100); }}
                  className="flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg bg-rose-900/40 text-rose-400 hover:bg-rose-800/40 transition-all border border-rose-700/30"
                >
                  Reset B
                </button>
              </div>

              {/* CUE / Sync row */}
              <button
                onClick={() => {
                  setCrossfader(50);
                  showToast('Crossfader centered');
                }}
                className="w-full py-1.5 text-[8px] font-black uppercase tracking-widest rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all border border-slate-700"
              >
                ⊙ Center X-Fader
              </button>

              {/* Crossfader Label & Indicators */}
              <div className="w-full">
                <div className="flex justify-between text-[8px] font-black mb-1">
                  <span className="text-violet-400">A</span>
                  <span className="text-slate-500 uppercase tracking-widest">X-Fader</span>
                  <span className="text-rose-400">B</span>
                </div>
                <input
                  type="range" min={0} max={100} value={crossfader}
                  onChange={e => setCrossfader(Number(e.target.value))}
                  className="w-full h-2 cursor-pointer"
                  style={{
                    accentColor: `hsl(${270 - crossfader * 1.5}, 70%, 60%)`,
                  }}
                />
                <div className="flex justify-between text-[8px] mt-1 font-black">
                  <span className="text-violet-500">{100 - crossfader}%</span>
                  <span className="text-rose-500">{crossfader}%</span>
                </div>
              </div>
            </div>

            {/* Deck B */}
            <div className="flex-1">
              <DeckPanel
                deck="B"
                song={songB}
                isPlaying={isPlayingB}
                volume={volumeB}
                setVolume={setVolumeB}
                currentTime={currentTimeB}
                duration={durationB}
                pitch={pitchB}
                setPitch={setPitchB}
                playerReady={playerReadyB}
                onPlayPause={togglePlayB}
                onSeek={seekB}
                onSkip={() => {
                  const pl = playlistRef.current;
                  if (!songB || pl.length === 0) return;
                  const idx = pl.findIndex(s => s.youtubeId === songB.youtubeId);
                  const next = pl[(idx + 1) % pl.length];
                  if (next) loadDeck('B', next);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DJ Song Row ──────────────────────────────────────────────────────────────
function DJSongRow({
  song, isOnDeckA, isOnDeckB, isPlayingA, isPlayingB,
  inPlaylist, onLoadA, onLoadB, onAdd, onRemove, isAdded, isSaving,
}: {
  song: Song;
  isOnDeckA: boolean;
  isOnDeckB: boolean;
  isPlayingA: boolean;
  isPlayingB: boolean;
  inPlaylist: boolean;
  onLoadA: () => void;
  onLoadB: () => void;
  onAdd: () => void;
  onRemove: () => void;
  isAdded: boolean;
  isSaving: boolean;
}) {
  const isActive = isOnDeckA || isOnDeckB;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-2xl transition-all group ${
      isActive
        ? 'bg-gradient-to-r from-violet-950/40 to-rose-950/30 border border-violet-700/30'
        : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-purple-300/40 dark:hover:border-purple-800/30'
    }`}>
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative bg-slate-800">
        {song.thumbnail ? (
          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={14} className="text-slate-500" />
          </div>
        )}
        {isActive && (
          <div className={`absolute inset-0 flex items-center justify-center ${isOnDeckA ? 'bg-violet-900/70' : 'bg-rose-900/70'}`}>
            {(isPlayingA || isPlayingB) ? (
              <span className="flex gap-0.5 items-end h-3">
                {[1, 2, 3].map(i => (
                  <span key={i} className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: `${4 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </span>
            ) : (
              <span className="text-white font-black text-[8px]">{isOnDeckA ? 'A' : 'B'}</span>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-[10px] font-black leading-tight line-clamp-1 ${isActive ? (isOnDeckA ? 'text-violet-300' : 'text-rose-300') : 'text-gray-900 dark:text-white'}`}>
          {song.title}
        </p>
        <p className="text-[9px] text-gray-400 dark:text-slate-500 font-bold mt-0.5 line-clamp-1">{song.artist || 'YouTube'}</p>
      </div>

      {/* Load A / B Buttons */}
      <div className="flex flex-col gap-1">
        <button
          onClick={e => { e.stopPropagation(); onLoadA(); }}
          title="Load on Deck A"
          className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-90 ${
            isOnDeckA
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/40'
              : 'bg-violet-900/30 text-violet-400 hover:bg-violet-800/40 border border-violet-700/30'
          }`}
        >
          A
        </button>
        <button
          onClick={e => { e.stopPropagation(); onLoadB(); }}
          title="Load on Deck B"
          className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all active:scale-90 ${
            isOnDeckB
              ? 'bg-rose-600 text-white shadow-md shadow-rose-500/40'
              : 'bg-rose-900/30 text-rose-400 hover:bg-rose-800/40 border border-rose-700/30'
          }`}
        >
          B
        </button>
      </div>

      {/* Add / Remove */}
      {inPlaylist ? (
        <button
          onClick={e => { e.stopPropagation(); onRemove(); }}
          className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex-shrink-0"
        >
          <Trash2 size={10} />
        </button>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); onAdd(); }}
          disabled={isAdded || isSaving}
          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
            isAdded
              ? 'bg-emerald-900/20 text-emerald-400'
              : 'bg-purple-900/20 text-purple-400 hover:bg-purple-900/40 active:scale-90'
          }`}
        >
          {isSaving ? <Loader2 size={10} className="animate-spin" /> : isAdded ? <Check size={10} /> : <Plus size={10} />}
        </button>
      )}
    </div>
  );
}
