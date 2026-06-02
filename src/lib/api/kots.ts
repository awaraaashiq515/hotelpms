import { apiClient } from './client';

export interface KotItem {
  id: string;
  kotId: string;
  orderItemId: string;
  productId: string;
  itemName: string;
  quantity: number;
  notes?: string;
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
  product?: {
    name: string;
    menuType?: string;
  };
}

export interface KotStatusLog {
  id: string;
  kotId: string;
  oldStatus: string;
  newStatus: string;
  changedBy?: string;
  changedAt: string;
  remarks?: string;
}

export interface KotTicket {
  id: string;
  kotNo: string;
  orderId: string;
  propertyId: string;
  outletId: string;
  restaurantTableId?: string;
  tableNo?: string;
  roomId?: string;
  status: 'NEW' | 'PREPARING' | 'READY' | 'SERVED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  kitchenStation?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    orderNo: string;
    orderType: string;
    tableNo?: string;
    roomId?: string;
    createdAt?: string;
    preparationTime?: number;
  };
  items: KotItem[];
  statusLogs?: KotStatusLog[];
}

export const kotsApi = {
  list: async (params: {
    propertyId?: string;
    outletId?: string;
    status?: string;
    date?: string; // YYYY-MM-DD
  } = {}): Promise<KotTicket[]> => {
    return apiClient.get<KotTicket[]>('/api/kots', { params: params as Record<string, string> });
  },

  get: async (id: string): Promise<KotTicket> => {
    return apiClient.get<KotTicket>(`/api/kots/${id}`);
  },

  updateStatus: async (id: string, status: string, remarks?: string): Promise<KotTicket> => {
    return apiClient.patch<KotTicket>(`/api/kots/${id}`, { status, remarks });
  },

  updateItemStatus: async (kotId: string, itemId: string, status: string): Promise<KotItem> => {
    return apiClient.patch<KotItem>(`/api/kots/${kotId}/items/${itemId}`, { status });
  },

  addItem: async (
    kotId: string,
    data: { productId: string; quantity: number; notes?: string; unitPrice?: number }
  ): Promise<KotItem> => {
    return apiClient.post<KotItem>(`/api/kots/${kotId}/add-item`, data);
  },

  cancelItem: async (kotId: string, itemId: string, reason?: string): Promise<KotItem> => {
    return apiClient.post<KotItem>(`/api/kots/${kotId}/cancel-item`, { itemId, reason });
  },
  
  cleanup: async (params: { hours?: number, all?: boolean }): Promise<any> => {
    return apiClient.delete('/api/kots', { params: params as any });
  }
};
