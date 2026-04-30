'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, Key, UserCheck, Monitor, Eye, EyeOff, Edit, Trash2, Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetData, setResetData] = useState({ userId: '', fullName: '', newPassword: '' });

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    roleName: '',
    propertyId: '',
    posPin: '',
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
    setFormData({ fullName: '', email: '', password: '', roleName: '', propertyId: '', posPin: '' });
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
      posPin: user.posPin || '',
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
        setFormData({ fullName: '', email: '', password: '', roleName: '', propertyId: '', posPin: '' });
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

  const handleQuickReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetData.newPassword) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: resetData.userId, 
          fullName: resetData.fullName,
          email: users.find(u => u.id === resetData.userId)?.email,
          roleName: users.find(u => u.id === resetData.userId)?.role?.name,
          password: resetData.newPassword 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResetModalOpen(false);
        setResetData({ userId: '', fullName: '', newPassword: '' });
        alert('Password reset successfully');
      } else {
        alert(data.error || 'Failed to reset password');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <PageHeader
        title="POS Access Management"
        subtitle="Control terminal access and POS permissions for your properties"
        showBack
        backUrl="/operations"
        actions={
          <Button onClick={openCreateModal} className="bg-slate-900 dark:bg-pos-primary hover:bg-black dark:hover:bg-pos-primary-dark text-white rounded-xl py-4 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-900/10 flex items-center gap-2">
            <Key size={16} />
            Provision POS Access
          </Button>
        }
      />

      <Card className="overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-none rounded-2xl bg-white dark:bg-slate-900/40">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Directory...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b-2 border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">User / Operator</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Login ID</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Access</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Property</th>
                    <th className="px-6 py-5 text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-[0.2em]">Revenue</th>
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
                          <span className="truncate max-w-[120px]">{user.property?.name || 'Global'}</span>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-pos-primary transition-colors"><Edit size={16} /></button>
                          <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                          {user.role?.name !== 'SUPER_ADMIN' && (
                            <>
                              <button onClick={() => handleImpersonate(user.id)} className="px-2 py-1 text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-pos-primary hover:text-white transition-all">Login</button>
                              <button onClick={() => { setResetData({ userId: user.id, fullName: user.fullName, newPassword: '' }); setResetModalOpen(true); }} className="p-2 text-slate-400 hover:text-pos-primary transition-colors"><Key size={16} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white uppercase text-xs">{user.fullName}</p>
                        <p className="text-[10px] font-bold text-slate-400">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant={user.role?.name === 'SUPER_ADMIN' ? 'error' : 'indigo'} className="font-black text-[8px] uppercase">
                      {user.role?.name === 'POSSYSTEM' ? 'OPERATOR' : user.role?.name}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Property</p>
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{user.property?.name || 'Global Access'}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Revenue</p>
                      <p className="text-[10px] font-black text-emerald-600">₹{(user.totalSales || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Blocked'}
                    </button>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditModal(user)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500"><Trash2 size={16} /></button>
                      {user.role?.name !== 'SUPER_ADMIN' && (
                        <button onClick={() => handleImpersonate(user.id)} className="px-4 py-2 bg-pos-primary text-white rounded-lg text-[9px] font-black uppercase">Login</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
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

      <Modal isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title="Quick Password Reset">
        <form onSubmit={handleQuickReset} className="space-y-4 pt-4">
          <div className="p-4 bg-pos-primary/5 rounded-2xl border border-pos-primary/10">
            <p className="text-[10px] font-black text-pos-primary uppercase tracking-[0.2em] mb-1">Resetting Password For</p>
            <p className="text-sm font-bold text-slate-900">{resetData.fullName}</p>
          </div>
          
          <div className="relative">
            <Input
              label="New Access Key (Password)"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter new password"
              value={resetData.newPassword}
              onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
              required
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

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6">
            <Button variant="secondary" onClick={() => setResetModalOpen(false)} type="button" className="rounded-xl font-black text-[10px] uppercase tracking-widest px-6">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-8 shadow-lg shadow-pos-primary/20">
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
