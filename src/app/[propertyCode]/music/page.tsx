'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music2, Search, Plus, Trash2, Play, Pause, SkipForward, SkipBack,
  Volume2, VolumeX, ListMusic, Disc3, Radio, RefreshCw, Settings,
  ChevronRight, Loader2, AlertCircle, X, Check,
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

export default function MusicPage() {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'playlist' | 'search'>('playlist');
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [apiError, setApiError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [nextPageToken, setNextPageToken] = useState('');
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const handleNextRef = useRef<() => void>(() => {});
  const playlistRef = useRef<Song[]>([]);
  const currentSongIndexRef = useRef<number>(-1);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentSongIndexRef.current = currentSongIndex;
  }, [currentSongIndex]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load playlist from DB
  const loadPlaylist = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/music/songs');
      const data = await res.json();
      if (data.success) {
        setPlaylist(data.data);
        setAddedIds(new Set(data.data.map((s: Song) => s.youtubeId)));
        if (data.data.length === 0) {
          setActiveTab('search');
        }
      }
    } catch {
      showToast('Failed to load playlist', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load default trending songs
  const loadDefaultSearch = useCallback(async () => {
    setIsSearching(true);
    setSearchError('');
    try {
      const res = await fetch('/api/music/search');
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
        setNextPageToken(data.nextPageToken || '');
      } else {
        setSearchError(data.message || 'Failed to load popular songs');
      }
    } catch {
      setSearchError('Failed to load popular songs.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylist();
    loadDefaultSearch();
  }, [loadPlaylist, loadDefaultSearch]);

  // Load YouTube IFrame API & Initialize Player with robust loading
  useEffect(() => {
    const initPlayer = () => {
      if (!playerContainerRef.current || playerRef.current) return;
      try {
        playerRef.current = new window.YT.Player('yt-player', {
          height: '200',
          width: '200',
          videoId: '',
          playerVars: { autoplay: 1, controls: 0, modestbranding: 1, rel: 0 },
          events: {
            onReady: (e: any) => {
              setPlayerReady(true);
              e.target.setVolume(85);
            },
            onStateChange: (e: any) => {
              if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
              if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
              if (e.data === window.YT.PlayerState.ENDED) handleNextRef.current();
            },
            onError: (err: any) => {
              console.error('YT Player Error:', err);
              // Auto-advance if video fails to load/play
              handleNextRef.current();
            },
          },
        });
      } catch (err) {
        console.error('Failed to init YT player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
      }

      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          initPlayer();
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const playSong = (index: number) => {
    const list = playlistRef.current;
    if (!playerRef.current || index < 0 || index >= list.length) return;
    const song = list[index];
    setCurrentSongIndex(index);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
    try {
      playerRef.current.loadVideoById(song.youtubeId);
      if (isMuted) playerRef.current.mute();
      else playerRef.current.unMute();
      playerRef.current.playVideo(); // Force play
    } catch {}
  };

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    try {
      if (isPlaying) { playerRef.current.pauseVideo(); setIsPlaying(false); }
      else {
        const list = playlistRef.current;
        const idx = currentSongIndexRef.current;
        if (idx === -1 && list.length > 0) playSong(0);
        else { playerRef.current.playVideo(); setIsPlaying(true); }
      }
    } catch {}
  };

  const handleNext = () => {
    const list = playlistRef.current;
    const idx = currentSongIndexRef.current;
    if (list.length === 0) return;
    const next = idx < list.length - 1 ? idx + 1 : 0;
    playSong(next);
  };

  const handlePrev = () => {
    const list = playlistRef.current;
    const idx = currentSongIndexRef.current;
    if (list.length === 0) return;
    const prev = idx > 0 ? idx - 1 : list.length - 1;
    playSong(prev);
  };

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  // Update playback time and duration
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && playerReady && playerRef.current) {
      timer = setInterval(() => {
        try {
          const current = playerRef.current.getCurrentTime();
          const dur = playerRef.current.getDuration();
          if (typeof current === 'number') setCurrentTime(current);
          if (typeof dur === 'number') setDuration(dur);
        } catch {}
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playerReady]);

  const handleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) { playerRef.current.unMute(); setIsMuted(false); }
      else { playerRef.current.mute(); setIsMuted(true); }
    } catch {}
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    try { playerRef.current?.setVolume(v); } catch {}
  };

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
      setSearchError('Failed to search. Check your YouTube API key in Settings.');
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
        showToast(`"${song.title.slice(0, 30)}..." added to playlist`);
      } else {
        showToast(data.message || 'Failed to add', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const playSearchSong = async (song: Song) => {
    const list = playlistRef.current;
    const existingIndex = list.findIndex(s => s.youtubeId === song.youtubeId);
    if (existingIndex !== -1) {
      playSong(existingIndex);
      return;
    }

    const newSongIndex = list.length;
    const tempSong = { ...song, id: `temp-${Date.now()}` };
    
    playlistRef.current = [...list, tempSong];
    setPlaylist(prev => [...prev, tempSong]);
    setAddedIds(prev => new Set([...prev, song.youtubeId]));

    playSong(newSongIndex);

    try {
      const res = await fetch('/api/music/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(song),
      });
      const data = await res.json();
      if (data.success) {
        setPlaylist(prev => prev.map(s => s.youtubeId === song.youtubeId ? data.data : s));
        showToast(`"${song.title.slice(0, 30)}..." added to playlist`);
      }
    } catch {
      showToast('Failed to save song', 'error');
    }
  };

  const removeFromPlaylist = async (song: Song) => {
    if (!song.id) return;
    try {
      await fetch(`/api/music/songs/${song.id}`, { method: 'DELETE' });
      setPlaylist(prev => prev.filter(s => s.id !== song.id));
      setAddedIds(prev => { const n = new Set(prev); n.delete(song.youtubeId); return n; });
      if (currentSongIndex >= playlist.length - 1) setCurrentSongIndex(prev => Math.max(0, prev - 1));
      showToast('Removed from playlist');
    } catch {
      showToast('Failed to remove', 'error');
    }
  };

  const currentSong = currentSongIndex >= 0 ? playlist[currentSongIndex] : null;

  return (
    <div className="h-[calc(100vh-96px)] lg:h-[calc(100vh-140px)] flex flex-col gap-4 overflow-hidden">
      {/* Hidden YouTube Player (off-screen, with normal size to bypass blockages) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '200px', height: '200px', overflow: 'hidden' }} ref={playerContainerRef}>
        <div id="yt-player" />
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-white text-xs font-bold animate-in slide-in-from-top-3 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <Music2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
            <span>Music Player</span>
            {isPlaying && (
              <span className="flex gap-0.5 items-end h-4">
                {[1,2,3].map(i => (
                  <span key={i} className="w-1 bg-purple-500 rounded-full animate-bounce" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </span>
            )}
          </h1>
          <p className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
            YouTube Music — embedded inside POS
          </p>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">

        {/* LEFT — Now Playing + Controls */}
        <div className="w-72 xl:w-80 flex-shrink-0 flex flex-col gap-3">

          {/* Now Playing Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border border-purple-900/40 shadow-2xl p-5 flex-shrink-0">
            {/* Blurred BG thumbnail */}
            {currentSong?.thumbnail && (
              <div className="absolute inset-0 opacity-20">
                <img src={currentSong.thumbnail} alt="" className="w-full h-full object-cover blur-xl scale-110" />
              </div>
            )}
            <div className="relative z-10">
              {/* Album Art */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-purple-900/40 flex items-center justify-center shadow-xl">
                {currentSong?.thumbnail ? (
                  <img src={currentSong.thumbnail} alt={currentSong.title} className="w-full h-full object-cover" />
                ) : (
                  <Disc3 size={56} className={`text-purple-400/60 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                )}
              </div>

              {/* Song Info */}
              <div className="mb-4">
                <p className="text-white font-black text-sm leading-tight line-clamp-2 mb-1">
                  {currentSong?.title || 'No song selected'}
                </p>
                <p className="text-purple-300/70 text-[10px] font-bold uppercase tracking-wider line-clamp-1">
                  {currentSong?.artist || 'Select a song from your playlist'}
                </p>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2 mb-4">
                <button onClick={handleMute} className="text-purple-300/60 hover:text-white transition-colors">
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <input
                  type="range" min="0" max="100" value={isMuted ? 0 : volume}
                  onChange={e => handleVolume(Number(e.target.value))}
                  className="flex-1 h-1 accent-purple-500 cursor-pointer"
                />
                <span className="text-[9px] text-purple-300/50 font-bold w-6">{isMuted ? 0 : volume}%</span>
              </div>

              {/* Seek / Progress Bar */}
              <div className="flex flex-col gap-1 mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={e => {
                    const time = Number(e.target.value);
                    setCurrentTime(time);
                    try {
                      playerRef.current?.seekTo(time, true);
                    } catch {}
                  }}
                  className="w-full h-1 accent-purple-500 cursor-pointer"
                  disabled={playlist.length === 0}
                />
                <div className="flex justify-between text-[9px] text-purple-300/50 font-bold">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handlePrev}
                  disabled={playlist.length === 0}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40"
                >
                  <SkipBack size={18} fill="currentColor" />
                </button>
                <button
                  onClick={handlePlayPause}
                  disabled={playlist.length === 0 || !playerReady}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/40 transition-all active:scale-95 disabled:opacity-40"
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <button
                  onClick={handleNext}
                  disabled={playlist.length === 0}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-95 disabled:opacity-40"
                >
                  <SkipForward size={18} fill="currentColor" />
                </button>
              </div>
            </div>
          </div>

          {/* Playlist Count */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <ListMusic size={16} className="text-purple-500" />
            <div>
              <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wide">{playlist.length} Songs in Playlist</p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">Click a song to play</p>
            </div>
          </div>
        </div>

        {/* RIGHT — Search + Playlist */}
        <div className="flex-1 flex flex-col min-h-0 gap-3">

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 flex-shrink-0">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search YouTube for songs..."
                className="w-full pl-9 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-black text-[10px] uppercase tracking-widest disabled:opacity-50 hover:opacity-90 transition-all active:scale-[0.98] shadow-md shadow-purple-500/20 flex items-center gap-2"
            >
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </form>

          {/* Tabs */}
          <div className="flex gap-1 flex-shrink-0 bg-gray-100 dark:bg-slate-800/50 p-1 rounded-2xl w-fit">
            {([['playlist', ListMusic, 'My Playlist'], ['search', Radio, searchQuery.trim() ? 'Search Results' : 'Trending Songs']] as const).map(([tab, Icon, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                <Icon size={12} />
                {label}
                {tab === 'playlist' && playlist.length > 0 && (
                  <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 px-1.5 py-0.5 rounded-full text-[8px] font-black">{playlist.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 space-y-2 pr-1">

            {/* ── Playlist Tab ── */}
            {activeTab === 'playlist' && (
              <>
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 size={28} className="animate-spin text-purple-500" />
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading playlist...</p>
                  </div>
                ) : playlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
                    <div className="w-16 h-16 rounded-3xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                      <Music2 size={28} className="text-purple-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-gray-900 dark:text-white uppercase">Playlist is empty</p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">Search for songs and add them here</p>
                    </div>
                    <button
                      onClick={() => { setActiveTab('search'); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                      className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                      <Search size={12} /> Search Songs
                    </button>
                  </div>
                ) : (
                  playlist.map((song, idx) => (
                    <PlaylistSongRow
                      key={song.id}
                      song={song}
                      isActive={currentSongIndex === idx}
                      isPlaying={isPlaying && currentSongIndex === idx}
                      onPlay={() => playSong(idx)}
                      onRemove={() => removeFromPlaylist(song)}
                    />
                  ))
                )}
              </>
            )}

            {/* ── Search Tab ── */}
            {activeTab === 'search' && (
              <>
                {searchError && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">
                    <AlertCircle size={16} />
                    {searchError}
                  </div>
                )}
                {!searchError && searchResults.length === 0 && !isSearching && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
                    <Radio size={32} className="text-gray-300 dark:text-slate-600" />
                    <p className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider">Search YouTube for songs to add</p>
                  </div>
                )}
                {searchResults.map((song, idx) => {
                  const isCurrent = currentSong?.youtubeId === song.youtubeId;
                  return (
                    <SearchSongRow
                      key={`${song.youtubeId}-${idx}`}
                      song={song}
                      isAdded={addedIds.has(song.youtubeId)}
                      isSaving={savingId === song.youtubeId}
                      isActive={isCurrent}
                      isPlaying={isPlaying && isCurrent}
                      onAdd={() => addToPlaylist(song)}
                      onPlay={() => playSearchSong(song)}
                    />
                  );
                })}
                {nextPageToken && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isSearching}
                    className="w-full py-3 rounded-2xl border border-gray-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    {isSearching ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Load More Results
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Playlist Song Row ──────────────────────────────────────────────────────────
function PlaylistSongRow({ song, isActive, isPlaying, onPlay, onRemove }: {
  song: Song; isActive: boolean; isPlaying: boolean; onPlay: () => void; onRemove: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all group cursor-pointer ${
      isActive
        ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200/60 dark:border-purple-800/40'
        : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800/40'
    }`} onClick={onPlay}>
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-800 relative">
        {song.thumbnail ? (
          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={16} className="text-gray-400" />
          </div>
        )}
        {isActive && (
          <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center">
            {isPlaying ? (
              <span className="flex gap-0.5 items-end h-3">
                {[1,2,3].map(i => (
                  <span key={i} className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: `${4 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </span>
            ) : (
              <Play size={12} className="text-white fill-white" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-black leading-tight line-clamp-1 ${isActive ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
          {song.title}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-0.5 line-clamp-1">{song.artist || 'YouTube'}</p>
      </div>

      {/* Remove */}
      <button
        onClick={e => { e.stopPropagation(); onRemove(); }}
        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex-shrink-0"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}

// ── Search Song Row ────────────────────────────────────────────────────────────
function SearchSongRow({ song, isAdded, isSaving, isActive, isPlaying, onAdd, onPlay }: {
  song: Song; isAdded: boolean; isSaving: boolean; isActive: boolean; isPlaying: boolean; onAdd: () => void; onPlay: () => void;
}) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl transition-all group cursor-pointer ${
      isActive
        ? 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border border-purple-200/60 dark:border-purple-800/40'
        : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800/40'
    }`} onClick={onPlay}>
      {/* Thumbnail */}
      <div className="w-14 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-800 relative">
        {song.thumbnail ? (
          <img src={song.thumbnail} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 size={14} className="text-gray-400" />
          </div>
        )}
        {isActive && (
          <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center">
            {isPlaying ? (
              <span className="flex gap-0.5 items-end h-3">
                {[1,2,3].map(i => (
                  <span key={i} className="w-0.5 bg-white rounded-full animate-bounce" style={{ height: `${4 + i * 3}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </span>
            ) : (
              <Play size={12} className="text-white fill-white" />
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-black leading-tight line-clamp-1 ${isActive ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
          {song.title}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-0.5 line-clamp-1">{song.artist || 'YouTube'}</p>
      </div>

      {/* Add Button */}
      <button
        onClick={e => { e.stopPropagation(); onAdd(); }}
        disabled={isAdded || isSaving}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
          isAdded
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 cursor-default'
            : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 active:scale-95'
        }`}
      >
        {isSaving ? <Loader2 size={11} className="animate-spin" /> : isAdded ? <Check size={11} /> : <Plus size={11} />}
        {isAdded ? 'Added' : 'Add'}
      </button>
    </div>
  );
}
