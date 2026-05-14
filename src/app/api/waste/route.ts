import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError, getMultiTenantWhere } from '@/lib/api-utils';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const reason = searchParams.get('reason');
    const status = searchParams.get('status');
    const productId = searchParams.get('productId');
    const query = searchParams.get('query');

    const where: any = {
      ...getMultiTenantWhere(session),
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (reason && reason !== 'all') where.reason = reason;
    if (status && status !== 'all') where.status = status;
    if (productId) where.productId = productId;
    
    if (query) {
      where.OR = [
        { productName: { contains: query } },
        { orderNo: { contains: query } },
        { tableNo: { contains: query } },
        { staffName: { contains: query } },
        { notes: { contains: query } },
      ];
    }

    const wastes = await prisma.waste.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            name: true,
            costPrice: true,
            image: true,
          }
        }
      }
    });

    return apiResponse(wastes);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json();
    const { 
      productId, 
      productName, 
      quantity, 
      reason, 
      orderNo, 
      orderId,
      orderItemId,
      tableNo, 
      staffName, 
      notes,
      costPrice,
      status 
    } = body;

    if (!productName || !quantity || !reason) {
      return apiError(new Error('Product name, quantity, and reason are required'), 400);
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create Waste Record
      let finalCostPrice = costPrice || 0;
      if (!finalCostPrice && productId) {
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { costPrice: true }
        });
        if (product) finalCostPrice = product.costPrice;
      }

      const waste = await tx.waste.create({
        data: {
          propertyId: session.propertyId!,
          productId,
          productName,
          quantity: parseFloat(quantity),
          reason,
          orderNo,
          tableNo,
          staffName: staffName || (session as any).user?.name || 'Staff',
          notes,
          costPrice: finalCostPrice,
          totalCost: finalCostPrice * parseFloat(quantity),
          status: status || 'RECORDED',
        }
      });

      // 2. If orderItemId is provided, reduce quantity from the bill
      if (orderItemId) {
        const orderItem = await tx.posOrderItem.findUnique({
          where: { id: orderItemId },
          include: { 
            posOrder: true,
            product: true,
            kotItems: {
              where: { status: { not: 'CANCELLED' } }
            }
          }
        });

        if (orderItem) {
          const wasteQty = parseFloat(quantity);
          const currentQty = orderItem.quantity;
          const newQty = Math.max(0, currentQty - wasteQty);
          
          // A. Handle KOT items (mark as cancelled)
          let qtyToCancel = wasteQty;
          for (const kotItem of orderItem.kotItems) {
            if (qtyToCancel <= 0) break;
            const cancelFromThis = Math.min(kotItem.quantity, qtyToCancel);
            
            if (cancelFromThis === kotItem.quantity) {
              await tx.kotItem.update({
                where: { id: kotItem.id },
                data: { status: 'CANCELLED', notes: `Waste: ${reason}` }
              });
            } else {
              await tx.kotItem.update({
                where: { id: kotItem.id },
                data: { quantity: kotItem.quantity - cancelFromThis }
              });
              await tx.kotItem.create({
                data: {
                  kotId: kotItem.kotId,
                  orderItemId: kotItem.orderItemId,
                  productId: kotItem.productId,
                  itemName: kotItem.itemName,
                  quantity: cancelFromThis,
                  status: 'CANCELLED',
                  notes: `Waste: ${reason}`
                }
              });
            }
            qtyToCancel -= cancelFromThis;
          }

          // B. Update or Delete PosOrderItem
          if (newQty <= 0) {
            // Must delete KOT items first due to foreign key constraints
            await tx.kotItem.deleteMany({
              where: { orderItemId: orderItemId }
            });
            await tx.posOrderItem.delete({ where: { id: orderItemId } });
          } else {
            await tx.posOrderItem.update({
              where: { id: orderItemId },
              data: { 
                quantity: newQty, 
                totalAmount: newQty * orderItem.unitPrice 
              }
            });
          }

          // C. Recalculate Order Totals
          const remainingItems = await tx.posOrderItem.findMany({
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

            await tx.posOrderItem.update({
              where: { id: i.id },
              data: { taxAmount: itemTax }
            });

            subtotal += itemSub;
            taxAmount += itemTax;
            grandTotal += itemGrand;
          }

          // If no items left, mark order as CANCELLED and reset table
          await tx.posOrder.update({
            where: { id: orderItem.posOrderId },
            data: { 
              subtotal, 
              taxAmount, 
              grandTotal,
              status: remainingItems.length === 0 ? 'CANCELLED' : orderItem.posOrder.status
            }
          });

          // Optional: If order is empty, check if we should reset table
          if (remainingItems.length === 0) {
            // Only reset if tableId is present
            if (orderItem.posOrder.restaurantTableId) {
               await tx.table.update({
                 where: { id: orderItem.posOrder.restaurantTableId },
                 data: { status: 'VACANT' }
               });
            }
          }
        }
      }

      return waste;
    });

    return apiResponse(result, 'Waste recorded and bill updated successfully', 201);
  } catch (error) {
    return apiError(error);
  }
}
