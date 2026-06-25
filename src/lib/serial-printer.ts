import { SerialPort } from 'serialport';
import { prisma } from './prisma';

// 🔌 Default Port Path for MPT-II on macOS
const DEFAULT_PORT_PATH = '/dev/tty.MPT-II';
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
 * 🚦 Print Queue — ensures only one print runs at a time,
 *    preventing concurrent port access within this process.
 */
class SerialPrintQueue {
  private queue: {
    data: string | Buffer;
    portPath: string;
    resolve: () => void;
    reject: (err: any) => void;
  }[] = [];
  private isProcessing = false;

  // Cached open ports — keeps Bluetooth RFCOMM channel alive indefinitely
  private portCache: Map<string, { port: SerialPort }> = new Map();

  async add(data: string | Buffer, portPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, portPath, resolve, reject });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const { data, portPath, resolve, reject } = this.queue.shift()!;
    try {
      await this.executePrintWithFallback(data, portPath);
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      this.isProcessing = false;
      setTimeout(() => this.processNext(), 300);
    }
  }

  private async executePrintWithFallback(
    data: string | Buffer,
    initialPortPath: string
  ): Promise<void> {
    // macOS: tty.* → cu.* for outgoing connections
    let preferredPath = initialPortPath;
    if (process.platform === 'darwin' && preferredPath.startsWith('/dev/tty.')) {
      preferredPath = '/dev/cu.' + preferredPath.substring(9);
    }

    try {
      console.log(`[Serial Spool] Trying preferred port: ${preferredPath}`);
      await this.executePrint(data, preferredPath);
      return;
    } catch (err) {
      console.warn(
        `[Serial Spool] Preferred port ${preferredPath} failed: ${(err as any).message}. Auto-healing...`
      );
    }

    // Scan for alternative Bluetooth ports
    let ports: any[] = [];
    try {
      ports = await SerialPort.list();
    } catch (e) {
      throw new Error(`Failed to list serial ports: ${(e as any).message}`);
    }

    const isBt = /bt|bluetooth|mpt|blth|rfcomm/i.test(initialPortPath);
    const candidates = ports
      .map(p => {
        let path = p.path;
        if (process.platform === 'darwin' && path.startsWith('/dev/tty.')) {
          path = '/dev/cu.' + path.substring(9);
        }
        return { ...p, path };
      })
      .filter(p => {
        if (p.path === preferredPath) return false;
        if (/incoming/i.test(p.path || '')) return false;
        const isPortBt = /bt|bluetooth|mpt|blth|rfcomm/i.test(p.path || '');
        const isPortUsb = /usb|usbmodem|ttyusb|ttyacm|com/i.test(p.path || '');
        return isBt ? isPortBt : (isPortUsb || isPortBt);
      });

    if (candidates.length === 0) {
      throw new Error(`All ports failed for ${initialPortPath} and no fallback ports found.`);
    }

    for (const cand of candidates) {
      try {
        console.log(`[Auto-Connect] Trying fallback port: ${cand.path}`);
        await this.executePrint(data, cand.path);
        console.log(`[Auto-Connect] ✅ Success on fallback port: ${cand.path}`);
        return;
      } catch (candErr) {
        console.warn(`[Auto-Connect] ${cand.path} failed: ${(candErr as any).message}`);
      }
    }

    throw new Error(`Failed to print — all known ports exhausted.`);
  }

  private executePrint(data: string | Buffer, portPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let finalPath = portPath;
      if (process.platform === 'darwin' && portPath.startsWith('/dev/tty.')) {
        finalPath = '/dev/cu.' + portPath.substring(9);
      }

      // ── Fast path: reuse cached open connection ──────────────────────────
      const cached = this.portCache.get(finalPath);
      if (cached && cached.port.isOpen) {
        console.log(`🔌 Using cached open port: ${finalPath}`);

        const buffer = typeof data === 'string' ? Buffer.from(data, 'binary') : data;
        let settled = false;

        const writeTimeout = setTimeout(() => {
          if (!settled) {
            settled = true;
            console.warn(`⏳ Cached port write/drain timeout for ${finalPath}. Reconnecting...`);
            this.closePort(finalPath);
            this.openAndPrint(data, finalPath, resolve, reject);
          }
        }, 5000); // 5 seconds timeout

        cached.port.write(buffer, (writeErr) => {
          if (writeErr) {
            if (!settled) {
              settled = true;
              clearTimeout(writeTimeout);
              console.warn(`⚠️ Cached port write failed (${writeErr.message}), reconnecting...`);
              this.closePort(finalPath);
              this.openAndPrint(data, finalPath, resolve, reject);
            }
            return;
          }

          cached.port.drain(() => {
            if (!settled) {
              settled = true;
              clearTimeout(writeTimeout);
              console.log('🖨️ Data sent to printer (cached)');
              resolve();
            }
          });
        });
        return;
      }

      // ── Slow path: open a new connection ────────────────────────────────
      this.openAndPrint(data, finalPath, resolve, reject);
    });
  }

  /**
   * Opens the port (with retry/backoff for Bluetooth RFCOMM reconnect),
   * writes data, then keeps the port OPEN so RFCOMM stays alive indefinitely.
   */
  private openAndPrint(
    data: string | Buffer,
    finalPath: string,
    resolve: () => void,
    reject: (err: any) => void
  ) {
    const MAX_RETRIES = 5;
    const RETRY_DELAY_MS = 2500; // 2.5 s between Bluetooth reconnect attempts

    const tryOpen = (attempt: number) => {
      console.log(`📡 Connecting to ${finalPath} @ ${BAUD_RATE} (attempt ${attempt}/${MAX_RETRIES})`);

      const port = new SerialPort({ path: finalPath, baudRate: BAUD_RATE, autoOpen: false });

      const retryOrFail = (msg: string) => {
        if (attempt < MAX_RETRIES) {
          console.warn(`⚠️ ${msg} — retrying in ${RETRY_DELAY_MS / 1000}s (${attempt}/${MAX_RETRIES})`);
          setTimeout(() => tryOpen(attempt + 1), RETRY_DELAY_MS);
        } else {
          reject(new Error(`${msg} — all ${MAX_RETRIES} attempts failed.`));
        }
      };

      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          port.close(() => {});
          retryOrFail(`Timeout opening ${finalPath}`);
        }
      }, 10000);

      port.open((openErr) => {
        if (openErr) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            retryOrFail(`Open failed (${openErr.message})`);
          }
          return;
        }
        if (!settled) { settled = true; clearTimeout(timer); }

        console.log(`✅ Port opened: ${finalPath}`);

        // Cache the port — keep RFCOMM alive indefinitely for next print
        this.portCache.set(finalPath, { port });

        // Remove from cache if port closes unexpectedly
        port.on('close', () => {
          console.log(`🔒 Port ${finalPath} closed.`);
          const entry = this.portCache.get(finalPath);
          if (entry) {
            this.portCache.delete(finalPath);
          }
        });
        port.on('error', (err) => {
          console.error(`❌ Port error on ${finalPath}:`, err.message);
          this.closePort(finalPath);
        });

        const buffer = typeof data === 'string' ? Buffer.from(data, 'binary') : data;
        let writeSettled = false;
        
        const writeTimer = setTimeout(() => {
          if (!writeSettled) {
            writeSettled = true;
            console.error('❌ Write/drain timeout on fresh open');
            this.closePort(finalPath);
            reject(new Error('Write/drain timeout on fresh open'));
          }
        }, 5000);

        port.write(buffer, (writeErr) => {
          if (writeErr) {
            if (!writeSettled) {
              writeSettled = true;
              clearTimeout(writeTimer);
              console.error('❌ Write error:', writeErr.message);
              this.closePort(finalPath);
              return reject(writeErr);
            }
            return;
          }
          port.drain(() => {
            if (!writeSettled) {
              writeSettled = true;
              clearTimeout(writeTimer);
              console.log('🖨️ Data sent to printer');
              // ✅ Keep port OPEN so it stays connected!
              resolve();
            }
          });
        });
      });
    };

    tryOpen(1);
  }

  private closePort(path: string) {
    const entry = this.portCache.get(path);
    if (entry) {
      this.portCache.delete(path);
      if (entry.port.isOpen) {
        entry.port.close((err) => {
          if (err) console.warn(`⚠️ Error closing ${path}:`, err.message);
          else console.log(`🔒 Port ${path} closed.`);
        });
      }
    }
  }
}

declare global {
  var printQueue: undefined | SerialPrintQueue;
}

// 📦 Singleton queue instance
const printQueue = globalThis.printQueue ?? new SerialPrintQueue();

if (process.env.NODE_ENV !== 'production') globalThis.printQueue = printQueue;

/**
 * Sends data to the printer via the serial queue.
 */
export async function printDirect(
  data: string | Buffer,
  portPath: string = DEFAULT_PORT_PATH
): Promise<void> {
  return printQueue.add(data, portPath);
}
