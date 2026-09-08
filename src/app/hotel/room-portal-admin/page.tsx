'use client';

import { useState, useEffect } from 'react';
import {
  Tablet, Lock, Unlock, RefreshCw, Loader2, Activity, Users, Shield, Settings,
  Clock, CheckCircle2, XCircle, AlertTriangle, Eye,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

type Tab = 'devices' | 'sessions' | 'logs' | 'config';

export default function RoomPortalAdminPage() {

  const [activeTab, setActiveTab] = useState<Tab>('devices');
  const [data, setData] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [propertyId, setPropertyId] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/room-portal/admin${propertyId ? `?propertyId=${propertyId}` : ''}`);
      const d = await res.json();
      if (d.success) setData(d.data);
    } catch {
      toast.error('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    if (!propertyId) return;
    try {
      // We'll use a direct fetch here as admin
      const res = await fetch(`/api/room-portal/config?adminMode=true&propertyId=${propertyId}`);
      const d = await res.json();
      if (d.success) setConfig(d.data);
    } catch {}
  };

  useEffect(() => {
    // Get propertyId from session (via API)
    fetch('/api/hotel/property')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.id) {
          setPropertyId(d.data.id);
        }
      })
      .catch(() => {})
      .finally(() => {
        fetchData();
        fetchConfig();
      });
  }, []);

  const handleToggleLock = async (tabletId: string, currentLocked: boolean, roomNumber?: string) => {
    try {
      const res = await fetch('/api/room-portal/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tabletId, lock: !currentLocked }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(!currentLocked ? `Room ${roomNumber || ''} display LOCKED 🔒` : `Room ${roomNumber || ''} display UNLOCKED 🔓`);
        fetchData();
      } else {
        toast.error(d.message || 'Failed to update device.');
      }
    } catch {
      toast.error('Connection error.');
    }
  };

  const handleServiceToggle = async (key: string, newValue: boolean, serviceLabel: string) => {
    if (!propertyId) return;
    const updated = { ...(config || {}), [key]: newValue };
    setConfig(updated);
    try {
      const res = await fetch('/api/room-portal/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, ...updated }),
      });
      const d = await res.json();
      if (d.success) {
        toast.success(`${serviceLabel}: turned ${newValue ? 'ON (Enabled) ✅' : 'OFF (Disabled) ⏸️'}`);
      } else {
        toast.error(d.message || 'Failed to update service.');
      }
    } catch {
      toast.error('Connection error.');
    }
  };

  const handleSaveConfig = async () => {
    if (!config || !propertyId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/room-portal/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, ...config }),
      });
      const d = await res.json();
      if (d.success) toast.success('Configuration saved successfully!');
      else toast.error(d.message || 'Failed to save.');
    } catch {
      toast.error('Connection error.');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
    LOGIN: { label: 'Login', color: 'rgb(134,239,172)', icon: '✅' },
    LOGOUT: { label: 'Logout', color: 'rgb(148,163,184)', icon: '🚪' },
    REQUEST: { label: 'Service Request', color: 'rgb(103,232,249)', icon: '🛎️' },
    FEEDBACK: { label: 'Feedback', color: 'rgb(251,191,36)', icon: '⭐' },
    CHECKOUT_REQUEST: { label: 'Checkout Request', color: 'rgb(252,165,165)', icon: '🏁' },
    LOGIN_FAILED: { label: 'Login Failed', color: 'rgb(239,68,68)', icon: '❌' },
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'devices', label: '📱 Room Displays & Locks', icon: Tablet },
    { id: 'config', label: '🎛️ Services ON / OFF & Config', icon: Settings },
    { id: 'sessions', label: '👥 Active Guest Sessions', icon: Users },
    { id: 'logs', label: '📋 Activity Logs', icon: Activity },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '12px' }}>
        <Loader2 size={24} color="rgb(99,102,241)" className="animate-spin" />
        <p style={{ color: 'rgb(148,163,184)' }}>Loading room portal admin...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster richColors position="top-center" />
      <div style={{ padding: '0' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.06))',
          border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px',
          padding: '24px 28px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
            }}>
              <Shield size={26} color="white" />
            </div>
            <div>
              <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 900, margin: 0 }}>Room Portal Admin</h1>
              <p style={{ color: 'rgb(100,116,139)', fontSize: '13px', margin: 0 }}>
                Manage in-room tablet portals, lock room displays & toggle services
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => {
                if (propertyId) localStorage.setItem('room_portal_property_id', propertyId);
                window.open('/room-portal', '_blank');
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none',
                color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
              }}
            >
              <Tablet size={15} /> Open Room Portal
            </button>
            <button
              onClick={() => { fetchData(); fetchConfig(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 16px', borderRadius: '12px',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                color: 'rgb(99,102,241)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              }}
            >
              <RefreshCw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Room Displays', value: data?.tablets?.length || 0, color: 'rgb(99,102,241)', icon: '📱' },
            { label: 'Active Sessions', value: data?.activeSessions?.length || 0, color: 'rgb(34,197,94)', icon: '👤' },
            { label: 'Locked Displays', value: data?.tablets?.filter((t: any) => t.kioskLocked).length || 0, color: 'rgb(239,68,68)', icon: '🔒' },
            { label: 'Events Today', value: data?.recentLogs?.filter((l: any) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length || 0, color: 'rgb(251,191,36)', icon: '📊' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '18px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '24px', margin: '0 0 6px 0' }}>{stat.icon}</p>
              <p style={{ color: stat.color, fontSize: '24px', fontWeight: 900, margin: 0 }}>{stat.value}</p>
              <p style={{ color: 'rgb(71,85,105)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', margin: '4px 0 0 0' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '6px', marginBottom: '20px' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))' : 'transparent',
                borderBottom: activeTab === tab.id ? '2px solid rgb(99,102,241)' : 'none',
                color: activeTab === tab.id ? 'white' : 'rgb(148,163,184)',
                fontWeight: activeTab === tab.id ? 800 : 600, fontSize: '13px', transition: 'all 0.2s',
              }}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'devices' && (
          <div>
            {/* Quick Banner pointing to Service ON/OFF */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))',
              border: '1px solid rgba(99,102,241,0.35)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '26px' }}>🎛️</span>
                <div>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: '14px', margin: 0 }}>
                    Looking for Room Service & Housekeeping ON / OFF Switches?
                  </p>
                  <p style={{ color: 'rgb(148,163,184)', fontSize: '12px', margin: '3px 0 0 0' }}>
                    Click &quot;Services ON / OFF &amp; Config&quot; tab above to enable or disable features on all guest displays.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('config')}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                }}
              >
                Go to Services ON / OFF ➔
              </button>
            </div>

            {!data?.tablets?.length ? (
              <EmptyState icon="📱" message="No room tablets configured yet." sub="Rooms will be provisioned automatically on refresh." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.tablets.map((tablet: any) => {
                  return (
                    <div key={tablet.id} style={{
                      background: tablet.kioskLocked ? 'rgba(239,68,68,0.06)' : 'rgba(15,23,42,0.85)',
                      border: tablet.kioskLocked ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '18px', padding: '18px 22px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
                    }}>
                      {/* Left info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '50px', height: '50px', borderRadius: '14px',
                          background: tablet.kioskLocked ? 'rgba(239,68,68,0.2)' : tablet.isSessionActive ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.12)',
                          border: tablet.kioskLocked ? '1px solid rgba(239,68,68,0.4)' : tablet.isSessionActive ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(99,102,241,0.2)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {tablet.kioskLocked ? (
                            <Lock size={22} color="rgb(239,68,68)" />
                          ) : (
                            <Tablet size={22} color={tablet.isSessionActive ? 'rgb(34,197,94)' : 'rgb(99,102,241)'} />
                          )}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.5px',
                              background: 'rgba(99,102,241,0.2)', color: 'rgb(165,180,252)', border: '1px solid rgba(99,102,241,0.3)',
                            }}>
                              ROOM {tablet.roomNumber}
                            </span>
                            <p style={{ color: 'white', fontWeight: 800, fontSize: '16px', margin: 0 }}>
                              {tablet.name || `Room ${tablet.roomNumber} Tablet`}
                            </p>
                          </div>

                          {tablet.isSessionActive ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                              <span style={{ color: 'rgb(34,197,94)', fontWeight: 800 }}>● Online Now:</span>
                              <span style={{ color: 'white', fontWeight: 700 }}>{tablet.guestName}</span>
                              {tablet.guestMobile && <span style={{ color: 'rgb(148,163,184)' }}>({tablet.guestMobile})</span>}
                              {tablet.loginAt && <span style={{ color: 'rgb(100,116,139)' }}>• Logged in {formatTime(tablet.loginAt)}</span>}
                            </div>
                          ) : (
                            <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', margin: 0 }}>
                              ⚪ Standby — No active guest session (Available for login)
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right controls: Lock / Unlock */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right', marginRight: '4px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800,
                            background: tablet.kioskLocked ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)',
                            border: tablet.kioskLocked ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(34,197,94,0.3)',
                            color: tablet.kioskLocked ? 'rgb(252,165,165)' : 'rgb(134,239,172)',
                          }}>
                            {tablet.kioskLocked ? '🔒 DISPLAY LOCKED' : '🔓 DISPLAY UNLOCKED'}
                          </span>
                          <p style={{ color: 'rgb(100,116,139)', fontSize: '10px', margin: '4px 0 0 0' }}>
                            {tablet.kioskLocked ? 'Guest screen is disabled' : 'Guest screen is active'}
                          </p>
                        </div>

                        <button
                          onClick={() => handleToggleLock(tablet.id, tablet.kioskLocked, tablet.roomNumber)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', borderRadius: '12px', border: 'none',
                            background: tablet.kioskLocked
                              ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                              : 'linear-gradient(135deg, #dc2626, #ef4444)',
                            color: 'white', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                            boxShadow: tablet.kioskLocked ? '0 4px 14px rgba(34,197,94,0.3)' : '0 4px 14px rgba(239,68,68,0.3)',
                            transition: 'all 0.2s',
                          }}
                        >
                          {tablet.kioskLocked ? (
                            <><Unlock size={16} /> Unlock Display</>
                          ) : (
                            <><Lock size={16} /> Lock Display</>
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

        {activeTab === 'sessions' && (
          <div>
            {!data?.activeSessions?.length ? (
              <EmptyState icon="👤" message="No active sessions right now." sub="Sessions appear here when guests log in to room tablets." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.activeSessions.map((session: any) => (
                  <div key={session.id} style={{
                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '16px', padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'rgb(34,197,94)', boxShadow: '0 0 8px rgba(34,197,94,0.6)' }} />
                      <div>
                        <p style={{ color: 'white', fontWeight: 800, fontSize: '15px', margin: 0 }}>
                          Room {session.roomNumber} • {session.guestName}
                        </p>
                        <p style={{ color: 'rgb(148,163,184)', fontSize: '12px', margin: '2px 0 0 0' }}>
                          Mobile: {session.guestMobile || '—'} • Login: {formatTime(session.loginAt)}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} color="rgb(100,116,139)" />
                      <p style={{ color: 'rgb(148,163,184)', fontSize: '12px', margin: 0 }}>
                        Last active: {formatTime(session.lastActivity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div>
            {!data?.recentLogs?.length ? (
              <EmptyState icon="📊" message="No activity logs yet." sub="All guest actions in the room portal will be logged here." />
            ) : (
              <div style={{
                background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', overflow: 'hidden',
              }}>
                {data.recentLogs.map((log: any, i: number) => {
                  const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'rgb(148,163,184)', icon: '📝' };
                  let details: any = {};
                  try { details = JSON.parse(log.details || '{}'); } catch {}
                  return (
                    <div key={log.id} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 20px',
                      borderBottom: i < data.recentLogs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}>
                      <span style={{ fontSize: '18px', flexShrink: 0 }}>{actionInfo.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: actionInfo.color, fontWeight: 700, fontSize: '13px' }}>{actionInfo.label}</span>
                          {log.roomId && <span style={{ color: 'rgb(71,85,105)', fontSize: '11px' }}>Room: {log.roomId.slice(-8)}</span>}
                        </div>
                        {details.reason && <p style={{ color: 'rgb(71,85,105)', fontSize: '11px', margin: '2px 0 0 0' }}>{details.reason}</p>}
                      </div>
                      <p style={{ color: 'rgb(71,85,105)', fontSize: '11px', margin: 0, flexShrink: 0 }}>{formatTime(log.createdAt)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'config' && config && (
          <div style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Feature Services On / Off Toggles */}
              <ConfigSection title="In-Room Tablet Services (Instant ON / OFF Toggles)" emoji="🎛️">
                <p style={{ color: 'rgb(148,163,184)', fontSize: '13px', margin: '0 0 14px 0' }}>
                  Click any toggle switch below to immediately turn services ON or OFF on the guest tablets in real-time. (e.g. Turn OFF Room Service when the kitchen is closed). Changes save automatically!
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { key: 'showRoomService', label: 'Room Service (Food Ordering)', emoji: '🍽️', desc: 'Browse menu & place food orders directly from room tablet' },
                    { key: 'showHousekeeping', label: 'Housekeeping & Cleaning', emoji: '🧹', desc: 'Room cleaning, fresh towels & laundry requests' },
                    { key: 'showWifi', label: 'Wi-Fi Information', emoji: '📶', desc: 'Hotel Wi-Fi name & password card' },
                    { key: 'showAmenities', label: 'Hotel Amenities & Hours', emoji: '🏨', desc: 'Gym, Pool, Spa & breakfast timings' },
                    { key: 'showBill', label: 'My Bill & Charges', emoji: '📄', desc: 'Real-time room charges and current balance' },
                    { key: 'showContact', label: 'Front Desk & SOS Contacts', emoji: '📞', desc: 'Speed-dial reception & emergency numbers' },
                    { key: 'showFeedback', label: 'Guest Feedback', emoji: '⭐', desc: 'Rating cleanliness, food & overall stay experience' },
                    { key: 'showCheckout', label: 'Express Check-out', emoji: '🚪', desc: 'Submit digital checkout requests from room' },
                  ].map((item) => (
                    <ConfigToggle
                      key={item.key}
                      emoji={item.emoji}
                      label={item.label}
                      desc={item.desc}
                      checked={config[item.key] !== false}
                      onChange={(checked) => handleServiceToggle(item.key, checked, item.label)}
                    />
                  ))}
                </div>
              </ConfigSection>

              {/* WiFi Section */}
              <ConfigSection title="Wi-Fi Settings" emoji="📶">
                <ConfigInput label="Network Name (SSID)" value={config.wifiName || ''} onChange={(v) => setConfig((p: any) => ({ ...p, wifiName: v }))} />
                <ConfigInput label="Password" value={config.wifiPassword || ''} onChange={(v) => setConfig((p: any) => ({ ...p, wifiPassword: v }))} />
              </ConfigSection>

              {/* Timings */}
              <ConfigSection title="Timings" emoji="🕐">
                <ConfigInput label="Gym Timings" value={config.gymTimings || ''} onChange={(v) => setConfig((p: any) => ({ ...p, gymTimings: v }))} />
                <ConfigInput label="Pool Timings" value={config.poolTimings || ''} onChange={(v) => setConfig((p: any) => ({ ...p, poolTimings: v }))} />
                <ConfigInput label="Spa Timings" value={config.spaTimings || ''} onChange={(v) => setConfig((p: any) => ({ ...p, spaTimings: v }))} />
                <ConfigInput label="Breakfast Timings" value={config.breakfastTimings || ''} onChange={(v) => setConfig((p: any) => ({ ...p, breakfastTimings: v }))} />
                <ConfigInput label="Restaurant Timings" value={config.restaurantTimings || ''} onChange={(v) => setConfig((p: any) => ({ ...p, restaurantTimings: v }))} />
              </ConfigSection>

              {/* Contact */}
              <ConfigSection title="Contact Numbers" emoji="📞">
                <ConfigInput label="Front Desk Phone" value={config.frontDeskPhone || ''} onChange={(v) => setConfig((p: any) => ({ ...p, frontDeskPhone: v }))} />
                <ConfigInput label="Emergency Phone" value={config.emergencyPhone || ''} onChange={(v) => setConfig((p: any) => ({ ...p, emergencyPhone: v }))} />
              </ConfigSection>

              {/* Kiosk */}
              <ConfigSection title="Kiosk Settings" emoji="🔒">
                <ConfigInput label="Session Timeout (minutes)" type="number" value={String(config.sessionTimeoutMin || 30)} onChange={(v) => setConfig((p: any) => ({ ...p, sessionTimeoutMin: parseInt(v) || 30 }))} />
                <ConfigInput label="Admin Exit PIN" value={config.kioskExitPin || '1234'} onChange={(v) => setConfig((p: any) => ({ ...p, kioskExitPin: v }))} />
                <ConfigInput label="Welcome Title" value={config.welcomeTitle || ''} onChange={(v) => setConfig((p: any) => ({ ...p, welcomeTitle: v }))} />
                <ConfigInput label="Welcome Subtitle" value={config.welcomeSubtitle || ''} onChange={(v) => setConfig((p: any) => ({ ...p, welcomeSubtitle: v }))} />
              </ConfigSection>

              <button
                onClick={handleSaveConfig}
                disabled={saving}
                style={{
                  padding: '16px 32px', borderRadius: '14px', border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', fontSize: '15px', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
                }}
              >
                {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : '💾 Save Configuration'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function ConfigSection({ title, emoji, children }: { title: string; emoji: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(99,102,241,0.06)' }}>
        <p style={{ color: 'white', fontWeight: 800, fontSize: '14px', margin: 0 }}>{emoji} {title}</p>
      </div>
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </div>
  );
}

function ConfigInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label style={{ display: 'block', color: 'rgb(100,116,139)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: '10px',
          border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(15,23,42,0.7)',
          color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

function EmptyState({ icon, message, sub }: { icon: string; message: string; sub: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgb(100,116,139)' }}>
      <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>{icon}</p>
      <p style={{ fontWeight: 700, fontSize: '16px', color: 'rgb(148,163,184)', margin: '0 0 6px 0' }}>{message}</p>
      <p style={{ fontSize: '13px' }}>{sub}</p>
    </div>
  );
}

function ConfigToggle({
  emoji,
  label,
  desc,
  checked,
  onChange,
}: {
  emoji: string;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderRadius: '14px',
        background: checked ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
        border: checked ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.07)',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <span style={{ fontSize: '24px' }}>{emoji}</span>
        <div>
          <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', margin: 0 }}>
            {label}
          </p>
          <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', margin: '3px 0 0 0' }}>
            {desc}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.8px',
            color: checked ? 'rgb(134,239,172)' : 'rgb(148,163,184)',
            textTransform: 'uppercase',
          }}
        >
          {checked ? 'ENABLED' : 'DISABLED'}
        </span>
        <div
          style={{
            width: '48px',
            height: '26px',
            borderRadius: '13px',
            background: checked ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(100,116,139,0.35)',
            position: 'relative',
            transition: 'background 0.2s',
            boxShadow: checked ? '0 0 14px rgba(34,197,94,0.35)' : 'none',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: 'white',
              position: 'absolute',
              top: '3px',
              left: checked ? '25px' : '3px',
              transition: 'left 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
