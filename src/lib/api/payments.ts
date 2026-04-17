import { apiClient } from './client';

export interface Settlement {
  id: string;
  settlementNo: string;
  propertyId: string;
  sourceType: 'INVOICE' | 'FOLIO';
  sourceId: string;
  grossAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'SETTLED' | 'PARTIAL';
  settlementDate: string;
}

export const paymentsApi = {
  async list(params?: { sourceId?: string, propertyId?: string }): Promise<Settlement[]> {
    return apiClient.get('/api/payments', { params: params as any });
  },

  async create(data: any): Promise<Settlement> {
    return apiClient.post('/api/payments', data);
  },
};
