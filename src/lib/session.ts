import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'

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
  const session = (await cookies()).get('session')?.value
  if (!session) return null
  return await decrypt(session) as SessionPayload | null
}
