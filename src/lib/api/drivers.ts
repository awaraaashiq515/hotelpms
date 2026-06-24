import { apiClient } from './client';

export interface Driver {
  id: string;
  propertyId: string;
  name: string;
  phone?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  vehicleCapacity?: number; // Kitni seat wali gaadi
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  referralCount?: number;
  totalRevenue?: number;
}

export interface DriverGiftRule {
  id: string;
  customersRequired: number;
  giftName: string;
  description?: string;
  isActive: boolean;
}

export interface DriverGift {
  id: string;
  driverId: string;
  ruleId?: string;
  giftName: string;
  issuedAt: string;
  status: string;
  remarks?: string;
  rule?: DriverGiftRule;
}

export const driversApi = {
  async list(propertyId?: string | null): Promise<Driver[]> {
    const url = (propertyId && propertyId !== 'null' && propertyId !== 'undefined') 
      ? `/api/drivers?propertyId=${propertyId}` 
      : '/api/drivers';
    return apiClient.get(url);
  },

  async create(data: Partial<Driver>): Promise<Driver> {
    return apiClient.post('/api/drivers', data);
  },

  async update(id: string, data: Partial<Driver>): Promise<Driver> {
    return apiClient.put(`/api/drivers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/drivers/${id}`);
  },

  async listGiftRules(): Promise<DriverGiftRule[]> {
    return apiClient.get('/api/drivers/gift-rules');
  },

  async saveGiftRule(data: Partial<DriverGiftRule>): Promise<DriverGiftRule> {
    return apiClient.post('/api/drivers/gift-rules', data);
  },

  async deleteGiftRule(id: string): Promise<void> {
    return apiClient.delete(`/api/drivers/gift-rules?id=${id}`);
  },

  async listDriverGifts(driverId: string): Promise<DriverGift[]> {
    return apiClient.get(`/api/drivers/gifts?driverId=${driverId}`);
  },

  async issueGift(data: { driverId: string; ruleId?: string; giftName: string; remarks?: string }): Promise<DriverGift> {
    return apiClient.post('/api/drivers/gifts', data);
  }
};
