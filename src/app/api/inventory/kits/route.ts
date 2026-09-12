import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

// GET /api/inventory/kits?propertyId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    if (!propertyId) return apiError(new Error('propertyId is required'), 400)

    const kits = await prisma.hotelInventoryKit.findMany({
      where: { propertyId, isActive: true },
      include: {
        items: true,
        usageLogs: {
          orderBy: { usedAt: 'desc' },
          take: 10,
        },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })

    return apiResponse(kits, 'Kits fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}

// POST /api/inventory/kits — create a new kit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId, name, description, kitType, priority, items } = body

    if (!propertyId || !name) {
      return apiError(new Error('propertyId and name are required'), 400)
    }

    const kit = await prisma.hotelInventoryKit.create({
      data: {
        propertyId,
        name,
        description: description || null,
        kitType: kitType || 'ROOM',
        priority: typeof priority === 'number' ? priority : 99,
        items: {
          create: (items || []).map((it: {
            itemId: string; itemName: string; category?: string; unit?: string; qtyPerUse: number
          }) => ({
            itemId: it.itemId,
            itemName: it.itemName,
            category: it.category || null,
            unit: it.unit || null,
            qtyPerUse: it.qtyPerUse,
          })),
        },
      },
      include: { items: true },
    })

    return apiResponse(kit, 'Kit created successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}
