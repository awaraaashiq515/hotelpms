'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { 
  Trash2, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  TrendingDown, 
  AlertCircle, 
  Clock, 
  User,
  MoreVertical,
  ChevronRight,
  PieChart,
  BarChart,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function WasteManagementPage() {
  const [wasteData, setWasteData] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    reason: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  // Manual Entry Form State
  const [form, setForm] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    reason: 'Damaged',
    notes: '',
    staffName: '',
  });

  const reasons = [
    'Refunded',
    'Burnt',
    'Expired',
    'Damaged',
    'Wrong Order',
    'Customer Return',
    'Kitchen Mistake',
    'Extra Prepared',
  ];

  const statuses = ['RECORDED', 'REVIEWED', 'DISPOSED'];

  useEffect(() => {
    fetchData();
    fetchProducts();
  }, [filters, searchQuery]);

  async function fetchData() {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        query: searchQuery,
        reason: filters.reason,
        status: filters.status,
        startDate: filters.startDate,
        endDate: filters.endDate,
      });

      const [wasteRes, analyticsRes] = await Promise.all([
        fetch(`/api/waste?${queryParams}`).then(res => res.json()),
        fetch(`/api/waste/analytics?${queryParams}`).then(res => res.json())
      ]);

      if (wasteRes.success) setWasteData(wasteRes.data);
      if (analyticsRes.success) setAnalytics(analyticsRes.data);
    } catch (error) {
      toast.error('Failed to fetch waste data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products').then(res => res.json());
      if (res.success) setProducts(res.data);
    } catch (error) {}
  }

  const handleAddWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedProduct = products.find(p => p.id === form.productId);
      const payload = {
        ...form,
        productName: selectedProduct ? selectedProduct.name : form.productName,
        costPrice: selectedProduct ? selectedProduct.costPrice : 0,
      };

      const res = await fetch('/api/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(res => res.json());

      if (res.success) {
        toast.success('Waste record added');
        setIsAddModalOpen(false);
        setForm({ productId: '', productName: '', quantity: 1, reason: 'Damaged', notes: '', staffName: '' });
        fetchData();
      } else {
        toast.error(res.message || 'Failed to add record');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const exportToExcel = () => {
    const dataToExport = wasteData.map(item => ({
      'Date': new Date(item.createdAt).toLocaleString(),
      'Product': item.productName,
      'Qty': item.quantity,
      'Reason': item.reason,
      'Total Cost': item.totalCost,
      'Staff': item.staffName,
      'Status': item.status,
      'Notes': item.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Waste Records');
    XLSX.writeFile(wb, `Waste_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/waste/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).then(res => res.json());

      if (res.success) {
        toast.success('Status updated');
        setWasteData(prev => prev.map(w => w.id === id ? { ...w, status: newStatus } : w));
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`/api/waste/${id}`, {
        method: 'DELETE',
      }).then(res => res.json());

      if (res.success) {
        toast.success('Record deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete record');
    }
  };

  const columns = [
    {
      header: 'Product',
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
            <Trash2 size={14} />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{row.productName}</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">
              {row.orderNo ? `Order: ${row.orderNo}` : 'Manual Entry'}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Qty',
      accessorKey: 'quantity' as any,
      width: '80px'
    },
    {
      header: 'Reason',
      cell: (row: any) => (
        <Badge 
          variant={row.reason === 'Refunded' ? 'warning' : 'error'}
          className="font-black uppercase tracking-widest text-[9px]"
        >
          {row.reason}
        </Badge>
      )
    },
    {
      header: 'Cost (Loss)',
      cell: (row: any) => (
        <span className="font-bold text-red-600 dark:text-red-400">
          ₹{row.totalCost.toFixed(2)}
        </span>
      )
    },
    {
      header: 'Staff',
      cell: (row: any) => (
        <div className="flex items-center gap-2 text-xs">
          <User size={12} className="text-gray-400" />
          <span>{row.staffName}</span>
        </div>
      )
    },
    {
      header: 'Date & Time',
      cell: (row: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-medium">{new Date(row.createdAt).toLocaleDateString()}</span>
          <span className="text-[10px] text-gray-400">{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row: any) => (
        <select 
          value={row.status}
          onChange={(e) => updateStatus(row.id, e.target.value)}
          className="bg-transparent text-[10px] font-bold uppercase tracking-widest border-none focus:ring-0 p-0 cursor-pointer text-blue-500"
        >
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    },
    {
      header: '',
      cell: (row: any) => (
        <button 
          onClick={() => deleteRecord(row.id)}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 lg:space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader 
          title="Waste Management" 
          description="Track food waste, refunds, and kitchen rejections to optimize costs."
        />
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            className="flex-1 md:flex-none"
          >
            <Download size={14} className="mr-2" /> Export
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white border-none shadow-lg shadow-red-200 dark:shadow-none"
          >
            <Plus size={14} className="mr-2" /> Add Waste
          </Button>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Loss</p>
              <h3 className="text-2xl font-black text-red-600 tracking-tight">₹{analytics?.summary?.totalCost?.toLocaleString() || '0'}</h3>
            </div>
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-2xl text-red-500">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Across {analytics?.summary?.totalEntries || 0} entries</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Total Quantity</p>
              <h3 className="text-2xl font-black text-amber-600 tracking-tight">{analytics?.summary?.totalQuantity || '0'} Units</h3>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-2xl text-amber-500">
              <Trash2 size={20} />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total products wasted</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Most Frequent Reason</p>
              <h3 className="text-xl font-black text-blue-600 tracking-tight truncate max-w-[150px]">
                {analytics?.byReason?.[0]?.reason || 'N/A'}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-2xl text-blue-500">
              <PieChart size={20} />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Based on entry count</p>
        </Card>

        <Card className="p-6 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Daily Trend</p>
              <div className="flex items-end gap-1 h-8 mt-1">
                {analytics?.dailyTrend?.slice(-10).map((t: any, i: number) => (
                  <div 
                    key={i} 
                    className="w-2 bg-emerald-500/50 rounded-t-sm hover:bg-emerald-500 transition-all cursor-help"
                    style={{ height: `${Math.min(100, (t.cost / (analytics.summary.totalCost || 1)) * 300)}%` }}
                    title={`${t.date}: ₹${t.cost}`}
                  />
                ))}
              </div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl text-emerald-500">
              <BarChart size={20} />
            </div>
          </div>
          <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Last 10 active days</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-gray-50/50 dark:bg-slate-900/50 border-none">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder="Search by product, order, staff..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Select 
              value={filters.reason}
              onChange={(e: any) => setFilters(v => ({ ...v, reason: e.target.value }))}
              options={[{ label: 'All Reasons', value: 'all' }, ...reasons.map(r => ({ label: r, value: r }))]}
              className="h-11 min-w-[150px]"
            />
            <Select 
              value={filters.status}
              onChange={(e: any) => setFilters(v => ({ ...v, status: e.target.value }))}
              options={[{ label: 'All Status', value: 'all' }, ...statuses.map(s => ({ label: s, value: s }))]}
              className="h-11 min-w-[150px]"
            />
            <div className="flex items-center gap-2">
               <Input 
                 type="date" 
                 value={filters.startDate}
                 onChange={(e) => setFilters(v => ({ ...v, startDate: e.target.value }))}
                 className="h-11 text-[10px]"
               />
               <span className="text-gray-400">-</span>
               <Input 
                 type="date" 
                 value={filters.endDate}
                 onChange={(e) => setFilters(v => ({ ...v, endDate: e.target.value }))}
                 className="h-11 text-[10px]"
               />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3">
          <DataTable 
            columns={columns} 
            data={wasteData} 
            loading={loading}
          />
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
          <Card className="p-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">Most Wasted Items</h4>
            <div className="space-y-4">
              {analytics?.topWasted?.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate pr-2">{p.productName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{p._sum.quantity} wasted</p>
                  </div>
                  <span className="text-[11px] font-black text-red-500 shrink-0">₹{p._sum.totalCost.toFixed(0)}</span>
                </div>
              ))}
              {(!analytics?.topWasted || analytics.topWasted.length === 0) && (
                <p className="text-xs text-gray-400 italic">No data yet</p>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-slate-800 pb-4">Waste by Staff</h4>
            <div className="space-y-4">
              {analytics?.byStaff?.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-[10px] font-bold text-indigo-500">
                      {s.staffName.charAt(0)}
                    </div>
                    <span className="text-xs font-bold">{s.staffName}</span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500">{s._count.id} entries</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Manual Entry Modal */}
      <Modal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        title="Record Food Waste"
      >
        <form onSubmit={handleAddWaste} className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Product</label>
              <Select 
                value={form.productId}
                onChange={(e: any) => setForm(v => ({ ...v, productId: e.target.value }))}
                options={[
                  { label: 'Select Product', value: '' },
                  ...products.map(p => ({ label: p.name, value: p.id }))
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Quantity</label>
              <Input 
                type="number" 
                value={form.quantity} 
                onChange={(e) => setForm(v => ({ ...v, quantity: parseFloat(e.target.value) }))}
                min={0.1}
                step={0.1}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reason</label>
              <Select 
                value={form.reason}
                onChange={(e: any) => setForm(v => ({ ...v, reason: e.target.value }))}
                options={reasons.map(r => ({ label: r, value: r }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Staff Name</label>
              <Input 
                placeholder="Name of staff responsible" 
                value={form.staffName} 
                onChange={(e) => setForm(v => ({ ...v, staffName: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Additional Notes</label>
            <textarea 
              className="w-full h-24 p-3 text-sm rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-pos-primary/20 outline-none resize-none"
              placeholder="Explain why this was wasted..."
              value={form.notes}
              onChange={(e) => setForm(v => ({ ...v, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-4">
             <Button variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
             <Button className="flex-1 bg-red-600 text-white border-none" type="submit">Record Loss</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
