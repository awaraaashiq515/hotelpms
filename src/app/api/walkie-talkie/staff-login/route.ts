import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signWTToken } from '@/lib/walkie-talkie-auth'
import { encrypt, slugify } from '@/lib/session'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, propertyCode } = body

    if (!username || !password) {
      return NextResponse.json({ message: 'Username and password are required.' }, { status: 400 })
    }

    const email = `${username.toLowerCase()}@pos-staff.local`

    // Find the corresponding User in POS User table
    let posUser = await prisma.user.findFirst({
      where: { email },
      include: {
        role: true,
        property: true,
        organization: true,
      }
    })

    if (!posUser) {
      return NextResponse.json(
        { message: `Staff member "${username}" is not registered or does not have login access.` },
        { status: 404 }
      )
    }

    // If propertyCode is provided, verify staff belongs to that property
    // We log a warning on mismatch instead of blocking with a 403, allowing the client-side to self-correct/redirect
    if (propertyCode && posUser.property) {
      const propCode = posUser.property.code?.toLowerCase()
      const propName = posUser.property.name?.toLowerCase()
      const slug = slugify(posUser.property.name || '')
      const reqCode = propertyCode.toLowerCase()
      if (propCode !== reqCode && propName !== reqCode && slug !== reqCode) {
        console.warn(`[WT Staff Login] Property code mismatch: User belongs to "${propCode}" but requested "${reqCode}". Allowing login for client-side redirection.`);
      }
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, posUser.passwordHash)
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid username or password.' }, { status: 401 })
    }

    // Update WT status to online
    posUser = await prisma.user.update({
      where: { id: posUser.id },
      data: { wtStatus: 'online' },
      include: { role: true, property: true, organization: true }
    })

    // Sign Walkie-Talkie JWT token (for Socket.IO)
    const wtToken = await signWTToken(posUser.id, posUser.phone || '')

    // Build a standard session payload (same format as restaurant login)
    // so the portal can make normal API requests
    const propCode2 = posUser.property?.code || null
    const propSlug = posUser.property?.name ? slugify(posUser.property.name) : null

    const sessionData = {
      id: posUser.id,
      email: posUser.email,
      roleId: posUser.roleId,
      role: posUser.role.name,
      organizationId: posUser.organizationId,
      organizationName: (posUser as any).organization?.name ?? null,
      organizationSlug: (posUser as any).organization?.name ? slugify((posUser as any).organization.name) : null,
      propertyId: posUser.propertyId,
      propertyCode: propCode2,
      propertySlug: propSlug,
      supplierId: null,
      onboardingCompleted: posUser.onboardingCompleted,
      permissions: [],
      packageFeatures: [],
      discountPercent: 0,
      packageEndDate: null,
      subscriptionStatus: 'ACTIVE',
      isStaffPortal: true, // flag to identify staff portal sessions
    }

    const sessionToken = await encrypt(sessionData)

    // Determine cookie security
    const url = new URL(request.url)
    const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname) || url.hostname.startsWith('192.168.')
    const isSecure = process.env.NODE_ENV === 'production' && !isLocal

    // Set session cookie (staff_session to prevent colliding with manager login — 8h)
    const cookieStore = await cookies()
    cookieStore.set('staff_session', sessionToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })

    // Return token and user details (omitting sensitive password hashes)
    const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = posUser as any

    return NextResponse.json({
      wtToken,      // for Socket.IO
      user: safeUser,
    })
  } catch (error: any) {
    console.error('[WT Staff Login Route] Error:', error)
    return NextResponse.json({ message: 'Internal server error.', error: error.message }, { status: 500 })
  }
}
