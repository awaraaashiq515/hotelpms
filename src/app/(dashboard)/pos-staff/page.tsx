'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Users, Phone, IndianRupee, Briefcase, Plus, UserCheck, UserX } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';
import { StaffMember, StaffMemberForm } from '@/components/forms/staff-member-form';

export default function PosStaffPage() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  const fetchStaffMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/staff-members');
      const result = await response.json();
      if (result.success) {
        setStaffMembers(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch staff members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffMembers();
  }, []);

  const handleCreateOrUpdate = async (data: any) => {
    setMutationLoading(true);
    try {
      const method = selectedStaff ? 'PUT' : 'POST';
      const url = selectedStaff ? `/api/staff-members/${selectedStaff.id}` : '/api/staff-members';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        setIsFormOpen(false);
        fetchStaffMembers();
      } else {
        alert(result.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;
    setMutationLoading(true);
    try {
      const response = await fetch(`/api/staff-members/${selectedStaff.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setIsDeleteOpen(false);
        fetchStaffMembers();
      } else {
        alert(result.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const filteredStaff = (staffMembers || []).filter((s: StaffMember) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || 
           (s.phone || '').includes(q) ||
           (s.designation || '').toLowerCase().includes(q);
  });

  const activeCount = staffMembers.filter(s => s.isActive).length;
  const totalSalary = staffMembers.reduce((sum, s) => sum + (s.salary || 0), 0);

  const columns = [
    { 
      header: 'Staff Member', 
      cell: (row: StaffMember) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-black text-[11px] shadow-sm shadow-red-200/40">
             {row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-gray-900 dark:text-slate-200 uppercase tracking-tight">
              {row.name}
            </span>
            {row.phone && (
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium flex items-center gap-1">
                <Phone size={9} /> {row.phone}
              </span>
            )}
          </div>
        </div>
      ),
      width: '260px'
    },
    { 
      header: 'Designation', 
      cell: (row: StaffMember) => (
        <span className="text-[10px] font-black text-pos-primary uppercase tracking-widest bg-pos-primary/10 px-3 py-1 rounded-full">
          {row.designation || 'Waiter'}
        </span>
      ),
      width: '140px'
    },
    { 
      header: 'Salary', 
      cell: (row: StaffMember) => (
        <div className="flex items-center gap-1">
          <IndianRupee size={12} className="text-emerald-500" />
          <span className="text-sm font-black text-gray-900 dark:text-slate-200 tracking-tight">
            {(row.salary || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[8px] font-bold text-gray-400 dark:text-slate-500 uppercase">/mo</span>
        </div>
      ),
      width: '130px'
    },
    { 
      header: 'Joining Date', 
      cell: (row: StaffMember) => (
        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
          {row.joiningDate 
            ? new Date(row.joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'}
        </span>
      ),
      width: '120px'
    },
    { 
      header: 'Status', 
      cell: (row: StaffMember) => (
        <div className="flex items-center gap-1.5">
          {row.isActive 
            ? <UserCheck size={14} className="text-emerald-500" />
            : <UserX size={14} className="text-pos-primary/50" />
          }
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md tracking-tighter ${row.isActive ? 'text-green-600 bg-green-50 dark:bg-emerald-500/10 dark:text-emerald-400' : 'text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400'}`}>
            {row.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>
      ),
      width: '110px'
    },
    { 
      header: 'Actions', 
      cell: (row: StaffMember) => (
        <div className="flex items-center gap-1">
           <button 
             onClick={() => { setSelectedStaff(row); setIsFormOpen(true); }}
             className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-pos-primary transition-colors"
           >
             <Edit size={15} />
           </button>
           <button 
             onClick={() => { setSelectedStaff(row); setIsDeleteOpen(true); }}
             className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-600 transition-colors"
           >
             <Trash2 size={15} />
           </button>
        </div>
      ),
      width: '100px'
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="POS Support Staff" 
        subtitle="Manage waiters, stewards & support staff for order assignment"
        showBack
        backUrl="/operations"
        actions={
          <Button 
            onClick={() => { setSelectedStaff(null); setIsFormOpen(true); }}
            className="bg-pos-primary hover:bg-pos-primary-dark text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-pos-primary/20"
          >
             <Plus size={16} className="mr-2" />
             ADD STAFF MEMBER
          </Button>
        }
      />

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-white/5 flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
            <Users size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Total Staff</p>
            <p className="text-3xl font-black text-gray-900 dark:text-slate-100 leading-none mt-1">{staffMembers.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-white/5 flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
            <Briefcase size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Active Members</p>
            <p className="text-3xl font-black text-gray-900 dark:text-slate-100 leading-none mt-1">{activeCount}</p>
            <p className="text-[10px] font-bold text-emerald-500 mt-0.5">
              {staffMembers.length > 0 ? Math.round((activeCount / staffMembers.length) * 100) : 0}% Active
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900/50 p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-white/5 flex items-center gap-5 transition-transform hover:-translate-y-1">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-inner">
            <IndianRupee size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-500">Total Monthly Salary</p>
            <p className="text-2xl font-black text-gray-900 dark:text-slate-100 leading-none mt-1">₹{totalSalary.toLocaleString('en-IN')}</p>
            <p className="text-[10px] font-bold text-orange-500 mt-0.5">
              Avg: ₹{staffMembers.length > 0 ? Math.round(totalSalary / staffMembers.length).toLocaleString('en-IN') : 0}/staff
            </p>
          </div>
        </div>
      </div>

      <SearchToolbar  
        value={search}
        onChange={setSearch}
        placeholder="Search by name, phone or designation..."
      />

      <DataTable 
        columns={columns} 
        data={filteredStaff} 
        loading={loading}
      />

      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
      >
        <StaffMemberForm 
          initialData={selectedStaff || undefined}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => setIsFormOpen(false)}
          loading={mutationLoading}
        />
      </Modal>

      {isDeleteOpen && (
        <ConfirmDeleteModal 
          title="Delete Staff Member"
          message={`Are you sure you want to remove "${selectedStaff?.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
          loading={mutationLoading}
        />
      )}
    </div>
  );
}
