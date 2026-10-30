'use client';

import React, { useState, useRef } from 'react';
import {
  Bike, Search, Filter, Plus, Trash2, Fuel, ShieldAlert,
  Sparkles, Wrench, CheckCircle2, Clock, BatteryCharging,
  Camera, Upload, Loader2, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { BikeItem } from './types';

interface FleetTabProps {
  bikes: BikeItem[];
  loading: boolean;
  onAddBike: () => void;
  onRentOut: (bike: BikeItem) => void;
  onUpdateStatus: (bikeId: string, status: 'AVAILABLE' | 'ON_RENT' | 'MAINTENANCE') => void;
  onDeleteBike: (bikeId: string) => void;
  onRefresh?: () => void;
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Fleet' },
  { id: 'SCOOTER', label: 'Scooter / Moped' },
  { id: 'CRUISER', label: 'Cruiser / Royal Enfield' },
  { id: 'ADVENTURE', label: 'Adventure / Off-Road' },
  { id: 'ELECTRIC', label: 'Electric / EV' },
  { id: 'SPORTS', label: 'Sports' },
];

export const FleetTab: React.FC<FleetTabProps> = ({
  bikes,
  loading,
  onAddBike,
  onRentOut,
  onUpdateStatus,
  onDeleteBike,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'ON_RENT' | 'MAINTENANCE'>('ALL');
  
  // Photo upload state for existing bikes
  const [activeUploadBikeId, setActiveUploadBikeId] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerPhotoUpload = (bikeId: string) => {
    setActiveUploadBikeId(bikeId);
    fileInputRef.current?.click();
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadBikeId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      // 1. Upload image
      const formData = new FormData();
      formData.append('file', file);

      const upRes = await fetch('/api/bike-rentals/upload', {
        method: 'POST',
        body: formData,
      });
      const upJson = await upRes.json();

      if (!upJson.success || !upJson.url) {
        toast.error(upJson.message || 'Failed to upload photo');
        return;
      }

      // 2. Update bike with photoUrl
      const patchRes = await fetch('/api/bike-rentals/bikes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeUploadBikeId,
          photoUrl: upJson.url,
        }),
      });

      const patchJson = await patchRes.json();
      if (patchJson.success) {
        toast.success('Vehicle photo updated successfully!');
        if (onRefresh) onRefresh();
      } else {
        toast.error(patchJson.message || 'Failed to update vehicle record');
      }
    } catch {
      toast.error('Network error during photo update');
    } finally {
      setUploadingPhoto(false);
      setActiveUploadBikeId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredBikes = bikes.filter((b) => {
    const matchesSearch =
      b.model.toLowerCase().includes(search.toLowerCase()) ||
      b.plateNumber.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || b.category.toUpperCase() === selectedCategory;

    const matchesStatus =
      statusFilter === 'ALL' || b.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Hidden file input for updating photos on existing vehicles */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoFileChange}
        className="hidden"
      />

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by model or registration plate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0b1120] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(['ALL', 'AVAILABLE', 'ON_RENT', 'MAINTENANCE'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'AVAILABLE' ? 'Available' : st === 'ON_RENT' ? 'On Rent' : 'Maintenance'}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-slate-800 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white bg-slate-950 border border-slate-900'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Bikes Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Loading Fleet...</p>
        </div>
      ) : filteredBikes.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-[#0b1120]/40 space-y-3">
          <Bike size={40} className="mx-auto text-slate-700" />
          <p className="text-sm font-black text-slate-300">No Vehicles Found</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {bikes.length === 0
              ? 'Your fleet is empty. Click below to add your first bike or scooter.'
              : 'No vehicles match the selected search or category filter.'}
          </p>
          {bikes.length === 0 && (
            <button
              onClick={onAddBike}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/25 mt-2"
            >
              <Plus size={14} />
              <span>Register First Bike</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBikes.map((bike) => {
            const isAvailable = bike.status === 'AVAILABLE';
            const isOnRent = bike.status === 'ON_RENT';
            const isMaint = bike.status === 'MAINTENANCE';
            const isCurrentUploading = uploadingPhoto && activeUploadBikeId === bike.id;

            return (
              <div
                key={bike.id}
                className="p-4 sm:p-5 rounded-3xl bg-[#0b1120] border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm group"
              >
                <div>
                  {/* Vehicle Image Banner */}
                  {bike.photoUrl ? (
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 mb-3.5 group/img">
                      <img
                        src={bike.photoUrl}
                        alt={bike.model}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white font-bold border border-white/10">
                          {bike.plateNumber}
                        </span>
                        <button
                          onClick={() => triggerPhotoUpload(bike.id)}
                          disabled={isCurrentUploading}
                          className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-[10px] font-bold text-white border border-slate-700 flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                        >
                          {isCurrentUploading ? (
                            <Loader2 size={11} className="animate-spin text-rose-400" />
                          ) : (
                            <Camera size={11} className="text-rose-400" />
                          )}
                          <span>{isCurrentUploading ? 'Saving...' : 'Change Photo'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-800/90 bg-[#060a14]/60 mb-3.5 flex flex-col items-center justify-center gap-1.5 p-3 hover:border-rose-500/40 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                        <Bike size={18} />
                      </div>
                      <button
                        type="button"
                        onClick={() => triggerPhotoUpload(bike.id)}
                        disabled={isCurrentUploading}
                        className="text-[10px] font-black text-rose-400 hover:text-rose-300 flex items-center gap-1.5 bg-rose-600/10 hover:bg-rose-600/20 px-3 py-1.5 rounded-xl border border-rose-500/25 cursor-pointer transition-all active:scale-95"
                      >
                        {isCurrentUploading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Camera size={12} />
                        )}
                        <span>{isCurrentUploading ? 'Uploading...' : '+ Add Vehicle Photo'}</span>
                      </button>
                    </div>
                  )}

                  {/* Top: Model & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-black text-white group-hover:text-rose-400 transition-colors truncate">
                        {bike.model}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 tracking-wider font-semibold">
                        {bike.plateNumber}
                      </p>
                    </div>

                    <span
                      className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                        isAvailable
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : isOnRent
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {bike.status}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
                      {bike.category}
                    </span>
                    {bike.fuelIncluded ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center gap-1">
                        <Fuel size={10} /> Fuel Included
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                        Fuel on Return
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
                      {bike.helmetsProvided} Helmet{bike.helmetsProvided > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Pricing Info */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-lg font-black text-white">₹{bike.dailyRate.toLocaleString('en-IN')}</span>
                      <span className="text-xs text-slate-500 ml-1">/day</span>
                      {bike.hourlyRate && (
                        <span className="text-xs text-slate-400 ml-2">(₹{bike.hourlyRate}/hr)</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Security Deposit</span>
                      <span className="text-xs font-bold text-amber-400">₹{bike.securityDeposit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2">
                  {isAvailable ? (
                    <button
                      onClick={() => onRentOut(bike)}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95"
                    >
                      <Sparkles size={12} />
                      <span>Rent Out</span>
                    </button>
                  ) : isOnRent ? (
                    <button
                      onClick={() => onUpdateStatus(bike.id, 'AVAILABLE')}
                      className="flex-1 py-2.5 rounded-xl bg-sky-600/20 hover:bg-sky-600 hover:text-white border border-sky-500/30 text-sky-300 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={12} />
                      <span>Mark Returned</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(bike.id, 'AVAILABLE')}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white text-xs font-black transition-all cursor-pointer"
                    >
                      Make Road-Ready
                    </button>
                  )}

                  {/* Toggle Maintenance */}
                  {!isOnRent && (
                    <button
                      onClick={() => onUpdateStatus(bike.id, isMaint ? 'AVAILABLE' : 'MAINTENANCE')}
                      title={isMaint ? 'Mark Road-Ready' : 'Send to Maintenance'}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                        isMaint
                          ? 'bg-amber-500/20 border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400'
                      }`}
                    >
                      <Wrench size={14} />
                    </button>
                  )}

                  {/* Remove */}
                  <button
                    onClick={() => onDeleteBike(bike.id)}
                    title="Remove Bike"
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
