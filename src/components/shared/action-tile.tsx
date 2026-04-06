'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface ActionTileProps {
  icon: LucideIcon;
  label: string;
  path?: string;
  onClick?: () => void;
  variant?: 'default' | 'config';
}

export const ActionTile: React.FC<ActionTileProps> = ({ 
  icon: Icon, 
  label, 
  path, 
  onClick, 
  variant = 'default' 
}) => {
  const content = (
    <div className="group flex flex-col items-center justify-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:border-pos-primary/40 transition-all active:scale-95 text-center min-h-[120px] w-full">
      <div className={`p-3 rounded-xl transition-all duration-300 ${
        variant === 'config' 
          ? 'bg-gray-50 text-gray-400 group-hover:bg-pos-primary group-hover:text-white' 
          : 'bg-indigo-50 text-indigo-600 group-hover:bg-pos-primary group-hover:text-white'
      }`}>
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <span className="text-[12px] font-semibold text-gray-700 group-hover:text-pos-primary leading-tight px-1 uppercase tracking-tight">
        {label}
      </span>
    </div>
  );

  if (path) {
    return <Link href={path} className="w-full">{content}</Link>;
  }

  return (
    <button onClick={onClick} className="w-full">
      {content}
    </button>
  );
};
