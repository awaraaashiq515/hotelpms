'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles, Search, RefreshCw, CheckCircle2, Clock, AlertTriangle,
  ArrowLeft, BedDouble, User, Filter, ShieldCheck, Check
} from 'lucide-react';

interface HousekeepingRoom {
  id: string;
  roomNumber: string;
  floor?: number | string;
  status: string; // 'VACANT' | 'OCCUPIED'
  cleanlinessStatus: string; // 'CLEAN' | 'DIRTY' | 'CLEANING' | 'INSPECTED'
  roomType?: { name: string };
  assignedStaff?: string;
  lastCleanedAt?: string;
}

function HotelAdminHousekeepingContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const propertyCode = (params?.propertyCode as string) || '';
  const initialStatus = searchParams?.get('status') || 'ALL';

  const [rooms, setRooms] = useState<HousekeepingRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hotel/rooms`);
      const data = await res.json();
      if (data && data.success && Array.isArray(data.data)) {
        setRooms(data.data);
      } else if (Array.isArray(data)) {
        setRooms(data);
      }
    } catch (e) {
      console.error('Failed to load housekeeping rooms', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter((r) => {
    const cleanStatus = r.cleanlinessStatus?.toUpperCase() || 'CLEAN';
    const q = (searchQuery || '').toLowerCase();
    const roomNum = (r.roomNumber || '').toLowerCase();
    const typeName = (r.roomType?.name || '').toLowerCase();

    const matchesSearch =
      !q ||
      roomNum.includes(q) ||
      typeName.includes(q);

    const matchesStatus =
      statusFilter === 'ALL' || cleanStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalRooms = rooms.length;
  const cleanCount = rooms.filter((r) => (r.cleanlinessStatus || 'CLEAN').toUpperCase() === 'CLEAN').length;
  const dirtyCount = rooms.filter((r) => r.cleanlinessStatus?.toUpperCase() === 'DIRTY').length;
  const cleaningCount = rooms.filter((r) => r.cleanlinessStatus?.toUpperCase() === 'CLEANING').length;
  const inspectedCount = rooms.filter((r) => r.cleanlinessStatus?.toUpperCase() === 'INSPECTED').length;

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
            <Sparkles className="text-amber-500" size={26} />
            Housekeeping & Cleanliness Overview
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor room sanitation, turnover readiness, and cleaning operations
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
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Clean & Ready</p>
          <p className="text-2xl font-black text-emerald-500 mt-1">{cleanCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Available for guests</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Dirty / Turnover</p>
          <p className="text-2xl font-black text-rose-500 mt-1">{dirtyCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Needs cleaning</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-500">In Cleaning</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{cleaningCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Housekeeper working</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-blue-500/20 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-500">Inspected / Verified</p>
          <p className="text-2xl font-black text-blue-500 mt-1">{inspectedCount}</p>
          <p className="text-[10px] text-slate-400 mt-1">Supervisor approved</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'All Rooms' },
            { id: 'DIRTY', label: '🧹 Dirty Queue' },
            { id: 'CLEANING', label: '🔄 In Progress' },
            { id: 'CLEAN', label: '✨ Clean' },
            { id: 'INSPECTED', label: '🛡️ Inspected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search room number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-amber-500 outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Housekeeping Data...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Sparkles className="mx-auto text-slate-400 mb-3" size={40} />
          <p className="font-bold text-slate-700 dark:text-slate-300">No rooms match this status</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredRooms.map((room) => {
            const cleanStatus = (room.cleanlinessStatus || 'CLEAN').toUpperCase();
            const isDirty = cleanStatus === 'DIRTY';
            const isCleaning = cleanStatus === 'CLEANING';
            const isInspected = cleanStatus === 'INSPECTED';

            return (
              <div
                key={room.id}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  isDirty
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : isCleaning
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : isInspected
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {room.roomNumber}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isDirty
                          ? 'bg-rose-500 text-white'
                          : isCleaning
                          ? 'bg-amber-500 text-white'
                          : isInspected
                          ? 'bg-blue-500 text-white'
                          : 'bg-emerald-500/15 text-emerald-500'
                      }`}
                    >
                      {cleanStatus}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-slate-500 truncate">
                    {room.roomType?.name || 'Standard Room'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Floor {room.floor || 1}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-[9px] font-bold text-slate-400">
                    Occupancy: {room.status === 'OCCUPIED' ? '🟣 In Use' : '🟢 Vacant'}
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

export default function HotelAdminHousekeepingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="animate-spin text-amber-500 mb-3" size={32} />
          <p className="text-xs font-bold uppercase tracking-wider">Loading Housekeeping Data...</p>
        </div>
      }
    >
      <HotelAdminHousekeepingContent />
    </Suspense>
  );
}
