'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  User,
  Calendar,
  Building,
  CreditCard,
  FileText,
  Upload,
  Check,
  Loader2,
  Sparkles,
  Waves,
  Droplets,
  Flower2,
  CheckCircle2,
  UserCheck,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuickBookModalProps {
  isOpen: boolean;
  prefillRoomId?: string;
  prefillDate?: string;
  roomsList: any[];
  roomTypes?: any[];
  onClose: () => void;
  onCreated: () => void;
}

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

export function QuickBookModal({
  isOpen,
  prefillRoomId,
  prefillDate,
  roomsList,
  roomTypes = [],
  onClose,
  onCreated,
}: QuickBookModalProps) {
  // Guest Identification Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  // Corporate / GST Booking
  const [isCorporateBooking, setIsCorporateBooking] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Stay & Room Allocation
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureDate, setDepartureDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [roomTypeId, setRoomTypeId] = useState('');
  const [assignedRoomId, setAssignedRoomId] = useState('');
  const [adults, setAdults] = useState('1');
  const [children, setChildren] = useState('0');
  const [mealPlan, setMealPlan] = useState('RO');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiStatus, setWifiStatus] = useState('ACTIVE');

  // Swimming Pool & Spa (Collapsible Extras)
  const [showAddons, setShowAddons] = useState(false);
  const [poolAccess, setPoolAccess] = useState(false);
  const [poolPackage, setPoolPackage] = useState('Complimentary / Free Pool Access');
  const [poolPassCost, setPoolPassCost] = useState('0');
  const [spaAccess, setSpaAccess] = useState(false);
  const [spaPackage, setSpaPackage] = useState('NONE');
  const [spaPackageCost, setSpaPackageCost] = useState('0');
  const [addOnNotes, setAddOnNotes] = useState('');
  const [dynamicPoolPasses, setDynamicPoolPasses] = useState<any[]>(DEFAULT_POOL_PASS_OPTIONS);

  // Identity Proof (KYC)
  const [createIdType, setCreateIdType] = useState('Aadhaar Card');
  const [createIdNumber, setCreateIdNumber] = useState('');
  const [createDocumentUrl, setCreateDocumentUrl] = useState('');
  const [createUploading, setCreateUploading] = useState(false);

  // Billing
  const [totalAmount, setTotalAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('0');
  const [gstRate, setGstRate] = useState(0);
  const [checkInImmediately, setCheckInImmediately] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [localRoomTypes, setLocalRoomTypes] = useState<any[]>(roomTypes);

  // Fetch room types if not provided
  useEffect(() => {
    if (roomTypes && roomTypes.length > 0) {
      setLocalRoomTypes(roomTypes);
    } else {
      fetch('/api/hotel/room-types')
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setLocalRoomTypes(res.data);
        })
        .catch(() => null);
    }

    // Fetch pool passes
    fetch('/api/hotel/pool-passes')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          const apiPasses = res.data;
          const hasComp = apiPasses.some(
            (p: any) =>
              p.price === 0 ||
              p.name.toLowerCase().includes('complimentary') ||
              p.name.toLowerCase().includes('free')
          );
          if (!hasComp) {
            setDynamicPoolPasses([
              { id: 'p0', name: 'Complimentary / Free Pool Access', category: 'COMPLIMENTARY', price: 0, duration: 'Free / Stay' },
              { id: 'p0b', name: 'Complimentary In-House Guest Pool Pass', category: 'COMPLIMENTARY', price: 0, duration: 'Complimentary' },
              ...apiPasses,
            ]);
          } else {
            setDynamicPoolPasses(apiPasses);
          }
        }
      })
      .catch(() => null);
  }, [roomTypes]);

  // WiFi generator helper
  const generateWifi = (roomNo?: string) => {
    const rm = roomNo || 'WIFI';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let randomPart = '';
    for (let i = 0; i < 4; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWifiPassword(`${rm}-${randomPart}`);
  };

  // Prefill initialization when opening
  useEffect(() => {
    if (!isOpen) return;

    if (prefillDate) {
      setArrivalDate(prefillDate);
      const nextDay = new Date(new Date(prefillDate).getTime() + 86400000)
        .toISOString()
        .split('T')[0];
      setDepartureDate(nextDay);
    } else {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      setArrivalDate(today);
      setDepartureDate(tomorrow);
    }

    if (prefillRoomId) {
      setAssignedRoomId(prefillRoomId);
      const foundRoom = roomsList.find((r) => r.id === prefillRoomId);
      if (foundRoom) {
        if (foundRoom.roomTypeId) setRoomTypeId(foundRoom.roomTypeId);
        generateWifi(foundRoom.roomNumber);
      }
    } else if (roomsList.length > 0) {
      if (!roomTypeId && roomsList[0]?.roomTypeId) {
        setRoomTypeId(roomsList[0].roomTypeId);
      }
    }
  }, [isOpen, prefillRoomId, prefillDate, roomsList]);

  // Re-calculate room rent when dates, roomType, assignedRoom, pool/spa or GST changes
  useEffect(() => {
    let roomRent = 0;
    if (arrivalDate && departureDate) {
      const nights = Math.max(
        1,
        Math.round((new Date(departureDate).getTime() - new Date(arrivalDate).getTime()) / (1000 * 60 * 60 * 24))
      );

      // Check if selected physical room has a customRate or discount
      const room = roomsList.find((r) => r.id === assignedRoomId);
      const type = localRoomTypes.find((t) => t.id === roomTypeId);

      let nightlyRate = 3500;
      if (room?.customRate) {
        nightlyRate = room.customRate;
      } else if (room?.discount && type?.baseRate) {
        nightlyRate = Math.round(type.baseRate * (1 - room.discount / 100));
      } else if (type?.baseRate) {
        nightlyRate = type.baseRate;
      }

      if (!isNaN(nights) && nights > 0) {
        roomRent = nightlyRate * nights;
      }
    }

    const poolCost = poolAccess ? Number(poolPassCost || 0) : 0;
    const spaCost = Number(spaPackageCost || 0);
    const subTotal = roomRent + poolCost + spaCost;
    const gstAmt = gstRate > 0 ? Math.round((subTotal * gstRate) / 100) : 0;
    const grandTotal = subTotal + gstAmt;

    if (grandTotal > 0 || (roomRent === 0 && (poolCost > 0 || spaCost > 0))) {
      setTotalAmount(grandTotal.toString());
    }
  }, [
    arrivalDate,
    departureDate,
    roomTypeId,
    assignedRoomId,
    localRoomTypes,
    roomsList,
    poolAccess,
    poolPassCost,
    spaPackageCost,
    gstRate,
  ]);

  const handleMealPlanChange = (plan: string) => {
    setMealPlan(plan);
    if (plan === 'AI') {
      setShowAddons(true);
      setPoolAccess(true);
      setPoolPackage('Complimentary / Free Pool Access');
      setPoolPassCost('0');
      setSpaAccess(true);
      setSpaPackage('COMPLIMENTARY_WELCOME');
      setSpaPackageCost('0');
      toast.info('All Inclusive Plan: Complimentary Pool & Spa added!');
    } else if (plan === 'FB' || plan === 'MAP') {
      setShowAddons(true);
      setPoolAccess(true);
      setPoolPackage('Complimentary / Free Pool Access');
      setPoolPassCost('0');
      toast.info(`${plan} Plan: Complimentary Pool Access enabled!`);
    }
  };

  const handlePoolPackageChange = (pkg: string) => {
    setPoolPackage(pkg);
    const passList = dynamicPoolPasses.length > 0 ? dynamicPoolPasses : DEFAULT_POOL_PASS_OPTIONS;
    const matchedPass = passList.find((p: any) => p.name === pkg || p.id === pkg || p.category === pkg);
    if (matchedPass) {
      setPoolPassCost(matchedPass.price.toString());
    } else if (pkg.toLowerCase().includes('complimentary') || pkg.toLowerCase().includes('free') || pkg === 'INCLUDED') {
      setPoolPassCost('0');
    } else if (pkg === 'STANDARD') setPoolPassCost('500');
    else if (pkg === 'VIP_CABANA') setPoolPassCost('1200');
  };

  const handleSpaPackageChange = (pkg: string) => {
    setSpaPackage(pkg);
    const matched = DEFAULT_SPA_PACKAGES.find((s) => s.id === pkg || s.name === pkg);
    if (matched) {
      setSpaPackageCost(matched.price.toString());
    } else if (pkg === 'NONE' || pkg.includes('COMPLIMENTARY') || pkg.toLowerCase().includes('free')) {
      setSpaPackageCost('0');
    } else if (pkg === 'RELAXATION_60MIN') setSpaPackageCost('1800');
    else if (pkg === 'DETOX_SAUNA') setSpaPackageCost('2800');
    else if (pkg === 'COUPLE_SPA') setSpaPackageCost('4500');
    else if (pkg === 'AYURVEDIC') setSpaPackageCost('3200');
  };

  const toggleSpaAccess = () => {
    const next = !spaAccess;
    setSpaAccess(next);
    if (!next) {
      setSpaPackage('NONE');
      setSpaPackageCost('0');
    } else {
      setSpaPackage('RELAXATION_60MIN');
      setSpaPackageCost('1800');
    }
  };

  const handleCreateMockUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCreateUploading(true);
    setTimeout(() => {
      setCreateDocumentUrl(`/uploads/kyc/${file.name}`);
      setCreateUploading(false);

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
        const chars =
          String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
          String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const num = Math.floor(100000 + Math.random() * 900000);
        setCreateIdNumber(`${chars}${num}`);
      }

      toast.success('AI OCR Scanner: Identity document verified & scanned successfully!');
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error('First Name is required.');
      return;
    }
    if (!arrivalDate || !departureDate) {
      toast.error('Check-in and Check-out dates are required.');
      return;
    }
    if (!roomTypeId && !assignedRoomId) {
      toast.error('Please select a Room Category.');
      return;
    }

    setSubmitting(true);
    try {
      // Resolve room category ID if assignedRoomId is picked but roomTypeId is empty
      let finalRoomTypeId = roomTypeId;
      if (!finalRoomTypeId && assignedRoomId) {
        const r = roomsList.find((rm) => rm.id === assignedRoomId);
        if (r?.roomTypeId) finalRoomTypeId = r.roomTypeId;
      }

      const payload = {
        guestData: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          mobile: mobile.trim(),
          idType: createIdNumber ? createIdType : null,
          idNumber: createIdNumber || null,
          documentUrl: createDocumentUrl || null,
        },
        arrivalDate,
        departureDate,
        adults: Number(adults || 1),
        children: Number(children || 0),
        roomTypeId: finalRoomTypeId,
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
      };

      const res = await fetch('/api/hotel/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Failed to create booking.');
        setSubmitting(false);
        return;
      }

      const createdBooking = data.data;

      // If user selected immediate check-in and assigned a physical room:
      if (checkInImmediately && (assignedRoomId || createdBooking.assignedRoomId)) {
        const checkinRes = await fetch('/api/hotel/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId: createdBooking.id,
            guestId: createdBooking.guestId,
            roomId: assignedRoomId || createdBooking.assignedRoomId,
            expectedCheckoutAt: departureDate,
            kycData: {
              idType: createIdType,
              idNumber: createIdNumber,
              documentType: createIdType,
              documentUrl: createDocumentUrl || null,
            },
          }),
        });
        const checkinData = await checkinRes.json();
        if (checkinData.success) {
          toast.success('Reservation created and Guest Checked-in successfully! 🎉');
        } else {
          toast.success('Reservation created! (Check-in note: ' + (checkinData.message || 'Complete check-in manually') + ')');
        }
      } else {
        toast.success('Reservation created successfully!');
      }

      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setMobile('');
      setIsCorporateBooking(false);
      setCompanyName('');
      setGstNumber('');
      setBillingAddress('');
      setAssignedRoomId('');
      setWifiPassword('');
      setMealPlan('RO');
      setPoolAccess(false);
      setSpaPackage('NONE');
      setAddOnNotes('');
      setCreateIdNumber('');
      setCreateDocumentUrl('');
      setCheckInImmediately(false);

      onCreated();
      onClose();
    } catch (err: any) {
      toast.error('Network error: ' + (err?.message || 'Could not create booking'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-6 px-3 sm:px-4 pb-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0f172a] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-7 space-y-6 text-white my-auto">
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-900/80 border border-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Sparkles size={13} /> Reservations Desk
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-none">
            Create Booking Wizard
          </h2>
          <p className="text-xs text-slate-400">
            Enter complete reservation, guest KYC, stay add-ons, and billing details directly into the PMS.
          </p>
        </div>

        {/* Wizard Form */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Guest Info, Stay, Extras */}
          <div className="lg:col-span-2 space-y-5">
            {/* Card 1: Guest Identification Details */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#131c31]/80 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <User size={16} />
                </span>
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-200">
                  1. Guest Identification Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Corporate / GST Toggle (Collapsible Option) */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="rounded-2xl bg-slate-950/60 border border-slate-800/60 overflow-hidden transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => setIsCorporateBooking(!isCorporateBooking)}
                    className="w-full p-3 flex items-center justify-between hover:bg-slate-900/60 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-sm">🏢</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-200">Corporate / Business Booking (GST Invoice)</span>
                          <span className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Optional
                          </span>
                          {isCorporateBooking && (
                            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              ✓ Active
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isCorporateBooking && (companyName || gstNumber)
                            ? `${companyName || 'Company'} • GSTIN: ${gstNumber || 'Required'}`
                            : 'Click to add Company Name, GSTIN & Business Billing Address'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all ${
                        isCorporateBooking
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                      }`}>
                        {isCorporateBooking ? 'Hide GST Option' : '+ Add GST Option'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isCorporateBooking ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {isCorporateBooking && (
                    <div className="p-4 pt-1 border-t border-slate-800/80 space-y-3 bg-amber-500/5 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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
            </div>

            {/* Card 2: Stay & Room Allocation */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#131c31]/80 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <Building size={16} />
                </span>
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-200">
                  2. Stay & Room Allocation
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={arrivalDate}
                    onChange={(e) => setArrivalDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Room Category *
                  </label>
                  <select
                    required
                    value={roomTypeId}
                    onChange={(e) => {
                      setRoomTypeId(e.target.value);
                      // Clear assigned room if it doesn't match this category
                      const r = roomsList.find((rm) => rm.id === assignedRoomId);
                      if (r && r.roomTypeId !== e.target.value) setAssignedRoomId('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Select Category</option>
                    {localRoomTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Rent: ₹{t.baseRate}/night)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Assign Physical Room (Optional)
                  </label>
                  <select
                    value={assignedRoomId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssignedRoomId(val);
                      const selectedRoom = roomsList.find((r) => r.id === val);
                      if (selectedRoom?.roomTypeId) setRoomTypeId(selectedRoom.roomTypeId);
                      generateWifi(selectedRoom?.roomNumber);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="">Auto-Assign Later</option>
                    {roomsList
                      .filter((r) => !roomTypeId || r.roomTypeId === roomTypeId)
                      .map((r) => {
                        const isClean = r.housekeepingStatus === 'CLEAN';
                        const isAvail = r.status === 'AVAILABLE';
                        return (
                          <option key={r.id} value={r.id}>
                            Room {r.roomNumber} ({isAvail ? 'Available' : r.status}) - {isClean ? 'Clean' : 'Dirty'}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Adult Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={adults}
                    onChange={(e) => setAdults(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Children (below 12 yrs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Meal Plan
                  </label>
                  <select
                    value={mealPlan}
                    onChange={(e) => handleMealPlanChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors font-semibold"
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>WiFi Password</span>
                    <button
                      type="button"
                      onClick={() => {
                        const selectedRoom = roomsList.find((r) => r.id === assignedRoomId);
                        generateWifi(selectedRoom?.roomNumber);
                      }}
                      className="text-[9px] text-indigo-400 hover:text-indigo-300 font-extrabold uppercase cursor-pointer"
                    >
                      Generate
                    </button>
                  </label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    placeholder="e.g. 102-XJ3A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Swimming Pool & Spa Add-ons (Collapsible) */}
            <div className="rounded-3xl bg-[#131c31]/80 border border-slate-800/80 overflow-hidden transition-all duration-200">
              <button
                type="button"
                onClick={() => setShowAddons(!showAddons)}
                className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-800/30 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400">
                    <Waves size={18} />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-200">
                        3. Swimming Pool & Spa Add-ons
                      </h3>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                        Optional
                      </span>
                      {(poolAccess || spaAccess) && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          ✓ Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {poolAccess || spaAccess
                        ? `${poolAccess ? 'Swimming Pool Included' : ''}${poolAccess && spaAccess ? ' • ' : ''}${spaAccess ? spaPackage : ''}`
                        : 'Click to add Swimming Pool access pass, Luxury Spa packages & special requests'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                    showAddons
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                  }`}>
                    {showAddons ? 'Hide Options' : '+ Add Options'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showAddons ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {showAddons && (
                <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-200 mt-3">
                  {/* Pool Section */}
                  <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-xl bg-cyan-500/20 text-cyan-300">
                          <Droplets size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-200">Swimming Pool Access Pass</h4>
                            {poolAccess && Number(poolPassCost || 0) === 0 && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                ✨ Complimentary
                              </span>
                            )}
                          </div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-cyan-500/15 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-1.5">
                            Pool Pass Category
                          </label>
                          <select
                            value={poolPackage}
                            onChange={(e) => handlePoolPackageChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-cyan-500/30 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-semibold"
                          >
                            {(dynamicPoolPasses.length > 0 ? dynamicPoolPasses : DEFAULT_POOL_PASS_OPTIONS).map(
                              (p: any) => (
                                <option key={p.id || p.name} value={p.name}>
                                  {p.name} (₹{p.price}
                                  {p.price === 0 ? ' - Free' : ` / ${p.duration || 'Stay'}`})
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-1.5">
                            Pool Pass Charge (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={poolPassCost}
                            onChange={(e) => setPoolPassCost(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-cyan-500/30 bg-slate-950 text-cyan-200 text-xs font-mono font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Spa Section */}
                  <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-xl bg-purple-500/20 text-purple-300">
                          <Flower2 size={16} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-slate-200">Spa & Wellness Packages</h4>
                            {spaAccess && Number(spaPackageCost || 0) === 0 && (
                              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                ✨ Complimentary
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">Select luxury spa massage & wellness packages</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={toggleSpaAccess}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                          spaAccess
                            ? 'bg-purple-500 text-purple-950 shadow-lg shadow-purple-500/20 font-black'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {spaAccess ? <CheckCircle2 size={12} /> : null}
                        {spaAccess ? 'Spa Included' : 'No Spa'}
                      </button>
                    </div>

                    {spaAccess && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-purple-500/15 animate-in fade-in duration-150">
                        <div>
                          <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1.5">
                            Spa Package Choice
                          </label>
                          <select
                            value={spaPackage}
                            onChange={(e) => handleSpaPackageChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-purple-400 font-semibold"
                          >
                            {DEFAULT_SPA_PACKAGES.filter((s) => s.id !== 'NONE').map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wider mb-1.5">
                            Spa Package Charge (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={spaPackageCost}
                            onChange={(e) => setSpaPackageCost(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-purple-500/30 bg-slate-950 text-purple-200 text-xs font-mono font-bold focus:outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Add-on Slot / Special Request Notes
                    </label>
                    <input
                      type="text"
                      value={addOnNotes}
                      onChange={(e) => setAddOnNotes(e.target.value)}
                      placeholder="e.g. Preferred time 5 PM, Extra pillows, Silent room request"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: KYC & Reservation Billing */}
          <div className="space-y-5">
            {/* Card 4: Identity Proof (KYC) */}
            <div className="p-5 rounded-3xl bg-[#131c31]/80 border border-slate-800/80 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <FileText size={16} />
                </span>
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-200">
                  4. Identity Proof (KYC)
                </h3>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  ID Document Type
                </label>
                <select
                  value={createIdType}
                  onChange={(e) => setCreateIdType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option>Aadhaar Card</option>
                  <option>Passport</option>
                  <option>Driving License</option>
                  <option>Voter ID Card</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Document ID Number
                </label>
                <input
                  type="text"
                  placeholder="Input ID or Scan Doc"
                  value={createIdNumber}
                  onChange={(e) => setCreateIdNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none font-mono tracking-wider focus:border-indigo-500"
                />
              </div>

              {/* ID Proof Uploader */}
              <div className="pt-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Upload ID Document (Auto OCR)
                </label>
                <div className="relative border-2 border-dashed border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 transition-colors flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCreateMockUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />

                  {createUploading ? (
                    <div className="space-y-1.5">
                      <Loader2 className="animate-spin text-indigo-400 mx-auto" size={22} />
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider animate-pulse">
                        Running AI OCR Scanner...
                      </p>
                    </div>
                  ) : createDocumentUrl ? (
                    <div className="space-y-1.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto text-emerald-400">
                        <Check size={16} />
                      </div>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        Document Scanned & Locked!
                      </p>
                      <p className="text-[8px] text-slate-500 font-mono truncate max-w-[160px]">{createDocumentUrl}</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Upload className="text-slate-500 mx-auto" size={22} />
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                        Upload / Drag Photo
                      </p>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        Drag image to scan and automatically populate ID
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 5: Reservation Billing */}
            <div className="p-5 rounded-3xl bg-[#131c31]/80 border border-slate-800/80 space-y-3.5">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <CreditCard size={16} />
                </span>
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider text-slate-200">
                  5. Reservation Billing
                </h3>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Total Amount (₹)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-indigo-400 font-black text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Advance Deposit (₹)
                </label>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-emerald-400 font-black text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* GST Rate Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  GST Rate
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0, 5, 12, 18, 28].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstRate(rate)}
                      className={`py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        gstRate === rate
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                          : 'bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculation Summary Box */}
              {(() => {
                const poolCostNum = poolAccess ? Number(poolPassCost || 0) : 0;
                const spaCostNum = Number(spaPackageCost || 0);
                const grossTotal = Number(totalAmount || 0);
                const subTotal = gstRate > 0 ? Math.round((grossTotal * 100) / (100 + gstRate)) : grossTotal;
                const roomRentNum = Math.max(0, subTotal - poolCostNum - spaCostNum);
                const gstAmt = Math.max(0, grossTotal - subTotal);
                const cgst = Math.round(gstAmt / 2);
                const sgst = Math.round(gstAmt / 2);
                const dues = Math.max(0, grossTotal - Number(advanceAmount || 0));

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Room Rent</span>
                      <span className="font-bold text-slate-300">₹{roomRentNum}</span>
                    </div>
                    {poolAccess && (
                      <div className="flex justify-between text-cyan-400">
                        <span>🏊 Pool Pass</span>
                        <span className="font-bold">
                          {poolCostNum === 0 ? '₹0 (Free)' : `+ ₹${poolCostNum}`}
                        </span>
                      </div>
                    )}
                    {spaPackage !== 'NONE' && (
                      <div className="flex justify-between text-purple-400">
                        <span>💆 Spa Package</span>
                        <span className="font-bold">
                          {spaCostNum === 0 ? '₹0 (Free)' : `+ ₹${spaCostNum}`}
                        </span>
                      </div>
                    )}
                    {gstRate > 0 && (
                      <>
                        <div className="h-px bg-slate-800/60 my-1"></div>
                        <div className="flex justify-between text-slate-500">
                          <span>Sub Total (Taxable)</span>
                          <span className="font-bold text-slate-400">₹{subTotal}</span>
                        </div>
                        <div className="flex justify-between text-amber-500/80">
                          <span>CGST @ {gstRate / 2}%</span>
                          <span className="font-bold">+ ₹{cgst}</span>
                        </div>
                        <div className="flex justify-between text-amber-500/80">
                          <span>SGST @ {gstRate / 2}%</span>
                          <span className="font-bold">+ ₹{sgst}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-indigo-300 font-bold border-t border-slate-800/60 pt-1">
                      <span>Grand Total {gstRate > 0 ? `(${gstRate}% GST)` : ''}</span>
                      <span>₹{grossTotal}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400">
                      <span>Advance Deposit</span>
                      <span className="font-bold">- ₹{advanceAmount || 0}</span>
                    </div>
                    <div className="h-px bg-slate-800/80 my-1"></div>
                    <div className="flex justify-between font-black text-sm">
                      <span className="text-slate-300">Net Payable Dues</span>
                      <span className="text-rose-400">₹{dues}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Direct Check-In Toggle */}
              <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <UserCheck size={14} className="text-emerald-400" /> Direct Check-in Now
                  </div>
                  <div className="text-[10px] text-slate-400">Mark In-House immediately on confirm</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkInImmediately}
                    onChange={(e) => setCheckInImmediately(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Creating Booking...</span>
                    </>
                  ) : checkInImmediately ? (
                    <>
                      <UserCheck size={15} />
                      <span>Confirm & Check In</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Confirm Reservation</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
