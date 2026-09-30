'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  Plus,
  User,
  Phone,
  Mail,
  Loader2,
  Calendar,
  Building2,
  ShieldCheck,
  Utensils,
  Sparkles,
  Waves,
  CreditCard,
  FileText,
  Clock,
  CheckCircle2,
  Upload,
  Coffee,
  Wifi,
  Droplets,
  Car,
  Check,
  ChevronRight,
  Info,
  MapPin,
  Moon,
  Sun,
  BedDouble,
  HeartHandshake,
} from 'lucide-react';

export interface RoomOption {
  id: string;
  roomNumber: string;
  roomTypeName: string;
  roomTypeId: string;
  baseRate: number;
  status?: string;
}

interface QuickReservationModalProps {
  isOpen: boolean;
  roomsList: RoomOption[];
  onClose: () => void;
  onCreated: () => void;
  initialArrivalDate?: string;
  initialGuestData?: {
    firstName?: string;
    lastName?: string;
    mobile?: string;
    email?: string;
    notes?: string;
  } | null;
}

// ── Meal Plans ─────────────────────────────────────────────────────────────
const MEAL_PLANS = [
  {
    id: 'RO',
    code: 'EP',
    name: 'EP (European Plan - Room Only)',
    desc: 'Room stay only. Meals charged separately on consumption.',
    costPerPersonPerNight: 0,
    badge: 'Popular for Business',
  },
  {
    id: 'CP',
    code: 'CP',
    name: 'CP (Continental Plan - Breakfast)',
    desc: 'Includes daily complimentary buffet breakfast for all guests.',
    costPerPersonPerNight: 350,
    badge: 'Recommended',
  },
  {
    id: 'MAP',
    code: 'MAP',
    name: 'MAP (Modified American - Half Board)',
    desc: 'Includes daily breakfast + dinner (or lunch) buffet spread.',
    costPerPersonPerNight: 850,
    badge: 'Best Value for Families',
  },
  {
    id: 'AP',
    code: 'AP',
    name: 'AP (American Plan - Full Board)',
    desc: 'All 3 meals included: Daily Breakfast, Lunch & Dinner buffet.',
    costPerPersonPerNight: 1400,
    badge: 'All Inclusive Luxury',
  },
];

// ── Spa Packages ───────────────────────────────────────────────────────────
const SPA_PACKAGES = [
  { id: 'NONE', name: 'No Spa Package (₹0)', price: 0, desc: 'Guest can book spa later during stay' },
  { id: 'COMPLIMENTARY_WELCOME', name: '🎁 Complimentary Welcome Foot Reflexology (₹0 - Free)', price: 0, desc: '15-min relaxing foot massage voucher on arrival' },
  { id: 'SWEDISH_60MIN', name: 'Swedish Relaxation Massage - 60 Min (₹1,800)', price: 1800, desc: 'Full body relaxing aromatherapy with essential oils' },
  { id: 'DEEP_TISSUE', name: 'Deep Tissue & Herbal Steam Bath - 75 Min (₹2,500)', price: 2500, desc: 'Targeted muscle relief + aromatic steam bath' },
  { id: 'AYURVEDIC', name: 'Traditional Ayurvedic Rejuvenation - 90 Min (₹3,200)', price: 3200, desc: 'Abhyanga warm herbal oil therapy + Shirodhara' },
  { id: 'COUPLE_SPA', name: 'Royal Couple Wellness Spa Journey (₹4,500)', price: 4500, desc: 'Dual massage suite, jacuzzis, wine & chocolate therapy' },
];

// ── Pool Access Options ───────────────────────────────────────────────────
const POOL_OPTIONS = [
  { id: 'COMPLIMENTARY', name: 'Complimentary Swimming Pool Access (₹0)', price: 0, desc: 'Unlimited pool access during guest stay' },
  { id: 'VIP_CABANA', name: 'VIP Cabana, Jacuzzi & Sunset Pass (₹800)', price: 800, desc: 'Private pool cabana, jacuzzi access & mocktails' },
  { id: 'NONE', name: 'No Pool Access', price: 0, desc: 'Pool facility excluded' },
];

// ── ID Proof Types ────────────────────────────────────────────────────────
const ID_TYPES = [
  'Aadhaar Card',
  'Passport',
  'Driving License',
  'Voter ID Card',
  'PAN Card',
  'Government Employee ID',
  'Foreign Citizen ID',
];

export function QuickReservationModal({
  isOpen,
  roomsList,
  onClose,
  onCreated,
  initialArrivalDate,
  initialGuestData,
}: QuickReservationModalProps) {
  // Navigation tabs for quick jumping
  const [activeSection, setActiveSection] = useState<'guest' | 'gst' | 'stay' | 'meals' | 'billing'>('guest');

  // 1. Guest & ID Proof State
  const [guestFirstName, setGuestFirstName] = useState('');
  const [guestLastName, setGuestLastName] = useState('');
  const [guestMobile, setGuestMobile] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [guestNationality, setGuestNationality] = useState('Indian');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [documentFileName, setDocumentFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2. GST & Corporate Billing State
  const [isCorporateBooking, setIsCorporateBooking] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // 3. Stay & Room State
  const [selectedRoomId, setSelectedRoomId] = useState(roomsList[0]?.id || '');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [ratePerNight, setRatePerNight] = useState<number>(3500);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // 4. Meal Plan & Complimentary Perks State
  const [mealPlan, setMealPlan] = useState('RO');
  const [addMealToTotal, setAddMealToTotal] = useState(true);

  // Spa & Pool
  const [spaPackageId, setSpaPackageId] = useState('NONE');
  const [poolPackageId, setPoolPackageId] = useState('COMPLIMENTARY');

  // Standard Complimentary Perks (selected by default)
  const [complimentaryPerks, setComplimentaryPerks] = useState<{ [key: string]: boolean }>({
    wifi: true,
    welcomeDrink: true,
    waterBottles: true,
    teaCoffee: true,
    parking: true,
    dailyHousekeeping: true,
  });
  const [customComplimentaryNotes, setCustomComplimentaryNotes] = useState('');

  // 5. Payment & Notes State
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [advancePaymentMode, setAdvancePaymentMode] = useState('CASH');
  const [guestNotes, setGuestNotes] = useState('');
  const [customTotalOverride, setCustomTotalOverride] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // Initialize or reset dates, room selection and guest info when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialGuestData) {
        setGuestFirstName(initialGuestData.firstName || '');
        setGuestLastName(initialGuestData.lastName || '');
        setGuestMobile(initialGuestData.mobile || '');
        setGuestEmail(initialGuestData.email || '');
        if (initialGuestData.notes) setGuestNotes(initialGuestData.notes);
      }

      if (initialArrivalDate) {
        setArrivalDate(initialArrivalDate);
        const nextDay = new Date(initialArrivalDate);
        nextDay.setDate(nextDay.getDate() + 1);
        setDepartureDate(nextDay.toISOString().split('T')[0]);
      } else {
        const todayStr = new Date().toISOString().split('T')[0];
        const nextStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        setArrivalDate(todayStr);
        setDepartureDate(nextStr);
      }

      if (roomsList.length > 0) {
        const first = roomsList[0];
        setSelectedRoomId(first.id);
        setRatePerNight(first.baseRate || 3500);
      }
    }
  }, [isOpen, initialArrivalDate, roomsList, initialGuestData]);

  // Update room rate when room selection changes
  const handleRoomChange = (rId: string) => {
    setSelectedRoomId(rId);
    const room = roomsList.find((r) => r.id === rId);
    if (room && room.baseRate) {
      setRatePerNight(room.baseRate);
    }
  };

  // ── Stay Duration & Financial Calculations ─────────────────────────────────
  const { nights, arrivalFormatted, departureFormatted, daysCount } = useMemo(() => {
    const arr = new Date(arrivalDate);
    const dep = new Date(departureDate);
    const diffTime = dep.getTime() - arr.getTime();
    const calculatedNights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    const arrFmt = isNaN(arr.getTime())
      ? arrivalDate
      : arr.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    const depFmt = isNaN(dep.getTime())
      ? departureDate
      : dep.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

    return {
      nights: calculatedNights,
      arrivalFormatted: arrFmt,
      departureFormatted: depFmt,
      daysCount: calculatedNights + 1,
    };
  }, [arrivalDate, departureDate]);

  // Quick Nights Setter Helper
  const setQuickStayDuration = (numNights: number) => {
    if (!arrivalDate) return;
    const d = new Date(arrivalDate);
    d.setDate(d.getDate() + numNights);
    setDepartureDate(d.toISOString().split('T')[0]);
  };

  // Meal Plan Cost Calculation
  const selectedMealPlanObj = useMemo(() => {
    return MEAL_PLANS.find((m) => m.id === mealPlan) || MEAL_PLANS[0];
  }, [mealPlan]);

  const mealPlanTotalCost = useMemo(() => {
    if (!addMealToTotal) return 0;
    return (selectedMealPlanObj?.costPerPersonPerNight || 0) * adults * nights;
  }, [addMealToTotal, selectedMealPlanObj, adults, nights]);

  // Spa Package Cost Calculation
  const selectedSpaObj = useMemo(() => {
    return SPA_PACKAGES.find((s) => s.id === spaPackageId) || SPA_PACKAGES[0];
  }, [spaPackageId]);

  // Pool Package Cost Calculation
  const selectedPoolObj = useMemo(() => {
    return POOL_OPTIONS.find((p) => p.id === poolPackageId) || POOL_OPTIONS[0];
  }, [poolPackageId]);

  // Total Room Tariff
  const roomTariffSubtotal = useMemo(() => {
    return ratePerNight * nights;
  }, [ratePerNight, nights]);

  // Grand Total Calculation
  const computedGrandTotal = useMemo(() => {
    if (customTotalOverride !== null && customTotalOverride >= 0) {
      return customTotalOverride;
    }
    return (
      roomTariffSubtotal +
      mealPlanTotalCost +
      (selectedSpaObj?.price || 0) +
      (selectedPoolObj?.price || 0)
    );
  }, [roomTariffSubtotal, mealPlanTotalCost, selectedSpaObj, selectedPoolObj, customTotalOverride]);

  // Net Balance Due
  const balanceDue = useMemo(() => {
    return Math.max(0, computedGrandTotal - (advanceAmount || 0));
  }, [computedGrandTotal, advanceAmount]);

  // Handle Document Upload (convert to base64 DataURL for storage)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller image or document.');
      return;
    }

    setDocumentFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setDocumentUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Toggle complimentary perks
  const togglePerk = (key: string) => {
    setComplimentaryPerks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Quick Advance Setter
  const setQuickAdvance = (percentage: number) => {
    if (percentage === 0) {
      setAdvanceAmount(0);
    } else if (percentage === 50) {
      setAdvanceAmount(Math.round(computedGrandTotal * 0.5));
    } else if (percentage === 100) {
      setAdvanceAmount(computedGrandTotal);
    }
  };

  if (!isOpen) return null;

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestFirstName.trim()) {
      alert('Please enter guest first name.');
      setActiveSection('guest');
      return;
    }
    if (!guestMobile.trim()) {
      alert('Please enter guest mobile number.');
      setActiveSection('guest');
      return;
    }

    setSubmitting(true);
    try {
      const selectedRoom = roomsList.find((r) => r.id === selectedRoomId) || roomsList[0];

      // Build consolidated add-on & complimentary notes
      const perksList = Object.entries(complimentaryPerks)
        .filter(([, active]) => active)
        .map(([k]) => {
          switch (k) {
            case 'wifi':
              return 'Free High-Speed Wi-Fi';
            case 'welcomeDrink':
              return 'Welcome Drink on Arrival';
            case 'waterBottles':
              return '2 Packaged Drinking Water Bottles Daily';
            case 'teaCoffee':
              return 'In-room Tea/Coffee Maker Station';
            case 'parking':
              return 'Free Guest Parking';
            case 'dailyHousekeeping':
              return 'Daily Housekeeping';
            default:
              return k;
          }
        });

      const fullNotes = [
        guestNotes.trim() ? `Requests: ${guestNotes.trim()}` : '',
        perksList.length > 0 ? `Complimentary: ${perksList.join(', ')}` : '',
        customComplimentaryNotes.trim() ? `Special Perks: ${customComplimentaryNotes.trim()}` : '',
        advanceAmount > 0 ? `Advance Paid: ₹${advanceAmount} via ${advancePaymentMode}` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const payload = {
        guestFirstName: guestFirstName.trim(),
        guestLastName: guestLastName.trim(),
        guestMobile: guestMobile.trim(),
        guestEmail: guestEmail.trim(),
        guestAddress: guestAddress.trim(),
        guestNationality: guestNationality || 'Indian',
        idType: idType || 'Aadhaar Card',
        idNumber: idNumber.trim(),
        documentUrl: documentUrl || '',
        assignedRoomId: selectedRoom?.id || null,
        roomTypeId: selectedRoom?.roomTypeId,
        ratePerNight,
        arrivalDate,
        departureDate,
        adults: Number(adults || 1),
        children: Number(children || 0),
        mealPlan,
        spaPackage: selectedSpaObj?.id || 'NONE',
        spaPackageCost: selectedSpaObj?.price || 0,
        poolAccess: poolPackageId !== 'NONE',
        poolPackage: selectedPoolObj?.id || 'NONE',
        poolPassCost: selectedPoolObj?.price || 0,
        totalAmount: computedGrandTotal,
        advanceAmount: Number(advanceAmount || 0),
        dueAmount: balanceDue,
        addOnNotes: fullNotes,
        gstNumber: isCorporateBooking && gstNumber.trim() ? gstNumber.trim().toUpperCase() : null,
        companyName: isCorporateBooking && companyName.trim() ? companyName.trim() : null,
        billingAddress: isCorporateBooking && billingAddress.trim() ? billingAddress.trim() : null,
      };

      const res = await fetch('/api/hotel/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onCreated();
        onClose();
        // Reset state
        setGuestFirstName('');
        setGuestLastName('');
        setGuestMobile('');
        setGuestEmail('');
        setGuestAddress('');
        setIdNumber('');
        setDocumentUrl('');
        setDocumentFileName('');
        setCompanyName('');
        setGstNumber('');
        setBillingAddress('');
        setIsCorporateBooking(false);
        setGuestNotes('');
        setCustomComplimentaryNotes('');
        setAdvanceAmount(0);
        setCustomTotalOverride(null);
      } else {
        alert(data.message || 'Error creating reservation in database.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error communicating with hotel reservation system.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#0f172a] rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-800 text-white overflow-hidden relative">
        {/* ── Modal Header ── */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00b894] to-emerald-400 flex items-center justify-center shadow-lg shadow-[#00b894]/20">
              <BedDouble className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Front Desk Real Reservation
                </h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Front Desk
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete guest registration with ID proof KYC, corporate GST, meal plans, spa perks & stay duration.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors p-1.5 rounded-xl cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Section Quick Navigation Pills ── */}
        <div className="px-6 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveSection('guest')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'guest'
                ? 'bg-[#00b894] text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Guest & ID Proof</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('gst')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'gst'
                ? 'bg-[#00b894] text-white shadow-xs'
                : isCorporateBooking
                ? 'text-sky-300 bg-sky-500/10 border border-sky-500/30'
                : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>2. Corporate & GST {isCorporateBooking ? '(Active)' : ''}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('stay')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'stay'
                ? 'bg-[#00b894] text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>3. Room & Stay ({nights}N)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('meals')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'meals'
                ? 'bg-[#00b894] text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>4. Meal Plan & Spa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('billing')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSection === 'billing'
                ? 'bg-[#00b894] text-white shadow-xs'
                : 'text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>5. Billing & Advance</span>
          </button>
        </div>

        {/* ── Scrollable Form Body ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ══════════════════════════════════════════════════════════════════
              SECTION 1: GUEST DETAILS & ID PROOF (KYC)
             ══════════════════════════════════════════════════════════════════ */}
          <div
            id="section-guest"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00b894]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Guest Information & ID Proof (Government KYC)
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Mandatory for Hotel Police GRC</span>
            </div>

            {/* Name & Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  First Name <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={guestFirstName}
                    onChange={(e) => setGuestFirstName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={guestLastName}
                  onChange={(e) => setGuestLastName(e.target.value)}
                  placeholder="e.g. Sharma"
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Number <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={guestMobile}
                    onChange={(e) => setGuestMobile(e.target.value)}
                    placeholder="e.g. +91 9876543210"
                    className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="rahul@example.com"
                    className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* ID Proof KYC Fields */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ID Proof Document Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                >
                  {ID_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-slate-900 text-white">
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  ID Document Number
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 5432 1098 7654 (Aadhaar / Passport No)"
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Attach Photo / Scan (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-[38px] bg-[#1e293b]/70 hover:bg-[#1e293b] border border-dashed border-slate-600 hover:border-slate-500 rounded-xl px-3 text-xs text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#00b894]" />
                  <span className="truncate">
                    {documentFileName ? `✓ ${documentFileName}` : 'Upload ID Proof Scan'}
                  </span>
                </button>
              </div>
            </div>

            {/* Address & Nationality */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Residential Address / City
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={guestAddress}
                    onChange={(e) => setGuestAddress(e.target.value)}
                    placeholder="e.g. Flat 402, Cyber Tower, Sector 28, Gurugram, Haryana"
                    className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  value={guestNationality}
                  onChange={(e) => setGuestNationality(e.target.value)}
                  placeholder="Indian"
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 2: CORPORATE & GST BILLING DETAILS
             ══════════════════════════════════════════════════════════════════ */}
          <div
            id="section-gst"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Corporate Billing & GST Details
                </h3>
              </div>

              {/* Toggle switch for GST */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-medium text-slate-300">
                  Business / GST Invoice?
                </span>
                <input
                  type="checkbox"
                  checked={isCorporateBooking}
                  onChange={(e) => setIsCorporateBooking(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-5.5 rounded-full transition-colors relative ${
                    isCorporateBooking ? 'bg-[#00b894]' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 ${
                      isCorporateBooking ? 'translate-x-4.5' : 'translate-x-0'
                    }`}
                  ></div>
                </div>
              </label>
            </div>

            {isCorporateBooking ? (
              <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/20 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-sky-300 mb-1">
                      Company / Organization Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Tata Consultancy Services Ltd"
                      className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-sky-300 mb-1">
                      GSTIN (15-Character GST Number) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-500 font-mono uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-sky-300 mb-1">
                    Company Registered Billing Address
                  </label>
                  <input
                    type="text"
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    placeholder="e.g. Cyber City Tower B, 4th Floor, DLF Phase 2, Gurugram - 122002"
                    className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Enable the toggle above if the guest requires a B2B Tax Invoice with company GSTIN for GST tax input credits.
              </p>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 3: STAY PERIOD, DURATION & ROOM ALLOCATION
             ══════════════════════════════════════════════════════════════════ */}
          <div
            id="section-stay"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Stay Period & Duration Allocation
                </h3>
              </div>

              {/* Dynamic Stay Nights Badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#00b894]/15 text-[#00b894] border border-[#00b894]/30 shadow-xs flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5" />
                  <span>
                    {nights} Night{nights > 1 ? 's' : ''} Stay ({daysCount} Days)
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Duration Preset Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium mr-1">Quick Select Duration:</span>
              {[
                { label: '1 Night', n: 1 },
                { label: '2 Nights', n: 2 },
                { label: '3 Nights', n: 3 },
                { label: '5 Nights', n: 5 },
                { label: '7 Nights (1 Wk)', n: 7 },
                { label: '14 Nights (2 Wks)', n: 14 },
              ].map((pill) => (
                <button
                  key={pill.n}
                  type="button"
                  onClick={() => setQuickStayDuration(pill.n)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    nights === pill.n
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Dates & Occupancy Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Check-In Date</span>
                  <span className="text-[10px] text-emerald-400 font-normal">12:00 PM</span>
                </label>
                <input
                  type="date"
                  required
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Check-Out Date</span>
                  <span className="text-[10px] text-amber-400 font-normal">11:00 AM</span>
                </label>
                <input
                  type="date"
                  required
                  min={arrivalDate}
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Adults (12+ Yrs)
                </label>
                <select
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num} className="bg-slate-900 text-white">
                      {num} Adult{num > 1 ? 's' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Children (0-11 Yrs)
                </label>
                <select
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                >
                  {[0, 1, 2, 3, 4].map((num) => (
                    <option key={num} value={num} className="bg-slate-900 text-white">
                      {num === 0 ? 'No Children' : `${num} Child${num > 1 ? 'ren' : ''}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Selection & Rate per Night */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Select Room & Category
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => handleRoomChange(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                >
                  {roomsList.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      Room {r.roomNumber} ({r.roomTypeName}) - ₹{r.baseRate}/night {r.status ? `[${r.status}]` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Rate / Night (₹)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Editable</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={ratePerNight}
                  onChange={(e) => setRatePerNight(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                />
              </div>
            </div>

            {/* Stay Timeline Summary Banner */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-4 h-4 text-[#00b894]" />
                <span>
                  <strong>Check-in:</strong> {arrivalFormatted} ➔ <strong>Check-out:</strong> {departureFormatted}
                </span>
              </div>
              <div className="text-slate-400">
                Room Subtotal: <strong className="text-white">₹{roomTariffSubtotal.toLocaleString('en-IN')}</strong> ({nights} Night{nights > 1 ? 's' : ''} × ₹{ratePerNight})
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 4: MEAL PLAN SELECTION
             ══════════════════════════════════════════════════════════════════ */}
          <div
            id="section-meals"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Meal Plan Selection (EP, CP, MAP, AP)
                </h3>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                <span>Add meal cost to total bill</span>
                <input
                  type="checkbox"
                  checked={addMealToTotal}
                  onChange={(e) => setAddMealToTotal(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-[#00b894] focus:ring-0"
                />
              </label>
            </div>

            {/* 4 Meal Plan Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {MEAL_PLANS.map((plan) => {
                const isSelected = mealPlan === plan.id;
                const cost = plan.costPerPersonPerNight * adults * nights;

                return (
                  <div
                    key={plan.id}
                    onClick={() => setMealPlan(plan.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                        : 'bg-[#1e293b]/50 border-slate-800 hover:border-slate-700 hover:bg-[#1e293b]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`font-black text-sm ${
                            isSelected ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {plan.code}
                        </span>
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 uppercase">{plan.badge}</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 mb-1">{plan.name}</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{plan.desc}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">
                        {plan.costPerPersonPerNight > 0 ? `+₹${plan.costPerPersonPerNight}/guest/nt` : 'Included (₹0)'}
                      </span>
                      {plan.costPerPersonPerNight > 0 && addMealToTotal && (
                        <span className="font-bold text-emerald-400">+₹{cost.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 5: SPA, POOL & COMPLIMENTARY AMENITIES
             ══════════════════════════════════════════════════════════════════ */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Spa Packages, Pool & Complimentary Amenities
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Add-on wellness & hotel perks</span>
            </div>

            {/* Spa & Pool Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>Spa & Wellness Experience</span>
                </label>
                <select
                  value={spaPackageId}
                  onChange={(e) => setSpaPackageId(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {SPA_PACKAGES.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1 italic">{selectedSpaObj?.desc}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Swimming Pool & Jacuzzi Access</span>
                </label>
                <select
                  value={poolPackageId}
                  onChange={(e) => setPoolPackageId(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {POOL_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1 italic">{selectedPoolObj?.desc}</p>
              </div>
            </div>

            {/* Standard Complimentary Perks Checkboxes */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="block text-xs font-semibold text-slate-300">
                Included Complimentary Perks (Check/Uncheck as applicable):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { key: 'wifi', icon: Wifi, label: 'Free High-Speed Wi-Fi' },
                  { key: 'welcomeDrink', icon: Coffee, label: 'Welcome Drink on Arrival' },
                  { key: 'waterBottles', icon: Droplets, label: '2 Mineral Water Bottles Daily' },
                  { key: 'teaCoffee', icon: Coffee, label: 'Tea & Coffee Maker Station' },
                  { key: 'parking', icon: Car, label: 'Free Guest Parking' },
                  { key: 'dailyHousekeeping', icon: Sparkles, label: 'Daily Housekeeping & Linen' },
                ].map((perk) => {
                  const Icon = perk.icon;
                  const isChecked = !!complimentaryPerks[perk.key];
                  return (
                    <div
                      key={perk.key}
                      onClick={() => togglePerk(perk.key)}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        readOnly
                        className="rounded border-slate-700 bg-slate-800 text-emerald-500 pointer-events-none"
                      />
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[11px] font-medium truncate">{perk.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Complimentary Perks Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Custom Complimentary Perks / Front Desk Remarks
              </label>
              <input
                type="text"
                value={customComplimentaryNotes}
                onChange={(e) => setCustomComplimentaryNotes(e.target.value)}
                placeholder="e.g. Free late checkout till 2:00 PM approved by Manager, Free Airport Drop"
                className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              SECTION 6: BILLING BREAKDOWN, ADVANCE & PAYMENT MODE
             ══════════════════════════════════════════════════════════════════ */}
          <div
            id="section-billing"
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#00b894]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Tariff Breakdown, Advance & Payment Mode
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Real-time financial summary</span>
            </div>

            {/* Financial Breakdown Table / Card */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/80 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Room Charges ({nights} Night{nights > 1 ? 's' : ''} × ₹{ratePerNight}):</span>
                <span className="font-semibold text-white">₹{roomTariffSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {mealPlanTotalCost > 0 && (
                <div className="flex items-center justify-between text-slate-300">
                  <span>Meal Plan ({selectedMealPlanObj.code} - {adults} Adult{adults > 1 ? 's' : ''}):</span>
                  <span className="font-semibold text-emerald-400">+₹{mealPlanTotalCost.toLocaleString('en-IN')}</span>
                </div>
              )}

              {(selectedSpaObj?.price || 0) > 0 && (
                <div className="flex items-center justify-between text-slate-300">
                  <span>Spa Package ({selectedSpaObj.name.split('(')[0]}):</span>
                  <span className="font-semibold text-violet-400">+₹{selectedSpaObj.price.toLocaleString('en-IN')}</span>
                </div>
              )}

              {(selectedPoolObj?.price || 0) > 0 && (
                <div className="flex items-center justify-between text-slate-300">
                  <span>Pool Pass ({selectedPoolObj.name.split('(')[0]}):</span>
                  <span className="font-semibold text-cyan-400">+₹{selectedPoolObj.price.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-sm">
                <span className="font-bold text-white">Grand Total Booking Tariff:</span>
                <span className="font-extrabold text-white text-base">₹{computedGrandTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Advance Deposit & Payment Mode Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>Advance Deposit Paid (₹)</span>
                  <span className="text-[10px] text-emerald-400">Paid Now</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max={computedGrandTotal}
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                />
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickAdvance(0)}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    ₹0 (Due Later)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickAdvance(50)}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    50% Advance
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickAdvance(100)}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                  >
                    100% Full
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Payment Mode for Advance
                </label>
                <select
                  value={advancePaymentMode}
                  onChange={(e) => setAdvancePaymentMode(e.target.value)}
                  className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894]"
                >
                  <option value="CASH" className="bg-slate-900 text-white">Cash</option>
                  <option value="UPI" className="bg-slate-900 text-white">UPI / QR Scan</option>
                  <option value="CARD" className="bg-slate-900 text-white">Credit / Debit Card</option>
                  <option value="NET_BANKING" className="bg-slate-900 text-white">Net Banking / NEFT</option>
                  <option value="CORPORATE_BILLING" className="bg-slate-900 text-white">Corporate Direct Bill</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Net Balance Due at Checkout
                </label>
                <div
                  className={`h-[38px] rounded-xl px-3.5 flex items-center justify-between border font-mono font-bold text-sm ${
                    balanceDue === 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <span>{balanceDue === 0 ? '✓ Fully Paid' : 'Balance Due:'}</span>
                  <span>₹{balanceDue.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Guest Notes & Requests */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Guest Notes & Front Desk Special Requests
              </label>
              <textarea
                rows={2}
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
                placeholder="e.g. VIP guest, high floor room, extra towels, non-smoking floor, late arrival expected..."
                className="w-full bg-[#1e293b]/70 border border-slate-700/80 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#00b894] placeholder:text-slate-500"
              ></textarea>
            </div>
          </div>

          {/* ── Sticky Bottom Action Bar ── */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-3 border-t border-slate-800">
            {/* Live summary snippet */}
            <div className="flex items-center gap-3 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                Duration: <strong className="text-white">{nights} Night(s)</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                Total: <strong className="text-white">₹{computedGrandTotal.toLocaleString('en-IN')}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300">
                Due: <strong className={balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}>₹{balanceDue.toLocaleString('en-IN')}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-bold bg-[#00b894] hover:bg-[#00a884] active:scale-[0.98] text-white rounded-xl flex items-center gap-2 shadow-lg shadow-[#00b894]/25 transition-all cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save Real Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
