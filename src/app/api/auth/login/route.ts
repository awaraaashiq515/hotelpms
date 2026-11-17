import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { comparePassword } from '@/lib/auth'
import { apiError, apiResponse } from '@/lib/api-utils'
import { encrypt, decrypt, SessionPayload, slugify } from '@/lib/session'
import { cookies } from 'next/headers'

const loginSchema = z.object({
  email: z.string().min(1, 'Email, Agent Code or Phone is required'),
  password: z.string().min(1, 'Password or PIN is required'),
  captchaText: z.string().optional().nullable(),
  captchaToken: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, captchaText, captchaToken } = loginSchema.parse(body)

    // 0. Verify Local Captcha
    const cookieStore = await cookies()
    let captchaCookie = cookieStore.get('captcha')?.value
    if (!captchaCookie) {
      captchaCookie = captchaToken || request.headers.get('x-captcha-token') || undefined
    }

    if (!captchaCookie) {
      return apiError(new Error('Captcha expired or not found. Please refresh.'), 400)
    }

    try {
      const decodedCaptcha = await decrypt(captchaCookie) as any
      if (!captchaText || decodedCaptcha.text !== captchaText.toLowerCase()) {
        return apiError(new Error('Invalid captcha code. Please try again.'), 400)
      }
      // Clear the captcha cookie after use
      try {
        cookieStore.delete('captcha')
      } catch (_) {}
    } catch (err) {
      return apiError(new Error('Captcha verification failed. Please refresh.'), 400)
    }

    // 1. Find user by email (if email format) — include org package
    let user = null;
    if (email.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
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
      });
    }

    let isUserValid = false;
    if (user && user.isActive) {
      isUserValid = await comparePassword(password, user.passwordHash);
    }

    // If standard User was not found or password didn't match, check TravelAgent
    if (!user || !isUserValid) {
      const cleanIdentifier = email.trim();
      const cleanCode = cleanIdentifier.toUpperCase().replace(/\s+/g, '');
      const cleanPhone = cleanIdentifier.replace(/[^0-9+]/g, '');

      const agent = await prisma.travelAgent.findFirst({
        where: {
          OR: [
            { email: { equals: cleanIdentifier.toLowerCase() } },
            { agentCode: { equals: cleanCode } },
            { agentCode: { equals: cleanCode.replace(/^AGT-?/, 'AGT-') } },
            ...(cleanPhone && cleanPhone.length >= 6 ? [{ phone: { contains: cleanPhone.slice(-10) } }] : []),
          ],
        },
        include: {
          property: { select: { id: true, name: true, city: true, phone: true, logoUrl: true } },
          hotelRelations: {
            select: { propertyId: true, commissionRate: true, isBlocked: true },
          },
          bookings: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              guestName: true,
              guestPhone: true,
              checkIn: true,
              checkOut: true,
              roomType: true,
              totalAmount: true,
              commission: true,
              commissionPaid: true,
              status: true,
              adults: true,
              children: true,
              guestEmail: true,
              guestNationality: true,
              notes: true,
              specialRequests: true,
              includePoolAccess: true,
              includeSpaPackage: true,
              poolPassCount: true,
              spaServiceType: true,
              createdAt: true,
            },
          },
        },
      });

      if (agent) {
        if (!agent.isActive || agent.agentStatus === 'REJECTED') {
          return apiError(new Error('Agent account is deactivated or suspended. Please contact the hotel.'), 403);
        }

        let isAgentPasswordValid = false;
        if (agent.passwordHash) {
          isAgentPasswordValid = await comparePassword(password, agent.passwordHash);
        }
        if (!isAgentPasswordValid && agent.pinCode && String(agent.pinCode).trim() === String(password).trim()) {
          isAgentPasswordValid = true;
        }

        if (!isAgentPasswordValid) {
          return apiError(new Error('Invalid password or PIN for travel agent account.'), 401);
        }

        // Calculate stats
        const bookings = agent.bookings || [];
        const stats = {
          totalBookings: bookings.length,
          pendingBookings: bookings.filter((b) => b.status === 'PENDING').length,
          confirmedBookings: bookings.filter((b) => b.status === 'CONFIRMED').length,
          completedBookings: bookings.filter((b) => b.status === 'COMPLETED').length,
          totalCommissionEarned: bookings.reduce((sum, b) => sum + (b.commission || 0), 0),
          commissionPaid: bookings.filter((b) => b.commissionPaid).reduce((sum, b) => sum + (b.commission || 0), 0),
          commissionPending: bookings.filter((b) => !b.commissionPaid).reduce((sum, b) => sum + (b.commission || 0), 0),
        };

        const { passwordHash: _hash, pinCode: _pin, ...safeAgent } = agent;

        const sessionData: SessionPayload = {
          id: agent.id,
          email: agent.email || `${agent.agentCode.toLowerCase()}@agent.local`,
          roleId: 'TRAVEL_AGENT',
          role: 'TRAVEL_AGENT',
          organizationId: agent.propertyId || '',
          propertyId: agent.propertyId || null,
          supplierId: null,
          onboardingCompleted: true,
          permissions: ['travel-agents'],
          packageFeatures: ['TRAVEL_AGENTS'],
        };

        const token = await encrypt(sessionData);

        const url = new URL(request.url);
        const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.') || url.hostname.startsWith('172.');
        const isSecure = process.env.NODE_ENV === 'production' && !isLocal;

        cookieStore.set('session', token, {
          httpOnly: true,
          secure: isSecure,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 8,
        });

        return apiResponse(
          {
            isAgent: true,
            redirectUrl: '/agent-portal',
            user: {
              id: agent.id,
              name: agent.name,
              email: agent.email,
              role: 'TRAVEL_AGENT',
              roleName: 'TRAVEL_AGENT',
            },
            agent: safeAgent,
            stats,
            token,
          },
          'Travel Agent signed in successfully'
        );
      }

      return apiError(new Error('Invalid credentials or account inactive'), 401);
    }

    // 2.5 Block login if Hotel features are globally disabled AND user has no registered hotel property
    const isHotelRole = user.role.name.toUpperCase().includes('HOTEL');
    if (isHotelRole) {
      const settings = await prisma.websiteSettings.findFirst();
      const hotelEnabled = settings?.hotelEnabled ?? false;

      if (!hotelEnabled) {
        // Check if this user's organization has any property — if yes, they registered properly, allow login
        const orgHasAnyProperty = user.organizationId ? await prisma.property.findFirst({
          where: { organizationId: user.organizationId }
        }) : null;

        // Only block if hotelEnabled is false AND the org has no properties at all
        if (!orgHasAnyProperty) {
          return apiError(new Error('Hotel features are currently disabled by the system administrator.'), 403);
        }
      }
    }

    // 3. Check for 2FA
    if (user.twoFactorEnabled) {
      return apiResponse(
        { twoFactorRequired: true, userId: user.id },
        'Two-factor authentication required'
      )
    }

    // 4. Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // 5. Build permissions list
    const permissions = user.role.rolePermissions.map((rp: any) => rp.permission.module)

    // 6. Embed package data into session (Super Admin always gets all features)
    const orgPackage = user.organization?.package
    const packageFeatures = orgPackage?.features.map((f: any) => f.feature) ?? []
    const discountPercent = orgPackage?.discountPercent ?? 0

    let propertyCode = null;
    let propertySlug = null;
    let propertyType = null;
    let isMultiProperty = false;
    const isHotelAdmin = user.role.name === 'HOTEL_ADMIN';

    if (user.propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: user.propertyId }, select: { code: true, name: true, type: true } });
      propertyCode = prop?.code || null;
      propertySlug = prop?.name ? slugify(prop.name) : null;
      propertyType = prop?.type || null;
    } else if (user.organizationId) {
      let prop = null;
      if (isHotelAdmin) {
        prop = await prisma.property.findFirst({
          where: { organizationId: user.organizationId, type: 'HOTEL' },
          select: { code: true, name: true, type: true },
        });
      }
      if (!prop) {
        prop = await prisma.property.findFirst({
          where: { organizationId: user.organizationId },
          select: { code: true, name: true, type: true },
        });
      }
      propertyCode = prop?.code || null;
      propertySlug = prop?.name ? slugify(prop.name) : null;
      propertyType = prop?.type || null;
    }

    // isMultiProperty = org has BOTH hotel AND restaurant properties attached together
    // Only true for BOTH (attached / ek saath), NEVER for BOTH_SEPARATE (individual logins)
    if (user.organization?.businessType === 'BOTH_SEPARATE') {
      isMultiProperty = false;
    } else if (user.organizationId && isHotelAdmin && user.propertyId) {
      const hotelPropCount = await prisma.property.count({ where: { organizationId: user.organizationId, type: 'HOTEL' } });
      const restaurantPropCount = await prisma.property.count({ where: { organizationId: user.organizationId, type: 'RESTAURANT' } });
      const restaurantAdminExists = restaurantPropCount > 0
        ? await prisma.user.findFirst({
            where: { organizationId: user.organizationId, role: { name: 'RESTAURANTS_ADMIN' } }
          })
        : null;
      if (hotelPropCount > 0 && restaurantPropCount > 0 && !restaurantAdminExists) {
        isMultiProperty = true;
      }
    } else if (user.organizationId && isHotelAdmin && !user.propertyId) {
      const propCount = await prisma.property.count({ where: { organizationId: user.organizationId } });
      isMultiProperty = propCount > 1;
    }

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
      propertyCode,
      propertySlug,
      propertyType,
      businessType: user.organization?.businessType ?? null,
      isMultiProperty,   // true = BOTH hotel + restaurant attached together
    }

    const token = await encrypt(sessionData)

    const url = new URL(request.url);
    const isLocal = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.startsWith('192.168.') || url.hostname.startsWith('10.') || url.hostname.startsWith('172.');
    const isSecure = process.env.NODE_ENV === 'production' && !isLocal;

    // 7. Set HttpOnly Cookie (8h matches JWT expiry)
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    })

    // 8. Return sanitized user
    const { passwordHash, ...safeUser } = user

    return apiResponse(
      {
        user: {
          ...safeUser,
          role: user.role.name,
          roleName: user.role.name,
          propertyCode,
          propertyType,
          propertySlug,
        },
        token
      },
      'Logged in successfully'
    )

  } catch (error) {
    return apiError(error)
  }
}
