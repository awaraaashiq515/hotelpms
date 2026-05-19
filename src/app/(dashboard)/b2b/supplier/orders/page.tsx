'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  CheckCircle2, 
  Truck, 
  Clock, 
  ChevronRight, 
  Search,
  Box,
  FileText,
  Printer,
  X,
  ShoppingBag,
  Filter,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SupplierOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [currentSupplierId, setCurrentSupplierId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.authenticated && sessionData.user.supplierId) {
        setCurrentSupplierId(sessionData.user.supplierId);
        fetchOrders(sessionData.user.supplierId);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchOrders = async (sid: string) => {
    try {
      const res = await fetch(`/api/b2b/orders?supplierId=${sid}`);
      const data = await res.json();
      setOrders(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching supplier orders:', error);
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch('/api/b2b/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status,
          note: `Status updated to ${status} by supplier`
        })
      });

      if (res.ok) {
        toast.success(`Order marked as ${status}`);
        if (currentSupplierId) fetchOrders(currentSupplierId);
        if (selectedOrder?.id === orderId) {
           setSelectedOrder({ ...selectedOrder, status });
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const rName = o.property?.name || o.buyerRestaurant || 'Direct QR Client';
    const matchesSearch = o.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         rName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const StatusActions = ({ order }: { order: any }) => {
    const btnClass = "w-full py-4 font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2";
    switch (order.status) {
      case 'PENDING':
        return <Button onClick={() => updateStatus(order.id, 'ACCEPTED')} className={`${btnClass} bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20`}>Accept Order <ArrowRight size={16}/></Button>;
      case 'ACCEPTED':
        return <Button onClick={() => updateStatus(order.id, 'PROCESSING')} className={`${btnClass} bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20`}>Start Processing <ArrowRight size={16}/></Button>;
      case 'PROCESSING':
        return <Button onClick={() => updateStatus(order.id, 'SHIPPED')} className={`${btnClass} bg-purple-600 hover:bg-purple-700 shadow-purple-500/20`}>Mark as Shipped <ArrowRight size={16}/></Button>;
      case 'SHIPPED':
        return <Button onClick={() => updateStatus(order.id, 'DELIVERED')} className={`${btnClass} bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20`}>Confirm Delivery <CheckCircle2 size={16}/></Button>;
      default:
        return <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-center text-[10px] font-black text-slate-400 uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800">Order Cycle Completed</div>;
    }
  };

  if (!mounted) return null;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      <PageHeader 
        title="ACTIVE ORDERS MANAGEMENT" 
        description="Track and fulfill active supply requests from restaurants"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Orders List */}
        <div className="lg:col-span-8 space-y-6">
           {/* Filters Bar */}
           <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-[24px] border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
                 {['ALL', 'PENDING', 'ACCEPTED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setStatusFilter(s)}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        statusFilter === s 
                        ? 'bg-slate-900 text-white shadow-lg' 
                        : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                       {s}
                    </button>
                 ))}
              </div>
              <div className="relative w-full md:w-64">
                 <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   placeholder="Search Order ID..."
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-bold outline-none uppercase"
                 />
              </div>
           </div>

           <div className="space-y-3">
              {loading ? (
                 [1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-900 rounded-[32px] animate-pulse" />)
              ) : filteredOrders.length > 0 ? filteredOrders.map(order => (
                 <Card 
                   key={order.id} 
                   className={`p-5 cursor-pointer transition-all relative overflow-hidden group border-slate-100 dark:border-slate-900 hover:border-emerald-500/30 ${selectedOrder?.id === order.id ? 'ring-2 ring-emerald-500 shadow-xl shadow-emerald-500/5' : 'bg-white dark:bg-slate-950'}`}
                   onClick={() => setSelectedOrder(order)}
                 >
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-5">
                          <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center shadow-sm ${
                             order.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 
                             order.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-600' : 
                             order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                          }`}>
                             <Package size={24} />
                          </div>
                          <div>
                             <div className="flex items-center gap-3">
                                <span className="text-sm font-black tracking-tighter text-slate-900 dark:text-white uppercase">{order.orderNo}</span>
                                <Badge className="text-[8px] font-black uppercase h-4 px-2">{order.status}</Badge>
                             </div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">{order.property?.name || order.buyerRestaurant || 'Direct QR Client'}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-black text-slate-900 dark:text-white">₹{order.totalAmount.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{format(new Date(order.createdAt), 'MMM dd, HH:mm')}</p>
                       </div>
                    </div>
                 </Card>
              )) : (
                 <div className="py-32 text-center bg-slate-50 dark:bg-slate-900/20 rounded-[48px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <ShoppingBag size={64} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-xl font-black text-slate-400 uppercase">No Orders Found</h3>
                    <p className="text-xs text-slate-400 mt-2">Try changing your filters or search terms</p>
                 </div>
              )}
           </div>
        </div>

        {/* Order Details Panel */}
        <div className="lg:col-span-4 sticky top-6">
           <AnimatePresence mode="wait">
              {selectedOrder ? (
                 <motion.div
                   key={selectedOrder.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: 20 }}
                 >
                    <Card className="p-8 border-slate-100 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden relative">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16" />
                       
                       <div className="flex justify-between items-start mb-8 relative z-10">
                          <div>
                             <h4 className="text-xl font-black uppercase tracking-tight">Order Details</h4>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Review & update fulfillment</p>
                          </div>
                          <button onClick={() => setSelectedOrder(null)} className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all"><X size={20} /></button>
                       </div>

                       <div className="space-y-8 relative z-10">
                          <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                             <div className="grid grid-cols-2 gap-6">
                                <div>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Customer</p>
                                   <p className="text-xs font-black mt-1 uppercase">{selectedOrder.property?.name || selectedOrder.buyerRestaurant || 'Direct QR Client'}</p>
                                </div>
                                <div className="text-right">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grand Total</p>
                                   <p className="text-lg font-black text-emerald-600 mt-1">₹{selectedOrder.totalAmount}</p>
                                </div>
                             </div>
                          </div>

                          <div>
                             <div className="flex items-center justify-between mb-4 px-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchased Items</p>
                                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase">{selectedOrder.items?.length} SKUs</p>
                             </div>
                             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                {selectedOrder.items?.map((item: any) => (
                                   <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-50 dark:border-slate-800">
                                      <div className="flex items-center gap-3">
                                         <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-[10px] font-black">{item.quantity}</div>
                                         <div>
                                            <p className="text-[11px] font-black uppercase">{item.product.name}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">₹{item.unitPrice} / {item.product.unit}</p>
                                         </div>
                                      </div>
                                      <p className="text-[11px] font-black">₹{item.totalPrice}</p>
                                   </div>
                                ))}
                             </div>
                          </div>

                          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                             <StatusActions order={selectedOrder} />
                             <div className="grid grid-cols-2 gap-3 mt-4">
                                <Button variant="outline" className="h-12 text-[10px] font-black uppercase tracking-widest rounded-2xl gap-2"><Printer size={16} /> Invoice</Button>
                                <Button variant="outline" className="h-12 text-[10px] font-black uppercase tracking-widest rounded-2xl text-rose-500 border-rose-100 hover:bg-rose-50">Cancel</Button>
                             </div>
                          </div>
                       </div>
                    </Card>
                 </motion.div>
              ) : (
                 <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 dark:bg-slate-900/30 rounded-[64px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[40px] shadow-xl mb-8 flex items-center justify-center text-slate-200">
                       <Box size={48} />
                    </div>
                    <h4 className="font-black text-slate-400 uppercase tracking-[0.2em] text-sm">Selection Required</h4>
                    <p className="text-xs text-slate-400 mt-3 max-w-[240px] mx-auto leading-relaxed font-medium">Click on any order card to view the manifest and manage shipment status.</p>
                 </div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
