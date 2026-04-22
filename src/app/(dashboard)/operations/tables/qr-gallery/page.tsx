"use client";

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, ArrowLeft, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface Table {
  id: string;
  name: string;
  qrToken: string | null;
  property: {
    name: string;
    code: string;
  };
}

interface Property {
  name: string;
  code: string;
}

export default function QRGalleryPage() {
  const router = useRouter();
  const [tables, setTables] = useState<Table[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tableRes, propRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/admin/properties')
      ]);
      const tableData = await tableRes.json();
      const propData = await propRes.json();

      if (tableData.success) setTables(tableData.data);
      if (propData.success && propData.data.length > 0) setProperty(propData.data[0]);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrintAll = () => {
    window.print();
  };

  if (loading) return <div className="h-full flex items-center justify-center"><RefreshCcw className="animate-spin text-pos-primary" /></div>;

  return (
    <div className="p-8 space-y-8 min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="sm" onClick={() => router.back()} className="rounded-xl">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white uppercase">QR Print Gallery</h1>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Print all table QR codes at once</p>
          </div>
        </div>
        <Button onClick={handlePrintAll} className="rounded-2xl h-12 px-8 bg-pos-primary hover:bg-pos-primary-dark font-black uppercase text-xs tracking-widest gap-2">
          <Printer size={18} />
          Print All QRs
        </Button>
      </div>

      {/* QR Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {tables.map(table => (
          <div key={table.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center space-y-6 print:shadow-none print:border-2 print:border-gray-200 print:break-inside-avoid">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase">{table.property.name}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scan to Order</p>
            </div>
            
            <div className="p-4 bg-white rounded-3xl border border-gray-50 shadow-inner">
              <QRCodeSVG 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${table.property.code}/${table.qrToken || table.id}`} 
                size={180}
                level="H"
              />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-pos-primary uppercase tracking-tighter">{table.name}</h2>
              <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Powered by OrderMint</p>
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .p-8 { padding: 0 !important; }
          .grid { gap: 40px !important; }
        }
      `}</style>
    </div>
  );
}
