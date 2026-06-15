"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft, Plus, MapPin, Trash2, Edit3, ToggleLeft, ToggleRight,
  Clock, DollarSign, AlertTriangle, Zap, Cloud, Calendar, Building2,
  Save, X, Circle, Hash, CheckCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DeliveryZone {
  id: string;
  name: string;
  type: 'RADIUS' | 'PINCODE' | 'CORPORATE';
  radiusKm: number | null;
  pincodes: string | null;
  deliveryFee: number;
  minOrderValue: number;
  etaMinutes: number;
  freeDeliveryThreshold: number | null;
  peakSurchargePercent: number;
  peakHoursStart: string | null;
  peakHoursEnd: string | null;
  isRainOverride: boolean;
  rainSurchargePercent: number;
  deliveryHoursStart: string | null;
  deliveryHoursEnd: string | null;
  blackoutDates: string | null;
  corporateDiscount: number;
  isActive: boolean;
  createdAt: string;
}

const ZONE_TYPE_CONFIG = {
  RADIUS: { label: 'Radius Zone', icon: <Circle size={14} />, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  PINCODE: { label: 'Pincode Zone', icon: <Hash size={14} />, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  CORPORATE: { label: 'Corporate Zone', icon: <Building2 size={14} />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
};

const emptyZone: Partial<DeliveryZone> = {
  name: '',
  type: 'RADIUS',
  radiusKm: 5,
  pincodes: '',
  deliveryFee: 0,
  minOrderValue: 0,
  etaMinutes: 30,
  freeDeliveryThreshold: null,
  peakSurchargePercent: 0,
  peakHoursStart: '12:00',
  peakHoursEnd: '14:00',
  isRainOverride: false,
  rainSurchargePercent: 10,
  deliveryHoursStart: '09:00',
  deliveryHoursEnd: '23:00',
  blackoutDates: '',
  corporateDiscount: 0,
};

export default function DeliveryZonesPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const p = propertyCode ? `/${propertyCode}` : '';

  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingZone, setEditingZone] = useState<Partial<DeliveryZone> | null>(null);
  const [isNewZone, setIsNewZone] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/delivery-zones');
      const json = await res.json();
      if (json.success) setZones(json.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchZones(); }, []);

  const handleSave = async () => {
    if (!editingZone?.name) return;
    setSaving(true);
    try {
      const res = await fetch('/api/delivery-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingZone)
      });
      const json = await res.json();
      if (json.success) {
        await fetchZones();
        setEditingZone(null);
        setIsNewZone(false);
      } else { alert(json.message || 'Save failed'); }
    } finally { setSaving(false); }
  };

  const handleToggleRain = async (zone: DeliveryZone) => {
    setTogglingId(zone.id);
    try {
      const res = await fetch('/api/delivery-zones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: zone.id, isRainOverride: !zone.isRainOverride })
      });
      if ((await res.json()).success) await fetchZones();
    } finally { setTogglingId(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this zone?')) return;
    await fetch(`/api/delivery-zones?id=${id}`, { method: 'DELETE' });
    await fetchZones();
  };

  const field = (key: keyof DeliveryZone, label: string, type: string = 'text', placeholder?: string) => (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
      <input
        type={type}
        value={(editingZone as any)?.[key] ?? ''}
        onChange={e => setEditingZone(prev => ({ ...prev, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-600 focus:border-indigo-500 outline-none text-xs font-bold"
      />
    </div>
  );

  return (
    <div className="flex flex-col min-h-full gap-5 p-5 rounded-3xl" style={{ background: 'radial-gradient(circle at top right, #0d0f1a, #050505 70%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm"
            onClick={() => router.push(`${p}/operations/delivery`)}
            className="rounded-2xl h-10 w-10 p-0 flex items-center justify-center bg-white/5 border-white/10 text-white/70 hover:bg-white/10">
            <ChevronLeft size={18} />
          </Button>
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <MapPin size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Delivery Zones</h1>
            <p className="text-[9px] font-bold text-purple-300/70 uppercase tracking-[0.2em]">Zone & Fee Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchZones}
            className="rounded-xl h-9 w-9 p-0 flex items-center justify-center bg-white/5 border-white/10">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
          <button
            onClick={() => { setEditingZone({ ...emptyZone }); setIsNewZone(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20"
          >
            <Plus size={14} /> Add Zone
          </button>
        </div>
      </div>

      {/* Rain Override Global Banner */}
      {zones.some(z => z.isRainOverride) && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-3 flex items-center gap-3">
          <Cloud size={18} className="text-blue-400 animate-pulse" />
          <div>
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">🌧️ Rain Surcharge Active</p>
            <p className="text-[9px] text-blue-400/70 font-bold">
              {zones.filter(z => z.isRainOverride).map(z => z.name).join(', ')} — Extra charges applied
            </p>
          </div>
          <button
            onClick={() => zones.filter(z => z.isRainOverride).forEach(z => handleToggleRain(z))}
            className="ml-auto px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-blue-500/30"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Zone Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="h-52 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <MapPin size={32} />
          </div>
          <div>
            <h3 className="text-white font-black text-lg uppercase tracking-tight">No Zones Yet</h3>
            <p className="text-slate-500 text-sm font-bold">Create your first delivery zone to manage fees and coverage.</p>
          </div>
          <button
            onClick={() => { setEditingZone({ ...emptyZone }); setIsNewZone(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all"
          >
            <Plus size={14} /> Create First Zone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {zones.map(zone => {
            const typeCfg = ZONE_TYPE_CONFIG[zone.type] || ZONE_TYPE_CONFIG.RADIUS;
            return (
              <div key={zone.id} className="bg-[#0d0f14]/80 border border-white/5 rounded-[2rem] p-5 space-y-4 hover:border-white/10 transition-all relative overflow-hidden group">
                {/* Rain overlay */}
                {zone.isRainOverride && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
                    <div className="absolute top-2 right-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <Cloud size={9} /> Rain
                    </div>
                  </div>
                )}

                {/* Zone type + name */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${typeCfg.bg} ${typeCfg.color}`}>
                      {typeCfg.icon} {typeCfg.label}
                    </div>
                    <h3 className="text-sm font-black text-white tracking-tight">{zone.name}</h3>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingZone({ ...zone }); setIsNewZone(false); }}
                      className="w-8 h-8 bg-white/5 hover:bg-indigo-500/20 border border-white/10 hover:border-indigo-500/30 text-slate-400 hover:text-indigo-400 rounded-xl flex items-center justify-center transition-all">
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => handleDelete(zone.id)}
                      className="w-8 h-8 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-xl flex items-center justify-center transition-all">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: <DollarSign size={10} />, label: 'Fee', value: `₹${zone.deliveryFee}` },
                    { icon: <Clock size={10} />, label: 'ETA', value: `${zone.etaMinutes}m` },
                    { icon: <MapPin size={10} />, label: zone.type === 'RADIUS' ? 'Radius' : 'Type', value: zone.type === 'RADIUS' ? `${zone.radiusKm}km` : zone.type === 'PINCODE' ? 'PIN' : 'Corp' },
                  ].map(s => (
                    <div key={s.label} className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                      <div className="flex items-center gap-1 text-slate-500 mb-1">{s.icon}<span className="text-[7px] font-black uppercase tracking-widest">{s.label}</span></div>
                      <p className="text-xs font-black text-white">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-[10px] font-bold text-slate-500">
                  {zone.minOrderValue > 0 && (
                    <p>Min Order: <span className="text-slate-300">₹{zone.minOrderValue}</span></p>
                  )}
                  {zone.freeDeliveryThreshold && (
                    <p className="text-emerald-400">Free delivery above ₹{zone.freeDeliveryThreshold}</p>
                  )}
                  {zone.peakSurchargePercent > 0 && (
                    <p className="flex items-center gap-1"><Zap size={10} className="text-amber-400" />Peak: +{zone.peakSurchargePercent}% ({zone.peakHoursStart}–{zone.peakHoursEnd})</p>
                  )}
                  {zone.deliveryHoursStart && (
                    <p className="flex items-center gap-1"><Clock size={10} />Hours: {zone.deliveryHoursStart}–{zone.deliveryHoursEnd}</p>
                  )}
                  {zone.corporateDiscount > 0 && (
                    <p className="text-amber-400 flex items-center gap-1"><Building2 size={10} />Corporate: -{zone.corporateDiscount}%</p>
                  )}
                </div>

                {/* Rain toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Cloud size={12} className={zone.isRainOverride ? 'text-blue-400' : 'text-slate-600'} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Rain Surcharge {zone.isRainOverride ? `(+${zone.rainSurchargePercent}%)` : 'Off'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleRain(zone)}
                    disabled={togglingId === zone.id}
                    className={`transition-all ${zone.isRainOverride ? 'text-blue-400' : 'text-slate-600'} hover:scale-110 disabled:opacity-50`}
                  >
                    {zone.isRainOverride ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit / Create Zone Drawer ────────────────────────────────────── */}
      {editingZone && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setEditingZone(null)} />
          <div className="relative bg-[#0c0e14] border border-[#1e293b] rounded-t-[2.5rem] md:rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-7 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-white uppercase tracking-tight">
                {isNewZone ? 'Create Zone' : 'Edit Zone'}
              </h2>
              <button onClick={() => setEditingZone(null)} className="w-9 h-9 rounded-xl bg-[#1e293b] flex items-center justify-center text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Zone Type */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Zone Type</label>
                <div className="flex gap-2">
                  {(['RADIUS', 'PINCODE', 'CORPORATE'] as const).map(t => {
                    const cfg = ZONE_TYPE_CONFIG[t];
                    return (
                      <button key={t}
                        onClick={() => setEditingZone(prev => ({ ...prev, type: t }))}
                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-1.5 ${editingZone.type === t ? `${cfg.bg} ${cfg.color} border-current` : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'}`}
                      >
                        {cfg.icon} {cfg.label.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {field('name', 'Zone Name', 'text', 'e.g. South Delhi Zone')}

              <div className="grid grid-cols-2 gap-3">
                {editingZone.type === 'RADIUS' && field('radiusKm', 'Radius (km)', 'number', '5')}
                {editingZone.type === 'PINCODE' && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Pincodes (comma separated)</label>
                    <textarea
                      rows={2}
                      value={editingZone.pincodes || ''}
                      onChange={e => setEditingZone(prev => ({ ...prev, pincodes: e.target.value }))}
                      placeholder="110001, 110002, 110003"
                      className="w-full px-3 py-2 rounded-xl bg-[#070b12] border border-[#1e293b] text-white placeholder-slate-600 focus:border-indigo-500 outline-none text-xs font-bold resize-none"
                    />
                  </div>
                )}
                {field('deliveryFee', 'Delivery Fee (₹)', 'number', '40')}
                {field('minOrderValue', 'Min Order (₹)', 'number', '200')}
                {field('etaMinutes', 'ETA (minutes)', 'number', '30')}
                {field('freeDeliveryThreshold', 'Free Delivery Above (₹)', 'number', '500')}
              </div>

              {/* Delivery Hours */}
              <div className="border border-white/5 rounded-2xl p-4 space-y-3 bg-black/20">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={10} />Delivery Hours</p>
                <div className="grid grid-cols-2 gap-3">
                  {field('deliveryHoursStart', 'Opens At', 'time')}
                  {field('deliveryHoursEnd', 'Closes At', 'time')}
                </div>
              </div>

              {/* Peak Hours */}
              <div className="border border-amber-500/15 rounded-2xl p-4 space-y-3 bg-amber-500/5">
                <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5"><Zap size={10} />Peak Hour Surcharge</p>
                <div className="grid grid-cols-3 gap-3">
                  {field('peakSurchargePercent', 'Surcharge (%)', 'number', '15')}
                  {field('peakHoursStart', 'Peak Start', 'time')}
                  {field('peakHoursEnd', 'Peak End', 'time')}
                </div>
              </div>

              {/* Rain Override */}
              <div className="border border-blue-500/15 rounded-2xl p-4 space-y-3 bg-blue-500/5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><Cloud size={10} />Rain/Weather Surcharge</p>
                  <button
                    onClick={() => setEditingZone(prev => ({ ...prev, isRainOverride: !prev?.isRainOverride }))}
                    className={`transition-all ${editingZone.isRainOverride ? 'text-blue-400' : 'text-slate-600'} hover:scale-110`}
                  >
                    {editingZone.isRainOverride ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                  </button>
                </div>
                {editingZone.isRainOverride && field('rainSurchargePercent', 'Rain Surcharge (%)', 'number', '10')}
              </div>

              {/* Corporate Discount */}
              {editingZone.type === 'CORPORATE' && (
                <div className="border border-amber-500/15 rounded-2xl p-4 space-y-3 bg-amber-500/5">
                  <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5"><Building2 size={10} />Corporate Discount</p>
                  {field('corporateDiscount', 'Discount (%)', 'number', '20')}
                </div>
              )}

              {/* Save */}
              <div className="flex gap-3 pt-2">
                <Button onClick={() => setEditingZone(null)}
                  className="flex-1 h-11 bg-[#1e293b] hover:bg-[#28354c] text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#334155]/60">
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={saving}
                  className="flex-1 h-11 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/20">
                  <Save size={13} className="mr-1.5" />
                  {isNewZone ? 'Create Zone' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
