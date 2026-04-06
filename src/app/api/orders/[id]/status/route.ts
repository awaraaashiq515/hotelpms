import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

const statusSchema = z.object({
  status: z.enum(['PENDING', 'PLACED', 'IN_KITCHEN', 'READY', 'SERVED', 'CANCELLED']),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession()
    if (!session) return apiError(new Error('Unauthorized'), 401)

    const body = await request.json()
    const { status } = statusSchema.parse(body)

    // Map order status to KOT status if needed
    const kotStatusMap: Record<string, string> = {
      'PLACED': 'NEW',
      'IN_KITCHEN': 'PREPARING',
      'READY': 'READY',
      'SERVED': 'SERVED',
      'CANCELLED': 'CANCELLED',
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.posOrder.update({
        where: { id: id },
        data: { status }
      })

      if (kotStatusMap[status]) {
        await tx.kotTicket.updateMany({
          where: { orderId: id },
          data: { status: kotStatusMap[status] }
        })
      }

      return order
    })

    // TODO: Trigger real-time update here
    
    return apiResponse(updatedOrder, `Order status updated to ${status}`)
  } catch (error) {
    return apiError(error)
  }
}
