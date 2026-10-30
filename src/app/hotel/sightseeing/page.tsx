'use client';

import React, { useState, useEffect } from 'react';
import {
  Tent, Plus, Trash2, MapPin, Clock, Star, Phone,
  IndianRupee, Tag, CheckCircle2, Loader2, Sparkles, X, ArrowLeft
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

interface Spot {
  id: string;
  name: string;
  category: string;
  distance: string;
  timing: string;
  entryFee?: string;
  rating: number;
  description: string;
  tags?: string;
  contactPhone?: string;
  isActive: boolean;
}

export default function HotelSightseeingManagementPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category: 'MONUMENT',
    distance: '2.5 km',
    timing: '9:00 AM – 6:00 PM',
    entryFee: 'Free Entry',
    rating: '4.8',
    description: '',
    tags: 'History, Photography, Sightseeing',
    contactPhone: '',
  });

  const fetchSpots = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sightseeing');
      const j = await res.json();
      if (j.success) setSpots(j.data || []);
    } catch {
      toast.error('Failed to load sightseeing destinations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  const handleAddSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description) {
      toast.error('Spot name and description are required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/sightseeing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (j.success) {
        toast.success(j.message || 'Sightseeing destination added!');
        setShowAddModal(false);
        setForm({
          name: '',
          category: 'MONUMENT',
          distance: '2.5 km',
          timing: '9:00 AM – 6:00 PM',
          entryFee: 'Free Entry',
          rating: '4.8',
          description: '',
          tags: 'History, Photography, Sightseeing',
          contactPhone: '',
        });
        fetchSpots();
      } else {
        toast.error(j.message || 'Failed to add spot');
      }
    } catch {
      toast.error('Error adding spot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this sightseeing destination?')) return;
    try {
      const res = await fetch(`/api/sightseeing?id=${id}`, { method: 'DELETE' });
      const j = await res.json();
      if (j.success) {
        toast.success('Destination removed');
        fetchSpots();
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-gradient-to-r from-[#0d162a] to-[#090f1d] border border-indigo-500/20 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Tent size={22} />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                Front Desk · Concierge
              </span>
              <h1 className="text-2xl font-black text-white">Local Sightseeing & Tour Management</h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Curate local attractions, historic forts, adventure sports, and viewpoints. Destinations added here appear live on the Travel Agent Portal and Guest Concierge.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Destination</span>
        </button>
      </div>

      {/* Destination Grid */}
      {loading ? (
        <div className="h-44 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      ) : spots.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-[#090f1e]/40 space-y-3">
          <Tent size={40} className="mx-auto text-slate-700" />
          <p className="text-base font-black text-slate-300">No Sightseeing Destinations Listed</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click &quot;Add Destination&quot; above to list your city&apos;s best attractions and tour spots.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/25"
          >
            <Plus size={13} />
            <span>Add First Destination</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {spots.map((spot) => (
            <div
              key={spot.id}
              className="p-5 rounded-3xl bg-[#090f1e] border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-white">{spot.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mt-1 inline-block">
                      {spot.category}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(spot.id)}
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{spot.description}</p>

                <div className="space-y-1 text-[11px] text-slate-400 pt-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin size={11} className="text-indigo-400" /> {spot.distance} from hotel
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Clock size={11} className="text-sky-400" /> {spot.timing}
                  </p>
                  {spot.entryFee && (
                    <p className="flex items-center gap-1.5 font-bold text-emerald-400">
                      <IndianRupee size={11} /> {spot.entryFee}
                    </p>
                  )}
                  {spot.contactPhone && (
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Phone size={11} /> {spot.contactPhone}
                    </p>
                  )}
                </div>
              </div>

              {spot.tags && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-800">
                  {spot.tags.split(',').map((t) => (
                    <span key={t} className="text-[9px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── ADD SPOT MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#090f1e] border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Tent size={18} className="text-indigo-400" />
                <span>Add Sightseeing Destination</span>
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSpot} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Destination Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Amber Fort / Solang Valley"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="MONUMENT">Monument / Fort</option>
                    <option value="NATURE">Nature & Lake</option>
                    <option value="RELIGIOUS">Temple & Spiritual</option>
                    <option value="ADVENTURE">Adventure Sports</option>
                    <option value="MARKET">Market & Handicrafts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Distance *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. 4.2 km"
                    value={form.distance}
                    onChange={(e) => setForm({ ...form, distance: e.target.value })}
                    className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Visiting Hours</label>
                  <input
                    type="text"
                    placeholder="e.g. 9:00 AM – 6:00 PM"
                    value={form.timing}
                    onChange={(e) => setForm({ ...form, timing: e.target.value })}
                    className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Entry Fee</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹100 / Free"
                    value={form.entryFee}
                    onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
                    className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tell guests about the history, key attractions, golden hour tips..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="History, Photography, Family"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  <span>Save Destination</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
