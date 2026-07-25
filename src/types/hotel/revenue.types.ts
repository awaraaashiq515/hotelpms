// ── Revenue Management Types ──────────────────────────────────────
export interface RevenueMetrics {
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueYear: number;
  adr: number;
  revpar: number;
  goppar: number;
  occupancyPct: number;
  trevpar: number; // Total Revenue per Available Room
}

export interface RevenueForecast {
  date: string;
  predictedOccupancy: number;
  predictedAdr: number;
  predictedRevpar: number;
  confidence: number;
  factors: string[];
}

export interface DynamicPricingRule {
  id: string;
  propertyId: string;
  name: string;
  roomTypeId?: string;
  ruleType: 'OCCUPANCY' | 'DATE_RANGE' | 'DAY_OF_WEEK' | 'EVENT' | 'SEASON';
  condition: string; // JSON
  adjustment: number; // % or fixed
  adjustmentType: 'PERCENTAGE' | 'FIXED';
  isActive: boolean;
  priority: number;
}

export interface OccupancyTrend {
  date: string;
  occupancy: number;
  adr: number;
  revpar: number;
  rooms: number;
}

export interface ChannelRevenue {
  channel: string;
  bookings: number;
  revenue: number;
  pct: number;
  avgAdr: number;
}

export interface RoomTypeRevenue {
  roomTypeId: string;
  name: string;
  rooms: number;
  occupied: number;
  revenue: number;
  adr: number;
  occupancyPct: number;
}

export interface RevenueComparison {
  label: string;
  current: number;
  previous: number;
  change: number;
  changePct: number;
}
