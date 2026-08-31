// ── Report Center Types ──────────────────────────────────────

export type ReportCategory = 'All' | 'Financial' | 'Occupancy' | 'Bookings' | 'Operations' | 'HR' | 'AI';

export interface ReportDefinition {
  id: string;
  category: 'Financial' | 'Occupancy' | 'Bookings' | 'Operations' | 'HR' | 'AI';
  name: string;
  desc: string;
  icon: string;
  estTime: string;
  isAI?: boolean;
  featured?: boolean;
  tags: string[];
}

export interface GeneratedReportData {
  reportId: string;
  title: string;
  category: string;
  hotelName?: string;
  hotelAddress?: string;
  generatedBy?: string;
  generatedAt: string;
  timeRange: string;
  dateRangeFormatted: string;
  headers: string[];
  rows: (string | number)[][];
  summaryCards?: {
    label: string;
    value: string;
    subtext?: string;
  }[];
  csvContent: string;
  totalRecords: number;
}
