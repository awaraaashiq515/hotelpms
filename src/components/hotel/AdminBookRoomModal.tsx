'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Hotel, User, Building2, Calendar, BedDouble, CheckCircle2,
  Waves, Droplets, Flower2, FileText, CreditCard, ChevronDown,
  Sparkles, Loader2, Check, Upload, ShieldCheck, IndianRupee,
  Tag, BadgePercent, Percent,
} from 'lucide-react';

export interface RoomTypeOption {
  id: string;
  name: string;
  baseRate: number;
  maxOccupancy: number;
}

export interface AvailableRoomOption {
  id: string;
  roomNumber: string;
  type: string;
  price: number;
  roomTypeId: string;
}

interface AdminBookRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyCode: string;
  roomTypes: RoomTypeOption[];
  availableRooms: AvailableRoomOption[];
  preselectedRoom?: { id: string; roomNumber: string; roomTypeId: string } | null;
  onBookingSuccess: () => void;
}

const DEFAULT_POOL_PASS_OPTIONS = [
  { id: 'p0', name: 'Complimentary / Free Pool Access', price: 0, duration: 'Free / Stay' },
  { id: 'p1', name: 'Standard Swimming Pool Pass', price: 500, duration: 'Full Day' },
  { id: 'p2', name: 'All-Day VIP Cabana Pass', price: 1200, duration: 'Full Day' },
  { id: 'p3', name: 'Sunset Cocktail & Jacuzzi Pass', price: 1500, duration: 'Evening (4 PM - 9 PM)' },
  { id: 'p4', name: 'Family Splash & Fun Pass', price: 1800, duration: 'Full Day' },
];

const DEFAULT_SPA_PACKAGES = [
  { id: 'NONE', name: 'No Spa Package (₹0)', price: 0 },
  { id: 'COMPLIMENTARY_WELCOME', name: 'Complimentary Welcome Foot Massage (₹0 / Free)', price: 0 },
  { id: 'RELAXATION_60MIN', name: 'Swedish Relaxation Massage - 60m (₹1,800)', price: 1800 },
  { id: 'DETOX_SAUNA', name: 'Full Body Detox & Hot Stone Therapy (₹2,800)', price: 2800 },
  { id: 'COUPLE_SPA', name: 'Royal Couple Wellness Spa Day (₹4,500)', price: 4500 },
  { id: 'AYURVEDIC', name: 'Traditional Ayurvedic Rejuvenation (₹3,200)', price: 3200 },
];

export function AdminBookRoomModal({
  isOpen,
  onClose,
  propertyId,
  propertyCode,
  roomTypes,
  availableRooms,
  preselectedRoom,
  onBookingSuccess,
}: AdminBookRoomModalProps) {
  // Guest Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  // Corporate / GST Billing
  const [isCorporateBooking, setIsCorporateBooking] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Stay & Room
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [arrivalDate, setArrivalDate] = useState(todayStr);
  const [departureDate, setDepartureDate] = useState(tomorrowStr);
  const [roomTypeId, setRoomTypeId] = useState('');
  const [assignedRoomId, setAssignedRoomId] = useState('');
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  const [mealPlan, setMealPlan] = useState('RO');
  const [wifiPassword, setWifiPassword] = useState('');

  // Add-ons (Pool & Spa)
  const [showAddons, setShowAddons] = useState(false);
  const [poolAccess, setPoolAccess] = useState(false);
  const [poolPackage, setPoolPackage] = useState(DEFAULT_POOL_PASS_OPTIONS[0].name);
  const [poolPassCost, setPoolPassCost] = useState('0');
  const [spaAccess, setSpaAccess] = useState(false);
  const [spaPackage, setSpaPackage] = useState('NONE');
  const [spaPackageCost, setSpaPackageCost] = useState('0');
  const [addOnNotes, setAddOnNotes] = useState('');

  // KYC
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Billing & Discount
  const [gstRate, setGstRate] = useState<number>(12); // Default 12% GST
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountValue, setDiscountValue] = useState<string>('0');
  const [discountReason, setDiscountReason] = useState<string>('Owner Special Concession');
  const [totalAmount, setTotalAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('0');

  // Submitting
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle preselected room
  useEffect(() => {
    if (preselectedRoom) {
      if (preselectedRoom.roomTypeId) setRoomTypeId(preselectedRoom.roomTypeId);
      if (preselectedRoom.id) setAssignedRoomId(preselectedRoom.id);
      generateWifiPass(preselectedRoom.roomNumber);
    } else if (roomTypes.length > 0 && !roomTypeId) {
      setRoomTypeId(roomTypes[0].id);
    }
  }, [preselectedRoom, roomTypes]);

  // Generate WiFi password
  const generateWifiPass = (roomNo?: string) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const roomPart = roomNo || 'RM';
    setWifiPassword(`${roomPart}-${rand}`);
  };

  // Filter available rooms for chosen roomTypeId
  const eligibleRooms = useMemo(() => {
    if (!roomTypeId) return availableRooms;
    return availableRooms.filter(r => !r.roomTypeId || r.roomTypeId === roomTypeId);
  }, [availableRooms, roomTypeId]);

  // Total nights calculation
  const totalNights = useMemo(() => {
    if (!arrivalDate || !departureDate) return 1;
    const arr = new Date(arrivalDate);
    const dep = new Date(departureDate);
    const diffTime = dep.getTime() - arr.getTime();
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }, [arrivalDate, departureDate]);

  // Selected room type
  const selectedRoomType = useMemo(() => {
    return roomTypes.find(r => r.id === roomTypeId);
  }, [roomTypes, roomTypeId]);

  // Room rent
  const roomRent = useMemo(() => {
    return (selectedRoomType?.baseRate || 0) * totalNights;
  }, [selectedRoomType, totalNights]);

  const poolCost = poolAccess ? Number(poolPassCost || 0) : 0;
  const spaCost = spaAccess ? Number(spaPackageCost || 0) : 0;
  const grossSubTotal = roomRent + poolCost + spaCost;

  // Discount calculation
  const discountNum = Math.max(0, Number(discountValue) || 0);
  const discountAmount = useMemo(() => {
    if (discountNum <= 0) return 0;
    if (discountType === 'PERCENT') {
      return Math.min(grossSubTotal, Math.round((grossSubTotal * Math.min(100, discountNum)) / 100));
    }
    return Math.min(grossSubTotal, discountNum);
  }, [grossSubTotal, discountType, discountNum]);

  const netSubTotal = Math.max(0, grossSubTotal - discountAmount);
  const gstAmount = gstRate > 0 ? Math.round((netSubTotal * gstRate) / 100) : 0;
  const grandTotalCalculated = netSubTotal + gstAmount;

  // Sync grandTotalCalculated to totalAmount input
  useEffect(() => {
    setTotalAmount(grandTotalCalculated > 0 ? grandTotalCalculated.toString() : '');
  }, [grandTotalCalculated]);

  // Handle Mock ID Document Upload / OCR
  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setDocumentUrl(`doc_${Date.now()}_${file.name}`);
      if (!idNumber) {
        // Auto-generate realistic demo doc ID based on type
        if (idType === 'Aadhaar Card') {
          const p1 = Math.floor(1000 + Math.random() * 9000);
          const p2 = Math.floor(1000 + Math.random() * 9000);
          const p3 = Math.floor(1000 + Math.random() * 9000);
          setIdNumber(`${p1} ${p2} ${p3}`);
        } else if (idType === 'Passport') {
          setIdNumber('Z' + Math.floor(1000000 + Math.random() * 9000000));
        } else {
          setIdNumber('DL-' + Math.floor(10000000 + Math.random() * 90000000));
        }
      }
    }, 1000);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!firstName.trim()) {
      setErrorMsg('Guest first name is required.');
      return;
    }
    if (!mobile.trim()) {
      setErrorMsg('Guest mobile number is required.');
      return;
    }
    if (!arrivalDate || !departureDate) {
      setErrorMsg('Check-in and Check-out dates are required.');
      return;
    }
    if (!roomTypeId) {
      setErrorMsg('Please select a room category.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        propertyId,
        guestData: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          idType: idNumber ? idType : null,
          idNumber: idNumber || null,
          documentUrl: documentUrl || null,
          gstNumber: isCorporateBooking ? gstNumber.trim().toUpperCase() : null,
          companyName: isCorporateBooking ? companyName.trim() : null,
          billingAddress: isCorporateBooking ? billingAddress.trim() : null,
        },
        arrivalDate,
        departureDate,
        adults: Number(adults) || 1,
        children: Number(children) || 0,
        roomTypeId,
        assignedRoomId: assignedRoomId || null,
        totalAmount: Number(totalAmount) || 0,
        advanceAmount: Number(advanceAmount) || 0,
        wifiPassword: wifiPassword || null,
        wifiStatus: 'ACTIVE',
        mealPlan,
        poolAccess,
        poolPackage: poolAccess ? poolPackage : 'NONE',
        poolPassCost: poolAccess ? Number(poolPassCost) : 0,
        spaPackage: spaAccess ? spaPackage : 'NONE',
        spaPackageCost: spaAccess ? Number(spaPackageCost) : 0,
        addOnNotes: (() => {
          let note = addOnNotes.trim();
          if (discountAmount > 0) {
            const discText = `[Owner Discount: ₹${discountAmount.toLocaleString('en-IN')}${discountType === 'PERCENT' ? ` (${discountValue}%)` : ''}${discountReason ? ` - ${discountReason}` : ''}]`;
            note = note ? `${note} | ${discText}` : discText;
          }
          return note;
        })(),
        gstNumber: isCorporateBooking ? gstNumber.trim().toUpperCase() : null,
        companyName: isCorporateBooking ? companyName.trim() : null,
        billingAddress: isCorporateBooking ? billingAddress.trim() : null,
      };

      const res = await fetch('/api/hotel/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        alert(`✅ Reservation Confirmed!\nBooking No: ${data.data?.bookingNo || 'CONFIRMED'}\nGuest: ${firstName} ${lastName}\nReceptionist and Housekeeping notified.`);
        onBookingSuccess();
        onClose();
      } else {
        setErrorMsg(data.message || 'Booking creation failed.');
      }
    } catch {
      setErrorMsg('Network error connecting to booking service.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const numTotal = Number(totalAmount) || 0;
  const numAdvance = Number(advanceAmount) || 0;
  const balanceDue = Math.max(0, numTotal - numAdvance);

  return (
    <div className="fixed inset-0 z-[999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#0e1628] to-[#070b14] border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in-50 zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Hotel size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Owner Direct Reservation</h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  {propertyCode || 'HOTEL'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Book a room directly with instant room assignment & billing ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 text-slate-200">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ── CARD 1: Guest Identification Details ── */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/8 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/8 pb-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                <User size={15} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                1. Guest Identification Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="e.g. Rohit"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="e.g. Verma"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Mobile Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. rohit@example.com"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Corporate / GST Billing Collapsible */}
            <div className="pt-2 border-t border-white/5">
              <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsCorporateBooking(!isCorporateBooking)}
                  className="w-full p-3 flex items-center justify-between hover:bg-slate-900/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-slate-200">
                        Corporate / Business Booking (GST Invoice)
                      </span>
                      <span className="ml-2 text-[9px] font-bold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase tracking-wider">
                        Optional
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
                    isCorporateBooking
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isCorporateBooking ? 'Hide GST' : '+ Add GST Details'}
                  </span>
                </button>

                {isCorporateBooking && (
                  <div className="p-3.5 pt-1 border-t border-white/5 space-y-3 bg-amber-500/5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          Company / Business Name *
                        </label>
                        <input
                          type="text"
                          required={isCorporateBooking}
                          value={companyName}
                          onChange={e => setCompanyName(e.target.value)}
                          placeholder="e.g. Acme Tech Solutions Pvt Ltd"
                          className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                          GST Number (GSTIN) *
                        </label>
                        <input
                          type="text"
                          maxLength={15}
                          required={isCorporateBooking}
                          value={gstNumber}
                          onChange={e => setGstNumber(e.target.value.toUpperCase())}
                          placeholder="e.g. 07AAAAA0000A1Z5"
                          className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                        Company Billing Address
                      </label>
                      <input
                        type="text"
                        value={billingAddress}
                        onChange={e => setBillingAddress(e.target.value)}
                        placeholder="e.g. 101 Corporate Tower, Phase 2, Gurugram"
                        className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── CARD 2: Stay & Room Allocation ── */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/8 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/8 pb-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                <BedDouble size={15} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                2. Stay & Room Allocation
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  required
                  value={arrivalDate}
                  onChange={e => setArrivalDate(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Check-out Date *</span>
                  <span className="text-[10px] text-amber-400 font-bold">{totalNights} Night{totalNights > 1 ? 's' : ''} Stay</span>
                </label>
                <input
                  type="date"
                  required
                  value={departureDate}
                  onChange={e => setDepartureDate(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Room Category / Type *
                </label>
                <select
                  required
                  value={roomTypeId}
                  onChange={e => {
                    setRoomTypeId(e.target.value);
                    setAssignedRoomId('');
                  }}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Select Room Category</option>
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id}>
                      {rt.name} (Rent: ₹{rt.baseRate}/night)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Assign Physical Room (Optional)
                </label>
                <select
                  value={assignedRoomId}
                  onChange={e => {
                    const id = e.target.value;
                    setAssignedRoomId(id);
                    const rm = availableRooms.find(r => r.id === id);
                    if (rm) generateWifiPass(rm.roomNumber);
                  }}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Auto-Assign Later</option>
                  {eligibleRooms.map(r => (
                    <option key={r.id} value={r.id}>
                      Room #{r.roomNumber} ({r.type || 'Available'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Adults
                </label>
                <input
                  type="number"
                  min="1"
                  value={adults}
                  onChange={e => setAdults(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Children
                </label>
                <input
                  type="number"
                  min="0"
                  value={children}
                  onChange={e => setChildren(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Meal Plan
                </label>
                <select
                  value={mealPlan}
                  onChange={e => setMealPlan(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                >
                  <option value="RO">RO (Room Only)</option>
                  <option value="BB">BB (Bed & Breakfast)</option>
                  <option value="HB">HB (Half Board)</option>
                  <option value="MAP">MAP (Breakfast + Dinner)</option>
                  <option value="FB">FB (Full Board)</option>
                  <option value="AI">AI (All Inclusive)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>WiFi Pass</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sel = availableRooms.find(r => r.id === assignedRoomId);
                      generateWifiPass(sel?.roomNumber);
                    }}
                    className="text-[9px] text-amber-400 font-black uppercase"
                  >
                    Gen
                  </button>
                </label>
                <input
                  type="text"
                  value={wifiPassword}
                  onChange={e => setWifiPassword(e.target.value)}
                  placeholder="Auto-generated"
                  className="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* ── CARD 3: Swimming Pool & Spa Add-ons ── */}
          <div className="rounded-2xl bg-slate-900/50 border border-white/8 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowAddons(!showAddons)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                  <Waves size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                      3. Swimming Pool & Spa Add-ons
                    </h3>
                    <span className="text-[9px] font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-500/20 uppercase tracking-widest">
                      Optional
                    </span>
                    {(poolAccess || spaAccess) && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        ✓ Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {poolAccess || spaAccess
                      ? `${poolAccess ? 'Swimming Pool Pass Included' : ''}${poolAccess && spaAccess ? ' • ' : ''}${spaAccess ? spaPackage : ''}`
                      : 'Swimming pool privileges, luxury massage & wellness packages'}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                showAddons ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
              }`}>
                {showAddons ? 'Hide Add-ons' : '+ Add Passes'}
              </span>
            </button>

            {showAddons && (
              <div className="p-4 pt-1 border-t border-white/8 space-y-4 bg-cyan-950/10">
                {/* Pool Section */}
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets size={16} className="text-cyan-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Swimming Pool Access Pass</h4>
                        <p className="text-[10px] text-slate-400">Pool entry privileges for staying guests</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPoolAccess(!poolAccess)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        poolAccess ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {poolAccess ? '✓ Included' : 'No Pool'}
                    </button>
                  </div>

                  {poolAccess && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-cyan-500/20">
                      <div>
                        <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                          Pass Package
                        </label>
                        <select
                          value={poolPackage}
                          onChange={e => {
                            const val = e.target.value;
                            setPoolPackage(val);
                            const found = DEFAULT_POOL_PASS_OPTIONS.find(p => p.name === val);
                            if (found) setPoolPassCost(found.price.toString());
                          }}
                          className="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs text-white focus:outline-none"
                        >
                          {DEFAULT_POOL_PASS_OPTIONS.map(p => (
                            <option key={p.id} value={p.name}>
                              {p.name} (₹{p.price})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
                          Pass Charge (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={poolPassCost}
                          onChange={e => setPoolPassCost(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs text-cyan-200 font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Spa Section */}
                <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flower2 size={16} className="text-purple-400" />
                      <div>
                        <h4 className="text-xs font-bold text-white">Spa & Wellness Packages</h4>
                        <p className="text-[10px] text-slate-400">Massage and relaxation treatment packages</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSpaAccess(!spaAccess)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        spaAccess ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {spaAccess ? '✓ Spa Included' : 'No Spa'}
                    </button>
                  </div>

                  {spaAccess && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-500/20">
                      <div>
                        <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                          Spa Package Choice
                        </label>
                        <select
                          value={spaPackage}
                          onChange={e => {
                            const val = e.target.value;
                            setSpaPackage(val);
                            const found = DEFAULT_SPA_PACKAGES.find(s => s.id === val);
                            if (found) setSpaPackageCost(found.price.toString());
                          }}
                          className="w-full h-9 px-2.5 rounded-lg bg-slate-950 border border-purple-500/30 text-xs text-white focus:outline-none"
                        >
                          {DEFAULT_SPA_PACKAGES.filter(s => s.id !== 'NONE').map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1">
                          Spa Charge (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={spaPackageCost}
                          onChange={e => setSpaPackageCost(e.target.value)}
                          className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-purple-500/30 text-xs text-purple-200 font-mono font-bold focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Special Requests / Preferred Time Notes
                  </label>
                  <input
                    type="text"
                    value={addOnNotes}
                    onChange={e => setAddOnNotes(e.target.value)}
                    placeholder="e.g. High floor room, late check-in 9 PM, extra blanket"
                    className="w-full h-9 px-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── CARD 4: Identity Proof (KYC) ── */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/8 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/8 pb-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                <FileText size={15} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                4. Identity Proof (KYC)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  ID Document Type
                </label>
                <select
                  value={idType}
                  onChange={e => setIdType(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white focus:outline-none"
                >
                  <option>Aadhaar Card</option>
                  <option>Passport</option>
                  <option>Driving License</option>
                  <option>Voter ID Card</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Document ID Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5421 8923 1042"
                  value={idNumber}
                  onChange={e => setIdNumber(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white font-mono tracking-wider focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Upload / Scan ID Document (AI OCR Ready)
              </label>
              <div className="relative border-2 border-dashed border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-colors flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/40">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDocUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {isScanning ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 size={18} className="animate-spin text-amber-400" />
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider animate-pulse">
                      Scanning ID with AI OCR...
                    </span>
                  </div>
                ) : documentUrl ? (
                  <div className="flex items-center gap-2 text-emerald-400 py-1">
                    <Check size={16} />
                    <span className="text-xs font-bold">Document attached & verified ({documentUrl})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-500 py-1">
                    <Upload size={16} />
                    <span className="text-xs">Click or drop ID image to scan and attach automatically</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── CARD 5: Reservation Billing Ledger ── */}
          <div className="p-5 rounded-2xl bg-slate-900/50 border border-white/8 space-y-4">
            <div className="flex items-center justify-between border-b border-white/8 pb-2.5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/15 text-orange-400">
                  <CreditCard size={15} />
                </div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  5. Reservation Billing & Payment Ledger
                </h3>
              </div>
              {discountAmount > 0 && (
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <BadgePercent size={11} />
                  -₹{discountAmount.toLocaleString('en-IN')} Discount Applied
                </span>
              )}
            </div>

            {/* ── Owner Discount Section ── */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 space-y-3.5 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center justify-center">
                    <Tag size={15} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-black text-white">Owner Discount / Concession</h4>
                      <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/25 uppercase tracking-widest">
                        Special Privilege
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Apply flat amount or percentage discount directly to guest reservation
                    </p>
                  </div>
                </div>

                {/* Discount Type Toggle */}
                <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('FIXED');
                      if (discountType === 'PERCENT') setDiscountValue('0');
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      discountType === 'FIXED'
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ₹ Flat Amount
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('PERCENT');
                      if (discountType === 'FIXED') setDiscountValue('0');
                    }}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      discountType === 'PERCENT'
                        ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    % Percentage
                  </button>
                </div>
              </div>

              {/* Discount Inputs & Quick Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>{discountType === 'PERCENT' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}</span>
                    {discountAmount > 0 && (
                      <span className="text-[10px] text-emerald-400 font-black">
                        ✓ Saves ₹{discountAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={discountType === 'PERCENT' ? 100 : grossSubTotal}
                      value={discountValue}
                      onChange={e => setDiscountValue(e.target.value)}
                      placeholder="0"
                      className="w-full h-10 pl-3.5 pr-8 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 font-mono font-black text-sm focus:outline-none focus:border-emerald-400 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-400/70">
                      {discountType === 'PERCENT' ? '%' : '₹'}
                    </span>
                  </div>

                  {/* Preset Quick Chips */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[9px] text-slate-500 font-black uppercase mr-0.5">Quick:</span>
                    {(discountType === 'PERCENT'
                      ? [5, 10, 15, 20, 25]
                      : [200, 500, 1000, 1500, 2000]
                    ).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setDiscountValue(val.toString())}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition-all cursor-pointer ${
                          discountValue === val.toString()
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {discountType === 'PERCENT' ? `${val}%` : `₹${val}`}
                      </button>
                    ))}
                    {discountNum > 0 && (
                      <button
                        type="button"
                        onClick={() => setDiscountValue('0')}
                        className="px-2 py-1 rounded-lg text-[9px] font-bold text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Discount Reason / Note
                  </label>
                  <select
                    value={discountReason}
                    onChange={e => setDiscountReason(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 mb-1.5 font-semibold"
                  >
                    <option value="Owner Special Concession">Owner Special Concession</option>
                    <option value="VIP / Regular Guest">VIP / Regular Guest</option>
                    <option value="Corporate Courtesy">Corporate Courtesy</option>
                    <option value="Long Stay Concession">Long Stay Concession</option>
                    <option value="Friend & Family Rate">Friend & Family Rate</option>
                    <option value="Direct Walk-in Special">Direct Walk-in Special</option>
                  </select>
                  <p className="text-[10px] text-slate-500">
                    Documented on guest billing folio & reservation logs
                  </p>
                </div>
              </div>

              {/* Price Calculation Transparency Row */}
              <div className="pt-2.5 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-3 text-slate-400 flex-wrap">
                  <span>Gross: <strong className="text-slate-200 font-mono">₹{grossSubTotal.toLocaleString('en-IN')}</strong></span>
                  {discountAmount > 0 && (
                    <span className="text-emerald-400 font-bold">
                      Discount: <strong className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</strong>
                    </span>
                  )}
                  <span>Taxable: <strong className="text-slate-200 font-mono">₹{netSubTotal.toLocaleString('en-IN')}</strong></span>
                  <span>GST ({gstRate}%): <strong className="text-slate-200 font-mono">+₹{gstAmount.toLocaleString('en-IN')}</strong></span>
                </div>
                <div className="text-xs font-black text-amber-300 font-mono">
                  Net: ₹{grandTotalCalculated.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Tax & Total Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  GST Tax Rate
                </label>
                <select
                  value={gstRate}
                  onChange={e => setGstRate(Number(e.target.value))}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white font-bold focus:outline-none"
                >
                  <option value={0}>0% (Tax Exempted)</option>
                  <option value={5}>5% (Budget Hotel)</option>
                  <option value={12}>12% (Standard GST)</option>
                  <option value={18}>18% (Luxury / Premium)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Total Billing Amount (₹)</span>
                  {discountAmount > 0 && (
                    <span className="text-[9px] text-emerald-400 font-bold">✓ Discounted</span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalAmount}
                  onChange={e => setTotalAmount(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-black text-sm focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Advance Amount Paid (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(e.target.value)}
                  placeholder="0"
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-emerald-400 font-black text-sm focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Live Ledger Summary Strip */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-slate-400">
                  Stay: <strong className="text-white">{totalNights} Night{totalNights > 1 ? 's' : ''}</strong>
                </span>
                {discountAmount > 0 && (
                  <span className="text-emerald-400 font-bold">
                    Discount: <strong className="font-mono">-₹{discountAmount.toLocaleString('en-IN')}</strong>
                  </span>
                )}
                <span className="text-slate-400">
                  Total: <strong className="text-amber-400 font-mono">₹{numTotal.toLocaleString('en-IN')}</strong>
                </span>
                <span className="text-slate-400">
                  Advance: <strong className="text-emerald-400 font-mono">₹{numAdvance.toLocaleString('en-IN')}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-500">Balance Due:</span>
                <span className={`text-sm font-black font-mono ${balanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ₹{balanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Locking Reservation...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirm & Lock Reservation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
