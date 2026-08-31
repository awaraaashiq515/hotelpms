'use client';
import { useState, useEffect, useCallback } from 'react';
import type { HotelAnalyticsData, AnalyticsTimeRange } from '@/types/hotel/analytics.types';
import { toast } from 'sonner';

interface UseAnalyticsReturn {
  data: HotelAnalyticsData | null;
  loading: boolean;
  generatingKey: string | null;
  timeRange: AnalyticsTimeRange;
  customStartDate: string;
  customEndDate: string;
  setTimeRange: (range: AnalyticsTimeRange, start?: string, end?: string) => void;
  refresh: () => Promise<void>;
  generateAndDownloadReport: (reportKey: string) => Promise<void>;
  generateAndDownloadPDFReport: (reportKey: string) => Promise<void>;
}

export function useAnalytics(): UseAnalyticsReturn {
  const [data, setData] = useState<HotelAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingKey, setGeneratingKey] = useState<string | null>(null);
  const [timeRange, setTimeRangeState] = useState<AnalyticsTimeRange>('30d');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const fetchAnalytics = useCallback(async (range: AnalyticsTimeRange, start?: string, end?: string) => {
    setLoading(true);
    try {
      let url = `/api/hotel/analytics?timeRange=${range}`;
      if (range === 'custom' && start) {
        url += `&startDate=${encodeURIComponent(start)}`;
        if (end) url += `&endDate=${encodeURIComponent(end)}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        toast.error(json.message || 'Failed to load analytics');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(timeRange, customStartDate, customEndDate);
  }, [fetchAnalytics, timeRange, customStartDate, customEndDate]);

  const refresh = async () => {
    await fetchAnalytics(timeRange, customStartDate, customEndDate);
  };

  const setTimeRange = (range: AnalyticsTimeRange, start?: string, end?: string) => {
    setTimeRangeState(range);
    if (start !== undefined) setCustomStartDate(start);
    if (end !== undefined) setCustomEndDate(end);
  };

  const generateAndDownloadReport = async (reportKey: string) => {
    setGeneratingKey(reportKey);
    try {
      const res = await fetch('/api/hotel/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportKey, timeRange }),
      });
      const json = await res.json();
      if (json.success && json.data?.csvContent) {
        const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + json.data.csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${json.data.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`${json.data.title} downloaded as CSV!`);
      } else {
        toast.error(json.message || 'Failed to generate report');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Report generation failed';
      toast.error(msg);
    } finally {
      setGeneratingKey(null);
    }
  };

  const generateAndDownloadPDFReport = async (reportKey: string) => {
    setGeneratingKey(reportKey);
    try {
      const res = await fetch('/api/hotel/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportKey, timeRange }),
      });
      const json = await res.json();
      if (json.success && json.data?.headers && json.data?.rows) {
        const { exportHotelPDF } = await import('@/lib/export-utils');
        exportHotelPDF(
          json.data.headers,
          json.data.rows,
          `${json.data.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`,
          json.data.title,
          {
            hotelName: json.data.hotelName || 'Grand Luxury Hotel & Resort',
            hotelAddress: json.data.hotelAddress || 'Executive Hotel PMS & Revenue System',
            generatedBy: json.data.generatedBy || 'Admin / General Manager',
            dateRangeFormatted: `Period: ${timeRange.toUpperCase()}`,
          }
        );
        toast.success(`${json.data.title} downloaded as PDF!`);
      } else {
        toast.error(json.message || 'Failed to generate PDF');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'PDF generation failed';
      toast.error(msg);
    } finally {
      setGeneratingKey(null);
    }
  };

  return {
    data,
    loading,
    generatingKey,
    timeRange,
    customStartDate,
    customEndDate,
    setTimeRange,
    refresh,
    generateAndDownloadReport,
    generateAndDownloadPDFReport,
  };
}
