import { apiClient } from './client';

export interface PaymentMode {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

export const paymentModesApi = {
  async list(): Promise<PaymentMode[]> {
    return apiClient.get('/api/setup/payment-modes');
  },
  async create(data: { name: string, type: string, propertyId: string }): Promise<PaymentMode> {
    return apiClient.post('/api/setup/payment-modes', data);
  },
  async update(id: string, data: Partial<PaymentMode>): Promise<PaymentMode> {
    return apiClient.put(`/api/setup/payment-modes/${id}`, data);
  },
  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/setup/payment-modes/${id}`);
  },
};
