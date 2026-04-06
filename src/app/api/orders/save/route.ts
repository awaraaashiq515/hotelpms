import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

/**
 * Saves an open order (Dine-In) and generates a KOT for NEW items only.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { items, restaurantTableId, orderType = 'DINE_IN', staffMemberId } = body;

    if (!restaurantTableId && orderType === 'DINE_IN') {
      return apiError(new Error('Table ID is required for Dine-In orders'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Find or create the PosOrder
      let order = await tx.posOrder.findFirst({
        where: { 
          restaurantTableId: restaurantTableId,
          status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'BILL_PRINTED'] },
          orderType: 'DINE_IN'
        },
        include: { items: true }
      });

      const outlet = await tx.outlet.findFirst({
        where: { propertyId: session.propertyId! }
      });
      
      if (!outlet) {
        throw new Error('POS Outlet not found for this property.');
      }

      if (!order) {
        const table = await tx.table.findUnique({ where: { id: restaurantTableId } });
        order = await tx.posOrder.create({
          data: {
            propertyId: session.propertyId!,
            outletId: outlet.id,
            orderNo: `POS-${Date.now()}`,
            orderType: 'DINE_IN',
            status: 'OPEN',
            restaurantTableId: restaurantTableId,
            tableNo: table?.name || null,
            staffMemberId: staffMemberId || null,
          },
          include: { items: true }
        });
      }

      // 2. Identify NEW items or INCREMENTS for KOT
      const newItemsForKot: any[] = [];
      
      for (const item of items) {
        const existingItem = (order as any).items.find((ei: any) => ei.productId === item.id);
        const diffQty = item.quantity - (existingItem?.quantity || 0);

        if (diffQty > 0) {
          if (existingItem) {
            await tx.posOrderItem.update({
              where: { id: existingItem.id },
              data: { 
                quantity: item.quantity,
                totalAmount: item.quantity * (item.sellingPrice || item.unitPrice || 0)
              }
            });
            newItemsForKot.push({ ...item, quantity: diffQty, orderItemId: existingItem.id });
          } else {
            const newItem = await tx.posOrderItem.create({
              data: {
                posOrderId: order!.id,
                productId: item.id,
                quantity: item.quantity,
                unitPrice: item.sellingPrice || item.unitPrice || 0,
                totalAmount: item.quantity * (item.sellingPrice || item.unitPrice || 0),
              }
            });
            newItemsForKot.push({ ...item, quantity: diffQty, orderItemId: newItem.id });
          }
        }
      }

      // 3. Update Order Totals
      const allUpdatedItems = await tx.posOrderItem.findMany({
        where: { posOrderId: order!.id }
      });
      const subtotal = allUpdatedItems.reduce((sum: number, i: any) => sum + i.totalAmount, 0);
      const taxAmount = subtotal * 0.05;
      const grandTotal = subtotal + taxAmount;

      await tx.posOrder.update({
        where: { id: order!.id },
        data: { subtotal, taxAmount, grandTotal, ...(staffMemberId && { staffMemberId }) }
      });

      // 4. Generate KOT for the DIFFERENCE
      let kotTicket: any = null;
      if (newItemsForKot.length > 0) {
        const kotNo = `KOT-${Date.now()}`
        
        let staffName = null;
        if (staffMemberId) {
          const staff = await tx.staffMember.findUnique({ 
            where: { id: staffMemberId },
            select: { name: true } 
          });
          staffName = staff?.name;
        }


        kotTicket = await (tx as any).kotTicket.create({
          data: {
            kotNo,
            orderId: order.id,
            propertyId: session.propertyId!,
            outletId: outlet.id,
            restaurantTableId: order.restaurantTableId || null,
            tableNo: order.tableNo || null,
            roomId: null,
            status: 'NEW',
            createdBy: staffName
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

      // 5. Update Table Status to KOT_RUNNING
      if (restaurantTableId) {
        await (tx as any).table.update({
          where: { id: restaurantTableId },
          data: { status: 'KOT_RUNNING' }
        });
      }

      if (kotTicket) {
        kotTicket = await (tx as any).kotTicket.findUnique({
          where: { id: kotTicket.id },
          include: { items: true }
        });
      }

      return { order: { ...order, items: allUpdatedItems }, kot: kotTicket };
    });

    return apiResponse(result, 'Order saved and KOT generated', 201);
  } catch (error) {
    console.error('Save Order Error:', error);
    return apiError(error);
  }
}
