'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Search,
  Eye,
  X,
  Star
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    ACCEPTED: 'bg-blue-100 text-blue-700 border-blue-200',
    PROCESSING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    SHIPPED: 'bg-purple-100 text-purple-700 border-purple-200',
    OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700 border-orange-200',
    DELIVERED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-100 text-rose-700 border-rose-200',
  };

  return (
    <Badge className={`${styles[status] || 'bg-slate-100'} border font-bold text-[10px]`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  );
};

export default function B2BOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [trackingOrder, setTrackingOrder] = useState<any>(null);
  const [ratingOrder, setRatingOrder] = useState<any>(null);
  const [ratedOrders, setRatedOrders] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      if (sessionData.authenticated && sessionData.user.propertyId) {
        const res = await fetch(`/api/b2b/orders?propertyId=${sessionData.user.propertyId}`);
        const data = await res.json();
        setOrders(data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/b2b/orders?orderId=${id}`);
      const data = await res.json();
      setTrackingOrder(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleRateSupplier = (order: any) => {
    setRatingOrder(order);
  };

  const submitRating = async (ratingData: any) => {
    // Simulated API call
    console.log('Submitting Rating:', ratingData);
    setRatedOrders([...ratedOrders, ratingOrder.id]);
    setRatingOrder(null);
    // toast.success('Rating submitted successfully!');
  };

  const filteredOrders = orders.filter(o => 
    o.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="B2B Order History" 
        description="Track your inventory orders and supply chain"
      />

      {/* Rating Modal */}
      <AnimatePresence>
        {ratingOrder && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-8 border border-slate-100 dark:border-slate-800"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star size={40} className="text-amber-500 fill-amber-500" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Rate Supplier</h3>
                <p className="text-sm text-slate-500 mt-1">Order: {ratingOrder.orderNo}</p>
                <p className="text-[10px] font-bold text-pos-primary uppercase tracking-widest mt-2">{ratingOrder.supplier?.name}</p>
              </div>

              <div className="space-y-6">
                 {['Product Quality', 'Delivery Speed', 'Packaging', 'Service'].map((metric) => (
                    <div key={metric} className="flex flex-col items-center gap-2">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{metric}</p>
                       <div className="flex gap-2">
                          {[1,2,3,4,5].map((s) => (
                             <button 
                                key={s} 
                                className="hover:scale-110 transition-transform p-1"
                                onClick={() => {}} // In real app, update state
                             >
                                <Star size={24} className="text-amber-400 hover:fill-amber-400" />
                             </button>
                          ))}
                       </div>
                    </div>
                 ))}
              </div>

              <div className="mt-10 space-y-3">
                 <Button 
                   onClick={() => submitRating({})} 
                   className="w-full bg-slate-900 text-white h-14 rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all"
                 >
                    Submit Feedback
                 </Button>
                 <Button 
                   variant="ghost" 
                   onClick={() => setRatingOrder(null)} 
                   className="w-full h-12 rounded-xl text-slate-400 font-bold"
                 >
                    Maybe Later
                 </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tracking Modal */}
      <AnimatePresence>
        {trackingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                   <h3 className="text-xl font-black">{trackingOrder.orderNo}</h3>
                   <p className="text-xs text-slate-500">Supplier: {trackingOrder.supplier?.name}</p>
                </div>
                <Button variant="ghost" onClick={() => setTrackingOrder(null)} className="rounded-full w-10 h-10 p-0">
                  <X size={20} />
                </Button>
              </div>

              <div className="p-8">
                 <div className="relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                    <div className="space-y-8">
                       {['PENDING', 'ACCEPTED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((step) => {
                          const log = trackingOrder.statusLogs?.find((l: any) => l.status === step);
                          const isCompleted = !!log;
                          const isCurrent = trackingOrder.status === step;

                          return (
                            <div key={step} className="flex gap-6 relative">
                               <div className={`w-8 h-8 rounded-full z-10 flex items-center justify-center transition-all ${
                                  isCompleted ? 'bg-pos-primary text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                               }`}>
                                  {isCompleted ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                               </div>
                               <div>
                                  <h4 className={`font-black text-sm uppercase tracking-tight ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                     {step.replace(/_/g, ' ')}
                                  </h4>
                                  {log && (
                                     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        {format(new Date(log.createdAt), 'dd MMM, HH:mm')}
                                     </p>
                                  )}
                                  {isCurrent && (
                                     <Badge className="bg-pos-primary/10 text-pos-primary border-none text-[8px] mt-1 animate-pulse">In Progress</Badge>
                                  )}
                               </div>
                            </div>
                          );
                       })}
                    </div>
                 </div>

                 <div className="mt-10 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Order Items</p>
                    <div className="space-y-2">
                       {trackingOrder.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-xs">
                             <span>{item.product?.name} x {item.quantity}</span>
                             <span className="font-bold">₹{item.totalPrice}</span>
                          </div>
                       ))}
                       <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black">
                          <span>Total Amount</span>
                          <span className="text-pos-primary text-lg">₹{trackingOrder.totalAmount}</span>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Supplier..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border-none outline-none focus:ring-2 focus:ring-pos-primary transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2">
               <Clock size={16} /> Refresh
            </Button>
         </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.length > 0 ? filteredOrders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="p-0 overflow-hidden border-slate-200 dark:border-slate-800 hover:border-pos-primary/30 transition-all group">
                <div className="p-5 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 group-hover:bg-pos-primary/10 group-hover:text-pos-primary transition-colors">
                      <Package size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-tight">{order.orderNo}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Supplier</p>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{order.supplier.name}</p>
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                    <p className="text-lg font-black text-pos-primary">₹{order.totalAmount}</p>
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="flex items-center gap-2">
                    {order.status === 'DELIVERED' && !ratedOrders.includes(order.id) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRateSupplier(order)}
                        className="gap-2 text-amber-500 hover:bg-amber-50 font-black text-[10px] uppercase tracking-widest"
                      >
                         <Star size={16} className="fill-amber-500" /> Rate
                      </Button>
                    )}
                    <Button 
                       variant="ghost" 
                       size="sm" 
                       onClick={() => fetchOrderDetails(order.id)}
                       className="h-10 w-10 p-0 rounded-full hover:bg-pos-primary/10 hover:text-pos-primary"
                    >
                       <Eye size={18} />
                    </Button>
                    <Button 
                       variant="outline" 
                       size="sm" 
                       onClick={() => fetchOrderDetails(order.id)}
                       className="rounded-xl border-slate-200 dark:border-slate-800 group-hover:bg-pos-primary group-hover:text-white group-hover:border-pos-primary transition-all"
                    >
                       Track Order <ChevronRight size={16} className="ml-1" />
                    </Button>
                  </div>
                </div>
                
                <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ 
                      width: order.status === 'DELIVERED' ? '100%' : 
                             order.status === 'SHIPPED' ? '75%' :
                             order.status === 'PROCESSING' ? '50%' :
                             order.status === 'ACCEPTED' ? '25%' : '10%' 
                    }}
                    className={`h-full ${order.status === 'CANCELLED' ? 'bg-rose-500' : 'bg-pos-primary'}`}
                  />
                </div>
              </Card>
            </motion.div>
          )) : (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
               <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full mb-4">
                 <Package size={48} className="text-slate-300" />
               </div>
               <h3 className="text-xl font-bold">No B2B Orders Found</h3>
               <p className="text-slate-500 max-w-xs">You haven't placed any orders from the marketplace yet.</p>
               <Button onClick={() => window.location.href='/b2b/market'} className="mt-6 bg-pos-primary">
                 Go to Market
               </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
