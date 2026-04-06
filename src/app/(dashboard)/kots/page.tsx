'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, ChevronRight, 
  Layers, Clock, MapPin, 
  CheckCircle2, AlertCircle, Eye
} from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { kotsApi, KotTicket } from '@/lib/api/kots';
import { format } from 'date-fns';

import { useSearchParams } from 'next/navigation';

export default function KotsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [kots, setKots] = useState<KotTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const fetchKots = async () => {
    try {
      const data = await kotsApi.list();
      setKots(data || []);
    } catch (error) {
      console.error('Failed to fetch KOTs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKots();
    const interval = setInterval(fetchKots, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredKots = useMemo(() => {
    if (!search) return kots;
    return kots.filter(row => 
      row.kotNo.toLowerCase().includes(search.toLowerCase()) || 
      (row.tableNo?.toLowerCase() || row.restaurantTableId?.toLowerCase() || '').includes(search.toLowerCase())
    );
  }, [search, kots]);

  const getStatusVariant = (status: string): 'info' | 'warning' | 'success' | 'error' | 'neutral' => {
    switch (status) {
      case 'NEW': return 'info';
      case 'PREPARING': return 'warning';
      case 'READY': return 'success';
      case 'SERVED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'neutral';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">KOTs Control</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Kitchen Order Tickets History</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Table/Room..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pos-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">KOT Info</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Source</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Items</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filteredKots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                    No KOTs found
                  </td>
                </tr>
              ) : (
                filteredKots.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 tracking-tight">{row.kotNo}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-0.5">
                          {row.order?.orderNo || 'POS-ORDER'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-pos-primary/10 flex items-center justify-center text-pos-primary">
                          <Layers size={14} />
                        </div>
                         <span className="text-xs font-bold text-gray-700 uppercase tracking-tight">
                            {row.tableNo ? `Table: ${row.tableNo}` : row.roomId ? `Room: ${row.roomId}` : 'Takeaway'}
                         </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-black text-gray-600">
                        {row.items?.length || 0} Items
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-700">
                          {format(new Date(row.createdAt), 'hh:mm a')}
                        </span>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          {format(new Date(row.createdAt), 'dd MMM')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getStatusVariant(row.status)}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/kots/${row.id}`}>
                        <Button variant="secondary" size="sm" className="h-8 w-8 p-0 rounded-lg">
                          <Eye size={14} />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
