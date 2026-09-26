'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BedDouble, Search, X, Users, CheckCircle2, 
  ArrowRight, Sparkles, Building, RefreshCw, AlertCircle
} from 'lucide-react';

export interface RoomOrderSelectTarget {
  id: string;
  roomNumber: string;
  floor: number;
  status: string;
  roomTypeName?: string;
  activeGuest?: {
    reservationId?: string;
    bookingNo?: string;
    guestName?: string;
    guestId?: string;
    phone?: string;
    status?: string;
  } | null;
}

interface SelectRoomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRoom?: (room: RoomOrderSelectTarget) => void;
  customRedirectBase?: string; // Default '/hotel/pos/billing'
}

export function SelectRoomOrderModal({
  isOpen,
  onClose,
  onSelectRoom,
  customRedirectBase = '/hotel/pos/billing',
}: SelectRoomOrderModalProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomOrderSelectTarget[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'OCCUPIED' | 'AVAILABLE'>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');

  // Fetch rooms with active guests
  const loadRoomsData = async () => {
    setLoading(true);
    try {
      // Primary: room board which has full guest association
      const res = await fetch('/api/hotel/rooms/board');
      const data = await res.json();

      if (data.success && data.data?.rooms) {
        setRooms(data.data.rooms);
        if (Array.isArray(data.data.floors) && data.data.floors.length > 0) {
          setFloors(data.data.floors);
        } else {
          const uniqueFloors = Array.from(new Set(data.data.rooms.map((r: any) => r.floor || 1))).sort((a: any, b: any) => a - b) as number[];
          setFloors(uniqueFloors);
        }
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
              });
            }
          });
        });

        const mapped: RoomOrderSelectTarget[] = rawRooms.map((r: any) => {
          const guest = bookingMap.get(r.id) || null;
          return {
            id: r.id,
            roomNumber: r.roomNumber,
            floor: parseInt(String(r.floor || '1')) || 1,
            status: guest ? 'OCCUPIED' : (r.status || 'AVAILABLE'),
            roomTypeName: r.roomType?.name || 'Standard Room',
            activeGuest: guest,
          };
        });

        setRooms(mapped);
        const uniqueFloors = Array.from(new Set(mapped.map((r) => r.floor))).sort((a, b) => a - b);
        setFloors(uniqueFloors);
      }
    } catch (err) {
      console.error('Failed to load hotel rooms for POS ordering:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRoomsData();
      setSearchQuery('');
      setSelectedFilter('ALL');
      setSelectedFloor('ALL');
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered rooms calculation
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = room.roomNumber.toLowerCase().includes(q);
        const matchGuest = room.activeGuest?.guestName?.toLowerCase().includes(q) || false;
        const matchType = room.roomTypeName?.toLowerCase().includes(q) || false;
        if (!matchNumber && !matchGuest && !matchType) return false;
      }

      // 2. Status Filter
      const isOccupied = room.status === 'OCCUPIED' || Boolean(room.activeGuest);
      if (selectedFilter === 'OCCUPIED' && !isOccupied) return false;
      if (selectedFilter === 'AVAILABLE' && isOccupied) return false;

      // 3. Floor Filter
      if (selectedFloor !== 'ALL' && room.floor !== selectedFloor) return false;

      return true;
    });
  }, [rooms, searchQuery, selectedFilter, selectedFloor]);

  // Counts
  const occupiedCount = useMemo(() => rooms.filter(r => r.status === 'OCCUPIED' || Boolean(r.activeGuest)).length, [rooms]);
  const availableCount = useMemo(() => rooms.length - occupiedCount, [rooms, occupiedCount]);

  const handleSelect = (room: RoomOrderSelectTarget) => {
    onClose();
    if (onSelectRoom) {
      onSelectRoom(room);
      return;
    }

    // Default redirect to POS billing
    const guestParam = room.activeGuest?.guestName ? `&guestName=${encodeURIComponent(room.activeGuest.guestName)}` : '';
    const bookingParam = room.activeGuest?.reservationId ? `&bookingId=${encodeURIComponent(room.activeGuest.reservationId)}` : '';
    const targetUrl = `${customRedirectBase}?type=ROOM_SERVICE&room=${encodeURIComponent(room.roomNumber)}&roomId=${encodeURIComponent(room.id)}${guestParam}${bookingParam}`;
    router.push(targetUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose} 
      />

      {/* Modal Dialog */}
      <div 
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-[#090d16] border border-indigo-500/30 rounded-3xl shadow-2xl shadow-indigo-950/60 overflow-hidden text-slate-100 z-10 animate-in zoom-in-95 duration-200"
      >
        {/* Top Header Bar */}
        <div className="relative px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center shadow-lg shadow-indigo-600/30 text-indigo-400">
              <BedDouble size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-black tracking-tight text-white">
                  Select Room for POS Order
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] font-black text-indigo-300 uppercase tracking-widest">
                  Room Service
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Choose an in-house or vacant room to place KOT and post food charges
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadRoomsData}
              disabled={loading}
              title="Refresh Room List"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 border border-white/10 transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 md:px-6 bg-[#0d1322] border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by room # (e.g. 102) or guest name..."
              autoFocus
              className="w-full h-10 pl-9 pr-8 text-xs font-semibold text-white bg-slate-900/90 border border-slate-700/80 rounded-xl focus:border-indigo-500 focus:outline-none placeholder:text-slate-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setSelectedFilter('ALL')}
              className={`h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedFilter === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5'
              }`}
            >
              All Rooms ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('OCCUPIED')}
              className={`h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap ${
                selectedFilter === 'OCCUPIED'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              In-House ({occupiedCount})
            </button>
            <button
              type="button"
              onClick={() => setSelectedFilter('AVAILABLE')}
              className={`h-8 px-3 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedFilter === 'AVAILABLE'
                  ? 'bg-slate-700 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'
              }`}
            >
              Available ({availableCount})
            </button>

            {/* Floor Filter Dropdown if more than 1 floor */}
            {floors.length > 1 && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-white/10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:inline">
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
          </div>
        </div>

        {/* Room Grid Display */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 min-h-[340px] max-h-[58vh]">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Loading Hotel Rooms & In-House Guests...
              </p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-center p-6 border border-dashed border-white/10 rounded-2xl">
              <AlertCircle size={32} className="text-slate-600 mb-1" />
              <h4 className="text-sm font-bold text-slate-300">No rooms found</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                {searchQuery
                  ? `No rooms or guests match "${searchQuery}". Try a different room number or name.`
                  : 'No rooms match the selected filters.'}
              </p>
              {(searchQuery || selectedFilter !== 'ALL' || selectedFloor !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('ALL');
                    setSelectedFloor('ALL');
                  }}
                  className="mt-2 text-xs font-bold text-indigo-400 hover:underline"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredRooms.map((room) => {
                const isOccupied = room.status === 'OCCUPIED' || Boolean(room.activeGuest);
                const guestName = room.activeGuest?.guestName;

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleSelect(room)}
                    className={`group relative text-left p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden active:scale-[0.98] ${
                      isOccupied
                        ? 'bg-gradient-to-b from-[#111c2e] to-[#0c1422] border-emerald-500/30 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-950/50'
                        : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850 hover:shadow-lg hover:shadow-indigo-950/30'
                    }`}
                  >
                    {/* Top Row: Room # & Status */}
                    <div className="flex items-start justify-between gap-1 w-full">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg md:text-xl font-black text-white group-hover:text-indigo-300 transition-colors">
                          {room.roomNumber}
                        </span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">
                          F{room.floor}
                        </span>
                      </div>

                      {isOccupied ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-tight flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          In-House
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[9px] font-bold text-slate-400 uppercase tracking-tight shrink-0">
                          Vacant
                        </span>
                      )}
                    </div>

                    {/* Middle: Room Type */}
                    <p className="text-[10px] font-bold text-slate-400 truncate mt-1">
                      {room.roomTypeName || 'Room'}
                    </p>

                    {/* Bottom: Guest Name or Quick Callout */}
                    <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs w-full">
                      {isOccupied && guestName ? (
                        <div className="flex flex-col min-w-0">
                          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                            Guest
                          </span>
                          <span className="text-[11px] font-black text-slate-100 truncate group-hover:text-emerald-300">
                            {guestName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 italic">
                          Vacant / Walk-in
                        </span>
                      )}

                      <div className="w-6 h-6 rounded-lg bg-white/5 group-hover:bg-indigo-600 text-slate-400 group-hover:text-white flex items-center justify-center transition-all shrink-0 ml-1">
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Notes */}
        <div className="px-6 py-3 bg-[#070b14] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Occupied Room (Supports Room Folio Billing)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Vacant Room (Immediate Cash/UPI/Card KOT)
            </span>
          </div>

          <div className="text-slate-500 font-medium">
            Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">ESC</kbd> to exit
          </div>
        </div>
      </div>
    </div>
  );
}
