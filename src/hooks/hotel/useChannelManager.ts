'use client';
import { useState, useEffect, useCallback } from 'react';
import type {
  ChannelItem,
  ChannelManagerSummary,
  ChannelParityRow,
  ChannelSyncLogItem,
} from '@/types/hotel/channel.types';
import type { RoomTypeItem } from '@/components/hotel/channel/ChannelMappingModal';
import { toast } from 'sonner';

interface UseChannelManagerReturn {
  summary: ChannelManagerSummary | null;
  channels: ChannelItem[];
  roomTypes: RoomTypeItem[];
  parityMatrix: ChannelParityRow[];
  syncLogs: ChannelSyncLogItem[];
  loading: boolean;
  syncingChannelId: string | null;
  error: string | null;
  refresh: () => Promise<void>;
  syncChannel: (channelId?: string) => Promise<boolean>;
  updateChannel: (channelData: Partial<ChannelItem> & { id: string }) => Promise<boolean>;
  connectChannel: (channelData: Partial<ChannelItem>) => Promise<boolean>;
  disconnectChannel: (id: string) => Promise<boolean>;
  saveRoomMapping: (mappingData: {
    channelId: string;
    roomTypeId: string;
    otaRoomName?: string;
    allocatedRooms?: number;
    priceMarkupPct?: number;
    stopSell?: boolean;
  }) => Promise<boolean>;
  toggleStopSell: (channelId: string, roomTypeId: string, stopSell: boolean) => Promise<boolean>;
}

export function useChannelManager(): UseChannelManagerReturn {
  const [summary, setSummary] = useState<ChannelManagerSummary | null>(null);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
  const [parityMatrix, setParityMatrix] = useState<ChannelParityRow[]>([]);
  const [syncLogs, setSyncLogs] = useState<ChannelSyncLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncingChannelId, setSyncingChannelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchChannelData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mainRes, logsRes] = await Promise.all([
        fetch('/api/hotel/channel-manager'),
        fetch('/api/hotel/channel-manager/logs'),
      ]);

      const mainJson = await mainRes.json();
      const logsJson = await logsRes.json();

      if (mainJson.success && mainJson.data) {
        setSummary(mainJson.data.summary || null);
        setChannels(mainJson.data.channels || []);
        setRoomTypes(mainJson.data.roomTypes || []);
        setParityMatrix(mainJson.data.parityMatrix || []);
      } else {
        setError(mainJson.message || 'Failed to fetch channel manager data');
      }

      if (logsJson.success && logsJson.data) {
        setSyncLogs(logsJson.data || []);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChannelData();
  }, [fetchChannelData]);

  const refresh = async () => {
    await fetchChannelData();
  };

  // Sync single channel or all
  const syncChannel = async (channelId?: string): Promise<boolean> => {
    setSyncingChannelId(channelId || 'all');
    try {
      const res = await fetch('/api/hotel/channel-manager/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId, syncAll: !channelId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Channels synchronized successfully!');
        await refresh();
        return true;
      } else {
        toast.error(json.message || 'Sync failed');
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sync failed';
      toast.error(msg);
      return false;
    } finally {
      setSyncingChannelId(null);
    }
  };

  // Update channel settings / markup
  const updateChannel = async (channelData: Partial<ChannelItem> & { id: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/hotel/channel-manager', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Channel configuration updated');
        await refresh();
        return true;
      } else {
        toast.error(json.message || 'Failed to update channel');
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update channel';
      toast.error(msg);
      return false;
    }
  };

  // Connect new channel
  const connectChannel = async (channelData: Partial<ChannelItem>): Promise<boolean> => {
    try {
      const res = await fetch('/api/hotel/channel-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Channel connected successfully!');
        await refresh();
        return true;
      } else {
        toast.error(json.message || 'Failed to connect channel');
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to connect channel';
      toast.error(msg);
      return false;
    }
  };

  // Disconnect channel
  const disconnectChannel = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/hotel/channel-manager?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Channel disconnected');
        await refresh();
        return true;
      } else {
        toast.error(json.message || 'Failed to disconnect channel');
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to disconnect channel';
      toast.error(msg);
      return false;
    }
  };

  // Save room mapping
  const saveRoomMapping = async (mappingData: {
    channelId: string;
    roomTypeId: string;
    otaRoomName?: string;
    allocatedRooms?: number;
    priceMarkupPct?: number;
    stopSell?: boolean;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/hotel/channel-manager/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappingData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Room mapping saved');
        await refresh();
        return true;
      } else {
        toast.error(json.message || 'Failed to save mapping');
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save mapping';
      toast.error(msg);
      return false;
    }
  };

  // Toggle stop-sell
  const toggleStopSell = async (channelId: string, roomTypeId: string, stopSell: boolean): Promise<boolean> => {
    return await saveRoomMapping({
      channelId,
      roomTypeId,
      stopSell,
    });
  };

  return {
    summary,
    channels,
    roomTypes,
    parityMatrix,
    syncLogs,
    loading,
    syncingChannelId,
    error,
    refresh,
    syncChannel,
    updateChannel,
    connectChannel,
    disconnectChannel,
    saveRoomMapping,
    toggleStopSell,
  };
}
