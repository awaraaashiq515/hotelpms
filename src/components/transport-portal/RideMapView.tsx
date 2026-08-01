'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navigation, Car, IndianRupee, Loader2 } from 'lucide-react';

interface RideMapViewProps {
  fromLocation: string;
  toLocation: string;
  perKmRate?: number;
  baseFare?: number;
  vehicleType?: string;
  driverName?: string;
  driverPhone?: string;
  status?: string;
  onDistanceCalculated?: (distanceKm: number, calculatedFare: number) => void;
}

export function RideMapView({
  fromLocation,
  toLocation,
  perKmRate = 15,
  baseFare = 50,
  vehicleType = 'CAR',
  driverName,
  driverPhone,
  status = 'PENDING',
  onDistanceCalculated,
}: RideMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletInstance = useRef<any>(null);

  const [loading, setLoading] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number>(68.5);
  const [routeGeometry, setRouteGeometry] = useState<any[]>([]);
  const [coords, setCoords] = useState<{
    pickup: { lat: number; lng: number };
    drop: { lat: number; lng: number };
  }>({
    pickup: { lat: 31.7084, lng: 76.9318 }, // Mandi
    drop: { lat: 31.9579, lng: 77.1095 },   // Kullu
  });

  const estimatedFare = Math.round(baseFare + distanceKm * perKmRate);

  useEffect(() => {
    if (onDistanceCalculated) {
      onDistanceCalculated(distanceKm, estimatedFare);
    }
  }, [distanceKm, estimatedFare]);

  // Fetch exact Google Maps accurate driving distance & route geometry from server API
  useEffect(() => {
    let isMounted = true;
    const fetchDistanceData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/transport/distance?from=${encodeURIComponent(fromLocation)}&to=${encodeURIComponent(toLocation)}`
        );
        const data = await res.json();
        if (data.success && isMounted) {
          setDistanceKm(data.distanceKm);
          if (data.coords?.pickup) {
            setCoords(data.coords);
          }
          if (Array.isArray(data.routeGeometry) && data.routeGeometry.length > 0) {
            setRouteGeometry(data.routeGeometry);
          } else {
            setRouteGeometry([]);
          }
        }
      } catch (err) {
        console.error('[Distance API Error]:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (fromLocation && toLocation) {
      fetchDistanceData();
    }

    return () => {
      isMounted = false;
    };
  }, [fromLocation, toLocation]);

  // Render Leaflet Map with Google Dark Mode style
  useEffect(() => {
    if (!mapRef.current) return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const loadMap = async () => {
      if (!(window as any).L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.body.appendChild(script);
        });
      }

      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }

      const map = L.map(mapRef.current, {
        center: [coords.pickup.lat, coords.pickup.lng],
        zoom: 11,
        zoomControl: false,
        attributionControl: false,
      });

      leafletInstance.current = map;

      // Google Dark Mode style CartoDB tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Pickup Green Pin
      const pickupIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background:#22c55e; width:18px; height:18px; border-radius:50%; border:3px solid white; box-shadow:0 0 12px rgba(34,197,94,0.9);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      // Dropoff Red Pin
      const dropIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background:#ef4444; width:18px; height:18px; border-radius:50%; border:3px solid white; box-shadow:0 0 12px rgba(239,68,68,0.9);"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      // Add Pins
      const mP = L.marker([coords.pickup.lat, coords.pickup.lng], { icon: pickupIcon }).addTo(map);
      mP.bindTooltip(`<b>Pickup:</b> ${fromLocation}`, { permanent: true, direction: 'top', className: 'map-label-green' });

      const mD = L.marker([coords.drop.lat, coords.drop.lng], { icon: dropIcon }).addTo(map);
      mD.bindTooltip(`<b>Drop:</b> ${toLocation}`, { permanent: true, direction: 'bottom', className: 'map-label-red' });

      // Draw Route Polyline
      const lineCoords = routeGeometry.length > 0
        ? routeGeometry
        : [
            [coords.pickup.lat, coords.pickup.lng],
            [coords.drop.lat, coords.drop.lng],
          ];

      const polyline = L.polyline(lineCoords, {
        color: '#3b82f6',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
      }).addTo(map);

      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    };

    loadMap();

    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove();
        leafletInstance.current = null;
      }
    };
  }, [coords, routeGeometry, fromLocation, toLocation]);

  return (
    <div className="space-y-3">
      {/* Google Dark Mode Style Map Card */}
      <div className="relative w-full h-64 rounded-3xl bg-[#070d18] border border-slate-800 overflow-hidden shadow-2xl">
        <div ref={mapRef} className="w-full h-full z-0" />

        {loading && (
          <div className="absolute top-3 left-3 z-20 bg-slate-900/90 border border-blue-500/30 text-blue-400 text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-md">
            <Loader2 size={12} className="animate-spin" />
            Fetching Google Distance & Route...
          </div>
        )}

        {/* Real Google Maps Driving Distance Badge */}
        <div className="absolute top-3 right-3 z-20 bg-[#0c1525]/90 border border-blue-500/40 rounded-2xl px-3 py-1.5 backdrop-blur-md flex items-center gap-2 shadow-lg">
          <Navigation size={12} className="text-blue-400" />
          <span className="text-xs font-black text-white">{distanceKm} KM</span>
        </div>
      </div>

      {/* Rapido / Uber Style Calculated Fare Card */}
      <div className="bg-gradient-to-br from-[#0c1525] to-[#080d19] border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <IndianRupee size={16} />
            </div>
            <div>
              <p className="text-xs font-black text-white">Estimated Fare Calculation</p>
              <p className="text-[10px] text-slate-500">Google Maps Driving Distance • ₹{perKmRate}/km</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-green-400">₹{estimatedFare}</p>
            <p className="text-[9px] text-slate-500 font-bold">{distanceKm} km total</p>
          </div>
        </div>

        {/* Fare Breakdown grid */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/80">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2">
            <span className="text-[9px] font-black text-slate-500 block uppercase">Base Fee</span>
            <span className="text-xs font-black text-white">₹{baseFare}</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2">
            <span className="text-[9px] font-black text-blue-400 block uppercase">Per KM Rate</span>
            <span className="text-xs font-black text-blue-400">₹{perKmRate}/km</span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2">
            <span className="text-[9px] font-black text-green-400 block uppercase">Calculated Total</span>
            <span className="text-xs font-black text-green-400">₹{estimatedFare}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
