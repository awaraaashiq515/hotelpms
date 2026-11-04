import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    } = body;

    if (!propertyId || !supplierId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

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

          // Also auto-save to hotel StockItem so it appears across hotel inventory
          try {
            const existingStockItem = await prisma.stockItem.findFirst({
              where: { propertyId, name: productName },
            });
            if (!existingStockItem) {
              await prisma.stockItem.create({
                data: {
                  propertyId,
                  name: productName,
                  unit: item.unit || 'pcs',
                  costPrice: Number(item.unitPrice) || 0,
                  itemType: item.category || 'Kitchen & F&B',
                  minimumStock: 5,
                  reorderLevel: 5,
                },
              });
            }
          } catch (stockErr) {
            console.warn('Auto stock item creation skipped:', stockErr);
          }
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
        status: 'PENDING',
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        comments: comments || null,
        buyerPhone: assignedStaffPhone || null,
        buyerRestaurant: assignedStaffName || null,
        items: {
          create: preparedItems,
        },
        statusLogs: {
          create: {
            status: 'PENDING',
            note: assignedStaffName
              ? `PO Created by Hotel. Assigned Receiver: ${assignedStaffName}${assignedStaffPhone ? ` (${assignedStaffPhone})` : ''}`
              : (comments ? `PO Created: ${comments}` : 'PO Created via Hotel Purchasing'),
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

    // If stockRequestIds were converted from Kitchen Requisitions, mark them as APPROVED
    if (Array.isArray(stockRequestIds) && stockRequestIds.length > 0) {
      try {
        await prisma.stockRequest.updateMany({
          where: { id: { in: stockRequestIds } },
          data: {
            status: 'APPROVED',
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

// Update order status (used by supplier)
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
          note
        }
      });

      // Logic for inventory sync if DELIVERED
      if (status === 'DELIVERED') {
        const fullOrder = await tx.b2BOrder.findUnique({
          where: { id: orderId },
          include: { items: { include: { product: true } } }
        });

        if (fullOrder) {
          // Get a default warehouse for the property
          let warehouse = await tx.warehouse.findFirst({
            where: { propertyId: fullOrder.propertyId }
          });

          if (!warehouse) {
            warehouse = await tx.warehouse.create({
              data: {
                propertyId: fullOrder.propertyId,
                name: 'Main Store',
                code: 'MAIN'
              }
            });
          }

          for (const item of fullOrder.items) {
            // Find a stock item with matching name in this property
            const stockItem = await tx.stockItem.findFirst({
              where: {
                propertyId: fullOrder.propertyId,
                name: { contains: item.product.name } // Fuzzy name match
              }
            });

            if (stockItem) {
              // Get current balance
              const agg = await tx.stockMovement.aggregate({
                where: { stockItemId: stockItem.id, warehouseId: warehouse.id },
                _sum: { qtyIn: true, qtyOut: true }
              });
              const currentBal = (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);

              // Create Stock IN Movement
              await tx.stockMovement.create({
                data: {
                  propertyId: fullOrder.propertyId,
                  warehouseId: warehouse.id,
                  stockItemId: stockItem.id,
                  movementType: 'IN',
                  qtyIn: item.quantity,
                  qtyOut: 0,
                  balanceQty: currentBal + item.quantity,
                  unitCost: item.unitPrice,
                  referenceModule: 'B2B_ORDER',
                  referenceId: fullOrder.id
                }
              });
            }
          }
        }
      }

      return order;
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Update B2B Order Error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
