'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Bell,
  Coffee,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
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
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Radio,
  Flame,
  Sun,
  Moon,
  Layers,
  Filter,
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

// ── Web Audio API Synthesizer Chime ──────────────────────────────────────────
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.45);
  } catch {}
}

export default function MealAndServiceHubLiveDisplay() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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
  const previousCallsCountRef = useRef(0);

  // Filters & layout state
  const [viewMode, setViewMode] = useState<'SPLIT' | 'ROOMS' | 'CALLS' | 'CHEF'>('SPLIT');
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'EP' | 'CP' | 'MAP' | 'AP'>('ALL');
  const [updatingCallId, setUpdatingCallId] = useState<string | null>(null);

  // Live Clock Ticker
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch Hub Data
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/hotel/meal-and-service-hub');
      const data = await res.json();
      if (data.success && data.data) {
        const newSummary = data.data.summary;
        const newCalls: LiveServiceCall[] = data.data.liveCalls || [];

        // Check for new incoming calls to sound chime
        const pendingCount = newCalls.filter((c) => c.status === 'PENDING' || c.status === 'UNREAD').length;
        if (soundEnabled && pendingCount > previousCallsCountRef.current && !loading) {
          playChime();
        }
        previousCallsCountRef.current = pendingCount;

        setSummary(newSummary);
        setRooms(data.data.rooms || []);
        setLiveCalls(newCalls);
      }
    } catch (err) {
      console.error('Error fetching live display data:', err);
      if (isManual) toast.error('Failed to update live display data');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [loading, soundEnabled]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh interval (every 15s for live display feel)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFSEvent = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFSEvent);
    return () => document.removeEventListener('fullscreenchange', handleFSEvent);
  }, []);

  // Mark Call as Attended/Completed
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
        toast.success(`Room ${call.roomNumber} request attended!`);
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
        r.roomTypeName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlan = planFilter === 'ALL' || r.mealPlan === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [rooms, searchQuery, planFilter]);

  // Active pending calls
  const pendingCalls = useMemo(() => {
    return liveCalls.filter((c) => c.status === 'PENDING' || c.status === 'UNREAD');
  }, [liveCalls]);

  // Current service window helper
  const currentServiceWindow = useMemo(() => {
    const h = currentTime.getHours();
    if (h >= 6 && h < 11) {
      return { title: 'Breakfast Service Window', emoji: '🥐', desc: 'Buffet Active (CP · MAP · AP)' };
    } else if (h >= 11 && h < 16) {
      return { title: 'Lunch Service Window', emoji: '🥗', desc: 'Dining Active (AP Full Board)' };
    } else if (h >= 16 && h < 19) {
      return { title: 'Evening High Tea Window', emoji: '☕', desc: 'Tea & Snacks' };
    } else {
      return { title: 'Dinner Service Window', emoji: '🍲', desc: 'Buffet Active (MAP · AP)' };
    }
  }, [currentTime]);

  // Helper for elapsed duration in MM:SS
  const getElapsedFormatted = (createdAt: string) => {
    const totalSecs = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-[#060a14] text-slate-100 flex flex-col ${isFullscreen ? 'p-3' : 'p-3 md:p-5'} font-sans select-none`}>
      {/* ══════════════════════════════════════════════════════════════════════
          1. LIVE DISPLAY HEADER BAR (Broadcast / TV Style)
         ══════════════════════════════════════════════════════════════════════ */}
      <header className="p-3.5 rounded-2xl bg-[#090f1f]/95 border border-slate-800/80 shadow-2xl flex flex-wrap items-center justify-between gap-3 mb-4 backdrop-blur-md">
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3">
          {!isFullscreen && (
            <Link
              href="/hotel"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Return to Hotel PMS"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          )}

          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black text-white tracking-wide uppercase">
                  Live Meal &amp; Room Dispatch Board
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  LIVE ON AIR
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 font-medium">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <span>{currentServiceWindow.emoji}</span>
                  <span>{currentServiceWindow.title}</span>
                </span>
                <span className="text-slate-600">·</span>
                <span>{currentServiceWindow.desc}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live Digital Clock */}
        <div className="hidden lg:flex flex-col items-center justify-center px-4 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
          <span className="font-mono text-base font-black text-emerald-400 tracking-wider">
            {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Right: TV Controls, Sound, Fullscreen, Auto-Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playChime();
            }}
            className={`p-2 rounded-xl text-xs font-bold border transition-all ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title={soundEnabled ? 'Chime sound active for new calls' : 'Chime muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Auto Refresh Ticker */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
              autoRefresh
                ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh && !refreshing ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{autoRefresh ? 'Live Sync (15s)' : 'Sync Paused'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
            title="Instant Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* TV Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/30 transition-all"
            title="Toggle TV / Wall Screen Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isFullscreen ? 'Exit Full' : 'TV Screen'}</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. HIGH-VISIBILITY LIVE TICKER DECK (Counters for Kitchen & Captain)
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
        {/* Total In-House */}
        <div className="p-3.5 rounded-2xl bg-[#090f1f] border border-slate-800/90 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">In-House</span>
            <BedDouble className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {summary.totalRoomsOccupied} <span className="text-xs font-semibold text-slate-500">Rooms</span>
          </div>
          <div className="text-[11px] text-indigo-300 font-bold mt-0.5">
            👥 {summary.totalPax} Total Pax
          </div>
        </div>

        {/* CP - Breakfast Count */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/30 to-[#090f1f] border border-amber-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] font-black uppercase tracking-widest">CP Breakfast</span>
            <Coffee className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {summary.plans.CP.count} <span className="text-xs font-semibold text-amber-500/80">Rooms</span>
          </div>
          <div className="text-[11px] text-amber-300 font-bold mt-0.5">
            🥐 {summary.plans.CP.pax} Buffet Pax
          </div>
        </div>

        {/* MAP - Half Board Count */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-950/30 to-[#090f1f] border border-sky-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-sky-400">
            <span className="text-[10px] font-black uppercase tracking-widest">MAP Half Board</span>
            <ChefHat className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-300 mt-1">
            {summary.plans.MAP.count} <span className="text-xs font-semibold text-sky-500/80">Rooms</span>
          </div>
          <div className="text-[11px] text-sky-300 font-bold mt-0.5">
            🍲 {summary.plans.MAP.pax} Bfast+Dinner
          </div>
        </div>

        {/* AP - Full Board Count */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-[#090f1f] border border-emerald-500/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] font-black uppercase tracking-widest">AP Full Board</span>
            <Crown className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-300 mt-1">
            {summary.plans.AP.count} <span className="text-xs font-semibold text-emerald-500/80">Rooms</span>
          </div>
          <div className="text-[11px] text-emerald-300 font-bold mt-0.5">
            👑 {summary.plans.AP.pax} All 3 Meals
          </div>
        </div>

        {/* EP - Room Only */}
        <div className="p-3.5 rounded-2xl bg-[#090f1f] border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-widest">EP Room Only</span>
            <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400">EP</span>
          </div>
          <div className="text-2xl font-black text-slate-300 mt-1">
            {summary.plans.EP.count} <span className="text-xs font-semibold text-slate-500">Rooms</span>
          </div>
          <div className="text-[11px] text-slate-400 font-bold mt-0.5">
            🏨 {summary.plans.EP.pax} Room Only
          </div>
        </div>

        {/* Active In-Room Dispatch Alerts */}
        <div className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all ${
          pendingCalls.length > 0
            ? 'bg-gradient-to-br from-rose-950/40 via-red-950/20 to-[#090f1f] border-rose-500/60 shadow-lg shadow-rose-500/10'
            : 'bg-[#090f1f] border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[10px] font-black uppercase tracking-widest">Guest Calls</span>
            <ConciergeBell className={`w-4 h-4 ${pendingCalls.length > 0 ? 'animate-bounce text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-black mt-1 ${pendingCalls.length > 0 ? 'text-rose-300 animate-pulse' : 'text-slate-400'}`}>
            {pendingCalls.length} <span className="text-xs font-semibold">Active</span>
          </div>
          <div className="text-[11px] text-rose-300 font-bold mt-0.5">
            {pendingCalls.length > 0 ? '⚡ Urgent Dispatch' : '✓ All Clear'}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. VIEW CONTROLS & DUAL-SCREEN TOGGLES
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        {/* View Modes */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl">
          {[
            { id: 'SPLIT', label: '📺 Dual Screen (Wall TV)', icon: Layers },
            { id: 'ROOMS', label: `🍽️ Meal Plan Grid (${rooms.length})`, icon: UtensilsCrossed },
            { id: 'CALLS', label: `🚨 Service Calls (${pendingCalls.length})`, icon: ConciergeBell },
            { id: 'CHEF', label: '📋 Chef Roster', icon: ChefHat },
          ].map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  viewMode === mode.id
                    ? 'bg-[#00b894] text-white shadow-md shadow-[#00b894]/25'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Plan Filters & Search */}
        <div className="flex items-center gap-2">
          {/* Plan filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-bold">
            {(['ALL', 'AP', 'MAP', 'CP', 'EP'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlanFilter(p)}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                  planFilter === p
                    ? 'bg-slate-100 text-slate-900 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search room, guest..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#00b894]"
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. DUAL-SCREEN LIVE DISPLAY (TV Wall mount layout)
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* ── LEFT SECTION: LIVE ROOM MEAL PLAN GRID (60% width in SPLIT) ── */}
        {(viewMode === 'SPLIT' || viewMode === 'ROOMS') && (
          <div className={`${viewMode === 'SPLIT' ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} space-y-3`}>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-400" />
                Live In-House Room Meal Plans ({filteredRooms.length} Occupied)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Auto-updates on check-in
              </span>
            </div>

            {loading ? (
              <div className="p-20 text-center text-slate-500">Loading Live Board...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800 text-slate-500">
                No rooms match the selected filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {filteredRooms.map((r) => {
                  const hasActiveTask = r.activeTasksCount > 0;
                  const planBorder =
                    r.mealPlan === 'AP'
                      ? 'border-emerald-500/50 shadow-emerald-500/10'
                      : r.mealPlan === 'MAP'
                      ? 'border-sky-500/50 shadow-sky-500/10'
                      : r.mealPlan === 'CP'
                      ? 'border-amber-500/50 shadow-amber-500/10'
                      : 'border-slate-800';

                  const planBadgeStyle =
                    r.mealPlan === 'AP'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                      : r.mealPlan === 'MAP'
                      ? 'bg-sky-500 text-slate-950 shadow-sm shadow-sky-500/30'
                      : r.mealPlan === 'CP'
                      ? 'bg-amber-400 text-slate-950 shadow-sm shadow-amber-400/30'
                      : 'bg-slate-800 text-slate-300';

                  return (
                    <div
                      key={r.id}
                      className={`p-3.5 rounded-2xl bg-gradient-to-br from-[#0c1322] to-[#070c17] border ${planBorder} shadow-lg space-y-2.5 transition-all relative overflow-hidden ${
                        hasActiveTask ? 'ring-2 ring-rose-500 animate-pulse' : ''
                      }`}
                    >
                      {/* Top Row: Big Room Number & Neon Plan Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xl font-black text-white tracking-tight">
                              ROOM {r.roomNumber}
                            </span>
                            {r.floor && (
                              <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.2 rounded bg-slate-800/80">
                                Fl. {r.floor}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-400 block truncate max-w-[150px]">
                            {r.roomTypeName}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${planBadgeStyle}`}>
                            {r.mealPlan}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono block mt-1 font-bold">
                            {r.totalPax} PAX
                          </span>
                        </div>
                      </div>

                      {/* Guest Info Bar */}
                      <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/70 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 truncate max-w-[140px]">
                          {r.guestName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {r.adults}A {r.extraAdults > 0 ? `+${r.extraAdults}Ex ` : ''}{r.children > 0 ? `+${r.children}C` : ''}
                        </span>
                      </div>

                      {/* Live Meals Matrix (LED indicators) */}
                      <div className="grid grid-cols-3 gap-1.5 text-center font-black text-[10px]">
                        {/* Breakfast */}
                        <div className={`p-1 rounded-lg border flex flex-col items-center justify-center ${
                          r.includedMeals.breakfast
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                            : 'bg-slate-900/50 border-slate-800/60 text-slate-600'
                        }`}>
                          <span className="text-xs">🥐</span>
                          <span>BFAST</span>
                          <span className="text-[8px] font-bold">{r.includedMeals.breakfast ? 'INCL' : '—'}</span>
                        </div>

                        {/* Lunch */}
                        <div className={`p-1 rounded-lg border flex flex-col items-center justify-center ${
                          r.includedMeals.lunch
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900/50 border-slate-800/60 text-slate-600'
                        }`}>
                          <span className="text-xs">🥗</span>
                          <span>LUNCH</span>
                          <span className="text-[8px] font-bold">{r.includedMeals.lunch ? 'INCL' : '—'}</span>
                        </div>

                        {/* Dinner */}
                        <div className={`p-1 rounded-lg border flex flex-col items-center justify-center ${
                          r.includedMeals.dinner
                            ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                            : 'bg-slate-900/50 border-slate-800/60 text-slate-600'
                        }`}>
                          <span className="text-xs">🍲</span>
                          <span>DINNER</span>
                          <span className="text-[8px] font-bold">{r.includedMeals.dinner ? 'INCL' : '—'}</span>
                        </div>
                      </div>

                      {/* Guest notes / dietary remarks */}
                      {r.specialRequests && (
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-medium truncate">
                          💬 {r.specialRequests}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── RIGHT SECTION: LIVE IN-ROOM DISPATCH & WAITER CALLS (40% width in SPLIT) ── */}
        {(viewMode === 'SPLIT' || viewMode === 'CALLS') && (
          <div className={`${viewMode === 'SPLIT' ? 'lg:col-span-5 xl:col-span-4' : 'lg:col-span-12'} space-y-3`}>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <ConciergeBell className="w-4 h-4 text-rose-400" />
                Live In-Room Service Calls ({pendingCalls.length} Pending)
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Real-time Dispatch
              </span>
            </div>

            {liveCalls.length === 0 ? (
              <div className="p-16 text-center rounded-2xl bg-slate-900/30 border border-slate-800 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">All Clear! No Pending Requests</h4>
                <p className="text-xs text-slate-500">Waiters and housekeeping are all attended to.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                {liveCalls.map((call) => {
                  const isPending = call.status === 'PENDING' || call.status === 'UNREAD';
                  const isUpdating = updatingCallId === call.id;

                  return (
                    <div
                      key={call.id}
                      className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                        isPending
                          ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/50 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/30'
                          : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                      }`}
                    >
                      {/* Top Header of Ticket */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono font-black text-sm">
                            RM {call.roomNumber}
                          </span>
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">
                              {call.kind.replace('_', ' ')}
                            </span>
                            <span className="text-xs font-bold text-slate-100">{call.taskType}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            isPending
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          }`}>
                            {call.status}
                          </span>
                          <span className="font-mono text-[11px] font-black text-amber-400 block mt-1">
                            ⏱️ {getElapsedFormatted(call.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Order / Call details */}
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200">
                        <p className="font-semibold leading-relaxed">{call.notes || call.title}</p>
                        {call.totalAmount ? (
                          <div className="font-black text-emerald-400 text-xs mt-1">
                            Bill Amount: ₹{call.totalAmount.toLocaleString('en-IN')}
                          </div>
                        ) : null}
                      </div>

                      {/* Action Button */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-500 font-mono">In-Room Kiosk</span>
                        {isPending ? (
                          <button
                            type="button"
                            onClick={() => handleMarkCallCompleted(call)}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{isUpdating ? 'Updating...' : 'ATTEND & CLEAR'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Attended
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

        {/* ── CHEF ROSTER TAB ── */}
        {viewMode === 'CHEF' && (
          <div className="lg:col-span-12 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-emerald-400" />
                  Kitchen &amp; Dining Prep Sheet
                </h3>
                <p className="text-xs text-slate-400">Printable live meal headcount for kitchen staff</p>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Kitchen Sheet</span>
              </button>
            </div>

            <div className="rounded-2xl bg-[#0a0f1d] border border-slate-800 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="p-3 pl-4">Room #</th>
                    <th className="p-3">Guest Name</th>
                    <th className="p-3">Total Pax</th>
                    <th className="p-3">Meal Plan</th>
                    <th className="p-3 text-center">Breakfast</th>
                    <th className="p-3 text-center">Lunch</th>
                    <th className="p-3 text-center">Dinner</th>
                    <th className="p-3 pr-4">Chef Special Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {rooms.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/40">
                      <td className="p-3 pl-4 font-mono font-bold text-white">Room {r.roomNumber}</td>
                      <td className="p-3 font-semibold">{r.guestName}</td>
                      <td className="p-3 font-black text-white">{r.totalPax} Pax</td>
                      <td className="p-3 font-mono font-bold">{r.mealPlan}</td>
                      <td className="p-3 text-center font-bold">{r.includedMeals.breakfast ? '✅ YES' : '—'}</td>
                      <td className="p-3 text-center font-bold">{r.includedMeals.lunch ? '✅ YES' : '—'}</td>
                      <td className="p-3 text-center font-bold">{r.includedMeals.dinner ? '✅ YES' : '—'}</td>
                      <td className="p-3 pr-4 text-slate-400">{r.specialRequests || 'Standard'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
