// ── Hotel Room Status Board Types ─────────────────────────────────────

export type RoomOperationalStatus = 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_ORDER' | 'RESERVED';
export type HousekeepingStatus = 'CLEAN' | 'DIRTY' | 'IN_PROGRESS' | 'INSPECTION_PENDING';
export type MaintenanceStatus = 'OK' | 'UNDER_MAINTENANCE';

export interface RoomBoardGuestInfo {
  reservationId: string;
  bookingNo: string;
  guestId?: string;
  guestName: string;
  phone?: string;
  email?: string;
  arrivalDate: string;
  departureDate: string;
  totalAmount: number;
  dueAmount: number;
  adults: number;
  children: number;
  specialRequests?: string;
  status: string;
}

export interface RoomBoardItem {
  id: string;
  roomNumber: string;
  floor: number;
  status: RoomOperationalStatus;
  housekeepingStatus: HousekeepingStatus;
  maintenanceStatus: MaintenanceStatus;
  isVIP?: boolean;
  isDND?: boolean;
  keycardIssued?: boolean;
  customRate?: number | null;
  roomTypeId: string;
  roomTypeName: string;
  roomTypeCode: string;
  baseRate: number;
  maxOccupancy: number;
  activeGuest?: RoomBoardGuestInfo | null;
  assignedStaffName?: string | null;
  lastCleanedAt?: string | null;
}

export interface RoomBoardSummary {
  totalRooms: number;
  occupiedCount: number;
  occupancyPct: number;
  vacantCleanCount: number;
  vacantDirtyCount: number;
  inProgressCount: number;
  inspectionPendingCount: number;
  outOfOrderCount: number;
  arrivalsTodayCount: number;
  departuresTodayCount: number;
  hotelName: string;
  hotelAddress: string;
}

export interface RoomBoardData {
  summary: RoomBoardSummary;
  rooms: RoomBoardItem[];
  floors: number[];
  roomTypes: { id: string; name: string; code: string }[];
}
