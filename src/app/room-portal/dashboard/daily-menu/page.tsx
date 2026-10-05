'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UtensilsCrossed, Clock, MapPin, ChefHat, CheckCircle2,
  Sun, Moon, Sunset, Coffee, ArrowRight, Sparkles, Send
} from 'lucide-react';
import DashboardSubpage from '@/components/room-portal/DashboardSubpage';
import { DEFAULT_DAILY_MEAL_SPREADS, DailyMealSpread } from '@/lib/daily-menus';
import { RoomPortalData } from '@/components/room-portal/types';

export default function DailyMenuPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'HI_TEA'>('BREAKFAST');
  const [mealPlan, setMealPlan] = useState<string>('EP');
  const [spreads, setSpreads] = useState<DailyMealSpread[]>(DEFAULT_DAILY_MEAL_SPREADS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('room_portal_token') || '';
    const propCode = localStorage.getItem('room_portal_property') || '';
    const propId = localStorage.getItem('room_portal_property_id') || '';

    const query = new URLSearchParams();
    if (propCode) query.set('propertyCode', propCode);
    if (propId) query.set('propertyId', propId);

    fetch(`/api/room-portal/me${query.toString() ? `?${query.toString()}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          const res = d.data.reservation;
          if (res?.mealPlan) {
            setMealPlan(res.mealPlan);
          }
          if (d.data.config?.dailyMealMenu) {
            try {
              const parsed = JSON.parse(d.data.config.dailyMealMenu);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSpreads(parsed);
              }
            } catch {}
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pCode = (mealPlan || 'EP').toUpperCase();
  const currentSpread = spreads.find((s) => s.mealType === activeTab) || spreads[0];

  const isCovered =
    pCode === 'AP' ||
    (pCode === 'MAP' && (activeTab === 'BREAKFAST' || activeTab === 'DINNER')) ||
    (pCode === 'CP' && activeTab === 'BREAKFAST') ||
    Boolean(currentSpread?.coveredInPlans?.includes(pCode));

  const mealTabs = [
    { type: 'BREAKFAST' as const, label: 'Breakfast', icon: Sun, defaultTime: '07:30 AM - 10:30 AM' },
    { type: 'LUNCH' as const, label: 'Lunch', icon: Sunset, defaultTime: '12:30 PM - 03:30 PM' },
    { type: 'DINNER' as const, label: 'Dinner', icon: Moon, defaultTime: '07:30 PM - 11:00 PM' },
    { type: 'HI_TEA' as const, label: 'Hi-Tea', icon: Coffee, defaultTime: '04:30 PM - 06:30 PM' },
  ];

  return (
    <DashboardSubpage title="Today's Meal Menus & Buffet" emoji="👨‍🍳" accentColor="rgba(245, 158, 11, 0.4)">
      <div style={{ maxWidth: '860px', margin: '0 auto', paddingBottom: '60px' }}>

        {/* Top Meal Plan Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.85))',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: '20px', padding: '18px 22px', marginBottom: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>🍽️</span>
              <span style={{ color: '#fff', fontSize: '15px', fontWeight: 900 }}>
                Your Stay Meal Plan: {pCode === 'CP' ? 'CP (Continental Plan)' : pCode === 'MAP' ? 'MAP (Modified American Plan)' : pCode === 'AP' ? 'AP (American Plan - All Meals)' : 'EP (European Plan - Room Only)'}
              </span>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>
              {pCode === 'CP'
                ? 'Daily breakfast buffet is included free in your booking.'
                : pCode === 'MAP'
                ? 'Daily breakfast and dinner buffets are included free in your booking.'
                : pCode === 'AP'
                ? 'All 3 daily meals (Breakfast, Lunch & Dinner) are fully included free in your booking.'
                : 'Room stay only. You can dine at the buffet restaurant or pre-order to your room.'}
            </p>
          </div>

          <span style={{
            padding: '6px 14px', borderRadius: '20px',
            background: pCode === 'EP' ? 'rgba(100,116,139,0.2)' : 'rgba(16,185,129,0.2)',
            border: pCode === 'EP' ? '1px solid rgba(100,116,139,0.3)' : '1px solid rgba(16,185,129,0.4)',
            color: pCode === 'EP' ? '#cbd5e1' : '#6ee7b7', fontSize: '12px', fontWeight: 900
          }}>
            {pCode === 'EP' ? 'EP · Room Only' : '✨ Meals Included Free'}
          </span>
        </div>

        {/* Meal Tabs Switcher */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px',
          marginBottom: '24px'
        }}>
          {mealTabs.map((tab) => {
            const isSel = activeTab === tab.type;
            const Icon = tab.icon;
            const sp = spreads.find((s) => s.mealType === tab.type);

            const isTabCovered =
              pCode === 'AP' ||
              (pCode === 'MAP' && (tab.type === 'BREAKFAST' || tab.type === 'DINNER')) ||
              (pCode === 'CP' && tab.type === 'BREAKFAST');

            return (
              <button
                key={tab.type}
                type="button"
                onClick={() => setActiveTab(tab.type)}
                style={{
                  padding: '14px 16px', borderRadius: '16px', cursor: 'pointer',
                  border: isSel ? '2px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
                  background: isSel ? 'rgba(245, 158, 11, 0.18)' : 'rgba(15, 23, 42, 0.7)',
                  color: isSel ? '#fbbf24' : '#94a3b8',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  transition: 'all 0.2s', textAlign: 'left'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: isSel ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={18} color={isSel ? '#fbbf24' : '#64748b'} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: isSel ? '#fff' : '#cbd5e1' }}>
                    {tab.label}
                  </div>
                  <div style={{ fontSize: '11px', color: isSel ? '#fcd34d' : '#64748b' }}>
                    {isTabCovered ? '🟢 Free in plan' : sp?.timings?.split('-')[0] || tab.defaultTime.split('-')[0]}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Meal Spread Details */}
        {currentSpread && (
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1.5px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '24px', padding: '24px',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
          }}>
            {/* Header with Title, Venue and Pre-Order Button */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '14px', marginBottom: '18px',
              borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900, color: '#fff' }}>
                    {currentSpread.title}
                  </h2>
                  <span style={{
                    fontSize: '11px', fontWeight: 900, padding: '3px 10px', borderRadius: '20px',
                    background: isCovered ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.2)',
                    color: isCovered ? '#6ee7b7' : '#94a3b8',
                    border: isCovered ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(100,116,139,0.3)',
                  }}>
                    {isCovered ? '✨ INCLUDED FREE IN YOUR PLAN' : 'ROOM SERVICE / À LA CARTE'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '13px', color: '#94a3b8', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Clock size={14} color="#f59e0b" /> {currentSpread.timings}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <MapPin size={14} color="#38bdf8" /> {currentSpread.venue}
                  </span>
                </div>
              </div>

              {/* Action Button: Pre-Order / Deliver to Room */}
              <button
                type="button"
                onClick={() => router.push(`/room-portal/dashboard/room-service?preorder=true&meal=${activeTab}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '12px 20px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                  border: 'none', color: '#fff', fontSize: '13px', fontWeight: 900,
                  cursor: 'pointer', boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)',
                  transition: 'all 0.2s', flexShrink: 0
                }}
              >
                🛎️ Pre-Order to Room / Pack for Travel <ArrowRight size={15} />
              </button>
            </div>

            {/* Description */}
            {currentSpread.description && (
              <p style={{ color: '#cbd5e1', fontSize: '13px', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                {currentSpread.description}
              </p>
            )}

            {/* Dishes Grid */}
            <div>
              <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 12px 0' }}>
                Featured Dishes &amp; Spread Counters ({currentSpread.items?.length || 0} items)
              </p>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '10px',
              }}>
                {(currentSpread.items || []).map((dish, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '14px', padding: '12px 14px',
                      display: 'flex', flexDirection: 'column', gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '12px', height: '12px', border: `1.5px solid ${dish.isVeg ? '#10b981' : '#f43f5e'}`,
                          borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}
                      >
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: dish.isVeg ? '#10b981' : '#f43f5e' }} />
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9', flex: 1 }}>
                        {dish.name}
                      </span>
                      {dish.category && (
                        <span style={{
                          fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                          borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8'
                        }}>
                          {dish.category}
                        </span>
                      )}
                    </div>
                    {dish.description && (
                      <p style={{ margin: '2px 0 0 20px', color: '#64748b', fontSize: '11px', lineHeight: 1.3 }}>
                        {dish.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Callout */}
            <div style={{
              marginTop: '22px', padding: '14px 18px', borderRadius: '14px',
              background: 'rgba(245, 158, 11, 0.1)', border: '1px dashed rgba(245, 158, 11, 0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🎒</span>
                <span style={{ color: '#fed7aa', fontSize: '12px', fontWeight: 700 }}>
                  Need an early morning checkout pack or breakfast on the go?
                </span>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/room-portal/dashboard/room-service?preorder=true&meal=${activeTab}`)}
                style={{
                  background: 'none', border: 'none', color: '#fb923c',
                  fontSize: '12px', fontWeight: 900, cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                Schedule Morning Travel Pack →
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardSubpage>
  );
}
