'use client';

import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit, Trash2, Search, UserCheck, UserX } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusButton } from '@/components/shared/status-button';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { staffApi, StaffUser } from '@/lib/api/staff';
import { StaffForm } from '@/components/forms/staff-form';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';
import { useToast } from '@/components/ui/Toast';

export default function StaffPage() {
  const { showToast } = useToast();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffUser | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await staffApi.list();
      setStaff(data || []);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      showToast('Failed to load staff list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDelete = async () => {
    if (!selectedStaff) return;
    setMutationLoading(true);
    try {
      await staffApi.delete(selectedStaff.id);
      showToast('Staff member deleted', 'success');
      fetchStaff();
      setIsDeleteOpen(false);
    } catch (error: any) {
      showToast(error.message || 'Delete failed', 'error');
    } finally {
      setMutationLoading(false);
    }
  };

  const filteredStaff = staff.filter(s => 
    s.fullName.toLowerCase().includes(search.toLowerCase()) || 
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { 
      header: 'Full Name', 
      cell: (row: StaffUser) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary font-black text-[10px]">
             {row.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-900 dark:text-slate-200 uppercase tracking-tight">{row.fullName}</span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">{row.email}</span>
          </div>
        </div>
      ),
      width: '300px'
    },
    { 
      header: 'Role', 
      cell: (row: StaffUser) => (
        <span className="text-[10px] font-bold text-pos-primary uppercase tracking-widest bg-pos-primary/10 px-3 py-1 rounded-full">
          {row.role?.name || 'Staff'}
        </span>
      ),
      width: '150px'
    },
    { 
      header: 'Status', 
      cell: (row: StaffUser) => (
        <div className="flex items-center gap-2">
           <StatusButton status={row.isActive ? 'active' : 'inactive'} />
           {row.isActive ? <UserCheck size={14} className="text-emerald-500" /> : <UserX size={14} className="text-red-400" />}
        </div>
      ),
      width: '150px'
    },
    { 
      header: 'Actions', 
      cell: (row: StaffUser) => (
        <div className="flex items-center gap-2">
           <button 
             onClick={() => { setSelectedStaff(row); setIsFormOpen(true); }}
             className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-pos-primary transition-colors"
           >
             <Edit size={16} />
           </button>
           <button 
             onClick={() => { setSelectedStaff(row); setIsDeleteOpen(true); }}
             className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-600 transition-colors"
           >
             <Trash2 size={16} />
           </button>
        </div>
      ),
      width: '120px'
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Staff Access Control" 
        subtitle="Manage staff permissions and terminal access"
        showBack
        backUrl="/operations"
        actions={
          <Button 
            onClick={() => { setSelectedStaff(null); setIsFormOpen(true); }}
            className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-200"
          >
             <Plus size={16} className="mr-2" />
             ADD STAFF MEMBER
          </Button>
        }
      />

      <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-white/5 bg-gray-50/30 dark:bg-slate-900/20">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl text-xs w-full focus:ring-2 focus:ring-pos-primary/20 transition-all font-medium text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-600"
            />
          </div>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredStaff} 
          loading={loading}
        />
      </div>

      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={selectedStaff ? 'Edit Staff Member' : 'Add New Staff Member'}
      >
        <StaffForm 
          initialData={selectedStaff}
          onSuccess={() => { setIsFormOpen(false); fetchStaff(); }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      {isDeleteOpen && (
        <ConfirmDeleteModal 
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Staff Member"
          message={`Are you sure you want to delete ${selectedStaff?.fullName}? This action cannot be undone.`}
          loading={mutationLoading}
        />
      )}
    </div>
  );
}
