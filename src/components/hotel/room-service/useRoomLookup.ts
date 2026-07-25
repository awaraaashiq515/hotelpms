// ── useRoomLookup — Room search & guest info ───────────────────────────────────
'use client';

import { useState, useCallback } from 'react';
import type { RoomInfo } from './types';

export type { RoomInfo };
export type LookupState = 'idle' | 'loading' | 'found' | 'error';

export function useRoomLookup() {
  const [roomNumber, setRoomNumber] = useState('');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [state, setState] = useState<LookupState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const lookup = useCallback(async (num?: string) => {
    const target = num ?? roomNumber;
    if (!target.trim()) return;

    setState('loading');
    setErrorMsg('');
    setRoomInfo(null);

    try {
      const res = await fetch(
        `/api/hotel/post-to-room?roomNumber=${encodeURIComponent(target.trim())}`
      ).then(r => r.json());

      if (res.success && res.data) {
        setRoomInfo(res.data);
        setState('found');
      } else {
        setErrorMsg(res.error || 'Room not found or not occupied');
        setState('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setState('error');
    }
  }, [roomNumber]);

  const clear = useCallback(() => {
    setRoomNumber('');
    setRoomInfo(null);
    setState('idle');
    setErrorMsg('');
  }, []);

  return { roomNumber, setRoomNumber, roomInfo, state, errorMsg, lookup, clear };
}
