'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Home, Plus, Edit2, Trash2, AlertCircle, ArrowRightCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'RESTAURANT',
    city: '',
    state: '',
    country: 'India',
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/properties');
      const data = await res.json();
      if (data.success) setProperties(data.data);
    } catch (error) {
      console.error('Failed to fetch properties', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (property?: any) => {
    if (property) {
      setEditingId(property.id);
      setFormData({
        name: property.name,
        code: property.code,
        type: property.type || 'RESTAURANT',
        city: property.city || '',
        state: property.state || '',
        country: property.country || 'India',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', code: '', type: 'RESTAURANT', city: '', state: '', country: 'India' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = '/api/admin/properties';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchProperties();
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone and will delete all associated POS data.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/properties?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchProperties();
      } else {
        alert(data.error || 'Failed to delete property');
      }
    } catch (error) {
      alert('An error occurred during deletion');
    }
  };

  const handleSwitchProperty = async (id: string, name: string) => {
    try {
      const res = await fetch('/api/setup/properties/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Switched to "${name}" successfully!`);
        router.push('/dashboard');
        router.refresh();
      } else {
        alert(data.error || 'Failed to switch property');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Property Management</h1>
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Manage branches and POS locations.</p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus size={16} />} className="rounded-xl shadow-lg shadow-pos-primary/20">
          Add New Branch
        </Button>
      </div>

      <Card className="overflow-hidden border-2 border-slate-200/60 dark:border-slate-800 shadow-xl dark:shadow-none rounded-2xl bg-white dark:bg-slate-900/40">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-pos-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading branches...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b-2 border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Branch Name</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Code</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Type</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Location</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Users</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {properties.length > 0 ? properties.map((prop) => (
                    <tr key={prop.id} className="hover:bg-pos-primary/5 dark:hover:bg-slate-800/50 transition-all group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-pos-primary group-hover:text-white transition-colors">
                            <Home size={14} />
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white uppercase text-xs">{prop.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] font-black text-pos-primary dark:text-pos-primary/80 bg-pos-primary/10 dark:bg-pos-primary/20 px-2 py-1 rounded-md border border-pos-primary/20 dark:border-pos-primary/30 uppercase tracking-wider">
                          {prop.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {prop.type || 'RESTAURANT'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {[prop.city, prop.state].filter(Boolean).join(', ') || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{prop._count?.users || 0} Users</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => handleSwitchProperty(prop.id, prop.name)} className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md">Enter</button>
                          <button onClick={() => handleOpenModal(prop)} className="p-2 text-slate-400 hover:text-pos-primary transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(prop.id, prop.name)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="p-10 text-center opacity-30 uppercase font-black text-xs">No properties found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {properties.map((prop) => (
                <div key={prop.id} className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <Home size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white uppercase text-xs">{prop.name}</p>
                        <p className="text-[10px] font-black text-pos-primary uppercase tracking-widest">{prop.code}</p>
                      </div>
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {prop.type || 'RESTAURANT'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Location</p>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{[prop.city, prop.state].filter(Boolean).join(', ') || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Access</p>
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{prop._count?.users || 0} Users</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button onClick={() => handleSwitchProperty(prop.id, prop.name)} className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10">Enter Property</button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleOpenModal(prop)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(prop.id, prop.name)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Update Branch Details" : "Create New Branch"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input
            label="Branch / Property Name"
            placeholder="e.g. Seaside Premium Resort"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="rounded-xl"
          />
          <Input
            label="Branch Code (Unique)"
            placeholder="e.g. MNR01"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            className="rounded-xl font-mono uppercase"
          />
          
          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Business Type</label>
            <select
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            >
              <option value="RESTAURANT">Restaurant / Cafe</option>
              <option value="HOTEL">Hotel / Resort</option>
              <option value="RETAIL">Retail / Shop</option>
              <option value="OTHER">Other Business</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="e.g. New York"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="rounded-xl"
            />
            <Input
              label="State"
              placeholder="e.g. Himachal Pradesh"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button" className="rounded-xl font-black text-xs uppercase tracking-widest">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="rounded-xl font-black text-xs uppercase tracking-widest px-8">
              {editingId ? "Save Changes" : "Create Branch"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
