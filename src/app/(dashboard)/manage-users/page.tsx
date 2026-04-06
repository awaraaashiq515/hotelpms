'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, Key, UserCheck, Monitor, Eye, EyeOff, Edit, Trash2, Plus } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    roleName: '',
    propertyId: '',
  });

  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSession(data.user);
        }
      });
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, pRes] = await Promise.all([
        fetch('/api/admin/users').then(r => r.json()),
        fetch('/api/admin/roles').then(r => r.json()),
        fetch('/api/admin/properties').then(r => r.json()),
      ]);

      if (uRes.success) setUsers(uRes.data);
      if (rRes.success) setRoles(rRes.data);
      if (pRes.success) setProperties(pRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoles = roles.filter(role => {
    if (role.name === 'SUPER_ADMIN' && session?.role !== 'SUPER_ADMIN') return false;
    return true;
  });

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormData({ fullName: '', email: '', password: '', roleName: '', propertyId: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      password: '', // Leave blank unless they want to change it
      roleName: user.role?.name || '',
      propertyId: user.propertyId || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = !!editingUserId;
      const endpoint = '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit ? { id: editingUserId, ...formData } : formData;

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData({ fullName: '', email: '', password: '', roleName: '', propertyId: '' });
        setEditingUserId(null);
        fetchData(); // Refresh
      } else {
        alert(data.error || `Failed to ${isEdit ? 'update' : 'create'} user`);
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchData(); // Refresh list
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'block' : 'activate'} this user?`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData(); // Refresh list
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) {
        // Redirect to operations or dashboard
        window.location.href = data.data.role === 'POSSYSTEM' ? '/operations' : '/dashboard';
      } else {
        alert(data.error || 'Failed to impersonate');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase">POS Access Management</h1>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
            <ShieldCheck size={14} className="text-pos-primary" />
            Control terminal access and POS permissions for your properties
          </p>
        </div>
        <Button onClick={openCreateModal} className="bg-slate-900 dark:bg-pos-primary hover:bg-black dark:hover:bg-pos-primary-dark text-white rounded-xl py-4 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-900/10 flex items-center gap-2">
          <Key size={16} />
          Provision POS Access
        </Button>
      </div>

      <Card className="p-0 overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none rounded-2xl bg-white dark:bg-slate-900/40">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Access Directory...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b-2 border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">User / Operator</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Login ID (Email)</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Access Level</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Assigned Terminal</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Revenue (Current)</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-pos-primary/5 dark:hover:bg-slate-800/50 transition-all group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-pos-primary group-hover:text-white transition-colors">
                          <UserCheck size={14} />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white uppercase text-xs">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500">{user.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role?.name === 'SUPER_ADMIN' ? 'error' : 'indigo'} className="font-black text-[9px] uppercase tracking-tighter">
                        {user.role?.name === 'POSSYSTEM' ? 'OPERATOR' : user.role?.name}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                      <div className="flex items-center gap-2">
                        <Monitor size={12} className="text-slate-300 dark:text-slate-600" />
                        {user.property?.name || <span className="opacity-30">All Properties</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white text-xs">
                      ₹{(user.totalSales || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:opacity-80 transition-all ${
                          user.isActive ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Blocked'}
                      </button>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <button 
                        onClick={() => openEditModal(user)}
                        className="text-slate-400 dark:text-slate-500 hover:text-pos-primary dark:hover:text-pos-primary/80 transition-colors"
                        title="Edit User"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                      {user.role?.name !== 'SUPER_ADMIN' && (
                        <Button 
                          variant="secondary" 
                          onClick={() => handleImpersonate(user.id)}
                          className="px-2 py-1 text-xs"
                        >
                          Impersonate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUserId ? "Modify Access Credentials" : "Grant POS System Access"}>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input
            label="Operator Full Name"
            placeholder="e.g. Rajesh Kumar"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            className="rounded-xl border-slate-200"
          />
          <Input
            label="Login Identifier (Email)"
            type="email"
            placeholder="operator@pos.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="rounded-xl border-slate-200"
          />
          <div className="relative">
            <Input
              label={editingUserId ? "Access Key (leave blank to keep current)" : "Access Key (Password)"}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUserId}
              className="rounded-xl border-slate-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">System Permissions (Role)</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              value={formData.roleName}
              onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              required
            >
              <option value="">-- Choose Access Level --</option>
              {filteredRoles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name === 'POSSYSTEM' ? 'OPERATOR (POS ACCESS)' : role.name}
                </option>
              ))}
            </select>
          </div>

          {(formData.roleName === 'POSSYSTEM' || formData.roleName === 'RESTAURANTS_ADMIN') && (
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Assign to Terminal (Property)</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                required={formData.roleName === 'POSSYSTEM'}
              >
                <option value="">-- Select Target Property --</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name} ({prop.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-slate-900 hover:bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-8 shadow-lg shadow-slate-900/10">
              {editingUserId ? "Update Rights" : "Authorize User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
