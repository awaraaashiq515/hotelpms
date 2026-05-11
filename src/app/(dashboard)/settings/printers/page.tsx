'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Printer as PrinterIcon, Plus, Trash2, Edit2, CheckCircle, XCircle, PrinterCheck } from 'lucide-react';
import { PrinterModal } from '@/components/settings/PrinterModal';
import { toast } from 'sonner';

interface Printer {
  id: string;
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
  status: string;
}

export default function PrinterSettingsPage() {
  const [session, setSession] = useState<any>(null);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setSession(data.user);
        }
      })
      .catch(err => console.error('Failed to fetch session', err));
  }, []);

  const fetchPrinters = useCallback(async () => {
    if (!session?.propertyId) return;
    
    try {
      const response = await fetch(`/api/settings/printers?propertyId=${session.propertyId}`);
      if (!response.ok) throw new Error('Failed to fetch printers');
      const data = await response.json();
      setPrinters(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [session?.propertyId]);

  useEffect(() => {
    if (session) {
      fetchPrinters();
    }
  }, [fetchPrinters, session]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this printer?')) return;

    try {
      const response = await fetch(`/api/settings/printers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete printer');
      
      toast.success('Printer deleted');
      fetchPrinters();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleTestPrint = async (printer: Printer) => {
    try {
      const response = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            isTest: true, 
            printerId: printer.id,
            property: { name: session?.fullName || session?.name, id: session?.propertyId, thermalPrinterName: printer.ipAddress || printer.name }
        }),
      });

      if (!response.ok) throw new Error('Test print failed');
      toast.success('Test print sent successfully');
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const PrinterCard = ({ printer }: { printer: Printer }) => (
    <Card className="p-5 relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-indigo-500">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${printer.isEnabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
            <PrinterIcon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {printer.name}
              {printer.isEnabled ? (
                <span className="flex h-2 w-2 rounded-full bg-green-500" />
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-red-500" />
              )}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {printer.connectionType} {printer.ipAddress ? `• ${printer.ipAddress}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={() => { setSelectedPrinter(printer); setIsModalOpen(true); }}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={() => handleDelete(printer.id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-slate-800 p-2 rounded text-[11px]">
          <p className="text-gray-400 font-medium mb-1 uppercase tracking-wider">Type</p>
          <p className="font-semibold text-gray-700 dark:text-gray-200">{printer.printerType}</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-800 p-2 rounded text-[11px]">
          <p className="text-gray-400 font-medium mb-1 uppercase tracking-wider">Paper</p>
          <p className="font-semibold text-gray-700 dark:text-gray-200">{printer.paperSize}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {printer.isBilling && (
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
            <CheckCircle size={10} /> Billing
          </span>
        )}
        {printer.isKitchen && (
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-[10px] font-bold uppercase tracking-tight flex items-center gap-1">
            <CheckCircle size={10} /> Kitchen (KOT)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2 border-t pt-4 dark:border-slate-700">
        <Button 
          variant="secondary" 
          size="sm" 
          className="w-full text-[11px] py-1.5 h-auto flex items-center justify-center gap-2"
          onClick={() => handleTestPrint(printer)}
        >
          <PrinterCheck size={14} /> Test Print
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <PageHeader 
        title="Printer Settings" 
        description="Configure and manage thermal printers for billing and kitchen orders"
        showBack
        backUrl="/settings"
        actions={
          <Button 
            variant="primary" 
            onClick={() => { setSelectedPrinter(null); setIsModalOpen(true); }}
            className="flex items-center gap-2"
          >
            <Plus size={18} /> Add Printer
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 h-48 animate-pulse bg-gray-50 dark:bg-slate-800/50">
              <></>
            </Card>
          ))}
        </div>
      ) : printers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-800">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 mb-4">
            <PrinterIcon size={48} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Printers Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md mt-2">
            You haven't added any printers yet. Connect a thermal printer to start printing bills and KOTs.
          </p>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Add Your First Printer
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {printers.map((printer) => (
            <PrinterCard key={printer.id} printer={printer} />
          ))}
        </div>
      )}

      <PrinterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        printer={selectedPrinter}
        propertyId={session?.propertyId || ''}
        onSuccess={fetchPrinters}
      />
    </div>
  );
}
