import { apiClient } from './client';

export interface Customer {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  mobile?: string;
  address?: string;
  gender?: string;
  loyaltyPoints: number;
  createdAt?: string;
  updatedAt?: string;
}

export const customersApi = {
  async list(): Promise<Customer[]> {
    return apiClient.get('/api/customers');
  },

  async get(id: string): Promise<Customer> {
    return apiClient.get(`/api/customers/${id}`);
  },

  async create(data: Partial<Customer>): Promise<Customer> {
    // Note: API expects fullName or firstName/lastName
    // Our form will send firstName/lastName
    return apiClient.post('/api/customers', data);
  },

  async update(id: string, data: Partial<Customer>): Promise<Customer> {
    return apiClient.put(`/api/customers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/customers/${id}`);
  },
};
