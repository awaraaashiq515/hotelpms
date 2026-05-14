'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Trash2, AlertCircle, User, Info } from 'lucide-react';
import { toast } from 'sonner';

interface MarkWasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  table: any;
  onSuccess: () => void;
}

export const MarkWasteModal: React.FC<MarkWasteModalProps> = ({
  isOpen,
  onClose,
  order,
  table,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [staffName, setStaffName] = useState('');
  const [reason, setReason] = useState('Kitchen Mistake');
  const [notes, setNotes] = useState('');

  const reasons = [
    'Kitchen Mistake',
    'Wrong Order',
    'Customer Return',
    'Burnt',
    'Damaged',
    'Expired',
    'Extra Prepared',
  ];

  const handleToggleItem = (item: any) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, { ...item, wasteQty: 1 }]);
    }
  };

  const handleQtyChange = (id: string, qty: number) => {
    setSelectedItems(selectedItems.map(i => 
      i.id === id ? { ...i, wasteQty: Math.min(qty, i.quantity) } : i
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast.error('Please select at least one item');
      return;
    }
    if (!staffName) {
      toast.error('Please enter staff name');
      return;
    }

    setLoading(true);
    try {
      // Send multiple requests or batch if API supports it
      // Currently /api/waste seems to support single records
      const promises = selectedItems.map(item => {
        return fetch('/api/waste', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.productId,
            productName: item.product.name,
            quantity: item.wasteQty,
            reason,
            orderNo: order.orderNo,
            orderId: order.id,
            orderItemId: item.id, // Important for reducing bill
            tableNo: table.name,
            staffName,
            notes,
            costPrice: item.product.costPrice,
            status: 'RECORDED'
          })
        }).then(res => res.json());
      });

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.success);

      if (failed.length === 0) {
        toast.success(`Recorded ${selectedItems.length} waste items`);
        onSuccess();
        onClose();
      } else {
        toast.error(`Failed to record ${failed.length} items`);
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark Order Items as Waste"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-4">
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex gap-3">
          <AlertCircle className="text-amber-500 shrink-0" size={20} />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Marking Waste</p>
            <p className="text-xs text-amber-700/70 dark:text-amber-400/70">
              Mark items that were prepared but cannot be billed due to mistakes or changes.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Items to Mark</label>
          <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-2 pr-2">
            {order?.items.map((item: any) => {
              const isSelected = !!selectedItems.find(i => i.id === item.id);
              return (
                <div 
                  key={item.id}
                  onClick={() => handleToggleItem(item)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-800' 
                      : 'bg-white border-gray-100 dark:bg-slate-900 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-slate-700'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.product.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                       <span className="text-[10px] font-bold text-gray-400 uppercase">Waste Qty:</span>
                       <Input 
                         type="number"
                         value={selectedItems.find(i => i.id === item.id)?.wasteQty || 1}
                         onChange={(e) => handleQtyChange(item.id, parseFloat(e.target.value))}
                         className="w-16 h-8 text-center px-1"
                         min={0.1}
                         max={item.quantity}
                         step={0.1}
                       />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Staff Responsible</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <Input 
                placeholder="Staff Name"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="pl-9 h-11"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reason</label>
            <Select 
              value={reason}
              onChange={(e: any) => setReason(e.target.value)}
              options={reasons.map(r => ({ label: r, value: r }))}
              className="h-11"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Additional Notes</label>
          <textarea 
            className="w-full h-24 p-3 text-sm rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-pos-primary/20 outline-none resize-none"
            placeholder="Explain the situation..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button 
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none rounded-2xl h-12 shadow-lg shadow-red-200 dark:shadow-none"
            type="submit"
            loading={loading}
          >
            Record Waste Loss
          </Button>
        </div>
      </form>
    </Modal>
  );
};
