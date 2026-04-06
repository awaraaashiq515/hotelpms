'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionTileProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'config';
}

export const ActionTile: React.FC<ActionTileProps> = ({ icon: Icon, label, onClick, variant = 'default' }) => {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-pos-primary/40 transition-all active:scale-95 text-center min-h-[120px] w-full"
    >
      <div className={`p-3 rounded-xl transition-all ${
        variant === 'config' 
          ? 'bg-gray-50 text-gray-400 group-hover:bg-pos-primary group-hover:text-white' 
          : 'bg-indigo-50 text-indigo-600 group-hover:bg-pos-primary group-hover:text-white'
      }`}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <span className="text-[12px] font-semibold text-gray-700 group-hover:text-pos-primary leading-tight px-1">
        {label}
      </span>
    </button>
  );
};
