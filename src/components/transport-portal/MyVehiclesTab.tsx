'use client';

import React, { useState, useEffect } from 'react';
import { Bus, Car, Truck, Plus, Trash2, CheckCircle, XCircle, Loader2, Edit3, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';

const VEHICLE_TYPES = [
  { value: 'CAR', label: 'Car', icon: Car, color: 'from-orange-500 to-red-500', bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
  { value: 'BUS', label: 'Bus', icon: Bus, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  { value: 'MINIBUS', label: 'Mini Bus', icon: Bus, color: 'from-teal-500 to-cyan-600', bg: 'bg-teal-500/10 border-teal-500/20 text-teal-400' },
  { value: 'VAN', label: 'Van', icon: Truck, color: 'from-purple-500 to-violet-600', bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
];

const getTypeStyle = (type: string) => VEHICLE_TYPES.find(t => t.value === type) || VEHICLE_TYPES[0];

export function MyVehiclesTab({ token }: { token: string }) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    type: 'CAR',
    plateNumber: '',
    model: '',
    color: '',
    capacity: 4,
    perKmRate: 15,
    baseFare: 50,
  });

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/transport/vehicles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setVehicles(data.vehicles);
    } catch {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plateNumber.trim()) { toast.error('Plate number is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/transport/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, plateNumber: form.plateNumber.trim().toUpperCase() })
      });
      const data = await res.json();
      if (data.success) {
        setVehicles(v => [data.vehicle, ...v]);
        setShowForm(false);
        setForm({ type: 'CAR', plateNumber: '', model: '', color: '', capacity: 4, perKmRate: 15, baseFare: 50 });
        toast.success('Vehicle added successfully! 🚗');
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    setDeletingId(vehicleId);
    try {
      const res = await fetch(`/api/transport/vehicles?vehicleId=${vehicleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setVehicles(v => v.filter(x => x.id !== vehicleId));
        toast.success('Vehicle removed');
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Error deleting vehicle');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-blue-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white">My Vehicles</h2>
          <p className="text-xs text-slate-500 mt-0.5">Add and manage your fleet vehicles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus size={14} />
          {showForm ? 'Cancel' : 'Add Vehicle'}
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-[#0c1525]/80 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-sm">
          <h3 className="text-sm font-black text-white mb-4">Add New Vehicle</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Vehicle Type */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Vehicle Type</label>
              <div className="grid grid-cols-4 gap-2">
                {VEHICLE_TYPES.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, type: t.value, capacity: t.value === 'BUS' ? 40 : t.value === 'MINIBUS' ? 20 : t.value === 'VAN' ? 12 : 4 }));
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-black transition-all ${
                        form.type === t.value
                          ? `bg-gradient-to-br ${t.color} border-transparent text-white shadow-lg`
                          : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <Icon size={18} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Plate Number */}
              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Plate Number *</label>
                <input
                  type="text"
                  required
                  placeholder="MH 12 AB 1234"
                  value={form.plateNumber}
                  onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 uppercase transition-colors"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Model</label>
                <input
                  type="text"
                  placeholder="Innova / Tempo"
                  value={form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Color</label>
                <input
                  type="text"
                  placeholder="White / Black"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
                />
              </div>

              {/* Per KM Rate & Base Fare */}
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Per KM Rate (₹/km) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="15"
                  value={form.perKmRate}
                  onChange={e => setForm(f => ({ ...f, perKmRate: Number(e.target.value) }))}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Base Fare (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="50"
                  value={form.baseFare}
                  onChange={e => setForm(f => ({ ...f, baseFare: Number(e.target.value) }))}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Capacity */}
              <div className="col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                  Seats / Capacity: <span className="text-blue-400">{form.capacity}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={60}
                  value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: Number(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                  <span>1</span><span>15</span><span>30</span><span>45</span><span>60</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-black text-white py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="animate-spin" size={14} /> Saving...</> : <><Plus size={14} /> Add Vehicle</>}
            </button>
          </form>
        </div>
      )}

      {/* Vehicle List */}
      {vehicles.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <Car size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-bold">No Vehicles Added</p>
          <p className="text-slate-600 text-xs mt-1">Click "Add Vehicle" button above to add your first vehicle</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => {
            const style = getTypeStyle(v.type);
            const Icon = style.icon;
            return (
              <div key={v.id} className="bg-[#0c1525]/70 border border-slate-800/60 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-sm hover:border-slate-700/60 transition-all">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${style.color} flex items-center justify-center shrink-0 shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-white">{v.plateNumber}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${style.bg}`}>
                      {v.type}
                    </span>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      ₹{v.perKmRate || 15}/km
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {[v.model, v.color].filter(Boolean).join(' • ')} • {v.capacity} seats • Base Fee ₹{v.baseFare || 50}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {v.schedules?.length || 0} schedules
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(v.id)}
                  disabled={deletingId === v.id}
                  className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all shrink-0"
                >
                  {deletingId === v.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
