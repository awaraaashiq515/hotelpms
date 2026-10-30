'use client';

import React, { useState, useRef } from 'react';
import {
  Bike, X, Fuel, Shield, Plus, Loader2, Camera, Upload,
  Image as ImageIcon, Trash2, CheckCircle2, Link2
} from 'lucide-react';
import { toast } from 'sonner';

interface AddBikeModalProps {
  vendorId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddBikeModal: React.FC<AddBikeModalProps> = ({
  vendorId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState({
    model: '',
    category: 'SCOOTER',
    plateNumber: '',
    dailyRate: '500',
    hourlyRate: '100',
    securityDeposit: '1000',
    helmetsProvided: '1',
    fuelIncluded: false,
    photoUrl: '',
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle direct file upload from phone camera or gallery
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/bike-rentals/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.url) {
        setForm((prev) => ({ ...prev, photoUrl: json.url }));
        toast.success('Vehicle photo uploaded!');
      } else {
        toast.error(json.message || 'Failed to upload photo');
      }
    } catch {
      toast.error('Network error uploading image');
    } finally {
      setUploadingImage(false);
      // Reset input value so same file can be selected if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.model || !form.plateNumber) {
      toast.error('Bike Model and Registration Plate Number are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bike-rentals/bikes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          model: form.model,
          category: form.category,
          plateNumber: form.plateNumber.toUpperCase().trim(),
          dailyRate: Number(form.dailyRate),
          hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
          securityDeposit: Number(form.securityDeposit),
          helmetsProvided: Number(form.helmetsProvided),
          fuelIncluded: form.fuelIncluded,
          photoUrl: form.photoUrl || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Bike added to fleet successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(json.message || 'Failed to add bike');
      }
    } catch {
      toast.error('Network error. Failed to add bike.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0b1120] border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-[#0b1120] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Bike size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">Register New Vehicle in Fleet</h2>
              <p className="text-[11px] text-slate-400">Add two-wheeler with photo & rates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto flex-1 scrollbar-none">
          
          {/* ── PHOTO UPLOAD SECTION (VICAHAL KE IMGES) ── */}
          <div className="p-3.5 rounded-2xl bg-[#060a14] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera size={13} className="text-rose-400" />
                <span>Vehicle Photo / Image</span>
              </label>

              {/* Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    imageInputMode === 'upload' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    imageInputMode === 'url' ? 'bg-rose-600 text-white' : 'text-slate-400'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageFileChange}
              className="hidden"
            />

            {/* Image Preview or Upload Box */}
            {form.photoUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group">
                <img
                  src={form.photoUrl}
                  alt="Vehicle Preview"
                  className="w-full h-40 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3">
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    <CheckCircle2 size={11} /> Photo Uploaded
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-[10px] font-bold text-white border border-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Camera size={11} /> Change
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photoUrl: '' })}
                      className="p-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white cursor-pointer"
                      title="Remove Photo"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ) : imageInputMode === 'upload' ? (
              <div
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  uploadingImage
                    ? 'border-rose-500/50 bg-rose-950/10'
                    : 'border-slate-800 hover:border-rose-500/50 hover:bg-slate-900/40 bg-slate-950/50'
                }`}
              >
                {uploadingImage ? (
                  <div className="py-2 flex flex-col items-center justify-center gap-1.5">
                    <Loader2 size={22} className="animate-spin text-rose-400" />
                    <p className="text-xs font-bold text-white">Uploading vehicle image...</p>
                    <p className="text-[10px] text-slate-500">Processing picture for high performance</p>
                  </div>
                ) : (
                  <div className="py-1 flex flex-col items-center justify-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-400">
                      <Camera size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white">Take Photo or Choose from Gallery</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WebP up to 10MB</p>
                    </div>
                    <span className="mt-1 px-3 py-1 rounded-lg bg-rose-600/15 text-rose-300 border border-rose-500/25 text-[10px] font-bold flex items-center gap-1">
                      <Upload size={11} /> Click to Upload
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <Link2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="url"
                    placeholder="https://example.com/bike-photo.jpg"
                    value={form.photoUrl}
                    onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                    className="w-full bg-[#060a14] border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <p className="text-[10px] text-slate-500">Paste direct image link</p>
              </div>
            )}
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              Vehicle Model Name <span className="text-rose-400">*</span>
            </label>
            <input
              required
              type="text"
              placeholder="e.g. Royal Enfield Himalayan 450, Honda Activa 6G, KTM Duke 250"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          {/* Category & Plate Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="SCOOTER">Scooter / Moped</option>
                <option value="CRUISER">Cruiser / Royal Enfield</option>
                <option value="ADVENTURE">Adventure / Off-Road</option>
                <option value="ELECTRIC">Electric / EV</option>
                <option value="SPORTS">Sports Bike</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Plate Number <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                placeholder="e.g. HP-01-AA-1234"
                value={form.plateNumber}
                onChange={(e) => setForm({ ...form, plateNumber: e.target.value })}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white uppercase font-mono placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Daily & Hourly Rate */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Daily Rate (₹/day) <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="number"
                min="50"
                value={form.dailyRate}
                onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Hourly Rate (₹/hr, Optional)
              </label>
              <input
                type="number"
                min="0"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
                placeholder="e.g. 100"
              />
            </div>
          </div>

          {/* Security Deposit & Helmets */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Security Deposit (₹) <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="number"
                min="0"
                value={form.securityDeposit}
                onChange={(e) => setForm({ ...form, securityDeposit: e.target.value })}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Helmets Included
              </label>
              <select
                value={form.helmetsProvided}
                onChange={(e) => setForm({ ...form, helmetsProvided: e.target.value })}
                className="w-full bg-[#060a14] border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="1">1 Helmet</option>
                <option value="2">2 Helmets</option>
                <option value="0">None</option>
              </select>
            </div>
          </div>

          {/* Fuel Policy */}
          <div className="p-3.5 rounded-2xl bg-[#060a14] border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fuel size={16} className="text-sky-400" />
              <div>
                <p className="text-xs font-bold text-white">Fuel Included Policy</p>
                <p className="text-[10px] text-slate-400">Enable if initial tank of fuel is included</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={form.fuelIncluded}
              onChange={(e) => setForm({ ...form, fuelIncluded: e.target.checked })}
              className="w-4 h-4 accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Sticky Bottom Actions */}
          <div className="pt-2 sticky bottom-0 bg-[#0b1120] pb-1">
            <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingImage}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:opacity-90 font-black text-white transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>Register Vehicle</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
