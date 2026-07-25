'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Reservation, ReservationFilter } from '@/types/hotel/reservation.types';

interface UseReservationsReturn {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  total: number;
  refresh: () => void;
  setFilter: (f: Partial<ReservationFilter>) => void;
  filter: ReservationFilter;
}

const DEFAULT_FILTER: ReservationFilter = { status: 'ALL', page: 1, limit: 50 };

export function useReservations(initial?: Partial<ReservationFilter>): UseReservationsReturn {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filter, setFilterState] = useState<ReservationFilter>({ ...DEFAULT_FILTER, ...initial });

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter.status && filter.status !== 'ALL') params.set('status', filter.status);
      if (filter.search) params.set('search', filter.search);
      if (filter.dateFrom) params.set('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.set('dateTo', filter.dateTo);
      if (filter.page) params.set('page', String(filter.page));
      if (filter.limit) params.set('limit', String(filter.limit));

      const res = await fetch(`/api/hotel/bookings?${params}`);
      const json = await res.json();
      if (json.success) {
        setReservations(json.data ?? []);
        setTotal(json.total ?? json.data?.length ?? 0);
      } else {
        setError(json.message || 'Failed to load');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { refresh(); }, [refresh]);

  const setFilter = useCallback((f: Partial<ReservationFilter>) => {
    setFilterState(prev => ({ ...prev, ...f }));
  }, []);

  return { reservations, loading, error, total, refresh, setFilter, filter };
}
