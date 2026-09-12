import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

/**
 * POST /api/inventory/kits/seed-defaults
 * Body: { propertyId: string }
 *
 * Bulk-creates 5 industry-standard hotel kits for the property.
 * Only creates kits that do NOT already exist (checks by name).
 * Returns the newly created kits.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId } = body

    if (!propertyId) return apiError(new Error('propertyId is required'), 400)

    // Check which defaults already exist so we don't duplicate them
    const existing = await prisma.hotelInventoryKit.findMany({
      where: { propertyId, isActive: true },
      select: { name: true },
    })
    const existingNames = new Set(existing.map((k) => k.name))

    const DEFAULT_KITS: Array<{
      name: string
      description: string
      kitType: string
      priority: number
      items: { itemId: string; itemName: string; category: string; unit: string; qtyPerUse: number }[]
    }> = [
      {
        name: 'Standard Room Turnover',
        description: 'Daily room cleaning essentials for a standard double/twin room',
        kitType: 'ROOM',
        priority: 1,
        items: [
          { itemId: 'L01', itemName: 'Bath Towel (Large)',    category: 'Linen',        unit: 'Pcs',    qtyPerUse: 2 },
          { itemId: 'L03', itemName: 'Hand Towel',            category: 'Linen',        unit: 'Pcs',    qtyPerUse: 2 },
          { itemId: 'L05', itemName: 'Bed Sheet (King)',      category: 'Linen',        unit: 'Set',    qtyPerUse: 1 },
          { itemId: 'L07', itemName: 'Pillow Cover',          category: 'Linen',        unit: 'Pcs',    qtyPerUse: 2 },
          { itemId: 'T01', itemName: 'Shampoo (30ml)',        category: 'Toiletries',   unit: 'Pcs',    qtyPerUse: 1 },
          { itemId: 'T03', itemName: 'Soap Bar (30g)',        category: 'Toiletries',   unit: 'Pcs',    qtyPerUse: 1 },
          { itemId: 'T06', itemName: 'Toothbrush Kit',        category: 'Toiletries',   unit: 'Kit',    qtyPerUse: 1 },
          { itemId: 'H10', itemName: 'Toilet Paper Roll',     category: 'Housekeeping', unit: 'Roll',   qtyPerUse: 2 },
          { itemId: 'H04', itemName: 'Garbage Bags (Medium)', category: 'Housekeeping', unit: 'Roll',   qtyPerUse: 1 },
        ],
      },
      {
        name: 'Suite Turnover Kit',
        description: 'Premium full-service kit for suites and luxury rooms',
        kitType: 'SUITE',
        priority: 2,
        items: [
          { itemId: 'L01', itemName: 'Bath Towel (Large)',    category: 'Linen',        unit: 'Pcs',    qtyPerUse: 4 },
          { itemId: 'L10', itemName: 'Bath Robe',             category: 'Linen',        unit: 'Pcs',    qtyPerUse: 2 },
          { itemId: 'L08', itemName: 'Duvet Cover',           category: 'Linen',        unit: 'Set',    qtyPerUse: 1 },
          { itemId: 'T01', itemName: 'Shampoo (30ml)',        category: 'Toiletries',   unit: 'Pcs',    qtyPerUse: 2 },
          { itemId: 'T02', itemName: 'Conditioner (30ml)',    category: 'Toiletries',   unit: 'Pcs',    qtyPerUse: 2 },
          { itemId: 'T10', itemName: 'Vanity Kit',            category: 'Toiletries',   unit: 'Kit',    qtyPerUse: 2 },
          { itemId: 'T04', itemName: 'Body Lotion (30ml)',    category: 'Toiletries',   unit: 'Pcs',    qtyPerUse: 2 },
          { itemId: 'F02', itemName: 'Mineral Water 500ml',   category: 'F&B',          unit: 'Bottle', qtyPerUse: 2 },
          { itemId: 'H11', itemName: 'Tissue Box',            category: 'Housekeeping', unit: 'Box',    qtyPerUse: 1 },
        ],
      },
      {
        name: 'Guest Welcome Amenities',
        description: 'Complimentary welcome package placed in room before guest arrival',
        kitType: 'GUEST',
        priority: 3,
        items: [
          { itemId: 'F02', itemName: 'Mineral Water 500ml',  category: 'F&B', unit: 'Bottle', qtyPerUse: 2 },
          { itemId: 'F05', itemName: 'Tea Bags (Box of 100)', category: 'F&B', unit: 'Box',    qtyPerUse: 1 },
          { itemId: 'F06', itemName: 'Coffee Sachets',        category: 'F&B', unit: 'Box',    qtyPerUse: 1 },
          { itemId: 'F07', itemName: 'Sugar Sachets (Box)',   category: 'F&B', unit: 'Box',    qtyPerUse: 1 },
          { itemId: 'F08', itemName: 'Creamer Sachets (Box)', category: 'F&B', unit: 'Box',    qtyPerUse: 1 },
        ],
      },
      {
        name: 'Daily Housekeeping Service',
        description: 'Cleaning supplies used per room during daily service rounds',
        kitType: 'SERVICE',
        priority: 4,
        items: [
          { itemId: 'H01', itemName: 'Floor Cleaner',         category: 'Housekeeping', unit: 'Litre',  qtyPerUse: 0.1 },
          { itemId: 'H02', itemName: 'Toilet Cleaner',        category: 'Housekeeping', unit: 'Bottle', qtyPerUse: 0.1 },
          { itemId: 'H04', itemName: 'Garbage Bags (Medium)', category: 'Housekeeping', unit: 'Roll',   qtyPerUse: 1   },
          { itemId: 'H10', itemName: 'Toilet Paper Roll',     category: 'Housekeeping', unit: 'Roll',   qtyPerUse: 1   },
          { itemId: 'H11', itemName: 'Tissue Box',            category: 'Housekeeping', unit: 'Box',    qtyPerUse: 0.5 },
          { itemId: 'H09', itemName: 'Air Freshener (Can)',   category: 'Housekeeping', unit: 'Can',    qtyPerUse: 0.5 },
        ],
      },
      {
        name: 'Room Safety & Hygiene Check',
        description: 'Safety and sanitation supplies for each room inspection',
        kitType: 'CUSTOM',
        priority: 5,
        items: [
          { itemId: 'S01', itemName: 'Hand Sanitizer (500ml)',  category: 'Safety', unit: 'Bottle', qtyPerUse: 0.5 },
          { itemId: 'S02', itemName: 'Disinfectant Spray',      category: 'Safety', unit: 'Bottle', qtyPerUse: 0.5 },
          { itemId: 'S03', itemName: 'Disposable Gloves (Box)', category: 'Safety', unit: 'Box',    qtyPerUse: 1   },
          { itemId: 'S04', itemName: 'Face Mask (Box of 50)',   category: 'Safety', unit: 'Box',    qtyPerUse: 0.5 },
        ],
      },
    ]

    // Filter out kits that already exist by name
    const toCreate = DEFAULT_KITS.filter((k) => !existingNames.has(k.name))

    if (toCreate.length === 0) {
      return apiResponse([], 'All default kits already exist')
    }

    // Create them all
    const created = await Promise.all(
      toCreate.map((kit) =>
        prisma.hotelInventoryKit.create({
          data: {
            propertyId,
            name: kit.name,
            description: kit.description,
            kitType: kit.kitType,
            priority: kit.priority,
            items: {
              create: kit.items.map((it) => ({
                itemId: it.itemId,
                itemName: it.itemName,
                category: it.category,
                unit: it.unit,
                qtyPerUse: it.qtyPerUse,
              })),
            },
          },
          include: { items: true },
        })
      )
    )

    return apiResponse(created, `${created.length} default kits seeded successfully`, 201)
  } catch (error) {
    return apiError(error)
  }
}
