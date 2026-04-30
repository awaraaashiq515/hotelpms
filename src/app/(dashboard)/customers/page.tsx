'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Edit, Trash2, User, Wallet, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SearchToolbar } from '@/components/shared/search-toolbar';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { customersApi, Customer } from '@/lib/api/customers';
import { paymentModesApi } from '@/lib/api/payment-modes';
import { Modal } from '@/components/ui/Modal';
import { CustomerForm } from '@/components/forms/customer-form';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete-modal';
import { useToast } from '@/components/ui/Toast';

export default function CustomerListingPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [selectedModeId, setSelectedModeId] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await customersApi.list();
      setCustomers(data || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    paymentModesApi.list().then(setPaymentModes).catch(console.error);
  }, []);

  const handleSettle = async () => {
    if (!selectedCustomer || !selectedModeId) return;
    setMutationLoading(true);
    try {
      await customersApi.settleBalance(selectedCustomer.id, {
        paymentModeId: selectedModeId,
        amount: selectedCustomer.pendingBalance || 0
      });
      showToast('Balance settled successfully', 'success');
      setIsSettleOpen(false);
      fetchCustomers();
    } catch (error: any) {
      showToast(error.message || 'Failed to settle balance', 'error');
    } finally {
      setMutationLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: Partial<Customer>) => {
    setMutationLoading(true);
    try {
      if (selectedCustomer) {
        await customersApi.update(selectedCustomer.id, data);
      } else {
        await customersApi.create(data);
      }
      setIsFormOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCustomer) return;
    setMutationLoading(true);
    try {
      await customersApi.delete(selectedCustomer.id);
      setIsDeleteOpen(false);
      fetchCustomers();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setMutationLoading(false);
    }
  };

  const filteredCustomers = (customers || []).filter((c: Customer) => {
    const searchLower = search.toLowerCase();
    const fullName = `${c.firstName} ${c.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (c.mobile || '').includes(search) ||
      (c.email || '').toLowerCase().includes(searchLower)
    );
  });

  const columns = [
    { 
      header: 'Mobile', 
      cell: (row: Customer) => (
        <span className="font-mono font-bold text-gray-900 dark:text-slate-100">{row.mobile || 'N/A'}</span>
      ),
      width: '150px'
    },
    { 
      header: 'Guest Detail', 
      cell: (row: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary">
             <User size={14} />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">
              {row.firstName} {row.lastName}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">{row.email || 'No email'}</span>
          </div>
        </div>
      ),
      width: '300px'
    },
    { 
      header: 'Loyalty Points', 
      cell: (row: Customer) => (
        <span className="text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md tracking-tighter">
          {row.loyaltyPoints} PTS
        </span>
      ),
      width: '120px'
    },
    { 
      header: 'Pending Balance', 
      cell: (row: Customer) => (
        <div className="flex flex-col">
          <span className={`text-xs font-black px-2 py-1 rounded-md tracking-tighter w-fit ${
            (row.pendingBalance || 0) > 0 
            ? 'text-red-600 bg-red-50 dark:bg-red-500/10' 
            : 'text-gray-400 bg-gray-50 dark:bg-slate-800'
          }`}>
            ₹{(row.pendingBalance || 0).toLocaleString()}
          </span>
          {(row.pendingBalance || 0) > 0 && (
            <button 
              onClick={() => {
                setSelectedCustomer(row);
                setIsSettleOpen(true);
              }}
              className="text-[10px] font-black text-pos-primary hover:underline mt-1 flex items-center gap-1 uppercase"
            >
              <CheckCircle2 size={10} />
              Settle Now
            </button>
          )}
        </div>
      ),
      width: '150px'
    },
    { 
      header: 'Recent Address', 
      cell: (row: Customer) => (
        <span className="text-[11px] text-gray-400 dark:text-slate-400 truncate max-w-[200px] block italic line-clamp-1">
          {row.address || 'No address provided'}
        </span>
      )
    },
    { 
      header: 'Actions', 
      cell: (row: Customer) => (
        <div className="flex items-center gap-2">
           <button 
             onClick={() => {
                setSelectedCustomer(row);
                setIsFormOpen(true);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 hover:text-pos-primary transition-colors"
            >
             <Edit size={16} />
           </button>
           <button 
             onClick={() => {
                setSelectedCustomer(row);
                setIsDeleteOpen(true);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-500 hover:text-red-600 transition-colors"
            >
             <Trash2 size={16} />
           </button>
        </div>
      ),
      width: '100px'
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Customer Listing" 
        subtitle="Guest Relationship Management"
        showBack
        backUrl="/operations"
        actions={
          <Button 
            onClick={() => {
              setSelectedCustomer(null);
              setIsFormOpen(true);
            }}
            className="bg-pos-primary hover:bg-red-700 text-white font-bold text-xs tracking-widest px-6 py-3 rounded-lg shadow-lg shadow-red-200"
          >
             ADD NEW GUEST
          </Button>
        }
      />

      <SearchToolbar 
        value={search}
        onChange={setSearch}
        placeholder="Search by name, phone or email..."
        actions={
          <Button variant="secondary" className="font-bold text-xs tracking-widest gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 dark:text-white px-4">
            <Filter size={16} />
            FILTERS
          </Button>
        }
      />

      <DataTable 
        columns={columns} 
        data={filteredCustomers} 
        loading={loading}
      />

      {/* Forms & Modals */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={selectedCustomer ? 'Edit Guest' : 'New Guest'}
      >
        <CustomerForm 
          initialData={selectedCustomer || undefined}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => setIsFormOpen(false)}
          loading={mutationLoading}
        />
      </Modal>

      {isDeleteOpen && (
        <ConfirmDeleteModal 
          title="Delete Guest"
          message={`Are you sure you want to delete profile of "${selectedCustomer?.firstName} ${selectedCustomer?.lastName}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setIsDeleteOpen(false)}
          loading={mutationLoading}
        />
      )}

      {/* Settle Balance Modal */}
      <Modal
        isOpen={isSettleOpen}
        onClose={() => setIsSettleOpen(false)}
        title="Settle Pending Balance"
      >
        <div className="space-y-6 p-4">
          <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-700">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Total Outstanding</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">₹{selectedCustomer?.pendingBalance?.toLocaleString()}</p>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Select Payment Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {paymentModes.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedModeId(mode.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedModeId === mode.id
                    ? 'border-pos-primary bg-pos-primary/5 ring-4 ring-pos-primary/10'
                    : 'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-400'
                  }`}
                >
                  <p className={`text-xs font-black uppercase tracking-widest ${selectedModeId === mode.id ? 'text-pos-primary' : ''}`}>
                    {mode.name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              variant="secondary" 
              className="flex-1 font-bold py-6 rounded-xl"
              onClick={() => setIsSettleOpen(false)}
            >
              CANCEL
            </Button>
            <Button 
              className="flex-1 bg-pos-primary hover:bg-red-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-red-200 dark:shadow-none disabled:opacity-50"
              onClick={handleSettle}
              disabled={!selectedModeId || mutationLoading}
            >
              {mutationLoading ? 'SETTLING...' : 'CONFIRM PAYMENT'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
