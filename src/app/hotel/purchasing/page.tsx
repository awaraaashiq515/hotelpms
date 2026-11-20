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
  Store,
  Clock,
  Boxes,
  ArrowRight,
  Filter
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
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'MARKET' | 'KITCHEN_REQS'>('ORDERS');
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<DetailedPO | null>(null);

  // Form Pre-fill State (for Kitchen indent conversion or shop hub)
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

  // Detect initial tab from query parameter e.g. ?tab=kitchen or ?tab=market
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'kitchen' || tabParam === 'kitchen_reqs') {
        setActiveTab('KITCHEN_REQS');
      } else if (tabParam === 'market' || tabParam === 'shop') {
        setActiveTab('MARKET');
      }
    }
  }, []);

  // Fetch session & active property
  useEffect(() => {
    async function initProperty() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();

        let resolvedId = sessionData?.user?.propertyId || '';
        let resolvedName = sessionData?.user?.propertyName || 'Grand Hotel';

        const propRes = await fetch('/api/setup/properties');
        const propData = await propRes.json();

        const propList = Array.isArray(propData?.data) ? propData.data : (Array.isArray(propData) ? propData : []);
        if (propList.length > 0) {
          const current =
            (resolvedId && propList.find((p: any) => p.id === resolvedId)) ||
            propList[0];

          if (current?.id) {
            resolvedId = current.id;
            resolvedName = current.name || resolvedName;
            setHotelPhone(current.phone || '');
            setHotelAddress(current.address || current.city || '');
          }
        }

        if (resolvedId) {
          setPropertyId(resolvedId);
          setHotelName(resolvedName);
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
        fetch('/api/b2b/orders').then((r) => r.json()).catch(() => []),
        fetch('/api/hotel/vendor').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/staff-members').then((r) => r.json()).catch(() => ({ data: [] })),
        fetch('/api/inventory/stock-items').then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      const ordersData = ordersRes;
      const vendorsData = vendorsRes;

      const rawVendors = Array.isArray(vendorsData?.data)
        ? vendorsData.data
        : Array.isArray(vendorsData)
        ? vendorsData
        : [];

      if (rawVendors.length > 0) {
        setVendors(
          rawVendors.map((v: any) => ({
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
            category: p.category || 'General',
            unit: p.unit || 'Kg',
            price: Number(p.costPrice || p.unitPrice) || 0,
          }))
        );
      }

      const rawOrdersList = Array.isArray(ordersData)
        ? ordersData
        : Array.isArray(ordersData?.data)
        ? ordersData.data
        : [];

      const formatted: DetailedPO[] = rawOrdersList.map((order: any) => {
        let parsedComments: any = null;
        let plainNotes = order.comments || '';
        try {
          if (order.comments && order.comments.startsWith('{')) {
            parsedComments = JSON.parse(order.comments);
            plainNotes = parsedComments.notes || '';
          }
        } catch {}

        const rawItems = Array.isArray(order.items) ? order.items : [];
        const mappedItems = rawItems.map((item: any) => {
          const name = item.product?.name || item.name || 'Unnamed Item';
          const category = item.product?.category || item.category || 'Kitchen & Grocery';
          const unit = item.product?.unit || item.unit || 'Kg';
          const qty = Number(item.quantity ?? item.qty) || 1;
          const price = Number(item.unitPrice ?? item.price) || 0;
          const total = Number(item.totalPrice ?? item.total) || qty * price;
          return {
            id: item.id,
            name,
            category,
            unit,
            quantity: qty,
            unitPrice: price,
            totalPrice: total,
            qty,
            price,
            total,
            description: item.product?.description || item.description || '',
          };
        });

        return {
          id: order.id,
          poNumber: order.orderNo || `PO-${order.id.substring(0, 6)}`,
          date: order.createdAt ? order.createdAt.split('T')[0] : '',
          createdAt: order.createdAt || '',
          expectedDate: order.deliveryDate ? order.deliveryDate.split('T')[0] : '',
          vendor: order.supplier?.name || 'Local Market Vendor',
          vendorPhone: order.supplier?.phone || '',
          vendorCategory: order.supplier?.category || 'General Store',
          vendorId: order.supplierId || '',
          status: (order.status || 'PENDING') as DetailedPO['status'],
          totalAmount: Number(order.totalAmount) || 0,
          notes: plainNotes,
          hotelName: order.property?.name || hotelName,
          hotelPhone: order.property?.phone || hotelPhone,
          hotelAddress: order.property?.address || hotelAddress,
          assignedStaffName: order.assignedStaffName || parsedComments?.assignedStaffName || null,
          assignedStaffPhone: order.assignedStaffPhone || parsedComments?.assignedStaffPhone || null,
          items: mappedItems,
        };
      });

      setOrders(formatted);
    } catch (err) {
      console.warn('Failed to fetch purchasing data:', err);
    } finally {
      setLoading(false);
    }
  }, [hotelName, hotelPhone, hotelAddress]);

  // Fetch Kitchen Requisitions
  const fetchKitchenRequests = useCallback(async () => {
    setReqsLoading(true);
    try {
      const res = await fetch('/api/inventory/requests?status=PENDING');
      const data = await res.json();
      const rawReqs = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      setKitchenRequests(
        rawReqs.map((r: any) => ({
          id: r.id,
          itemId: r.itemId || r.stockItemId,
          itemName: r.itemName || r.stockItem?.name || 'Raw Material',
          category: r.category || r.stockItem?.category || r.department || 'Kitchen',
          requestedQty: Number(r.requestedQty) || 1,
          unit: r.unit || r.stockItem?.unit || 'Kg',
          urgency: (r.urgency || r.priority || 'NORMAL').toUpperCase() as any,
          status: (r.status || 'PENDING').toUpperCase() as any,
          department: r.department || 'Kitchen',
          requestedBy: r.requestedBy || 'Head Chef',
          remarks: r.remarks || r.notes || '',
          notes: r.remarks || r.notes || '',
          createdAt: r.createdAt || new Date().toISOString(),
          currentStock: Number(r.stockItem?.currentStock) || 0,
        }))
      );
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
    if (statusFilter === 'PENDING') {
      if (o.status !== 'SENT' && o.status !== 'CONFIRMED' && o.status !== 'DRAFT') return false;
    } else if (statusFilter === 'DELIVERED') {
      if (o.status !== 'DELIVERED') return false;
    } else if (statusFilter === 'CANCELLED') {
      if (o.status !== 'CANCELLED') return false;
    }

    if (vendorFilter !== 'ALL' && o.vendorId !== vendorFilter) {
      return false;
    }

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

  // Metrics
  const totalOrdersCount = orders.length;
  const totalOrdersValue = orders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

  const pendingOrders = orders.filter(
    (o) => o.status === 'SENT' || o.status === 'CONFIRMED' || o.status === 'DRAFT'
  );
  const totalPendingValue = pendingOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalDeliveredValue = deliveredOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

  const pendingReqCount = kitchenRequests.filter((r) => r.status === 'PENDING').length;

  // Approve PO
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

  // Create new PO
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
      let resolvedPropId = propertyId;
      if (!resolvedPropId) {
        try {
          const sRes = await fetch('/api/auth/session');
          const sData = await sRes.json();
          resolvedPropId = sData?.user?.propertyId || '';
        } catch {}
      }
      if (!resolvedPropId) {
        try {
          const pRes = await fetch('/api/setup/properties');
          const pData = await pRes.json();
          const list = Array.isArray(pData?.data) ? pData.data : (Array.isArray(pData) ? pData : []);
          if (list[0]?.id) resolvedPropId = list[0].id;
        } catch {}
      }

      if (!resolvedPropId) {
        toast.error('Could not identify active hotel property. Please reload.');
        return;
      }

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

  // Quick Shop Order Execution from Shop Hub
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
      let resolvedPropId = propertyId;
      if (!resolvedPropId) {
        try {
          const sRes = await fetch('/api/auth/session');
          const sData = await sRes.json();
          resolvedPropId = sData?.user?.propertyId || '';
        } catch {}
      }
      if (!resolvedPropId) {
        try {
          const pRes = await fetch('/api/setup/properties');
          const pData = await pRes.json();
          const list = Array.isArray(pData?.data) ? pData.data : (Array.isArray(pData) ? pData : []);
          if (list[0]?.id) resolvedPropId = list[0].id;
        } catch {}
      }

      if (!resolvedPropId) {
        toast.error('Could not identify active hotel property. Please reload.');
        return;
      }

      const res = await fetch('/api/b2b/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: resolvedPropId,
          supplierId: data.vendorId,
          totalAmount: data.totalAmount,
          comments: data.notes,
          status: data.receiveImmediately ? 'DELIVERED' : 'PENDING',
          autoReceive: data.receiveImmediately,
          assignedStaffName: data.assignToKitchenRunner ? 'Kitchen Runner' : null,
          items: data.items.map((i) => ({
            name: i.name,
            quantity: Number(i.qty) || 1,
            unitPrice: Number(i.price) || 0,
            unit: i.unit,
          })),
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to place order');

      if (data.receiveImmediately) {
        toast.success('Stock Inward Successful! Items added directly to Hotel Inventory. 📦');
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
      }

      fetchData();
      fetchKitchenRequests();
      setActiveTab('ORDERS');
    } catch (err: any) {
      toast.error(err.message || 'Failed to place order');
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
    setActiveTab('ORDERS');
  };

  return (
    <div className="space-y-4 max-w-[1400px] mx-auto px-3 sm:px-5 pb-16 text-slate-100">
      
      {/* ── 1. Clean Simple Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">
              Purchasing & Stock Inward
            </h1>
            <p className="text-xs text-slate-400">
              Create vendor purchase orders, receive incoming inventory, and track kitchen requests.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchData();
              fetchKitchenRequests();
            }}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading || reqsLoading ? 'animate-spin' : ''} />
          </button>

          <Link
            href="/hotel/inventory"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 text-xs font-semibold border border-slate-700 transition"
          >
            <Boxes size={14} className="text-cyan-400" />
            <span>Stock Inventory</span>
          </Link>

          <button
            onClick={() => {
              setFormInitialItems([]);
              setFormInitialNotes('');
              setFormStockRequestIds([]);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-md shadow-cyan-600/30 active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Purchase Order</span>
          </button>
        </div>
      </div>

      {/* ── 2. Simple Key Metrics Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total POs */}
        <div className="rounded-xl p-3 bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-white font-mono">{totalOrdersCount}</span>
              <span className="text-xs text-slate-400 font-mono">₹{totalOrdersValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <FileText size={16} />
          </div>
        </div>

        {/* Awaiting Delivery */}
        <div className="rounded-xl p-3 bg-amber-950/20 border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Awaiting Delivery</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-amber-300 font-mono">{pendingOrders.length}</span>
              <span className="text-xs text-amber-400/80 font-mono">₹{totalPendingValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Clock size={16} />
          </div>
        </div>

        {/* Stock Received (Inwarded) */}
        <div className="rounded-xl p-3 bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Stock Received (Inward)</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-emerald-300 font-mono">{deliveredOrders.length}</span>
              <span className="text-xs text-emerald-400/80 font-mono">₹{totalDeliveredValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} />
          </div>
        </div>

        {/* Kitchen Indents */}
        <div
          onClick={() => setActiveTab('KITCHEN_REQS')}
          className="rounded-xl p-3 bg-orange-950/20 border border-orange-500/20 flex items-center justify-between cursor-pointer hover:border-orange-500/40 transition"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Kitchen Indents</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-black text-orange-300 font-mono">{pendingReqCount}</span>
              <span className="text-xs text-orange-400/80">Awaiting PO</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0">
            <UtensilsCrossed size={16} />
          </div>
        </div>
      </div>

      {/* ── 3. Simple Clean Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'ORDERS'
              ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <FileText size={15} />
          <span>Purchase Orders & Inward ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MARKET')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'MARKET'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Store size={15} />
          <span>Shop & Market Buying Hub 🏪</span>
        </button>

        <button
          onClick={() => setActiveTab('KITCHEN_REQS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeTab === 'KITCHEN_REQS'
              ? 'bg-orange-500/15 text-orange-400 border border-orange-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <UtensilsCrossed size={15} />
          <span>Kitchen Indents</span>
          {pendingReqCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-black">
              {pendingReqCount}
            </span>
          )}
        </button>
      </div>

      {/* ── 4. Form Drawer (When New PO is clicked) ── */}
      {showForm && (
        <div className="rounded-2xl bg-slate-900 border border-cyan-500/50 p-5 shadow-2xl space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <p className="text-base font-black text-white flex items-center gap-2">
                <Truck size={18} className="text-cyan-400" />
                <span>Create Purchase Order</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Add items to create a vendor PO or receive stock immediately to your inventory.
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X size={18} />
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

      {/* ── 5. Tab View: ORDERS (Clean Default View) ── */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-3.5">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-cyan-500 text-black shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                All ({orders.length})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-500 text-black shadow-sm'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === 'DELIVERED'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
                }`}
              >
                <span>Stock Received</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                  {deliveredOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('CANCELLED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer ${
                  statusFilter === 'CANCELLED'
                    ? 'bg-rose-500 text-black shadow-sm'
                    : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
                }`}
              >
                Cancelled ({orders.filter((o) => o.status === 'CANCELLED').length})
              </button>
            </div>

            {/* Vendor Selector & Search */}
            <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
              {vendors.length > 0 && (
                <div className="w-40 shrink-0">
                  <select
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                    className="w-full h-9 px-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="ALL">All Vendors</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search PO #, vendor, item..."
                  className="w-full h-9 pl-8 pr-7 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500 rounded-2xl bg-slate-900/40 border border-slate-800">
              <Loader2 size={24} className="animate-spin text-cyan-400" />
              <span className="text-xs font-bold text-slate-400">Loading purchase orders...</span>
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

      {/* ── 6. Tab View: MARKET BUYING HUB (Separated into its own clean tab) ── */}
      {activeTab === 'MARKET' && (
        <div className="space-y-4">
          <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Store size={16} className="text-emerald-400" />
                <span>Shop-by-Shop Market Buying List</span>
              </h2>
              <p className="text-xs text-slate-400">
                Pick items by shop category (Chicken, Vegetables, Dairy, Grocery), adjust quantities, and generate PO or inward stock instantly.
              </p>
            </div>
          </div>

          <ShopProcurementHub
            vendors={vendors}
            onQuickOrder={handleQuickShopOrder}
            onOpenFullFormWithItems={handleOpenFullFormWithShopItems}
            onAddVendorClick={() => {
              setFormInitialItems([]);
              setFormInitialNotes('');
              setShowForm(true);
            }}
            onFilterByShop={() => {}}
          />
        </div>
      )}

      {/* ── 7. Tab View: KITCHEN INDENTS ── */}
      {activeTab === 'KITCHEN_REQS' && (
        <KitchenRequisitionsList
          requests={kitchenRequests}
          loading={reqsLoading}
          onRefresh={fetchKitchenRequests}
          onConvertToPO={handleConvertKitchenToPO}
        />
      )}

      {/* ── 8. PO Details & Printable Slip Modal ── */}
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
