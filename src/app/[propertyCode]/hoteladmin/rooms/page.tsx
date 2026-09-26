'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BedDouble, Search, RefreshCw, CheckCircle2, Clock, Sparkles,
  AlertTriangle, Filter, ArrowLeft, Building2, User, Layers,
  DoorOpen, ShieldCheck, Phone
} from 'lucide-react';

interface Room {
  id: string;
  roomNumber: string;
  floor?: number | string | null;
  status: string; // 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'BLOCKED'
  cleanlinessStatus?: string; // 'CLEAN' | 'DIRTY' | 'CLEANING' | 'INSPECTED'
  roomType?: {
    name: string;
    basePrice: number;
    capacity?: number;
  };
  currentGuest?: {
    name: string;
    phone?: string;
    checkIn?: string;
    checkOut?: string;
  };
}

export default function HotelAdminRoomsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyCode = (params?.propertyCode as string) || '';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [cleanFilter, setCleanFilter] = useState<string>('ALL');
  const [floorFilter, setFloorFilter] = useState<string>('ALL');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotel/rooms`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRooms(data.data);
      }
    } catch (e) {
      console.error('Failed to load rooms', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  // Filter logic
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomType?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.currentGuest?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || r.status?.toUpperCase() === statusFilter;

    const matchesClean =
      cleanFilter === 'ALL' || r.cleanlinessStatus?.toUpperCase() === cleanFilter;

    const matchesFloor =
      floorFilter === 'ALL' || String(r.floor || '') === floorFilter;

    return matchesSearch && matchesStatus && matchesClean && matchesFloor;
  });

  // Unique floors
  const floors = Array.from(new Set(rooms.map((r) => String(r.floor || 1)))).sort();

  // Metrics
  const totalRooms = rooms.length;
  const occupiedCount = rooms.filter((r) => r.status?.toUpperCase() === 'OCCUPIED').length;
  const vacantCount = rooms.filter((r) => r.status?.toUpperCase() === 'VACANT' || !r.status).length;
  const dirtyCount = rooms.filter((r) => r.cleanlinessStatus?.toUpperCase() === 'DIRTY').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
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
            Hotel Rooms & Occupancy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time room inventory, live guest status, and cleanliness overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRooms}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Rooms</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalRooms}</p>
          <p className="text-[10px] text-slate-400 mt-1">Configured inventory</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">Occupied</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-amber-500">{occupiedCount}</p>
            <span className="text-xs font-black text-amber-400">({occupancyRate}%)</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">In-house guests</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Available</p>
          <p className="text-2xl font-black text-emerald-500 mt-1">{vacantCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Ready for check-in</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Housekeeping Needed</p>
          <p className="text-2xl font-black text-rose-500 mt-1">{dirtyCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Rooms marked dirty</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search room #, type, guest..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-amber-500 outline-none transition-all dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-bold text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="OCCUPIED">🟣 Occupied</option>
            <option value="VACANT">🟢 Vacant</option>
            <option value="MAINTENANCE">🔧 Maintenance</option>
          </select>

          {/* Cleanliness Filter */}
          <select
            value={cleanFilter}
            onChange={(e) => setCleanFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border-none font-bold text-slate-700 dark:text-slate-200 outline-none"
          >
            <option value="ALL">All Cleanliness</option>
            <option value="CLEAN">✨ Clean</option>
            <option value="DIRTY">🧹 Dirty</option>
            <option value="CLEANING">🔄 Cleaning</option>
          </select>

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

      {/* Room Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Room Inventory...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <BedDouble className="mx-auto text-slate-400 mb-3" size={40} />
          <p className="font-bold text-slate-700 dark:text-slate-300">No rooms match your filter</p>
          <p className="text-xs text-slate-400 mt-1">Try resetting the status or search filter</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setCleanFilter('ALL');
              setFloorFilter('ALL');
            }}
            className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredRooms.map((room) => {
            const isOccupied = room.status?.toUpperCase() === 'OCCUPIED';
            const isMaintenance = room.status?.toUpperCase() === 'MAINTENANCE';
            const isDirty = room.cleanlinessStatus?.toUpperCase() === 'DIRTY';

            return (
              <div
                key={room.id}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isOccupied
                    ? 'bg-purple-500/10 border-purple-500/30 dark:bg-purple-950/20'
                    : isMaintenance
                    ? 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-950/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                <div>
                  {/* Top Bar: Room # + Status Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {room.roomNumber}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isOccupied
                          ? 'bg-purple-500 text-white'
                          : isMaintenance
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-500/15 text-emerald-500'
                      }`}
                    >
                      {isOccupied ? 'Occupied' : isMaintenance ? 'Maint' : 'Vacant'}
                    </span>
                  </div>

                  {/* Room Type */}
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {room.roomType?.name || 'Standard Room'}
                  </p>

                  {/* Floor and Price */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>Floor {room.floor || 1}</span>
                    {room.roomType?.basePrice ? (
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        ₹{room.roomType.basePrice}
                      </span>
                    ) : null}
                  </div>

                  {/* Current Guest info if occupied */}
                  {isOccupied && room.currentGuest && (
                    <div className="mt-2.5 pt-2 border-t border-purple-500/20 text-[10px]">
                      <div className="flex items-center gap-1 font-bold text-purple-700 dark:text-purple-300 truncate">
                        <User size={10} />
                        <span className="truncate">{room.currentGuest.name}</span>
                      </div>
                      {room.currentGuest.checkOut && (
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          Out: {new Date(room.currentGuest.checkOut).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Cleanliness Badge */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span
                    className={`text-[9px] font-bold flex items-center gap-1 ${
                      isDirty
                        ? 'text-rose-500'
                        : room.cleanlinessStatus?.toUpperCase() === 'CLEANING'
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    {isDirty ? (
                      <>
                        <Sparkles size={10} className="text-rose-500" />
                        Dirty
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={10} className="text-emerald-500" />
                        Clean
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
