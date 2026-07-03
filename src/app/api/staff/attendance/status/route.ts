import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiError, apiResponse } from '@/lib/api-utils';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';
import { getSession } from '@/lib/session';

/**
 * GET /api/staff/attendance/status
 * Supports BOTH:
 *  - Bearer WT token (mobile app)
 *  - Session cookie (web portal)
 *  - ?userId=... (legacy fallback)
 *
 * Returns: { hasActive: boolean, clockIn: string | null, attendanceId: string | null }
 */
export async function GET(request: NextRequest) {
  try {
    // 1️⃣ Try WT token (mobile Flutter app)
    const wtUser = await getWTUserFromRequest(request);

    // 2️⃣ Try session cookie (web portal)
    const session = await getSession();

    // 3️⃣ Fallback to ?userId query param (legacy)
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId');

    const userId: string | undefined =
      wtUser?.id || session?.id || queryUserId || undefined;

    if (!userId) {
      return apiError(new Error('Unauthorized – no user identity found'), 401);
    }

    const active = await prisma.attendance.findFirst({
      where: {
        userId,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    return apiResponse({
      hasActive: !!active,
      clockIn: active?.clockIn?.toISOString() ?? null,
      attendanceId: active?.id ?? null,
    });
  } catch (error) {
    return apiError(error);
  }
}
