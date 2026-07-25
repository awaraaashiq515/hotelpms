// ── Room Types ────────────────────────────────────────────────────
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_ORDER' | 'RESERVED' | 'BLOCKED';
export type HousekeepingStatus = 'CLEAN' | 'DIRTY' | 'INSPECTED' | 'IN_PROGRESS';
export type MaintenanceStatus = 'NONE' | 'MINOR' | 'MAJOR' | 'OUT_OF_ORDER';

export interface Room {
  id: string;
  propertyId: string;
  roomNumber: string;
  floor?: string;
  status: RoomStatus;
  housekeepingStatus: HousekeepingStatus;
  maintenanceStatus?: MaintenanceStatus;
  roomTypeId: string;
  roomType?: RoomType;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  baseRate: number;
  maxOccupancy: number;
  amenities?: string;
  description?: string;
  imageUrl?: string;
}

export interface RoomStatusUpdate {
  id: string;
  status?: RoomStatus;
  housekeepingStatus?: HousekeepingStatus;
  maintenanceStatus?: MaintenanceStatus;
}

export interface RoomFilter {
  status?: RoomStatus | 'ALL';
  housekeepingStatus?: HousekeepingStatus;
  floor?: string;
  roomTypeId?: string;
}
