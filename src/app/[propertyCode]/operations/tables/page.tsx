'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid, RefreshCcw, Plus,
  Search, Filter, ChevronRight,
  Map, Monitor, Utensils,
  Edit2, Trash2, X, Eye, ShoppingBag, Receipt, ArrowRightLeft, Power, QrCode, ChevronLeft,
  CarFront, Home, Settings, User as UserIcon, BedDouble
} from 'lucide-react';
import { QRModal } from '@/components/tables/QRModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { paymentModesApi } from '@/lib/api/payment-modes';
import { customersApi } from '@/lib/api/customers';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { TableForm } from '@/components/forms/table-form';
import { FloorForm } from '@/components/forms/floor-form';
import { TableLayoutView } from '@/components/tables/TableLayoutView';
import { Table } from '@/components/tables/TableCard';
import { KotSlipModal, KotSlipData } from '@/components/kots/KotSlipModal';
import { BillModal, BillData } from '@/components/billing/BillModal';
import { SwitchTableModal } from '@/components/tables/SwitchTableModal';
import { useSearchParams, useParams } from 'next/navigation';
import { useSidebar } from '@/context/sidebar-context';
import { MarkWasteModal } from '@/components/modals/MarkWasteModal';

interface Floor {
  id: string;
  name: string;
  order: number;
  propertyId: string;
  tables: Table[];
  menuType?: 'RESTAURANT' | 'BAR' | 'CAFE';
}

interface PaymentMode {
  id: string;
  name: string;
  type: string;
}

export default function TableManagementPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';
  const { setHidden, isOpen, setOpen } = useSidebar();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [outlets, setOutlets] = useState<any[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?status=UNREAD');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setUnreadNotifications(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch unread notifications", err);
    }
  }, []);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isSettingsView, setIsSettingsView] = useState(false);
  const [isFinalInvoice, setIsFinalInvoice] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [propertyData, setPropertyData] = useState<any>(null);
  const searchParams = useSearchParams();
  const floorIdFromUrl = searchParams.get('floorId');

  // Room Selection Modal (for restaurant → room billing)
  const [isRoomSelectModalOpen, setIsRoomSelectModalOpen] = useState(false);
  const [pendingTableForRoom, setPendingTableForRoom] = useState<Table | null>(null);
  const [occupiedRoomsForModal, setOccupiedRoomsForModal] = useState<any[]>([]);
  const [loadingRoomsForModal, setLoadingRoomsForModal] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  useEffect(() => {
    if (floorIdFromUrl && floorIdFromUrl !== activeFloorId) {
      setActiveFloorId(floorIdFromUrl);
      localStorage.setItem('pos_active_floor_id', floorIdFromUrl);
    }
  }, [floorIdFromUrl]);

  const activeFloorIdRef = useRef(activeFloorId);

  useEffect(() => {
    activeFloorIdRef.current = activeFloorId;
  }, [activeFloorId]);

  // Notification Sound
  const prevFloorsRef = React.useRef<Floor[]>([]);
  const playNotificationSound = async () => {
    try {
      const res = await fetch('/api/settings/notifications');
      const json = await res.json();
      let soundEnabled = false;
      if (json.success && Array.isArray(json.data)) {
        const orderPref = json.data.find((p: any) => p.type === 'ORDER');
        if (orderPref) {
          soundEnabled = orderPref.soundEnabled === 1 || orderPref.soundEnabled === true || orderPref.soundEnabled === 'true';
        }
      }
      if (!soundEnabled) return; // Only play if explicitly enabled

      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    } catch (err) {
      console.error('Failed to play sound:', err);
    }
  };

  // Modals Data
  const [kotSlip, setKotSlip] = useState<KotSlipData | null>(null);
  const [billData, setBillData] = useState<BillData | null>(null);

  // New Table Form Modal
  const [isTableFormOpen, setIsTableFormOpen] = useState(false);
  const [tableFormLoading, setTableFormLoading] = useState(false);
  const [editingTable, setEditingTable] = useState<any | null>(null);

  // New Floor Form Modal
  const [isFloorFormOpen, setIsFloorFormOpen] = useState(false);
  const [isFloorEditModalOpen, setIsFloorEditModalOpen] = useState(false);
  const [floorFormLoading, setFloorFormLoading] = useState(false);
  const [editingFloor, setEditingFloor] = useState<any | null>(null);

  // Switch Table Modal
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [sourceTableForSwitch, setSourceTableForSwitch] = useState<Table | null>(null);
  const [switchLoading, setSwitchLoading] = useState(false);

  // Waste Modal
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteOrderData, setWasteOrderData] = useState<any | null>(null);
  const [wasteLoading, setWasteLoading] = useState(false);

  // Waiter/Staff selection
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [showWaiterDropdown, setShowWaiterDropdown] = useState(false);
  const [waiterSearchQuery, setWaiterSearchQuery] = useState('');
  const [selectedWaiterFilter, setSelectedWaiterFilter] = useState<string>('');

  const fetchOrderPrintData = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/print`);
      const result = await res.json();
      return result.success ? result.data : null;
    } catch (err) {
      console.error('Failed to fetch print data:', err);
      return null;
    }
  };

  const handlePrintKOT = async (table: Table) => {
    if (!table.activeOrder?.id) return;
    const order = await fetchOrderPrintData(table.activeOrder.id);
    if (!order || !order.kotTickets?.length) return;

    // Combine all items from all KOT tickets for this order
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
    const floorName = latestKot.table?.floor?.name || order.table?.floor?.name || activeFloor?.name;
    const floorMenuType = latestKot.table?.floor?.menuType || order.table?.floor?.menuType || activeFloor?.menuType;
    setKotSlip({
      kotNo: latestKot.kotNo,
      orderNo: order.orderNo,
      tableNo: table.name,
      roomId: order.roomId || undefined,
      orderType: order.orderType,
      createdAt: latestKot.createdAt,
      items: allItems,
      floorName,
      floorMenuType
    });
  };

  const handlePrintBill = async (table: Table) => {
    if (!table.activeOrder?.id) return;
    const order = await fetchOrderPrintData(table.activeOrder.id);
    if (!order) return;

    setIsFinalInvoice(false);
    setBillData({
      orderNo: order.orderNo,
      tableNo: table.name,
      roomId: order.roomId || undefined,
      items: order.items.map((i: any) => ({
        id: i.productId || i.id,
        name: i.product.name,
        quantity: i.quantity,
        price: i.unitPrice || i.product.sellingPrice,
        hsnCode: i.product.hsnCode
      })),
      subtotal: order.subtotal,
      tax: order.taxAmount || (order.subtotal * 0.05),
      grandTotal: order.grandTotal,
      createdAt: order.createdAt,
      tableId: table.id,
      orderId: order.id,
      driverId: order.driverId || undefined,
      staffMemberId: order.staffMemberId || undefined,
      guestCount: order.guestCount || 1
    });

    try {
      await fetch('/api/orders/bill-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantTableId: table.id })
      });
      fetchData(); // Changed from fetchFloors to fetchData
    } catch (error) {
      console.error('Failed to mark bill printed', error);
    }
  };

  const handleMarkWaste = async (table: Table) => {
    if (!table.activeOrder?.id) return;
    setWasteLoading(true);
    try {
      const order = await fetchOrderPrintData(table.activeOrder.id);
      if (!order) {
        alert('Failed to fetch order details');
        return;
      }
      setWasteOrderData(order);
      setIsWasteModalOpen(true);
    } catch (error) {
      console.error('Waste modal open error:', error);
    } finally {
      setWasteLoading(false);
    }
  };



  const fetchStaticData = async () => {
    try {
      const [pmRes, custRes] = await Promise.all([
        fetch('/api/payment-modes'),
        fetch('/api/customers')
      ]);
      const pData = await pmRes.json();
      const cData = await custRes.json();
      if (pData.success) {
        setPaymentModes(pData.data);
      }
      if (cData.success || Array.isArray(cData)) {
        setCustomers(Array.isArray(cData) ? cData : cData.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch static data:', err);
    }
  };

  const fetchData = async () => {
    try {
      const floorsRes = await fetch('/api/floors');
      const fData = await floorsRes.json();

      if (fData.success) {
        const newFloors = fData.data as Floor[];
        
        // Detect changes for sound notification
        if (prevFloorsRef.current.length > 0) {
          let hasNewActivity = false;
          newFloors.forEach(nf => {
            const oldFloor = prevFloorsRef.current.find(of => of.id === nf.id);
            if (oldFloor) {
              nf.tables.forEach(nt => {
                const oldTable = oldFloor.tables.find(ot => ot.id === nt.id);
                if (oldTable) {
                  const newOrderId = nt.activeOrder?.id;
                  const oldOrderId = oldTable.activeOrder?.id;
                  const newOrderStatus = nt.activeOrder?.status;
                  const oldOrderStatus = oldTable.activeOrder?.status;

                  if (newOrderId && (!oldOrderId || newOrderStatus !== oldOrderStatus)) {
                    hasNewActivity = true;
                  }
                }
              });
            }
          });

          if (hasNewActivity) {
            playNotificationSound();
          }
        }
        
        const cleanedFloors = newFloors.map(floor => ({
          ...floor,
          tables: floor.tables.filter((t: any) => t.name.toLowerCase() !== 'home delivery')
        }));

        prevFloorsRef.current = cleanedFloors;
        setFloors(cleanedFloors);

        const currentValid = newFloors.find((f: any) => f.id === activeFloorIdRef.current);
        if (!currentValid && newFloors.length > 0) {
          const firstId = newFloors[0].id;
          setActiveFloorId(firstId);
          localStorage.setItem('pos_active_floor_id', firstId);
        }
      }
    } catch (error) {
      console.error('Failed to fetch floors data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };



  const fetchPropertyData = async () => {
    try {
      const res = await fetch('/api/admin/properties');
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        // Find property that matches current context (if available in session) or just pick first
        const slugifyInline = (str: string) => str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        const activeProp = json.data.find((p: any) => 
          p.code === propertyCode || 
          slugifyInline(p.name) === propertyCode || 
          p.id === propertyCode
        );
        setPropertyData(activeProp || json.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch property data:', err);
    }
  };

  const handleSettleOrder = async (paymentModeId: string, guestId?: string, driverId?: string) => {
    if (!billData?.tableId) return;

    try {
      // Call checkout API directly with the selected ID and guest ID
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantTableId: billData.tableId,
          paymentModeId: paymentModeId,
          guestId: guestId,
          driverId: driverId,
          totalAmount: billData.subtotal,
          items: billData.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price
          }))
        })
      });

      const result = await res.json();
      if (result.success) {
        // Switch to final invoice view instead of closing
        setIsFinalInvoice(true);
        fetchData();
      } else {
        alert(result.message || 'Settlement failed');
      }
    } catch (error) {
      console.error('Settlement error:', error);
      alert('An error occurred during settlement');
    }
  };

  const fetchFloors = async () => {
    // Redirecting to fetchData to keep state unified
    return fetchData();
  };

  // Make sidebar hidden when closed, and visible when opened
  useEffect(() => {
    if (!isOpen) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  }, [isOpen, setHidden]);

  // Close and hide sidebar when this page mounts
  useEffect(() => {
    setOpen(false);
    setHidden(true);
    return () => {
      setOpen(true);
      setHidden(false);
    };
  }, [setOpen, setHidden]);

  const fetchStaffMembers = async () => {
    try {
      const res = await fetch('/api/staff-members');
      const data = await res.json();
      if (data.success) setStaffMembers(data.data);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  };

  const fetchOutlets = async () => {
    try {
      const res = await fetch('/api/outlets');
      const data = await res.json();
      if (data.success) {
        setOutlets(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch outlets:', err);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('pos_active_floor_id');
    if (saved) {
      setActiveFloorId(saved);
    }
    fetchStaticData();
    fetchOutlets();
    fetchData();
    fetchPropertyData();
    fetchStaffMembers();
    fetchUnreadCount();
    // Auto-refresh floors and unread notifications data every 5 seconds
    const interval = setInterval(() => {
      fetchData();
      fetchUnreadCount();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleNewFloor = () => {
    setIsFloorFormOpen(true);
  };

  const handleCreateFloorSubmit = async (data: { name: string; order: number; menuType: 'RESTAURANT' | 'BAR' | 'CAFE'; outletId?: string | null }) => {
    setFloorFormLoading(true);
    try {
      if (editingFloor) {
        // Update Floor
        const res = await fetch(`/api/floors/${editingFloor.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            order: data.order,
            menuType: data.menuType,
            outletId: data.outletId,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setIsFloorEditModalOpen(false);
          setEditingFloor(null);
          await fetchData();
        } else {
          alert(result.message || 'Failed to update floor');
        }
      } else {
        // Create Floor
        const res = await fetch('/api/floors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            order: data.order,
            menuType: data.menuType,
            outletId: data.outletId,
          }),
        });
        const result = await res.json();
        if (result.success) {
          setIsFloorFormOpen(false);
          // Refresh data and select the new floor
          await fetchData();
          if (result.data?.id) {
            setActiveFloorId(result.data.id);
            localStorage.setItem('pos_active_floor_id', result.data.id);
          }
        } else {
          alert(result.message || 'Failed to create floor');
        }
      }
    } catch (err) {
      console.error('Failed to save floor:', err);
      alert('An error occurred');
    } finally {
      setFloorFormLoading(false);
    }
  };

  const handleDeleteFloor = async (floor: any) => {
    if (!confirm(`Are you sure you want to delete "${floor.name}"? This will delete ALL tables on this floor. This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/floors/${floor.id}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        await fetchData();
        // Switch to any available floor
        if (floors.length > 0) {
          const nextFloor = floors.find(f => f.id !== floor.id) || floors[0];
          if (nextFloor) {
            setActiveFloorId(nextFloor.id);
            localStorage.setItem('pos_active_floor_id', nextFloor.id);
          }
        } else {
          setActiveFloorId(null);
        }
      } else {
        alert(result.message || 'Failed to delete floor');
      }
    } catch (err) {
      console.error('Failed to delete floor:', err);
      alert('An error occurred');
    }
  };

  const handleNewTable = async () => {
    setEditingTable(null);
    setIsTableFormOpen(true);
  };

  const handleCreateTableSubmit = async (data: { name: string; capacity: number; floorId: string }) => {
    setTableFormLoading(true);
    try {
      if (editingTable) {
        // Update Table
        const res = await fetch(`/api/tables/${editingTable.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            capacity: data.capacity,
            floorId: data.floorId
          }),
        });
        const result = await res.json();
        if (result.success) {
          setIsTableFormOpen(false);
          setEditingTable(null);
          // If the floor was changed, we might want to switch to it
          if (data.floorId !== activeFloorId) {
            setActiveFloorId(data.floorId);
            localStorage.setItem('pos_active_floor_id', data.floorId);
          }
          fetchFloors();
        } else {
          alert(result.message || 'Failed to update table');
        }
      } else {
        // Create Table
        const targetFloor = floors.find(f => f.id === data.floorId);
        const res = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            floorId: data.floorId,
            propertyId: targetFloor?.propertyId || 'default-property-id',
            capacity: data.capacity
          }),
        });
        const result = await res.json();
        if (result.success) {
          setIsTableFormOpen(false);
          // Switch to the floor where the table was added
          if (data.floorId !== activeFloorId) {
            setActiveFloorId(data.floorId);
            localStorage.setItem('pos_active_floor_id', data.floorId);
          }
          fetchFloors();
        } else {
          alert(result.error || result.message || 'Failed to create table');
        }
      }
    } catch (err) {
      console.error('Failed to save table:', err);
      alert('An error occurred');
    } finally {
      setTableFormLoading(false);
    }
  };

  const handleTablePositionChange = async (id: string, x: number, y: number) => {
    // Optimistic UI update
    setFloors(prev => prev.map(f => ({
      ...f,
      tables: f.tables.map(t => t.id === id ? { ...t, x, y } : t)
    })));

    try {
      const res = await fetch(`/api/tables/${id}/position`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y })
      });
      if (!res.ok) {
        fetchFloors(); // revert on failure
      }
    } catch (error) {
      console.error('Failed to save table position', error);
      fetchFloors();
    }
  };

  const handleTableResize = async (id: string, width: number, height: number) => {
    // Optimistic UI update
    setFloors(prev => prev.map(f => ({
      ...f,
      tables: f.tables.map(t => t.id === id ? { ...t, width, height } : t)
    })));

    try {
      const res = await fetch(`/api/tables/${id}/resize`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width, height })
      });
      if (!res.ok) {
        fetchFloors(); // revert on failure
      }
    } catch (error) {
      console.error('Failed to save table size', error);
      fetchFloors();
    }
  };

  const handleTableClick = (table: Table) => {
    const isVacant = !table.activeOrder || table.status === 'VACANT';
    
    if (isVacant) {
      // Check if Restaurant Room Billing is enabled
      if (propertyData?.restaurantRoomChargingEnabled === true) {
        // Show room selection modal first
        setPendingTableForRoom(table);
        setRoomSearchQuery('');
        setIsRoomSelectModalOpen(true);
        // Fetch checked-in rooms
        setLoadingRoomsForModal(true);
        fetch('/api/hotel/bookings')
          .then(r => r.json())
          .then(d => {
            if (d.success && d.data) {
              const active = d.data.filter((b: any) => b.status === 'CHECKED_IN' && b.rooms?.[0]?.room);
              setOccupiedRoomsForModal(active);
            }
          })
          .catch(err => console.error(err))
          .finally(() => setLoadingRoomsForModal(false));
        return;
      }

      // Normal flow (no room billing)
      const tableFloor = floors.find(f => f.id === table.floorId);
      const floorMenuType = tableFloor?.menuType || 'RESTAURANT';

      let targetUrl = `${p}/billing?tableId=${table.id}&tableNo=${table.name}`;
      if (floorMenuType === 'BAR') {
        if (propertyData?.barPosEnabled === false) {
          alert('⚠️ Bar POS is currently disabled. Go to Settings > Bar POS to enable it.');
          return;
        }
        targetUrl = `${p}/bar-pos?tableId=${table.id}&tableNo=${table.name}`;
      } else if (floorMenuType === 'CAFE') {
        if (propertyData?.cafePosEnabled === false) {
          alert('⚠️ Cafe POS is currently disabled. Go to Settings > Cafe POS to enable it.');
          return;
        }
        targetUrl = `${p}/cafe-pos?tableId=${table.id}&tableNo=${table.name}`;
      }

      router.push(targetUrl);
    } else {
      // Occupied table: Single click selects (shows KOT/Bill menu)
      if (selectedTable?.id === table.id) {
        setSelectedTable(null);
      } else {
        setSelectedTable(table);
      }
    }
  };

  // Navigate to billing with an optional room selected
  const navigateToBillingWithRoom = (table: Table, bookingId?: string, roomNo?: string) => {
    const tableFloor = floors.find(f => f.id === table.floorId);
    const floorMenuType = tableFloor?.menuType || 'RESTAURANT';
    const roomParam = bookingId ? `&bookingId=${bookingId}&roomNo=${encodeURIComponent(roomNo || '')}` : '';

    let targetUrl = `${p}/billing?tableId=${table.id}&tableNo=${table.name}${roomParam}`;
    if (floorMenuType === 'BAR') {
      if (propertyData?.barPosEnabled === false) {
        alert('⚠️ Bar POS is currently disabled. Go to Settings > Bar POS to enable it.');
        return;
      }
      targetUrl = `${p}/bar-pos?tableId=${table.id}&tableNo=${table.name}${roomParam}`;
    } else if (floorMenuType === 'CAFE') {
      if (propertyData?.cafePosEnabled === false) {
        alert('⚠️ Cafe POS is currently disabled. Go to Settings > Cafe POS to enable it.');
        return;
      }
      targetUrl = `${p}/cafe-pos?tableId=${table.id}&tableNo=${table.name}${roomParam}`;
    }
    router.push(targetUrl);
  };

  const handleTableDoubleClick = (table: Table) => {
    // Always navigate to appropriate POS on double click
    const tableFloor = floors.find(f => f.id === table.floorId);
    const floorMenuType = tableFloor?.menuType || 'RESTAURANT';

    let targetUrl = `${p}/billing?tableId=${table.id}&tableNo=${table.name}`;
    if (floorMenuType === 'BAR') {
      if (propertyData?.barPosEnabled === false) {
        alert('⚠️ Bar POS is currently disabled. Go to Settings > Bar POS to enable it.');
        return;
      }
      targetUrl = `${p}/bar-pos?tableId=${table.id}&tableNo=${table.name}`;
    } else if (floorMenuType === 'CAFE') {
      if (propertyData?.cafePosEnabled === false) {
        alert('⚠️ Cafe POS is currently disabled. Go to Settings > Cafe POS to enable it.');
        return;
      }
      targetUrl = `${p}/cafe-pos?tableId=${table.id}&tableNo=${table.name}`;
    }

    router.push(targetUrl);
  };

  const handleResetTable = async (table: Table) => {
    if (!confirm(`Are you sure you want to reset ${table.name} to VACANT? Use this only if the table is physically free but stuck in the system.`)) return;

    try {
      const res = await fetch(`/api/tables/${table.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VACANT' })
      });
      const result = await res.json();
      if (result.success) {
        fetchData();
      } else {
        alert(result.message || 'Failed to reset table');
      }
    } catch (err) {
      console.error('Failed to reset table:', err);
      alert('An error occurred');
    }
  };

  const handleDeleteTable = async (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        fetchFloors();
      } else {
        alert(result.message || 'Failed to delete table');
      }
    } catch (err) {
      console.error('Failed to delete table:', err);
      alert('An error occurred');
    }
  };

  const handleTableSwitch = (table: Table) => {
    setSourceTableForSwitch(table);
    setIsSwitchModalOpen(true);
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
          targetTableId
        })
      });
      const result = await res.json();
      if (result.success) {
        setIsSwitchModalOpen(false);
        setSourceTableForSwitch(null);
        fetchData();
      } else {
        alert(result.message || 'Failed to switch table');
      }
    } catch (error) {
      console.error('Switch error:', error);
      alert('An error occurred while switching the table');
    } finally {
      setSwitchLoading(false);
    }
  };

  const activeFloor = floors.find(f => f.id === activeFloorId);

  const stats = {
    total: floors.reduce((sum, f) => sum + f.tables.length, 0),
    occupied: floors.reduce((sum, f) => sum + f.tables.filter(t => t.status !== 'VACANT').length, 0),
    vacant: floors.reduce((sum, f) => sum + f.tables.filter(t => t.status === 'VACANT').length, 0),
    billed: floors.reduce((sum, f) => sum + f.tables.filter(t => t.status === 'BILL_PRINTED').length, 0),
  };

  return (
    <div className="flex flex-col min-h-full gap-4 p-3 rounded-3xl" style={{ 
      background: 'radial-gradient(circle at top right, #13141f, #050505 70%)',
      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)'
    }}>
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden transition-colors relative z-10">
        {/* Floor Tabs */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 overflow-x-auto no-scrollbar transition-colors">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`${p}/operations`)}
            className="rounded-xl h-8 w-8 p-0 flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors flex-shrink-0"
          >
            <ChevronLeft size={14} />
          </Button>

          {loading ? (
            <Skeleton className="h-8 w-24 rounded-lg" count={3} />
          ) : (
            floors.filter(floor => {
              if (floor.menuType === 'BAR' && propertyData?.barPosEnabled === false) return false;
              if (floor.menuType === 'CAFE' && propertyData?.cafePosEnabled === false) return false;
              return true;
            }).map(floor => (
              <div
                key={floor.id}
                className="group relative flex items-center transition-all"
              >
                <div
                  role="button"
                  onClick={() => {
                    setActiveFloorId(floor.id);
                    localStorage.setItem('pos_active_floor_id', floor.id);
                    setIsSettingsView(false);
                    setIsEditMode(false);
                  }}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap flex items-center gap-2 cursor-pointer ${activeFloorId === floor.id
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white/80'
                    }`}
                >
                  {floor.name}
                  {activeFloorId === floor.id && (
                    <div className="flex items-center gap-1 ml-1.5 pl-1.5 border-l border-white/20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFloor(floor);
                          setIsFloorEditModalOpen(true);
                        }}
                        className="p-0.5 hover:bg-white/20 rounded-md transition-colors"
                        title="Edit Floor"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFloor(floor);
                        }}
                        className="p-0.5 hover:bg-white/20 rounded-md transition-colors"
                        title="Delete Floor"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )).concat([
              <button
                key="parking-tab-link"
                onClick={() => router.push(`${p}/operations/parking`)}
                className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap flex items-center gap-2 bg-white/5 text-white/40 border-white/5 hover:border-amber-500/50 hover:text-amber-400"
              >
                <CarFront size={12} />
                Parking Area
              </button>,
              <button
                key="room-orders-tab-link"
                onClick={() => router.push(`${p}/operations/room-service`)}
                className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap flex items-center gap-2 bg-white/5 text-white/40 border-white/5 hover:border-indigo-500/50 hover:text-indigo-400"
              >
                <BedDouble size={12} />
                Room Orders
              </button>
            ])
          )}
        </div>

        {/* Selected Table Action Toolbar */}
        {selectedTable && (
          <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300 z-50">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">
                  {selectedTable.name}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-tight">Selected Table</p>
                  <p className="text-sm font-black uppercase tracking-tight leading-tight">{selectedTable.status.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="h-10 w-[1px] bg-white/20" />

              <div className="flex items-center gap-2">
                {selectedTable.activeOrder?.kotCount ? (
                  <button
                    onClick={() => { handlePrintKOT(selectedTable); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    <Utensils size={14} />
                    Print KOT
                  </button>
                ) : null}
                <button
                  onClick={() => { handlePrintBill(selectedTable); }}
                  className="flex items-center gap-2 px-4 py-2 bg-pos-primary hover:bg-red-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  <Receipt size={14} />
                  Print Bill
                </button>
                <button
                  onClick={() => { handleTableSwitch(selectedTable); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  <ArrowRightLeft size={14} />
                  Switch Table
                </button>
                <button
                  onClick={() => { setIsQRModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-pos-accent-soft text-pos-accent hover:bg-pos-accent hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-pos-accent/20"
                >
                  <QrCode size={14} />
                  QR Code
                </button>
                <button
                  onClick={() => { handleResetTable(selectedTable); }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  <Power size={14} />
                  Reset
                </button>
                <button
                  onClick={() => { 
                    const orderId = selectedTable.activeOrder?.id ? `&orderId=${selectedTable.activeOrder.id}` : '';
                    const tableFloor = floors.find(f => f.id === selectedTable.floorId);
                    const floorMenuType = tableFloor?.menuType || 'RESTAURANT';

                    let targetUrl = `${p}/billing?tableId=${selectedTable.id}&tableName=${selectedTable.name}${orderId}`;
                    if (floorMenuType === 'BAR') {
                      if (propertyData?.barPosEnabled === false) {
                        alert('⚠️ Bar POS is currently disabled. Go to Settings > Bar POS to enable it.');
                        return;
                      }
                      targetUrl = `${p}/bar-pos?tableId=${selectedTable.id}&tableNo=${selectedTable.name}${orderId}`;
                    } else if (floorMenuType === 'CAFE') {
                      if (propertyData?.cafePosEnabled === false) {
                        alert('⚠️ Cafe POS is currently disabled. Go to Settings > Cafe POS to enable it.');
                        return;
                      }
                      targetUrl = `${p}/cafe-pos?tableId=${selectedTable.id}&tableNo=${selectedTable.name}${orderId}`;
                    }

                    router.push(targetUrl); 
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  <Eye size={14} />
                  View Order
                </button>
                <button
                  onClick={() => { handleMarkWaste(selectedTable); }}
                  disabled={wasteLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/30"
                >
                  <Trash2 size={14} />
                  {wasteLoading ? 'Loading...' : 'Waste'}
                </button>
              </div>
            </div>

            <button
              onClick={() => setSelectedTable(null)}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {isSettingsView ? (
          <div className="flex-1 p-6 overflow-y-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
            {/* Header / Intro */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Layout Settings & Configurations</h2>
                <p className="text-xs text-white/50 mt-1">Manage dining areas, design table layouts, and configure system properties.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={handleNewFloor}
                  className="rounded-2xl h-10 px-4 font-black uppercase text-[10px] tracking-widest gap-1.5 flex items-center bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all shadow-lg"
                >
                  <Plus size={14} />
                  New Floor
                </Button>
                <Button
                  onClick={handleNewTable}
                  className="rounded-2xl h-10 px-4 font-black uppercase text-[10px] tracking-widest gap-1.5 flex items-center bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400/50 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                >
                  <Plus size={14} />
                  New Table
                </Button>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Designer Card */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group shadow-xl">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] group-hover:scale-110 transition-transform">
                    <Map size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Interactive Layout Designer</h3>
                    <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
                      Rearrange, reposition, and resize dining tables visually for the active floor using drag-and-drop.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5">
                  <Button
                    onClick={() => {
                      setIsSettingsView(false);
                      setIsEditMode(true);
                    }}
                    className="w-full rounded-2xl h-11 font-black uppercase text-[10px] tracking-widest bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400/50 shadow-lg hover:shadow-indigo-500/20 transition-all"
                  >
                    Start Designing
                  </Button>
                </div>
              </div>

              {/* QR Codes Card */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 transition-all duration-300 flex flex-col justify-between group shadow-xl">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform">
                    <QrCode size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">QR Code Gallery</h3>
                    <p className="text-xs text-white/40 mt-1.5 leading-relaxed">
                      Access QR code scanner assets and pre-generated scan-to-order QR codes for all dining tables across floors.
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/5">
                  <Button
                    onClick={() => router.push(`${p}/operations/tables/qr-gallery`)}
                    className="w-full rounded-2xl h-11 font-black uppercase text-[10px] tracking-widest bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all shadow-lg"
                  >
                    Open QR Gallery
                  </Button>
                </div>
              </div>
            </div>

            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Floors List Panel */}
              <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Active Floors</h3>
                    <p className="text-[10px] text-white/40 mt-0.5">Manage custom floors and order sequences.</p>
                  </div>
                  <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {floors.length} Floors
                  </span>
                </div>
                <div className="divide-y divide-white/5 max-h-[250px] overflow-y-auto no-scrollbar pr-1">
                  {floors.map((floor, index) => (
                    <div key={floor.id} className="flex items-center justify-between py-3 group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-white/60">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">{floor.name}</p>
                          <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5">Sequence Order: {floor.order}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingFloor(floor);
                            setIsFloorEditModalOpen(true);
                          }}
                          className="w-8 h-8 rounded-lg hover:bg-white/10 border border-transparent hover:border-white/15 flex items-center justify-center text-white/60 hover:text-white transition-all"
                          title="Edit Floor"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteFloor(floor)}
                          className="w-8 h-8 rounded-lg hover:bg-red-500/20 border border-transparent hover:border-red-500/30 flex items-center justify-center text-red-400/80 hover:text-red-400 transition-all"
                          title="Delete Floor"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats & Info Card */}
              <div className="bg-[#0b0c13] border border-white/10 rounded-3xl p-6 shadow-xl space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-4">Floor Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Floors</p>
                      <p className="text-xl font-black text-white mt-1">{floors.length}</p>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-center">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Tables</p>
                      <p className="text-xl font-black text-indigo-400 mt-1">{stats.total}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 space-y-2">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Pro Tip</p>
                  <p className="text-[11px] text-white/60 leading-relaxed">
                    Double-clicking any vacant table directly on the floor maps will route you straight to the POS terminal billing with the table pre-selected.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="px-6 py-2.5 bg-[#0a0c10] flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5">
              <div className="flex flex-wrap gap-2.5 items-center">
                {[
                  { label: 'Vacant', color: 'bg-emerald-400' },
                  { label: 'Occupied', color: 'bg-red-400' },
                  { label: 'KOT Running', color: 'bg-amber-400' },
                  { label: 'Ready', color: 'bg-teal-400' },
                  { label: 'Served', color: 'bg-slate-400' },
                  { label: 'Bill Printed', color: 'bg-blue-400' },
                  { label: 'Cleaning', color: 'bg-slate-600' },
                  { label: 'Hold', color: 'bg-purple-400' },
                ].map((item: any) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/40">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* Waiter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowWaiterDropdown(!showWaiterDropdown)}
                    className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 border shadow-sm ${
                      selectedWaiterFilter
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Filter by Waiter"
                  >
                    <UserIcon size={12} />
                    <span className="truncate max-w-[70px]">{selectedWaiterFilter ? (staffMembers.find(s => s.id === selectedWaiterFilter)?.name || 'Waiter') : 'Waiter'}</span>
                    <span className="text-[6px]">▼</span>
                  </button>
                  {showWaiterDropdown && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowWaiterDropdown(false)} />
                      <div className="absolute right-0 top-full mt-1.5 w-48 rounded-2xl p-2.5 border shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 z-40 bg-[#1a1a1a] border-white/10 text-slate-200 shadow-black/80">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-black/20 rounded-lg border border-white/5 mb-1.5">
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
                        <div className="max-h-36 overflow-y-auto no-scrollbar space-y-0.5">
                          <button
                            onClick={() => { setSelectedWaiterFilter(''); setShowWaiterDropdown(false); setWaiterSearchQuery(''); }}
                            className="w-full text-left px-2 py-1 rounded text-[9px] font-black uppercase text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                          >
                            ❌ All Waiters
                          </button>
                          {staffMembers
                            .filter(s => s.isActive && (!waiterSearchQuery || s.name.toLowerCase().includes(waiterSearchQuery.toLowerCase())))
                            .map(s => (
                              <button
                                key={s.id}
                                onClick={() => { setSelectedWaiterFilter(s.id); setShowWaiterDropdown(false); setWaiterSearchQuery(''); }}
                                className={`w-full text-left px-2 py-1 rounded text-[9px] font-black uppercase transition-colors truncate ${
                                  selectedWaiterFilter === s.id
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'hover:bg-white/5 text-slate-400 hover:text-white'
                                }`}
                              >
                                {s.name}
                              </button>
                            ))
                          }
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl shadow-md gap-3">
                  <div className="text-center">
                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Total: </span>
                    <span className="text-[11px] font-black text-white">{stats.total}</span>
                  </div>
                  <div className="h-3 w-[1px] bg-white/10" />
                  <div className="text-center">
                    <span className="text-[8px] font-black text-emerald-400/80 uppercase tracking-widest">Free: </span>
                    <span className="text-[11px] font-black text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]">{stats.vacant}</span>
                  </div>
                  <div className="h-3 w-[1px] bg-white/10" />
                  <div className="text-center">
                    <span className="text-[8px] font-black text-red-400/80 uppercase tracking-widest">Live: </span>
                    <span className="text-[11px] font-black text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.4)]">{stats.occupied}</span>
                  </div>
                  <div className="h-3 w-[1px] bg-white/10" />
                  <div className="text-center">
                    <span className="text-[8px] font-black text-blue-400/80 uppercase tracking-widest">Billed: </span>
                    <span className="text-[11px] font-black text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.4)]">{stats.billed}</span>
                  </div>
                </div>

                {isEditMode ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsEditMode(false)}
                    className="rounded-xl h-8 px-3.5 font-black uppercase text-[9px] tracking-widest flex items-center shadow-lg bg-pos-primary shadow-pos-primary/20 text-white animate-pulse"
                  >
                    Done Editing
                  </Button>
                ) : (
                  <Button
                    variant={isSettingsView ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setIsSettingsView(!isSettingsView)}
                    className={`rounded-xl h-8 px-3.5 font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5 shadow-lg transition-all ${
                      isSettingsView 
                        ? 'bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400/50 shadow-indigo-500/20' 
                        : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Settings size={12} />
                    {isSettingsView ? 'View Floors' : 'Layout Settings'}
                  </Button>
                )}
              </div>
            </div>

            {/* Grid / Layout View */}
            <div className="flex-1 p-0 relative">
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
                </div>
              ) : (
                <TableLayoutView
                  tables={activeFloor?.tables || []}
                  unreadNotifications={[]}
                  onTableClick={handleTableClick}
                  onTableDoubleClick={handleTableDoubleClick}
                  selectedTableId={selectedTable?.id}
                  isEditMode={isEditMode}
                  onTablePositionChange={handleTablePositionChange}
                  onTableResize={handleTableResize}
                  onPrintKOT={handlePrintKOT}
                  onPrintBill={handlePrintBill}
                  onEditTable={(table) => {
                    setEditingTable(table);
                    setIsTableFormOpen(true);
                  }}
                  onDeleteTable={handleDeleteTable}
                  onSwitchTable={handleTableSwitch}
                  onResetTable={handleResetTable}
                />
              )}
            </div>
          </>
        )}
      </div>




      <KotSlipModal kot={kotSlip} onClose={() => setKotSlip(null)} />

      {/* Room Selection Modal for Restaurant → Room Billing */}
      {isRoomSelectModalOpen && pendingTableForRoom && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
          <div className="w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ background: 'linear-gradient(135deg, #0f1117 0%, #1a1b2e 100%)' }}>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-lg">
                    🏨
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white tracking-tight">Select Guest Type</h2>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest font-bold">Table {pendingTableForRoom.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsRoomSelectModalOpen(false); setPendingTableForRoom(null); }}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Walk-in option */}
              <button
                onClick={() => {
                  setIsRoomSelectModalOpen(false);
                  setPendingTableForRoom(null);
                  navigateToBillingWithRoom(pendingTableForRoom);
                }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all text-left group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                  🚶
                </div>
                <div>
                  <p className="text-sm font-black text-white">Walk-in Guest</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">No room — will pay by cash, card, or UPI at checkout.</p>
                </div>
                <ChevronRight size={16} className="ml-auto text-white/20 group-hover:text-white/60 transition-colors flex-shrink-0" />
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">or charge to room</span>
                <div className="flex-1 h-px bg-white/5" />
              </div>

              {/* Room search */}
              <div className="relative">
                <Search size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by room no. or guest name…"
                  value={roomSearchQuery}
                  onChange={e => setRoomSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs font-semibold placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-all"
                />
              </div>

              {/* Rooms list */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                {loadingRoomsForModal ? (
                  <div className="py-6 text-center">
                    <div className="w-6 h-6 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-[10px] text-slate-600">Loading checked-in rooms...</p>
                  </div>
                ) : (() => {
                  const filtered = occupiedRoomsForModal.filter(b => {
                    const roomNo = b.rooms?.[0]?.room?.roomNumber || '';
                    const guestName = `${b.guest?.firstName || ''} ${b.guest?.lastName || ''}`.toLowerCase();
                    const q = roomSearchQuery.toLowerCase();
                    return !q || roomNo.toLowerCase().includes(q) || guestName.includes(q);
                  });
                  if (filtered.length === 0) return (
                    <div className="py-6 text-center">
                      <p className="text-2xl mb-2">🛏️</p>
                      <p className="text-[10px] text-slate-600">{occupiedRoomsForModal.length === 0 ? 'No guests currently checked in.' : 'No rooms match your search.'}</p>
                    </div>
                  );
                  return filtered.map((b: any) => {
                    const roomNo = b.rooms?.[0]?.room?.roomNumber || 'N/A';
                    const guestName = `${b.guest?.firstName || ''} ${b.guest?.lastName || ''}`.trim() || 'Unknown Guest';
                    const roomType = b.rooms?.[0]?.room?.roomType?.name || '';
                    return (
                      <button
                        key={b.id}
                        onClick={() => {
                          setIsRoomSelectModalOpen(false);
                          setPendingTableForRoom(null);
                          navigateToBillingWithRoom(pendingTableForRoom!, b.id, roomNo);
                        }}
                        className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/8 bg-white/[0.02] hover:bg-violet-500/10 hover:border-violet-500/30 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <span className="text-base font-black text-violet-300">{roomNo}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white truncate">{guestName}</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">{roomType && `${roomType} · `}Room {roomNo}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/15">Checked In</span>
                          <ChevronRight size={12} className="text-white/20 group-hover:text-violet-400 transition-colors" />
                        </div>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 pt-1">
              <p className="text-[9px] text-slate-700 text-center">
                Selecting a room will charge the entire table bill to the guest's room folio.
              </p>
            </div>
          </div>
        </div>
      )}

      <BillModal
        bill={billData}
        onClose={() => {
          setBillData(null);
          setIsFinalInvoice(false);
        }}
        onSettle={handleSettleOrder}
        paymentModes={paymentModes}
        customers={customers}
        onAddCustomer={async (data: { firstName: string; lastName: string; mobile: string }) => {
          const newGuest = await customersApi.create(data);
          if (newGuest) {
            fetchStaticData();
            fetchData();
            return newGuest;
          }
          throw new Error('Failed to add customer');
        }}
        isProforma={!isFinalInvoice}
      />

      <SwitchTableModal
        isOpen={isSwitchModalOpen}
        onClose={() => {
          setIsSwitchModalOpen(false);
          setSourceTableForSwitch(null);
        }}
        sourceTable={sourceTableForSwitch}
        vacantTables={floors.flatMap(f => f.tables).filter(t => t.status === 'VACANT')}
        onConfirm={handleConfirmSwitchTable}
        loading={switchLoading}
      />

      <Modal
        isOpen={isTableFormOpen}
        onClose={() => {
          setIsTableFormOpen(false);
          setEditingTable(null);
        }}
        title={editingTable ? "Edit Table" : "Add New Table"}
      >
        <TableForm
          initialData={editingTable ? {
            name: editingTable.name,
            capacity: editingTable.capacity,
            floorId: editingTable.floorId
          } : {
            floorId: activeFloorId || undefined
          }}
          floors={floors}
          onSubmit={handleCreateTableSubmit}
          onCancel={() => {
            setIsTableFormOpen(false);
            setEditingTable(null);
          }}
          loading={tableFormLoading}
        />
      </Modal>

      <Modal
        isOpen={isFloorFormOpen}
        onClose={() => setIsFloorFormOpen(false)}
        title="Add New Floor"
      >
        <FloorForm
          outlets={outlets}
          onSubmit={handleCreateFloorSubmit}
          onCancel={() => setIsFloorFormOpen(false)}
          loading={floorFormLoading}
          restaurantPosEnabled={propertyData?.restaurantPosEnabled !== false}
          barPosEnabled={propertyData?.barPosEnabled !== false}
          cafePosEnabled={propertyData?.cafePosEnabled !== false}
        />
      </Modal>

      <Modal
        isOpen={isFloorEditModalOpen}
        onClose={() => {
          setIsFloorEditModalOpen(false);
          setEditingFloor(null);
        }}
        title="Edit Floor"
      >
        <FloorForm
          initialData={editingFloor ? { name: editingFloor.name, order: editingFloor.order, menuType: editingFloor.menuType, outletId: editingFloor.outletId } : undefined}
          outlets={outlets}
          onSubmit={handleCreateFloorSubmit}
          onCancel={() => {
            setIsFloorEditModalOpen(false);
            setEditingFloor(null);
          }}
          loading={floorFormLoading}
          restaurantPosEnabled={propertyData?.restaurantPosEnabled !== false}
          barPosEnabled={propertyData?.barPosEnabled !== false}
          cafePosEnabled={propertyData?.cafePosEnabled !== false}
        />
      </Modal>

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        table={selectedTable}
        property={propertyData}
      />

      <MarkWasteModal 
        isOpen={isWasteModalOpen}
        onClose={() => {
          setIsWasteModalOpen(false);
          setWasteOrderData(null);
        }}
        order={wasteOrderData}
        table={selectedTable}
        onSuccess={() => {
          fetchData();
          setSelectedTable(null);
        }}
      />
    </div>
  );
}
