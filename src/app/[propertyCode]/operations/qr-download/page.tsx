"use client";

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, RefreshCcw, Layers, Home, Sparkles, Navigation, Globe, Phone, Download, Star, CarFront, Utensils } from 'lucide-react';
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

export default function QRDownloadPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';
  
  const [activeTab, setActiveTab] = useState<'tables-order' | 'tables-rate' | 'parking' | 'delivery'>('tables-order');
  const [tables, setTables] = useState<Table[]>([]);
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

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
  }, []);

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

  const downloadPoster = () => {
    const svg = document.getElementById('delivery-qr-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const width = 800;
      const height = 1130;
      canvas.width = width;
      canvas.height = height;

      // Draw white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Draw a stylish thick indigo border
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 16;
      ctx.lineJoin = 'round';
      ctx.strokeRect(30, 30, width - 60, height - 60);

      // 1. Draw "Home Delivery Available" pill
      const pillText = 'HOME DELIVERY AVAILABLE';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      const pillWidth = ctx.measureText(pillText).width + 40;
      const pillHeight = 40;
      const pillX = (width - pillWidth) / 2;
      const pillY = 90;

      ctx.fillStyle = '#e0e7ff';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 20);
      } else {
        ctx.arc(pillX + 20, pillY + 20, 20, Math.PI, 1.5 * Math.PI);
        ctx.arc(pillX + pillWidth - 20, pillY + 20, 20, 1.5 * Math.PI, 2 * Math.PI);
        ctx.arc(pillX + pillWidth - 20, pillY + pillHeight - 20, 20, 0, 0.5 * Math.PI);
        ctx.arc(pillX + 20, pillY + pillHeight - 20, 20, 0.5 * Math.PI, Math.PI);
      }
      ctx.fill();

      ctx.fillStyle = '#4338ca';
      ctx.textAlign = 'center';
      ctx.fillText(pillText, width / 2, pillY + 25);

      // 2. Draw Property Name
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 54px Inter, system-ui, sans-serif';
      const propName = property?.name || 'Our Kitchen';
      ctx.fillText(propName.toUpperCase(), width / 2, 210);

      // 3. Draw Slogan text (multiline wrapping)
      ctx.fillStyle = '#475569';
      ctx.font = '600 18px Inter, system-ui, sans-serif';
      const slogan = 'Scan this QR code from home to browse our full digital menu and place home delivery orders directly on your mobile!';
      
      const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = context.measureText(testLine);
          const testWidth = metrics.width;
          if (testWidth > maxWidth && n > 0) {
            context.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
          } else {
            line = testLine;
          }
        }
        context.fillText(line, x, currentY);
      };

      wrapText(ctx, slogan, width / 2, 270, 600, 26);

      // 4. Draw QR Container
      const qrBoxSize = 420;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 390;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 32);
      } else {
        ctx.arc(qrBoxX + 32, qrBoxY + 32, 32, Math.PI, 1.5 * Math.PI);
        ctx.arc(qrBoxX + qrBoxSize - 32, qrBoxY + 32, 32, 1.5 * Math.PI, 2 * Math.PI);
        ctx.arc(qrBoxX + qrBoxSize - 32, qrBoxY + qrBoxSize - 32, 32, 0, 0.5 * Math.PI);
        ctx.arc(qrBoxX + 32, qrBoxY + qrBoxSize - 32, 32, 0.5 * Math.PI, Math.PI);
      }
      ctx.fill();

      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw QR image
      ctx.drawImage(img, qrBoxX + 30, qrBoxY + 30, qrBoxSize - 60, qrBoxSize - 60);

      // 5. Draw SCAN TO ORDER title
      ctx.fillStyle = '#4f46e5';
      ctx.font = 'bold 36px Inter, system-ui, sans-serif';
      ctx.fillText('SCAN TO ORDER', width / 2, 890);

      // 6. Draw Sub-slogan
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.fillText('FRESH FOOD · SUPER FAST DELIVERY', width / 2, 940);

      // 7. Bottom Brand Watermark
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.fillText('POWERED BY ORDERMINT', width / 2, 1050);

      // Trigger download
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `Home_Delivery_Flyer_${propName.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadAllQRs = async () => {
    if (activeTab === 'delivery') {
      downloadPoster();
      return;
    }

    const itemsToDownload = activeTab.startsWith('tables')
      ? tables.filter(t => t.name.toLowerCase() !== 'home delivery')
      : parkingSlots;

    for (let i = 0; i < itemsToDownload.length; i++) {
      const item = itemsToDownload[i];
      if (activeTab.startsWith('tables')) {
        const tableItem = item as Table;
        const floorName = tableItem.floor?.name ?? 'General';
        const mode = activeTab === 'tables-order' ? 'order' : 'rating';
        const qrUrl = mode === 'order' 
          ? `${origin}/menu/${tableItem.property.code}/${tableItem.qrToken || tableItem.id}`
          : `${origin}/rate/${tableItem.property.code}/${tableItem.qrToken || tableItem.id}`;
        
        await new Promise(resolve => setTimeout(resolve, 300));
        downloadQRCard(tableItem.id, tableItem.name, floorName, qrUrl, mode);
      } else {
        const slotItem = item as ParkingSlot;
        const qrUrl = `${origin}/menu/parking/${property?.code}/${slotItem.qrToken || slotItem.id}`;
        
        await new Promise(resolve => setTimeout(resolve, 300));
        downloadQRCard(slotItem.id, slotItem.name, 'Parking Slot', qrUrl, 'parking');
      }
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
      <RefreshCcw className="animate-spin text-pos-primary" />
    </div>
  );

  // Group tables by floor
  const activeTables = tables.filter(t => t.name.toLowerCase() !== 'home delivery');
  const groupedTables = activeTables.reduce<Record<string, { floorName: string; tables: Table[] }>>((acc, table) => {
    const floorId = table.floor?.id ?? 'no-floor';
    const floorName = table.floor?.name ?? 'General';
    if (!acc[floorId]) acc[floorId] = { floorName, tables: [] };
    acc[floorId].tables.push(table);
    return acc;
  }, {});

  const floorGroups = Object.entries(groupedTables);
  const deliveryQrUrl = property ? `${origin}/menu/${property.code}/delivery` : '';

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-50 dark:bg-slate-950">
      {/* Page Header */}
      <PageHeader
        title="QR Downloads Center"
        subtitle="Download high-resolution styled QR cards and flyers for your restaurant operations."
        showBack
        backUrl={`${p}/operations`}
        actions={
          <Button
            onClick={downloadAllQRs}
            className="rounded-2xl h-12 px-8 bg-pos-primary hover:bg-pos-primary-dark text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-pos-primary/10 active:scale-95 cursor-pointer"
          >
            <Download size={18} />
            {activeTab === 'delivery' ? 'Download Flyer' : 'Download All QRs'}
          </Button>
        }
      />

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-gray-200 dark:border-slate-800 w-full max-w-2xl mx-auto shadow-sm">
        <button
          onClick={() => setActiveTab('tables-order')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'tables-order'
              ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/10'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
        >
          <Utensils size={14} />
          Dining QRs
        </button>
        <button
          onClick={() => setActiveTab('tables-rate')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'tables-rate'
              ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/10'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
        >
          <Star size={14} />
          Rating QRs
        </button>
        {parkingSlots.length > 0 && (
          <button
            onClick={() => setActiveTab('parking')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'parking'
                ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/10'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            <CarFront size={14} />
            Parking QRs
          </button>
        )}
        <button
          onClick={() => setActiveTab('delivery')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'delivery'
              ? 'bg-pos-primary text-white shadow-lg shadow-pos-primary/10'
              : 'text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800'
          }`}
        >
          <Home size={14} />
          Delivery Flyer
        </button>
      </div>

      {/* Grid Content */}
      <div className="space-y-10 animate-in fade-in duration-300">
        {/* Tables (Order QRs) */}
        {activeTab === 'tables-order' && (
          <div className="space-y-10">
            {floorGroups.map(([floorId, { floorName, tables: floorTables }]) => (
              <div key={floorId} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Layers size={16} className="text-pos-primary" />
                  <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.25em]">
                    {floorName}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  <span className="text-xs font-bold text-gray-400 uppercase">{floorTables.length} tables</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {floorTables.map(table => {
                    const qrUrl = `${origin}/menu/${table.property.code}/${table.qrToken || table.id}`;
                    return (
                      <div
                        key={table.id}
                        className="group relative bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-lg border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center p-4 gap-3 hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
                      >
                        <button
                          onClick={() => downloadQRCard(table.id, table.name, floorName, qrUrl, 'order')}
                          className="absolute top-3 right-3 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-pos-primary hover:text-white dark:hover:bg-pos-primary rounded-xl transition-colors text-gray-500 cursor-pointer shadow-sm border border-gray-150 dark:border-slate-700"
                          title="Download QR Card"
                        >
                          <Download size={14} />
                        </button>
                        <div className="w-full flex flex-col items-center gap-2">
                          <div className="space-y-1 w-full">
                            <h3 className="text-[13px] font-bold text-gray-800 dark:text-white leading-tight truncate">
                              {table.property.name}
                            </h3>
                            <div className="inline-block bg-green-100 text-green-600 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                              {floorName}
                            </div>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-inner">
                            <QRCodeSVG
                              id={`qr-table-svg-${table.id}`}
                              value={qrUrl}
                              size={140}
                              level="H"
                              includeMargin={false}
                            />
                          </div>
                          <div className="space-y-0.5 w-full">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                              {table.name}
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                              Scan to Order
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
        )}

        {/* Tables (Rating QRs) */}
        {activeTab === 'tables-rate' && (
          <div className="space-y-10">
            {floorGroups.map(([floorId, { floorName, tables: floorTables }]) => (
              <div key={floorId} className="space-y-4">
                <div className="flex items-center gap-3">
                  <Layers size={16} className="text-pos-primary" />
                  <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.25em]">
                    {floorName} (Feedback)
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
                  <span className="text-xs font-bold text-gray-400 uppercase">{floorTables.length} tables</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {floorTables.map(table => {
                    const qrUrl = `${origin}/rate/${table.property.code}/${table.qrToken || table.id}`;
                    return (
                      <div
                        key={table.id}
                        className="group relative bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-lg border border-orange-100 dark:border-orange-900/30 flex flex-col items-center text-center p-4 gap-3 hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
                      >
                        <button
                          onClick={() => downloadQRCard(table.id, table.name, floorName, qrUrl, 'rating')}
                          className="absolute top-3 right-3 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-pos-primary hover:text-white dark:hover:bg-pos-primary rounded-xl transition-colors text-gray-500 cursor-pointer shadow-sm border border-gray-150 dark:border-slate-700"
                          title="Download QR Card"
                        >
                          <Download size={14} />
                        </button>
                        <div className="w-full flex flex-col items-center gap-2">
                          <div className="space-y-1 w-full">
                            <h3 className="text-[13px] font-bold text-gray-800 dark:text-white leading-tight truncate">
                              {table.property.name}
                            </h3>
                            <div className="inline-block bg-orange-100 text-orange-600 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                              {floorName}
                            </div>
                          </div>
                          <div className="p-2 bg-white rounded-xl border border-orange-100 shadow-inner">
                            <QRCodeSVG
                              id={`qr-table-svg-${table.id}`}
                              value={qrUrl}
                              size={140}
                              level="H"
                              includeMargin={false}
                            />
                          </div>
                          <div className="space-y-0.5 w-full">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                              {table.name}
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
                              Scan to Rate
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
        )}

        {/* Parking Slots */}
        {activeTab === 'parking' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
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
                    className="group relative bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-lg border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center p-4 gap-3 hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
                  >
                    <button
                      onClick={() => downloadQRCard(slot.id, slot.name, 'Parking Slot', qrUrl, 'parking')}
                      className="absolute top-3 right-3 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-pos-primary hover:text-white dark:hover:bg-pos-primary rounded-xl transition-colors text-gray-500 cursor-pointer shadow-sm border border-gray-150 dark:border-slate-700"
                      title="Download QR Card"
                    >
                      <Download size={14} />
                    </button>
                    <div className="w-full flex flex-col items-center gap-2">
                      <div className="space-y-1 w-full">
                        <h3 className="text-[13px] font-bold text-gray-800 dark:text-white leading-tight truncate">
                          {property?.name}
                        </h3>
                        <div className="inline-block bg-blue-100 text-blue-600 text-[10px] uppercase font-black px-2 py-0.5 rounded-full">
                          Parking Slot
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-gray-100 shadow-inner">
                        <QRCodeSVG
                          id={`qr-parking-svg-${slot.id}`}
                          value={qrUrl}
                          size={140}
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                      <div className="space-y-0.5 w-full">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          {slot.name}
                        </h2>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                          Scan to Order
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Home Delivery Flyer */}
        {activeTab === 'delivery' && (
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl text-slate-900 dark:text-slate-150 flex flex-col items-center gap-6 relative overflow-hidden transition-all hover:scale-[1.01]">
              <div className="absolute top-0 right-0 bg-indigo-650 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl flex items-center gap-1 shadow-md">
                <Sparkles size={10} className="animate-spin" /> High Density
              </div>

              <div className="space-y-2 mt-4 text-center">
                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/30">
                  Home Delivery Available
                </span>
                <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white mt-1">
                  {property?.name || 'Our Kitchen'}
                </h1>
              </div>

              <p className="text-xs font-semibold text-slate-400 text-center leading-relaxed max-w-[280px]">
                Scan this QR code from home to browse our full digital menu and place home delivery orders directly on your mobile!
              </p>

              <div className="p-4 bg-white rounded-[2rem] border border-slate-100 shadow-inner flex items-center justify-center">
                {deliveryQrUrl ? (
                  <QRCodeSVG
                    id="delivery-qr-svg"
                    value={deliveryQrUrl}
                    size={160}
                    level="H"
                  />
                ) : (
                  <div className="w-40 h-40 flex items-center justify-center">
                    <RefreshCcw className="animate-spin text-indigo-500" />
                  </div>
                )}
              </div>

              <div className="space-y-1 text-center">
                <h3 className="text-sm font-extrabold uppercase tracking-[0.15em] text-indigo-600 dark:text-indigo-400">
                  SCAN TO ORDER
                </h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Fresh Food · Super Fast Delivery
                </p>
              </div>

              <Button
                onClick={downloadPoster}
                className="w-full rounded-2xl h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg active:scale-95"
              >
                <Download size={16} />
                Download Flyer Card
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
