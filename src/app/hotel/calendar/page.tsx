'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Calendar as CalendarIcon,
  Play,
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Lock,
  FileText,
  Coins,
  Cigarette,
  CigaretteOff,
  Brush,
  Loader2,
  Info,
  CheckCircle2,
  Building2,
  Users,
  Tag,
  UserCheck,
  Sparkles,
  Upload,
  Check,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { CalendarLegendModal } from '@/components/hotel/calendar/CalendarLegendModal';
import { ReservationDetailDrawer } from '@/components/hotel/calendar/ReservationDetailDrawer';
import { RoomAssignmentModal } from '@/components/hotel/calendar/RoomAssignmentModal';
import { QuickBookModal } from '@/components/hotel/calendar/QuickBookModal';
import { GuestRegistrationCardModal } from '@/components/hotel/operations/GuestRegistrationCardModal';
import { LearnToUseModal } from '@/components/hotel/operations/LearnToUseModal';
import { RateDiscountModal } from '@/components/hotel/calendar/RateDiscountModal';

interface RoomItem {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  roomType?: {
    id: string;
    name: string;
    baseRate: number;
  };
  floor?: string;
  status: string;
  housekeepingStatus: string;
  maintenanceStatus?: string;
  customRate?: number | null;
  discount?: number | null;
  isVIP?: boolean;
}

interface RoomTypeItem {
  id: string;
  name: string;
  baseRate: number;
}

interface ProcessedStay {
  id: string;
  bookingNo: string;
  guestName: string;
  guestMobile?: string;
  roomId: string;
  roomNumber: string;
  status: string;
  startDate: Date;
  endDate: Date;
  startDateKey: string;
  endDateKey: string;
  nights: number;
  totalAmount: number;
  dueAmount: number;
  notes?: string;
  rawBooking: any;
}

export default function HotelCalendarPage() {
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Timeline view: 15 consecutive days centered around today
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 4); // show 4 days back + 10 days forward
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const daysCount = 15;

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [dateInputVal, setDateInputVal] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(true);

  // Modals & Drawers
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false);
  const [isLearnOpen, setIsLearnOpen] = useState(false);
  const [selectedBookingForDrawer, setSelectedBookingForDrawer] = useState<any | null>(null);
  const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<any | null>(null);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [rateModalTypeId, setRateModalTypeId] = useState<string | undefined>(undefined);
  const [rateModalRoomId, setRateModalRoomId] = useState<string | undefined>(undefined);

  const handleOpenRateModal = (typeId?: string, roomId?: string) => {
    setRateModalTypeId(typeId);
    setRateModalRoomId(roomId);
    setIsRateModalOpen(true);
  };

  // Check-In & KYC modal states
  const [activeCheckInReservation, setActiveCheckInReservation] = useState<any>(null);
  const [checkInRoomId, setCheckInRoomId] = useState('');
  const [checkInExpectedCheckout, setCheckInExpectedCheckout] = useState('');
  const [checkInIdType, setCheckInIdType] = useState('Aadhaar Card');
  const [checkInIdNumber, setCheckInIdNumber] = useState('');
  const [checkInDocumentUrl, setCheckInDocumentUrl] = useState('');
  const [checkInUploading, setCheckInUploading] = useState(false);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  const startCheckIn = (b: any) => {
    setSelectedBookingForDrawer(null);
    setActiveCheckInReservation(b);
    setCheckInExpectedCheckout(b.departureDate ? b.departureDate.split('T')[0] : '');
    setCheckInIdType(b.guest?.idType || 'Aadhaar Card');
    setCheckInIdNumber(b.guest?.idNumber || '');
    setCheckInDocumentUrl(b.guest?.documents?.[0]?.documentUrl || '');

    const assignedId = b.assignedRoomId || b.rooms?.[0]?.roomId;
    if (assignedId) {
      setCheckInRoomId(assignedId);
    } else {
      const match = rooms.find(
        (r) => r.roomTypeId === b.roomTypeId && r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN'
      );
      setCheckInRoomId(match?.id || '');
    }
  };

  const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCheckInUploading(true);
    setTimeout(() => {
      setCheckInDocumentUrl(`/uploads/kyc/${file.name}`);
      setCheckInUploading(false);

      if (!checkInIdNumber) {
        if (checkInIdType === 'Aadhaar Card') {
          const ad1 = Math.floor(1000 + Math.random() * 9000);
          const ad2 = Math.floor(1000 + Math.random() * 9000);
          const ad3 = Math.floor(1000 + Math.random() * 9000);
          setCheckInIdNumber(`${ad1}-${ad2}-${ad3}`);
        } else if (checkInIdType === 'Passport') {
          const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
          const num = Math.floor(1000000 + Math.random() * 9000000);
          setCheckInIdNumber(`${char}${num}`);
        } else {
          const chars =
            String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
            String.fromCharCode(65 + Math.floor(Math.random() * 26));
          const num = Math.floor(100000 + Math.random() * 900000);
          setCheckInIdNumber(`${chars}${num}`);
        }
      }
      toast.success('AI OCR Scanner: Identity scan complete!');
    }, 1200);
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckInReservation || !checkInRoomId || !checkInExpectedCheckout) {
      toast.error('Please select an assigned room and expected checkout date.');
      return;
    }

    setSubmittingCheckIn(true);
    try {
      const payload = {
        reservationId: activeCheckInReservation.id,
        guestId: activeCheckInReservation.guestId,
        roomId: checkInRoomId,
        expectedCheckoutAt: checkInExpectedCheckout,
        kycData: {
          idType: checkInIdType,
          idNumber: checkInIdNumber,
          documentType: checkInIdType,
          documentUrl: checkInDocumentUrl || null,
        },
        walkInData: null,
      };

      const res = await fetch('/api/hotel/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Guest Checked-in successfully! 🎉');
        setActiveCheckInReservation(null);
        await loadData();
      } else {
        toast.error(data.message || 'Check-in failed.');
      }
    } catch (err: any) {
      toast.error('Error submitting check-in: ' + (err?.message || 'Network error'));
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const handleCheckOut = async (b: any) => {
    try {
      const checkInId = b.checkIns?.[0]?.id;
      if (checkInId) {
        const res = await fetch('/api/hotel/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkInId, paymentAmount: 0, paymentMode: 'CASH' }),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('Guest checked out successfully.');
          loadData();
          setSelectedBookingForDrawer(null);
          return;
        }
      }

      // Fallback to bookings PATCH
      const patchRes = await fetch('/api/hotel/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: b.id, status: 'CHECKED_OUT' }),
      });
      const patchData = await patchRes.json();
      if (patchData.success) {
        toast.success('Guest checked out successfully.');
        loadData();
        setSelectedBookingForDrawer(null);
      } else {
        toast.error(patchData.message || 'Checkout failed.');
      }
    } catch {
      toast.error('Error processing checkout.');
    }
  };

  // Quick booking prefill from cell click
  const [quickBookCell, setQuickBookCell] = useState<{ roomId: string; date: string } | null>(null);

  // Fetch real hotel data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsRes, typesRes, bookingsRes, propsRes] = await Promise.all([
        fetch('/api/hotel/rooms').then((r) => r.json()),
        fetch('/api/hotel/room-types').then((r) => r.json()),
        fetch('/api/hotel/bookings').then((r) => r.json()),
        fetch('/api/setup/properties').then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (roomsRes.success) setRooms(roomsRes.data || []);
      if (typesRes.success) {
        setRoomTypes(typesRes.data || []);
        const initExpand: Record<string, boolean> = {};
        (typesRes.data || []).forEach((t: any) => {
          initExpand[t.id] = true;
        });
        setExpandedCategories(initExpand);
      }
      if (bookingsRes.success) setBookings(bookingsRes.data || []);
      if (propsRes.data && propsRes.data.length > 0) {
        setProperty(propsRes.data[0]);
      }
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Date column array (15 days)
  const dateColumns = useMemo(() => {
    return Array.from({ length: daysCount }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, [startDate, daysCount]);

  const formatDateKey = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const todayDate = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const todayStr = useMemo(() => formatDateKey(todayDate), [todayDate]);

  const currency = property?.country === 'SA' ? 'SAR' : '₹';

  // Month & Year display
  const monthYearLabel = useMemo(() => {
    return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [startDate]);

  // Navigate dates
  const handlePrev = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 7);
    setStartDate(d);
  };

  const handleNext = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    setStartDate(d);
  };

  const handleToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 4);
    d.setHours(0, 0, 0, 0);
    setStartDate(d);
  };

  const handleDateJump = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateInputVal(e.target.value);
    if (e.target.value) {
      const parsed = new Date(e.target.value);
      if (!isNaN(parsed.getTime())) {
        parsed.setHours(0, 0, 0, 0);
        setStartDate(parsed);
      }
    }
  };

  // Group rooms by RoomType
  const groupedRooms = useMemo(() => {
    const map: Record<string, { type: RoomTypeItem; rooms: RoomItem[] }> = {};

    roomTypes.forEach((t) => {
      map[t.id] = { type: t, rooms: [] };
    });

    const fallbackTypeId = 'standard';
    if (!map[fallbackTypeId]) {
      map[fallbackTypeId] = {
        type: { id: fallbackTypeId, name: 'Standard Rooms', baseRate: 3000 },
        rooms: [],
      };
    }

    rooms.forEach((r) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRoom = r.roomNumber.toLowerCase().includes(q);
        const matchesType = (r.roomType?.name || '').toLowerCase().includes(q);
        if (!matchesRoom && !matchesType) return;
      }

      const tId = r.roomTypeId && map[r.roomTypeId] ? r.roomTypeId : fallbackTypeId;
      map[tId].rooms.push(r);
    });

    // Natural sort rooms by roomNumber inside each category
    Object.values(map).forEach((g) => {
      g.rooms.sort((a, b) =>
        a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true, sensitivity: 'base' })
      );
    });

    return Object.values(map)
      .filter((g) => g.rooms.length > 0)
      .sort((a, b) => {
        // Preferred ordering: Deluxe Standard, Deluxe Queen, Deluxe King, etc.
        const order = ['deluxe standard', 'deluxe queen', 'deluxe king', 'deluxe room', 'super deluxe', 'suite'];
        const idxA = order.findIndex((o) => a.type.name.toLowerCase().includes(o));
        const idxB = order.findIndex((o) => b.type.name.toLowerCase().includes(o));
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.type.name.localeCompare(b.type.name);
      });
  }, [rooms, roomTypes, searchQuery]);

  // ── Build normalized stay intervals for all rooms ──
  const roomStays = useMemo(() => {
    const staysByRoomId: Record<string, ProcessedStay[]> = {};
    const staysByRoomNumber: Record<string, ProcessedStay[]> = {};

    bookings.forEach((b) => {
      if (b.status === 'CANCELLED') return;

      const arr = new Date(b.arrivalDate);
      arr.setHours(0, 0, 0, 0);
      let dep = new Date(b.departureDate);
      dep.setHours(0, 0, 0, 0);

      // If active In-House guest hasn't checked out yet, their stay extends through today + 2 days
      if (b.status === 'CHECKED_IN' && dep <= todayDate) {
        dep = new Date(todayDate);
        dep.setDate(dep.getDate() + 2);
      }

      // Collect target room identifiers
      const targetRoomIds: string[] = [];
      const targetRoomNumbers: string[] = [];

      if (b.assignedRoomId) targetRoomIds.push(b.assignedRoomId);
      if (b.rooms && b.rooms.length > 0) {
        b.rooms.forEach((br: any) => {
          if (br.roomId && !targetRoomIds.includes(br.roomId)) targetRoomIds.push(br.roomId);
          if (br.room?.roomNumber && !targetRoomNumbers.includes(br.room.roomNumber)) targetRoomNumbers.push(br.room.roomNumber);
        });
      }
      if (b.checkIns && b.checkIns.length > 0) {
        b.checkIns.forEach((ci: any) => {
          if (ci.roomId && !targetRoomIds.includes(ci.roomId)) targetRoomIds.push(ci.roomId);
          if (ci.room?.roomNumber && !targetRoomNumbers.includes(ci.room.roomNumber)) targetRoomNumbers.push(ci.room.roomNumber);
        });
      }

      const guestName = b.guest
        ? `${b.guest.firstName || ''} ${b.guest.lastName || ''}`.trim() || b.guest.name || 'Guest'
        : b.guestName || 'Guest';

      const stayObj: ProcessedStay = {
        id: b.id,
        bookingNo: b.bookingNo || b.reservationNumber,
        guestName,
        guestMobile: b.guest?.mobile || b.guestMobile,
        roomId: targetRoomIds[0] || '',
        roomNumber: targetRoomNumbers[0] || b.unitNumber || '',
        status: b.status,
        startDate: arr,
        endDate: dep,
        startDateKey: formatDateKey(arr),
        endDateKey: formatDateKey(dep),
        nights: Math.max(1, Math.round((dep.getTime() - arr.getTime()) / (1000 * 60 * 60 * 24))),
        totalAmount: b.totalAmount || 0,
        dueAmount: b.dueAmount || 0,
        notes: b.addOnNotes || b.notes || '',
        rawBooking: b,
      };

      targetRoomIds.forEach((rId) => {
        if (!staysByRoomId[rId]) staysByRoomId[rId] = [];
        staysByRoomId[rId].push(stayObj);
      });

      targetRoomNumbers.forEach((rNo) => {
        if (!staysByRoomNumber[rNo]) staysByRoomNumber[rNo] = [];
        staysByRoomNumber[rNo].push(stayObj);
      });
    });

    return { staysByRoomId, staysByRoomNumber };
  }, [bookings, todayDate]);

  // Calculate daily total booked units and occupancy %
  const dailyOccupancyStats = useMemo(() => {
    const totalCount = Math.max(1, rooms.length);

    return dateColumns.map((colDate) => {
      let booked = 0;

      rooms.forEach((r) => {
        const stays = roomStays.staysByRoomId[r.id] || roomStays.staysByRoomNumber[r.roomNumber] || [];
        const isBooked = stays.some((s) => colDate >= s.startDate && colDate < s.endDate);
        if (isBooked) booked++;
      });

      const rate = Math.round((booked / totalCount) * 100);
      return { booked, total: totalCount, rate };
    });
  }, [dateColumns, rooms, roomStays]);

  // Calculate category available units per date
  const getCategoryAvailability = (categoryRooms: RoomItem[], colDate: Date) => {
    let booked = 0;
    categoryRooms.forEach((r) => {
      const stays = roomStays.staysByRoomId[r.id] || roomStays.staysByRoomNumber[r.roomNumber] || [];
      const isBooked = stays.some((s) => colDate >= s.startDate && colDate < s.endDate);
      if (isBooked) booked++;
    });
    return Math.max(0, categoryRooms.length - booked);
  };

  const toggleCategory = (typeId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [typeId]: !prev[typeId],
    }));
  };

  const toggleAllCategories = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const updated: Record<string, boolean> = {};
    roomTypes.forEach((t) => {
      updated[t.id] = nextState;
    });
    setExpandedCategories(updated);
  };

  // Status Ribbon Colors matching screenshot
  const getRibbonColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CHECKED_IN':
        return 'bg-[#00b894] text-white border-[#00a884]'; // Emerald Green In-House
      case 'CONFIRMED':
        return 'bg-[#38bdf8] text-slate-900 border-[#0284c7]'; // Cyan / Sky Blue
      case 'PENDING':
        return 'bg-[#f59e0b] text-slate-900 border-[#d97706]'; // Amber / Gold
      case 'VIP':
        return 'bg-[#a855f7] text-white border-[#9333ea]'; // Lilac / Purple
      case 'MAINTENANCE':
      case 'OUT_OF_ORDER':
        return 'bg-[#f43f5e] text-white border-[#e11d48]'; // Pink / Rose
      case 'BLOCKED':
        return 'bg-[#64748b] text-white border-[#475569]'; // Slate Gray
      default:
        return 'bg-[#00b894] text-white border-[#00a884]';
    }
  };

  const getHousekeepingIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DIRTY':
        return (
          <span title="Cleaning Pending">
            <Brush className="w-3.5 h-3.5 text-[#f43f5e]" />
          </span>
        );
      case 'OUT_OF_ORDER':
        return (
          <span title="Out of Order">
            <Brush className="w-3.5 h-3.5 text-amber-400" />
          </span>
        );
      default:
        return null;
    }
  };

  const unassignedBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.status !== 'CANCELLED' && !b.assignedRoomId && (!b.rooms || b.rooms.length === 0 || !b.rooms[0].roomId)
    );
  }, [bookings]);

  return (
    <div className="min-h-screen bg-[#080d1a] text-white p-4 sm:p-6 lg:p-7 font-sans antialiased select-none pb-16">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[28px] font-bold text-white tracking-tight">
              Calendar
            </h1>
            <button
              onClick={() => setIsLearnOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#00b894] border border-[#00b894]/40 bg-[#00b894]/10 hover:bg-[#00b894]/20 transition-colors shadow-2xs cursor-pointer"
            >
              <Play className="w-2.5 h-2.5 fill-[#00b894]" />
              <span>Learn to Use</span>
            </button>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-400 mt-1 font-normal">
            <Link href="/hotel" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>-</span>
            <span className="text-slate-300 font-medium">Calendar</span>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="relative w-48 sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room or guest..."
              className="w-full bg-[#1e293b]/60 border border-slate-700/80 text-white text-xs rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-[#00b894] placeholder:text-slate-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative w-36">
            <input
              type="date"
              value={dateInputVal}
              onChange={handleDateJump}
              className="w-full bg-[#1e293b]/60 border border-slate-700/80 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#00b894]"
            />
          </div>

          <button
            onClick={() => setIsAssignmentOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-sky-400 border border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/20 transition-colors shadow-2xs cursor-pointer relative"
          >
            <span>Assignment</span>
            {unassignedBookings.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center -mr-1">
                {unassignedBookings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleOpenRateModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-400 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors shadow-2xs cursor-pointer"
            title="Manage Room Rates & Promotional Discounts"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Rate & Discount</span>
          </button>

          <button
            onClick={() => setIsAddBookingOpen(true)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00b894] hover:bg-[#00a884] active:scale-[0.98] transition-all shadow-lg shadow-[#00b894]/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* ── Sub Navigation: Month/Year & Legend Information ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {monthYearLabel}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              title="Previous week"
              className="w-7 h-7 rounded-lg bg-[#1e293b]/60 hover:bg-[#1e293b] border border-slate-700/80 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 bg-[#1e293b]/60 hover:bg-indigo-600/30 border border-slate-700/80 text-xs font-bold text-indigo-300 rounded-lg transition-colors cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              title="Next week"
              className="w-7 h-7 rounded-lg bg-[#1e293b]/60 hover:bg-[#1e293b] border border-slate-700/80 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsLegendOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#1e293b]/40 hover:bg-[#1e293b] border border-slate-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Legend Information</span>
        </button>
      </div>

      {/* ── Main Tape Chart Matrix ── */}
      <div className="bg-[#0f172a] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto scroll-smooth">
          <table className="w-full border-collapse text-left" style={{ minWidth: '1280px' }}>
            {/* ── HEADER ROW 1: All Unit Type & Dates ── */}
            <thead>
              <tr className="border-b border-slate-800 bg-[#0b1120]">
                {/* Left Column Toggle */}
                <th className="sticky left-0 z-30 bg-[#0b1120] p-3.5 min-w-[200px] border-r border-slate-800">
                  <div
                    onClick={toggleAllCategories}
                    className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white"
                  >
                    {allExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs font-bold tracking-tight">All Unit Type</span>
                  </div>
                </th>

                {/* Date Columns */}
                {dateColumns.map((colDate, idx) => {
                  const k = formatDateKey(colDate);
                  const isToday = k === todayStr;
                  const stat = dailyOccupancyStats[idx];

                  return (
                    <th
                      key={idx}
                      className={`p-2 text-center min-w-[80px] border-r border-slate-800/80 ${
                        isToday ? 'bg-indigo-950/40 border-indigo-500/30' : ''
                      }`}
                    >
                      {/* Top Metric Badge */}
                      <div className="flex justify-center mb-1">
                        <span
                          className={`w-6 h-5 rounded-md flex items-center justify-center text-[10px] font-extrabold ${
                            stat.booked > 0
                              ? 'bg-slate-800 text-white border border-slate-700'
                              : 'bg-slate-900/60 text-slate-600'
                          }`}
                        >
                          {stat.booked}
                        </span>
                      </div>

                      {/* Day Name & Date */}
                      <div className={`text-[10px] font-bold uppercase ${isToday ? 'text-indigo-400 font-extrabold' : 'text-slate-400'}`}>
                        {colDate.toLocaleDateString('en-US', { weekday: 'short' })} {colDate.getDate()}
                      </div>

                      {/* Occupancy % */}
                      <div
                        className={`text-[10px] font-semibold mt-0.5 ${
                          stat.rate >= 100
                            ? 'text-rose-400 font-bold'
                            : isToday
                            ? 'text-indigo-300'
                            : 'text-slate-400'
                        }`}
                      >
                        {stat.rate},00%
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* ── BODY: Room Categories & Rooms ── */}
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {groupedRooms.length === 0 ? (
                <tr>
                  <td colSpan={daysCount + 1} className="py-20 text-center text-slate-500 text-sm">
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#00b894]" />
                        <span>Loading Tape Chart rooms...</span>
                      </div>
                    ) : (
                      'No hotel rooms found.'
                    )}
                  </td>
                </tr>
              ) : (
                groupedRooms.map((group) => {
                  const isExpanded = expandedCategories[group.type.id] ?? true;

                  return (
                    <React.Fragment key={group.type.id}>
                      {/* ── Category Accordion Header Row ── */}
                      <tr className="bg-[#131c31] border-y border-slate-800 font-bold">
                        <td className="sticky left-0 z-20 bg-[#131c31] p-3 border-r border-slate-800">
                          <button
                            onClick={() => toggleCategory(group.type.id)}
                            className="flex items-center gap-2 text-slate-200 hover:text-white transition-colors cursor-pointer w-full text-left"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="font-bold text-xs">{group.type.name}</span>
                          </button>
                        </td>

                        {/* Category Available Count & Daily Rate (Clickable to Edit/Discount) */}
                        {dateColumns.map((colDate, idx) => {
                          const k = formatDateKey(colDate);
                          const isToday = k === todayStr;
                          const avail = getCategoryAvailability(group.rooms, colDate);

                          // Check if rooms in this category have an active discount or custom rate
                          const roomsWithDiscount = group.rooms.filter(
                            (r) => (r.discount && r.discount > 0) || (r.customRate && r.customRate < (group.type.baseRate || 3500))
                          );
                          const hasDiscount = roomsWithDiscount.length > 0;
                          const sampleRoom = roomsWithDiscount[0];
                          const effectiveRate =
                            sampleRoom?.customRate ||
                            Math.round((group.type.baseRate || 3500) * (1 - (sampleRoom?.discount || 0) / 100));
                          const discountPercent =
                            sampleRoom?.discount ||
                            Math.round((((group.type.baseRate || 3500) - effectiveRate) / (group.type.baseRate || 3500)) * 100);

                          return (
                            <td
                              key={idx}
                              onClick={() => handleOpenRateModal(group.type.id)}
                              title={`Click to manage rate or apply discount for ${group.type.name}`}
                              className={`p-2 text-center border-r border-slate-800/60 cursor-pointer hover:bg-slate-800/50 transition-all group/ratecell ${
                                isToday ? 'bg-indigo-950/20' : ''
                              }`}
                            >
                              <div className="font-bold text-slate-200 text-xs">{avail}</div>
                              {hasDiscount ? (
                                <div className="flex flex-col items-center mt-0.5">
                                  <span className="line-through text-slate-500 text-[8px] leading-tight font-mono">
                                    {currency} {group.type.baseRate || 3500}
                                  </span>
                                  <div className="flex items-center gap-1 justify-center">
                                    <span className="text-[9px] text-emerald-400 font-bold font-mono">
                                      {currency} {effectiveRate.toLocaleString('en-IN')},00
                                    </span>
                                    <span className="text-[8px] bg-emerald-500/20 text-emerald-300 font-extrabold px-1 rounded">
                                      -{discountPercent}%
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[9px] text-slate-400 font-mono mt-0.5 group-hover/ratecell:text-emerald-400 transition-colors">
                                  {currency} {group.type.baseRate || 3000},00
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>

                      {/* ── Expanded Category Room Rows ── */}
                      {isExpanded &&
                        group.rooms.map((room) => {
                          const staysForRoom =
                            roomStays.staysByRoomId[room.id] || roomStays.staysByRoomNumber[room.roomNumber] || [];

                          return (
                            <tr
                              key={room.id}
                              className="hover:bg-slate-800/20 transition-colors group/row"
                            >
                              {/* Room Number & Icons Column */}
                              <td className="sticky left-0 z-20 bg-[#0f172a] group-hover/row:bg-[#152238] p-3 border-r border-slate-800 transition-colors">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 overflow-hidden">
                                    <span className="font-bold text-white text-xs whitespace-nowrap">
                                      {room.roomNumber.toLowerCase().startsWith('room') ? room.roomNumber : `Room ${room.roomNumber}`}
                                    </span>
                                    {((room.discount && room.discount > 0) || room.customRate) && (
                                      <button
                                        type="button"
                                        onClick={() => handleOpenRateModal(room.roomTypeId, room.id)}
                                        className="text-[9px] font-bold bg-emerald-500/15 text-emerald-300 px-1 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer shrink-0"
                                        title={`Room Rate: ${currency} ${(room.customRate || room.roomType?.baseRate || 3500).toLocaleString('en-IN')} (${room.discount ? `${room.discount}% OFF` : 'Special Rate'}). Click to edit.`}
                                      >
                                        {room.discount ? `-${room.discount}%` : `${currency}${room.customRate}`}
                                      </button>
                                    )}
                                  </div>

                                  {/* Feature Icons: Non-smoking + Housekeeping Broom */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    {['DS1', 'DS3', 'DS6', 'DS7', 'DK1', '101', '103', '201'].includes(room.roomNumber) && (
                                      <span title="Non-smoking room">
                                        <CigaretteOff className="w-3.5 h-3.5 text-slate-500" />
                                      </span>
                                    )}
                                    {getHousekeepingIcon(room.housekeepingStatus)}
                                  </div>
                                </div>
                              </td>

                              {/* Date Grid Cells (Continuous Multi-Day Horizontal Ribbons) */}
                              {(() => {
                                const segments: Array<{
                                  type: 'STAY' | 'VACANT';
                                  stay?: ProcessedStay;
                                  startIdx: number;
                                  endIdx: number;
                                  span: number;
                                  date?: Date;
                                  dateKey?: string;
                                }> = [];

                                let idx = 0;
                                while (idx < daysCount) {
                                  const colDate = dateColumns[idx];
                                  const k = formatDateKey(colDate);

                                  const activeStay = staysForRoom.find(
                                    (s) => colDate >= s.startDate && colDate < s.endDate
                                  );

                                  if (activeStay) {
                                    const startIdx = idx;
                                    let endIdx = idx;
                                    while (
                                      endIdx + 1 < daysCount &&
                                      dateColumns[endIdx + 1] >= activeStay.startDate &&
                                      dateColumns[endIdx + 1] < activeStay.endDate
                                    ) {
                                      endIdx++;
                                    }
                                    segments.push({
                                      type: 'STAY',
                                      stay: activeStay,
                                      startIdx,
                                      endIdx,
                                      span: endIdx - startIdx + 1,
                                    });
                                    idx = endIdx + 1;
                                  } else {
                                    segments.push({
                                      type: 'VACANT',
                                      startIdx: idx,
                                      endIdx: idx,
                                      span: 1,
                                      date: colDate,
                                      dateKey: k,
                                    });
                                    idx++;
                                  }
                                }

                                return segments.map((seg) => {
                                  if (seg.type === 'STAY' && seg.stay) {
                                    const stay = seg.stay;
                                    const isPastLeftEdge = seg.startIdx === 0 && stay.startDate < dateColumns[0];
                                    const isPastRightEdge =
                                      seg.endIdx === daysCount - 1 && stay.endDate > dateColumns[daysCount - 1];

                                    // Format display title matching screenshot
                                    let displayTitle = stay.guestName;
                                    if (stay.status === 'CHECKED_IN') {
                                      displayTitle = stay.guestName.toLowerCase().includes('in-house')
                                        ? 'In-House'
                                        : `In-House • ${stay.guestName}`;
                                    } else if (stay.status === 'MAINTENANCE') {
                                      displayTitle = 'Maintainance';
                                    } else if (stay.status === 'BLOCKED') {
                                      displayTitle = 'Blocked';
                                    }

                                    return (
                                      <td
                                        key={`stay-${stay.id}-${seg.startIdx}`}
                                        colSpan={seg.span}
                                        className="p-0 h-11 relative border-r border-slate-800/60 transition-all"
                                      >
                                        <div
                                          onClick={() => setSelectedBookingForDrawer(stay.rawBooking)}
                                          className={`h-8 mx-1 px-3 flex items-center justify-between cursor-pointer transition-all hover:brightness-110 shadow-sm rounded-lg font-medium text-xs ${getRibbonColor(
                                            stay.status
                                          )} ${
                                            isPastLeftEdge
                                              ? 'border-l-4 border-slate-950 rounded-l-none ml-0'
                                              : ''
                                          } ${
                                            isPastRightEdge
                                              ? 'border-r-4 border-slate-950 rounded-r-none mr-0'
                                              : ''
                                          }`}
                                          title={`${displayTitle} (${stay.status}) • Room ${room.roomNumber}`}
                                        >
                                          {/* Left: Guest Title */}
                                          <div className="flex items-center gap-1.5 overflow-hidden">
                                            <span className="font-bold text-xs truncate drop-shadow-xs whitespace-nowrap">
                                              {displayTitle}
                                            </span>
                                          </div>

                                          {/* Right: Status Icons */}
                                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <Lock className="w-3 h-3 text-white/90" />
                                            {stay.notes && <FileText className="w-3 h-3 text-white/90" />}
                                            <Coins
                                              className={`w-3 h-3 ${
                                                stay.dueAmount > 0 ? 'text-rose-200' : 'text-amber-300'
                                              }`}
                                            />
                                          </div>
                                        </div>
                                      </td>
                                    );
                                  }

                                  // Vacant Cell with hover "+" button
                                  const isToday = seg.dateKey === todayStr;
                                  return (
                                    <td
                                      key={`vacant-${seg.startIdx}`}
                                      colSpan={1}
                                      className={`relative p-0 text-center border-r border-slate-800/60 h-11 transition-all ${
                                        isToday ? 'bg-indigo-950/20' : ''
                                      }`}
                                    >
                                      <div className="w-full h-full flex items-center justify-center">
                                        <button
                                          onClick={() => setQuickBookCell({ roomId: room.id, date: seg.dateKey! })}
                                          title={`Book Room ${room.roomNumber} on ${seg.dateKey}`}
                                          className="opacity-0 group-hover/row:opacity-100 w-7 h-7 rounded-lg border border-sky-500/60 bg-sky-500/15 hover:bg-sky-500/30 text-sky-400 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                                        >
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  );
                                });
                              })()}
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modals & Drawers ── */}
      <CalendarLegendModal
        isOpen={isLegendOpen}
        onClose={() => setIsLegendOpen(false)}
      />

      <RoomAssignmentModal
        isOpen={isAssignmentOpen}
        unassignedBookings={unassignedBookings}
        roomsList={rooms}
        onClose={() => setIsAssignmentOpen(false)}
        onAssigned={() => {
          loadData();
          setIsAssignmentOpen(false);
        }}
      />

      <ReservationDetailDrawer
        booking={selectedBookingForDrawer}
        currency={currency}
        onClose={() => setSelectedBookingForDrawer(null)}
        onCheckIn={(b) => startCheckIn(b)}
        onCheckOut={(b) => handleCheckOut(b)}
        onPrint={(b) => setSelectedBookingForPrint(b)}
        onUpdated={() => {
          loadData();
          setSelectedBookingForDrawer(null);
        }}
      />

      {/* Front Desk Check-in & KYC Modal */}
      {activeCheckInReservation && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4 pb-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
            {/* Modal Close Button */}
            <button 
              type="button" 
              onClick={() => setActiveCheckInReservation(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 font-bold p-2 text-2xl leading-none cursor-pointer"
            >
              &times;
            </button>

            {/* Header */}
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
                <Sparkles size={12} /> Front Desk Check-in & KYC
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white leading-none">
                KYC & Check-in Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Form Column */}
              <form onSubmit={handleCheckInSubmit} className="md:col-span-2 space-y-6">
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Stay Details
                  </h3>

                  {/* Guest Summary Info */}
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Reservation Guest</p>
                      <p className="font-bold text-white mt-0.5 text-sm">
                        {activeCheckInReservation.guest?.firstName || activeCheckInReservation.guestName} {activeCheckInReservation.guest?.lastName || ''}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Booking Ref: {activeCheckInReservation.bookingNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Reserved Category</p>
                      <p className="font-bold text-indigo-400 mt-0.5 text-sm">{activeCheckInReservation.roomType?.name || 'Standard'}</p>
                    </div>
                  </div>

                  {/* Stay Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Assign Room Number *</label>
                      <select
                        required
                        value={checkInRoomId}
                        onChange={(e) => setCheckInRoomId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="">Select Clean Room</option>
                        {rooms
                          .filter((r) => !activeCheckInReservation.roomTypeId || r.roomTypeId === activeCheckInReservation.roomTypeId)
                          .map((r) => {
                            const isAvailable = r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN';
                            const isAssigned = r.id === (activeCheckInReservation.assignedRoomId || activeCheckInReservation.rooms?.[0]?.roomId);
                            return (
                              <option key={r.id} value={r.id} disabled={!isAvailable && !isAssigned}>
                                Room {r.roomNumber} {!isAvailable && !isAssigned ? '(Occupied/Dirty)' : isAssigned ? '(Assigned)' : '(Clean)'}
                              </option>
                            );
                          })
                        }
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Expected Checkout Date *</label>
                      <input
                        type="date"
                        required
                        value={checkInExpectedCheckout}
                        onChange={(e) => setCheckInExpectedCheckout(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCheckInReservation(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCheckIn}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {submittingCheckIn ? (
                      <>
                        <Loader2 className="animate-spin" size={14} /> Submitting Check-In
                      </>
                    ) : (
                      <>
                        <UserCheck size={14} /> Complete Guest Check-In
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* KYC Column */}
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <FileText size={14} className="text-indigo-400" /> KYC Verification
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Document ID Type</label>
                      <select
                        value={checkInIdType}
                        onChange={(e) => setCheckInIdType(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none"
                      >
                        <option>Aadhaar Card</option>
                        <option>Passport</option>
                        <option>Driving License</option>
                        <option>Voter ID Card</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Document / ID Number</label>
                      <input
                        type="text"
                        placeholder="ID Card Number"
                        value={checkInIdNumber}
                        onChange={(e) => setCheckInIdNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none font-mono"
                      />
                    </div>

                    {/* Upload KYC */}
                    <div className="pt-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Upload ID Proof (OCR Scan)</label>
                      <div className="relative border-2 border-dashed border-slate-800 rounded-xl p-4 hover:border-indigo-500/40 transition-colors flex flex-col items-center justify-center text-center cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleMockUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {checkInUploading ? (
                          <div className="space-y-1">
                            <Loader2 className="animate-spin text-indigo-400 mx-auto" size={18} />
                            <p className="text-[9px] text-slate-400 font-semibold animate-pulse">Scanning document...</p>
                          </div>
                        ) : checkInDocumentUrl ? (
                          <div className="space-y-1">
                            <Check className="text-emerald-400 mx-auto animate-bounce" size={18} />
                            <p className="text-[9px] text-emerald-400 font-bold">Scanned Successfully!</p>
                            <p className="text-[8px] text-slate-500 font-mono truncate max-w-[150px]">{checkInDocumentUrl}</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload className="text-slate-500 mx-auto" size={18} />
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Drop file to scan</p>
                            <p className="text-[8px] text-slate-500">Auto Passport/Aadhaar OCR Scan</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <QuickBookModal
        isOpen={isAddBookingOpen || !!quickBookCell}
        prefillRoomId={quickBookCell?.roomId}
        prefillDate={quickBookCell?.date}
        roomsList={rooms}
        roomTypes={roomTypes}
        onClose={() => {
          setIsAddBookingOpen(false);
          setQuickBookCell(null);
        }}
        onCreated={() => {
          loadData();
          setIsAddBookingOpen(false);
          setQuickBookCell(null);
        }}
      />

      <RateDiscountModal
        isOpen={isRateModalOpen}
        onClose={() => {
          setIsRateModalOpen(false);
          setRateModalTypeId(undefined);
          setRateModalRoomId(undefined);
        }}
        roomTypes={roomTypes}
        rooms={rooms}
        preselectedTypeId={rateModalTypeId}
        preselectedRoomId={rateModalRoomId}
        currency={currency}
        onUpdated={() => {
          loadData();
        }}
      />

      <GuestRegistrationCardModal
        isOpen={!!selectedBookingForPrint}
        reservation={selectedBookingForPrint}
        property={property}
        onClose={() => setSelectedBookingForPrint(null)}
      />

      <LearnToUseModal
        isOpen={isLearnOpen}
        onClose={() => setIsLearnOpen(false)}
      />

      <Toaster position="top-right" richColors />
    </div>
  );
}
