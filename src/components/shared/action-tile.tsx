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
  badge?: number | string;
  lateStatus?: 'LATE_PREP' | 'LATE_PICKUP' | null;
}

export const ActionTile: React.FC<ActionTileProps> = ({ 
  icon: Icon, 
  label, 
  path, 
  onClick, 
  variant = 'default',
  badge,
  lateStatus
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
      if (path.endsWith('/kitchen-display') || path.endsWith('/bar-display') || path.endsWith('/order-display')) {
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

  const hasBadge = badge !== undefined && badge !== null && (typeof badge === 'number' ? badge > 0 : badge !== '');
  const blinkClass = lateStatus === 'LATE_PREP'
    ? 'animate-blink-late-red border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] bg-red-50/50 dark:bg-red-950/10'
    : lateStatus === 'LATE_PICKUP'
    ? 'animate-blink-ready border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.7)] bg-blue-50/50 dark:bg-blue-950/10'
    : hasBadge 
    ? 'animate-blink-late border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.45)] dark:bg-rose-950/10' 
    : 'border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-pos-primary/40 dark:hover:border-pos-primary/40';

  const getLateText = () => {
    if (lateStatus === 'LATE_PREP') {
      if (label === 'Kitchen Display') return 'Late Kitchen';
      if (label === 'Bar Display') return 'Late Bar';
      if (label === 'Cafe POS') return 'Late Cafe';
      return 'Order Late';
    }
    if (lateStatus === 'LATE_PICKUP') {
      return 'Late Pickup';
    }
    return '';
  };

  return (
    <button 
      type="button"
      onClick={handleClick}
      className={`group relative flex flex-col items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-slate-900 border rounded-xl transition-all active:scale-95 text-center min-h-[105px] w-full cursor-pointer outline-none focus:ring-2 focus:ring-pos-primary/20 ${blinkClass}`}
    >
      <div className="relative">
        <div className={`p-2.5 rounded-xl transition-all duration-300 ${
          variant === 'config' 
            ? 'bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-slate-500 group-hover:bg-pos-primary group-hover:text-white' 
            : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-pos-primary group-hover:text-white'
        }`}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
        {hasBadge && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 dark:bg-rose-600 px-1 text-[8px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] border border-white dark:border-slate-900 animate-pulse tracking-tight z-10">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[11px] font-semibold text-gray-700 dark:text-white group-hover:text-pos-primary leading-tight px-1 uppercase tracking-tight">
        {label}
      </span>
      {lateStatus && (
        <span className={`text-[8px] font-black uppercase animate-pulse tracking-wider leading-none ${
          lateStatus === 'LATE_PREP' ? 'text-red-500 dark:text-red-400' : 'text-blue-500 dark:text-blue-400'
        }`}>
          {getLateText()}
        </span>
      )}
    </button>
  );
};
