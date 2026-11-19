import { prisma } from '@/lib/prisma';

/**
 * Helper to automatically sync received purchase order items to hotel InventoryItem & StockItem
 */
export async function syncOrderToInventory(tx: any, orderId: string) {
  const fullOrder = await tx.b2BOrder.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      supplier: true,
    },
  });

  if (!fullOrder || !fullOrder.propertyId) return;

  const propertyId = fullOrder.propertyId;
  const supplierName = fullOrder.supplier?.name || 'Vendor';

  // Ensure default warehouse exists for stock movements
  let warehouse = await tx.warehouse.findFirst({
    where: { propertyId },
  });
  if (!warehouse) {
    warehouse = await tx.warehouse.create({
      data: {
        propertyId,
        name: 'Main Store',
        code: 'MAIN',
      },
    });
  }

  for (const item of fullOrder.items) {
    const rawName = (item.product?.name || item.name || '').trim();
    if (!rawName) continue;

    const qty = Number(item.quantity) || 1;
    const unitPrice = Number(item.unitPrice) || 0;
    const unit = item.product?.unit || item.unit || 'pcs';
    const category = item.product?.category || 'F&B & Kitchen';

    // 1. Sync to InventoryItem (powers /hotel/inventory & inventory-summary)
    const existingInvItem = await tx.inventoryItem.findFirst({
      where: {
        propertyId,
        name: rawName,
      },
    });

    if (existingInvItem) {
      const prevQty = Number(existingInvItem.currentQuantity) || 0;
      const newQty = prevQty + qty;

      await tx.inventoryItem.update({
        where: { id: existingInvItem.id },
        data: {
          currentQuantity: newQty,
          costPrice: unitPrice > 0 ? unitPrice : existingInvItem.costPrice,
          unit: unit || existingInvItem.unit,
          isActive: true,
        },
      });

      await tx.inventoryLog.create({
        data: {
          inventoryItemId: existingInvItem.id,
          type: 'IN',
          quantity: qty,
          previousQty: prevQty,
          newQty: newQty,
          reference: fullOrder.orderNo,
          note: `PO Inward: ${fullOrder.orderNo} from ${supplierName}`,
        },
      });
    } else {
      const newInvItem = await tx.inventoryItem.create({
        data: {
          propertyId,
          name: rawName,
          sku: category,
          unit: unit,
          currentQuantity: qty,
          minThreshold: 5,
          costPrice: unitPrice,
          isActive: true,
        },
      });

      await tx.inventoryLog.create({
        data: {
          inventoryItemId: newInvItem.id,
          type: 'IN',
          quantity: qty,
          previousQty: 0,
          newQty: qty,
          reference: fullOrder.orderNo,
          note: `Initial inward from PO: ${fullOrder.orderNo} from ${supplierName}`,
        },
      });
    }

    // 2. Sync to StockItem & StockMovement
    let stockItem = await tx.stockItem.findFirst({
      where: {
        propertyId,
        name: rawName,
      },
    });

    if (!stockItem) {
      stockItem = await tx.stockItem.create({
        data: {
          propertyId,
          name: rawName,
          unit: unit,
          costPrice: unitPrice,
          itemType: category,
          minimumStock: 5,
          reorderLevel: 5,
        },
      });
    }

    const agg = await tx.stockMovement.aggregate({
      where: { stockItemId: stockItem.id, warehouseId: warehouse.id },
      _sum: { qtyIn: true, qtyOut: true },
    });
    const currentBal = (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);

    await tx.stockMovement.create({
      data: {
        propertyId,
        warehouseId: warehouse.id,
        stockItemId: stockItem.id,
        movementType: 'IN',
        qtyIn: qty,
        qtyOut: 0,
        balanceQty: currentBal + qty,
        unitCost: unitPrice,
        referenceModule: 'B2B_ORDER',
        referenceId: fullOrder.id,
      },
    });

    // 3. Auto-fulfill any pending Kitchen StockRequest for this item
    await tx.stockRequest.updateMany({
      where: {
        propertyId,
        itemName: rawName,
        status: { in: ['PENDING', 'APPROVED'] },
      },
      data: {
        status: 'COMPLETED',
        remarks: `Fulfilled via PO: ${fullOrder.orderNo}`,
        resolvedAt: new Date(),
      },
    }).catch(() => null);
  }
}
