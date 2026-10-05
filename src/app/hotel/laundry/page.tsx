'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shirt, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  Package, 
  RefreshCw, 
  Trash2, 
  X, 
  DollarSign, 
  UserCheck,
  Tag,
  Sparkles,
  Droplets,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  AlertTriangle,
  Boxes,
  ClipboardList,
  Edit2
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface LaundryItem {
  id: string;
  roomNumber: string;
  guestName: string;
  itemsCount: number;
  amount: number;
  status: 'COLLECTED' | 'IN_LAUNDRY' | 'READY' | 'DELIVERED';
  collectedBy?: string;
  collectedAt: string;
  deliveredAt?: string | null;
  notes?: string;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  serviceType: string;
  price: number;
  turnaround: string;
  description?: string;
  isActive?: boolean;
}

interface InventoryStockItem {
  id: string;
  name: string;
  category: 'DETERGENT' | 'LINEN';
  unit: string;
  currentStock: number;
  minThreshold: number;
  costPerUnit: number;
}

interface InventoryLog {
  id: string;
  itemName: string;
  category: string;
  type: 'INWARD' | 'CONSUMED';
  quantity: number;
  previousStock: number;
  newStock: number;
  notes?: string;
  loggedBy?: string;
  createdAt: string;
}

interface WashLog {
  id: string;
  date: string;
  itemName: string;
  washType: string;
  piecesWashed: number;
  cleanCount: number;
  soiledPending: number;
  detergentUsed: string;
  washStatus: string;
  notes?: string;
  loggedBy?: string;
}

const STATUS_STYLE: Record<string, string> = {
  COLLECTED:  'text-blue-300 bg-blue-500/10 border-blue-500/20',
  IN_LAUNDRY: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  READY:      'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  DELIVERED:  'text-slate-400 bg-slate-800 border-slate-700',
};

const NEXT_STATUS: Record<string, 'IN_LAUNDRY' | 'READY' | 'DELIVERED'> = {
  COLLECTED:  'IN_LAUNDRY',
  IN_LAUNDRY: 'READY',
  READY:      'DELIVERED',
};

const ACTION_LABEL: Record<string, string> = {
  COLLECTED:  'Send to Laundry',
  IN_LAUNDRY: 'Mark Ready',
  READY:      'Mark Delivered',
};

export default function LaundryPage() {
  const [activeTab, setActiveTab] = useState<'requests' | 'menu' | 'inventory' | 'washlogs'>('requests');

  // --- Requests State ---
  const [items, setItems] = useState<LaundryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Request Form state
  const [newRoom, setNewRoom] = useState('');
  const [newGuest, setNewGuest] = useState('');
  const [newCount, setNewCount] = useState(1);
  const [newAmount, setNewAmount] = useState(150);
  const [newNotes, setNewNotes] = useState('');

  // --- Menu / Rate Card State ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuFilter, setMenuFilter] = useState('ALL');
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuName, setNewMenuName] = useState('');
  const [newMenuCategory, setNewMenuCategory] = useState("Men's Clothing");
  const [newMenuServiceType, setNewMenuServiceType] = useState('Wash & Iron');
  const [newMenuPrice, setNewMenuPrice] = useState(60);
  const [newMenuTurnaround, setNewMenuTurnaround] = useState('Same Day');

  // --- Soap & Detergent Inventory State ---
  const [inventoryItems, setInventoryItems] = useState<InventoryStockItem[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [stockCategoryFilter, setStockCategoryFilter] = useState<'ALL' | 'DETERGENT' | 'LINEN'>('ALL');
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [selectedStockItemId, setSelectedStockItemId] = useState('');
  const [stockQtyInput, setStockQtyInput] = useState(1);
  const [stockNotesInput, setStockNotesInput] = useState('');
  const [stockSubmitting, setStockSubmitting] = useState(false);

  // --- Daily Wash Logs State ---
  const [washLogs, setWashLogs] = useState<WashLog[]>([]);
  const [washLogsLoading, setWashLogsLoading] = useState(false);
  const [washSummary, setWashSummary] = useState({ todayPiecesWashed: 0, todayCleanReady: 0, todaySoiledPending: 0, totalBatches: 0 });
  const [showWashModal, setShowWashModal] = useState(false);
  const [newWashItemName, setNewWashItemName] = useState('Double Bed Sheets');
  const [newWashType, setNewWashType] = useState('HOTEL_LINEN');
  const [newWashPieces, setNewWashPieces] = useState(30);
  const [newWashClean, setNewWashClean] = useState(28);
  const [newWashSoiled, setNewWashSoiled] = useState(2);
  const [newWashDetergent, setNewWashDetergent] = useState('1.2 kg Surf Excel + 300ml Softener');
  const [newWashStatus, setNewWashStatus] = useState('COMPLETED');
  const [newWashNotes, setNewWashNotes] = useState('');

  // 1. Fetch Laundry Pickup Requests
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/laundry');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const formatted: LaundryItem[] = json.data.map((i: any) => ({
          id: i.id,
          roomNumber: i.roomNumber || 'N/A',
          guestName: i.guestName || 'In-House Guest',
          itemsCount: i.itemsCount || 1,
          amount: i.amount || 0,
          status: i.status || 'COLLECTED',
          collectedBy: i.collectedBy || 'Staff',
          collectedAt: i.collectedAt || i.createdAt ? new Date(i.collectedAt || i.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '',
          deliveredAt: i.deliveredAt ? new Date(i.deliveredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null,
          notes: i.notes || '',
        }));
        setItems(formatted);
      }
    } catch {
      toast.error('Network error loading laundry records');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Fetch Laundry Menu
  const fetchMenu = useCallback(async () => {
    setMenuLoading(true);
    try {
      const res = await fetch('/api/hotel/laundry/menu');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setMenuItems(json.data);
      }
    } catch {
      toast.error('Error loading laundry menu');
    } finally {
      setMenuLoading(false);
    }
  }, []);

  // 3. Fetch Soap & Detergent Inventory
  const fetchInventory = useCallback(async () => {
    setInventoryLoading(true);
    try {
      const res = await fetch('/api/hotel/laundry/inventory');
      const json = await res.json();
      if (json.success && json.data) {
        setInventoryItems(json.data.items || []);
        setInventoryLogs(json.data.logs || []);
        if (json.data.items?.length > 0 && !selectedStockItemId) {
          setSelectedStockItemId(json.data.items[0].id);
        }
      }
    } catch {
      toast.error('Error loading laundry inventory');
    } finally {
      setInventoryLoading(false);
    }
  }, [selectedStockItemId]);

  // 4. Fetch Daily Wash Logs
  const fetchWashLogs = useCallback(async () => {
    setWashLogsLoading(true);
    try {
      const res = await fetch('/api/hotel/laundry/wash-logs');
      const json = await res.json();
      if (json.success && json.data) {
        setWashLogs(json.data.logs || []);
        if (json.data.summary) setWashSummary(json.data.summary);
      }
    } catch {
      toast.error('Error loading daily wash logs');
    } finally {
      setWashLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchMenu();
    fetchInventory();
    fetchWashLogs();
  }, [fetchItems, fetchMenu, fetchInventory, fetchWashLogs]);

  // Create Guest Laundry Request
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoom) {
      toast.error('Room number is required');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/hotel/laundry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomNumber: newRoom,
          guestName: newGuest || 'In-House Guest',
          itemsCount: newCount,
          amount: newAmount,
          notes: newNotes,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Laundry request for Room ${newRoom} created!`);
        setNewRoom('');
        setNewGuest('');
        setNewCount(1);
        setNewAmount(150);
        setNewNotes('');
        setShowForm(false);
        fetchItems();
      } else {
        toast.error(json.message || 'Failed to create request');
      }
    } catch {
      toast.error('Network error creating laundry request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;
    try {
      const res = await fetch('/api/hotel/laundry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Status updated to ${nextStatus.replace('_', ' ')}!`);
        fetchItems();
      } else {
        toast.error(json.message || 'Failed to update status');
      }
    } catch {
      toast.error('Error updating status');
    }
  };

  const handleDeleteRequest = async (id: string, room: string) => {
    if (!confirm(`Delete laundry request for Room ${room}?`)) return;
    try {
      const res = await fetch(`/api/hotel/laundry?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Request deleted');
        fetchItems();
      }
    } catch {
      toast.error('Error deleting request');
    }
  };

  // Add Item to Laundry Menu
  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName || !newMenuPrice) {
      toast.error('Item name and price are required');
      return;
    }
    try {
      const res = await fetch('/api/hotel/laundry/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMenuName,
          category: newMenuCategory,
          serviceType: newMenuServiceType,
          price: Number(newMenuPrice),
          turnaround: newMenuTurnaround,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`"${newMenuName}" added to laundry menu!`);
        setShowAddMenuModal(false);
        setNewMenuName('');
        setNewMenuPrice(60);
        fetchMenu();
      } else {
        toast.error(json.message || 'Failed to add menu item');
      }
    } catch {
      toast.error('Network error saving menu item');
    }
  };

  const handleDeleteMenuItem = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" from laundry rate list?`)) return;
    try {
      const res = await fetch(`/api/hotel/laundry/menu?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Removed "${name}" from rate card`);
        fetchMenu();
      }
    } catch {
      toast.error('Error deleting menu item');
    }
  };

  // Log Inward Stock (Received) or Consumed (Usage)
  const handleStockAction = async (action: 'INWARD' | 'CONSUME') => {
    if (!selectedStockItemId || !stockQtyInput || stockQtyInput <= 0) {
      toast.error('Please select an item and enter valid quantity');
      return;
    }
    setStockSubmitting(true);
    try {
      const res = await fetch('/api/hotel/laundry/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          itemId: selectedStockItemId,
          quantity: Number(stockQtyInput),
          notes: stockNotesInput || (action === 'INWARD' ? 'Stock received from supplier' : 'Daily laundry wash usage'),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(json.message || 'Stock updated successfully!');
        setShowInwardModal(false);
        setShowConsumeModal(false);
        setStockQtyInput(1);
        setStockNotesInput('');
        fetchInventory();
      } else {
        toast.error(json.message || 'Failed to update stock');
      }
    } catch {
      toast.error('Error updating inventory stock');
    } finally {
      setStockSubmitting(false);
    }
  };

  // Submit Daily Wash Log
  const handleLogWashCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWashItemName || !newWashPieces) {
      toast.error('Please specify item name and pieces washed');
      return;
    }
    try {
      const res = await fetch('/api/hotel/laundry/wash-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: newWashItemName,
          washType: newWashType,
          piecesWashed: Number(newWashPieces),
          cleanCount: Number(newWashClean),
          soiledPending: Number(newWashSoiled),
          detergentUsed: newWashDetergent,
          washStatus: newWashStatus,
          notes: newWashNotes,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success(`Logged ${newWashPieces} pieces of ${newWashItemName}!`);
        setShowWashModal(false);
        setNewWashNotes('');
        fetchWashLogs();
      } else {
        toast.error(json.message || 'Failed to log wash batch');
      }
    } catch {
      toast.error('Error logging daily wash cycle');
    }
  };

  const filteredItems = items.filter((i) => {
    const matchSearch =
      i.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.guestName.toLowerCase().includes(search.toLowerCase()) ||
      (i.notes || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = items.reduce((sum, i) => sum + i.amount, 0);
  const collectedCount = items.filter((i) => i.status === 'COLLECTED').length;
  const inLaundryCount = items.filter((i) => i.status === 'IN_LAUNDRY').length;
  const readyCount = items.filter((i) => i.status === 'READY').length;
  const deliveredCount = items.filter((i) => i.status === 'DELIVERED').length;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-emerald-400">
            <Shirt size={13} /> Operations · Laundry & Linen Suite
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            Laundry & Chemical Management
          </h1>
          <p className="text-xs text-slate-400">
            Guest laundry orders, live rate menu for guest app, chemical & detergent inventory, and daily hotel linen wash tracker.
          </p>
        </div>

        {/* Global Action & Refresh */}
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => {
              fetchItems();
              fetchMenu();
              fetchInventory();
              fetchWashLogs();
              toast.success('Laundry data refreshed');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all shadow-sm"
          >
            <RefreshCw size={13} className={loading || menuLoading || inventoryLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Modern 4-Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/80">
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardList size={14} /> Guest Orders ({items.length})
        </button>

        <button
          onClick={() => setActiveTab('menu')}
          className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'menu'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tag size={14} /> Laundry Menu & Rates ({menuItems.length})
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'inventory'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Droplets size={14} /> Soap & Detergent Stock
        </button>

        <button
          onClick={() => setActiveTab('washlogs')}
          className={`py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === 'washlogs'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={14} /> Daily Wash Tracker ({washSummary.todayPiecesWashed} pcs)
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: GUEST LAUNDRY ORDERS                                           */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Collected</span>
              <div className="text-2xl font-black text-blue-400 mt-1">{collectedCount}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">In Laundry</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{inLaundryCount}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Ready</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{readyCount}</div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Delivered</span>
              <div className="text-2xl font-black text-slate-400 mt-1">{deliveredCount}</div>
            </div>
            <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-4 col-span-2 sm:col-span-1 bg-emerald-500/5">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Total Revenue</span>
              <div className="text-2xl font-black text-emerald-300 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Search, Filter & Log Request Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by Room, Guest, or Notes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {['ALL', 'COLLECTED', 'IN_LAUNDRY', 'READY', 'DELIVERED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
                    statusFilter === st
                      ? 'bg-slate-200 text-slate-950 font-black'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}

              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95 ml-auto"
              >
                <Plus size={14} /> New Request
              </button>
            </div>
          </div>

          {/* New Request Modal / Box */}
          {showForm && (
            <form onSubmit={handleCreateRequest} className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Shirt size={14} /> Log Guest Laundry Pickup
                </span>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 204"
                    value={newRoom}
                    onChange={(e) => setNewRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Guest Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={newGuest}
                    onChange={(e) => setNewGuest(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Items Count</label>
                  <input
                    type="number"
                    min="1"
                    value={newCount}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setNewCount(count);
                      setNewAmount(count * 80); // default approx calculation
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Bill Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Special Notes / Garment List</label>
                <input
                  type="text"
                  placeholder="e.g. 2 White Shirts (Dry Clean), 1 Trousers (Iron only) - Deliver by 6 PM"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  {submitting ? 'Saving...' : 'Register Laundry Order'}
                </button>
              </div>
            </form>
          )}

          {/* Orders Table */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#0f172a]/40 overflow-hidden shadow-xl">
            <table className="w-full table-fixed border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 w-[12%]">Room</th>
                  <th className="px-4 py-3 w-[20%]">Guest Details</th>
                  <th className="px-4 py-3 w-[12%]">Items</th>
                  <th className="px-4 py-3 w-[14%]">Amount</th>
                  <th className="px-4 py-3 w-[16%]">Status</th>
                  <th className="px-4 py-3 w-[26%] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                      No laundry orders found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-black text-emerald-400 align-top">
                        Room {item.roomNumber}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-bold text-white">{item.guestName}</div>
                        {item.notes && <div className="text-[10px] text-slate-400 truncate mt-0.5" title={item.notes}>📝 {item.notes}</div>}
                        <div className="text-[9px] text-slate-500 mt-0.5">Logged: {item.collectedAt} by {item.collectedBy}</div>
                      </td>
                      <td className="px-4 py-3 align-top font-bold text-slate-300">
                        {item.itemsCount} pcs
                      </td>
                      <td className="px-4 py-3 align-top font-black text-emerald-400">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${STATUS_STYLE[item.status]}`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {NEXT_STATUS[item.status] && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, item.status)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] uppercase tracking-wider transition-all"
                            >
                              {ACTION_LABEL[item.status]}
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRequest(item.id, item.roomNumber)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete Request"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: LAUNDRY RATE CARD & MENU                                       */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'menu' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Tag size={16} className="text-emerald-400" /> Customer App Laundry Menu & Pricing
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                These rates are automatically displayed to hotel guests in their Room Portal app when ordering laundry.
              </p>
            </div>
            <button
              onClick={() => setShowAddMenuModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md shadow-emerald-600/20 active:scale-95"
            >
              <Plus size={14} /> Add Menu Item
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {['ALL', "Men's Clothing", "Women's Clothing", 'Linen & Bedding', 'Dry Cleaning', 'Express Service'].map((cat) => (
              <button
                key={cat}
                onClick={() => setMenuFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  menuFilter === cat
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {menuItems
              .filter((m) => menuFilter === 'ALL' || m.category === menuFilter)
              .map((item) => (
                <div key={item.id} className="p-4 rounded-2xl bg-[#0f172a]/60 border border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-lg">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                        {item.category}
                      </span>
                      <button
                        onClick={() => handleDeleteMenuItem(item.id, item.name)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                        title="Delete from Rate Card"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <h4 className="font-bold text-white text-sm mt-2">{item.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.serviceType}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 font-mono text-emerald-400 text-base font-black">
                      ₹{item.price}
                    </div>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <Clock size={11} className="text-slate-500" /> {item.turnaround}
                    </span>
                  </div>
                </div>
              ))}
          </div>

          {/* Add Menu Item Modal */}
          {showAddMenuModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <form onSubmit={handleAddMenuItem} className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Plus size={16} className="text-emerald-400" /> Add Laundry Service Item
                  </h3>
                  <button type="button" onClick={() => setShowAddMenuModal(false)} className="text-slate-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Item Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Silk Saree, Winter Jacket"
                      value={newMenuName}
                      onChange={(e) => setNewMenuName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Category</label>
                      <select
                        value={newMenuCategory}
                        onChange={(e) => setNewMenuCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Men's Clothing">Men&apos;s Clothing</option>
                        <option value="Women's Clothing">Women&apos;s Clothing</option>
                        <option value="Linen & Bedding">Linen & Bedding</option>
                        <option value="Dry Cleaning">Dry Cleaning</option>
                        <option value="Express Service">Express Service</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Wash Type</label>
                      <select
                        value={newMenuServiceType}
                        onChange={(e) => setNewMenuServiceType(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Wash & Iron">Wash & Iron</option>
                        <option value="Dry Clean & Press">Dry Clean & Press</option>
                        <option value="Iron Only">Steam Iron Only</option>
                        <option value="Wash & Fold">Wash & Fold</option>
                        <option value="Super Express 4-Hour">Super Express 4-Hour</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={newMenuPrice}
                        onChange={(e) => setNewMenuPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Turnaround Time</label>
                      <input
                        type="text"
                        value={newMenuTurnaround}
                        onChange={(e) => setNewMenuTurnaround(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddMenuModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    Save Menu Item
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: SOAP & DETERGENT INVENTORY (RECEIVED & CONSUMED)            */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Droplets size={16} className="text-emerald-400" /> Soap, Detergent & Chemical Stock
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time chemical stock balances, received inward shipments, and daily wash consumption tracking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowInwardModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md active:scale-95"
              >
                <ArrowDownRight size={14} /> + Receive Stock (Inward)
              </button>

              <button
                onClick={() => setShowConsumeModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs transition-all shadow-md active:scale-95"
              >
                <ArrowUpRight size={14} /> − Record Usage (Consumed)
              </button>
            </div>
          </div>

          {/* Current Stock Levels Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Boxes size={13} className="text-emerald-400" /> Current Laundry Chemical & Linen Balances
              </h4>
              <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[10px]">
                <button
                  onClick={() => setStockCategoryFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${stockCategoryFilter === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setStockCategoryFilter('DETERGENT')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${stockCategoryFilter === 'DETERGENT' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  Detergents & Soaps
                </button>
                <button
                  onClick={() => setStockCategoryFilter('LINEN')}
                  className={`px-2.5 py-1 rounded-lg font-bold ${stockCategoryFilter === 'LINEN' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  Hotel Linens
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {inventoryItems
                .filter((item) => stockCategoryFilter === 'ALL' || item.category === stockCategoryFilter)
                .map((item) => {
                  const isLow = item.currentStock <= item.minThreshold;
                  return (
                    <div key={item.id} className="p-4 rounded-2xl bg-[#0f172a]/60 border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-500 block">
                          {item.category === 'DETERGENT' ? '🧼 Chemical / Detergent' : '🛏️ Hotel Linen'}
                        </span>
                        <div className="font-bold text-white text-xs mt-1">{item.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">Threshold: {item.minThreshold} {item.unit}</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-black ${isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {item.currentStock} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                        </div>
                        {isLow && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            <AlertTriangle size={9} /> Reorder Low
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Historical Movement Logs (Received & Consumed) */}
          <div>
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-400" /> Recent Stock Inward & Consumption History
            </h4>

            <div className="rounded-2xl border border-slate-800/80 bg-[#0f172a]/40 overflow-hidden shadow-xl">
              <table className="w-full table-fixed border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 w-[15%]">Date & Time</th>
                    <th className="px-4 py-3 w-[22%]">Item Name</th>
                    <th className="px-4 py-3 w-[14%]">Type</th>
                    <th className="px-4 py-3 w-[14%]">Quantity</th>
                    <th className="px-4 py-3 w-[15%]">New Balance</th>
                    <th className="px-4 py-3 w-[20%]">Notes / Batch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {inventoryLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 italic">
                        No inward or consumption logs recorded yet.
                      </td>
                    </tr>
                  ) : (
                    inventoryLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-3 align-top font-mono text-[11px] text-slate-400">
                          {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} •{' '}
                          {new Date(log.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 align-top font-bold text-white">
                          {log.itemName}
                        </td>
                        <td className="px-4 py-3 align-top">
                          {log.type === 'INWARD' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <ArrowDownRight size={10} /> + RECEIVED (Inward)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <ArrowUpRight size={10} /> − CONSUMED (Usage)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top font-black">
                          {log.type === 'INWARD' ? `+${log.quantity}` : `-${log.quantity}`}
                        </td>
                        <td className="px-4 py-3 align-top font-bold text-emerald-400">
                          {log.newStock}
                        </td>
                        <td className="px-4 py-3 align-top text-[11px] text-slate-400 truncate" title={log.notes || ''}>
                          {log.notes || '—'} {log.loggedBy ? `(${log.loggedBy})` : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* INWARD (Received) Modal */}
          {showInwardModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-md bg-[#0f172a] border border-emerald-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <ArrowDownRight size={16} className="text-emerald-400" /> + Inward Stock (Receive Chemical / Detergent)
                  </h3>
                  <button onClick={() => setShowInwardModal(false)} className="text-slate-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Select Item *</label>
                    <select
                      value={selectedStockItemId}
                      onChange={(e) => setSelectedStockItemId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    >
                      {inventoryItems.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} (Current: {it.currentStock} {it.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Quantity Received *</label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={stockQtyInput}
                      onChange={(e) => setStockQtyInput(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Supplier / Bill Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Received from SuperWholesale, Bill #8821"
                      value={stockNotesInput}
                      onChange={(e) => setStockNotesInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button onClick={() => setShowInwardModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStockAction('INWARD')}
                    disabled={stockSubmitting}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                  >
                    {stockSubmitting ? 'Updating...' : 'Confirm Inward Stock'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONSUME (Usage) Modal */}
          {showConsumeModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <div className="w-full max-w-md bg-[#0f172a] border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <ArrowUpRight size={16} className="text-amber-400" /> − Record Usage (Soap / Detergent Consumed)
                  </h3>
                  <button onClick={() => setShowConsumeModal(false)} className="text-slate-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Select Item *</label>
                    <select
                      value={selectedStockItemId}
                      onChange={(e) => setSelectedStockItemId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    >
                      {inventoryItems.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} (Current: {it.currentStock} {it.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Quantity Consumed / Used *</label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      value={stockQtyInput}
                      onChange={(e) => setStockQtyInput(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Usage Purpose / Wash Batch</label>
                    <input
                      type="text"
                      placeholder="e.g. Used for 30 Double Bed Sheets wash cycle"
                      value={stockNotesInput}
                      onChange={(e) => setStockNotesInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button onClick={() => setShowConsumeModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                    Cancel
                  </button>
                  <button
                    onClick={() => handleStockAction('CONSUME')}
                    disabled={stockSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md"
                  >
                    {stockSubmitting ? 'Updating...' : 'Confirm Stock Usage'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: DAILY HOTEL LINEN & WASH TRACKER (DAILY KYA DHULA KYA NAHI)    */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'washlogs' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Daily Wash Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pieces Washed Today</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{washSummary.todayPiecesWashed} <span className="text-xs text-slate-400">pcs</span></div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Clean & Ready for Rooms</span>
              <div className="text-2xl font-black text-blue-400 mt-1">{washSummary.todayCleanReady} <span className="text-xs text-slate-400">pcs</span></div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Stained / Soiled Pending</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{washSummary.todaySoiledPending} <span className="text-xs text-slate-400">pcs</span></div>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Total Batches Run</span>
              <div className="text-2xl font-black text-white mt-1">{washSummary.totalBatches}</div>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" /> Daily Hotel Linen Washing Register
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily record of all linen items washed (Bed sheets, Towels, Pillow covers), clean status, and detergent used.
              </p>
            </div>

            <button
              onClick={() => setShowWashModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md active:scale-95"
            >
              <Plus size={14} /> + Log Wash Batch
            </button>
          </div>

          {/* Wash Batches Table */}
          <div className="rounded-2xl border border-slate-800/80 bg-[#0f172a]/40 overflow-hidden shadow-xl">
            <table className="w-full table-fixed border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/70 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 w-[12%]">Date</th>
                  <th className="px-4 py-3 w-[22%]">Item Washed</th>
                  <th className="px-4 py-3 w-[12%]">Total Pieces</th>
                  <th className="px-4 py-3 w-[14%]">Clean vs Soiled</th>
                  <th className="px-4 py-3 w-[22%]">Detergent & Chemicals Used</th>
                  <th className="px-4 py-3 w-[18%]">Status & Staff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {washLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 italic">
                      No daily wash logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  washLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-4 py-3 align-top font-mono text-[11px] text-slate-400">
                        {log.date}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="font-bold text-white">{log.itemName}</div>
                        {log.notes && <div className="text-[10px] text-slate-400 mt-0.5">{log.notes}</div>}
                      </td>
                      <td className="px-4 py-3 align-top font-black text-emerald-400">
                        {log.piecesWashed} pcs
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="text-emerald-400 font-bold">{log.cleanCount} Clean</span>
                        {log.soiledPending > 0 && (
                          <span className="text-amber-400 font-bold ml-1.5">• {log.soiledPending} Stained</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-[11px] text-slate-300">
                        {log.detergentUsed || 'Standard Detergent Cycle'}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {log.washStatus}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{log.loggedBy}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Wash Batch Modal */}
          {showWashModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
              <form onSubmit={handleLogWashCycle} className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Plus size={16} className="text-emerald-400" /> Log Daily Wash Cycle
                  </h3>
                  <button type="button" onClick={() => setShowWashModal(false)} className="text-slate-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Item Washed *</label>
                    <select
                      value={newWashItemName}
                      onChange={(e) => setNewWashItemName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Double Bed Sheets">Double Bed Sheets</option>
                      <option value="Single Bed Sheets">Single Bed Sheets</option>
                      <option value="Bath Towels (Large)">Bath Towels (Large)</option>
                      <option value="Hand & Face Towels">Hand & Face Towels</option>
                      <option value="Pillow Covers (Pairs)">Pillow Covers (Pairs)</option>
                      <option value="Duvet Covers">Duvet Covers</option>
                      <option value="Bath Mats">Bath Mats</option>
                      <option value="Staff Uniforms">Staff Uniforms</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Total Washed *</label>
                      <input
                        type="number"
                        min="1"
                        value={newWashPieces}
                        onChange={(e) => {
                          const p = Number(e.target.value);
                          setNewWashPieces(p);
                          setNewWashClean(p);
                          setNewWashSoiled(0);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Clean & Ready</label>
                      <input
                        type="number"
                        min="0"
                        value={newWashClean}
                        onChange={(e) => setNewWashClean(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Stained/Pending</label>
                      <input
                        type="number"
                        min="0"
                        value={newWashSoiled}
                        onChange={(e) => setNewWashSoiled(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-amber-400 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Detergent & Chemicals Used</label>
                    <input
                      type="text"
                      placeholder="e.g. 1.2 kg Surf Excel + 300ml Softener"
                      value={newWashDetergent}
                      onChange={(e) => setNewWashDetergent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Notes / Wash Quality</label>
                    <input
                      type="text"
                      placeholder="e.g. Sanitized at 60°C, dried and folded for 2nd floor"
                      value={newWashNotes}
                      onChange={(e) => setNewWashNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button type="button" onClick={() => setShowWashModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md">
                    Save Wash Record
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
