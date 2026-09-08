'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Plus, Edit3, Trash2, ExternalLink, Copy,
  CheckCircle, XCircle, RefreshCw, Building2, Phone,
  Mail, MapPin, Clock, Percent, User, Eye, EyeOff,
  Store, ChevronRight, AlertCircle, ToggleLeft, ToggleRight,
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
  gstNumber?: string;
  createdAt: string;
  _count?: { services: number; therapists: number; bookings: number };
}

const emptyForm = () => ({
  name: '',
  description: '',
  ownerName: '',
  ownerEmail: '',
  ownerPhone: '',
  password: '',
  phone: '',
  email: '',
  address: '',
  openTime: '09:00',
  closeTime: '21:00',
  commissionPct: '0',
  gstNumber: '',
});

export default function SpaOwnersPage() {
  const [spas, setSpas] = useState<Spa[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingSpa, setEditingSpa] = useState<Spa | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [externalSpaEnabled, setExternalSpaEnabled] = useState(false);
  const [togglingSpaMode, setTogglingSpaMode] = useState(false);

  // Load propertyId from session
  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated && d.user?.propertyId) {
          setPropertyId(d.user.propertyId);
        }
      });
  }, []);

  const loadSpas = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/spa?propertyId=${propertyId}`);
      const data = await res.json();
      setSpas(data.spas || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const loadSettings = useCallback(async () => {
    if (!propertyId) return;
    try {
      const res = await fetch(`/api/hotel/spa/settings?propertyId=${propertyId}`);
      const data = await res.json();
      if (typeof data.externalSpaEnabled === 'boolean') {
        setExternalSpaEnabled(data.externalSpaEnabled);
      }
    } catch (err) {
      console.error(err);
    }
  }, [propertyId]);

  const toggleSpaMode = async () => {
    if (!propertyId || togglingSpaMode) return;
    setTogglingSpaMode(true);
    const nextVal = !externalSpaEnabled;
    try {
      const res = await fetch('/api/hotel/spa/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, externalSpaEnabled: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setExternalSpaEnabled(data.externalSpaEnabled);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingSpaMode(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      loadSpas();
      loadSettings();
    }
  }, [propertyId, loadSpas, loadSettings]);

  const openAdd = () => {
    setEditingSpa(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (spa: Spa) => {
    setEditingSpa(spa);
    setForm({
      name: spa.name,
      description: spa.description || '',
      ownerName: spa.ownerName || '',
      ownerEmail: spa.ownerEmail || spa.email || '',
      ownerPhone: spa.ownerPhone || spa.phone || '',
      password: '',
      phone: spa.phone || '',
      email: spa.email || '',
      address: spa.address || '',
      openTime: spa.openTime || '09:00',
      closeTime: spa.closeTime || '21:00',
      commissionPct: String(spa.commissionPct),
      gstNumber: spa.gstNumber || '',
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name || !propertyId) return;
    if (!editingSpa && (!form.ownerEmail || !form.password)) {
      alert('Please enter Owner Email and Password for portal login');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, propertyId };
      if (editingSpa && !payload.password) {
        delete (payload as any).password;
      }
      if (editingSpa) {
        await fetch(`/api/spa/${editingSpa.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/spa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setShowModal(false);
      loadSpas();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (spa: Spa) => {
    await fetch(`/api/spa/${spa.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !spa.isActive }),
    });
    loadSpas();
  };

  const deleteSpa = async (spaId: string) => {
    await fetch(`/api/spa/${spaId}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    loadSpas();
  };

  const copyLoginInfo = (spa: Spa) => {
    const email = spa.ownerEmail || spa.email || 'Registered Email';
    const text = `Spa Owner Portal Login Details:\nLogin URL: ${window.location.origin}/login\nEmail: ${email}`;
    navigator.clipboard.writeText(text);
    setCopiedId(spa.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openPortal = (spaId: string) => {
    window.open(`/login`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Store size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">Spa Owners</h1>
          </div>
          <p className="text-slate-500 text-sm ml-13">
            Manage registered spa owners within the hotel • Each spa owner gets their dedicated portal
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadSpas}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Register New Spa
          </button>
        </div>
      </div>

      {/* Spa Mode Selector Card */}
      <div className={`mb-6 p-5 rounded-2xl border transition-all ${externalSpaEnabled ? 'bg-teal-950/30 border-teal-500/40' : 'bg-slate-800/40 border-slate-700'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${externalSpaEnabled ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-400'}`}>
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Guest Portal Spa Mode</h3>
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${externalSpaEnabled ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'bg-slate-700 text-slate-300'}`}>
                  {externalSpaEnabled ? 'External Spa Partner (ON)' : 'Hotel In-House Spa (OFF)'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {externalSpaEnabled
                  ? 'Active: Guests in the Guest Portal see services and plans from your registered External Spa Partner. Bookings flow directly to the Spa Owner Portal.'
                  : 'Active: Guests in the Guest Portal see the hotel’s own In-House Spa plans. Hotel team manages appointments in the Spa & Wellness module.'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleSpaMode}
            disabled={togglingSpaMode}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
              externalSpaEnabled
                ? 'bg-teal-500 text-white border-teal-400 shadow-lg shadow-teal-500/20'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
            }`}
          >
            <span>{externalSpaEnabled ? 'External Spa: ON' : 'External Spa: OFF'}</span>
            {externalSpaEnabled ? <ToggleRight size={22} className="text-white" /> : <ToggleLeft size={22} className="text-slate-400" />}
          </button>
        </div>
      </div>

      {/* How it Works Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-teal-500/5 border border-teal-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-teal-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-teal-300 font-semibold text-sm">How it works</p>
            <p className="text-slate-400 text-xs mt-1">
              1. Register Spa Owner with Email & Password ↗  2. Share /login credentials ↗  3. Spa owner logs in at /login to manage services, bookings, and therapists ↗  4. Toggle External Spa ON/OFF above for hotel guests
            </p>
          </div>
        </div>
      </div>

      {/* Spa Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw size={24} className="text-teal-400 animate-spin" />
        </div>
      ) : spas.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
          <Store size={48} className="mb-4 text-slate-700" />
          <p className="text-lg font-semibold">No spas registered yet</p>
          <p className="text-sm mt-1">Register your first spa owner</p>
          <button
            onClick={openAdd}
            className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm"
          >
            <Plus size={16} /> Register First Spa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {spas.map((spa) => (
            <SpaCard
              key={spa.id}
              spa={spa}
              copiedId={copiedId}
              deleteConfirm={deleteConfirm}
              onEdit={() => openEdit(spa)}
              onToggle={() => toggleActive(spa)}
              onCopy={() => copyLoginInfo(spa)}
              onOpenPortal={() => openPortal(spa.id)}
              onDeleteConfirm={() => setDeleteConfirm(spa.id)}
              onDeleteCancel={() => setDeleteConfirm(null)}
              onDeleteConfirmed={() => deleteSpa(spa.id)}
            />
          ))}
        </div>
      )}

      {/* Register / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-teal-500/10 to-cyan-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
                    <Store size={20} className="text-teal-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">
                      {editingSpa ? 'Edit Spa Details' : 'Register New Spa Owner'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Spa owner will receive a dedicated portal link to manage services, bookings, and therapists
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <XCircle size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Spa Info */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles size={12} /> Spa Details
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Spa Name *</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-teal-500"
                      placeholder="e.g. Serene Wellness Spa"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Description</label>
                    <textarea
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-teal-500 h-20 resize-none"
                      placeholder="Brief description of the spa..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Location / Wing</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-teal-500"
                      placeholder="e.g. Ground Floor, East Wing"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">GST Number</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-teal-500"
                      placeholder="GST Number"
                      value={form.gstNumber}
                      onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Opens At</label>
                    <input
                      type="time"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-teal-500"
                      value={form.openTime}
                      onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Closes At</label>
                    <input
                      type="time"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-teal-500"
                      value={form.closeTime}
                      onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Owner Info & Login Credentials */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User size={12} /> Spa Owner Details & Login Credentials
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Owner Name</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-teal-500"
                      placeholder="Full name of the owner"
                      value={form.ownerName}
                      onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Owner Phone</label>
                    <input
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-teal-500"
                      placeholder="+91 98765 00000"
                      value={form.ownerPhone}
                      onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">Login Email *</label>
                    <input
                      type="email"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-teal-500"
                      placeholder="owner@spa.com"
                      value={form.ownerEmail}
                      onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-slate-400 mb-1 block">
                      {editingSpa ? 'Reset Password (leave empty to keep current)' : 'Login Password *'}
                    </label>
                    <input
                      type="password"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-teal-500"
                      placeholder={editingSpa ? '••••••••' : 'Enter password for spa owner login'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      The spa owner will use this Email and Password to sign in at the main /login page.
                    </p>
                  </div>
                </div>
              </div>

              {/* Commission */}
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Percent size={12} /> Revenue Commission
                </p>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-semibold text-slate-400 mb-1 block">
                        Hotel Commission % (0 = No sharing)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-28 bg-slate-800 border border-amber-500/30 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500"
                          value={form.commissionPct}
                          onChange={(e) => setForm({ ...form, commissionPct: e.target.value })}
                        />
                        <span className="text-amber-400 font-bold">%</span>
                      </div>
                    </div>
                    <div className="text-right">
                      {parseFloat(form.commissionPct) > 0 && (
                        <div className="text-xs text-slate-400">
                          <p>Spa Owner keeps: <span className="text-teal-400 font-bold">{100 - parseFloat(form.commissionPct)}%</span></p>
                          <p>Hotel earns: <span className="text-amber-400 font-bold">{form.commissionPct}%</span></p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.name}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm disabled:opacity-50"
              >
                {saving ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                {editingSpa ? 'Save Changes' : 'Register Spa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Spa Card Component ───────────────────────────────────────────────────────

function SpaCard({
  spa,
  copiedId,
  deleteConfirm,
  onEdit,
  onToggle,
  onCopy,
  onOpenPortal,
  onDeleteConfirm,
  onDeleteCancel,
  onDeleteConfirmed,
}: {
  spa: Spa;
  copiedId: string | null;
  deleteConfirm: string | null;
  onEdit: () => void;
  onToggle: () => void;
  onCopy: () => void;
  onOpenPortal: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onDeleteConfirmed: () => void;
}) {
  const isCopied = copiedId === spa.id;
  const isDeleting = deleteConfirm === spa.id;

  return (
    <div className={`bg-slate-800/60 border rounded-2xl overflow-hidden transition-all ${spa.isActive ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
      {/* Card Header */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} className="text-teal-400" />
            </div>
            <div>
              <h3 className="font-bold text-white">{spa.name}</h3>
              {spa.address && <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={10} />{spa.address}</p>}
            </div>
          </div>
          {/* Active Toggle */}
          <button onClick={onToggle} className="shrink-0 mt-1">
            {spa.isActive
              ? <ToggleRight size={24} className="text-teal-400" />
              : <ToggleLeft size={24} className="text-slate-600" />
            }
          </button>
        </div>
      </div>

      {/* Info Rows */}
      <div className="px-5 py-4 space-y-2">
        {spa.ownerName && (
          <div className="flex items-center gap-2 text-sm">
            <User size={13} className="text-slate-500 shrink-0" />
            <span className="text-slate-300">{spa.ownerName}</span>
          </div>
        )}
        {spa.ownerPhone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone size={13} className="text-slate-500 shrink-0" />
            <span className="text-slate-400">{spa.ownerPhone}</span>
          </div>
        )}
        {spa.ownerEmail && (
          <div className="flex items-center gap-2 text-sm">
            <Mail size={13} className="text-slate-500 shrink-0" />
            <span className="text-slate-400">{spa.ownerEmail}</span>
          </div>
        )}
        {(spa.openTime || spa.closeTime) && (
          <div className="flex items-center gap-2 text-sm">
            <Clock size={13} className="text-slate-500 shrink-0" />
            <span className="text-slate-400">{spa.openTime} – {spa.closeTime}</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 divide-x divide-slate-700/50 border-t border-slate-700/50">
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-black text-white">{spa._count?.services || 0}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Services</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-black text-white">{spa._count?.therapists || 0}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Therapists</p>
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-lg font-black text-teal-400">{spa.commissionPct}%</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Commission</p>
        </div>
      </div>

      {/* Portal Login Credentials Box */}
      <div className="px-5 py-3 bg-teal-500/5 border-t border-teal-500/10">
        <p className="text-[10px] text-teal-400 font-bold uppercase tracking-wider mb-2">Spa Owner Portal Login</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-900 rounded-lg px-3 py-1.5 text-xs text-slate-300 truncate font-mono">
            {spa.ownerEmail || spa.email || 'No email registered'}
          </div>
          <button
            onClick={onCopy}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${isCopied ? 'bg-teal-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {isCopied ? <CheckCircle size={12} /> : <Copy size={12} />}
            {isCopied ? 'Copied!' : 'Copy Info'}
          </button>
          <button
            onClick={onOpenPortal}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 text-slate-300 hover:bg-slate-600 flex items-center gap-1.5"
          >
            <ExternalLink size={12} /> Login Page
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      {isDeleting ? (
        <div className="px-5 py-3 border-t border-red-500/20 bg-red-500/5">
          <p className="text-xs text-red-400 mb-3">⚠️ This spa will be deleted. Are you sure?</p>
          <div className="flex gap-2">
            <button onClick={onDeleteCancel} className="flex-1 py-2 rounded-xl bg-slate-700 text-slate-300 text-xs font-bold">
              Cancel
            </button>
            <button onClick={onDeleteConfirmed} className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold">
              Yes, Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-3 border-t border-slate-700/50 flex gap-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-bold transition-colors"
          >
            <Edit3 size={12} /> Edit
          </button>
          <button
            onClick={onDeleteConfirm}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
