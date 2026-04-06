import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

const modesSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(2, 'Type must be at least 2 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedData = modesSchema.parse(body)

    const paymentMode = await prisma.paymentMode.create({
      data: parsedData,
    })

    return apiResponse(paymentMode, 'Payment Mode created successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.propertyId) {
      return apiError(new Error('Unauthorized or no property selected'), 401);
    }

    const paymentModes = await prisma.paymentMode.findMany({
      where: { propertyId: session.propertyId },
    })

    return apiResponse(paymentModes, 'Payment Modes fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
