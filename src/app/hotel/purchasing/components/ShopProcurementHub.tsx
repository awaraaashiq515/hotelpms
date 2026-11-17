'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Store,
  Plus,
  Minus,
  Check,
  ShoppingCart,
  Truck,
  MessageCircle,
  FileText,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Building2,
  Phone,
  Search,
  X,
  RefreshCw,
  Layers,
  ArrowRight,
  Trash2,
  PackagePlus
} from 'lucide-react';
import { type VendorOption, type POFormItem } from './PurchaseOrderForm';
import { toast } from 'sonner';

export interface ShopItemTemplate {
  name: string;
  subtitle: string;
  unit: string;
  defaultPrice: number;
  category: string;
  defaultQty?: number;
  isCustom?: boolean;
}

export interface ShopCategory {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  emoji: string;
  badge: string;
  borderClass: string;
  bgGlow: string;
  activeBorder: string;
  vendorCategory: string;
  items: ShopItemTemplate[];
}

export const COMMON_PURCHASE_UNITS = [
  'Kg',
  'Litre',
  'Pcs',
  'Packet',
  'Box',
  'Bag',
  'Bottle',
  'Tin',
  'Tray',
  'Gram',
  'Dozen',
  'Roll',
  'Can',
  'Bundle',
];

export const HOTEL_SHOPS: ShopCategory[] = [
  {
    id: 'MEAT_CHICKEN',
    name: 'Chicken & Meat Shop',
    subtitle: 'Poultry, Mutton, Seafood & Eggs',
    tagline: 'Fresh raw chicken, boneless cuts, mutton, fish and farm egg trays',
    emoji: '🍗',
    badge: 'Meat & Poultry',
    borderClass: 'border-rose-500/30 hover:border-rose-500/60',
    bgGlow: 'bg-rose-500/10 text-rose-300',
    activeBorder: 'border-rose-500 ring-2 ring-rose-500/40 bg-rose-950/20',
    vendorCategory: 'Meat & Poultry',
    items: [
      { name: 'Raw Chicken (Curry Cut)', subtitle: 'Fresh bone-in chicken curry cut', unit: 'Kg', defaultPrice: 220, category: 'Meat & Poultry', defaultQty: 5 },
      { name: 'Boneless Chicken Breast', subtitle: 'Clean skinless chicken fillets', unit: 'Kg', defaultPrice: 320, category: 'Meat & Poultry', defaultQty: 3 },
      { name: 'Chicken Drumsticks / Legs', subtitle: 'Fresh juicy whole leg cuts', unit: 'Kg', defaultPrice: 260, category: 'Meat & Poultry', defaultQty: 2 },
      { name: 'Chicken Keema (Minced)', subtitle: 'Freshly minced fine chicken', unit: 'Kg', defaultPrice: 280, category: 'Meat & Poultry', defaultQty: 2 },
      { name: 'Fresh Mutton (Curry Cut)', subtitle: 'Tender goat meat curry pieces', unit: 'Kg', defaultPrice: 750, category: 'Meat & Poultry', defaultQty: 3 },
      { name: 'Fresh Fish (Rohu / Surmai)', subtitle: 'Fresh river/sea sliced fish', unit: 'Kg', defaultPrice: 380, category: 'Meat & Poultry', defaultQty: 4 },
      { name: 'Egg Tray (30 Farm Eggs)', subtitle: 'Full crate of 30 farm eggs', unit: 'Tray', defaultPrice: 190, category: 'Meat & Poultry', defaultQty: 3 },
      { name: 'Boneless Fish Fillet', subtitle: 'Clean de-boned fish fillets', unit: 'Kg', defaultPrice: 480, category: 'Meat & Poultry', defaultQty: 2 },
    ],
  },
  {
    id: 'SABZI_MANDI',
    name: 'Vegetables & Produce Market',
    subtitle: 'Fresh Mandi Greens, Herbs & Fruits',
    tagline: 'Potatoes, onions, tomatoes, ginger, garlic, herbs and fresh fruits',
    emoji: '🥦',
    badge: 'Greens & Produce',
    borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
    bgGlow: 'bg-emerald-500/10 text-emerald-300',
    activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/20',
    vendorCategory: 'Vegetables & Fruits',
    items: [
      { name: 'Fresh Potatoes (Aloo)', subtitle: 'Firm graded table potatoes', unit: 'Kg', defaultPrice: 28, category: 'Vegetables & Fruits', defaultQty: 25 },
      { name: 'Fresh Onions (Pyaaz)', subtitle: 'Clean dry red onions', unit: 'Kg', defaultPrice: 38, category: 'Vegetables & Fruits', defaultQty: 25 },
      { name: 'Fresh Tomatoes (Tamatar)', subtitle: 'Ripe red salad & cooking tomatoes', unit: 'Kg', defaultPrice: 40, category: 'Vegetables & Fruits', defaultQty: 15 },
      { name: 'Ginger & Garlic (Adrak Lehsun)', subtitle: 'Fresh ginger root and garlic cloves', unit: 'Kg', defaultPrice: 190, category: 'Vegetables & Fruits', defaultQty: 3 },
      { name: 'Green Chillies & Fresh Coriander', subtitle: 'Spicy green chillies and fresh cilantro', unit: 'Kg', defaultPrice: 80, category: 'Vegetables & Fruits', defaultQty: 2 },
      { name: 'Fresh Cauliflower (Gobhi)', subtitle: 'Clean white cauliflower heads', unit: 'Kg', defaultPrice: 35, category: 'Vegetables & Fruits', defaultQty: 5 },
      { name: 'Green Capsicum (Shimla Mirch)', subtitle: 'Crisp green bell peppers', unit: 'Kg', defaultPrice: 65, category: 'Vegetables & Fruits', defaultQty: 4 },
      { name: 'Button Mushrooms (200g Pack)', subtitle: 'Fresh white button mushrooms', unit: 'Packet', defaultPrice: 50, category: 'Vegetables & Fruits', defaultQty: 6 },
      { name: 'Fresh Lemons (Nimbu)', subtitle: 'Juicy yellow lemons', unit: 'Kg', defaultPrice: 80, category: 'Vegetables & Fruits', defaultQty: 2 },
      { name: 'Seasonal Mixed Fruits', subtitle: 'Apples, bananas, papaya & oranges', unit: 'Kg', defaultPrice: 120, category: 'Vegetables & Fruits', defaultQty: 8 },
    ],
  },
  {
    id: 'DAIRY_STORE',
    name: 'Dairy & Milk Booth',
    subtitle: 'Milk, Fresh Paneer, Curd, Butter & Cheese',
    tagline: 'Fresh full cream milk, soft malai paneer, butter, curd, cream and cheese',
    emoji: '🥛',
    badge: 'Dairy & Cheese',
    borderClass: 'border-cyan-500/30 hover:border-cyan-500/60',
    bgGlow: 'bg-cyan-500/10 text-cyan-300',
    activeBorder: 'border-cyan-500 ring-2 ring-cyan-500/40 bg-cyan-950/20',
    vendorCategory: 'Dairy & Bakery',
    items: [
      { name: 'Full Cream Fresh Milk', subtitle: 'Pasteurised full cream milk', unit: 'Litre', defaultPrice: 66, category: 'Dairy & Bakery', defaultQty: 20 },
      { name: 'Fresh Soft Malai Paneer', subtitle: 'Daily fresh soft cottage cheese', unit: 'Kg', defaultPrice: 360, category: 'Dairy & Bakery', defaultQty: 5 },
      { name: 'Fresh Curd / Dahi', subtitle: 'Thick set plain whole milk curd', unit: 'Kg', defaultPrice: 70, category: 'Dairy & Bakery', defaultQty: 8 },
      { name: 'Table Butter (500g)', subtitle: 'Salted dairy table butter', unit: 'Packet', defaultPrice: 275, category: 'Dairy & Bakery', defaultQty: 4 },
      { name: 'Fresh Cooking Cream (1L)', subtitle: 'Rich 25% fat dairy cooking cream', unit: 'Litre', defaultPrice: 215, category: 'Dairy & Bakery', defaultQty: 3 },
      { name: 'Mozzarella & Pizza Cheese', subtitle: 'Grated/block melting pizza cheese', unit: 'Kg', defaultPrice: 480, category: 'Dairy & Bakery', defaultQty: 2 },
      { name: 'Pure Desi Cow Ghee', subtitle: 'Clarified cow milk butter ghee', unit: 'Litre', defaultPrice: 650, category: 'Dairy & Bakery', defaultQty: 2 },
      { name: 'Spiced Buttermilk / Chaas', subtitle: 'Refreshing masala buttermilk pouches', unit: 'Packet', defaultPrice: 15, category: 'Dairy & Bakery', defaultQty: 15 },
    ],
  },
  {
    id: 'KIRANA_RATION',
    name: 'Dry Ration & Grocery Store',
    subtitle: 'Basmati Rice, Flour, Pulses, Oils & Spices',
    tagline: 'Wholesale grains, chakki atta, pulses, refined cooking oils and whole spices',
    emoji: '🌾',
    badge: 'Grains & Spices',
    borderClass: 'border-amber-500/30 hover:border-amber-500/60',
    bgGlow: 'bg-amber-500/10 text-amber-300',
    activeBorder: 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-950/20',
    vendorCategory: 'Grocery & Spices',
    items: [
      { name: 'Premium Basmati Biryani Rice', subtitle: 'Aged long-grain aromatic rice', unit: 'Kg', defaultPrice: 110, category: 'Grocery & Spices', defaultQty: 25 },
      { name: 'Whole Wheat Flour (Atta)', subtitle: 'Stone-ground 100% wheat flour', unit: 'Kg', defaultPrice: 38, category: 'Grocery & Spices', defaultQty: 50 },
      { name: 'Arhar / Toor Dal', subtitle: 'Polished yellow pigeon peas', unit: 'Kg', defaultPrice: 160, category: 'Grocery & Spices', defaultQty: 10 },
      { name: 'Moong Dal / Chana Dal', subtitle: 'Split yellow and Bengal gram pulses', unit: 'Kg', defaultPrice: 130, category: 'Grocery & Spices', defaultQty: 10 },
      { name: 'Refined Sunflower Oil (15L Tin)', subtitle: 'Bulk commercial cooking oil tin', unit: 'Tin', defaultPrice: 1950, category: 'Grocery & Spices', defaultQty: 2 },
      { name: 'Pure Mustard Oil', subtitle: 'Cold pressed mustard cooking oil', unit: 'Litre', defaultPrice: 165, category: 'Grocery & Spices', defaultQty: 5 },
      { name: 'Ground Spices (Turmeric, Chilli, Coriander)', subtitle: 'Standard hotel spice powders kit', unit: 'Kg', defaultPrice: 320, category: 'Grocery & Spices', defaultQty: 4 },
      { name: 'Royal Garam Masala Blend', subtitle: 'Aromatic roasted whole spice blend', unit: 'Packet', defaultPrice: 140, category: 'Grocery & Spices', defaultQty: 5 },
      { name: 'Refined White Sugar', subtitle: 'Pure crystal refined white sugar', unit: 'Kg', defaultPrice: 44, category: 'Grocery & Spices', defaultQty: 20 },
      { name: 'Iodized Table Salt', subtitle: 'Fine grain food grade cooking salt', unit: 'Packet', defaultPrice: 28, category: 'Grocery & Spices', defaultQty: 10 },
      { name: 'Hotel CTC Tea Leaves', subtitle: 'Strong aromatic tea leaf granules', unit: 'Kg', defaultPrice: 360, category: 'Grocery & Spices', defaultQty: 5 },
    ],
  },
  {
    id: 'BAKERY_STORE',
    name: 'Bakery & Bread Store',
    subtitle: 'Sandwich Bread, Burger Buns, Pav & Pastries',
    tagline: 'Fresh jumbo white bread, brown bread, burger buns, pav and toast',
    emoji: '🍞',
    badge: 'Bakery & Breads',
    borderClass: 'border-yellow-500/30 hover:border-yellow-500/60',
    bgGlow: 'bg-yellow-500/10 text-yellow-300',
    activeBorder: 'border-yellow-500 ring-2 ring-yellow-500/40 bg-yellow-950/20',
    vendorCategory: 'Dairy & Bakery',
    items: [
      { name: 'Sandwich White Jumbo Bread', subtitle: 'Sliced jumbo white loaf for toast/sandwiches', unit: 'Packet', defaultPrice: 45, category: 'Dairy & Bakery', defaultQty: 8 },
      { name: '100% Brown / Whole Wheat Bread', subtitle: 'Healthy brown sliced bread loaf', unit: 'Packet', defaultPrice: 55, category: 'Dairy & Bakery', defaultQty: 4 },
      { name: 'Soft Burger Buns (Pack of 6)', subtitle: 'Sesame seed soft burger buns', unit: 'Packet', defaultPrice: 40, category: 'Dairy & Bakery', defaultQty: 6 },
      { name: 'Dinner Rolls / Pav (Pack of 12)', subtitle: 'Soft buttery table dinner rolls / pav', unit: 'Packet', defaultPrice: 35, category: 'Dairy & Bakery', defaultQty: 6 },
      { name: 'Pizza Base 8-inch (Pack of 2)', subtitle: 'Pre-baked 8-inch plain pizza crusts', unit: 'Packet', defaultPrice: 35, category: 'Dairy & Bakery', defaultQty: 5 },
      { name: 'Crispy Tea Toast / Rusk', subtitle: 'Crispy twice-baked cardamom tea toast', unit: 'Packet', defaultPrice: 60, category: 'Dairy & Bakery', defaultQty: 4 },
    ],
  },
  {
    id: 'BEVERAGE_DISTRIBUTOR',
    name: 'Beverages & Packaged Water',
    subtitle: 'Water Crates, Soda, Soft Drinks & Syrups',
    tagline: '1L mineral water bottles, club soda, canned soft drinks and mocktail syrups',
    emoji: '🥤',
    badge: 'Drinks & Water',
    borderClass: 'border-indigo-500/30 hover:border-indigo-500/60',
    bgGlow: 'bg-indigo-500/10 text-indigo-300',
    activeBorder: 'border-indigo-500 ring-2 ring-indigo-500/40 bg-indigo-950/20',
    vendorCategory: 'Beverages & Bar',
    items: [
      { name: '1L Packaged Water Bottles (Crate of 12)', subtitle: 'Box of 12 sealed 1-litre drinking water', unit: 'Box', defaultPrice: 120, category: 'Beverages & Bar', defaultQty: 10 },
      { name: '500ml Water Bottles (Crate of 24)', subtitle: 'Box of 24 room-size water bottles', unit: 'Box', defaultPrice: 180, category: 'Beverages & Bar', defaultQty: 5 },
      { name: 'Club Soda Cans/Bottles (Pack of 24)', subtitle: 'Carbonated soda water bottles/cans', unit: 'Box', defaultPrice: 240, category: 'Beverages & Bar', defaultQty: 4 },
      { name: 'Assorted Soft Drinks (250ml Crate of 24)', subtitle: 'Cola, lemon-lime and orange sodas', unit: 'Box', defaultPrice: 380, category: 'Beverages & Bar', defaultQty: 4 },
      { name: 'Tetra Pack Fruit Juices (1L)', subtitle: 'Orange, mango and mixed fruit juice 1L', unit: 'Packet', defaultPrice: 110, category: 'Beverages & Bar', defaultQty: 6 },
      { name: 'Mocktail Flavoured Syrups', subtitle: 'Mojito mint, blue curacao & grenadine', unit: 'Bottle', defaultPrice: 280, category: 'Beverages & Bar', defaultQty: 2 },
    ],
  },
  {
    id: 'HOUSEKEEPING_STORE',
    name: 'Housekeeping & Cleaning Supplies',
    subtitle: 'Floor Cleaners, Dishwash, Paper & Toiletries',
    tagline: 'Disinfectant floor liquid, commercial dishwash, toilet rolls and guest amenities',
    emoji: '🧹',
    badge: 'Cleaning & Amenities',
    borderClass: 'border-teal-500/30 hover:border-teal-500/60',
    bgGlow: 'bg-teal-500/10 text-teal-300',
    activeBorder: 'border-teal-500 ring-2 ring-teal-500/40 bg-teal-950/20',
    vendorCategory: 'Housekeeping & Cleaning',
    items: [
      { name: 'Disinfectant Floor Cleaner (5L Can)', subtitle: 'Commercial pine/citrus floor wash can', unit: 'Can', defaultPrice: 350, category: 'Housekeeping & Cleaning', defaultQty: 3 },
      { name: 'Commercial Dishwashing Gel (5L Can)', subtitle: 'Heavy grease-cutting dish detergent', unit: 'Can', defaultPrice: 380, category: 'Housekeeping & Cleaning', defaultQty: 2 },
      { name: 'Toilet Bowl Cleaner Liquid (5L)', subtitle: 'Sanitising thick toilet bowl descaler', unit: 'Can', defaultPrice: 420, category: 'Housekeeping & Cleaning', defaultQty: 2 },
      { name: 'Soft 2-Ply Toilet Paper Rolls (Pack of 12)', subtitle: 'Standard hotel bathroom tissue rolls', unit: 'Packet', defaultPrice: 240, category: 'Housekeeping & Cleaning', defaultQty: 5 },
      { name: 'Heavy Duty Black Garbage Bags (Pack of 30)', subtitle: 'Large heavy-duty room & kitchen trash bags', unit: 'Packet', defaultPrice: 160, category: 'Housekeeping & Cleaning', defaultQty: 6 },
      { name: 'Guest Room Shampoo Bottles (Pack of 50)', subtitle: '30ml mini shampoo amenity bottles', unit: 'Box', defaultPrice: 400, category: 'Toiletries & Amenities', defaultQty: 2 },
      { name: 'Guest Mini Soap Bars (Pack of 50)', subtitle: 'Individually wrapped 20g guest bath soaps', unit: 'Box', defaultPrice: 350, category: 'Toiletries & Amenities', defaultQty: 2 },
    ],
  },
  {
    id: 'PACKAGING_STORE',
    name: 'Disposables & Food Packaging',
    subtitle: 'Aluminium Foil, Meal Containers & Paper Bags',
    tagline: 'Heavy duty foil rolls, cling wrap, 3-compartment boxes and napkins',
    emoji: '📦',
    badge: 'Packaging & Disposables',
    borderClass: 'border-slate-500/30 hover:border-slate-500/60',
    bgGlow: 'bg-slate-500/10 text-slate-300',
    activeBorder: 'border-slate-400 ring-2 ring-slate-400/40 bg-slate-900',
    vendorCategory: 'General Supplies',
    items: [
      { name: 'Aluminium Food Foil Paper Roll (1 Kg Net)', subtitle: 'Commercial thickness food grade wrapping foil', unit: 'Roll', defaultPrice: 290, category: 'General Supplies', defaultQty: 3 },
      { name: 'Food Grade Cling Wrap Film Roll', subtitle: 'Stretchy cling film for kitchen food prep', unit: 'Roll', defaultPrice: 220, category: 'General Supplies', defaultQty: 2 },
      { name: '3-Compartment Meal Delivery Boxes (Pack of 50)', subtitle: 'Microwaveable compartmental takeaway containers', unit: 'Packet', defaultPrice: 350, category: 'General Supplies', defaultQty: 4 },
      { name: '2-Ply Paper Napkins / Tissues (Pack of 100)', subtitle: 'Soft absorbent dining table tissue napkins', unit: 'Packet', defaultPrice: 45, category: 'General Supplies', defaultQty: 10 },
      { name: 'Eco Wooden Cutlery Sets (Pack of 100)', subtitle: 'Biodegradable wooden spoons & forks', unit: 'Packet', defaultPrice: 120, category: 'General Supplies', defaultQty: 3 },
      { name: 'Kraft Paper Takeaway Bags (Pack of 100)', subtitle: 'Sturdy brown paper delivery bags with handles', unit: 'Packet', defaultPrice: 280, category: 'General Supplies', defaultQty: 2 },
    ],
  },
  {
    id: 'HARDWARE_MAINTENANCE',
    name: 'Hardware & Engineering Maintenance',
    subtitle: 'LED Bulbs, Taps, Electrical Wires & Tools',
    tagline: 'LED bulbs, bathroom bib taps, angle valves, wires and touch-up paint',
    emoji: '🔧',
    badge: 'Repairs & Hardware',
    borderClass: 'border-blue-500/30 hover:border-blue-500/60',
    bgGlow: 'bg-blue-500/10 text-blue-300',
    activeBorder: 'border-blue-500 ring-2 ring-blue-500/40 bg-blue-950/20',
    vendorCategory: 'Maintenance & Engineering',
    items: [
      { name: '9W LED Bulbs Warm White (Pack of 10)', subtitle: 'B22 pin warm white guest room bulbs', unit: 'Box', defaultPrice: 750, category: 'Maintenance & Engineering', defaultQty: 2 },
      { name: 'Heavy Duty PVC Electrical Tape & Wire', subtitle: 'Insulation tape and 1.5 sq mm copper wire', unit: 'Pcs', defaultPrice: 60, category: 'Maintenance & Engineering', defaultQty: 4 },
      { name: 'Brass Bathroom Bib Tap & Angle Valve', subtitle: 'Quarter-turn chrome plated bathroom taps', unit: 'Pcs', defaultPrice: 280, category: 'Maintenance & Engineering', defaultQty: 3 },
      { name: 'Hand Shower with Flexible 1.5M Hose', subtitle: 'Bathroom hand spray bidet with hose', unit: 'Pcs', defaultPrice: 320, category: 'Maintenance & Engineering', defaultQty: 2 },
      { name: 'Touch-Up Wall Putty / White Paint (1 Kg)', subtitle: 'Quick dry patch filler & touch-up paint', unit: 'Kg', defaultPrice: 120, category: 'Maintenance & Engineering', defaultQty: 2 },
    ],
  },
];

interface ShopProcurementHubProps {
  vendors: VendorOption[];
  onQuickOrder: (data: {
    vendorId: string;
    vendorName: string;
    vendorPhone?: string;
    items: POFormItem[];
    totalAmount: number;
    receiveImmediately: boolean;
    sendWhatsAppImmediately: boolean;
    assignToKitchenRunner?: boolean;
    notes: string;
  }) => Promise<void> | void;
  onOpenFullFormWithItems: (items: POFormItem[], vendorId?: string, notes?: string) => void;
  onAddVendorClick: () => void;
  onFilterByShop?: (shopName: string) => void;
}

export function ShopProcurementHub({
  vendors,
  onQuickOrder,
  onOpenFullFormWithItems,
  onAddVendorClick,
  onFilterByShop,
}: ShopProcurementHubProps) {
  const [selectedShopId, setSelectedShopId] = useState<string>('MEAT_CHICKEN');
  const [searchItem, setSearchItem] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Custom Items added by user per shop
  const [customItemsByShop, setCustomItemsByShop] = useState<Record<string, ShopItemTemplate[]>>({});

  // Inline "Add Custom Item" Modal / Drawer state
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemSubtitle, setNewItemSubtitle] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('Kg');
  const [newItemPrice, setNewItemPrice] = useState<number>(0);
  const [newItemQty, setNewItemQty] = useState<number>(1);

  // Load custom items from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('hotel_purchasing_custom_shop_items');
      if (saved) {
        setCustomItemsByShop(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Selected Items in Current Draft Basket
  // itemKey -> { qty, price, name, unit, category }
  const [basket, setBasket] = useState<
    Record<string, { qty: number; price: number; name: string; unit: string; category: string }>
  >({});

  const activeShop = useMemo(
    () => HOTEL_SHOPS.find((s) => s.id === selectedShopId) || HOTEL_SHOPS[0],
    [selectedShopId]
  );

  // Combine default items with user custom items for this shop
  const allShopItems = useMemo(() => {
    const customList = customItemsByShop[activeShop.id] || [];
    return [...customList, ...activeShop.items];
  }, [activeShop, customItemsByShop]);

  // Filter vendors that match current shop category
  const matchingVendors = useMemo(() => {
    const cat = activeShop.vendorCategory.toLowerCase();
    return vendors.filter((v) => {
      const vCat = (v.category || '').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      return (
        vCat.includes(cat) ||
        (cat.includes('meat') && (vCat.includes('non-veg') || vName.includes('meat') || vName.includes('chicken'))) ||
        (cat.includes('vegetable') && (vCat.includes('fruit') || vName.includes('sabzi') || vName.includes('mandi') || vName.includes('produce'))) ||
        (cat.includes('dairy') && (vCat.includes('milk') || vName.includes('amul') || vName.includes('dairy'))) ||
        (cat.includes('grocery') && (vCat.includes('ration') || vCat.includes('spice') || vName.includes('kirana') || vName.includes('provision')))
      );
    });
  }, [vendors, activeShop]);

  // Selected vendor for this shop (defaults to first matching, or first overall)
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  // Auto-select vendor when shop changes
  useEffect(() => {
    if (matchingVendors.length > 0) {
      setSelectedVendorId(matchingVendors[0].id);
    } else if (vendors.length > 0) {
      setSelectedVendorId(vendors[0].id);
    } else {
      setSelectedVendorId('');
    }
  }, [selectedShopId, matchingVendors, vendors]);

  const chosenVendor = useMemo(() => {
    return vendors.find((v) => v.id === selectedVendorId) || matchingVendors[0] || vendors[0];
  }, [vendors, selectedVendorId, matchingVendors]);

  // Filter items in active shop
  const displayedItems = useMemo(() => {
    if (!searchItem.trim()) return allShopItems;
    const q = searchItem.toLowerCase().trim();
    return allShopItems.filter(
      (i) => i.name.toLowerCase().includes(q) || (i.subtitle && i.subtitle.toLowerCase().includes(q))
    );
  }, [allShopItems, searchItem]);

  // Handle Adding a New Custom Item to Current Shop
  const handleCreateCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    const createdItem: ShopItemTemplate = {
      name: newItemName.trim(),
      subtitle: newItemSubtitle.trim() || `Custom item added to ${activeShop.name}`,
      unit: newItemUnit.trim() || 'Kg',
      defaultPrice: Math.max(0, Number(newItemPrice) || 0),
      category: activeShop.vendorCategory,
      defaultQty: Math.max(1, Number(newItemQty) || 1),
      isCustom: true,
    };

    setCustomItemsByShop((prev) => {
      const currentList = prev[activeShop.id] || [];
      const updatedList = [createdItem, ...currentList];
      const nextState = { ...prev, [activeShop.id]: updatedList };
      try {
        localStorage.setItem('hotel_purchasing_custom_shop_items', JSON.stringify(nextState));
      } catch {}
      return nextState;
    });

    // Automatically add the newly created item into the basket with requested quantity
    const key = `${activeShop.id}_${createdItem.name}`;
    setBasket((prev) => ({
      ...prev,
      [key]: {
        qty: createdItem.defaultQty || 1,
        price: createdItem.defaultPrice,
        name: createdItem.name,
        unit: createdItem.unit,
        category: createdItem.category,
      },
    }));

    toast.success(`"${createdItem.name}" added to ${activeShop.name} & Cart!`);
    setNewItemName('');
    setNewItemSubtitle('');
    setNewItemPrice(0);
    setNewItemQty(1);
    setShowAddItemModal(false);
  };

  // Delete a user-added custom item
  const handleDeleteCustomItem = (itemName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomItemsByShop((prev) => {
      const currentList = prev[activeShop.id] || [];
      const updatedList = currentList.filter((i) => i.name !== itemName);
      const nextState = { ...prev, [activeShop.id]: updatedList };
      try {
        localStorage.setItem('hotel_purchasing_custom_shop_items', JSON.stringify(nextState));
      } catch {}
      return nextState;
    });

    // Remove from basket if present
    const key = `${activeShop.id}_${itemName}`;
    setBasket((prev) => {
      if (!prev[key]) return prev;
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });

    toast.info(`Removed "${itemName}" from ${activeShop.name}`);
  };

  // Handle Qty Stepper
  const handleItemQtyChange = (item: ShopItemTemplate, delta: number) => {
    const key = `${activeShop.id}_${item.name}`;
    setBasket((prev) => {
      const current = prev[key];
      const currentQty = current ? current.qty : 0;
      const newQty = Math.max(0, currentQty + delta);
      if (newQty === 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return {
        ...prev,
        [key]: {
          qty: newQty,
          price: current?.price ?? item.defaultPrice,
          name: item.name,
          unit: item.unit,
          category: item.category,
        },
      };
    });
  };

  const handleSetExactQty = (item: ShopItemTemplate, qtyVal: number) => {
    const key = `${activeShop.id}_${item.name}`;
    setBasket((prev) => {
      if (qtyVal <= 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      const current = prev[key];
      return {
        ...prev,
        [key]: {
          qty: qtyVal,
          price: current?.price ?? item.defaultPrice,
          name: item.name,
          unit: item.unit,
          category: item.category,
        },
      };
    });
  };

  const handlePriceChange = (item: ShopItemTemplate, newPrice: number) => {
    const key = `${activeShop.id}_${item.name}`;
    setBasket((prev) => {
      if (!prev[key]) return prev;
      return {
        ...prev,
        [key]: {
          ...prev[key],
          price: Math.max(0, newPrice),
        },
      };
    });
  };

  // Quick 1-click add template default qty
  const handleQuickAdd = (item: ShopItemTemplate) => {
    const key = `${activeShop.id}_${item.name}`;
    setBasket((prev) => {
      const current = prev[key];
      const addQty = item.defaultQty || 1;
      const newQty = (current ? current.qty : 0) + addQty;
      return {
        ...prev,
        [key]: {
          qty: newQty,
          price: item.defaultPrice,
          name: item.name,
          unit: item.unit,
          category: item.category,
        },
      };
    });
    toast.success(`Added ${item.defaultQty || 1} ${item.unit} of ${item.name}`);
  };

  // Convert basket into POFormItem[]
  const basketItemList: POFormItem[] = useMemo(() => {
    return Object.values(basket).map((b) => ({
      name: b.name,
      category: b.category,
      qty: b.qty,
      unit: b.unit,
      price: b.price,
    }));
  }, [basket]);

  const basketTotalAmount = useMemo(() => {
    return basketItemList.reduce((sum, item) => sum + item.qty * (item.price || 0), 0);
  }, [basketItemList]);

  const clearBasket = () => {
    setBasket({});
  };

  // Submit Handler: Send to Kitchen Runner, Direct Inward or WhatsApp
  const handleExecuteOrder = async (
    receiveImmediately: boolean,
    sendWhatsAppImmediately: boolean,
    assignToKitchenRunner: boolean = false
  ) => {
    if (basketItemList.length === 0) {
      toast.error('Please select at least 1 item from this shop to order!');
      return;
    }

    if (!chosenVendor && vendors.length === 0) {
      toast.error('Please add or select a vendor first!');
      return;
    }

    setSubmitting(true);
    try {
      let notes = `${activeShop.emoji} Quick Procurement from ${activeShop.name}. Items: ${basketItemList.map((i) => `${i.name} (${i.qty} ${i.unit})`).join(', ')}`;
      if (assignToKitchenRunner) {
        notes = `[ASSIGNED_TO_KITCHEN_RUNNER] ${notes}`;
      } else if (sendWhatsAppImmediately) {
        notes = `[DIRECT_VENDOR_DISPATCH] ${notes}`;
      }

      await onQuickOrder({
        vendorId: chosenVendor?.id || vendors[0]?.id || '',
        vendorName: chosenVendor?.name || vendors[0]?.name || activeShop.name,
        vendorPhone: chosenVendor?.phone || vendors[0]?.phone || '',
        items: basketItemList,
        totalAmount: basketTotalAmount,
        receiveImmediately,
        sendWhatsAppImmediately,
        assignToKitchenRunner,
        notes,
      });
      clearBasket();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* ━━━ SECTION TITLE & INSTRUCTION ━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-amber-400 shrink-0" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            Procurement by Department & Shop
          </h2>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            — Select shop to pick items, add custom products, or inward stock
          </span>
        </div>

        {basketItemList.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
              {basketItemList.length} Items (₹{basketTotalAmount.toLocaleString('en-IN')})
            </span>
            <button
              onClick={clearBasket}
              className="text-[11px] text-slate-400 hover:text-rose-400 underline transition"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>

      {/* ━━━ 1. COMPACT SHOP BOXES GRID (All 9 Shops in tight grid) ━━━ */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-1.5 sm:gap-2">
        {HOTEL_SHOPS.map((shop) => {
          const isSelected = shop.id === selectedShopId;
          const shopItemKeys = Object.keys(basket).filter((k) => k.startsWith(`${shop.id}_`));
          const shopItemsCount = shopItemKeys.length;
          const customCount = (customItemsByShop[shop.id] || []).length;
          const totalItemsCount = shop.items.length + customCount;

          return (
            <div
              key={shop.id}
              onClick={() => {
                setSelectedShopId(shop.id);
                setSearchItem('');
                setShowAddItemModal(false);
                if (onFilterByShop) onFilterByShop(shop.name);
              }}
              className={`p-2 rounded-xl border transition cursor-pointer relative group flex flex-col justify-between select-none ${
                isSelected
                  ? shop.activeBorder
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              {/* Top: Emoji & Badge */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-lg filter drop-shadow">{shop.emoji}</span>
                {shopItemsCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-black font-black text-[9px] animate-pulse">
                    {shopItemsCount}
                  </span>
                ) : (
                  <span className="text-[8px] font-bold px-1 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                    {totalItemsCount}
                  </span>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="mt-1.5">
                <h3 className="text-xs font-bold text-white leading-tight group-hover:text-amber-300 transition truncate">
                  {shop.name}
                </h3>
                <p className="text-[9px] text-slate-400 truncate mt-0.5">
                  {shop.badge}
                </p>
              </div>

              {/* Bottom active pill */}
              <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px]">
                <span className={`font-semibold ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}>
                  {isSelected ? 'Active' : 'Select'}
                </span>
                <ChevronRight
                  size={10}
                  className={`transition ${isSelected ? 'text-amber-400 translate-x-0.5' : 'text-slate-600'}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ━━━ 2. ACTIVE SHOP WORKBENCH (Compact) ━━━ */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg space-y-3.5">
        {/* Shop Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shrink-0 shadow-inner">
              {activeShop.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {activeShop.name}
                </h3>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.2 rounded-full">
                  {activeShop.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-1">{activeShop.tagline}</p>
            </div>
          </div>

          {/* Action Row: Vendor Selector & + Add Custom Item Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Vendor Selector for this Shop */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <Building2 size={13} className="text-amber-400 ml-1 shrink-0" />
              <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">Vendor:</span>

              {vendors.length > 0 ? (
                <select
                  value={chosenVendor?.id || selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer max-w-[180px]"
                >
                  {matchingVendors.length > 0 ? (
                    <optgroup label={`Recommended for ${activeShop.name}`}>
                      {matchingVendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.phone ? `(${v.phone})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ) : null}
                  <optgroup label="All Registered Vendors">
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} {v.category ? `[${v.category}]` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              ) : (
                <span className="text-xs text-slate-500 italic px-2">No vendor</span>
              )}

              <button
                type="button"
                onClick={onAddVendorClick}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-bold border border-slate-700 transition"
                title="Add a new vendor"
              >
                + Vendor
              </button>
            </div>

            {/* + Add Custom Item Button */}
            <button
              type="button"
              onClick={() => setShowAddItemModal(!showAddItemModal)}
              className="flex items-center gap-1 h-8 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs border border-amber-500/30 transition"
            >
              <PackagePlus size={14} className="text-amber-400" />
              <span>{showAddItemModal ? 'Close Form' : '+ Add Item'}</span>
            </button>
          </div>
        </div>

        {/* ━━━ INLINE FORM: ADD CUSTOM ITEM TO THIS SHOP ━━━ */}
        {showAddItemModal && (
          <form
            onSubmit={handleCreateCustomItem}
            className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 shadow-lg space-y-3 transition"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5">
                <PackagePlus size={14} className="text-amber-400" />
                <h4 className="text-xs font-bold text-white">
                  Add Custom Item to {activeShop.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Item Name */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Country Chicken, Red Capsicum, Oat Milk..."
                  className="w-full h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Unit *
                </label>
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full h-8 px-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {COMMON_PURCHASE_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estimated Rate / Price */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Rate (₹ per {newItemUnit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={newItemPrice || ''}
                  onChange={(e) => setNewItemPrice(Number(e.target.value) || 0)}
                  placeholder="e.g. 250"
                  className="w-full h-8 px-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold font-mono text-emerald-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Default Quantity */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Quantity ({newItemUnit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Number(e.target.value) || 1)}
                  placeholder="1"
                  className="w-full h-8 px-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Optional Description / Specification */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Optional Specification / Details
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemSubtitle}
                  onChange={(e) => setNewItemSubtitle(e.target.value)}
                  placeholder="e.g. Fresh daily supply, skinless, grade A quality..."
                  className="w-full h-8 px-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-4 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm shrink-0 transition"
                >
                  <Plus size={13} />
                  <span>Save & Add</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Search & Filter within current shop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="relative w-full sm:w-72">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
              placeholder={`Search in ${activeShop.name}...`}
              className="w-full h-8 pl-8 pr-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <span className="text-[11px] text-slate-400">
            <b>{displayedItems.length}</b> items available in this shop
          </span>
        </div>

        {/* ━━━ ITEM CARDS GRID FOR ACTIVE SHOP (Compact) ━━━ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {displayedItems.map((item) => {
            const key = `${activeShop.id}_${item.name}`;
            const basketEntry = basket[key];
            const inBasketQty = basketEntry?.qty || 0;
            const currentPrice = basketEntry?.price ?? item.defaultPrice;

            return (
              <div
                key={item.name}
                className={`p-2.5 rounded-xl border transition relative flex flex-col justify-between ${
                  inBasketQty > 0
                    ? 'bg-amber-950/20 border-amber-500/40 ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-bold text-white leading-snug truncate">
                          {item.name}
                        </h4>
                        {item.isCustom && (
                          <span className="px-1 rounded text-[8px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.unit}
                      </span>
                      {item.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCustomItem(item.name, e)}
                          className="w-4 h-4 rounded hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 flex items-center justify-center transition"
                          title="Delete custom item"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rate / Estimated Price */}
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Rate:</span>
                    <div className="flex items-center gap-0.5 font-mono font-bold text-emerald-400">
                      <span>₹</span>
                      <input
                        type="number"
                        value={currentPrice}
                        onChange={(e) => handlePriceChange(item, Number(e.target.value) || 0)}
                        className="w-14 h-5 px-1 text-right bg-slate-900 border border-slate-800 rounded font-bold text-xs text-emerald-300 focus:outline-none focus:border-amber-500"
                        title="Edit purchase rate per unit"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Controls: Quantity Stepper & Add */}
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  {inBasketQty > 0 ? (
                    <div className="flex items-center justify-between bg-slate-900 p-0.5 rounded-lg border border-amber-500/40">
                      <button
                        type="button"
                        onClick={() => handleItemQtyChange(item, -1)}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-rose-900/40 hover:text-rose-300 text-slate-300 flex items-center justify-center font-bold transition"
                        title="Reduce Quantity"
                      >
                        <Minus size={11} />
                      </button>

                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          value={inBasketQty}
                          onChange={(e) => handleSetExactQty(item, Number(e.target.value) || 0)}
                          className="w-10 h-5 text-center font-mono font-black text-amber-300 text-xs bg-transparent focus:outline-none"
                        />
                        <span className="text-[9px] font-semibold text-slate-400">{item.unit}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleItemQtyChange(item, 1)}
                        className="w-6 h-6 rounded bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center font-bold transition shadow"
                        title="Increase Quantity"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(item)}
                      className="w-full h-7 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-black text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1 border border-slate-700/80 group"
                    >
                      <Plus size={12} className="text-amber-400 group-hover:text-black" />
                      <span>
                        + Add ({item.defaultQty || 1} {item.unit})
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ━━━ 3. ACTIVE ORDER TRAY / BASKET SUMMARY BAR (Compact) ━━━ */}
        {basketItemList.length > 0 ? (
          <div className="mt-4 p-3 sm:p-4 rounded-xl bg-slate-950 border border-amber-500/40 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ShoppingCart size={14} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                    <span>Order Cart ({chosenVendor?.name || activeShop.name})</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-black">
                      {basketItemList.length} items
                    </span>
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Total:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  ₹{basketTotalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Selected Items Chips / List */}
            <div className="flex flex-wrap gap-1.5">
              {basketItemList.map((it) => (
                <div
                  key={it.name}
                  className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5 text-[11px]"
                >
                  <span className="font-semibold text-white">{it.name}:</span>
                  <span className="font-mono text-amber-300 font-bold">
                    {it.qty} {it.unit}
                  </span>
                  <span className="font-mono text-emerald-400">
                    = ₹{((it.qty) * (it.price || 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              {/* Option 1: Send to Kitchen Runner / Staff Market List */}
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleExecuteOrder(false, false, true)}
                className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-indigo-600/30"
                title="Send items directly to Kitchen Staff Market Buying List (Staff can tick done as they buy)"
              >
                <span>🏃‍♂️ Send to Kitchen Runner</span>
              </button>

              {/* Option 2: Direct WhatsApp to Vendor */}
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleExecuteOrder(false, true, false)}
                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                title="Send WhatsApp PO directly to vendor"
              >
                <MessageCircle size={13} />
                <span>WhatsApp to Vendor 📲</span>
              </button>

              {/* Option 3: Direct Inward (Goods already received) */}
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleExecuteOrder(true, false, false)}
                className="h-8 px-3.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition disabled:opacity-50 shadow-sm"
              >
                {submitting ? (
                  <RefreshCw size={13} className="animate-spin" />
                ) : (
                  <Truck size={13} />
                )}
                <span>Direct Inward 📦</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  onOpenFullFormWithItems(
                    basketItemList,
                    chosenVendor?.id,
                    `Order from ${activeShop.name}`
                  )
                }
                className="h-8 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition"
                title="Open Detailed Custom PO Form"
              >
                <FileText size={13} />
                <span>Full Form</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
