'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  Package, 
  Table as TableIcon, 
  CreditCard, 
  Store, 
  Plus, 
  ChevronRight,
  LayoutGrid,
  Settings,
  ArrowRight,
  CheckCircle2,
  Circle,
  Users,
  Box,
  Trash2,
  Search,
  Building2,
  MapPin,
  Phone,
  Hash,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  MoreVertical,
  FlaskConical,
  Scan,
  FileUp,
  Loader2,
  Check
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

// API Wrappers
import { categoriesApi, Category } from '@/lib/api/categories';
import { productsApi, Product } from '@/lib/api/products';
import { tablesApi, Table } from '@/lib/api/tables';
import { paymentModesApi, PaymentMode } from '@/lib/api/payment-modes';
import { inventoryApi, StockItem } from '@/lib/api/inventory';
import { staffMembersApi, StaffMember } from '@/lib/api/staff-members';

// Forms
import { CategoryForm } from '@/components/forms/category-form';
import { RestaurantProductForm } from '@/components/forms/restaurant-product-form';
import { BarProductForm } from '@/components/forms/bar-product-form';
import { TableForm } from '@/components/forms/table-form';
import { FloorForm } from '@/components/forms/floor-form';
import { StaffMemberForm } from '@/components/forms/staff-member-form';

// Components
import { DataTable } from '@/components/shared/data-table';

type TabType = 'categories' | 'products' | 'tables' | 'inventory' | 'staff' | 'payments' | 'outlet';

export default function UnifiedSetupPage() {
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [loading, setLoading] = useState(true);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [propertyDetails, setPropertyDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Scan States (Mirroring products/page.tsx)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [aiMenuType, setAiMenuType] = useState<'RESTAURANT' | 'BAR'>('RESTAURANT');
  const [includeTax, setIncludeTax] = useState(true);
  const [includeHsn, setIncludeHsn] = useState(false);

  // Data States
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [subType, setSubType] = useState<'table' | 'floor' | 'product' | 'bar-product' | 'category' | 'payment' | 'stock' | 'staff' | 'outlet'>('category');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, prods, tabs, modes, flrs, stocks, stf, propRes] = await Promise.all([
        categoriesApi.list(),
        productsApi.list(),
        tablesApi.list(),
        paymentModesApi.list(),
        fetch('/api/floors').then(res => res.json()),
        inventoryApi.listStockItems(),
        staffMembersApi.list(),
        fetch('/api/admin/properties').then(res => res.json())
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
      setTables(tabs || []);
      setPaymentModes(modes || []);
      setFloors(flrs.data || []);
      setStockItems(stocks || []);
      setStaff(stf || []);
      
      if (propRes.success && session?.propertyId) {
        const currentProp = propRes.data.find((p: any) => p.id === session.propertyId);
        setPropertyDetails(currentProp);
      }
    } catch (error) {
      console.error('Failed to fetch setup data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) setSession(data.user);
      });
  }, []);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  // AI Scan Handlers
  const handleAiScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setScanning(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('includeTax', String(includeTax));
    formData.append('includeHsn', String(includeHsn));
    
    try {
      const res = await fetch('/api/ai/scan-menu', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setScannedData(data.data);
      } else {
        alert(data.error || 'Failed to scan menu');
      }
    } catch (err) { 
      console.error('Scan failed:', err); 
      alert('An error occurred during scanning');
    }
    finally { setScanning(false); }
  };

  const handleSaveScannedData = async () => {
    if (!scannedData) return;
    setMutationLoading(true);
    try {
      const res = await fetch('/api/ai/scan-menu/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          categories: scannedData.categories,
          menuType: aiMenuType 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAiModalOpen(false);
        setScannedData(null);
        setFile(null);
        fetchData();
      } else {
        alert(data.error || 'Failed to save scanned items');
      }
    } catch (err) { console.error(err); }
    finally { setMutationLoading(false); }
  };

  // Filtering Logic
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    switch (activeTab) {
      case 'categories': return categories.filter(c => c.name.toLowerCase().includes(q));
      case 'products': return products.filter(p => p.name.toLowerCase().includes(q) || p.category?.name?.toLowerCase().includes(q));
      case 'inventory': return stockItems.filter(s => s.name.toLowerCase().includes(q) || s.sku?.toLowerCase().includes(q));
      case 'staff': return staff.filter(s => s.name.toLowerCase().includes(q) || s.designation?.toLowerCase().includes(q));
      default: return [];
    }
  }, [activeTab, searchQuery, categories, products, stockItems, staff]);

  // Handlers
  const handleGeneralSubmit = async (type: string, data: any) => {
    setMutationLoading(true);
    try {
      switch (type) {
        case 'category':
          if (selectedItem) await categoriesApi.update(selectedItem.id, data);
          else await categoriesApi.create(data);
          break;
        case 'product':
        case 'bar-product':
          if (selectedItem) await productsApi.update(selectedItem.id, data);
          else await productsApi.create({ ...data, propertyId: session?.propertyId });
          break;
        case 'table':
          if (selectedItem) await tablesApi.update(selectedItem.id, data);
          else await tablesApi.create({ ...data, propertyId: session?.propertyId });
          break;
        case 'floor':
          const fMethod = selectedItem ? 'PUT' : 'POST';
          const fUrl = selectedItem ? `/api/floors/${selectedItem.id}` : '/api/floors';
          await fetch(fUrl, {
            method: fMethod,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, propertyId: session?.propertyId })
          });
          break;
        case 'stock':
          if (selectedItem) await inventoryApi.updateStockItem(selectedItem.id, data);
          else await inventoryApi.createStockItem({ ...data, itemType: 'RESTAURANT', propertyId: session?.propertyId });
          break;
        case 'staff':
          if (selectedItem) await staffMembersApi.update(selectedItem.id, data);
          else await staffMembersApi.create({ ...data, propertyId: session?.propertyId });
          break;
        case 'outlet':
          await fetch('/api/admin/properties', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, id: session?.propertyId })
          });
          break;
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) { console.error(err); }
    finally { setMutationLoading(false); }
  };

  const tabs = [
    { id: 'outlet', label: 'Outlet Profile', icon: Store, color: 'bg-indigo-500' },
    { id: 'categories', label: 'Categories', icon: Layers, count: categories.length, color: 'bg-pos-primary' },
    { id: 'products', label: 'Menu Items', icon: Package, count: products.length, color: 'bg-violet-500' },
    { id: 'tables', label: 'Floors & Tables', icon: TableIcon, count: tables.length, color: 'bg-amber-500' },
    { id: 'inventory', label: 'Raw Inventory', icon: Box, count: stockItems.length, color: 'bg-emerald-500' },
    { id: 'staff', label: 'POS Staff', icon: Users, count: staff.length, color: 'bg-blue-500' },
    { id: 'payments', label: 'Payment Modes', icon: CreditCard, count: paymentModes.length, color: 'bg-pink-500' },
  ];

  const renderActiveContent = () => {
    const isSearchable = ['categories', 'products', 'inventory', 'staff'].includes(activeTab);

    return (
      <div className="space-y-6">
        {isSearchable && (
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-2">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder={`Search ${activeTab}...`} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800/50 transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <Button onClick={fetchData} variant="secondary" className="p-3 rounded-2xl"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /></Button>
            </div>
          </div>
        )}

        {(() => {
          switch (activeTab) {
            case 'categories':
              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Menu Categories</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Group your products by type</p>
                    </div>
                    <Button onClick={() => { setSelectedItem(null); setSubType('category'); setIsFormOpen(true); }} className="bg-pos-primary hover:bg-red-700 text-white font-black text-[10px] tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-red-200/50">
                      <Plus size={18} className="mr-2" /> ADD CATEGORY
                    </Button>
                  </div>
                  <DataTable 
                    columns={[
                      { header: 'Name', cell: (r: any) => <span className="font-bold uppercase text-sm">{r.name}</span> },
                      { header: 'Menu Type', cell: (r: any) => <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${r.menuType === 'BAR' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>{r.menuType}</span> },
                      { header: 'Status', cell: (r: any) => <span className={`text-[10px] font-black uppercase ${r.isActive ? 'text-emerald-500' : 'text-slate-400'}`}>{r.isActive ? 'Active' : 'Inactive'}</span> },
                      { header: 'Actions', cell: (r: any) => (
                        <button onClick={() => { setSelectedItem(r); setSubType('category'); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Settings size={16} /></button>
                      )}
                    ]}
                    data={filteredData}
                    loading={loading}
                  />
                </div>
              );
            case 'products':
              return (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm gap-6">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Product Master</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Add items to Restaurant or Bar</p>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                      <Button 
                        onClick={() => setIsAiModalOpen(true)}
                        variant="secondary"
                        className="font-bold text-[10px] tracking-widest px-6 py-3 rounded-xl border border-gray-200 bg-white dark:bg-slate-800 uppercase"
                      >
                         <Scan size={14} className="mr-2" /> MINT AI SCAN
                      </Button>
                      <Button onClick={() => { setSelectedItem(null); setSubType('product'); setIsFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-xl shadow-lg shadow-indigo-100">
                        <Plus size={16} className="mr-2" /> RESTAURANT PRODUCT
                      </Button>
                      <Button onClick={() => { setSelectedItem(null); setSubType('bar-product'); setIsFormOpen(true); }} className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-xl shadow-xl shadow-amber-200/50">
                        <FlaskConical size={16} className="mr-2" /> BAR PRODUCT
                      </Button>
                    </div>
                  </div>
                  <DataTable 
                    columns={[
                      { header: 'Product', cell: (r: any) => (
                        <div className="flex flex-col">
                          <span className="font-bold uppercase text-sm">{r.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{r.category?.name}</span>
                        </div>
                      )},
                      { header: 'Price', cell: (r: any) => <span className="font-black text-slate-900 dark:text-white">₹{r.sellingPrice}</span> },
                      { header: 'Type', cell: (r: any) => (
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${r.menuType === 'BAR' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                          {r.menuType || 'RESTAURANT'}
                        </span>
                      )},
                      { header: 'Actions', cell: (r: any) => (
                        <button onClick={() => { setSelectedItem(r); setSubType(r.menuType === 'BAR' ? 'bar-product' : 'product'); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Settings size={16} /></button>
                      )}
                    ]}
                    data={filteredData}
                    loading={loading}
                  />
                </div>
              );
            case 'tables':
              return (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div>
                          <h4 className="font-black uppercase tracking-tight text-slate-800 dark:text-white">Floors / Sections</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Terrace, Hall, etc.</p>
                        </div>
                        <Button onClick={() => { setSelectedItem(null); setSubType('floor'); setIsFormOpen(true); }} variant="secondary" className="font-bold text-[10px] tracking-widest uppercase rounded-xl">Add Floor</Button>
                      </div>
                      <div className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                        {floors.length === 0 && !loading && <div className="p-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No Floors Found</div>}
                        {floors.map((f: any) => (
                          <div key={f.id} className="p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in slide-in-from-left-4">
                            <span className="font-bold text-sm uppercase">{f.name}</span>
                            <button onClick={() => { setSelectedItem(f); setSubType('floor'); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Settings size={16} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div>
                          <h4 className="font-black uppercase tracking-tight text-slate-800 dark:text-white">Dining Tables</h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Assign to floors</p>
                        </div>
                        <Button onClick={() => { setSelectedItem(null); setSubType('table'); setIsFormOpen(true); }} variant="secondary" className="font-bold text-[10px] tracking-widest uppercase rounded-xl">Add Table</Button>
                      </div>
                      <div className="divide-y divide-slate-50 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                        {tables.length === 0 && !loading && <div className="p-10 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">No Tables Found</div>}
                        {tables.slice(0, 10).map((t: any) => (
                          <div key={t.id} className="p-5 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm uppercase">Table {t.name}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">Cap: {t.capacity} | {floors.find(f => f.id === t.floorId)?.name || 'No Floor'}</span>
                            </div>
                            <button onClick={() => { setSelectedItem(t); setSubType('table'); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Settings size={16} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            case 'inventory':
              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Raw Stock Inventory</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Manage kitchen raw materials & supplies</p>
                    </div>
                    <Button onClick={() => { setSelectedItem(null); setSubType('stock'); setIsFormOpen(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-emerald-200/50">
                      <Plus size={18} className="mr-2" /> ADD STOCK ITEM
                    </Button>
                  </div>
                  <DataTable 
                    columns={[
                      { header: 'Item Name', cell: (r: any) => <span className="font-bold uppercase text-sm">{r.name}</span> },
                      { header: 'Current Stock', cell: (r: any) => <span className={`font-black ${r.isLow ? 'text-red-500' : 'text-emerald-600'}`}>{r.currentStock} {r.unit}</span> },
                      { header: 'Cost Price', cell: (r: any) => <span className="font-bold">₹{r.costPrice}</span> },
                      { header: 'Actions', cell: (r: any) => (
                        <button onClick={() => { setSelectedItem(r); setSubType('stock'); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Settings size={16} /></button>
                      )}
                    ]}
                    data={filteredData}
                    loading={loading}
                  />
                </div>
              );
            case 'staff':
              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Staff Management</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Waiters, Cashiers & Service Staff</p>
                    </div>
                    <Button onClick={() => { setSelectedItem(null); setSubType('staff'); setIsFormOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-blue-200/50">
                      <Plus size={18} className="mr-2" /> ADD STAFF MEMBER
                    </Button>
                  </div>
                  <DataTable 
                    columns={[
                      { header: 'Staff Name', cell: (r: any) => <span className="font-bold uppercase text-sm">{r.name}</span> },
                      { header: 'Designation', cell: (r: any) => <span className="text-[10px] font-black uppercase px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">{r.designation || 'Staff'}</span> },
                      { header: 'Phone', cell: (r: any) => <span className="text-sm font-bold">{r.phone || '---'}</span> },
                      { header: 'Actions', cell: (r: any) => (
                        <button onClick={() => { setSelectedItem(r); setSubType('staff'); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Settings size={16} /></button>
                      )}
                    ]}
                    data={filteredData}
                    loading={loading}
                  />
                </div>
              );
            case 'payments':
              return (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Payment Methods</h3>
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Accepted payment options</p>
                    </div>
                    <Button onClick={() => { setSelectedItem(null); setSubType('payment'); setIsFormOpen(true); }} className="bg-pink-600 hover:bg-pink-700 text-white font-black text-[10px] tracking-widest px-8 py-4 rounded-2xl shadow-xl shadow-pink-200/50">
                      <Plus size={18} className="mr-2" /> ADD METHOD
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {paymentModes.map((m: any) => (
                      <div key={m.id} className="p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-600 dark:text-slate-300"><CreditCard size={24} /></div>
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${m.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{m.isActive ? 'Active' : 'Hidden'}</span>
                        </div>
                        <h4 className="font-black uppercase tracking-tight text-lg text-slate-800 dark:text-white mb-1">{m.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.type}</p>
                        <div className="mt-8 flex justify-end opacity-0 group-hover:opacity-100 transition-all">
                          <Button variant="secondary" onClick={() => { setSelectedItem(m); setSubType('payment'); setIsFormOpen(true); }} className="text-[10px] font-bold uppercase tracking-widest px-6 h-10 rounded-xl">Edit Mode</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            case 'outlet':
              return (
                <div className="max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 p-10 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-indigo-500/10" />
                      <div className="relative flex justify-between items-start mb-12">
                        <div>
                          <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white mb-2">Outlet Master Profile</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Business identity & Local Identity</p>
                        </div>
                        <Button onClick={() => { setSelectedItem(propertyDetails); setSubType('outlet'); setIsFormOpen(true); }} className="bg-slate-900 dark:bg-slate-800 text-white font-black text-[10px] tracking-widest uppercase px-6 py-3 rounded-2xl shadow-xl shadow-slate-200">Edit Identity</Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                        <div className="flex gap-5">
                          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600"><Building2 size={24} /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Name</p>
                            <p className="font-black text-base text-slate-800 dark:text-white uppercase tracking-tight">{propertyDetails?.name}</p>
                          </div>
                        </div>
                        <div className="flex gap-5">
                          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600"><Hash size={24} /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Property Code</p>
                            <p className="font-black text-base text-slate-800 dark:text-white uppercase tracking-tight">#{propertyDetails?.code}</p>
                          </div>
                        </div>
                        <div className="flex gap-5">
                          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600"><MapPin size={24} /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Business Location</p>
                            <p className="font-black text-base text-slate-800 dark:text-white uppercase tracking-tight">{propertyDetails?.city}, {propertyDetails?.state}</p>
                          </div>
                        </div>
                        <div className="flex gap-5">
                          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600"><Phone size={24} /></div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact Line</p>
                            <p className="font-black text-base text-slate-800 dark:text-white tracking-tight">{propertyDetails?.phone || 'Not Set'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-950 p-10 rounded-[40px] shadow-2xl relative overflow-hidden text-white">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-8"><Settings size={28} /></div>
                      <h5 className="font-black text-lg uppercase tracking-tight mb-3">System Settings</h5>
                      <p className="text-xs text-white/60 leading-relaxed mb-10 font-medium tracking-wide">Manage GST settings, Thermal Printer templates, Kitchen Display Systems, and WhatsApp API integration.</p>
                      <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 font-black text-[10px] tracking-widest uppercase py-4 rounded-2xl transition-all shadow-xl shadow-white/10 group">
                        Enter Deep Config <ArrowUpRight size={14} className="ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
          }
        })()}
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-24 font-sans">
      <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
        <PageHeader title="One-Page Setup" subtitle="Unified master control for your entire restaurant operations and database." showBack backUrl="/operations" />
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-10">
           {[
             { label: 'Menu Master', value: products.length, icon: Package, color: 'text-violet-500' },
             { label: 'Total Staff', value: staff.length, icon: Users, color: 'text-blue-500' },
             { label: 'Dining Tables', value: tables.length, icon: TableIcon, color: 'text-amber-500' },
             { label: 'Raw Inventory', value: stockItems.length, icon: Box, color: 'text-emerald-500' },
             { label: 'Pay Methods', value: paymentModes.length, icon: CreditCard, color: 'text-pink-500' },
           ].map((stat, i) => (
             <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group">
                <div className={`w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 ${stat.color} group-hover:scale-110 transition-transform`}><stat.icon size={20} /></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
             </div>
           ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <div className="w-full lg:w-80 flex flex-row lg:flex-col gap-3 overflow-x-auto lg:overflow-visible pb-6 lg:pb-0 sticky top-8 z-10 no-scrollbar">
           {tabs.map((tab) => (
             <button 
               key={tab.id} 
               onClick={() => { setActiveTab(tab.id as TabType); setSearchQuery(''); }} 
               className={`flex items-center gap-5 px-8 py-5 rounded-[24px] transition-all border shrink-0 lg:shrink ${activeTab === tab.id ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-xl ring-8 ring-slate-100 dark:ring-slate-800/50 translate-x-2' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
             >
               <div className={`p-3 rounded-[14px] shadow-sm ${activeTab === tab.id ? `${tab.color} text-white` : 'bg-slate-100 dark:bg-slate-800'}`}><tab.icon size={20} /></div>
               <div className="flex flex-col items-start">
                 <span className={`text-xs font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-slate-900 dark:text-white' : ''}`}>{tab.label}</span>
                 {tab.count !== undefined && <span className="text-[9px] font-bold uppercase opacity-40">{tab.count} entries</span>}
               </div>
               {activeTab === tab.id && <ChevronRight size={16} className="ml-auto hidden lg:block opacity-30" />}
             </button>
           ))}
        </div>

        <div className="flex-1 w-full animate-in fade-in slide-in-from-right-8 duration-700">{renderActiveContent()}</div>
      </div>

      {/* Main Form Modal */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        title={`${selectedItem ? 'Update' : 'New'} ${subType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Entry`}
        maxWidth={subType === 'bar-product' ? '4xl' : subType === 'product' ? '2xl' : 'lg'}
      >
        <div className="p-4 overflow-y-auto max-h-[80vh]">
          {subType === 'category' && <CategoryForm initialData={selectedItem} onSubmit={(d) => handleGeneralSubmit('category', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />}
          {subType === 'product' && <RestaurantProductForm initialData={selectedItem} onSubmit={(d) => handleGeneralSubmit('product', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />}
          {subType === 'bar-product' && <BarProductForm initialData={selectedItem} onSubmit={(d) => handleGeneralSubmit('bar-product', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />}
          {subType === 'floor' && <FloorForm initialData={selectedItem} onSubmit={(d) => handleGeneralSubmit('floor', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />}
          {subType === 'table' && <TableForm initialData={selectedItem} floors={floors} onSubmit={(d) => handleGeneralSubmit('table', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />}
          {subType === 'staff' && <StaffMemberForm initialData={selectedItem} onSubmit={(d) => handleGeneralSubmit('staff', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />}
          {subType === 'stock' && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleGeneralSubmit('stock', {
                name: fd.get('name'), sku: fd.get('sku'), unit: fd.get('unit'),
                openingStock: Number(fd.get('openingStock')), reorderLevel: Number(fd.get('reorderLevel')),
                minimumStock: Number(fd.get('minimumStock')), costPrice: Number(fd.get('costPrice')),
              });
            }} className="space-y-4">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Item Name</label><input name="name" defaultValue={selectedItem?.name} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-500/10 transition-all" placeholder="eg. Basmati Rice" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">SKU</label><input name="sku" defaultValue={selectedItem?.sku} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none" placeholder="SKU-001" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Unit</label><select name="unit" defaultValue={selectedItem?.unit || 'KG'} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none"><option value="KG">KG</option><option value="PCS">PCS</option><option value="LTR">LTR</option><option value="BOX">BOX</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cost Price</label><input name="costPrice" type="number" defaultValue={selectedItem?.costPrice} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none" placeholder="0.00" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Opening Stock</label><input name="openingStock" type="number" defaultValue={selectedItem?.openingStock} className="w-full px-6 py-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl font-black text-emerald-600 outline-none" placeholder="0" disabled={!!selectedItem} /></div>
              </div>
              <div className="flex gap-4 pt-6"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase">Cancel</Button><Button type="submit" loading={mutationLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-emerald-200">Save Item</Button></div>
            </form>
          )}
          {subType === 'payment' && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleGeneralSubmit('payment', { name: fd.get('name'), type: fd.get('type'), isActive: fd.get('isActive') === 'on' });
            }} className="space-y-4">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mode Name</label><input name="name" defaultValue={selectedItem?.name} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none" placeholder="eg. PhonePe QR" required /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">System Type</label><select name="type" defaultValue={selectedItem?.type || 'UPI'} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none"><option value="CASH">CASH</option><option value="CARD">CARD</option><option value="UPI">UPI</option><option value="VOUCHER">VOUCHER</option></select></div>
              <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl"><span className="text-xs font-black uppercase text-slate-600 dark:text-slate-400">Accepting Payments</span><input type="checkbox" name="isActive" defaultChecked={selectedItem?.isActive !== false} className="w-6 h-6 accent-pink-500" /></div>
              <div className="flex gap-4 pt-6"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase">Cancel</Button><Button type="submit" loading={mutationLoading} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-pink-200">Save Mode</Button></div>
            </form>
          )}
          {subType === 'outlet' && (
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              handleGeneralSubmit('outlet', {
                name: fd.get('name'), code: fd.get('code'), city: fd.get('city'),
                state: fd.get('state'), country: fd.get('country'), address: fd.get('address'), phone: fd.get('phone')
              });
            }} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Outlet Name</label><input name="name" defaultValue={selectedItem?.name} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none" required /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Prop Code</label><input name="code" defaultValue={selectedItem?.code} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none uppercase" required /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">City</label><input name="city" defaultValue={selectedItem?.city} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none" /></div>
                <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone</label><input name="phone" defaultValue={selectedItem?.phone} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none" /></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Business Address (For Invoices)</label><textarea name="address" defaultValue={selectedItem?.address} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none h-32 resize-none" placeholder="Enter complete address..." /></div>
              <div className="flex gap-4 pt-4"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="flex-1 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase">Cancel</Button><Button type="submit" loading={mutationLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase shadow-xl shadow-indigo-200">Update Profile</Button></div>
            </form>
          )}
        </div>
      </Modal>

      {/* AI Scan Modal (Mirroring products/page.tsx) */}
      <Modal 
        isOpen={isAiModalOpen} 
        onClose={() => { if(!mutationLoading) setIsAiModalOpen(false); }} 
        title="Scan Menu using Mint AI"
        maxWidth="lg"
      >
        <div className="p-2 space-y-6">
          <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
            aiMenuType === 'RESTAURANT' 
              ? 'bg-indigo-50/50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-800/30' 
              : 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${
                aiMenuType === 'RESTAURANT' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'
              }`}>
                <Layers size={18} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Save Scanned Items To</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Current Selection: {aiMenuType}</p>
              </div>
            </div>

            <div className="flex p-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <button
                type="button"
                onClick={() => setAiMenuType('RESTAURANT')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  aiMenuType === 'RESTAURANT'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Restaurant
              </button>
              <button
                type="button"
                onClick={() => setAiMenuType('BAR')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  aiMenuType === 'BAR'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 dark:shadow-none'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Bar
              </button>
            </div>
          </div>

          {!scannedData ? (
            <form onSubmit={handleAiScan} className="space-y-4">
             <p className="text-sm text-gray-500">Upload an image of your menu card to automatically extract and create products & categories.</p>
             <div className="border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl p-8 text-center cursor-pointer hover:border-pos-primary transition-colors">
               <input 
                 type="file" 
                 accept="image/*" 
                 className="hidden" 
                 id="menuImage" 
                 onChange={(e) => setFile(e.target.files?.[0] || null)}
               />
               <label htmlFor="menuImage" className="cursor-pointer flex flex-col items-center">
                  <Package size={32} className="text-gray-400 mb-2" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{file ? file.name : 'Select Image Click to Browse'}</span>
                  <span className="text-xs text-gray-400 mt-1">Supports JPEG, PNG</span>
               </label>
             </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/80 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-0.5">Extract GST</p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Auto-apply rates</p>
                  </div>
                  <button type="button" onClick={() => setIncludeTax(!includeTax)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${includeTax ? 'bg-pos-primary' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${includeTax ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/80 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest mb-0.5">Extract HSN</p>
                    <p className="text-[8px] text-gray-400 font-bold uppercase tracking-tighter">Auto-apply codes</p>
                  </div>
                  <button type="button" onClick={() => setIncludeHsn(!includeHsn)} className={`w-10 h-5 rounded-full p-0.5 transition-colors ${includeHsn ? 'bg-pos-primary' : 'bg-gray-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${includeHsn ? 'translate-x-5' : 'translate-x-0'}`} /></button>
                </div>
              </div>
              <Button type="submit" loading={scanning} disabled={!file} className="w-full bg-pos-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Start AI Scan</Button>
            </form>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-4">
                <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">Review Scanned Items</p>
                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                  aiMenuType === 'BAR' 
                    ? 'bg-amber-50 text-amber-600 border-amber-100' 
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}>
                  Destination: {aiMenuType}
                </span>
              </div>
              
              <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1 no-scrollbar">
                {scannedData.categories?.map((cat: any, i: number) => (
                  <div key={i} className="border border-gray-100 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-800/50 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-50 dark:border-slate-800 pb-3">
                      <div className="w-1.5 h-4 bg-pos-primary rounded-full" />
                      <h4 className="font-black text-[11px] uppercase tracking-widest text-slate-900 dark:text-white">{cat.name}</h4>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-slate-800">
                      {cat.items?.map((item: any, j: number) => (
                        <div key={j} className="py-4 last:pb-0">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex flex-col">
                                <span className="font-black text-[11px] text-gray-900 dark:text-white uppercase tracking-tight">{item.name}</span>
                                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{item.productType?.replace('_', ' ')}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-sm text-pos-primary block leading-none">₹{item.sellingPrice || item.price}</span>
                                {item.costPrice > 0 && (
                                  <span className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-1 block">Cost: ₹{item.costPrice}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">
                                <span className="text-[7px] font-black uppercase text-gray-400">SKU</span>
                                <span className="text-[9px] font-bold text-gray-700 dark:text-slate-200">{item.sku}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-pos-primary/5 dark:bg-pos-primary/10 px-1.5 py-0.5 rounded-md border border-pos-primary/20">
                                <span className="text-[7px] font-black uppercase text-pos-primary/60">HSN</span>
                                <span className="text-[9px] font-bold text-pos-primary/80">{item.hsnCode}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/30 px-1.5 py-0.5 rounded-md border border-orange-100">
                                <span className="text-[7px] font-black uppercase text-orange-400">GST</span>
                                <span className="text-[9px] font-bold text-orange-600">{item.taxRate}%</span>
                              </div>
                              {item.trackInventory && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100">
                                  <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                                  <span className="text-[8px] font-black text-emerald-600 uppercase">TRACK</span>
                                </div>
                              )}
                            </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="secondary" onClick={() => setScannedData(null)} disabled={mutationLoading} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl">Scan Again</Button>
                <Button onClick={handleSaveScannedData} loading={mutationLoading} className="flex-[2] bg-pos-primary text-white py-4 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-pos-primary/20">Confirm & Save to DB</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-10 py-5 rounded-[40px] shadow-2xl flex items-center gap-12 border border-white/10 backdrop-blur-2xl z-[50] animate-in slide-in-from-bottom-12 duration-1000 ring-1 ring-white/20">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-pos-primary shadow-inner shadow-white/5"><LayoutGrid size={24} /></div>
            <div><p className="text-[11px] font-black uppercase tracking-[0.3em] leading-none text-white">Setup Integrity</p><p className="text-[9px] text-white/40 font-bold uppercase mt-1.5 tracking-widest">Real-time Cloud Sync Active</p></div>
         </div>
         <div className="flex items-center gap-6 border-l border-white/10 pl-12">
            {[{ label: 'Menu', done: categories.length > 0 }, { label: 'Staff', done: staff.length > 0 }, { label: 'Payments', done: paymentModes.length > 0 }].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                 {step.done ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Circle size={18} className="text-white/10" />}
                 <span className={`text-[10px] font-black uppercase tracking-widest ${step.done ? 'text-white' : 'text-white/20'}`}>{step.label}</span>
              </div>
            ))}
         </div>
         <Button onClick={() => window.location.href = '/billing'} className="bg-pos-primary hover:bg-red-700 text-white border-none px-10 py-4 rounded-full font-black text-[11px] tracking-widest uppercase ml-6 shadow-2xl shadow-red-500/40 group active:scale-95 transition-all">Launch Billing <ArrowRight size={16} className="ml-2 group-hover:translate-x-1.5 transition-transform duration-300" /></Button>
      </div>
    </div>
  );
}
