'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
      return;
    }

    if (path) {
      if (path.endsWith('/kitchen-display') || path.endsWith('/bar-display')) {
        window.open(path, '_blank');
        return;
      }
      // Standard Next.js navigation
      router.push(path);
      
      // Safety: For environments like Electron where router.push might be intercepted or fail
      // but only if it doesn't navigate within 300ms
      const currentPath = window.location.pathname;
      setTimeout(() => {
        if (window.location.pathname === currentPath) {
          window.location.href = path;
        }
      }, 300);
    }
  };

  return (
    <button 
      type="button"
      onClick={handleClick}
      className="group flex flex-col items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm hover:shadow-md hover:border-pos-primary/40 dark:hover:border-pos-primary/40 transition-all active:scale-95 text-center min-h-[105px] w-full cursor-pointer outline-none focus:ring-2 focus:ring-pos-primary/20"
    >
      <div className={`p-2.5 rounded-xl transition-all duration-300 ${
        variant === 'config' 
          ? 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 group-hover:bg-pos-primary group-hover:text-white' 
          : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-pos-primary group-hover:text-white'
      }`}>
        <Icon size={20} strokeWidth={1.5} />
      </div>
      <span className="text-[11px] font-semibold text-gray-700 dark:text-white group-hover:text-pos-primary leading-tight px-1 uppercase tracking-tight">
        {label}
      </span>
    </button>
  );
};
