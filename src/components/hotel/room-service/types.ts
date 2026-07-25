// ── Room Service POS — Shared Types ───────────────────────────────────────────

export type OrderType = 'ROOM_SERVICE' | 'RESTAURANT' | 'BAR' | 'TAKEAWAY';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface MenuCategory {
  id: string;
  name: string;
  menuType: string;
  _count?: { products: number };
}

export interface MenuItem {
  id: string;
  name: string;
  sellingPrice: number;
  halfPrice?: number;
  taxRate?: number;
  taxType?: string; // INCLUSIVE | EXCLUSIVE
  isVeg: boolean;
  isActive: boolean;
  availabilityStatus: boolean;
  image?: string;
  description?: string;
  categoryId: string;
  category?: { name: string };
  mealTimes?: string; // BREAKFAST,LUNCH,DINNER
}

export interface CartLineItem {
  menuItem: MenuItem;
  qty: number;
  note: string;               // special instruction
  unitPrice: number;          // selling price at time of add
  lineTotal: number;          // qty × unitPrice
}

export interface RoomInfo {
  roomId: string;
  roomNumber: string;
  guestName: string;
  guestId: string;
  folioId: string;
  checkInId: string;
}

export interface RoomServiceOrder {
  id: string;
  orderNo: string;
  roomNumber: string;
  guestName?: string;
  orderType: OrderType;
  status: OrderStatus;
  items: RoomServiceOrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  specialNote?: string;
  postedToFolio: boolean;
  folioTxnId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomServiceOrderItem {
  id: string;
  productId?: string;
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  note?: string;
}

// ── Order type config ─────────────────────────────────────────────────────────
export const ORDER_TYPE_CONFIG: Record<OrderType, {
  label: string; emoji: string; desc: string;
  color: string; bg: string; postToRoom: boolean;
}> = {
  ROOM_SERVICE: {
    label: 'Room Service',
    emoji: '🛎️',
    desc: 'Delivered to room — post to folio',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border-amber-500/30',
    postToRoom: true,
  },
  RESTAURANT: {
    label: 'Restaurant',
    emoji: '🍽️',
    desc: 'Dining in — optional folio post',
    color: 'text-violet-400',
    bg: 'bg-violet-500/15 border-violet-500/30',
    postToRoom: false,
  },
  BAR: {
    label: 'Bar',
    emoji: '🥂',
    desc: 'Bar order — optional folio post',
    color: 'text-sky-400',
    bg: 'bg-sky-500/15 border-sky-500/30',
    postToRoom: false,
  },
  TAKEAWAY: {
    label: 'Takeaway',
    emoji: '📦',
    desc: 'Guest takes food — pay separately',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15 border-emerald-500/30',
    postToRoom: false,
  },
};

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string; color: string; bg: string; dot: string;
}> = {
  PENDING:   { label: 'Pending',   color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30', dot: 'bg-yellow-400' },
  CONFIRMED: { label: 'Confirmed', color: 'text-sky-400',    bg: 'bg-sky-500/15 border-sky-500/30',       dot: 'bg-sky-400' },
  PREPARING: { label: 'Preparing', color: 'text-amber-400',  bg: 'bg-amber-500/15 border-amber-500/30',   dot: 'bg-amber-400 animate-pulse' },
  READY:     { label: 'Ready',     color: 'text-lime-400',   bg: 'bg-lime-500/15 border-lime-500/30',     dot: 'bg-lime-400' },
  DELIVERED: { label: 'Delivered', color: 'text-emerald-400',bg: 'bg-emerald-500/15 border-emerald-500/30',dot: 'bg-emerald-400' },
  CANCELLED: { label: 'Cancelled', color: 'text-slate-500',  bg: 'bg-slate-700/30 border-slate-600/20',   dot: 'bg-slate-600' },
};

// ── Cart helpers ──────────────────────────────────────────────────────────────
export function calcCartTotals(items: CartLineItem[], taxRate = 5) {
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const taxAmount = Math.round((subtotal * taxRate) / 100 * 100) / 100;
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

export function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
