import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slotId, items, customerName, customerPhone, vehicleNumber, guestCount, serviceMode } = body;

    if (!slotId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid order data' }, { status: 400 });
    }

    // Find the parking slot and its property
    const slot = await (prisma as any).parkingSlot.findUnique({
      where: { id: slotId },
      include: { property: true },
    });

    if (!slot) {
      return NextResponse.json({ success: false, message: 'Parking slot not found' }, { status: 404 });
    }

    const propertyId = slot.propertyId;

    // Get default outlet
    let outletId: string | null = null;
    const defaultOutlet = await prisma.outlet.findFirst({ where: { propertyId } });
    outletId = defaultOutlet?.id || null;

    if (!outletId) {
      return NextResponse.json(
        { success: false, message: 'Outlet not configured for this restaurant' },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Find or create active order for this slot
      let order = await tx.posOrder.findFirst({
        where: {
          parkingSlotId: slotId,
          status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'BILL_PRINTED'] },
          orderType: 'PARKING',
        },
        include: { items: true },
      });

      if (!order) {
        order = await tx.posOrder.create({
          data: {
            propertyId,
            outletId,
            orderNo: `PARK-${Date.now()}`,
            orderType: serviceMode === 'PACKED' ? 'TAKEAWAY' : 'PARKING',
            status: 'OPEN',
            parkingSlotId: slotId,
            tableNo: customerName || 'Parking Customer',
            vehicleNumber: vehicleNumber || null,
            guestCount: guestCount || 1,
          },
          include: { items: true },
        });
      }

      // Process items
      const newItemsForKot: any[] = [];
      let subtotalIncrease = 0;
      let taxAmountIncrease = 0;
      let grandTotalIncrease = 0;

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.id } });
        if (!product) continue;

        const unitPrice = product.sellingPrice;
        const totalAmountRaw = unitPrice * item.quantity;
        const taxRate = product.taxRate ?? 5;
        const taxType = product.taxType || 'EXCLUSIVE';

        let lineSubtotal = 0;
        let lineTax = 0;
        let lineGrandTotal = 0;

        if (taxType === 'EXEMPT') {
          lineSubtotal = totalAmountRaw;
          lineTax = 0;
          lineGrandTotal = totalAmountRaw;
        } else if (taxType === 'INCLUSIVE') {
          lineSubtotal = totalAmountRaw / (1 + taxRate / 100);
          lineTax = totalAmountRaw - lineSubtotal;
          lineGrandTotal = totalAmountRaw;
        } else {
          lineSubtotal = totalAmountRaw;
          lineTax = totalAmountRaw * (taxRate / 100);
          lineGrandTotal = totalAmountRaw + lineTax;
        }

        subtotalIncrease += lineSubtotal;
        taxAmountIncrease += lineTax;
        grandTotalIncrease += lineGrandTotal;

        const orderItem = await tx.posOrderItem.create({
          data: {
            posOrderId: order.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice,
            taxAmount: lineTax,
            totalAmount: totalAmountRaw,
          },
        });

        newItemsForKot.push({
          productId: product.id,
          itemName: product.name,
          quantity: item.quantity,
          orderItemId: orderItem.id,
        });
      }

      // Update order totals
      const updatedOrder = await tx.posOrder.update({
        where: { id: order.id },
        data: {
          subtotal: { increment: subtotalIncrease },
          taxAmount: { increment: taxAmountIncrease },
          grandTotal: { increment: grandTotalIncrease },
        },
      });

      // Create KOT
      const kotNo = `KOT-PARK-${Date.now()}`;
      const kotTicket = await tx.kotTicket.create({
        data: {
          kotNo,
          orderId: order.id,
          propertyId,
          outletId,
          parkingSlotId: slotId,
          tableNo: `PARK: ${slot.name} (${serviceMode === 'PACKED' ? 'PACKED' : 'IN-CAR'})`,
          status: 'NEW',
          createdBy: customerName ? `QR: ${customerName}` : 'Parking Customer',
        },
      });

      await tx.kotItem.createMany({
        data: newItemsForKot.map((item) => ({
          kotId: kotTicket.id,
          orderItemId: item.orderItemId,
          productId: item.productId,
          itemName: item.itemName,
          quantity: item.quantity,
          status: 'NEW',
        })),
      });

      // Update slot status
      await tx.parkingSlot.update({
        where: { id: slotId },
        data: { status: 'OCCUPIED' },
      });

      return { order: updatedOrder, kot: kotTicket };
    });

    return NextResponse.json({ success: true, message: 'Parking order placed successfully', data: result });
  } catch (error) {
    console.error('Parking Order Placement Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
