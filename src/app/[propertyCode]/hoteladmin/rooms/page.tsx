'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BedDouble, Search, RefreshCw, CheckCircle2, Clock, Sparkles,
  AlertTriangle, Filter, ArrowLeft, Building2, User, Layers,
  DoorOpen, ShieldCheck, Phone, Crown, Plus, Calendar,
  IndianRupee, ChevronRight, MessageCircle, Wrench, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import type { RoomBoardItem } from '@/types/hotel/room-board.types';
import { OccupiedRoomDetailModal } from '@/components/hotel/navigation/OccupiedRoomDetailModal';
import { QuickReservationModal, type RoomOption } from '@/components/hotel/operations/QuickReservationModal';
import { OwnerVipBookingModal } from '@/components/hotel/bookings/OwnerVipBookingModal';

export default function HotelAdminRoomsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyCode = (params?.propertyCode as string) || '';

  const [rooms, setRooms] = useState<RoomBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');

  // Modal states
  const [selectedRoomForDetail, setSelectedRoomForDetail] = useState<RoomBoardItem | null>(null);
  const [quickBookingRoomId, setQuickBookingRoomId] = useState<string | null>(null);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [vipBookingRoomId, setVipBookingRoomId] = useState<string | null>(null);
  const [isVipBookingOpen, setIsVipBookingOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch full room board with live occupant & reservation details
  const fetchRooms = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const url = propertyCode
        ? `/api/hotel/rooms/board?propertyCode=${encodeURIComponent(propertyCode)}`
        : `/api/hotel/rooms/board`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.rooms)) {
        setRooms(data.data.rooms);
      } else {
        // Fallback to basic rooms if board route didn't return list
        const res2 = await fetch('/api/hotel/rooms');
        const data2 = await res2.json();
        if (data2.success && Array.isArray(data2.data)) {
          const mapped: RoomBoardItem[] = data2.data.map((r: any) => ({
            id: r.id,
            roomNumber: r.roomNumber,
            floor: r.floor ? Number(r.floor) : 1,
            status: r.status || 'AVAILABLE',
            housekeepingStatus: r.housekeepingStatus || 'CLEAN',
            maintenanceStatus: r.maintenanceStatus || 'OK',
            isVIP: r.isVIP || false,
            isDND: r.isDND || false,
            keycardIssued: false,
            customRate: r.customRate ? Number(r.customRate) : null,
            roomTypeId: r.roomTypeId,
            roomTypeName: r.roomType?.name || 'Standard Room',
            roomTypeCode: r.roomType?.code || 'STD',
            baseRate: r.roomType?.basePrice || r.roomType?.baseRate || 3500,
            maxOccupancy: r.roomType?.capacity || 2,
            activeGuest: r.currentGuest ? {
              reservationId: '',
              bookingNo: '',
              guestName: r.currentGuest.name,
              phone: r.currentGuest.phone,
              arrivalDate: r.currentGuest.checkIn || '',
              departureDate: r.currentGuest.checkOut || '',
              totalAmount: 0,
              dueAmount: 0,
              adults: 1,
              children: 0,
              status: 'CHECKED_IN',
            } : null,
            assignedStaffName: null,
            lastCleanedAt: null,
          }));
          setRooms(mapped);
        }
      }
    } catch (e) {
      console.error('Failed to load rooms:', e);
      toast.error('Failed to load rooms');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [propertyCode]);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(() => fetchRooms(true), 10000);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  // Convert rooms to RoomOption format expected by QuickReservationModal
  const roomsListForBooking: RoomOption[] = useMemo(() => {
    return rooms.map((r) => ({
      id: r.id,
      roomNumber: r.roomNumber,
      roomTypeName: r.roomTypeName || 'Standard Room',
      roomTypeId: r.roomTypeId || '',
      baseRate: r.baseRate || 3500,
      maxOccupancy: r.maxOccupancy || 2,
      status: r.status,
      floor: String(r.floor || '1'),
    }));
  }, [rooms]);

  // Today & tomorrow ISO strings for booking pre-selection
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  // VIP status toggle
  const handleToggleVip = async (e: React.MouseEvent, room: RoomBoardItem) => {
    e.stopPropagation();
    setActionLoadingId(room.id);
    try {
      const nextVip = !room.isVIP;
      const res = await fetch('/api/hotel/rooms/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, isVIP: nextVip }),
      });
      const data = await res.json();
      if (data.success) {
        setRooms((prev) =>
          prev.map((r) => (r.id === room.id ? { ...r, isVIP: nextVip } : r))
        );
        toast.success(`Room ${room.roomNumber} marked as ${nextVip ? '👑 VIP Room' : 'Standard Room'}`);
      } else {
        toast.error('Failed to update room VIP status');
      }
    } catch {
      toast.error('Network error updating room VIP status');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Quick mark clean
  const handleMarkClean = async (e: React.MouseEvent, room: RoomBoardItem) => {
    e.stopPropagation();
    setActionLoadingId(room.id);
    try {
      const res = await fetch('/api/hotel/rooms/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          housekeepingStatus: 'CLEAN',
          status: room.status === 'OUT_OF_ORDER' ? 'AVAILABLE' : room.status,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRooms((prev) =>
          prev.map((r) =>
            r.id === room.id
              ? { ...r, housekeepingStatus: 'CLEAN', status: r.status === 'OUT_OF_ORDER' ? 'AVAILABLE' : r.status }
              : r
          )
        );
        toast.success(`Room ${room.roomNumber} marked Clean & Ready!`);
      } else {
        toast.error('Failed to update cleanliness');
      }
    } catch {
      toast.error('Network error updating cleanliness');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle card click
  const handleRoomCardClick = (room: RoomBoardItem) => {
    const isOccupied = room.status === 'OCCUPIED' || Boolean(room.activeGuest);
    if (isOccupied) {
      setSelectedRoomForDetail(room);
    } else {
      setQuickBookingRoomId(room.id);
      setIsQuickBookingOpen(true);
    }
  };

  // Filter logic
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        r.roomNumber.toLowerCase().includes(query) ||
        r.roomTypeName?.toLowerCase().includes(query) ||
        r.activeGuest?.guestName?.toLowerCase().includes(query) ||
        r.activeGuest?.phone?.toLowerCase().includes(query) ||
        r.activeGuest?.bookingNo?.toLowerCase().includes(query);

      const isOccupied = r.status === 'OCCUPIED' || Boolean(r.activeGuest);
      const isDirty = r.housekeepingStatus === 'DIRTY';
      const isClean = r.housekeepingStatus === 'CLEAN';
      const isAvailableClean = (r.status === 'AVAILABLE' || !r.status) && isClean && !r.activeGuest;
      const isMaintenance = r.status === 'OUT_OF_ORDER' || r.maintenanceStatus === 'UNDER_MAINTENANCE';

      let matchesStatus = true;
      if (statusFilter === 'OCCUPIED') matchesStatus = isOccupied;
      else if (statusFilter === 'AVAILABLE') matchesStatus = isAvailableClean;
      else if (statusFilter === 'DIRTY') matchesStatus = isDirty;
      else if (statusFilter === 'MAINTENANCE') matchesStatus = isMaintenance;
      else if (statusFilter === 'VIP') matchesStatus = Boolean(r.isVIP);

      const matchesFloor = floorFilter === 'ALL' || String(r.floor || 1) === floorFilter;

      return matchesSearch && matchesStatus && matchesFloor;
    });
  }, [rooms, searchQuery, statusFilter, floorFilter]);

  // Unique floors
  const floors = useMemo(() => {
    return Array.from(new Set(rooms.map((r) => String(r.floor || 1)))).sort();
  }, [rooms]);

  // Metrics
  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status === 'OCCUPIED' || Boolean(r.activeGuest)).length;
  const availableCleanCount = rooms.filter(
    (r) => (r.status === 'AVAILABLE' || !r.status) && r.housekeepingStatus === 'CLEAN' && !r.activeGuest
  ).length;
  const dirtyCount = rooms.filter((r) => r.housekeepingStatus === 'DIRTY').length;
  const vipCount = rooms.filter((r) => r.isVIP).length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/${propertyCode}/hoteladmin`}
              className="text-xs font-bold text-slate-500 hover:text-amber-500 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BedDouble className="text-amber-500" size={26} />
            Hotel Rooms & Live Occupancy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Click any occupied room to see occupant details & folio, or click an available room to book instantly.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* VIP Check-in Button */}
          <button
            type="button"
            onClick={() => {
              setVipBookingRoomId(null);
              setIsVipBookingOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
          >
            <Crown size={14} className="fill-slate-950" />
            <span>VIP Check-In</span>
          </button>

          {/* New Quick Booking Button */}
          <button
            type="button"
            onClick={() => {
              setQuickBookingRoomId(null);
              setIsQuickBookingOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>+ Book Room</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchRooms()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Refresh room inventory"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI STATS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Total Rooms */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Rooms</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{totalRooms}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">All inventory</p>
        </div>

        {/* Occupied */}
        <div
          onClick={() => setStatusFilter('OCCUPIED')}
          className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'OCCUPIED'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md bg-purple-500/5 dark:bg-purple-950/20'
              : 'border-purple-500/30 hover:border-purple-500/60'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">Occupied</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{occupiedCount}</p>
            <span className="text-xs font-black text-purple-500">({occupancyRate}%)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Click to view guests</p>
        </div>

        {/* Available Clean */}
        <div
          onClick={() => setStatusFilter('AVAILABLE')}
          className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'AVAILABLE'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md bg-emerald-500/5 dark:bg-emerald-950/20'
              : 'border-emerald-500/30 hover:border-emerald-500/60'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Available Clean</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{availableCleanCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Ready for booking</p>
        </div>

        {/* Housekeeping Needed */}
        <div
          onClick={() => setStatusFilter('DIRTY')}
          className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer ${
            statusFilter === 'DIRTY'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md bg-rose-500/5 dark:bg-rose-950/20'
              : 'border-rose-500/30 hover:border-rose-500/60'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">To Clean</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{dirtyCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Dirty / turn-down</p>
        </div>

        {/* VIP Rooms */}
        <div
          onClick={() => setStatusFilter('VIP')}
          className={`p-3.5 rounded-2xl bg-white dark:bg-slate-900 border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'VIP'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md bg-amber-500/5 dark:bg-amber-950/20'
              : 'border-amber-500/30 hover:border-amber-500/60'
          }`}
        >
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">👑 VIP Rooms</p>
          <p className="text-2xl font-black text-amber-500 mt-0.5">{vipCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Special guest status</p>
        </div>
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search room #, guest name, phone, type, booking ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-amber-500 outline-none transition-all dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('AVAILABLE')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'AVAILABLE'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              🟢 Clean ({availableCleanCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OCCUPIED')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'OCCUPIED'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-purple-600 dark:text-purple-400 hover:bg-purple-500/10'
              }`}
            >
              🟣 Occupied ({occupiedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('DIRTY')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'DIRTY'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
              }`}
            >
              🧹 To Clean ({dirtyCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('VIP')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                statusFilter === 'VIP'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                  : 'text-amber-500 hover:bg-amber-500/10'
              }`}
            >
              👑 VIP ({vipCount})
            </button>
          </div>

          {/* Floor Filter */}
          {floors.length > 1 && (
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-bold text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="ALL">All Floors</option>
              {floors.map((f) => (
                <option key={f} value={f}>
                  Floor {f}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── ROOMS GRID ── */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Live Rooms & Occupants...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <BedDouble className="mx-auto text-slate-400 mb-3" size={44} />
          <p className="font-bold text-slate-700 dark:text-slate-300">No rooms match your filter</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the status filter or search query</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setFloorFilter('ALL');
            }}
            className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-black hover:bg-amber-400 transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {filteredRooms.map((room) => {
            const isOccupied = room.status === 'OCCUPIED' || Boolean(room.activeGuest);
            const isDirty = room.housekeepingStatus === 'DIRTY';
            const isMaintenance =
              room.status === 'OUT_OF_ORDER' || room.maintenanceStatus === 'UNDER_MAINTENANCE';
            const isAvailable = !isOccupied && !isMaintenance;
            const guest = room.activeGuest;

            return (
              <div
                key={room.id}
                onClick={() => handleRoomCardClick(room)}
                className={`relative group rounded-2xl border transition-all duration-200 p-3.5 flex flex-col justify-between cursor-pointer select-none ${
                  isOccupied
                    ? 'bg-gradient-to-br from-[#1b122e]/90 via-[#150f26]/90 to-[#0e0c1a]/95 border-purple-500/40 hover:border-purple-400 shadow-lg shadow-purple-950/20 hover:scale-[1.01]'
                    : isMaintenance
                    ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                    : isDirty
                    ? 'bg-rose-950/15 border-rose-500/30 hover:border-rose-400'
                    : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 shadow-sm hover:shadow-xl hover:scale-[1.01]'
                }`}
              >
                {/* ── CARD TOP BAR: Room Number + Status Badges ── */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        {room.roomNumber}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        (F{room.floor || 1})
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* VIP Badge / Toggle */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleVip(e, room)}
                        title={room.isVIP ? 'VIP Room (Click to remove)' : 'Mark as VIP Room'}
                        className={`p-1 rounded-md transition-all ${
                          room.isVIP
                            ? 'text-amber-400 bg-amber-400/15 border border-amber-400/30'
                            : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800'
                        }`}
                      >
                        <Crown size={12} className={room.isVIP ? 'fill-amber-400' : ''} />
                      </button>

                      {/* Status Badge */}
                      <span
                        className={`text-[9.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isOccupied
                            ? 'bg-purple-600 text-white shadow-sm'
                            : isMaintenance
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : isDirty
                            ? 'bg-rose-500 text-white font-black'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {isOccupied
                          ? 'Occupied'
                          : isMaintenance
                          ? 'Maint'
                          : isDirty
                          ? 'Dirty'
                          : 'Available'}
                      </span>
                    </div>
                  </div>

                  {/* Room Type & Rate */}
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
                    <span className="truncate text-slate-300 font-medium">
                      {room.roomTypeName || 'Deluxe Room'}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-emerald-400 shrink-0">
                      ₹{room.baseRate?.toLocaleString()}/n
                    </span>
                  </div>

                  {/* ── CASE 1: OCCUPIED ROOM (SHOW GUEST DETAILS) ── */}
                  {isOccupied && guest ? (
                    <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 space-y-1.5 my-1.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                            <User size={11} />
                          </div>
                          <span className="text-xs font-black text-white truncate">
                            {guest.guestName}
                          </span>
                        </div>
                        {guest.phone && (
                          <a
                            href={`https://wa.me/${guest.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Chat on WhatsApp"
                            className="p-1 rounded-md text-emerald-400 hover:bg-emerald-500/20 transition-colors shrink-0"
                          >
                            <MessageCircle size={12} />
                          </a>
                        )}
                      </div>

                      {/* Dates */}
                      <div className="flex items-center justify-between text-[10px] text-purple-200/90 font-medium pt-0.5 border-t border-purple-500/20">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} className="text-purple-400" />
                          {guest.arrivalDate} → {guest.departureDate}
                        </span>
                      </div>

                      {/* Folio / Due */}
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400">Balance Due:</span>
                        <span className={guest.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                          ₹{Number(guest.dueAmount || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* ── CASE 2: DIRTY ROOM ── */}
                  {isDirty && !isOccupied && (
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 my-1 text-[11px] text-rose-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Sparkles size={12} className="text-rose-400" />
                        Needs Housekeeping
                      </span>
                      <button
                        type="button"
                        disabled={actionLoadingId === room.id}
                        onClick={(e) => handleMarkClean(e, room)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold hover:bg-emerald-500/30 active:scale-95 transition-all"
                      >
                        Mark Clean
                      </button>
                    </div>
                  )}

                  {/* ── CASE 3: AVAILABLE CLEAN ROOM ── */}
                  {isAvailable && !isDirty && (
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 my-1 text-[11px] text-emerald-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        Clean & Ready
                      </span>
                      <span className="text-[10px] text-emerald-400/80 font-mono">
                        Max {room.maxOccupancy || 2} Pax
                      </span>
                    </div>
                  )}
                </div>

                {/* ── CARD BOTTOM ACTIONS ── */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  {isOccupied ? (
                    /* Occupied Room: View Occupant Details button */
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoomForDetail(room);
                      }}
                      className="w-full h-8 px-2.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      <User size={13} />
                      <span>Occupant &amp; Folio Details</span>
                      <ChevronRight size={12} />
                    </button>
                  ) : (
                    /* Available Room: Direct Book & VIP buttons */
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickBookingRoomId(room.id);
                          setIsQuickBookingOpen(true);
                        }}
                        className="flex-1 h-8 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
                      >
                        <Plus size={13} />
                        <span>Book Room</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVipBookingRoomId(room.id);
                          setIsVipBookingOpen(true);
                        }}
                        className="h-8 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 text-xs font-black flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                        title="1-Click Owner / VIP fast check-in"
                      >
                        <Crown size={12} className="fill-amber-300" />
                        <span>VIP</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL 1: OCCUPIED ROOM FULL DETAILS (GUEST, STAY, FOLIO, ORDERS) ── */}
      {selectedRoomForDetail && (
        <OccupiedRoomDetailModal
          isOpen={Boolean(selectedRoomForDetail)}
          room={selectedRoomForDetail}
          onClose={() => setSelectedRoomForDetail(null)}
          onOpenBooking={(roomId) => {
            setSelectedRoomForDetail(null);
            setQuickBookingRoomId(roomId);
            setIsQuickBookingOpen(true);
          }}
        />
      )}

      {/* ── MODAL 2: FRONT DESK QUICK RESERVATION WIZARD ── */}
      {isQuickBookingOpen && (
        <QuickReservationModal
          isOpen={isQuickBookingOpen}
          roomsList={roomsListForBooking}
          initialRoomId={quickBookingRoomId || undefined}
          initialArrivalDate={todayStr}
          initialDepartureDate={tomorrowStr}
          onClose={() => {
            setIsQuickBookingOpen(false);
            setQuickBookingRoomId(null);
          }}
          onCreated={() => {
            setIsQuickBookingOpen(false);
            setQuickBookingRoomId(null);
            fetchRooms(true);
            toast.success('Room reservation created successfully!');
          }}
        />
      )}

      {/* ── MODAL 3: OWNER / VIP FAST CHECK-IN MODAL ── */}
      {isVipBookingOpen && (
        <OwnerVipBookingModal
          isOpen={isVipBookingOpen}
          roomsList={roomsListForBooking}
          initialRoomId={vipBookingRoomId || undefined}
          onClose={() => {
            setIsVipBookingOpen(false);
            setVipBookingRoomId(null);
          }}
          onCreated={() => {
            setIsVipBookingOpen(false);
            setVipBookingRoomId(null);
            fetchRooms(true);
            toast.success('VIP Check-in completed successfully!');
          }}
        />
      )}
    </div>
  );
}
