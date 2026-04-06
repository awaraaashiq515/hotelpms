import { apiClient } from './client';
import { Product } from './products';

export interface OrderItem {
  id?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  product?: Product;
}

export interface Order {
  id: string;
  orderNo: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNo?: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  createdAt: string;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNo?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxAmount?: number;
  }[];
}

export interface SettlementRequest {
  paymentModeId: string;
  totalAmount: number;
  guestId?: string;
  restaurantTableId?: string;
  driverId?: string;
  staffMemberId?: string;

  items: {
    id: string;
    quantity: number;
    basePrice?: number;
    sellingPrice?: number;
    unitPrice?: number;
  }[];
}

export const ordersApi = {
  async list(params?: { status?: string }): Promise<Order[]> {
    return apiClient.get('/api/pos-orders', { params: params as Record<string, string> });
  },

  async get(id: string): Promise<Order> {
    return apiClient.get(`/api/pos-orders/${id}`);
  },

  async create(data: CreateOrderRequest): Promise<Order> {
    return apiClient.post('/api/pos-orders', data);
  },

  async checkout(data: SettlementRequest): Promise<any> {
    const response = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  async save(data: any): Promise<any> {
    const response = await fetch('/api/orders/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  async checkoutCredit(data: { totalAmount: number; guestId: string; restaurantTableId?: string; items: { id: string; quantity: number; sellingPrice: number }[] }): Promise<any> {
    return apiClient.post('/api/orders/checkout-credit', data);
  },
};
