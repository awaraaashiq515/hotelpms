import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { hashPassword } from '@/lib/auth'
import { getSession } from '@/lib/session'

const userSchema = z.object({
  organizationId: z.string().optional(),
  propertyId: z.string().optional(),
  roleId: z.string().min(1, 'Role ID is required'),
  fullName: z.string().min(2, 'Full Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json()
    const { password, organizationId, propertyId, ...parsedData } = userSchema.parse(body)

    // Hash the password securely
    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        ...parsedData,
        passwordHash,
        organizationId: organizationId || session.organizationId,
        propertyId: propertyId || session.propertyId || null,
      },
    })

    // Remove the password hash before sending the response
    const { passwordHash: _, ...safeUser } = user

    return apiResponse(safeUser, 'User staff created successfully', 201)
  } catch (error) {
    return apiError(error)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.organizationId) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const users = await prisma.user.findMany({
      where: {
        organizationId: session.organizationId,
        propertyId: session.propertyId || undefined,
      },
      include: {
        role: { select: { id: true, name: true } },
        property: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
    })

    // Sanitize output
    const safeUsers = users.map(({ passwordHash, ...user }) => user)

    return apiResponse(safeUsers, 'Users fetched successfully')
  } catch (error) {
    return apiError(error)
  }
}
