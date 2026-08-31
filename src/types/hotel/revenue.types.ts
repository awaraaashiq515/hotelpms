// ── Revenue Management Types ──────────────────────────────────────

export interface RevenueMetrics {
  revenueToday: number;
  revenueYesterday: number;
  revenueWeek: number;
  revenueMonth: number;
  revenueYear: number;
  totalRevenue: number;
  periodRevenue: number;
  prevPeriodRevenue: number;
  growthPct: number;
  adr: number;
  revpar: number;
  goppar: number;
  trevpar: number;
  occupancyPct: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalBookings: number;
  avgLengthOfStay: number;
  avgBookingValue: number;
  roomRevenue: number;
  ancillaryRevenue: number;
  fbRevenue: number;
  spaRevenue: number;
  poolRevenue: number;
  laundryRevenue: number;
}

export interface RevenueTrendItem {
  date: string;
  dayLabel: string;
  roomRevenue: number;
  ancillaryRevenue: number;
  totalRevenue: number;
  occupancy: number;
  adr: number;
  revpar: number;
  occupiedRooms: number;
  availableRooms: number;
}

export interface DynamicPricingRule {
  id: string;
  propertyId: string;
  name: string;
  ruleType: 'OCCUPANCY' | 'DAY_OF_WEEK' | 'DATE_RANGE' | 'EVENT' | 'LEAD_TIME' | 'SEASON';
  condition: string; // e.g. "Occ > 80%", "Fri-Sun", "< 24 hrs", "Festivals/Holidays"
  adjustment: number; // e.g. 20 (means +20%) or -10 (-10%)
  adjustmentType: 'PERCENTAGE' | 'FIXED';
  roomTypeId?: string | null;
  roomTypeName?: string | null;
  isActive: boolean;
  priority: number;
  minRate?: number | null;
  maxRate?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChannelRevenue {
  channel: string;
  bookings: number;
  revenue: number;
  pct: number;
  avgAdr: number;
  color?: string;
}

export interface RoomTypeRevenue {
  roomTypeId: string;
  name: string;
  code: string;
  baseRate: number;
  rooms: number;
  occupied: number;
  vacant: number;
  revenue: number;
  adr: number;
  revpar: number;
  occupancyPct: number;
  suggestedRate: number;
  adjustmentPct: number;
}

export interface AncillaryBreakdown {
  category: string;
  revenue: number;
  ordersCount: number;
  sharePct: number;
  color: string;
}

export interface DayForecast {
  date: string;
  day: string;
  formattedDate: string;
  bookedRooms: number;
  totalRooms: number;
  occupancyPct: number;
  demandLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'PEAK';
  suggestedRateMultiplier: number;
  projectedRevenue: number;
  activeRulesApplied: string[];
}

export interface DynamicRateSimulationResult {
  roomTypeId: string;
  roomTypeName: string;
  baseRate: number;
  finalRate: number;
  adjustmentAmount: number;
  adjustmentPct: number;
  appliedRules: {
    ruleName: string;
    type: string;
    adjustment: string;
    reason?: string;
  }[];
  occupancyAtDate: number;
  demandLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'PEAK';
  targetDate?: string;
}

export type TimeRangeFilter = 'today' | '7d' | '30d' | 'month' | 'year' | 'all' | 'custom';
