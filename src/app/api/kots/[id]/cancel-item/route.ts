import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notificationService'
import { z } from 'zod'

const cancelItemSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  reason: z.string().optional(),
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
    const { itemId, reason } = cancelItemSchema.parse(body)

    const result = await prisma.$transaction(async (tx: any) => {
      // Verify item belongs to this KOT
      const item = await tx.kotItem.findFirst({
        where: { id: itemId, kotId },
      })

      if (!item) throw new Error('Item not found on this KOT')
      if (item.status === 'SERVED') {
        throw new Error('Cannot cancel an item that has already been served')
      }
      if (item.status === 'CANCELLED') {
        throw new Error('Item is already cancelled')
      }

      // Cancel the item
      const cancelledItem = await tx.kotItem.update({
        where: { id: itemId },
        data: { status: 'CANCELLED' },
      })

      // Log the cancellation
      const kot = await tx.kotTicket.findUnique({ where: { id: kotId } })
      await tx.kotStatusLog.create({
        data: {
          kotId,
          oldStatus: kot?.status || 'UNKNOWN',
          newStatus: kot?.status || 'UNKNOWN',
          changedBy: session.email || 'System',
          remarks: `Cancelled item: ${item.itemName}${reason ? ` — Reason: ${reason}` : ''}`,
        },
      })

      // Notify management about cancellation
      try {
        const kot = await tx.kotTicket.findUnique({ where: { id: kotId } });
        if (kot) {
          await createNotification({
            propertyId: kot.propertyId,
            title: 'KOT Item Cancelled',
            message: `"${item.itemName}" cancelled from KOT #${kot.kotNo} at Table ${kot.tableNo || 'N/A'}. Reason: ${reason || 'Not provided'}`,
            type: 'CANCELLATION',
            priority: 'URGENT',
            metadata: {
              kotId,
              itemId,
              itemName: item.itemName,
              reason,
              link: '/kots'
            }
          });
        }
      } catch (e) {}

      return cancelledItem
    })

    return apiResponse(result, 'Item cancelled successfully')
  } catch (error) {
    return apiError(error)
  }
}
