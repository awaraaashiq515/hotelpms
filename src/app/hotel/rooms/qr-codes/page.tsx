'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import {
  Printer,
  Download,
  Copy,
  ExternalLink,
  Search,
  Hotel,
  Wifi,
  Phone,
  Check,
  RefreshCw,
  ArrowLeft,
  QrCode,
  Globe,
  Smartphone,
  UtensilsCrossed,
  KeyRound,
  DoorOpen,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  Layers,
  FileDown,
  X,
  Car,
  Star,
  Utensils,
  Coffee,
  HeartHandshake,
  Store,
  Bike,
  ThumbsUp,
  CreditCard,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface RoomType {
  id: string;
  name: string;
  baseRate?: number;
}

interface Room {
  id: string;
  roomNumber: string;
  floor?: string | null;
  status?: string;
  housekeepingStatus?: string;
  roomType?: RoomType;
  roomTypeId?: string;
  wifiPassword?: string;
}

interface TableItem {
  id: string;
  name: string;
  qrToken?: string | null;
  floor?: { id: string; name: string } | null;
  property?: { name: string; code: string };
}

interface ParkingSlotItem {
  id: string;
  name: string;
  qrToken?: string | null;
  slotNumber?: string | null;
}

interface PropertyInfo {
  id: string;
  name: string;
  code: string;
  phone?: string;
  address?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  googleReviewUrl?: string;
  googlePlaceId?: string;
}

export type QRCategoryTab =
  | 'all'
  | 'rooms'
  | 'tables'
  | 'ratings'
  | 'parking'
  | 'wifi'
  | 'reception'
  | 'delivery'
  | 'tipping';

export type PortalMode = 'door-concierge' | 'room-portal' | 'guest-portal';
export type PlacardStyle = 'door-placard' | 'door-hanger' | 'compact-badge';

export interface UniversalQRItem {
  id: string;
  category: 'room' | 'table' | 'rating' | 'parking' | 'wifi' | 'reception' | 'delivery' | 'tipping';
  categoryLabel: string;
  tag: string;
  title: string;
  subtitle: string;
  qrUrl: string;
  instructionTitle: string;
  instructionSubtitle: string;
  features: string[];
  colorTheme: 'amber' | 'emerald' | 'indigo' | 'violet' | 'sky' | 'rose' | 'teal';
  rawRoom?: Room;
}

export default function UniversalQRCodesPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlotItem[]>([]);
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

  // Category Tab: 'all' | 'rooms' | 'tables' | 'ratings' | 'parking' | 'wifi' | 'reception' | 'delivery' | 'tipping'
  const [activeTab, setActiveTab] = useState<QRCategoryTab>('all');

  // Room Portal Mode: default to 'door-concierge'
  const [portalMode, setPortalMode] = useState<PortalMode>('door-concierge');

  // Placard layout style
  const [placardStyle, setPlacardStyle] = useState<PlacardStyle>('door-placard');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Selection & Print state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printScope, setPrintScope] = useState<'current-tab' | 'all-hotel' | 'single' | 'selected'>('current-tab');
  const [selectedSingleItem, setSelectedSingleItem] = useState<UniversalQRItem | null>(null);
  const [printSingleItemId, setPrintSingleItemId] = useState<string | null>(null);
  const [printLayout, setPrintLayout] = useState<'2-per-page' | '4-per-page' | '1-per-page'>('2-per-page');

  // Copied link indicator
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch all necessary data
  const loadData = async () => {
    setLoading(true);
    try {
      const [roomsRes, tablesRes, parkingRes, sessionRes, portalConfigRes, propRes] = await Promise.all([
        fetch('/api/hotel/rooms').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/tables?showAll=true').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/parking-slots').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/auth/session').then((r) => r.json()).catch(() => null),
        fetch('/api/room-portal/config').then((r) => r.json()).catch(() => null),
        fetch('/api/admin/properties').then((r) => r.json()).catch(() => null),
      ]);

      if (roomsRes?.success && Array.isArray(roomsRes.data)) {
        setRooms(roomsRes.data);
      }
      if (tablesRes?.success && Array.isArray(tablesRes.data)) {
        setTables(tablesRes.data);
      }
      if (parkingRes?.success && Array.isArray(parkingRes.data)) {
        setParkingSlots(parkingRes.data);
      }

      const u = sessionRes?.authenticated ? sessionRes.user : null;
      const cfg = portalConfigRes?.config || null;
      const propList = Array.isArray(propRes?.data) ? propRes.data : [];
      const currentProp = propList.find((p: any) => p.id === u?.propertyId) || propList[0] || null;

      const propName = currentProp?.name || u?.propertyName || 'Grand Luxury Hotel';
      const propCode = currentProp?.code || u?.propertyCode || 'HOTEL';
      const propPhone = cfg?.frontDeskPhone || currentProp?.phone || u?.phone || '+91 98765 43210';
      const wifiSsid = cfg?.wifiName || currentProp?.wifiSsid || `${propName.replace(/\s+/g, '-')}-Guest-WiFi`;
      const wifiPassword = cfg?.wifiPassword || currentProp?.wifiPassword || 'Welcome@Stay';
      const googleReviewUrl = currentProp?.googleReviewUrl || '';
      const googlePlaceId = currentProp?.googlePlaceId || '';

      setProperty({
        id: currentProp?.id || u?.propertyId || '',
        name: propName,
        code: propCode,
        phone: propPhone,
        address: currentProp?.address || u?.propertyAddress || '',
        wifiSsid,
        wifiPassword,
        googleReviewUrl,
        googlePlaceId,
      });
    } catch (err) {
      console.error('Error loading QR data:', err);
      toast.error('Failed to load QR data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
    loadData();
  }, []);

  // Compute available floors
  const floorsList = useMemo(() => {
    const floors = new Set<string>();
    rooms.forEach((r) => {
      if (r.floor) floors.add(r.floor);
    });
    tables.forEach((t) => {
      if (t.floor?.name) floors.add(t.floor.name);
    });
    return Array.from(floors).sort();
  }, [rooms, tables]);

  // Generate QR URL for a room
  const getRoomQRUrl = (room: Room) => {
    const base = origin || '';
    const propCode = (property?.code || 'HOTEL').toLowerCase();

    if (portalMode === 'door-concierge') {
      return `${base}/door/${encodeURIComponent(propCode)}/${encodeURIComponent(room.roomNumber)}`;
    }
    if (portalMode === 'room-portal') {
      return `${base}/room-portal?room=${encodeURIComponent(room.roomNumber)}&propertyCode=${encodeURIComponent(propCode)}`;
    }
    return `${base}/guest-portal?room=${encodeURIComponent(room.roomNumber)}&propertyCode=${encodeURIComponent(propCode)}`;
  };

  // Build the complete array of universal QR items
  const allUniversalItems = useMemo<UniversalQRItem[]>(() => {
    const base = origin || '';
    const propCode = (property?.code || 'HOTEL').toLowerCase();
    const propName = property?.name || 'Grand Palace Hotel';
    const wifiSsid = property?.wifiSsid || 'Hotel-Guest-WiFi';
    const wifiPassword = property?.wifiPassword || 'Welcome@Stay';
    const googleReviewUrl =
      property?.googleReviewUrl ||
      (property?.googlePlaceId
        ? `https://search.google.com/local/writereview?placeid=${property.googlePlaceId}`
        : `${base}/rate/${propCode}/review`);

    const items: UniversalQRItem[] = [];

    // 1. HOTEL ROOMS
    rooms.forEach((room) => {
      const roomTypeName = room.roomType?.name || 'Deluxe Room';
      const floorLabel = room.floor ? `${room.floor} Floor` : 'Guest Floor';
      items.push({
        id: `room-${room.id}`,
        category: 'room',
        categoryLabel: 'Hotel Room',
        tag:
          portalMode === 'door-concierge'
            ? 'ROOM DOOR CONCIERGE'
            : portalMode === 'room-portal'
            ? 'IN-ROOM TV & TABLET'
            : 'GUEST DIGITAL ACCESS',
        title: `ROOM ${room.roomNumber}`,
        subtitle: `${roomTypeName} • ${floorLabel}`,
        qrUrl: getRoomQRUrl(room),
        instructionTitle:
          portalMode === 'door-concierge'
            ? 'SCAN FOR DOOR CONCIERGE & RECEPTION'
            : 'SCAN FOR IN-ROOM SERVICES & KIOSK',
        instructionSubtitle: 'Point your camera at this QR code to access instant room assistance',
        features: ['Call Reception', 'Room Key Help', 'In-Room Dining', 'Housekeeping'],
        colorTheme: 'amber',
        rawRoom: room,
      });
    });

    // 2. RESTAURANT & CAFE DINING TABLES
    tables.forEach((table) => {
      const floorName = table.floor?.name ? `${table.floor.name} Floor` : 'Dining Hall';
      items.push({
        id: `table-${table.id}`,
        category: 'table',
        categoryLabel: 'Dining Table',
        tag: 'RESTAURANT & CAFE TABLE',
        title: table.name.toUpperCase(),
        subtitle: `${floorName} • Digital Menu & Ordering`,
        qrUrl: `${base}/menu/${propCode}/${table.qrToken || table.id}`,
        instructionTitle: 'SCAN TO ORDER FOOD & DRINKS',
        instructionSubtitle: 'View contactless digital menu, place kitchen order & call waiter',
        features: ['Digital Food & Bar Menu', 'Direct Kitchen Order', 'Call Waiter & Service', 'Instant Bill Request'],
        colorTheme: 'emerald',
      });
    });

    // 3. RATINGS & GOOGLE REVIEWS
    // 3a. Google 5-Star Review Standee
    items.push({
      id: 'rating-google-review',
      category: 'rating',
      categoryLabel: 'Google Review',
      tag: '5-STAR GOOGLE REVIEW',
      title: 'GOOGLE 5-STAR REVIEW',
      subtitle: `${propName} • Google Maps Verified`,
      qrUrl: googleReviewUrl,
      instructionTitle: 'SCAN TO LEAVE A 5-STAR GOOGLE REVIEW',
      instructionSubtitle: 'Loved your stay? Please share your 5-star experience on Google Maps',
      features: ['Direct Google Maps Link', 'Rate Food & Cleanliness', 'Help Fellow Travelers', 'Instant Feedback'],
      colorTheme: 'amber',
    });

    // 3b. Dining & Food Quality Rating Standee
    items.push({
      id: 'rating-dining-feedback',
      category: 'rating',
      categoryLabel: 'Dining Review',
      tag: 'FOOD & RESTAURANT RATING',
      title: 'RESTAURANT & FOOD RATING',
      subtitle: `${propName} • Dining & Culinary Experience`,
      qrUrl: `${base}/rate/${propCode}/dining`,
      instructionTitle: 'SCAN TO RATE YOUR MEAL & DINING',
      instructionSubtitle: 'Help our chef and service team deliver culinary perfection',
      features: ['Food Taste & Freshness', 'Server Courtesy Rating', 'Cleanliness & Ambience', 'Compliments & Ideas'],
      colorTheme: 'rose',
    });

    // 3c. Overall Hotel Stay Feedback
    items.push({
      id: 'rating-hotel-stay',
      category: 'rating',
      categoryLabel: 'Stay Feedback',
      tag: 'HOTEL STAY & HOSPITALITY',
      title: 'HOTEL STAY FEEDBACK',
      subtitle: `${propName} • Guest Satisfaction Studio`,
      qrUrl: `${base}/rate/${propCode}/stay`,
      instructionTitle: 'SCAN TO RATE YOUR HOTEL STAY',
      instructionSubtitle: 'Tell our management team how we made your visit special',
      features: ['Room Comfort & Sleep', 'Front Desk Hospitality', 'Housekeeping Quality', 'Direct Management Review'],
      colorTheme: 'violet',
    });

    // 4. PARKING & VALET / DRIVE-IN
    if (parkingSlots.length > 0) {
      parkingSlots.forEach((slot) => {
        items.push({
          id: `parking-${slot.id}`,
          category: 'parking',
          categoryLabel: 'Parking Slot',
          tag: 'CAR SIDE & DRIVE-IN SERVICE',
          title: slot.name.toUpperCase(),
          subtitle: 'Car Side Ordering & Valet Bay',
          qrUrl: `${base}/menu/parking/${propCode}/${slot.qrToken || slot.id}`,
          instructionTitle: 'SCAN FROM YOUR CAR FOR FOOD & VALET',
          instructionSubtitle: 'Order food straight to your car without stepping out',
          features: ['Car Side Food Delivery', 'Call Valet & Attendant', 'Contactless Payment', 'Live Order Tracking'],
          colorTheme: 'sky',
        });
      });
    }

    // General Valet & Parking Standee
    items.push({
      id: 'parking-valet-standee',
      category: 'parking',
      categoryLabel: 'Valet Service',
      tag: 'HOTEL VALET & PARKING',
      title: 'HOTEL VALET PARKING',
      subtitle: `${propName} • Valet & Car Retrieval`,
      qrUrl: `${base}/menu/parking/${propCode}/valet`,
      instructionTitle: 'SCAN FOR VALET & VEHICLE ASSISTANCE',
      instructionSubtitle: 'Request vehicle retrieval, valet assistance, or driver pickup',
      features: ['Request Car Retrieval', 'Valet Pickup Alert', 'Secure Parking Bay', 'Driver Assistance'],
      colorTheme: 'sky',
    });

    // 5. GUEST HIGH-SPEED WI-FI
    items.push({
      id: 'wifi-placard-main',
      category: 'wifi',
      categoryLabel: 'Guest WiFi',
      tag: 'FREE HIGH-SPEED WI-FI',
      title: 'GUEST WI-FI CONNECT',
      subtitle: `SSID: ${wifiSsid}`,
      qrUrl: `WIFI:S:${wifiSsid};T:WPA;P:${wifiPassword};;`,
      instructionTitle: 'SCAN TO CONNECT TO WI-FI INSTANTLY',
      instructionSubtitle: 'No typing password required! Scan with camera to join immediately',
      features: [
        `Network: ${wifiSsid}`,
        `Password: ${wifiPassword}`,
        'Ultra-Fast Fiber Internet',
        'Unlimited Streaming & Work',
      ],
      colorTheme: 'indigo',
    });

    // 6. RECEPTION & FRONT DESK EXPRESS CHECK-IN
    items.push({
      id: 'reception-checkin-standee',
      category: 'reception',
      categoryLabel: 'Front Desk',
      tag: 'EXPRESS DIGITAL CHECK-IN',
      title: 'EXPRESS CHECK-IN KIOSK',
      subtitle: `${propName} • Contactless Reception`,
      qrUrl: `${base}/guest-portal?propertyCode=${propCode}`,
      instructionTitle: 'SCAN FOR FAST-TRACK MOBILE CHECK-IN',
      instructionSubtitle: 'Skip the front desk queue! Upload ID proof and access your stay',
      features: ['Instant Mobile Check-In', 'Upload Aadhaar / Passport', 'View Folio & Dues', 'Digital Access Pass'],
      colorTheme: 'teal',
    });

    // 7. ROOM SERVICE & HOME DELIVERY FLYER
    items.push({
      id: 'delivery-flyer-main',
      category: 'delivery',
      categoryLabel: 'Delivery Flyer',
      tag: 'ROOM SERVICE & DELIVERY',
      title: 'ROOM SERVICE & DELIVERY',
      subtitle: `${propName} • Fresh Food 24/7`,
      qrUrl: `${base}/menu/${propCode}/delivery`,
      instructionTitle: 'SCAN TO ORDER FOOD FOR DELIVERY',
      instructionSubtitle: 'Fresh multi-cuisine meals delivered straight from our kitchen',
      features: ['Full Dining Menu', 'Fast Contactless Delivery', 'Live Cooking Updates', 'UPI & Card Payment'],
      colorTheme: 'emerald',
    });

    // 8. STAFF TIPPING STANDEE
    items.push({
      id: 'staff-tipping-standee',
      category: 'tipping',
      categoryLabel: 'Staff Tip',
      tag: 'STAFF GRATUITY & TIP',
      title: 'TIP OUR HOTEL STAFF',
      subtitle: 'Housekeeping, Waiters & Front Desk Team',
      qrUrl: `${base}/tip/${propCode}`,
      instructionTitle: 'SCAN TO SEND A DIGITAL TIP',
      instructionSubtitle: '100% of your gratuity goes directly to our hardworking staff',
      features: ['100% Direct to Staff', 'UPI, GPay, PhonePe, Cards', 'Leave a Thank You Note', 'Motivate Our Team'],
      colorTheme: 'rose',
    });

    return items;
  }, [rooms, tables, parkingSlots, property, origin, portalMode]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allUniversalItems.length,
      rooms: allUniversalItems.filter((i) => i.category === 'room').length,
      tables: allUniversalItems.filter((i) => i.category === 'table').length,
      ratings: allUniversalItems.filter((i) => i.category === 'rating').length,
      parking: allUniversalItems.filter((i) => i.category === 'parking').length,
      wifi: allUniversalItems.filter((i) => i.category === 'wifi').length,
      reception: allUniversalItems.filter((i) => i.category === 'reception').length,
      delivery: allUniversalItems.filter((i) => i.category === 'delivery').length,
      tipping: allUniversalItems.filter((i) => i.category === 'tipping').length,
    };
    return counts;
  }, [allUniversalItems]);

  // Filtered items based on activeTab, search, floor
  const filteredItems = useMemo(() => {
    return allUniversalItems.filter((item) => {
      // 1. Category Tab Filter
      if (activeTab !== 'all') {
        if (item.category !== activeTab) return false;
      }

      // 2. Search Query Filter
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSubtitle = item.subtitle.toLowerCase().includes(q);
        const matchTag = item.tag.toLowerCase().includes(q);
        const matchCategory = item.categoryLabel.toLowerCase().includes(q);
        if (!matchTitle && !matchSubtitle && !matchTag && !matchCategory) return false;
      }

      // 3. Floor Filter (for rooms and tables)
      if (selectedFloor !== 'all') {
        const floorStr = selectedFloor.toLowerCase();
        const matchesFloor =
          item.subtitle.toLowerCase().includes(floorStr) ||
          item.title.toLowerCase().includes(floorStr);
        if (!matchesFloor) return false;
      }

      return true;
    });
  }, [allUniversalItems, activeTab, searchQuery, selectedFloor]);

  // Download QR Code as PNG
  const handleDownloadPNG = async (item: UniversalQRItem) => {
    try {
      const dataUrl = await QRCode.toDataURL(item.qrUrl, {
        width: 800,
        margin: 2,
        color: {
          dark: '#0a0f1d',
          light: '#ffffff',
        },
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      const cleanName = item.title.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `QR_${cleanName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${item.title} QR Code downloaded!`);
    } catch {
      toast.error('Failed to download QR code image.');
    }
  };

  // Copy QR URL to clipboard
  const handleCopyLink = (item: UniversalQRItem) => {
    navigator.clipboard.writeText(item.qrUrl);
    setCopiedId(item.id);
    toast.success(`${item.title} QR link copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle select item for custom batch printing
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle select all visible items
  const handleToggleSelectAll = () => {
    if (selectedItemIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  // Open Print Modal with target scope ('current-tab' | 'all-hotel' | 'single' | 'selected')
  const openPrintDialog = (
    scope: 'current-tab' | 'all-hotel' | 'single' | 'selected',
    item?: UniversalQRItem
  ) => {
    setPrintScope(scope);
    if (item) {
      setSelectedSingleItem(item);
    } else if (scope === 'single' && filteredItems[0]) {
      setSelectedSingleItem(filteredItems[0]);
    }
    setShowPrintModal(true);
  };

  // Execute Print
  const executePrint = () => {
    setShowPrintModal(false);
    if (printScope === 'single' && selectedSingleItem) {
      setPrintSingleItemId(selectedSingleItem.id);
    } else {
      setPrintSingleItemId(null);
    }

    setTimeout(() => {
      window.print();
      setPrintSingleItemId(null);
    }, 200);
  };

  // Helper: check if an item should be rendered during print
  const isItemVisibleInPrint = (item: UniversalQRItem) => {
    if (printSingleItemId) {
      return item.id === printSingleItemId;
    }
    if (printScope === 'selected' && selectedItemIds.size > 0) {
      return selectedItemIds.has(item.id);
    }
    if (printScope === 'all-hotel') {
      return true; // Print every item across the whole hotel
    }
    if (printScope === 'current-tab') {
      return filteredItems.some((fi) => fi.id === item.id);
    }
    return true;
  };

  const currentTabLabel = useMemo(() => {
    switch (activeTab) {
      case 'rooms':
        return 'Hotel Rooms';
      case 'tables':
        return 'Restaurant Tables';
      case 'ratings':
        return 'Ratings & Google Reviews';
      case 'parking':
        return 'Parking & Valet';
      case 'wifi':
        return 'Guest WiFi';
      case 'reception':
        return 'Reception & Check-In';
      case 'delivery':
        return 'Delivery Flyer';
      case 'tipping':
        return 'Staff Tipping';
      default:
        return 'All Hotel QR Placards';
    }
  }, [activeTab]);

  return (
    <>
      <Toaster richColors position="top-center" />

      {/* ── Print Stylesheet ── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body, html {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header,
          nav,
          aside,
          .no-print {
            display: none !important;
          }
          .print-area {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          .print-hidden {
            display: none !important;
          }
          .placards-container {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 14px !important;
            width: 100% !important;
          }
          .placards-container.layout-1col {
            grid-template-columns: 1fr !important;
          }
          .placards-container.layout-1col .placard-card {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 240mm !important;
            justify-content: space-around !important;
          }
          .placards-container.layout-4col {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
          .placards-container.layout-compact {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }
          .placard-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-shadow: none !important;
            border: 2px solid #0f172a !important;
            background: #ffffff !important;
            color: #0f172a !important;
            margin-bottom: 14px !important;
          }
          .placard-card * {
            color: #0f172a !important;
          }
          .placard-dark-badge {
            background: #0f172a !important;
            color: #ffffff !important;
          }
        }
      `}</style>

      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 print-area">
        {/* ── Top Header Navigation Bar (Hidden on Print) ── */}
        <div className="no-print space-y-4 border-b border-slate-800 pb-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Link
                  href="/hotel"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Hotel Hub</span>
                </Link>
                <span className="text-slate-600">/</span>
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                  <QrCode size={13} /> Complete QR Placards &amp; Standee Studio
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-2.5">
                <span>QR Placards &amp; Standee Studio</span>
                <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {filteredItems.length} Available
                </span>
              </h1>
              <p className="text-slate-400 text-xs mt-1 max-w-3xl">
                Unified printing and management hub for all QR codes across your property: Room Door Concierge,
                Restaurant Dining Tables, Google 5-Star Reviews, Valet Parking, Guest High-Speed WiFi, and Front Desk Check-In.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href={filteredItems[0]?.qrUrl || '/door'}
                target="_blank"
                className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Smartphone size={13} />
                <span>Preview Mobile Scan</span>
                <ExternalLink size={11} className="text-slate-500" />
              </Link>

              <button
                type="button"
                onClick={() => openPrintDialog('current-tab')}
                disabled={filteredItems.length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Printer size={15} />
                <span>Print All in Tab ({filteredItems.length})</span>
              </button>
            </div>
          </div>

          {/* ── Category Navigation Tabs (The requested QR types: Rooms, Tables, Ratings, Parking, WiFi, etc.) ── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All QR Placards', count: categoryCounts.all, icon: Layers },
              { id: 'rooms', label: 'Room Doors', count: categoryCounts.rooms, icon: DoorOpen },
              { id: 'tables', label: 'Dining Tables', count: categoryCounts.tables, icon: UtensilsCrossed },
              { id: 'ratings', label: 'Reviews & Ratings', count: categoryCounts.ratings, icon: Star },
              { id: 'parking', label: 'Parking & Valet', count: categoryCounts.parking, icon: Car },
              { id: 'wifi', label: 'Guest WiFi', count: categoryCounts.wifi, icon: Wifi },
              { id: 'reception', label: 'Express Check-In', count: categoryCounts.reception, icon: Sparkles },
              { id: 'delivery', label: 'Delivery Flyer', count: categoryCounts.delivery, icon: Bike },
              { id: 'tipping', label: 'Staff Tipping', count: categoryCounts.tipping, icon: HeartHandshake },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as QRCategoryTab);
                    setSelectedItemIds(new Set());
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black scale-102'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-slate-950' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive ? 'bg-black/30 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Mode & Filter Bar ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* 1. Target Portal Purpose (active for rooms) */}
            <div className="p-2.5 rounded-2xl bg-[#090f1d] border border-amber-500/30 shadow-md">
              <label className="block text-[10px] font-black text-amber-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Room Destination Mode:</span>
                <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.2 rounded text-amber-300">
                  {portalMode === 'door-concierge' ? 'Outside Door' : portalMode === 'room-portal' ? 'In-Room TV' : 'Login'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPortalMode('door-concierge')}
                  className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-black transition-all truncate ${
                    portalMode === 'door-concierge'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Door Concierge: Call reception, key assistance, locked out help"
                >
                  🚪 Door
                </button>
                <button
                  type="button"
                  onClick={() => setPortalMode('room-portal')}
                  className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-black transition-all truncate ${
                    portalMode === 'room-portal'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tablet Kiosk inside the room"
                >
                  📺 In-Room
                </button>
                <button
                  type="button"
                  onClick={() => setPortalMode('guest-portal')}
                  className={`py-1.5 px-1.5 rounded-lg text-[10.5px] font-black transition-all truncate ${
                    portalMode === 'guest-portal'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Guest Self-Service login"
                >
                  📱 Portal
                </button>
              </div>
            </div>

            {/* 2. Universal Search Filter */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Search QR Name or Number
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. 101, Table 4, Google, Valet..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* 3. Floor Filter */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Filter by Floor / Zone
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Floors &amp; Zones</option>
                {floorsList.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Placard Format & Template Style */}
            <div className="p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Placard Template Format
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPlacardStyle('door-placard')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    placardStyle === 'door-placard'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title="Standard wall or acrylic table standee"
                >
                  <span>🏷️ Standee</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlacardStyle('door-hanger')}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                    placardStyle === 'door-hanger'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title="Door handle hanger cutout"
                >
                  <span>🔖 Hanger</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPlacardStyle('compact-badge')}
                  className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition ${
                    placardStyle === 'compact-badge'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                  title="Compact plaque sticker"
                >
                  🔲 Sticker
                </button>
              </div>
            </div>
          </div>

          {/* ── Quick Batch Print & Selection Banner ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900/95 to-amber-500/10 border border-amber-500/40 shadow-xl">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    selectedItemIds.size === filteredItems.length && filteredItems.length > 0
                      ? 'bg-amber-500 border-amber-400 text-slate-950'
                      : 'border-slate-500 bg-slate-950'
                  }`}
                >
                  {selectedItemIds.size === filteredItems.length && filteredItems.length > 0 && <Check size={11} />}
                </div>
                <span>
                  {selectedItemIds.size === filteredItems.length && filteredItems.length > 0
                    ? 'Deselect All'
                    : `Select All (${filteredItems.length})`}
                </span>
              </button>

              <span className="text-xs text-slate-300 font-semibold">
                Showing <strong className="text-white">{filteredItems.length}</strong> {currentTabLabel}
                {selectedItemIds.size > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black">
                    {selectedItemIds.size} Selected
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {selectedItemIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => openPrintDialog('selected')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                >
                  <Printer size={14} />
                  <span>Print Selected ({selectedItemIds.size})</span>
                </button>
              )}

              {/* Print All in Active Tab */}
              <button
                type="button"
                onClick={() => openPrintDialog('current-tab')}
                disabled={filteredItems.length === 0}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Printer size={14} />
                <span>Print {currentTabLabel} ({filteredItems.length})</span>
              </button>

              {/* Master Print All Across Hotel */}
              <button
                type="button"
                onClick={() => openPrintDialog('all-hotel')}
                disabled={allUniversalItems.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-amber-500/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Printer size={16} />
                <span>🖨️ Print All Placards ({allUniversalItems.length} Placards)</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Loading Spinner ── */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-slate-400 text-xs font-semibold">Generating QR Placards &amp; Standees for Hotel...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-900/50 border border-slate-800 p-8 space-y-3">
            <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No QR items match your filter</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Reset your search query or switch tabs to view placards.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFloor('all');
                setSelectedCategory('all');
                setActiveTab('all');
              }}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* ── Placards Grid ── */
          <div
            className={`placards-container placards-grid-print ${
              printLayout === '1-per-page'
                ? 'layout-1col'
                : printLayout === '4-per-page'
                ? 'layout-4col'
                : 'layout-2col'
            } ${
              placardStyle === 'compact-badge'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            }`}
          >
            {filteredItems.map((item) => {
              const isSelected = selectedItemIds.has(item.id);
              const shouldPrintThisItem = isItemVisibleInPrint(item);

              return (
                <div
                  key={item.id}
                  className={`placard-card relative flex flex-col justify-between rounded-3xl transition-all border ${
                    !shouldPrintThisItem ? 'print-hidden' : ''
                  } ${
                    placardStyle === 'compact-badge'
                      ? 'bg-slate-900/80 border-slate-800 p-3.5 hover:border-slate-700'
                      : 'bg-gradient-to-b from-[#0e1629] via-[#090e1a] to-[#060a12] border-slate-800 shadow-2xl p-6 overflow-hidden group hover:border-amber-500/50'
                  }`}
                >
                  {/* Selection Checkbox (Hidden on Print) */}
                  <div className="no-print absolute top-3.5 left-3.5 z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectItem(item.id);
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md'
                          : 'bg-black/60 border-slate-700 text-transparent hover:border-slate-500 hover:text-slate-400'
                      }`}
                      title={isSelected ? 'Unselect card' : 'Select card for batch printing'}
                    >
                      <Check size={14} className={isSelected ? 'opacity-100' : 'opacity-0'} />
                    </button>
                  </div>

                  {placardStyle === 'compact-badge' ? (
                    /* ── 1. COMPACT STICKER VIEW ── */
                    <div className="space-y-2 text-center pt-5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white text-xs truncate max-w-[110px]" title={item.title}>
                          {item.title}
                        </span>
                        <span className="text-[9px] text-amber-400 font-bold">{item.categoryLabel}</span>
                      </div>
                      <div className="p-2.5 bg-white rounded-2xl inline-block shadow-md">
                        <QRCodeSVG value={item.qrUrl} size={110} level="H" />
                      </div>
                      <p className="text-[9.5px] text-slate-400 truncate font-semibold">
                        {item.instructionTitle}
                      </p>
                      <div className="no-print pt-1 flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openPrintDialog('single', item)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-white border border-amber-500/30 text-[10px] font-black flex items-center gap-1 cursor-pointer"
                          title="Print options: All or this card"
                        >
                          <Printer size={11} />
                          <span>Print</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPNG(item)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                        >
                          PNG
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ── 2. EXECUTIVE WALL PLACARD & TABLE STANDEE ── */
                    <>
                      {/* Ambient Accent Light */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />

                      {/* Optional Door Hanger Cutout Marker */}
                      {placardStyle === 'door-hanger' && item.category === 'room' && (
                        <div className="mb-3 text-center">
                          <div className="w-14 h-14 rounded-full border-2 border-dashed border-amber-500/40 mx-auto flex items-center justify-center text-[9px] text-amber-400 font-bold bg-amber-500/5">
                            DOOR HOOK
                          </div>
                          <span className="text-[8.5px] text-slate-500 uppercase tracking-widest block mt-0.5">
                            Cut out circle to hang on door handle
                          </span>
                        </div>
                      )}

                      {/* Header Crest */}
                      <div className="text-center relative z-10 space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-black uppercase tracking-widest">
                          <Hotel size={11} className="text-amber-400" />
                          <span>{property?.name || 'Grand Palace Hotel'}</span>
                        </div>

                        <div className="pt-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                            {item.tag}
                          </span>
                          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none mt-1">
                            {item.title}
                          </h2>
                          <p className="text-[11px] text-amber-300/80 font-bold mt-1">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>

                      {/* Centerpiece: Scannable Crisp QR Code Card */}
                      <div className="my-5 relative z-10 text-center">
                        <div className="inline-block p-4 bg-white rounded-3xl shadow-2xl border-4 border-amber-500/40 group-hover:border-amber-400 transition-colors">
                          <QRCodeSVG
                            value={item.qrUrl}
                            size={185}
                            level="H"
                            includeMargin={false}
                          />
                        </div>

                        <div className="mt-3 space-y-0.5">
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-400">
                            <Sparkles size={12} />
                            <span>{item.instructionTitle}</span>
                          </span>
                          <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto">
                            {item.instructionSubtitle}
                          </p>
                        </div>
                      </div>

                      {/* 4 Feature Highlights / Services Grid */}
                      <div className="grid grid-cols-2 gap-2 my-2 py-3 border-y border-slate-800/80 text-left relative z-10">
                        {item.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-[10.5px] text-slate-300 font-semibold truncate">
                            <CheckCircle2 size={13} className="text-amber-400 shrink-0" />
                            <span className="truncate">{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer & Assistance Hotline */}
                      <div className="pt-2 text-center relative z-10 space-y-1">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300">
                          <PhoneCall size={12} className="text-emerald-400" />
                          <span>Reception Hotline: {property?.phone || '+91 98765 43210'}</span>
                        </div>
                        <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">
                          24/7 Guest Flow Hospitality Systems
                        </p>
                      </div>

                      {/* Action Bar (Hidden in Print) */}
                      <div className="no-print mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Copy QR destination URL"
                          >
                            {copiedId === item.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedId === item.id ? 'Copied' : 'Copy'}</span>
                          </button>

                          <Link
                            href={item.qrUrl}
                            target="_blank"
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 transition-all"
                            title="Preview customer mobile destination page"
                          >
                            <ExternalLink size={12} />
                            <span>Preview</span>
                          </Link>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDownloadPNG(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-amber-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Download high-resolution 800x800 PNG file"
                          >
                            <Download size={12} />
                            <span>PNG</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openPrintDialog('single', item)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                            title="Print this placard"
                          >
                            <Printer size={13} />
                            <span>Print</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Print Confirmation & Layout Modal (Hidden on Print) ── */}
        {showPrintModal && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-[#0b1222] border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-left">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                    <Printer size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Print QR Placards Studio</h3>
                    <p className="text-xs text-slate-400">Choose print scope and page layout</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scope Selection */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Select What to Print:
                </label>
                <div className="space-y-2">
                  {/* Option 1: Current Tab Placards */}
                  <label
                    onClick={() => setPrintScope('current-tab')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      printScope === 'current-tab'
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="printScope"
                      checked={printScope === 'current-tab'}
                      onChange={() => setPrintScope('current-tab')}
                      className="mt-1 text-amber-500 focus:ring-amber-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white">
                          🖨️ Print Current Category ({filteredItems.length} Placards)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                          {currentTabLabel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Print all placards currently displayed in the {currentTabLabel} category.
                      </p>
                    </div>
                  </label>

                  {/* Option 2: Print Entire Hotel All Categories */}
                  <label
                    onClick={() => setPrintScope('all-hotel')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      printScope === 'all-hotel'
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="printScope"
                      checked={printScope === 'all-hotel'}
                      onChange={() => setPrintScope('all-hotel')}
                      className="mt-1 text-amber-500 focus:ring-amber-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white">
                          🌐 Print All Across Hotel ({allUniversalItems.length} Placards)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[10px]">
                          Full Hotel Batch
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Combines all Rooms, Tables, Google Reviews, Valet Parking, WiFi, and Check-In placards into one single batch!
                      </p>
                    </div>
                  </label>

                  {/* Option 3: Selected Placards Only */}
                  <label
                    onClick={() => setPrintScope('selected')}
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      printScope === 'selected'
                        ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="printScope"
                      checked={printScope === 'selected'}
                      onChange={() => setPrintScope('selected')}
                      className="mt-1 text-amber-500 focus:ring-amber-400"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-white">
                          ✅ Print Selected Placards Only ({selectedItemIds.size})
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
                          Custom Selection
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {selectedItemIds.size > 0
                          ? `Print placards for the ${selectedItemIds.size} cards you checked.`
                          : 'Please check the box on cards to select items first.'}
                      </p>
                    </div>
                  </label>

                  {/* Option 4: Single Item */}
                  {selectedSingleItem && (
                    <label
                      onClick={() => setPrintScope('single')}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        printScope === 'single'
                          ? 'bg-amber-500/15 border-amber-500/60 shadow-md shadow-amber-500/10'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="printScope"
                        checked={printScope === 'single'}
                        onChange={() => setPrintScope('single')}
                        className="mt-1 text-amber-500 focus:ring-amber-400"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white truncate max-w-[280px]">
                            🏷️ Print {selectedSingleItem.title} Only
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px]">
                            Single Item
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Print placard for {selectedSingleItem.title} ({selectedSingleItem.categoryLabel}) only.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Print Layout Options */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Page Print Layout (Per A4 Sheet):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintLayout('2-per-page')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      printLayout === '2-per-page'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">2 per Page</div>
                    <div className="text-[10px] text-slate-500">Standard Standee</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayout('4-per-page')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      printLayout === '4-per-page'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">4 per Page</div>
                    <div className="text-[10px] text-slate-500">Compact Saver</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintLayout('1-per-page')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      printLayout === '1-per-page'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-black'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">1 Full Page</div>
                    <div className="text-[10px] text-slate-500">Large Poster</div>
                  </button>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executePrint}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all cursor-pointer active:scale-95"
                >
                  <Printer size={15} />
                  <span>
                    {printScope === 'current-tab'
                      ? `Print ${filteredItems.length} Placards Now`
                      : printScope === 'all-hotel'
                      ? `Print All ${allUniversalItems.length} Hotel Placards`
                      : printScope === 'selected'
                      ? `Print ${selectedItemIds.size} Selected Placards`
                      : `Print ${selectedSingleItem?.title} Now`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
