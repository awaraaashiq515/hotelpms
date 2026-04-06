import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, encrypt } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // 1. Update user in DB
    await prisma.user.update({
      where: { id: session.id },
      data: { onboardingCompleted: true },
    });

    // 2. Update session cookie
    const updatedPayload = {
      ...session,
      onboardingCompleted: true,
    };

    const token = await encrypt(updatedPayload);
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return NextResponse.json({ success: true, message: 'Onboarding marked as completed' });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
