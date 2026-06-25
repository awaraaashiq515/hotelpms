export class WebSerialPrinter {
  /**
   * Request user to select a serial port.
   */
  static async requestPort(): Promise<any | null> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Please use Google Chrome or Edge.');
    }
    
    try {
      const port = await (navigator as any).serial.requestPort();
      return port;
    } catch (e: any) {
      console.warn('User cancelled or error requesting port:', e);
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
   * Print raw data string to the serial port.
   */
  static async print(data: string, ipAddressString?: string): Promise<void> {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser.');
    }

    let portToUse: any = null;
    const ports = await (navigator as any).serial.getPorts();

    // The ipAddress field for WEB_SERIAL might store JSON containing vendorId/productId
    let targetVendorId: number | undefined;
    let targetProductId: number | undefined;

    if (ipAddressString) {
      try {
        const parsed = JSON.parse(ipAddressString);
        targetVendorId = parsed.usbVendorId;
        targetProductId = parsed.usbProductId;
      } catch (e) {
        // Not a JSON string, ignore
      }
    }

    if (ports.length > 0) {
       if (targetVendorId && targetProductId) {
         portToUse = ports.find((p: any) => {
           const info = p.getInfo();
           return info.usbVendorId === targetVendorId && info.usbProductId === targetProductId;
         });
       }
       if (!portToUse) {
         // Fallback to the first available approved port
         portToUse = ports[0];
       }
    }

    if (!portToUse) {
       throw new Error('Printer not connected. Please go to Settings > Printers and pair your printer first.');
    }

    let writer: any = null;
    try {
      // Ensure port is closed first to clear any stale state
      try {
        if (portToUse.readable || portToUse.writable) {
          await portToUse.close();
        }
      } catch (_) {}

      await portToUse.open({ baudRate: 115200 }); // Standard baud rate
      
      // Convert the binary string to a Uint8Array
      const buffer = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        buffer[i] = data.charCodeAt(i) & 0xFF;
      }

      writer = portToUse.writable.getWriter();
      await writer.write(buffer);
      await writer.close();
      writer = null;
      
      await portToUse.close();
    } catch (e: any) {
      console.warn('First Web Serial write attempt failed, trying to reconnect...', e);
      if (writer) {
          try { await writer.abort(); } catch (_) {}
          try { writer.releaseLock(); } catch (_) {}
          writer = null;
      }
      try {
          await portToUse.close();
      } catch (closeErr) {}

      try {
          await portToUse.open({ baudRate: 115200 });
          writer = portToUse.writable.getWriter();
          
          const buffer = new Uint8Array(data.length);
          for (let i = 0; i < data.length; i++) {
            buffer[i] = data.charCodeAt(i) & 0xFF;
          }
          await writer.write(buffer);
          await writer.close();
          writer = null;
          
          await portToUse.close();
      } catch (retryErr: any) {
          console.error('Serial print retry error:', retryErr);
          throw new Error(`Failed to print after reconnect: ${retryErr.message}`);
      }
    } finally {
      if (writer) {
        try { writer.releaseLock(); } catch (_) {}
      }
      try {
        await portToUse.close();
      } catch (_) {}
    }
  }
}
