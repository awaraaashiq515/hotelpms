import { NextRequest, NextResponse } from 'next/server';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/2fa/setup
 * Generates a new TOTP secret + QR code for the logged-in user.
 * Also generates 8 backup codes.
 * Does NOT enable 2FA yet — user must verify with /api/auth/2fa/verify first.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate a new TOTP secret
    const secret = new OTPAuth.Secret({ size: 20 });

    const totp = new OTPAuth.TOTP({
      issuer: 'OrderMint POS',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret,
    });

    const otpAuthUrl = totp.toString();
    const secretBase32 = secret.base32;

    // Generate 8 backup codes (alphanumeric, 8 chars each)
    const backupCodes: string[] = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store secret + backup codes in DB (2FA not yet enabled — pending verification)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorSecret: secretBase32,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
        // twoFactorEnabled stays false until /verify is called
      },
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpAuthUrl, {
      width: 256,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    });

    return NextResponse.json({
      success: true,
      secret: secretBase32,
      qrCode: qrCodeDataUrl,
      backupCodes,
    });
  } catch (error) {
    console.error('[2FA Setup Error]', error);
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/2fa/setup
 * Disables 2FA for the logged-in user.
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });

    return NextResponse.json({ success: true, message: '2FA disabled' });
  } catch (error) {
    console.error('[2FA Disable Error]', error);
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
}
