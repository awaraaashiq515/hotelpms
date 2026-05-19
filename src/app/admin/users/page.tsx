'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Plus, UserPlus, Eye, EyeOff, Edit, Trash2, Search, Shield, Store, Users, Smartphone, Truck } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    address: '',
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    roleName: '',
    propertyId: '',
    supplierId: '',
    phone: '',
    vehicleNumber: '',
    vehicleType: 'BIKE',
    deliveryLocation: '',
    deliveryLat: '',
    deliveryLng: '',
    deliveryRadius: '5.0',
  });

  const [mapResults, setMapResults] = useState<any[]>([]);
  const [searchingMap, setSearchingMap] = useState(false);

  const handleLocationSearch = async (query: string) => {
    if (!query || query.length < 3) return;
    setSearchingMap(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
      const data = await res.json();
      setMapResults(data || []);
    } catch (err) {
      console.error('Failed to geocode address', err);
    } finally {
      setSearchingMap(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, pRes, sRes] = await Promise.all([
        fetch('/api/admin/users?global=true').then(r => r.json()),
        fetch('/api/admin/roles').then(r => r.json()),
        fetch('/api/admin/properties?global=true').then(r => r.json()),
        fetch('/api/b2b/suppliers').then(r => r.json()),
      ]);

      if (uRes.success) setUsers(uRes.data);
      if (rRes.success) setRoles(rRes.data);
      if (pRes.success) setProperties(pRes.data);
      if (Array.isArray(sRes)) {
        setSuppliers(sRes);
      } else if (sRes && sRes.success) {
        setSuppliers(sRes.data);
      }
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUserId(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      roleName: activeTab === 'DELIVERY_RIDER' ? 'DELIVERY_RIDER' : '',
      propertyId: '',
      supplierId: '',
      phone: '',
      vehicleNumber: '',
      vehicleType: 'BIKE',
      deliveryLocation: '',
      deliveryLat: '',
      deliveryLng: '',
      deliveryRadius: '5.0',
    });
    setMapResults([]);
    setIsModalOpen(true);
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      password: '',
      roleName: user.role?.name || '',
      propertyId: user.propertyId || '',
      supplierId: user.supplierId || '',
      phone: user.phone || '',
      vehicleNumber: user.vehicleNumber || '',
      vehicleType: user.vehicleType || 'BIKE',
      deliveryLocation: user.deliveryLocation || '',
      deliveryLat: user.deliveryLat !== null ? String(user.deliveryLat) : '',
      deliveryLng: user.deliveryLng !== null ? String(user.deliveryLng) : '',
      deliveryRadius: user.deliveryRadius !== null ? String(user.deliveryRadius) : '5.0',
    });
    setMapResults([]);
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
        setEditingUserId(null);
        fetchData();
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
        fetchData();
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
        fetchData();
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
        window.location.href = data.data.role === 'POSSYSTEM' ? '/operations' : '/dashboard';
      } else {
        alert(data.error || 'Failed to impersonate');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupplierSubmitting(true);
    try {
      const res = await fetch('/api/b2b/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierFormData),
      });
      const data = await res.json();
      if (data.success) {
        const newSup = data.data;
        setSuppliers((prev) => [newSup, ...prev]);
        setFormData((prev) => ({ ...prev, supplierId: newSup.id }));
        setIsSupplierModalOpen(false);
        setSupplierFormData({ name: '', email: '', phone: '', category: '', address: '' });
      } else {
        alert(data.error || 'Failed to create supplier');
      }
    } catch (err) {
      alert('An error occurred while creating supplier');
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const tabs = [
    { id: 'ALL', label: 'All', count: users.length, icon: Users },
    { id: 'SUPER_ADMIN', label: 'Super Admins', count: users.filter(u => u.role?.name === 'SUPER_ADMIN').length, icon: Shield },
    { id: 'RESTAURANTS_ADMIN', label: 'Restaurant Admins', count: users.filter(u => u.role?.name === 'RESTAURANTS_ADMIN').length, icon: Shield },
    { id: 'POSSYSTEM', label: 'POS Staff', count: users.filter(u => u.role?.name === 'POSSYSTEM').length, icon: Smartphone },
    { id: 'B2B_SUPPLIER', label: 'B2B Suppliers', count: users.filter(u => u.role?.name === 'B2B_SUPPLIER').length, icon: Store },
    { id: 'DELIVERY_RIDER', label: 'Delivery Riders', count: users.filter(u => u.role?.name === 'DELIVERY_RIDER').length, icon: Truck },
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.vehicleNumber && user.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTab = activeTab === 'ALL' || user.role?.name === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">User Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Create and manage POS staff, riders, and system administrators.</p>
        </div>
        <Button onClick={openCreateModal} icon={<UserPlus size={16} />} className="w-full sm:w-auto bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl shadow-lg shadow-pos-primary/10 transition-all font-bold text-[11px] tracking-widest px-6 h-11">
          Add User / Rider
        </Button>
      </div>

      {/* Premium Search and Tabs Filter Panel */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md">
        {/* Horizontal scrollable role tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full xl:w-auto pb-2 xl:pb-0">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 border ${
                  isActive
                    ? 'bg-pos-primary border-pos-primary text-white shadow-lg shadow-pos-primary/15 scale-[1.02]'
                    : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <TabIcon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dynamic search bar */}
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search users or riders..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 text-xs font-bold transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="text-xs font-bold uppercase tracking-widest">Loading Users...</div>
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
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Contact / Email</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Vehicle Plate</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Role / Type</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Branch Assignment</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Total Sales/Revenue</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-16 text-center">
                          <Users size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            No users found in this category
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isRider = user.role?.name === 'DELIVERY_RIDER';
                        return (
                          <tr key={user.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${isRider ? 'border-l-4 border-indigo-500' : ''}`}>
                            <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px] flex items-center gap-2">
                              {isRider && <Truck size={14} className="text-indigo-500 shrink-0" />}
                              <span>{user.fullName}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                              {isRider ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{user.email}</span>
                                  <span className="text-xs text-slate-500 font-mono">{user.phone || 'No Phone'}</span>
                                </div>
                              ) : (
                                user.email
                              )}
                            </td>
                            <td className="px-6 py-4 text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase font-mono tracking-wider">
                              {isRider ? (user.vehicleNumber || 'No Plate') : '—'}
                            </td>
                            <td className="px-6 py-4">
                              {isRider ? (
                                <Badge variant="secondary" className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 font-black tracking-wide uppercase">
                                  🛵 {user.vehicleType || 'BIKE'}
                                </Badge>
                              ) : (
                                <Badge variant={user.role?.name === 'SUPER_ADMIN' ? 'error' : 'secondary'} className="text-[10px]">
                                  {user.role?.name}
                                </Badge>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                              {user.role?.name === 'B2B_SUPPLIER' ? (
                                user.supplier?.name ? (
                                  <span className="text-emerald-650 dark:text-emerald-400 font-black bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-lg text-[10px] border border-emerald-100/50 dark:border-emerald-900/30 uppercase tracking-tight">Supplier: {user.supplier.name}</span>
                                ) : (
                                  <span className="text-slate-400 italic text-xs">No Supplier Linked</span>
                                )
                              ) : user.role?.name === 'DELIVERY_RIDER' && !user.propertyId && user.deliveryLocation ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-indigo-650 dark:text-indigo-400 font-black bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-lg text-[10px] border border-indigo-100/50 dark:border-indigo-900/30 uppercase tracking-tight truncate max-w-[150px]" title={user.deliveryLocation}>📍 {user.deliveryLocation}</span>
                                  <span className="text-[9px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-widest pl-1">Range: {user.deliveryRadius || 5} km</span>
                                </div>
                              ) : (
                                user.property?.name || <span className="text-slate-400 italic">Global</span>
                              )}
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
                              <button onClick={() => openEditModal(user)} className="p-2 text-slate-400 hover:text-pos-primary transition-colors" title="Edit"><Edit size={14} /></button>
                              <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors" title="Delete"><Trash2 size={14} /></button>
                              {!isRider && user.role?.name !== 'SUPER_ADMIN' && (
                                <button onClick={() => handleImpersonate(user.id)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-black uppercase text-slate-600 hover:bg-pos-primary hover:text-white transition-all">
                                  Login
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
              {filteredUsers.length === 0 ? (
                <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-150/60 dark:border-slate-800">
                  <Users size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    No users found in this category
                  </p>
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isRider = user.role?.name === 'DELIVERY_RIDER';
                  return (
                    <div key={user.id} className={`bg-white dark:bg-slate-900/50 border rounded-2xl p-5 shadow-sm space-y-4 ${isRider ? 'border-2 border-indigo-100 dark:border-indigo-950' : 'border-slate-200 dark:border-slate-800'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                            {isRider && <Truck size={14} className="text-indigo-500" />}
                            <span>{user.fullName}</span>
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{user.email}</span>
                          {isRider && <span className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user.phone || 'No Phone'}</span>}
                        </div>
                        <Badge variant={isRider ? 'secondary' : (user.role?.name === 'SUPER_ADMIN' ? 'error' : 'secondary')} className={`text-[8px] uppercase ${isRider ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 font-black' : ''}`}>
                          {isRider ? `🛵 ${user.vehicleType || 'BIKE'}` : user.role?.name}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-100 dark:border-slate-800">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            {isRider ? 'Vehicle Plate' : (user.role?.name === 'B2B_SUPPLIER' ? 'Supplier' : 'Property')}
                          </span>
                          <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">
                            {isRider ? (user.vehicleNumber || 'No Plate') : (user.role?.name === 'B2B_SUPPLIER' ? (user.supplier?.name || 'Not Linked') : (user.property?.name || 'Global'))}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{isRider ? 'Revenue' : 'Total Sales'}</span>
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
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUserId ? "Edit User / Rider" : "Create New User / Rider"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={formData.roleName === 'DELIVERY_RIDER' ? "Rider Name" : "Full Name"}
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
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Role / Type</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
              value={formData.roleName}
              onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              required
              disabled={!!editingUserId}
            >
              <option value="">Select Role / Type</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
              <option value="DELIVERY_RIDER">🛵 DELIVERY RIDER</option>
            </select>
          </div>

          {/* Conditional inputs for Delivery Rider */}
          {formData.roleName === 'DELIVERY_RIDER' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <Input
                label="Mobile Phone Number (Rider Login ID)"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                label="Vehicle Plate Number (Rider Login Key)"
                placeholder="e.g. PB65AB1234"
                value={formData.vehicleNumber}
                onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                required
              />
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Vehicle Type</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  required
                >
                  <option value="BIKE">Motorcycle / Bike</option>
                  <option value="CAR">Car / Van</option>
                  <option value="BICYCLE">Bicycle</option>
                  <option value="SCOOTER">Scooter</option>
                  <option value="WALKING">Walking / On Foot</option>
                </select>
              </div>
            </div>
          )}

          {/* Conditional Property Selection */}
          {formData.roleName && formData.roleName !== 'SUPER_ADMIN' && formData.roleName !== 'RESTAURANTS_ADMIN' && (
            <div className="space-y-1 animate-in fade-in duration-200">
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Assign Branch / Property</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                required={formData.roleName === 'POSSYSTEM'}
              >
                <option value="">Select Property / Branch (Optional for Riders)</option>
                {properties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    {prop.name} ({prop.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional Google Maps Location Geofencing details for Riders when Branch is not selected */}
          {formData.roleName === 'DELIVERY_RIDER' && !formData.propertyId && (
            <div className="space-y-3.5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">
                📍 Location Geofencing (No Property Selected)
              </span>
              
              <div className="space-y-1 relative">
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-350">Search Google / Maps Location</label>
                <div className="flex gap-2 relative">
                  <input
                    type="text"
                    placeholder="Type town, city or road, e.g. Sector 17, Chandigarh..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white font-bold"
                    value={formData.deliveryLocation}
                    onChange={(e) => {
                      setFormData({ ...formData, deliveryLocation: e.target.value });
                      if (e.target.value.length > 2) {
                        handleLocationSearch(e.target.value);
                      } else {
                        setMapResults([]);
                      }
                    }}
                  />
                  {searchingMap && (
                    <div className="absolute right-3 top-3.5 flex items-center h-5">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>

                {/* Map Search Results Dropdown Overlay */}
                {mapResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-[999] max-h-40 overflow-y-auto no-scrollbar">
                    {mapResults.map((item) => (
                      <button
                        key={item.place_id}
                        type="button"
                        onMouseDown={() => {
                          setFormData({
                            ...formData,
                            deliveryLocation: item.display_name,
                            deliveryLat: item.lat,
                            deliveryLng: item.lon,
                          });
                          setMapResults([]);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs text-slate-700 dark:text-slate-300 hover:bg-indigo-500 hover:text-white transition-colors border-b border-slate-50 dark:border-slate-800/40 last:border-none font-semibold truncate"
                        title={item.display_name}
                      >
                        📍 {item.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Coordinates readouts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Latitude</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Auto-calculated"
                    value={formData.deliveryLat}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 text-xs font-mono font-bold text-slate-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitude</label>
                  <input
                    type="text"
                    disabled
                    placeholder="Auto-calculated"
                    value={formData.deliveryLng}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700 text-xs font-mono font-bold text-slate-500 outline-none"
                  />
                </div>
              </div>

              {/* Range coverage slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Coverage Radius Range</span>
                  <span className="text-indigo-650 dark:text-indigo-400 font-bold">{formData.deliveryRadius} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  step="0.5"
                  value={formData.deliveryRadius}
                  onChange={(e) => setFormData({ ...formData, deliveryRadius: e.target.value })}
                  className="w-full accent-indigo-600 dark:accent-indigo-400 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {formData.roleName === 'B2B_SUPPLIER' && (
            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Link B2B Supplier</label>
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(true)}
                  className="text-[10px] font-black text-pos-primary hover:underline uppercase tracking-wider transition-all"
                >
                  + Add New Supplier Shop
                </button>
              </div>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                required={formData.roleName === 'B2B_SUPPLIER'}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.category || 'General'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting} className="bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl shadow-lg shadow-pos-primary/10 transition-all font-black uppercase text-[10px] tracking-widest px-8 h-12">
              {editingUserId ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isSupplierModalOpen} onClose={() => setIsSupplierModalOpen(false)} title="Create New B2B Supplier Shop">
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <Input
            label="Supplier / Shop Name"
            placeholder="e.g. Fresh Veggies Co."
            value={supplierFormData.name}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. contact@freshveggies.com"
            value={supplierFormData.email}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
            required
          />

          <Input
            label="Phone Number"
            placeholder="e.g. 9876543210"
            value={supplierFormData.phone}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
          />

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300">Category</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-pos-primary/20 focus:border-pos-primary bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
              value={supplierFormData.category}
              onChange={(e) => setSupplierFormData({ ...supplierFormData, category: e.target.value })}
            >
              <option value="">Select Category</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Dairy">Dairy</option>
              <option value="Meat">Meat</option>
              <option value="Grocery">Grocery</option>
              <option value="Packaging">Packaging</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <Input
            label="Address"
            placeholder="e.g. Sector 4, Market Yard"
            value={supplierFormData.address}
            onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsSupplierModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" isLoading={supplierSubmitting} className="bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl shadow-lg shadow-pos-primary/10 transition-all font-black uppercase text-[10px] tracking-widest px-8 h-12">
              Create Supplier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
