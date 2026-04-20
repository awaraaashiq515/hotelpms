'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface ExpenseCategory {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count: { expenses: number };
}

const inputCls = 'w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:border-violet-400 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600';
const labelCls = 'block text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5';

export default function ExpenseCategoriesPage() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<ExpenseCategory[]>('/api/expense-categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const resetForm = () => { setName(''); setEditId(null); setShowForm(false); setError(''); };

  const handleEdit = (cat: ExpenseCategory) => {
    setEditId(cat.id);
    setName(cat.name);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Category name is required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await apiClient.put(`/api/expense-categories/${editId}`, { name: name.trim() });
        setSuccessMsg('Category updated!');
      } else {
        await apiClient.post('/api/expense-categories', { name: name.trim() });
        setSuccessMsg('Category created!');
      }
      resetForm();
      fetchCategories();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat: ExpenseCategory) => {
    try {
      await apiClient.put(`/api/expense-categories/${cat.id}`, { isActive: !cat.isActive });
      fetchCategories();
    } catch (e: any) {
      alert(e.message || 'Failed to toggle');
    }
  };

  const handleDelete = async (cat: ExpenseCategory) => {
    if (!confirm(`Delete "${cat.name}"? If it has expenses, it will be deactivated instead.`)) return;
    try {
      await apiClient.delete(`/api/expense-categories/${cat.id}`);
      fetchCategories();
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
    }
  };

  const active = categories.filter(c => c.isActive);
  const inactive = categories.filter(c => !c.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Expense Categories</h1>
          <p className="text-xs font-bold text-gray-400 dark:text-slate-500 tracking-widest mt-0.5">
            Manage expense types for classification
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest shadow-lg shadow-violet-100 dark:shadow-none transition-all"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-3 text-green-700 text-xs font-black uppercase">
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Inline Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-violet-100 dark:border-slate-800 shadow-lg shadow-violet-50 dark:shadow-none p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-tight">
              {editId ? 'Edit Category' : 'New Category'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-700"><X size={18} /></button>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-600 text-xs font-black">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          <div>
            <label className={labelCls}>Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rent, Utilities, Salaries, Marketing..."
              className={inputCls}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="flex-1 py-3 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 rounded-xl text-xs font-bold tracking-widest hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold tracking-widest disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Categories', value: categories.length, color: 'text-gray-900 dark:text-white' },
          { label: 'Active', value: active.length, color: 'text-green-600' },
          { label: 'Inactive', value: inactive.length, color: 'text-gray-400 dark:text-slate-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
            <p className="text-[10px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 dark:border-slate-700 flex items-center gap-3">
          <div className="p-2 bg-violet-50 dark:bg-violet-950 rounded-xl"><Tag size={18} className="text-violet-500" /></div>
          <div>
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">All Categories</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold tracking-widest">{categories.length} total</p>
          </div>
        </div>
        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-gray-300 uppercase">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center">
            <Tag size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">No categories yet</p>
            <p className="text-[11px] text-gray-300 mt-1">Add your first expense category above</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                {['Category Name', 'Expenses Used', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[9px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-[0.12em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${cat.isActive ? 'bg-green-400' : 'bg-gray-200 dark:bg-slate-700'}`} />
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs font-bold text-gray-600">
                    {cat._count.expenses} expense{cat._count.expenses !== 1 ? 's' : ''}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      cat.isActive ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400'
                    }`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggle(cat)}
                        className={`p-2 rounded-xl transition-colors ${cat.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={cat.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {cat.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-violet-500 hover:bg-violet-50 rounded-xl transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
