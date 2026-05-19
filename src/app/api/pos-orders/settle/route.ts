import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

// Reuse the same order schema as the create endpoint
const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be > 0'),
  unitPrice: z.number().min(0),
  discountAmount: z.number().default(0),
  taxAmount: z.number().default(0),
});

const settleOrderSchema = z.object({
  propertyId: z.string().optional(),
  outletId: z.string().optional(),
  orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']).optional().default('DINE_IN'),
  restaurantTableId: z.string().optional(),
  driverId: z.string().nullable().optional(),
  guestId: z.string().nullable().optional(),
  guestCount: z.number().int().optional().default(1),
  paymentModeId: z.string(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least 1 item'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    // Map PICKUP to TAKEAWAY for compatibility
    if (body.orderType === 'PICKUP') body.orderType = 'TAKEAWAY';
    const parsed = settleOrderSchema.parse(body);
    const { items, paymentModeId, ...orderData } = parsed;

    // Resolve property & outlet like the create endpoint
    const propertyId = orderData.propertyId || session.propertyId;
    if (!propertyId) return apiError(new Error('Property ID missing'), 400);
    let outletId = orderData.outletId;
    if (!outletId) {
      const outlet = await prisma.outlet.findFirst({ where: { propertyId } });
      if (!outlet) return apiError(new Error('POS Outlet not found'), 400);
      outletId = outlet.id;
    }

    // Find the existing open order for this table
    let existingOrder = null;
    if (orderData.restaurantTableId) {
      existingOrder = await prisma.posOrder.findFirst({
        where: {
          restaurantTableId: orderData.restaurantTableId,
          status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'PAYMENT_AWAITING_APPROVAL'] },
        },
        include: { items: true },
      });
    }

    if (!existingOrder) {
      // If it's a direct settle without an existing order, we must create it!
      // However, current UI flow expects KOT/Save to be hit first.
      return apiError(new Error('No active order found for this table. Please click SAVE or KOT before settling.'), 400);
    }

    // Update items – add new quantities (same logic as create endpoint)
    await Promise.all(
      items.map(async (item) => {
        const existingItem = existingOrder.items.find((i: any) => i.productId === item.productId);
        if (existingItem) {
          await prisma.posOrderItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + item.quantity,
              totalAmount: (existingItem.quantity + item.quantity) * item.unitPrice,
            },
          });
        } else {
          await prisma.posOrderItem.create({
            data: { ...item, posOrderId: existingOrder.id, totalAmount: (item.quantity * item.unitPrice) - item.discountAmount + item.taxAmount },
          });
        }
      })
    );

    // Recalculate totals
    const allItems = await prisma.posOrderItem.findMany({ where: { posOrderId: existingOrder.id } });
    const subtotal = allItems.reduce((sum: number, i: any) => sum + i.totalAmount, 0);
    const taxAmount = subtotal * 0.05; // simple tax rule
    const grandTotal = subtotal + taxAmount;

    // Update order status to SETTLED and totals
    const settledOrder = await prisma.posOrder.update({
      where: { id: existingOrder.id },
      data: { 
        status: 'SETTLED', 
        subtotal, 
        taxAmount, 
        grandTotal,
        guestId: orderData.guestId || undefined,
        guestCount: orderData.guestCount,
        driverId: orderData.driverId || undefined
      },
      include: { items: { include: { product: true } } },
    });

    // Update table status to VACANT if it's a dine-in order
    if (settledOrder.restaurantTableId) {
      await prisma.table.update({
        where: { id: settledOrder.restaurantTableId },
        data: { status: 'VACANT' }
      });
    }

    // Create a settlement record
    const settlement = await prisma.settlement.create({
      data: {
        propertyId,
        settlementNo: `SET-${Date.now()}`,
        settlementDate: new Date(),
        sourceType: 'POS_ORDER',
        sourceId: settledOrder.id,
        orderId: settledOrder.id,
        paymentModeId: paymentModeId,
        guestId: orderData.guestId || undefined,
        grossAmount: grandTotal,
        paidAmount: grandTotal,
        balanceAmount: 0,
        status: 'SETTLED',
      },
    });

    // Return the settled order together with settlement info
    return apiResponse({ order: settledOrder, settlement }, 'Order settled successfully', 200);
  } catch (error) {
    console.error('[SETTLE] error', error);
    return apiError(error);
  }
}
