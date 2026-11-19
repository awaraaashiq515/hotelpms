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
    // Default to Serial for USB/Bluetooth
    let printerPath = printer.ipAddress || printer.name || 'MPT-II';
    if (process.platform === 'darwin') {
      if (printerPath === 'MPT-II' || !printerPath.startsWith('/dev/')) {
        printerPath = '/dev/cu.MPT-II';
      } else if (printerPath.startsWith('/dev/tty.')) {
        printerPath = '/dev/cu.' + printerPath.slice(9);
      }
    }
    await printDirect(data, printerPath);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bill, hotelBill, property, isTest, kotData, printerId } = body;
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
    let targetPrinters: any[] = [];
    
    if (printerId) {
      const p = await prisma.printer.findUnique({ where: { id: printerId } });
      if (p) targetPrinters.push(p);
    } else if (isTest) {
       // Just use the first available printer or property default
       const p = await prisma.printer.findFirst({ where: { propertyId } });
       if (p) targetPrinters.push(p);
    } else if (hotelBill) {
       // Find Hotel Bill Printer
       const p = await prisma.printer.findFirst({ 
         where: { propertyId, isHotelBill: true, isEnabled: true } 
       });
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

    let webSerialJobs: { printerId: string, ipAddress: string | null, data: string }[] = [];

    for (const printer of targetPrinters) {
        let data = '';
        data += ESC_POS.INIT;

        // Apply Printer Specific Settings
        // Note: paperSize handling can be added here (e.g. adjusting characters per line)
        const charsPerLine = printer.paperSize === '58mm' ? 32 : 48;

        const isMptPrinter = /mpt/i.test(printer.name || '') || /mpt/i.test(printer.ipAddress || '');
        const shouldCut = printer.autoCut && !isMptPrinter;

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
          if (shouldCut) data += ESC_POS.CUT;
          
          if (printer.connectionType === 'WEB_SERIAL') {
            webSerialJobs.push({ printerId: (printer as any).id ?? '', ipAddress: printer.ipAddress, data });
          } else {
            await sendToPrinter(data, printer);
          }
          continue;
        }

        if (kotData) {
            const rawType = (kotData.orderType || '').toUpperCase();
            const tableStr = String(kotData.tableNo || '');
            const isRoomService = rawType === 'ROOM_SERVICE' || !!kotData.roomNumber || tableStr.toLowerCase().startsWith('room');
            const isTakeaway = rawType === 'TAKEAWAY' || rawType === 'PICKUP' || tableStr.toLowerCase().includes('pick') || tableStr.toLowerCase().includes('takeaway');
            const isDelivery = rawType === 'DELIVERY' || tableStr.toLowerCase().includes('delivery');

            let bannerTitle = 'DINE IN ORDER';
            let destTitle = `TABLE: ${tableStr || 'WALK-IN'}`;

            if (isRoomService) {
              bannerTitle = 'ROOM SERVICE';
              const rNum = kotData.roomNumber || tableStr.replace(/^Room\s*/i, '') || 'ROOM';
              destTitle = `ROOM: ${rNum}`;
            } else if (isTakeaway) {
              bannerTitle = 'TAKEAWAY / PICKUP';
              destTitle = 'COUNTER PICKUP';
            } else if (isDelivery) {
              bannerTitle = 'HOME DELIVERY';
              destTitle = 'DELIVERY ORDER';
            }

            data += ESC_POS.ALIGN_CENTER;
            data += ESC_POS.BOLD_ON;
            data += ESC_POS.DOUBLE_SIZE;
            data += 'KOT TICKET\n';
            data += `*** ${bannerTitle} ***\n`;
            data += `${destTitle}\n`;
            data += ESC_POS.NORMAL_SIZE;
            data += ESC_POS.BOLD_OFF;
            data += `Order: #${kotData.orderNo || ''}\n`;
            if (kotData.kotNo) data += `KOT No: ${kotData.kotNo}\n`;
            if (kotData.guestName) data += `Guest: ${kotData.guestName}\n`;
            data += '--------------------------------\n';
            data += ESC_POS.ALIGN_LEFT;
            data += 'QTY  ITEM\n';
            data += '--------------------------------\n';
            
            kotData.items.forEach((item: any) => {
                data += `${item.quantity.toString().padEnd(4)} ${item.name || item.itemName || item.product?.name || 'Item'}\n`;
                if (item.notes) {
                    data += `     * ${item.notes}\n`;
                }
            });
            
            data += '--------------------------------\n';
            data += ESC_POS.FEED.repeat(6);
            if (shouldCut) data += ESC_POS.CUT;
            
            if (printer.connectionType === 'WEB_SERIAL') {
              webSerialJobs.push({ printerId: (printer as any).id ?? '', ipAddress: printer.ipAddress, data });
            } else {
              await sendToPrinter(data, printer);
            }
            continue;
        }

        if (hotelBill) {
            const hGstin = hotelBill.hotelGstin || property?.taxDetails || (property as any)?.gstNumber || '02AABCG1234A1Z5';
            const isB2b = Boolean(hotelBill.guestGstin || hotelBill.guestCompany);

            data += ESC_POS.ALIGN_CENTER;
            data += ESC_POS.BOLD_ON;
            data += `${property?.name || 'HOTEL PROPERTY'}\n`;
            data += ESC_POS.BOLD_OFF;
            if (property?.address) data += `${property.address}\n`;
            if (property?.phone) data += `Tel: ${property.phone}\n`;
            data += `Hotel GSTIN: ${hGstin}\n`;
            if (hotelBill.placeOfSupply) data += `Place of Supply: ${hotelBill.placeOfSupply}\n`;
            data += '--------------------------------\n';
            data += ESC_POS.ALIGN_CENTER;
            data += ESC_POS.BOLD_ON;
            data += `${isB2b ? 'TAX INVOICE (B2B)' : 'TAX INVOICE'}\n`;
            data += ESC_POS.BOLD_OFF;
            data += '--------------------------------\n';
            data += ESC_POS.ALIGN_LEFT;
            data += `Invoice: ${hotelBill.invoiceNo || hotelBill.folioNo || 'N/A'}\n`;
            if (hotelBill.guestCompany) data += `Company: ${hotelBill.guestCompany}\n`;
            if (hotelBill.guestName) data += `Guest:   ${hotelBill.guestName}\n`;
            if (hotelBill.guestGstin) data += `Recipient GSTIN: ${hotelBill.guestGstin}\n`;
            if (hotelBill.roomNumber) data += `Room:    ${hotelBill.roomNumber}\n`;
            if (hotelBill.checkIn && hotelBill.checkOut) data += `Stay:    ${hotelBill.checkIn} - ${hotelBill.checkOut}\n`;
            data += `Date:    ${new Date().toLocaleDateString('en-GB')}\n`;
            data += '--------------------------------\n';
            data += 'DESCRIPTION         QTY    AMOUNT\n';
            data += '--------------------------------\n';
            const items = Array.isArray(hotelBill.items) ? hotelBill.items : [];
            if (items.length === 0) {
              const totalVal = Number(hotelBill.totalAmount || hotelBill.grandTotal || 0).toFixed(0);
              data += `Room Charges        1     ${totalVal.padStart(7)}\n`;
            } else {
              items.forEach((item: any) => {
                const name = (item.description || item.name || 'Charge').substring(0, 18).padEnd(18);
                const qty = Number(item.quantity || 1).toString().padStart(4);
                const amt = Number(item.amount || item.total || 0).toFixed(0).padStart(10);
                data += `${name}${qty}${amt}\n`;
              });
            }
            data += '--------------------------------\n';

            // Print official SAC-wise GST Breakdown
            if (Array.isArray(hotelBill.gstRows) && hotelBill.gstRows.length > 0) {
              data += ESC_POS.ALIGN_CENTER;
              data += ESC_POS.BOLD_ON;
              data += 'GST TAX BREAKDOWN (SAC WISE)\n';
              data += ESC_POS.BOLD_OFF;
              data += ESC_POS.ALIGN_LEFT;
              hotelBill.gstRows.forEach((row: any) => {
                const sacCat = `SAC ${row.sac} (${(row.category || '').substring(0, 16)})`;
                data += `${sacCat}\n`;
                data += `  Taxable Value: Rs.${Number(row.taxable || 0).toFixed(2)}\n`;
                if (row.cgstAmt > 0 || row.sgstAmt > 0) {
                  data += `  CGST ${row.cgstRate}%: Rs.${Number(row.cgstAmt || 0).toFixed(2)} | SGST ${row.sgstRate}%: Rs.${Number(row.sgstAmt || 0).toFixed(2)}\n`;
                } else if (row.igstAmt > 0) {
                  data += `  IGST ${row.igstRate}%: Rs.${Number(row.igstAmt || 0).toFixed(2)}\n`;
                }
              });
              data += '--------------------------------\n';
            }

            data += ESC_POS.ALIGN_RIGHT;
            const subtotal = Number(hotelBill.subtotal || hotelBill.totalAmount || 0);
            const tax = Number(hotelBill.taxAmount || 0);
            const grandTotal = Number(hotelBill.grandTotal || hotelBill.totalAmount || (subtotal + tax));
            data += `Taxable Net: Rs.${subtotal.toFixed(2)}\n`;
            if (tax > 0) data += `Total GST:   Rs.${tax.toFixed(2)}\n`;
            data += ESC_POS.BOLD_ON;
            data += `TOTAL:       Rs.${grandTotal.toFixed(2)}\n`;
            data += ESC_POS.BOLD_OFF;
            if (hotelBill.totalPayments !== undefined && Number(hotelBill.totalPayments) > 0) {
              data += `Paid:        Rs.${Number(hotelBill.totalPayments).toFixed(2)}\n`;
            }
            if (hotelBill.closingBalance !== undefined) {
              data += `Balance:     Rs.${Number(hotelBill.closingBalance).toFixed(2)}\n`;
            }
            data += '--------------------------------\n';
            data += ESC_POS.ALIGN_CENTER;
            data += 'THANK YOU FOR STAYING!\n';
            data += ESC_POS.FEED.repeat(6);
            if (shouldCut) data += ESC_POS.CUT;

            if (printer.connectionType === 'WEB_SERIAL') {
              webSerialJobs.push({ printerId: (printer as any).id ?? '', ipAddress: printer.ipAddress, data });
            } else {
              await sendToPrinter(data, printer);
            }
            continue;
        }

        if (bill) {
            // ── Header ────────────────────────────────────────────
            data += ESC_POS.ALIGN_CENTER;
            data += ESC_POS.BOLD_ON;
            data += `${property?.name || 'RESTAURANT'}\n`;
            data += ESC_POS.BOLD_OFF;
            if (property?.address) data += `${property.address}\n`;
            if (property?.phone) data += `PH: ${property.phone}\n`;
            if (property?.taxDetails) data += `GSTIN: ${property.taxDetails}\n`;
            data += '--------------------------------\n';

            // ── Bill info ─────────────────────────────────────────
            data += ESC_POS.ALIGN_LEFT;
            data += `Bill: ${bill.orderNo || 'N/A'}\n`;
            data += `Table: ${bill.tableNo || 'WALK-IN'}\n`;
            data += `Date: ${new Date().toLocaleString()}\n`;
            data += '--------------------------------\n';
            data += 'ITEM             QTY    PRICE\n';
            data += '--------------------------------\n';

            // ── Items ─────────────────────────────────────────────
            // item.price (frontend) OR item.unitPrice/sellingPrice (DB)
            const billItems: any[] = Array.isArray(bill.items) ? bill.items : [];
            if (billItems.length === 0) {
              data += '(no items)\n';
            } else {
              billItems.forEach((item: any) => {
                const itemName = (item.name || item.itemName || item.product?.name || 'Item').substring(0, 18).padEnd(18);
                const qty = Number(item.quantity) || 0;
                // Support all common price field names from different call sites
                const unitPrice = Number(
                  item.price ?? item.unitPrice ?? item.sellingPrice ?? item.basePrice ?? 0
                );
                const lineTotal = (qty * unitPrice).toFixed(0).padStart(10);
                data += `${itemName}${qty.toString().padStart(4)}${lineTotal}\n`;
              });
            }

            // ── Totals ────────────────────────────────────────────
            const subtotal   = Number(bill.subtotal  ?? bill.subtotalAmount ?? 0);
            const tax        = Number(bill.tax       ?? bill.taxAmount      ?? 0);
            const memDisc    = Number(bill.membershipDiscount ?? 0);
            const manDisc    = Number(bill.manualDiscount     ?? 0);
            const totalDisc  = memDisc + manDisc;
            // Prefer the pre-calculated grandTotal, fallback to computed
            const grandTotal = Number(
              bill.grandTotal ?? bill.totalAmount ?? Math.max(0, subtotal + tax - totalDisc)
            );
            const taxLabel = bill.taxLabel || 'Tax';

            data += '--------------------------------\n';
            data += ESC_POS.ALIGN_RIGHT;
            data += `Subtotal: Rs.${subtotal.toFixed(2)}\n`;
            if (memDisc > 0) data += `Membership: -Rs.${memDisc.toFixed(2)}\n`;
            if (manDisc > 0) data += `Discount:   -Rs.${manDisc.toFixed(2)}\n`;
            data += `${taxLabel}: Rs.${tax.toFixed(2)}\n`;
            data += ESC_POS.BOLD_ON;
            data += `TOTAL:    Rs.${grandTotal.toFixed(2)}\n`;
            data += ESC_POS.BOLD_OFF;
            data += '--------------------------------\n';
            data += ESC_POS.ALIGN_CENTER;
            data += 'THANK YOU!\n';
            data += 'VISIT AGAIN\n';
            data += ESC_POS.FEED.repeat(6);
            if (shouldCut) data += ESC_POS.CUT;

            if (printer.connectionType === 'WEB_SERIAL') {
              webSerialJobs.push({ printerId: (printer as any).id ?? '', ipAddress: printer.ipAddress, data });
            } else {
              await sendToPrinter(data, printer);
            }
            continue;
        }
    }

    return NextResponse.json({ success: true, message: 'Print command(s) processed', webSerialJobs });
  } catch (error: any) {
    console.error('Print API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to print' 
    }, { status: 500 });
  }
}
