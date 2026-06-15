'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Printer, RefreshCcw, ChevronRight, MapPin, Navigation, Crosshair, Check, Loader2, Search } from 'lucide-react';

export const BusinessProfileForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingSimple, setTestingSimple] = useState(false);
  const [property, setProperty] = useState<any>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [thermalPrinterName, setThermalPrinterName] = useState('MPT-II');
  const [enableDirectPrinting, setEnableDirectPrinting] = useState(true);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [showManualPrinter, setShowManualPrinter] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // ── Place Search States ──
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.map-search-container')) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const prop = data.data;
          setProperty(prop);
          setDisplayName(prop.name || '');
          setAddress(prop.address || '');
          setPhone(prop.phone || '');
          setGstNumber(prop.taxDetails || '');
          setThermalPrinterName(prop.thermalPrinterName || 'MPT-II');
          setEnableDirectPrinting(prop.enableDirectPrinting ?? true);
          if (prop.latitude) setLatitude(Number(prop.latitude));
          if (prop.longitude) setLongitude(Number(prop.longitude));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/setup/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: displayName,
          address,
          phone,
          taxDetails: gstNumber,
          thermalPrinterName,
          enableDirectPrinting,
          logoUrl: property.logoUrl, // Keep existing logo
          latitude,
          longitude
        })
      });
      if (res.ok) alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTest: true, property })
      });
      const data = await res.json();
      if (data.success) {
        alert('Test print sent!');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      alert(`Test print failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleTestPrintSimple = async () => {
    setTestingSimple(true);
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTest: true, property })
      });
      const data = await res.json();
      if (data.success) {
        alert('Simple test print sent!');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      alert(`Simple test print failed: ${err.message}`);
    } finally {
      setTestingSimple(false);
    }
  };

  const handleFetchPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const { printerService } = await import('@/lib/printer-service');
      const list = await printerService.findPrinters();
      const printerArray = Array.isArray(list) ? list : [list];
      setAvailablePrinters(printerArray);
      if (printerArray.length > 0 && !printerArray.includes(thermalPrinterName)) {
        // Optional: don't auto-set if already set to something valid
      }
    } catch (err) {
      console.error('Failed to fetch printers', err);
    } finally {
      setLoadingPrinters(false);
    }
  };

  // ── Place Search Handlers ──
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 3) {
      setSearchSuggestions([]);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      if (Array.isArray(data)) {
        setSearchSuggestions(data);
      } else {
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setLatitude(lat);
    setLongitude(lng);
    setLocationSaved(false);
    updateMapMarker(lat, lng);
    setSearchQuery(suggestion.display_name);
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        handleSelectSuggestion(data[0]);
      } else {
        alert('No location found for this search.');
      }
    } catch (error) {
      console.error('Search submit error:', error);
      alert('Error searching location.');
    } finally {
      setSearchLoading(false);
    }
  };

  // ── Map: Update or create marker ──
  const updateMapMarker = useCallback((lat: number, lng: number) => {
    const L = (window as any).L;
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        className: '',
        html: `<div style="background:#10b981;border:3px solid white;border-radius:12px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,.55);font-size:18px;cursor:grab;">📍</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setLatitude(parseFloat(pos.lat.toFixed(7)));
        setLongitude(parseFloat(pos.lng.toFixed(7)));
        setLocationSaved(false);
      });
      markerRef.current = marker;
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 16));
  }, []);

  // ── Map: GPS location ──
  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('GPS is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(7));
        const lng = parseFloat(pos.coords.longitude.toFixed(7));
        setLatitude(lat);
        setLongitude(lng);
        setLocationSaved(false);
        updateMapMarker(lat, lng);
        setGpsLoading(false);
      },
      (err) => {
        console.error('GPS Error:', err);
        alert('Unable to detect your location. Please allow location access.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [updateMapMarker]);

  // ── Map: Initialize Leaflet ──
  useEffect(() => {
    if (loading) return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css-settings')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css-settings';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

      const initLat = latitude || 31.7087;
      const initLng = longitude || 76.9317;
      const initZoom = (latitude && longitude) ? 17 : 13;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([initLat, initLng], initZoom);

      L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        attribution: '&copy; Google Maps',
      }).addTo(map);

      // Click to place/move pin
      map.on('click', (e: any) => {
        const lat = parseFloat(e.latlng.lat.toFixed(7));
        const lng = parseFloat(e.latlng.lng.toFixed(7));
        setLatitude(lat);
        setLongitude(lng);
        setLocationSaved(false);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const icon = L.divIcon({
            className: '',
            html: `<div style="background:#10b981;border:3px solid white;border-radius:12px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,.55);font-size:18px;cursor:grab;">📍</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });
          const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            setLatitude(parseFloat(pos.lat.toFixed(7)));
            setLongitude(parseFloat(pos.lng.toFixed(7)));
            setLocationSaved(false);
          });
          markerRef.current = marker;
        }
      });

      mapInstanceRef.current = map;

      // Place existing marker if coordinates exist
      if (latitude && longitude) {
        const icon = L.divIcon({
          className: '',
          html: `<div style="background:#10b981;border:3px solid white;border-radius:12px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(16,185,129,.55);font-size:18px;cursor:grab;">📍</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
        const marker = L.marker([latitude, longitude], { icon, draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setLatitude(parseFloat(pos.lat.toFixed(7)));
          setLongitude(parseFloat(pos.lng.toFixed(7)));
          setLocationSaved(false);
        });
        markerRef.current = marker;
        setLocationSaved(true);
      }

      // Fix map size after render
      setTimeout(() => map.invalidateSize(), 200);
      setTimeout(() => map.invalidateSize(), 500);
    };

    // Load Leaflet JS
    if ((window as any).L) {
      initMap();
    } else if (!document.getElementById('leaflet-js-settings')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js-settings';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      const ci = setInterval(() => {
        if ((window as any).L) {
          clearInterval(ci);
          initMap();
        }
      }, 100);
      return () => clearInterval(ci);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest">Loading Profile...</div>;

  return (
    <Card className="p-5 lg:p-8 border-t-4 border-t-pos-primary shadow-2xl shadow-gray-100">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="w-12 h-12 bg-pos-primary/10 text-pos-primary rounded-2xl flex items-center justify-center">
          <Printer size={24} />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Bill Header Details</h2>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">This info appears on your printed bills & invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Restaurant / Display Name</label>
          <input 
            type="text" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-black text-sm dark:text-white uppercase tracking-tight transition-all"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Physical Address</label>
          <textarea 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-bold text-sm dark:text-white tracking-tight transition-all"
          />
        </div>

        {/* ── Location Picker Section ── */}
        <div className="sm:col-span-2 border-t border-gray-100 dark:border-slate-800 pt-6 mt-2">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Restaurant Location</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Set your exact pin on the map for delivery & navigation</p>
            </div>
          </div>

          {/* Map Container */}
          <div className="rounded-2xl overflow-hidden border-2 border-emerald-200 dark:border-emerald-900/50 shadow-lg shadow-emerald-100/50 dark:shadow-emerald-950/30 relative" style={{ height: 320 }}>
            <div ref={mapContainerRef} id="location-picker-map" style={{ height: '100%', width: '100%' }} />

            {/* Floating Search Bar (Google Maps style) */}
            <div className="map-search-container absolute top-3 left-3 right-32 z-[1000] max-w-[260px] sm:max-w-sm">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search location..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-white"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search size={14} />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchSuggestions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </form>

              {/* Autocomplete Dropdown */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                  {searchSuggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-[10px] font-bold text-gray-700 dark:text-slate-200 border-b border-gray-100 dark:border-slate-700/50 last:border-b-0 flex items-start gap-2 transition-colors"
                    >
                      <MapPin size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="truncate">{s.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Overlay Controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={gpsLoading}
                className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {gpsLoading ? <Loader2 size={12} className="animate-spin" /> : <Crosshair size={12} />}
                {gpsLoading ? 'Detecting...' : 'My Location'}
              </button>
            </div>

            {/* Coordinate Badge */}
            {latitude && longitude && (
              <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-slate-800/95 border border-emerald-200 dark:border-emerald-700 rounded-xl shadow-lg backdrop-blur-sm">
                <MapPin size={10} className="text-emerald-500" />
                <span className="text-[9px] font-black text-gray-700 dark:text-slate-200 tracking-wide">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
                {locationSaved && (
                  <span className="flex items-center gap-0.5 text-[8px] font-black text-emerald-500 uppercase">
                    <Check size={8} /> Saved
                  </span>
                )}
              </div>
            )}

            {/* Instruction overlay when no pin */}
            {!latitude && !longitude && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/30 z-[999] pointer-events-none">
                <div className="bg-white/95 dark:bg-slate-800/95 px-4 py-3 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 backdrop-blur-sm text-center">
                  <MapPin size={20} className="text-emerald-500 mx-auto mb-1" />
                  <p className="text-[10px] font-black text-gray-700 dark:text-slate-200 uppercase tracking-widest">Click map to set location</p>
                  <p className="text-[8px] text-gray-400 dark:text-slate-500 font-bold mt-0.5">Or use "My Location" button</p>
                </div>
              </div>
            )}
          </div>

          {/* Manual Coordinate Inputs */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={latitude ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  setLatitude(val);
                  if (val && longitude) updateMapMarker(val, longitude);
                }}
                placeholder="e.g. 31.7087"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-950/50 focus:border-emerald-500 bg-gray-50/30 dark:bg-slate-800/50 font-bold text-xs dark:text-white transition-all"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={longitude ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  setLongitude(val);
                  if (latitude && val) updateMapMarker(latitude, val);
                }}
                placeholder="e.g. 76.9317"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-950/50 focus:border-emerald-500 bg-gray-50/30 dark:bg-slate-800/50 font-bold text-xs dark:text-white transition-all"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Contact Number</label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-bold text-sm dark:text-white transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">GSTIN / TAX No</label>
          <input 
            type="text" 
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-black text-sm dark:text-white transition-all"
          />
        </div>

        <div className="sm:col-span-2 border-t border-gray-100 pt-6 mt-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Thermal Printer (QZ Tray)</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Direct ESC/POS Printing Settings</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Printer Selection (Bluetooth/USB)</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    {availablePrinters.length > 0 && !showManualPrinter ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value === 'MANUAL') {
                            setShowManualPrinter(true);
                          } else {
                            setThermalPrinterName(e.target.value);
                          }
                        }}
                        value={availablePrinters.includes(thermalPrinterName) ? thermalPrinterName : 'MANUAL'}
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white dark:bg-slate-800 font-black text-sm dark:text-white transition-all appearance-none"
                      >
                        <option value="">Select Discovered Printer</option>
                        {availablePrinters.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="MANUAL" className="text-indigo-600 font-black">--- ENTER MANUALLY ---</option>
                      </select>
                    ) : (
                      <div className="relative">
                        <input 
                          type="text" 
                          value={thermalPrinterName}
                          onChange={(e) => setThermalPrinterName(e.target.value)}
                          placeholder="Enter Printer Name (e.g. MPT-II)"
                          autoFocus={showManualPrinter}
                          className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white dark:bg-slate-800 font-black text-sm dark:text-white transition-all"
                        />
                        {availablePrinters.length > 0 && (
                          <button 
                            onClick={() => setShowManualPrinter(false)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-600 uppercase hover:underline"
                          >
                            Back to List
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleFetchPrinters}
                    disabled={loadingPrinters}
                    className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 text-indigo-600 transition-all"
                    title="Refresh Printer List"
                  >
                    <RefreshCcw size={20} className={loadingPrinters ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  <button 
                    onClick={handleTestPrint}
                    disabled={testing}
                    className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 px-3 py-1.5 rounded-lg tracking-widest flex items-center gap-1 active:scale-95 transition-all"
                  >
                    {testing ? 'Sending...' : '➜ Test ESC/POS (Normal)'}
                  </button>
                  <button 
                    onClick={handleTestPrintSimple}
                    disabled={testingSimple}
                    className="text-[9px] font-black uppercase text-teal-600 hover:text-teal-800 bg-teal-50/50 px-3 py-1.5 rounded-lg tracking-widest flex items-center gap-1 active:scale-95 transition-all"
                  >
                    {testingSimple ? 'Sending...' : '➜ Test Plain Text'}
                  </button>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setEnableDirectPrinting(!enableDirectPrinting)}
                  className={`w-14 h-8 rounded-full transition-all relative ${enableDirectPrinting ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${enableDirectPrinting ? 'left-7' : 'left-1 shadow-sm'}`} />
                </button>
                <div>
                   <p className="text-[10px] font-black text-gray-700 dark:text-slate-200 uppercase tracking-widest">Enable Direct Print</p>
                   <p className="text-[8px] text-gray-400 font-bold uppercase">Skip browser dialog</p>
                </div>
             </div>
          </div>
        </div>

        <div className="sm:col-span-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-pos-primary hover:bg-red-700 text-white font-black tracking-widest py-5 rounded-2xl shadow-xl shadow-red-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {saving ? 'UPDATING PRINT SETTINGS...' : 'SAVE PRINT CONFIGURATION'}
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </Card>
  );
};
