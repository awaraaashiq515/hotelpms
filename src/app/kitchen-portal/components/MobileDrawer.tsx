'use client';

import React from 'react';
import Link from 'next/link';
import { ChefHat, X, Volume2, VolumeX, Building2, Utensils, Package, BedDouble, ExternalLink } from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  propertyCode: string;
  activeStaffName: string;
  soundOn: boolean;
  onClose: () => void;
  onOpenStaffModal: () => void;
  onToggleSound: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  propertyCode,
  activeStaffName,
  soundOn,
  onClose,
  onOpenStaffModal,
  onToggleSound,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xs bg-[#080d1a] border-l border-slate-800 h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white">
                <ChefHat size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Kitchen Menu</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold">
                  {propertyCode.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          {/* Staff Profile in Mobile Menu */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold">Active Staff</span>
              <p className="text-xs font-black text-white truncate max-w-[130px]">{activeStaffName}</p>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenStaffModal();
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold"
            >
              Switch
            </button>
          </div>

          {/* Audio Chime Setting */}
          <div className="mt-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              {soundOn ? <Volume2 size={16} className="text-indigo-400" /> : <VolumeX size={16} />}
              <span>Sound Notifications</span>
            </div>
            <button
              onClick={onToggleSound}
              className={`w-10 h-6 rounded-full p-0.5 transition ${soundOn ? 'bg-indigo-600' : 'bg-slate-800'
                }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition ${soundOn ? 'translate-x-4' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          {/* Quick Links to Connected PMS Modules */}
          <div className="mt-5 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-2 block">
              Connected Hotel Systems
            </span>

            <Link
              href="/hotel"
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <span className="flex items-center gap-2">
                <Building2 size={15} className="text-indigo-400" /> Hotel Front Office / PMS
              </span>
              <ExternalLink size={12} className="text-slate-500" />
            </Link>

            <Link
              href={`/${propertyCode}/pos`}
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <span className="flex items-center gap-2">
                <Utensils size={15} className="text-emerald-400" /> Restaurant POS Billing
              </span>
              <ExternalLink size={12} className="text-slate-500" />
            </Link>

            <Link
              href="/hotel/inventory"
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <span className="flex items-center gap-2">
                <Package size={15} className="text-amber-400" /> Central Inventory Store
              </span>
              <ExternalLink size={12} className="text-slate-500" />
            </Link>

            <Link
              href={`/housekeeper-portal/${propertyCode}`}
              onClick={onClose}
              className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <span className="flex items-center gap-2">
                <BedDouble size={15} className="text-violet-400" /> Housekeeper Portal
              </span>
              <ExternalLink size={12} className="text-slate-500" />
            </Link>
          </div>
        </div>

        {/* Close Drawer Button */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-slate-300 font-bold text-xs hover:bg-slate-800"
          >
            Close Menu
          </button>
        </div>
      </div>
    </div>
  );
};

