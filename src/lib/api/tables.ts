import { apiClient } from './client';

export interface Table {
  id: string;
  floorId: string;
  propertyId: string;
  name: string;
  capacity: number;
  status: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  activeOrder?: any;
}

export const tablesApi = {
  async list(floorId: string = 'all'): Promise<Table[]> {
    return apiClient.get(`/api/tables?floorId=${floorId}`);
  },

  async create(data: Partial<Table>): Promise<Table> {
    return apiClient.post('/api/tables', data);
  },

  async update(id: string, data: Partial<Table>): Promise<Table> {
    return apiClient.put(`/api/tables/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/tables/${id}`);
  },
};
