'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, X } from 'lucide-react';

interface CancelInvoiceModalProps {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  onConfirm,
  onCancel,
  loading
}) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <button 
          onClick={onCancel}
          className="absolute right-6 top-6 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
            <AlertCircle size={32} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Cancel Invoice?</h3>
            <p className="text-sm text-gray-400 font-medium px-4">This action will mark the invoice as cancelled and record the reason.</p>
          </div>

          <div className="w-full space-y-4">
            <div className="text-left space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Reason for Cancellation</label>
              <textarea 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Wrong items, Order changed..."
                className="w-full h-24 p-4 bg-gray-50 border-0 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-red-500/20 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={onCancel}
                className="py-4 text-xs font-bold uppercase tracking-widest bg-gray-50 border-0 active:scale-95"
              >
                Go Back
              </Button>
              <Button
                onClick={() => onConfirm(reason)}
                loading={loading}
                disabled={!reason.trim()}
                className="py-4 text-xs font-bold uppercase tracking-widest bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-100 active:scale-95 transition-all"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
