import { prisma } from './prisma';

/**
 * Automatically decrements inventory stock based on product recipes when an order is completed.
 */
export async function deductStockFromOrder(orderId: string) {
  try {
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              include: {
                ingredients: true
              }
            }
          }
        }
      }
    });

    if (!order) return;

    for (const item of order.items) {
      for (const ingredient of item.product.ingredients) {
        const quantityToDeduct = ingredient.quantity * item.quantity;

        // Start transaction for atomic update
        await prisma.$transaction(async (tx: any) => {
          const inventoryItem = await tx.inventoryItem.findUnique({
            where: { id: ingredient.inventoryItemId }
          });

          if (inventoryItem) {
            const newQty = inventoryItem.currentQuantity - quantityToDeduct;
            
            // Update quantity
            await tx.inventoryItem.update({
              where: { id: inventoryItem.id },
              data: { currentQuantity: newQty }
            });

            // Create log
            await tx.inventoryLog.create({
              data: {
                inventoryItemId: inventoryItem.id,
                type: 'OUT',
                quantity: quantityToDeduct,
                previousQty: inventoryItem.currentQuantity,
                newQty: newQty,
                reference: order.orderNo,
                note: `Order Deduction: ${item.product.name}`
              }
            });
          }
        });
      }
    }
  } catch (error) {
    console.error('Failed to deduct stock:', error);
  }
}

/**
 * Checks for inventory items that have fallen below their minimum threshold.
 */
export async function getLowStockAlerts(propertyId: string) {
  return await prisma.inventoryItem.findMany({
    where: {
      propertyId,
      currentQuantity: {
        lte: prisma.inventoryItem.fields.minThreshold
      }
    }
  });
}
