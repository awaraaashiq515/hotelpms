import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Room Portal JWT token
    const authHeader = request.headers.get('Authorization') || '';
    const cookieToken = request.cookies.get('room_portal_session')?.value;
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized. Please login to Room Portal.' }, { status: 401 });
    }

    let payload: any;
    try {
      const result = await jwtVerify(token, key, { algorithms: ['HS256'] });
      payload = result.payload;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid or expired room portal session.' }, { status: 401 });
    }

    if (payload.type !== 'ROOM_PORTAL') {
      return NextResponse.json({ success: false, message: 'Invalid session type.' }, { status: 401 });
    }

    const { roomId, guestId, reservationId, propertyId, roomNumber } = payload;

    // 2. Read Request Body
    const body = await request.json();
    const { items, notes = '' } = body;
    // items: [{ id / productId, name, sellingPrice / unitPrice, qty }]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'No items in order.' }, { status: 400 });
    }

    // 3. Resolve Reservation and Folio
    let folioId: string | null = null;
    let resolvedGuestId: string | null = guestId || null;

    if (reservationId) {
      const reservation = await prisma.reservation.findUnique({
        where: { id: reservationId },
        include: { guest: true },
      });

      if (reservation) {
        resolvedGuestId = resolvedGuestId || reservation.guestId;
        const openFolio = await prisma.folio.findFirst({
          where: { reservationId: reservation.id, status: 'OPEN' },
        });

        if (openFolio) {
          folioId = openFolio.id;
        } else {
          // Create Open Folio if none exists
          const newFolio = await prisma.folio.create({
            data: {
              reservationId: reservation.id,
              guestId: reservation.guestId,
              folioNo: `FOL-${reservation.bookingNo || Date.now().toString().slice(-6)}`,
              status: 'OPEN',
              openingBalance: 0,
              totalCharges: 0,
              totalPayments: 0,
              closingBalance: 0,
            },
          });
          folioId = newFolio.id;
        }
      }
    }

    // 4. Resolve Restaurant Property & Outlet (e.g. RCH002)
    const baseHotelProp = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, code: true, name: true, organizationId: true, type: true },
    });

    let targetPropertyId = propertyId;
    if (baseHotelProp?.organizationId) {
      // Find the linked restaurant property (e.g. RCH002)
      const restaurantProp = await prisma.property.findFirst({
        where: {
          organizationId: baseHotelProp.organizationId,
          OR: [
            { type: 'RESTAURANT' },
            { code: 'RCH002' },
            { code: { contains: '002' } },
          ],
        },
        select: { id: true, code: true },
      });

      if (restaurantProp) {
        targetPropertyId = restaurantProp.id;
      }
    }

    // Find or create Outlet
    let outlet = await prisma.outlet.findFirst({
      where: { propertyId: targetPropertyId },
    });
    if (!outlet && propertyId !== targetPropertyId) {
      outlet = await prisma.outlet.findFirst({
        where: { propertyId },
      });
    }
    if (!outlet) {
      outlet = await prisma.outlet.create({
        data: {
          propertyId: targetPropertyId,
          name: 'Room Service Dining',
          type: 'RESTAURANT',
        },
      });
    }

    // 5. Calculate Order Totals
    let subtotal = 0;
    const formattedItems = items.map((item: any) => {
      const unitPrice = Number(item.sellingPrice || item.unitPrice || 0);
      const qty = Number(item.qty || 1);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      return {
        productId: item.id || item.productId || null,
        name: item.name || 'Item',
        quantity: qty,
        unitPrice,
        totalAmount: lineTotal,
      };
    });

    const taxAmount = Math.round(subtotal * 0.05); // 5% standard GST for restaurant room service
    const grandTotal = subtotal + taxAmount;
    const orderNo = `RS-${Date.now().toString().slice(-6)}`;
    const deliveryInstructions = `SERVE_TIME:ASAP|TYPE:ROOM_SERVICE|ROOM:${roomNumber || 'Unknown'}${notes ? `|NOTE:${notes}` : ''}`;

    // 6. Create POS Order in database
    const order = await prisma.posOrder.create({
      data: {
        propertyId: targetPropertyId,
        outletId: outlet.id,
        guestId: resolvedGuestId,
        folioId,
        orderNo,
        orderType: 'ROOM_SERVICE',
        tableNo: roomNumber ? `Room ${roomNumber}` : 'Room Service',
        status: 'CONFIRMED',
        subtotal,
        taxAmount,
        discountAmount: 0,
        grandTotal,
        deliveryInstructions,
        items: {
          create: formattedItems.map((fi: any) => ({
            productId: fi.productId,
            quantity: fi.quantity,
            unitPrice: fi.unitPrice,
            totalAmount: fi.totalAmount,
          })),
        },
      },
      include: {
        items: {
          include: { product: { select: { name: true, isVeg: true } } },
        },
      },
    });

    // 7. Post charge to Folio (if folio exists)
    if (folioId) {
      try {
        await prisma.folioTransaction.create({
          data: {
            folioId,
            txnType: 'DEBIT',
            sourceModule: 'ROOM_SERVICE',
            sourceRefId: order.id,
            description: `Room Service Food Order #${orderNo} (Room ${roomNumber || ''})`,
            debitAmount: grandTotal,
            creditAmount: 0,
            taxAmount: taxAmount,
            netAmount: grandTotal,
          },
        });

        await prisma.folio.update({
          where: { id: folioId },
          data: {
            totalCharges: { increment: grandTotal },
            closingBalance: { increment: grandTotal },
          },
        });
      } catch (folioErr) {
        console.error('[Room Portal Order] Failed to post charge to folio:', folioErr);
      }
    }

    // 8. Log activity
    await prisma.roomPortalActivityLog.create({
      data: {
        propertyId,
        roomId: roomId || 'kiosk',
        guestId: resolvedGuestId,
        reservationId,
        action: 'ROOM_SERVICE_ORDER',
        details: JSON.stringify({
          orderNo,
          orderId: order.id,
          grandTotal,
          itemsCount: formattedItems.length,
          roomNumber,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Room service order placed successfully!',
      orderNo,
      orderId: order.id,
      data: order,
    });
  } catch (error: any) {
    console.error('[Room Portal Order Error]:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to place order.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || '';
    const cookieToken = request.cookies.get('room_portal_session')?.value;
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || searchParams.get('id');
    const orderNo = searchParams.get('orderNo');

    if (orderId) {
      const order = await prisma.posOrder.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
      if (order) {
        return NextResponse.json({ success: true, data: order, order });
      }
    }

    if (orderNo) {
      const order = await prisma.posOrder.findUnique({
        where: { orderNo },
        include: {
          items: {
            include: { product: true },
          },
        },
      });
      if (order) {
        return NextResponse.json({ success: true, data: order, order });
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let payload: any;
    try {
      const result = await jwtVerify(token, key, { algorithms: ['HS256'] });
      payload = result.payload;
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid session' }, { status: 401 });
    }

    const { guestId, roomNumber } = payload;

    const order = await prisma.posOrder.findFirst({
      where: {
        orderType: 'ROOM_SERVICE',
        OR: [
          ...(guestId ? [{ guestId }] : []),
          ...(roomNumber ? [
            { deliveryInstructions: { contains: `ROOM:${roomNumber}` } },
            { tableNo: `Room ${roomNumber}` },
          ] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: order, order });
  } catch (error: any) {
    console.error('[Room Portal Order GET Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch order.' }, { status: 500 });
  }
}
