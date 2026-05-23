import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { getSession } from '@/lib/session'

const tabletUpdateSchema = z.object({
  name: z.string().optional(),
  mode: z.enum(['WAITER', 'TABLE']).optional(),
  tableId: z.string().optional().nullable(),
  assignedTableIds: z.string().optional().nullable(),
  waiterId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const tablet = await prisma.tablet.findUnique({
      where: { id: id },
      include: { 
        property: true,
        table: true
      }
    })

    if (!tablet) return apiError(new Error('Tablet not found'), 404)

    return apiResponse(tablet, 'Tablet fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession()
    if (!session) return apiError(new Error('Unauthorized'), 401)

    const body = await request.json()
    const data = tabletUpdateSchema.parse(body)

    const tablet = await prisma.tablet.update({
      where: { id: id },
      data: {
        ...data,
        tableId: data.tableId === undefined ? undefined : (data.tableId || null),
        assignedTableIds: data.assignedTableIds === undefined ? undefined : (data.assignedTableIds || null),
        waiterId: data.waiterId === undefined ? undefined : (data.waiterId || null),
      }
    })

    return apiResponse(tablet, 'Tablet updated successfully')
  } catch (error) {
    return apiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await getSession()
    if (!session) return apiError(new Error('Unauthorized'), 401)

    await prisma.tablet.delete({
      where: { id: id }
    })

    return apiResponse(null, 'Tablet deleted successfully')
  } catch (error) {
    return apiError(error)
  }
}
