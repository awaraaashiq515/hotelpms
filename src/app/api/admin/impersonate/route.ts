import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession, encrypt } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'RESTAURANTS_ADMIN')) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json();
    const { userId, action } = body;

    const cookieStore = await cookies();

    if (action === 'restore') {
      const backup = cookieStore.get('admin_session')?.value;
      if (!backup) return apiError(new Error('No active admin session found for restoration'), 400);

      cookieStore.set('session', backup, { httpOnly: true, secure: true, path: '/' });
      cookieStore.delete('admin_session');
      return apiResponse(null, 'Session restored successfully');
    }

    if (!userId) return apiError(new Error('Missing target userId'), 400);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user) return apiError(new Error('User not found'), 404);

    // Save current session to backup
    const currentToken = cookieStore.get('session')?.value;
    if (currentToken) {
      cookieStore.set('admin_session', currentToken, { httpOnly: true, secure: true, path: '/' });
    }

    // Create new session payload for target-user
    const payload = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      role: user.role.name,
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      onboardingCompleted: (user as any).onboardingCompleted,
    };

    const token = await encrypt(payload);
    cookieStore.set('session', token, { httpOnly: true, secure: true, path: '/' });

    return apiResponse(payload, `Impersonating as ${user.fullName}`);
  } catch (error) {
    return apiError(error);
  }
}
