'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  LayoutGrid, RefreshCcw, Plus,
  Search, Filter, ChevronRight,
  Map, Monitor, Utensils,
  Edit2, Trash2, X, Eye, ShoppingBag, Receipt, ArrowRightLeft, Power, QrCode, ChevronLeft,
  CarFront, Home
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ParkingLayoutView } from '@/components/tables/ParkingLayoutView';
import { QRModal } from '@/components/tables/QRModal';
import { KotSlipModal, KotSlipData } from '@/components/kots/KotSlipModal';
import { BillModal, BillData } from '@/components/billing/BillModal';
import { MarkWasteModal } from '@/components/modals/MarkWasteModal';
import { Modal } from '@/components/ui/Modal';
import { ParkingSlotForm } from '@/components/forms/parking-slot-form';
import { customersApi } from '@/lib/api/customers';

interface ParkingSlot {
  id: string;
  name: string;
  status: 'VACANT' | 'OCCUPIED' | 'KOT_RUNNING' | 'READY' | 'SERVED' | 'BILL_PRINTED';
  x: number;
  y: number;
  width: number;
  height: number;
  propertyId: string;
  activeOrder?: any;
}

export default function ParkingOperationsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [paymentModes, setPaymentModes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  
  // Selected state
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const selectedSlot = parkingSlots.find(s => s.id === selectedSlotId);

  // Modals Data
  const [kotSlip, setKotSlip] = useState<KotSlipData | null>(null);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [isFinalInvoice, setIsFinalInvoice] = useState(false);
  const [isParkingQROpen, setIsParkingQROpen] = useState(false);
  const [selectedParkingSlotForQR, setSelectedParkingSlotForQR] = useState<any | null>(null);

  // Waste Modal
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteOrderData, setWasteOrderData] = useState<any | null>(null);
  const [wasteLoading, setWasteLoading] = useState(false);

  // Form Modal
  const [isSlotFormOpen, setIsSlotFormOpen] = useState(false);
  const [slotFormLoading, setSlotFormLoading] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      const [slotsRes, pmRes, custRes, propRes] = await Promise.all([
        fetch('/api/parking-slots'),
        fetch('/api/payment-modes'),
        fetch('/api/customers'),
        fetch('/api/admin/properties')
      ]);

      const sData = await slotsRes.json();
      const pData = await pmRes.json();
      const cData = await custRes.json();
      const prData = await propRes.json();

      if (sData.success) setParkingSlots(sData.data);
      if (pData.success) setPaymentModes(pData.data);
      if (cData.success || Array.isArray(cData)) setCustomers(Array.isArray(cData) ? cData : cData.data || []);
      if (prData.success && prData.data.length > 0) {
        const slugifyInline = (str: string) => str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        const activeProp = prData.data.find((p: any) => 
          p.code === propertyCode || 
          slugifyInline(p.name) === propertyCode || 
          p.id === propertyCode
        );
        setPropertyData(activeProp || prData.data[0]);
      }
      
    } catch (error) {
      console.error('Failed to fetch parking data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!isEditMode && !billData && !kotSlip && !isWasteModalOpen) fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [isEditMode, billData, kotSlip, isWasteModalOpen]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

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

  const handlePrintKOT = async (slot: ParkingSlot) => {
    if (!slot.activeOrder?.id) return;
    const order = await fetchOrderPrintData(slot.activeOrder.id);
    if (!order || !order.kotTickets?.length) return;

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
    const serviceModeLabel = order.orderType === 'TAKEAWAY' ? 'PACKED' : 'IN-CAR';
    
    setKotSlip({
      kotNo: latestKot.kotNo,
      orderNo: order.orderNo,
      tableNo: `${slot.name} (${serviceModeLabel})`,
      orderType: order.orderType,
      createdAt: latestKot.createdAt,
      items: allItems
    });
  };

  const handlePrintBill = async (slot: ParkingSlot) => {
    if (!slot.activeOrder?.id) return;
    const order = await fetchOrderPrintData(slot.activeOrder.id);
    if (!order) return;

    setIsFinalInvoice(false);
    const serviceModeLabel = order.orderType === 'TAKEAWAY' ? 'PACKED' : 'IN-CAR';
    
    setBillData({
      orderNo: order.orderNo,
      tableNo: `${slot.name} (${serviceModeLabel})`,
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
      tableId: undefined, // Parking doesn't use tableId for settlement this way
      orderId: order.id,
      parkingSlotId: slot.id, // Add parkingSlotId to BillData
      driverId: order.driverId || undefined,
      staffMemberId: order.staffMemberId || undefined,
      guestCount: order.guestCount || 1
    } as any);

    try {
      await fetch(`/api/parking-slots/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'BILL_PRINTED' })
      });
      fetchData();
    } catch (error) {
      console.error('Failed to mark bill printed', error);
    }
  };

  const handleMarkWaste = async (slot: ParkingSlot) => {
    if (!slot.activeOrder?.id) return;
    setWasteLoading(true);
    try {
      const order = await fetchOrderPrintData(slot.activeOrder.id);
      if (!order) return;
      setWasteOrderData(order);
      setIsWasteModalOpen(true);
    } catch (error) {
      console.error('Waste modal error:', error);
    } finally {
      setWasteLoading(false);
    }
  };

  const handleSettleOrder = async (paymentModeId: string, guestId?: string, driverId?: string) => {
    if (!billData?.orderId) return;

    try {
      const res = await fetch('/api/orders/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: billData.orderId,
          paymentModeId: paymentModeId,
          guestId: guestId,
          driverId: driverId,
          totalAmount: billData.grandTotal,
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
        setIsFinalInvoice(true);
        fetchData();
      } else {
        alert(result.message || 'Settlement failed');
      }
    } catch (error) {
      console.error('Settlement error:', error);
    }
  };

  const handleCreateSlotSubmit = async (data: { name: string }) => {
    setSlotFormLoading(true);
    try {
      if (editingSlot) {
        // Update Slot
        const res = await fetch(`/api/parking-slots/${editingSlot.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name.trim() }),
        });
        const result = await res.json();
        if (result.success) {
          setIsSlotFormOpen(false);
          setEditingSlot(null);
          fetchData();
        } else {
          alert(result.message || 'Failed to update slot');
        }
      } else {
        // Create Slot
        const res = await fetch('/api/parking-slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name.trim() }),
        });
        const result = await res.json();
        if (result.success) {
          setIsSlotFormOpen(false);
          fetchData();
        } else {
          alert(result.error || result.message || 'Failed to create slot');
        }
      }
    } catch (err) {
      console.error('Failed to save slot:', err);
      alert('An error occurred');
    } finally {
      setSlotFormLoading(false);
    }
  };

  const handleSlotPositionChange = async (id: string, x: number, y: number) => {
    setParkingSlots(prev => prev.map(s => s.id === id ? { ...s, x, y } : s));
    try {
      await fetch(`/api/parking-slots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y })
      });
    } catch (error) {
      fetchData();
    }
  };

  const handleSlotResize = async (id: string, width: number, height: number) => {
    setParkingSlots(prev => prev.map(s => s.id === id ? { ...s, width, height } : s));
    try {
      await fetch(`/api/parking-slots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width, height })
      });
    } catch (error) {
      fetchData();
    }
  };

  const handleDeleteParkingSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this parking slot?')) return;
    try {
      const res = await fetch(`/api/parking-slots/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
        if (selectedSlotId === id) setSelectedSlotId(null);
      }
    } catch (err) {
      console.error('Failed to delete slot:', err);
    }
  };

  const handleResetParkingSlot = async (id: string) => {
    if (!confirm(`Are you sure you want to reset this slot to VACANT?`)) return;
    try {
      await fetch(`/api/parking-slots/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'VACANT' }) 
      });
      fetchData();
      setSelectedSlotId(null);
    } catch { /* silent */ }
  };

  const stats = {
    total: parkingSlots.length,
    occupied: parkingSlots.filter(s => s.status !== 'VACANT').length,
    vacant: parkingSlots.filter(s => s.status === 'VACANT').length,
    billed: parkingSlots.filter(s => s.status === 'BILL_PRINTED').length,
    liveRevenue: parkingSlots.reduce((sum, s) => sum + (s.activeOrder?.amount || 0), 0)
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
            onClick={() => router.push(`${p}/operations`)}
            className="rounded-2xl h-12 w-12 p-0 flex items-center justify-center bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <CarFront size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Parking Operations</h1>
            <p className="text-[10px] font-bold text-amber-300/70 uppercase tracking-[0.2em] mt-0.5">Real-time Vehicle Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/5 shadow-inner">
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-wider">Total</p>
              <p className="text-sm font-black text-white">{stats.total}</p>
            </div>
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-emerald-400/80 uppercase tracking-wider">Free</p>
              <p className="text-sm font-black text-emerald-400">{stats.vacant}</p>
            </div>
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-red-400/80 uppercase tracking-wider">Live</p>
              <p className="text-sm font-black text-red-400">{stats.occupied}</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-[9px] font-black text-amber-400/80 uppercase tracking-wider">Total Revenue</p>
              <p className="text-sm font-black text-amber-400">₹{Math.round(stats.liveRevenue)}</p>
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
            className="rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2 flex items-center shadow-[0_0_20px_rgba(99,102,241,0.4)] bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-400/50 transition-all"
            onClick={() => { setEditingSlot(null); setIsSlotFormOpen(true); }}
          >
            <Plus size={16} />
            New Parking Slot
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
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden transition-colors relative z-10">
        {/* Tabs Area */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => router.push(`${p}/operations/tables`)}
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap flex items-center gap-2 bg-white/5 text-white/40 border-white/5 hover:border-indigo-500/50 hover:text-indigo-400"
          >
            <Utensils size={14} />
            Ground Floor
          </button>
          <button
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap flex items-center gap-2 bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <CarFront size={14} />
            Parking Area
          </button>
        </div>

        {/* Selected Slot Action Toolbar (Table-style) */}
        {selectedSlot && !isEditMode && (
          <div className="px-6 py-4 bg-indigo-600 text-white flex items-center justify-between shadow-2xl animate-in slide-in-from-top duration-300 z-50">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center font-black">
                  {selectedSlot.name}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-tight">Selected Slot</p>
                  <p className="text-sm font-black uppercase tracking-tight leading-tight">{selectedSlot.status.replace('_', ' ')}</p>
                </div>
              </div>

              <div className="h-10 w-[1px] bg-white/20" />

              <div className="flex items-center gap-2">
                {selectedSlot.activeOrder?.kotCount ? (
                   <button
                    onClick={() => { handlePrintKOT(selectedSlot); }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    <Utensils size={14} />
                    Print KOT
                  </button>
                ) : null}
                {selectedSlot.status !== 'VACANT' && (
                  <button
                    onClick={() => { handlePrintBill(selectedSlot); }}
                    className="flex items-center gap-2 px-4 py-2 bg-pos-primary hover:bg-red-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                  >
                    <Receipt size={14} />
                    Print Bill
                  </button>
                )}
                <button
                  onClick={() => { setSelectedParkingSlotForQR(selectedSlot); setIsParkingQROpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-pos-accent-soft text-pos-accent hover:bg-pos-accent hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-pos-accent/20"
                >
                  <QrCode size={14} />
                  QR Code
                </button>
                <button
                  onClick={() => { handleResetParkingSlot(selectedSlot.id); }}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900/40 hover:bg-slate-900/60 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  <Power size={14} />
                  Reset
                </button>
                <button
                  onClick={() => { router.push(`${p}/billing?parkingSlotId=${selectedSlot.id}&slotName=${selectedSlot.name}`); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
                >
                  <Eye size={14} />
                  Open POS
                </button>
                {selectedSlot.status !== 'VACANT' && (
                  <button
                    onClick={() => { handleMarkWaste(selectedSlot); }}
                    disabled={wasteLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-100 hover:bg-red-500 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-red-500/30"
                  >
                    <Trash2 size={14} />
                    {wasteLoading ? 'Loading...' : 'Waste'}
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedSlotId(null)}
              className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Legend */}
        <div className="px-6 py-3 bg-[#0a0c10] flex flex-wrap gap-6 border-b border-white/5">
          {[
            { label: 'Vacant', color: 'bg-emerald-400 shadow-[0_0_8px_#34d399]' },
            { label: 'Occupied', color: 'bg-red-400 shadow-[0_0_8px_#f87171]' },
            { label: 'KOT Running', color: 'bg-amber-400 shadow-[0_0_8px_#fbbf24]' },
            { label: 'Ready to Serve', color: 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]' },
            { label: 'Served', color: 'bg-slate-400 shadow-[0_0_8px_#94a3b8]' },
            { label: 'Bill Printed', color: 'bg-blue-400 shadow-[0_0_8px_#60a5fa]' },
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
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
            </div>
          ) : (
            <ParkingLayoutView
              slots={parkingSlots}
              isEditMode={isEditMode}
              selectedSlotId={selectedSlotId}
              onSelectSlot={(slot) => setSelectedSlotId(slot?.id || null)}
              onSlotPositionChange={handleSlotPositionChange}
              onSlotResize={handleSlotResize}
              onNewSlot={() => { setEditingSlot(null); setIsSlotFormOpen(true); }}
              onEditSlot={(slot) => { setEditingSlot(slot); setIsSlotFormOpen(true); }}
              onDeleteSlot={handleDeleteParkingSlot}
              onResetSlot={handleResetParkingSlot}
              onShowQR={(slot) => { setSelectedParkingSlotForQR(slot); setIsParkingQROpen(true); }}
              onBillingNavigate={(id, name) => router.push(`${p}/billing?parkingSlotId=${id}&slotName=${name}`)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
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
      <QRModal
        isOpen={isParkingQROpen}
        onClose={() => setIsParkingQROpen(false)}
        type="PARKING"
        table={selectedParkingSlotForQR ? { ...selectedParkingSlotForQR, name: selectedParkingSlotForQR.name } : null}
        property={propertyData} 
      />
      <MarkWasteModal 
        isOpen={isWasteModalOpen}
        onClose={() => {
          setIsWasteModalOpen(false);
          setWasteOrderData(null);
        }}
        order={wasteOrderData}
        table={selectedSlot ? { ...selectedSlot, name: selectedSlot.name } as any : null}
        onSuccess={() => {
          fetchData();
          setSelectedSlotId(null);
        }}
      />
      <Modal
        isOpen={isSlotFormOpen}
        onClose={() => {
          setIsSlotFormOpen(false);
          setEditingSlot(null);
        }}
        title={editingSlot ? 'Edit Parking Slot' : 'New Parking Slot'}
      >
        <ParkingSlotForm
          initialData={editingSlot}
          onSubmit={handleCreateSlotSubmit}
          onCancel={() => {
            setIsSlotFormOpen(false);
            setEditingSlot(null);
          }}
          loading={slotFormLoading}
        />
      </Modal>
    </div>
  );
}
