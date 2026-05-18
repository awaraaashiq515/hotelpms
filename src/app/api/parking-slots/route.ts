import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { apiError, getMultiTenantWhere } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const propertyIdParam = searchParams.get('propertyId') || session.propertyId;

    const where = getMultiTenantWhere(session, propertyIdParam);

    const parkingSlots = await (prisma as any).parkingSlot.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // For each slot, fetch active parking orders
    const openOrders = await (prisma as any).posOrder.findMany({
      where: {
        ...where,
        orderType: { in: ['PARKING', 'TAKEAWAY'] },
        status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'PAYMENT_AWAITING_APPROVAL'] },
      },
      include: { items: true, kotTickets: true },
    });

    const enriched = parkingSlots.map((slot: any) => {
      const slotOrders = openOrders.filter((o: any) => o.parkingSlotId === slot.id);
      let activeOrder = null;

      if (slotOrders.length > 0) {
        const primary = slotOrders[0];
        const totalAmount = slotOrders.reduce((s: number, o: any) => s + (o.grandTotal || 0), 0);
        const totalItems = slotOrders.reduce(
          (s: number, o: any) => s + o.items.reduce((is: number, i: any) => is + i.quantity, 0),
          0
        );
        const elapsedTime = Math.round((Date.now() - new Date(primary.createdAt).getTime()) / 60000);

        activeOrder = {
          id: primary.id,
          orderNo: primary.orderNo,
          amount: totalAmount,
          itemCount: totalItems,
          kotCount: slotOrders.reduce((s: number, o: any) => s + (o.kotTickets?.length || 0), 0),
          elapsedTime: Math.max(0, elapsedTime),
          status: primary.status,
          customerName: primary.tableNo, // We repurpose tableNo for customer name
          vehicleNumber: primary.vehicleNumber,
        };
      }

      return { ...slot, activeOrder };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error('Error fetching parking slots:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, width, height, x, y } = body;

    if (!name) {
      return NextResponse.json({ success: false, message: 'Slot name is required' }, { status: 400 });
    }

    const propertyId = session.propertyId;
    if (!propertyId) {
      return NextResponse.json({ success: false, message: 'Property ID is required' }, { status: 400 });
    }

    const slot = await (prisma as any).parkingSlot.create({
      data: {
        name: name.trim(),
        propertyId,
        status: 'VACANT',
        width: width ? parseInt(width) : 256,
        height: height ? parseInt(height) : 350,
        x: x ? parseFloat(x) : 0,
        y: y ? parseFloat(y) : 0
      },
    });

    return NextResponse.json({ success: true, data: slot });
  } catch (error) {
    console.error('Error creating parking slot:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
