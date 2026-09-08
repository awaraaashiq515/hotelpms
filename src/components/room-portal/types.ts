// Types for Room Portal
export interface RoomPortalGuest {
  id: string;
  firstName: string;
  lastName?: string | null;
  mobile?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export interface RoomPortalRoom {
  id: string;
  roomNumber: string;
  floor?: string | null;
  status: string;
  housekeepingStatus: string;
}

export interface RoomPortalReservation {
  id: string;
  bookingNo: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  mealPlan: string;
  totalAmount: number;
  advanceAmount: number;
  dueAmount: number;
  checkoutRequested: boolean;
  property: {
    id: string;
    name: string;
    brandName?: string | null;
    logoUrl?: string | null;
    phone?: string | null;
    city?: string | null;
  };
}

export interface RoomPortalConfig {
  sessionTimeoutMin: number;
  showRoomService: boolean;
  showHousekeeping: boolean;
  showWifi: boolean;
  showAmenities: boolean;
  showBill: boolean;
  showContact: boolean;
  showFeedback: boolean;
  showCheckout: boolean;
  welcomeTitle?: string | null;
  welcomeSubtitle?: string | null;
  frontDeskPhone?: string | null;
  emergencyPhone?: string | null;
  wifiName?: string | null;
  wifiPassword?: string | null;
}

export interface RoomPortalData {
  guest: RoomPortalGuest;
  room: RoomPortalRoom;
  reservation: RoomPortalReservation;
  sessionId: string;
  kioskLocked: boolean;
  config: RoomPortalConfig | null;
}
