'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backUrl?: string;       // ✅ Added backUrl support
  actions?: React.ReactNode;
  className?: string;     // ✅ Added className support
  titleClassName?: string;
  subtitleClassName?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  backUrl,
  actions,
  className,
  titleClassName,
  subtitleClassName
}) => {
  const router = useRouter();

  return (
    <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 ${className || ''}`}>
      <div className="flex items-start gap-4">
        {showBack && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => backUrl ? router.push(backUrl) : router.back()}  // ✅ Better back behavior
            className="h-9 px-2.5 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white flex items-center gap-1.5"
          >
            <ChevronLeft size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </Button>
        )}
        <div className="space-y-0.5">
          <h1 className={`text-2xl font-bold text-gray-900 dark:text-white tracking-tight uppercase ${titleClassName || ''}`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`text-[11px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-[0.1em] ${subtitleClassName || ''}`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};