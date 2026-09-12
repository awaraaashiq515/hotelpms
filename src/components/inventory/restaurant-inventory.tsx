'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Package,
  Plus,
  Search,
  Edit2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart2,
  ArrowUpCircle,
  ClipboardList,
  RefreshCw,
  Layers,
  CheckCircle,
  X,
  ArrowDownCircle,
  UtensilsCrossed,
  Filter,
  Trash2,
  Sparkles,
  Loader2,
  Info,
  ChefHat
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { inventoryApi, StockItem, StockMovement } from '@/lib/api/inventory';
import { productsApi, Product } from '@/lib/api/products';

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
  OPENING: { label: 'Opening', color: 'text-pos-primary bg-pos-primary/10' },
  PURCHASE_IN: { label: 'Purchase In', color: 'text-green-600 bg-green-50' },
  SALE_OUT: { label: 'Sale Out', color: 'text-red-600 bg-red-50' },
  ADJUSTMENT_IN: { label: 'Adj (+)', color: 'text-emerald-600 bg-emerald-50' },
  ADJUSTMENT_OUT: { label: 'Adj (-)', color: 'text-orange-600 bg-orange-50' },
  TRANSFER: { label: 'Transfer', color: 'text-purple-600 bg-purple-50' },
  REVERSE_SALE: { label: 'Reverse Sale', color: 'text-pos-primary bg-pos-primary/10' },
};

export default function RestaurantInventory({ propertyCode: propCodeProp }: { propertyCode?: string } = {}) {
  const params = useParams();
  const propertyCode = propCodeProp || (params?.propertyCode as string) || '';

  const [tab, setTab] = useState<'items' | 'movements' | 'stock-in' | 'adjustments' | 'low-stock' | 'mapping'>('items');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [loadingItems, setLoadingItems] = useState(true);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '', sku: '', unit: '', openingStock: '', reorderLevel: '', minimumStock: '', costPrice: '', itemType: 'RESTAURANT'
  });
  const [savingItem, setSavingItem] = useState(false);

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movTotal, setMovTotal] = useState(0);
  const [loadingMov, setLoadingMov] = useState(false);

  const [stockInForm, setStockInForm] = useState({ stockItemId: '', qty: '', unitCost: '', movementType: 'PURCHASE_IN' });
  const [stockInLoading, setStockInLoading] = useState(false);
  const [stockInSuccess, setStockInSuccess] = useState(false);

  const [adjForm, setAdjForm] = useState({ stockItemId: '', physicalQty: '', reason: '' });
  const [adjLoading, setAdjLoading] = useState(false);
  const [adjResult, setAdjResult] = useState<null | { diff: number; physicalQty: number }>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [mappingLoading, setMappingLoading] = useState<string>('');
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [recipeProduct, setRecipeProduct] = useState<any>(null);
  const [recipeIngredients, setRecipeIngredients] = useState<any[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [seedingDefaults, setSeedingDefaults] = useState(false);
  const [seedingRecipes, setSeedingRecipes] = useState(false);
  const [settingUpFull, setSettingUpFull] = useState(false);
  const [suggestedRecipe, setSuggestedRecipe] = useState<any>(null);
  const [mappingSearch, setMappingSearch] = useState('');
  const [mappingCategory, setMappingCategory] = useState('All');
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const fetchStockItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const data = await inventoryApi.listStockItems({
        search: itemSearch,
        itemType: 'RESTAURANT',
        ...(propertyCode ? { propertyId: propertyCode } : {}),
      });
      setStockItems(data || []);
    } catch { setStockItems([]); }
    finally { setLoadingItems(false); }
  }, [itemSearch, propertyCode]);

  const fetchMovements = useCallback(async () => {
    setLoadingMov(true);
    try {
      const data = await inventoryApi.listMovements();
      // Filter for restaurant items only if possible, or show all
      setMovements(data.movements.filter((m: any) => (m.stockItem as any)?.itemType === 'RESTAURANT') || []);
      setMovTotal(data.total || 0);
    } catch { setMovements([]); }
    finally { setLoadingMov(false); }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await productsApi.list(propertyCode || undefined);
      setProducts(data.filter((p: any) => p.menuType === 'RESTAURANT') || []);
    } catch { setProducts([]); }
    finally { setLoadingProducts(false); }
  }, [propertyCode]);

  useEffect(() => {
    fetchStockItems();
  }, [fetchStockItems]);

  useEffect(() => {
    if (tab === 'movements') fetchMovements();
    if (tab === 'mapping') { fetchProducts(); fetchStockItems(); }
  }, [tab, fetchMovements, fetchProducts, fetchStockItems]);

  const handleSeedDefaults = async () => {
    setSeedingDefaults(true);
    try {
      const res = await fetch('/api/inventory/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: 'RESTAURANT' }),
      });
      const data = await res.json();
      if (data.data) {
        setSeedMsg(`✓ ${data.data.created} items loaded · ${data.data.skipped} already existed`);
        setTimeout(() => setSeedMsg(null), 5000);
        fetchStockItems();
      } else {
        setSeedMsg('⚠ ' + (data.message || 'Could not seed items'));
        setTimeout(() => setSeedMsg(null), 4000);
      }
    } catch {
      setSeedMsg('Error loading defaults');
      setTimeout(() => setSeedMsg(null), 4000);
    } finally {
      setSeedingDefaults(false);
    }
  };

  const handleSeedRecipes = async () => {
    setSeedingRecipes(true);
    try {
      const res = await inventoryApi.seedDefaultRecipes({ overwrite: false, ...(propertyCode ? { propertyId: propertyCode } : {}) });
      const data = res?.data || res;
      setSeedMsg(`✓ Auto-mapped recipes for ${data.mappedCount || 0} dishes (${data.skippedCount || 0} already had recipes)`);
      setTimeout(() => setSeedMsg(null), 6000);
      await fetchProducts();
    } catch (err: any) {
      setSeedMsg(`⚠ ${err.message || 'Failed to auto-map recipes'}`);
      setTimeout(() => setSeedMsg(null), 5000);
    } finally {
      setSeedingRecipes(false);
    }
  };

  const openAddItem = () => {
    setEditItem(null);
    setItemForm({ name: '', sku: '', unit: '', openingStock: '', reorderLevel: '', minimumStock: '', costPrice: '', itemType: 'RESTAURANT' });
    setIsAddItemOpen(true);
  };

  const openEditItem = (item: StockItem) => {
    setEditItem(item);
    setItemForm({
      name: item.name, sku: item.sku || '', unit: item.unit || '',
      openingStock: String(item.openingStock), reorderLevel: String(item.reorderLevel),
      minimumStock: String(item.minimumStock), costPrice: String(item.costPrice), itemType: 'RESTAURANT'
    });
    setIsAddItemOpen(true);
  };

  const saveItem = async () => {
    if (!itemForm.name) return;
    setSavingItem(true);
    try {
      if (editItem) {
        await inventoryApi.updateStockItem(editItem.id, { ...itemForm, reorderLevel: Number(itemForm.reorderLevel), minimumStock: Number(itemForm.minimumStock), costPrice: Number(itemForm.costPrice) } as any);
      } else {
        await inventoryApi.createStockItem({ ...itemForm, ...(propertyCode ? { propertyId: propertyCode } : {}), openingStock: Number(itemForm.openingStock), reorderLevel: Number(itemForm.reorderLevel), minimumStock: Number(itemForm.minimumStock), costPrice: Number(itemForm.costPrice) } as any);
      }
      setIsAddItemOpen(false); fetchStockItems();
    } catch (err: any) { alert(err.message); }
    finally { setSavingItem(false); }
  };

  const handleStockIn = async () => {
    if (!stockInForm.stockItemId || !stockInForm.qty) return;
    setStockInLoading(true); setStockInSuccess(false);
    try {
      await inventoryApi.stockIn({ ...stockInForm, qty: Number(stockInForm.qty), unitCost: Number(stockInForm.unitCost) });
      setStockInSuccess(true); setStockInForm({ stockItemId: '', qty: '', unitCost: '', movementType: 'PURCHASE_IN' }); fetchStockItems();
    } catch (err: any) { alert(err.message); }
    finally { setStockInLoading(false); }
  };

  const handleAdjust = async () => {
    if (!adjForm.stockItemId || adjForm.physicalQty === '') return;
    setAdjLoading(true); setAdjResult(null);
    try {
      const result = await inventoryApi.adjust({ ...adjForm, physicalQty: Number(adjForm.physicalQty) });
      setAdjResult(result); fetchStockItems();
    } catch (err: any) { alert(err.message); }
    finally { setAdjLoading(false); }
  };

  const handleMapProduct = async (productId: string, stockItemId: string | null) => {
    setMappingLoading(productId);
    try { await inventoryApi.mapProduct(productId, stockItemId); await fetchProducts(); }
    catch (err: any) { alert(err.message); }
    finally { setMappingLoading(''); }
  };

  const openRecipeModal = async (product: any) => {
    setRecipeProduct(product);
    setRecipeModalOpen(true);
    setLoadingRecipe(true);
    setSuggestedRecipe(null);
    try {
      const data = await inventoryApi.listRecipes(product.id);
      let initialIngredients = data || [];

      // Query recipe suggestion by dish name
      try {
        const suggestionRes = await inventoryApi.suggestRecipe(product.name, propertyCode || undefined);
        const suggestion = suggestionRes?.data || suggestionRes;
        if (suggestion?.matched) {
          setSuggestedRecipe(suggestion);
          // If no ingredients mapped yet, automatically pre-fill from suggestion!
          if (initialIngredients.length === 0 && suggestion.ingredients?.length > 0) {
            initialIngredients = suggestion.ingredients.map((ing: any) => ({
              stockItemId: ing.stockItemId,
              quantity: ing.quantity,
            }));
            fetchStockItems();
          }
        }
      } catch {
        // silent fallback
      }

      setRecipeIngredients(initialIngredients);
    } catch {
      setRecipeIngredients([]);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleApplySuggestion = () => {
    if (!suggestedRecipe?.ingredients) return;
    setRecipeIngredients(
      suggestedRecipe.ingredients.map((ing: any) => ({
        stockItemId: ing.stockItemId,
        quantity: ing.quantity,
      }))
    );
  };

  const handleSetupFullRestaurant = async () => {
    setSettingUpFull(true);
    try {
      const res = await inventoryApi.setupFullRestaurant(propertyCode || undefined);
      const data = res?.data || res;
      setSeedMsg(`✓ ${data?.message || 'Restaurant Setup Complete: Raw inventory & recipes pre-mapped!'}`);
      setTimeout(() => setSeedMsg(null), 6000);
      await Promise.all([fetchStockItems(), fetchProducts()]);
    } catch (err: any) {
      setSeedMsg(`⚠ ${err.message || 'Failed to complete restaurant setup'}`);
      setTimeout(() => setSeedMsg(null), 5000);
    } finally {
      setSettingUpFull(false);
    }
  };

  const handleAddIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { stockItemId: '', quantity: 1 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (index: number, field: string, value: any) => {
    const updated = [...recipeIngredients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipeIngredients(updated);
  };

  const saveRecipe = async () => {
    if (!recipeProduct) return;
    setSavingRecipe(true);
    try {
      await inventoryApi.updateRecipe(recipeProduct.id, recipeIngredients);
      setRecipeModalOpen(false);
      fetchProducts();
    } catch (err: any) { alert(err.message); }
    finally { setSavingRecipe(false); }
  };

  const tabs = [
    { id: 'items', label: 'Stock Items', icon: Package },
    { id: 'movements', label: 'Movement Ledger', icon: BarChart2 },
    { id: 'stock-in', label: 'Stock In', icon: ArrowUpCircle },
    { id: 'adjustments', label: 'Adjustments', icon: ClipboardList },
    { id: 'mapping', label: 'Product Mapping', icon: Layers },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Action Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1.5 bg-white/80 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm overflow-x-auto no-scrollbar max-w-full shrink-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id} onClick={() => setTab(id)}
              className={`whitespace-nowrap shrink-0 flex items-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all duration-200 ${
                tab === id 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-1 ring-emerald-500/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon size={15} /> <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-end xl:self-auto flex-wrap sm:flex-nowrap">
          <button
            onClick={handleSeedDefaults}
            disabled={seedingDefaults}
            className="h-10 flex items-center gap-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all active:scale-95 disabled:opacity-60 shadow-sm shrink-0"
            title="Load 42 standard kitchen raw ingredients"
          >
            <RefreshCw size={13} className={seedingDefaults ? 'animate-spin' : ''} />
            <span>{seedingDefaults ? 'Loading...' : 'Kitchen Defaults'}</span>
          </button>
          <Button 
            onClick={openAddItem} 
            className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider px-5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> <span>New Supply Item</span>
          </Button>
        </div>
      </div>

      {/* Seed success toast */}
      {seedMsg && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest shadow-lg animate-in slide-in-from-top-2 duration-300">
          <CheckCircle size={14} /><span>{seedMsg}</span>
        </div>
      )}

      {/* Content Section */}
      <div className="relative group">
        <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {tab === 'items' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4">
                 <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text" 
                      placeholder="Search items by name or SKU..." 
                      value={itemSearch} 
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                    />
                 </div>
                 <button onClick={fetchStockItems} className="p-2.5 text-slate-400 hover:text-emerald-600 transition-colors">
                   <RefreshCw size={18} />
                 </button>
              </div>
              
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      {['Item Details', 'Unit', 'Opening', 'Current Stock', 'Cost Price', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loadingItems ? (
                      <tr><td colSpan={7} className="py-24 text-center text-[10px] font-black text-slate-300 uppercase animate-pulse">Scanning Pantry...</td></tr>
                    ) : stockItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 px-6">
                          <div className="rounded-3xl border-2 border-dashed border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 p-8 text-center space-y-4">
                            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto">
                              <Package size={28} className="text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">Kitchen Pantry is Empty</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Load 42 standard kitchen raw materials in one click</p>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center text-[9px] font-black uppercase tracking-widest">
                              {['Basmati Rice', 'Chicken', 'Paneer', 'Dal Toor', 'Ghee', 'Tomato', 'Onion', 'Spices', 'Eggs', 'Milk'].map(item => (
                                <span key={item} className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 rounded-lg">{item}</span>
                              ))}
                              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 rounded-lg">+32 more...</span>
                            </div>
                            <button
                              onClick={handleSeedDefaults}
                              disabled={seedingDefaults}
                              className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-300/50 transition-all active:scale-95 disabled:opacity-60"
                            >
                              <RefreshCw size={14} className={seedingDefaults ? 'animate-spin' : ''} />
                              {seedingDefaults ? 'Loading Kitchen Items...' : 'Load Kitchen Defaults (42 Items)'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : stockItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group/row">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center">
                              <Package size={18} />
                            </div>
                            <div>
                              <div className="font-black text-xs text-slate-900 dark:text-white leading-tight">{item.name}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{item.sku || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[9px] font-black uppercase">
                            {item.unit || 'PCS'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400">{item.openingStock}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-end gap-1 leading-none">
                              <span className={`text-sm font-black ${item.isLow ? 'text-rose-500' : 'text-emerald-600'}`}>{item.currentStock ?? 0}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">{item.unit}</span>
                            </div>
                            <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full ${item.isLow ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                 style={{ width: `${Math.min(100, ((item.currentStock || 0) / Math.max(1, item.reorderLevel * 2)) * 100)}%` }} 
                               />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-white">₹{item.costPrice.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          {item.isLow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 dark:bg-rose-900/10 text-rose-500 rounded-full text-[8px] font-black uppercase border border-rose-100 dark:border-rose-900/30">
                              <AlertTriangle size={10} /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 rounded-full text-[8px] font-black uppercase border border-emerald-100 dark:border-emerald-900/30">
                              <CheckCircle size={10} /> Healthy
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => openEditItem(item)} 
                            className="p-2 text-slate-400 hover:text-emerald-600 transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'mapping' && (() => {
            const categories = ['All', ...Array.from(new Set(products.map((p: any) => p.category?.name).filter(Boolean)))];
            const filtered = products.filter((p: any) => {
              const matchesSearch = !mappingSearch || p.name.toLowerCase().includes(mappingSearch.toLowerCase());
              const matchesCat = mappingCategory === 'All' || p.category?.name === mappingCategory;
              return matchesSearch && matchesCat;
            });
            const mappedCount = products.filter((p: any) => (p.ingredients && p.ingredients.length > 0) || p.stockItemId).length;

            return (
              <div className="animate-in fade-in duration-300">
                {/* Header Bar */}
                <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">
                        Product Recipe Mapping
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                        {mappedCount} / {products.length} Mapped
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      Connect dishes to raw kitchen ingredients for real-time stock deduction
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                    <button
                      onClick={handleSetupFullRestaurant}
                      disabled={settingUpFull}
                      className="h-10 flex items-center gap-2 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 shrink-0"
                      title="1-Click: Seed all 178 raw materials, 180 dishes across 13 categories, and auto-map recipes from master prep list!"
                    >
                      {settingUpFull ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      <span>1-Click Full Restaurant & Recipe Setup</span>
                    </button>

                    <button
                      onClick={handleSeedRecipes}
                      disabled={seedingRecipes}
                      className="h-10 flex items-center gap-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase tracking-wider transition-all border border-slate-200/60 dark:border-slate-700/60 active:scale-95 disabled:opacity-50 shrink-0"
                      title="Automatically link existing dishes to kitchen ingredients with realistic portion sizes"
                    >
                      {seedingRecipes ? <Loader2 size={13} className="animate-spin" /> : <UtensilsCrossed size={13} />}
                      <span>Auto-Map Existing Dishes</span>
                    </button>
                  </div>
                </div>

                {/* Search and Category Filter */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={mappingSearch}
                      onChange={(e) => setMappingSearch(e.target.value)}
                      placeholder="Search dish (e.g. Biryani, Paneer, Chai, Omelette)..."
                      className="w-full h-10 pl-10 pr-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                    />
                    {mappingSearch && (
                      <button 
                        onClick={() => setMappingSearch('')} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {categories.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
                      {categories.map((c) => (
                        <button
                          key={c}
                          onClick={() => setMappingCategory(c)}
                          className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                            mappingCategory === c
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                              : 'bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200/60 dark:border-slate-700/60'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Product / Dish</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Recipe Ingredients</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Cost & Margin</th>
                        <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Direct Link</th>
                        <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {loadingProducts ? (
                        <tr><td colSpan={5} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase animate-pulse">Syncing Menu Dishes...</td></tr>
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-16 px-6">
                            {products.length === 0 ? (
                              <div className="rounded-3xl border-2 border-dashed border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-900/10 p-8 text-center space-y-4 max-w-xl mx-auto">
                                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                  <UtensilsCrossed size={28} />
                                </div>
                                <div>
                                  <h4 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">
                                    No Menu Dishes Found
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                                    Load standard restaurant dishes and auto-link recipes to kitchen ingredients in 1 click.
                                  </p>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                  <button
                                    onClick={handleSetupFullRestaurant}
                                    disabled={settingUpFull}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-60"
                                  >
                                    {settingUpFull ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    <span>1-Click Full Restaurant & Recipe Setup</span>
                                  </button>
                                  <button
                                    onClick={handleSeedRecipes}
                                    disabled={seedingRecipes}
                                    className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-60"
                                  >
                                    {seedingRecipes ? <Loader2 size={14} className="animate-spin" /> : <UtensilsCrossed size={14} />}
                                    <span>Auto-Map Existing Dishes</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <UtensilsCrossed size={32} className="mx-auto text-slate-300 mb-2" />
                                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">No dishes match "{mappingSearch}"</p>
                                <p className="text-[10px] text-slate-400 mt-1">Try clearing your search query or choosing another category.</p>
                                <button
                                  onClick={() => { setMappingSearch(''); setMappingCategory('All'); }}
                                  className="mt-3 px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                                >
                                  Reset Filters
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : filtered.map((product: any) => {
                          const ingredients = product.ingredients || [];
                          const hasRecipe = ingredients.length > 0;
                          const recipeCost = ingredients.reduce((sum: number, ing: any) => {
                            const cost = ing.stockItem?.costPrice ?? stockItems.find((s) => s.id === ing.stockItemId)?.costPrice ?? 0;
                            return sum + cost * (Number(ing.quantity) || 0);
                          }, 0);
                          const margin = product.sellingPrice - recipeCost;
                          const marginPct = product.sellingPrice > 0 ? Math.round((margin / product.sellingPrice) * 100) : 0;

                          return (
                            <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                              {/* Product Info */}
                              <td className="px-6 py-4">
                                <div className="font-black text-xs text-slate-900 dark:text-white leading-tight">{product.name}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                                  {product.category?.name || 'Dish'} · <span className="text-emerald-600 font-black">₹{product.sellingPrice}</span>
                                </div>
                              </td>

                              {/* Recipe Ingredients Preview */}
                              <td className="px-6 py-4 max-w-xs">
                                {hasRecipe ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50">
                                        <CheckCircle size={10} /> {ingredients.length} Ingredients Mapped
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {ingredients.slice(0, 3).map((ing: any, i: number) => {
                                        const name = ing.stockItem?.name || stockItems.find((s) => s.id === ing.stockItemId)?.name || 'Item';
                                        const unit = ing.stockItem?.unit || stockItems.find((s) => s.id === ing.stockItemId)?.unit || '';
                                        return (
                                          <span key={i} className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-600 dark:text-slate-300">
                                            {name}: {ing.quantity} {unit}
                                          </span>
                                        );
                                      })}
                                      {ingredients.length > 3 && (
                                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-400">
                                          +{ingredients.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 italic">
                                    No recipe mapped
                                  </span>
                                )}
                              </td>

                              {/* Cost & Margin */}
                              <td className="px-6 py-4">
                                {hasRecipe ? (
                                  <div>
                                    <div className="text-[11px] font-black text-slate-800 dark:text-slate-200">
                                      Cost: ₹{recipeCost.toFixed(2)}
                                    </div>
                                    <div className={`text-[9px] font-black uppercase tracking-wider ${marginPct >= 60 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                      Margin: {marginPct}% (₹{margin.toFixed(2)})
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold">—</span>
                                )}
                              </td>

                              {/* Direct 1:1 Link for packaged items */}
                              <td className="px-6 py-4">
                                <select
                                  value={product.stockItemId || ''}
                                  onChange={(e) => handleMapProduct(product.id, e.target.value || null)}
                                  disabled={mappingLoading === product.id}
                                  className="w-36 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                >
                                  <option value="">-- Direct Link --</option>
                                  {stockItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.name} ({item.unit})
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Edit Recipe Button */}
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => openRecipeModal(product)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border border-emerald-200/50"
                                  title="Configure ingredients and quantities"
                                >
                                  <UtensilsCrossed size={12} />
                                  <span>{hasRecipe ? 'Edit Recipe' : 'Add Recipe'}</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
              </div>
            );
          })()}

          {tab === 'stock-in' && (
            <div className="max-w-md mx-auto py-12 px-6 animate-in zoom-in-95 duration-300">
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/30">
                      <ArrowUpCircle size={20} />
                    </div>
                    <div>
                      <h2 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">Register Stock In</h2>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Add quantities to warehouse</p>
                    </div>
                  </div>

                  {stockInSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-center border border-emerald-100">
                      Inventory Updated!
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Item</label>
                      <select
                        value={stockInForm.stockItemId}
                        onChange={(e) => setStockInForm(f => ({ ...f, stockItemId: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black outline-none focus:ring-2 focus:ring-emerald-500/10 appearance-none shadow-sm cursor-pointer"
                      >
                        <option value="">Select item to restock...</option>
                        {stockItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Quantity</label>
                        <input 
                          type="number" 
                          placeholder="0.00" 
                          value={stockInForm.qty} 
                          onChange={(e) => setStockInForm(f => ({ ...f, qty: e.target.value }))} 
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-emerald-500/10 outline-none" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Unit Cost</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">₹</span>
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            value={stockInForm.unitCost} 
                            onChange={(e) => setStockInForm(f => ({ ...f, unitCost: e.target.value }))} 
                            className="w-full pl-6 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-emerald-500/10 outline-none" 
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      loading={stockInLoading} 
                      onClick={handleStockIn} 
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-200/50 transition-all active:scale-95"
                    >
                      Confirm Entry
                    </Button>
                  </div>
               </div>
            </div>
          )}

          {tab === 'adjustments' && (
            <div className="max-w-md mx-auto py-12 px-6 animate-in zoom-in-95 duration-300">
               <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-800 shadow-xl space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-orange-500/30">
                      <ClipboardList size={20} />
                    </div>
                    <div>
                      <h2 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">Audit Adjustment</h2>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Correct physical count</p>
                    </div>
                  </div>

                  {adjResult && (
                    <div className="p-3 bg-orange-50 text-orange-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-center border border-orange-100">
                      Stock Level Adjusted!
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Item</label>
                      <select
                        value={adjForm.stockItemId}
                        onChange={(e) => setAdjForm(f => ({ ...f, stockItemId: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black outline-none focus:ring-2 focus:ring-orange-500/10 appearance-none shadow-sm cursor-pointer"
                      >
                        <option value="">Select item to adjust...</option>
                        {stockItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Physical Qty</label>
                      <input 
                        type="number" 
                        placeholder="Exact count on shelf" 
                        value={adjForm.physicalQty} 
                        onChange={(e) => setAdjForm(f => ({ ...f, physicalQty: e.target.value }))} 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-orange-500/10 outline-none" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason</label>
                      <input 
                        type="text" 
                        placeholder="Waste, damage, or audit..." 
                        value={adjForm.reason} 
                        onChange={(e) => setAdjForm(f => ({ ...f, reason: e.target.value }))} 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-orange-500/10 outline-none" 
                      />
                    </div>

                    <Button 
                      loading={adjLoading} 
                      onClick={handleAdjust} 
                      className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-orange-200/50 transition-all active:scale-95"
                    >
                      Apply Correction
                    </Button>
                  </div>
               </div>
            </div>
          )}

          {tab === 'movements' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Audit Ledger</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Transaction history</p>
                </div>
                <button onClick={fetchMovements} className="p-2.5 text-slate-400 hover:text-emerald-600 transition-all">
                  <RefreshCw size={18} />
                </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                        {['Date', 'Item', 'Type', 'Change', 'Balance'].map(h => <th key={h} className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {loadingMov ? (
                         <tr><td colSpan={5} className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-300 animate-pulse">Reading Ledger...</td></tr>
                      ) : movements.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase">No movements found</td></tr>
                      ) : movements.map(m => {
                        const meta = MOVEMENT_LABELS[m.movementType] || { label: m.movementType, color: 'text-slate-400 bg-slate-100' };
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 text-[9px] font-bold text-slate-400">
                              {new Date(m.movementDate).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="px-6 py-4 font-black text-xs text-slate-900 dark:text-white">{m.stockItem?.name}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${meta.color}`}>
                                {meta.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                               {m.qtyIn > 0 
                                 ? <span className="text-emerald-600 font-black text-[11px]">+{m.qtyIn}</span> 
                                 : <span className="text-rose-500 font-black text-[11px]">-{m.qtyOut}</span>
                               }
                            </td>
                            <td className="px-6 py-4 font-black text-xs text-slate-800 dark:text-slate-200">{m.balanceQty}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                 </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Add/Edit */}
      <Modal 
        isOpen={isAddItemOpen} 
        onClose={() => setIsAddItemOpen(false)} 
        title={editItem ? 'Edit Item' : 'New Entry'}
      >
        <div className="p-4 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
               <Package size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{editItem ? 'Modify Supply' : 'Add to Stock'}</h3>
              <p className="text-[10px] text-slate-500 font-medium">Kitchen raw materials</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Item Name</label>
              <input 
                type="text" placeholder="e.g. Basmati Rice" 
                value={itemForm.name} 
                onChange={e => setItemForm({...itemForm, name: e.target.value})} 
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU / Code</label>
                <input 
                  type="text" placeholder="Internal SKU" 
                  value={itemForm.sku} 
                  onChange={e => setItemForm({...itemForm, sku: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-emerald-500/10 outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                <select 
                  value={itemForm.unit} 
                  onChange={e => setItemForm({...itemForm, unit: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-emerald-500/10 outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select Unit</option>
                  <option value="KG">Kilogram (KG)</option>
                  <option value="PCS">Pieces (PCS)</option>
                  <option value="LTR">Litre (LTR)</option>
                  <option value="PKT">Packet (PKT)</option>
                  <option value="GMS">Grams (GMS)</option>
                  <option value="BOX">Box (BOX)</option>
                </select>
              </div>
            </div>

            {!editItem && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest ml-1 block text-center">Initial Opening Stock</label>
                <input 
                  type="number" placeholder="What's currently in hand?" 
                  value={itemForm.openingStock} 
                  onChange={e => setItemForm({...itemForm, openingStock: e.target.value})} 
                  className="w-full px-6 py-4 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border border-emerald-100 rounded-2xl text-lg font-black text-center focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none" 
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Reorder Lvl</label>
                <input 
                  type="number" value={itemForm.reorderLevel} 
                  onChange={e => setItemForm({...itemForm, reorderLevel: e.target.value})} 
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-emerald-500/10 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Min Stock</label>
                <input 
                  type="number" value={itemForm.minimumStock} 
                  onChange={e => setItemForm({...itemForm, minimumStock: e.target.value})} 
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-emerald-500/10 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost (₹)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input 
                    type="number" value={itemForm.costPrice} 
                    onChange={e => setItemForm({...itemForm, costPrice: e.target.value})} 
                    className="w-full pl-5 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-emerald-500/10 transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setIsAddItemOpen(false)} 
              className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100"
            >
              CANCEL
            </Button>
            <Button 
              loading={savingItem} 
              onClick={saveItem} 
              className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200/50 transition-all active:scale-95"
            >
              {editItem ? 'UPDATE' : 'ADD TO STOCK'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Recipe Modal */}
      <Modal 
        isOpen={recipeModalOpen} 
        onClose={() => setRecipeModalOpen(false)}
        title="Recipe Master"
      >
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <UtensilsCrossed size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{recipeProduct?.name}</h3>
                <p className="text-[10px] text-slate-500 font-medium">Automatic raw ingredient deduction per order</p>
              </div>
            </div>

            {/* Financial Summary */}
            {(() => {
              const liveCost = recipeIngredients.reduce((sum: number, ing: any) => {
                const item = stockItems.find((s) => s.id === ing.stockItemId);
                return sum + (item?.costPrice || 0) * (Number(ing.quantity) || 0);
              }, 0);
              const price = recipeProduct?.sellingPrice || 0;
              const margin = price - liveCost;
              const marginPct = price > 0 ? Math.round((margin / price) * 100) : 0;

              return (
                <div className="text-right">
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Cost: <span className="text-emerald-600">₹{liveCost.toFixed(2)}</span> / ₹{price}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    Margin: {marginPct}% (₹{margin.toFixed(2)})
                  </div>
                </div>
              );
            })()}
          </div>

          {loadingRecipe ? (
            <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">Loading recipe...</div>
          ) : (
            <div className="space-y-6">
              {/* Recipe Preset Suggestion Banner */}
              {suggestedRecipe?.matched && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Standard Recipe Preset: {suggestedRecipe.dishName}</span>
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                          {suggestedRecipe.ingredients.length} ingredients
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {suggestedRecipe.ingredients.map((i: any) => `${i.itemName} (${i.quantity} ${i.unit})`).join(' · ')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplySuggestion}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={12} /> Auto-Fill Recipe
                  </button>
                </div>
              )}

              <div className="space-y-3 max-h-[42vh] overflow-y-auto no-scrollbar pr-2">
                {recipeIngredients.map((ing, idx) => {
                  const currentStockItem = stockItems.find((i) => i.id === ing.stockItemId);
                  const lineCost = (currentStockItem?.costPrice || 0) * (Number(ing.quantity) || 0);

                  return (
                    <div key={idx} className="group relative p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 transition-all">
                      <div className="grid md:grid-cols-12 gap-3 items-end">
                        {/* Ingredient Select */}
                        <div className="md:col-span-6 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ingredient</label>
                          <select 
                            value={ing.stockItemId}
                            onChange={(e) => handleUpdateIngredient(idx, 'stockItemId', e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-black py-2.5 px-3 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          >
                            <option value="">-- Choose Stock Item --</option>
                            {stockItems.map(item => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.unit}) · ₹{item.costPrice}/{item.unit}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty / Portion</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              step="0.001" 
                              min="0"
                              value={ing.quantity}
                              onChange={(e) => handleUpdateIngredient(idx, 'quantity', e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-black py-2.5 pl-3 pr-10 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-600 uppercase">
                              {currentStockItem?.unit || ''}
                            </span>
                          </div>
                        </div>

                        {/* Cost & Delete */}
                        <div className="md:col-span-3 flex items-center justify-between gap-2">
                          <div className="text-right">
                            <div className="text-[9px] font-black text-slate-400 uppercase">Cost</div>
                            <div className="text-[11px] font-black text-slate-700 dark:text-slate-300">
                              ₹{lineCost.toFixed(2)}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleRemoveIngredient(idx)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                            title="Remove ingredient"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {recipeIngredients.length === 0 && (
                  <div className="py-10 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-6 space-y-3">
                    <Package className="mx-auto text-slate-300 mb-1" size={34} />
                    <div>
                      <p className="text-xs font-black text-slate-700 dark:text-slate-300">No ingredients configured yet</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {suggestedRecipe?.matched
                          ? `Standard preset ingredients for "${suggestedRecipe.dishName}" detected!`
                          : 'Add raw ingredients manually using the button below.'}
                      </p>
                    </div>
                    {suggestedRecipe?.matched && (
                      <button
                        type="button"
                        onClick={handleApplySuggestion}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all"
                      >
                        <Sparkles size={12} /> Auto-Fill {suggestedRecipe.dishName} Recipe
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleAddIngredient}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all"
                >
                  + ADD INGREDIENT
                </button>
                {suggestedRecipe?.matched && (
                  <button 
                    type="button"
                    onClick={handleApplySuggestion}
                    className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-1.5"
                    title="Auto-fill recipe to standard portion quantities"
                  >
                    <Sparkles size={12} /> Auto-Fill Recipe
                  </button>
                )}
              </div>

              <div className="flex gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
                <Button variant="secondary" onClick={() => setRecipeModalOpen(false)} className="flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest">CANCEL</Button>
                <Button 
                  onClick={saveRecipe} 
                  disabled={savingRecipe}
                  className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                >
                  {savingRecipe ? 'Saving...' : 'Save Recipe'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
