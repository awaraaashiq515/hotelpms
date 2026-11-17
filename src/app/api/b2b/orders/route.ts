import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to automatically sync received purchase order items to hotel InventoryItem & StockItem
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

// Place a new B2B Order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      propertyId,
      supplierId,
      items,
      totalAmount,
      deliveryDate,
      comments,
      orderNo: customOrderNo,
      stockRequestIds,
      assignedStaffName,
      assignedStaffPhone,
      status: requestedStatus,
      autoReceive,
    } = body;

    if (!propertyId || !supplierId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isInstantDelivery = requestedStatus === 'DELIVERED' || autoReceive === true;
    const initialStatus = isInstantDelivery ? 'DELIVERED' : 'PENDING';

    // Generate a unique order number
    const orderNo = customOrderNo || `PO-${Date.now().toString().slice(-6)}`;

    // Prepare valid B2BProduct IDs for each item
    const preparedItems = [];
    for (const item of items) {
      let validProductId = item.productId;
      let existingProduct = null;

      if (validProductId && !validProductId.startsWith('p_') && !validProductId.startsWith('restock-')) {
        existingProduct = await prisma.b2BProduct.findUnique({ where: { id: validProductId } });
      }

      if (!existingProduct) {
        // Find existing product by name & supplierId or create a new one
        const productName = item.name || 'Order Item';
        const found = await prisma.b2BProduct.findFirst({
          where: { supplierId, name: productName },
        });

        if (found) {
          validProductId = found.id;
          if (item.description && !found.description) {
            await prisma.b2BProduct.update({
              where: { id: found.id },
              data: { description: item.description },
            }).catch(() => null);
          }
        } else {
          const createdProduct = await prisma.b2BProduct.create({
            data: {
              supplierId,
              name: productName,
              description: item.description || null,
              price: Number(item.unitPrice) || 0,
              unit: item.unit || 'pcs',
              stockQuantity: 500,
              category: item.category || 'Kitchen & Grocery',
            },
          });
          validProductId = createdProduct.id;
        }
      }

      preparedItems.push({
        productId: validProductId,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        totalPrice: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
      });
    }

    const order = await prisma.b2BOrder.create({
      data: {
        propertyId,
        supplierId,
        orderNo,
        totalAmount: Number(totalAmount) || 0,
        status: initialStatus,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        comments: comments || null,
        buyerPhone: assignedStaffPhone || null,
        buyerRestaurant: assignedStaffName || null,
        items: {
          create: preparedItems,
        },
        statusLogs: {
          create: {
            status: initialStatus,
            note: isInstantDelivery
              ? `PO Created & Received immediately into Inventory by Hotel.`
              : (assignedStaffName
                ? `PO Created by Hotel. Assigned Receiver: ${assignedStaffName}${assignedStaffPhone ? ` (${assignedStaffPhone})` : ''}`
                : (comments ? `PO Created: ${comments}` : 'PO Created via Hotel Purchasing')),
          },
        },
      },
      include: {
        items: { include: { product: true } },
        statusLogs: true,
        supplier: true,
        property: true,
      },
    });

    // If stock was received immediately, sync to InventoryItem and StockItem right away!
    if (isInstantDelivery) {
      await syncOrderToInventory(prisma, order.id);
    }

    // If stockRequestIds were converted from Kitchen Requisitions, mark them as APPROVED/COMPLETED
    if (Array.isArray(stockRequestIds) && stockRequestIds.length > 0) {
      try {
        await prisma.stockRequest.updateMany({
          where: { id: { in: stockRequestIds } },
          data: {
            status: isInstantDelivery ? 'COMPLETED' : 'APPROVED',
            remarks: `PO Generated: ${orderNo}`,
            resolvedAt: new Date(),
          },
        });
      } catch (err) {
        console.warn('Failed to update linked stock requests:', err);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Place B2B Order Error:', error);
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 });
  }
}

// Get orders for a property or supplier
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const supplierId = searchParams.get('supplierId');
    const orderId = searchParams.get('orderId');

    if (orderId) {
      const order = await prisma.b2BOrder.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: { product: true }
          },
          statusLogs: {
            orderBy: { createdAt: 'desc' }
          },
          supplier: true,
          property: true
        }
      });
      return NextResponse.json(order);
    }

    const orders = await prisma.b2BOrder.findMany({
      where: {
        ...(propertyId ? { propertyId } : {}),
        ...(supplierId ? { supplierId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            category: true,
            address: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true,
          },
        },
        items: { include: { product: true } }
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Fetch B2B Orders Error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// Update order status (used by hotel receiver or supplier)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, note, rating, comments } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Handle Restaurant rating and feedback submission
    if (rating !== undefined) {
      const updatedOrder = await prisma.b2BOrder.update({
        where: { id: orderId },
        data: {
          rating: Number(rating),
          comments: comments || null
        }
      });
      return NextResponse.json(updatedOrder);
    }

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const updatedOrder = await prisma.$transaction(async (tx: any) => {
      const order = await tx.b2BOrder.update({
        where: { id: orderId },
        data: { status }
      });

      await tx.b2BOrderLog.create({
        data: {
          orderId,
          status,
          note: note || `Status updated to ${status}`
        }
      });

      // Synchronize full inventory when DELIVERED
      if (status === 'DELIVERED') {
        await syncOrderToInventory(tx, orderId);
      }

      return order;
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Update B2B Order Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
