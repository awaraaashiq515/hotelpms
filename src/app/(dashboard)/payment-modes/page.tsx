'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, Landmark, Edit, Trash2, Plus, Smartphone } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusButton } from '@/components/shared/status-button';
import { Button } from '@/components/ui/Button';
import { paymentModesApi, PaymentMode } from '@/lib/api/payment-modes';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function PaymentModesPage() {
  const [modes, setModes] = useState<PaymentMode[]>([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState<string>('');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<PaymentMode | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH',
    isActive: true
  });

  const fetchModes = async () => {
    setLoading(true);
    try {
      const data = await paymentModesApi.list();
      setModes(data || []);
    } catch (error) {
      console.error('Failed to fetch payment modes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModes();
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user.propertyId) {
          setPropertyId(data.user.propertyId);
        }
      })
      .catch(console.error);
  }, []);

  const getIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'CASH': return Wallet;
      case 'CARD': return CreditCard;
      case 'UPI': return Smartphone;
      case 'VOUCHER': return Landmark;
      default: return Landmark;
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId) return;
    setSubmitting(true);
    try {
      await paymentModesApi.create({ ...formData, propertyId });
      setIsAddOpen(false);
      setFormData({ name: '', type: 'CASH', isActive: true });
      fetchModes();
    } catch (error) {
      console.error('Failed to create:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMode) return;
    setSubmitting(true);
    try {
      await paymentModesApi.update(selectedMode.id, formData);
      setIsEditOpen(false);
      setSelectedMode(null);
      fetchModes();
    } catch (error) {
      console.error('Failed to update:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMode) return;
    setSubmitting(true);
    try {
      await paymentModesApi.delete(selectedMode.id);
      setIsDeleteOpen(false);
      setSelectedMode(null);
      fetchModes();
    } catch (error) {
      console.error('Failed to delete:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { 
      header: 'Mode Name', 
      cell: (row: PaymentMode) => {
        const Icon = getIcon(row.type);
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
               <Icon size={14} />
            </div>
            <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">{row.name}</span>
          </div>
        );
      },
      width: '350px'
    },
    { 
      header: 'Type', 
      cell: (row: PaymentMode) => (
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded">
          {row.type}
        </span>
      ),
      width: '200px'
    },
    { 
      header: 'Status', 
      cell: (row: PaymentMode) => (
        <StatusButton status={row.isActive ? 'active' : 'inactive'} />
      ),
      width: '150px'
    },
    { 
      header: 'Actions', 
      cell: (row: PaymentMode) => (
        <div className="flex items-center gap-2">
           <button 
             onClick={() => {
               setSelectedMode(row);
               setFormData({ name: row.name, type: row.type || 'CASH', isActive: row.isActive });
               setIsEditOpen(true);
             }}
             className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-pos-primary transition-colors"
           >
             <Edit size={16} />
           </button>
           <button 
             onClick={() => {
                setSelectedMode(row);
                setIsDeleteOpen(true);
             }}
             className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
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
        title="Payment Modes" 
        subtitle="Manage accepted payment methods"
        showBack
        backUrl="/operations"
        actions={
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-200"
          >
             <Plus size={16} className="mr-2" />
             ADD PAYMENT MODE
          </Button>
        }
      />

      <DataTable 
        columns={columns} 
        data={modes} 
        loading={loading}
      />

      {/* Add Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Payment Mode">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input 
            label="Name" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            placeholder="eg. Cash Register, GPay"
            required
          />
          <Select 
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'CARD', label: 'Card' },
              { value: 'UPI', label: 'UPI' },
              { value: 'VOUCHER', label: 'Voucher' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Mode</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Payment Mode">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input 
            label="Name" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            placeholder="eg. Cash Register, GPay"
            required
          />
          <Select 
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            options={[
              { value: 'CASH', label: 'Cash' },
              { value: 'CARD', label: 'Card' },
              { value: 'UPI', label: 'UPI' },
              { value: 'VOUCHER', label: 'Voucher' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Deletion">
         <div className="space-y-4">
           <p className="text-sm text-gray-600">Are you sure you want to delete <span className="font-bold text-gray-900">{selectedMode?.name}</span>? This action is irreversible.</p>
           <div className="flex justify-end gap-2 pt-4">
             <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
             <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white" loading={submitting}>Delete Mode</Button>
           </div>
         </div>
      </Modal>
    </div>
  );
}
