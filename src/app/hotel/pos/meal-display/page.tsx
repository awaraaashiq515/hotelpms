'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Utensils, Coffee, Sun, Moon, RefreshCw, Users,
  ChefHat, Clock, IndianRupee, Wifi, BedDouble, Star,
  UtensilsCrossed, ShoppingBag, TrendingUp, Search,
  Filter, Grid3X3, List, CheckCircle2, AlertCircle,
  Flame, Sunrise,
} from 'lucide-react';
import { useSidebar } from '@/context/sidebar-context';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderedItem {
  name: string;
  category: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  orderNo: string;
  orderStatus: string;
  orderedAt: string;
  outlet: string;
}

interface RoomMealData {
  checkInId: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  floor: string;
  guestName: string;
  guestPhone: string;
  mealPlanCode: string;
  mealPlanLabel: string;
  mealsIncluded: string[];
  adults: number;
  children: number;
  pax: number;
  checkedInAt: string;
  expectedCheckoutAt: string;
  orders: {
    orderId: string;
    orderNo: string;
    status: string;
    grandTotal: number;
    createdAt: string;
    itemCount: number;
  }[];
  orderedItems: OrderedItem[];
  totalOrderValue: number;
  orderCount: number;
}

interface Summary {
  totalCheckIns: number;
  byMealPlan: Record<string, { count: number; label: string }>;
  totalRoomServiceOrders: number;
  totalRoomServiceRevenue: number;
  totalPax: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MEAL_COLORS: Record<string, { bg: string; border: string; text: string; badge: string; dot: string }> = {
  RO: { bg: '#0f172a', border: '#1e293b', text: '#64748b', badge: '#1e293b', dot: '#475569' },
  CP: { bg: '#0c1a2e', border: '#1d3557', text: '#60a5fa', badge: '#1d3557', dot: '#3b82f6' },
  MAP: { bg: '#0f1f0f', border: '#14532d', text: '#4ade80', badge: '#14532d', dot: '#22c55e' },
  AP: { bg: '#1a0f00', border: '#78350f', text: '#fbbf24', badge: '#78350f', dot: '#f59e0b' },
  EP: { bg: '#0f172a', border: '#1e293b', text: '#94a3b8', badge: '#1e293b', dot: '#64748b' },
};

const MEAL_EMOJI: Record<string, string> = {
  RO: '🛏️',
  CP: '☕',
  MAP: '🍽️',
  AP: '⭐',
  EP: '🏨',
};

const MEAL_ICONS: Record<string, React.ReactNode> = {
  Breakfast: <Coffee size={12} />,
  Lunch: <Sun size={12} />,
  Dinner: <Moon size={12} />,
};

const fmt = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const getMealTimeEmoji = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 11) return '☕ Breakfast Time';
  if (h >= 11 && h < 15) return '🍴 Lunch Time';
  if (h >= 15 && h < 18) return '☕ Evening Tea';
  if (h >= 18 && h < 23) return '🍽️ Dinner Time';
  return '🌙 Late Night';
};

const getOrderStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': case 'KOT_RUNNING': return '#f59e0b';
    case 'READY': return '#22c55e';
    case 'SERVED': case 'SETTLED': return '#64748b';
    case 'BILL_PRINTED': return '#a855f7';
    default: return '#3b82f6';
  }
};

// ─── Main Component ──────────────────────────────────────────────────────────
export default function MealDisplayPage() {
  const [data, setData] = useState<{ rooms: RoomMealData[]; summary: Summary } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const { isOpen } = useSidebar();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/hotel/meal-display');
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        setData(json.data);
        setLastRefresh(new Date());
      }
    } catch (e) {
      console.error('Meal display fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 60000); // auto-refresh every 60s
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const rooms = data?.rooms || [];
  const summary = data?.summary;

  const filteredRooms = rooms.filter((r) => {
    const matchSearch =
      !search ||
      r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.guestName.toLowerCase().includes(search.toLowerCase()) ||
      r.mealPlanLabel.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === 'ALL' || r.mealPlanCode === filterPlan;
    return matchSearch && matchPlan;
  });

  const allPlans = [...new Set(rooms.map((r) => r.mealPlanCode))];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #060b14 0%, #0a0f1e 50%, #0c1520 100%)',
        color: '#e2e8f0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        paddingLeft: isOpen ? '240px' : '0',
        transition: 'padding-left 0.3s ease',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: 'linear-gradient(90deg, rgba(14,22,40,0.98) 0%, rgba(10,18,32,0.98) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(245,158,11,0.3)',
              flexShrink: 0,
            }}
          >
            <ChefHat size={22} color="white" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
              Restaurant Meal Display
            </h1>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b' }}>
              {getMealTimeEmoji()} &nbsp;·&nbsp; Live Room Meal Tracker
            </p>
          </div>
        </div>

        {/* Center: Stats pills */}
        {summary && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: <BedDouble size={13} />, label: `${summary.totalCheckIns} Rooms`, color: '#3b82f6' },
              { icon: <Users size={13} />, label: `${summary.totalPax} Pax`, color: '#8b5cf6' },
              { icon: <ShoppingBag size={13} />, label: `${summary.totalRoomServiceOrders} Orders`, color: '#f59e0b' },
              { icon: <IndianRupee size={13} />, label: fmt(summary.totalRoomServiceRevenue), color: '#22c55e' },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid rgba(255,255,255,0.08)`,
                  borderRadius: '20px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: stat.color,
                }}
              >
                {stat.icon}
                {stat.label}
              </div>
            ))}
          </div>
        )}

        {/* Right: clock + refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}>
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            title="Refresh"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              padding: '8px',
              cursor: 'pointer',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s',
            }}
          >
            <RefreshCw size={16} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div
        style={{
          padding: '12px 24px',
          background: 'rgba(10,15,28,0.5)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search room, guest..."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              padding: '7px 12px 7px 32px',
              color: '#e2e8f0',
              fontSize: '0.8rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Meal plan filter */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['ALL', ...allPlans].map((plan) => {
            const c = plan !== 'ALL' ? MEAL_COLORS[plan] : null;
            const isActive = filterPlan === plan;
            return (
              <button
                key={plan}
                onClick={() => setFilterPlan(plan)}
                style={{
                  background: isActive
                    ? plan === 'ALL'
                      ? 'rgba(255,255,255,0.12)'
                      : c?.badge
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? (plan === 'ALL' ? 'rgba(255,255,255,0.2)' : c?.border || '#333') : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '6px',
                  padding: '5px 12px',
                  cursor: 'pointer',
                  color: isActive ? (plan === 'ALL' ? '#f1f5f9' : c?.text || '#f1f5f9') : '#64748b',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
              >
                {plan === 'ALL' ? 'All Plans' : `${MEAL_EMOJI[plan] || ''} ${plan}`}
                {plan !== 'ALL' && summary?.byMealPlan?.[plan] && (
                  <span style={{ marginLeft: '5px', opacity: 0.7 }}>({summary.byMealPlan[plan].count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* View toggle */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '3px' }}>
          {(['grid', 'list'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                background: viewMode === mode ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 8px',
                cursor: 'pointer',
                color: viewMode === mode ? '#f1f5f9' : '#475569',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
              }}
            >
              {mode === 'grid' ? <Grid3X3 size={15} /> : <List size={15} />}
            </button>
          ))}
        </div>

        {/* Last refresh */}
        <div style={{ fontSize: '0.68rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Wifi size={11} />
          {fmtTime(lastRefresh.toISOString())}
        </div>
      </div>

      {/* ── Meal Plan Legend ── */}
      <div style={{ padding: '10px 24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {Object.entries({ RO: 'Room Only', CP: 'Bed & Breakfast', MAP: 'Half Board', AP: 'Full Board' }).map(([code, label]) => {
          const c = MEAL_COLORS[code];
          return (
            <div
              key={code}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.7rem',
                color: '#64748b',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.dot }} />
              <span style={{ color: c.text, fontWeight: 600 }}>{code}</span>
              <span>= {label}</span>
              {code !== 'AP' && <span style={{ color: '#334155', marginLeft: '4px' }}>·</span>}
            </div>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '8px 24px 32px' }}>
        {loading && rooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
            <p>Loading meal data...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569' }}>
            <BedDouble size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#334155' }}>No rooms found</p>
            <p style={{ margin: '6px 0 0', fontSize: '0.8rem' }}>
              {rooms.length === 0 ? 'No active check-ins today.' : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '14px',
            }}
          >
            {filteredRooms.map((room) => (
              <RoomCard
                key={room.checkInId}
                room={room}
                expanded={expandedRoom === room.checkInId}
                onToggle={() => setExpandedRoom(expandedRoom === room.checkInId ? null : room.checkInId)}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredRooms.map((room) => (
              <RoomListRow key={room.checkInId} room={room} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

// ─── Room Card (Grid) ────────────────────────────────────────────────────────
function RoomCard({ room, expanded, onToggle }: { room: RoomMealData; expanded: boolean; onToggle: () => void }) {
  const c = MEAL_COLORS[room.mealPlanCode] || MEAL_COLORS['RO'];

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${c.bg} 0%, #0a0f1e 100%)`,
        border: `1px solid ${c.border}`,
        borderRadius: '14px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: expanded ? `0 0 24px ${c.dot}22` : '0 2px 8px rgba(0,0,0,0.3)',
        transform: expanded ? 'scale(1.01)' : 'scale(1)',
      }}
      onClick={onToggle}
    >
      {/* Card Header */}
      <div
        style={{
          padding: '14px 16px 12px',
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Room number badge */}
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: c.badge,
              border: `1px solid ${c.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: c.text, lineHeight: 1 }}>
              {room.roomNumber}
            </span>
            {room.floor && (
              <span style={{ fontSize: '0.55rem', color: `${c.text}88`, marginTop: '1px' }}>
                Fl {room.floor}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f1f5f9' }}>{room.guestName || 'Guest'}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>{room.roomType}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '4px' }}>
              <Users size={11} color="#475569" />
              <span style={{ fontSize: '0.68rem', color: '#475569' }}>{room.pax} Pax</span>
              <span style={{ color: '#2d3748', fontSize: '0.68rem' }}>·</span>
              <span style={{ fontSize: '0.68rem', color: '#475569' }}>
                CO: {new Date(room.expectedCheckoutAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </div>
        </div>

        {/* Meal plan badge */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: c.badge,
              border: `1px solid ${c.border}`,
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: c.text,
            }}
          >
            <span>{MEAL_EMOJI[room.mealPlanCode] || '🍽️'}</span>
            <span>{room.mealPlanCode}</span>
          </div>
          {room.mealsIncluded.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px', justifyContent: 'flex-end' }}>
              {room.mealsIncluded.map((meal) => (
                <div
                  key={meal}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.62rem',
                    color: '#94a3b8',
                  }}
                >
                  {MEAL_ICONS[meal]} {meal.slice(0, 3)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Room Service Summary */}
      <div style={{ padding: '10px 16px 12px' }}>
        {room.orderCount === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.75rem' }}>
            <UtensilsCrossed size={14} />
            <span>No room service orders today</span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                <ShoppingBag size={13} color="#f59e0b" />
                <span style={{ fontWeight: 600, color: '#f59e0b' }}>{room.orderCount} order{room.orderCount > 1 ? 's' : ''}</span>
                <span>today</span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22c55e' }}>
                {fmt(room.totalOrderValue)}
              </span>
            </div>

            {/* Latest items preview (top 3) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {room.orderedItems.slice(0, 3).map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                  }}
                >
                  <span style={{ color: '#cbd5e1' }}>
                    <span style={{ color: '#64748b', marginRight: '5px' }}>×{item.qty}</span>
                    {item.name}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: getOrderStatusColor(item.orderStatus),
                        animation: item.orderStatus === 'OPEN' || item.orderStatus === 'KOT_RUNNING' ? 'pulse 2s infinite' : 'none',
                      }}
                    />
                    <span style={{ color: '#64748b' }}>{fmt(item.totalAmount)}</span>
                  </div>
                </div>
              ))}
              {room.orderedItems.length > 3 && (
                <div style={{ fontSize: '0.68rem', color: '#475569', textAlign: 'center', paddingTop: '2px' }}>
                  +{room.orderedItems.length - 3} more items {expanded ? '▲' : '▼'}
                </div>
              )}
            </div>
          </>
        )}

        {/* Expanded: all items */}
        {expanded && room.orderedItems.length > 3 && (
          <div style={{ marginTop: '8px', borderTop: `1px solid ${c.border}`, paddingTop: '8px' }}>
            <div style={{ fontSize: '0.68rem', color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Ordered Items</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {room.orderedItems.slice(3).map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                  }}
                >
                  <span style={{ color: '#cbd5e1' }}>
                    <span style={{ color: '#64748b', marginRight: '5px' }}>×{item.qty}</span>
                    {item.name}
                  </span>
                  <span style={{ color: '#64748b' }}>{fmt(item.totalAmount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Room List Row (List view) ────────────────────────────────────────────────
function RoomListRow({ room }: { room: RoomMealData }) {
  const c = MEAL_COLORS[room.mealPlanCode] || MEAL_COLORS['RO'];

  return (
    <div
      style={{
        background: `rgba(10,15,28,0.8)`,
        border: `1px solid ${c.border}`,
        borderLeft: `3px solid ${c.dot}`,
        borderRadius: '10px',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        transition: 'all 0.2s',
      }}
    >
      {/* Room # */}
      <div style={{ minWidth: '52px' }}>
        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: c.text }}>{room.roomNumber}</div>
        {room.floor && <div style={{ fontSize: '0.65rem', color: '#475569' }}>Floor {room.floor}</div>}
      </div>

      {/* Guest */}
      <div style={{ flex: '1', minWidth: '140px' }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#f1f5f9' }}>{room.guestName || 'Guest'}</div>
        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{room.roomType} · {room.pax} pax</div>
      </div>

      {/* Meal plan */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: c.badge,
            border: `1px solid ${c.border}`,
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '0.72rem',
            fontWeight: 700,
            color: c.text,
          }}
        >
          {MEAL_EMOJI[room.mealPlanCode]} {room.mealPlanCode}
        </div>
        {room.mealsIncluded.length > 0 && (
          <div style={{ display: 'flex', gap: '3px' }}>
            {room.mealsIncluded.map((m) => (
              <div key={m} style={{ fontSize: '0.6rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                {MEAL_ICONS[m]}{m.slice(0, 1)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders */}
      <div style={{ flex: '1', minWidth: '200px' }}>
        {room.orderedItems.length === 0 ? (
          <span style={{ fontSize: '0.72rem', color: '#334155' }}>No orders today</span>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {room.orderedItems.slice(0, 4).map((item, i) => (
              <span
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '4px',
                  padding: '2px 7px',
                  fontSize: '0.68rem',
                  color: '#94a3b8',
                }}
              >
                ×{item.qty} {item.name}
              </span>
            ))}
            {room.orderedItems.length > 4 && (
              <span style={{ fontSize: '0.68rem', color: '#475569' }}>+{room.orderedItems.length - 4} more</span>
            )}
          </div>
        )}
      </div>

      {/* Total */}
      <div style={{ textAlign: 'right', minWidth: '80px' }}>
        {room.orderCount > 0 ? (
          <>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#22c55e' }}>{fmt(room.totalOrderValue)}</div>
            <div style={{ fontSize: '0.65rem', color: '#475569' }}>{room.orderCount} order{room.orderCount > 1 ? 's' : ''}</div>
          </>
        ) : (
          <div style={{ fontSize: '0.7rem', color: '#2d3748' }}>—</div>
        )}
      </div>

      {/* Checkout */}
      <div style={{ fontSize: '0.68rem', color: '#475569', textAlign: 'right', minWidth: '60px' }}>
        CO: {new Date(room.expectedCheckoutAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
      </div>
    </div>
  );
}
