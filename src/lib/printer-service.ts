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
    // Intercept print requests inside Android Capacitor App
    if (typeof window !== 'undefined' && (window as any).Capacitor && (window as any).Capacitor.getPlatform() === 'android') {
      console.log("Detecting Android Capacitor environment — redirecting to Android Bluetooth Serial print");
      try {
        await this.printViaAndroidBluetooth(printerName, data);
        return;
      } catch (err: any) {
        console.error("Android Bluetooth Serial printing failed:", err);
        throw err;
      }
    }

    try {
      await this.connect();
      
      const config = qz.configs.create(printerName, {
        rasterize: false,
        encoding: 'ISO-8859-1',
        interpolation: 'nearest-neighbor',
        forceRaw: true
      });

      await qz.print(config, data);
    } catch (e: any) {
      // Fallback to Web Serial if QZ Tray is not connected or active or throws an error,
      // and if the printerName looks like a serial/COM port path (starts with /dev/, COM, etc. or matches Bluetooth/USB patterns)
      const looksLikeSerial = printerName.startsWith('/dev/') || printerName.startsWith('COM') || /usb|blue|mpt|blth|rfcomm/i.test(printerName);
      if (looksLikeSerial && typeof window !== 'undefined') {
        console.warn("QZ Tray printing failed or not connected. Trying Web Serial fallback for port:", printerName);
        try {
          const { WebSerialPrinter } = await import('./web-serial-printer');
          // Format raw ESC/POS commands (strings or binary chars) into a single string
          const dataString = data.join('');
          await WebSerialPrinter.print(dataString, printerName);
          console.log("Printed successfully via Web Serial fallback!");
          return;
        } catch (serialErr: any) {
          console.error("Web Serial fallback failed:", serialErr);
          throw new Error(`Printing failed: QZ Tray error (${e.message}) AND Web Serial fallback error (${serialErr.message})`);
        }
      }

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
   * Prints raw ESC/POS commands via Cordova Bluetooth Serial on Android
   */
  async printViaAndroidBluetooth(printerName: string, data: any[]) {
    // Helper function to wait for plugins to load/initialize asynchronously
    const waitForPlugins = () => {
      return new Promise<void>((resolve) => {
        if (typeof window === 'undefined') {
          resolve();
          return;
        }
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

    if (!bluetoothSerial) {
      throw new Error("Bluetooth printing is not initialized or the plugin was not loaded properly.");
    }

    // 1. Request Bluetooth permissions on Android (permissions are handled by cordova-plugin-android-permissions)
    if (permissions) {
      const scanPermission = "android.permission.BLUETOOTH_SCAN";
      const connectPermission = "android.permission.BLUETOOTH_CONNECT";
      const locationPermission = "android.permission.ACCESS_FINE_LOCATION";
      
      const checkPermission = (perm: string): Promise<boolean> => {
        return new Promise((resolve) => {
          permissions.hasPermission(perm, (status: any) => resolve(!!status?.hasPermission), () => resolve(false));
        });
      };

      const requestPermissionList = (perms: string[]): Promise<boolean> => {
        return new Promise((resolve) => {
          permissions.requestPermissions(perms, (status: any) => resolve(!!status?.hasPermission), () => resolve(false));
        });
      };

      const hasScan = await checkPermission(scanPermission);
      const hasConnect = await checkPermission(connectPermission);
      const hasLocation = await checkPermission(locationPermission);

      const neededPermissions: string[] = [];
      if (!hasScan) neededPermissions.push(scanPermission);
      if (!hasConnect) neededPermissions.push(connectPermission);
      if (!hasLocation) neededPermissions.push(locationPermission);

      if (neededPermissions.length > 0) {
        console.log("Requesting Android Bluetooth/Location permissions...", neededPermissions);
        const granted = await requestPermissionList(neededPermissions);
        if (!granted) {
          console.warn("Android Bluetooth permissions were not explicitly granted by the user. Trying to proceed anyway.");
        }
      }
    }

    // Check and enable Bluetooth if it's off
    const isBtEnabled = await new Promise<boolean>((resolve) => {
      bluetoothSerial.isEnabled(() => resolve(true), () => resolve(false));
    });
    if (!isBtEnabled) {
      console.log("Bluetooth is disabled. Requesting user to turn it on...");
      await new Promise<void>((resolve, reject) => {
        bluetoothSerial.enable(() => resolve(), (err: any) => reject(new Error("Please turn on Bluetooth to print.")));
      });
    }

    // 2. Disconnect if already connected to any device to ensure a clean connection state
    const isConnected = await new Promise<boolean>((resolve) => {
      bluetoothSerial.isConnected(() => resolve(true), () => resolve(false));
    });

    if (isConnected) {
      console.log("Bluetooth Serial plugin is currently connected. Disconnecting to start fresh...");
      await new Promise<void>((resolve) => {
        bluetoothSerial.disconnect(() => resolve(), () => resolve());
      });
    }

    // Helper to extract MAC address from a string
    const extractMacAddress = (str: string): string | null => {
      const match = str.match(/([0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2}[:-][0-9A-Fa-f]{2})/);
      return match ? match[1] : null;
    };

    // 3. Scan for paired Bluetooth devices
    console.log("Scanning paired Bluetooth devices...");
    const devices: any[] = await new Promise((resolve, reject) => {
      bluetoothSerial.list((list: any[]) => resolve(list), (err: any) => reject(err));
    });

    console.log("Found paired devices:", devices);

    // 4. Find matching device by Name, ID, or Address (case-insensitive, trimmed)
    let targetAddress = "";
    let targetName = printerName;

    const macInPrinterName = extractMacAddress(printerName);
    if (macInPrinterName) {
      targetAddress = macInPrinterName;
      const match = devices.find(d => 
        (d.address && d.address.toLowerCase() === targetAddress.toLowerCase()) ||
        (d.id && d.id.toLowerCase() === targetAddress.toLowerCase())
      );
      if (match) {
        targetName = match.name || printerName;
      }
    } else {
      const cleanPrinterName = printerName.trim().toLowerCase();
      let match = devices.find(d => 
        (d.name && d.name.trim().toLowerCase() === cleanPrinterName) ||
        (d.id && d.id.trim().toLowerCase() === cleanPrinterName) ||
        (d.address && d.address.trim().toLowerCase() === cleanPrinterName)
      );

      // Substring fallback
      if (!match) {
        match = devices.find(d => 
          (d.name && (d.name.toLowerCase().includes(cleanPrinterName) || cleanPrinterName.includes(d.name.toLowerCase()))) ||
          (d.id && (d.id.toLowerCase().includes(cleanPrinterName) || cleanPrinterName.includes(d.id.toLowerCase()))) ||
          (d.address && (d.address.toLowerCase().includes(cleanPrinterName) || cleanPrinterName.includes(d.address.toLowerCase())))
        );
      }

      if (match) {
        targetAddress = match.address || match.id;
        targetName = match.name || targetName;
      } else {
        // Check if printerName itself is a valid MAC address format
        if (/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(printerName.trim())) {
          targetAddress = printerName.trim();
        } else {
          const names = devices.map(d => d.name || d.id || d.address).join(", ");
          throw new Error(`Bluetooth printer "${printerName}" not found. Please pair it in Android Bluetooth Settings first. Paired devices: [${names}]`);
        }
      }
    }

    console.log(`Connecting to Bluetooth printer: ${targetName} (${targetAddress})...`);

    // 5. Connect to the device (try secure first, then fall back to insecure)
    await new Promise<void>((resolve, reject) => {
      bluetoothSerial.connect(targetAddress, () => {
        console.log("Connected to Bluetooth printer successfully!");
        resolve();
      }, (err: any) => {
        console.warn(`Secure Bluetooth connection to ${targetAddress} failed: ${err || 'unknown'}. Trying insecure fallback...`);
        bluetoothSerial.connectInsecure(targetAddress, () => {
          console.log("Connected to Bluetooth printer via insecure channel successfully!");
          resolve();
        }, (insecureErr: any) => {
          reject(new Error(`Failed to connect to printer: Secure error: ${err || 'unknown'}, Insecure error: ${insecureErr || 'unknown'}`));
        });
      });
    });

    // 6. Format the print job raw ESC/POS string
    const dataString = data.join('');
    
    // Convert character codes to a Uint8Array buffer
    const buffer = new Uint8Array(dataString.length);
    for (let i = 0; i < dataString.length; i++) {
      buffer[i] = dataString.charCodeAt(i) & 0xFF;
    }

    console.log("Writing ESC/POS binary buffer to printer...");

    // 7. Write data to the printer (pass underlying ArrayBuffer for plugin compatibility)
    await new Promise<void>((resolve, reject) => {
      bluetoothSerial.write(buffer.buffer, () => {
        console.log("Print job sent successfully!");
        resolve();
      }, (err: any) => {
        reject(new Error(`Failed to print: ${err}`));
      });
    });

    // 8. Sleep for a moment (3 seconds) to let the printer process the buffer and then disconnect safely
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("Disconnecting from Bluetooth printer...");
    await new Promise<void>((resolve) => {
      bluetoothSerial.disconnect(() => resolve(), () => resolve());
    });
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
    data.push(esc.feed);
    data.push(esc.feed);
    // data.push(esc.cut); // Removed for MPT-II compatibility

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

    // Safe getters for numeric values to support different property naming and fallback calculations
    const getSubtotal = () => {
      const val = billData.subtotal !== undefined && billData.subtotal !== null ? billData.subtotal : billData.subtotalAmount;
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
      // Fallback: calculate from items
      return (billData.items || []).reduce((sum: number, item: any) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.price !== undefined && item.price !== null ? item.price : item.unitPrice) || 0;
        return sum + (qty * price);
      }, 0);
    };

    const getTax = () => {
      const val = billData.tax !== undefined && billData.tax !== null ? billData.tax : billData.taxAmount;
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
      // Fallback: 5% of calculated subtotal
      return getSubtotal() * 0.05;
    };

    const getMembershipDiscount = () => {
      const val = billData.membershipDiscount !== undefined && billData.membershipDiscount !== null ? billData.membershipDiscount : billData.discountAmount;
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : 0;
    };

    const getManualDiscount = () => {
      const val = billData.manualDiscount;
      const num = Number(val);
      return !isNaN(num) && num > 0 ? num : 0;
    };

    const getGrandTotal = () => {
      const val = billData.grandTotal !== undefined && billData.grandTotal !== null ? billData.grandTotal : billData.totalAmount;
      const num = Number(val);
      if (!isNaN(num) && num > 0) return num;
      // Fallback: subtotal + tax - discounts
      const sub = getSubtotal();
      const tx = getTax();
      const disc = getMembershipDiscount() + getManualDiscount();
      return Math.max(0, sub + tx - disc);
    };

    const subtotalAmt = getSubtotal();
    const taxAmt = getTax();
    const discountAmt = getMembershipDiscount() + getManualDiscount();
    const totalAmt = getGrandTotal();
    const taxLabel = billData.taxLabel || 'Tax';

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
      `Bill: ${billData.orderNo || 'N/A'}\n`,
      `Table: ${billData.tableNo || 'WALK-IN'}\n`,
      `Date: ${new Date().toLocaleString()}\n`,
      '--------------------------------\n',
      'ITEM             QTY    PRICE\n',
      '--------------------------------\n'
    ];

    (billData.items || []).forEach((item: any) => {
      // 32 chars total: 18 for name, 4 for qty, 10 for price
      const name = (item.name || item.itemName || 'Item').substring(0, 18).padEnd(18);
      const qty = (Number(item.quantity) || 0);
      const price = (Number(item.price !== undefined && item.price !== null ? item.price : item.unitPrice) || 0);
      const total = (qty * price).toFixed(0).padStart(10);
      data.push(`${name}${qty.toString().padStart(4)}${total}\n`);
    });

    data.push('--------------------------------\n');
    data.push(esc.right);
    data.push(`Subtotal: Rs.${subtotalAmt.toFixed(2)}\n`);
    if (discountAmt > 0) {
      data.push(`Discount: -Rs.${discountAmt.toFixed(2)}\n`);
    }
    data.push(`${taxLabel}: Rs.${taxAmt.toFixed(2)}\n`);
    data.push(esc.boldOn);
    data.push(`TOTAL:    Rs.${totalAmt.toFixed(2)}\n`);
    data.push(esc.boldOff);
    data.push('--------------------------------\n');
    data.push(esc.center);
    data.push('THANK YOU!\n');
    data.push('VISIT AGAIN\n');
    data.push(esc.feed);
    data.push(esc.feed);
    data.push(esc.feed);
    data.push(esc.feed);
    data.push(esc.feed);
    // data.push(esc.cut); // Removed for MPT-II compatibility

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
      '\x0A\x0A\x0A\x0A\x0A\x0A',  // Extra Feeds for manual tearing
      // '\x1D\x56\x00'       // Cut (Removed for MPT-II)
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

  /**
   * Fetches the list of available serial ports from QZ Tray
   */
  async findSerialPorts() {
    await this.connect();
    return await qz.serial.findPorts();
  }
}

export const printerService = new PrinterService();
