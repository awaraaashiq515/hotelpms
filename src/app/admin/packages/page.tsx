'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  Building2,
  ShieldCheck,
  LayoutGrid,
  Sparkles,
  Tag,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  Boxes,
  Zap,
  Calendar,
  CalendarX,
} from 'lucide-react';

// ─── Feature definitions ─────────────────────────────────────────────────────
const ALL_FEATURES = [
  { key: 'POS', label: 'Point of Sale', description: 'Billing, orders, KOT', icon: '🛒' },
  { key: 'HMS', label: 'Hotel Management', description: 'Rooms, check-ins, folios', icon: '🏨' },
  { key: 'INVENTORY', label: 'Inventory', description: 'Stock, warehouses, purchases', icon: '📦' },
  { key: 'REPORTS', label: 'Reports & Analytics', description: 'Sales, revenue, dashboard', icon: '📊' },
  { key: 'DRIVERS', label: 'Driver Management', description: 'Drivers, gifts, offers', icon: '🚗' },
  { key: 'STAFF', label: 'Staff Members', description: 'Staff profiles, salaries', icon: '👥' },
  { key: 'WEBSITE', label: 'Website CMS', description: 'Blogs, gallery, sliders', icon: '🌐' },
  { key: 'GST', label: 'GST Filing', description: 'GSTR-1, GSTR-3B filings', icon: '📋' },
  { key: 'OFFERS', label: 'Offers & Rewards', description: 'Driver reward campaigns', icon: '🎁' },
  { key: 'ACCOUNTING', label: 'Accounting', description: 'Vouchers, receipts, payments', icon: '💰' },
  { key: 'TABLES', label: 'Table Management', description: 'Floor maps, table reservations', icon: '🪑' },
  { key: 'TABLETS', label: 'Tablet / Waiter App', description: 'Tablet POS & waiter mode', icon: '📱' },
];

// ─── Module/Action permission combos ─────────────────────────────────────────
const ALL_MODULES = [
  { module: 'orders', actions: ['read', 'create', 'update', 'delete'] },
  { module: 'products', actions: ['read', 'create', 'update', 'delete'] },
  { module: 'inventory', actions: ['read', 'create', 'update', 'delete'] },
  { module: 'reports', actions: ['read'] },
  { module: 'users', actions: ['read', 'create', 'update', 'delete'] },
  { module: 'payments', actions: ['read', 'create'] },
  { module: 'expenses', actions: ['read', 'create', 'update', 'delete'] },
  { module: 'guests', actions: ['read', 'create', 'update'] },
  { module: 'reservations', actions: ['read', 'create', 'update', 'delete'] },
  { module: 'staff', actions: ['read', 'create', 'update', 'delete'] },
];

const ACCENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#0ea5e9', '#ef4444', '#14b8a6',
];

type Feature = { id: string; feature: string };
type Permission = { id: string; module: string; action: string };
type Pkg = {
  id: string;
  name: string;
  description: string | null;
  discountPercent: number;
  isActive: boolean;
  color: string | null;
  features: Feature[];
  permissions: Permission[];
  _count: { organizations: number };
  createdAt: string;
};

// ─── Empty form state ─────────────────────────────────────────────────────────
const emptyForm = () => ({
  name: '',
  description: '',
  discountPercent: 0,
  isActive: true,
  color: '#6366f1',
  features: [] as string[],
  permissions: [] as { module: string; action: string }[],
});

// ─── Package Card ─────────────────────────────────────────────────────────────
function PackageCard({
  pkg,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  pkg: Pkg;
  onEdit: (p: Pkg) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, v: boolean) => void;
}) {
  const color = pkg.color || '#6366f1';
  const featureKeys = pkg.features.map((f) => f.feature);

  return (
    <div
      className="relative rounded-3xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
      style={{ borderTop: `4px solid ${color}` }}
    >
      {/* Active badge */}
      <div className="absolute top-4 right-4">
        {pkg.isActive ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800">
            <CheckCircle2 size={10} /> Active
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest">
            <XCircle size={10} /> Inactive
          </span>
        )}
      </div>

      <div className="p-7">
        {/* Icon + Name */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
            style={{ background: `linear-gradient(135deg, ${color}dd, ${color}88)` }}
          >
            <Boxes className="text-white" size={22} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{pkg.name}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">{pkg.description || 'No description'}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 text-center transition-colors">
            <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors">{pkg.discountPercent}%</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 transition-colors">Discount</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 text-center transition-colors">
            <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors">{featureKeys.length}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 transition-colors">Features</p>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 text-center transition-colors">
            <p className="text-2xl font-black text-slate-900 dark:text-white transition-colors">{pkg._count.organizations}</p>
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 transition-colors">Orgs</p>
          </div>
        </div>

        {/* Feature chips */}
        <div className="flex flex-wrap gap-1.5 mb-6 min-h-[28px]">
          {featureKeys.slice(0, 6).map((f) => {
            const def = ALL_FEATURES.find((x) => x.key === f);
            return (
              <span
                key={f}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                style={{ background: `${color}18`, borderColor: `${color}40`, color }}
              >
                {def?.icon} {def?.label || f}
              </span>
            );
          })}
          {featureKeys.length > 6 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
              +{featureKeys.length - 6} more
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onEdit(pkg)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            onClick={() => onToggleActive(pkg.id, !pkg.isActive)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all border"
            style={{ borderColor: `${color}40`, color, background: `${color}10` }}
          >
            {pkg.isActive ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
            {pkg.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete(pkg.id)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 border border-slate-200 dark:border-slate-700 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Package Form Modal ───────────────────────────────────────────────────────
function PackageFormModal({
  isOpen,
  onClose,
  onSave,
  editing,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ReturnType<typeof emptyForm>) => Promise<void>;
  editing: Pkg | null;
}) {
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name,
        description: editing.description || '',
        discountPercent: editing.discountPercent,
        isActive: editing.isActive,
        color: editing.color || '#6366f1',
        features: editing.features.map((f) => f.feature),
        permissions: editing.permissions.map((p) => ({ module: p.module, action: p.action })),
      });
    } else {
      setForm(emptyForm());
    }
  }, [editing, isOpen]);

  const toggleFeature = (key: string) => {
    setForm((f) => ({
      ...f,
      features: f.features.includes(key) ? f.features.filter((x) => x !== key) : [...f.features, key],
    }));
  };

  const togglePermission = (module: string, action: string) => {
    const exists = form.permissions.some((p) => p.module === module && p.action === action);
    setForm((f) => ({
      ...f,
      permissions: exists
        ? f.permissions.filter((p) => !(p.module === module && p.action === action))
        : [...f.permissions, { module, action }],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${form.color}dd, ${form.color}88)` }}
              >
                <Package className="text-white" size={18} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {editing ? 'Edit Package' : 'Create New Package'}
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  {editing ? `Editing "${editing.name}"` : 'Configure features, permissions & discount'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-7">
          {/* Basic Info */}
          <section>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Tag size={12} /> Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Package Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Starter, Pro, Enterprise"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Brief description of this package..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    <Percent size={13} className="inline mr-1" />Discount %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.discountPercent}
                    onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Accent Color</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ACCENT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setForm({ ...form, color: c })}
                        className="w-7 h-7 rounded-full border-2 transition-all"
                        style={{
                          background: c,
                          borderColor: form.color === c ? '#fff' : c,
                          boxShadow: form.color === c ? `0 0 0 3px ${c}` : 'none',
                          transform: form.color === c ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                    ))}
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-7 h-7 rounded-full cursor-pointer border-2 border-slate-200"
                      title="Custom color"
                    />
                  </div>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Active Status</p>
                  <p className="text-xs text-slate-400 mt-0.5">Inactive packages cannot be assigned to organizations</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isActive: !form.isActive })}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${form.isActive ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors">
              <LayoutGrid size={12} /> Module Access
              <span className="ml-auto normal-case font-bold text-pos-primary">{form.features.length} / {ALL_FEATURES.length} selected</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {ALL_FEATURES.map((feat) => {
                const checked = form.features.includes(feat.key);
                return (
                  <button
                    key={feat.key}
                    type="button"
                    onClick={() => toggleFeature(feat.key)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 text-left transition-all duration-200 ${
                      checked
                        ? 'bg-pos-primary/10 border-pos-primary dark:bg-pos-primary/20 dark:border-pos-primary/60'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-xl leading-none">{feat.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${checked ? 'text-pos-primary dark:text-pos-primary-light' : 'text-slate-700 dark:text-slate-300'}`}>
                        {feat.label}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{feat.description}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-pos-primary border-pos-primary' : 'border-slate-300 dark:border-slate-600'}`}>
                      {checked && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Permissions */}
          <section>
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors">
              <ShieldCheck size={12} /> Granular Permissions
              <span className="ml-auto normal-case font-bold text-pos-primary">{form.permissions.length} granted</span>
            </h3>
            <div className="space-y-2">
              {ALL_MODULES.map((mod) => {
                const modPerms = form.permissions.filter((p) => p.module === mod.module);
                const isExpanded = expandedModule === mod.module;
                const allChecked = mod.actions.every((a) => modPerms.some((p) => p.action === a));

                return (
                  <div key={mod.module} className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedModule(isExpanded ? null : mod.module)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Select all for module */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const newPerms = form.permissions.filter((p) => p.module !== mod.module);
                            if (!allChecked) {
                              mod.actions.forEach((a) => newPerms.push({ module: mod.module, action: a }));
                            }
                            setForm({ ...form, permissions: newPerms });
                          }}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            allChecked ? 'bg-indigo-500 border-indigo-500' : modPerms.length > 0 ? 'bg-indigo-200 border-indigo-400' : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {allChecked && <div className="w-2.5 h-0.5 bg-white rounded" />}
                          {!allChecked && modPerms.length > 0 && <div className="w-2 h-0.5 rounded bg-pos-primary" />}
                        </div>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{mod.module}</span>
                        {modPerms.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/40" style={{color:'#e8a0a0'}}>
                            {modPerms.length}/{mod.actions.length}
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 py-3 flex flex-wrap gap-2 bg-white dark:bg-slate-900">
                        {mod.actions.map((action) => {
                          const checked = form.permissions.some((p) => p.module === mod.module && p.action === action);
                          return (
                            <button
                              key={action}
                              type="button"
                              onClick={() => togglePermission(mod.module, action)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                                checked
                                  ? 'text-white bg-pos-primary border-pos-primary'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-pos-primary/40'
                              }`}
                            >
                              {action}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Submit */}
          <div className="sticky bottom-0 pt-4 pb-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-pos-primary/20 bg-pos-primary hover:bg-pos-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Assign Package Modal ─────────────────────────────────────────────────────
function AssignPackageModal({
  packages,
  onClose,
}: {
  packages: Pkg[];
  onClose: () => void;
}) {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/super-admin/organizations')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setOrgs(d.data);
        setLoading(false);
      });
  }, []);

  const assignPackage = async (orgId: string, pkgId: string | null, startDate?: string | null, endDate?: string | null) => {
    setAssigning(orgId);
    await fetch(`/api/super-admin/organizations/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        packageId: pkgId,
        packageStartDate: startDate,
        packageEndDate: endDate
      }),
    });
    setAssigning(null);
    // Refresh
    const d = await fetch('/api/super-admin/organizations').then((r) => r.json());
    if (d.success) setOrgs(d.data);
  };

  const getExpiryStatus = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return { label: 'Expired', color: 'text-red-500 bg-red-50' };
    if (days === 0) return { label: 'Expires Today', color: 'text-amber-600 bg-amber-50' };
    if (days < 7) return { label: `Expires in ${days}d`, color: 'text-amber-600 bg-amber-50' };
    return { label: `Expires in ${days}d`, color: 'text-emerald-600 bg-emerald-50' };
  };

  const setRelativeExpiry = (org: any, months: number) => {
    const start = org.packageStartDate ? new Date(org.packageStartDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + months);
    assignPackage(
      org.id, 
      org.packageId,
      start.toISOString(),
      end.toISOString()
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800">
        <div className="px-8 pt-8 pb-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Assign Packages & Subscriptions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage access duration for each organization</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {loading ? (
            <p className="text-center text-slate-400 py-8 text-sm italic">Searching for organizations...</p>
          ) : orgs.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No organizations found.</p>
          ) : (
            orgs.map((org: any) => {
              const packageId = org.packageId || '';
              const startDate = org.packageStartDate ? new Date(org.packageStartDate).toISOString().split('T')[0] : '';
              const endDate = org.packageEndDate ? new Date(org.packageEndDate).toISOString().split('T')[0] : '';
              const status = getExpiryStatus(org.packageEndDate);

              return (
                <div key={org.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                        <Building2 size={18} style={{color:'#e8a0a0'}} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{org.name}</p>
                        {status && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full mt-1 inline-block ${status.color}`}>
                            {status.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        value={packageId}
                        onChange={(e) => assignPackage(org.id, e.target.value || null, startDate, endDate)}
                        disabled={assigning === org.id}
                        className="pl-3 pr-8 py-2.5 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-black text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2" style={{}} onFocus={e=>{e.currentTarget.style.boxShadow='0 0 0 2px #e8a0a040';}} onBlur={e=>{e.currentTarget.style.boxShadow='';}}
                      >
                        <option value="">No Package</option>
                        {packages.filter((p) => p.isActive).map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      {assigning === org.id && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{borderColor:'#e8a0a0 transparent transparent transparent'}} />
                      )}
                    </div>
                  </div>

                  {packageId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50 dark:border-slate-800/50">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Calendar size={10} /> Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => assignPackage(org.id, packageId, e.target.value, endDate)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <CalendarX size={10} /> Expiry Date
                        </label>
                        <div className="space-y-2">
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => assignPackage(org.id, packageId, startDate, e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                          />
                          <div className="flex gap-1.5">
                            {[
                              { l: '+1M', m: 1 },
                              { l: '+3M', m: 3 },
                              { l: '+1Y', m: 12 }
                            ].map(btn => (
                              <button
                                key={btn.l}
                                onClick={() => setRelativeExpiry(org, btn.m)}
                                className="flex-1 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-[10px] font-black hover:text-white transition-all" style={{color:'#e8a0a0'}} onMouseEnter={e=>{e.currentTarget.style.backgroundColor='#e8a0a0'; e.currentTarget.style.color='white';}} onMouseLeave={e=>{e.currentTarget.style.backgroundColor=''; e.currentTarget.style.color='#e8a0a0';}}
                              >
                                {btn.l}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Pkg | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/packages').then((r) => r.json());
    if (res.success) setPackages(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const handleSave = async (form: ReturnType<typeof emptyForm>) => {
    const isEdit = !!editingPkg;
    const res = await fetch('/api/admin/packages', {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdit ? { id: editingPkg!.id, ...form } : form),
    }).then((r) => r.json());

    if (res.success) {
      setIsFormOpen(false);
      setEditingPkg(null);
      showToast(isEdit ? 'Package updated successfully!' : 'Package created successfully!');
      fetchPackages();
    } else {
      showToast(res.error || 'Something went wrong', 'error');
      throw new Error(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this package? It will be unassigned from all organizations.')) return;
    const res = await fetch(`/api/admin/packages?id=${id}`, { method: 'DELETE' }).then((r) => r.json());
    if (res.success) {
      showToast('Package deleted.');
      fetchPackages();
    } else {
      showToast(res.error || 'Failed to delete', 'error');
    }
  };

  const handleToggleActive = async (id: string, value: boolean) => {
    const pkg = packages.find((p) => p.id === id);
    if (!pkg) return;
    await fetch('/api/admin/packages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        name: pkg.name,
        description: pkg.description,
        discountPercent: pkg.discountPercent,
        color: pkg.color,
        isActive: value,
        features: pkg.features.map((f) => f.feature),
        permissions: pkg.permissions.map((p) => ({ module: p.module, action: p.action })),
      }),
    });
    showToast(value ? 'Package activated.' : 'Package deactivated.');
    fetchPackages();
  };

  const openEdit = (pkg: Pkg) => {
    setEditingPkg(pkg);
    setIsFormOpen(true);
  };

  const activeCount = packages.filter((p) => p.isActive).length;
  const totalOrgs = packages.reduce((sum, p) => sum + p._count.organizations, 0);

  return (
    <div className="relative min-h-screen space-y-8">
      {/* Background glows */}
      <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-rose-200/20 dark:bg-rose-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-rose-200/20 dark:bg-rose-500/10 rounded-full blur-[80px] -z-10 pointer-events-none" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-sm font-bold animate-slide-in-right ${
          toast.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 rounded-full" style={{backgroundColor:'#e8a0a0'}} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{color:'#e8a0a0'}}>Subscription Control</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Packages
            <span className="ml-3 text-sm font-bold bg-rose-50 dark:bg-rose-900/30 px-3 py-1 rounded-full uppercase tracking-widest border border-rose-100 dark:border-rose-800" style={{color:'#e8a0a0'}}>
              {packages.length} total
            </span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 max-w-lg">
            Create and manage subscription packages. Control which features, pages, and permissions each organization can access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAssignOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border bg-rose-50 dark:bg-rose-900/30 hover:opacity-80 transition-all text-sm font-bold"
            style={{borderColor:'#e8a0a080', color:'#e8a0a0'}}
          >
            <Building2 size={15} />
            Assign to Orgs
          </button>
          <button
            onClick={() => { setEditingPkg(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-bold shadow-lg transition-all"
            style={{backgroundColor:'#e8a0a0', boxShadow:'0 4px 14px #e8a0a040'}}
          >
            <Plus size={15} />
            New Package
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Packages', value: packages.length, icon: Boxes, color: 'from-rose-400 to-rose-500', shadow: 'shadow-rose-100' },
          { label: 'Active Packages', value: activeCount, icon: Zap, color: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-100' },
          { label: 'Orgs on Plans', value: totalOrgs, icon: Building2, color: 'from-rose-300 to-rose-400', shadow: 'shadow-rose-100' },
          { label: 'Avg. Discount', value: packages.length ? `${(packages.reduce((s, p) => s + p.discountPercent, 0) / packages.length).toFixed(1)}%` : '0%', icon: Percent, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-100' },
        ].map((s, i) => (
          <div key={i} className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm ${s.shadow} dark:shadow-none flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0 shadow-md`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{s.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Package grid */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-rose-100 dark:border-rose-900 rounded-full" />
            <div className="absolute inset-0 border-4 rounded-full border-t-transparent animate-spin" style={{borderColor:'#e8a0a0 transparent transparent transparent'}} />
          </div>
        </div>
      ) : packages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-24 h-24 rounded-3xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-6 shadow-xl">
            <Sparkles size={40} style={{color:'#e8a0a0'}} />
          </div>
          <h3 className="text-xl font-black text-slate-700 dark:text-slate-300">No Packages Yet</h3>
          <p className="text-slate-400 text-sm mt-2 mb-8 max-w-sm">
            Create your first package to start controlling what each organization can access.
          </p>
          <button
            onClick={() => { setEditingPkg(null); setIsFormOpen(true); }}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-white text-sm font-bold shadow-lg transition-all"
            style={{backgroundColor:'#e8a0a0', boxShadow:'0 4px 14px #e8a0a040'}}
          >
            <Plus size={15} /> Create First Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <PackageFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingPkg(null); }}
        onSave={handleSave}
        editing={editingPkg}
      />
      {isAssignOpen && (
        <AssignPackageModal
          packages={packages}
          onClose={() => { setIsAssignOpen(false); fetchPackages(); }}
        />
      )}
    </div>
  );
}
