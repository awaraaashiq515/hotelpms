import { NextRequest, NextResponse } from 'next/server';
import { printDirect, ESC_POS } from '@/lib/serial-printer';
import { printToNetwork } from '@/lib/network-printer';
import { printToSystem } from '@/lib/system-printer';
import { prisma } from '@/lib/prisma';

async function sendToPrinter(data: string | Buffer, printer: any) {
  if (printer.connectionType === 'SYSTEM') {
    const printerName = printer.ipAddress || printer.name;
    await printToSystem(data, printerName);
  } else if (printer.connectionType === 'NETWORK' && printer.ipAddress) {
    await printToNetwork(data, printer.ipAddress, printer.port || 9100);
  } else {
    // Default to Serial for USB/Bluetooth (assuming they map to serial ports)
    // On macOS, Bluetooth printers often appear as /dev/tty.*
    const printerPath = printer.ipAddress || printer.name; // In serial mode, we use path or name
    const finalPath = printerPath === 'MPT-II' ? '/dev/tty.MPT-II' : printerPath;
    await printDirect(data, finalPath);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bill, property, isTest, kotData, printerId } = body;
    let propertyId = property?.id;

    // 🔍 If propertyId is missing, auto-detect from the database (single-property setup)
    if (!propertyId && !printerId) {
      const anyProp = await prisma.property.findFirst({ select: { id: true } });
      if (anyProp) {
        propertyId = anyProp.id;
        console.log(`[Print API] propertyId not supplied — auto-detected: ${propertyId}`);
      } else {
        return NextResponse.json({ success: false, message: 'No property found in database' }, { status: 400 });
      }
    }

    // 1. Determine which printer to use
    let targetPrinters = [];
    
    if (printerId) {
      const p = await prisma.printer.findUnique({ where: { id: printerId } });
      if (p) targetPrinters.push(p);
    } else if (isTest) {
       // Just use the first available printer or property default
       const p = await prisma.printer.findFirst({ where: { propertyId } });
       if (p) targetPrinters.push(p);
    } else if (kotData) {
       // Find Kitchen Printer
       const p = await prisma.printer.findFirst({ 
         where: { propertyId, isKitchen: true, isEnabled: true } 
       });
       if (p) targetPrinters.push(p);
    } else if (bill) {
       // Find Billing Printer
       const p = await prisma.printer.findFirst({ 
         where: { propertyId, isBilling: true, isEnabled: true } 
       });
       if (p) targetPrinters.push(p);
    }

    // Fallback: try any enabled printer for this property
    if (targetPrinters.length === 0) {
      const fallback = await prisma.printer.findFirst({ 
        where: { propertyId, isEnabled: true } 
      });
      if (fallback) {
        console.log(`[Print API] No role-specific printer found, using fallback: ${fallback.name}`);
        targetPrinters.push(fallback);
      }
    }

    // Final fallback: use hardcoded MPT-II path
    if (targetPrinters.length === 0) {
      console.log('[Print API] No printer in DB, using default MPT-II path');
      targetPrinters.push({
        connectionType: 'BLUETOOTH',
        name: 'MPT-II',
        ipAddress: '/dev/tty.MPT-II',
        autoCut: true,
        paperSize: '80mm'
      });
    }

    for (const printer of targetPrinters) {
        let data = '';
        data += ESC_POS.INIT;

        // Apply Printer Specific Settings
        // Note: paperSize handling can be added here (e.g. adjusting characters per line)
        const charsPerLine = printer.paperSize === '58mm' ? 32 : 48;

        if (isTest) {
          data += ESC_POS.ALIGN_CENTER;
          data += ESC_POS.BOLD_ON;
          data += 'TEST PRINT\n';
          data += `PRINTER: ${printer.name}\n`;
          data += ESC_POS.BOLD_OFF;
          data += '--------------------------------\n';
          data += `Conn: ${printer.connectionType}\n`;
          data += `IP: ${printer.ipAddress || 'N/A'}\n`;
          data += '--------------------------------\n';
          data += ESC_POS.FEED.repeat(6);
          if (printer.autoCut) data += ESC_POS.CUT;
          
          await sendToPrinter(data, printer);
          continue;
        }

        if (kotData) {
            data += ESC_POS.ALIGN_CENTER;
            data += ESC_POS.BOLD_ON;
            data += ESC_POS.DOUBLE_SIZE;
            data += 'KOT\n';
            data += ESC_POS.NORMAL_SIZE;
            data += ESC_POS.BOLD_OFF;
            data += `Order: ${kotData.orderNo}\n`;
            data += `Table: ${kotData.tableNo || 'N/A'}\n`;
            data += '--------------------------------\n';
            data += ESC_POS.ALIGN_LEFT;
            data += 'QTY  ITEM\n';
            data += '--------------------------------\n';
            
            kotData.items.forEach((item: any) => {
                data += `${item.quantity.toString().padEnd(4)} ${item.name}\n`;
                if (item.notes) {
                    data += `     * ${item.notes}\n`;
                }
            });
            
            data += '--------------------------------\n';
            data += ESC_POS.FEED.repeat(6);
            if (printer.autoCut) data += ESC_POS.CUT;
            
            await sendToPrinter(data, printer);
            continue;
        }

        if (bill) {
            data += ESC_POS.ALIGN_CENTER;
            data += ESC_POS.BOLD_ON;
            data += `${property?.name || 'RESTAURANT'}\n`;
            data += ESC_POS.BOLD_OFF;
            data += `${property?.address || ''}\n`;
            data += `${property?.phone ? 'PH: ' + property.phone : ''}\n`;
            data += '--------------------------------\n';
            data += ESC_POS.ALIGN_LEFT;
            data += `Bill: ${bill.orderNo}\n`;
            data += `Table: ${bill.tableNo || 'WALK-IN'}\n`;
            data += `Date: ${new Date().toLocaleString()}\n`;
            data += '--------------------------------\n';
            data += 'ITEM             QTY    PRICE\n';
            data += '--------------------------------\n';
            
            bill.items.forEach((item: any) => {
              const name = item.name.substring(0, 18).padEnd(18);
              const qty = item.quantity.toString().padStart(4);
              const total = (item.quantity * item.price).toFixed(0).padStart(10);
              data += `${name}${qty}${total}\n`;
            });
            
            data += '--------------------------------\n';
            data += ESC_POS.ALIGN_RIGHT;
            data += `Subtotal: Rs.${bill.subtotal.toFixed(2)}\n`;
            if (bill.membershipDiscount > 0) {
              data += `Discount: -Rs.${bill.membershipDiscount.toFixed(2)}\n`;
            }
            data += `Tax (5%): Rs.${bill.tax.toFixed(2)}\n`;
            data += ESC_POS.BOLD_ON;
            data += `TOTAL:    Rs.${bill.grandTotal.toFixed(2)}\n`;
            data += ESC_POS.BOLD_OFF;
            data += '--------------------------------\n';
            data += ESC_POS.ALIGN_CENTER;
            data += 'THANK YOU!\n';
            data += 'VISIT AGAIN\n';
            data += ESC_POS.FEED.repeat(6);
            if (printer.autoCut) data += ESC_POS.CUT;

            await sendToPrinter(data, printer);
            continue;
        }
    }

    return NextResponse.json({ success: true, message: 'Print command(s) sent' });
  } catch (error: any) {
    console.error('Print API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to print' 
    }, { status: 500 });
  }
}
