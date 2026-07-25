// ── Reservation Types ────────────────────────────────────────────
export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'CANCELLED'
  | 'NO_SHOW';

export type BookingSource =
  | 'DIRECT'
  | 'BOOKING_COM'
  | 'EXPEDIA'
  | 'AGODA'
  | 'AIRBNB'
  | 'GOIBIBO'
  | 'MAKEMYTRIP'
  | 'WALK_IN'
  | 'PHONE'
  | 'EMAIL'
  | 'CORPORATE'
  | 'TRAVEL_AGENT'
  | 'OTA_OTHER';

export interface Reservation {
  id: string;
  bookingNo: string;
  propertyId: string;
  guestId: string;
  status: ReservationStatus;
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  roomTypeId: string;
  assignedRoomId?: string;
  totalAmount: number;
  advanceAmount: number;
  dueAmount: number;
  source?: BookingSource;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
  guest?: ReservationGuest;
  roomType?: { id: string; name: string; baseRate: number };
  rooms?: ReservationRoomDetail[];
  folios?: { id: string; folioNo: string; status: string; closingBalance: number }[];
}

export interface ReservationGuest {
  id: string;
  firstName: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  loyaltyPoints?: number;
  segment?: string;
}

export interface ReservationRoomDetail {
  id: string;
  roomId?: string;
  ratePerNight: number;
  adults: number;
  children: number;
  room?: { id: string; roomNumber: string; floor?: string };
}

export interface CreateReservationPayload {
  guestId?: string;
  guestData?: {
    firstName: string;
    lastName?: string;
    mobile?: string;
    email?: string;
    idType?: string;
    idNumber?: string;
  };
  arrivalDate: string;
  departureDate: string;
  adults: number;
  children: number;
  roomTypeId: string;
  assignedRoomId?: string;
  totalAmount: number;
  advanceAmount?: number;
  source?: BookingSource;
  specialRequests?: string;
}

export interface ReservationFilter {
  status?: ReservationStatus | 'ALL';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  source?: BookingSource;
  page?: number;
  limit?: number;
}
