import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { createNotification } from '@/lib/notificationService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const kot = await prisma.kotTicket.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            orderNo: true,
            orderType: true,
            tableNo: true,
            roomId: true,
            createdAt: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        },
        statusLogs: {
          orderBy: { changedAt: 'desc' }
        }
      }
    })

    if (!kot) {
      return apiError(new Error('KOT not found'), 404)
    }

    return apiResponse(kot, 'KOT fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, remarks } = body

    const oldKot = await prisma.kotTicket.findUnique({
      where: { id }
    })

    if (!oldKot) {
      return apiError(new Error('KOT not found'), 404)
    }

    let hasBarItems = false;
    let hasKitchenItems = true;

    const updatedKot = await prisma.$transaction(async (tx: any) => {
      const kot = await tx.kotTicket.update({
        where: { id },
        data: { status }
      })

      await tx.kotStatusLog.create({
        data: {
          kotId: kot.id,
          oldStatus: oldKot.status,
          newStatus: status,
          remarks,
          changedBy: 'System', // Replace with Actual User when auth is clear
        }
      })

      // If KOT is cancelled, served, or ready, update all items too
      if (['CANCELLED', 'SERVED', 'READY'].includes(status)) {
        await tx.kotItem.updateMany({
          where: { 
            kotId: id,
            status: { not: 'CANCELLED' } // Don't revive cancelled items
          },
          data: { status: status }
        })
      }

      // ─── SYNC POS ORDER STATUS ─────────────────────────────────────────────
      const allKots = await tx.kotTicket.findMany({
        where: { orderId: oldKot.orderId }
      });

      const kotsForStatus = allKots.map((k: any) => k.id === id ? { ...k, status } : k);
      
      let finalStatus = 'PLACED';
      const activeKots = kotsForStatus.filter((k: any) => k.status !== 'CANCELLED');
      
      if (activeKots.length > 0) {
        if (activeKots.every((k: any) => k.status === 'SERVED')) {
          finalStatus = 'SERVED';
        } else if (activeKots.every((k: any) => k.status === 'READY' || k.status === 'SERVED')) {
          finalStatus = 'READY';
        } else if (activeKots.some((k: any) => ['PREPARING', 'READY', 'SERVED'].includes(k.status))) {
          finalStatus = 'KOT_RUNNING';
        }
      }

      await tx.posOrder.update({
        where: { id: oldKot.orderId },
        data: { status: finalStatus }
      });

      if (oldKot.restaurantTableId) {
        let tableStatus = 'OCCUPIED';
        if (finalStatus === 'READY') {
          tableStatus = 'READY';
        } else if (finalStatus === 'SERVED') {
          tableStatus = 'SERVED';
        } else if (finalStatus === 'KOT_RUNNING') {
          tableStatus = 'KOT_RUNNING';
        }

        const currentTable = await tx.table.findUnique({
          where: { id: oldKot.restaurantTableId },
          select: { status: true }
        });
        
        if (currentTable && !['VACANT', 'BILL_PRINTED', 'BILLING_PENDING', 'CLEANING'].includes(currentTable.status)) {
          await tx.table.update({
            where: { id: oldKot.restaurantTableId },
            data: { status: tableStatus }
          });
        }
      }

      if (oldKot.parkingSlotId) {
        let slotStatus = 'OCCUPIED';
        if (finalStatus === 'READY') {
          slotStatus = 'READY';
        } else if (finalStatus === 'SERVED') {
          slotStatus = 'SERVED';
        } else if (finalStatus === 'KOT_RUNNING') {
          slotStatus = 'KOT_RUNNING';
        }

        const currentSlot = await tx.parkingSlot.findUnique({
          where: { id: oldKot.parkingSlotId },
          select: { status: true }
        });
        
        if (currentSlot && !['VACANT', 'BILL_PRINTED'].includes(currentSlot.status)) {
          await tx.parkingSlot.update({
            where: { id: oldKot.parkingSlotId },
            data: { status: slotStatus }
          });
        }
      }

      const kotItems = await tx.kotItem.findMany({
        where: { kotId: id },
        include: { product: true }
      });
      hasBarItems = kotItems.some((i: any) => i.product?.menuType === 'BAR');
      hasKitchenItems = kotItems.some((i: any) => i.product?.menuType !== 'BAR' && i.product?.menuType !== 'CAFE');

      return kot
    }, {
      timeout: 10000 // 10s timeout for SQLite
    })

    // ─── CREATE NOTIFICATION FOR KITCHEN STATUS (OUTSIDE TX) ──────────────
    try {
      if (['PREPARING', 'READY', 'SERVED'].includes(status)) {
        await createNotification({
          propertyId: oldKot.propertyId,
          title: `Kitchen: ${status.charAt(0) + status.slice(1).toLowerCase()}`,
          message: `Order #${oldKot.tableNo || ''} KOT ${oldKot.kotNo} is now ${status.toLowerCase()}`,
          type: 'KITCHEN',
          priority: status === 'READY' ? 'HIGH' : 'MEDIUM',
          metadata: {
            kotId: id,
            orderId: oldKot.orderId,
            status,
            hasBarItems,
            hasKitchenItems,
            link: `/operations/tables`
          }
        });
      }
    } catch (notifError) {
      console.error('[KOT Notification] error:', notifError);
    }

    return apiResponse(updatedKot, 'KOT status updated successfully')
  } catch (error) {
    return apiError(error)
  }
}
