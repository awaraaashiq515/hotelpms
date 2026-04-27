'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  Trash2, 
  User as UserIcon, 
  CreditCard, 
  Percent, 
  Pause, 
  RotateCcw,
  Grid,
  List,
  ShoppingBag,
  Utensils,
  Minus,
  ChevronRight,
  Printer, 
  Save, 
  CheckCircle2,
  UserPlus,
  CarFront,
  Trophy,
  QrCode
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { productsApi, Product } from '@/lib/api/products';
import { categoriesApi, Category } from '@/lib/api/categories';
import { ordersApi } from '@/lib/api/orders';
import { paymentModesApi, PaymentMode } from '@/lib/api/payment-modes';
import { customersApi, Customer } from '@/lib/api/customers';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { KotSlipModal } from '@/components/kots/KotSlipModal';
import { BillModal, BillData } from '@/components/billing/BillModal';
import { CustomerForm } from '@/components/forms/customer-form';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSidebar } from '@/context/sidebar-context';
import { printerService } from '@/lib/printer-service';

interface CartItem extends Product {
  quantity: number;
}

// CosyPOS-style category colors — pastel for light mode, deep pastel for dark mode
const CATEGORY_COLORS_LIGHT: Record<number, string> = {
  0: 'bg-[#C8E6C9] text-[#1B5E20]', // Mint Green
  1: 'bg-[#E1BEE7] text-[#4A148C]', // Lavender
  2: 'bg-[#B3E5FC] text-[#01579B]', // Sky Blue
  3: 'bg-[#F8BBD0] text-[#880E4F]', // Soft Pink
  4: 'bg-[#FFF9C4] text-[#F57F17]', // Warm Yellow
  5: 'bg-[#B2DFDB] text-[#004D40]', // Teal Mint
  6: 'bg-[#FFCCBC] text-[#BF360C]', // Peach
  7: 'bg-[#CFD8DC] text-[#263238]', // Blue Grey
};

// CosyPOS dark mode — solid pastel tiles like the reference image
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

// 12-color cycling palette for product cards — each card gets its own pastel color
// Dark mode: softer muted pastels like CosyPOS reference
const PRODUCT_PALETTE_DARK = [
  { bg: '#c8e6c9', border: '#81c784', text: '#1b3a1c', textSub: '#2e5e30' },  // Mint Green
  { bg: '#ce93d8', border: '#ab47bc', text: '#1a0d1e', textSub: '#3d1547' },  // Lavender
  { bg: '#90caf9', border: '#42a5f5', text: '#0d1f35', textSub: '#0c3b6e' },  // Sky Blue
  { bg: '#f48fb1', border: '#e91e63', text: '#2d0016', textSub: '#6a0030' },  // Rose Pink
  { bg: '#fff59d', border: '#fdd835', text: '#2d2600', textSub: '#5e4a00' },  // Yellow
  { bg: '#80cbc4', border: '#26a69a', text: '#002926', textSub: '#00544f' },  // Teal
  { bg: '#ffcc80', border: '#ffa726', text: '#2d1500', textSub: '#5e3000' },  // Peach/Orange
  { bg: '#b0bec5', border: '#78909c', text: '#1a2125', textSub: '#2e3d45' },  // Blue Grey
  { bg: '#a5d6a7', border: '#66bb6a', text: '#0d2010', textSub: '#1a4020' },  // Green
  { bg: '#ffe082', border: '#ffca28', text: '#2d2000', textSub: '#5e4000' },  // Amber
  { bg: '#ef9a9a', border: '#e53935', text: '#2d0505', textSub: '#6a0d0d' },  // Red
  { bg: '#80deea', border: '#26c6da', text: '#002a30', textSub: '#005560' },  // Cyan
];

// Light mode product card colors
const PRODUCT_PALETTE_LIGHT = [
  { bg: '#e8f5e9', border: '#66bb6a', text: '#1b5e20', textSub: '#2e7d32' },  // Green
  { bg: '#f3e5f5', border: '#ab47bc', text: '#4a148c', textSub: '#6a1b9a' },  // Purple
  { bg: '#e3f2fd', border: '#42a5f5', text: '#0d47a1', textSub: '#1565c0' },  // Blue
  { bg: '#fce4ec', border: '#e91e63', text: '#880e4f', textSub: '#ad1457' },  // Pink
  { bg: '#fffde7', border: '#fdd835', text: '#f57f17', textSub: '#f9a825' },  // Yellow
  { bg: '#e0f2f1', border: '#26a69a', text: '#004d40', textSub: '#00695c' },  // Teal
  { bg: '#fff3e0', border: '#ffa726', text: '#e65100', textSub: '#f57c00' },  // Orange
  { bg: '#eceff1', border: '#78909c', text: '#263238', textSub: '#37474f' },  // Grey
  { bg: '#f1f8e9', border: '#8bc34a', text: '#33691e', textSub: '#558b2f' },  // Lime
  { bg: '#fff8e1', border: '#ffca28', text: '#ff6f00', textSub: '#ff8f00' },  // Amber
  { bg: '#ffebee', border: '#e53935', text: '#b71c1c', textSub: '#c62828' },  // Red
  { bg: '#e0f7fa', border: '#26c6da', text: '#006064', textSub: '#00838f' },  // Cyan
];

export default function BillingPage() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableId = searchParams.get('tableId');
  const tableName = searchParams.get('tableName');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settleLoading, setSettleLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  // Color animation: 'dark' = all cards black, 'colored' = staggered color pop-in
  const [colorPhase, setColorPhase] = useState<'dark' | 'colored'>('dark');
  const [colorOffset, setColorOffset] = useState(0);
  
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [isKotOpen, setIsKotOpen] = useState(false);
  const [kotData, setKotData] = useState<any>(null);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [isProforma, setIsProforma] = useState(true);
  const [autoPrint, setAutoPrint] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerMutationLoading, setCustomerMutationLoading] = useState(false);
  // Order type toggle
  const [orderType, setOrderType] = useState<'DINE_IN' | 'DELIVERY' | 'PICKUP'>('DINE_IN');
  // Number of guests/customers at the table
  const [guestCount, setGuestCount] = useState<number>(1);
  // Membership Card state
  const [membershipCard, setMembershipCard] = useState<any>(null);
  const [membershipSearch, setMembershipSearch] = useState('');
  const [isValidatingMembership, setIsValidatingMembership] = useState(false);
  // Driver selection for Delivery orders
  const [drivers, setDrivers] = useState<any[]>([]);
  const [driverSearch, setDriverSearch] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [showDriverDropdown, setShowDriverDropdown] = useState(false);
  // Current restaurant's property ID (for tenant-safe driver fetch)
  const [currentPropertyId, setCurrentPropertyId] = useState<string | null>(null);
  // Active orders from all tables — for bottom bar
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [property, setProperty] = useState<any>(null);

  const { addToast } = useToast();
  const { setOpen } = useSidebar();

  useEffect(() => {
    // Role guard — RESTAURANTS_ADMIN should not access POS Terminal
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated && data.user?.role === 'RESTAURANTS_ADMIN') {
          router.replace('/dashboard');
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Automatically collapse the sidebar when on the billing page
    setOpen(false);
    return () => setOpen(true);
  }, [setOpen]);

  // Color animation: dark → scattered color pop-in
  useEffect(() => {
    // Entrance: start dark, then stagger colors in (scattered order)
    const enterTimer = setTimeout(() => setColorPhase('colored'), 400);

    return () => {
      clearTimeout(enterTimer);
    };
  }, []);

  useEffect(() => {
    loadData();
    if (tableId) fetchActiveOrder();
    fetchAllActiveOrders();
    const ordersInterval = setInterval(fetchAllActiveOrders, 15000);
    return () => clearInterval(ordersInterval);
  }, [tableId]);

  const fetchDrivers = async (propertyId?: string | null) => {
    try {
      // Always pass propertyId so RESTAURANTS_ADMIN only sees THIS restaurant's drivers
      const url = propertyId ? `/api/drivers?propertyId=${propertyId}` : '/api/drivers';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setDrivers(data.data);
    } catch (err) {
      console.error('Failed to fetch drivers:', err);
    }
  };

  const fetchAllActiveOrders = async () => {
    try {
      const res = await fetch('/api/floors');
      const data = await res.json();
      if (data.success) {
        // Extract propertyId from first floor (for tenant-safe driver fetch)
        const propId = data.data?.[0]?.propertyId || null;
        if (propId && propId !== currentPropertyId) {
          setCurrentPropertyId(propId);
          fetchDrivers(propId); // fetch drivers scoped to THIS restaurant
        }

        // Flatten all tables from all floors and get occupied ones
        const allOrders: any[] = [];
        data.data.forEach((floor: any) => {
          floor.tables.forEach((table: any) => {
            if (table.activeOrder && table.status !== 'VACANT') {
              allOrders.push({
                tableId: table.id,
                tableName: table.name,
                itemCount: table.activeOrder.itemCount,
                amount: table.activeOrder.amount,
                kotCount: table.activeOrder.kotCount,
                elapsedTime: table.activeOrder.elapsedTime,
                status: table.status,
                orderId: table.activeOrder.id,
              });
            }
          });
        });
        setActiveOrders(allOrders);
      }
    } catch (err) {
      console.error('Failed to fetch active orders:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, cData, pmData, custData, propData] = await Promise.all([
        productsApi.list(),
        categoriesApi.list(),
        paymentModesApi.list(),
        customersApi.list(),
        fetch('/api/setup/properties/current').then(r => r.json())
      ]);
      setProducts(pData);
      setCategories(cData);
      setPaymentModes(pmData);
      setCustomers(custData);
      if (propData.success) setProperty(propData.data);
      
      // Fetch drivers reliably on load
      fetchDrivers();
    } catch (err) {
      addToast('error', 'Error loading POS data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrder = async () => {
    if (!tableId) return;
    try {
      const response = await fetch(`/api/pos-orders?restaurantTableId=${tableId}&status=in_progress`);
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        const order = result.data[0];
        setActiveOrder(order);
        const orderItems = order.items.map((i: any) => ({
          ...i.product,
          quantity: i.quantity,
          sellingPrice: i.unitPrice
        }));
        setCart(orderItems);
      }
    } catch (err) {
      console.error('Failed to fetch active order:', err);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleSimpleSave = async () => {
    if (cart.length === 0) return;
    setSaveLoading(true);
    try {
      const payload = {
        restaurantTableId: tableId || undefined,
        orderType: orderType === 'PICKUP' ? 'TAKEAWAY' : orderType,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.sellingPrice
        })),
        guestId: selectedGuestId || undefined,
        guestCount: orderType === 'DINE_IN' ? guestCount : 1,
        driverId: selectedDriver?.id || undefined
      };

      const response = await fetch('/api/pos-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        addToast('success', 'Order saved successfully');
        // Refresh active order to sync (get core IDs, items properly linked)
        fetchActiveOrder();
        fetchAllActiveOrders();
        // Redirect to operations/tables as requested
        router.push('/operations/tables');
      }
    } catch (err) {
      addToast('error', 'Failed to save order');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrintKOT = async () => {
    if (cart.length === 0) return;
    setSaveLoading(true);
    try {
      const payload = {
        restaurantTableId: tableId || undefined,
        orderType: orderType === 'PICKUP' ? 'TAKEAWAY' : orderType,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.sellingPrice
        })),
        guestId: selectedGuestId || undefined,
        guestCount: orderType === 'DINE_IN' ? guestCount : 1,
        driverId: selectedDriver?.id || undefined
      };

      const response = await fetch('/api/pos-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        addToast('success', 'Order saved & KOT Generated');
        
        // Correctly format KOT data for the modal, matching the operations/tables logic
        const orderData = result.data;
        const latestKot = orderData.kotTickets?.[orderData.kotTickets.length - 1];
        
        if (latestKot) {
          setKotData({
            kotNo: latestKot.kotNo,
            orderNo: orderData.orderNo,
            tableNo: tableName || (orderType === 'DELIVERY' ? 'Delivery' : orderType === 'PICKUP' ? 'Pick Up' : 'Counter'),
            orderType: orderData.orderType,
            createdAt: latestKot.createdAt,
            items: latestKot.items.map((item: any) => ({
              name: item.itemName || item.name || item.product?.name || "Item",
              quantity: item.quantity,
              notes: item.notes
            }))
          });
          setIsKotOpen(true);

          // Direct thermal printing via Backend API
          if (property?.enableDirectPrinting) {
            try {
              const kotPrintData = {
                kotNo: latestKot.kotNo,
                orderNo: orderData.orderNo,
                tableNo: tableName || (orderType === 'DELIVERY' ? 'Delivery' : orderType === 'PICKUP' ? 'Pick Up' : 'Counter'),
                items: latestKot.items.map((item: any) => ({
                  name: item.itemName || item.name || item.product?.name || "Item",
                  quantity: item.quantity,
                  notes: item.notes
                }))
              };
              
              const printRes = await fetch('/api/print', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kotData: kotPrintData, property })
              });
              const printResult = await printRes.json();
              
              if (printResult.success) {
                addToast('success', `KOT Printed successfully via Serial Port`);
              } else {
                throw new Error(printResult.message);
              }
            } catch (printErr: any) {
              console.error('Serial printing failed:', printErr);
              addToast('warning', 'Direct print failed, using browser print');
            }
          }
        } else {
          addToast('warning', 'Order saved but KOT details could not be generated');
        }

        // Refresh to ensure any UI components update with the latest DB state
        fetchActiveOrder();
        fetchAllActiveOrders();
      }
    } catch (err) {
      addToast('error', 'Failed to generate KOT');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrintBill = async () => {
    // Priority: If cart has items, use cart data. Otherwise fallback to activeOrder.
    const hasCartItems = cart.length > 0;
    
    const orderToPrint = hasCartItems ? {
      orderNo: activeOrder?.orderNo || `POS-${Date.now()}`,
      tableNo: tableName || activeOrder?.tableNo || (orderType === 'DELIVERY' ? 'Delivery' : orderType === 'PICKUP' ? 'Take Away' : 'Walk-in'),
      items: cart.map(item => ({
        product: item,
        quantity: item.quantity,
        unitPrice: item.sellingPrice,
        productId: item.id
      })),
      subtotal: displayedSubtotal,
      taxAmount: tax,
      grandTotal: grandTotal,
      createdAt: activeOrder?.createdAt || new Date().toISOString()
    } : activeOrder;

    if (!orderToPrint) return;

    const mappedBill: BillData = {
      orderNo: orderToPrint.orderNo,
      tableNo: tableName || orderToPrint.tableNo || (orderToPrint.orderType === 'DELIVERY' ? 'Delivery' : (orderToPrint.orderType === 'TAKEAWAY' || orderToPrint.orderType === 'PICKUP') ? 'Take Away' : 'Walk-in'),
      items: orderToPrint.items.map((i: any) => ({
        id: i.productId || i.id,
        name: i.product?.name || i.itemName || 'Item',
        quantity: i.quantity,
        price: i.unitPrice || i.product?.sellingPrice || 0,
        hsnCode: i.product?.hsnCode
      })),
      subtotal: orderToPrint.subtotal || displayedSubtotal,
      tax: orderToPrint.taxAmount || tax,
      grandTotal: orderToPrint.grandTotal || grandTotal,
      taxLabel: taxLabel,
      createdAt: orderToPrint.createdAt,
      orderId: orderToPrint.id,
      tableId: tableId || undefined,
      driverId: selectedDriver?.id || activeOrder?.driverId,
      membershipDiscount: membershipDiscount || orderToPrint.membershipDiscount || 0,
      membershipCard: membershipCard || orderToPrint.membershipCard
    } as any;
    
    setBillData(mappedBill);
    setIsBillOpen(true);
  };

  const handleOpenSettlement = () => {
    setIsProforma(true);
    handlePrintBill();
  };

  const handleSettleNew = async (paymentModeId: string, guestId?: string, driverId?: string) => {
    setSettleLoading(true);
    try {
      const payload = {
        restaurantTableId: tableId || undefined,
        orderType: orderType === 'PICKUP' ? 'TAKEAWAY' : orderType,
        paymentModeId: paymentModeId,
        guestId: guestId || selectedGuestId || undefined,
        driverId: driverId || selectedDriver?.id || undefined,
        totalAmount: grandTotal,
        membershipCardId: membershipCard?.id || null,
        membershipDiscount: membershipDiscount || 0,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.sellingPrice
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
        // Data for final print is already in billData, but status is now settled
        fetchAllActiveOrders();
      } else {
        addToast('error', result.message || 'Settlement failed');
      }
    } catch (err) {
      addToast('error', 'Failed to settle order');
    } finally {
      setSettleLoading(false);
    }
  };

  const handleSettle = async () => {
    // Legacy handleSettle — keeping for now or mapping it
    handleOpenSettlement();
  };

  const handleCreateCustomer = async (data: any) => {
    setCustomerMutationLoading(true);
    try {
      const result = await customersApi.create(data);
      setCustomers(prev => [...prev, result]);
      setSelectedGuestId(result.id);
      setIsCustomerModalOpen(false);
      addToast('success', 'Customer added');
    } catch (err) {
      addToast('error', 'Failed to add customer');
    } finally {
      setCustomerMutationLoading(false);
    }
  };

  const validateMembership = async (cardNumber: string | null, mobile?: string) => {
    setIsValidatingMembership(true);
    try {
      const res = await fetch('/api/memberships/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardNumber, mobile }),
      });
      const data = await res.json();
      if (data.success) {
        setMembershipCard(data.data);
        addToast('success', `${data.data.membershipPlan.name} membership applied!`);
        setMembershipSearch('');
      } else if (cardNumber) {
        addToast('error', data.message || 'Invalid membership card');
      }
    } catch (err) {
      console.error('Membership validation error:', err);
    } finally {
      setIsValidatingMembership(false);
    }
  };

  useEffect(() => {
    if (selectedGuestId) {
      const guest = customers.find(c => c.id === selectedGuestId);
      if (guest && guest.mobile) {
        validateMembership(null, guest.mobile);
      }
    } else {
      setMembershipCard(null);
    }
  }, [selectedGuestId]);



  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const subtotal = cart.reduce((acc, item) => acc + (item.sellingPrice * item.quantity), 0);
  
  let membershipDiscount = 0;
  if (membershipCard) {
    const { discountType, discountValue, minOrderValue } = membershipCard.membershipPlan;
    if (subtotal >= minOrderValue) {
      if (discountType === 'PERCENTAGE') {
        membershipDiscount = (subtotal * discountValue) / 100;
      } else {
        membershipDiscount = discountValue;
      }
    }
  }

  // Calculate dynamic subtotal, taxes, and grand total based on product settings
  const { totalNetSubtotal, totalTax, totalPayable } = cart.reduce((acc, item) => {
    const itemTotalGross = item.sellingPrice * item.quantity;
    // Calculate proportional discount for this item based on its share of the total gross subtotal
    const grossSubtotal = cart.reduce((sum, i) => sum + (i.sellingPrice * i.quantity), 0);
    const itemDiscount = grossSubtotal > 0 ? (itemTotalGross / grossSubtotal) * membershipDiscount : 0;
    const itemNetAfterDiscount = Math.max(0, itemTotalGross - itemDiscount);
    
    const rate = item.taxRate !== null && item.taxRate !== undefined ? item.taxRate : 5;
    const type = item.taxType || 'EXCLUSIVE';
    
    let itemTax = 0;
    let itemPayable = 0;
    let itemNetOfTax = 0;
    
    if (type === 'INCLUSIVE') {
      itemNetOfTax = itemNetAfterDiscount / (1 + (rate / 100));
      itemTax = itemNetAfterDiscount - itemNetOfTax;
      itemPayable = itemNetAfterDiscount;
    } else if (type === 'EXEMPT') {
      itemNetOfTax = itemNetAfterDiscount;
      itemTax = 0;
      itemPayable = itemNetAfterDiscount;
    } else { // EXCLUSIVE
      itemNetOfTax = itemNetAfterDiscount;
      itemTax = itemNetAfterDiscount * (rate / 100);
      itemPayable = itemNetAfterDiscount + itemTax;
    }
    
    return {
      totalNetSubtotal: acc.totalNetSubtotal + itemNetOfTax,
      totalTax: acc.totalTax + itemTax,
      totalPayable: acc.totalPayable + itemPayable
    };
  }, { totalNetSubtotal: 0, totalTax: 0, totalPayable: 0 });

  const tax = totalTax;
  const grandTotal = totalPayable;
  const displayedSubtotal = totalNetSubtotal;

  // Generate dynamic tax label
  const uniqueRates = Array.from(new Set(cart.map(item => item.taxRate !== null && item.taxRate !== undefined ? item.taxRate : 5)));
  const taxLabel = cart.length > 0 && uniqueRates.length === 1 ? `Taxes (${uniqueRates[0]}%)` : 'Taxes';

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading POS...</div>;

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-[#111111] text-slate-200' : 'bg-[#fdf8f8] text-[#2d1515]'} overflow-hidden font-sans selection:bg-pos-primary/30 transition-colors duration-500`}>
      {/* LEFT SIDEBAR - Categories (Dark & Sleek) */}
      <div className={`w-20 md:w-24 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-pos-primary/10 shadow-xl'} border-r flex flex-col items-center py-6 gap-6 z-20`}>
         <div className="w-12 h-12 bg-pos-primary/10 rounded-2xl flex items-center justify-center text-pos-primary mb-4">
            <ShoppingBag size={24} />
         </div>
         <nav className="flex flex-col gap-4 overflow-y-auto no-scrollbar pb-6 w-full px-2">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all transition-all duration-300 ${selectedCategory === 'all' ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/20 scale-105' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
            >
               <Grid size={20} />
               <span className="text-[10px] font-black uppercase tracking-tighter">All</span>
            </button>
            {categories.map((cat, idx) => (
               <button 
                 key={cat.id}
                 onClick={() => setSelectedCategory(cat.id)}
                 className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${selectedCategory === cat.id ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/20 scale-105' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
               >
                  <Utensils size={20} />
                  <span className="text-[10px] font-black uppercase tracking-tighter truncate w-full text-center px-1">{cat.name}</span>
               </button>
            ))}
         </nav>
      </div>

      {/* CENTER - Product Grid (Premium Dark Theme) */}
      <div className={`flex-1 flex flex-col h-full ${theme === 'dark' ? 'bg-[#111111]' : 'bg-white'} overflow-hidden`}>
        {/* Header/Search Bar */}
        <div className="p-6 pb-2 flex items-center justify-between gap-6">
           <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pos-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5 text-slate-200' : 'bg-white border-pos-primary/20 text-slate-800'} border focus:border-pos-primary/50 pl-12 pr-6 py-4 rounded-[1.25rem] outline-none transition-all placeholder:text-slate-600 font-bold`}
              />
           </div>
           <div className="flex items-center gap-3">
              <div className={`${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-pos-primary/10'} py-1 px-1 rounded-2xl flex border`}>
                 <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-pos-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><Grid size={20}/></button>
                 <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-pos-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><List size={20}/></button>
              </div>
           </div>
        </div>

        {/* Category Pastel Tiles - Inspired by Reference Image */}
        <div className="px-6 py-4 overflow-x-auto no-scrollbar flex gap-4">
           {categories.slice(0, 8).map((cat, idx) => {
              const colorClass = theme === 'dark'
                ? CATEGORY_COLORS_DARK[idx % 8]
                : CATEGORY_COLORS_LIGHT[idx % 8];
              const itemCount = products.filter(p => p.categoryId === cat.id).length;
              return (
                <button
                   key={cat.id}
                   onClick={() => setSelectedCategory(cat.id)}
                   className={`flex-none min-w-[140px] p-5 rounded-[1.5rem] transition-all duration-300 hover:scale-105 active:scale-95 ${colorClass} flex flex-col gap-3 ${selectedCategory === cat.id ? 'ring-4 ring-black/20 scale-105 shadow-2xl' : 'shadow-lg hover:shadow-xl'}`}
                 >
                   <div className="w-10 h-10 bg-black/10 rounded-xl flex items-center justify-center"><Utensils size={20}/></div>
                   <div>
                      <h3 className="font-black text-sm tracking-tight">{cat.name}</h3>
                      <p className="text-[10px] font-bold opacity-70">{itemCount} items</p>
                   </div>
                </button>
              );
           })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 scroll-smooth no-scrollbar">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
               {filteredProducts.map((product, idx) => {
                  const catIndex = categories.findIndex(c => c.id === product.categoryId);
                  const safeCatIndex = catIndex >= 0 ? catIndex : 0;
                  const paletteIdx = safeCatIndex % 12;
                  
                  const palette = theme === 'dark' ? PRODUCT_PALETTE_DARK : PRODUCT_PALETTE_LIGHT;
                  const cardColor = palette[paletteIdx];
                  const isInCart = cart.some(item => item.id === product.id);

                  // Dark phase base (before color animates in)
                  const darkBg = theme === 'dark' ? '#1c1c1c' : '#f0f0f0';
                  const darkIconBg = theme === 'dark' ? '#252525' : '#e8e8e8';
                  const darkText = theme === 'dark' ? '#2e2e2e' : '#d0d0d0';

                  const isColored = colorPhase === 'colored';
                  // Scattered order: multiply by prime (7) so card order is non-linear
                  // Result: 0,7,2,9,4,11,6,1,8,3,10,5 — jumps around the grid
                  const scatterStep = (idx * 7) % 12;
                  const staggerDelay = isColored ? `${scatterStep * 150}ms` : '0ms';
                  const transitionStr = (prop: string) =>
                    `${prop} ${isColored ? '1.2s' : '0.3s'} cubic-bezier(0.25,0.9,0.4,1) ${staggerDelay}`;

                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      style={{
                        backgroundColor: isColored ? cardColor.bg : darkBg,
                        transition: transitionStr('background-color'),
                        outline: isInCart && isColored ? `3px solid ${cardColor.border}` : 'none',
                        outlineOffset: '2px',
                      }}
                      className={`group relative rounded-[1.5rem] p-4 flex flex-col gap-2.5 text-left overflow-hidden hover:scale-[1.03] active:scale-[0.97] ${isInCart ? 'shadow-2xl' : 'hover:shadow-xl'}`}
                    >
                      {/* Hover glow */}
                      <div
                        className="absolute inset-0 rounded-[1.5rem] opacity-0 group-hover:opacity-100"
                        style={{
                          background: `radial-gradient(ellipse at top left, ${isColored ? cardColor.border : '#fff'}20 0%, transparent 60%)`,
                          transition: 'opacity 0.3s ease',
                        }}
                      />

                      {/* Icon box — top left, like reference */}
                      <div
                        style={{
                          backgroundColor: isColored ? `${cardColor.border}30` : darkIconBg,
                          transition: transitionStr('background-color'),
                          width: 40, height: 40,
                          borderRadius: '0.85rem',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ) : (
                          <Utensils
                            size={18}
                            style={{
                              color: isColored ? cardColor.text : darkText,
                              transition: transitionStr('color'),
                            }}
                          />
                        )}
                      </div>

                      {/* Name + Price */}
                      <div className="space-y-0.5 relative">
                        <h3
                          className="font-black text-[13px] leading-tight truncate w-full"
                          style={{
                            color: isColored ? cardColor.text : darkText,
                            transition: transitionStr('color'),
                          }}
                        >{product.name}</h3>
                        <p
                          className="text-[10px] font-bold"
                          style={{
                            color: isColored ? `${cardColor.text}bb` : darkText,
                            transition: transitionStr('color'),
                          }}
                        >₹{product.sellingPrice.toFixed(0)}</p>
                      </div>

                      {/* In Cart badge */}
                      {isInCart && (
                        <div
                          className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isColored ? cardColor.border : '#333',
                            color: isColored ? cardColor.text : '#888',
                            transition: transitionStr('background-color'),
                          }}
                        >
                          ✓ In Cart
                        </div>
                      )}

                      {/* Hover price badge */}
                      {!isInCart && (
                        <div
                          className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100"
                          style={{
                            backgroundColor: isColored ? cardColor.border : '#333',
                            color: isColored ? cardColor.text : '#aaa',
                            transition: 'opacity 0.2s ease',
                          }}
                        >
                          ₹{product.sellingPrice}
                        </div>
                      )}
                    </button>
                  );
               })}
            </div>
          ) : (
            <div className="space-y-3 flex flex-col pb-6">
              {filteredProducts.map(product => {
                const isInCart = cart.some(item => item.id === product.id);
                return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`w-full flex items-center gap-4 p-3 rounded-[1.25rem] transition-all text-left ${theme === 'dark' ? 'bg-[#1c1c1c] border-white/5 hover:bg-[#252525]' : 'bg-white border-slate-200 hover:bg-slate-50'} border ${isInCart ? 'ring-2 ring-pos-primary shadow-lg shadow-pos-primary/10' : 'hover:shadow-md'}`}
                >
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[0.85rem] overflow-hidden border flex flex-shrink-0 items-center justify-center ${theme === 'dark' ? 'bg-[#252525] border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <Utensils className={`${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} size={24} />}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-black text-[13px] md:text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{product.name}</h3>
                    <p className={`text-[10px] md:text-[11px] font-bold mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{product.category?.name || 'Uncategorized'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-black text-[15px] md:text-lg ${theme === 'dark' ? 'text-pos-primary' : 'text-pos-primary'}`}>₹{product.sellingPrice.toFixed(2)}</p>
                    {isInCart ? (
                      <div className="inline-block px-2 py-0.5 rounded-full bg-pos-primary/10 text-pos-primary mt-1">
                        <p className="text-[9px] uppercase font-black tracking-widest">In Cart</p>
                      </div>
                    ) : (
                      <p className={`text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-1.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>In Stock</p>
                    )}
                  </div>
                </button>
                );
              })}
            </div>
          )}
        </div>

        {/* BOTTOM BAR — Active Table Orders (CosyPOS style) */}
        {activeOrders.length > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-3 overflow-x-auto no-scrollbar border-t"
            style={{
              backgroundColor: theme === 'dark' ? '#181818' : '#f8f8f8',
              borderColor: theme === 'dark' ? '#2a2a2a' : '#ececec',
              minHeight: 72,
              flexShrink: 0,
            }}
          >
            {/* Total Customers / Tables Badge */}
            <div
              className="flex-shrink-0 flex flex-col items-center justify-center rounded-2xl px-4 py-2 mr-2"
              style={{
                backgroundColor: theme === 'dark' ? '#1e1e2e' : '#ede9fe',
                border: `2px solid ${theme === 'dark' ? '#6366f140' : '#8b5cf640'}`,
                minWidth: 80,
              }}
            >
              <span
                className="text-2xl font-black leading-none"
                style={{ color: theme === 'dark' ? '#a78bfa' : '#7c3aed' }}
              >
                {activeOrders.length}
              </span>
              <span
                className="text-[9px] font-black uppercase tracking-widest mt-0.5"
                style={{ color: theme === 'dark' ? '#7c3aed' : '#6d28d9' }}
              >
                Customers
              </span>
            </div>

            {/* Separator */}
            <div
              className="flex-shrink-0 w-px self-stretch"
              style={{ backgroundColor: theme === 'dark' ? '#2a2a2a' : '#e2e8f0', margin: '6px 0' }}
            />

            {activeOrders.map((order) => {
              const isCurrentTable = order.tableId === tableId;
              const statusColor =
                order.status === 'KOT_RUNNING' ? '#f97316'
                : order.status === 'BILL_PRINTED' ? '#3b82f6'
                : order.status === 'OCCUPIED' ? '#22c55e'
                : '#94a3b8';
              const statusLabel =
                order.status === 'KOT_RUNNING' ? 'In Kitchen'
                : order.status === 'BILL_PRINTED' ? 'Bill Printed'
                : order.status === 'OCCUPIED' ? 'In process'
                : 'Open';

              return (
                <button
                  key={order.tableId}
                  onClick={() => router.push(`/billing?tableId=${order.tableId}&tableNo=${order.tableName}`)}
                  className="flex items-center gap-3 flex-shrink-0 rounded-2xl px-4 py-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    backgroundColor: isCurrentTable
                      ? (theme === 'dark' ? '#2a2a2a' : '#fff')
                      : (theme === 'dark' ? '#222' : '#fff'),
                    border: `2px solid ${isCurrentTable ? statusColor : (theme === 'dark' ? '#2e2e2e' : '#e8e8e8')}`,
                    boxShadow: isCurrentTable ? `0 0 0 3px ${statusColor}30` : 'none',
                  }}
                >
                  {/* Table Number Box */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ backgroundColor: statusColor + '25', color: statusColor }}
                  >
                    {order.tableName.replace(/[^0-9A-Z]/gi, '').slice(0, 3) || order.tableName.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Order Info */}
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[13px] font-black"
                        style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b' }}
                      >
                        {order.tableName}
                      </span>
                      {/* Status pill */}
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: statusColor + '25', color: statusColor }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: theme === 'dark' ? '#64748b' : '#94a3b8' }}
                    >
                      {order.itemCount} items &rarr; Kitchen
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT SIDEBAR - Cart & Checkout (Dark/Sleek) */}
      <div className={`w-[400px] ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-pos-primary/20'} border-l flex flex-col h-full shadow-2xl z-10 transition-all duration-300`}>
        {/* Cart Header */}
        <div className="p-6 pb-4 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className={`text-xl font-black ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'} tracking-tight`}>Order Details</h2>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                   {tableName || (orderType === 'DELIVERY' ? 'Delivery Order' : orderType === 'PICKUP' ? 'Pick Up' : 'Counter Service')}
                 </p>
              </div>
              <button 
                onClick={() => setCart([])} 
                className="p-3 bg-white/5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all active:scale-95"
              >
                <Trash2 size={20} />
              </button>
           </div>

           {/* ── Order Type Toggle: Dine In / Delivery / Pick Up ── */}
           <div
             className="flex rounded-2xl p-1 gap-1"
             style={{ backgroundColor: theme === 'dark' ? '#111' : '#f1f1f1' }}
           >
             {([
               { key: 'DINE_IN',  label: 'Dine In',  emoji: '🍽️' },
               { key: 'DELIVERY', label: 'Delivery', emoji: '🏍️' },
               { key: 'PICKUP',   label: 'Pick Up',  emoji: '🛍️' },
             ] as const).map(({ key, label, emoji }) => {
               const isActive = orderType === key;
               const colors = {
                 DINE_IN:  '#4f46e5',
                 DELIVERY: '#e91e63',
                 PICKUP:   '#f97316',
               };
               return (
                 <button
                   key={key}
                   onClick={() => setOrderType(key)}
                   className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 flex items-center justify-center gap-1.5"
                   style={isActive ? {
                     backgroundColor: colors[key],
                     color: '#fff',
                     boxShadow: `0 4px 14px ${colors[key]}40`,
                   } : {
                     backgroundColor: 'transparent',
                     color: theme === 'dark' ? '#64748b' : '#334155',
                   }}
                 >
                   <span style={{ fontSize: 14 }}>{emoji}</span>
                   {label}
                 </button>
               );
             })}
           </div>

           {/* ── Guests at Table Counter (Dine In only) ── */}
           {orderType === 'DINE_IN' && (
             <div
               className="flex items-center justify-between rounded-2xl px-4 py-3"
               style={{
                 backgroundColor: theme === 'dark' ? '#111' : '#f1f5f9',
                 border: `1.5px solid ${theme === 'dark' ? '#2a2a2a' : '#e2e8f0'}`,
               }}
             >
               <div className="flex items-center gap-2">
                 <span style={{ fontSize: 18 }}>👥</span>
                 <div>
                   <p
                     className="text-[10px] font-black uppercase tracking-widest"
                     style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}
                   >
                     Guests at Table
                   </p>
                   <p
                     className="text-[11px] font-bold"
                     style={{ color: theme === 'dark' ? '#64748b' : '#94a3b8' }}
                   >
                     {guestCount === 1 ? '1 person' : `${guestCount} people`}
                   </p>
                 </div>
               </div>
               <div
                 className="flex items-center gap-2 rounded-xl p-1"
                 style={{ backgroundColor: theme === 'dark' ? '#1a1a2e' : '#ede9fe' }}
               >
                 <button
                   onClick={() => setGuestCount(g => Math.max(1, g - 1))}
                   className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg transition-all active:scale-90"
                   style={{
                     backgroundColor: guestCount <= 1 ? 'transparent' : (theme === 'dark' ? '#6366f130' : '#a78bfa30'),
                     color: guestCount <= 1 ? (theme === 'dark' ? '#334155' : '#cbd5e1') : '#7c3aed',
                   }}
                 >
                   −
                 </button>
                 <span
                   className="w-8 text-center font-black text-[18px]"
                   style={{ color: theme === 'dark' ? '#a78bfa' : '#7c3aed' }}
                 >
                   {guestCount}
                 </span>
                 <button
                   onClick={() => setGuestCount(g => Math.min(30, g + 1))}
                   className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg transition-all active:scale-90"
                   style={{
                     backgroundColor: theme === 'dark' ? '#6366f130' : '#a78bfa30',
                     color: '#7c3aed',
                   }}
                 >
                   +
                 </button>
               </div>
             </div>
           )}

           {/* Customer Search */}
           <div className="relative">
             <div className={`flex items-center gap-3 ${theme === 'dark' ? 'bg-[#111111] border-white/5' : 'bg-slate-50 border-pos-primary/10'} p-2 rounded-2xl border`}>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                  <input 
                    type="text" 
                    placeholder={selectedGuestId ? customers.find(c => c.id === selectedGuestId)?.firstName || 'Select customer...' : 'Select customer...'}
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    className="w-full bg-transparent text-[11px] font-bold pl-9 pr-8 py-2 outline-none"
                    style={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}
                  />
                  {selectedGuestId && (
                    <button 
                      onClick={() => { setSelectedGuestId(''); setCustomerSearch(''); }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-rose-500 hover:text-rose-400"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="p-2 bg-pos-primary text-white rounded-xl shadow-lg shadow-pos-primary/20 hover:scale-105 active:scale-95 transition-all flex-shrink-0"
                >
                   <UserPlus size={16} />
                </button>
             </div>
             
             {/* Customer Dropdown */}
             {showCustomerDropdown && (
               <div
                 className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto no-scrollbar"
                 style={{ 
                   backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff', 
                   border: `1px solid ${theme === 'dark' ? '#333' : '#e2e8f0'}` 
                 }}
               >
                 {customers
                   .filter(c =>
                     !customerSearch ||
                     c.firstName?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                     (c.mobile || '').includes(customerSearch)
                   )
                   .map((customer) => (
                     <button
                       key={customer.id}
                       type="button"
                       onMouseDown={(e) => { e.preventDefault(); setSelectedGuestId(customer.id); setShowCustomerDropdown(false); setCustomerSearch(''); }}
                       className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                       style={{
                         borderBottom: `1px solid ${theme === 'dark' ? '#2a2a2a' : '#f1f5f9'}`,
                       }}
                     >
                       <div className="w-8 h-8 rounded-xl bg-pos-primary/10 flex items-center justify-center flex-shrink-0 text-pos-primary font-black text-[10px]">
                         {customer.firstName?.charAt(0).toUpperCase() || 'C'}
                       </div>
                       <div>
                         <p className="text-[12px] font-bold" style={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>
                           {customer.firstName} {customer.lastName || ''}
                         </p>
                         <p className="text-[10px]" style={{ color: theme === 'dark' ? '#64748b' : '#94a3b8' }}>
                           {customer.mobile || 'No phone'}
                         </p>
                       </div>
                     </button>
                   ))}
                   {customers.filter(c => 
                     !customerSearch || 
                     c.firstName?.toLowerCase().includes(customerSearch.toLowerCase()) || 
                     (c.mobile || '').includes(customerSearch)
                   ).length === 0 && (
                     <div className="p-4 text-center text-[10px] uppercase font-black" style={{ color: theme === 'dark' ? '#64748b' : '#94a3b8' }}>
                       No customers found
                     </div>
                   )}
               </div>
             )}
           </div>

           {/* ── DRIVER REFERRAL SELECTION ── */}
           {/* Applicable to all order types because Dhaba drivers bring customers */}
           <div className="space-y-1.5" style={{ marginTop: 8 }}>
             <p className="text-[10px] font-black uppercase tracking-widest pl-1" style={{ color: theme === 'dark' ? '#f59e0b' : '#d97706' }}>
               🤝 Driver / Referral
             </p>

             {selectedDriver ? (
               /* Selected Driver Pill */
               <div
                 className="flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition-all"
                 style={{ backgroundColor: theme === 'dark' ? '#f59e0b15' : '#fffbeb', border: `1.5px solid ${theme === 'dark' ? '#f59e0b40' : '#f59e0b60'}` }}
                 onClick={() => { setSelectedDriver(null); setDriverSearch(''); }}
               >
                 <div
                   className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm"
                   style={{ backgroundColor: '#f59e0b', color: '#fff' }}
                 >
                   {selectedDriver.name.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="text-[12px] font-black truncate" style={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>
                     {selectedDriver.name}
                   </p>
                   <p className="text-[10px] font-bold" style={{ color: theme === 'dark' ? '#fcd34d' : '#d97706' }}>
                     {selectedDriver.phone || 'No phone'} · {selectedDriver.vehicleNumber || selectedDriver.vehicleType || 'Bike'}
                   </p>
                 </div>
                 <button className="text-[#f59e0b] hover:text-rose-500 transition-colors text-[16px] font-black pr-2">✕</button>
               </div>
             ) : (
               /* Driver Search Input + Dropdown */
               <div className="relative">
                 <div
                   className="flex items-center gap-2 rounded-xl px-3 py-2 transition-all focus-within:shadow-md"
                   style={{ 
                     backgroundColor: theme === 'dark' ? '#111111' : '#fff', 
                     border: `1px solid ${theme === 'dark' ? '#333' : '#e2e8f0'}` 
                   }}
                 >
                   <CarFront size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                   <input
                     type="text"
                     placeholder="Search driver by name or phone..."
                     value={driverSearch}
                     onChange={(e) => { setDriverSearch(e.target.value); setShowDriverDropdown(true); }}
                     onFocus={() => setShowDriverDropdown(true)}
                     onBlur={() => setTimeout(() => setShowDriverDropdown(false), 200)}
                     className="flex-1 bg-transparent text-[11px] font-bold outline-none placeholder:text-slate-500"
                     style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b' }}
                   />
                 </div>

                 {/* Dropdown */}
                 {showDriverDropdown && (
                   <div
                     className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-48 overflow-y-auto no-scrollbar"
                     style={{ 
                       backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff', 
                       border: `1px solid ${theme === 'dark' ? '#333' : '#e2e8f0'}` 
                     }}
                   >
                     {drivers
                       .filter(d =>
                         !driverSearch ||
                         d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                         (d.phone || '').includes(driverSearch)
                       )
                       .map((driver) => (
                         <button
                           key={driver.id}
                           type="button"
                           onMouseDown={(e) => { e.preventDefault(); setSelectedDriver(driver); setShowDriverDropdown(false); setDriverSearch(''); }}
                           className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                           style={{
                             borderBottom: `1px solid ${theme === 'dark' ? '#2a2a2a' : '#f1f5f9'}`,
                           }}
                           onMouseEnter={e => (e.currentTarget.style.backgroundColor = theme === 'dark' ? '#2a2a2a' : '#f8fafc')}
                           onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                         >
                           <div
                             className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 shadow-sm"
                             style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}
                           >
                             {driver.name.charAt(0).toUpperCase()}
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-[12px] font-black truncate" style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b' }}>
                               {driver.name}
                             </p>
                             <p className="text-[10px] font-bold" style={{ color: theme === 'dark' ? '#64748b' : '#94a3b8' }}>
                               {driver.phone || 'No phone'} · {driver.vehicleNumber || driver.vehicleType || 'Bike'}
                             </p>
                           </div>
                           <span
                             className="text-[9px] font-black px-2 py-0.5 rounded-full flex-shrink-0"
                             style={{ backgroundColor: driver.isActive ? '#22c55e20' : '#94a3b820', color: driver.isActive ? '#22c55e' : '#94a3b8' }}
                           >
                             {driver.isActive ? 'Active' : 'Inactive'}
                           </span>
                         </button>
                       ))
                     }
                     {drivers.filter(d =>
                       !driverSearch ||
                       d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
                       (d.phone || '').includes(driverSearch)
                     ).length === 0 && (
                       <p className="text-center text-[11px] font-bold py-4" style={{ color: '#64748b' }}>No drivers in registry</p>
                     )}
                   </div>
                 )}
               </div>
             )}
           </div>

           {/* Delivery-specific extra fields (Address / Phone) */}
           {orderType === 'DELIVERY' && (
             <div
               className="rounded-2xl p-3 space-y-3"
               style={{ backgroundColor: theme === 'dark' ? '#130810' : '#fff0f5', border: '1.5px solid #e91e6340' }}
             >
               <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#e91e63' }}>🏍️ Delivery Info</p>

               {/* Address + Phone */}
               <div style={{ borderTop: '1px solid #e91e6320', paddingTop: 2 }}>
                 <input
                   type="text"
                   placeholder="Delivery address..."
                   className="w-full bg-transparent text-[11px] font-bold outline-none placeholder:text-slate-600 pb-2"
                   style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b', borderBottom: '1px solid #e91e6315' }}
                 />
               </div>
               <input
                 type="text"
                 placeholder="Customer phone..."
                 className="w-full bg-transparent text-[11px] font-bold outline-none placeholder:text-slate-600"
                 style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b' }}
               />
             </div>
           )}

           {/* Pick Up extra fields */}
           {orderType === 'PICKUP' && (
             <div
               className="rounded-2xl p-3 space-y-2.5"
               style={{ backgroundColor: theme === 'dark' ? '#130a03' : '#fff8f0', border: '1.5px solid #f9731640' }}
             >
               <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: '#f97316' }}>🛍️ Pickup Info</p>
               <div style={{ borderBottom: '1px solid #f9731620', paddingBottom: 8 }}>
                 <input
                   type="text"
                   placeholder="Customer name..."
                   className="w-full bg-transparent text-[11px] font-bold outline-none placeholder:text-slate-600"
                   style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b' }}
                 />
               </div>
               <input
                 type="text"
                 placeholder="Token / Order No..."
                 className="w-full bg-transparent text-[11px] font-bold outline-none placeholder:text-slate-600"
                 style={{ color: theme === 'dark' ? '#e2e8f0' : '#1e293b' }}
               />
             </div>
           )}
        </div>


         {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-2 no-scrollbar">
          {cart.length === 0 ? (
            <div className={`h-full flex flex-col items-center justify-center text-center gap-4 mt-[-40px] ${theme === 'dark' ? 'opacity-30' : 'opacity-40'}`}>
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-500'}`}><ShoppingBag size={48}/></div>
              <p className={`font-black text-xs uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white' : 'text-slate-600'}`}>Cart is Empty</p>
            </div>
          ) : (
            <div className="space-y-4">
               {cart.map(item => (
                <div key={item.id} className={`group ${theme === 'dark' ? 'bg-[#111111] border-white/5' : 'bg-white border-pos-primary/10'} rounded-3xl p-4 border hover:border-pos-primary/20 transition-all flex items-center justify-between gap-4`}>
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 overflow-hidden flex-shrink-0">
                     {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700"><Utensils size={18} /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[12px] font-black text-slate-200 truncate">{item.name}</h4>
                    <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">₹{item.sellingPrice.toFixed(2)}</span>
                  </div>
                   <div className="flex items-center gap-3">
                    <div className={`flex items-center ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-slate-100 border-pos-primary/10'} border rounded-xl p-1`}>
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-pos-primary transition-colors"><Minus size={12}/></button>
                      <span className="px-3 text-[11px] font-black text-slate-200">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-pos-primary transition-colors"><Plus size={12}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout Button */}
        <div className={`p-6 ${theme === 'dark' ? 'bg-[#111111] border-white/5' : 'bg-white border-pos-primary/10'} border-t space-y-4`}>
          {/* Membership Card Input in Totals */}
          <div className="space-y-1.5 mb-2">
            {membershipCard ? (
              <div 
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition-all cursor-pointer border border-indigo-500/30"
                style={{ backgroundColor: theme === 'dark' ? '#6366f110' : '#f5f3ff' }}
                onClick={() => setMembershipCard(null)}
              >
                <div className="flex items-center gap-2">
                   <Trophy size={14} className="text-indigo-500" />
                   <span className="text-[11px] font-black uppercase text-indigo-500">{membershipCard.membershipPlan.name}</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[11px] font-black text-emerald-500">-{membershipCard.membershipPlan.discountValue}{membershipCard.membershipPlan.discountType === 'PERCENTAGE' ? '%' : ''}</span>
                   <Trash2 size={12} className="text-slate-400" />
                </div>
              </div>
            ) : (
              <div className={`relative flex items-center gap-2 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-slate-50 border-slate-200'} px-3 py-2 rounded-xl border group transition-all focus-within:border-indigo-500/40`}>
                 <QrCode className="text-slate-500" size={14} />
                 <input 
                   type="text"
                   placeholder="Promo / Membership #"
                   value={membershipSearch}
                   onChange={(e) => setMembershipSearch(e.target.value)}
                   onKeyDown={(e) => {
                      if (e.key === 'Enter' && membershipSearch.trim()) {
                         validateMembership(membershipSearch.trim());
                      }
                   }}
                   className="w-full bg-transparent text-[10px] font-bold outline-none"
                   style={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}
                 />
                 {isValidatingMembership && (
                    <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                 )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-widest">
              <span>Sub-Total</span>
              <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>₹{displayedSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-widest">
              <span>{taxLabel}</span>
              <span className={theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}>₹{tax.toFixed(2)}</span>
            </div>
            <div className="h-px bg-white/5 my-2" />
            <div className="flex justify-between items-center pt-2">
              <div>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Payable Amount</span>
                 <p className="text-3xl font-black text-pos-primary tracking-tighter">₹{grandTotal.toFixed(2)}</p>
              </div>
              <div className="relative">
                 <div className="absolute inset-0 bg-emerald-500/20 blur-xl animate-pulse" />
                 <ShoppingBag className="relative text-emerald-500" size={32} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
               onClick={handlePrintKOT}
               loading={saveLoading}
               disabled={cart.length === 0}
               className={`py-4 rounded-2xl ${theme === 'dark' ? 'bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 hover:bg-emerald-500 hover:text-white border-emerald-200 text-emerald-700'} border font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              <Printer size={18} /> KOT
            </Button>
            <Button 
               onClick={handleSimpleSave}
               loading={saveLoading}
               disabled={cart.length === 0}
               className={`py-4 rounded-2xl ${theme === 'dark' ? 'bg-blue-500/10 hover:bg-blue-500 hover:text-white border-blue-500/20 text-blue-500' : 'bg-blue-50 hover:bg-blue-500 hover:text-white border-blue-200 text-blue-700'} border font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              <Save size={18} /> SAVE
            </Button>
            <Button 
               onClick={() => {
                 setIsProforma(true);
                 setAutoPrint(true);
                 handlePrintBill();
               }}
               disabled={!activeOrder && cart.length === 0}
               className={`py-4 rounded-2xl ${theme === 'dark' ? 'bg-amber-500/10 hover:bg-amber-500 hover:text-white border-amber-500/20 text-amber-500' : 'bg-amber-50 hover:bg-amber-500 hover:text-white border-amber-200 text-amber-700'} border font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              <Printer size={18} /> BILL
            </Button>
            <Button 
               disabled={cart.length === 0}
               onClick={() => {
                 setIsProforma(true);
                 setAutoPrint(false); // Settle still needs the modal for payment selection
                 handlePrintBill();
               }}
               className={`py-4 rounded-2xl ${theme === 'dark' ? 'bg-rose-500/10 hover:bg-rose-500 hover:text-white border-rose-500/20 text-rose-500' : 'bg-rose-50 hover:bg-rose-500 hover:text-white border-rose-200 text-rose-700'} border font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2`}
            >
               <CreditCard size={18} /> SETTLE (F1)
            </Button>
          </div>
        </div>
      </div>

      {/* MODALS - DARK THEME */}
      {/* (Settlement Modal, Customer Modal etc. inherit dark theme from globals or need specific overrides) */}


      {/* KotSlipModal & BillModal will inherit styles or need manual dark theme updates */}
      {isKotOpen && (
        <KotSlipModal 
          kot={kotData} 
          onClose={() => {
            setIsKotOpen(false);
            router.push('/operations/tables');
          }} 
        />
      )}

      <BillModal 
        bill={billData} 
        onClose={() => {
            setIsBillOpen(false);
            setBillData(null);
            setAutoPrint(false);
        }} 
        onSettle={handleSettleNew}
        paymentModes={paymentModes}
        customers={customers}
        guestId={selectedGuestId}
        onAddCustomer={async (data) => {
            const newGuest = await customersApi.create(data);
            if (newGuest) {
                loadData();
                return newGuest;
            }
            throw new Error('Failed to add customer');
        }}
        isProforma={isProforma} 
        autoPrint={autoPrint}
      />

      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="New Guest Registration"
      >
        <CustomerForm 
          onSubmit={handleCreateCustomer}
          onCancel={() => setIsCustomerModalOpen(false)}
          loading={customerMutationLoading}
        />
      </Modal>
    </div>
  );
}
