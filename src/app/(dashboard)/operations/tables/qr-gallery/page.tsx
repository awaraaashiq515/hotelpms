"use client";

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft, RefreshCcw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';

interface Floor {
  id: string;
  name: string;
}

interface Table {
  id: string;
  name: string;
  qrToken: string | null;
  floor: Floor | null;
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
  const [origin, setOrigin] = useState('');
  const [qrMode, setQrMode] = useState<'order' | 'rating'>('order');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tableRes, propRes, floorRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/admin/properties'),
        fetch('/api/floors')
      ]);
      const tableData = await tableRes.json();
      const propData = await propRes.json();
      const floorData = await floorRes.json();

      let activeTables = tableData.success ? tableData.data : [];

      // Auto-create "Home Delivery" virtual table if missing
      const homeDeliveryTable = activeTables.find((t: any) => t.name.toLowerCase() === 'home delivery');
      if (!homeDeliveryTable && floorData.success && floorData.data.length > 0) {
        const firstFloor = floorData.data[0];
        const createRes = await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Home Delivery',
            floorId: firstFloor.id,
            capacity: 999
          })
        });
        const createData = await createRes.json();
        if (createData.success) {
          const refreshRes = await fetch('/api/tables');
          const refreshData = await refreshRes.json();
          if (refreshData.success) {
            activeTables = refreshData.data;
          }
        }
      }

      setTables(activeTables);
      if (propData.success && propData.data.length > 0) setProperty(propData.data[0]);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setOrigin(window.location.origin);
  }, []);

  const handlePrintAll = () => {
    window.print();
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <RefreshCcw className="animate-spin text-pos-primary" />
    </div>
  );

  // Group tables by floor (excl. virtual Home Delivery table)
  const grouped = tables
    .filter(t => t.name.toLowerCase() !== 'home delivery')
    .reduce<Record<string, { floorName: string; tables: Table[] }>>((acc, table) => {
      const floorId = table.floor?.id ?? 'no-floor';
      const floorName = table.floor?.name ?? 'General';
      if (!acc[floorId]) acc[floorId] = { floorName, tables: [] };
      acc[floorId].tables.push(table);
      return acc;
    }, {});

  const floorGroups = Object.entries(grouped);



  return (
    <>
      {/* ─── Print Styles ─── */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }

          /* Global Reset for Print */
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
            color: black !important;
          }

          /* Force hide EVERYTHING except the print area */
          body > *:not(#qr-print-root) {
            display: none !important;
          }

          #qr-print-root {
            display: block !important;
            width: 100% !important;
          }

          .qr-print-card {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            height: 100vh !important;
            page-break-after: always !important;
            break-after: page !important;
            padding: 40px !important;
            margin: 0 !important;
            background: white !important;
            box-sizing: border-box !important;
          }

          /* Elegant Table Tent Design for Print */
          .print-content {
            border: 2px solid #eeeeee !important;
            border-radius: 40px !important;
            padding: 60px !important;
            width: 80% !important;
            max-width: 500px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 30px !important;
          }

          .print-property-name {
            font-size: 20px !important;
            font-weight: 700 !important;
            text-transform: capitalize !important;
            color: #000 !important;
          }

          .print-floor-badge {
            background-color: #f0fdf4 !important;
            color: #16a34a !important;
            padding: 4px 16px !important;
            border-radius: 99px !important;
            font-size: 12px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            display: inline-flex !important;
            border: 1px solid #dcfce7 !important;
          }

          .print-qr-container {
            padding: 20px !important;
            background: white !important;
            border: 1px solid #f0f0f0 !important;
            border-radius: 24px !important;
          }

          .print-table-name {
            font-size: 32px !important;
            font-weight: 700 !important;
            color: #000 !important;
            margin: 0 !important;
            line-height: 1 !important;
          }

          .print-footer {
            font-size: 12px !important;
            font-weight: 700 !important;
            color: #94a3b8 !important;
            text-transform: uppercase !important;
            letter-spacing: 4px !important;
          }



          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div id="qr-print-root" className="p-6 space-y-8 min-h-screen bg-gray-50 dark:bg-slate-950">
        {/* ─── Header ─── */}
        <div className="no-print">
          <PageHeader
            title="QR Print Gallery"
            subtitle={`${tables.length} tables · ${floorGroups.length} floors`}
            showBack
            backUrl="/operations/tables"
            actions={
              <>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-800">
                  <Button
                    variant={qrMode === 'order' ? 'primary' : 'ghost'}
                    onClick={() => setQrMode('order')}
                    className={`rounded-xl h-10 px-6 text-xs font-black uppercase tracking-widest ${qrMode === 'order' ? 'bg-pos-primary hover:bg-pos-primary-dark' : 'text-gray-500'}`}
                  >
                    Order QRs
                  </Button>
                  <Button
                    variant={qrMode === 'rating' ? 'primary' : 'ghost'}
                    onClick={() => setQrMode('rating')}
                    className={`rounded-xl h-10 px-6 text-xs font-black uppercase tracking-widest ${qrMode === 'rating' ? 'bg-orange-500 hover:bg-orange-600' : 'text-gray-500'}`}
                  >
                    Rating QRs
                  </Button>
                </div>
                <Button
                  onClick={handlePrintAll}
                  className="rounded-2xl h-12 px-8 bg-pos-primary hover:bg-pos-primary-dark font-black uppercase text-xs tracking-widest gap-2"
                >
                  <Printer size={18} />
                  Print All QRs
                </Button>
              </>
            }
          />
        </div>



        {/* ─── QR Grid ─── */}
        <div id="qr-print-area">
          {floorGroups.map(([floorId, { floorName, tables: floorTables }]) => (
            <div key={floorId} className="space-y-4 mb-10">
              {/* Floor heading (screen only) */}
              <div className="no-print flex items-center gap-3">
                <Layers size={16} className="text-pos-primary" />
                <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.25em]">
                  {floorName}
                </h2>
                <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                <span className="text-xs font-bold text-gray-400 uppercase">{floorTables.length} tables</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {floorTables.map(table => {
                  const qrUrl = qrMode === 'order' 
                    ? `${origin}/menu/${table.property.code}/${table.qrToken || table.id}`
                    : `${origin}/rate/${table.property.code}/${table.qrToken || table.id}`;
                    
                  return (
                    <div
                      key={table.id}
                      className={`qr-print-card bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-lg border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center p-4 gap-3 hover:scale-105 transition-transform duration-300 ${qrMode === 'rating' ? 'border-orange-200 dark:border-orange-900/30' : ''}`}
                    >
                      <div className="print-content w-full flex flex-col items-center gap-2">
                        {/* Property name */}
                        <div className="space-y-1 w-full flex flex-col items-center">
                          <h3 className="print-property-name text-[13px] font-bold text-gray-800 dark:text-white leading-tight truncate w-full">
                            {table.property.name}
                          </h3>
                          {/* Floor badge */}
                          <div className={`print-floor-badge text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${qrMode === 'rating' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                             {floorName}
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className={`print-qr-container p-2 bg-white rounded-xl border shadow-inner ${qrMode === 'rating' ? 'border-orange-100' : 'border-gray-100'}`}>
                          <QRCodeSVG
                            value={qrUrl}
                            size={140}
                            level="H"
                            includeMargin={false}
                          />
                        </div>

                        {/* Table name */}
                        <div className="space-y-0.5 w-full">
                          <h2 className="print-table-name text-lg font-bold text-gray-900 dark:text-white">
                            {table.name}
                          </h2>
                          <p className={`print-footer text-[10px] font-black uppercase tracking-[0.2em] ${qrMode === 'rating' ? 'text-orange-500' : 'text-gray-400'}`}>
                            {qrMode === 'order' ? 'Scan to Order' : 'Scan to Rate'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {tables.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-3 no-print">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No tables found</p>
            <Button variant="secondary" onClick={fetchData} className="rounded-xl gap-2">
              <RefreshCcw size={15} /> Retry
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
