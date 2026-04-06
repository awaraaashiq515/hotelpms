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
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  backUrl,
  actions
}) => {
  const router = useRouter();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="flex items-start gap-4">
        {showBack && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(backUrl || '/')}  // ✅ Use backUrl if provided
            className="h-10 px-3 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white flex items-center gap-2"
          >
            <ChevronLeft size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
          </Button>
        )}
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight uppercase">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[11px] font-medium text-gray-500 dark:text-slate-400 uppercase tracking-[0.1em]">
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