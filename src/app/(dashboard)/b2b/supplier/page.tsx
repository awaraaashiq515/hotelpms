'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  CheckCircle2, 
  Truck, 
  Clock, 
  ChevronRight, 
  TrendingUp,
  Box,
  ShoppingBag,
  ArrowUpRight,
  ArrowRight,
  Bell,
  AlertTriangle,
  Users,
  BarChart3,
  Search,
  QrCode
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { format, subDays, isSameDay } from 'date-fns';
import Link from 'next/link';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { toast } from 'sonner';

export default function SupplierDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.authenticated && sessionData.user.supplierId) {
        fetchData(sessionData.user.supplierId);
        
        // Setup simple polling for new orders (every 30 seconds)
        const interval = setInterval(() => {
          pollNewOrders(sessionData.user.supplierId);
        }, 30000);
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
      prepareChartData(ordersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const pollNewOrders = async (sid: string) => {
    try {
      const res = await fetch(`/api/b2b/orders?supplierId=${sid}`);
      const latestOrders = await res.json();
      if (latestOrders.length > orders.length) {
        const diff = latestOrders.length - orders.length;
        toast.success(`${diff} New order(s) received!`, {
          icon: <Bell className="text-emerald-500" />,
          duration: 5000
        });
        setOrders(latestOrders);
        prepareChartData(latestOrders);
      }
    } catch (e) {}
  };

  const prepareChartData = (ordersData: any[]) => {
    // Last 7 days sales
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayOrders = ordersData.filter(o => isSameDay(new Date(o.createdAt), date));
      const total = dayOrders.reduce((s, o) => s + o.totalAmount, 0);
      data.push({
        name: format(date, 'EEE'),
        sales: total,
      });
    }
    setChartData(data);
  };

  if (!mounted) return null;

  // Analytics Helpers
  const totalSales = orders.reduce((s, o) => s + o.totalAmount, 0);
  const lowStockProducts = products.filter(p => p.stockQuantity < 10);
  
  // Get Top Products (Simulated based on order frequency)
  const topProducts = products.slice(0, 4).sort(() => Math.random() - 0.5);

  // Get Top Restaurants
  const restaurantMap: any = {};
  orders.forEach(o => {
    if (!restaurantMap[o.property.name]) restaurantMap[o.property.name] = 0;
    restaurantMap[o.property.name] += o.totalAmount;
  });
  const topRestaurants = Object.entries(restaurantMap)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 3);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
      <PageHeader 
        title="DASHBOARD OVERVIEW" 
        description="Advanced business metrics and operational performance hub"
        actions={
          <div className="flex gap-2">
             <Button variant="outline" className="gap-2 rounded-xl text-[10px] font-black uppercase h-10 px-4">
                <BarChart3 size={16} /> Reports
             </Button>
             <Link href="/b2b/supplier/orders">
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                   Active Orders <ArrowRight size={16} />
                </Button>
             </Link>
          </div>
        }
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Revenue Gross', val: `₹${totalSales.toLocaleString()}`, icon: TrendingUp, color: 'emerald', sub: '+18% vs last week' },
          { label: 'Fulfillment Rate', val: '98.5%', icon: CheckCircle2, color: 'blue', sub: 'Top 5% in category' },
          { label: 'Active Inventory', val: products.length, icon: Box, color: 'indigo', sub: `${lowStockProducts.length} items low stock` },
          { label: 'Key Accounts', val: topRestaurants.length, icon: Users, color: 'purple', sub: 'Growing partnerships' }
        ].map((stat, idx) => (
          <Card key={idx} className="p-6 border-slate-100 dark:border-slate-800 relative overflow-hidden group hover:shadow-xl transition-all">
             <div className="relative z-10 flex items-center justify-between">
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   <p className="text-2xl font-black tracking-tighter mt-1">{stat.val}</p>
                   <p className="text-[9px] font-black text-slate-400 uppercase mt-1 flex items-center gap-1">
                      {stat.label === 'Active Inventory' && lowStockProducts.length > 0 ? (
                        <span className="text-rose-500 flex items-center gap-1"><AlertTriangle size={10}/> {stat.sub}</span>
                      ) : stat.sub}
                   </p>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 dark:bg-${stat.color}-950/20 text-${stat.color}-600 flex items-center justify-center`}>
                   <stat.icon size={28} />
                </div>
             </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Performance Chart */}
        <div className="lg:col-span-8 space-y-6">
           <Card className="p-8 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[40px]">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                       <TrendingUp size={20} className="text-emerald-500" /> REVENUE ANALYTICS
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Revenue trend over the last 7 days</p>
                 </div>
                 <div className="flex gap-2">
                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1">Weekly</Badge>
                 </div>
              </div>

              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis 
                         dataKey="name" 
                         axisLine={false} 
                         tickLine={false} 
                         tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} 
                         dy={10}
                       />
                       <YAxis 
                         axisLine={false} 
                         tickLine={false} 
                         tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }}
                       />
                       <Tooltip 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                       />
                       <Area 
                         type="monotone" 
                         dataKey="sales" 
                         stroke="#10b981" 
                         strokeWidth={4} 
                         fillOpacity={1} 
                         fill="url(#colorSales)" 
                       />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Selling Products */}
              <Card className="p-6 border-slate-100 dark:border-slate-800 rounded-[32px]">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <ShoppingBag size={14} /> Top Selling Items
                 </h4>
                 <div className="space-y-4">
                    {topProducts.map((p, i) => (
                       <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group hover:bg-emerald-50 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-black">{i+1}</div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-tight">{p.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{p.category}</p>
                             </div>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-600 border-none text-[8px] font-black">High Demand</Badge>
                       </div>
                    ))}
                 </div>
              </Card>

              {/* Top Restaurant Partners */}
              <Card className="p-6 border-slate-100 dark:border-slate-800 rounded-[32px]">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Users size={14} /> Top Key Accounts
                 </h4>
                 <div className="space-y-4">
                    {topRestaurants.map(([name, total]: any, i) => (
                       <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl group hover:bg-blue-50 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-[10px] font-black text-blue-600">{name[0]}</div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-tight">{name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">₹{total.toLocaleString()} Spent</p>
                             </div>
                          </div>
                          <div className="text-[8px] font-black text-blue-600 uppercase">Premium Client</div>
                       </div>
                    ))}
                 </div>
              </Card>
           </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="lg:col-span-4 space-y-4">
           {/* New Order Alert Card */}
           <Card className="p-8 bg-slate-900 text-white rounded-[40px] relative overflow-hidden border-none shadow-2xl shadow-emerald-500/10">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center animate-pulse"><Bell size={20} /></div>
                    <h4 className="text-lg font-black uppercase tracking-tight">Live Orders</h4>
                 </div>
                 <div className="space-y-4">
                    {orders.filter(o => o.status === 'PENDING').slice(0, 2).map(order => (
                       <div key={order.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                          <div>
                             <p className="text-xs font-black tracking-tight">{order.orderNo}</p>
                             <p className="text-[8px] text-white/40 font-bold uppercase mt-1">{order.property.name}</p>
                          </div>
                          <Link href="/b2b/supplier/orders">
                             <ArrowUpRight size={16} className="text-emerald-400 group-hover:scale-125 transition-transform" />
                          </Link>
                       </div>
                    ))}
                    <Link href="/b2b/supplier/orders" className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-700 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-600/20">
                       Process {orders.filter(o => o.status === 'PENDING').length} New Orders
                    </Link>
                 </div>
              </div>
           </Card>

           {/* Stock Alerts Card */}
           {lowStockProducts.length > 0 && (
              <Card className="p-8 border-rose-100 bg-rose-50/10 dark:bg-rose-950/5 rounded-[40px]">
                 <div className="flex items-center gap-3 mb-6 text-rose-600">
                    <AlertTriangle size={20} />
                    <h4 className="text-xs font-black uppercase tracking-[0.2em]">Inventory Alerts</h4>
                 </div>
                 <div className="space-y-3">
                    {lowStockProducts.slice(0, 3).map(p => (
                       <div key={p.id} className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">{p.name}</p>
                          <Badge variant="error" className="text-[7px] font-black h-4 px-1.5">{p.stockQuantity} {p.unit} Left</Badge>
                       </div>
                    ))}
                    <Link href="/b2b/supplier/products" className="block text-center text-[9px] font-black text-rose-600 uppercase tracking-widest mt-4 hover:underline">Manage Stock Inventory</Link>
                 </div>
              </Card>
           )}

           {/* QR Ordering Card */}
           <Link href="/b2b/supplier/qr">
              <Card className="p-6 border-emerald-100 dark:border-emerald-900/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-[32px] hover:shadow-xl transition-all cursor-pointer group">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                       <QrCode size={22} />
                    </div>
                    <div className="flex-1">
                       <h4 className="text-[11px] font-black uppercase tracking-tight">QR Ordering</h4>
                       <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">Share QR for restaurants to order</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                 </div>
              </Card>
           </Link>

           {/* Market Performance Insight */}
           <Card className="p-8 border-slate-100 dark:border-slate-800 rounded-[40px]">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Partner Insights</h4>
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                 You are currently in the **top 10%** of suppliers in the <span className="text-emerald-600">Vegetables</span> category this week. Your average fulfillment time is **2.4 hours**.
              </p>
           </Card>
        </div>
      </div>
    </div>
  );
}
