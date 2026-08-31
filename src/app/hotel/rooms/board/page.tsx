'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  RefreshCw,
  Search,
  Download,
  Filter,
  Sparkles,
  Bed,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Wrench,
  Brush,
  FileDown,
  Layers,
  Building2,
  Calendar,
  Key,
} from 'lucide-react';
import { RoomActionModal } from '@/components/hotel/rooms/RoomActionModal';
import type {
  RoomBoardData,
  RoomBoardItem,
  RoomOperationalStatus,
  HousekeepingStatus,
  MaintenanceStatus,
} from '@/types/hotel/room-board.types';
import { exportHotelPDF, exportHotelCSV } from '@/lib/export-utils';
import { toast } from 'sonner';

export default function RoomBoardPage() {
  const [data, setData] = useState<RoomBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [selectedRoom, setSelectedRoom] = useState<RoomBoardItem | null>(null);
  const [actionModalOpen, setActionModalOpen] = useState(false);

  const fetchBoardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/rooms/board');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        toast.error(json.message || 'Failed to load Room Status Board');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Network error';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  // Auto-refresh interval (every 30s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchBoardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchBoardData]);

  const handleUpdateStatus = async (
    roomId: string,
    updateData: {
      housekeepingStatus?: HousekeepingStatus;
      status?: RoomOperationalStatus;
      maintenanceStatus?: MaintenanceStatus;
      isVIP?: boolean;
    }
  ): Promise<boolean> => {
    try {
      const res = await fetch('/api/hotel/rooms/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, ...updateData }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Room status updated successfully');
        await fetchBoardData();
        return true;
      } else {
        toast.error(json.message || 'Failed to update room');
        return false;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Update failed';
      toast.error(msg);
      return false;
    }
  };

  const handleBulkAction = async (action: 'MARK_ALL_CLEAN' | 'MARK_ALL_DIRTY' | 'MARK_ALL_IN_PROGRESS') => {
    if (!data?.rooms) return;
    const roomIds = data.rooms.map((r) => r.id);
    try {
      const res = await fetch('/api/hotel/rooms/board', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulkAction: action, roomIds }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Bulk action applied!');
        await fetchBoardData();
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Bulk action failed';
      toast.error(msg);
    }
  };

  const rooms = data?.rooms || [];
  const summary = data?.summary;
  const floors = data?.floors || [1];
  const roomTypes = data?.roomTypes || [];

  // Filter rooms
  const filteredRooms = rooms.filter((r) => {
    // Floor filter
    if (selectedFloor !== 'ALL' && r.floor !== selectedFloor) return false;

    // Room type filter
    if (roomTypeFilter !== 'ALL' && r.roomTypeId !== roomTypeFilter) return false;

    // Status filter
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'OCCUPIED' && r.status !== 'OCCUPIED' && !r.activeGuest) return false;
      if (statusFilter === 'CLEAN' && (r.housekeepingStatus !== 'CLEAN' || r.status === 'OCCUPIED' || r.activeGuest)) return false;
      if (statusFilter === 'DIRTY' && r.housekeepingStatus !== 'DIRTY') return false;
      if (statusFilter === 'IN_PROGRESS' && r.housekeepingStatus !== 'IN_PROGRESS') return false;
      if (statusFilter === 'INSPECTION' && r.housekeepingStatus !== 'INSPECTION_PENDING') return false;
      if (statusFilter === 'OOO' && r.status !== 'OUT_OF_ORDER' && r.maintenanceStatus !== 'UNDER_MAINTENANCE') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = r.roomNumber.toLowerCase().includes(q);
      const matchType = r.roomTypeName.toLowerCase().includes(q);
      const matchGuest = r.activeGuest?.guestName.toLowerCase().includes(q);
      if (!matchNumber && !matchType && !matchGuest) return false;
    }

    return true;
  });

  // Group filtered rooms by floor
  const roomsByFloor = floors.reduce((acc, fl) => {
    acc[fl] = filteredRooms.filter((r) => r.floor === fl);
    return acc;
  }, {} as Record<number, RoomBoardItem[]>);

  // PDF Export
  const handleExportPDF = () => {
    if (!rooms.length) return;
    const headers = ['Room No', 'Floor', 'Room Type', 'Occupancy Status', 'Housekeeping', 'Guest Name', 'Check-in', 'Check-out', 'Base Rate (INR)'];
    const rows = rooms.map((r) => [
      r.roomNumber,
      `Floor ${r.floor}`,
      r.roomTypeName,
      r.activeGuest ? 'OCCUPIED' : r.status,
      r.housekeepingStatus,
      r.activeGuest?.guestName || '—',
      r.activeGuest?.arrivalDate || '—',
      r.activeGuest?.departureDate || '—',
      r.baseRate,
    ]);

    exportHotelPDF(
      headers,
      rows,
      `room_status_board_${new Date().toISOString().split('T')[0]}`,
      'Hotel Room Status & Housekeeping Board',
      {
        hotelName: summary?.hotelName || 'Grand Luxury Hotel & Resort',
        hotelAddress: summary?.hotelAddress || 'Room Management & Front Desk System',
        generatedBy: 'Front Desk / Duty Manager',
        dateRangeFormatted: `Current Live Status · ${new Date().toLocaleDateString('en-IN')}`,
        summaryCards: [
          { label: 'Total Rooms', value: `${summary?.totalRooms ?? 0} Keys` },
          { label: 'Occupancy Rate', value: `${summary?.occupancyPct ?? 0}%` },
          { label: 'Vacant Clean Ready', value: `${summary?.vacantCleanCount ?? 0} Rooms` },
          { label: 'Vacant Dirty', value: `${summary?.vacantDirtyCount ?? 0} Rooms` },
        ],
      }
    );
    toast.success('Room Status Board exported as PDF!');
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!rooms.length) return;
    const headers = ['Room No', 'Floor', 'Room Type', 'Operational Status', 'Housekeeping Status', 'Maintenance Status', 'Guest Name', 'Arrival Date', 'Departure Date', 'Base Rate (INR)'];
    const rows = rooms.map((r) => [
      r.roomNumber,
      `Floor ${r.floor}`,
      r.roomTypeName,
      r.activeGuest ? 'OCCUPIED' : r.status,
      r.housekeepingStatus,
      r.maintenanceStatus,
      r.activeGuest?.guestName || 'Vacant',
      r.activeGuest?.arrivalDate || '',
      r.activeGuest?.departureDate || '',
      r.baseRate,
    ]);

    exportHotelCSV(
      headers,
      rows,
      `room_status_board_${new Date().toISOString().split('T')[0]}`,
      'Hotel Room Status & Housekeeping Board',
      {
        hotelName: summary?.hotelName || 'Grand Luxury Hotel & Resort',
        generatedBy: 'Front Desk / Duty Manager',
        dateRangeFormatted: `Live Status: ${new Date().toLocaleString('en-IN')}`,
        summaryCards: [
          { label: 'Total Rooms', value: `${summary?.totalRooms ?? 0} Keys` },
          { label: 'Occupancy', value: `${summary?.occupancyPct ?? 0}%` },
          { label: 'Vacant Clean', value: `${summary?.vacantCleanCount ?? 0}` },
          { label: 'Vacant Dirty', value: `${summary?.vacantDirtyCount ?? 0}` },
        ],
      }
    );
    toast.success('Room Status Board exported as CSV!');
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            <MapPin size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              Front Desk · Visual Room Rack & Housekeeping Matrix
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Room Status Board
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time visual room matrix grouped by floor · Live occupancy, housekeeping readiness & quick folio actions
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 h-10 rounded-2xl border text-xs font-black flex items-center gap-1.5 transition-all ${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 border-white/10'
            }`}
            title="Auto-refresh room board every 30 seconds"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{autoRefresh ? 'Live (30s)' : 'Auto-Refresh Off'}</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            className="h-10 px-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            <FileDown size={13} />
            <span>PDF Board</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="h-10 px-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={fetchBoardData}
            title="Refresh Board"
            className={`w-10 h-10 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all ${
              loading ? 'animate-spin' : ''
            }`}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── KPI Stat Summary Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            label: 'Occupancy Rate',
            value: `${summary?.occupancyPct ?? 0}%`,
            subtext: `${summary?.occupiedCount ?? 0} of ${summary?.totalRooms ?? 0} Keys`,
            color: 'from-rose-500/20 via-rose-900/10 to-slate-900/40',
            border: 'border-rose-500/30',
            textColor: 'text-rose-400',
            badge: 'Occupied',
          },
          {
            label: 'Vacant Clean',
            value: `${summary?.vacantCleanCount ?? 0}`,
            subtext: 'Ready for check-in',
            color: 'from-emerald-500/20 via-emerald-900/10 to-slate-900/40',
            border: 'border-emerald-500/30',
            textColor: 'text-emerald-400',
            badge: 'Ready',
          },
          {
            label: 'Vacant Dirty',
            value: `${summary?.vacantDirtyCount ?? 0}`,
            subtext: 'Requires cleaning',
            color: 'from-amber-500/20 via-amber-900/10 to-slate-900/40',
            border: 'border-amber-500/30',
            textColor: 'text-amber-400',
            badge: 'Dirty',
          },
          {
            label: 'In Cleaning',
            value: `${summary?.inProgressCount ?? 0}`,
            subtext: 'Housekeeping active',
            color: 'from-sky-500/20 via-sky-900/10 to-slate-900/40',
            border: 'border-sky-500/30',
            textColor: 'text-sky-400',
            badge: 'In Progress',
          },
          {
            label: 'Inspection Pending',
            value: `${summary?.inspectionPendingCount ?? 0}`,
            subtext: 'Supervisor check',
            color: 'from-violet-500/20 via-violet-900/10 to-slate-900/40',
            border: 'border-violet-500/30',
            textColor: 'text-violet-400',
            badge: 'Inspection',
          },
          {
            label: 'Out of Order (OOO)',
            value: `${summary?.outOfOrderCount ?? 0}`,
            subtext: 'Maintenance hold',
            color: 'from-slate-700/20 via-slate-800/10 to-slate-900/40',
            border: 'border-slate-700/30',
            textColor: 'text-slate-400',
            badge: 'Blocked',
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-3xl bg-gradient-to-br ${s.color} border ${s.border} p-4 backdrop-blur-md shadow-lg`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-800/80 border border-white/5 ${s.textColor}`}>
                {s.badge}
              </span>
            </div>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{s.label}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">{s.subtext}</p>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Controls Bar ── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3.5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-md shadow-xl">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Room # (e.g. 101, 204), Room Type, or Guest Name…"
            className="w-full h-10 pl-10 pr-4 bg-slate-800/80 border border-white/10 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-2xl bg-slate-800 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Room States</option>
            <option value="OCCUPIED">Occupied Stay</option>
            <option value="CLEAN">Vacant Clean (Ready)</option>
            <option value="DIRTY">Vacant Dirty</option>
            <option value="IN_PROGRESS">Cleaning In-Progress</option>
            <option value="INSPECTION">Inspection Pending</option>
            <option value="OOO">Out of Order (OOO)</option>
          </select>

          {/* Floor Filter */}
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="h-10 px-3 rounded-2xl bg-slate-800 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Floors ({floors.length} Floors)</option>
            {floors.map((fl) => (
              <option key={fl} value={fl}>
                Floor {fl}
              </option>
            ))}
          </select>

          {/* Room Type Filter */}
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="h-10 px-3 rounded-2xl bg-slate-800 border border-white/10 text-white text-xs font-bold focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Room Types</option>
            {roomTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Floor Groupings & Interactive Room Board Matrix ── */}
      <div className="space-y-6">
        {floors
          .filter((fl) => selectedFloor === 'ALL' || selectedFloor === fl)
          .map((fl) => {
            const floorRooms = roomsByFloor[fl] || [];
            if (floorRooms.length === 0 && (statusFilter !== 'ALL' || searchQuery.trim())) {
              return null;
            }

            return (
              <div
                key={fl}
                className="rounded-3xl bg-slate-900/60 border border-white/10 p-5 backdrop-blur-md shadow-xl"
              >
                {/* Floor Header Bar */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-sm">
                      {fl}
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-white uppercase tracking-wider">
                        Floor {fl}
                      </h2>
                      <p className="text-[10px] text-slate-400">
                        {floorRooms.length} room{floorRooms.length !== 1 ? 's' : ''} on this level
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="font-bold text-rose-400">
                      {floorRooms.filter((r) => r.activeGuest || r.status === 'OCCUPIED').length} Occupied
                    </span>
                    <span>·</span>
                    <span className="font-bold text-emerald-400">
                      {floorRooms.filter((r) => r.housekeepingStatus === 'CLEAN' && !r.activeGuest).length} Clean
                    </span>
                    <span>·</span>
                    <span className="font-bold text-amber-400">
                      {floorRooms.filter((r) => r.housekeepingStatus === 'DIRTY').length} Dirty
                    </span>
                  </div>
                </div>

                {/* Rooms Grid for Floor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {floorRooms.map((room) => {
                    const isOccupied = Boolean(room.activeGuest) || room.status === 'OCCUPIED';
                    const isClean = room.housekeepingStatus === 'CLEAN';
                    const isDirty = room.housekeepingStatus === 'DIRTY';
                    const isInProgress = room.housekeepingStatus === 'IN_PROGRESS';
                    const isInspection = room.housekeepingStatus === 'INSPECTION_PENDING';
                    const isOOO = room.status === 'OUT_OF_ORDER' || room.maintenanceStatus === 'UNDER_MAINTENANCE';

                    // Visual card style
                    let cardBg = 'bg-slate-800/40 border-white/10 hover:border-indigo-500/40';
                    let statusLabel = 'Vacant Clean';
                    let statusBadgeStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

                    if (isOOO) {
                      cardBg = 'bg-slate-900/80 border-slate-700/60 opacity-80';
                      statusLabel = 'Out of Order';
                      statusBadgeStyle = 'bg-slate-700 text-slate-300 border-slate-600';
                    } else if (isOccupied) {
                      cardBg = 'bg-gradient-to-br from-rose-950/30 via-slate-900/60 to-slate-900/60 border-rose-500/30 hover:border-rose-500/60';
                      statusLabel = 'Occupied Stay';
                      statusBadgeStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                    } else if (isDirty) {
                      cardBg = 'bg-gradient-to-br from-amber-950/20 via-slate-900/60 to-slate-900/60 border-amber-500/30 hover:border-amber-500/60';
                      statusLabel = 'Vacant Dirty';
                      statusBadgeStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                    } else if (isInProgress) {
                      cardBg = 'bg-gradient-to-br from-sky-950/20 via-slate-900/60 to-slate-900/60 border-sky-500/30 hover:border-sky-500/60';
                      statusLabel = 'In Cleaning';
                      statusBadgeStyle = 'bg-sky-500/20 text-sky-300 border-sky-500/40';
                    } else if (isInspection) {
                      cardBg = 'bg-gradient-to-br from-violet-950/20 via-slate-900/60 to-slate-900/60 border-violet-500/30 hover:border-violet-500/60';
                      statusLabel = 'Inspection';
                      statusBadgeStyle = 'bg-violet-500/20 text-violet-300 border-violet-500/40';
                    }

                    return (
                      <div
                        key={room.id}
                        onClick={() => {
                          setSelectedRoom(room);
                          setActionModalOpen(true);
                        }}
                        className={`p-4 rounded-3xl border ${cardBg} cursor-pointer transition-all hover:scale-[1.02] hover:shadow-xl flex flex-col justify-between group`}
                      >
                        <div>
                          {/* Card Top: Room Number & Status Badge */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">
                                {room.roomNumber}
                              </span>
                              {room.isVIP && (
                                <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  VIP
                                </span>
                              )}
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadgeStyle}`}>
                              {statusLabel}
                            </span>
                          </div>

                          {/* Room Category */}
                          <p className="text-[10px] text-slate-400 font-bold mb-3 truncate">
                            {room.roomTypeName} · ₹{room.baseRate?.toLocaleString('en-IN')}/n
                          </p>

                          {/* Occupied Guest Info */}
                          {room.activeGuest ? (
                            <div className="p-2.5 rounded-2xl bg-slate-950/50 border border-white/5 space-y-1 mb-2">
                              <div className="flex items-center gap-1.5 text-xs font-black text-white truncate">
                                <User size={11} className="text-rose-400 flex-shrink-0" />
                                <span className="truncate">{room.activeGuest.guestName}</span>
                              </div>
                              <p className="text-[9px] text-slate-400">
                                {room.activeGuest.arrivalDate} → {room.activeGuest.departureDate}
                              </p>
                              {room.activeGuest.dueAmount > 0 && (
                                <p className="text-[9px] font-bold text-amber-400">
                                  Due: ₹{room.activeGuest.dueAmount.toLocaleString('en-IN')}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-2xl bg-slate-950/30 border border-white/5 text-[10px] text-slate-500 mb-2">
                              {isClean ? '✨ Clean & Inspected Ready' : isDirty ? '🧹 Housekeeping Pending' : '🔧 Maintenance'}
                            </div>
                          )}
                        </div>

                        {/* Card Bottom Meta */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500">
                          <span>Max {room.maxOccupancy} Guests</span>
                          <span className="text-indigo-400 font-bold group-hover:underline">Quick Action →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-16 rounded-3xl border border-white/5 bg-slate-900/40">
          <Bed size={32} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-400">No rooms match your filter criteria</p>
          <p className="text-xs text-slate-600 mt-0.5">Try changing the status, floor, or search filter</p>
        </div>
      )}

      {/* ── Visual Status Legend ── */}
      <div className="p-4 rounded-3xl bg-slate-900/60 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          Status Color Legend:
        </span>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">Occupied Stay</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Vacant Clean (Ready)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-300">Vacant Dirty</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span className="text-slate-300">In Cleaning</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
            <span className="text-slate-300">Inspection Pending</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
            <span className="text-slate-400">Out of Order</span>
          </div>
        </div>
      </div>

      {/* ── Room Quick Action Modal ── */}
      <RoomActionModal
        isOpen={actionModalOpen}
        onClose={() => {
          setActionModalOpen(false);
          setSelectedRoom(null);
        }}
        room={selectedRoom}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}
