'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Building2, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Search,
  Plus,
  ArrowRight,
  Edit2,
  Trash2,
  UserCheck
} from 'lucide-react';

export default function GlobalPropertyManagement() {
  const [properties, setProperties] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
    organizationId: '', // For Super Admin to assign an owner
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, adminRes] = await Promise.all([
        fetch('/api/admin/properties?global=true'),
        fetch('/api/admin/users?global=true') // We'll filter for ADMIN role locally or via API
      ]);
      
      const propData = await propRes.json();
      const adminData = await adminRes.json();

      if (propData.success) setProperties(propData.data);
      if (adminData.success) {
        setAdmins(adminData.data.filter((u: any) => u.role?.name === 'RESTAURANTS_ADMIN' || u.role?.name === 'SUPER_ADMIN'));
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
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
        organizationId: property.organizationId || '',
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', code: '', type: 'RESTAURANT', city: '', state: '', country: 'India', organizationId: '' });
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
        fetchData();
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
    if (!confirm(`GLOBAL DELETE: Are you sure you want to delete "${name}"? This will ERASE all POS data for this business permanently.`)) return;
    try {
      const res = await fetch(`/api/admin/properties?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchData();
      else alert(data.error || 'Delete failed');
    } catch (error) {
      alert('Error during deletion');
    }
  };

  const filtered = properties.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.uniqueCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest text-xs">Global Console Loading...</div>;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase transition-colors">Global Business Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest flex items-center gap-2 transition-colors">
            <ShieldCheck size={14} style={{color:'#e8a0a0'}} />
            System-Wide Asset Management
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Filter businesses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all w-64 shadow-sm text-slate-900 dark:text-white" style={{}} onFocus={e => e.currentTarget.style.boxShadow='0 0 0 2px #e8a0a040'} onBlur={e => e.currentTarget.style.boxShadow=''}/>
          </div>
          <Button onClick={() => handleOpenModal()} className="text-white rounded-xl py-4 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center gap-2" style={{backgroundColor:'#e8a0a0', boxShadow:'0 4px 14px #e8a0a040'}}>
            <Plus size={16} />
            Register New Enterprise
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((property) => (
          <Card key={property.id} className="p-0 border-none shadow-sm hover:shadow-xl transition-all group overflow-hidden bg-white dark:bg-slate-900/40">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:text-white transition-all duration-300" style={{}} onMouseEnter={e => (e.currentTarget.style.backgroundColor='#e8a0a0')} onMouseLeave={e => (e.currentTarget.style.backgroundColor='')}>
                  <Building2 size={28} />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    <button onClick={() => handleOpenModal(property)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg transition-colors" style={{}} onMouseEnter={e => (e.currentTarget.style.color='#e8a0a0')} onMouseLeave={e => (e.currentTarget.style.color='')}><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(property.id, property.name)} className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-600 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                  <span className="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[9px] font-black rounded-lg uppercase">System Checked</span>
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-xl font-black text-slate-900 dark:text-white truncate uppercase tracking-tight">{property.name}</h3>
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  <div className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 dark:text-slate-400 font-mono">{property.uniqueCode}</div>
                  <span>•</span>
                  <span>{property.type}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Users</p>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">{property._count?.users || 0}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-right">
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Region</p>
                  <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">{property.city || 'Standard'}</span>
                    <MapPin size={14} className="text-slate-500 dark:text-slate-400" />
                  </div>
                </div>
              </div>

              <Button className="w-full bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl py-6 font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 group-hover:translate-y-[-2px] transition-transform shadow-lg shadow-pos-primary/10">
                System Oversight
                <ArrowRight size={16} />
              </Button>
            </div>
            
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>Sync ID: {property.id.slice(0, 8)}...</span>
              <span className="text-pos-primary">Live Global Access</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Modify Global Instance" : "Provision New Business Entity"}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input
            label="Business Official Name"
            placeholder="e.g. Grand Plaza Hotel"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="rounded-xl border-slate-200"
          />
          <Input
            label="Internal Service Code"
            placeholder="e.g. GPH-001"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            className="rounded-xl font-mono uppercase border-slate-200"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Entity Type</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer" style={{}} onFocus={e => {e.currentTarget.style.borderColor='#e8a0a0'; e.currentTarget.style.boxShadow='0 0 0 2px #e8a0a020';}} onBlur={e => {e.currentTarget.style.borderColor=''; e.currentTarget.style.boxShadow='';}}
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
            
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Assign To Owner</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer" style={{}} onFocus={e => {e.currentTarget.style.borderColor='#e8a0a0'; e.currentTarget.style.boxShadow='0 0 0 2px #e8a0a020';}} onBlur={e => {e.currentTarget.style.borderColor=''; e.currentTarget.style.boxShadow='';}}
                value={formData.organizationId}
                onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                required
              >
                <option value="">-- Select Business Admin --</option>
                {admins.map(admin => (
                  <option key={admin.id} value={admin.organizationId}>
                    {admin.fullName} ({admin.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              placeholder="e.g. Mumbai"
              value={formData.city || ''}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="rounded-xl border-slate-200"
            />
            <Input
              label="State / Region"
              placeholder="e.g. Maharashtra"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="rounded-xl border-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button" className="rounded-xl font-black text-xs uppercase tracking-widest px-6">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="text-white rounded-xl font-black text-xs uppercase tracking-widest px-8 shadow-lg" style={{backgroundColor:'#e8a0a0', boxShadow:'0 4px 14px #e8a0a030'}}>
              {editingId ? "Commit Changes" : "Provision Assets"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
