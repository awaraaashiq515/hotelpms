// ── Hotel Analytics & Business Intelligence Types ──────────────────────

export type AnalyticsTimeRange = 'today' | '7d' | '30d' | 'month' | 'year' | 'all' | 'custom';

export interface AnalyticsKPIs {
  occupancyPct: number;
  adr: number;
  revpar: number;
  trevpar: number;
  goppar: number;
  totalRevenue: number;
  roomRevenue: number;
  ancillaryRevenue: number;
  totalBookings: number;
  avgLengthOfStay: number;
  avgBookingValue: number;
  repeatGuestRate: number;
  guestSatisfactionScore: number;
  totalReviews: number;
  housekeepingEfficiencyPct: number;
  maintenanceResolvedPct: number;
  growthVsPrevPeriod: number;
}

export interface AnalyticsTrendItem {
  date: string;
  dayLabel: string;
  occupancy: number;
  revenue: number;
  roomRevenue: number;
  ancillaryRevenue: number;
  adr: number;
  revpar: number;
  bookings: number;
}

export interface GuestSegmentation {
  type: string;
  count: number;
  percentage: number;
  revenue: number;
  color: string;
}

export interface NationalityDistribution {
  country: string;
  code: string;
  count: number;
  percentage: number;
}

export interface ChannelPerformance {
  channel: string;
  bookings: number;
  revenue: number;
  sharePct: number;
  avgAdr: number;
  color: string;
}

export interface OperationalMetrics {
  totalRooms: number;
  occupiedRooms: number;
  vacantCleanRooms: number;
  vacantDirtyRooms: number;
  outOfOrderRooms: number;
  inspectionPendingRooms: number;
  housekeepingTasksTotal: number;
  housekeepingTasksCompleted: number;
  housekeepingAvgMinutes: number;
  maintenanceTicketsTotal: number;
  maintenanceTicketsOpen: number;
  maintenanceTicketsResolved: number;
}

export interface AIInsightItem {
  id: string;
  category: 'REVENUE' | 'OCCUPANCY' | 'GUEST' | 'OPERATIONS';
  title: string;
  description: string;
  impact: 'POSITIVE' | 'NEUTRAL' | 'CRITICAL';
  actionPrompt?: string;
}

export interface ReportItemMeta {
  key: string;
  label: string;
  desc: string;
  category: string;
  icon: string;
}

export interface HotelAnalyticsData {
  kpis: AnalyticsKPIs;
  trends: AnalyticsTrendItem[];
  guestSegments: GuestSegmentation[];
  nationalities: NationalityDistribution[];
  channelDistribution: ChannelPerformance[];
  operations: OperationalMetrics;
  aiInsights: AIInsightItem[];
  timeRange: AnalyticsTimeRange;
}
