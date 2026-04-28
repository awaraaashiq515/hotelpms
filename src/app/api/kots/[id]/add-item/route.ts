import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const addItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
  unitPrice: z.number().min(0).optional().default(0),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) return apiError(new Error('Unauthorized'), 401)

    const { id: kotId } = await params
    const body = await request.json()
    const { productId, quantity, notes, unitPrice } = addItemSchema.parse(body)

    const result = await prisma.$transaction(async (tx: any) => {
      // Fetch the KOT with its parent order
      const kot = await tx.kotTicket.findUnique({
        where: { id: kotId },
        include: { order: true },
      })

      if (!kot) throw new Error('KOT not found')
      if (kot.status === 'SERVED' || kot.status === 'CANCELLED') {
        throw new Error(`Cannot add items to a ${kot.status} KOT`)
      }

      // Fetch product info
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, name: true, sellingPrice: true },
      })
      if (!product) throw new Error('Product not found')

      const resolvedPrice = unitPrice || product.sellingPrice
      const totalAmount = resolvedPrice * quantity

      // Create PosOrderItem on the parent order
      const orderItem = await tx.posOrderItem.create({
        data: {
          posOrderId: kot.orderId,
          productId,
          quantity,
          unitPrice: resolvedPrice,
          discountAmount: 0,
          taxAmount: 0,
          totalAmount,
        },
      })

      // Create KotItem
      const kotItem = await tx.kotItem.create({
        data: {
          kotId,
          orderItemId: orderItem.id,
          productId,
          itemName: product.name,
          quantity,
          notes: notes || '',
          status: 'NEW',
        },
      })

      // Log status event
      await tx.kotStatusLog.create({
        data: {
          kotId,
          oldStatus: kot.status,
          newStatus: kot.status,
          changedBy: session.email || 'System',
          remarks: `Added item: ${quantity}× ${product.name}`,
        },
      })

      return kotItem
    })

    return apiResponse(result, 'Item added to KOT successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}
