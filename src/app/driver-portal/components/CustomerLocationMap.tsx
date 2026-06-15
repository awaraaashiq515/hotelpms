'use client';

import React from 'react';
import { Navigation, Clock, MapPin, Download, Wifi, WifiOff, Store, Home, AlertCircle } from 'lucide-react';
import { PosOrder } from '../types';

interface CustomerLocationMapProps {
  order: PosOrder;
  riderLat?: number | null;
  riderLng?: number | null;
  queueIndex?: number;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
}

// Haversine distance in km
function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Fetch routing coordinates along roads using OSRM API
async function fetchOSRMRoute(lat1: number, lng1: number, lat2: number, lng2: number): Promise<[number, number][] | null> {
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates; // OSRM gives [lng, lat]
      return coords.map((c: [number, number]) => [c[1], c[0]]); // Swap to [lat, lng] for Leaflet
    }
    return null;
  } catch (error) {
    console.error('OSRM route fetch failed:', error);
    return null;
  }
}

export function CustomerLocationMap({
  order,
  riderLat,
  riderLng,
  queueIndex,
  restaurantLat: propRestaurantLat,
  restaurantLng: propRestaurantLng
}: CustomerLocationMapProps) {
  const restaurantLat = propRestaurantLat ?? order.property?.latitude ?? null;
  const restaurantLng = propRestaurantLng ?? order.property?.longitude ?? null;

  const mapId = React.useRef(`driver-map-${order.id}`).current;
  const mapRef = React.useRef<any>(null);
  const riderMarkerRef = React.useRef<any>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(typeof window !== 'undefined' ? navigator.onLine : true);

  const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
  const isPickupPhase = !isOutForDelivery; // Heading to restaurant
  const destLat = order.deliveryLat ? Number(order.deliveryLat) : null;
  const destLng = order.deliveryLng ? Number(order.deliveryLng) : null;

  // Road Routing States
  const [routeRiderToNext, setRouteRiderToNext] = React.useState<[number, number][] | null>(null);
  const [routeRestToCust, setRouteRestToCust] = React.useState<[number, number][] | null>(null);

  // Online/offline detection
  React.useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Fetch static route restaurant -> customer
  React.useEffect(() => {
    if (!restaurantLat || !restaurantLng || !destLat || !destLng) return;
    let active = true;
    fetchOSRMRoute(restaurantLat, restaurantLng, destLat, destLng).then(coords => {
      if (active && coords) setRouteRestToCust(coords);
    });
    return () => { active = false; };
  }, [restaurantLat, restaurantLng, destLat, destLng]);

  // Fetch active route rider -> next stop (debounced to avoid spamming OSRM)
  const nextLat = isPickupPhase ? (restaurantLat || destLat) : destLat;
  const nextLng = isPickupPhase ? (restaurantLng || destLng) : destLng;
  React.useEffect(() => {
    if (!riderLat || !riderLng || !nextLat || !nextLng) return;
    const timer = setTimeout(() => {
      fetchOSRMRoute(riderLat, riderLng, nextLat, nextLng).then(coords => {
        if (coords) setRouteRiderToNext(coords);
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [riderLat, riderLng, nextLat, nextLng]);

  // Load Leaflet
  React.useEffect(() => {
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

  // Init map
  React.useEffect(() => {
    if (!loaded || !(window as any).L) return;
    const el = document.getElementById(mapId);
    if (!el || mapRef.current) return;
    const L = (window as any).L;

    // Determine initial center
    const centerLat = restaurantLat || destLat || 30.7420;
    const centerLng = restaurantLng || destLng || 76.7875;

    const map = L.map(mapId, { zoomControl: false, attributionControl: false }).setView([centerLat, centerLng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    const bounds: [number, number][] = [];

    // 🏪 Restaurant marker
    if (restaurantLat && restaurantLng) {
      const restIcon = L.divIcon({
        className: '',
        html: `<div style="background:#f43f5e;border:3px solid white;border-radius:10px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(244,63,94,.55);font-size:17px;">🏪</div>`,
        iconSize: [34, 34], iconAnchor: [17, 17]
      });
      L.marker([restaurantLat, restaurantLng], { icon: restIcon }).addTo(map)
        .bindPopup(`<b>🏪 ${order.property?.name || 'Restaurant'}</b><br/><small>${order.property?.address || ''}</small>`, { closeButton: false });
      bounds.push([restaurantLat, restaurantLng]);

      // Pickup radius circle
      L.circle([restaurantLat, restaurantLng], {
        radius: 50, color: '#f43f5e', fillColor: '#f43f5e', fillOpacity: 0.1, weight: 2, dashArray: '4,4'
      }).addTo(map);
    }

    // 🏠 Customer/delivery marker
    if (destLat && destLng) {
      const custIcon = L.divIcon({
        className: '',
        html: `<div style="background:#10b981;border:3px solid white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,.55);font-size:17px;">🏠</div>`,
        iconSize: [34, 34], iconAnchor: [17, 17]
      });
      L.marker([destLat, destLng], { icon: custIcon }).addTo(map)
        .bindPopup(`<b>🏠 ${order.deliveryCustomerName || 'Customer'}</b><br/><small>${order.deliveryAddress || ''}</small>`, { closeButton: false });
      bounds.push([destLat, destLng]);

      L.circle([destLat, destLng], {
        radius: 60, color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, weight: 2, dashArray: '5,4'
      }).addTo(map);
    }

    // Draw route: restaurant → customer (when both exist) along the road
    if (restaurantLat && restaurantLng && destLat && destLng) {
      const path = routeRestToCust || [[restaurantLat, restaurantLng], [destLat, destLng]];
      L.polyline(path, {
        color: '#6366f1',
        weight: 2,
        dashArray: routeRestToCust ? undefined : '8,5',
        opacity: 0.6
      }).addTo(map);
      path.forEach(pt => bounds.push(pt));
    }

    // 🛵 Rider marker
    if (riderLat && riderLng) {
      const riderIcon = L.divIcon({
        className: '',
        html: `<div style="background:#8b5cf6;border:3px solid white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(139,92,246,.6);font-size:14px;">🛵</div>`,
        iconSize: [28, 28], iconAnchor: [14, 14]
      });
      const riderM = L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map);
      riderMarkerRef.current = riderM;

      // Route from rider to next destination along the road
      if (nextLat && nextLng) {
        const path = routeRiderToNext || [[riderLat, riderLng], [nextLat, nextLng]];
        L.polyline(path, {
          color: '#f43f5e',
          weight: 3.5,
          dashArray: routeRiderToNext ? undefined : '6,4',
          opacity: 0.85
        }).addTo(map);
        path.forEach(pt => bounds.push(pt));
      }
    }

    if (bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [15, 15] });
    }

    const timers = [
      setTimeout(() => {
        map.invalidateSize();
        if (bounds.length >= 2) {
          map.fitBounds(bounds, { padding: [15, 15] });
        }
      }, 100),
      setTimeout(() => {
        map.invalidateSize();
        if (bounds.length >= 2) {
          map.fitBounds(bounds, { padding: [15, 15] });
        }
      }, 300),
      setTimeout(() => {
        map.invalidateSize();
        if (bounds.length >= 2) {
          map.fitBounds(bounds, { padding: [15, 15] });
        }
      }, 800),
    ];

    mapRef.current = map;
    return () => {
      timers.forEach(clearTimeout);
      map.remove();
      mapRef.current = null;
      riderMarkerRef.current = null;
    };
  }, [loaded, mapId, order, riderLat, riderLng, restaurantLat, restaurantLng, destLat, destLng, isPickupPhase, routeRiderToNext, routeRestToCust, nextLat, nextLng]);

  // Update rider marker live
  React.useEffect(() => {
    if (!mapRef.current || !riderMarkerRef.current || !riderLat || !riderLng) return;
    riderMarkerRef.current.setLatLng([riderLat, riderLng]);
  }, [riderLat, riderLng]);

  // ETA calculation
  let etaText = '';
  let distanceText = '';
  let etaTarget = '';
  if (riderLat && riderLng) {
    if (isPickupPhase && restaurantLat && restaurantLng) {
      const km = calcDistance(riderLat, riderLng, restaurantLat, restaurantLng);
      const mins = Math.ceil((km / 25) * 60);
      distanceText = km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
      etaText = mins <= 1 ? '~1 min' : `~${mins} min`;
      etaTarget = 'to pickup';
    } else if (destLat && destLng) {
      const km = calcDistance(riderLat, riderLng, destLat, destLng);
      const mins = Math.ceil((km / 30) * 60);
      distanceText = km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
      etaText = mins <= 1 ? '~1 min' : `~${mins} min`;
      etaTarget = 'to customer';
    }
  }

  // Navigation URLs with explicit origins (forces Google Maps to start at Rider/Restaurant instead of laptop GPS)
  const restParam = restaurantLat && restaurantLng
    ? `${restaurantLat},${restaurantLng}`
    : encodeURIComponent(`${order.property?.name || ''} ${order.property?.address || ''} ${order.property?.city || ''}`.trim());
  const custParam = destLat && destLng
    ? `${destLat},${destLng}`
    : encodeURIComponent(order.deliveryAddress || '');

  const originParam = riderLat && riderLng ? `&origin=${riderLat},${riderLng}` : '';
  const originForCust = riderLat && riderLng 
    ? `${riderLat},${riderLng}` 
    : (restaurantLat && restaurantLng ? `${restaurantLat},${restaurantLng}` : '');
  const originParamCust = originForCust ? `&origin=${originForCust}` : '';

  const navToRestaurant = `https://www.google.com/maps/dir/?api=1${originParam}&destination=${restParam}&travelmode=driving`;
  const navToCustomer = `https://www.google.com/maps/dir/?api=1${originParamCust}&destination=${custParam}&travelmode=driving`;
  const offlineSaveUrl = isPickupPhase
    ? `https://maps.google.com/?q=${restParam}`
    : `https://maps.google.com/?q=${custParam}`;

  return (
    <div className="rounded-2xl overflow-hidden border border-[#1e293b]/70 shadow-md relative">
      {/* Map canvas */}
      <div id={mapId} style={{ height: 200, width: '100%' }} />

      {/* Connectivity badge */}
      <div className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase ${
        isOnline ? 'bg-emerald-600/80 text-white' : 'bg-amber-500/80 text-white'
      } backdrop-blur-sm`}>
        {isOnline ? <Wifi size={8} /> : <WifiOff size={8} />}
        {isOnline ? 'Live' : 'Offline'}
      </div>

      {/* Phase indicator */}
      <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md text-[7.5px] font-black uppercase backdrop-blur-sm ${
        isOutForDelivery
          ? 'bg-emerald-600/80 text-white'
          : 'bg-rose-600/80 text-white'
      }`}>
        {isOutForDelivery ? <><Home size={8} /> To Customer</> : <><Store size={8} /> Pickup First</>}
      </div>

      {/* GPS live dot */}
      {riderLat && riderLng && (
        <div className="absolute bottom-[130px] right-2 flex items-center gap-1 bg-violet-600/80 text-white px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase backdrop-blur-sm">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping inline-block" />
          GPS
        </div>
      )}

      {/* ETA strip */}
      {etaText && (
        <div className={`px-3 py-1.5 flex items-center justify-between ${
          isOutForDelivery ? 'bg-emerald-600/90' : 'bg-rose-600/90'
        } backdrop-blur-sm`}>
          <div className="flex items-center gap-1.5">
            <Clock size={10} className="text-white/70" />
            <span className="text-[8.5px] font-black text-white uppercase tracking-widest">ETA: {etaText}</span>
          </div>
          <span className="text-[8px] font-black text-white/80 uppercase">{distanceText} {etaTarget}</span>
        </div>
      )}

      {/* Restaurant info card (when in pickup phase) */}
      {isPickupPhase && order.property && (
        <div className="bg-rose-500/10 border-t border-rose-500/20 px-3 py-2 flex items-center gap-2">
          <Store size={12} className="text-rose-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-rose-300 uppercase truncate">{order.property.name}</p>
            {order.property.address && (
              <p className="text-[7.5px] text-slate-400 font-bold truncate">{order.property.address}{order.property.city ? `, ${order.property.city}` : ''}</p>
            )}
          </div>
          {order.property.phone && (
            <a href={`tel:${order.property.phone}`} className="w-7 h-7 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center text-rose-400 shrink-0">
              <MapPin size={11} />
            </a>
          )}
        </div>
      )}

      {/* Customer address (when out for delivery) */}
      {isOutForDelivery && (
        <div className="bg-emerald-500/10 border-t border-emerald-500/20 px-3 py-2 flex items-center gap-2">
          <Home size={12} className="text-emerald-400 shrink-0" />
          <p className="text-[9px] font-bold text-slate-300 truncate flex-1">{order.deliveryAddress || 'Address not set'}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="bg-[#090b10]/95 border-t border-[#1e293b] px-3 py-2.5 flex gap-2">
        {/* Navigate to Restaurant (show when pickup phase OR always as secondary) */}
        {isPickupPhase ? (
          <a
            href={navToRestaurant}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white text-[8.5px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-rose-500/20"
          >
            <Store size={11} /> Navigate to Restaurant
          </a>
        ) : (
          <>
            <a
              href={navToCustomer}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-[8.5px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Navigation size={11} /> Navigate to Customer
            </a>
            {/* Secondary: navigate to restaurant */}
            <a
              href={navToRestaurant}
              target="_blank"
              rel="noopener noreferrer"
              title="Navigate back to restaurant"
              className="w-9 h-9 flex items-center justify-center bg-[#1e293b] hover:bg-rose-500/10 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-xl border border-[#334155]/60 transition-all shrink-0"
            >
              <Store size={13} />
            </a>
          </>
        )}
        {/* Offline cache */}
        <a
          href={offlineSaveUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Save map area offline"
          className="w-9 h-9 flex items-center justify-center bg-[#1e293b] hover:bg-[#28354c] text-slate-400 hover:text-emerald-400 rounded-xl border border-[#334155]/60 transition-all shrink-0"
        >
          <Download size={12} />
        </a>
      </div>
    </div>
  );
}
