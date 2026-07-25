// ── Guest / CRM Types ─────────────────────────────────────────────
export type GuestSegment = 'REGULAR' | 'VIP' | 'CORPORATE' | 'LOYALTY' | 'BLACKLIST';
export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';

export interface Guest {
  id: string;
  organizationId: string;
  firstName: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  gender?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  loyaltyPoints: number;
  segment: GuestSegment;
  birthDate?: string;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
  reservations?: GuestReservationSummary[];
  documents?: GuestDocument[];
}

export interface GuestProfile extends Guest {
  // 360° profile fields
  foodPreferences?: string[];
  allergies?: string[];
  pillowPreference?: string;
  favoriteRoom?: string;
  preferredLanguage?: string;
  travelPurpose?: string;
  loyaltyTier?: LoyaltyTier;
  totalStays?: number;
  totalSpend?: number;
  avgRating?: number;
  lastStayDate?: string;
  anniversaryDate?: string;
  companyName?: string;
  designations?: string;
}

export interface GuestReservationSummary {
  id: string;
  bookingNo: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  totalAmount: number;
  roomType?: { name: string };
}

export interface GuestDocument {
  id: string;
  guestId: string;
  documentType: string;
  documentUrl: string;
  verified: boolean;
  createdAt: string;
}

export interface GuestFilter {
  search?: string;
  segment?: GuestSegment;
  loyaltyTier?: LoyaltyTier;
  page?: number;
  limit?: number;
}

export interface LoyaltyLog {
  id: string;
  guestId: string;
  points: number;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  description?: string;
  createdAt: string;
}
