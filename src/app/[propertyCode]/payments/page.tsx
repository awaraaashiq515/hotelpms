'use client';

import React, { useState, useEffect } from 'react';
import { paymentsApi, Settlement } from '@/lib/api/payments';
import { DataTable } from '@/components/shared/data-table';
import { Button } from '@/components/ui/Button';
import { Plus, Receipt, Building2, ChevronDown } from 'lucide-react';
import { format, isValid } from 'date-fns';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { useToast } from '@/components/ui/Toast';

interface EnhancedSettlement extends Settlement {
  invoiceNo?: string;
  guestName?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<EnhancedSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [properties, setProperties] = useState<any[]>([]);
  const [session, setSession] = useState<any>(null);
  const { addToast } = useToast();

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
    fetchPayments();
  }, [selectedPropertyId]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.list({
        propertyId: selectedPropertyId === 'all' ? undefined : selectedPropertyId
      });
      setPayments(Array.isArray(data) ? data as EnhancedSettlement[] : []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      addToast('error', 'Failed to load payments');
    } finally {
      setLoading(false);
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

  const columns = [
    {
      header: 'Receipt No',
      cell: (row: EnhancedSettlement) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pos-primary/10 text-pos-primary flex items-center justify-center">
            <Receipt size={14} />
          </div>
          <span className="font-bold text-gray-900 dark:text-white uppercase tracking-tight">{row.settlementNo}</span>
        </div>
      )
    },
    {
      header: 'Date',
      cell: (row: EnhancedSettlement) => {
        const date = new Date(row.settlementDate);
        return isValid(date) ? format(date, 'dd MMM yyyy HH:mm') : 'N/A';
      },
      width: '180px'
    },
    {
      header: 'Customer',
      cell: (row: EnhancedSettlement) => (
        <span className="font-bold text-gray-900 dark:text-gray-100">{row.guestName || 'N/A'}</span>
      ),
      width: '200px'
    },
    {
      header: 'Property',
      cell: (row: any) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-pos-primary uppercase tracking-widest bg-pos-primary/5 dark:bg-pos-primary/20 px-2 py-1 rounded-md border border-pos-primary/10 dark:border-pos-primary/30 inline-block w-fit">
            {row.property?.name || 'Main Branch'}
          </span>
          <span className="text-[9px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-1">{row.property?.city}</span>
        </div>
      ),
      width: '180px'
    },
    {
      header: 'Invoice No',
      cell: (row: EnhancedSettlement) => (
        <Link href={`/invoices?search=${row.invoiceNo}`} className="text-pos-primary hover:underline font-bold">
          {row.invoiceNo || 'N/A'}
        </Link>
      )
    },
    {
      header: 'Amount',
      cell: (row: EnhancedSettlement) => (
        <span className="font-bold text-emerald-600">₹{row.paidAmount.toLocaleString()}</span>
      )
    },
    {
      header: 'Status',
      cell: (row: EnhancedSettlement) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
          row.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Payment History"
        subtitle="Track all revenue settlements"
        showBack
        backUrl="/operations"
        actions={
          <div className="flex items-center gap-3">
             {['SUPER_ADMIN', 'RESTAURANTS_ADMIN'].includes(session?.role) && properties.length > 0 && (
              <div className="relative group">
                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-pos-primary transition-colors z-10" />
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-widest text-gray-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-pos-primary/20 transition-all appearance-none cursor-pointer min-w-[200px]"
                >
                  <option value="all">ALL PROPERTIES</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform group-hover:translate-y-[-40%]" />
              </div>
            )}
            
            <Link href="/payments/receive">
              <Button className="bg-pos-primary hover:bg-pos-primary/90 text-white rounded-xl px-6 py-2.5 font-bold text-xs uppercase tracking-widest shadow-lg shadow-pos-primary/20">
                <Plus size={18} className="mr-2" />
                Receive Payment
              </Button>
            </Link>
          </div>
        }
      />

      <DataTable 
        columns={columns} 
        data={payments} 
        loading={loading} 
      />
    </div>
  );
}
