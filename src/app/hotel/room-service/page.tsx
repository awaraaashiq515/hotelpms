'use client';

import React, { useState, useCallback } from 'react';
import { History, ChefHat } from 'lucide-react';

// Hooks
import { useRoomLookup } from '@/components/hotel/room-service/useRoomLookup';
import { useCart } from '@/components/hotel/room-service/useCart';
import { useMenu } from '@/components/hotel/room-service/useMenu';

// Components
import { RoomSearchPanel } from '@/components/hotel/room-service/RoomSearchPanel';
import { MenuBrowser } from '@/components/hotel/room-service/MenuBrowser';
import { OrderCart } from '@/components/hotel/room-service/OrderCart';
import { PostToRoomConfirm } from '@/components/hotel/room-service/PostToRoomConfirm';
import { OrderHistoryList } from '@/components/hotel/room-service/OrderHistoryList';

// Types
import { OrderType } from '@/components/hotel/room-service/types';

type View = 'pos' | 'history';

export default function RoomServicePage() {
  // ── View toggle (Default to Guest Pre-Orders & History) ────────────────────
  const [view, setView] = useState<View>('history');

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const roomLookup = useRoomLookup();
  const cart = useCart();
  const menu = useMenu();

  // ── Local state ────────────────────────────────────────────────────────────
  const [orderType, setOrderType] = useState<OrderType>('ROOM_SERVICE');
  const [postToRoom, setPostToRoom] = useState(true);
  const [specialNote, setSpecialNote] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // ── Handle confirm (open modal) ────────────────────────────────────────────
  const handleConfirmClick = useCallback(() => {
    if (cart.items.length === 0) return;
    setShowConfirm(true);
  }, [cart.items.length]);

  // ── Submit order ───────────────────────────────────────────────────────────
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
        // Auto-clear success after 4s
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(res.error || 'Failed to place order. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, roomLookup, orderType, postToRoom, specialNote]);

  // ── Reorder from history ───────────────────────────────────────────────────
  const handleReorder = useCallback((order: any) => {
    cart.clearCart();
    order.items.forEach((item: any) => {
      for (let i = 0; i < item.qty; i++) {
        cart.addItem({
          id: item.productId || item.id,
          name: item.name,
          sellingPrice: item.unitPrice,
          isVeg: true,
          isActive: true,
          availabilityStatus: true,
          categoryId: '',
        });
      }
    });
    setView('pos');
  }, [cart]);

  return (
    <div className="flex flex-col h-full -m-6 md:-m-8">

      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-[#080e1d]/80 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <ChefHat size={15} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white leading-tight">Guest Pre-Orders & Room Service</p>
            <p className="text-[9px] text-slate-400 font-bold">Track guest pre-orders, serving times & room folio charges</p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/8">
          {[
            { key: 'history', label: '📱 Guest Pre-Orders & Active List', icon: History },
            { key: 'pos', label: '➕ New Order POS', icon: ChefHat },
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
      {view === 'history' ? (
        /* History View */
        <div className="flex-1 overflow-y-auto p-5">
          <OrderHistoryList onReorder={handleReorder} />
        </div>
      ) : (
        /* POS View — 3 Column Layout */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] min-h-0 overflow-hidden">

          {/* ── Left: Room Search ── */}
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

          {/* ── Middle: Menu Browser ── */}
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

          {/* ── Right: Order Cart ── */}
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

      {/* ── Confirm Modal ── */}
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
