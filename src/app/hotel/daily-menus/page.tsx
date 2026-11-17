'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed, ChefHat, Clock, MapPin, Sparkles, CheckCircle2,
  Plus, Trash2, Save, RefreshCw, Eye, AlertCircle, Coffee,
  Sun, Moon, Sunset, Check, Layers, ArrowRight, ShieldCheck,
  Users, Search, Printer, Tv, ConciergeBell, BedDouble, Phone,
  Calendar, Building2, Filter, ChevronDown, CheckCheck, ArrowLeft
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

interface GuestRoomMealInfo {
  checkInId: string;
  reservationId?: string;
  roomId: string;
  roomNumber: string;
  roomType: string;
  floor?: string;
  guestName: string;
  guestMobile: string;
  mealPlanCode: string; // 'CP' | 'MAP' | 'AP' | 'EP' | 'RO'
  mealPlanLabel: string;
  mealsIncluded: string[];
  adults: number;
  children: number;
  pax: number;
  checkedInAt: string;
  expectedCheckoutAt?: string;
}

const TEMPLATES: Record<string, MenuItem[]> = {
  'South Indian Breakfast': [
    { name: 'Idli & Medu Vada', category: 'South Indian', isVeg: true, description: 'With coconut chutney & sambar' },
    { name: 'Masala Dosa', category: 'Live Counter', isVeg: true, description: 'Fresh hot dosa with potato filling' },
    { name: 'Upma with Cashews', category: 'Breakfast', isVeg: true, description: 'Hot semolina with roasted nuts' },
    { name: 'Filter Coffee & Masala Chai', category: 'Tea & Coffee', isVeg: true, description: 'Hot fresh coffee and tea' },
    { name: 'Fresh Cut Fruits', category: 'Fruits', isVeg: true, description: 'Papaya, pineapple, watermelon' },
  ],
  'North Indian Breakfast': [
    { name: 'Aloo & Paneer Paratha', category: 'Paratha', isVeg: true, description: 'Served with fresh curd & butter' },
    { name: 'Masala Omelette & Boiled Eggs', category: 'Eggs', isVeg: false, description: 'Made fresh on order' },
    { name: 'Poha with Sev', category: 'Breakfast', isVeg: true, description: 'Flattened rice with roasted peanuts' },
    { name: 'Hot Masala Chai', category: 'Tea & Coffee', isVeg: true, description: 'Fresh brewed cardamom tea' },
  ],
  'Lunch Buffet': [
    { name: 'Paneer Butter Masala', category: 'Main Dish', isVeg: true, description: 'Soft paneer in rich tomato gravy' },
    { name: 'Chicken Dum Biryani', category: 'Rice & Biryani', isVeg: false, description: 'Aromatic basmati rice with chicken' },
    { name: 'Dal Makhani', category: 'Dal', isVeg: true, description: 'Slow cooked black dal with butter' },
    { name: 'Tandoori Roti & Naan', category: 'Breads', isVeg: true, description: 'Fresh hot breads' },
    { name: 'Jeera Rice & Raita', category: 'Rice', isVeg: true, description: 'Cumin rice with seasoned curd' },
    { name: 'Gulab Jamun', category: 'Sweet', isVeg: true, description: 'Hot sweet dumplings in syrup' },
  ],
  'Dinner Spread': [
    { name: 'Paneer Tikka', category: 'Starters', isVeg: true, description: 'Tandoori grilled paneer cubes' },
    { name: 'Tandoori Chicken', category: 'Starters', isVeg: false, description: 'Charcoal grilled spicy chicken' },
    { name: 'Kadhai Paneer', category: 'Main Dish', isVeg: true, description: 'Paneer with capsicum & gravy' },
    { name: 'Butter Chicken', category: 'Main Dish', isVeg: false, description: 'Boneless chicken in butter gravy' },
    { name: 'Yellow Dal Tadka', category: 'Dal', isVeg: true, description: 'Desi ghee tempered dal' },
    { name: 'Veg Dum Biryani', category: 'Rice & Biryani', isVeg: true, description: 'Fragrant rice with fresh vegetables' },
    { name: 'Butter Naan & Laccha Paratha', category: 'Breads', isVeg: true, description: 'Fresh hot breads from tandoor' },
    { name: 'Rasmalai & Ice Cream', category: 'Sweet', isVeg: true, description: 'Cold dessert sweet' },
  ],
};

const SIMPLE_PLAN_NAMES: Record<string, { short: string; simpleName: string; badge: string; mealsNote: string }> = {
  CP: {
    short: 'CP',
    simpleName: 'Free Breakfast (CP Plan)',
    badge: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40',
    mealsNote: 'Free Breakfast Included',
  },
  MAP: {
    short: 'MAP',
    simpleName: 'Breakfast + Dinner (MAP Plan)',
    badge: 'text-purple-300 bg-purple-500/15 border-purple-500/40',
    mealsNote: 'Free Breakfast & Dinner Included',
  },
  AP: {
    short: 'AP',
    simpleName: 'All 3 Meals Included (AP Plan)',
    badge: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
    mealsNote: 'Free Breakfast, Lunch & Dinner Included',
  },
  EP: {
    short: 'EP / Room Only',
    simpleName: 'Room Only - No Free Food (EP Plan)',
    badge: 'text-slate-400 bg-slate-800 border-slate-700',
    mealsNote: 'Food on Extra Charge',
  },
  RO: {
    short: 'Room Only',
    simpleName: 'Room Only - No Free Food (RO)',
    badge: 'text-slate-400 bg-slate-800 border-slate-700',
    mealsNote: 'Food on Extra Charge',
  },
};

export default function DailyMenusPage() {
  const [activeTab, setActiveTab] = useState<'MENUS' | 'GUEST_PLANS'>('MENUS');

  // Daily Buffet Menus State
  const [spreads, setSpreads] = useState<MealSpread[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'BREAKFAST' | 'LUNCH' | 'DINNER' | 'HI_TEA'>('BREAKFAST');
  const [previewMode, setPreviewMode] = useState(false);

  // New item draft inputs
  const [newItemName, setNewItemName] = useState('');
  const [newItemCat, setNewItemCat] = useState('Main Dish');
  const [newItemVeg, setNewItemVeg] = useState(true);
  const [newItemDesc, setNewItemDesc] = useState('');

  // Guest Meal Plans State
  const [guestRooms, setGuestRooms] = useState<GuestRoomMealInfo[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('ALL');
  const [updatingPlanReservationId, setUpdatingPlanReservationId] = useState<string | null>(null);

  // Property info & printable date
  const [propertyName, setPropertyName] = useState('Hotel & Resort');
  const [currentDateTime, setCurrentDateTime] = useState({ date: '', time: '' });

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

  // Fetch active guests & their meal plans
  const loadGuestMealPlans = useCallback(async () => {
    setGuestLoading(true);
    try {
      const res = await fetch('/api/hotel/meal-display');
      const data = await res.json();
      if (data.success && Array.isArray(data.data?.rooms)) {
        setGuestRooms(data.data.rooms);
      }
    } catch {
      toast.error('Failed to load customer meal plans');
    } finally {
      setGuestLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenus();
    loadGuestMealPlans();

    // Set printable timestamp
    const now = new Date();
    setCurrentDateTime({
      date: now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    });

    // Fetch Property Name
    fetch('/api/setup/properties')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setPropertyName(d.data[0].name || 'Hotel & Resort');
        }
      })
      .catch(() => {});
  }, [loadGuestMealPlans]);

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
        toast.success("Menu saved! Showing on all guest room tablets. 🚀");
      } else {
        toast.error(data.message || 'Failed to save menu');
      }
    } catch {
      toast.error('Error saving menu');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) {
      toast.error('Please type a dish name');
      return;
    }
    const item: MenuItem = {
      name: newItemName.trim(),
      category: newItemCat.trim() || 'Food',
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
    toast.success(`Added ${tItems.length} dishes from ${templateName}`);
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

  // Quick Change Meal Plan for a customer
  const handleUpdateGuestMealPlan = async (reservationId: string | undefined, newPlan: string) => {
    if (!reservationId) {
      toast.error('Reservation ID not found');
      return;
    }
    setUpdatingPlanReservationId(reservationId);
    try {
      const res = await fetch('/api/hotel/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reservationId,
          mealPlan: newPlan,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Plan updated to ${newPlan}!`);
        loadGuestMealPlans();
      } else {
        toast.error(data.error || 'Failed to update plan');
      }
    } catch {
      toast.error('Failed to update plan');
    } finally {
      setUpdatingPlanReservationId(null);
    }
  };

  // Simple Metrics
  const totalGuestsCount = guestRooms.reduce((s, r) => s + (Number(r.pax) || 1), 0);
  const totalRoomsCount = guestRooms.length;

  const breakfastCount = guestRooms
    .filter((r) => ['CP', 'MAP', 'AP'].includes((r.mealPlanCode || '').toUpperCase()))
    .reduce((s, r) => s + (Number(r.pax) || 1), 0);

  const lunchCount = guestRooms
    .filter((r) => ['AP'].includes((r.mealPlanCode || '').toUpperCase()))
    .reduce((s, r) => s + (Number(r.pax) || 1), 0);

  const dinnerCount = guestRooms
    .filter((r) => ['MAP', 'AP'].includes((r.mealPlanCode || '').toUpperCase()))
    .reduce((s, r) => s + (Number(r.pax) || 1), 0);

  const roomOnlyCount = guestRooms
    .filter((r) => ['EP', 'RO'].includes((r.mealPlanCode || 'RO').toUpperCase()))
    .reduce((s, r) => s + (Number(r.pax) || 1), 0);

  // Filtered Guest Rooms
  const filteredGuestRooms = guestRooms.filter((r) => {
    const plan = (r.mealPlanCode || 'RO').toUpperCase();
    if (selectedPlanFilter !== 'ALL') {
      if (selectedPlanFilter === 'ROOM_ONLY') {
        if (plan !== 'EP' && plan !== 'RO') return false;
      } else if (plan !== selectedPlanFilter) {
        return false;
      }
    }

    if (guestSearch.trim()) {
      const q = guestSearch.toLowerCase().trim();
      const matchRoom = r.roomNumber.toLowerCase().includes(q);
      const matchGuest = r.guestName.toLowerCase().includes(q);
      const matchMobile = r.guestMobile && r.guestMobile.includes(q);
      if (!matchRoom && !matchGuest && !matchMobile) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center flex-col gap-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-slate-400 text-sm font-semibold">Loading food menu & customer plans...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 p-3 sm:p-6 lg:p-8 font-sans print:min-h-0 print:bg-white print:text-black print:p-0 print:m-0">
      <Toaster richColors position="top-right" theme="dark" />

      <div className="max-w-7xl mx-auto space-y-5 print:max-w-none print:m-0 print:space-y-0">
        {/* ━━━ Breadcrumb (Hidden in print) ━━━ */}
        <div className="flex items-center gap-2 text-xs text-slate-400 print:hidden">
          <Link
            href="/hotel"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition font-medium"
          >
            <ArrowLeft size={13} className="text-amber-400" />
            <span>Back to Hotel Hub</span>
          </Link>
          <span>/</span>
          <span className="text-slate-200 font-semibold">Daily Food Menus & Customer Plans</span>
        </div>

        {/* ━━━ Header (Hidden in print) ━━━ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl print:hidden">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  Today&apos;s Food Menu & Customer Meal Plans
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold uppercase">
                    Live on Tablets
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Set today&apos;s Breakfast, Lunch & Dinner menu for guest room tablets, and see which rooms have free meals included.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/hotel/pos/meal-display"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-cyan-300 flex items-center gap-1.5 transition"
              title="Open Live Kitchen TV Screen"
            >
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>Live Kitchen Screen</span>
            </Link>

            <Link
              href="/hotel/meal-and-service-hub"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 hover:text-amber-300 flex items-center gap-1.5 transition"
              title="Open Meal & Service Hub"
            >
              <ConciergeBell className="w-3.5 h-3.5 text-amber-400" />
              <span>Meal Service Hub</span>
            </Link>

            {activeTab === 'MENUS' && (
              <>
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span>{previewMode ? 'Edit Mode' : 'Tablet Preview'}</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{saving ? 'Saving...' : 'Save & Show on Tablets'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ━━━ Main Tabs (Simple & Clear) (Hidden in print) ━━━ */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('MENUS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'MENUS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>1. Set Food Menus (Breakfast, Lunch, Dinner)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('GUEST_PLANS');
              loadGuestMealPlans();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'GUEST_PLANS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Customer Meal Plans (Who Gets Free Food)</span>
            {guestRooms.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-black">
                {guestRooms.length} Rooms
              </span>
            )}
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 1: SET FOOD MENUS (BREAKFAST, LUNCH, DINNER)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'MENUS' && (
          <div className="space-y-6 print:hidden">
            {/* Meal Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {[
                { type: 'BREAKFAST' as const, label: 'Breakfast Menu', icon: Sun, timing: '07:30 AM to 10:30 AM', defaultPlans: 'CP, MAP, AP' },
                { type: 'LUNCH' as const, label: 'Lunch Menu', icon: Sunset, timing: '12:30 PM to 03:30 PM', defaultPlans: 'AP' },
                { type: 'DINNER' as const, label: 'Dinner Menu', icon: Moon, timing: '07:30 PM to 11:00 PM', defaultPlans: 'MAP, AP' },
                { type: 'HI_TEA' as const, label: 'Evening Tea & Snacks', icon: Coffee, timing: '04:30 PM to 06:30 PM', defaultPlans: 'Extra Charge' },
              ].map((m) => {
                const spread = spreads.find((s) => s.mealType === m.type);
                const isSelected = selectedMealType === m.type;
                const itemsCount = spread?.items?.length || 0;
                const Icon = m.icon;

                return (
                  <div
                    key={m.type}
                    onClick={() => setSelectedMealType(m.type)}
                    className={`p-4 rounded-2xl border transition cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-800 border-amber-500 shadow-lg ring-1 ring-amber-500/30'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
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
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {itemsCount} {itemsCount === 1 ? 'Dish' : 'Dishes'}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">Free in:</span>
                      <span className="font-bold text-amber-400">
                        {(spread?.coveredInPlans || []).join(', ') || m.defaultPlans}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Main Menu Configuration */}
            {activeSpread && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Details & Dish List */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Basic Details Box */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{activeSpread.mealType} Details</span>
                      </h2>
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
                        <span className="text-xs text-slate-300 font-bold">Show on Room Tablets Today:</span>
                        <input
                          type="checkbox"
                          checked={activeSpread.isAvailable}
                          onChange={(e) => updateActiveSpread((s) => ({ ...s, isAvailable: e.target.checked }))}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-slate-900 border-slate-700"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                          Menu Heading / Name
                        </label>
                        <input
                          type="text"
                          value={activeSpread.title}
                          onChange={(e) => updateActiveSpread((s) => ({ ...s, title: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                          placeholder="e.g. Today's Breakfast Menu"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                          Food Serving Time
                        </label>
                        <input
                          type="text"
                          value={activeSpread.timings}
                          onChange={(e) => updateActiveSpread((s) => ({ ...s, timings: e.target.value }))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                          placeholder="e.g. 07:30 AM to 10:30 AM"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Where to Eat (Dining Area)
                      </label>
                      <input
                        type="text"
                        value={activeSpread.venue}
                        onChange={(e) => updateActiveSpread((s) => ({ ...s, venue: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                        placeholder="e.g. Hotel Restaurant & Room Service"
                      />
                    </div>

                    {/* Meal Plan Inclusion Buttons */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Which plans get this food for free?
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { id: 'CP', name: 'CP Plan (Breakfast)' },
                          { id: 'MAP', name: 'MAP Plan (Breakfast + Dinner)' },
                          { id: 'AP', name: 'AP Plan (All 3 Meals)' },
                          { id: 'EP', name: 'EP Plan (Room Only)' },
                        ].map((p) => {
                          const isIncluded = activeSpread.coveredInPlans?.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggleMealPlan(p.id)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                                isIncluded
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {isIncluded && <Check className="w-3.5 h-3.5 text-amber-400" />}
                              <span>{p.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1.5">
                        Guests with these plans will see &quot;✓ Free in your Meal Plan&quot; on their room tablet.
                      </p>
                    </div>
                  </div>

                  {/* Dishes Section */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h3 className="text-sm font-black text-white flex items-center gap-2">
                          <UtensilsCrossed className="w-4 h-4 text-emerald-400" />
                          <span>Today&apos;s Dishes ({activeSpread.items?.length || 0})</span>
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          These dishes will show on in-room guest tablets.
                        </p>
                      </div>

                      {/* Quick Add Templates */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Quick Add:</span>
                        {Object.keys(TEMPLATES).map((tmpl) => (
                          <button
                            key={tmpl}
                            type="button"
                            onClick={() => handleApplyTemplate(tmpl)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 transition"
                          >
                            + {tmpl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Dish Items List */}
                    <div className="space-y-2">
                      {(activeSpread.items || []).length === 0 ? (
                        <div className="p-8 text-center rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs">
                          No dishes added yet for {activeSpread.mealType}. Add dishes below or click a Quick Add button above!
                        </div>
                      ) : (
                        (activeSpread.items || []).map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 ${
                                  it.isVeg ? 'border-emerald-500' : 'border-rose-500'
                                }`}
                                title={it.isVeg ? 'Veg' : 'Non-Veg'}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${it.isVeg ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              </span>
                              <div>
                                <span className="text-xs font-bold text-white block">{it.name}</span>
                                {it.description && (
                                  <span className="text-[10px] text-slate-400 block">{it.description}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {it.category && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                                  {it.category}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center transition"
                                title="Delete dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Dish Form */}
                    <form onSubmit={handleAddItem} className="pt-3 border-t border-slate-800 space-y-3">
                      <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                        <span>Add Another Dish to Menu</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <input
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="Dish name (e.g. Masala Dosa, Dal Makhani, Paneer Tikka...)"
                          className="sm:col-span-6 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                        <input
                          type="text"
                          value={newItemCat}
                          onChange={(e) => setNewItemCat(e.target.value)}
                          placeholder="Type (e.g. Main Dish, Bread, Sweet)"
                          className="sm:col-span-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                        <div className="sm:col-span-3 flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newItemVeg}
                              onChange={(e) => setNewItemVeg(e.target.checked)}
                              className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-800 border-slate-700"
                            />
                            <span>Pure Veg</span>
                          </label>
                          <button
                            type="submit"
                            className="ml-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={newItemDesc}
                        onChange={(e) => setNewItemDesc(e.target.value)}
                        placeholder="Optional short detail (e.g. Served with fresh mint chutney and butter)"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                      />
                    </form>
                  </div>
                </div>

                {/* Right Col: Tablet Live Preview */}
                <div className="space-y-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sticky top-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-sky-400" />
                        <h3 className="text-xs font-black uppercase text-white">
                          Guest Tablet Preview
                        </h3>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 font-bold">
                        What Guest Sees
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-950 p-4 border border-slate-800 shadow-xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                          <ChefHat className="w-3.5 h-3.5" />
                          {activeSpread.title || 'Food Menu'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {activeSpread.timings}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{activeSpread.venue || 'Hotel Dining Area'}</span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Free in: <b>{(activeSpread.coveredInPlans || []).join(', ') || 'CP, MAP, AP'}</b></span>
                      </div>

                      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                        {(activeSpread.items || []).map((it, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${it.isVeg ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              <span className="text-slate-200 font-medium">{it.name}</span>
                            </div>
                            <span className="text-[9px] text-slate-500">{it.category}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            TAB 2: CUSTOMER MEAL PLANS (WHO GETS FREE FOOD)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {activeTab === 'GUEST_PLANS' && (
          <div className="space-y-5 print:space-y-3">
            {/* ━━━ DEDICATED PRINT-ONLY SHEET HEADER ━━━ */}
            <div className="hidden print:block text-black mb-3">
              <div className="border-b-2 border-black pb-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-black uppercase tracking-wider text-black">{propertyName}</h1>
                    <h2 className="text-sm font-black uppercase tracking-wide text-slate-800 mt-0.5">
                      Daily In-House Guest Meal Plan Roster
                    </h2>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Kitchen & Dining Verification Sheet • Free Food Eligibility
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-black text-sm">{currentDateTime.date || 'Today'}</p>
                    <p className="text-slate-600 text-[11px] mt-0.5">Printed: {currentDateTime.time}</p>
                    <span className="inline-block px-2 py-0.5 mt-1 border border-black font-bold text-[9px] uppercase tracking-wider">
                      Kitchen / Service Copy
                    </span>
                  </div>
                </div>
              </div>

              {/* Compact Meal Pax Summary Bar */}
              <div className="mt-2.5 border border-black grid grid-cols-5 divide-x divide-black text-center text-xs">
                <div className="p-1.5">
                  <div className="text-[9px] font-bold uppercase text-slate-600">Total Staying</div>
                  <div className="text-xs font-black mt-0.5">{totalGuestsCount} Pax</div>
                  <div className="text-[9px] text-slate-500">{totalRoomsCount} Rooms</div>
                </div>
                <div className="p-1.5 bg-slate-100">
                  <div className="text-[9px] font-bold uppercase text-slate-700">Free Breakfast</div>
                  <div className="text-xs font-black mt-0.5">{breakfastCount} Pax</div>
                  <div className="text-[9px] text-slate-500">CP, MAP, AP</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[9px] font-bold uppercase text-slate-600">Free Lunch</div>
                  <div className="text-xs font-black mt-0.5">{lunchCount} Pax</div>
                  <div className="text-[9px] text-slate-500">AP (All 3 Meals)</div>
                </div>
                <div className="p-1.5 bg-slate-100">
                  <div className="text-[9px] font-bold uppercase text-slate-700">Free Dinner</div>
                  <div className="text-xs font-black mt-0.5">{dinnerCount} Pax</div>
                  <div className="text-[9px] text-slate-500">MAP & AP</div>
                </div>
                <div className="p-1.5">
                  <div className="text-[9px] font-bold uppercase text-slate-600">Room Only (Pay)</div>
                  <div className="text-xs font-black mt-0.5">{roomOnlyCount} Pax</div>
                  <div className="text-[9px] text-slate-500">EP / RO Plan</div>
                </div>
              </div>
            </div>

            {/* Simple KPI Cards (Persons / Pax Count) (Hidden in print) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 print:hidden">
              {/* Total In-House Guests */}
              <div className="rounded-2xl p-4 bg-slate-900 border border-slate-800 shadow-md">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Total Staying Guests</span>
                <p className="text-2xl font-black text-white font-mono">{totalGuestsCount} <span className="text-xs font-normal text-slate-400">Persons</span></p>
                <p className="text-[10px] text-slate-400 mt-1">{totalRoomsCount} Active Rooms</p>
              </div>

              {/* Free Breakfast Guests */}
              <div className="rounded-2xl p-4 bg-emerald-950/20 border border-emerald-500/30 shadow-md">
                <span className="text-[10px] font-black uppercase text-emerald-400 block mb-1">Free Breakfast Guests</span>
                <p className="text-2xl font-black text-emerald-300 font-mono">{breakfastCount} <span className="text-xs font-normal text-emerald-400/80">Persons</span></p>
                <p className="text-[10px] text-emerald-400/70 mt-1">CP, MAP & AP Plan</p>
              </div>

              {/* Free Lunch Guests */}
              <div className="rounded-2xl p-4 bg-sky-950/20 border border-sky-500/30 shadow-md">
                <span className="text-[10px] font-black uppercase text-sky-400 block mb-1">Free Lunch Guests</span>
                <p className="text-2xl font-black text-sky-300 font-mono">{lunchCount} <span className="text-xs font-normal text-sky-400/80">Persons</span></p>
                <p className="text-[10px] text-sky-400/70 mt-1">AP Plan (All 3 Meals)</p>
              </div>

              {/* Free Dinner Guests */}
              <div className="rounded-2xl p-4 bg-purple-950/20 border border-purple-500/30 shadow-md">
                <span className="text-[10px] font-black uppercase text-purple-400 block mb-1">Free Dinner Guests</span>
                <p className="text-2xl font-black text-purple-300 font-mono">{dinnerCount} <span className="text-xs font-normal text-purple-400/80">Persons</span></p>
                <p className="text-[10px] text-purple-400/70 mt-1">MAP & AP Plan</p>
              </div>

              {/* Room Only Guests */}
              <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800 shadow-md col-span-2 lg:col-span-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Room Only (Pay for Food)</span>
                <p className="text-2xl font-black text-slate-300 font-mono">{roomOnlyCount} <span className="text-xs font-normal text-slate-400">Persons</span></p>
                <p className="text-[10px] text-slate-500 mt-1">EP / RO Plan</p>
              </div>
            </div>

            {/* Filter Pills & Search (Hidden in print) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 print:hidden">
              {/* Plan Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'ALL', label: 'All Rooms', count: guestRooms.length },
                  { id: 'CP', label: 'Free Breakfast (CP)', count: guestRooms.filter(r => r.mealPlanCode === 'CP').length },
                  { id: 'MAP', label: 'Breakfast + Dinner (MAP)', count: guestRooms.filter(r => r.mealPlanCode === 'MAP').length },
                  { id: 'AP', label: 'All 3 Meals (AP)', count: guestRooms.filter(r => r.mealPlanCode === 'AP').length },
                  { id: 'ROOM_ONLY', label: 'Room Only (No Food)', count: guestRooms.filter(r => ['EP', 'RO'].includes((r.mealPlanCode || 'RO').toUpperCase())).length },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedPlanFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedPlanFilter === f.id
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-black/20 text-[10px]">
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Box & Print */}
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={guestSearch}
                    onChange={(e) => setGuestSearch(e.target.value)}
                    placeholder="Search Room #, Guest or Phone..."
                    className="w-full h-9 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={() => window.print()}
                  type="button"
                  className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
                  title="Print Today's Meal Plan List for Kitchen & Restaurant Staff"
                >
                  <Printer size={13} />
                  <span className="hidden md:inline">Print Sheet</span>
                </button>
              </div>
            </div>

            {/* Customer Meal Plans Table */}
            {guestLoading ? (
              <div className="p-16 text-center rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                <span className="text-sm font-bold text-slate-400">Loading guest plans...</span>
              </div>
            ) : filteredGuestRooms.length === 0 ? (
              <div className="p-16 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-2 print:border-none print:p-8 print:bg-white">
                <BedDouble className="w-10 h-10 text-slate-600 mx-auto print:hidden" />
                <h3 className="text-sm font-bold text-white print:text-black">No Guests Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto print:text-slate-600">
                  Either no guests are currently checked in, or no room matches your search filter.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl print:rounded-none print:border-none print:shadow-none print:bg-white print:overflow-visible">
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-left border-collapse text-xs print:border print:border-black print:text-black">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-[10px] font-black text-slate-400 uppercase tracking-wider print:bg-slate-100 print:text-black print:border-b-2 print:border-black">
                        <th className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">Room #</th>
                        <th className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black">Guest Name & Mobile</th>
                        <th className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">Pax</th>
                        <th className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">Meal Plan</th>
                        <th className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">Breakfast</th>
                        <th className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">Lunch</th>
                        <th className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">Dinner</th>
                        <th className="px-4 py-3.5 text-right print:hidden">Change Plan</th>
                        <th className="hidden print:table-cell px-2.5 py-1.5 text-center print:border-black w-28">Dining Tick / Sign</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 print:divide-black">
                      {filteredGuestRooms.map((r) => {
                        const planCode = (r.mealPlanCode || 'RO').toUpperCase();
                        const info = SIMPLE_PLAN_NAMES[planCode] || SIMPLE_PLAN_NAMES['RO'];
                        const isUpdating = updatingPlanReservationId === r.reservationId;

                        const hasBreakfast = ['CP', 'MAP', 'AP'].includes(planCode);
                        const hasLunch = ['AP'].includes(planCode);
                        const hasDinner = ['MAP', 'AP'].includes(planCode);

                        return (
                          <tr key={r.checkInId} className="hover:bg-slate-800/40 transition print:hover:bg-transparent print:border-b print:border-black print-avoid-break">
                            {/* Room */}
                            <td className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">
                              <div className="flex items-center gap-2 print:inline-block">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-black text-amber-300 text-xs print:w-auto print:h-auto print:border-none print:p-0 print:bg-transparent print:text-black print:text-sm print:font-black">
                                  {r.roomNumber}
                                </div>
                                <div className="print:hidden">
                                  <span className="font-bold text-white block">Room {r.roomNumber}</span>
                                  <span className="text-[10px] text-slate-400">{r.roomType || 'Standard'}</span>
                                </div>
                              </div>
                            </td>

                            {/* Guest */}
                            <td className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black">
                              <span className="font-bold text-slate-200 block text-xs print:text-black print:font-bold">
                                {r.guestName || 'Hotel Guest'}
                              </span>
                              {r.guestMobile ? (
                                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5 print:text-[10px] print:text-slate-700">
                                  <Phone size={10} className="print:hidden" />
                                  <span>{r.guestMobile}</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">No phone</span>
                              )}
                            </td>

                            {/* Total Guests (Pax) */}
                            <td className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-bold text-white font-mono text-xs print:border-none print:bg-transparent print:p-0 print:text-black print:font-black">
                                <Users size={12} className="text-cyan-400 print:hidden" />
                                <span>{r.pax} Pax</span>
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 print:text-[9px] print:text-slate-600">
                                {r.adults}A {r.children > 0 ? `+ ${r.children}C` : ''}
                              </span>
                            </td>

                            {/* Meal Plan */}
                            <td className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${info.badge} print:bg-transparent print:border-none print:text-black print:p-0 print:font-black`}>
                                <CheckCheck size={12} className="print:hidden" />
                                <span>{info.short}</span>
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 print:text-[9px] print:text-slate-600">
                                {info.short === 'CP' ? 'Breakfast' : info.short === 'MAP' ? 'Bkfast+Dinner' : info.short === 'AP' ? 'All 3 Meals' : 'Room Only'}
                              </span>
                            </td>

                            {/* Breakfast */}
                            <td className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border print:p-0 print:border-none ${
                                  hasBreakfast
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 print:text-black print:font-black'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 opacity-60 print:text-slate-400 print:opacity-100'
                                }`}
                              >
                                <span className="print:hidden">☕ Breakfast </span>
                                {hasBreakfast ? '✓ FREE' : '— Extra'}
                              </span>
                            </td>

                            {/* Lunch */}
                            <td className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border print:p-0 print:border-none ${
                                  hasLunch
                                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/30 print:text-black print:font-black'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 opacity-60 print:text-slate-400 print:opacity-100'
                                }`}
                              >
                                <span className="print:hidden">🍲 Lunch </span>
                                {hasLunch ? '✓ FREE' : '— Extra'}
                              </span>
                            </td>

                            {/* Dinner */}
                            <td className="px-4 py-3.5 print:px-2.5 print:py-1.5 print:border-r print:border-black print:text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border print:p-0 print:border-none ${
                                  hasDinner
                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 print:text-black print:font-black'
                                    : 'bg-slate-800 text-slate-500 border-slate-700 opacity-60 print:text-slate-400 print:opacity-100'
                                }`}
                              >
                                <span className="print:hidden">🍽️ Dinner </span>
                                {hasDinner ? '✓ FREE' : '— Extra'}
                              </span>
                            </td>

                            {/* Change Plan Dropdown (Hidden in print) */}
                            <td className="px-4 py-3.5 text-right print:hidden">
                              {r.reservationId ? (
                                <select
                                  disabled={isUpdating}
                                  value={planCode}
                                  onChange={(e) => handleUpdateGuestMealPlan(r.reservationId, e.target.value)}
                                  className="h-8 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-white cursor-pointer focus:outline-none focus:border-amber-500 transition"
                                >
                                  <option value="EP">Room Only (No Free Food)</option>
                                  <option value="CP">CP (Free Breakfast)</option>
                                  <option value="MAP">MAP (Breakfast + Dinner)</option>
                                  <option value="AP">AP (All 3 Meals Included)</option>
                                </select>
                              ) : (
                                <span className="text-[10px] text-slate-500">Walk-in</span>
                              )}
                            </td>

                            {/* Staff Verification Blank Box (Print Only) */}
                            <td className="hidden print:table-cell px-2.5 py-1.5 text-center text-xs print:border-black">
                              <div className="h-5 border border-dashed border-slate-400 rounded"></div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Print Only Signatures & Verification Footer */}
                <div className="hidden print:flex items-end justify-between mt-6 pt-3 border-t border-black text-xs text-black">
                  <div>
                    <div className="font-bold">Prepared by: Front Desk PMS</div>
                    <div className="text-[10px] text-slate-600 mt-0.5">GuestFlow PMS • Daily Dining & Kitchen Operations Sheet</div>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-black w-44 mb-1">&nbsp;</div>
                    <div className="font-bold text-[10px]">Restaurant / Kitchen Captain Sign</div>
                  </div>
                  <div className="text-right">
                    <div className="border-b border-black w-44 mb-1">&nbsp;</div>
                    <div className="font-bold text-[10px]">Duty Manager / Front Desk Sign</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
