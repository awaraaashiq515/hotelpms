'use client';

import React from 'react';
import { X } from 'lucide-react';

interface StaffProfileModalProps {
  isOpen: boolean;
  staffRoleInput: string;
  onClose: () => void;
  onSetStaffRoleInput: (name: string) => void;
  onSave: () => void;
}

export const StaffProfileModal: React.FC<StaffProfileModalProps> = ({
  isOpen,
  staffRoleInput,
  onClose,
  onSetStaffRoleInput,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0e1629] border border-slate-700/80 rounded-3xl p-5 space-y-4 shadow-2xl animate-in fade-in-50 zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white">Active Kitchen Staff Member</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X size={16} />
          </button>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Name / Role
          </label>
          <input
            type="text"
            value={staffRoleInput}
            onChange={(e) => onSetStaffRoleInput(e.target.value)}
            placeholder="e.g. Executive Chef, Cook Rahul, Store Keeper"
            className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs font-bold hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25"
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
};

