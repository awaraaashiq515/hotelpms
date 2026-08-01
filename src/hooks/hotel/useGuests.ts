'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Guest, GuestFilter } from '@/types/hotel/guest.types';

interface UseGuestsReturn {
  guests: Guest[];
  loading: boolean;
  error: string | null;
  total: number;
  refresh: () => void;
  setFilter: (f: Partial<GuestFilter>) => void;
}

export function useGuests(initial?: Partial<GuestFilter>): UseGuestsReturn {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filter, setFilterState] = useState<GuestFilter>({ page: 1, limit: 50, ...initial });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.search) params.set('search', filter.search);
      if (filter.segment) params.set('segment', filter.segment);
      if (filter.page) params.set('page', String(filter.page));
      if (filter.limit) params.set('limit', String(filter.limit));

      const res = await fetch(`/api/hotel/guests?${params}`);
      const json = await res.json();
      if (json.success) {
        const list = Array.isArray(json.data) 
          ? json.data 
          : Array.isArray(json.data?.data) 
            ? json.data.data 
            : [];
        setGuests(list);
        setTotal(json.total ?? json.data?.total ?? list.length);
      } else {
        setError(json.message || 'Failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { refresh(); }, [refresh]);

  const setFilter = useCallback((f: Partial<GuestFilter>) => {
    setFilterState(prev => ({ ...prev, ...f }));
  }, []);

  return { guests, loading, error, total, refresh, setFilter };
}
