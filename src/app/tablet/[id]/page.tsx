'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Utensils, ShoppingCart, User, Table as TableIcon,
  CheckCircle, Clock, ChevronRight, Star,
  Menu, X, Search, Filter, ArrowLeft, Plus, Minus,
  ChefHat, ShoppingBag, Bell, CreditCard, ReceiptIndianRupee,
  Volume2, VolumeX, Smartphone, Zap, CarFront, UserPlus,
  ArrowLeftRight, QrCode, RefreshCw, Printer, AlertCircle,
  CheckCircle2, Save, Pause, ArrowRight, Home,
  Wine, FlaskConical, Droplets
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CustomerForm } from '@/components/forms/customer-form';
import { SwitchTableModal } from '@/components/tables/SwitchTableModal';
import { KotSlipModal, KotSlipData } from '@/components/kots/KotSlipModal';
import { BillModal, BillData } from '@/components/billing/BillModal';
import { paymentModesApi, PaymentMode } from '@/lib/api/payment-modes';
import TabletModals from '@/components/tablet/TabletModals';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { CafeProductCard } from '@/components/tablet/CafeProductCard';
import { BarProductCard } from '@/components/tablet/BarProductCard';
import { BarVariantModal } from '@/components/tablet/BarVariantModal';
import { RestaurantProductCard } from '@/components/tablet/RestaurantProductCard';
import { LiveKitchenTicker } from '@/components/tablet/LiveKitchenTicker';
import { TabletHeader } from '@/components/tablet/TabletHeader';
import { TabletCategoryBar } from '@/components/tablet/TabletCategoryBar';
import { TabletOrderTray } from '@/components/tablet/TabletOrderTray';
import { TabletTableGrid } from '@/components/tablet/TabletTableGrid';

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
    logoUrl?: string | null;
    barPosEnabled?: boolean;
    cafePosEnabled?: boolean;
    brandName?: string;
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
  taxRate?: number;
  taxType?: string;
}

interface Category {
  id: string;
  name: string;
  menuType?: string;
}

interface CartItem extends Product {
  quantity: number;
  cartItemId?: string;
  size?: string;
}

interface Order {
  id: string;
  orderNo: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  membershipDiscount?: number;
  manualDiscount?: number;
  membershipCard?: any;
  grandTotal: number;
  createdAt: string;
  tableNo?: string;
  driverId?: string;
  staffMemberId?: string;
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

// Jewel-tone accent palette for Bar POS
const BAR_ACCENTS = [
  { color: '#E8A838', bg: 'rgba(232,168,56,0.10)', border: 'rgba(232,168,56,0.22)', glow: 'rgba(232,168,56,0.16)' },
  { color: '#7C6DFA', bg: 'rgba(124,109,250,0.10)', border: 'rgba(124,109,250,0.22)', glow: 'rgba(124,109,250,0.16)' },
  { color: '#3DBFA8', bg: 'rgba(61,191,168,0.10)', border: 'rgba(61,191,168,0.22)', glow: 'rgba(61,191,168,0.16)' },
  { color: '#E8607A', bg: 'rgba(232,96,122,0.10)', border: 'rgba(232,96,122,0.22)', glow: 'rgba(232,96,122,0.16)' },
  { color: '#54C4F0', bg: 'rgba(84,196,240,0.10)', border: 'rgba(84,196,240,0.22)', glow: 'rgba(84,196,240,0.16)' },
  { color: '#B87FE8', bg: 'rgba(184,127,232,0.10)', border: 'rgba(184,127,232,0.22)', glow: 'rgba(184,127,232,0.16)' },
  { color: '#5ED4A0', bg: 'rgba(94,212,160,0.10)', border: 'rgba(94,212,160,0.22)', glow: 'rgba(94,212,160,0.16)' },
  { color: '#F0934C', bg: 'rgba(240,147,76,0.10)', border: 'rgba(240,147,76,0.22)', glow: 'rgba(240,147,76,0.16)' },
];

const BAR_WMOJI: Record<string, string> = {
  premium: '⭐', wine: '🍷', beer: '🍺', whisky: '🥃', whiskey: '🥃',
  rum: '🥤', scotch: '🥃', vodka: '🍸', gin: '🍹', liquor: '🥃',
  champagne: '🍾', cocktail: '🍹', default: '🍷',
};

const BAR_CAT_ICON_MAP: Record<string, string> = {
  premium: '⭐', wine: '🍷', beer: '🍺', whisky: '🥃', whiskey: '🥃',
  rum: '🥤', scotch: '🥃', vodka: '🍸', gin: '🍹', brandy: '🥂',
  tequila: '🌵', cocktail: '🍹', mocktail: '🧃', soft: '🥤', juice: '🍊',
  liquor: '🥃', spirits: '🥃', champagne: '🍾', cider: '🍺', bourbon: '🥃', absinthe: '🍸',
};

// Cafe Layout Constants
const CAFE_ACCENTS = [
  { color: '#D4956A', bg: 'rgba(212,149,106,0.10)', border: 'rgba(212,149,106,0.22)', glow: 'rgba(212,149,106,0.14)' },
  { color: '#C8845A', bg: 'rgba(200,132,90,0.10)',  border: 'rgba(200,132,90,0.22)',  glow: 'rgba(200,132,90,0.14)'  },
  { color: '#7FC8C0', bg: 'rgba(127,200,192,0.10)', border: 'rgba(127,200,192,0.22)', glow: 'rgba(127,200,192,0.14)' },
  { color: '#E8AC6A', bg: 'rgba(232,172,106,0.10)', border: 'rgba(232,172,106,0.22)', glow: 'rgba(232,172,106,0.14)' },
  { color: '#B890E0', bg: 'rgba(184,144,224,0.10)', border: 'rgba(184,144,224,0.22)', glow: 'rgba(184,144,224,0.14)' },
  { color: '#7CC8A0', bg: 'rgba(124,200,160,0.10)', border: 'rgba(124,200,160,0.22)', glow: 'rgba(124,200,160,0.14)' },
  { color: '#E87A8C', bg: 'rgba(232,122,140,0.10)', border: 'rgba(232,122,140,0.22)', glow: 'rgba(232,122,140,0.14)' },
  { color: '#54B8D8', bg: 'rgba(84,184,216,0.10)',  border: 'rgba(84,184,216,0.22)',  glow: 'rgba(84,184,216,0.14)'  },
];

const POPULAR_KEYWORDS = ['latte', 'cappuccino', 'cold brew', 'frappe', 'espresso', 'chai', 'mocha'];
const isPopular = (name: string) => {
  const n = name.toLowerCase();
  return POPULAR_KEYWORDS.some(k => n.includes(k));
};

export default function TabletPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [tablet, setTablet] = useState<TabletConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [property, setProperty] = useState<any>(null);
  const filteredTables = useMemo(() => {
    return tables.filter(table => {
      const floorMenuType = table.floor?.menuType;
      if (floorMenuType === 'BAR' && property?.barPosEnabled === false) return false;
      if (floorMenuType === 'CAFE' && property?.cafePosEnabled === false) return false;
      return true;
    });
  }, [tables, property]);

  const tablesByFloor = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredTables.forEach(table => {
      const floorName = table.floor?.name || 'Main Hall';
      if (!groups[floorName]) {
        groups[floorName] = [];
      }
      groups[floorName].push(table);
    });
    return groups;
  }, [filteredTables]);
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
  const [tabletThemeMode, setTabletThemeMode] = useState<'unified' | 'split'>('unified');
  const [tabletUnifiedTheme, setTabletUnifiedTheme] = useState<string>('RESTAURANT');
  const [tabletRestaurantTheme, setTabletRestaurantTheme] = useState<string>('RESTAURANT');
  const [tabletBarTheme, setTabletBarTheme] = useState<string>('BAR');
  const [tabletCafeTheme, setTabletCafeTheme] = useState<string>('TABLET_CAFE');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrderComplimentary, setIsOrderComplimentary] = useState(false);
  const [isOrderPaid, setIsOrderPaid] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showTableSelector, setShowTableSelector] = useState(false);
  
  // Settlement Flow State
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [isProforma, setIsProforma] = useState(false);
  const [settleLoading, setSettleLoading] = useState(false);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);

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
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);

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
      const floorName = latestKot.table?.floor?.name || order.table?.floor?.name || table?.floor?.name;
      const floorMenuType = latestKot.table?.floor?.menuType || order.table?.floor?.menuType || table?.floor?.menuType;
      setKotSlip({
        kotNo: latestKot.kotNo,
        orderNo: order.orderNo,
        tableNo: table?.name || order.tableNo || '',
        roomId: order.roomId || undefined,
        orderType: order.orderType,
        createdAt: latestKot.createdAt,
        items: allItems,
        floorName,
        floorMenuType
      });
    } catch (err) {
      console.error('Failed to fetch print data:', err);
      addToast('error', 'Failed to fetch print data');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tabRes, dataRes, custRes, drivRes, paymentModesRes] = await Promise.all([
          fetch(`/api/tablets/${id}`),
          fetch(`/api/tablets/${id}/data`),
          fetch(`/api/customers?tabletId=${id}`),
          fetch(`/api/drivers?tabletId=${id}`),
          paymentModesApi.list(),
        ]);

        const tabData = await tabRes.json();
        const data = await dataRes.json();
        const custData = await custRes.json();
        const drivData = await drivRes.json();
        setPaymentModes(paymentModesRes || []);

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
    if (property?.code) {
      const code = property.code.toLowerCase();
      const mode = localStorage.getItem(`pos_layout_tablet_mode_${code}`) as 'unified' | 'split' | null;
      const unified = localStorage.getItem(`pos_layout_tablet_${code}`);
      const rest = localStorage.getItem(`pos_layout_tablet_restaurant_${code}`);
      const bar = localStorage.getItem(`pos_layout_tablet_bar_${code}`);
      const cafe = localStorage.getItem(`pos_layout_tablet_cafe_${code}`);

      setTabletThemeMode(mode || 'unified');
      setTabletUnifiedTheme(unified || 'RESTAURANT');
      setTabletRestaurantTheme(rest || 'RESTAURANT');
      setTabletBarTheme(bar || 'BAR');
      setTabletCafeTheme(cafe || 'TABLET_CAFE');

      // Sync menuType for unified layout if active
      if (!mode || mode === 'unified') {
        const savedTheme = unified;
        if (savedTheme === 'RESTAURANT' || savedTheme === 'BAR' || savedTheme === 'CAFE' || savedTheme === 'TABLET_CAFE') {
          setMenuType((savedTheme === 'TABLET_CAFE' ? 'CAFE' : savedTheme) as 'RESTAURANT' | 'BAR' | 'CAFE');
        }
      }
    }
  }, [property]);

  useEffect(() => {
    if (selectedTableId && tables.length > 0) {
      const selectedTable = tables.find(t => t.id === selectedTableId);
      const floorMenuType = selectedTable?.floor?.menuType;
      if (floorMenuType) {
        const code = property?.code ? property.code.toLowerCase() : '';
        const mode = code ? localStorage.getItem(`pos_layout_tablet_mode_${code}`) : 'unified';
        const unified = code ? localStorage.getItem(`pos_layout_tablet_${code}`) : null;

        if ((!mode || mode === 'unified') && unified && (unified === 'RESTAURANT' || unified === 'BAR' || unified === 'CAFE' || unified === 'TABLET_CAFE')) {
          setMenuType((unified === 'TABLET_CAFE' ? 'CAFE' : unified) as 'RESTAURANT' | 'BAR' | 'CAFE');
        } else if (floorMenuType === 'BAR' && property?.barPosEnabled === false) {
          setMenuType('RESTAURANT');
        } else if (floorMenuType === 'CAFE' && property?.cafePosEnabled === false) {
          setMenuType('RESTAURANT');
        } else {
          setMenuType(floorMenuType as 'RESTAURANT' | 'BAR' | 'CAFE');
        }
      }
    }
  }, [selectedTableId, tables, property]);

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
                } catch (e) { }

                // Play notification bell ding sound
                try {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
                  audio.volume = 0.45;
                  audio.play();
                } catch (audioErr) { }

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

  const handlePlaceOrder = async (actionType: 'SAVE' | 'HOLD' | 'SAVE_AND_KOT' | 'PRINT_KOT') => {
    if (!selectedTableId) return;
    if (cart.length === 0 && !activeOrder) return;

    setIsPlacingOrder(true);
    try {
      const payload = {
        propertyId: tablet?.propertyId,
        tabletId: id,
        orderType: selectedDriver ? 'DELIVERY' : 'DINE_IN',
        restaurantTableId: selectedTableId,
        guestId: selectedCustomer?.id || null,
        driverId: selectedDriver?.id || null,
        guestCount: pax,
        staffMemberId: tablet?.waiterId || null,
        items: cart.map(item => {
          const itemTotalGross = isOrderComplimentary ? 0 : (item.sellingPrice * item.quantity);
          const itemDiscount = cartSubtotal > 0 ? (itemTotalGross / cartSubtotal) * discountAmount : 0;
          const itemNetAfterDiscount = Math.max(0, itemTotalGross - itemDiscount);
          
          const rate = item.taxRate !== null && item.taxRate !== undefined ? item.taxRate : 5;
          const type = item.taxType || 'EXCLUSIVE';
          
          let itemTax = 0;
          if (type === 'INCLUSIVE') {
            itemTax = itemNetAfterDiscount - (itemNetAfterDiscount / (1 + (rate / 100)));
          } else if (type === 'EXCLUSIVE') {
            itemTax = itemNetAfterDiscount * (rate / 100);
          }

          return {
            productId: item.id,
            quantity: item.quantity,
            unitPrice: isOrderComplimentary ? 0 : item.sellingPrice,
            taxAmount: itemTax,
            discountAmount: itemDiscount,
            portion: (item as any).size === 'Half' || (item as any).size === 'Full' ? (item as any).size : null,
            variantName: (item as any).size !== 'Half' && (item as any).size !== 'Full' ? (item as any).size : null,
            name: item.name
          };
        }),
        paymentMode: paymentMode,
        transactionLast4: transactionLast4,
        skipKitchen: actionType === 'PRINT_KOT',
        holdOrder: actionType === 'HOLD' ? true : undefined,
        // Using orderId instead of activeOrder matching billing logic
        orderId: activeOrder?.id || undefined,
      };

      const res = await fetch('/api/pos-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        if (actionType === 'HOLD') addToast('success', 'Order put on hold successfully!');
        else if (actionType === 'SAVE') addToast('success', 'Order saved successfully!');
        else if (actionType === 'PRINT_KOT') addToast('success', 'Order saved! Printing KOT...');
        else addToast('success', 'Order sent to kitchen!');

        setActiveOrder(data.data);
        setIsStatusVisible(true);
        setCart([]);

        if (actionType === 'PRINT_KOT') {
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

  const handleSettleFromTable = async (table: any, activeOrder: any) => {
    setSelectedTableId(table.id);
    setActiveOrder(activeOrder);
    setIsProforma(true);
    // Let state settle, then open bill
    setTimeout(() => {
      // Re-trigger print bill logic explicitly for this order
      const mappedBill: BillData = {
        orderNo: activeOrder?.orderNo || `POS-${Date.now()}`,
        tableNo: table.name || 'Walk-in',
        items: (activeOrder?.items || []).map((i: any) => ({
          id: i.productId || i.id,
          name: i.product?.name || i.itemName || 'Item',
          quantity: i.quantity,
          price: i.unitPrice || i.product?.sellingPrice || 0,
          hsnCode: i.product?.hsnCode
        })),
        subtotal: activeOrder?.subtotal || 0,
        tax: activeOrder?.taxAmount || 0,
        grandTotal: activeOrder?.grandTotal || 0,
        taxLabel: 'GST 5%',
        createdAt: activeOrder?.createdAt || new Date().toISOString(),
        orderId: activeOrder?.id,
        tableId: table.id,
        driverId: activeOrder?.driverId,
        staffMemberId: activeOrder?.staffMemberId || tablet?.waiterId,
        membershipDiscount: activeOrder?.membershipDiscount || 0,
        manualDiscount: activeOrder?.manualDiscount || 0,
        membershipCard: activeOrder?.membershipCard
      } as any;
      
      setBillData(mappedBill);
      setIsBillOpen(true);
    }, 100);
  };

  const handlePrintBill = async () => {
    const hasCartItems = cart.length > 0;
    
    const orderToPrint = hasCartItems ? {
      id: activeOrder?.id,
      orderNo: activeOrder?.orderNo || `POS-${Date.now()}`,
      tableNo: activeOrder?.tableNo || selectedTableId || 'Walk-in',
      items: cart.map((item: any) => ({
        product: item,
        quantity: item.quantity,
        unitPrice: isOrderComplimentary ? 0 : item.sellingPrice,
        productId: item.id
      })),
      subtotal: cartSubtotal,
      taxAmount: cartTax,
      grandTotal: cartTotal,
      createdAt: activeOrder?.createdAt || new Date().toISOString()
    } : activeOrder;

    if (!orderToPrint) return;

    const activeTableName = tables.find(t => t.id === selectedTableId)?.name || orderToPrint.tableNo;

    const mappedBill: BillData = {
      orderNo: orderToPrint.orderNo,
      tableNo: activeTableName || 'Walk-in',
      items: (orderToPrint.items || []).map((i: any) => ({
        id: i.productId || i.id,
        name: i.product?.name || i.itemName || 'Item',
        quantity: i.quantity,
        price: i.unitPrice || i.product?.sellingPrice || 0,
        hsnCode: i.product?.hsnCode
      })),
      subtotal: orderToPrint.subtotal || cartSubtotal,
      tax: orderToPrint.taxAmount || cartTax,
      grandTotal: orderToPrint.grandTotal || cartTotal,
      taxLabel: 'GST 5%',
      createdAt: orderToPrint.createdAt,
      orderId: orderToPrint.id,
      tableId: selectedTableId || undefined,
      driverId: selectedDriver?.id || activeOrder?.driverId,
      staffMemberId: tablet?.waiterId || undefined,
      membershipDiscount: activeOrder?.membershipDiscount || 0,
      manualDiscount: discountAmount || 0,
      membershipCard: activeOrder?.membershipCard
    } as any;
    
    setBillData(mappedBill);
    setIsBillOpen(true);
  };

  const handleSettleNew = async (paymentModeId: string, guestId?: string, driverId?: string) => {
    setSettleLoading(true);
    try {
      const payload = {
        restaurantTableId: selectedTableId || undefined,
        orderType: selectedDriver ? 'DELIVERY' : 'DINE_IN',
        staffMemberId: tablet?.waiterId || undefined,
        paymentModeId: paymentModeId,
        guestId: guestId || selectedCustomer?.id || undefined,
        driverId: driverId || selectedDriver?.id || undefined,
        totalAmount: cartTotal,
        membershipDiscount: activeOrder?.membershipDiscount || 0,
        manualDiscount: discountAmount || 0,
        items: cart.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: isOrderComplimentary ? 0 : item.sellingPrice,
          portion: (item as any).size === 'Half' || (item as any).size === 'Full' ? (item as any).size : null,
          variantName: (item as any).size !== 'Half' && (item as any).size !== 'Full' ? (item as any).size : null,
          variantId: (item as any).variantId
        }))
      };

      const response = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        addToast('success', 'Order settled successfully');
        setCart([]);
        setActiveOrder(null);
        setIsProforma(false);
        setIsBillOpen(false);
        setBillData(null);
        
        // Refresh tables visually
        const res = await fetch(`/api/tablets/${id}/data`);
        const latest = await res.json();
        if (latest.success) {
          setTables(latest.data.tables);
          setActiveOrders(latest.data.activeOrders);
        }
      } else {
        addToast('error', result.message || 'Failed to settle order');
      }
    } catch (err) {
      addToast('error', 'Error settling order');
    } finally {
      setSettleLoading(false);
    }
  };

  const cartSubtotal = useMemo(() => {
    if (isOrderComplimentary) return 0;
    const inCart = cart.reduce((total, item) => total + (item.sellingPrice * item.quantity), 0);
    const ordered = activeOrder?.subtotal || 0;
    return inCart + ordered;
  }, [cart, activeOrder, isOrderComplimentary]);

  const cartTax = useMemo(() => {
    if (isOrderComplimentary) return 0;
    const inCartTax = cart.reduce((total, item) => total + (item.sellingPrice * item.quantity * 0.05), 0);
    const orderedTax = activeOrder?.taxAmount || 0;
    return inCartTax + orderedTax;
  }, [cart, activeOrder, isOrderComplimentary]);

  const cartTotal = isOrderComplimentary ? 0 : (cartSubtotal + cartTax
    - (discountType === 'PERCENT' ? (cartSubtotal * discountAmount / 100) : discountAmount)
    - (activeOrder?.discountAmount || 0)
    - (activeOrder?.membershipDiscount || 0));

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

  if (tablet.mode === 'WAITER' && sessionStage !== 'MENU') {
    return (
      <>
        <div className="h-screen w-screen bg-gradient-to-br from-[#090D1A] via-[#0D1326] to-[#0A0E1D] text-white flex flex-col overflow-hidden font-sans relative">
          
          {/* Ambient mesh glows */}
          <div className="absolute top-[-25%] left-[-25%] w-[65%] h-[65%] rounded-full bg-indigo-500/5 blur-[140px] pointer-events-none z-0" />
          <div className="absolute bottom-[-25%] right-[-25%] w-[65%] h-[65%] rounded-full bg-violet-500/5 blur-[140px] pointer-events-none z-0" />

          {/* ── HEADER: Logo + Tablet Info + Inline Kitchen Status ── */}
          <header className="h-16 shrink-0 flex items-center px-6 border-b border-white/[0.06] bg-slate-950/40 backdrop-blur-xl gap-6 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.3)] relative">
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
                  <h1 className="text-sm font-black tracking-tight uppercase text-white">
                    {property?.brandName || property?.name || 'GuestFlow'} <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md text-[10px] border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] ml-1">POS</span>
                  </h1>
                )}
                <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">
                  {tablet.name} • WAITER STATION {waiter ? `(${waiter.name})` : ''}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-white/5 shrink-0" />

            {/* Live Kitchen Status — inline in header */}
            <div className="flex-1 flex items-center gap-3 overflow-hidden">
              <div className="flex items-center gap-2 shrink-0 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest shrink-0">Live Kitchen</span>
              </div>
              <div className="flex-1 flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                {activeOrders.length === 0 ? (
                  <span className="text-[9px] text-slate-500 font-bold tracking-wide">All clear — no active orders</span>
                ) : (
                  activeOrders.map(order => {
                    const tableName = order.table?.name || `T${order.tableNo || '?'}`;
                    const isReady = order.status === 'READY';
                    const isAwaiting = order.status === 'PAYMENT_AWAITING_APPROVAL';
                    let statusLabel = 'In Kitchen';
                    let badgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(249,115,22,0.05)]';
                    let dotColor = 'bg-amber-400';
                    if (isReady) { statusLabel = 'Ready'; badgeColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.08)] animate-pulse'; dotColor = 'bg-emerald-400'; }
                    else if (isAwaiting) { statusLabel = 'Awaiting'; badgeColor = 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.05)]'; dotColor = 'bg-blue-400'; }
                    return (
                      <div key={order.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider shrink-0 ${badgeColor} transition-all duration-200 hover:scale-105`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${isReady ? 'animate-ping' : ''}`} />
                        <span className="text-white/95">{tableName}</span>
                        <span className="opacity-30">•</span>
                        <span>{statusLabel}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative w-10 h-10 bg-white/[0.03] hover:bg-white/[0.08] active:scale-95 border border-white/[0.08] rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-all shrink-0"
            >
              <Bell size={16} />
              {notificationHistory.filter(n => n.type === 'success').length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 border-2 border-[#090D1A] rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg shadow-rose-500/20 animate-pulse">
                  {notificationHistory.filter(n => n.type === 'success').length}
                </div>
              )}
            </button>
          </header>

          {/* ── SELECT STATION: Dashboard-Style Premium Layout ── */}
          {sessionStage === 'TABLE' && (
            <TabletTableGrid
              filteredTables={filteredTables}
              activeOrders={activeOrders}
              tablesByFloor={tablesByFloor}
              activeFloorFilter={activeFloorFilter}
              setActiveFloorFilter={setActiveFloorFilter}
              waiterCalls={waiterCalls}
              handleDismissWaiterCall={handleDismissWaiterCall}
              tableStatusAlerts={tableStatusAlerts}
              activeTableActionId={activeTableActionId}
              setActiveTableActionId={setActiveTableActionId}
              setSelectedTableId={setSelectedTableId}
              setSessionStage={setSessionStage}
              targetOrderPrepTime={targetOrderPrepTime}
              setTargetOrderPrepTime={setTargetOrderPrepTime}
              handleSettleFromTable={handleSettleFromTable}
              handlePrintKOT={handlePrintKOT}
              setSourceTableForSwitch={setSourceTableForSwitch}
              setIsSwitchModalOpen={setIsSwitchModalOpen}
            />
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
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shrink-0"
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
              <div className="flex-1 grid grid-cols-2 gap-6 relative z-10 min-h-0">

                {/* ─── LEFT: GUEST PANEL ─── */}
                <div className="flex flex-col bg-[#111827]/40 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">
                  {/* Panel Header */}
                  <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-indigo-600/10 to-transparent shrink-0">
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
                        <div className="bg-slate-950/60 border border-indigo-500/20 rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(99,102,241,0.08)]">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0"><User size={24} className="text-white" /></div>
                          <div className="min-w-0">
                            <p className="text-base font-black text-white uppercase tracking-tight truncate">{selectedCustomer.firstName} {selectedCustomer.lastName || ''}</p>
                            <p className="text-[10px] text-indigo-400 font-black tracking-wider mt-0.5">{selectedCustomer.mobile || 'No Mobile'}</p>
                            {selectedCustomer.email && <p className="text-[9px] text-slate-500 font-bold truncate">{selectedCustomer.email}</p>}
                            <span className="mt-2 inline-block text-[8px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{selectedCustomer.loyaltyPoints || 0} pts</span>
                          </div>
                        </div>
                        <button onClick={() => setSelectedCustomer(null)} className="w-full py-3 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-300 transition-all">Remove &amp; Search Again</button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 flex-1">
                        <div className="relative group">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={15} />
                          <input type="text" placeholder="Search by name or mobile..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full h-12 bg-slate-950/40 border border-white/10 rounded-xl pl-11 pr-11 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 focus:shadow-[0_0_15px_rgba(99,102,241,0.15)] transition-all" />
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
                            <div className="w-16 h-16 rounded-2xl bg-slate-800/40 flex items-center justify-center text-slate-600"><User size={28} /></div>
                            <div className="text-center"><p className="text-xs font-black text-slate-500 uppercase tracking-wider">Optional</p><p className="text-[10px] text-slate-600 font-bold mt-0.5">Search above to link a guest</p></div>
                            <button onClick={() => setIsCustomerModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:bg-indigo-600/30 transition-all"><UserPlus size={12} />Register New Guest</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── RIGHT: DRIVER + PAX ─── */}
                <div className="flex flex-col gap-6">
                  <div className="flex-1 flex flex-col bg-[#111827]/40 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-amber-600/10 to-transparent shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400"><CarFront size={16} /></div>
                      <div><p className="text-[9px] font-black text-amber-400 uppercase tracking-widest leading-none mb-0.5">Driver Panel</p><p className="text-sm font-black text-white uppercase tracking-tight">Assign Driver</p></div>
                      {selectedDriver && <span className="ml-auto text-[8px] font-black bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">✓ Assigned</span>}
                    </div>
                    <div className="flex-1 p-5 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                      {selectedDriver ? (
                        <div className="flex flex-col gap-4">
                          <div className="bg-slate-950/60 border border-amber-500/20 rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(245,158,11,0.08)]">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0"><CarFront size={24} className="text-white" /></div>
                            <div className="min-w-0">
                              <p className="text-base font-black text-white uppercase tracking-tight truncate">{selectedDriver.name}</p>
                              <p className="text-[10px] text-amber-400 font-black tracking-wider mt-0.5">{selectedDriver.phone || 'No Phone'}</p>
                              <span className="mt-2 inline-block text-[8px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Delivery Order</span>
                            </div>
                          </div>
                          <button onClick={() => setSelectedDriver(null)} className="w-full py-3 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/30 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-300 transition-all">Remove &amp; Search Again</button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 flex-1">
                          <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-400 transition-colors" size={15} />
                            <input type="text" placeholder="Search driver name or phone..." value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} className="w-full h-12 bg-slate-950/40 border border-white/10 rounded-xl pl-11 pr-4 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 focus:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all" />
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
                              <div className="w-16 h-16 rounded-2xl bg-slate-800/40 flex items-center justify-center text-slate-600"><CarFront size={28} /></div>
                              <div className="text-center"><p className="text-xs font-black text-slate-500 uppercase tracking-wider">Optional</p><p className="text-[10px] text-slate-600 font-bold mt-0.5">Only for delivery orders</p></div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* PAX Counter */}
                  <div className="bg-[#111827]/40 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl p-5 shrink-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] text-center mb-4">Number of Covers (PAX)</p>
                    <div className="flex items-center justify-between bg-slate-950/40 border border-white/10 rounded-2xl p-2 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                      <button onClick={() => setPax(Math.max(1, pax - 1))} className="w-12 h-12 shrink-0 rounded-xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-400 hover:bg-white/10 hover:text-white transition-all hover:scale-105 active:scale-95 z-10"><Minus size={18} /></button>
                      <div className="flex-1 flex flex-col items-center justify-center z-10">
                        <span className="text-[3.5rem] font-black tabular-nums tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.25)] leading-none">{pax}</span>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">GUESTS</span>
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
                  className="flex-1 h-16 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-2xl font-black uppercase tracking-[0.2em] text-slate-300 hover:text-white transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2 text-xs shadow-lg"
                >
                  <ArrowLeft size={14} className="text-indigo-400" />
                  Back
                </button>
                <button
                  onClick={() => setSessionStage('MENU')}
                  className="flex-[3] h-16 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_10px_35px_-5px_rgba(99,102,241,0.5)] hover:shadow-[0_20px_45px_-5px_rgba(99,102,241,0.7)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-3 group relative overflow-hidden text-base border border-indigo-400/20"
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
            tables={filteredTables}
            handleConfirmSwitchTable={handleConfirmSwitchTable}
            switchLoading={switchLoading}
            cart={cart}
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
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${activePopupNotification.type === 'ready' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]' :
                    activePopupNotification.type === 'kitchen' ? 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)]' :
                      'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]'
                  }`} />

                {/* Left side status icon */}
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activePopupNotification.type === 'ready' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
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
                  <p className={`text-[9px] font-black uppercase tracking-widest ${activePopupNotification.type === 'ready' ? 'text-emerald-400' :
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

  const activeLayout = tabletThemeMode === 'split'
    ? (menuType === 'RESTAURANT'
        ? tabletRestaurantTheme
        : menuType === 'BAR'
          ? tabletBarTheme
          : tabletCafeTheme)
    : (menuType === 'RESTAURANT'
        ? 'RESTAURANT'
        : menuType === 'BAR'
          ? 'BAR'
          : (tabletUnifiedTheme === 'CAFE' ? 'CAFE' : 'TABLET_CAFE'));

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#090D1A] via-[#0D1326] to-[#0A0E1D] text-white flex flex-col overflow-hidden font-sans select-none relative">
      
      {/* Ambient mesh glows */}
      <div className="absolute top-[-25%] left-[-25%] w-[65%] h-[65%] rounded-full bg-indigo-500/5 blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-25%] right-[-25%] w-[65%] h-[65%] rounded-full bg-violet-500/5 blur-[140px] pointer-events-none z-0" />

      {/* Live Kitchen Status Ticker */}
      <LiveKitchenTicker activeOrders={activeOrders} />

      {/* Top Header - Unified Terminal Header */}
      <TabletHeader
        property={property}
        websiteSettings={websiteSettings}
        tablet={tablet}
        tables={filteredTables}
        selectedTableId={selectedTableId}
        waiter={waiter}
        activeOrder={activeOrder}
        setIsStatusVisible={setIsStatusVisible}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSessionStage={setSessionStage}
        setIsNotificationOpen={setIsNotificationOpen}
        notificationHistory={notificationHistory}
      />

      {/* Menu Switcher (Restaurant / Bar / Cafe) */}
      {(showBarTab || showCafeTab) && (
        <div className="h-14 shrink-0 bg-slate-950/20 border-b border-white/[0.06] backdrop-blur-md flex items-center justify-center px-6 gap-3 z-45">
          <button
            onClick={() => { setMenuType('RESTAURANT'); setActiveCategory('all'); }}
            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${menuType === 'RESTAURANT' ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg border border-indigo-400/20 shadow-indigo-500/20' : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
          >
            🍽️ Restaurant
          </button>
          {showBarTab && (
            <button
              onClick={() => { setMenuType('BAR'); setActiveCategory('all'); }}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${menuType === 'BAR' ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg border border-amber-400/20 shadow-amber-500/20' : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
            >
              🍺 Bar
            </button>
          )}
          {showCafeTab && (
            <button
              onClick={() => { setMenuType('CAFE'); setActiveCategory('all'); }}
              className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${menuType === 'CAFE' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg border border-emerald-400/20 shadow-emerald-500/20' : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}
            >
              ☕ Cafe
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative z-10">

        {/* Left Side: Product Grid & Categories (Billing Style) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/20">
          {/* Category Bar & Inline Search */}
          <TabletCategoryBar
            menuType={menuType}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredProductsForMenuType={filteredProductsForMenuType}
            filteredCategories={filteredCategories}
          />

          {/* Menu Items Container */}
          {activeLayout === 'TABLET_CAFE' ? (
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950/10 no-scrollbar">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[1600px] mx-auto content-start">
                {filteredProducts.map((product) => {
                  const inCart = cart.find(item => item.id === product.id);
                  const hasVariants = !!((product.variants && product.variants.length > 0) || (product as any).halfPrice);
                  return (
                    <CafeProductCard
                      key={product.id}
                      product={product}
                      inCart={inCart}
                      cart={cart}
                      hasVariants={hasVariants}
                      addToCart={addToCart}
                      updateQuantity={updateQuantity}
                      categoryName={categoryMap[product.categoryId]}
                    />
                  );
                })}
              </div>
            </div>
          ) : activeLayout === 'CAFE' ? (
            /* Classic Cafe block-style button grid */
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2 content-start no-scrollbar bg-slate-950/10 animate-fadeIn">
              {filteredProducts.map((product, idx) => {
                const accent = CAFE_ACCENTS[idx % CAFE_ACCENTS.length];
                const isInCart = cart.some(i => i.id === product.id);
                const stock = (product as any).stock ?? (product as any).stockQuantity ?? null;
                const isOutOfStock = stock !== null && stock <= 0;
                const catName = categoryMap[product.categoryId] || '';
                const popular = isPopular(product.name);
                const cartQty = cart.reduce((acc, i) => i.id === product.id ? acc + i.quantity : acc, 0);

                return (
                  <button
                    key={product.id}
                    onClick={() => !isOutOfStock && (product.variants && product.variants.length > 0 ? addToCart(product, product.variants[0].name, product.variants[0].price) : addToCart(product, 'Full'))}
                    disabled={isOutOfStock}
                    style={{
                      background: isInCart
                        ? 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))'
                        : 'linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                      borderColor: isInCart ? `${accent.color}44` : 'rgba(255,255,255,0.05)',
                      opacity: isOutOfStock ? 0.35 : 1,
                    }}
                    className={`group relative overflow-hidden rounded-xl border p-2 flex flex-col text-left hover:scale-[1.03] active:scale-[0.97] aspect-square transition-all duration-300 ${isInCart ? 'shadow-2xl shadow-black/40 ring-1 ring-offset-1 ring-[#D4956A]/20' : 'hover:shadow-lg'}`}
                  >
                    <div style={{ height: '2px', background: `linear-gradient(90deg, ${accent.color}AA, transparent)` }} className="w-full absolute top-0 left-0" />
                    
                    {popular && (
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/25 rounded-full px-1.5 py-0.5 text-[6px] font-black text-yellow-500 uppercase">
                        ★ BEST
                      </div>
                    )}

                    <div className="flex-1 flex flex-col z-10 w-full mt-2">
                      <div className="flex justify-between items-start mb-2">
                        <span 
                          style={{ color: accent.color, backgroundColor: accent.bg, borderColor: accent.border }}
                          className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                        >
                          {catName || 'Cafe'}
                        </span>
                        {isOutOfStock ? (
                          <span className="text-[7px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">OUT</span>
                        ) : cartQty > 0 ? (
                          <span style={{ backgroundColor: accent.color }} className="w-4 h-4 rounded-full text-black text-[9px] font-bold flex items-center justify-center">
                            {cartQty}
                          </span>
                        ) : null}
                      </div>

                      <h3 className="text-xs font-black tracking-tight text-white uppercase line-clamp-2 leading-tight flex-1">
                        {product.name}
                      </h3>

                      {product.variants && product.variants.length > 0 && (
                        <p className="text-[7px] text-[#D4956A] font-black uppercase mt-1">
                          {product.variants.length} Sizes
                        </p>
                      )}

                      <p style={{ color: accent.color }} className="text-sm font-black mt-auto pt-2">
                        ₹{product.sellingPrice.toFixed(0)}
                      </p>
                    </div>

                    {/* Variants Quick Overlay */}
                    {((product.variants?.length ?? 0) > 0 || (product as any).halfPrice > 0) && (
                      <div className="absolute inset-x-0 bottom-0 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 z-20">
                        {product.variants && product.variants.length > 0 ? (
                          <div className="grid grid-cols-2">
                            {product.variants.map((v, vIdx) => {
                              const isLastOdd = vIdx === (product.variants?.length || 0) - 1 && (product.variants?.length || 0) % 2 !== 0;
                              return (
                                <button 
                                  key={v.id}
                                  onClick={(e) => { e.stopPropagation(); addToCart(product, v.name, v.price); }}
                                  className={`py-3.5 text-[8px] font-black uppercase tracking-widest text-white transition-all active:scale-95 bg-yellow-600 hover:bg-yellow-700 ${isLastOdd ? 'col-span-2' : ''} border-r border-b border-white/10`}
                                >
                                  {v.name}
                                </button>
                              );
                            })}
                          </div>
                        ) : (product as any).halfPrice > 0 && (
                          <div className="flex w-full">
                            <button 
                              onClick={(e) => { e.stopPropagation(); addToCart(product, 'Half', (product as any).halfPrice); }}
                              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-[9px] font-black py-3.5 uppercase tracking-wider"
                            >
                              Half
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); addToCart(product, 'Full', product.sellingPrice); }}
                              className="flex-1 bg-yellow-700 hover:bg-yellow-800 text-white text-[9px] font-black py-3.5 uppercase tracking-wider border-l border-white/10"
                            >
                              Full
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : activeLayout === 'BAR' ? (
            /* Jewel-toned Bar POS styled grid */
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 content-start no-scrollbar bg-slate-950/20">
              {filteredProducts.map((product, idx) => {
                const accent = BAR_ACCENTS[idx % BAR_ACCENTS.length];
                const catName = categoryMap[product.categoryId] || '';
                const wKey = Object.keys(BAR_WMOJI).find(k => catName.toLowerCase().includes(k)) || 'default';
                const watermark = BAR_WMOJI[wKey] || '🍷';
                const hasVariants = !!((product.variants && product.variants.length > 0) || product.halfPrice);
                const stock = (product as any).stock ?? (product as any).stockQuantity ?? null;
                const isOutOfStock = stock !== null && stock <= 0;

                return (
                  <BarProductCard
                    key={product.id}
                    product={product}
                    cart={cart}
                    categoryName={catName}
                    accent={accent}
                    watermark={watermark}
                    onClick={() => {
                      if (isOutOfStock) return;
                      if (hasVariants) {
                        setVariantProduct(product);
                      } else {
                        addToCart(product);
                      }
                    }}
                  />
                );
              })}
            </div>
          ) : (
            /* High Density Product Grid for Restaurant */
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3.5 content-start no-scrollbar">
              {filteredProducts.map((product, idx) => {
                const inCart = cart.find(item => item.id === product.id);
                const palette = PRODUCT_PALETTE_DARK[idx % PRODUCT_PALETTE_DARK.length];

                return (
                  <RestaurantProductCard
                    key={product.id}
                    product={product}
                    inCart={inCart}
                    addToCart={addToCart}
                    categoryName={categoryMap[product.categoryId] || ''}
                    palette={palette}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Order Tray (Billing Style) */}
        <TabletOrderTray
          tablet={tablet}
          tables={filteredTables}
          selectedTableId={selectedTableId}
          waiter={waiter}
          pax={pax}
          setPax={setPax}
          activeOrder={activeOrder}
          setIsStatusVisible={setIsStatusVisible}
          cart={cart}
          setCart={setCart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          addToCart={addToCart}
          isOrderComplimentary={isOrderComplimentary}
          setIsOrderComplimentary={setIsOrderComplimentary}
          isOrderPaid={isOrderPaid}
          setIsOrderPaid={setIsOrderPaid}
          cartTax={cartTax}
          cartTotal={cartTotal}
          setDiscountAmount={setDiscountAmount}
          handlePlaceOrder={handlePlaceOrder}
          isPlacingOrder={isPlacingOrder}
          setIsProforma={setIsProforma}
          handlePrintBill={handlePrintBill}
          settleLoading={settleLoading}
          onShowBillAndQR={() => {
            if (activeOrder) {
              setQrModalOrder(activeOrder);
              setIsQRModalOpen(true);
            }
          }}
        />
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
        tables={filteredTables}
        handleConfirmSwitchTable={handleConfirmSwitchTable}
        switchLoading={switchLoading}
        cart={cart}
      />

      {/* BAR PEGS SIZE SELECTOR MODAL */}
      <BarVariantModal
        isOpen={!!variantProduct && menuType === 'BAR'}
        onClose={() => setVariantProduct(null)}
        product={variantProduct}
        addToCart={addToCart}
      />

      <AnimatePresence>
        {activePopupNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[999] pointer-events-auto flex items-center gap-4 bg-slate-900/90 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl px-5 py-3 rounded-2xl max-w-[380px] w-[90vw] overflow-hidden"
          >
            {/* Left side status icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activePopupNotification.type === 'ready' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
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
              <p className={`text-[9px] font-black uppercase tracking-widest ${activePopupNotification.type === 'ready' ? 'text-emerald-400' :
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

      <BillModal 
        bill={billData} 
        onClose={() => {
            setIsBillOpen(false);
            setBillData(null);
        }} 
        onSettle={handleSettleNew}
        paymentModes={paymentModes}
        customers={customers}
        guestId={selectedCustomer?.id}
        onAddCustomer={async (data) => {
            const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, tabletId: id }) });
            const result = await res.json();
            if (result.success) {
                setCustomers(prev => [...prev, result.data]);
                return result.data;
            }
            throw new Error('Failed to add customer');
        }}
        isProforma={isProforma}
      />
    </div>
  );
}
