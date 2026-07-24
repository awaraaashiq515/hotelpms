import admin from 'firebase-admin'
import { jwtVerify, SignJWT } from 'jose'
import { prisma } from './prisma'

const FIREBASE_MOCK_MODE = process.env.FIREBASE_MOCK_MODE === 'true'

function getKey() {
  const secretKey = process.env.JWT_SECRET || 'walkie-talkie-super-secret-key-change-in-production'
  return new TextEncoder().encode(secretKey)
}

export type WTTokenPayload = {
  userId: string
  phone: string
  exp?: number
}

/**
 * Verifies a Firebase ID token.
 * In MOCK mode, it accepts any valid phone number starting with '+' as the token itself.
 */
export async function verifyFirebaseToken(token: string): Promise<{ phone: string; name?: string } | null> {
  if (FIREBASE_MOCK_MODE || !process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log(`[Firebase Mock Auth] Verifying mock token: ${token}`);
    if (token && token.startsWith('+')) {
      return { phone: token, name: 'WT Staff Member' };
    }
    // Return default mock user if no phone matches
    return { phone: '+919999999999', name: 'WT Default Staff' };
  }

  try {
    if (!admin.apps.length) {
      const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountStr) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not defined in environment variables.');
      }
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountStr))
      });
    }
    const decodedToken = await admin.auth().verifyIdToken(token);
    const phone = decodedToken.phone_number;
    if (!phone) {
      console.error('[Firebase Auth] Token verified but has no phone_number.');
      return null;
    }
    return { phone, name: decodedToken.name || 'WT Staff Member' };
  } catch (error) {
    console.error('[Firebase Auth] Verification failed:', error);
    return null;
  }
}

/**
 * Signs a JWT token for the Walkie-Talkie user session.
 */
export async function signWTToken(userId: string, phone: string): Promise<string> {
  return await new SignJWT({ userId, phone })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // Walkie-Talkie mobile session persists for 30 days
    .sign(getKey())
}

/**
 * Verifies a JWT token for Walkie-Talkie session and returns its payload.
 */
export async function verifyWTToken(token: string): Promise<WTTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ['HS256'],
    })
    return payload as WTTokenPayload
  } catch (error) {
    return null
  }
}

/**
 * Validates WT Authorization header and returns the authenticated POS User.
 */
export async function getWTUserFromRequest(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    let token = ''
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1]
    } else {
      // Fallback: Check token in query parameters
      const url = new URL(request.url)
      token = url.searchParams.get('token') || ''
    }

    if (!token) {
      return null
    }

    const payload = await verifyWTToken(token)
    if (!payload || !payload.userId) {
      return null
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: true,
        property: true
      }
    })
    return user
  } catch (error) {
    console.error('[WT Auth Helper] Error getting user:', error)
    return null
  }
}
