import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

const categorySchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  parentId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedData = categorySchema.parse(body)

    const category = await prisma.category.create({
      data: parsedData,
    })

    return apiResponse(category, 'Category created successfully', 201)
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

    const categories = await prisma.category.findMany({
      where: { propertyId },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    return apiResponse(categories, 'Categories fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
