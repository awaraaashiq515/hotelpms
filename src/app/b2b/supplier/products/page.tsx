'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  Search, 
  ShoppingBag,
  X,
  Upload,
  Loader2,
  Package,
  Percent,
  TrendingDown,
  Edit2,
  Trash2,
  Save,
  Check,
  Filter,
  ChevronRight,
  Receipt,
  Hash,
  Sparkles,
  Brain,
  Zap,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { loadModel, recognizeProduct, isModelLoaded, type ProductPrediction } from '@/lib/ai-product-recognition';
import { extractTextFromImage, parseMenuText, type ParsedMenuItem } from '@/lib/menu-ocr-parser';

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  // Form State
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    unit: 'kg',
    category: 'Vegetables',
    description: '',
    image: '',
    discount: '0',
    gstRate: '18',
    hsnCode: '',
    taxType: 'Exclusive',
    stockQuantity: '0'
  });

  const [categories, setCategories] = useState(['Vegetables', 'Dairy', 'Meat', 'Grocery', 'Poultry']);
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [aiScanning, setAiScanning] = useState(false);
  const [aiResult, setAiResult] = useState<ProductPrediction | null>(null);
  const [aiModelReady, setAiModelReady] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  
  // Menu Import State
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [parsingMenu, setParsingMenu] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parsedItems, setParsedItems] = useState<ParsedMenuItem[]>([]);
  const [importingBulk, setImportingBulk] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      if (sessionData.authenticated && sessionData.user.supplierId) {
        setSupplierId(sessionData.user.supplierId);
        fetchProducts(sessionData.user.supplierId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setLoading(false);
    }
  };

  const fetchProducts = async (sid: string) => {
    try {
      const res = await fetch(`/api/b2b/products?supplierId=${sid}`);
      const data = await res.json();
      setProducts(data);
      
      // Update dynamic categories from products
      const uniqueCats = Array.from(new Set(['All', ...categories, ...data.map((p: any) => p.category).filter(Boolean)]));
      setCategories(uniqueCats);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };

  // Simple image upload for product photos (no AI)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Scanner — separate from product image upload
  // Menu Card Upload & Parsing
  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsingMenu(true);
    setParseProgress(0);
    setParsedItems([]);
    toast.loading('📑 Reading Menu Card...', { id: 'menu-ocr' });

    try {
      const text = await extractTextFromImage(file, (p) => setParseProgress(p));
      const items = parseMenuText(text);
      
      if (items.length > 0) {
        setParsedItems(items);
        toast.success(`✨ Found ${items.length} items from menu!`, { id: 'menu-ocr' });
      } else {
        toast.error('Could not find any items. Try a clearer photo.', { id: 'menu-ocr' });
      }
    } catch (err) {
      console.error('Menu OCR failed:', err);
      toast.error('Failed to read menu. Try again.', { id: 'menu-ocr' });
    } finally {
      setParsingMenu(false);
    }
  };

  const handleBulkSave = async () => {
    if (!supplierId || parsedItems.length === 0) return;
    setImportingBulk(true);
    toast.loading(`Saving ${parsedItems.length} products...`, { id: 'bulk-save' });

    try {
      let successCount = 0;
      for (const item of parsedItems) {
        const res = await fetch('/api/b2b/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...item,
            price: parseFloat(item.price) || 0,
            supplierId
          })
        });
        if (res.ok) successCount++;
      }

      toast.success(`Successfully added ${successCount} products!`, { id: 'bulk-save' });
      setShowMenuModal(false);
      setParsedItems([]);
      fetchProducts(supplierId);
    } catch (err) {
      toast.error('Bulk import failed partly.', { id: 'bulk-save' });
    } finally {
      setImportingBulk(false);
    }
  };

  const removeParsedItem = (index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateParsedItem = (index: number, field: string, value: string) => {
    setParsedItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleEdit = (product: any) => {
    setIsEditing(true);
    setSelectedProductId(product.id);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      unit: product.unit,
      category: product.category || 'Vegetables',
      description: product.description || '',
      image: product.image || '',
      discount: (product.discount || 0).toString(),
      gstRate: (product.gstRate || 18).toString(),
      hsnCode: product.hsnCode || '',
      taxType: product.taxType || 'Exclusive',
      stockQuantity: (product.stockQuantity || 0).toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/b2b/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted');
        if (supplierId) fetchProducts(supplierId);
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) return;
    setSubmitting(true);

    try {
      const url = '/api/b2b/products';
      const method = isEditing ? 'PATCH' : 'POST';
      const body = isEditing ? { ...formData, id: selectedProductId } : { ...formData, supplierId };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        toast.success(isEditing ? 'Product updated' : 'Product added');
        setShowModal(false);
        resetForm();
        fetchProducts(supplierId);
      } else {
        toast.error('Failed to save product');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setSelectedProductId(null);
    setFormData({ name: '', price: '', unit: 'kg', category: 'Vegetables', description: '', image: '', discount: '0', gstRate: '18', hsnCode: '', taxType: 'Exclusive', stockQuantity: '0' });
  };

  const addNewCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setFormData({ ...formData, category: newCategory });
      setNewCategory('');
      setShowAddCategory(false);
      toast.success(`Category "${newCategory}" added`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!mounted) return null;

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 pb-12">
      <PageHeader 
        title="Inventory Catalog" 
        description="Manage your products, categories and active pricing"
        actions={
          <div className="flex gap-2">
             <Button onClick={() => { setParsedItems([]); setShowMenuModal(true); }} variant="outline" className="gap-2 h-10 px-5 rounded-xl text-[10px] font-black uppercase border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                <FileText size={16} /> Import Menu Card
             </Button>
             <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                <Plus size={18} /> Add Item
             </Button>
          </div>
        }
      />

      {/* Categories & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
           <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar max-w-full">
              {categories.map((cat) => (
                 <button
                   key={cat}
                   onClick={() => setSelectedCategory(cat)}
                   className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                     selectedCategory === cat 
                     ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                     : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                   }`}
                 >
                   {cat}
                 </button>
              ))}
           </div>

           <div className="relative w-full lg:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={16} />
              <input 
                type="text" placeholder="Search in catalog..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl outline-none text-[10px] font-bold uppercase tracking-tight"
              />
           </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-slate-50 dark:bg-slate-900 rounded-2xl animate-pulse" />)}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
          {filteredProducts.map(product => (
            <Card key={product.id} className="p-3 group hover:shadow-xl transition-all border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 rounded-2xl overflow-hidden flex flex-col h-full text-center relative">
               {/* Hover Actions */}
               <div className="absolute top-2 right-2 flex flex-col gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(product)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md text-slate-600 hover:text-emerald-500"><Edit2 size={12} /></button>
                  <button onClick={() => handleDelete(product.id)} className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md text-slate-600 hover:text-rose-500"><Trash2 size={12} /></button>
               </div>

               <div className="relative h-24 bg-slate-50 dark:bg-slate-900 rounded-xl mb-3 overflow-hidden flex items-center justify-center text-slate-300">
                  {product.image ? (
                    <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <Package size={32} className="opacity-20" />
                  )}
                  {product.discount > 0 && (
                    <div className="absolute top-2 left-2 bg-rose-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md shadow-lg flex items-center gap-1">
                       <TrendingDown size={10} /> {product.discount}% OFF
                    </div>
                  )}
               </div>
               
               <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="neutral" className="text-[7px] font-black uppercase px-1 h-3.5">{product.category}</Badge>
                    <p className="text-[10px] font-black text-emerald-600 tracking-tight">₹{product.price}</p>
                  </div>
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tighter truncate px-1">{product.name}</h4>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Per {product.unit}</p>
                  
                  {/* Stock Indicator */}
                  <div className="flex flex-col items-center gap-1 pt-1">
                     <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                           (product.stockQuantity || 0) > 10 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 
                           (product.stockQuantity || 0) > 0 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
                           'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                        }`} />
                        <p className={`text-[9px] font-black uppercase tracking-widest ${
                           (product.stockQuantity || 0) > 10 ? 'text-emerald-600' : 
                           (product.stockQuantity || 0) > 0 ? 'text-amber-600' : 
                           'text-rose-600'
                        }`}>
                           Stock: {product.stockQuantity || 0} {product.unit}
                        </p>
                     </div>
                  </div>

                  <div className="flex items-center justify-center gap-1 pt-1 opacity-60">
                     <span className="text-[7px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-1.5 py-0.5 rounded">GST {product.gstRate || 18}%</span>
                     {product.hsnCode && <span className="text-[7px] font-black text-blue-600 bg-blue-50 dark:bg-blue-950/20 px-1.5 py-0.5 rounded">HSN: {product.hsnCode}</span>}
                  </div>
               </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-950/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4" />
          <h3 className="font-black uppercase tracking-tight text-slate-500">No items found in {selectedCategory}</h3>
          <Button onClick={() => { resetForm(); setShowModal(true); }} className="mt-4 bg-emerald-600 rounded-xl px-8 h-10 font-black uppercase text-[10px] tracking-widest">Create New Item</Button>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
              onClick={() => setShowModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight">{isEditing ? 'Edit Product' : 'New Catalog Entry'}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Product identity and commercial settings</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-400 hover:text-rose-500 transition-all"><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                 {/* Product Image Upload (simple, no AI) */}
                 <div className="flex flex-col items-center">
                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[24px] border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center relative overflow-hidden group">
                       {formData.image ? (
                         <img src={formData.image} className="w-full h-full object-cover" />
                       ) : (
                         <Upload size={32} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                       )}
                       <input 
                         type="file" accept="image/*" 
                         onChange={handleImageUpload}
                         className="absolute inset-0 opacity-0 cursor-pointer"
                       />
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">Click to {formData.image ? 'Change' : 'Upload'} Product Photo</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Product Title</label>
                       <input 
                         required placeholder="e.g. Fresh Red Onions"
                         className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold uppercase tracking-tight"
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</label>
                       <div className="flex flex-col gap-2">
                          <select 
                            className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold uppercase tracking-tight"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                          >
                             {categories.filter(c => c !== 'All').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          </select>
                          <button 
                            type="button" 
                            onClick={() => setShowAddCategory(!showAddCategory)}
                            className="text-[8px] font-black text-emerald-600 uppercase tracking-widest text-left ml-1 hover:underline"
                          >
                             + Add New Category
                          </button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Unit</label>
                       <select 
                         className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold"
                         value={formData.unit}
                         onChange={(e) => setFormData({...formData, unit: e.target.value})}
                       >
                          <option value="kg">kg (Kilogram)</option>
                          <option value="gram">gram (Gram)</option>
                          <option value="pcs">pcs (Pieces)</option>
                          <option value="bottle">bottle (Bottle)</option>
                          <option value="packet">packet (Packet)</option>
                          <option value="box">box (Box)</option>
                          <option value="tray">tray (Tray)</option>
                          <option value="bundle">bundle (Bundle)</option>
                          <option value="bag">bag (Bag)</option>
                          <option value="crate">crate (Crate)</option>
                          <option value="litre">litre (Litre)</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Price (₹)</label>
                       <input 
                         type="number" required placeholder="0.00"
                         className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold"
                         value={formData.price}
                         onChange={(e) => setFormData({...formData, price: e.target.value})}
                       />
                    </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Discount (%)</label>
                        <input 
                          type="number" placeholder="0"
                          className="w-full px-4 py-3.5 bg-rose-50/20 dark:bg-rose-950/10 border-none rounded-2xl outline-none focus:ring-2 focus:ring-rose-500/10 text-xs font-bold text-rose-600"
                          value={formData.discount}
                          onChange={(e) => setFormData({...formData, discount: e.target.value})}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Stock Quantity</label>
                        <input 
                          type="number" required placeholder="0"
                          className="w-full px-4 py-3.5 bg-emerald-50/20 dark:bg-emerald-950/10 border-none rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/10 text-xs font-bold text-emerald-600"
                          value={formData.stockQuantity}
                          onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                        />
                     </div>
                  </div>

                 {/* GST & Tax Section */}
                 <div className="p-5 bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                       <Receipt size={16} className="text-amber-600" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">GST & Tax Configuration</p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">GST Rate (%)</label>
                          <select 
                            className="w-full px-3 py-3 bg-white dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/10 text-xs font-black"
                            value={formData.gstRate}
                            onChange={(e) => setFormData({...formData, gstRate: e.target.value})}
                          >
                             <option value="0">0% (Exempt)</option>
                             <option value="5">5%</option>
                             <option value="12">12%</option>
                             <option value="18">18%</option>
                             <option value="28">28%</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Tax Type</label>
                          <select 
                            className="w-full px-3 py-3 bg-white dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/10 text-xs font-black"
                            value={formData.taxType}
                            onChange={(e) => setFormData({...formData, taxType: e.target.value})}
                          >
                             <option value="Exclusive">Exclusive</option>
                             <option value="Inclusive">Inclusive</option>
                             <option value="Exempt">Exempt</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">HSN / SAC Code</label>
                          <input 
                            placeholder="e.g. 0703"
                            className="w-full px-3 py-3 bg-white dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-amber-500/10 text-xs font-black uppercase"
                            value={formData.hsnCode}
                            onChange={(e) => setFormData({...formData, hsnCode: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 {showAddCategory && (
                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 flex items-center gap-2">
                      <input 
                        placeholder="New category name..."
                        className="flex-1 bg-transparent border-none text-[10px] font-bold outline-none uppercase tracking-widest"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                      />
                      <button type="button" onClick={addNewCategory} className="p-2 bg-emerald-600 text-white rounded-lg"><Check size={14} /></button>
                   </motion.div>
                 )}

                 <Button type="submit" disabled={submitting} className="w-full bg-slate-900 hover:bg-emerald-600 py-8 text-[11px] font-black uppercase tracking-[0.3em] shadow-xl rounded-[24px] group transition-all">
                    {submitting ? <Loader2 className="animate-spin mr-3" /> : <Save className="mr-3 group-hover:scale-110 transition-transform" />} 
                    {isEditing ? 'Update Product' : 'Save to Catalog'}
                 </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Menu Import Modal — OCR Scanning */}
      <AnimatePresence>
        {showMenuModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => !parsingMenu && setShowMenuModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
               <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <FileText size={24} />
                     </div>
                     <div>
                        <h3 className="text-xl font-black uppercase tracking-tight">Bulk Menu Import</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Upload menu card to extract all products at once</p>
                     </div>
                  </div>
                  <button onClick={() => setShowMenuModal(false)} className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:text-rose-500 transition-all"><X size={20} /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                  {!parsedItems.length ? (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[32px] py-16 px-8 text-center relative">
                       {parsingMenu ? (
                         <div className="space-y-6 w-full max-w-xs">
                            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 rounded-full flex items-center justify-center mx-auto">
                               <Loader2 size={40} className="text-emerald-600 animate-spin" />
                            </div>
                            <div className="space-y-2">
                               <p className="text-sm font-black uppercase tracking-widest">Parsing Menu Image...</p>
                               <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-600 transition-all duration-300" style={{ width: `${parseProgress}%` }} />
                               </div>
                               <p className="text-[9px] text-slate-400 font-bold uppercase">{parseProgress}% Complete</p>
                            </div>
                         </div>
                       ) : (
                         <>
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                               <Upload size={32} className="text-slate-300" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest mb-2">Select Menu Card Image</h4>
                            <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto mb-8">Upload a clear photo of your printed or handwritten menu card. AI will read names, prices, and categories.</p>
                            <Button className="bg-slate-900 rounded-xl px-10 h-12 text-[10px] font-black uppercase tracking-widest relative">
                               Choose File
                               <input type="file" accept="image/*" onChange={handleMenuUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </Button>
                         </>
                       )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                       <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Review Detected Items ({parsedItems.length})</h4>
                          <Button onClick={() => setParsedItems([])} variant="outline" className="h-8 px-3 text-[8px] font-black uppercase">Clear All</Button>
                       </div>
                       <div className="grid grid-cols-1 gap-3">
                          {parsedItems.map((item, idx) => (
                             <div key={idx} className="group bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex flex-wrap lg:flex-nowrap items-center gap-4 border border-transparent hover:border-emerald-200 transition-all">
                                <div className="flex-1 min-w-[200px]">
                                   <input 
                                     value={item.name}
                                     onChange={(e) => updateParsedItem(idx, 'name', e.target.value)}
                                     className="w-full bg-transparent border-none text-xs font-black uppercase tracking-tight outline-none focus:text-emerald-600"
                                   />
                                </div>
                                <div className="w-32">
                                   <select 
                                     value={item.category}
                                     onChange={(e) => updateParsedItem(idx, 'category', e.target.value)}
                                     className="w-full bg-white dark:bg-slate-900 border-none rounded-lg py-1 px-2 text-[9px] font-black uppercase"
                                   >
                                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                   </select>
                                </div>
                                <div className="w-24 relative">
                                   <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">₹</span>
                                   <input 
                                     value={item.price}
                                     onChange={(e) => updateParsedItem(idx, 'price', e.target.value)}
                                     className="w-full bg-white dark:bg-slate-900 border-none rounded-lg py-1 pl-5 pr-2 text-[10px] font-black outline-none"
                                   />
                                </div>
                                <div className="w-20">
                                   <select 
                                     value={item.gstRate}
                                     onChange={(e) => updateParsedItem(idx, 'gstRate', e.target.value)}
                                     className="w-full bg-white dark:bg-slate-900 border-none rounded-lg py-1 px-2 text-[9px] font-black"
                                   >
                                      <option value="0">0%</option>
                                      <option value="5">5%</option>
                                      <option value="12">12%</option>
                                      <option value="18">18%</option>
                                   </select>
                                </div>
                                <button onClick={() => removeParsedItem(idx)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                   <X size={16} />
                                </button>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}
               </div>

               {parsedItems.length > 0 && (
                 <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 flex items-center justify-between">
                    <div>
                       <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Detected</p>
                       <p className="text-lg font-black">{parsedItems.length} Products</p>
                    </div>
                    <Button 
                      onClick={handleBulkSave} 
                      disabled={importingBulk}
                      className="bg-emerald-600 hover:bg-emerald-700 h-14 px-10 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20"
                    >
                       {importingBulk ? <Loader2 className="animate-spin mr-3" /> : <Save className="mr-3" />}
                       Save All to Catalog
                    </Button>
                 </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
