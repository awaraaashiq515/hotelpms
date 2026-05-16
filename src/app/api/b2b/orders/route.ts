import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Place a new B2B Order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId, supplierId, items, totalAmount } = body;

    if (!propertyId || !supplierId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate a unique order number
    const orderNo = `B2B-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await prisma.b2BOrder.create({
      data: {
        propertyId,
        supplierId,
        orderNo,
        totalAmount,
        status: 'PENDING',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        },
        statusLogs: {
          create: {
            status: 'PENDING',
            note: 'Order placed by restaurant'
          }
        }
      },
      include: {
        items: true,
        statusLogs: true
      }
    });

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
        supplier: { select: { name: true } },
        property: { select: { name: true } },
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
    const { orderId, status, note } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
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
