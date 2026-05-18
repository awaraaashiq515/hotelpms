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

    const updatedItem = await prisma.$transaction(async (tx: any) => {
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

          if (kot.restaurantTableId) {
            const currentTable = await tx.table.findUnique({
              where: { id: kot.restaurantTableId },
              select: { status: true }
            });
            
            if (currentTable && !['VACANT', 'BILL_PRINTED', 'BILLING_PENDING', 'CLEANING'].includes(currentTable.status)) {
              await tx.table.update({
                where: { id: kot.restaurantTableId },
                data: { status: 'KOT_RUNNING' }
              });
            }
          }

          if (kot.parkingSlotId) {
            const currentSlot = await tx.parkingSlot.findUnique({
              where: { id: kot.parkingSlotId },
              select: { status: true }
            });
            
            if (currentSlot && !['VACANT', 'BILL_PRINTED'].includes(currentSlot.status)) {
              await tx.parkingSlot.update({
                where: { id: kot.parkingSlotId },
                data: { status: 'KOT_RUNNING' }
              });
            }
          }
        }
      }

      // Auto-promote KotTicket → READY/SERVED if ALL active items are consistent
      if (status === 'READY' || status === 'SERVED') {
        const allItems = await tx.kotItem.findMany({
          where: { kotId },
          select: { status: true },
        })

        const nonCancelledItems = allItems.filter((i: any) => i.status !== 'CANCELLED')
        const allMatchReadyOrServed = nonCancelledItems.length > 0 && nonCancelledItems.every((i: any) => i.status === 'READY' || i.status === 'SERVED')
        const allServed = nonCancelledItems.length > 0 && nonCancelledItems.every((i: any) => i.status === 'SERVED')

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
            const activeKots = kotsCheck.map((k: any) => k.id === kotId ? { ...k, status: targetKotStatus } : k).filter((k: any) => k.status !== 'CANCELLED');
            
            if (activeKots.length > 0) {
              if (activeKots.every((k: any) => k.status === 'SERVED')) {
                finalOrderStatus = 'SERVED';
              } else if (activeKots.every((k: any) => k.status === 'READY' || k.status === 'SERVED')) {
                finalOrderStatus = 'READY';
              } else if (activeKots.some((k: any) => ['PREPARING', 'READY', 'SERVED'].includes(k.status))) {
                finalOrderStatus = 'IN_KITCHEN';
              }
            }

            await tx.posOrder.update({
              where: { id: kot.orderId },
              data: { status: finalOrderStatus }
            });

            if (kot.restaurantTableId) {
              let tableStatus = 'OCCUPIED';
              if (finalOrderStatus === 'READY') {
                tableStatus = 'READY';
              } else if (finalOrderStatus === 'SERVED') {
                tableStatus = 'SERVED';
              } else if (finalOrderStatus === 'IN_KITCHEN' || finalOrderStatus === 'KOT_RUNNING') {
                tableStatus = 'KOT_RUNNING';
              }

              const currentTable = await tx.table.findUnique({
                where: { id: kot.restaurantTableId },
                select: { status: true }
              });
              
              if (currentTable && !['VACANT', 'BILL_PRINTED', 'BILLING_PENDING', 'CLEANING'].includes(currentTable.status)) {
                await tx.table.update({
                  where: { id: kot.restaurantTableId },
                  data: { status: tableStatus }
                });
              }
            }

            if (kot.parkingSlotId) {
              let slotStatus = 'OCCUPIED';
              if (finalOrderStatus === 'READY') {
                slotStatus = 'READY';
              } else if (finalOrderStatus === 'SERVED') {
                slotStatus = 'SERVED';
              } else if (finalOrderStatus === 'IN_KITCHEN' || finalOrderStatus === 'KOT_RUNNING') {
                slotStatus = 'KOT_RUNNING';
              }

              const currentSlot = await tx.parkingSlot.findUnique({
                where: { id: kot.parkingSlotId },
                select: { status: true }
              });
              
              if (currentSlot && !['VACANT', 'BILL_PRINTED'].includes(currentSlot.status)) {
                await tx.parkingSlot.update({
                  where: { id: kot.parkingSlotId },
                  data: { status: slotStatus }
                });
              }
            }
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

