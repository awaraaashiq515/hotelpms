export type SourceCategory = 'ROOM_SERVICE' | 'RESTAURANT' | 'BAR' | 'TAKEAWAY';
export type TicketStatus = 'NEW' | 'PREPARING' | 'READY' | 'DISPATCHED' | 'SERVED' | 'COMPLETED' | 'CANCELLED';
export type ViewMode = 'DUAL_SPLIT' | 'SPLIT' | 'KANBAN' | 'GRID';

export interface DisplayItem {
  id: string;
  itemName: string;
  quantity: number;
  notes?: string | null;
  status: string;
  unit?: string | null;
  menuType: string;
  isBarItem: boolean;
}

export interface MasterTicket {
  id: string;
  kotNo: string;
  orderId: string;
  orderNo: string;
  orderType: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  sourceCategory: SourceCategory;
  hasBarItems: boolean;
  sourceBadge: string;
  sourceLocation: string;
  roomNumber?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  serverName?: string | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  assignedStaffDesignation?: string | null;
  kitchenStation?: string | null;
  outletName?: string | null;
  elapsedSeconds: number;
  elapsedMinutes: number;
  urgency: 'NORMAL' | 'WARNING' | 'CRITICAL';
  items: DisplayItem[];
  totalItemsCount: number;
}

export interface StaffSummary {
  id: string;
  name: string;
  designation: string;
  phone?: string | null;
  isActive: boolean;
  activeOrders: {
    kotId: string;
    orderNo: string;
    kotNo: string;
    roomNumber: string;
    sourceBadge: string;
    status: string;
    elapsedMinutes: number;
    assignedAt?: string;
  }[];
  completedTodayCount: number;
  status: 'AVAILABLE' | 'DELIVERING' | 'BUSY';
}

export interface DispatchLogItem {
  id: string;
  time: string;
  staffName: string;
  roomOrTable: string;
  action: string;
  status: string;
}

export interface MasterDisplayStats {
  totalActive: number;
  roomServiceCount: number;
  restaurantCount: number;
  barCount: number;
  takeawayCount: number;
  newCount: number;
  preparingCount: number;
  readyCount: number;
  servedCount: number;
  avgWaitMinutes: number;
  totalStaffOnDuty: number;
  staffDeliveringCount: number;
}
