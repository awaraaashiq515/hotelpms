import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Table } from './TableCard';
import { RefreshCcw, ArrowRightLeft } from 'lucide-react';

interface SwitchTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTable: Table | null;
  vacantTables: Table[];
  onConfirm: (targetTableId: string) => Promise<void>;
  loading?: boolean;
}

export const SwitchTableModal: React.FC<SwitchTableModalProps> = ({
  isOpen,
  onClose,
  sourceTable,
  vacantTables,
  onConfirm,
  loading = false
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedTargetId) return;
    await onConfirm(selectedTargetId);
    setSelectedTargetId(null);
  };

  if (!sourceTable) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Switch Table"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="text-center flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">From</p>
            <p className="text-xl font-black text-indigo-600">{sourceTable.name}</p>
          </div>
          <div className="px-4 text-gray-300">
            <ArrowRightLeft size={24} />
          </div>
          <div className="text-center flex-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">To</p>
            <p className="text-xl font-black text-emerald-600">
              {selectedTargetId ? vacantTables.find(t => t.id === selectedTargetId)?.name : '?'}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest pl-1">Select Target Table</p>
          {vacantTables.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-xs font-bold text-gray-400">No vacant tables available</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
              {vacantTables.map((table) => (
                <button
                  key={table.id}
                  onClick={() => setSelectedTargetId(table.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedTargetId === table.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100 scale-[1.02]'
                      : 'border-gray-100 bg-white text-gray-600 hover:border-indigo-200 hover:scale-[1.02]'
                  }`}
                >
                  <p className="text-lg font-black">{table.name}</p>
                  <p className="text-[10px] font-bold opacity-60 uppercase">{table.capacity} Chairs</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1 rounded-xl h-12 font-black uppercase text-xs tracking-widest"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 rounded-xl h-12 font-black uppercase text-xs tracking-widest"
            onClick={handleConfirm}
            disabled={!selectedTargetId || loading}
            loading={loading}
          >
            Confirm Switch
          </Button>
        </div>
      </div>
    </Modal>
  );
};
