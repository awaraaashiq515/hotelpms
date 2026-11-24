'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, Search, Plus, RefreshCw, Star, Phone, Mail,
  MapPin, Calendar, CreditCard, Shield, User, ArrowRight,
  Filter, Crown, CheckCircle2, XCircle, ChevronRight, Bed,
  Building, UserPlus, FileText, Loader2, Sparkles, X,
  Download, MessageCircle, LayoutGrid, Table, ArrowUpDown,
  History, Clock, Check, Building2
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { QuickReservationModal, type RoomOption } from '@/components/hotel/operations/QuickReservationModal';
import { OwnerVipBookingModal } from '@/components/hotel/bookings/OwnerVipBookingModal';
import { exportHotelPDF, exportHotelCSV } from '@/lib/export-utils';

interface ReservationItem {
  id: string;
  bookingNo: string;
  arrivalDate: string;
  departureDate: string;
  status: string;
  totalAmount: number;
  advanceAmount?: number;
  dueAmount?: number;
  mealPlan?: string;
  roomType?: { name: string };
  rooms?: { room: { roomNumber: string } }[];
}

interface Guest {
  id: string;
  firstName: string;
  lastName?: string;
  mobile?: string;
  email?: string;
  gender?: string;
  nationality?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  gstNumber?: string;
  companyName?: string;
  billingAddress?: string;
  loyaltyPoints: number;
  segment: string;
  createdAt: string;
  updatedAt?: string;
  reservations?: ReservationItem[];
  _count?: { checkIns: number; reservations: number };
}

function getGuestPaymentsReceived(reservations?: ReservationItem[]) {
  if (!reservations || reservations.length === 0) return 0;
  return reservations.reduce((sum, r) => {
    const total = Number(r.totalAmount) || 0;
    const due = r.dueAmount !== undefined && r.dueAmount !== null ? Number(r.dueAmount) : 0;
    const advance = Number(r.advanceAmount) || 0;
    const paid = Math.max(0, advance > 0 && due > 0 ? advance : total - due);
    return sum + (isNaN(paid) ? 0 : paid);
  }, 0);
}

const SEGMENT_CONFIG: Record<string, { label: string; color: string; icon: string; bg: string }> = {
  VIP:         { label: 'VIP', color: 'text-amber-400', icon: '👑', bg: 'bg-amber-500/15 border-amber-500/30' },
  CORPORATE:   { label: 'Corporate', color: 'text-blue-400', icon: '🏢', bg: 'bg-blue-500/15 border-blue-500/30' },
  REGULAR:     { label: 'Regular', color: 'text-slate-400', icon: '👤', bg: 'bg-slate-700/40 border-slate-600/30' },
  BLACKLISTED: { label: 'Blacklisted', color: 'text-red-400', icon: '🚫', bg: 'bg-red-500/15 border-red-500/30' },
  LOYALTY:     { label: 'Loyalty Member', color: 'text-violet-400', icon: '⭐', bg: 'bg-violet-500/15 border-violet-500/30' },
};

export default function GuestsPage() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [roomsList, setRoomsList] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<string>('all');
  const [stayFilter, setStayFilter] = useState<'all' | 'stayed' | 'new'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'stays' | 'spending' | 'name'>('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected Guest for Profile / History Drawer
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  // Booking Modals State
  const [bookingGuest, setBookingGuest] = useState<Guest | null>(null);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [isVipBookingOpen, setIsVipBookingOpen] = useState(false);

  // Add Guest Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    gender: 'Male',
    nationality: 'Indian',
    idType: 'Aadhaar Card',
    idNumber: '',
    address: '',
    companyName: '',
    gstNumber: '',
    billingAddress: '',
    segment: 'REGULAR',
    loyaltyPoints: '100',
  });

  // Loyalty Points Adjustment
  const [showAdjustPoints, setShowAdjustPoints] = useState(false);
  const [adjustMode, setAdjustMode] = useState<'DELTA' | 'SET'>('DELTA');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Fetch guests data
  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/guests?limit=300');
      const json = await res.json();
      if (json.success) {
        setGuests(Array.isArray(json.data) ? json.data : []);
      }
    } catch {
      toast.error('Failed to load guest directory.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available rooms for booking modals
  const loadRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/rooms/board');
      const json = await res.json();
      if (json.success && json.data?.rooms && json.data.rooms.length > 0) {
        const formatted: RoomOption[] = json.data.rooms.map((r: any) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          roomTypeName: r.roomTypeName || r.roomType?.name || 'Standard Room',
          roomTypeId: r.roomTypeId || '',
          baseRate: r.baseRate || 3500,
          maxOccupancy: r.maxOccupancy || 2,
          status: r.status,
          floor: String(r.floor || '1'),
        }));
        setRoomsList(formatted);
      } else {
        const fallbackRes = await fetch('/api/hotel/rooms');
        const fallbackJson = await fallbackRes.json();
        const roomsArr = fallbackJson.data || fallbackJson;
        if (Array.isArray(roomsArr)) {
          const formatted: RoomOption[] = roomsArr.map((r: any) => ({
            id: r.id,
            roomNumber: r.roomNumber,
            roomTypeName: r.roomType?.name || 'Standard Room',
            roomTypeId: r.roomTypeId || '',
            baseRate: r.roomType?.baseRate || 3500,
            maxOccupancy: r.roomType?.capacity || 2,
            status: r.status,
            floor: String(r.floor || '1'),
          }));
          setRoomsList(formatted);
        }
      }
    } catch (err) {
      console.warn('Could not load rooms list for booking wizard:', err);
    }
  }, []);

  useEffect(() => {
    loadGuests();
    loadRooms();
  }, [loadGuests, loadRooms]);

  // Create Guest
  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName) {
      toast.error('First name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Guest added successfully!');
        setShowAddModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          mobile: '',
          email: '',
          gender: 'Male',
          nationality: 'Indian',
          idType: 'Aadhaar Card',
          idNumber: '',
          address: '',
          companyName: '',
          gstNumber: '',
          billingAddress: '',
          segment: 'REGULAR',
          loyaltyPoints: '100',
        });
        loadGuests();
      } else {
        toast.error(json.message || 'Failed to add guest.');
      }
    } catch {
      toast.error('Network error. Failed to add guest.');
    } finally {
      setSubmitting(false);
    }
  };

  // Adjust loyalty points
  const handleAdjustPoints = async (guestId: string) => {
    const val = parseInt(adjustAmount);
    if (isNaN(val)) {
      toast.error('Please enter a valid number of points.');
      return;
    }

    setAdjusting(true);
    try {
      const payload: any = { id: guestId };
      if (adjustMode === 'SET') {
        payload.loyaltyPoints = Math.max(0, val);
      } else {
        payload.deltaPoints = val;
      }

      const res = await fetch('/api/hotel/guests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Loyalty points updated! New balance: ${json.data.loyaltyPoints} Pts`);
        setShowAdjustPoints(false);
        setAdjustAmount('');
        if (selectedGuest && selectedGuest.id === guestId) {
          setSelectedGuest({ ...selectedGuest, loyaltyPoints: json.data.loyaltyPoints });
        }
        loadGuests();
      } else {
        toast.error(json.message || 'Failed to update loyalty points.');
      }
    } catch {
      toast.error('Network error. Failed to update points.');
    } finally {
      setAdjusting(false);
    }
  };

  // Direct Book Room for Guest (Front Desk Wizard)
  const handleOpenBookingForGuest = (guest: Guest) => {
    setSelectedGuest(null);
    setShowAdjustPoints(false);
    setBookingGuest(guest);
    setIsQuickBookingOpen(true);
    toast.info(`Booking form opened for ${guest.firstName}! Details auto-filled.`);
  };

  // Fast VIP Check-In for Guest
  const handleOpenVipBookingForGuest = (guest: Guest) => {
    setSelectedGuest(null);
    setShowAdjustPoints(false);
    setBookingGuest(guest);
    setIsVipBookingOpen(true);
    toast.info(`VIP Fast Check-In opened for ${guest.firstName}! Details auto-filled.`);
  };

  // Memoized auto-fill data for QuickReservationModal
  const initialGuestDataForBooking = useMemo(() => {
    if (!bookingGuest) return null;
    return {
      id: bookingGuest.id,
      firstName: bookingGuest.firstName || '',
      lastName: bookingGuest.lastName || '',
      mobile: bookingGuest.mobile || '',
      email: bookingGuest.email || '',
      idType: bookingGuest.idType || 'Aadhaar Card',
      idNumber: bookingGuest.idNumber || '',
      address: bookingGuest.address || '',
      nationality: bookingGuest.nationality || 'Indian',
      companyName: bookingGuest.companyName || '',
      gstNumber: bookingGuest.gstNumber || '',
      billingAddress: bookingGuest.billingAddress || '',
      segment: bookingGuest.segment || 'REGULAR',
    };
  }, [bookingGuest]);

  // Memoized auto-fill data for OwnerVipBookingModal
  const initialVipGuestDataForBooking = useMemo(() => {
    if (!bookingGuest) return null;
    return {
      id: bookingGuest.id,
      firstName: bookingGuest.firstName || '',
      lastName: bookingGuest.lastName || '',
      name: `${bookingGuest.firstName || ''} ${bookingGuest.lastName || ''}`.trim(),
      mobile: bookingGuest.mobile || '',
      email: bookingGuest.email || '',
    };
  }, [bookingGuest]);

  // Filter & Sort Logic
  const filteredAndSortedGuests = useMemo(() => {
    return guests
      .filter((g) => {
        const q = search.trim().toLowerCase();
        const fullName = `${g.firstName} ${g.lastName || ''}`.toLowerCase();
        const matchesQuery =
          !q ||
          fullName.includes(q) ||
          g.mobile?.toLowerCase().includes(q) ||
          g.email?.toLowerCase().includes(q) ||
          g.nationality?.toLowerCase().includes(q) ||
          g.idNumber?.toLowerCase().includes(q) ||
          g.address?.toLowerCase().includes(q) ||
          g.companyName?.toLowerCase().includes(q);

        const matchesSegment = segment === 'all' || g.segment === segment;

        const staysCount = g.reservations?.length || g._count?.checkIns || 0;
        const matchesStay =
          stayFilter === 'all' ||
          (stayFilter === 'stayed' && staysCount > 0) ||
          (stayFilter === 'new' && staysCount === 0);

        return matchesQuery && matchesSegment && matchesStay;
      })
      .sort((a, b) => {
        const aStays = a.reservations?.length || a._count?.checkIns || 0;
        const bStays = b.reservations?.length || b._count?.checkIns || 0;
        const aSpent = getGuestPaymentsReceived(a.reservations);
        const bSpent = getGuestPaymentsReceived(b.reservations);

        if (sortBy === 'stays') return bStays - aStays;
        if (sortBy === 'spending') return bSpent - aSpent;
        if (sortBy === 'name') return a.firstName.localeCompare(b.firstName);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [guests, search, segment, stayFilter, sortBy]);

  // Overall KPI metrics
  const totalGuests = guests.length;
  const vipCount = guests.filter((g) => g.segment === 'VIP').length;
  const corporateCount = guests.filter((g) => g.segment === 'CORPORATE').length;
  const totalStays = guests.reduce((sum, g) => sum + (g.reservations?.length || g._count?.checkIns || 0), 0);
  const totalRevenue = guests.reduce(
    (sum, g) => sum + getGuestPaymentsReceived(g.reservations),
    0
  );

  // PDF Export
  const handleExportPDF = () => {
    if (!filteredAndSortedGuests.length) return;
    const headers = ['Guest Name', 'Mobile', 'Email', 'Segment', 'KYC ID', 'Stays', 'Total Spent', 'City'];
    const rows = filteredAndSortedGuests.map((g) => [
      `${g.firstName} ${g.lastName || ''}`.trim(),
      g.mobile || '—',
      g.email || '—',
      g.segment,
      g.idType && g.idNumber ? `${g.idType}: ${g.idNumber}` : 'Pending',
      g.reservations?.length || g._count?.checkIns || 0,
      `Rs. ${getGuestPaymentsReceived(g.reservations).toLocaleString('en-IN')}`,
      g.address || g.nationality || '—',
    ]);

    exportHotelPDF(
      headers,
      rows,
      `hotel_customers_directory_${todayStr}`,
      'Hotel Customers & Guest Intelligence Directory',
      {
        hotelName: 'Grand Luxury Hotel & Resort',
        hotelAddress: 'Guest Directory & Customer Relationship Management',
        generatedBy: 'Front Desk / CRM Manager',
        dateRangeFormatted: `Export Date: ${new Date().toLocaleDateString('en-IN')}`,
        summaryCards: [
          { label: 'Total Guests', value: `${totalGuests} Registered` },
          { label: 'VIP Guests', value: `${vipCount} Members` },
          { label: 'Total Stays', value: `${totalStays} Stays` },
          { label: 'Total Revenue', value: `Rs. ${totalRevenue.toLocaleString('en-IN')}` },
        ],
      }
    );
    toast.success('Customer Directory exported as PDF!');
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!filteredAndSortedGuests.length) return;
    const headers = ['First Name', 'Last Name', 'Mobile', 'Email', 'Segment', 'Nationality', 'ID Type', 'ID Number', 'Stays Count', 'Total Spent (INR)', 'Address', 'Joined Date'];
    const rows = filteredAndSortedGuests.map((g) => [
      g.firstName,
      g.lastName || '',
      g.mobile || '',
      g.email || '',
      g.segment,
      g.nationality || 'Indian',
      g.idType || '',
      g.idNumber || '',
      g.reservations?.length || g._count?.checkIns || 0,
      getGuestPaymentsReceived(g.reservations),
      g.address || '',
      new Date(g.createdAt).toISOString().split('T')[0],
    ]);

    exportHotelCSV(headers, rows, `hotel_customers_${todayStr}`, 'Hotel Customers Directory');
    toast.success('Customer Directory exported as CSV!');
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1450px] mx-auto p-4 md:p-6 text-white">
      <Toaster richColors position="top-right" />

      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <Users size={16} />
            </span>
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
              Hotel Customer Management &amp; CRM
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Customers &amp; Guest Profiles
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search returning hotel guests, check their past stays &amp; folios, and book a room directly with auto-filled KYC.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadGuests}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-sm"
            title="Export PDF Report"
          >
            <Download size={13} className="text-rose-400" />
            <span className="hidden sm:inline">PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer shadow-sm"
            title="Export CSV"
          >
            <FileText size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            onClick={() => {
              setBookingGuest(null);
              setIsVipBookingOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Crown size={14} className="fill-slate-950" />
            <span>👑 VIP Fast Check-In</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-xs font-black text-white shadow-lg shadow-rose-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <UserPlus size={14} />
            <span>+ Add New Customer</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/30 via-slate-900/60 to-slate-900/40 border border-rose-500/30 shadow-sm">
          <div className="flex items-center justify-between text-rose-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Database</span>
            <Users size={16} />
          </div>
          <p className="text-2xl md:text-3xl font-black text-white">{totalGuests}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Registered Hotel Customers</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900/60 to-slate-900/40 border border-amber-500/30 shadow-sm">
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider">👑 VIP Members</span>
            <Crown size={16} />
          </div>
          <p className="text-2xl md:text-3xl font-black text-amber-400">{vipCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Privileged &amp; Frequent Guests</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/30 via-slate-900/60 to-slate-900/40 border border-indigo-500/30 shadow-sm">
          <div className="flex items-center justify-between text-indigo-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider">Completed Stays</span>
            <Bed size={16} />
          </div>
          <p className="text-2xl md:text-3xl font-black text-indigo-300">{totalStays}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Checked-Out Guest Visits</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900/60 to-slate-900/40 border border-emerald-500/30 shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider">Guest Lifetime Revenue</span>
            <CreditCard size={16} />
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-400">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Direct Hotel Revenue</p>
        </div>
      </div>

      {/* ── SEARCH, FILTER & SORT TOOLBAR ── */}
      <div className="p-4 rounded-2xl bg-[#090f1e]/90 border border-slate-800 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search customer by name, mobile, email, ID proof # (Aadhaar), city, company..."
              className="w-full bg-[#050a14] border border-slate-700/80 focus:border-rose-500 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 placeholder:text-slate-500 font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Controls: Stays filter, Sort, View Switch */}
          <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
            {/* Stays Count Filter */}
            <select
              value={stayFilter}
              onChange={(e) => setStayFilter(e.target.value as any)}
              className="bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">All Customers</option>
              <option value="stayed">🏨 Past Guests (1+ Stays)</option>
              <option value="new">🆕 New Leads (0 Stays)</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="recent">⚡ Most Recently Added</option>
              <option value="stays">🏨 Most Stays First</option>
              <option value="spending">💰 Highest Spenders</option>
              <option value="name">🔤 Alphabetical (A-Z)</option>
            </select>

            {/* Grid vs Table View Switch */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Dense Table View"
              >
                <Table size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Segment Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 border-t border-slate-800/80">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mr-1 shrink-0">
            Segment:
          </span>
          {['all', 'VIP', 'CORPORATE', 'LOYALTY', 'REGULAR', 'BLACKLISTED'].map((s) => {
            const cfg = s === 'all' ? null : SEGMENT_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setSegment(s)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  segment === s
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md shadow-rose-600/20'
                    : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {cfg ? `${cfg.icon} ${cfg.label}` : 'All Customers'}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── RESULTS HEADER ── */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <p>
          Showing <span className="font-bold text-white">{filteredAndSortedGuests.length}</span> customer profile{filteredAndSortedGuests.length === 1 ? '' : 's'}
          {search && <span> matching "<span className="text-rose-400 font-bold">{search}</span>"</span>}
        </p>
        <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
          💡 Click "Book Room Again" to open booking wizard with customer details auto-filled
        </span>
      </div>

      {/* ── CUSTOMER LISTINGS ── */}
      {loading ? (
        <div className="h-72 flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-900/40 border border-slate-800">
          <Loader2 className="animate-spin text-rose-500" size={32} />
          <p className="text-xs font-bold text-slate-400">Loading hotel customer database...</p>
        </div>
      ) : filteredAndSortedGuests.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30 text-slate-400 space-y-3">
          <Users size={44} className="mx-auto text-slate-600" />
          <p className="font-bold text-base text-white">
            {search ? 'No customer found matching your search.' : 'No Guest Records in Database'}
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {search
              ? 'Try searching by phone number, first name, last name, or clear the search filters.'
              : 'Add your first customer profile or create a reservation from the front desk.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <UserPlus size={14} /> Add Customer Profile
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ══════════════════════════════════════════════════════════════════
           GRID CARDS VIEW
           ══════════════════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedGuests.map((guest) => {
            const seg = SEGMENT_CONFIG[guest.segment] || SEGMENT_CONFIG.REGULAR;
            const initials = `${(guest.firstName || 'G')[0]}${(guest.lastName || '')[0] || ''}`.toUpperCase();
            const totalStaysCount = guest.reservations?.length || guest._count?.checkIns || 0;
            const totalSpentAmount = getGuestPaymentsReceived(guest.reservations);
            const lastStay = guest.reservations?.[0];

            return (
              <div
                key={guest.id}
                className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0a101f] to-slate-900/90 border border-slate-800 hover:border-rose-500/50 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  {/* Card Top: Avatar, Name & Segment */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600/30 to-indigo-600/30 border border-rose-500/30 flex items-center justify-center shadow-inner">
                          <span className="text-base font-black text-rose-300">{initials}</span>
                        </div>
                        {guest.segment === 'VIP' && (
                          <span className="absolute -top-1 -right-1 text-xs" title="VIP Guest">
                            👑
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-black text-white truncate group-hover:text-rose-300 transition-colors">
                            {guest.firstName} {guest.lastName || ''}
                          </h3>
                        </div>

                        {/* Contact details */}
                        <div className="space-y-0.5 mt-1">
                          {guest.mobile ? (
                            <div className="flex items-center gap-2 text-[11px] text-slate-300 font-medium">
                              <span className="flex items-center gap-1 truncate font-mono">
                                <Phone size={10} className="text-rose-400 shrink-0" />
                                {guest.mobile}
                              </span>
                              <a
                                href={`https://wa.me/${guest.mobile.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Chat on WhatsApp"
                                className="p-0.5 rounded text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <MessageCircle size={12} />
                              </a>
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500">No phone provided</p>
                          )}

                          {guest.email && (
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                              <Mail size={10} className="text-slate-500 shrink-0" />
                              <span className="truncate">{guest.email}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Segment Pill */}
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${seg.bg} ${seg.color} shrink-0`}
                    >
                      {seg.icon} {seg.label}
                    </span>
                  </div>

                  {/* KYC Proof & City / Address */}
                  <div className="mb-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1 text-[10px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300 font-medium truncate">
                        <Shield size={11} className="text-emerald-400 shrink-0" />
                        {guest.idType && guest.idNumber
                          ? `${guest.idType}: ${guest.idNumber}`
                          : 'KYC Document Pending'}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500 shrink-0">
                        {guest.nationality || 'Indian'}
                      </span>
                    </div>

                    {guest.address && (
                      <p className="text-[9.5px] text-slate-400 truncate flex items-center gap-1">
                        <MapPin size={9} className="text-slate-500 shrink-0" />
                        <span className="truncate">{guest.address}</span>
                      </p>
                    )}

                    {guest.companyName && (
                      <p className="text-[9.5px] text-sky-400 truncate flex items-center gap-1 font-medium">
                        <Building2 size={9} className="shrink-0" />
                        <span className="truncate">{guest.companyName} {guest.gstNumber ? `(GST: ${guest.gstNumber})` : ''}</span>
                      </p>
                    )}
                  </div>

                  {/* Stay Metrics Bar */}
                  <div className="grid grid-cols-3 gap-2 mb-3.5 text-center">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-850">
                      <p className="text-sm font-black text-white">{totalStaysCount}</p>
                      <p className="text-[9px] font-bold uppercase text-slate-500">Stays</p>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-850">
                      <p className="text-xs font-black text-emerald-400 truncate">
                        ₹{totalSpentAmount.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[9px] font-bold uppercase text-slate-500">Total Spent</p>
                    </div>

                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-xs font-black text-amber-400">
                        {guest.loyaltyPoints || 0}
                      </p>
                      <p className="text-[9px] font-bold uppercase text-amber-400/80">Points</p>
                    </div>
                  </div>

                  {/* Last stay snippet */}
                  {lastStay && (
                    <div className="text-[9.5px] text-slate-400 mb-3 px-1 flex items-center justify-between">
                      <span className="flex items-center gap-1 truncate">
                        <Calendar size={10} className="text-indigo-400 shrink-0" />
                        Last Stay: {new Date(lastStay.arrivalDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {lastStay.rooms?.[0]?.room?.roomNumber ? `Rm ${lastStay.rooms[0].room.roomNumber}` : lastStay.roomType?.name || ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Action Buttons: Book Room & View History */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  {/* Re-book Stay Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenBookingForGuest(guest)}
                    className="flex-1 h-8 px-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                    title="Book a new room stay for this guest"
                  >
                    <Bed size={13} />
                    <span>Book Room</span>
                  </button>

                  {/* VIP Fast Check-In */}
                  <button
                    type="button"
                    onClick={() => handleOpenVipBookingForGuest(guest)}
                    className="h-8 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-black flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    title="VIP Fast Check-In"
                  >
                    <Crown size={12} />
                    <span>VIP</span>
                  </button>

                  {/* View History & Profile Drawer */}
                  <button
                    type="button"
                    onClick={() => setSelectedGuest(guest)}
                    className="h-8 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    title="View past stays and profile"
                  >
                    <History size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════
           DENSE TABLE VIEW
           ══════════════════════════════════════════════════════════════════ */
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#090f1e]/90 shadow-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Customer Name</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Segment</th>
                <th className="py-3.5 px-4">KYC ID Proof</th>
                <th className="py-3.5 px-4 text-center">Stays</th>
                <th className="py-3.5 px-4">Total Spent</th>
                <th className="py-3.5 px-4">Last Visit</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredAndSortedGuests.map((guest) => {
                const seg = SEGMENT_CONFIG[guest.segment] || SEGMENT_CONFIG.REGULAR;
                const totalStaysCount = guest.reservations?.length || guest._count?.checkIns || 0;
                const totalSpentAmount =
                  guest.reservations?.reduce((sum, r) => sum + (r.totalAmount || 0), 0) || 0;
                const lastStay = guest.reservations?.[0];

                return (
                  <tr
                    key={guest.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedGuest(guest)}
                  >
                    {/* Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600/30 to-indigo-600/30 border border-rose-500/20 flex items-center justify-center font-black text-rose-300 text-xs shrink-0">
                          {(guest.firstName || 'G')[0]}
                        </div>
                        <div>
                          <p className="font-black text-white group-hover:text-rose-300 transition-colors">
                            {guest.firstName} {guest.lastName || ''}
                          </p>
                          <p className="text-[10px] text-slate-500">{guest.address || guest.nationality || 'Indian'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      {guest.mobile ? (
                        <div className="flex items-center gap-1.5 font-mono text-slate-300">
                          <Phone size={11} className="text-rose-400" />
                          <span>{guest.mobile}</span>
                          <a
                            href={`https://wa.me/${guest.mobile.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Chat on WhatsApp"
                            className="p-0.5 text-emerald-400 hover:text-emerald-300"
                          >
                            <MessageCircle size={12} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                      {guest.email && <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{guest.email}</p>}
                    </td>

                    {/* Segment */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${seg.bg} ${seg.color}`}
                      >
                        {seg.icon} {seg.label}
                      </span>
                    </td>

                    {/* KYC */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {guest.idType && guest.idNumber ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <Shield size={11} />
                          {guest.idType}: {guest.idNumber}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-[10px]">Pending</span>
                      )}
                    </td>

                    {/* Stays */}
                    <td className="py-3 px-4 text-center font-black text-white">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800">
                        {totalStaysCount}
                      </span>
                    </td>

                    {/* Total Spent */}
                    <td className="py-3 px-4 font-black text-emerald-400">
                      ₹{totalSpentAmount.toLocaleString('en-IN')}
                    </td>

                    {/* Last Stay */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {lastStay ? (
                        <div>
                          <p>{new Date(lastStay.arrivalDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                          <p className="text-[10px] text-slate-500">{lastStay.rooms?.[0]?.room?.roomNumber ? `Room ${lastStay.rooms[0].room.roomNumber}` : 'Stay'}</p>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenBookingForGuest(guest)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 hover:text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                          title="Book Room for this Guest"
                        >
                          <Bed size={12} />
                          <span>Book</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGuest(guest)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer"
                          title="View Stay History"
                        >
                          <History size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: REGISTER NEW CUSTOMER PROFILE
         ══════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl relative space-y-4 my-8 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <UserPlus size={18} className="text-rose-400" /> Register New Hotel Customer
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateGuest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Mobile Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="ramesh@example.com"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Gender</label>
                  <select
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="Male" className="bg-[#090f1e] text-white">Male</option>
                    <option value="Female" className="bg-[#090f1e] text-white">Female</option>
                    <option value="Other" className="bg-[#090f1e] text-white">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Nationality</label>
                  <input
                    type="text"
                    placeholder="Indian"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Guest Segment</label>
                  <select
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.segment}
                    onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                  >
                    <option value="REGULAR" className="bg-[#090f1e] text-white">Regular</option>
                    <option value="VIP" className="bg-[#090f1e] text-white">👑 VIP Guest</option>
                    <option value="CORPORATE" className="bg-[#090f1e] text-white">🏢 Corporate Client</option>
                    <option value="LOYALTY" className="bg-[#090f1e] text-white">⭐ Loyalty Member</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Identity Proof Type</label>
                  <select
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.idType}
                    onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                  >
                    <option value="Aadhaar Card" className="bg-[#090f1e] text-white">Aadhaar Card</option>
                    <option value="Passport" className="bg-[#090f1e] text-white">Passport</option>
                    <option value="Driving License" className="bg-[#090f1e] text-white">Driving License</option>
                    <option value="Voter ID" className="bg-[#090f1e] text-white">Voter ID</option>
                    <option value="PAN Card" className="bg-[#090f1e] text-white">PAN Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Identity Document Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 5432-1098-7654"
                    className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Residential Address / City</label>
                <textarea
                  rows={2}
                  placeholder="Full home or business address, city, state..."
                  className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-black text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-xs font-black text-white shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {submitting ? 'Saving...' : 'Save Customer Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: GUEST COMPLETE PROFILE & STAY HISTORY DRAWER
         ══════════════════════════════════════════════════════════════════════ */}
      {selectedGuest && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          onClick={() => {
            setSelectedGuest(null);
            setShowAdjustPoints(false);
          }}
        >
          <div
            className="relative w-full max-w-3xl bg-[#090f1e] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600/30 to-indigo-600/30 border border-rose-500/30 flex items-center justify-center font-black text-rose-300 text-xl shadow-inner">
                  {(selectedGuest.firstName || 'G')[0]}{(selectedGuest.lastName || '')[0] || ''}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">
                      {selectedGuest.firstName} {selectedGuest.lastName || ''}
                    </h2>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        (SEGMENT_CONFIG[selectedGuest.segment] || SEGMENT_CONFIG.REGULAR).bg
                      } ${(SEGMENT_CONFIG[selectedGuest.segment] || SEGMENT_CONFIG.REGULAR).color}`}
                    >
                      {(SEGMENT_CONFIG[selectedGuest.segment] || SEGMENT_CONFIG.REGULAR).icon}{' '}
                      {(SEGMENT_CONFIG[selectedGuest.segment] || SEGMENT_CONFIG.REGULAR).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Member since {new Date(selectedGuest.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} · {selectedGuest.reservations?.length || selectedGuest._count?.checkIns || 0} Total Stays
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setSelectedGuest(null);
                  setShowAdjustPoints(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 md:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Quick Action Banner: Direct Book Room */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-teal-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
                <div>
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                    <Bed size={15} className="text-emerald-400" /> Book a New Stay for {selectedGuest.firstName}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Opens the Front Desk reservation wizard with this guest's KYC and contact info auto-filled.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenBookingForGuest(selectedGuest);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
                  >
                    + Book Room Now
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleOpenVipBookingForGuest(selectedGuest);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-black transition-all cursor-pointer"
                    title="VIP Fast Check-In"
                  >
                    👑 VIP
                  </button>
                </div>
              </div>

              {/* Guest Details Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Contact */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Contact Information
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mobile:</span>
                      {selectedGuest.mobile ? (
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono font-bold">{selectedGuest.mobile}</span>
                          <a
                            href={`https://wa.me/${selectedGuest.mobile.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle size={13} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-medium">—</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-white font-medium truncate max-w-[180px]">
                        {selectedGuest.email || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Identity Proof */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Government KYC ID Proof
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Document:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Shield size={11} /> {selectedGuest.idType || 'Aadhaar Card'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ID Number:</span>
                      <span className="text-white font-mono font-bold">
                        {selectedGuest.idNumber || 'Pending Document'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address & Nationality */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 sm:col-span-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Address &amp; Nationality
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-slate-300 flex items-center gap-1.5">
                      <MapPin size={12} className="text-rose-400 shrink-0" />
                      <span>{selectedGuest.address || 'No residential address on file'}</span>
                    </p>
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                      Nationality: {selectedGuest.nationality || 'Indian'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loyalty Points Section */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" /> Loyalty Points Balance
                    </span>
                    <p className="text-2xl font-black text-amber-400 mt-0.5">
                      {(selectedGuest.loyaltyPoints || 0).toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-bold text-slate-400">PTS</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdjustPoints(!showAdjustPoints)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-300 hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                  >
                    {showAdjustPoints ? 'Cancel Adjustment' : '⭐ Adjust Points'}
                  </button>
                </div>

                {/* Point adjustment input box */}
                {showAdjustPoints && (
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 pt-2 animate-in fade-in">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-850 pb-2">
                      <span className="text-[10px] font-bold text-slate-400">Adjustment Mode:</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => setAdjustMode('DELTA')}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            adjustMode === 'DELTA' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          +/- Delta
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdjustMode('SET')}
                          className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            adjustMode === 'SET' ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Set Exact Total
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={adjustMode === 'SET' ? 'e.g. 200' : 'e.g. +50 or -20'}
                        className="flex-1 bg-[#050a14] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAdjustPoints(selectedGuest.id)}
                        disabled={adjusting}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 text-black text-xs font-black hover:bg-amber-400 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {adjusting ? <Loader2 size={12} className="animate-spin" /> : 'Save Points'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Chronological Stay History Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <History size={14} className="text-rose-400" /> Past Stays &amp; Reservations History
                  </h4>
                  <span className="text-[10px] font-bold text-slate-400">
                    {selectedGuest.reservations?.length || 0} Record{(selectedGuest.reservations?.length || 0) === 1 ? '' : 's'}
                  </span>
                </div>

                {!selectedGuest.reservations || selectedGuest.reservations.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1">
                    <Bed size={24} className="mx-auto text-slate-600 mb-1" />
                    <p className="text-xs font-bold text-slate-400">No past reservation history on file</p>
                    <p className="text-[10px] text-slate-600">
                      When this guest books a room or checks in, their stay records will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/90 text-[10px] font-black uppercase text-slate-400 tracking-wider border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Booking Ref</th>
                          <th className="py-2.5 px-3">Room / Category</th>
                          <th className="py-2.5 px-3">Stay Dates</th>
                          <th className="py-2.5 px-3">Meal Plan</th>
                          <th className="py-2.5 px-3">Bill (INR)</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {selectedGuest.reservations.map((res) => {
                          const roomNo = res.rooms?.[0]?.room?.roomNumber;
                          return (
                            <tr key={res.id} className="hover:bg-slate-900/50">
                              <td className="py-2.5 px-3 font-mono font-bold text-white">
                                {res.bookingNo}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="font-bold text-indigo-300">
                                  {roomNo ? `Room ${roomNo}` : '—'}
                                </span>
                                <span className="text-[10px] text-slate-400 block">
                                  {res.roomType?.name || 'Standard'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-300">
                                {new Date(res.arrivalDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} →{' '}
                                {new Date(res.departureDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 uppercase font-mono">
                                {res.mealPlan || 'EP'}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-emerald-400">
                                ₹{Number(res.totalAmount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                    res.status === 'CHECKED_IN'
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : res.status === 'COMPLETED'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  {res.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedGuest(null);
                  setShowAdjustPoints(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Close Profile
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenVipBookingForGuest(selectedGuest);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Crown size={13} className="fill-slate-950" />
                  <span>VIP Check-In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenBookingForGuest(selectedGuest);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Bed size={14} />
                  <span>Book Room For Guest</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          BOOKING WIZARDS: FRONT DESK & VIP CHECK-IN
         ══════════════════════════════════════════════════════════════════════ */}
      {/* Front Desk Reservation Modal with Customer Auto-filled */}
      {isQuickBookingOpen && (
        <QuickReservationModal
          isOpen={isQuickBookingOpen}
          roomsList={roomsList}
          onClose={() => {
            setIsQuickBookingOpen(false);
            setBookingGuest(null);
          }}
          onCreated={() => {
            toast.success('Reservation created for guest successfully!');
            setIsQuickBookingOpen(false);
            setBookingGuest(null);
            loadGuests();
          }}
          initialArrivalDate={todayStr}
          initialDepartureDate={tomorrowStr}
          initialGuestData={initialGuestDataForBooking}
        />
      )}

      {/* Owner / VIP Fast Check-In Modal with Customer Auto-filled */}
      {isVipBookingOpen && (
        <OwnerVipBookingModal
          isOpen={isVipBookingOpen}
          roomsList={roomsList}
          onClose={() => {
            setIsVipBookingOpen(false);
            setBookingGuest(null);
          }}
          onCreated={() => {
            toast.success('VIP Check-In created successfully!');
            setIsVipBookingOpen(false);
            setBookingGuest(null);
            loadGuests();
          }}
          initialGuestData={initialVipGuestDataForBooking}
        />
      )}
    </div>
  );
}
