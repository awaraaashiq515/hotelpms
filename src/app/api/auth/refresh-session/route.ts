import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiError, apiResponse } from '@/lib/api-utils'
import { encrypt, getSession, SessionPayload, slugify } from '@/lib/session'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return apiError(new Error('Unauthorized'), 401)
    }

    // Query user and organization from DB
    const user = await prisma.user.findUnique({
      where: { id: session.id },
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
      }
    })

    if (!user) {
      return apiError(new Error('User not found'), 404)
    }

    // Build permissions list
    const permissions = user.role.rolePermissions.map((rp: any) => rp.permission.module)

    // Embed package data into session
    const orgPackage = user.organization?.package
    const packageFeatures = orgPackage?.features.map((f: any) => f.feature) ?? []
    const discountPercent = orgPackage?.discountPercent ?? 0

    const sessionData: SessionPayload = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.role.name,
      organizationId: user.organizationId,
      organizationName: user.organization?.name ?? null,
      organizationSlug: user.organization?.name ? slugify(user.organization.name) : null,
      propertyId: user.propertyId,
      supplierId: user.supplierId,
      onboardingCompleted: user.onboardingCompleted,
      permissions,
      packageFeatures,
      discountPercent,
      packageEndDate: user.organization?.packageEndDate?.toISOString() ?? null,
      subscriptionStatus: user.organization?.subscriptionStatus ?? 'TRIAL',
    }

    const token = await encrypt(sessionData)

    const cookieStore = await cookies()
    const url = new URL(request.url)
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.') || url.hostname.startsWith('172.')
    const isSecure = process.env.NODE_ENV === 'production' && !isLocal

    cookieStore.set('session', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return apiResponse({
      subscriptionStatus: user.organization?.subscriptionStatus ?? 'TRIAL',
      session: sessionData
    }, 'Session refreshed successfully')
  } catch (error) {
    return apiError(error)
  }
}
