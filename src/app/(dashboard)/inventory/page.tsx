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
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/shared/page-header';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { inventoryApi, StockItem, StockMovement } from '@/lib/api/inventory';
import { productsApi, Product } from '@/lib/api/products';

type Tab = 'items' | 'movements' | 'stock-in' | 'adjustments' | 'low-stock' | 'mapping' | 'recipes' | 'transfer';

const MOVEMENT_LABELS: Record<string, { label: string; color: string }> = {
  OPENING: { label: 'Opening', color: 'text-pos-primary bg-pos-primary/10' },
  PURCHASE_IN: { label: 'Purchase In', color: 'text-green-600 bg-green-50' },
  SALE_OUT: { label: 'Sale Out', color: 'text-red-600 bg-red-50' },
  ADJUSTMENT_IN: { label: 'Adj (+)', color: 'text-emerald-600 bg-emerald-50' },
  ADJUSTMENT_OUT: { label: 'Adj (-)', color: 'text-orange-600 bg-orange-50' },
  TRANSFER: { label: 'Transfer', color: 'text-purple-600 bg-purple-50' },
  REVERSE_SALE: { label: 'Reverse Sale', color: 'text-pos-primary bg-pos-primary/10' },
};

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>('items');

  // Stock Items state
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [inventoryMenuType, setInventoryMenuType] = useState<'ALL' | 'RESTAURANT' | 'BAR'>('ALL');
  const [loadingItems, setLoadingItems] = useState(true);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    unit: '',
    openingStock: '',
    reorderLevel: '',
    minimumStock: '',
    costPrice: '',
    itemType: 'RESTAURANT',
  });
  const [savingItem, setSavingItem] = useState(false);

  // Movements state
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [movTotal, setMovTotal] = useState(0);
  const [loadingMov, setLoadingMov] = useState(false);

  // Stock-in state
  const [stockInForm, setStockInForm] = useState({
    stockItemId: '',
    qty: '',
    unitCost: '',
    movementType: 'PURCHASE_IN',
  });
  const [stockInLoading, setStockInLoading] = useState(false);
  const [stockInSuccess, setStockInSuccess] = useState(false);

  // Adjustment state
  const [adjForm, setAdjForm] = useState({
    stockItemId: '',
    physicalQty: '',
    reason: '',
  });
  const [adjLoading, setAdjLoading] = useState(false);
  const [adjResult, setAdjResult] = useState<null | { diff: number; physicalQty: number }>(null);

  // Low stock
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([]);
  const [loadingLow, setLoadingLow] = useState(false);

  // Product mapping
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [mappingLoading, setMappingLoading] = useState<string>('');

  // Recipe state
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [recipeIngredients, setRecipeIngredients] = useState<{ stockItemId: string; quantity: string }[]>([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  // Transfer state
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [transferForm, setTransferForm] = useState({
    stockItemId: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    qty: '',
  });
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  const fetchStockItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const data = await inventoryApi.listStockItems({ 
        search: itemSearch,
        warehouseId: selectedWarehouseId || undefined,
        itemType: inventoryMenuType !== 'ALL' ? inventoryMenuType : undefined,
      });
      setStockItems(data || []);
    } catch {
      setStockItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [itemSearch, inventoryMenuType]);

  const fetchMovements = useCallback(async () => {
    setLoadingMov(true);
    try {
      const data = await inventoryApi.listMovements();
      setMovements(data.movements || []);
      setMovTotal(data.total || 0);
    } catch {
      setMovements([]);
    } finally {
      setLoadingMov(false);
    }
  }, []);

  const fetchLowStock = useCallback(async () => {
    setLoadingLow(true);
    try {
      const data = await inventoryApi.listStockItems({ lowStock: true });
      setLowStockItems(data || []);
    } catch {
      setLowStockItems([]);
    } finally {
      setLoadingLow(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const data = await productsApi.list();
      setProducts(data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    fetchStockItems();
    if (tab === 'items' || tab === 'transfer') {
      inventoryApi.listWarehouses().then(setWarehouses).catch(() => {});
    }
  }, [fetchStockItems, tab]);

  useEffect(() => {
    if (tab === 'movements') fetchMovements();
    if (tab === 'low-stock') fetchLowStock();
    if (tab === 'mapping') {
      fetchProducts();
      fetchStockItems();
    }
    if (tab === 'recipes') {
      fetchProducts();
      fetchStockItems();
    }
    if (tab === 'transfer') {
      fetchStockItems();
      inventoryApi.listWarehouses().then(setWarehouses).catch(() => {});
    }
  }, [tab, fetchMovements, fetchLowStock, fetchProducts, fetchStockItems]);

  const openAddItem = () => {
    setEditItem(null);
    setItemForm({ name: '', sku: '', unit: '', openingStock: '', reorderLevel: '', minimumStock: '', costPrice: '', itemType: 'RESTAURANT' });
    setIsAddItemOpen(true);
  };

  const openEditItem = (item: StockItem) => {
    setEditItem(item);
    setItemForm({
      name: item.name,
      sku: item.sku || '',
      unit: item.unit || '',
      openingStock: String(item.openingStock),
      reorderLevel: String(item.reorderLevel),
      minimumStock: String(item.minimumStock),
      costPrice: String(item.costPrice),
      itemType: item.itemType || 'RESTAURANT',
    });
    setIsAddItemOpen(true);
  };

  const saveItem = async () => {
    if (!itemForm.name) return;
    setSavingItem(true);
    try {
      if (editItem) {
        await inventoryApi.updateStockItem(editItem.id, {
          name: itemForm.name,
          sku: itemForm.sku,
          unit: itemForm.unit,
          reorderLevel: Number(itemForm.reorderLevel || 0),
          minimumStock: Number(itemForm.minimumStock || 0),
          costPrice: Number(itemForm.costPrice || 0),
          itemType: itemForm.itemType,
        } as any);
      } else {
        await inventoryApi.createStockItem({
          name: itemForm.name,
          sku: itemForm.sku,
          unit: itemForm.unit,
          openingStock: Number(itemForm.openingStock || 0),
          reorderLevel: Number(itemForm.reorderLevel || 0),
          minimumStock: Number(itemForm.minimumStock || 0),
          costPrice: Number(itemForm.costPrice || 0),
          itemType: itemForm.itemType,
        } as any);
      }
      setIsAddItemOpen(false);
      fetchStockItems();
    } catch (err: any) {
      alert(err.message || 'Failed to save stock item');
    } finally {
      setSavingItem(false);
    }
  };

  const handleStockIn = async () => {
    if (!stockInForm.stockItemId || !stockInForm.qty) return;
    setStockInLoading(true);
    setStockInSuccess(false);
    try {
      await inventoryApi.stockIn({
        stockItemId: stockInForm.stockItemId,
        qty: Number(stockInForm.qty),
        unitCost: Number(stockInForm.unitCost || 0),
        movementType: stockInForm.movementType,
      });
      setStockInSuccess(true);
      setStockInForm({ stockItemId: '', qty: '', unitCost: '', movementType: 'PURCHASE_IN' });
      fetchStockItems();
    } catch (err: any) {
      alert(err.message || 'Stock-in failed');
    } finally {
      setStockInLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!adjForm.stockItemId || adjForm.physicalQty === '') return;
    setAdjLoading(true);
    setAdjResult(null);
    try {
      const result = await inventoryApi.adjust({
        stockItemId: adjForm.stockItemId,
        physicalQty: Number(adjForm.physicalQty),
        reason: adjForm.reason,
      });
      setAdjResult(result);
      fetchStockItems();
    } catch (err: any) {
      alert(err.message || 'Adjustment failed');
    } finally {
      setAdjLoading(false);
    }
  };

  const handleMapProduct = async (productId: string, stockItemId: string | null) => {
    setMappingLoading(productId);
    try {
      await inventoryApi.mapProduct(productId, stockItemId);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Mapping failed');
    } finally {
      setMappingLoading('');
    }
  };

  const tabs = [
    { id: 'items', label: 'Stock Items', icon: Package },
    { id: 'movements', label: 'Movement Ledger', icon: BarChart2 },
    { id: 'stock-in', label: 'Stock In', icon: ArrowUpCircle },
    { id: 'adjustments', label: 'Adjustments', icon: ClipboardList },
    { id: 'low-stock', label: 'Low Stock', icon: AlertTriangle },
    { id: 'mapping', label: 'Product Mapping', icon: Layers },
    { id: 'recipes', label: 'Recipes (Kitchen)', icon: ClipboardList },
    { id: 'transfer', label: 'Kitchen Issue', icon: ArrowDownCircle },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Inventory Control"
        subtitle="Stock management & movement tracking"
        showBack
        backUrl="/operations"
        actions={
          tab === 'items' && (
            <Button onClick={openAddItem} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100">
              <Plus size={16} />
              Add Stock Item
            </Button>
          )
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Total Items</p>
          <p className="text-3xl font-black section-heading mt-1">{stockItems.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Low Stock</p>
          <p className="text-3xl font-black text-red-500 mt-1">{stockItems.filter(i => i.isLow).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">In Stock</p>
          <p className="text-3xl font-black text-emerald-500 mt-1">{stockItems.filter(i => !i.isLow).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest">Total Movements</p>
          <p className="text-3xl font-black section-heading mt-1">{movTotal || '—'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-100 dark:border-slate-700 pb-0 overflow-x-auto no-scrollbar">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as Tab)}
            className={`flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest whitespace-nowrap border-b-2 transition-all ${
              tab === id
                ? 'border-pos-primary text-pos-primary'
                : 'border-transparent text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}

      {/* STOCK ITEMS TAB */}
      {tab === 'items' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 dark:border-slate-700 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={15} />
              <input
                type="text"
                placeholder="Search stock items..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-white/5 rounded-xl text-xs w-full max-w-sm focus:bg-white dark:focus:bg-slate-700 focus:border-emerald-200 transition-all font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />
            </div>
            {/* Restaurant / Bar Filter */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
              {(['ALL', 'RESTAURANT', 'BAR'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setInventoryMenuType(type)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    inventoryMenuType === type
                      ? type === 'BAR' ? 'bg-amber-500 text-white shadow-sm' : type === 'RESTAURANT' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-white shadow-sm'
                      : 'text-gray-400 dark:text-slate-400 hover:text-gray-600'
                  }`}
                >
                  {type === 'ALL' ? 'All' : type === 'RESTAURANT' ? '🍽️ Rest.' : '🍺 Bar'}
                </button>
              ))}
            </div>
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 dark:bg-slate-800 dark:text-white border border-transparent dark:border-white/5 rounded-xl text-xs font-bold outline-none focus:border-emerald-200 transition-all"
            >
              <option value="">All Warehouses (Total)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            <button onClick={fetchStockItems} className="p-2.5 text-gray-400 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-xl transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                  {['Item Name', 'SKU', 'Unit', 'Opening', 'Current Stock', 'Reorder Level', 'Cost Price', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.15em]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingItems ? (
                  <tr><td colSpan={9} className="py-16 text-center text-xs font-bold text-gray-300 dark:text-slate-500 uppercase tracking-widest">Loading...</td></tr>
                ) : stockItems.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center text-xs font-bold text-gray-300 dark:text-slate-500 uppercase tracking-widest">No stock items found. Add your first item.</td></tr>
                ) : stockItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.products && item.products.length > 0 && (
                          <div className="text-[9px] text-emerald-600 font-bold">
                            {item.products.length} product{item.products.length > 1 ? 's' : ''} linked
                          </div>
                        )}
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${(item as any).itemType === 'BAR' ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'}`}>
                          {(item as any).itemType === 'BAR' ? '🍺 Bar' : '🍽️ Rest.'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-slate-400 font-medium">{item.sku || '—'}</td>
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-slate-400 font-medium">{item.unit || '—'}</td>
                    <td className="px-5 py-4 text-xs font-bold text-gray-700 dark:text-slate-300">{item.openingStock}</td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-black ${item.isLow ? 'text-red-500' : 'text-emerald-600'}`}>
                        {item.currentStock !== undefined ? item.currentStock : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-slate-400">{item.reorderLevel}</td>
                    <td className="px-5 py-4 text-xs font-bold text-gray-700 dark:text-slate-300">₹{item.costPrice.toFixed(2)}</td>
                    <td className="px-5 py-4">
                      {item.isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase bg-red-50 dark:bg-red-950 text-red-600 border border-red-100 dark:border-red-900">
                          <AlertTriangle size={10} /> Low
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-100 dark:border-emerald-900">
                          <CheckCircle size={10} /> OK
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openEditItem(item)}
                        className="p-2 text-gray-400 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors"
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

      {/* MOVEMENT LEDGER TAB */}
      {tab === 'movements' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h3 className="font-black text-sm section-heading uppercase">Movement Ledger</h3>
              <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest">{movTotal} total entries</p>
            </div>
            <button onClick={fetchMovements} className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                  {['Date', 'Item', 'Warehouse', 'Type', 'Qty In', 'Qty Out', 'Balance', 'Reference'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.15em]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingMov ? (
                  <tr><td colSpan={8} className="py-16 text-center text-xs font-bold text-gray-300 uppercase">Loading...</td></tr>
                ) : movements.length === 0 ? (
                  <tr><td colSpan={8} className="py-16 text-center text-xs font-bold text-gray-300 uppercase">No movements recorded yet.</td></tr>
                ) : movements.map((m) => {
                  const meta = MOVEMENT_LABELS[m.movementType] || { label: m.movementType, color: 'text-gray-600 bg-gray-50' };
                  return (
                    <tr key={m.id} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/30 dark:hover:bg-slate-800/30">
                      <td className="px-5 py-3.5 text-xs text-gray-600 dark:text-slate-400 font-bold">
                        {new Date(m.movementDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs font-bold text-gray-900 dark:text-white">{m.stockItem?.name || '—'}</div>
                        <div className="text-[9px] text-gray-400 dark:text-slate-500">{m.stockItem?.unit || ''}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 dark:text-slate-400">{m.warehouse?.name || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {m.qtyIn > 0 && (
                          <span className="text-emerald-600 font-black text-sm flex items-center gap-1">
                            <TrendingUp size={12} /> +{m.qtyIn}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {m.qtyOut > 0 && (
                          <span className="text-red-500 font-black text-sm flex items-center gap-1">
                            <TrendingDown size={12} /> -{m.qtyOut}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-black text-gray-900 dark:text-white">{m.balanceQty}</td>
                      <td className="px-5 py-3.5 text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                        {m.referenceModule || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK IN TAB */}
      {tab === 'stock-in' && (
        <div className="max-w-xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 space-y-5">
            <div>
              <h3 className="font-black text-lg section-heading uppercase tracking-tight">Stock In / Purchase Entry</h3>
              <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Record stock received from supplier or manual opening stock entry</p>
            </div>

            {stockInSuccess && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-700">
                <CheckCircle size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Stock-in recorded successfully!</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Stock Item *</label>
                <select
                  value={stockInForm.stockItemId}
                  onChange={(e) => setStockInForm(f => ({ ...f, stockItemId: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-medium dark:text-slate-100 focus:border-pos-primary/40 focus:bg-white dark:focus:bg-slate-750 outline-none transition-all"
                >
                  <option value="">Select stock item...</option>
                  {stockItems.map(i => (
                    <option key={i.id} value={i.id} className="dark:bg-slate-900">{i.name} {i.unit ? `(${i.unit})` : ''} — Current: {i.currentStock ?? i.openingStock}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Entry Type</label>
                <select
                  value={stockInForm.movementType}
                  onChange={(e) => setStockInForm(f => ({ ...f, movementType: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-medium dark:text-slate-100 focus:border-pos-primary/40 focus:bg-white dark:focus:bg-slate-750 outline-none transition-all"
                >
                  <option value="PURCHASE_IN" className="dark:bg-slate-900">Purchase Entry</option>
                  <option value="OPENING" className="dark:bg-slate-900">Opening Stock (Manual)</option>
                  <option value="ADJUSTMENT_IN" className="dark:bg-slate-900">Adjustment In</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Quantity *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0"
                    value={stockInForm.qty}
                    onChange={(e) => setStockInForm(f => ({ ...f, qty: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:border-pos-primary/40 focus:bg-white outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Unit Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={stockInForm.unitCost}
                    onChange={(e) => setStockInForm(f => ({ ...f, unitCost: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold dark:text-slate-100 focus:border-pos-primary/40 focus:bg-white dark:focus:bg-slate-750 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600"
                  />
                </div>
              </div>

              <Button
                loading={stockInLoading}
                disabled={!stockInForm.stockItemId || !stockInForm.qty}
                onClick={handleStockIn}
                className="w-full py-4 bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-pos-primary/10 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowUpCircle size={16} />
                Record Stock In
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ADJUSTMENTS TAB */}
      {tab === 'adjustments' && (
        <div className="max-w-xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 space-y-5">
            <div>
              <h3 className="font-black text-lg section-heading uppercase tracking-tight">Physical Stock Adjustment</h3>
              <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Enter physical count to auto-calculate shortage or excess</p>
            </div>

            {adjResult && (
              <div className={`flex items-center gap-3 rounded-xl p-4 border ${adjResult.diff > 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                {adjResult.diff > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                <div>
                  <p className="text-xs font-black uppercase tracking-widest">
                    {adjResult.diff > 0 ? `Excess: +${adjResult.diff}` : `Shortage: ${adjResult.diff}`}
                  </p>
                  <p className="text-[10px] mt-0.5 opacity-70">Adjusted to physical qty: {adjResult.physicalQty}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Stock Item *</label>
                <select
                  value={adjForm.stockItemId}
                  onChange={(e) => { setAdjForm(f => ({ ...f, stockItemId: e.target.value })); setAdjResult(null); }}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-medium dark:text-slate-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-750 outline-none transition-all"
                >
                  <option value="">Select stock item...</option>
                  {stockItems.map(i => (
                    <option key={i.id} value={i.id} className="dark:bg-slate-900">{i.name} — System Stock: {i.currentStock ?? i.openingStock}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Physical Count (Actual) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter actual counted qty"
                  value={adjForm.physicalQty}
                  onChange={(e) => setAdjForm(f => ({ ...f, physicalQty: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:border-emerald-400 focus:bg-white outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly physical count, wastage, etc."
                  value={adjForm.reason}
                  onChange={(e) => setAdjForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:border-emerald-400 focus:bg-white outline-none transition-all"
                />
              </div>

              <Button
                loading={adjLoading}
                disabled={!adjForm.stockItemId || adjForm.physicalQty === ''}
                onClick={handleAdjust}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ClipboardList size={16} />
                Apply Adjustment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* LOW STOCK ALERTS TAB */}
      {tab === 'low-stock' && (
        <div className="space-y-4">
          {loadingLow ? (
            <div className="py-20 text-center text-xs font-bold text-gray-300 uppercase tracking-widest">Loading...</div>
          ) : lowStockItems.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-12 flex flex-col items-center gap-4 text-emerald-600">
              <CheckCircle size={48} className="opacity-40" />
              <p className="font-black text-sm uppercase tracking-widest">All stock levels are healthy!</p>
              <p className="text-xs font-bold opacity-60">No items below reorder level</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-5 py-4">
                <AlertTriangle size={18} className="text-red-500" />
                <p className="text-xs font-black text-red-700 uppercase tracking-widest">
                  {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} below reorder level — Immediate reorder required
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lowStockItems.map((item: any) => (
                  <div key={item.id} className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="font-black text-sm text-gray-900">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                          {item.unit || 'Units'} {item.sku ? `• ${item.sku}` : ''}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 rounded-full px-2.5 py-1 text-[9px] font-black uppercase">
                        <AlertTriangle size={9} /> Low
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-bold uppercase tracking-widest">Current</span>
                        <span className="font-black text-red-500">{item.currentStock ?? item.openingStock}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400 font-bold uppercase tracking-widest">Reorder At</span>
                        <span className="font-black text-gray-700">{item.reorderLevel}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-red-400 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, ((item.currentStock || 0) / Math.max(1, item.reorderLevel)) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => { setTab('stock-in'); setStockInForm(f => ({ ...f, stockItemId: item.id })); }}
                      className="mt-4 w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ArrowUpCircle size={12} /> Stock In Now
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* PRODUCT MAPPING TAB */}
      {tab === 'mapping' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 dark:border-slate-700">
            <h3 className="font-black text-sm section-heading uppercase">Product → Stock Item Mapping</h3>
            <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Link products to stock items for automatic deduction when sold
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                  {['Product', 'Category', 'Linked Stock Item', 'Track Inventory', 'Action'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[9px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-[0.15em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingProducts ? (
                  <tr><td colSpan={5} className="py-16 text-center text-xs font-bold text-gray-300 dark:text-slate-500 uppercase">Loading...</td></tr>
                ) : products.length === 0 ? (
                  <tr><td colSpan={5} className="py-16 text-center text-xs font-bold text-gray-300 dark:text-slate-500 uppercase">No products found.</td></tr>
                ) : products.map(product => (
                  <tr key={product.id} className="border-b border-gray-50 dark:border-slate-700 hover:bg-gray-50/30 dark:hover:bg-slate-800/30">
                    <td className="px-5 py-4">
                      <div className="font-bold text-sm text-gray-900 dark:text-white">{product.name}</div>
                      {product.sku && <div className="text-[9px] text-gray-400 font-bold">{product.sku}</div>}
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-slate-400">{product.category?.name || '—'}</td>
                    <td className="px-5 py-4">
                      <select
                        value={(product as any).stockItemId || ''}
                        disabled={mappingLoading === product.id}
                        onChange={(e) => handleMapProduct(product.id, e.target.value || null)}
                        className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 rounded-lg text-xs font-medium focus:border-emerald-400 dark:focus:bg-slate-700 outline-none transition-all min-w-[180px]"
                      >
                        <option value="">— Not mapped —</option>
                        {stockItems.map(si => (
                          <option key={si.id} value={si.id}>{si.name} {si.unit ? `(${si.unit})` : ''}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      {product.trackInventory ? (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-900">
                          <CheckCircle size={10} /> Yes
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-full border border-gray-100 dark:border-slate-700">
                          <X size={10} /> No
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {mappingLoading === product.id && (
                        <RefreshCw size={14} className="text-emerald-500 animate-spin" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECIPES TAB */}
      {tab === 'recipes' && (
        <div className="grid grid-cols-3 gap-6">
          {/* Product List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden h-[600px] flex flex-col">
            <div className="p-4 border-b border-gray-50 dark:border-slate-700">
              <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest">Select Product</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={async () => {
                    setSelectedProductId(p.id);
                    setLoadingRecipe(true);
                    try {
                      const data = await inventoryApi.listRecipes(p.id);
                      setRecipeIngredients(data.map(i => ({ stockItemId: i.stockItemId, quantity: String(i.quantity) })));
                    } catch {
                      setRecipeIngredients([]);
                    } finally {
                      setLoadingRecipe(false);
                    }
                  }}
                  className={`w-full text-left p-4 border-b border-gray-50 dark:border-slate-800 transition-colors ${
                    selectedProductId === p.id ? 'bg-pos-primary/5 border-l-4 border-l-pos-primary' : 'hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold text-xs text-gray-900 dark:text-white">{p.name}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{p.category?.name || 'Category'}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Recipe Editor */}
          <div className="col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 flex flex-col h-[600px]">
            {selectedProductId ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-lg section-heading uppercase tracking-tight">
                      Recipe: {products.find(p => p.id === selectedProductId)?.name}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                      Define ingredients used for 1 unit of this product
                    </p>
                  </div>
                  <Button
                    loading={savingRecipe}
                    onClick={async () => {
                      setSavingRecipe(true);
                      try {
                        await inventoryApi.updateRecipe(selectedProductId, recipeIngredients.map(i => ({
                          stockItemId: i.stockItemId,
                          quantity: Number(i.quantity)
                        })));
                        alert('Recipe saved successfully!');
                        fetchProducts(); // Refresh to show trackInventory badge
                      } catch (err: any) {
                        alert(err.message || 'Failed to save recipe');
                      } finally {
                        setSavingRecipe(false);
                      }
                    }}
                    className="bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-widest"
                  >
                    Save Recipe
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {loadingRecipe ? (
                    <div className="py-20 text-center text-xs font-bold text-gray-300 uppercase">Loading recipe...</div>
                  ) : (
                    <>
                      {recipeIngredients.map((ing, idx) => (
                        <div key={idx} className="flex gap-4 items-end bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-transparent hover:border-pos-primary/20 transition-all">
                          <div className="flex-1">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Ingredient (Stock Item)</label>
                            <select
                              value={ing.stockItemId}
                              onChange={(e) => {
                                const newIngs = [...recipeIngredients];
                                newIngs[idx].stockItemId = e.target.value;
                                setRecipeIngredients(newIngs);
                              }}
                              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-lg text-xs font-medium focus:border-pos-primary outline-none"
                            >
                              <option value="">Select ingredient...</option>
                              {stockItems.map(si => (
                                <option key={si.id} value={si.id}>{si.name} ({si.unit || 'Units'})</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-32">
                            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Quantity</label>
                            <input
                              type="number"
                              step="0.001"
                              placeholder="0.00"
                              value={ing.quantity}
                              onChange={(e) => {
                                const newIngs = [...recipeIngredients];
                                newIngs[idx].quantity = e.target.value;
                                setRecipeIngredients(newIngs);
                              }}
                              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-lg text-xs font-bold focus:border-pos-primary outline-none"
                            />
                          </div>
                          <button
                            onClick={() => {
                              setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx));
                            }}
                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => setRecipeIngredients([...recipeIngredients, { stockItemId: '', quantity: '' }])}
                        className="w-full py-4 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-xl text-gray-400 hover:text-pos-primary hover:border-pos-primary/30 hover:bg-pos-primary/5 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        Add Ingredient
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-300 gap-4">
                <ClipboardList size={64} className="opacity-20" />
                <p className="font-black text-sm uppercase tracking-widest opacity-40">Select a product to edit its recipe</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TRANSFER TAB */}
      {tab === 'transfer' && (
        <div className="max-w-xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-8 space-y-5">
            <div>
              <h3 className="font-black text-lg section-heading uppercase tracking-tight">Issue Stock to Kitchen</h3>
              <p className="text-xs text-gray-400 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Move stock from Main Store to Kitchen Store</p>
            </div>

            {transferSuccess && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-700">
                <CheckCircle size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Stock transferred successfully!</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Stock Item *</label>
                <select
                  value={transferForm.stockItemId}
                  onChange={(e) => setTransferForm(f => ({ ...f, stockItemId: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-medium dark:text-slate-100 focus:border-pos-primary/40 focus:bg-white outline-none transition-all"
                >
                  <option value="">Select stock item...</option>
                  {stockItems.map(i => (
                    <option key={i.id} value={i.id} className="dark:bg-slate-900">{i.name} — Available: {i.currentStock ?? i.openingStock} {i.unit}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">From Warehouse</label>
                  <select
                    value={transferForm.fromWarehouseId}
                    onChange={(e) => setTransferForm(f => ({ ...f, fromWarehouseId: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-medium dark:text-slate-100 focus:border-pos-primary/40 focus:bg-white outline-none transition-all"
                  >
                    <option value="">Select source...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id} className="dark:bg-slate-900">{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">To Warehouse (Kitchen)</label>
                  <select
                    value={transferForm.toWarehouseId}
                    onChange={(e) => setTransferForm(f => ({ ...f, toWarehouseId: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-medium dark:text-slate-100 focus:border-pos-primary/40 focus:bg-white outline-none transition-all"
                  >
                    <option value="">Select destination...</option>
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id} className="dark:bg-slate-900">{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">Quantity to Move *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={transferForm.qty}
                  onChange={(e) => setTransferForm(f => ({ ...f, qty: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold dark:text-slate-100 focus:border-pos-primary/40 focus:bg-white outline-none transition-all"
                />
              </div>

              <Button
                loading={transferLoading}
                disabled={!transferForm.stockItemId || !transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.qty}
                onClick={async () => {
                   if (transferForm.fromWarehouseId === transferForm.toWarehouseId) return alert('Source and destination cannot be same');
                   setTransferLoading(true);
                   try {
                     await inventoryApi.transferStock({
                       stockItemId: transferForm.stockItemId,
                       fromWarehouseId: transferForm.fromWarehouseId,
                       toWarehouseId: transferForm.toWarehouseId,
                       qty: Number(transferForm.qty)
                     });
                     setTransferSuccess(true);
                     setTransferForm({ stockItemId: '', fromWarehouseId: '', toWarehouseId: '', qty: '' });
                     fetchStockItems();
                   } catch (err: any) {
                     alert(err.message || 'Transfer failed');
                   } finally {
                     setTransferLoading(false);
                   }
                }}
                className="w-full py-4 bg-pos-primary hover:bg-pos-primary-dark text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-pos-primary/10 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowDownCircle size={16} />
                Transfer Stock
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Stock Item Modal */}
      <Modal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        title={editItem ? 'Edit Stock Item' : 'Add New Stock Item'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">Item Name *</label>
              <input
                type="text"
                placeholder="e.g. Chicken, Maida, Tomato..."
                value={itemForm.name}
                onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold dark:text-slate-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">SKU / Code</label>
              <input
                type="text"
                placeholder="e.g. CHK-001"
                value={itemForm.sku}
                onChange={(e) => setItemForm(f => ({ ...f, sku: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-medium dark:text-slate-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">Unit</label>
              <select
                value={itemForm.unit}
                onChange={(e) => setItemForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-medium dark:text-slate-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all"
              >
                <option value="" className="dark:bg-slate-900">Select unit...</option>
                {['KG', 'G', 'L', 'ML', 'PCS', 'BOX', 'PKT', 'DOZEN', 'PLATE', 'BOTTLE'].map((u: any) => (
                  <option key={u} value={u} className="dark:bg-slate-900">{u}</option>
                ))}
              </select>
            </div>
            {!editItem && (
              <div>
                <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">Opening Stock</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={itemForm.openingStock}
                  onChange={(e) => setItemForm(f => ({ ...f, openingStock: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold dark:text-slate-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600"
                />
              </div>
            )}
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={itemForm.costPrice}
                onChange={(e) => setItemForm(f => ({ ...f, costPrice: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold dark:text-slate-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">Reorder Level</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={itemForm.reorderLevel}
                onChange={(e) => setItemForm(f => ({ ...f, reorderLevel: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold dark:text-slate-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-1.5">Minimum Stock</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={itemForm.minimumStock}
                onChange={(e) => setItemForm(f => ({ ...f, minimumStock: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/5 rounded-xl text-sm font-bold dark:text-slate-100 focus:border-emerald-400 focus:bg-white dark:focus:bg-slate-950 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-black text-gray-500 dark:text-slate-500 uppercase tracking-widest mb-2">Item Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setItemForm(f => ({ ...f, itemType: 'RESTAURANT' }))}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-[11px] font-black uppercase tracking-widest ${itemForm.itemType === 'RESTAURANT' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' : 'border-gray-200 dark:border-slate-700 text-gray-400'}`}
                >
                  🍽️ Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setItemForm(f => ({ ...f, itemType: 'BAR' }))}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-[11px] font-black uppercase tracking-widest ${itemForm.itemType === 'BAR' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' : 'border-gray-200 dark:border-slate-700 text-gray-400'}`}
                >
                  🍺 Bar
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setIsAddItemOpen(false)}
              className="flex-1 py-3 border border-gray-200 dark:border-white/5 bg-white dark:bg-slate-900/50 text-gray-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              loading={savingItem}
              disabled={!itemForm.name}
              onClick={saveItem}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-100 disabled:opacity-50"
            >
              {editItem ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
