/**
 * Web Serial Printer — Persistent Connection Manager
 *
 * KEY DESIGN DECISIONS:
 *
 * 1. PERSISTENT PORT: We keep the Web Serial port OPEN for 30 seconds after
 *    the last print. Closing a Bluetooth virtual serial port on macOS/Windows
 *    tears down the RFCOMM channel. Re-opening it requires the OS to
 *    re-negotiate Bluetooth SPP, which takes 2-5 seconds and is the ROOT
 *    CAUSE of "slow prints".
 *
 * 2. releaseLock() NOT close(): After writing, we call writer.releaseLock()
 *    to give up exclusive access to the WritableStream WITHOUT closing it.
 *    Calling writer.close() seals the underlying WritableStream permanently —
 *    any subsequent write attempt then fails and forces a port close/reopen.
 *
 * 3. NO MANUAL CHUNKING: The browser's Web Serial implementation already
 *    handles Bluetooth MTU chunking internally. Manual chunking with delays
 *    only adds latency without benefit.
 */

const PORT_IDLE_CLOSE_MS = 30_000; // close port after 30s of no prints

interface WebSerialPortHandle {
  port: any;
  idleTimer: ReturnType<typeof setTimeout> | null;
}

// Persistent port pool — keyed by a string identifier per port
const openWebSerialPorts = new Map<string, WebSerialPortHandle>();

function getPortKey(port: any): string {
  try {
    const info = port.getInfo();
    return `ws-${info.usbVendorId ?? 'bt'}:${info.usbProductId ?? 'serial'}`;
  } catch {
    return 'ws-default';
  }
}

function scheduleIdleClose(key: string, handle: WebSerialPortHandle) {
  if (handle.idleTimer) clearTimeout(handle.idleTimer);
  handle.idleTimer = setTimeout(async () => {
    console.log('[WebSerial] Idle timeout — closing port', key);
    await forceCloseWebPort(key);
  }, PORT_IDLE_CLOSE_MS);
}

async function forceCloseWebPort(key: string) {
  const handle = openWebSerialPorts.get(key);
  if (!handle) return;
  openWebSerialPorts.delete(key);
  if (handle.idleTimer) clearTimeout(handle.idleTimer);
  try { await handle.port.close(); } catch (_) {}
}

export class WebSerialPrinter {
  /**
   * Request user to select a serial port (one-time pairing).
   */
  static async requestPort(): Promise<any | null> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Please use Google Chrome or Edge.');
    }
    try {
      return await (navigator as any).serial.requestPort();
    } catch (e: any) {
      console.warn('[WebSerial] User cancelled or error requesting port:', e);
      return null;
    }
  }

  /**
   * Get all previously approved ports.
   */
  static async getPorts(): Promise<any[]> {
    if (!('serial' in navigator)) return [];
    return await (navigator as any).serial.getPorts();
  }

  /**
   * Print raw ESC/POS data to the serial port.
   * Uses a persistent connection — fast on consecutive prints.
   */
  static async print(data: string, ipAddressString?: string): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser.');
    }

    // ── 1. Find the right port ────────────────────────────────────────────
    const ports = await (navigator as any).serial.getPorts();
    let portToUse: any = null;

    let targetVendorId: number | undefined;
    let targetProductId: number | undefined;
    if (ipAddressString) {
      try {
        const parsed = JSON.parse(ipAddressString);
        targetVendorId = parsed.usbVendorId;
        targetProductId = parsed.usbProductId;
      } catch (_) { /* not a JSON vendorId/productId string */ }
    }

    if (ports.length > 0) {
      if (targetVendorId && targetProductId) {
        portToUse = ports.find((p: any) => {
          const info = p.getInfo();
          return info.usbVendorId === targetVendorId && info.usbProductId === targetProductId;
        });
      }
      if (!portToUse) portToUse = ports[0];
    }

    if (!portToUse) {
      throw new Error('Printer not connected. Please go to Settings > Printers and pair your printer first.');
    }

    const portKey = getPortKey(portToUse);

    // ── 2. Get or open persistent port handle ────────────────────────────
    let handle = openWebSerialPorts.get(portKey);

    if (handle) {
      // Port already open — pause the idle-close timer while we print
      if (handle.idleTimer) clearTimeout(handle.idleTimer);
      console.log('[WebSerial] Reusing open port:', portKey);
    } else {
      // Port not open — open it fresh
      // Attempt a close first to clear any stale OS state
      try { await portToUse.close(); } catch (_) {}

      console.log('[WebSerial] Opening port:', portKey);
      await portToUse.open({ baudRate: 115200 });
      handle = { port: portToUse, idleTimer: null };
      openWebSerialPorts.set(portKey, handle);
    }

    // ── 3. Write data ─────────────────────────────────────────────────────
    // Convert binary string to Uint8Array (preserves ESC/POS byte values)
    const buffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      buffer[i] = data.charCodeAt(i) & 0xFF;
    }

    let writer: any = null;
    try {
      writer = portToUse.writable.getWriter();
      await writer.write(buffer);

      // ✅ releaseLock() — keeps the port and WritableStream ALIVE for next print.
      // writer.close() would seal the stream and force a reconnect next time.
      writer.releaseLock();
      writer = null;

      // Brief wait for the Bluetooth radio to finish transmitting
      // (Web Serial write resolves when data is in the serial TX buffer,
      //  not when it's been physically sent over BT RF.)
      const btTransmitMs = Math.max(250, Math.ceil((buffer.length / 14400) * 1000) + 150);
      await new Promise(r => setTimeout(r, btTransmitMs));

      console.log(`[WebSerial] ✅ Print done (${buffer.length} bytes, waited ${btTransmitMs}ms)`);
    } catch (err: any) {
      // Port had an error mid-write — evict from pool so next print reconnects
      if (writer) {
        try { writer.releaseLock(); } catch (_) {}
        writer = null;
      }
      openWebSerialPorts.delete(portKey);
      try { await portToUse.close(); } catch (_) {}
      throw new Error(`Web Serial write failed: ${err.message}`);
    }

    // ── 4. Reset idle timer ───────────────────────────────────────────────
    // Port auto-closes after 30 seconds of no print jobs
    scheduleIdleClose(portKey, handle);
  }
}
