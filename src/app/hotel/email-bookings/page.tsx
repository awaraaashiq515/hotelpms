'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { 
  Mail, 
  User, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle,
  Import,
  RefreshCw,
  Trash2,
  Phone,
  Inbox,
  Wifi,
  WifiOff,
  Clock,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Settings,
} from 'lucide-react';

export default function EmailBookingsPage() {
  const [emailBookings, setEmailBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'IMPORTED' | 'REJECTED'>('PENDING');

  // Property & Gmail Credentials State
  const [property, setProperty] = useState<any>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configEmail, setConfigEmail] = useState('');
  const [configPassword, setConfigPassword] = useState('');
  const [showConfigPass, setShowConfigPass] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  
  // Room Types, Rooms and Import Form state
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importForm, setImportForm] = useState<any>({
    id: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    amount: '',
    roomTypeId: '',
    assignedRoomId: '',
    adults: 2,
    children: 0,
    source: ''
  });

  // Add-Ons, GST & Discount State
  const [addOns, setAddOns] = useState({
    mealPlan: 'RO',
    poolAccess: false,
    poolPackage: 'DAY_PASS',
    poolPassCost: '',
    spaPackage: 'NONE',
    spaPackageCost: '',
    addOnNotes: '',
    // GST / Corporate
    gstNumber: '',
    companyName: '',
    billingAddress: '',
    // Discount
    discountType: 'PERCENTAGE',
    discountValue: '',
    advanceAmount: '',
  });
  const [showGstSection, setShowGstSection] = useState(false);
  const [showAddOnsSection, setShowAddOnsSection] = useState(true);

  useEffect(() => {
    fetchProperty();
    fetchEmailBookings();
    fetchRoomTypes();
    fetchRooms();
  }, []);

  const fetchProperty = async () => {
    try {
      const res = await fetch('/api/setup/properties/current');
      const json = await res.json();
      if (json.success && json.data) {
        setProperty(json.data);
        setConfigEmail(json.data.bookingEmail || json.data.email || '');
        setConfigPassword(json.data.gmailAppPassword || '');
      }
    } catch (err) {
      console.error('Failed to fetch property', err);
    }
  };

  const fetchRoomTypes = async () => {
    try {
      const res = await fetch('/api/hotel/room-types');
      const json = await res.json();
      if (json.success) {
        setRoomTypes(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch room types', err);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/hotel/rooms');
      const json = await res.json();
      if (json.success) {
        setRooms(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  };

  const fetchEmailBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/email-bookings');
      const json = await res.json();
      if (json.success) {
        setEmailBookings(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch email bookings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncGmail = async () => {
    // If credentials are not configured, open config modal
    if (!property?.bookingEmail || !property?.gmailAppPassword) {
      setIsConfigModalOpen(true);
      setSyncResult('⚠️ Gmail credentials not configured. Please enter your Gmail & App Password.');
      return;
    }

    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/hotel/email-bookings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property?.id }),
      });
      const json = await res.json();
      setSyncResult(json.message || (json.success ? 'Sync complete!' : 'Sync failed.'));
      if (json.success) {
        await fetchEmailBookings();
      }
    } catch (err) {
      setSyncResult('Connection error. Check server.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property?.id) return;
    const cleanEmail = configEmail.trim();
    const cleanPass = configPassword.replace(/\s+/g, '');
    if (!cleanEmail || !cleanPass) {
      alert('Please enter both your Gmail address and 16-digit Google App Password.');
      return;
    }
    setSavingConfig(true);
    try {
      const res = await fetch(`/api/setup/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingEmail: cleanEmail,
          gmailAppPassword: cleanPass,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const updatedProp = {
          ...property,
          bookingEmail: cleanEmail,
          gmailAppPassword: cleanPass,
        };
        setProperty(updatedProp);
        setIsConfigModalOpen(false);
        setSyncResult('✅ Credentials saved! Running sync now…');

        // Trigger sync immediately with updated property
        setSyncing(true);
        const syncRes = await fetch('/api/hotel/email-bookings/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ propertyId: property.id }),
        });
        const syncJson = await syncRes.json();
        setSyncResult(syncJson.message || (syncJson.success ? 'Sync complete!' : 'Sync failed.'));
        if (syncJson.success) {
          await fetchEmailBookings();
        }
      } else {
        alert(json.message || 'Failed to save credentials');
      }
    } catch (err) {
      alert('Network error while saving credentials');
    } finally {
      setSavingConfig(false);
      setSyncing(false);
    }
  };

  const handleOpenImport = (booking: any) => {
    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    };

    setImportForm({
      id: booking.id,
      guestName: booking.guestName || '',
      guestEmail: booking.guestEmail || '',
      guestPhone: booking.guestPhone || '',
      checkIn: formatDate(booking.checkIn),
      checkOut: formatDate(booking.checkOut),
      amount: booking.amount !== null ? String(booking.amount) : '',
      roomTypeId: roomTypes[0]?.id || '',
      assignedRoomId: '',
      adults: 2,
      children: 0,
      source: booking.source || 'Direct'
    });
    // Reset add-ons
    setAddOns({
      mealPlan: 'RO',
      poolAccess: false,
      poolPackage: 'DAY_PASS',
      poolPassCost: '',
      spaPackage: 'NONE',
      spaPackageCost: '',
      addOnNotes: '',
      gstNumber: '',
      companyName: '',
      billingAddress: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      advanceAmount: '',
    });
    setShowGstSection(false);
    setShowAddOnsSection(true);
    setIsImportModalOpen(true);
  };

  const handleConfirmImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/hotel/email-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailBookingId: importForm.id,
          action: 'IMPORT',
          guestName: importForm.guestName,
          guestEmail: importForm.guestEmail,
          guestPhone: importForm.guestPhone,
          checkIn: importForm.checkIn,
          checkOut: importForm.checkOut,
          amount: importForm.amount ? Number(importForm.amount) : 0,
          roomTypeId: importForm.roomTypeId,
          assignedRoomId: importForm.assignedRoomId || null,
          adults: Number(importForm.adults),
          children: Number(importForm.children),
          // Add-Ons
          mealPlan: addOns.mealPlan,
          poolAccess: addOns.poolAccess,
          poolPackage: addOns.poolPackage,
          poolPassCost: addOns.poolPassCost ? Number(addOns.poolPassCost) : 0,
          spaPackage: addOns.spaPackage,
          spaPackageCost: addOns.spaPackageCost ? Number(addOns.spaPackageCost) : 0,
          addOnNotes: addOns.addOnNotes || null,
          // GST / Corporate
          gstNumber: addOns.gstNumber || null,
          companyName: addOns.companyName || null,
          billingAddress: addOns.billingAddress || null,
          // Discount
          discountType: addOns.discountType,
          discountValue: addOns.discountValue ? Number(addOns.discountValue) : 0,
          advanceAmount: addOns.advanceAmount ? Number(addOns.advanceAmount) : 0,
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsImportModalOpen(false);
        fetchEmailBookings();
      } else {
        alert(json.message || 'Import failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'IMPORT' | 'REJECT') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/hotel/email-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailBookingId: id, action })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedBooking(null);
        fetchEmailBookings();
      } else {
        alert(json.message || 'Action failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredBookings = emailBookings.filter(b => b.status === activeTab);

  const counts = {
    PENDING: emailBookings.filter(b => b.status === 'PENDING').length,
    IMPORTED: emailBookings.filter(b => b.status === 'IMPORTED').length,
    REJECTED: emailBookings.filter(b => b.status === 'REJECTED').length,
  };

  const sourceColors: Record<string, string> = {
    'Agoda': '#e0463c',
    'Booking.com': '#003580',
    'Airbnb': '#ff385c',
    'MakeMyTrip': '#d7272d',
    'Goibibo': '#e8734a',
    'Expedia': '#00355f',
    'Trivago': '#066eb8',
    'Direct': '#10b981',
  };

  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

  return (
    <div style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0a1a 100%)', minHeight: '100vh', padding: '2rem' }}>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '12px', padding: '10px', display: 'inline-flex' }}>
              <Mail size={22} color="white" />
            </div>
            <div>
              <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Email Booking Sync</h1>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>Auto-read hotel Gmail & import bookings</p>
            </div>
          </div>
        </div>
        {/* Sync Button */}
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleSyncGmail}
            disabled={syncing}
            style={{
              background: syncing ? '#1e293b' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: syncing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 24px #6366f130',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={16} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing Gmail…' : '⚡ Sync Gmail Now'}
          </button>
          {syncResult && (
            <div style={{
              background: syncResult.includes('❌') ? '#fee2e220' : '#d1fae520',
              border: `1px solid ${syncResult.includes('❌') ? '#f87171' : '#34d399'}`,
              color: syncResult.includes('❌') ? '#f87171' : '#34d399',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '0.75rem',
              fontWeight: 600,
              maxWidth: '300px',
              textAlign: 'right',
            }}>
              {syncResult}
            </div>
          )}
        </div>
      </div>

      {/* Gmail Connection Status Card */}
      <div style={{
        background: property?.bookingEmail && property?.gmailAppPassword ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.25), rgba(16, 185, 129, 0.1))' : 'linear-gradient(135deg, rgba(120, 53, 15, 0.25), rgba(245, 158, 11, 0.1))',
        border: `1px solid ${property?.bookingEmail && property?.gmailAppPassword ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.4)'}`,
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: property?.bookingEmail && property?.gmailAppPassword ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
            color: property?.bookingEmail && property?.gmailAppPassword ? '#34d399' : '#fbbf24',
            borderRadius: '12px',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Mail size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 800 }}>
                {property?.bookingEmail && property?.gmailAppPassword ? 'Gmail Sync Configured & Active' : 'Gmail Credentials Not Configured'}
              </span>
              <span style={{
                background: property?.bookingEmail && property?.gmailAppPassword ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                color: property?.bookingEmail && property?.gmailAppPassword ? '#34d399' : '#fbbf24',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '3px 9px',
                borderRadius: '6px'
              }}>
                {property?.bookingEmail && property?.gmailAppPassword ? '🟢 Connected' : '⚠️ Action Required'}
              </span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
              {property?.bookingEmail && property?.gmailAppPassword
                ? `Connected Gmail: ${property.bookingEmail} — Reads booking emails from Agoda, Booking.com, Airbnb, MMT`
                : 'Please add your hotel Gmail address and 16-digit Google App Password to enable automatic email sync.'
              }
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            style={{
              background: '#1e293b',
              color: '#c7d2fe',
              border: '1px solid #475569',
              borderRadius: '10px',
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Settings size={14} />
            {property?.bookingEmail && property?.gmailAppPassword ? 'Edit Credentials' : '⚙️ Configure Gmail Now'}
          </button>
          <a
            href="/hotel/settings"
            style={{
              color: '#818cf8',
              fontSize: '0.8rem',
              fontWeight: 700,
              textDecoration: 'none',
              padding: '8px 12px'
            }}
          >
            Hotel Settings →
          </a>
        </div>
      </div>

      {/* How it works banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b50, #312e8150)',
        border: '1px solid #4f46e530',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
      }}>
        <Sparkles size={18} color="#818cf8" />
        <span style={{ color: '#c7d2fe', fontSize: '0.8rem', fontWeight: 600 }}>
          How it works:
        </span>
        {['1. Super Admin adds hotel Gmail + App Password', '2. Click "Sync Gmail Now"', '3. System reads booking emails from inbox', '4. Review & import into HMS'].map((step, i) => (
          <span key={i} style={{ color: '#94a3b8', fontSize: '0.75rem', background: '#1e293b', borderRadius: '8px', padding: '4px 10px' }}>
            {step}
          </span>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {([
          { label: 'Pending Review', count: counts.PENDING, color: '#f59e0b', tab: 'PENDING' as const, icon: <Clock size={18} /> },
          { label: 'Imported', count: counts.IMPORTED, color: '#10b981', tab: 'IMPORTED' as const, icon: <CheckCircle2 size={18} /> },
          { label: 'Rejected', count: counts.REJECTED, color: '#ef4444', tab: 'REJECTED' as const, icon: <XCircle size={18} /> },
        ]).map(stat => (
          <button
            key={stat.tab}
            onClick={() => setActiveTab(stat.tab)}
            style={{
              background: activeTab === stat.tab ? `${stat.color}15` : '#0d1117',
              border: `1px solid ${activeTab === stat.tab ? stat.color : '#1e293b'}`,
              borderRadius: '14px',
              padding: '16px 20px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ color: stat.color, marginBottom: '4px' }}>{stat.icon}</div>
            <div style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800 }}>{stat.count}</div>
            <div style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</div>
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
          <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p>Loading emails…</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#0d1117',
          border: '1px dashed #1e293b',
          borderRadius: '16px',
          color: '#475569',
        }}>
          <Inbox size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ fontSize: '1rem', fontWeight: 700, color: '#64748b' }}>
            {activeTab === 'PENDING' ? 'No pending email bookings' : `No ${activeTab.toLowerCase()} bookings`}
          </p>
          {activeTab === 'PENDING' && (
            <p style={{ fontSize: '0.8rem', color: '#475569', marginTop: '6px' }}>
              Click <strong style={{ color: '#818cf8' }}>⚡ Sync Gmail Now</strong> to pull booking emails from your hotel inbox.
            </p>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredBookings.map(booking => (
            <div
              key={booking.id}
              onClick={() => setSelectedBooking(booking)}
              style={{
                background: '#0d1117',
                border: '1px solid #1e293b',
                borderLeft: `4px solid ${sourceColors[booking.source] || '#6366f1'}`,
                borderRadius: '14px',
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr auto',
                alignItems: 'center',
                gap: '16px',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#334155')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    background: sourceColors[booking.source] || '#6366f1',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                  }}>
                    {booking.source || 'Direct'}
                  </span>
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>{booking.guestName || 'Unknown Guest'}</div>
                <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{booking.sender}</div>
              </div>

              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, marginBottom: '2px' }}>STAY</div>
                <div style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600 }}>
                  {fmt(booking.checkIn)} → {fmt(booking.checkOut)}
                </div>
              </div>

              <div>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, marginBottom: '2px' }}>AMOUNT</div>
                <div style={{ color: '#10b981', fontSize: '1rem', fontWeight: 800 }}>
                  {booking.amount ? `₹${booking.amount.toLocaleString('en-IN')}` : '—'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {booking.status === 'PENDING' && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); handleOpenImport(booking); }}
                      style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 14px', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      Import
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleAction(booking.id, 'REJECT'); }}
                      style={{ background: '#1e293b', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '8px', padding: '8px 10px', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </>
                )}
                {booking.status === 'IMPORTED' && <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>✓ Imported</span>}
                {booking.status === 'REJECTED' && <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700 }}>✗ Rejected</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedBooking && (
        <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Email Details" maxWidth="4xl" className="!max-h-[94vh]">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Source Badge + Sender */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ background: sourceColors[selectedBooking.source] || '#6366f1', color: '#fff', borderRadius: '8px', padding: '5px 14px', fontWeight: 800, fontSize: '0.8rem' }}>
                {selectedBooking.source}
              </span>
              <span style={{ background: '#1e293b', color: '#94a3b8', borderRadius: '8px', padding: '5px 14px', fontWeight: 600, fontSize: '0.8rem' }}>
                {selectedBooking.sender}
              </span>
              <span style={{ marginLeft: 'auto', background: selectedBooking.status === 'PENDING' ? '#f59e0b20' : selectedBooking.status === 'IMPORTED' ? '#10b98120' : '#ef444420', color: selectedBooking.status === 'PENDING' ? '#fbbf24' : selectedBooking.status === 'IMPORTED' ? '#34d399' : '#f87171', borderRadius: '8px', padding: '5px 14px', fontWeight: 800, fontSize: '0.75rem' }}>
                {selectedBooking.status}
              </span>
            </div>

            {/* Subject */}
            <div style={{ background: '#0d1117', borderRadius: '12px', padding: '12px 16px', border: '1px solid #1e293b' }}>
              <p style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>Subject</p>
              <p style={{ color: '#e2e8f0', fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>{selectedBooking.subject}</p>
            </div>

            {/* 2-Column: Email Body LEFT | Guest Info RIGHT */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>

              {/* LEFT — Email Body */}
              <div>
                <p style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>📧 Email Body</p>
                <div style={{ background: '#0d1117', borderRadius: '12px', padding: '14px 16px', border: '1px solid #1e293b', maxHeight: '380px', overflowY: 'auto' }}>
                  <pre style={{ color: '#94a3b8', fontSize: '0.73rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0, lineHeight: 1.6 }}>
                    {selectedBooking.body?.slice(0, 3000) || 'No content'}
                  </pre>
                </div>
              </div>

              {/* RIGHT — Guest Info Cards + Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>👤 Booking Details</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'Guest Name', value: selectedBooking.guestName, icon: <User size={13} /> },
                    { label: 'Email', value: selectedBooking.guestEmail, icon: <Mail size={13} /> },
                    { label: 'Phone', value: selectedBooking.guestPhone, icon: <Phone size={13} /> },
                    { label: 'Amount', value: selectedBooking.amount ? `₹${Number(selectedBooking.amount).toLocaleString('en-IN')}` : null, icon: <DollarSign size={13} /> },
                    { label: 'Check-In', value: fmt(selectedBooking.checkIn), icon: <CalendarIcon size={13} /> },
                    { label: 'Check-Out', value: fmt(selectedBooking.checkOut), icon: <CalendarIcon size={13} /> },
                  ].map(field => (
                    <div key={field.label} style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 12px' }}>
                      <div style={{ color: '#475569', fontSize: '0.6rem', fontWeight: 700, display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                        {field.icon} {field.label}
                      </div>
                      <div style={{ color: field.value ? '#e2e8f0' : '#334155', fontSize: '0.82rem', fontWeight: 700 }}>
                        {field.value || '—'}
                      </div>
                    </div>
                  ))}
                </div>

                {selectedBooking.status === 'PENDING' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <button
                      disabled={actionLoading}
                      onClick={() => { setSelectedBooking(null); handleOpenImport(selectedBooking); }}
                      style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 800, fontSize: '0.88rem', cursor: actionLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px #10b98130' }}
                    >
                      ✓ Import as Reservation
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAction(selectedBooking.id, 'REJECT')}
                      style={{ width: '100%', background: '#1e293b', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '12px', padding: '12px', fontWeight: 700, fontSize: '0.82rem', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                    >
                      ✕ Reject Booking
                    </button>
                  </div>
                )}

                {selectedBooking.status !== 'PENDING' && (
                  <div style={{ background: selectedBooking.status === 'IMPORTED' ? '#10b98115' : '#ef444415', border: `1px solid ${selectedBooking.status === 'IMPORTED' ? '#34d39940' : '#f8717140'}`, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <p style={{ color: selectedBooking.status === 'IMPORTED' ? '#34d399' : '#f87171', fontWeight: 800, fontSize: '0.85rem', margin: 0 }}>
                      {selectedBooking.status === 'IMPORTED' ? '✅ Already Imported to Reservations' : '❌ Booking Rejected'}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Reservation Editor" maxWidth="4xl" className="!max-h-[94vh]">
          {/* ── 2-Column Master Layout ── */}
          <form onSubmit={handleConfirmImport} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>

            {/* ── LEFT: Guest & Room Details ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Row 1: Name + Source */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Guest Name</label>
                  <input type="text" required value={importForm.guestName} onChange={e => setImportForm({ ...importForm, guestName: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Booking Source</label>
                  <select value={importForm.source} onChange={e => setImportForm({ ...importForm, source: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}>
                    <option value="Agoda">Agoda</option>
                    <option value="Booking.com">Booking.com</option>
                    <option value="Airbnb">Airbnb</option>
                    <option value="MakeMyTrip">MakeMyTrip</option>
                    <option value="Goibibo">Goibibo</option>
                    <option value="Expedia">Expedia</option>
                    <option value="Trivago">Trivago</option>
                    <option value="Direct">Direct / Other</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Email + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={importForm.guestEmail} onChange={e => setImportForm({ ...importForm, guestEmail: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Phone</label>
                  <input type="text" value={importForm.guestPhone} onChange={e => setImportForm({ ...importForm, guestPhone: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }} />
                </div>
              </div>

              {/* Row 3: Check-In + Check-Out */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Check-In Date</label>
                  <input type="date" required value={importForm.checkIn} onChange={e => setImportForm({ ...importForm, checkIn: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Check-Out Date</label>
                  <input type="date" required value={importForm.checkOut} onChange={e => setImportForm({ ...importForm, checkOut: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }} />
                </div>
              </div>

              {/* Row 4: Room Type + Adults + Children */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Room Type</label>
                  <select required value={importForm.roomTypeId} onChange={e => setImportForm({ ...importForm, roomTypeId: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}>
                    {roomTypes.map((rt: any) => (
                      <option key={rt.id} value={rt.id}>{rt.name} (₹{rt.baseRate})</option>
                    ))}
                    {roomTypes.length === 0 && <option value="">-- No Room Types --</option>}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Adults</label>
                  <input type="number" min="1" required value={importForm.adults} onChange={e => setImportForm({ ...importForm, adults: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Children</label>
                  <input type="number" min="0" required value={importForm.children} onChange={e => setImportForm({ ...importForm, children: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }} />
                </div>
              </div>

              {/* Row 5: Assign Room + Amount */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Assign Room (Optional)</label>
                  <select value={importForm.assignedRoomId} onChange={e => setImportForm({ ...importForm, assignedRoomId: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}>
                    <option value="">Auto-Assign Later</option>
                    {rooms.filter((r: any) => r.roomTypeId === importForm.roomTypeId).map((r: any) => (
                      <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.status === 'AVAILABLE' ? '✓ Available' : '✗ Occupied'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Booking Amount (INR)</label>
                  <input type="number" required value={importForm.amount} onChange={e => setImportForm({ ...importForm, amount: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }} />
                </div>
              </div>

            </div>{/* end LEFT col */}

            {/* ── RIGHT: Add-Ons, GST, Discount ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>


            {/* ─── 🎁 Hotel Services & Add-Ons ─── */}
            <div style={{ borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setShowAddOnsSection(p => !p)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0f172a', border: 'none', cursor: 'pointer' }}
              >
                <span style={{ color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 800 }}>🎁 Hotel Services & Add-Ons</span>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{showAddOnsSection ? '▲ collapse' : '▼ expand'}</span>
              </button>
              {showAddOnsSection && (
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#090d16' }}>

                  {/* Meal Plan */}
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>🍽️ Meal Plan</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                      {[
                        { val: 'RO', label: 'Room Only', sub: 'RO' },
                        { val: 'CP', label: 'Breakfast', sub: 'CP' },
                        { val: 'MAP', label: 'Half Board', sub: 'MAP' },
                        { val: 'AP', label: 'Full Board', sub: 'AP' },
                        { val: 'FB', label: 'All Inclusive', sub: 'FB' },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setAddOns(a => ({ ...a, mealPlan: opt.val }))}
                          style={{
                            padding: '8px 4px',
                            borderRadius: '8px',
                            border: addOns.mealPlan === opt.val ? '2px solid #6366f1' : '1px solid #1e293b',
                            background: addOns.mealPlan === opt.val ? '#1e1b4b' : '#0f172a',
                            color: addOns.mealPlan === opt.val ? '#a5b4fc' : '#64748b',
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            textAlign: 'center',
                            lineHeight: 1.3
                          }}
                        >
                          <div style={{ fontSize: '0.72rem', marginBottom: '1px' }}>{opt.sub}</div>
                          <div>{opt.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pool & Spa */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {/* Pool */}
                    <div style={{ background: '#0f172a', border: `1px solid ${addOns.poolAccess ? '#0891b2' : '#1e293b'}`, borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: addOns.poolAccess ? '10px' : '0' }}>
                        <span style={{ color: addOns.poolAccess ? '#38bdf8' : '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>🏊 Pool Access</span>
                        <button
                          type="button"
                          onClick={() => setAddOns(a => ({ ...a, poolAccess: !a.poolAccess }))}
                          style={{ width: '36px', height: '20px', borderRadius: '999px', border: 'none', background: addOns.poolAccess ? '#0284c7' : '#334155', cursor: 'pointer', position: 'relative', transition: 'all 0.2s' }}
                        >
                          <div style={{ position: 'absolute', top: '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'all 0.2s', left: addOns.poolAccess ? '19px' : '3px' }} />
                        </button>
                      </div>
                      {addOns.poolAccess && (
                        <>
                          <select
                            value={addOns.poolPackage}
                            onChange={e => setAddOns(a => ({ ...a, poolPackage: e.target.value }))}
                            style={{ width: '100%', padding: '6px 8px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '0.72rem', marginBottom: '6px' }}
                          >
                            <option value="DAY_PASS">Day Pass</option>
                            <option value="WEEKLY">Weekly</option>
                            <option value="COMPLIMENTARY">Complimentary</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Pass Cost (₹)"
                            value={addOns.poolPassCost}
                            onChange={e => setAddOns(a => ({ ...a, poolPassCost: e.target.value }))}
                            style={{ width: '100%', padding: '6px 8px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '6px', color: '#38bdf8', fontSize: '0.72rem', fontWeight: 700 }}
                          />
                        </>
                      )}
                    </div>

                    {/* Spa */}
                    <div style={{ background: '#0f172a', border: `1px solid ${addOns.spaPackage !== 'NONE' ? '#a855f7' : '#1e293b'}`, borderRadius: '10px', padding: '12px' }}>
                      <label style={{ display: 'block', color: addOns.spaPackage !== 'NONE' ? '#c084fc' : '#64748b', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>🛁 Spa Package</label>
                      <select
                        value={addOns.spaPackage}
                        onChange={e => setAddOns(a => ({ ...a, spaPackage: e.target.value }))}
                        style={{ width: '100%', padding: '6px 8px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '0.72rem', marginBottom: addOns.spaPackage !== 'NONE' ? '6px' : '0' }}
                      >
                        <option value="NONE">No Spa</option>
                        <option value="BASIC">Basic (₹500–800)</option>
                        <option value="PREMIUM">Premium (₹1,000–1,500)</option>
                        <option value="LUXURY">Luxury (₹2,000+)</option>
                      </select>
                      {addOns.spaPackage !== 'NONE' && (
                        <input
                          type="number"
                          placeholder="Spa Cost (₹)"
                          value={addOns.spaPackageCost}
                          onChange={e => setAddOns(a => ({ ...a, spaPackageCost: e.target.value }))}
                          style={{ width: '100%', padding: '6px 8px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '6px', color: '#c084fc', fontSize: '0.72rem', fontWeight: 700 }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Add-On Notes */}
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>💬 Special Requests / Notes</label>
                    <textarea
                      value={addOns.addOnNotes}
                      onChange={e => setAddOns(a => ({ ...a, addOnNotes: e.target.value }))}
                      placeholder="e.g. Anniversary decoration, late check-out, airport pickup at 6pm, baby cot needed..."
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.8rem', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ─── 🏢 Corporate / GST Billing ─── */}
            <div style={{ borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setShowGstSection(p => !p)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#0f172a', border: 'none', cursor: 'pointer' }}
              >
                <span style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 800 }}>🏢 Corporate / GST Billing <span style={{ color: '#64748b', fontWeight: 400 }}>(optional)</span></span>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{showGstSection ? '▲ collapse' : '▼ expand'}</span>
              </button>
              {showGstSection && (
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', background: '#090d16' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>GST Number (GSTIN)</label>
                      <input
                        type="text"
                        maxLength={15}
                        placeholder="e.g. 22AAAAA0000A1Z5"
                        value={addOns.gstNumber}
                        onChange={e => setAddOns(a => ({ ...a, gstNumber: e.target.value.toUpperCase() }))}
                        style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.05em', fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Company Name</label>
                      <input
                        type="text"
                        placeholder="Company / Organization"
                        value={addOns.companyName}
                        onChange={e => setAddOns(a => ({ ...a, companyName: e.target.value }))}
                        style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Billing Address</label>
                    <textarea
                      placeholder="Full billing address for GST invoice"
                      value={addOns.billingAddress}
                      onChange={e => setAddOns(a => ({ ...a, billingAddress: e.target.value }))}
                      rows={2}
                      style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.8rem', resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ─── 💸 Discount & Payment ─── */}
            {(() => {
              const base = Number(importForm.amount) || 0;
              const poolCost = addOns.poolAccess ? (Number(addOns.poolPassCost) || 0) : 0;
              const spaCost = addOns.spaPackage !== 'NONE' ? (Number(addOns.spaPackageCost) || 0) : 0;
              const subTotal = base + poolCost + spaCost;
              const discVal = Number(addOns.discountValue) || 0;
              const discAmt = addOns.discountType === 'PERCENTAGE'
                ? Math.round((subTotal * discVal) / 100)
                : discVal;
              const finalTotal = Math.max(0, subTotal - discAmt);
              const advance = Number(addOns.advanceAmount) || 0;
              const due = Math.max(0, finalTotal - advance);

              return (
                <div style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 800, marginBottom: '2px' }}>💸 Discount & Payment</div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                      {(['PERCENTAGE', 'FIXED'] as const).map(dt => (
                        <button
                          key={dt}
                          type="button"
                          onClick={() => setAddOns(a => ({ ...a, discountType: dt }))}
                          style={{ padding: '8px 14px', border: 'none', background: addOns.discountType === dt ? '#f59e0b' : '#0f172a', color: addOns.discountType === dt ? '#000' : '#94a3b8', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                          {dt === 'PERCENTAGE' ? '% Off' : '₹ Fixed'}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="0"
                      placeholder={addOns.discountType === 'PERCENTAGE' ? 'Discount % (e.g. 10)' : 'Discount ₹ (e.g. 500)'}
                      value={addOns.discountValue}
                      onChange={e => setAddOns(a => ({ ...a, discountValue: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fbbf24', fontWeight: 700, fontSize: '0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Advance Paid (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Amount received in advance"
                      value={addOns.advanceAmount}
                      onChange={e => setAddOns(a => ({ ...a, advanceAmount: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}
                    />
                  </div>

                  {/* Live Breakdown */}
                  <div style={{ background: '#0d1117', borderRadius: '10px', padding: '12px 14px', fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}>
                      <span>Room Amount</span><span>₹{base.toLocaleString('en-IN')}</span>
                    </div>
                    {poolCost > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8' }}>
                        <span>+ Pool Pass</span><span>₹{poolCost.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {spaCost > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c084fc' }}>
                        <span>+ Spa ({addOns.spaPackage})</span><span>₹{spaCost.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {discAmt > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f87171' }}>
                        <span>− Discount {addOns.discountType === 'PERCENTAGE' ? `(${addOns.discountValue}%)` : '(Fixed)'}</span>
                        <span>−₹{discAmt.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div style={{ borderTop: '1px solid #1e293b', marginTop: '4px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 800, fontSize: '0.9rem' }}>
                      <span>Final Total</span><span>₹{finalTotal.toLocaleString('en-IN')}</span>
                    </div>
                    {advance > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                        <span>Due Amount</span><span>₹{due.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            </div>{/* end RIGHT col */}
          </div>{/* end 2-col master grid */}

          {/* ── Full-width Cancel / Confirm ── */}
          <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid #1e293b', marginTop: '4px' }}>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              style={{ flex: 1, background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              style={{ flex: 3, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 800, fontSize: '0.9rem', cursor: actionLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px #10b98130' }}
            >
              {actionLoading ? '⏳ Processing...' : '✓ Confirm & Save Reservation'}
            </button>
          </div>
        </form>
        </Modal>
      )}


      {/* Configure Gmail Credentials Modal */}
      {isConfigModalOpen && (
        <Modal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          title="⚙️ Configure Hotel Gmail IMAP Sync"
        >
          <form onSubmit={handleSaveCredentials} className="space-y-4">
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.4' }}>
              Gustflow connects securely to your hotel Gmail using encrypted IMAP to automatically read booking confirmations from Agoda, Booking.com, Airbnb, and MakeMyTrip.
            </p>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Hotel Gmail Address
              </label>
              <input
                type="email"
                required
                value={configEmail}
                onChange={(e) => setConfigEmail(e.target.value)}
                placeholder="e.g. nasha0750@gmail.com"
                style={{ width: '100%', padding: '12px 14px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.85rem' }}
              />
              <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '4px' }}>
                The Gmail inbox where guest OTA reservation confirmation emails arrive.
              </p>
            </div>

            <div>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                Google 16-Digit App Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfigPass ? 'text' : 'password'}
                  required
                  value={configPassword}
                  onChange={(e) => setConfigPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  style={{ width: '100%', padding: '12px 40px 12px 14px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '10px', color: '#fff', fontSize: '0.85rem', fontFamily: 'monospace' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfigPass(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  {showConfigPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={{ color: '#f59e0b', fontSize: '0.7rem', marginTop: '4px' }}>
                ⚠️ Do NOT enter your regular Google account password. Google requires a dedicated 16-digit App Password.
              </p>
            </div>

            {/* Step-by-step instructions */}
            <div style={{ background: '#1e1b4b40', border: '1px solid #4f46e530', borderRadius: '12px', padding: '12px 16px' }}>
              <p style={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 800, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={13} /> How to generate App Password (takes 2 minutes):
              </p>
              <ol style={{ color: '#cbd5e1', fontSize: '0.72rem', margin: 0, paddingLeft: '18px', lineHeight: '1.6' }}>
                <li>Make sure <strong>2-Step Verification</strong> is ON at <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>Google Security</a>.</li>
                <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#818cf8', textDecoration: 'underline' }}>myaccount.google.com/apppasswords</a>.</li>
                <li>Enter app name <strong>Gustflow Hotel</strong> and click <strong>Create</strong>.</li>
                <li>Copy the 16-digit key (e.g. <code>abcd efgh ijkl mnop</code>) and paste it here.</li>
              </ol>
            </div>

            <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                style={{ flex: 1, background: '#1e293b', color: '#94a3b8', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingConfig}
                style={{ flex: 2, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: 800, fontSize: '0.85rem', cursor: savingConfig ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {savingConfig && <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {savingConfig ? 'Saving & Testing…' : 'Save & Test Connection'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
