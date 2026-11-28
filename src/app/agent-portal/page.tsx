'use client';

import React, { useState, useEffect } from 'react';
import {
  Handshake, Star, Phone, Calendar, IndianRupee, CheckCircle2,
  Clock, AlertCircle, Loader2, X, Plus, BadgeCheck, Building2,
  LogOut, Eye, EyeOff, RefreshCw, Bed, Users, ChevronLeft,
  Wallet, MapPin, Search, ArrowRight, Home, Shield, Sparkles,
  Coffee, Waves, Dumbbell, ChevronDown, ChevronUp, Mail,
  Lock, User, Briefcase, UserPlus, Bus, Car, Bike, Tent, Map,
  Edit3, CreditCard, FileText, Upload, BedDouble, CalendarDays, List,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import GroupEnquiryModal from '@/components/agent-portal/GroupEnquiryModal';
import LocalServicesTab from '@/components/agent-portal/LocalServicesTab';
import GuestKycCapture, { type KycData } from '@/components/agent-portal/GuestKycCapture';
import ProofDocumentsModal, { parseKycFromNotes } from '@/components/agent-portal/ProofDocumentsModal';
import EditAgentBookingModal from '@/components/agent-portal/EditAgentBookingModal';
import GroupTripModal from '@/components/agent-portal/GroupTripModal';
import AgentMasterInvoiceModal, { parseGroupTripData } from '@/components/agent-portal/AgentMasterInvoiceModal';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RoomType { name: string; code: string; baseRate: number; maxOccupancy: number; }

interface HotelProperty {
  id: string; name: string; city?: string; state?: string; country?: string;
  type?: string; phone?: string; address?: string; pinCode?: string;
  starRating?: number; hotelCategory?: string; logoUrl?: string;
  checkInTime?: string; checkOutTime?: string; breakfastTimings?: string;
  poolTimings?: string; gymTimings?: string;
  totalRooms: number; availableRooms: number; occupiedRooms: number;
  roomTypes: RoomType[];
}

interface AgentBooking {
  id: string; guestName: string; guestPhone?: string; guestEmail?: string; guestNationality?: string; checkIn: string; checkOut: string;
  roomType: string; totalAmount: number; commission: number; commissionPaid: boolean;
  status: string; adults: number; children: number; createdAt: string;
  notes?: string; specialRequests?: string; includePoolAccess?: boolean; includeSpaPackage?: boolean;
  poolPassCount?: number; spaServiceType?: string; agent?: any;
}

interface Agent {
  id: string; name: string; agentCode: string; phone: string; email?: string;
  companyName?: string; city?: string; commissionRate: number; isActive: boolean;
  agentStatus?: string; bookings: AgentBooking[];
  property: { id: string; name: string; city?: string; phone?: string; logoUrl?: string };
}

interface AgentStats {
  totalBookings: number; pendingBookings: number; confirmedBookings: number;
  completedBookings: number; totalCommissionEarned: number;
  commissionPaid: number; commissionPending: number;
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  CONFIRMED: { label: 'Confirmed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  CHECKED_IN: { label: 'Checked In', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30' },
  COMPLETED: { label: 'Completed', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  CANCELLED: { label: 'Cancelled', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
};

function StarRating({ count = 0 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={10} className={i < count ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
      ))}
    </div>
  );
}

function CategoryBadge({ cat }: { cat?: string }) {
  if (!cat) return null;
  const map: Record<string, string> = {
    LUXURY: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    UPSCALE: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    MIDSCALE: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    ECONOMY: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    BOUTIQUE: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  };
  return (
    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[cat] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      {cat}
    </span>
  );
}

// ─── Input Component ─────────────────────────────────────────────────────────
function Field({ label, icon: Icon, ...props }: { label: string; icon?: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />}
        <input
          {...props}
          className={`w-full bg-[#050a14] border border-slate-700/70 rounded-xl py-3 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-slate-600 transition-colors ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function AgentPortal() {
  type ViewType = 'auth' | 'home' | 'hotel-detail' | 'book' | 'dashboard' | 'local-services';
  const [view, setView] = useState<ViewType>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [dashTab, setDashTab] = useState<'overview' | 'today' | 'bookings' | 'commission'>('overview');
  const [showGroupEnquiry, setShowGroupEnquiry] = useState(false);
  const [enquiryService, setEnquiryService] = useState<string | null>(null);
  const [enquiryItem, setEnquiryItem] = useState<any>(null);

  const handleOpenGroupEnquiry = (service?: string, item?: any) => {
    setEnquiryService(service || 'hotel');
    setEnquiryItem(item || null);
    setShowGroupEnquiry(true);
  };
  const [guestKyc, setGuestKyc] = useState<KycData | null>(null);
  const [showKyc, setShowKyc] = useState(false);
  const [homeTab, setHomeTab] = useState<'hotels' | 'local'>('hotels');

  // Customer Proof Documents & Booking Edit Modals
  const [selectedBookingForProof, setSelectedBookingForProof] = useState<any | null>(null);
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<any | null>(null);

  // ── Auth State ─────────────────────────────────────────────────────────────
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', companyName: '', city: '',
  });
  const [regError, setRegError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);

  // ── Hotels ─────────────────────────────────────────────────────────────────
  const [hotels, setHotels] = useState<HotelProperty[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [hotelSearch, setHotelSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedHotel, setSelectedHotel] = useState<HotelProperty | null>(null);
  const [showGroupTripModal, setShowGroupTripModal] = useState(false);
  const [selectedMasterInvoiceBooking, setSelectedMasterInvoiceBooking] = useState<any>(null);

  // ── Hotel Detail ───────────────────────────────────────────────────────────
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [roomsByFloor, setRoomsByFloor] = useState<Record<string, any[]>>({});
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [roomSummary, setRoomSummary] = useState<any>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({});

  // ── 1-Month Room Availability Calendar ─────────────────────────────────────
  const [hotelDetailTab, setHotelDetailTab] = useState<'calendar' | 'floormap'>('calendar');
  const [calendarViewMode, setCalendarViewMode] = useState<'list' | 'grid'>('list');
  const [availabilityData, setAvailabilityData] = useState<{
    allowedDaysAhead: number;
    daysToShow: number;
    commissionRate: number;
    days: any[];
  } | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [expandedDateBreakdown, setExpandedDateBreakdown] = useState<Record<string, boolean>>({});

  // ── Booking ────────────────────────────────────────────────────────────────
  const [bookingForm, setBookingForm] = useState({
    guestName: '', guestPhone: '', guestEmail: '', guestNationality: 'Indian',
    adults: '1', children: '0', checkIn: '', checkOut: '', roomType: '', totalAmount: '',
    numberOfRooms: 1,
    roomQuantities: {} as Record<string, number>,
    specialRequests: '', notes: '',
    includePoolAccess: false, poolPassCount: '1',
    includeSpaPackage: false, spaServiceType: 'Full Body Ayurvedic Massage (60 min)',
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Auto Restore Session on Mount ──────────────────────────────────────────
  useEffect(() => {
    try {
      const savedAgent = localStorage.getItem('agent_info');
      const savedStats = localStorage.getItem('agent_stats');
      if (savedAgent) {
        const parsedAgent = JSON.parse(savedAgent);
        setAgent(parsedAgent);
        if (savedStats) setAgentStats(JSON.parse(savedStats));
        loadHotels(parsedAgent.id);
        refreshAgent(parsedAgent.id);
        setView('home');
      }
    } catch (_) { }
  }, []);

  // ── Load Hotels (only after login) ─────────────────────────────────────────
  const loadHotels = async (targetAgentId?: string) => {
    setLoadingHotels(true);
    try {
      const currentAgentId = targetAgentId || agent?.id;
      const url = currentAgentId ? `/api/agent-portal/properties?agentId=${currentAgentId}` : '/api/agent-portal/properties';
      const res = await fetch(url);
      const j = await res.json();
      if (j.success) setHotels(j.data || []);
    } catch { }
    setLoadingHotels(false);
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/agent-portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const j = await res.json();
      if (j.success) {
        setAgent(j.data);
        setAgentStats(j.stats);
        try {
          localStorage.setItem('agent_info', JSON.stringify(j.data));
          if (j.stats) localStorage.setItem('agent_stats', JSON.stringify(j.stats));
        } catch (_) { }
        toast.success(`Welcome back, ${j.data.name}! 👋`);
        loadHotels(j.data.id);
        setView('home');
      } else {
        setLoginError(j.message || 'Invalid email or password.');
      }
    } catch {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (regForm.password.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    setRegistering(true);
    try {
      const res = await fetch('/api/agent-portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regForm.name, email: regForm.email, password: regForm.password,
          phone: regForm.phone, companyName: regForm.companyName || null, city: regForm.city || null,
        }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(`Account created! Agent Code: ${j.data.agentCode} — Please log in.`);
        setAuthMode('login');
        setLoginForm({ email: regForm.email, password: '' });
        setRegForm({ name: '', email: '', password: '', confirmPassword: '', phone: '', companyName: '', city: '' });
      } else {
        setRegError(j.message || 'Registration failed. Please try again.');
      }
    } catch {
      setRegError('Network error. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    setAgent(null); setAgentStats(null);
    setHotels([]); setSelectedHotel(null);
    setLoginForm({ email: '', password: '' });
    try {
      localStorage.removeItem('agent_info');
      localStorage.removeItem('agent_stats');
    } catch (_) { }
    setView('auth');
    setAuthMode('login');
  };

  // ── Refresh Agent Data ─────────────────────────────────────────────────────
  const refreshAgent = async (targetAgentId?: string | any) => {
    const currentAgentId = (typeof targetAgentId === 'string' ? targetAgentId : null) || agent?.id;
    if (!currentAgentId) return;
    try {
      const res = await fetch(`/api/agent-portal/auth?agentId=${currentAgentId}`);
      const j = await res.json();
      if (j.success && j.data) {
        setAgent(j.data);
        setAgentStats(j.stats);
        try {
          localStorage.setItem('agent_info', JSON.stringify(j.data));
          if (j.stats) localStorage.setItem('agent_stats', JSON.stringify(j.stats));
        } catch (_) { }
      }
    } catch { }
  };

  // ── Availability Data Loader ──────────────────────────────────────────────
  const loadAvailability = async (propertyId: string) => {
    setLoadingAvailability(true);
    try {
      const agentId = agent?.id;
      const url = `/api/agent-portal/availability?propertyId=${propertyId}${agentId ? `&agentId=${agentId}` : ''}`;
      const res = await fetch(url);
      const j = await res.json();
      if (j.success) {
        setAvailabilityData(j);
      }
    } catch {
      toast.error('Failed to load room calendar.');
    } finally {
      setLoadingAvailability(false);
    }
  };

  // ── Open Hotel ─────────────────────────────────────────────────────────────
  const openHotel = async (hotel: HotelProperty, defaultTab: 'calendar' | 'floormap' = 'calendar') => {
    setSelectedHotel(hotel);
    setView('hotel-detail');
    setHotelDetailTab(defaultTab);
    setSelectedFloor('ALL');
    setLoadingRooms(true);
    loadAvailability(hotel.id);
    try {
      const res = await fetch(`/api/agent-portal/rooms?propertyId=${hotel.id}`);
      const j = await res.json();
      if (j.success) {
        setHotelRooms(j.data || []);
        setRoomsByFloor(j.byFloor || {});
        setRoomTypes(j.roomTypes || []);
        setRoomSummary(j.summary || null);
        const expanded: Record<string, boolean> = {};
        Object.keys(j.byFloor || {}).forEach(f => { expanded[f] = true; });
        setExpandedFloors(expanded);
      }
    } catch { toast.error('Failed to load rooms.'); }
    setLoadingRooms(false);
  };

  // ── Date & Room Calculation Helpers ───────────────────────────────────────
  const calcNights = (ci: string, co: string) => {
    if (!ci || !co) return 1;
    const d1 = new Date(ci).getTime();
    const d2 = new Date(co).getTime();
    return Math.max(1, Math.round((d2 - d1) / 86400000));
  };

  const handleUpdateRoomQuantity = (rtName: string, delta: number) => {
    setBookingForm((f) => {
      const currentQty = f.roomQuantities[rtName] || 0;
      const newQty = Math.max(0, Math.min(25, currentQty + delta));
      const nextQuantities = { ...f.roomQuantities, [rtName]: newQty };

      // Calculate total rooms
      const totalRooms = Object.values(nextQuantities).reduce((a, b) => a + b, 0);
      const safeRooms = Math.max(1, totalRooms);

      // Construct roomType label
      const activeEntries = Object.entries(nextQuantities).filter(([_, qty]) => qty > 0);
      let roomLabel = f.roomType;
      if (activeEntries.length > 0) {
        if (activeEntries.length === 1) {
          const [name, qty] = activeEntries[0];
          roomLabel = qty === 1 ? name : `${qty}x ${name} (${qty} Rooms)`;
        } else {
          const parts = activeEntries.map(([name, qty]) => `${qty}x ${name}`);
          roomLabel = `${parts.join(', ')} (${totalRooms} Rooms)`;
        }
      }

      // Calculate rate per night
      const nights = calcNights(f.checkIn, f.checkOut);
      let ratePerNight = 0;
      Object.entries(nextQuantities).forEach(([name, qty]) => {
        const rt = selectedHotel?.roomTypes?.find((r) => r.name === name);
        const rate = rt ? rt.baseRate : 0;
        ratePerNight += rate * qty;
      });

      const nextTotal = ratePerNight > 0 ? String(ratePerNight * nights) : f.totalAmount;
      const suggestedAdults = String(Math.max(1, safeRooms * 2));

      return {
        ...f,
        roomQuantities: nextQuantities,
        numberOfRooms: safeRooms,
        roomType: roomLabel,
        totalAmount: nextTotal,
        adults: f.adults === '1' || f.adults === '2' ? suggestedAdults : f.adults,
      };
    });
  };

  const handleSetQuickRoomCount = (count: number) => {
    setBookingForm((f) => {
      let activeType = selectedHotel?.roomTypes?.[0]?.name || 'Standard';
      const existingActive = Object.entries(f.roomQuantities).find(([_, q]) => q > 0);
      if (existingActive) activeType = existingActive[0];

      const nextQuantities: Record<string, number> = {};
      if (selectedHotel?.roomTypes) {
        selectedHotel.roomTypes.forEach((r) => {
          nextQuantities[r.name] = r.name === activeType ? count : 0;
        });
      } else {
        nextQuantities[activeType] = count;
      }

      const roomLabel = count === 1 ? activeType : `${count}x ${activeType} (${count} Rooms)`;
      const nights = calcNights(f.checkIn, f.checkOut);
      const rt = selectedHotel?.roomTypes?.find((r) => r.name === activeType);
      const rate = rt ? rt.baseRate : 0;
      const nextTotal = rate > 0 ? String(rate * count * nights) : f.totalAmount;

      return {
        ...f,
        numberOfRooms: count,
        roomQuantities: nextQuantities,
        roomType: roomLabel,
        totalAmount: nextTotal,
        adults: String(count * 2),
      };
    });
  };

  const handleDateChange = (type: 'checkIn' | 'checkOut', val: string) => {
    setBookingForm((f) => {
      const nextCi = type === 'checkIn' ? val : f.checkIn;
      const nextCo = type === 'checkOut' ? val : f.checkOut;
      const nights = calcNights(nextCi, nextCo);

      let ratePerNight = 0;
      Object.entries(f.roomQuantities).forEach(([name, qty]) => {
        const rt = selectedHotel?.roomTypes?.find((r) => r.name === name);
        const rate = rt ? rt.baseRate : 0;
        ratePerNight += rate * qty;
      });

      const nextTotal = ratePerNight > 0 ? String(ratePerNight * nights) : f.totalAmount;
      return {
        ...f,
        [type]: val,
        totalAmount: nextTotal,
      };
    });
  };

  // ── Trigger Booking ────────────────────────────────────────────────────────
  const triggerBooking = (
    roomTypeName?: string,
    rate?: number,
    note?: string,
    checkInDate?: string,
    checkOutDate?: string
  ) => {
    const selectedRt = roomTypeName || selectedHotel?.roomTypes?.[0]?.name || 'Standard';
    const initRate = rate || selectedHotel?.roomTypes?.find((r) => r.name === selectedRt)?.baseRate || 0;
    const initialQty: Record<string, number> = {};
    if (selectedHotel?.roomTypes) {
      selectedHotel.roomTypes.forEach((r) => {
        initialQty[r.name] = r.name === selectedRt ? 1 : 0;
      });
    } else {
      initialQty[selectedRt] = 1;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    const tmrwStr = tmrw.toISOString().split('T')[0];

    const finalCi = checkInDate || bookingForm.checkIn || todayStr;
    const finalCo = checkOutDate || bookingForm.checkOut || tmrwStr;
    const nights = calcNights(finalCi, finalCo);
    const totalAmount = initRate > 0 ? String(initRate * nights) : '';

    setBookingForm((f) => ({
      ...f,
      checkIn: finalCi,
      checkOut: finalCo,
      roomType: selectedRt,
      numberOfRooms: 1,
      roomQuantities: initialQty,
      totalAmount,
      notes: note || '',
      adults: '2',
    }));
    setView('book');
  };

  // ── Submit Booking ─────────────────────────────────────────────────────────
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.guestName || !bookingForm.checkIn || !bookingForm.checkOut || !agent || !selectedHotel) {
      toast.error('Please fill all required fields.'); return;
    }
    setSubmitting(true);
    try {
      // Build notes including KYC documents if captured
      let notesWithKyc = bookingForm.notes || '';
      if (guestKyc?.verified) {
        const kycItems = [
          guestKyc.aadhaarNumber ? `Aadhaar: ${guestKyc.aadhaarNumber}` : '',
          guestKyc.panNumber ? `PAN: ${guestKyc.panNumber}` : '',
          guestKyc.aadhaarFrontUrl ? `AadhaarFront: ${guestKyc.aadhaarFrontUrl}` : '',
          guestKyc.aadhaarBackUrl ? `AadhaarBack: ${guestKyc.aadhaarBackUrl}` : '',
          guestKyc.panCardUrl ? `PanDoc: ${guestKyc.panCardUrl}` : '',
          guestKyc.selfieUrl ? `Selfie: ${guestKyc.selfieUrl}` : '',
        ].filter(Boolean).join(' | ');
        const kycBadge = `[KYC VERIFIED: ${kycItems}]`;
        notesWithKyc = notesWithKyc ? `${notesWithKyc}\n${kycBadge}` : kycBadge;
      }

      if (bookingForm.numberOfRooms > 1 && !notesWithKyc.includes('[ROOMS:')) {
        const roomsTag = `[ROOMS: ${bookingForm.roomType}]`;
        notesWithKyc = notesWithKyc ? `${notesWithKyc}\n${roomsTag}` : roomsTag;
      }

      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id, propertyId: selectedHotel.id,
          guestName: bookingForm.guestName, guestPhone: bookingForm.guestPhone || null,
          guestEmail: bookingForm.guestEmail || null, guestNationality: bookingForm.guestNationality,
          adults: Number(bookingForm.adults), children: Number(bookingForm.children),
          checkIn: bookingForm.checkIn, checkOut: bookingForm.checkOut,
          roomType: bookingForm.roomType, totalAmount: Number(bookingForm.totalAmount) || 0,
          notes: notesWithKyc, specialRequests: bookingForm.specialRequests,
          includePoolAccess: bookingForm.includePoolAccess,
          includeSpaPackage: bookingForm.includeSpaPackage,
          poolPassCount: Number(bookingForm.poolPassCount) || 1,
          spaServiceType: bookingForm.includeSpaPackage ? bookingForm.spaServiceType : null,
          kycData: guestKyc?.verified ? guestKyc : null,
        }),
      });
      const j = await res.json();
      if (j.success) {
        const activeRate = (selectedHotel as any)?.commissionRate ?? agent.commissionRate;
        const comm = ((Number(bookingForm.totalAmount) * activeRate) / 100).toFixed(0);
        toast.success(`Booking submitted! Commission: ₹${comm} @ ${activeRate}%`);
        setBookingForm({
          guestName: '', guestPhone: '', guestEmail: '', guestNationality: 'Indian',
          adults: '1', children: '0', checkIn: '', checkOut: '', roomType: '', totalAmount: '',
          numberOfRooms: 1, roomQuantities: {},
          specialRequests: '', notes: '',
          includePoolAccess: false, poolPassCount: '1',
          includeSpaPackage: false, spaServiceType: 'Full Body Ayurvedic Massage (60 min)',
        });
        setGuestKyc(null);
        setShowKyc(false);
        await refreshAgent(agent.id);
        setView('dashboard'); setDashTab('bookings');
      } else {
        toast.error(j.message || 'Failed to submit booking.');
      }
    } catch { toast.error('Network error.'); }
    finally {
      setSubmitting(false);
    }
  };

  // Extract unique sorted cities with hotel count for location filtering
  const locationStats = React.useMemo(() => {
    const stats: Record<string, number> = {};
    hotels.forEach(h => {
      const city = (h.city || 'Other').trim();
      stats[city] = (stats[city] || 0) + 1;
    });
    return stats;
  }, [hotels]);

  const uniqueLocations = React.useMemo(() => {
    return Object.keys(locationStats).sort((a, b) => a.localeCompare(b));
  }, [locationStats]);

  const filteredHotels = hotels.filter(h => {
    const q = hotelSearch.toLowerCase().trim();
    const city = (h.city || 'Other').trim();

    // Location / City filter
    if (selectedLocation !== 'ALL' && city.toLowerCase() !== selectedLocation.toLowerCase()) {
      return false;
    }

    // Search query filter
    if (!q) return true;
    return (
      h.name.toLowerCase().includes(q) ||
      (h.city || '').toLowerCase().includes(q) ||
      (h.state || '').toLowerCase().includes(q) ||
      (h.address || '').toLowerCase().includes(q) ||
      (h.hotelCategory || '').toLowerCase().includes(q)
    );
  });

  const bookingsList = agent?.bookings || [];
  const totalEarned = agentStats?.totalCommissionEarned || 0;
  const commPending = agentStats?.commissionPending || 0;

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <Toaster richColors position="top-right" />

      {/* ─── TOP NAV (hidden on auth page) ──────────────────────────────────── */}
      {view !== 'auth' && (
        <nav className="sticky top-0 z-50 bg-[#050a14]/95 backdrop-blur-md border-b border-slate-800/70">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(view === 'hotel-detail' || view === 'book') && (
                <button onClick={() => view === 'book' ? setView('hotel-detail') : setView('home')}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
                  <ChevronLeft size={16} />
                </button>
              )}
              <button onClick={() => setView('home')} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-600/20">
                  <Handshake size={15} className="text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-black text-white leading-none">AgentBook</p>
                  <p className="text-[9px] text-violet-400 font-bold">Travel Partner Portal</p>
                </div>
              </button>
            </div>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-bold">
              <button onClick={() => { setSelectedHotel(null); setView('home'); }} className="hover:text-slate-300">Hotels</button>
              {selectedHotel && view !== 'home' && <><span className="text-slate-700">›</span><span className="text-slate-400">{selectedHotel.name}</span></>}
              {view === 'book' && <><span className="text-slate-700">›</span><span className="text-violet-400">Book Room</span></>}
              {view === 'dashboard' && <><span className="text-slate-700">›</span><span className="text-violet-400">Dashboard</span></>}
            </div>

            {agent && (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-black hover:bg-violet-600/40 transition-all">
                  <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center text-[10px] font-black">{agent.name[0]}</div>
                  <span className="hidden sm:inline">{agent.name.split(' ')[0]}</span>
                </button>
                <button onClick={handleLogout} className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 transition-all">
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW: AUTH — Login / Register
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'auth' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Background glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-md space-y-6">
            {/* Brand */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 mx-auto flex items-center justify-center shadow-2xl shadow-violet-600/40">
                <Handshake size={36} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">AgentBook</h1>
                <p className="text-sm text-slate-400 mt-1">Travel Partner Booking Portal</p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#090f1e] border border-slate-800 rounded-2xl p-1">
              <button onClick={() => { setAuthMode('login'); setLoginError(''); setRegError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${authMode === 'login' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <Shield size={15} /> Sign In
              </button>
              <button onClick={() => { setAuthMode('register'); setLoginError(''); setRegError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${authMode === 'register' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <UserPlus size={15} /> Register
              </button>
            </div>

            {/* ── LOGIN FORM ─────────────────────────────────────────────────── */}
            {authMode === 'login' && (
              <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white">Welcome Back</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Sign in with your registered email and password.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-3">
                  <Field label="Email Address" icon={Mail} type="email" required placeholder="agent@company.com"
                    value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input required type={showLoginPw ? 'text' : 'password'} placeholder="••••••••"
                        className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-slate-600"
                        value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
                      <button type="button" onClick={() => setShowLoginPw(!showLoginPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  {loginError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 font-bold flex items-center gap-2">
                      <AlertCircle size={13} /> {loginError}
                    </div>
                  )}
                  <button type="submit" disabled={loggingIn}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-black text-white shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {loggingIn ? <><Loader2 size={16} className="animate-spin" /> Signing In...</> : <><Shield size={16} /> Sign In to Portal</>}
                  </button>
                </form>
                <div className="text-center pt-2 border-t border-slate-800">
                  <p className="text-[11px] text-slate-500">
                    New agent?{' '}
                    <button onClick={() => setAuthMode('register')} className="text-violet-400 hover:text-violet-300 font-bold">Create an account</button>
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">Or contact hotel reception for credentials.</p>
                </div>
              </div>
            )}

            {/* ── REGISTER FORM ──────────────────────────────────────────────── */}
            {authMode === 'register' && (
              <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white">Create Agent Account</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Register as a travel agent and start earning commissions.</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-3">
                  <Field label="Full Name *" icon={User} required type="text" placeholder="Ramesh Sharma"
                    value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />
                  <Field label="Email Address *" icon={Mail} required type="email" placeholder="agent@company.com"
                    value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Password *</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input required type={showRegPw ? 'text' : 'password'} placeholder="Min 6 chars"
                          className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-slate-600"
                          value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Confirm Password *</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input required type={showRegPw ? 'text' : 'password'} placeholder="Repeat password"
                          className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-slate-600"
                          value={regForm.confirmPassword} onChange={e => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowRegPw(!showRegPw)} className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1">
                    {showRegPw ? <EyeOff size={10} /> : <Eye size={10} />} {showRegPw ? 'Hide' : 'Show'} password
                  </button>
                  <Field label="Phone Number *" icon={Phone} required type="tel" placeholder="+91 9876543210"
                    value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Company / Agency" icon={Briefcase} type="text" placeholder="Travel Co. (optional)"
                      value={regForm.companyName} onChange={e => setRegForm(f => ({ ...f, companyName: e.target.value }))} />
                    <Field label="City" icon={MapPin} type="text" placeholder="Mumbai (optional)"
                      value={regForm.city} onChange={e => setRegForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  {regError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 font-bold flex items-center gap-2">
                      <AlertCircle size={13} /> {regError}
                    </div>
                  )}
                  <button type="submit" disabled={registering}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-black text-white shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {registering ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</> : <><UserPlus size={16} /> Create Agent Account</>}
                  </button>
                </form>
                <div className="text-center pt-2 border-t border-slate-800">
                  <p className="text-[11px] text-slate-500">
                    Already registered?{' '}
                    <button onClick={() => setAuthMode('login')} className="text-violet-400 hover:text-violet-300 font-bold">Sign in here</button>
                  </p>
                </div>
              </div>
            )}

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Building2, label: 'All Hotels', desc: 'Browse partner properties' },
                { icon: Bed, label: 'Live Rooms', desc: 'Real-time availability' },
                { icon: IndianRupee, label: 'Commission', desc: 'Earn on every booking' },
              ].map(f => (
                <div key={f.label} className="bg-[#090f1e] border border-slate-800 rounded-2xl p-3">
                  <f.icon size={18} className="mx-auto text-violet-400 mb-1" />
                  <p className="text-xs font-black text-white">{f.label}</p>
                  <p className="text-[9px] text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW: HOME — Hotel Listing (only after login)
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'home' && (
        <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">

          {/* Welcome Bar */}
          {agent && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black text-white">Browse & Book</h1>
                <p className="text-sm text-slate-400">Hotels, Transport & Local Services</p>
              </div>
              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 font-black">{agent.agentCode}</span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-black">{agent.commissionRate}% Commission</span>
                <button onClick={() => loadHotels()} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-violet-500/40 transition-all cursor-pointer" title="Refresh Hotels">
                  <RefreshCw size={13} className={loadingHotels ? 'animate-spin text-violet-400' : ''} />
                </button>
                <button onClick={() => setView('dashboard')} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-black hover:text-white flex items-center gap-1.5">
                  My Bookings <ArrowRight size={11} />
                </button>
              </div>
            </div>
          )}

          {/* Home Tab Bar: Hotels | Local Services */}
          <div className="flex gap-1 bg-[#090f1e] border border-slate-800 rounded-2xl p-1">
            <button onClick={() => setHomeTab('hotels')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${homeTab === 'hotels' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}>
              <Building2 size={15} /> Hotels
            </button>
            <button onClick={() => setHomeTab('local')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black transition-all ${homeTab === 'local' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}>
              <Map size={15} /> Local Services
            </button>
          </div>

          {/* Stats Quick View - show only for Hotels tab */}
          {homeTab === 'hotels' && agent && agentStats && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Bookings', value: agentStats.totalBookings, color: 'text-sky-400', bg: 'bg-sky-950/30 border-sky-500/20' },
                { label: 'Confirmed', value: agentStats.confirmedBookings, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/20' },
                { label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/20' },
                { label: 'Pending', value: `₹${commPending.toLocaleString('en-IN')}`, color: 'text-rose-400', bg: 'bg-rose-950/30 border-rose-500/20' },
              ].map(s => (
                <div key={s.label} onClick={() => setView('dashboard')} className={`rounded-2xl border p-3 cursor-pointer hover:scale-105 transition-transform ${s.bg}`}>
                  <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Local Services Tab Content */}
          {homeTab === 'local' && (
            <LocalServicesTab onGroupEnquiry={(svc, item) => handleOpenGroupEnquiry(svc, item)} />
          )}

          {/* Hotels Tab Content */}
          {homeTab === 'hotels' && (
            <>
              {/* Location Filter & Search Hub */}
              <div className="space-y-3 bg-[#090f1e] border border-slate-800 rounded-3xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-violet-400" />
                      <h2 className="text-base font-black text-white">Find Hotels by Location</h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Select a destination city or search hotel properties below
                    </p>
                  </div>

                  {/* Location Select Dropdown */}
                  {uniqueLocations.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 hidden sm:inline">Destination:</span>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="bg-[#050a14] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-violet-500 cursor-pointer"
                      >
                        <option value="ALL">All Destinations ({hotels.length})</option>
                        {uniqueLocations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc} ({locationStats[loc] || 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={hotelSearch}
                    onChange={(e) => setHotelSearch(e.target.value)}
                    placeholder="Search hotel by name, city, state or address..."
                    className="w-full bg-[#050a14] border border-slate-800 rounded-2xl pl-11 pr-10 py-3.5 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-slate-600 transition-colors"
                  />
                  {hotelSearch && (
                    <button
                      type="button"
                      onClick={() => setHotelSearch('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Location Tabs / Pills Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedLocation('ALL')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${selectedLocation === 'ALL'
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 border border-violet-500'
                        : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                      }`}
                  >
                    <Building2 size={13} className={selectedLocation === 'ALL' ? 'text-white' : 'text-slate-500'} />
                    <span>All Locations</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${selectedLocation === 'ALL' ? 'bg-violet-800 text-violet-100' : 'bg-slate-800 text-slate-400'
                      }`}>
                      {hotels.length}
                    </span>
                  </button>

                  {uniqueLocations.map((loc) => {
                    const count = locationStats[loc] || 0;
                    const isSelected = selectedLocation.toLowerCase() === loc.toLowerCase();
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setSelectedLocation(loc)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all ${isSelected
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30 border border-violet-500'
                            : 'bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                          }`}
                      >
                        <MapPin size={13} className={isSelected ? 'text-white' : 'text-violet-400'} />
                        <span>{loc}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${isSelected ? 'bg-violet-900 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active filter summary line if city or search is active */}
                {(selectedLocation !== 'ALL' || hotelSearch) && (
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 text-slate-400">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Showing <b className="text-white">{filteredHotels.length}</b> hotel{filteredHotels.length === 1 ? '' : 's'}</span>
                      {selectedLocation !== 'ALL' && (
                        <span>in <span className="text-violet-300 font-bold">📍 {selectedLocation}</span></span>
                      )}
                      {hotelSearch && (
                        <span>matching "<span className="text-slate-200 font-bold">{hotelSearch}</span>"</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedLocation('ALL'); setHotelSearch(''); }}
                      className="text-violet-400 hover:text-violet-300 font-bold text-[11px] underline underline-offset-2 cursor-pointer ml-auto"
                    >
                      Reset filters
                    </button>
                  </div>
                )}
              </div>

              {/* Hotels Grid */}
              {loadingHotels ? (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="animate-spin text-violet-500" size={36} />
                </div>
              ) : filteredHotels.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-[#090f1e]/40 p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400">
                    <MapPin size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-white">
                      {selectedLocation !== 'ALL'
                        ? `No hotels found in "${selectedLocation}"`
                        : 'No hotels found matching your search'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Try selecting another destination city or clearing filters to view all available hotels.
                    </p>
                  </div>
                  {(selectedLocation !== 'ALL' || hotelSearch) && (
                    <button
                      onClick={() => { setSelectedLocation('ALL'); setHotelSearch(''); }}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-black text-white transition-all shadow-lg shadow-violet-600/30"
                    >
                      Show All Hotels ({hotels.length})
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredHotels.map(hotel => (
                    <div key={hotel.id} onClick={() => openHotel(hotel)}
                      className="group bg-[#090f1e] border border-slate-800 rounded-3xl overflow-hidden cursor-pointer hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-900/20 transition-all duration-300">
                      {/* Banner */}
                      <div className="h-28 bg-gradient-to-br from-violet-900/40 to-slate-900 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.15)_0%,_transparent_70%)]" />
                        {hotel.logoUrl ? (
                          <img src={hotel.logoUrl} alt={hotel.name} className="h-16 w-auto object-contain" />
                        ) : (
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/30 flex items-center justify-center">
                            <span className="text-2xl font-black text-violet-300">{hotel.name[0]}</span>
                          </div>
                        )}
                        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-black border ${hotel.availableRooms > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                          {hotel.availableRooms > 0 ? `${hotel.availableRooms} Available` : 'Fully Booked'}
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-black text-white group-hover:text-violet-200">{hotel.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[10px] font-bold text-violet-300">
                                <MapPin size={10} className="text-violet-400" />
                                {[hotel.city, hotel.state].filter(Boolean).join(', ') || 'Location Unspecified'}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <StarRating count={hotel.starRating || 0} />
                            <CategoryBadge cat={hotel.hotelCategory} />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-slate-900/80 rounded-xl p-2">
                            <p className="text-base font-black text-white">{hotel.totalRooms}</p>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">Total</p>
                          </div>
                          <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-500/10">
                            <p className="text-base font-black text-emerald-400">{hotel.availableRooms}</p>
                            <p className="text-[8px] text-emerald-600 uppercase font-bold">Available</p>
                          </div>
                          <div className="bg-rose-950/30 rounded-xl p-2 border border-rose-500/10">
                            <p className="text-base font-black text-rose-400">{hotel.occupiedRooms}</p>
                            <p className="text-[8px] text-rose-600 uppercase font-bold">Occupied</p>
                          </div>
                        </div>
                        {hotel.roomTypes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {hotel.roomTypes.slice(0, 3).map(rt => (
                              <span key={rt.name} className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                                {rt.name} · ₹{rt.baseRate.toLocaleString('en-IN')}
                              </span>
                            ))}
                            {hotel.roomTypes.length > 3 && <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-500">+{hotel.roomTypes.length - 3}</span>}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openHotel(hotel, 'calendar');
                            }}
                            className="flex-1 py-2 px-3 rounded-xl bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 text-[11px] font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Calendar size={13} className="text-violet-400" />
                            <span>1-Month Calendar</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openHotel(hotel, 'floormap');
                            }}
                            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold transition-all flex items-center gap-1"
                          >
                            <Building2 size={13} />
                            <span>Live Rooms</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW: HOTEL DETAIL
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'hotel-detail' && selectedHotel && (
        <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">
          {/* Hotel Header */}
          <div className="rounded-3xl bg-gradient-to-br from-violet-950/60 to-indigo-950/40 border border-violet-500/20 overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-violet-900/50 to-slate-900 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.2)_0%,_transparent_70%)]" />
              {selectedHotel.logoUrl ? (
                <img src={selectedHotel.logoUrl} alt={selectedHotel.name} className="h-20 w-auto object-contain relative z-10" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/20 flex items-center justify-center relative z-10">
                  <span className="text-3xl font-black text-violet-200">{selectedHotel.name[0]}</span>
                </div>
              )}
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-black text-white">{selectedHotel.name}</h2>
                  {(selectedHotel.city || selectedHotel.state) && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-violet-400" />
                      {[selectedHotel.address, selectedHotel.city, selectedHotel.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating count={selectedHotel.starRating || 0} />
                    <CategoryBadge cat={selectedHotel.hotelCategory} />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setShowGroupTripModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-black text-white shadow-lg shadow-violet-600/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
                    <Users size={16} /> Book Group Trip
                  </button>
                  <button onClick={() => handleOpenGroupEnquiry('hotel', selectedHotel)}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
                    <Users size={16} /> Group Enquiry
                  </button>
                  <button onClick={() => triggerBooking()}
                    className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-sm font-black text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer">
                    <Plus size={16} /> Book a Room
                  </button>
                </div>
              </div>
              {/* Info chips */}
              <div className="flex flex-wrap gap-2 text-[10px]">
                {selectedHotel.checkInTime && <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-bold"><Clock size={9} /> Check-in: {selectedHotel.checkInTime}</span>}
                {selectedHotel.checkOutTime && <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-bold"><Clock size={9} /> Check-out: {selectedHotel.checkOutTime}</span>}
                {selectedHotel.phone && <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-bold"><Phone size={9} /> {selectedHotel.phone}</span>}
                {selectedHotel.breakfastTimings && <span className="flex items-center gap-1 bg-amber-900/20 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-400 font-bold"><Coffee size={9} /> Breakfast: {selectedHotel.breakfastTimings}</span>}
                {selectedHotel.poolTimings && <span className="flex items-center gap-1 bg-sky-900/20 border border-sky-500/20 px-2.5 py-1 rounded-full text-sky-400 font-bold"><Waves size={9} /> Pool: {selectedHotel.poolTimings}</span>}
                {selectedHotel.gymTimings && <span className="flex items-center gap-1 bg-rose-900/20 border border-rose-500/20 px-2.5 py-1 rounded-full text-rose-400 font-bold"><Dumbbell size={9} /> Gym: {selectedHotel.gymTimings}</span>}
              </div>
            </div>
          </div>

          {/* Sub Navigation: 1-Month Calendar vs Floor Map */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setHotelDetailTab('calendar')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${hotelDetailTab === 'calendar'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
              >
                <Calendar size={14} />
                <span>1-Month Room Availability Calendar</span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {availabilityData?.daysToShow || 30} Days
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHotelDetailTab('floormap')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${hotelDetailTab === 'floormap'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
              >
                <Building2 size={14} />
                <span>Live Floor Map</span>
              </button>
            </div>

            {hotelDetailTab === 'calendar' && (
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCalendarViewMode('list')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${calendarViewMode === 'list' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <List size={13} /> Day List / Matrix
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarViewMode('grid')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${calendarViewMode === 'grid' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                  >
                    <CalendarDays size={13} /> Month Grid
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── TAB 1: 1-MONTH CALENDAR & AVAILABILITY ────────────────────── */}
          {hotelDetailTab === 'calendar' && (
            <div className="space-y-4">
              {/* Hotel Permission & Commission Info Banner */}
              <div className="bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-slate-900 border border-violet-500/20 rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-violet-400 tracking-wider">
                      <Shield size={12} className="text-violet-400" /> Hotel Policy Permission Active
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-bold border border-violet-500/30">
                      {availabilityData?.allowedDaysAhead || 30} Days Forward View
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    The hotel management has permitted you to view live room availability and book dates for the next <b className="text-white">{availabilityData?.daysToShow || 30} days</b>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-right">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Your Commission</span>
                    <span className="text-sm font-black text-emerald-400">
                      {availabilityData?.commissionRate || (selectedHotel as any)?.commissionRate || agent?.commissionRate || 10}%
                    </span>
                  </div>
                </div>
              </div>

              {loadingAvailability ? (
                <div className="h-64 flex flex-col items-center justify-center gap-3 bg-[#090f1e] border border-slate-800 rounded-3xl">
                  <Loader2 className="animate-spin text-violet-500" size={32} />
                  <p className="text-xs text-slate-400 font-bold">Loading real-time 30-day room availability...</p>
                </div>
              ) : !availabilityData?.days || availabilityData.days.length === 0 ? (
                <div className="py-12 text-center bg-[#090f1e] border border-slate-800 rounded-3xl space-y-2">
                  <Calendar size={32} className="text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">No availability data available for this hotel</p>
                </div>
              ) : calendarViewMode === 'list' ? (
                /* ── LIST / MATRIX VIEW ─────────────────────────────────────── */
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 font-bold">
                    <span>Showing forward room availability for {availabilityData.days.length} days</span>
                    <span className="flex items-center gap-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Available</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Few Left</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Sold Out</span>
                    </span>
                  </div>

                  {availabilityData.days.map((day) => {
                    const isSoldOut = day.status === 'SOLD_OUT' || day.availableRooms === 0;
                    const isFew = day.status === 'FEW_LEFT';
                    const isExpanded = expandedDateBreakdown[day.date];
                    const commRate = availabilityData.commissionRate || 10;
                    const earnedCommission = Math.round((day.lowestRate * commRate) / 100);

                    return (
                      <div
                        key={day.date}
                        className={`bg-[#090f1e] border rounded-2xl transition-all overflow-hidden ${isSoldOut
                            ? 'border-slate-800/60 opacity-70'
                            : day.isToday
                              ? 'border-violet-500/60 shadow-lg shadow-violet-950/30'
                              : 'border-slate-800 hover:border-violet-500/30'
                          }`}
                      >
                        <div className="p-3.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                          {/* Date Block */}
                          <div className="flex items-center gap-3 min-w-[150px]">
                            <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black shrink-0 ${day.isToday
                                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                                : day.isWeekend
                                  ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-500/20'
                                  : 'bg-slate-900 text-white border border-slate-800'
                              }`}>
                              <span className="text-sm leading-none">{day.day}</span>
                              <span className="text-[9px] uppercase tracking-wider opacity-80">{day.month}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-white">{day.dayOfWeek}</span>
                                {day.isToday && (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 uppercase">
                                    Today
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">{day.date}</span>
                            </div>
                          </div>

                          {/* Availability Progress & Count */}
                          <div className="flex-1 min-w-[180px]">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-bold flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${isSoldOut ? 'bg-rose-500' : isFew ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                                  }`} />
                                <span className={isSoldOut ? 'text-rose-400 font-black' : isFew ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>
                                  {isSoldOut ? 'Sold Out' : `${day.availableRooms} of ${day.totalRooms} Rooms Free`}
                                </span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold">
                                {day.bookedRooms} Booked
                              </span>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all rounded-full ${isSoldOut
                                    ? 'bg-rose-500 w-full'
                                    : isFew
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  }`}
                                style={{
                                  width: `${Math.min(100, Math.round((day.bookedRooms / (day.totalRooms || 1)) * 100))}%`,
                                }}
                              />
                            </div>
                          </div>

                          {/* Rates & Commission */}
                          <div className="text-right min-w-[130px] shrink-0">
                            <span className="text-[10px] text-slate-500 block">Starting From</span>
                            <div className="text-base font-black text-white">
                              ₹{day.lowestRate.toLocaleString('en-IN')}
                              <span className="text-[9px] font-normal text-slate-400">/nt</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400">
                              Earn ₹{earnedCommission.toLocaleString('en-IN')}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {day.roomTypes && day.roomTypes.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setExpandedDateBreakdown(p => ({ ...p, [day.date]: !isExpanded }))}
                                className="px-2.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>Rooms</span>
                                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isSoldOut}
                              onClick={() => {
                                const availRt = day.roomTypes.find((r: any) => r.available > 0) || day.roomTypes[0];
                                triggerBooking(
                                  availRt?.name,
                                  availRt?.baseRate || day.lowestRate,
                                  `Agent direct booking for ${day.date}`,
                                  day.date,
                                  day.nextDate
                                );
                              }}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md ${isSoldOut
                                  ? 'bg-slate-800/80 text-slate-600 cursor-not-allowed border border-slate-700/60'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/30 active:scale-95 cursor-pointer'
                                }`}
                            >
                              <Plus size={13} />
                              <span>{isSoldOut ? 'Sold Out' : 'Book Date'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Room Type Breakdown Accordion */}
                        {isExpanded && day.roomTypes && day.roomTypes.length > 0 && (
                          <div className="px-4 py-3 bg-slate-950/70 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                            {day.roomTypes.map((rt: any) => {
                              const rtAvail = rt.available > 0;
                              return (
                                <div
                                  key={rt.id || rt.name}
                                  className={`rounded-xl p-2.5 border flex items-center justify-between gap-2 ${rtAvail
                                      ? 'bg-[#090f1e] border-slate-800 hover:border-violet-500/40'
                                      : 'bg-slate-900/30 border-slate-900 opacity-60'
                                    }`}
                                >
                                  <div>
                                    <p className="font-bold text-white text-[11px]">{rt.name}</p>
                                    <p className="text-[10px] text-slate-400">
                                      ₹{rt.baseRate.toLocaleString('en-IN')}/nt ·{' '}
                                      <span className={rtAvail ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                                        {rt.available} Free
                                      </span>
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={!rtAvail}
                                    onClick={() => triggerBooking(rt.name, rt.baseRate, '', day.date, day.nextDate)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-black ${rtAvail
                                        ? 'bg-violet-600/30 hover:bg-violet-600 text-violet-300 hover:text-white border border-violet-500/30 cursor-pointer'
                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                      }`}
                                  >
                                    {rtAvail ? 'Select →' : 'Full'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ── MONTH GRID VIEW ────────────────────────────────────────── */
                <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-4 space-y-4">
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="text-center text-[10px] font-black uppercase text-slate-500 py-1">
                        {d}
                      </div>
                    ))}
                    {availabilityData.days.map((day) => {
                      const isSoldOut = day.status === 'SOLD_OUT' || day.availableRooms === 0;
                      const isFew = day.status === 'FEW_LEFT';
                      return (
                        <div
                          key={day.date}
                          className={`rounded-2xl p-2.5 border flex flex-col justify-between transition-all min-h-[95px] ${isSoldOut
                              ? 'bg-rose-950/10 border-rose-500/10 opacity-60'
                              : day.isToday
                                ? 'bg-violet-950/30 border-violet-500/50 shadow-md shadow-violet-950/40'
                                : 'bg-slate-900/60 border-slate-800/80 hover:border-violet-500/40 hover:bg-slate-900'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-black ${day.isToday ? 'text-violet-300' : 'text-white'}`}>
                              {day.day} {day.month}
                            </span>
                            {day.isToday && (
                              <span className="text-[7px] font-black px-1 rounded bg-violet-600 text-white">
                                TODAY
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5 my-1">
                            <div className={`text-[10px] font-bold ${isSoldOut ? 'text-rose-400' : isFew ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                              {isSoldOut ? '0 Free' : `${day.availableRooms} Free`}
                            </div>
                            <div className="text-[11px] font-black text-white">
                              ₹{day.lowestRate.toLocaleString('en-IN')}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isSoldOut}
                            onClick={() => {
                              const availRt = day.roomTypes.find((r: any) => r.available > 0) || day.roomTypes[0];
                              triggerBooking(
                                availRt?.name,
                                availRt?.baseRate || day.lowestRate,
                                `Agent booking for ${day.date}`,
                                day.date,
                                day.nextDate
                              );
                            }}
                            className={`w-full py-1 rounded-lg text-[9px] font-black text-center transition-all ${isSoldOut
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm'
                              }`}
                          >
                            {isSoldOut ? 'Full' : 'Book'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB 2: LIVE FLOOR MAP & ROOM STATS ─────────────────────────── */}
          {hotelDetailTab === 'floormap' && (
            <div className="space-y-6">
              {/* Room Stats */}
              <div className="grid grid-cols-4 gap-3 text-center">
                {[
                  { label: 'Total', value: roomSummary?.total || hotelRooms.length, color: 'text-white', bg: 'bg-[#090f1e] border-slate-800' },
                  { label: 'Available', value: roomSummary?.available || 0, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/20' },
                  { label: 'Occupied', value: roomSummary?.occupied || 0, color: 'text-rose-400', bg: 'bg-rose-950/30 border-rose-500/20' },
                  { label: 'Dirty/Maint', value: (roomSummary?.maintenance || 0) + (roomSummary?.dirty || 0), color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/20' },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl border p-3 ${s.bg}`}>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Room Categories */}
              {roomTypes.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-white flex items-center gap-2"><Sparkles size={14} className="text-violet-400" /> Room Categories & Pricing</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {roomTypes.map((rt: any) => (
                      <div key={rt.name} className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-violet-500/30 transition-colors">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-black text-white">{rt.name}</p>
                              <p className="text-[9px] text-slate-500 font-bold">{rt.code}</p>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${rt.available > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                              {rt.available}/{rt.total} Free
                            </span>
                          </div>
                          <p className="text-lg font-black text-violet-300">₹{rt.baseRate.toLocaleString('en-IN')}</p>
                          <p className="text-[9px] text-slate-500">per night</p>
                        </div>
                        <button onClick={() => triggerBooking(rt.name, rt.baseRate)} disabled={rt.available === 0}
                          className={`mt-3 w-full py-2 rounded-xl text-[10px] font-black transition-all ${rt.available > 0 ? 'bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:bg-violet-600 hover:text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}>
                          {rt.available > 0 ? `Book ${rt.name} →` : 'Not Available'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Note: Room numbers are allotted by the hotel front desk */}
              <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 px-4 py-3 flex items-center gap-3">
                <Building2 size={16} className="text-violet-400 shrink-0" />
                <p className="text-[11px] text-slate-300">
                  <span className="font-bold text-white">Category-Only Booking:</span> Select your preferred room category above. Specific room numbers will be allotted by the hotel front desk upon confirmation.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW: BOOK
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'book' && agent && selectedHotel && (
        <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">
          <div className="bg-[#090f1e] border border-violet-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center"><Building2 size={18} className="text-violet-400" /></div>
            <div>
              <p className="text-xs text-slate-400">Booking for</p>
              <p className="text-sm font-black text-white">{selectedHotel.name}</p>
              {selectedHotel.city && <p className="text-[10px] text-slate-500">{selectedHotel.city}</p>}
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-slate-400">Your commission</p>
              <p className="text-base font-black text-violet-400">{(selectedHotel as any)?.commissionRate ?? agent.commissionRate}%</p>
            </div>
          </div>
          {/* Booking Type Switcher */}
          <div className="flex gap-2 p-1 bg-[#090f1e] border border-slate-800 rounded-2xl">
            <button
              type="button"
              className="flex-1 py-2 rounded-xl text-xs font-black bg-violet-600 text-white shadow-md"
            >
              👤 Individual / Family Booking
            </button>
            <button
              type="button"
              onClick={() => setShowGroupTripModal(true)}
              className="flex-1 py-2 rounded-xl text-xs font-black text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Users size={13} className="text-emerald-400" />
              <span>👥 Group Trip Package</span>
            </button>
          </div>

          <form onSubmit={handleSubmitBooking} className="space-y-4">
            <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Guest Information</p>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Guest Full Name *</label>
                <input required type="text" placeholder="e.g. Ramesh Sharma" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  value={bookingForm.guestName} onChange={e => setBookingForm(f => ({ ...f, guestName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Mobile</label>
                  <input type="text" placeholder="+91 9876543210" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.guestPhone} onChange={e => setBookingForm(f => ({ ...f, guestPhone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nationality</label>
                  <input type="text" placeholder="Indian" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.guestNationality} onChange={e => setBookingForm(f => ({ ...f, guestNationality: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Adults</label>
                  <input type="number" min="1" max="10" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.adults} onChange={e => setBookingForm(f => ({ ...f, adults: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Children</label>
                  <input type="number" min="0" max="10" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.children} onChange={e => setBookingForm(f => ({ ...f, children: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* ── GUEST KYC SECTION ─────────────────────────────────────────── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  🪪 Guest ID Verification (KYC)
                </p>
                {!showKyc && (
                  <button type="button" onClick={() => setShowKyc(true)}
                    className="text-[10px] font-black text-amber-400 hover:text-amber-300 border border-amber-500/30 bg-amber-500/10 px-3 py-1 rounded-lg transition-all">
                    Add KYC Documents
                  </button>
                )}
                {showKyc && (
                  <button type="button" onClick={() => setShowKyc(false)}
                    className="text-[10px] font-black text-slate-500 hover:text-white border border-slate-700 bg-slate-900 px-3 py-1 rounded-lg transition-all">
                    Hide KYC
                  </button>
                )}
              </div>
              {showKyc && (
                <GuestKycCapture
                  guestName={bookingForm.guestName}
                  onKycComplete={(data) => { setGuestKyc(data); setShowKyc(false); }}
                  onSkip={() => setShowKyc(false)}
                />
              )}
              {guestKyc?.verified && !showKyc && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2 flex items-center gap-2 text-xs">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <span className="text-emerald-300 font-black">KYC documents saved</span>
                  {guestKyc.aadhaarNumber && <span className="text-slate-500">Aadhaar: XXXX {guestKyc.aadhaarNumber.slice(-4)}</span>}
                  {guestKyc.panNumber && <span className="text-slate-500">PAN: {guestKyc.panNumber}</span>}
                </div>
              )}
            </div>
            {/* ── STAY & ROOM SELECTION WITH MULTI-ROOM SUPPORT ── */}
            <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={12} /> Stay Dates
                </p>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                  {calcNights(bookingForm.checkIn, bookingForm.checkOut)} {calcNights(bookingForm.checkIn, bookingForm.checkOut) === 1 ? 'Night' : 'Nights'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Check-In *</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.checkIn}
                    onChange={(e) => handleDateChange('checkIn', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Check-Out *</label>
                  <input
                    required
                    type="date"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.checkOut}
                    onChange={(e) => handleDateChange('checkOut', e.target.value)}
                  />
                </div>
              </div>

              {/* ── ROOM QUANTITY & SELECTION ── */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                      <BedDouble size={13} /> Rooms Quantity (Single / Multiple)
                    </p>
                    <p className="text-[10px] text-slate-500">Book single or multiple rooms for your guest</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-bold">Total:</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-violet-600/30 text-violet-300 font-black text-xs border border-violet-500/40">
                      {bookingForm.numberOfRooms} {bookingForm.numberOfRooms === 1 ? 'Room' : 'Rooms'}
                    </span>
                  </div>
                </div>

                {/* Quick Room Count Shortcuts: 1, 2, 3, 4, 5+ */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Quick Count:</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1, 2, 3, 4, 5].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleSetQuickRoomCount(cnt)}
                        className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${bookingForm.numberOfRooms === cnt
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/30 border border-violet-400/50'
                            : 'bg-[#050a14] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                          }`}
                      >
                        {cnt} {cnt === 1 ? 'Room' : 'Rooms'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Room Categories with +/- Steppers */}
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold text-slate-400">Select Room Categories & Quantities:</p>
                  {selectedHotel.roomTypes && selectedHotel.roomTypes.length > 0 ? (
                    selectedHotel.roomTypes.map((rt) => {
                      const qty = bookingForm.roomQuantities[rt.name] || 0;
                      return (
                        <div
                          key={rt.name}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${qty > 0
                              ? 'bg-violet-950/20 border-violet-500/40'
                              : 'bg-[#050a14] border-slate-800/80 hover:border-slate-700'
                            }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-white truncate">{rt.name}</span>
                              {qty > 0 && (
                                <span className="text-[9px] font-black bg-violet-600 text-white px-1.5 py-0.2 rounded-md">
                                  {qty}x
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              ₹{rt.baseRate.toLocaleString('en-IN')}/night • Max {rt.maxOccupancy || 2} Pax/room
                            </p>
                          </div>

                          {/* Stepper: [-]  [qty]  [+] */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateRoomQuantity(rt.name, -1)}
                              disabled={qty === 0}
                              className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 flex items-center justify-center font-black text-sm active:scale-95 transition-all cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-xs font-black text-white">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateRoomQuantity(rt.name, 1)}
                              className="w-7 h-7 rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center font-black text-sm active:scale-95 transition-all cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 bg-[#050a14] border border-slate-800 rounded-xl">
                      <label className="block text-[10px] font-bold text-slate-400 mb-1">Room Type</label>
                      <input
                        type="text"
                        value={bookingForm.roomType}
                        onChange={(e) => setBookingForm((f) => ({ ...f, roomType: e.target.value }))}
                        className="w-full bg-[#090f1e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                        placeholder="e.g. Standard Room"
                      />
                    </div>
                  )}
                </div>

                {/* Auto Calculated Summary Display */}
                <div className="bg-[#050a14] border border-violet-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Selected Configuration:</span>
                    <span className="font-bold text-white text-xs">
                      {bookingForm.roomType || '1 Room'} ({calcNights(bookingForm.checkIn, bookingForm.checkOut)}{' '}
                      {calcNights(bookingForm.checkIn, bookingForm.checkOut) === 1 ? 'Night' : 'Nights'})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Total Amount</span>
                    <span className="text-base font-black text-emerald-400">
                      ₹{Number(bookingForm.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Editable Total Amount Field */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Room Amount (₹){' '}
                    {bookingForm.totalAmount && agent
                      ? `→ Commission: ₹${(
                        (Number(bookingForm.totalAmount) *
                          ((selectedHotel as any)?.commissionRate ?? agent.commissionRate)) /
                        100
                      ).toFixed(0)} (${(selectedHotel as any)?.commissionRate ?? agent.commissionRate
                      }%)`
                      : ''}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₹</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 5000"
                      className="w-full bg-[#050a14] border border-slate-800 rounded-xl pl-7 pr-3 py-2.5 text-sm font-black text-white focus:outline-none focus:border-violet-500"
                      value={bookingForm.totalAmount}
                      onChange={(e) => setBookingForm((f) => ({ ...f, totalAmount: e.target.value }))}
                    />
                  </div>
                  <p className="text-[9.5px] text-slate-500 mt-1">
                    💡 Amount is auto-calculated based on rooms and nights. You can adjust this if special rates apply.
                  </p>
                </div>

                {bookingForm.notes && (
                  <div className="bg-violet-950/20 border border-violet-500/20 rounded-xl px-3 py-2 text-[10px] text-violet-400 font-bold">
                    📍 {bookingForm.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Pool & Spa Add-ons Section */}
            <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Hotel Add-Ons & Packages</p>

              {/* Swimming Pool Access Toggle */}
              <div className="bg-[#050a14] border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-950/40 border border-sky-500/30 flex items-center justify-center">
                      <Waves size={16} className="text-sky-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Swimming Pool Access Pass</p>
                      <p className="text-[9px] text-slate-400">Includes pool towel & changing locker</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bookingForm.includePoolAccess}
                    onChange={e => setBookingForm(f => ({ ...f, includePoolAccess: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-violet-500 bg-[#090f1e]"
                  />
                </label>

                {bookingForm.includePoolAccess && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Number of Pool Passes:</span>
                    <select
                      value={bookingForm.poolPassCount}
                      onChange={e => setBookingForm(f => ({ ...f, poolPassCount: e.target.value }))}
                      className="bg-[#090f1e] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="1">1 Pass</option>
                      <option value="2">2 Passes</option>
                      <option value="3">3 Passes</option>
                      <option value="4">4 Passes (Family Pass)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Spa Package Toggle */}
              <div className="bg-[#050a14] border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-950/40 border border-pink-500/30 flex items-center justify-center">
                      <Sparkles size={16} className="text-pink-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Spa & Wellness Package</p>
                      <p className="text-[9px] text-slate-400">Therapeutic massage & relaxation session</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bookingForm.includeSpaPackage}
                    onChange={e => setBookingForm(f => ({ ...f, includeSpaPackage: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-violet-500 bg-[#090f1e]"
                  />
                </label>

                {bookingForm.includeSpaPackage && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400">Select Spa Service:</label>
                    <select
                      value={bookingForm.spaServiceType}
                      onChange={e => setBookingForm(f => ({ ...f, spaServiceType: e.target.value }))}
                      className="w-full bg-[#090f1e] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="Full Body Ayurvedic Massage (60 min)">Full Body Ayurvedic Massage (60 min)</option>
                      <option value="Aromatherapy & Reflexology (45 min)">Aromatherapy & Reflexology (45 min)</option>
                      <option value="Couples Spa & Jacuzzi Package">Couples Spa & Jacuzzi Package</option>
                      <option value="Express Head & Shoulder Relief (30 min)">Express Head & Shoulder Relief (30 min)</option>
                      <option value="Herbal Steam Bath & Facial Package">Herbal Steam Bath & Facial Package</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider mb-2">Special Requests</p>
              <textarea rows={2} placeholder="Extra bed, early check-in, anniversary decoration..." className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                value={bookingForm.specialRequests} onChange={e => setBookingForm(f => ({ ...f, specialRequests: e.target.value }))} />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-black text-white shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><CheckCircle2 size={16} /> Submit Booking Request</>}
            </button>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW: DASHBOARD
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'dashboard' && agent && (
        <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-5">
          <div className="rounded-3xl bg-gradient-to-br from-violet-950/60 to-indigo-950/40 border border-violet-500/20 p-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/20 flex items-center justify-center">
                <span className="text-3xl font-black text-violet-200">{agent.name[0]}</span>
              </div>
              <div>
                <p className="text-xl font-black text-white">{agent.name}</p>
                {agent.companyName && <p className="text-sm text-slate-400">{agent.companyName}</p>}
                {agent.email && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={10} />{agent.email}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-black bg-violet-500/20 border border-violet-500/30 text-violet-300 px-2.5 py-1 rounded-full">{agent.agentCode}</span>
                  <span className="text-[10px] font-black bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full">{agent.commissionRate}% Commission</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView('home')} className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black text-slate-300 hover:text-white flex items-center gap-1.5">
                <Home size={13} /> Find Hotels
              </button>
              <button onClick={() => refreshAgent()} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white" title="Refresh Bookings">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Bookings', value: agentStats?.totalBookings || 0, color: 'text-sky-400', bg: 'bg-sky-950/30 border-sky-500/20' },
              { label: 'Confirmed', value: agentStats?.confirmedBookings || 0, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/20' },
              { label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/20' },
              { label: 'Pending Payout', value: `₹${commPending.toLocaleString('en-IN')}`, color: 'text-rose-400', bg: 'bg-rose-950/30 border-rose-500/20' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {(['overview', 'today', 'bookings', 'commission'] as const).map(t => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayCount = bookingsList.filter(b => {
                const cIn = new Date(b.checkIn).toISOString().split('T')[0];
                const cAt = new Date(b.createdAt).toISOString().split('T')[0];
                return cIn === todayStr || cAt === todayStr;
              }).length;

              return (
                <button key={t} onClick={() => setDashTab(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${dashTab === t ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
                  {t === 'overview' ? '🏠 Overview' : t === 'today' ? `📅 Today (${todayCount})` : t === 'bookings' ? '📋 My Bookings' : '💰 Commission'}
                </button>
              );
            })}
          </div>

          {dashTab === 'overview' && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recent Bookings</p>
              {bookingsList.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                  <Calendar size={32} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No bookings yet.</p>
                  <button onClick={() => setView('home')} className="mt-3 px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-black">Browse Hotels →</button>
                </div>
              ) : bookingsList.slice(0, 5).map(b => {
                const cfg = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING;
                return (
                  <div key={b.id} className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-white">{b.guestName}</p>
                      <p className="text-[10px] text-slate-500">{new Date(b.checkIn).toLocaleDateString('en-IN')} → {new Date(b.checkOut).toLocaleDateString('en-IN')} · {b.roomType}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-black ${b.commissionPaid ? 'text-emerald-400' : 'text-amber-400'}`}>₹{b.commission.toLocaleString('en-IN')}</p>
                        <p className="text-[8px] text-slate-600">{b.commissionPaid ? '✓ Paid' : 'Pending'}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Today's Bookings Tab */}
          {dashTab === 'today' && (() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayList = bookingsList.filter(b => {
              const cIn = new Date(b.checkIn).toISOString().split('T')[0];
              const cAt = new Date(b.createdAt).toISOString().split('T')[0];
              return cIn === todayStr || cAt === todayStr;
            });
            const todayComm = todayList.reduce((s, b) => s + b.commission, 0);

            return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-violet-950/40 via-indigo-950/40 to-slate-950 border border-violet-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Today's Activity ({new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})</p>
                    <p className="text-xl font-black text-white">{todayList.length} Booking{todayList.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Today's Earned Commission</p>
                    <p className="text-xl font-black text-amber-400">₹{todayComm.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {todayList.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-2">
                    <Calendar size={36} className="mx-auto text-slate-700" />
                    <p className="text-sm font-black text-slate-400">No Bookings for Today</p>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">Bookings created today or checking in today will appear here.</p>
                    <button onClick={() => setView('home')} className="mt-3 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-black shadow-lg shadow-violet-600/20">
                      + Create Booking Today
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayList.map(b => {
                      const cfg = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING;
                      const nights = Math.max(1, Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000));
                      return (
                        <div key={b.id} className="bg-[#090f1e] border border-violet-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black bg-violet-600/30 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-md">TODAY</span>
                                <p className="text-sm font-black text-white">{b.guestName}</p>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">{b.guestPhone || 'No phone'} · {b.roomType} · {nights} Night{nights > 1 ? 's' : ''}</p>
                            </div>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          </div>

                          {((b as any).includePoolAccess || (b as any).includeSpaPackage) && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {(b as any).includePoolAccess && (
                                <span className="text-[9px] font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Waves size={10} /> Pool Access ({(b as any).poolPassCount || 1} Pass)
                                </span>
                              )}
                              {(b as any).includeSpaPackage && (
                                <span className="text-[9px] font-bold text-pink-400 bg-pink-950/40 border border-pink-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Sparkles size={10} /> Spa: {(b as any).spaServiceType || 'Wellness Package'}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-900 rounded-xl p-2">
                              <p className="text-[8px] text-slate-500 uppercase font-bold">Check-In</p>
                              <p className="font-black text-white text-[11px]">{new Date(b.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-2">
                              <p className="text-[8px] text-slate-500 uppercase font-bold">Check-Out</p>
                              <p className="font-black text-white text-[11px]">{new Date(b.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-2">
                              <p className="text-[8px] text-slate-500 uppercase font-bold">Total Amount</p>
                              <p className="font-black text-violet-300 text-[11px]">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><IndianRupee size={10} className="text-amber-400" /> Today's Commission</span>
                            <span className={`text-sm font-black ${b.commissionPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                              ₹{b.commission.toLocaleString('en-IN')} {b.commissionPaid ? '✓ Paid' : '(Pending)'}
                            </span>
                          </div>

                          {/* Action Bar: Proof Images & Edit Booking */}
                          {(() => {
                            const kyc = parseKycFromNotes(b.notes);
                            const docCount = kyc.docs.length;
                            return (
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                                <button
                                  type="button"
                                  onClick={() => setSelectedBookingForProof(b)}
                                  className="px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                  title="View or upload customer ID proof images"
                                >
                                  <CreditCard size={13} className="text-violet-400" />
                                  <span>Customer Proof Images</span>
                                  {docCount > 0 ? (
                                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-black">
                                      {docCount}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-black">
                                      + Add
                                    </span>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedMasterInvoiceBooking(b)}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                  title="View Master Tax Invoice, Member Manifest & WhatsApp Bill"
                                >
                                  <FileText size={13} className="text-emerald-400" />
                                  <span>Master Bill & Manifest</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedBookingForEdit(b)}
                                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                                  title="Edit booking (will be sent for hotel approval)"
                                >
                                  <Edit3 size={13} className="text-indigo-400" />
                                  <span>Edit Booking</span>
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {dashTab === 'bookings' && (
            <div className="space-y-3">
              {bookingsList.length === 0 ? (
                <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <Handshake size={36} className="mx-auto text-slate-700" />
                  <p className="text-sm font-black text-slate-300">No bookings submitted yet</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">Bookings you submit for guests will appear here with live status & commission tracking.</p>
                  <button onClick={() => setView('home')} className="mt-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs">
                    Browse Hotels & Book
                  </button>
                </div>
              ) : (
                bookingsList.map(b => {
                  const cfg = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING;
                  const nights = Math.max(1, Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000));
                  return (
                    <div key={b.id} className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-white">{b.guestName}</p>
                            {b.notes?.includes('[GROUP_TRIP_DATA:') && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center gap-1">
                                <Users size={10} /> Group Trip ({b.adults} Pax)
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">{b.guestPhone || 'No phone'} · {b.adults}A {b.children ? `${b.children}C` : ''}</p>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      {((b as any).includePoolAccess || (b as any).includeSpaPackage) && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {(b as any).includePoolAccess && (
                            <span className="text-[9px] font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Waves size={10} /> Pool Access ({(b as any).poolPassCount || 1} Pass)
                            </span>
                          )}
                          {(b as any).includeSpaPackage && (
                            <span className="text-[9px] font-bold text-pink-400 bg-pink-950/40 border border-pink-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Sparkles size={10} /> Spa: {(b as any).spaServiceType || 'Wellness Package'}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { label: 'Check-In', value: new Date(b.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) },
                          { label: 'Nights', value: String(nights) },
                          { label: 'Room', value: b.roomType },
                          { label: 'Amount', value: `₹${b.totalAmount.toLocaleString('en-IN')}` },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-900 rounded-xl p-2">
                            <p className="text-[8px] text-slate-500 uppercase font-bold">{s.label}</p>
                            <p className="font-black text-white text-[11px] truncate">{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between bg-slate-900 rounded-xl px-3 py-2">
                        <span className="text-[10px] text-slate-500 font-bold">Your Commission</span>
                        <span className={`text-sm font-black ${b.commissionPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                          ₹{b.commission.toLocaleString('en-IN')} {b.commissionPaid ? '✓ Credited' : '(Pending)'}
                        </span>
                      </div>

                      {/* Action Bar: Proof Images & Edit Booking */}
                      {(() => {
                        const kyc = parseKycFromNotes(b.notes);
                        const docCount = kyc.docs.length;
                        return (
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                            <button
                              type="button"
                              onClick={() => setSelectedBookingForProof(b)}
                              className="px-3 py-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                              title="View or upload customer ID proof images"
                            >
                              <CreditCard size={13} className="text-violet-400" />
                              <span>Customer Proof Images</span>
                              {docCount > 0 ? (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-black">
                                  {docCount}
                                </span>
                              ) : (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-full font-black">
                                  + Add
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedMasterInvoiceBooking(b)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                              title="View Master Tax Invoice, Member Manifest & WhatsApp Bill"
                            >
                              <FileText size={13} className="text-emerald-400" />
                              <span>Master Bill & Manifest</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedBookingForEdit(b)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                              title="Edit booking (will be sent for hotel approval)"
                            >
                              <Edit3 size={13} className="text-indigo-400" />
                              <span>Edit Booking</span>
                            </button>
                          </div>
                        );
                      })()}
                    </div>
                  );
                }))}
            </div>
          )}

          {dashTab === 'commission' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/20' },
                  { label: 'Credited', value: `₹${(agentStats?.commissionPaid || 0).toLocaleString('en-IN')}`, color: 'text-indigo-400', bg: 'bg-indigo-950/30 border-indigo-500/20' },
                  { label: 'Pending', value: `₹${commPending.toLocaleString('en-IN')}`, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/20' },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl border p-3 ${s.bg}`}>
                    <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[8px] text-slate-500 uppercase font-bold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {bookingsList.map(b => (
                  <div key={b.id} className="bg-[#090f1e] border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">{b.guestName}</p>
                      <p className="text-[9px] text-slate-500">{new Date(b.checkIn).toLocaleDateString('en-IN')} · {b.roomType} · {b.status}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${b.commissionPaid ? 'text-emerald-400' : 'text-amber-400'}`}>₹{b.commission.toLocaleString('en-IN')}</p>
                      <p className="text-[8px] text-slate-600">{b.commissionPaid ? '✓ Paid' : 'Pending'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── STICKY MOBILE BOTTOM NAVIGATION BAR ───────────────────────────────── */}
      {view !== 'auth' && agent && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#070c18]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 shadow-2xl">
          <div className="max-w-md mx-auto flex items-center justify-between">
            {/* 1. Hotels */}
            <button
              onClick={() => { setSelectedHotel(null); setHomeTab('hotels'); setView('home'); }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${view === 'home' && homeTab === 'hotels' ? 'text-violet-400 font-black' : 'text-slate-500 hover:text-slate-300 font-bold'
                }`}
            >
              <Building2 size={17} />
              <span className="text-[9px] mt-0.5">Hotels</span>
            </button>

            {/* 2. Local Services (Buses, Taxis, Bikes, Sightseeing) */}
            <button
              onClick={() => { setSelectedHotel(null); setHomeTab('local'); setView('home'); }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${view === 'home' && homeTab === 'local' ? 'text-sky-400 font-black' : 'text-slate-500 hover:text-slate-300 font-bold'
                }`}
            >
              <Bus size={17} />
              <span className="text-[9px] mt-0.5">Local</span>
            </button>

            {/* 3. Group Enquiry */}
            <button
              onClick={() => handleOpenGroupEnquiry('hotel', selectedHotel || undefined)}
              className="flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all text-amber-400 hover:text-amber-300 font-bold"
            >
              <div className="w-5 h-5 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Users size={12} className="text-amber-400" />
              </div>
              <span className="text-[9px] mt-0.5">Group</span>
            </button>

            {/* 4. My Bookings */}
            <button
              onClick={() => { setView('dashboard'); setDashTab('bookings'); refreshAgent(); }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${view === 'dashboard' && dashTab === 'bookings' ? 'text-violet-400 font-black' : 'text-slate-500 hover:text-slate-300 font-bold'
                }`}
            >
              <Bed size={17} />
              <span className="text-[9px] mt-0.5">Bookings</span>
            </button>

            {/* 5. Commission */}
            <button
              onClick={() => { setView('dashboard'); setDashTab('commission'); refreshAgent(); }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${view === 'dashboard' && dashTab === 'commission' ? 'text-emerald-400 font-black' : 'text-slate-500 hover:text-slate-300 font-bold'
                }`}
            >
              <IndianRupee size={17} />
              <span className="text-[9px] mt-0.5">Earnings</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── GROUP ENQUIRY MODAL (Hotels, Buses, Taxis, Tempo, Bikes, Sightseeing) ─── */}
      {showGroupEnquiry && (
        <GroupEnquiryModal
          agentId={agent?.id || ''}
          agentName={agent?.name || 'Agent Portal Lead'}
          agentCode={agent?.agentCode || 'AGT-PORTAL'}
          preselectedService={enquiryService || undefined}
          preselectedItem={enquiryItem || undefined}
          onClose={() => {
            setShowGroupEnquiry(false);
            setEnquiryService(null);
            setEnquiryItem(null);
          }}
        />
      )}

      {/* ─── CUSTOMER PROOF DOCUMENTS MODAL (View & Upload Images) ─── */}
      {selectedBookingForProof && (
        <ProofDocumentsModal
          bookingId={selectedBookingForProof.id}
          guestName={selectedBookingForProof.guestName}
          notes={selectedBookingForProof.notes}
          canUpload={true}
          onClose={() => setSelectedBookingForProof(null)}
          onUpdated={async (updatedNotes) => {
            if (agent?.id) await refreshAgent(agent.id);
            setSelectedBookingForProof((prev: any) =>
              prev ? { ...prev, notes: updatedNotes } : null
            );
          }}
        />
      )}

      {/* ─── EDIT AGENT BOOKING MODAL (Updates & Sends for Hotel Approval) ─── */}
      {selectedBookingForEdit && (
        <EditAgentBookingModal
          booking={selectedBookingForEdit}
          agentCommissionRate={agent?.commissionRate || 10}
          onClose={() => setSelectedBookingForEdit(null)}
          onSuccess={async () => {
            if (agent?.id) await refreshAgent(agent.id);
          }}
        />
      )}

      {/* ─── GROUP TRIP & TOUR BOOKING MODAL ─── */}
      {showGroupTripModal && agent && (selectedHotel || hotels[0]) && (
        <GroupTripModal
          agent={agent}
          selectedHotel={selectedHotel || hotels[0]}
          onClose={() => setShowGroupTripModal(false)}
          onSuccess={async (newBooking) => {
            if (agent?.id) await refreshAgent(agent.id);
            setView('dashboard');
            setDashTab('bookings');
            if (newBooking) {
              setSelectedMasterInvoiceBooking(newBooking);
            }
          }}
        />
      )}

      {/* ─── AGENT MASTER INVOICE & MANIFEST MODAL ─── */}
      {selectedMasterInvoiceBooking && agent && (
        <AgentMasterInvoiceModal
          booking={selectedMasterInvoiceBooking}
          agent={agent}
          onClose={() => setSelectedMasterInvoiceBooking(null)}
        />
      )}
    </div>
  );
}
