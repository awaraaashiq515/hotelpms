import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableId, items, customerName, customerPhone } = body;

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid order data' }, { status: 400 });
    }

    // 1. Find the table and property info
    const table = await prisma.table.findUnique({
      where: { id: tableId },
      include: {
        floor: {
          select: {
            outletId: true,
          },
        },
      },
    });

    if (!table) {
      return NextResponse.json({ success: false, message: 'Table not found' }, { status: 404 });
    }

    const propertyId = table.propertyId;
    let outletId = table.floor.outletId;

    // 2. Ensure an outlet exists
    if (!outletId) {
      const defaultOutlet = await prisma.outlet.findFirst({
        where: { propertyId },
      });
      outletId = defaultOutlet?.id || null;
    }

    if (!outletId) {
      return NextResponse.json({ success: false, message: 'Outlet not configured for this restaurant' }, { status: 400 });
    }

    // 3. Process the order in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Find or create an active order for this table
      let order = await tx.posOrder.findFirst({
        where: {
          restaurantTableId: tableId,
          status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'HOLD', 'PAYMENT_AWAITING_APPROVAL'] },
          orderType: 'DINE_IN',
        },
        include: { items: true },
      });

      if (!order) {
        order = await tx.posOrder.create({
          data: {
            propertyId,
            outletId,
            orderNo: `QR-${Date.now()}`,
            orderType: 'DINE_IN',
            status: 'OPEN',
            restaurantTableId: tableId,
            tableNo: table.name,
            // Optionally store customer info if provided
            guestCount: 1,
          },
          include: { items: true },
        });
      }

      // 4. Create Order Items and prepare for KOT
      const newItemsForKot: any[] = [];
      let subtotalIncrease = 0;
      let taxAmountIncrease = 0;
      let grandTotalIncrease = 0;

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.id },
        });

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
          lineSubtotal = totalAmountRaw / (1 + (taxRate / 100));
          lineTax = totalAmountRaw - lineSubtotal;
          lineGrandTotal = totalAmountRaw;
        } else { // EXCLUSIVE
          lineSubtotal = totalAmountRaw;
          lineTax = totalAmountRaw * (taxRate / 100);
          lineGrandTotal = totalAmountRaw + lineTax;
        }

        subtotalIncrease += lineSubtotal;
        taxAmountIncrease += lineTax;
        grandTotalIncrease += lineGrandTotal;

        // Create the order item
        const orderItem = await tx.posOrderItem.create({
          data: {
            posOrderId: order.id,
            productId: product.id,
            quantity: item.quantity,
            unitPrice: unitPrice,
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

      // 5. Update Order Totals
      const updatedOrder = await tx.posOrder.update({
        where: { id: order.id },
        data: {
          subtotal: { increment: subtotalIncrease },
          taxAmount: { increment: taxAmountIncrease }, 
          grandTotal: { increment: grandTotalIncrease },
        },
      });

      // 6. Create KOT
      const kotNo = `KOT-QR-${Date.now()}`;
      const kotTicket = await tx.kotTicket.create({
        data: {
          kotNo,
          orderId: order.id,
          propertyId,
          outletId,
          restaurantTableId: tableId,
          tableNo: table.name,
          status: 'NEW',
          createdBy: customerName ? `QR: ${customerName}` : 'QR Customer',
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

      // 7. Update Table Status
      await tx.table.update({
        where: { id: tableId },
        data: { status: 'KOT_RUNNING' },
      });

      return { order: updatedOrder, kot: kotTicket };
    });

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully',
      data: result,
    });
  } catch (error) {
    console.error('QR Order Placement Error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
