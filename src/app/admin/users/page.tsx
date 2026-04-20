'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Plus, UserPlus, Eye, EyeOff, Edit, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, pRes] = await Promise.all([
        fetch('/api/admin/users?global=true').then(r => r.json()),
        fetch('/api/admin/roles').then(r => r.json()),
        fetch('/api/admin/properties?global=true').then(r => r.json()),
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage POS and System Administrators.</p>
        </div>
        <Button onClick={openCreateModal} icon={<UserPlus size={16} />} className="w-full sm:w-auto bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl shadow-lg shadow-pos-primary/10 transition-all font-black uppercase text-[10px] tracking-widest px-6 h-11">
          Add User
        </Button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="text-xs font-bold uppercase tracking-widest">Loading users...</div>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <Card className="hidden lg:block p-0 overflow-hidden border-slate-200/60 dark:border-slate-800 shadow-md dark:shadow-none bg-white dark:bg-slate-900/50">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-800">
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Name</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Business</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Role</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Property</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Sales</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{user.fullName}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-[150px]">{user.email}</td>
                        <td className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                          {user.organization?.name || 'SYSTEM'}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.role?.name === 'SUPER_ADMIN' ? 'error' : 'secondary'} className="text-[10px]">
                            {user.role?.name}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {user.property?.name || <span className="text-slate-400 italic">Global</span>}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                          ₹{user.totalSales?.toLocaleString() || '0'}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleToggleStatus(user.id, user.isActive)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Blocked'}
                          </button>
                        </td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-pos-primary transition-colors"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                          {user.role?.name !== 'SUPER_ADMIN' && (
                            <button onClick={() => handleImpersonate(user.id)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black uppercase text-slate-600 hover:bg-pos-primary hover:text-white transition-all">
                              Login
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
              {users.map((user) => (
                <div key={user.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{user.fullName}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{user.email}</span>
                    </div>
                    <Badge variant={user.role?.name === 'SUPER_ADMIN' ? 'error' : 'secondary'} className="text-[8px] uppercase">
                      {user.role?.name}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Property</span>
                      <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{user.property?.name || 'Global'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Sales</span>
                      <span className="text-[10px] font-black text-emerald-600">₹{user.totalSales?.toLocaleString() || '0'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      className={`px-3 py-1 rounded-xl text-[9px] font-bold uppercase tracking-widest ${
                        user.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Blocked'}
                    </button>
                    
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModal(user)} className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-500"><Edit size={14} /></button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-500"><Trash2 size={14} /></button>
                      {user.role?.name !== 'SUPER_ADMIN' && (
                        <button onClick={() => handleImpersonate(user.id)} className="px-3 py-2 bg-pos-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Impersonate</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {users.length === 0 && (
              <div className="p-12 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-500">No users found.</p>
              </div>
            )}
          </>
        )}
      </div>


      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUserId ? "Edit User" : "Create New User"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <div className="relative">
            <Input
              label={editingUserId ? "Password (leave blank to keep current)" : "Password"}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUserId}
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Role</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
              value={formData.roleName}
              onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              required
            >
              <option value="">Select Role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {formData.roleName === 'POSSYSTEM' && (
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Assign Property</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                required={formData.roleName === 'POSSYSTEM'}
              >
                <option value="">Select Property</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name} ({prop.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl shadow-lg shadow-pos-primary/10 transition-all font-black uppercase text-[10px] tracking-widest px-8 h-12">
              {editingUserId ? "Save Changes" : "Create User"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
