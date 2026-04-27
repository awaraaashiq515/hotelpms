import { SerialPort } from 'serialport';

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
 * 🚦 Simple Print Queue to prevent "Port Busy" errors
 */
class SerialPrintQueue {
  private queue: { data: string | Buffer; portPath: string; resolve: () => void; reject: (err: any) => void }[] = [];
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
    const { data, portPath, resolve, reject } = this.queue.shift()!;

    try {
      await this.executePrint(data, portPath);
      resolve();
    } catch (err) {
      reject(err);
    } finally {
      this.isProcessing = false;
      // Small break between jobs
      setTimeout(() => this.processNext(), 1000);
    }
  }

  private executePrint(data: string | Buffer, portPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`📡 Attempting to connect to ${portPath} @ ${BAUD_RATE}`);
      
      const port = new SerialPort({
        path: portPath,
        baudRate: BAUD_RATE,
      });

      port.on('open', () => {
        console.log(`✅ Port opened: ${portPath}`);

        // Convert to Buffer exactly like test.js
        const buffer = typeof data === 'string' ? Buffer.from(data, 'ascii') : data;

        port.write(buffer, (err) => {
          if (err) {
            console.error('❌ Write error:', err.message);
            port.close();
            return reject(err);
          }

          port.drain(() => {
            console.log('🖨️ Data sent to printer');
            
            // 2 Second Delay exactly like test.js
            setTimeout(() => {
              port.close((closeErr) => {
                if (closeErr) console.error('❌ Close error:', closeErr.message);
                else console.log('🔒 Port closed');
                resolve();
              });
            }, 2000);
          });
        });
      });

      port.on('error', (err) => {
        console.error('❌ Port error event:', err.message);
        if (port.isOpen) port.close();
        reject(err);
      });
    });
  }
}

// 📦 Singleton Instance
const printQueue = new SerialPrintQueue();

/**
 * Sends data to the printer queue
 */
export async function printDirect(data: string | Buffer, portPath: string = DEFAULT_PORT_PATH): Promise<void> {
  return printQueue.add(data, portPath);
}
