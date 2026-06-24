import { NextRequest, NextResponse } from 'next/server';
import { SerialPort } from 'serialport';
import { getSession } from '@/lib/session';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Detect available printers from:
 * 1. OS-level installed printers (Windows: wmic, Mac/Linux: lpstat)
 * 2. USB / Serial ports via serialport
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: any = {
      systemPrinters: [],
      serialPorts: [],
    };

    // ── 1. OS System Printers ────────────────────────────────────────────
    try {
      const platform = process.platform;

      if (platform === 'win32') {
        // Windows: use wmic to list printers
        const { stdout } = await execAsync(
          'wmic printer get Name,PortName,PrinterStatus,WorkOffline /format:csv',
          { timeout: 5000 }
        );
        const lines = stdout.trim().split('\n').filter(Boolean);
        if (lines.length > 1) {
          const headers = lines[0].toLowerCase().split(',').map((h: string) => h.trim());
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v: string) => v.trim());
            const obj: any = {};
            headers.forEach((h: string, idx: number) => { obj[h] = values[idx] || ''; });
            if (obj.name) {
              results.systemPrinters.push({
                name: obj.name,
                portName: obj.portname || '',
                status: obj.printerstatus === '0' ? 'Idle' : 'Unknown',
                isOnline: obj.workoffline !== 'TRUE',
                source: 'WINDOWS',
              });
            }
          }
        }
      } else if (platform === 'darwin') {
        // macOS: use lpstat
        try {
          const { stdout } = await execAsync('lpstat -p', { timeout: 5000 });
          const lines = stdout.trim().split('\n').filter(Boolean);
          lines.forEach((line: string) => {
            // e.g. "printer HP_LaserJet is idle."
            const match = line.match(/^printer\s+(\S+)\s+(.+)/);
            if (match) {
              const printerName = match[1];
              const statusText = match[2] || '';
              const isIdle = statusText.includes('idle') || statusText.includes('enabled');
              results.systemPrinters.push({
                name: printerName.replace(/_/g, ' '),
                portName: printerName,
                status: isIdle ? 'Idle' : 'Unknown',
                isOnline: isIdle,
                source: 'CUPS',
              });
            }
          });
        } catch {
          // lpstat failed — try system_profiler
          const { stdout } = await execAsync(
            "system_profiler SPPrintersDataType | grep 'Printer Name:'",
            { timeout: 8000 }
          );
          stdout.trim().split('\n').filter(Boolean).forEach((line: string) => {
            const name = line.replace('Printer Name:', '').trim();
            if (name) {
              results.systemPrinters.push({ name, portName: name, status: 'Unknown', isOnline: true, source: 'CUPS' });
            }
          });
        }
      } else {
        // Linux: use lpstat
        try {
          const { stdout } = await execAsync('lpstat -p', { timeout: 5000 });
          const lines = stdout.trim().split('\n').filter(Boolean);
          lines.forEach((line: string) => {
            const match = line.match(/^printer\s+(\S+)\s+(.+)/);
            if (match) {
              const printerName = match[1];
              const isOnline = match[2].includes('idle') || match[2].includes('enabled');
              results.systemPrinters.push({
                name: printerName.replace(/_/g, ' '),
                portName: printerName,
                status: isOnline ? 'Idle' : 'Unknown',
                isOnline,
                source: 'CUPS',
              });
            }
          });
        } catch { /* no CUPS installed */ }
      }
    } catch (osError: any) {
      console.warn('[Printers Detect] OS printer scan failed:', osError.message);
    }

    // ── 2. USB / Serial Ports ────────────────────────────────────────────
    try {
      const ports = await SerialPort.list();
      results.serialPorts = ports
        .filter((p: any) => !/incoming/i.test(p.path || ''))
        .map((p: any) => ({
          path: p.path,
          friendlyName: p.friendlyName || p.manufacturer || p.path,
          manufacturer: p.manufacturer || '',
          vendorId: p.vendorId || '',
          productId: p.productId || '',
          serialNumber: p.serialNumber || '',
          source: 'SERIAL',
        }));
    } catch (serialError: any) {
      console.warn('[Printers Detect] Serial port scan failed:', serialError.message);
    }

    return NextResponse.json({
      success: true,
      systemPrinters: results.systemPrinters,
      serialPorts: results.serialPorts,
      platform: process.platform,
    });
  } catch (error: any) {
    console.error('[Printers Detect] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
