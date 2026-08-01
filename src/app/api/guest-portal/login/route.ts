import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

const secretKey = process.env.JWT_SECRET || 'super-secret-default-key-change-it-in-prod';
const key = new TextEncoder().encode(secretKey);

export async function POST(request: NextRequest) {
  try {
    const { name, password } = await request.json();

    if (!name || !password) {
      return NextResponse.json({ success: false, message: 'Please enter your name and password.' }, { status: 400 });
    }

    const trimmedName = name.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Load all guests and match name in JavaScript (SQLite doesn't support insensitive mode)
    const allGuests = await prisma.guest.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mobile: true,
        email: true,
        guestPortalPassword: true,
      }
    });

    // Match all guests by full name (case-insensitive)
    const matchingGuests = allGuests.filter((g: any) => {
      const fullName = `${g.firstName}${g.lastName ? ' ' + g.lastName : ''}`.trim().toLowerCase();
      const firstOnly = g.firstName.trim().toLowerCase();
      return fullName === trimmedName || firstOnly === trimmedName;
    });

    if (matchingGuests.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No guest found with that name. Please enter the exact name used when booking.'
      }, { status: 401 });
    }

    // Find the matching guest whose password / mobile number matches
    let guest: any = null;
    let storedPasswordMatch = false;
    let mobileMatch = false;

    const cleanNumber = (num: string) => num.replace(/\D/g, '');
    const cleanInputPassword = cleanNumber(trimmedPassword);

    for (const g of matchingGuests) {
      const storedMatch = !!(g.guestPortalPassword && g.guestPortalPassword === trimmedPassword);
      const cleanDBMobile = g.mobile ? cleanNumber(g.mobile) : '';
      const mobMatch = cleanDBMobile.length >= 10 && cleanInputPassword.length >= 10
        ? cleanDBMobile.slice(-10) === cleanInputPassword.slice(-10)
        : !!(g.mobile && g.mobile.trim() === trimmedPassword);

      if (storedMatch || mobMatch) {
        guest = g;
        storedPasswordMatch = storedMatch;
        mobileMatch = mobMatch;
        break;
      }
    }

    if (!guest) {
      return NextResponse.json({
        success: false,
        message: 'Incorrect password. Your password is your registered mobile number.'
      }, { status: 401 });
    }

    // Auto-save portal password if not set yet
    if (!guest.guestPortalPassword && mobileMatch) {
      await prisma.guest.update({
        where: { id: guest.id },
        data: { guestPortalPassword: trimmedPassword }
      });
    }

    // Issue guest JWT token (24h)
    const token = await new SignJWT({
      guestId: guest.id,
      mobile: guest.mobile,
      type: 'GUEST_PORTAL'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(key);

    const response = NextResponse.json({
      success: true,
      token,
      guest: {
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        mobile: guest.mobile,
        email: guest.email,
      },
    });

    response.cookies.set('guest_portal_session', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24,
      path: '/',
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    console.error('[Guest Portal Login Error]:', error);
    return NextResponse.json({ success: false, message: 'Login failed. Please try again.' }, { status: 500 });
  }
}
