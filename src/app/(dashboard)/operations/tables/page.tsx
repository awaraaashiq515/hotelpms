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
import { useSidebar } from '@/context/sidebar-context';

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
  const activeFloorIdRef = useRef(activeFloorId);

  // ─── Parking Slots ───────────────────────────────────────────────
  const [parkingSlots, setParkingSlots] = useState<any[]>([]);
  const [isParkingFormOpen, setIsParkingFormOpen] = useState(false);
  const [parkingFormLoading, setParkingFormLoading] = useState(false);
  const [parkingSlotName, setParkingSlotName] = useState('');
  const [editingParkingSlot, setEditingParkingSlot] = useState<any | null>(null);
  const [isParkingQROpen, setIsParkingQROpen] = useState(false);
  const [selectedParkingSlot, setSelectedParkingSlot] = useState<any | null>(null);

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

  const fetchParkingSlots = async () => {
    try {
      const res = await fetch('/api/parking-slots');
      const json = await res.json();
      if (json.success) setParkingSlots(json.data);
    } catch { /* silent */ }
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
    fetchParkingSlots();
  };

  // Handlers for parking slots
  const handleSaveParkingSlot = async () => {
    if (!parkingSlotName.trim()) return;
    setParkingFormLoading(true);
    try {
      if (editingParkingSlot) {
        const res = await fetch(`/api/parking-slots/${editingParkingSlot.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: parkingSlotName.trim() }),
        });
        const result = await res.json();
        if (result.success) { setIsParkingFormOpen(false); setEditingParkingSlot(null); fetchParkingSlots(); }
        else alert(result.message);
      } else {
        const res = await fetch('/api/parking-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: parkingSlotName.trim() }),
        });
        const result = await res.json();
        if (result.success) { setIsParkingFormOpen(false); fetchParkingSlots(); }
        else alert(result.message);
      }
    } catch { alert('An error occurred'); }
    finally { setParkingFormLoading(false); setParkingSlotName(''); }
  };

  const handleDeleteParkingSlot = async (id: string) => {
    if (!confirm('Delete this parking slot?')) return;
    try {
      const res = await fetch(`/api/parking-slots/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) fetchParkingSlots();
      else alert(result.message);
    } catch { alert('An error occurred'); }
  };

  const handleResetParkingSlot = async (id: string) => {
    try {
      await fetch(`/api/parking-slots/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'VACANT' }) });
      fetchParkingSlots();
    } catch { /* silent */ }
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
    <div className="flex flex-col h-full gap-6 p-4 rounded-3xl" style={{ 
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
            ))
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
                  onClick={() => { router.push(`/billing?tableId=${selectedTable.id}&tableNo=${selectedTable.name}`); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  <Eye size={14} />
                  View Order
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
        <div className="flex-1 overflow-y-auto p-0 no-scrollbar relative min-h-[600px]">
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

      {/* ─── Parking Section ──────────────────────────────────────── */}
      <div className="flex flex-col gap-4 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden p-6">
        {/* Parking Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CarFront size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Parking Area</h2>
              <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-[0.2em]">Slot Management &amp; QR Orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{parkingSlots.length} Slots</span>
            <Button
              className="rounded-2xl h-10 px-5 font-black uppercase text-[10px] tracking-widest gap-2 flex items-center bg-amber-500/90 hover:bg-amber-400 text-white border border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              onClick={() => { setEditingParkingSlot(null); setParkingSlotName(''); setIsParkingFormOpen(true); }}
            >
              <Plus size={14} /> New Slot
            </Button>
          </div>
        </div>

        {/* Parking Grid */}
        {parkingSlots.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400/50">
              <CarFront size={28} />
            </div>
            <p className="text-sm font-black text-white/30 uppercase tracking-widest">No Parking Slots Yet</p>
            <p className="text-xs text-white/20">Click "New Slot" to add your first parking space</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {parkingSlots.map((slot: any) => {
              const isOccupied = slot.status !== 'VACANT';
              const order = slot.activeOrder;
              return (
                <div key={slot.id} className={`relative flex flex-col gap-2 p-4 rounded-2xl border transition-all cursor-pointer group ${
                  isOccupied
                    ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                    : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-500/10'
                }`}>
                  {/* Status dot */}
                  <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'}`} />

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isOccupied ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)' }}>
                    <CarFront size={18} className={isOccupied ? 'text-red-400' : 'text-amber-400'} />
                  </div>

                  <p className="text-sm font-black text-white leading-tight">{slot.name}</p>

                  {order ? (
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-bold text-white/50 truncate">{order.customerName}</p>
                      {order.vehicleNumber && <p className="text-[10px] font-black text-amber-400 tracking-widest">{order.vehicleNumber}</p>}
                      <p className="text-[10px] font-bold text-red-300">₹{(order.amount || 0).toFixed(0)} · {order.elapsedTime}m</p>
                    </div>
                  ) : (
                    <p className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest">Vacant</p>
                  )}

                  {/* Action row */}
                  <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setSelectedParkingSlot({ ...slot, qrToken: slot.qrToken }); setIsParkingQROpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-black text-white/70 uppercase tracking-widest transition-colors">
                      <QrCode size={10} /> QR
                    </button>
                    <button onClick={() => { setEditingParkingSlot(slot); setParkingSlotName(slot.name); setIsParkingFormOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-black text-white/70 uppercase tracking-widest transition-colors">
                      <Edit2 size={10} /> Edit
                    </button>
                    {isOccupied && (
                      <button onClick={() => handleResetParkingSlot(slot.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-black text-white/70 uppercase tracking-widest transition-colors">
                        <Power size={10} />
                      </button>
                    )}
                    <button onClick={() => handleDeleteParkingSlot(slot.id)}
                      className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors">
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Parking Add/Edit Modal */}
      <Modal
        isOpen={isParkingFormOpen}
        onClose={() => { setIsParkingFormOpen(false); setEditingParkingSlot(null); setParkingSlotName(''); }}
        title={editingParkingSlot ? 'Edit Parking Slot' : 'Add Parking Slot'}
      >
        <div className="space-y-5 py-2">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Slot Name / Number</label>
            <input
              autoFocus
              value={parkingSlotName}
              onChange={e => setParkingSlotName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveParkingSlot()}
              placeholder="e.g. P-01, Slot A, Handicap Bay"
              className="w-full h-12 px-4 rounded-2xl border border-slate-200 focus:border-amber-400 outline-none text-sm font-semibold transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 rounded-2xl h-12 font-black uppercase text-xs tracking-widest" onClick={() => { setIsParkingFormOpen(false); setEditingParkingSlot(null); setParkingSlotName(''); }}>Cancel</Button>
            <Button loading={parkingFormLoading} className="flex-1 rounded-2xl h-12 bg-amber-500 hover:bg-amber-400 text-white font-black uppercase text-xs tracking-widest shadow-lg" onClick={handleSaveParkingSlot}>
              {editingParkingSlot ? 'Save Changes' : 'Add Slot'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Parking QR Modal */}
      {isParkingQROpen && selectedParkingSlot && propertyData && (
        <Modal isOpen={isParkingQROpen} onClose={() => setIsParkingQROpen(false)} title="Parking QR Code">
          <div className="flex flex-col items-center py-6 gap-6">
            {(() => {
              const { QRCodeSVG } = require('qrcode.react');
              const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
              const qrUrl = `${baseUrl}/menu/parking/${propertyData.code}/${selectedParkingSlot.qrToken || selectedParkingSlot.id}`;
              return (
                <>
                  <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100">
                    <QRCodeSVG id="parking-qr-svg" value={qrUrl} size={220} level="H" includeMargin={false} />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-black text-gray-900">{selectedParkingSlot.name}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Scan to order from parking</p>
                    <p className="text-xs text-amber-600 mt-2 font-mono break-all">{qrUrl}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 w-full">
                    <Button variant="secondary" className="rounded-2xl h-14 font-black uppercase text-xs tracking-widest gap-2"
                      onClick={() => { const a = document.createElement('a'); a.download = `QR_Parking_${selectedParkingSlot.name}.png`; a.href = '#'; a.click(); }}>
                      Download
                    </Button>
                    <Button className="rounded-2xl h-14 bg-amber-500 hover:bg-amber-400 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg"
                      onClick={() => {
                        const w = window.open('', '_blank');
                        if (w) { w.document.write(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h1>${propertyData.name}</h1><p>Scan to order from ${selectedParkingSlot.name}</p><img src="${qrUrl}" /><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script></body></html>`); w.document.close(); }
                      }}>
                      Print QR
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </Modal>
      )}

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
    </div>
  );
}
