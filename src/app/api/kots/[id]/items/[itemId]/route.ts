import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

const VALID_ITEM_STATUSES = ['NEW', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await getSession()
    const { id: kotId, itemId } = await params
    const body = await request.json()
    const { status } = body

    if (!VALID_ITEM_STATUSES.includes(status)) {
      return apiError(new Error(`Invalid status: ${status}`), 400)
    }

    const updatedItem = await prisma.$transaction(async (tx) => {
      // Update the individual item
      const item = await tx.kotItem.update({
        where: { id: itemId },
        data: { status },
      })

      // Auto-promote KotTicket → PREPARING if ANY active item is PREPARING
      if (status === 'PREPARING') {
        const kot = await tx.kotTicket.findUnique({ where: { id: kotId } })
        if (kot && kot.status === 'NEW') {
          await tx.kotTicket.update({
            where: { id: kotId },
            data: { status: 'PREPARING' },
          })
          await tx.kotStatusLog.create({
            data: {
              kotId,
              oldStatus: 'NEW',
              newStatus: 'PREPARING',
              changedBy: session?.email || 'System',
              remarks: 'Auto-promoted: first item started',
            },
          })

          // Sync with PosOrder status → 'IN_KITCHEN'
          await tx.posOrder.update({
            where: { id: kot.orderId },
            data: { status: 'IN_KITCHEN' }
          })
        }
      }

      // Auto-promote KotTicket → READY/SERVED if ALL active items are consistent
      if (status === 'READY' || status === 'SERVED') {
        const allItems = await tx.kotItem.findMany({
          where: { kotId },
          select: { status: true },
        })

        const nonCancelledItems = allItems.filter((i) => i.status !== 'CANCELLED')
        const allMatchReadyOrServed = nonCancelledItems.length > 0 && nonCancelledItems.every((i) => i.status === 'READY' || i.status === 'SERVED')
        const allServed = nonCancelledItems.length > 0 && nonCancelledItems.every((i) => i.status === 'SERVED')

        if (allMatchReadyOrServed || allServed) {
          const kot = await tx.kotTicket.findUnique({ where: { id: kotId } })
          const targetKotStatus = allServed ? 'SERVED' : 'READY';

          if (kot && kot.status !== targetKotStatus) {
            await tx.kotTicket.update({
              where: { id: kotId },
              data: { status: targetKotStatus },
            })
            await tx.kotStatusLog.create({
              data: {
                kotId,
                oldStatus: kot.status,
                newStatus: targetKotStatus,
                changedBy: session?.email || 'System',
                remarks: `Auto-promoted: items are ${targetKotStatus.toLowerCase()}`,
              },
            })

            // ─── SYNC POS ORDER STATUS ─────────────────────────────────────────────
            const kotsCheck = await tx.kotTicket.findMany({
              where: { orderId: kot.orderId }
            });

            // Re-calculate the PosOrder status based on all its KOTs
            let finalOrderStatus = 'PLACED';
            const activeKots = kotsCheck.map(k => k.id === kotId ? { ...k, status: targetKotStatus } : k).filter(k => k.status !== 'CANCELLED');
            
            if (activeKots.length > 0) {
              if (activeKots.every(k => k.status === 'SERVED')) {
                finalOrderStatus = 'SERVED';
              } else if (activeKots.every(k => k.status === 'READY' || k.status === 'SERVED')) {
                finalOrderStatus = 'READY';
              } else if (activeKots.some(k => ['PREPARING', 'READY', 'SERVED'].includes(k.status))) {
                finalOrderStatus = 'IN_KITCHEN';
              }
            }

            await tx.posOrder.update({
              where: { id: kot.orderId },
              data: { status: finalOrderStatus }
            });
          }
        }
      }

      return item
    })

    return apiResponse(updatedItem, 'Item status updated successfully')
  } catch (error) {
    return apiError(error)
  }
}

