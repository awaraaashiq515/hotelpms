import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'

const roleSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsedData = roleSchema.parse(body)

    const role = await prisma.role.create({
      data: parsedData,
    })

    return apiResponse(role, 'Role created successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      }
    })

    return apiResponse(roles, 'Roles fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
