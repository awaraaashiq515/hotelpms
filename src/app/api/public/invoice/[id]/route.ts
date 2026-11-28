import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const rawId = decodeURIComponent(resolvedParams.id || '').trim();

    if (!rawId) {
      return NextResponse.json({ success: false, message: 'Invoice ID is required' }, { status: 400 });
    }

    // 1. Search in Invoice model
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { invoiceNo: rawId },
          { id: rawId },
        ],
      },
      include: {
        property: true,
        guest: true,
        items: true,
        folio: {
          include: {
            transactions: { orderBy: { txnDate: 'asc' } },
            reservation: {
              include: {
                rooms: { include: { room: true } },
                roomType: true,
                guest: true,
                checkIns: true,
              },
            },
          },
        },
      },
    });

    if (invoice) {
      const prop = invoice.property as any;
      const invoiceAny = invoice as any;
      const res = invoiceAny.folio?.reservation;
      const gst: any = invoiceAny.guest || res?.guest;
      const roomNum = res?.rooms?.[0]?.room?.roomNumber || invoice.tableNo || '—';
      const roomTypeName = res?.roomType?.name || 'Standard Accommodation';

      const arrivalDate = res?.arrivalDate ? new Date(res.arrivalDate).toLocaleDateString('en-GB') : '—';
      const departureDate = res?.departureDate ? new Date(res.departureDate).toLocaleDateString('en-GB') : '—';
      const nights = (res?.arrivalDate && res?.departureDate)
        ? Math.max(1, Math.round((new Date(res.departureDate).getTime() - new Date(res.arrivalDate).getTime()) / 86400000))
        : 1;

      let items: any[] = [];
      if (invoiceAny.items && invoiceAny.items.length > 0) {
        items = invoiceAny.items.map((it: any) => ({
          description: it.description || 'Service Charge',
          hsnCode: it.hsnCode || it.sacCode || '996311',
          qty: it.qty || 1,
          rate: it.unitPrice || 0,
          taxAmount: it.taxAmount || 0,
          total: it.totalAmount || (it.qty * it.unitPrice),
        }));
      } else if (invoiceAny.folio?.transactions && invoiceAny.folio.transactions.length > 0) {
        items = invoiceAny.folio.transactions
          .filter((t: any) => t.txnType === 'DEBIT')
          .map((t: any) => ({
            description: t.description || 'Accommodation Charge',
            hsnCode: '996311',
            qty: 1,
            rate: t.debitAmount - (t.taxAmount || 0),
            taxAmount: t.taxAmount || 0,
            total: t.debitAmount,
          }));
      }

      if (items.length === 0) {
        items.push({
          description: `Room Stay & Accommodation (Room ${roomNum})`,
          hsnCode: '996311',
          qty: nights,
          rate: (invoice.subtotal || invoice.totalAmount) / nights,
          taxAmount: invoice.taxAmount || 0,
          total: invoice.totalAmount || 0,
        });
      }

      const subtotal = invoice.subtotal || items.reduce((s: number, i: any) => s + (i.rate * i.qty), 0);
      const taxAmount = invoice.taxAmount || 0;
      const grandTotal = invoice.totalAmount || (subtotal + taxAmount);
      const totalPaid = invoice.paymentStatus === 'PAID' || invoice.invoiceStatus === 'SETTLED' ? grandTotal : 0;
      const dueBalance = Math.max(0, grandTotal - totalPaid);

      return NextResponse.json({
        success: true,
        data: {
          type: 'HOTEL_INVOICE',
          invoiceNo: invoice.invoiceNo,
          invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB'),
          invoiceTime: new Date(invoice.invoiceDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          paymentStatus: invoice.paymentStatus || 'PAID',
          invoiceStatus: invoice.invoiceStatus || 'SETTLED',
          hotel: {
            name: prop?.name || 'OrderMint Hotel & Resort',
            address: [prop?.address, prop?.city, prop?.state, prop?.pincode].filter(Boolean).join(', ') || 'Himachal Pradesh, India',
            phone: prop?.phone || '+91 82190 07878',
            email: prop?.email || 'support@ordermintpms.tech',
            gstin: prop?.gstNumber || '02BMAPG7310Q2Z6',
            fssai: prop?.fssaiNumber || null,
          },
          guest: {
            name: `${gst?.firstName || 'Valued'} ${gst?.lastName || 'Guest'}`.trim(),
            mobile: gst?.mobile || '—',
            email: gst?.email || '—',
            gstin: gst?.gstNumber || null,
            companyName: gst?.companyName || null,
            address: gst?.billingAddress || gst?.address || null,
          },
          stay: {
            bookingNo: res?.bookingNo || '—',
            roomNumber: roomNum,
            roomType: roomTypeName,
            checkIn: arrivalDate,
            checkOut: departureDate,
            nights,
            adults: res?.adults || 1,
            children: res?.children || 0,
          },
          items,
          summary: {
            subtotal,
            taxAmount,
            cgst: taxAmount / 2,
            sgst: taxAmount / 2,
            discountAmount: invoice.discountAmount || 0,
            grandTotal,
            totalPaid,
            dueBalance,
          },
        },
      });
    }

    // 2. Search in PosOrder model
    const posOrder = await prisma.posOrder.findFirst({
      where: {
        OR: [
          { orderNo: rawId },
          { id: rawId },
        ],
      },
      include: {
        property: true,
        outlet: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (posOrder) {
      const prop = posOrder.property as any;
      const posAny = posOrder as any;
      const outletName = posAny.outlet?.name || 'Restaurant & Dining';
      const items = posAny.items.map((it: any) => ({
        description: it.product?.name || 'Food & Beverage Item',
        hsnCode: '996331',
        qty: it.quantity,
        rate: it.unitPrice,
        taxAmount: it.taxAmount || 0,
        total: it.totalAmount,
      }));

      const subtotal = posOrder.subtotal || items.reduce((s: number, i: any) => s + (i.rate * i.qty), 0);
      const taxAmount = posOrder.taxAmount || 0;
      const grandTotal = posOrder.grandTotal;
      const isSettled = ['SETTLED', 'COMPLETED', 'DELIVERED', 'PAID'].includes(posOrder.status);

      return NextResponse.json({
        success: true,
        data: {
          type: 'POS_ORDER',
          invoiceNo: posOrder.orderNo,
          invoiceDate: new Date(posOrder.createdAt).toLocaleDateString('en-GB'),
          invoiceTime: new Date(posOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          paymentStatus: isSettled ? 'PAID' : 'UNPAID',
          invoiceStatus: posOrder.status,
          hotel: {
            name: prop?.name || 'OrderMint Restaurant',
            outlet: outletName,
            address: [prop?.address, prop?.city, prop?.state, prop?.pincode].filter(Boolean).join(', ') || 'Himachal Pradesh, India',
            phone: prop?.phone || '+91 82190 07878',
            email: prop?.email || 'support@ordermintpms.tech',
            gstin: prop?.gstNumber || '02BMAPG7310Q2Z6',
            fssai: prop?.fssaiNumber || null,
          },
          guest: {
            name: posAny.deliveryCustomerName || 'Guest',
            mobile: posAny.deliveryPhone || '—',
            tableNo: posAny?.tableNumber || null,
          },
          stay: null,
          items,
          summary: {
            subtotal,
            taxAmount,
            cgst: taxAmount / 2,
            sgst: taxAmount / 2,
            discountAmount: posAny?.discountAmount || 0,
            grandTotal,
            totalPaid: isSettled ? grandTotal : 0,
            dueBalance: isSettled ? 0 : grandTotal,
          },
        },
      });
    }

    // 3. Fallback: Search in Folio
    const folio = await prisma.folio.findFirst({
      where: {
        OR: [
          { folioNo: rawId },
          { id: rawId },
        ],
      },
      include: {
        transactions: { orderBy: { txnDate: 'asc' } },
        guest: true,
        reservation: {
          include: {
            property: true,
            rooms: { include: { room: true } },
            roomType: true,
          },
        },
      },
    });

    if (folio) {
      const folioAny = folio as any;
      const prop = folioAny.reservation?.property as any;
      const res = folioAny.reservation;
      const gst = folioAny.guest as any;
      const roomNum = res?.rooms?.[0]?.room?.roomNumber || '—';
      const roomTypeName = res?.roomType?.name || 'Standard Accommodation';

      const arrivalDate = res?.arrivalDate ? new Date(res.arrivalDate).toLocaleDateString('en-GB') : '—';
      const departureDate = res?.departureDate ? new Date(res.departureDate).toLocaleDateString('en-GB') : '—';

      const items = folioAny.transactions
        .filter((t: any) => t.txnType === 'DEBIT')
        .map((t: any) => ({
          description: t.description || 'Accommodation Charge',
          hsnCode: '996311',
          qty: 1,
          rate: t.debitAmount - (t.taxAmount || 0),
          taxAmount: t.taxAmount || 0,
          total: t.debitAmount,
        }));

      const grandTotal = folio.totalCharges || items.reduce((s: number, i: any) => s + i.total, 0);
      const totalPaid = folio.totalPayments || 0;
      const taxAmount = items.reduce((s: number, i: any) => s + i.taxAmount, 0);

      const folioDate = folioAny.transactions?.[0]?.txnDate || res?.arrivalDate || new Date();

      return NextResponse.json({
        success: true,
        data: {
          type: 'FOLIO_BILL',
          invoiceNo: folio.folioNo,
          invoiceDate: new Date(folioDate).toLocaleDateString('en-GB'),
          invoiceTime: new Date(folioDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          paymentStatus: folio.closingBalance <= 0 ? 'PAID' : 'DUE',
          invoiceStatus: folio.status,
          hotel: {
            name: prop?.name || 'OrderMint Hotel & Resort',
            address: [prop?.address, prop?.city, prop?.state, prop?.pincode].filter(Boolean).join(', ') || 'Himachal Pradesh, India',
            phone: prop?.phone || '+91 82190 07878',
            email: prop?.email || 'support@ordermintpms.tech',
            gstin: prop?.gstNumber || '02BMAPG7310Q2Z6',
          },
          guest: {
            name: `${gst?.firstName || 'Valued'} ${gst?.lastName || 'Guest'}`.trim(),
            mobile: gst?.mobile || '—',
            email: gst?.email || '—',
          },
          stay: {
            bookingNo: res?.bookingNo || '—',
            roomNumber: roomNum,
            roomType: roomTypeName,
            checkIn: arrivalDate,
            checkOut: departureDate,
          },
          items,
          summary: {
            subtotal: grandTotal - taxAmount,
            taxAmount,
            cgst: taxAmount / 2,
            sgst: taxAmount / 2,
            discountAmount: 0,
            grandTotal,
            totalPaid,
            dueBalance: Math.max(0, folio.closingBalance),
          },
        },
      });
    }

    return NextResponse.json({ success: false, message: 'Bill or invoice record not found.' }, { status: 404 });
  } catch (error: any) {
    console.error('[Public Invoice API Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Internal error' }, { status: 500 });
  }
}
