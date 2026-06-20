"use client";

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, RefreshCcw, Layers, Home, Sparkles, Navigation, Globe, Phone, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter, useParams } from 'next/navigation';
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

interface ParkingSlot {
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
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';
  
  const [activeTab, setActiveTab] = useState<'tables' | 'parking'>('tables');
  const [tables, setTables] = useState<Table[]>([]);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [qrMode, setQrMode] = useState<'order' | 'rating'>('order');

  const downloadQRCard = async (
    id: string,
    name: string,
    floorOrType: string,
    qrUrl: string,
    mode: 'order' | 'rating' | 'parking'
  ) => {
    const svgId = mode === 'parking' ? `qr-parking-svg-${id}` : `qr-table-svg-${id}`;
    const svg = document.getElementById(svgId);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const width = 600;
      const height = 850;
      canvas.width = width;
      canvas.height = height;

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw outer border card
      ctx.strokeStyle = mode === 'rating' ? '#fed7aa' : '#f1f5f9';
      ctx.lineWidth = 12;
      ctx.lineJoin = 'round';
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Draw Property Name
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      const propName = property?.name || 'Our Restaurant';
      ctx.fillText(propName.toUpperCase(), width / 2, 85);

      // Draw Floor/Badge pill
      const badgeText = floorOrType.toUpperCase();
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      const badgeWidth = ctx.measureText(badgeText).width + 30;
      const badgeHeight = 30;
      const badgeX = (width - badgeWidth) / 2;
      const badgeY = 115;
      
      if (mode === 'rating') {
        ctx.fillStyle = '#ffedd5';
      } else if (mode === 'parking') {
        ctx.fillStyle = '#eff6ff';
      } else {
        ctx.fillStyle = '#f0fdf4';
      }
      
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 15);
      } else {
        ctx.arc(badgeX + 15, badgeY + 15, 15, Math.PI, 1.5 * Math.PI);
        ctx.arc(badgeX + badgeWidth - 15, badgeY + 15, 15, 1.5 * Math.PI, 2 * Math.PI);
        ctx.arc(badgeX + badgeWidth - 15, badgeY + badgeHeight - 15, 15, 0, 0.5 * Math.PI);
        ctx.arc(badgeX + 15, badgeY + badgeHeight - 15, 15, 0.5 * Math.PI, Math.PI);
      }
      ctx.fill();

      // Badge text color
      if (mode === 'rating') {
        ctx.fillStyle = '#ea580c';
      } else if (mode === 'parking') {
        ctx.fillStyle = '#2563eb';
      } else {
        ctx.fillStyle = '#16a34a';
      }
      ctx.fillText(badgeText, width / 2, badgeY + 19);

      // Draw QR container background
      ctx.fillStyle = '#ffffff';
      const qrBoxSize = 380;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 185;
      
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 24);
      } else {
        ctx.arc(qrBoxX + 24, qrBoxY + 24, 24, Math.PI, 1.5 * Math.PI);
        ctx.arc(qrBoxX + qrBoxSize - 24, qrBoxY + 24, 24, 1.5 * Math.PI, 2 * Math.PI);
        ctx.arc(qrBoxX + qrBoxSize - 24, qrBoxY + qrBoxSize - 24, 24, 0, 0.5 * Math.PI);
        ctx.arc(qrBoxX + 24, qrBoxY + qrBoxSize - 24, 24, 0.5 * Math.PI, Math.PI);
      }
      ctx.fill();
      
      ctx.strokeStyle = mode === 'rating' ? '#fed7aa' : '#f1f5f9';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw QR image
      ctx.drawImage(img, qrBoxX + 20, qrBoxY + 20, qrBoxSize - 40, qrBoxSize - 40);

      // Draw Table/Slot Name
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 40px Inter, system-ui, sans-serif';
      ctx.fillText(name, width / 2, 635);

      // Draw Instruction
      if (mode === 'rating') {
        ctx.fillStyle = '#ea580c';
      } else if (mode === 'parking') {
        ctx.fillStyle = '#2563eb';
      } else {
        ctx.fillStyle = '#16a34a';
      }
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      const instruction = mode === 'rating' ? 'SCAN TO RATE' : 'SCAN TO ORDER';
      ctx.fillText(instruction, width / 2, 685);

      // Sub-footer
      ctx.fillStyle = '#64748b';
      ctx.font = '600 13px Inter, system-ui, sans-serif';
      ctx.fillText('Fresh Food · Instant Service', width / 2, 725);

      // Bottom Brand text
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px Inter, system-ui, sans-serif';
      ctx.fillText('POWERED BY ORDERMINT', width / 2, 800);

      // Trigger download
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${name.replace(/\s+/g, '_')}_${mode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadAllQRs = async () => {
    const itemsToDownload = activeTab === 'tables' 
      ? tables.filter(t => t.name.toLowerCase() !== 'home delivery')
      : parkingSlots;

    for (let i = 0; i < itemsToDownload.length; i++) {
      const item = itemsToDownload[i];
      if (activeTab === 'tables') {
        const tableItem = item as Table;
        const floorName = tableItem.floor?.name ?? 'General';
        const qrUrl = qrMode === 'order' 
          ? `${origin}/menu/${tableItem.property.code}/${tableItem.qrToken || tableItem.id}`
          : `${origin}/rate/${tableItem.property.code}/${tableItem.qrToken || tableItem.id}`;
        
        await new Promise(resolve => setTimeout(resolve, 300));
        downloadQRCard(tableItem.id, tableItem.name, floorName, qrUrl, qrMode);
      } else {
        const slotItem = item as ParkingSlot;
        const qrUrl = `${origin}/menu/parking/${property?.code}/${slotItem.qrToken || slotItem.id}`;
        
        await new Promise(resolve => setTimeout(resolve, 300));
        downloadQRCard(slotItem.id, slotItem.name, 'Parking Slot', qrUrl, 'parking');
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tableRes, propRes, floorRes, parkingRes, sessionRes] = await Promise.all([
        fetch('/api/tables'),
        fetch('/api/admin/properties'),
        fetch('/api/floors'),
        fetch('/api/parking-slots').catch(() => null),
        fetch('/api/auth/session').catch(() => null)
      ]);
      const tableData = await tableRes.json();
      const propData = await propRes.json();
      const floorData = await floorRes.json();
      const sessionData = sessionRes ? await sessionRes.json() : null;

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
      if (propData.success && propData.data.length > 0) {
        const slugifyInline = (text: string) => {
          return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '');
        };

        const activePropertyId = sessionData?.authenticated ? sessionData.user?.propertyId : null;

        const activeProp = propData.data.find((p: any) => p.id === activePropertyId) ||
                           propData.data.find((p: any) => 
                             p.code === propertyCode || 
                             slugifyInline(p.name) === propertyCode ||
                             p.id === propertyCode
                           );

        setProperty(activeProp || propData.data[0]);
      }

      if (parkingRes) {
        try {
          const parkingData = await parkingRes.json();
          if (parkingData.success) {
            setParkingSlots(parkingData.data);
          }
        } catch (e) {
          console.error('Failed to parse parking slots', e);
        }
      }
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setOrigin(window.location.origin);

    // Read tab from query parameters
    const queryParams = new URLSearchParams(window.location.search);
    const tabParam = queryParams.get('tab');
    if (tabParam === 'delivery') {
      router.replace(`${p}/operations/delivery-flyer`);
    } else if (tabParam === 'parking') {
      setActiveTab('parking');
    } else {
      setActiveTab('tables');
    }
  }, []);

  const handlePrintAll = () => {
    window.print();
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center py-20">
      <RefreshCcw className="animate-spin text-pos-primary" />
    </div>
  );

  // Group tables by floor (excl. virtual Home Delivery table)
  const groupedTables = tables
    .filter(t => t.name.toLowerCase() !== 'home delivery')
    .reduce<Record<string, { floorName: string; tables: Table[] }>>((acc, table) => {
      const floorId = table.floor?.id ?? 'no-floor';
      const floorName = table.floor?.name ?? 'General';
      if (!acc[floorId]) acc[floorId] = { floorName, tables: [] };
      acc[floorId].tables.push(table);
      return acc;
    }, {});

  const floorGroups = Object.entries(groupedTables);

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

          /* Force hide EVERYTHING except the print root */
          body > *:not(#qr-print-root) {
            display: none !important;
          }

          #qr-print-root {
            display: block !important;
            width: 100% !important;
          }

          .no-print {
            display: none !important;
          }

          /* Dining Tables & Parking Slots layout for print */
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
          
          .print-parking-badge {
            background-color: #eff6ff !important;
            color: #2563eb !important;
            padding: 4px 16px !important;
            border-radius: 99px !important;
            font-size: 12px !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            display: inline-flex !important;
            border: 1px solid #dbeafe !important;
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

          /* Home Delivery Flyer layout for print */
          .poster-print-card {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 100% !important;
            height: 100vh !important;
            padding: 40px !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            background: white !important;
          }

          .poster-frame {
            border: 6px solid #4f46e5 !important;
            border-radius: 40px !important;
            padding: 60px !important;
            width: 90% !important;
            max-width: 540px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 30px !important;
            background: white !important;
            box-shadow: none !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div id="qr-print-root" className="p-6 space-y-8 min-h-screen bg-gray-50 dark:bg-slate-950">
        
        {/* ─── Page Header (Screen Only) ─── */}
        <div className="no-print">
          <PageHeader
            title="QR & Print Gallery"
            subtitle={
              activeTab === 'tables'
                ? `${tables.length - 1} tables · ${floorGroups.length} floors`
                : `${parkingSlots.length} parking slots`
            }
            showBack
            backUrl={`${p}/operations`}
            actions={
              <>
                {activeTab === 'tables' && (
                  <>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-800">
                      <Button
                        variant={qrMode === 'order' ? 'primary' : 'ghost'}
                        onClick={() => setQrMode('order')}
                        className={`rounded-xl h-10 px-6 text-xs font-black uppercase tracking-widest ${qrMode === 'order' ? 'bg-pos-primary hover:bg-pos-primary-dark text-white' : 'text-gray-500'}`}
                      >
                        Order QRs
                      </Button>
                      <Button
                        variant={qrMode === 'rating' ? 'primary' : 'ghost'}
                        onClick={() => setQrMode('rating')}
                        className={`rounded-xl h-10 px-6 text-xs font-black uppercase tracking-widest ${qrMode === 'rating' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'text-gray-500'}`}
                      >
                        Rating QRs
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={downloadAllQRs}
                      className="rounded-2xl h-12 px-6 border-2 border-pos-primary text-pos-primary hover:bg-pos-primary hover:text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-pos-primary/5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Download size={18} />
                      Download All QRs
                    </Button>
                    <Button
                      onClick={handlePrintAll}
                      className="rounded-2xl h-12 px-8 bg-pos-primary hover:bg-pos-primary-dark text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-pos-primary/10 active:scale-95"
                    >
                      <Printer size={18} />
                      Print Table QRs
                    </Button>
                  </>
                )}

                {activeTab === 'parking' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={downloadAllQRs}
                      className="rounded-2xl h-12 px-6 border-2 border-pos-primary text-pos-primary hover:bg-pos-primary hover:text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-pos-primary/5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Download size={18} />
                      Download All QRs
                    </Button>
                    <Button
                      onClick={handlePrintAll}
                      className="rounded-2xl h-12 px-8 bg-pos-primary hover:bg-pos-primary-dark text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-pos-primary/10 active:scale-95"
                    >
                      <Printer size={18} />
                      Print Parking QRs
                    </Button>
                  </>
                )}
              </>
            }
          />
        </div>

        {/* ─── Sleek Tab Switcher (Screen Only) ─── */}
        <div className="no-print flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-800 w-full max-w-lg mx-auto shadow-sm">
          <button
            onClick={() => {
              setActiveTab('tables');
              router.replace(`${p}/operations/tables/qr-gallery?tab=tables`);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'tables'
                ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/10'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            Dining Tables
          </button>
          {parkingSlots.length > 0 && (
            <button
              onClick={() => {
                setActiveTab('parking');
                router.replace(`${p}/operations/tables/qr-gallery?tab=parking`);
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'parking'
                  ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/10'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              Parking Slots
            </button>
          )}
        </div>

        {/* ─── Tab 1: Dining Tables QR Grid ─── */}
        {activeTab === 'tables' && (
          <div id="qr-print-area" className="space-y-10 animate-in fade-in duration-300">
            {floorGroups.map(([floorId, { floorName, tables: floorTables }]) => (
              <div key={floorId} className="space-y-4">
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
                        className={`group relative qr-print-card bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-lg border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center p-4 gap-3 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 ${qrMode === 'rating' ? 'border-orange-200 dark:border-orange-900/30' : ''}`}
                      >
                        {/* Download button in corner (screen only) */}
                        <button
                          onClick={() => downloadQRCard(table.id, table.name, floorName, qrUrl, qrMode)}
                          className="no-print absolute top-3 right-3 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-pos-primary hover:text-white dark:hover:bg-pos-primary rounded-xl transition-colors text-gray-500 cursor-pointer shadow-sm border border-gray-150 dark:border-slate-700"
                          title="Download QR Card"
                        >
                          <Download size={14} />
                        </button>

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
                              id={`qr-table-svg-${table.id}`}
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

            {tables.filter(t => t.name.toLowerCase() !== 'home delivery').length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-3 no-print">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No tables found</p>
                <Button variant="secondary" onClick={fetchData} className="rounded-xl gap-2">
                  <RefreshCcw size={15} /> Retry
                </Button>
              </div>
            )}
          </div>
        )}



        {/* ─── Tab 3: Parking Slots QR Grid ─── */}
        {activeTab === 'parking' && (
          <div id="qr-print-area" className="space-y-4 animate-in fade-in duration-300">
            {/* Legend / Info (screen only) */}
            <div className="no-print flex items-center gap-3">
              <Layers size={16} className="text-pos-primary" />
              <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.25em]">
                Parking Area QRs
              </h2>
              <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
              <span className="text-xs font-bold text-gray-400 uppercase">{parkingSlots.length} slots</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {parkingSlots.map(slot => {
                const qrUrl = `${origin}/menu/parking/${property?.code}/${slot.qrToken || slot.id}`;
                  
                return (
                  <div
                    key={slot.id}
                    className="group relative qr-print-card bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-lg border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center p-4 gap-3 hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
                  >
                    {/* Download button in corner (screen only) */}
                    <button
                      onClick={() => downloadQRCard(slot.id, slot.name, 'Parking Slot', qrUrl, 'parking')}
                      className="no-print absolute top-3 right-3 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-pos-primary hover:text-white dark:hover:bg-pos-primary rounded-xl transition-colors text-gray-500 cursor-pointer shadow-sm border border-gray-150 dark:border-slate-700"
                      title="Download QR Card"
                    >
                      <Download size={14} />
                    </button>

                    <div className="print-content w-full flex flex-col items-center gap-2">
                      {/* Property name */}
                      <div className="space-y-1 w-full flex flex-col items-center">
                        <h3 className="print-property-name text-[13px] font-bold text-gray-800 dark:text-white leading-tight truncate w-full">
                          {property?.name}
                        </h3>
                        {/* Parking badge */}
                        <div className="print-parking-badge text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                           Parking Slot
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="print-qr-container p-2 bg-white rounded-xl border shadow-inner border-gray-100">
                        <QRCodeSVG
                          id={`qr-parking-svg-${slot.id}`}
                          value={qrUrl}
                          size={140}
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      {/* Table name */}
                      <div className="space-y-0.5 w-full">
                        <h2 className="print-table-name text-lg font-bold text-gray-900 dark:text-white">
                          {slot.name}
                        </h2>
                        <p className="print-footer text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                          Scan to Order
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {parkingSlots.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center space-y-3 no-print">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No parking slots found</p>
                <Button variant="secondary" onClick={fetchData} className="rounded-xl gap-2">
                  <RefreshCcw size={15} /> Retry
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </>
  );
}
