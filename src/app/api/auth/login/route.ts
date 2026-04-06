import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'
import { apiError, apiResponse } from '@/lib/api-utils'
import { encrypt, SessionPayload } from '@/lib/session'
import { cookies } from 'next/headers'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // 1. Find user by email — include org package
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true }
            }
          }
        },
        organization: {
          include: {
            package: {
              include: { features: true }
            }
          }
        }
      },
    })

    if (!user || !user.isActive) {
      return apiError(new Error('Invalid credentials or account inactive'), 401)
    }

    // 2. Verify password hash
    const isValid = await comparePassword(password, user.passwordHash)

    if (!isValid) {
      return apiError(new Error('Invalid credentials or account inactive'), 401)
    }

    // 3. Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // 4. Build permissions list
    const permissions = user.role.rolePermissions.map(rp => rp.permission.module)

    // 5. Embed package data into session (Super Admin always gets all features)
    const orgPackage = user.organization?.package
    const packageFeatures = orgPackage?.features.map((f) => f.feature) ?? []
    const discountPercent = orgPackage?.discountPercent ?? 0

    const sessionData: SessionPayload = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.role.name,
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      onboardingCompleted: user.onboardingCompleted,
      permissions,
      packageFeatures,
      discountPercent,
      packageEndDate: user.organization?.packageEndDate?.toISOString() ?? null,
    }

    const token = await encrypt(sessionData)

    // 6. Set HttpOnly Cookie (8h matches JWT expiry)
    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })

    // 7. Return sanitized user
    const { passwordHash, ...safeUser } = user

    return apiResponse(
      { user: safeUser, token },
      'Logged in successfully'
    )

  } catch (error) {
    return apiError(error)
  }
}
