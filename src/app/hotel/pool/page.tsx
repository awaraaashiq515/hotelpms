'use client';

import React, { useState, useEffect } from 'react';
import {
  Waves,
  Plus,
  Droplets,
  Crown,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit3,
  Trash2,
  Search,
  Loader2,
  RefreshCw,
  X,
  Gift,
  ShieldCheck,
  Zap,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface PoolPassCategory {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  capacity: number;
  description?: string;
  includes?: string;
  isActive: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; icon: React.ReactNode }> = {
  STANDARD:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20',    icon: <Droplets size={16} /> },
  VIP_CABANA:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   icon: <Crown size={16} /> },
  FAMILY_PASS: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: <Users size={16} /> },
  SUNSET_PASS: { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20',  icon: <Sparkles size={16} /> },
};

const DEFAULT_POOL_PASSES: PoolPassCategory[] = [
  {
    id: 'default-1',
    name: 'Early Bird Morning Lap Pass',
    category: 'STANDARD',
    price: 350,
    duration: 'Morning Pass (6 AM - 10 AM)',
    capacity: 1,
    description: 'Refreshing early morning swim pass with access to steam room and complimentary detox tea.',
    includes: 'Olympic Pool Access, Detox Herbal Tea, High-Speed Shower & Steam Room',
    isActive: true,
  },
  {
    id: 'default-2',
    name: 'Standard Day Pool Pass',
    category: 'STANDARD',
    price: 500,
    duration: 'Full Day',
    capacity: 1,
    description: 'Access to main swimming pool, poolside loungers, and locker room facilities.',
    includes: 'Locker, Clean Towel, Pool Access, Shower Room',
    isActive: true,
  },
  {
    id: 'default-3',
    name: 'All-Day VIP Cabana Pass',
    category: 'VIP_CABANA',
    price: 1200,
    duration: 'Full Day',
    capacity: 2,
    description: 'Reserved private poolside cabana with cushioned sunbeds, premium towel service, and welcome drinks.',
    includes: 'Private Cabana, Sunbeds, Welcome Drinks, Premium Towels, Dedicated Server',
    isActive: true,
  },
  {
    id: 'default-4',
    name: 'Sunset Cocktail & Jacuzzi Pass',
    category: 'SUNSET_PASS',
    price: 1500,
    duration: 'Evening Pass (4 PM - 9 PM)',
    capacity: 2,
    description: 'Evening access to heated infinity pool and jacuzzi with complimentary signature cocktails and lounge music.',
    includes: 'Heated Jacuzzi Access, 2 Signature Poolside Cocktails, Evening DJ Lounge Access',
    isActive: true,
  },
  {
    id: 'default-5',
    name: 'Family Splash & Fun Pass',
    category: 'FAMILY_PASS',
    price: 1800,
    duration: 'Full Day',
    capacity: 4,
    description: 'Group pass for up to 2 adults and 2 kids with complimentary pool floats, snacks, and fresh fruit juices.',
    includes: '4 Pool Passes, Pool Floats & Toys, Welcome Juices, Fruit Basket, Lockers',
    isActive: true,
  },
  {
    id: 'default-6',
    name: 'Weekend Royal Luxury Pool Suite Pass',
    category: 'VIP_CABANA',
    price: 2500,
    duration: 'Full Day (Weekend Special)',
    capacity: 3,
    description: 'Ultimate luxury experience featuring an exclusive pool suite, gourmet snacks, and dedicated butler service.',
    includes: 'Luxury AC Cabana Suite, Champagne Flutes, Gourmet Snack Platter, Butler Service',
    isActive: true,
  },
];

export default function SwimmingPoolPage() {
  const [passes, setPasses] = useState<PoolPassCategory[]>(DEFAULT_POOL_PASSES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPass, setEditingPass] = useState<PoolPassCategory | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('STANDARD');
  const [price, setPrice] = useState('500');
  const [duration, setDuration] = useState('Full Day');
  const [capacity, setCapacity] = useState('1');
  const [description, setDescription] = useState('');
  const [includes, setIncludes] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/pool-passes');
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setPasses(data.data);
      } else {
        setPasses(DEFAULT_POOL_PASSES);
      }
    } catch {
      setPasses(DEFAULT_POOL_PASSES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const openCreateModal = () => {
    setEditingPass(null);
    setName('');
    setCategory('STANDARD');
    setPrice('500');
    setDuration('Full Day');
    setCapacity('1');
    setDescription('');
    setIncludes('Locker, Clean Towel, Pool Access, Shower Room');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (pass: PoolPassCategory) => {
    setEditingPass(pass);
    setName(pass.name);
    setCategory(pass.category);
    setPrice(pass.price.toString());
    setDuration(pass.duration);
    setCapacity(pass.capacity.toString());
    setDescription(pass.description || '');
    setIncludes(pass.includes || '');
    setIsActive(pass.isActive);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      toast.error('Pass Name and Price are required.');
      return;
    }

    setSaving(true);
    try {
      const isEdit = !!editingPass;
      const method = isEdit ? 'PATCH' : 'POST';
      const payload = {
        ...(isEdit ? { id: editingPass.id } : {}),
        name,
        category,
        price: Number(price),
        duration,
        capacity: Number(capacity),
        description,
        includes,
        isActive,
      };

      const res = await fetch('/api/hotel/pool-passes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEdit ? 'Pool Pass Category updated!' : 'New Pool Pass Category created!');
        setShowModal(false);
        fetchPasses();
      } else {
        toast.error(data.message || 'Failed to save pool pass.');
      }
    } catch {
      toast.error('Connection error saving pool pass.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, passName: string) => {
    if (!confirm(`Are you sure you want to delete "${passName}"?`)) return;
    try {
      const res = await fetch(`/api/hotel/pool-passes?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${passName}" deleted successfully.`);
        fetchPasses();
      } else {
        toast.error(data.message || 'Failed to delete pool pass.');
      }
    } catch {
      toast.error('Error deleting pool pass category.');
    }
  };

  const togglePassStatus = async (pass: PoolPassCategory) => {
    try {
      const res = await fetch('/api/hotel/pool-passes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: pass.id, isActive: !pass.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Pool pass ${!pass.isActive ? 'activated' : 'deactivated'}.`);
        fetchPasses();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error('Failed to toggle status.');
    }
  };

  const filteredPasses = passes.filter((p) => {
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-black uppercase tracking-widest">
            <Waves size={16} /> Swimming Pool & Cabanas
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight mt-1">Pool Pass Categories</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure custom swimming pool pass passes, VIP cabana privileges, pricing, and guest entitlements.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPasses}
            className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-cyan-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Add Pool Pass Category
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#0f172a]/50 border border-cyan-500/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400">
            <Waves size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Categories</p>
            <h3 className="text-xl font-black text-cyan-300 mt-0.5">{passes.filter(p => p.isActive).length} Passes</h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0f172a]/50 border border-amber-500/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
            <Crown size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">VIP Cabana Passes</p>
            <h3 className="text-xl font-black text-amber-300 mt-0.5">{passes.filter(p => p.category === 'VIP_CABANA').length} Available</h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0f172a]/50 border border-emerald-500/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Standard Fee</p>
            <h3 className="text-xl font-black text-emerald-300 mt-0.5">₹{passes[0]?.price || 500} / Pass</h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#0f172a]/50 border border-purple-500/20 flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Included Perks</p>
            <h3 className="text-xl font-black text-purple-300 mt-0.5">Towel & Lockers</h3>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pool passes by name or category..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-cyan-400 font-extrabold">{filteredPasses.length}</span> categories
        </div>
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="h-[40vh] flex items-center justify-center">
          <div className="text-center space-y-2">
            <Loader2 className="animate-spin text-cyan-400 mx-auto" size={32} />
            <p className="text-xs text-slate-500 font-medium">Loading pool pass categories...</p>
          </div>
        </div>
      ) : filteredPasses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-[#0f172a]/30 border border-slate-800/80 space-y-3">
          <Droplets className="text-slate-600 mx-auto" size={40} />
          <h3 className="text-base font-bold text-slate-300">No Pool Pass Categories Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Click "Add Pool Pass Category" above to create your first custom swimming pool pass.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPasses.map((pass) => {
            const style = CATEGORY_COLORS[pass.category] || CATEGORY_COLORS.STANDARD;
            const inclusionsList = pass.includes ? pass.includes.split(',').map(s => s.trim()) : [];

            return (
              <div
                key={pass.id}
                className={`p-6 rounded-3xl bg-[#0f172a]/60 border transition-all hover:border-slate-700 flex flex-col justify-between space-y-5 relative overflow-hidden ${
                  pass.isActive ? 'border-slate-800/80' : 'border-slate-800/40 opacity-60'
                }`}
              >
                {/* Card Top */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.bg} ${style.text} ${style.border}`}>
                      {style.icon} {pass.category.replace('_', ' ')}
                    </span>

                    <button
                      onClick={() => togglePassStatus(pass)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                        pass.isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                          : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {pass.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight">{pass.name}</h3>
                    {pass.description && (
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">{pass.description}</p>
                    )}
                  </div>

                  {/* Price & Specs */}
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/60 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Pass Rate</p>
                      <p className="text-xl font-black text-cyan-300 mt-0.5">₹{pass.price.toLocaleString()}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400">
                        <Clock size={12} className="text-cyan-400" /> {pass.duration}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-slate-400">
                        <Users size={12} className="text-cyan-400" /> Max {pass.capacity} Guest{pass.capacity > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Inclusions List */}
                  {inclusionsList.length > 0 && (
                    <div className="space-y-2 border-t border-slate-800/60 pt-3">
                      <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Includes & Privileges</p>
                      <div className="flex flex-wrap gap-1.5">
                        {inclusionsList.map((inc, i) => (
                          <span key={i} className="flex items-center gap-1 text-[9px] font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-lg">
                            <CheckCircle2 size={10} className="text-cyan-400" /> {inc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 mt-2">
                  <span className="text-[9px] text-slate-500 font-mono">ID: {pass.id.slice(-6)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(pass)}
                      className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
                      title="Edit Category"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(pass.id, pass.name)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all text-xs flex items-center gap-1 cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Pool Pass Category Modal ────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="relative bg-[#0f172a] border border-slate-700/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
                  <Waves size={18} />
                </span>
                <h3 className="font-black text-white text-sm uppercase tracking-wider">
                  {editingPass ? 'Edit Pool Pass Category' : 'Create New Pool Pass Category'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pass Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Standard Pool Pass, Sunset Jacuzzi Pass"
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 transition-colors font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category Type</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none focus:border-cyan-500 font-semibold"
                  >
                    <option value="STANDARD">Standard Pool Pass</option>
                    <option value="VIP_CABANA">VIP Cabana Pass</option>
                    <option value="FAMILY_PASS">Family Pool Pass</option>
                    <option value="SUNSET_PASS">Sunset & Jacuzzi Pass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Price / Charge (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-cyan-300 font-mono font-bold text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pass Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. Full Day, 3 Hours, Evening Slot"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Max Guest Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Included Privileges (Comma Separated)</label>
                <input
                  type="text"
                  value={includes}
                  onChange={(e) => setIncludes(e.target.value)}
                  placeholder="e.g. Private Cabana, Sunbeds, Welcome Drinks, Lockers, Towels"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pass Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of pool access and rules..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-955 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Active Status</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                    isActive ? 'bg-cyan-500 text-cyan-955' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </button>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl bg-cyan-500 hover:bg-cyan-400 text-cyan-955 font-black transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {saving ? <Loader2 className="animate-spin" size={14} /> : editingPass ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
