'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { 
  Plus, Search, Trash2, User as UserIcon, CreditCard, Percent, Pause, RotateCcw,
  Grid, List, ShoppingBag, Utensils, Minus, ChevronRight, ChevronLeft, Printer, 
  Save, CheckCircle2, UserPlus, CarFront, Trophy, QrCode, Star, Receipt,
  Coffee, IceCream, Pizza, Soup, CookingPot, ChefHat, CupSoda,
  Cake, Fish, Popcorn, Sandwich, Wine, Gift, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { productsApi, Product } from '@/lib/api/products';
import { categoriesApi, Category } from '@/lib/api/categories';
import { ordersApi } from '@/lib/api/orders';
import { paymentModesApi, PaymentMode } from '@/lib/api/payment-modes';
import { customersApi, Customer } from '@/lib/api/customers';
import { driversApi } from '@/lib/api/drivers';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { KotSlipModal } from '@/components/kots/KotSlipModal';
import { BillModal, BillData } from '@/components/billing/BillModal';
import { CustomerForm } from '@/components/forms/customer-form';
import { DriverForm } from '@/components/forms/driver-form';
import { useToast } from '@/components/ui/Toast';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useSidebar } from '@/context/sidebar-context';
import { printerService } from '@/lib/printer-service';
import { ProductIcon } from '@/components/shared/product-icon';
import { QRCodeSVG } from 'qrcode.react';

interface CartItem extends Product {
  quantity: number;
  size?: string;
  cartItemId: string;
  isComplimentary?: boolean;
  replacedFrom?: string; // name of original item before replacement
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

// Light mode product card colors - More vibrant than before
const PRODUCT_PALETTE_LIGHT = [
  { bg: '#C8E6C9', border: '#4CAF50', text: '#1B5E20', textSub: '#2E7D32' },  // Green
  { bg: '#E1BEE7', border: '#9C27B0', text: '#4A148C', textSub: '#6A1B9A' },  // Purple
  { bg: '#B3E5FC', border: '#03A9F4', text: '#01579B', textSub: '#0277BD' },  // Blue
  { bg: '#F8BBD0', border: '#E91E63', text: '#880E4F', textSub: '#AD1457' },  // Pink
  { bg: '#FFF9C4', border: '#FBC02D', text: '#F57F17', textSub: '#F9A825' },  // Yellow
  { bg: '#B2DFDB', border: '#009688', text: '#004D40', textSub: '#00695C' },  // Teal
  { bg: '#FFCCBC', border: '#FF5722', text: '#BF360C', textSub: '#D84315' },  // Orange
  { bg: '#CFD8DC', border: '#607D8B', text: '#263238', textSub: '#37474F' },  // Grey
  { bg: '#DCEDC8', border: '#8BC34A', text: '#33691E', textSub: '#558B2F' },  // Lime
  { bg: '#FFECB3', border: '#FFC107', text: '#FF6F00', textSub: '#FF8F00' },  // Amber
  { bg: '#FFCDD2', border: '#F44336', text: '#B71C1C', textSub: '#C62828' },  // Red
  { bg: '#B2EBF2', border: '#00BCD4', text: '#006064', textSub: '#00838F' },  // Cyan
];

export default function BillingPage() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';
  const tableId = searchParams.get('tableId');
  const tableName = searchParams.get('tableName') || searchParams.get('tableNo');
  const parkingSlotId = searchParams.get('parkingSlotId');
  const slotName = searchParams.get('slotName');
  const orderIdParam = searchParams.get('orderId');

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [products, setProducts] = useState<Product[]>([]);
  const [combos, setCombos] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'ALL' | 'VEG' | 'NON-VEG'>('ALL');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrderComplimentary, setIsOrderComplimentary] = useState(false);
  const [isOrderPaid, setIsOrderPaid] = useState(false);
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
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);
  const [driverMutationLoading, setDriverMutationLoading] = useState(false);
  // Order type toggle
  const [orderType, setOrderType] = useState<'DINE_IN' | 'DELIVERY' | 'PICKUP'>('DINE_IN');
  // Delivery details states
  const [deliveryCustomerName, setDeliveryCustomerName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  // Number of guests/customers at the table
  const [guestCount, setGuestCount] = useState<number>(1);
  // Membership Card state
  const [membershipCard, setMembershipCard] = useState<any>(null);
  const [membershipSearch, setMembershipSearch] = useState('');
  const [isValidatingMembership, setIsValidatingMembership] = useState(false);
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [manualDiscountType, setManualDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  
  // CRM Loyalty & Coupon states
  const [redeemPointsInput, setRedeemPointsInput] = useState<number>(0);
  const [couponCodeInput, setCouponCodeInput] = useState<string>('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string>('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [showWaiterSearch, setShowWaiterSearch] = useState(false);
  const [waiterSearchQuery, setWaiterSearchQuery] = useState('');
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
  // Replace item state
  const [replaceTarget, setReplaceTarget] = useState<any | null>(null);
  const [replaceSearch, setReplaceSearch] = useState('');

  const { addToast } = useToast();
  const { setHidden, isOpen, setOpen } = useSidebar();

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

  // Make sidebar hidden when closed, and visible when opened
  useEffect(() => {
    if (!isOpen) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  }, [isOpen, setHidden]);

  useEffect(() => {
    // Automatically hide the sidebar when on the billing page
    setOpen(false);
    setHidden(true);
    return () => {
      setOpen(true);
      setHidden(false);
    };
  }, [setOpen, setHidden]);

  // Color animation: dark → scattered color pop-in
  useEffect(() => {
    // Entrance: start dark, then stagger colors in (scattered order)
    const enterTimer = setTimeout(() => setColorPhase('colored'), 400);

    return () => {
      clearTimeout(enterTimer);
    };
  }, []);

  // Initial load of master data
  useEffect(() => {
    loadData();
    fetchAllActiveOrders();
    const ordersInterval = setInterval(fetchAllActiveOrders, 15000);
    return () => clearInterval(ordersInterval);
  }, []);

  // Effect to handle table switching
  useEffect(() => {
    if (tableId || orderIdParam || parkingSlotId) {
      // Clear current cart and order when switching parameters to avoid showing stale data
      setCart([]);
      setActiveOrder(null);
      fetchActiveOrder();
    } else {
      setActiveOrder(null);
      setCart([]);
    }
  }, [tableId, orderIdParam, parkingSlotId]);

  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'DELIVERY') setOrderType('DELIVERY');
    if (type === 'PICKUP') setOrderType('PICKUP');
    if (type === 'DINE_IN') setOrderType('DINE_IN');
  }, [searchParams]);

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

  const fetchStaffMembers = async (propertyId?: string | null) => {
    try {
      const url = propertyId ? `/api/staff-members?propertyId=${propertyId}` : '/api/staff-members';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setStaffMembers(data.data);
    } catch (err) {
      console.error('Failed to fetch staff members:', err);
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
          fetchStaffMembers(propId); // fetch staff scoped to THIS restaurant
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
      const [pData, cData, pmData, custData, propData, comboRes] = await Promise.all([
        productsApi.list(),
        categoriesApi.list(),
        paymentModesApi.list(),
        customersApi.list(),
        fetch('/api/setup/properties/current').then(r => r.json()),
        fetch('/api/combos').then(r => r.json())
      ]);
      setProducts(pData);
      setCategories(cData);
      setPaymentModes(pmData);
      setCustomers(custData);
      if (comboRes.success) setCombos(comboRes.data);
      if (propData.success) setProperty(propData.data);
      
      // Fetch drivers reliably on load
      fetchDrivers();
      fetchStaffMembers();
    } catch (err) {
      addToast('error', 'Error loading POS data');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveOrder = async () => {
    if (!tableId && !orderIdParam && !parkingSlotId) return;
    try {
      // Priority: Specific orderId -> Parking Slot -> Table
      let query = '';
      if (orderIdParam) {
        query = `orderId=${orderIdParam}`;
      } else if (parkingSlotId) {
        query = `parkingSlotId=${parkingSlotId}&status=in_progress`;
      } else {
        query = `restaurantTableId=${tableId}&status=in_progress`;
      }
        
      const response = await fetch(`/api/pos-orders?${query}`);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        // Merge all items from all active orders for this table/query
        const allOrders = Array.isArray(result.data) ? result.data : [result.data];
        
        // Use the first order as the "active" one for metadata purposes
        const firstOrder = allOrders[0];
        setActiveOrder(firstOrder);
        setSelectedStaffId(firstOrder.staffMemberId || '');
        
        if (firstOrder.orderType) {
          setOrderType(firstOrder.orderType === 'TAKEAWAY' ? 'PICKUP' : firstOrder.orderType);
        }
        if (firstOrder.guestId) {
          setSelectedGuestId(firstOrder.guestId);
        }
        if (firstOrder.driverId) {
          const matchedDriver = drivers.find((d: any) => d.id === firstOrder.driverId);
          if (matchedDriver) {
            setSelectedDriver(matchedDriver);
          } else if (firstOrder.driver) {
            setSelectedDriver(firstOrder.driver);
          }
        } else {
          setSelectedDriver(null);
        }
        setDeliveryCustomerName(firstOrder.deliveryCustomerName || '');
        setDeliveryPhone(firstOrder.deliveryPhone || '');
        setDeliveryAddress(firstOrder.deliveryAddress || '');
        setDeliveryInstructions(firstOrder.deliveryInstructions || '');

        const mergedItems: any[] = [];
        
        allOrders.forEach((order: any) => {
          order.items.forEach((i: any) => {
            const size = i.portion || i.variantName || 'Full';
            const cartItemId = `${i.productId}-${size}`;
            
            // Check if this item (same product + same size) already exists in our merged list
            const existing = mergedItems.find(mi => mi.cartItemId === cartItemId);
            if (existing) {
              existing.quantity += i.quantity;
            } else {
              mergedItems.push({
                ...i.product,
                quantity: i.quantity,
                sellingPrice: i.unitPrice,
                size: size,
                cartItemId: cartItemId,
                variantId: i.variantId,
                variantName: i.variantName,
                portion: i.portion
              });
            }
          });
        });
        
        const finalItems = mergedItems.filter(item => item.quantity > 0);
        setCart(finalItems);
      } else {
        setActiveOrder(null);
        setCart([]);
        setDeliveryCustomerName('');
        setDeliveryPhone('');
        setDeliveryAddress('');
        setDeliveryInstructions('');
      }
    } catch (err) {
      console.error('Failed to fetch active order:', err);
    }
  };

  const addToCart = (product: Product | any, size: string = 'Full', price?: number, isCombo: boolean = false) => {
    setCart(prev => {
      const cartItemId = isCombo ? `combo-${product.id}` : `${product.id}-${size}`;
      const existing = prev.find(item => item.cartItemId === cartItemId);
      
      let itemPrice = price ?? product.sellingPrice;
      let itemName = product.name;
      
      if (!isCombo && size !== 'Full') {
        itemName = `${product.name} (${size})`;
      }

      if (existing) {
        return prev.map((item: any) => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        ...product, 
        name: itemName, 
        sellingPrice: itemPrice, 
        cartItemId, 
        size, 
        quantity: 1,
        isCombo: isCombo 
      }];
    });
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const replaceCartItem = (oldCartItemId: string, newProduct: Product, size: string = 'Full', price?: number) => {
    const oldItem = cart.find(i => i.cartItemId === oldCartItemId);
    if (oldItem) {
      // Auto-log to waste management
      fetch('/api/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: oldItem.id,
          productName: oldItem.name,
          quantity: oldItem.quantity,
          reason: 'Customer Return',
          notes: `Replaced with ${newProduct.name}`,
          orderNo: activeOrder?.orderNo || undefined,
          tableNo: slotName || tableName || activeOrder?.tableNo || undefined,
        })
      }).catch(err => console.error('Failed to log waste:', err));
    }

    setCart(prev => {
      const prevOld = prev.find(i => i.cartItemId === oldCartItemId);
      if (!prevOld) return prev;
      const oldName = prevOld.name; // capture original name
      const newCartItemId = `${newProduct.id}-${size}`;
      const newPrice = price ?? newProduct.sellingPrice;
      const newName = size !== 'Full' ? `${newProduct.name} (${size})` : newProduct.name;
      // Check if same product already exists elsewhere in cart
      const existingIdx = prev.findIndex(i => i.cartItemId === newCartItemId && i.cartItemId !== oldCartItemId);
      if (existingIdx >= 0) {
        // Merge quantities
        const updated = prev.map((i, idx) => idx === existingIdx ? { ...i, quantity: i.quantity + prevOld.quantity } : i);
        return updated.filter(i => i.cartItemId !== oldCartItemId);
      }
      return prev.map(i => i.cartItemId === oldCartItemId ? {
        ...newProduct,
        name: newName,
        sellingPrice: newPrice,
        cartItemId: newCartItemId,
        size,
        quantity: prevOld.quantity,
        replacedFrom: oldName, // store original name
      } : i);
    });
    setReplaceTarget(null);
    setReplaceSearch('');
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map((item: any) => {
      if (item.cartItemId === cartItemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const toggleSize = (cartItemId: string) => {
    setCart(prev => {
      const itemToToggle = prev.find(i => i.cartItemId === cartItemId);
      if (!itemToToggle) return prev;

      const newSize = itemToToggle.size === 'Half' ? 'Full' : 'Half';
      const newCartItemId = `${itemToToggle.id}-${newSize}`;

      const baseProduct = products.find(p => p.id === itemToToggle.id);
      if (!baseProduct) return prev;

      let itemPrice = baseProduct.sellingPrice;
      let itemName = baseProduct.name;
      if (newSize === 'Half') {
        if (!(baseProduct as any).halfPrice) return prev;
        itemPrice = (baseProduct as any).halfPrice;
        itemName = `${baseProduct.name} (Half)`;
      }

      const existingNewSizeIndex = prev.findIndex(i => i.cartItemId === newCartItemId);
      
      let newCart = [...prev];
      if (existingNewSizeIndex >= 0) {
        newCart[existingNewSizeIndex] = {
          ...newCart[existingNewSizeIndex],
          quantity: newCart[existingNewSizeIndex].quantity + itemToToggle.quantity
        };
        newCart = newCart.filter(i => i.cartItemId !== cartItemId);
      } else {
        newCart = newCart.map(i => {
          if (i.cartItemId === cartItemId) {
            return {
              ...i,
              size: newSize,
              cartItemId: newCartItemId,
              sellingPrice: itemPrice,
              name: itemName
            };
          }
          return i;
        });
      }
      return newCart;
    });
  };

  const changeVariant = (cartItemId: string, variantName: string, variantPrice: number) => {
    setCart(prev => {
      const itemToChange = prev.find(i => i.cartItemId === cartItemId);
      if (!itemToChange) return prev;

      const newCartItemId = `${itemToChange.id}-${variantName}`;
      const baseProduct = products.find(p => p.id === itemToChange.id);
      if (!baseProduct) return prev;

      const itemName = variantName === 'Full' ? baseProduct.name : `${baseProduct.name} (${variantName})`;
      
      const existingIndex = prev.findIndex(i => i.cartItemId === newCartItemId);
      
      if (existingIndex >= 0 && newCartItemId !== cartItemId) {
        const updatedCart = [...prev];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + itemToChange.quantity
        };
        return updatedCart.filter(i => i.cartItemId !== cartItemId);
      } else {
        return prev.map(i => i.cartItemId === cartItemId ? {
          ...i,
          size: variantName,
          cartItemId: newCartItemId,
          sellingPrice: variantPrice,
          name: itemName
        } : i);
      }
    });
  };

  const handleSimpleSave = async (actionType: 'SAVE' | 'HOLD' = 'SAVE') => {
    if (cart.length === 0) return;
    setSaveLoading(true);
    try {
      const payload = {
        restaurantTableId: tableId || undefined,
        parkingSlotId: parkingSlotId || undefined,
        orderType: parkingSlotId ? 'PARKING' : (orderType === 'PICKUP' ? 'TAKEAWAY' : orderType),
        staffMemberId: selectedStaffId || undefined,
        items: cart.map((item: any) => {
          const itemTotalGross = isOrderComplimentary ? 0 : (item.sellingPrice * item.quantity);
          const itemDiscount = grossSubtotal > 0 ? (itemTotalGross / grossSubtotal) * combinedDiscount : 0;
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
            portion: item.size === 'Half' || item.size === 'Full' ? item.size : null,
            variantName: item.size !== 'Half' && item.size !== 'Full' ? item.size : null,
            name: item.name 
          };
        }),
        guestId: selectedGuestId || undefined,
        guestCount: orderType === 'DINE_IN' ? guestCount : 1,
        driverId: selectedDriver?.id || undefined,
        orderId: orderIdParam || activeOrder?.id || undefined,
        deliveryCustomerName: orderType === 'DELIVERY' || orderType === 'PICKUP' ? deliveryCustomerName || undefined : undefined,
        deliveryPhone: orderType === 'DELIVERY' || orderType === 'PICKUP' ? deliveryPhone || undefined : undefined,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress || undefined : undefined,
        deliveryInstructions: orderType === 'DELIVERY' || orderType === 'PICKUP' ? deliveryInstructions || undefined : undefined,
        holdOrder: actionType === 'HOLD' ? true : undefined
      };

      const response = await fetch('/api/pos-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success) {
        addToast('success', actionType === 'HOLD' ? 'Order held successfully' : 'Order saved successfully');
        // Refresh active order to sync (get core IDs, items properly linked)
        fetchActiveOrder();
        fetchAllActiveOrders();
        // Redirect to appropriate operations page
        router.push(parkingSlotId ? `${p}/operations/parking` : `${p}/operations/tables`);
      }
    } catch (err) {
      addToast('error', actionType === 'HOLD' ? 'Failed to hold order' : 'Failed to save order');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrintKOT = async (showModal: boolean = true) => {
    if (cart.length === 0) return;
    setSaveLoading(true);
    try {
      const payload = {
        restaurantTableId: tableId || undefined,
        parkingSlotId: parkingSlotId || undefined,
        orderType: parkingSlotId ? 'PARKING' : (orderType === 'PICKUP' ? 'TAKEAWAY' : orderType),
        staffMemberId: selectedStaffId || undefined,
        items: cart.map((item: any) => {
          const itemTotalGross = isOrderComplimentary ? 0 : (item.sellingPrice * item.quantity);
          const itemDiscount = grossSubtotal > 0 ? (itemTotalGross / grossSubtotal) * combinedDiscount : 0;
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
            portion: item.size === 'Half' || item.size === 'Full' ? item.size : null,
            variantName: item.size !== 'Half' && item.size !== 'Full' ? item.size : null,
            name: item.name 
          };
        }),
        guestId: selectedGuestId || undefined,
        guestCount: orderType === 'DINE_IN' ? guestCount : 1,
        driverId: selectedDriver?.id || undefined,
        orderId: orderIdParam || activeOrder?.id || undefined,
        deliveryCustomerName: orderType === 'DELIVERY' || orderType === 'PICKUP' ? deliveryCustomerName || undefined : undefined,
        deliveryPhone: orderType === 'DELIVERY' || orderType === 'PICKUP' ? deliveryPhone || undefined : undefined,
        deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress || undefined : undefined,
        deliveryInstructions: orderType === 'DELIVERY' || orderType === 'PICKUP' ? deliveryInstructions || undefined : undefined
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
            tableNo: slotName || tableName || (orderType === 'DELIVERY' ? 'Delivery' : orderType === 'PICKUP' ? 'Pick Up' : 'Counter'),
            orderType: orderData.orderType,
            createdAt: latestKot.createdAt,
            items: latestKot.items.map((item: any) => ({
              name: item.itemName || item.name || item.product?.name || "Item",
              quantity: item.quantity,
              notes: item.notes
            }))
          });
          if (showModal) {
            setIsKotOpen(true);
          }

          // Direct thermal printing via Backend API
          // Skip paper print if showModal is false (Save & KOT flow)
          if (property?.enableDirectPrinting && showModal) {
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

        // If showModal is false, it means we want to save and redirect immediately (Save & KOT flow)
        if (!showModal) {
          router.push(parkingSlotId ? `${p}/operations/parking` : `${p}/operations/tables`);
        }
      }
    } catch (err) {
      addToast('error', 'Failed to generate KOT');
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePrintBill = async (saveFirst: boolean = false) => {
    if (saveFirst && cart.length > 0) {
      setSaveLoading(true);
      try {
        const payload = {
          restaurantTableId: tableId || undefined,
          parkingSlotId: parkingSlotId || undefined,
          orderType: parkingSlotId ? 'PARKING' : (orderType === 'PICKUP' ? 'TAKEAWAY' : orderType),
          items: cart.map((item: any) => {
            const itemTotalGross = isOrderComplimentary ? 0 : (item.sellingPrice * item.quantity);
            const itemDiscount = grossSubtotal > 0 ? (itemTotalGross / grossSubtotal) * combinedDiscount : 0;
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
              portion: item.size === 'Half' || item.size === 'Full' ? item.size : null,
              variantName: item.size !== 'Half' && item.size !== 'Full' ? item.size : null,
              name: item.name 
            };
          }),
          guestId: selectedGuestId || undefined,
          guestCount: orderType === 'DINE_IN' ? guestCount : 1,
          driverId: selectedDriver?.id || undefined,
          deliveryCustomerName: orderType === 'DELIVERY' || orderType === 'PICKUP' ? deliveryCustomerName || undefined : undefined,
          deliveryPhone: orderType === 'DELIVERY' || orderType === 'PICKUP' ? deliveryPhone || undefined : undefined,
          deliveryAddress: orderType === 'DELIVERY' ? deliveryAddress || undefined : undefined,
          deliveryInstructions: orderType === 'DELIVERY' || orderType === 'PICKUP' ? deliveryInstructions || undefined : undefined
        };

        const response = await fetch('/api/pos-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success) {
          addToast('success', 'Order saved successfully');
          // Update active order with the result
          setActiveOrder(result.data);
          fetchAllActiveOrders();
        }
      } catch (err) {
        addToast('error', 'Failed to save order before printing');
        setSaveLoading(false);
        return;
      } finally {
        setSaveLoading(false);
      }
    }

    // Priority: If cart has items, use cart data. Otherwise fallback to activeOrder.
    const hasCartItems = cart.length > 0;
    
    const orderToPrint = hasCartItems ? {
      id: activeOrder?.id,
      orderNo: activeOrder?.orderNo || `POS-${Date.now()}`,
      tableNo: slotName || tableName || activeOrder?.tableNo || (orderType === 'DELIVERY' ? 'Delivery' : orderType === 'PICKUP' ? 'Take Away' : 'Walk-in'),
      items: cart.map((item: any) => ({
        product: item,
        quantity: item.quantity,
        unitPrice: isOrderComplimentary ? 0 : item.sellingPrice,
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
      tableNo: slotName || tableName || orderToPrint.tableNo || (orderToPrint.orderType === 'DELIVERY' ? 'Delivery' : (orderToPrint.orderType === 'TAKEAWAY' || orderToPrint.orderType === 'PICKUP' || orderToPrint.orderType === 'PARKING') ? 'Take Away' : 'Walk-in'),
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
      staffMemberId: selectedStaffId || activeOrder?.staffMemberId || undefined,
      membershipDiscount: membershipDiscountAmount || orderToPrint.membershipDiscount || 0,
      manualDiscount: manualDiscountAmount || orderToPrint.manualDiscount || 0,
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
        parkingSlotId: parkingSlotId || undefined,
        orderType: parkingSlotId ? 'PARKING' : (orderType === 'PICKUP' ? 'TAKEAWAY' : orderType),
        staffMemberId: selectedStaffId || undefined,
        paymentModeId: paymentModeId,
        guestId: guestId || selectedGuestId || undefined,
        driverId: driverId || selectedDriver?.id || undefined,
        totalAmount: grandTotal,
        membershipCardId: membershipCard?.id || null,
        membershipDiscount: membershipDiscountAmount || 0,
        manualDiscount: manualDiscountAmount || 0,
        couponCode: appliedCoupon?.code || undefined,
        loyaltyPointsRedeemed: redeemPointsInput || undefined,
        items: cart.map((item: any) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: isOrderComplimentary ? 0 : item.sellingPrice,
          portion: item.size === 'Half' || item.size === 'Full' ? item.size : null,
          variantName: item.size !== 'Half' && item.size !== 'Full' ? item.size : null,
          variantId: item.variantId
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

        const isTakeawayOrDelivery = orderType === 'PICKUP' || orderType === 'DELIVERY' || (!tableId && !parkingSlotId);
        
        if (isTakeawayOrDelivery) {
          // Reset states to prepare for next order
          setSelectedGuestId('');
          setSelectedDriver(null);
          setDeliveryCustomerName('');
          setDeliveryPhone('');
          setDeliveryAddress('');
          setDeliveryInstructions('');
          setManualDiscount(0);
          setManualDiscountType('PERCENTAGE');
          setAppliedCoupon(null);
          setCouponCodeInput('');
          setRedeemPointsInput(0);
          setCouponError('');
          
          // Clear query params by replacing route
          router.replace(`${p}/billing`);
        } else {
          // Immediate redirect to operations for Dine-in
          router.push(parkingSlotId ? `${p}/operations/parking` : `${p}/operations/tables`);
        }
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

  const handleCreateDriver = async (data: any) => {
    setDriverMutationLoading(true);
    try {
      const payload = {
        ...data,
        propertyId: currentPropertyId || undefined,
      };
      const result = await driversApi.create(payload);
      setDrivers(prev => [...prev, result]);
      setSelectedDriver(result);
      setIsDriverModalOpen(false);
      addToast('success', 'Driver added');
    } catch (err) {
      addToast('error', 'Failed to add driver');
    } finally {
      setDriverMutationLoading(false);
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

  const handleApplyCoupon = async () => {
    if (!couponCodeInput) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch('/api/marketing/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCodeInput,
          guestId: selectedGuestId || undefined,
          orderTotal: grossSubtotal
        })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.data);
        addToast('success', 'Coupon applied successfully!');
      } else {
        setCouponError(data.message || 'Invalid coupon');
        setAppliedCoupon(null);
      }
    } catch (err) {
      setCouponError('Error validating coupon');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput('');
    setCouponError('');
  };

  useEffect(() => {
    if (selectedGuestId) {
      const guest = customers.find(c => c.id === selectedGuestId);
      if (guest) {
        setDeliveryCustomerName(guest.firstName + (guest.lastName ? ' ' + guest.lastName : ''));
        setDeliveryPhone(guest.mobile || '');
        setDeliveryAddress(guest.address || '');
        if (guest.mobile) {
          validateMembership(null, guest.mobile);
        }
      }
    } else {
      setMembershipCard(null);
      setDeliveryCustomerName('');
      setDeliveryPhone('');
      setDeliveryAddress('');
      setDeliveryInstructions('');
    }
  }, [selectedGuestId, customers]);



  const filteredProducts = products.filter(p => {
    let matchesCategory = false;
    if (selectedCategory === 'all') {
      matchesCategory = true;
    } else if (selectedCategory === 'breakfast') {
      matchesCategory = !!(p.mealTimes && p.mealTimes.split(',').includes('BREAKFAST'));
    } else if (selectedCategory === 'lunch') {
      matchesCategory = !!(p.mealTimes && p.mealTimes.split(',').includes('LUNCH'));
    } else if (selectedCategory === 'dinner') {
      matchesCategory = !!(p.mealTimes && p.mealTimes.split(',').includes('DINNER'));
    } else {
      matchesCategory = p.categoryId === selectedCategory;
    }
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesMenuType = (p as any).menuType === 'RESTAURANT' || !(p as any).menuType;
    
    let matchesDietary = true;
    if (dietaryFilter === 'VEG') {
      matchesDietary = p.isVeg !== false;
    } else if (dietaryFilter === 'NON-VEG') {
      matchesDietary = p.isVeg === false;
    }

    return matchesCategory && matchesSearch && matchesMenuType && matchesDietary;
  });

  const filteredCombos = combos.filter(c => {
    const matchesCategory = selectedCategory === 'all' || selectedCategory === 'combos';
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch && c.isActive !== false;
  });

  const grossSubtotal = cart.reduce((acc, item) => acc + (isOrderComplimentary ? 0 : (item.sellingPrice * item.quantity)), 0);
  
  let membershipDiscountAmount = 0;
  if (membershipCard) {
    const { discountType, discountValue, minOrderValue } = membershipCard.membershipPlan;
    if (grossSubtotal >= minOrderValue) {
      if (discountType === 'PERCENTAGE') {
        membershipDiscountAmount = (grossSubtotal * discountValue) / 100;
      } else {
        membershipDiscountAmount = discountValue;
      }
    }
  }

  let manualDiscountAmount = 0;
  if (manualDiscount > 0) {
    if (manualDiscountType === 'PERCENTAGE') {
      manualDiscountAmount = (grossSubtotal * manualDiscount) / 100;
    } else {
      manualDiscountAmount = manualDiscount;
    }
  }

  let couponDiscountCalculated = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENTAGE') {
      couponDiscountCalculated = (grossSubtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount) {
        couponDiscountCalculated = Math.min(couponDiscountCalculated, appliedCoupon.maxDiscount);
      }
    } else {
      couponDiscountCalculated = appliedCoupon.discountValue;
    }
  }

  let loyaltyDiscountCalculated = 0;
  if (selectedGuestId && redeemPointsInput > 0) {
    loyaltyDiscountCalculated = Number(redeemPointsInput) * 1.0;
  }

  const combinedDiscount = membershipDiscountAmount + manualDiscountAmount + couponDiscountCalculated + loyaltyDiscountCalculated;

  // Calculate dynamic subtotal, taxes, and grand total based on product settings
  const { totalNetSubtotal, totalTax, totalPayable } = cart.reduce((acc, item) => {
    const itemTotalGross = isOrderComplimentary ? 0 : (item.sellingPrice * item.quantity);
    // Calculate proportional discount for this item based on its share of the total gross subtotal
    const itemDiscount = grossSubtotal > 0 ? (itemTotalGross / grossSubtotal) * combinedDiscount : 0;
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

  const getOrderQrValue = () => {
    if (!activeOrder) return '';
    const itemsText = cart.map((i: any) => `- ${i.quantity}x ${i.name} (₹${(i.sellingPrice * i.quantity).toFixed(2)})`).join('\n');
    return `=== POS ORDER DETAILS ===
Order No: ${activeOrder.orderNo || 'N/A'}
Location: ${property?.brandName || property?.name || 'Restaurant'}
Delivery Type: ${orderType === 'DELIVERY' ? 'Home Delivery' : 'Pickup'}
Customer Name: ${deliveryCustomerName || 'Guest'}
Phone: ${deliveryPhone || 'N/A'}
${orderType === 'DELIVERY' ? `Address: ${deliveryAddress || 'N/A'}` : ''}
${deliveryInstructions ? `Instructions: ${deliveryInstructions}` : ''}

Items:
${itemsText}

Total Amount: ₹${grandTotal.toFixed(2)}
=========================`;
  };

  const displayedSubtotal = grossSubtotal; // Show gross subtotal before tax and discount for better UX? 
  // Wait, let's show gross subtotal as the "Sub-Total" line in the UI, then show discount, then tax.
  // In the current UI, it shows "Sub-Total" and then "Taxes" and "Total Payable".
  // If we show gross subtotal, we should also show a "Discount" line.

  // Generate dynamic tax label
  const uniqueRates = Array.from(new Set(cart.map((item: any) => item.taxRate !== null && item.taxRate !== undefined ? item.taxRate : 5)));
  const taxLabel = cart.length > 0 && uniqueRates.length === 1 ? `Taxes (${uniqueRates[0]}%)` : 'Taxes';

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading POS...</div>;

  return (
    <div className={`flex h-full w-full ${theme === 'dark' ? 'bg-[#111111] text-slate-200' : 'bg-[#fdf8f8] text-[#2d1515]'} overflow-hidden font-sans selection:bg-pos-primary/30 transition-colors duration-500`}>
      {/* CENTER - Product Grid (Premium Dark Theme) */}
      <div className={`flex-1 flex flex-col h-full ${theme === 'dark' ? 'bg-[#111111]' : 'bg-white'} overflow-hidden`}>
        {/* Header/Search Bar - Extra Compact */}
        <div className="px-3 py-1 flex items-center justify-between gap-3">
           <div className="flex items-center gap-2">
             <button
               onClick={() => router.push(`${p}/operations`)}
               className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-pos-primary"
               title="Back to Operations"
             >
               <ChevronLeft size={20} />
             </button>
             
             {/* Bar POS Shortcut Button — only visible when Bar POS is enabled */}
             {property?.barPosEnabled && (
               <button
                 onClick={() => router.push(`${p}/bar-pos`)}
                 className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest bg-amber-500 text-white shadow-lg shadow-amber-500/30 hover:bg-amber-600 flex-shrink-0"
               >
                 <ShoppingBag size={14} />
                 🍺 Bar POS
               </button>
             )}
           </div>

           <div className="flex-1 flex items-center gap-2 max-w-xl">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-pos-primary transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Search menu items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5 text-slate-200' : 'bg-white border-pos-primary/20 text-slate-800'} border focus:border-pos-primary/50 pl-10 pr-3 py-2 rounded-xl outline-none transition-all placeholder:text-slate-600 font-bold text-xs`}
                />
              </div>
              <button 
                onClick={() => { setSelectedCategory('all'); setSearch(''); }}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedCategory === 'all' && !search
                    ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/20' 
                    : 'bg-white dark:bg-[#1a1a1a] text-slate-500 border border-slate-200 dark:border-white/5 hover:border-pos-primary/40'
                }`}
              >
                All Items
              </button>
              <button 
                onClick={() => { setSelectedCategory('combos'); setSearch(''); }}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedCategory === 'combos' && !search
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' 
                    : 'bg-white dark:bg-[#1a1a1a] text-slate-500 border border-slate-200 dark:border-white/5 hover:border-rose-500/40'
                }`}
              >
                Combos
              </button>

              {/* Dietary Filter (Veg/Non-Veg) */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => setDietaryFilter(dietaryFilter === 'VEG' ? 'ALL' : 'VEG')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-sm ${
                    dietaryFilter === 'VEG'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/5 text-slate-500 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="w-3 h-3 border border-emerald-600 rounded-sm flex items-center justify-center bg-white shrink-0">
                    <div className="w-1.2 h-1.2 rounded-full bg-emerald-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">VEG</span>
                </button>
                <button
                  onClick={() => setDietaryFilter(dietaryFilter === 'NON-VEG' ? 'ALL' : 'NON-VEG')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all hover:scale-105 active:scale-95 shadow-sm ${
                    dietaryFilter === 'NON-VEG'
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'bg-white dark:bg-[#1a1a1a] border-slate-200 dark:border-white/5 text-slate-500 hover:border-rose-500/40'
                  }`}
                >
                  <div className="w-3 h-3 border border-rose-600 rounded-sm flex items-center justify-center bg-white shrink-0">
                    <div className="w-1.2 h-1.2 rounded-full bg-rose-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">NON-VEG</span>
                </button>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className={`${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-pos-primary/10'} p-0.5 rounded-xl flex border`}>
                 <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-pos-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><Grid size={16}/></button>
                 <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-pos-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}><List size={16}/></button>
              </div>
           </div>
        </div>

        {/* Category Pastel Tiles - Extra Compact */}
        <div className="px-3 py-0.5 overflow-x-auto no-scrollbar flex gap-2">
            <button
               onClick={() => setSelectedCategory('all')}
               className={`flex-none min-w-[80px] min-h-[45px] px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-0.5 ${selectedCategory === 'all' ? 'bg-pos-primary text-white ring-2 ring-black/20 shadow-2xl' : 'bg-white dark:bg-[#1a1a1a] text-slate-500 border border-slate-200 dark:border-white/5 shadow-lg'}`}
             >
               <div className="text-center">
                 <h3 className="text-[14px] md:text-[15px] tracking-tight leading-tight uppercase" style={{ fontFamily: 'var(--font-bebas-neue)' }}>All</h3>
                 <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">{products.length} items</p>
               </div>
            </button>

            {/* Breakfast Tile */}
            <button
               onClick={() => setSelectedCategory('breakfast')}
               style={selectedCategory === 'breakfast' ? {} : {
                 backgroundColor: theme === 'dark' ? '#3e2723' : '#FFF8E1',
                 color: theme === 'dark' ? '#ffb74d' : '#FF8F00',
               }}
               className={`flex-none min-w-[80px] min-h-[45px] px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-0.5 ${selectedCategory === 'breakfast' ? 'bg-pos-primary text-white ring-2 ring-black/20 scale-105 shadow-2xl' : 'shadow-lg hover:shadow-xl'}`}
             >
               <div className="text-center">
                 <h3 className="text-[14px] md:text-[15px] tracking-tight leading-tight uppercase" style={{ fontFamily: 'var(--font-bebas-neue)' }}>Breakfast</h3>
                 <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                   {products.filter(p => p.mealTimes && p.mealTimes.split(',').includes('BREAKFAST')).length} items
                 </p>
               </div>
            </button>

            {/* Lunch Tile */}
            <button
               onClick={() => setSelectedCategory('lunch')}
               style={selectedCategory === 'lunch' ? {} : {
                 backgroundColor: theme === 'dark' ? '#004d40' : '#E0F2F1',
                 color: theme === 'dark' ? '#4db6ac' : '#00796B',
               }}
               className={`flex-none min-w-[80px] min-h-[45px] px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-0.5 ${selectedCategory === 'lunch' ? 'bg-pos-primary text-white ring-2 ring-black/20 scale-105 shadow-2xl' : 'shadow-lg hover:shadow-xl'}`}
             >
               <div className="text-center">
                 <h3 className="text-[14px] md:text-[15px] tracking-tight leading-tight uppercase" style={{ fontFamily: 'var(--font-bebas-neue)' }}>Lunch</h3>
                 <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                   {products.filter(p => p.mealTimes && p.mealTimes.split(',').includes('LUNCH')).length} items
                 </p>
               </div>
            </button>

            {/* Dinner Tile */}
            <button
               onClick={() => setSelectedCategory('dinner')}
               style={selectedCategory === 'dinner' ? {} : {
                 backgroundColor: theme === 'dark' ? '#1a237e' : '#E8EAF6',
                 color: theme === 'dark' ? '#9fa8da' : '#3F51B5',
               }}
               className={`flex-none min-w-[80px] min-h-[45px] px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-0.5 ${selectedCategory === 'dinner' ? 'bg-pos-primary text-white ring-2 ring-black/20 scale-105 shadow-2xl' : 'shadow-lg hover:shadow-xl'}`}
             >
               <div className="text-center">
                 <h3 className="text-[14px] md:text-[15px] tracking-tight leading-tight uppercase" style={{ fontFamily: 'var(--font-bebas-neue)' }}>Dinner</h3>
                 <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                   {products.filter(p => p.mealTimes && p.mealTimes.split(',').includes('DINNER')).length} items
                 </p>
               </div>
            </button>

           {categories.filter(c => (c as any).menuType === 'RESTAURANT' || !(c as any).menuType).slice(0, 15).map((cat, idx) => {
              const palette = theme === 'dark' ? PRODUCT_PALETTE_DARK : PRODUCT_PALETTE_LIGHT;
              const cardColor = palette[idx % 12];
              const itemCount = products.filter(p => p.categoryId === cat.id).length;
              
              return (
                <button
                   key={cat.id}
                   onClick={() => setSelectedCategory(cat.id)}
                   style={{
                     backgroundColor: cardColor.bg,
                     color: cardColor.text,
                   }}
                   className={`flex-none min-w-[80px] min-h-[45px] px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-0.5 ${selectedCategory === cat.id ? 'ring-2 ring-black/20 scale-105 shadow-2xl' : 'shadow-lg hover:shadow-xl'}`}
                 >
                   <div className="text-center">
                      <h3 className="text-[14px] md:text-[15px] tracking-tight leading-tight uppercase" style={{ fontFamily: 'var(--font-bebas-neue)' }}>{cat.name}</h3>
                      <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">{itemCount} items</p>
                   </div>
                </button>
              );
           })}

            {/* Combos Category Tile */}
            {combos.length > 0 && (
              <button
                onClick={() => setSelectedCategory('combos')}
                style={{
                  backgroundColor: theme === 'dark' ? '#331a1a' : '#fff5f5',
                  color: theme === 'dark' ? '#ff9b9b' : '#c53030',
                }}
                className={`flex-none min-w-[80px] min-h-[45px] px-3 py-1.5 rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 flex flex-col items-center justify-center gap-0.5 border border-red-500/20 ${selectedCategory === 'combos' ? 'ring-2 ring-red-500/40 scale-105 shadow-2xl' : 'shadow-lg'}`}
              >
                <div className="text-center">
                   <h3 className="text-[14px] md:text-[15px] tracking-tight leading-tight uppercase" style={{ fontFamily: 'var(--font-bebas-neue)' }}>Combos</h3>
                   <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">{combos.length} deals</p>
                </div>
              </button>
            )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 pt-0.5 scroll-smooth no-scrollbar">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8 gap-2">
               {/* Show Combos ONLY if 'combos' category is selected */}
                {selectedCategory === 'combos' && filteredCombos.map((combo, idx) => {
                  const cardColor = { bg: '#fff5f5', border: '#feb2b2', text: '#9b2c2c', textSub: '#c53030' };
                  const isInCart = cart.some(item => item.cartItemId === `combo-${combo.id}`);
                  const darkText = theme === 'dark' ? '#2e2e2e' : '#d0d0d0';
                  
                  return (
                    <div
                      key={combo.id}
                      onClick={() => addToCart(combo, 'Full', combo.price, true)}
                      style={{
                        backgroundColor: cardColor.bg,
                        outline: isInCart ? `3px solid ${cardColor.border}` : (theme === 'light' ? '1px solid rgba(0,0,0,0.05)' : 'none'),
                        outlineOffset: '2px',
                        boxShadow: theme === 'light' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none'
                      }}
                      className={`group relative rounded-xl p-1.5 flex flex-col text-left overflow-hidden hover:scale-[1.03] active:scale-[0.97] aspect-square w-full ${isInCart ? 'shadow-2xl ring-2 ring-offset-2' : 'hover:shadow-xl'} transition-all duration-300 cursor-pointer`}
                    >
                      {/* Top Row: HSN & Price */}
                      <div className="flex justify-between items-start w-full relative z-10">
                        <span 
                          className="text-[8px] font-black uppercase tracking-widest"
                          style={{
                            color: cardColor.text,
                            opacity: theme === 'light' ? 0.7 : 0.6
                          }}
                        >
                          COMBO DEAL
                        </span>
                        <div className="text-right">
                          <p className="text-[7px] font-black uppercase opacity-40 leading-none mb-0.5">Price</p>
                          <span 
                            className="text-[14px] font-black tracking-tight leading-none"
                            style={{
                              color: cardColor.text,
                            }}
                          >
                            ₹{combo.price.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Name */}
                      <div className="flex-1 flex items-center w-full relative z-10 py-0.5">
                        <h3
                          className="text-[18px] leading-[1.0] font-black break-words w-full uppercase overflow-hidden line-clamp-2"
                          style={{
                            color: cardColor.text,
                            fontFamily: 'var(--font-bebas-neue)'
                          }}
                        >
                          {combo.name}
                        </h3>
                      </div>

                      {/* Bottom Row */}
                      <div className="w-full relative z-10 flex items-end justify-between">
                         <div>
                            <p 
                              className="text-[7px] font-bold uppercase tracking-widest opacity-60"
                              style={{ color: cardColor.text }}
                            >
                              {combo.items?.length || 0} PRODUCTS
                            </p>
                            <p 
                              className="text-[7px] font-black uppercase tracking-tighter opacity-40"
                              style={{ color: cardColor.text }}
                            >
                              SPECIAL DEAL
                            </p>
                         </div>
                         <div className="opacity-20 group-hover:opacity-40 transition-opacity pb-0.5">
                            <Star size={14} style={{ color: cardColor.text }} />
                         </div>
                      </div>

                      {/* Selection Checkmark */}
                      {isInCart && (
                        <div className="absolute bottom-2 right-2 z-30 pointer-events-none">
                          <div className="bg-red-500 text-white p-0.5 rounded-full shadow-md">
                            <CheckCircle2 size={12} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
               })}

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
                    <div
                      key={product.id}
                      onClick={() => {
                        if (product.variants && product.variants.length > 0) {
                          addToCart(product, product.variants[0].name, product.variants[0].price);
                        } else {
                          addToCart(product, 'Full');
                        }
                      }}
                      style={{
                        backgroundColor: isColored ? cardColor.bg : darkBg,
                        transition: transitionStr('background-color'),
                        outline: isInCart && isColored ? `3px solid ${cardColor.border}` : (theme === 'light' ? '1px solid rgba(0,0,0,0.05)' : 'none'),
                        outlineOffset: '2px',
                        boxShadow: theme === 'light' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none'
                      }}
                      className={`group relative rounded-xl p-1.5 flex flex-col text-left overflow-hidden hover:scale-[1.03] active:scale-[0.97] aspect-square w-full ${isInCart ? 'shadow-2xl ring-2 ring-offset-2' : 'hover:shadow-xl'} transition-all duration-300 cursor-pointer`}
                    >
                      {/* Hover glow */}
                      <div
                        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none"
                        style={{
                          background: `radial-gradient(circle at top right, ${isColored ? cardColor.border : '#fff'}30 0%, transparent 70%)`,
                          transition: 'opacity 0.3s ease',
                        }}
                      />

                      {/* Top Row: HSN & Price */}
                      <div className="flex justify-between items-start w-full relative z-10">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-3.5 h-3.5 border-2 border-current rounded-sm flex items-center justify-center bg-white shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)] ${product.isVeg === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                          </div>
                          <span 
                            className="text-[8px] font-black uppercase tracking-widest"
                            style={{
                              color: isColored ? cardColor.text : darkText,
                              transition: transitionStr('color'),
                              opacity: theme === 'light' ? 0.7 : 0.6
                            }}
                          >
                            HSN {product.hsnCode || '2106'}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[7px] font-black uppercase opacity-40 leading-none mb-0.5">Price</p>
                          <span 
                            className="text-[14px] font-black tracking-tight leading-none"
                            style={{
                              color: isColored ? cardColor.text : darkText,
                              transition: transitionStr('color'),
                            }}
                          >
                            ₹{product.sellingPrice.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Product Name with Auto-wrapping */}
                      <div className="flex-1 flex items-center w-full relative z-10 py-0.5">
                        <h3
                          className="text-[18px] leading-[1.0] font-black break-words w-full uppercase overflow-hidden line-clamp-2"
                          style={{
                            color: isColored ? cardColor.text : darkText,
                            transition: transitionStr('color'),
                            fontFamily: 'var(--font-bebas-neue)'
                          }}
                        >
                          {(() => {
                            const words = product.name.split(' ');
                            if (words.length > 1) {
                              return (
                                <>
                                  <span className="font-black">{words[0]}</span> <span className="font-medium opacity-80">{words.slice(1).join(' ')}</span>
                                </>
                              );
                            }
                            return <span className="font-black">{product.name}</span>;
                          })()}
                        </h3>
                      </div>

                      {/* Bottom Row: Info or Action Area */}
                      <div className={`w-full relative z-10 pt-0.5 border-t ${theme === 'light' ? 'border-black/10' : 'border-white/5'}`}>
                        <div className="flex justify-between items-end h-4">
                          <div className="flex flex-col">
                            <span 
                              className="text-[7px] font-black uppercase tracking-widest truncate max-w-[100px]"
                              style={{
                                color: isColored ? cardColor.text : darkText,
                                opacity: theme === 'light' ? 0.8 : 0.5
                              }}
                            >
                              {categories.find(c => c.id === product.categoryId)?.name || 'N/A'}
                            </span>
                            <span 
                              className="text-[7px] font-black uppercase tracking-tighter"
                              style={{
                                color: isColored ? cardColor.text : darkText,
                                opacity: theme === 'light' ? 0.9 : 0.6
                              }}
                            >
                              GST {product.taxRate || 5}%
                            </span>
                          </div>
                          
                          <div 
                            className="opacity-30"
                            style={{ color: isColored ? cardColor.text : darkText }}
                          >
                            <ProductIcon 
                              productName={product.name}
                              categoryName={categories.find(c => c.id === product.categoryId)?.name}
                              size={12}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick Add Buttons Overlay (Variants) */}
                      {((product.variants?.length ?? 0) > 0 || (product as any).halfPrice > 0) && (
                        <div className="absolute inset-x-0 bottom-0 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 z-20">
                          {product.variants && product.variants.length > 0 ? (
                            <div className="grid grid-cols-2">
                              {product.variants.map((v: any, vIdx: number) => {
                                const vColors = ['bg-orange-500 hover:bg-orange-600', 'bg-rose-400 hover:bg-rose-500', 'bg-amber-500 hover:bg-amber-600', 'bg-emerald-500 hover:bg-emerald-600'];
                                const vColor = vColors[vIdx % vColors.length];
                                const isLastOdd = vIdx === (product.variants?.length || 0) - 1 && (product.variants?.length || 0) % 2 !== 0;
                                return (
                                  <button 
                                    key={v.id}
                                    onClick={(e) => { e.stopPropagation(); addToCart(product, v.name, v.price); }}
                                    className={`py-4 text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 ${vColor} ${isLastOdd ? 'col-span-2' : ''} border-r border-b border-white/10`}
                                  >
                                    {v.name}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (product as any).halfPrice > 0 && (
                            <div className="flex w-full">
                              <button 
                                onClick={(e) => { e.stopPropagation(); addToCart(product, 'Half'); }}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-black py-4 uppercase tracking-wider"
                              >
                                Half
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); addToCart(product, 'Full'); }}
                                className="flex-1 bg-pos-primary hover:bg-pos-primary-dark text-white text-[11px] font-black py-4 uppercase tracking-wider border-l border-white/10"
                              >
                                Full
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Selection Checkmark (Top Right) */}
                      {isInCart && (
                        <div className="absolute top-2 right-2 z-30 pointer-events-none">
                          <div 
                            className="text-white p-0.5 rounded-full shadow-md"
                            style={{ backgroundColor: cardColor.border }}
                          >
                            <CheckCircle2 size={14} strokeWidth={3} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
               })}
            </div>
          ) : (
            <div className="space-y-3 flex flex-col pb-6">
              {/* Show Combos ONLY in List View if 'combos' selected */}
              {selectedCategory === 'combos' && filteredCombos.map(combo => {
                const isInCart = cart.some(item => item.cartItemId === `combo-${combo.id}`);
                return (
                  <div
                    key={combo.id}
                    onClick={() => addToCart(combo, 'Full', combo.price, true)}
                    className={`w-full flex items-center gap-4 p-3 rounded-[1.25rem] transition-all text-left ${theme === 'dark' ? 'bg-[#1c1c1c] border-red-500/10 hover:bg-[#252525]' : 'bg-red-50 border-red-100 hover:bg-red-100/50'} border ${isInCart ? 'ring-2 ring-red-500 shadow-lg shadow-red-500/10' : 'hover:shadow-md'} cursor-pointer`}
                  >
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[0.85rem] overflow-hidden border flex flex-shrink-0 items-center justify-center ${theme === 'dark' ? 'bg-[#252525] border-white/5' : 'bg-white border-red-100'}`}>
                      <Star className="text-red-500" size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-black text-[13px] md:text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{combo.name}</h3>
                        <span className="px-1.5 py-0.5 bg-red-600 text-white text-[7px] font-black uppercase rounded-md tracking-tighter">COMBO</span>
                      </div>
                      <p className={`text-[10px] md:text-[11px] font-bold mt-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{combo.items?.length || 0} Products Bundled</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="font-black text-[15px] md:text-lg text-red-600">₹{combo.price.toFixed(2)}</p>
                      {isInCart && (
                        <div className="inline-block px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 mt-1">
                          <p className="text-[9px] uppercase font-black tracking-widest">In Cart</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredProducts.map(product => {
                const isInCart = cart.some(item => item.id === product.id);
                return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product, 'Full')}
                  className={`w-full flex items-center gap-4 p-3 rounded-[1.25rem] transition-all text-left ${theme === 'dark' ? 'bg-[#1c1c1c] border-white/5 hover:bg-[#252525]' : 'bg-white border-slate-200 hover:bg-slate-50'} border ${isInCart ? 'ring-2 ring-pos-primary shadow-lg shadow-pos-primary/10' : 'hover:shadow-md'} cursor-pointer`}
                >
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[0.85rem] overflow-hidden border flex flex-shrink-0 items-center justify-center ${theme === 'dark' ? 'bg-[#252525] border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" /> : <Utensils className={`${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`} size={24} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 border-2 border-current rounded-sm flex items-center justify-center bg-white shrink-0 shadow-sm ${product.isVeg === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      </div>
                      <h3 className={`font-black text-[13px] md:text-sm uppercase tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>{product.name}</h3>
                    </div>
                    <p className={`text-[10px] md:text-[11px] font-bold mt-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>{product.category?.name || 'Uncategorized'}</p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <p className={`font-black text-[15px] md:text-lg ${theme === 'dark' ? 'text-pos-primary' : 'text-pos-primary'}`}>₹{product.sellingPrice.toFixed(2)}</p>
                    <p className={`text-[10px] font-black mt-0.5 ${theme === 'dark' ? 'text-pos-primary/80' : 'text-pos-primary'}`}>GST {product.taxRate || 5}%</p>
                    
                    {/* Quick Selection Buttons */}
                    <div className="mt-2">
                      {product.variants && product.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-2 justify-end">
                          {product.variants?.map((v: any) => (
                            <button 
                              key={v.id}
                              onClick={(e) => { e.stopPropagation(); addToCart(product, v.name, v.price); }}
                              className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[9px] font-black hover:bg-slate-900 transition-all active:scale-95 border border-white/10"
                            >
                              {v.name.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      ) : ((product as any).menuType === 'RESTAURANT' || !(product as any).menuType) && (product as any).halfPrice > 0 && (
                        <div className="flex flex-col gap-1.5">
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(product, 'Half'); }}
                            className="px-4 py-1.5 bg-amber-500 text-white rounded-xl text-[9px] font-black hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-500/20 uppercase"
                          >
                            HALF
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); addToCart(product, 'Full'); }}
                            className="px-4 py-1.5 bg-pos-primary text-white rounded-xl text-[9px] font-black hover:bg-pos-primary-dark transition-all active:scale-95 shadow-lg shadow-pos-primary/20 uppercase"
                          >
                            FULL
                          </button>
                        </div>
                      )}
                    </div>
                    {isInCart ? (
                      <div className="inline-block px-2 py-0.5 rounded-full bg-pos-primary/10 text-pos-primary mt-1">
                        <p className="text-[9px] uppercase font-black tracking-widest">In Cart</p>
                      </div>
                    ) : (
                      <p className={`text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-1.5 ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>In Stock</p>
                    )}

                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BOTTOM BAR — Active Table Orders (CosyPOS style) */}
        {activeOrders.length > 0 && (
          <div
            className="flex items-center gap-3 px-3 py-1.5 overflow-x-auto no-scrollbar border-t"
            style={{
              backgroundColor: theme === 'dark' ? '#181818' : '#f8f8f8',
              borderColor: theme === 'dark' ? '#2a2a2a' : '#ececec',
              minHeight: 45,
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
                (order.status === 'KOT_RUNNING' || order.status === 'IN_KITCHEN') ? '#f97316'
                : order.status === 'BILL_PRINTED' ? '#3b82f6'
                : order.status === 'OCCUPIED' ? '#22c55e'
                : order.status === 'HOLD' ? '#a855f7'
                : '#94a3b8';
              const statusLabel =
                (order.status === 'KOT_RUNNING' || order.status === 'IN_KITCHEN') ? 'In Kitchen'
                : order.status === 'BILL_PRINTED' ? 'Bill Printed'
                : order.status === 'OCCUPIED' ? 'In process'
                : order.status === 'HOLD' ? 'Hold'
                : 'Open';

              return (
                <button
                  key={order.tableId}
                  onClick={() => router.push(`/billing?tableId=${order.tableId}&tableName=${order.tableName}&orderId=${order.orderId}`)}
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
      <div className={`w-[460px] ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/5' : 'bg-white border-pos-primary/20'} border-l flex flex-col h-full sticky top-0 shadow-2xl z-10 transition-all duration-300`}>
        {/* Fixed Header */}
        <div className="p-3 pb-1 flex flex-col gap-2">
           <div className="flex items-center justify-between">
              <div>
                 <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'} tracking-tight`}>Order Details</h2>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.1em]">
                   {tableName || (orderType === 'DELIVERY' ? 'Delivery Order' : orderType === 'PICKUP' ? 'Pick Up' : 'Counter Service')}
                 </p>
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                 {/* Custom Searchable Waiter Dropdown Popover */}
                 <div className="relative">
                   <button
                     onClick={() => setShowWaiterSearch(!showWaiterSearch)}
                     className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border shadow-sm ${
                       selectedStaffId 
                         ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-450 hover:bg-emerald-500/20' 
                         : theme === 'dark' 
                           ? 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white' 
                           : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                     }`}
                     title="Select Order Waiter/Staff"
                   >
                     <span className="truncate max-w-[80px]">👤 {selectedStaffId ? (staffMembers.find(s => s.id === selectedStaffId)?.name || 'Waiter') : 'Waiter'}</span>
                     <span className="text-[6px]">▼</span>
                   </button>

                   {showWaiterSearch && (
                     <>
                       <div className="fixed inset-0 z-30" onClick={() => setShowWaiterSearch(false)} />
                       <div className={`absolute right-0 top-full mt-1.5 w-48 rounded-2xl p-2.5 border shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-40 ${
                         theme === 'dark' 
                           ? 'bg-[#1a1a1a] border-white/10 text-slate-200 shadow-black/80' 
                           : 'bg-white border-slate-200 text-slate-800'
                       }`}>
                         {/* Search Input */}
                         <div className={`flex items-center gap-1.5 px-2 py-1 bg-black/10 dark:bg-black/20 rounded-lg border border-white/5 mb-1.5`}>
                           <Search size={10} className="text-slate-400" />
                           <input
                             type="text"
                             placeholder="Search waiter..."
                             value={waiterSearchQuery}
                             onChange={(e) => setWaiterSearchQuery(e.target.value)}
                             className="bg-transparent text-[9px] font-bold outline-none text-white w-full placeholder:text-slate-500"
                             autoFocus
                           />
                         </div>

                         {/* Options list */}
                         <div className="max-h-36 overflow-y-auto no-scrollbar space-y-0.5">
                           <button
                             onClick={() => {
                               setSelectedStaffId('');
                               setShowWaiterSearch(false);
                               setWaiterSearchQuery('');
                             }}
                             className="w-full text-left px-2 py-1 rounded text-[9px] font-black uppercase text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                           >
                             ❌ Clear Selection
                           </button>
                           {staffMembers
                             .filter(s => s.isActive && (!waiterSearchQuery || s.name.toLowerCase().includes(waiterSearchQuery.toLowerCase())))
                             .map(s => (
                               <button
                                 key={s.id}
                                 onClick={() => {
                                   setSelectedStaffId(s.id);
                                   setShowWaiterSearch(false);
                                   setWaiterSearchQuery('');
                                 }}
                                 className={`w-full text-left px-2 py-1 rounded text-[9px] font-black uppercase transition-colors truncate ${
                                   selectedStaffId === s.id 
                                     ? 'bg-pos-primary text-white shadow-md' 
                                     : theme === 'dark'
                                       ? 'hover:bg-white/5 text-slate-400 hover:text-white'
                                       : 'hover:bg-slate-50 text-slate-600 hover:text-slate-800'
                                 }`}
                               >
                                 {s.name}
                               </button>
                             ))
                           }
                           {staffMembers.filter(s => s.isActive && (!waiterSearchQuery || s.name.toLowerCase().includes(waiterSearchQuery.toLowerCase()))).length === 0 && (
                             <p className="text-[8px] text-slate-500 font-bold uppercase text-center py-2.5">No matching staff</p>
                           )}
                         </div>
                       </div>
                     </>
                   )}
                 </div>
                  
                  {/* ── Guests Counter (Header Integrated) ── */}
                  {orderType === 'DINE_IN' && (
                    <div className={`flex items-center gap-1 bg-black/20 dark:bg-white/5 rounded-2xl p-0.5 border border-white/5 shadow-inner`}>
                      <button 
                        onClick={() => setGuestCount(g => Math.max(1, g - 1))} 
                        className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400"
                      >
                        <Minus size={12} />
                      </button>
                      <div className="px-1.5 flex flex-col items-center leading-none">
                        <span className="text-[12px] font-black">{guestCount}</span>
                        <span className="text-[7px] font-black uppercase opacity-40">Pax</span>
                      </div>
                      <button 
                        onClick={() => setGuestCount(g => Math.min(30, g + 1))} 
                        className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
               </div>
           </div>
        </div>

        {/* Scrollable Container Body - Unified Scroll View */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-2 scroll-smooth no-scrollbar space-y-4">
           
           {/* 👤 1. CUSTOMER & DRIVER BUTTONS */}
           <div className="space-y-2">
             <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5 ml-1">
               ⚙️ Assignment & Settings
             </span>
             <div className={orderType === 'DELIVERY' ? "grid grid-cols-1" : "grid grid-cols-2 gap-2"}>
               {/* Customer Button */}
               <div className="relative group">
                  <button 
                    onClick={() => { setShowCustomerDropdown(!showCustomerDropdown); setShowDriverDropdown(false); }}
                    className={`w-full flex items-center justify-between gap-2 py-1.5 px-3 rounded-xl border transition-all duration-300 ${selectedGuestId ? 'bg-pos-primary border-pos-primary text-white shadow-lg shadow-pos-primary/20' : 'bg-white dark:bg-[#111] border-slate-200 dark:border-white/5 text-slate-500 hover:border-pos-primary/40'}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserIcon size={12} className={selectedGuestId ? 'text-white' : 'text-pos-primary'} />
                      <span className="text-[10px] font-black uppercase tracking-wider truncate">
                        {selectedGuestId ? (customers.find(c => c.id === selectedGuestId)?.firstName || 'Guest') : 'Customer'}
                      </span>
                    </div>
                    {selectedGuestId && (
                      <div 
                        onClick={(e) => { e.stopPropagation(); setSelectedGuestId(''); }}
                        className="p-1 hover:bg-white/20 rounded-md transition-colors"
                      >
                        <Trash2 size={10} />
                      </div>
                    )}
                  </button>
               </div>
               
               {/* Driver Button */}
               {orderType !== 'DELIVERY' && (
                 <div className="relative group">
                    <button 
                      onClick={() => { setShowDriverDropdown(!showDriverDropdown); setShowCustomerDropdown(false); }}
                      className={`w-full flex items-center justify-between gap-2 py-2 px-3 rounded-2xl border transition-all duration-300 ${selectedDriver ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-[#111] border-slate-200 dark:border-white/5 text-slate-500 hover:border-amber-500/40'}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <CarFront size={12} className={selectedDriver ? 'text-white' : 'text-amber-500'} />
                        <span className="text-[10px] font-black uppercase tracking-wider truncate">
                          {selectedDriver ? selectedDriver.name : 'Driver'}
                        </span>
                      </div>
                      {selectedDriver && (
                        <div 
                          onClick={(e) => { e.stopPropagation(); setSelectedDriver(null); }}
                          className="p-1 hover:bg-white/20 rounded-md transition-colors"
                        >
                          <Trash2 size={10} />
                        </div>
                      )}
                    </button>
                 </div>
               )}
             </div>
           </div>

            {/* 🔍 2. SEARCH INTERFACES (Toggled) */}
            {(showCustomerDropdown && !selectedGuestId) && (
              <div className="relative animate-in slide-in-from-top-2 duration-300 z-50">
                 <div className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'} border shadow-xl`}>
                    <Search size={14} className="text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search customer..."
                      autoFocus
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="bg-transparent text-[11px] font-bold outline-none flex-1"
                    />
                 </div>
                 <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto no-scrollbar">
                   <button
                     onMouseDown={() => { setIsCustomerModalOpen(true); setShowCustomerDropdown(false); }}
                     className="w-full px-4 py-3 text-left bg-pos-primary/10 hover:bg-pos-primary hover:text-white text-pos-primary transition-colors flex items-center gap-2 border-b border-slate-100 dark:border-white/5"
                   >
                     <Plus size={14} />
                     <span className="text-[12px] font-black uppercase">Add New Customer</span>
                   </button>
                   {customers
                     .filter(c => !customerSearch || c.firstName?.toLowerCase().includes(customerSearch.toLowerCase()) || (c.mobile || '').includes(customerSearch))
                     .map(customer => (
                       <button
                         key={customer.id}
                         onMouseDown={() => { setSelectedGuestId(customer.id); setShowCustomerDropdown(false); setCustomerSearch(''); }}
                         className="w-full px-4 py-3 text-left hover:bg-pos-primary hover:text-white transition-colors group border-b border-slate-50 dark:border-white/5 last:border-0"
                       >
                          <p className="text-[12px] font-black">{customer.firstName} {customer.lastName || ''}</p>
                          <p className="text-[10px] font-bold opacity-60 group-hover:opacity-100">{customer.mobile || 'No phone'}</p>
                       </button>
                     ))
                   }
                 </div>
              </div>
            )}

            {(showDriverDropdown && !selectedDriver) && (
              <div className="relative animate-in slide-in-from-top-2 duration-300 z-50">
                 <div className={`flex items-center gap-2 rounded-2xl px-3.5 py-2.5 ${theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'} border shadow-xl`}>
                    <Search size={14} className="text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search driver..."
                      autoFocus
                      value={driverSearch}
                      onChange={(e) => setDriverSearch(e.target.value)}
                      className="bg-transparent text-[11px] font-bold outline-none flex-1"
                    />
                 </div>
                 <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-48 overflow-y-auto no-scrollbar">
                   <button
                     onMouseDown={() => { setIsDriverModalOpen(true); setShowDriverDropdown(false); }}
                     className="w-full px-4 py-3 text-left bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-500 transition-colors flex items-center gap-2 border-b border-slate-100 dark:border-white/5"
                   >
                     <Plus size={14} />
                     <span className="text-[12px] font-black uppercase">Add New Driver</span>
                   </button>
                   {drivers
                     .filter(d => d.isActive && (!driverSearch || d.name?.toLowerCase().includes(driverSearch.toLowerCase()) || (d.phone || '').includes(driverSearch)))
                     .map(driver => (
                       <button
                         key={driver.id}
                         onMouseDown={() => { setSelectedDriver(driver); setShowDriverDropdown(false); setDriverSearch(''); }}
                         className="w-full px-4 py-3 text-left hover:bg-amber-500 hover:text-white transition-colors group border-b border-slate-50 dark:border-white/5 last:border-0"
                       >
                          <p className="text-[12px] font-black">{driver.name}</p>
                          <p className="text-[10px] font-bold opacity-60 group-hover:opacity-100">{driver.phone || 'No phone'} {driver.vehicleNumber ? `• ${driver.vehicleNumber}` : ''}</p>
                       </button>
                     ))
                   }
                 </div>
              </div>
            )}

           {/* 🛒 3. CART ITEMS LIST */}
           <div className="space-y-2">
             <div className="flex items-center justify-between ml-1">
               <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                 🛒 Items in Cart
               </span>
               {cart.length > 0 && (
                 <span className="text-[8px] font-black uppercase tracking-wider text-pos-primary bg-pos-primary/10 px-2 py-0.5 rounded-md">
                   {cart.length} {cart.length === 1 ? 'Item' : 'Items'}
                 </span>
               )}
             </div>

             {cart.length === 0 ? (
               <div className={`py-12 flex flex-col items-center justify-center text-center gap-4 ${theme === 'dark' ? 'opacity-20' : 'opacity-30'}`}>
                 <div className="w-12 h-12 rounded-full bg-slate-500/10 flex items-center justify-center border border-slate-500/20">
                   <ShoppingBag size={24} className="text-slate-400" />
                 </div>
                 <p className="font-black text-[9px] uppercase tracking-[0.2em] text-slate-400">Your Cart is Empty</p>
               </div>
              ) : (
               <div className="space-y-1">
                 {cart.map((item: any) => (
                   <div key={item.cartItemId} className={`group relative overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2a2a2a] shadow-lg' : 'bg-white border-slate-200 shadow-md'} rounded-xl p-1.5 border transition-all duration-300 mb-1`}>
                     <div className="flex flex-col gap-0.5 relative z-10">
                       {/* Main row: Name+Price | Replace | Qty+Delete */}
                       <div className="flex items-center gap-1">

                         {/* LEFT: Name + Price */}
                         <div className="flex-1 min-w-0">
                           <h4 className={`text-[11px] font-black ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'} truncate tracking-tight uppercase leading-tight`}>
                             {item.name.split('(')[0].trim()}
                           </h4>
                           <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                             <span className="text-[12px] text-pos-primary font-black">&#8377;{isOrderComplimentary ? '0' : (item.sellingPrice * item.quantity).toFixed(0)}</span>
                             <span className="text-[8px] text-slate-500 font-bold opacity-40">/ &#8377;{isOrderComplimentary ? '0' : item.sellingPrice.toFixed(0)}</span>
                             {(item as any).replacedFrom && (
                               <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '8px', fontWeight: 700, color: '#54B8D8', background: 'rgba(84,184,216,0.1)', border: '1px solid rgba(84,184,216,0.25)', borderRadius: '999px', padding: '1px 6px', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                                 &#8617; {(item as any).replacedFrom}
                               </span>
                             )}
                           </div>
                         </div>

                         {/* CENTER: Replace button */}
                         <button
                           onClick={() => { setReplaceTarget(item); setReplaceSearch(''); }}
                           title="Replace item"
                           className={`shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all ${
                             theme === 'dark'
                               ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white hover:border-blue-500'
                               : 'bg-blue-50 text-blue-500 border border-blue-200 hover:bg-blue-500 hover:text-white hover:border-blue-500'
                           }`}
                         >
                           <RotateCcw size={9} strokeWidth={3} />
                           Replace
                         </button>

                         {/* RIGHT: Qty + Delete */}
                         <div className="flex items-center gap-1 shrink-0">
                           <div className="flex items-center bg-black/30 dark:bg-black/40 rounded-lg p-0.5 border border-white/5">
                             <button onClick={() => updateQuantity(item.cartItemId, -1)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                               <Minus size={10} strokeWidth={4} />
                             </button>
                             <span className="w-4 text-center text-[11px] font-black">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.cartItemId, 1)} className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-pos-primary transition-all">
                               <Plus size={10} strokeWidth={4} />
                             </button>
                           </div>
                           <button
                             onClick={() => removeFromCart(item.cartItemId)}
                             className="w-6 h-6 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                           >
                             <Trash2 size={10} />
                           </button>
                         </div>
                       </div>

                       {/* Compact Grid: Sizes/Variants */}
                       <div className="grid grid-cols-2 gap-1.5">
                         {((item as any).menuType === 'RESTAURANT' || !(item as any).menuType) && (!item.variants || item.variants.length === 0) && (item as any).halfPrice > 0 && (
                           <>
                             <button
                               onClick={(e) => { e.stopPropagation(); item.size !== 'Half' && toggleSize(item.cartItemId); }}
                               className={`text-[9px] py-1.5 px-1.5 rounded-lg font-black uppercase transition-all duration-300 ${item.size === 'Half' ? 'bg-orange-500 text-white shadow-md' : 'bg-black/20 dark:bg-white/5 text-slate-500'}`}
                             >
                               Half
                             </button>
                             <button
                               onClick={(e) => { e.stopPropagation(); item.size !== 'Full' && toggleSize(item.cartItemId); }}
                               className={`text-[9px] py-1.5 px-1.5 rounded-lg font-black uppercase transition-all duration-300 ${item.size === 'Full' || !item.size ? 'bg-rose-400 text-white shadow-md' : 'bg-black/20 dark:bg-white/5 text-slate-500'}`}
                             >
                               Full
                             </button>
                           </>
                         )}

                         {(products.find(p => p.id === item.id)?.variants || item.variants)?.map((v: any) => (
                           <button
                             key={v.id}
                             onClick={(e) => { e.stopPropagation(); changeVariant(item.cartItemId, v.name, v.price); }}
                             className={`text-[9px] py-1.5 px-1.5 rounded-lg font-black uppercase transition-all duration-300 ${item.size === v.name ? 'bg-indigo-600 text-white shadow-md' : 'bg-black/20 dark:bg-white/5 text-slate-500'}`}
                           >
                             {v.name}
                           </button>
                         ))}
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             )}
           </div>

           {/* 🚚 4. HOME DELIVERY DETAILS CARD */}
           {(orderType === 'DELIVERY' || orderType === 'PICKUP') && (
             <div className={`rounded-2xl p-3.5 space-y-3 transition-all duration-300 ${
               theme === 'dark' 
                 ? 'bg-rose-500/5 border-rose-500/10' 
                 : 'bg-rose-50/40 border-rose-100'
             } border`}>
               <div className="flex items-center justify-between border-b border-rose-500/10 pb-1.5">
                 <span className="text-[10px] font-black uppercase tracking-wider text-rose-500 flex items-center gap-1.5">
                   {orderType === 'DELIVERY' ? '🚚 Home Delivery Details' : '🛍️ Pickup/Takeaway Details'}
                 </span>
               </div>

               <div className="space-y-2">
                 {/* Name Input */}
                 <div className="relative">
                   <input 
                     type="text" 
                     placeholder="Customer Name" 
                     value={deliveryCustomerName}
                     onChange={(e) => setDeliveryCustomerName(e.target.value)}
                     className={`w-full text-[11px] font-bold px-3 py-2 rounded-xl transition-all ${
                       theme === 'dark' 
                         ? 'bg-[#121212] border-white/5 focus:border-rose-500/50' 
                         : 'bg-white border-slate-200 focus:border-rose-500'
                     } border outline-none text-slate-800 dark:text-slate-100`}
                   />
                 </div>

                 {/* Phone Input */}
                 <div className="relative">
                   <input 
                     type="text" 
                     placeholder="Phone Number" 
                     value={deliveryPhone}
                     onChange={(e) => setDeliveryPhone(e.target.value)}
                     className={`w-full text-[11px] font-bold px-3 py-2 rounded-xl transition-all ${
                       theme === 'dark' 
                         ? 'bg-[#121212] border-white/5 focus:border-rose-500/50' 
                         : 'bg-white border-slate-200 focus:border-rose-500'
                     } border outline-none text-slate-800 dark:text-slate-100`}
                   />
                 </div>

                 {/* Address Input (Only for Home Delivery) */}
                 {orderType === 'DELIVERY' && (
                   <>
                     <div className="relative">
                       <textarea 
                         placeholder="Full Delivery Address" 
                         value={deliveryAddress}
                         onChange={(e) => setDeliveryAddress(e.target.value)}
                         className={`w-full text-[11px] font-bold px-3 py-2 rounded-xl transition-all min-h-[50px] resize-none ${
                           theme === 'dark' 
                             ? 'bg-[#121212] border-white/5 focus:border-rose-500/50' 
                             : 'bg-white border-slate-200 focus:border-rose-500'
                         } border outline-none text-slate-800 dark:text-slate-100`}
                       />
                     </div>

                     {/* Dynamic Rider Select (Delivery Boy) */}
                     <div className="flex gap-2">
                       <div className="relative flex-1">
                         <select 
                           value={selectedDriver?.id || ''}
                           onChange={(e) => {
                             const driverId = e.target.value;
                             const driver = drivers.find(d => d.id === driverId);
                             setSelectedDriver(driver || null);
                           }}
                           className={`w-full text-[11px] font-bold px-3 py-2.5 rounded-xl transition-all appearance-none cursor-pointer ${
                             theme === 'dark' 
                               ? 'bg-[#121212] border-white/5 focus:border-rose-500/50' 
                               : 'bg-white border-slate-200 focus:border-rose-500'
                           } border outline-none text-slate-800 dark:text-slate-100`}
                         >
                           <option value="" className="text-slate-400">🚴 Choose Delivery Rider</option>
                           {drivers
                             .filter(d => d.vehicleType === 'BIKE' && d.isActive)
                             .map(d => (
                               <option key={d.id} value={d.id} className="text-slate-800 dark:text-slate-100 font-semibold">
                                 {d.name} ({d.phone || 'No phone'})
                               </option>
                             ))
                           }
                         </select>
                         <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                           ▼
                         </div>
                       </div>
                       <button
                         type="button"
                         onClick={() => setIsDriverModalOpen(true)}
                         className="flex-shrink-0 px-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors flex items-center justify-center"
                         title="Add New Rider"
                       >
                         <Plus size={16} />
                       </button>
                     </div>
                   </>
                 )}

                 {/* Delivery Instructions */}
                 <div className="relative">
                   <input 
                     type="text" 
                     placeholder={orderType === 'DELIVERY' ? "Delivery instructions (optional)..." : "Special instructions (optional)..."}
                     value={deliveryInstructions}
                     onChange={(e) => setDeliveryInstructions(e.target.value)}
                     className={`w-full text-[11px] font-bold px-3 py-2 rounded-xl transition-all ${
                       theme === 'dark' 
                         ? 'bg-[#121212] border-white/5 focus:border-rose-500/50' 
                         : 'bg-white border-slate-200 focus:border-rose-500'
                     } border outline-none text-slate-800 dark:text-slate-100`}
                   />
                 </div>
               </div>
             </div>
           )}

           {/* 📱 5. ORDER DETAILS QR CODE CARD */}
           {activeOrder && !tableId && !activeOrder.restaurantTableId && orderType !== 'DINE_IN' && (
             <div className={`rounded-2xl p-3.5 space-y-2 transition-all duration-300 ${
               theme === 'dark' 
                 ? 'bg-indigo-500/5 border-indigo-500/10' 
                 : 'bg-indigo-50/40 border-indigo-100'
             } border`}>
               <div className="flex items-center justify-between border-b border-indigo-500/10 pb-1.5">
                 <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1.5">
                   <QrCode size={11} /> Order Details QR Code
                 </span>
               </div>
               
               <div className="flex flex-col items-center justify-center gap-2.5 py-1.5 bg-white dark:bg-[#121212] rounded-xl p-2.5 border border-indigo-500/5">
                 <QRCodeSVG 
                   value={getOrderQrValue()} 
                   size={110}
                   level="M"
                   includeMargin={true}
                   className="rounded-lg shadow-sm"
                 />
                 <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 text-center max-w-[170px]">
                   Scan to view/share full order & customer details instantly
                 </p>
               </div>
             </div>
           )}

        </div>
        
        {/* Discount Section - Separate */}
        <div className={`px-3 py-1.5 ${theme === 'dark' ? 'bg-[#151515] border-white/5' : 'bg-emerald-50/50 border-emerald-100'} border-t`}>
          {showDiscountInput ? (
            <div className="flex items-center gap-2 animate-in slide-in-from-bottom-1 duration-200">
              <Percent size={10} className="text-emerald-500 flex-shrink-0" />
              <input 
                type="number"
                placeholder="Amount"
                value={manualDiscount || ''}
                onChange={(e) => setManualDiscount(Number(e.target.value))}
                className="bg-transparent text-[10px] font-black outline-none text-slate-800 dark:text-slate-100 w-16 px-1.5 py-0.5 border-b border-emerald-500/30 focus:border-emerald-500"
                autoFocus
              />
              <button
                onClick={() => setManualDiscountType(manualDiscountType === 'PERCENTAGE' ? 'FIXED' : 'PERCENTAGE')}
                className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md text-[9px] font-black text-emerald-600 dark:text-emerald-400 transition-all border border-emerald-500/20"
              >
                {manualDiscountType === 'PERCENTAGE' ? '%' : '₹'}
              </button>
              <button 
                onClick={() => setShowDiscountInput(false)}
                className="text-[8px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest ml-auto px-1.5 py-0.5 hover:bg-rose-500/10 rounded transition-all"
              >
                Done
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowDiscountInput(true)}
              className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 transition-all hover:gap-2 py-0.5"
            >
              <Percent size={10} /> Add Discount {combinedDiscount > 0 && <span className="text-[8px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded-md">-₹{combinedDiscount.toFixed(0)}</span>}
            </button>
          )}
        </div>

        {/* Totals & Checkout Section */}
        <div className={`p-2 ${theme === 'dark' ? 'bg-[#111111] border-white/10' : 'bg-slate-50 border-slate-200'} border-t space-y-1 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]`}>
          {/* Global Order Toggles */}
          <div className="flex items-center gap-4 px-1 pb-1">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isOrderComplimentary}
                onChange={(e) => setIsOrderComplimentary(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-pos-primary focus:ring-pos-primary cursor-pointer"
              />
              <span className={`text-[10px] font-black uppercase tracking-wider ${isOrderComplimentary ? 'text-pos-primary' : 'text-slate-500'}`}>Complimentary</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input 
                type="checkbox" 
                checked={isOrderPaid}
                onChange={(e) => setIsOrderPaid(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
              />
              <span className={`text-[10px] font-black uppercase tracking-wider ${isOrderPaid ? 'text-emerald-500' : 'text-slate-500'}`}>It's Paid</span>
            </label>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-end">
              <div>
                 {membershipDiscountAmount > 0 && <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest block px-1">Card Disc: -₹{membershipDiscountAmount.toFixed(0)}</span>}
                 {manualDiscountAmount > 0 && <span className="text-[8px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest block px-1">Manual Disc: -₹{manualDiscountAmount.toFixed(0)}</span>}
                 {couponDiscountCalculated > 0 && <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block px-1">Coupon ({appliedCoupon?.code}): -₹{couponDiscountCalculated.toFixed(0)}</span>}
                 {loyaltyDiscountCalculated > 0 && <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block px-1">Loyalty Points: -₹{loyaltyDiscountCalculated.toFixed(0)}</span>}
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5 block px-1">
                   Total Payable (Incl. {taxLabel}: ₹{tax.toFixed(2)}{combinedDiscount > 0 ? `, Disc: -₹${combinedDiscount.toFixed(2)}` : ''})
                 </span>
                 <p className="text-2xl font-black text-pos-primary tracking-tighter leading-none">₹{grandTotal.toFixed(2)}</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
                  <ShoppingBag size={20} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {/* Top Row: Exactly 2 Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                 onClick={() => handlePrintKOT(true)}
                 loading={saveLoading}
                 disabled={cart.length === 0}
                 className={`py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 border
                   ${theme === 'dark' 
                     ? 'bg-emerald-500/10 hover:bg-emerald-500 hover:text-white border-emerald-500/20 text-emerald-455' 
                     : 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700/10 shadow-lg shadow-emerald-600/15'}`}
              >
                <Printer size={13} /> PRINT KOT
              </Button>
              <Button 
                 onClick={() => handlePrintKOT(false)}
                 loading={saveLoading}
                 disabled={cart.length === 0}
                 className={`py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 border
                   ${theme === 'dark' 
                     ? 'bg-teal-500/10 hover:bg-teal-500 hover:text-white border-teal-500/20 text-teal-455' 
                     : 'bg-teal-600 text-white hover:bg-teal-700 border-teal-700/10 shadow-lg shadow-teal-600/15'}`}
              >
                 <CheckCircle2 size={13} /> SAVE & KOT
              </Button>
            </div>

            {/* Bottom Row: Exactly 3 Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button 
                 onClick={() => handleSimpleSave('SAVE')}
                 loading={saveLoading}
                 disabled={cart.length === 0}
                 className={`py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 border
                   ${theme === 'dark' 
                     ? 'bg-red-500/10 hover:bg-red-600 hover:text-white border-red-500/20 text-red-455' 
                     : 'bg-red-700 text-white hover:bg-red-800 border-red-800/10 shadow-lg shadow-red-700/15'}`}
              >
                <Save size={13} /> SAVE
              </Button>
              <Button 
                 onClick={() => handleSimpleSave('HOLD')}
                 loading={saveLoading}
                 disabled={cart.length === 0}
                 className={`py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 border
                   ${theme === 'dark' 
                     ? 'bg-amber-500/10 hover:bg-amber-500 hover:text-white border-amber-500/20 text-amber-455' 
                     : 'bg-amber-600 text-white hover:bg-amber-700 border-amber-700/10 shadow-lg shadow-amber-600/15'}`}
              >
                <Pause size={13} /> HOLD
              </Button>
              <Button 
                 disabled={cart.length === 0 && !activeOrder}
                 onClick={() => {
                   setIsProforma(true);
                   setAutoPrint(false); 
                   handlePrintBill(false); 
                 }}
                 className={`py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 border
                   ${theme === 'dark' 
                     ? 'bg-rose-500/10 hover:bg-rose-500 hover:text-white border-rose-500/20 text-rose-455' 
                     : 'bg-rose-600 text-white hover:bg-rose-700 border-rose-700/10 shadow-lg shadow-rose-600/20'}`}
              >
                 <CreditCard size={13} strokeWidth={2.5} /> SETTLE (F1)
              </Button>
            </div>
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
            router.push(`${p}/operations/tables`);
          }} 
        />
      )}

      <BillModal 
        bill={billData} 
        onClose={() => {
            setIsBillOpen(false);
            setBillData(null);
            setAutoPrint(false);
            // After successful settlement (not proforma), redirect back to operations or start new order
            if (!isProforma) {
              const isTakeawayOrDelivery = orderType === 'PICKUP' || orderType === 'DELIVERY' || (!tableId && !parkingSlotId);
              if (isTakeawayOrDelivery) {
                setCart([]);
                setActiveOrder(null);
                setSelectedGuestId('');
                setSelectedDriver(null);
                setDeliveryCustomerName('');
                setDeliveryPhone('');
                setDeliveryAddress('');
                setDeliveryInstructions('');
                setManualDiscount(0);
                setManualDiscountType('PERCENTAGE');
                setAppliedCoupon(null);
                setCouponCodeInput('');
                setRedeemPointsInput(0);
                setCouponError('');
                
                router.replace(`${p}/billing`);
              } else {
                router.push(parkingSlotId ? `${p}/operations/parking` : `${p}/operations/tables`);
              }
            }
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

      <Modal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        title="New Driver Registration"
      >
        <DriverForm 
          onSubmit={handleCreateDriver}
          onCancel={() => setIsDriverModalOpen(false)}
          loading={driverMutationLoading}
        />
      </Modal>

      {/* ═══ REPLACE ITEM MODAL ═══ */}
      <Modal
        isOpen={!!replaceTarget}
        onClose={() => { setReplaceTarget(null); setReplaceSearch(''); }}
        title={`Replace: ${replaceTarget?.name?.split('(')[0].trim() || ''}`}
        maxWidth="md"
      >
        {replaceTarget && (
          <div style={{ padding: '8px' }}>
            <p className={`text-[11px] mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Pick a product to replace this item (qty {replaceTarget.quantity} will be kept).
            </p>
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                type="text"
                placeholder="Search product…"
                value={replaceSearch}
                onChange={e => setReplaceSearch(e.target.value)}
                className={`w-full text-[12px] pl-8 pr-3 py-2 rounded-xl border outline-none transition-all ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-white placeholder-slate-500 focus:border-blue-500/50'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-400'
                }`}
              />
            </div>
            <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {products
                .filter(p => p.name.toLowerCase().includes(replaceSearch.toLowerCase()))
                .slice(0, 40)
                .map((p, idx) => (
                  <button
                    key={p.id}
                    onClick={() => replaceCartItem(replaceTarget.cartItemId, p)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-left transition-all ${
                      theme === 'dark'
                        ? 'bg-white/3 border-white/8 hover:bg-blue-500/10 hover:border-blue-500/30 text-slate-200'
                        : 'bg-white border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-800'
                    }`}
                  >
                    <div>
                      <p className="text-[12px] font-bold">{p.name}</p>
                      {(p as any).categoryId && <p className="text-[10px] text-slate-500">{categories.find(c => c.id === (p as any).categoryId)?.name || ''}</p>}
                    </div>
                    <span className="text-[13px] font-black text-pos-primary ml-3 shrink-0">₹{p.sellingPrice.toFixed(0)}</span>
                  </button>
                ))}
              {products.filter(p => p.name.toLowerCase().includes(replaceSearch.toLowerCase())).length === 0 && (
                <p className="text-center text-[11px] text-slate-500 py-6">No products found</p>
              )}
            </div>
            <button
              onClick={() => { setReplaceTarget(null); setReplaceSearch(''); }}
              className={`w-full mt-4 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${
                theme === 'dark'
                  ? 'border-white/10 text-slate-400 hover:bg-white/5'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Cancel
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}