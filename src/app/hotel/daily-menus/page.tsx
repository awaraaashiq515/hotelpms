'use client';

import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, ChefHat, Clock, MapPin, Sparkles, CheckCircle2,
  Plus, Trash2, Save, RefreshCw, Eye, AlertCircle, Coffee,
  Sun, Moon, Sunset, Check, Layers, ArrowRight, ShieldCheck
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

interface MenuItem {
  name: string;
  category?: string;
  isVeg: boolean;
  description?: string;
}

interface MealSpread {
  id: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'HI_TEA';
  title: string;
  timings: string;
  venue: string;
  description?: string;
  isAvailable: boolean;
  coveredInPlans: string[];
  items: MenuItem[];
}

const TEMPLATES: Record<string, MenuItem[]> = {
  'South Indian Breakfast': [
    { name: 'Steaming Hot Idli & Medu Vada', category: 'South Indian', isVeg: true, description: 'Served with homemade coconut chutney & drumstick sambar' },
    { name: 'Crispy Mysore Masala Dosa', category: 'Live Counter', isVeg: true, description: 'Golden crepe filled with spiced potato masala' },
    { name: 'Upma with Cashews & Podi', category: 'Light Bites', isVeg: true, description: 'Roasted semolina tempered with mustard seeds & curry leaves' },
    { name: 'South Indian Filter Coffee', category: 'Hot Brews', isVeg: true, description: 'Authentic frothy chicory filter brew' },
    { name: 'Fresh Cut Seasonal Fruits', category: 'Healthy & Fresh', isVeg: true, description: 'Papaya, pineapple, watermelon slices' },
  ],
  'North Indian Breakfast': [
    { name: 'Amritsari Aloo & Paneer Paratha', category: 'North Indian', isVeg: true, description: 'Served with fresh curd, butter dollop & homemade pickle' },
    { name: 'Fluffy Masala Omelette & Scrambled Eggs', category: 'Live Counter', isVeg: false, description: 'Made to order with cheese, onions, green chillies' },
    { name: 'Indori Poha with Sev & Anar', category: 'Light Bites', isVeg: true, description: 'Flattened rice tempered with peanuts & pomegranate' },
    { name: 'Ginger Cardamom Masala Chai', category: 'Hot Brews', isVeg: true, description: 'Freshly brewed aromatic Indian milk tea' },
  ],
  'Royal Lunch Buffet': [
    { name: 'Paneer Butter Masala', category: 'Main Course', isVeg: true, description: 'Cottage cheese cubes simmered in rich makhani gravy' },
    { name: 'Murgh Dum Biryani', category: 'Main Course', isVeg: false, description: 'Fragrant Basmati rice cooked with tender chicken & royal spices' },
    { name: 'Slow-Cooked Dal Makhani', category: 'Main Course', isVeg: true, description: 'Black lentils slow-cooked overnight with white butter' },
    { name: 'Butter Tandoori Roti & Garlic Naan', category: 'Breads', isVeg: true, description: 'Fresh from clay oven' },
    { name: 'Jeera Pulao & Boondi Raita', category: 'Rice', isVeg: true, description: 'Aromatic cumin rice with spiced yogurt' },
    { name: 'Warm Gulab Jamun & Rabri', category: 'Dessert', isVeg: true, description: 'Golden dumplings in rose syrup with thick rabri' },
  ],
  'Grand Dinner Spread': [
    { name: 'Paneer Tikka Angara', category: 'Starters', isVeg: true, description: 'Smoky char-grilled cottage cheese with bell peppers' },
    { name: 'Tandoori Murgh (Half)', category: 'Starters', isVeg: false, description: 'Tender chicken marinated in yogurt & Kashmiri red chillies' },
    { name: 'Kadhai Paneer', category: 'Main Course', isVeg: true, description: 'Cottage cheese tossed with crushed coriander & robust gravy' },
    { name: 'Butter Chicken Masala', category: 'Main Course', isVeg: false, description: 'Signature Delhi style boneless chicken in satin smooth gravy' },
    { name: 'Yellow Dal Tadka Double Chaunk', category: 'Main Course', isVeg: true, description: 'Yellow lentils tempered with desi ghee, garlic & cumin' },
    { name: 'Hyderabadi Subz Dum Biryani', category: 'Biryani', isVeg: true, description: 'Basmati rice infused with saffron & caramelized onions' },
    { name: 'Assorted Breads Basket', category: 'Breads', isVeg: true, description: 'Laccha Paratha, Garlic Naan & Missi Roti' },
    { name: 'Kesar Rasmalai & Chocolate Brownie', category: 'Dessert', isVeg: true, description: 'Spongy cottage cheese patties in saffron milk + warm brownie' },
  ],
};

export default function DailyMenusPage() {
  const [spreads, setSpreads] = useState<MealSpread[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'HI_TEA'>('BREAKFAST');
  const [previewMode, setPreviewMode] = useState(false);

  // New item draft inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemCat, setNewItemCat] = useState('Main Course');
  const [newItemVeg, setNewItemVeg] = useState(true);
  const [newItemDesc, setNewItemDesc] = useState('');

  // Fetch spreads from API
  const loadMenus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hotel/daily-menus');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSpreads(data.data);
      }
    } catch {
      toast.error('Failed to load daily menus');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenus();
  }, []);

  const activeSpread = spreads.find((s) => s.mealType === selectedMealType) || spreads[0];

  const updateActiveSpread = (updater: (prev: MealSpread) => MealSpread) => {
    setSpreads((prev) =>
      prev.map((s) => (s.mealType === selectedMealType ? updater(s) : s))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/hotel/daily-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreads }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Today's meal menus published to all in-room tablets! 🚀");
      } else {
        toast.error(data.message || 'Failed to save daily menus');
      }
    } catch {
      toast.error('Network error saving daily menus');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.error('Please enter a dish name');
      return;
    }
    const item: MenuItem = {
      name: newItemName.trim(),
      category: newItemCat.trim() || 'General',
      isVeg: newItemVeg,
      description: newItemDesc.trim() || undefined,
    };

    updateActiveSpread((prev) => ({
      ...prev,
      items: [...prev.items, item],
    }));

    setNewItemName('');
    setNewItemDesc('');
    toast.success(`Added ${item.name}`);
  };

  const handleRemoveItem = (index: number) => {
    updateActiveSpread((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleApplyTemplate = (templateName: string) => {
    const tItems = TEMPLATES[templateName];
    if (!tItems) return;
    updateActiveSpread((prev) => ({
      ...prev,
      items: [...prev.items, ...tItems],
    }));
    toast.success(`Added ${tItems.length} items from ${templateName}`);
  };

  const toggleMealPlan = (plan: string) => {
    updateActiveSpread((prev) => {
      const exists = prev.coveredInPlans?.includes(plan);
      const updatedPlans = exists
        ? prev.coveredInPlans.filter((p) => p !== plan)
        : [...(prev.coveredInPlans || []), plan];
      return { ...prev, coveredInPlans: updatedPlans };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center flex-col gap-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Loading daily meal menus...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <Toaster richColors position="top-right" theme="dark" />

      {/* ━━━ Header ━━━ */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Today's Meal & Buffet Menus
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold uppercase tracking-wider">
                    Live on In-Room Tablets
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">
                  Define what is cooked today for Breakfast, Lunch & Dinner. Displays on all guest tablets with meal plan badges (EP, CP, MAP, AP).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-bold text-slate-300 flex items-center gap-2 transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              {previewMode ? 'Edit Mode' : 'Tablet Preview'}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Publishing...' : 'Publish to Tablets'}
            </button>
          </div>
        </div>

        {/* ━━━ Meal Cards Overview ━━━ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: 'BREAKFAST' as const, label: 'Breakfast Buffet', icon: Sun, color: 'amber', timing: '07:30 - 10:30 AM', defaultPlans: 'CP, MAP, AP' },
            { type: 'LUNCH' as const, label: 'Lunch Buffet', icon: Sunset, color: 'sky', timing: '12:30 - 03:30 PM', defaultPlans: 'AP' },
            { type: 'DINNER' as const, label: 'Dinner Spread', icon: Moon, color: 'purple', timing: '07:30 - 11:00 PM', defaultPlans: 'MAP, AP' },
            { type: 'HI_TEA' as const, label: 'Hi-Tea & Snacks', icon: Coffee, color: 'emerald', timing: '04:30 - 06:30 PM', defaultPlans: 'À la Carte' },
          ].map((m) => {
            const spread = spreads.find((s) => s.mealType === m.type);
            const isSelected = selectedMealType === m.type;
            const itemsCount = spread?.items?.length || 0;
            const Icon = m.icon;

            return (
              <div
                key={m.type}
                onClick={() => setSelectedMealType(m.type)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500/60 shadow-xl shadow-amber-500/10 ring-2 ring-amber-500/20'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-amber-500 text-black font-black' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-white">{m.label}</div>
                      <div className="text-[10px] text-slate-400">{spread?.timings || m.timing}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                    {itemsCount} {itemsCount === 1 ? 'Dish' : 'Dishes'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Included in:</span>
                  <span className="font-bold text-amber-400">
                    {(spread?.coveredInPlans || []).join(', ') || m.defaultPlans}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ━━━ Main Edit Section ━━━ */}
        {activeSpread && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Spread Configuration & Dish Items */}
            <div className="lg:col-span-2 space-y-6">
              {/* Spread Details Card */}
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">
                      {activeSpread.mealType} Configuration
                    </h2>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-slate-400 font-semibold">Active Today:</span>
                    <input
                      type="checkbox"
                      checked={activeSpread.isAvailable}
                      onChange={(e) => updateActiveSpread((s) => ({ ...s, isAvailable: e.target.checked }))}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900 bg-slate-800 border-slate-700"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Menu Title
                    </label>
                    <input
                      type="text"
                      value={activeSpread.title}
                      onChange={(e) => updateActiveSpread((s) => ({ ...s, title: e.target.value }))}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g. Royal Breakfast Buffet Spread"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                      Serving Timings
                    </label>
                    <input
                      type="text"
                      value={activeSpread.timings}
                      onChange={(e) => updateActiveSpread((s) => ({ ...s, timings: e.target.value }))}
                      className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g. 07:30 AM - 10:30 AM"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Dining Venue / Location
                  </label>
                  <input
                    type="text"
                    value={activeSpread.venue}
                    onChange={(e) => updateActiveSpread((s) => ({ ...s, venue: e.target.value }))}
                    className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Palm Grove Restaurant & In-Room Dining"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Included Free in Meal Plans (Guest Entitlement)
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['EP', 'CP', 'MAP', 'AP'].map((plan) => {
                      const isIncluded = activeSpread.coveredInPlans?.includes(plan);
                      return (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => toggleMealPlan(plan)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isIncluded
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {isIncluded && <Check className="w-3 h-3 text-amber-400" />}
                          {plan} Plan
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Guests with these plans will see "✓ Included Free in your Plan" on their in-room tablet.
                  </p>
                </div>
              </div>

              {/* Dishes List & Template Buttons */}
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                      Dishes on Today's {activeSpread.mealType} Menu ({activeSpread.items?.length || 0})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      These items will be visible to in-room guests.
                    </p>
                  </div>

                  {/* Template inserters */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Quick Add:</span>
                    {Object.keys(TEMPLATES).map((tmpl) => (
                      <button
                        key={tmpl}
                        type="button"
                        onClick={() => handleApplyTemplate(tmpl)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700/60 transition-all"
                      >
                        + {tmpl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Items Table / Cards */}
                <div className="space-y-2">
                  {(!activeSpread.items || activeSpread.items.length === 0) ? (
                    <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                      No dishes added yet for {activeSpread.mealType}. Add one below or click a quick preset.
                    </div>
                  ) : (
                    activeSpread.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span
                            className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                              item.isVeg
                                ? 'border-emerald-500 text-emerald-500'
                                : 'border-rose-500 text-rose-500'
                            }`}
                            title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{item.name}</span>
                              {item.category && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold border border-slate-700">
                                  {item.category}
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex-shrink-0"
                          title="Remove dish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add New Dish Form */}
                <form onSubmit={handleAddItem} className="pt-4 border-t border-slate-800/80 space-y-3">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-amber-400" /> Add Custom Dish to {activeSpread.mealType}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        required
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="Dish name (e.g. Masala Dosa with Chutneys)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <select
                        value={newItemCat}
                        onChange={(e) => setNewItemCat(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Live Counter">Live Counter</option>
                        <option value="Main Course">Main Course</option>
                        <option value="South Indian">South Indian</option>
                        <option value="North Indian">North Indian</option>
                        <option value="Breads">Breads</option>
                        <option value="Rice & Biryani">Rice & Biryani</option>
                        <option value="Starters">Starters</option>
                        <option value="Dessert">Dessert</option>
                        <option value="Beverages">Beverages</option>
                        <option value="Healthy & Fresh">Healthy & Fresh</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        placeholder="Description (optional, e.g. Served with sambar & 3 chutneys)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewItemVeg(!newItemVeg)}
                        className={`flex-1 py-2 px-2.5 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                          newItemVeg
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${newItemVeg ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {newItemVeg ? 'Veg' : 'Non-Veg'}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider transition-all"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Col: Live In-Room Tablet Simulator */}
            <div>
              <div className="sticky top-6 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-slate-300">In-Room Tablet Preview</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Room 102 · Kiosk</span>
                  </div>

                  {/* Tablet Screen Mock */}
                  <div className="rounded-2xl bg-[#030712] border border-slate-800 p-4 space-y-3">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-amber-400 font-bold uppercase tracking-wider">
                        ✨ Today's Dining Spread
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                        CP Plan Guest
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-black text-white">{activeSpread.title}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-amber-400" />
                            {activeSpread.timings}
                          </div>
                        </div>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30">
                          {activeSpread.coveredInPlans?.includes('CP') ? '✓ INCLUDED FREE' : 'À LA CARTE'}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-sky-400" />
                        {activeSpread.venue}
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-1 max-h-48 overflow-y-auto pr-1">
                        {(activeSpread.items || []).slice(0, 5).map((dish, i) => (
                          <div key={i} className="text-[10px] flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5 truncate">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dish.isVeg ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              <span className="truncate">{dish.name}</span>
                            </span>
                            <span className="text-[8px] text-slate-500 ml-1 flex-shrink-0">{dish.category}</span>
                          </div>
                        ))}
                        {(activeSpread.items?.length || 0) > 5 && (
                          <div className="text-[9px] text-center text-amber-400 pt-1 font-bold">
                            + {(activeSpread.items?.length || 0) - 5} more items
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex gap-1.5">
                        <button
                          type="button"
                          className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-black uppercase tracking-wider text-center"
                        >
                          Pre-Order to Room
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 text-center">
                    Whenever you click "Publish to Tablets", this exact layout updates instantly for all active guests.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
