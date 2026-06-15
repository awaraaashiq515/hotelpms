export interface Driver {
  id: string;
  name: string;
  phone: string | null;
  vehicleNumber: string | null;
  isActive: boolean;
  propertyId?: string | null;
  vehicleType?: string | null;
  deliveryRadius?: number | null;
  dutyStatus?: string | null;
}

export interface OrderItem {
  id: string;
  product: { name: string; image: string | null; };
  quantity: number;
  totalAmount: number;
}

export interface PosOrder {
  id: string;
  orderNo: string;
  orderType: string;
  status: string;
  grandTotal: number;
  deliveryCustomerName: string | null;
  deliveryPhone: string | null;
  deliveryAddress: string | null;
  deliveryInstructions: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  items: OrderItem[];
  isPrepaid?: boolean;
  codCollected?: boolean;
  codAmountCollected?: number;
  deliveryPaymentMethod?: string;
  tipAmount?: number;
  riderHandoverId?: string | null;
  createdAt: string;
  property?: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    latitude?: number | null;
    longitude?: number | null;
  } | null;
}

export interface HistoryOrder {
  id: string;
  orderNo: string;
  grandTotal: number;
  deliveryCustomerName: string | null;
  deliveryAddress: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export type PortalTab = 'MY_DELIVERIES' | 'AVAILABLE' | 'EARNINGS' | 'CHAT' | 'SETTINGS';
