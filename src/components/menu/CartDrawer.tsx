import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, CheckCircle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  removeFromCart: (id: string) => void;
  addToCart: (product: any) => void;
  cartTotal: number;
  orderStatus: 'idle' | 'submitting' | 'success';
  placeOrder: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  cart, 
  removeFromCart, 
  addToCart, 
  cartTotal, 
  orderStatus, 
  placeOrder 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2rem] z-[70] max-h-[90vh] flex flex-col shadow-2xl border-t border-white/10"
          >
            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto my-6" />
            
            <div className="px-6 flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Your Order</h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            {orderStatus === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-grow flex flex-col items-center justify-center p-12 text-center space-y-4"
              >
                <div className="w-20 h-20 bg-green-50 dark:bg-green-950/30 text-green-500 rounded-3xl flex items-center justify-center shadow-xl">
                  <CheckCircle size={40} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Order Sent!</h3>
                  <p className="text-sm text-slate-500 font-medium">Your meal is being prepared.</p>
                </div>
              </motion.div>
            ) : (
              <>
                <div className="flex-grow overflow-y-auto px-6 grid grid-cols-2 gap-3 pb-8 no-scrollbar auto-rows-max">
                  {cart.map((item) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={item.id} 
                      className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-3 border border-slate-100/50 dark:border-slate-800/50 flex flex-col gap-3 group hover:border-pos-primary/30 transition-colors"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-sm">
                        <img 
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=150'} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                        />
                        <div className="absolute top-2 right-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                          <p className="text-[10px] font-black text-pos-accent">₹{item.sellingPrice}</p>
                        </div>
                      </div>
                      
                      <div className="flex-grow space-y-1">
                        <h4 className="font-bold text-slate-900 dark:text-white text-[11px] leading-tight line-clamp-2">{item.name}</h4>
                      </div>

                      <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-1 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-black text-xs tabular-nums text-slate-900 dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item)} 
                          className="w-8 h-8 flex items-center justify-center text-pos-accent hover:bg-pos-accent/10 rounded-xl transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="pt-6 border-t border-slate-50 dark:border-slate-800 space-y-2">
                    <div className="flex justify-between text-xs text-slate-400 font-bold">
                      <span>Subtotal</span>
                      <span className="text-slate-900 dark:text-white">₹{cartTotal}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400 font-bold">
                      <span>GST (5%)</span>
                      <span className="text-slate-900 dark:text-white">₹{(cartTotal * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Total</span>
                      <span className="text-2xl font-bold text-pos-accent">₹{(cartTotal * 1.05).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <button 
                    disabled={orderStatus === 'submitting'}
                    onClick={placeOrder}
                    className="w-full h-14 bg-pos-accent text-white rounded-2xl font-bold text-sm shadow-lg shadow-pos-accent/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {orderStatus === 'submitting' ? 'Sending...' : 'Place Order'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
