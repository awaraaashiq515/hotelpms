'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  BedDouble, RefreshCcw, Plus, Search, ChevronLeft,
  CheckCircle2, Clock, DollarSign, FileText, Check, AlertCircle, ShoppingBag, X
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast, Toaster } from 'sonner';

export default function RoomServiceOperationsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [markingOrderId, setMarkingOrderId] = useState<string | null>(null);

  // Create Order Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [cart, setCart] = useState<{ [id: string]: { id: string; name: string; unitPrice: number; qty: number } }>({});
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [specialNote, setSpecialNote] = useState('');
  const [postToFolio, setPostToFolio] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchRoomServiceOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/room-service');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch room service orders', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRoomServiceOrders();
  }, [fetchRoomServiceOrders]);

  const fetchRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await fetch('/api/hotel/rooms');
      const data = await res.json();
      if (data.success || Array.isArray(data)) {
        setRooms(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success || Array.isArray(data)) {
        setProducts(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  const openNewOrderModal = () => {
    setSelectedRoom(null);
    setCart({});
    setSpecialNote('');
    setIsModalOpen(true);
    fetchRooms();
    fetchProducts();
  };

  const handlePlaceOrder = async () => {
    if (!selectedRoom) {
      toast.error('Please select a room first');
      return;
    }
    const cartItems = Object.values(cart);
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setSubmitting(true);
    try {
      const subtotal = cartItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
      const taxAmount = Math.round(subtotal * 0.05);
      const totalAmount = subtotal + taxAmount;
      const folioId = selectedRoom.currentBooking?.folioId || selectedRoom.activeFolioId || null;

      const payload = {
        roomNumber: selectedRoom.roomNumber,
        orderType: 'ROOM_SERVICE',
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.unitPrice * item.qty,
        })),
        subtotal,
        taxAmount,
        totalAmount,
        postToFolio,
        folioId,
        specialNote,
      };

      const res = await fetch('/api/hotel/room-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.data?.message || 'Room order placed successfully! 🛎️');
        setIsModalOpen(false);
        fetchRoomServiceOrders();
      } else {
        toast.error(data.message || 'Failed to place room order');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error. Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const [orderFilter, setOrderFilter] = useState<'all' | 'preorder' | 'dine_in' | 'room_service'>('all');

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (o.orderNo || '').toLowerCase().includes(q) ||
      (o.roomNumber || '').toLowerCase().includes(q) ||
      (o.guestName || '').toLowerCase().includes(q)
    );

    const instructions = o.deliveryInstructions || o.notes || '';
    const isDineIn = instructions.includes('TYPE:DINE_IN') || o.orderType === 'DINE_IN';
    const isPreorder = instructions.includes('SERVE_TIME') || !!o.guestId;

    let matchesFilter = true;
    if (orderFilter === 'preorder') matchesFilter = isPreorder;
    else if (orderFilter === 'dine_in') matchesFilter = isDineIn;
    else if (orderFilter === 'room_service') matchesFilter = !isDineIn;

    return matchesSearch && matchesFilter;
  });

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category?.name).filter(Boolean)))];

  const pendingCount = orders.filter(o => !['COMPLETED', 'PAID', 'SERVED'].includes(o.status)).length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="flex flex-col min-h-full gap-4 p-4 rounded-3xl" style={{ 
      background: 'radial-gradient(circle at top right, #13141f, #050505 70%)',
      boxShadow: 'inset 0 0 100px rgba(0,0,0,0.8)'
    }}>
      <Toaster richColors position="top-center" theme="dark" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`${p}/operations/tables`)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-indigo-400" />
              <h1 className="text-lg font-black text-white uppercase tracking-wider">Room Service & Guest Pre-Orders</h1>
            </div>
            <p className="text-xs text-white/40 mt-0.5">Manage advance pre-orders, in-room dining & folio charges</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
            <input
              type="text"
              placeholder="Search Room / Order #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 outline-none focus:border-indigo-500/50 w-48"
            />
          </div>
          <button
            onClick={() => { setRefreshing(true); fetchRoomServiceOrders(); }}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCcw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openNewOrderModal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Plus size={16} />
            New Room Order
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/40 backdrop-blur-2xl p-4 rounded-2xl border border-indigo-500/20 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Today</p>
            <p className="text-2xl font-black text-white mt-1">{orders.length} <span className="text-xs font-normal text-white/40">Orders</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BedDouble size={20} />
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-2xl p-4 rounded-2xl border border-amber-500/20 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Pending Preparation</p>
            <p className="text-2xl font-black text-white mt-1">{pendingCount} <span className="text-xs font-normal text-white/40">Active</span></p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-2xl p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Revenue</p>
            <p className="text-2xl font-black text-white mt-1">₹{totalRevenue.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex-1 bg-black/40 backdrop-blur-2xl p-5 rounded-3xl border border-white/10 shadow-xl overflow-y-auto">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Orders', count: orders.length },
            { id: 'preorder', label: '📱 Advance Pre-Orders', count: orders.filter(o => (o.deliveryInstructions || o.notes || '').includes('SERVE_TIME') || !!o.guestId).length },
            { id: 'dine_in', label: '🍽️ Table Dine-In', count: orders.filter(o => (o.deliveryInstructions || o.notes || '').includes('TYPE:DINE_IN') || o.orderType === 'DINE_IN').length },
            { id: 'room_service', label: '🛎️ Room Service', count: orders.filter(o => !((o.deliveryInstructions || o.notes || '').includes('TYPE:DINE_IN') || o.orderType === 'DINE_IN')).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setOrderFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap ${
                orderFilter === tab.id
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {tab.label} <span className="opacity-70 text-[10px]">({tab.count})</span>
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs">Loading Room Service Orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40 text-center">
            <BedDouble className="w-12 h-12 stroke-[1.5] mb-3 opacity-50" />
            <h3 className="text-sm font-bold text-white mb-1">No Room Service Orders Found</h3>
            <p className="text-xs text-white/40 max-w-sm">Tap "New Room Order" to place a room service order for a hotel guest.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map(order => {
              const isPending = !['COMPLETED', 'PAID', 'SERVED'].includes(order.status);
              const instructions = order.deliveryInstructions || order.notes || '';
              const isDineIn = instructions.includes('TYPE:DINE_IN') || order.orderType === 'DINE_IN';
              const serveTimeMatch = instructions.match(/SERVE_TIME:([^|]+)/);
              const serveTime = serveTimeMatch ? serveTimeMatch[1] : null;
              const tableMatch = instructions.match(/TABLE:([^|]+)/);
              const tableName = tableMatch ? tableMatch[1] : (order.tableNo || '');
              const isGuestPreorder = instructions.includes('SERVE_TIME') || !!order.guestId;

              return (
                <div
                  key={order.id}
                  className={`bg-white/5 border rounded-2xl p-4 transition-all ${
                    isPending ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10'
                  }`}
                >
                  {/* Pre-order Location & Serve Time Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                    {isDineIn ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        🍽️ DINE-IN ({tableName || 'Table'})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        🛎️ ROOM SERVICE (Room {order.roomNumber || '—'})
                      </span>
                    )}

                    {serveTime && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        ⏰ {serveTime}
                      </span>
                    )}

                    {isGuestPreorder && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        📱 Guest Pre-Order
                      </span>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] font-mono text-white/50">{order.orderNo}</span>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        {isDineIn ? `🍽️ ${tableName || 'Restaurant Table'}` : `🏨 Room ${order.roomNumber || '—'}`}
                      </h3>
                      {order.guestName && (
                        <p className="text-xs text-indigo-300 font-semibold">{order.guestName}</p>
                      )}
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                      order.status === 'CONFIRMED'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : order.status === 'SERVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Items preview */}
                  <div className="bg-black/30 rounded-xl p-3 mb-3 space-y-1.5 border border-white/5">
                    {(order.items || []).slice(0, 4).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-xs text-white/80">
                        <span><strong className="text-white">{item.qty}x</strong> {item.name}</span>
                        <span className="text-indigo-400 font-bold">₹{(item.lineTotal || item.unitPrice * item.qty).toFixed(0)}</span>
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <p className="text-[10px] text-white/40 text-center pt-1">+{order.items.length - 4} more items</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                    <span className="font-black text-amber-400 text-sm">Total: ₹{(order.totalAmount || 0).toFixed(0)}</span>
                    <span className="text-[10px] font-bold text-white/50">
                      {order.postedToFolio ? '📋 Folio Billed' : '💵 Direct Charge'}
                    </span>
                  </div>
                  {order.specialNote && (
                    <p className="mt-2 text-[10px] italic text-white/60 bg-white/5 rounded-lg p-2 border border-white/5">
                      📝 {order.specialNote}
                    </p>
                  )}

                  {/* Mark Served Button */}
                  <button
                    onClick={async () => {
                      setMarkingOrderId(order.id);
                      try {
                        await fetch(`/api/pos-orders/${order.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: 'SERVED' }),
                        });
                        fetchRoomServiceOrders();
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setMarkingOrderId(null);
                      }
                    }}
                    disabled={markingOrderId === order.id || order.status === 'SERVED'}
                    className={`w-full mt-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border ${
                      order.status === 'SERVED'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 cursor-default'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 cursor-pointer'
                    }`}
                  >
                    {markingOrderId === order.id ? '...' : (order.status === 'SERVED' ? '✓ Served' : 'Mark Served')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c0e17] border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                {selectedRoom && (
                  <button onClick={() => setSelectedRoom(null)} className="text-indigo-400 text-sm hover:underline">
                    ← Change Room
                  </button>
                )}
                <h2 className="text-sm font-black uppercase tracking-wider">
                  {!selectedRoom ? '🏨 Select Room for Order' : `🛎️ Room ${selectedRoom.roomNumber} — Menu`}
                </h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!selectedRoom ? (
                /* Step 1: Select Room */
                <div>
                  {roomsLoading ? (
                    <div className="py-12 text-center text-xs text-white/40">Loading rooms...</div>
                  ) : rooms.length === 0 ? (
                    <div className="py-12 text-center text-xs text-white/40">No rooms configured in Hotel system.</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {rooms.map(room => {
                        const isOccupied = room.status === 'OCCUPIED' || room.status === 'CHECKED_IN';
                        return (
                          <div
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                              isOccupied
                                ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400'
                                : 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-400'
                            }`}
                          >
                            <p className="text-lg font-black">{room.roomNumber}</p>
                            <p className="text-[10px] text-white/50">{room.roomType?.name || 'Room'}</p>
                            <p className={`text-[9px] font-black uppercase mt-1 ${isOccupied ? 'text-amber-400' : 'text-emerald-400'}`}>
                              {isOccupied ? '● Occupied' : '● Vacant'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* Step 2: Select Menu Items */
                <div className="space-y-4">
                  {/* Notes & Folio options */}
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-3">
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. Extra napkins, less spicy)"
                      value={specialNote}
                      onChange={(e) => setSpecialNote(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/40 outline-none"
                    />
                    <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={postToFolio}
                        onChange={(e) => setPostToFolio(e.target.checked)}
                        className="rounded accent-indigo-500"
                      />
                      Post charge to Room Folio (Bill to room)
                    </label>
                  </div>

                  {/* Menu search & filter */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <input
                      type="text"
                      placeholder="Search menu..."
                      value={menuSearch}
                      onChange={(e) => setMenuSearch(e.target.value)}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/40 outline-none w-40 flex-shrink-0"
                    />
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${
                          selectedCategory === cat
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white/5 text-white/60 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Products Grid */}
                  {productsLoading ? (
                    <div className="py-8 text-center text-xs text-white/40">Loading menu...</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
                      {products
                        .filter(p => {
                          const mSearch = p.name.toLowerCase().includes(menuSearch.toLowerCase());
                          const mCat = selectedCategory === 'all' || p.category?.name === selectedCategory;
                          return mSearch && mCat;
                        })
                        .map(product => {
                          const qty = cart[product.id]?.qty || 0;
                          return (
                            <div key={product.id} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold">{product.name}</p>
                                <p className="text-xs text-indigo-400 font-bold mt-0.5">₹{product.sellingPrice}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                {qty > 0 ? (
                                  <>
                                    <button
                                      onClick={() => setCart(prev => {
                                        const copy = { ...prev };
                                        if (copy[product.id].qty > 1) copy[product.id].qty -= 1;
                                        else delete copy[product.id];
                                        return copy;
                                      })}
                                      className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs"
                                    >-</button>
                                    <span className="text-xs font-bold w-4 text-center">{qty}</span>
                                    <button
                                      onClick={() => setCart(prev => ({
                                        ...prev,
                                        [product.id]: { id: product.id, name: product.name, unitPrice: product.sellingPrice, qty: (prev[product.id]?.qty || 0) + 1 }
                                      }))}
                                      className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs"
                                    >+</button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => setCart(prev => ({
                                      ...prev,
                                      [product.id]: { id: product.id, name: product.name, unitPrice: product.sellingPrice, qty: 1 }
                                    }))}
                                    className="px-3 py-1 bg-white/10 hover:bg-indigo-500 rounded-lg text-xs font-bold transition-colors"
                                  >
                                    Add
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {selectedRoom && Object.keys(cart).length > 0 && (
              <div className="p-4 border-t border-white/10 flex items-center justify-between bg-black/40 flex-shrink-0">
                <div>
                  <p className="text-xs text-white/50">Total Amount</p>
                  <p className="text-lg font-black text-indigo-400">
                    ₹{Object.values(cart).reduce((sum, item) => sum + item.unitPrice * item.qty, 0)}
                  </p>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? 'Placing Order...' : '🛎️ Submit Order'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
