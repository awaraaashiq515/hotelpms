import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

const organizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  legalName: z.string().optional(),
  gstNumber: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  address: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedData = organizationSchema.parse(body)

    const organization = await prisma.organization.create({
      data: parsedData,
    })

    return apiResponse(organization, 'Organization created successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { properties: true, users: true }
        }
      }
    })

    return apiResponse(organizations, 'Organizations fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
