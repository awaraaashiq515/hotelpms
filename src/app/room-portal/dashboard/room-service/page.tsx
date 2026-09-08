'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShoppingCart, Plus, Minus, Send, Loader2, X, UtensilsCrossed,
  Clock, CheckCircle2, ChefHat, Bell, ChevronRight, RefreshCw, PhoneCall,
  Sparkles, Check, ArrowLeft, Receipt, MapPin
} from 'lucide-react';
import { toast, Toaster } from 'sonner';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';

interface MenuItem {
  id: string;
  name: string;
  sellingPrice: number;
  description?: string;
  image?: string;
  isVeg: boolean;
  category?: { name: string };
}

interface CartItem extends MenuItem {
  qty: number;
}

interface OrderItemPreview {
  id?: string;
  productId?: string;
  name?: string;
  qty?: number;
  quantity?: number;
  unitPrice?: number;
  sellingPrice?: number;
  totalAmount?: number;
  lineTotal?: number;
  product?: {
    name: string;
    isVeg?: boolean;
    image?: string;
  };
}

interface ActiveOrderData {
  id: string;
  orderNo: string;
  status: string;
  subtotal?: number;
  taxAmount?: number;
  grandTotal?: number;
  totalAmount?: number;
  preparationTime?: number;
  tableNo?: string;
  deliveryInstructions?: string;
  createdAt: string | Date;
  items?: OrderItemPreview[];
  notes?: string;
}

const STATUS_CONFIG: Record<string, { label: string; desc: string; emoji: string; color: string; bg: string; border: string; step: number }> = {
  PENDING: {
    label: 'Order Placed',
    desc: 'Sent to restaurant kitchen',
    emoji: '⏳',
    color: '#60a5fa',
    bg: 'rgba(59,130,246,0.15)',
    border: 'rgba(59,130,246,0.3)',
    step: 1,
  },
  CONFIRMED: {
    label: 'Order Confirmed',
    desc: 'Accepted by kitchen team',
    emoji: '📋',
    color: '#818cf8',
    bg: 'rgba(99,102,241,0.15)',
    border: 'rgba(99,102,241,0.3)',
    step: 1,
  },
  PREPARING: {
    label: 'Cooking in Kitchen',
    desc: 'Chef is preparing your fresh meal',
    emoji: '🍳',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.15)',
    border: 'rgba(251,146,60,0.35)',
    step: 2,
  },
  READY: {
    label: 'Marked Ready!',
    desc: 'Freshly prepared · Ready for dispatch to your room',
    emoji: '🛎️',
    color: '#2dd4bf',
    bg: 'rgba(45,212,191,0.2)',
    border: 'rgba(45,212,191,0.4)',
    step: 3,
  },
  OUT_FOR_DELIVERY: {
    label: 'On the Way',
    desc: 'Staff is bringing food to your room',
    emoji: '🚀',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.2)',
    border: 'rgba(167,139,250,0.4)',
    step: 3,
  },
  SERVED: {
    label: 'Delivered to Room',
    desc: 'Served to your room. Enjoy your meal!',
    emoji: '🎉',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.15)',
    border: 'rgba(74,222,128,0.3)',
    step: 4,
  },
  COMPLETED: {
    label: 'Delivered & Settled',
    desc: 'Order completed and charged to your room folio',
    emoji: '✅',
    color: '#4ade80',
    bg: 'rgba(74,222,128,0.15)',
    border: 'rgba(74,222,128,0.3)',
    step: 4,
  },
};

export default function RoomServicePage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState('');

  // Active Order Live Tracking State
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrderData | null>(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Check existing active order on mount
  useEffect(() => {
    const savedOrderId = localStorage.getItem('room_portal_active_order_id');
    if (savedOrderId) {
      setActiveOrderId(savedOrderId);
      setSubmitted(true);
    }
  }, []);

  // Fetch Menu
  useEffect(() => {
    const token = localStorage.getItem('room_portal_token') || '';
    const propCode = localStorage.getItem('room_portal_property') || '';
    const propId = localStorage.getItem('room_portal_property_id') || '';
    const query = new URLSearchParams();
    if (propCode) query.set('propertyCode', propCode);
    if (propId) query.set('propertyId', propId);

    fetch(`/api/room-portal/menu${query.toString() ? `?${query.toString()}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.items)) {
          setMenu(d.items);
        } else if (d.success && Array.isArray(d.data)) {
          setMenu(d.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Poll active order status
  const fetchOrderStatus = useCallback(async (orderId: string, showToast = false) => {
    try {
      if (showToast) setRefreshingStatus(true);
      const res = await fetch(`/api/pos-orders/${orderId}`, { cache: 'no-store' });
      if (res.ok) {
        const d = await res.json();
        if (d.success && d.data) {
          setActiveOrder(d.data);
          setLastRefreshedAt(new Date());
          if (showToast) toast.success(`Status updated: ${d.data.status}`);
        }
      }
    } catch {
    } finally {
      if (showToast) setRefreshingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (!activeOrderId) return;
    fetchOrderStatus(activeOrderId);
    const interval = setInterval(() => {
      fetchOrderStatus(activeOrderId);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeOrderId, fetchOrderStatus]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((c) => c.id === id ? { ...c, qty: c.qty + delta } : c)
        .filter((c) => c.qty > 0)
    );
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.sellingPrice * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const handleOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('room_portal_token') || '';
      const orderItemsSnapshot = cart.map((c) => ({
        id: c.id,
        productId: c.id,
        name: c.name,
        sellingPrice: c.sellingPrice,
        unitPrice: c.sellingPrice,
        qty: c.qty,
        quantity: c.qty,
        totalAmount: c.sellingPrice * c.qty,
        product: { name: c.name, isVeg: c.isVeg, image: c.image },
      }));

      const res = await fetch('/api/room-portal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: 'ROOM_SERVICE',
          category: 'FOOD_ORDER',
          items: orderItemsSnapshot,
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const orderId = data.orderId || data.data?.orderId || data.data?.order?.id || data.order?.id;
        const orderNo = data.orderNo || data.data?.orderNo || 'RS-NEW';

        const createdOrder: ActiveOrderData = data.order || data.data?.order || {
          id: orderId || `temp-${Date.now()}`,
          orderNo,
          status: 'CONFIRMED',
          subtotal: cartTotal,
          taxAmount: Math.round(cartTotal * 0.05),
          grandTotal: cartTotal + Math.round(cartTotal * 0.05),
          createdAt: new Date(),
          items: orderItemsSnapshot,
          notes,
        };

        if (orderId) {
          localStorage.setItem('room_portal_active_order_id', orderId);
          setActiveOrderId(orderId);
        }
        setActiveOrder(createdOrder);
        setSubmitted(true);
        setCart([]);
        setShowCart(false);
        setNotes('');
        toast.success(`Order #${orderNo} placed successfully!`);
      } else {
        toast.error(data.message || 'Order failed. Please try again.');
      }
    } catch {
      toast.error('Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group by category
  const grouped = menu.reduce((acc, item) => {
    const cat = item.category?.name || 'Menu';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Status config resolution
  const currentStatus = activeOrder?.status?.toUpperCase() || 'CONFIRMED';
  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.CONFIRMED;

  // Extract room number
  const roomMatch = activeOrder?.deliveryInstructions?.match(/ROOM:([^|]+)/);
  const displayRoom = roomMatch ? roomMatch[1] : (activeOrder?.tableNo?.replace(/^Room\s*/i, '') || 'Your Room');

  // Elapsed / time helpers
  const orderDate = activeOrder?.createdAt ? new Date(activeOrder.createdAt) : new Date();
  const timeFormatted = orderDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  // ══════════════════════════════════════════════════════════════════════════════
  // LIVE ORDER TRACKER VIEW
  // ══════════════════════════════════════════════════════════════════════════════
  if (submitted && activeOrder) {
    const steps = [
      { step: 1, label: 'Confirmed', icon: '📋' },
      { step: 2, label: 'Cooking', icon: '🍳' },
      { step: 3, label: 'Marked Ready', icon: '🛎️' },
      { step: 4, label: 'Delivered', icon: '🎉' },
    ];

    const grandTotal = activeOrder.grandTotal || activeOrder.totalAmount || 0;
    const subtotal = activeOrder.subtotal || Math.round(grandTotal / 1.05);
    const taxAmount = activeOrder.taxAmount || (grandTotal - subtotal);
    const itemsList = activeOrder.items || [];

    return (
      <>
        <Toaster richColors position="top-center" />
        <DashboardSubpage title="Room Service Tracker" emoji="🍽️" accentColor="rgba(251,146,60,0.4)">
          <div style={{ maxWidth: '820px', margin: '0 auto', padding: '10px 0 60px' }}>

            {/* Top Live Status Bar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '20px', padding: '12px 18px',
              background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(16px)',
              borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  display: 'inline-block', width: '9px', height: '9px', borderRadius: '50%',
                  background: '#22c55e', boxShadow: '0 0 12px #22c55e',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  Live Kitchen Connection · Updates in real-time
                </span>
              </div>
              <button
                onClick={() => activeOrderId && fetchOrderStatus(activeOrderId, true)}
                disabled={refreshingStatus}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '10px', padding: '6px 14px', color: '#e2e8f0',
                  fontSize: '12px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} className={refreshingStatus ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {/* Main Status Hero Card */}
            <div style={{
              background: `linear-gradient(135deg, ${statusInfo.bg}, rgba(15, 23, 42, 0.95))`,
              border: `1.5px solid ${statusInfo.border}`,
              borderRadius: '24px', padding: '32px 24px', textAlign: 'center',
              boxShadow: `0 16px 40px ${statusInfo.color}15`, marginBottom: '24px',
              position: 'relative', overflow: 'hidden'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '12px' }}>{statusInfo.emoji}</div>
              <div style={{
                display: 'inline-block', padding: '4px 14px', borderRadius: '20px',
                background: statusInfo.bg, border: `1px solid ${statusInfo.border}`,
                color: statusInfo.color, fontSize: '11px', fontWeight: 900,
                letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px'
              }}>
                {statusInfo.label}
              </div>
              <h2 style={{ color: '#ffffff', fontSize: '26px', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
                {statusInfo.label}
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '14px', margin: '0 0 28px 0', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                {statusInfo.desc}
              </p>

              {/* 4-Stage Stepper */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px',
                position: 'relative', maxWidth: '600px', margin: '0 auto', padding: '0 10px'
              }}>
                {steps.map((st) => {
                  const isDone = statusInfo.step > st.step;
                  const isCurrent = statusInfo.step === st.step;
                  const stepColor = isDone ? '#22c55e' : isCurrent ? statusInfo.color : 'rgba(255,255,255,0.2)';
                  const stepBg = isDone ? 'rgba(34, 197, 94, 0.2)' : isCurrent ? statusInfo.bg : 'rgba(255,255,255,0.04)';

                  return (
                    <div key={st.step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '14px',
                        background: stepBg, border: `2px solid ${stepColor}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', color: '#fff',
                        boxShadow: isCurrent ? `0 0 20px ${statusInfo.color}50` : 'none',
                        transition: 'all 0.3s'
                      }}>
                        {isDone ? <Check size={20} color="#22c55e" strokeWidth={3} /> : st.icon}
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: isCurrent ? 900 : 700,
                        color: isCurrent ? '#ffffff' : isDone ? '#86efac' : '#64748b',
                        textAlign: 'center', letterSpacing: '0.3px'
                      }}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Details Row (Order No, Room, Estimated Time) */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px',
              marginBottom: '24px'
            }}>
              {/* Order Number */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '18px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px'
              }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8'
                }}>
                  <Receipt size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Order Number</p>
                  <p style={{ margin: '2px 0 0', fontSize: '16px', color: '#fff', fontWeight: 900, fontFamily: 'monospace' }}>#{activeOrder.orderNo}</p>
                </div>
              </div>

              {/* Delivery Room */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '18px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px'
              }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'rgba(236, 72, 153, 0.15)', border: '1px solid rgba(236, 72, 153, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f472b6'
                }}>
                  <MapPin size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Delivering To</p>
                  <p style={{ margin: '2px 0 0', fontSize: '16px', color: '#fff', fontWeight: 900 }}>Room {displayRoom}</p>
                </div>
              </div>

              {/* Estimated Delivery Time */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '18px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px'
              }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px',
                  background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb923c'
                }}>
                  <Clock size={20} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Estimated Prep Time</p>
                  <p style={{ margin: '2px 0 0', fontSize: '16px', color: '#fff', fontWeight: 900 }}>
                    {statusInfo.step >= 4 ? 'Delivered 🎉' : statusInfo.step === 3 ? 'Ready now 🛎️' : '20 - 30 mins'}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items Breakdown Card (Kya Order Kiya) */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '24px', padding: '24px', marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>🍽️</span>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: 900 }}>Your Order Summary</h3>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>Placed at {timeFormatted}</p>
                  </div>
                </div>
                <span style={{
                  background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)',
                  color: '#fb923c', padding: '4px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 800
                }}>
                  {itemsList.length} {itemsList.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                {itemsList.map((item, idx) => {
                  const name = item.name || item.product?.name || 'Menu Item';
                  const qty = item.qty || item.quantity || 1;
                  const price = item.unitPrice || item.sellingPrice || 0;
                  const lineTotal = item.totalAmount || item.lineTotal || (price * qty);
                  const isVeg = item.product?.isVeg ?? true;

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 14px', borderRadius: '14px',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{
                          display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%',
                          background: isVeg ? '#22c55e' : '#ef4444',
                          border: `2px solid ${isVeg ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`
                        }} />
                        <div>
                          <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 700 }}>
                            {name}
                          </p>
                          <p style={{ margin: '2px 0 0', color: '#94a3b8', fontSize: '12px' }}>
                            Qty: <strong style={{ color: '#fff' }}>{qty}</strong> × ₹{price}
                          </p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, color: '#f8fafc', fontSize: '15px', fontWeight: 900 }}>
                          ₹{lineTotal.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Special Instructions */}
              {(activeOrder.notes || activeOrder.deliveryInstructions?.includes('NOTE:')) && (
                <div style={{
                  marginBottom: '20px', padding: '12px 16px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)',
                  fontSize: '13px', color: '#cbd5e1'
                }}>
                  <strong style={{ color: '#fb923c' }}>📝 Special Instructions:</strong>{' '}
                  {activeOrder.notes || activeOrder.deliveryInstructions?.split('NOTE:')[1]?.split('|')[0]}
                </div>
              )}

              {/* Totals Section */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                  <span>Subtotal</span>
                  <span style={{ color: '#e2e8f0' }}>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                  <span>Taxes &amp; GST (5%)</span>
                  <span style={{ color: '#e2e8f0' }}>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginTop: '8px', paddingTop: '12px', borderTop: '1px dashed rgba(255,255,255,0.1)'
                }}>
                  <div>
                    <span style={{ color: '#fff', fontSize: '16px', fontWeight: 900 }}>Grand Total</span>
                    <p style={{ margin: 0, color: '#818cf8', fontSize: '11px', fontWeight: 700 }}>
                      📋 Billed to Room Folio (Pay upon checkout)
                    </p>
                  </div>
                  <span style={{ color: '#fb923c', fontSize: '24px', fontWeight: 900 }}>
                    ₹{grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  flex: 1, minWidth: '200px', padding: '16px 24px', borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: 'white', border: 'none', fontSize: '15px', fontWeight: 800,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', boxShadow: '0 8px 24px rgba(249,115,22,0.3)'
                }}
              >
                <UtensilsCrossed size={18} />
                Order More Items
              </button>

              <button
                onClick={() => {
                  if (confirm('Clear tracking for this order on screen? (The order will still be delivered by hotel staff)')) {
                    localStorage.removeItem('room_portal_active_order_id');
                    setActiveOrderId(null);
                    setActiveOrder(null);
                    setSubmitted(false);
                  }
                }}
                style={{
                  padding: '16px 20px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#94a3b8', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                Clear Screen
              </button>
            </div>

          </div>
        </DashboardSubpage>
      </>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // MENU & ORDERING VIEW
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <>
      <Toaster richColors position="top-center" />
      <DashboardSubpage title="Room Service" emoji="🍽️" accentColor="rgba(251,146,60,0.4)">

        {/* Floating Active Order Tracker Banner if an active order exists */}
        {activeOrderId && activeOrder && (
          <div
            onClick={() => setSubmitted(true)}
            style={{
              marginBottom: '24px', padding: '14px 20px', borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(249,115,22,0.15) 100%)',
              border: '1.5px solid rgba(249,115,22,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', boxShadow: '0 8px 24px rgba(249,115,22,0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>🛎️</span>
              <div>
                <p style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 800 }}>
                  Active Order #{activeOrder.orderNo} is in progress!
                </p>
                <p style={{ margin: 0, color: '#fb923c', fontSize: '12px', fontWeight: 700 }}>
                  Status: {statusInfo.label} · Click to view live tracker &amp; details
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontWeight: 800, fontSize: '13px' }}>
              Track Order <ChevronRight size={16} />
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <Loader2 size={32} color="rgb(251,146,60)" className="animate-spin" />
          </div>
        ) : menu.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'rgb(100,116,139)' }}>
            <UtensilsCrossed size={48} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>Room service menu not available right now.</p>
            <p style={{ fontSize: '13px' }}>Please call the front desk to place your order.</p>
          </div>
        ) : (
          <div>
            {/* Cart FAB */}
            {cartCount > 0 && !showCart && (
              <button
                onClick={() => setShowCart(true)}
                style={{
                  position: 'fixed', bottom: '32px', right: '32px', zIndex: 100,
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  border: 'none', borderRadius: '20px', padding: '16px 24px',
                  color: 'white', fontWeight: 800, fontSize: '15px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 8px 32px rgba(249,115,22,0.4)',
                }}
              >
                <ShoppingCart size={20} />
                View Cart ({cartCount} items · ₹{cartTotal.toFixed(0)})
              </button>
            )}

            {/* Cart Panel */}
            {showCart && (
              <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
                background: 'rgba(9,14,28,0.98)', backdropFilter: 'blur(32px)',
                border: '1px solid rgba(249,115,22,0.3)', borderRadius: '24px 24px 0 0',
                padding: '24px', maxHeight: '70vh', overflowY: 'auto',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ color: 'white', fontWeight: 900, fontSize: '18px', margin: 0 }}>
                    🛒 Your Order
                  </h3>
                  <button onClick={() => setShowCart(false)} style={{ background: 'none', border: 'none', color: 'rgb(148,163,184)', cursor: 'pointer' }}>
                    <X size={24} />
                  </button>
                </div>
                {cart.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'white', fontWeight: 700, margin: 0, fontSize: '14px' }}>{c.name}</p>
                      <p style={{ color: 'rgb(249,115,22)', fontWeight: 700, margin: 0, fontSize: '13px' }}>₹{c.sellingPrice}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button onClick={() => updateQty(c.id, -1)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ color: 'white', fontWeight: 800, fontSize: '16px', minWidth: '20px', textAlign: 'center' }}>{c.qty}</span>
                      <button onClick={() => updateQty(c.id, 1)} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)', color: 'rgb(249,115,22)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={14} />
                      </button>
                    </div>
                    <p style={{ color: 'white', fontWeight: 800, margin: '0 0 0 16px', minWidth: '60px', textAlign: 'right' }}>
                      ₹{(c.sellingPrice * c.qty).toFixed(0)}
                    </p>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginTop: '8px', marginBottom: '16px' }}>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special instructions (allergies, extra crispy, less spicy...)"
                    rows={2}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15,23,42,0.8)', color: 'white', fontSize: '14px', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <p style={{ color: 'rgb(148,163,184)', fontWeight: 700, margin: 0 }}>Total</p>
                  <p style={{ color: 'white', fontWeight: 900, fontSize: '20px', margin: 0 }}>₹{cartTotal.toFixed(2)}</p>
                </div>
                <button
                  onClick={handleOrder}
                  disabled={submitting}
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #f97316, #ea580c)', color: 'white', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  {submitting ? <><Loader2 size={20} className="animate-spin" /> Placing Order...</> : <><Send size={20} /> Place Order</>}
                </button>
              </div>
            )}

            {/* Menu */}
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category} style={{ marginBottom: '32px' }}>
                <p style={{ color: 'rgb(100,116,139)', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>
                  {category}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                  {items.map((item) => {
                    const cartItem = cart.find((c) => c.id === item.id);
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.07)',
                          borderRadius: '16px', overflow: 'hidden',
                          transition: 'border-color 0.2s',
                          borderColor: cartItem ? 'rgba(249,115,22,0.4)' : 'rgba(255,255,255,0.07)',
                        }}
                      >
                        {item.image && (
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                        )}
                        <div style={{ padding: '14px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                            <p style={{ color: 'white', fontWeight: 700, fontSize: '14px', margin: 0, lineHeight: 1.3 }}>{item.name}</p>
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${item.isVeg ? 'rgb(34,197,94)' : 'rgb(239,68,68)'}`, color: item.isVeg ? 'rgb(34,197,94)' : 'rgb(239,68,68)', flexShrink: 0 }}>
                              {item.isVeg ? 'V' : 'NV'}
                            </span>
                          </div>
                          {item.description && <p style={{ color: 'rgb(71,85,105)', fontSize: '11px', margin: '0 0 10px 0', lineHeight: 1.4 }}>{item.description.slice(0, 60)}{item.description.length > 60 ? '...' : ''}</p>}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <p style={{ color: 'rgb(249,115,22)', fontWeight: 800, fontSize: '15px', margin: 0 }}>₹{item.sellingPrice}</p>
                            {cartItem ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={() => updateQty(item.id, -1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Minus size={12} />
                                </button>
                                <span style={{ color: 'white', fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>{cartItem.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)', color: 'rgb(249,115,22)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(249,115,22,0.4)', background: 'rgba(249,115,22,0.1)', color: 'rgb(249,115,22)', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                <Plus size={12} /> Add
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSubpage>
    </>
  );
}
