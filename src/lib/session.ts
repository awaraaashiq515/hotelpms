import { jwtVerify, SignJWT } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod'
const key = new TextEncoder().encode(secretKey)

export type SessionPayload = {
  id: string
  email: string
  roleId: string
  role: string
  organizationId: string
  propertyId: string | null
  onboardingCompleted: boolean
  permissions?: string[]
  packageFeatures?: string[]   // feature keys from the org's assigned package
  discountPercent?: number     // discount from the org's assigned package
  packageEndDate?: string | null   // subscription expiry date
  exp?: number
}


// 1 Hour expiration
export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(key)
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload
  } catch (error) {
    return null
  }
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value
  if (!session) return null
  return await decrypt(session)
}
