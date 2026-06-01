'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  Download, 
  TrendingUp,
  Calendar,
  IndianRupee,
  BarChart3,
  PieChart
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell
} from 'recharts';

export default function SupplierReportsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.authenticated && sessionData.user.supplierId) {
        fetchData(sessionData.user.supplierId);
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
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (orders.length === 0) return;
    
    // Prepare CSV data
    const headers = ['Order No', 'Date', 'Customer', 'Total Amount', 'GST (18%)', 'Net Amount', 'Status'];
    const rows = orders.map(o => [
      o.orderNo,
      format(new Date(o.createdAt), 'dd-MM-yyyy'),
      o.property?.name || 'Unknown',
      o.totalAmount,
      (o.totalAmount * 0.18).toFixed(2),
      (o.totalAmount * 0.82).toFixed(2),
      o.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `GST_Report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) return null;

  const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
  const gstAmount = totalRevenue * 0.18; // 18% GST
  const netRevenue = totalRevenue - gstAmount;

  // Category-wise breakdown for pie chart
  const categoryMap: any = {};
  orders.forEach(o => {
    o.items?.forEach((item: any) => {
      const cat = item.product?.category || 'Uncategorized';
      if (!categoryMap[cat]) categoryMap[cat] = 0;
      categoryMap[cat] += item.totalPrice;
    });
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1'];

  // Weekly revenue bar chart
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.toDateString() === date.toDateString();
    });
    weeklyData.push({
      name: format(date, 'EEE'),
      revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0)
    });
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
      <PageHeader 
        title="GST & TAX REPORTS" 
        description="Financial summaries, GST breakdowns and revenue analytics"
        actions={
          <Button 
            onClick={handleExport}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-10 px-5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20"
          >
             <Download size={16} /> Export Report
          </Button>
        }
      />

      {/* Period Selector */}
      <div className="flex gap-2">
        {['This Week', 'This Month', 'Last Month', 'This Quarter'].map(p => (
           <button 
             key={p}
             onClick={() => setSelectedPeriod(p)}
             className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
               selectedPeriod === p 
               ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
               : 'bg-white dark:bg-slate-900 text-slate-400 hover:bg-slate-50'
             }`}
           >{p}</button>
        ))}
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 border-slate-100 dark:border-slate-800">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gross Revenue</p>
           <p className="text-2xl font-black tracking-tighter mt-2">₹{totalRevenue.toLocaleString()}</p>
           <p className="text-[9px] text-emerald-600 font-black uppercase mt-1">Before Tax</p>
        </Card>
        <Card className="p-6 border-amber-500/20 bg-amber-50/5">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GST Collected (18%)</p>
           <p className="text-2xl font-black tracking-tighter mt-2 text-amber-600">₹{gstAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
           <p className="text-[9px] text-amber-600 font-black uppercase mt-1">CGST + SGST</p>
        </Card>
        <Card className="p-6 border-emerald-500/20 bg-emerald-50/5">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Net Revenue</p>
           <p className="text-2xl font-black tracking-tighter mt-2 text-emerald-600">₹{netRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
           <p className="text-[9px] text-emerald-600 font-black uppercase mt-1">After GST Deduction</p>
        </Card>
        <Card className="p-6 border-slate-100 dark:border-slate-800">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Invoices</p>
           <p className="text-2xl font-black tracking-tighter mt-2">{orders.length}</p>
           <p className="text-[9px] text-slate-400 font-black uppercase mt-1">All Periods</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Revenue Chart */}
        <div className="lg:col-span-8">
           <Card className="p-8 border-slate-100 dark:border-slate-800 rounded-[32px]">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2 mb-8">
                 <BarChart3 size={18} className="text-emerald-500" /> Weekly Revenue Breakdown
              </h3>
              <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                       <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }} />
                       <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </Card>
        </div>

        {/* Category Breakdown Pie */}
        <div className="lg:col-span-4">
           <Card className="p-8 border-slate-100 dark:border-slate-800 rounded-[32px]">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-6">
                 <PieChart size={14} /> Category Breakdown
              </h3>
              {pieData.length > 0 ? (
                 <>
                    <div className="h-[200px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <RechartsPie>
                             <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                             </Pie>
                             <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px', fontWeight: 'bold' }} />
                          </RechartsPie>
                       </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                       {pieData.map((d: any, i) => (
                          <div key={i} className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] font-black uppercase">{d.name}</span>
                             </div>
                             <span className="text-[10px] font-black">₹{(d.value as number).toLocaleString()}</span>
                          </div>
                       ))}
                    </div>
                 </>
              ) : (
                 <p className="text-[10px] text-slate-400 font-bold text-center py-12">No data yet</p>
              )}
           </Card>
        </div>
      </div>

      {/* GST Summary Table */}
      <Card className="border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden">
         <div className="p-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
               <IndianRupee size={18} className="text-emerald-500" /> GST Summary
            </h3>
         </div>
         <table className="w-full">
            <thead>
               <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-50 dark:border-slate-800">
                  <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
               <tr><td className="px-6 py-4 text-[10px] font-bold">Gross Sales (Taxable Value)</td><td className="px-6 py-4 text-right text-[10px] font-black">₹{totalRevenue.toLocaleString()}</td></tr>
               <tr><td className="px-6 py-4 text-[10px] font-bold">CGST @ 9%</td><td className="px-6 py-4 text-right text-[10px] font-black text-amber-600">₹{(gstAmount / 2).toLocaleString(undefined, {maximumFractionDigits: 0})}</td></tr>
               <tr><td className="px-6 py-4 text-[10px] font-bold">SGST @ 9%</td><td className="px-6 py-4 text-right text-[10px] font-black text-amber-600">₹{(gstAmount / 2).toLocaleString(undefined, {maximumFractionDigits: 0})}</td></tr>
               <tr className="bg-slate-50/50"><td className="px-6 py-4 text-[10px] font-black uppercase">Total GST Liability</td><td className="px-6 py-4 text-right text-[10px] font-black text-rose-600">₹{gstAmount.toLocaleString(undefined, {maximumFractionDigits: 0})}</td></tr>
               <tr className="bg-emerald-50/30"><td className="px-6 py-4 text-[11px] font-black uppercase text-emerald-700">Net Payable Revenue</td><td className="px-6 py-4 text-right text-sm font-black text-emerald-600">₹{netRevenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</td></tr>
            </tbody>
         </table>
      </Card>
    </div>
  );
}
