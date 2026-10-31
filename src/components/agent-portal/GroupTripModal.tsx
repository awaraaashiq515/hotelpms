'use client';

import React, { useState } from 'react';
import {
  X, Users, Calendar, Phone, User, CheckCircle2,
  Trash2, Plus, Sparkles, Building2, MapPin, Bus, Car,
  FileText, Upload, Send, Loader2, IndianRupee, ShieldCheck,
  ChevronRight, ChevronLeft, CreditCard, Bed, Utensils,
  Clock, Download, Printer, Eye
} from 'lucide-react';
import { toast } from 'sonner';

export interface GroupMember {
  id: string;
  name: string;
  age: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  idType: 'AADHAAR' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENSE';
  idNumber: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  roomAllocated: string;
  mealPreference: 'VEG' | 'JAIN' | 'NON_VEG';
  phone?: string;
}

export interface DayItinerary {
  day: number;
  title: string;
  activities: string;
}

interface GroupTripModalProps {
  agent: any;
  selectedHotel: any;
  onClose: () => void;
  onSuccess: (bookingData: any) => void;
}

export default function GroupTripModal({
  agent,
  selectedHotel,
  onClose,
  onSuccess,
}: GroupTripModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [submitting, setSubmitting] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const [waSentSuccess, setWaSentSuccess] = useState(false);

  // ── Step 1: Trip & Stay Details ──────────────────────────────────────────
  const [groupName, setGroupName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [leaderPhone, setLeaderPhone] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [roomQuantities, setRoomQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    if (selectedHotel?.roomTypes && selectedHotel.roomTypes.length > 0) {
      init[selectedHotel.roomTypes[0].name] = 2; // Default 2 rooms
    }
    return init;
  });
  const [mealPlan, setMealPlan] = useState<'EP' | 'CP' | 'MAP' | 'AP'>('MAP');
  const [mealRatePerPerson, setMealRatePerPerson] = useState<number>(450); // Daily per person meal rate

  // ── Step 2: Passenger Roster (Members & ID Proofs) ────────────────────────
  const [members, setMembers] = useState<GroupMember[]>([
    {
      id: 'mem_1',
      name: '',
      age: '30',
      gender: 'MALE',
      idType: 'AADHAAR',
      idNumber: '',
      roomAllocated: 'Room 1',
      mealPreference: 'VEG',
      phone: '',
    },
    {
      id: 'mem_2',
      name: '',
      age: '28',
      gender: 'FEMALE',
      idType: 'AADHAAR',
      idNumber: '',
      roomAllocated: 'Room 1',
      mealPreference: 'VEG',
      phone: '',
    },
  ]);

  // ── Step 3: Optional Trip Details & Itinerary ─────────────────────────────
  const [includeItinerary, setIncludeItinerary] = useState(false);
  const [vehicleType, setVehicleType] = useState('Tempo Traveller (16 Seater)');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [itineraryDays, setItineraryDays] = useState<DayItinerary[]>([
    { day: 1, title: 'Arrival & Welcome Dinner', activities: 'Hotel check-in, orientation, dinner at in-house restaurant' },
    { day: 2, title: 'Local Sightseeing & Excursion', activities: 'Guided local tour, sightseeing spots, and cultural experience' },
  ]);
  const [tripNotes, setTripNotes] = useState('');

  // ── Helper Calculations ──────────────────────────────────────────────────
  const calcNights = () => {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn).getTime();
    const d2 = new Date(checkOut).getTime();
    return Math.max(1, Math.round((d2 - d1) / 86400000));
  };

  const nights = calcNights();
  const totalRooms = Object.values(roomQuantities).reduce((a, b) => a + b, 0);

  // Total Rooms Cost
  let roomsCost = 0;
  Object.entries(roomQuantities).forEach(([rtName, qty]) => {
    const rt = selectedHotel?.roomTypes?.find((r: any) => r.name === rtName);
    const rate = rt ? rt.baseRate : 2500;
    roomsCost += rate * qty * nights;
  });

  // Total Meals Cost
  const totalPax = members.length;
  const mealsCost = mealPlan === 'EP' ? 0 : totalPax * mealRatePerPerson * nights;

  // Subtotal & Grand Total
  const subtotal = roomsCost + mealsCost;
  const taxAmount = Math.round(subtotal * 0.12); // 12% GST
  const grandTotal = subtotal + taxAmount;

  // Agent Commission
  const commRate = (selectedHotel as any)?.commissionRate ?? agent?.commissionRate ?? 10;
  const commissionAmount = Math.round((grandTotal * commRate) / 100);
  const netPayable = grandTotal - commissionAmount;

  // ── Member Operations ────────────────────────────────────────────────────
  const addMember = () => {
    const nextId = `mem_${Date.now()}_${members.length + 1}`;
    const roomNum = Math.ceil((members.length + 1) / 2);
    setMembers((prev) => [
      ...prev,
      {
        id: nextId,
        name: '',
        age: '25',
        gender: 'MALE',
        idType: 'AADHAAR',
        idNumber: '',
        roomAllocated: `Room ${roomNum}`,
        mealPreference: 'VEG',
        phone: '',
      },
    ]);
  };

  const updateMember = (id: string, field: keyof GroupMember, value: any) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const removeMember = (id: string) => {
    if (members.length <= 1) {
      toast.error('A group trip must have at least 1 member.');
      return;
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleFileUpload = async (memberId: string, side: 'front' | 'back', file: File) => {
    try {
      toast.loading(`Uploading ${side} ID document...`, { id: 'upload' });
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/agent-portal/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        toast.success(`${side === 'front' ? 'Front' : 'Back'} ID uploaded!`, { id: 'upload' });
        updateMember(memberId, side === 'front' ? 'idFrontUrl' : 'idBackUrl', data.url);
      } else {
        toast.error('Upload failed.', { id: 'upload' });
      }
    } catch {
      toast.error('Error uploading document.', { id: 'upload' });
    }
  };

  // ── Itinerary Operations ─────────────────────────────────────────────────
  const addItineraryDay = () => {
    const nextDay = itineraryDays.length + 1;
    setItineraryDays((prev) => [
      ...prev,
      { day: nextDay, title: `Day ${nextDay} Activity`, activities: 'Sightseeing, meals, and leisure time' },
    ]);
  };

  const updateItineraryDay = (dayNum: number, field: 'title' | 'activities', val: string) => {
    setItineraryDays((prev) =>
      prev.map((d) => (d.day === dayNum ? { ...d, [field]: val } : d))
    );
  };

  const removeItineraryDay = (dayNum: number) => {
    setItineraryDays((prev) => prev.filter((d) => d.day !== dayNum));
  };

  // ── Send WhatsApp Master Bill to Agent ────────────────────────────────────
  const handleSendWhatsAppInvoice = async () => {
    if (!agent?.phone) {
      toast.error('Agent WhatsApp phone number not found.');
      return;
    }
    setSendingWa(true);
    try {
      const activeEntries = Object.entries(roomQuantities).filter(([_, q]) => q > 0);
      const roomSummaryStr = activeEntries.map(([name, qty]) => `${qty}x ${name}`).join(', ');

      const res = await fetch('/api/agent-portal/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentPhone: agent.phone,
          agentName: agent.name,
          companyName: agent.companyName,
          agentCode: agent.agentCode,
          hotelName: selectedHotel.name,
          groupName,
          totalPax,
          checkIn,
          checkOut,
          roomsSummary: `${roomSummaryStr} (${nights} Nights)`,
          mealPlan: `${mealPlan} Plan (${totalPax} Pax)`,
          grandTotal,
          commission: commissionAmount,
          netPayable,
          propertyId: selectedHotel.id,
          itinerarySummary: includeItinerary ? `${itineraryDays.length} Days Schedule Included` : undefined,
          transportSummary: includeItinerary && vehicleNumber ? `${vehicleType} (${vehicleNumber})` : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setWaSentSuccess(true);
        toast.success(`✅ Master Bill dispatched to Agent WhatsApp (+${agent.phone.slice(-10)})!`);
      } else {
        toast.error(data.message || 'Failed to dispatch WhatsApp bill.');
      }
    } catch {
      toast.error('Network error dispatching WhatsApp bill.');
    } finally {
      setSendingWa(false);
    }
  };

  // ── Final Submit ─────────────────────────────────────────────────────────
  const handleSubmitBooking = async () => {
    if (!groupName || !leaderName || !checkIn || !checkOut) {
      toast.error('Please complete all required trip details in Step 1.');
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const activeEntries = Object.entries(roomQuantities).filter(([_, q]) => q > 0);
      const roomLabel = activeEntries.map(([name, qty]) => `${qty}x ${name}`).join(', ') + ` (${totalRooms} Rooms)`;

      // Structured Group Trip Payload
      const groupTripData = {
        isGroupTrip: true,
        groupName,
        leaderName,
        leaderPhone,
        totalPax,
        members,
        includeItinerary,
        transport: includeItinerary
          ? { vehicleType, vehicleNumber, driverName, driverPhone }
          : null,
        itinerary: includeItinerary ? itineraryDays : [],
        tripNotes,
        mealPlan,
        billing: {
          roomsCost,
          mealsCost,
          taxAmount,
          grandTotal,
          commRate,
          commissionAmount,
          netPayable,
        },
      };

      const groupTripTag = `[GROUP_TRIP_DATA: ${JSON.stringify(groupTripData)}]`;
      const notesWithPayload = `${tripNotes ? tripNotes + '\n' : ''}${groupTripTag}`;

      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          propertyId: selectedHotel.id,
          guestName: `${groupName} (Tour: ${leaderName})`,
          guestPhone: leaderPhone || agent.phone,
          guestNationality: 'Indian',
          adults: totalPax,
          children: 0,
          checkIn,
          checkOut,
          roomType: roomLabel,
          totalAmount: grandTotal,
          notes: notesWithPayload,
          specialRequests: `Group Tour (${totalPax} Pax) - ${mealPlan} Plan. Billed to Agent ${agent.name} (${agent.agentCode}).`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Group Trip successfully booked! Master Bill generated.');
        // Optionally auto-dispatch WhatsApp bill
        handleSendWhatsAppInvoice().catch(() => {});
        onSuccess(data.data);
        onClose();
      } else {
        toast.error(data.message || 'Failed to submit group booking.');
      }
    } catch {
      toast.error('Error submitting group booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#080d1a] border border-slate-700/70 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0b1329] border-b border-slate-800 p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white">Group Trip & Tour Booking</h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Agent Master Billing
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hotel: <span className="text-white font-bold">{selectedHotel?.name}</span> • Agent Commission:{' '}
                <span className="text-emerald-400 font-bold">{commRate}%</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-[#050a14] border-b border-slate-800/80 px-6 py-3 flex items-center justify-between shrink-0 overflow-x-auto text-xs">
          {[
            { num: 1, label: '1. Trip & Rooms' },
            { num: 2, label: `2. Member Roster (${members.length} Pax)` },
            { num: 3, label: '3. Itinerary & Transport' },
            { num: 4, label: '4. Agent Master Bill' },
          ].map((st) => (
            <button
              key={st.num}
              onClick={() => setStep(st.num as any)}
              className={`flex items-center gap-2 font-black transition-colors py-1 px-2.5 rounded-xl ${
                step === st.num
                  ? 'bg-violet-600 text-white shadow-md'
                  : step > st.num
                  ? 'text-emerald-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                  step === st.num
                    ? 'bg-white text-violet-700'
                    : step > st.num
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {step > st.num ? '✓' : st.num}
              </span>
              <span>{st.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* ──────────────── STEP 1: TRIP & ROOM CONFIGURATION ──────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-[#0a1024] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-violet-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} /> Group & Leader Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Group / Tour Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alpine Trekkers 4N/5D Tour"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#050a14] border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Tour Leader / Guide Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={leaderName}
                      onChange={(e) => setLeaderName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#050a14] border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Leader Contact Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={leaderPhone}
                      onChange={(e) => setLeaderPhone(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#050a14] border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Check-In Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#050a14] border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                      Check-Out Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-[#050a14] border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Room Categories Stepper */}
              <div className="bg-[#0a1024] border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-violet-400 uppercase tracking-wider flex items-center gap-2">
                    <Bed size={14} /> Room Categories & Quantities
                  </h3>
                  <span className="text-xs font-bold text-slate-400">
                    Total: <span className="text-white font-black">{totalRooms} Rooms</span> ({nights} Nights)
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedHotel?.roomTypes && selectedHotel.roomTypes.length > 0 ? (
                    selectedHotel.roomTypes.map((rt: any) => {
                      const qty = roomQuantities[rt.name] || 0;
                      return (
                        <div
                          key={rt.name}
                          className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            qty > 0 ? 'bg-violet-950/20 border-violet-500/40' : 'bg-[#050a14] border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">{rt.name}</span>
                              {qty > 0 && (
                                <span className="text-[10px] font-black bg-violet-600 text-white px-2 py-0.5 rounded-md">
                                  {qty} Rooms
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              ₹{rt.baseRate.toLocaleString('en-IN')}/night • Max {rt.maxOccupancy || 2} Pax/room
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                setRoomQuantities((prev) => ({
                                  ...prev,
                                  [rt.name]: Math.max(0, (prev[rt.name] || 0) - 1),
                                }))
                              }
                              disabled={qty === 0}
                              className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-black disabled:opacity-30"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-black text-white text-sm">{qty}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setRoomQuantities((prev) => ({
                                  ...prev,
                                  [rt.name]: (prev[rt.name] || 0) + 1,
                                }))
                              }
                              className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center font-black"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 bg-[#050a14] border border-slate-800 rounded-xl text-xs text-slate-400">
                      Standard rooms configuration will be applied automatically.
                    </div>
                  )}
                </div>
              </div>

              {/* Meal Plan Configuration */}
              <div className="bg-[#0a1024] border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black text-violet-400 uppercase tracking-wider flex items-center gap-2">
                  <Utensils size={14} /> Group Meal Plan (Dining Package)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: 'EP', label: 'EP (Room Only)', desc: 'No meals included' },
                    { key: 'CP', label: 'CP (Breakfast)', desc: 'Complimentary morning breakfast' },
                    { key: 'MAP', label: 'MAP (Half Board)', desc: 'Breakfast + Dinner Included' },
                    { key: 'AP', label: 'AP (Full Board)', desc: 'Breakfast + Lunch + Dinner Included' },
                  ].map((mp) => (
                    <div
                      key={mp.key}
                      onClick={() => setMealPlan(mp.key as any)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        mealPlan === mp.key
                          ? 'bg-violet-950/40 border-violet-500 text-white shadow-md'
                          : 'bg-[#050a14] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="block font-black text-xs text-white">{mp.label}</span>
                      <span className="block text-[10px] text-slate-400 mt-1 leading-snug">{mp.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!groupName || !leaderName || !checkIn || !checkOut) {
                      toast.error('Please fill Group Name, Leader Name & Dates.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="px-6 h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30"
                >
                  Next: Passenger Roster & IDs <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: MEMBER ROSTER & ID PROOFS ──────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Users size={16} className="text-violet-400" /> Passenger Manifest & KYC Verification
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Add names, ages, room assignments, and ID documents for all group travelers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addMember}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Plus size={14} /> Add Another Passenger
                </button>
              </div>

              <div className="space-y-4">
                {members.map((member, idx) => (
                  <div
                    key={member.id}
                    className="bg-[#0a1024] border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 flex items-center justify-center text-xs font-black">
                          #{idx + 1}
                        </span>
                        <span className="text-sm font-bold text-white">
                          {member.name || `Passenger ${idx + 1}`}
                        </span>
                        {member.roomAllocated && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            {member.roomAllocated}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Remove passenger"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {/* Member Details Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Amit Verma"
                          value={member.name}
                          onChange={(e) => updateMember(member.id, 'name', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={member.age}
                          onChange={(e) => updateMember(member.id, 'age', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Gender
                        </label>
                        <select
                          value={member.gender}
                          onChange={(e) => updateMember(member.id, 'gender', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-violet-500"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* ID Proof & Sharing */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          ID Proof Type
                        </label>
                        <select
                          value={member.idType}
                          onChange={(e) => updateMember(member.id, 'idType', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-violet-500"
                        >
                          <option value="AADHAAR">Aadhaar Card</option>
                          <option value="PASSPORT">Passport</option>
                          <option value="VOTER_ID">Voter ID</option>
                          <option value="DRIVING_LICENSE">Driving License</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          ID Document Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. XXXX-XXXX-1234"
                          value={member.idNumber}
                          onChange={(e) => updateMember(member.id, 'idNumber', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-violet-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Assigned Room
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Room 101"
                          value={member.roomAllocated}
                          onChange={(e) => updateMember(member.id, 'roomAllocated', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-violet-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Dietary Preference
                        </label>
                        <select
                          value={member.mealPreference}
                          onChange={(e) => updateMember(member.id, 'mealPreference', e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-violet-500"
                        >
                          <option value="VEG">Vegetarian</option>
                          <option value="JAIN">Jain Meal</option>
                          <option value="NON_VEG">Non-Vegetarian</option>
                        </select>
                      </div>
                    </div>

                    {/* ID Document Photo Upload */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        {/* Front upload */}
                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors">
                          <Upload size={12} />
                          <span>{member.idFrontUrl ? '✓ Front Uploaded' : 'Upload ID Front'}</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileUpload(member.id, 'front', f);
                            }}
                          />
                        </label>

                        {/* Back upload */}
                        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer transition-colors">
                          <Upload size={12} />
                          <span>{member.idBackUrl ? '✓ Back Uploaded' : 'Upload ID Back'}</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleFileUpload(member.id, 'back', f);
                            }}
                          />
                        </label>
                      </div>

                      {(member.idFrontUrl || member.idBackUrl) && (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> ID Proof Attached
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <ChevronLeft size={16} /> Back: Trip & Rooms
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30"
                >
                  Next: Itinerary & Transport (Optional) <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: OPTIONAL ITINERARY & TRANSPORT ─────────── */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Optional Toggle */}
              <div className="bg-[#0a1024] border border-slate-800 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Bus size={16} className="text-sky-400" /> Day-wise Itinerary & Transportation
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Optional: Include travel schedule, tour guide details, and bus/tempo numbers in the master voucher.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeItinerary((v) => !v)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all ${
                    includeItinerary
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {includeItinerary ? '✓ INCLUDED' : '+ ADD OPTIONAL'}
                </button>
              </div>

              {includeItinerary && (
                <div className="space-y-6">
                  {/* Transport Details */}
                  <div className="bg-[#0a1024] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-2">
                      <Car size={14} /> Assigned Vehicle & Driver Info
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Vehicle Type
                        </label>
                        <select
                          value={vehicleType}
                          onChange={(e) => setVehicleType(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none"
                        >
                          <option value="Tempo Traveller (16 Seater)">Tempo Traveller (16 Seater)</option>
                          <option value="Luxury Tourist Bus (35 Seater)">Luxury Tourist Bus (35 Seater)</option>
                          <option value="Volvo Coach (45 Seater)">Volvo Coach (45 Seater)</option>
                          <option value="Innova / Ertiga Fleet">Innova / Ertiga Fleet</option>
                          <option value="Self-Drive / Personal Conveyance">Self-Drive / Personal Conveyance</option>
                          <option value="Flight / Train Group Transfer">Flight / Train Group Transfer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Vehicle / Flight No.
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. DL 01 AB 9988"
                          value={vehicleNumber}
                          onChange={(e) => setVehicleNumber(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Driver / Coordinator
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Surender Singh"
                          value={driverName}
                          onChange={(e) => setDriverName(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                          Driver Mobile
                        </label>
                        <input
                          type="tel"
                          placeholder="+91 98765 11223"
                          value={driverPhone}
                          onChange={(e) => setDriverPhone(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs font-bold text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Day-by-Day Schedule */}
                  <div className="bg-[#0a1024] border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={14} /> Day-by-Day Trip Schedule
                      </h4>
                      <button
                        type="button"
                        onClick={addItineraryDay}
                        className="px-3 py-1.5 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1 hover:bg-sky-600/30"
                      >
                        <Plus size={12} /> Add Day
                      </button>
                    </div>

                    <div className="space-y-3">
                      {itineraryDays.map((item) => (
                        <div
                          key={item.day}
                          className="p-3.5 rounded-xl bg-[#050a14] border border-slate-800 flex items-start justify-between gap-3"
                        >
                          <span className="w-8 h-8 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 flex items-center justify-center font-black text-xs shrink-0 mt-1">
                            D{item.day}
                          </span>
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateItineraryDay(item.day, 'title', e.target.value)}
                              placeholder={`Day ${item.day} Title (e.g. Arrival & Bonfire)`}
                              className="w-full h-9 px-3 rounded-lg bg-[#080d1a] border border-slate-700 text-xs font-bold text-white"
                            />
                            <textarea
                              rows={2}
                              value={item.activities}
                              onChange={(e) => updateItineraryDay(item.day, 'activities', e.target.value)}
                              placeholder="Describe activities, visits, sightseeing points..."
                              className="w-full p-2.5 rounded-lg bg-[#080d1a] border border-slate-700 text-xs text-slate-300 resize-none"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItineraryDay(item.day)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div className="bg-[#0a1024] border border-slate-800 rounded-2xl p-5 space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase">
                  Additional Notes / Tour Inclusions
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Welcome drinks upon arrival, early check-in requested for 2 rooms, campfire arrangements."
                  value={tripNotes}
                  onChange={(e) => setTripNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#050a14] border border-slate-700 text-xs text-white resize-none"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <ChevronLeft size={16} /> Back: Passenger Roster
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 h-12 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30"
                >
                  Next: Review Master Bill <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 4: AGENT MASTER INVOICE & CONFIRMATION ─────── */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Official Invoice Card */}
              <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 print:m-0">
                {/* Invoice Header */}
                <div className="flex items-start justify-between border-b border-slate-200 pb-5 flex-wrap gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Official Master Tax Invoice
                    </span>
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 mt-2">
                      {selectedHotel?.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {selectedHotel?.address || selectedHotel?.city || 'Hotel Partner'}, India
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Invoice Reference</p>
                    <p className="text-sm font-mono font-black text-slate-800">
                      GRP-{Date.now().toString().slice(-6)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Billed To / Agent Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Billed To (Travel Agent):
                    </p>
                    <p className="text-sm font-black text-slate-900">{agent?.name}</p>
                    {agent?.companyName && <p className="text-xs font-bold text-slate-700">{agent.companyName}</p>}
                    <p className="text-xs text-slate-500 mt-0.5">Agent Code: <span className="font-mono font-bold text-slate-800">{agent?.agentCode}</span></p>
                    <p className="text-xs text-slate-500">Phone: {agent?.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                      Group Tour Details:
                    </p>
                    <p className="text-sm font-black text-slate-900">{groupName}</p>
                    <p className="text-xs text-slate-600">Leader: {leaderName} ({leaderPhone})</p>
                    <p className="text-xs text-slate-600">
                      Stay: <span className="font-bold">{checkIn}</span> to <span className="font-bold">{checkOut}</span> ({nights} Nights)
                    </p>
                    <p className="text-xs text-slate-600">Total Travelers: <span className="font-bold">{totalPax} Pax</span></p>
                  </div>
                </div>

                {/* Itemized Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                        <th className="py-2">Item Description</th>
                        <th className="py-2 text-center">Qty</th>
                        <th className="py-2 text-center">Nights</th>
                        <th className="py-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {Object.entries(roomQuantities)
                        .filter(([_, q]) => q > 0)
                        .map(([rtName, qty]) => {
                          const rt = selectedHotel?.roomTypes?.find((r: any) => r.name === rtName);
                          const rate = rt ? rt.baseRate : 2500;
                          return (
                            <tr key={rtName}>
                              <td className="py-3 font-bold text-slate-800">
                                {rtName} Group Accommodation
                              </td>
                              <td className="py-3 text-center">{qty}</td>
                              <td className="py-3 text-center">{nights}</td>
                              <td className="py-3 text-right font-mono font-bold">
                                ₹{(rate * qty * nights).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })}
                      {mealPlan !== 'EP' && (
                        <tr>
                          <td className="py-3 font-bold text-slate-800">
                            {mealPlan} Meal Plan Package ({totalPax} Pax)
                          </td>
                          <td className="py-3 text-center">{totalPax} Pax</td>
                          <td className="py-3 text-center">{nights}</td>
                          <td className="py-3 text-right font-mono font-bold">
                            ₹{mealsCost.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-2.5 text-slate-500">Goods & Service Tax (GST 12%)</td>
                        <td className="py-2.5 text-center" colSpan={2}>12%</td>
                        <td className="py-2.5 text-right font-mono text-slate-700">
                          ₹{taxAmount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals & Commission Breakdown */}
                <div className="border-t-2 border-slate-200 pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 font-bold">
                    <span>Total Package Cost:</span>
                    <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-600 font-bold bg-emerald-50 p-2 rounded-xl border border-emerald-100">
                    <span>Agent Commission Deducted ({commRate}%):</span>
                    <span className="font-mono">-₹{commissionAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-200 pt-2">
                    <span>Net Amount Payable by Agent:</span>
                    <span className="text-xl text-violet-700 font-mono">
                      ₹{netPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery & Action Controls */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <ChevronLeft size={16} /> Back: Itinerary
                </button>

                <div className="flex items-center gap-3 flex-wrap">
                  {/* WhatsApp Bill Dispatch */}
                  <button
                    type="button"
                    onClick={handleSendWhatsAppInvoice}
                    disabled={sendingWa}
                    className={`flex items-center gap-2 px-5 h-12 rounded-2xl text-xs font-bold transition-all shadow-md ${
                      waSentSuccess
                        ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                    }`}
                  >
                    {sendingWa ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {sendingWa
                      ? 'Sending...'
                      : waSentSuccess
                      ? '✓ Sent to Agent WhatsApp!'
                      : 'Send Bill on Agent WhatsApp'}
                  </button>

                  {/* Print / Save PDF */}
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
                  >
                    <Printer size={16} />
                    <span>Print Bill</span>
                  </button>

                  {/* Submit and Confirm Booking */}
                  <button
                    type="button"
                    onClick={handleSubmitBooking}
                    disabled={submitting}
                    className="flex items-center gap-2 px-7 h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-black shadow-xl shadow-violet-600/30 transition-all disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                    {submitting ? 'Confirming...' : 'Confirm Group Booking'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

