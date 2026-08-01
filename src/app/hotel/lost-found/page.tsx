'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Search, Plus, Package, CheckCircle2, Clock, Trash2, X, Phone, UserCheck, RefreshCw } from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface LostItem {
  id: string;
  item: string;
  description: string;
  foundAt: string;
  room: string;
  foundBy: string;
  status: 'FOUND' | 'CLAIMED' | 'DISPOSED';
  guestContact?: string;
  claimedBy?: string;
  claimedAt?: string;
  notes?: string;
}

const STATUS_STYLE: Record<string, string> = {
  FOUND:    'text-amber-300 bg-amber-500/10 border-amber-500/20',
  CLAIMED:  'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  DISPOSED: 'text-slate-400 bg-slate-800 border-slate-700',
};

export default function LostFoundPage() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FOUND' | 'CLAIMED' | 'DISPOSED'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New item state
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemRoom, setNewItemRoom] = useState('');
  const [newItemFoundBy, setNewItemFoundBy] = useState('');
  const [newItemContact, setNewItemContact] = useState('');

  // Claim modal state
  const [claimingItem, setClaimingItem] = useState<LostItem | null>(null);
  const [claimGuestContact, setClaimGuestContact] = useState('');
  const [claimGuestName, setClaimGuestName] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/lost-found');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const formatted: LostItem[] = json.data.map((i: any) => ({
          id: i.id,
          item: i.item,
          description: i.description || '',
          room: i.room || 'N/A',
          foundBy: i.foundBy || 'Staff',
          foundAt: i.foundAt ? new Date(i.foundAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN'),
          status: i.status || 'FOUND',
          guestContact: i.guestContact || '',
          claimedBy: i.claimedBy || '',
          claimedAt: i.claimedAt ? new Date(i.claimedAt).toLocaleString('en-IN') : '',
          notes: i.notes || '',
        }));
        setItems(formatted);
      } else {
        toast.error(json.message || 'Failed to load lost & found items');
      }
    } catch {
      toast.error('Network error loading lost & found items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) {
      toast.error('Item name is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item: newItemName,
          description: newItemDesc,
          room: newItemRoom,
          foundBy: newItemFoundBy,
          guestContact: newItemContact,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Lost item logged successfully!');
        setNewItemName('');
        setNewItemDesc('');
        setNewItemRoom('');
        setNewItemFoundBy('');
        setNewItemContact('');
        setShowForm(false);
        fetchItems();
      } else {
        toast.error(json.message || 'Failed to log item');
      }
    } catch {
      toast.error('Network error logging item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkClaimed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingItem) return;
    setClaimSubmitting(true);
    try {
      const res = await fetch('/api/hotel/lost-found', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: claimingItem.id,
          status: 'CLAIMED',
          guestContact: claimGuestContact,
          claimedBy: claimGuestName,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Item "${claimingItem.item}" marked as CLAIMED!`);
        setClaimingItem(null);
        setClaimGuestContact('');
        setClaimGuestName('');
        fetchItems();
      } else {
        toast.error(json.message || 'Failed to update status');
      }
    } catch {
      toast.error('Error updating status');
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleMarkDisposed = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to mark "${itemName}" as DISPOSED?`)) return;
    try {
      const res = await fetch('/api/hotel/lost-found', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'DISPOSED' }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Item "${itemName}" marked as DISPOSED`);
        fetchItems();
      } else {
        toast.error(json.message || 'Failed to update status');
      }
    } catch {
      toast.error('Network error updating status');
    }
  };

  const handleDeleteItem = async (id: string, itemName: string) => {
    if (!confirm(`Permanently delete "${itemName}" from registry?`)) return;
    try {
      const res = await fetch(`/api/hotel/lost-found?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Item deleted');
        fetchItems();
      } else {
        toast.error(json.message || 'Failed to delete item');
      }
    } catch {
      toast.error('Network error deleting item');
    }
  };

  const filteredItems = items
    .filter(i => statusFilter === 'ALL' || i.status === statusFilter)
    .filter(i => !search || i.item.toLowerCase().includes(search.toLowerCase()) || i.room.toLowerCase().includes(search.toLowerCase()) || i.foundBy.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    found: items.filter(i => i.status === 'FOUND').length,
    claimed: items.filter(i => i.status === 'CLAIMED').length,
    disposed: items.filter(i => i.status === 'DISPOSED').length,
  };

  return (
    <div className="space-y-6 pb-10 max-w-[1200px] mx-auto px-4 sm:px-6">
      <Toaster position="top-right" theme="dark" />

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={14} className="text-pink-400" />
            <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest">Operations · Lost & Found</span>
          </div>
          <h1 className="text-2xl font-black text-white">Lost & Found Registry</h1>
          <p className="text-xs text-slate-400 mt-0.5">{counts.found} unclaimed item{counts.found === 1 ? '' : 's'} registered</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchItems} disabled={loading}
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-600/20 transition-all">
            <Plus size={14} /> Log Item
          </button>
        </div>
      </div>

      {/* Log New Item Form Modal / Drawer */}
      {showForm && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-pink-500/30 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Package size={16} className="text-pink-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Log New Found Item</h3>
            </div>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Item Name *</label>
              <input required value={newItemName} onChange={e => setNewItemName(e.target.value)}
                placeholder="e.g. iPhone 15, Leather Wallet"
                className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Room / Location</label>
              <input value={newItemRoom} onChange={e => setNewItemRoom(e.target.value)}
                placeholder="e.g. Room 204 or Lobby"
                className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Found By</label>
              <input value={newItemFoundBy} onChange={e => setNewItemFoundBy(e.target.value)}
                placeholder="e.g. Housekeeper Sunita"
                className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Description</label>
              <input value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)}
                placeholder="e.g. Black case, cracked screen edge"
                className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Guest Phone / Contact (Optional)</label>
              <input value={newItemContact} onChange={e => setNewItemContact(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500" />
            </div>

            <div className="flex items-end">
              <button type="submit" disabled={submitting}
                className="w-full h-9 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50">
                {submitting ? 'Saving…' : 'Save to Registry'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Found (Unclaimed)', value: counts.found,    color: 'text-amber-300 border-amber-500/20 bg-amber-900/20' },
          { label: 'Claimed',            value: counts.claimed,  color: 'text-emerald-300 border-emerald-500/20 bg-emerald-900/20' },
          { label: 'Disposed',           value: counts.disposed, color: 'text-slate-400 border-slate-700 bg-slate-800/40' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.color}`}>
            <p className="text-3xl font-black text-white">{s.value}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search item, room, found by staff…"
            className="w-full h-9 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {['ALL', 'FOUND', 'CLAIMED', 'DISPOSED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s as any)}
              className={`px-3 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors shrink-0 ${statusFilter === s ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                {['Item','Description','Room','Found By','Found At','Status','Guest Contact / Claim','Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-xs text-slate-500">
                    <RefreshCw size={18} className="animate-spin inline-block mb-2 text-pink-400" />
                    <p>Loading lost & found items from database…</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-xs text-slate-500">
                    No items found matching filter criteria
                  </td>
                </tr>
              ) : filteredItems.map(item => (
                <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-pink-400 shrink-0" />
                      <span className="text-xs font-black text-white">{item.item}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300 max-w-[180px] truncate">{item.description || '—'}</td>
                  <td className="px-4 py-3 text-xs text-pink-300 font-mono font-bold">{item.room || 'N/A'}</td>
                  <td className="px-4 py-3 text-xs text-slate-300">{item.foundBy}</td>
                  <td className="px-4 py-3 text-[10px] text-slate-400 whitespace-nowrap">{item.foundAt}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${STATUS_STYLE[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {item.status === 'CLAIMED' ? (
                      <div className="space-y-0.5">
                        {item.claimedBy && <p className="text-[11px] font-bold text-emerald-400">Claimed by: {item.claimedBy}</p>}
                        {item.guestContact && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Phone size={10}/> {item.guestContact}</p>}
                      </div>
                    ) : item.guestContact ? (
                      <span className="text-[10px] text-slate-300 flex items-center gap-1"><Phone size={10}/> {item.guestContact}</span>
                    ) : (
                      <span className="text-slate-600 text-[10px]">Unclaimed</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.status === 'FOUND' && (
                        <>
                          <button onClick={() => { setClaimingItem(item); setClaimGuestContact(item.guestContact || ''); }}
                            className="flex items-center gap-1 text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/20 transition-all">
                            <UserCheck size={11} /> Mark Claimed
                          </button>
                          <button onClick={() => handleMarkDisposed(item.id, item.item)}
                            className="text-[10px] font-bold text-slate-400 hover:text-slate-300 uppercase tracking-wider bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition-all">
                            Dispose
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDeleteItem(item.id, item.item)} title="Delete item"
                        className="text-slate-500 hover:text-red-400 p-1 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Claim Modal */}
      {claimingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck size={16} className="text-emerald-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Mark Item as Claimed</h3>
              </div>
              <button onClick={() => setClaimingItem(null)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Register guest claim details for item: <strong className="text-emerald-400">{claimingItem.item}</strong> (Room {claimingItem.room})
            </p>

            <form onSubmit={handleMarkClaimed} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Claimant / Guest Name</label>
                <input value={claimGuestName} onChange={e => setClaimGuestName(e.target.value)}
                  placeholder="e.g. Mr. Rajesh Sharma"
                  className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Guest Contact / Phone Number</label>
                <input value={claimGuestContact} onChange={e => setClaimGuestContact(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full h-9 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setClaimingItem(null)}
                  className="flex-1 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={claimSubmitting}
                  className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50">
                  {claimSubmitting ? 'Saving…' : 'Confirm Claimed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
