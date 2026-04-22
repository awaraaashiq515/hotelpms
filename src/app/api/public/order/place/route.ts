import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';

/**
 * Public API to place an order from a QR code scan.
 * No authentication required.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, tableId, propertyId, guestName, guestPhone } = body;

    if (!tableId || !propertyId || !items || items.length === 0) {
      return apiError(new Error('Missing required fields (tableId, propertyId, items)'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Verify Property and Table
      const property = await tx.property.findUnique({
        where: { id: propertyId },
        select: { id: true, organizationId: true }
      });

      const table = await tx.table.findUnique({
        where: { id: tableId }
      });

      if (!table || !property || table.propertyId !== propertyId) {
        throw new Error('Invalid table or property reference');
      }

      // 1b. Handle Guest
      let guestId = null;
      if (guestPhone) {
        let guest = await tx.guest.findFirst({
          where: { 
            mobile: guestPhone,
            organizationId: property.organizationId
          }
        });

        if (!guest) {
          guest = await tx.guest.create({
            data: {
              name: guestName || 'Guest',
              mobile: guestPhone,
              organizationId: property.organizationId
            }
          });
        }
        guestId = guest.id;
      }

      // 2. Find or create the PosOrder
      let order = await tx.posOrder.findFirst({
        where: { 
          restaurantTableId: tableId,
          status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'BILL_PRINTED'] },
          orderType: 'DINE_IN'
        },
        include: { items: true }
      });

      const outlet = await tx.outlet.findFirst({
        where: { propertyId }
      });
      
      if (!outlet) {
        throw new Error('POS Outlet not found for this property.');
      }

      if (!order) {
        order = await tx.posOrder.create({
          data: {
            propertyId,
            outletId: outlet.id,
            orderNo: `QR-${Date.now()}`,
            orderType: 'DINE_IN',
            status: 'OPEN',
            restaurantTableId: tableId,
            tableNo: table.name,
            guestId: guestId, // Link guest
          },
          include: { items: true }
        });
      } else if (guestId && !order.guestId) {
        // Update existing order with guest if not already set
        await tx.posOrder.update({
          where: { id: order.id },
          data: { guestId }
        });
      }

      // 3. Process items for KOT
      const newItemsForKot: any[] = [];
      
      for (const item of items) {
        // Find existing item in order (if table already had an order)
        const existingItem = (order as any).items.find((ei: any) => ei.productId === item.id);
        
        // QR orders are usually additive. 
        // We assume 'item.quantity' is what they just added now.
        // But for safety, let's treat it as the TOTAL quantity they want of that item?
        // Actually, on a public menu, they might just click "Add" and "Place Order".
        // Let's assume the payload contains the NEW items they want to add.
        
        if (existingItem) {
          const newTotalQty = existingItem.quantity + item.quantity;
          await tx.posOrderItem.update({
            where: { id: existingItem.id },
            data: { 
              quantity: newTotalQty,
              totalAmount: newTotalQty * (item.sellingPrice || 0)
            }
          });
          newItemsForKot.push({ ...item, quantity: item.quantity, orderItemId: existingItem.id });
        } else {
          const newItem = await tx.posOrderItem.create({
            data: {
              posOrderId: order!.id,
              productId: item.id,
              quantity: item.quantity,
              unitPrice: item.sellingPrice || 0,
              totalAmount: item.quantity * (item.sellingPrice || 0),
            }
          });
          newItemsForKot.push({ ...item, quantity: item.quantity, orderItemId: newItem.id });
        }
      }

      // 4. Update Order Totals
      const allUpdatedItems = await tx.posOrderItem.findMany({
        where: { posOrderId: order!.id }
      });
      const subtotal = allUpdatedItems.reduce((sum: number, i: any) => sum + i.totalAmount, 0);
      const taxAmount = subtotal * 0.05; // Assuming fixed 5% for now, or fetch from settings
      const grandTotal = subtotal + taxAmount;

      await tx.posOrder.update({
        where: { id: order!.id },
        data: { subtotal, taxAmount, grandTotal }
      });

      // 5. Generate KOT
      let kotTicket: any = null;
      if (newItemsForKot.length > 0) {
        const kotNo = `KOT-QR-${Date.now()}`;
        
        kotTicket = await (tx as any).kotTicket.create({
          data: {
            kotNo,
            orderId: order!.id,
            propertyId,
            outletId: outlet.id,
            restaurantTableId: tableId,
            tableNo: table.name,
            status: 'NEW',
            createdBy: 'Self-Service (QR)'
          }
        });

        await (tx as any).kotItem.createMany({
          data: newItemsForKot.map((item: any) => {
            const orderItem = allUpdatedItems.find((ai: any) => ai.productId === item.id);
            return {
              kotId: kotTicket.id,
              orderItemId: orderItem.id,
              productId: item.id,
              itemName: item.name,
              quantity: item.quantity,
              status: 'NEW',
            };
          }),
        });
      }

      // 6. Update Table Status
      await (tx as any).table.update({
        where: { id: tableId },
        data: { status: 'KOT_RUNNING' }
      });

      return { orderNo: order!.orderNo, kotNo: kotTicket?.kotNo };
    });

    return apiResponse(result, 'Order placed successfully', 201);
  } catch (error) {
    console.error('Public Place Order Error:', error);
    return apiError(error);
  }
}
