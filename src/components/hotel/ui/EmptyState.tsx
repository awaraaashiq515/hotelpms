import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ElementType;
  message: string;
  sub?: string;
  size?: 'sm' | 'md';
}

export function EmptyState({ icon: Icon = CheckCircle2, message, sub, size = 'md' }: EmptyStateProps) {
  const py = size === 'sm' ? 'py-4' : 'py-6';
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <div className={`${py} text-center`}>
      <Icon size={iconSize} className="text-emerald-500/30 mx-auto mb-1.5" />
      <p className="text-[10px] text-slate-600 font-semibold">{message}</p>
      {sub && <p className="text-[9px] text-slate-700 mt-0.5">{sub}</p>}
    </div>
  );
}
