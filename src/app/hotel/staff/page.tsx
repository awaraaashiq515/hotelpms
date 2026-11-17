'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Search, Clock, Phone, RefreshCw, MapPin,
  Wifi, WifiOff, AlertTriangle, ChevronDown, ChevronUp,
  Navigation, Ruler, Target, Settings2, Save, Crosshair,
  Eye, EyeOff, CheckCircle, XCircle, UserCheck, Radio,
  BarChart3, Shield, Tablet, Brush, MessageSquare, Send,
  UserPlus, X
} from 'lucide-react';
import StaffManagement from '@/components/admin/StaffManagement';
import { StaffMemberForm } from '@/components/forms/staff-member-form';

/* ─── Location types ─── */
interface Ping {
  id: string;
  lat: number;
  lng: number;
  distanceFromBase: number;
  isOutOfRange: boolean;
  createdAt: string;
}

interface LocRow {
  userId: string;
  fullName: string;
  designation: string | null;
  phone: string | null;
  wtStatus: string;
  latestPing: Ping | null;
  lastSeen: string | null;
  distanceFromBase: number | null;
  isOutOfRange: boolean;
  isTracking: boolean;
  history: Ping[];
}

interface LocSettings {
  baseLat: number;
  baseLng: number;
  alertDistanceMeters: number;
  trackingEnabled: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  PRESENT:      'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  OUT_OF_RANGE: 'text-rose-300 bg-rose-500/15 border-rose-500/30 animate-pulse',
  CLOCKED_OUT:  'text-sky-300 bg-sky-500/15 border-sky-500/30',
  ABSENT:       'text-slate-400 bg-slate-800/80 border-slate-700',
  LEAVE:        'text-amber-300 bg-amber-500/15 border-amber-500/30',
};

const STATUS_LABEL: Record<string, string> = {
  PRESENT:      '🟢 On Duty (In Hotel)',
  OUT_OF_RANGE: '🚨 Checked In (Away)',
  CLOCKED_OUT:  '⏱️ Shift Ended',
  ABSENT:       '⚪ Off Duty (Not Checked In)',
  LEAVE:        '🟡 On Leave / Inactive',
};

/* ─── Helpers ─── */
function fmtDist(m: number | null) {
  if (m === null) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}

function fmtAgo(iso: string | null) {
  if (!iso) return 'Never';
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function initials(n: string) {
  return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);
}

/* ─── Staff Map (Leaflet with Google/Dark Layers) ─── */
function StaffMap({
  staff,
  settings,
  mapFocus
}: {
  staff: LocRow[];
  settings: LocSettings;
  mapFocus: { lat: number; lng: number; ts: number } | null;
}) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<'dark' | 'google' | 'satellite'>('google');
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  const baseMarkerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else if ((window as any).L) {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    if (!L || !leafletMapRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let attribution = '&copy; Google Maps';

    if (mapType === 'dark') {
      url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; CARTO &copy; OpenStreetMap';
    } else if (mapType === 'satellite') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Satellite';
    }

    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 20,
      attribution
    }).addTo(leafletMapRef.current);
  }, [mapLoaded, mapType]);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapLoaded || !mapRef.current || !L) return;

    const baseLat = settings.baseLat || 0;
    const baseLng = settings.baseLng || 0;

    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([baseLat || 28.6139, baseLng || 77.2090], 15);

      leafletMapRef.current = map;

      tileLayerRef.current = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '&copy; Google Maps'
      }).addTo(map);
    }

    const map = leafletMapRef.current;

    markersRef.current.forEach((m: any) => m.remove());
    markersRef.current = [];
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
    if (baseMarkerRef.current) {
      baseMarkerRef.current.remove();
      baseMarkerRef.current = null;
    }

    if (baseLat !== 0 || baseLng !== 0) {
      const baseIcon = L.divIcon({
        html: `<div class="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center text-sm" style="box-shadow: 0 0 12px rgba(99,102,241,0.6);">🏨</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      baseMarkerRef.current = L.marker([baseLat, baseLng], { icon: baseIcon })
        .addTo(map)
        .bindPopup(`<div class="text-slate-900 font-bold p-1 text-xs">Hotel Base Location</div>`);

      circleRef.current = L.circle([baseLat, baseLng], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 4',
        radius: settings.alertDistanceMeters || 500
      }).addTo(map);
    }

    const tracked = staff.filter(s => s.latestPing);

    tracked.forEach(s => {
      const lat = s.latestPing!.lat;
      const lng = s.latestPing!.lng;
      const isOut = s.isOutOfRange;
      const color = isOut ? '#ef4444' : '#10b981';
      const init = initials(s.fullName);

      const staffIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full text-white font-black border-2 border-slate-900 shadow-md transition-all" style="background: ${color}; box-shadow: 0 0 10px ${color};">
            <span style="font-size: 9px;">${init}</span>
            <div class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white animate-ping" style="background: ${color};"></div>
          </div>
        `,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([lat, lng], { icon: staffIcon })
        .addTo(map)
        .bindPopup(`
          <div class="text-slate-900 p-1 font-sans" style="font-size: 11px; line-height: 1.4; min-width: 140px;">
            <div class="font-extrabold text-sm mb-1 text-slate-800">${s.fullName}</div>
            <div><b>Role:</b> ${s.designation || 'Staff'}</div>
            <div><b>Distance:</b> ${fmtDist(s.distanceFromBase)}</div>
            <div><b>Status:</b> <span class="font-black ${isOut ? 'text-red-500' : 'text-emerald-600'}">${isOut ? 'OUT OF RANGE' : 'IN RANGE'}</span></div>
            <div class="text-[9px] text-slate-400 mt-1">Last active ${fmtAgo(s.lastSeen)}</div>
          </div>
        `);

      markersRef.current.push(marker);
    });

    if (baseLat !== 0 || baseLng !== 0) {
      const bounds = [[baseLat, baseLng]];
      tracked.forEach(s => {
        bounds.push([s.latestPing!.lat, s.latestPing!.lng]);
      });
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } else {
        map.setView([baseLat, baseLng], 15);
      }
    }
  }, [mapLoaded, staff, settings]);

  useEffect(() => {
    const L = (window as any).L;
    if (!mapLoaded || !leafletMapRef.current || !mapFocus || !L) return;
    leafletMapRef.current.flyTo([mapFocus.lat, mapFocus.lng], 17);
  }, [mapLoaded, mapFocus]);

  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-950/80">
      <div className="absolute top-2.5 right-2.5 z-[1000] flex bg-slate-900/90 border border-white/10 rounded-lg p-0.5 shadow-lg backdrop-blur-md">
        {[
          { id: 'dark' as const, label: 'Dark' },
          { id: 'google' as const, label: 'Google' },
          { id: 'satellite' as const, label: 'Satellite' }
        ].map(type => (
          <button
            key={type.id}
            onClick={() => setMapType(type.id)}
            className={`px-2 py-0.5 text-[8px] font-black rounded-md uppercase tracking-wider transition-all ${mapType === type.id ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div ref={mapRef} className="w-full relative" style={{ height: '380px' }} />
    </div>
  );
}

/* ─── Inner Staff Content ─── */
function StaffPortalContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') === 'location' 
    ? 'location' 
    : searchParams?.get('tab') === 'accounts' 
      ? 'accounts' 
      : searchParams?.get('tab') === 'chat'
        ? 'chat'
        : 'attendance';

  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'accounts' | 'location' | 'chat'>(initialTab);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('ALL');
  const [properties, setProperties] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [addStaffLoading, setAddStaffLoading] = useState(false);
  const [addStaffError, setAddStaffError] = useState('');

  /* Location tracking states */
  const [locRows, setLocRows] = useState<LocRow[]>([]);
  const [mapFocus, setMapFocus] = useState<{ lat: number; lng: number; ts: number } | null>(null);
  const [locSettings, setLocSettings] = useState<LocSettings>({ baseLat: 0, baseLng: 0, alertDistanceMeters: 500, trackingEnabled: true });
  const [locLoading, setLocLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showLocSettings, setShowLocSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<LocSettings>({ baseLat: 0, baseLng: 0, alertDistanceMeters: 500, trackingEnabled: true });
  const [savingSettings, setSavingSettings] = useState(false);
  const [gettingBase, setGettingBase] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  /* Admin Staff Chat states */
  const [chatSummaries, setChatSummaries] = useState<any[]>([]);
  const [selectedStaffChat, setSelectedStaffChat] = useState<any | null>(null);
  const [adminChatMessages, setAdminChatMessages] = useState<any[]>([]);
  const [adminChatInput, setAdminChatInput] = useState('');
  const [sendingAdminChat, setSendingAdminChat] = useState(false);
  const [staffChatSearch, setStaffChatSearch] = useState('');
  const adminChatEndRef = useRef<HTMLDivElement | null>(null);

  const loadChatSummaries = useCallback(async () => {
    try {
      const res = await fetch('/api/staff-chat?summary=true');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setChatSummaries(data.data);
        setSelectedStaffChat((prev: any) => prev || (data.data.length > 0 ? data.data[0].staff : null));
      }
    } catch (_) {}
  }, []);

  const loadAdminMessages = useCallback(async (staffId: string) => {
    if (!staffId) return;
    try {
      const res = await fetch(`/api/staff-chat?staffId=${staffId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setAdminChatMessages(data.data);
      }
    } catch (_) {}
  }, []);

  const handleAdminSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const text = (customMsg || adminChatInput).trim();
    if (!text || !selectedStaffChat?.id || sendingAdminChat) return;
    setSendingAdminChat(true);
    try {
      const res = await fetch('/api/staff-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedStaffChat.id,
          message: text,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminChatInput('');
        setAdminChatMessages((prev) => [...prev, data.data]);
        loadChatSummaries();
      }
    } catch (_) {} finally {
      setSendingAdminChat(false);
    }
  };

  // Update activeSubTab if query param changes
  useEffect(() => {
    const qTab = searchParams?.get('tab');
    if (qTab === 'location') setActiveSubTab('location');
    else if (qTab === 'accounts') setActiveSubTab('accounts');
    else if (qTab === 'chat') setActiveSubTab('chat');
  }, [searchParams]);

  useEffect(() => {
    if (activeSubTab === 'chat') {
      loadChatSummaries();
      const iv = setInterval(() => {
        loadChatSummaries();
        if (selectedStaffChat?.id) {
          loadAdminMessages(selectedStaffChat.id);
        }
      }, 4000);
      return () => clearInterval(iv);
    }
  }, [activeSubTab, selectedStaffChat?.id, loadChatSummaries, loadAdminMessages]);

  useEffect(() => {
    if (selectedStaffChat?.id) {
      loadAdminMessages(selectedStaffChat.id);
    }
  }, [selectedStaffChat?.id, loadAdminMessages]);

  useEffect(() => {
    if (activeSubTab === 'chat') {
      adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [adminChatMessages, activeSubTab]);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const [staffRes, propRes] = await Promise.all([
        fetch('/api/staff-members').then(r => r.json()),
        fetch('/api/admin/properties').then(r => r.json())
      ]);
      if (staffRes.success) {
        setStaffMembers(staffRes.data || []);
      }
      if (propRes.success) {
        setProperties(propRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load real staff database', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLocData = useCallback(async () => {
    try {
      const res = await fetch('/api/staff-location/list');
      if (!res.ok) return;
      const j = await res.json();
      if (j.success) {
        setLocRows(j.data || []);
        if (j.settings) {
          setLocSettings(j.settings);
          setSettingsDraft(j.settings);
        }
        setLastRefresh(new Date());
      }
    } catch { }
    finally { setLocLoading(false); }
  }, []);

  const [clockingId, setClockingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStaffData();
    loadLocData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'location') {
      setLocLoading(true);
      loadLocData();
    }
    const iv = setInterval(() => {
      loadLocData();
    }, 10000);
    return () => clearInterval(iv);
  }, [activeSubTab, loadLocData]);

  const saveLocSettings = async () => {
    setSavingSettings(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/staff-location/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsDraft)
      });
      if (res.ok) {
        const j = await res.json();
        setLocSettings(j.data);
        setSaveMsg('✓ Saved');
        setTimeout(() => setSaveMsg(''), 2500);
        await loadLocData();
      }
    } catch {
      setSaveMsg('❌ Error');
    } finally {
      setSavingSettings(false);
    }
  };

  const getMyLocation = () => {
    setGettingBase(true);
    navigator.geolocation.getCurrentPosition(
      p => {
        setSettingsDraft(d => ({ ...d, baseLat: p.coords.latitude, baseLng: p.coords.longitude }));
        setGettingBase(false);
      },
      () => {
        alert('Location access denied');
        setGettingBase(false);
      }
    );
  };

  // ── Strict Attendance Check (Never auto-marks present without check-in & hotel location) ──
  const getStaffAttendanceStatus = (s: any) => {
    if (!s.isActive) return 'LEAVE';

    const todayAtt = s.attendance?.[0] || s.user?.attendance?.[0];
    
    // 1. Not clocked in today -> Off Duty / Absent
    if (!todayAtt) {
      return 'ABSENT';
    }

    // 2. Already clocked out -> Shift Completed
    if (todayAtt.clockOut) {
      return 'CLOCKED_OUT';
    }

    // 3. Clocked in -> Check GPS location telemetry
    const locRow = locRows.find(r => (s.userId && r.userId === s.userId) || r.userId === s.id);
    const latestPing = s.user?.staffLocationPings?.[0] || locRow?.latestPing;
    
    if (latestPing && latestPing.isOutOfRange) {
      return 'OUT_OF_RANGE';
    }

    return 'PRESENT';
  };

  const handleToggleAttendance = async (s: any, currentStatus: string) => {
    setClockingId(s.id);
    try {
      if (currentStatus === 'PRESENT' || currentStatus === 'OUT_OF_RANGE') {
        const res = await fetch('/api/staff-attendance/clock-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffMemberId: s.id, location: 'Hotel Reception Check-Out' }),
        });
        const data = await res.json();
        if (res.ok) {
          await fetchStaffData();
        } else {
          alert(data.message || 'Failed to clock out');
        }
      } else {
        const res = await fetch('/api/staff-attendance/clock-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ staffMemberId: s.id, location: 'Hotel Reception Clock-In' }),
        });
        const data = await res.json();
        if (res.ok) {
          await fetchStaffData();
        } else {
          alert(data.message || 'Failed to clock in');
        }
      }
    } catch (e: any) {
      alert(e.message || 'Error updating attendance');
    } finally {
      setClockingId(null);
    }
  };

  const getShiftHoursLabel = (hours: number | null | undefined) => {
    if (!hours) return '8h';
    const hrs = Math.floor(hours);
    const mins = Math.round((hours - hrs) * 60);
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  const departments = ['ALL', ...Array.from(new Set(staffMembers.map(s => s.designation).filter(Boolean)))];

  const filteredStaff = staffMembers
    .filter(s => dept === 'ALL' || s.designation === dept)
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()));

  const totalCount = staffMembers.length;
  const present = staffMembers.filter(s => getStaffAttendanceStatus(s) === 'PRESENT').length;
  const away = staffMembers.filter(s => getStaffAttendanceStatus(s) === 'OUT_OF_RANGE').length;
  const absent  = staffMembers.filter(s => {
    const st = getStaffAttendanceStatus(s);
    return st === 'ABSENT' || st === 'CLOCKED_OUT';
  }).length;
  const leave   = staffMembers.filter(s => getStaffAttendanceStatus(s) === 'LEAVE').length;

  const outOfRange = locRows.filter(r => r.isOutOfRange);
  const trackingCount = locRows.filter(r => r.isTracking).length;
  const farthest = locRows.reduce<LocRow | null>((b, r) => {
    if (r.distanceFromBase === null) return b;
    if (!b || r.distanceFromBase > (b.distanceFromBase ?? 0)) return r;
    return b;
  }, null);

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
      

      {/* Header section */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900/90 via-[#0d1627]/90 to-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10.5px] font-black text-blue-400 uppercase tracking-widest">Hotel Team & Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Staff & Team Management</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Comprehensive management of employee directory, attendance, live GPS duty tracking, and system roles.
          </p>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            onClick={() => {
              setAddStaffError('');
              setShowAddStaffModal(true);
            }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-blue-500/25 active:scale-95 cursor-pointer"
          >
            <UserPlus size={15} />
            <span>Add New Staff</span>
          </button>
          <button 
            onClick={() => {
              if (activeSubTab === 'location') {
                setLocLoading(true);
                loadLocData();
              } else {
                fetchStaffData();
              }
            }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw size={13} className={loading || locLoading ? 'animate-spin' : ''} />
            <span>Sync & Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Top Level 4 Big KPI Overview Cards (Always visible) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-blue-500/25 bg-blue-950/20 p-4 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Total Staff</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Users size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-white">{totalCount}</p>
          <p className="text-[10.5px] text-slate-400 font-medium mt-1">Total Registered Employees</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-4 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">On-Duty Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <UserCheck size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-300">{present}</p>
          <p className="text-[10.5px] text-slate-400 font-medium mt-1">Active & Working Shifts</p>
        </div>

        <div className="rounded-2xl border border-rose-500/25 bg-rose-950/20 p-4 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Off-Duty / Leave</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-rose-300">{absent + leave}</p>
          <p className="text-[10.5px] text-slate-400 font-medium mt-1">{leave} on Leave · {absent} Inactive</p>
        </div>

        <div className="rounded-2xl border border-violet-500/25 bg-violet-950/20 p-4 shadow-md backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-400">Live GPS Telemetry</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
              <MapPin size={16} />
            </div>
          </div>
          <p className="text-3xl font-black text-violet-300">{trackingCount}</p>
          <p className="text-[10.5px] text-slate-400 font-medium mt-1">
            {outOfRange.length > 0 ? (
              <span className="text-rose-400 font-bold">🚨 {outOfRange.length} Out of Hotel</span>
            ) : (
              'All Within Hotel Range'
            )}
          </p>
        </div>
      </div>

      {/* ── Main Tab Selection Bar ── */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`flex-1 min-w-[160px] h-11 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'attendance'
              ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Users size={15} />
          <span>👥 Staff Directory</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
            activeSubTab === 'attendance' ? 'bg-black/20 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {totalCount}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('location')}
          className={`flex-1 min-w-[170px] h-11 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'location'
              ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MapPin size={15} />
          <span>📍 Live GPS Radar</span>
          {outOfRange.length > 0 && (
            <span className="w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
              {outOfRange.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`flex-1 min-w-[170px] h-11 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'accounts'
              ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Shield size={15} />
          <span>🔑 PMS Logins &amp; Roles</span>
        </button>

        <button
          onClick={() => setActiveSubTab('chat')}
          className={`flex-1 min-w-[160px] h-11 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeSubTab === 'chat'
              ? 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare size={15} />
          <span>💬 Staff Chat</span>
          {(() => {
            const totalUnread = chatSummaries.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
            return totalUnread > 0 ? (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full animate-pulse">
                {totalUnread}
              </span>
            ) : null;
          })()}
        </button>
      </div>

      {/* ══════════ LIVE GPS LOCATION TAB ══════════ */}
      {activeSubTab === 'location' && (
        <div className="space-y-5">
          {/* Settings Panel Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-bold text-slate-400">
              Auto-updating every 10s · Last updated {fmtAgo(lastRefresh.toISOString())}
            </span>
            <button
              onClick={() => setShowLocSettings(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                showLocSettings
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
              }`}
            >
              <Settings2 size={12} /> Geofence & Base Settings
            </button>
          </div>

          {/* Settings Drawer */}
          {showLocSettings && (
            <div className="bg-slate-900/80 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-indigo-400 tracking-widest uppercase">⚙️ Property Base & Geofence Settings</p>
                {saveMsg && <span className="text-xs font-black text-emerald-400">{saveMsg}</span>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Hotel Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={settingsDraft.baseLat}
                    onChange={e => setSettingsDraft(d => ({ ...d, baseLat: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Hotel Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={settingsDraft.baseLng}
                    onChange={e => setSettingsDraft(d => ({ ...d, baseLng: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Alert Radius — {fmtDist(settingsDraft.alertDistanceMeters)}
                  </label>
                  <input
                    type="range"
                    min={50}
                    max={10000}
                    step={50}
                    value={settingsDraft.alertDistanceMeters}
                    onChange={e => setSettingsDraft(d => ({ ...d, alertDistanceMeters: parseInt(e.target.value) }))}
                    className="w-full accent-indigo-500 mt-2"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold mt-0.5">
                    <span>50m</span>
                    <span>10km</span>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => setSettingsDraft(d => ({ ...d, trackingEnabled: !d.trackingEnabled }))}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-black border transition-all ${
                      settingsDraft.trackingEnabled
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {settingsDraft.trackingEnabled ? <><Eye size={13} /> Tracking Enabled</> : <><EyeOff size={13} /> Tracking Disabled</>}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 items-center flex-wrap pt-2 border-t border-white/5">
                <button
                  onClick={getMyLocation}
                  disabled={gettingBase}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-500/10 text-indigo-300 rounded-xl text-xs font-bold border border-indigo-500/25 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                >
                  <Crosshair size={12} /> {gettingBase ? 'Detecting…' : 'Use Current Device GPS as Hotel Base'}
                </button>
                <button
                  onClick={saveLocSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-600/20"
                >
                  <Save size={13} /> {savingSettings ? 'Saving…' : 'Save Geofence Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Tracked Users', val: locRows.length, color: 'text-indigo-400', bg: 'bg-indigo-950/30 border-indigo-500/20', icon: Users },
              { label: 'Active Live Pings', val: trackingCount, color: 'text-emerald-400', bg: 'bg-emerald-950/30 border-emerald-500/20', icon: Wifi },
              { label: 'Out of Geofence', val: outOfRange.length, color: outOfRange.length > 0 ? 'text-rose-400' : 'text-emerald-400', bg: outOfRange.length > 0 ? 'bg-rose-950/30 border-rose-500/20' : 'bg-emerald-950/30 border-emerald-500/20', icon: AlertTriangle },
              { label: 'Farthest Distance', val: fmtDist(farthest?.distanceFromBase ?? null), color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-500/20', icon: Ruler },
            ].map((c, i) => (
              <div key={i} className={`${c.bg} border rounded-2xl p-4 flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <c.icon size={18} className={c.color} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.label}</p>
                  <p className={`text-2xl font-black ${c.color} mt-0.5 leading-none`}>{c.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Map + List Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-5">
            {/* Live Interactive Map */}
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Target size={13} /> Live Hotel Map</span>
                <span className="text-indigo-400 font-mono">Radius: {fmtDist(locSettings.alertDistanceMeters)}</span>
              </div>
              
              <StaffMap staff={locRows} settings={locSettings} mapFocus={mapFocus} />

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>In Range</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Out of Range</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Hotel Base</span>
                </div>
              </div>
            </div>

            {/* Staff Location List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Live Personnel Locations ({locRows.length})
                </span>
                {outOfRange.length > 0 && (
                  <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/25 rounded-lg px-2.5 py-1 uppercase tracking-wider animate-pulse">
                    🚨 {outOfRange.length} Out of Geofence
                  </span>
                )}
              </div>

              {locLoading && locRows.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-900/30 rounded-2xl border border-white/5">
                  <div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold">Scanning GPS satellite pings…</p>
                </div>
              ) : locRows.length === 0 ? (
                <div className="text-center py-16 text-slate-400 bg-slate-900/30 border border-dashed border-white/5 rounded-2xl text-xs font-bold">
                  No staff location telemetry recorded yet. Pings will appear as mobile users sign into the Walkie-Talkie / Staff PWA.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {[...locRows]
                    .sort((a, b) => {
                      if (a.isOutOfRange !== b.isOutOfRange) return a.isOutOfRange ? -1 : 1;
                      return (b.distanceFromBase ?? -1) - (a.distanceFromBase ?? -1);
                    })
                    .map(row => {
                      const exp = expandedId === row.userId;
                      const alert = row.isOutOfRange;
                      return (
                        <div
                          key={row.userId}
                          className={`rounded-2xl border transition-all ${
                            alert
                              ? 'bg-rose-950/20 border-rose-500/30 shadow-[0_0_16px_rgba(244,63,94,0.08)]'
                              : 'bg-slate-900/50 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div
                            className="flex items-center gap-3 p-4 cursor-pointer"
                            onClick={() => setExpandedId(exp ? null : row.userId)}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black border ${
                                alert
                                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                                  : row.isTracking
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                    : 'bg-slate-800 border-white/5 text-slate-500'
                              }`}
                            >
                              {initials(row.fullName)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-white">{row.fullName}</span>
                                {alert && (
                                  <span className="text-[8px] font-black text-rose-400 bg-rose-500/15 border border-rose-500/30 rounded px-1.5 py-0.5 uppercase tracking-wider">
                                    OUT OF RANGE
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                {row.designation || 'Staff'} · Last seen {fmtAgo(row.lastSeen)}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              {row.latestPing && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setMapFocus({
                                      lat: row.latestPing!.lat,
                                      lng: row.latestPing!.lng,
                                      ts: Date.now()
                                    });
                                  }}
                                  className="p-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 active:scale-95 text-indigo-300 rounded-lg border border-indigo-500/20 transition-all flex items-center justify-center"
                                  title="Center on Map"
                                >
                                  <Navigation size={13} className="rotate-45" />
                                </button>
                              )}
                              <div className="text-right">
                                <p className={`text-base font-black leading-none ${alert ? 'text-rose-400' : row.isTracking ? 'text-emerald-400' : 'text-slate-500'}`}>
                                  {fmtDist(row.distanceFromBase)}
                                </p>
                                <p className="text-[8px] text-slate-400 font-bold mt-0.5">from hotel</p>
                              </div>
                            </div>

                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              {row.isTracking ? (
                                <Wifi size={13} className={alert ? 'text-rose-400' : 'text-emerald-400'} />
                              ) : (
                                <WifiOff size={13} className="text-slate-600" />
                              )}
                              {exp ? <ChevronUp size={12} className="text-slate-400" /> : <ChevronDown size={12} className="text-slate-400" />}
                            </div>
                          </div>

                          {exp && (
                            <div className="border-t border-white/5 p-4 space-y-3 bg-slate-950/40">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                📍 Location History (last 10 pings)
                              </p>
                              {row.history.length === 0 ? (
                                <p className="text-[11px] text-slate-500 italic">No GPS telemetry history recorded yet.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {row.history.map((p, i) => (
                                    <div
                                      key={p.id}
                                      className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-[11px] ${
                                        p.isOutOfRange
                                          ? 'bg-rose-950/20 border-rose-500/20'
                                          : 'bg-slate-900/60 border-white/5'
                                      }`}
                                    >
                                      <span className="text-slate-500 font-black w-4">#{i + 1}</span>
                                      <Clock size={10} className="text-slate-500 flex-shrink-0" />
                                      <span className="font-mono text-slate-300">{fmtTime(p.createdAt)}</span>
                                      <span className="font-mono text-slate-400 truncate">
                                        {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                                      </span>
                                      <span className={`ml-auto font-black flex-shrink-0 ${p.isOutOfRange ? 'text-rose-400' : 'text-emerald-400'}`}>
                                        {fmtDist(p.distanceFromBase)}
                                      </span>
                                      {p.isOutOfRange ? (
                                        <XCircle size={12} className="text-rose-400 flex-shrink-0" />
                                      ) : (
                                        <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {row.latestPing && (
                                <div className="flex items-center gap-4 px-3 py-2 bg-slate-900/80 rounded-xl font-mono text-[10px] text-slate-400">
                                  <span>🌐 <b>Lat:</b> {row.latestPing.lat.toFixed(6)}</span>
                                  <span><b>Lng:</b> {row.latestPing.lng.toFixed(6)}</span>
                                  <a
                                    href={`https://maps.google.com/?q=${row.latestPing.lat},${row.latestPing.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ml-auto text-indigo-400 font-bold hover:underline"
                                  >
                                    Open in Google Maps →
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ STAFF DIRECTORY & TEAM TAB ══════════ */}
      {activeSubTab === 'attendance' && (
        <div className="space-y-4">
          {/* Filters & Search Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md">
            <div className="relative w-full md:w-96">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search staff by name or role..."
                className="w-full h-10 pl-10 pr-4 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Department Filter Pills */}
            <div className="flex gap-1.5 flex-wrap w-full md:w-auto overflow-x-auto no-scrollbar py-0.5">
              {departments.map(d => {
                const label = d || 'ALL';
                const isSelected = dept === label;
                const count = label === 'ALL' 
                  ? staffMembers.length 
                  : staffMembers.filter(s => s.designation === label).length;
                return (
                  <button
                    key={label}
                    onClick={() => setDept(label)}
                    className={`h-9 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/30'
                        : 'bg-slate-800/70 hover:bg-slate-700/70 text-slate-300 hover:text-white border border-slate-700/60'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-black/20 text-white' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Staff Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 bg-slate-900/30 rounded-2xl border border-slate-800">
              <RefreshCw className="animate-spin text-blue-500" size={24} />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading staff directory...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
              <Users size={36} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">No matching staff members found</p>
              <p className="text-slate-500 text-[11px] mt-1">Try clearing your search query or department filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStaff.map(s => {
                const status = getStaffAttendanceStatus(s);
                const isOnline = status === 'PRESENT';
                const todayAtt = s.attendance?.[0] || s.user?.attendance?.[0];
                return (
                  <div key={s.id} className="rounded-2xl bg-[#0d1627]/90 border border-slate-800 hover:border-blue-500/40 p-4 transition-all duration-200 shadow-md group hover:bg-[#111c33] flex flex-col justify-between">
                    <div>
                      {/* Top Row: Avatar + Status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-sm font-black text-white shrink-0 shadow-md shadow-blue-600/30">
                              {s.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0d1627] ${
                              isOnline ? 'bg-emerald-400' : status === 'OUT_OF_RANGE' ? 'bg-rose-400 animate-ping' : 'bg-slate-500'
                            }`} />
                          </div>
                          <div>
                            <p className="text-xs font-black text-white group-hover:text-blue-300 transition-colors line-clamp-1">{s.name}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">{s.designation || 'Staff Member'}</p>
                          </div>
                        </div>

                        <span className={`text-[8.5px] font-black px-2 py-0.5 rounded-full border ${STATUS_COLOR[status] || STATUS_COLOR.ABSENT}`}>
                          {STATUS_LABEL[status] || status}
                        </span>
                      </div>

                      {/* Today's check-in / clock-in timestamp */}
                      {todayAtt ? (
                        <div className="mb-2 px-2 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[9.5px] text-slate-300 flex items-center justify-between">
                          <span className="text-slate-500">Today Clock-in:</span>
                          <span className="font-mono font-bold text-white">
                            {new Date(todayAtt.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {todayAtt.clockOut ? ` → ${new Date(todayAtt.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="mb-2 px-2 py-0.5 text-[9px] text-slate-500 italic">
                          Not checked in today yet
                        </div>
                      )}

                      {/* Role & Property Tags */}
                      <div className="flex flex-wrap gap-1 mb-2.5">
                        {s.user?.role?.name && (
                          <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                            🛡️ {s.user.role.name}
                          </span>
                        )}
                        {s.property?.name && (
                          <span className="text-[8.5px] font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                            🏨 {s.property.name}
                          </span>
                        )}
                      </div>

                      {/* Shift & Salary details */}
                      <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[10px] text-slate-300 space-y-1 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Shift Timing:</span>
                          <span className="font-bold">{getShiftHoursLabel(s.shiftHours)}</span>
                        </div>
                        {s.salary > 0 && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Monthly Salary:</span>
                            <span className="font-bold text-emerald-400">₹{s.salary.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {s.phone ? (
                          <a
                            href={`tel:${s.phone}`}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/25 transition-colors"
                            title="Call Staff"
                          >
                            <Phone size={10} />
                            <span>Call</span>
                          </a>
                        ) : null}

                        <button
                          onClick={() => {
                            setSelectedStaffChat(s);
                            setActiveSubTab('chat');
                          }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/25 transition-colors cursor-pointer"
                          title="Send Message"
                        >
                          <MessageSquare size={10} />
                          <span>Chat</span>
                        </button>
                      </div>

                      {/* 1-Click Check In / Clock Out button */}
                      <button
                        onClick={() => handleToggleAttendance(s, status)}
                        disabled={clockingId === s.id}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                          status === 'PRESENT' || status === 'OUT_OF_RANGE'
                            ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/30'
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/30'
                        }`}
                        title={status === 'PRESENT' || status === 'OUT_OF_RANGE' ? 'Clock Out Staff' : 'Check In Staff'}
                      >
                        {clockingId === s.id ? (
                          <RefreshCw size={9} className="animate-spin" />
                        ) : status === 'PRESENT' || status === 'OUT_OF_RANGE' ? (
                          <span>Clock Out</span>
                        ) : (
                          <span>Check In</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════ STAFF CREDENTIALS & ROLES TAB ══════════ */}
      {activeSubTab === 'accounts' && (
        <StaffManagement properties={properties} />
      )}

      {/* ══════════ STAFF & HOUSEKEEPER CHAT TAB ══════════ */}
      {activeSubTab === 'chat' && (
        <div className="bg-[#0b0f19] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[650px]">
          {/* Left Sidebar — Staff list with last messages */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/5 flex flex-col bg-[#070a12]">
            <div className="p-3 border-b border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Staff Conversations</span>
                <button
                  onClick={loadChatSummaries}
                  className="text-[9px] text-slate-400 hover:text-white bg-white/5 px-2 py-0.5 rounded transition-colors"
                >
                  Refresh
                </button>
              </div>
              <input
                type="text"
                placeholder="Search staff..."
                value={staffChatSearch}
                onChange={(e) => setStaffChatSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.03]">
              {chatSummaries.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No staff members found
                </div>
              ) : (
                chatSummaries
                  .filter((item) =>
                    !staffChatSearch ||
                    item.staff.name.toLowerCase().includes(staffChatSearch.toLowerCase()) ||
                    (item.staff.designation || '').toLowerCase().includes(staffChatSearch.toLowerCase())
                  )
                  .map((item) => {
                    const isSelected = selectedStaffChat?.id === item.staff.id;
                    const hasUnread = item.unreadCount > 0;
                    return (
                      <button
                        key={item.staff.id}
                        onClick={() => setSelectedStaffChat(item.staff)}
                        className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                          isSelected ? 'bg-purple-950/40 border-l-2 border-purple-500' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0 shadow">
                          {item.staff.avatarUrl ? (
                            <img src={item.staff.avatarUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            item.staff.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-white truncate">{item.staff.name}</span>
                            {item.latestMessage && (
                              <span className="text-[8px] text-slate-500">
                                {new Date(item.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-[9.5px] text-purple-400 font-semibold truncate">{item.staff.designation || 'Housekeeping'}</p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[9.5px] text-slate-400 truncate max-w-[150px]">
                              {item.latestMessage ? item.latestMessage.message : 'No messages yet'}
                            </p>
                            {hasUnread && (
                              <span className="w-4 h-4 bg-purple-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shrink-0 animate-pulse">
                                {item.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Right Main — Selected Staff Conversation */}
          <div className="flex-1 flex flex-col bg-[#0b0f19]">
            {selectedStaffChat ? (
              <>
                {/* Header */}
                <div className="p-3.5 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-black text-sm">
                      {selectedStaffChat.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{selectedStaffChat.name}</h4>
                      <p className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{selectedStaffChat.designation || 'Staff Member'}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                          Live Staff Portal Connected
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadAdminMessages(selectedStaffChat.id)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white text-[10px] font-bold"
                    >
                      Sync 🔄
                    </button>
                  </div>
                </div>

                {/* Messages Box */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {adminChatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                      <MessageSquare size={36} className="text-slate-600 mb-2 opacity-50" />
                      <p className="text-xs font-bold text-slate-400">No message history with {selectedStaffChat.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1 max-w-xs">
                        Send a task instruction, room cleaning alert, or reply to staff questions directly here.
                      </p>
                    </div>
                  ) : (
                    adminChatMessages.map((msg) => {
                      const isAdmin = msg.senderRole === 'ADMIN';
                      const timeStr = msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '';

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col max-w-[75%] ${
                            isAdmin ? 'ml-auto items-end' : 'mr-auto items-start'
                          }`}
                        >
                          <span className="text-[8.5px] font-bold text-slate-500 mb-1 px-1">
                            {isAdmin ? 'Admin (You)' : `🧹 ${msg.senderName || selectedStaffChat.name}`}
                          </span>
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed ${
                              isAdmin
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-purple-600/20'
                                : 'bg-[#161f30] text-slate-100 border border-white/10 rounded-tl-none'
                            }`}
                          >
                            {msg.message}
                          </div>
                          <span className="text-[7.5px] text-slate-500 mt-1 px-1">{timeStr}</span>
                        </div>
                      );
                    })
                  )}
                  <div ref={adminChatEndRef} />
                </div>

                {/* Quick Presets */}
                <div className="px-3 py-1.5 bg-black/20 border-t border-white/5 flex gap-1.5 overflow-x-auto">
                  {[
                    'Please clean Room #101 next 🧹',
                    'Guest checked in, inspect room now ⭐',
                    'Extra bath towels requested at Room #204 🧺',
                    'Maintenance team dispatched 🔧',
                    'Great job today, thank you 👍',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAdminSendMessage(undefined, preset)}
                      className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-purple-600/20 text-slate-400 hover:text-purple-300 border border-white/5 text-[9px] font-bold shrink-0 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleAdminSendMessage} className="p-3 border-t border-white/5 bg-white/[0.01] flex gap-2">
                  <input
                    type="text"
                    value={adminChatInput}
                    onChange={(e) => setAdminChatInput(e.target.value)}
                    placeholder={`Message ${selectedStaffChat.name}...`}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!adminChatInput.trim() || sendingAdminChat}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg shadow-purple-600/30"
                  >
                    <Send size={12} />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                Select a staff member from the left list to begin chat.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Quick Attendance & Reports Shortcuts ── */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-1 mb-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            ⚡ Quick Attendance &amp; Reports Portals
          </span>
          <span className="text-[9.5px] font-semibold text-slate-500">
            Dedicated Kiosks &amp; Analytics
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Link
            href="/hotel/staff/attendance"
            className="p-3.5 rounded-2xl bg-[#0d1627]/80 hover:bg-[#132038] border border-blue-500/20 hover:border-blue-500/40 transition-all group flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-white group-hover:text-blue-300 transition-colors">Staff Attendance Hub</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Live kiosk clock-in/out &amp; duty status</p>
            </div>
          </Link>

          <Link
            href="/hotel/staff/attendance-location"
            className="p-3.5 rounded-2xl bg-[#0d1627]/80 hover:bg-[#132038] border border-emerald-500/20 hover:border-emerald-500/40 transition-all group flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
              <Navigation size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">Punch Locations</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Geofence coordinate logs &amp; maps</p>
            </div>
          </Link>

          <Link
            href="/hotel/staff/location"
            className="p-3.5 rounded-2xl bg-[#0d1627]/80 hover:bg-[#132038] border border-violet-500/20 hover:border-violet-500/40 transition-all group flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 shrink-0 group-hover:scale-105 transition-transform">
              <Radio size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-white group-hover:text-violet-300 transition-colors">Proximity Radar</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Interactive proximity &amp; radius radar</p>
            </div>
          </Link>

          <Link
            href="/hotel/reports/attendance"
            className="p-3.5 rounded-2xl bg-[#0d1627]/80 hover:bg-[#132038] border border-amber-500/20 hover:border-amber-500/40 transition-all group flex items-center gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
              <BarChart3 size={18} />
            </div>
            <div>
              <p className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">Attendance Reports</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Shift logs, monthly hours &amp; exports</p>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Direct Add Staff Form Modal ── */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0d0d1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div>
                <p className="text-base font-black text-white">
                  Register New Staff Member
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                  Set user login credentials, POS permissions, shift targets and roles
                </p>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 max-h-[75vh] overflow-y-auto text-slate-800">
              <StaffMemberForm
                properties={properties}
                onSubmit={async (data) => {
                  setAddStaffLoading(true);
                  setAddStaffError('');
                  try {
                    const res = await fetch('/api/staff-members', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data),
                    }).then(r => r.json());

                    if (res.success) {
                      setShowAddStaffModal(false);
                      await fetchStaffData();
                    } else {
                      setAddStaffError(res.error || res.message || 'Failed to register staff member');
                    }
                  } catch (err: any) {
                    setAddStaffError(err.message || 'An error occurred while saving.');
                  } finally {
                    setAddStaffLoading(false);
                  }
                }}
                onCancel={() => setShowAddStaffModal(false)}
                loading={addStaffLoading}
              />
              {addStaffError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                  {addStaffError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function StaffPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <StaffPortalContent />
    </Suspense>
  );
}
