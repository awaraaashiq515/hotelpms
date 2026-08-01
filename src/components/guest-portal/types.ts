export interface Variant {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sellingPrice: number;
  halfPrice?: number;
  taxRate?: number;
  taxType?: string;
  image?: string;
  isVeg: boolean;
  availabilityStatus: boolean;
  variants: Variant[];
}

export interface Category {
  id: string;
  name: string;
  products: Product[];
}

export interface CartItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number;
  taxRate?: number;
  variantId?: string;
  variantName?: string;
  isVeg: boolean;
}

export interface FolioTransaction {
  id: string;
  txnDate: string;
  txnType: string;
  sourceModule: string;
  description: string;
  debitAmount: number;
  creditAmount: number;
  netAmount: number;
}

export interface PosOrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  variantName?: string | null;
  product: {
    name: string;
  };
}

export interface GuestPortalPosOrder {
  id: string;
  orderNo: string;
  outlet: { name: string; type: string } | null;
  grandTotal: number;
  taxAmount: number;
  createdAt: string;
  items: PosOrderItem[];
}

export interface Folio {
  id: string;
  folioNo: string;
  status: string;
  totalCharges: number;
  totalPayments: number;
  closingBalance: number;
  transactions: FolioTransaction[];
  posOrders: GuestPortalPosOrder[];
}

export interface Reservation {
  id: string;
  bookingNo: string;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  status: string;
  totalAmount: number;
  advanceAmount: number;
  dueAmount: number;
  roomType: { name: string; baseRate: number };
  rooms: Array<{
    room: {
      id: string;
      roomNumber: string;
      gstRate?: number;
      discount?: number;
      customRate?: number;
      amenities?: string;
    } | null;
  }>;
  property?: {
    id: string;
    name: string;
    hotelWifiName?: string | null;
    hotelWifiPassword?: string | null;
    breakfastTimings?: string | null;
    poolTimings?: string | null;
    gymTimings?: string | null;
    checkoutPolicy?: string | null;
  } | null;
  checkoutRequested?: boolean;
  wifiStatus?: string;
  wifiPassword?: string | null;
  mealPlan?: string;
  poolAccess?: boolean;
  poolPackage?: string | null;
  poolPassCost?: number;
  spaPackage?: string | null;
  spaPackageCost?: number;
  addOnNotes?: string | null;
  folios?: Folio[];
}

export interface GuestData {
  id: string;
  firstName: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  reservations: Reservation[];
}
