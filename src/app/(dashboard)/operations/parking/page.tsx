'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, Map, CarFront, Plus, RefreshCcw, 
  Edit2, Trash2, Power, QrCode 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { ParkingLayoutView } from '@/components/tables/ParkingLayoutView';
import { QRModal } from '@/components/tables/QRModal';

export default function ParkingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parkingSlots, setParkingSlots] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [propertyData, setPropertyData] = useState<any>(null);
  
  // Parking Form State
  const [isParkingFormOpen, setIsParkingFormOpen] = useState(false);
  const [parkingSlotName, setParkingSlotName] = useState('');
  const [editingParkingSlot, setEditingParkingSlot] = useState<any | null>(null);
  
  // QR Modal State
  const [isParkingQROpen, setIsParkingQROpen] = useState(false);
  const [selectedParkingSlot, setSelectedParkingSlot] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      const [slotsRes, floorsRes, propsRes] = await Promise.all([
        fetch('/api/parking-slots'),
        fetch('/api/floors'),
        fetch('/api/admin/properties')
      ]);
      const slotsJson = await slotsRes.json();
      const floorsJson = await floorsRes.json();
      const propsJson = await propsRes.json();
      
      if (slotsJson.success) setParkingSlots(slotsJson.data);
      if (floorsJson.success) setFloors(floorsJson.data);
      if (propsJson.success && propsJson.data.length > 0) setPropertyData(propsJson.data[0]);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSaveParkingSlot = async () => {
    if (!parkingSlotName.trim()) return;
    try {
      const url = editingParkingSlot ? `/api/parking-slots/${editingParkingSlot.id}` : '/api/parking-slots';
      const method = editingParkingSlot ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: parkingSlotName.trim() })
      });
      const result = await res.json();
      if (result.success) {
        setIsParkingFormOpen(false);
        setParkingSlotName('');
        setEditingParkingSlot(null);
        fetchData();
      }
    } catch { alert('An error occurred'); }
  };

  const handleDeleteParkingSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this slot?')) return;
    try {
      const res = await fetch(`/api/parking-slots/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) fetchData();
    } catch { alert('An error occurred'); }
  };

  const handleResetParkingSlot = async (id: string) => {
    try {
      await fetch(`/api/parking-slots/${id}`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ status: 'VACANT' }) 
      });
      fetchData();
    } catch { /* silent */ }
  };

  const stats = {
    total: parkingSlots.length,
    occupied: parkingSlots.filter(s => s.status !== 'VACANT').length,
    vacant: parkingSlots.filter(s => s.status === 'VACANT').length,
    billed: 0
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
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <CarFront size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Parking Operations</h1>
            <p className="text-[10px] font-bold text-amber-300/70 uppercase tracking-[0.2em] mt-0.5">Real-time Vehicle Management</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/5 shadow-inner transition-colors">
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-white/40 uppercase tracking-wider">Total</p>
              <p className="text-sm font-black text-white">{stats.total}</p>
            </div>
            <div className="px-4 py-2 text-center border-r border-white/10">
              <p className="text-[9px] font-black text-emerald-400/80 uppercase tracking-wider">Free</p>
              <p className="text-sm font-black text-emerald-400">{stats.vacant}</p>
            </div>
            <div className="px-4 py-2 text-center">
              <p className="text-[9px] font-black text-red-400/80 uppercase tracking-wider">Live</p>
              <p className="text-sm font-black text-red-400">{stats.occupied}</p>
            </div>
          </div>

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
        {/* Navigation Tabs (Floors + Parking) */}
        <div className="flex items-center gap-2 px-6 py-4 border-b border-white/10 overflow-x-auto no-scrollbar transition-colors">
          {floors.map(floor => (
            <button
              key={floor.id}
              onClick={() => router.push(`/operations/tables?floorId=${floor.id}`)}
              className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap bg-white/5 text-white/40 border-white/5 hover:border-white/20 hover:text-white/80"
            >
              {floor.name}
            </button>
          ))}
          <button
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all border whitespace-nowrap flex items-center gap-2 bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <CarFront size={14} />
            Parking Area
          </button>
        </div>

        {/* Parking Content */}
        <div className="flex-1 p-0 relative">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
            </div>
          ) : (
            <ParkingLayoutView
              slots={parkingSlots}
              onNewSlot={() => { setEditingParkingSlot(null); setParkingSlotName(''); setIsParkingFormOpen(true); }}
              onEditSlot={(slot) => { setEditingParkingSlot(slot); setParkingSlotName(slot.name); setIsParkingFormOpen(true); }}
              onDeleteSlot={handleDeleteParkingSlot}
              onResetSlot={handleResetParkingSlot}
              onShowQR={(slot) => { setSelectedParkingSlot(slot); setIsParkingQROpen(true); }}
              onBillingNavigate={(id, name) => router.push(`/billing?parkingSlotId=${id}&slotName=${name}`)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
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
              placeholder="e.g. P-01, Slot A"
              className="w-full h-12 px-4 rounded-2xl border border-slate-200 focus:border-amber-400 outline-none text-sm font-semibold transition-colors"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsParkingFormOpen(false)}>Cancel</Button>
            <Button variant="primary" className="bg-amber-500 hover:bg-amber-600" onClick={handleSaveParkingSlot}>Save Slot</Button>
          </div>
        </div>
      </Modal>

      {isParkingQROpen && selectedParkingSlot && propertyData && (
        <QRModal
          isOpen={isParkingQROpen}
          onClose={() => { setIsParkingQROpen(false); setSelectedParkingSlot(null); }}
          table={{
            id: selectedParkingSlot.id,
            name: selectedParkingSlot.name,
            qrToken: selectedParkingSlot.qrToken
          }}
          property={{
            name: propertyData.name,
            code: propertyData.code
          }}
        />
      )}
    </div>
  );
}
