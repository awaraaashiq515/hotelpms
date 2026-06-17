import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Wine, FlaskConical, Droplets } from 'lucide-react';

interface BarVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  addToCart: (product: any, variantName?: string, variantPrice?: number) => void;
}

export function BarVariantModal({
  isOpen,
  onClose,
  product,
  addToCart,
}: BarVariantModalProps) {
  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select serving size"
      maxWidth="md"
    >
      <div className="p-2 text-white">
        <div className="flex items-center gap-4 mb-6 p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
           <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Wine size={24} className="text-amber-500" />
           </div>
           <div>
              <h3 className="text-lg font-black text-white tracking-tight leading-none">{product.name}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Choose serving size / portion</p>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {product.variants?.map((v: any, i: number) => (
            <button
              key={i}
              onClick={() => {
                addToCart(product, v.name, v.price);
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <Droplets size={14} className="text-amber-500" />
                 </div>
                 <span className="text-sm font-black text-white uppercase tracking-wider">{v.name}</span>
              </div>
              <div>
                 <span className="text-base font-black text-amber-500">₹{v.price}</span>
              </div>
            </button>
          ))}
          
          {/* If has halfPrice (instead of variants or in addition to it) */}
          {product.halfPrice && (
            <>
              <button
                onClick={() => {
                  addToCart(product, 'Half', product.halfPrice);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
                      <Droplets size={14} className="text-amber-500" />
                   </div>
                   <span className="text-sm font-black text-white uppercase tracking-wider">Half</span>
                </div>
                <div>
                   <span className="text-base font-black text-amber-500">₹{product.halfPrice}</span>
                </div>
              </button>
              <button
                onClick={() => {
                  addToCart(product, 'Full', product.sellingPrice);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
                      <FlaskConical size={14} className="text-amber-500" />
                   </div>
                   <span className="text-sm font-black text-white uppercase tracking-wider">Full</span>
                </div>
                <div>
                   <span className="text-base font-black text-amber-500">₹{product.sellingPrice}</span>
                </div>
              </button>
            </>
          )}

          {/* Option for Full Bottle if configured */}
          {product.bottlePrice > 0 && (
            <button
              onClick={() => {
                addToCart(product, `Full Bottle ${product.bottleSize}ml`, product.bottlePrice);
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:bg-amber-500/10 hover:border-amber-500/30 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center">
                    <FlaskConical size={14} className="text-amber-500" />
                 </div>
                 <span className="text-sm font-black text-white uppercase tracking-wider">Full Bottle ({product.bottleSize}ml)</span>
              </div>
              <div>
                 <span className="text-base font-black text-amber-500">₹{product.bottlePrice}</span>
              </div>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-5 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
