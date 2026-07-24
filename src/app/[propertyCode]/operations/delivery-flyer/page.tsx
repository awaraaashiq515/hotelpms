"use client";

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, RefreshCcw, Home, Sparkles, Navigation, Globe, Phone, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter, useParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';

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

export default function DeliveryFlyerPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';
  
  const [table, setTable] = useState<Table | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');

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
      ctx.fillText('POWERED BY GUESTFLOW', width / 2, 1050);

      // Trigger download
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `Home_Delivery_Flyer_${propName.replace(/\s+/g, '_')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

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
      let homeDeliveryTable = activeTables.find((t: any) => t.name.toLowerCase() === 'home delivery');
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
            homeDeliveryTable = refreshData.data.find((t: any) => t.name.toLowerCase() === 'home delivery');
          }
        }
      }

      if (homeDeliveryTable) setTable(homeDeliveryTable);
      if (propData.success && propData.data.length > 0) {
        const slugifyInline = (str: string) => str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
        const activeProp = propData.data.find((p: any) => 
          p.code === propertyCode || 
          slugifyInline(p.name) === propertyCode || 
          p.id === propertyCode
        );
        setProperty(activeProp || propData.data[0]);
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <RefreshCcw className="animate-spin text-pos-primary" />
      </div>
    );
  }

  const qrUrl = property
    ? `${origin}/menu/${property.code}/delivery`
    : '';

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }

          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
          }

          body > *:not(#print-poster-root) {
            display: none !important;
          }

          #print-poster-root {
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

      {/* Screen Layout */}
      <div className="p-6 space-y-6 min-h-screen bg-gray-50 dark:bg-slate-950 no-print">
        <PageHeader
          title="Home Delivery QR"
          subtitle="Generate and print your storefront home ordering flyer"
          showBack
          backUrl={`${p}/operations`}
          actions={
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={downloadPoster}
                disabled={!qrUrl}
                className="rounded-2xl h-12 px-6 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white font-black uppercase text-xs tracking-widest gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Download size={18} />
                Download Flyer
              </Button>
              <Button
                onClick={handlePrint}
                disabled={!qrUrl}
                className="rounded-2xl h-12 px-8 bg-indigo-600 hover:bg-indigo-500 font-black uppercase text-xs tracking-widest gap-2 text-white shadow-lg active:scale-95"
              >
                <Printer size={18} />
                Print Poster Flyer
              </Button>
            </div>
          }
        />

        {/* Live Presentation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Information Guidelines */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-gray-150 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Home size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-850 dark:text-white uppercase tracking-tight">Order from Home System</h3>
                  <p className="text-xs text-slate-400 font-semibold">Enable your customers to order direct delivery from their couch</p>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">How to Launch the Flyer</h4>
                <ul className="space-y-3.5 text-xs text-slate-650 dark:text-slate-300 font-medium">
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[10px]">1</span>
                    <span>Click the <strong>"Print Poster Flyer"</strong> button in the top right to download or print your gorgeous poster.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[10px]">2</span>
                    <span>Display the flyer on your main doors, marketing posters, table displays, or social media pages.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[10px]">3</span>
                    <span>Guests scan the QR code to access your storefront, type their delivery address/phone, and submit direct orders.</span>
                  </li>
                </ul>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Globe size={16} className="text-indigo-500 mx-auto mb-1.5" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Storefront</p>
                  <p className="text-[10px] font-bold text-slate-800 dark:text-white mt-0.5">100% Online</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Phone size={16} className="text-emerald-500 mx-auto mb-1.5" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Guest Checkout</p>
                  <p className="text-[10px] font-bold text-slate-800 dark:text-white mt-0.5">No App Required</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <Navigation size={16} className="text-indigo-500 mx-auto mb-1.5" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Beacons</p>
                  <p className="text-[10px] font-bold text-slate-800 dark:text-white mt-0.5">Simulated Path</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Screen Preview */}
          <div className="lg:col-span-2 flex justify-center">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl max-w-sm w-full text-slate-900 dark:text-slate-150 flex flex-col items-center gap-6 relative overflow-hidden transition-all hover:scale-[1.01]">
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
                {qrUrl ? (
                  <QRCodeSVG
                    id="delivery-qr-svg"
                    value={qrUrl}
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
            </div>
          </div>
        </div>
      </div>

      {/* Printable Poster Flyer (Hidden on screen, visible on print only) */}
      {qrUrl && (
        <div id="print-poster-root" className="hidden">
          <div className="poster-print-card">
            <div className="poster-frame">
              <div className="space-y-2">
                <span style={{
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  padding: '6px 20px',
                  borderRadius: '99px',
                  fontSize: '14px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  border: '1px solid #c7d2fe',
                  display: 'inline-block'
                }}>
                  Home Delivery Available
                </span>
                <h1 style={{
                  fontSize: '44px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  color: '#000000',
                  marginTop: '15px',
                  letterSpacing: '-1px'
                }}>
                  {property?.name || 'Our Kitchen'}
                </h1>
              </div>

              <p style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#475569',
                maxWidth: '420px',
                lineHeight: '1.6'
              }}>
                Scan this QR code from home to browse our full digital menu and place home delivery orders directly on your mobile!
              </p>

              <div style={{
                padding: '24px',
                background: '#ffffff',
                borderRadius: '32px',
                border: '2px solid #f1f5f9',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                margin: '20px 0'
              }}>
                <QRCodeSVG
                  value={qrUrl}
                  size={280}
                  level="H"
                />
              </div>

              <div>
                <h2 style={{
                  fontSize: '24px',
                  fontWeight: '900',
                  color: '#4f46e5',
                  letterSpacing: '4px',
                  textTransform: 'uppercase'
                }}>
                  SCAN TO ORDER
                </h2>
                <p style={{
                  fontSize: '11px',
                  fontWeight: '800',
                  color: '#94a3b8',
                  letterSpacing: '6px',
                  textTransform: 'uppercase',
                  marginTop: '6px'
                }}>
                  Fresh Food · Super Fast Delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
