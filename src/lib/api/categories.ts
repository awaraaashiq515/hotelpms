import { apiClient } from './client';
import { Product } from './products';

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  menuType?: 'RESTAURANT' | 'BAR';
  _count?: {
    products: number;
  };
  products?: Product[];
  createdAt?: string;
  updatedAt?: string;
}

export const categoriesApi = {
  async list(includeProducts: boolean = false): Promise<Category[]> {
    return apiClient.get(`/api/categories${includeProducts ? '?includeProducts=true' : ''}`);
  },

  async get(id: string): Promise<Category> {
    return apiClient.get(`/api/categories/${id}`);
  },

  async create(data: Partial<Category>): Promise<Category> {
    return apiClient.post('/api/categories', data);
  },

  async update(id: string, data: Partial<Category>): Promise<Category> {
    return apiClient.put(`/api/categories/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/categories/${id}`);
  },
};
