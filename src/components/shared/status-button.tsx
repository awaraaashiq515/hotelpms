'use client';

import React from 'react';

interface StatusButtonProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'paid' | 'unpaid' | 'partial' | 'refunded';
  label?: string;
  onClick?: () => void;
}

const statusConfig = {
  active: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', dot: 'bg-green-500' },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200', dot: 'bg-gray-300' },
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100', dot: 'bg-yellow-500' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', dot: 'bg-blue-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', dot: 'bg-red-500' },
  paid: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', dot: 'bg-emerald-500' },
  unpaid: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', dot: 'bg-orange-500' },
  partial: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', dot: 'bg-blue-500' },
  refunded: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', dot: 'bg-purple-500' },
};

export const StatusButton: React.FC<StatusButtonProps> = ({ status, label, onClick }) => {
  const config = statusConfig[status];
  
  return (
    <button 
      onClick={onClick}
      className={`px-3 py-1 rounded-lg border ${config.bg} ${config.text} ${config.border} flex items-center gap-2 transition-all hover:scale-105 active:scale-95`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
      <span className="text-[10px] font-bold uppercase tracking-widest">
        {label || status}
      </span>
    </button>
  );
};
