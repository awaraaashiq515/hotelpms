'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Crown,
  X,
  Phone,
  User,
  KeyRound,
  RefreshCw,
  Calendar,
  Loader2,
  Search,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export interface RoomOption {
  id: string;
  roomNumber: string;
  roomTypeName: string;
  roomTypeId: string;
  baseRate: number;
  status?: string;
  floor?: string;
}

interface OwnerVipBookingModalProps {
  isOpen: boolean;
  roomsList: RoomOption[];
  onClose: () => void;
  onCreated: () => void;
  initialRoomId?: string;
  initialGuestData?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    mobile?: string;
    email?: string;
  } | null;
}

function generateRandomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function OwnerVipBookingModal({
  isOpen,
  roomsList,
  onClose,
  onCreated,
  initialRoomId,
  initialGuestData,
}: OwnerVipBookingModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sort rooms: Available / Clean rooms first
  const sortedRooms = [...roomsList].sort((a, b) => {
    const aAvail = a.status === 'AVAILABLE' || a.status === 'CLEAN' ? 0 : 1;
    const bAvail = b.status === 'AVAILABLE' || b.status === 'CLEAN' ? 0 : 1;
    return aAvail - bAvail;
  });

  const defaultRoom = sortedRooms.find((r) => r.status === 'AVAILABLE' || r.status === 'CLEAN') || sortedRooms[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  // Fresh state for every modal open
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId || defaultRoom?.id || '');

  useEffect(() => {
    if (initialRoomId) {
      setSelectedRoomId(initialRoomId);
    }
  }, [initialRoomId]);

  useEffect(() => {
    if (isOpen && initialGuestData) {
      const name = initialGuestData.name || `${initialGuestData.firstName || ''} ${initialGuestData.lastName || ''}`.trim();
      setGuestName(name);
      if (initialGuestData.mobile) setMobile(initialGuestData.mobile);
      if (initialGuestData.id) {
        setSelectedExistingGuest(initialGuestData);
        setCustomerSearchQuery(name);
      }
    }
  }, [initialGuestData, isOpen]);
  const [guestName, setGuestName] = useState('');
  const [mobile, setMobile] = useState('');
  const [ownerName, setOwnerName] = useState('Hotel Owner / Management');
  const [vipPin, setVipPin] = useState(generateRandomPin());
  const [arrivalDate, setArrivalDate] = useState(todayStr);
  const [departureDate, setDepartureDate] = useState(tomorrowStr);
  const [waiveBill, setWaiveBill] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Returning guest search state
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedExistingGuest, setSelectedExistingGuest] = useState<any | null>(null);

  const handleCustomerSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      setIsSearchingCustomer(false);
      return;
    }

    setIsSearchingCustomer(true);
    fetch(`/api/hotel/guests?search=${encodeURIComponent(trimmed)}&limit=8`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setCustomerSearchResults(json.data);
          setShowCustomerDropdown(json.data.length > 0);
        } else {
          setCustomerSearchResults([]);
          setShowCustomerDropdown(false);
        }
      })
      .catch(() => {})
      .finally(() => setIsSearchingCustomer(false));
  };

  const handleSelectCustomer = (guest: any) => {
    setSelectedExistingGuest(guest);
    const fullName = `${guest.firstName} ${guest.lastName || ''}`.trim();
    setGuestName(fullName);
    setMobile(guest.mobile || '');
    setShowCustomerDropdown(false);
    setCustomerSearchQuery(`${fullName} (${guest.mobile || ''})`.trim());
    toast.success(`VIP Guest ${fullName} details auto-filled!`);
  };

  const handleClearCustomer = () => {
    setSelectedExistingGuest(null);
    setCustomerSearchQuery('');
    setCustomerSearchResults([]);
    setShowCustomerDropdown(false);
    setGuestName('');
    setMobile('');
  };

  if (!isOpen) return null;

  const selectedRoom = roomsList.find((r) => r.id === selectedRoomId) || defaultRoom;

  // Calculate nights
  const nights = Math.max(
    1,
    Math.round(
      (new Date(departureDate || arrivalDate).getTime() - new Date(arrivalDate).getTime()) /
        (1000 * 60 * 60 * 24)
    ) || 1
  );

  const baseRate = selectedRoom?.baseRate || 3500;
  const calculatedTotal = baseRate * nights;
  const finalPayable = waiveBill ? 0 : calculatedTotal;

  const handleRefreshPin = () => {
    setVipPin(generateRandomPin());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!selectedRoomId) {
      toast.error('Please select a room.');
      return;
    }
    if (!guestName.trim()) {
      toast.error('Please enter guest name.');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number.');
      return;
    }
    const cleanPin = vipPin.replace(/\D/g, '').trim();
    if (cleanPin.length !== 4) {
      toast.error('VIP Passcode must be exactly 4 digits.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedRoomId: selectedRoomId,
          roomTypeId: selectedRoom?.roomTypeId || 'default',
          guestData: {
            firstName: guestName.trim(),
            mobile: cleanMobile,
          },
          arrivalDate: new Date(arrivalDate).toISOString(),
          departureDate: new Date(departureDate).toISOString(),
          totalAmount: calculatedTotal,
          advanceAmount: waiveBill ? calculatedTotal : 0,
          isOwnerGuest: true,
          ownerVipCode: cleanPin,
          ownerName: ownerName.trim() || 'Hotel Owner',
          ownerBillingType: waiveBill ? 'COMPLIMENTARY' : 'CHARGED_TO_OWNER',
          waiveBill: waiveBill,
          status: 'CHECKED_IN',
          checkInImmediately: true,
          ratePerNight: baseRate,
        }),
      });

      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(`👑 Room ${selectedRoom?.roomNumber} checked in! PIN: ${cleanPin}`, {
          duration: 6000,
        });
        onClose();
        onCreated();
      } else {
        toast.error(data.message || 'Failed to create VIP booking.');
      }
    } catch {
      toast.error('Network error creating VIP booking.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;
  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-xl my-auto bg-slate-900 border border-amber-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/10">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-600" />

        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* ── Booking Form ── */}
        <form onSubmit={handleSubmit} autoComplete="off" className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest mb-1.5">
              <Crown size={15} /> Owner / VIP Guest Check-In
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white">
              Simple VIP Check-In & 4-Digit Passcode
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Fast check-in for owner acquaintances, family or VIPs. Generates an instant 4-digit code for the Room Portal with complimentary billing.
            </p>
          </div>

          {/* Room Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Select Room *
            </label>
            <div className="relative">
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-white text-sm font-semibold focus:outline-none focus:border-amber-400 transition-colors"
                required
              >
                {sortedRooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} ({r.roomTypeName}) — ₹{r.baseRate}/night {r.status === 'AVAILABLE' ? '🟢 [AVAILABLE]' : `[${r.status}]`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Returning Guest Quick Search */}
          <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 relative">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <UserCheck size={14} className="text-amber-400" />
                <span>Search Existing / VIP Customer:</span>
              </div>
              {selectedExistingGuest && (
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="text-[10px] text-rose-400 hover:text-rose-300 underline font-semibold"
                >
                  Clear / New Guest
                </button>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => {
                  setCustomerSearchQuery(e.target.value);
                  handleCustomerSearch(e.target.value);
                }}
                onFocus={() => {
                  if (customerSearchResults.length > 0) setShowCustomerDropdown(true);
                }}
                placeholder="Type guest mobile or name to auto-fill..."
                className="w-full bg-slate-950 border border-amber-500/40 focus:border-amber-400 rounded-xl pl-9 pr-8 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 placeholder:text-slate-500"
              />
              {customerSearchQuery && (
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
              {isSearchingCustomer && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2">
                  <Loader2 size={13} className="animate-spin text-amber-400" />
                </div>
              )}
            </div>

            {/* Dropdown */}
            {showCustomerDropdown && customerSearchResults.length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowCustomerDropdown(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-amber-500/40 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 max-h-56 overflow-y-auto">
                  {customerSearchResults.map((g: any) => {
                    const fullName = `${g.firstName} ${g.lastName || ''}`.trim();
                    return (
                      <div
                        key={g.id}
                        onClick={() => handleSelectCustomer(g)}
                        className="p-2.5 hover:bg-amber-500/10 cursor-pointer transition-colors flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{fullName}</p>
                          <p className="text-[10px] text-amber-400 font-mono">{g.mobile || 'No mobile'}</p>
                        </div>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                          Select
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Guest Details: Name & Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                <User size={13} className="inline mr-1 text-amber-400" /> Guest Name *
              </label>
              <input
                type="text"
                autoComplete="off"
                placeholder="e.g. Ramesh Sharma"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-white text-sm font-semibold placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                <Phone size={13} className="inline mr-1 text-amber-400" /> Mobile Number *
              </label>
              <input
                type="tel"
                autoComplete="off"
                placeholder="10-digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={10}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-white text-sm font-semibold placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
          </div>

          {/* 👑 4-Digit VIP Passcode Generator */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <KeyRound size={14} /> 4-Digit VIP Passcode for Room Portal
              </span>
              <button
                type="button"
                onClick={handleRefreshPin}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-200 transition-colors cursor-pointer"
                title="Generate new PIN"
              >
                <RefreshCw size={12} /> New Code
              </button>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                autoComplete="off"
                maxLength={4}
                value={vipPin}
                onChange={(e) => setVipPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-40 bg-slate-950 border-2 border-amber-400 rounded-xl px-4 py-2.5 text-center text-2xl font-black text-amber-300 tracking-[8px] focus:outline-none"
                required
              />
              <span className="text-xs text-slate-400">
                Guest can log into <strong>/room-portal</strong> using this 4-digit code directly without mobile OTP!
              </span>
            </div>
          </div>

          {/* Dates & Reference */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                <Calendar size={13} className="inline mr-1 text-slate-400" /> Check-In Date
              </label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                <Calendar size={13} className="inline mr-1 text-slate-400" /> Check-Out Date
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors"
                required
              />
            </div>
          </div>

          {/* Owner / Management Reference Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Owner / Reference Title
            </label>
            <input
              type="text"
              autoComplete="off"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="e.g. Guest of Hotel Owner / Director"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-white text-xs font-semibold focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* 💰 Bill & Waiver Section */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Calculated Room Tariff
                </span>
                <span className="text-xs text-slate-500">
                  {nights} Night{nights > 1 ? 's' : ''} × ₹{baseRate.toLocaleString('en-IN')}/night
                </span>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-white">
                  ₹{calculatedTotal.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">Gross Generated Bill</span>
              </div>
            </div>

            {/* Toggle to Waive to 0 */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={waiveBill}
                  onChange={(e) => setWaiveBill(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-amber-300 block">
                    Waive Bill to ₹0 (100% Complimentary)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Bill will be generated & recorded, but guest payable amount becomes ₹0.
                  </span>
                </div>
              </label>

              <div className="text-right">
                <span className={`text-base font-black ${waiveBill ? 'text-emerald-400' : 'text-amber-400'}`}>
                  ₹{finalPayable.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {waiveBill ? 'Net Payable (₹0)' : 'Due to Pay'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-60 transition-all active:scale-95"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Processing VIP Check-In...
                </>
              ) : (
                <>
                  <Crown size={16} /> Check-In VIP & Activate PIN
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
