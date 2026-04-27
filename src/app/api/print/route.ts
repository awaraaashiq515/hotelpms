import { NextRequest, NextResponse } from 'next/server';
import { printDirect, ESC_POS } from '@/lib/serial-printer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bill, property, isTest, kotData } = body;

    // --- CASE 1: TEST PRINT ---
    if (isTest) {
      let data = '';
      data += ESC_POS.INIT;
      data += ESC_POS.ALIGN_CENTER;
      data += ESC_POS.BOLD_ON;
      data += 'TEST PRINT\n';
      data += 'SERIAL PORT WORKS\n';
      data += ESC_POS.BOLD_OFF;
      data += '--------------------------------\n';
      data += 'If you see this, your printer\n';
      data += 'is connected via Bluetooth.\n';
      data += ESC_POS.FEED.repeat(6);

      const printerPath = property?.thermalPrinterName === 'MPT-II' ? '/dev/tty.MPT-II' : property?.thermalPrinterName;
      await printDirect(data, printerPath || '/dev/tty.MPT-II');
      return NextResponse.json({ success: true, message: 'Test print sent' });
    }

    // --- CASE 2: KOT PRINT ---
    if (kotData) {
        let data = '';
        data += ESC_POS.INIT;
        data += ESC_POS.ALIGN_CENTER;
        data += ESC_POS.BOLD_ON;
        data += 'KOT\n';
        data += ESC_POS.BOLD_OFF;
        data += `Order: ${kotData.orderNo}\n`;
        data += `Table: ${kotData.tableNo}\n`;
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
        
        const printerPath = property?.thermalPrinterName === 'MPT-II' ? '/dev/tty.MPT-II' : property?.thermalPrinterName;
        await printDirect(data, printerPath || '/dev/tty.MPT-II');
        return NextResponse.json({ success: true, message: 'KOT printed successfully' });
    }

    // --- CASE 3: BILL PRINT ---
    if (bill) {
        let data = '';
        data += ESC_POS.INIT;
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

        const printerPath = property?.thermalPrinterName === 'MPT-II' ? '/dev/tty.MPT-II' : property?.thermalPrinterName;
        await printDirect(data, printerPath || '/dev/tty.MPT-II');
        return NextResponse.json({ success: true, message: 'Bill printed successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid request data' }, { status: 400 });
  } catch (error: any) {
    console.error('Print API Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Failed to print' 
    }, { status: 500 });
  }
}
