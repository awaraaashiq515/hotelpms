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
} from 'lucide-react';

export default function EmailBookingsPage() {
  const [emailBookings, setEmailBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'IMPORTED' | 'REJECTED'>('PENDING');
  
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

  useEffect(() => {
    fetchEmailBookings();
    fetchRoomTypes();
    fetchRooms();
  }, []);

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
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/hotel/email-bookings/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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
          children: Number(importForm.children)
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
        <Modal isOpen={!!selectedBooking} onClose={() => setSelectedBooking(null)} title="Booking Email Details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ background: sourceColors[selectedBooking.source] || '#6366f1', color: '#fff', borderRadius: '8px', padding: '4px 12px', fontWeight: 800, fontSize: '0.75rem' }}>
                {selectedBooking.source}
              </span>
              <span style={{ background: '#1e293b', color: '#94a3b8', borderRadius: '8px', padding: '4px 12px', fontWeight: 600, fontSize: '0.75rem' }}>
                {selectedBooking.sender}
              </span>
            </div>

            <div style={{ background: '#0d1117', borderRadius: '12px', padding: '14px 16px', border: '1px solid #1e293b' }}>
              <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, marginBottom: '4px' }}>SUBJECT</p>
              <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>{selectedBooking.subject}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Guest Name', value: selectedBooking.guestName, icon: <User size={14} /> },
                { label: 'Email', value: selectedBooking.guestEmail, icon: <Mail size={14} /> },
                { label: 'Phone', value: selectedBooking.guestPhone, icon: <Phone size={14} /> },
                { label: 'Amount', value: selectedBooking.amount ? `₹${selectedBooking.amount}` : null, icon: <DollarSign size={14} /> },
                { label: 'Check-In', value: fmt(selectedBooking.checkIn), icon: <CalendarIcon size={14} /> },
                { label: 'Check-Out', value: fmt(selectedBooking.checkOut), icon: <CalendarIcon size={14} /> },
              ].map(field => (
                <div key={field.label} style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ color: '#475569', fontSize: '0.65rem', fontWeight: 700, display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
                    {field.icon} {field.label}
                  </div>
                  <div style={{ color: field.value ? '#e2e8f0' : '#475569', fontSize: '0.82rem', fontWeight: 600 }}>
                    {field.value || '—'}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: '#0d1117', borderRadius: '12px', padding: '14px 16px', border: '1px solid #1e293b', maxHeight: '180px', overflowY: 'auto' }}>
              <p style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, marginBottom: '6px' }}>EMAIL BODY</p>
              <pre style={{ color: '#94a3b8', fontSize: '0.72rem', whiteSpace: 'pre-wrap', fontFamily: 'monospace', margin: 0 }}>
                {selectedBooking.body?.slice(0, 1200) || 'No content'}
              </pre>
            </div>

            {selectedBooking.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                <button
                  disabled={actionLoading}
                  onClick={() => { setSelectedBooking(null); handleOpenImport(selectedBooking); }}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 800, fontSize: '0.85rem', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                  ✓ Import as Reservation
                </button>
                <button
                  disabled={actionLoading}
                  onClick={() => handleAction(selectedBooking.id, 'REJECT')}
                  style={{ flex: 1, background: '#1e293b', color: '#ef4444', border: '1px solid #ef444440', borderRadius: '12px', padding: '14px', fontWeight: 800, fontSize: '0.85rem', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
                >
                  ✕ Reject
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Import Modal */}
      {isImportModalOpen && (
        <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Import Reservation Editor">
          <form onSubmit={handleConfirmImport} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Guest Name</label>
                <input
                  type="text"
                  required
                  value={importForm.guestName}
                  onChange={e => setImportForm({ ...importForm, guestName: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Booking Source</label>
                <select
                  value={importForm.source}
                  onChange={e => setImportForm({ ...importForm, source: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                >
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Email</label>
                <input
                  type="email"
                  value={importForm.guestEmail}
                  onChange={e => setImportForm({ ...importForm, guestEmail: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Phone</label>
                <input
                  type="text"
                  value={importForm.guestPhone}
                  onChange={e => setImportForm({ ...importForm, guestPhone: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Check-In Date</label>
                <input
                  type="date"
                  required
                  value={importForm.checkIn}
                  onChange={e => setImportForm({ ...importForm, checkIn: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Check-Out Date</label>
                <input
                  type="date"
                  required
                  value={importForm.checkOut}
                  onChange={e => setImportForm({ ...importForm, checkOut: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Assign Room Type</label>
                <select
                  required
                  value={importForm.roomTypeId}
                  onChange={e => setImportForm({ ...importForm, roomTypeId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                >
                  {roomTypes.map((rt: any) => (
                    <option key={rt.id} value={rt.id}>{rt.name} (Base Rate: ₹{rt.baseRate})</option>
                  ))}
                  {roomTypes.length === 0 && <option value="">-- No Room Types Configured --</option>}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Adults</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={importForm.adults}
                  onChange={e => setImportForm({ ...importForm, adults: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Children</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={importForm.children}
                  onChange={e => setImportForm({ ...importForm, children: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Assign Room (Optional)</label>
                <select
                  value={importForm.assignedRoomId}
                  onChange={e => setImportForm({ ...importForm, assignedRoomId: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '0.82rem' }}
                >
                  <option value="">Auto-Assign Later</option>
                  {rooms
                    .filter((r: any) => r.roomTypeId === importForm.roomTypeId)
                    .map((r: any) => (
                      <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.status === 'AVAILABLE' ? 'Available' : 'Occupied'})</option>
                    ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>Booking Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={importForm.amount}
                  onChange={e => setImportForm({ ...importForm, amount: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', background: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #1e293b' }}>
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
                style={{ flex: 2, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px', fontWeight: 800, fontSize: '0.85rem', cursor: actionLoading ? 'not-allowed' : 'pointer' }}
              >
                {actionLoading ? 'Processing...' : 'Confirm & Save Booking'}
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
