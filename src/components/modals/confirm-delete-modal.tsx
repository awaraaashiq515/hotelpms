'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  loading
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{title}</h3>
            <p className="text-sm text-gray-400 font-medium">{message}</p>
          </div>
          <div className="w-full grid grid-cols-2 gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={onCancel}
              className="py-4 text-xs font-bold uppercase tracking-widest bg-gray-50 border-0"
            >
              No, Keep
            </Button>
            <Button
              onClick={onConfirm}
              loading={loading}
              className="py-4 text-xs font-bold uppercase tracking-widest bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
