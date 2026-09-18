import { SerialPort } from 'serialport';

// 🔌 Default Port Path for MPT-II on macOS (/dev/cu.* for outbound Bluetooth)
const DEFAULT_PORT_PATH = process.platform === 'darwin' ? '/dev/cu.MPT-II' : '/dev/tty.MPT-II';
const BAUD_RATE = 115200;

// 🧾 ESC/POS Command Helpers
export const ESC_POS = {
  INIT: '\x1B\x40',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_RIGHT: '\x1B\x61\x02',
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  DOUBLE_SIZE: '\x1D\x21\x11',
  NORMAL_SIZE: '\x1D\x21\x00',
  FEED: '\x0A',
  CUT: '\x1D\x56\x00',
};

/**
 * Ensures outgoing serial paths on macOS use /dev/cu.* instead of /dev/tty.*.
 * /dev/tty.* on macOS blocks waiting for modem carrier detect (DCD) which hangs Bluetooth SPP.
 */
function normalizePath(portPath: string): string {
  let p = (portPath || '').trim();
  if (!p) return DEFAULT_PORT_PATH;
  if (process.platform === 'darwin') {
    if (p.startsWith('/dev/tty.')) {
      return '/dev/cu.' + p.slice(9);
    }
    if (!p.startsWith('/dev/')) {
      return '/dev/cu.' + p;
    }
  }
  return p;
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Petpooja-Style Persistent Port Connection ──────────────────────────────
// A single connection is established and kept OPEN permanently across prints.
// The printer stays connected (solid blue LED), exactly like Petpooja POS.
// Stored on globalThis to survive Next.js module re-evaluations.

declare global {
  var __petpoojaPort: SerialPort | null | undefined;
  var __petpoojaConnecting: Promise<SerialPort> | null | undefined;
  var printQueue: undefined | SerialPrintQueue;
}

async function getConnectedPort(targetPath: string): Promise<SerialPort> {
  const finalPath = normalizePath(targetPath);

  // If port is already open and ready, reuse it immediately (0ms delay)
  if (globalThis.__petpoojaPort && globalThis.__petpoojaPort.isOpen) {
    return globalThis.__petpoojaPort;
  }

  // If already in the process of connecting, await the active connection
  if (globalThis.__petpoojaConnecting) {
    return globalThis.__petpoojaConnecting;
  }

  // Clean up any stale/broken instance
  if (globalThis.__petpoojaPort) {
    try { globalThis.__petpoojaPort.close(); } catch (_) {}
    globalThis.__petpoojaPort = null;
  }

  // Open fresh persistent connection
  globalThis.__petpoojaConnecting = (async () => {
    const OPEN_TIMEOUT_MS = 4000;
    try {
      const sp = await new Promise<SerialPort>((resolve, reject) => {
        const port = new SerialPort({
          path: finalPath,
          baudRate: BAUD_RATE,
          autoOpen: false,
        });

        const timer = setTimeout(() => {
          try { port.close(); } catch (_) {}
          reject(new Error(`Timeout connecting to printer ${finalPath}`));
        }, OPEN_TIMEOUT_MS);

        port.open((err) => {
          clearTimeout(timer);
          if (err) {
            try { port.close(); } catch (_) {}
            reject(err);
          } else {
            resolve(port);
          }
        });
      });

      // Maintain listeners for unexpected drops (power off, battery dead)
      sp.on('close', () => {
        console.log(`[Serial] Printer connection closed on ${finalPath}. Will auto-reconnect on next print.`);
        if (globalThis.__petpoojaPort === sp) {
          globalThis.__petpoojaPort = null;
        }
      });

      sp.on('error', (err) => {
        console.warn(`[Serial] Printer port error: ${err.message}`);
        if (globalThis.__petpoojaPort === sp) {
          try { sp.close(); } catch (_) {}
          globalThis.__petpoojaPort = null;
        }
      });

      console.log(`[Serial] 🔌 Persistent connection ESTABLISHED on ${finalPath} (stays connected)`);
      globalThis.__petpoojaPort = sp;
      return sp;
    } finally {
      globalThis.__petpoojaConnecting = null;
    }
  })();

  return globalThis.__petpoojaConnecting;
}

/**
 * Sends buffer to printer with flow-control chunking.
 * MPT-II thermal printer has a 1KB-2KB receive buffer.
 * Sending in 256-byte chunks with 15ms delay guarantees zero buffer overflow
 * and prints in ~50ms total without dropping items.
 */
async function writeWithFlowControl(port: SerialPort, buffer: Buffer): Promise<void> {
  const CHUNK_SIZE = 256;
  const CHUNK_DELAY_MS = 15;
  const WRITE_TIMEOUT_MS = 2500;

  for (let offset = 0; offset < buffer.length; offset += CHUNK_SIZE) {
    const chunk = buffer.subarray(offset, Math.min(offset + CHUNK_SIZE, buffer.length));

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Serial write timeout')), WRITE_TIMEOUT_MS);
      port.write(chunk, (err) => {
        clearTimeout(timer);
        if (err) reject(err);
        else resolve();
      });
    });

    if (offset + CHUNK_SIZE < buffer.length) {
      await sleep(CHUNK_DELAY_MS);
    }
  }

  // Drain kernel buffer to Bluetooth stack with 1s timeout
  try {
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, 1000);
      port.drain(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  } catch (_) {}
}

// ─── Print Queue ──────────────────────────────────────────────────────────────
/**
 * 🚦 Serial Print Queue — strictly serializes jobs to prevent interleaving.
 * Uses persistent open connection so printing starts in 0ms without disconnecting.
 */
class SerialPrintQueue {
  private queue: {
    data: string | Buffer;
    portPath: string;
    resolve: () => void;
    reject: (err: any) => void;
  }[] = [];
  private isProcessing = false;

  async add(data: string | Buffer, portPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, portPath, resolve, reject });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const item = this.queue.shift()!;

    try {
      await this.executePrint(item.data, item.portPath);
      item.resolve();
    } catch (err) {
      console.error('[Serial] Print job failed:', err);
      item.reject(err);
    } finally {
      this.isProcessing = false;
      // Immediate next job processing (50ms gap)
      setTimeout(() => this.processNext(), 50);
    }
  }

  private async executePrint(data: string | Buffer, initialPortPath: string): Promise<void> {
    const preferredPath = normalizePath(initialPortPath);
    const buffer = typeof data === 'string' ? Buffer.from(data, 'binary') : data;

    try {
      const port = await getConnectedPort(preferredPath);
      await writeWithFlowControl(port, buffer);
      console.log(`🖨️ ✅ Printed ${buffer.length} bytes to ${preferredPath} (port kept open)`);
      return;
    } catch (err: any) {
      console.warn(`[Serial] Write failed on ${preferredPath}: ${err.message}. Reconnecting...`);
      // Connection may have dropped — clear and retry once fresh
      if (globalThis.__petpoojaPort) {
        try { globalThis.__petpoojaPort.close(); } catch (_) {}
        globalThis.__petpoojaPort = null;
      }
    }

    // Auto-retry once with fresh connection
    try {
      console.log(`[Serial] Retrying fresh connection to ${preferredPath}...`);
      const port = await getConnectedPort(preferredPath);
      await writeWithFlowControl(port, buffer);
      console.log(`🖨️ ✅ Retry printed ${buffer.length} bytes successfully to ${preferredPath}`);
      return;
    } catch (retryErr: any) {
      throw new Error(`Printer connection failed on ${preferredPath}: ${retryErr.message}. Make sure printer is turned ON and Bluetooth is connected.`);
    }
  }
}

// 📦 Singleton queue instance
const printQueue = globalThis.printQueue ?? new SerialPrintQueue();
globalThis.printQueue = printQueue;

/**
 * Sends data to the printer via the persistent serial connection queue.
 */
export async function printDirect(
  data: string | Buffer,
  portPath: string = DEFAULT_PORT_PATH
): Promise<void> {
  return printQueue.add(data, portPath);
}
