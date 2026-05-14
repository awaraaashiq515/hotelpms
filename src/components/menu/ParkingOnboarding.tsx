import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Car, UtensilsCrossed } from 'lucide-react';

interface ParkingOnboardingProps {
  show: boolean;
  form: { name: string; phone: string; vehicle: string };
  setForm: (form: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  slotName?: string;
}

export const ParkingOnboarding: React.FC<ParkingOnboardingProps> = ({ show, form, setForm, onSubmit, slotName }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center p-6">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-5%] left-[-5%] w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px]" />
            <div className="absolute bottom-[-5%] right-[-5%] w-[300px] h-[300px] bg-pos-accent/10 rounded-full blur-[80px]" />
          </div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl"
          >
            <div className="text-center space-y-2 mb-8">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Car className="text-amber-500" size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Parking Order</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                {slotName || 'Vehicle Delivery'}
              </p>
              <p className="text-xs text-slate-400 font-medium">Enter your details to start ordering</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="relative">
                <User size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  required
                  type="text"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 transition-all"
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
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 transition-all"
                />
              </div>
              <div className="relative">
                <Car size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  required
                  type="text"
                  placeholder="Vehicle Number (e.g. MH01AB1234)"
                  value={form.vehicle}
                  onChange={(e) => setForm((prev: any) => ({ ...prev, vehicle: e.target.value.toUpperCase() }))}
                  className="w-full h-14 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl pl-14 pr-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:bg-white dark:focus:bg-slate-800 transition-all font-mono uppercase tracking-wider"
                />
              </div>

              <button 
                type="submit"
                className="w-full h-14 bg-amber-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-95 transition-all mt-4"
              >
                Continue to Menu →
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
