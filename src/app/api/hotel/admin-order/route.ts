import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

// POST /api/hotel/admin-order
// Handles two order types:
//   type: "FOOD"    → creates a PosOrder (room service) + notifies HOTEL_RECEPTIONIST
//   type: "STOCK"   → creates an inventory notification for HOTEL_RECEPTIONIST (purchase request)

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { type, propertyId: bodyPropertyId } = body;

    let propertyId = bodyPropertyId || session.propertyId;
    if (!propertyId && session.organizationId) {
      const prop = await prisma.property.findFirst({
        where: { organizationId: session.organizationId, OR: [{ hmsEnabled: true }, { type: 'HOTEL' }] },
        select: { id: true },
      });
      propertyId = prop?.id;
    }
    if (!propertyId) return NextResponse.json({ message: 'No property context' }, { status: 400 });

    // ── FOOD ORDER ────────────────────────────────────────────────────────────
    if (type === 'FOOD') {
      const { items, guestName, roomNo, note, tableNo } = body;
      if (!items?.length) return NextResponse.json({ message: 'No items selected' }, { status: 400 });

      // Build order number
      const orderNo = `RM-${Date.now().toString(36).toUpperCase()}`;
      const grandTotal = items.reduce((s: number, i: any) => s + (i.price * i.qty), 0);

      // Create POS order (Room Service type)
      const posOrder = await prisma.posOrder.create({
        data: {
          propertyId,
          orderNo,
          orderType: 'ROOM_SERVICE',
          status: 'PENDING',
          tableNo: roomNo ? `Room ${roomNo}` : (tableNo || 'Admin Order'),
          guestCount: 1,
          grandTotal,
          subTotal: grandTotal,
          taxTotal: 0,
          discountTotal: 0,
          note: note || `Admin room service order for ${guestName || 'Guest'}`,
          deliveryCustomerName: guestName || null,
          items: {
            create: items.map((it: any) => ({
              propertyId,
              productId: it.productId,
              productName: it.name,
              quantity: it.qty,
              unitPrice: it.price,
              totalAmount: it.price * it.qty,
              variantName: null,
            })),
          },
        },
      });

      // Notify HOTEL_RECEPTIONIST users
      const receptionists = await prisma.user.findMany({
        where: {
          propertyId,
          isActive: true,
          role: { name: 'HOTEL_RECEPTIONIST' },
        },
        select: { id: true },
      });

      const itemsList = items.map((i: any) => `${i.name} x${i.qty}`).join(', ');
      await prisma.notification.create({
        data: {
          propertyId,
          title: `🍽️ Room Service Order — ${guestName || 'Guest'}${roomNo ? ` (Room ${roomNo})` : ''}`,
          message: `Admin placed a room service order: ${itemsList}. Total: ₹${grandTotal.toLocaleString('en-IN')}. Order No: ${orderNo}`,
          type: 'ORDER',
          priority: 'HIGH',
          status: 'UNREAD',
          metadata: JSON.stringify({ orderNo, orderId: posOrder.id, guestName, roomNo, items, grandTotal, placedBy: session.fullName || 'Hotel Admin' }),
        },
      });

      return NextResponse.json({ success: true, message: 'Food order placed & receptionist notified', data: { orderNo, orderId: posOrder.id } });
    }

    // ── STOCK / PURCHASE ORDER ────────────────────────────────────────────────
    if (type === 'STOCK') {
      const { items, note, supplierName } = body;
      if (!items?.length) return NextResponse.json({ message: 'No items selected' }, { status: 400 });

      const itemsList = items.map((i: any) => `${i.name}: ${i.requestedQty} ${i.unit || 'pcs'}`).join(', ');
      const poNo = `PO-${Date.now().toString(36).toUpperCase()}`;

      await prisma.notification.create({
        data: {
          propertyId,
          title: `📦 Purchase Order Request — ${poNo}`,
          message: `Admin raised a stock purchase order. Items: ${itemsList}. Supplier: ${supplierName || 'TBD'}. Note: ${note || 'Urgent restock needed'}`,
          type: 'INVENTORY',
          priority: 'HIGH',
          status: 'UNREAD',
          metadata: JSON.stringify({ poNo, items, supplierName, note, placedBy: session.fullName || 'Hotel Admin' }),
        },
      });

      return NextResponse.json({ success: true, message: 'Purchase order sent to receptionist', data: { poNo } });
    }

    return NextResponse.json({ message: 'Invalid order type' }, { status: 400 });
  } catch (error: any) {
    console.error('[admin-order]', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
