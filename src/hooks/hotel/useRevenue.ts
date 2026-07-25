'use client';
import { useState, useEffect, useCallback } from 'react';
import type { RevenueMetrics, OccupancyTrend, ChannelRevenue } from '@/types/hotel/revenue.types';

interface UseRevenueReturn {
  metrics: RevenueMetrics | null;
  trends: OccupancyTrend[];
  channelBreakdown: ChannelRevenue[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useRevenue(): UseRevenueReturn {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [trends, setTrends] = useState<OccupancyTrend[]>([]);
  const [channelBreakdown, setChannelBreakdown] = useState<ChannelRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/revenue');
      const json = await res.json();
      if (json.success) {
        setMetrics(json.data?.metrics ?? null);
        setTrends(json.data?.trends ?? []);
        setChannelBreakdown(json.data?.channelBreakdown ?? []);
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

  return { metrics, trends, channelBreakdown, loading, error, refresh };
}
