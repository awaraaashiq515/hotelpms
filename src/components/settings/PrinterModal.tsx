'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { printerService } from '@/lib/printer-service';

interface Printer {
  id?: string;
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
}

interface PrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  printer?: Printer | null;
  propertyId: string;
  onSuccess: () => void;
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

export const PrinterModal: React.FC<PrinterModalProps> = ({
  isOpen,
  onClose,
  printer,
  propertyId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<Printer>({
    name: '',
    connectionType: 'NETWORK',
    ipAddress: '',
    port: 9100,
    printerType: 'THERMAL',
    paperSize: '80mm',
    isBilling: false,
    isKitchen: false,
    isEnabled: true,
    autoCut: true,
    fontSize: 12,
    margin: 0,
    padding: 0,
  });

  const [loading, setLoading] = useState(false);
  const [detectedPorts, setDetectedPorts] = useState<any[]>([]);
  const [detectedSystemPrinters, setDetectedSystemPrinters] = useState<any[]>([]);
  const [detectedNetworkPrinters, setDetectedNetworkPrinters] = useState<any[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [scanningNetwork, setScanningNetwork] = useState(false);

  useEffect(() => {
    if (printer) {
      setFormData(printer);
    } else {
      setFormData({
        name: '',
        connectionType: 'NETWORK',
        ipAddress: '',
        port: 9100,
        printerType: 'THERMAL',
        paperSize: '80mm',
        isBilling: false,
        isKitchen: false,
        isEnabled: true,
        autoCut: true,
        fontSize: 12,
        margin: 0,
        padding: 0,
      });
    }
  }, [printer, isOpen]);

  const detectPrinters = async () => {
    setDetecting(true);

    // Intercept printer scans inside Android Capacitor App to scan local Bluetooth devices
    if (typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.getPlatform() === 'android') {
      // Helper function to wait for plugins to load/initialize asynchronously
      const waitForPlugins = () => {
        return new Promise<void>((resolve) => {
          if ((window as any).bluetoothSerial) {
            resolve();
            return;
          }
          const onDeviceReady = () => {
            document.removeEventListener('deviceready', onDeviceReady);
            resolve();
          };
          document.addEventListener('deviceready', onDeviceReady);
          setTimeout(resolve, 4000); // 4 seconds timeout fallback
        });
      };

      await waitForPlugins();

      const bluetoothSerial = (window as any).bluetoothSerial;
      const permissions = (window as any).plugins?.permissions;
      
      try {
        if (permissions) {
          await new Promise<void>((resolve) => {
            const list = [
              "android.permission.BLUETOOTH_SCAN",
              "android.permission.BLUETOOTH_CONNECT",
              "android.permission.ACCESS_FINE_LOCATION"
            ];
            permissions.requestPermissions(list, () => resolve(), () => resolve());
          });
        }

        // Check and enable Bluetooth if it's off
        if (bluetoothSerial) {
          const isBtEnabled = await new Promise<boolean>((resolve) => {
            bluetoothSerial.isEnabled(() => resolve(true), () => resolve(false));
          });
          if (!isBtEnabled) {
            console.log("Bluetooth is disabled. Requesting user to turn it on...");
            await new Promise<void>((resolve, reject) => {
              bluetoothSerial.enable(() => resolve(), (err: any) => reject(new Error("Please turn on Bluetooth to scan printers.")));
            });
          }
        }

        if (!bluetoothSerial) {
          toast.error("Bluetooth printer plugin is not ready yet. Please ensure Bluetooth is enabled on your device.");
          setDetecting(false);
          return;
        }

        // 1. Get paired devices immediately
        const pairedList: any[] = await new Promise((resolve) => {
          bluetoothSerial.list((devices: any[]) => resolve(devices), () => resolve([]));
        });

        console.log("Capacitor Android paired bluetooth devices:", pairedList);

        const mapDevice = (device: any) => ({
          path: device.address || device.id,
          friendlyName: device.name || 'Unknown Printer',
          manufacturer: 'Bluetooth'
        });

        let allMapped = pairedList.map(mapDevice);
        setDetectedPorts(allMapped);

        // Smart Auto-fill printer port if the field is empty and we have paired devices
        if (allMapped.length > 0 && !formData.ipAddress) {
          const btPort = allMapped[0];
          setFormData(prev => ({
            ...prev,
            ipAddress: btPort.path,
            name: prev.name ? prev.name : btPort.friendlyName
          }));
        }

        toast.info("Scanning for all nearby Bluetooth devices (this takes ~10 seconds)...");

        // 2. Discover unpaired/new nearby devices in the background
        bluetoothSerial.discoverUnpaired((unpairedList: any[]) => {
          console.log("Capacitor Android discovered unpaired bluetooth devices:", unpairedList);
          
          const newlyDiscovered = unpairedList.map(mapDevice);
          
          // Merge lists avoiding duplicates based on MAC address (path)
          const merged = [...allMapped];
          newlyDiscovered.forEach((nd) => {
            if (!merged.some(p => p.path === nd.path)) {
              merged.push(nd);
            }
          });
          
          setDetectedPorts(merged);
          setDetecting(false);
          toast.success(`Scan complete! Found ${merged.length} total Bluetooth device(s).`);
        }, (err: any) => {
          console.warn("Unpaired bluetooth discovery error:", err);
          setDetecting(false);
          toast.warning(`Discovery failed: ${err?.message || err || 'Check Bluetooth settings'}. Found ${allMapped.length} paired devices.`);
        });
      } catch (err: any) {
        console.error("Bluetooth scan failed on Android:", err);
        toast.error(`Bluetooth scan failed: ${err.message || err}`);
        setDetecting(false);
      }
      return;
    }

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
      console.log('QZ Tray connection fallback:', e);
    }

    try {
      const response = await fetch('/api/settings/printers/detect');
      const data = await response.json();
      if (data.success) {
        const serial = data.serialPorts || [];
        const serverSystem = data.systemPrinters || [];
        
        const mergedSystem = [...localPrinters];
        serverSystem.forEach((sp: any) => {
          if (!mergedSystem.some(p => p.name.toLowerCase() === sp.name.toLowerCase())) {
            mergedSystem.push(sp);
          }
        });

        setDetectedPorts(serial);
        setDetectedSystemPrinters(mergedSystem);

        // Smart Auto-fill printer/port if the field is empty
        if (formData.connectionType === 'SYSTEM' && mergedSystem.length > 0 && !formData.ipAddress) {
          const sysPrinter = mergedSystem[0];
          setFormData(prev => ({
            ...prev,
            ipAddress: sysPrinter.portName || sysPrinter.name,
            name: prev.name ? prev.name : sysPrinter.name
          }));
        } else if (formData.connectionType === 'BLUETOOTH' && serial.length > 0 && !formData.ipAddress) {
          // Prioritize ports containing MPT, Bluetooth, BLTH, rfcomm
          const btPort = serial.find((p: any) => /bt|bluetooth|mpt|blth|rfcomm/i.test(p.path || '')) || serial[0];
          const friendlyName = cleanDeviceName(btPort.path, btPort.friendlyName);
          setFormData(prev => ({
            ...prev,
            ipAddress: btPort.path,
            name: prev.name ? prev.name : friendlyName
          }));
        } else if (formData.connectionType === 'USB' && serial.length > 0 && !formData.ipAddress) {
          // Prioritize ports containing usb, usbmodem, com, ttyusb, ttyacm
          const usbPort = serial.find((p: any) => /usb|usbmodem|ttyusb|ttyacm|com/i.test(p.path || '')) || serial[0];
          const friendlyName = cleanDeviceName(usbPort.path, usbPort.friendlyName);
          setFormData(prev => ({
            ...prev,
            ipAddress: usbPort.path,
            name: prev.name ? prev.name : friendlyName
          }));
        }

        const total = serial.length + mergedSystem.length;
        if (total === 0) {
          toast.info('No printers or ports found.');
        } else {
          toast.success(`Scan complete. Found ${mergedSystem.length} system printer(s) and ${serial.length} COM port(s).`);
        }
      } else {
        if (localPrinters.length > 0) {
          setDetectedSystemPrinters(localPrinters);
          toast.success(`Scan complete. Found ${localPrinters.length} local printer(s) via QZ Tray.`);
        } else {
          toast.error(data.error || 'Detection failed. Check server logs.');
        }
      }
    } catch (error) {
      if (localPrinters.length > 0) {
        setDetectedSystemPrinters(localPrinters);
        toast.success(`Scan complete. Found ${localPrinters.length} local printer(s) via QZ Tray.`);
      } else {
        toast.error('Could not scan ports. Server may be offline.');
        console.error('Failed to detect printers', error);
      }
    } finally {
      setDetecting(false);
    }
  };

  const scanNetworkPrinters = async () => {
    setScanningNetwork(true);
    try {
      const response = await fetch('/api/settings/printers/scan');
      const data = await response.json();
      if (data.success && Array.isArray(data.printers)) {
        setDetectedNetworkPrinters(data.printers);
        // Auto-fill network IP if empty
        if (data.printers.length > 0 && !formData.ipAddress) {
          setFormData(prev => ({
            ...prev,
            ipAddress: data.printers[0].ip,
            port: 9100,
            name: prev.name ? prev.name : data.printers[0].name
          }));
        }
        if (data.printers.length === 0) {
          toast.info('No network printers found. Check connection or enter IP manually.');
        } else {
          toast.success(`Found ${data.printers.length} network printer(s)!`);
        }
      } else {
        toast.error(data.error || 'Network scan failed');
      }
    } catch (error) {
      toast.error('Could not scan network. Server may be offline.');
      console.error('Failed to scan network printers', error);
    } finally {
      setScanningNetwork(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (formData.connectionType === 'NETWORK') {
        scanNetworkPrinters();
      } else if (formData.connectionType === 'USB' || formData.connectionType === 'BLUETOOTH' || formData.connectionType === 'SYSTEM') {
        detectPrinters();
      }
    }
  }, [isOpen, formData.connectionType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = printer?.id 
        ? `/api/settings/printers/${printer.id}` 
        : '/api/settings/printers';
      const method = printer?.id ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, propertyId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save printer');
      }

      toast.success(printer?.id ? 'Printer updated' : 'Printer added');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPorts = () => {
    if (formData.connectionType === 'BLUETOOTH') {
      const filtered = detectedPorts.filter((p: any) => 
        /bt|bluetooth|mpt|blth|rfcomm/i.test(p.path || '') || 
        /bt|bluetooth|mpt|blth|rfcomm/i.test(p.friendlyName || '')
      );
      return filtered.length > 0 ? filtered : detectedPorts;
    }
    if (formData.connectionType === 'USB') {
      const filtered = detectedPorts.filter((p: any) => /usb|usbmodem|ttyusb|ttyacm|com/i.test(p.path || ''));
      return filtered.length > 0 ? filtered : detectedPorts;
    }
    return detectedPorts;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={printer ? 'Edit Printer' : 'Add New Printer'}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Printer Name"
              placeholder="e.g. Main Billing Printer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <Select
            label="Connection Type"
            value={formData.connectionType}
            onChange={(e) => {
                setFormData(prev => ({ ...prev, connectionType: e.target.value, ipAddress: '', name: '' }));
            }}
            options={[
              { label: 'OS Installed Printer', value: 'SYSTEM' },
              { label: 'Network (IP)', value: 'NETWORK' },
              { label: 'USB / Serial', value: 'USB' },
              { label: 'Bluetooth', value: 'BLUETOOTH' },
            ]}
          />

          {formData.connectionType === 'NETWORK' && (
            <>
              <div className="flex flex-col gap-1 md:col-span-2">
                 <label className="text-xs font-semibold text-gray-500 mb-1">Select Detected Network Printer (IP)</label>
                 <div className="flex gap-2">
                      <select 
                          className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                          value={formData.ipAddress || ''}
                          onChange={(e) => {
                              const ip = e.target.value;
                              const matched = detectedNetworkPrinters.find(p => p.ip === ip);
                              const defaultName = matched ? matched.name : (ip ? `Network Printer (${ip})` : '');
                              setFormData(prev => ({
                                  ...prev,
                                  ipAddress: ip,
                                  port: 9100,
                                  name: !prev.name || prev.name.startsWith('Network Printer') || prev.name.startsWith('Printer (') ? defaultName : prev.name
                              }));
                          }}
                      >
                          <option value="">-- Select Detected Printer or Type Below --</option>
                          {formData.ipAddress && !detectedNetworkPrinters.some(p => p.ip === formData.ipAddress) && (
                              <option value={formData.ipAddress}>{formData.ipAddress} (Saved/Manual)</option>
                          )}
                          {detectedNetworkPrinters.map((prn) => (
                              <option key={prn.ip} value={prn.ip}>
                                  {prn.name}
                              </option>
                          ))}
                      </select>
                      <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          onClick={scanNetworkPrinters}
                          loading={scanningNetwork}
                          className="px-3 text-xs"
                      >
                          Scan Network
                      </Button>
                 </div>
              </div>

              <Input
                label="Confirm IP Address"
                placeholder="192.168.1.100"
                value={formData.ipAddress || ''}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                required
              />
              <Input
                label="Port"
                type="number"
                value={formData.port?.toString() || '9100'}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                required
              />
            </>
          )}

          {formData.connectionType === 'SYSTEM' && (
            <div className="flex flex-col gap-1">
               <label className="text-xs font-semibold text-gray-500 mb-1">Select Printer</label>
               <div className="flex gap-2">
                    <select 
                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                        value={formData.ipAddress || ''}
                        onChange={(e) => {
                            const val = e.target.value;
                            const matched = detectedSystemPrinters.find(p => (p.portName || p.name) === val);
                            const defaultName = matched ? matched.name : val;
                            setFormData(prev => ({
                                ...prev,
                                ipAddress: val,
                                name: !prev.name || detectedSystemPrinters.some(p => p.name === prev.name || (p.portName || p.name) === prev.name) ? defaultName : prev.name
                            }));
                        }}
                        required
                    >
                        <option value="">-- Select Printer --</option>
                        {formData.ipAddress && !detectedSystemPrinters.some(p => (p.portName || p.name) === formData.ipAddress) && (
                            <option value={formData.ipAddress}>{formData.ipAddress} (Saved)</option>
                        )}
                        {detectedSystemPrinters.map((prn) => (
                            <option key={prn.portName || prn.name} value={prn.portName || prn.name}>
                                {prn.name}
                            </option>
                        ))}
                    </select>
                    <Button 
                        type="button" 
                        variant="secondary" 
                        size="sm" 
                        onClick={detectPrinters}
                        loading={detecting}
                        className="px-2"
                    >
                        Scan
                    </Button>
               </div>
            </div>
          )}

          {(formData.connectionType === 'USB' || formData.connectionType === 'BLUETOOTH') && (
            <div className="flex flex-col gap-1">
               {getFilteredPorts().length > 0 ? (
                 <>
                   <label className="text-xs font-semibold text-gray-500 mb-1">Select Port / Device</label>
                   <div className="flex gap-2">
                        <select 
                            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
                            value={formData.ipAddress || ''}
                            onChange={(e) => {
                                const val = e.target.value;
                                const port = getFilteredPorts().find(p => p.path === val);
                                const defaultName = port ? cleanDeviceName(port.path, port.friendlyName) : val;
                                setFormData(prev => ({
                                    ...prev,
                                    ipAddress: val,
                                    name: !prev.name || prev.name.startsWith('/dev/') || prev.name.startsWith('COM') || prev.name === 'Bluetooth Printer' || prev.name === 'USB Printer' || prev.name.startsWith('Printer (')
                                        ? defaultName
                                        : prev.name
                                }));
                            }}
                            required
                        >
                            <option value="">-- Select Port / Device --</option>
                            {formData.ipAddress && !getFilteredPorts().some(p => p.path === formData.ipAddress) && (
                                <option value={formData.ipAddress}>{formData.ipAddress} (Saved)</option>
                            )}
                            {getFilteredPorts().map((port) => (
                                <option key={port.path} value={port.path}>
                                    {cleanDeviceName(port.path, port.friendlyName)} ({port.path}){port.manufacturer ? ` [${port.manufacturer}]` : ''}
                                </option>
                            ))}
                        </select>
                        <Button 
                            type="button" 
                            variant="secondary" 
                            size="sm" 
                            onClick={detectPrinters}
                            loading={detecting}
                            className="px-2"
                        >
                            Scan
                        </Button>
                   </div>
                 </>
               ) : (
                 <div className="flex flex-col gap-2">
                   <Input
                     label="Port / Path (Manual)"
                     placeholder="e.g. /dev/tty.BLTH or COM3"
                     value={formData.ipAddress || ''}
                     onChange={(e) => {
                       const val = e.target.value;
                       setFormData(prev => ({
                         ...prev,
                         ipAddress: val,
                         name: !prev.name || prev.name.startsWith('/dev/') || prev.name.startsWith('COM') || prev.name === 'Bluetooth Printer' || prev.name === 'USB Printer' || prev.name.startsWith('Printer (')
                           ? cleanDeviceName(val)
                           : prev.name
                       }));
                     }}
                     required
                   />
                   <div className="flex justify-between items-center mt-1">
                     <p className="text-[10px] text-gray-400 font-bold uppercase">No local ports detected automatically.</p>
                     <div className="flex gap-2">
                       {typeof window !== 'undefined' && 'serial' in navigator && (
                         <Button 
                             type="button" 
                             variant="outline" 
                             size="sm" 
                             onClick={async () => {
                               try {
                                 const { WebSerialPrinter } = await import('@/lib/web-serial-printer');
                                 const port = await WebSerialPrinter.requestPort();
                                 if (port) {
                                   toast.success("Device paired successfully with browser!");
                                   detectPrinters();
                                 }
                               } catch (err: any) {
                                 toast.error(err.message || "Failed to pair device");
                               }
                             }}
                             className="px-2 text-xs py-1 border-indigo-200 text-indigo-650"
                         >
                             Pair Browser Device
                         </Button>
                       )}
                       <Button 
                           type="button" 
                           variant="secondary" 
                           size="sm" 
                           onClick={detectPrinters}
                           loading={detecting}
                           className="px-2 text-xs py-1"
                       >
                           Scan Again
                       </Button>
                     </div>
                   </div>
                 </div>
               )}
            </div>
          )}

          <Select
            label="Printer Type"
            value={formData.printerType}
            onChange={(e) => setFormData({ ...formData, printerType: e.target.value })}
            options={[
              { label: 'Thermal', value: 'THERMAL' },
              { label: 'Dot Matrix', value: 'DOT_MATRIX' },
              { label: 'Inkjet / Laser', value: 'DOCUMENT' },
            ]}
          />

          <Select
            label="Paper Size"
            value={formData.paperSize}
            onChange={(e) => setFormData({ ...formData, paperSize: e.target.value })}
            options={[
              { label: '80mm (Standard)', value: '80mm' },
              { label: '58mm (Small)', value: '58mm' },
              { label: 'A4 (Document)', value: 'A4' },
              { label: 'A5 (Half A4)', value: 'A5' },
              { label: 'A6', value: 'A6' },
              { label: 'A1', value: 'A1' },
              { label: 'A2', value: 'A2' },
              { label: 'A3', value: 'A3' },
              { label: 'Letter', value: 'LETTER' },
              { label: 'Legal', value: 'LEGAL' },
              { label: 'Custom', value: 'CUSTOM' },
            ]}
          />

          <Input
            label="Font Size"
            type="number"
            value={formData.fontSize.toString()}
            onChange={(e) => setFormData({ ...formData, fontSize: parseInt(e.target.value) })}
          />

          <Input
            label="Margin (px)"
            type="number"
            value={formData.margin.toString()}
            onChange={(e) => setFormData({ ...formData, margin: parseInt(e.target.value) })}
          />
        </div>

        <div className="space-y-4 border-t pt-4 dark:border-slate-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Printer Roles</h3>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isBilling}
                onChange={(e) => setFormData({ ...formData, isBilling: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Billing Printer</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isKitchen}
                onChange={(e) => setFormData({ ...formData, isKitchen: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Kitchen (KOT) Printer</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Enabled</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoCut}
                onChange={(e) => setFormData({ ...formData, autoCut: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Auto-Cut</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading}>
            {printer ? 'Update Printer' : 'Add Printer'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
