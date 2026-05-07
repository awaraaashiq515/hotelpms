'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Printer, RefreshCcw, ChevronRight } from 'lucide-react';

export const BusinessProfileForm = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingSimple, setTestingSimple] = useState(false);
  const [property, setProperty] = useState<any>(null);
  
  const [displayName, setDisplayName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [thermalPrinterName, setThermalPrinterName] = useState('MPT-II');
  const [enableDirectPrinting, setEnableDirectPrinting] = useState(true);
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [showManualPrinter, setShowManualPrinter] = useState(false);

  useEffect(() => {
    fetch('/api/setup/properties/current')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const prop = data.data;
          setProperty(prop);
          setDisplayName(prop.name || '');
          setAddress(prop.address || '');
          setPhone(prop.phone || '');
          setGstNumber(prop.taxDetails || '');
          setThermalPrinterName(prop.thermalPrinterName || 'MPT-II');
          setEnableDirectPrinting(prop.enableDirectPrinting ?? true);
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
        body: JSON.stringify({
          name: displayName,
          address,
          phone,
          taxDetails: gstNumber,
          thermalPrinterName,
          enableDirectPrinting,
          logoUrl: property.logoUrl // Keep existing logo
        })
      });
      if (res.ok) alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = async () => {
    setTesting(true);
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTest: true, property })
      });
      const data = await res.json();
      if (data.success) {
        alert('Test print sent!');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      alert(`Test print failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleTestPrintSimple = async () => {
    setTestingSimple(true);
    try {
      const res = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTest: true, property })
      });
      const data = await res.json();
      if (data.success) {
        alert('Simple test print sent!');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      alert(`Simple test print failed: ${err.message}`);
    } finally {
      setTestingSimple(false);
    }
  };

  const handleFetchPrinters = async () => {
    setLoadingPrinters(true);
    try {
      const { printerService } = await import('@/lib/printer-service');
      const list = await printerService.findPrinters();
      const printerArray = Array.isArray(list) ? list : [list];
      setAvailablePrinters(printerArray);
      if (printerArray.length > 0 && !printerArray.includes(thermalPrinterName)) {
        // Optional: don't auto-set if already set to something valid
      }
    } catch (err) {
      console.error('Failed to fetch printers', err);
    } finally {
      setLoadingPrinters(false);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-gray-400 font-black uppercase tracking-widest">Loading Profile...</div>;

  return (
    <Card className="p-5 lg:p-8 border-t-4 border-t-pos-primary shadow-2xl shadow-gray-100">
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
        <div className="w-12 h-12 bg-pos-primary/10 text-pos-primary rounded-2xl flex items-center justify-center">
          <Printer size={24} />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-widest">Bill Header Details</h2>
          <p className="text-[10px] text-gray-400 dark:text-slate-400 font-bold uppercase mt-0.5 tracking-tighter">This info appears on your printed bills & invoices</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Restaurant / Display Name</label>
          <input 
            type="text" 
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-black text-sm dark:text-white uppercase tracking-tight transition-all"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Physical Address</label>
          <textarea 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-bold text-sm dark:text-white tracking-tight transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Contact Number</label>
          <input 
            type="text" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-bold text-sm dark:text-white transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">GSTIN / TAX No</label>
          <input 
            type="text" 
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-pos-primary/10 focus:border-pos-primary bg-gray-50/30 dark:bg-slate-800/50 font-black text-sm dark:text-white transition-all"
          />
        </div>

        <div className="sm:col-span-2 border-t border-gray-100 pt-6 mt-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Printer size={20} />
            </div>
            <div>
              <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-widest">Thermal Printer (QZ Tray)</h3>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Direct ESC/POS Printing Settings</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-400 uppercase tracking-widest mb-2">Printer Selection (Bluetooth/USB)</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    {availablePrinters.length > 0 && !showManualPrinter ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value === 'MANUAL') {
                            setShowManualPrinter(true);
                          } else {
                            setThermalPrinterName(e.target.value);
                          }
                        }}
                        value={availablePrinters.includes(thermalPrinterName) ? thermalPrinterName : 'MANUAL'}
                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white dark:bg-slate-800 font-black text-sm dark:text-white transition-all appearance-none"
                      >
                        <option value="">Select Discovered Printer</option>
                        {availablePrinters.map(p => <option key={p} value={p}>{p}</option>)}
                        <option value="MANUAL" className="text-indigo-600 font-black">--- ENTER MANUALLY ---</option>
                      </select>
                    ) : (
                      <div className="relative">
                        <input 
                          type="text" 
                          value={thermalPrinterName}
                          onChange={(e) => setThermalPrinterName(e.target.value)}
                          placeholder="Enter Printer Name (e.g. MPT-II)"
                          autoFocus={showManualPrinter}
                          className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 bg-white dark:bg-slate-800 font-black text-sm dark:text-white transition-all"
                        />
                        {availablePrinters.length > 0 && (
                          <button 
                            onClick={() => setShowManualPrinter(false)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-600 uppercase hover:underline"
                          >
                            Back to List
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleFetchPrinters}
                    disabled={loadingPrinters}
                    className="p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-100 text-indigo-600 transition-all"
                    title="Refresh Printer List"
                  >
                    <RefreshCcw size={20} className={loadingPrinters ? 'animate-spin' : ''} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-3 mt-3">
                  <button 
                    onClick={handleTestPrint}
                    disabled={testing}
                    className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 px-3 py-1.5 rounded-lg tracking-widest flex items-center gap-1 active:scale-95 transition-all"
                  >
                    {testing ? 'Sending...' : '➜ Test ESC/POS (Normal)'}
                  </button>
                  <button 
                    onClick={handleTestPrintSimple}
                    disabled={testingSimple}
                    className="text-[9px] font-black uppercase text-teal-600 hover:text-teal-800 bg-teal-50/50 px-3 py-1.5 rounded-lg tracking-widest flex items-center gap-1 active:scale-95 transition-all"
                  >
                    {testingSimple ? 'Sending...' : '➜ Test Plain Text'}
                  </button>
                </div>
             </div>
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => setEnableDirectPrinting(!enableDirectPrinting)}
                  className={`w-14 h-8 rounded-full transition-all relative ${enableDirectPrinting ? 'bg-indigo-600' : 'bg-gray-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${enableDirectPrinting ? 'left-7' : 'left-1 shadow-sm'}`} />
                </button>
                <div>
                   <p className="text-[10px] font-black text-gray-700 dark:text-slate-200 uppercase tracking-widest">Enable Direct Print</p>
                   <p className="text-[8px] text-gray-400 font-bold uppercase">Skip browser dialog</p>
                </div>
             </div>
          </div>
        </div>

        <div className="sm:col-span-2 pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full bg-pos-primary hover:bg-red-700 text-white font-black tracking-widest py-5 rounded-2xl shadow-xl shadow-red-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            {saving ? 'UPDATING PRINT SETTINGS...' : 'SAVE PRINT CONFIGURATION'}
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </Card>
  );
};
