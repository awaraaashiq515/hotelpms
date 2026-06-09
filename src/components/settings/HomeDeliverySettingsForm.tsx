'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Truck, QrCode, Copy, Check, Download, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const HomeDeliverySettingsForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [showDeliveryInQrMenu, setShowDeliveryInQrMenu] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setProperty(data.data);
          setDeliveryEnabled(!!data.data.deliveryEnabled);
          setShowDeliveryInQrMenu(data.data.showDeliveryInQrMenu ?? true);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!property) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/setup/properties/${property.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryEnabled, showDeliveryInQrMenu }),
      });
      if (res.ok) {
        alert(
          deliveryEnabled
            ? '🏠 Home Delivery Enabled! Customers can now place orders online.'
            : '🔴 Home Delivery Disabled.'
        );
      } else {
        alert('Failed to save.');
      }
    } catch {
      alert('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const getDeliveryLink = () => {
    if (typeof window === 'undefined' || !property?.code) return '';
    return `${window.location.origin}/menu/${property.code}/delivery`;
  };

  const handleCopyLink = () => {
    const link = getDeliveryLink();
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const svg = document.getElementById('delivery-qr-svg');
    if (!svg || !property) return;
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 40; // padding
        canvas.height = img.height + 40; // padding
        if (ctx) {
          // Draw white background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Draw QR
          ctx.drawImage(img, 20, 20);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `${property.code}-delivery-qr.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (e) {
      console.error('Error downloading QR code:', e);
      alert('Failed to download QR code. Please try copy-pasting the link instead.');
    }
  };

  if (loading) {
    return (
      <Card className="p-12 border-l-[6px] border-l-indigo-500 flex flex-col items-center justify-center min-h-[300px]">
        <Truck className="text-indigo-500 animate-bounce mb-4" size={32} />
        <div className="text-[10px] text-gray-400 dark:text-slate-400 font-black uppercase tracking-widest animate-pulse">
          Loading Delivery Settings...
        </div>
      </Card>
    );
  }

  const deliveryLink = getDeliveryLink();

  return (
    <div className="space-y-8 max-w-5xl">
      <Card className="p-5 lg:p-6 border-l-[6px] border-l-indigo-500 dark:bg-slate-900 dark:border-slate-800 relative overflow-hidden transition-all duration-300 shadow-xl">
        {/* Absolute Decorative Glow */}
        <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">
                Home Delivery Module
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase mt-1 tracking-tight leading-normal">
                Enable customers to order directly from home using their phones
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Toggles Container */}
            <div className="lg:col-span-7 space-y-4">
              {/* Main Toggle Card */}
              <div
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  deliveryEnabled
                    ? 'border-indigo-500/20 bg-indigo-500/[0.02] dark:border-indigo-500/20 dark:bg-indigo-500/5'
                    : 'border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-800/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      deliveryEnabled
                        ? 'bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                    }`}
                  >
                    <Truck size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wide">
                      Home Delivery Access
                    </p>
                    <p
                      className={`text-[9px] font-bold tracking-wider mt-0.5 uppercase ${
                        deliveryEnabled
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-400 dark:text-slate-500'
                      }`}
                    >
                      {deliveryEnabled
                        ? '🟢 ENABLED — Customers can place online orders'
                        : '🔴 DISABLED — Home delivery ordering is closed'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setDeliveryEnabled(!deliveryEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none ${
                    deliveryEnabled ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
                      deliveryEnabled ? 'left-[23px]' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* QR Menu Control Card */}
              <div
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  showDeliveryInQrMenu
                    ? 'border-violet-500/10 bg-violet-500/[0.01] dark:border-violet-500/20 dark:bg-violet-950/5'
                    : 'border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-800/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                      showDeliveryInQrMenu
                        ? 'bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500'
                    }`}
                  >
                    <QrCode size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wide">
                      Show Home Delivery in QR Menu
                    </p>
                    <p
                      className={`text-[9px] font-bold tracking-wider mt-0.5 uppercase ${
                        showDeliveryInQrMenu
                          ? 'text-violet-600 dark:text-violet-400'
                          : 'text-gray-400 dark:text-slate-500'
                      }`}
                    >
                      {showDeliveryInQrMenu
                        ? '🟢 SHOWN — QR Menu links to Home Delivery'
                        : '🔴 HIDDEN — Home Delivery link is hidden in Dine-in QR Menu'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowDeliveryInQrMenu(!showDeliveryInQrMenu)}
                  className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 focus:outline-none ${
                    showDeliveryInQrMenu ? 'bg-violet-500' : 'bg-gray-200 dark:bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
                      showDeliveryInQrMenu ? 'left-[23px]' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Info Box */}
              <div
                className={`p-4 rounded-xl border transition-colors duration-300 ${
                  deliveryEnabled
                    ? 'border-indigo-500/10 bg-indigo-500/[0.01] dark:border-indigo-500/10 dark:bg-indigo-950/5'
                    : 'border-gray-100 dark:border-slate-800 bg-gray-50/20 dark:bg-slate-900/40'
                }`}
              >
                <p
                  className={`text-[9px] font-black uppercase tracking-widest ${
                    deliveryEnabled ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-slate-500'
                  }`}
                >
                  Home Delivery Setup Info:
                </p>
                <div
                  className={`mt-2 space-y-1.5 text-[9px] font-bold uppercase tracking-tight ${
                    deliveryEnabled ? 'text-gray-600 dark:text-slate-300' : 'text-gray-400 dark:text-slate-500'
                  }`}
                >
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-500 flex-shrink-0">✓</span>
                    <span>
                      Customers order from home via phone. Orders appear automatically under POS billing page as 🏠 Home Delivery orders.
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-500 flex-shrink-0">✓</span>
                    <span>
                      Kitchen Order Ticket (KOT) is instantly generated on thermal kitchen printers labeled "Delivery".
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={saving}
                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-md ${
                  deliveryEnabled
                    ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/10'
                    : 'bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white'
                }`}
              >
                <Truck size={16} />
                {saving
                  ? 'SAVING...'
                  : deliveryEnabled
                  ? 'SAVE — ENABLE HOME DELIVERY'
                  : 'SAVE — KEEP HOME DELIVERY DISABLED'}
              </Button>
            </div>

            {/* QR Column */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/20 rounded-[2.5rem] p-6 text-center space-y-5 border-2 border-indigo-100 dark:border-indigo-900/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />

                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">
                  Home Delivery QR & Link
                </p>

                {deliveryLink ? (
                  <>
                    <div className="bg-white p-5 rounded-[2rem] inline-block shadow-2xl border-[6px] border-indigo-500/10">
                      <QRCodeSVG
                        id="delivery-qr-svg"
                        value={deliveryLink}
                        size={180}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-800 rounded-full border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            deliveryEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                          }`}
                        />
                        <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 tracking-wider">
                          {deliveryEnabled ? 'ONLINE ORDERING ACTIVE' : 'ORDERING OFFLINE'}
                        </p>
                      </div>

                      <div className="bg-white dark:bg-slate-800 rounded-xl p-2.5 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between gap-2">
                        <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200 truncate select-all flex-1 text-left">
                          {deliveryLink}
                        </p>
                        <a
                          href={deliveryLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-500 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={handleCopyLink}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 shadow-sm transition-all"
                        >
                          {copied ? (
                            <>
                              <Check size={12} className="text-emerald-500" /> Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={12} /> Copy Link
                            </>
                          )}
                        </button>

                        <button
                          onClick={downloadQR}
                          className="flex items-center justify-center gap-1.5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm transition-all"
                        >
                          <Download size={12} /> Save QR
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center space-y-4">
                    <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-400 animate-pulse">
                      <QrCode size={40} />
                    </div>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                      Waiting for Property Code
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
