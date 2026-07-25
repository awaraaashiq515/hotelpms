'use client';

import React, { useState } from 'react';
import { 
  Building, 
  X, 
  Sparkles,
  Wifi,
  Tv,
  Coffee,
  Wind,
  Compass,
  DollarSign,
  Percent,
  Star,
  Loader2,
  ArrowLeft,
  Plus,
  Smile,
  Info
} from 'lucide-react';

interface RoomAddModalProps {
  roomTypes: any[];
  initialRoom?: any;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

export default function RoomAddModal({ roomTypes, initialRoom, onClose, onSave }: RoomAddModalProps) {
  const [roomNumber, setRoomNumber] = useState(initialRoom?.roomNumber || '');
  const [roomTypeId, setRoomTypeId] = useState(initialRoom?.roomTypeId || '');
  const [floor, setFloor] = useState(initialRoom?.floor || '1');
  const [customRate, setCustomRate] = useState(initialRoom?.customRate ? String(initialRoom.customRate) : '');
  const [discount, setDiscount] = useState(initialRoom?.discount ? String(initialRoom.discount) : '');
  const [gstRate, setGstRate] = useState(initialRoom?.gstRate ? String(initialRoom.gstRate) : '0');
  const [isVIP, setIsVIP] = useState(initialRoom?.isVIP || false);
  const [description, setDescription] = useState(initialRoom?.description || '');
  
  // Amenities list state to support dynamic additions
  const defaultAmenities = ['Free WiFi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Balcony'];
  const initialAmenities = initialRoom?.amenities 
    ? initialRoom.amenities.split(',').map((a: string) => a.trim()).filter(Boolean) 
    : [];
    
  // Combine defaults and any initial custom amenities that the room has
  const combinedAmenities = Array.from(new Set([...defaultAmenities, ...initialAmenities]));

  const [dynamicAmenities, setDynamicAmenities] = useState<string[]>(combinedAmenities);
  const [customAmenityInput, setCustomAmenityInput] = useState('');

  // Selected Amenities states
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(initialAmenities);
  const [submitting, setSubmitting] = useState(false);

  const toggleAmenity = (name: string) => {
    if (selectedAmenities.includes(name)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== name));
    } else {
      setSelectedAmenities([...selectedAmenities, name]);
    }
  };

  const handleAddCustomAmenity = (e: React.MouseEvent) => {
    e.preventDefault();
    const val = customAmenityInput.trim();
    if (!val) return;
    
    // Add to options list if not already there
    if (!dynamicAmenities.includes(val)) {
      setDynamicAmenities([...dynamicAmenities, val]);
    }
    
    // Automatically select/check it
    if (!selectedAmenities.includes(val)) {
      setSelectedAmenities([...selectedAmenities, val]);
    }
    
    setCustomAmenityInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        id: initialRoom?.id || undefined,
        roomNumber,
        roomTypeId,
        floor,
        customRate: customRate ? Number(customRate) : null,
        discount: discount ? Number(discount) : null,
        gstRate: gstRate ? Number(gstRate) : 0,
        isVIP,
        description,
        amenities: selectedAmenities.join(', ') || null
      };
      await onSave(payload);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to map amenity names to standard Lucide icons
  const getAmenityIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('wifi') || lower.includes('internet')) return Wifi;
    if (lower.includes('ac') || lower.includes('condition') || lower.includes('cool')) return Wind;
    if (lower.includes('tv') || lower.includes('smart tv') || lower.includes('netflix')) return Tv;
    if (lower.includes('bar') || lower.includes('coffee') || lower.includes('fridge')) return Coffee;
    if (lower.includes('balcony') || lower.includes('view') || lower.includes('terrace')) return Compass;
    return Smile; // Fallback smiley icon for custom amenities
  };

  return (
    <div className="w-full bg-[#0f172a]/20 border border-slate-800/80 rounded-3xl p-6 md:p-8 space-y-8 animate-in fade-in duration-200">
      <div className="space-y-8">
        
        {/* Back navigation header */}
        <div className="flex items-center justify-between border-b border-slate-900 pb-5">
          <button 
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Back to Rooms List
          </button>
          
          <span className="flex items-center gap-1 text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            {initialRoom ? 'Edit Room Configuration' : 'Room Wizard Panel'}
          </span>
        </div>

        {/* Wizard title */}
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-400">
            <Building size={12} /> {initialRoom ? 'Edit Physical Room' : 'Register Physical Room'}
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-none">
            {initialRoom ? 'Update Room Configuration' : 'Create Room & Configure Features'}
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {initialRoom 
              ? 'Modify room identifiers, floor settings, category rent rates, dynamic tags, and special promotions.'
              : 'Specify number, category types, pricing modifiers, custom discounts, and room features.'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Card 1: Core Configuration */}
            <div className="p-6 rounded-3xl bg-[#0f172a]/30 border border-slate-800/80 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Building size={14} />
                </span>
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-300">1. Core Room Properties</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wider mb-2">Room Number / Identifier *</label>
                  <input
                    type="text"
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 302 or A-12"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wider mb-2">Floor Number *</label>
                  <input
                    type="text"
                    required
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wider mb-2">Assign Category Type *</label>
                <select
                  required
                  value={roomTypeId}
                  onChange={(e) => setRoomTypeId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">Select Category</option>
                  {roomTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (Rent: ₹{t.baseRate}/night)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wider mb-2">Room Specifications / Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specify bed setup, window views or custom descriptors (e.g. Mountain View side, King size bed)..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                />
              </div>
            </div>

            {/* Card 2: Features Checklist & Dynamic Custom Features */}
            <div className="p-6 rounded-3xl bg-[#0f172a]/30 border border-slate-800/80 space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Sparkles size={14} />
                </span>
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-300">2. Features & Amenities Checklist</h3>
              </div>

              {/* Add Custom Amenity Tag */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-200 tracking-wider">Add Custom Feature/Amenity</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    placeholder="e.g. Jacuzzi, Ocean View, Smoking Room"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-black uppercase tracking-wider transition-colors shrink-0"
                  >
                    + Add Tag
                  </button>
                </div>
              </div>

              {/* Checklist Grid */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-200 uppercase tracking-wider border-t border-slate-900/60 pt-3">Select Active Features</label>
                <div className="flex flex-wrap gap-2.5">
                  {dynamicAmenities.map((name) => {
                    const Icon = getAmenityIcon(name);
                    const isSelected = selectedAmenities.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleAmenity(name)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black border tracking-wider transition-all uppercase ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon size={12} /> {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Pricing overrides & VIP status */}
          <div className="space-y-6">
            
            {/* Card 3: Custom Rates & Discount parameters */}
            <div className="p-6 rounded-3xl bg-[#0f172a]/30 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <DollarSign size={14} />
                </span>
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-300">3. Custom Pricing Override</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-1 text-[10px] font-black text-slate-200 uppercase tracking-wider mb-2">
                    <DollarSign size={12} className="text-slate-500" /> Custom Base Rate Override (INR)
                  </label>
                  <input
                    type="number"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    placeholder="Leave blank for category rate"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-indigo-400 font-extrabold text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Forces this specific room to have a custom base price, bypassing the default category rent.</p>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-[10px] font-black text-slate-200 uppercase tracking-wider mb-2">
                    <Percent size={12} className="text-slate-500" /> Special Room Discount (%)
                  </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="e.g. 10 for 10% off"
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-rose-400 font-extrabold text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[9px] text-slate-500 mt-1">Applies a default promotional discount rate directly to guest check-ins for this room.</p>
                </div>

                <div>
                  <label className="flex items-center gap-1 text-[10px] font-black text-slate-200 uppercase tracking-wider mb-2">
                    <Percent size={12} className="text-slate-500" /> Room GST Rate (%)
                  </label>
                  <select
                    value={gstRate}
                    onChange={(e) => setGstRate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-950 text-indigo-400 font-extrabold text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="0">0% - No GST Tax</option>
                    <option value="12">12% - Standard GST</option>
                    <option value="18">18% - Premium GST</option>
                    <option value="28">28% - Luxury GST</option>
                  </select>
                  <p className="text-[9px] text-slate-500 mt-1">Applies standard tax calculations during guest reservation billing.</p>
                </div>
                
                {/* VIP Toggle switch */}
                <div className="pt-2 border-t border-slate-900">
                  <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-900 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={isVIP}
                      onChange={(e) => setIsVIP(e.target.checked)}
                      className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 w-4 h-4"
                    />
                    <div className="space-y-0.5">
                      <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 uppercase tracking-wider">
                        <Star size={10} className="fill-amber-400 text-amber-400" /> VIP Status Room
                      </span>
                      <p className="text-[8px] text-slate-500 font-bold leading-normal">Assign premium tag styling and VIP guest flags.</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Submit & Wizard Controls */}
            <div className="p-6 rounded-3xl bg-[#0f172a]/30 border border-slate-800/80 space-y-4">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                <Info size={11} /> Confirming will instantly apply these configuration settings to active desk inventory.
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/35 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Saving...
                    </>
                  ) : (
                    initialRoom ? 'Save Updates' : 'Publish & Launch Room'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>

        </form>
      </div>
    </div>
  );
}
