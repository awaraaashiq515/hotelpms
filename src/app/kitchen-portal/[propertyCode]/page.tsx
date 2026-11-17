'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import { playNotificationSound, setupAudioUnlock, isSoundEnabled, setSoundEnabled } from '@/lib/notification-sound';

// Modular Component Imports
import { KotTicket, StockItem, StockRequest, TabType, OrderSourceType } from '../components/types';
import { KitchenHeader } from '../components/KitchenHeader';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { MobileDrawer } from '../components/MobileDrawer';
import { KitchenOrdersTab } from '../components/KitchenOrdersTab';
import { KitchenStoreTab } from '../components/KitchenStoreTab';
import { KitchenRequestsTab } from '../components/KitchenRequestsTab';
import { KitchenMarketListTab, MarketOrder } from '../components/KitchenMarketListTab';
import { StockRequestModal } from '../components/StockRequestModal';
import { StaffProfileModal } from '../components/StaffProfileModal';

export default function KitchenPortalPage() {
  const params = useParams();
  const rawPropertyCode = (params?.propertyCode as string) || '';

  // Navigation & State
  const [activeTab, setActiveTab] = useState<TabType>('orders');
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Kitchen Staff Profile
  const [activeStaffName, setActiveStaffName] = useState('Executive Chef');
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffRoleInput, setStaffRoleInput] = useState('Executive Chef');

  // Orders State
  const [orders, setOrders] = useState<KotTicket[]>([]);
  const [ordersFilter, setOrdersFilter] = useState<'ALL' | 'NEW' | 'PREPARING' | 'READY'>('ALL');
  const [orderSourceFilter, setOrderSourceFilter] = useState<OrderSourceType>('ALL');
  const [updatingKotId, setUpdatingKotId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const prevOrderIdsRef = useRef<Set<string>>(new Set());

  // Store / Inventory State
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockSearch, setStockSearch] = useState('');
  const [stockCategoryFilter, setStockCategoryFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);
  const [quickRefillLoadingId, setQuickRefillLoadingId] = useState<string | null>(null);

  // Stock Requests State
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Market Procurement / Daily Buying List State
  const [marketOrders, setMarketOrders] = useState<MarketOrder[]>([]);
  const [marketLoading, setMarketLoading] = useState(false);

  // Out of Stock / Restock Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [customItemName, setCustomItemName] = useState('');
  const [requestQty, setRequestQty] = useState(5);
  const [requestUnit, setRequestUnit] = useState('kg');
  const [requestUrgency, setRequestUrgency] = useState<'NORMAL' | 'URGENT' | 'CRITICAL'>('NORMAL');
  const [requestRemarks, setRequestRemarks] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Sound initialization & session auto-detection
  useEffect(() => {
    setupAudioUnlock();
    setSoundOn(isSoundEnabled());
    const savedStaff = localStorage.getItem('kitchen_staff_name');
    if (savedStaff) {
      setActiveStaffName(savedStaff);
    } else {
      fetch('/api/auth/session')
        .then((r) => r.json())
        .then((data) => {
          if (data?.authenticated && (data.user?.fullName || data.user?.name)) {
            const name = data.user.fullName || data.user.name;
            setActiveStaffName(name);
            localStorage.setItem('kitchen_staff_name', name);
          }
        })
        .catch(() => { });
    }
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playNotificationSound('ding');
  };

  /* ─── Fetch Active Orders ─── */
  const fetchOrders = useCallback(async (isInitial = false) => {
    if (!rawPropertyCode) return;
    try {
      const res = await fetch(`/api/kitchen-portal/orders?propertyCode=${encodeURIComponent(rawPropertyCode)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const incomingOrders: KotTicket[] = data.data;

        // Check for new incoming orders and trigger audio notification
        if (!isInitial && incomingOrders.length > 0) {
          const hasNew = incomingOrders.some(
            (o) => o.status === 'NEW' && !prevOrderIdsRef.current.has(o.id)
          );
          if (hasNew) {
            playNotificationSound('booking', 1.2);
            toast.info('New Food Order Received!', {
              description: 'Fresh KOT ticket has arrived in the kitchen.',
              duration: 4000,
            });
          }
        }

        prevOrderIdsRef.current = new Set(incomingOrders.map((o) => o.id));
        setOrders(incomingOrders);
      }
    } catch (err) {
      console.error('Failed to fetch kitchen orders:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [rawPropertyCode]);

  /* ─── Fetch Kitchen Store Items ─── */
  const fetchStockItems = useCallback(async () => {
    if (!rawPropertyCode) return;
    setStockLoading(true);
    try {
      const res = await fetch(
        `/api/inventory/stock-items?propertyCode=${encodeURIComponent(rawPropertyCode)}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setStockItems(data.data);
      }
    } catch (err) {
      console.error('Failed to load kitchen store items:', err);
    } finally {
      setStockLoading(false);
    }
  }, [rawPropertyCode]);

  /* ─── Fetch Stock Requests ─── */
  const fetchRequests = useCallback(async () => {
    if (!rawPropertyCode) return;
    setRequestsLoading(true);
    try {
      const res = await fetch(
        `/api/inventory/requests?propertyCode=${encodeURIComponent(rawPropertyCode)}&department=KITCHEN`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch stock requests:', err);
    } finally {
      setRequestsLoading(false);
    }
  }, [rawPropertyCode]);

  /* ─── Fetch Market Buying Orders ─── */
  const fetchMarketOrders = useCallback(async () => {
    if (!rawPropertyCode) return;
    setMarketLoading(true);
    try {
      const res = await fetch(
        `/api/kitchen-portal/market-orders?propertyCode=${encodeURIComponent(rawPropertyCode)}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setMarketOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch market orders:', err);
    } finally {
      setMarketLoading(false);
    }
  }, [rawPropertyCode]);

  // Initial load and periodic refresh
  useEffect(() => {
    fetchOrders(true);
    fetchStockItems();
    fetchRequests();
    fetchMarketOrders();

    // Live polling every 7 seconds for orders, 15 seconds for market buying list
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 7000);

    const marketInterval = setInterval(() => {
      fetchMarketOrders();
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(marketInterval);
    };
  }, [fetchOrders, fetchStockItems, fetchRequests, fetchMarketOrders]);

  /* ─── Helper: Determine Order Source ─── */
  const getOrderSource = useCallback((kot: KotTicket): 'ROOMS' | 'RESTAURANT' | 'TAKEAWAY' => {
    const type = String(kot.order?.orderType || '').toUpperCase();
    const tableStr = String(kot.table?.name || kot.order?.tableNo || '').toUpperCase();
    if (
      type === 'ROOM_SERVICE' ||
      Boolean(kot.order?.roomId) ||
      Boolean(kot.room) ||
      tableStr.startsWith('ROOM')
    ) {
      return 'ROOMS';
    }
    if (type === 'DINE_IN' || Boolean(kot.table)) {
      return 'RESTAURANT';
    }
    return 'TAKEAWAY';
  }, []);

  /* ─── Update Order Status ─── */
  const handleUpdateStatus = async (
    kotId: string,
    newStatus: 'PREPARING' | 'READY' | 'SERVED'
  ) => {
    setUpdatingKotId(kotId);
    try {
      const res = await fetch('/api/kitchen-portal/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kotId,
          status: newStatus,
          changedBy: activeStaffName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (newStatus === 'READY') {
          playNotificationSound('success');
          toast.success(`KOT Marked Ready!`, {
            description: 'Notified waiter and room service team.',
          });
        } else if (newStatus === 'SERVED') {
          toast.success(`KOT Completed and Served!`);
        } else {
          toast.info(`KOT is now in preparation.`);
        }
        fetchOrders(false);
      } else {
        toast.error(data.error || 'Failed to update order status');
      }
    } catch {
      toast.error('Network error updating order');
    } finally {
      setUpdatingKotId(null);
    }
  };

  /* ─── Fast One-Click Quick Refill (5 / 10 / 25) ─── */
  const handleQuickRefill = async (item: StockItem, qty: number) => {
    setQuickRefillLoadingId(item.id);
    try {
      const res = await fetch('/api/inventory/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode: rawPropertyCode,
          stockItemId: item.id,
          itemName: item.name,
          department: 'KITCHEN',
          requestedBy: activeStaffName,
          requestedQty: qty,
          unit: item.unit || 'kg',
          urgency: item.currentStock <= 0 ? 'CRITICAL' : 'URGENT',
          remarks: `Fast 1-click kitchen refill requested (+${qty} ${item.unit || 'kg'})`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        playNotificationSound('success');
        toast.success(`Refill Request Sent!`, {
          description: `+${qty} ${item.unit || 'kg'} of ${item.name} logged for Hotel Store / Admin.`,
        });
        fetchRequests();
      } else {
        toast.error(data.error || 'Failed to send refill request');
      }
    } catch {
      toast.error('Network error sending refill');
    } finally {
      setQuickRefillLoadingId(null);
    }
  };

  /* ─── Fast One-Click Mark Out of Stock ─── */
  const handleQuickOutOfStock = async (item: StockItem) => {
    setQuickRefillLoadingId(item.id);
    try {
      const res = await fetch('/api/inventory/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode: rawPropertyCode,
          stockItemId: item.id,
          itemName: item.name,
          department: 'KITCHEN',
          requestedBy: activeStaffName,
          requestedQty: item.reorderLevel > 0 ? item.reorderLevel : 10,
          unit: item.unit || 'kg',
          urgency: 'CRITICAL',
          remarks: `🚨 URGENT ALERT: Kitchen is completely out of ${item.name}! Immediate replenishment needed.`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        playNotificationSound('alert', 1.4);
        toast.error(`Marked OUT OF STOCK!`, {
          description: `CRITICAL alert dispatched to Hotel Store & Admin for ${item.name}.`,
          duration: 5000,
        });
        fetchRequests();
      } else {
        toast.error(data.error || 'Failed to report out of stock');
      }
    } catch {
      toast.error('Network error reporting out of stock');
    } finally {
      setQuickRefillLoadingId(null);
    }
  };

  /* ─── Detailed Modal Stock Request ─── */
  const handleOpenRequestModal = (item?: StockItem) => {
    if (item) {
      setSelectedStockItem(item);
      setCustomItemName(item.name);
      setRequestUnit(item.unit || 'kg');
      setRequestQty(item.reorderLevel > 0 ? item.reorderLevel : 5);
      setRequestUrgency(item.currentStock <= 0 ? 'CRITICAL' : 'URGENT');
    } else {
      setSelectedStockItem(null);
      setCustomItemName('');
      setRequestUnit('kg');
      setRequestQty(5);
      setRequestUrgency('NORMAL');
    }
    setRequestRemarks('');
    setShowRequestModal(true);
  };

  const handleSubmitStockRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = selectedStockItem ? selectedStockItem.name : customItemName.trim();
    if (!finalName) {
      toast.error('Please specify an item name');
      return;
    }

    setSubmittingRequest(true);
    try {
      const res = await fetch('/api/inventory/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode: rawPropertyCode,
          stockItemId: selectedStockItem?.id || null,
          itemName: finalName,
          department: 'KITCHEN',
          requestedBy: activeStaffName,
          requestedQty: Number(requestQty),
          unit: requestUnit,
          urgency: requestUrgency,
          remarks: requestRemarks,
        }),
      });

      const data = await res.json();
      if (data.success) {
        playNotificationSound('success');
        toast.success('Stock Request Sent to Hotel Store & Admin!', {
          description: `${finalName} requisition logged with ${requestUrgency} priority.`,
        });
        setShowRequestModal(false);
        fetchRequests();
      } else {
        toast.error(data.error || 'Failed to submit request');
      }
    } catch {
      toast.error('Network error submitting stock request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  /* ─── Mark Stock Request Received in Kitchen ─── */
  const handleMarkReceived = async (requestId: string) => {
    try {
      const res = await fetch('/api/inventory/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: requestId,
          status: 'DISPATCHED',
          remarks: `Received & verified by ${activeStaffName} in Kitchen`,
          resolvedBy: activeStaffName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        playNotificationSound('success');
        toast.success('Stock verified and received in kitchen!');
        fetchRequests();
      } else {
        toast.error(data.error || 'Failed to update request');
      }
    } catch {
      toast.error('Network error updating stock request');
    }
  };

  /* ─── Market Orders Handlers ─── */
  const handleToggleMarketItem = async (orderId: string, itemId: string, isDone: boolean) => {
    // Optimistic UI update
    setMarketOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        const updatedItems = ord.items.map((it) => (it.id === itemId ? { ...it, isDone } : it));
        const doneCount = updatedItems.filter((i) => i.isDone).length;
        return {
          ...ord,
          items: updatedItems,
          doneItems: doneCount,
          isFullyPurchased: doneCount === updatedItems.length && updatedItems.length > 0,
        };
      })
    );

    try {
      const res = await fetch('/api/kitchen-portal/market-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_ITEM',
          orderId,
          itemId,
          isPurchased: isDone,
          staffName: activeStaffName,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        fetchMarketOrders();
        toast.error('Failed to update item status');
      } else {
        if (isDone) playNotificationSound('success');
      }
    } catch {
      fetchMarketOrders();
      toast.error('Network error updating item status');
    }
  };

  const handleReceiveOrderStock = async (orderId: string) => {
    try {
      const res = await fetch('/api/kitchen-portal/market-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RECEIVE_ORDER',
          orderId,
          staffName: activeStaffName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        playNotificationSound('success');
        toast.success('Stock Inwarded to Kitchen! 📦', {
          description: data.message || 'Items added directly to Kitchen Inventory stock.',
        });
        fetchMarketOrders();
        fetchStockItems();
      } else {
        toast.error(data.error || 'Failed to inward stock');
      }
    } catch {
      toast.error('Network error inwarding stock');
    }
  };

  const handleAddNewMarketItem = async (data: {
    shopId: string;
    itemName: string;
    quantity: number;
    unit: string;
    estimatedPrice: number;
    notes?: string;
  }) => {
    try {
      const res = await fetch('/api/kitchen-portal/market-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyCode: rawPropertyCode,
          ...data,
          staffName: activeStaffName,
        }),
      });
      const resData = await res.json();
      if (resData.success) {
        playNotificationSound('success');
        toast.success(`Added ${data.itemName} to Buying List!`, {
          description: `Order ${resData.orderNo || ''} updated for staff market runner.`,
        });
        fetchMarketOrders();
      } else {
        toast.error(resData.error || 'Failed to add item');
      }
    } catch {
      toast.error('Network error adding market item');
    }
  };

  /* ─── Toggle Individual Item Checkbox ─── */
  const toggleItemChecked = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  /* ─── Filtered Orders Calculation ─── */
  const filteredOrders = useMemo(() => {
    return orders.filter((k) => {
      if (ordersFilter !== 'ALL' && k.status !== ordersFilter) return false;
      if (orderSourceFilter !== 'ALL') {
        const src = getOrderSource(k);
        if (src !== orderSourceFilter) return false;
      }
      return true;
    });
  }, [orders, ordersFilter, orderSourceFilter, getOrderSource]);

  /* ─── Order Counts Breakdown ─── */
  const orderCounts = useMemo(() => {
    const all = orders.length;
    const newCount = orders.filter((o) => o.status === 'NEW').length;
    const preparing = orders.filter((o) => o.status === 'PREPARING').length;
    const ready = orders.filter((o) => o.status === 'READY').length;

    const roomsCount = orders.filter((o) => getOrderSource(o) === 'ROOMS').length;
    const restaurantCount = orders.filter((o) => getOrderSource(o) === 'RESTAURANT').length;
    const takeawayCount = orders.filter((o) => getOrderSource(o) === 'TAKEAWAY').length;

    return {
      all,
      new: newCount,
      preparing,
      ready,
      rooms: roomsCount,
      restaurant: restaurantCount,
      takeaway: takeawayCount,
    };
  }, [orders, getOrderSource]);

  /* ─── Filtered Stock Items Calculation ─── */
  const categories = useMemo(() => {
    const set = new Set<string>();
    stockItems.forEach((i) => {
      if (i.itemType) set.add(i.itemType);
      if (i.sku) set.add(i.sku);
    });
    const arr = Array.from(set);
    return arr.sort((a, b) => {
      if (a === 'F&B') return -1;
      if (b === 'F&B') return 1;
      return a.localeCompare(b);
    });
  }, [stockItems]);

  const filteredStock = useMemo(() => {
    if (!Array.isArray(stockItems)) return [];
    const q = (stockSearch || '').trim().toLowerCase();
    return stockItems.filter((item) => {
      if (!item) return false;
      const name = String(item.name || '').toLowerCase();
      const sku = String(item.sku || '').toLowerCase();
      const cat = String(item.itemType || '').toLowerCase();
      const matchesSearch = !q || name.includes(q) || sku.includes(q) || cat.includes(q);
      const matchesLow = lowStockOnly ? item.isLow || item.currentStock <= 0 : true;
      const matchesCat =
        stockCategoryFilter === 'ALL'
          ? true
          : item.itemType === stockCategoryFilter || item.sku === stockCategoryFilter;
      return matchesSearch && matchesLow && matchesCat;
    });
  }, [stockItems, stockSearch, lowStockOnly, stockCategoryFilter]);

  const stockMetrics = useMemo(() => {
    const total = stockItems.length;
    const outOfStock = stockItems.filter((i) => i.currentStock <= 0).length;
    const lowStock = stockItems.filter((i) => i.isLow && i.currentStock > 0).length;
    const healthy = total - outOfStock - lowStock;
    return { total, outOfStock, lowStock, healthy };
  }, [stockItems]);

  /* ─── Pending Items to Buy in Market ─── */
  const marketPendingCount = useMemo(() => {
    let count = 0;
    marketOrders.forEach((o) => {
      if (!o.isDeliveredToKitchen) {
        o.items.forEach((item) => {
          if (!item.isDone) count++;
        });
      }
    });
    return count;
  }, [marketOrders]);

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 pb-20 md:pb-6">
      <Toaster position="top-right" richColors />

      {/* ─── Top Header Navigation ─── */}
      <KitchenHeader
        propertyCode={rawPropertyCode}
        activeStaffName={activeStaffName}
        soundOn={soundOn}
        activeTab={activeTab}
        loading={loading}
        orderCounts={orderCounts}
        lowStockCount={stockMetrics.outOfStock + stockMetrics.lowStock}
        pendingRequestsCount={requests.filter((r) => r.status === 'PENDING').length}
        marketPendingCount={marketPendingCount}
        onToggleSound={toggleSound}
        onOpenStaffModal={() => {
          setStaffRoleInput(activeStaffName);
          setShowStaffModal(true);
        }}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        onRefresh={() => {
          fetchOrders(false);
          fetchStockItems();
          fetchRequests();
          fetchMarketOrders();
          toast.success('Kitchen synced');
        }}
        onTabChange={setActiveTab}
      />

      {/* ─── Main View ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {activeTab === 'orders' && (
          <KitchenOrdersTab
            orders={filteredOrders}
            orderCounts={orderCounts}
            ordersFilter={ordersFilter}
            orderSourceFilter={orderSourceFilter}
            checkedItems={checkedItems}
            updatingKotId={updatingKotId}
            onSetOrdersFilter={setOrdersFilter}
            onSetOrderSourceFilter={setOrderSourceFilter}
            onToggleItemChecked={toggleItemChecked}
            onUpdateStatus={handleUpdateStatus}
            getOrderSource={getOrderSource}
          />
        )}

        {activeTab === 'store' && (
          <KitchenStoreTab
            stockItems={stockItems}
            filteredStock={filteredStock}
            stockMetrics={stockMetrics}
            stockSearch={stockSearch}
            stockCategoryFilter={stockCategoryFilter}
            categories={categories}
            lowStockOnly={lowStockOnly}
            stockLoading={stockLoading}
            quickRefillLoadingId={quickRefillLoadingId}
            onSetStockSearch={setStockSearch}
            onSetStockCategoryFilter={setStockCategoryFilter}
            onToggleLowStockOnly={() => setLowStockOnly(!lowStockOnly)}
            onOpenRequestModal={handleOpenRequestModal}
            onQuickRefill={handleQuickRefill}
            onQuickOutOfStock={handleQuickOutOfStock}
          />
        )}

        {activeTab === 'requests' && (
          <KitchenRequestsTab
            requests={requests}
            requestsLoading={requestsLoading}
            onOpenRequestModal={() => handleOpenRequestModal()}
            onMarkReceived={handleMarkReceived}
          />
        )}

        {activeTab === 'market' && (
          <KitchenMarketListTab
            propertyCode={rawPropertyCode}
            activeStaffName={activeStaffName}
            orders={marketOrders}
            loading={marketLoading}
            onRefresh={fetchMarketOrders}
            onToggleItemDone={handleToggleMarketItem}
            onReceiveOrderStock={handleReceiveOrderStock}
            onAddNewItem={handleAddNewMarketItem}
          />
        )}
      </main>

      {/* ─── Mobile Bottom App Bar ─── */}
      <MobileBottomNav
        activeTab={activeTab}
        newOrdersCount={orderCounts.new}
        lowStockCount={stockMetrics.outOfStock + stockMetrics.lowStock}
        pendingRequestsCount={requests.filter((r) => r.status === 'PENDING').length}
        marketPendingCount={marketPendingCount}
        onTabChange={setActiveTab}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* ─── Mobile Slide-out Drawer ─── */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        propertyCode={rawPropertyCode}
        activeStaffName={activeStaffName}
        soundOn={soundOn}
        onClose={() => setMobileMenuOpen(false)}
        onOpenStaffModal={() => setShowStaffModal(true)}
        onToggleSound={toggleSound}
      />

      {/* ─── Stock Refill Request Modal ─── */}
      <StockRequestModal
        isOpen={showRequestModal}
        selectedStockItem={selectedStockItem}
        customItemName={customItemName}
        requestQty={requestQty}
        requestUnit={requestUnit}
        requestUrgency={requestUrgency}
        requestRemarks={requestRemarks}
        submittingRequest={submittingRequest}
        onClose={() => setShowRequestModal(false)}
        onSetCustomItemName={setCustomItemName}
        onSetRequestQty={setRequestQty}
        onSetRequestUnit={setRequestUnit}
        onSetRequestUrgency={setRequestUrgency}
        onSetRequestRemarks={setRequestRemarks}
        onSubmit={handleSubmitStockRequest}
      />

      {/* ─── Staff Profile Modal ─── */}
      <StaffProfileModal
        isOpen={showStaffModal}
        staffRoleInput={staffRoleInput}
        onClose={() => setShowStaffModal(false)}
        onSetStaffRoleInput={setStaffRoleInput}
        onSave={() => {
          const finalName = staffRoleInput.trim() || 'Kitchen Staff';
          setActiveStaffName(finalName);
          localStorage.setItem('kitchen_staff_name', finalName);
          setShowStaffModal(false);
          toast.success(`Active staff set to ${finalName}`);
        }}
      />
    </div>
  );
}
