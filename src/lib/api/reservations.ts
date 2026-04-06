import { apiClient } from './client';

export interface TableReservation {
  id: string;
  propertyId: string;
  customerName: string;
  customerPhone?: string;
  date: string;
  time: string;
  numberOfTables: number;
  guestCount?: number;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  driverId?: string;
  driver?: { id: string; name: string };
  tableId?: string;
  table?: { id: string; name: string; floor?: { name: string } };
  createdAt: string;
  updatedAt: string;
}

export const tableReservationsApi = {
  async list(propertyId?: string): Promise<TableReservation[]> {
    const query = propertyId ? `?propertyId=${propertyId}` : '';
    return apiClient.get(`/api/table-reservations${query}`);
  },

  async create(data: Partial<TableReservation>): Promise<TableReservation> {
    return apiClient.post('/api/table-reservations', data);
  },

  async update(id: string, data: Partial<TableReservation>): Promise<TableReservation> {
    return apiClient.put(`/api/table-reservations/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/table-reservations/${id}`);
  },
};
