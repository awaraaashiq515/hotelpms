import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as OTPAuth from 'otpauth';
import { prisma } from '@/lib/prisma';
import { encrypt, SessionPayload, slugify } from '@/lib/session';
import { cookies } from 'next/headers';
import { apiError, apiResponse } from '@/lib/api-utils';

const verifySchema = z.object({
  userId: z.string(),
  token: z.string().length(6, 'Verification code must be 6 digits'),
});

/**
 * POST /api/auth/2fa/login-verify
 * Verifies 2FA token during the login process and establishes a session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token } = verifySchema.parse(body);

    // 1. Find user - include role and org data for session
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!user || !user.isActive || !user.twoFactorSecret) {
      return apiError(new Error('Invalid verification request'), 401);
    }

    // 2. Verify TOTP
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    // Validate with window of 1 (±30s)
    const delta = totp.validate({ token, window: 1 });
    
    // Check backup codes if TOTP fails
    let isValid = delta !== null;
    if (!isValid && user.twoFactorBackupCodes) {
      const backupCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
      const upperToken = token.toUpperCase();
      if (backupCodes.includes(upperToken)) {
        isValid = true;
        // Consume backup code
        const remaining = backupCodes.filter(c => c !== upperToken);
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: JSON.stringify(remaining) }
        });
      }
    }

    if (!isValid) {
      return apiError(new Error('Invalid verification code'), 401);
    }

    // 3. Verification Success — Establish Session
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Build session data (Sync with login/route.ts logic)
    const permissions = user.role.rolePermissions.map((rp: any) => rp.permission.module);
    const orgPackage = user.organization?.package;
    const packageFeatures = orgPackage?.features.map((f: any) => f.feature) ?? [];
    const discountPercent = orgPackage?.discountPercent ?? 0;

    let propertyCode = null;
    let propertySlug = null;
    let propertyType = null;
    if (user.propertyId) {
      const prop = await prisma.property.findUnique({ where: { id: user.propertyId }, select: { code: true, name: true, type: true } });
      propertyCode = prop?.code || null;
      propertySlug = prop?.name ? slugify(prop.name) : null;
      propertyType = prop?.type || null;
    } else if (user.organizationId) {
      const prop = await prisma.property.findFirst({ where: { organizationId: user.organizationId }, select: { code: true, name: true, type: true } });
      propertyCode = prop?.code || null;
      propertySlug = prop?.name ? slugify(prop.name) : null;
      propertyType = prop?.type || null;
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
      onboardingCompleted: user.onboardingCompleted,
      permissions,
      packageFeatures,
      discountPercent,
      packageEndDate: user.organization?.packageEndDate?.toISOString() ?? null,
      subscriptionStatus: user.organization?.subscriptionStatus ?? 'TRIAL',
      propertyCode,
      propertySlug,
      propertyType,
    };

    const sessionToken = await encrypt(sessionData);

    // Set HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    });

    const { passwordHash, twoFactorSecret, twoFactorBackupCodes, ...safeUser } = user;

    return apiResponse(
      { success: true, user: safeUser, token: sessionToken },
      'Verification successful'
    );

  } catch (error) {
    return apiError(error);
  }
}
