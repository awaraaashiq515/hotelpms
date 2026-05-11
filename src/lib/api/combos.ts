import { apiClient } from './client';
import { Product } from './products';

export interface ComboItem {
  id?: string;
  comboId?: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Combo {
  id: string;
  propertyId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isActive: boolean;
  items: ComboItem[];
  createdAt?: string;
  updatedAt?: string;
}

export const combosApi = {
  async list(propertyId?: string): Promise<Combo[]> {
    const url = propertyId ? `/api/combos?propertyId=${propertyId}` : '/api/combos';
    return apiClient.get(url);
  },

  async get(id: string): Promise<Combo> {
    return apiClient.get(`/api/combos/${id}`);
  },

  async create(data: Partial<Combo>): Promise<Combo> {
    return apiClient.post('/api/combos', data);
  },

  async update(id: string, data: Partial<Combo>): Promise<Combo> {
    return apiClient.put(`/api/combos/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/combos/${id}`);
  },
};
