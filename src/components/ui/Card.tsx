import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white/80 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl shadow-xl dark:shadow-none overflow-hidden ${onClick ? 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500' : ''} ${className}`}
    >
      <div className={noPadding ? '' : 'p-6 md:p-8'}>
        {children}
      </div>
    </div>
  );
};
