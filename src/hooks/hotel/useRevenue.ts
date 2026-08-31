'use client';
import { useState, useEffect, useCallback } from 'react';
import type {
  RevenueMetrics,
  RevenueTrendItem,
  ChannelRevenue,
  RoomTypeRevenue,
  AncillaryBreakdown,
  DayForecast,
  DynamicPricingRule,
  TimeRangeFilter,
  DynamicRateSimulationResult,
} from '@/types/hotel/revenue.types';
import { toast } from 'sonner';

interface UseRevenueReturn {
  metrics: RevenueMetrics | null;
  trends: RevenueTrendItem[];
  roomTypeBreakdown: RoomTypeRevenue[];
  channelBreakdown: ChannelRevenue[];
  ancillaryBreakdown: AncillaryBreakdown[];
  forecastDays: DayForecast[];
  pricingRules: DynamicPricingRule[];
  timeRange: TimeRangeFilter;
  customStartDate: string;
  customEndDate: string;
  loading: boolean;
  error: string | null;
  setTimeRange: (range: TimeRangeFilter, customStart?: string, customEnd?: string) => void;
  refresh: () => Promise<void>;
  createRule: (rule: Partial<DynamicPricingRule>) => Promise<boolean>;
  updateRule: (rule: Partial<DynamicPricingRule> & { id: string }) => Promise<boolean>;
  toggleRule: (id: string, isActive: boolean) => Promise<boolean>;
  deleteRule: (id: string) => Promise<boolean>;
  simulateRate: (params: { roomTypeId?: string; date?: string; customBaseRate?: number }) => Promise<DynamicRateSimulationResult | null>;
}

export function useRevenue(): UseRevenueReturn {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [trends, setTrends] = useState<RevenueTrendItem[]>([]);
  const [roomTypeBreakdown, setRoomTypeBreakdown] = useState<RoomTypeRevenue[]>([]);
  const [channelBreakdown, setChannelBreakdown] = useState<ChannelRevenue[]>([]);
  const [ancillaryBreakdown, setAncillaryBreakdown] = useState<AncillaryBreakdown[]>([]);
  const [forecastDays, setForecastDays] = useState<DayForecast[]>([]);
  const [pricingRules, setPricingRules] = useState<DynamicPricingRule[]>([]);
  const [timeRange, setTimeRangeState] = useState<TimeRangeFilter>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenueData = useCallback(async (range: TimeRangeFilter, start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/hotel/revenue?timeRange=${range}`;
      if (range === 'custom' && start) {
        url += `&startDate=${encodeURIComponent(start)}`;
        if (end) url += `&endDate=${encodeURIComponent(end)}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setMetrics(json.data.metrics ?? null);
        setTrends(json.data.trends ?? []);
        setRoomTypeBreakdown(json.data.roomTypeBreakdown ?? []);
        setChannelBreakdown(json.data.channelBreakdown ?? []);
        setAncillaryBreakdown(json.data.ancillaryBreakdown ?? []);
        setForecastDays(json.data.forecastDays ?? []);
        setPricingRules(json.data.pricingRules ?? []);
      } else {
        setError(json.message || 'Failed to fetch revenue data');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchRevenueData(timeRange, customStartDate, customEndDate);
  }, [fetchRevenueData, timeRange, customStartDate, customEndDate]);

  useEffect(() => {
    fetchRevenueData(timeRange, customStartDate, customEndDate);
  }, [fetchRevenueData, timeRange, customStartDate, customEndDate]);

  const setTimeRange = (range: TimeRangeFilter, customStart?: string, customEnd?: string) => {
    setTimeRangeState(range);
    if (customStart !== undefined) setCustomStartDate(customStart);
    if (customEnd !== undefined) setCustomEndDate(customEnd);
  };

  // Rule operations
  const createRule = async (rule: Partial<DynamicPricingRule>): Promise<boolean> => {
    try {
      const res = await fetch('/api/hotel/revenue/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Dynamic pricing rule created!');
        await refresh();
        return true;
      } else {
        toast.error(json.message || 'Failed to create rule');
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create rule';
      toast.error(msg);
      return false;
    }
  };

  const updateRule = async (rule: Partial<DynamicPricingRule> & { id: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/hotel/revenue/pricing-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Rule updated successfully');
        await refresh();
        return true;
      } else {
        toast.error(json.message || 'Failed to update rule');
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update rule';
      toast.error(msg);
      return false;
    }
  };

  const toggleRule = async (id: string, isActive: boolean): Promise<boolean> => {
    // Optimistic UI update
    setPricingRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive } : r))
    );
    try {
      const res = await fetch('/api/hotel/revenue/pricing-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Rule ${isActive ? 'activated' : 'paused'}`);
        await refresh();
        return true;
      } else {
        toast.error(json.message || 'Failed to toggle rule');
        await refresh();
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to toggle rule';
      toast.error(msg);
      await refresh();
      return false;
    }
  };

  const deleteRule = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/hotel/revenue/pricing-rules?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Rule deleted successfully');
        await refresh();
        return true;
      } else {
        toast.error(json.message || 'Failed to delete rule');
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to delete rule';
      toast.error(msg);
      return false;
    }
  };

  const simulateRate = async (params: {
    roomTypeId?: string;
    date?: string;
    customBaseRate?: number;
  }): Promise<DynamicRateSimulationResult | null> => {
    try {
      const res = await fetch('/api/hotel/revenue/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
      toast.error(json.message || 'Simulation failed');
      return null;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Simulation failed';
      toast.error(msg);
      return null;
    }
  };

  return {
    metrics,
    trends,
    roomTypeBreakdown,
    channelBreakdown,
    ancillaryBreakdown,
    forecastDays,
    pricingRules,
    timeRange,
    customStartDate,
    customEndDate,
    loading,
    error,
    setTimeRange,
    refresh,
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
    simulateRate,
  };
}
