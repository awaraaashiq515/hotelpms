'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BedDouble, Search, X, Users, CheckCircle2, 
  ArrowRight, Sparkles, Building, RefreshCw, AlertCircle,
  LayoutGrid, ArrowLeft, Plus, ShieldCheck, Utensils,
  ChevronRight, Filter, DoorOpen, Phone, Calendar, Clock
} from 'lucide-react';

export interface RoomOrderItem {
  id: string;
  roomNumber: string;
  floor: number;
  status: string;
  roomTypeName?: string;
  baseRate?: number;
  activeGuest?: {
    reservationId?: string;
    bookingNo?: string;
    guestName?: string;
    guestId?: string;
    phone?: string;
    status?: string;
    arrivalDate?: string;
    departureDate?: string;
  } | null;
}

export function RoomOrderFullPageView() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rooms, setRooms] = useState<RoomOrderItem[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OCCUPIED' | 'AVAILABLE'>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('ALL');
  const [viewDensity, setViewDensity] = useState<'comfortable' | 'compact'>('comfortable');

  // Load Rooms Data
  const loadRoomsData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Primary: room board which has full guest association & floors
      const res = await fetch('/api/hotel/rooms/board');
      const data = await res.json();

      if (data.success && data.data?.rooms) {
        setRooms(data.data.rooms);

        // Floors
        if (Array.isArray(data.data.floors) && data.data.floors.length > 0) {
          setFloors(data.data.floors);
        } else {
          const uniqueFloors = Array.from(new Set(data.data.rooms.map((r: any) => r.floor || 1))).sort((a: any, b: any) => a - b) as number[];
          setFloors(uniqueFloors);
        }

        // Room Types
        const types = Array.from(new Set(data.data.rooms.map((r: any) => r.roomTypeName || 'Standard'))).filter(Boolean) as string[];
        setRoomTypes(types);
      } else {
        // Fallback: fetch basic rooms & bookings
        const [roomsRes, bookingsRes] = await Promise.all([
          fetch('/api/hotel/rooms').then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/hotel/bookings').then(r => r.json()).catch(() => ({ data: [] })),
        ]);

        const rawRooms = Array.isArray(roomsRes) ? roomsRes : (roomsRes.data || []);
        const rawBookings = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes.data || []);
        const activeBookings = rawBookings.filter((b: any) => b.status === 'CHECKED_IN');

        const bookingMap = new Map<string, any>();
        activeBookings.forEach((b: any) => {
          b.rooms?.forEach((br: any) => {
            if (br.roomId) {
              bookingMap.set(br.roomId, {
                reservationId: b.id,
                bookingNo: b.bookingNo,
                guestName: b.guest ? `${b.guest.firstName} ${b.guest.lastName || ''}`.trim() : 'Guest',
                guestId: b.guestId,
                phone: b.guest?.mobile,
                status: b.status,
                arrivalDate: b.arrivalDate,
                departureDate: b.departureDate,
              });
            }
          });
        });

        const mapped: RoomOrderItem[] = rawRooms.map((r: any) => {
          const guest = bookingMap.get(r.id) || null;
          return {
            id: r.id,
            roomNumber: r.roomNumber,
            floor: parseInt(String(r.floor || '1')) || 1,
            status: guest ? 'OCCUPIED' : (r.status || 'AVAILABLE'),
            roomTypeName: r.roomType?.name || 'Standard Room',
            baseRate: r.roomType?.baseRate || 3000,
            activeGuest: guest,
          };
        });

        setRooms(mapped);
        const uniqueFloors = Array.from(new Set(mapped.map((r) => r.floor))).sort((a, b) => a - b);
        setFloors(uniqueFloors);

        const types = Array.from(new Set(mapped.map(r => r.roomTypeName || 'Standard'))).filter(Boolean);
        setRoomTypes(types);
      }
    } catch (err) {
      console.error('Failed to load hotel rooms for POS ordering:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRoomsData();
  }, []);

  // Filtered rooms calculation
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = room.roomNumber.toLowerCase().includes(q);
        const matchGuest = room.activeGuest?.guestName?.toLowerCase().includes(q) || false;
        const matchPhone = room.activeGuest?.phone?.toLowerCase().includes(q) || false;
        const matchType = room.roomTypeName?.toLowerCase().includes(q) || false;
        if (!matchNumber && !matchGuest && !matchPhone && !matchType) return false;
      }

      // 2. Status Filter
      const isOccupied = room.status === 'OCCUPIED' || Boolean(room.activeGuest);
      if (statusFilter === 'OCCUPIED' && !isOccupied) return false;
      if (statusFilter === 'AVAILABLE' && isOccupied) return false;

      // 3. Floor Filter
      if (selectedFloor !== 'ALL' && room.floor !== selectedFloor) return false;

      // 4. Room Type Filter
      if (selectedRoomType !== 'ALL' && room.roomTypeName !== selectedRoomType) return false;

      return true;
    });
  }, [rooms, searchQuery, statusFilter, selectedFloor, selectedRoomType]);

  // Statistics
  const totalRooms = rooms.length;
  const occupiedCount = useMemo(() => rooms.filter(r => r.status === 'OCCUPIED' || Boolean(r.activeGuest)).length, [rooms]);
  const availableCount = totalRooms - occupiedCount;
  const occupancyPercentage = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  // On Room Card Click -> Navigate to POS Billing for Room
  const handleSelectRoom = (room: RoomOrderItem) => {
    const guestParam = room.activeGuest?.guestName ? `&guestName=${encodeURIComponent(room.activeGuest.guestName)}` : '';
    const bookingParam = room.activeGuest?.reservationId ? `&bookingId=${encodeURIComponent(room.activeGuest.reservationId)}` : '';
    const targetUrl = `/hotel/pos/billing?type=ROOM_SERVICE&room=${encodeURIComponent(room.roomNumber)}&roomId=${encodeURIComponent(room.id)}${guestParam}${bookingParam}`;
    router.push(targetUrl);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* ── TOP NAVIGATION & HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Link
            href="/hotel"
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-sm shrink-0 active:scale-95"
            title="Back to Hotel Operations"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <BedDouble size={18} />
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                Room Service POS Ordering
              </h1>
              <span className="hidden sm:inline px-2.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                In-Room Dining
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              Select any guest room to open the POS terminal, generate kitchen KOTs, and charge to room folio
            </p>
          </div>
        </div>

        {/* Quick Nav Switches */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <Link
            href="/hotel/pos/tables"
            className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 shadow-sm"
          >
            <LayoutGrid size={14} className="text-amber-400" />
            <span>Table Layout (Dine In)</span>
          </Link>

          <Link
            href="/hotel/pos/billing"
            className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 shadow-sm"
          >
            <Plus size={14} className="text-emerald-400" />
            <span>Express Counter</span>
          </Link>

          <button
            onClick={() => loadRoomsData(true)}
            disabled={refreshing || loading}
            className="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
            title="Refresh room list"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-indigo-400' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        {/* Total Rooms */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1424] to-[#080d19] border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Rooms</p>
            <p className="text-2xl md:text-3xl font-black text-white mt-1">{totalRooms}</p>
            <span className="text-[10px] font-medium text-slate-500">Across {floors.length} Floor{floors.length > 1 ? 's' : ''}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Building size={22} />
          </div>
        </div>

        {/* In-House Occupied */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#091a1a] to-[#071313] border border-emerald-500/30 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">In-House Guests</p>
            <p className="text-2xl md:text-3xl font-black text-emerald-400 mt-1">{occupiedCount}</p>
            <span className="text-[10px] font-semibold text-emerald-500/80">Folio Billing Ready</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Users size={22} />
          </div>
        </div>

        {/* Available Rooms */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0c1424] to-[#080d19] border border-slate-800 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Available / Vacant</p>
            <p className="text-2xl md:text-3xl font-black text-slate-200 mt-1">{availableCount}</p>
            <span className="text-[10px] font-medium text-slate-500">Cash / UPI / Card KOT</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400">
            <DoorOpen size={22} />
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#120d24] to-[#0a0718] border border-violet-500/30 shadow-xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-violet-400">Occupancy Rate</p>
            <p className="text-2xl md:text-3xl font-black text-violet-300 mt-1">{occupancyPercentage}%</p>
            <span className="text-[10px] font-medium text-violet-400/80">Current In-House Load</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
            <Sparkles size={22} />
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH CONTROLS ── */}
      <div className="p-4 rounded-2xl bg-[#090e1a]/95 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room number (e.g. 102), guest name, or type..."
            className="w-full h-11 pl-10 pr-9 text-xs font-semibold text-white bg-slate-900/90 border border-slate-700/80 rounded-xl focus:border-indigo-500 focus:outline-none placeholder:text-slate-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({rooms.length})
            </button>
            <button
              onClick={() => setStatusFilter('OCCUPIED')}
              className={`h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                statusFilter === 'OCCUPIED'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-emerald-400 hover:bg-emerald-950/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              In-House ({occupiedCount})
            </button>
            <button
              onClick={() => setStatusFilter('AVAILABLE')}
              className={`h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                statusFilter === 'AVAILABLE'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Available ({availableCount})
            </button>
          </div>

          {/* Floor Filter Tabs */}
          {floors.length > 1 && (
            <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase px-2 hidden sm:inline">
                Floor:
              </span>
              <button
                onClick={() => setSelectedFloor('ALL')}
                className={`h-8 px-2.5 rounded-lg text-[10px] font-black transition-all ${
                  selectedFloor === 'ALL'
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {floors.map((fl) => (
                <button
                  key={fl}
                  onClick={() => setSelectedFloor(fl)}
                  className={`h-8 px-2.5 rounded-lg text-[10px] font-black transition-all ${
                    selectedFloor === fl
                      ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  F{fl}
                </button>
              ))}
            </div>
          )}

          {/* Room Type Selector */}
          {roomTypes.length > 1 && (
            <div className="relative">
              <select
                value={selectedRoomType}
                onChange={(e) => setSelectedRoomType(e.target.value)}
                className="h-10 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Categories</option>
                {roomTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── ROOMS GRID ── */}
      <div className="flex-1">
        {loading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Loading Hotel Rooms & In-House Guest Data...
            </p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center p-8 border border-dashed border-white/10 rounded-3xl text-center bg-[#090e1a]/40">
            <AlertCircle size={44} className="text-slate-600 mb-2" />
            <h3 className="text-base font-bold text-white">No rooms matched your criteria</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              {searchQuery
                ? `No room or guest matches "${searchQuery}". Please check the spelling or room number.`
                : 'No rooms match the selected floor or status filters.'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('ALL');
                setSelectedFloor('ALL');
                setSelectedRoomType('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 md:gap-4">
            {filteredRooms.map((room) => {
              const isOccupied = room.status === 'OCCUPIED' || Boolean(room.activeGuest);
              const guest = room.activeGuest;

              return (
                <div
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`group relative cursor-pointer p-4 rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden active:scale-[0.98] ${
                    isOccupied
                      ? 'bg-gradient-to-b from-[#111d2e] via-[#0d1624] to-[#080e18] border-emerald-500/35 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-950/60'
                      : 'bg-slate-900/70 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850 hover:shadow-2xl hover:shadow-indigo-950/40'
                  }`}
                >
                  {/* Top Bar: Room # & Status Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-1 w-full">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl md:text-3xl font-black text-white group-hover:text-indigo-300 transition-colors">
                          {room.roomNumber}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          F{room.floor}
                        </span>
                      </div>

                      {isOccupied ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          In-House
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/50 text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                          Vacant
                        </span>
                      )}
                    </div>

                    {/* Room Category */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[11px] font-bold text-slate-300 truncate">
                        {room.roomTypeName || 'Room'}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Guest & Booking Details if Occupied */}
                  <div className="my-3 py-2.5 border-y border-white/5 space-y-1">
                    {isOccupied && guest ? (
                      <>
                        <div className="flex items-center gap-1.5 text-xs text-slate-200">
                          <span className="text-[10px] uppercase font-bold text-slate-500">Guest:</span>
                          <span className="font-black text-white truncate group-hover:text-emerald-300 transition-colors">
                            {guest.guestName || 'Guest Customer'}
                          </span>
                        </div>
                        {guest.bookingNo && (
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            #{guest.bookingNo}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 pt-0.5">
                          <CheckCircle2 size={11} />
                          <span>Room Folio Linked</span>
                        </div>
                      </>
                    ) : (
                      <div className="py-2 text-center">
                        <span className="text-[11px] font-medium text-slate-500 italic">
                          Ready for Walk-in or Guest
                        </span>
                        <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">
                          Immediate Settlement
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bottom: Action CTA Button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors">
                      {isOccupied ? 'Take Room Order' : 'Order to Room'}
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all shadow-md group-hover:shadow-indigo-600/40">
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER GUIDELINES ── */}
      <div className="p-4 rounded-2xl bg-[#090e1a]/80 border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-300">Occupied Room:</span>
            <span>Food order automatically tags to guest and posts to active room folio.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="font-semibold text-slate-300">Vacant Room:</span>
            <span>Allows fast kitchen KOT with direct Cash / Card / UPI settlement.</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          Showing <span className="text-white font-bold">{filteredRooms.length}</span> of <span className="text-white font-bold">{totalRooms}</span> rooms
        </div>
      </div>
    </div>
  );
}
