'use client';

import React from 'react';
import { Coffee, CupSoda, Info, Plus, Minus } from 'lucide-react';

interface CafeProductCardProps {
  product: any;
  inCart: any;
  cart: any[];
  hasVariants: boolean;
  addToCart: (product: any, variantName?: string, variantPrice?: number) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  categoryName: string;
}

// Convert uppercase words to Title Case
const toTitleCase = (str: string) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Sleek modern icon selector for POS slate theme
const getCafeIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('tea') || n.includes('chai') || n.includes('earl grey') || n.includes('green tea') || n.includes('lemon tea')) {
    return { Icon: Coffee, color: 'text-amber-400', iconBg: 'bg-gradient-to-br from-amber-900/40 to-amber-950/40', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.15)]' }; 
  }
  if (n.includes('shake') || n.includes('smoothie') || n.includes('frappe') || n.includes('mojito') || n.includes('soda') || n.includes('cold') || n.includes('lagoon')) {
    return { Icon: CupSoda, color: 'text-cyan-400', iconBg: 'bg-gradient-to-br from-cyan-900/40 to-cyan-950/40', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.15)]' }; 
  }
  // Default Specialty Espresso / Coffee
  return { Icon: Coffee, color: 'text-indigo-400', iconBg: 'bg-gradient-to-br from-indigo-900/40 to-indigo-950/40', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.2)]' };
};

export const CafeProductCard: React.FC<CafeProductCardProps> = ({
  product,
  inCart,
  cart,
  hasVariants,
  addToCart,
  updateQuantity,
  categoryName,
}) => {
  const title = toTitleCase(product.name);
  const isVeg = product.isVeg !== false;
  
  // Calculate total quantity of this product in cart (across all variants)
  const inCartTotalQty = cart
    .filter(item => item.id === product.id)
    .reduce((sum, item) => sum + item.quantity, 0);

  const iconDetails = getCafeIcon(product.name);

  // Calculate starting price for items with variants
  const getStartingPrice = () => {
    const prices = [];
    if (product.sellingPrice) prices.push(product.sellingPrice);
    if (product.halfPrice) prices.push(product.halfPrice);
    if (product.variants && product.variants.length > 0) {
      product.variants.forEach((v: any) => {
        if (v.price) prices.push(v.price);
      });
    }
    return prices.length > 0 ? Math.min(...prices) : product.sellingPrice;
  };

  const startingPrice = getStartingPrice();

  return (
    <div
      className={`group relative flex flex-col h-full rounded-[2rem] transition-all duration-500 ease-out overflow-hidden backdrop-blur-md ${
        inCartTotalQty > 0
          ? 'bg-slate-800/80 border border-indigo-500/40 shadow-[0_8px_30px_rgba(99,102,241,0.15)]'
          : 'bg-slate-900/60 border border-slate-700/50 hover:border-slate-500/50 hover:bg-slate-800/80 hover:shadow-xl'
      }`}
    >
      {/* Top Banner / Icon Area */}
      <div className="relative pt-6 pb-4 flex flex-col items-center justify-center bg-gradient-to-b from-slate-950/40 to-transparent">
        {/* Category Tag */}
        <div className="absolute top-3 left-3">
          <span className="text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 bg-slate-950/60 text-slate-300 rounded-full border border-slate-700/50 backdrop-blur-md">
            {categoryName || 'Cafe'}
          </span>
        </div>
        
        {/* Veg/Non-Veg Tag */}
        <div className="absolute top-3 right-3">
          <span className={`w-3.5 h-3.5 border ${isVeg ? 'border-emerald-500/40' : 'border-rose-500/40'} bg-slate-950/60 backdrop-blur-md rounded-[4px] flex items-center justify-center shadow-sm`}>
            <span className={`w-1 h-1 rounded-full ${isVeg ? 'bg-emerald-500' : 'bg-rose-500'} shadow-[0_0_8px_rgba(0,0,0,0.8)]`} />
          </span>
        </div>

        {/* Large Central Icon (Reduced Size) */}
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${iconDetails.iconBg} ${iconDetails.glow} border border-white/10 shrink-0 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6`}>
          <iconDetails.Icon className={iconDetails.color} size={28} strokeWidth={1.5} />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 px-4 pb-4">
        <div className="flex-1 flex flex-col items-center text-center">
          <h4 className="text-[15px] font-semibold text-white tracking-wide leading-tight mb-1">
            {title}
          </h4>

          <p className="text-[10px] text-slate-400 font-light leading-relaxed line-clamp-2 px-1">
            {product.description || `A premium specialty ${title.toLowerCase()} crafted fresh.`}
          </p>

          {/* Grid Variants (2 per row) */}
          {hasVariants && (
            <div className="grid grid-cols-2 gap-1.5 mt-3 w-full px-1">
              {(!product.variants || product.variants.length === 0) && (
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(product, 'Full', product.sellingPrice); }}
                  className="w-full px-1.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all duration-300 bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white flex justify-center items-center gap-1"
                >
                  <span className="truncate">Full</span> <span className="opacity-50">|</span> <span>₹{product.sellingPrice}</span>
                </button>
              )}
              {product.variants?.map((v: any) => {
                const variantCartItem = cart.find(item => (item as any).cartItemId === `${product.id}-${v.name}`);
                const qty = variantCartItem ? variantCartItem.quantity : 0;
                return (
                  <button
                    key={v.id}
                    onClick={(e) => { e.stopPropagation(); addToCart(product, v.name, v.price); }}
                    className={`relative w-full px-1.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 border overflow-hidden ${
                      qty > 0
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                        : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span className="truncate max-w-[60%]">{v.name}</span>
                    <span className="opacity-50">|</span>
                    <span className="shrink-0">₹{v.price}</span>
                    {qty > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 flex items-center justify-center bg-slate-950 text-indigo-400 rounded-full text-[7px] font-black border border-indigo-500">
                        {qty}
                      </span>
                    )}
                  </button>
                );
              })}
              {product.halfPrice && (
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(product, 'Half', product.halfPrice!); }}
                  className={`relative w-full px-1.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1 border ${
                    cart.find(item => (item as any).cartItemId === `${product.id}-Half`)
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span className="truncate">Half</span>
                  <span className="opacity-50">|</span>
                  <span className="shrink-0">₹{product.halfPrice}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Area: Price & Add Button */}
        <div className="mt-4 flex items-end justify-between border-t border-slate-700/50 pt-3">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Price</span>
            <span className="text-base font-medium tracking-wide text-white">
              {hasVariants && <span className="text-[10px] text-slate-500 mr-1 font-normal">from</span>}
              ₹{startingPrice}
            </span>
          </div>

          {!hasVariants ? (
            <div className="flex justify-end">
              {inCart ? (
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-xl px-1 py-1 shadow-inner">
                  <button
                    onClick={(e) => { e.stopPropagation(); updateQuantity(inCart.cartItemId || inCart.id, -1); }}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-bold text-white min-w-[16px] text-center">
                    {inCart.quantity}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); updateQuantity(inCart.cartItemId || inCart.id, 1); }}
                    className="w-6 h-6 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 flex items-center justify-center transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold tracking-wide transition-all duration-300 shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] flex items-center gap-1 text-xs"
                >
                  <Plus size={14} strokeWidth={3} />
                  Add
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-end">
              {inCartTotalQty > 0 ? (
                <div className="flex items-center gap-1.5 text-white bg-indigo-600 px-3 py-1.5 rounded-xl shadow-[0_4px_15px_rgba(99,102,241,0.3)]">
                  <span className="w-4 h-4 flex items-center justify-center bg-white text-indigo-600 rounded-full text-[10px] font-black">
                    {inCartTotalQty}
                  </span>
                  <span className="text-[9px] font-bold tracking-wider uppercase">
                    In Tray
                  </span>
                </div>
              ) : (
                <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-[9px] font-bold tracking-wider uppercase">
                  <Info size={12} className="opacity-50" />
                  Select Size
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
