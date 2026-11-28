'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DoorOpen,
  Sparkles,
  Loader2,
  Plus,
  Search,
  CalendarDays,
  User,
  Mail,
  Phone,
  Check,
  UserCheck,
  FileText,
  Upload,
  Camera,
  ImageIcon,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  CreditCard,
  Building,
  UserPlus,
  Wifi,
  RefreshCw,
  CalendarPlus,
  X,
  ArrowRight,
  Waves,
  Flower2,
  Droplets,
  CheckCircle2,
  Building2,
  BadgePercent,
  Handshake,
  IndianRupee,
  Clock,
  BadgeCheck,
  Star,
  ChevronDown,
  Eye,
  Crown,
  Globe,
  ExternalLink,
  QrCode,
  Filter,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { QuickReservationModal } from '@/components/hotel/operations/QuickReservationModal';
import { OwnerVipBookingModal } from '@/components/hotel/bookings/OwnerVipBookingModal';
import { ReservationDetailDrawer } from '@/components/hotel/calendar/ReservationDetailDrawer';
import { KycUploadModal } from '@/components/hotel/bookings/KycUploadModal';
import {
  parseEmailBookingDetails,
  matchRoomTypeFromCategory,
  getAvailableRoomsForCategory,
} from '@/lib/email-booking-parser';

const DEFAULT_POOL_PASS_OPTIONS = [
  { id: 'p0', name: 'Complimentary / Free Pool Access', category: 'COMPLIMENTARY', price: 0, duration: 'Free / Stay' },
  { id: 'p0b', name: 'Complimentary In-House Guest Pool Pass', category: 'COMPLIMENTARY', price: 0, duration: 'Complimentary' },
  { id: 'p1', name: 'Early Bird Morning Lap Pass', category: 'STANDARD', price: 350, duration: 'Morning (6 AM - 10 AM)' },
  { id: 'p2', name: 'Standard Swimming Pool Pass', category: 'STANDARD', price: 500, duration: 'Full Day' },
  { id: 'p3', name: 'All-Day VIP Cabana Pass', category: 'VIP_CABANA', price: 1200, duration: 'Full Day' },
  { id: 'p4', name: 'Sunset Cocktail & Jacuzzi Pass', category: 'SUNSET_PASS', price: 1500, duration: 'Evening (4 PM - 9 PM)' },
  { id: 'p5', name: 'Family Splash & Fun Pass', category: 'FAMILY_PASS', price: 1800, duration: 'Full Day' },
  { id: 'p6', name: 'Weekend Royal Luxury Pool Suite Pass', category: 'VIP_CABANA', price: 2500, duration: 'Full Day' },
];

const DEFAULT_SPA_PACKAGES = [
  { id: 'NONE', name: 'No Spa Package (₹0)', price: 0 },
  { id: 'COMPLIMENTARY_WELCOME', name: 'Complimentary Welcome Spa & Foot Massage (₹0 / Free)', price: 0 },
  { id: 'COMPLIMENTARY_HEAD', name: 'Complimentary 15-Min Head & Shoulder Relaxation (₹0 / Free)', price: 0 },
  { id: 'RELAXATION_60MIN', name: 'Swedish Relaxation Massage - 60m (₹1,800)', price: 1800 },
  { id: 'DETOX_SAUNA', name: 'Full Body Detox & Hot Stone Therapy (₹2,800)', price: 2800 },
  { id: 'COUPLE_SPA', name: 'Royal Couple Wellness Spa Day (₹4,500)', price: 4500 },
  { id: 'AYURVEDIC', name: 'Traditional Ayurvedic Rejuvenation (₹3,200)', price: 3200 },
];

// Separate inner component to use search params safely inside Suspense
function BookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramRoomId = searchParams.get('roomId') || '';
  const paramArrival = searchParams.get('arr') || '';
  const paramDeparture = searchParams.get('dep') || '';
  const paramGuestId = searchParams.get('guestId') || '';
  const paramFirstName = searchParams.get('firstName') || searchParams.get('name') || '';
  const paramLastName = searchParams.get('lastName') || '';
  const paramMobile = searchParams.get('mobile') || searchParams.get('phone') || '';
  const paramEmail = searchParams.get('email') || '';
  const paramIdType = searchParams.get('idType') || '';
  const paramIdNumber = searchParams.get('idNumber') || '';
  const paramAddress = searchParams.get('address') || '';
  const paramNationality = searchParams.get('nationality') || '';
  const paramCompanyName = searchParams.get('companyName') || '';
  const paramGstNumber = searchParams.get('gstNumber') || '';

  const initialGuestFromParams = useMemo(() => {
    if (paramGuestId || paramMobile || paramFirstName) {
      return {
        id: paramGuestId || undefined,
        firstName: paramFirstName || undefined,
        lastName: paramLastName || undefined,
        mobile: paramMobile || undefined,
        email: paramEmail || undefined,
        idType: paramIdType || undefined,
        idNumber: paramIdNumber || undefined,
        address: paramAddress || undefined,
        nationality: paramNationality || undefined,
        companyName: paramCompanyName || undefined,
        gstNumber: paramGstNumber || undefined,
      };
    }
    return null;
  }, [
    paramGuestId,
    paramFirstName,
    paramLastName,
    paramMobile,
    paramEmail,
    paramIdType,
    paramIdNumber,
    paramAddress,
    paramNationality,
    paramCompanyName,
    paramGstNumber,
  ]);

  // Tab State: 'list' or 'agent-bookings'
  const [activeTab, setActiveTab] = useState<'list' | 'agent-bookings'>('list');
  const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);
  const [isOwnerVipModalOpen, setIsOwnerVipModalOpen] = useState(false);

  // Agent Bookings State
  const [agentBookings, setAgentBookings] = useState<any[]>([]);
  const [agentBookingsLoading, setAgentBookingsLoading] = useState(false);
  const [agentBookingSearch, setAgentBookingSearch] = useState('');
  const [agentBookingStatusFilter, setAgentBookingStatusFilter] = useState('ALL');
  const [updatingAgentBooking, setUpdatingAgentBooking] = useState<string | null>(null);

  // Email / OTA Bookings State
  const [emailBookings, setEmailBookings] = useState<any[]>([]);
  const [selectedEmailBooking, setSelectedEmailBooking] = useState<any | null>(null);
  const [importEmailModalBooking, setImportEmailModalBooking] = useState<any | null>(null);
  const [importingEmail, setImportingEmail] = useState(false);
  const [emailImportForm, setEmailImportForm] = useState({
    id: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    amount: '',
    advanceAmount: '',
    roomTypeId: '',
    assignedRoomId: '',
    adults: 2,
    children: 0,
    mealPlan: 'RO' as 'RO' | 'CP' | 'MAP' | 'AP',
    source: 'Direct',
    detectedRoomCategory: '',
    roomsCount: 1,
    addOnNotes: '',
    isPrepaid: false,
  });

  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Booking Filters (Date & Source & Agent)
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'DIRECT' | 'AGENT' | 'EMAIL'>('ALL');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('ALL');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [dateFilterType, setDateFilterType] = useState<'STAY' | 'ARRIVAL' | 'DEPARTURE'>('STAY');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const formattedRoomsList = useMemo(() => {
    return (rooms || []).map((r: any) => ({
      id: r.id,
      roomNumber: r.roomNumber,
      roomTypeName: r.roomType?.name || (roomTypes.find((t: any) => t.id === r.roomTypeId)?.name) || 'Standard Room',
      roomTypeId: r.roomTypeId,
      baseRate: r.roomType?.baseRate || (roomTypes.find((t: any) => t.id === r.roomTypeId)?.baseRate) || 3500,
      status: r.status,
    }));
  }, [rooms, roomTypes]);

  const [dynamicPoolPasses, setDynamicPoolPasses] = useState<any[]>(DEFAULT_POOL_PASS_OPTIONS);

  // Check-In & KYC modal states for existing bookings
  const [activeCheckInReservation, setActiveCheckInReservation] = useState<any>(null);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [expectedCheckout, setExpectedCheckout] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Stay settings edit modal states
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [editWifiPassword, setEditWifiPassword] = useState('');
  const [editWifiStatus, setEditWifiStatus] = useState('ACTIVE');
  const [editMealPlan, setEditMealPlan] = useState('EP');
  const [editPoolAccess, setEditPoolAccess] = useState(false);
  const [editPoolPackage, setEditPoolPackage] = useState('NONE');
  const [editPoolPassCost, setEditPoolPassCost] = useState('0');
  const [editSpaPackage, setEditSpaPackage] = useState('NONE');
  const [editSpaPackageCost, setEditSpaPackageCost] = useState('0');
  const [editAddOnNotes, setEditAddOnNotes] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Extend Stay modal states
  const [extendingBooking, setExtendingBooking] = useState<any>(null);
  const [newDepartureDate, setNewDepartureDate] = useState('');
  const [extendSubmitting, setExtendSubmitting] = useState(false);

  // Booking Detail Drawer & Dedicated KYC Modal
  const [selectedDrawerBooking, setSelectedDrawerBooking] = useState<any>(null);
  const [kycModalBooking, setKycModalBooking] = useState<any>(null);

  const startCheckIn = (b: any) => {
    try {
      setActiveCheckInReservation(b);
      setExpectedCheckout(b.departureDate ? b.departureDate.split('T')[0] : '');
      setIdType(b.guest?.idType || 'Aadhaar Card');
      setIdNumber(b.guest?.idNumber || '');

      const existingDoc = b.guest?.documents?.[0]?.documentUrl || '';
      setDocumentUrl(existingDoc);

      // Auto-select room if already assigned in booking
      if (b.assignedRoomId) {
        setSelectedRoomId(b.assignedRoomId);
      } else {
        // Find first available room of the reserved type
        const matchingRoom = (rooms || []).find(
          (r: any) => r.roomTypeId === b.roomTypeId && r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN'
        );
        if (matchingRoom) {
          setSelectedRoomId(matchingRoom.id);
        } else {
          setSelectedRoomId('');
        }
      }
    } catch (err: any) {
      console.error("Error starting check-in:", err);
      toast.error("Error starting check-in: " + err.message);
    }
  };


  const handleMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setTimeout(() => {
      setDocumentUrl(`/uploads/kyc/${file.name}`);
      setUploading(false);

      if (!idNumber) {
        if (idType === 'Aadhaar Card') {
          const ad1 = Math.floor(1000 + Math.random() * 9000);
          const ad2 = Math.floor(1000 + Math.random() * 9000);
          const ad3 = Math.floor(1000 + Math.random() * 9000);
          setIdNumber(`${ad1}-${ad2}-${ad3}`);
        } else if (idType === 'Passport') {
          const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
          const num = Math.floor(1000000 + Math.random() * 9000000);
          setIdNumber(`${char}${num}`);
        } else {
          const chars = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
          const num = Math.floor(100000 + Math.random() * 900000);
          setIdNumber(`${chars}${num}`);
        }
      }
      toast.success('AI OCR Scanner: Identity scan complete!');
    }, 1500);
  };

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCheckInReservation || !selectedRoomId || !expectedCheckout) {
      toast.error('Please select an assigned room and expected checkout date.');
      return;
    }

    setSubmittingCheckIn(true);
    try {
      const payload = {
        reservationId: activeCheckInReservation.id,
        guestId: activeCheckInReservation.guestId,
        roomId: selectedRoomId,
        expectedCheckoutAt: expectedCheckout,
        kycData: {
          idType,
          idNumber,
          documentType: idType,
          documentUrl: documentUrl || null,
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
        toast.success('Guest Checked-in successfully!');
        setActiveCheckInReservation(null);
        loadData(); // Refresh list
      } else {
        toast.error(data.message || 'Check-in failed.');
      }
    } catch (err) {
      toast.error('Error submitting check-in.');
    } finally {
      setSubmittingCheckIn(false);
    }
  };

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/hotel/bookings').then((res) => res.json()),
      fetch('/api/hotel/rooms').then((res) => res.json()),
      fetch('/api/hotel/room-types').then((res) => res.json()),
      fetch('/api/hotel/pool-passes').then((res) => res.json()),
      fetch('/api/hotel/email-bookings').then((res) => res.json()).catch(() => ({ success: false })),
      fetch('/api/hotel/agent-bookings').then((res) => res.json()).catch(() => ({ success: false })),
    ])
      .then(([bookingsRes, roomsRes, typesRes, poolPassesRes, emailRes, agentRes]) => {
        if (bookingsRes.success) setBookings(bookingsRes.data);
        if (roomsRes.success) setRooms(roomsRes.data);
        if (typesRes.success) setRoomTypes(typesRes.data);
        if (emailRes?.success) setEmailBookings(emailRes.data || []);
        if (agentRes?.success) setAgentBookings(agentRes.data || []);
        if (poolPassesRes.success) {
          const apiPasses = poolPassesRes.data || [];
          const hasComplimentary = apiPasses.some((p: any) => p.price === 0 || p.name.toLowerCase().includes('complimentary') || p.name.toLowerCase().includes('free'));
          if (!hasComplimentary && apiPasses.length > 0) {
            setDynamicPoolPasses([
              { id: 'p0', name: 'Complimentary / Free Pool Access', category: 'COMPLIMENTARY', price: 0, duration: 'Free / Stay' },
              { id: 'p0b', name: 'Complimentary In-House Guest Pool Pass', category: 'COMPLIMENTARY', price: 0, duration: 'Complimentary' },
              ...apiPasses,
            ]);
          } else if (apiPasses.length > 0) {
            setDynamicPoolPasses(apiPasses);
          }
        }

        // If pre-filled parameters were passed, auto-open booking wizard
        if (paramRoomId && roomsRes.success) {
          setIsCreateWizardOpen(true);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching bookings:', err);
        setLoading(false);
      });
  };

  // Silent background reload for real-time sync with mobile staff uploads
  const silentReloadBookings = () => {
    fetch('/api/hotel/bookings')
      .then((res) => res.json())
      .then((bookingsRes) => {
        if (bookingsRes.success && Array.isArray(bookingsRes.data)) {
          setBookings(bookingsRes.data);
        }
      })
      .catch(() => { });

    fetch('/api/hotel/email-bookings')
      .then((res) => res.json())
      .then((emailRes) => {
        if (emailRes.success && Array.isArray(emailRes.data)) {
          setEmailBookings(emailRes.data);
        }
      })
      .catch(() => { });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      silentReloadBookings();
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const openEmailImportModal = (bookingRow: any) => {
    const eb = bookingRow.emailBooking || bookingRow;
    const parsed =
      bookingRow.parsedEmailDetails ||
      parseEmailBookingDetails(eb.subject || '', eb.body || '', eb.guestName, eb.guestEmail, eb.guestPhone);

    const toDateStr = (val: string | Date | null | undefined) => {
      if (!val) return '';
      const d = val instanceof Date ? val : new Date(val);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    };

    const checkInStr = toDateStr(parsed.checkIn || eb.checkIn || bookingRow.arrivalDate);
    const checkOutStr = toDateStr(parsed.checkOut || eb.checkOut || bookingRow.departureDate);
    const matchedRT = matchRoomTypeFromCategory(parsed.roomCategory, roomTypes);
    const selectedRoomTypeId = matchedRT?.id || roomTypes[0]?.id || '';
    const availableRooms = getAvailableRoomsForCategory(selectedRoomTypeId, rooms, bookings, checkInStr, checkOutStr);
    const autoRoom = availableRooms.find((r: any) => r.isReady) || availableRooms[0];
    const totalAmt = parsed.amount ?? eb.amount ?? bookingRow.totalAmount ?? 0;

    setEmailImportForm({
      id: eb.id,
      guestName: parsed.guestName || eb.guestName || bookingRow.guestName || 'OTA Guest',
      guestEmail: parsed.guestEmail || eb.guestEmail || bookingRow.guestEmail || '',
      guestPhone: parsed.guestPhone || eb.guestPhone || bookingRow.guestMobile || '',
      checkIn: checkInStr,
      checkOut: checkOutStr,
      amount: totalAmt ? String(totalAmt) : '',
      advanceAmount: parsed.isPrepaid && totalAmt ? String(totalAmt) : '',
      roomTypeId: selectedRoomTypeId,
      assignedRoomId: autoRoom?.id || '',
      adults: parsed.adults || 2,
      children: parsed.children || 0,
      mealPlan: parsed.mealPlan || 'RO',
      source: parsed.source || eb.source || bookingRow.source || 'Direct',
      detectedRoomCategory: parsed.roomCategory || '',
      roomsCount: parsed.roomsCount || 1,
      addOnNotes: parsed.specialRequests || '',
      isPrepaid: parsed.isPrepaid || false,
    });
    setSelectedEmailBooking(null);
    setImportEmailModalBooking(bookingRow);
  };

  const handleConfirmEmailImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailImportForm.id) return;
    setImportingEmail(true);
    try {
      const res = await fetch('/api/hotel/email-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailBookingId: emailImportForm.id,
          action: 'IMPORT',
          guestName: emailImportForm.guestName,
          guestEmail: emailImportForm.guestEmail,
          guestPhone: emailImportForm.guestPhone,
          checkIn: emailImportForm.checkIn,
          checkOut: emailImportForm.checkOut,
          amount: emailImportForm.amount ? Number(emailImportForm.amount) : 0,
          advanceAmount: emailImportForm.advanceAmount ? Number(emailImportForm.advanceAmount) : 0,
          roomTypeId: emailImportForm.roomTypeId,
          assignedRoomId: emailImportForm.assignedRoomId || null,
          adults: Number(emailImportForm.adults) || 2,
          children: Number(emailImportForm.children) || 0,
          mealPlan: emailImportForm.mealPlan || 'RO',
          addOnNotes: emailImportForm.addOnNotes || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Imported & Room Allotted for ${emailImportForm.guestName}!`);
        setImportEmailModalBooking(null);
        loadData();
      } else {
        toast.error(json.message || 'Failed to import email booking');
      }
    } catch {
      toast.error('Network error importing booking');
    } finally {
      setImportingEmail(false);
    }
  };

  const handleRejectEmailBooking = async (emailBookingId: string) => {
    setImportingEmail(true);
    try {
      const res = await fetch('/api/hotel/email-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailBookingId, action: 'REJECT' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Email booking marked as rejected');
        setSelectedEmailBooking(null);
        setImportEmailModalBooking(null);
        loadData();
      } else {
        toast.error(json.message || 'Failed to reject booking');
      }
    } catch {
      toast.error('Network error rejecting booking');
    } finally {
      setImportingEmail(false);
    }
  };

  const loadAgentBookings = async () => {
    setAgentBookingsLoading(true);
    try {
      const res = await fetch('/api/hotel/agent-bookings');
      const data = await res.json();
      if (data.success) setAgentBookings(data.data);
    } catch (err) {
      console.error('Error fetching agent bookings:', err);
    } finally {
      setAgentBookingsLoading(false);
    }
  };

  const handleAgentBookingStatusUpdate = async (id: string, status: string) => {
    setUpdatingAgentBooking(id);
    try {
      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Booking ${status === 'CONFIRMED' ? 'confirmed ✓' : status === 'CANCELLED' ? 'rejected ✗' : 'updated'} successfully!`);
        loadAgentBookings();
      } else {
        toast.error(data.message || 'Update failed.');
      }
    } catch {
      toast.error('Connection error.');
    } finally {
      setUpdatingAgentBooking(null);
    }
  };

  useEffect(() => {
    loadData();
    loadAgentBookings();
    if (paramRoomId || searchParams.get('create') === 'true' || searchParams.get('wizard') === 'true' || paramGuestId || paramMobile) {
      setIsCreateWizardOpen(true);
    }
  }, [paramRoomId, paramArrival, paramDeparture, paramGuestId, paramMobile, searchParams]);

  const startEditingStay = (b: any) => {
    setEditingBooking(b);
    setEditWifiPassword(b.wifiPassword || '');
    setEditWifiStatus(b.wifiStatus || 'ACTIVE');
    setEditMealPlan(b.mealPlan === 'RO' ? 'EP' : (b.mealPlan || 'EP'));
    setEditPoolAccess(b.poolAccess || false);
    setEditPoolPackage(b.poolPackage || 'NONE');
    setEditPoolPassCost((b.poolPassCost || 0).toString());
    setEditSpaPackage(b.spaPackage || 'NONE');
    setEditSpaPackageCost((b.spaPackageCost || 0).toString());
    setEditAddOnNotes(b.addOnNotes || '');
  };

  const startExtendStay = (b: any) => {
    setExtendingBooking(b);
    // Default new departure = current departure date
    const curDep = b.departureDate ? b.departureDate.split('T')[0] : '';
    setNewDepartureDate(curDep);
  };

  const handleExtendStay = async () => {
    if (!extendingBooking || !newDepartureDate) return;
    const curDep = extendingBooking.departureDate?.split('T')[0] || '';
    if (newDepartureDate <= curDep) {
      toast.error('New departure date must be after current departure date.');
      return;
    }
    // Calculate extra nights and charge
    const extraNights = Math.round(
      (new Date(newDepartureDate).getTime() - new Date(curDep).getTime()) / 86400000
    );
    const ratePerNight = extendingBooking.rooms?.[0]?.ratePerNight
      || (extendingBooking.totalAmount / Math.max(1,
        Math.round((new Date(curDep).getTime() - new Date(extendingBooking.arrivalDate).getTime()) / 86400000)
      ));
    const extraCharge = Math.round(ratePerNight * extraNights);

    setExtendSubmitting(true);
    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: extendingBooking.id,
          departureDate: newDepartureDate,
          extraCharge,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Stay extended by ${extraNights} night(s)! Extra charge: ₹${extraCharge.toLocaleString()}`);
        setExtendingBooking(null);
        loadData();
      } else {
        toast.error(data.message || 'Failed to extend stay.');
      }
    } catch {
      toast.error('Connection error extending stay.');
    } finally {
      setExtendSubmitting(false);
    }
  };

  const regenerateWifiPassword = () => {
    const roomNumber = editingBooking?.rooms?.[0]?.room?.roomNumber || 'WIFI';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setEditWifiPassword(`${roomNumber}-${randomPart}`);
  };


  const handleSaveStaySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    setSavingSettings(true);
    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingBooking.id,
          wifiPassword: editWifiPassword,
          wifiStatus: editWifiStatus,
          mealPlan: editMealPlan,
          poolAccess: editPoolAccess,
          poolPackage: editPoolPackage,
          poolPassCost: Number(editPoolPassCost || 0),
          spaPackage: editSpaPackage,
          spaPackageCost: Number(editSpaPackageCost || 0),
          addOnNotes: editAddOnNotes,
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Stay settings updated successfully!');
        setEditingBooking(null);
        loadData(); // reload bookings
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Failed to save stay settings.');
    } finally {
      setSavingSettings(false);
    }
  };



  const handleEditMealPlanChange = (plan: string) => {
    setEditMealPlan(plan);
    if (plan === 'AI') {
      setEditPoolAccess(true);
      setEditPoolPackage('Complimentary / Free Pool Access');
      setEditPoolPassCost('0');
      setEditSpaPackage('COMPLIMENTARY_WELCOME');
      setEditSpaPackageCost('0');
    } else if (plan === 'FB' || plan === 'MAP') {
      setEditPoolAccess(true);
      setEditPoolPackage('Complimentary / Free Pool Access');
      setEditPoolPassCost('0');
    }
  };


  // Helper to compute date range from presets
  const getPresetDates = (preset: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === 'TODAY') {
      const today = toYMD(now);
      return { start: today, end: today };
    }
    if (preset === 'TOMORROW') {
      const tom = new Date(now.getTime() + 86400000);
      const tomStr = toYMD(tom);
      return { start: tomStr, end: tomStr };
    }
    if (preset === 'THIS_WEEK') {
      const start = toYMD(now);
      const nextWeek = new Date(now.getTime() + 7 * 86400000);
      const end = toYMD(nextWeek);
      return { start, end };
    }
    if (preset === 'THIS_MONTH') {
      const start = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const end = toYMD(lastDay);
      return { start, end };
    }
    return { start: '', end: '' };
  };

  const handleDatePresetChange = (preset: 'ALL' | 'TODAY' | 'TOMORROW' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM') => {
    setDatePreset(preset);
    if (preset !== 'CUSTOM') {
      const { start, end } = getPresetDates(preset);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSourceFilter('ALL');
    setSelectedAgentId('ALL');
    setBookingStatusFilter('ALL');
    setDatePreset('ALL');
    setDateFilterType('STAY');
    setStartDate('');
    setEndDate('');
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (sourceFilter !== 'ALL') count++;
    if (selectedAgentId !== 'ALL') count++;
    if (bookingStatusFilter !== 'ALL') count++;
    if (startDate || endDate || datePreset !== 'ALL') count++;
    return count;
  }, [searchQuery, sourceFilter, selectedAgentId, bookingStatusFilter, startDate, endDate, datePreset]);

  // Unique agents discovered across bookings
  const availableAgents = useMemo(() => {
    const map = new Map<string, { id: string; name: string; code: string }>();
    (agentBookings || []).forEach((ab: any) => {
      if (ab.agent?.id) {
        map.set(ab.agent.id, {
          id: ab.agent.id,
          name: ab.agent.name || 'Agent',
          code: ab.agent.agentCode || '',
        });
      }
    });
    (bookings || []).forEach((b: any) => {
      if (b.agent?.id) {
        map.set(b.agent.id, {
          id: b.agent.id,
          name: b.agent.name || 'Agent',
          code: b.agent.agentCode || '',
        });
      }
    });
    return Array.from(map.values());
  }, [agentBookings, bookings]);

  // Unified list of bookings (Reservations + Standalone Agent Bookings)
  const unifiedBookings = useMemo(() => {
    // 1. Process regular reservations and enrich with agent info
    const list: any[] = (bookings || []).map((b: any) => {
      const linkedAb = b.agentBooking || (agentBookings || []).find((ab: any) => ab.reservationId === b.id);
      const isAgent = Boolean(b.agent || linkedAb?.agent);
      return {
        ...b,
        isAgentBooking: isAgent,
        agent: b.agent || linkedAb?.agent || null,
        agentBooking: b.agentBooking || linkedAb || null,
      };
    });

    // 2. Add unlinked agent bookings (e.g. PENDING agent bookings awaiting allotment)
    const existingResIds = new Set(list.map((b) => b.id));
    (agentBookings || []).forEach((ab: any) => {
      if (!ab.reservationId || !existingResIds.has(ab.reservationId)) {
        list.push({
          id: ab.id,
          isStandaloneAgentBooking: true,
          isAgentBooking: true,
          bookingNo: ab.bookingNo || `AGT-${ab.id.slice(-6).toUpperCase()}`,
          arrivalDate: ab.checkIn,
          departureDate: ab.checkOut,
          createdAt: ab.createdAt,
          guest: {
            id: null,
            firstName: ab.guestName || 'Agent Guest',
            lastName: '',
            mobile: ab.guestPhone || '',
            email: ab.guestEmail || '',
            idType: null,
            idNumber: null,
            documents: [],
            companyName: ab.agent?.name ? `Via ${ab.agent.name}` : undefined,
          },
          guestName: ab.guestName,
          status: ab.status,
          roomType: { name: ab.roomType || 'Standard' },
          rooms: ab.assignedRooms?.map((r: any) => ({ room: r })) || (ab.assignedRoom ? [{ room: ab.assignedRoom }] : []),
          totalAmount: ab.totalAmount || 0,
          advanceAmount: 0,
          dueAmount: ab.totalAmount || 0,
          mealPlan: 'EP',
          isOwnerGuest: false,
          waiveBill: false,
          agent: ab.agent || null,
          agentBooking: ab,
          commission: ab.commission || 0,
        });
      }
    });

    // 3. Add unlinked/pending Email & OTA bookings (e.g. Booking.com, MMT, Agoda, Direct Email)
    (emailBookings || []).forEach((eb: any) => {
      if (eb.status === 'REJECTED') return;

      // Extract reference number if present in subject (e.g. #BK-984712 or NH7L65O6MMG2T)
      const refMatch = eb.subject?.match(/(?:#|Booking\s+ID\s*[:#]*\s*|\|\s*)([A-Z0-9-]{6,20})/i);
      const bookingNo = refMatch ? refMatch[1] : (eb.bookingNo || `OTA-${eb.id.slice(-6).toUpperCase()}`);

      const parsed = parseEmailBookingDetails(
        eb.subject || '',
        eb.body || '',
        eb.guestName,
        eb.guestEmail,
        eb.guestPhone
      );

      const finalGuestName = parsed.guestName || eb.guestName || 'OTA Guest';
      const finalGuestEmail = parsed.guestEmail || eb.guestEmail || '';
      const finalGuestPhone = parsed.guestPhone || eb.guestPhone || '';
      const finalCheckIn = parsed.checkIn || eb.checkIn || eb.createdAt;
      const finalCheckOut = parsed.checkOut || eb.checkOut || (finalCheckIn ? new Date(new Date(finalCheckIn).getTime() + 86400000) : new Date(Date.now() + 86400000));
      const finalAmount = parsed.amount ?? eb.amount ?? 0;

      const matchedRT = matchRoomTypeFromCategory(parsed.roomCategory, roomTypes);

      // If already imported and present in reservations list, skip duplicate
      const alreadyInList = eb.status === 'IMPORTED' && list.some(
        (b) => b.bookingNo?.startsWith('EB-') && ((finalGuestEmail && b.guest?.email === finalGuestEmail) || (finalGuestPhone && b.guest?.mobile === finalGuestPhone))
      );
      if (alreadyInList) return;

      list.push({
        id: eb.id,
        isEmailBooking: true,
        isStandaloneAgentBooking: false,
        isAgentBooking: false,
        bookingNo,
        arrivalDate: finalCheckIn,
        departureDate: finalCheckOut,
        createdAt: eb.createdAt,
        guest: {
          id: null,
          firstName: finalGuestName,
          lastName: '',
          mobile: finalGuestPhone,
          email: finalGuestEmail,
          idType: null,
          idNumber: null,
          documents: [],
          companyName: parsed.source || eb.source || 'Email / OTA',
        },
        guestName: finalGuestName,
        guestMobile: finalGuestPhone,
        guestEmail: finalGuestEmail,
        status: eb.status === 'IMPORTED' ? 'CONFIRMED' : (eb.status || 'PENDING'),
        roomType: {
          id: matchedRT?.id,
          name: parsed.roomCategory
            ? `${parsed.roomCategory}${parsed.roomsCount > 1 ? ` (${parsed.roomsCount} Rooms)` : ''}`
            : (matchedRT?.name || `${eb.source || 'Online OTA'} Room`),
          matchedName: matchedRT?.name,
        },
        rooms: [],
        adults: parsed.adults,
        children: parsed.children,
        totalAmount: finalAmount,
        advanceAmount: parsed.isPrepaid ? finalAmount : 0,
        dueAmount: parsed.isPrepaid ? 0 : finalAmount,
        mealPlan: parsed.mealPlan || 'RO',
        isOwnerGuest: false,
        waiveBill: false,
        emailBooking: eb,
        parsedEmailDetails: parsed,
        source: parsed.source || eb.source || 'Email Booking',
      });
    });

    return list;
  }, [bookings, agentBookings, emailBookings, roomTypes]);

  // Filtered Bookings based on Search, Source, Agent, Status & Date Filter
  const filteredBookings = useMemo(() => {
    return unifiedBookings.filter((b) => {
      // 1. Text Search Filter
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const guestName = `${b.guest?.firstName || ''} ${b.guest?.lastName || ''}`.toLowerCase();
        const bookingNo = (b.bookingNo || '').toLowerCase();
        const guestEmail = (b.guest?.email || '').toLowerCase();
        const guestMobile = (b.guest?.mobile || '').toLowerCase();
        const roomNumber = (b.rooms?.[0]?.room?.roomNumber || '').toLowerCase();
        const company = (b.companyName || b.guest?.companyName || '').toLowerCase();
        const gst = (b.gstNumber || b.guest?.gstNumber || '').toLowerCase();
        const agentName = (b.agent?.name || '').toLowerCase();
        const agentCode = (b.agent?.agentCode || '').toLowerCase();
        const sourceName = (b.source || b.emailBooking?.source || '').toLowerCase();
        const emailSubject = (b.emailBooking?.subject || '').toLowerCase();
        const emailSender = (b.emailBooking?.sender || '').toLowerCase();
        const matchesQuery =
          guestName.includes(q) ||
          bookingNo.includes(q) ||
          guestEmail.includes(q) ||
          guestMobile.includes(q) ||
          roomNumber.includes(q) ||
          company.includes(q) ||
          gst.includes(q) ||
          agentName.includes(q) ||
          agentCode.includes(q) ||
          sourceName.includes(q) ||
          emailSubject.includes(q) ||
          emailSender.includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Source Filter: 'ALL' | 'DIRECT' | 'AGENT' | 'EMAIL'
      if (sourceFilter === 'DIRECT' && (b.isAgentBooking || b.isEmailBooking)) return false;
      if (sourceFilter === 'AGENT' && !b.isAgentBooking) return false;
      if (sourceFilter === 'EMAIL' && !b.isEmailBooking) return false;

      // 3. Specific Agent Filter
      if (selectedAgentId !== 'ALL') {
        if (!b.agent || b.agent.id !== selectedAgentId) return false;
      }

      // 4. Status Filter
      if (bookingStatusFilter !== 'ALL') {
        if (b.status !== bookingStatusFilter) return false;
      }

      // 5. Date Filter
      const filterStart = startDate;
      const filterEnd = endDate || startDate;

      if (filterStart) {
        if (!b.arrivalDate || !b.departureDate) return false;

        const pad = (n: number) => String(n).padStart(2, '0');
        const toYMD = (d: any) => {
          const dateObj = new Date(d);
          if (isNaN(dateObj.getTime())) return '';
          return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
        };

        const bArr = toYMD(b.arrivalDate);
        const bDep = toYMD(b.departureDate);

        if (dateFilterType === 'ARRIVAL') {
          if (!bArr || bArr < filterStart || bArr > filterEnd) return false;
        } else if (dateFilterType === 'DEPARTURE') {
          if (!bDep || bDep < filterStart || bDep > filterEnd) return false;
        } else {
          // STAY / OVERLAP:
          // Stay is active during [filterStart, filterEnd] if arrival <= filterEnd AND departure >= filterStart
          if (!bArr || !bDep) return false;
          if (bArr > filterEnd || bDep < filterStart) return false;
        }
      }

      return true;
    });
  }, [unifiedBookings, searchQuery, sourceFilter, selectedAgentId, bookingStatusFilter, startDate, endDate, dateFilterType]);

  const bookingMetrics = useMemo(() => {
    const total = unifiedBookings.length;
    const checkedIn = unifiedBookings.filter((b) => b.status === 'CHECKED_IN').length;
    const agentCount = unifiedBookings.filter((b) => b.isAgentBooking).length;
    const emailCount = unifiedBookings.filter((b) => b.isEmailBooking).length;
    const directCount = Math.max(0, total - agentCount - emailCount);
    return { total, checkedIn, agentCount, emailCount, directCount };
  }, [unifiedBookings]);

  return (
    <div className="space-y-4">
      {/* Header and Premium tab structure - Sleek & Balanced */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="space-y-0.5">
          <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-indigo-400">
            <Sparkles size={11} /> Reservations Desk
          </span>
          <h1 className="text-xl md:text-2xl font-black text-white leading-tight">
            Bookings &amp; Scheduling
          </h1>
        </div>

        {/* Tab Controls & Wizard Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-0.5 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <CalendarDays size={13} /> Active Bookings
            </button>
            <button
              onClick={() => { setActiveTab('agent-bookings'); loadAgentBookings(); }}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 relative cursor-pointer ${activeTab === 'agent-bookings'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Handshake size={13} /> Agent Bookings
              {agentBookings.filter(b => b.status === 'PENDING').length > 0 && (
                <span className="ml-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full leading-none">
                  {agentBookings.filter(b => b.status === 'PENDING').length}
                </span>
              )}
            </button>
            <Link
              href="/hotel/email-bookings"
              className="px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
              title="Open dedicated Email & OTA Bookings Desk"
            >
              <Mail size={13} className="text-cyan-400" /> Email &amp; OTA
              {emailBookings.filter(b => b.status === 'PENDING').length > 0 && (
                <span className="ml-1 bg-cyan-500 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full leading-none animate-pulse">
                  {emailBookings.filter(b => b.status === 'PENDING').length}
                </span>
              )}
            </Link>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <a
              href="/guest-portal"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
              title="Open Guest Self-Service Portal in new tab"
            >
              <Globe size={13} className="text-indigo-400" />
              <span>Guest Portal</span>
              <ExternalLink size={10} className="text-slate-400" />
            </a>

            <Link
              href="/hotel/rooms/qr-codes"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
              title="Print QR Standees & Placards"
            >
              <QrCode size={13} className="text-emerald-400" />
              <span>QR Codes</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsOwnerVipModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 border border-amber-300/30 active:scale-95 cursor-pointer"
            >
              <Crown size={13} /> + Owner / VIP
            </button>

            <button
              type="button"
              onClick={() => setIsCreateWizardOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/25 border border-indigo-400/25 active:scale-95 cursor-pointer"
            >
              <Plus size={14} /> Create Booking
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Area */}
      {loading ? (
        <div className="h-[50vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="animate-spin text-indigo-500 mx-auto" size={32} />
            <p className="text-xs text-slate-500 font-medium">Fetching reservations database...</p>
          </div>
        </div>
      ) : activeTab === 'agent-bookings' ? (
        /* ─── Agent Bookings Tab ─── */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-3.5 text-slate-500" size={15} />
                <input
                  type="text"
                  value={agentBookingSearch}
                  onChange={(e) => setAgentBookingSearch(e.target.value)}
                  placeholder="Search guest or agent..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-100 text-xs focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
              <select
                value={agentBookingStatusFilter}
                onChange={(e) => setAgentBookingStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-100 text-xs focus:outline-none focus:border-violet-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <button
              onClick={loadAgentBookings}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all"
            >
              <RefreshCw size={13} className={agentBookingsLoading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {/* Stats Bar */}
          {(() => {
            const pending = agentBookings.filter(b => b.status === 'PENDING').length;
            const confirmed = agentBookings.filter(b => b.status === 'CONFIRMED').length;
            const checkedIn = agentBookings.filter(b => b.status === 'CHECKED_IN').length;
            const totalComm = agentBookings.reduce((s, b) => s + (b.commission || 0), 0);
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Pending Review', val: pending, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20', icon: Clock },
                  { label: 'Confirmed', val: confirmed, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', icon: BadgeCheck },
                  { label: 'Checked In', val: checkedIn, color: 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/20', icon: UserCheck },
                  { label: 'Total Commission', val: `₹${totalComm.toLocaleString()}`, color: 'text-violet-400', bg: 'bg-violet-500/5 border-violet-500/20', icon: IndianRupee },
                ].map(({ label, val, color, bg, icon: Icon }) => (
                  <div key={label} className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${bg}`}>
                    <Icon size={18} className={color} />
                    <div>
                      <div className={`text-lg font-black ${color}`}>{val}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Agent Bookings Table */}
          {agentBookingsLoading ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="animate-spin text-violet-500" size={28} />
            </div>
          ) : (() => {
            const filtered = agentBookings.filter(b => {
              const q = agentBookingSearch.toLowerCase();
              const matchSearch = !q ||
                b.guestName?.toLowerCase().includes(q) ||
                b.agent?.name?.toLowerCase().includes(q) ||
                b.agent?.agentCode?.toLowerCase().includes(q);
              const matchStatus = agentBookingStatusFilter === 'ALL' || b.status === agentBookingStatusFilter;
              return matchSearch && matchStatus;
            });

            const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; dot: string }> = {
              PENDING: { label: 'Pending Review', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400' },
              CONFIRMED: { label: 'Confirmed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
              CHECKED_IN: { label: 'Checked In', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/30', dot: 'bg-sky-400' },
              COMPLETED: { label: 'Completed', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30', dot: 'bg-indigo-400' },
              CANCELLED: { label: 'Cancelled', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30', dot: 'bg-rose-400' },
            };

            return filtered.length === 0 ? (
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/20 py-16 text-center">
                <Handshake size={36} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm font-semibold">No agent bookings found</p>
                <p className="text-slate-600 text-xs mt-1">Agent submitted bookings will appear here</p>
              </div>
            ) : (
              <div className="rounded-3xl bg-[#0f172a]/40 border border-slate-800/80 overflow-hidden shadow-xl backdrop-blur-sm">
                <div className="w-full">
                  <table className="w-full table-fixed border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[10px] font-black uppercase tracking-wider text-slate-400 text-left">
                        <th className="px-3 py-3 w-[18%]">Guest Details</th>
                        <th className="px-3 py-3 w-[14%]">Stay Dates</th>
                        <th className="px-3 py-3 w-[15%]">Room Type</th>
                        <th className="px-3 py-3 w-[15%]">Agent</th>
                        <th className="px-3 py-3 w-[14%]">Amount & Commission</th>
                        <th className="px-3 py-3 w-[11%]">Status</th>
                        <th className="px-3 py-3 w-[13%] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
                      {filtered.map((b) => {
                        const st = STATUS_STYLE[b.status] || STATUS_STYLE['PENDING'];
                        const checkIn = new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                        const checkOut = new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                        const nights = Math.max(1, Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000));
                        const isUpdating = updatingAgentBooking === b.id;

                        return (
                          <tr key={b.id} className="hover:bg-slate-900/20 transition-colors">
                            {/* Guest */}
                            <td className="px-5 py-3 align-top">
                              <div className="font-bold text-white text-sm">{b.guestName}</div>
                              {b.guestPhone && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                                  <Phone size={9} /> {b.guestPhone}
                                </div>
                              )}
                              <div className="text-[9px] text-slate-600 mt-0.5">
                                {b.adults}A{b.children > 0 ? ` + ${b.children}C` : ''}
                              </div>
                            </td>

                            {/* Stay Dates */}
                            <td className="px-5 py-3 align-top">
                              <div className="font-bold text-slate-200">{checkIn}</div>
                              <div className="text-[10px] text-slate-500">→ {checkOut}</div>
                              <div className="text-[9px] text-slate-600 font-semibold mt-0.5">{nights} Night{nights !== 1 ? 's' : ''}</div>
                            </td>

                            {/* Room Type */}
                            <td className="px-5 py-3 align-top">
                              <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                                {b.roomType}
                              </span>
                              {b.specialRequests && (
                                <div className="text-[9px] text-amber-500/80 mt-1 max-w-[140px] truncate" title={b.specialRequests}>
                                  💬 {b.specialRequests}
                                </div>
                              )}
                            </td>

                            {/* Agent */}
                            <td className="px-5 py-3 align-top">
                              <div className="flex items-center gap-1.5">
                                <Handshake size={12} className="text-violet-400" />
                                <span className="font-bold text-violet-300 text-[11px]">{b.agent?.name || '—'}</span>
                              </div>
                              <div className="text-[9px] text-slate-500 font-mono mt-0.5">{b.agent?.agentCode}</div>
                              <div className="text-[9px] text-slate-600 mt-0.5">
                                {b.agent?.commissionRate}% comm.
                              </div>
                            </td>

                            {/* Amount & Commission */}
                            <td className="px-5 py-3 align-top">
                              <div className="flex items-center gap-1 font-black text-emerald-400 text-sm">
                                <IndianRupee size={11} />{b.totalAmount?.toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1 text-[9px] text-violet-400 font-bold mt-0.5">
                                <Star size={9} /> Comm: ₹{(b.commission || 0).toLocaleString()}
                              </div>
                              {b.commissionPaid && (
                                <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded mt-1 inline-block border border-emerald-500/20">
                                  PAID
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-5 py-3 align-top">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold ${st.bg} ${st.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                {st.label}
                              </span>
                              <div className="text-[9px] text-slate-600 mt-1">
                                {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3 align-top text-right">
                              <div className="flex flex-col gap-1.5 items-end">
                                {b.status === 'PENDING' && (
                                  <>
                                    <button
                                      id={`agent-confirm-${b.id}`}
                                      onClick={() => handleAgentBookingStatusUpdate(b.id, 'CONFIRMED')}
                                      disabled={isUpdating}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-[10px] font-black transition-all"
                                    >
                                      {isUpdating ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                                      Confirm
                                    </button>
                                    <button
                                      id={`agent-reject-${b.id}`}
                                      onClick={() => handleAgentBookingStatusUpdate(b.id, 'CANCELLED')}
                                      disabled={isUpdating}
                                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-800 border border-rose-700/40 disabled:opacity-50 text-rose-400 text-[10px] font-bold transition-all"
                                    >
                                      <X size={10} /> Reject
                                    </button>
                                  </>
                                )}
                                {b.status === 'CONFIRMED' && (
                                  <button
                                    id={`agent-checkin-${b.id}`}
                                    onClick={() => handleAgentBookingStatusUpdate(b.id, 'CHECKED_IN')}
                                    disabled={isUpdating}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-[10px] font-black transition-all"
                                  >
                                    {isUpdating ? <Loader2 size={10} className="animate-spin" /> : <UserCheck size={10} />}
                                    Check In
                                  </button>
                                )}
                                {b.status === 'CHECKED_IN' && (
                                  <button
                                    id={`agent-complete-${b.id}`}
                                    onClick={() => handleAgentBookingStatusUpdate(b.id, 'COMPLETED')}
                                    disabled={isUpdating}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black transition-all"
                                  >
                                    {isUpdating ? <Loader2 size={10} className="animate-spin" /> : <BadgeCheck size={10} />}
                                    Complete
                                  </button>
                                )}
                                {(b.status === 'COMPLETED' || b.status === 'CANCELLED') && (
                                  <span className="text-[9px] text-slate-600 italic">No action needed</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        /* Active Bookings Tab View */
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Main Filter & Control Panel - Compact, Sleek & Streamlined */}
          <div className="rounded-2xl bg-[#0b1329]/90 border border-slate-800 p-2.5 sm:p-3 shadow-md space-y-2">
            {/* Row 1: Search + Channel/Source Toggle + Agent Dropdown + Status Dropdown */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
              {/* Search Box - Compact & Sleek */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" size={13} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search guest, booking #, phone, room, agent..."
                  className="w-full pl-8 pr-7 py-1 h-8 rounded-lg border border-slate-800 bg-slate-900/90 text-slate-100 text-[11.5px] placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Booking Source Segmented Control (All / Direct / Agent) - Sleek & Tight */}
              <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800 self-start md:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setSourceFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${sourceFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <span>All</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${sourceFilter === 'ALL' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {bookingMetrics.total}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter('DIRECT')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${sourceFilter === 'DIRECT'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Building2 size={11} />
                  <span>Direct</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${sourceFilter === 'DIRECT' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {bookingMetrics.directCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter('AGENT')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${sourceFilter === 'AGENT'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Handshake size={11} />
                  <span>Agent</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${sourceFilter === 'AGENT' ? 'bg-violet-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {bookingMetrics.agentCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceFilter('EMAIL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${sourceFilter === 'EMAIL'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Mail size={11} className={sourceFilter === 'EMAIL' ? 'text-white' : 'text-cyan-400'} />
                  <span>OTA / Email</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${sourceFilter === 'EMAIL' ? 'bg-cyan-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {bookingMetrics.emailCount}
                  </span>
                </button>
              </div>

              {/* Agent Filter Dropdown (visible if multiple agents exist and not in DIRECT mode) */}
              {availableAgents.length > 0 && sourceFilter !== 'DIRECT' && (
                <div className="flex items-center shrink-0">
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                    className="px-2 py-1 h-8 rounded-lg border border-violet-500/30 bg-slate-900/90 text-violet-200 text-[11px] font-semibold focus:outline-none focus:border-violet-400"
                  >
                    <option value="ALL">🤝 All Agents ({availableAgents.length})</option>
                    {availableAgents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.name} {ag.code ? `(${ag.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter */}
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="px-2.5 py-1 h-8 rounded-lg border border-slate-800 bg-slate-900/90 text-slate-200 text-[11px] font-semibold focus:outline-none focus:border-indigo-500 shrink-0"
              >
                <option value="ALL">All Status</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CHECKED_IN">Checked In</option>
                <option value="PENDING">Pending (Agent)</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Row 2: Date Presets & Quick Pickers + Counter & Reset in ONE streamlined row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-1.5 border-t border-slate-800/60">
              {/* Left: Date Presets & Pickers */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mr-0.5">
                  <Calendar size={11} className="text-indigo-400" />
                  <span>Date:</span>
                </span>
                {[
                  { id: 'ALL', label: 'All Dates' },
                  { id: 'TODAY', label: 'Today' },
                  { id: 'TOMORROW', label: 'Tomorrow' },
                  { id: 'THIS_WEEK', label: 'Next 7D' },
                  { id: 'THIS_MONTH', label: 'Month' },
                  { id: 'CUSTOM', label: 'Custom' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleDatePresetChange(preset.id as any)}
                    className={`px-2 py-0.5 rounded-md text-[10.5px] font-bold transition-all ${datePreset === preset.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                      }`}
                  >
                    {preset.label}
                  </button>
                ))}

                {/* Date Target Mode (Stay / Arrival / Departure) */}
                <select
                  value={dateFilterType}
                  onChange={(e) => setDateFilterType(e.target.value as any)}
                  className="px-2 py-0.5 h-6 rounded-md border border-slate-800 bg-slate-900 text-slate-300 text-[10.5px] font-semibold focus:outline-none focus:border-indigo-500 ml-1"
                  title="Filter target: Active stays (overlapping), Arrival date or Departure date"
                >
                  <option value="STAY">Active Stays</option>
                  <option value="ARRIVAL">Arrival Date</option>
                  <option value="DEPARTURE">Departure Date</option>
                </select>

                {/* Date range pickers */}
                <div className="flex items-center gap-1 text-[10.5px] ml-1">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDatePreset('CUSTOM');
                    }}
                    className="px-1.5 py-0.5 h-6 rounded-md border border-slate-800 bg-slate-900 text-slate-200 text-[10.5px] focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-slate-500 text-[10px]">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDatePreset('CUSTOM');
                    }}
                    className="px-1.5 py-0.5 h-6 rounded-md border border-slate-800 bg-slate-900 text-slate-200 text-[10.5px] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Reset Filters button */}
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold transition-all ml-1 cursor-pointer"
                    title="Clear all active filters"
                  >
                    <RotateCcw size={10} /> Reset ({activeFiltersCount})
                  </button>
                )}
              </div>

              {/* Right: Inline Count & Metrics */}
              <div className="flex items-center gap-2 text-[10.5px] text-slate-400 shrink-0 self-end lg:self-center">
                <span>
                  Showing <strong className="text-white font-bold">{filteredBookings.length}</strong> of{' '}
                  <span className="text-slate-500">{bookingMetrics.total}</span>
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">{filteredBookings.filter(b => b.status === 'CONFIRMED').length} Conf</span>
                <span className="text-slate-600">•</span>
                <span className="text-rose-400 font-semibold">{filteredBookings.filter(b => b.status === 'CHECKED_IN').length} In-House</span>
                {filteredBookings.filter(b => b.status === 'PENDING').length > 0 && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-amber-400 font-bold animate-pulse">{filteredBookings.filter(b => b.status === 'PENDING').length} Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-[#0f172a]/40 border border-slate-800/80 overflow-hidden shadow-xl backdrop-blur-sm w-full">
            <div className="w-full">
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-3 py-3 w-[11%]">Booking No</th>
                    <th className="px-3 py-3 w-[19%]">Guest Info</th>
                    <th className="px-3 py-3 w-[13%]">Stay Dates</th>
                    <th className="px-3 py-3 w-[17%]">Room Info</th>
                    <th className="px-3 py-3 w-[14%]">Identity KYC</th>
                    <th className="px-3 py-3 w-[11%]">Reservation Dues</th>
                    <th className="px-3 py-3 w-[15%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                        No reservations matches found for the selected date & agent filters.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const arrDate = new Date(b.arrivalDate);
                      const depDate = new Date(b.departureDate);
                      const arrDay = arrDate.getDate();
                      const arrMonth = arrDate.toLocaleDateString('en-IN', { month: 'short' });
                      const depDay = depDate.getDate();
                      const depMonth = depDate.toLocaleDateString('en-IN', { month: 'short' });
                      const depYear = depDate.getFullYear();
                      const stayDatesText = arrMonth === depMonth
                        ? `${arrDay} – ${depDay} ${depMonth} ${depYear}`
                        : `${arrDay} ${arrMonth} – ${depDay} ${depMonth} ${depYear}`;

                      const nights = Math.max(1, Math.round((depDate.getTime() - arrDate.getTime()) / (1000 * 60 * 60 * 24)));

                      // KYC status resolution
                      const hasDocUrl = b.guest?.documents && b.guest.documents.length > 0;
                      const hasIdDetails = b.guest?.idType && b.guest?.idNumber;

                      let kycBadge = (
                        <button
                          type="button"
                          onClick={() => setKycModalBooking(b)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 font-bold max-w-fit cursor-pointer transition-all hover:scale-105 active:scale-95 group text-[11px] shadow-sm shadow-rose-500/10"
                          title="Click to Upload KYC (File / WebCam / Mobile QR)"
                        >
                          <Upload size={12} className="group-hover:-translate-y-0.5 transition-transform text-rose-400" />
                          <span>Upload KYC</span>
                        </button>
                      );
                      if (hasDocUrl && hasIdDetails) {
                        kycBadge = (
                          <button
                            type="button"
                            onClick={() => setKycModalBooking(b)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold max-w-fit cursor-pointer transition-all hover:scale-105 active:scale-95 group text-[11px] shadow-sm shadow-emerald-500/10"
                            title="KYC Verified! Click to View or Re-upload"
                          >
                            <ShieldCheck size={12} className="group-hover:scale-110 transition-transform text-emerald-400" />
                            <span>Verified</span>
                          </button>
                        );
                      } else if (hasIdDetails || hasDocUrl) {
                        kycBadge = (
                          <button
                            type="button"
                            onClick={() => setKycModalBooking(b)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold max-w-fit cursor-pointer transition-all hover:scale-105 active:scale-95 group text-[11px] shadow-sm shadow-amber-500/10"
                            title="Click to Complete KYC Photo / Details"
                          >
                            <Upload size={12} className="group-hover:-translate-y-0.5 transition-transform text-amber-400" />
                            <span>Pending Upload</span>
                          </button>
                        );
                      }

                      let statusBadge = (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 max-w-fit">
                          {b.status}
                        </span>
                      );
                      if (b.status === 'CHECKED_IN') {
                        statusBadge = (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 max-w-fit">
                            CHECKED IN
                          </span>
                        );
                      } else if (b.status === 'CHECKED_OUT' || b.status === 'COMPLETED') {
                        statusBadge = (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 max-w-fit">
                            CHECKED OUT
                          </span>
                        );
                      } else if (b.status === 'PENDING') {
                        statusBadge = (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30 max-w-fit animate-pulse">
                            PENDING REVIEW
                          </span>
                        );
                      } else if (b.status === 'CANCELLED') {
                        statusBadge = (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 max-w-fit">
                            CANCELLED
                          </span>
                        );
                      }

                      return (
                        <tr key={b.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-3 py-2.5 font-bold text-indigo-400 tracking-wider align-top">
                            <div className="flex flex-col gap-1 items-start">
                              <button
                                type="button"
                                onClick={() => {
                                  if (b.isStandaloneAgentBooking) {
                                    setActiveTab('agent-bookings');
                                    setAgentBookingSearch(b.guestName || b.guest?.firstName || '');
                                  } else if (b.isEmailBooking) {
                                    setSelectedEmailBooking(b);
                                  } else {
                                    setSelectedDrawerBooking(b);
                                  }
                                }}
                                className={`font-mono text-xs font-extrabold hover:underline flex items-center gap-1 group cursor-pointer ${b.isEmailBooking ? 'text-cyan-400 hover:text-cyan-300' : 'text-indigo-400 hover:text-indigo-300'
                                  }`}
                                title="Click to view details"
                              >
                                <span>{b.bookingNo}</span>
                                <Eye size={11} className={`opacity-60 group-hover:opacity-100 transition-opacity ${b.isEmailBooking ? 'text-cyan-300' : 'text-indigo-300'}`} />
                              </button>
                              {statusBadge}
                              {b.isEmailBooking && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-cyan-300 bg-cyan-500/15 px-1.5 py-0.5 rounded border border-cyan-500/30 whitespace-nowrap mt-0.5" title={`Channel: ${b.source || 'OTA Booking'}`}>
                                  <Mail size={9} className="text-cyan-400 shrink-0" />
                                  <span className="truncate max-w-[100px]">{b.source || 'OTA Booking'}</span>
                                </span>
                              )}
                              {b.agent && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-violet-300 bg-violet-500/15 px-1.5 py-0.5 rounded border border-violet-500/30 whitespace-nowrap mt-0.5" title={`Travel Agent: ${b.agent.name} (${b.agent.agentCode || 'Agent'})`}>
                                  <Handshake size={9} className="text-violet-400 shrink-0" />
                                  <span className="truncate max-w-[100px]">{b.agent.name}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 align-top min-w-0 overflow-hidden">
                            <div className="flex flex-col gap-0.5 truncate">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (b.isStandaloneAgentBooking) {
                                      setActiveTab('agent-bookings');
                                      setAgentBookingSearch(b.guestName || b.guest?.firstName || '');
                                    } else if (b.isEmailBooking) {
                                      setSelectedEmailBooking(b);
                                    } else {
                                      setSelectedDrawerBooking(b);
                                    }
                                  }}
                                  className="text-left font-bold text-white hover:text-indigo-300 text-xs hover:underline cursor-pointer transition-colors truncate block"
                                  title="Click to view details"
                                >
                                  {b.guest?.firstName} {b.guest?.lastName || ''}
                                </button>
                                {b.isOwnerGuest && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded-md border border-amber-500/30 whitespace-nowrap">
                                    <Crown size={10} className="text-amber-400" />
                                    <span>OWNER VIP {b.ownerVipCode ? '• PIN: ••••' : ''}</span>
                                  </span>
                                )}
                              </div>
                              {b.isEmailBooking && (
                                <span className="text-[10px] text-cyan-300 font-semibold flex items-center gap-1">
                                  ✉️ Channel: <strong className="text-white">{b.source || 'Online OTA'}</strong>
                                </span>
                              )}
                              {b.agent && (
                                <span className="text-[10px] text-violet-300 font-semibold flex items-center gap-1">
                                  🤝 Booked via Agent: <strong className="text-white">{b.agent.name}</strong>
                                  {b.agent.agentCode && <span className="text-violet-400 font-mono text-[9px]">({b.agent.agentCode})</span>}
                                </span>
                              )}
                              {(b.gstNumber || b.guest?.gstNumber || b.companyName || b.guest?.companyName) && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20 truncate max-w-full font-mono" title={b.companyName || b.guest?.companyName}>
                                  🏢 {b.companyName || b.guest?.companyName || 'B2B'}{b.gstNumber || b.guest?.gstNumber ? ` (${b.gstNumber || b.guest?.gstNumber})` : ''}
                                </span>
                              )}
                              <div className="flex items-center gap-2 text-[10px] font-medium truncate mt-0.5">
                                <span className="flex items-center gap-1 truncate text-slate-300 font-mono">
                                  <Phone size={9} className="text-emerald-400 shrink-0" /> {b.guest?.mobile || 'No Mobile'}
                                </span>
                                {b.guest?.email ? (
                                  <span className="flex items-center gap-1 truncate text-indigo-300 font-mono" title={b.guest.email}>
                                    <Mail size={9} className="text-indigo-400 shrink-0" /> {b.guest.email}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 truncate text-slate-600 italic">
                                    <Mail size={9} className="shrink-0" /> No Email
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 align-top">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-100 text-xs">{stayDatesText}</span>
                              <span className="text-[10px] text-indigo-400 font-semibold">{nights} Night{nights !== 1 ? 's' : ''}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 align-top min-w-0 overflow-hidden">
                            {b.isEmailBooking ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-cyan-200 text-xs truncate max-w-[120px]">
                                    {b.roomType?.name || 'OTA Room'}
                                  </span>
                                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20 whitespace-nowrap font-semibold">
                                    Unassigned
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-400 italic">
                                  OTA online reservation
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-100 text-xs truncate max-w-[120px]" title={b.roomType?.name || 'Standard Room'}>
                                    {b.roomType?.name || 'Standard Room'}
                                  </span>
                                  {b.rooms?.[0]?.room ? (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 whitespace-nowrap">
                                      Rm {b.rooms[0].room.roomNumber}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 italic whitespace-nowrap">Unassigned</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-wrap text-[9px] font-bold">
                                  <span className={`px-1.5 py-0.5 rounded whitespace-nowrap border ${(b.mealPlan || 'EP').toUpperCase() === 'CP'
                                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                      : (b.mealPlan || 'EP').toUpperCase() === 'MAP'
                                        ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                                        : (b.mealPlan || 'EP').toUpperCase() === 'AP'
                                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                          : 'bg-slate-800 border-slate-700 text-slate-300'
                                    }`}>
                                    🍽️ {(b.mealPlan || 'EP').toUpperCase() === 'CP'
                                      ? 'CP (Breakfast)'
                                      : (b.mealPlan || 'EP').toUpperCase() === 'MAP'
                                        ? 'MAP (Bfast+Dinner)'
                                        : (b.mealPlan || 'EP').toUpperCase() === 'AP'
                                          ? 'AP (All Meals)'
                                          : 'EP (Room Only)'}
                                  </span>
                                  {b.extraAdultCharge > 0 && (
                                    <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap font-bold" title={`Extra Person Charge: ₹${b.extraAdultCharge}`}>
                                      👥 +{b.extraAdults || 1} Extra
                                    </span>
                                  )}
                                  {b.extraBed && (
                                    <span className="bg-teal-500/10 text-teal-300 border border-teal-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap font-bold">
                                      🛏️ Bed
                                    </span>
                                  )}
                                  {b.poolAccess && (
                                    <span
                                      title={b.poolPackage || 'Pool Pass'}
                                      className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap"
                                    >
                                      <Waves size={9} /> Pool
                                    </span>
                                  )}
                                  {b.spaPackage && b.spaPackage !== 'NONE' && (
                                    <span
                                      title={b.spaPackage}
                                      className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 whitespace-nowrap"
                                    >
                                      <Flower2 size={9} /> Spa
                                    </span>
                                  )}
                                  <span className={`px-1.5 py-0.5 rounded whitespace-nowrap ${b.wifiStatus === 'EXPIRED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    📶 {b.wifiStatus === 'EXPIRED' ? 'OFF' : 'ON'}
                                  </span>
                                  {!b.isStandaloneAgentBooking && (
                                    <button
                                      type="button"
                                      onClick={() => startEditingStay(b)}
                                      className="text-indigo-400 hover:text-indigo-300 font-extrabold hover:underline cursor-pointer ml-0.5 text-[9px]"
                                    >
                                      ⚙️ Edit
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 align-top">
                            {b.isStandaloneAgentBooking ? (
                              <span className="text-[10px] text-slate-500 italic block py-1">
                                Pre-Checkin (Agent)
                              </span>
                            ) : b.isEmailBooking ? (
                              <span className="text-[10px] text-cyan-400 font-bold block py-1">
                                ✉️ OTA Pre-Booking
                              </span>
                            ) : (
                              <div className="flex flex-col gap-1 items-start">
                                {kycBadge}
                                {hasIdDetails && (
                                  <span className="text-[9px] font-mono text-slate-400 truncate max-w-full block" title={`${b.guest?.idType}: ${b.guest?.idNumber}`}>
                                    {b.guest?.idType}: {b.guest?.idNumber && String(b.guest.idNumber).length >= 8 ? `XXXX-XXXX-${String(b.guest.idNumber).slice(-4)}` : b.guest?.idNumber}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 font-bold align-top">
                            {b.isStandaloneAgentBooking ? (
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-200">
                                  ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')} Total
                                </span>
                                <span className="text-[9px] text-amber-400 font-semibold">
                                  Pay at Hotel / Agent
                                </span>
                                {b.commission > 0 && (
                                  <span className="text-[9px] text-violet-400 font-semibold flex items-center gap-0.5 mt-0.5">
                                    <BadgePercent size={9} /> ₹{Number(b.commission).toLocaleString('en-IN')} Comm
                                  </span>
                                )}
                              </div>
                            ) : b.isEmailBooking ? (
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-200">
                                  ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')} Total
                                </span>
                                <span className="text-[9px] text-cyan-400 font-semibold flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 size={9} /> Pre-Paid ({b.source || 'OTA'})
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                {b.isOwnerGuest && b.waiveBill ? (
                                  <>
                                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                                      <Sparkles size={11} /> ₹0 Due (Waived)
                                    </span>
                                    <span className="text-[9px] text-amber-400 font-semibold">
                                      Tariff: ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')} (Hosted)
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className={`text-xs font-black ${Number(b.dueAmount) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                      ₹{Number(b.dueAmount || 0).toLocaleString('en-IN')} Dues
                                    </span>
                                    <span className="text-[9px] text-slate-500 font-normal">
                                      Paid: ₹{Number(b.advanceAmount || 0).toLocaleString('en-IN')} / ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                                    </span>
                                    {b.agent && (b.commission > 0 || b.agentBooking?.commission > 0) && (
                                      <span className="text-[9px] text-violet-400 font-semibold flex items-center gap-0.5 mt-0.5">
                                        <BadgePercent size={9} /> ₹{Number(b.commission || b.agentBooking?.commission || 0).toLocaleString('en-IN')} Comm
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right align-top">
                            <div className="flex items-center gap-1 justify-end flex-wrap">
                              {b.isStandaloneAgentBooking ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('agent-bookings');
                                    setAgentBookingSearch(b.guestName || b.guest?.firstName || '');
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[10px] uppercase tracking-wider transition-all shadow-md shadow-violet-600/20 cursor-pointer whitespace-nowrap active:scale-95 ml-auto"
                                  title="Open in Agent Bookings tab to review and allot rooms"
                                >
                                  <Handshake size={12} /> Review & Allot
                                </button>
                              ) : b.isEmailBooking ? (
                                <div className="flex items-center gap-1 justify-end flex-wrap">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedEmailBooking(b)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/35 text-cyan-300 hover:text-white font-extrabold text-[10px] uppercase tracking-wider transition-all border border-cyan-500/40 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                                    title="View OTA Email Confirmation Details"
                                  >
                                    <Eye size={11} className="text-cyan-400" /> View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEmailImportModal(b)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-[10px] uppercase tracking-wider transition-all shadow-md shadow-cyan-600/20 cursor-pointer whitespace-nowrap active:scale-95"
                                    title="Allot Room & Import directly to PMS"
                                  >
                                    <DoorOpen size={11} /> Allot &amp; Import
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedDrawerBooking(b)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 hover:text-white font-extrabold text-[10px] uppercase tracking-wider transition-all border border-indigo-500/40 cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                                    title="View Full Reservation Details"
                                  >
                                    <Eye size={11} className="text-indigo-400" /> View
                                  </button>
                                  {b.status === 'CONFIRMED' && (
                                    <button
                                      type="button"
                                      onClick={() => startCheckIn(b)}
                                      className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 cursor-pointer whitespace-nowrap"
                                    >
                                      Check-In
                                    </button>
                                  )}
                                  {b.status === 'CHECKED_IN' && (
                                    <Link
                                      href={
                                        b.checkIns?.[0]?.id
                                          ? `/hotel/checkout/${b.checkIns[0].id}${b.folios?.[0]?.id ? `?folioId=${b.folios[0].id}` : ''}`
                                          : `/hotel/checkout?bookingId=${b.id}`
                                      }
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-rose-600/25 cursor-pointer whitespace-nowrap active:scale-95 border border-rose-400/30"
                                      title="Check-Out Guest & Settle Bill"
                                    >
                                      <DoorOpen size={11} className="text-white" /> Check-Out
                                    </Link>
                                  )}
                                  {(b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') && (
                                    <button
                                      type="button"
                                      onClick={() => startExtendStay(b)}
                                      className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                                      title="Extend Stay"
                                    >
                                      <CalendarPlus size={10} /> Extend
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Booking Wizard Modal - Unified Front Desk Real Reservation */}
      <QuickReservationModal
        isOpen={isCreateWizardOpen}
        roomsList={formattedRoomsList}
        onClose={() => setIsCreateWizardOpen(false)}
        onCreated={() => {
          toast.success('Reservation created successfully!');
          loadData();
          loadAgentBookings();
        }}
        initialArrivalDate={paramArrival || undefined}
        initialDepartureDate={paramDeparture || undefined}
        initialRoomId={paramRoomId || undefined}
        initialGuestData={initialGuestFromParams}
      />

      {/* Owner / VIP Guest Fast Check-In Modal */}
      {isOwnerVipModalOpen && (
        <OwnerVipBookingModal
          isOpen={isOwnerVipModalOpen}
          roomsList={formattedRoomsList}
          onClose={() => setIsOwnerVipModalOpen(false)}
          onCreated={() => {
            setIsOwnerVipModalOpen(false);
            loadData();
            loadAgentBookings();
          }}
        />
      )}

      {/* Check-In & KYC Modal */}
      {activeCheckInReservation && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 px-4 pb-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setActiveCheckInReservation(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 font-bold p-2 text-2xl leading-none"
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
                        {activeCheckInReservation.guest.firstName} {activeCheckInReservation.guest.lastName}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Booking Ref: {activeCheckInReservation.bookingNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Reserved Category</p>
                      <p className="font-bold text-indigo-400 mt-0.5 text-sm">{activeCheckInReservation.roomType.name}</p>
                    </div>
                  </div>

                  {/* Stay Configuration */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Assign Room Number *</label>
                      <select
                        required
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="">Select Clean Room</option>
                        {rooms
                          .filter((r) => r.roomTypeId === activeCheckInReservation.roomTypeId)
                          .map((r) => {
                            const isAvailable = r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN';
                            const isAssigned = r.id === activeCheckInReservation.assignedRoomId;
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
                        value={expectedCheckout}
                        onChange={(e) => setExpectedCheckout(e.target.value)}
                        onClick={(e) => {
                          try {
                            (e.currentTarget as any).showPicker?.();
                          } catch { }
                        }}
                        onFocus={(e) => {
                          try {
                            (e.currentTarget as any).showPicker?.();
                          } catch { }
                        }}
                        style={{ colorScheme: 'dark' }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCheckInReservation(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingCheckIn}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
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
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
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
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none"
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
                        {uploading ? (
                          <div className="space-y-1">
                            <Loader2 className="animate-spin text-indigo-400 mx-auto" size={18} />
                            <p className="text-[9px] text-slate-400 font-semibold animate-pulse">Scanning document...</p>
                          </div>
                        ) : documentUrl ? (
                          <div className="space-y-1">
                            <Check className="text-emerald-400 mx-auto animate-bounce" size={18} />
                            <p className="text-[9px] text-emerald-400 font-bold">Scanned Successfully!</p>
                            <p className="text-[8px] text-slate-500 font-mono truncate max-w-[150px]">{documentUrl}</p>
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

      {/* Manage Stay Settings Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh]">
            {/* Modal Close Button */}
            <button
              type="button"
              onClick={() => setEditingBooking(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 font-bold p-2 text-2xl leading-none"
            >
              &times;
            </button>

            {/* Header */}
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
                ⚙️ Stay Configuration
              </span>
              <h2 className="text-xl font-black text-white leading-none">
                Manage WiFi & Meal Plan
              </h2>
              <p className="text-[10px] text-slate-500">
                Guest: {editingBooking.guest.firstName} {editingBooking.guest.lastName} (Room {editingBooking.rooms?.[0]?.room?.roomNumber || 'TBA'})
              </p>
            </div>

            <form onSubmit={handleSaveStaySettings} className="space-y-5">
              {/* Meal Plan */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  🍽️ Stay Meal Plan (EP, CP, MAP, AP)
                </label>
                <select
                  value={editMealPlan === 'RO' ? 'EP' : editMealPlan}
                  onChange={(e) => handleEditMealPlanChange(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
                >
                  <option value="EP">EP — European Plan (Room Only, Meals on consumption)</option>
                  <option value="CP">CP — Continental Plan (Daily Buffet Breakfast Included)</option>
                  <option value="MAP">MAP — Modified American Plan (Breakfast + Dinner Included)</option>
                  <option value="AP">AP — American Plan (All 3 Meals Included: Bfast, Lunch, Dinner)</option>
                </select>
              </div>

              {/* Swimming Pool Access */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                      <Waves size={13} /> Swimming Pool Access
                    </span>
                    {editPoolAccess && Number(editPoolPassCost || 0) === 0 && (
                      <span className="text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                        Free / Plan
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditPoolAccess(!editPoolAccess)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${editPoolAccess ? 'bg-cyan-500 text-cyan-950 font-black' : 'bg-slate-800 text-slate-400'
                      }`}
                  >
                    {editPoolAccess ? 'Pool Enabled' : 'No Pool'}
                  </button>
                </div>

                {editPoolAccess && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Pass Category</label>
                      <select
                        value={editPoolPackage}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditPoolPackage(val);
                          const passList = dynamicPoolPasses.length > 0 ? dynamicPoolPasses : DEFAULT_POOL_PASS_OPTIONS;
                          const matched = passList.find((p: any) => p.name === val || p.id === val || p.category === val);
                          if (matched) setEditPoolPassCost(matched.price.toString());
                          else if (val.toLowerCase().includes('complimentary') || val.toLowerCase().includes('free') || val === 'INCLUDED') setEditPoolPassCost('0');
                          else if (val === 'STANDARD') setEditPoolPassCost('500');
                          else if (val === 'VIP_CABANA') setEditPoolPassCost('1200');
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-[11px] text-white focus:outline-none"
                      >
                        {(dynamicPoolPasses.length > 0 ? dynamicPoolPasses : DEFAULT_POOL_PASS_OPTIONS).map((p: any) => (
                          <option key={p.id || p.name} value={p.name}>
                            {p.name} (₹{p.price}{p.price === 0 ? ' - Free' : ''})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Pool Fee (₹)</label>
                      <input
                        type="number"
                        value={editPoolPassCost}
                        onChange={(e) => setEditPoolPassCost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-[11px] text-cyan-300 font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Spa & Wellness Package */}
              <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                    <Flower2 size={13} /> Spa & Wellness Package
                  </span>
                  {editSpaPackage !== 'NONE' && Number(editSpaPackageCost || 0) === 0 && (
                    <span className="text-[8px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                      Free / Plan
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Package Choice</label>
                    <select
                      value={editSpaPackage}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditSpaPackage(val);
                        const matched = DEFAULT_SPA_PACKAGES.find((s) => s.id === val || s.name === val);
                        if (matched) setEditSpaPackageCost(matched.price.toString());
                        else if (val === 'NONE' || val.includes('COMPLIMENTARY') || val.toLowerCase().includes('free')) setEditSpaPackageCost('0');
                        else if (val === 'RELAXATION_60MIN') setEditSpaPackageCost('1800');
                        else if (val === 'DETOX_SAUNA') setEditSpaPackageCost('2800');
                        else if (val === 'COUPLE_SPA') setEditSpaPackageCost('4500');
                        else if (val === 'AYURVEDIC') setEditSpaPackageCost('3200');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-[11px] text-white focus:outline-none"
                    >
                      {DEFAULT_SPA_PACKAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Spa Fee (₹)</label>
                    <input
                      type="number"
                      value={editSpaPackageCost}
                      onChange={(e) => setEditSpaPackageCost(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-[11px] text-purple-300 font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Wi-Fi Password */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  📶 Stay Wi-Fi Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editWifiPassword}
                    onChange={(e) => setEditWifiPassword(e.target.value)}
                    placeholder="e.g. 102-XJ3A"
                    className="flex-1 bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-semibold font-mono"
                  />
                  <button
                    type="button"
                    onClick={regenerateWifiPassword}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300 hover:text-white transition-all flex items-center justify-center shrink-0"
                    title="Regenerate Password"
                  >
                    <RefreshCw size={14} className={savingSettings ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              {/* Wi-Fi Status */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
                  ⚡ Wi-Fi Access Status
                </label>
                <select
                  value={editWifiStatus}
                  onChange={(e) => setEditWifiStatus(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
                >
                  <option value="ACTIVE">ACTIVE (Access Allowed)</option>
                  <option value="EXPIRED">SUSPENDED / EXPIRED (Deactivated)</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-800/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1.5"
                >
                  {savingSettings ? <Loader2 className="animate-spin" size={13} /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Extend Stay Modal ─────────────────────────────────────────────── */}
      {extendingBooking && (() => {
        const curDep = extendingBooking.departureDate?.split('T')[0] || '';
        const curArr = extendingBooking.arrivalDate?.split('T')[0] || '';
        const curNights = curDep && curArr
          ? Math.max(1, Math.round((new Date(curDep).getTime() - new Date(curArr).getTime()) / 86400000))
          : 0;
        const extraNights = newDepartureDate && curDep && newDepartureDate > curDep
          ? Math.round((new Date(newDepartureDate).getTime() - new Date(curDep).getTime()) / 86400000)
          : 0;
        const ratePerNight = extendingBooking.rooms?.[0]?.ratePerNight
          || (extendingBooking.totalAmount / Math.max(1, curNights));
        const extraCharge = Math.round(ratePerNight * extraNights);
        const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
            <div className="relative bg-[#0f172a] border border-slate-700/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <CalendarPlus size={16} className="text-amber-400" />
                  <span className="font-black text-white text-sm">Extend Stay</span>
                </div>
                <button
                  onClick={() => setExtendingBooking(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Guest + booking info */}
                <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/30 flex items-center justify-between">
                  <div>
                    <p className="text-white font-black text-sm">
                      {extendingBooking.guest?.firstName} {extendingBooking.guest?.lastName}
                    </p>
                    <p className="text-slate-500 text-[10px] font-bold mt-0.5">#{extendingBooking.bookingNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 text-xs font-bold">{extendingBooking.rooms?.[0]?.room ? `Room ${extendingBooking.rooms[0].room.roomNumber}` : 'Unassigned'}</p>
                    <p className="text-slate-500 text-[10px] mt-0.5">{curNights} night{curNights !== 1 ? 's' : ''} booked</p>
                  </div>
                </div>

                {/* Current checkout → New checkout */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 text-center">
                    <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">Current Checkout</p>
                    <p className="text-sm font-black text-white">{curDep ? fmtDate(curDep) : '—'}</p>
                  </div>
                  <ArrowRight size={16} className="text-amber-400 shrink-0" />
                  <div className="flex-1 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                    <p className="text-[9px] text-amber-500 font-bold uppercase mb-1">New Checkout</p>
                    <p className="text-sm font-black text-amber-300">{newDepartureDate ? fmtDate(newDepartureDate) : '—'}</p>
                  </div>
                </div>

                {/* New departure date picker */}
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">
                    Select New Departure Date *
                  </label>
                  <input
                    type="date"
                    value={newDepartureDate}
                    min={curDep || undefined}
                    onChange={(e) => setNewDepartureDate(e.target.value)}
                    onClick={(e) => {
                      try {
                        (e.currentTarget as any).showPicker?.();
                      } catch { }
                    }}
                    onFocus={(e) => {
                      try {
                        (e.currentTarget as any).showPicker?.();
                      } catch { }
                    }}
                    style={{ colorScheme: 'dark' }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white text-sm font-bold focus:outline-none focus:border-amber-500/50 transition-all cursor-pointer"
                  />
                </div>

                {/* Extra nights + charge summary */}
                {extraNights > 0 && (
                  <div className="p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Extra Nights</span>
                      <span className="text-amber-300 font-black">+{extraNights} night{extraNights !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Rate / Night</span>
                      <span className="text-slate-300 font-bold">₹{Math.round(ratePerNight).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-amber-500/20 pt-2 mt-1">
                      <span className="text-white font-black">Additional Charge</span>
                      <span className="text-amber-400 font-black text-base">₹{extraCharge.toLocaleString()}</span>
                    </div>
                    {extendingBooking.status === 'CHECKED_IN' && (
                      <p className="text-[9px] text-amber-500/70 font-semibold mt-1">
                        ⚡ Guest is checked in — charge will also be posted to the folio
                      </p>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setExtendingBooking(null)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-400 font-bold text-xs hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExtendStay}
                    disabled={extendSubmitting || extraNights <= 0}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs transition-all shadow-lg shadow-amber-900/30"
                  >
                    {extendSubmitting
                      ? <Loader2 size={13} className="animate-spin" />
                      : <CalendarPlus size={13} />
                    }
                    {extendSubmitting ? 'Extending…' : `Extend by ${extraNights} Night${extraNights !== 1 ? 's' : ''}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Reservation Details Drawer (Click to view booking) */}
      <ReservationDetailDrawer
        booking={selectedDrawerBooking}
        roomsList={formattedRoomsList}
        onClose={() => setSelectedDrawerBooking(null)}
        onCheckIn={(b) => {
          setSelectedDrawerBooking(null);
          startCheckIn(b);
        }}
        onCheckOut={(b) => {
          setSelectedDrawerBooking(null);
          const ciId = b.checkIns?.[0]?.id;
          const folId = b.folios?.[0]?.id;
          if (ciId) {
            router.push(`/hotel/checkout/${ciId}${folId ? `?folioId=${folId}` : ''}`);
          } else {
            router.push(`/hotel/checkout?bookingId=${b.id}`);
          }
        }}
        onUpdated={() => {
          loadData();
        }}
        onOpenKyc={(b) => {
          setKycModalBooking(b);
        }}
      />

      {/* Dedicated KYC Upload & Staff Mobile Scanner Modal */}
      <KycUploadModal
        isOpen={Boolean(kycModalBooking)}
        booking={kycModalBooking}
        onClose={() => setKycModalBooking(null)}
        onKycUpdated={() => {
          loadData();
        }}
      />

      {/* ── Selected Email / OTA Booking Detail Modal ── */}
      {selectedEmailBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedEmailBooking(null)}
        >
          <div
            className="bg-[#0f172a] border border-cyan-500/40 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      OTA / Email Reservation
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {selectedEmailBooking.source || 'OTA'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Ref: <strong className="text-slate-200">{selectedEmailBooking.bookingNo}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmailBooking(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[65vh]">
              {/* Guest & Stay Metrics */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Guest Name</span>
                  <span className="text-sm font-bold text-white">{selectedEmailBooking.guestName || 'OTA Guest'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Total Tariff</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">
                    ₹{Number(selectedEmailBooking.totalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Phone / Mobile</span>
                  <span className="text-xs font-semibold text-slate-200 font-mono">
                    {selectedEmailBooking.guest?.mobile || selectedEmailBooking.emailBooking?.guestPhone || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Guest Email</span>
                  <span className="text-xs font-semibold text-slate-200 font-mono truncate block" title={selectedEmailBooking.guest?.email}>
                    {selectedEmailBooking.guest?.email || selectedEmailBooking.emailBooking?.guestEmail || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Check-In Date</span>
                  <span className="text-xs font-bold text-indigo-300">
                    {selectedEmailBooking.arrivalDate ? new Date(selectedEmailBooking.arrivalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Check-Out Date</span>
                  <span className="text-xs font-bold text-indigo-300">
                    {selectedEmailBooking.departureDate ? new Date(selectedEmailBooking.departureDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Room Category (From Email)</span>
                  <span className="text-xs font-bold text-cyan-300">
                    {selectedEmailBooking.roomType?.name || 'Standard Room'}
                    {selectedEmailBooking.mealPlan ? ` • ${selectedEmailBooking.mealPlan}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Guests</span>
                  <span className="text-xs font-bold text-slate-200">
                    {selectedEmailBooking.adults || 2} Adults{selectedEmailBooking.children ? `, ${selectedEmailBooking.children} Children` : ''}
                  </span>
                </div>
              </div>

              {/* Email Subject & Sender */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Incoming Sender:</span>
                  <span className="font-mono text-cyan-300 font-bold">{selectedEmailBooking.emailBooking?.sender || 'OTA Channel'}</span>
                </div>
                <div className="text-[11px] pt-1 border-t border-slate-800">
                  <span className="text-slate-400 block mb-0.5">Subject:</span>
                  <span className="font-semibold text-white">{selectedEmailBooking.emailBooking?.subject || 'Booking Confirmation'}</span>
                </div>
              </div>

              {/* Raw Parsed Email Body */}
              {selectedEmailBooking.emailBooking?.body && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Parsed Booking Notification Email
                  </span>
                  <div className="p-3 rounded-xl bg-black/40 border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                    {selectedEmailBooking.emailBooking.body}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEmailBooking(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={importingEmail}
                  onClick={() => handleRejectEmailBooking(selectedEmailBooking.id)}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs transition-colors cursor-pointer"
                >
                  Reject
                </button>
              </div>
              <button
                type="button"
                onClick={() => openEmailImportModal(selectedEmailBooking)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
              >
                <DoorOpen size={14} />
                <span>Allot Room &amp; Import in PMS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inline Email / OTA Import & Room Allotment Modal ── */}
      {importEmailModalBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => !importingEmail && setImportEmailModalBooking(null)}
        >
          <div
            className="bg-[#0f172a] border border-cyan-500/40 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      Import &amp; Allot Room ({emailImportForm.source})
                    </h3>
                    {emailImportForm.isPrepaid && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Pre-Paid
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Auto-filled from email • Verify room category &amp; allot available room
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={importingEmail}
                onClick={() => setImportEmailModalBooking(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleConfirmEmailImport} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                {/* Auto-detected Email Banner */}
                {emailImportForm.detectedRoomCategory && (
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-cyan-200 font-semibold">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        Email Room Category: <strong className="text-white">{emailImportForm.detectedRoomCategory}</strong>
                        {emailImportForm.roomsCount > 1 ? ` (${emailImportForm.roomsCount} Rooms)` : ''}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-bold text-[11px]">
                      Meal: {emailImportForm.mealPlan} • {emailImportForm.adults} Adults
                    </span>
                  </div>
                )}

                {/* Guest Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Guest Name *</label>
                    <input
                      type="text"
                      required
                      value={emailImportForm.guestName}
                      onChange={(e) => setEmailImportForm({ ...emailImportForm, guestName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-semibold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Phone / Mobile</label>
                    <input
                      type="text"
                      value={emailImportForm.guestPhone}
                      onChange={(e) => setEmailImportForm({ ...emailImportForm, guestPhone: e.target.value })}
                      placeholder="+91..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Guest Email</label>
                    <input
                      type="email"
                      value={emailImportForm.guestEmail}
                      onChange={(e) => setEmailImportForm({ ...emailImportForm, guestEmail: e.target.value })}
                      placeholder="guest@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Dates & Occupancy */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Check-In *</label>
                    <input
                      type="date"
                      required
                      value={emailImportForm.checkIn}
                      onChange={(e) => setEmailImportForm({ ...emailImportForm, checkIn: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Check-Out *</label>
                    <input
                      type="date"
                      required
                      value={emailImportForm.checkOut}
                      onChange={(e) => setEmailImportForm({ ...emailImportForm, checkOut: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Adults</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={emailImportForm.adults}
                      onChange={(e) => setEmailImportForm({ ...emailImportForm, adults: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Children</label>
                    <input
                      type="number"
                      min={0}
                      value={emailImportForm.children}
                      onChange={(e) => setEmailImportForm({ ...emailImportForm, children: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Room Category & Auto-Matched Available Room */}
                {(() => {
                  const categoryRooms = getAvailableRoomsForCategory(
                    emailImportForm.roomTypeId,
                    rooms,
                    bookings,
                    emailImportForm.checkIn,
                    emailImportForm.checkOut
                  );
                  const readyCount = categoryRooms.filter((r: any) => r.isReady).length;
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Room Category (PMS Match) *
                        </label>
                        <select
                          required
                          value={emailImportForm.roomTypeId}
                          onChange={(e) => {
                            const newTypeId = e.target.value;
                            const nextRooms = getAvailableRoomsForCategory(
                              newTypeId,
                              rooms,
                              bookings,
                              emailImportForm.checkIn,
                              emailImportForm.checkOut
                            );
                            const nextAuto = nextRooms.find((r: any) => r.isReady) || nextRooms[0];
                            setEmailImportForm({
                              ...emailImportForm,
                              roomTypeId: newTypeId,
                              assignedRoomId: nextAuto?.id || '',
                            });
                          }}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                        >
                          {roomTypes.map((rt: any) => (
                            <option key={rt.id} value={rt.id}>
                              {rt.name} (₹{Number(rt.baseRate || 0).toLocaleString('en-IN')}/night)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400">
                            Allot Room Number
                          </label>
                          <span className={`text-[10px] font-bold ${readyCount > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {readyCount} Available
                          </span>
                        </div>
                        <select
                          value={emailImportForm.assignedRoomId}
                          onChange={(e) => setEmailImportForm({ ...emailImportForm, assignedRoomId: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">-- Assign Later (Unassigned) --</option>
                          {categoryRooms.map((r: any) => (
                            <option key={r.id} value={r.id}>
                              Room {r.roomNumber} {r.isReady ? '✓ Available' : r.isDateBusy ? '(Booked on Dates)' : `(${r.status})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })()}

                {/* Meal Plan, Total & Advance */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Meal Plan</label>
                    <select
                      value={emailImportForm.mealPlan}
                      onChange={(e) => setEmailImportForm({ ...emailImportForm, mealPlan: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                    >
                      <option value="RO">RO — Room Only</option>
                      <option value="CP">CP — Breakfast Included</option>
                      <option value="MAP">MAP — Breakfast + Dinner</option>
                      <option value="AP">AP — All Meals</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Tariff (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={emailImportForm.amount}
                      onChange={(e) => setEmailImportForm({ ...emailImportForm, amount: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-emerald-400 font-bold font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Advance / Pre-Paid (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={emailImportForm.advanceAmount}
                      onChange={(e) => setEmailImportForm({ ...emailImportForm, advanceAmount: e.target.value })}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-cyan-300 font-bold font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Special Requests / Notes</label>
                  <input
                    type="text"
                    value={emailImportForm.addOnNotes}
                    onChange={(e) => setEmailImportForm({ ...emailImportForm, addOnNotes: e.target.value })}
                    placeholder="Any guest requests from email..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={importingEmail}
                    onClick={() => setImportEmailModalBooking(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={importingEmail}
                    onClick={() => handleRejectEmailBooking(emailImportForm.id)}
                    className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={importingEmail}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {importingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Confirm Import &amp; Allot Room</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    }>
      <BookingsContent />
      <Toaster position="top-right" richColors />
    </Suspense>
  );
}
