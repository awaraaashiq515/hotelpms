'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Users, Search, Clock, Phone, RefreshCw, MapPin,
  Wifi, WifiOff, AlertTriangle, ChevronDown, ChevronUp,
  Navigation, Ruler, Target, Settings2, Save, Crosshair,
  Eye, EyeOff, CheckCircle, XCircle, UserCheck, Radio,
  BarChart3, Shield, Tablet, Brush, ArrowLeft
} from 'lucide-react';
import StaffManagement from '@/components/admin/StaffManagement';

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
  PRESENT: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  ABSENT:  'text-rose-300 bg-rose-500/10 border-rose-500/20',
  LATE:    'text-amber-300 bg-amber-500/10 border-amber-500/20',
  LEAVE:   'text-slate-400 bg-slate-800 border-slate-700',
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
      : 'attendance';

  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'accounts' | 'location'>(initialTab);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('ALL');
  const [properties, setProperties] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Update activeSubTab if query param changes
  useEffect(() => {
    const qTab = searchParams?.get('tab');
    if (qTab === 'location') setActiveSubTab('location');
    else if (qTab === 'accounts') setActiveSubTab('accounts');
  }, [searchParams]);

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

  useEffect(() => {
    fetchStaffData();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'location') {
      setLocLoading(true);
      loadLocData();
    }
    const iv = setInterval(() => {
      if (activeSubTab === 'location') loadLocData();
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

  const getStatus = (s: any) => {
    if (!s.isActive) return 'LEAVE';
    return s.isActive ? 'PRESENT' : 'ABSENT';
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
  const present = staffMembers.filter(s => getStatus(s) === 'PRESENT').length;
  const absent  = staffMembers.filter(s => getStatus(s) === 'ABSENT').length;
  const leave   = staffMembers.filter(s => getStatus(s) === 'LEAVE').length;

  const outOfRange = locRows.filter(r => r.isOutOfRange);
  const trackingCount = locRows.filter(r => r.isTracking).length;
  const farthest = locRows.reduce<LocRow | null>((b, r) => {
    if (r.distanceFromBase === null) return b;
    if (!b || r.distanceFromBase > (b.distanceFromBase ?? 0)) return r;
    return b;
  }, null);

  return (
    <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
      
      {/* ━━━ Back Button ━━━ */}
      <div>
        <Link
          href="/hotel"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold transition-all shadow-sm group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-blue-400" />
          <span>Back to Hotel Dashboard</span>
        </Link>
      </div>

      {/* Header section */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-blue-400" />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">HR · Staff Management</span>
          </div>
          <h1 className="text-2xl font-black text-white">Staff & Attendance Portal</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage live GPS tracking, daily attendance, geofences and PMS/POS credentials</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/room-portal"
            target="_blank"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition-all"
          >
            <Tablet size={13} /> Room Tablet ↗
          </a>
          <a
            href="/housekeeper-portal"
            target="_blank"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-bold transition-all"
          >
            <Brush size={13} /> Housekeeper ↗
          </a>
          <a
            href="/security-portal"
            target="_blank"
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-all"
          >
            <Shield size={13} /> Security ↗
          </a>
          <button 
            onClick={() => {
              if (activeSubTab === 'location') {
                setLocLoading(true);
                loadLocData();
              } else {
                fetchStaffData();
              }
            }}
            className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all"
          >
            <RefreshCw size={12} className={loading || locLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Quick Navigation Cards: Dedicated Attendance Portals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link
          href="/hotel/staff/attendance"
          className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-950/40 to-slate-900/60 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
              <UserCheck size={16} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">HUB</span>
          </div>
          <p className="text-xs font-black text-white group-hover:text-blue-300 transition-colors">Staff Attendance Hub</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Live kiosk clock-in/out & duty status</p>
        </Link>

        <Link
          href="/hotel/staff/attendance-location"
          className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900/60 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Navigation size={16} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">GPS VERIFY</span>
          </div>
          <p className="text-xs font-black text-white group-hover:text-emerald-300 transition-colors">Punch Locations</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Geofence coordinate logs & maps</p>
        </Link>

        <Link
          href="/hotel/staff/location"
          className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-950/40 to-slate-900/60 border border-violet-500/20 hover:border-violet-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
              <Radio size={16} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">RADAR</span>
          </div>
          <p className="text-xs font-black text-white group-hover:text-violet-300 transition-colors">Proximity Radar</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Interactive proximity & radius radar</p>
        </Link>

        <Link
          href="/hotel/reports/attendance"
          className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900/60 border border-amber-500/20 hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <BarChart3 size={16} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">ANALYTICS</span>
          </div>
          <p className="text-xs font-black text-white group-hover:text-amber-300 transition-colors">Attendance Reports</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Shift logs, monthly hours & exports</p>
        </Link>
      </div>

      {/* Tab selection */}
      <div className="flex gap-2 border-b border-white/5 pb-3 flex-wrap">
        <button
          onClick={() => setActiveSubTab('location')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'location'
              ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-black'
              : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin size={13} />
          📍 Live GPS Tracking & Geofence
          {outOfRange.length > 0 && (
            <span className="ml-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
              {outOfRange.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'attendance'
              ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300 font-black'
              : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-slate-200'
          }`}
        >
          📅 Daily Attendance & Roster
        </button>

        <button
          onClick={() => setActiveSubTab('accounts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeSubTab === 'accounts'
              ? 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 font-black'
              : 'bg-white/[0.02] border border-white/5 text-slate-400 hover:text-slate-200'
          }`}
        >
          🔑 Staff Credentials & PMS/POS Roles
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

      {/* ══════════ DAILY ATTENDANCE TAB ══════════ */}
      {activeSubTab === 'attendance' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'Total Staff Members', value: totalCount, color:'text-blue-300 border-blue-500/20 bg-blue-900/20' },
              { label:'Active / On-Duty', value: present, color:'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
              { label:'Inactive / Off', value: absent, color:'text-rose-300 border-rose-500/20 bg-rose-900/20' },
              { label:'On Leave', value: leave, color:'text-slate-400 border-slate-700 bg-slate-800/40' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search staff by name or designation…"
                className="w-full h-10 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {departments.map(d => (
                <button
                  key={d || 'Staff'}
                  onClick={() => setDept(d || 'ALL')}
                  className={`px-3 h-10 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${
                    dept === (d || 'ALL') ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {d || 'Staff'}
                </button>
              ))}
            </div>
          </div>

          {/* Staff Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw className="animate-spin text-blue-500" size={24} />
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading staff directory...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-2xl">
              <Users size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">No matching staff accounts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {filteredStaff.map(s => {
                const status = getStatus(s);
                return (
                  <div key={s.id} className="rounded-2xl bg-slate-900/50 border border-white/5 p-4 hover:border-blue-500/30 transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-sm font-black text-white shrink-0">
                        {s.name.split(' ').map((n: string) => n[0]).join('')}
                      </div>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${STATUS_COLOR[status]}`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-xs font-black text-white">{s.name}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{s.designation || 'Staff Member'}</p>
                    
                    {s.user?.role?.name && (
                      <span className="inline-block mt-1 text-[8px] font-black px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 uppercase tracking-wider">
                        👤 {s.user.role.name}
                      </span>
                    )}

                    {s.property?.name && (
                      <span className="inline-block mt-1 ml-1 text-[8px] font-black px-2 py-0.5 rounded-full bg-slate-700/60 border border-white/10 text-slate-400">
                        🏨 {s.property.name}
                      </span>
                    )}

                    <p className="text-[9px] text-slate-600 mt-1">
                      Shift: {getShiftHoursLabel(s.shiftHours)} {s.salary > 0 && `· ₹${s.salary}/mo`}
                    </p>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      {s.user?.email ? (
                        <span className="text-[9px] text-slate-400 flex items-center gap-1">
                          <Clock size={9} className="text-slate-600" /> credentials linked
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-600">no login credentials</span>
                      )}
                      {s.phone && (
                        <a href={`tel:${s.phone}`} className="text-[9px] text-blue-400 hover:text-blue-300">
                          <Phone size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════ STAFF CREDENTIALS & ROLES TAB ══════════ */}
      {activeSubTab === 'accounts' && (
        <StaffManagement properties={properties} />
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
