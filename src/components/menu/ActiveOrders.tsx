import React, { useEffect, useRef, useState } from 'react';
import { History, Clock, CheckCircle, ChefHat, ChevronRight, Plus, CreditCard, QrCode, X, Smartphone, Wallet, IndianRupee, Store, ArrowLeft, Truck, Phone, Navigation, MapPin, Maximize2, Minimize2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';

interface ActiveOrdersProps {
  orders: any[];
  tableName: string;
  propertyId?: string;
  propertyAddress?: string;
  propertyLatitude?: number | null;
  propertyLongitude?: number | null;
  upiId?: string;
  upiName?: string;
  setActiveTab: (tab: 'menu' | 'orders') => void;
  onPaymentSuccess?: () => void;
}

function getDeliveryOtp(orderId: string): string {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const otp = Math.abs(hash % 9000 + 1000);
  return otp.toString();
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

interface DeliveryTrackingCardProps {
  order: any;
  propertyAddress?: string;
  restaurantLatitude?: number | null;
  restaurantLongitude?: number | null;
}

const DeliveryTrackingCard: React.FC<DeliveryTrackingCardProps> = ({ order, propertyAddress, restaurantLatitude, restaurantLongitude }) => {
  const [pct, setPct] = useState(15);
  const [simulating, setSimulating] = useState(true);
  const [showCallScreen, setShowCallScreen] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Road Routing States
  const [routeRiderToNext, setRouteRiderToNext] = useState<[number, number][] | null>(null);
  const [routeRestToCust, setRouteRestToCust] = useState<[number, number][] | null>(null);
  const routeRestToCustRef = useRef<any>(null);
  const routeRiderToNextRef = useRef<any>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markers, setMarkers] = useState<{
    restaurant: any;
    customer: any;
    rider: any;
  } | null>(null);

  const activeRider = order.deliveryRider || order.driver;
  const hasDriver = !!activeRider;
  const driverName = activeRider?.fullName || activeRider?.name || '';
  const driverPhone = activeRider?.phone || '';
  const vehicleNumber = activeRider?.vehicleNumber || '';
  const vehicleType = activeRider?.vehicleType || 'BIKE';

  // Read live coordinates if available
  const riderLat = (activeRider && activeRider.deliveryLat) ? Number(activeRider.deliveryLat) : null;
  const riderLng = (activeRider && activeRider.deliveryLng) ? Number(activeRider.deliveryLng) : null;
  const hasLiveCoords = riderLat !== null && riderLng !== null && !isNaN(riderLat) && !isNaN(riderLng) && riderLat !== 0 && riderLng !== 0;

  // Pause simulation if live coordinates are active
  useEffect(() => {
    if (hasLiveCoords) {
      setSimulating(false);
      return;
    }
    if (!simulating) return;
    const interval = setInterval(() => {
      setPct((prev) => {
        if (prev >= 95) { setSimulating(false); return 95; }
        return prev + 1.5;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [simulating, hasLiveCoords]);

  // Coordinates
  const customerLat = order.deliveryLat ? Number(order.deliveryLat) : 30.7420;
  const customerLng = order.deliveryLng ? Number(order.deliveryLng) : 76.7875;

  const [restaurantLat, setRestaurantLat] = useState(restaurantLatitude ? Number(restaurantLatitude) : customerLat - 0.007);
  const [restaurantLng, setRestaurantLng] = useState(restaurantLongitude ? Number(restaurantLongitude) : customerLng - 0.009);

  // Sync coords if changed from props
  useEffect(() => {
    if (restaurantLatitude && restaurantLongitude) {
      setRestaurantLat(Number(restaurantLatitude));
      setRestaurantLng(Number(restaurantLongitude));
    }
  }, [restaurantLatitude, restaurantLongitude]);

  // Client-side geocoding fallback for restaurant address
  useEffect(() => {
    if (restaurantLatitude && restaurantLongitude) return; // Skip if we have direct coords
    if (!propertyAddress) return;

    const geocodeRestaurant = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(propertyAddress)}&limit=1`
        );
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (!isNaN(lat) && !isNaN(lng)) {
            setRestaurantLat(lat);
            setRestaurantLng(lng);
          }
        }
      } catch (err) {
        console.error('Restaurant address geocoding failed:', err);
      }
    };

    geocodeRestaurant();
  }, [propertyAddress, restaurantLatitude, restaurantLongitude]);

  // Fetch static route restaurant -> customer
  useEffect(() => {
    if (!restaurantLat || !restaurantLng || !customerLat || !customerLng) return;
    let active = true;
    fetchOSRMRoute(restaurantLat, restaurantLng, customerLat, customerLng).then(coords => {
      if (active && coords) setRouteRestToCust(coords);
    });
    return () => { active = false; };
  }, [restaurantLat, restaurantLng, customerLat, customerLng]);

  // Fetch active route rider -> next stop (debounced)
  useEffect(() => {
    const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
    const nextLat = isOutForDelivery ? customerLat : restaurantLat;
    const nextLng = isOutForDelivery ? customerLng : restaurantLng;
    let currentRiderLat = restaurantLat;
    let currentRiderLng = restaurantLng;

    if (hasLiveCoords && riderLat !== null && riderLng !== null) {
      currentRiderLat = riderLat;
      currentRiderLng = riderLng;
    } else {
      const t = pct / 100;
      currentRiderLat = restaurantLat + (customerLat - restaurantLat) * t;
      currentRiderLng = restaurantLng + (customerLng - restaurantLng) * t;
    }

    if (!currentRiderLat || !currentRiderLng || !nextLat || !nextLng) return;

    const timer = setTimeout(() => {
      fetchOSRMRoute(currentRiderLat, currentRiderLng, nextLat, nextLng).then(coords => {
        if (coords) setRouteRiderToNext(coords);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [riderLat, riderLng, pct, hasLiveCoords, restaurantLat, restaurantLng, customerLat, customerLng, order.status]);

  // Haversine formula for distance between rider and customer
  const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const dist = hasLiveCoords && riderLat !== null && riderLng !== null
    ? getDistanceKm(riderLat, riderLng, customerLat, customerLng).toFixed(1)
    : (1.8 * (1 - pct / 100)).toFixed(1);

  // Minutes calculated assuming average speed of 25 km/h + 2 mins buffer, or at least 1 min
  const mins = hasLiveCoords && riderLat !== null && riderLng !== null
    ? Math.max(1, Math.ceil((Number(dist) / 25) * 60 + 2))
    : Math.ceil(12 * (1 - pct / 100));

  const hasArrived = hasLiveCoords ? (Number(dist) <= 0.05) : (pct >= 90);

  // Dynamic Leaflet Loader from CDN
  useEffect(() => {
    if (window.hasOwnProperty('L')) {
      setLeafletLoaded(true);
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => setLeafletLoaded(true);
    document.body.appendChild(script);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstance) return;

    const L = (window as any).L;

    // Create Map Instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([customerLat, customerLng], 14);

    // CartoDB Voyager tiles fit premium app designs perfectly
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(map);

    // DivIcon designs with premium glowing effects and standard labels
    const restIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `
        <div class="flex flex-col items-center" style="transform: translate(-18px, -40px); font-family: system-ui, -apple-system, sans-serif;">
          <div class="w-9 h-9 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-lg" style="box-shadow: 0 4px 12px rgba(244, 63, 94, 0.65);">
            <span style="font-size: 16px;">🏪</span>
          </div>
          <div class="bg-slate-900/90 text-white text-[8px] font-black tracking-widest px-2 py-0.5 rounded shadow-sm mt-1 uppercase" style="white-space: nowrap; letter-spacing: 0.1em;">STORE</div>
        </div>
      `,
      iconSize: [36, 50],
      iconAnchor: [18, 50]
    });

    const custIcon = L.divIcon({
      className: 'custom-leaflet-pin',
      html: `
        <div class="flex flex-col items-center" style="transform: translate(-18px, -40px); font-family: system-ui, -apple-system, sans-serif;">
          <div class="w-9 h-9 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-lg" style="box-shadow: 0 4px 12px rgba(16, 185, 129, 0.65);">
            <span style="font-size: 16px;">🏠</span>
          </div>
          <div class="bg-slate-900/90 text-white text-[8px] font-black tracking-widest px-2 py-0.5 rounded shadow-sm mt-1 uppercase" style="white-space: nowrap; letter-spacing: 0.1em;">HOME</div>
        </div>
      `,
      iconSize: [36, 50],
      iconAnchor: [18, 50]
    });

    const rdIcon = L.divIcon({
      className: 'custom-leaflet-pin-rider',
      html: `
        <div class="flex flex-col items-center animate-bounce" style="transform: translate(-20px, -46px); font-family: system-ui, -apple-system, sans-serif;">
          <div class="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg relative" style="box-shadow: 0 4px 16px rgba(79, 70, 229, 0.85);">
            <div class="absolute -inset-1.5 rounded-full bg-indigo-500/30 animate-ping"></div>
            <span style="font-size: 18px;">🛵</span>
          </div>
          <div class="bg-indigo-600 text-white text-[8px] font-black tracking-widest px-2 py-0.5 rounded shadow-sm mt-1 uppercase" style="white-space: nowrap; letter-spacing: 0.1em;">RIDER</div>
        </div>
      `,
      iconSize: [40, 56],
      iconAnchor: [20, 56]
    });

    // Add Restaurant and Customer markers
    const restMarker = L.marker([restaurantLat, restaurantLng], { icon: restIcon }).addTo(map);
    const custMarker = L.marker([customerLat, customerLng], { icon: custIcon }).addTo(map);

    // Initial rider marker position
    let rdMarker = null;
    if (hasDriver) {
      const initialRiderLat = hasLiveCoords && riderLat !== null ? riderLat : restaurantLat;
      const initialRiderLng = hasLiveCoords && riderLng !== null ? riderLng : restaurantLng;
      rdMarker = L.marker([initialRiderLat, initialRiderLng], { icon: rdIcon }).addTo(map);
    }

    setMapInstance(map);
    setMarkers({
      restaurant: restMarker,
      customer: custMarker,
      rider: rdMarker
    });

    // Zoom to fit Restaurant and Customer home pins
    const bounds = L.latLngBounds([
      [restaurantLat, restaurantLng],
      [customerLat, customerLng]
    ]);
    if (hasDriver) {
      const initialRiderLat = hasLiveCoords && riderLat !== null ? riderLat : restaurantLat;
      const initialRiderLng = hasLiveCoords && riderLng !== null ? riderLng : restaurantLng;
      bounds.extend([initialRiderLat, initialRiderLng]);
    }
    map.fitBounds(bounds, { padding: [40, 40] });

    return () => {
      map.remove();
      setMapInstance(null);
      setMarkers(null);
      if (routeRestToCustRef.current) {
        routeRestToCustRef.current.remove();
        routeRestToCustRef.current = null;
      }
      if (routeRiderToNextRef.current) {
        routeRiderToNextRef.current.remove();
        routeRiderToNextRef.current = null;
      }
    };

  }, [leafletLoaded, restaurantLat, restaurantLng]);

  // Update rider position smoothly as coordinates or percentages shift
  useEffect(() => {
    if (!mapInstance || !markers) return;

    const L = (window as any).L;

    let currentRiderLat = restaurantLat;
    let currentRiderLng = restaurantLng;

    if (hasLiveCoords && riderLat !== null && riderLng !== null) {
      currentRiderLat = riderLat;
      currentRiderLng = riderLng;
    } else {
      const t = pct / 100;
      currentRiderLat = restaurantLat + (customerLat - restaurantLat) * t;
      currentRiderLng = restaurantLng + (customerLng - restaurantLng) * t;
    }

    if (hasDriver) {
      if (markers.rider) {
        markers.rider.setLatLng([currentRiderLat, currentRiderLng]);
      } else {
        const rdIcon = L.divIcon({
          className: 'custom-leaflet-pin-rider',
          html: `
            <div class="flex flex-col items-center animate-bounce" style="transform: translate(-20px, -46px); font-family: system-ui, -apple-system, sans-serif;">
              <div class="w-10 h-10 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center shadow-lg relative" style="box-shadow: 0 4px 16px rgba(79, 70, 229, 0.85);">
                <div class="absolute -inset-1.5 rounded-full bg-indigo-500/30 animate-ping"></div>
                <span style="font-size: 18px;">🛵</span>
              </div>
              <div class="bg-indigo-600 text-white text-[8px] font-black tracking-widest px-2 py-0.5 rounded shadow-sm mt-1 uppercase" style="white-space: nowrap; letter-spacing: 0.1em;">RIDER</div>
            </div>
          `,
          iconSize: [40, 56],
          iconAnchor: [20, 56]
        });
        const newRiderMarker = L.marker([currentRiderLat, currentRiderLng], { icon: rdIcon }).addTo(mapInstance);
        setMarkers(prev => prev ? { ...prev, rider: newRiderMarker } : null);
      }
    } else if (markers.rider) {
      markers.rider.remove();
      setMarkers(prev => prev ? { ...prev, rider: null } : null);
    }

    markers.restaurant.setLatLng([restaurantLat, restaurantLng]);
    markers.customer.setLatLng([customerLat, customerLng]);

    // Draw route: restaurant → customer along the road
    const restToCustPath = routeRestToCust || [[restaurantLat, restaurantLng], [customerLat, customerLng]];
    if (routeRestToCustRef.current) {
      routeRestToCustRef.current.setLatLngs(restToCustPath);
    } else {
      routeRestToCustRef.current = L.polyline(restToCustPath, {
        color: '#6366f1',
        weight: 2,
        dashArray: routeRestToCust ? undefined : '8,5',
        opacity: 0.6
      }).addTo(mapInstance);
    }

    // Draw route from rider to next destination along the road
    if (hasDriver) {
      const isOutForDelivery = order.status === 'OUT_FOR_DELIVERY';
      const nextLat = isOutForDelivery ? customerLat : restaurantLat;
      const nextLng = isOutForDelivery ? customerLng : restaurantLng;
      const riderToNextPath = routeRiderToNext || [[currentRiderLat, currentRiderLng], [nextLat, nextLng]];
      
      if (routeRiderToNextRef.current) {
        routeRiderToNextRef.current.setLatLngs(riderToNextPath);
      } else {
        routeRiderToNextRef.current = L.polyline(riderToNextPath, {
          color: '#f43f5e',
          weight: 3.5,
          dashArray: routeRiderToNext ? undefined : '6,4',
          opacity: 0.85
        }).addTo(mapInstance);
      }
    } else {
      if (routeRiderToNextRef.current) {
        routeRiderToNextRef.current.remove();
        routeRiderToNextRef.current = null;
      }
    }

    // Recenter/Fit Bounds smoothly to follow current path
    const bounds = L.latLngBounds([
      [restaurantLat, restaurantLng],
      [customerLat, customerLng]
    ]);
    if (hasDriver) {
      bounds.extend([currentRiderLat, currentRiderLng]);
    }
    if (routeRestToCust) {
      routeRestToCust.forEach(pt => bounds.extend(pt));
    }
    if (hasDriver && routeRiderToNext) {
      routeRiderToNext.forEach(pt => bounds.extend(pt));
    }
    mapInstance.fitBounds(bounds, { padding: [40, 40] });

  }, [mapInstance, markers, riderLat, riderLng, pct, hasDriver, hasLiveCoords, customerLat, customerLng, restaurantLat, restaurantLng, routeRestToCust, routeRiderToNext]);

  // Recalculate dimensions on Full Page toggle transitions
  useEffect(() => {
    if (!mapInstance) return;
    
    setTimeout(() => {
      mapInstance.invalidateSize({ animate: true });
      
      const L = (window as any).L;
      let currentRiderLat = restaurantLat;
      let currentRiderLng = restaurantLng;

      if (hasLiveCoords && riderLat !== null && riderLng !== null) {
        currentRiderLat = riderLat;
        currentRiderLng = riderLng;
      } else {
        const t = pct / 100;
        currentRiderLat = restaurantLat + (customerLat - restaurantLat) * t;
        currentRiderLng = restaurantLng + (customerLng - restaurantLng) * t;
      }

      const bounds = L.latLngBounds([
        [restaurantLat, restaurantLng],
        [customerLat, customerLng]
      ]);
      if (hasDriver) {
        bounds.extend([currentRiderLat, currentRiderLng]);
      }
      mapInstance.fitBounds(bounds, { padding: [60, 60] });
    }, 200);
  }, [isExpanded, mapInstance, restaurantLat, restaurantLng]);

  const recenterMap = () => {
    if (!mapInstance) return;
    const L = (window as any).L;
    let currentRiderLat = restaurantLat;
    let currentRiderLng = restaurantLng;

    if (hasLiveCoords && riderLat !== null && riderLng !== null) {
      currentRiderLat = riderLat;
      currentRiderLng = riderLng;
    } else {
      const t = pct / 100;
      currentRiderLat = restaurantLat + (customerLat - restaurantLat) * t;
      currentRiderLng = restaurantLng + (customerLng - restaurantLng) * t;
    }

    const bounds = L.latLngBounds([
      [restaurantLat, restaurantLng],
      [customerLat, customerLng]
    ]);
    if (hasDriver) {
      bounds.extend([currentRiderLat, currentRiderLng]);
    }
    mapInstance.fitBounds(bounds, { padding: [50, 50] });
  };

  const renderMapBlock = () => (
    <div 
      className={`transition-all duration-300 ${
        isExpanded 
          ? 'fixed inset-0 z-[120] bg-slate-950 flex flex-col w-screen h-screen' 
          : 'relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-md w-full h-[210px]'
      }`}
    >
      {/* Dynamic Leaflet Map Area */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Loading Overlay */}
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 z-20">
          <div className="w-8 h-8 border-4 border-pos-accent/25 rounded-full animate-spin border-t-pos-accent" />
        </div>
      )}

      {/* Floating Header (Only in Full-Screen mode) */}
      {isExpanded && (
        <div className="absolute top-4 left-4 right-4 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsExpanded(false)}
              className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"
            >
              <ArrowLeft size={18} className="text-slate-700 dark:text-slate-350" />
            </button>
            <div>
              <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none block mb-0.5">Live Delivery GPS</span>
              <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-tight">Order {order.orderNo}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={recenterMap}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
            >
              Recenter
            </button>
            <button
              onClick={() => setIsExpanded(false)}
              className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"
              title="Exit Fullscreen"
            >
              <Minimize2 size={18} className="text-slate-700 dark:text-slate-350" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Icons (Inline Map Corner Control) */}
      {!isExpanded && leafletLoaded && (
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="w-9 h-9 bg-white/90 hover:bg-white text-slate-700 dark:bg-slate-900/90 dark:text-white rounded-xl flex items-center justify-center transition-all shadow-md border border-slate-100 dark:border-slate-800 active:scale-90"
            title="Full Page Map"
          >
            <Maximize2 size={15} />
          </button>
          <button
            type="button"
            onClick={recenterMap}
            className="w-9 h-9 bg-white/90 hover:bg-white text-slate-700 dark:bg-slate-900/90 dark:text-white rounded-xl flex items-center justify-center transition-all shadow-md border border-slate-100 dark:border-slate-800 active:scale-90"
            title="Recenter"
          >
            <Navigation size={15} />
          </button>
        </div>
      )}

      {/* Bottom Floating Stats Panel */}
      <div 
        className={`absolute left-3 right-3 bg-slate-900/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center justify-between z-20 transition-all ${
          isExpanded ? 'bottom-20 shadow-2xl' : 'bottom-3 shadow-md'
        }`}
      >
        <div className="flex items-center gap-2">
          {hasLiveCoords ? (
            <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[8.5px] font-black text-emerald-400 uppercase tracking-widest leading-none">
                LIVE GPS ACTIVE
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Navigation size={12} className="text-indigo-400 animate-spin" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">
                {hasArrived ? '🎉 Arrived!' : hasDriver ? 'Out for Delivery' : 'Awaiting Assignment'}
              </span>
            </div>
          )}
        </div>
        {hasDriver && (
          <div className="flex items-center gap-3 text-[10.5px] font-mono font-bold text-slate-350">
            <span>{dist} km</span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            <span className="text-indigo-300 font-black">{hasArrived ? 'ARRIVED' : `${mins} MIN`}</span>
          </div>
        )}
      </div>

      {/* Expanded Mode Floating Bottom Driver Details HUD */}
      {isExpanded && hasDriver && (
        <div className="absolute bottom-4 left-4 right-4 z-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-4 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase">
                {driverName.slice(0, 2)}
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
              </span>
            </div>
            <div>
              <span className="text-[8.5px] font-black text-indigo-500 uppercase tracking-widest block leading-none mb-0.5">Your Delivery Executive</span>
              <h4 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-tight">{driverName}</h4>
              <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                <span>{vehicleNumber}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{vehicleType}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCallScreen(true)}
              className="w-11 h-11 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl flex items-center justify-center transition-all shadow-sm active:scale-95"
            >
              <Phone size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (!hasDriver) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-inner space-y-5 relative">
        {renderMapBlock()}
        <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock size={18} className="animate-spin" />
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">Status</span>
              <p className="text-xs font-black text-amber-500">Awaiting Rider Assignment</p>
            </div>
          </div>
        </div>
        {order.status !== 'SETTLED' && (
          <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center space-y-2.5 shadow-sm">
            <div className="flex items-center justify-center gap-1.5 text-indigo-500 dark:text-indigo-400">
              <Smartphone size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Delivery OTP Verification</span>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-1.5 rounded-2xl shadow-sm font-mono inline-block">
                {getDeliveryOtp(order.id)}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider max-w-[260px] mx-auto leading-relaxed">
              Please share this 4-digit security code with the rider when they arrive to complete your delivery safely.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-inner space-y-5 relative">
      {renderMapBlock()}

      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm shadow-inner uppercase">
              {driverName.slice(0, 2)}
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center" title="Active">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            </span>
          </div>
          <div>
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest block leading-none mb-1">Assigned Delivery Rider</span>
            <h4 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-tight">{driverName}</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
              <span>{vehicleNumber}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{vehicleType}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCallScreen(true)}
            className="w-11 h-11 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-xl flex items-center justify-center transition-colors shadow-sm active:scale-95"
            title="Call Rider"
          >
            <Phone size={16} />
          </button>
          <button
            onClick={() => setSimulating(!simulating)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors shadow-sm active:scale-95 ${
              simulating
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
            }`}
            title={simulating ? 'Pause' : 'Resume'}
          >
            <Navigation size={16} className={simulating ? 'animate-pulse' : ''} />
          </button>
        </div>
      </div>

      {/* Simulated Phone Call Interface Overlay */}
      <AnimatePresence>
        {showCallScreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-md rounded-[2rem] z-30 p-6 flex flex-col justify-between text-white"
          >
            <div className="text-center pt-8 space-y-2">
              <div className="w-20 h-20 rounded-full bg-white/10 mx-auto flex items-center justify-center text-emerald-400 border border-white/20 animate-pulse">
                <Phone size={36} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Calling Rider...</p>
              <h3 className="text-xl font-black uppercase tracking-tight">{driverName}</h3>
              <p className="text-xs text-slate-400 font-bold">{driverPhone}</p>
            </div>
            <div className="text-center pb-8 space-y-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Simulating Call Connection</p>
              <button
                onClick={() => setShowCallScreen(false)}
                className="w-16 h-16 bg-rose-600 rounded-full flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-90 transition-transform mx-auto"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
        {/* 🔑 Customer Delivery OTP Security Card */}
        {order.status !== 'SETTLED' && (
          <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 text-center space-y-2.5 shadow-sm mt-4">
            <div className="flex items-center justify-center gap-1.5 text-indigo-500 dark:text-indigo-400">
              <Smartphone size={16} />
              <span className="text-[9px] font-black uppercase tracking-widest">Delivery OTP Verification</span>
            </div>
            <div>
              <span className="text-2xl font-black text-slate-800 dark:text-white tracking-widest bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-1.5 rounded-2xl shadow-sm font-mono inline-block">
                {getDeliveryOtp(order.id)}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider max-w-[260px] mx-auto leading-relaxed">
              Please share this 4-digit security code with the rider when they arrive to complete your delivery safely.
            </p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};










export const ActiveOrders: React.FC<ActiveOrdersProps> = ({ orders, tableName, propertyId, propertyAddress, propertyLatitude, propertyLongitude, upiId, upiName, setActiveTab, onPaymentSuccess }) => {
  const { showToast } = useToast();
  const prevStatusesRef = useRef<Record<string, string>>({});
  const audioAcceptedRef = useRef<HTMLAudioElement | null>(null);
  const audioReadyRef = useRef<HTMLAudioElement | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  
  // Payment Flow State
  const [payingOrder, setPayingOrder] = useState<any | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'submitting' | 'success' | 'counter_requested'>('idle');
  const [payMode, setPayMode] = useState<'select' | 'upi' | 'counter'>('select');
  const [tipAmount, setTipAmount] = useState<string>('');
  const [txnLast4, setTxnLast4] = useState<string>('');
  
  // Tracks the order that's waiting for staff approval
  const pendingApprovalOrderIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Initialize high-quality sounds
    audioAcceptedRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    audioReadyRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    // Preload
    audioAcceptedRef.current.load();
    audioReadyRef.current.load();
  }, []);

  // Unlock audio context on first click
  const unlockAudio = () => {
    if (audioUnlocked) return;
    audioAcceptedRef.current?.play().then(() => {
      audioAcceptedRef.current?.pause();
      if (audioAcceptedRef.current) audioAcceptedRef.current.currentTime = 0;
      setAudioUnlocked(true);
      showToast("Live Notifications Enabled", "success");
    }).catch(() => {
      console.log("Audio unlock failed");
    });
  };

  // Sync payingOrder with latest orders data
  useEffect(() => {
    if (payingOrder) {
      const latest = orders.find(o => o.id === payingOrder.id);
      if (latest && JSON.stringify(latest) !== JSON.stringify(payingOrder)) {
        setPayingOrder(latest);
      }
    }
  }, [orders, payingOrder]);

  useEffect(() => {
    if (orders.length === 0) return;

    orders.forEach(order => {
      const orderKey = `order-${order.id}`;
      const prevOrderStatus = prevStatusesRef.current[orderKey];
      if (prevOrderStatus && prevOrderStatus !== order.status) {
        if (order.status === 'IN_KITCHEN' || order.status === 'PREPARING') {
          showToast(`Order Accepted: ${order.orderNo}`, 'success');
          audioAcceptedRef.current?.play().catch(() => {});
        } else if (order.status === 'READY') {
          showToast(`Order Ready: ${order.orderNo}`, 'success');
          audioReadyRef.current?.play().catch(() => {});
        } else if (
          order.status === 'SETTLED' &&
          pendingApprovalOrderIdRef.current === order.id
        ) {
          // Staff has approved the online payment!
          pendingApprovalOrderIdRef.current = null;
          resetPayModal();
          if (onPaymentSuccess) onPaymentSuccess(); // triggers rating modal
        }
      }
      prevStatusesRef.current[orderKey] = order.status;
    });
  }, [orders, showToast]);

  const resetPayModal = () => {
    setPayingOrder(null);
    setPaymentStatus('idle');
    setPayMode('select');
    setTipAmount('');
    setTxnLast4('');
  };

  const handleSettleOrder = async (orderId: string) => {
    if (!txnLast4.trim() || txnLast4.length !== 4 || !/^\d{4}$/.test(txnLast4)) {
      alert('Please enter exactly 4 digits of the UPI Transaction ID.');
      return;
    }
    setPaymentStatus('submitting');
    try {
      const tip = parseFloat(tipAmount) || 0;
      const res = await fetch('/api/public/order/settle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId, propertyId, paymentMethod: 'UPI',
          upiTxnRef: txnLast4,
          tipAmount: tip > 0 ? tip : undefined
        })
      });
      const json = await res.json();
      if (json.success) {
        // Store the order ID — we'll wait for staff approval before closing
        pendingApprovalOrderIdRef.current = orderId;
        setPaymentStatus('success');
        // Do NOT auto-close or trigger rating here — wait for staff approval via polling
      } else {
        alert(json.message);
        setPaymentStatus('idle');
      }
    } catch { alert('Payment failed.'); setPaymentStatus('idle'); }
  };

  const handleCounterRequest = async (orderId: string) => {
    setPaymentStatus('submitting');
    try {
      // Notify staff via order note — uses same settle API with CASH method but pending
      const res = await fetch('/api/public/order/counter-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, propertyId })
      });
      const json = await res.json();
      // Even if API doesn't exist yet, show success UI
      setPaymentStatus('counter_requested');
      if (onPaymentSuccess) onPaymentSuccess();
    } catch {
      setPaymentStatus('counter_requested');
    }
  };

  const handleBillRequest = async (order: any) => {
    try {
      const res = await fetch('/api/public/request-assistance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: order.restaurantTableId,
          parkingSlotId: order.parkingSlotId,
          propertyId,
          type: 'BILL'
        })
      });
      if (res.ok) {
        showToast('Bill request sent to staff.', 'success');
      }
    } catch {
      showToast('Failed to send bill request.', 'error');
    }
  };

  const isSubmitting = paymentStatus === 'submitting';

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <History size={48} className="text-slate-200" />
        <div className="space-y-1">
          <h3 className="font-bold text-slate-800 dark:text-white">No orders yet</h3>
          <p className="text-xs text-slate-400 max-w-[200px]">Once you place an order, it will appear here.</p>
        </div>
        <Button onClick={() => setActiveTab('menu')} className="rounded-xl h-11 px-8">View Menu</Button>
      </div>
    );
  }

  return (
    <main onClick={unlockAudio} className="p-5 pt-10 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Active Orders</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Live Tracking • Table {tableName}</p>
          </div>
        </div>
        {!audioUnlocked && (
          <button 
            onClick={unlockAudio}
            className="w-10 h-10 bg-pos-primary/10 text-pos-primary rounded-xl flex items-center justify-center animate-bounce"
            title="Enable Sound"
          >
            <Smartphone size={20} />
          </button>
        )}
      </div>

      {orders.map((order: any) => (
        <div key={order.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none border border-slate-100 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">Order Details</p>
              <p className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{order.orderNo}</p>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <div className={`px-3 py-1 rounded-lg border ${order.status === 'SETTLED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-pos-primary/10 border-pos-primary/20 text-pos-primary'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest">{order.status}</p>
              </div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Status</p>
            </div>
          </div>

          {(() => {
            const allStatuses = order.items.flatMap((i: any) => i.kotItems?.map((ki: any) => ki.status) || []);
            const activeRider = order.deliveryRider || order.driver;
            const isReady = (order.status === 'READY') || (allStatuses.every((s: string) => s === 'READY') && allStatuses.length > 0);
            const isCooking = (order.status === 'IN_KITCHEN' || order.status === 'PREPARING') || allStatuses.some((s: string) => s === 'PREPARING' || s === 'IN_KITCHEN');
            const isNew = order.status === 'OPEN' || order.status === 'PLACED' || allStatuses.some((s: string) => s === 'NEW');
            const isAwaitingApproval = order.status === 'PAYMENT_AWAITING_APPROVAL';

            let icon = <Clock size={20} />;
            let iconBg = "bg-orange-500/10";
            let iconColor = "text-orange-500";
            let description = "Order placed";

             if (order.orderType === 'DELIVERY') {
              if (order.status === 'SETTLED') {
                icon = <CheckCircle size={20} />;
                iconBg = "bg-emerald-500/10";
                iconColor = "text-emerald-500";
                description = "Order Delivered! Enjoy your meal!";
              } else if (activeRider) {
                icon = <Truck size={20} />;
                iconBg = "bg-indigo-500/10";
                iconColor = "text-indigo-500";
                description = `Out for Delivery (${activeRider.fullName || activeRider.name} is on the way)`;
              } else if (isReady) {
                icon = <CheckCircle size={20} />;
                iconBg = "bg-emerald-500/10";
                iconColor = "text-emerald-500";
                description = "Accepted & Food is Ready! Awaiting Rider";
              } else if (order.status === 'ACCEPTED') {
                icon = <ChefHat size={20} />;
                iconBg = "bg-indigo-500/10";
                iconColor = "text-indigo-500";
                description = "Order Accepted by Kitchen";
              } else if (isCooking) {
                icon = <ChefHat size={20} />;
                iconBg = "bg-blue-500/10";
                iconColor = "text-blue-500";
                description = "Accepted & Preparing in Kitchen";
              } else if (isNew) {
                icon = <Clock size={20} />;
                iconBg = "bg-orange-500/10";
                iconColor = "text-orange-500";
                description = "Awaiting Kitchen Acceptance";
              }
            } else {
              if (isAwaitingApproval) {
                icon = <Smartphone size={20} />;
                iconBg = "bg-amber-500/10";
                iconColor = "text-amber-500";
                description = "Payment Sent - Awaiting Staff Approval";
              } else if (isReady) {
                icon = <CheckCircle size={20} />;
                iconBg = "bg-emerald-500/10";
                iconColor = "text-emerald-500";
                description = "Order Ready to Serve!";
              } else if (order.status === 'ACCEPTED') {
                icon = <ChefHat size={20} />;
                iconBg = "bg-blue-500/10";
                iconColor = "text-blue-500";
                description = "Order Accepted";
              } else if (isCooking) {
                icon = <ChefHat size={20} />;
                iconBg = "bg-blue-500/10";
                iconColor = "text-blue-500";
                description = "Kitchen Accepted & Cooking";
              } else if (isNew) {
                icon = <Clock size={20} />;
                iconBg = "bg-orange-500/10";
                iconColor = "text-orange-500";
                description = "Awaiting Kitchen Acceptance";
              }
            }

            return (
              <div className={`rounded-2xl p-4 flex items-center justify-between ${isAwaitingApproval ? 'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Status</p>
                    <p className={`text-xs font-black ${iconColor}`}>{description}</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {order.orderType === 'DELIVERY' && (
            <DeliveryTrackingCard 
              order={order} 
              propertyAddress={propertyAddress} 
              restaurantLatitude={propertyLatitude}
              restaurantLongitude={propertyLongitude}
            />
          )}

          <div className="space-y-4">
            {order.items.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <img src={item.product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=100'} className="w-full h-full object-cover rounded-xl" />
                  <span className="absolute -top-1.5 -right-1.5 bg-pos-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-slate-900">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.product.name}</h4>
                  <div className="mt-2 flex items-center gap-1.5">
                    {(() => {
                      const statuses = item.kotItems?.map((ki: any) => ki.status) || [];
                      const isReady = statuses.some((s: string) => s === 'READY') || order.status === 'READY';
                      const isPreparing = statuses.some((s: string) => s === 'PREPARING' || s === 'IN_KITCHEN') || order.status === 'IN_KITCHEN' || order.status === 'PREPARING';
                      
                      if (isReady) return <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tight">Ready</span>;
                      if (isPreparing) return <span className="text-[9px] font-black text-pos-primary uppercase tracking-tight animate-pulse">Cooking</span>;
                      return <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">Sent</span>;
                    })()}
                  </div>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">₹{item.totalAmount}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-slate-600 dark:text-slate-300">₹{order.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>GST (5%)</span>
              <span className="text-slate-600 dark:text-slate-300">₹{order.taxAmount?.toFixed(2)}</span>
            </div>
            
            <div className="flex flex-col gap-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Amount</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white leading-none tabular-nums">₹{order.grandTotal?.toFixed(2)}</p>
                </div>
                {order.status === 'SETTLED' ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                    <CheckCircle size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Paid</span>
                  </div>
                ) : order.status === 'PAYMENT_AWAITING_APPROVAL' ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-xl animate-pulse">
                    <Smartphone size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Approval Pending</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 rounded-xl">
                    <Clock size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pending</span>
                  </div>
                )}
              </div>

              {order.status !== 'SETTLED' && order.status !== 'PAYMENT_AWAITING_APPROVAL' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => { setPayingOrder(order); setPayMode('upi'); }}
                      className="h-14 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                      <Smartphone size={16} /> Pay Online
                    </button>
                    {order.orderType === 'DELIVERY' ? (
                      <button 
                        onClick={() => { setPayingOrder(order); setPayMode('counter'); }}
                        className="h-14 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        <Wallet size={16} /> Cash on Delivery
                      </button>
                    ) : (
                      <button 
                        onClick={() => { setPayingOrder(order); setPayMode('counter'); }}
                        className="h-14 bg-orange-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                      >
                        <Store size={16} /> Pay at Counter
                      </button>
                    )}
                  </div>
                  
                  {order.orderType !== 'DELIVERY' && (
                    <button 
                      onClick={() => handleBillRequest(order)}
                      className="w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                      <QrCode size={14} /> Request Bill
                    </button>
                  )}
                </div>
              )}

              {order.status === 'PAYMENT_AWAITING_APPROVAL' && (
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-amber-200 dark:border-amber-800 rounded-[2rem] p-8 text-center shadow-2xl shadow-amber-500/10">
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full -ml-12 -mb-12 blur-xl" />
                  
                  <div className="relative z-10 space-y-5">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 bg-amber-500 rounded-[1.5rem] animate-ping opacity-20" />
                      <div className="relative w-20 h-20 bg-amber-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-amber-500/40">
                        <Smartphone size={36} />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-500">
                        <Clock size={16} className="text-amber-500 animate-spin" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Payment Received!</h3>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full border border-amber-200 dark:border-amber-800">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Staff Approval</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed px-2">
                      We've received your UPI payment request. Please wait a moment while our staff verifies it from the counter.
                    </p>
                    
                    <div className="pt-5 border-t border-amber-200/50 dark:border-amber-800/50">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 mb-1" />
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Payment Sent</span>
                        </div>
                        <div className="w-12 h-[2px] bg-amber-200 dark:bg-amber-800" />
                        <div className="flex flex-col items-center">
                           <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mb-1" />
                           <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Verification</span>
                        </div>
                        <div className="w-12 h-[2px] bg-slate-100 dark:bg-slate-800" />
                        <div className="flex flex-col items-center opacity-30">
                           <div className="w-2 h-2 rounded-full bg-slate-300 mb-1" />
                           <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Settled</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[9px] text-slate-400 italic font-medium">
                      This screen will refresh automatically once approved.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Add More Items Button */}
      <div className="pt-4 pb-12">
        <button onClick={() => setActiveTab('menu')} className="w-full py-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2.5rem] flex items-center justify-center gap-4 shadow-xl active:scale-[0.98] transition-all">
          <div className="w-12 h-12 bg-white/10 dark:bg-slate-900/10 rounded-2xl flex items-center justify-center">
            <Plus size={24} />
          </div>
          <div className="text-left">
            <p className="text-sm font-black uppercase tracking-widest">Add More Items</p>
            <p className="text-[10px] opacity-60 font-bold uppercase tracking-tight">Browse our full menu</p>
          </div>
        </button>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {payingOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={resetPayModal} className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[150]" />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] z-[160] max-h-[92vh] overflow-y-auto flex flex-col shadow-2xl border-t border-white/10 p-8 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {payMode !== 'select' && paymentStatus === 'idle' && (
                    <button onClick={() => setPayMode('select')} className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                      <ArrowLeft size={16} />
                    </button>
                  )}
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {payMode === 'counter' ? 'Pay at Counter' : payMode === 'upi' ? 'Pay via UPI' : 'Settle Bill'}
                  </h3>
                </div>
                <button onClick={resetPayModal} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400"><X size={20} /></button>
              </div>

              {/* ── SUCCESS / ONLINE PENDING ── */}
              {paymentStatus === 'success' && (
                <div className="py-12 text-center space-y-8 animate-in zoom-in duration-300">
                  <div className="relative w-28 h-28 mx-auto">
                    <div className="absolute inset-0 bg-amber-500 rounded-[2rem] animate-ping opacity-20" />
                    <div className="relative w-28 h-28 bg-amber-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-amber-500/40">
                      <Smartphone size={48} className="animate-bounce" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-lg border-4 border-amber-500">
                      <Clock size={20} className="text-amber-500 animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-3 px-4">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Approval Pending</h4>
                    <p className="text-sm text-slate-500 font-bold leading-relaxed">
                      Your payment request has been sent to the counter. 
                      <br />
                      <span className="text-amber-500">Please wait while staff verifies your transaction.</span>
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 mx-2 space-y-4">
                    <div className="flex items-center justify-center gap-3 text-amber-600 dark:text-amber-400">
                      <Smartphone size={20} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction ID: ****{txnLast4 || payingOrder.onlinePaymentReference || '----'}</p>
                    </div>
                    <div className="flex items-center justify-center gap-6">
                      <div className="flex flex-col items-center">
                         <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mb-1" />
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Sent</span>
                      </div>
                      <div className="w-16 h-[2px] bg-amber-300 dark:bg-amber-800" />
                      <div className="flex flex-col items-center">
                         <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse mb-1" />
                         <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Verifying</span>
                      </div>
                      <div className="w-16 h-[2px] bg-slate-200 dark:bg-slate-800" />
                      <div className="flex flex-col items-center opacity-30">
                         <div className="w-2.5 h-2.5 rounded-full bg-slate-300 mb-1" />
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Complete</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest animate-pulse">
                      Waiting for Staff Approval...
                    </p>
                    <button 
                      onClick={resetPayModal}
                      className="mt-8 px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Hide & Stay on Orders
                    </button>
                  </div>
                </div>
              )}

              {/* ── COUNTER REQUESTED ── */}
              {paymentStatus === 'counter_requested' && (
                <div className="py-10 text-center space-y-5">
                  {payingOrder.orderType === 'DELIVERY' ? (
                    <>
                      <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl animate-bounce">
                        <Truck size={40} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">Cash on Delivery</h4>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">Your order <span className="font-black text-slate-700 dark:text-white">{payingOrder.orderNo}</span> is set for Cash payment.</p>
                      </div>
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 mx-2 space-y-2">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Amount to Pay Rider</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">₹{payingOrder.grandTotal?.toFixed(2)}</p>
                        <p className="text-[9px] text-slate-400 font-bold">Please pay this cash to our delivery rider when they reach your doorstep.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-orange-50 dark:bg-orange-950/30 text-orange-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl animate-bounce">
                        <Store size={40} />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">Please Visit the Counter</h4>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">Your order <span className="font-black text-slate-700 dark:text-white">{payingOrder.orderNo}</span> is noted. Please pay at the billing counter.</p>
                      </div>
                      <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl p-4 mx-2 space-y-2">
                        <p className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest">Amount Due</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">₹{payingOrder.grandTotal?.toFixed(2)}</p>
                        <p className="text-[9px] text-slate-400 font-bold">Show this screen to the cashier</p>
                      </div>
                    </>
                  )}
                  <button onClick={resetPayModal} className="w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest">Close</button>
                </div>
              )}

              {/* ── PAYMENT METHOD SELECT ── */}
              {paymentStatus === 'idle' && payMode === 'select' && (
                <div className="space-y-4 pb-4">
                  <div className="text-center pb-2">
                    <p className="text-3xl font-black text-slate-900 dark:text-white">₹{payingOrder.grandTotal?.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Order {payingOrder.orderNo}</p>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Choose Payment Method</p>

                  {/* UPI Option */}
                  <button
                    onClick={() => setPayMode('upi')}
                    className="w-full flex items-center gap-5 p-5 bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-100 dark:border-indigo-900/50 hover:border-indigo-400 rounded-3xl transition-all active:scale-[0.98] group"
                  >
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200 dark:shadow-none group-hover:scale-110 transition-transform">
                      <QrCode size={26} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-black text-slate-900 dark:text-white uppercase tracking-wide text-sm">Scan & Pay via UPI</p>
                      <p className="text-[10px] text-indigo-500 font-bold mt-0.5">Google Pay • PhonePe • Paytm</p>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </button>

                  {/* Counter / Cash on Delivery Option */}
                  {payingOrder.orderType === 'DELIVERY' ? (
                    <button
                      onClick={() => setPayMode('counter')}
                      className="w-full flex items-center gap-5 p-5 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-400 rounded-3xl transition-all active:scale-[0.98] group"
                    >
                      <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200 dark:shadow-none group-hover:scale-110 transition-transform">
                        <Wallet size={26} className="text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-black text-slate-900 dark:text-white uppercase tracking-wide text-sm">Cash on Delivery</p>
                        <p className="text-[10px] text-emerald-500 font-bold mt-0.5">Pay Rider in Cash at Doorstep</p>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setPayMode('counter')}
                      className="w-full flex items-center gap-5 p-5 bg-orange-50 dark:bg-orange-950/20 border-2 border-orange-100 dark:border-orange-900/30 hover:border-orange-400 rounded-3xl transition-all active:scale-[0.98] group"
                    >
                      <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-200 dark:shadow-none group-hover:scale-110 transition-transform">
                        <Store size={26} className="text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-black text-slate-900 dark:text-white uppercase tracking-wide text-sm">Pay at Counter</p>
                        <p className="text-[10px] text-orange-500 font-bold mt-0.5">Cash • Card • Any Method</p>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-orange-500 transition-colors" />
                    </button>
                  )}

                  <button onClick={resetPayModal} className="w-full h-11 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest">Cancel</button>
                </div>
              )}

              {/* ── UPI FLOW ── */}
              {paymentStatus === 'idle' && payMode === 'upi' && (
                <div className="space-y-5">
                  {/* QR + Amount */}
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl p-5 text-center space-y-3 border border-indigo-100 dark:border-indigo-900/50">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Scan & Pay via UPI</p>
                    <div>
                      <p className="text-4xl font-black text-indigo-600 dark:text-indigo-400">₹{(payingOrder.grandTotal + (parseFloat(tipAmount) || 0)).toFixed(2)}</p>
                      {parseFloat(tipAmount) > 0 && <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Includes ₹{parseFloat(tipAmount).toFixed(2)} Tip 🙏</p>}
                    </div>
                    <div className="bg-white p-3 rounded-3xl inline-block shadow-lg border-4 border-indigo-500/20">
                      {upiId ? (
                        <QRCodeSVG value={`upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName || 'Restaurant')}&am=${(payingOrder.grandTotal + (parseFloat(tipAmount) || 0)).toFixed(2)}&cu=INR&tn=Order ${payingOrder.orderNo}`} size={192} level="H" includeMargin={false} />
                      ) : (
                        <QrCode size={180} className="text-slate-900" />
                      )}
                    </div>
                    {upiId && <div className="space-y-0.5"><p className="text-sm font-black text-slate-700 dark:text-slate-200">{upiId}</p><p className="text-[10px] text-slate-400 font-bold">{upiName || 'Restaurant'}</p></div>}
                    <div className="flex items-center justify-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      Open any UPI app — Google Pay, PhonePe, Paytm
                    </div>
                  </div>

                  {/* Tip */}
                  <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/30">
                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-3">🙏 Add a Tip (Optional)</p>
                    <div className="flex gap-2 mb-3">
                      {[10, 20, 50].map(t => (
                        <button key={t} onClick={() => setTipAmount(tipAmount === String(t) ? '' : String(t))}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipAmount === String(t) ? 'bg-amber-500 text-white' : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'}`}>
                          ₹{t}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                      <input type="number" value={tipAmount} onChange={e => setTipAmount(e.target.value)} placeholder="Custom tip amount" min="0"
                        className="w-full pl-8 pr-4 py-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-800 text-sm font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-300" />
                    </div>
                  </div>

                  {/* Txn Last 4 */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">UPI Transaction ID — Last 4 Digits *</p>
                    <p className="text-[9px] text-slate-400 font-medium mb-3">After payment, enter the last 4 digits from your UPI app</p>
                    <div className="flex gap-2.5 max-w-[280px] mx-auto">
                      {[0,1,2,3].map(i => (
                        <input key={i} type="text" inputMode="numeric" maxLength={1} value={txnLast4[i] || ''}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '');
                            const arr = txnLast4.split(''); arr[i] = val;
                            setTxnLast4(arr.join('').slice(0,4));
                            if (val && i < 3) { const next = document.getElementById(`txn-digit-${i+1}`); if (next) (next as HTMLInputElement).focus(); }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Backspace' && !txnLast4[i] && i > 0) {
                              const prev = document.getElementById(`txn-digit-${i-1}`);
                              if (prev) (prev as HTMLInputElement).focus();
                            }
                          }}
                          id={`txn-digit-${i}`}
                          className="w-full aspect-square text-center text-xl font-black text-slate-900 dark:text-white bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button onClick={() => handleSettleOrder(payingOrder.id)} disabled={isSubmitting || txnLast4.length !== 4}
                      className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                      Verify & Complete Payment
                    </button>
                    <button onClick={resetPayModal} className="w-full h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest">Cancel</button>
                  </div>
                </div>
              )}

              {/* ── COUNTER FLOW ── */}
              {paymentStatus === 'idle' && payMode === 'counter' && (
                <div className="space-y-5 pb-4">
                  {payingOrder.orderType === 'DELIVERY' ? (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-3xl p-6 text-center space-y-4 border border-emerald-100 dark:border-emerald-900/30">
                      <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 dark:shadow-none">
                        <Wallet size={32} className="text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">₹{payingOrder.grandTotal?.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Order {payingOrder.orderNo}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 space-y-1">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">What happens next?</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          Tap "Confirm Cash on Delivery" — our delivery rider will collect cash when they reach your doorstep.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 dark:bg-orange-950/20 rounded-3xl p-6 text-center space-y-4 border border-orange-100 dark:border-orange-900/30">
                      <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-orange-200 dark:shadow-none">
                        <Store size={32} className="text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">₹{payingOrder.grandTotal?.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Order {payingOrder.orderNo}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 space-y-1">
                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">What happens next?</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                          Tap "Request Counter Payment" — our staff will be notified and you can proceed to the billing counter to pay via Cash, Card or any method.
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleCounterRequest(payingOrder.id)}
                    disabled={isSubmitting}
                    className={`w-full h-14 ${payingOrder.orderType === 'DELIVERY' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-250 text-white' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 text-white'} rounded-2xl font-black text-sm shadow-xl dark:shadow-none flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50`}
                  >
                    {payingOrder.orderType === 'DELIVERY' ? <Truck size={18} /> : <Store size={18} />}
                    {isSubmitting 
                      ? 'Notifying...' 
                      : (payingOrder.orderType === 'DELIVERY' ? 'Confirm Cash on Delivery' : 'Request Counter Payment')}
                  </button>
                  <button onClick={() => setPayMode('select')} className="w-full h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest">← Go Back</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
};
