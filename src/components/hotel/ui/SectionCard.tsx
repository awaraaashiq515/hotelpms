import React from 'react';
import Link from 'next/link';

interface SectionCardProps {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  href?: string;
  badge?: number;
  badgeColor?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title, icon: Icon, iconColor, href, badge, badgeColor = 'bg-indigo-500',
  children, footer, className = '',
}: SectionCardProps) {
  return (
    <div className={`rounded-2xl bg-slate-900/50 border border-white/5 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Icon size={13} className={iconColor} />
          <span className="text-[11px] font-black text-white uppercase tracking-wider">{title}</span>
          {badge != null && badge > 0 && (
            <span className={`min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black text-white ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {href && (
          <Link href={href} className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors">
            View All →
          </Link>
        )}
      </div>
      {/* Body */}
      <div>{children}</div>
      {/* Footer */}
      {footer && (
        <div className="border-t border-white/5 px-4 py-2">
          {footer}
        </div>
      )}
    </div>
  );
}
