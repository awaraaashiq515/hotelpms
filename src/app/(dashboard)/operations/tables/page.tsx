'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutGrid, RefreshCcw, Plus,
  Search, Filter, ChevronRight,
  Map, Monitor, Utensils,
  Edit2, Trash2, X, Eye, ShoppingBag, Receipt, ArrowRightLeft, Power, QrCode, ChevronLeft,
  CarFront
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
import { useSearchParams } from 'next/navigation';
import { useSidebar } from '@/context/sidebar-context';
import { MarkWasteModal } from '@/components/modals/MarkWasteModal';

interface Floor {
  id: string;
  name: string;
  order: number;
  propertyId: string;
  tables: Table[];
}

interface PaymentMode {
  id: string;
  name: string;
  type: string;
}

export default function TableManagementPage() {
  const router = useRouter();
  const { setOpen } = useSidebar();

  const [floors, setFloors] = useState<Floor[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [activeFloorId, setActiveFloorId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('pos_active_floor_id');
    }
    return null;
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isFinalInvoice, setIsFinalInvoice] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [propertyData, setPropertyData] = useState<any>(null);
  const searchParams = useSearchParams();
  const floorIdFromUrl = searchParams.get('floorId');

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
  const playNotificationSound = () => {
    try {
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
    setKotSlip({
      kotNo: latestKot.kotNo,
      orderNo: order.orderNo,
      tableNo: table.name,
      roomId: order.roomId || undefined,
      orderType: order.orderType,
      createdAt: latestKot.createdAt,
      items: allItems
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
      orderId: order.id
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



  const fetchData = async () => {
    try {
      const [floorsRes, pmRes, custRes] = await Promise.all([
        fetch('/api/floors'),
        fetch('/api/payment-modes'),
        fetch('/api/customers')
      ]);

      const fData = await floorsRes.json();
      const pData = await pmRes.json();
      const cData = await custRes.json();

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
        
        prevFloorsRef.current = newFloors;
        setFloors(newFloors);

        const currentValid = newFloors.find((f: any) => f.id === activeFloorIdRef.current);
        if (!currentValid && newFloors.length > 0) {
          const firstId = newFloors[0].id;
          setActiveFloorId(firstId);
          localStorage.setItem('pos_active_floor_id', firstId);
        }
      }

      if (pData.success) {
        setPaymentModes(pData.data);
      }

      if (cData.success || Array.isArray(cData)) {
        setCustomers(Array.isArray(cData) ? cData : cData.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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
        setPropertyData(json.data[0]);
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

  // Close sidebar only once when this page mounts
  useEffect(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    fetchData();
    fetchPropertyData();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleNewFloor = () => {
    setIsFloorFormOpen(true);
  };

  const handleCreateFloorSubmit = async (data: { name: string; order: number }) => {
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
      // Empty table: Single click opens POS
      router.push(`/billing?tableId=${table.id}&tableNo=${table.name}`);
    } else {
      // Occupied table: Single click selects (shows KOT/Bill menu)
      if (selectedTable?.id === table.id) {
        setSelectedTable(null);
      } else {
        setSelectedTable(table);
      }
    }
  };

  const handleTableDoubleClick = (table: Table) => {
    // Always navigate to billing on double click
    router.push(`/billing?tableId=${table.id}&tableNo=${table.name}`);
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
    <div className="flex flex-col min-h-full gap-6 p-4 rounded-3xl" style={{ 
      background: 'radial-gradient(circle at top right, #13141f, #050505 70%)',
      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)'
    }}>
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-2xl transition-all">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/operations')}
            className="rounded-2xl h-12 w-12 p-0 flex items-center justify-center bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-colors">
            <Map size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight transition-colors drop-shadow-md">Floor Operations</h1>
            <p className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-[0.2em] mt-0.5 transition-colors">Real-time Table Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/5 shadow-inner transition-colors">
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-wider transition-colors">Total</p>
              <p className="text-sm font-black text-white transition-colors">{stats.total}</p>
            </div>
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-emerald-400/80 uppercase tracking-wider transition-colors">Free</p>
              <p className="text-sm font-black text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] transition-colors">{stats.vacant}</p>
            </div>
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-red-400/80 uppercase tracking-wider transition-colors">Live</p>
              <p className="text-sm font-black text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.4)] transition-colors">{stats.occupied}</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-[9px] font-black text-blue-400/80 uppercase tracking-wider transition-colors">Billed</p>
              <p className="text-sm font-black text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.4)] transition-colors">{stats.billed}</p>
            </div>
          </div>

          <Button
            variant={isEditMode ? "primary" : "secondary"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className={`rounded-2xl h-12 px-6 font-black uppercase text-xs tracking-widest flex items-center shadow-lg ${isEditMode ? 'bg-pos-primary shadow-pos-primary/20 text-white' : ''}`}
          >
            {isEditMode ? 'Done Editing' : 'Edit Layout'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            loading={refreshing}
            className="rounded-2xl h-12 w-12 p-0 flex items-center justify-center bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
          </Button>

          <Button
            variant="secondary"
            className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2 flex items-center bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-colors shadow-lg"
            onClick={handleNewFloor}
          >
            <Plus size={16} />
            New Floor
          </Button>

          <Button
            className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2 flex items-center shadow-[0_0_20px_rgba(99,102,241,0.4)] bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400/50 transition-all"
            onClick={handleNewTable}
          >
            <Plus size={16} />
            New Table
          </Button>

          <Button
            variant="secondary"
            className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2 flex items-center bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-colors shadow-lg"
            onClick={() => router.push('/operations/tables/qr-gallery')}
          >
            <QrCode size={16} />
            QR Gallery
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden transition-colors relative z-10">
        {/* Floor Tabs */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 overflow-x-auto no-scrollbar transition-colors">
          {loading ? (
            <Skeleton className="h-10 w-32 rounded-xl" count={3} />
          ) : (
            floors.map(floor => (
              <div
                key={floor.id}
                className="group relative flex items-center transition-all"
              >
                <button
                  onClick={() => {
                    setActiveFloorId(floor.id);
                    localStorage.setItem('pos_active_floor_id', floor.id);
                  }}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap flex items-center gap-2 ${activeFloorId === floor.id
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                      : 'bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white/80'
                    }`}
                >
                  {floor.name}
                  {activeFloorId === floor.id && (
                    <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-white/20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFloor(floor);
                          setIsFloorEditModalOpen(true);
                        }}
                        className="p-1 hover:bg-white/20 rounded-md transition-colors"
                        title="Edit Floor"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFloor(floor);
                        }}
                        className="p-1 hover:bg-white/20 rounded-md transition-colors"
                        title="Delete Floor"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </button>
              </div>
            )).concat([
              <button
                key="parking-tab-link"
                onClick={() => router.push('/operations/parking')}
                className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap flex items-center gap-2 bg-white/5 text-white/40 border-white/5 hover:border-amber-500/50 hover:text-amber-400"
              >
                <CarFront size={14} />
                Parking Area
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
                    router.push(`/billing?tableId=${selectedTable.id}&tableName=${selectedTable.name}${orderId}`); 
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

        {/* Legend */}
        <div className="px-6 py-3 bg-[#0a0c10] flex flex-wrap gap-6 border-b border-white/5">
          {[
            { label: 'Vacant', color: 'bg-emerald-400' },
            { label: 'Occupied', color: 'bg-red-400' },
            { label: 'KOT Running', color: 'bg-amber-400' },
            { label: 'Bill Printed', color: 'bg-blue-400' },
            { label: 'Cleaning', color: 'bg-slate-400' },
          ].map((item: any) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{item.label}</span>
            </div>
          ))}
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
      </div>




      <KotSlipModal kot={kotSlip} onClose={() => setKotSlip(null)} />
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
          onSubmit={handleCreateFloorSubmit}
          onCancel={() => setIsFloorFormOpen(false)}
          loading={floorFormLoading}
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
          initialData={editingFloor ? { name: editingFloor.name, order: editingFloor.order } : undefined}
          onSubmit={handleCreateFloorSubmit}
          onCancel={() => {
            setIsFloorEditModalOpen(false);
            setEditingFloor(null);
          }}
          loading={floorFormLoading}
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
