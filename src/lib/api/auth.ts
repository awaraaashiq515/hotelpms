import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
  captchaText?: string | null;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  roleId: string;
  organizationId: string;
  propertyId: string;
  role?: {
    name: string;
  };
}

export interface AuthResponse {
  user?: User;
  token?: string;
  twoFactorRequired?: boolean;
  userId?: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return apiClient.post('/api/auth/login', credentials);
  },

  async logout(): Promise<void> {
    return apiClient.post('/api/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get('/api/auth/me'); // Assuming this endpoint exists or will be added
  },
};
