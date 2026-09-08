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
  glowColor?: 'indigo' | 'emerald' | 'rose' | 'slate' | 'sky' | 'violet' | 'cyan' | 'amber' | 'teal' | 'orange';
  iconColor?: string;
  iconBg?: string;
  cardBorder?: string;
}

export const ActionTile: React.FC<ActionTileProps> = ({ 
  icon: Icon, 
  label, 
  path, 
  onClick, 
  variant = 'default',
  badge,
  lateStatus,
  glowColor,
  iconColor,
  iconBg,
  cardBorder
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
      const isCapacitor = typeof window !== 'undefined' && 
        (typeof (window as any).Capacitor !== 'undefined' || (navigator.userAgent || '').includes('Capacitor'));

      if (path.endsWith('/kitchen-display') || path.endsWith('/bar-display') || path.endsWith('/order-display')) {
        if (isCapacitor) {
          router.push(path);
        } else {
          window.open(path, '_blank');
        }
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
  
  const getBaseBorderClass = () => {
    if (cardBorder) return cardBorder;
    if (glowColor === 'indigo') {
      return 'border-indigo-500/20 dark:border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] dark:hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]';
    }
    if (glowColor === 'emerald') {
      return 'border-emerald-500/20 dark:border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] dark:hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]';
    }
    if (glowColor === 'rose') {
      return 'border-rose-500/20 dark:border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/40 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)] dark:hover:shadow-[0_0_20px_rgba(244,63,94,0.35)]';
    }
    return 'border-gray-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-500/40 dark:hover:border-indigo-500/40';
  };

  const blinkClass = lateStatus === 'LATE_PREP'
    ? 'animate-blink-late-red border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] bg-red-50/50 dark:bg-red-950/20'
    : lateStatus === 'LATE_PICKUP'
    ? 'animate-blink-ready border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.7)] bg-blue-50/50 dark:bg-blue-950/20'
    : hasBadge 
    ? 'animate-blink-late border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.45)] dark:bg-rose-950/20' 
    : getBaseBorderClass();

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
      className={`group relative flex flex-col items-center justify-center gap-2.5 p-3.5 bg-white dark:bg-[#0f172a] border rounded-2xl dark:hover:bg-[#131f35] transition-all duration-200 active:scale-95 text-center min-h-[105px] w-full cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/20 ${blinkClass}`}
    >
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${
          variant === 'config' 
            ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-pos-primary group-hover:text-white' 
            : iconBg
            ? iconBg
            : glowColor === 'indigo'
            ? 'bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'
            : glowColor === 'emerald'
            ? 'bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white'
            : glowColor === 'rose'
            ? 'bg-rose-500/15 text-rose-400 group-hover:bg-rose-600 group-hover:text-white'
            : 'bg-indigo-500/15 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white'
        }`}>
          <Icon size={19} strokeWidth={1.8} className={iconColor || ''} />
        </div>
        {hasBadge && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-rose-500 dark:bg-rose-600 px-1 text-[8px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] border border-white dark:border-slate-900 animate-pulse tracking-tight z-10">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 group-hover:text-pos-primary dark:group-hover:text-white leading-tight px-1 uppercase tracking-tight transition-colors">
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
