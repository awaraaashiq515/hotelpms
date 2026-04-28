'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Search, Printer, Trash2, Eye, Filter, Building2, ChevronDown, ReceiptText, RotateCcw, Star } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusButton } from '@/components/shared/status-button';
import { invoicesApi, Invoice } from '@/lib/api/invoices';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { InvoiceDetailModal } from '@/components/modals/invoice-detail-modal';
import { CancelInvoiceModal } from '@/components/modals/cancel-invoice-modal';
import { PrintInvoiceModal } from '@/components/modals/print-invoice-modal';
import { InvoiceFilters } from '@/components/invoices/invoice-filters';

export default function InvoicesPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [properties, setProperties] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);

  // Modals
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    guestId: ''
  });

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoicesApi.list({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        propertyId: selectedPropertyId === 'all' ? undefined : selectedPropertyId,
        ...filters
      });
      setInvoices(data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      showToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (id: string) => {
    try {
      await invoicesApi.refund(id);
      showToast('Invoice refunded successfully', 'success');
      fetchInvoices();
    } catch (err) {
      showToast('Failed to refund invoice', 'error');
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await fetch('/api/admin/properties');
      const data = await res.json();
      if (data.success) setProperties(data.data);
    } catch (err) {
      console.error('Failed to fetch properties:', err);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setSession(data.user);
      })
      .catch(err => console.error('Failed to fetch session', err));
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, selectedPropertyId]);

  const handleCancel = async (reason: string) => {
    if (!selectedInvoice) return;
    setIsSubmitting(true);
    try {
      await invoicesApi.delete(selectedInvoice.id, reason);
      showToast('Invoice cancelled successfully', 'success');
      setIsCancelOpen(false);
      fetchInvoices();
    } catch (error: any) {
      showToast('Failed to cancel invoice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} invoices? This action cannot be undone and will renumber the remaining invoices.`)) return;

    setIsSubmitting(true);
    try {
      await invoicesApi.bulkDelete(Array.from(selectedIds));
      showToast(`${selectedIds.size} invoices deleted`, 'success');
      setSelectedIds(new Set());
      fetchInvoices();
    } catch (err) {
      showToast('Bulk delete failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInvoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInvoices.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const filteredInvoices = invoices.filter(inv => {
    const s = search.toLowerCase();
    return (
      inv.invoiceNo.toLowerCase().includes(s) ||
      inv.guest?.firstName?.toLowerCase().includes(s) ||
      inv.guest?.lastName?.toLowerCase().includes(s) ||
      inv.guest?.mobile?.includes(s) ||
      inv.tableNo?.toLowerCase().includes(s) ||
      inv.orderType?.toLowerCase().includes(s)
    );
  });

  const columns = [
    {
      header: (
        <input 
          type="checkbox" 
          checked={filteredInvoices.length > 0 && selectedIds.size === filteredInvoices.length}
          onChange={toggleSelectAll}
          className="w-4 h-4 rounded border-gray-300 text-pos-primary focus:ring-pos-primary cursor-pointer"
        />
      ),
      cell: (row: Invoice) => (
        <input 
          type="checkbox" 
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          className="w-4 h-4 rounded border-gray-300 text-pos-primary focus:ring-pos-primary cursor-pointer"
        />
      ),
      width: '40px'
    },
    { 
      header: 'Invoice No', 
      cell: (row: Invoice) => (
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800/50 flex items-center justify-center text-gray-400 group-hover:text-pos-primary transition-colors">
            <ReceiptText size={16} />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-pos-primary transition-colors tracking-tight uppercase">{row.invoiceNo}</span>
        </div>
      ),
      width: '250px'
    },
    { 
      header: 'Customer', 
      cell: (row: Invoice) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
            {row.guest ? `${row.guest.firstName} ${row.guest.lastName || ''}` : (
              <span className="text-indigo-600 dark:text-indigo-400">
                {row.tableNo ? `Table ${row.tableNo}` : (row.orderType || 'Walk-In Guest')}
              </span>
            )}
          </span>
          <span className="text-[10px] text-gray-400 font-bold">
            {row.guest?.mobile ? row.guest.mobile : (row.orderType ? row.orderType : 'No Mobile')}
          </span>
        </div>
      ),
      width: '250px'
    },
    {
      header: 'Property',
      cell: (row: any) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-pos-primary uppercase tracking-widest bg-pos-primary/5 dark:bg-pos-primary/20 px-2 py-1 rounded-md border border-pos-primary/10 dark:border-pos-primary/30 inline-block w-fit">
            {row.property?.name || 'Main Branch'}
          </span>
          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-1 transition-colors">
            {row.property?.city || 'Default'}
          </span>
        </div>
      ),
      width: '180px'
    },
    { 
      header: 'Total', 
      cell: (row: Invoice) => (
        <span className="text-sm font-bold text-gray-900 dark:text-white">₹{row.totalAmount.toFixed(2)}</span>
      ),
      width: '100px'
    },
    { 
      header: 'Paid', 
      cell: (row: Invoice) => (
        <span className="text-sm font-bold text-emerald-600">₹{row.paidAmount?.toFixed(2) || '0.00'}</span>
      ),
      width: '100px'
    },
    { 
      header: 'Due', 
      cell: (row: Invoice) => (
        <span className={`text-sm font-bold ${row.dueAmount && row.dueAmount > 0 ? 'text-orange-500' : 'text-gray-400 dark:text-slate-500'}`}>
          ₹{row.dueAmount?.toFixed(2) || '0.00'}
        </span>
      ),
      width: '100px'
    },
    { 
      header: 'Status', 
      cell: (row: Invoice) => (
        <div className="flex items-center gap-2">
           <select
             value={row.paymentStatus}
             onChange={async (e) => {
               const newStatus = e.target.value as any;
               try {
                 await invoicesApi.update(row.id, { paymentStatus: newStatus });
                 showToast('Status updated', 'success');
                 fetchInvoices();
               } catch (err) {
                 showToast('Update failed', 'error');
               }
             }}
             className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 transition-all ${
               row.paymentStatus === 'PAID' ? 'bg-emerald-50 text-emerald-600 focus:ring-emerald-200' : 
               row.paymentStatus === 'UNPAID' ? 'bg-orange-50 text-orange-600 focus:ring-orange-200' :
               row.paymentStatus === 'REFUNDED' ? 'bg-amber-50 text-amber-600 focus:ring-amber-200' :
               'bg-gray-50 text-gray-600'
             }`}
           >
             <option value="PAID">Paid</option>
             <option value="UNPAID">Unpaid</option>
             <option value="REFUNDED">Refunded</option>
             <option value="PARTIAL">Partial</option>
           </select>
           
           {row.invoiceStatus === 'CANCELLED' && (
             <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-full font-bold uppercase tracking-widest">Cancelled</span>
           )}
           {row.rating && (
             <div className="flex items-center gap-1 ml-2 text-amber-400">
               <Star size={10} fill="currentColor" />
               <span className="text-[10px] font-bold">{row.rating}</span>
             </div>
           )}
        </div>
      ),
      width: '180px'
    },
    { 
      header: 'Date', 
      cell: (row: Invoice) => (
        <span className="text-xs text-gray-500 dark:text-slate-400 font-bold">
          {new Date(row.invoiceDate).toLocaleDateString()}
        </span>
      ),
      width: '100px'
    },
    {
      header: 'Actions',
      cell: (row: Invoice) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSelectedInvoice(row); setIsDetailOpen(true); }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-pos-primary transition-colors"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => { setSelectedInvoice(row); setIsPrintOpen(true); }}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-emerald-600 transition-colors"
          >
            <Printer size={16} />
          </button>
          {row.invoiceStatus !== 'CANCELLED' && row.invoiceStatus !== 'REFUNDED' && (
            <>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to refund this invoice?')) {
                    handleRefund(row.id);
                  }
                }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"
                title="Refund Invoice"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => { setSelectedInvoice(row); setIsCancelOpen(true); }}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                title="Cancel Invoice"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      ),
      width: '120px'
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invoices"
        subtitle="Manage billing history and cancellations"
        showBack
      />

      <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-slate-800 bg-gray-50/30 dark:bg-slate-900/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-grow">
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-sm font-bold text-pos-primary bg-pos-primary/10 px-3 py-1.5 rounded-lg border border-pos-primary/20">
                  {selectedIds.size} Selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold border border-red-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              </div>
            ) : (
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search by invoice or guest..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs w-full focus:ring-2 focus:ring-pos-primary/20 transition-all font-medium dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {['SUPER_ADMIN', 'RESTAURANTS_ADMIN'].includes(session?.role) && properties.length > 0 && (
              <div className="relative group">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-pos-primary transition-colors z-10" />
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-pos-primary/20 transition-all appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="all">ALL PROPERTIES</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
              </div>
            )}
            <div className="flex bg-gray-100 dark:bg-slate-800/80 p-1 rounded-xl">
              {['ALL', 'PAID', 'UNPAID', 'PARTIAL'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                    statusFilter === status
                      ? 'bg-white dark:bg-slate-700 text-pos-primary shadow-sm'
                      : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <button 
              onClick={async () => {
                if (confirm('This will re-assign sequential numbers to ALL invoices chronologically. This action cannot be undone. Proceed?')) {
                  setIsSubmitting(true);
                  try {
                    const res = await fetch('/api/invoices/renumber', { method: 'POST' });
                    const data = await res.json();
                    if (data.success) {
                      showToast('Invoices renumbered successfully', 'success');
                      fetchInvoices();
                    } else {
                      throw new Error(data.message);
                    }
                  } catch (err: any) {
                    showToast(err.message || 'Failed to renumber', 'error');
                  } finally {
                    setIsSubmitting(false);
                  }
                }
              }}
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
              title="Fix invoice number sequence"
            >
              Fix Sequence
            </button>
            <button 
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`p-2 border rounded-xl transition-all ${
                isFiltersOpen ? 'bg-pos-primary/10 border-pos-primary/30 text-pos-primary shadow-sm dark:bg-pos-primary/20' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-400 dark:text-slate-500 hover:text-pos-primary dark:hover:text-pos-primary'
              }`}
            >
               <Filter size={16} />
            </button>
          </div>
        </div>

        {isFiltersOpen && (
          <InvoiceFilters 
            onClose={() => setIsFiltersOpen(false)}
            filters={filters}
            setFilters={setFilters}
            onApply={fetchInvoices}
            onReset={() => {
              const reset = { startDate: '', endDate: '', guestId: '' };
              setFilters(reset);
              // fetchInvoices will be called by useEffect if status changes, but here we call manually
              setLoading(true);
              invoicesApi.list({ status: statusFilter === 'ALL' ? undefined : statusFilter, ...reset })
                .then(setInvoices)
                .finally(() => setLoading(false));
            }}
          />
        )}

        <DataTable 
          columns={columns} 
          data={filteredInvoices} 
          loading={loading}
        />
      </div>

      {/* Modals */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Invoice Details"
      >
        {selectedInvoice && (
          <InvoiceDetailModal 
            invoiceId={selectedInvoice.id} 
            onClose={() => setIsDetailOpen(false)} 
          />
        )}
      </Modal>

      {isCancelOpen && selectedInvoice && (
        <CancelInvoiceModal
          onConfirm={handleCancel}
          onCancel={() => setIsCancelOpen(false)}
          loading={isSubmitting}
        />
      )}

      {isPrintOpen && selectedInvoice && (
        <PrintInvoiceModal
          invoice={selectedInvoice}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
}
