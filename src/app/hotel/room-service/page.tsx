'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChefHat, RefreshCw, Clock, Bell, CheckCircle2, Loader2, AlertTriangle, BedDouble, Zap, UtensilsCrossed } from 'lucide-react';

// Hooks
import { useRoomLookup } from '@/components/hotel/room-service/useRoomLookup';
import { useCart } from '@/components/hotel/room-service/useCart';
import { useMenu } from '@/components/hotel/room-service/useMenu';

// Components
import { RoomSearchPanel } from '@/components/hotel/room-service/RoomSearchPanel';
import { MenuBrowser } from '@/components/hotel/room-service/MenuBrowser';
import { OrderCart } from '@/components/hotel/room-service/OrderCart';
import { PostToRoomConfirm } from '@/components/hotel/room-service/PostToRoomConfirm';

// Types
import { OrderType } from '@/components/hotel/room-service/types';

type View = 'live' | 'pos';

// ── Live Order Card ──────────────────────────────────────────────────────────
function LiveOrderCard({ order, onStatusChange }: { order: any; onStatusChange: (id: string, status: string) => void }) {
  const [updating, setUpdating] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const created = new Date(order.createdAt).getTime();
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - created) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [order.createdAt]);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const isScheduled = order.serveTiming && order.serveTiming !== 'ASAP';
  const isEscalating = !isScheduled && elapsed > 180; // 3 minutes

  const STATUS_COLORS: Record<string, { border: string; badge: string; bg: string; text: string; dot: string }> = {
    CONFIRMED:   { border: 'border-amber-500/40',   badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',      bg: 'bg-amber-500/5',    text: 'NEW',         dot: 'bg-amber-400 animate-pulse' },
    IN_PROGRESS: { border: 'border-sky-500/40',     badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',            bg: 'bg-sky-500/5',      text: 'IN PROGRESS', dot: 'bg-sky-400 animate-pulse' },
    DELIVERED:   { border: 'border-emerald-500/40', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'DELIVERED',   dot: 'bg-emerald-400' },
    COMPLETED:   { border: 'border-slate-600/40',   badge: 'bg-slate-700 text-slate-400 border-slate-600',             bg: 'bg-slate-800/30',   text: 'DONE',        dot: 'bg-slate-500' },
  };

  const s = STATUS_COLORS[order.status] || STATUS_COLORS['CONFIRMED'];

  const handleUpdate = async (newStatus: string) => {
    setUpdating(true);
    await onStatusChange(order.id, newStatus);
    setUpdating(false);
  };

  const roomDisplay = order.roomNumber || (order.tableNo ? order.tableNo.replace('Room ', '') : null) || '—';

  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} p-4 space-y-3 transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
            <BedDouble size={14} className="text-amber-400" />
          </div>
          <div>
            <div className="text-sm font-black text-white">Room {roomDisplay}</div>
            {order.guestName && <div className="text-[10px] text-slate-400">{order.guestName}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isEscalating && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold animate-pulse">
              <AlertTriangle size={10} /> ESCALATED
            </span>
          )}
          <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border text-[10px] font-bold ${s.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.text}
          </span>
        </div>
      </div>

      {/* Badges for Timing & Packaging */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {isScheduled ? (
          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black flex items-center gap-1">
            ⏰ {order.serveTiming}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-medium flex items-center gap-1">
            ⚡ ASAP Delivery
          </span>
        )}

        {order.packagingType === 'TRAVEL_PACK' ? (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-200 text-[10px] font-black flex items-center gap-1">
            🎒 Travel Pack (Takeaway Departure)
          </span>
        ) : order.packagingType === 'PACK_IN_ROOM' ? (
          <span className="px-2 py-0.5 rounded-md bg-teal-500/15 border border-teal-500/30 text-teal-300 text-[10px] font-medium flex items-center gap-1">
            📦 Pack & Leave in Room
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1">
            🍽️ Serve in Room
          </span>
        )}
      </div>

      {/* Items */}
      <div className="space-y-1">
        {(order.items || []).map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-slate-300">
              <span className="text-slate-500 mr-1">×{item.qty}</span>
              {item.name}
            </span>
            <span className="text-slate-400 font-mono">₹{((item.lineTotal || item.unitPrice * item.qty) || 0).toLocaleString('en-IN')}</span>
          </div>
        ))}
        {order.specialNote && (
          <div className="text-[10px] text-amber-400/80 italic mt-1">📝 {order.specialNote}</div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-700/40">
        <div className="flex items-center gap-1.5 text-[10px]">
          <Clock size={11} className={isEscalating ? 'text-rose-400' : 'text-slate-500'} />
          <span className={isEscalating ? 'text-rose-400 font-bold' : 'text-slate-500'}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-bold">₹{(order.totalAmount || 0).toLocaleString('en-IN')}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {order.status === 'CONFIRMED' && (
            <button
              onClick={() => handleUpdate('IN_PROGRESS')}
              disabled={updating}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold disabled:opacity-50 transition-all"
            >
              {updating ? <Loader2 size={10} className="animate-spin" /> : <ChefHat size={10} />}
              Preparing
            </button>
          )}
          {order.status === 'IN_PROGRESS' && (
            <button
              onClick={() => handleUpdate('DELIVERED')}
              disabled={updating}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold disabled:opacity-50 transition-all"
            >
              {updating ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
              Delivered
            </button>
          )}
          {order.status === 'DELIVERED' && (
            <button
              onClick={() => handleUpdate('COMPLETED')}
              disabled={updating}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-bold disabled:opacity-50 transition-all"
            >
              {updating ? <Loader2 size={10} className="animate-spin" /> : null}
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Live Orders Board ─────────────────────────────────────────────────────────
function LiveOrdersBoard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/hotel/room-service').then(r => r.json());
      if (res.success) setOrders(res.data || []);
      setLastRefresh(new Date());
    } catch {}
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    intervalRef.current = setInterval(() => fetchOrders(true), 8000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/hotel/room-service/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchOrders(true);
    } catch {}
  };

  const newOrders = orders.filter(o => o.status === 'CONFIRMED');
  const inProgress = orders.filter(o => o.status === 'IN_PROGRESS');
  const delivered = orders.filter(o => o.status === 'DELIVERED');

  const timeStr = lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="animate-spin text-amber-500 mx-auto" size={32} />
          <p className="text-xs text-slate-500 font-medium">Loading live orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      {/* Live Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            LIVE BOARD
          </span>
          <span className="text-xs text-slate-500">Updated: {timeStr}</span>
        </div>
        <button
          onClick={() => fetchOrders()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'New Orders', count: newOrders.length, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20', dot: 'bg-amber-400 animate-pulse' },
          { label: 'In Progress', count: inProgress.length, color: 'text-sky-400', bg: 'bg-sky-500/5 border-sky-500/20', dot: 'bg-sky-400 animate-pulse' },
          { label: 'Delivered', count: delivered.length, color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/20', dot: 'bg-emerald-400' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl border ${stat.bg} p-3 flex items-center gap-3`}>
            <span className={`w-2 h-2 rounded-full ${stat.dot}`} />
            <div>
              <div className={`text-xl font-black ${stat.color}`}>{stat.count}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <UtensilsCrossed size={28} className="text-slate-600" />
          </div>
          <p className="text-slate-400 font-bold">No active orders</p>
          <p className="text-slate-600 text-xs mt-1">Room service orders from the guest portal will appear here in real-time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column: New */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Bell size={13} className="text-amber-400" />
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">New Orders ({newOrders.length})</span>
            </div>
            {newOrders.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-600">No new orders</div>
            ) : (
              newOrders.map(o => <LiveOrderCard key={o.id} order={o} onStatusChange={handleStatusChange} />)
            )}
          </div>

          {/* Column: In Progress */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <ChefHat size={13} className="text-sky-400" />
              <span className="text-xs font-black text-sky-400 uppercase tracking-wider">In Progress ({inProgress.length})</span>
            </div>
            {inProgress.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-600">Nothing cooking</div>
            ) : (
              inProgress.map(o => <LiveOrderCard key={o.id} order={o} onStatusChange={handleStatusChange} />)
            )}
          </div>

          {/* Column: Delivered */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Delivered ({delivered.length})</span>
            </div>
            {delivered.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-600">None delivered yet</div>
            ) : (
              delivered.map(o => <LiveOrderCard key={o.id} order={o} onStatusChange={handleStatusChange} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RoomServicePage() {
  const [view, setView] = useState<View>('live');

  const roomLookup = useRoomLookup();
  const cart = useCart();
  const menu = useMenu();

  const [orderType, setOrderType] = useState<OrderType>('ROOM_SERVICE');
  const [postToRoom, setPostToRoom] = useState(true);
  const [specialNote, setSpecialNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleConfirmClick = useCallback(() => {
    if (cart.items.length === 0) return;
    setShowConfirm(true);
  }, [cart.items.length]);

  const handleSubmitOrder = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const shouldPost = postToRoom && !!roomLookup.roomInfo;

      const payload = {
        roomNumber: roomLookup.roomInfo?.roomNumber || '',
        orderType,
        items: cart.items.map(i => ({
          productId: i.menuItem.id,
          name: i.menuItem.name,
          qty: i.qty,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
          note: i.note,
        })),
        subtotal: cart.totals.subtotal,
        taxAmount: cart.totals.taxAmount,
        totalAmount: cart.totals.total,
        postToFolio: shouldPost,
        folioId: shouldPost ? roomLookup.roomInfo?.folioId : undefined,
        guestId: shouldPost ? roomLookup.roomInfo?.guestId : undefined,
        specialNote,
      };

      const res = await fetch('/api/hotel/room-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(r => r.json());

      if (res.success) {
        setSuccessMsg(res.data?.message || 'Order placed successfully!');
        cart.clearCart();
        roomLookup.clear();
        setSpecialNote('');
        setShowConfirm(false);
        setOrderType('ROOM_SERVICE');
        setPostToRoom(true);
        setTimeout(() => setSuccessMsg(''), 4000);
        setView('live');
      } else {
        alert(res.error || 'Failed to place order. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, roomLookup, orderType, postToRoom, specialNote]);

  return (
    <div className="flex flex-col h-full -m-6 md:-m-8">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-[#080e1d]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <ChefHat size={15} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white leading-tight flex items-center gap-2">
              Room Service HQ
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black uppercase tracking-wider">
                <span className="w-1 h-1 rounded-full bg-rose-400 animate-pulse" />
                LIVE
              </span>
            </p>
            <p className="text-[9px] text-slate-400 font-bold">Real-time guest orders • Auto-refreshes every 8s • 3-min escalation alert</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/8">
          {[
            { key: 'live', label: '📡 Live Board', icon: Zap },
            { key: 'pos', label: '➕ New Order', icon: ChefHat },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key as View)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                view === tab.key
                  ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={12} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Success Banner ── */}
      {successMsg && (
        <div className="px-5 py-3 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 shrink-0">
          <span className="text-base">✅</span>
          <p className="text-xs font-bold text-emerald-400">{successMsg}</p>
        </div>
      )}

      {/* ── Views ── */}
      {view === 'live' ? (
        <div className="flex-1 overflow-hidden">
          <LiveOrdersBoard />
        </div>
      ) : (
        /* POS View — 3 Column Layout */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] min-h-0 overflow-hidden">

          <div className="border-r border-slate-800/60 bg-[#080c1a] p-4 overflow-y-auto no-scrollbar">
            <RoomSearchPanel
              roomNumber={roomLookup.roomNumber}
              setRoomNumber={roomLookup.setRoomNumber}
              roomInfo={roomLookup.roomInfo}
              state={roomLookup.state}
              errorMsg={roomLookup.errorMsg}
              onLookup={roomLookup.lookup}
              onClear={roomLookup.clear}
              specialNote={specialNote}
              setSpecialNote={setSpecialNote}
            />
          </div>

          <div className="bg-[#07091a] p-4 overflow-hidden flex flex-col min-h-0">
            <MenuBrowser
              categories={menu.categories}
              products={menu.products}
              loading={menu.loading}
              error={menu.error}
              selectedCategory={menu.selectedCategory}
              setSelectedCategory={menu.setSelectedCategory}
              searchQuery={menu.searchQuery}
              setSearchQuery={menu.setSearchQuery}
              vegFilter={menu.vegFilter}
              setVegFilter={menu.setVegFilter}
              getQty={cart.getQty}
              onAdd={cart.addItem}
              onDecrement={cart.decrementItem}
              onReload={menu.reload}
            />
          </div>

          <div className="border-l border-slate-800/60 bg-[#060a18] p-4 overflow-hidden flex flex-col min-h-0">
            <OrderCart
              items={cart.items}
              totals={cart.totals}
              taxRate={cart.taxRate}
              orderType={orderType}
              setOrderType={setOrderType}
              postToRoom={postToRoom}
              setPostToRoom={setPostToRoom}
              roomInfo={roomLookup.roomInfo}
              onAdd={cart.addItem}
              onDecrement={cart.decrementItem}
              onRemove={cart.removeItem}
              onNoteChange={cart.updateNote}
              onClear={cart.clearCart}
              onConfirm={handleConfirmClick}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      <PostToRoomConfirm
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSubmitOrder}
        isSubmitting={isSubmitting}
        items={cart.items}
        totals={cart.totals}
        roomInfo={roomLookup.roomInfo}
        orderType={orderType}
        postToRoom={postToRoom}
        specialNote={specialNote}
      />
    </div>
  );
}
