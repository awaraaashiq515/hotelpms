'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { openWhatsAppPO } from '@/lib/whatsapp-po';
import { toast } from 'sonner';

export default function PurchasingPage() {
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'KITCHEN_REQS'>('ORDERS');
  const [showForm, setShowForm] = useState(false);
  const [selectedPO, setSelectedPO] = useState<DetailedPO | null>(null);

  // Form Pre-fill State (for Kitchen indent conversion)
  const [formInitialItems, setFormInitialItems] = useState<POFormItem[]>([]);
  const [formInitialNotes, setFormInitialNotes] = useState('');
  const [formStockRequestIds, setFormStockRequestIds] = useState<string[]>([]);

  // Core Data
  const [orders, setOrders] = useState<DetailedPO[]>([]);
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffOption[]>([]);
  const [stockProducts, setStockProducts] = useState<ProductOption[]>([]);
  const [kitchenRequests, setKitchenRequests] = useState<KitchenRequisitionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqsLoading, setReqsLoading] = useState(false);
  const [search, setSearch] = useState('');

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

  const filteredOrders = orders.filter(
    (o) =>
      !search ||
      o.vendor.toLowerCase().includes(search.toLowerCase()) ||
      o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.vendorPhone && o.vendorPhone.includes(search))
  );

  const totalPending = orders
    .filter((o) => o.status === 'DRAFT' || o.status === 'SENT' || o.status === 'CONFIRMED')
    .reduce((s, o) => s + o.totalAmount, 0);

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

  // Mark Goods Delivered & update stock
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
        toast.success('Goods Received! Inventory stock updated.');
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: 'DELIVERED' } : o))
        );
        fetchKitchenRequests();
      }
    } catch {
      toast.error('Failed to mark delivered');
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
          assignedStaffName: data.assignedStaffName || null,
          assignedStaffPhone: data.assignedStaffPhone || null,
          items: data.items.map((i) => ({
            name: i.name,
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

      toast.success(`Purchase Order created for ${data.vendorName}!`);
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

    const combinedNotes = `Requisition by Kitchen Staff (${selected.map((s) => s.requestedBy).filter((v, i, a) => a.indexOf(v) === i).join(', ')}). High priority fresh stock.`;

    setFormInitialItems(prefilledItems);
    setFormInitialNotes(combinedNotes);
    setFormStockRequestIds(selected.map((s) => s.id));
    setShowForm(true);
    setActiveTab('ORDERS');
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1400px] mx-auto px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={15} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
              Procurement · Purchase Orders
            </span>
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <MessageCircle size={10} /> WhatsApp Enabled
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Purchase Orders & Vendor Dispatch
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Create vendor orders, send instant itemized WhatsApp messages, and fulfill Kitchen Staff requisitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchData();
              fetchKitchenRequests();
            }}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Refresh All"
          >
            <RefreshCw size={15} className={loading || reqsLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => {
              setFormInitialItems([]);
              setFormInitialNotes('');
              setFormStockRequestIds([]);
              setShowForm(!showForm);
            }}
            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-600/25 transition"
          >
            <Plus size={14} />
            <span>{showForm ? 'Close Form' : 'New Purchase Order'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'ORDERS'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={14} />
          <span>Purchase Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('KITCHEN_REQS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'KITCHEN_REQS'
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <UtensilsCrossed size={14} />
          <span>Kitchen Indents / Staff Needs</span>
          {pendingReqCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-black">
              {pendingReqCount}
            </span>
          )}
        </button>
      </div>

      {/* Form Drawer / Container */}
      {showForm && (
        <div className="rounded-2xl bg-slate-900 border border-cyan-500/30 p-5 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <p className="text-base font-black text-white">Create Purchase Order</p>
              <p className="text-xs text-slate-400">
                Generate an order slip and send directly to the Vendor&apos;s WhatsApp.
              </p>
            </div>
            <button
              onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center"
            >
              <X size={15} />
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
            onSubmit={handleCreatePO}
          />
        </div>
      )}

      {/* Active Tab: ORDERS */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-5">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(['DRAFT', 'SENT', 'CONFIRMED', 'DELIVERED', 'CANCELLED'] as const).map((s) => {
              const count = orders.filter((o) => o.status === s).length;
              const colors: Record<string, string> = {
                DRAFT: 'text-slate-300 border-slate-700 bg-slate-800/40',
                SENT: 'text-sky-300 border-sky-500/20 bg-sky-950/20',
                CONFIRMED: 'text-amber-300 border-amber-500/20 bg-amber-950/20',
                DELIVERED: 'text-emerald-300 border-emerald-500/20 bg-emerald-950/20',
                CANCELLED: 'text-rose-300 border-rose-500/20 bg-rose-950/20',
              };
              return (
                <div key={s} className={`rounded-2xl border p-4 ${colors[s]}`}>
                  <p className="text-2xl font-black text-white">{count}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">{s}</p>
                </div>
              );
            })}
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="relative max-w-sm w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by PO number, vendor, or phone..."
                className="w-full h-10 pl-9 pr-4 bg-slate-800/70 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <p className="text-xs text-slate-400">
              Total Active Value:{' '}
              <span className="font-mono font-bold text-white">
                ₹{totalPending.toLocaleString('en-IN')}
              </span>
            </p>
          </div>

          {/* PO List Component */}
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-slate-500">
              <Loader2 size={22} className="animate-spin text-cyan-400" />
              <span className="text-sm font-bold">Loading purchase orders...</span>
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

      {/* Active Tab: KITCHEN REQUISITIONS */}
      {activeTab === 'KITCHEN_REQS' && (
        <KitchenRequisitionsList
          requests={kitchenRequests}
          loading={reqsLoading}
          onRefresh={fetchKitchenRequests}
          onConvertToPO={handleConvertKitchenToPO}
        />
      )}

      {/* Modal: Full PO Details & Printable Slip */}
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
