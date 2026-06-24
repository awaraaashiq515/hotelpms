'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Store, Layers, Package, Table as TableIcon, CreditCard, Users, Box,
  User, Ticket, IdCard, TrendingDown, Truck, Navigation, Search, Plus,
  Settings, RefreshCw, ArrowRight, ArrowLeft, CheckCircle2, Circle,
  Building2, MapPin, Phone, Hash, Sparkles, FlaskConical, Scan, FileUp,
  Loader2, Check, ChevronRight, LayoutGrid, Rocket, Shield, Globe, Printer,
  Radio, Music2, Coffee, Wine, QrCode, UserCog, Tag, Bike
} from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

import { categoriesApi, Category } from '@/lib/api/categories';
import { productsApi, Product } from '@/lib/api/products';
import { tablesApi, Table } from '@/lib/api/tables';
import { paymentModesApi, PaymentMode } from '@/lib/api/payment-modes';
import { inventoryApi, StockItem } from '@/lib/api/inventory';
import { staffMembersApi, StaffMember } from '@/lib/api/staff-members';

import { CategoryForm } from '@/components/forms/category-form';
import { RestaurantProductForm } from '@/components/forms/restaurant-product-form';
import { BarProductForm } from '@/components/forms/bar-product-form';
import { TableForm } from '@/components/forms/table-form';
import { FloorForm } from '@/components/forms/floor-form';
import { StaffMemberForm } from '@/components/forms/staff-member-form';
import { DataTable } from '@/components/shared/data-table';

// ─── Step Definitions ───────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Outlet Profile',     icon: Store,       color: 'bg-indigo-500',   light: 'bg-indigo-50 text-indigo-600',   desc: 'Business identity & details' },
  { id: 2, label: 'Menu Setup',         icon: Package,     color: 'bg-violet-500',   light: 'bg-violet-50 text-violet-600',   desc: 'Categories & products' },
  { id: 3, label: 'Floors & Tables',    icon: TableIcon,   color: 'bg-amber-500',    light: 'bg-amber-50 text-amber-600',     desc: 'Dining setup' },
  { id: 4, label: 'Payment Modes',      icon: CreditCard,  color: 'bg-pink-500',     light: 'bg-pink-50 text-pink-600',       desc: 'Cash, UPI, Card etc.' },
  { id: 5, label: 'Staff & Users',      icon: Users,       color: 'bg-blue-500',     light: 'bg-blue-50 text-blue-600',       desc: 'POS staff & app users' },
  { id: 6, label: 'Customers & CRM',    icon: IdCard,      color: 'bg-emerald-500',  light: 'bg-emerald-50 text-emerald-600', desc: 'Customers, memberships & vouchers' },
  { id: 7, label: 'Inventory',          icon: Box,         color: 'bg-teal-500',     light: 'bg-teal-50 text-teal-600',       desc: 'Raw stock & expense categories' },
  { id: 8, label: 'Delivery Drivers',   icon: Bike,        color: 'bg-orange-500',   light: 'bg-orange-50 text-orange-600',   desc: 'Delivery rider management' },
  { id: 9, label: 'Go Live',            icon: Rocket,      color: 'bg-pos-primary',  light: 'bg-red-50 text-red-600',         desc: 'Launch your POS' },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UnifiedSetupPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [propertyDetails, setPropertyDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Scan
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [aiMenuType, setAiMenuType] = useState<'RESTAURANT' | 'BAR'>('RESTAURANT');
  const [includeTax, setIncludeTax] = useState(true);
  const [includeHsn, setIncludeHsn] = useState(false);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [appUsers, setAppUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  // Accounting vouchers not shown in setup — too complex for wizard
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);

  // Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [subType, setSubType] = useState<string>('category');

  // ─── Fetch All Data ──────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cats, prods, tabs, modes, flrs, stocks, stf, propRes,
             usersRes, rolesRes, custRes, memPlansRes, expCatRes, driversRes] = await Promise.all([
        categoriesApi.list(),
        productsApi.list(),
        tablesApi.list(),
        paymentModesApi.list(),
        fetch('/api/floors').then(r => r.json()),
        inventoryApi.listStockItems(),
        staffMembersApi.list(),
        fetch('/api/admin/properties').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
        fetch('/api/users/roles').then(r => r.json()),
        fetch('/api/customers').then(r => r.json()),
        fetch('/api/memberships/plans').then(r => r.json()),
        fetch('/api/expense-categories').then(r => r.json()),
        fetch('/api/drivers').then(r => r.json()),
      ]);

      setCategories(cats || []);
      setProducts(prods || []);
      setTables(tabs || []);
      setPaymentModes(modes || []);
      setFloors(flrs.data || []);
      setStockItems(stocks || []);
      setStaff(stf || []);
      setAppUsers(usersRes.success ? usersRes.data : []);
      setRoles(rolesRes.success ? rolesRes.data : []);
      setCustomers(custRes.success ? custRes.data : []);
      setMembershipPlans(memPlansRes.success ? memPlansRes.data : []);
      setExpenseCategories(expCatRes.success ? expCatRes.data : []);
      setDrivers(driversRes.success ? driversRes.data : []);

      if (propRes.success && session?.propertyId) {
        const cur = propRes.data.find((p: any) => p.id === session.propertyId);
        setPropertyDetails(cur);
      }
    } catch (e) {
      console.error('Fetch failed', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (d.authenticated) setSession(d.user);
    });
  }, []);

  useEffect(() => { if (session) fetchData(); }, [session]);

  // ─── Completion Check ─────────────────────────────────────────────────────
  const completedSteps = useMemo(() => {
    const done: number[] = [];
    if (propertyDetails?.name) done.push(1);
    if (categories.length > 0 || products.length > 0) done.push(2);
    if (tables.length > 0 || floors.length > 0) done.push(3);
    if (paymentModes.length > 0) done.push(4);
    if (staff.length > 0 || appUsers.length > 0) done.push(5);
    if (customers.length > 0 || membershipPlans.length > 0 || expenseCategories.length > 0) done.push(6);
    if (stockItems.length > 0) done.push(7);
    if (drivers.length > 0) done.push(8);
    return done;
  }, [propertyDetails, categories, products, tables, floors, paymentModes, staff, appUsers, customers, membershipPlans, stockItems, expenseCategories, drivers]);

  // ─── AI Scan ─────────────────────────────────────────────────────────────
  const handleAiScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setScanning(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('includeTax', String(includeTax));
    fd.append('includeHsn', String(includeHsn));
    try {
      const res = await fetch('/api/ai/scan-menu', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) setScannedData(data.data);
      else alert(data.error || 'Scan failed');
    } catch { alert('Scan error'); }
    finally { setScanning(false); }
  };

  const handleSaveScannedData = async () => {
    if (!scannedData) return;
    setMutationLoading(true);
    try {
      const res = await fetch('/api/ai/scan-menu/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: scannedData.categories, menuType: aiMenuType }),
      });
      const data = await res.json();
      if (data.success) { setIsAiModalOpen(false); setScannedData(null); setFile(null); fetchData(); }
      else alert(data.error || 'Save failed');
    } catch { console.error('save err'); }
    finally { setMutationLoading(false); }
  };

  // ─── Submit Handlers ─────────────────────────────────────────────────────
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
          const fm = selectedItem ? 'PUT' : 'POST';
          const fu = selectedItem ? `/api/floors/${selectedItem.id}` : '/api/floors';
          await fetch(fu, { method: fm, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, propertyId: session?.propertyId }) });
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
          await fetch('/api/admin/properties', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, id: session?.propertyId }) });
          break;
        case 'payment':
          if (selectedItem) await paymentModesApi.update(selectedItem.id, data);
          else await paymentModesApi.create(data);
          break;
        case 'expense-category':
          if (selectedItem) await fetch(`/api/expense-categories/${selectedItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          else await fetch('/api/expense-categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          break;
        case 'driver':
          if (selectedItem) await fetch(`/api/drivers/${selectedItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          else await fetch('/api/drivers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, propertyId: session?.propertyId }) });
          break;
        case 'membership-plan':
          if (selectedItem) await fetch(`/api/memberships/plans/${selectedItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          else await fetch('/api/memberships/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          break;
        case 'membership-plan':
          // POST handled below, this case needed for update
          break;
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) { console.error(err); }
    finally { setMutationLoading(false); }
  };

  const openForm = (type: string, item: any = null) => {
    setSubType(type);
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const goNext = () => { if (currentStep < STEPS.length) { setCurrentStep(s => s + 1); setSearchQuery(''); } };
  const goBack = () => { if (currentStep > 1) { setCurrentStep(s => s - 1); setSearchQuery(''); } };
  const goToStep = (n: number) => { setCurrentStep(n); setSearchQuery(''); };

  const step = STEPS[currentStep - 1];

  // ─── Render Steps ─────────────────────────────────────────────────────────
  const renderStepContent = () => {
    const cardCls = 'bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm';
    const headerCls = 'flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-7';
    const titleCls = 'text-lg font-black uppercase tracking-tight text-slate-800 dark:text-white';
    const subtitleCls = 'text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1';

    // ── Step 1: Outlet Profile ────────────────────────────────────────────
    if (currentStep === 1) return (
      <div className="space-y-6">
        <div className={`${cardCls} p-8 relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -mr-24 -mt-24" />
          <div className="relative flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
            <div>
              <h3 className={titleCls}>Outlet Master Profile</h3>
              <p className={subtitleCls}>Business identity & local details</p>
            </div>
            <Button onClick={() => openForm('outlet', propertyDetails)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl shadow-lg">
              Edit Profile
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Building2, label: 'Business Name', value: propertyDetails?.name || 'Not Set', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' },
              { icon: Hash, label: 'Property Code', value: `#${propertyDetails?.code || '---'}`, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' },
              { icon: MapPin, label: 'Location', value: propertyDetails?.city ? `${propertyDetails.city}, ${propertyDetails.state}` : 'Not Set', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' },
              { icon: Phone, label: 'Contact', value: propertyDetails?.phone || 'Not Set', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}><item.icon size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{item.label}</p>
                  <p className="font-black text-sm text-slate-800 dark:text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
          {propertyDetails?.address && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Full Address (for Bills)</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{propertyDetails.address}</p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Settings, title: 'Settings', desc: 'GST, printers, UPI, WhatsApp & more', url: `${p}/settings`, color: 'from-slate-800 to-slate-900' },
            { icon: Globe, title: 'Website', desc: 'Online ordering page & branding', url: `${p}/settings?tab=website`, color: 'from-violet-700 to-indigo-800' },
            { icon: Printer, title: 'Printers', desc: 'Thermal & kitchen printer config', url: `${p}/settings/printers`, color: 'from-blue-700 to-blue-900' },
          ].map((card, i) => (
            <button key={i} onClick={() => router.push(card.url)} className={`bg-gradient-to-br ${card.color} text-white p-7 rounded-[28px] shadow-xl text-left hover:scale-[1.02] transition-all group`}>
              <div className="w-11 h-11 bg-white/10 rounded-2xl flex items-center justify-center mb-5"><card.icon size={22} /></div>
              <p className="font-black text-base uppercase tracking-tight">{card.title}</p>
              <p className="text-xs text-white/60 mt-1">{card.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/80 transition-colors">Open <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" /></div>
            </button>
          ))}
        </div>
      </div>
    );

    // ── Step 2: Menu Setup ────────────────────────────────────────────────
    if (currentStep === 2) return (
      <div className="space-y-6">
        {/* Categories */}
        <div className={cardCls}>
          <div className={headerCls}>
            <div>
              <h3 className={titleCls}>Menu Categories</h3>
              <p className={subtitleCls}>Group your products — {categories.length} added</p>
            </div>
            <Button onClick={() => openForm('category')} className="bg-pos-primary hover:bg-red-700 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl shadow-lg">
              <Plus size={14} className="mr-1.5" /> Add Category
            </Button>
          </div>
          <div className="px-7 pb-7">
            {categories.length === 0 ? <EmptyState text="No categories yet. Add your first category above." /> : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categories.map((c: any) => (
                  <button key={c.id} onClick={() => openForm('category', c)} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left group">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${c.menuType === 'BAR' ? 'bg-amber-100 text-amber-700' : 'bg-violet-100 text-violet-700'}`}>{c.menuType === 'BAR' ? '🍺' : '🍽️'}</div>
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-white uppercase">{c.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{c.menuType}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Products */}
        <div className={cardCls}>
          <div className={headerCls}>
            <div>
              <h3 className={titleCls}>Product Master</h3>
              <p className={subtitleCls}>Restaurant & Bar items — {products.length} added</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setIsAiModalOpen(true)} variant="secondary" className="font-bold text-[10px] tracking-widest px-5 py-2.5 rounded-xl uppercase border">
                <Scan size={13} className="mr-1.5" /> AI Scan Menu
              </Button>
              {propertyDetails?.restaurantPosEnabled !== false && (
                <Button onClick={() => openForm('product')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] tracking-widest px-5 py-2.5 rounded-xl">
                  <Plus size={13} className="mr-1.5" /> Restaurant Product
                </Button>
              )}
              {propertyDetails?.barPosEnabled && (
                <Button onClick={() => openForm('bar-product')} className="bg-amber-500 hover:bg-amber-600 text-white font-black text-[10px] tracking-widest px-5 py-2.5 rounded-xl">
                  <FlaskConical size={13} className="mr-1.5" /> Bar Product
                </Button>
              )}
            </div>
          </div>
          <div className="px-7 pb-7">
            <DataTable
              columns={[
                { header: 'Product', cell: (r: any) => <div><p className="font-black text-sm uppercase">{r.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">{r.category?.name}</p></div> },
                { header: 'Price', cell: (r: any) => <span className="font-black text-slate-900 dark:text-white">₹{r.sellingPrice}</span> },
                { header: 'Type', cell: (r: any) => <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${r.menuType === 'BAR' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>{r.menuType || 'RESTAURANT'}</span> },
                { header: '', cell: (r: any) => <button onClick={() => openForm(r.menuType === 'BAR' ? 'bar-product' : 'product', r)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Settings size={15} /></button> },
              ]}
              data={products}
              loading={loading}
            />
          </div>
        </div>
        <QuickLink label="Manage Full Product Catalogue" url={`${p}/products`} router={router} />
      </div>
    );

    // ── Step 3: Floors & Tables ───────────────────────────────────────────
    if (currentStep === 3) return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Floors */}
          <div className={cardCls}>
            <div className={headerCls}>
              <div><h3 className={titleCls}>Floors / Sections</h3><p className={subtitleCls}>Terrace, Hall, Garden etc.</p></div>
              <Button onClick={() => openForm('floor')} variant="secondary" className="font-bold text-[10px] tracking-widest px-5 py-2.5 rounded-xl uppercase">+ Floor</Button>
            </div>
            <div className="px-7 pb-7 divide-y divide-slate-50 dark:divide-slate-800">
              {floors.length === 0 && !loading ? <EmptyState text="No floors added yet." /> : floors.map((f: any) => (
                <div key={f.id} className="py-3.5 flex justify-between items-center">
                  <span className="font-bold text-sm uppercase">{f.name}</span>
                  <button onClick={() => openForm('floor', f)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Settings size={14} /></button>
                </div>
              ))}
            </div>
          </div>
          {/* Tables */}
          <div className={cardCls}>
            <div className={headerCls}>
              <div><h3 className={titleCls}>Dining Tables</h3><p className={subtitleCls}>{tables.length} tables configured</p></div>
              <Button onClick={() => openForm('table')} variant="secondary" className="font-bold text-[10px] tracking-widest px-5 py-2.5 rounded-xl uppercase">+ Table</Button>
            </div>
            <div className="px-7 pb-7 divide-y divide-slate-50 dark:divide-slate-800">
              {tables.length === 0 && !loading ? <EmptyState text="No tables added yet." /> : tables.slice(0, 8).map((t: any) => (
                <div key={t.id} className="py-3.5 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm uppercase">Table {t.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Cap: {t.capacity} | {floors.find(f => f.id === t.floorId)?.name || 'No Floor'}</p>
                  </div>
                  <button onClick={() => openForm('table', t)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Settings size={14} /></button>
                </div>
              ))}
              {tables.length > 8 && <p className="text-[10px] text-slate-400 font-bold uppercase text-center pt-3">+{tables.length - 8} more tables</p>}
            </div>
          </div>
        </div>
        <QuickLink label="Manage Tables & Reservations" url={`${p}/operations/tables`} router={router} />
      </div>
    );

    // ── Step 4: Payment Modes ─────────────────────────────────────────────
    if (currentStep === 4) return (
      <div className="space-y-6">
        <div className={cardCls}>
          <div className={headerCls}>
            <div><h3 className={titleCls}>Payment Methods</h3><p className={subtitleCls}>Accepted modes — {paymentModes.length} configured</p></div>
            <Button onClick={() => openForm('payment')} className="bg-pink-600 hover:bg-pink-700 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl shadow-lg">
              <Plus size={14} className="mr-1.5" /> Add Mode
            </Button>
          </div>
          <div className="px-7 pb-7">
            {paymentModes.length === 0 ? <EmptyState text="No payment modes added yet." /> : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {paymentModes.map((m: any) => (
                  <div key={m.id} className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-start group hover:bg-white hover:shadow-md dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-600">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-black text-sm uppercase text-slate-800 dark:text-white">{m.name}</p>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${m.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>{m.isActive ? '✓ Active' : 'Hidden'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{m.type}</p>
                    </div>
                    <button onClick={() => openForm('payment', m)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all"><Settings size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <QuickLink label="Manage UPI & QR Payment Settings" url={`${p}/settings?tab=payments`} router={router} />
      </div>
    );

    // ── Step 5: Staff & Users ─────────────────────────────────────────────
    if (currentStep === 5) return (
      <div className="space-y-6">
        {/* POS Staff Members */}
        <div className={cardCls}>
          <div className={headerCls}>
            <div><h3 className={titleCls}>POS Staff Members</h3><p className={subtitleCls}>Waiters, cashiers & service staff — {staff.length} added</p></div>
            <Button onClick={() => openForm('staff')} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl shadow-lg">
              <Plus size={14} className="mr-1.5" /> Add Staff
            </Button>
          </div>
          <div className="px-7 pb-7">
            <DataTable
              columns={[
                { header: 'Name', cell: (r: any) => <span className="font-bold uppercase text-sm">{r.name}</span> },
                { header: 'Designation', cell: (r: any) => <span className="text-[10px] font-black uppercase px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded">{r.designation || 'Staff'}</span> },
                { header: 'Phone', cell: (r: any) => <span className="text-sm font-bold">{r.phone || '---'}</span> },
                { header: '', cell: (r: any) => <button onClick={() => openForm('staff', r)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Settings size={14} /></button> },
              ]}
              data={staff}
              loading={loading}
            />
          </div>
        </div>

        {/* App Users */}
        <div className={cardCls}>
          <div className={headerCls}>
            <div><h3 className={titleCls}>App Login Users</h3><p className={subtitleCls}>Team members who log into POS — {appUsers.length} added</p></div>
            <Button onClick={() => router.push(`${p}/manage-users`)} variant="secondary" className="font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl uppercase border">
              <UserCog size={14} className="mr-1.5" /> Manage Users
            </Button>
          </div>
          <div className="px-7 pb-7">
            {appUsers.length === 0 ? <EmptyState text="No app users found. Click Manage Users to add." /> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {appUsers.slice(0, 6).map((u: any) => (
                  <div key={u.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 font-black text-sm uppercase">{u.fullName?.[0] || '?'}</div>
                    <div>
                      <p className="font-black text-sm uppercase text-slate-800 dark:text-white">{u.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{u.role?.name || 'No Role'} • {u.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Roles */}
        <div className={cardCls}>
          <div className={headerCls}>
            <div><h3 className={titleCls}>User Roles & Permissions</h3><p className={subtitleCls}>Control access levels — {roles.length} roles</p></div>
            <Button onClick={() => router.push(`${p}/manage-roles`)} variant="secondary" className="font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl uppercase border">
              <Shield size={14} className="mr-1.5" /> Manage Roles
            </Button>
          </div>
          <div className="px-7 pb-7">
            {roles.length === 0 ? <EmptyState text="No custom roles configured." /> : (
              <div className="flex flex-wrap gap-2">
                {roles.map((r: any) => (
                  <span key={r.id} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">{r.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );

    // ── Step 6: Customers & CRM ───────────────────────────────────────────
    if (currentStep === 6) return (
      <div className="space-y-6">
        {/* Customers */}
        <div className={cardCls}>
          <div className={headerCls}>
            <div><h3 className={titleCls}>Customer Database</h3><p className={subtitleCls}>Guest records & loyalty — {customers.length} customers</p></div>
            <Button onClick={() => router.push(`${p}/customers`)} variant="secondary" className="font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl uppercase border">
              <Users size={14} className="mr-1.5" /> Manage Customers
            </Button>
          </div>
          <div className="px-7 pb-7">
            {customers.length === 0 ? <EmptyState text="No customers yet. They are added automatically during billing." /> : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {customers.slice(0, 6).map((c: any) => (
                  <div key={c.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 font-black text-sm">{c.firstName?.[0] || '?'}</div>
                    <div>
                      <p className="font-black text-xs uppercase text-slate-800 dark:text-white">{c.firstName} {c.lastName || ''}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{c.mobile || 'No phone'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Membership Plans */}
        <div className={cardCls}>
          <div className={headerCls}>
            <div><h3 className={titleCls}>Membership Plans</h3><p className={subtitleCls}>Loyalty & subscription tiers — {membershipPlans.length} plans</p></div>
            <Button onClick={() => openForm('membership-plan')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl shadow-lg">
              <Plus size={14} className="mr-1.5" /> Add Plan
            </Button>
          </div>
          <div className="px-7 pb-7">
            {membershipPlans.length === 0 ? <EmptyState text="No membership plans created. Add plans for loyalty programs." /> : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {membershipPlans.map((plan: any) => (
                  <div key={plan.id} className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 group hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-sm uppercase text-slate-800 dark:text-white">{plan.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">₹{plan.price} / {plan.validityDays}d</p>
                      </div>
                      <button onClick={() => openForm('membership-plan', plan)} className="p-1.5 text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all"><Settings size={13} /></button>
                    </div>
                    {plan.benefits && <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">{plan.benefits}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Accounts & Vouchers Quick Link */}
        <div className={`${cardCls} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center text-violet-600"><Ticket size={20} /></div>
              <div><p className="font-black text-sm uppercase text-slate-800 dark:text-white">Accounting Vouchers</p><p className="text-[10px] text-slate-400 font-bold uppercase">RECEIPT • PAYMENT • JOURNAL • CONTRA</p></div>
            </div>
            <Button onClick={() => router.push(`${p}/accounts`)} variant="secondary" className="font-black text-[10px] tracking-widest px-5 py-2.5 rounded-xl uppercase border">
              Open Accounts <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
        </div>
        <QuickLink label="Open Full CRM & Customer Portal" url={`${p}/customers`} router={router} />
      </div>
    );

    // ── Step 7: Inventory & Expenses ──────────────────────────────────────
    if (currentStep === 7) return (
      <div className="space-y-6">
        {/* Raw Inventory */}
        <div className={cardCls}>
          <div className={headerCls}>
            <div><h3 className={titleCls}>Raw Stock Inventory</h3><p className={subtitleCls}>Kitchen materials & supplies — {stockItems.length} items</p></div>
            <Button onClick={() => openForm('stock')} className="bg-teal-600 hover:bg-teal-700 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl shadow-lg">
              <Plus size={14} className="mr-1.5" /> Add Stock Item
            </Button>
          </div>
          <div className="px-7 pb-7">
            <DataTable
              columns={[
                { header: 'Item', cell: (r: any) => <span className="font-bold uppercase text-sm">{r.name}</span> },
                { header: 'Stock', cell: (r: any) => <span className={`font-black ${r.isLow ? 'text-red-500' : 'text-emerald-600'}`}>{r.currentStock} {r.unit}</span> },
                { header: 'Cost', cell: (r: any) => <span className="font-bold">₹{r.costPrice}</span> },
                { header: '', cell: (r: any) => <button onClick={() => openForm('stock', r)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Settings size={13} /></button> },
              ]}
              data={stockItems}
              loading={loading}
            />
          </div>
        </div>

        {/* Expense Categories */}
        <div className={cardCls}>
          <div className={headerCls}>
            <div><h3 className={titleCls}>Expense Categories</h3><p className={subtitleCls}>Organise your expense types — {expenseCategories.length} categories</p></div>
            <Button onClick={() => openForm('expense-category')} className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl shadow-lg">
              <Plus size={14} className="mr-1.5" /> Add Category
            </Button>
          </div>
          <div className="px-7 pb-7">
            {expenseCategories.length === 0 ? <EmptyState text="No expense categories. Add categories like Rent, Utilities, Supplies etc." /> : (
              <div className="flex flex-wrap gap-2">
                {expenseCategories.map((cat: any) => (
                  <button key={cat.id} onClick={() => openForm('expense-category', cat)} className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-all group">
                    <Tag size={12} className="text-orange-500" />
                    <span className="text-[11px] font-black uppercase text-orange-700 dark:text-orange-400">{cat.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <QuickLink label="Manage Expenses & Purchases" url={`${p}/expenses`} router={router} />
      </div>
    );

    // ── Step 8: Delivery Drivers ──────────────────────────────────────────
    if (currentStep === 8) return (
      <div className="space-y-6">
        <div className={cardCls}>
          <div className={headerCls}>
            <div><h3 className={titleCls}>Delivery Drivers</h3><p className={subtitleCls}>Hyperlocal delivery riders — {drivers.length} registered</p></div>
            <Button onClick={() => openForm('driver')} className="bg-orange-500 hover:bg-orange-600 text-white font-black text-[10px] tracking-widest px-6 py-3 rounded-2xl shadow-lg">
              <Plus size={14} className="mr-1.5" /> Add Driver
            </Button>
          </div>
          <div className="px-7 pb-7">
            {drivers.length === 0 ? <EmptyState text="No drivers added. Add delivery riders to assign orders." /> : (
              <DataTable
                columns={[
                  { header: 'Driver', cell: (r: any) => <div><p className="font-black text-sm uppercase">{r.name}</p><p className="text-[10px] text-slate-400 font-bold">{r.phone || '---'}</p></div> },
                  { header: 'Vehicle', cell: (r: any) => <span className="font-bold uppercase text-sm">{r.vehicleNumber || '---'}</span> },
                  { header: 'Type', cell: (r: any) => <span className="text-[10px] font-black px-2 py-1 bg-orange-50 text-orange-600 rounded uppercase">{r.vehicleType || 'BIKE'}</span> },
                  { header: 'Status', cell: (r: any) => <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${r.isAvailable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{r.isAvailable ? 'Available' : 'Busy'}</span> },
                  { header: '', cell: (r: any) => <button onClick={() => openForm('driver', r)} className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white"><Settings size={13} /></button> },
                ]}
                data={drivers}
                loading={loading}
              />
            )}
          </div>
        </div>
        <QuickLink label="Manage Deliveries & Tracking" url={`${p}/operations/delivery`} router={router} />
      </div>
    );

    // ── Step 9: Go Live ───────────────────────────────────────────────────
    if (currentStep === 9) return (
      <div className="space-y-8">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-10 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-pos-primary/20 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-[80px] rounded-full -mr-20 -mt-20" />
          <div className="relative">
            <div className="w-16 h-16 bg-pos-primary rounded-[20px] flex items-center justify-center mb-6 shadow-xl shadow-pos-primary/40">
              <Rocket size={30} className="text-white" />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-3">You're Ready to Launch!</h2>
            <p className="text-white/60 text-sm mb-8 max-w-lg">Your restaurant setup is complete. Start taking orders, billing customers, and managing your entire operation from the POS terminal.</p>
            <Button
              onClick={() => router.push(`${p}/billing`)}
              className="bg-pos-primary hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-pos-primary/40 group"
            >
              Launch Billing <ArrowRight size={18} className="ml-2 group-hover:translate-x-1.5 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Setup Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Menu Items', value: products.length, icon: Package, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/10' },
            { label: 'Categories', value: categories.length, icon: Layers, color: 'text-pos-primary', bg: 'bg-red-50 dark:bg-red-900/10' },
            { label: 'Tables', value: tables.length, icon: TableIcon, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/10' },
            { label: 'Staff', value: staff.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10' },
            { label: 'Customers', value: customers.length, icon: User, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/10' },
            { label: 'Stock Items', value: stockItems.length, icon: Box, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/10' },
            { label: 'Pay Modes', value: paymentModes.length, icon: CreditCard, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/10' },
            { label: 'Memberships', value: membershipPlans.length, icon: IdCard, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10' },
            { label: 'Exp. Categories', value: expenseCategories.length, icon: Tag, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
            { label: 'Drivers', value: drivers.length, icon: Bike, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10' },
          ].map((stat, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3 ${stat.color}`}><stat.icon size={18} /></div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Quick Launch Links */}
        <div className={`${cardCls} p-7`}>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white mb-5">Quick Launch</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Dine In', url: `${p}/operations/tables`, color: 'bg-indigo-600 hover:bg-indigo-700', icon: TableIcon },
              { label: 'Take Away', url: `${p}/billing`, color: 'bg-emerald-600 hover:bg-emerald-700', icon: Package },
              { label: 'Reports', url: `${p}/reports`, color: 'bg-violet-600 hover:bg-violet-700', icon: LayoutGrid },
              { label: 'Settings', url: `${p}/settings`, color: 'bg-slate-700 hover:bg-slate-800', icon: Settings },
            ].map((link, i) => (
              <button key={i} onClick={() => router.push(link.url)} className={`${link.color} text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02]`}>
                <link.icon size={15} /> {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── Inline Form Modals ───────────────────────────────────────────────────
  const renderFormModal = () => {
    const inputCls = 'w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-pos-primary/20 transition-all text-sm';
    const labelCls = 'text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 block mb-1.5';
    const selectCls = 'w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold outline-none text-sm';

    if (subType === 'category') return <CategoryForm initialData={selectedItem} onSubmit={(d) => handleGeneralSubmit('category', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />;
    if (subType === 'product') return <RestaurantProductForm initialData={selectedItem} onSubmit={(d) => handleGeneralSubmit('product', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />;
    if (subType === 'bar-product') return <BarProductForm initialData={selectedItem} onSubmit={(d) => handleGeneralSubmit('bar-product', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />;
    if (subType === 'floor') return <FloorForm initialData={selectedItem} onSubmit={(d) => handleGeneralSubmit('floor', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} restaurantPosEnabled={propertyDetails?.restaurantPosEnabled !== false} barPosEnabled={propertyDetails?.barPosEnabled !== false} cafePosEnabled={propertyDetails?.cafePosEnabled !== false} />;
    if (subType === 'table') return <TableForm initialData={selectedItem} floors={floors} onSubmit={(d) => handleGeneralSubmit('table', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />;
    if (subType === 'staff') return <StaffMemberForm initialData={selectedItem} onSubmit={(d) => handleGeneralSubmit('staff', d)} onCancel={() => setIsFormOpen(false)} loading={mutationLoading} />;

    if (subType === 'payment') return (
      <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleGeneralSubmit('payment', { name: fd.get('name'), type: fd.get('type'), isActive: fd.get('isActive') === 'on' }); }} className="space-y-4 p-4">
        <div><label className={labelCls}>Mode Name</label><input name="name" defaultValue={selectedItem?.name} className={inputCls} placeholder="e.g. PhonePe QR" required /></div>
        <div><label className={labelCls}>System Type</label><select name="type" defaultValue={selectedItem?.type || 'UPI'} className={selectCls}><option value="CASH">CASH</option><option value="CARD">CARD</option><option value="UPI">UPI</option><option value="VOUCHER">VOUCHER</option></select></div>
        <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl"><span className="text-xs font-black uppercase text-slate-600 dark:text-slate-300">Accepting Payments</span><input type="checkbox" name="isActive" defaultChecked={selectedItem?.isActive !== false} className="w-5 h-5 accent-pink-500" /></div>
        <div className="flex gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Cancel</Button><Button type="submit" loading={mutationLoading} className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Save Mode</Button></div>
      </form>
    );

    if (subType === 'stock') return (
      <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleGeneralSubmit('stock', { name: fd.get('name'), sku: fd.get('sku'), unit: fd.get('unit'), openingStock: Number(fd.get('openingStock')), reorderLevel: Number(fd.get('reorderLevel')), minimumStock: Number(fd.get('minimumStock')), costPrice: Number(fd.get('costPrice')) }); }} className="space-y-4 p-4">
        <div><label className={labelCls}>Item Name</label><input name="name" defaultValue={selectedItem?.name} className={inputCls} placeholder="e.g. Basmati Rice" required /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>SKU</label><input name="sku" defaultValue={selectedItem?.sku} className={inputCls} placeholder="SKU-001" /></div><div><label className={labelCls}>Unit</label><select name="unit" defaultValue={selectedItem?.unit || 'KG'} className={selectCls}><option>KG</option><option>PCS</option><option>LTR</option><option>BOX</option></select></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>Cost Price</label><input name="costPrice" type="number" defaultValue={selectedItem?.costPrice} className={inputCls} placeholder="0.00" /></div><div><label className={labelCls}>Opening Stock</label><input name="openingStock" type="number" defaultValue={selectedItem?.openingStock} className={`${inputCls} ${selectedItem ? 'opacity-60' : ''}`} placeholder="0" disabled={!!selectedItem} /></div></div>
        <div className="flex gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Cancel</Button><Button type="submit" loading={mutationLoading} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Save Item</Button></div>
      </form>
    );

    if (subType === 'expense-category') return (
      <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleGeneralSubmit('expense-category', { name: fd.get('name'), description: fd.get('description') }); }} className="space-y-4 p-4">
        <div><label className={labelCls}>Category Name</label><input name="name" defaultValue={selectedItem?.name} className={inputCls} placeholder="e.g. Utilities, Rent, Supplies" required /></div>
        <div><label className={labelCls}>Description (Optional)</label><input name="description" defaultValue={selectedItem?.description} className={inputCls} placeholder="Short description" /></div>
        <div className="flex gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Cancel</Button><Button type="submit" loading={mutationLoading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Save Category</Button></div>
      </form>
    );

    if (subType === 'driver') return (
      <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleGeneralSubmit('driver', { name: fd.get('name'), phone: fd.get('phone'), vehicleNumber: fd.get('vehicleNumber'), vehicleType: fd.get('vehicleType'), isAvailable: true }); }} className="space-y-4 p-4">
        <div><label className={labelCls}>Driver Name</label><input name="name" defaultValue={selectedItem?.name} className={inputCls} placeholder="Full name" required /></div>
        <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>Phone</label><input name="phone" defaultValue={selectedItem?.phone} className={inputCls} placeholder="+91..." /></div><div><label className={labelCls}>Vehicle Number</label><input name="vehicleNumber" defaultValue={selectedItem?.vehicleNumber} className={inputCls} placeholder="MH12AB1234" /></div></div>
        <div><label className={labelCls}>Vehicle Type</label><select name="vehicleType" defaultValue={selectedItem?.vehicleType || 'BIKE'} className={selectCls}><option value="BIKE">Bike / Scooter</option><option value="BICYCLE">Bicycle</option><option value="CAR">Car</option><option value="VAN">Van</option></select></div>
        <div className="flex gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Cancel</Button><Button type="submit" loading={mutationLoading} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Save Driver</Button></div>
      </form>
    );

    if (subType === 'membership-plan') return (
      <form onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setMutationLoading(true);
        try {
          const payload = { name: fd.get('name'), description: fd.get('description'), discountType: fd.get('discountType'), discountValue: Number(fd.get('discountValue')), minOrderValue: Number(fd.get('minOrderValue') || 0), validityDays: Number(fd.get('validityDays') || 365), isActive: true };
          if (selectedItem) { await fetch(`/api/memberships/plans/${selectedItem.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); }
          else { await fetch('/api/memberships/plans', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); }
          setIsFormOpen(false); fetchData();
        } catch(err) { console.error(err); } finally { setMutationLoading(false); }
      }} className="space-y-4 p-4">
        <div><label className={labelCls}>Plan Name</label><input name="name" defaultValue={selectedItem?.name} className={inputCls} placeholder="e.g. Gold Member, VIP" required /></div>
        <div><label className={labelCls}>Description</label><textarea name="description" defaultValue={selectedItem?.description} className={`${inputCls} h-20 resize-none`} placeholder="Membership benefits..." /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Discount Type</label><select name="discountType" defaultValue={selectedItem?.discountType || 'PERCENTAGE'} className={selectCls}><option value="PERCENTAGE">Percentage (%)</option><option value="FLAT">Flat Amount (₹)</option></select></div>
          <div><label className={labelCls}>Discount Value</label><input name="discountValue" type="number" defaultValue={selectedItem?.discountValue} className={inputCls} placeholder="10" required /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Min Order Value (₹)</label><input name="minOrderValue" type="number" defaultValue={selectedItem?.minOrderValue || 0} className={inputCls} placeholder="0" /></div>
          <div><label className={labelCls}>Validity (Days)</label><input name="validityDays" type="number" defaultValue={selectedItem?.validityDays || 365} className={inputCls} placeholder="365" /></div>
        </div>
        <div className="flex gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Cancel</Button><Button type="submit" loading={mutationLoading} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Save Plan</Button></div>
      </form>
    );

    if (subType === 'outlet') return (
      <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); handleGeneralSubmit('outlet', { name: fd.get('name'), code: fd.get('code'), city: fd.get('city'), state: fd.get('state'), country: fd.get('country'), address: fd.get('address'), phone: fd.get('phone') }); }} className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>Outlet Name</label><input name="name" defaultValue={selectedItem?.name} className={inputCls} required /></div><div><label className={labelCls}>Property Code</label><input name="code" defaultValue={selectedItem?.code} className={`${inputCls} uppercase`} required /></div></div>
        <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>City</label><input name="city" defaultValue={selectedItem?.city} className={inputCls} /></div><div><label className={labelCls}>Phone</label><input name="phone" defaultValue={selectedItem?.phone} className={inputCls} /></div></div>
        <div><label className={labelCls}>Full Address (for invoices)</label><textarea name="address" defaultValue={selectedItem?.address} className={`${inputCls} h-28 resize-none`} /></div>
        <div className="flex gap-3 pt-2"><Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)} className="flex-1 py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Cancel</Button><Button type="submit" loading={mutationLoading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-2xl font-black text-[10px] tracking-widest uppercase">Save Profile</Button></div>
      </form>
    );

    return null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-32 font-sans">
      {/* Header */}
      <div className="mb-8">
        <PageHeader title="Setup Wizard" subtitle="Step-by-step setup for your entire restaurant operation." showBack backUrl={`${p}/operations`} />
      </div>

      {/* Step Progress Bar */}
      <div className="mb-10 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-0 min-w-max mx-auto px-1">
          {STEPS.map((s, idx) => {
            const isDone = completedSteps.includes(s.id);
            const isActive = currentStep === s.id;
            const Icon = s.icon;
            return (
              <React.Fragment key={s.id}>
                <button onClick={() => goToStep(s.id)} className={`flex flex-col items-center gap-2 px-3 group transition-all ${isActive ? 'scale-105' : 'opacity-60 hover:opacity-90'}`}>
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm
                    ${isActive ? `${s.color} text-white shadow-lg` : isDone ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {isDone && !isActive ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <div className="text-center">
                    <p className={`text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${isActive ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>{s.label}</p>
                    <p className={`text-[8px] font-bold uppercase ${isActive ? 'text-slate-500' : 'text-slate-300 dark:text-slate-600'}`}>Step {s.id}</p>
                  </div>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={`h-px w-8 mx-1 flex-shrink-0 transition-colors ${completedSteps.includes(s.id) ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Current Step Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-14 h-14 rounded-[18px] ${step.color} text-white flex items-center justify-center shadow-xl`}>
          <step.icon size={26} />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white">{step.label}</h2>
            {completedSteps.includes(step.id) && (
              <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle2 size={11} /> Done
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{step.desc}</p>
        </div>
        <div className="ml-auto">
          <Button onClick={fetchData} variant="secondary" className="p-3 rounded-2xl" title="Refresh data">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      {/* Step Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" key={currentStep}>
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 hidden sm:block">
              Step {currentStep} of {STEPS.length}
            </p>
            <div className="flex gap-1">
              {STEPS.map(s => (
                <div key={s.id} className={`h-1.5 rounded-full transition-all ${currentStep === s.id ? 'w-6 bg-pos-primary' : completedSteps.includes(s.id) ? 'w-1.5 bg-emerald-400' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button onClick={goBack} variant="secondary" className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                <ArrowLeft size={14} className="mr-1.5" /> Back
              </Button>
            )}
            {currentStep < STEPS.length ? (
              <Button onClick={goNext} className="bg-pos-primary hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg group">
                Next Step <ArrowRight size={14} className="ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : (
              <Button onClick={() => router.push(`${p}/billing`)} className="bg-pos-primary hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg group">
                Launch POS <Rocket size={14} className="ml-1.5 group-hover:scale-110 transition-transform" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={`${selectedItem ? 'Update' : 'New'} ${subType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
        maxWidth={subType === 'bar-product' ? '4xl' : subType === 'product' ? '2xl' : 'lg'}
      >
        <div className="overflow-y-auto max-h-[80vh]">{renderFormModal()}</div>
      </Modal>

      {/* AI Scan Modal */}
      <Modal isOpen={isAiModalOpen} onClose={() => { setIsAiModalOpen(false); setScannedData(null); setFile(null); }} title="Mint AI — Menu Scanner" maxWidth="3xl">
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {!scannedData ? (
            <form onSubmit={handleAiScan} className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3"><Sparkles size={20} className="text-pos-primary" /><h3 className="font-black uppercase tracking-tight">AI Menu Recognition</h3></div>
                <p className="text-xs text-white/60">Upload your existing menu image or PDF and AI will extract all categories and items automatically.</p>
              </div>
              <div><label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 block mb-2">Menu Type</label><div className="flex gap-3">{['RESTAURANT', 'BAR'].map(t => <button key={t} type="button" onClick={() => setAiMenuType(t as any)} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${aiMenuType === t ? 'border-pos-primary bg-pos-primary/5 text-pos-primary' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>{t === 'RESTAURANT' ? '🍽️' : '🍺'} {t}</button>)}</div></div>
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center hover:border-pos-primary/30 transition-colors">
                <FileUp size={32} className="text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-500 mb-3">Upload Menu Image or PDF</p>
                <input type="file" accept="image/*,.pdf" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="menu-file" />
                <label htmlFor="menu-file" className="cursor-pointer px-6 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">{file ? file.name : 'Choose File'}</label>
              </div>
              <div className="flex gap-3"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={includeTax} onChange={e => setIncludeTax(e.target.checked)} className="w-4 h-4 accent-pos-primary" /><span className="text-xs font-bold text-slate-600 dark:text-slate-300">Extract Tax Info</span></label><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={includeHsn} onChange={e => setIncludeHsn(e.target.checked)} className="w-4 h-4 accent-pos-primary" /><span className="text-xs font-bold text-slate-600 dark:text-slate-300">Extract HSN Codes</span></label></div>
              <Button type="submit" loading={scanning} disabled={!file} className="w-full bg-pos-primary hover:bg-red-700 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest">{scanning ? 'Scanning...' : 'Scan Menu with AI'}</Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-500" /><div><p className="font-black text-sm text-emerald-800 dark:text-emerald-400">Scan Complete!</p><p className="text-xs text-emerald-600">{scannedData.categories?.length || 0} categories found</p></div></div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {scannedData.categories?.map((cat: any, ci: number) => (
                  <div key={ci} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <p className="font-black uppercase text-sm text-slate-800 dark:text-white mb-2">{cat.name} <span className="text-[10px] text-slate-400">({cat.items?.length} items)</span></p>
                    <div className="flex flex-wrap gap-1">{cat.items?.slice(0, 5).map((item: any, ii: number) => <span key={ii} className="text-[10px] px-2 py-0.5 bg-white dark:bg-slate-700 rounded-lg font-bold text-slate-600 dark:text-slate-300">{item.name} ₹{item.sellingPrice}</span>)}{cat.items?.length > 5 && <span className="text-[10px] px-2 py-0.5 text-slate-400">+{cat.items.length - 5} more</span>}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2"><Button variant="secondary" onClick={() => setScannedData(null)} disabled={mutationLoading} className="flex-1 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl">Scan Again</Button><Button onClick={handleSaveScannedData} loading={mutationLoading} className="flex-[2] bg-pos-primary text-white py-3.5 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl">Confirm & Save</Button></div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-10 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
        <Circle size={20} className="text-slate-300 dark:text-slate-600" />
      </div>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{text}</p>
    </div>
  );
}

function QuickLink({ label, url, router }: { label: string; url: string; router: any }) {
  return (
    <button onClick={() => router.push(url)} className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all group">
      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">{label}</span>
      <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
    </button>
  );
}
