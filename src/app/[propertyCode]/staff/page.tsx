'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users, Plus, Edit, Trash2, Search, UserCheck, UserX, MapPin,
  RefreshCw, AlertTriangle, Wifi, WifiOff, ChevronDown, ChevronUp,
  Navigation, Clock, Ruler, Target, Settings2, Save, Crosshair,
  Eye, EyeOff, CheckCircle, XCircle, ClipboardList
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusButton } from '@/components/shared/status-button';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { staffApi, StaffUser } from '@/lib/api/staff';
import { StaffForm } from '@/components/forms/staff-form';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';
import { useToast } from '@/components/ui/Toast';

/* ─── Location types ─── */
interface Ping { id: string; lat: number; lng: number; distanceFromBase: number; isOutOfRange: boolean; createdAt: string; }
interface LocRow { userId: string; fullName: string; designation: string | null; phone: string | null; wtStatus: string; latestPing: Ping | null; lastSeen: string | null; distanceFromBase: number | null; isOutOfRange: boolean; isTracking: boolean; history: Ping[]; }
interface LocSettings { baseLat: number; baseLng: number; alertDistanceMeters: number; trackingEnabled: boolean; }

/* ─── Helpers ─── */
function fmtDist(m: number | null) { if (m === null) return '—'; if (m < 1000) return `${Math.round(m)} m`; return `${(m / 1000).toFixed(2)} km`; }
function fmtAgo(iso: string | null) { if (!iso) return 'Never'; const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s / 60)}m ago`; return `${Math.floor(s / 3600)}h ago`; }
function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function initials(n: string) { return n.split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2); }

/* ─── Staff Map (Leaflet with Google/Dark Layers) ─── */
function StaffMap({ staff, settings }: { staff: LocRow[]; settings: LocSettings }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<'dark' | 'google' | 'satellite'>('dark');
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  const baseMarkerRef = useRef<any>(null);

  // Load Leaflet resources dynamically
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

  // Update map type tile layer when mapType changes
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !leafletMapRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    let attribution = '&copy; CARTO &copy; OpenStreetMap';

    if (mapType === 'google') {
      url = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps';
    } else if (mapType === 'satellite') {
      url = 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Satellite';
    }

    tileLayerRef.current = L.tileLayer(url, {
      maxZoom: 20,
      attribution
    }).addTo(leafletMapRef.current);
  }, [mapLoaded, mapType]);

  // Main marker/drawing updates
  useEffect(() => {
    const L = (window as any).L;
    if (!mapLoaded || !mapRef.current || !L) return;

    const baseLat = settings.baseLat || 0;
    const baseLng = settings.baseLng || 0;

    // Initialize map if it doesn't exist
    if (!leafletMapRef.current) {
      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: true
      }).setView([baseLat, baseLng], 15);

      leafletMapRef.current = map;

      // Apply initial tile layer (Dark Mode matching dashboard)
      tileLayerRef.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; CARTO &copy; OpenStreetMap'
      }).addTo(map);
    }

    const map = leafletMapRef.current;

    // Clear old layers
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

    // Add Base property marker and alert distance circle
    if (baseLat !== 0 || baseLng !== 0) {
      const baseIcon = L.divIcon({
        html: `<div class="w-8 h-8 rounded-full bg-indigo-600 border-2 border-white shadow-lg flex items-center justify-center text-sm" style="box-shadow: 0 0 12px rgba(99,102,241,0.6);">🏠</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      baseMarkerRef.current = L.marker([baseLat, baseLng], { icon: baseIcon })
        .addTo(map)
        .bindPopup(`<div class="text-slate-900 font-bold p-1 text-xs">Property Base Location</div>`);

      circleRef.current = L.circle([baseLat, baseLng], {
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4, 4',
        radius: settings.alertDistanceMeters || 500
      }).addTo(map);
    }

    // Add Staff markers
    const tracked = staff.filter(s => s.isTracking && s.latestPing);

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

    // Auto-fit zoom bounds to show base + all active staff
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

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 bg-slate-950/50">
      {/* Map style selector */}
      <div className="absolute top-2.5 right-2.5 z-[1000] flex bg-slate-900/90 dark:bg-slate-950/90 border border-white/10 rounded-lg p-0.5 shadow-lg backdrop-blur-md">
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

      <div ref={mapRef} className="w-full relative" style={{ height: '350px' }} />
    </div>
  );
}

/* ══════════════════════════════════════ */
export default function StaffPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'list' | 'location' | 'assignments'>(
    searchParams?.get('tab') === 'location' 
      ? 'location' 
      : searchParams?.get('tab') === 'assignments' 
        ? 'assignments' 
        : 'list'
  );

  /* ── Staff list state ── */
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  /* ── Location state ── */
  const [locRows, setLocRows] = useState<LocRow[]>([]);
  const [locSettings, setLocSettings] = useState<LocSettings>({ baseLat: 0, baseLng: 0, alertDistanceMeters: 500, trackingEnabled: true });
  const [locLoading, setLocLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showLocSettings, setShowLocSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<LocSettings>({ baseLat: 0, baseLng: 0, alertDistanceMeters: 500, trackingEnabled: true });
  const [savingSettings, setSavingSettings] = useState(false);
  const [gettingBase, setGettingBase] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  /* ── Table Assignments state ── */
  interface AssignStaff { id: string; fullName: string; email: string; role: string; assignedTableIds: string[]; }
  interface AssignTable { id: string; name: string; floor: { id: string; name: string; } }

  const [assignStaff, setAssignStaff] = useState<AssignStaff[]>([]);
  const [assignTables, setAssignTables] = useState<AssignTable[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedAssignStaff, setSelectedAssignStaff] = useState<AssignStaff | null>(null);
  const [draftTableIds, setDraftTableIds] = useState<string[]>([]);
  const [savingAssign, setSavingAssign] = useState(false);

  const fetchAssignments = useCallback(async () => {
    setAssignLoading(true);
    try {
      const res = await fetch('/api/staff-table-assignments');
      if (!res.ok) return;
      const j = await res.json();
      if (j.success) {
        setAssignStaff(j.data.staff || []);
        setAssignTables(j.data.tables || []);
      }
    } catch {
      showToast('Failed to load assignments', 'error');
    } finally {
      setAssignLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeTab === 'assignments') {
      fetchAssignments();
      setSelectedAssignStaff(null);
      setDraftTableIds([]);
    }
  }, [activeTab, fetchAssignments]);

  const handleSelectStaff = (s: AssignStaff) => {
    setSelectedAssignStaff(s);
    setDraftTableIds(s.assignedTableIds || []);
  };

  const handleToggleTable = (tableId: string) => {
    setDraftTableIds(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const handleSelectAllTables = () => {
    setDraftTableIds(assignTables.map(t => t.id));
  };

  const handleDeselectAllTables = () => {
    setDraftTableIds([]);
  };

  const saveAssignments = async () => {
    if (!selectedAssignStaff) return;
    setSavingAssign(true);
    try {
      const res = await fetch('/api/staff-table-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedAssignStaff.id, tableIds: draftTableIds })
      });
      if (res.ok) {
        showToast('Table assignments saved successfully', 'success');
        await fetchAssignments();
        // Update selection with new state
        const updated = assignStaff.find(s => s.id === selectedAssignStaff.id);
        if (updated) {
          setSelectedAssignStaff({
            ...selectedAssignStaff,
            assignedTableIds: draftTableIds
          });
        }
      } else {
        showToast('Failed to save assignments', 'error');
      }
    } catch {
      showToast('Failed to save assignments', 'error');
    } finally {
      setSavingAssign(false);
    }
  };

  // Group tables by floor for the checkbox grid layout
  const groupedTables: { [floorName: string]: AssignTable[] } = {};
  assignTables.forEach(t => {
    const floorName = t.floor?.name || 'General';
    if (!groupedTables[floorName]) groupedTables[floorName] = [];
    groupedTables[floorName].push(t);
  });

  /* ── Staff list fetch ── */
  const fetchStaff = async () => {
    setLoading(true);
    try { const data = await staffApi.list(); setStaff(data || []); }
    catch { showToast('Failed to load staff list', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchStaff(); }, []);

  const handleDelete = async () => {
    if (!selectedStaff) return;
    setMutationLoading(true);
    try { await staffApi.delete(selectedStaff.id); showToast('Staff member deleted', 'success'); fetchStaff(); setIsDeleteOpen(false); }
    catch (e: any) { showToast(e.message || 'Delete failed', 'error'); }
    finally { setMutationLoading(false); }
  };

  /* ── Location fetch ── */
  const loadLocData = useCallback(async () => {
    try {
      const res = await fetch('/api/staff-location/list');
      if (!res.ok) return;
      const j = await res.json();
      if (j.success) { setLocRows(j.data || []); if (j.settings) { setLocSettings(j.settings); setSettingsDraft(j.settings); } setLastRefresh(new Date()); }
    } catch { }
    finally { setLocLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'location') { setLocLoading(true); loadLocData(); }
    const iv = setInterval(() => { if (activeTab === 'location') loadLocData(); }, 30000);
    return () => clearInterval(iv);
  }, [activeTab, loadLocData]);

  /* ── Save location settings ── */
  const saveLocSettings = async () => {
    setSavingSettings(true); setSaveMsg('');
    try {
      const res = await fetch('/api/staff-location/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settingsDraft) });
      if (res.ok) { const j = await res.json(); setLocSettings(j.data); setSaveMsg('✓ Saved'); setTimeout(() => setSaveMsg(''), 2500); await loadLocData(); }
    } catch { setSaveMsg('❌ Error'); }
    finally { setSavingSettings(false); }
  };

  const getMyLocation = () => {
    setGettingBase(true);
    navigator.geolocation.getCurrentPosition(p => { setSettingsDraft(d => ({ ...d, baseLat: p.coords.latitude, baseLng: p.coords.longitude })); setGettingBase(false); }, () => { alert('Location access denied'); setGettingBase(false); });
  };

  /* ── Filtered staff list ── */
  const filteredStaff = staff.filter(s => s.fullName.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  const outOfRange = locRows.filter(r => r.isOutOfRange);
  const trackingCount = locRows.filter(r => r.isTracking).length;
  const farthest = locRows.reduce<LocRow | null>((b, r) => { if (r.distanceFromBase === null) return b; if (!b || r.distanceFromBase > (b.distanceFromBase ?? 0)) return r; return b; }, null);

  /* ── DataTable columns ── */
  const columns = [
    { header: 'Full Name', cell: (row: StaffUser) => (<div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary font-black text-[10px]">{row.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}</div><div className="flex flex-col"><span className="text-sm font-bold text-gray-900 dark:text-slate-200 uppercase tracking-tight">{row.fullName}</span><span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">{row.email}</span></div></div>), width: '300px' },
    { header: 'Role', cell: (row: StaffUser) => (<span className="text-[10px] font-bold text-pos-primary uppercase tracking-widest bg-pos-primary/10 px-3 py-1 rounded-full">{row.role?.name || 'Staff'}</span>), width: '150px' },
    { header: 'Status', cell: (row: StaffUser) => (<div className="flex items-center gap-2"><StatusButton status={row.isActive ? 'active' : 'inactive'} />{row.isActive ? <UserCheck size={14} className="text-emerald-500" /> : <UserX size={14} className="text-red-400" />}</div>), width: '150px' },
    { header: 'Actions', cell: (row: StaffUser) => (<div className="flex items-center gap-2"><button onClick={() => { setSelectedStaff(row); setIsFormOpen(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-pos-primary transition-colors"><Edit size={16} /></button><button onClick={() => { setSelectedStaff(row); setIsDeleteOpen(true); }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-600 transition-colors"><Trash2 size={16} /></button></div>), width: '120px' },
  ];

  /* ── Tab bar ── */
  const tabs = [
    { id: 'list' as const, label: 'Staff List', icon: Users },
    { id: 'location' as const, label: 'Location Tracker', icon: MapPin, badge: outOfRange.length > 0 ? outOfRange.length : undefined },
    { id: 'assignments' as const, label: 'Table Assignments', icon: ClipboardList }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        subtitle="Manage staff access and track real-time locations"
        showBack
        backUrl="/operations"
        actions={
          activeTab === 'list' ? (
            <Button onClick={() => { setSelectedStaff(null); setIsFormOpen(true); }} className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-200">
              <Plus size={16} className="mr-2" /> ADD STAFF MEMBER
            </Button>
          ) : activeTab === 'location' ? (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">Updated {fmtAgo(lastRefresh.toISOString())}</span>
              <button onClick={() => { setLocLoading(true); loadLocData(); }} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black border border-indigo-500/20 transition-all">
                <RefreshCw size={11} /> Refresh
              </button>
              <button onClick={() => setShowLocSettings(v => !v)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-black border transition-all ${showLocSettings ? 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30' : 'bg-transparent text-slate-400 border-slate-200 dark:border-white/10 hover:text-indigo-500'}`}>
                <Settings2 size={11} /> Settings
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={fetchAssignments} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black border border-indigo-500/20 transition-all">
                <RefreshCw size={11} /> Refresh
              </button>
            </div>
          )
        }
      />

      {/* ── Tab Bar ── */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all relative ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}>
            <tab.icon size={13} />
            {tab.label}
            {tab.badge !== undefined && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════════ STAFF LIST TAB ══════════ */}
      {activeTab === 'list' && (
        <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-slate-900/20">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
              <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs w-full focus:ring-2 focus:ring-pos-primary/20 transition-all font-medium text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-600" />
            </div>
          </div>
          <DataTable columns={columns} data={filteredStaff} loading={loading} />
        </div>
      )}

      {/* ══════════ LOCATION TAB ══════════ */}
      {activeTab === 'location' && (
        <div className="space-y-5">

          {/* Settings Panel */}
          {showLocSettings && (
            <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-5">
              <p className="text-[9px] font-black text-indigo-500 tracking-widest uppercase mb-4">⚙️ Location Tracking Settings</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Base Latitude</label>
                  <input type="number" step="any" value={settingsDraft.baseLat} onChange={e => setSettingsDraft(d => ({ ...d, baseLat: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Base Longitude</label>
                  <input type="number" step="any" value={settingsDraft.baseLng} onChange={e => setSettingsDraft(d => ({ ...d, baseLng: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-1">Alert Distance — {fmtDist(settingsDraft.alertDistanceMeters)}</label>
                  <input type="range" min={50} max={10000} step={50} value={settingsDraft.alertDistanceMeters} onChange={e => setSettingsDraft(d => ({ ...d, alertDistanceMeters: parseInt(e.target.value) }))} className="w-full accent-indigo-500 mt-2" />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold mt-0.5"><span>50m</span><span>10km</span></div>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  <button onClick={() => setSettingsDraft(d => ({ ...d, trackingEnabled: !d.trackingEnabled }))} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${settingsDraft.trackingEnabled ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 text-red-500 border-red-200 dark:border-red-500/20'}`}>
                    {settingsDraft.trackingEnabled ? <><Eye size={11} /> ON</> : <><EyeOff size={11} /> OFF</>}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-4 items-center">
                <button onClick={getMyLocation} disabled={gettingBase} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black border border-indigo-500/20 hover:bg-indigo-500/20 transition-all disabled:opacity-50">
                  <Crosshair size={11} /> {gettingBase ? 'Getting…' : 'Use My Location as Base'}
                </button>
                <button onClick={saveLocSettings} disabled={savingSettings} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black transition-all shadow-md shadow-indigo-500/20">
                  <Save size={11} /> {savingSettings ? 'Saving…' : 'Save Settings'}
                </button>
                {saveMsg && <span className="text-[10px] font-black text-emerald-500">{saveMsg}</span>}
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Staff', val: locRows.length, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20', icon: Users },
              { label: 'Tracked Now', val: trackingCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', icon: Wifi },
              { label: 'Out of Range', val: outOfRange.length, color: outOfRange.length > 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400', bg: outOfRange.length > 0 ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', icon: AlertTriangle },
              { label: 'Farthest', val: fmtDist(farthest?.distanceFromBase ?? null), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', icon: Ruler },
            ].map((c, i) => (
              <div key={i} className={`${c.bg} border rounded-2xl p-4 flex items-center gap-3`}>
                <div className={`w-9 h-9 rounded-xl ${c.bg} border ${c.bg.split(' ')[2]} flex items-center justify-center ${c.color} flex-shrink-0`}><c.icon size={16} /></div>
                <div><p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{c.label}</p><p className={`text-xl font-black ${c.color} mt-0.5 leading-none`}>{c.val}</p></div>
              </div>
            ))}
          </div>

          {/* Map + List Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">

            {/* Live Interactive Map */}
            <div className="bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><Target size={11} /> Proximity Map</div>
              <StaffMap staff={locRows} settings={locSettings} />
              <div className="space-y-2">
                {[{ c: '#34d399', l: 'In Range' }, { c: '#f87171', l: 'Out of Range' }, { c: '#6366f1', l: 'Base Location' }].map(x => (
                  <div key={x.l} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: x.c }} /><span className="text-[9px] font-bold text-slate-400">{x.l}</span></div>
                ))}
              </div>
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
                <p className="text-[8px] font-black text-red-400 uppercase tracking-widest">Alert Threshold</p>
                <p className="text-sm font-black text-red-500 mt-1">{fmtDist(locSettings.alertDistanceMeters)}</p>
              </div>
            </div>

            {/* Staff Location List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">All Staff ({locRows.length})</span>
                {outOfRange.length > 0 && (
                  <span className="text-[8px] font-black text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-2.5 py-1 uppercase tracking-wider animate-pulse">
                    🚨 {outOfRange.length} Out of Range
                  </span>
                )}
              </div>

              {locLoading ? (
                <div className="text-center py-10 text-slate-400"><div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />Loading…</div>
              ) : locRows.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-white dark:bg-slate-900/30 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-sm font-semibold">No staff found.</div>
              ) : (
                [...locRows].sort((a, b) => { if (a.isOutOfRange !== b.isOutOfRange) return a.isOutOfRange ? -1 : 1; return (b.distanceFromBase ?? -1) - (a.distanceFromBase ?? -1); }).map(row => {
                  const exp = expandedId === row.userId;
                  const alert = row.isOutOfRange;
                  return (
                    <div key={row.userId} className={`rounded-2xl border overflow-hidden transition-all ${alert ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 shadow-[0_0_16px_rgba(239,68,68,0.07)]' : 'bg-white dark:bg-slate-900/50 border-gray-100 dark:border-white/5'}`}>
                      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpandedId(exp ? null : row.userId)}>
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-[10px] font-black border ${alert ? 'bg-red-100 dark:bg-red-500/15 border-red-200 dark:border-red-500/25 text-red-500' : row.isTracking ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/25 text-emerald-600' : 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-white/5 text-slate-400'}`}>
                          {initials(row.fullName)}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-gray-900 dark:text-slate-100">{row.fullName}</span>
                            {alert && <span className="text-[7px] font-black text-red-500 bg-red-100 dark:bg-red-500/15 border border-red-200 dark:border-red-500/25 rounded px-1.5 py-0.5 uppercase tracking-wider">OUT OF RANGE</span>}
                          </div>
                          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">{row.designation || 'Staff'} · Last seen {fmtAgo(row.lastSeen)}</p>
                        </div>
                        {/* Distance */}
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-black leading-none ${alert ? 'text-red-500' : row.isTracking ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'}`}>{fmtDist(row.distanceFromBase)}</p>
                          <p className="text-[8px] text-slate-400 font-bold mt-0.5">from base</p>
                        </div>
                        {/* Status + chevron */}
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                          {row.isTracking ? <Wifi size={12} className={alert ? 'text-red-400' : 'text-emerald-500'} /> : <WifiOff size={12} className="text-slate-300 dark:text-slate-600" />}
                          {exp ? <ChevronUp size={11} className="text-slate-400" /> : <ChevronDown size={11} className="text-slate-400" />}
                        </div>
                      </div>

                      {/* Expanded */}
                      {exp && (
                        <div className="border-t border-gray-100 dark:border-white/5 p-4 space-y-3">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">📍 Location History (last 10 pings)</p>
                          {row.history.length === 0 ? (
                            <p className="text-[10px] text-slate-400 italic">No history yet.</p>
                          ) : (
                            <div className="space-y-1.5">
                              {row.history.map((p, i) => (
                                <div key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-[10px] ${p.isOutOfRange ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/15' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-white/5'}`}>
                                  <span className="text-slate-300 font-black w-4">#{i + 1}</span>
                                  <Clock size={9} className="text-slate-300 flex-shrink-0" />
                                  <span className="font-mono text-slate-500 dark:text-slate-400">{fmtTime(p.createdAt)}</span>
                                  <Navigation size={9} className="text-slate-300 flex-shrink-0 ml-1" />
                                  <span className="font-mono text-slate-400 truncate">{p.lat.toFixed(5)}, {p.lng.toFixed(5)}</span>
                                  <span className={`ml-auto font-black flex-shrink-0 ${p.isOutOfRange ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>{fmtDist(p.distanceFromBase)}</span>
                                  {p.isOutOfRange ? <XCircle size={10} className="text-red-400 flex-shrink-0" /> : <CheckCircle size={10} className="text-emerald-500 flex-shrink-0" />}
                                </div>
                              ))}
                            </div>
                          )}
                          {row.latestPing && (
                            <div className="flex items-center gap-4 px-3 py-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl font-mono text-[9px] text-slate-400">
                              <span>🌐 <b>Lat:</b> {row.latestPing.lat.toFixed(6)}</span>
                              <span><b>Lng:</b> {row.latestPing.lng.toFixed(6)}</span>
                              <a href={`https://maps.google.com/?q=${row.latestPing.lat},${row.latestPing.lng}`} target="_blank" rel="noreferrer" className="ml-auto text-indigo-500 font-black hover:underline">Open in Maps →</a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ TABLE ASSIGNMENTS TAB ══════════ */}
      {activeTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
          {/* Staff List */}
          <div className="bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-white/5 rounded-3xl p-5 space-y-4">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Users size={12} /> Select Staff Member
            </div>
            
            {assignLoading ? (
              <div className="text-center py-10 text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
                Loading assignments...
              </div>
            ) : assignStaff.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">No staff users found.</div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {assignStaff.map(s => {
                  const isSelected = selectedAssignStaff?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectStaff(s)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/25 shadow-sm' 
                          : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-black text-gray-900 dark:text-slate-100">{s.fullName}</span>
                        <span className="text-[7px] font-black tracking-widest text-indigo-500 uppercase bg-indigo-500/10 px-2 py-0.5 rounded">
                          {s.role}
                        </span>
                      </div>
                      <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500 break-all">{s.email}</span>
                      <div className="mt-1.5 pt-2 border-t border-dashed border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Assigned Tables</span>
                        <span className={`text-[10px] font-black ${s.assignedTableIds.length > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                          {s.assignedTableIds.length === 0 
                            ? 'None (Sees All)' 
                            : `${s.assignedTableIds.length} Table${s.assignedTableIds.length > 1 ? 's' : ''}`
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assignments Editor */}
          <div className="bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-white/5 rounded-3xl p-6 flex flex-col min-h-[450px]">
            {!selectedAssignStaff ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500">
                <ClipboardList size={32} className="mb-3 text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold">No Staff Selected</p>
                <p className="text-[10px] max-w-xs mt-1 leading-relaxed">
                  Select a staff member from the left panel to assign their tables and control which notifications they receive.
                </p>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-gray-100 dark:border-white/5 pb-4">
                  <div>
                    <h3 className="text-base font-black text-gray-900 dark:text-slate-100">
                      Assign Tables to {selectedAssignStaff.fullName}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                      {selectedAssignStaff.fullName} ({selectedAssignStaff.role}) will only receive notifications (waiter calls, checkout pings) for checked tables.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAllTables}
                      className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-[9px] font-black rounded-lg uppercase tracking-wider transition-all"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAllTables}
                      className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-[9px] font-black rounded-lg uppercase tracking-wider transition-all"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Grid of Floors and Tables */}
                <div className="flex-1 overflow-y-auto space-y-5 pr-1 max-h-[400px]">
                  {Object.entries(groupedTables).length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-10">No tables configured for this property. Add tables in Floor Layout first.</p>
                  ) : (
                    Object.entries(groupedTables).map(([floorName, items]) => (
                      <div key={floorName} className="space-y-2.5">
                        <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-500/10 pb-1">
                          🏢 Floor: {floorName}
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {items.map(t => {
                            const isChecked = draftTableIds.includes(t.id);
                            return (
                              <div
                                key={t.id}
                                onClick={() => handleToggleTable(t.id)}
                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                  isChecked
                                    ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-300 dark:border-emerald-500/30'
                                    : 'bg-gray-50 dark:bg-slate-900/30 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                                }`}
                              >
                                <span className={`text-xs font-black ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {t.name}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // handled by parent div click
                                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500/20 border-gray-200"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Save Actions */}
                <div className="border-t border-gray-100 dark:border-white/5 pt-4 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold">
                    {draftTableIds.length === 0 
                      ? '⚠️ No tables selected. Will receive ALL notifications.' 
                      : `Selected: ${draftTableIds.length} table${draftTableIds.length > 1 ? 's' : ''}`
                    }
                  </span>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => setSelectedAssignStaff(null)}
                      className="px-4 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 text-xs font-bold rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveAssignments}
                      disabled={savingAssign}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-500/10 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Save size={14} />
                      {savingAssign ? 'Saving…' : 'Save Assignments'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Staff form modal */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}>
        <StaffForm initialData={selectedStaff} onSuccess={() => { setIsFormOpen(false); fetchStaff(); }} onCancel={() => setIsFormOpen(false)} />
      </Modal>

      {isDeleteOpen && (
        <ConfirmDeleteModal onCancel={() => setIsDeleteOpen(false)} onConfirm={handleDelete} title="Delete Staff Member" message={`Are you sure you want to delete ${selectedStaff?.fullName}? This action cannot be undone.`} loading={mutationLoading} />
      )}
    </div>
  );
}
