'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Bell,
  Coffee,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Users,
  BedDouble,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Printer,
  Sparkles,
  Phone,
  ArrowLeft,
  Crown,
  ChefHat,
  ConciergeBell,
  Check,
  Layers,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface RoomMealInfo {
  id: string;
  bookingNo: string;
  status: string;
  roomId: string | null;
  roomNumber: string;
  floor: string;
  roomTypeName: string;
  guestId: string;
  guestName: string;
  guestMobile: string;
  adults: number;
  extraAdults: number;
  children: number;
  totalPax: number;
  mealPlan: 'EP' | 'CP' | 'MAP' | 'AP';
  mealPlanName: string;
  mealPlanBadge: string;
  mealPlanColor: string;
  includedMeals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
  extraBed: boolean;
  extraBedCharge: number;
  specialRequests: string;
  arrivalDate: string;
  departureDate: string;
  activeTasksCount: number;
}

interface LiveServiceCall {
  id: string;
  kind: 'HOUSEKEEPING' | 'ROOM_SERVICE' | 'WAITER_CALL';
  title: string;
  roomNumber: string;
  taskType: string;
  notes: string;
  priority: string;
  status: string;
  totalAmount?: number;
  createdAt: string;
  source: string;
}

interface SummaryData {
  totalRoomsOccupied: number;
  totalPax: number;
  totalAdults: number;
  totalChildren: number;
  plans: {
    EP: { count: number; pax: number };
    CP: { count: number; pax: number };
    MAP: { count: number; pax: number };
    AP: { count: number; pax: number };
  };
  pendingCallsCount: number;
}

export default function MealAndServiceHubPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const [summary, setSummary] = useState<SummaryData>({
    totalRoomsOccupied: 0,
    totalPax: 0,
    totalAdults: 0,
    totalChildren: 0,
    plans: {
      EP: { count: 0, pax: 0 },
      CP: { count: 0, pax: 0 },
      MAP: { count: 0, pax: 0 },
      AP: { count: 0, pax: 0 },
    },
    pendingCallsCount: 0,
  });

  const [rooms, setRooms] = useState<RoomMealInfo[]>([]);
  const [liveCalls, setLiveCalls] = useState<LiveServiceCall[]>([]);

  // Navigation & Filter States
  const [activeTab, setActiveTab] = useState<'all' | 'calls' | 'kitchen'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<'ALL' | 'EP' | 'CP' | 'MAP' | 'AP'>('ALL');
  const [selectedCallType, setSelectedCallType] = useState<'ALL' | 'HOUSEKEEPING' | 'ROOM_SERVICE' | 'WAITER_CALL'>('ALL');
  const [updatingCallId, setUpdatingCallId] = useState<string | null>(null);

  // Fetch data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/hotel/meal-and-service-hub');
      const data = await res.json();
      if (data.success && data.data) {
        setSummary(data.data.summary);
        setRooms(data.data.rooms || []);
        setLiveCalls(data.data.liveCalls || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching meal and service hub data:', err);
      if (isManual) toast.error('Failed to update live hub data');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval (every 20s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Mark a service call as completed
  const handleMarkCallCompleted = async (call: LiveServiceCall) => {
    setUpdatingCallId(call.id);
    try {
      const res = await fetch('/api/hotel/meal-and-service-hub', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: call.id,
          kind: call.kind,
          status: 'COMPLETED',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Room ${call.roomNumber} request marked completed!`);
        // Optimistically update
        setLiveCalls((prev) => prev.map((c) => (c.id === call.id ? { ...c, status: 'COMPLETED' } : c)));
      } else {
        toast.error(data.message || 'Failed to update request');
      }
    } catch {
      toast.error('Network error updating request');
    } finally {
      setUpdatingCallId(null);
    }
  };

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const matchesSearch =
        r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.bookingNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.roomTypeName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPlan = selectedPlanFilter === 'ALL' || r.mealPlan === selectedPlanFilter;

      return matchesSearch && matchesPlan;
    });
  }, [rooms, searchQuery, selectedPlanFilter]);

  // Filtered live calls
  const filteredLiveCalls = useMemo(() => {
    return liveCalls.filter((c) => {
      const matchesType = selectedCallType === 'ALL' || c.kind === selectedCallType;
      const matchesSearch =
        c.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [liveCalls, selectedCallType, searchQuery]);

  // Kitchen headcounts calculation
  const kitchenCounts = useMemo(() => {
    const breakfastPax = summary.plans.CP.pax + summary.plans.MAP.pax + summary.plans.AP.pax;
    const lunchPax = summary.plans.AP.pax;
    const dinnerPax = summary.plans.MAP.pax + summary.plans.AP.pax;

    const breakfastRooms = summary.plans.CP.count + summary.plans.MAP.count + summary.plans.AP.count;
    const lunchRooms = summary.plans.AP.count;
    const dinnerRooms = summary.plans.MAP.count + summary.plans.AP.count;

    return {
      breakfast: { pax: breakfastPax, rooms: breakfastRooms },
      lunch: { pax: lunchPax, rooms: lunchRooms },
      dinner: { pax: dinnerPax, rooms: dinnerRooms },
    };
  }, [summary]);

  const getTimeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/hotel"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Return to Hotel Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <UtensilsCrossed className="w-5 h-5" />
                </span>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                  Meal Plan &amp; In-Room Service Hub
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center gap-1.5 shadow-sm shadow-emerald-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Monitor
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time room occupancy, dining meal plans (EP, CP, MAP, AP) &amp; in-room guest service calls.
              </p>
            </div>
          </div>
        </div>

        {/* Live Controls & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              autoRefresh
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{autoRefresh ? 'Auto 20s' : 'Auto Paused'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Print Sheet */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* ── Executive Summary KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total In-House */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Occupied Rooms</span>
            <BedDouble className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{summary.totalRoomsOccupied}</div>
          <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Users className="w-3 h-3 text-indigo-400" />
            <span>{summary.totalPax} In-House Pax</span>
          </div>
        </div>

        {/* EP Plan */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">EP (Room Only)</span>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">EP</span>
          </div>
          <div className="text-2xl font-black text-slate-200">{summary.plans.EP.count} <span className="text-xs font-medium text-slate-500">rms</span></div>
          <div className="text-[11px] text-slate-400 font-medium">
            {summary.plans.EP.pax} Guests (No meals)
          </div>
        </div>

        {/* CP Plan (Breakfast) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 border border-amber-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">CP (Breakfast)</span>
            <Coffee className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{summary.plans.CP.count} <span className="text-xs font-medium text-amber-400/70">rms</span></div>
          <div className="text-[11px] text-amber-300 font-medium">
            🥐 {summary.plans.CP.pax} Breakfast Pax
          </div>
        </div>

        {/* MAP Plan (Half Board) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-950/20 via-slate-900 to-slate-950 border border-sky-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">MAP (Half Board)</span>
            <ChefHat className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-300">{summary.plans.MAP.count} <span className="text-xs font-medium text-sky-400/70">rms</span></div>
          <div className="text-[11px] text-sky-300 font-medium">
            🍲 {summary.plans.MAP.pax} Bfast + Dinner Pax
          </div>
        </div>

        {/* AP Plan (Full Board) */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">AP (Full Board)</span>
            <Crown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300">{summary.plans.AP.count} <span className="text-xs font-medium text-emerald-400/70">rms</span></div>
          <div className="text-[11px] text-emerald-300 font-medium">
            👑 {summary.plans.AP.pax} All Meals Pax
          </div>
        </div>

        {/* Pending Service Calls */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-950 border border-rose-500/30 space-y-1.5">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Live Calls</span>
            <ConciergeBell className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-300">{summary.pendingCallsCount} <span className="text-xs font-medium text-rose-400/70">pending</span></div>
          <div className="text-[11px] text-rose-300 font-medium">
            🛎️ In-Room Waiter / Cleaning
          </div>
        </div>
      </div>

      {/* ── Tab Switcher & Search Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-[#00b894] text-white shadow-md shadow-[#00b894]/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Room Meal Plans ({rooms.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calls')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === 'calls'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ConciergeBell className="w-3.5 h-3.5" />
            <span>Live Service Calls</span>
            {summary.pendingCallsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-white text-rose-600">
                {summary.pendingCallsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kitchen')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'kitchen'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Kitchen Prep Sheet</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search room no, guest name..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00b894]"
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: ALL ROOMS & MEAL PLAN SELECTION BOARD
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Plan Category Filter Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Plan Filter:</span>
            {[
              { id: 'ALL', label: 'All Plans', count: rooms.length },
              { id: 'EP', label: 'EP (Room Only)', count: summary.plans.EP.count },
              { id: 'CP', label: 'CP (Breakfast)', count: summary.plans.CP.count },
              { id: 'MAP', label: 'MAP (Half Board)', count: summary.plans.MAP.count },
              { id: 'AP', label: 'AP (Full Board)', count: summary.plans.AP.count },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedPlanFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedPlanFilter === f.id
                    ? 'bg-slate-100 text-slate-900 border-white shadow-md'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Rooms Grid */}
          {loading ? (
            <div className="py-20 text-center text-slate-500">Loading live meal plan board...</div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/30 rounded-3xl border border-slate-800 text-slate-500">
              No occupied rooms match the selected criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredRooms.map((r) => {
                const planBadgeStyles =
                  r.mealPlan === 'AP'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 ring-1 ring-emerald-500/20'
                    : r.mealPlan === 'MAP'
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 ring-1 ring-sky-500/20'
                    : r.mealPlan === 'CP'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700';

                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#0b1120] border border-slate-800/90 hover:border-slate-700 space-y-3.5 shadow-xl transition-all"
                  >
                    {/* Top Row: Room Number & Plan Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base font-black text-white">Room {r.roomNumber}</span>
                          {r.floor && (
                            <span className="text-[10px] font-bold text-slate-500 px-1.5 py-0.2 rounded bg-slate-800/80">
                              Fl. {r.floor}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block truncate max-w-[170px] mt-0.5">
                          {r.roomTypeName}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border ${planBadgeStyles}`}>
                          {r.mealPlan}
                        </span>
                        <span className="text-[9px] text-slate-500 block mt-1 font-mono">{r.bookingNo}</span>
                      </div>
                    </div>

                    {/* Guest Information & Pax */}
                    <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-200">
                        <span className="font-bold truncate max-w-[150px]">{r.guestName}</span>
                        <span className="font-extrabold text-white px-1.5 py-0.5 rounded bg-slate-800 text-[11px]">
                          {r.totalPax} Pax
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>
                          {r.adults} Adult{r.adults > 1 ? 's' : ''}
                          {r.extraAdults > 0 ? ` (+${r.extraAdults} Extra)` : ''}
                          {r.children > 0 ? `, ${r.children} Ch.` : ''}
                        </span>
                        {r.extraBed && <span className="text-teal-400 font-bold">🛏️ Extra Bed</span>}
                      </div>
                    </div>

                    {/* Included Meals Indicator Matrix */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Included In Tariff:
                      </span>
                      <div className="grid grid-cols-3 gap-1.5 text-[11px] font-bold">
                        {/* Breakfast */}
                        <div
                          className={`p-1.5 rounded-lg border text-center transition-colors ${
                            r.includedMeals.breakfast
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : 'bg-slate-900/40 border-slate-800/60 text-slate-600'
                          }`}
                        >
                          <span className="text-xs block">🥐</span>
                          <span className="text-[9px]">Breakfast</span>
                          <span className="text-[8px] block">{r.includedMeals.breakfast ? 'INCLUDED' : '—'}</span>
                        </div>

                        {/* Lunch */}
                        <div
                          className={`p-1.5 rounded-lg border text-center transition-colors ${
                            r.includedMeals.lunch
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                              : 'bg-slate-900/40 border-slate-800/60 text-slate-600'
                          }`}
                        >
                          <span className="text-xs block">🥗</span>
                          <span className="text-[9px]">Lunch</span>
                          <span className="text-[8px] block">{r.includedMeals.lunch ? 'INCLUDED' : '—'}</span>
                        </div>

                        {/* Dinner */}
                        <div
                          className={`p-1.5 rounded-lg border text-center transition-colors ${
                            r.includedMeals.dinner
                              ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                              : 'bg-slate-900/40 border-slate-800/60 text-slate-600'
                          }`}
                        >
                          <span className="text-xs block">🍲</span>
                          <span className="text-[9px]">Dinner</span>
                          <span className="text-[8px] block">{r.includedMeals.dinner ? 'INCLUDED' : '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Special Requests or Dietary remarks */}
                    {r.specialRequests && (
                      <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-[10px] text-amber-300">
                        💬 <strong className="text-amber-200">Notes:</strong> {r.specialRequests}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: LIVE IN-ROOM GUEST SERVICE CALLS & HOUSEKEEPING FEED
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'calls' && (
        <div className="space-y-4">
          {/* Call Type Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service Filter:</span>
            {[
              { id: 'ALL', label: 'All Live Calls' },
              { id: 'ROOM_SERVICE', label: '🛎️ Waiter / Food Service' },
              { id: 'HOUSEKEEPING', label: '🧹 Housekeeping / Cleaning' },
              { id: 'WAITER_CALL', label: '📞 Direct Room Calls' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedCallType(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedCallType === f.id
                    ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Calls List */}
          {filteredLiveCalls.length === 0 ? (
            <div className="p-16 text-center bg-slate-900/30 rounded-3xl border border-slate-800 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">All Clear! No Pending Guest Requests</h3>
              <p className="text-xs text-slate-500">
                All waiter dining orders and housekeeping requests have been attended to.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLiveCalls.map((call) => {
                const isPending = call.status === 'PENDING' || call.status === 'UNREAD';
                const isUpdating = updatingCallId === call.id;

                return (
                  <div
                    key={call.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isPending
                        ? 'bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-950 border-rose-500/40 shadow-lg shadow-rose-500/5'
                        : 'bg-slate-900/50 border-slate-800 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-extrabold text-sm">
                          Rm {call.roomNumber}
                        </span>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            {call.kind.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-bold text-white">{call.taskType}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isPending
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {call.status}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 justify-end mt-1">
                          <Clock className="w-3 h-3" /> {getTimeAgo(call.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200">
                      <p className="font-medium leading-relaxed">{call.notes || call.title}</p>
                      {call.totalAmount ? (
                        <div className="text-emerald-400 font-bold mt-1.5 text-xs">
                          Bill: ₹{call.totalAmount.toLocaleString('en-IN')}
                        </div>
                      ) : null}
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 font-mono">Source: In-Room Kiosk</span>
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => handleMarkCallCompleted(call)}
                          disabled={isUpdating}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>{isUpdating ? 'Marking...' : 'Mark Attended'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: KITCHEN & DINING PREPARATION SHEET
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'kitchen' && (
        <div className="space-y-6">
          {/* Kitchen Headcount Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Breakfast */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-950 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Coffee className="w-4 h-4" /> Morning Breakfast Buffet
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  CP + MAP + AP
                </span>
              </div>
              <div className="text-3xl font-black text-amber-300">
                {kitchenCounts.breakfast.pax} <span className="text-sm font-semibold text-slate-400">Total Pax</span>
              </div>
              <p className="text-xs text-slate-400">
                Across <strong>{kitchenCounts.breakfast.rooms} Rooms</strong> ({summary.plans.CP.pax} CP, {summary.plans.MAP.pax} MAP, {summary.plans.AP.pax} AP)
              </p>
            </div>

            {/* Lunch */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4" /> Afternoon Lunch Spread
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  AP Only
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-300">
                {kitchenCounts.lunch.pax} <span className="text-sm font-semibold text-slate-400">Total Pax</span>
              </div>
              <p className="text-xs text-slate-400">
                Across <strong>{kitchenCounts.lunch.rooms} Rooms</strong> on Full Board
              </p>
            </div>

            {/* Dinner */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-950/20 via-slate-900 to-slate-950 border border-sky-500/30 space-y-2">
              <div className="flex items-center justify-between text-sky-400">
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4" /> Evening Dinner Buffet
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">
                  MAP + AP
                </span>
              </div>
              <div className="text-3xl font-black text-sky-300">
                {kitchenCounts.dinner.pax} <span className="text-sm font-semibold text-slate-400">Total Pax</span>
              </div>
              <p className="text-xs text-slate-400">
                Across <strong>{kitchenCounts.dinner.rooms} Rooms</strong> ({summary.plans.MAP.pax} MAP, {summary.plans.AP.pax} AP)
              </p>
            </div>
          </div>

          {/* Kitchen Printable Table */}
          <div className="rounded-3xl bg-[#0f172a]/60 border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-emerald-400" />
                Executive Chef Live Room Attendance Roster
              </h3>
              <span className="text-xs text-slate-400">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="p-3.5 pl-5">Room #</th>
                    <th className="p-3.5">Guest Name</th>
                    <th className="p-3.5">Pax Count</th>
                    <th className="p-3.5">Meal Plan</th>
                    <th className="p-3.5 text-center">Breakfast</th>
                    <th className="p-3.5 text-center">Lunch</th>
                    <th className="p-3.5 text-center">Dinner</th>
                    <th className="p-3.5 pr-5">Chef Remarks / Special Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {rooms.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-3.5 pl-5 font-black text-white">
                        Room {r.roomNumber}
                        <span className="text-[10px] text-slate-500 font-normal block">{r.roomTypeName}</span>
                      </td>
                      <td className="p-3.5 font-bold">{r.guestName}</td>
                      <td className="p-3.5">
                        <span className="font-extrabold text-white">{r.totalPax} Pax</span>
                        <span className="text-[10px] text-slate-400 block">
                          ({r.adults}A{r.extraAdults > 0 ? `+${r.extraAdults}Ex` : ''}{r.children > 0 ? `+${r.children}C` : ''})
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          r.mealPlan === 'AP' ? 'bg-emerald-500/20 text-emerald-300' :
                          r.mealPlan === 'MAP' ? 'bg-sky-500/20 text-sky-300' :
                          r.mealPlan === 'CP' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {r.mealPlan}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-bold">
                        {r.includedMeals.breakfast ? (
                          <span className="text-emerald-400 font-black">✓ YES</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold">
                        {r.includedMeals.lunch ? (
                          <span className="text-emerald-400 font-black">✓ YES</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold">
                        {r.includedMeals.dinner ? (
                          <span className="text-emerald-400 font-black">✓ YES</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="p-3.5 pr-5 text-slate-400">
                        {r.specialRequests ? (
                          <span className="text-amber-300 font-medium">💬 {r.specialRequests}</span>
                        ) : (
                          <span className="text-slate-600 italic">Standard</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
