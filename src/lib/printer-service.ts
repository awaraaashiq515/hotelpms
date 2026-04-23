import qz from "qz-tray";

class PrinterService {
  private connected = false;

  /**
   * Connects to QZ Tray if not already connected
   */
  async connect() {
    if (typeof window === 'undefined') return;
    
    try {
      if (this.connected && qz.websocket.isActive()) {
        return;
      }
    } catch (e) {
      // isActive might throw if not initialized
    }

    try {
      await qz.websocket.connect();
      this.connected = true;
      console.log("QZ Tray connected");
    } catch (e) {
      console.error("QZ Tray connection failed", e);
      throw new Error("Could not connect to QZ Tray. Make sure the app is running.");
    }
  }

  /**
   * Disconnects from QZ Tray
   */
  async disconnect() {
    if (typeof window === 'undefined') return;
    if (qz.websocket.isActive()) {
      await qz.websocket.disconnect();
      this.connected = false;
    }
  }

  /**
   * Prints raw ESC/POS commands to the specified printer
   * @param printerName Exact name of the printer as seen in QZ Tray/System
   * @param data Array of ESC/POS commands (strings or hex)
   */
  async printRaw(printerName: string = "MPT-II", data: any[]) {
    try {
      await this.connect();
      
      const config = qz.configs.create(printerName, {
        rasterize: false,
        encoding: 'UTF-8',
        interpolation: 'nearest-neighbor',
        forceRaw: true
      });

      await qz.print(config, data);
    } catch (e: any) {
      if (e.message.includes("find printer")) {
        try {
          const printers = await qz.printers.find();
          console.error("Printer not found. Available printers:", printers);
          const printerListStr = Array.isArray(printers) ? printers.join(", ") : String(printers);
          throw new Error(`Printer "${printerName}" not found. Available printers: ${printerListStr}`);
        } catch (findErr) {
          // Fallback if find fails
        }
      }
      console.error("Printing failed:", e);
      throw new Error(`Printing failed: ${e.message}`);
    }
  }

  /**
   * Formats a KOT for ESC/POS printing
   */
  formatKOT(kotData: any) {
    const esc = {
      init: '\x1B\x40',
      boldOn: '\x1B\x45\x01',
      boldOff: '\x1B\x45\x00',
      center: '\x1B\x61\x01',
      left: '\x1B\x61\x00',
      doubleSize: '\x1D\x21\x11',
      normalSize: '\x1D\x21\x00',
      cut: '\x1D\x56\x00',
      feed: '\x0A'
    };

    const data = [
      esc.init,
      esc.center,
      esc.doubleSize,
      esc.boldOn,
      'KOT\n',
      esc.normalSize,
      `Order: ${kotData.orderNo}\n`,
      `Table: ${kotData.tableNo}\n`,
      esc.boldOff,
      '--------------------------------\n',
      esc.left,
      'QTY  ITEM\n',
      '--------------------------------\n'
    ];

    kotData.items.forEach((item: any) => {
      data.push(`${item.quantity.toString().padEnd(4)} ${item.name}\n`);
      if (item.notes) {
        data.push(`     * ${item.notes}\n`);
      }
    });

    data.push('--------------------------------\n');
    data.push(esc.feed);
    data.push(esc.feed);
    data.push(esc.feed);
    data.push(esc.cut);

    return data;
  }

  /**
   * Formats a Bill for ESC/POS printing
   */
  formatBill(billData: any, property: any) {
    const esc = {
      init: '\x1B\x40',
      boldOn: '\x1B\x45\x01',
      boldOff: '\x1B\x45\x00',
      center: '\x1B\x61\x01',
      left: '\x1B\x61\x00',
      right: '\x1B\x61\x02',
      doubleSize: '\x1D\x21\x11',
      normalSize: '\x1D\x21\x00',
      cut: '\x1D\x56\x00',
      feed: '\x0A'
    };

    const data = [
      esc.init,
      esc.center,
      esc.boldOn,
      esc.doubleSize,
      `${property?.name || 'RESTAURANT'}\n`,
      esc.normalSize,
      `${property?.address || ''}\n`,
      `${property?.phone ? 'PH: ' + property.phone : ''}\n`,
      esc.boldOff,
      '--------------------------------\n',
      esc.center,
      'INVOICE\n',
      esc.left,
      `Bill: ${billData.orderNo}\n`,
      `Table: ${billData.tableNo || 'WALK-IN'}\n`,
      `Date: ${new Date().toLocaleString()}\n`,
      '--------------------------------\n',
      'ITEM             QTY    PRICE\n',
      '--------------------------------\n'
    ];

    billData.items.forEach((item: any) => {
      // 32 chars total: 18 for name, 4 for qty, 10 for price
      const name = item.name.substring(0, 18).padEnd(18);
      const qty = item.quantity.toString().padStart(4);
      const total = (item.quantity * item.price).toFixed(0).padStart(10);
      data.push(`${name}${qty}${total}\n`);
    });

    data.push('--------------------------------\n');
    data.push(esc.right);
    data.push(`Subtotal: ₹${billData.subtotal.toFixed(2)}\n`);
    data.push(`Tax (5%): ₹${billData.tax.toFixed(2)}\n`);
    data.push(esc.boldOn);
    data.push(`TOTAL:    ₹${billData.grandTotal.toFixed(2)}\n`);
    data.push(esc.boldOff);
    data.push('--------------------------------\n');
    data.push(esc.center);
    data.push('THANK YOU!\n');
    data.push('VISIT AGAIN\n');
    data.push(esc.feed);
    data.push(esc.feed);
    data.push(esc.feed);
    data.push(esc.cut);

    return data;
  }

  /**
   * Sends a test print to the printer
   */
  async testPrint(printerName: string) {
    const data = [
      '\x1B\x40',          // Init
      '\x1B\x61\x01',      // Center
      '\x1B\x45\x01',      // Bold On
      'TEST PRINT - ESC/POS\n',
      'QZ Tray Integration\n',
      '--------------------------------\n',
      '\x1B\x45\x00',      // Bold Off
      '\x1B\x61\x00',      // Left
      `Time: ${new Date().toLocaleTimeString()}\n`,
      `Printer: ${printerName}\n`,
      '--------------------------------\n',
      'If you see this, your printer\n',
      'supports RAW ESC/POS commands.\n',
      '\x0A\x0A\x0A\x0A',  // Feeds
      '\x1D\x56\x00'       // Cut
    ];
    await this.printRaw(printerName, data);
  }

  /**
   * Sends a simple text test print (no ESC/POS)
   */
  async testPrintSimple(printerName: string) {
    const data = [
      'TEST PRINT - SIMPLE TEXT\n',
      '--------------------------------\n',
      `Printer: ${printerName}\n`,
      'This test uses no ESC/POS commands.\n',
      'Just plain text and newlines.\n',
      '\n\n\n\n'
    ];
    await this.printRaw(printerName, data);
  }

  /**
   * Fetches the list of available printers from QZ Tray
   */
  async findPrinters() {
    await this.connect();
    return await qz.printers.find();
  }
}

export const printerService = new PrinterService();
