import { apiClient } from './client';

export interface StaffMember {
  id: string;
  propertyId: string;
  name: string;
  phone?: string | null;
  designation?: string | null;
  salary?: number | null;
  address?: string | null;
  emergencyContact?: string | null;
  joiningDate?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const staffMembersApi = {
  async list(): Promise<StaffMember[]> {
    return apiClient.get('/api/staff-members');
  },

  async get(id: string): Promise<StaffMember> {
    return apiClient.get(`/api/staff-members/${id}`);
  },

  async create(data: Partial<StaffMember>): Promise<StaffMember> {
    return apiClient.post('/api/staff-members', data);
  },

  async update(id: string, data: Partial<StaffMember>): Promise<StaffMember> {
    return apiClient.put(`/api/staff-members/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/staff-members/${id}`);
  },
};
