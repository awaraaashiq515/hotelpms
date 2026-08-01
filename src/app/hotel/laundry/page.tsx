'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Shirt, Plus, Search, Clock, CheckCircle2, Package, RefreshCw, Trash2, X, DollarSign, UserCheck } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface LaundryItem {
  id: string;
  roomNumber: string;
  guestName: string;
  itemsCount: number;
  amount: number;
  status: 'COLLECTED' | 'IN_LAUNDRY' | 'READY' | 'DELIVERED';
  collectedBy?: string;
  collectedAt: string;
  deliveredAt?: string | null;
  notes?: string;
}

const STATUS_STYLE: Record<string, string> = {
  COLLECTED:  'text-blue-300 bg-blue-500/10 border-blue-500/20',
  IN_LAUNDRY: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  READY:      'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  DELIVERED:  'text-slate-400 bg-slate-800 border-slate-700',
};

const NEXT_STATUS: Record<string, 'IN_LAUNDRY' | 'READY' | 'DELIVERED'> = {
  COLLECTED:  'IN_LAUNDRY',
  IN_LAUNDRY: 'READY',
  READY:      'DELIVERED',
};

const ACTION_LABEL: Record<string, string> = {
  COLLECTED:  'Send to Laundry',
  IN_LAUNDRY: 'Mark Ready',
  READY:      'Mark Delivered',
};

export default function LaundryPage() {
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Request Form state
  const [newRoom, setNewRoom] = useState('');
  const [newGuest, setNewGuest] = useState('');
  const [newCount, setNewCount] = useState(1);
  const [newAmount, setNewAmount] = useState(150);
  const [newNotes, setNewNotes] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/laundry');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const formatted: LaundryItem[] = json.data.map((i: any) => ({
          id: i.id,
          roomNumber: i.roomNumber || 'N/A',
          guestName: i.guestName || 'In-House Guest',
          itemsCount: i.itemsCount || 1,
          amount: i.amount || 0,
          status: i.status || 'COLLECTED',
          collectedBy: i.collectedBy || 'Staff',
          collectedAt: i.collectedAt || i.createdAt ? new Date(i.collectedAt || i.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
          deliveredAt: i.deliveredAt ? new Date(i.deliveredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null,
          notes: i.notes || '',
        }));
        setItems(formatted);
      } else {
        toast.error(json.message || 'Failed to load laundry records');
      }
    } catch {
      toast.error('Network error loading laundry records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom) {
      toast.error('Room number is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/laundry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: newRoom,
          guestName: newGuest || 'In-House Guest',
          itemsCount: newCount,
          amount: newAmount,
          notes: newNotes,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Laundry request for Room ${newRoom} created!`);
        setNewRoom('');
        setNewGuest('');
        setNewCount(1);
        setNewAmount(150);
        setNewNotes('');
        setShowForm(false);
        fetchItems();
      } else {
        toast.error(json.message || 'Failed to create request');
      }
    } catch {
      toast.error('Network error creating laundry request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;
    try {
      const res = await fetch('/api/hotel/laundry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Status updated to ${nextStatus.replace('_', ' ')}!`);
        fetchItems();
      } else {
        toast.error(json.message || 'Failed to update status');
      }
    } catch {
      toast.error('Error updating status');
    }
  };

  const handleDeleteRequest = async (id: string, room: string) => {
    if (!confirm(`Delete laundry request for Room ${room}?`)) return;
    try {
      const res = await fetch(`/api/hotel/laundry?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Laundry request deleted');
        fetchItems();
      } else {
        toast.error(json.message || 'Failed to delete request');
      }
    } catch {
      toast.error('Network error deleting request');
    }
  };

  const filteredItems = items
    .filter(i => statusFilter === 'ALL' || i.status === statusFilter)
    .filter(i => !search || i.roomNumber.toLowerCase().includes(search.toLowerCase()) || i.guestName.toLowerCase().includes(search.toLowerCase()));

  const stats = {
    collected:   items.filter(l => l.status === 'COLLECTED').length,
    inLaundry:   items.filter(l => l.status === 'IN_LAUNDRY').length,
    ready:       items.filter(l => l.status === 'READY').length,
    delivered:   items.filter(l => l.status === 'DELIVERED').length,
    totalAmount: items.reduce((s, l) => s + (l.amount || 0), 0),
  };

  return (
    <div className="space-y-6 pb-10 max-w-[1200px] mx-auto px-4 sm:px-6">
      <Toaster position="top-right" theme="dark" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shirt size={14} className="text-teal-400" />
            <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Operations · Laundry</span>
          </div>
          <h1 className="text-2xl font-black text-white">Laundry Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">{items.length} total laundry request{items.length === 1 ? '' : 's'} registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchItems} disabled={loading}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/20 transition-all">
            <Plus size={14} /> New Request
          </button>
        </div>
      </div>

      {/* New Request Modal / Drawer */}
      {showForm && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Shirt size={16} className="text-teal-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Log Laundry Request</h3>
            </div>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateRequest} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Room Number *</label>
              <input required value={newRoom} onChange={e => setNewRoom(e.target.value)}
                placeholder="e.g. 204"
                className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Guest Name</label>
              <input value={newGuest} onChange={e => setNewGuest(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Items Count</label>
              <input type="number" min={1} value={newCount} onChange={e => {
                const count = parseInt(e.target.value) || 1;
                setNewCount(count);
                setNewAmount(count * 150);
              }}
                className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Amount (₹)</label>
              <input type="number" min={0} value={newAmount} onChange={e => setNewAmount(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500" />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Notes / Instructions</label>
              <input value={newNotes} onChange={e => setNewNotes(e.target.value)}
                placeholder="e.g. Express service requested, dry clean suit jacket"
                className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500" />
            </div>

            <div className="flex items-end">
              <button type="submit" disabled={submitting}
                className="w-full h-9 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50">
                {submitting ? 'Logging…' : 'Log Request'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Collected',   value: stats.collected,  color: 'text-blue-300 border-blue-500/20 bg-blue-900/20', filter: 'COLLECTED' },
          { label: 'In Laundry',  value: stats.inLaundry,  color: 'text-amber-300 border-amber-500/20 bg-amber-900/20', filter: 'IN_LAUNDRY' },
          { label: 'Ready',       value: stats.ready,      color: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20', filter: 'READY' },
          { label: 'Delivered',   value: stats.delivered,  color: 'text-slate-400 border-slate-700 bg-slate-800/40', filter: 'DELIVERED' },
          { label: 'Total Revenue', value: `₹${stats.totalAmount.toLocaleString('en-IN')}`, color: 'text-teal-300 border-teal-500/20 bg-teal-900/20', filter: 'ALL' },
        ].map(s => (
          <div key={s.label} onClick={() => setStatusFilter(s.filter)}
            className={`rounded-2xl border p-4 cursor-pointer hover:scale-[1.02] transition-transform ${s.color} ${statusFilter === s.filter ? 'ring-2 ring-teal-400' : ''}`}>
            <p className="text-2xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search room or guest…"
            className="w-full h-9 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500" />
        </div>

        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'COLLECTED', 'IN_LAUNDRY', 'READY', 'DELIVERED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 ${statusFilter === s ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Laundry Cards */}
      {loading ? (
        <div className="text-center py-16 rounded-2xl bg-slate-900/50 border border-white/5">
          <RefreshCw size={24} className="animate-spin text-teal-400 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-bold">Loading laundry records from database…</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 rounded-2xl bg-slate-900/50 border border-white/5 text-slate-500 text-xs font-bold">
          No laundry items found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredItems.map(l => (
            <div key={l.id} className="rounded-2xl bg-slate-900/50 border border-white/5 p-4 hover:border-teal-500/30 transition-colors relative group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/20 flex items-center justify-center shrink-0">
                    <Shirt size={16} className="text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Room {l.roomNumber}</p>
                    <p className="text-[10px] font-medium text-slate-400">{l.guestName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${STATUS_STYLE[l.status]}`}>
                    {l.status.replace('_', ' ')}
                  </span>
                  <button onClick={() => handleDeleteRequest(l.id, l.roomNumber)} title="Delete request"
                    className="text-slate-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5 my-2">
                <div>
                  <p className="text-sm font-black text-white">{l.itemsCount}</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Items</p>
                </div>
                <div>
                  <p className="text-sm font-black text-teal-300">₹{l.amount}</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Amount</p>
                </div>
                <div>
                  <p className="text-xs font-black text-slate-200">{l.collectedAt || '—'}</p>
                  <p className="text-[8px] font-bold text-slate-500 uppercase">Collected</p>
                </div>
              </div>

              {l.collectedBy && (
                <p className="text-[9px] text-slate-500 font-medium mb-3">Collected by: <span className="text-slate-300 font-bold">{l.collectedBy}</span></p>
              )}

              {l.notes && (
                <p className="text-[10px] text-amber-300/80 bg-amber-500/10 border border-amber-500/15 rounded-lg px-2.5 py-1 mb-3 truncate">
                  Notes: {l.notes}
                </p>
              )}

              {l.status !== 'DELIVERED' && (
                <button onClick={() => handleUpdateStatus(l.id, l.status)}
                  className="w-full h-8 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[9px] font-black uppercase tracking-wider transition-all shadow-md shadow-teal-600/10">
                  {ACTION_LABEL[l.status]}
                </button>
              )}

              {l.status === 'DELIVERED' && l.deliveredAt && (
                <div className="text-center py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">
                    ✓ Delivered at {l.deliveredAt}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
