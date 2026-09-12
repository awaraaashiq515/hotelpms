import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

/**
 * POST /api/inventory/kits/reorder
 * Body: { kitId: string; direction: 'up' | 'down'; propertyId: string }
 *
 * Swaps the `priority` of a kit with its immediate neighbour in the sorted list.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kitId, direction, propertyId } = body as {
      kitId: string
      direction: 'up' | 'down'
      propertyId: string
    }

    if (!kitId || !direction || !propertyId) {
      return apiError(new Error('kitId, direction and propertyId are required'), 400)
    }

    // Fetch all active kits sorted by priority
    const allKits = await prisma.hotelInventoryKit.findMany({
      where: { propertyId, isActive: true },
      select: { id: true, priority: true },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })

    const idx = allKits.findIndex((k) => k.id === kitId)
    if (idx === -1) return apiError(new Error('Kit not found'), 404)

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= allKits.length) {
      return apiResponse({ swapped: false }, 'Already at boundary')
    }

    const kitA = allKits[idx]
    const kitB = allKits[swapIdx]

    // Swap priorities
    await prisma.$transaction([
      prisma.hotelInventoryKit.update({
        where: { id: kitA.id },
        data: { priority: kitB.priority },
      }),
      prisma.hotelInventoryKit.update({
        where: { id: kitB.id },
        data: { priority: kitA.priority },
      }),
    ])

    return apiResponse({ swapped: true, kitAId: kitA.id, kitBId: kitB.id }, 'Kits reordered')
  } catch (error) {
    return apiError(error)
  }
}
