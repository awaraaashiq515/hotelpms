import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiResponse, apiError } from '@/lib/api-utils';
import { getSession } from '@/lib/session';
import { getWTUserFromRequest } from '@/lib/walkie-talkie-auth';

/**
 * POST /api/staff-attendance/clock-out
 * Clocks out the authenticated staff user / housekeeper.
 */
export async function POST(request: NextRequest) {
  try {
    let session = await getSession();
    let staffUser: any = null;
    if (!session) {
      staffUser = await getWTUserFromRequest(request as any);
    }

    if (!session && !staffUser) {
      return apiError(new Error('Unauthorized'), 401);
    }

    const body = await request.json().catch(() => ({}));
    const userId = session?.id || staffUser?.id;
    const propertyId = session?.propertyId || staffUser?.propertyId;

    if (!userId || !propertyId) {
      return apiError(new Error('User or Property ID missing'), 400);
    }

    const staffMember = await prisma.staffMember.findFirst({
      where: { OR: [{ userId }, { id: userId }] },
    });

    const whereOr: any[] = [{ userId, clockOut: null }];
    if (staffMember) {
      whereOr.push({ staffMemberId: staffMember.id, clockOut: null });
    }

    const active = await prisma.attendance.findFirst({
      where: {
        propertyId,
        OR: whereOr,
      },
      orderBy: { clockIn: 'desc' },
    });

    if (!active) {
      return apiError(new Error('No active clock-in session found'), 400);
    }

    const locationStr = body.location || 'Hotel Premises (Auto Geofence)';

    const updated = await prisma.attendance.update({
      where: { id: active.id },
      data: {
        clockOut: new Date(),
        locationOut: locationStr,
        note: body.note || active.note,
      },
    });

    return apiResponse(
      {
        id: updated.id,
        clockOut: updated.clockOut?.toISOString(),
        status: updated.status,
      },
      'Clocked out successfully'
    );
  } catch (error) {
    return apiError(error);
  }
}
