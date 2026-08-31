// ── Channel Manager Types ──────────────────────────────────────

export type ChannelStatus = 'CONNECTED' | 'SYNCING' | 'PAUSED' | 'DISCONNECTED' | 'ERROR';

export type ChannelProvider = 'DIRECT_API' | 'SITEMINDER' | 'STAAH' | 'RATEGAIN' | 'CLOUDBEDS';

export interface ChannelRoomMappingItem {
  id?: string;
  channelId: string;
  roomTypeId: string;
  roomTypeName?: string;
  baseRate?: number;
  otaRoomId?: string;
  otaRoomName?: string;
  ratePlanCode?: string;
  allocatedRooms: number;
  priceMarkupPct: number;
  finalChannelPrice?: number;
  isAvailable: boolean;
  stopSell: boolean;
}

export interface ChannelItem {
  id: string;
  propertyId: string;
  channelCode: string;
  name: string;
  logo: string;
  status: ChannelStatus;
  hotelIdOnChannel?: string | null;
  apiKey?: string | null;
  apiSecret?: string | null;
  channelManagerProvider: ChannelProvider;
  autoSyncRates: boolean;
  autoSyncInventory: boolean;
  autoImportBookings: boolean;
  rateMultiplier: number; // e.g. 1.10 = +10%
  rateOffset: number;
  commissionPct: number;
  inventoryAllocation?: number | null;
  allocatedRoomCount: number;
  lastSyncAt?: string | null;
  lastSyncStatus?: string | null;
  lastSyncMessage?: string | null;
  totalBookingsReceived: number;
  totalRevenueGenerated: number;
  isLive: boolean;
  roomMappings?: ChannelRoomMappingItem[];
}

export interface ChannelSyncLogItem {
  id: string;
  propertyId: string;
  channelId?: string | null;
  channelName?: string;
  channelLogo?: string;
  actionType: 'INVENTORY_PUSH' | 'RATE_PUSH' | 'BOOKING_IMPORT' | 'FULL_SYNC' | 'STOP_SELL';
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'WARNING';
  message: string;
  payload?: string | null;
  syncedAt: string;
}

export interface ChannelParityRow {
  roomTypeId: string;
  roomTypeName: string;
  baseRate: number;
  totalInventory: number;
  channels: {
    channelCode: string;
    channelName: string;
    channelStatus: ChannelStatus;
    rate: number;
    markupPct: number;
    allocatedRooms: number;
    stopSell: boolean;
  }[];
}

export interface ChannelManagerSummary {
  totalChannels: number;
  connectedChannels: number;
  syncingChannels: number;
  pausedChannels: number;
  disconnectedChannels: number;
  totalOtaBookings: number;
  totalOtaRevenue: number;
  avgCommissionPct: number;
  avgOtaRate: number;
  netOtaYield: number;
  lastGlobalSyncAt: string | null;
}
