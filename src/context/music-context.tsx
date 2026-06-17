'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

export interface Song {
  id?: string;
  youtubeId: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  duration?: string;
}

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady: () => void; }
}

interface MusicContextType {
  playlist: Song[];
  songA: Song | null;
  playA: boolean;
  volA: number;
  pitchA: number;
  readyA: boolean;
  songB: Song | null;
  playB: boolean;
  volB: number;
  pitchB: number;
  readyB: boolean;
  crossfader: number;
  pA: React.MutableRefObject<any>;
  pB: React.MutableRefObject<any>;
  isLoading: boolean;
  savingId: string | null;
  addedIds: Set<string>;
  toast: { msg: string; type: 'success' | 'error' } | null;
  setVolA: (v: number) => void;
  setVolB: (v: number) => void;
  setPitchA: (v: number) => void;
  setPitchB: (v: number) => void;
  setCrossfader: (v: number) => void;
  loadDeck: (d: 'A' | 'B', song: Song) => void;
  loadSmartDeck: (song: Song) => void;
  toggleA: () => void;
  toggleB: () => void;
  skipDeck: (deck: 'A' | 'B', dir: 1 | -1) => void;
  addSong: (song: Song) => Promise<void>;
  removeSong: (song: Song) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [songA, setSongA] = useState<Song | null>(null);
  const [playA, setPlayA] = useState(false);
  const [volA, setVolA] = useState(80);
  const [pitchA, setPitchA] = useState(100);
  const [readyA, setReadyA] = useState(false);

  const [songB, setSongB] = useState<Song | null>(null);
  const [playB, setPlayB] = useState(false);
  const [volB, setVolB] = useState(80);
  const [pitchB, setPitchB] = useState(100);
  const [readyB, setReadyB] = useState(false);

  const [crossfader, setCrossfader] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const pA = useRef<any>(null);
  const pB = useRef<any>(null);
  const plRef = useRef<Song[]>([]);

  // Update plRef.current when playlist changes for use in skipDeck
  useEffect(() => {
    plRef.current = playlist;
  }, [playlist]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Effective volumes calculated from main volume and crossfader
  const effA = Math.round(volA * (1 - crossfader / 100));
  const effB = Math.round(volB * (crossfader / 100));

  useEffect(() => {
    try {
      pA.current?.setVolume(effA);
    } catch {}
  }, [effA]);

  useEffect(() => {
    try {
      pB.current?.setVolume(effB);
    } catch {}
  }, [effB]);

  useEffect(() => {
    try {
      pA.current?.setPlaybackRate(pitchA / 100);
    } catch {}
  }, [pitchA]);

  useEffect(() => {
    try {
      pB.current?.setPlaybackRate(pitchB / 100);
    } catch {}
  }, [pitchB]);

  // Load Playlist from database
  const loadPlaylist = useCallback(async () => {
    setIsLoading(true);
    try {
      const r = await fetch('/api/music/songs');
      const d = await r.json();
      if (d.success) {
        setPlaylist(d.data);
        setAddedIds(new Set(d.data.map((s: Song) => s.youtubeId)));
      }
    } catch {
      showToast('Failed to load playlist', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  // Initialize YouTube Players once
  useEffect(() => {
    const init = () => {
      if (!pA.current) {
        try {
          pA.current = new window.YT.Player('yt-a', {
            height: '1',
            width: '1',
            videoId: '',
            playerVars: { autoplay: 1, controls: 0, rel: 0 },
            events: {
              onReady: (e: any) => {
                setReadyA(true);
                e.target.setVolume(effA);
              },
              onStateChange: (e: any) => {
                if (e.data === 1) setPlayA(true);
                if (e.data === 2 || e.data === 0) setPlayA(false);
              },
            },
          });
        } catch (err) {
          console.error('Error creating YouTube player A', err);
        }
      }
      if (!pB.current) {
        try {
          pB.current = new window.YT.Player('yt-b', {
            height: '1',
            width: '1',
            videoId: '',
            playerVars: { autoplay: 1, controls: 0, rel: 0 },
            events: {
              onReady: (e: any) => {
                setReadyB(true);
                e.target.setVolume(effB);
              },
              onStateChange: (e: any) => {
                if (e.data === 1) setPlayB(true);
                if (e.data === 2 || e.data === 0) setPlayB(false);
              },
            },
          });
        } catch (err) {
          console.error('Error creating YouTube player B', err);
        }
      }
    };

    if (window.YT?.Player) {
      init();
    } else {
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(s);
      }
      const iv = setInterval(() => {
        if (window.YT?.Player) {
          init();
          clearInterval(iv);
        }
      }, 100);
      return () => clearInterval(iv);
    }
  }, [effA, effB]);

  // Load a song to a specific deck
  const loadDeck = useCallback((d: 'A' | 'B', song: Song) => {
    if (d === 'A') {
      setSongA(song);
      try {
        pA.current?.loadVideoById(song.youtubeId);
        pA.current?.setVolume(effA);
        setPlayA(true);
      } catch {}
    } else {
      setSongB(song);
      try {
        pB.current?.loadVideoById(song.youtubeId);
        pB.current?.setVolume(effB);
        setPlayB(true);
      } catch {}
    }
    showToast(`Loaded on Deck ${d}`);
  }, [effA, effB, showToast]);

  const toggleA = useCallback(() => {
    try {
      if (playA) {
        pA.current?.pauseVideo();
        setPlayA(false);
      } else {
        pA.current?.playVideo();
        setPlayA(true);
      }
    } catch {}
  }, [playA]);

  const toggleB = useCallback(() => {
    try {
      if (playB) {
        pB.current?.pauseVideo();
        setPlayB(false);
      } else {
        pB.current?.playVideo();
        setPlayB(true);
      }
    } catch {}
  }, [playB]);

  const skipDeck = useCallback((deck: 'A' | 'B', dir: 1 | -1) => {
    const pl = plRef.current;
    if (!pl.length) return;
    const cur = deck === 'A' ? songA : songB;
    const idx = pl.findIndex(s => s.youtubeId === cur?.youtubeId);
    loadDeck(deck, pl[(idx + dir + pl.length) % pl.length]);
  }, [songA, songB, loadDeck]);

  // Smart routing: pick the free deck automatically
  // Priority: free deck → B if A is playing → A if B is playing → B as fallback
  const loadSmartDeck = useCallback((song: Song) => {
    const aPlaying = playA;
    const bPlaying = playB;
    const aHasSong = !!songA;
    const bHasSong = !!songB;

    let target: 'A' | 'B';
    if (!aHasSong && !bHasSong) {
      target = 'A';               // both empty → A
    } else if (aPlaying && !bHasSong) {
      target = 'B';               // A playing, B empty → B
    } else if (bPlaying && !aHasSong) {
      target = 'A';               // B playing, A empty → A
    } else if (aPlaying && !bPlaying) {
      target = 'B';               // A playing, B paused → B
    } else if (bPlaying && !aPlaying) {
      target = 'A';               // B playing, A paused → A
    } else {
      target = 'B';               // both playing or both paused → B
    }
    loadDeck(target, song);
  }, [playA, playB, songA, songB, loadDeck]);

  const addSong = useCallback(async (song: Song) => {
    if (addedIds.has(song.youtubeId)) return;
    setSavingId(song.youtubeId);
    try {
      const r = await fetch('/api/music/songs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(song)
      });
      const d = await r.json();
      if (d.success) {
        setAddedIds(p => new Set([...p, song.youtubeId]));
        setPlaylist(p => [...p, d.data]);
        showToast('Added to playlist');
      } else {
        showToast(d.message || 'Failed to add song', 'error');
      }
    } catch {
      showToast('Network error adding song', 'error');
    } finally {
      setSavingId(null);
    }
  }, [addedIds, showToast]);

  const removeSong = useCallback(async (song: Song) => {
    if (!song.id) return;
    try {
      await fetch(`/api/music/songs/${song.id}`, { method: 'DELETE' });
      setPlaylist(p => p.filter(s => s.id !== song.id));
      setAddedIds(p => {
        const n = new Set(p);
        n.delete(song.youtubeId);
        return n;
      });
      showToast('Removed from playlist');
    } catch {
      showToast('Failed to remove song', 'error');
    }
  }, [showToast]);

  return (
    <MusicContext.Provider value={{
      playlist, songA, playA, volA, pitchA, readyA,
      songB, playB, volB, pitchB, readyB,
      crossfader, pA, pB, isLoading, savingId, addedIds, toast,
      setVolA, setVolB, setPitchA, setPitchB, setCrossfader,
      loadDeck, loadSmartDeck, toggleA, toggleB, skipDeck, addSong, removeSong, showToast
    }}>
      {children}
      {/* Hidden players rendered globally in this provider */}
      <div style={{ position: 'fixed', left: '-9999px', width: '2px', height: '2px', overflow: 'hidden' }}>
        <div id="yt-a" />
        <div id="yt-b" />
      </div>
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
