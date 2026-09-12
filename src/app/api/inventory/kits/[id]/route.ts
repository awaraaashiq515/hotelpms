import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

// PUT /api/inventory/kits/[id] — update kit details + items
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, kitType, priority, items } = body

    // Delete old items and re-create (simple replace strategy)
    await prisma.hotelInventoryKitItem.deleteMany({ where: { kitId: id } })

    const kit = await prisma.hotelInventoryKit.update({
      where: { id },
      data: {
        name,
        description: description || null,
        kitType: kitType || 'ROOM',
        ...(typeof priority === 'number' ? { priority } : {}),
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

    return apiResponse(kit, 'Kit updated successfully')
  } catch (error) {
    return apiError(error)
  }
}

// DELETE /api/inventory/kits/[id] — soft delete
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.hotelInventoryKit.update({
      where: { id },
      data: { isActive: false },
    })
    return apiResponse({ id }, 'Kit deleted successfully')
  } catch (error) {
    return apiError(error)
  }
}
