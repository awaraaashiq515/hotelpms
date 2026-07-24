import { jwtVerify, SignJWT } from 'jose'
import { cookies, headers } from 'next/headers'

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod'
const key = new TextEncoder().encode(secretKey)

/**
 * Converts any string to a URL-safe slug.
 * Example: "Kunal's Palace & Bar" → "kunals-palace-bar"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove non-word chars (except dash)
    .replace(/[\s_]+/g, '-')    // spaces/underscores → dash
    .replace(/-+/g, '-')        // collapse multiple dashes
    .replace(/^-+|-+$/g, '')    // trim leading/trailing dashes
}

export type SessionPayload = {
  id: string
  email: string
  roleId: string
  role: string
  organizationId: string
  organizationName?: string | null  // human-readable org name
  organizationSlug?: string | null  // URL-safe slug for branded routing
  propertyId: string | null
  propertyCode?: string | null
  propertySlug?: string | null      // URL-safe slug derived from property name
  propertyType?: string | null      // Business type (HOTEL, RESTAURANT, CAFE)
  supplierId?: string | null
  onboardingCompleted: boolean
  permissions?: string[]
  packageFeatures?: string[]   // feature keys from the org's assigned package
  discountPercent?: number     // discount from the org's assigned package
  packageEndDate?: string | null   // subscription expiry date
  subscriptionStatus?: string | null // status of the subscription
  exp?: number
}


// 1 Hour expiration
export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key)
}

export async function decrypt(input: string): Promise<any | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    })
    return payload;
  } catch (error) {
    return null
  }
}

export async function getSession() {
  // Check Authorization header first (explicit Bearer token takes precedence over cookies)
  try {
    const authHeader = (await headers()).get('Authorization') || (await headers()).get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Try decrypting as standard session payload first
      const sessionPayload = await decrypt(token)
      if (sessionPayload && sessionPayload.id) {
        return sessionPayload as SessionPayload
      }

      // Fallback to walkie-talkie token format
      const { verifyWTToken } = await import('./walkie-talkie-auth')
      const wtPayload = await verifyWTToken(token)
      if (wtPayload && wtPayload.userId) {
        const { prisma } = await import('./prisma')
        const posUser = await prisma.user.findUnique({
          where: { id: wtPayload.userId },
          include: { role: true }
        })
        if (posUser) {
          return {
            id: posUser.id,
            email: posUser.email,
            roleId: posUser.roleId,
            role: posUser.role?.name || 'Staff',
            organizationId: posUser.organizationId,
            propertyId: posUser.propertyId,
            onboardingCompleted: posUser.onboardingCompleted,
          } as SessionPayload
        }
      }
    }
  } catch (err: any) {
    if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) {
      throw err;
    }
    console.error('[getSession Header Fallback Error]:', err)
  }

  let sessionCookie = (await cookies()).get('session')?.value
  if (!sessionCookie) {
    sessionCookie = (await cookies()).get('staff_session')?.value
  }

  if (sessionCookie) {
    const payload = await decrypt(sessionCookie)
    if (payload) return payload as SessionPayload
  }

  return null
}
