'use client';
import { useState, useEffect, useCallback } from 'react';
import type { HousekeepingTask, HousekeepingStats } from '@/types/hotel/housekeeping.types';

interface UseHousekeepingReturn {
  tasks: HousekeepingTask[];
  stats: HousekeepingStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  updateTask: (id: string, updates: Partial<HousekeepingTask>) => Promise<boolean>;
}

export function useHousekeeping(): UseHousekeepingReturn {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [stats, setStats] = useState<HousekeepingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/housekeeping');
      const json = await res.json();
      if (json.success) {
        setTasks(json.data?.tasks ?? []);
        setStats(json.data?.stats ?? null);
      } else {
        setError(json.message || 'Failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const updateTask = useCallback(async (id: string, updates: Partial<HousekeepingTask>): Promise<boolean> => {
    try {
      const res = await fetch('/api/hotel/housekeeping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const json = await res.json();
      if (json.success) { refresh(); return true; }
      return false;
    } catch { return false; }
  }, [refresh]);

  return { tasks, stats, loading, error, refresh, updateTask };
}
