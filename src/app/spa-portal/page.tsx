'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles, Calendar, TrendingUp, Users, Clock, Plus,
  Edit3, Trash2, CheckCircle, XCircle, AlertCircle, LogOut,
  RefreshCw, Star, Scissors, Activity, DollarSign, ChevronRight,
  Phone, Mail, MapPin, Settings, BarChart3, ListChecks,
} from 'lucide-react';

interface Spa {
  id: string;
  name: string;
  description?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  openTime?: string;
  closeTime?: string;
  commissionPct: number;
  isActive: boolean;
  address?: string;
  phone?: string;
  email?: string;
  _count?: { services: number; therapists: number; bookings: number };
}

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  gstRate: number;
  description?: string;
  isActive: boolean;
}

interface Therapist {
  id: string;
  name: string;
  specialty?: string;
  gender: string;
  phone?: string;
  isActive: boolean;
}

interface Booking {
  id: string;
  bookingNo: string;
  guestName?: string;
  guestPhone?: string;
  scheduledAt: string;
  duration: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMode?: string;
  notes?: string;
  service: Service;
  therapist?: Therapist;
}

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  NO_SHOW: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'No Show',
};

export default function SpaPortal() {
  const router = useRouter();
  const [spa, setSpa] = useState<Spa | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'services' | 'therapists'>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayStats, setTodayStats] = useState({ total: 0, completed: 0, scheduled: 0, revenue: 0 });

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showTherapistModal, setShowTherapistModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingTherapist, setEditingTherapist] = useState<Therapist | null>(null);

  // Forms
  const [bookingForm, setBookingForm] = useState({
    serviceId: '', therapistId: '', guestName: '', guestPhone: '',
    scheduledAt: '', paymentMode: 'CASH', notes: '',
  });
  const [serviceForm, setServiceForm] = useState({
    name: '', category: 'Massage', duration: '60', price: '', gstRate: '18', description: '',
  });
  const [therapistForm, setTherapistForm] = useState({
    name: '', gender: 'Female', specialty: '', phone: '',
  });

  const [spaId, setSpaId] = useState<string | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Check Spa Owner login credentials in localStorage
    const storedToken = localStorage.getItem('spa_token');
    const storedInfo = localStorage.getItem('spa_info');

    if (storedToken && storedInfo) {
      try {
        const info = JSON.parse(storedInfo);
        setSpaId(info.id);
        if (info.propertyId) setPropertyId(info.propertyId);
        return;
      } catch (_) {}
    }

    // 2. Check if hotel admin session is active
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user?.propertyId) {
          setPropertyId(d.user.propertyId);
          const params = new URLSearchParams(window.location.search);
          const sid = params.get('spaId');
          if (sid) {
            setSpaId(sid);
            return;
          }
        }
        // Not authenticated -> redirect to login
        router.push('/login');
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('spa_token');
    localStorage.removeItem('spa_info');
    localStorage.removeItem('currentSpaId');
    localStorage.removeItem('currentPropertyId');
    router.push('/login');
  };

  useEffect(() => {
    if (spaId) {
      loadSpaData();
    }
  }, [spaId]);

  const loadSpaData = async () => {
    if (!spaId) return;
    setLoading(true);
    try {
      const [spaRes, bookingsRes, servicesRes, therapistsRes] = await Promise.all([
        fetch(`/api/spa/${spaId}`),
        fetch(`/api/spa/${spaId}/bookings`),
        fetch(`/api/spa/${spaId}/services?includeInactive=true`),
        fetch(`/api/spa/${spaId}/therapists?includeInactive=true`),
      ]);

      const spaData = await spaRes.json();
      const bookingsData = await bookingsRes.json();
      const servicesData = await servicesRes.json();
      const therapistsData = await therapistsRes.json();

      setSpa(spaData.spa);
      setBookings(bookingsData.bookings || []);
      setTodayStats({
        total: bookingsData.stats?.todayTotal || 0,
        completed: bookingsData.stats?.todayCompleted || 0,
        scheduled: bookingsData.stats?.todayScheduled || 0,
        revenue: bookingsData.stats?.todayRevenue || 0,
      });
      setServices(servicesData.services || []);
      setTherapists(therapistsData.therapists || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    await fetch(`/api/spa/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    loadSpaData();
  };

  const createBooking = async () => {
    if (!spaId || !bookingForm.serviceId || !bookingForm.guestName || !bookingForm.scheduledAt) return;
    await fetch(`/api/spa/${spaId}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingForm),
    });
    setShowBookingModal(false);
    setBookingForm({ serviceId: '', therapistId: '', guestName: '', guestPhone: '', scheduledAt: '', paymentMode: 'CASH', notes: '' });
    loadSpaData();
  };

  const saveService = async () => {
    if (!spaId || !serviceForm.name || !serviceForm.price) return;
    if (editingService) {
      await fetch(`/api/spa/${spaId}/services/${editingService.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      });
    } else {
      await fetch(`/api/spa/${spaId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceForm),
      });
    }
    setShowServiceModal(false);
    setEditingService(null);
    setServiceForm({ name: '', category: 'Massage', duration: '60', price: '', gstRate: '18', description: '' });
    loadSpaData();
  };

  const saveTherapist = async () => {
    if (!spaId || !therapistForm.name) return;
    if (editingTherapist) {
      await fetch(`/api/spa/${spaId}/therapists/${editingTherapist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(therapistForm),
      });
    } else {
      await fetch(`/api/spa/${spaId}/therapists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(therapistForm),
      });
    }
    setShowTherapistModal(false);
    setEditingTherapist(null);
    setTherapistForm({ name: '', gender: 'Female', specialty: '', phone: '' });
    loadSpaData();
  };

  const todayBookings = bookings.filter((b) => {
    const d = new Date(b.scheduledAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingContent}>
          <Sparkles size={48} color="#14b8a6" />
          <p style={{ color: '#94a3b8', marginTop: 16 }}>Loading Spa Portal...</p>
        </div>
      </div>
    );
  }

  if (!spa && !spaId) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingContent}>
          <Sparkles size={48} color="#14b8a6" />
          <h2 style={{ color: '#fff', marginTop: 16 }}>Spa Portal</h2>
          <p style={{ color: '#94a3b8', marginTop: 8 }}>No spa found. Please contact hotel admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarLogo}>
            <Sparkles size={24} color="#14b8a6" />
          </div>
          <div>
            <p style={styles.spaName}>{spa?.name || 'Spa Portal'}</p>
            <p style={styles.spaOwner}>{spa?.ownerName || 'Spa Owner'}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { id: 'dashboard', icon: Activity, label: 'Dashboard' },
            { id: 'bookings', icon: Calendar, label: 'Bookings' },
            { id: 'services', icon: Sparkles, label: 'Services' },
            { id: 'therapists', icon: Users, label: 'Therapists' },
          ].map((item) => (
            <button
              key={item.id}
              style={{
                ...styles.navItem,
                ...(activeTab === item.id ? styles.navItemActive : {}),
              }}
              onClick={() => setActiveTab(item.id as typeof activeTab)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.spaInfo}>
            {spa?.openTime && (
              <p style={styles.infoRow}>
                <Clock size={12} /> {spa.openTime} – {spa.closeTime}
              </p>
            )}
            {spa?.address && (
              <p style={styles.infoRow}>
                <MapPin size={12} /> {spa.address}
              </p>
            )}
          </div>
          <button
            onClick={handleLogout}
            style={{
              marginTop: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 8,
              color: '#f87171',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {activeTab === 'dashboard' && '📊 Dashboard'}
              {activeTab === 'bookings' && '📅 Bookings'}
              {activeTab === 'services' && '✨ Services'}
              {activeTab === 'therapists' && '👤 Therapists'}
            </h1>
            <p style={styles.pageSubtitle}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={styles.headerActions}>
            <button style={styles.refreshBtn} onClick={loadSpaData} title="Refresh">
              <RefreshCw size={16} />
            </button>
            {activeTab === 'bookings' && (
              <button style={styles.primaryBtn} onClick={() => setShowBookingModal(true)}>
                <Plus size={16} /> New Booking
              </button>
            )}
            {activeTab === 'services' && (
              <button style={styles.primaryBtn} onClick={() => { setEditingService(null); setShowServiceModal(true); }}>
                <Plus size={16} /> Add Service
              </button>
            )}
            {activeTab === 'therapists' && (
              <button style={styles.primaryBtn} onClick={() => { setEditingTherapist(null); setShowTherapistModal(true); }}>
                <Plus size={16} /> Add Therapist
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 8,
                background: '#1e293b',
                border: '1px solid #ef444444',
                color: '#f87171',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Sign Out"
            >
              <LogOut size={14} />
              <span style={{ display: 'inline' }}>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* KPI Cards */}
            <div style={styles.kpiGrid}>
              <div style={{ ...styles.kpiCard, borderTop: '3px solid #14b8a6' }}>
                <div style={styles.kpiIcon}><Calendar size={20} color="#14b8a6" /></div>
                <div>
                  <p style={styles.kpiValue}>{todayStats.total}</p>
                  <p style={styles.kpiLabel}>Today's Bookings</p>
                </div>
              </div>
              <div style={{ ...styles.kpiCard, borderTop: '3px solid #10b981' }}>
                <div style={styles.kpiIcon}><CheckCircle size={20} color="#10b981" /></div>
                <div>
                  <p style={styles.kpiValue}>{todayStats.completed}</p>
                  <p style={styles.kpiLabel}>Completed Today</p>
                </div>
              </div>
              <div style={{ ...styles.kpiCard, borderTop: '3px solid #3b82f6' }}>
                <div style={styles.kpiIcon}><Clock size={20} color="#3b82f6" /></div>
                <div>
                  <p style={styles.kpiValue}>{todayStats.scheduled}</p>
                  <p style={styles.kpiLabel}>Upcoming</p>
                </div>
              </div>
              <div style={{ ...styles.kpiCard, borderTop: '3px solid #f59e0b' }}>
                <div style={styles.kpiIcon}><TrendingUp size={20} color="#f59e0b" /></div>
                <div>
                  <p style={styles.kpiValue}>₹{todayStats.revenue.toLocaleString('en-IN')}</p>
                  <p style={styles.kpiLabel}>Today's Revenue</p>
                </div>
              </div>
            </div>

            {/* Today's Bookings Timeline */}
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>📅 Today's Schedule</h2>
              {todayBookings.length === 0 ? (
                <div style={styles.emptyState}>
                  <Calendar size={40} color="#475569" />
                  <p>No bookings for today</p>
                  <button style={styles.primaryBtn} onClick={() => setActiveTab('bookings')}>
                    <Plus size={14} /> Create First Booking
                  </button>
                </div>
              ) : (
                <div style={styles.bookingTimeline}>
                  {todayBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} onStatusUpdate={updateBookingStatus} />
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <Sparkles size={18} color="#14b8a6" />
                <p style={styles.statNum}>{services.filter((s) => s.isActive).length}</p>
                <p style={styles.statLabel}>Active Services</p>
              </div>
              <div style={styles.statBox}>
                <Users size={18} color="#8b5cf6" />
                <p style={styles.statNum}>{therapists.filter((t) => t.isActive).length}</p>
                <p style={styles.statLabel}>Therapists</p>
              </div>
              <div style={styles.statBox}>
                <BarChart3 size={18} color="#f59e0b" />
                <p style={styles.statNum}>{bookings.length}</p>
                <p style={styles.statLabel}>Total Bookings</p>
              </div>
              <div style={styles.statBox}>
                <DollarSign size={18} color="#10b981" />
                <p style={styles.statNum}>{spa?.commissionPct || 0}%</p>
                <p style={styles.statLabel}>Hotel Commission</p>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>All Bookings ({bookings.length})</h2>
              {bookings.length === 0 ? (
                <div style={styles.emptyState}>
                  <Calendar size={40} color="#475569" />
                  <p>No bookings yet</p>
                  <button style={styles.primaryBtn} onClick={() => setShowBookingModal(true)}>
                    <Plus size={14} /> Create First Booking
                  </button>
                </div>
              ) : (
                <div style={styles.bookingList}>
                  {bookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} onStatusUpdate={updateBookingStatus} expanded />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <div style={styles.serviceGrid}>
              {services.map((service) => (
                <div key={service.id} style={{ ...styles.serviceCard, opacity: service.isActive ? 1 : 0.5 }}>
                  <div style={styles.serviceHeader}>
                    <span style={styles.categoryBadge}>{service.category}</span>
                    <div style={styles.serviceActions}>
                      <button style={styles.iconBtn} onClick={() => {
                        setEditingService(service);
                        setServiceForm({
                          name: service.name, category: service.category,
                          duration: String(service.duration), price: String(service.price),
                          gstRate: String(service.gstRate), description: service.description || '',
                        });
                        setShowServiceModal(true);
                      }}>
                        <Edit3 size={14} />
                      </button>
                    </div>
                  </div>
                  <h3 style={styles.serviceName}>{service.name}</h3>
                  {service.description && <p style={styles.serviceDesc}>{service.description}</p>}
                  <div style={styles.serviceFooter}>
                    <span style={styles.serviceDuration}><Clock size={12} /> {service.duration} min</span>
                    <span style={styles.servicePrice}>₹{service.price.toLocaleString('en-IN')}</span>
                  </div>
                  <p style={styles.gstNote}>+ {service.gstRate}% GST = ₹{(service.price * (1 + service.gstRate / 100)).toFixed(0)}</p>
                </div>
              ))}
              {services.length === 0 && (
                <div style={{ ...styles.emptyState, gridColumn: '1 / -1' }}>
                  <Sparkles size={40} color="#475569" />
                  <p>No services yet. Add your first service!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Therapists Tab */}
        {activeTab === 'therapists' && (
          <div>
            <div style={styles.therapistGrid}>
              {therapists.map((therapist) => (
                <div key={therapist.id} style={{ ...styles.therapistCard, opacity: therapist.isActive ? 1 : 0.5 }}>
                  <div style={styles.therapistAvatar}>
                    {therapist.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.therapistInfo}>
                    <h3 style={styles.therapistName}>{therapist.name}</h3>
                    <p style={styles.therapistSpecialty}>{therapist.specialty || 'General'}</p>
                    <p style={styles.therapistGender}>{therapist.gender}</p>
                    {therapist.phone && (
                      <p style={styles.therapistPhone}><Phone size={12} /> {therapist.phone}</p>
                    )}
                  </div>
                  <button style={styles.iconBtn} onClick={() => {
                    setEditingTherapist(therapist);
                    setTherapistForm({ name: therapist.name, gender: therapist.gender, specialty: therapist.specialty || '', phone: therapist.phone || '' });
                    setShowTherapistModal(true);
                  }}>
                    <Edit3 size={14} />
                  </button>
                </div>
              ))}
              {therapists.length === 0 && (
                <div style={{ ...styles.emptyState, gridColumn: '1 / -1' }}>
                  <Users size={40} color="#475569" />
                  <p>No therapists yet. Add your team!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* New Booking Modal */}
      {showBookingModal && (
        <div style={styles.modalOverlay} onClick={() => setShowBookingModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>New Spa Booking</h2>
              <button style={styles.closeBtn} onClick={() => setShowBookingModal(false)}><XCircle size={20} /></button>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Guest Name *</label>
                <input style={styles.input} placeholder="Guest Name" value={bookingForm.guestName}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestName: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Guest Phone</label>
                <input style={styles.input} placeholder="Phone Number" value={bookingForm.guestPhone}
                  onChange={(e) => setBookingForm({ ...bookingForm, guestPhone: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service *</label>
                <select style={styles.input} value={bookingForm.serviceId}
                  onChange={(e) => setBookingForm({ ...bookingForm, serviceId: e.target.value })}>
                  <option value="">Select Service</option>
                  {services.filter((s) => s.isActive).map((s) => (
                    <option key={s.id} value={s.id}>{s.name} – ₹{s.price} ({s.duration} min)</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Therapist</label>
                <select style={styles.input} value={bookingForm.therapistId}
                  onChange={(e) => setBookingForm({ ...bookingForm, therapistId: e.target.value })}>
                  <option value="">Any Available</option>
                  {therapists.filter((t) => t.isActive).map((t) => (
                    <option key={t.id} value={t.id}>{t.name} – {t.specialty || 'General'}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Date & Time *</label>
                <input type="datetime-local" style={styles.input} value={bookingForm.scheduledAt}
                  onChange={(e) => setBookingForm({ ...bookingForm, scheduledAt: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Payment Mode</label>
                <select style={styles.input} value={bookingForm.paymentMode}
                  onChange={(e) => setBookingForm({ ...bookingForm, paymentMode: e.target.value })}>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="ROOM_CHARGE">Room Charge</option>
                </select>
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Notes</label>
                <textarea style={{ ...styles.input, height: 80, resize: 'none' }} placeholder="Special requests..."
                  value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowBookingModal(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={createBooking}>Confirm Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal */}
      {showServiceModal && (
        <div style={styles.modalOverlay} onClick={() => setShowServiceModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingService ? 'Edit Service' : 'Add New Service'}</h2>
              <button style={styles.closeBtn} onClick={() => setShowServiceModal(false)}><XCircle size={20} /></button>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Service Name *</label>
                <input style={styles.input} placeholder="e.g. Swedish Massage" value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select style={styles.input} value={serviceForm.category}
                  onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}>
                  {['Massage', 'Facial', 'Body Treatment', 'Hair', 'Nail', 'Package', 'Other'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Duration (minutes)</label>
                <input type="number" style={styles.input} placeholder="60" value={serviceForm.duration}
                  onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Price (₹) *</label>
                <input type="number" style={styles.input} placeholder="1500" value={serviceForm.price}
                  onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>GST Rate (%)</label>
                <input type="number" style={styles.input} placeholder="18" value={serviceForm.gstRate}
                  onChange={(e) => setServiceForm({ ...serviceForm, gstRate: e.target.value })} />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Description</label>
                <textarea style={{ ...styles.input, height: 80, resize: 'none' }}
                  placeholder="Describe this service..." value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowServiceModal(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={saveService}>
                {editingService ? 'Save Changes' : 'Add Service'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Therapist Modal */}
      {showTherapistModal && (
        <div style={styles.modalOverlay} onClick={() => setShowTherapistModal(false)}>
          <div style={{ ...styles.modal, maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingTherapist ? 'Edit Therapist' : 'Add Therapist'}</h2>
              <button style={styles.closeBtn} onClick={() => setShowTherapistModal(false)}><XCircle size={20} /></button>
            </div>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input style={styles.input} placeholder="Therapist Name" value={therapistForm.name}
                  onChange={(e) => setTherapistForm({ ...therapistForm, name: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Gender</label>
                <select style={styles.input} value={therapistForm.gender}
                  onChange={(e) => setTherapistForm({ ...therapistForm, gender: e.target.value })}>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Specialty</label>
                <input style={styles.input} placeholder="e.g. Swedish, Ayurvedic" value={therapistForm.specialty}
                  onChange={(e) => setTherapistForm({ ...therapistForm, specialty: e.target.value })} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input style={styles.input} placeholder="Phone number" value={therapistForm.phone}
                  onChange={(e) => setTherapistForm({ ...therapistForm, phone: e.target.value })} />
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowTherapistModal(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={saveTherapist}>
                {editingTherapist ? 'Save Changes' : 'Add Therapist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Booking Card Component
function BookingCard({
  booking,
  onStatusUpdate,
  expanded = false,
}: {
  booking: Booking;
  onStatusUpdate: (id: string, status: string) => void;
  expanded?: boolean;
}) {
  const color = STATUS_COLORS[booking.status] || '#6b7280';
  const time = new Date(booking.scheduledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const date = new Date(booking.scheduledAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <div style={{ ...styles.bookingCard, borderLeft: `4px solid ${color}` }}>
      <div style={styles.bookingCardTop}>
        <div>
          <p style={styles.bookingTime}>{date} · {time}</p>
          <p style={styles.bookingGuest}>{booking.guestName || 'Walk-in Guest'}</p>
          <p style={styles.bookingService}>{booking.service?.name} · {booking.duration} min</p>
          {booking.therapist && <p style={styles.bookingTherapist}>👤 {booking.therapist.name}</p>}
        </div>
        <div style={styles.bookingRight}>
          <span style={{ ...styles.statusBadge, background: `${color}22`, color }}>{STATUS_LABELS[booking.status]}</span>
          <p style={styles.bookingAmount}>₹{booking.totalAmount.toLocaleString('en-IN')}</p>
          <p style={styles.paymentMode}>{booking.paymentMode || 'Pending'}</p>
        </div>
      </div>
      {/* Quick Actions */}
      {booking.status === 'SCHEDULED' && (
        <div style={styles.bookingActions}>
          <button style={styles.actionBtn} onClick={() => onStatusUpdate(booking.id, 'IN_PROGRESS')}>
            ▶ Start
          </button>
          <button style={{ ...styles.actionBtn, background: '#ef444422', color: '#ef4444' }}
            onClick={() => onStatusUpdate(booking.id, 'CANCELLED')}>
            ✕ Cancel
          </button>
        </div>
      )}
      {booking.status === 'IN_PROGRESS' && (
        <div style={styles.bookingActions}>
          <button style={{ ...styles.actionBtn, background: '#10b98122', color: '#10b981' }}
            onClick={() => onStatusUpdate(booking.id, 'COMPLETED')}>
            ✓ Complete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: { display: 'flex', height: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", color: '#e2e8f0', overflow: 'hidden' },
  loadingScreen: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f172a' },
  loadingContent: { textAlign: 'center' },
  sidebar: { width: 240, background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', padding: 0, flexShrink: 0 },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '24px 20px 20px', borderBottom: '1px solid #334155' },
  sidebarLogo: { width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  spaName: { fontSize: 13, fontWeight: 700, color: '#f1f5f9', margin: 0, lineHeight: 1.3 },
  spaOwner: { fontSize: 11, color: '#64748b', margin: 0 },
  nav: { padding: '16px 12px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', background: 'transparent', border: 'none', borderRadius: 8, color: '#94a3b8', fontSize: 14, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  navItemActive: { background: '#14b8a615', color: '#14b8a6', fontWeight: 600 },
  sidebarFooter: { padding: '12px 16px', borderTop: '1px solid #334155' },
  spaInfo: { display: 'flex', flexDirection: 'column', gap: 4 },
  infoRow: { fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, margin: 0 },
  main: { flex: 1, overflow: 'auto', padding: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: 0 },
  pageSubtitle: { fontSize: 13, color: '#64748b', margin: '4px 0 0' },
  headerActions: { display: 'flex', gap: 10, alignItems: 'center' },
  refreshBtn: { background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '8px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  primaryBtn: { background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  kpiCard: { background: '#1e293b', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 16 },
  kpiIcon: { width: 44, height: 44, borderRadius: 10, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  kpiValue: { fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  kpiLabel: { fontSize: 12, color: '#64748b', margin: '2px 0 0' },
  sectionCard: { background: '#1e293b', borderRadius: 12, padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#f1f5f9', margin: '0 0 16px' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40, color: '#64748b', textAlign: 'center' },
  bookingTimeline: { display: 'flex', flexDirection: 'column', gap: 12 },
  bookingList: { display: 'flex', flexDirection: 'column', gap: 12 },
  bookingCard: { background: '#0f172a', borderRadius: 10, padding: 16, border: '1px solid #334155' },
  bookingCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  bookingTime: { fontSize: 12, color: '#64748b', margin: '0 0 4px' },
  bookingGuest: { fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: '0 0 2px' },
  bookingService: { fontSize: 13, color: '#94a3b8', margin: '0 0 2px' },
  bookingTherapist: { fontSize: 12, color: '#64748b', margin: 0 },
  bookingRight: { textAlign: 'right' },
  statusBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  bookingAmount: { fontSize: 16, fontWeight: 700, color: '#14b8a6', margin: '6px 0 2px' },
  paymentMode: { fontSize: 11, color: '#64748b' },
  bookingActions: { display: 'flex', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #1e293b' },
  actionBtn: { padding: '5px 14px', borderRadius: 6, border: 'none', background: '#14b8a622', color: '#14b8a6', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  statBox: { background: '#1e293b', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' },
  statNum: { fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  statLabel: { fontSize: 12, color: '#64748b', margin: 0 },
  serviceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  serviceCard: { background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' },
  serviceHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  categoryBadge: { background: '#14b8a615', color: '#14b8a6', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
  serviceActions: { display: 'flex', gap: 6 },
  iconBtn: { background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' },
  serviceName: { fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: '0 0 6px' },
  serviceDesc: { fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 },
  serviceFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  serviceDuration: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' },
  servicePrice: { fontSize: 18, fontWeight: 700, color: '#14b8a6' },
  gstNote: { fontSize: 11, color: '#475569', margin: 0 },
  therapistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 },
  therapistCard: { background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 16 },
  therapistAvatar: { width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #14b8a6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#fff', flexShrink: 0 },
  therapistInfo: { flex: 1 },
  therapistName: { fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: '0 0 2px' },
  therapistSpecialty: { fontSize: 12, color: '#14b8a6', margin: '0 0 2px' },
  therapistGender: { fontSize: 11, color: '#64748b', margin: '0 0 2px' },
  therapistPhone: { fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, margin: 0 },
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 },
  modal: { background: '#1e293b', borderRadius: 16, padding: 28, maxWidth: 640, width: '100%', border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: '10px 12px', color: '#f1f5f9', fontSize: 14, outline: 'none' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 20, borderTop: '1px solid #334155' },
  cancelBtn: { background: '#0f172a', border: '1px solid #334155', color: '#94a3b8', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
};
