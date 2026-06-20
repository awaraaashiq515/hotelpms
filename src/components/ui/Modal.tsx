'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  className?: string;
  isDark?: boolean;
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, maxWidth = 'lg', className = '', isDark = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative ${isDark ? 'bg-slate-900 text-white border border-white/10' : 'bg-white dark:bg-slate-900 text-gray-900 dark:text-white'} rounded-3xl lg:rounded-[32px] w-full ${maxWidthMap[maxWidth]} p-5 lg:p-7 shadow-2xl dark:shadow-none animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col ${className}`}>
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-gray-900 dark:text-white'} uppercase tracking-tighter italic`}>
            {title.split(' ')[0]} <span className={isDark ? 'text-indigo-400' : 'text-pos-primary'}>{title.split(' ').slice(1).join(' ')}</span>
          </h3>
          <button onClick={onClose} className={`p-2 ${isDark ? 'hover:bg-slate-800 text-slate-500 hover:text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'} rounded-full transition-colors`}>
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-1 no-scrollbar">
          {children}
          {footer && (
            <div className={`pt-4 mt-4 border-t ${isDark ? 'border-slate-800' : 'border-gray-100 dark:border-slate-800'} flex-shrink-0`}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
