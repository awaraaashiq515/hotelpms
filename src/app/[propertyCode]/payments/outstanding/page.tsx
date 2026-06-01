'use client';

import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Wallet, ArrowRight, User, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface OutstandingGuest {
  id: string;
  firstName: string;
  lastName?: string;
  mobile?: string;
  totalOutstanding: number;
  pendingInvoicesCount: number;
}

export default function OutstandingDuesPage() {
  const [data, setData] = useState<OutstandingGuest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOutstanding();
  }, []);

  const fetchOutstanding = async () => {
    setLoading(true);
    try {
      const response: any = await apiClient.get('/api/payments/outstanding');
      setData(response || []);
    } catch (err) {
      console.error('Failed to fetch outstanding:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalOutstandingSum = data.reduce((sum, item) => sum + item.totalOutstanding, 0);

  const columns = [
    {
      header: 'Customer',
      cell: (row: OutstandingGuest) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <User size={14} />
          </div>
          <div>
            <p className="font-bold text-gray-900">{row.firstName} {row.lastName || ''}</p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{row.mobile || 'No Mobile'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Pending Bills',
      cell: (row: OutstandingGuest) => (
        <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-lg font-bold text-xs border border-orange-100">
          {row.pendingInvoicesCount} Invoices
        </span>
      )
    },
    {
      header: 'Total Due',
      cell: (row: OutstandingGuest) => (
        <span className="text-lg font-black text-rose-600">₹{row.totalOutstanding.toLocaleString()}</span>
      )
    },
    {
      header: 'Actions',
      cell: (row: OutstandingGuest) => (
        <Link href={`/payments/receive?guestId=${row.id}`}>
          <Button className="bg-gray-900 hover:bg-black text-white rounded-xl text-xs py-2 group">
            Receive Payment
            <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/payments" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Outstanding Dues</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Monitor unpaid revenue across all customers</p>
          </div>
        </div>
        
        <div className="bg-rose-50 border border-rose-100 px-6 py-3 rounded-2xl flex items-center gap-4">
          <div className="p-2 bg-rose-600 text-white rounded-xl">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Total Global Outstanding</p>
            <p className="text-xl font-black text-rose-600 italic">₹{totalOutstandingSum.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {data.length > 0 ? (
        <DataTable 
          columns={columns} 
          data={data} 
          loading={loading} 
        />
      ) : !loading ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} />
          </div>
          <h3 className="text-lg font-black text-gray-900 uppercase">Clear Skies!</h3>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-tight max-w-xs mt-2">All customers have settled their amounts. No outstanding dues found.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={[]} loading={true} />
      )}
    </div>
  );
}
