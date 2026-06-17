import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notificationService'

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(0, 'Quantity must be >= 0'),
  unitPrice: z.number().min(0),
  discountAmount: z.number().default(0),
  taxAmount: z.number().default(0),
  name: z.string().optional(),
  variantId: z.string().optional().nullable(),
  variantName: z.string().optional().nullable(),
  portion: z.string().optional().nullable(),
})

const posOrderSchema = z.object({
  propertyId: z.string().optional(),
  outletId: z.string().optional(),
  orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY', 'PARKING']).optional().default('DINE_IN'),
  tableNo: z.string().optional(),
  restaurantTableId: z.string().optional(),
  parkingSlotId: z.string().optional(),
  vehicleNumber: z.string().optional(),
  roomId: z.string().optional(),
  folioId: z.string().optional(),
  driverId: z.string().nullable().optional(),
  guestId: z.string().nullable().optional(),
  guestCount: z.number().int().optional().default(1),
  preparationTime: z.number().int().optional().default(15),
  deliveryCustomerName: z.string().nullable().optional(),
  deliveryPhone: z.string().nullable().optional(),
  deliveryAddress: z.string().nullable().optional(),
  deliveryInstructions: z.string().nullable().optional(),
  deliveryLat: z.number().nullable().optional(),
  deliveryLng: z.number().nullable().optional(),
  items: z.array(orderItemSchema).optional(),
  orderId: z.string().optional(),
  staffMemberId: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json()
    const tabletId = body.tabletId;

    let isAuthenticated = !!session;
    if (!session && tabletId) {
      const tablet = await prisma.tablet.findUnique({ where: { id: tabletId } });
      if (tablet) {
        isAuthenticated = true;
      }
    }

    if (!isAuthenticated) return apiError(new Error('Unauthorized'), 401);

    // Map PICKUP to TAKEAWAY for compatibility with the billing page
    if (body.orderType === 'PICKUP') body.orderType = 'TAKEAWAY';
    const parsed = posOrderSchema.parse(body)
    const { items = [], ...parsedData } = parsed;

    // Auto-fill propertyId from session if not provided
    const propertyId = parsedData.propertyId || session?.propertyId;
    if (!propertyId) return apiError(new Error('Property ID could not be determined'), 400);

    // Auto-fill outletId from DB if not provided
    let outletId = parsedData.outletId;
    if (!outletId) {
      const outlet = await prisma.outlet.findFirst({ where: { propertyId } });
      if (!outlet) return apiError(new Error('POS Outlet not found for this property'), 400);
      outletId = outlet.id;
    }

    // Clean up driverId — treat null as undefined
    const isDelivery = parsedData.orderType === 'DELIVERY';
    const driverId = isDelivery ? undefined : (parsedData.driverId || undefined);
    const deliveryRiderId = isDelivery ? (parsedData.driverId || undefined) : undefined;

    const orderData = {
      ...parsedData,
      propertyId,
      outletId,
      driverId,
      deliveryRiderId,
    };

    // ── VALIDATE FOREIGN KEYS before creation to prevent FK constraint errors ──
    // Verify guestId exists
    if (orderData.guestId) {
      const guestExists = await prisma.guest.findUnique({ where: { id: orderData.guestId }, select: { id: true } });
      if (!guestExists) {
        console.warn(`[POS Order] guestId ${orderData.guestId} not found — dropping to null`);
        orderData.guestId = null;
      }
    }
    // Verify driverId exists
    if (orderData.driverId) {
      const driverExists = await prisma.driver.findUnique({ where: { id: orderData.driverId }, select: { id: true } });
      if (!driverExists) {
        console.warn(`[POS Order] driverId ${orderData.driverId} not found — dropping to null`);
        orderData.driverId = undefined;
      }
    }
    // Verify staffMemberId exists
    if (orderData.staffMemberId) {
      const staffExists = await prisma.staffMember.findUnique({ where: { id: orderData.staffMemberId }, select: { id: true } });
      if (!staffExists) {
        console.warn(`[POS Order] staffMemberId ${orderData.staffMemberId} not found — dropping to null`);
        orderData.staffMemberId = null;
      }
    }

    // Calculate Totals ensuring no manipulation
    let computedSubtotal = 0
    let computedTax = 0
    let computedDiscount = 0

    const sanitizedItems = items.map((item: any) => {
      const lineTotal = (item.quantity * item.unitPrice) - item.discountAmount + item.taxAmount
      computedSubtotal += (item.quantity * item.unitPrice)
      computedTax += item.taxAmount
      computedDiscount += item.discountAmount

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount,
        taxAmount: item.taxAmount,
        totalAmount: lineTotal,
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        portion: item.portion || null,
      }
    })

    const grandTotal = computedSubtotal - computedDiscount + computedTax

    // wrapping in a transaction to ensure Order, Items and KOT succeed or fail together
    const newOrder = await prisma.$transaction(async (tx: any) => {
      // 1. Find or create the PosOrder
      let order = null;
      if (parsedData.orderId) {
        order = await (tx as any).posOrder.findUnique({
          where: { id: parsedData.orderId },
          include: { items: true }
        });
      } else if (orderData.restaurantTableId) {
        order = await (tx as any).posOrder.findFirst({
          where: { 
            restaurantTableId: orderData.restaurantTableId,
            status: { in: ['OPEN', 'PENDING', 'PLACED', 'ACCEPTED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'HOLD', 'PAYMENT_AWAITING_APPROVAL'] },
            orderType: 'DINE_IN'
          },
          include: { items: true }
        });
      } else if (orderData.parkingSlotId) {
        order = await (tx as any).posOrder.findFirst({
          where: { 
            parkingSlotId: orderData.parkingSlotId,
            status: { in: ['OPEN', 'PENDING', 'PLACED', 'ACCEPTED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'HOLD', 'PAYMENT_AWAITING_APPROVAL'] },
            orderType: 'PARKING'
          },
          include: { items: true }
        });
      }

      if (!order) {
        // Create new order
        order = await tx.posOrder.create({
          data: {
            ...orderData,
            orderNo: `POS-${Date.now()}`,
            status: body.holdOrder ? 'HOLD' : (body.paymentMode === 'UPI' ? 'PAYMENT_AWAITING_APPROVAL' : 'KOT_RUNNING'),
            paymentRequested: body.paymentMode === 'UPI',
            onlinePaymentReference: body.transactionLast4 || null,
            onlinePaymentMethod: body.paymentMode || null,
            subtotal: 0,
            taxAmount: 0,
            discountAmount: 0,
            grandTotal: 0,
          },
          include: { items: true }
        })
      } else {
        // Update existing order status if it's a UPI payment request
        if (body.paymentMode === 'UPI') {
          await tx.posOrder.update({
            where: { id: order.id },
            data: {
              status: 'PAYMENT_AWAITING_APPROVAL',
              paymentRequested: true,
              onlinePaymentReference: body.transactionLast4 || order.onlinePaymentReference,
              onlinePaymentMethod: 'UPI'
            }
          });
        }
      }

      const createdItems = await Promise.all(
        sanitizedItems.map(async (item) => {
          const existingItem = order?.items?.find((ei: any) => 
            ei.productId === item.productId && 
            ei.variantId === item.variantId && 
            ei.portion === item.portion
          )
          if (existingItem) {
             return tx.posOrderItem.update({
               where: { id: existingItem.id },
               data: {
                 quantity: item.quantity,
                 totalAmount: item.totalAmount,
                 unitPrice: item.unitPrice // Update to latest price
               }
             })
          } else {
            return tx.posOrderItem.create({
              data: { ...item, posOrderId: order!.id }
            })
          }
        })
      )

      // Optional: Handle items that were removed from the cart but exist in the DB.
      if (order?.items) {
        const itemsToDelete = order.items.filter((ei: any) => 
          !sanitizedItems.some((si: any) => 
            si.productId === ei.productId && 
            si.variantId === ei.variantId && 
            si.portion === ei.portion
          )
        );
        for (const itemToDelete of itemsToDelete) {
          const kotCount = await (tx as any).kotItem.count({ where: { orderItemId: itemToDelete.id } });
          if (kotCount === 0) {
            await tx.posOrderItem.delete({ where: { id: itemToDelete.id } });
          } else {
            await tx.posOrderItem.update({
              where: { id: itemToDelete.id },
              data: { quantity: 0, totalAmount: 0 }
            });
          }
        }
      }

      // 3. Recalculate Order Totals
      const allItems = await tx.posOrderItem.findMany({
        where: { posOrderId: order.id }
      })
      const subtotal = allItems.reduce((sum: number, i: any) => sum + (i.unitPrice * i.quantity), 0)
      const taxAmount = allItems.reduce((sum: number, i: any) => sum + (i.taxAmount || 0), 0)
      const discountAmount = allItems.reduce((sum: number, i: any) => sum + (i.discountAmount || 0), 0)
      const grandTotal = subtotal - discountAmount + taxAmount

      await tx.posOrder.update({
        where: { id: order.id },
        data: { 
          status: body.holdOrder ? 'HOLD' : (order.status === 'HOLD' ? 'KOT_RUNNING' : order.status),
          subtotal, 
          taxAmount, 
          discountAmount,
          grandTotal,
          guestId: orderData.guestId || undefined,
          guestCount: orderData.guestCount,
          driverId: orderData.driverId || undefined,
          deliveryCustomerName: orderData.deliveryCustomerName || undefined,
          deliveryPhone: orderData.deliveryPhone || undefined,
          deliveryAddress: orderData.deliveryAddress || undefined,
          deliveryInstructions: orderData.deliveryInstructions || undefined,
          deliveryLat: orderData.deliveryLat,
          deliveryLng: orderData.deliveryLng,
          staffMemberId: orderData.staffMemberId || undefined,
        }
      })

      // 4. Update Table/Parking Status
      if (orderData.restaurantTableId) {
        await (tx as any).table.update({
          where: { id: orderData.restaurantTableId },
          data: { status: body.holdOrder ? 'HOLD' : 'KOT_RUNNING' }
        })
      } else if (orderData.parkingSlotId) {
        await (tx as any).parkingSlot.update({
          where: { id: orderData.parkingSlotId },
          data: { status: 'OCCUPIED' }
        })
      }

      // Fetch product names for KOT
      const products = await tx.product.findMany({
        where: { id: { in: sanitizedItems.map((i: any) => i.productId) } },
        select: { id: true, name: true }
      });

      // Calculate delta quantities for KOT
      const kotItemsToCreate: any[] = [];
      sanitizedItems.forEach((item: any) => {
        const product = products.find((p: any) => p.id === item.productId);
        const orderItem = createdItems.find((ci: any) => ci.productId === item.productId && ci.variantId === (item.variantId || null) && ci.portion === (item.portion || null));
        
        const existingItem = order?.items?.find((ei: any) => 
          ei.productId === item.productId && 
          ei.variantId === item.variantId && 
          ei.portion === item.portion
        );
        const previousQty = existingItem ? existingItem.quantity : 0;
        const newQty = item.quantity - previousQty;

        if (newQty > 0 && orderItem) {
          kotItemsToCreate.push({
            orderItemId: orderItem.id,
            productId: item.productId,
            itemName: product?.name || 'Unknown Product',
            quantity: newQty,
            notes: '', 
            status: 'NEW',
          });
        }
      });

      // 5. Create KOT Ticket ONLY if there are new items AND it's not a hold order
      let kotTicket: any = null;
      if (kotItemsToCreate.length > 0 && !body.holdOrder) {
        const kotNo = `KOT-${Date.now()}`;
        kotTicket = await (tx as any).kotTicket.create({
          data: {
            kotNo,
            orderId: order!.id,
            propertyId: orderData.propertyId,
            outletId: orderData.outletId,
            restaurantTableId: orderData.restaurantTableId || null,
            parkingSlotId: orderData.parkingSlotId || null,
            tableNo: orderData.tableNo || null,
            roomId: orderData.roomId,
            status: body.skipKitchen ? 'PRINTED_ONLY' : 'NEW',
          }
        });

        // 5b. Create KOT Items for the CURRENT placement
        await (tx as any).kotItem.createMany({
          data: kotItemsToCreate.map(kItem => ({
            ...kItem,
            kotId: kotTicket.id
          }))
        });
      }

      // 6. Handle Inventory Deduction (skip for hold orders - will deduct when KOT is cut)
      if (!body.holdOrder) {
      let warehouse = await tx.warehouse.findFirst({
        where: { propertyId: orderData.propertyId },
      });
      if (!warehouse) {
        warehouse = await tx.warehouse.create({
          data: { propertyId: orderData.propertyId, name: 'Main Store', code: 'MAIN' },
        });
      }

      for (const item of sanitizedItems) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { variants: true }
        });
        if (!product || !product.stockItemId || !product.trackInventory) continue;

        let deductionQty = 0;
        if (product.menuType === 'BAR') {
          const orderItem = items.find((i: any) => i.productId === item.productId);
          const variantNameMatch = orderItem?.name?.match(/\((.*?)\)$/);
          const variantName = variantNameMatch ? variantNameMatch[1] : null;

          if (variantName) {
            if (variantName.toLowerCase().includes('bottle')) {
              deductionQty = (product.bottleSize || 750) * item.quantity;
            } else {
              const mlMatch = variantName.match(/(\d+)/);
              const mlValue = mlMatch ? parseInt(mlMatch[1]) : 0;
              deductionQty = mlValue * item.quantity;
            }
          } else {
            deductionQty = (product.pegSize || 30) * item.quantity;
          }
        } else {
          deductionQty = item.quantity;
        }

        if (deductionQty > 0) {
          const agg = await tx.stockMovement.aggregate({
            where: { stockItemId: product.stockItemId, warehouseId: warehouse.id },
            _sum: { qtyIn: true, qtyOut: true },
          });
          const stockItem = await tx.stockItem.findUnique({ where: { id: product.stockItemId } });
          const openingStock = stockItem?.openingStock || 0;
          const currentBalance = openingStock + (agg._sum.qtyIn || 0) - (agg._sum.qtyOut || 0);
          const newBalance = currentBalance - deductionQty;

          await tx.stockMovement.create({
            data: {
              propertyId: orderData.propertyId,
              warehouseId: warehouse.id,
              stockItemId: product.stockItemId,
              movementType: 'SALE_OUT',
              referenceModule: 'POS_ORDER',
              referenceId: order.id,
              qtyIn: 0,
              qtyOut: deductionQty,
              balanceQty: newBalance,
              movementDate: new Date()
            }
          });
        }
      }
      }

      return await (tx as any).posOrder.findUnique({
        where: { id: order.id },
        include: { 
          items: { include: { product: true } },
          table: { include: { floor: true } },
          kotTickets: { 
            include: { 
              items: {
                include: { product: true }
              },
              table: { include: { floor: true } }
            } 
          }
        }
      })
    })

    // RECORD DRIVER ACTIVITY
    if (orderData.driverId) {
      try {
        const { recordDriverActivity } = await import('@/lib/incentive-utils');
        await recordDriverActivity(orderData.driverId, 'RIDE', orderData.guestCount || 1);
      } catch (incError) {
        console.error('[POS Order] Incentive recording error:', incError);
      }
    }

    // 7. Create Notification
    try {
      await createNotification({
        propertyId: orderData.propertyId,
        title: 'New Order Received',
        message: `Order ${newOrder.orderNo} created for ${newOrder.table?.name || newOrder.parkingSlot?.name || 'Table ' + newOrder.tableNo}`,
        type: 'ORDER',
        priority: 'HIGH',
        metadata: {
          orderId: newOrder.id,
          orderNo: newOrder.orderNo,
          tableNo: newOrder.tableNo,
          grandTotal: newOrder.grandTotal,
          link: `/billing?orderId=${newOrder.id}`
        }
      });
    } catch (notifError) {
      console.error('[POS Order] Notification error:', notifError);
    }

    return apiResponse(newOrder, 'POS Order and KOT created successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    console.log('[API GET /api/pos-orders] session resolved:', session ? { id: session.id, email: session.email, role: session.role, propertyId: session.propertyId } : 'null');
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const { searchParams } = new URL(request.url)
    const propertyIdParam = searchParams.get('propertyId')
    const outletId = searchParams.get('outletId')
    const status = searchParams.get('status')
    const restaurantTableId = searchParams.get('restaurantTableId')
    const parkingSlotId = searchParams.get('parkingSlotId')
    const orderId = searchParams.get('orderId')

    console.log('[API GET /api/pos-orders] query params:', { propertyIdParam, outletId, status, restaurantTableId, parkingSlotId, orderId });

    const where: any = getMultiTenantWhere(session, propertyIdParam);
    console.log('[API GET /api/pos-orders] where after getMultiTenantWhere:', where);

    // Filter orders by assigned tables for standard staff users
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        role: true,
        tableAssignments: true
      }
    });

    if (user) {
      const isManagerOrAdmin = user.role?.name?.toLowerCase().includes('manager') || 
                               user.role?.name?.toLowerCase().includes('admin');
      console.log('[API GET /api/pos-orders] user found:', { fullName: user.fullName, role: user.role?.name, isManagerOrAdmin, assignmentsCount: user.tableAssignments.length });

      if (!isManagerOrAdmin) {
        const assignedTableIds = user.tableAssignments.map((ta: any) => ta.tableId) || [];
        where.OR = [
          {
            orderType: 'DINE_IN',
            restaurantTableId: { in: assignedTableIds }
          },
          {
            orderType: { in: ['DELIVERY', 'TAKEAWAY', 'PARKING'] }
          }
        ];
        console.log('[API GET /api/pos-orders] non-admin table assignment filter applied with delivery/takeaway/parking fallback:', assignedTableIds);
      }
    } else {
      console.log('[API GET /api/pos-orders] user not found in database for id:', session.id);
    }

    // Handle status filtering
    let statusFilter = undefined;
    if (status === 'in_progress') {
      statusFilter = { in: ['OPEN', 'PENDING', 'PLACED', 'ACCEPTED', 'IN_KITCHEN', 'READY', 'SERVED', 'BILL_PRINTED', 'KOT_RUNNING', 'HOLD', 'PAYMENT_AWAITING_APPROVAL'] };
    } else if (status?.includes(',')) {
      statusFilter = { in: status.split(',') };
    } else if (status) {
      statusFilter = status;
    }

    const finalWhere = {
        ...where,
        ...(orderId ? { id: orderId } : {}),
        ...(outletId ? { outletId } : {}),
        ...(restaurantTableId ? { restaurantTableId } : {}),
        ...(parkingSlotId ? { parkingSlotId } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
    };

    console.log('[API GET /api/pos-orders] finalWhere:', finalWhere);

    const orders = await prisma.posOrder.findMany({
      where: finalWhere,
      include: {
        items: {
          include: { product: true }
        },
        membershipCard: {
          include: { membershipPlan: true }
        },
        driver: true,
        deliveryRider: true,
        table: {
          include: {
            floor: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: (orderId || restaurantTableId || parkingSlotId) ? undefined : 50 
    })

    console.log('[API GET /api/pos-orders] orders found count:', orders.length);


    return apiResponse(orders, 'POS Orders fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
