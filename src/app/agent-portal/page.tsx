'use client';

import React, { useState, useEffect } from 'react';
import {
  Handshake, Star, Phone, Calendar, IndianRupee, CheckCircle2,
  Clock, AlertCircle, Loader2, X, Plus, BadgeCheck, Building2,
  LogOut, Eye, EyeOff, RefreshCw, Bed, Users, ChevronLeft,
  Wallet, MapPin, Search, ArrowRight, Home, Shield, Sparkles,
  Coffee, Waves, Dumbbell, ChevronDown, ChevronUp, Mail,
  Lock, User, Briefcase, UserPlus,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

// ─── Types ──────────────────────────────────────────────────────────────────

interface RoomType { name: string; code: string; baseRate: number; maxOccupancy: number; }

interface HotelProperty {
  id: string; name: string; city?: string; state?: string; country?: string;
  type?: string; phone?: string; address?: string; pinCode?: string;
  starRating?: number; hotelCategory?: string; logoUrl?: string;
  checkInTime?: string; checkOutTime?: string; breakfastTimings?: string;
  poolTimings?: string; gymTimings?: string;
  totalRooms: number; availableRooms: number; occupiedRooms: number;
  roomTypes: RoomType[];
}

interface AgentBooking {
  id: string; guestName: string; guestPhone?: string; checkIn: string; checkOut: string;
  roomType: string; totalAmount: number; commission: number; commissionPaid: boolean;
  status: string; adults: number; children: number; createdAt: string;
}

interface Agent {
  id: string; name: string; agentCode: string; phone: string; email?: string;
  companyName?: string; city?: string; commissionRate: number; isActive: boolean;
  agentStatus?: string; bookings: AgentBooking[];
  property: { id: string; name: string; city?: string; phone?: string; logoUrl?: string };
}

interface AgentStats {
  totalBookings: number; pendingBookings: number; confirmedBookings: number;
  completedBookings: number; totalCommissionEarned: number;
  commissionPaid: number; commissionPending: number;
}

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: 'Pending Review', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
  CONFIRMED:  { label: 'Confirmed',      color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  CHECKED_IN: { label: 'Checked In',     color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/30' },
  COMPLETED:  { label: 'Completed',      color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/30' },
  CANCELLED:  { label: 'Cancelled',      color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/30' },
};

function StarRating({ count = 0 }: { count?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={10} className={i < count ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
      ))}
    </div>
  );
}

function CategoryBadge({ cat }: { cat?: string }) {
  if (!cat) return null;
  const map: Record<string, string> = {
    LUXURY: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    UPSCALE: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    MIDSCALE: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    ECONOMY: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    BOUTIQUE: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  };
  return (
    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[cat] || 'bg-slate-700 text-slate-400 border-slate-600'}`}>
      {cat}
    </span>
  );
}

// ─── Input Component ─────────────────────────────────────────────────────────
function Field({ label, icon: Icon, ...props }: { label: string; icon?: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />}
        <input
          {...props}
          className={`w-full bg-[#050a14] border border-slate-700/70 rounded-xl py-3 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-slate-600 transition-colors ${Icon ? 'pl-10 pr-4' : 'px-4'}`}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function AgentPortal() {
  type ViewType = 'auth' | 'home' | 'hotel-detail' | 'book' | 'dashboard';
  const [view, setView] = useState<ViewType>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [dashTab, setDashTab] = useState<'overview' | 'today' | 'bookings' | 'commission'>('overview');

  // ── Auth State ─────────────────────────────────────────────────────────────
  const [agent, setAgent] = useState<Agent | null>(null);
  const [agentStats, setAgentStats] = useState<AgentStats | null>(null);

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);

  const [regForm, setRegForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', companyName: '', city: '',
  });
  const [regError, setRegError] = useState('');
  const [registering, setRegistering] = useState(false);
  const [showRegPw, setShowRegPw] = useState(false);

  // ── Hotels ─────────────────────────────────────────────────────────────────
  const [hotels, setHotels] = useState<HotelProperty[]>([]);
  const [loadingHotels, setLoadingHotels] = useState(false);
  const [hotelSearch, setHotelSearch] = useState('');
  const [selectedHotel, setSelectedHotel] = useState<HotelProperty | null>(null);

  // ── Hotel Detail ───────────────────────────────────────────────────────────
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [roomsByFloor, setRoomsByFloor] = useState<Record<string, any[]>>({});
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [roomSummary, setRoomSummary] = useState<any>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState('ALL');
  const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({});

  // ── Booking ────────────────────────────────────────────────────────────────
  const [bookingForm, setBookingForm] = useState({
    guestName: '', guestPhone: '', guestEmail: '', guestNationality: 'Indian',
    adults: '1', children: '0', checkIn: '', checkOut: '', roomType: '', totalAmount: '',
    specialRequests: '', notes: '',
    includePoolAccess: false, poolPassCount: '1',
    includeSpaPackage: false, spaServiceType: 'Full Body Ayurvedic Massage (60 min)',
  });
  const [submitting, setSubmitting] = useState(false);

  // ── Auto Restore Session on Mount ──────────────────────────────────────────
  useEffect(() => {
    try {
      const savedAgent = localStorage.getItem('agent_info');
      const savedStats = localStorage.getItem('agent_stats');
      if (savedAgent) {
        const parsedAgent = JSON.parse(savedAgent);
        setAgent(parsedAgent);
        if (savedStats) setAgentStats(JSON.parse(savedStats));
        loadHotels(parsedAgent.id);
        refreshAgent(parsedAgent.id);
        setView('home');
      }
    } catch (_) {}
  }, []);

  // ── Load Hotels (only after login) ─────────────────────────────────────────
  const loadHotels = async (targetAgentId?: string) => {
    setLoadingHotels(true);
    try {
      const currentAgentId = targetAgentId || agent?.id;
      const url = currentAgentId ? `/api/agent-portal/properties?agentId=${currentAgentId}` : '/api/agent-portal/properties';
      const res = await fetch(url);
      const j = await res.json();
      if (j.success) setHotels(j.data || []);
    } catch {}
    setLoadingHotels(false);
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/agent-portal/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
      });
      const j = await res.json();
      if (j.success) {
        setAgent(j.data);
        setAgentStats(j.stats);
        try {
          localStorage.setItem('agent_info', JSON.stringify(j.data));
          if (j.stats) localStorage.setItem('agent_stats', JSON.stringify(j.stats));
        } catch (_) {}
        toast.success(`Welcome back, ${j.data.name}! 👋`);
        loadHotels(j.data.id);
        setView('home');
      } else {
        setLoginError(j.message || 'Invalid email or password.');
      }
    } catch {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoggingIn(false);
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (regForm.password.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    setRegistering(true);
    try {
      const res = await fetch('/api/agent-portal/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regForm.name, email: regForm.email, password: regForm.password,
          phone: regForm.phone, companyName: regForm.companyName || null, city: regForm.city || null,
        }),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(`Account created! Agent Code: ${j.data.agentCode} — Please log in.`);
        setAuthMode('login');
        setLoginForm({ email: regForm.email, password: '' });
        setRegForm({ name: '', email: '', password: '', confirmPassword: '', phone: '', companyName: '', city: '' });
      } else {
        setRegError(j.message || 'Registration failed. Please try again.');
      }
    } catch {
      setRegError('Network error. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    setAgent(null); setAgentStats(null);
    setHotels([]); setSelectedHotel(null);
    setLoginForm({ email: '', password: '' });
    try {
      localStorage.removeItem('agent_info');
      localStorage.removeItem('agent_stats');
    } catch (_) {}
    setView('auth');
    setAuthMode('login');
  };

  // ── Refresh Agent Data ─────────────────────────────────────────────────────
  const refreshAgent = async (targetAgentId?: string | any) => {
    const currentAgentId = (typeof targetAgentId === 'string' ? targetAgentId : null) || agent?.id;
    if (!currentAgentId) return;
    try {
      const res = await fetch(`/api/agent-portal/auth?agentId=${currentAgentId}`);
      const j = await res.json();
      if (j.success && j.data) {
        setAgent(j.data);
        setAgentStats(j.stats);
        try {
          localStorage.setItem('agent_info', JSON.stringify(j.data));
          if (j.stats) localStorage.setItem('agent_stats', JSON.stringify(j.stats));
        } catch (_) {}
      }
    } catch {}
  };

  // ── Open Hotel ─────────────────────────────────────────────────────────────
  const openHotel = async (hotel: HotelProperty) => {
    setSelectedHotel(hotel);
    setView('hotel-detail');
    setSelectedFloor('ALL');
    setLoadingRooms(true);
    try {
      const res = await fetch(`/api/agent-portal/rooms?propertyId=${hotel.id}`);
      const j = await res.json();
      if (j.success) {
        setHotelRooms(j.data || []);
        setRoomsByFloor(j.byFloor || {});
        setRoomTypes(j.roomTypes || []);
        setRoomSummary(j.summary || null);
        const expanded: Record<string, boolean> = {};
        Object.keys(j.byFloor || {}).forEach(f => { expanded[f] = true; });
        setExpandedFloors(expanded);
      }
    } catch { toast.error('Failed to load rooms.'); }
    setLoadingRooms(false);
  };

  // ── Trigger Booking ────────────────────────────────────────────────────────
  const triggerBooking = (roomTypeName?: string, rate?: number, note?: string) => {
    setBookingForm(f => ({
      ...f,
      roomType: roomTypeName || (selectedHotel?.roomTypes[0]?.name || ''),
      totalAmount: rate ? String(rate) : '',
      notes: note || '',
    }));
    setView('book');
  };

  // ── Submit Booking ─────────────────────────────────────────────────────────
  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.guestName || !bookingForm.checkIn || !bookingForm.checkOut || !agent || !selectedHotel) {
      toast.error('Please fill all required fields.'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/agent-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id, propertyId: selectedHotel.id,
          guestName: bookingForm.guestName, guestPhone: bookingForm.guestPhone || null,
          guestEmail: bookingForm.guestEmail || null, guestNationality: bookingForm.guestNationality,
          adults: Number(bookingForm.adults), children: Number(bookingForm.children),
          checkIn: bookingForm.checkIn, checkOut: bookingForm.checkOut,
          roomType: bookingForm.roomType, totalAmount: Number(bookingForm.totalAmount) || 0,
          notes: bookingForm.notes, specialRequests: bookingForm.specialRequests,
          includePoolAccess: bookingForm.includePoolAccess,
          includeSpaPackage: bookingForm.includeSpaPackage,
          poolPassCount: Number(bookingForm.poolPassCount) || 1,
          spaServiceType: bookingForm.includeSpaPackage ? bookingForm.spaServiceType : null,
        }),
      });
      const j = await res.json();
      if (j.success) {
        const activeRate = (selectedHotel as any)?.commissionRate ?? agent.commissionRate;
        const comm = ((Number(bookingForm.totalAmount) * activeRate) / 100).toFixed(0);
        toast.success(`Booking submitted! Commission: ₹${comm} @ ${activeRate}%`);
        setBookingForm({
          guestName: '', guestPhone: '', guestEmail: '', guestNationality: 'Indian',
          adults: '1', children: '0', checkIn: '', checkOut: '', roomType: '', totalAmount: '',
          specialRequests: '', notes: '',
          includePoolAccess: false, poolPassCount: '1',
          includeSpaPackage: false, spaServiceType: 'Full Body Ayurvedic Massage (60 min)',
        });
        await refreshAgent(agent.id);
        setView('dashboard'); setDashTab('bookings');
      } else {
        toast.error(j.message || 'Failed to submit booking.');
      }
    } catch { toast.error('Network error.'); }
    finally {
      setSubmitting(false);
    }
  };

  const filteredHotels = hotels.filter(h => {
    const q = hotelSearch.toLowerCase();
    return !q || h.name.toLowerCase().includes(q) || (h.city || '').toLowerCase().includes(q) || (h.state || '').toLowerCase().includes(q);
  });

  const bookingsList = agent?.bookings || [];
  const totalEarned = agentStats?.totalCommissionEarned || 0;
  const commPending = agentStats?.commissionPending || 0;

  // ════════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#050a14] text-white">
      <Toaster richColors position="top-right" />

      {/* ─── TOP NAV (hidden on auth page) ──────────────────────────────────── */}
      {view !== 'auth' && (
        <nav className="sticky top-0 z-50 bg-[#050a14]/95 backdrop-blur-md border-b border-slate-800/70">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {(view === 'hotel-detail' || view === 'book') && (
                <button onClick={() => view === 'book' ? setView('hotel-detail') : setView('home')}
                  className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
                  <ChevronLeft size={16} />
                </button>
              )}
              <button onClick={() => setView('home')} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-600/20">
                  <Handshake size={15} className="text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-black text-white leading-none">AgentBook</p>
                  <p className="text-[9px] text-violet-400 font-bold">Travel Partner Portal</p>
                </div>
              </button>
            </div>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-500 font-bold">
              <button onClick={() => setView('home')} className="hover:text-slate-300">Hotels</button>
              {selectedHotel && <><span className="text-slate-700">›</span><span className="text-slate-400">{selectedHotel.name}</span></>}
              {view === 'book' && <><span className="text-slate-700">›</span><span className="text-violet-400">Book Room</span></>}
              {view === 'dashboard' && <><span className="text-slate-700">›</span><span className="text-violet-400">Dashboard</span></>}
            </div>

            {agent && (
              <div className="flex items-center gap-2">
                <button onClick={() => setView('dashboard')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-black hover:bg-violet-600/40 transition-all">
                  <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center text-[10px] font-black">{agent.name[0]}</div>
                  <span className="hidden sm:inline">{agent.name.split(' ')[0]}</span>
                </button>
                <button onClick={handleLogout} className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 transition-all">
                  <LogOut size={14} />
                </button>
              </div>
            )}
          </div>
        </nav>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW: AUTH — Login / Register
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'auth' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
          {/* Background glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-md space-y-6">
            {/* Brand */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 mx-auto flex items-center justify-center shadow-2xl shadow-violet-600/40">
                <Handshake size={36} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-white">AgentBook</h1>
                <p className="text-sm text-slate-400 mt-1">Travel Partner Booking Portal</p>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-[#090f1e] border border-slate-800 rounded-2xl p-1">
              <button onClick={() => { setAuthMode('login'); setLoginError(''); setRegError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${authMode === 'login' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <Shield size={15} /> Sign In
              </button>
              <button onClick={() => { setAuthMode('register'); setLoginError(''); setRegError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 ${authMode === 'register' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <UserPlus size={15} /> Register
              </button>
            </div>

            {/* ── LOGIN FORM ─────────────────────────────────────────────────── */}
            {authMode === 'login' && (
              <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white">Welcome Back</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Sign in with your registered email and password.</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-3">
                  <Field label="Email Address" icon={Mail} type="email" required placeholder="agent@company.com"
                    value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} />
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input required type={showLoginPw ? 'text' : 'password'} placeholder="••••••••"
                        className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-slate-600"
                        value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
                      <button type="button" onClick={() => setShowLoginPw(!showLoginPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showLoginPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  {loginError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 font-bold flex items-center gap-2">
                      <AlertCircle size={13} /> {loginError}
                    </div>
                  )}
                  <button type="submit" disabled={loggingIn}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-black text-white shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {loggingIn ? <><Loader2 size={16} className="animate-spin" /> Signing In...</> : <><Shield size={16} /> Sign In to Portal</>}
                  </button>
                </form>
                <div className="text-center pt-2 border-t border-slate-800">
                  <p className="text-[11px] text-slate-500">
                    New agent?{' '}
                    <button onClick={() => setAuthMode('register')} className="text-violet-400 hover:text-violet-300 font-bold">Create an account</button>
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">Or contact hotel reception for credentials.</p>
                </div>
              </div>
            )}

            {/* ── REGISTER FORM ──────────────────────────────────────────────── */}
            {authMode === 'register' && (
              <div className="bg-[#090f1e] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
                <div>
                  <h2 className="text-lg font-black text-white">Create Agent Account</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Register as a travel agent and start earning commissions.</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-3">
                  <Field label="Full Name *" icon={User} required type="text" placeholder="Ramesh Sharma"
                    value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} />
                  <Field label="Email Address *" icon={Mail} required type="email" placeholder="agent@company.com"
                    value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Password *</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input required type={showRegPw ? 'text' : 'password'} placeholder="Min 6 chars"
                          className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-slate-600"
                          value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">Confirm Password *</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input required type={showRegPw ? 'text' : 'password'} placeholder="Repeat password"
                          className="w-full bg-[#050a14] border border-slate-700/70 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-slate-600"
                          value={regForm.confirmPassword} onChange={e => setRegForm(f => ({ ...f, confirmPassword: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowRegPw(!showRegPw)} className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1">
                    {showRegPw ? <EyeOff size={10} /> : <Eye size={10} />} {showRegPw ? 'Hide' : 'Show'} password
                  </button>
                  <Field label="Phone Number *" icon={Phone} required type="tel" placeholder="+91 9876543210"
                    value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Company / Agency" icon={Briefcase} type="text" placeholder="Travel Co. (optional)"
                      value={regForm.companyName} onChange={e => setRegForm(f => ({ ...f, companyName: e.target.value }))} />
                    <Field label="City" icon={MapPin} type="text" placeholder="Mumbai (optional)"
                      value={regForm.city} onChange={e => setRegForm(f => ({ ...f, city: e.target.value }))} />
                  </div>
                  {regError && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-xs text-rose-400 font-bold flex items-center gap-2">
                      <AlertCircle size={13} /> {regError}
                    </div>
                  )}
                  <button type="submit" disabled={registering}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-black text-white shadow-lg shadow-violet-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {registering ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</> : <><UserPlus size={16} /> Create Agent Account</>}
                  </button>
                </form>
                <div className="text-center pt-2 border-t border-slate-800">
                  <p className="text-[11px] text-slate-500">
                    Already registered?{' '}
                    <button onClick={() => setAuthMode('login')} className="text-violet-400 hover:text-violet-300 font-bold">Sign in here</button>
                  </p>
                </div>
              </div>
            )}

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { icon: Building2, label: 'All Hotels', desc: 'Browse partner properties' },
                { icon: Bed, label: 'Live Rooms', desc: 'Real-time availability' },
                { icon: IndianRupee, label: 'Commission', desc: 'Earn on every booking' },
              ].map(f => (
                <div key={f.label} className="bg-[#090f1e] border border-slate-800 rounded-2xl p-3">
                  <f.icon size={18} className="mx-auto text-violet-400 mb-1" />
                  <p className="text-xs font-black text-white">{f.label}</p>
                  <p className="text-[9px] text-slate-500">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW: HOME — Hotel Listing (only after login)
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'home' && (
        <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">

          {/* Welcome Bar */}
          {agent && (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black text-white">Browse Hotels</h1>
                <p className="text-sm text-slate-400">Select a hotel to view rooms and submit booking requests.</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 font-black">{agent.agentCode}</span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-black">{agent.commissionRate}% Commission</span>
                <button onClick={() => setView('dashboard')} className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-black hover:text-white flex items-center gap-1.5">
                  My Bookings <ArrowRight size={11} />
                </button>
              </div>
            </div>
          )}

          {/* Stats Quick View */}
          {agent && agentStats && (
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Bookings', value: agentStats.totalBookings, color: 'text-sky-400', bg: 'bg-sky-950/30 border-sky-500/20' },
                { label: 'Confirmed', value: agentStats.confirmedBookings, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/20' },
                { label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/20' },
                { label: 'Pending', value: `₹${commPending.toLocaleString('en-IN')}`, color: 'text-rose-400', bg: 'bg-rose-950/30 border-rose-500/20' },
              ].map(s => (
                <div key={s.label} onClick={() => setView('dashboard')} className={`rounded-2xl border p-3 cursor-pointer hover:scale-105 transition-transform ${s.bg}`}>
                  <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input type="text" value={hotelSearch} onChange={e => setHotelSearch(e.target.value)}
              placeholder="Search hotel by name, city or state..."
              className="w-full bg-[#090f1e] border border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm text-white focus:outline-none focus:border-violet-500 placeholder-slate-600" />
          </div>

          {/* Hotels Grid */}
          {loadingHotels ? (
            <div className="h-48 flex items-center justify-center">
              <Loader2 className="animate-spin text-violet-500" size={36} />
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
              <Building2 size={40} className="mx-auto text-slate-700 mb-3" />
              <p className="text-lg font-black text-slate-400">No Hotels Found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredHotels.map(hotel => (
                <div key={hotel.id} onClick={() => openHotel(hotel)}
                  className="group bg-[#090f1e] border border-slate-800 rounded-3xl overflow-hidden cursor-pointer hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-900/20 transition-all duration-300">
                  {/* Banner */}
                  <div className="h-28 bg-gradient-to-br from-violet-900/40 to-slate-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.15)_0%,_transparent_70%)]" />
                    {hotel.logoUrl ? (
                      <img src={hotel.logoUrl} alt={hotel.name} className="h-16 w-auto object-contain" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/30 flex items-center justify-center">
                        <span className="text-2xl font-black text-violet-300">{hotel.name[0]}</span>
                      </div>
                    )}
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-black border ${hotel.availableRooms > 0 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
                      {hotel.availableRooms > 0 ? `${hotel.availableRooms} Available` : 'Fully Booked'}
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black text-white group-hover:text-violet-200">{hotel.name}</h3>
                        {(hotel.city || hotel.state) && (
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin size={9} /> {[hotel.city, hotel.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StarRating count={hotel.starRating || 0} />
                        <CategoryBadge cat={hotel.hotelCategory} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-900/80 rounded-xl p-2">
                        <p className="text-base font-black text-white">{hotel.totalRooms}</p>
                        <p className="text-[8px] text-slate-500 uppercase font-bold">Total</p>
                      </div>
                      <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-500/10">
                        <p className="text-base font-black text-emerald-400">{hotel.availableRooms}</p>
                        <p className="text-[8px] text-emerald-600 uppercase font-bold">Available</p>
                      </div>
                      <div className="bg-rose-950/30 rounded-xl p-2 border border-rose-500/10">
                        <p className="text-base font-black text-rose-400">{hotel.occupiedRooms}</p>
                        <p className="text-[8px] text-rose-600 uppercase font-bold">Occupied</p>
                      </div>
                    </div>
                    {hotel.roomTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {hotel.roomTypes.slice(0, 3).map(rt => (
                          <span key={rt.name} className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                            {rt.name} · ₹{rt.baseRate.toLocaleString('en-IN')}
                          </span>
                        ))}
                        {hotel.roomTypes.length > 3 && <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-500">+{hotel.roomTypes.length - 3}</span>}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                      <p className="text-[10px] text-slate-500">{hotel.phone && <span className="flex items-center gap-1"><Phone size={9} />{hotel.phone}</span>}</p>
                      <span className="text-xs font-black text-violet-400 group-hover:text-violet-300 flex items-center gap-1">View Rooms <ArrowRight size={12} /></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW: HOTEL DETAIL
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'hotel-detail' && selectedHotel && (
        <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-6">
          {/* Hotel Header */}
          <div className="rounded-3xl bg-gradient-to-br from-violet-950/60 to-indigo-950/40 border border-violet-500/20 overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-violet-900/50 to-slate-900 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.2)_0%,_transparent_70%)]" />
              {selectedHotel.logoUrl ? (
                <img src={selectedHotel.logoUrl} alt={selectedHotel.name} className="h-20 w-auto object-contain relative z-10" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/20 flex items-center justify-center relative z-10">
                  <span className="text-3xl font-black text-violet-200">{selectedHotel.name[0]}</span>
                </div>
              )}
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-xl font-black text-white">{selectedHotel.name}</h2>
                  {(selectedHotel.city || selectedHotel.state) && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin size={10} className="text-violet-400" />
                      {[selectedHotel.address, selectedHotel.city, selectedHotel.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating count={selectedHotel.starRating || 0} />
                    <CategoryBadge cat={selectedHotel.hotelCategory} />
                  </div>
                </div>
                <button onClick={() => triggerBooking()}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-black text-white shadow-lg active:scale-95 transition-all flex items-center gap-2">
                  <Plus size={16} /> Book a Room
                </button>
              </div>
              {/* Info chips */}
              <div className="flex flex-wrap gap-2 text-[10px]">
                {selectedHotel.checkInTime && <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-bold"><Clock size={9} /> Check-in: {selectedHotel.checkInTime}</span>}
                {selectedHotel.checkOutTime && <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-bold"><Clock size={9} /> Check-out: {selectedHotel.checkOutTime}</span>}
                {selectedHotel.phone && <span className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full text-slate-400 font-bold"><Phone size={9} /> {selectedHotel.phone}</span>}
                {selectedHotel.breakfastTimings && <span className="flex items-center gap-1 bg-amber-900/20 border border-amber-500/20 px-2.5 py-1 rounded-full text-amber-400 font-bold"><Coffee size={9} /> Breakfast: {selectedHotel.breakfastTimings}</span>}
                {selectedHotel.poolTimings && <span className="flex items-center gap-1 bg-sky-900/20 border border-sky-500/20 px-2.5 py-1 rounded-full text-sky-400 font-bold"><Waves size={9} /> Pool: {selectedHotel.poolTimings}</span>}
                {selectedHotel.gymTimings && <span className="flex items-center gap-1 bg-rose-900/20 border border-rose-500/20 px-2.5 py-1 rounded-full text-rose-400 font-bold"><Dumbbell size={9} /> Gym: {selectedHotel.gymTimings}</span>}
              </div>
            </div>
          </div>

          {/* Room Stats */}
          <div className="grid grid-cols-4 gap-3 text-center">
            {[
              { label: 'Total', value: roomSummary?.total || hotelRooms.length, color: 'text-white', bg: 'bg-[#090f1e] border-slate-800' },
              { label: 'Available', value: roomSummary?.available || 0, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/20' },
              { label: 'Occupied', value: roomSummary?.occupied || 0, color: 'text-rose-400', bg: 'bg-rose-950/30 border-rose-500/20' },
              { label: 'Dirty/Maint', value: (roomSummary?.maintenance || 0) + (roomSummary?.dirty || 0), color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/20' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border p-3 ${s.bg}`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Room Categories */}
          {roomTypes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2"><Sparkles size={14} className="text-violet-400" /> Room Categories & Pricing</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {roomTypes.map((rt: any) => (
                  <div key={rt.name} className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-violet-500/30 transition-colors">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-black text-white">{rt.name}</p>
                          <p className="text-[9px] text-slate-500 font-bold">{rt.code}</p>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${rt.available > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                          {rt.available}/{rt.total} Free
                        </span>
                      </div>
                      <p className="text-lg font-black text-violet-300">₹{rt.baseRate.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-slate-500">per night</p>
                    </div>
                    <button onClick={() => triggerBooking(rt.name, rt.baseRate)} disabled={rt.available === 0}
                      className={`mt-3 w-full py-2 rounded-xl text-[10px] font-black transition-all ${rt.available > 0 ? 'bg-violet-600/30 border border-violet-500/30 text-violet-300 hover:bg-violet-600 hover:text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}>
                      {rt.available > 0 ? `Book ${rt.name} →` : 'Not Available'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floor Filter */}
          {!loadingRooms && Object.keys(roomsByFloor).length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              <span className="text-[10px] font-black text-slate-500 uppercase shrink-0">Floor:</span>
              <button onClick={() => setSelectedFloor('ALL')} className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${selectedFloor === 'ALL' ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>All</button>
              {Object.keys(roomsByFloor).map(fl => (
                <button key={fl} onClick={() => setSelectedFloor(fl)} className={`px-3 py-1.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${selectedFloor === fl ? 'bg-violet-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>Floor {fl}</button>
              ))}
            </div>
          )}

          {/* Floor Rooms */}
          {loadingRooms ? (
            <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-violet-500" size={32} /></div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-white flex items-center gap-2"><Building2 size={14} className="text-violet-400" /> Live Room Status — Floor Map</h3>
              {Object.entries(roomsByFloor).filter(([fl]) => selectedFloor === 'ALL' || selectedFloor === fl).map(([fl, rooms]) => {
                const avail = rooms.filter((r: any) => r.status === 'AVAILABLE').length;
                const isExp = expandedFloors[fl] !== false;
                return (
                  <div key={fl} className="bg-[#090f1e] border border-slate-800 rounded-2xl overflow-hidden">
                    <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-900/50 transition-colors"
                      onClick={() => setExpandedFloors(p => ({ ...p, [fl]: !isExp }))}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-violet-900/40 border border-violet-500/20 flex items-center justify-center">
                          <span className="text-xs font-black text-violet-300">{fl}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-black text-white">Floor {fl}</p>
                          <p className="text-[10px] text-slate-500">{rooms.length} rooms</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded-full">{avail} free</span>
                        <span className="text-[9px] font-bold text-rose-400 bg-rose-950/40 border border-rose-500/20 px-2 py-0.5 rounded-full">{rooms.length - avail} busy</span>
                        {isExp ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                      </div>
                    </button>
                    {isExp && (
                      <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                        {rooms.map((r: any) => {
                          const isAvail = r.status === 'AVAILABLE';
                          const isOcc = r.status === 'OCCUPIED';
                          return (
                            <div key={r.id} onClick={() => isAvail && triggerBooking(r.roomType?.name, r.customRate || r.roomType?.baseRate, `Room ${r.roomNumber} (Floor ${r.floor || fl})`)}
                              className={`rounded-xl border p-3 transition-all ${isAvail ? 'bg-emerald-950/20 border-emerald-500/30 cursor-pointer hover:border-emerald-400 hover:bg-emerald-950/40' : isOcc ? 'bg-rose-950/10 border-rose-500/10 opacity-70' : 'bg-slate-900/40 border-slate-800 opacity-50'}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm font-black text-white">#{r.roomNumber}</span>
                                {r.isVIP && <span className="text-[7px] font-black px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/20">VIP</span>}
                              </div>
                              <p className="text-[9px] text-slate-400 font-bold truncate">{r.roomType?.name}</p>
                              <p className="text-[10px] font-black text-violet-300 mt-0.5">₹{(r.customRate || r.roomType?.baseRate || 0).toLocaleString('en-IN')}</p>
                              <div className={`mt-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full inline-block ${isAvail ? 'bg-emerald-500/20 text-emerald-300' : isOcc ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-400'}`}>
                                {isAvail ? '✓ AVAILABLE' : isOcc ? '● OCCUPIED' : r.status}
                              </div>
                              {isAvail && <p className="text-[7px] text-emerald-500 mt-1 font-bold">Tap to Book →</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW: BOOK
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'book' && agent && selectedHotel && (
        <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">
          <div className="bg-[#090f1e] border border-violet-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center"><Building2 size={18} className="text-violet-400" /></div>
            <div>
              <p className="text-xs text-slate-400">Booking for</p>
              <p className="text-sm font-black text-white">{selectedHotel.name}</p>
              {selectedHotel.city && <p className="text-[10px] text-slate-500">{selectedHotel.city}</p>}
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-slate-400">Your commission</p>
              <p className="text-base font-black text-violet-400">{(selectedHotel as any)?.commissionRate ?? agent.commissionRate}%</p>
            </div>
          </div>
          <form onSubmit={handleSubmitBooking} className="space-y-4">
            <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Guest Information</p>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Guest Full Name *</label>
                <input required type="text" placeholder="e.g. Ramesh Sharma" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  value={bookingForm.guestName} onChange={e => setBookingForm(f => ({ ...f, guestName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Mobile</label>
                  <input type="text" placeholder="+91 9876543210" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.guestPhone} onChange={e => setBookingForm(f => ({ ...f, guestPhone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Nationality</label>
                  <input type="text" placeholder="Indian" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.guestNationality} onChange={e => setBookingForm(f => ({ ...f, guestNationality: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Adults</label>
                  <input type="number" min="1" max="10" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.adults} onChange={e => setBookingForm(f => ({ ...f, adults: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Children</label>
                  <input type="number" min="0" max="10" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.children} onChange={e => setBookingForm(f => ({ ...f, children: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Stay Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Check-In *</label>
                  <input required type="date" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.checkIn} onChange={e => setBookingForm(f => ({ ...f, checkIn: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Check-Out *</label>
                  <input required type="date" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                    value={bookingForm.checkOut} onChange={e => setBookingForm(f => ({ ...f, checkOut: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Room Type</label>
                <select className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  value={bookingForm.roomType} onChange={e => {
                    const rt = selectedHotel.roomTypes.find(r => r.name === e.target.value);
                    setBookingForm(f => ({ ...f, roomType: e.target.value, totalAmount: rt ? String(rt.baseRate) : f.totalAmount }));
                  }}>
                  <option value="" className="bg-[#090f1e]">Select Room Type...</option>
                  {selectedHotel.roomTypes.map(rt => (
                    <option key={rt.name} value={rt.name} className="bg-[#090f1e]">{rt.name} — ₹{rt.baseRate.toLocaleString('en-IN')}/night</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Room Amount (₹){bookingForm.totalAmount && agent ? ` → Commission: ₹${((Number(bookingForm.totalAmount) * ((selectedHotel as any)?.commissionRate ?? agent.commissionRate)) / 100).toFixed(0)} (${(selectedHotel as any)?.commissionRate ?? agent.commissionRate}%)` : ''}
                </label>
                <input type="number" min="0" placeholder="e.g. 5000" className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500"
                  value={bookingForm.totalAmount} onChange={e => setBookingForm(f => ({ ...f, totalAmount: e.target.value }))} />
              </div>
              {bookingForm.notes && <div className="bg-violet-950/20 border border-violet-500/20 rounded-xl px-3 py-2 text-[10px] text-violet-400 font-bold">📍 {bookingForm.notes}</div>}
            </div>

            {/* Pool & Spa Add-ons Section */}
            <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider">Hotel Add-Ons & Packages</p>

              {/* Swimming Pool Access Toggle */}
              <div className="bg-[#050a14] border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-950/40 border border-sky-500/30 flex items-center justify-center">
                      <Waves size={16} className="text-sky-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Swimming Pool Access Pass</p>
                      <p className="text-[9px] text-slate-400">Includes pool towel & changing locker</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bookingForm.includePoolAccess}
                    onChange={e => setBookingForm(f => ({ ...f, includePoolAccess: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-violet-500 bg-[#090f1e]"
                  />
                </label>

                {bookingForm.includePoolAccess && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">Number of Pool Passes:</span>
                    <select
                      value={bookingForm.poolPassCount}
                      onChange={e => setBookingForm(f => ({ ...f, poolPassCount: e.target.value }))}
                      className="bg-[#090f1e] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="1">1 Pass</option>
                      <option value="2">2 Passes</option>
                      <option value="3">3 Passes</option>
                      <option value="4">4 Passes (Family Pass)</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Spa Package Toggle */}
              <div className="bg-[#050a14] border border-slate-800 rounded-xl p-3 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-950/40 border border-pink-500/30 flex items-center justify-center">
                      <Sparkles size={16} className="text-pink-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Spa & Wellness Package</p>
                      <p className="text-[9px] text-slate-400">Therapeutic massage & relaxation session</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={bookingForm.includeSpaPackage}
                    onChange={e => setBookingForm(f => ({ ...f, includeSpaPackage: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-700 text-violet-600 focus:ring-violet-500 bg-[#090f1e]"
                  />
                </label>

                {bookingForm.includeSpaPackage && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400">Select Spa Service:</label>
                    <select
                      value={bookingForm.spaServiceType}
                      onChange={e => setBookingForm(f => ({ ...f, spaServiceType: e.target.value }))}
                      className="w-full bg-[#090f1e] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    >
                      <option value="Full Body Ayurvedic Massage (60 min)">Full Body Ayurvedic Massage (60 min)</option>
                      <option value="Aromatherapy & Reflexology (45 min)">Aromatherapy & Reflexology (45 min)</option>
                      <option value="Couples Spa & Jacuzzi Package">Couples Spa & Jacuzzi Package</option>
                      <option value="Express Head & Shoulder Relief (30 min)">Express Head & Shoulder Relief (30 min)</option>
                      <option value="Herbal Steam Bath & Facial Package">Herbal Steam Bath & Facial Package</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4">
              <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider mb-2">Special Requests</p>
              <textarea rows={2} placeholder="Extra bed, early check-in, anniversary decoration..." className="w-full bg-[#050a14] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                value={bookingForm.specialRequests} onChange={e => setBookingForm(f => ({ ...f, specialRequests: e.target.value }))} />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm font-black text-white shadow-xl active:scale-98 transition-all flex items-center justify-center gap-2">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><CheckCircle2 size={16} /> Submit Booking Request</>}
            </button>
          </form>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          VIEW: DASHBOARD
      ════════════════════════════════════════════════════════════════════════ */}
      {view === 'dashboard' && agent && (
        <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-5">
          <div className="rounded-3xl bg-gradient-to-br from-violet-950/60 to-indigo-950/40 border border-violet-500/20 p-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/20 flex items-center justify-center">
                <span className="text-3xl font-black text-violet-200">{agent.name[0]}</span>
              </div>
              <div>
                <p className="text-xl font-black text-white">{agent.name}</p>
                {agent.companyName && <p className="text-sm text-slate-400">{agent.companyName}</p>}
                {agent.email && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><Mail size={10} />{agent.email}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-black bg-violet-500/20 border border-violet-500/30 text-violet-300 px-2.5 py-1 rounded-full">{agent.agentCode}</span>
                  <span className="text-[10px] font-black bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-full">{agent.commissionRate}% Commission</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView('home')} className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-black text-slate-300 hover:text-white flex items-center gap-1.5">
                <Home size={13} /> Find Hotels
              </button>
              <button onClick={() => refreshAgent()} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white" title="Refresh Bookings">
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Bookings', value: agentStats?.totalBookings || 0, color: 'text-sky-400', bg: 'bg-sky-950/30 border-sky-500/20' },
              { label: 'Confirmed', value: agentStats?.confirmedBookings || 0, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/20' },
              { label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/20' },
              { label: 'Pending Payout', value: `₹${commPending.toLocaleString('en-IN')}`, color: 'text-rose-400', bg: 'bg-rose-950/30 border-rose-500/20' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-500 uppercase font-bold mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {(['overview', 'today', 'bookings', 'commission'] as const).map(t => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayCount = bookingsList.filter(b => {
                const cIn = new Date(b.checkIn).toISOString().split('T')[0];
                const cAt = new Date(b.createdAt).toISOString().split('T')[0];
                return cIn === todayStr || cAt === todayStr;
              }).length;

              return (
                <button key={t} onClick={() => setDashTab(t)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${dashTab === t ? 'bg-violet-600 text-white shadow-md shadow-violet-600/20' : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'}`}>
                  {t === 'overview' ? '🏠 Overview' : t === 'today' ? `📅 Today (${todayCount})` : t === 'bookings' ? '📋 My Bookings' : '💰 Commission'}
                </button>
              );
            })}
          </div>

          {dashTab === 'overview' && (
            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Recent Bookings</p>
              {bookingsList.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                  <Calendar size={32} className="mx-auto text-slate-700 mb-2" />
                  <p className="text-sm font-bold text-slate-400">No bookings yet.</p>
                  <button onClick={() => setView('home')} className="mt-3 px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-black">Browse Hotels →</button>
                </div>
              ) : bookingsList.slice(0, 5).map(b => {
                const cfg = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING;
                return (
                  <div key={b.id} className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-white">{b.guestName}</p>
                      <p className="text-[10px] text-slate-500">{new Date(b.checkIn).toLocaleDateString('en-IN')} → {new Date(b.checkOut).toLocaleDateString('en-IN')} · {b.roomType}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-sm font-black ${b.commissionPaid ? 'text-emerald-400' : 'text-amber-400'}`}>₹{b.commission.toLocaleString('en-IN')}</p>
                        <p className="text-[8px] text-slate-600">{b.commissionPaid ? '✓ Paid' : 'Pending'}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Today's Bookings Tab */}
          {dashTab === 'today' && (() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const todayList = bookingsList.filter(b => {
              const cIn = new Date(b.checkIn).toISOString().split('T')[0];
              const cAt = new Date(b.createdAt).toISOString().split('T')[0];
              return cIn === todayStr || cAt === todayStr;
            });
            const todayComm = todayList.reduce((s, b) => s + b.commission, 0);

            return (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-violet-950/40 via-indigo-950/40 to-slate-950 border border-violet-500/20 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Today's Activity ({new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})</p>
                    <p className="text-xl font-black text-white">{todayList.length} Booking{todayList.length === 1 ? '' : 's'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400">Today's Earned Commission</p>
                    <p className="text-xl font-black text-amber-400">₹{todayComm.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {todayList.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl space-y-2">
                    <Calendar size={36} className="mx-auto text-slate-700" />
                    <p className="text-sm font-black text-slate-400">No Bookings for Today</p>
                    <p className="text-xs text-slate-600 max-w-xs mx-auto">Bookings created today or checking in today will appear here.</p>
                    <button onClick={() => setView('home')} className="mt-3 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-black shadow-lg shadow-violet-600/20">
                      + Create Booking Today
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayList.map(b => {
                      const cfg = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING;
                      const nights = Math.max(1, Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000));
                      return (
                        <div key={b.id} className="bg-[#090f1e] border border-violet-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black bg-violet-600/30 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-md">TODAY</span>
                                <p className="text-sm font-black text-white">{b.guestName}</p>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">{b.guestPhone || 'No phone'} · {b.roomType} · {nights} Night{nights > 1 ? 's' : ''}</p>
                            </div>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                          </div>

                          {((b as any).includePoolAccess || (b as any).includeSpaPackage) && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {(b as any).includePoolAccess && (
                                <span className="text-[9px] font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Waves size={10} /> Pool Access ({(b as any).poolPassCount || 1} Pass)
                                </span>
                              )}
                              {(b as any).includeSpaPackage && (
                                <span className="text-[9px] font-bold text-pink-400 bg-pink-950/40 border border-pink-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Sparkles size={10} /> Spa: {(b as any).spaServiceType || 'Wellness Package'}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-900 rounded-xl p-2">
                              <p className="text-[8px] text-slate-500 uppercase font-bold">Check-In</p>
                              <p className="font-black text-white text-[11px]">{new Date(b.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-2">
                              <p className="text-[8px] text-slate-500 uppercase font-bold">Check-Out</p>
                              <p className="font-black text-white text-[11px]">{new Date(b.checkOut).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                            </div>
                            <div className="bg-slate-900 rounded-xl p-2">
                              <p className="text-[8px] text-slate-500 uppercase font-bold">Total Amount</p>
                              <p className="font-black text-violet-300 text-[11px]">₹{b.totalAmount.toLocaleString('en-IN')}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2">
                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><IndianRupee size={10} className="text-amber-400" /> Today's Commission</span>
                            <span className={`text-sm font-black ${b.commissionPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                              ₹{b.commission.toLocaleString('en-IN')} {b.commissionPaid ? '✓ Paid' : '(Pending)'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {dashTab === 'bookings' && (
            <div className="space-y-3">
              {bookingsList.length === 0 ? (
                <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <Handshake size={36} className="mx-auto text-slate-700" />
                  <p className="text-sm font-black text-slate-300">No bookings submitted yet</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">Bookings you submit for guests will appear here with live status & commission tracking.</p>
                  <button onClick={() => setView('home')} className="mt-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs">
                    Browse Hotels & Book
                  </button>
                </div>
              ) : (
                bookingsList.map(b => {
                const cfg = STATUS_STYLE[b.status] || STATUS_STYLE.PENDING;
                const nights = Math.max(1, Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000));
                return (
                  <div key={b.id} className="bg-[#090f1e] border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-black text-white">{b.guestName}</p>
                        <p className="text-[10px] text-slate-500">{b.guestPhone || 'No phone'} · {b.adults}A {b.children ? `${b.children}C` : ''}</p>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    {((b as any).includePoolAccess || (b as any).includeSpaPackage) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {(b as any).includePoolAccess && (
                          <span className="text-[9px] font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Waves size={10} /> Pool Access ({(b as any).poolPassCount || 1} Pass)
                          </span>
                        )}
                        {(b as any).includeSpaPackage && (
                          <span className="text-[9px] font-bold text-pink-400 bg-pink-950/40 border border-pink-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles size={10} /> Spa: {(b as any).spaServiceType || 'Wellness Package'}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Check-In', value: new Date(b.checkIn).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) },
                        { label: 'Nights', value: String(nights) },
                        { label: 'Room', value: b.roomType },
                        { label: 'Amount', value: `₹${b.totalAmount.toLocaleString('en-IN')}` },
                      ].map(s => (
                        <div key={s.label} className="bg-slate-900 rounded-xl p-2">
                          <p className="text-[8px] text-slate-500 uppercase font-bold">{s.label}</p>
                          <p className="font-black text-white text-[11px] truncate">{s.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 rounded-xl px-3 py-2">
                      <span className="text-[10px] text-slate-500 font-bold">Your Commission</span>
                      <span className={`text-sm font-black ${b.commissionPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                        ₹{b.commission.toLocaleString('en-IN')} {b.commissionPaid ? '✓ Credited' : '(Pending)'}
                      </span>
                    </div>
                  </div>
                );
              }))}
            </div>
          )}

          {dashTab === 'commission' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'Total Earned', value: `₹${totalEarned.toLocaleString('en-IN')}`, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/20' },
                  { label: 'Credited', value: `₹${(agentStats?.commissionPaid || 0).toLocaleString('en-IN')}`, color: 'text-indigo-400', bg: 'bg-indigo-950/30 border-indigo-500/20' },
                  { label: 'Pending', value: `₹${commPending.toLocaleString('en-IN')}`, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/20' },
                ].map(s => (
                  <div key={s.label} className={`rounded-2xl border p-3 ${s.bg}`}>
                    <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[8px] text-slate-500 uppercase font-bold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {bookingsList.map(b => (
                  <div key={b.id} className="bg-[#090f1e] border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-black text-white">{b.guestName}</p>
                      <p className="text-[9px] text-slate-500">{new Date(b.checkIn).toLocaleDateString('en-IN')} · {b.roomType} · {b.status}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${b.commissionPaid ? 'text-emerald-400' : 'text-amber-400'}`}>₹{b.commission.toLocaleString('en-IN')}</p>
                      <p className="text-[8px] text-slate-600">{b.commissionPaid ? '✓ Paid' : 'Pending'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── STICKY MOBILE BOTTOM NAVIGATION BAR ───────────────────────────────── */}
      {view !== 'auth' && agent && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#070c18]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 shadow-2xl">
          <div className="max-w-md mx-auto flex items-center justify-between">
            {/* 1. Hotels */}
            <button
              onClick={() => setView('home')}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                view === 'home' || view === 'hotel-detail' ? 'text-violet-400 font-black' : 'text-slate-500 hover:text-slate-300 font-bold'
              }`}
            >
              <Building2 size={18} />
              <span className="text-[9px] mt-0.5">Hotels</span>
            </button>

            {/* 2. Today's Bookings */}
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayCount = bookingsList.filter(b => {
                const cIn = new Date(b.checkIn).toISOString().split('T')[0];
                const cAt = new Date(b.createdAt).toISOString().split('T')[0];
                return cIn === todayStr || cAt === todayStr;
              }).length;
              const isSelected = view === 'dashboard' && dashTab === 'today';

              return (
                <button
                  onClick={() => { setView('dashboard'); setDashTab('today'); refreshAgent(); }}
                  className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl relative transition-all ${
                    isSelected ? 'text-violet-400 font-black' : 'text-slate-500 hover:text-slate-300 font-bold'
                  }`}
                >
                  <Calendar size={18} />
                  {todayCount > 0 && (
                    <span className="absolute top-0 right-3 w-4 h-4 rounded-full bg-violet-600 text-white text-[8px] font-black flex items-center justify-center border border-[#070c18]">
                      {todayCount}
                    </span>
                  )}
                  <span className="text-[9px] mt-0.5">Today</span>
                </button>
              );
            })()}

            {/* 3. My Bookings */}
            <button
              onClick={() => { setView('dashboard'); setDashTab('bookings'); refreshAgent(); }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                view === 'dashboard' && dashTab === 'bookings' ? 'text-violet-400 font-black' : 'text-slate-500 hover:text-slate-300 font-bold'
              }`}
            >
              <Bed size={18} />
              <span className="text-[9px] mt-0.5">Bookings</span>
            </button>

            {/* 4. Commission */}
            <button
              onClick={() => { setView('dashboard'); setDashTab('commission'); refreshAgent(); }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                view === 'dashboard' && dashTab === 'commission' ? 'text-violet-400 font-black' : 'text-slate-500 hover:text-slate-300 font-bold'
              }`}
            >
              <IndianRupee size={18} />
              <span className="text-[9px] mt-0.5">Earnings</span>
            </button>

            {/* 5. Profile */}
            <button
              onClick={() => { setView('dashboard'); setDashTab('overview'); refreshAgent(); }}
              className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                view === 'dashboard' && dashTab === 'overview' ? 'text-violet-400 font-black' : 'text-slate-500 hover:text-slate-300 font-bold'
              }`}
            >
              <User size={18} />
              <span className="text-[9px] mt-0.5">Profile</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
