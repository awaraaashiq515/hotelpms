"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ChevronLeft, Plus, Users, Trash2, Edit3, ToggleLeft, ToggleRight,
  Clock, Phone, Navigation, Save, X, RefreshCw, Search, Bike, ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Rider {
  id: string;
  fullName: string;
  phone: string | null;
  email: string;
  vehicleNumber: string | null;
  vehicleType: string | null;
  deliveryRadius: number | null;
  isActive: boolean;
  dutyStatus?: string; // mapped to wtStatus
  propertyId: string | null;
  property?: { name: string } | null;
  outstandingCash?: number;
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  BIKE: '🏍️ Motorbike',
  SCOOTER: '🛵 Scooter',
  CAR: '🚗 Car',
  BICYCLE: '🚲 Bicycle',
};

const emptyRider: Partial<Rider> = {
  fullName: '',
  phone: '',
  vehicleNumber: '',
  vehicleType: 'BIKE',
  deliveryRadius: 5.0,
  isActive: true,
};

export default function RiderManagementPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string;
  const p = propertyCode ? `/${propertyCode}` : '';

  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRider, setEditingRider] = useState<Partial<Rider> | null>(null);
  const [isNewRider, setIsNewRider] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentProperty, setCurrentProperty] = useState<any>(null);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [handoversLoading, setHandoversLoading] = useState(false);

  const fetchHandovers = async () => {
    if (!currentProperty?.id) return;
    setHandoversLoading(true);
    try {
      const res = await fetch(`/api/admin/handovers?propertyId=${currentProperty.id}`);
      const json = await res.json();
      if (json.success) {
        setHandovers(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch handovers:', err);
    } finally {
      setHandoversLoading(false);
    }
  };

  const handleResolveHandover = async (handoverId: string, status: 'APPROVED' | 'REJECTED') => {
    const notes = prompt(`Enter optional manager notes for this ${status.toLowerCase()} handover:`);
    if (notes === null) return;

    try {
      const res = await fetch('/api/admin/handovers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handoverId, status, notes })
      });
      const json = await res.json();
      if (json.success) {
        alert(`Handover request ${status.toLowerCase()} successfully.`);
        fetchHandovers();
      } else {
        alert(json.message || 'Failed to update handover status.');
      }
    } catch (_) {
      alert('Network error.');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, propRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/properties')
      ]);
      const usersData = await usersRes.json();
      const propData = await propRes.json();

      let activePropertyId = null;
      if (propData.success && propData.data.length > 0) {
        const slugifyInline = (str: string) => str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        const activeProp = propData.data.find((p: any) => 
          p.code === propertyCode || 
          slugifyInline(p.name) === propertyCode || 
          p.id === propertyCode
        ) || propData.data[0];
        
        if (activeProp) {
          setCurrentProperty(activeProp);
          activePropertyId = activeProp.id;
        }
      }

      if (usersData.success && Array.isArray(usersData.data)) {
        // Filter users who are DELIVERY_RIDER and belong to this property (or have no propertyId)
        const allRiders = usersData.data
          .filter((u: any) => u.role?.name === 'DELIVERY_RIDER')
          .map((u: any) => ({
            id: u.id,
            fullName: u.fullName,
            phone: u.phone,
            email: u.email,
            vehicleNumber: u.vehicleNumber,
            vehicleType: u.vehicleType || 'BIKE',
            deliveryRadius: u.deliveryRadius || 5.0,
            isActive: u.isActive,
            dutyStatus: u.wtStatus || 'offline',
            propertyId: u.propertyId,
            property: u.property,
            outstandingCash: u.outstandingCash || 0,
          }));

        // Filter riders that match this property code/id
        const filtered = allRiders.filter(
          (r: Rider) => !r.propertyId || r.propertyId === activePropertyId
        );
        setRiders(filtered);
      }
    } catch (err) {
      console.error('Failed to fetch riders list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [propertyCode]);

  useEffect(() => {
    if (currentProperty?.id) {
      fetchHandovers();
    }
  }, [currentProperty]);

  const handleSave = async () => {
    if (!editingRider?.fullName || !editingRider?.phone || !editingRider?.vehicleNumber) {
      alert('Name, Phone, and Vehicle Number are required.');
      return;
    }
    setSaving(true);
    try {
      const email = `${editingRider.phone.trim()}@delivery.com`;
      const payload = {
        fullName: editingRider.fullName.trim(),
        email,
        phone: editingRider.phone.trim(),
        vehicleNumber: editingRider.vehicleNumber.toUpperCase().trim(),
        vehicleType: editingRider.vehicleType,
        deliveryRadius: parseFloat(editingRider.deliveryRadius?.toString() || '5.0'),
        roleName: 'DELIVERY_RIDER',
        propertyId: currentProperty?.id || null,
        password: editingRider.vehicleNumber.toUpperCase().trim(), // Set secure/fallback password
      };

      let res;
      if (isNewRider) {
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingRider.id, ...payload })
        });
      }

      const json = await res.json();
      if (json.success) {
        await fetchData();
        setEditingRider(null);
      } else {
        alert(json.error || json.message || 'Failed to save rider profile.');
      }
    } catch (err) {
      alert('Error saving rider.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (rider: Rider) => {
    if (!confirm(`Are you sure you want to ${rider.isActive ? 'block' : 'activate'} this rider?`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: rider.id, isActive: !rider.isActive })
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      } else {
        alert(json.error || 'Failed to update rider status.');
      }
    } catch {
      alert('Error updating status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rider profile permanently?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        await fetchData();
      } else {
        alert(json.error || 'Cannot delete rider due to order history. Try blocking them instead.');
      }
    } catch {
      alert('Error deleting rider.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRiders = riders.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.fullName.toLowerCase().includes(q) ||
      (r.phone || '').includes(q) ||
      (r.vehicleNumber || '').toLowerCase().includes(q)
    );
  });

  const totalRidersCash = filteredRiders.reduce((sum, r) => sum + (r.outstandingCash || 0), 0);

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
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Users size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">Manage Riders</h1>
            <p className="text-[9px] font-bold text-rose-300/70 uppercase tracking-[0.2em]">Rider Profile & Duty Log</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={fetchData}
            className="rounded-xl h-9 w-9 p-0 flex items-center justify-center bg-white/5 border-white/10">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
          <button
            onClick={() => { setEditingRider({ ...emptyRider }); setIsNewRider(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-rose-500/20"
          >
            <Plus size={14} /> Add Rider
          </button>
        </div>
      </div>

      {/* Total Outstanding Dues Stats Card */}
      {totalRidersCash > 0 && (
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20 rounded-3xl p-4 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 text-lg">
              💵
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-tight">Total Rider Cash In-Hand</h2>
              <p className="text-[8.5px] font-bold text-amber-400/80 uppercase tracking-wider mt-0.5">Manager needs to collect this cash from active riders</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-base font-black text-amber-400 font-mono">₹{totalRidersCash}</span>
            <span className="block text-[7.5px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Across {filteredRiders.filter(r => (r.outstandingCash || 0) > 0).length} riders</span>
          </div>
        </div>
      )}

      {/* Toolbar & Search */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
          <Search size={14} />
        </span>
        <input
          type="text"
          placeholder="Search riders by name, phone or vehicle plate..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-rose-500 outline-none text-xs font-bold transition-all"
        />
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="h-44 rounded-2xl bg-white/5 animate-pulse border border-white/5" />)}
        </div>
      ) : filteredRiders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-white font-black text-sm uppercase tracking-tight">No Riders Found</h3>
            <p className="text-slate-500 text-xs font-bold">Register a rider to assign and dispatch delivery orders.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRiders.map(rider => (
            <div key={rider.id} className={`bg-[#0d0f14]/80 border ${rider.isActive ? 'border-white/5' : 'border-red-500/20 opacity-60'} rounded-[2rem] p-5 space-y-4 hover:border-white/10 transition-all relative overflow-hidden group`}>
              
              {/* Top Row: initials & actions */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-rose-600 flex items-center justify-center text-white font-black text-xs uppercase shadow-md">
                    {rider.fullName.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white tracking-tight uppercase leading-none">{rider.fullName}</h3>
                    <p className="text-[9px] text-slate-500 font-bold mt-1 font-mono">{rider.phone || 'No phone'}</p>
                  </div>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingRider({ ...rider }); setIsNewRider(false); }}
                    className="w-7 h-7 bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-lg flex items-center justify-center transition-all">
                    <Edit3 size={11} />
                  </button>
                  <button onClick={() => handleDelete(rider.id)} disabled={deletingId === rider.id}
                    className="w-7 h-7 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-lg flex items-center justify-center transition-all">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              {/* Vehicle & Info Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Vehicle</span>
                  <p className="text-xs font-black text-white truncate uppercase font-mono">{rider.vehicleNumber || '—'}</p>
                  <p className="text-[7.5px] text-slate-500 font-bold mt-0.5">{VEHICLE_TYPE_LABELS[rider.vehicleType || 'BIKE']}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-2 border border-white/5">
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Radius</span>
                  <p className="text-xs font-black text-white font-mono">{rider.deliveryRadius || 5}km</p>
                  <p className="text-[7.5px] text-slate-500 font-bold mt-0.5">Search Limit</p>
                </div>
              </div>

              {/* Outstanding Cash display */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                (rider.outstandingCash || 0) > 0 
                  ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' 
                  : 'bg-white/5 border-white/5 text-slate-400'
              }`}>
                <div>
                  <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest block">Cash in Hand (Dues)</span>
                  <span className="text-[11px] font-extrabold font-mono mt-0.5 block">₹{rider.outstandingCash || 0}</span>
                </div>
                {(rider.outstandingCash || 0) > 0 ? (
                  <span className="text-[7.5px] font-black uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-500/30">Pending Handover</span>
                ) : (
                  <span className="text-[7.5px] font-black uppercase bg-white/5 text-slate-500 px-2 py-0.5 rounded-lg border border-white/5">All Clear</span>
                )}
              </div>

              {/* Status and Toggle */}
              <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${rider.dutyStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                  <span>Duty: {rider.dutyStatus === 'online' ? 'Online' : 'Offline'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-slate-500">Account:</span>
                  <button onClick={() => handleToggleStatus(rider)} className="transition-all hover:scale-105">
                    {rider.isActive ? (
                      <span className="text-[8.5px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        Active
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        Blocked
                      </span>
                    )}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* ── Cash Handovers Log Section ── */}
      <div className="bg-[#0d0f14]/85 border border-white/5 rounded-[2rem] p-6 space-y-4 mt-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tight">Rider Cash Handovers</h2>
            <p className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 font-sans">End-of-shift cash collections submitted by riders</p>
          </div>
          <button
            onClick={fetchHandovers}
            className="rounded-xl h-8 px-3 text-[8px] font-black uppercase bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all font-sans"
          >
            Refresh Logs
          </button>
        </div>

        {handoversLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="animate-spin text-slate-500 font-extrabold text-[10px]">⟳ LOADING HANDOVER LOGS...</span>
          </div>
        ) : handovers.length === 0 ? (
          <p className="text-center py-6 text-slate-500 text-[10px] uppercase font-bold tracking-wide font-sans">No cash handover logs submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px] font-bold uppercase tracking-wide">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-[8px] font-sans">
                  <th className="py-2.5">Rider</th>
                  <th className="py-2.5">Submitted At</th>
                  <th className="py-2.5 text-right">COD Expected</th>
                  <th className="py-2.5 text-right">Tips</th>
                  <th className="py-2.5 text-right">Handover Cash</th>
                  <th className="py-2.5 text-center">Status</th>
                  <th className="py-2.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-350">
                {handovers.map((h: any) => (
                  <tr key={h.id} className="hover:bg-white/5 transition-all">
                    <td className="py-3 font-black text-white">
                      <div>
                        {h.riderName}
                        <span className="block text-[8px] font-normal text-slate-500 font-mono mt-0.5">{h.riderPhone}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 font-mono text-[9px]">{new Date(h.submittedAt).toLocaleDateString('en-IN')} {new Date(h.submittedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 text-right font-mono text-slate-400">₹{h.totalCodAmount}</td>
                    <td className="py-3 text-right font-mono text-indigo-400">₹{h.totalTipAmount}</td>
                    <td className="py-3 text-right font-mono text-amber-400">₹{h.reportedCash}</td>
                    <td className="py-3 text-center">
                      <span className={`text-[7.5px] font-black px-2 py-0.5 rounded-lg border ${
                        h.status === 'PENDING' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                        : h.status === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {h.status === 'PENDING' ? (
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => handleResolveHandover(h.id, 'APPROVED')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[7.5px] font-black uppercase tracking-wider transition-all"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleResolveHandover(h.id, 'REJECTED')}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[7.5px] font-black uppercase tracking-wider transition-all"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[8px] text-slate-500 normal-case font-normal">Resolved by {h.resolvedBy || 'Admin'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal Drawer ────────────────────────────────────────── */}
      {editingRider && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setEditingRider(null)} />
          <div className="relative bg-[#0c0e14] border border-[#1e293b] rounded-t-[2.5rem] md:rounded-[2rem] w-full max-w-md p-7 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-black text-white uppercase tracking-tight">
                {isNewRider ? 'Register Rider' : 'Edit Rider Details'}
              </h2>
              <button onClick={() => setEditingRider(null)} className="w-8 h-8 rounded-lg bg-[#1e293b] flex items-center justify-center text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={editingRider.fullName || ''}
                  onChange={e => setEditingRider(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white focus:border-rose-500 outline-none text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Phone Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={editingRider.phone || ''}
                  onChange={e => setEditingRider(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                  className="w-full h-10 px-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white focus:border-rose-500 outline-none text-xs font-bold font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="e.g. DL3S-AB-1234"
                    value={editingRider.vehicleNumber || ''}
                    onChange={e => setEditingRider(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white focus:border-rose-500 outline-none text-xs font-bold uppercase font-mono tracking-wide"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Vehicle Type</label>
                  <select
                    value={editingRider.vehicleType || 'BIKE'}
                    onChange={e => setEditingRider(prev => ({ ...prev, vehicleType: e.target.value }))}
                    className="w-full h-10 px-3 rounded-xl bg-[#070b12] border border-[#1e293b] text-white focus:border-rose-500 outline-none text-xs font-bold"
                  >
                    <option value="BIKE">🏍️ Bike</option>
                    <option value="SCOOTER">🛵 Scooter</option>
                    <option value="CAR">🚗 Car</option>
                    <option value="BICYCLE">🚲 Bicycle</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Search Radius (km)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="0.5"
                    value={editingRider.deliveryRadius || 5.0}
                    onChange={e => setEditingRider(prev => ({ ...prev, deliveryRadius: parseFloat(e.target.value) }))}
                    className="flex-1 accent-rose-500 bg-[#070b12] h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-200 font-mono w-10 text-right">{editingRider.deliveryRadius || 5.0}km</span>
                </div>
              </div>

              {isNewRider && (
                <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-[9.5px] font-bold text-slate-500 leading-normal uppercase">
                  📌 Note: The rider will log in using their Phone Number & Vehicle Plate (Case-Insensitive) on 
                  <span className="text-slate-300 font-mono lowercase"> /driver-portal</span>. No email or password setup is required.
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <Button onClick={() => setEditingRider(null)} disabled={saving}
                  className="flex-1 h-11 bg-[#1e293b] hover:bg-[#28354c] text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#334155]/60">
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={saving}
                  className="flex-1 h-11 bg-rose-500 hover:bg-rose-400 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20">
                  <Save size={13} className="mr-1.5" />
                  {isNewRider ? 'Register' : 'Save Changes'}
                </Button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
