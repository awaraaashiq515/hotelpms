'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Bell, 
  BellRing, 
  Package, 
  CheckCircle2, 
  Clock,
  AlertTriangle,
  Truck,
  ShoppingBag,
  Volume2,
  VolumeX,
  Trash2,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

export default function SupplierNotificationsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [prevOrderCount, setPrevOrderCount] = useState(0);

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.authenticated && sessionData.user.supplierId) {
        fetchData(sessionData.user.supplierId);
        
        // Poll every 15 seconds for new notifications
        const interval = setInterval(() => {
          pollNewOrders(sessionData.user.supplierId);
        }, 15000);
        return () => clearInterval(interval);
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  const fetchData = async (sid: string) => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch(`/api/b2b/orders?supplierId=${sid}`),
        fetch(`/api/b2b/products?supplierId=${sid}`)
      ]);
      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();
      setOrders(ordersData);
      setProducts(productsData);
      setPrevOrderCount(ordersData.length);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const pollNewOrders = async (sid: string) => {
    try {
      const res = await fetch(`/api/b2b/orders?supplierId=${sid}`);
      const latestOrders = await res.json();
      if (latestOrders.length > prevOrderCount) {
        const diff = latestOrders.length - prevOrderCount;
        if (soundEnabled) {
          try { new Audio('/notification.mp3').play(); } catch(e) {}
        }
        toast.success(`🔔 ${diff} New order(s) received!`, { duration: 8000 });
        if (Notification.permission === 'granted') {
          new Notification('New B2B Order!', { body: `You have ${diff} new supply request(s)`, icon: '/favicon.ico' });
        }
        setOrders(latestOrders);
        setPrevOrderCount(latestOrders.length);
      }
    } catch (e) {}
  };

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Browser notifications enabled!');
        new Notification('Notifications Active', { body: 'You will now receive alerts for new orders.' });
      } else {
        toast.error('Browser notifications were denied.');
      }
    }
  };

  // Build notification list from orders + products
  const notifications = [
    ...orders.filter(o => o.status === 'PENDING').map(o => ({
      id: o.id, type: 'order_new', title: `New Order ${o.orderNo}`,
      desc: `${o.property.name} placed ₹${o.totalAmount.toLocaleString()} order`,
      time: o.createdAt, icon: ShoppingBag, color: 'emerald', urgent: true
    })),
    ...orders.filter(o => o.status === 'ACCEPTED').map(o => ({
      id: o.id, type: 'order_accepted', title: `Processing ${o.orderNo}`,
      desc: `Order accepted, awaiting fulfillment`,
      time: o.createdAt, icon: Package, color: 'blue', urgent: false
    })),
    ...orders.filter(o => o.status === 'SHIPPED').map(o => ({
      id: o.id, type: 'order_shipped', title: `Shipped ${o.orderNo}`,
      desc: `Order is in transit to ${o.property.name}`,
      time: o.createdAt, icon: Truck, color: 'purple', urgent: false
    })),
    ...orders.filter(o => o.status === 'DELIVERED').slice(0, 3).map(o => ({
      id: o.id, type: 'order_delivered', title: `Delivered ${o.orderNo}`,
      desc: `Successfully delivered to ${o.property.name}`,
      time: o.createdAt, icon: CheckCircle2, color: 'emerald', urgent: false
    })),
    ...products.filter(p => p.stockQuantity < 10).map(p => ({
      id: p.id, type: 'low_stock', title: `Low Stock: ${p.name}`,
      desc: `Only ${p.stockQuantity} ${p.unit} remaining — restock soon`,
      time: new Date().toISOString(), icon: AlertTriangle, color: 'rose', urgent: true
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  if (!mounted) return null;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
      <PageHeader 
        title="NOTIFICATIONS CENTER" 
        description="Real-time alerts for orders, stock levels and business updates"
        actions={
          <div className="flex gap-2">
             <Button 
               variant="outline" 
               onClick={() => setSoundEnabled(!soundEnabled)}
               className="gap-2 h-10 px-4 rounded-xl text-[10px] font-black uppercase"
             >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                Sound {soundEnabled ? 'On' : 'Off'}
             </Button>
             <Button 
               onClick={requestBrowserPermission}
               className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-10 px-5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20"
             >
                <BellRing size={16} /> Enable Browser Alerts
             </Button>
          </div>
        }
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-emerald-500/20 bg-emerald-50/5">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><ShoppingBag size={20} /></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">New Orders</p>
                 <p className="text-xl font-black">{orders.filter(o => o.status === 'PENDING').length}</p>
              </div>
           </div>
        </Card>
        <Card className="p-5">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Package size={20} /></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Processing</p>
                 <p className="text-xl font-black">{orders.filter(o => o.status === 'ACCEPTED' || o.status === 'PROCESSING').length}</p>
              </div>
           </div>
        </Card>
        <Card className="p-5">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><Truck size={20} /></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">In Transit</p>
                 <p className="text-xl font-black">{orders.filter(o => o.status === 'SHIPPED').length}</p>
              </div>
           </div>
        </Card>
        <Card className="p-5 border-rose-500/20 bg-rose-50/5">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center"><AlertTriangle size={20} /></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stock Alerts</p>
                 <p className="text-xl font-black">{products.filter(p => p.stockQuantity < 10).length}</p>
              </div>
           </div>
        </Card>
      </div>

      {/* Notification Feed */}
      <Card className="border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden">
         <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
               <Bell size={18} className="text-emerald-500" /> All Notifications
            </h3>
            <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black px-3 py-1">
               Polling every 15s
            </Badge>
         </div>

         <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {loading ? (
               [1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse bg-slate-50/30" />)
            ) : notifications.length > 0 ? notifications.map((n, idx) => (
               <div key={`${n.id}-${idx}`} className={`p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group ${n.urgent ? 'border-l-4 border-l-emerald-500' : ''}`}>
                  <div className="flex items-center gap-4">
                     <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-${n.color}-50 text-${n.color}-600 shrink-0`}>
                        <n.icon size={20} />
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <p className="text-[11px] font-black uppercase tracking-tight">{n.title}</p>
                           {n.urgent && <Badge variant="error" className="text-[7px] h-4">Urgent</Badge>}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{n.desc}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">{format(new Date(n.time), 'MMM dd, HH:mm')}</p>
                     {n.type.startsWith('order') && (
                        <Link href="/b2b/supplier/orders">
                           <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Eye size={14} /></Button>
                        </Link>
                     )}
                  </div>
               </div>
            )) : (
               <div className="py-20 text-center">
                  <Bell size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No notifications yet</p>
               </div>
            )}
         </div>
      </Card>
    </div>
  );
}
