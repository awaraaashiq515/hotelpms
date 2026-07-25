import React from 'react';

type StatusVariant =
  | 'success' | 'warning' | 'danger' | 'info'
  | 'purple' | 'slate' | 'orange' | 'default';

const VARIANTS: Record<StatusVariant, string> = {
  success:  'text-emerald-300 bg-emerald-500/10 border border-emerald-500/25',
  warning:  'text-amber-300 bg-amber-500/10 border border-amber-500/25',
  danger:   'text-rose-300 bg-rose-500/10 border border-rose-500/25',
  info:     'text-sky-300 bg-sky-500/10 border border-sky-500/25',
  purple:   'text-purple-300 bg-purple-500/10 border border-purple-500/25',
  slate:    'text-slate-400 bg-slate-800 border border-slate-700',
  orange:   'text-orange-300 bg-orange-500/10 border border-orange-500/25',
  default:  'text-slate-400 bg-slate-800 border border-slate-700',
};

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  pulse?: boolean;
  size?: 'xs' | 'sm';
}

export function StatusBadge({ label, variant = 'default', pulse = false, size = 'xs' }: StatusBadgeProps) {
  const sizeClass = size === 'xs' ? 'text-[8px] px-1.5 py-0.5' : 'text-[10px] px-2 py-1';
  return (
    <span className={`inline-flex items-center gap-1 font-black uppercase tracking-wider rounded-full ${sizeClass} ${VARIANTS[variant]}`}>
      {pulse && <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${variant === 'danger' ? 'bg-rose-400' : 'bg-current'}`} />}
      {label}
    </span>
  );
}

// Helper to map string status → variant
export function reservationStatusVariant(status: string): StatusVariant {
  const map: Record<string, StatusVariant> = {
    CONFIRMED: 'info',
    CHECKED_IN: 'success',
    CHECKED_OUT: 'slate',
    CANCELLED: 'danger',
    PENDING: 'warning',
    NO_SHOW: 'orange',
  };
  return map[status] ?? 'default';
}

export function priorityVariant(priority: string): StatusVariant {
  const map: Record<string, StatusVariant> = {
    URGENT: 'danger',
    HIGH: 'orange',
    NORMAL: 'warning',
    LOW: 'slate',
  };
  return map[priority] ?? 'default';
}
