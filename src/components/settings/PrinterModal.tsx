'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';

interface Printer {
  id?: string;
  name: string;
  connectionType: string;
  ipAddress?: string;
  port?: number;
  printerType: string;
  paperSize: string;
  isBilling: boolean;
  isKitchen: boolean;
  isEnabled: boolean;
  autoCut: boolean;
  fontSize: number;
  margin: number;
  padding: number;
}

interface PrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer?: Printer | null;
  propertyId: string;
  onSuccess: () => void;
}

export const PrinterModal: React.FC<PrinterModalProps> = ({
  isOpen,
  onClose,
  printer,
  propertyId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Printer>({
    name: '',
    connectionType: 'NETWORK',
    ipAddress: '',
    port: 9100,
    printerType: 'THERMAL',
    paperSize: '80mm',
    isBilling: false,
    isKitchen: false,
    isEnabled: true,
    autoCut: true,
    fontSize: 12,
    margin: 0,
    padding: 0,
  });

  const [loading, setLoading] = useState(false);
  const [detectedPorts, setDetectedPorts] = useState<any[]>([]);
  const [detecting, setDetecting] = useState(false);

  useEffect(() => {
    if (printer) {
      setFormData(printer);
    } else {
      setFormData({
        name: '',
        connectionType: 'NETWORK',
        ipAddress: '',
        port: 9100,
        printerType: 'THERMAL',
        paperSize: '80mm',
        isBilling: false,
        isKitchen: false,
        isEnabled: true,
        autoCut: true,
        fontSize: 12,
        margin: 0,
        padding: 0,
      });
    }
  }, [printer, isOpen]);

  const detectPrinters = async () => {
    setDetecting(true);
    try {
      const response = await fetch('/api/settings/printers/detect');
      const data = await response.json();
      if (Array.isArray(data)) {
        setDetectedPorts(data);
        if (data.length > 0 && !formData.ipAddress) {
           // Auto-fill if empty
           // setFormData(prev => ({ ...prev, ipAddress: data[0].path }));
        }
      }
    } catch (error) {
      console.error('Failed to detect printers');
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (isOpen && (formData.connectionType === 'USB' || formData.connectionType === 'BLUETOOTH')) {
      detectPrinters();
    }
  }, [isOpen, formData.connectionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = printer?.id 
        ? `/api/settings/printers/${printer.id}` 
        : '/api/settings/printers';
      const method = printer?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, propertyId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save printer');
      }

      toast.success(printer?.id ? 'Printer updated' : 'Printer added');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={printer ? 'Edit Printer' : 'Add New Printer'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Printer Name"
              placeholder="e.g. Main Billing Printer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <Select
            label="Connection Type"
            value={formData.connectionType}
            onChange={(e) => {
                setFormData({ ...formData, connectionType: e.target.value, ipAddress: '' });
                if (e.target.value !== 'NETWORK') detectPrinters();
            }}
            options={[
              { label: 'Network (IP)', value: 'NETWORK' },
              { label: 'USB / Serial', value: 'USB' },
              { label: 'Bluetooth', value: 'BLUETOOTH' },
            ]}
          />

          {formData.connectionType === 'NETWORK' ? (
            <>
              <Input
                label="IP Address"
                placeholder="192.168.1.100"
                value={formData.ipAddress || ''}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                required
              />
              <Input
                label="Port"
                type="number"
                value={formData.port?.toString() || '9100'}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                required
              />
            </>
          ) : (
            <div className="flex flex-col gap-1">
               <label className="text-xs font-semibold text-gray-500 mb-1">Select Port / Printer</label>
               <div className="flex gap-2">
                    <select 
                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                        value={formData.ipAddress || ''}
                        onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    >
                        <option value="">-- Select Port --</option>
                        {detectedPorts.map((port) => (
                            <option key={port.path} value={port.path}>
                                {port.friendlyName || port.path} {port.manufacturer ? `(${port.manufacturer})` : ''}
                            </option>
                        ))}
                    </select>
                    <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        onClick={detectPrinters}
                        loading={detecting}
                        className="px-2"
                    >
                        Refresh
                    </Button>
               </div>
            </div>
          )}

          <Select
            label="Printer Type"
            value={formData.printerType}
            onChange={(e) => setFormData({ ...formData, printerType: e.target.value })}
            options={[
              { label: 'Thermal', value: 'THERMAL' },
              { label: 'Dot Matrix', value: 'DOT_MATRIX' },
              { label: 'Inkjet / Laser', value: 'DOCUMENT' },
            ]}
          />

          <Select
            label="Paper Size"
            value={formData.paperSize}
            onChange={(e) => setFormData({ ...formData, paperSize: e.target.value })}
            options={[
              { label: '80mm (Standard)', value: '80mm' },
              { label: '58mm (Small)', value: '58mm' },
              { label: 'A4 (Document)', value: 'A4' },
              { label: 'A5 (Half A4)', value: 'A5' },
              { label: 'A6', value: 'A6' },
              { label: 'A1', value: 'A1' },
              { label: 'A2', value: 'A2' },
              { label: 'A3', value: 'A3' },
              { label: 'Letter', value: 'LETTER' },
              { label: 'Legal', value: 'LEGAL' },
              { label: 'Custom', value: 'CUSTOM' },
            ]}
          />

          <Input
            label="Font Size"
            type="number"
            value={formData.fontSize.toString()}
            onChange={(e) => setFormData({ ...formData, fontSize: parseInt(e.target.value) })}
          />

          <Input
            label="Margin (px)"
            type="number"
            value={formData.margin.toString()}
            onChange={(e) => setFormData({ ...formData, margin: parseInt(e.target.value) })}
          />
        </div>

        <div className="space-y-4 border-t pt-4 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Printer Roles</h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isBilling}
                onChange={(e) => setFormData({ ...formData, isBilling: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Billing Printer</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isKitchen}
                onChange={(e) => setFormData({ ...formData, isKitchen: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Kitchen (KOT) Printer</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Enabled</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoCut}
                onChange={(e) => setFormData({ ...formData, autoCut: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Auto-Cut</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {printer ? 'Update Printer' : 'Add Printer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
