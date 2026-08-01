'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, UserPlus, Search, Edit, Trash2, ShieldCheck, 
  ShieldAlert, RefreshCw, X, Check, Plus, Phone, Mail, 
  Key, Briefcase, Building, Eye, EyeOff, Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { StaffMemberForm } from '@/components/forms/staff-member-form';

interface UserDetail {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  roleId: string;
  role: { id: string; name: string; description?: string | null };
  propertyId?: string | null;
  property?: { id: string; name: string; code: string } | null;
  designation?: string | null;
  posPin?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  deliveryLocation?: string | null;
  deliveryRadius?: number | null;
  staffMember?: {
    id: string;
    designation?: string | null;
    salary?: number | null;
    address?: string | null;
    emergencyContact?: string | null;
    joiningDate?: string | null;
    shiftHours?: number | null;
  } | null;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
}

interface Property {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface StaffManagementProps {
  properties: Property[];
}

export default function StaffManagement({ properties }: StaffManagementProps) {
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDetail | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    roleName: '',
    propertyId: '',
    phone: '',
    posPin: '',
    designation: '',
    vehicleNumber: '',
    vehicleType: 'BIKE',
    deliveryLocation: '',
    deliveryRadius: '5.0',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [uRes, rRes] = await Promise.all([
        fetch('/api/admin/users?global=true').then(r => r.json()),
        fetch('/api/admin/roles').then(r => r.json())
      ]);

      if (uRes.success) {
        setUsers(uRes.data);
      } else {
        setError(uRes.error || 'Failed to load staff members');
      }

      if (rRes.success) {
        setRoles(rRes.data);
      }
    } catch {
      setError('Connection error. Failed to load administrative details.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      roleName: 'Staff',
      propertyId: properties[0]?.id || '',
      phone: '',
      posPin: '',
      designation: 'Waiter',
      vehicleNumber: '',
      vehicleType: 'BIKE',
      deliveryLocation: '',
      deliveryRadius: '5.0',
    });
    setModalError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const openEditModal = (user: UserDetail) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      password: '', // Leave blank when editing unless changing password
      roleName: user.role?.name || 'Staff',
      propertyId: user.propertyId || '',
      phone: user.phone || '',
      posPin: user.posPin || '',
      designation: user.designation || 'Waiter',
      vehicleNumber: user.vehicleNumber || '',
      vehicleType: user.vehicleType || 'BIKE',
      deliveryLocation: user.deliveryLocation || '',
      deliveryRadius: user.deliveryRadius !== null ? String(user.deliveryRadius) : '5.0',
    });
    setModalError('');
    setShowPassword(false);
    setShowModal(true);
  };

  const handleStaffFormSubmit = async (data: any) => {
    setModalError('');
    setModalLoading(true);
    try {
      const isEdit = !!editingUser;
      const staffMemberId = editingUser?.staffMember?.id;

      const endpoint = (isEdit && staffMemberId) 
        ? `/api/staff-members/${staffMemberId}` 
        : '/api/staff-members';
      const method = (isEdit && staffMemberId) ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json());

      if (res.success) {
        setShowModal(false);
        toast.success(`Staff member successfully ${isEdit ? 'updated' : 'registered'}!`);
        loadData();
      } else {
        setModalError(res.error || 'Failed to save staff member account.');
        toast.error(res.error || 'Failed to save staff member account.');
      }
    } catch {
      setModalError('Network error. Please try again.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserDetail) => {
    const action = user.isActive ? 'block' : 'activate';
    if (!confirm(`Are you sure you want to ${action} user "${user.fullName}"?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
      }).then(r => r.json());

      if (res.success) {
        toast.success(`User successfully ${user.isActive ? 'blocked' : 'activated'}!`);
        loadData();
      } else {
        alert(res.error || 'Failed to update user status.');
      }
    } catch {
      alert('Network error. Failed to toggle status.');
    }
  };

  const handleDeleteUser = async (user: UserDetail) => {
    if (!confirm(`Are you sure you want to DELETE user "${user.fullName}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE',
      }).then(r => r.json());

      if (res.success) {
        toast.success('Staff member deleted successfully!');
        loadData();
      } else {
        alert(res.error || 'Failed to delete staff member.');
      }
    } catch {
      alert('Network error. Failed to delete user.');
    }
  };

  // Filter logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    
    const matchesProperty = 
      propertyFilter === 'ALL' || 
      (propertyFilter === 'GLOBAL' && !u.propertyId) ||
      u.propertyId === propertyFilter;

    const matchesRole = 
      roleFilter === 'ALL' || 
      u.role?.name === roleFilter;

    return matchesSearch && matchesProperty && matchesRole;
  });

  return (
    <div className="w-full space-y-6">
      
      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 md:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>

          {/* Property Filter */}
          <select
            value={propertyFilter}
            onChange={e => setPropertyFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-violet-500/50"
          >
            <option value="ALL">All Properties</option>
            <option value="GLOBAL">Global Access (No Property)</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.type === 'HOTEL' ? '🏨' : '🍽️'} {p.name}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-violet-500/50"
          >
            <option value="ALL">All Roles</option>
            {roles.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-violet-900/20 active:scale-[0.98] transition-all"
        >
          <UserPlus size={14} /> Add Staff Account
        </button>
      </div>

      {/* Staff Grid/Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="animate-spin text-violet-500" size={24} />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Loading staff directory...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 p-4 border border-rose-500/20 rounded-2xl bg-rose-500/5 text-rose-400 text-sm font-bold">
          {error}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-2xl">
          <Users size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">No matching staff accounts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => {
            const isBlocked = !user.isActive;
            return (
              <div 
                key={user.id}
                className={`relative rounded-2xl border bg-slate-900/40 p-5 space-y-4 hover:scale-[1.01] transition-all duration-200 ${
                  isBlocked 
                    ? 'border-rose-500/25 bg-rose-950/5' 
                    : 'border-white/5 hover:border-violet-500/30'
                }`}
              >
                {/* Active Indicator & Quick Status */}
                <span className={`absolute top-5 right-5 w-2.5 h-2.5 rounded-full ${
                  isBlocked ? 'bg-rose-500' : 'bg-emerald-500'
                }`} />

                {/* Avatar and Info Header */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-violet-900/30">
                    {user.fullName[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-sm leading-snug">{user.fullName}</h3>
                    <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                      <Briefcase size={9} /> {user.designation || user.role?.name || 'Staff'}
                    </p>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-1.5 border-t border-white/5 pt-3 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Mail size={11} className="text-slate-600 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={11} className="text-slate-600 shrink-0" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Building size={11} className="text-slate-600 shrink-0" />
                    <span className="truncate font-semibold text-slate-300">
                      {user.property?.name ? `${user.property.name}` : 'Global Portal Access'}
                    </span>
                  </div>
                  {user.posPin && (
                    <div className="flex items-center gap-2">
                      <Lock size={11} className="text-slate-600 shrink-0" />
                      <span>POS PIN: <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded text-white font-bold">{user.posPin}</span></span>
                    </div>
                  )}
                  {user.role?.name === 'DELIVERY_RIDER' && user.vehicleNumber && (
                    <div className="text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 inline-block">
                      🚴 Rider: {user.vehicleType} ({user.vehicleNumber})
                    </div>
                  )}
                </div>

                {/* Badge for Role */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    user.role?.name?.includes('ADMIN')
                      ? 'bg-violet-500/15 border-violet-500/30 text-violet-400'
                      : user.role?.name === 'DELIVERY_RIDER'
                      ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {user.role?.name || 'Staff'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5 border-t border-white/5 pt-3.5">
                  <button
                    onClick={() => openEditModal(user)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border border-white/8 hover:border-violet-500/30 bg-white/3 hover:bg-violet-500/5 text-[10px] font-bold text-slate-300 hover:text-violet-300 transition-all"
                  >
                    <Edit size={10} /> Edit
                  </button>
                  <button
                    onClick={() => handleToggleStatus(user)}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl border text-[10px] font-bold transition-all ${
                      isBlocked
                        ? 'border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400'
                        : 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 text-amber-400'
                    }`}
                  >
                    {isBlocked ? (
                      <><ShieldCheck size={10} /> Activate</>
                    ) : (
                      <><ShieldAlert size={10} /> Block</>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="p-1.5 rounded-xl border border-white/8 hover:border-rose-500/20 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-all"
                    title="Delete Account"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ── ADD/EDIT STAFF MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#0d0d1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-8">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
              <div>
                <p className="text-base font-black text-white">
                  {editingUser ? 'Update Staff Member Account' : 'Register New Staff Member'}
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                  Set user login credentials, POS permissions, shift targets and roles
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 max-h-[75vh] overflow-y-auto text-slate-800">
              <StaffMemberForm
                initialData={editingUser ? {
                  id: editingUser.staffMember?.id || '',
                  name: editingUser.fullName,
                  phone: editingUser.phone,
                  designation: editingUser.staffMember?.designation || editingUser.role?.name,
                  salary: editingUser.staffMember?.salary,
                  address: editingUser.staffMember?.address,
                  emergencyContact: editingUser.staffMember?.emergencyContact,
                  joiningDate: editingUser.staffMember?.joiningDate,
                  isActive: editingUser.isActive,
                  shiftHours: editingUser.staffMember?.shiftHours,
                  propertyId: editingUser.propertyId,
                  user: editingUser.email ? { email: editingUser.email } : null
                } as any : undefined}
                properties={properties}
                onSubmit={handleStaffFormSubmit}
                onCancel={() => setShowModal(false)}
                loading={modalLoading}
              />
              {modalError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold">
                  {modalError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
