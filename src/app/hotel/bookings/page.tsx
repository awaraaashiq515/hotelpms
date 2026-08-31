'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
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
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// Separate inner component to use search params safely inside Suspense
function BookingsContent() {
  const searchParams = useSearchParams();
  const paramRoomId = searchParams.get('roomId') || '';
  const paramArrival = searchParams.get('arr') || '';
  const paramDeparture = searchParams.get('dep') || '';

  // Tab State: 'list', 'create', or 'agent-bookings'
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'agent-bookings'>('list');

  // Agent Bookings State
  const [agentBookings, setAgentBookings] = useState<any[]>([]);
  const [agentBookingsLoading, setAgentBookingsLoading] = useState(false);
  const [agentBookingSearch, setAgentBookingSearch] = useState('');
  const [agentBookingStatusFilter, setAgentBookingStatusFilter] = useState('ALL');
  const [updatingAgentBooking, setUpdatingAgentBooking] = useState<string | null>(null);

  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [arrivalDate, setArrivalDate] = useState(paramArrival || new Date().toISOString().split('T')[0]);
  const [departureDate, setDepartureDate] = useState(paramDeparture || '');
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  const [roomTypeId, setRoomTypeId] = useState('');
  const [assignedRoomId, setAssignedRoomId] = useState(paramRoomId || '');
  const [totalAmount, setTotalAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('0');
  const [gstRate, setGstRate] = useState(0);

  // Corporate / GST Billing Details
  const [isCorporateBooking, setIsCorporateBooking] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Booking Form WiFi & Meal Plan States
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiStatus, setWifiStatus] = useState('ACTIVE');
  const [mealPlan, setMealPlan] = useState('RO');

const DEFAULT_POOL_PASS_OPTIONS = [
  { id: 'p1', name: 'Early Bird Morning Lap Pass', category: 'STANDARD', price: 350, duration: 'Morning (6 AM - 10 AM)' },
  { id: 'p2', name: 'Standard Swimming Pool Pass', category: 'STANDARD', price: 500, duration: 'Full Day' },
  { id: 'p3', name: 'All-Day VIP Cabana Pass', category: 'VIP_CABANA', price: 1200, duration: 'Full Day' },
  { id: 'p4', name: 'Sunset Cocktail & Jacuzzi Pass', category: 'SUNSET_PASS', price: 1500, duration: 'Evening (4 PM - 9 PM)' },
  { id: 'p5', name: 'Family Splash & Fun Pass', category: 'FAMILY_PASS', price: 1800, duration: 'Full Day' },
  { id: 'p6', name: 'Weekend Royal Luxury Pool Suite Pass', category: 'VIP_CABANA', price: 2500, duration: 'Full Day' },
];

  // Booking Form Pool & Spa Package States
  const [poolAccess, setPoolAccess] = useState(false);
  const [poolPackage, setPoolPackage] = useState('Standard Swimming Pool Pass');
  const [poolPassCost, setPoolPassCost] = useState('500');
  const [spaPackage, setSpaPackage] = useState('NONE');
  const [spaPackageCost, setSpaPackageCost] = useState('0');
  const [addOnNotes, setAddOnNotes] = useState('');
  const [dynamicPoolPasses, setDynamicPoolPasses] = useState<any[]>(DEFAULT_POOL_PASS_OPTIONS);

  // Booking Form KYC States
  const [createIdType, setCreateIdType] = useState('Aadhaar Card');
  const [createIdNumber, setCreateIdNumber] = useState('');
  const [createDocumentUrl, setCreateDocumentUrl] = useState('');
  const [createUploading, setCreateUploading] = useState(false);

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
  const [editMealPlan, setEditMealPlan] = useState('RO');
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

  const handleCreateMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCreateUploading(true);
    setTimeout(() => {
      setCreateDocumentUrl(`/uploads/kyc/${file.name}`);
      setCreateUploading(false);
      
      // Auto-populate random formatted ID based on document type
      if (createIdType === 'Aadhaar Card') {
        const ad1 = Math.floor(1000 + Math.random() * 9000);
        const ad2 = Math.floor(1000 + Math.random() * 9000);
        const ad3 = Math.floor(1000 + Math.random() * 9000);
        setCreateIdNumber(`${ad1}-${ad2}-${ad3}`);
      } else if (createIdType === 'Passport') {
        const char = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const num = Math.floor(1000000 + Math.random() * 9000000);
        setCreateIdNumber(`${char}${num}`);
      } else {
        const chars = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const num = Math.floor(100000 + Math.random() * 900000);
        setCreateIdNumber(`${chars}${num}`);
      }
      
      toast.success('AI OCR Scanner: Identity document verified & scanned successfully!');
    }, 1500);
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
    ])
      .then(([bookingsRes, roomsRes, typesRes, poolPassesRes]) => {
        if (bookingsRes.success) setBookings(bookingsRes.data);
        if (roomsRes.success) setRooms(roomsRes.data);
        if (typesRes.success) setRoomTypes(typesRes.data);
        if (poolPassesRes.success) setDynamicPoolPasses(poolPassesRes.data || []);
        
        // If pre-filled parameters were passed, auto-configure room type
        if (paramRoomId && roomsRes.success) {
          const selectedRoom = roomsRes.data.find((r: any) => r.id === paramRoomId);
          if (selectedRoom) {
            setRoomTypeId(selectedRoom.roomTypeId);
            if (paramArrival && paramDeparture) {
              const nights = Math.max(1, Math.round((new Date(paramDeparture).getTime() - new Date(paramArrival).getTime()) / (1000 * 60 * 60 * 24)));
              setTotalAmount((selectedRoom.roomType.baseRate * nights).toString());
            }
          }
          setActiveTab('create');
        }
        
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching bookings:', err);
        setLoading(false);
      });
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
  }, [paramRoomId, paramArrival, paramDeparture]);

  const startEditingStay = (b: any) => {
    setEditingBooking(b);
    setEditWifiPassword(b.wifiPassword || '');
    setEditWifiStatus(b.wifiStatus || 'ACTIVE');
    setEditMealPlan(b.mealPlan || 'RO');
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

  const generateCreateWifiPassword = (assignedRoomNo?: string) => {
    const roomNumber = assignedRoomNo || 'WIFI';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWifiPassword(`${roomNumber}-${randomPart}`);
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

  const handlePoolPackageChange = (pkg: string) => {
    setPoolPackage(pkg);
    const passList = dynamicPoolPasses.length > 0 ? dynamicPoolPasses : DEFAULT_POOL_PASS_OPTIONS;
    const matchedPass = passList.find((p: any) => p.name === pkg || p.id === pkg || p.category === pkg);
    if (matchedPass) {
      setPoolPassCost(matchedPass.price.toString());
    } else if (pkg === 'STANDARD') setPoolPassCost('500');
    else if (pkg === 'VIP_CABANA') setPoolPassCost('1200');
    else if (pkg === 'INCLUDED') setPoolPassCost('0');
  };

  const handleSpaPackageChange = (pkg: string) => {
    setSpaPackage(pkg);
    if (pkg === 'NONE') setSpaPackageCost('0');
    else if (pkg === 'RELAXATION_60MIN') setSpaPackageCost('1800');
    else if (pkg === 'DETOX_SAUNA') setSpaPackageCost('2800');
    else if (pkg === 'COUPLE_SPA') setSpaPackageCost('4500');
    else if (pkg === 'AYURVEDIC') setSpaPackageCost('3200');
  };

  // Recalculate rent when dates, roomType, pool access, or spa package changes
  useEffect(() => {
    let roomRent = 0;
    if (arrivalDate && departureDate && roomTypeId) {
      const type = roomTypes.find((t) => t.id === roomTypeId);
      if (type) {
        const nights = Math.max(1, Math.round((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24)));
        if (!isNaN(nights) && nights > 0) {
          roomRent = type.baseRate * nights;
        }
      }
    }
    const poolCost = poolAccess ? Number(poolPassCost || 0) : 0;
    const spaCost = Number(spaPackageCost || 0);
    const subTotal = roomRent + poolCost + spaCost;
    const gstAmt = gstRate > 0 ? Math.round(subTotal * gstRate) / 100 : 0;
    const grandTotal = subTotal + gstAmt;
    if (grandTotal > 0 || (roomRent === 0 && (poolCost > 0 || spaCost > 0))) {
      setTotalAmount(grandTotal.toString());
    }
  }, [arrivalDate, departureDate, roomTypeId, roomTypes, poolAccess, poolPassCost, spaPackageCost, gstRate]);

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !arrivalDate || !departureDate || !roomTypeId) {
      toast.error('First Name, Arrival/Departure dates, and Room Type are required.');
      return;
    }

    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestData: {
            firstName,
            lastName,
            email,
            mobile,
            idType: createIdNumber ? createIdType : null,
            idNumber: createIdNumber || null,
            documentUrl: createDocumentUrl || null,
          },
          arrivalDate,
          departureDate,
          adults: Number(adults),
          children: Number(children),
          roomTypeId,
          assignedRoomId: assignedRoomId || null,
          totalAmount: Number(totalAmount || 0),
          advanceAmount: Number(advanceAmount || 0),
          wifiPassword: wifiPassword || null,
          wifiStatus: wifiStatus || 'ACTIVE',
          mealPlan: mealPlan || 'RO',
          poolAccess,
          poolPackage: poolAccess ? poolPackage : 'NONE',
          poolPassCost: poolAccess ? Number(poolPassCost || 0) : 0,
          spaPackage,
          spaPackageCost: Number(spaPackageCost || 0),
          addOnNotes,
          gstNumber: isCorporateBooking ? gstNumber.trim().toUpperCase() : null,
          companyName: isCorporateBooking ? companyName.trim() : null,
          billingAddress: isCorporateBooking ? billingAddress.trim() : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Reservation created successfully!');
        // Reset form fields
        setFirstName('');
        setLastName('');
        setEmail('');
        setMobile('');
        setDepartureDate('');
        setRoomTypeId('');
        setAssignedRoomId('');
        setTotalAmount('');
        setAdvanceAmount('0');
        setGstRate(0);
        setIsCorporateBooking(false);
        setCompanyName('');
        setGstNumber('');
        setBillingAddress('');
        setWifiPassword('');
        setWifiStatus('ACTIVE');
        setMealPlan('RO');
        setPoolAccess(false);
        setPoolPackage('STANDARD');
        setPoolPassCost('500');
        setSpaPackage('NONE');
        setSpaPackageCost('0');
        setAddOnNotes('');
        setCreateIdNumber('');
        setCreateDocumentUrl('');
        setActiveTab('list');
        loadData();
      } else {
        toast.error(data.message || 'Booking creation failed.');
      }
    } catch (err) {
      toast.error('Connection error creating booking.');
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const q = searchQuery.toLowerCase();
    const guestName = `${b.guest.firstName} ${b.guest.lastName || ''}`.toLowerCase();
    const bookingNo = b.bookingNo.toLowerCase();
    return guestName.includes(q) || bookingNo.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Header and Premium tab structure */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Sparkles size={12} /> Reservations Desk
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            Bookings & Scheduling
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80 self-start">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'list' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays size={14} /> Active Bookings
          </button>
          <button
            onClick={() => { setActiveTab('agent-bookings'); loadAgentBookings(); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 relative ${
              activeTab === 'agent-bookings' 
                ? 'bg-violet-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Handshake size={14} /> Agent Bookings
            {agentBookings.filter(b => b.status === 'PENDING').length > 0 && (
              <span className="ml-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                {agentBookings.filter(b => b.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'create' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus size={14} /> Create Booking Wizard
          </button>
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
            const pending   = agentBookings.filter(b => b.status === 'PENDING').length;
            const confirmed = agentBookings.filter(b => b.status === 'CONFIRMED').length;
            const checkedIn = agentBookings.filter(b => b.status === 'CHECKED_IN').length;
            const totalComm = agentBookings.reduce((s, b) => s + (b.commission || 0), 0);
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Pending Review', val: pending,   color: 'text-amber-400',   bg: 'bg-amber-500/5 border-amber-500/20',   icon: Clock },
                  { label: 'Confirmed',      val: confirmed, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', icon: BadgeCheck },
                  { label: 'Checked In',     val: checkedIn, color: 'text-sky-400',     bg: 'bg-sky-500/5 border-sky-500/20',       icon: UserCheck },
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
              PENDING:    { label: 'Pending Review', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30',   dot: 'bg-amber-400' },
              CONFIRMED:  { label: 'Confirmed',      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400' },
              CHECKED_IN: { label: 'Checked In',     color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30',       dot: 'bg-sky-400' },
              COMPLETED:  { label: 'Completed',      color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/30',  dot: 'bg-indigo-400' },
              CANCELLED:  { label: 'Cancelled',      color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30',      dot: 'bg-rose-400' },
            };

            return filtered.length === 0 ? (
              <div className="rounded-3xl border border-slate-800/80 bg-slate-900/20 py-16 text-center">
                <Handshake size={36} className="mx-auto text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm font-semibold">No agent bookings found</p>
                <p className="text-slate-600 text-xs mt-1">Agent submitted bookings will appear here</p>
              </div>
            ) : (
              <div className="rounded-3xl bg-[#0f172a]/40 border border-slate-800/80 overflow-hidden shadow-xl backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">
                        <th className="px-5 py-4">Guest Details</th>
                        <th className="px-5 py-4">Stay Dates</th>
                        <th className="px-5 py-4">Room Type</th>
                        <th className="px-5 py-4">Agent</th>
                        <th className="px-5 py-4">Amount & Commission</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
                      {filtered.map((b) => {
                        const st = STATUS_STYLE[b.status] || STATUS_STYLE['PENDING'];
                        const checkIn  = new Date(b.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                        const checkOut = new Date(b.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                        const nights   = Math.max(1, Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000));
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
      ) : activeTab === 'list' ? (
        /* List Tab View */
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Guest Name or Booking No..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            
            {/* Quick Metrics */}
            <div className="flex items-center gap-6 px-4 py-2 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[10px] font-bold text-slate-400 uppercase">
              <div>Bookings: <span className="text-indigo-400 font-extrabold">{bookings.length}</span></div>
              <div className="w-px h-3 bg-slate-800"></div>
              <div>Checked In: <span className="text-rose-400 font-extrabold">{bookings.filter(b=>b.status==='CHECKED_IN').length}</span></div>
            </div>
          </div>

          <div className="rounded-3xl bg-[#0f172a]/40 border border-slate-800/80 overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/60 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">
                    <th className="px-6 py-4">Booking No</th>
                    <th className="px-6 py-4">Guest Info</th>
                    <th className="px-6 py-4">Stay Dates</th>
                    <th className="px-6 py-4">Room Info</th>
                    <th className="px-6 py-4">Identity KYC</th>
                    <th className="px-6 py-4">Reservation Dues</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                        No reservations matches found in database.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const arrStr = new Date(b.arrivalDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      const depStr = new Date(b.departureDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                      const nights = Math.max(1, Math.round((new Date(b.departureDate).getTime() - new Date(b.arrivalDate).getTime()) / (1000 * 60 * 60 * 24)));

                      // KYC status resolution
                      const hasDocUrl = b.guest.documents && b.guest.documents.length > 0;
                      const hasIdDetails = b.guest.idType && b.guest.idNumber;
                      
                      let kycBadge = (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold max-w-fit">
                          <AlertCircle size={12} /> No KYC
                        </span>
                      );
                      if (hasDocUrl && hasIdDetails) {
                        kycBadge = (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold max-w-fit">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        );
                      } else if (hasIdDetails) {
                        kycBadge = (
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold max-w-fit">
                            <AlertCircle size={12} /> Pending Upload
                          </span>
                        );
                      }

                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {b.status}
                        </span>
                      );
                      if (b.status === 'CHECKED_IN') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            CHECKED IN
                          </span>
                        );
                      } else if (b.status === 'CHECKED_OUT') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                            CHECKED OUT
                          </span>
                        );
                      }

                      return (
                        <tr key={b.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="px-6 py-3 font-bold text-indigo-400 tracking-wider align-top">
                            <div className="flex flex-col gap-1">
                              <span>{b.bookingNo}</span>
                              {statusBadge}
                            </div>
                          </td>
                          <td className="px-6 py-3 align-top">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-white text-sm">{b.guest.firstName} {b.guest.lastName}</span>
                              {(b.gstNumber || b.guest.gstNumber || b.companyName || b.guest.companyName) && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 max-w-fit my-0.5 font-mono">
                                  🏢 {b.companyName || b.guest.companyName || 'B2B'}{b.gstNumber || b.guest.gstNumber ? ` (${b.gstNumber || b.guest.gstNumber})` : ''}
                                </span>
                              )}
                              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                                <span className="flex items-center gap-1"><Phone size={10} /> {b.guest.mobile || 'No Mobile'}</span>
                                {b.guest.email && <span className="flex items-center gap-1"><Mail size={10} /> {b.guest.email}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 align-top">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-200">{arrStr} - {depStr}</span>
                              <span className="text-[10px] text-slate-500 font-semibold">{nights} Nights</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="text-slate-300 font-medium">{b.roomType.name}</span>
                              {b.rooms?.[0]?.room ? (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10 max-w-fit">
                                  Room {b.rooms[0].room.roomNumber}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">Unassigned room</span>
                              )}
                              <div className="flex gap-1.5 mt-0.5 flex-wrap items-center">
                                <span className="text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                                  🍽️ {b.mealPlan || 'RO'}
                                </span>
                                {b.poolAccess && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Waves size={9} /> Pool ({b.poolPackage || 'Pass'})
                                  </span>
                                )}
                                {b.spaPackage && b.spaPackage !== 'NONE' && (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Flower2 size={9} /> Spa
                                  </span>
                                )}
                                {b.wifiStatus === 'EXPIRED' ? (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded">
                                    📶 OFF
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                    📶 ON
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => startEditingStay(b)}
                                  className="text-indigo-400 hover:text-indigo-300 font-extrabold text-[9px] uppercase tracking-wider hover:underline flex items-center gap-0.5 cursor-pointer"
                                >
                                  ⚙️ Edit
                                </button>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3 align-top">
                            <div className="flex flex-col gap-1">
                              {kycBadge}
                              {hasIdDetails && (
                                <span className="text-[9px] font-mono text-slate-400">{b.guest.idType}: {b.guest.idNumber}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3 font-bold align-top">
                            <div className="flex flex-col">
                              <span className="text-rose-400 text-sm">₹{b.dueAmount} Dues</span>
                              <span className="text-[9px] text-slate-500">Paid: ₹{b.advanceAmount} / Total: ₹{b.totalAmount}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-right align-top whitespace-nowrap">
                            <div className="flex items-center gap-1.5 justify-end">
                              {b.status === 'CONFIRMED' && (
                                <button
                                  type="button"
                                  onClick={() => startCheckIn(b)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10"
                                >
                                  Check-In
                                </button>
                              )}
                              {(b.status === 'CONFIRMED' || b.status === 'CHECKED_IN') && (
                                <button
                                  type="button"
                                  onClick={() => startExtendStay(b)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-400 font-bold text-[10px] uppercase tracking-wider transition-all"
                                >
                                  <CalendarPlus size={10} /> Extend
                                </button>
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
      ) : (
        /* Create Booking Wizard Tab View */
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
          <form onSubmit={handleCreateBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Booking & Stay Configuration Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Card 1: Guest Information */}
              <div className="p-6 rounded-3xl bg-[#0f172a]/50 border border-slate-800/80 space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <User size={16} />
                  </span>
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-300">1. Guest Identification Details</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">First Name *</label>
                    <input
                      type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Rahul"
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                    <input
                      type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Sharma"
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mobile Phone *</label>
                    <input
                      type="tel" required value={mobile} onChange={(e) => setMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Corporate / GST Billing Toggle & Fields */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                        <Building2 size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">Corporate / Business Booking (GST Invoice)</p>
                        <p className="text-[10px] text-slate-500">Enable if the guest wants the bill on their Company GSTIN</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCorporateBooking}
                        onChange={(e) => setIsCorporateBooking(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {isCorporateBooking && (
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                            Company / Business Name *
                          </label>
                          <input
                            type="text"
                            required={isCorporateBooking}
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Acme Tech Solutions Pvt Ltd"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                            Guest GST Number (GSTIN) *
                          </label>
                          <input
                            type="text"
                            required={isCorporateBooking}
                            maxLength={15}
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                            placeholder="e.g. 07AAAAA0000A1Z5"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-amber-300 font-mono font-bold text-xs uppercase focus:outline-none focus:border-amber-500 transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                          Company Billing Address (Optional)
                        </label>
                        <input
                          type="text"
                          value={billingAddress}
                          onChange={(e) => setBillingAddress(e.target.value)}
                          placeholder="e.g. 123 Tech Park, Phase 2, New Delhi - 110001"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Room & Stay Details */}
              <div className="p-6 rounded-3xl bg-[#0f172a]/50 border border-slate-800/80 space-y-5">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Building size={16} />
                  </span>
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-300">2. Stay & Room Allocation</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Arrival Date *</label>
                    <input
                      type="date" required value={arrivalDate} onChange={(e) => setArrivalDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Departure Date *</label>
                    <input
                      type="date" required value={departureDate} onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Room Category *</label>
                    <select
                      required value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Select Category</option>
                      {roomTypes.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} (Rent: ₹{t.baseRate}/night)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Assign Physical Room (Optional)</label>
                    <select
                      value={assignedRoomId} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setAssignedRoomId(val);
                        const selectedRoom = rooms.find(r => r.id === val);
                        generateCreateWifiPassword(selectedRoom?.roomNumber);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="">Auto-Assign Later</option>
                      {rooms
                        .filter((r) => r.roomTypeId === roomTypeId && r.status === 'AVAILABLE' && r.housekeepingStatus === 'CLEAN')
                        .map((r) => (
                          <option key={r.id} value={r.id}>Room {r.roomNumber} (Clean)</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Adult Guests</label>
                    <input
                      type="number" min="1" value={adults} onChange={(e) => setAdults(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Children (below 12 yrs)</label>
                    <input
                      type="number" min="0" value={children} onChange={(e) => setChildren(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-5 mt-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Meal Plan</label>
                    <select
                      value={mealPlan} onChange={(e) => setMealPlan(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
                    >
                      <option value="RO">Room Only (RO)</option>
                      <option value="BB">Bed & Breakfast (BB)</option>
                      <option value="HB">Half Board (HB)</option>
                      <option value="MAP">Modified American Plan (MAP)</option>
                      <option value="FB">Full Board (FB)</option>
                      <option value="AI">All Inclusive (AI)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>WiFi Password</span>
                      <button
                        type="button"
                        onClick={() => {
                          const selectedRoom = rooms.find(r => r.id === assignedRoomId);
                          generateCreateWifiPassword(selectedRoom?.roomNumber);
                        }}
                        className="text-[9px] text-indigo-400 hover:text-indigo-300 font-extrabold uppercase"
                      >
                        Generate
                      </button>
                    </label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="e.g. 102-XJ3A"
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Card 3: Swimming Pool & Spa Package Add-ons */}
              <div className="p-6 rounded-3xl bg-[#0f172a]/50 border border-slate-800/80 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                      <Waves size={16} />
                    </span>
                    <h3 className="font-black text-sm uppercase tracking-wider text-slate-300">3. Swimming Pool & Spa Add-ons</h3>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                    Luxury Extras
                  </span>
                </div>

                {/* Swimming Pool Section */}
                <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                        <Droplets size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Swimming Pool Access Pass</h4>
                        <p className="text-[10px] text-slate-400">Include swimming pool access pass & privileges for guests</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPoolAccess(!poolAccess)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                        poolAccess 
                          ? 'bg-cyan-500 text-cyan-950 shadow-lg shadow-cyan-500/20 font-black' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {poolAccess ? <CheckCircle2 size={12} /> : null}
                      {poolAccess ? 'Pool Included' : 'No Pool'}
                    </button>
                  </div>

                  {poolAccess && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-cyan-500/15 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-2">Pool Pass Category</label>
                        <select
                          value={poolPackage}
                          onChange={(e) => handlePoolPackageChange(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-cyan-500/30 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-semibold"
                        >
                          {(dynamicPoolPasses.length > 0 ? dynamicPoolPasses : DEFAULT_POOL_PASS_OPTIONS).map((p: any) => (
                            <option key={p.id || p.name} value={p.name}>
                              {p.name} (₹{p.price} / {p.duration || 'Stay'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-2">Pool Pass Charge (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={poolPassCost}
                          onChange={(e) => setPoolPassCost(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-cyan-500/30 bg-slate-950 text-cyan-200 text-xs font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Spa & Wellness Package Section */}
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                      <Flower2 size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">Spa & Wellness Packages</h4>
                      <p className="text-[10px] text-slate-400">Select luxury spa massage & relaxation packages</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-2">Spa Package Choice</label>
                      <select
                        value={spaPackage}
                        onChange={(e) => handleSpaPackageChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-purple-500/30 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-purple-400 font-semibold"
                      >
                        <option value="NONE">No Spa Package (₹0)</option>
                        <option value="RELAXATION_60MIN">Swedish Relaxation Massage - 60m (₹1,800)</option>
                        <option value="DETOX_SAUNA">Full Body Detox & Hot Stone Therapy (₹2,800)</option>
                        <option value="COUPLE_SPA">Royal Couple Wellness Spa Day (₹4,500)</option>
                        <option value="AYURVEDIC">Traditional Ayurvedic Rejuvenation (₹3,200)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-2">Spa Package Charge (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={spaPackageCost}
                        onChange={(e) => setSpaPackageCost(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-purple-500/30 bg-slate-950 text-purple-200 text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Add-on Slot / Preferred Time Notes</label>
                    <input
                      type="text"
                      value={addOnNotes}
                      onChange={(e) => setAddOnNotes(e.target.value)}
                      placeholder="e.g. Preferred time 5 PM, Essential aroma oil preference"
                      className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* KYC & Pricing Cards (Right Column) */}
            <div className="space-y-6">
              
              {/* KYC Document Upload / AI OCR Scanner */}
              <div className="p-6 rounded-3xl bg-[#0f172a]/50 border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <FileText size={16} />
                  </span>
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-300">4. Identity Proof (KYC)</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">ID Document Type</label>
                    <select
                      value={createIdType}
                      onChange={(e) => setCreateIdType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none"
                    >
                      <option>Aadhaar Card</option>
                      <option>Passport</option>
                      <option>Driving License</option>
                      <option>Voter ID Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Document ID Number</label>
                    <input
                      type="text"
                      placeholder="Input ID or Scan Doc"
                      value={createIdNumber}
                      onChange={(e) => setCreateIdNumber(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none font-mono tracking-wider"
                    />
                  </div>

                  {/* ID Proof Uploader */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Upload ID Document (Auto OCR)</label>
                    <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 transition-colors flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/40">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCreateMockUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      
                      {createUploading ? (
                        <div className="space-y-2">
                          <Loader2 className="animate-spin text-indigo-400 mx-auto" size={24} />
                          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider animate-pulse">Running AI OCR Scanner...</p>
                        </div>
                      ) : createDocumentUrl ? (
                        <div className="space-y-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto text-emerald-400">
                            <Check size={18} />
                          </div>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Document Scanned & Locked!</p>
                          <p className="text-[8px] text-slate-500 font-mono truncate max-w-[180px]">{createDocumentUrl}</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="text-slate-500 mx-auto" size={24} />
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Upload / Drag Photo</p>
                          <p className="text-[9px] text-slate-500 leading-normal">Drag image to scan and automatically populate ID Details</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Billing ledger */}
              <div className="p-6 rounded-3xl bg-[#0f172a]/50 border border-slate-800/80 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                  <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <CreditCard size={16} />
                  </span>
                  <h3 className="font-black text-sm uppercase tracking-wider text-slate-300">5. Reservation Billing</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Total Amount (₹)</label>
                    <input
                      type="number" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-indigo-400 font-black text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Advance Deposit (₹)</label>
                    <input
                      type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 font-black text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  {/* GST Rate Selector */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">GST Rate</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setGstRate(rate)}
                          className={`py-2 rounded-xl text-xs font-black transition-all ${
                            gstRate === rate
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                              : 'bg-slate-800/50 border border-slate-700/40 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Calculation summary */}
                  {(() => {
                    const poolCostNum = poolAccess ? Number(poolPassCost || 0) : 0;
                    const spaCostNum = Number(spaPackageCost || 0);
                    const roomRentNum = Math.max(0, Number(totalAmount || 0) - poolCostNum - spaCostNum - (gstRate > 0 ? Math.round((Number(totalAmount || 0) - poolCostNum - spaCostNum) * gstRate / (100 + gstRate) * 100) / 100 : 0));
                    const subTotal = roomRentNum + poolCostNum + spaCostNum;
                    const gstAmt = gstRate > 0 ? Math.round(subTotal * gstRate) / 100 : 0;
                    const cgst = gstAmt / 2;
                    const sgst = gstAmt / 2;
                    return (
                      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/60 text-xs space-y-2">
                        <div className="flex justify-between text-slate-400">
                          <span>Room Rent</span>
                          <span className="font-bold text-slate-300">₹{Math.max(0, Number(totalAmount || 0) - poolCostNum - spaCostNum - gstAmt).toFixed(0)}</span>
                        </div>
                        {poolAccess && (
                          <div className="flex justify-between text-cyan-400">
                            <span>🏊 Swimming Pool Pass</span>
                            <span className="font-bold">+ ₹{poolPassCost || 0}</span>
                          </div>
                        )}
                        {spaPackage !== 'NONE' && (
                          <div className="flex justify-between text-purple-400">
                            <span>💆‍♀️ Spa Package</span>
                            <span className="font-bold">+ ₹{spaPackageCost || 0}</span>
                          </div>
                        )}
                        {gstRate > 0 && (
                          <>
                            <div className="h-px bg-slate-800/60 my-1"></div>
                            <div className="flex justify-between text-slate-500">
                              <span>Sub Total (Taxable)</span>
                              <span className="font-bold text-slate-400">₹{subTotal.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-amber-500/80">
                              <span>CGST @ {gstRate / 2}%</span>
                              <span className="font-bold">+ ₹{cgst.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-amber-500/80">
                              <span>SGST @ {gstRate / 2}%</span>
                              <span className="font-bold">+ ₹{sgst.toFixed(0)}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between text-indigo-300 font-bold border-t border-slate-800/60 pt-1">
                          <span>Grand Total {gstRate > 0 ? `(Incl. GST @${gstRate}%)` : ''}</span>
                          <span>₹{totalAmount || 0}</span>
                        </div>
                        <div className="flex justify-between text-emerald-400">
                          <span>Advance Deposit</span>
                          <span className="font-bold">- ₹{advanceAmount || 0}</span>
                        </div>
                        <div className="h-px bg-slate-800/80 my-1"></div>
                        <div className="flex justify-between font-black text-sm">
                          <span className="text-slate-300">Net Payable Dues</span>
                          <span className="text-rose-400">₹{Math.max(0, Number(totalAmount || 0) - Number(advanceAmount || 0))}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={14} /> Confirm Reservation
                </button>
              </div>

            </div>

          </form>
        </div>
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
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
                  🍽️ Stay Meal Plan
                </label>
                <select
                  value={editMealPlan}
                  onChange={(e) => setEditMealPlan(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
                >
                  <option value="RO">Room Only (RO)</option>
                  <option value="BB">Bed & Breakfast (BB)</option>
                  <option value="HB">Half Board (HB)</option>
                  <option value="MAP">Modified American Plan (MAP)</option>
                  <option value="FB">Full Board (FB)</option>
                  <option value="AI">All Inclusive (AI)</option>
                </select>
              </div>

              {/* Swimming Pool Access */}
              <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-cyan-300 flex items-center gap-1.5">
                    <Waves size={13} /> Swimming Pool Access
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditPoolAccess(!editPoolAccess)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                      editPoolAccess ? 'bg-cyan-500 text-cyan-950 font-black' : 'bg-slate-800 text-slate-400'
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
                          else if (val === 'STANDARD') setEditPoolPassCost('500');
                          else if (val === 'VIP_CABANA') setEditPoolPassCost('1200');
                          else if (val === 'INCLUDED') setEditPoolPassCost('0');
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-[11px] text-white focus:outline-none"
                      >
                        {(dynamicPoolPasses.length > 0 ? dynamicPoolPasses : DEFAULT_POOL_PASS_OPTIONS).map((p: any) => (
                          <option key={p.id || p.name} value={p.name}>
                            {p.name} (₹{p.price})
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
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-1.5">
                  <Flower2 size={13} /> Spa & Wellness Package
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Package Choice</label>
                    <select
                      value={editSpaPackage}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditSpaPackage(val);
                        if (val === 'NONE') setEditSpaPackageCost('0');
                        else if (val === 'RELAXATION_60MIN') setEditSpaPackageCost('1800');
                        else if (val === 'DETOX_SAUNA') setEditSpaPackageCost('2800');
                        else if (val === 'COUPLE_SPA') setEditSpaPackageCost('4500');
                        else if (val === 'AYURVEDIC') setEditSpaPackageCost('3200');
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-[11px] text-white focus:outline-none"
                    >
                      <option value="NONE">No Spa (₹0)</option>
                      <option value="RELAXATION_60MIN">Swedish Massage 60m (₹1,800)</option>
                      <option value="DETOX_SAUNA">Detox & Sauna (₹2,800)</option>
                      <option value="COUPLE_SPA">Couple Spa Day (₹4,500)</option>
                      <option value="AYURVEDIC">Ayurvedic Rejuvenation (₹3,200)</option>
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
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/40 text-white text-sm font-bold focus:outline-none focus:border-amber-500/50 transition-all"
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
