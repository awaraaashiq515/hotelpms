import React from 'react';
import { motion } from 'framer-motion';

interface BarProductCardProps {
  product: any;
  cart: any[];
  categoryName: string;
  accent: { color: string; bg: string; border: string; glow: string };
  watermark: string;
  onClick: () => void;
}

export function BarProductCard({
  product,
  cart,
  categoryName,
  accent,
  watermark,
  onClick,
}: BarProductCardProps) {
  const inCart = cart.find(item => item.id === product.id);
  const cartQty = cart.reduce((acc, i) => i.id === product.id ? acc + i.quantity : acc, 0);
  const hasVariants = !!((product.variants && product.variants.length > 0) || product.halfPrice);
  
  const stock = product.stock ?? product.stockQuantity ?? null;
  const isOutOfStock = stock !== null && stock <= 0;

  return (
    <motion.div
      whileTap={!isOutOfStock ? { scale: 0.97 } : undefined}
      className="relative group transition-all duration-200"
    >
      <button
        onClick={onClick}
        disabled={isOutOfStock}
        className="relative w-full rounded-2xl flex flex-col justify-between shadow-md transition-all duration-300 border text-left overflow-hidden select-none"
        style={{
          backgroundColor: inCart ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
          borderColor: inCart ? `${accent.color}55` : 'rgba(255, 255, 255, 0.08)',
          opacity: isOutOfStock ? 0.35 : 1,
          aspectRatio: '1/1',
          minHeight: '140px',
          boxShadow: inCart ? `0 4px 24px ${accent.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.08)` : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
        onMouseEnter={e => {
          if (!isOutOfStock) {
            const el = e.currentTarget as HTMLElement;
            el.style.transform = 'translateY(-2px)';
            el.style.borderColor = `${accent.color}77`;
            el.style.boxShadow = `0 8px 20px ${accent.glow}`;
          }
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLElement;
          el.style.transform = 'translateY(0)';
          el.style.borderColor = inCart ? `${accent.color}55` : 'rgba(255, 255, 255, 0.08)';
          el.style.boxShadow = inCart ? `0 4px 24px ${accent.glow}, inset 0 1px 0 rgba(255, 255, 255, 0.08)` : 'inset 0 1px 0 rgba(255, 255, 255, 0.05)';
        }}
      >
        {/* Accent top bar */}
        <div className="absolute top-0 inset-x-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${accent.color}, transparent)` }} />

        {/* Watermark background emoji */}
        <div className="absolute right-[-4px] bottom-[-4px] text-[58px] opacity-[0.04] pointer-events-none select-none filter blur-[1px] leading-none">
          {watermark}
        </div>

        <div className="w-full flex-1 p-3 flex flex-col justify-between relative z-10">
          {/* Card Header */}
          <div className="flex justify-between items-center w-full">
            <span
              className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border"
              style={{
                color: accent.color,
                backgroundColor: accent.bg,
                borderColor: accent.border
              }}
            >
              {categoryName || 'BAR'}
            </span>

            {isOutOfStock ? (
              <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">OUT</span>
            ) : stock !== null ? (
              <span className="text-[8px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                Qty: {stock}
              </span>
            ) : cartQty > 0 ? (
              <span
                className="w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shadow-md animate-in zoom-in-50 duration-200"
                style={{
                  backgroundColor: accent.color,
                  color: '#090D1A'
                }}
              >
                {cartQty}
              </span>
            ) : null}
          </div>

          {/* Title of Product */}
          <div className="my-auto pt-2">
            <h3 className="text-[11.5px] font-black tracking-tight text-white line-clamp-2 uppercase leading-[1.25]">
              {product.name}
            </h3>
            {hasVariants && (
              <div className="mt-1 flex items-center gap-1">
                <span className="text-[7.5px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  {product.variants?.length ? `${product.variants.length} Sizes` : 'Half Available'}
                </span>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="border-t border-white/[0.05] pt-2 mt-auto flex items-baseline justify-between w-full">
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-slate-500">₹</span>
              <span className="text-[15px] font-black text-white leading-none">
                {product.sellingPrice.toFixed(0)}
              </span>
              {hasVariants && (
                <span className="text-[8px] font-medium text-slate-500 lowercase ml-1">starting</span>
              )}
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
