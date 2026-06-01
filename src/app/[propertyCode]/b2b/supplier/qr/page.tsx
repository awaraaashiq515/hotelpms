'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Download,
  RefreshCw,
  Copy,
  Share2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  ExternalLink,
  ShoppingBag,
  AlertTriangle,
  Printer,
  Link2,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

export default function SupplierQRPage() {
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [supplierName, setSupplierName] = useState('');
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrEnabled, setQrEnabled] = useState(true);
  const [orderUrl, setOrderUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const init = async () => {
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      if (sessionData.authenticated && sessionData.user.supplierId) {
        const sid = sessionData.user.supplierId;
        setSupplierId(sid);
        setSupplierName(sessionData.user.fullName || '');
        await loadQr(sid);
      }
      setLoading(false);
    };
    init();
  }, []);

  const loadQr = async (sid: string) => {
    // Try to generate/fetch existing token
    const res = await fetch('/api/b2b/supplier/generate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supplierId: sid, regenerate: false }),
    });
    const data = await res.json();
    if (data.success) {
      setQrToken(data.data.token);
      setOrderUrl(data.data.orderUrl);
    }

    // Get supplier info for qrEnabled state
    const supRes = await fetch('/api/b2b/products?supplierId=' + sid + '&meta=true');
    // We'll also fetch supplier details to get qrEnabled
    const infoRes = await fetch(`/api/b2b/qr/${data.data?.token}`);
    if (infoRes.ok) {
      const info = await infoRes.json();
      setQrEnabled(info.data?.qrEnabled ?? true);
    }
  };

  const handleGenerate = async () => {
    if (!supplierId) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/b2b/supplier/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, regenerate: true }),
      });
      const data = await res.json();
      if (data.success) {
        setQrToken(data.data.token);
        setOrderUrl(data.data.orderUrl);
        toast.success('New QR code generated! Old links are now invalid.');
      }
    } catch {
      toast.error('Failed to generate QR');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggle = async () => {
    if (!supplierId) return;
    setToggling(true);
    try {
      const res = await fetch('/api/b2b/supplier/generate-qr', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, qrEnabled: !qrEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        setQrEnabled(!qrEnabled);
        toast.success(`QR ordering ${!qrEnabled ? 'enabled' : 'disabled'}`);
      }
    } catch {
      toast.error('Failed to update QR status');
    } finally {
      setToggling(false);
    }
  };

  const handleCopyLink = async () => {
    if (!orderUrl) return;
    await navigator.clipboard.writeText(orderUrl);
    setCopied(true);
    toast.success('Order link copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const canvas = document.getElementById('supplier-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplier-qr-${supplierName.replace(/\s/g, '-')}.png`;
    a.click();
    toast.success('QR code downloaded!');
  };

  const handlePrint = () => {
    const canvas = document.getElementById('supplier-qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>QR Code — ${supplierName}</title>
          <style>
            body { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; background:#fff; }
            img { width:280px; height:280px; }
            h1 { font-size:24px; font-weight:900; margin-top:16px; letter-spacing:-1px; }
            p { font-size:13px; color:#64748b; margin-top:6px; }
            .url { font-size:10px; color:#94a3b8; margin-top:12px; word-break:break-all; max-width:300px; text-align:center; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" />
          <h1>${supplierName}</h1>
          <p>Scan to place an order</p>
          <div class="url">${orderUrl}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`🛒 Order from *${supplierName}* — Scan the QR or click the link:\n${orderUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="QR ORDERING"
        description="Generate your unique QR code and share it with restaurants"
        actions={
          <div className="flex items-center gap-3">
            <Badge className={qrEnabled ? 'bg-emerald-100 text-emerald-700 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest' : 'bg-rose-100 text-rose-700 border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest'}>
              {qrEnabled ? '● Active' : '● Disabled'}
            </Badge>
            {orderUrl && (
              <Button variant="outline" className="gap-2 h-10 px-4 rounded-xl text-[10px] font-black uppercase" onClick={() => window.open(orderUrl, '_blank')}>
                <ExternalLink size={14} /> Preview Page
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* QR Code Card */}
        <div className="lg:col-span-2">
          <Card className="p-8 border-slate-100 dark:border-slate-800 rounded-[40px] text-center space-y-6">
            {/* QR Display */}
            <div className="relative inline-block">
              <div className={`p-6 rounded-3xl bg-white shadow-xl inline-block transition-all ${!qrEnabled ? 'opacity-40 blur-sm' : ''}`}>
                {qrToken ? (
                  <QRCodeCanvas
                    id="supplier-qr-canvas"
                    value={orderUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                    imageSettings={{
                      src: '',
                      height: 0,
                      width: 0,
                      excavate: false,
                    }}
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center text-slate-300">
                    <QrCode size={80} />
                  </div>
                )}
              </div>

              {!qrEnabled && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                    Disabled
                  </div>
                </div>
              )}
            </div>

            {/* Supplier Name */}
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Ordering QR</p>
              <h2 className="text-lg font-black tracking-tight mt-1">{supplierName}</h2>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleDownload}
                disabled={!qrToken}
                className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white h-10 rounded-2xl text-[9px] font-black uppercase tracking-widest gap-2"
              >
                <Download size={14} /> Download
              </Button>
              <Button
                onClick={handlePrint}
                disabled={!qrToken}
                variant="outline"
                className="h-10 rounded-2xl text-[9px] font-black uppercase tracking-widest gap-2"
              >
                <Printer size={14} /> Print
              </Button>
              <Button
                onClick={handleWhatsApp}
                disabled={!qrToken}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 rounded-2xl text-[9px] font-black uppercase tracking-widest gap-2 col-span-2"
              >
                <Share2 size={14} /> Share on WhatsApp
              </Button>
            </div>
          </Card>
        </div>

        {/* Controls + Info */}
        <div className="lg:col-span-3 space-y-4">

          {/* Order Link */}
          <Card className="p-6 border-slate-100 dark:border-slate-800 rounded-[32px]">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Link2 size={14} /> Order Link
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate border border-slate-100 dark:border-slate-700">
                {orderUrl || 'Generate a QR code first...'}
              </div>
              <Button
                onClick={handleCopyLink}
                disabled={!orderUrl}
                className="h-10 px-4 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white text-[9px] font-black uppercase gap-1.5 shrink-0"
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </Card>

          {/* Toggle + Regenerate */}
          <Card className="p-6 border-slate-100 dark:border-slate-800 rounded-[32px]">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Smartphone size={14} /> QR Controls
            </h3>
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight">QR Ordering</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                    {qrEnabled ? 'Restaurants can place orders via your QR' : 'QR orders are currently blocked'}
                  </p>
                </div>
                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className="transition-transform active:scale-95"
                >
                  {qrEnabled ? (
                    <ToggleRight size={36} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={36} className="text-slate-400" />
                  )}
                </button>
              </div>

              {/* Regenerate */}
              <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight text-amber-900 dark:text-amber-300">Regenerate QR</p>
                  <p className="text-[9px] text-amber-600 font-bold mt-0.5">Old QR links will stop working</p>
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  variant="outline"
                  className="h-9 px-4 rounded-xl text-[9px] font-black uppercase gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-100"
                >
                  <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
                  {generating ? 'Generating...' : 'Regenerate'}
                </Button>
              </div>
            </div>
          </Card>

          {/* How it works */}
          <Card className="p-6 border-slate-100 dark:border-slate-800 rounded-[32px]">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <ShoppingBag size={14} /> How It Works
            </h3>
            <div className="space-y-4">
              {[
                { step: '01', title: 'Share your QR', desc: 'Download, print, or WhatsApp the QR code to your restaurant clients.', color: 'blue' },
                { step: '02', title: 'Restaurant scans', desc: 'They scan QR with their phone — no app, no login needed.', color: 'emerald' },
                { step: '03', title: 'They place order', desc: 'Browse your catalog, select products, fill their details, submit.', color: 'purple' },
                { step: '04', title: 'You receive order', desc: 'New order appears instantly in your Orders dashboard.', color: 'amber' },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-xl bg-${item.color}-50 dark:bg-${item.color}-950/30 text-${item.color}-600 flex items-center justify-center text-[9px] font-black shrink-0`}>
                    {item.step}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-tight">{item.title}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
