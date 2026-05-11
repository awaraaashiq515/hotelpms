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
      // Calculate consolidated status based on ALL KOTs for this order
      const allKots = await tx.kotTicket.findMany({
        where: { orderId: oldKot.orderId }
      });

      // Include the current update in the calculation
      const kotsForStatus = allKots.map((k: any) => k.id === id ? { ...k, status } : k);
      
      let finalStatus = 'PLACED';
      const activeKots = kotsForStatus.filter((k: any) => k.status !== 'CANCELLED');
      
      if (activeKots.length > 0) {
        if (activeKots.every((k: any) => k.status === 'SERVED')) {
          finalStatus = 'SERVED';
        } else if (activeKots.every((k: any) => k.status === 'READY' || k.status === 'SERVED')) {
          finalStatus = 'READY';
        } else if (activeKots.some((k: any) => ['PREPARING', 'READY', 'SERVED'].includes(k.status))) {
          finalStatus = 'IN_KITCHEN';
        }
      }

      await tx.posOrder.update({
        where: { id: oldKot.orderId },
        data: { status: finalStatus }
      });

      // ─── CREATE NOTIFICATION FOR KITCHEN STATUS ───────────────────────────
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
              link: `/operations/tables`
            }
          });
        }
      } catch (notifError) {
        console.error('[KOT Notification] error:', notifError);
      }

      return kot
    })

    return apiResponse(updatedKot, 'KOT status updated successfully')
  } catch (error) {
    return apiError(error)
  }
}
