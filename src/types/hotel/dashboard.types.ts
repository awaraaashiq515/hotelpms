// ── Dashboard Types ─────────────────────────────────────────────
export interface DashboardData {
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  outOfOrder: number;
  dirtyRooms: number;
  cleanRooms: number;
  occupancyPct: number;
  checkinsToday: Booking[];
  checkoutsToday: Booking[];
  inHouse: Booking[];
  pendingPayments: Booking[];
  revenueToday: number;
  revenueMonth: number;
  adr: number;
  revpar: number;
  totalBookingsMonth: number;
  otaBookings: number;
  directBookings: number;
  housekeepingTasks: HKTask[];
  hkPending: number;
  hkInProgress: number;
  hkDone: number;
  maintenanceAlerts: MaintAlert[];
  avgRating: number | null;
  totalRatings: number;
  presentToday: number;
  totalStaff: number;
  rooms: RoomSummary[];
}

export interface Booking {
  id: string;
  bookingNo: string;
  status: string;
  arrivalDate: string;
  departureDate: string;
  totalAmount: number;
  dueAmount?: number;
  createdAt?: string;
  guest?: { firstName: string; lastName?: string; mobile?: string };
  roomType?: { name: string };
  rooms?: { room?: { roomNumber: string } }[];
}

export interface HKTask {
  id: string;
  status: string;
  taskType?: string;
  priority?: string;
  room?: { roomNumber: string };
  createdAt?: string;
}

export interface MaintAlert {
  id: string;
  title?: string;
  issueType?: string;
  description?: string;
  priority?: string;
  status?: string;
  room?: { roomNumber: string };
  openedAt?: string;
}

export interface RoomSummary {
  id: string;
  roomNumber: string;
  status: string;
  housekeepingStatus: string;
  maintenanceStatus?: string;
  roomType?: { name: string; baseRate: number };
}

export interface WeatherData {
  temp: number;
  feels: number;
  condition: string;
  humidity: number;
  wind: number;
  icon: 'sun' | 'cloud-sun' | 'cloud' | 'rain';
  city: string;
}

export interface FlightInfo {
  flight: string;
  from: string;
  scheduled: string;
  status: 'On Time' | 'Delayed' | 'Landed' | 'Cancelled';
  terminal?: string;
}

export interface LocalEvent {
  name: string;
  date: string;
  category: string;
  distance?: string;
}

export interface CurrencyRate {
  code: string;
  rate: number;
  flag: string;
  change: number;
}

export interface AIRecommendation {
  id: string;
  text: string;
  type: 'warning' | 'opportunity' | 'info';
}
