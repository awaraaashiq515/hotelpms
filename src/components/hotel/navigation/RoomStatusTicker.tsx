'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';

interface RoomItem {
  id: string;
  roomNumber: string;
  floor?: number | string;
  status: string;
  housekeepingStatus: string;
  maintenanceStatus?: string;
  roomTypeName?: string;
  activeGuest?: {
    guestName?: string;
    bookingNo?: string;
  } | null;
  assignedStaffName?: string | null;
}

interface BoardSummary {
  totalRooms: number;
  occupiedCount: number;
  occupancyPct: number;
  vacantCleanCount: number;
  vacantDirtyCount: number;
  inProgressCount: number;
  outOfOrderCount: number;
  arrivalsTodayCount: number;
  departuresTodayCount: number;
}

export function RoomStatusTicker() {
  const [summary, setSummary] = useState<BoardSummary | null>(null);
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'IN_PROGRESS' | 'MAINTENANCE'>('ALL');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModal]);

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
    (r) => r.status === 'OCCUPIED' || r.activeGuest !== null && r.activeGuest !== undefined
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
      r.status === 'OUT_OF_ORDER' ||
      r.maintenanceStatus === 'OUT_OF_ORDER'
  );

  const totalRoomsCount = summary?.totalRooms || rooms.length || 1;
  const occupancyPct = summary?.occupancyPct ?? Math.round((occupiedRooms.length / totalRoomsCount) * 100);

  // Helper string formatter: list first N room numbers
  const formatRoomList = (roomList: RoomItem[], max = 5) => {
    if (roomList.length === 0) return 'None';
    const nums = roomList.slice(0, max).map((r) => r.roomNumber);
    if (roomList.length > max) {
      nums.push(`+${roomList.length - max} more`);
    }
    return nums.join(', ');
  };

  // Filtered rooms for the detailed modal
  const filteredRooms = rooms.filter((r) => {
    if (selectedFilter === 'AVAILABLE') {
      return (r.status === 'AVAILABLE' || !r.status) && (r.housekeepingStatus === 'CLEAN' || !r.housekeepingStatus) && !r.activeGuest;
    }
    if (selectedFilter === 'OCCUPIED') {
      return r.status === 'OCCUPIED' || (r.activeGuest !== null && r.activeGuest !== undefined);
    }
    if (selectedFilter === 'DIRTY') {
      return r.housekeepingStatus === 'DIRTY';
    }
    if (selectedFilter === 'IN_PROGRESS') {
      return r.housekeepingStatus === 'IN_PROGRESS';
    }
    if (selectedFilter === 'MAINTENANCE') {
      return r.maintenanceStatus === 'UNDER_MAINTENANCE' || r.status === 'OUT_OF_ORDER' || r.maintenanceStatus === 'OUT_OF_ORDER';
    }
    return true;
  });

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

      {/* ── Detailed Room Status Overview Modal (Portaled to document.body so header backdrop-blur never clips it) ── */}
      {mounted && showModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-white my-auto relative"
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
                    Real-time occupancy, housekeeping cleaning status, and room assignments
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
            </div>

            {/* Room Cards Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-sm">No rooms found in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredRooms.map((r) => {
                    const isOccupied = r.status === 'OCCUPIED' || r.activeGuest;
                    const isDirty = r.housekeepingStatus === 'DIRTY';
                    const isInProgress = r.housekeepingStatus === 'IN_PROGRESS';
                    const isMaintenance =
                      r.maintenanceStatus === 'UNDER_MAINTENANCE' ||
                      r.status === 'OUT_OF_ORDER' ||
                      r.maintenanceStatus === 'OUT_OF_ORDER';

                    return (
                      <div
                        key={r.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isOccupied
                            ? 'bg-sky-950/20 border-sky-500/30'
                            : isMaintenance
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : isDirty
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : isInProgress
                            ? 'bg-cyan-950/20 border-cyan-500/30'
                            : 'bg-emerald-950/20 border-emerald-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white">
                            Room {r.roomNumber}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              isOccupied
                                ? 'bg-sky-500/20 text-sky-300'
                                : isMaintenance
                                ? 'bg-rose-500/20 text-rose-300'
                                : isDirty
                                ? 'bg-amber-500/20 text-amber-300'
                                : isInProgress
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-emerald-500/20 text-emerald-300'
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

                        <div className="mt-1 text-[11px] text-slate-400 truncate">
                          {r.roomTypeName || 'Standard Room'}
                        </div>

                        {r.activeGuest && (
                          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-300 truncate">
                            <span className="text-slate-500 block">Guest:</span>
                            <span className="font-semibold text-white truncate block">
                              {r.activeGuest.guestName || 'In-House Guest'}
                            </span>
                          </div>
                        )}

                        {r.assignedStaffName && (
                          <div className="mt-1 text-[10px] text-cyan-300 truncate">
                            Housekeeper: {r.assignedStaffName}
                          </div>
                        )}
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
    </>
  );
}
