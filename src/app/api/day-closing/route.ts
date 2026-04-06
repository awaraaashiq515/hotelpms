import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

const dayClosingSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  closedBy: z.string().min(1, 'Closed By internal ID is required'),
  closingDate: z.string().optional(),
  openingCash: z.number().default(0),
  cashSales: z.number().default(0),
  cashReceived: z.number().default(0),
  cashPaid: z.number().default(0),
  actualCash: z.number().min(0, 'Actual cash cannot be negative'),
  remarks: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedData = dayClosingSchema.parse(body)

    // Calculate Variance
    // Expected Cash = Opening + Sales (Cash) + Received (From dues/debtors in cash) - Paid (Cash expenses/refunds)
    const expectedCash = 
      parsedData.openingCash + 
      parsedData.cashSales + 
      parsedData.cashReceived - 
      parsedData.cashPaid

    const varianceAmount = parsedData.actualCash - expectedCash

    const dayClosing = await prisma.dayClosing.create({
      data: {
        ...parsedData,
        closingDate: parsedData.closingDate ? new Date(parsedData.closingDate) : new Date(),
        expectedCash,
        varianceAmount,
      }
    })

    return apiResponse(dayClosing, 'Day Closing completed successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return apiError(new Error('propertyId is required'), 400)
    }

    const closings = await prisma.dayClosing.findMany({
      where: { propertyId },
      orderBy: { closingDate: 'desc' },
      take: 30 // Get last 30 days
    })

    return apiResponse(closings, 'Day Closing records fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
