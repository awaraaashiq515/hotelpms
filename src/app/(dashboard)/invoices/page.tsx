'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Search, Printer, Trash2, Eye, Filter } from 'lucide-react';
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

  // Modals
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter]);

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

  const filteredInvoices = invoices.filter(inv =>
    inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    inv.guest?.firstName?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { 
      header: 'Invoice No', 
      cell: (row: Invoice) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary">
             <FileText size={14} />
          </div>
          <span className="text-sm font-bold text-gray-900 uppercase tracking-tight">{row.invoiceNo}</span>
        </div>
      ),
      width: '200px'
    },
    { 
      header: 'Customer', 
      cell: (row: Invoice) => (
        <div className="flex flex-col">
          <span className="text-sm font-bold text-gray-900 capitalize">
            {row.guest ? `${row.guest.firstName} ${row.guest.lastName || ''}` : 'Walk-in Guest'}
          </span>
          <span className="text-[10px] text-gray-400 font-bold">{row.guest?.mobile || 'No Mobile'}</span>
        </div>
      ),
      width: '250px'
    },
    { 
      header: 'Total', 
      cell: (row: Invoice) => (
        <span className="text-sm font-black text-gray-900">₹{row.totalAmount.toFixed(2)}</span>
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
        <span className={`text-sm font-bold ${row.dueAmount && row.dueAmount > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
          ₹{row.dueAmount?.toFixed(2) || '0.00'}
        </span>
      ),
      width: '100px'
    },
    { 
      header: 'Status', 
      cell: (row: Invoice) => (
        <div className="flex items-center gap-2">
           <StatusButton status={row.paymentStatus.toLowerCase() as any} />
           {row.invoiceStatus === 'CANCELLED' && (
             <span className="text-[10px] bg-red-50 text-red-500 px-2 py-1 rounded-full font-black uppercase tracking-widest">Cancelled</span>
           )}
        </div>
      ),
      width: '150px'
    },
    { 
      header: 'Date', 
      cell: (row: Invoice) => (
        <span className="text-xs text-gray-500 font-medium">
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
          {row.invoiceStatus !== 'CANCELLED' && (
            <button
              onClick={() => { setSelectedInvoice(row); setIsCancelOpen(true); }}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
            >
              <Trash2 size={16} />
            </button>
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

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by invoice or guest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs w-full focus:ring-2 focus:ring-pos-primary/20 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {['ALL', 'PAID', 'UNPAID', 'PARTIAL'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                    statusFilter === status
                      ? 'bg-white text-pos-primary shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`p-2 border rounded-xl transition-all ${
                isFiltersOpen ? 'bg-pos-primary/10 border-pos-primary/30 text-pos-primary shadow-sm' : 'bg-white border-gray-200 text-gray-400 hover:text-pos-primary'
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
    </div>
  );
}
