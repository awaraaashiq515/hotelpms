'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  Download, 
  Printer, 
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

export default function SupplierInvoicesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.authenticated && sessionData.user.supplierId) {
        fetchInvoices(sessionData.user.supplierId);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchInvoices = async (sid: string) => {
    try {
      // Invoices are derived from DELIVERED orders for now
      const res = await fetch(`/api/b2b/orders?supplierId=${sid}`);
      const data = await res.json();
      setOrders(data.filter((o: any) => o.status === 'DELIVERED' || o.status === 'SHIPPED'));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Billing & Invoices" 
        description="Access and download invoices for your completed supply orders"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Invoiced</p>
                 <p className="text-xl font-black">₹{orders.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}</p>
              </div>
           </div>
        </Card>
        <Card className="p-6 border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Clock size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Payment</p>
                 <p className="text-xl font-black">{orders.filter(o => o.status !== 'DELIVERED').length}</p>
              </div>
           </div>
        </Card>
        <Card className="p-6 border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><CheckCircle2 size={24} /></div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Collected</p>
                 <p className="text-xl font-black">₹{orders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}</p>
              </div>
           </div>
        </Card>
      </div>

      <Card className="border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden">
         <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
               <FileText size={18} className="text-emerald-500" /> Invoice History
            </h3>
            <div className="relative w-full md:w-64">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input placeholder="Search Invoice No..." className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border-none rounded-xl text-[10px] font-bold uppercase outline-none" />
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-left border-b border-slate-50 dark:border-slate-800">
                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice Date</th>
                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice No.</th>
                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Restaurant</th>
                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                     <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {loading ? (
                    [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-8 bg-slate-50/30"></td></tr>)
                  ) : orders.length > 0 ? orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                       <td className="px-6 py-4 text-[10px] font-bold">{format(new Date(order.createdAt), 'dd MMM yyyy')}</td>
                       <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <FileText size={14} className="text-slate-300" />
                             <span className="text-[10px] font-black uppercase">{order.orderNo.replace('B2B-', 'INV-')}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4 text-[10px] font-black uppercase text-slate-600">{order.property?.name || order.buyerRestaurant || 'Direct QR Client'}</td>
                       <td className="px-6 py-4">
                          <Badge className="text-[7px] h-4 uppercase">{order.status === 'DELIVERED' ? 'PAID' : 'PENDING'}</Badge>
                       </td>
                       <td className="px-6 py-4 text-[10px] font-black">₹{order.totalAmount.toLocaleString()}</td>
                       <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 border-slate-100 dark:border-slate-800"><Download size={14} /></Button>
                             <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 border-slate-100 dark:border-slate-800"><Printer size={14} /></Button>
                          </div>
                       </td>
                    </tr>
                  )) : (
                    <tr>
                       <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-2 opacity-30">
                             <FileText size={40} />
                             <p className="text-[10px] font-black uppercase tracking-widest">No billing history available</p>
                          </div>
                       </td>
                    </tr>
                  )}
               </tbody>
            </table>
         </div>
      </Card>
    </div>
  );
}
