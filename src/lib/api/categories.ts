import { apiClient } from './client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const categoriesApi = {
  async list(): Promise<Category[]> {
    return apiClient.get('/api/categories');
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
