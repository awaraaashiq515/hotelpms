'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  categoryId: string;
  image?: string;
  description?: string;
  productType?: string;
  isPopular?: boolean;
  hsnCode?: string;
  halfPrice?: number | null;
  variants?: any[];
  isVeg?: boolean;
  menuType?: string;
}

interface CartItem extends Product {
  quantity: number;
  cartItemId?: string;
  size?: string;
}

interface RestaurantProductCardProps {
  product: Product;
  inCart: CartItem | undefined;
  addToCart: (product: Product, size?: string, customPrice?: number) => void;
  categoryName: string;
  palette: { bg: string; border: string; text: string; textSub: string };
}

export function RestaurantProductCard({
  product,
  inCart,
  addToCart,
  categoryName,
  palette,
}: RestaurantProductCardProps) {
  const hasVariants = !!((product.variants && product.variants.length > 0) || product.halfPrice);

  return (
    <motion.div
      whileTap={!hasVariants ? { scale: 0.95 } : undefined}
      className="relative group transition-all duration-200"
    >
      <div
        onClick={() => !hasVariants && addToCart(product)}
        className={`relative w-full rounded-2xl p-3 flex flex-col justify-between shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] border border-white/5 overflow-hidden group ${
          hasVariants ? 'cursor-default' : 'cursor-pointer'
        }`}
        style={{ backgroundColor: palette.bg, aspectRatio: '1/1' }}
      >
        <div className="flex justify-between items-start">
          <span className="text-[8px] font-black uppercase opacity-40" style={{ color: palette.textSub }}>
            {product.hsnCode || '2106'}
          </span>
          <div className="text-right">
            <span className="block text-[6px] font-black uppercase opacity-30 leading-none mb-0.5" style={{ color: palette.textSub }}>
              Price
            </span>
            <span className="text-[12px] font-black leading-none" style={{ color: palette.textSub }}>
              ₹{product.sellingPrice}
            </span>
          </div>
        </div>

        <div className="flex-1 flex items-center py-1">
          <h3 className="text-[11px] font-black uppercase tracking-tighter leading-[1.1] line-clamp-3 w-full text-left" style={{ color: palette.text }}>
            {product.name}
          </h3>
        </div>

        {!hasVariants ? (
          <div className="flex justify-between items-end border-t border-black/5 pt-1.5 mt-auto">
            <div className="text-left space-y-0">
              <span className="block text-[8px] font-black uppercase opacity-50 leading-none" style={{ color: palette.textSub }}>
                {categoryName || 'Menu'}
              </span>
              <span className="block text-[6px] font-bold opacity-30 uppercase leading-none" style={{ color: palette.textSub }}>
                GST 5%
              </span>
            </div>

            <div className="flex items-center">
              {inCart ? (
                <div className="w-5 h-5 rounded-lg bg-black/10 flex items-center justify-center font-black text-[10px]" style={{ color: palette.text }}>
                  {inCart.quantity}
                </div>
              ) : (
                <div className={`w-3.5 h-3.5 border border-current rounded-[3px] flex items-center justify-center bg-white/90 shrink-0 shadow-sm ${product.isVeg === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 flex flex-col z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            {/* Show 'Full' button ONLY if there are no variants OR if halfPrice exists without variants */}
            {(!product.variants || product.variants.length === 0) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(product, 'Full', product.sellingPrice);
                }}
                className="w-full py-3 bg-orange-600 text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 active:bg-orange-700 transition-colors border-t border-white/10"
              >
                Full Price
              </button>
            )}

            {/* Variants Grid - 2 per row */}
            <div className="grid grid-cols-2 w-full border-t border-white/10">
              {product.variants?.map((v: any, vIdx: number) => (
                <button
                  key={v.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product, v.name, v.price);
                  }}
                  className={`py-2.5 bg-rose-600 text-white font-black text-[9px] uppercase tracking-widest hover:bg-rose-500 active:bg-rose-700 transition-colors ${
                    vIdx % 2 === 0 ? 'border-r border-white/10' : ''
                  } border-b border-white/5`}
                >
                  {v.name}
                </button>
              ))}
              {product.halfPrice && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product, 'Half', product.halfPrice!);
                  }}
                  className={`py-2.5 bg-amber-500 text-white font-black text-[9px] uppercase tracking-widest hover:bg-amber-400 active:bg-amber-700 transition-colors ${
                    (product.variants?.length || 0) % 2 === 0 ? 'col-span-2' : ''
                  } border-b border-white/5`}
                >
                  Half
                </button>
              )}
            </div>
          </div>
        )}

        {!hasVariants && inCart && <div className="absolute top-0 right-0 w-1.5 h-full bg-black/20" />}
      </div>
    </motion.div>
  );
}
