import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be > 0'),
  unitPrice: z.number().min(0),
  discountAmount: z.number().default(0),
  taxAmount: z.number().default(0),
})

const posOrderSchema = z.object({
  propertyId: z.string().optional(),
  outletId: z.string().optional(),
  orderType: z.enum(['DINE_IN', 'TAKEAWAY', 'DELIVERY']).optional().default('DINE_IN'),
  tableNo: z.string().optional(),
  restaurantTableId: z.string().optional(),
  roomId: z.string().optional(),
  folioId: z.string().optional(),
  driverId: z.string().nullable().optional(),
  guestId: z.string().nullable().optional(),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least 1 item'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return apiError(new Error('Unauthorized'), 401);

    const body = await request.json()
    // Map PICKUP to TAKEAWAY for compatibility with the billing page
    if (body.orderType === 'PICKUP') body.orderType = 'TAKEAWAY';
    const parsed = posOrderSchema.parse(body)
    const { items, ...parsedData } = parsed;

    // Auto-fill propertyId from session if not provided
    const propertyId = parsedData.propertyId || session.propertyId;
    if (!propertyId) return apiError(new Error('Property ID could not be determined'), 400);

    // Auto-fill outletId from DB if not provided
    let outletId = parsedData.outletId;
    if (!outletId) {
      const outlet = await prisma.outlet.findFirst({ where: { propertyId } });
      if (!outlet) return apiError(new Error('POS Outlet not found for this property'), 400);
      outletId = outlet.id;
    }

    // Clean up driverId — treat null as undefined
    const driverId = parsedData.driverId || undefined;

    const orderData = {
      ...parsedData,
      propertyId,
      outletId,
      driverId,
    };

    // Calculate Totals ensuring no manipulation
    let computedSubtotal = 0
    let computedTax = 0
    let computedDiscount = 0

    const sanitizedItems = items.map(item => {
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
      }
    })

    const grandTotal = computedSubtotal - computedDiscount + computedTax

    // wrapping in a transaction to ensure Order, Items and KOT succeed or fail together
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Find or create the PosOrder
      let order = await (tx as any).posOrder.findFirst({
        where: { 
          restaurantTableId: orderData.restaurantTableId,
          status: { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY'] },
          orderType: 'DINE_IN'
        },
        include: { items: true }
      });

      if (!order) {
        // Create new order
        order = await tx.posOrder.create({
          data: {
            ...orderData,
            orderNo: `POS-${Date.now()}`,
            status: 'PLACED',
            subtotal: 0,
            taxAmount: 0,
            discountAmount: 0,
            grandTotal: 0,
          },
          include: { items: true }
        })
      }

      // 2. Insert or update Items
      const createdItems = await Promise.all(
        sanitizedItems.map(async (item) => {
          const existingItem = (order as any).items.find((ei: any) => ei.productId === item.productId)
          if (existingItem) {
             return tx.posOrderItem.update({
               where: { id: existingItem.id },
               data: {
                 quantity: existingItem.quantity + item.quantity,
                 totalAmount: (existingItem.quantity + item.quantity) * item.unitPrice
               }
             })
          } else {
            return tx.posOrderItem.create({
              data: { ...item, posOrderId: order.id }
            })
          }
        })
      )

      // 3. Recalculate Order Totals
      const allItems = await tx.posOrderItem.findMany({
        where: { posOrderId: order.id }
      })
      const subtotal = allItems.reduce((sum: number, i: any) => sum + i.totalAmount, 0)
      const taxAmount = subtotal * 0.05 // Simplified tax logic matching save/checkout
      const grandTotal = subtotal + taxAmount

      await tx.posOrder.update({
        where: { id: order.id },
        data: { subtotal, taxAmount, grandTotal }
      })

      // 4. Update Table Status
      if (orderData.restaurantTableId) {
        await (tx as any).table.update({
          where: { id: orderData.restaurantTableId },
          data: { status: 'KOT_RUNNING' }
        })
      }

      // 5. Create KOT Ticket for the newly added items ONLY
      const kotNo = `KOT-${Date.now()}`
      const kotTicket = await (tx as any).kotTicket.create({
        data: {
          kotNo,
          orderId: order.id,
          propertyId: orderData.propertyId,
          outletId: orderData.outletId,
          restaurantTableId: orderData.restaurantTableId || null,
          tableNo: orderData.tableNo || null,
          roomId: orderData.roomId,
          status: 'NEW',
        }
      })

      // Fetch product names
      const products = await tx.product.findMany({
        where: { id: { in: sanitizedItems.map(i => i.productId) } },
        select: { id: true, name: true }
      })

      // Create KOT Items for the CURRENT placement
      await (tx as any).kotItem.createMany({
        data: sanitizedItems.map(item => {
          const product = products.find(p => p.id === item.productId)
          const orderItem = createdItems.find((ci: any) => ci.productId === item.productId)
          return {
            kotId: kotTicket.id,
            orderItemId: orderItem!.id,
            productId: item.productId,
            itemName: product?.name || 'Unknown Product',
            quantity: item.quantity,
            notes: '', 
            status: 'NEW',
          }
        })
      })

      return await (tx as any).posOrder.findUnique({
        where: { id: order.id },
        include: { 
          items: { include: { product: true } },
          kotTickets: { include: { items: true } }
        }
      })
    })

    // RECORD DRIVER ACTIVITY: If a driver is assigned to this order, track this as a RIDE
    if (orderData.driverId) {
      try {
        const { recordDriverActivity } = await import('@/lib/incentive-utils');
        await recordDriverActivity(orderData.driverId, 'RIDE');
      } catch (incError) {
        console.error('[POS Order] Incentive recording error:', incError);
      }
    }

    return apiResponse(newOrder, 'POS Order and KOT created successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const { searchParams } = new URL(request.url)
    const propertyIdParam = searchParams.get('propertyId')
    const outletId = searchParams.get('outletId')
    const status = searchParams.get('status')
    const restaurantTableId = searchParams.get('restaurantTableId')

    const where: any = getMultiTenantWhere(session, propertyIdParam);

    // Handle status filtering
    let statusFilter = undefined;
    if (status === 'in_progress') {
      statusFilter = { in: ['OPEN', 'PENDING', 'PLACED', 'IN_KITCHEN', 'READY'] };
    } else if (status?.includes(',')) {
      statusFilter = { in: status.split(',') };
    } else if (status) {
      statusFilter = status;
    }

    const orders = await prisma.posOrder.findMany({
      where: {
        ...where,
        ...(outletId ? { outletId } : {}),
        ...(restaurantTableId ? { restaurantTableId } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 
    })

    return apiResponse(orders, 'POS Orders fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
