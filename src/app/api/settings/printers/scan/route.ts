import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import os from 'os';
import net from 'net';

/**
 * Helper to get local subnet IPv4 prefixes
 */
function getLocalSubnets(): string[] {
  const interfaces = os.networkInterfaces();
  const subnets: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const parts = iface.address.split('.');
        parts.pop(); // Remove host identifier
        subnets.push(parts.join('.') + '.');
      }
    }
  }
  return subnets;
}

/**
 * Probes a specific IP address on port 9100
 */
async function scanIP(ip: string, port: number = 9100, timeout: number = 300): Promise<string | null> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);

    socket.connect(port, ip, () => {
      socket.destroy();
      resolve(ip);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(null);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(null);
    });
  });
}

/**
 * GET /api/settings/printers/scan
 * Scans the local subnets for printers listening on port 9100 (WiFi/LAN receipt printers)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subnets = getLocalSubnets();
    if (subnets.length === 0) {
      return NextResponse.json({ success: true, printers: [] });
    }

    console.log(`[Network Scan] Starting printer scan on subnets: ${subnets.join(', ')}`);
    const foundPrinters: string[] = [];
    const scanPromises: Promise<string | null>[] = [];

    // Scan all 254 hosts on each active subnet
    for (const subnet of subnets) {
      for (let host = 1; host <= 254; host++) {
        const ip = `${subnet}${host}`;
        scanPromises.push(scanIP(ip, 9100, 350));
      }
    }

    // Await all probes
    const results = await Promise.all(scanPromises);
    results.forEach((ip) => {
      if (ip) foundPrinters.push(ip);
    });

    console.log(`[Network Scan] Scan complete. Found ${foundPrinters.length} network printer(s):`, foundPrinters);

    return NextResponse.json({
      success: true,
      printers: foundPrinters.map((ip) => ({
        ip,
        name: `Network Printer (${ip})`,
        port: 9100,
      })),
    });
  } catch (error: any) {
    console.error('[Network Scan] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
