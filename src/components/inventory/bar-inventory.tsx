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
  Wine,
  Droplets,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { inventoryApi, StockItem, StockMovement } from '@/lib/api/inventory';
import { productsApi, Product } from '@/lib/api/products';

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
  OPENING: { label: 'Opening', color: 'text-amber-600 bg-amber-50' },
  PURCHASE_IN: { label: 'Purchase In', color: 'text-green-600 bg-green-50' },
  SALE_OUT: { label: 'Sale Out', color: 'text-red-600 bg-red-50' },
  ADJUSTMENT_IN: { label: 'Adj (+)', color: 'text-amber-600 bg-amber-50' },
  ADJUSTMENT_OUT: { label: 'Adj (-)', color: 'text-orange-600 bg-orange-50' },
};

export default function BarInventory() {
  const [tab, setTab] = useState<'items' | 'movements' | 'stock-in' | 'adjustments' | 'mapping'>('items');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [loadingItems, setLoadingItems] = useState(true);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '', sku: '', unit: 'ml', openingStock: '', reorderLevel: '', minimumStock: '', costPrice: '', itemType: 'BAR'
  });
  const [savingItem, setSavingItem] = useState(false);

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loadingMov, setLoadingMov] = useState(false);

  const [stockInForm, setStockInForm] = useState({ stockItemId: '', qty: '', unitCost: '', movementType: 'PURCHASE_IN' });
  const [stockInLoading, setStockInLoading] = useState(false);
  const [stockInSuccess, setStockInSuccess] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [mappingLoading, setMappingLoading] = useState<string>('');

  const fetchStockItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const data = await inventoryApi.listStockItems({ search: itemSearch, itemType: 'BAR' });
      setStockItems(data || []);
    } catch { setStockItems([]); }
    finally { setLoadingItems(false); }
  }, [itemSearch]);

  const fetchMovements = useCallback(async () => {
    setLoadingMov(true);
    try {
      const data = await inventoryApi.listMovements();
      setMovements(data.movements.filter((m: any) => (m.stockItem as any)?.itemType === 'BAR') || []);
    } catch { setMovements([]); }
    finally { setLoadingMov(false); }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await productsApi.list();
      setProducts(data.filter((p: any) => p.menuType === 'BAR') || []);
    } catch { setProducts([]); }
    finally { setLoadingProducts(false); }
  }, []);

  useEffect(() => { fetchStockItems(); }, [fetchStockItems]);
  useEffect(() => {
    if (tab === 'movements') fetchMovements();
    if (tab === 'mapping') { fetchProducts(); fetchStockItems(); }
  }, [tab, fetchMovements, fetchProducts, fetchStockItems]);

  const openAddItem = () => {
    setEditItem(null);
    setItemForm({ name: '', sku: '', unit: 'ml', openingStock: '', reorderLevel: '', minimumStock: '', costPrice: '', itemType: 'BAR' });
    setIsAddItemOpen(true);
  };

  const openEditItem = (item: StockItem) => {
    setEditItem(item);
    setItemForm({
      name: item.name, sku: item.sku || '', unit: item.unit || 'ml',
      openingStock: String(item.openingStock), reorderLevel: String(item.reorderLevel),
      minimumStock: String(item.minimumStock), costPrice: String(item.costPrice), itemType: 'BAR'
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

  const handleMapProduct = async (productId: string, stockItemId: string | null) => {
    setMappingLoading(productId);
    try { await inventoryApi.mapProduct(productId, stockItemId); await fetchProducts(); }
    catch (err: any) { alert(err.message); }
    finally { setMappingLoading(''); }
  };

  const tabs = [
    { id: 'items', label: 'Liquor Stock', icon: Wine },
    { id: 'movements', label: 'Bar Ledger', icon: BarChart2 },
    { id: 'stock-in', label: 'Purchase', icon: ArrowUpCircle },
    { id: 'mapping', label: 'Mapping', icon: Layers },
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
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={14} /> <span>{label}</span>
            </button>
          ))}
        </div>
        <Button onClick={openAddItem} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest px-5 py-2.5 shadow-md shadow-amber-200/40 active:scale-95 transition-all">
          <Plus size={16} className="mr-2" /> Add Liquor Brand
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
                      placeholder="Search brands, types or SKUs..." 
                      value={itemSearch} 
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/10 outline-none transition-all"
                    />
                 </div>
                 <button onClick={fetchStockItems} className="p-2.5 text-slate-400 hover:text-amber-600 transition-colors">
                   <RefreshCw size={18} />
                 </button>
              </div>
              
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                      {['Brand Details', 'Base Unit', 'Opening', 'Current Vol', 'Bottle Count', 'Avg Cost', 'Action'].map(h => (
                        <th key={h} className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loadingItems ? (
                      <tr><td colSpan={7} className="py-24 text-center text-[10px] font-black text-slate-300 uppercase animate-pulse">Scanning Cellar...</td></tr>
                    ) : stockItems.length === 0 ? (
                      <tr><td colSpan={7} className="py-24 text-center text-[10px] font-black text-slate-300 uppercase">No brands found</td></tr>
                    ) : stockItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors group/row">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl flex items-center justify-center">
                              <Wine size={18} />
                            </div>
                            <div>
                              <div className="font-black text-xs text-slate-900 dark:text-white leading-tight">{item.name}</div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{item.sku || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase">
                            {item.unit || 'ml'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400">{item.openingStock} ml</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-end gap-1 leading-none">
                              <span className={`text-sm font-black ${item.isLow ? 'text-rose-500' : 'text-amber-600'}`}>{item.currentStock ?? 0}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase mb-0.5">ml</span>
                            </div>
                            <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                               <div 
                                 className={`h-full ${item.isLow ? 'bg-rose-500' : 'bg-amber-500'}`} 
                                 style={{ width: `${Math.min(100, ((item.currentStock || 0) / Math.max(1, item.reorderLevel * 2)) * 100)}%` }} 
                               />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-baseline gap-1 leading-none">
                             <span className="text-xs font-black text-slate-700 dark:text-slate-200">{Math.floor((item.currentStock || 0) / 750)}</span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">BTL</span>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-black text-slate-900 dark:text-white">₹{item.costPrice.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => openEditItem(item)} 
                            className="p-2 text-slate-400 hover:text-amber-600 transition-colors"
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
                <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Bar Menu Sync</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Connect drink items with inventory stock</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                      <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Beverage</th>
                      <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Inventory Source</th>
                      <th className="px-8 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {loadingProducts ? (
                       <tr><td colSpan={3} className="py-20 text-center text-[10px] font-black text-slate-300 uppercase animate-pulse">Syncing Bar...</td></tr>
                    ) : products.map((product: any) => (
                      <tr key={product.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-all">
                        <td className="px-8 py-5">
                           <div className="font-black text-xs text-slate-900 dark:text-white leading-tight">{product.name}</div>
                           <div className="text-[9px] font-bold text-slate-400 uppercase">{product.category?.name}</div>
                        </td>
                        <td className="px-8 py-5">
                            <select
                              value={product.stockItemId || ''}
                              onChange={(e) => handleMapProduct(product.id, e.target.value || null)}
                              disabled={mappingLoading === product.id}
                              className="w-full max-w-xs px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-black outline-none focus:ring-2 focus:ring-amber-500/10 appearance-none shadow-sm cursor-pointer"
                            >
                              <option value="">-- Manual Deduction --</option>
                              {stockItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                            </select>
                        </td>
                        <td className="px-8 py-5 text-center">
                           {product.stockItemId ? (
                             <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
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
                    <div className="w-10 h-10 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/30">
                      <ArrowUpCircle size={20} />
                    </div>
                    <div>
                      <h2 className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white">Liquor Restock</h2>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Register inward bottles</p>
                    </div>
                  </div>

                  {stockInSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest text-center border border-emerald-100">
                      Bar Stock Updated!
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Brand</label>
                      <select
                        value={stockInForm.stockItemId}
                        onChange={(e) => setStockInForm(f => ({ ...f, stockItemId: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black outline-none focus:ring-2 focus:ring-amber-500/10 appearance-none shadow-sm cursor-pointer"
                      >
                        <option value="">Choose liquor to restock...</option>
                        {stockItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Total ml</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            placeholder="e.g. 750" 
                            value={stockInForm.qty} 
                            onChange={(e) => setStockInForm(f => ({ ...f, qty: e.target.value }))} 
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-amber-500/10 outline-none" 
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-amber-600">ML</span>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Bottle Cost</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">₹</span>
                          <input 
                            type="number" 
                            placeholder="0.00" 
                            value={stockInForm.unitCost} 
                            onChange={(e) => setStockInForm(f => ({ ...f, unitCost: e.target.value }))} 
                            className="w-full pl-6 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-amber-500/10 outline-none" 
                          />
                        </div>
                      </div>
                    </div>

                    <Button 
                      loading={stockInLoading} 
                      onClick={handleStockIn} 
                      className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-amber-200/50 transition-all active:scale-95"
                    >
                      Confirm Restock
                    </Button>
                  </div>
               </div>
            </div>
          )}

          {tab === 'movements' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-amber-500/5">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest">Bar Ledger</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Movement history</p>
                </div>
                <button onClick={fetchMovements} className="p-2.5 text-slate-400 hover:text-amber-600 transition-all">
                  <RefreshCw size={18} />
                </button>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                        {['Date', 'Brand', 'Type', 'Change', 'Balance'].map(h => <th key={h} className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}
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
                                 ? <span className="text-emerald-600 font-black text-[11px]">+{m.qtyIn} ml</span> 
                                 : <span className="text-rose-500 font-black text-[11px]">-{m.qtyOut} ml</span>
                               }
                            </td>
                            <td className="px-6 py-4 font-black text-xs text-slate-800 dark:text-slate-200">{m.balanceQty} ml</td>
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
        title={editItem ? 'Edit Brand' : 'New Brand'}
      >
        <div className="p-4 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-amber-500/20">
               <Wine size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{editItem ? 'Modify Brand' : 'Register Brand'}</h3>
              <p className="text-[10px] text-slate-500 font-medium">Bar inventory management</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Brand Name</label>
              <input 
                type="text" placeholder="e.g. Absolut Vodka" 
                value={itemForm.name} 
                onChange={e => setItemForm({...itemForm, name: e.target.value})} 
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-amber-500/10 outline-none transition-all" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU Code</label>
                <input 
                  type="text" placeholder="Internal Code" 
                  value={itemForm.sku} 
                  onChange={e => setItemForm({...itemForm, sku: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-amber-500/10 outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit</label>
                <input 
                  type="text" 
                  value={itemForm.unit} 
                  onChange={e => setItemForm({...itemForm, unit: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-none rounded-xl text-xs font-black focus:ring-2 focus:ring-amber-500/10 outline-none" 
                />
              </div>
            </div>

            {!editItem && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-amber-600 uppercase tracking-widest ml-1 block text-center">Initial Opening Vol (ml)</label>
                <input 
                  type="number" placeholder="Volume currently in stock" 
                  value={itemForm.openingStock} 
                  onChange={e => setItemForm({...itemForm, openingStock: e.target.value})} 
                  className="w-full px-6 py-4 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border border-amber-100 rounded-2xl text-lg font-black text-center focus:ring-2 focus:ring-amber-500/20 transition-all outline-none" 
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Reorder ml</label>
                <input 
                  type="number" value={itemForm.reorderLevel} 
                  onChange={e => setItemForm({...itemForm, reorderLevel: e.target.value})} 
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-amber-500/10 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Bottle Cost (₹)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input 
                    type="number" value={itemForm.costPrice} 
                    onChange={e => setItemForm({...itemForm, costPrice: e.target.value})} 
                    className="w-full pl-5 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-amber-500/10 transition-all" 
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
              className="flex-[2] py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-200/50 transition-all active:scale-95"
            >
              {editItem ? 'UPDATE' : 'ADD TO BAR'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
