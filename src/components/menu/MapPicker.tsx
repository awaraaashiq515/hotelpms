import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Search, Check, Maximize2, X, ArrowLeft } from 'lucide-react';

interface MapPickerProps {
  onAddressSelect: (address: string, lat: number, lng: number) => void;
  initialAddress?: string;
  deliveryRadius?: number; // Optional radius in km
}

export const MapPicker: React.FC<MapPickerProps> = ({ onAddressSelect, initialAddress = '', deliveryRadius }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<any>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerInstance, setMarkerInstance] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Manage Radius Circle dynamically
  useEffect(() => {
    if (!leafletLoaded || !mapInstance || !coordinates) return;

    const L = (window as any).L;
    if (!L) return;

    if (deliveryRadius === undefined) {
      if (circleRef.current) {
        mapInstance.removeLayer(circleRef.current);
        circleRef.current = null;
      }
      return;
    }

    if (circleRef.current) {
      // Update existing circle's center and radius
      circleRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      circleRef.current.setRadius(deliveryRadius * 1000);
    } else {
      // Draw new circle representing the coverage zone
      circleRef.current = L.circle([coordinates.lat, coordinates.lng], {
        color: '#e11d48', // premium rose-600 color
        fillColor: '#e11d48',
        fillOpacity: 0.12,
        radius: deliveryRadius * 1000,
        weight: 1.5,
      }).addTo(mapInstance);
    }
  }, [leafletLoaded, mapInstance, coordinates, deliveryRadius]);

  // Load Leaflet dynamically from CDN
  useEffect(() => {
    if (window.hasOwnProperty('L')) {
      setLeafletLoaded(true);
      return;
    }

    // Link tag for CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Script tag for JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.body.appendChild(script);

    return () => {
      // Clean up tags optionally, but keeping them active is usually fine
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstance) return;

    const L = (window as any).L;
    
    // Default location: New Delhi (can be overridden by user location)
    const defaultLat = 28.6139;
    const defaultLng = 77.2090;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([defaultLat, defaultLng], 13);

    // Native Google Maps road layer tiles showing shops, names, and landmarks properly
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20
    }).addTo(map);

    // Custom glowing marker icon
    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="w-8 h-8 bg-indigo-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg transform -translate-y-2 animate-bounce">
              <div class="w-2.5 h-2.5 bg-white rounded-full"></div>
            </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const marker = L.marker([defaultLat, defaultLng], {
      draggable: true,
      icon: customIcon
    }).addTo(map);

    setMapInstance(map);
    setMarkerInstance(marker);
    setCoordinates({ lat: defaultLat, lng: defaultLng });

    // Handle Drag End event
    marker.on('dragend', async () => {
      const position = marker.getLatLng();
      setCoordinates({ lat: position.lat, lng: position.lng });
      await reverseGeocode(position.lat, position.lng);
    });

    // Handle Click Map event to place pin
    map.on('click', async (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setCoordinates({ lat, lng });
      await reverseGeocode(lat, lng);
    });

    // Attempt to locate user on start
    locateUser(map, marker);

  }, [leafletLoaded]);

  // Recalculate dimensions on Full Page toggle transitions
  useEffect(() => {
    if (!mapInstance) return;
    
    setTimeout(() => {
      mapInstance.invalidateSize({ animate: true });
      if (coordinates) {
        mapInstance.setView([coordinates.lat, coordinates.lng], 16);
      }
    }, 200);
  }, [isExpanded, mapInstance]);

  // Reverse Geocoding via Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      if (data && data.display_name) {
        const cleanAddress = data.display_name;
        setSelectedAddress(cleanAddress);
        onAddressSelect(cleanAddress, lat, lng);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  // Locate User via IP Geolocation fallback
  const locateUserByIP = async (targetMap = mapInstance, targetMarker = markerInstance) => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('IP geolocation request failed');
      const data = await response.json();
      if (data && data.latitude && data.longitude) {
        const L = (window as any).L;
        if (!L || !targetMap || !targetMarker) return;
        const latLng = new L.LatLng(data.latitude, data.longitude);
        
        targetMap.setView(latLng, 16);
        targetMarker.setLatLng(latLng);
        setCoordinates({ lat: data.latitude, lng: data.longitude });
        
        const cleanAddress = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
        if (cleanAddress) {
          setSelectedAddress(cleanAddress);
          onAddressSelect(cleanAddress, data.latitude, data.longitude);
        } else {
          await reverseGeocode(data.latitude, data.longitude);
        }
      }
    } catch (error) {
      console.error('IP Geolocation error:', error);
    }
  };

  // Locate User GPS
  const locateUser = (targetMap = mapInstance, targetMarker = markerInstance) => {
    if (!targetMap || !targetMarker) return;
    
    setLoading(true);
    if (!navigator.geolocation) {
      locateUserByIP(targetMap, targetMarker).finally(() => setLoading(false));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const L = (window as any).L;
        const latLng = new L.LatLng(latitude, longitude);
        
        targetMap.setView(latLng, 16);
        targetMarker.setLatLng(latLng);
        setCoordinates({ lat: latitude, lng: longitude });
        
        await reverseGeocode(latitude, longitude);
        setLoading(false);
      },
      async (error) => {
        console.error('GPS error, falling back to IP Geolocation:', error);
        await locateUserByIP(targetMap, targetMarker);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Search Address
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || !mapInstance || !markerInstance) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);
        const L = (window as any).L;
        const latLng = new L.LatLng(latitude, longitude);

        mapInstance.setView(latLng, 16);
        markerInstance.setLatLng(latLng);
        setCoordinates({ lat: latitude, lng: longitude });
        setSelectedAddress(display_name);
        onAddressSelect(display_name, latitude, longitude);
      } else {
        alert('Address not found. Please try a different query.');
      }
    } catch (error) {
      console.error('Search geocoding error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full bg-slate-50 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/60 shadow-inner">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-450 flex items-center gap-1.5">
          <MapPin size={14} className="text-pos-accent" />
          Select Delivery Location
        </label>
        <button
          type="button"
          onClick={() => locateUser()}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-pos-accent/15 hover:bg-pos-accent/25 active:scale-95 text-pos-accent text-[10px] font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
        >
          <Navigation size={12} className={loading ? 'animate-spin' : ''} />
          Locate Me
        </button>
      </div>

      {/* Address Search Field (Only in standard mode) */}
      {!isExpanded && (
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search sector, colony, landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
              className="w-full h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-pos-accent transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearchSubmit()}
            disabled={loading || !searchQuery.trim()}
            className="h-11 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            Search
          </button>
        </div>
      )}

      {/* Interactive Map Area Wrapper */}
      <div 
        className={`transition-all duration-300 ${
          isExpanded 
            ? 'fixed inset-0 z-[150] bg-slate-950 flex flex-col w-screen h-screen' 
            : 'relative w-full h-[180px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm'
        }`}
      >
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Loading Overlay */}
        {!leafletLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-900 z-20">
            <div className="w-8 h-8 border-4 border-pos-accent/20 rounded-full animate-spin border-t-pos-accent"></div>
          </div>
        )}

        {/* Floating Toggle Icon & Locate (Standard Inline Mode) */}
        {!isExpanded && leafletLoaded && (
          <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="w-9 h-9 bg-white/90 hover:bg-white text-slate-700 dark:bg-slate-900/90 dark:text-white rounded-xl flex items-center justify-center transition-all shadow-md border border-slate-100 dark:border-slate-800 active:scale-90"
              title="Fullscreen Map"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        )}

        {/* Floating Header (Only in Full-Screen mode) */}
        {isExpanded && (
          <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-3">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 py-4 rounded-[2rem] border border-slate-100 dark:border-slate-850 shadow-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <ArrowLeft size={18} className="text-slate-700 dark:text-slate-350" />
                </button>
                <div>
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none block mb-0.5">Map Location Picker</span>
                  <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-tight">Pin Delivery Spot</h3>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => locateUser()}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Locate Me
                </button>
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"
                  title="Close Fullscreen"
                >
                  <X size={18} className="text-slate-700 dark:text-slate-350" />
                </button>
              </div>
            </div>

            {/* Float Search inside Fullscreen */}
            <div className="relative flex gap-2 w-full px-1">
              <div className="relative flex-1 shadow-xl rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sector, colony, landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit();
                    }
                  }}
                  className="w-full h-12 pl-11 pr-4 text-xs font-bold text-slate-900 dark:text-white bg-transparent outline-none transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSearchSubmit()}
                disabled={loading || !searchQuery.trim()}
                className="h-12 px-6 bg-pos-accent text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-pos-accent/90 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                Search
              </button>
            </div>
          </div>
        )}

        {/* Floating Bottom Panel (Only in Full-Screen mode) */}
        {isExpanded && (
          <div className="absolute bottom-6 left-4 right-4 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl flex flex-col gap-4">
            {selectedAddress && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest leading-none mb-1">Selected Location Address</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed line-clamp-2">
                    {selectedAddress}
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="w-full h-14 bg-pos-accent text-white rounded-2xl font-bold text-sm shadow-xl shadow-pos-accent/20 hover:bg-pos-accent/90 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              Confirm Location Spot
            </button>
          </div>
        )}
      </div>

      {/* Selected Address Display (Standard Mode) */}
      {!isExpanded && selectedAddress && (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-2.5">
          <div className="w-6 h-6 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <Check size={14} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Confirmed Address</p>
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-relaxed line-clamp-2">
              {selectedAddress}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
