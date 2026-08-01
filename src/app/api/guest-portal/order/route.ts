import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: NextRequest) {
  try {
    // Verify guest session
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    let payload: any;
    try {
      const result = await jwtVerify(token, key, { algorithms: ['HS256'] });
      payload = result.payload;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }
    if (payload.type !== 'GUEST_PORTAL') {
      return NextResponse.json({ success: false, message: 'Invalid session type' }, { status: 401 });
    }

    const body = await request.json();
    const { items, notes, diningOption = 'ROOM_SERVICE', serveOption = 'NOW', scheduledTime, tableId, tableName } = body;
    // items: [{ productId, name, qty, unitPrice, variantId?, variantName? }]

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'No items in order' }, { status: 400 });
    }

    // Get guest's latest active reservation to get propertyId and room
    const guest = await prisma.guest.findUnique({
      where: { id: payload.guestId as string },
      include: {
        reservations: {
          where: { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            rooms: { include: { room: true } },
            folios: { where: { status: 'OPEN' } }
          }
        }
      }
    });

    if (!guest) {
      return NextResponse.json({ success: false, message: 'Guest not found' }, { status: 404 });
    }

    const reservation = guest.reservations[0];
    if (!reservation) {
      return NextResponse.json({ success: false, message: 'No active reservation found. You need an active booking to place an order.' }, { status: 400 });
    }

    const propertyId = reservation.propertyId;
    const roomNumber = reservation.rooms?.[0]?.room?.roomNumber;
    const folioId = reservation.folios?.[0]?.id || null;

    // Find first active outlet for this property
    const outlet = await prisma.outlet.findFirst({
      where: { propertyId }
    });

    if (!outlet) {
      return NextResponse.json({ success: false, message: 'No outlet found for this property.' }, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    for (const item of items) {
      const lineTotal = item.unitPrice * item.qty;
      subtotal += lineTotal;
      if (item.taxRate) {
        taxAmount += lineTotal * (item.taxRate / 100);
      }
    }
    const grandTotal = subtotal + taxAmount;

    // Generate order number
    const orderNo = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const isDineIn = diningOption === 'DINE_IN';
    const orderType = isDineIn ? 'DINE_IN' : 'ROOM_SERVICE';
    const tableNo = isDineIn
      ? (tableName ? `${tableName}${roomNumber ? ' (Room ' + roomNumber + ')' : ''}` : `Restaurant Table${roomNumber ? ' (Room ' + roomNumber + ')' : ''}`)
      : (roomNumber ? `Room ${roomNumber}` : 'Room Service');

    const serveTimeText = serveOption === 'SCHEDULED' ? (scheduledTime || 'Scheduled') : 'ASAP';
    const deliveryInstructions = `SERVE_TIME:${serveTimeText}|TYPE:${diningOption}${tableName ? '|TABLE:' + tableName : ''}${roomNumber ? '|ROOM:' + roomNumber : ''}${notes ? '|NOTE:' + notes : ''}`;

    // Create POS order
    const order = await prisma.posOrder.create({
      data: {
        propertyId,
        outletId: outlet.id,
        folioId,
        orderNo,
        orderType,
        tableNo,
        restaurantTableId: isDineIn ? (tableId || null) : null,
        deliveryInstructions,
        guestId: guest.id,
        status: 'PENDING',
        subtotal,
        taxAmount,
        grandTotal,
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.qty,
            unitPrice: item.unitPrice,
            taxAmount: item.taxRate ? item.unitPrice * item.qty * (item.taxRate / 100) : 0,
            totalAmount: item.unitPrice * item.qty,
            variantId: item.variantId || null,
            variantName: item.variantName || null,
          }))
        }
      },
      include: { items: true }
    });

    if (isDineIn && tableId) {
      await prisma.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      }).catch(() => {});
    }

    const successMsg = isDineIn
      ? `🎉 Pre-order placed for ${tableName || 'Restaurant Table'}! Serving time: ${serveTimeText}.`
      : `🎉 Room Service order placed! Delivering at ${serveTimeText} to Room ${roomNumber || ''}.`;

    return NextResponse.json({
      success: true,
      data: {
        orderNo: order.orderNo,
        grandTotal: order.grandTotal,
        status: order.status,
        orderType,
        tableNo,
        roomNumber,
        serveTimeText,
      },
      message: successMsg
    }, { status: 201 });
  } catch (error: any) {
    console.error('[Guest Portal Order Error]:', error);
    return NextResponse.json({ success: false, message: error.message || 'Failed to place order' }, { status: 500 });
  }
}

// GET — guest's order history
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    let payload: any;
    try {
      const result = await jwtVerify(token, key, { algorithms: ['HS256'] });
      payload = result.payload;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }

    const orders = await prisma.posOrder.findMany({
      where: { guestId: payload.guestId as string },
      include: { items: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
