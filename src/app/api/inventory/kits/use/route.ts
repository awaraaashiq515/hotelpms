import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

// POST /api/inventory/kits/use
// Body: { kitId, propertyId, usedCount, usedBy?, note?, stockUpdates: [{itemId, itemName, deductQty}] }
// This records the usage log; the actual stock deduction happens on the frontend (local state)
// since the inventory page currently uses local state.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { kitId, propertyId, usedCount, usedBy, note } = body

    if (!kitId || !propertyId) {
      return apiError(new Error('kitId and propertyId are required'), 400)
    }

    const usageLog = await prisma.hotelInventoryKitUsage.create({
      data: {
        kitId,
        propertyId,
        usedCount: usedCount || 1,
        usedBy: usedBy || null,
        note: note || null,
      },
      include: {
        kit: { select: { name: true } },
      },
    })

    return apiResponse(usageLog, 'Kit usage recorded successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

// GET /api/inventory/kits/use?propertyId=...  — usage history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    if (!propertyId) return apiError(new Error('propertyId is required'), 400)

    const logs = await prisma.hotelInventoryKitUsage.findMany({
      where: { propertyId },
      include: { kit: { select: { name: true, kitType: true } } },
      orderBy: { usedAt: 'desc' },
      take: 50,
    })

    return apiResponse(logs, 'Usage logs fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
