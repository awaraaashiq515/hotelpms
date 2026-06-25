'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PrinterModal } from '@/components/settings/PrinterModal';
import { toast } from 'sonner';
import { printerService } from '@/lib/printer-service';
import {
  Printer as PrinterIcon, Plus, Trash2, Edit2, CheckCircle2, XCircle,
  PrinterCheck, ArrowLeft, Wifi, Usb, Bluetooth, Scan, RefreshCw,
  Loader2, AlertTriangle, Check, Zap, Settings, Search, Network, Info
} from 'lucide-react';

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

interface DetectedPort {
  path: string;
  friendlyName?: string;
  manufacturer?: string;
  serialNumber?: string;
  vendorId?: string;
  productId?: string;
}

const cleanDeviceName = (path: string, friendlyName?: string): string => {
  if (friendlyName && friendlyName !== path) return friendlyName;
  let name = path;
  if (name.startsWith('/dev/tty.')) {
    name = name.slice(9);
  } else if (name.startsWith('/dev/cu.')) {
    name = name.slice(8);
  } else if (name.startsWith('/dev/')) {
    name = name.slice(5);
  }
  return name.replace(/_/g, ' ');
};

export default function PrinterSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyCode = params?.propertyCode as string | undefined;
  const p = propertyCode ? `/${propertyCode}` : '';

  const [session, setSession] = useState<any>(null);
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);

  // Auto-detect states
  const [detectingPorts, setDetectingPorts] = useState(false);
  const [detectedPorts, setDetectedPorts] = useState<DetectedPort[]>([]);
  const [detectedSystemPrinters, setDetectedSystemPrinters] = useState<any[]>([]);
  const [scanningNetwork, setScanningNetwork] = useState(false);
  const [networkIp, setNetworkIp] = useState('192.168.1.');
  const [showDetectPanel, setShowDetectPanel] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Direct Printing toggle states
  const [directPrintEnabled, setDirectPrintEnabled] = useState(true);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [updatingProperty, setUpdatingProperty] = useState(false);

  const bluetoothPorts = detectedPorts.filter(port => /bt|bluetooth|mpt|blth|rfcomm/i.test(port.path || ''));
  const usbPorts = detectedPorts.filter(port => !/bt|bluetooth|mpt|blth|rfcomm/i.test(port.path || ''));

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => { if (d.authenticated) setSession(d.user); });

    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setDirectPrintEnabled(data.data.enableDirectPrinting);
          setPropertyId(data.data.id);
        }
      });
  }, []);

  const toggleDirectPrinting = async () => {
    if (!propertyId) return;
    setUpdatingProperty(true);
    const newValue = !directPrintEnabled;
    try {
      const res = await fetch(`/api/setup/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enableDirectPrinting: newValue }),
      });
      if (res.ok) {
        setDirectPrintEnabled(newValue);
        toast.success(newValue ? 'Direct silent server printing enabled' : 'Switched to browser print dialog');
      } else {
        toast.error('Failed to update print settings');
      }
    } catch {
      toast.error('Error updating print settings');
    } finally {
      setUpdatingProperty(false);
    }
  };

  const fetchPrinters = useCallback(async () => {
    if (!session?.propertyId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/settings/printers?propertyId=${session.propertyId}`);
      if (!res.ok) throw new Error('Failed to fetch printers');
      const data = await res.json();
      setPrinters(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [session?.propertyId]);

  useEffect(() => { if (session) fetchPrinters(); }, [fetchPrinters, session]);

  // ── Auto-detect USB/Serial Ports & OS Printers ────────────────────────────
  const handleDetectPorts = async () => {
    setDetectingPorts(true);
    setDetectedPorts([]);
    setDetectedSystemPrinters([]);
    
    let localPrinters: any[] = [];
    try {
      const qzPrinters = await printerService.findPrinters();
      if (Array.isArray(qzPrinters)) {
        localPrinters = qzPrinters.map(name => ({
          name,
          portName: 'QZ Tray',
          status: 'IDLE'
        }));
      }
    } catch (e) {
      console.log('QZ Tray not connected or active:', e);
    }

    try {
      const res = await fetch('/api/settings/printers/detect');
      const data = await res.json();
      if (data.success) {
        setDetectedPorts(data.serialPorts || []);
        
        const serverPrinters = data.systemPrinters || [];
        const mergedPrinters = [...localPrinters];
        serverPrinters.forEach((sp: any) => {
          if (!mergedPrinters.some(p => p.name.toLowerCase() === sp.name.toLowerCase())) {
            mergedPrinters.push(sp);
          }
        });
        
        setDetectedSystemPrinters(mergedPrinters);
        
        const total = (data.serialPorts?.length || 0) + mergedPrinters.length;
        if (total === 0) {
          toast.info('No printers or ports detected. Make sure QZ Tray is running or printers are connected.');
        } else {
          toast.success(`Found ${data.serialPorts?.length || 0} USB/Serial port(s) and ${mergedPrinters.length} OS printer(s)!`);
        }
      } else {
        if (localPrinters.length > 0) {
          setDetectedSystemPrinters(localPrinters);
          toast.success(`Found ${localPrinters.length} local printer(s) via QZ Tray!`);
        } else {
          toast.error(data.error || 'Detection failed');
        }
      }
    } catch {
      if (localPrinters.length > 0) {
        setDetectedSystemPrinters(localPrinters);
        toast.success(`Found ${localPrinters.length} local printer(s) via QZ Tray!`);
      } else {
        toast.error('Could not scan ports. Check server connection.');
      }
    } finally {
      setDetectingPorts(false);
    }
  };

  // ── Quick-add detected printer ────────────────────────────────────────────
  const handleQuickAddPort = (port: DetectedPort) => {
    const isBluetooth = /bt|bluetooth|mpt|blth|rfcomm/i.test(port.path || '');
    const cleanName = cleanDeviceName(port.path, port.friendlyName);
    const prefilled = {
      name: cleanName,
      connectionType: isBluetooth ? 'BLUETOOTH' : 'USB',
      ipAddress: port.path,
      port: 9100,
      printerType: 'THERMAL',
      paperSize: '80mm',
      isBilling: printers.filter(p => p.isBilling).length === 0,
      isKitchen: false,
      isEnabled: true,
      autoCut: true,
      fontSize: 12,
      margin: 0,
      padding: 0,
    } as any;
    setSelectedPrinter(prefilled);
    setIsModalOpen(true);
  };

  const handleQuickAddSystemPrinter = (prn: any) => {
    const prefilled = {
      name: prn.name,
      connectionType: 'SYSTEM',
      ipAddress: prn.portName || prn.name,
      port: 9100,
      printerType: 'THERMAL',
      paperSize: '80mm',
      isBilling: printers.filter(p => p.isBilling).length === 0,
      isKitchen: false,
      isEnabled: true,
      autoCut: true,
      fontSize: 12,
      margin: 0,
      padding: 0,
    } as any;
    setSelectedPrinter(prefilled);
    setIsModalOpen(true);
  };

  const handleTestPrint = async (printer: Printer) => {
    setTestingId(printer.id);
    try {
      const isLocalConn = ['SYSTEM', 'USB', 'BLUETOOTH'].includes(printer.connectionType);
      
      if (isLocalConn) {
        const nameToUse = printer.ipAddress || printer.name;
        await printerService.testPrint(nameToUse);
        toast.success(`✅ Test page sent to ${nameToUse} via QZ Tray!`);
      } else {
        const res = await fetch('/api/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isTest: true,
            printerId: printer.id,
            property: {
              name: session?.fullName || session?.name,
              id: session?.propertyId,
              thermalPrinterName: printer.ipAddress || printer.name
            }
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || data.error || 'Test print failed');
        }
        toast.success('✅ Test page sent to printer!');
      }
    } catch (e: any) {
      toast.error(`❌ Print Error: ${e.message}`);
    } finally {
      setTestingId(null);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this printer?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/settings/printers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('Printer removed');
      fetchPrinters();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingId(null);
    }
  };

  const connectionIcon = (type: string) => {
    if (type === 'USB') return <Usb size={14} />;
    if (type === 'BLUETOOTH') return <Bluetooth size={14} />;
    if (type === 'SYSTEM') return <Settings size={14} />;
    return <Wifi size={14} />;
  };

  const connectionColor = (type: string) => {
    if (type === 'USB') return 'bg-orange-50 text-orange-600 border-orange-100';
    if (type === 'BLUETOOTH') return 'bg-blue-50 text-blue-600 border-blue-100';
    if (type === 'SYSTEM') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    return 'bg-indigo-50 text-indigo-600 border-indigo-100';
  };

  return (
    <div className="min-h-screen pb-20 font-sans">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push(`${p}/settings`)}
          className="p-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white active:scale-95"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase flex items-center gap-2">
            <PrinterIcon size={22} className="text-gray-400" /> Printer Management
          </h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
            Configure thermal & kitchen printers
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            onClick={() => { setShowDetectPanel(v => !v); }}
            variant="secondary"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border"
          >
            <Scan size={14} /> Auto Detect
          </Button>
          <Button
            onClick={() => { setSelectedPrinter(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg"
          >
            <Plus size={14} /> Add Printer
          </Button>
        </div>
      </div>

      {/* ── Direct Printing Switch ─────────────────────────────────────── */}
      <div className="mb-6 p-5 bg-white dark:bg-slate-900 rounded-[28px] border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${directPrintEnabled ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
            <Zap size={18} />
          </div>
          <div>
            <p className="font-black text-sm uppercase text-slate-800 dark:text-white">Direct Server Printing</p>
            <p className="text-[10px] text-slate-400 font-bold">Print silently from the POS server. Disable this to open browser print dialog (re-enables standard Bluetooth/WiFi printer selector popup).</p>
          </div>
        </div>
        <button
          onClick={toggleDirectPrinting}
          disabled={updatingProperty}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${directPrintEnabled ? 'bg-indigo-650' : 'bg-gray-250 dark:bg-slate-800'}`}
        >
          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${directPrintEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>

      {/* ── Auto Detect Panel ───────────────────────────────────────────── */}
      {showDetectPanel && (
        <div className="mb-8 bg-white dark:bg-slate-900 rounded-[28px] border border-indigo-100 dark:border-indigo-900/30 shadow-sm overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-900/10 dark:to-violet-900/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Zap size={20} />
              </div>
              <div>
                <h2 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Auto Printer Detection</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Find USB/Serial printers connected to this computer</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Devices Scanner */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500"><Scan size={18} /></div>
                  <div>
                    <p className="font-black text-sm uppercase text-slate-800 dark:text-white">Auto Scan All Devices</p>
                    <p className="text-[10px] text-slate-400 font-bold">Scans system-installed printers and raw COM serial ports</p>
                  </div>
                </div>
                <Button
                  onClick={handleDetectPorts}
                  loading={detectingPorts}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md"
                >
                  {detectingPorts ? 'Scanning...' : 'Scan Devices'}
                </Button>
              </div>

              {/* OS Installed Printers */}
              {detectedSystemPrinters.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                    <CheckCircle2 size={12} /> OS Installed Printers ({detectedSystemPrinters.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {detectedSystemPrinters.map((prn) => (
                      <div key={prn.name} className="flex items-center justify-between p-4 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/55 dark:border-emerald-900/30 rounded-2xl group">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-500 shrink-0"><PrinterIcon size={14} /></div>
                          <div className="min-w-0">
                            <p className="font-black text-xs uppercase text-slate-800 dark:text-white truncate">{prn.name}</p>
                            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-tight">
                              Port: {prn.portName || 'Local'} • Status: {prn.status}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleQuickAddSystemPrinter(prn)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shrink-0 animate-in fade-in"
                        >
                          + Quick Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bluetooth Ports */}
              {bluetoothPorts.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-1.5">
                    <Bluetooth size={12} /> Detected Bluetooth Printers ({bluetoothPorts.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {bluetoothPorts.map((port) => (
                      <div key={port.path} className="flex items-center justify-between p-4 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/55 dark:border-blue-900/30 rounded-2xl group animate-in fade-in">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                            <Bluetooth size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-xs uppercase text-slate-800 dark:text-white truncate">
                              {cleanDeviceName(port.path, port.friendlyName)}
                            </p>
                            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-tight truncate">
                              Port: {port.path} {port.manufacturer ? `• ${port.manufacturer}` : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleQuickAddPort(port)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shrink-0"
                        >
                          + Quick Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* USB / Serial Ports */}
              {usbPorts.length > 0 && (
                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-1.5">
                    <Usb size={12} /> USB / Serial Ports ({usbPorts.length})
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {usbPorts.map((port) => (
                      <div key={port.path} className="flex items-center justify-between p-4 bg-orange-50/30 dark:bg-orange-950/10 border border-orange-100/55 dark:border-orange-900/30 rounded-2xl group animate-in fade-in">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                            <Usb size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-xs uppercase text-slate-800 dark:text-white truncate">
                              {cleanDeviceName(port.path, port.friendlyName)}
                            </p>
                            <p className="text-[9px] text-slate-450 font-bold uppercase tracking-tight truncate">
                              Port: {port.path} {port.manufacturer ? `• ${port.manufacturer}` : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleQuickAddPort(port)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all shrink-0"
                        >
                          + Quick Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!detectingPorts && detectedPorts.length === 0 && detectedSystemPrinters.length === 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-3 text-slate-400">
                  <Info size={16} />
                  <p className="text-[11px] font-bold">Click "Scan Devices" to auto-detect system-installed printers and USB ports.</p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
              {/* Network Printer Setup Guide */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-500"><Network size={18} /></div>
                <div>
                  <p className="font-black text-sm uppercase text-slate-800 dark:text-white">Network Printer (IP)</p>
                  <p className="text-[10px] text-slate-400 font-bold">For WiFi / LAN printers — enter IP manually</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { step: '1', label: 'Printer Menu → Network → TCP/IP', desc: 'Find the IP address on printer screen' },
                  { step: '2', label: 'Enter IP in "Add Printer" form', desc: 'Use default port 9100 for ESC/POS' },
                  { step: '3', label: 'Click "Test Print" to verify', desc: 'A test page will print if connected' },
                ].map((item) => (
                  <div key={item.step} className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                    <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xs font-black mb-2">{item.step}</div>
                    <p className="font-black text-[11px] uppercase text-slate-800 dark:text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => { setShowDetectPanel(false); setSelectedPrinter(null); setIsModalOpen(true); }}
                variant="secondary"
                className="mt-4 w-full py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border"
              >
                <Plus size={13} className="mr-1.5" /> Add Network Printer Manually
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Setup Guide (when no printers) ──────────────────────── */}
      {!loading && printers.length === 0 && (
        <div className="mb-8 p-8 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 rounded-[28px] border border-indigo-100 dark:border-indigo-900/30">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="w-16 h-16 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white mb-5 shadow-xl shadow-indigo-200">
                <PrinterIcon size={30} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800 dark:text-white mb-2">
                No Printers Connected
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Add a thermal printer to start printing bills and kitchen orders. Supports USB, Network (IP), and Bluetooth printers.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => { setShowDetectPanel(true); handleDetectPorts(); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg"
                >
                  <Scan size={14} className="mr-1.5" /> Auto Detect USB Printer
                </Button>
                <Button
                  onClick={() => { setSelectedPrinter(null); setIsModalOpen(true); }}
                  variant="secondary"
                  className="px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border"
                >
                  <Plus size={14} className="mr-1.5" /> Add Manually
                </Button>
              </div>
            </div>
            <div className="w-full md:w-64 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Supported Connections</p>
              {[
                { icon: Wifi, label: 'Network / WiFi', desc: 'IP Address + Port 9100', color: 'text-indigo-500 bg-indigo-50' },
                { icon: Usb, label: 'USB / Serial', desc: 'COM port auto-detected', color: 'text-orange-500 bg-orange-50' },
                { icon: Bluetooth, label: 'Bluetooth', desc: 'Paired BT printers', color: 'text-blue-500 bg-blue-50' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.color} dark:bg-opacity-20`}><item.icon size={16} /></div>
                  <div>
                    <p className="font-black text-xs uppercase text-slate-800 dark:text-white">{item.label}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Printer Cards ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-52 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : printers.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{printers.length} Printer{printers.length > 1 ? 's' : ''} Configured</p>
            <Button onClick={fetchPrinters} variant="secondary" className="p-2.5 rounded-xl border">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {printers.map((printer) => (
              <div
                key={printer.id}
                className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all group overflow-hidden"
              >
                {/* Card Top Color Bar */}
                <div className={`h-1.5 w-full ${printer.isEnabled ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-slate-200 dark:bg-slate-700'}`} />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${printer.isEnabled ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        <PrinterIcon size={22} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">{printer.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${connectionColor(printer.connectionType)}`}>
                            {connectionIcon(printer.connectionType)} {printer.connectionType}
                          </span>
                          <span className={`w-2 h-2 rounded-full ${printer.isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => { setSelectedPrinter(printer); setIsModalOpen(true); }}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(printer.id)}
                        disabled={deletingId === printer.id}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                      >
                        {deletingId === printer.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Connection</p>
                      <p className="font-black text-xs text-slate-800 dark:text-white truncate">
                        {printer.ipAddress || 'Not set'}
                        {printer.port && printer.connectionType === 'NETWORK' && <span className="text-slate-400"> :{printer.port}</span>}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Paper</p>
                      <p className="font-black text-xs text-slate-800 dark:text-white">{printer.paperSize}</p>
                    </div>
                  </div>

                  {/* Roles */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {printer.isBilling && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-[10px] font-black uppercase">
                        <CheckCircle2 size={10} /> Billing
                      </span>
                    )}
                    {printer.isKitchen && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30 rounded-xl text-[10px] font-black uppercase">
                        <CheckCircle2 size={10} /> Kitchen / KOT
                      </span>
                    )}
                    {printer.autoCut && (
                      <span className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl text-[10px] font-black uppercase">
                        Auto-Cut
                      </span>
                    )}
                    {!printer.isBilling && !printer.isKitchen && (
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/10 text-amber-600 border border-amber-100 dark:border-amber-900/30 rounded-xl text-[10px] font-black uppercase">
                        <AlertTriangle size={10} /> No role assigned
                      </span>
                    )}
                  </div>

                  {/* Test Print Button */}
                  <button
                    onClick={() => handleTestPrint(printer)}
                    disabled={testingId === printer.id}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500 dark:text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30"
                  >
                    {testingId === printer.id
                      ? <><Loader2 size={13} className="animate-spin" /> Sending...</>
                      : <><PrinterCheck size={13} /> Test Print</>
                    }
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Card */}
            <button
              onClick={() => { setSelectedPrinter(null); setIsModalOpen(true); }}
              className="h-full min-h-[220px] bg-slate-50/50 dark:bg-slate-800/30 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 text-slate-400 rounded-2xl flex items-center justify-center transition-colors">
                <Plus size={22} />
              </div>
              <div className="text-center">
                <p className="font-black text-[11px] uppercase tracking-widest text-slate-400 group-hover:text-indigo-600 transition-colors">Add Printer</p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold">USB, Network or Bluetooth</p>
              </div>
            </button>
          </div>

          {/* Warning: No billing or kitchen printer */}
          {printers.filter(p => p.isEnabled && p.isBilling).length === 0 && (
            <div className="mt-6 p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex items-center gap-4">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 animate-bounce" />
              <div>
                <p className="font-black text-sm text-amber-800 dark:text-amber-300 uppercase">No Billing Printer Set!</p>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5">Edit a printer and enable "Billing Printer" so bills can be printed automatically.</p>
              </div>
              <Button
                onClick={() => { setSelectedPrinter(null); setIsModalOpen(true); }}
                className="ml-auto bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap shrink-0"
              >
                Fix Now
              </Button>
            </div>
          )}
        </>
      ) : null}

      {/* ── Printer Modal ─────────────────────────────────────────────── */}
      <PrinterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        printer={selectedPrinter}
        propertyId={session?.propertyId || ''}
        onSuccess={() => { fetchPrinters(); setIsModalOpen(false); }}
      />
    </div>
  );
}
