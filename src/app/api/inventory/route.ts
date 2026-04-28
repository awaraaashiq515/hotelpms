import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

const stockMovementSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  warehouseId: z.string().min(1, 'Warehouse ID is required'),
  stockItemId: z.string().min(1, 'Stock Item ID is required'),
  movementType: z.enum(['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT']),
  qty: z.number().min(0.01, 'Quantity must be > 0'), // positive value for both IN and OUT
  unitCost: z.number().default(0),
  referenceModule: z.string().optional(),
  referenceId: z.string().optional(),
  remarks: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedData = stockMovementSchema.parse(body)

    let qtyIn = 0
    let qtyOut = 0

    if (parsedData.movementType === 'IN') {
      qtyIn = parsedData.qty
    } else if (parsedData.movementType === 'OUT' || parsedData.movementType === 'ADJUSTMENT') {
      // NOTE: "ADJUSTMENT" usually implies a fix, we are treating negative fixes as OUT.
      // A more robust system allows positive/negative adjustments explicitly.
      qtyOut = parsedData.qty 
    }

    // Run heavily protected Stock ledger generation
    const movement = await prisma.$transaction(async (tx: any) => {
      
      // Calculate latest balance via atomic read/write protection concept in SQL 
      // (Simplified here: Reading sum of IN minus sum of OUT)
      const aggregates = await tx.stockMovement.aggregate({
        where: { stockItemId: parsedData.stockItemId, warehouseId: parsedData.warehouseId },
        _sum: {
          qtyIn: true,
          qtyOut: true,
        }
      })

      const currentBalance = (aggregates._sum.qtyIn || 0) - (aggregates._sum.qtyOut || 0)
      
      if (parsedData.movementType === 'OUT' && currentBalance < qtyOut) {
        throw new Error(`Insufficient stock. Current balance: ${currentBalance}`)
      }

      const newBalance = currentBalance + qtyIn - qtyOut

      // Record History
      const log = await tx.stockMovement.create({
        data: {
          propertyId: parsedData.propertyId,
          warehouseId: parsedData.warehouseId,
          stockItemId: parsedData.stockItemId,
          movementType: parsedData.movementType,
          qtyIn,
          qtyOut,
          balanceQty: newBalance,
          unitCost: parsedData.unitCost,
          referenceModule: parsedData.referenceModule,
          referenceId: parsedData.referenceId,
        }
      })

      return log
    })

    return apiResponse(movement, 'Stock movement recorded successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const stockItemId = searchParams.get('stockItemId')

    if (!propertyId) {
      return apiError(new Error('propertyId is required'), 400)
    }

    const movements = await prisma.stockMovement.findMany({
      where: {
        propertyId,
        ...(stockItemId ? { stockItemId } : {})
      },
      include: {
        stockItem: { select: { name: true } },
        warehouse: { select: { name: true } }
      },
      orderBy: { movementDate: 'desc' },
      take: 50 // Limit 50 latest ledger views
    })

    return apiResponse(movements, 'Stock movements fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
