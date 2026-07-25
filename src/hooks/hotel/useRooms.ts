'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Room, RoomFilter } from '@/types/hotel/room.types';

interface UseRoomsReturn {
  rooms: Room[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateRoomStatus: (id: string, updates: Partial<Room>) => Promise<boolean>;
}

export function useRooms(filter?: RoomFilter): UseRoomsReturn {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter?.status && filter.status !== 'ALL') params.set('status', filter.status);
      if (filter?.floor) params.set('floor', filter.floor);

      const res = await fetch(`/api/hotel/rooms?${params}`);
      const json = await res.json();
      if (json.success) setRooms(json.data ?? []);
      else setError(json.message || 'Failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter?.status, filter?.floor]);

  useEffect(() => { refresh(); }, [refresh]);

  const updateRoomStatus = useCallback(async (id: string, updates: Partial<Room>): Promise<boolean> => {
    try {
      const res = await fetch('/api/hotel/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const json = await res.json();
      if (json.success) { refresh(); return true; }
      return false;
    } catch { return false; }
  }, [refresh]);

  return { rooms, loading, error, refresh, updateRoomStatus };
}
