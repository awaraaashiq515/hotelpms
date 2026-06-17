'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, AlertTriangle, Users, Navigation, Settings2, RefreshCw,
  CheckCircle, XCircle, Clock, Ruler, Wifi, WifiOff, ChevronDown,
  ChevronUp, Target, Crosshair, Save, Eye, EyeOff, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/* ─── Types ─── */
interface Ping {
  id: string;
  lat: number;
  lng: number;
  distanceFromBase: number;
  isOutOfRange: boolean;
  createdAt: string;
}
interface StaffRow {
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
interface LocationSettings {
  baseLat: number;
  baseLng: number;
  alertDistanceMeters: number;
  trackingEnabled: boolean;
}

/* ─── Helpers ─── */
function fmtDist(m: number | null): string {
  if (m === null) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(2)} km`;
}
function fmtTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmtAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  return `${Math.floor(sec / 3600)}h ago`;
}
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

/* ─── Distance Ring Visualizer ─── */
function DistanceRing({ staff, settings }: { staff: StaffRow[]; settings: LocationSettings }) {
  const threshold = settings.alertDistanceMeters || 500;
  const tracked = staff.filter(s => s.isTracking && s.distanceFromBase !== null);
  const maxDist = Math.max(threshold * 1.5, ...tracked.map(s => s.distanceFromBase!));

  return (
    <div style={{
      position: 'relative', width: '100%', paddingBottom: '100%',
      background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, rgba(0,0,0,0) 70%)',
      borderRadius: '50%', border: '1.5px solid rgba(99,102,241,0.12)',
    }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Rings */}
        {[0.33, 0.66, 1].map((f, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${f * 100}%`, height: `${f * 100}%`,
            borderRadius: '50%',
            border: `1px ${i === 2 ? 'dashed' : 'solid'} ${i === 2 ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.12)'}`,
          }} />
        ))}

        {/* Base pin */}
        <div style={{
          position: 'absolute', zIndex: 10,
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#818cf8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 6px rgba(99,102,241,0.12)',
          fontSize: 12,
        }}>
          🏠
        </div>

        {/* Staff dots */}
        {tracked.map(s => {
          const ratio = Math.min(1, (s.distanceFromBase! / maxDist));
          // Place dot at a fixed angle based on userId hash
          const hash = s.userId.charCodeAt(0) + s.userId.charCodeAt(s.userId.length - 1);
          const angle = ((hash * 137) % 360) * (Math.PI / 180);
          const r = ratio * 46; // % from centre
          const x = 50 + r * Math.cos(angle);
          const y = 50 + r * Math.sin(angle);
          return (
            <div key={s.userId} title={`${s.fullName} — ${fmtDist(s.distanceFromBase)}`} style={{
              position: 'absolute',
              left: `calc(${x}% - 12px)`, top: `calc(${y}% - 12px)`,
              width: 24, height: 24, borderRadius: '50%',
              background: s.isOutOfRange
                ? 'linear-gradient(135deg,#ef4444,#f87171)'
                : 'linear-gradient(135deg,#34d399,#6ee7b7)',
              border: '2px solid rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 900, color: '#fff',
              boxShadow: s.isOutOfRange ? '0 0 8px rgba(239,68,68,0.5)' : '0 0 6px rgba(52,211,153,0.4)',
              cursor: 'default', zIndex: 5,
            }}>
              {initials(s.fullName)}
            </div>
          );
        })}

        {/* Threshold label */}
        <div style={{
          position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
          fontSize: 8, color: 'rgba(239,68,68,0.7)', fontWeight: 800, letterSpacing: '0.1em',
          textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          ⚠ {fmtDist(threshold)} limit
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════ */
const addressCache: { [coords: string]: string } = {};

const ResolvedAddress = ({ coordinates, isOutOfRange, defaultLabel }: { coordinates: string | null; isOutOfRange: boolean; defaultLabel: string }) => {
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coordinates) return;
    
    if (!isOutOfRange) {
      setAddress('Inside Restaurant');
      return;
    }

    if (addressCache[coordinates]) {
      setAddress(addressCache[coordinates]);
      return;
    }

    const fetchAddress = async () => {
      setLoading(true);
      try {
        const [lat, lng] = coordinates.split(',');
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.trim()}&lon=${lng.trim()}&zoom=16`);
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          const clean = parts.slice(0, 3).join(',').trim();
          addressCache[coordinates] = clean;
          setAddress(clean);
        } else {
          setAddress(coordinates);
        }
      } catch (err) {
        console.error(err);
        setAddress(coordinates);
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, [coordinates, isOutOfRange, defaultLabel]);

  if (loading) {
    return <span style={{ fontSize: 8, color: '#475569', fontStyle: 'italic' }}>Resolving location...</span>;
  }

  return <span style={{ fontWeight: 700, color: '#a5b4fc' }}>{address || coordinates}</span>;
};

export default function StaffLocationPage() {
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const propertyName = propertyCode 
    ? propertyCode.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
    : 'Restaurant';

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [settings, setSettings] = useState<LocationSettings>({
    baseLat: 0, baseLng: 0, alertDistanceMeters: 500, trackingEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<LocationSettings>({
    baseLat: 0, baseLng: 0, alertDistanceMeters: 500, trackingEnabled: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [gettingBase, setGettingBase] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/staff-location/list');
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setStaff(json.data || []);
        if (json.settings) {
          setSettings(json.settings);
          setSettingsDraft(json.settings);
        }
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const iv = setInterval(loadData, 10000);
    return () => clearInterval(iv);
  }, [loadData]);

  /* Stats */
  const trackingStaff = staff.filter(s => s.isTracking);
  const outOfRange = staff.filter(s => s.isOutOfRange);
  const farthest = staff.reduce<StaffRow | null>((best, s) => {
    if (s.distanceFromBase === null) return best;
    if (!best || s.distanceFromBase > (best.distanceFromBase ?? 0)) return s;
    return best;
  }, null);

  /* Save settings */
  const saveSettings = async () => {
    setSavingSettings(true); setSaveMsg('');
    try {
      const res = await fetch('/api/staff-location/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsDraft),
      });
      if (res.ok) {
        const j = await res.json();
        setSettings(j.data);
        setSaveMsg('✓ Saved');
        setTimeout(() => setSaveMsg(''), 2500);
        await loadData();
      }
    } catch { setSaveMsg('❌ Error'); }
    finally { setSavingSettings(false); }
  };

  /* Get current browser location for base */
  const getMyLocation = () => {
    setGettingBase(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettingsDraft(d => ({ ...d, baseLat: pos.coords.latitude, baseLng: pos.coords.longitude }));
        setGettingBase(false);
      },
      () => { alert('Location access denied'); setGettingBase(false); }
    );
  };

  /* ─── UI ─── */
  const s = { fontFamily: '"Inter",-apple-system,sans-serif' };

  return (
    <div style={{ ...s, minHeight: '100vh', background: '#080b14', color: '#f1f5f9', padding: '0 0 40px' }}>

      {/* ━━━ HEADER ━━━ */}
      <div style={{
        background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href={`/${propertyCode}/staff`} style={{ color: '#475569', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
            <ArrowLeft size={16} /> <span style={{ fontSize: 11, fontWeight: 700 }}>Staff</span>
          </Link>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg,#6366f1,#818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              boxShadow: '0 0 14px rgba(99,102,241,0.35)',
            }}>📍</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.02em' }}>Staff Location Tracker</div>
              <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Live GPS Monitoring
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 9, color: '#334155', fontWeight: 700 }}>Updated {fmtAgo(lastRefresh.toISOString())}</div>
          <button
            onClick={loadData}
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: '#818cf8', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800 }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
          <button
            onClick={() => setShowSettings(v => !v)}
            style={{ background: showSettings ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showSettings ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '7px 12px', cursor: 'pointer', color: showSettings ? '#818cf8' : '#475569', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 800 }}
          >
            <Settings2 size={12} /> Settings
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 20px 0' }}>

        {/* ━━━ SETTINGS PANEL ━━━ */}
        {showSettings && (
          <div style={{
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)',
            borderRadius: 18, padding: '20px 22px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#818cf8', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>
              ⚙️ Location Tracking Settings
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {/* Base Lat */}
              <div>
                <label style={{ fontSize: 9, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>
                  Base Latitude
                </label>
                <input
                  type="number" step="any"
                  value={settingsDraft.baseLat}
                  onChange={e => setSettingsDraft(d => ({ ...d, baseLat: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '8px 10px', color: '#f1f5f9', fontSize: 12, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {/* Base Lng */}
              <div>
                <label style={{ fontSize: 9, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>
                  Base Longitude
                </label>
                <input
                  type="number" step="any"
                  value={settingsDraft.baseLng}
                  onChange={e => setSettingsDraft(d => ({ ...d, baseLng: parseFloat(e.target.value) || 0 }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '8px 10px', color: '#f1f5f9', fontSize: 12, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              {/* Alert Distance */}
              <div>
                <label style={{ fontSize: 9, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>
                  Alert Distance — {fmtDist(settingsDraft.alertDistanceMeters)}
                </label>
                <input
                  type="range" min={50} max={10000} step={50}
                  value={settingsDraft.alertDistanceMeters}
                  onChange={e => setSettingsDraft(d => ({ ...d, alertDistanceMeters: parseInt(e.target.value) }))}
                  style={{ width: '100%', accentColor: '#6366f1' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: '#334155', marginTop: 2 }}>
                  <span>50 m</span><span>10 km</span>
                </div>
              </div>
              {/* Tracking toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 9, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>
                    Tracking Enabled
                  </label>
                  <button
                    onClick={() => setSettingsDraft(d => ({ ...d, trackingEnabled: !d.trackingEnabled }))}
                    style={{
                      padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: settingsDraft.trackingEnabled ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.15)',
                      color: settingsDraft.trackingEnabled ? '#34d399' : '#f87171',
                      fontWeight: 800, fontSize: 10, fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    {settingsDraft.trackingEnabled ? <><Eye size={11} /> ON</> : <><EyeOff size={11} /> OFF</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Action row */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
              <button
                onClick={getMyLocation}
                disabled={gettingBase}
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 9, padding: '8px 14px', cursor: gettingBase ? 'not-allowed' : 'pointer', color: '#818cf8', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit' }}
              >
                <Crosshair size={12} /> {gettingBase ? 'Getting...' : 'Use My Current Location as Base'}
              </button>
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', border: 'none', borderRadius: 9, padding: '8px 18px', cursor: 'pointer', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
              >
                <Save size={12} /> {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
              {saveMsg && <span style={{ fontSize: 10, color: '#34d399', fontWeight: 800 }}>{saveMsg}</span>}
            </div>
          </div>
        )}

        {/* ━━━ STATS CARDS ━━━ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 22 }}>
          {[
            {
              label: 'Total Staff', value: staff.length, icon: Users,
              color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)',
            },
            {
              label: 'Actively Tracked', value: trackingStaff.length, icon: Wifi,
              color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)',
            },
            {
              label: 'Out of Range 🚨', value: outOfRange.length, icon: AlertTriangle,
              color: outOfRange.length > 0 ? '#f87171' : '#34d399',
              bg: outOfRange.length > 0 ? 'rgba(239,68,68,0.07)' : 'rgba(52,211,153,0.07)',
              border: outOfRange.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(52,211,153,0.15)',
            },
            {
              label: 'Farthest Distance', value: fmtDist(farthest?.distanceFromBase ?? null), icon: Ruler,
              color: '#fbbf24', bg: 'rgba(251,191,36,0.07)', border: 'rgba(251,191,36,0.2)',
            },
          ].map((c, i) => (
            <div key={i} style={{
              background: c.bg, border: `1px solid ${c.border}`, borderRadius: 16, padding: '16px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11, background: `${c.bg}`, border: `1px solid ${c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.color, flexShrink: 0,
              }}>
                <c.icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 8, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em' }}>{c.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: c.color, lineHeight: 1.2, marginTop: 2 }}>{c.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ━━━ MAIN GRID: Map + List ━━━ */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

          {/* ── Distance Ring Map ── */}
          <div style={{
            background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 18, padding: '18px', display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Target size={12} /> Proximity Map
            </div>
            <DistanceRing staff={staff} settings={settings} />
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
              {[
                { color: '#34d399', label: 'In Range' },
                { color: '#f87171', label: 'Out of Range' },
                { color: '#818cf8', label: 'Base Location' },
              ].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: '#475569', fontWeight: 700 }}>{l.label}</span>
                </div>
              ))}
            </div>
            {/* Alert distance info */}
            <div style={{ marginTop: 4, padding: '8px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 9 }}>
              <div style={{ fontSize: 8, color: '#f87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Alert Threshold</div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#f87171', marginTop: 2 }}>{fmtDist(settings.alertDistanceMeters)}</div>
            </div>
          </div>

          {/* ── Staff List ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                All Staff Members ({staff.length})
              </span>
              {outOfRange.length > 0 && (
                <span style={{
                  fontSize: 8, fontWeight: 900, color: '#f87171', background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: '3px 9px',
                  textTransform: 'uppercase', letterSpacing: '0.1em', animation: 'pulse 1.2s infinite',
                }}>
                  🚨 {outOfRange.length} OUT OF RANGE
                </span>
              )}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#334155' }}>
                <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                Loading staff locations…
              </div>
            ) : staff.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#334155', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 14 }}>
                No staff found for this property.
              </div>
            ) : (
              /* Sort: out-of-range first, then by distance desc */
              [...staff].sort((a, b) => {
                if (a.isOutOfRange !== b.isOutOfRange) return a.isOutOfRange ? -1 : 1;
                return (b.distanceFromBase ?? -1) - (a.distanceFromBase ?? -1);
              }).map(s => {
                const expanded = expandedId === s.userId;
                const isAlert = s.isOutOfRange;

                return (
                  <div key={s.userId} style={{
                    background: isAlert ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${isAlert ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 14, overflow: 'hidden',
                    boxShadow: isAlert ? '0 0 20px rgba(239,68,68,0.07)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {/* Row */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', cursor: 'pointer' }}
                      onClick={() => setExpandedId(expanded ? null : s.userId)}
                    >
                      {/* Avatar */}
                      <div style={{
                        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                        background: isAlert
                          ? 'linear-gradient(135deg,rgba(239,68,68,0.25),rgba(239,68,68,0.1))'
                          : s.isTracking
                            ? 'linear-gradient(135deg,rgba(52,211,153,0.2),rgba(52,211,153,0.08))'
                            : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isAlert ? 'rgba(239,68,68,0.3)' : s.isTracking ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.07)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 900,
                        color: isAlert ? '#f87171' : s.isTracking ? '#34d399' : '#475569',
                      }}>
                        {initials(s.fullName)}
                      </div>

                      {/* Name + designation */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {s.fullName}
                          {isAlert && (
                            <span style={{ fontSize: 7, fontWeight: 900, color: '#f87171', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '2px 6px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              OUT OF RANGE
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span>{s.designation || 'Staff'}</span>
                          <span>·</span>
                          <span>Last seen {fmtAgo(s.lastSeen)}</span>
                          {s.latestPing && (
                            <>
                              <span>·</span>
                              <span style={{ color: '#a5b4fc', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                📍 <ResolvedAddress 
                                  coordinates={`${s.latestPing.lat},${s.latestPing.lng}`} 
                                  isOutOfRange={s.isOutOfRange} 
                                  defaultLabel={propertyName} 
                                />
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Distance badge */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, color: isAlert ? '#f87171' : s.isTracking ? '#34d399' : '#334155', lineHeight: 1 }}>
                          {fmtDist(s.distanceFromBase)}
                        </div>
                        <div style={{ fontSize: 8, color: '#334155', fontWeight: 700, marginTop: 3 }}>
                          from base
                        </div>
                      </div>

                      {/* Status dot */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        {s.isTracking
                          ? <Wifi size={13} color={isAlert ? '#f87171' : '#34d399'} />
                          : <WifiOff size={13} color="#334155" />}
                        {expanded ? <ChevronUp size={12} color="#475569" /> : <ChevronDown size={12} color="#475569" />}
                      </div>
                    </div>

                    {/* Expanded history */}
                    {expanded && (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 16px' }}>
                        <div style={{ fontSize: 8, fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 8 }}>
                          📍 Location History (last 10 pings)
                        </div>
                        {s.history.length === 0 ? (
                          <div style={{ fontSize: 10, color: '#334155', fontStyle: 'italic' }}>No location history yet.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            {s.history.map((p, i) => (
                              <div key={p.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '7px 10px', borderRadius: 9,
                                background: p.isOutOfRange ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${p.isOutOfRange ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)'}`,
                              }}>
                                <span style={{ fontSize: 8, color: '#334155', fontWeight: 800, minWidth: 16 }}>#{i + 1}</span>
                                <Clock size={9} color="#334155" style={{ flexShrink: 0 }} />
                                <span style={{ fontSize: 9, color: '#64748b', fontWeight: 700, fontFamily: 'monospace' }}>{fmtTime(p.createdAt)}</span>
                                <Navigation size={9} color="#334155" style={{ flexShrink: 0, marginLeft: 4 }} />
                                <span style={{ fontSize: 9, color: '#64748b', fontFamily: 'monospace' }}>
                                  {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                                </span>
                                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 900, color: p.isOutOfRange ? '#f87171' : '#34d399' }}>
                                  {fmtDist(p.distanceFromBase)}
                                </span>
                                {p.isOutOfRange
                                  ? <XCircle size={11} color="#f87171" />
                                  : <CheckCircle size={11} color="#34d399" />}
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Coordinates */}
                        {s.latestPing && (
                          <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, fontSize: 9, color: '#334155', fontFamily: 'monospace', display: 'flex', gap: 16 }}>
                            <span>🌐 <b>Lat:</b> {s.latestPing.lat.toFixed(6)}</span>
                            <span><b>Lng:</b> {s.latestPing.lng.toFixed(6)}</span>
                            <a
                              href={`https://maps.google.com/?q=${s.latestPing.lat},${s.latestPing.lng}`}
                              target="_blank" rel="noreferrer"
                              style={{ marginLeft: 'auto', color: '#6366f1', fontWeight: 800, textDecoration: 'none', fontSize: 9 }}
                            >
                              Open in Maps →
                            </a>
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

      {/* Keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
