'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Search, Clock, DollarSign, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusButton } from '@/components/shared/status-button';
import { invoicesApi, Invoice } from '@/lib/api/invoices';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { InvoiceDetailModal } from '@/components/modals/invoice-detail-modal';

export default function DuesPage() {
  const { showToast } = useToast();
  const [dues, setDues] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const fetchDues = async () => {
    setLoading(true);
    try {
      // Fetch specifically UNPAID and PARTIAL invoices
      // Since our API filter doesn't support multiple statuses yet, we'll fetch all and filter client-side
      // or make two calls. For now, let's fetch all and filter.
      const data = await invoicesApi.list();
      const unpaidData = data.filter(inv => inv.paymentStatus !== 'PAID' && inv.invoiceStatus !== 'CANCELLED');
      setDues(unpaidData || []);
    } catch (error) {
      console.error('Failed to fetch dues:', error);
      showToast('Failed to load outstanding dues', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, []);

  const totalOutstanding = dues.reduce((acc, curr) => acc + curr.totalAmount, 0);

  const filteredDues = dues.filter(inv => 
    inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
    inv.guest?.firstName?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { 
      header: 'Invoice No', 
      cell: (row: Invoice) => (
        <span className="text-sm font-bold text-gray-900 uppercase">{row.invoiceNo}</span>
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
      header: 'Amount Due', 
      cell: (row: Invoice) => (
        <span className="text-sm font-black text-red-500 text-right">₹{row.totalAmount.toFixed(2)}</span>
      ),
      width: '150px'
    },
    { 
      header: 'Status', 
      cell: (row: Invoice) => (
        <StatusButton status={row.paymentStatus.toLowerCase() as any} />
      ),
      width: '150px'
    },
    { 
      header: 'Ageing', 
      cell: (row: Invoice) => {
        const days = Math.floor((Date.now() - new Date(row.invoiceDate).getTime()) / (1000 * 60 * 60 * 24));
        return (
          <div className="flex items-center gap-2 text-gray-400">
            <Clock size={12} />
            <span className="text-xs font-bold">{days} Days Old</span>
          </div>
        );
      },
      width: '150px'
    },
    { 
      header: 'Actions', 
      cell: (row: Invoice) => (
        <button 
          onClick={() => { setSelectedInvoice(row); setIsDetailOpen(true); }}
          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-pos-primary transition-colors"
        >
          <ExternalLink size={16} />
        </button>
      ),
      width: '100px'
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Outstanding Dues" 
        subtitle="Track unpaid invoices and customer balances"
        showBack
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 flex flex-col justify-center">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Outstanding</p>
          <h3 className="text-3xl font-black text-red-600">₹{totalOutstanding.toFixed(2)}</h3>
        </div>
        <div className="bg-orange-50 p-8 rounded-3xl border border-orange-100 flex flex-col justify-center">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">Count</p>
          <h3 className="text-3xl font-black text-orange-600">{dues.length} Invoices</h3>
        </div>
        <div className="bg-pos-primary/10 p-8 rounded-3xl border border-pos-primary/20 flex flex-col justify-center">
          <p className="text-[10px] font-black text-pos-primary/60 uppercase tracking-widest mb-1">Risk Status</p>
          <h3 className="text-3xl font-black text-pos-primary">{totalOutstanding > 10000 ? 'Attention Needed' : 'Normal'}</h3>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 bg-gray-50/30">
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
        </div>

        <DataTable 
          columns={columns} 
          data={filteredDues} 
          loading={loading}
        />
      </div>

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
    </div>
  );
}
