'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Utensils, ShoppingCart, User, Table as TableIcon,
  CheckCircle, Clock, ChevronRight, Star,
  Menu, X, Search, Filter, ArrowLeft, Plus, Minus,
  ChefHat, ShoppingBag, Bell, CreditCard, ReceiptIndianRupee,
  Volume2, VolumeX, Smartphone, Zap, CarFront, UserPlus,
  ArrowLeftRight, QrCode, RefreshCw, Printer
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CustomerForm } from '@/components/forms/customer-form';
import { SwitchTableModal } from '@/components/tables/SwitchTableModal';
import { KotSlipModal, KotSlipData } from '@/components/kots/KotSlipModal';
import TabletModals from '@/components/tablet/TabletModals';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

// --- Types ---
interface TabletConfig {
  id: string;
  name: string;
  mode: 'WAITER' | 'TABLE';
  tableId?: string | null;
  waiterId?: string | null;
  propertyId: string;
  property: {
    name: string;
    code: string;
    upiId?: string | null;
    upiName?: string | null;
  };
  table?: {
    id: string;
    name: string;
    qrToken: string | null;
  } | null;
}

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  categoryId: string;
  image?: string;
  description?: string;
  productType?: string;
  isPopular?: boolean;
  hsnCode?: string;
  halfPrice?: number | null;
  variants?: any[];
  isVeg?: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Order {
  id: string;
  orderNo: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  membershipDiscount?: number;
  grandTotal: number;
  createdAt: string;
  items?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    product: {
      name: string;
      image?: string;
    }
  }>;
}

// --- Constants (Matching Billing Page Aesthetics) ---
const PRODUCT_PALETTE_DARK = [
  { bg: '#c8e6c9', border: '#81c784', text: '#1b3a1c', textSub: '#2e5e30' },  // Mint Green
  { bg: '#ce93d8', border: '#ab47bc', text: '#1a0d1e', textSub: '#3d1547' },  // Lavender
  { bg: '#90caf9', border: '#42a5f5', text: '#0d1f35', textSub: '#0c3b6e' },  // Sky Blue
  { bg: '#f48fb1', border: '#e91e63', text: '#2d0016', textSub: '#6a0030' },  // Rose Pink
  { bg: '#fff59d', border: '#fdd835', text: '#2d2600', textSub: '#5e4a00' },  // Yellow
  { bg: '#80cbc4', border: '#26a69a', text: '#002926', textSub: '#00544f' },  // Teal
  { bg: '#ffcc80', border: '#ffa726', text: '#2d1500', textSub: '#5e3000' },  // Peach/Orange
  { bg: '#b0bec5', border: '#78909c', text: '#1a2125', textSub: '#2e3d45' },  // Blue Grey
];

const CATEGORY_COLORS_DARK: Record<number, string> = {
  0: 'bg-[#b8d8bc] text-[#1a3d1f]', // Soft mint green
  1: 'bg-[#c9b8d8] text-[#2e1a4a]', // Soft lavender
  2: 'bg-[#b8cfd8] text-[#1a2e3d]', // Soft sky blue
  3: 'bg-[#d8b8c2] text-[#3d1a26]', // Soft rose pink
  4: 'bg-[#d8d4b8] text-[#3d3520]', // Soft warm beige
  5: 'bg-[#b8d8d0] text-[#1a3d35]', // Soft teal
  6: 'bg-[#d8c8b8] text-[#3d2d1a]', // Soft peach
  7: 'bg-[#c8c8d8] text-[#1a1a3d]', // Soft periwinkle
};

export default function TabletPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [tablet, setTablet] = useState<TabletConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const tablesByFloor = useMemo(() => {
    const groups: Record<string, any[]> = {};
    tables.forEach(table => {
      const floorName = table.floor?.name || 'Main Hall';
      if (!groups[floorName]) {
        groups[floorName] = [];
      }
      groups[floorName].push(table);
    });
    return groups;
  }, [tables]);
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [waiter, setWaiter] = useState<{ id: string; name: string } | null>(null);
  const [websiteSettings, setWebsiteSettings] = useState<{ logoUrl: string | null } | null>(null);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<Array<{ id: string; message: string; timestamp: Date; type: 'success' | 'info' }>>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // UI State
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);

  const [pax, setPax] = useState<number>(1);
  const [sessionStage, setSessionStage] = useState<'TABLE' | 'PAX' | 'MENU'>('TABLE');
  const [isStatusVisible, setIsStatusVisible] = useState(false);
  const [activeFloorFilter, setActiveFloorFilter] = useState('all');


  // --- Order Calculation States ---
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT');

  // --- Waiter/Search States ---
  const [searchMode, setSearchMode] = useState<'CUSTOMER' | 'DRIVER' | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [driverSearch, setDriverSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isWaitingApproval, setIsWaitingApproval] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [transactionLast4, setTransactionLast4] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [drivers, setDrivers] = useState<any[]>([]);

  // Switch Table & KOT Modals
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [sourceTableForSwitch, setSourceTableForSwitch] = useState<any>(null);
  const [switchLoading, setSwitchLoading] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrModalOrder, setQrModalOrder] = useState<any>(null);
  const [localDiscountAmount, setLocalDiscountAmount] = useState<number>(0);
  const [activeTableActionId, setActiveTableActionId] = useState<string | null>(null);
  
  const [kotSlip, setKotSlip] = useState<KotSlipData | null>(null);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const { addToast } = useToast();

  const handleConfirmSwitchTable = async (targetTableId: string) => {
    if (!sourceTableForSwitch) return;
    setSwitchLoading(true);
    try {
      const res = await fetch('/api/tables/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTableId: sourceTableForSwitch.id,
          targetTableId,
          tabletId: id
        })
      });
      const result = await res.json();
      if (result.success) {
        setIsSwitchModalOpen(false);
        setSourceTableForSwitch(null);
        addToast('success', 'Table switched successfully');
        // Trigger a re-fetch of table data to update the UI
        const dataRes = await fetch(`/api/tablets/${id}/data`);
        const data = await dataRes.json();
        if (data.success && data.data.tables) setTables(data.data.tables);
      } else {
        addToast('error', result.message || 'Failed to switch table');
      }
    } catch (error) {
      console.error('Switch error:', error);
      addToast('error', 'An error occurred while switching the table');
    } finally {
      setSwitchLoading(false);
    }
  };

  const handlePrintKOT = async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    const currentOrder = activeOrders.find(o => o.restaurantTableId === tableId) || activeOrder;
    const orderId = currentOrder?.id;
    if (!orderId) {
       addToast('error', 'No active order found for this table');
       return;
    }
    
    try {
      const res = await fetch(`/api/orders/${orderId}/print`);
      const result = await res.json();
      const order = result.success ? result.data : null;
      if (!order || !order.kotTickets?.length) {
         addToast('error', 'No KOT tickets found for this order');
         return;
      }

      const allItems: any[] = [];
      order.kotTickets.forEach((kot: any) => {
        kot.items.forEach((item: any) => {
          const name = item.itemName || item.product?.name || 'Unknown Item';
          const existing = allItems.find(i => i.name === name);
          if (existing) {
            existing.quantity += item.quantity;
          } else {
            allItems.push({
              name: name,
              quantity: item.quantity,
              notes: item.notes
            });
          }
        });
      });

      const latestKot = order.kotTickets[order.kotTickets.length - 1];
      setKotSlip({
        kotNo: latestKot.kotNo,
        orderNo: order.orderNo,
        tableNo: table?.name || order.tableNo || '',
        roomId: order.roomId || undefined,
        orderType: order.orderType,
        createdAt: latestKot.createdAt,
        items: allItems
      });
    } catch (err) {
      console.error('Failed to fetch print data:', err);
      addToast('error', 'Failed to fetch print data');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tabRes, dataRes, custRes, drivRes] = await Promise.all([
          fetch(`/api/tablets/${id}`),
          fetch(`/api/tablets/${id}/data`),
          fetch(`/api/customers?tabletId=${id}`),
          fetch('/api/drivers'),
        ]);

        const tabData = await tabRes.json();
        const data = await dataRes.json();
        const custData = await custRes.json();
        const drivData = await drivRes.json();

        if (tabData.success) {
          setTablet(tabData.data);
          if (tabData.data.tableId) {
            setSelectedTableId(tabData.data.tableId);
            setSessionStage('MENU');
          }
        }
        if (data.success) {
          const { products: prodData, categories: catData, tables: tableData, property: propData, waiter: waiterData, websiteSettings: webSettingsData, activeOrders: activeOrdersData } = data.data;
          setProducts(prodData);
          setCategories(catData);
          setTables(tableData);
          setProperty(propData);
          setWaiter(waiterData || null);
          setWebsiteSettings(webSettingsData || null);
          setActiveOrders(activeOrdersData || []);
        }
        if (custData) setCustomers(Array.isArray(custData) ? custData : custData.data || []);
        if (drivData.success) setDrivers(drivData.data);
      } catch (error) {
        addToast('error', 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchKitchenStatus = async () => {
      try {
        const res = await fetch(`/api/tablets/${id}/data`);
        const data = await res.json();
        if (data.success) {
          if (data.data.activeOrders) setActiveOrders(data.data.activeOrders);
          if (data.data.tables) setTables(data.data.tables);
        }
      } catch (e) {
        console.error('Failed to fetch kitchen status:', e);
      }
    };

    const interval = setInterval(fetchKitchenStatus, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const prevStatusesRef = useRef<Record<string, string>>({});
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (activeOrders.length === 0) return;

    if (isFirstLoadRef.current) {
      activeOrders.forEach(order => {
        prevStatusesRef.current[order.id] = order.status;
      });
      isFirstLoadRef.current = false;
      return;
    }

    activeOrders.forEach(order => {
      const prevStatus = prevStatusesRef.current[order.id];
      if (prevStatus && prevStatus !== order.status) {
        const tableName = order.table?.name || `Table ${order.tableNo || '?'}`;
        let message = '';
        let type: 'success' | 'info' = 'info';

        if (order.status === 'READY') {
          message = `${tableName}: Order is READY to serve!`;
          type = 'success';
          addToast('success', `🔔 ${message}`);
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
            audio.volume = 0.5;
            audio.play();
          } catch (e) { }
        } else if (order.status === 'KOT_RUNNING' || order.status === 'IN_KITCHEN') {
          message = `${tableName}: Order is being prepared in kitchen.`;
          type = 'info';
          addToast('info', `🍳 ${message}`);
        }

        if (message) {
          setNotificationHistory(prev => [
            { id: `${order.id}-${Date.now()}`, message, timestamp: new Date(), type },
            ...prev.slice(0, 19)
          ]);
        }
      }
      prevStatusesRef.current[order.id] = order.status;
    });
  }, [activeOrders, addToast]);

  useEffect(() => {
    const fetchActiveOrder = async () => {
      if (!selectedTableId) return;
      try {
        const res = await fetch(`/api/pos-orders?restaurantTableId=${selectedTableId}&status=in_progress`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const newOrder = data.data[0];
          setActiveOrder(prev => {
            // Only update if data has actually changed to prevent re-renders
            if (prev && JSON.stringify(prev) === JSON.stringify(newOrder)) return prev;
            return newOrder;
          });
          setIsStatusVisible(true);
        } else {
          setActiveOrder(null);
          setIsStatusVisible(false);
        }
      } catch (e) {
        // Silent error for polling to avoid toast spam
        console.error('Polling error:', e);
      }
    };

    if (selectedTableId) {
      fetchActiveOrder();
      const pollInterval = isWaitingApproval ? 5000 : 10000;
      const interval = setInterval(fetchActiveOrder, pollInterval);
      return () => clearInterval(interval);
    }
  }, [selectedTableId, isWaitingApproval]);

  // Effect to handle session reset on settlement
  useEffect(() => {
    if (activeOrder?.status === 'SETTLED') {
      addToast('success', 'Payment Approved! Thank you.');
      setActiveOrder(null);
      setCart([]);
      setIsWaitingApproval(false);
      setIsStatusVisible(false);
      setPax(1);
      // If in TABLE mode, go back to table selection
      if (tablet?.mode === 'WAITER') {
        setSessionStage('TABLE');
      }
    }
  }, [activeOrder?.status]);

  const addToCart = (product: Product | any, variantName?: string, variantPrice?: number) => {
    const finalPrice = variantPrice ?? product.sellingPrice;
    const finalName = variantName && variantName !== 'Full' ? `${product.name} (${variantName})` : product.name;
    const cartItemId = variantName ? `${product.id}-${variantName}` : product.id;

    setCart(prev => {
      const existing = prev.find(item => (item as any).cartItemId === cartItemId);
      if (existing) {
        return prev.map(item =>
          (item as any).cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, name: finalName, sellingPrice: finalPrice, cartItemId, quantity: 1, size: variantName }];
    });
    addToast('success', `${finalName} added to tray`);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => {
      const existing = prev.find(item => (item as any).cartItemId === cartItemId);
      if (existing && existing.quantity === 1 && delta === -1) {
        return prev.filter(item => (item as any).cartItemId !== cartItemId);
      }
      return prev.map(item =>
        (item as any).cartItemId === cartItemId ? { ...item, quantity: item.quantity + delta } : item
      );
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => (item as any).cartItemId !== cartItemId));
  };

  const handlePlaceOrder = async () => {
    if (!selectedTableId) return;
    if (cart.length === 0 && !activeOrder) return;

    setIsPlacingOrder(true);
    try {
      const res = await fetch('/api/pos-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: tablet?.propertyId,
          tabletId: id,
          orderType: selectedDriver ? 'DELIVERY' : 'DINE_IN',
          restaurantTableId: selectedTableId,
          guestId: selectedCustomer?.id,
          driverId: selectedDriver?.id,
          staffMemberId: tablet?.waiterId || null,
          discountAmount: discountAmount || 0,
          discountType: discountType,
          items: cart.map(i => ({
            productId: i.id,
            quantity: i.quantity,
            unitPrice: i.sellingPrice,
            variantName: (i as any).size || (i as any).variantName || null
          })),
          paymentMode: paymentMode,
          transactionLast4: transactionLast4
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast('success', 'Order sent to kitchen!');
        setActiveOrder(data.data);
        setIsStatusVisible(true);
        // Clear the local cart because items are now in activeOrder.items
        // But the UI will still show them and the total will reflect them.
        setCart([]);
      } else {
        addToast('error', data.message || 'Failed to place order');
      }
    } catch (error) {
      addToast('error', 'Network error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const cartSubtotal = useMemo(() => {
    const inCart = cart.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0);
    const ordered = activeOrder?.subtotal || 0;
    return inCart + ordered;
  }, [cart, activeOrder]);

  const cartTax = useMemo(() => {
    const inCartTax = cart.reduce((total, item) => total + (item.sellingPrice * item.quantity * 0.05), 0);
    const orderedTax = activeOrder?.taxAmount || 0;
    return inCartTax + orderedTax;
  }, [cart, activeOrder]);

  const cartTotal = cartSubtotal + cartTax
    - (discountType === 'PERCENT' ? (cartSubtotal * discountAmount / 100) : discountAmount)
    - (activeOrder?.discountAmount || 0)
    - (activeOrder?.membershipDiscount || 0);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const displayLogo = property?.logoUrl || websiteSettings?.logoUrl;

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0F172A]">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Initializing Terminal...</p>
    </div>
  );

  if (!tablet) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-red-950/20 text-red-500 p-10 text-center">
      <X size={64} className="mb-4" />
      <h2 className="text-2xl font-black uppercase">Configuration Error</h2>
    </div>
  );

  // Waiter Station Selection
  if (tablet.mode === 'WAITER' && sessionStage !== 'MENU') {
    return (
      <>
        <div className="h-screen w-screen bg-[#0F172A] text-white flex flex-col overflow-hidden font-sans">
          {/* Live Kitchen Status Ticker */}
        <div className="h-10 shrink-0 bg-slate-950/90 border-b border-white/5 flex items-center justify-between px-10 select-none overflow-hidden text-[9px] font-black tracking-widest uppercase">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-emerald-400 font-black">Live Kitchen Status</span>
          </div>
          <div className="flex-1 flex items-center gap-6 overflow-x-auto no-scrollbar ml-8 mr-4 py-1">
            {activeOrders.length === 0 ? (
              <span className="text-slate-500 font-semibold tracking-normal normal-case">All orders served. Kitchen is clear.</span>
            ) : (
              activeOrders.map(order => {
                const tableName = order.table?.name || `Table ${order.tableNo || '?'}`;
                const isReady = order.status === 'READY';
                const isAwaiting = order.status === 'PAYMENT_AWAITING_APPROVAL';

                let statusLabel = 'In Kitchen';
                let badgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                let pulseClass = '';

                if (isReady) {
                  statusLabel = 'Ready to Serve';
                  badgeColor = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
                  pulseClass = 'animate-pulse';
                } else if (isAwaiting) {
                  statusLabel = 'Awaiting Settle';
                  badgeColor = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
                }

                return (
                  <div key={order.id} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${badgeColor} ${pulseClass} shrink-0`}>
                    <span>{tableName}</span>
                    <span className="opacity-40">•</span>
                    <span>{statusLabel}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <header className="h-20 shrink-0 flex items-center justify-between px-10 border-b border-white/5 bg-slate-900/50">
          <div className="flex items-center gap-4">
            {displayLogo ? (
              <img src={displayLogo} alt="Logo" className="h-10 w-auto object-contain rounded-xl" />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <ChefHat size={20} className="text-white" />
              </div>
            )}
            <div>
              {!displayLogo && (
                <h1 className="text-lg font-black tracking-tight uppercase">
                  {property?.brandName || property?.name || 'OrderMint'} <span className="text-indigo-500">Tablet</span>
                </h1>
              )}
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{tablet.name} • WAITER STATION {waiter ? `(${waiter.name})` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative w-10 h-10 bg-slate-800/80 hover:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <Bell size={18} />
              {notificationHistory.filter(n => n.type === 'success').length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse">
                  {notificationHistory.filter(n => n.type === 'success').length}
                </div>
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 no-scrollbar select-none">
          {sessionStage === 'TABLE' ? (
            <div className="w-full max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Select Station</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Identify the table to begin service</p>
              </div>
              {/* 🏢 Floor Tab Selector */}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-10 overflow-x-auto no-scrollbar py-2">
                <button
                  onClick={() => setActiveFloorFilter('all')}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeFloorFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 border border-indigo-500'
                    : 'bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                    }`}
                >
                  🏢 All Stations
                </button>
                {Object.keys(tablesByFloor).map(floorName => (
                  <button
                    key={floorName}
                    onClick={() => setActiveFloorFilter(floorName)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${activeFloorFilter === floorName
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 border border-indigo-500'
                      : 'bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                      }`}
                  >
                    📍 {floorName}
                  </button>
                ))}
              </div>

              <div className="space-y-12 pb-32">
                {Object.entries(tablesByFloor)
                  .filter(([floorName]) => activeFloorFilter === 'all' || activeFloorFilter === floorName)
                  .map(([floorName, floorTables]) => (
                    <div key={floorName} className="space-y-6">
                      {/* Section Title with glowing indicator */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                          <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                            {floorName}
                          </h3>
                        </div>
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/10">
                          {floorTables.length} {floorTables.length === 1 ? 'Table' : 'Tables'}
                        </span>
                      </div>

                      {/* Grid of premium cards */}
                      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-4">
                        {floorTables.map(table => {
                          const tableActiveOrder = activeOrders.find(order => order.restaurantTableId === table.id);
                          let tableStatus = (table as any).status || 'VACANT';
                          if (tableActiveOrder && tableStatus === 'VACANT') {
                            tableStatus = tableActiveOrder.status === 'READY' ? 'READY' 
                              : tableActiveOrder.status === 'PAYMENT_AWAITING_APPROVAL' ? 'BILL_PRINTED' 
                              : 'KOT_RUNNING';
                          }

                          let borderStyle = 'border-white/5 hover:border-emerald-500/30';
                          let bgStyle = 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950';
                          let iconColor = 'text-emerald-400';
                          let statusLabel = 'Vacant';
                          let badgeStyle = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';

                          if (tableStatus === 'READY' || tableActiveOrder?.status === 'READY') {
                            bgStyle = 'bg-gradient-to-br from-teal-900 via-cyan-950 to-slate-950';
                            borderStyle = 'border-teal-500/50 shadow-[0_0_20px_rgba(20,184,166,0.15)]';
                            iconColor = 'text-teal-400';
                            statusLabel = 'Ready to Serve';
                            badgeStyle = 'bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-[0_0_10px_rgba(20,184,166,0.2)] animate-pulse';
                          } else if (tableStatus === 'BILL_PRINTED' || tableActiveOrder?.status === 'PAYMENT_AWAITING_APPROVAL') {
                            bgStyle = 'bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950';
                            borderStyle = 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]';
                            iconColor = 'text-blue-400';
                            statusLabel = 'Awaiting Settle';
                            badgeStyle = 'bg-blue-500/20 text-blue-300 border border-blue-500/30';
                          } else if (tableStatus === 'KOT_RUNNING' || tableActiveOrder?.status === 'IN_KITCHEN' || tableActiveOrder?.status === 'KOT_RUNNING') {
                            bgStyle = 'bg-gradient-to-br from-amber-900 via-orange-950 to-slate-950';
                            borderStyle = 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]';
                            iconColor = 'text-orange-400';
                            statusLabel = 'In Kitchen';
                            badgeStyle = 'bg-orange-500/20 text-orange-300 border border-orange-500/30 animate-pulse';
                          } else if (tableStatus !== 'VACANT') {
                            bgStyle = 'bg-gradient-to-br from-rose-900 via-red-950 to-slate-950';
                            borderStyle = 'border-red-500/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]';
                            iconColor = 'text-red-400';
                            statusLabel = tableStatus.replace('_', ' ');
                            badgeStyle = 'bg-red-500/20 text-red-300 border border-red-500/30';
                          }

                          const isOccupied = tableStatus !== 'VACANT';

                          return (
                            <div className="relative" key={table.id}>
                                <button
                                onClick={() => {
                                  if (isOccupied) {
                                    setActiveTableActionId(activeTableActionId === table.id ? null : table.id);
                                  } else {
                                    setSelectedTableId(table.id);
                                    setSessionStage('PAX');
                                  }
                                }}
                                onDoubleClick={() => {
                                  setSelectedTableId(table.id);
                                  if (isOccupied) {
                                    setSessionStage('MENU');
                                  } else {
                                    setSessionStage('PAX');
                                  }
                                }}
                                className={`w-full h-[150px] rounded-2xl border ${borderStyle} ${bgStyle} flex flex-col items-center justify-between p-3 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] group`}
                              >
                                {/* Top Row inside card - Capacity info */}
                                <div className="w-full flex justify-between items-center opacity-60">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                                    MAX {table.capacity || 4} PAX
                                  </span>
                                  <User size={10} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                </div>

                                {/* Middle content */}
                                <div className="flex flex-col items-center my-auto">
                                  <TableIcon size={24} className={`mb-1 transition-all duration-300 transform group-hover:scale-110 ${iconColor}`} />
                                  <span className="text-xl font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                                    {table.name}
                                  </span>
                                  {waiter && (
                                    <span className="text-[9px] font-black uppercase tracking-widest text-white/50 mt-1">
                                      {waiter.name}
                                    </span>
                                  )}
                                </div>

                                {/* Bottom Status pill */}
                                <div className={`w-full py-1.5 rounded-2xl text-[8px] font-black uppercase tracking-widest text-center transition-all duration-300 ${badgeStyle}`}>
                                  {statusLabel}
                                </div>
                              </button>

                              <AnimatePresence>
                                {activeTableActionId === table.id && (
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute top-[105%] left-1/2 -translate-x-1/2 z-[100] w-[220px] bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-3 flex flex-col gap-2"
                                  >
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const order = activeOrders.find(o => o.restaurantTableId === table.id);
                                        setQrModalOrder(order || null);
                                        setIsQRModalOpen(true);
                                        setActiveTableActionId(null);
                                      }}
                                      className="w-full py-3 bg-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                                    >
                                      <ReceiptIndianRupee size={16} />
                                      Pay Bill
                                    </button>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePrintKOT(table.id);
                                          setActiveTableActionId(null);
                                        }}
                                        className="flex-1 py-3 bg-white/5 border border-white/5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                      >
                                        <Printer size={16} />
                                        Print KOT
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSourceTableForSwitch(table);
                                          setIsSwitchModalOpen(true);
                                          setActiveTableActionId(null);
                                        }}
                                        className="flex-1 py-3 bg-white/5 border border-white/5 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                      >
                                        <ArrowLeftRight size={16} />
                                        Switch
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 relative py-8">
              {/* Subtle ambient background glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
              </div>

              <div className="w-full max-w-md text-center relative z-10 px-4">
                <div className="mb-6">
                  <h2 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mb-1.5">Service Details</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px]">Select guest, driver, and number of PAX</p>
                </div>
                
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-white/10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] shadow-indigo-500/5 mb-6 flex flex-col gap-6 relative overflow-hidden">
                  {/* Inner shine */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  {isCustomerModalOpen ? (
                    <div className="bg-slate-950/80 rounded-2xl p-5 border border-white/10 text-left animate-in zoom-in-95 duration-200 shadow-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                          <UserPlus size={14} /> New Guest Registration
                        </h3>
                      </div>
                      <CustomerForm
                        onSubmit={async (data) => {
                          try {
                            const res = await fetch('/api/customers', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ...data, tabletId: id }),
                            });
                            const result = await res.json();
                            if (result.success) {
                              const newCustomer = result.data;
                              setCustomers(prev => [...prev, newCustomer]);
                              setSelectedCustomer(newCustomer);
                              setIsCustomerModalOpen(false);
                              addToast('success', 'Guest registered successfully');
                            } else {
                              addToast('error', result.message || 'Failed to register guest');
                            }
                          } catch (e) {
                            addToast('error', 'Network error while registering guest');
                          }
                        }}
                        onCancel={() => setIsCustomerModalOpen(false)}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Customer/Driver Selection */}
                      <div className="space-y-4 text-left">
                        {!(selectedCustomer || selectedDriver) ? (
                          <>
                            <div className="p-1 bg-slate-950/80 rounded-2xl border border-white/5 shadow-inner flex gap-1.5">
                              <button
                                onClick={() => setSearchMode('CUSTOMER')}
                                className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${searchMode === 'CUSTOMER' ? 'bg-indigo-600 text-white shadow-[0_5px_15px_-5px_rgba(79,70,229,0.8)] border border-indigo-400/50' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                              >
                                <User size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Guest</span>
                              </button>
                              <button
                                onClick={() => setSearchMode('DRIVER')}
                                className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${searchMode === 'DRIVER' ? 'bg-amber-600 text-white shadow-[0_5px_15px_-5px_rgba(217,119,6,0.8)] border border-amber-400/50' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
                              >
                                <CarFront size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Driver</span>
                              </button>
                            </div>

                            <AnimatePresence>
                              {searchMode && (
                                <motion.div 
                                  initial={{ opacity: 0, height: 0, y: -10 }}
                                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                                  exit={{ opacity: 0, height: 0, y: -10 }}
                                  className="relative overflow-visible"
                                >
                                  <div className="relative group mt-3">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
                                    <input
                                      type="text"
                                      placeholder={searchMode === 'CUSTOMER' ? "Search guest name/mobile..." : "Search driver name..."}
                                      value={searchMode === 'CUSTOMER' ? customerSearch : driverSearch}
                                      onChange={(e) => searchMode === 'CUSTOMER' ? setCustomerSearch(e.target.value) : setDriverSearch(e.target.value)}
                                      className="w-full h-12 bg-slate-950/80 border border-white/10 rounded-xl pl-12 pr-12 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/20 transition-all shadow-inner"
                                      autoFocus
                                    />
                                    {searchMode === 'CUSTOMER' && (
                                      <button onClick={() => setIsCustomerModalOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all" title="Add New Guest">
                                        <UserPlus size={14} />
                                      </button>
                                    )}
                                  </div>

                                  {/* Search Results Dropdown */}
                                  {(searchMode === 'CUSTOMER' ? customerSearch : driverSearch) && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden max-h-48 overflow-y-auto no-scrollbar">
                                      {searchMode === 'CUSTOMER' ? (
                                        customers.filter(c =>
                                          c.firstName.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                          c.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                          c.mobile?.includes(customerSearch)
                                        ).map(c => (
                                          <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setSearchMode(null); }} className="w-full px-5 py-3 flex flex-col items-start hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 text-left group">
                                            <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{c.firstName} {c.lastName}</span>
                                            <span className="text-[9px] text-indigo-400 uppercase font-black mt-0.5 tracking-widest">{c.mobile || 'No Mobile'}</span>
                                          </button>
                                        ))
                                      ) : (
                                        drivers.filter(d =>
                                          d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                                          d.phone?.includes(driverSearch)
                                        ).map(d => (
                                          <button key={d.id} onClick={() => { setSelectedDriver(d); setDriverSearch(''); setSearchMode(null); }} className="w-full px-5 py-3 flex flex-col items-start hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 text-left group">
                                            <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">{d.name}</span>
                                            <span className="text-[9px] text-amber-400 uppercase font-black mt-0.5 tracking-widest">{d.phone || 'No Phone'}</span>
                                          </button>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </>
                        ) : (
                          /* Selected Entity Indicator */
                          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between group shadow-inner">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${selectedCustomer ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20' : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20'}`}>
                                {selectedCustomer ? <User size={20} /> : <CarFront size={20} />}
                              </div>
                              <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{selectedCustomer ? 'Selected Guest' : 'Assigned Driver'}</p>
                                <p className="text-base font-black text-white uppercase tracking-tight">{selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName || ''}` : selectedDriver.name}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => { setSelectedCustomer(null); setSelectedDriver(null); }}
                              className="h-9 px-4 bg-white/5 hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                            >
                              Change
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full my-2" />

                  <div className="flex flex-col items-center gap-4">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Number of PAX</p>
                    
                    {/* Unibody PAX Selector */}
                    <div className="flex items-center justify-between bg-slate-950/80 border border-white/10 rounded-full p-1.5 w-full max-w-[260px] shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                      
                      <button 
                        onClick={() => setPax(Math.max(1, pax - 1))} 
                        className="w-12 h-12 shrink-0 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 z-10"
                      >
                        <Minus size={18} />
                      </button>
                      
                      <div className="flex-1 flex flex-col items-center justify-center z-10">
                        <span className="text-[3.5rem] font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] leading-none">{pax}</span>
                      </div>
                      
                      <button 
                        onClick={() => setPax(pax + 1)} 
                        className="w-12 h-12 shrink-0 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-500 hover:text-white transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(99,102,241,0)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] z-10"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setSessionStage('MENU')} 
                  className="w-full h-16 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_-10px_rgba(79,70,229,0.7)] hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.9)] transition-all hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] flex items-center justify-center gap-3 group relative overflow-hidden text-base border border-indigo-400/30"
                  style={{ backgroundSize: '200% 100%' }}
                >
                  {/* Animated sheen */}
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                  
                  <span className="relative z-10 text-white drop-shadow-md">Confirm & Start</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center relative z-10 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                    <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          )}
        </main>

      <TabletModals
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
        notificationHistory={notificationHistory}
        kotSlip={kotSlip}
        setKotSlip={setKotSlip}
        isQRModalOpen={isQRModalOpen}
        setIsQRModalOpen={setIsQRModalOpen}
        qrModalOrder={qrModalOrder}
        setQrModalOrder={setQrModalOrder}
        activeOrder={activeOrder}
        cartSubtotal={cartSubtotal}
        cartTax={cartTax}
        localDiscountAmount={localDiscountAmount}
        setLocalDiscountAmount={setLocalDiscountAmount}
        tablet={tablet}
        isSwitchModalOpen={isSwitchModalOpen}
        setIsSwitchModalOpen={setIsSwitchModalOpen}
        sourceTableForSwitch={sourceTableForSwitch}
        setSourceTableForSwitch={setSourceTableForSwitch}
        tables={tables}
        handleConfirmSwitchTable={handleConfirmSwitchTable}
        switchLoading={switchLoading}
      />
      </div>
      </>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#020617] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Live Kitchen Status Ticker */}
      <div className="h-10 shrink-0 bg-slate-950/90 border-b border-white/5 flex items-center justify-between px-6 select-none overflow-hidden text-[9px] font-black tracking-widest uppercase">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="text-emerald-400 font-black">Live Kitchen Status</span>
        </div>
        <div className="flex-1 flex items-center gap-6 overflow-x-auto no-scrollbar ml-8 mr-4 py-1">
          {activeOrders.length === 0 ? (
            <span className="text-slate-500 font-semibold tracking-normal normal-case">All orders served. Kitchen is clear.</span>
          ) : (
            activeOrders.map(order => {
              const tableName = order.table?.name || `Table ${order.tableNo || '?'}`;
              const isReady = order.status === 'READY';
              const isAwaiting = order.status === 'PAYMENT_AWAITING_APPROVAL';

              let statusLabel = 'In Kitchen';
              let badgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
              let pulseClass = '';

              if (isReady) {
                statusLabel = 'Ready to Serve';
                badgeColor = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
                pulseClass = 'animate-pulse';
              } else if (isAwaiting) {
                statusLabel = 'Awaiting Settle';
                badgeColor = 'bg-blue-500/10 border-blue-500/20 text-blue-400';
              }

              return (
                <div key={order.id} className={`flex items-center gap-2 px-3 py-1 rounded-full border ${badgeColor} ${pulseClass} shrink-0`}>
                  <span>{tableName}</span>
                  <span className="opacity-40">•</span>
                  <span>{statusLabel}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Top Header - Unified Terminal Header */}
      <header className="h-16 shrink-0 flex items-center justify-between px-6 bg-slate-900/80 backdrop-blur-md border-b border-white/5 z-50">
        <div className="flex items-center gap-4">
          {displayLogo ? (
            <img src={displayLogo} alt="Logo" className="h-8 w-auto object-contain" />
          ) : (
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Utensils size={18} />
            </div>
          )}
          <div>
            {!displayLogo && (
              <h1 className="font-black uppercase tracking-tight text-sm">
                {property?.brandName || property?.name || 'OrderMint'} <span className="text-indigo-500">POS</span>
              </h1>
            )}
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
              {tablet.name} • {tables.find(t => t.id === selectedTableId)?.name || 'STATION'} {waiter ? `• Waiter: ${waiter.name}` : ''}
            </p>
          </div>
        </div>

        {activeOrder && (
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 animate-in fade-in zoom-in duration-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <div className="flex flex-col">
              <span className="text-[7px] font-black uppercase text-indigo-400 tracking-widest leading-none">Active Order</span>
              <span className="text-[9px] font-black leading-tight text-white/90">#{activeOrder.orderNo}</span>
            </div>
            <button
              onClick={() => setIsStatusVisible(true)}
              className="text-[7px] font-black uppercase bg-white/5 px-2 py-1 rounded-md hover:bg-white/10 ml-2 border border-white/5 transition-all"
            >
              Track Status
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
            <input
              type="text"
              placeholder="Search Menu..."
              className="w-full h-10 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-[10px] font-bold outline-none focus:border-indigo-500/50 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {tablet.mode === 'WAITER' && (
            <button
              onClick={() => setSessionStage('TABLE')}
              className="h-10 px-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-widest"
            >
              <TableIcon size={14} className="text-indigo-400" />
              Switch Table
            </button>
          )}

          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <Bell size={18} />
            {notificationHistory.filter(n => n.type === 'success').length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse">
                {notificationHistory.filter(n => n.type === 'success').length}
              </div>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Side: Product Grid & Categories (Billing Style) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/50">
          {/* Category Bar */}
          <div className="h-20 shrink-0 border-b border-white/5 flex items-center px-4 gap-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex flex-col items-center justify-center min-w-[80px] h-14 rounded-xl transition-all ${activeCategory === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">All Items</span>
              <span className="text-[8px] font-bold opacity-60 mt-0.5">{products.length} Items</span>
            </button>

            {categories.map((cat, idx) => {
              const colorClass = CATEGORY_COLORS_DARK[idx % 8];
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center justify-center min-w-[100px] h-14 rounded-xl transition-all ${activeCategory === cat.id ? `${colorClass} shadow-lg scale-105` : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}
                >
                  <span className="text-[10px] font-black uppercase tracking-widest truncate w-full px-2 text-center">{cat.name}</span>
                  <span className="text-[8px] font-bold opacity-60 mt-0.5">Category</span>
                </button>
              );
            })}
          </div>


          {/* High Density Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3 content-start no-scrollbar">
            {filteredProducts.map((product, idx) => {
              const palette = PRODUCT_PALETTE_DARK[idx % PRODUCT_PALETTE_DARK.length];
              const inCart = cart.find(item => item.id === product.id);
              const hasVariants = (product.variants && product.variants.length > 0) || product.halfPrice;

              return (
                <motion.div whileTap={!hasVariants ? { scale: 0.95 } : undefined}
                  key={product.id}
                  className="relative group transition-all duration-200"
                >
                  <div
                    onClick={() => !hasVariants && addToCart(product)}
                    className={`relative w-full rounded-[16px] p-2.5 flex flex-col justify-between transition-all hover:brightness-110 shadow-md overflow-hidden border border-black/5 ${hasVariants ? 'cursor-default' : 'cursor-pointer'}`}
                    style={{ backgroundColor: palette.bg, aspectRatio: '1/1' }}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[8px] font-black uppercase opacity-40" style={{ color: palette.textSub }}>
                        {product.hsnCode || '2106'}
                      </span>
                      <div className="text-right">
                        <span className="block text-[6px] font-black uppercase opacity-30 leading-none mb-0.5" style={{ color: palette.textSub }}>Price</span>
                        <span className="text-[12px] font-black leading-none" style={{ color: palette.textSub }}>₹{product.sellingPrice}</span>
                      </div>
                    </div>

                    <div className="flex-1 flex items-center py-1">
                      <h3 className="text-[11px] font-black uppercase tracking-tighter leading-[1.1] line-clamp-3 w-full text-left" style={{ color: palette.text }}>
                        {product.name}
                      </h3>
                    </div>

                    {!hasVariants ? (
                      <div className="flex justify-between items-end border-t border-black/5 pt-1.5 mt-auto">
                        <div className="text-left space-y-0">
                          <span className="block text-[8px] font-black uppercase opacity-50 leading-none" style={{ color: palette.textSub }}>
                            {categoryMap[product.categoryId] || 'Menu'}
                          </span>
                          <span className="block text-[6px] font-bold opacity-30 uppercase leading-none" style={{ color: palette.textSub }}>GST 5%</span>
                        </div>

                        <div className="flex items-center">
                          {inCart ? (
                            <div className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center font-black text-[10px]" style={{ color: palette.text }}>
                              {inCart.quantity}
                            </div>
                          ) : (
                            <div className={`w-3.5 h-3.5 border border-current rounded-[3px] flex items-center justify-center bg-white/90 shrink-0 shadow-sm ${product.isVeg === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-current" />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-x-0 bottom-0 flex flex-col z-10">
                        {/* Show 'Full' button ONLY if there are no variants OR if halfPrice exists without variants */}
                        {(!product.variants || product.variants.length === 0) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); addToCart(product, 'Full', product.sellingPrice); }}
                            className="w-full py-3 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 active:bg-orange-700 transition-colors border-t border-white/10"
                          >
                            Full Price
                          </button>
                        )}

                        {/* Variants Grid - 2 per row */}
                        <div className="grid grid-cols-2 w-full border-t border-white/10">
                          {product.variants?.map((v: any, vIdx: number) => (
                            <button
                              key={v.id}
                              onClick={(e) => { e.stopPropagation(); addToCart(product, v.name, v.price); }}
                              className={`py-2.5 bg-rose-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 active:bg-rose-700 transition-colors ${vIdx % 2 === 0 ? 'border-r border-white/10' : ''} border-b border-white/5`}
                            >
                              {v.name}
                            </button>
                          ))}
                          {product.halfPrice && (
                            <button
                              onClick={(e) => { e.stopPropagation(); addToCart(product, 'Half', product.halfPrice!); }}
                              className={`py-2.5 bg-amber-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-amber-400 active:bg-amber-700 transition-colors ${(product.variants?.length || 0) % 2 === 0 ? 'col-span-2' : ''} border-b border-white/5`}
                            >
                              Half
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {!hasVariants && inCart && (
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-black/20" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Order Tray (Billing Style) */}
        <aside className="w-[420px] shrink-0 border-l border-white/5 bg-slate-900/30 flex flex-col overflow-hidden">
          {/* Tray Header */}
          <div className="p-6 border-b border-white/5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tighter mb-0.5">Order <span className="text-indigo-500">Details</span></h2>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                  {tablet.mode === 'WAITER' ? 'WAITER SERVICE' : 'COUNTER SERVICE'} • {tables.find(t => t.id === selectedTableId)?.name || 'STATION'} {waiter ? `(${waiter.name})` : ''}
                </p>
              </div>
              <div className="flex items-center bg-white/5 rounded-2xl p-1.5 border border-white/5">
                <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-slate-400 hover:text-white"><Minus size={14} /></button>
                <div className="px-3 flex flex-col items-center">
                  <span className="text-xs font-black leading-none">{pax}</span>
                  <span className="text-[6px] font-black text-slate-500 uppercase">Pax</span>
                </div>
                <button onClick={() => setPax(pax + 1)} className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all text-slate-400 hover:text-white"><Plus size={14} /></button>
              </div>
            </div>


          </div>

          {/* Tray Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {cart.length === 0 && (!activeOrder || !activeOrder.items || activeOrder.items.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                <ShoppingCart size={48} strokeWidth={1} className="mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Tray is Empty</p>
              </div>
            ) : (
              <>
                {cart.map(item => (
                  <div key={(item as any).cartItemId || item.id} className="bg-slate-800/40 rounded-2xl p-3 flex flex-col gap-3 animate-in slide-in-from-right-2 duration-300 border border-white/5">
                    <div className="flex gap-4">
                      <div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <Utensils size={24} className="text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[10px] font-black uppercase tracking-tight text-white/90 truncate">{item.name}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-indigo-400">₹{item.sellingPrice * item.quantity}</span>
                            <span className="text-[7px] font-bold text-slate-500 uppercase">₹{item.sellingPrice} / unit</span>
                          </div>
                          <div className="flex items-center gap-3 bg-black/20 p-1 rounded-lg border border-white/5">
                            <button onClick={() => updateQuantity((item as any).cartItemId || item.id, -1)} className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-all"><Minus size={12} /></button>
                            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity((item as any).cartItemId || item.id, 1)} className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center hover:bg-indigo-500/20 hover:text-indigo-400 transition-all"><Plus size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Variant Switch in Tray */}
                    {((item.variants && item.variants.length > 0) || item.halfPrice) && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        {item.variants?.map((v: any) => (
                          <button
                            key={v.id}
                            onClick={() => {
                              removeFromCart((item as any).cartItemId);
                              addToCart(item, v.name, v.price);
                            }}
                            className={`py-1.5 rounded-lg font-black text-[7px] uppercase tracking-widest transition-all border ${(item as any).size === v.name ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                          >
                            {v.name}
                          </button>
                        ))}
                        {item.halfPrice && (
                          <button
                            onClick={() => {
                              removeFromCart((item as any).cartItemId);
                              addToCart(item, 'Half', item.halfPrice!);
                            }}
                            className={`py-1.5 rounded-lg font-black text-[7px] uppercase tracking-widest transition-all border ${(item as any).size === 'Half' ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/20' : 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10'}`}
                          >
                            Half
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Active Order Items (Already Sent) */}
          {activeOrder && activeOrder.items && activeOrder.items.length > 0 && (
            <div className="px-4 pb-4 space-y-3 max-h-[300px] overflow-y-auto no-scrollbar border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 mb-2 opacity-50">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[7px] font-black uppercase tracking-[0.2em]">Already Ordered</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              {activeOrder.items.map((item: any) => (
                <div key={item.id} className="bg-white/5 rounded-2xl p-3 flex items-center gap-4 border border-white/5 opacity-60">
                  <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                    <CheckCircle size={16} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[9px] font-black uppercase tracking-tight text-white/80 truncate">{item.product?.name || 'Item'}</h4>
                    <p className="text-[8px] font-bold text-slate-500 mt-0.5">{item.quantity} x ₹{item.unitPrice}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[9px] font-black text-emerald-400">ORDERED</span>
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-0.5">KITCHEN</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals & Actions */}
          <div className="p-4 bg-slate-900 border-t border-white/10 space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Subtotal</span>
                <span>₹{cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Estimated Tax (5%)</span>
                <span>₹{cartTax.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-white/5 flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">Total Amount</span>
                  <span className="text-2xl font-black tracking-tighter text-white">
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => { setCart([]); setDiscountAmount(0); }}
                    className="text-[7px] font-black text-rose-500 uppercase tracking-widest hover:underline mb-1"
                  >
                    Clear Tray
                  </button>
                )}
              </div>
            </div>

            {/* Place Order / Actions */}
            <div className="pt-3">
              {cart.length > 0 ? (
                <button
                  disabled={isPlacingOrder}
                  onClick={() => handlePlaceOrder()}
                  className="w-full py-4 bg-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPlacingOrder ? 'Processing...' : 'Place Order'}
                </button>
              ) : activeOrder ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setQrModalOrder(activeOrder);
                        setIsQRModalOpen(true);
                      }}
                      className="flex-1 py-3 bg-emerald-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                    >
                      <ReceiptIndianRupee size={16} />
                      Pay Bill
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePrintKOT(selectedTableId!)}
                      className="flex-1 py-3 bg-white/10 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Printer size={16} />
                      Print KOT
                    </button>
                    <button
                      onClick={() => {
                        const activeTable = tables.find(t => t.id === selectedTableId);
                        setSourceTableForSwitch(activeTable);
                        setIsSwitchModalOpen(true);
                      }}
                      className="flex-1 py-3 bg-white/10 border border-white/10 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeftRight size={16} />
                      Switch
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  disabled
                  className="w-full py-4 bg-white/5 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 cursor-not-allowed border border-white/5"
                >
                  Empty Tray
                </button>
              )}
            </div>

          </div>
        </aside>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <TabletModals
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
        notificationHistory={notificationHistory}
        kotSlip={kotSlip}
        setKotSlip={setKotSlip}
        isQRModalOpen={isQRModalOpen}
        setIsQRModalOpen={setIsQRModalOpen}
        qrModalOrder={qrModalOrder}
        setQrModalOrder={setQrModalOrder}
        activeOrder={activeOrder}
        cartSubtotal={cartSubtotal}
        cartTax={cartTax}
        localDiscountAmount={localDiscountAmount}
        setLocalDiscountAmount={setLocalDiscountAmount}
        tablet={tablet}
        isSwitchModalOpen={isSwitchModalOpen}
        setIsSwitchModalOpen={setIsSwitchModalOpen}
        sourceTableForSwitch={sourceTableForSwitch}
        setSourceTableForSwitch={setSourceTableForSwitch}
        tables={tables}
        handleConfirmSwitchTable={handleConfirmSwitchTable}
        switchLoading={switchLoading}
      />
    </div>
  );
}
