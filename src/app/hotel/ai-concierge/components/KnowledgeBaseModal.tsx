'use client';

import React, { useState } from 'react';
import { X, Save, RotateCcw, Sparkles, Wifi, Clock, Utensils, Waves, ShieldCheck } from 'lucide-react';
import { HotelKnowledge, DEFAULT_KNOWLEDGE } from '@/lib/ai-concierge-engine';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  knowledge: HotelKnowledge;
  onSave: (updated: HotelKnowledge) => void;
}

export function KnowledgeBaseModal({ isOpen, onClose, knowledge, onSave }: KnowledgeBaseModalProps) {
  const [formData, setFormData] = useState<HotelKnowledge>({ ...knowledge });
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_KNOWLEDGE });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-violet-500/20 shadow-2xl shadow-violet-950/40 overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">AI Concierge Knowledge & Policies</h2>
              <p className="text-[11px] text-slate-400">Configure information the AI references when assisting guests</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Hotel Name */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
              Hotel / Resort Name
            </label>
            <input 
              type="text" 
              value={formData.hotelName}
              onChange={e => setFormData({ ...formData, hotelName: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-white/10 text-white focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Wi-Fi Section */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-violet-400 font-bold text-[11px]">
              <Wifi size={14} />
              <span>Wi-Fi Network Credentials</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Wi-Fi SSID (Network Name)</label>
                <input 
                  type="text" 
                  value={formData.wifiName}
                  onChange={e => setFormData({ ...formData, wifiName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Wi-Fi Password</label>
                <input 
                  type="text" 
                  value={formData.wifiPassword}
                  onChange={e => setFormData({ ...formData, wifiPassword: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dining & Breakfast */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
              <Utensils size={14} />
              <span>Dining & Breakfast Policies</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Breakfast Hours & Venue</label>
                <input 
                  type="text" 
                  value={formData.breakfastTime}
                  onChange={e => setFormData({ ...formData, breakfastTime: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Room Service (In-Room Dining)</label>
                <input 
                  type="text" 
                  value={formData.roomServiceHours}
                  onChange={e => setFormData({ ...formData, roomServiceHours: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Amenities & Timings */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-[11px]">
              <Waves size={14} />
              <span>Amenities & Recreation Hours</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Pool Timings</label>
                <input 
                  type="text" 
                  value={formData.poolHours}
                  onChange={e => setFormData({ ...formData, poolHours: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Gym / Fitness</label>
                <input 
                  type="text" 
                  value={formData.gymHours}
                  onChange={e => setFormData({ ...formData, gymHours: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Spa & Wellness</label>
                <input 
                  type="text" 
                  value={formData.spaHours}
                  onChange={e => setFormData({ ...formData, spaHours: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Checkout & Phone */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-[11px]">
              <Clock size={14} />
              <span>Checkout & Contact Desks</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Checkout Time</label>
                <input 
                  type="text" 
                  value={formData.checkoutTime}
                  onChange={e => setFormData({ ...formData, checkoutTime: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Late Checkout Terms</label>
                <input 
                  type="text" 
                  value={formData.lateCheckoutPolicy}
                  onChange={e => setFormData({ ...formData, lateCheckoutPolicy: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Concierge Desk Ext / Phone</label>
                <input 
                  type="text" 
                  value={formData.conciergePhone}
                  onChange={e => setFormData({ ...formData, conciergePhone: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">Doctor / Medical On-Call</label>
                <input 
                  type="text" 
                  value={formData.doctorOnCall}
                  onChange={e => setFormData({ ...formData, doctorOnCall: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-white/10 text-white focus:border-violet-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-white/10 bg-slate-900/80">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-[11px] font-bold"
          >
            <RotateCcw size={13} />
            <span>Reset to Defaults</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-[11px] font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-[11px] shadow-lg shadow-violet-600/30 transition-colors"
            >
              {saved ? <ShieldCheck size={14} className="text-emerald-300" /> : <Save size={14} />}
              <span>{saved ? 'Saved!' : 'Save Knowledge Base'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
