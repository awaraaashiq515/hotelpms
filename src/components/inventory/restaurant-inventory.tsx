'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Trash2
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

export default function RestaurantInventory() {
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

  const fetchStockItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const data = await inventoryApi.listStockItems({ search: itemSearch, itemType: 'RESTAURANT' });
      setStockItems(data || []);
    } catch { setStockItems([]); }
    finally { setLoadingItems(false); }
  }, [itemSearch]);

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
      const data = await productsApi.list();
      setProducts(data.filter((p: any) => p.menuType === 'RESTAURANT') || []);
    } catch { setProducts([]); }
    finally { setLoadingProducts(false); }
  }, []);

  useEffect(() => {
    fetchStockItems();
  }, [fetchStockItems]);

  useEffect(() => {
    if (tab === 'movements') fetchMovements();
    if (tab === 'mapping') { fetchProducts(); fetchStockItems(); }
  }, [tab, fetchMovements, fetchProducts, fetchStockItems]);

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
        await inventoryApi.createStockItem({ ...itemForm, openingStock: Number(itemForm.openingStock), reorderLevel: Number(itemForm.reorderLevel), minimumStock: Number(itemForm.minimumStock), costPrice: Number(itemForm.costPrice) } as any);
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
    try {
      const data = await inventoryApi.listRecipes(product.id);
      setRecipeIngredients(data || []);
    } catch { setRecipeIngredients([]); }
    finally { setLoadingRecipe(false); }
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1 p-1 bg-white/50 dark:bg-slate-800/40 backdrop-blur-xl rounded-xl border border-white dark:border-slate-700/50 shadow-sm">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 ${
                tab === id 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={14} /> <span>{label}</span>
            </button>
          ))}
        </div>
        <Button onClick={openAddItem} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-5 py-2.5 shadow-md shadow-emerald-200/40 active:scale-95 transition-all">
          <Plus size={16} className="mr-2" /> New Supply Item
        </Button>
      </div>

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
                      <tr><td colSpan={7} className="py-24 text-center text-[10px] font-black text-slate-300 uppercase">No items found</td></tr>
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

          {tab === 'mapping' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Product Recipe Mapping</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Connect menu products with inventory items</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                      <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Integration</th>
                      <th className="px-8 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loadingProducts ? (
                       <tr><td colSpan={3} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase animate-pulse">Syncing Menu...</td></tr>
                    ) : products.map((product: any) => (
                      <tr key={product.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all">
                        <td className="px-8 py-5">
                           <div className="font-black text-xs text-slate-900 dark:text-white leading-tight">{product.name}</div>
                           <div className="text-[9px] font-bold text-slate-400 uppercase">{product.category?.name}</div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                            <select
                              value={product.stockItemId || ''}
                              onChange={(e) => handleMapProduct(product.id, e.target.value || null)}
                              disabled={mappingLoading === product.id}
                              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-black outline-none focus:ring-2 focus:ring-emerald-500/10 appearance-none"
                            >
                              <option value="">-- No Direct Link --</option>
                              {stockItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                            <button 
                              onClick={() => openRecipeModal(product)}
                              className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200/50"
                              title="Recipe Breakdown"
                            >
                              <UtensilsCrossed size={14} />
                            </button>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                           {product.stockItemId ? (
                              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle size={16} />
                              </div>
                           ) : (
                             <div className="w-2 h-2 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <UtensilsCrossed size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Recipe: {recipeProduct?.name}</h3>
              <p className="text-[10px] text-slate-500 font-medium">Automatic stock deduction settings</p>
            </div>
          </div>

          {loadingRecipe ? (
            <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">Loading recipe...</div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                {recipeIngredients.map((ing, idx) => (
                  <div key={idx} className="group relative p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-emerald-500/20 transition-all">
                    <div className="grid md:grid-cols-2 gap-4 items-end">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ingredient</label>
                        <select 
                          value={ing.stockItemId}
                          onChange={(e) => handleUpdateIngredient(idx, 'stockItemId', e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-black py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                        >
                          <option value="">-- Choose Item --</option>
                          {stockItems.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                        </select>
                      </div>
                      <div className="flex gap-3 items-end">
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qty</label>
                          <div className="relative">
                            <input 
                              type="number" step="0.01" value={ing.quantity}
                              onChange={(e) => handleUpdateIngredient(idx, 'quantity', e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-black py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/10 outline-none"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-600">
                              {stockItems.find(i => i.id === ing.stockItemId)?.unit || ''}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveIngredient(idx)}
                          className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {recipeIngredients.length === 0 && (
                  <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-700">
                    <Package className="mx-auto text-slate-200 mb-2" size={32} />
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No ingredients defined</p>
                  </div>
                )}
              </div>

              <button 
                onClick={handleAddIngredient}
                className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-dashed border-emerald-100 dark:border-emerald-800/50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-all"
              >
                + ADD COMPONENT
              </button>

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
