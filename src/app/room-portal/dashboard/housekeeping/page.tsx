'use client';

import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Send, Shirt, Plus, Minus, Tag, Clock } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';

const REQUEST_TYPES = [
  { id: 'CLEANING', emoji: '🧹', label: 'Room Cleaning', desc: 'Full room cleaning service' },
  { id: 'TOWELS', emoji: '🛁', label: 'Fresh Towels', desc: 'Replace or add towels' },
  { id: 'AMENITIES', emoji: '🧴', label: 'Toiletries', desc: 'Shampoo, soap, toothbrush...' },
  { id: 'BEDDING', emoji: '🛏️', label: 'Fresh Bedding', desc: 'Change bed sheets & pillows' },
  { id: 'LAUNDRY', emoji: '👕', label: 'Laundry', desc: 'Collect laundry for cleaning' },
  { id: 'DND', emoji: '🚫', label: 'Do Not Disturb', desc: 'Set DND for your room' },
  { id: 'WATER', emoji: '💧', label: 'Drinking Water', desc: 'Extra water bottles' },
  { id: 'OTHER', emoji: '📋', label: 'Other Request', desc: 'Custom request' },
];

const DEFAULT_LAUNDRY_MENU = [
  { id: '1', name: "Men's Shirt (Formal / Casual)", category: "Men's Clothing", serviceType: "Wash & Iron", price: 60, turnaround: "Same Day" },
  { id: '2', name: "T-Shirt / Polo", category: "Men's Clothing", serviceType: "Wash & Iron", price: 50, turnaround: "Same Day" },
  { id: '3', name: "Trousers / Jeans", category: "Men's Clothing", serviceType: "Wash & Iron", price: 80, turnaround: "Same Day" },
  { id: '4', name: "Men's Suit (2-Piece)", category: "Dry Cleaning", serviceType: "Dry Clean & Press", price: 300, turnaround: "24 Hours" },
  { id: '5', name: "Kurta Pyjama Set", category: "Men's Clothing", serviceType: "Wash & Iron", price: 120, turnaround: "Same Day" },
  { id: '6', name: "Saree (Cotton / Silk)", category: "Women's Clothing", serviceType: "Dry Clean & Press", price: 220, turnaround: "24 Hours" },
  { id: '7', name: "Ladies Salwar Suit", category: "Women's Clothing", serviceType: "Wash & Iron", price: 120, turnaround: "Same Day" },
  { id: '8', name: "Double Bed Sheet", category: "Linen & Bedding", serviceType: "Wash & Fold", price: 80, turnaround: "Same Day" },
  { id: '9', name: "Bath Towel (Large)", category: "Linen & Bedding", serviceType: "Wash & Soften", price: 50, turnaround: "Same Day" },
  { id: '10', name: "Heavy Blanket / Quilt", category: "Dry Cleaning", serviceType: "Deep Clean", price: 350, turnaround: "48 Hours" },
];

export default function HousekeepingPage() {
  const [selected, setSelected] = useState<string>('');
  const [priority, setPriority] = useState<'URGENT' | 'NORMAL'>('NORMAL');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Laundry Menu & Selections
  const [laundryMenu, setLaundryMenu] = useState<any[]>(DEFAULT_LAUNDRY_MENU);
  const [laundrySelections, setLaundrySelections] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    fetch('/api/hotel/laundry/menu')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setLaundryMenu(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const totalLaundryItems = Object.values(laundrySelections).reduce((sum, count) => sum + count, 0);
  const totalLaundryCost = Object.entries(laundrySelections).reduce((sum, [id, count]) => {
    const item = laundryMenu.find((m) => m.id === id);
    return sum + (item ? item.price * count : 0);
  }, 0);

  const handleUpdateQty = (itemId: string, delta: number) => {
    setLaundrySelections((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  const handleSubmit = async () => {
    if (!selected) {
      toast.error('Please select a request type.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('room_portal_token') || '';

      // Format laundry details if laundry was selected
      let itemsDetail = '';
      let itemsPayload: any[] = [];
      if (selected === 'LAUNDRY' && totalLaundryItems > 0) {
        itemsPayload = Object.entries(laundrySelections).map(([id, qty]) => {
          const item = laundryMenu.find((m) => m.id === id);
          return {
            id,
            name: item?.name || 'Laundry Item',
            qty,
            price: item?.price || 0,
          };
        });
        itemsDetail = itemsPayload.map((i) => `${i.name} (x${i.qty})`).join(', ');
      }

      const res = await fetch('/api/room-portal/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: selected === 'LAUNDRY' ? 'LAUNDRY' : 'HOUSEKEEPING',
          category: selected,
          notes,
          priority,
          itemsCount: totalLaundryItems > 0 ? totalLaundryItems : 1,
          amount: totalLaundryCost,
          items: itemsPayload,
          itemsDetail,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        toast.success(
          selected === 'LAUNDRY' && totalLaundryCost > 0
            ? `Laundry order placed! Estimated bill: ₹${totalLaundryCost}`
            : 'Request submitted! Our team will attend to it shortly.'
        );
      } else {
        toast.error(data.message || 'Failed to submit.');
      }
    } catch {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['ALL', ...Array.from(new Set(laundryMenu.map((m) => m.category))).filter(Boolean)];

  return (
    <>
      <Toaster richColors position="top-center" />
      <DashboardSubpage title="Housekeeping & Laundry" emoji="🧹" accentColor="rgba(34,211,238,0.4)">
        {submitted ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: '72px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>Request Submitted!</h2>
            <p style={{ color: 'rgb(100,116,139)', fontSize: '16px', marginBottom: '32px' }}>
              Our housekeeping team will attend to your request shortly.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setSelected('');
                setNotes('');
                setLaundrySelections({});
              }}
              style={{
                padding: '14px 32px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                color: 'white',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Submit Another Request
            </button>
          </div>
        ) : (
          <div>
            {/* Request type grid */}
            <p
              style={{
                color: 'rgb(100,116,139)',
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '16px',
              }}
            >
              Select Request Type
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
              {REQUEST_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelected(type.id)}
                  style={{
                    background:
                      selected === type.id
                        ? 'linear-gradient(135deg, rgba(34,211,238,0.2), rgba(59,130,246,0.1))'
                        : 'rgba(15,23,42,0.8)',
                    border: selected === type.id ? '2px solid rgba(34,211,238,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                    padding: '20px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: selected === type.id ? '0 0 20px rgba(34,211,238,0.2)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '32px' }}>{type.emoji}</span>
                  <p style={{ color: 'white', fontWeight: 800, fontSize: '13px', margin: 0, textAlign: 'center' }}>
                    {type.label}
                  </p>
                  <p style={{ color: 'rgb(100,116,139)', fontSize: '11px', margin: 0, textAlign: 'center' }}>
                    {type.desc}
                  </p>
                  {selected === type.id && <CheckCircle2 size={16} color="rgb(34,211,238)" />}
                </button>
              ))}
            </div>

            {/* ══ INTERACTIVE LAUNDRY RATE MENU (WHEN LAUNDRY IS SELECTED) ══ */}
            {selected === 'LAUNDRY' && (
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(34, 211, 238, 0.3)',
                  borderRadius: '20px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Shirt size={18} color="#22d3ee" /> Laundry Service Menu & Rates
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '12px', margin: '4px 0 0 0' }}>
                      Choose the garments or items you want washed, dry cleaned, or ironed.
                    </p>
                  </div>

                  {totalLaundryItems > 0 && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Total Estimate</span>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#34d399' }}>
                        ₹{totalLaundryCost} <span style={{ fontSize: '12px', color: '#94a3b8' }}>({totalLaundryItems} items)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '14px' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        border: selectedCategory === cat ? '1px solid #22d3ee' : '1px solid rgba(255,255,255,0.1)',
                        background: selectedCategory === cat ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.03)',
                        color: selectedCategory === cat ? '#22d3ee' : '#94a3b8',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Items List */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                  {laundryMenu
                    .filter((m) => selectedCategory === 'ALL' || m.category === selectedCategory)
                    .map((item) => {
                      const qty = laundrySelections[item.id] || 0;
                      return (
                        <div
                          key={item.id}
                          style={{
                            background: qty > 0 ? 'rgba(34, 211, 238, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                            border: qty > 0 ? '1px solid rgba(34, 211, 238, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '14px',
                            padding: '12px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <div style={{ color: 'white', fontWeight: 800, fontSize: '13px' }}>{item.name}</div>
                            <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
                              {item.serviceType} • <span style={{ color: '#38bdf8' }}>{item.turnaround}</span>
                            </div>
                            <div style={{ color: '#34d399', fontWeight: 900, fontSize: '14px', marginTop: '4px' }}>
                              ₹{item.price}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              onClick={() => handleUpdateQty(item.id, -1)}
                              disabled={qty === 0}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(255,255,255,0.05)',
                                color: qty === 0 ? '#475569' : 'white',
                                cursor: qty === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{ minWidth: '18px', textAlign: 'center', fontWeight: 900, color: 'white', fontSize: '13px' }}>
                              {qty}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(item.id, 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                border: '1px solid rgba(34,211,238,0.4)',
                                background: 'rgba(34,211,238,0.2)',
                                color: '#22d3ee',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Priority */}
            <div style={{ marginBottom: '20px' }}>
              <p
                style={{
                  color: 'rgb(100,116,139)',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  marginBottom: '10px',
                }}
              >
                Priority
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                {(['NORMAL', 'URGENT'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '12px',
                      border:
                        priority === p
                          ? `2px solid ${p === 'URGENT' ? 'rgba(239,68,68,0.7)' : 'rgba(34,211,238,0.7)'}`
                          : '1px solid rgba(255,255,255,0.1)',
                      background:
                        priority === p
                          ? p === 'URGENT'
                            ? 'rgba(239,68,68,0.15)'
                            : 'rgba(34,211,238,0.15)'
                          : 'rgba(15,23,42,0.6)',
                      color: priority === p ? (p === 'URGENT' ? 'rgb(252,165,165)' : 'rgb(103,232,249)') : 'rgb(100,116,139)',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {p === 'URGENT' ? '🚨 Urgent' : '✅ Normal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: '28px' }}>
              <p
                style={{
                  color: 'rgb(100,116,139)',
                  fontSize: '12px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  marginBottom: '10px',
                }}
              >
                Additional Instructions / Notes
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  selected === 'LAUNDRY'
                    ? 'e.g. Please do not bleach the silk shirt, deliver before 7 PM...'
                    : 'Any specific instructions for the team...'
                }
                rows={3}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '14px',
                  border: '1px solid rgba(99,102,241,0.2)',
                  background: 'rgba(15,23,42,0.7)',
                  color: 'white',
                  fontSize: '15px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !selected}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '16px',
                border: 'none',
                background: !selected ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #22d3ee, #3b82f6)',
                color: 'white',
                fontSize: '16px',
                fontWeight: 800,
                cursor: !selected ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: selected ? '0 8px 32px rgba(34,211,238,0.3)' : 'none',
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  <Send size={20} />{' '}
                  {selected === 'LAUNDRY' && totalLaundryCost > 0
                    ? `Order Laundry Pickup (₹${totalLaundryCost})`
                    : 'Submit Request'}
                </>
              )}
            </button>
          </div>
        )}
      </DashboardSubpage>
    </>
  );
}
