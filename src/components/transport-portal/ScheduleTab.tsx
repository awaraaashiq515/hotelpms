'use client';

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Bus, Car, Route, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const statusColors: Record<string, string> = {
  true: 'bg-green-500/10 border-green-500/30 text-green-400',
  false: 'bg-red-500/10 border-red-500/30 text-red-400',
};

export function ScheduleTab({ token }: { token: string }) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    vehicleId: '',
    routeName: '',
    fromLocation: '',
    toLocation: '',
    departureTime: '08:00',
    arrivalTime: '',
    days: [] as string[],
    pricePerSeat: 0,
    fullVehiclePrice: 0,
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [schedRes, vehRes] = await Promise.all([
        fetch('/api/transport/schedule', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/transport/vehicles', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [schedData, vehData] = await Promise.all([schedRes.json(), vehRes.json()]);
      if (schedData.success) setSchedules(schedData.schedules);
      if (vehData.success) setVehicles(vehData.vehicles);
    } catch {
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter(d => d !== day) : [...f.days, day]
    }));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId) { toast.error('Please select a vehicle'); return; }
    if (!form.routeName || !form.fromLocation || !form.toLocation) { toast.error('Route details are required'); return; }
    if (form.days.length === 0) { toast.error('Please select at least one day'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/transport/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          days: form.days.join(','),
          pricePerSeat: Number(form.pricePerSeat),
          fullVehiclePrice: form.fullVehiclePrice ? Number(form.fullVehiclePrice) : null,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSchedules(s => [data.schedule, ...s]);
        setShowForm(false);
        setForm({ vehicleId: '', routeName: '', fromLocation: '', toLocation: '', departureTime: '08:00', arrivalTime: '', days: [], pricePerSeat: 0, fullVehiclePrice: 0, notes: '' });
        toast.success('Schedule added successfully! 🕐');
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Error. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSchedule = async (scheduleId: string, current: boolean) => {
    setTogglingId(scheduleId);
    try {
      const res = await fetch('/api/transport/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ scheduleId, isActive: !current })
      });
      const data = await res.json();
      if (data.success) {
        setSchedules(s => s.map(x => x.id === scheduleId ? { ...x, isActive: !current } : x));
        toast.success(!current ? 'Schedule activated ✅' : 'Schedule paused');
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    setDeletingId(scheduleId);
    try {
      const res = await fetch(`/api/transport/schedule?scheduleId=${scheduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSchedules(s => s.filter(x => x.id !== scheduleId));
        toast.success('Schedule removed');
      }
    } catch {
      toast.error('Error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-blue-400" size={32} /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white">My Schedule</h2>
          <p className="text-xs text-slate-500 mt-0.5">Set up routes and departure timings</p>
        </div>
        {vehicles.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95"
          >
            <Plus size={14} />
            {showForm ? 'Cancel' : 'Add Schedule'}
          </button>
        )}
      </div>

      {/* No vehicle warning */}
      {vehicles.length === 0 && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center gap-3">
          <Car size={18} className="text-orange-400 shrink-0" />
          <p className="text-xs text-orange-300 font-medium">Please add a vehicle in "My Vehicles" tab first before creating a schedule.</p>
        </div>
      )}

      {/* Add Form */}
      {showForm && vehicles.length > 0 && (
        <div className="bg-[#0c1525]/80 border border-blue-500/20 rounded-2xl p-5 backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-black text-white">Add New Schedule</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            {/* Vehicle Select */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Select Vehicle *</label>
              <div className="relative">
                <select
                  value={form.vehicleId}
                  onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
                  required
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                >
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plateNumber} ({v.type}) — {v.capacity} seats</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Route Name */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Route Name *</label>
              <input
                type="text"
                placeholder="Hotel → Airport"
                value={form.routeName}
                onChange={e => setForm(f => ({ ...f, routeName: e.target.value }))}
                required
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
              />
            </div>

            {/* From / To */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">From Location *</label>
                <div className="relative">
                  <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-green-400" />
                  <input
                    type="text"
                    placeholder="Hotel Main Gate"
                    value={form.fromLocation}
                    onChange={e => setForm(f => ({ ...f, fromLocation: e.target.value }))}
                    required
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">To Location *</label>
                <div className="relative">
                  <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
                  <input
                    type="text"
                    placeholder="City Airport"
                    value={form.toLocation}
                    onChange={e => setForm(f => ({ ...f, toLocation: e.target.value }))}
                    required
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Departure Time *</label>
                <div className="relative">
                  <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    type="time"
                    value={form.departureTime}
                    onChange={e => setForm(f => ({ ...f, departureTime: e.target.value }))}
                    required
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Arrival Time</label>
                <div className="relative">
                  <Clock size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="time"
                    value={form.arrivalTime}
                    onChange={e => setForm(f => ({ ...f, arrivalTime: e.target.value }))}
                    className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Days */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Operating Days *</label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-all ${
                      form.days.includes(day)
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20'
                        : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {day}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, days: f.days.length === 7 ? [] : [...DAYS] }))}
                  className="px-3 py-1.5 rounded-lg text-xs font-black border border-slate-600/60 text-slate-400 hover:text-white transition-all"
                >
                  All
                </button>
              </div>
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Price / Seat (₹)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="250"
                  value={form.pricePerSeat || ''}
                  onChange={e => setForm(f => ({ ...f, pricePerSeat: Number(e.target.value) }))}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Full Vehicle Price (₹)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="2000"
                  value={form.fullVehiclePrice || ''}
                  onChange={e => setForm(f => ({ ...f, fullVehiclePrice: Number(e.target.value) }))}
                  className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Notes (Optional)</label>
              <input
                type="text"
                placeholder="AC available, luggage allowed..."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 placeholder-slate-600 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-black text-white py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {saving ? <><Loader2 className="animate-spin" size={14} /> Saving...</> : <><Clock size={14} /> Add Schedule</>}
            </button>
          </form>
        </div>
      )}

      {/* Schedule List */}
      {schedules.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-bold">No Schedules Found</p>
          <p className="text-slate-600 text-xs mt-1">Add your route and departure timings above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map(s => (
            <div key={s.id} className="bg-[#0c1525]/70 border border-slate-800/60 rounded-2xl p-4 backdrop-blur-sm hover:border-slate-700/60 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Route name */}
                  <div className="flex items-center gap-2 mb-2">
                    <Route size={14} className="text-blue-400 shrink-0" />
                    <span className="text-sm font-black text-white truncate">{s.routeName}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border shrink-0 ${s.isActive ? statusColors['true'] : statusColors['false']}`}>
                      {s.isActive ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>

                  {/* From → To */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-green-400 shrink-0"></span>
                      {s.fromLocation}
                    </div>
                    <div className="flex-1 h-px bg-slate-700 mx-1"></div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-red-400 shrink-0"></span>
                      {s.toLocation}
                    </div>
                  </div>

                  {/* Time & Days */}
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-1 rounded-lg">
                      <Clock size={10} className="text-blue-400" />
                      {s.departureTime}{s.arrivalTime ? ` → ${s.arrivalTime}` : ''}
                    </span>
                    <span className="flex items-center gap-1 bg-slate-800/60 px-2 py-1 rounded-lg">
                      {s.days}
                    </span>
                    {s.pricePerSeat > 0 && (
                      <span className="flex items-center gap-1 bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-1 rounded-lg">
                        ₹{s.pricePerSeat}/seat
                      </span>
                    )}
                    {s.fullVehiclePrice && (
                      <span className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-1 rounded-lg">
                        ₹{s.fullVehiclePrice} full
                      </span>
                    )}
                  </div>

                  {/* Vehicle info */}
                  {s.vehicle && (
                    <div className="text-[10px] text-slate-500 mt-1.5">
                      {s.vehicle.type === 'BUS' ? <Bus size={10} className="inline mr-1 text-blue-400" /> : <Car size={10} className="inline mr-1 text-orange-400" />}
                      {s.vehicle.plateNumber} ({s.vehicle.type})
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => toggleSchedule(s.id, s.isActive)}
                    disabled={togglingId === s.id}
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${
                      s.isActive
                        ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    {togglingId === s.id ? <Loader2 size={12} className="animate-spin" /> : s.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    onClick={() => deleteSchedule(s.id)}
                    disabled={deletingId === s.id}
                    className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
                  >
                    {deletingId === s.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
