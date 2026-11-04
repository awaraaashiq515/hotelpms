'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  BedDouble,
  CheckCircle2,
  UserCheck,
  Sparkles,
  Clock,
  Wrench,
  ArrowRightLeft,
  X,
  ExternalLink,
  RefreshCw,
  Eye,
  Plus,
  Search,
  User,
  DollarSign,
  Calendar,
  AlertCircle,
  Check,
  Loader2,
  Crown,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { QuickReservationModal, type RoomOption } from '@/components/hotel/operations/QuickReservationModal';
import { OwnerVipBookingModal } from '@/components/hotel/bookings/OwnerVipBookingModal';
import { OccupiedRoomDetailModal } from './OccupiedRoomDetailModal';
import type {
  RoomBoardItem,
  RoomBoardGuestInfo,
  RoomBoardSummary,
} from '@/types/hotel/room-board.types';

export function RoomStatusTicker() {
  const [summary, setSummary] = useState<RoomBoardSummary | null>(null);
  const [rooms, setRooms] = useState<RoomBoardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'IN_PROGRESS' | 'MAINTENANCE' | 'VIP'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  // Detail Modal for Occupied Rooms
  const [selectedRoomForDetail, setSelectedRoomForDetail] = useState<RoomBoardItem | null>(null);

  // Quick Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedBookingRoomId, setSelectedBookingRoomId] = useState<string | undefined>(undefined);

  // VIP / Owner Fast Check-In Modal State
  const [isVipModalOpen, setIsVipModalOpen] = useState(false);
  const [selectedVipRoomId, setSelectedVipRoomId] = useState<string | undefined>(undefined);

  // Loading state when updating a room's status (e.g. marking clean)
  const [updatingRoomId, setUpdatingRoomId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedRoomForDetail) {
          setSelectedRoomForDetail(null);
        } else {
          setShowModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal, selectedRoomForDetail]);

  const fetchBoardData = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/rooms/board');
      const data = await res.json();
      if (data.success && data.data) {
        setSummary(data.data.summary);
        setRooms(data.data.rooms || []);
      }
    } catch (err) {
      console.error('Failed to fetch rooms board for ticker:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoardData();
    // Auto refresh every 45 seconds to keep ticker live
    const interval = setInterval(fetchBoardData, 45000);
    return () => clearInterval(interval);
  }, [fetchBoardData]);

  // Categorize rooms
  const availableRooms = rooms.filter(
    (r) =>
      (r.status === 'AVAILABLE' || !r.status) &&
      (r.housekeepingStatus === 'CLEAN' || !r.housekeepingStatus) &&
      !r.activeGuest
  );

  const occupiedRooms = rooms.filter(
    (r) => r.status === 'OCCUPIED' || (r.activeGuest !== null && r.activeGuest !== undefined)
  );

  const dirtyRooms = rooms.filter(
    (r) => r.housekeepingStatus === 'DIRTY'
  );

  const inProgressRooms = rooms.filter(
    (r) => r.housekeepingStatus === 'IN_PROGRESS'
  );

  const maintenanceRooms = rooms.filter(
    (r) =>
      r.maintenanceStatus === 'UNDER_MAINTENANCE' ||
      r.status === 'OUT_OF_ORDER'
  );

  const vipRooms = rooms.filter(
    (r) => Boolean(r.isVIP) || Boolean(r.activeGuest && (r.activeGuest as any).isVIP)
  );

  const totalRoomsCount = summary?.totalRooms || rooms.length || 1;
  const occupancyPct = summary?.occupancyPct ?? Math.round((occupiedRooms.length / totalRoomsCount) * 100);

  // Helper string formatter: list first N room numbers
  const formatRoomList = (roomList: RoomBoardItem[], max = 5) => {
    if (roomList.length === 0) return 'None';
    const nums = roomList.slice(0, max).map((r) => r.roomNumber);
    if (roomList.length > max) {
      nums.push(`+${roomList.length - max} more`);
    }
    return nums.join(', ');
  };

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

  // Filtered rooms for the detailed modal with search support
  const filteredRooms = rooms.filter((r) => {
    // Tab category filter
    if (selectedFilter === 'AVAILABLE') {
      if (!((r.status === 'AVAILABLE' || !r.status) && (r.housekeepingStatus === 'CLEAN' || !r.housekeepingStatus) && !r.activeGuest)) {
        return false;
      }
    } else if (selectedFilter === 'OCCUPIED') {
      if (!(r.status === 'OCCUPIED' || (r.activeGuest !== null && r.activeGuest !== undefined))) {
        return false;
      }
    } else if (selectedFilter === 'DIRTY') {
      if (r.housekeepingStatus !== 'DIRTY') return false;
    } else if (selectedFilter === 'IN_PROGRESS') {
      if (r.housekeepingStatus !== 'IN_PROGRESS') return false;
    } else if (selectedFilter === 'MAINTENANCE') {
      if (!(r.maintenanceStatus === 'UNDER_MAINTENANCE' || r.status === 'OUT_OF_ORDER')) {
        return false;
      }
    } else if (selectedFilter === 'VIP') {
      if (!(r.isVIP || (r.activeGuest && (r.activeGuest as any).isVIP))) {
        return false;
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRoom = r.roomNumber.toLowerCase().includes(q);
      const matchType = (r.roomTypeName || '').toLowerCase().includes(q);
      const matchGuest = (r.activeGuest?.guestName || '').toLowerCase().includes(q);
      const matchBooking = (r.activeGuest?.bookingNo || '').toLowerCase().includes(q);
      const matchStaff = (r.assignedStaffName || '').toLowerCase().includes(q);
      if (!matchRoom && !matchType && !matchGuest && !matchBooking && !matchStaff) {
        return false;
      }
    }

    return true;
  });

  // Action: Open Quick Booking form
  const handleOpenBooking = (roomId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBookingRoomId(roomId);
    setShowModal(false);
    setIsBookingModalOpen(true);
  };

  // Action: Open Owner / VIP Fast Check-In
  const handleOpenVipBooking = (roomId?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedVipRoomId(roomId);
    setShowModal(false);
    setIsVipModalOpen(true);
  };

  // Action: Toggle VIP status for room
  const handleToggleVip = async (roomId: string, currentVip: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch('/api/hotel/rooms/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, isVIP: !currentVip }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(!currentVip ? 'Room marked as VIP ⭐' : 'VIP status removed');
        await fetchBoardData();
      } else {
        toast.error(data.message || 'Failed to update VIP status');
      }
    } catch {
      toast.error('Network error updating room');
    }
  };

  // Action: Handle room card click
  const handleRoomCardClick = (room: RoomBoardItem) => {
    const isOccupied = room.status === 'OCCUPIED' || Boolean(room.activeGuest);
    if (isOccupied) {
      setSelectedRoomForDetail(room);
    } else {
      // Room is available or dirty -> open quick booking form directly
      handleOpenBooking(room.id);
    }
  };

  // Action: Mark room as Clean instantly
  const handleMarkClean = async (roomId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUpdatingRoomId(roomId);
    try {
      const res = await fetch('/api/hotel/rooms/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          housekeepingStatus: 'CLEAN',
          status: 'AVAILABLE',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Room marked as Clean & Ready');
        await fetchBoardData();
      } else {
        toast.error(data.message || 'Failed to update room');
      }
    } catch {
      toast.error('Network error while updating room');
    } finally {
      setUpdatingRoomId(null);
    }
  };

  // Ticker content items sequence
  const renderTickerPills = () => (
    <div className="flex items-center gap-4 shrink-0 pr-4">
      {/* 1. Live Occupancy */}
      <div
        onClick={() => { setSelectedFilter('ALL'); setShowModal(true); }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold cursor-pointer hover:bg-indigo-500/25 transition-all shadow-xs shrink-0"
        title="Click to view all rooms"
      >
        <BedDouble className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>Occupancy:</span>
        <span className="text-white font-black">{occupancyPct}%</span>
        <span className="text-indigo-300/80 font-normal">({occupiedRooms.length}/{totalRoomsCount} Rooms)</span>
      </div>

      {/* Divider */}
      <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />

      {/* 2. Available / Vacant Clean */}
      <div
        onClick={() => { setSelectedFilter('AVAILABLE'); setShowModal(true); }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold cursor-pointer hover:bg-emerald-500/25 transition-all shrink-0"
        title="Click to view available clean rooms"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span className="font-bold text-white">Available ({availableRooms.length}):</span>
        <span className="text-emerald-200">{formatRoomList(availableRooms, 4)}</span>
      </div>

      {/* Divider */}
      <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />

      {/* 3. Occupied / In-House */}
      <div
        onClick={() => { setSelectedFilter('OCCUPIED'); setShowModal(true); }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[11px] font-semibold cursor-pointer hover:bg-sky-500/25 transition-all shrink-0"
        title="Click to view occupied rooms"
      >
        <UserCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="font-bold text-white">Occupied ({occupiedRooms.length}):</span>
        <span className="text-sky-200">{formatRoomList(occupiedRooms, 4)}</span>
      </div>

      {/* Divider */}
      <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />

      {/* 4. Needs Cleaning / Dirty */}
      <div
        onClick={() => { setSelectedFilter('DIRTY'); setShowModal(true); }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold cursor-pointer hover:bg-amber-500/25 transition-all shrink-0"
        title="Click to view rooms needing cleaning"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-bold text-white">To Clean ({dirtyRooms.length}):</span>
        <span className="text-amber-200">{formatRoomList(dirtyRooms, 3)}</span>
      </div>

      {/* 5. In Progress Cleaning (if any) */}
      {inProgressRooms.length > 0 && (
        <>
          <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
          <div
            onClick={() => { setSelectedFilter('IN_PROGRESS'); setShowModal(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold cursor-pointer hover:bg-cyan-500/25 transition-all shrink-0"
            title="Click to view rooms being cleaned"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold text-white">Cleaning ({inProgressRooms.length}):</span>
            <span className="text-cyan-200">{formatRoomList(inProgressRooms, 3)}</span>
          </div>
        </>
      )}

      {/* 6. Under Maintenance (if any) */}
      {maintenanceRooms.length > 0 && (
        <>
          <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
          <div
            onClick={() => { setSelectedFilter('MAINTENANCE'); setShowModal(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-semibold cursor-pointer hover:bg-rose-500/25 transition-all shrink-0"
            title="Click to view rooms under maintenance"
          >
            <Wrench className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="font-bold text-white">Maintenance ({maintenanceRooms.length}):</span>
            <span className="text-rose-200">{formatRoomList(maintenanceRooms, 3)}</span>
          </div>
        </>
      )}

      {/* 7. Today's Activity */}
      {(summary?.arrivalsTodayCount !== undefined || summary?.departuresTodayCount !== undefined) && (
        <>
          <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
          <div
            onClick={() => { setSelectedFilter('ALL'); setShowModal(true); }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] font-medium cursor-pointer hover:bg-slate-800 transition-all shrink-0"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Today:</span>
            <strong className="text-emerald-400">{summary?.arrivalsTodayCount || 0} Arrivals</strong>
            <span>•</span>
            <strong className="text-amber-400">{summary?.departuresTodayCount || 0} Departures</strong>
          </div>
        </>
      )}

      {/* Spacer before repeat */}
      <span className="w-2" />
    </div>
  );

  return (
    <>
      {/* ── Ticker Bar Strip ── */}
      <div className="hidden lg:flex flex-1 items-center mx-4 min-w-0 h-10 px-3 rounded-full bg-[#111827]/70 border border-slate-800/90 shadow-inner relative overflow-hidden group">
        {/* Left Glow & Fade gradient mask */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0f172a] to-transparent z-10 pointer-events-none" />

        {/* Live Pulse Beacon */}
        <div className="flex items-center gap-1.5 pl-0.5 pr-2.5 border-r border-slate-800 shrink-0 z-20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 hidden xl:inline">
            ROOMS
          </span>
        </div>

        {/* Moving Marquee Stream */}
        <div className="flex-1 overflow-hidden flex items-center relative select-none">
          {loading ? (
            <div className="text-xs text-slate-500 flex items-center gap-2 pl-3 animate-pulse">
              <span>Loading live room statuses...</span>
            </div>
          ) : (
            <div className="animate-room-ticker cursor-pointer" title="Hover to pause • Click to view all rooms">
              {/* Duplicate copy 1 */}
              {renderTickerPills()}
              {/* Duplicate copy 2 for seamless infinite loop */}
              {renderTickerPills()}
            </div>
          )}
        </div>

        {/* Right Fade gradient mask & Quick Expand Trigger */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 pl-6 bg-gradient-to-l from-[#0f172a] via-[#0f172a]/90 to-transparent z-10">
          <button
            onClick={() => { setSelectedFilter('ALL'); setShowModal(true); }}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Open Room Status Overview"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Detailed Room Status Overview Modal ── */}
      {mounted && showModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[88vh] my-auto flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <BedDouble className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Live Hotel Rooms Status</span>
                    <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {totalRoomsCount} Total Rooms
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time occupancy, housekeeping cleaning status, and instant room booking
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Direct New Booking Button */}
                <button
                  onClick={() => handleOpenBooking()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                  title="Create New Reservation"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Room</span>
                </button>

                {/* VIP / Owner Fast Check-In Button */}
                <button
                  onClick={() => handleOpenVipBooking()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
                  title="VIP / Owner Fast Check-In"
                >
                  <Crown className="w-3.5 h-3.5 text-slate-950" />
                  <span>VIP Check-In</span>
                </button>

                <button
                  onClick={fetchBoardData}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs Bar */}
            <div className="flex items-center gap-1 p-3 bg-slate-900/50 border-b border-slate-800 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => setSelectedFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                All Rooms ({rooms.length})
              </button>

              <button
                onClick={() => setSelectedFilter('AVAILABLE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  selectedFilter === 'AVAILABLE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Available Clean ({availableRooms.length})</span>
              </button>

              <button
                onClick={() => setSelectedFilter('OCCUPIED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  selectedFilter === 'OCCUPIED'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-sky-400 hover:text-sky-300 hover:bg-sky-500/10'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Occupied ({occupiedRooms.length})</span>
              </button>

              <button
                onClick={() => setSelectedFilter('DIRTY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  selectedFilter === 'DIRTY'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>To Clean ({dirtyRooms.length})</span>
              </button>

              {inProgressRooms.length > 0 && (
                <button
                  onClick={() => setSelectedFilter('IN_PROGRESS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    selectedFilter === 'IN_PROGRESS'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>In Progress ({inProgressRooms.length})</span>
                </button>
              )}

              {maintenanceRooms.length > 0 && (
                <button
                  onClick={() => setSelectedFilter('MAINTENANCE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    selectedFilter === 'MAINTENANCE'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                  }`}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Maintenance ({maintenanceRooms.length})</span>
                </button>
              )}

              {/* VIP Rooms Tab */}
              <button
                onClick={() => setSelectedFilter('VIP')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  selectedFilter === 'VIP'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>VIP Rooms ({vipRooms.length})</span>
              </button>
            </div>

            {/* Quick Search & Hint Bar */}
            <div className="px-4 py-2.5 bg-slate-900/70 border-b border-slate-800/80 flex items-center justify-between gap-3 shrink-0">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search room number, type, or guest name..."
                  className="w-full bg-slate-800/70 border border-slate-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Click available room to book
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span> Click occupied room for guest details
                </span>
              </div>
            </div>

            {/* Room Cards Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-sm">No rooms found matching your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                  {filteredRooms.map((r) => {
                    const isOccupied = r.status === 'OCCUPIED' || Boolean(r.activeGuest);
                    const isDirty = r.housekeepingStatus === 'DIRTY';
                    const isInProgress = r.housekeepingStatus === 'IN_PROGRESS';
                    const isMaintenance =
                      r.maintenanceStatus === 'UNDER_MAINTENANCE' ||
                      r.status === 'OUT_OF_ORDER';

                    return (
                      <div
                        key={r.id}
                        onClick={() => handleRoomCardClick(r)}
                        className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between hover:scale-[1.01] hover:shadow-lg relative group ${
                          isOccupied
                            ? 'bg-sky-950/20 border-sky-500/30 hover:border-sky-400'
                            : isMaintenance
                            ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-400'
                            : isDirty
                            ? 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400'
                            : isInProgress
                            ? 'bg-cyan-950/20 border-cyan-500/30 hover:border-cyan-400'
                            : 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400'
                        }`}
                      >
                        <div>
                          {/* Card Top: Room Number & Status Pill */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-base font-black text-white group-hover:text-indigo-300 transition-colors">
                                Room {r.roomNumber}
                              </span>
                              {r.floor && (
                                <span className="text-[10px] text-slate-400">
                                  (F{r.floor})
                                </span>
                              )}
                              {r.isVIP && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-xs">
                                  <Crown className="w-2.5 h-2.5 text-amber-400" />
                                  <span>VIP</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Quick VIP Toggle Button */}
                              <button
                                type="button"
                                onClick={(e) => handleToggleVip(r.id, Boolean(r.isVIP), e)}
                                className={`p-1 rounded-md transition-colors cursor-pointer ${
                                  r.isVIP
                                    ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30'
                                    : 'text-slate-600 hover:text-amber-400 hover:bg-slate-800'
                                }`}
                                title={r.isVIP ? 'VIP Room Active (Click to remove)' : 'Mark room as VIP'}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>

                              <span
                                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                  isOccupied
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                                    : isMaintenance
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                    : isDirty
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : isInProgress
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                {isOccupied
                                  ? 'Occupied'
                                  : isMaintenance
                                  ? 'Maintenance'
                                  : isDirty
                                  ? 'Dirty'
                                  : isInProgress
                                  ? 'Cleaning'
                                  : 'Available'}
                              </span>
                            </div>
                          </div>

                          {/* Room Type & Base Price */}
                          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="truncate">{r.roomTypeName || 'Standard Room'}</span>
                            <span className="text-slate-300 font-semibold shrink-0">
                              ₹{r.baseRate?.toLocaleString('en-IN') || 3500}/n
                            </span>
                          </div>

                          {/* Occupied: Guest Information */}
                          {r.activeGuest && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1">
                              <div className="flex items-center gap-1.5 text-xs text-white font-bold truncate">
                                <User className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                                <span className="truncate">{r.activeGuest.guestName}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span>Stay: {r.activeGuest.arrivalDate} → {r.activeGuest.departureDate}</span>
                              </div>
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400">Folio Balance:</span>
                                <span
                                  className={`font-extrabold ${
                                    r.activeGuest.dueAmount > 0 ? 'text-amber-400' : 'text-emerald-400'
                                  }`}
                                >
                                  {r.activeGuest.dueAmount > 0
                                    ? `₹${r.activeGuest.dueAmount.toLocaleString('en-IN')} Due`
                                    : 'Paid in Full'}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Dirty / Housekeeper info */}
                          {!r.activeGuest && (
                            <div className="mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-400">
                              {r.assignedStaffName ? (
                                <span className="text-cyan-300 truncate block">
                                  Housekeeper: {r.assignedStaffName}
                                </span>
                              ) : isDirty ? (
                                <span className="text-amber-300/90 block">
                                  Needs cleaning before check-in
                                </span>
                              ) : (
                                <span className="text-emerald-400/80 block">
                                  Clean & ready for instant check-in
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Action Buttons */}
                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center gap-1.5">
                          {isOccupied ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRoomForDetail(r);
                              }}
                              className="w-full py-1.5 px-2 bg-sky-600/90 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Guest Details</span>
                            </button>
                          ) : (
                            <>
                              {isDirty && (
                                <button
                                  onClick={(e) => handleMarkClean(r.id, e)}
                                  disabled={updatingRoomId === r.id}
                                  className="flex-1 py-1.5 px-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="Mark room as clean"
                                >
                                  {updatingRoomId === r.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )}
                                  <span>Clean</span>
                                </button>
                              )}

                              <button
                                onClick={(e) => handleOpenBooking(r.id, e)}
                                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                title="Standard Front Desk Booking"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Book</span>
                              </button>

                              <button
                                onClick={(e) => handleOpenVipBooking(r.id, e)}
                                className="py-1.5 px-2.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                title="Fast VIP / Owner Check-In"
                              >
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                                <span>VIP</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer with Direct Page Links */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Link
                  href="/hotel/rooms"
                  onClick={() => setShowModal(false)}
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Go to Room Management</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="text-slate-700">•</span>
                <Link
                  href="/hotel/housekeeping"
                  onClick={() => setShowModal(false)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Housekeeping Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="text-slate-700">•</span>
                <Link
                  href="/hotel/bookings"
                  onClick={() => setShowModal(false)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>All Reservations</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── Occupied Room Details Modal ── */}
      {selectedRoomForDetail && (
        <OccupiedRoomDetailModal
          isOpen={Boolean(selectedRoomForDetail)}
          onClose={() => setSelectedRoomForDetail(null)}
          room={selectedRoomForDetail}
          onOpenBooking={(roomId) => {
            setSelectedRoomForDetail(null);
            handleOpenBooking(roomId);
          }}
        />
      )}

      {/* ── Quick Room Booking Wizard Modal ── */}
      {isBookingModalOpen && (
        <QuickReservationModal
          isOpen={isBookingModalOpen}
          roomsList={roomsListForBooking}
          initialRoomId={selectedBookingRoomId}
          initialArrivalDate={todayStr}
          initialDepartureDate={tomorrowStr}
          onClose={() => {
            setIsBookingModalOpen(false);
            setShowModal(true);
          }}
          onCreated={() => {
            setIsBookingModalOpen(false);
            setShowModal(true);
            fetchBoardData();
            toast.success('Reservation created successfully!');
          }}
        />
      )}

      {/* ── Owner / VIP Fast Check-In Modal ── */}
      {isVipModalOpen && (
        <OwnerVipBookingModal
          isOpen={isVipModalOpen}
          roomsList={roomsListForBooking}
          initialRoomId={selectedVipRoomId}
          onClose={() => {
            setIsVipModalOpen(false);
            setShowModal(true);
          }}
          onCreated={() => {
            setIsVipModalOpen(false);
            setShowModal(true);
            fetchBoardData();
            toast.success('VIP Check-In completed successfully!');
          }}
        />
      )}
    </>
  );
}
