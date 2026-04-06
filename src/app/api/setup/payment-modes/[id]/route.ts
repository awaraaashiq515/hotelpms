import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  type: z.string().min(2).optional(),
  isActive: z.boolean().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const parsedData = updateSchema.parse(body)

    const paymentMode = await prisma.paymentMode.update({
      where: { id },
      data: parsedData,
    })

    return apiResponse(paymentMode, 'Payment Mode updated successfully')
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.paymentMode.delete({
      where: { id },
    })

    return apiResponse(null, 'Payment Mode deleted successfully')
  } catch (error) {
    return apiError(error)
  }
}
