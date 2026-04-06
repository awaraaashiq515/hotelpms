'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button } from './Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, showBack = false, actions }) => {
  const router = useRouter();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div className="flex items-start gap-4">
        {showBack && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-1 group py-2"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            BACK
          </Button>
        )}
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3 uppercase transition-colors">
            {title}
          </h1>
          {description && <p className="text-xs font-bold text-gray-400 dark:text-slate-500 tracking-wide uppercase transition-colors">{description}</p>}
        </div>
      </div>
      
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};
