"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle, Clock, ChefHat, Package, Truck, PartyPopper,
  Phone, MapPin, Info, Star, RefreshCw
} from 'lucide-react';

const STATUS_PIPELINE = [
  { key: 'PLACED',           label: 'Order Placed',   icon: <CheckCircle size={18} />,  color: 'text-blue-400',    bg: 'bg-blue-400', desc: 'Your order has been received.' },
  { key: 'ACCEPTED',         label: 'Accepted',        icon: <CheckCircle size={18} />,  color: 'text-indigo-400',  bg: 'bg-indigo-400', desc: 'Restaurant confirmed your order.' },
  { key: 'IN_KITCHEN',       label: 'Preparing',       icon: <ChefHat size={18} />,      color: 'text-amber-400',   bg: 'bg-amber-400', desc: 'Our chefs are working on your food.' },
  { key: 'READY',            label: 'Ready',           icon: <Package size={18} />,      color: 'text-teal-400',    bg: 'bg-teal-400', desc: 'Your order is packed & ready for pickup.' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the Way',      icon: <Truck size={18} />,        color: 'text-purple-400',  bg: 'bg-purple-400', desc: 'Your rider is heading to you!' },
  { key: 'SETTLED',          label: 'Delivered! 🎉',   icon: <PartyPopper size={18} />,  color: 'text-emerald-400', bg: 'bg-emerald-400', desc: 'Your order has been delivered. Enjoy!' },
];

function LiveRiderMap({ riderLat, riderLng, dropLat, dropLng }: { riderLat?: number | null; riderLng?: number | null; dropLat?: number | null; dropLng?: number | null; }) {
  const mapId = 'track-map';
  const mapRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if ((window as any).L) { setLoaded(true); return; }
    if (!document.getElementById('leaflet-css')) {
      const l = document.createElement('link');
      l.id = 'leaflet-css'; l.rel = 'stylesheet';
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(l);
    }
    if (!document.getElementById('leaflet-js')) {
      const s = document.createElement('script');
      s.id = 'leaflet-js';
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = () => setLoaded(true);
      document.head.appendChild(s);
    } else {
      const ci = setInterval(() => { if ((window as any).L) { setLoaded(true); clearInterval(ci); } }, 100);
      return () => clearInterval(ci);
    }
  }, []);

  useEffect(() => {
    if (!loaded || !(window as any).L) return;
    const el = document.getElementById(mapId);
    if (!el) return;

    const L = (window as any).L;
    const centerLat = riderLat || dropLat || 28.6139;
    const centerLng = riderLng || dropLng || 77.2090;

    if (!mapRef.current) {
      mapRef.current = L.map(mapId, { zoomControl: false, attributionControl: false }).setView([centerLat, centerLng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current);

      // Drop pin (customer location)
      if (dropLat && dropLng) {
        const dropIcon = L.divIcon({
          className: '',
          html: `<div style="background:#10b981;border:3px solid white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,.6);font-size:18px;">🏠</div>`,
          iconSize: [36, 36], iconAnchor: [18, 18]
        });
        L.marker([dropLat, dropLng], { icon: dropIcon }).addTo(mapRef.current)
          .bindPopup('📍 Delivery Location', { closeButton: false }).openPopup();
        L.circle([dropLat, dropLng], { radius: 50, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.12, weight: 2, dashArray: '5,4' }).addTo(mapRef.current);
      }
    }

    // Rider marker (live, updates every poll)
    if (riderLat && riderLng) {
      const riderIcon = L.divIcon({
        className: '',
        html: `<div style="background:#a855f7;border:3px solid white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(168,85,247,.6);font-size:20px;animation:none;">🛵</div>`,
        iconSize: [40, 40], iconAnchor: [20, 20]
      });
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setLatLng([riderLat, riderLng]);
      } else {
        riderMarkerRef.current = L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(mapRef.current)
          .bindPopup('🛵 Your Rider', { closeButton: false });
      }
      mapRef.current.panTo([riderLat, riderLng], { animate: true, duration: 1 });
    }

    setTimeout(() => mapRef.current?.invalidateSize(), 200);
  }, [loaded, riderLat, riderLng, dropLat, dropLng]);

  return <div id={mapId} style={{ width: '100%', height: '100%' }} />;
}

export default function OrderTrackPage() {
  const params = useParams();
  const token = params?.token as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [isDelivered, setIsDelivered] = useState(false);

  const fetchOrder = async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/public/order-track?orderId=${token}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
        setIsDelivered(json.data.status === 'SETTLED');
      }
    } catch { }
    finally { setLoading(false); setLastRefresh(Date.now()); }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [token]);

  const currentStepIdx = STATUS_PIPELINE.findIndex(s => s.key === order?.status);
  const currentStep = STATUS_PIPELINE[currentStepIdx];

  return (
    <div className="min-h-screen bg-[#070b12] text-white font-sans" style={{
      background: 'radial-gradient(circle at top, #0d0f1a 0%, #050508 60%)',
    }}>
      {/* Grid bg */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      <div className="max-w-md mx-auto p-5 space-y-5 pb-12">
        {/* Header */}
        <div className="pt-8 text-center space-y-1">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl">
            🛵
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight">Live Order Tracking</h1>
          {order && (
            <p className="text-xs font-bold text-slate-500 font-mono tracking-wider">#{order.orderNo}</p>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-10 h-10 border-2 border-purple-500/30 rounded-full animate-spin border-t-purple-500" />
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading your order...</p>
          </div>
        ) : !order ? (
          <div className="text-center py-24 space-y-3">
            <p className="text-slate-400 font-bold">Order not found.</p>
            <p className="text-xs text-slate-600">Make sure you have the correct link from our message.</p>
          </div>
        ) : (
          <>
            {/* Status Banner */}
            <div className={`rounded-[2rem] p-6 text-center space-y-2 border ${
              isDelivered ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-purple-500/10 border-purple-500/20'
            }`}>
              <div className="flex justify-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
                  isDelivered ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-purple-500/20 border border-purple-500/30'
                }`}>
                  {isDelivered ? '🎉' : order.status === 'OUT_FOR_DELIVERY' ? '🛵' : order.status === 'IN_KITCHEN' ? '👨‍🍳' : '📦'}
                </div>
              </div>
              <h2 className={`text-lg font-black uppercase tracking-tight ${isDelivered ? 'text-emerald-400' : 'text-white'}`}>
                {currentStep?.label || order.status}
              </h2>
              <p className="text-xs text-slate-400 font-bold">{currentStep?.desc}</p>
              {order.estimatedMinutesRemaining > 0 && !isDelivered && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Clock size={13} className="text-amber-400" />
                  <span className="text-sm font-black text-amber-400">
                    ~{order.estimatedMinutesRemaining} min remaining
                  </span>
                </div>
              )}
            </div>

            {/* Status Pipeline */}
            <div className="bg-[#0d0f14] border border-white/5 rounded-[2rem] p-5 space-y-1">
              {STATUS_PIPELINE.map((step, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const isFuture = idx > currentStepIdx;
                return (
                  <div key={step.key} className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                        isCompleted ? `${step.bg} border-transparent text-white` :
                        isCurrent ? `border-current ${step.color} bg-white/5 animate-pulse` :
                        'border-white/10 text-slate-700 bg-transparent'
                      }`}>
                        {step.icon}
                      </div>
                      {idx < STATUS_PIPELINE.length - 1 && (
                        <div className={`w-0.5 h-5 mt-0.5 transition-all ${isCompleted ? 'bg-white/30' : 'bg-white/5'}`} />
                      )}
                    </div>
                    <div className={`flex-1 py-1 ${isFuture ? 'opacity-30' : ''}`}>
                      <p className={`text-sm font-black uppercase tracking-tight ${isCurrent ? step.color : isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                        {step.label}
                      </p>
                      {isCurrent && <p className="text-[10px] text-slate-500 font-bold">{step.desc}</p>}
                    </div>
                    {isCompleted && <CheckCircle size={14} className="text-emerald-500 shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Live Map — show when rider is out */}
            {(order.status === 'OUT_FOR_DELIVERY') && (
              <div className="bg-[#0d0f14] border border-purple-500/20 rounded-[2rem] overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between border-b border-purple-500/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                    <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">Live Rider Location</span>
                  </div>
                  <span className="text-[9px] text-slate-600 font-bold">Updates every 15s</span>
                </div>
                <div style={{ height: 260 }}>
                  <LiveRiderMap
                    riderLat={order.deliveryRider?.deliveryLat}
                    riderLng={order.deliveryRider?.deliveryLng}
                    dropLat={order.deliveryLat}
                    dropLng={order.deliveryLng}
                  />
                </div>
                {order.deliveryRider && (
                  <div className="px-4 py-3 border-t border-purple-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rider</p>
                      <p className="text-xs font-black text-white">{order.deliveryRider.fullName}</p>
                      <p className="text-[10px] text-slate-500 font-bold font-mono">{order.deliveryRider.vehicleNumber}</p>
                    </div>
                    {order.deliveryRider.phone && (
                      <a href={`tel:${order.deliveryRider.phone}`}
                        className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                        <Phone size={16} />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-[#0d0f14] border border-white/5 rounded-[2rem] p-5 space-y-3">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Summary</h3>
              <div className="space-y-2">
                {order.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-xs font-bold text-slate-300">
                    <span>{item.product?.name}</span>
                    <span className="text-slate-500">×{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 pt-3 flex justify-between">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Paid</span>
                <span className="text-sm font-black text-white">₹{Math.round(order.grandTotal)}</span>
              </div>
              {order.deliveryAddress && (
                <div className="flex items-start gap-2 pt-1 text-[10px] font-bold text-slate-500">
                  <MapPin size={12} className="text-red-400 shrink-0 mt-0.5" />
                  <span>{order.deliveryAddress}</span>
                </div>
              )}
              {order.isContactless && (
                <div className="flex items-center gap-2 text-[10px] font-black text-teal-400 uppercase tracking-widest">
                  <Info size={11} /> Contactless Delivery
                </div>
              )}
            </div>

            {/* Delivered — Rating Prompt */}
            {isDelivered && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6 text-center space-y-3">
                <h3 className="font-black text-white uppercase tracking-tight">Rate Your Experience</h3>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} className="text-3xl hover:scale-125 transition-transform active:scale-110">
                      ⭐
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 font-bold">Thank you for ordering with us!</p>
              </div>
            )}

            {/* Auto-refresh indicator */}
            <div className="flex items-center justify-center gap-2 text-[9px] text-slate-600 font-bold uppercase tracking-widest">
              <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
              Auto-refreshes every 15 seconds
            </div>
          </>
        )}
      </div>
    </div>
  );
}
