'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutGrid, RefreshCcw, Plus, 
  Search, Filter, ChevronRight, 
  Map, Monitor, Utensils
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { paymentModesApi } from '@/lib/api/payment-modes';
import { customersApi } from '@/lib/api/customers';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { TableForm } from '@/components/forms/table-form';
import { TableLayoutView } from '@/components/tables/TableLayoutView';
import { Table } from '@/components/tables/TableCard';
import { KotSlipModal, KotSlipData } from '@/components/kots/KotSlipModal';
import { BillModal, BillData } from '@/components/billing/BillModal';
import { SwitchTableModal } from '@/components/tables/SwitchTableModal';

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

  const [isEditMode, setIsEditMode] = useState(false);
  const [isFinalInvoice, setIsFinalInvoice] = useState(false);

  // Modals Data
  const [kotSlip, setKotSlip] = useState<KotSlipData | null>(null);
  const [billData, setBillData] = useState<BillData | null>(null);

  // New Table Form Modal
  const [isTableFormOpen, setIsTableFormOpen] = useState(false);
  const [tableFormLoading, setTableFormLoading] = useState(false);
  const [editingTable, setEditingTable] = useState<any | null>(null);

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
        const floors = fData.data;
        setFloors(floors);
        
        // Smarter initialization: 
        // 1. If currently active floor exists in new data, keep it.
        // 2. If not, pick the first floor.
        const currentValid = floors.find((f: any) => f.id === activeFloorId);
        if (!currentValid && floors.length > 0) {
          const firstId = floors[0].id;
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

  const handleSettleOrder = async (paymentModeId: string, guestId?: string) => {
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
          totalAmount: billData.subtotal,
          items: billData.items.map(item => ({
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

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleNewTable = async () => {
    if (!activeFloorId) {
      alert('Please select a floor first.');
      return;
    }
    setEditingTable(null);
    setIsTableFormOpen(true);
  };

  const handleCreateTableSubmit = async (data: { name: string; capacity: number }) => {
    setTableFormLoading(true);
    try {
      if (editingTable) {
        // Update Table
        const res = await fetch(`/api/tables/${editingTable.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            capacity: data.capacity
          }),
        });
        const result = await res.json();
        if (result.success) {
          setIsTableFormOpen(false);
          setEditingTable(null);
          fetchFloors();
        } else {
          alert(result.message || 'Failed to update table');
        }
      } else {
        // Create Table
        const activeFlr = floors.find(f => f.id === activeFloorId);
        const res = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name.trim(),
            floorId: activeFloorId,
            propertyId: activeFlr?.propertyId || 'default-property-id',
            capacity: data.capacity
          }),
        });
        const result = await res.json();
        if (result.success) {
          setIsTableFormOpen(false);
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

  const handleTableClick = async (table: Table) => {
    if (table.status === 'VACANT') {
      try {
        const res = await fetch('/api/orders/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tableId: table.id }),
        });
        const data = await res.json();
        if (data.success) {
          router.push(`/billing?tableId=${table.id}&tableNo=${table.name}`);
        } else {
          alert(data.error || 'Failed to open order');
        }
      } catch (error) {
        console.error('Failed to open order:', error);
        alert('An error occurred while opening the order.');
      }
    } else if (table.activeOrder) {
      // Navigate to billing with table pre-selected
      router.push(`/billing?tableId=${table.id}&tableNo=${table.name}`);
    } else {
      // It's Vacant but somehow no active order
      router.push(`/billing?tableId=${table.id}&tableNo=${table.name}`);
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
    <div className="flex flex-col h-full gap-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pos-primary flex items-center justify-center text-white shadow-lg shadow-pos-primary/20">
            <Map size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Floor Operations</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Real-time Table Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
                <div className="px-4 py-2 text-center border-r border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Total</p>
                    <p className="text-sm font-black text-gray-900">{stats.total}</p>
                </div>
                <div className="px-4 py-2 text-center border-r border-gray-200">
                    <p className="text-[10px] font-black text-emerald-500 uppercase">Free</p>
                    <p className="text-sm font-black text-emerald-600">{stats.vacant}</p>
                </div>
                <div className="px-4 py-2 text-center border-r border-gray-200">
                    <p className="text-[10px] font-black text-red-500 uppercase">Live</p>
                    <p className="text-sm font-black text-red-600">{stats.occupied}</p>
                </div>
                <div className="px-4 py-2 text-center">
                    <p className="text-[10px] font-black text-pos-primary uppercase">Billed</p>
                    <p className="text-sm font-black text-pos-primary">{stats.billed}</p>
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
                className="rounded-2xl h-12 w-12 p-0 flex items-center justify-center"
            >
                <RefreshCcw size={18} className={refreshing ? 'animate-spin' : ''} />
            </Button>
            
            <Button 
                className="rounded-2xl h-12 px-6 font-black uppercase text-xs tracking-widest gap-2 flex items-center shadow-lg shadow-pos-primary/20 bg-pos-primary hover:bg-pos-primary-dark"
                onClick={handleNewTable}
            >
                <Plus size={16} />
                New Table
            </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Floor Tabs */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-50 overflow-x-auto no-scrollbar">
          {loading ? (
            <Skeleton className="h-10 w-32 rounded-xl" count={3} />
          ) : (
            floors.map(floor => (
              <button
                key={floor.id}
                onClick={() => {
                   setActiveFloorId(floor.id);
                   localStorage.setItem('pos_active_floor_id', floor.id);
                }}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap ${
                  activeFloorId === floor.id
                    ? 'bg-pos-primary text-white border-pos-primary shadow-lg shadow-pos-primary/20'
                    : 'bg-white text-gray-400 border-gray-50 hover:border-pos-primary/30 hover:text-gray-600'
                }`}
              >
                {floor.name}
              </button>
            ))
          )}
        </div>

        {/* Legend */}
        <div className="px-6 py-3 bg-gray-50/50 flex flex-wrap gap-6 border-b border-gray-50">
            {[
                { label: 'Vacant', color: 'bg-emerald-500' },
                { label: 'Occupied', color: 'bg-red-500' },
                { label: 'KOT Running', color: 'bg-orange-500' },
                { label: 'Bill Printed', color: 'bg-pos-primary' },
                { label: 'Cleaning', color: 'bg-gray-400' },
            ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color} ${item.label === 'Vacant' ? 'border' : ''}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</span>
                </div>
            ))}
        </div>

        {/* Grid / Layout View */}
        <div className="flex-1 overflow-y-auto p-0 no-scrollbar relative min-h-[600px]">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
                {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
            </div>
          ) : (
            <TableLayoutView 
              tables={activeFloor?.tables || []} 
              onTableClick={handleTableClick}
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
        title={`${editingTable ? "Edit Table" : "Add New Table"} ${!editingTable && activeFloor ? `(to ${activeFloor.name})` : ''}`}
      >
        <TableForm
          initialData={editingTable ? { name: editingTable.name, capacity: editingTable.capacity } : undefined}
          onSubmit={handleCreateTableSubmit}
          onCancel={() => {
            setIsTableFormOpen(false);
            setEditingTable(null);
          }}
          loading={tableFormLoading}
        />
      </Modal>
    </div>
  );
}
