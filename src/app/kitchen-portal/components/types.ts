export interface KotItem {
  id: string;
  itemName: string;
  quantity: number;
  notes?: string | null;
  status: string;
  product?: {
    name: string;
    unit?: string | null;
  } | null;
}

export interface KotTicket {
  id: string;
  kotNo: string;
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  order?: {
    orderNo: string;
    orderType: string;
    tableNo?: string | null;
    roomId?: string | null;
    createdAt?: string | null;
    guest?: {
      firstName: string;
      lastName?: string | null;
      mobile?: string | null;
    } | null;
  } | null;
  table?: {
    id: string;
    name: string;
    floor?: { name: string } | null;
  } | null;
  room?: {
    roomNumber: string;
    floor?: string | null;
  } | null;
  items: KotItem[];
}

export interface StockItem {
  id: string;
  name: string;
  sku?: string | null;
  unit?: string | null;
  currentStock: number;
  minimumStock: number;
  reorderLevel: number;
  costPrice: number;
  itemType: string;
  isLow: boolean;
}

export interface StockRequest {
  id: string;
  itemName: string;
  department: string;
  requestedBy: string;
  requestedQty: number;
  unit: string;
  currentStock: number;
  urgency: 'NORMAL' | 'URGENT' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'DISPATCHED' | 'REJECTED';
  remarks?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
}

export type TabType = 'orders' | 'store' | 'requests';
export type OrderSourceType = 'ALL' | 'ROOMS' | 'RESTAURANT' | 'TAKEAWAY';

