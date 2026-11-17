'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Phone,
  MessageSquare,
  KeyRound,
  UtensilsCrossed,
  Sparkles,
  Wifi,
  Copy,
  Check,
  AlertTriangle,
  Bell,
  Clock,
  ShieldCheck,
  Building2,
  ChevronRight,
  ArrowRight,
  UserCheck,
  DoorOpen,
  PhoneCall,
  BedDouble,
  Droplets,
  PackageCheck,
  Radio,
  Loader2,
  Volume2,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface PropertyData {
  id: string;
  name: string;
  code: string;
  address: string;
  frontDeskPhone: string;
  emergencyPhone: string;
  whatsappNumber: string;
  wifiName: string;
  wifiPassword: string;
}

interface RoomData {
  id: string;
  roomNumber: string;
  floor: string;
  status: string;
  housekeepingStatus: string;
  isDND: boolean;
  roomTypeName: string;
}

interface GuestData {
  name: string | null;
  mobile: string | null;
  expectedCheckout?: string;
}

export default function RoomDoorPortalPage() {
  const params = useParams();
  const router = useRouter();

  const propertyCode = (params?.propertyCode as string) || '';
  const roomNumber = (params?.roomNumber as string) || '';

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [room, setRoom] = useState<RoomData | null>(null);
  const [guest, setGuest] = useState<GuestData | null>(null);

  // Key Assistance Modal / State
  const [selectedKeyReason, setSelectedKeyReason] = useState('Left Key Inside Room');
  const [customKeyNotes, setCustomKeyNotes] = useState('');
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestPhoneInput, setGuestPhoneInput] = useState('');
  const [submittingKeyHelp, setSubmittingKeyHelp] = useState(false);
  const [keyHelpSent, setKeyHelpSent] = useState(false);

  // Housekeeping / Quick service request state
  const [submittingService, setSubmittingService] = useState<string | null>(null);
  const [serviceSuccess, setServiceSuccess] = useState<string | null>(null);

  // Callback request state
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [callbackPhone, setCallbackPhone] = useState('');
  const [submittingCallback, setSubmittingCallback] = useState(false);
  const [callbackSent, setCallbackSent] = useState(false);

  // Wi-Fi copied state
  const [wifiCopied, setWifiCopied] = useState(false);

  // Fetch Room & Property Info
  useEffect(() => {
    async function loadInfo() {
      if (!roomNumber) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/room-door/info?propertyCode=${encodeURIComponent(propertyCode)}&room=${encodeURIComponent(roomNumber)}`);
        const data = await res.json();
        if (data.success) {
          setProperty(data.property);
          setRoom(data.room);
          setGuest(data.guest);
          if (data.guest?.name) {
            setGuestNameInput(data.guest.name);
          }
        } else {
          toast.error(data.message || 'Room details not found.');
        }
      } catch (err) {
        console.error('Failed to load room door info:', err);
        toast.error('Unable to connect to Hotel Front Desk.');
      } finally {
        setLoading(false);
      }
    }
    loadInfo();
  }, [propertyCode, roomNumber]);

  // Copy Wi-Fi password
  const handleCopyWifi = () => {
    if (!property?.wifiPassword) return;
    navigator.clipboard.writeText(property.wifiPassword);
    setWifiCopied(true);
    toast.success('Wi-Fi Password copied to clipboard!');
    setTimeout(() => setWifiCopied(false), 2500);
  };

  // Submit Key Assistance / Locked Out Help
  const handleSendKeyHelp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!room?.roomNumber) return;

    setSubmittingKeyHelp(true);
    try {
      const res = await fetch('/api/room-door/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode: property?.code || propertyCode,
          propertyId: property?.id,
          roomNumber: room.roomNumber,
          roomId: room.id,
          type: selectedKeyReason === 'Left Key Inside Room' ? 'LOCKED_OUT' : 'KEY_ASSISTANCE',
          reason: selectedKeyReason,
          notes: customKeyNotes,
          guestName: guestNameInput.trim() || guest?.name || 'Guest',
          guestPhone: guestPhoneInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setKeyHelpSent(true);
        toast.success('Help is on the way! Reception has been alerted.');
      } else {
        toast.error(data.message || 'Could not send alert. Please call reception directly.');
      }
    } catch {
      toast.error('Network error. Please call the reception number directly.');
    } finally {
      setSubmittingKeyHelp(false);
    }
  };

  // Submit Callback request
  const handleSendCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackPhone.trim()) {
      toast.error('Please enter your phone number.');
      return;
    }

    setSubmittingCallback(true);
    try {
      const res = await fetch('/api/room-door/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode: property?.code || propertyCode,
          propertyId: property?.id,
          roomNumber: room?.roomNumber || roomNumber,
          type: 'CALL_RECEPTION',
          guestPhone: callbackPhone.trim(),
          guestName: guestNameInput.trim() || guest?.name || 'Guest',
          notes: 'Guest requested an immediate phone call at room door',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCallbackSent(true);
        toast.success(`Front Desk will call ${callbackPhone} right away!`);
        setTimeout(() => setShowCallbackModal(false), 2000);
      } else {
        toast.error(data.message || 'Failed to submit callback request.');
      }
    } catch {
      toast.error('Network error. Please call reception directly.');
    } finally {
      setSubmittingCallback(false);
    }
  };

  // Submit Quick Housekeeping / Amenities Request
  const handleQuickService = async (serviceName: string) => {
    if (!room?.roomNumber) return;
    setSubmittingService(serviceName);
    try {
      const res = await fetch('/api/room-door/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode: property?.code || propertyCode,
          propertyId: property?.id,
          roomNumber: room.roomNumber,
          type: 'HOUSEKEEPING',
          reason: serviceName,
          guestName: guest?.name || 'Guest',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setServiceSuccess(serviceName);
        toast.success(`${serviceName} request dispatched to Housekeeping!`);
        setTimeout(() => setServiceSuccess(null), 4000);
      }
    } catch {
      toast.error('Failed to send service request.');
    } finally {
      setSubmittingService(null);
    }
  };

  // Clean phone numbers for tel & WhatsApp
  const phoneRaw = property?.frontDeskPhone || '+919876543210';
  const cleanPhone = phoneRaw.replace(/[^0-9]/g, '');
  const displayPhone = property?.frontDeskPhone || '+91 98765 43210';

  const whatsappMessage = encodeURIComponent(
    `Hello Reception, I am outside Room ${room?.roomNumber || roomNumber} at ${property?.name || 'the hotel'}. I need assistance.`
  );
  const whatsappUrl = `https://wa.me/${property?.whatsappNumber || cleanPhone}?text=${whatsappMessage}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 mb-4 animate-bounce">
          <DoorOpen size={28} />
        </div>
        <p className="text-base font-black text-slate-100">Connecting to Room Door Concierge...</p>
        <p className="text-xs text-slate-400 mt-1">Room {roomNumber}</p>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <div className="min-h-screen bg-[#060a13] text-slate-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
        {/* ── TOP LUXURY HOTEL BRANDING STRIP ── */}
        <header className="px-4 py-3.5 bg-[#0a0f1d] border-b border-slate-800/80 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md shadow-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 shrink-0">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs font-black text-white tracking-wide uppercase truncate">
                {property?.name || 'Hotel & Luxury Suites'}
              </h1>
              <p className="text-[10.5px] text-amber-400 flex items-center gap-1 font-semibold truncate">
                <Sparkles size={11} className="shrink-0" />
                <span>Verified Stay Concierge</span>
              </p>
            </div>
          </div>

          {/* Direct Call Button (Top Right) */}
          <a
            href={`tel:${displayPhone}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 active:scale-95 transition-all shrink-0"
          >
            <Phone size={13} />
            <span>Call Desk</span>
          </a>
        </header>

        {/* ── MAIN CONTENT CONTAINER ── */}
        <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
          {/* ── HERO ROOM IDENTITY CARD ── */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-[#0e1629] via-[#0b1222] to-[#070c17] border border-indigo-500/35 shadow-2xl relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Outside Room Door
                </div>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  ROOM {room?.roomNumber || roomNumber}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  {room?.floor ? `${room.floor} Floor` : 'Guest Floor'} • {room?.roomTypeName || 'Deluxe Room'}
                </p>
              </div>

              {/* Status Badge */}
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  Stay Active
                </span>
                {guest?.name && (
                  <p className="text-[11px] text-slate-300 mt-1 font-semibold truncate max-w-[130px]">
                    Welcome, {guest.name}
                  </p>
                )}
              </div>
            </div>

            {/* Quick 1-Tap Action Ribbon */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-800/80">
              <a
                href={`tel:${displayPhone}`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition shadow-lg shadow-emerald-600/25 active:scale-95"
              >
                <PhoneCall size={15} />
                <span>Call Reception</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#128c7e] hover:bg-[#075e54] text-white font-black text-xs transition shadow-lg shadow-[#128c7e]/25 active:scale-95"
              >
                <MessageSquare size={15} />
                <span>WhatsApp Desk</span>
              </a>
            </div>
          </div>

          {/* ── HERO 2: LOCKED OUT / KEYCARD ASSISTANCE (CORE USER REQUEST) ── */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-950/40 via-[#181108]/90 to-[#0e1629] border border-amber-500/40 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/20 shrink-0">
                <KeyRound size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-white uppercase tracking-wide">
                  Locked Out or Need a Room Key?
                </h3>
                <p className="text-[11px] text-amber-300/80 font-medium">
                  Tap your issue below. Reception staff will be dispatched to your door.
                </p>
              </div>
            </div>

            {keyHelpSent ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mx-auto">
                  <Check size={24} strokeWidth={3} />
                </div>
                <h4 className="text-sm font-black text-white">Staff Member Dispatched!</h4>
                <p className="text-xs text-emerald-300">
                  Front Desk has been alerted. A team member with a master key is heading to <span className="font-bold text-white">Room {room?.roomNumber || roomNumber}</span> right now.
                </p>
                <button
                  onClick={() => setKeyHelpSent(false)}
                  className="mt-2 text-[11px] text-slate-400 underline hover:text-white"
                >
                  Send another request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendKeyHelp} className="space-y-3">
                {/* 1-Tap Situation Chips */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Left Key Inside Room', label: '🚪 Key Left Inside', icon: '🚪' },
                    { id: 'Keycard Not Working / Red Light', label: '💳 Keycard Not Working', icon: '💳' },
                    { id: 'Lost Physical Keycard', label: '🔑 Lost Keycard', icon: '🔑' },
                    { id: 'Need Extra Duplicate Key', label: '➕ Need 2nd Key', icon: '➕' },
                  ].map((chip) => {
                    const isSelected = selectedKeyReason === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setSelectedKeyReason(chip.id)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border flex items-center gap-2 ${
                          isSelected
                            ? 'bg-amber-500/25 border-amber-400 text-white shadow-md shadow-amber-500/20'
                            : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-sm">{chip.icon}</span>
                        <span className="truncate">{chip.label.replace(/^[^\s]+\s/, '')}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Optional Guest Name & Phone */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="h-9 px-3 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                  <input
                    type="tel"
                    value={guestPhoneInput}
                    onChange={(e) => setGuestPhoneInput(e.target.value)}
                    placeholder="Phone No. for Callback"
                    className="h-9 px-3 text-xs bg-slate-900/90 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                {/* Big Submit Button */}
                <button
                  type="submit"
                  disabled={submittingKeyHelp}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
                >
                  {submittingKeyHelp ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-slate-950" />
                      <span>Alerting Front Desk...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      <span>Send Master Key Assistance to Room {room?.roomNumber || roomNumber}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* ── SECTION 3: IN-ROOM DINING & FOOD SERVICE ── */}
          <div className="p-4 rounded-3xl bg-[#0b1222] border border-slate-800/90 shadow-xl flex items-center justify-between gap-3 group">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                <UtensilsCrossed size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-black text-white uppercase tracking-wider truncate">
                  In-Room Dining &amp; Food Menu
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  Order meals, snacks &amp; beverages to Room {room?.roomNumber || roomNumber}
                </p>
              </div>
            </div>

            <Link
              href={`/room-portal?room=${encodeURIComponent(room?.roomNumber || roomNumber)}&propertyCode=${encodeURIComponent(property?.code || propertyCode)}`}
              className="h-9 px-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-orange-600/30 active:scale-95 transition-all shrink-0"
            >
              <span>Menu</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* ── SECTION 4: 1-TAP HOUSEKEEPING & ROOM AMENITIES ── */}
          <div className="p-4 rounded-3xl bg-[#0b1222] border border-slate-800/90 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  Quick Housekeeping &amp; Amenities
                </h3>
              </div>
              <span className="text-[10px] text-slate-500 font-bold">1-Tap Request</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { name: '💧 Extra Mineral Water', label: 'Extra Water Bottles' },
                { name: '🧴 Fresh Bath Towels', label: 'Fresh Towels' },
                { name: '🧹 Clean Room Now', label: 'Clean Room Now' },
                { name: '🧳 Luggage / Bellboy', label: 'Bellboy Assistance' },
              ].map((item) => {
                const isPending = submittingService === item.name;
                const isDone = serviceSuccess === item.name;

                return (
                  <button
                    key={item.name}
                    onClick={() => handleQuickService(item.name)}
                    disabled={Boolean(submittingService)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                      isDone
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/40 text-slate-200'
                    }`}
                  >
                    <span className="truncate">{item.label}</span>
                    {isPending ? (
                      <Loader2 size={13} className="animate-spin text-cyan-400 shrink-0" />
                    ) : isDone ? (
                      <Check size={13} className="text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronRight size={13} className="text-slate-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── SECTION 5: IN-ROOM WI-FI ACCESS CARD ── */}
          <div className="p-4 rounded-3xl bg-gradient-to-r from-indigo-950/40 via-[#0e1629] to-[#0b1222] border border-indigo-500/30 shadow-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <Wifi size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Hotel High-Speed Wi-Fi
                </h4>
                <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                  SSID: <span className="font-bold text-white">{property?.wifiName || 'Hotel-WiFi'}</span>
                </p>
                <p className="text-[11px] text-indigo-300 font-bold truncate">
                  Pass: {property?.wifiPassword || 'Welcome123'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCopyWifi}
              className="h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95 transition-all shrink-0"
            >
              {wifiCopied ? <Check size={13} /> : <Copy size={13} />}
              <span>{wifiCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* ── SECTION 6: RECEPTION HELPLINE & EMERGENCY DESK ── */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
              <Phone size={13} className="text-indigo-400" />
              <span>Front Desk 24x7:</span>
              <a href={`tel:${displayPhone}`} className="text-indigo-400 underline font-black">
                {displayPhone}
              </a>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => setShowCallbackModal(true)}
                className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <Bell size={12} />
                <span>Request Phone Callback</span>
              </button>
              <span className="text-slate-700">•</span>
              <a
                href={`tel:${property?.emergencyPhone || displayPhone}`}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <AlertTriangle size={12} />
                <span>Emergency SOS</span>
              </a>
            </div>
          </div>
        </main>

        {/* ── FOOTER ── */}
        <footer className="p-4 text-center text-[10px] text-slate-500 border-t border-slate-800/60 bg-[#060a13]">
          <p>© {property?.name || 'Hotel PMS'}. Instant Door Concierge Powered by GustFlow.</p>
        </footer>

        {/* ── CALLBACK MODAL ── */}
        {showCallbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="bg-[#0e1629] border border-slate-700 rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <PhoneCall size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Request Phone Callback</h3>
                  <p className="text-[11px] text-slate-400">Room {room?.roomNumber || roomNumber} Door</p>
                </div>
              </div>

              {callbackSent ? (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-300 font-bold">
                  ✅ Callback request sent! Reception will call you in a moment.
                </div>
              ) : (
                <form onSubmit={handleSendCallback} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Your Mobile Number:
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCallbackModal(false)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingCallback}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30"
                    >
                      {submittingCallback ? <Loader2 size={13} className="animate-spin" /> : <Phone size={13} />}
                      <span>Call Me Now</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
