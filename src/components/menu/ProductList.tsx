import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Minus, Info } from 'lucide-react';

interface ProductListProps {
  categories: any[];
  searchQuery: string;
  cart: any[];
  addToCart: (product: any) => void;
  removeFromCart: (id: string) => void;
}

export const ProductList: React.FC<ProductListProps> = ({ 
  categories, 
  searchQuery, 
  cart, 
  addToCart, 
  removeFromCart 
}) => {
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
                const cartItem = cart.find(item => item.id === product.id);
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
                            <span className="text-lg font-black text-slate-900 dark:text-white">₹{product.sellingPrice}</span>
                            {product.basePrice > product.sellingPrice && (
                              <span className="text-[10px] text-slate-400 line-through font-bold">₹{product.basePrice}</span>
                            )}
                          </div>

                          {cartItem ? (
                            <div className="flex items-center gap-1.5 bg-slate-900 dark:bg-slate-800 text-white rounded-xl p-1 shadow-lg shadow-slate-900/10">
                              <button 
                                onClick={() => removeFromCart(product.id)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-5 text-center text-xs font-black tabular-nums">{cartItem.quantity}</span>
                              <button 
                                onClick={() => addToCart(product)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addToCart(product)}
                              className="h-8 px-6 bg-pos-accent text-white rounded-xl text-[11px] font-bold shadow-sm"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
};
