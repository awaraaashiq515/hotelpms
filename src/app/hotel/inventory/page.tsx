'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Package, Plus, Search, Tag } from 'lucide-react';
import { StockStats }  from './components/StockStats';
import { StockTable }  from './components/StockTable';
import { LowStockAlert, type StockItem } from './components/LowStockAlert';
import { AddStockModal } from './components/AddStockModal';

/* ─────────────────────────────────────────────
   All Hotel Products — comprehensive list
───────────────────────────────────────────── */
const INITIAL_STOCK: StockItem[] = [
  /* ── Linen ── */
  { id:'L01', name:'Bath Towel (Large)',       category:'Linen',        unit:'Pcs',    currentStock:120, reorderLevel:50,  maxStock:200, unitCost:350,  supplier:'Texco Fabrics' },
  { id:'L02', name:'Bath Towel (Small)',       category:'Linen',        unit:'Pcs',    currentStock:90,  reorderLevel:40,  maxStock:180, unitCost:180,  supplier:'Texco Fabrics' },
  { id:'L03', name:'Hand Towel',               category:'Linen',        unit:'Pcs',    currentStock:100, reorderLevel:40,  maxStock:200, unitCost:120,  supplier:'Texco Fabrics' },
  { id:'L04', name:'Face Towel',               category:'Linen',        unit:'Pcs',    currentStock:80,  reorderLevel:40,  maxStock:200, unitCost:80,   supplier:'Texco Fabrics' },
  { id:'L05', name:'Bed Sheet (King)',          category:'Linen',        unit:'Set',    currentStock:40,  reorderLevel:30,  maxStock:100, unitCost:800,  supplier:'Texco Fabrics' },
  { id:'L06', name:'Bed Sheet (Queen)',         category:'Linen',        unit:'Set',    currentStock:35,  reorderLevel:25,  maxStock:80,  unitCost:650,  supplier:'Texco Fabrics' },
  { id:'L07', name:'Pillow Cover',             category:'Linen',        unit:'Pcs',    currentStock:90,  reorderLevel:40,  maxStock:180, unitCost:150,  supplier:'Texco Fabrics' },
  { id:'L08', name:'Duvet Cover',              category:'Linen',        unit:'Set',    currentStock:30,  reorderLevel:20,  maxStock:80,  unitCost:1200, supplier:'Texco Fabrics' },
  { id:'L09', name:'Blanket (Single)',         category:'Linen',        unit:'Pcs',    currentStock:25,  reorderLevel:15,  maxStock:60,  unitCost:500,  supplier:'Texco Fabrics' },
  { id:'L10', name:'Bath Robe',                category:'Linen',        unit:'Pcs',    currentStock:20,  reorderLevel:10,  maxStock:50,  unitCost:900,  supplier:'Texco Fabrics' },
  { id:'L11', name:'Bath Mat',                 category:'Linen',        unit:'Pcs',    currentStock:60,  reorderLevel:25,  maxStock:120, unitCost:200,  supplier:'Texco Fabrics' },

  /* ── Toiletries ── */
  { id:'T01', name:'Shampoo (30ml)',            category:'Toiletries',   unit:'Pcs',    currentStock:15,  reorderLevel:100, maxStock:500, unitCost:25,   supplier:'HygienePro' },
  { id:'T02', name:'Conditioner (30ml)',        category:'Toiletries',   unit:'Pcs',    currentStock:20,  reorderLevel:80,  maxStock:400, unitCost:30,   supplier:'HygienePro' },
  { id:'T03', name:'Soap Bar (30g)',            category:'Toiletries',   unit:'Pcs',    currentStock:80,  reorderLevel:100, maxStock:500, unitCost:15,   supplier:'HygienePro' },
  { id:'T04', name:'Body Lotion (30ml)',        category:'Toiletries',   unit:'Pcs',    currentStock:50,  reorderLevel:80,  maxStock:400, unitCost:35,   supplier:'HygienePro' },
  { id:'T05', name:'Shower Cap',                category:'Toiletries',   unit:'Pcs',    currentStock:120, reorderLevel:80,  maxStock:500, unitCost:8,    supplier:'HygienePro' },
  { id:'T06', name:'Toothbrush Kit',           category:'Toiletries',   unit:'Kit',    currentStock:60,  reorderLevel:50,  maxStock:300, unitCost:20,   supplier:'HygienePro' },
  { id:'T07', name:'Dental Kit (Mini)',         category:'Toiletries',   unit:'Kit',    currentStock:40,  reorderLevel:60,  maxStock:300, unitCost:25,   supplier:'HygienePro' },
  { id:'T08', name:'Razor (Disposable)',        category:'Toiletries',   unit:'Pcs',    currentStock:70,  reorderLevel:50,  maxStock:300, unitCost:12,   supplier:'HygienePro' },
  { id:'T09', name:'Shaving Cream Sachet',     category:'Toiletries',   unit:'Pcs',    currentStock:60,  reorderLevel:50,  maxStock:250, unitCost:18,   supplier:'HygienePro' },
  { id:'T10', name:'Vanity Kit',               category:'Toiletries',   unit:'Kit',    currentStock:55,  reorderLevel:50,  maxStock:250, unitCost:30,   supplier:'HygienePro' },
  { id:'T11', name:'Sewing Kit',               category:'Toiletries',   unit:'Kit',    currentStock:40,  reorderLevel:30,  maxStock:200, unitCost:15,   supplier:'HygienePro' },
  { id:'T12', name:'Cotton Swabs (Box)',        category:'Toiletries',   unit:'Box',    currentStock:30,  reorderLevel:20,  maxStock:100, unitCost:40,   supplier:'HygienePro' },

  /* ── F&B ── */
  { id:'F01', name:'Mineral Water 1L',          category:'F&B',          unit:'Bottle', currentStock:60,  reorderLevel:50,  maxStock:200, unitCost:20,   supplier:'AquaPure' },
  { id:'F02', name:'Mineral Water 500ml',       category:'F&B',          unit:'Bottle', currentStock:80,  reorderLevel:60,  maxStock:300, unitCost:12,   supplier:'AquaPure' },
  { id:'F03', name:'Basmati Rice',              category:'F&B',          unit:'Kg',     currentStock:25,  reorderLevel:20,  maxStock:100, unitCost:90,   supplier:'FoodCorp' },
  { id:'F04', name:'Cooking Oil',               category:'F&B',          unit:'Litre',  currentStock:8,   reorderLevel:10,  maxStock:50,  unitCost:120,  supplier:'FoodCorp' },
  { id:'F05', name:'Tea Bags (Box of 100)',     category:'F&B',          unit:'Box',    currentStock:15,  reorderLevel:10,  maxStock:50,  unitCost:180,  supplier:'FoodCorp' },
  { id:'F06', name:'Coffee Sachets',            category:'F&B',          unit:'Box',    currentStock:12,  reorderLevel:10,  maxStock:50,  unitCost:250,  supplier:'FoodCorp' },
  { id:'F07', name:'Sugar Sachets (Box)',       category:'F&B',          unit:'Box',    currentStock:20,  reorderLevel:15,  maxStock:60,  unitCost:60,   supplier:'FoodCorp' },
  { id:'F08', name:'Creamer Sachets (Box)',     category:'F&B',          unit:'Box',    currentStock:18,  reorderLevel:12,  maxStock:50,  unitCost:80,   supplier:'FoodCorp' },
  { id:'F09', name:'Ketchup Sachets (Box)',     category:'F&B',          unit:'Box',    currentStock:10,  reorderLevel:8,   maxStock:40,  unitCost:90,   supplier:'FoodCorp' },

  /* ── Housekeeping ── */
  { id:'H01', name:'Floor Cleaner',             category:'Housekeeping', unit:'Litre',  currentStock:45,  reorderLevel:20,  maxStock:100, unitCost:75,   supplier:'CleanPro' },
  { id:'H02', name:'Toilet Cleaner',            category:'Housekeeping', unit:'Bottle', currentStock:30,  reorderLevel:15,  maxStock:80,  unitCost:60,   supplier:'CleanPro' },
  { id:'H03', name:'Glass Cleaner',             category:'Housekeeping', unit:'Bottle', currentStock:22,  reorderLevel:12,  maxStock:60,  unitCost:80,   supplier:'CleanPro' },
  { id:'H04', name:'Garbage Bags (Medium)',     category:'Housekeeping', unit:'Roll',   currentStock:22,  reorderLevel:15,  maxStock:60,  unitCost:80,   supplier:'CleanPro' },
  { id:'H05', name:'Garbage Bags (Large)',      category:'Housekeeping', unit:'Roll',   currentStock:18,  reorderLevel:12,  maxStock:50,  unitCost:120,  supplier:'CleanPro' },
  { id:'H06', name:'Mop Heads',                 category:'Housekeeping', unit:'Pcs',    currentStock:10,  reorderLevel:5,   maxStock:30,  unitCost:150,  supplier:'CleanPro' },
  { id:'H07', name:'Scrub Pad',                 category:'Housekeeping', unit:'Pcs',    currentStock:25,  reorderLevel:15,  maxStock:80,  unitCost:30,   supplier:'CleanPro' },
  { id:'H08', name:'Broom (Soft)',              category:'Housekeeping', unit:'Pcs',    currentStock:8,   reorderLevel:4,   maxStock:20,  unitCost:200,  supplier:'CleanPro' },
  { id:'H09', name:'Air Freshener (Can)',       category:'Housekeeping', unit:'Can',    currentStock:15,  reorderLevel:10,  maxStock:50,  unitCost:120,  supplier:'CleanPro' },
  { id:'H10', name:'Toilet Paper Roll',         category:'Housekeeping', unit:'Roll',   currentStock:200, reorderLevel:100, maxStock:500, unitCost:15,   supplier:'CleanPro' },
  { id:'H11', name:'Tissue Box',                category:'Housekeeping', unit:'Box',    currentStock:60,  reorderLevel:40,  maxStock:150, unitCost:35,   supplier:'CleanPro' },

  /* ── Safety ── */
  { id:'S01', name:'Hand Sanitizer (500ml)',    category:'Safety',       unit:'Bottle', currentStock:5,   reorderLevel:20,  maxStock:100, unitCost:150,  supplier:'HygienePro' },
  { id:'S02', name:'Disinfectant Spray',        category:'Safety',       unit:'Bottle', currentStock:18,  reorderLevel:25,  maxStock:80,  unitCost:200,  supplier:'HygienePro' },
  { id:'S03', name:'Disposable Gloves (Box)',   category:'Safety',       unit:'Box',    currentStock:12,  reorderLevel:10,  maxStock:50,  unitCost:180,  supplier:'SafetyMart' },
  { id:'S04', name:'Face Mask (Box of 50)',     category:'Safety',       unit:'Box',    currentStock:8,   reorderLevel:10,  maxStock:40,  unitCost:220,  supplier:'SafetyMart' },
  { id:'S05', name:'First Aid Kit',             category:'Safety',       unit:'Kit',    currentStock:5,   reorderLevel:3,   maxStock:15,  unitCost:800,  supplier:'SafetyMart' },
  { id:'S06', name:'Fire Extinguisher Recharge',category:'Safety',       unit:'Pcs',    currentStock:3,   reorderLevel:2,   maxStock:10,  unitCost:1200, supplier:'SafetyMart' },

  /* ── Stationery ── */
  { id:'ST01',name:'Printer Paper A4 (Ream)',  category:'Stationery',   unit:'Ream',   currentStock:30,  reorderLevel:10,  maxStock:100, unitCost:450,  supplier:'OfficeMart' },
  { id:'ST02',name:'Pen (Blue)',               category:'Stationery',   unit:'Pcs',    currentStock:150, reorderLevel:50,  maxStock:300, unitCost:10,   supplier:'OfficeMart' },
  { id:'ST03',name:'Notepad (A5)',             category:'Stationery',   unit:'Pcs',    currentStock:60,  reorderLevel:30,  maxStock:150, unitCost:35,   supplier:'OfficeMart' },
  { id:'ST04',name:'Envelope (Box)',           category:'Stationery',   unit:'Box',    currentStock:20,  reorderLevel:10,  maxStock:60,  unitCost:120,  supplier:'OfficeMart' },
  { id:'ST05',name:'Stapler Pin Box',          category:'Stationery',   unit:'Box',    currentStock:10,  reorderLevel:5,   maxStock:30,  unitCost:30,   supplier:'OfficeMart' },
  { id:'ST06',name:'Marker (Black)',           category:'Stationery',   unit:'Pcs',    currentStock:25,  reorderLevel:10,  maxStock:80,  unitCost:20,   supplier:'OfficeMart' },
  { id:'ST07',name:'Sticky Notes (Pad)',       category:'Stationery',   unit:'Pcs',    currentStock:40,  reorderLevel:20,  maxStock:100, unitCost:25,   supplier:'OfficeMart' },

  /* ── Maintenance ── */
  { id:'M01', name:'LED Bulb (9W)',            category:'Maintenance',  unit:'Pcs',    currentStock:30,  reorderLevel:15,  maxStock:80,  unitCost:80,   supplier:'ElectroParts' },
  { id:'M02', name:'LED Tube Light (18W)',     category:'Maintenance',  unit:'Pcs',    currentStock:15,  reorderLevel:8,   maxStock:40,  unitCost:150,  supplier:'ElectroParts' },
  { id:'M03', name:'AA Battery (Pack of 4)',   category:'Maintenance',  unit:'Pack',   currentStock:20,  reorderLevel:10,  maxStock:60,  unitCost:60,   supplier:'ElectroParts' },
  { id:'M04', name:'WD-40 Spray',             category:'Maintenance',  unit:'Can',    currentStock:8,   reorderLevel:5,   maxStock:25,  unitCost:250,  supplier:'ElectroParts' },
  { id:'M05', name:'Electrical Tape',          category:'Maintenance',  unit:'Roll',   currentStock:12,  reorderLevel:6,   maxStock:30,  unitCost:40,   supplier:'ElectroParts' },
  { id:'M06', name:'Plumber Sealant',          category:'Maintenance',  unit:'Pcs',    currentStock:6,   reorderLevel:4,   maxStock:20,  unitCost:120,  supplier:'ElectroParts' },
];

const CATEGORIES = ['All', ...Array.from(new Set(INITIAL_STOCK.map(s => s.category)))];

export default function InventoryPage() {
  const [stock,     setStock]     = useState<StockItem[]>(INITIAL_STOCK);
  const [search,    setSearch]    = useState('');
  const [cat,       setCat]       = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [toast,     setToast]     = useState<string | null>(null);

  const items = stock
    .filter(i => cat === 'All' || i.category === cat)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()));

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Confirm restock ── */
  const handleAddStock = (entries: { item: StockItem; qty: number }[], newItems: StockItem[]) => {
    setStock(prev => {
      // merge new items
      let next = [...prev];
      newItems.forEach(ni => {
        if (!next.find(s => s.id === ni.id)) next = [...next, ni];
      });
      // update quantities
      return next.map(s => {
        const entry = entries.find(e => e.item.id === s.id);
        if (!entry) return s;
        return { ...s, currentStock: Math.min(s.maxStock, s.currentStock + entry.qty) };
      });
    });

    const totalQty = entries.reduce((s, e) => s + e.qty, 0);
    const msg = entries.length === 1
      ? `✓ ${entries[0].item.name} restocked +${entries[0].qty} ${entries[0].item.unit}`
      : `✓ ${entries.length} items restocked · ${totalQty} units added`;
    showToast(msg);
  };

  return (
    <div className="space-y-5 pb-10 max-w-[1400px] mx-auto">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[60] animate-in slide-in-from-top-3 duration-300
                        bg-emerald-600 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-xl border border-emerald-500/40">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Package size={14} className="text-orange-400" />
            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
              Operations · Inventory
            </span>
          </div>
          <h1 className="text-2xl font-black text-white">Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {stock.length} items tracked · Real-time stock levels
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/hotel/products"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider transition-all"
          >
            <Tag size={14} /> Master Product Catalog
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-orange-600 hover:bg-orange-500
                       text-white text-xs font-black uppercase tracking-wider transition-colors"
          >
            <Plus size={12} /> Add Stock
          </button>
        </div>
      </div>

      <StockStats items={stock} />
      <LowStockAlert items={stock} />

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items…"
            className="w-full h-9 pl-9 pr-4 bg-slate-800/60 border border-slate-700 rounded-xl
                       text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 h-9 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors
                ${cat === c ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <StockTable items={items} onEdit={(item) => console.log('Edit:', item.id)} />

      {/* Modal */}
      {showModal && (
        <AddStockModal
          allItems={stock}
          onClose={() => setShowModal(false)}
          onConfirm={handleAddStock}
        />
      )}
    </div>
  );
}
