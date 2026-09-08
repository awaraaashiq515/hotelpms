import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

async function verifyRoomPortalToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  const cookieToken = request.cookies.get('room_portal_session')?.value;
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (cookieToken || authHeader);
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    if ((payload as any).type !== 'ROOM_PORTAL') {
      return null;
    }
    return payload as any;
  } catch {
    return null;
  }
}

// POST: Submit a service request (housekeeping, front desk, etc.)
export async function POST(request: NextRequest) {
  try {
    const payload = await verifyRoomPortalToken(request);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { roomId, guestId, reservationId, propertyId } = payload;
    const body = await request.json();
    const { type, category, notes, priority } = body;

    // type: HOUSEKEEPING | FRONT_DESK | LAUNDRY | MAINTENANCE
    // category: CLEANING | TOWELS | AMENITIES | DND | OTHER
    if (!type) {
      return NextResponse.json({ success: false, message: 'Request type is required.' }, { status: 400 });
    }

    // Handle ROOM_SERVICE food orders: Create real PosOrder and post to Folio
    let createdPosOrder: any = null;
    let orderNo: string | null = null;
    let taskId: string | null = null;

    if (type === 'ROOM_SERVICE') {
      let roomNumber = (payload as any).roomNumber;
      if (!roomNumber && roomId) {
        const r = await prisma.room.findUnique({ where: { id: roomId }, select: { roomNumber: true } });
        roomNumber = r?.roomNumber || 'Unknown';
      }

      // Resolve Folio & Guest
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

      // Resolve Restaurant Property (e.g. RCH002)
      const baseHotelProp = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { id: true, code: true, name: true, organizationId: true, type: true },
      });

      let targetPropertyId = propertyId;
      if (baseHotelProp?.organizationId) {
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

      // Resolve or create outlet
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

      const items = Array.isArray(body.items) ? body.items : [];
      let subtotal = 0;
      const formattedItems = items.map((item: any) => {
        const unitPrice = Number(item.sellingPrice || item.unitPrice || 0);
        const qty = Number(item.qty || 1);
        const lineTotal = unitPrice * qty;
        subtotal += lineTotal;
        return {
          productId: item.id || item.productId || null,
          quantity: qty,
          unitPrice,
          totalAmount: lineTotal,
        };
      });

      const taxAmount = Math.round(subtotal * 0.05);
      const grandTotal = subtotal + taxAmount;
      orderNo = `RS-${Date.now().toString().slice(-6)}`;
      const deliveryInstructions = `SERVE_TIME:ASAP|TYPE:ROOM_SERVICE|ROOM:${roomNumber || 'Unknown'}${notes ? `|NOTE:${notes}` : ''}`;

      createdPosOrder = await prisma.posOrder.create({
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
            include: { product: true },
          },
        },
      });

      // Post charge to Folio
      if (folioId) {
        try {
          await prisma.folioTransaction.create({
            data: {
              folioId,
              txnType: 'DEBIT',
              sourceModule: 'ROOM_SERVICE',
              sourceRefId: createdPosOrder.id,
              description: `Room Service Food Order #${orderNo} (Room ${roomNumber || ''})`,
              debitAmount: grandTotal,
              creditAmount: 0,
              taxAmount,
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
          console.error('[Room Portal] Failed to post charge to folio:', folioErr);
        }
      }

      // Create staff task notification
      const task = await prisma.housekeepingTask.create({
        data: {
          propertyId,
          roomId,
          taskType: 'ROOM_SERVICE',
          priority: priority || 'HIGH',
          notes: `Food Order #${orderNo} placed from tablet kiosk. Room ${roomNumber}. Total: ₹${grandTotal}`,
          status: 'PENDING',
          requestedAt: new Date(),
          source: 'ROOM_PORTAL',
        },
      });
      taskId = task.id;
    } else if (type === 'HOUSEKEEPING' || type === 'LAUNDRY') {
      const task = await prisma.housekeepingTask.create({
        data: {
          propertyId,
          roomId,
          taskType: category || type,
          priority: priority || 'NORMAL',
          notes: notes || '',
          status: 'PENDING',
          requestedAt: new Date(),
          source: 'ROOM_PORTAL',
        },
      });
      taskId = task.id;
    }

    // Audit log
    await prisma.roomPortalActivityLog.create({
      data: {
        propertyId,
        roomId,
        guestId,
        reservationId,
        action: 'REQUEST',
        details: JSON.stringify({ type, category, notes, priority, taskId }),
      },
    });

    return NextResponse.json({
      success: true,
      message: type === 'ROOM_SERVICE' ? `Food Order #${orderNo} placed successfully!` : 'Your request has been submitted. Our team will attend to you shortly.',
      orderNo: orderNo || undefined,
      orderId: createdPosOrder?.id || undefined,
      order: createdPosOrder || undefined,
      data: { taskId, orderNo, orderId: createdPosOrder?.id, order: createdPosOrder },
    });
  } catch (error: any) {
    console.error('[Room Portal Request Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to submit request.' }, { status: 500 });
  }
}

// GET: Get status of submitted requests
export async function GET(request: NextRequest) {
  try {
    const payload = await verifyRoomPortalToken(request);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const { roomId } = payload;

    const tasks = await prisma.housekeepingTask.findMany({
      where: { roomId, source: 'ROOM_PORTAL' },
      orderBy: { requestedAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    console.error('[Room Portal Request GET Error]:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch requests.' }, { status: 500 });
  }
}
