'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  FileText,
  CheckCircle2,
  X,
  UtensilsCrossed,
  MessageCircle,
  Truck,
  Sparkles,
  Building2,
  Calendar,
  Filter,
  ArrowLeft,
  Package,
  Layers,
  TrendingUp,
  Clock,
  Boxes,
  ChevronRight,
  ExternalLink,
  Store,
  DollarSign
} from 'lucide-react';
import { POList } from './components/POList';
import {
  PurchaseOrderForm,
  type POFormItem,
  type VendorOption,
  type StaffOption,
  type ProductOption,
} from './components/PurchaseOrderForm';
import { PODetailsModal, type DetailedPO } from './components/PODetailsModal';
import { KitchenRequisitionsList, type KitchenRequisitionItem } from './components/KitchenRequisitionsList';
import { ShopProcurementHub } from './components/ShopProcurementHub';
import { openWhatsAppPO } from '@/lib/whatsapp-po';
import { toast } from 'sonner';

export default function PurchasingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'KITCHEN_REQS'>('ORDERS');
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<DetailedPO | null>(null);

  // Form Pre-fill State (for Kitchen indent conversion)
  const [formInitialItems, setFormInitialItems] = useState<POFormItem[]>([]);
  const [formInitialNotes, setFormInitialNotes] = useState('');
  const [formStockRequestIds, setFormStockRequestIds] = useState<string[]>([]);

  // Filtering & Search
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [vendorFilter, setVendorFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  // Core Data
  const [orders, setOrders] = useState<DetailedPO[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffOption[]>([]);
  const [stockProducts, setStockProducts] = useState<ProductOption[]>([]);
  const [kitchenRequests, setKitchenRequests] = useState<KitchenRequisitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqsLoading, setReqsLoading] = useState(false);

  // Property Details
  const [propertyId, setPropertyId] = useState<string>('');
  const [hotelName, setHotelName] = useState<string>('Grand Hotel');
  const [hotelPhone, setHotelPhone] = useState<string>('');
  const [hotelAddress, setHotelAddress] = useState<string>('');

  // Detect initial tab from query parameter e.g. ?tab=kitchen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'kitchen' || tabParam === 'kitchen_reqs') {
        setActiveTab('KITCHEN_REQS');
      }
    }
  }, []);

  // Fetch session & active property
  useEffect(() => {
    async function initProperty() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        const propRes = await fetch('/api/setup/properties');
        const propData = await propRes.json();

        if (propData.success && Array.isArray(propData.data) && propData.data.length > 0) {
          const current =
            propData.data.find((p: any) => p.id === sessionData.user?.propertyId) ||
            propData.data[0];

          if (current?.id) {
            setPropertyId(current.id);
            setHotelName(current.name || 'Grand Hotel');
            setHotelPhone(current.phone || '');
            setHotelAddress(current.address || '');
          }
        }
      } catch (err) {
        console.warn('Failed to resolve property:', err);
      }
    }

    initProperty();
  }, []);

  // Fetch real B2B orders & vendors from database
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, vendorsRes, staffRes, stockRes] = await Promise.all([
        fetch('/api/b2b/orders'),
        fetch('/api/hotel/vendor'),
        fetch('/api/staff-members').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/inventory/stock-items').then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      const ordersData = await ordersRes.json();
      const vendorsData = await vendorsRes.json();

      if (Array.isArray(vendorsData.data)) {
        setVendors(
          vendorsData.data.map((v: any) => ({
            id: v.id,
            name: v.name,
            phone: v.phone || '',
            category: v.category || 'General',
          }))
        );
      }

      if (staffRes?.data && Array.isArray(staffRes.data)) {
        setStaffMembers(
          staffRes.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            phone: s.phone || '',
            designation: s.designation || 'Staff',
          }))
        );
      }

      if (stockRes?.data && Array.isArray(stockRes.data)) {
        setStockProducts(
          stockRes.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            unit: p.unit || 'Kg',
            costPrice: Number(p.costPrice) || 0,
            itemType: p.itemType || p.sku || 'F&B',
            currentStock: Number(p.currentStock) || 0,
          }))
        );
      }

      if (Array.isArray(ordersData)) {
        const mappedOrders: DetailedPO[] = ordersData.map((o: any) => {
          let mappedStatus: DetailedPO['status'] = 'SENT';
          if (o.status === 'PENDING') mappedStatus = 'SENT';
          else if (o.status === 'ACCEPTED' || o.status === 'PROCESSING' || o.status === 'CONFIRMED')
            mappedStatus = 'CONFIRMED';
          else if (o.status === 'DELIVERED') mappedStatus = 'DELIVERED';
          else if (o.status === 'CANCELLED') mappedStatus = 'CANCELLED';
          else if (o.status === 'DRAFT') mappedStatus = 'DRAFT';

          const createdDateStr = o.createdAt
            ? new Date(o.createdAt).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];

          const formattedItems = Array.isArray(o.items)
            ? o.items.map((i: any) => ({
                id: i.id,
                name: i.product?.name || i.name || 'Purchased Item',
                description: i.product?.description || '',
                quantity: i.quantity || 1,
                unit: i.product?.unit || i.unit || 'units',
                unitPrice: i.unitPrice || 0,
                totalPrice: i.totalPrice || (i.quantity || 1) * (i.unitPrice || 0),
              }))
            : [];

          return {
            id: o.id,
            poNumber: o.orderNo || `PO-${o.id.substring(0, 6).toUpperCase()}`,
            vendorId: o.supplierId,
            vendor: o.supplier?.name || 'Vendor',
            vendorPhone: o.supplier?.phone || '',
            vendorEmail: o.supplier?.email || '',
            vendorCategory: o.supplier?.category || '',
            vendorAddress: o.supplier?.address || '',
            items: formattedItems,
            totalAmount: o.totalAmount || 0,
            status: mappedStatus,
            createdAt: createdDateStr,
            expectedDate: o.deliveryDate
              ? new Date(o.deliveryDate).toISOString().split('T')[0]
              : undefined,
            notes: o.comments || '',
            hotelName: o.property?.name || hotelName,
            hotelPhone: o.property?.phone || hotelPhone,
            assignedStaffName: o.buyerRestaurant || '',
            assignedStaffPhone: o.buyerPhone || '',
          };
        });

        setOrders(mappedOrders);
      }
    } catch (err) {
      console.error('Purchasing data fetch error:', err);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  }, [hotelName, hotelPhone]);

  // Fetch kitchen staff requisitions
  const fetchKitchenRequests = useCallback(async () => {
    setReqsLoading(true);
    try {
      const res = await fetch('/api/inventory/requests?department=KITCHEN');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setKitchenRequests(
          data.data.map((r: any) => ({
            id: r.id,
            itemName: r.itemName,
            requestedQty: r.requestedQty || 1,
            unit: r.unit || 'units',
            urgency: r.urgency || 'NORMAL',
            status: r.status || 'PENDING',
            requestedBy: r.requestedBy || 'Kitchen Staff',
            department: r.department || 'KITCHEN',
            remarks: r.remarks || '',
            createdAt: r.createdAt,
            currentStock: r.currentStock || 0,
          }))
        );
      }
    } catch (err) {
      console.warn('Failed to load kitchen requests:', err);
    } finally {
      setReqsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchKitchenRequests();
  }, [fetchData, fetchKitchenRequests]);

  // Combined Filters (Search, Status, Vendor)
  const filteredOrders = orders.filter((o) => {
    // 1. Status Filter
    if (statusFilter === 'PENDING') {
      if (o.status !== 'SENT' && o.status !== 'CONFIRMED' && o.status !== 'DRAFT') return false;
    } else if (statusFilter === 'DELIVERED') {
      if (o.status !== 'DELIVERED') return false;
    } else if (statusFilter === 'CANCELLED') {
      if (o.status !== 'CANCELLED') return false;
    }

    // 2. Vendor Filter
    if (vendorFilter !== 'ALL' && o.vendorId !== vendorFilter) {
      return false;
    }

    // 3. Search Query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchVendor = o.vendor.toLowerCase().includes(q);
      const matchPO = o.poNumber.toLowerCase().includes(q);
      const matchPhone = o.vendorPhone && o.vendorPhone.includes(q);
      const matchItem = o.items.some((i) => i.name.toLowerCase().includes(q));
      if (!matchVendor && !matchPO && !matchPhone && !matchItem) return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalOrdersCount = orders.length;
  const totalOrdersValue = orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

  const pendingOrders = orders.filter(
    (o) => o.status === 'SENT' || o.status === 'CONFIRMED' || o.status === 'DRAFT'
  );
  const totalPendingValue = pendingOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalDeliveredValue = deliveredOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

  const pendingReqCount = kitchenRequests.filter((r) => r.status === 'PENDING').length;

  // Approve / Confirm PO
  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/b2b/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status: 'ACCEPTED', note: 'PO Confirmed by Manager' }),
      });
      if (res.ok) {
        toast.success('Purchase Order Confirmed!');
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: 'CONFIRMED' } : o))
        );
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Mark Goods Delivered & update stock in Inventory
  const handleDeliver = async (id: string) => {
    try {
      const res = await fetch('/api/b2b/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: id,
          status: 'DELIVERED',
          note: 'Goods received & verified by Hotel Store/Kitchen',
        }),
      });
      if (res.ok) {
        toast.success('Goods Received! Stock automatically added to Inventory. 📦');
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: 'DELIVERED' } : o))
        );
        fetchData();
        fetchKitchenRequests();
      }
    } catch {
      toast.error('Failed to receive goods');
    }
  };

  // Cancel PO
  const handleCancel = async (id: string) => {
    try {
      const res = await fetch('/api/b2b/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: id, status: 'CANCELLED', note: 'PO Cancelled by Manager' }),
      });
      if (res.ok) {
        toast.success('Purchase Order Cancelled');
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: 'CANCELLED' } : o))
        );
      }
    } catch {
      toast.error('Failed to cancel order');
    }
  };

  // Create new Purchase Order & optionally open WhatsApp
  const handleCreatePO = async (data: {
    vendorId: string;
    vendorName: string;
    vendorPhone?: string;
    expectedDate: string;
    notes: string;
    items: POFormItem[];
    totalAmount: number;
    sendWhatsAppImmediately: boolean;
    receiveImmediately: boolean;
    assignToKitchenRunner?: boolean;
    stockRequestIds?: string[];
    assignedStaffName?: string;
    assignedStaffPhone?: string;
  }) => {
    try {
      const resolvedPropId = propertyId || 'cmoy7oxso0002ay70x6zmbtvj';

      const res = await fetch('/api/b2b/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: resolvedPropId,
          supplierId: data.vendorId,
          totalAmount: data.totalAmount,
          deliveryDate: data.expectedDate || null,
          comments: data.notes || null,
          stockRequestIds: data.stockRequestIds || [],
          assignedStaffName: data.assignedStaffName || (data.assignToKitchenRunner ? 'Kitchen Staff / Runner' : null),
          assignedStaffPhone: data.assignedStaffPhone || null,
          status: data.receiveImmediately ? 'DELIVERED' : 'PENDING',
          autoReceive: data.receiveImmediately,
          items: data.items.map((i) => ({
            name: i.name,
            category: i.category || 'Kitchen & F&B',
            description: i.description || null,
            quantity: Number(i.qty) || 1,
            unitPrice: Number(i.price) || 0,
            unit: i.unit,
          })),
        }),
      });

      const newOrder = await res.json();
      if (!res.ok) {
        toast.error(newOrder.error || 'Failed to create PO');
        return;
      }

      if (data.receiveImmediately) {
        toast.success(`Purchase Order received & ${data.items.length} items added to Inventory Stock! 📦`);
      } else if (data.assignToKitchenRunner) {
        toast.success(`Sent to Kitchen Runner! 🏃‍♂️ Order is live on Kitchen Portal Market Buying List.`);
      } else {
        toast.success(`Purchase Order created for ${data.vendorName}!`);
      }

      setShowForm(false);
      setFormInitialItems([]);
      setFormInitialNotes('');
      setFormStockRequestIds([]);

      // Auto-dispatch via WhatsApp if requested
      if (data.sendWhatsAppImmediately) {
        const orderNo = newOrder.orderNo || `PO-${newOrder.id.substring(0, 6)}`;
        openWhatsAppPO({
          hotelName,
          hotelPhone,
          poNumber: orderNo,
          orderDate: new Date().toISOString().split('T')[0],
          expectedDate: data.expectedDate,
          vendorName: data.vendorName,
          vendorPhone: data.vendorPhone,
          assignedStaffName: data.assignedStaffName,
          assignedStaffPhone: data.assignedStaffPhone,
          items: data.items.map((i) => ({
            name: i.name,
            description: i.description,
            quantity: Number(i.qty) || 1,
            unit: i.unit,
            unitPrice: Number(i.price) || 0,
          })),
          totalAmount: data.totalAmount,
          notes: data.notes,
        });
        toast.success(`WhatsApp opened for ${data.vendorName}`);
      }

      fetchData();
      fetchKitchenRequests();
    } catch (err: any) {
      console.error('PO Creation failed:', err);
      toast.error('Failed to create PO');
    }
  };

  // Convert Kitchen Requisitions into a Purchase Order
  const handleConvertKitchenToPO = (selected: KitchenRequisitionItem[]) => {
    const prefilledItems: POFormItem[] = selected.map((s) => ({
      name: s.itemName,
      qty: s.requestedQty,
      unit: s.unit || 'Kg',
      price: 0,
      stockRequestId: s.id,
    }));

    const combinedNotes = `Kitchen indent conversion (${selected
      .map((s) => s.requestedBy)
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(', ')}). High priority raw materials.`;

    setFormInitialItems(prefilledItems);
    setFormInitialNotes(combinedNotes);
    setFormStockRequestIds(selected.map((s) => s.id));
    setShowForm(true);
    setActiveTab('ORDERS');
  };

  // Quick Shop Order Execution (Kitchen Runner, Direct Inward or WhatsApp PO from Shop Hub)
  const handleQuickShopOrder = async (data: {
    vendorId: string;
    vendorName: string;
    vendorPhone?: string;
    items: POFormItem[];
    totalAmount: number;
    receiveImmediately: boolean;
    sendWhatsAppImmediately: boolean;
    assignToKitchenRunner?: boolean;
    notes: string;
  }) => {
    try {
      const resolvedPropId = propertyId || 'cmoy7oxso0002ay70x6zmbtvj';
      const payload = {
        propertyId: resolvedPropId,
        supplierId: data.vendorId,
        buyerRestaurant: data.assignToKitchenRunner ? 'Kitchen Staff / Runner' : hotelName,
        buyerPhone: hotelPhone,
        items: data.items.map((it) => ({
          name: it.name,
          quantity: it.qty,
          unit: it.unit,
          unitPrice: it.price || 0,
        })),
        totalAmount: data.totalAmount,
        comments: data.notes,
        status: data.receiveImmediately ? 'DELIVERED' : 'PENDING',
        autoReceive: data.receiveImmediately,
      };

      const res = await fetch('/api/b2b/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to create order');
      }

      if (data.receiveImmediately) {
        toast.success('Stock Inward Successful! Items added directly to Hotel Inventory. 📦');
      } else if (data.assignToKitchenRunner) {
        toast.success('Sent to Kitchen Runner! 🏃‍♂️ Order is live on Kitchen Portal Market Buying List.');
      } else {
        toast.success(`Purchase Order created successfully for ${data.vendorName}!`);
      }

      if (data.sendWhatsAppImmediately) {
        const orderNo = json.orderNo || `PO-${json.id ? json.id.substring(0, 6) : 'NEW'}`;
        openWhatsAppPO({
          hotelName,
          hotelPhone,
          poNumber: orderNo,
          orderDate: new Date().toISOString().split('T')[0],
          vendorName: data.vendorName,
          vendorPhone: data.vendorPhone,
          items: data.items.map((i) => ({
            name: i.name,
            quantity: Number(i.qty) || 1,
            unit: i.unit,
            unitPrice: Number(i.price) || 0,
          })),
          totalAmount: data.totalAmount,
          notes: data.notes,
        });
        toast.success(`WhatsApp opened for ${data.vendorName}`);
      }

      fetchData();
      fetchKitchenRequests();
    } catch (err: any) {
      console.error('Quick shop order error:', err);
      toast.error(err.message || 'Failed to execute shop order');
    }
  };

  const handleOpenFullFormWithShopItems = (
    items: POFormItem[],
    vendorId?: string,
    notes?: string
  ) => {
    setFormInitialItems(items);
    setFormInitialNotes(notes || '');
    setFormStockRequestIds([]);
    setShowForm(true);
  };

  return (
    <div className="space-y-3.5 pb-16 max-w-[1440px] mx-auto px-2 sm:px-4 text-slate-100">
      {/* 1. Sleek Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 sm:p-3.5 rounded-xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <ShoppingCart size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Purchasing & Stock Inward (GRN)
              </h1>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Truck size={11} /> Auto-Stock Inward
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Order materials by shop, inward items directly to inventory, or dispatch POs via WhatsApp.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <button
            onClick={() => {
              fetchData();
              fetchKitchenRequests();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
            title="Refresh Orders & Indents"
          >
            <RefreshCw size={13} className={loading || reqsLoading ? 'animate-spin' : ''} />
          </button>

          <Link
            href="/hotel/inventory"
            className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition"
            title="View Real-Time Hotel Stock Inventory"
          >
            <Boxes size={13} className="text-cyan-400" />
            <span className="hidden md:inline">Live Stock</span>
          </Link>

          <button
            onClick={() => {
              setFormInitialItems([]);
              setFormInitialNotes('');
              setFormStockRequestIds([]);
              setShowForm(true);
            }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Truck size={13} />
            <span>Direct Inward 📦</span>
          </button>

          <button
            onClick={() => {
              setFormInitialItems([]);
              setFormInitialNotes('');
              setFormStockRequestIds([]);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm active:scale-95"
          >
            <Plus size={13} />
            <span>{showForm ? 'Close Form' : 'New PO'}</span>
          </button>
        </div>
      </div>

      {/* 2. Compact Performance / Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {/* Card 1: Total Orders */}
        <div className="rounded-xl p-2.5 sm:p-3 bg-slate-900/70 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Orders</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-black text-white font-mono">{totalOrdersCount}</span>
              <span className="text-[11px] text-slate-400 font-mono">₹{totalOrdersValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <FileText size={13} />
          </div>
        </div>

        {/* Card 2: Awaiting Delivery / Pending */}
        <div className="rounded-xl p-2.5 sm:p-3 bg-amber-950/15 border border-amber-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Awaiting Delivery</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-black text-amber-300 font-mono">{pendingOrders.length}</span>
              <span className="text-[11px] text-amber-400/80 font-mono">₹{totalPendingValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={13} />
          </div>
        </div>

        {/* Card 3: Stock Received & Added to Inventory */}
        <div className="rounded-xl p-2.5 sm:p-3 bg-emerald-950/15 border border-emerald-500/20 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Stock Received (GRN)</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-black text-emerald-300 font-mono">{deliveredOrders.length}</span>
              <span className="text-[11px] text-emerald-400/80 font-mono">₹{totalDeliveredValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={13} />
          </div>
        </div>

        {/* Card 4: Kitchen Indents Pending */}
        <div
          onClick={() => setActiveTab('KITCHEN_REQS')}
          className="rounded-xl p-2.5 sm:p-3 bg-orange-950/15 border border-orange-500/20 shadow-sm flex items-center justify-between cursor-pointer hover:border-orange-500/40 transition"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">Kitchen Indents</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg sm:text-xl font-black text-orange-300 font-mono">{pendingReqCount}</span>
              <span className="text-[11px] text-orange-400/80">Pending indents</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
            <UtensilsCrossed size={13} />
          </div>
        </div>
      </div>

      {/* 3. Interactive Shop & Store Procurement Hub (Box-by-Box Market Purchasing) */}
      <ShopProcurementHub
        vendors={vendors}
        onQuickOrder={handleQuickShopOrder}
        onOpenFullFormWithItems={handleOpenFullFormWithShopItems}
        onAddVendorClick={() => {
          setFormInitialItems([]);
          setFormInitialNotes('');
          setShowForm(true);
        }}
        onFilterByShop={(shopName) => {
          // Keep search flexible
        }}
      />

      {/* 4. Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'ORDERS'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={15} />
          <span>Purchase Orders & Goods Inward ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('KITCHEN_REQS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'KITCHEN_REQS'
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UtensilsCrossed size={15} />
          <span>Kitchen Indents & Staff Needs</span>
          {pendingReqCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-black animate-pulse">
              {pendingReqCount}
            </span>
          )}
        </button>
      </div>

      {/* 5. Purchase Order Creation Form Drawer */}
      {showForm && (
        <div className="rounded-2xl bg-slate-900 border border-cyan-500/40 p-5 sm:p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <p className="text-base font-black text-white flex items-center gap-2">
                <Truck size={18} className="text-emerald-400" />
                <span>Create Purchase Order & Inward Stock</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Items can be saved as pending PO or instantly inwarded to update hotel inventory immediately.
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X size={16} />
            </button>
          </div>

          <PurchaseOrderForm
            vendors={
              vendors.length > 0
                ? vendors
                : [{ id: 'v_default', name: 'Fresh Vegetables & Grocery Co.', phone: '' }]
            }
            staffMembers={staffMembers}
            stockProducts={stockProducts}
            initialItems={formInitialItems}
            initialNotes={formInitialNotes}
            stockRequestIds={formStockRequestIds}
            onClose={() => setShowForm(false)}
            onVendorCreated={(newV) => setVendors((prev) => [newV, ...prev])}
            onSubmit={handleCreatePO}
          />
        </div>
      )}

      {/* 6. Active Tab: ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  statusFilter === 'ALL'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                All ({orders.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
                }`}
              >
                <span>Awaiting Delivery</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                  {pendingOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('DELIVERED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                  statusFilter === 'DELIVERED'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                }`}
              >
                <span>Stock Inwarded (GRN)</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                  {deliveredOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('CANCELLED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  statusFilter === 'CANCELLED'
                    ? 'bg-rose-500 text-black shadow-md'
                    : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
                }`}
              >
                Cancelled ({orders.filter((o) => o.status === 'CANCELLED').length})
              </button>
            </div>

            {/* Vendor Filter + Search Box */}
            <div className="flex items-center gap-2.5 flex-1 lg:max-w-xl justify-end">
              {/* Vendor Selector */}
              {vendors.length > 0 && (
                <div className="w-48 shrink-0">
                  <select
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="ALL">All Vendors ({vendors.length})</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search Box */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by PO #, vendor, phone or item..."
                  className="w-full h-10 pl-9 pr-4 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PO List Component */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500 rounded-2xl bg-slate-900/40 border border-slate-800">
              <Loader2 size={24} className="animate-spin text-cyan-400" />
              <span className="text-sm font-bold text-slate-400">Loading purchase orders & stock records...</span>
            </div>
          ) : (
            <POList
              orders={filteredOrders}
              onSelectOrder={(po) => setSelectedPO(po)}
              onApprove={handleApprove}
              onDeliver={handleDeliver}
              onCancel={handleCancel}
            />
          )}
        </div>
      )}

      {/* 7. Active Tab: KITCHEN REQUISITIONS */}
      {activeTab === 'KITCHEN_REQS' && (
        <KitchenRequisitionsList
          requests={kitchenRequests}
          loading={reqsLoading}
          onRefresh={fetchKitchenRequests}
          onConvertToPO={handleConvertKitchenToPO}
        />
      )}

      {/* 8. Full PO Details & Printable Slip Modal */}
      <PODetailsModal
        isOpen={Boolean(selectedPO)}
        order={selectedPO}
        onClose={() => setSelectedPO(null)}
        onStatusChange={async (id, newStatus) => {
          if (newStatus === 'ACCEPTED') {
            await handleApprove(id);
          } else if (newStatus === 'DELIVERED') {
            await handleDeliver(id);
          }
          setSelectedPO((prev) =>
            prev ? { ...prev, status: newStatus as DetailedPO['status'] } : null
          );
        }}
      />
    </div>
  );
}
