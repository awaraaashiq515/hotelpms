import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Info, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProductListProps {
  categories: any[];
  searchQuery: string;
  cart: any[];
  addToCart: (product: any, options?: any) => void;
  removeFromCart: (id: string, options?: any) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ 
  categories, 
  searchQuery, 
  cart, 
  addToCart, 
  removeFromCart 
}) => {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  return (
    <main className="p-5 pb-32 space-y-12">
      {categories.map((category) => {
        const filteredProducts = category.products.filter((p: any) => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (filteredProducts.length === 0) return null;

        return (
          <section key={category.id} id={category.id} className="space-y-6 scroll-mt-32">
            <div className="flex items-center gap-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{category.name}</h3>
              <div className="h-[2px] flex-grow bg-gradient-to-r from-slate-100 to-transparent dark:from-slate-900" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredProducts.length} items</span>
            </div>

            <div className="grid gap-5">
              {filteredProducts.map((product: any) => {
                const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;
                const hasPortions = product.halfPrice && product.halfPrice > 0 && product.halfPrice !== product.sellingPrice;
                const hasOptions = hasVariants || hasPortions;
                const cartItems = cart.filter((item: any) => item.id === product.id);
                const totalInCart = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);

                return (
                  <motion.div 
                    key={product.id}
                    layoutId={product.id}
                    className="group bg-white dark:bg-slate-900 rounded-[2rem] p-4 shadow-sm border border-slate-50 dark:border-slate-800/50 hover:shadow-xl hover:shadow-slate-200/20 dark:hover:shadow-none transition-all"
                  >
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
                        <img 
                          src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200'} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-2xl shadow-inner group-hover:scale-105 transition-transform duration-500"
                        />
                        {product.isVeg !== null && (
                          <div className={`absolute top-2 left-2 w-4 h-4 border-2 rounded-sm flex items-center justify-center bg-white ${product.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${product.isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
                          </div>
                        )}
                      </div>

                      <div className="flex-grow flex flex-col py-1">
                        <div className="flex-grow">
                          <div className="flex items-start justify-between">
                            <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-pos-primary transition-colors leading-tight">
                              {product.name}
                            </h4>
                            <button className="text-slate-300 dark:text-slate-600">
                              <Info size={16} />
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 mt-1 leading-relaxed font-medium">
                            {product.description || 'Delicious freshly prepared dish.'}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-slate-900 dark:text-white">
                              ₹{product.sellingPrice}
                              {hasOptions && <span className="text-[9px] ml-1 text-pos-primary uppercase tracking-tighter">Onwards</span>}
                            </span>
                            {product.basePrice > product.sellingPrice && (
                              <span className="text-[10px] text-slate-400 line-through font-bold">₹{product.basePrice}</span>
                            )}
                          </div>

                          {totalInCart > 0 ? (
                            <div className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl p-1 shadow-lg shadow-slate-900/10">
                              <button 
                                onClick={() => {
                                  if (hasOptions) {
                                    setSelectedProduct(product);
                                  } else {
                                    removeFromCart(product.id);
                                  }
                                }}
                                className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                              >
                                {hasOptions ? <Info size={14} /> : <Minus size={14} />}
                              </button>
                              <span className="w-5 text-center text-xs font-black tabular-nums">{totalInCart}</span>
                              <button 
                                onClick={() => {
                                  if (hasOptions) {
                                    setSelectedProduct(product);
                                  } else {
                                    addToCart(product);
                                  }
                                }}
                                className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                if (hasOptions) {
                                  setSelectedProduct(product);
                                } else {
                                  addToCart(product);
                                }
                              }}
                              className="h-8 px-6 bg-pos-accent text-white rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-1"
                            >
                              Add {hasOptions && <Plus size={12} />}
                            </button>
                          )}
                        </div>
                        {hasOptions && (
                          <p className="text-[9px] text-pos-primary font-bold uppercase tracking-widest mt-1">Customizable</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}

      <AnimatePresence>
        {selectedProduct && (
          <CustomizationModal 
            product={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
            addToCart={addToCart}
            cart={cart}
            removeFromCart={removeFromCart}
          />
        )}
      </AnimatePresence>
    </main>
  );
};

const CustomizationModal = ({ product, onClose, addToCart, cart, removeFromCart }: any) => {
  const [selectedPortion, setSelectedPortion] = useState<'FULL' | 'HALF'>('FULL');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  const handleAdd = () => {
    if (product.variants && product.variants.length > 0 && !selectedVariant) {
      alert("Please select a variant");
      return;
    }

    const options = selectedVariant 
      ? { variantId: selectedVariant.id, variantName: selectedVariant.name, price: selectedVariant.price }
      : (product.halfPrice && product.halfPrice > 0)
        ? { portion: selectedPortion, price: selectedPortion === 'HALF' ? product.halfPrice : product.sellingPrice }
        : {};

    addToCart(product, options);
    onClose();
  };

  const handleRemove = (vId?: string, p?: 'FULL' | 'HALF') => {
    removeFromCart(product.id, { variantId: vId, portion: p });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 sm:p-6 pb-28 sm:pb-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]"
      >
        <div className="p-6 pb-2 space-y-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
                <img src={product.image} className="w-full h-full object-cover" alt="" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-2">{product.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select Options</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-6 py-2 no-scrollbar">
          <div className="space-y-8 pb-4">
            {/* Portions */}
            {product.halfPrice > 0 && product.halfPrice !== product.sellingPrice && (
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Portion</p>
                <div className="grid grid-cols-2 gap-3">
                  {['FULL', 'HALF'].map((p) => {
                    const price = p === 'HALF' ? product.halfPrice : product.sellingPrice;
                    const inCart = cart.find((item: any) => item.id === product.id && item.portion === p)?.quantity || 0;
                    
                    return (
                      <div 
                        key={p}
                        onClick={() => setSelectedPortion(p as any)}
                        className={`p-4 rounded-3xl border-2 transition-all cursor-pointer relative ${selectedPortion === p ? 'border-pos-primary bg-pos-primary/5' : 'border-slate-100 dark:border-slate-800'}`}
                      >
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPortion === p ? 'text-pos-primary' : 'text-slate-400'}`}>{p}</span>
                          <span className="text-lg font-black text-slate-900 dark:text-white">₹{price}</span>
                        </div>
                        {inCart > 0 && (
                          <div className="absolute top-3 right-3 bg-pos-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                            {inCart}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Variants */}
            {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Select Size / Variant</p>
                <div className="space-y-2">
                  {product.variants.map((v: any) => {
                    const inCart = cart.find((item: any) => item.id === product.id && item.variantId === v.id)?.quantity || 0;
                    
                    return (
                      <div 
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all cursor-pointer ${selectedVariant?.id === v.id ? 'border-pos-primary bg-pos-primary/5' : 'border-slate-100 dark:border-slate-800'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedVariant?.id === v.id ? 'border-pos-primary bg-pos-primary' : 'border-slate-200 dark:border-slate-700'}`}>
                            {selectedVariant?.id === v.id && <Check size={12} className="text-white" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{v.name}</p>
                            <p className="text-xs font-black text-pos-primary">₹{v.price}</p>
                          </div>
                        </div>
                        {inCart > 0 && (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl p-1">
                              <button onClick={(e) => { e.stopPropagation(); handleRemove(v.id); }} className="p-1"><Minus size={12} /></button>
                              <span className="text-[10px] font-black w-4 text-center">{inCart}</span>
                              <button onClick={(e) => { e.stopPropagation(); addToCart(product, { variantId: v.id, variantName: v.name, price: v.price }); }} className="p-1"><Plus size={12} /></button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 pt-2 pb-10 sm:pb-6 border-t border-slate-50 dark:border-slate-800/50 flex-shrink-0 bg-white dark:bg-slate-900">
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="h-14 rounded-2xl flex-1 font-black uppercase text-xs tracking-widest">
              Close
            </Button>
            <Button onClick={handleAdd} className="h-14 rounded-2xl flex-[2] bg-pos-accent text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-pos-accent/20">
              Add to Cart
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
