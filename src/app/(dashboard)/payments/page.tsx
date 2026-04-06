'use client';

import React, { useState, useEffect } from 'react';
import { paymentsApi, Settlement } from '@/lib/api/payments';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface EnhancedSettlement extends Settlement {
  invoiceNo?: string;
  guestName?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<EnhancedSettlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.list();
      setPayments(data as EnhancedSettlement[]);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: 'Receipt No',
      cell: (row: EnhancedSettlement) => (
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pos-primary/10 text-pos-primary rounded-lg">
            <Receipt size={14} />
          </div>
          <span className="font-bold">{row.settlementNo}</span>
        </div>
      )
    },
    {
      header: 'Date',
      cell: (row: EnhancedSettlement) => format(new Date(row.settlementDate), 'dd MMM yyyy HH:mm')
    },
    {
      header: 'Customer',
      cell: (row: EnhancedSettlement) => (
        <span className="font-semibold text-gray-900">{row.guestName || 'N/A'}</span>
      )
    },
    {
      header: 'Invoice No',
      cell: (row: EnhancedSettlement) => (
        <Link href={`/invoices?search=${row.invoiceNo}`} className="text-pos-primary hover:underline">
          {row.invoiceNo}
        </Link>
      )
    },
    {
      header: 'Amount',
      cell: (row: EnhancedSettlement) => (
        <span className="font-black text-emerald-600">₹{row.paidAmount.toLocaleString()}</span>
      )
    },
    {
      header: 'Status',
      cell: (row: EnhancedSettlement) => (
        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
          row.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Payment History</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Track all revenue settlements</p>
        </div>
        
        <Link href="/payments/receive">
          <Button className="bg-pos-primary hover:bg-pos-primary/90 text-white rounded-xl px-6 py-2">
            <Plus size={18} className="mr-2" />
            Receive Payment
          </Button>
        </Link>
      </div>

      <DataTable 
        columns={columns} 
        data={payments} 
        loading={loading} 
      />
    </div>
  );
}
