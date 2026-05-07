import { NextRequest, NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/2fa/verify
 * Verifies a 6-digit TOTP or backup code.
 * On success, permanently enables 2FA for the user.
 *
 * Body: { token: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const token: string = (body.token || '').trim();

    if (!token || token.length < 6) {
      return NextResponse.json({ error: 'Please provide a 6-digit OTP' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user?.twoFactorSecret) {
      return NextResponse.json({ error: '2FA not set up yet. Please call /api/auth/2fa/setup first.' }, { status: 400 });
    }

    let isValid = false;

    // 1. Try TOTP verification (Google Authenticator style)
    const totp = new OTPAuth.TOTP({
      secret: OTPAuth.Secret.fromBase32(user.twoFactorSecret),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });

    // window: 1 allows ±30 seconds clock drift
    const delta = totp.validate({ token, window: 1 });
    if (delta !== null) {
      isValid = true;
    }

    // 2. If TOTP fails, try backup codes
    if (!isValid && user.twoFactorBackupCodes) {
      const backupCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
      const upperToken = token.toUpperCase();
      if (backupCodes.includes(upperToken)) {
        isValid = true;
        // Consume the backup code (remove it from list)
        const remainingCodes = backupCodes.filter(c => c !== upperToken);
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorBackupCodes: JSON.stringify(remainingCodes) },
        });
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid OTP. Please try again.' }, { status: 400 });
    }

    // Enable 2FA permanently
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({
      success: true,
      message: '2FA successfully enabled! Your account is now protected.',
    });
  } catch (error) {
    console.error('[2FA Verify Error]', error);
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 });
  }
}

/**
 * GET /api/auth/2fa/verify
 * Returns current 2FA status for the logged-in user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { twoFactorEnabled: true, twoFactorSecret: true },
    });
    return NextResponse.json({
      success: true,
      enabled: user?.twoFactorEnabled ?? false,
      configured: !!user?.twoFactorSecret,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch 2FA status' }, { status: 500 });
  }
}
