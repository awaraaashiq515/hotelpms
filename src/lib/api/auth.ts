import { apiClient } from './client';

export interface LoginCredentials {
  email: string;
  password: string;
  captchaText?: string | null;
}

export interface RegisterCredentials {
  fullName: string;
  email: string;
  password: string;
  businessName?: string | null;
  captchaText: string;
  packageId?: string | null;
  roleName?: string;
  paymentReference?: string | null;
  paymentAmount?: number | null;
  restaurantPosEnabled?: boolean;
  barPosEnabled?: boolean;
  cafePosEnabled?: boolean;
  deliveryEnabled?: boolean;
  // Branch configuration
  branchName?: string | null;
  branchCode?: string | null;
  branchCity?: string | null;
  branchAddress?: string | null;
  branchPhone?: string | null;
  // POS cashier configuration
  posFullName?: string | null;
  posEmail?: string | null;
  posPassword?: string | null;
  // Rider & Supplier extra configuration
  phone?: string | null;
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  deliveryLocation?: string | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  deliveryRadius?: number | null;
  gstNumber?: string | null;
  category?: string | null;
  address?: string | null;
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

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return apiClient.post('/api/auth/register', credentials);
  },

  async logout(): Promise<void> {
    return apiClient.post('/api/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    return apiClient.get('/api/auth/me'); // Assuming this endpoint exists or will be added
  },
};

