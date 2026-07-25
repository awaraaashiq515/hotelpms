// ── Housekeeping Types ────────────────────────────────────────────
export type HKTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'COMPLETED' | 'SKIPPED';
export type HKTaskType =
  | 'CLEANING'
  | 'DEEP_CLEANING'
  | 'INSPECTION'
  | 'TURNDOWN'
  | 'MINIBAR_RESTOCK'
  | 'LINEN_CHANGE'
  | 'MAINTENANCE_REPORT';
export type HKPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface HousekeepingTask {
  id: string;
  propertyId: string;
  roomId: string;
  taskType: HKTaskType;
  assignedTo?: string;
  priority?: HKPriority;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  status: HKTaskStatus;
  remarks?: string;
  photoUrl?: string;
  room?: { roomNumber: string; floor?: string; roomType?: { name: string } };
}

export interface HousekeepingStats {
  total: number;
  pending: number;
  inProgress: number;
  done: number;
  byPriority: Record<HKPriority, number>;
  byType: Partial<Record<HKTaskType, number>>;
}

export interface LostFoundItem {
  id: string;
  propertyId: string;
  itemName: string;
  description?: string;
  foundAt: string;
  foundBy?: string;
  roomNumber?: string;
  location?: string;
  status: 'FOUND' | 'CLAIMED' | 'DISPOSED' | 'HANDED_OVER';
  guestName?: string;
  guestContact?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface LaundryItem {
  id: string;
  propertyId: string;
  roomNumber: string;
  guestName?: string;
  items: LaundryLineItem[];
  status: 'COLLECTED' | 'IN_LAUNDRY' | 'READY' | 'DELIVERED';
  collectedAt: string;
  deliveredAt?: string;
  totalAmount: number;
  notes?: string;
}

export interface LaundryLineItem {
  name: string;
  quantity: number;
  priceEach: number;
}
