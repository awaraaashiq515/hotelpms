export interface BikeItem {
  id: string;
  vendorId: string;
  model: string;
  category: 'SCOOTER' | 'CRUISER' | 'ADVENTURE' | 'SPORTS' | 'ELECTRIC' | string;
  plateNumber: string;
  dailyRate: number;
  hourlyRate?: number | null;
  securityDeposit: number;
  helmetsProvided: number;
  fuelIncluded: boolean;
  status: 'AVAILABLE' | 'ON_RENT' | 'MAINTENANCE';
  photoUrl?: string | null;
  createdAt?: string;
}

export interface BookingItem {
  id: string;
  vendorId: string;
  bikeId: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string | null;
  aadhaarNumber?: string | null;
  panNumber?: string | null;
  licenseNumber?: string | null;
  startDate: string;
  endDate: string;
  totalAmount: number;
  securityDeposit: number;
  depositRefunded: boolean;
  status: 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'RETURNED' | 'CANCELLED' | string;
  notes?: string | null;
  createdAt: string;
  bike?: {
    id?: string;
    model: string;
    plateNumber: string;
    category?: string;
    dailyRate?: number;
    securityDeposit?: number;
  };
}

export interface EnquiryItem {
  id: string;
  vendorId?: string;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  categoryRequested: string;
  quantity: number;
  startDate: string;
  endDate: string;
  days: number;
  estimatedBudget?: number;
  specialRequirements?: string;
  source: 'AGENT_PORTAL' | 'HOTEL_DESK' | 'WALK_IN' | 'ONLINE';
  status: 'NEW' | 'PENDING' | 'QUOTED' | 'ACCEPTED' | 'CONFIRMED' | 'ACTIVE' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | string;
  quotedPrice?: number;
  assignedBikeId?: string;
  createdAt: string;
}

export interface VendorProfile {
  id: string;
  name: string;
  phone: string;
  shopName?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  rating?: number;
  email?: string | null;
}
