'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { 
  Trash2, 
  Plus, 
  Search, 
  Download, 
  TrendingDown, 
  User,
  Package,
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

  const [form, setForm] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    reason: 'Damaged',
    notes: '',
    staffName: '',
  });

  const reasons = [
    'Refunded', 'Burnt', 'Expired', 'Damaged', 'Wrong Order', 
    'Customer Return', 'Kitchen Mistake', 'Extra Prepared',
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
        toast.success('Waste recorded');
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
    if (!confirm('Delete record?')) return;
    try {
      const res = await fetch(`/api/waste/${id}`, { method: 'DELETE' }).then(res => res.json());
      if (res.success) {
        toast.success('Deleted');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const columns = [
    {
      header: 'Product',
      cell: (row: any) => (
        <div>
          <p className="font-bold text-gray-900 dark:text-white text-xs">{row.productName}</p>
          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">
            {row.orderNo ? `Order: ${row.orderNo}` : 'Manual'}
          </p>
        </div>
      )
    },
    {
      header: 'Qty',
      cell: (row: any) => <span className="text-xs font-bold">{row.quantity}</span>,
      width: '60px'
    },
    {
      header: 'Reason',
      cell: (row: any) => (
        <span className="text-[9px] font-black uppercase tracking-tighter text-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded">
          {row.reason}
        </span>
      )
    },
    {
      header: 'Loss',
      cell: (row: any) => <span className="text-xs font-bold text-red-600">₹{row.totalCost.toFixed(0)}</span>,
      width: '80px'
    },
    {
      header: 'Staff',
      cell: (row: any) => <span className="text-xs text-gray-500">{row.staffName}</span>
    },
    {
      header: 'Date',
      cell: (row: any) => (
        <div className="flex flex-col text-[10px]">
          <span className="font-medium">{new Date(row.createdAt).toLocaleDateString()}</span>
          <span className="text-gray-400">{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )
    },
    {
      header: 'Status',
      cell: (row: any) => (
        <select 
          value={row.status}
          onChange={(e) => updateStatus(row.id, e.target.value)}
          className="bg-transparent text-[9px] font-bold uppercase tracking-tight border-none focus:ring-0 p-0 cursor-pointer text-blue-500"
        >
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      )
    },
    {
      header: '',
      cell: (row: any) => (
        <button onClick={() => deleteRecord(row.id)} className="p-1 text-gray-300 hover:text-red-500">
          <Trash2 size={12} />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">Waste Records</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Inventory Loss & Rejections</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel} className="h-8 text-[10px] uppercase font-bold">
            <Download size={12} className="mr-1.5" /> Export
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="h-8 text-[10px] uppercase font-bold bg-red-600 hover:bg-red-700 text-white border-none">
            <Plus size={12} className="mr-1.5" /> Add Waste
          </Button>
        </div>
      </div>

      {/* Simple Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 flex items-center gap-3 bg-gray-50/50 border-none">
          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600"><TrendingDown size={16}/></div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Total Loss</p>
            <p className="text-sm font-black text-red-600">₹{analytics?.summary?.totalCost?.toFixed(0) || '0'}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3 bg-gray-50/50 border-none">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><Package size={16}/></div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Total Qty</p>
            <p className="text-sm font-black text-amber-600">{analytics?.summary?.totalQuantity || '0'}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3 bg-gray-50/50 border-none">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><User size={16}/></div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Top Reason</p>
            <p className="text-xs font-black text-blue-600 truncate max-w-[100px]">{analytics?.byReason?.[0]?.reason || '-'}</p>
          </div>
        </Card>
        <Card className="p-3 flex items-center gap-3 bg-gray-50/50 border-none">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><Calendar size={16}/></div>
          <div>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Entries</p>
            <p className="text-sm font-black text-emerald-600">{analytics?.summary?.totalEntries || '0'}</p>
          </div>
        </Card>
      </div>

      <Card className="p-3 border-none bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <Input 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs border-none bg-white"
            />
          </div>
          <Select 
            value={filters.reason}
            onChange={(e: any) => setFilters(v => ({ ...v, reason: e.target.value }))}
            options={[{ label: 'All Reasons', value: 'all' }, ...reasons.map(r => ({ label: r, value: r }))]}
            className="h-9 text-xs min-w-[120px]"
          />
          <div className="flex items-center gap-1.5">
             <Input type="date" value={filters.startDate} onChange={(e) => setFilters(v => ({ ...v, startDate: e.target.value }))} className="h-9 text-[10px] w-32" />
             <Input type="date" value={filters.endDate} onChange={(e) => setFilters(v => ({ ...v, endDate: e.target.value }))} className="h-9 text-[10px] w-32" />
          </div>
        </div>
      </Card>

      <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800">
        <DataTable columns={columns} data={wasteData} loading={loading} />
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Waste">
        <form onSubmit={handleAddWaste} className="space-y-3 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Product</label>
              <Select 
                value={form.productId}
                onChange={(e: any) => setForm(v => ({ ...v, productId: e.target.value }))}
                options={[{ label: 'Select Product', value: '' }, ...products.map(p => ({ label: p.name, value: p.id }))]}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Qty</label>
              <Input type="number" value={form.quantity} onChange={(e) => setForm(v => ({ ...v, quantity: parseFloat(e.target.value) }))} className="h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Reason</label>
              <Select value={form.reason} onChange={(e: any) => setForm(v => ({ ...v, reason: e.target.value }))} options={reasons.map(r => ({ label: r, value: r }))} className="text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Staff</label>
              <Input placeholder="Name" value={form.staffName} onChange={(e) => setForm(v => ({ ...v, staffName: e.target.value }))} className="h-9 text-xs" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-gray-400">Notes</label>
            <textarea 
              className="w-full h-20 p-2 text-xs rounded-lg border border-gray-200 dark:border-slate-800 outline-none resize-none"
              value={form.notes}
              onChange={(e) => setForm(v => ({ ...v, notes: e.target.value }))}
            />
          </div>
          <div className="flex gap-2 pt-2">
             <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
             <Button className="flex-1 h-9 text-xs bg-red-600 text-white border-none" type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
