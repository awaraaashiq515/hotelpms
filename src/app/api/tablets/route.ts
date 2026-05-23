import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse, getMultiTenantWhere } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

const tabletSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  name: z.string().min(1, 'Name is required'),
  mode: z.enum(['WAITER', 'TABLE']).default('WAITER'),
  tableId: z.string().optional().nullable(),
  assignedTableIds: z.string().optional().nullable(),
  waiterId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return apiError(new Error('Unauthorized'), 401)

    const body = await request.json()
    const data = tabletSchema.parse(body)

    const tablet = await prisma.tablet.create({
      data: {
        ...data,
        tableId: data.tableId || null,
        assignedTableIds: data.assignedTableIds || null,
        waiterId: data.waiterId || null,
      }
    })

    return apiResponse(tablet, 'Tablet created successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return apiError(new Error('Unauthorized'), 401)

    const { searchParams } = new URL(request.url)
    const propertyIdParam = searchParams.get('propertyId')

    const where = getMultiTenantWhere(session, propertyIdParam)

    const tablets = await prisma.tablet.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    return apiResponse(tablets, 'Tablets fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
