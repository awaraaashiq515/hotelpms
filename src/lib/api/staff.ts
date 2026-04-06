import { apiClient } from './client';

export interface Role {
  id: string;
  name: string;
  description?: string;
}

export interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  roleId: string;
  organizationId: string;
  propertyId?: string;
  role?: {
    name: string;
  };
}

export const staffApi = {
  async list(): Promise<StaffUser[]> {
    return apiClient.get('/api/users');
  },

  async roles(): Promise<Role[]> {
    return apiClient.get('/api/users/roles');
  },

  async create(data: Partial<StaffUser> & { password?: string }): Promise<StaffUser> {
    return apiClient.post('/api/users', data);
  },

  async update(id: string, data: Partial<StaffUser>): Promise<StaffUser> {
    return apiClient.put(`/api/users/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete(`/api/users/${id}`);
  },
};
