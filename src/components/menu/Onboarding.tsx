import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, UtensilsCrossed, MapPin, MessageSquare, Truck, Store, Coffee } from 'lucide-react';
import { MapPicker } from './MapPicker';

interface OnboardingProps {
  show: boolean;
  form: { 
    name: string; 
    phone: string; 
    orderType: 'DINE_IN' | 'DELIVERY' | 'PICKUP';
    deliveryAddress?: string;
    houseNo?: string;
    area?: string;
    landmark?: string;
    deliveryInstructions?: string;
  };
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  isHomeDelivery?: boolean;
}

export const Onboarding: React.FC<OnboardingProps> = ({ show, form, setForm, onSubmit, isHomeDelivery = false }) => {
  const allowedTabs = isHomeDelivery 
    ? [
        { id: 'DELIVERY', label: 'Delivery', icon: Truck },
        { id: 'PICKUP', label: 'Pickup', icon: Store }
      ]
    : [];

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] bg-pos-primary/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[300px] h-[300px] bg-pos-accent/10 rounded-full blur-[80px]" />
          </div>

          <motion.div 
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-6 md:p-8 relative shadow-2xl my-auto"
          >
            <div className="text-center space-y-2 mb-6">
              <div className="w-14 h-14 bg-pos-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <UtensilsCrossed className="text-pos-primary animate-pulse" size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Order Directly</h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">Select your preferences to view the menu and place orders</p>
            </div>

            {/* Order Type Tabs */}
            {allowedTabs.length > 0 && (
              <div className={`grid ${allowedTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-6`}>
                {allowedTabs.map(type => {
                  const IconComponent = type.icon;
                  const isActive = (form.orderType || 'DELIVERY') === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setForm((prev: any) => ({ ...prev, orderType: type.id }))}
                      className={`py-3.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                        isActive
                          ? 'bg-pos-accent text-white shadow-lg shadow-pos-accent/25 scale-[1.03]'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <IconComponent size={18} />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="relative">
                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  required
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-pos-accent dark:focus:border-pos-accent/50 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>
              
              <div className="relative">
                <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  required
                  type="tel"
                  placeholder="Phone Number"
                  value={form.phone}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, phone: e.target.value }))}
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-pos-accent dark:focus:border-pos-accent/50 focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>

              {/* Delivery Specific Fields */}
              {form.orderType === 'DELIVERY' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 overflow-hidden pt-1"
                >
                  {/* Google Map Picker */}
                  <MapPicker
                    initialAddress={form.deliveryAddress}
                    onAddressSelect={(address, lat, lng) => {
                      setForm((prev: any) => ({
                        ...prev,
                        deliveryAddress: address,
                        deliveryLat: lat,
                        deliveryLng: lng
                      }));
                    }}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        required
                        type="text"
                        placeholder="House / Flat No."
                        value={form.houseNo || ''}
                        onChange={(e) => setForm((prev: any) => ({ ...prev, houseNo: e.target.value }))}
                        className="w-full h-14 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-pos-accent transition-all"
                      />
                    </div>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        required
                        type="text"
                        placeholder="Sector / Lane"
                        value={form.area || ''}
                        onChange={(e) => setForm((prev: any) => ({ ...prev, area: e.target.value }))}
                        className="w-full h-14 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl pl-11 pr-4 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-pos-accent transition-all"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Landmark (Optional)"
                      value={form.landmark || ''}
                      onChange={(e) => setForm((prev: any) => ({ ...prev, landmark: e.target.value }))}
                      className="w-full h-14 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-pos-accent transition-all"
                    />
                  </div>
                  
                  <div className="relative">
                    <MessageSquare size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Delivery Instructions (e.g. Leave at gate, Ring bell)"
                      value={form.deliveryInstructions || ''}
                      onChange={(e) => setForm((prev: any) => ({ ...prev, deliveryInstructions: e.target.value }))}
                      className="w-full h-14 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-pos-accent dark:focus:border-pos-accent/50 focus:bg-white dark:focus:bg-slate-800 transition-all"
                    />
                  </div>
                </motion.div>
              )}

              <button 
                type="submit"
                className="w-full h-14 bg-pos-accent text-white rounded-2xl font-bold text-sm shadow-lg shadow-pos-accent/20 hover:bg-pos-accent/90 active:scale-[0.98] transition-all mt-6 cursor-pointer flex items-center justify-center gap-2"
              >
                Proceed to Menu
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
