'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Utensils, ShoppingCart, User, Table as TableIcon,
  CheckCircle, Clock, ChevronRight, Star,
  Menu, X, Search, Filter, ArrowLeft, Plus, Minus,
  ChefHat, ShoppingBag, Bell, CreditCard, ReceiptIndianRupee,
  Volume2, VolumeX, Smartphone, Zap, CarFront, UserPlus,
  ArrowLeftRight, QrCode, RefreshCw, Printer, AlertCircle
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
    barPosEnabled?: boolean;
    cafePosEnabled?: boolean;
  };
  table?: {
    id: string;
    name: string;
    qrToken: string | null;
  } | null;
  floorId?: string | null;
  showBar?: boolean;
  showCafe?: boolean;
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
  menuType?: string;
}

interface Category {
  id: string;
  name: string;
  menuType?: string;
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
  const [waiterCalls, setWaiterCalls] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [menuType, setMenuType] = useState<'RESTAURANT' | 'BAR' | 'CAFE'>('RESTAURANT');
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
  const [tableStatusAlerts, setTableStatusAlerts] = useState<Record<string, { message: string; type: 'ready' | 'kitchen' | 'settle' }>>({});
  const [activePopupNotification, setActivePopupNotification] = useState<{
    message: string;
    tableName: string;
    type: 'ready' | 'kitchen' | 'payment';
    time: string;
  } | null>(null);
  
  const [kotSlip, setKotSlip] = useState<KotSlipData | null>(null);
  const [targetOrderPrepTime, setTargetOrderPrepTime] = useState<number>(15);

  const categoryMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  const { addToast } = useToast();


  const handleDismissWaiterCall = async (notifId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notifId, status: 'READ' })
      });
      setWaiterCalls(prev => prev.filter(n => n.id !== notifId));
    } catch (e) {
      console.error('Failed to dismiss waiter call', e);
    }
  };

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
          fetch(`/api/drivers?tabletId=${id}`),
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
    if (selectedTableId && tables.length > 0) {
      const selectedTable = tables.find(t => t.id === selectedTableId);
      if (selectedTable?.floor?.menuType) {
        setMenuType(selectedTable.floor.menuType as 'RESTAURANT' | 'BAR' | 'CAFE');
      }
    }
  }, [selectedTableId, tables]);

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

  // Poll DB notifications (e.g. Call Waiter QR requests) and display alerts/bell center logs on the tablet POS
  useEffect(() => {
    const fetchDbNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?status=UNREAD');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const dbNotifs = json.data;
          
          setWaiterCalls(dbNotifs.filter((n: any) => n.type === 'ASSISTANCE'));

          dbNotifs.forEach((n: any) => {
            if (!processedNotifIdsRef.current.has(n.id)) {
              processedNotifIdsRef.current.add(n.id);
              
              // Only alert for Waiter Assistance, Bill requests, or Urgent/Payment notifications
              if (n.type === 'ASSISTANCE' || n.type === 'PAYMENT' || n.priority === 'URGENT') {
                // Parse table/room info from metadata if available
                let tableName = n.title;
                try {
                  const metadata = n.metadata ? JSON.parse(n.metadata) : {};
                  if (metadata.tableName) {
                    tableName = `Table ${metadata.tableName}`;
                  }
                } catch (e) {}

                // Play notification bell ding sound
                try {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
                  audio.volume = 0.45;
                  audio.play();
                } catch (audioErr) {}

                // Trigger floating slide-down popup banner
                let popupType: 'kitchen' | 'ready' | 'payment' = 'ready';
                if (n.type === 'PAYMENT') popupType = 'payment';

                setActivePopupNotification({
                  message: n.message,
                  tableName: tableName,
                  type: popupType,
                  time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                });

                // Add to notification history dropdown center
                setNotificationHistory(prev => {
                  if (prev.some(p => p.id === n.id)) return prev;
                  return [
                    { id: n.id, message: `${n.title}: ${n.message}`, timestamp: new Date(n.createdAt), type: 'success' },
                    ...prev.slice(0, 19)
                  ];
                });

                // Auto-dismiss the popup banner after 6 seconds
                setTimeout(() => {
                  setActivePopupNotification(null);
                }, 6000);
              }
            }
          });
        }
      } catch (err) {
        console.error('Failed to poll DB notifications:', err);
      }
    };

    fetchDbNotifications();
    const interval = setInterval(fetchDbNotifications, 7000); // Poll every 7s for high responsiveness
    return () => clearInterval(interval);
  }, []);

  const prevStatusesRef = useRef<Record<string, string>>({});
  const isFirstLoadRef = useRef(true);
  const processedNotifIdsRef = useRef<Set<string>>(new Set());

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
          // Set per-table alert badge
          if (order.restaurantTableId) {
            setTableStatusAlerts(prev => ({ ...prev, [order.restaurantTableId]: { message: 'READY TO SERVE!', type: 'ready' } }));
            setTimeout(() => setTableStatusAlerts(prev => { const n = { ...prev }; delete n[order.restaurantTableId]; return n; }), 6000);
          }
          // Trigger floating popup notification banner
          setActivePopupNotification({
            message: 'Order is READY to serve!',
            tableName,
            type: 'ready',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          // Play premium bell chime sound
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
            audio.volume = 0.5;
            audio.play();
          } catch (e) { }
        } else if (order.status === 'KOT_RUNNING' || order.status === 'IN_KITCHEN') {
          message = `${tableName}: Order is being prepared in kitchen.`;
          type = 'info';
          addToast('info', `🍳 ${message}`);
          if (order.restaurantTableId) {
            setTableStatusAlerts(prev => ({ ...prev, [order.restaurantTableId]: { message: 'IN KITCHEN', type: 'kitchen' } }));
            setTimeout(() => setTableStatusAlerts(prev => { const n = { ...prev }; delete n[order.restaurantTableId]; return n; }), 4000);
          }
          // Trigger floating popup notification banner
          setActivePopupNotification({
            message: 'Preparing in Kitchen...',
            tableName,
            type: 'kitchen',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          // Play premium bubble pop sound
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
            audio.volume = 0.45;
            audio.play();
          } catch (e) { }
        } else if (order.status === 'PAYMENT_AWAITING_APPROVAL') {
          message = `${tableName}: Awaiting payment approval.`;
          type = 'info';
          addToast('info', `💳 ${message}`);
          if (order.restaurantTableId) {
            setTableStatusAlerts(prev => ({ ...prev, [order.restaurantTableId]: { message: 'PAYMENT DUE', type: 'settle' } }));
            setTimeout(() => setTableStatusAlerts(prev => { const n = { ...prev }; delete n[order.restaurantTableId]; return n; }), 5000);
          }
          // Trigger floating popup notification banner
          setActivePopupNotification({
            message: 'Awaiting Payment Settlement',
            tableName,
            type: 'payment',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          // Play premium cash register sound
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav');
            audio.volume = 0.45;
            audio.play();
          } catch (e) { }
        }

        if (message) {
          setNotificationHistory(prev => [
            { id: `${order.id}-${Date.now()}`, message, timestamp: new Date(), type },
            ...prev.slice(0, 19)
          ]);
          // Automatically clear the popup banner after 5.5 seconds
          setTimeout(() => {
            setActivePopupNotification(prev => {
              if (prev && prev.tableName === tableName) return null;
              return prev;
            });
          }, 5500);
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

  const handlePlaceOrder = async (skipKitchen: boolean = false) => {
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
          guestId: selectedCustomer?.id || null,
          driverId: selectedDriver?.id || null,
          guestCount: pax,
          staffMemberId: tablet?.waiterId || null,
          items: cart.map(i => ({
            productId: i.id,
            quantity: i.quantity,
            unitPrice: i.sellingPrice,
            variantName: (i as any).size || (i as any).variantName || null
          })),
          paymentMode: paymentMode,
          transactionLast4: transactionLast4,
          skipKitchen
        })
      });

      const data = await res.json();
      if (data.success) {
        addToast('success', skipKitchen ? 'Order saved! Printing KOT...' : 'Order sent to kitchen!');
        setActiveOrder(data.data);
        setIsStatusVisible(true);
        setCart([]);
        
        if (skipKitchen) {
          // Immediately print the KOT if skipKitchen was requested
          handlePrintKOT(selectedTableId);
        }
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

  const showBarTab = useMemo(() => {
    return !!(property?.barPosEnabled && tablet?.showBar);
  }, [property, tablet]);

  const showCafeTab = useMemo(() => {
    return !!(property?.cafePosEnabled && tablet?.showCafe);
  }, [property, tablet]);

  const filteredProductsForMenuType = useMemo(() => {
    return products.filter(p => {
      if (menuType === 'BAR') return p.menuType === 'BAR';
      if (menuType === 'CAFE') return p.menuType === 'CAFE';
      return p.menuType === 'RESTAURANT' || !p.menuType || (p.menuType !== 'BAR' && p.menuType !== 'CAFE');
    });
  }, [products, menuType]);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => {
      if (menuType === 'BAR') return cat.menuType === 'BAR';
      if (menuType === 'CAFE') return cat.menuType === 'CAFE';
      return cat.menuType === 'RESTAURANT' || !cat.menuType || (cat.menuType !== 'BAR' && cat.menuType !== 'CAFE');
    });
  }, [categories, menuType]);

  const filteredProducts = useMemo(() => {
    return filteredProductsForMenuType.filter(p => {
      const matchesCategory = activeCategory === 'all' || p.categoryId === activeCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filteredProductsForMenuType, activeCategory, searchQuery]);

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

          {/* ── HEADER: Logo + Tablet Info + Inline Kitchen Status ── */}
          <header className="h-16 shrink-0 flex items-center px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-md gap-6 z-50">
            {/* Brand */}
            <div className="flex items-center gap-3 shrink-0">
              {displayLogo ? (
                <img src={displayLogo} alt="Logo" className="h-8 w-auto object-contain rounded-lg" />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <ChefHat size={16} className="text-white" />
                </div>
              )}
              <div className="leading-none">
                {!displayLogo && (
                  <h1 className="text-sm font-black tracking-tight uppercase">
                    {property?.brandName || property?.name || 'OrderMint'} <span className="text-indigo-500">POS</span>
                  </h1>
                )}
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">
                  {tablet.name} • WAITER STATION {waiter ? `(${waiter.name})` : ''}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-white/5 shrink-0" />

            {/* Live Kitchen Status — inline in header */}
            <div className="flex-1 flex items-center gap-2 overflow-hidden">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest shrink-0">Live Kitchen</span>
              </div>
              <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                {activeOrders.length === 0 ? (
                  <span className="text-[9px] text-slate-600 font-bold tracking-wide">All clear — no active orders</span>
                ) : (
                  activeOrders.map(order => {
                    const tableName = order.table?.name || `T${order.tableNo || '?'}`;
                    const isReady = order.status === 'READY';
                    const isAwaiting = order.status === 'PAYMENT_AWAITING_APPROVAL';
                    let statusLabel = 'In Kitchen';
                    let badgeColor = 'bg-amber-500/15 border-amber-500/30 text-amber-400';
                    let dotColor = 'bg-amber-400';
                    if (isReady) { statusLabel = 'Ready'; badgeColor = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'; dotColor = 'bg-emerald-400'; }
                    else if (isAwaiting) { statusLabel = 'Awaiting'; badgeColor = 'bg-blue-500/10 border-blue-500/20 text-blue-400'; dotColor = 'bg-blue-400'; }
                    return (
                      <div key={order.id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest shrink-0 ${badgeColor} ${isReady ? 'animate-pulse' : ''}`}>
                        <span className={`w-1 h-1 rounded-full ${dotColor}`} />
                        {tableName} • {statusLabel}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative w-9 h-9 bg-slate-800/80 hover:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all shrink-0"
            >
              <Bell size={16} />
              {notificationHistory.filter(n => n.type === 'success').length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse">
                  {notificationHistory.filter(n => n.type === 'success').length}
                </div>
              )}
            </button>
          </header>

          {/* ── SELECT STATION VIEW: Slim Nav + Full Table Grid ── */}
          {sessionStage === 'TABLE' && (
            <div className="flex-1 flex overflow-hidden relative">
              {/* ── LEFT NAV: Floor filter only ── */}
              <nav className="w-[72px] shrink-0 flex flex-col items-center py-4 gap-2 border-r border-white/[0.06] bg-slate-950/70">
                <button
                  onClick={() => setActiveFloorFilter('all')}
                  className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all text-center ${
                    activeFloorFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-[0_8px_20px_-4px_rgba(99,102,241,0.6)]'
                      : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                  }`}
                  title="All Floors"
                >
                  <span className="text-base leading-none">⊞</span>
                  <span className="text-[7px] font-black uppercase tracking-wide leading-none">All</span>
                </button>
                {Object.keys(tablesByFloor).map((floorName, i) => (
                  <button
                    key={floorName}
                    onClick={() => setActiveFloorFilter(floorName)}
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all text-center ${
                      activeFloorFilter === floorName
                        ? 'bg-indigo-600 text-white shadow-[0_8px_20px_-4px_rgba(99,102,241,0.6)]'
                        : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                    }`}
                    title={floorName}
                  >
                    <span className="text-base leading-none">{i === 0 ? '①' : i === 1 ? '②' : i === 2 ? '③' : '④'}</span>
                    <span className="text-[6px] font-black uppercase tracking-wide leading-none truncate w-10 text-center">{floorName.slice(0, 4)}</span>
                  </button>
                ))}
              </nav>

              {/* ── MAIN: Full table grid ── */}
              <main className="flex-1 overflow-y-auto no-scrollbar bg-[#0a0f1e] relative">
                {/* Subtle radial gradient bg */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.04)_0%,transparent_60%)] pointer-events-none" />

                <div className="relative z-10 p-6">
                  {/* Page title row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-white">Select Station</h2>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Tap to open · Single-tap occupied for actions</p>
                      </div>
                      
                      {/* Waiter Calls Alerts */}
                      {waiterCalls.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap ml-4">
                          {waiterCalls.map(call => {
                            let tableName = call.title;
                            try {
                              const meta = call.metadata ? JSON.parse(call.metadata) : {};
                              if (meta.tableName) tableName = meta.tableName;
                            } catch (e) {}

                            return (
                              <button
                                key={call.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDismissWaiterCall(call.id);
                                }}
                                className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-[0_0_10px_rgba(225,29,72,0.2)] animate-pulse"
                              >
                                <Bell size={12} className="shrink-0" />
                                <span>Table {tableName}</span>
                                <span className="ml-1 text-[8px] opacity-70 bg-rose-500/20 px-1.5 py-0.5 rounded-md">Dismiss</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-3">
                      {/* Late Alert Prep Time Setting */}
                      <div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 rounded-2xl px-3 py-1.5 shadow-md">
                        <Clock size={12} className="text-indigo-400 animate-pulse" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Prep Warning:</span>
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={targetOrderPrepTime}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setTargetOrderPrepTime(isNaN(val) ? 15 : val);
                          }}
                          className="w-12 h-6 bg-slate-950/80 border border-white/10 rounded-lg text-center text-[10px] font-black text-white outline-none focus:border-indigo-500/50"
                        />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">mins</span>
                      </div>

                      {activeOrders.length > 0 && (
                        <div className="flex items-center gap-2">
                          {activeOrders.filter(o => o.status === 'KOT_RUNNING' || o.status === 'IN_KITCHEN').length > 0 && (
                            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                              {activeOrders.filter(o => o.status === 'KOT_RUNNING' || o.status === 'IN_KITCHEN').length} In Kitchen
                            </div>
                          )}
                          {activeOrders.filter(o => o.status === 'READY').length > 0 && (
                            <div className="flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse">
                              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                              {activeOrders.filter(o => o.status === 'READY').length} Ready
                            </div>
                          )}
                          <div className="bg-white/5 border border-white/5 text-slate-400 px-3 py-1.5 rounded-xl text-[9px] font-black">
                            ₹{activeOrders.reduce((s, o) => s + (o.grandTotal || 0), 0).toFixed(0)} Live
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Table grids per floor */}
                  <div className="space-y-8">
                    {Object.entries(tablesByFloor)
                      .filter(([floorName]) => activeFloorFilter === 'all' || activeFloorFilter === floorName)
                      .map(([floorName, floorTables]) => (
                        <div key={floorName}>
                          {/* Floor label */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                              <span className="text-xs font-black uppercase tracking-widest text-slate-400">{floorName}</span>
                            </div>
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/10">
                              {floorTables.length} tables
                            </span>
                          </div>

                          {/* Premium table card grid */}
                          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3">
                            {floorTables.map(table => {
                              const tableActiveOrder = activeOrders.find(order => order.restaurantTableId === table.id);
                              const elapsedMins = tableActiveOrder?.createdAt
                                ? Math.floor((Date.now() - new Date(tableActiveOrder.createdAt).getTime()) / 60000)
                                : 0;

                              let tableStatus = (table as any).status || 'VACANT';
                              if (tableActiveOrder) {
                                tableStatus = tableActiveOrder.status === 'READY' ? 'READY'
                                  : (tableActiveOrder.status === 'PAYMENT_AWAITING_APPROVAL' || tableActiveOrder.status === 'BILL_PRINTED') ? 'BILL_PRINTED'
                                  : tableActiveOrder.status === 'SERVED' ? 'SERVED'
                                  : 'KOT_RUNNING';
                              }

                              const isOccupied = tableStatus !== 'VACANT';
                              const tableAlert = tableStatusAlerts[table.id];

                              // Style sets matching the mockup
                              let cardBg = 'bg-slate-900/60 hover:bg-slate-900/80';
                              let cardBorder = 'border-slate-800/80 hover:border-slate-700';
                              let cardGlow = 'shadow-md';
                              let statusLabel = 'VACANT';
                              let statusBg = 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400';
                              let statusDot = 'bg-emerald-400';

                              if (tableStatus === 'READY') {
                                cardBg = 'bg-[#0b161c] hover:bg-[#0f1f27]';
                                cardBorder = 'border-cyan-500';
                                cardGlow = 'shadow-[0_0_15px_rgba(6,182,212,0.35)]';
                                statusLabel = 'READY';
                                statusBg = 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400';
                                statusDot = 'bg-cyan-400';
                              } else if (tableStatus === 'BILL_PRINTED') {
                                cardBg = 'bg-[#0a1224] hover:bg-[#0e1a33]';
                                cardBorder = 'border-blue-500';
                                cardGlow = 'shadow-[0_0_15px_rgba(59,130,246,0.35)]';
                                statusLabel = 'PAY BILL';
                                statusBg = 'bg-blue-500/15 border border-blue-500/30 text-blue-400';
                                statusDot = 'bg-blue-400';
                              } else if (tableStatus === 'KOT_RUNNING') {
                                cardBg = 'bg-[#18110b] hover:bg-[#221810]';
                                cardBorder = 'border-orange-500';
                                cardGlow = 'shadow-[0_0_15px_rgba(249,115,22,0.35)]';
                                statusLabel = 'KITCHEN';
                                statusBg = 'bg-orange-500/15 border border-orange-500/30 text-orange-400';
                                statusDot = 'bg-orange-400';
                              } else if (tableStatus === 'SERVED') {
                                cardBg = 'bg-slate-900/60 hover:bg-slate-900/80';
                                cardBorder = 'border-slate-600';
                                cardGlow = 'shadow-md';
                                statusLabel = 'SERVED';
                                statusBg = 'bg-slate-500/15 border border-slate-500/30 text-slate-400';
                                statusDot = 'bg-slate-400';
                              } else if (tableStatus === 'OCCUPIED') {
                                cardBg = 'bg-[#1c0f0f] hover:bg-[#271515]';
                                cardBorder = 'border-rose-500';
                                cardGlow = 'shadow-[0_0_15px_rgba(244,63,94,0.35)]';
                                statusLabel = 'OCCUPIED';
                                statusBg = 'bg-rose-500/15 border border-rose-500/30 text-rose-450';
                                statusDot = 'bg-rose-550';
                              }

                              const isLate = isOccupied && tableActiveOrder && tableStatus === 'KOT_RUNNING' && elapsedMins >= ((tableActiveOrder as any).preparationTime || targetOrderPrepTime);

                              const readyPickupLimit = typeof window !== 'undefined' ? parseInt(localStorage.getItem('kds_ready_pickup_time') || '5', 10) : 5;
                              const readyWaitMin = tableActiveOrder?.updatedAt ? Math.floor((Date.now() - new Date(tableActiveOrder.updatedAt).getTime()) / 60000) : 0;
                              const isPickupLate = isOccupied && tableActiveOrder && tableStatus === 'READY' && readyPickupLimit > 0 && readyWaitMin >= readyPickupLimit;

                              if (isLate) {
                                cardBg = 'bg-black hover:bg-black/90';
                                cardBorder = 'border-rose-600 animate-blink-late';
                                cardGlow = 'shadow-[0_0_20px_rgba(225,29,72,0.5)]';
                                statusLabel = 'LATE KITCHEN';
                                statusBg = 'bg-rose-950/50 border border-rose-500/30 text-rose-400';
                                statusDot = 'bg-rose-550 animate-pulse';
                              } else if (isPickupLate) {
                                cardBg = 'bg-black hover:bg-black/90';
                                cardBorder = 'border-blue-500 animate-blink-ready';
                                cardGlow = 'shadow-[0_0_20px_rgba(59,130,246,0.5)]';
                                statusLabel = 'LATE PICKUP';
                                statusBg = 'bg-blue-950/50 border border-blue-500/30 text-blue-400';
                                statusDot = 'bg-blue-550 animate-pulse';
                              }

                              return (
                                <div className="relative" key={table.id}>
                                  {/* Status-change popup badge */}
                                  {tableAlert && (
                                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest whitespace-nowrap shadow-2xl border animate-bounce ${
                                      tableAlert.type === 'ready' ? 'bg-teal-500 text-white border-teal-300/50 shadow-teal-500/40'
                                      : tableAlert.type === 'kitchen' ? 'bg-orange-500 text-white border-orange-300/50 shadow-orange-500/40'
                                      : 'bg-blue-500 text-white border-blue-300/50 shadow-blue-500/40'
                                    }`}>
                                      <span>{tableAlert.type === 'ready' ? '🔔' : tableAlert.type === 'kitchen' ? '🍳' : '💳'}</span>
                                      {tableAlert.message}
                                    </div>
                                  )}

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
                                      setSessionStage(isOccupied ? 'MENU' : 'PAX');
                                    }}
                                    className={`w-full aspect-square rounded-2xl border ${cardBorder} ${cardBg} ${cardGlow} flex flex-col items-center justify-between p-3 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] active:scale-[0.97] group relative overflow-hidden`}
                                  >
                                    {/* Top: Name */}
                                    <div className="w-full flex items-center justify-center pt-1">
                                      <span className="text-base font-black text-white uppercase tracking-tight">{table.name}</span>
                                    </div>

                                    {/* Middle: Icon or Guest Details */}
                                    <div className="flex-1 flex items-center justify-center py-2 w-full">
                                      {isOccupied ? (
                                        tableStatus === 'BILL_PRINTED' ? (
                                          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                            <ReceiptIndianRupee size={15} />
                                          </div>
                                        ) : (
                                          <div className="flex flex-col items-center gap-1 max-w-full">
                                            {tableActiveOrder?.guest ? (
                                              <div className="flex items-center justify-center gap-1 px-2.5 py-1 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-300 uppercase tracking-wider max-w-full">
                                                <User size={10} className="text-slate-500 shrink-0" />
                                                <span className="truncate max-w-[60px]">{tableActiveOrder.guest.firstName}</span>
                                              </div>
                                            ) : tableActiveOrder?.guestCount ? (
                                              <div className="flex items-center justify-center gap-1 px-2.5 py-1 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-300 uppercase tracking-wider">
                                                <User size={10} className="text-slate-500 shrink-0" />
                                                <span>{tableActiveOrder.guestCount} Pax</span>
                                              </div>
                                            ) : (
                                              <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-slate-500">
                                                <User size={12} />
                                              </div>
                                            )}
                                            {/* Elapsed prep time */}
                                            {tableActiveOrder && (
                                              <div className="flex items-center gap-1 mt-0.5 text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                                                <Clock size={10} className={isLate ? "text-rose-500 animate-pulse" : "text-slate-500"} />
                                                <span className={isLate ? "text-rose-400 font-black animate-pulse" : "text-slate-500"}>
                                                  {elapsedMins} mins
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        )
                                      ) : (
                                        <div className="transition-transform group-hover:scale-110 duration-200">
                                          <TableIcon size={24} className="text-slate-600/80" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Bottom: status pill */}
                                    <div className="w-full">
                                      {isOccupied && tableActiveOrder?.grandTotal ? (
                                        <div className={`w-full rounded-xl py-1 px-1.5 flex items-center justify-center gap-1 border font-black text-[8px] uppercase tracking-widest ${statusBg}`}>
                                          <span className={`w-1 h-1 rounded-full shrink-0 ${statusDot} ${tableStatus === 'READY' ? 'animate-pulse' : ''}`} />
                                          <span className="truncate">{statusLabel} ₹{tableActiveOrder.grandTotal.toFixed(0)}</span>
                                        </div>
                                      ) : (
                                        <div className={`w-full rounded-xl py-1 text-center border font-black text-[8px] uppercase tracking-widest ${statusBg}`}>
                                          {statusLabel}
                                        </div>
                                      )}
                                    </div>
                                  </button>

                                  {activeTableActionId === table.id && (
                                    <div 
                                      className="fixed inset-0 z-[90] bg-transparent cursor-default" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTableActionId(null);
                                      }}
                                    />
                                  )}

                                  <AnimatePresence>
                                    {activeTableActionId === table.id && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                        className="absolute top-[105%] left-1/2 -translate-x-1/2 z-[100] w-[200px] bg-slate-900/98 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-3 flex flex-col gap-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="text-center pb-2 border-b border-white/5">
                                          <p className="text-xs font-black text-white">{table.name}</p>
                                          {tableActiveOrder?.grandTotal && <p className="text-[9px] text-slate-400">₹{tableActiveOrder.grandTotal.toFixed(0)}</p>}
                                        </div>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setSelectedTableId(table.id); setSessionStage('MENU'); setActiveTableActionId(null); }}
                                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                          <TableIcon size={12} /> Add Items
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); const order = activeOrders.find(o => o.restaurantTableId === table.id); setQrModalOrder(order || null); setIsQRModalOpen(true); setActiveTableActionId(null); }}
                                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                          <ReceiptIndianRupee size={12} /> Pay Bill
                                        </button>
                                        <div className="flex gap-2">
                                          <button onClick={(e) => { e.stopPropagation(); handlePrintKOT(table.id); setActiveTableActionId(null); }} className="flex-1 py-2 bg-white/5 border border-white/5 text-slate-300 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-1">
                                            <Printer size={11} /> KOT
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); setSourceTableForSwitch(table); setIsSwitchModalOpen(true); setActiveTableActionId(null); }} className="flex-1 py-2 bg-white/5 border border-white/5 text-slate-300 rounded-xl font-black text-[8px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-1">
                                            <ArrowLeftRight size={11} /> Move
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
              </main>
            </div>
          )}

          {/* ── SERVICE DETAILS (PAX STAGE): Clean dedicated full-screen page ── */}
          {sessionStage === 'PAX' && (
            <div className="w-full flex-1 flex flex-col animate-in fade-in zoom-in duration-500 relative py-6 px-6 gap-5 overflow-hidden">
              {/* Ambient glow */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[700px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px]" />
              </div>

              {/* Title row with beautiful glass navigation back button */}
              <div className="flex items-center gap-4 relative z-10 w-full mb-2">
                <button
                  onClick={() => setSessionStage('TABLE')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/40 shrink-0"
                >
                  <ArrowLeft size={13} className="text-indigo-400" />
                  Back to Tables
                </button>
                <div className="flex-1 text-center pr-[120px]">
                  <h2 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent mb-1">Service Details</h2>
                  <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[9px]">Link guest & driver, then set number of covers</p>
                </div>
              </div>

              {/* ── TWO COLUMN LAYOUT ── */}
              <div className="flex-1 grid grid-cols-2 gap-5 relative z-10 min-h-0">

                {/* ─── LEFT: GUEST PANEL ─── */}
                <div className="flex flex-col bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
                  {/* Panel Header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-gradient-to-r from-indigo-600/10 to-transparent shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-0.5">Guest Panel</p>
                      <p className="text-sm font-black text-white uppercase tracking-tight">Link Customer</p>
                    </div>
                    {selectedCustomer && (
                      <span className="ml-auto text-[8px] font-black bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-500/20 uppercase tracking-wider">
                        ✓ Linked
                      </span>
                    )}
                  </div>

                  <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                    {isCustomerModalOpen ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                            <UserPlus size={13} /> New Guest Registration
                          </h3>
                          <button onClick={() => setIsCustomerModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X size={14} /></button>
                        </div>
                        <CustomerForm
                          onSubmit={async (data) => {
                            try {
                              const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, tabletId: id }) });
                              const result = await res.json();
                              if (result.success) { setCustomers(prev => [...prev, result.data]); setSelectedCustomer(result.data); setIsCustomerModalOpen(false); addToast('success', 'Guest registered'); }
                              else { addToast('error', result.message || 'Failed to register'); }
                            } catch (e) { addToast('error', 'Network error'); }
                          }}
                          onCancel={() => setIsCustomerModalOpen(false)}
                        />
                      </div>
                    ) : selectedCustomer ? (
                      <div className="flex-1 flex flex-col gap-4">
                        <div className="bg-slate-950/60 border border-indigo-500/30 rounded-2xl p-5 flex items-center gap-4 shadow-inner">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0"><User size={24} className="text-white" /></div>
                          <div className="min-w-0">
                            <p className="text-base font-black text-white uppercase tracking-tight truncate">{selectedCustomer.firstName} {selectedCustomer.lastName || ''}</p>
                            <p className="text-[10px] text-indigo-400 font-black tracking-wider mt-0.5">{selectedCustomer.mobile || 'No Mobile'}</p>
                            {selectedCustomer.email && <p className="text-[9px] text-slate-500 font-bold truncate">{selectedCustomer.email}</p>}
                            <span className="mt-2 inline-block text-[8px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">{selectedCustomer.loyaltyPoints || 0} pts</span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedCustomer(null)} className="w-full py-3 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-300 transition-all">Remove &amp; Search Again</button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={15} />
                          <input type="text" placeholder="Search by name or mobile..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full h-12 bg-slate-950/80 border border-white/10 rounded-xl pl-11 pr-11 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
                          <button onClick={() => setIsCustomerModalOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all" title="Add New Guest"><UserPlus size={13} /></button>
                        </div>
                        {customerSearch ? (
                          <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-950/60 rounded-2xl border border-white/5 divide-y divide-white/5 max-h-[280px]">
                            {customers.filter(c => c.firstName.toLowerCase().includes(customerSearch.toLowerCase()) || c.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) || c.mobile?.includes(customerSearch)).length === 0 ? (
                              <div className="py-8 text-center"><p className="text-slate-500 text-xs font-bold">No guests found</p><button onClick={() => setIsCustomerModalOpen(true)} className="mt-3 text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300">+ Register New Guest</button></div>
                            ) : (
                              customers.filter(c => c.firstName.toLowerCase().includes(customerSearch.toLowerCase()) || c.lastName?.toLowerCase().includes(customerSearch.toLowerCase()) || c.mobile?.includes(customerSearch)).map(c => (
                                <button key={c.id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }} className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-indigo-500/10 transition-colors text-left group">
                                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0"><User size={14} /></div>
                                  <div className="min-w-0"><p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors truncate">{c.firstName} {c.lastName || ''}</p><p className="text-[9px] text-indigo-400 font-black tracking-wider">{c.mobile || 'No Mobile'}</p></div>
                                  <ChevronRight size={14} className="ml-auto text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                                </button>
                              ))
                            )}
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-600"><User size={28} /></div>
                            <div className="text-center"><p className="text-xs font-black text-slate-500 uppercase tracking-wider">Optional</p><p className="text-[10px] text-slate-600 font-bold mt-0.5">Search above to link a guest</p></div>
                            <button onClick={() => setIsCustomerModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600/30 transition-all"><UserPlus size={12} />Register New Guest</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── RIGHT: DRIVER + PAX ─── */}
                <div className="flex flex-col gap-5">
                  <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-gradient-to-r from-amber-600/10 to-transparent shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400"><CarFront size={16} /></div>
                      <div><p className="text-[9px] font-black text-amber-400 uppercase tracking-widest leading-none mb-0.5">Driver Panel</p><p className="text-sm font-black text-white uppercase tracking-tight">Assign Driver</p></div>
                      {selectedDriver && <span className="ml-auto text-[8px] font-black bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">✓ Assigned</span>}
                    </div>
                    <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                      {selectedDriver ? (
                        <div className="flex flex-col gap-4">
                          <div className="bg-slate-950/60 border border-amber-500/30 rounded-2xl p-5 flex items-center gap-4 shadow-inner">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0"><CarFront size={24} className="text-white" /></div>
                            <div className="min-w-0">
                              <p className="text-base font-black text-white uppercase tracking-tight truncate">{selectedDriver.name}</p>
                              <p className="text-[10px] text-amber-400 font-black tracking-wider mt-0.5">{selectedDriver.phone || 'No Phone'}</p>
                              <span className="mt-2 inline-block text-[8px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Delivery Order</span>
                            </div>
                          </div>
                          <button onClick={() => setSelectedDriver(null)} className="w-full py-3 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/40 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-300 transition-all">Remove &amp; Search Again</button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 flex-1">
                          <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors" size={15} />
                            <input type="text" placeholder="Search driver name or phone..." value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} className="w-full h-12 bg-slate-950/80 border border-white/10 rounded-xl pl-11 pr-4 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all" />
                          </div>
                          {driverSearch ? (
                            <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-950/60 rounded-2xl border border-white/5 divide-y divide-white/5 max-h-[200px]">
                              {drivers.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()) || d.phone?.includes(driverSearch)).length === 0 ? (
                                <div className="py-8 text-center"><p className="text-slate-500 text-xs font-bold">No drivers found</p></div>
                              ) : (
                                drivers.filter(d => d.name.toLowerCase().includes(driverSearch.toLowerCase()) || d.phone?.includes(driverSearch)).map(d => (
                                  <button key={d.id} onClick={() => { setSelectedDriver(d); setDriverSearch(''); }} className="w-full px-5 py-3.5 flex items-center gap-3 hover:bg-amber-500/10 transition-colors text-left group">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0"><CarFront size={14} /></div>
                                    <div className="min-w-0"><p className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">{d.name}</p><p className="text-[9px] text-amber-400 font-black tracking-wider">{d.phone || 'No Phone'}</p></div>
                                    <ChevronRight size={14} className="ml-auto text-slate-600 group-hover:text-amber-400 transition-colors shrink-0" />
                                  </button>
                                ))
                              )}
                            </div>
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center gap-3 py-4">
                              <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-600"><CarFront size={28} /></div>
                              <div className="text-center"><p className="text-xs font-black text-slate-500 uppercase tracking-wider">Optional</p><p className="text-[10px] text-slate-600 font-bold mt-0.5">Only for delivery orders</p></div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PAX Counter */}
                  <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)] p-5 shrink-0">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] text-center mb-4">Number of Covers (PAX)</p>
                    <div className="flex items-center justify-between bg-slate-950/80 border border-white/10 rounded-2xl p-2 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                      <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-12 h-12 shrink-0 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 z-10"><Minus size={18} /></button>
                      <div className="flex-1 flex flex-col items-center justify-center z-10">
                        <span className="text-[3.5rem] font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] leading-none">{pax}</span>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-0.5">GUESTS</span>
                      </div>
                      <button onClick={() => setPax(pax + 1)} className="w-12 h-12 shrink-0 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-indigo-500 hover:text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all hover:scale-105 active:scale-95 z-10"><Plus size={18} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-4 w-full shrink-0 z-10">
                <button
                  onClick={() => setSessionStage('TABLE')}
                  className="flex-1 h-16 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-2xl font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2 text-xs shadow-lg shadow-black/40"
                >
                  <ArrowLeft size={14} className="text-indigo-400" />
                  Back
                </button>
                <button
                  onClick={() => setSessionStage('MENU')}
                  className="flex-[3] h-16 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_-10px_rgba(79,70,229,0.7)] hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.9)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-3 group relative overflow-hidden text-base border border-indigo-400/30"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-in-out" />
                  <span className="relative z-10 text-white drop-shadow-md">Confirm &amp; Start Session</span>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center relative z-10 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                    <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              </div>
            </div>
          )}

      <TabletModals
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
        notificationHistory={notificationHistory}
        setNotificationHistory={setNotificationHistory}
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

      {/* Floating status alert popup */}
      <AnimatePresence>
        {activePopupNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-auto flex items-center gap-4 bg-slate-900/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl px-5 py-3 rounded-2xl max-w-[380px] w-[90vw] overflow-hidden"
          >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
              activePopupNotification.type === 'ready' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' :
              activePopupNotification.type === 'kitchen' ? 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]' :
              'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]'
            }`} />

            {/* Left side status icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              activePopupNotification.type === 'ready' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
              activePopupNotification.type === 'kitchen' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
              'bg-blue-500/15 text-blue-400 border border-blue-500/20'
            }`}>
              {activePopupNotification.type === 'ready' && <Bell size={18} className="animate-bounce" />}
              {activePopupNotification.type === 'kitchen' && <ChefHat size={18} className="animate-pulse" />}
              {activePopupNotification.type === 'payment' && <ReceiptIndianRupee size={18} className="animate-pulse" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[10px] font-black text-white uppercase tracking-wider truncate">{activePopupNotification.tableName}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase shrink-0">{activePopupNotification.time}</span>
              </div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${
                activePopupNotification.type === 'ready' ? 'text-emerald-400' :
                activePopupNotification.type === 'kitchen' ? 'text-orange-400' :
                'text-blue-400'
              }`}>{activePopupNotification.message}</p>
            </div>

            {/* Dismiss Close Icon */}
            <button 
              onClick={() => setActivePopupNotification(null)}
              className="text-slate-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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

              const elapsedMins = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
              const limit = order.preparationTime || 15;
              const isLate = (order.status === 'KOT_RUNNING' || order.status === 'IN_KITCHEN') && elapsedMins >= limit;

              const readyPickupLimit = typeof window !== 'undefined' ? parseInt(localStorage.getItem('kds_ready_pickup_time') || '5', 10) : 5;
              const readyWaitMin = order.updatedAt ? Math.floor((Date.now() - new Date(order.updatedAt).getTime()) / 60000) : 0;
              const isPickupLate = isReady && readyPickupLimit > 0 && readyWaitMin >= readyPickupLimit;

              let statusLabel = 'In Kitchen';
              let badgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
              let pulseClass = '';

              if (isLate) {
                statusLabel = 'Late Kitchen';
                badgeColor = 'bg-rose-500/20 border-rose-500/30 text-rose-400';
                pulseClass = 'animate-pulse';
              } else if (isPickupLate) {
                statusLabel = 'Late Pickup';
                badgeColor = 'bg-blue-500/20 border-blue-500/30 text-blue-400';
                pulseClass = 'animate-pulse';
              } else if (isReady) {
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

      {/* Menu Switcher (Restaurant / Bar / Cafe) */}
      {(showBarTab || showCafeTab) && (
        <div className="h-12 shrink-0 bg-slate-950/80 border-b border-white/5 flex items-center justify-center px-6 gap-2">
          <button
            onClick={() => { setMenuType('RESTAURANT'); setActiveCategory('all'); }}
            className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${menuType === 'RESTAURANT' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
          >
            🍽️ Restaurant
          </button>
          {showBarTab && (
            <button
              onClick={() => { setMenuType('BAR'); setActiveCategory('all'); }}
              className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${menuType === 'BAR' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              🍺 Bar
            </button>
          )}
          {showCafeTab && (
            <button
              onClick={() => { setMenuType('CAFE'); setActiveCategory('all'); }}
              className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${menuType === 'CAFE' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              ☕ Cafe
            </button>
          )}
        </div>
      )}

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
              <span className="text-[8px] font-bold opacity-60 mt-0.5">{filteredProductsForMenuType.length} Items</span>
            </button>

            {filteredCategories.map((cat, idx) => {
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

            {/* Late Warning Banner */}
            {activeOrder && (() => {
              const elapsedMins = Math.floor((Date.now() - new Date(activeOrder.createdAt).getTime()) / 60000);
              const limit = (activeOrder as any).preparationTime || 15;
              const isLate = (activeOrder.status === 'KOT_RUNNING' || activeOrder.status === 'IN_KITCHEN') && elapsedMins >= limit;

              const readyPickupLimit = typeof window !== 'undefined' ? parseInt(localStorage.getItem('kds_ready_pickup_time') || '5', 10) : 5;
              const readyWaitMin = (activeOrder as any).updatedAt ? Math.floor((Date.now() - new Date((activeOrder as any).updatedAt).getTime()) / 60000) : 0;
              const isPickupLate = activeOrder.status === 'READY' && readyPickupLimit > 0 && readyWaitMin >= readyPickupLimit;

              if (isLate) {
                return (
                  <div className="w-full py-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center justify-center gap-2 text-rose-400 animate-pulse mt-4">
                    <AlertCircle size={16} />
                    <span className="text-[11px] font-black uppercase tracking-widest">Late In Kitchen</span>
                  </div>
                );
              }
              if (isPickupLate) {
                return (
                  <div className="w-full py-2.5 bg-blue-500/20 border border-blue-500/40 rounded-xl flex items-center justify-center gap-2 text-blue-400 animate-pulse mt-4">
                    <Clock size={16} />
                    <span className="text-[11px] font-black uppercase tracking-widest">Late For Ready To Serve</span>
                  </div>
                );
              }
              return null;
            })()}
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
                  <div key={(item as any).cartItemId || item.id} className="bg-slate-800/40 rounded-xl p-2 flex flex-col gap-1.5 animate-in slide-in-from-right-2 duration-300 border border-white/5">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center shrink-0 border border-white/5 shadow-inner">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Utensils size={14} className="text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[9px] font-black uppercase tracking-tight text-white/90 truncate leading-tight mb-0.5">{item.name}</h4>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-indigo-400">₹{item.sellingPrice * item.quantity}</span>
                            <span className="text-[7px] font-bold text-slate-500 uppercase">/ ₹{item.sellingPrice}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/5">
                            <button onClick={() => updateQuantity((item as any).cartItemId || item.id, -1)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-400 transition-all text-slate-400"><Minus size={10} /></button>
                            <span className="text-[10px] font-black w-3 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity((item as any).cartItemId || item.id, 1)} className="w-5 h-5 rounded flex items-center justify-center hover:bg-indigo-500/20 hover:text-indigo-400 transition-all text-slate-400"><Plus size={10} /></button>
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
                <div className="flex gap-2">
                  <button
                    disabled={isPlacingOrder}
                    onClick={() => handlePlaceOrder(true)}
                    className="flex-1 py-4 bg-slate-700 border border-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-600 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 text-slate-200"
                  >
                    <Printer size={16} />
                    {isPlacingOrder ? '...' : 'Print KOT'}
                  </button>
                  <button
                    disabled={isPlacingOrder}
                    onClick={() => handlePlaceOrder(false)}
                    className="flex-1 py-4 bg-emerald-600 border border-emerald-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 text-white"
                  >
                    <Utensils size={16} />
                    {isPlacingOrder ? '...' : 'Send to Kitchen'}
                  </button>
                </div>
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
        
        @keyframes blink-late-glow {
          0%, 100% {
            border-color: rgba(225, 29, 72, 0.4);
            box-shadow: 0 0 10px rgba(225, 29, 72, 0.2);
            opacity: 0.9;
          }
          50% {
            border-color: rgba(244, 63, 94, 1);
            box-shadow: 0 0 25px rgba(244, 63, 94, 0.8), inset 0 0 10px rgba(244, 63, 94, 0.3);
            opacity: 1;
          }
        }
        
        .animate-blink-late {
          animation: blink-late-glow 1.2s infinite ease-in-out;
        }
      `}</style>

      <TabletModals
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
        notificationHistory={notificationHistory}
        setNotificationHistory={setNotificationHistory}
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

      {/* Floating status alert popup */}
      <AnimatePresence>
        {activePopupNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-auto flex items-center gap-4 bg-slate-900/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl px-5 py-3 rounded-2xl max-w-[380px] w-[90vw] overflow-hidden"
          >
            {/* Left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
              activePopupNotification.type === 'ready' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' :
              activePopupNotification.type === 'kitchen' ? 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]' :
              'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]'
            }`} />

            {/* Left side status icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              activePopupNotification.type === 'ready' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
              activePopupNotification.type === 'kitchen' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20' :
              'bg-blue-500/15 text-blue-400 border border-blue-500/20'
            }`}>
              {activePopupNotification.type === 'ready' && <Bell size={18} className="animate-bounce" />}
              {activePopupNotification.type === 'kitchen' && <ChefHat size={18} className="animate-pulse" />}
              {activePopupNotification.type === 'payment' && <ReceiptIndianRupee size={18} className="animate-pulse" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[10px] font-black text-white uppercase tracking-wider truncate">{activePopupNotification.tableName}</span>
                <span className="text-[8px] font-bold text-slate-500 uppercase shrink-0">{activePopupNotification.time}</span>
              </div>
              <p className={`text-[9px] font-black uppercase tracking-widest ${
                activePopupNotification.type === 'ready' ? 'text-emerald-400' :
                activePopupNotification.type === 'kitchen' ? 'text-orange-400' :
                'text-blue-400'
              }`}>{activePopupNotification.message}</p>
            </div>

            {/* Dismiss Close Icon */}
            <button 
              onClick={() => setActivePopupNotification(null)}
              className="text-slate-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
