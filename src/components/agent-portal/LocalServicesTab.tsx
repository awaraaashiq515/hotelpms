'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Bus, Car, Bike, MapPin, Phone, Star, Clock, Users,
  ArrowRight, Tent, IndianRupee, CheckCircle2, Calendar,
  Sparkles, Loader2, Plus, AlertCircle, RefreshCw, ShieldCheck,
  Search, X, Navigation
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ServiceItem {
  id: string;
  name: string;
  type: string;
  capacity?: string;
  plateNumber?: string;
  priceFrom: number;
  priceTo?: number;
  unit: string;
  rating?: number;
  features: string[];
  contact?: string;
  available: boolean;
  photoUrl?: string | null;
  shopName?: string;
  city?: string;
  state?: string;
  location?: string;
  route?: string;
  driverName?: string;
  operator?: string;
  address?: string;
}

interface SightseeingSpot {
  id: string;
  name: string;
  type: 'MONUMENT' | 'NATURE' | 'RELIGIOUS' | 'MARKET' | 'ADVENTURE' | 'RESTAURANT';
  distance: string;
  timing: string;
  entryFee?: string;
  rating?: number;
  description: string;
  tags: string[];
  contact?: string;
  photoUrl?: string;
  city?: string;
  location?: string;
}

const SPOT_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  MONUMENT: { icon: '🏛️', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  NATURE:   { icon: '🌿', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  RELIGIOUS:{ icon: '🛕', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  MARKET:   { icon: '🛍️', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  ADVENTURE:{ icon: '⚡', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  RESTAURANT:{ icon: '🍽️', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function ServiceCard({ item, onEnquire }: { item: ServiceItem; onEnquire: (item: ServiceItem) => void }) {
  const displayLocation = item.location || (item.city ? `${item.city}${item.state ? ', ' + item.state : ''}` : 'Local Hub');

  return (
    <div className={`bg-[#090f1e] border rounded-2xl p-4 flex flex-col gap-3 transition-all hover:shadow-lg hover:shadow-violet-900/10 group ${item.available ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-60'}`}>
      
      {/* Vehicle Photo (if available) */}
      {item.photoUrl && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shrink-0">
          <img
            src={item.photoUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide image if failed to load
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 flex items-center gap-1 shadow-sm">
            <MapPin size={10} className="text-sky-400 shrink-0" />
            <span className="truncate max-w-[180px]">{displayLocation}</span>
          </div>
          <div className="absolute top-2 right-2">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border shadow-sm ${item.available ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-slate-800/90 text-slate-400 border-slate-700'}`}>
              {item.available ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white truncate">{item.name}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-[10px] text-slate-400 font-bold">{item.type}</span>
            {item.capacity && <span className="text-[10px] text-slate-500">· {item.capacity}</span>}
            {item.plateNumber && (
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {item.plateNumber}
              </span>
            )}
            {item.shopName && (
              <span className="text-[9px] text-violet-400 font-semibold truncate">
                via {item.shopName}
              </span>
            )}
            {item.driverName && (
              <span className="text-[9px] text-emerald-400 font-semibold truncate">
                Driver: {item.driverName}
              </span>
            )}
          </div>
        </div>

        {!item.photoUrl && (
          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0 ${item.available ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
            {item.available ? 'Available' : 'Unavailable'}
          </span>
        )}
      </div>

      {/* Location Badge (Shown prominently if no photo or to emphasize location) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-950/40 text-sky-300 border border-sky-500/20 flex items-center gap-1">
          <MapPin size={11} className="text-sky-400 shrink-0" />
          <span className="font-semibold">Location:</span> {displayLocation}
        </span>

        {item.route && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/20 flex items-center gap-1">
            <Navigation size={10} className="text-amber-400 shrink-0" />
            <span>Route: {item.route}</span>
          </span>
        )}
      </div>

      {/* Pricing */}
      {item.priceFrom > 0 ? (
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-violet-300">₹{item.priceFrom.toLocaleString('en-IN')}</span>
          {item.priceTo && <span className="text-xs text-slate-500">– ₹{item.priceTo.toLocaleString('en-IN')}</span>}
          <span className="text-[10px] text-slate-500">{item.unit}</span>
        </div>
      ) : (
        <div className="text-xs text-slate-400 font-medium py-1">Rates available on enquiry</div>
      )}

      {/* Feature Badges */}
      {item.features && item.features.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.features.map((feat) => (
            <span key={feat} className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
              {feat}
            </span>
          ))}
        </div>
      )}

      {item.rating && (
        <div className="flex items-center gap-1 text-[10px]">
          <Star size={10} className="text-amber-400 fill-amber-400" />
          <span className="text-amber-400 font-black">{item.rating}</span>
          <span className="text-slate-600">/ 5.0</span>
        </div>
      )}

      {/* Call & Enquire Buttons */}
      <div className="flex gap-2 mt-auto pt-1">
        {item.contact && (
          <a
            href={`tel:${item.contact}`}
            className="flex-1 py-2 rounded-xl text-[10px] font-black text-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center gap-1"
          >
            <Phone size={11} /> Call
          </a>
        )}
        <button
          onClick={() => onEnquire(item)}
          disabled={!item.available}
          className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-1 ${
            item.available
              ? 'bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600 hover:text-white'
              : 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
          }`}
        >
          Enquire <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}

function SpotCard({ spot, onEnquire }: { spot: SightseeingSpot; onEnquire: () => void }) {
  const config = SPOT_TYPE_CONFIG[spot.type] || SPOT_TYPE_CONFIG.MONUMENT;
  return (
    <div className={`bg-[#090f1e] border rounded-2xl p-4 space-y-2.5 hover:shadow-lg hover:shadow-violet-900/10 transition-all ${config.border} hover:${config.border}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${config.bg} border ${config.border} shrink-0`}>
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white truncate">{spot.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
              {spot.type}
            </span>
            {spot.rating && (
              <span className="text-[9px] flex items-center gap-0.5 text-amber-400">
                <Star size={8} className="fill-amber-400" /> {spot.rating}
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">{spot.description}</p>
      <div className="flex flex-wrap gap-1">
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
          <MapPin size={8} /> {spot.distance}
        </span>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
          <Clock size={8} /> {spot.timing}
        </span>
        {spot.entryFee && (
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-emerald-900/30 text-emerald-400 border border-emerald-500/20">
            {spot.entryFee}
          </span>
        )}
      </div>
      {spot.tags && spot.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {spot.tags.map((t) => (
            <span key={t} className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="pt-1 flex gap-2">
        {spot.contact && (
          <a
            href={`tel:${spot.contact}`}
            className="flex-1 py-1.5 rounded-xl text-[10px] font-bold text-center bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center gap-1"
          >
            <Phone size={10} /> Call Place
          </a>
        )}
        <button
          onClick={onEnquire}
          className="flex-1 py-1.5 rounded-xl text-[10px] font-bold bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center gap-1"
        >
          Book Tour / Guide <ArrowRight size={10} />
        </button>
      </div>
    </div>
  );
}

function EmptyServiceState({
  title,
  subtitle,
  registerUrl,
  registerLabel,
  icon: Icon,
  onResetLocation,
}: {
  title: string;
  subtitle: string;
  registerUrl: string;
  registerLabel: string;
  icon: React.ElementType;
  onResetLocation?: () => void;
}) {
  return (
    <div className="py-14 px-4 text-center border-2 border-dashed border-slate-800/80 rounded-3xl bg-[#070b15]/40 space-y-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
        <Icon size={26} />
      </div>
      <div>
        <p className="text-sm font-black text-slate-300">{title}</p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">{subtitle}</p>
      </div>
      <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
        {onResetLocation && (
          <button
            onClick={onResetLocation}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
          >
            <span>Show All Locations</span>
          </button>
        )}
        <Link
          href={registerUrl}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shadow-md shadow-violet-600/20 transition-all cursor-pointer"
        >
          <Plus size={13} />
          <span>{registerLabel}</span>
        </Link>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

type LocalTab = 'sightseeing' | 'buses' | 'taxis' | 'tempo' | 'bikes' | 'restaurants';

interface LocalServicesTabProps {
  onGroupEnquiry: (serviceType?: string, item?: ServiceItem) => void;
}

export default function LocalServicesTab({ onGroupEnquiry }: LocalServicesTabProps) {
  const [localTab, setLocalTab] = useState<LocalTab>('sightseeing');
  const [sightseeingFilter, setSightseeingFilter] = useState<string>('ALL');
  const [enquiredItem, setEnquiredItem] = useState<ServiceItem | null>(null);

  // 📍 Location Filtering State
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [locationSearch, setLocationSearch] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [servicesData, setServicesData] = useState<{
    buses: ServiceItem[];
    taxis: ServiceItem[];
    tempos: ServiceItem[];
    bikes: ServiceItem[];
    sightseeing: SightseeingSpot[];
    restaurants: SightseeingSpot[];
  }>({
    buses: [],
    taxis: [],
    tempos: [],
    bikes: [],
    sightseeing: [],
    restaurants: [],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent-portal/local-services');
      const j = await res.json();
      if (j.success && j.data) {
        setServicesData(j.data);
        if (j.availableLocations) {
          setAvailableLocations(j.availableLocations);
        }
      }
    } catch (e) {
      console.error('Failed to load local services', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute all distinct locations dynamically from all vehicles & services
  const allLocationsList = useMemo(() => {
    const set = new Set<string>(availableLocations);
    const checkItem = (item: { city?: string; location?: string }) => {
      if (item.city && item.city.trim() && !item.city.toLowerCase().startsWith('local')) {
        set.add(item.city.trim());
      }
    };
    servicesData.buses.forEach(checkItem);
    servicesData.taxis.forEach(checkItem);
    servicesData.tempos.forEach(checkItem);
    servicesData.bikes.forEach(checkItem);
    return Array.from(set).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [availableLocations, servicesData]);

  // Generic filter function for vehicles based on selected location and text search
  const filterByLocation = <T extends { city?: string; location?: string; name?: string; type?: string; route?: string }>(items: T[]): T[] => {
    return items.filter((item) => {
      const cityLower = (item.city || '').toLowerCase();
      const locLower = (item.location || '').toLowerCase();
      const nameLower = (item.name || '').toLowerCase();
      const routeLower = (item.route || '').toLowerCase();

      // Check selected chip location
      if (selectedLocation !== 'ALL') {
        const target = selectedLocation.toLowerCase();
        const matchesChip = cityLower.includes(target) || locLower.includes(target);
        if (!matchesChip) return false;
      }

      // Check text search
      if (locationSearch.trim()) {
        const query = locationSearch.trim().toLowerCase();
        const matchesSearch =
          cityLower.includes(query) ||
          locLower.includes(query) ||
          nameLower.includes(query) ||
          routeLower.includes(query);
        if (!matchesSearch) return false;
      }

      return true;
    });
  };

  const filteredBuses = useMemo(() => filterByLocation(servicesData.buses), [servicesData.buses, selectedLocation, locationSearch]);
  const filteredTaxis = useMemo(() => filterByLocation(servicesData.taxis), [servicesData.taxis, selectedLocation, locationSearch]);
  const filteredTempos = useMemo(() => filterByLocation(servicesData.tempos), [servicesData.tempos, selectedLocation, locationSearch]);
  const filteredBikes = useMemo(() => filterByLocation(servicesData.bikes), [servicesData.bikes, selectedLocation, locationSearch]);

  // Filter out internal POS outlets and test names so only genuine external dining spots show
  const genuineRestaurants = useMemo(() => {
    return (servicesData.restaurants || []).filter(
      (r) => !r.id.startsWith('outlet-') && r.name && !r.name.toLowerCase().includes('pos') && !r.name.includes('*') && !r.name.toLowerCase().includes('restaurant name')
    );
  }, [servicesData.restaurants]);

  const filteredRestaurants = useMemo(() => {
    return genuineRestaurants.filter((r) => {
      if (selectedLocation !== 'ALL') {
        const target = selectedLocation.toLowerCase();
        const match = (r.city || '').toLowerCase().includes(target) || (r.distance || '').toLowerCase().includes(target);
        if (!match) return false;
      }
      if (locationSearch.trim()) {
        const q = locationSearch.trim().toLowerCase();
        return (r.name || '').toLowerCase().includes(q) || (r.city || '').toLowerCase().includes(q) || (r.distance || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [genuineRestaurants, selectedLocation, locationSearch]);

  const filteredSpots = useMemo(() => {
    return servicesData.sightseeing.filter((s) => {
      if (sightseeingFilter !== 'ALL' && s.type !== sightseeingFilter) return false;
      if (locationSearch.trim()) {
        const q = locationSearch.trim().toLowerCase();
        return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.distance.toLowerCase().includes(q);
      }
      return true;
    });
  }, [servicesData.sightseeing, sightseeingFilter, locationSearch]);

  // Total vehicle count for selected location
  const totalVehiclesCount = servicesData.buses.length + servicesData.taxis.length + servicesData.tempos.length + servicesData.bikes.length;

  const countVehiclesInLocation = (loc: string) => {
    const l = loc.toLowerCase();
    const match = (item: { city?: string; location?: string }) =>
      (item.city || '').toLowerCase().includes(l) || (item.location || '').toLowerCase().includes(l);
    return (
      servicesData.buses.filter(match).length +
      servicesData.taxis.filter(match).length +
      servicesData.tempos.filter(match).length +
      servicesData.bikes.filter(match).length
    );
  };

  const TABS: { key: LocalTab; label: string; icon: React.ElementType; color: string; count: number }[] = [
    { key: 'sightseeing', label: 'Sightseeing', icon: Tent, color: 'text-indigo-400', count: filteredSpots.length },
    { key: 'buses', label: 'Buses', icon: Bus, color: 'text-sky-400', count: filteredBuses.length },
    { key: 'taxis', label: 'Taxis', icon: Car, color: 'text-emerald-400', count: filteredTaxis.length },
    { key: 'tempo', label: 'Tempo', icon: Users, color: 'text-amber-400', count: filteredTempos.length },
    { key: 'bikes', label: 'Bikes', icon: Bike, color: 'text-rose-400', count: filteredBikes.length },
    { key: 'restaurants', label: 'Dine & Cafes', icon: IndianRupee, color: 'text-cyan-400', count: filteredRestaurants.length },
  ];

  const SPOT_TYPES = ['ALL', 'MONUMENT', 'NATURE', 'RELIGIOUS', 'MARKET', 'ADVENTURE', 'RESTAURANT'];

  const handleEnquire = (item: ServiceItem) => {
    setEnquiredItem(item);
    const serviceKey = localTab === 'bikes' ? 'bike' : localTab === 'buses' ? 'bus' : localTab === 'taxis' ? 'taxi' : localTab === 'tempo' ? 'tempo' : 'hotel';
    onGroupEnquiry(serviceKey, item);
  };

  const handleResetLocation = () => {
    setSelectedLocation('ALL');
    setLocationSearch('');
  };

  return (
    <div className="space-y-4">
      {/* Group Enquiry Callout Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-950/60 via-indigo-950/50 to-sky-950/50 border border-violet-500/30 p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 flex items-center justify-center text-violet-300 shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-xs font-black text-white">Need Customized Group Travel or Fleet?</p>
            <p className="text-[10px] text-slate-400">Enquire for multiple buses, cabs, tempo travellers, and tourist packages</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh Live Data"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-violet-400' : ''} />
          </button>
          <button
            onClick={() => onGroupEnquiry?.('bike')}
            className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:opacity-95 shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Users size={13} /> Group Enquiry
          </button>
        </div>
      </div>

      {/* ── 📍 LOCATION FILTER BAR (Vehicles by Location) ── */}
      <div className="bg-[#090f1e] border border-slate-800 rounded-2xl p-3.5 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0">
              <MapPin size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">Select Vehicle Location / City</span>
                {selectedLocation !== 'ALL' && (
                  <span className="text-[10px] font-bold text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.2 rounded-full">
                    📍 {selectedLocation}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {selectedLocation === 'ALL'
                  ? 'Showing vehicles across all locations'
                  : `Filtered to show vehicles available in ${selectedLocation}`}
              </p>
            </div>
          </div>

          {/* Location / Keyword Search Box */}
          <div className="relative min-w-[220px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search location, city, route..."
              value={locationSearch}
              onChange={(e) => {
                setLocationSearch(e.target.value);
                if (selectedLocation !== 'ALL') setSelectedLocation('ALL');
              }}
              className="w-full bg-[#060a14] border border-slate-800 rounded-xl pl-8 pr-7 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {locationSearch && (
              <button
                onClick={() => setLocationSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Location Quick-Pills / Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={handleResetLocation}
            className={`px-3 py-1.5 rounded-xl font-black shrink-0 transition-all cursor-pointer ${
              selectedLocation === 'ALL' && !locationSearch
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            🌍 All Locations ({totalVehiclesCount})
          </button>

          {allLocationsList.map((loc) => {
            const count = countVehiclesInLocation(loc);
            const isSelected = selectedLocation.toLowerCase() === loc.toLowerCase();

            return (
              <button
                key={loc}
                onClick={() => {
                  setSelectedLocation(loc);
                  setLocationSearch('');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/25'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <MapPin size={11} className={isSelected ? 'text-white' : 'text-sky-400'} />
                <span>{loc}</span>
                {count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-sky-800 text-white' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Local Services Navigation Tabs */}
      <div className="flex gap-1.5 bg-[#090f1e] border border-slate-800 rounded-2xl p-1.5 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = localTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setLocalTab(tab.key)}
              className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={14} className={isActive ? tab.color : 'text-slate-500'} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="h-44 flex flex-col items-center justify-center gap-2">
          <Loader2 className="animate-spin text-violet-400" size={32} />
          <p className="text-xs text-slate-500 font-bold">Connecting to live fleet & location database...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: Sightseeing */}
          {localTab === 'sightseeing' && (
            <div className="space-y-4">
              {/* Type Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {SPOT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSightseeingFilter(type)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-black shrink-0 transition-all cursor-pointer ${
                      sightseeingFilter === type
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-[#090f1e] text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    {type === 'ALL' ? '🌟 All Spots' : `${SPOT_TYPE_CONFIG[type]?.icon || ''} ${type}`}
                  </button>
                ))}
              </div>

              {filteredSpots.length === 0 ? (
                <EmptyServiceState
                  title="No Sightseeing Spots Added Yet"
                  subtitle="Sightseeing spots added by hotel managers and tour operators will appear here."
                  registerUrl="/hotel/sightseeing"
                  registerLabel="Add Sightseeing Destination"
                  icon={Tent}
                  onResetLocation={handleResetLocation}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredSpots.map((spot) => (
                    <SpotCard key={spot.id} spot={spot} onEnquire={() => onGroupEnquiry('sightseeing', spot as any)} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Buses */}
          {localTab === 'buses' && (
            <div>
              {filteredBuses.length === 0 ? (
                <EmptyServiceState
                  title={selectedLocation !== 'ALL' ? `No Buses Listed in "${selectedLocation}"` : "No Buses Registered in Live Fleet"}
                  subtitle={selectedLocation !== 'ALL' ? "Try selecting 'All Locations' to see buses across other regions." : "Bus drivers and coach operators can register their vehicle to accept agent bookings."}
                  registerUrl="/signup?role=DELIVERY_RIDER"
                  registerLabel="Register Bus / Coach Fleet"
                  icon={Bus}
                  onResetLocation={selectedLocation !== 'ALL' || locationSearch ? handleResetLocation : undefined}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredBuses.map((item) => (
                    <ServiceCard key={item.id} item={item} onEnquire={handleEnquire} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Taxis */}
          {localTab === 'taxis' && (
            <div>
              {filteredTaxis.length === 0 ? (
                <EmptyServiceState
                  title={selectedLocation !== 'ALL' ? `No Cabs Listed in "${selectedLocation}"` : "No Cabs or Taxis Currently Registered"}
                  subtitle={selectedLocation !== 'ALL' ? "Try selecting 'All Locations' to see cabs across other regions." : "Cab drivers and taxi fleet owners can register vehicles via the Transport Driver portal."}
                  registerUrl="/signup?role=DELIVERY_RIDER"
                  registerLabel="Register Taxi / Cab Fleet"
                  icon={Car}
                  onResetLocation={selectedLocation !== 'ALL' || locationSearch ? handleResetLocation : undefined}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTaxis.map((item) => (
                    <ServiceCard key={item.id} item={item} onEnquire={handleEnquire} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Tempo Travellers */}
          {localTab === 'tempo' && (
            <div>
              {filteredTempos.length === 0 ? (
                <EmptyServiceState
                  title={selectedLocation !== 'ALL' ? `No Tempo Travellers in "${selectedLocation}"` : "No Tempo Travellers Available"}
                  subtitle={selectedLocation !== 'ALL' ? "Try selecting 'All Locations' to see tempo travellers across other regions." : "Register 9-seater, 12-seater, or 17-seater vans in the transport portal."}
                  registerUrl="/signup?role=DELIVERY_RIDER"
                  registerLabel="Register Tempo Traveller"
                  icon={Users}
                  onResetLocation={selectedLocation !== 'ALL' || locationSearch ? handleResetLocation : undefined}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredTempos.map((item) => (
                    <ServiceCard key={item.id} item={item} onEnquire={handleEnquire} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Bikes & Scooters */}
          {localTab === 'bikes' && (
            <div>
              {filteredBikes.length === 0 ? (
                <EmptyServiceState
                  title={selectedLocation !== 'ALL' ? `No Bike Rentals Found in "${selectedLocation}"` : "No Bike Rentals Available"}
                  subtitle={selectedLocation !== 'ALL' ? "Check 'All Locations' to see bike rental shops in neighboring areas." : "Bike vendors and scooter rental shops can register their rental bikes on the Bike Rental Portal."}
                  registerUrl="/bike-rental-portal"
                  registerLabel="Register Bike Rental Fleet"
                  icon={Bike}
                  onResetLocation={selectedLocation !== 'ALL' || locationSearch ? handleResetLocation : undefined}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredBikes.map((item) => (
                    <ServiceCard key={item.id} item={item} onEnquire={handleEnquire} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Dine & Cafes */}
          {localTab === 'restaurants' && (
            <div>
              {filteredRestaurants.length === 0 ? (
                <EmptyServiceState
                  title={selectedLocation !== 'ALL' ? `No Restaurants Listed in "${selectedLocation}"` : "No Nearby Restaurants Listed"}
                  subtitle="Hotel dining outlets and registered partner restaurants will appear here."
                  registerUrl="/hoteladmin"
                  registerLabel="Add Dining Outlet"
                  icon={IndianRupee}
                  onResetLocation={selectedLocation !== 'ALL' || locationSearch ? handleResetLocation : undefined}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredRestaurants.map((spot) => (
                    <SpotCard key={spot.id} spot={spot} onEnquire={() => onGroupEnquiry('hotel', spot as any)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
