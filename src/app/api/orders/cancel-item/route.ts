import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { orderItemId, cancelQuantity, reason } = body;

    if (!orderItemId || !cancelQuantity || cancelQuantity <= 0 || !reason) {
      return NextResponse.json({ success: false, error: 'Invalid parameters: requires orderItemId, cancelQuantity, reason' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Find PosOrderItem
      const orderItem = await (tx as any).posOrderItem.findUnique({
        where: { id: orderItemId },
        include: { 
          posOrder: true,
          kotItems: {
            where: { status: { not: 'CANCELLED' } }
          }
        }
      });

      if (!orderItem) throw new Error('Order item not found');
      if (orderItem.quantity < cancelQuantity) throw new Error('Cannot cancel more than ordered quantity');

      // 2. Identify KOT Items to cancel
      // We need to cancel 'cancelQuantity' amount. 
      // KOT items might be grouped (e.g., quantity: 2). We'll split or just decrement.
      let qtyToCancel = cancelQuantity;
      
      for (const kotItem of orderItem.kotItems) {
        if (qtyToCancel <= 0) break;
        
        // For MVP: if KOT item quantity > qtyToCancel, we decrement it.
        // If <= qtyToCancel, we mark it CANCELLED
        const cancelFromThis = Math.min(kotItem.quantity, qtyToCancel);
        
        if (cancelFromThis === kotItem.quantity) {
          await (tx as any).kotItem.update({
            where: { id: kotItem.id },
            data: { status: 'CANCELLED', notes: `Cancelled: ${reason}` }
          });
        } else {
          // Decrement KOT item and create a new cancelled one for the split
          await (tx as any).kotItem.update({
             where: { id: kotItem.id },
             data: { quantity: kotItem.quantity - cancelFromThis }
          });
          
          await (tx as any).kotItem.create({
             data: {
               kotId: kotItem.kotId,
               orderItemId: kotItem.orderItemId,
               productId: kotItem.productId,
               itemName: kotItem.itemName,
               quantity: cancelFromThis,
               status: 'CANCELLED',
               notes: `Cancelled: ${reason}`
             }
          });
        }

        // Audit Log for cancellation
        await (tx as any).kotStatusLog.create({
          data: {
             kotId: kotItem.kotId,
             oldStatus: kotItem.status,
             newStatus: 'CANCELLED',
             changedBy: (session as any).user?.name || 'System',
             remarks: `Cancelled ${cancelFromThis}x ${kotItem.itemName} - ${reason}`
          }
        });
        
        qtyToCancel -= cancelFromThis;
      }

      // 3. Update PosOrderItem & PosOrder totals
      const newQty = orderItem.quantity - cancelQuantity;
      let newTotal = 0;

      if (newQty <= 0) {
        await (tx as any).posOrderItem.delete({ where: { id: orderItem.id } });
      } else {
        newTotal = newQty * orderItem.unitPrice;
        await (tx as any).posOrderItem.update({
          where: { id: orderItem.id },
          data: { quantity: newQty, totalAmount: newTotal }
        });
      }

      // Recalculate PosOrder
      const remainingItems = await (tx as any).posOrderItem.findMany({
        where: { posOrderId: orderItem.posOrderId },
        include: { product: true }
      });
      
      let subtotal = 0;
      let taxAmount = 0;
      let grandTotal = 0;

      for (const i of remainingItems) {
        const itemTotal = i.totalAmount;
        const taxRate = i.product.taxRate ?? 5;
        const taxType = i.product.taxType || 'EXCLUSIVE';

        let itemSub = 0;
        let itemTax = 0;
        let itemGrand = 0;

        if (taxType === 'EXEMPT') {
          itemSub = itemTotal;
          itemTax = 0;
          itemGrand = itemTotal;
        } else if (taxType === 'INCLUSIVE') {
          itemSub = itemTotal / (1 + (taxRate / 100));
          itemTax = itemTotal - itemSub;
          itemGrand = itemTotal;
        } else { // EXCLUSIVE
          itemSub = itemTotal;
          itemTax = itemTotal * (taxRate / 100);
          itemGrand = itemTotal + itemTax;
        }

        // Update item level tax in db
        await (tx as any).posOrderItem.update({
          where: { id: i.id },
          data: { taxAmount: itemTax }
        });

        subtotal += itemSub;
        taxAmount += itemTax;
        grandTotal += itemGrand;
      }

      await (tx as any).posOrder.update({
        where: { id: orderItem.posOrderId },
        data: { subtotal, taxAmount, grandTotal }
      });

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Cancel Item Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
